"""
MCP Tool for Flight Search Only
Searches flights from all 3 APIs (Booking.com, Amadeus, Duffel)
Includes both round-trip and one-way searches
"""
from unified_mcp import (
    search_booking_flights,
    search_amadeus_flights,
    search_duffel_flights,
    search_booking_outbound,
    search_amadeus_outbound,
    search_duffel_outbound,
    get_airport_code,
    mcp
)
from mcp_utils import filter_essential_data

@mcp.tool()
async def search_flights(
    dest_name: str,
    from_airport: str,
    to_airport: str,
    depart_date: str,
    return_date: str,
    adults: int = 1
) -> dict:
    """
    Search for flights from all providers (Booking.com, Amadeus, Duffel)
    Returns both round-trip and one-way flight options
    
    Args:
        dest_name: Destination city name
        from_airport: Origin airport IATA code (REQUIRED)
        to_airport: Destination airport IATA code
        depart_date: Departure date (YYYY-MM-DD)
        return_date: Return date (YYYY-MM-DD)
        adults: Number of adult passengers (default: 1)
    
    Returns:
        Dictionary with economy/business flights (round-trip) and oneway flights from all sources
    """
    import asyncio
    
    print(f"\n FLIGHT SEARCH: {from_airport} → {to_airport}")
    print(f"   Dates: {depart_date} to {return_date}, Adults: {adults}")
    
    # Validate origin airport
    if not from_airport:
        return {
            "error": "Origin airport (from_airport) is required",
            "economy_flights": {"amadeus": {"data": []}, "booking": {"data": []}, "duffel": {"data": {}}},
            "business_flights": {"amadeus": {"data": []}, "booking": {"data": []}, "duffel": {"data": {}}},
            "oneway_flights": {"amadeus": {"data": []}, "booking": {"data": []}, "duffel": {"data": {}}}
        }
    
    # Get proper airport codes
    proper_from_airport = get_airport_code(from_airport, for_booking=False)
    proper_to_airport = get_airport_code(to_airport or dest_name, for_booking=False)
    booking_from = get_airport_code(from_airport, for_booking=True)
    booking_to = get_airport_code(to_airport or dest_name, for_booking=True)
    
    print(f"   Airport codes: {proper_from_airport} → {proper_to_airport}")
    print(f"   Booking.com format: {booking_from} → {booking_to}")
    
    # Search all flight APIs in parallel (12 tasks total: 6 round-trip + 6 one-way)
    tasks = [
        # Round-trip Economy flights
        search_amadeus_flights(proper_from_airport, proper_to_airport, depart_date, return_date, adults, "ECONOMY"),
        search_booking_flights(booking_from, booking_to, depart_date, return_date, adults, "ECONOMY"),
        search_duffel_flights(proper_from_airport, proper_to_airport, depart_date, return_date, adults, "economy"),
        
        # Round-trip Business flights
        search_amadeus_flights(proper_from_airport, proper_to_airport, depart_date, return_date, adults, "BUSINESS"),
        search_booking_flights(booking_from, booking_to, depart_date, return_date, adults, "BUSINESS"),
        search_duffel_flights(proper_from_airport, proper_to_airport, depart_date, return_date, adults, "business"),
        
        # One-way Economy flights (outbound only)
        search_amadeus_outbound(proper_from_airport, proper_to_airport, depart_date, adults, "ECONOMY", max_results=10),
        search_booking_outbound(booking_from, booking_to, depart_date, adults, "ECONOMY"),
        search_duffel_outbound(proper_from_airport, proper_to_airport, depart_date, adults, "economy", limit=10),
        
        # One-way Business flights (outbound only)
        search_amadeus_outbound(proper_from_airport, proper_to_airport, depart_date, adults, "BUSINESS", max_results=10),
        search_booking_outbound(booking_from, booking_to, depart_date, adults, "BUSINESS"),
        search_duffel_outbound(proper_from_airport, proper_to_airport, depart_date, adults, "business", limit=10),
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    raw_data = {
        "economy_flights": {
            "amadeus": results[0] if not isinstance(results[0], Exception) else {"data": [], "error": str(results[0])},
            "booking": results[1] if not isinstance(results[1], Exception) else {"data": [], "error": str(results[1])},
            "duffel": results[2] if not isinstance(results[2], Exception) else {"data": {}, "error": str(results[2])}
        },
        "business_flights": {
            "amadeus": results[3] if not isinstance(results[3], Exception) else {"data": [], "error": str(results[3])},
            "booking": results[4] if not isinstance(results[4], Exception) else {"data": [], "error": str(results[4])},
            "duffel": results[5] if not isinstance(results[5], Exception) else {"data": {}, "error": str(results[5])}
        },
        "oneway_flights": {
            "economy": {
                "amadeus": results[6] if not isinstance(results[6], Exception) else {"data": [], "error": str(results[6])},
                "booking": results[7] if not isinstance(results[7], Exception) else {"data": [], "error": str(results[7])},
                "duffel": results[8] if not isinstance(results[8], Exception) else {"data": {}, "error": str(results[8])}
            },
            "business": {
                "amadeus": results[9] if not isinstance(results[9], Exception) else {"data": [], "error": str(results[9])},
                "booking": results[10] if not isinstance(results[10], Exception) else {"data": [], "error": str(results[10])},
                "duffel": results[11] if not isinstance(results[11], Exception) else {"data": {}, "error": str(results[11])}
            }
        }
    }
    
    # Filter and structure data before returning to LLM
    trip_params = {
        "dest_name": dest_name,
        "from_airport": from_airport,
        "to_airport": to_airport,
        "depart_date": depart_date,
        "return_date": return_date
    }
    
    return filter_essential_data(raw_data, trip_params)
