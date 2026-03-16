import json
import requests
import os
from dotenv import load_dotenv

load_dotenv()

MCP_BASE = os.getenv("MCP_JSONRPC", "http://localhost:8000/jsonrpc")

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "text/event-stream,application/json",
}

session_id = None

# Use a requests Session for connection pooling (faster repeated calls)
http_session = requests.Session()
http_session.headers.update(HEADERS)

def send_jsonrpc(method: str, params: dict, id_val: int = 1, headers_extra: dict = None):
    payload = {"jsonrpc": "2.0", "method": method, "params": params}
    if id_val is not None:
        payload["id"] = id_val
    
    headers = HEADERS.copy()
    if headers_extra:
        headers.update(headers_extra)
    
    # Timeout tuple: (connection timeout, read timeout)
    # Connection timeout: max time to establish connection (10s)
    # Read timeout: max time to wait for response after connection (60s for flight/hotel searches)
    resp = http_session.post(MCP_BASE, headers=headers, json=payload, timeout=(10, 60))
    
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

def initialize_session():
    global session_id
    if session_id:
        return session_id
    
    params = {
        "protocolVersion": "2024-11-05",
        "capabilities": {"tools": {}},
        "clientInfo": {"name": "TripPlanner", "version": "1.0"}
    }
    content, headers = send_jsonrpc("initialize", params)
    session_id = headers.get('Mcp-Session-Id')
    return session_id

def call_mcp_tool(tool_name: str, arguments: dict = None):
    global session_id
    if not session_id:
        initialize_session()
    
    params = {"name": tool_name, "arguments": arguments or {}}
    
    try:
        content, _ = send_jsonrpc("tools/call", params, 
                                 headers_extra={"Mcp-Session-Id": session_id})
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 400:
            session_id = None
            initialize_session()
            content, _ = send_jsonrpc("tools/call", params, 
                                     headers_extra={"Mcp-Session-Id": session_id})
        else:
            return {"error": f"HTTP Error: {e.response.status_code} - {e.response.text}"}
    except Exception as e:
        return {"error": f"Connection error: {str(e)}"}
    
    if 'error' in content:
        return {"error": content['error'].get('message', 'Unknown error')}
    
    result = content.get('result', {})
    print(f"[MCP_CLIENT] Got result type: {type(result)}")
    print(f"[MCP_CLIENT] Result keys: {result.keys() if isinstance(result, dict) else 'not a dict'}")
    
    tool_result = result.get('content', result)
    print(f"[MCP_CLIENT] Tool result type: {type(tool_result)}")
    
    if isinstance(tool_result, list) and len(tool_result) > 0:
        print(f"[MCP_CLIENT] Tool result is list with {len(tool_result)} items")
        if isinstance(tool_result[0], dict) and 'text' in tool_result[0]:
            text_data = tool_result[0]['text']
            print(f"[MCP_CLIENT] Found text field, length: {len(text_data)}")
            try:
                parsed = json.loads(text_data)
                print(f"[MCP_CLIENT] Successfully parsed JSON, type: {type(parsed)}")
                return parsed
            except json.JSONDecodeError as e:
                print(f"[MCP_CLIENT] JSON decode error: {str(e)}")
                return {"error": f"JSON decode error: {str(e)}", "raw": text_data[:200]}
    
    print(f"[MCP_CLIENT] Returning tool_result directly")
    return tool_result
