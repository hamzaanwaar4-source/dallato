import json
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

MCP_BASE = os.getenv("MCP_JSONRPC", "http://localhost:8001/jsonrpc")

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "text/event-stream,application/json",
}

_session_id = None
_http_client: httpx.AsyncClient = None


async def get_async_http_client():
    """Get or create async HTTP client with proper timeout configuration"""
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=10.0),
            headers=HEADERS,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
        )
    return _http_client


async def send_jsonrpc_async(method: str, params: dict, id_val: int = 1, headers_extra: dict = None):
    """Send async JSON-RPC request to MCP server"""
    payload = {"jsonrpc": "2.0", "method": method, "params": params}
    if id_val is not None:
        payload["id"] = id_val
    
    headers = HEADERS.copy()
    if headers_extra:
        headers.update(headers_extra)
    
    client = await get_async_http_client()
    
    try:
        resp = await client.post(MCP_BASE, headers=headers, json=payload)
        
        if resp.status_code not in [200, 202]:
            resp.raise_for_status()
        
        if not resp.text:
            return {"error": "Empty response from MCP server"}, resp.headers
        
        if 'event:' in resp.text or 'data:' in resp.text:
            for line in resp.text.split('\n'):
                if line.startswith('data: '):
                    try:
                        content = json.loads(line[6:])
                        return content, resp.headers
                    except json.JSONDecodeError:
                        return {"error": "Invalid JSON in SSE response"}, resp.headers
        
        try:
            content = resp.json()
        except json.JSONDecodeError:
            return {"error": "Invalid JSON response", "raw": resp.text[:200]}, resp.headers
        
        return content, resp.headers
        
    except httpx.TimeoutException as e:
        print(f"MCP TIMEOUT: Request took > 60s")
        return {"error": "MCP server timeout"}, {}
    except httpx.ConnectError as e:
        print(f"MCP CONNECTION ERROR: Cannot reach MCP server on {MCP_BASE}")
        return {"error": "MCP server unreachable"}, {}
    except Exception as e:
        print(f"MCP request error: {str(e)}")
        return {"error": f"Connection error: {str(e)}"}, {}


async def initialize_session_async():
    """Initialize MCP session asynchronously"""
    global _session_id
    if _session_id:
        return _session_id
    
    params = {
        "protocolVersion": "2024-11-05",
        "capabilities": {"tools": {}},
        "clientInfo": {"name": "TripPlanner", "version": "1.0"}
    }
    content, headers = await send_jsonrpc_async("initialize", params)
    _session_id = headers.get('Mcp-Session-Id')
    return _session_id


async def async_call_mcp_tool(tool_name: str, arguments: dict = None):
    """
    Asynchronously call MCP tool without blocking Django worker threads
    
    Args:
        tool_name: Name of the MCP tool to call
        arguments: Arguments to pass to the tool
        
    Returns:
        Tool result or error dict
    """
    global _session_id
    
    if not _session_id:
        await initialize_session_async()
    
    params = {"name": tool_name, "arguments": arguments or {}}
    
    try:
        content, _ = await send_jsonrpc_async(
            "tools/call", 
            params,
            headers_extra={"Mcp-Session-Id": _session_id}
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            _session_id = None
            await initialize_session_async()
            content, _ = await send_jsonrpc_async(
                "tools/call",
                params,
                headers_extra={"Mcp-Session-Id": _session_id}
            )
        else:
            return {"error": f"HTTP Error: {e.response.status_code} - {e.response.text}"}
    except Exception as e:
        return {"error": f"Connection error: {str(e)}"}
    
    if 'error' in content:
        return {"error": content['error'].get('message', 'Unknown error')}
    
    result = content.get('result', {})
    tool_result = result.get('content', result)
    
    if isinstance(tool_result, list) and len(tool_result) > 0:
        if isinstance(tool_result[0], dict) and 'text' in tool_result[0]:
            try:
                return json.loads(tool_result[0]['text'])
            except json.JSONDecodeError as e:
                return {"error": f"JSON decode error: {str(e)}", "raw": tool_result[0]['text'][:200]}
    
    return tool_result


async def close_async_client():
    """Close the async HTTP client (call on shutdown)"""
    global _http_client
    if _http_client:
        await _http_client.aclose()
        _http_client = None
