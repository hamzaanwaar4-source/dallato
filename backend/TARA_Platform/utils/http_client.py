import asyncio
import httpx
import logging
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

_client: Optional[httpx.AsyncClient] = None

@asynccontextmanager
async def get_async_client():
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(45.0, connect=10.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
            follow_redirects=True
        )
    try:
        yield _client
    except Exception as e:
        logger.error(f"HTTP client error: {e}")
        raise

async def close_async_client():
    global _client
    if _client:
        await _client.aclose()
        _client = None

async def fetch_with_timeout(
    url: str,
    method: str = "GET",
    params: Optional[Dict[str, Any]] = None,
    json_data: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 45.0,
    fallback: Optional[Any] = None
) -> Dict[str, Any]:
    try:
        async with asyncio.timeout(timeout + 5):
            async with get_async_client() as client:
                if method.upper() == "GET":
                    response = await client.get(url, params=params, headers=headers)
                elif method.upper() == "POST":
                    response = await client.post(url, json=json_data, params=params, headers=headers)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                response.raise_for_status()
                return response.json()
    
    except asyncio.TimeoutError:
        logger.error(f"Timeout fetching {url}")
        return fallback or {"error": "Request timeout"}
    
    except httpx.TimeoutException:
        logger.error(f"HTTPX timeout for {url}")
        return fallback or {"error": "Request timeout"}
    
    except httpx.ConnectError as e:
        logger.error(f"Connection error for {url}: {e}")
        return fallback or {"error": "Connection failed"}
    
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} for {url}")
        return fallback or {"error": f"HTTP {e.response.status_code}"}
    
    except Exception as e:
        logger.error(f"Unexpected error for {url}: {e}")
        return fallback or {"error": "Request failed"}
