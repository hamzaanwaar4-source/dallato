import asyncio
import httpx
import logging
from typing import Optional, Dict, Any
from django.conf import settings
from asgiref.sync import sync_to_async
from .models import Trip, ActivityLog

logger = logging.getLogger(__name__)

GEOAPIFY_API_KEY = getattr(settings, 'GEOAPIFY_API_KEY')
GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode/search'


class GeoapifyGeocoder:

    def __init__(self, api_key: str = GEOAPIFY_API_KEY):
        self.api_key = api_key
        self.base_url = GEOAPIFY_BASE_URL
    
    async def geocode_destination(
        self, 
        destination: str, 
        country: Optional[str] = None,
        result_type: str = 'city'
    ) -> Optional[Dict[str, Any]]:
        if not destination:
            logger.warning("No destination provided for geocoding")
            return None
        
        try:
            params = {
                'text': destination,
                'apiKey': self.api_key,
                'format': 'json',
                'limit': 1
            }
            
            if result_type:
                params['type'] = result_type
            
            if country:
                params['filter'] = f'countrycode:{country.lower()}'
            
            logger.info(f"Geocoding destination: {destination}")
            
            async with asyncio.timeout(50):
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(45.0, connect=10.0)
                ) as client:
                    response = await client.get(self.base_url, params=params)
                    response.raise_for_status()
                    data = response.json()
            
            if not data.get('results') or len(data['results']) == 0:
                logger.warning(f"No geocoding results found for: {destination}")
                return None
            
            result = data['results'][0]
            
            location_data = {
                'lat': result.get('lat'),
                'lon': result.get('lon'),
                'city': result.get('city', ''),
                'state': result.get('state', ''),
                'country': result.get('country', ''),
                'country_code': result.get('country_code', '').upper(),
                'formatted': result.get('formatted', ''),
                'address_line1': result.get('address_line1', ''),
                'address_line2': result.get('address_line2', ''),
                'result_type': result.get('result_type', ''),
                'postcode': result.get('postcode', ''),
                'confidence': result.get('rank', {}).get('confidence', 0),
                'place_id': result.get('place_id', '')
            }
            
            logger.info(f"Successfully geocoded: {location_data['formatted']}")
            return location_data
            
        except asyncio.TimeoutError:
            logger.error(f"Timeout geocoding: {destination}")
            return None
        except httpx.TimeoutException:
            logger.error(f"HTTPX timeout geocoding: {destination}")
            return None
        except httpx.ConnectError as e:
            logger.error(f"Connection error geocoding: {destination} - {e}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error geocoding: {destination} - {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error geocoding: {destination} - {e}")
            return None
    
    async def geocode_multiple_destinations(
        self, 
        destinations: list,
        country: Optional[str] = None
    ) -> Dict[str, Optional[Dict[str, Any]]]:
        tasks = [
            self.geocode_destination(destination=dest, country=country)
            for dest in destinations
        ]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)
        
        results = {}
        for dest, result in zip(destinations, results_list):
            if isinstance(result, Exception):
                logger.error(f"Error geocoding {dest}: {result}")
                results[dest] = None
            else:
                results[dest] = result
        return results
    
    async def reverse_geocode(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        try:
            url = 'https://api.geoapify.com/v1/geocode/reverse'
            params = {
                'lat': lat,
                'lon': lon,
                'apiKey': self.api_key,
                'format': 'json'
            }
            
            async with asyncio.timeout(50):
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(45.0, connect=10.0)
                ) as client:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()
            
            if not data.get('results') or len(data['results']) == 0:
                return None
            
            result = data['results'][0]
            return {
                'city': result.get('city', ''),
                'state': result.get('state', ''),
                'country': result.get('country', ''),
                'country_code': result.get('country_code', '').upper(),
                'formatted': result.get('formatted', '')
            }
            
        except Exception as e:
            logger.error(f"Reverse geocoding failed: {e}")
            return None


async def geocode_destination(destination: str, country: Optional[str] = None) -> Optional[Dict[str, Any]]:
    geocoder = GeoapifyGeocoder()
    return await geocoder.geocode_destination(destination, country)


async def geocode_trip_async(trip_id):
    
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            trip = await sync_to_async(Trip.objects.get)(id=trip_id)
            
            if not (trip.destination_city or trip.destination_country):
                logger.info(f"Trip {trip_id} has no destination data to geocode")
                return False
                
            if trip.destination_latitude is not None:
                logger.info(f"Trip {trip_id} already has coordinates")
                return True

            logger.info(f"Geocoding trip {trip_id} (Attempt {attempt+1}/{max_retries})")
            
            geocoder = GeoapifyGeocoder()
            location_data = await geocoder.geocode_destination(
                destination=trip.destination_city or trip.destination_country,
                country=None
            )
            
            if location_data:
                trip.destination_latitude = location_data['lat']
                trip.destination_longitude = location_data['lon']
                trip.destination_city = location_data['city'] or trip.destination_city
                trip.destination_country = location_data['country'] or trip.destination_country
                trip.destination_country_code = location_data.get('country_code')
                trip.destination_formatted = location_data['formatted']
                trip.geocoding_confidence = location_data.get('confidence')
                
                await sync_to_async(trip.save)(update_fields=[
                    'destination_latitude', 'destination_longitude', 
                    'destination_city', 'destination_country',
                    'destination_country_code', 'destination_formatted',
                    'geocoding_confidence'
                ])
                logger.info(f"Successfully geocoded trip {trip_id}")
                return True
            else:
                logger.warning(f"No results for trip {trip_id} on attempt {attempt+1}")
        
        except Exception as e:
            logger.error(f"Error geocoding trip {trip_id} on attempt {attempt+1}: {e}")
        
        if attempt < max_retries - 1:
            await asyncio.sleep(2 * (attempt + 1))
    
    try:
        trip = await sync_to_async(Trip.objects.get)(id=trip_id)
        agent_agency = await sync_to_async(lambda: trip.agent.agency)()
        await sync_to_async(ActivityLog.objects.create)(
            agency=agent_agency,
            agent=trip.agent,
            client=trip.client,
            table_name='TRIP',
            status_code=500,
            message=f"Failed to geocode trip '{trip.title}' after {max_retries} attempts"
        )
    except Exception as log_error:
        logger.error(f"Failed to create failure log: {log_error}")

    logger.error(f"Geocoding failed for trip {trip_id} after {max_retries} attempts")
    return False