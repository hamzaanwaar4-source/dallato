import asyncio
import httpx
from typing import Dict, Any
import os
from dotenv import load_dotenv
from fastmcp import FastMCP

load_dotenv()

# API Keys
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
DUFFEL_API_KEY = os.getenv("DUFFEL_API_KEY")
AMADEUS_API_KEY = os.getenv("AMADEUS_API_KEY")
AMADEUS_API_SECRET = os.getenv("AMADEUS_API_SECRET")

# Base URLs
RAPIDAPI_HOST = "booking-com.p.rapidapi.com"
DUFFEL_BASE = "https://api.duffel.com"
AMADEUS_BASE = "https://test.api.amadeus.com"

mcp = FastMCP("UnifiedTravelMCP")

_http_client = None
_amadeus_token = None

# Rate limiting for Amadeus (1 request per 100ms)
_last_amadeus_call = 0
AMADEUS_RATE_LIMIT = 0.1  # 100ms between calls

# ===== AIRPORT CODE MAPPING =====
AIRPORT_CODES = {
    "bali": "DPS",
    "london": "LHR",
    "new york": "JFK",
    "paris": "CDG",
    "tokyo": "NRT",
    "dubai": "DXB",
    "singapore": "SIN",
    "rome": "FCO",
    "barcelona": "BCN",
    "amsterdam": "AMS",
    "bangkok": "BKK",
    "istanbul": "IST",
    "los angeles": "LAX",
    "sydney": "SYD",
    "hong kong": "HKG",
    "central sydney": "SYD",
    "lahore": "LHE",
    "karachi": "KHI",
    "islamabad": "ISB",
    "berlin": "BER",
    "toronto": "YYZ",
    "mumbai": "BOM",
    "delhi": "DEL"
}

# City codes for Booking.com (some cities use CITY instead of AIRPORT)
CITY_CODES = {
    "new york": "NYC",
    "london": "LON",
    "paris": "PAR",
    "tokyo": "TYO",
    "los angeles": "LAX",
    "berlin": "BER"
}

def get_airport_code(dest_name: str, for_booking: bool = False) -> str:
    """
    Get proper IATA airport code from destination name
    for_booking: If True, returns CODE.AIRPORT or CODE.CITY format for Booking.com
    """
    if not dest_name:
        return ""
    
    dest_lower = dest_name.lower().strip()
    
    if len(dest_name) == 3 and dest_name.isalpha():
        code = dest_name.upper()
        if for_booking:
            # For major cities, use CITY type, otherwise AIRPORT
            if dest_lower in CITY_CODES:
                return f"{CITY_CODES[dest_lower]}.CITY"
            return f"{code}.AIRPORT"
        return code
    
    for city, code in AIRPORT_CODES.items():
        if city in dest_lower:
            if for_booking:
                # Use CITY code if available, otherwise AIRPORT
                city_code = CITY_CODES.get(city, code)
                type_suffix = "CITY" if city in CITY_CODES else "AIRPORT"
                return f"{city_code}.{type_suffix}"
            return code
    
    code = dest_name[:3].upper()
    if for_booking:
        return f"{code}.AIRPORT"
    return code

async def get_http_client():
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            # CRITICAL: Timeout increased to prevent crashes on slow flight/hotel APIs
            # Connection timeout: 5s (was 2s - too short for busy times)
            # Read timeout: 45s (was 8s - APIs can take 10-30s for searches)
            timeout=httpx.Timeout(45.0, connect=5.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
        )
    return _http_client

async def call_booking_api(path: str, params: Dict[str, Any]) -> Dict[str, Any]:
    try:
        client = await get_http_client()
        url = f"https://{RAPIDAPI_HOST}{path}"
        headers = {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY
        }
        resp = await client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        result = resp.json()
        
        if "locations" in path:
            print(f" Booking location search response type: {type(result)}")
            if isinstance(result, list):
                print(f" Found {len(result)} locations")
            elif isinstance(result, dict):
                print(f" Response keys: {result.keys()}")
        
        return result
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            print(f"Booking.com 403: API access denied")
        elif e.response.status_code == 422:
            print(f"  Booking.com 422: Invalid parameters for {path}")
            try:
                error_detail = e.response.json()
                print(f"   API Response: {error_detail}")
            except:
                print(f"   Response text: {e.response.text[:500]}")
        elif e.response.status_code == 429:
            print(f"  Booking.com 429: Rate limit exceeded, consider upgrading plan")
        else:
            print(f" Booking.com API error {e.response.status_code}: {e}")
        return {"error": str(e)}
    except httpx.TimeoutException as e:
        print(f"  Booking.com TIMEOUT: Request took > 45s")
        return {"error": "timeout", "flightOffers": []}
    except httpx.ConnectError as e:
        print(f"Booking.com CONNECTION ERROR: Cannot reach API")
        return {"error": "connection_error", "flightOffers": []}
    except Exception as e:
        print(f" Booking.com API error ({type(e).__name__}): {e}")
        print(f"   Path: {path}")
        return {"error": str(e), "flightOffers": []}

async def search_booking_flights(from_code: str, to_code: str, depart_date: str,
                                 return_date: str, adults: int, cabin_class: str) -> Dict[str, Any]:
    """
    Search flights via Booking.com
    IMPORTANT: Booking.com requires CODE.TYPE format (e.g., JFK.AIRPORT, NYC.CITY)
    """
    if not from_code or not to_code:
        print(f"  Skipping Booking flights: Missing origin ({from_code}) or destination ({to_code})")
        return {"data": [], "error": "Missing airport codes"}
    
    # Ensure codes are in the right format
    if ".AIRPORT" not in from_code and ".CITY" not in from_code:
        from_code = f"{from_code}.AIRPORT"
    if ".AIRPORT" not in to_code and ".CITY" not in to_code:
        to_code = f"{to_code}.AIRPORT"
    
    params = {
        "from_code": from_code,
        "to_code": to_code,
        "depart_date": depart_date,
        "return_date": return_date,
        "adults": adults,
        "flight_type": "ROUNDTRIP",
        "cabin_class": cabin_class,
        "currency": "USD",
        "locale": "en-gb",
        "order_by": "BEST",
        "page_number": 0
    }
    
    print(f" Booking.com flight search: {from_code} → {to_code} ({cabin_class})")
    result = await call_booking_api("/v1/flights/search", params)
    
    if isinstance(result, dict) and "data" in result:
        flight_count = len(result.get('data', []))
        print(f"  Booking.com: Got {flight_count} flight offers ({cabin_class})")
    
    return result

async def get_amadeus_token():
    global _amadeus_token
    if _amadeus_token:
        return _amadeus_token
    
    try:
        client = await get_http_client()
        resp = await client.post(
            f"{AMADEUS_BASE}/v1/security/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": AMADEUS_API_KEY,
                "client_secret": AMADEUS_API_SECRET
            }
        )
        resp.raise_for_status()
        _amadeus_token = resp.json()["access_token"]
        print(" Amadeus token obtained")
        return _amadeus_token
    except Exception as e:
        print(f" Amadeus token error: {e}")
        return None

async def call_amadeus(path: str, params: Dict[str, Any]) -> Dict[str, Any]:
    global _amadeus_token, _last_amadeus_call
    
    # Rate limiting: wait if needed
    current_time = asyncio.get_event_loop().time()
    time_since_last = current_time - _last_amadeus_call
    if time_since_last < AMADEUS_RATE_LIMIT:
        await asyncio.sleep(AMADEUS_RATE_LIMIT - time_since_last)
    
    try:
        token = await get_amadeus_token()
        if not token:
            return {"error": "Failed to get Amadeus token"}
        
        client = await get_http_client()
        url = f"{AMADEUS_BASE}{path}"
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = await client.get(url, headers=headers, params=params)
        _last_amadeus_call = asyncio.get_event_loop().time()
        
        # Retry once on 401
        if resp.status_code == 401:
            _amadeus_token = None
            token = await get_amadeus_token()
            if token:
                headers = {"Authorization": f"Bearer {token}"}
                resp = await client.get(url, headers=headers, params=params)
                _last_amadeus_call = asyncio.get_event_loop().time()
        
        if resp.status_code >= 400:
            error_text = resp.text
            if resp.status_code == 429:
                print(f"  Amadeus 429: Rate limit hit. Reduce parallel requests or move to production")
            elif resp.status_code == 500:
                print(f"  Amadeus 500: System error on Amadeus side (temporary)")
            else:
                print(f" Amadeus API error {resp.status_code}: {error_text[:500]}")
        
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        print(f" Amadeus HTTP error: {e}")
        return {"error": f"Amadeus API error: {e.response.status_code}", "data": []}
    except httpx.TimeoutException as e:
        print(f"Amadeus TIMEOUT: Request took > 45s")
        return {"error": "timeout", "data": []}
    except httpx.ConnectError as e:
        print(f"Amadeus CONNECTION ERROR: Cannot reach API")
        return {"error": "connection_error", "data": []}
    except Exception as e:
        print(f" Amadeus exception: {e}")
        return {"error": str(e), "data": []}

async def search_amadeus_flights(origin: str, destination: str, departure_date: str,
                                 return_date: str, adults: int, travel_class: str) -> Dict[str, Any]:
    """Search flights via Amadeus with validation"""
    if not origin or not destination:
        print(f"  Skipping Amadeus flights: Missing origin ({origin}) or destination ({destination})")
        return {"data": [], "error": "Missing airport codes"}
    
    params = {
        "originLocationCode": origin,
        "destinationLocationCode": destination,
        "departureDate": departure_date,
        "returnDate": return_date,
        "adults": adults,
        "travelClass": travel_class,
        "currencyCode": "USD",
        "max": 5
    }
    
    result = await call_amadeus("/v2/shopping/flight-offers", params)
    
    # Count and log results
    if isinstance(result, dict) and "data" in result:
        flight_count = len(result.get('data', []))
        print(f"  Amadeus: Got {flight_count} flight offers ({travel_class})")
    
    return result

async def search_amadeus_hotels(latitude: float, longitude: float, check_in: str,
                                check_out: str, adults: int, radius: int = 20) -> Dict[str, Any]:
    """Search hotels by GEO coordinates via Amadeus"""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "radius": radius,
        "radiusUnit": "KM",
        "hotelSource": "ALL"
    }
    
    hotels_by_city = await call_amadeus("/v1/reference-data/locations/hotels/by-geocode", params)
    
    if "error" in hotels_by_city or not hotels_by_city.get("data"):
        print(f"  Amadeus: No hotels found at ({latitude}, {longitude})")
        return {"data": []}
    
    hotel_ids = [h["hotelId"] for h in hotels_by_city.get("data", [])[:10]]
    print(f" Amadeus: Found {len(hotel_ids)} hotel IDs")
    
    if not hotel_ids:
        return {"data": []}
    
    offer_params = {
        "hotelIds": ",".join(hotel_ids),
        "checkInDate": check_in,
        "checkOutDate": check_out,
        "adults": adults,
        "roomQuantity": 1,
        "currency": "USD",
        "bestRateOnly": "true"
    }
    
    offers = await call_amadeus("/v3/shopping/hotel-offers", offer_params)
    
    if isinstance(offers, dict) and "data" in offers:
        print(f" Amadeus: Got {len(offers['data'])} hotel offers")
    return offers

async def search_amadeus_activities(latitude: float, longitude: float, radius: int = 10) -> Dict[str, Any]:
    """Search activities via Amadeus"""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "radius": radius
    }
    return await call_amadeus("/v1/shopping/activities", params)

# ===== DUFFEL API =====
async def call_duffel(method: str, path: str, data: Dict[str, Any] = None, version: str = None) -> Dict[str, Any]:
    """
    Call Duffel API with correct version
    - v2 is current for all endpoints
    """
    if version is None:
        version = "v2"
    
    print(f" Calling Duffel API: {method} {path} (version: {version})")
    
    try:
        client = await get_http_client()
        url = f"{DUFFEL_BASE}{path}"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Duffel-Version": version,
            "Authorization": f"Bearer {DUFFEL_API_KEY}",
            "Accept-Encoding": "gzip"
        }
        
        if method.upper() == "POST":
            resp = await client.post(url, headers=headers, json=data)
        else:
            resp = await client.get(url, headers=headers, params=data)
        
        if resp.status_code >= 400:
            error_text = resp.text
            print(f" Duffel API error: {resp.status_code}")
            print(f"   Response: {error_text[:500]}")
            
            if resp.status_code == 403:
                if "stays" in path.lower():
                    print(f"Duffel Stays API not enabled")
                return {"error": "Duffel API access denied - contact Duffel support", "data": []}
            elif resp.status_code == 400 and "unsupported_version" in error_text.lower():
                print(f"  Version error - check Duffel docs for current version")
                return {"error": "Unsupported API version", "data": []}
        
        resp.raise_for_status()
        result = resp.json()
        
        # Count results
        if isinstance(result.get('data'), list):
            data_count = len(result['data'])
        elif isinstance(result.get('data'), dict):
            if 'offers' in result['data']:
                data_count = len(result['data']['offers'])
            elif 'results' in result['data']:
                data_count = len(result['data']['results'])
            else:
                data_count = 'N/A'
        else:
            data_count = 'N/A'
            
        print(f" Duffel API response: {data_count} items returned")
        return result
        
    except httpx.HTTPStatusError as e:
        print(f" Duffel HTTP error: {e}")
        return {"error": f"Duffel API error: {e.response.status_code}", "data": []}
    except httpx.TimeoutException as e:
        print(f"Duffel TIMEOUT: Request took > 45s")
        return {"error": "timeout", "data": []}
    except httpx.ConnectError as e:
        print(f"Duffel CONNECTION ERROR: Cannot reach API")
        return {"error": "connection_error", "data": []}
    except Exception as e:
        print(f" Duffel exception: {e}")
        return {"error": str(e), "data": []}

async def search_duffel_flights(origin: str, destination: str, departure_date: str,
                                return_date: str, passengers: int, cabin_class: str) -> Dict[str, Any]:
    """Search flights via Duffel - uses v2"""
    if not origin or not destination:
        print(f"  Skipping Duffel flights: Missing origin ({origin}) or destination ({destination})")
        return {"data": [], "error": "Missing airport codes"}
    
    data = {
        "data": {
            "slices": [
                {
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date
                },
                {
                    "origin": destination,
                    "destination": origin,
                    "departure_date": return_date
                }
            ],
            "passengers": [{"type": "adult"} for _ in range(passengers)],
            "cabin_class": cabin_class.lower()
        }
    }
    
    result = await call_duffel("POST", "/air/offer_requests", data)
    
    # Count offers
    if isinstance(result, dict) and "data" in result:
        offers = result.get('data', {}).get('offers', [])
        print(f"  Duffel: Got {len(offers)} flight offers ({cabin_class})")
    
    return result

async def search_duffel_hotels(latitude: float, longitude: float, check_in: str,
                               check_out: str, adults: int, rooms: int = 1) -> Dict[str, Any]:
    """Search hotels via Duffel - uses v2 (requires sales approval)"""
    data = {
        "data": {
            "rooms": rooms,
            "mobile": False,
            "location": {
                "radius": 5,
                "geographic_coordinates": {
                    "longitude": longitude,
                    "latitude": latitude
                }
            },
            "guests": [{"type": "adult"} for _ in range(adults)],
            "free_cancellation_only": False,
            "check_out_date": check_out,
            "check_in_date": check_in
        }
    }
    result = await call_duffel("POST", "/stays/search", data, version="v2")
    
    if "error" in result and "not enabled" in str(result["error"]).lower():
        print("  Note: Duffel Stays requires contacting their sales team for access")
    return result

async def search_duffel_outbound(origin: str, destination: str, departure_date: str,
                                 passengers: int, cabin_class: str, limit: int = 10) -> dict:
    """
    Search Duffel for outbound-only flights with a limit on results
    """
    if not origin or not destination:
        return {"data": [], "error": "Missing airport codes"}
    
    data = {
        "data": {
            "slices": [
                {
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date
                }
            ],
            "passengers": [{"type": "adult"} for _ in range(passengers)],
            "cabin_class": cabin_class.lower()
        }
    }
    
    result = await call_duffel("POST", "/air/offer_requests", data)
    
    if isinstance(result, dict) and "data" in result:
        offers = result.get('data', {}).get('offers', [])
        result['data']['offers'] = offers[:limit]
        print(f"  Duffel: Got {len(offers[:limit])} one-way flight offers ({cabin_class})")
    
    return result

async def search_amadeus_outbound(origin: str, destination: str, departure_date: str,
                                  adults: int, travel_class: str, max_results: int = 5) -> dict:
    """
    Search Amadeus for outbound-only flights
    """
    if not origin or not destination:
        print(f"  Skipping Amadeus one-way flights: Missing origin ({origin}) or destination ({destination})")
        return {"data": [], "error": "Missing airport codes"}
    
    params = {
        "originLocationCode": origin,
        "destinationLocationCode": destination,
        "departureDate": departure_date,
        "adults": adults,
        "travelClass": travel_class,
        "currencyCode": "USD",
        "max": max_results
    }
    
    result = await call_amadeus("/v2/shopping/flight-offers", params)
    
    if isinstance(result, dict) and "data" in result:
        flight_count = len(result.get('data', []))
        print(f"  Amadeus: Got {flight_count} one-way flight offers ({travel_class})")
    
    return result

async def search_booking_outbound(from_code: str, to_code: str, depart_date: str,
                                  adults: int, cabin_class: str) -> dict:
    """
    Booking.com one-way flight search
    """
    if not from_code or not to_code:
        print(f"  Skipping Booking.com one-way flights: Missing origin ({from_code}) or destination ({to_code})")
        return {"data": [], "error": "Missing airport codes"}
    
    if ".AIRPORT" not in from_code and ".CITY" not in from_code:
        from_code = f"{from_code}.AIRPORT"
    if ".AIRPORT" not in to_code and ".CITY" not in to_code:
        to_code = f"{to_code}.AIRPORT"
    
    params = {
        "from_code": from_code,
        "to_code": to_code,
        "depart_date": depart_date,
        "adults": adults,
        "flight_type": "ONEWAY",
        "cabin_class": cabin_class,
        "currency": "USD",
        "locale": "en-gb",
        "order_by": "BEST",
        "page_number": 0
    }
    
    print(f" Booking.com one-way flight search: {from_code} → {to_code} ({cabin_class})")
    result = await call_booking_api("/v1/flights/search", params)
    
    if isinstance(result, dict) and "data" in result:
        flight_count = len(result.get('data', []))
        print(f"  Booking.com: Got {flight_count} one-way flight offers ({cabin_class})")
    
    return result

# ===== MAIN COMPREHENSIVE SEARCH TOOL =====
@mcp.tool()
async def comprehensive_trip_search(
    dest_name: str,
    from_airport: str,
    to_airport: str,
    latitude: float,
    longitude: float,
    checkin: str,
    checkout: str,
    depart_date: str,
    return_date: str,
    adults: int = 1
) -> Dict[str, Any]:
    """
    Comprehensive trip search across all APIs with proper error handling
    """
    
    print(f"\n{'='*80}")
    print(f"Starting comprehensive search: {from_airport} -> {to_airport}, {depart_date} to {return_date}")
    print(f"Destination: {dest_name} ({latitude}, {longitude})")
    print(f"{'='*80}")
    
    # Get airport codes in different formats
    # Standard IATA for Amadeus and Duffel
    from_airport_clean = get_airport_code(from_airport, for_booking=False) if from_airport else ""
    to_airport_clean = get_airport_code(to_airport if to_airport else dest_name, for_booking=False)
    
    # Booking.com format (CODE.AIRPORT or CODE.CITY)
    from_airport_booking = get_airport_code(from_airport, for_booking=True) if from_airport else ""
    to_airport_booking = get_airport_code(to_airport if to_airport else dest_name, for_booking=True)
    
    if not from_airport_clean:
        print("  WARNING: No origin airport provided - flights will be skipped")
    if not to_airport_clean:
        print("  WARNING: No destination airport code found")
    
    print(f"  IATA codes (Amadeus/Duffel): {from_airport_clean} -> {to_airport_clean}")
    print(f"  Booking.com codes: {from_airport_booking} -> {to_airport_booking}")
    
    # Get destination ID from Booking.com
    print(f"Getting destination ID for {dest_name}...")
    location_resp = await call_booking_api("/v1/hotels/locations", {
        "name": dest_name,
        "locale": "en-gb"
    })
    
    dest_id = None
    if isinstance(location_resp, list) and len(location_resp) > 0:
        dest_id = location_resp[0].get("dest_id")
        print(f" Found dest_id: {dest_id}")
    elif isinstance(location_resp, dict):
        result_list = location_resp.get("result", location_resp.get("data", []))
        if isinstance(result_list, list) and len(result_list) > 0:
            dest_id = result_list[0].get("dest_id")
            print(f" Found dest_id: {dest_id}")
    
    if not dest_id:
        print(f"  Could not get dest_id for {dest_name} - Booking.com hotels will be limited")
    
    # Build task list
    print("\n Queuing API calls...")
    
    results = []
    
    # Booking.com hotels (if we have dest_id)
    if dest_id:
        async def get_booking_hotels():
            return await call_booking_api("/v2/hotels/search", {
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
            })
        results.append(asyncio.create_task(get_booking_hotels()))
    else:
        results.append(asyncio.create_task(asyncio.sleep(0, result={"result": [], "count": 0})))
    
    # Flight searches (if we have valid airport codes)
    if from_airport_clean and to_airport_clean:
        # Amadeus flights (rate limiting handled inside call_amadeus function)
        async def amadeus_economy():
            return await search_amadeus_flights(from_airport_clean, to_airport_clean, depart_date, return_date, adults, "ECONOMY")
        
        async def amadeus_business():
            return await search_amadeus_flights(from_airport_clean, to_airport_clean, depart_date, return_date, adults, "BUSINESS")
        
        results.extend([
            asyncio.create_task(amadeus_economy()),
            asyncio.create_task(amadeus_business())
        ])
        
        # Booking.com flights (with proper CODE.TYPE format)
        if from_airport_booking and to_airport_booking:
            results.extend([
                asyncio.create_task(search_booking_flights(from_airport_booking, to_airport_booking, depart_date, return_date, adults, "ECONOMY")),
                asyncio.create_task(search_booking_flights(from_airport_booking, to_airport_booking, depart_date, return_date, adults, "BUSINESS"))
            ])
        else:
            print("  Skipping Booking.com flights - invalid format")
            for _ in range(2):
                results.append(asyncio.create_task(asyncio.sleep(0, result={"data": [], "error": "Invalid format"})))
        
        # Duffel flights
        results.extend([
            asyncio.create_task(search_duffel_flights(from_airport_clean, to_airport_clean, depart_date, return_date, adults, "economy")),
            asyncio.create_task(search_duffel_flights(from_airport_clean, to_airport_clean, depart_date, return_date, adults, "business"))
        ])
    else:
        print("  Skipping flight searches - no valid airport codes")
        for _ in range(6):
            results.append(asyncio.create_task(asyncio.sleep(0, result={"data": [], "error": "No airport codes"})))
    
    # Hotels and activities
    results.extend([
        asyncio.create_task(search_amadeus_hotels(latitude, longitude, checkin, checkout, adults)),
        asyncio.create_task(search_duffel_hotels(latitude, longitude, checkin, checkout, adults)),
        asyncio.create_task(search_amadeus_activities(latitude, longitude))
    ])
    
    print(f" Executing {len(results)} API calls...")
    completed = await asyncio.gather(*results, return_exceptions=True)
    
    # Parse results
    def safe_result(idx):
        if idx >= len(completed):
            return {"error": "Index out of range", "data": []}
        if isinstance(completed[idx], Exception):
            print(f" Task {idx} failed: {completed[idx]}")
            return {"error": str(completed[idx]), "data": []}
        return completed[idx]
    
    response = {
        "booking_data": {
            "hotels": safe_result(0)
        },
        "economy_flights": {
            "amadeus": safe_result(1),
            "booking": safe_result(3),
            "duffel": safe_result(5)
        },
        "business_flights": {
            "amadeus": safe_result(2),
            "booking": safe_result(4),
            "duffel": safe_result(6)
        },
        "hotels_all": {
            "amadeus_hotels": safe_result(7),
            "duffel_hotels": safe_result(8)
        },
        "activities": safe_result(9)
    }
    
    # Count results safely
    def safe_count(data_dict, *keys):
        """Safely count items in nested dict"""
        try:
            for key in keys:
                if isinstance(data_dict, dict):
                    data_dict = data_dict.get(key, [])
                else:
                    return 0
            return len(data_dict) if isinstance(data_dict, list) else 0
        except:
            return 0
    
    booking_hotel_count = safe_count(response["booking_data"]["hotels"], "results")
    amadeus_hotel_count = safe_count(response["hotels_all"]["amadeus_hotels"], "data")
    duffel_hotel_count = safe_count(response["hotels_all"]["duffel_hotels"], "data", "results")
    
    amadeus_economy_count = safe_count(response["economy_flights"]["amadeus"], "data")
    booking_economy_count = safe_count(response["economy_flights"]["booking"], "data")
    duffel_economy_count = safe_count(response["economy_flights"]["duffel"], "data", "offers")
    
    amadeus_business_count = safe_count(response["business_flights"]["amadeus"], "data")
    booking_business_count = safe_count(response["business_flights"]["booking"], "data")
    duffel_business_count = safe_count(response["business_flights"]["duffel"], "data", "offers")
    
    activities_count = safe_count(response["activities"], "data")
    
    print(f"\n{'='*80}")
    print(f"SEARCH RESULTS SUMMARY")
    print(f"{'='*80}")
    print(f"Hotels:")
    print(f"  - Booking.com: {booking_hotel_count}")
    print(f"  - Amadeus: {amadeus_hotel_count}")
    print(f"  - Duffel: {duffel_hotel_count}")
    print(f"  - TOTAL: {booking_hotel_count + amadeus_hotel_count + duffel_hotel_count}")
    print(f"\nEconomy Flights:")
    print(f"  - Amadeus: {amadeus_economy_count}")
    print(f"  - Booking.com: {booking_economy_count}")
    print(f"  - Duffel: {duffel_economy_count}")
    print(f"  - TOTAL: {amadeus_economy_count + booking_economy_count + duffel_economy_count}")
    print(f"\nBusiness Flights:")
    print(f"  - Amadeus: {amadeus_business_count}")
    print(f"  - Booking.com: {booking_business_count}")
    print(f"  - Duffel: {duffel_business_count}")
    print(f"  - TOTAL: {amadeus_business_count + booking_business_count + duffel_business_count}")
    print(f"\nActivities: {activities_count}")
    print(f"{'='*80}")
    
    return response

import flights_mcp, hotels_mcp, itinerary_mcp

mcp_app = mcp.http_app(path="/")