"""
MCP Tool for Itinerary Building Only
Creates day-by-day itinerary with activities
"""
from unified_mcp import call_amadeus, call_booking_api, mcp
from mcp_utils import filter_essential_data

@mcp.tool()
async def build_itinerary(
    dest_name: str,
    checkin: str,
    checkout: str
) -> dict:
    """
    Build a day-by-day itinerary with activities at the destination
    
    Args:
        dest_name: Destination city name
        checkin: Trip start date (YYYY-MM-DD)
        checkout: Trip end date (YYYY-MM-DD)
    
    Returns:
        Dictionary with activities for itinerary building
    """
    print(f"\ ITINERARY BUILDING: {dest_name}")
    print(f"   Dates: {checkin} to {checkout}")
    
    # Get destination location data from Booking.com
    print(f" Getting destination info for {dest_name}...")
    location_result = await call_booking_api("/v1/hotels/locations", {
        "name": dest_name,
        "locale": "en-gb"
    })
    
    latitude = None
    longitude = None
    
    # Parse location response to get coordinates
    if isinstance(location_result, list) and len(location_result) > 0:
        first_loc = location_result[0]
        latitude = first_loc.get("latitude")
        longitude = first_loc.get("longitude")
        print(f"Found coordinates: ({latitude}, {longitude})")
    elif isinstance(location_result, dict):
        result_list = location_result.get("result", location_result.get("data", []))
        if isinstance(result_list, list) and len(result_list) > 0:
            first_loc = result_list[0]
            latitude = first_loc.get("latitude")
            longitude = first_loc.get("longitude")
            print(f" Found coordinates: ({latitude}, {longitude})")
    
    if not latitude or not longitude:
        print(f" Could not get coordinates for {dest_name} - activities will be limited")
        return {"itinerary": {"activities": []}, "error": "Could not determine location coordinates"}
    
    # Search activities using Amadeus
    activities = await call_amadeus("/v1/shopping/activities", {
        "latitude": latitude,
        "longitude": longitude,
        "radius": 20
    })
    
    raw_data = {
        "activities": activities if not isinstance(activities, Exception) else {"data": [], "error": str(activities)}
    }
    
    # Filter and structure data before returning to LLM
    trip_params = {
        "dest_name": dest_name,
        "checkin": checkin,
        "checkout": checkout
    }
    
    return filter_essential_data(raw_data, trip_params)
