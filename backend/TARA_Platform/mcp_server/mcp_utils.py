"""
Utility functions for filtering and processing travel API data
This file contains all data transformation logic for MCP tools
"""

def filter_essential_data(result: dict, trip_params: dict = None) -> dict:
    """Extract ONLY essential fields to reduce tokens - returns structured data for LLM"""
    print("\n" + "="*80)
    print("EXTRACTING ESSENTIAL FIELDS ONLY (MCP LAYER)")
    print("="*80)
    
    simplified = {}
    
    # ===== TRIP DETAILS =====
    if trip_params:
        simplified["trip_details"] = {
            "destination": trip_params.get("dest_name"),
            "origin": trip_params.get("from_airport"),
            "destination_airport": trip_params.get("to_airport"),
            "departure_date": trip_params.get("depart_date"),
            "return_date": trip_params.get("return_date")
        }
        print(f"Trip: {simplified['trip_details'].get('origin', 'N/A')} → {simplified['trip_details'].get('destination', 'N/A')}")
    
    # ===== HOTELS - from ALL sources =====
    hotels_list = []
    
    # Booking.com hotels (limit to first 15 for speed)
    if "booking_data" in result and "hotels" in result["booking_data"]:
        booking_hotels_raw = result["booking_data"]["hotels"].get("results", [])[:15]
        print(f"Found {len(booking_hotels_raw)} Booking.com hotels (limited to 15)")
        
        booking_hotels_processed = [{
            "name": h.get("name"),
            "price_total": h.get("priceBreakdown", {}).get("grossPrice", {}).get("value") if isinstance(h.get("priceBreakdown"), dict) else None,
            "rating": h.get("reviewScore"),
            "review_count": h.get("reviewCount"),
            "star_rating": h.get("propertyClass") or h.get("accuratePropertyClass") or h.get("qualityClass"),
            "country_code": h.get("countryCode"),
            "latitude": h.get("latitude"),
            "longitude": h.get("longitude"),
            "main_photo_url": h.get("photoMainUrl"),
            "photo_urls": h.get("photoUrls", []),
            "currency": h.get("currency"),
            "review_score_word": h.get("reviewScoreWord"),
            "property_type": h.get("propertyType"),
            "checkin_time": h.get("checkin", {}).get("fromTime"),
            "checkout_time": h.get("checkout", {}).get("untilTime"),
            "room_type": h.get("proposedAccommodation"),
            "labels": h.get("additionalLabels", []),
            "source": "Booking.com"
        } for h in booking_hotels_raw]
        
        hotels_list.extend(booking_hotels_processed)
    
    # Amadeus hotels
    if "hotels_all" in result and "amadeus_hotels" in result["hotels_all"]:
        amadeus_hotels = result["hotels_all"]["amadeus_hotels"].get("data", [])
        print(f"Found {len(amadeus_hotels)} Amadeus hotels")
        
        for h in amadeus_hotels:
            if h.get("offers"):
                first_offer = h["offers"][0]
                hotels_list.append({
                    "name": h.get("hotel", {}).get("name"),
                    "price_total": first_offer.get("price", {}).get("total"),
                    "rating": h.get("hotel", {}).get("rating"),
                    "currency": first_offer.get("price", {}).get("currency"),
                    "room_type": first_offer.get("room", {}).get("typeEstimated", {}).get("category"),
                    "room_description": first_offer.get("room", {}).get("description", {}).get("text"),
                    "beds": first_offer.get("room", {}).get("typeEstimated", {}).get("beds"),
                    "cancellation_policy": first_offer.get("policies", {}).get("cancellation", {}).get("type"),
                    "chain_code": h.get("hotel", {}).get("chainCode"),
                    "city_code": h.get("hotel", {}).get("cityCode"),
                    "latitude": h.get("hotel", {}).get("latitude"),
                    "longitude": h.get("hotel", {}).get("longitude"),
                    "source": "Amadeus"
                })
    
    # Duffel hotels
    if "hotels_all" in result and "duffel_hotels" in result["hotels_all"]:
        duffel_hotels_data = result["hotels_all"]["duffel_hotels"].get("data", {})
        if isinstance(duffel_hotels_data, dict):
            duffel_hotels = duffel_hotels_data.get("results", [])
            print(f"Found {len(duffel_hotels)} Duffel hotels")
            
            hotels_list.extend([{
                "name": h.get("accommodation", {}).get("name"),
                "price_total": h.get("rates", [{}])[0].get("total_amount") if h.get("rates") else None,
                "rating": h.get("accommodation", {}).get("rating"),
                "source": "Duffel"
            } for h in duffel_hotels if h.get("rates")])
    
    simplified["bookings"] = hotels_list
    print(f"Total Hotels: {len(simplified['bookings'])}")
    
    # ===== FLIGHTS - Extract and group =====
    economy_flights = _extract_flights(result, "economy_flights")
    business_flights = _extract_flights(result, "business_flights")
    
    # Group into round-trip pairs (includes deduplication)
    economy_tickets = _group_flights(economy_flights, "economy")
    business_tickets = _group_flights(business_flights, "business")
    
    simplified["flights"] = economy_tickets + business_tickets
    print(f"Total Flights: {len(economy_tickets)} economy + {len(business_tickets)} business deduplicated round-trip tickets")
    print(f"Returning all {len(simplified['flights'])} flights to LLM")
    
    # ===== ONE-WAY FLIGHTS =====
    oneway_flights = _extract_oneway_flights(result)
    simplified["oneway_flights"] = oneway_flights
    print(f"Total One-Way Flights: {len(oneway_flights)} flights")
    
    # ===== ACTIVITIES (limit to 10 for speed) =====
    if "activities" in result:
        acts_raw = result["activities"].get("data", [])[:10]
        simplified["itinerary"] = {
            "activities": [{
                "name": a.get("name"),
                "price": a.get("price", {}).get("amount"),
                "description": a.get("shortDescription"),
                "category": a.get("type"),
                "source": "Amadeus"
            } for a in acts_raw]
        }
        print(f"Activities: {len(simplified['itinerary']['activities'])} (limited to 10)")
    else:
        simplified["itinerary"] = {}
    
    print("="*80 + "\n")
    return simplified


def _extract_flights(result: dict, flight_type: str) -> list:
    """Extract flights from all sources (Amadeus, Booking.com, Duffel)"""
    flights = []
    
    # Amadeus flights
    if flight_type in result and "amadeus" in result[flight_type]:
        amadeus_flights = result[flight_type]["amadeus"].get("data", [])
        for f in amadeus_flights:
            itineraries = f.get("itineraries", [])
            carrier = f.get("validatingAirlineCodes", [""])[0]
            total_price = f.get("price", {}).get("total")
            
            # Outbound
            if len(itineraries) > 0:
                outbound = itineraries[0]
                first_seg = outbound.get("segments", [{}])[0]
                last_seg = outbound.get("segments", [{}])[-1]
                traveler_pricing = f.get("travelerPricings", [{}])[0]
                baggage = traveler_pricing.get("fareDetailsBySegment", [{}])[0] if traveler_pricing else {}
                
                flights.append({
                    "direction": "outbound",
                    "carrier": carrier,
                    "carrier_logo": None,
                    "flight_number": first_seg.get("number"),
                    "departure": first_seg.get("departure", {}).get("at"),
                    "departure_airport": first_seg.get("departure", {}).get("iataCode"),
                    "departure_terminal": first_seg.get("departure", {}).get("terminal"),
                    "arrival": last_seg.get("arrival", {}).get("at"),
                    "arrival_airport": last_seg.get("arrival", {}).get("iataCode"),
                    "arrival_terminal": last_seg.get("arrival", {}).get("terminal"),
                    "duration": outbound.get("duration"),
                    "stops": len(outbound.get("segments", [])) - 1,
                    "aircraft": first_seg.get("aircraft", {}).get("code"),
                    "cabin": baggage.get("cabin"),
                    "baggage_included": baggage.get("includedCheckedBags", {}).get("quantity"),
                    "price": total_price,
                    "source": "Amadeus"
                })
            
            # Return
            if len(itineraries) > 1:
                return_flight = itineraries[1]
                first_seg = return_flight.get("segments", [{}])[0]
                last_seg = return_flight.get("segments", [{}])[-1]
                traveler_pricing = f.get("travelerPricings", [{}])[0]
                baggage = traveler_pricing.get("fareDetailsBySegment", [{}])[1] if traveler_pricing and len(traveler_pricing.get("fareDetailsBySegment", [])) > 1 else {}
                
                flights.append({
                    "direction": "return",
                    "carrier": carrier,
                    "carrier_logo": None,
                    "flight_number": first_seg.get("number"),
                    "departure": first_seg.get("departure", {}).get("at"),
                    "departure_airport": first_seg.get("departure", {}).get("iataCode"),
                    "departure_terminal": first_seg.get("departure", {}).get("terminal"),
                    "arrival": last_seg.get("arrival", {}).get("at"),
                    "arrival_airport": last_seg.get("arrival", {}).get("iataCode"),
                    "arrival_terminal": last_seg.get("arrival", {}).get("terminal"),
                    "duration": return_flight.get("duration"),
                    "stops": len(return_flight.get("segments", [])) - 1,
                    "aircraft": first_seg.get("aircraft", {}).get("code"),
                    "cabin": baggage.get("cabin"),
                    "baggage_included": baggage.get("includedCheckedBags", {}).get("quantity"),
                    "price": total_price,
                    "source": "Amadeus"
                })
    
    # Booking.com flights
    if flight_type in result and "booking" in result[flight_type]:
        booking_response = result[flight_type]["booking"]
        booking_flights = booking_response.get("flightOffers", [])
        
        print(f"Processing {len(booking_flights)} Booking.com flight offers")
        
        for f in booking_flights:
            segments = f.get("segments", [])
            price_breakdown = f.get("priceBreakdown", {})
            total_price = price_breakdown.get("total", {}).get("units")
            
            if segments:
                first_segment = segments[0]
                legs = first_segment.get("legs", [])
                carriers_data = first_segment.get("carriersData", [])
                
                carrier_name = "Unknown"
                carrier_logo = None
                
                if carriers_data and len(carriers_data) > 0:
                    carrier_name = carriers_data[0].get("name", "Unknown")
                    carrier_logo = carriers_data[0].get("logoUrl")
                elif legs and len(legs) > 0:
                    first_leg = legs[0]
                    flight_info = first_leg.get("flightInfo", {})
                    carrier_info = flight_info.get("carrierInfo", {})
                    
                    if carrier_info:
                        carrier_name = carrier_info.get("name", "Unknown")
                        carrier_logo = carrier_info.get("logoUrl")
                
                # Calculate total stops
                total_stops = sum(len(seg.get("legs", [])) - 1 for seg in segments)
                
                # Outbound (first segment)
                if len(segments) > 0:
                    outbound_seg = segments[0]
                    outbound_legs = outbound_seg.get("legs", [])
                    
                    if outbound_legs:
                        first_leg = outbound_legs[0]
                        last_leg = outbound_legs[-1]
                        
                        flights.append({
                            "direction": "outbound",
                            "carrier": carrier_name,
                            "carrier_logo": carrier_logo,
                            "flight_number": first_leg.get("flightInfo", {}).get("flightNumber"),
                            "departure": first_leg.get("departureTime"),
                            "departure_airport": first_leg.get("departureAirport", {}).get("code"),
                            "arrival": last_leg.get("arrivalTime"),
                            "arrival_airport": last_leg.get("arrivalAirport", {}).get("code"),
                            "duration": outbound_seg.get("totalTime"),
                            "stops": len(outbound_legs) - 1,
                            "cabin": outbound_legs[0].get("cabinClass", "").title(),
                            "price": total_price,
                            "source": "Booking.com"
                        })
                
                # Return (second segment if exists - for roundtrip)
                if len(segments) > 1:
                    return_seg = segments[1]
                    return_legs = return_seg.get("legs", [])
                    
                    if return_legs:
                        first_leg = return_legs[0]
                        last_leg = return_legs[-1]
                        
                        flights.append({
                            "direction": "return",
                            "carrier": carrier_name,
                            "carrier_logo": carrier_logo,
                            "flight_number": first_leg.get("flightInfo", {}).get("flightNumber"),
                            "departure": first_leg.get("departureTime"),
                            "departure_airport": first_leg.get("departureAirport", {}).get("code"),
                            "arrival": last_leg.get("arrivalTime"),
                            "arrival_airport": last_leg.get("arrivalAirport", {}).get("code"),
                            "duration": return_seg.get("totalTime"),
                            "stops": len(return_legs) - 1,
                            "cabin": return_legs[0].get("cabinClass", "").title(),
                            "price": total_price,
                            "source": "Booking.com"
                        })
    
    # Duffel flights
    if flight_type in result and "duffel" in result[flight_type]:
        duffel_data = result[flight_type]["duffel"].get("data", {})
        if isinstance(duffel_data, dict):
            duffel_flights = duffel_data.get("offers", [])
            for f in duffel_flights:
                slices = f.get("slices", [])
                owner_name = f.get("owner", {}).get("name")
                total_price = f.get("total_amount")
                
                if len(slices) > 0:
                    outbound = slices[0]
                    first_seg = outbound.get("segments", [{}])[0]
                    last_seg = outbound.get("segments", [{}])[-1]
                    carrier = owner_name or first_seg.get("operating_carrier", {}).get("name")
                    carrier_logo = first_seg.get("operating_carrier", {}).get("logo_symbol_url")
                    
                    aircraft = first_seg.get("aircraft") or {}
                    flights.append({
                        "direction": "outbound",
                        "carrier": carrier,
                        "carrier_logo": carrier_logo,
                        "carrier_iata": first_seg.get("operating_carrier", {}).get("iata_code"),
                        "flight_number": first_seg.get("operating_carrier_flight_number"),
                        "departure": first_seg.get("departing_at"),
                        "departure_airport": first_seg.get("origin", {}).get("iata_code"),
                        "arrival": last_seg.get("arriving_at"),
                        "arrival_airport": last_seg.get("destination", {}).get("iata_code"),
                        "duration": outbound.get("duration"),
                        "stops": len(outbound.get("segments", [])) - 1,
                        "aircraft": aircraft.get("name") if isinstance(aircraft, dict) else None,
                        "price": total_price,
                        "source": "Duffel"
                    })
                
                if len(slices) > 1:
                    return_flight = slices[1]
                    first_seg = return_flight.get("segments", [{}])[0]
                    last_seg = return_flight.get("segments", [{}])[-1]
                    carrier = owner_name or first_seg.get("operating_carrier", {}).get("name")
                    carrier_logo = first_seg.get("operating_carrier", {}).get("logo_symbol_url")
                    
                    aircraft = first_seg.get("aircraft") or {}
                    flights.append({
                        "direction": "return",
                        "carrier": carrier,
                        "carrier_logo": carrier_logo,
                        "carrier_iata": first_seg.get("operating_carrier", {}).get("iata_code"),
                        "flight_number": first_seg.get("operating_carrier_flight_number"),
                        "departure": first_seg.get("departing_at"),
                        "departure_airport": first_seg.get("origin", {}).get("iata_code"),
                        "arrival": last_seg.get("arriving_at"),
                        "arrival_airport": last_seg.get("destination", {}).get("iata_code"),
                        "duration": return_flight.get("duration"),
                        "stops": len(return_flight.get("segments", [])) - 1,
                        "aircraft": aircraft.get("name") if isinstance(aircraft, dict) else None,
                        "price": total_price,
                        "source": "Duffel"
                    })
    
    return flights


def _group_flights(flights: list, flight_class: str) -> list:
    """Group outbound and return flights into round-trip pairs"""
    # Deduplicate first
    seen = set()
    deduplicated = []
    for flight in flights:
        key = (flight.get("carrier"), flight.get("departure"), flight.get("arrival"), flight.get("duration"))
        if key not in seen:
            seen.add(key)
            deduplicated.append(flight)
    
    # Group by carrier, price, source
    outbound_map = {}
    for flight in deduplicated:
        if flight.get("direction") == "outbound":
            key = (flight.get("carrier"), flight.get("price"), flight.get("source"))
            if key not in outbound_map:
                outbound_map[key] = []
            outbound_map[key].append(flight)
    
    grouped = []
    for flight in deduplicated:
        if flight.get("direction") == "return":
            key = (flight.get("carrier"), flight.get("price"), flight.get("source"))
            if key in outbound_map and outbound_map[key]:
                outbound = outbound_map[key].pop(0)
                grouped.append({
                    "type": flight_class,
                    "carrier": flight.get("carrier"),
                    "carrier_logo": flight.get("carrier_logo"),
                    "price_per_seat": flight.get("price"),
                    "source": flight.get("source"),
                    "outbound": {
                        "departure": outbound.get("departure"),
                        "departure_airport": outbound.get("departure_airport"),
                        "departure_terminal": outbound.get("departure_terminal"),
                        "arrival": outbound.get("arrival"),
                        "arrival_airport": outbound.get("arrival_airport"),
                        "arrival_terminal": outbound.get("arrival_terminal"),
                        "duration": outbound.get("duration"),
                        "stops": outbound.get("stops"),
                        "flight_number": outbound.get("flight_number"),
                        "aircraft": outbound.get("aircraft"),
                        "cabin": outbound.get("cabin"),
                        "baggage_included": outbound.get("baggage_included")
                    },
                    "return": {
                        "departure": flight.get("departure"),
                        "departure_airport": flight.get("departure_airport"),
                        "departure_terminal": flight.get("departure_terminal"),
                        "arrival": flight.get("arrival"),
                        "arrival_airport": flight.get("arrival_airport"),
                        "arrival_terminal": flight.get("arrival_terminal"),
                        "duration": flight.get("duration"),
                        "stops": flight.get("stops"),
                        "flight_number": flight.get("flight_number"),
                        "aircraft": flight.get("aircraft"),
                        "cabin": flight.get("cabin"),
                        "baggage_included": flight.get("baggage_included")
                    }
                })
    
    return grouped


def _extract_oneway_flights(result: dict) -> list:
    """Extract one-way flights from all sources (Amadeus, Booking.com, Duffel)"""
    flights = []
    
    # Extract from oneway_flights.economy
    if "oneway_flights" in result and "economy" in result["oneway_flights"]:
        # Amadeus one-way economy
        if "amadeus" in result["oneway_flights"]["economy"]:
            amadeus_flights = result["oneway_flights"]["economy"]["amadeus"].get("data", [])
            for f in amadeus_flights:
                itineraries = f.get("itineraries", [])
                if len(itineraries) > 0:
                    outbound = itineraries[0]
                    first_seg = outbound.get("segments", [{}])[0]
                    last_seg = outbound.get("segments", [{}])[-1]
                    carrier = f.get("validatingAirlineCodes", [""])[0]
                    total_price = f.get("price", {}).get("total")
                    
                    flights.append({
                        "type": "economy",
                        "carrier": carrier,
                        "carrier_logo": None,
                        "price_per_seat": total_price,
                        "source": "Amadeus",
                        "outbound": {
                            "departure": first_seg.get("departure", {}).get("at"),
                            "departure_airport": first_seg.get("departure", {}).get("iataCode"),
                            "arrival": last_seg.get("arrival", {}).get("at"),
                            "arrival_airport": last_seg.get("arrival", {}).get("iataCode"),
                            "duration": outbound.get("duration"),
                            "stops": len(outbound.get("segments", [])) - 1,
                            "flight_number": first_seg.get("number")
                        }
                    })
        
        # Booking.com one-way economy
        if "booking" in result["oneway_flights"]["economy"]:
            booking_flights = result["oneway_flights"]["economy"]["booking"].get("flightOffers", [])
            for f in booking_flights:
                segments = f.get("segments", [])
                if segments:
                    first_segment = segments[0]
                    legs = first_segment.get("legs", [])
                    carrier_name = "Unknown"
                    carrier_logo = None
                    
                    total_price = f.get("priceBreakdown", {}).get("total", {}).get("units")
                    
                    if legs:
                        first_leg = legs[0]
                        last_leg = legs[-1]
                        
                        flights.append({
                            "type": "economy",
                            "carrier": carrier_name,
                            "carrier_logo": carrier_logo,
                            "price_per_seat": total_price,
                            "source": "Booking.com",
                            "outbound": {
                                "departure": first_leg.get("departureTime"),
                                "departure_airport": first_leg.get("departureAirport", {}).get("code"),
                                "arrival": last_leg.get("arrivalTime"),
                                "arrival_airport": last_leg.get("arrivalAirport", {}).get("code"),
                                "duration": first_segment.get("totalTime"),
                                "stops": len(legs) - 1,
                                "flight_number": first_leg.get("flightInfo", {}).get("flightNumber")
                            }
                        })
        
        # Duffel one-way economy
        if "duffel" in result["oneway_flights"]["economy"]:
            duffel_data = result["oneway_flights"]["economy"]["duffel"].get("data", {})
            if isinstance(duffel_data, dict):
                duffel_flights = duffel_data.get("offers", [])
                for f in duffel_flights:
                    slices = f.get("slices", [])
                    if slices:
                        outbound = slices[0]
                        first_seg = outbound.get("segments", [{}])[0]
                        last_seg = outbound.get("segments", [{}])[-1]
                        carrier = f.get("owner", {}).get("name") or first_seg.get("operating_carrier", {}).get("name")
                        carrier_logo = first_seg.get("operating_carrier", {}).get("logo_symbol_url")
                        
                        flights.append({
                            "type": "economy",
                            "carrier": carrier,
                            "carrier_logo": carrier_logo,
                            "price_per_seat": f.get("total_amount"),
                            "source": "Duffel",
                            "outbound": {
                                "departure": first_seg.get("departing_at"),
                                "departure_airport": first_seg.get("origin", {}).get("iata_code"),
                                "arrival": last_seg.get("arriving_at"),
                                "arrival_airport": last_seg.get("destination", {}).get("iata_code"),
                                "duration": outbound.get("duration"),
                                "stops": len(outbound.get("segments", [])) - 1,
                                "flight_number": first_seg.get("operating_carrier_flight_number")
                            }
                        })
    
    # Extract from oneway_flights.business (same logic as economy)
    if "oneway_flights" in result and "business" in result["oneway_flights"]:
        # Amadeus one-way business
        if "amadeus" in result["oneway_flights"]["business"]:
            amadeus_flights = result["oneway_flights"]["business"]["amadeus"].get("data", [])
            for f in amadeus_flights:
                itineraries = f.get("itineraries", [])
                if len(itineraries) > 0:
                    outbound = itineraries[0]
                    first_seg = outbound.get("segments", [{}])[0]
                    last_seg = outbound.get("segments", [{}])[-1]
                    carrier = f.get("validatingAirlineCodes", [""])[0]
                    total_price = f.get("price", {}).get("total")
                    
                    flights.append({
                        "type": "business",
                        "carrier": carrier,
                        "carrier_logo": None,
                        "price_per_seat": total_price,
                        "source": "Amadeus",
                        "outbound": {
                            "departure": first_seg.get("departure", {}).get("at"),
                            "departure_airport": first_seg.get

("departure", {}).get("iataCode"),
                            "arrival": last_seg.get("arrival", {}).get("at"),
                            "arrival_airport": last_seg.get("arrival", {}).get("iataCode"),
                            "duration": outbound.get("duration"),
                            "stops": len(outbound.get("segments", [])) - 1,
                            "flight_number": first_seg.get("number")
                        }
                    })
        
        # Duffel one-way business
        if "duffel" in result["oneway_flights"]["business"]:
            duffel_data = result["oneway_flights"]["business"]["duffel"].get("data", {})
            if isinstance(duffel_data, dict):
                duffel_flights = duffel_data.get("offers", [])
                for f in duffel_flights:
                    slices = f.get("slices", [])
                    if slices:
                        outbound = slices[0]
                        first_seg = outbound.get("segments", [{}])[0]
                        last_seg = outbound.get("segments", [{}])[-1]
                        carrier = f.get("owner", {}).get("name") or first_seg.get("operating_carrier", {}).get("name")
                        carrier_logo = first_seg.get("operating_carrier", {}).get("logo_symbol_url")
                        
                        flights.append({
                            "type": "business",
                            "carrier": carrier,
                            "carrier_logo": carrier_logo,
                            "price_per_seat": f.get("total_amount"),
                            "source": "Duffel",
                            "outbound": {
                                "departure": first_seg.get("departing_at"),
                                "departure_airport": first_seg.get("origin", {}).get("iata_code"),
                                "arrival": last_seg.get("arriving_at"),
                                "arrival_airport": last_seg.get("destination", {}).get("iata_code"),
                                "duration": outbound.get("duration"),
                                "stops": len(outbound.get("segments", [])) - 1,
                                "flight_number": first_seg.get("operating_carrier_flight_number")
                            }
                        })
    
    return flights
