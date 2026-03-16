import uvicorn
from unified_mcp import mcp_app

if __name__ == "__main__":
    print("Starting Unified Travel MCP Server (Booking.com + Duffel + Amadeus)...")
    print("Server running on http://localhost:8001/jsonrpc")
    uvicorn.run(mcp_app, host="0.0.0.0", port=8001)
