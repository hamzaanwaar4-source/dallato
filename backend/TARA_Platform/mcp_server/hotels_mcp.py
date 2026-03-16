"""
MCP Tool for Hotel Search Only
Searches hotels from all 3 APIs (Booking.com, Amadeus, Duffel)
"""
from unified_mcp import (
    call_booking_api,
    search_amadeus_hotels,
    search_duffel_hotels,
    get_airport_code,
    mcp
)
from mcp_utils import filter_essential_data

@mcp.tool()
async def search_hotels(
    dest_name: str,
    checkin: str,
    checkout: str,
    to_airport: str = None,
    adults: int = 1
) -> dict:
    """
    Search for hotels from all providers (Booking.com, Amadeus, Duffel)
    
    Args:
        dest_name: Destination city name
        to_airport: Destination airport code
        checkin: Check-in date (YYYY-MM-DD)
        checkout: Check-out date (YYYY-MM-DD)
        adults: Number of guests (default: 2)
    
    Returns:
        Dictionary with hotels from all sources and location data
    """
    import asyncio
    
    print(f"\n HOTEL SEARCH: {dest_name}")
    print(f"   Dates: {checkin} to {checkout}, Guests: {adults}")
    
    # Get destination location data from Booking.com
    print(f" Getting destination info for {dest_name}...")
    location_result = await call_booking_api("/v1/hotels/locations", {
        "name": dest_name,
        "locale": "en-gb"
    })
    
    dest_id = None
    latitude = None
    longitude = None
    
    # Parse location response to get dest_id and coordinates
    if isinstance(location_result, list) and len(location_result) > 0:
        first_loc = location_result[0]
        dest_id = first_loc.get("dest_id")
        latitude = first_loc.get("latitude")
        longitude = first_loc.get("longitude")
        print(f" Found dest_id: {dest_id}, Coordinates: ({latitude}, {longitude})")
    elif isinstance(location_result, dict):
        result_list = location_result.get("result", location_result.get("data", []))
        if isinstance(result_list, list) and len(result_list) > 0:
            first_loc = result_list[0]
            dest_id = first_loc.get("dest_id")
            latitude = first_loc.get("latitude")
            longitude = first_loc.get("longitude")
            print(f" Found dest_id: {dest_id}, Coordinates: ({latitude}, {longitude})")
    
    if not dest_id:
        print(f"  Could not get dest_id for {dest_name} - Booking.com hotels will be limited")
    
    # Build hotel search tasks (only if we have the required data)
    tasks = []
    
    # Booking.com hotels (if we have dest_id)
    if dest_id:
        tasks.append(call_booking_api("/v2/hotels/search", {
            "dest_id": dest_id,
            "dest_type": "city",
            "checkin_date": checkin,
            "checkout_date": checkout,
            "adults_number": adults,
            "room_number": 1,
            "filter_by_currency": "USD",
            "order_by": "price",
            "locale": "en-gb",
            "units": "metric",
            "page_number": 0,
            "include_adjacency": "true"
        }))
    else:
        # Return empty result if no dest_id
        import asyncio
        tasks.append(asyncio.sleep(0, result={"result": [], "count": 0}))
    
    # Amadeus and Duffel hotels (if we have coordinates)
    if latitude and longitude:
        tasks.append(search_amadeus_hotels(latitude, longitude, checkin, checkout, adults))
        tasks.append(search_duffel_hotels(latitude, longitude, checkin, checkout, adults))
    else:
        print(f" No coordinates available - skipping Amadeus/Duffel hotels")
        import asyncio
        tasks.append(asyncio.sleep(0, result={"data": []}))
        tasks.append(asyncio.sleep(0, result={"data": []}))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    raw_data = {
        "location": location_result if location_result else {"data": []},
        "booking_data": {
            "hotels": results[0] if not isinstance(results[0], Exception) else {"results": [], "error": str(results[0])}
        },
        "hotels_all": {
            "amadeus_hotels": results[1] if not isinstance(results[1], Exception) else {"data": [], "error": str(results[1])},
            "duffel_hotels": results[2] if not isinstance(results[2], Exception) else {"data": {}, "error": str(results[2])}
        }
    }
    
    # Filter and structure data before returning to LLM
    trip_params = {
        "dest_name": dest_name,
        "to_airport": to_airport
    }
    
    return filter_essential_data(raw_data, trip_params)
