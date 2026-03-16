import json
import os
import os
from openai import OpenAI
from dotenv import load_dotenv
from .quote_prompt import QUOTE_BUILDER_PROMPT
from .itinerary_prompt import ITINERARY_BUILDER_PROMPT
from .flights_prompt import FLIGHTS_SEARCH_PROMPT
from .hotels_prompt import HOTELS_SEARCH_PROMPT
from .travel_insights_prompt import TRAVEL_INSIGHTS_PROMPT
from .mcp_client import call_mcp_tool

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=10.0,  
    max_retries=2
)

FLIGHTS_TOOL = [
    {
        "type": "function",
        "function": {
            "name": "search_flights",
            "description": "Search for flights only from all providers (Booking.com, Amadeus, Duffel). Returns economy and business class options.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dest_name": {"type": "string", "description": "Destination city name"},
                    "from_airport": {"type": "string", "description": "Origin airport code (e.g., JFK)"},
                    "to_airport": {"type": "string", "description": "Destination airport code (e.g., LAX)"},
                    "depart_date": {"type": "string", "description": "Departure date (YYYY-MM-DD)"},
                    "return_date": {"type": "string", "description": "Return date (YYYY-MM-DD)"},
                    "adults": {"type": "integer", "description": "Number of adults (default: 2)", "default": 2}
                },
                "required": ["dest_name", "from_airport", "to_airport", "depart_date", "return_date"]
            }
        }
    }
]

HOTELS_TOOL = [
    {
        "type": "function",
        "function": {
            "name": "search_hotels",
            "description": "Search for hotels only from all providers (Booking.com, Amadeus, Duffel). Returns available accommodations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dest_name": {"type": "string", "description": "Destination city name"},
                    "to_airport": {"type": "string", "description": "Destination airport code (e.g., LAX)"},
                    "latitude": {"type": "number", "description": "Destination latitude"},
                    "longitude": {"type": "number", "description": "Destination longitude"},
                    "checkin": {"type": "string", "description": "Check-in date (YYYY-MM-DD)"},
                    "checkout": {"type": "string", "description": "Check-out date (YYYY-MM-DD)"},
                    "adults": {"type": "integer", "description": "Number of adults (default: 2)", "default": 2}
                },
                "required": ["dest_name", "to_airport", "latitude", "longitude", "checkin", "checkout"]
            }
        }
    }
]

ITINERARY_TOOL = [
    {
        "type": "function",
        "function": {
            "name": "build_itinerary",
            "description": "Build a day-by-day itinerary with activities and attractions using Amadeus activities API.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dest_name": {"type": "string", "description": "Destination city name"},
                    "latitude": {"type": "number", "description": "Destination latitude"},
                    "longitude": {"type": "number", "description": "Destination longitude"},
                    "checkin": {"type": "string", "description": "Trip start date (YYYY-MM-DD)"},
                    "checkout": {"type": "string", "description": "Trip end date (YYYY-MM-DD)"}
                },
                "required": ["dest_name", "latitude", "longitude", "checkin", "checkout"]
            }
        }
    }
]

# Data filtering is now done in MCP server (mcp_server/utils.py)

def execute_tool(tool_name: str, arguments: dict):
    """Execute MCP tool - MCP returns already filtered data"""
    print(f"\n LLM DECIDED TO CALL: {tool_name}")
    print(f" Arguments: {arguments}")
    result = call_mcp_tool(tool_name, arguments)
    
    # Debug: Print raw MCP response
    print(f"\n RAW MCP RESPONSE from {tool_name}:")
    if isinstance(result, dict):
        if 'error' in result:
            print(f"   ERROR: {result['error']}")
        else:
            # Print summary of data
            if tool_name == 'search_flights':
                flights = result.get('flights', [])
                print(f"   Total flights returned: {len(flights)}")
                if flights:
                    print(f"   First flight sample: {flights[0]}")
            elif tool_name == 'search_hotels':
                hotels = result.get('hotels', [])
                print(f"   Total hotels returned: {len(hotels)}")
                if hotels:
                    print(f"   First hotel sample: {hotels[0]}")
            else:
                print(f"   Data keys: {result.keys()}")
    else:
        print(f"   Type: {type(result)}, Value: {str(result)[:200]}")
    
    return result  # MCP tools now return filtered data


def plan_flights(user_message: str, history: list = None):
    """Flight search endpoint - LLM only has access to search_flights tool"""
    history = history or []
    
    system_prompt = FLIGHTS_SEARCH_PROMPT
    
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-5:])
    messages.append({"role": "user", "content": user_message})
    
    MAX_TURNS = 5
    current_turn = 0
    trip_details = None

    while current_turn < MAX_TURNS:
        try:
            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4.1"),
                messages=messages,
                tools=FLIGHTS_TOOL,
                tool_choice="auto",
                max_tokens=4000, 
                timeout=20
            )
            
            msg = response.choices[0].message
            
            if not msg.tool_calls:
                print(f"\n LLM FINAL RESPONSE (first 500 chars):\n{msg.content[:500] if msg.content else 'None'}")
                try:
                    content = msg.content.strip()
                    if content.startswith('```json'):
                        content = content[7:]
                    if content.startswith('```'):
                        content = content[3:]
                    if content.endswith('```'):
                        content = content[:-3]
                    content = content.strip()
                    
                    import re
                    content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
                    
                    parsed = json.loads(content)
                    print(f"\n Parsed JSON successfully - flights: {len(parsed.get('flights', []))}")
                    response_data = {
                        "role": "assistant",
                        "context": parsed.get("context", ""),
                        "flights": parsed.get("flights", []),
                        "bookings": parsed.get("bookings", []),
                        "itinerary": parsed.get("itinerary", {})
                    }
                    if trip_details:
                        response_data["trip_details"] = trip_details
                    return response_data
                except json.JSONDecodeError:
                    response_data = {
                        "role": "assistant",
                        "context": msg.content,
                        "flights": [],
                        "bookings": [],
                        "itinerary": {}
                    }
                    if trip_details:
                        response_data["trip_details"] = trip_details
                    return response_data
            
            messages.append(msg)
            
            for tc in msg.tool_calls:
                args = json.loads(tc.function.arguments or '{}')
                print(f"\n LLM CALLED: {tc.function.name}")
                print(f" Arguments: {args}")
                
                result = call_mcp_tool(tc.function.name, args)
                print(f"\n MCP TOOL RETURNED:")
                print(f"   Type: {type(result)}")
                print(f"   Keys: {result.keys() if isinstance(result, dict) else 'N/A'}")
                print(f"   Content preview: {str(result)[:500]}...")
                
                if "trip_details" in result:
                    trip_details = result["trip_details"]
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tc.function.name,
                    "content": json.dumps(result)
                })
            
            current_turn += 1
            
        except Exception as e:
            return {
                "role": "assistant",
                "context": f"Error: {str(e)}",
                "flights": [],
                "bookings": [],
                "itinerary": {}
            }

    return {
        "role": "assistant",
        "context": "Unable to complete request.",
        "flights": [],
        "bookings": [],
        "itinerary": {}
    }


def plan_hotels(user_message: str, history: list = None):
    """Hotel search endpoint - LLM only has access to search_hotels tool"""
    history = history or []
    system_prompt = HOTELS_SEARCH_PROMPT
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-5:])
    messages.append({"role": "user", "content": user_message})
    
    MAX_TURNS = 5
    current_turn = 0
    trip_details = None

    while current_turn < MAX_TURNS:
        try:
            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4.1"),
                messages=messages,
                tools=HOTELS_TOOL,
                tool_choice="auto"
            )
            
            msg = response.choices[0].message
            
            if not msg.tool_calls:
                try:
                    content = msg.content.strip()
                    if content.startswith('```json'):
                        content = content[7:]
                    if content.startswith('```'):
                        content = content[3:]
                    if content.endswith('```'):
                        content = content[:-3]
                    content = content.strip()
                    
                    parsed = json.loads(content)
                    response_data = {
                        "role": "assistant",
                        "context": parsed.get("context", ""),
                        "flights": parsed.get("flights", []),
                        "bookings": parsed.get("bookings", []),
                        "itinerary": parsed.get("itinerary", {})
                    }
                    if trip_details:
                        response_data["trip_details"] = trip_details
                    return response_data
                except json.JSONDecodeError:
                    response_data = {
                        "role": "assistant",
                        "context": msg.content,
                        "flights": [],
                        "bookings": [],
                        "itinerary": {}
                    }
                    if trip_details:
                        response_data["trip_details"] = trip_details
                    return response_data
            
            messages.append(msg)
            
            for tc in msg.tool_calls:
                args = json.loads(tc.function.arguments or '{}')
                print(f"\n LLM CALLED: {tc.function.name}")
                print(f" Arguments: {args}")
                
                result = call_mcp_tool(tc.function.name, args)
                
                if "trip_details" in result:
                    trip_details = result["trip_details"]
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tc.function.name,
                    "content": json.dumps(result)
                })
            
            current_turn += 1
            
        except Exception as e:
            return {
                "role": "assistant",
                "context": f"Error: {str(e)}",
                "flights": [],
                "bookings": [],
                "itinerary": {}
            }

    return {
        "role": "assistant",
        "context": "Unable to complete request.",
        "flights": [],
        "bookings": [],
        "itinerary": {}
    }


def plan_itinerary_service(user_message: str, history: list = None):
    """Itinerary building endpoint - LLM only has access to build_itinerary tool"""
    history = history or []
    system_prompt = ITINERARY_BUILDER_PROMPT
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-5:])
    messages.append({"role": "user", "content": user_message})
    
    MAX_TURNS = 5
    current_turn = 0
    trip_details = None

    while current_turn < MAX_TURNS:
        try:
            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4.1"),
                messages=messages,
                tools=ITINERARY_TOOL,
                tool_choice="auto"
            )
            
            msg = response.choices[0].message
            
            if not msg.tool_calls:
                try:
                    content = msg.content.strip()
                    if content.startswith('```json'):
                        content = content[7:]
                    if content.startswith('```'):
                        content = content[3:]
                    if content.endswith('```'):
                        content = content[:-3]
                    content = content.strip()
                    
                    parsed = json.loads(content)
                    response_data = {
                        "role": "assistant",
                        "context": parsed.get("context", ""),
                        "flights": parsed.get("flights", []),
                        "bookings": parsed.get("bookings", []),
                        "itinerary": parsed.get("itinerary", {})
                    }
                    if trip_details:
                        response_data["trip_details"] = trip_details
                    return response_data
                except json.JSONDecodeError:
                    response_data = {
                        "role": "assistant",
                        "context": msg.content,
                        "flights": [],
                        "bookings": [],
                        "itinerary": {}
                    }
                    if trip_details:
                        response_data["trip_details"] = trip_details
                    return response_data
            
            messages.append(msg)
            
            for tc in msg.tool_calls:
                args = json.loads(tc.function.arguments or '{}')
                print(f"\nLLM CALLED: {tc.function.name}")
                print(f" Arguments: {args}")
                
                result = call_mcp_tool(tc.function.name, args)
                
                if "trip_details" in result:
                    trip_details = result["trip_details"]
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tc.function.name,
                    "content": json.dumps(result)
                })
            
            current_turn += 1
            
        except Exception as e:
            return {
                "role": "assistant",
                "context": f"Error: {str(e)}",
                "flights": [],
                "bookings": [],
                "itinerary": {}
            }

    return {
        "role": "assistant",
        "context": "Unable to complete request.",
        "flights": [],
        "bookings": [],
        "itinerary": {}
    }


def plan_chat(user_message, history, trip_details_json=None):
    """
    Planning chatbot with JSON memory persistence.
    Shows AI the complete trip_details JSON so it knows what's already collected.
    """
    from .plan_prompt import get_plan_chatbot_prompt
    from datetime import datetime
    
    history = history or []
    
    # Initialize with ALL required fields
    if not trip_details_json:
        trip_details_json = {
            "origin": None,
            "destination": None,
            "departure_date": None,
            "return_date": None,
            "adults": None,
            "budget": None,
            "interests": None,
            "accommodation_type": None,
            "from_airport": None,
            "to_airport": None
        }
    
    # Get prompt with current memory state
    current_date = datetime.now().strftime('%Y-%m-%d')
    system_prompt = get_plan_chatbot_prompt(trip_details_json, current_date)
    
    # Build messages
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-5:])
    messages.append({"role": "user", "content": user_message})
    
    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1"),
            messages=messages,
            max_tokens=1000,
            temperature=0.5
        )
        
        msg = response.choices[0].message
        content = msg.content.strip()
        
        import re
        # Find JSN block
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                parsed = json.loads(json_str)
                
                # ENFORCE ALL 10 FIELDS - merge with existing trip_details
                trip_details_response = parsed.get("trip_details", {})
                
                # Ensure ALL fields exist (merge with previous state)
                complete_trip_details = {
                    "origin": trip_details_response.get("origin", trip_details_json.get("origin")),
                    "destination": trip_details_response.get("destination", trip_details_json.get("destination")),
                    "departure_date": trip_details_response.get("departure_date", trip_details_json.get("departure_date")),
                    "return_date": trip_details_response.get("return_date", trip_details_json.get("return_date")),
                    "adults": trip_details_response.get("adults", trip_details_json.get("adults")),
                    "budget": trip_details_response.get("budget", trip_details_json.get("budget")),
                    "interests": trip_details_response.get("interests", trip_details_json.get("interests")),
                    "accommodation_type": trip_details_response.get("accommodation_type", trip_details_json.get("accommodation_type")),
                    "from_airport": trip_details_response.get("from_airport", trip_details_json.get("from_airport")),
                    "to_airport": trip_details_response.get("to_airport", trip_details_json.get("to_airport"))
                }
                
                print(f"✓ AI response parsed successfully - all 10 fields enforced")
                print(f"  Trip details: {complete_trip_details}")
                
                return {
                    "conversational_response": parsed.get("conversational_response", content),
                    "trip_details": complete_trip_details, 
                    "api_tags": parsed.get("api_tags", []),
                    "needs_more_info": parsed.get("needs_more_info", False),
                    "follow_up_questions": parsed.get("follow_up_questions", [])
                }
            except json.JSONDecodeError as e:
                print(f"JSON Parse Error: {e}")
        
        return {
            "conversational_response": content,
            "trip_details": trip_details_json,  # Keep existing state
            "api_tags": [],
            "needs_more_info": False,
            "follow_up_questions": []
        }
        
    except Exception as e:
        print(f"Error in plan_chat: {str(e)}")
        return {
            "conversational_response": "I'm here to help plan your trip. What are you thinking?",
            "trip_details": trip_details_json,  
            "needs_more_info": True,
            "missing_fields": ["origin", "destination", "departure_date", "return_date"],
            "follow_up_questions": ["Where would you like to travel?"],
            "api_tags": []
        }


def get_travel_insights(origin: str, destination: str, departure_date: str, return_date: str):
    """
    Generate travel insights using OpenAI based on origin, destination, and dates.
    Returns 5-6 actionable insights covering visa, weather, tips, health, local info, and flights.
    """
    try:
        # Format the prompt with user data
        prompt = TRAVEL_INSIGHTS_PROMPT.format(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date
        )
        
        # Call OpenAI
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL"),
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Generate travel insights for: {origin} → {destination}, {departure_date} to {return_date}"}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        content = response.choices[0].message.content.strip()
        
        # Clean up response
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        # Parse JSON
        insights_data = json.loads(content)
        
        print(f"Generated {len(insights_data.get('insights', []))} travel insights")
        return insights_data
        
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error in travel insights: {e}")
        return {
            "insights": [
                {
                    "category": "error",
                    "title": "Unable to Generate Insights",
                    "description": "We encountered an issue generating travel insights. Please try again.",
                    "priority": "high"
                }
            ]
        }
    except Exception as e:
        print(f"Error in get_travel_insights: {str(e)}")
        return {
            "insights": [
                {
                    "category": "error",
                    "title": "Service Error",
                    "description": f"Error: {str(e)}",
                    "priority": "high"
                }
            ]
        }














# import json
# import os
# import google.genai as genai
# from google.genai import types
# from dotenv import load_dotenv
# from .quote_prompt import QUOTE_BUILDER_PROMPT
# from .itinerary_prompt import ITINERARY_BUILDER_PROMPT
# from .flights_prompt import FLIGHTS_SEARCH_PROMPT
# from .hotels_prompt import HOTELS_SEARCH_PROMPT
# from .mcp_client import call_mcp_tool

# load_dotenv()

# client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
# GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.0-flash")

# FLIGHTS_TOOL = types.Tool(
#     function_declarations=[
#         types.FunctionDeclaration(
#             name="search_flights",
#             description="Search for flights from all providers (Booking.com, Amadeus, Duffel). Returns economy and business class options.",
#             parameters=types.Schema(
#                 type=types.Type.OBJECT,
#                 properties={
#                     "dest_name": types.Schema(type=types.Type.STRING, description="Destination city name"),
#                     "from_airport": types.Schema(type=types.Type.STRING, description="Origin airport code (e.g., JFK)"),
#                     "to_airport": types.Schema(type=types.Type.STRING, description="Destination airport code (e.g., LAX)"),
#                     "depart_date": types.Schema(type=types.Type.STRING, description="Departure date (YYYY-MM-DD)"),
#                     "return_date": types.Schema(type=types.Type.STRING, description="Return date (YYYY-MM-DD)"),
#                     "adults": types.Schema(type=types.Type.INTEGER, description="Number of adults (default: 2)")
#                 },
#                 required=["dest_name", "from_airport", "to_airport", "depart_date", "return_date"]
#             )
#         )
#     ]
# )

# HOTELS_TOOL = types.Tool(
#     function_declarations=[
#         types.FunctionDeclaration(
#             name="search_hotels",
#             description="Search for hotels from all providers (Booking.com, Amadeus, Duffel). Returns available accommodations.",
#             parameters=types.Schema(
#                 type=types.Type.OBJECT,
#                 properties={
#                     "dest_name": types.Schema(type=types.Type.STRING, description="Destination city name"),
#                     "to_airport": types.Schema(type=types.Type.STRING, description="Destination airport code (e.g., LAX)"),
#                     "latitude": types.Schema(type=types.Type.NUMBER, description="Destination latitude"),
#                     "longitude": types.Schema(type=types.Type.NUMBER, description="Destination longitude"),
#                     "checkin": types.Schema(type=types.Type.STRING, description="Check-in date (YYYY-MM-DD)"),
#                     "checkout": types.Schema(type=types.Type.STRING, description="Check-out date (YYYY-MM-DD)"),
#                     "adults": types.Schema(type=types.Type.INTEGER, description="Number of adults (default: 2)")
#                 },
#                 required=["dest_name", "to_airport", "latitude", "longitude", "checkin", "checkout"]
#             )
#         )
#     ]
# )

# ITINERARY_TOOL = types.Tool(
#     function_declarations=[
#         types.FunctionDeclaration(
#             name="build_itinerary",
#             description="Build a day-by-day itinerary with activities and attractions using Amadeus activities API.",
#             parameters=types.Schema(
#                 type=types.Type.OBJECT,
#                 properties={
#                     "dest_name": types.Schema(type=types.Type.STRING, description="Destination city name"),
#                     "latitude": types.Schema(type=types.Type.NUMBER, description="Destination latitude"),
#                     "longitude": types.Schema(type=types.Type.NUMBER, description="Destination longitude"),
#                     "checkin": types.Schema(type=types.Type.STRING, description="Trip start date (YYYY-MM-DD)"),
#                     "checkout": types.Schema(type=types.Type.STRING, description="Trip end date (YYYY-MM-DD)")
#                 },
#                 required=["dest_name", "latitude", "longitude", "checkin", "checkout"]
#             )
#         )
#     ]
# )

# def plan_flights(user_message: str, history: list = None):
#     history = history or []
    
#     system_prompt = FLIGHTS_SEARCH_PROMPT
    
#     MAX_TURNS = 5
#     current_turn = 0
#     trip_details = None
    
#     messages = [types.Content(parts=[types.Part(text=system_prompt)], role="user")]
#     messages.append(types.Content(parts=[types.Part(text=user_message)], role="user"))
    
#     try:
#         while current_turn < MAX_TURNS:
#             response = client.models.generate_content(
#                 model=GEMINI_MODEL,
#                 contents=messages,
#                 config=types.GenerateContentConfig(
#                     tools=[FLIGHTS_TOOL],
#                     temperature=0.3
#                 )
#             )
            
#             if response.candidates[0].content.parts[0].function_call:
#                 function_call = response.candidates[0].content.parts[0].function_call
#                 function_name = function_call.name
#                 function_args = dict(function_call.args)
                
#                 print(f"\nGEMINI CALLED: {function_name}")
#                 print(f"Arguments: {function_args}")
                
#                 result = call_mcp_tool(function_name, function_args)
                
#                 if "trip_details" in result:
#                     trip_details = result["trip_details"]
                
#                 print(f"\nMCP TOOL RETURNED:")
#                 print(f"Keys: {result.keys() if isinstance(result, dict) else 'N/A'}")
                
#                 messages.append(response.candidates[0].content)
#                 messages.append(types.Content(
#                     parts=[types.Part(
#                         function_response=types.FunctionResponse(
#                             name=function_name,
#                             response={"result": result}
#                         )
#                     )],
#                     role="user"
#                 ))
                
#                 current_turn += 1
#             else:
#                 content = response.text
#                 print(f"\nGEMINI FINAL RESPONSE (first 500 chars):\n{content[:500]}")
                
#                 try:
#                     if content.startswith('```json'):
#                         content = content[7:]
#                     if content.startswith('```'):
#                         content = content[3:]
#                     if content.endswith('```'):
#                         content = content[:-3]
#                     content = content.strip()
                    
#                     import re
#                     content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
                    
#                     parsed = json.loads(content)
#                     response_data = {
#                         "role": "assistant",
#                         "context": parsed.get("context", ""),
#                         "flights": parsed.get("flights", []),
#                         "bookings": parsed.get("bookings", []),
#                         "itinerary": parsed.get("itinerary", {})
#                     }
#                     if trip_details:
#                         response_data["trip_details"] = trip_details
#                     return response_data
                    
#                 except json.JSONDecodeError:
#                     response_data = {
#                         "role": "assistant",
#                         "context": content,
#                         "flights": [],
#                         "bookings": [],
#                         "itinerary": {}
#                     }
#                     if trip_details:
#                         response_data["trip_details"] = trip_details
#                     return response_data
                
#                 break
    
#     except Exception as e:
#         print(f"Error in plan_flights: {str(e)}")
#         return {
#             "role": "assistant",
#             "context": f"Error: {str(e)}",
#             "flights": [],
#             "bookings": [],
#             "itinerary": {}
#         }
    
#     return {
#         "role": "assistant",
#         "context": "Unable to complete request.",
#         "flights": [],
#         "bookings": [],
#         "itinerary": {}
#     }


# def plan_hotels(user_message: str, history: list = None):
#     history = history or []
    
#     system_prompt = HOTELS_SEARCH_PROMPT
    
#     MAX_TURNS = 5
#     current_turn = 0
#     trip_details = None
    
#     messages = [types.Content(parts=[types.Part(text=system_prompt)], role="user")]
#     messages.append(types.Content(parts=[types.Part(text=user_message)], role="user"))
    
#     try:
#         while current_turn < MAX_TURNS:
#             response = client.models.generate_content(
#                 model=GEMINI_MODEL,
#                 contents=messages,
#                 config=types.GenerateContentConfig(
#                     tools=[HOTELS_TOOL],
#                     temperature=0.3
#                 )
#             )
            
#             if response.candidates[0].content.parts[0].function_call:
#                 function_call = response.candidates[0].content.parts[0].function_call
#                 function_name = function_call.name
#                 function_args = dict(function_call.args)
                
#                 print(f"\nGEMINI CALLED: {function_name}")
#                 print(f"Arguments: {function_args}")
                
#                 result = call_mcp_tool(function_name, function_args)
                
#                 if "trip_details" in result:
#                     trip_details = result["trip_details"]
                
#                 messages.append(response.candidates[0].content)
#                 messages.append(types.Content(
#                     parts=[types.Part(
#                         function_response=types.FunctionResponse(
#                             name=function_name,
#                             response={"result": result}
#                         )
#                     )],
#                     role="user"
#                 ))
                
#                 current_turn += 1
#             else:
#                 content = response.text
#                 try:
#                     if content.startswith('```json'):
#                         content = content[7:]
#                     if content.startswith('```'):
#                         content = content[3:]
#                     if content.endswith('```'):
#                         content = content[:-3]
#                     content = content.strip()
                    
#                     parsed = json.loads(content)
#                     response_data = {
#                         "role": "assistant",
#                         "context": parsed.get("context", ""),
#                         "flights": parsed.get("flights", []),
#                         "bookings": parsed.get("bookings", []),
#                         "itinerary": parsed.get("itinerary", {})
#                     }
#                     if trip_details:
#                         response_data["trip_details"] = trip_details
#                     return response_data
                    
#                 except json.JSONDecodeError:
#                     response_data = {
#                         "role": "assistant",
#                         "context": content,
#                         "flights": [],
#                         "bookings": [],
#                         "itinerary": {}
#                     }
#                     if trip_details:
#                         response_data["trip_details"] = trip_details
#                     return response_data
                
#                 break
    
#     except Exception as e:
#         return {
#             "role": "assistant",
#             "context": f"Error: {str(e)}",
#             "flights": [],
#             "bookings": [],
#             "itinerary": {}
#         }
    
#     return {
#         "role": "assistant",
#         "context": "Unable to complete request.",
#         "flights": [],
#         "bookings": [],
#         "itinerary": {}
#     }



# def plan_itinerary_service(user_message: str, history: list = None):
#     history = history or []
    
#     system_prompt = ITINERARY_BUILDER_PROMPT
    
#     MAX_TURNS = 5
#     current_turn = 0
#     trip_details = None
    
#     messages = [types.Content(parts=[types.Part(text=system_prompt)], role="user")]
#     messages.append(types.Content(parts=[types.Part(text=user_message)], role="user"))
    
#     try:
#         while current_turn < MAX_TURNS:
#             response = client.models.generate_content(
#                 model=GEMINI_MODEL,
#                 contents=messages,
#                 config=types.GenerateContentConfig(
#                     tools=[ITINERARY_TOOL],
#                     temperature=0.3
#                 )
#             )
            
#             if response.candidates[0].content.parts[0].function_call:
#                 function_call = response.candidates[0].content.parts[0].function_call
#                 function_name = function_call.name
#                 function_args = dict(function_call.args)
                
#                 print(f"\nGEMINI CALLED: {function_name}")
                
#                 result = call_mcp_tool(function_name, function_args)
                
#                 if "trip_details" in result:
#                     trip_details = result["trip_details"]
                
#                 messages.append(response.candidates[0].content)
#                 messages.append(types.Content(
#                     parts=[types.Part(
#                         function_response=types.FunctionResponse(
#                             name=function_name,
#                             response={"result": result}
#                         )
#                     )],
#                     role="user"
#                 ))
                
#                 current_turn += 1
#             else:
#                 content = response.text
#                 try:
#                     if content.startswith('```json'):
#                         content = content[7:]
#                     if content.startswith('```'):
#                         content = content[3:]
#                     if content.endswith('```'):
#                         content = content[:-3]
#                     content = content.strip()
                    
#                     parsed = json.loads(content)
#                     response_data = {
#                         "role": "assistant",
#                         "context": parsed.get("context", ""),
#                         "flights": parsed.get("flights", []),
#                         "bookings": parsed.get("bookings", []),
#                         "itinerary": parsed.get("itinerary", {})
#                     }
#                     if trip_details:
#                         response_data["trip_details"] = trip_details
#                     return response_data
                    
#                 except json.JSONDecodeError:
#                     response_data = {
#                         "role": "assistant",
#                         "context": content,
#                         "flights": [],
#                         "bookings": [],
#                         "itinerary": {}
#                     }
#                     if trip_details:
#                         response_data["trip_details"] = trip_details
#                     return response_data
                
#                 break
    
#     except Exception as e:
#         return {
#             "role": "assistant",
#             "context": f"Error: {str(e)}",
#             "flights": [],
#             "bookings": [],
#             "itinerary": {}
#         }
    
#     return {
#         "role": "assistant",
#         "context": "Unable to complete request.",
#         "flights": [],
#         "bookings": [],
#         "itinerary": {}
#     }


# def plan_chat(user_message, history, trip_details_json=None):
#     from .plan_prompt import get_plan_chatbot_prompt
#     from datetime import datetime
    
#     history = history or []
    
#     if not trip_details_json:
#         trip_details_json = {
#             "origin": None,
#             "destination": None,
#             "departure_date": None,
#             "return_date": None,
#             "adults": None,
#             "budget": None,
#             "interests": None,
#             "accommodation_type": None,
#             "from_airport": None,
#             "to_airport": None
#         }
    
#     current_date = datetime.now().strftime('%Y-%m-%d')
#     system_prompt = get_plan_chatbot_prompt(trip_details_json, current_date)
    
#     try:
#         messages = [types.Content(parts=[types.Part(text=system_prompt)], role="user")]
        
#         for msg in history[-10:]:
#             role = "user" if msg.get("role") == "user" else "model"
#             messages.append(types.Content(
#                 parts=[types.Part(text=msg.get("content", ""))],
#                 role=role
#             ))
        
#         messages.append(types.Content(parts=[types.Part(text=user_message)], role="user"))
        
#         response = client.models.generate_content(
#             model=GEMINI_MODEL,
#             contents=messages,
#             config=types.GenerateContentConfig(temperature=0.3)
#         )
        
#         content = response.text.strip()
        
#         import re
#         match = re.search(r'\{.*\}', content, re.DOTALL)
#         if match:
#             json_str = match.group(0)
#             try:
#                 parsed = json.loads(json_str)
                
#                 trip_details_response = parsed.get("trip_details", {})
                
#                 complete_trip_details = {
#                     "origin": trip_details_response.get("origin", trip_details_json.get("origin")),
#                     "destination": trip_details_response.get("destination", trip_details_json.get("destination")),
#                     "departure_date": trip_details_response.get("departure_date", trip_details_json.get("departure_date")),
#                     "return_date": trip_details_response.get("return_date", trip_details_json.get("return_date")),
#                     "adults": trip_details_response.get("adults", trip_details_json.get("adults")),
#                     "budget": trip_details_response.get("budget", trip_details_json.get("budget")),
#                     "interests": trip_details_response.get("interests", trip_details_json.get("interests")),
#                     "accommodation_type": trip_details_response.get("accommodation_type", trip_details_json.get("accommodation_type")),
#                     "from_airport": trip_details_response.get("from_airport", trip_details_json.get("from_airport")),
#                     "to_airport": trip_details_response.get("to_airport", trip_details_json.get("to_airport"))
#                 }
                
#                 print(f"✓ Gemini response parsed successfully - all 10 fields enforced")
                
#                 return {
#                     "conversational_response": parsed.get("conversational_response", content),
#                     "trip_details": complete_trip_details,
#                     "api_tags": parsed.get("api_tags", []),
#                     "needs_more_info": parsed.get("needs_more_info", False),
#                     "follow_up_questions": parsed.get("follow_up_questions", [])
#                 }
#             except json.JSONDecodeError as e:
#                 print(f"JSON Parse Error: {e}")
        
#         return {
#             "conversational_response": content,
#             "trip_details": trip_details_json,
#             "api_tags": [],
#             "needs_more_info": False,
#             "follow_up_questions": []
#         }
        
#     except Exception as e:
#         print(f"Error in plan_chat: {str(e)}")
#         return {
#             "conversational_response": "I'm here to help plan your trip. What are you thinking?",
#             "trip_details": trip_details_json,
#             "needs_more_info": True,
#             "missing_fields": ["origin", "destination", "departure_date", "return_date"],
#             "follow_up_questions": ["Where would you like to travel?"],
#             "api_tags": []
#         }