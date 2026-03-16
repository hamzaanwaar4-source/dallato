import time
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TripPlanRequestSerializer, FlightSearchSerializer, HotelSearchSerializer, ItineraryBuildSerializer, PlanChatRequestSerializer, TravelInsightsSerializer
from .models import AIChatSession, AIMessage
from .services import plan_flights, plan_hotels, plan_itinerary_service, plan_chat, get_travel_insights
from rest_framework.permissions import AllowAny
from user.config import IsAgencyAgent
import json


def call_mcp_with_retry(tool_name, args, max_retries=1, retry_delay=2):
    from .mcp_client import call_mcp_tool
    import time
    
    attempt = 0
    max_attempts = max_retries + 1
    last_result = None
    
    while attempt < max_attempts:
        attempt += 1
        
        if attempt > 1:
            print(f"Retry attempt {attempt-1}/{max_retries} for {tool_name}")
            time.sleep(retry_delay)
        
        try:
            result = call_mcp_tool(tool_name, args)
            
            if isinstance(result, dict) and 'error' not in result:
                if attempt > 1:
                    print(f"Retry successful for {tool_name} on attempt {attempt}")
                return result
            
            last_result = result
            print(f"Attempt {attempt} for {tool_name} failed with error: {result.get('error', 'Unknown error') if isinstance(result, dict) else result}")
            
        except Exception as e:
            print(f"Attempt {attempt} for {tool_name} raised exception: {str(e)}")
            last_result = {"error": str(e)}
    
    print(f"All {max_attempts} attempts failed for {tool_name}")
    return last_result if last_result else {"error": "All retry attempts failed"}


class TripPlannerView(APIView):
    """
    API endpoint for trip planning chatbot
    Accepts user message and optional conversation history
    Returns comprehensive trip plan with flights, hotels, attractions, and itinerary
    
    """
    permission_classes = [IsAgencyAgent]

    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_message = serializer.validated_data['message']
        history = serializer.validated_data.get('history', [])
        checkin_date = serializer.validated_data.get('checkin_date')
        destination = serializer.validated_data.get('destination')
        checkout_date = serializer.validated_data.get('checkout_date')
        
        result = plan_trip(user_message, history, checkin_date=checkin_date, 
                          destination=destination, checkout_date=checkout_date)
        
        return Response(result, status=status.HTTP_200_OK)


class FlightSearchView(APIView):
    """API endpoint for flight search - accepts structured data from plan API"""
    
    permission_classes = [IsAgencyAgent]

    def post(self, request):
        import time
        start = time.time()
        
        serializer = FlightSearchSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        args = {
            "dest_name": serializer.validated_data['dest_name'],
            "from_airport": serializer.validated_data['from_airport'],
            "to_airport": serializer.validated_data['to_airport'],
            "depart_date": serializer.validated_data['depart_date'],
            "return_date": serializer.validated_data['return_date']
        }
        
        if 'adults' in serializer.validated_data:
            args['adults'] = serializer.validated_data['adults']
        
        mcp_start = time.time()
        from .mcp_client import call_mcp_tool
        result = call_mcp_tool("search_flights", args)
        mcp_elapsed = time.time() - mcp_start
        
        total_elapsed = time.time() - start
        print(f"  Flights API: MCP call {mcp_elapsed:.2f}s, total {total_elapsed:.2f}s")
        
        return Response(result, status=status.HTTP_200_OK)


class HotelSearchView(APIView):
    """API endpoint for hotel search - accepts structured data from plan API"""
    permission_classes = [IsAgencyAgent]

    def post(self, request):
        import time
        start = time.time()
        
        print("\n" + "="*80)
        print(" HOTEL API CALL STARTED")
        print("="*80)
        print(f"Request data: {request.data}")
        
        serializer = HotelSearchSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f" Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print(f" Validated data: {serializer.validated_data}")
        
        args = {
            "dest_name": serializer.validated_data['dest_name'],
            "to_airport": serializer.validated_data['to_airport'],
            "checkin": serializer.validated_data['checkin'],
            "checkout": serializer.validated_data['checkout']
        }
        
        if 'adults' in serializer.validated_data:
            args['adults'] = serializer.validated_data['adults']
        
        print(f" Calling MCP with args: {args}")
        
        mcp_start = time.time()
        from .mcp_client import call_mcp_tool
        result = call_mcp_tool("search_hotels", args)
        mcp_elapsed = time.time() - mcp_start
        
        print(f" MCP returned in {mcp_elapsed:.2f}s")
        print(f"Result type: {type(result)}")
        
        if isinstance(result, dict):
            if 'error' in result:
                print(f" MCP ERROR: {result['error']}")
            else:
                # MCP returns hotels in 'bookings' key (from utils.py filter_essential_data)
                hotels = result.get('bookings', [])
                print(f" Hotels returned: {len(hotels)}")
                if hotels:
                    print(f"First hotel sample: {hotels[0]}")
                    # Add hotels to the response in the expected 'hotels' key for API consistency
                    result['hotels'] = hotels
                else:
                    print(f" No hotels in result. Result keys: {result.keys()}")
                    print(f"Full result: {result}")
        else:
            print(f" Unexpected result type: {result}")
        
        total_elapsed = time.time() - start
        print(f" Hotels API: MCP call {mcp_elapsed:.2f}s, total {total_elapsed:.2f}s")
        print("="*80 + "\n")
        
        return Response(result, status=status.HTTP_200_OK)


class ItineraryBuildView(APIView):
    """API endpoint for itinerary building - accepts structured data from plan API"""
    permission_classes = [IsAgencyAgent]

    def post(self, request):
        serializer = ItineraryBuildSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        args = {
            "dest_name": serializer.validated_data['dest_name'],
            "checkin": serializer.validated_data['checkin'],
            "checkout": serializer.validated_data['checkout']
        }
        
        from .mcp_client import call_mcp_tool
        result = call_mcp_tool("build_itinerary", args)
        
        return Response(result, status=status.HTTP_200_OK)



class PlanChatView(APIView):
    """General planning chatbot - extracts trip details and returns API tags for frontend"""
    permission_classes = [IsAgencyAgent]
    
    def post(self, request):
        import time
        start = time.time()
        
        serializer = PlanChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_message = serializer.validated_data['message']
        session_id = serializer.validated_data.get('session_id')
        
        # Get agency from agent profile (this API is agent-only)
        try:
            agency = request.user.agent_profile.agency
        except AttributeError:
            return Response(
                {"error": "Agent profile not found. This API is only for agents."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create chat session
        if session_id:
            try:
                session = AIChatSession.objects.get(
                    id=session_id,
                    agency=agency
                )
            except AIChatSession.DoesNotExist:
                return Response(
                    {"error": "Session not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Create new session
            title = user_message[:50] + '...' if len(user_message) > 50 else user_message
            session = AIChatSession.objects.create(
                agency=agency,
                created_by=request.user,
                title=title
            )
        
        # Get conversation history - recent 20 messages in chronological order
        history = []
        recent_messages = session.messages.order_by('-created_at')[:20]
        
        for msg in reversed(recent_messages):
            if msg.sender == 'USER':
                history.append({"role": "user", "content": msg.text})
            elif msg.sender == 'ASSISTANT':
                history.append({"role": "assistant", "content": msg.text})
        
        user_msg = AIMessage.objects.create(
            session=session,
            sender='USER',
            text=user_message
        )
        
        existing_trip_details = session.trip_details or {}
        
        print(f"\n{'='*80}")
        print(f"SESSION {session.id} - MEMORY BEFORE:")
        print(f"{json.dumps(existing_trip_details, indent=2)}")
        print(f"{'='*80}\n")
        
        # Pass complete JSON to AI (not individual fields)
        result = plan_chat(
            user_message=user_message,
            history=history,
            trip_details_json=existing_trip_details
        )
        
        new_trip_details = result.get('trip_details', {})

        ALL_FIELDS = [
            "origin", "destination", "destination_country", "departure_date", "return_date",
            "adults", "budget", "interests", "accommodation_type",
            "from_airport", "to_airport"
        ]

        # Merge: new values override existing, but preserve all fields
        merged_trip_details = {}
        for field in ALL_FIELDS:
            # Priority: new_trip_details > existing_trip_details > None
            if field in new_trip_details:
                merged_trip_details[field] = new_trip_details[field]
            elif field in existing_trip_details:
                merged_trip_details[field] = existing_trip_details[field]
            else:
                merged_trip_details[field] = None
        
        print(f"\n{'='*80}")
        print(f"SESSION {session.id} - MEMORY AFTER:")
        print(f"{json.dumps(merged_trip_details, indent=2)}")
        print(f"{'='*80}\n")
        
        # Save merged JSON back to session
        session.trip_details = merged_trip_details
        session.save()
        
        # Save assistant message
        assistant_msg = AIMessage.objects.create(
            session=session,
            sender='ASSISTANT',
            text=result.get('conversational_response', ''),
            metadata={
                'trip_details': merged_trip_details,
                'api_tags': result.get('api_tags', []),
                'needs_more_info': result.get('needs_more_info', False),
                'follow_up_questions': result.get('follow_up_questions', [])
            }
        )
        
        # Return merged trip_details in response
        result['trip_details'] = merged_trip_details
        result['session_id'] = session.id
        
        # Return recent messages for frontend
        recent_display = session.messages.order_by('-created_at')[:10]
        result['messages'] = [
            {
                "sender": msg.sender,
                "text": msg.text,
                "created_at": msg.created_at.isoformat()
            }
            for msg in reversed(recent_display)
        ]
        
        elapsed = time.time() - start
        print(f"Plan API took {elapsed:.2f}s")
        
        return Response(result, status=status.HTTP_200_OK)

class TravelInsightsView(APIView):
    """
    API endpoint for generating travel insights
    Accepts origin, destination, and travel dates
    Returns 5-6 actionable insights covering visa, weather, tips, health, local info, and flights
    """
    permission_classes = [IsAgencyAgent]
    
    def post(self, request):
        import time
        start = time.time()
        
        serializer = TravelInsightsSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        origin = serializer.validated_data['origin']
        destination = serializer.validated_data['destination']
        departure_date = serializer.validated_data['departure_date'].strftime('%Y-%m-%d')
        return_date = serializer.validated_data['return_date'].strftime('%Y-%m-%d')
        
        print(f"\n{'='*80}")
        print(f"TRAVEL INSIGHTS REQUEST")
        print(f"Origin: {origin}")
        print(f"Destination: {destination}")
        print(f"Dates: {departure_date} to {return_date}")
        print(f"{'='*80}\n")
        
        # Call service function
        result = get_travel_insights(origin, destination, departure_date, return_date)
        
        elapsed = time.time() - start
        print(f"Travel Insights API took {elapsed:.2f}s")
        print(f"Generated {len(result.get('insights', []))} insights\n")
        
        return Response(result, status=status.HTTP_200_OK)


class ChatHistoryView(APIView):
    """
    API endpoint to retrieve all chat messages for a specific session
    GET /api/chat-history/?session_id=<session_id>
    """
    permission_classes = [IsAgencyAgent]
    
    def get(self, request):
        session_id = request.query_params.get('session_id')
        
        if not session_id:
            return Response(
                {"error": "session_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = AIChatSession.objects.only(
                'id', 'agency_id', 'title', 'trip_details'
            ).get(id=session_id)
            
            user_agency = request.user.agency if hasattr(request.user, 'agency') else (
                request.user.agent_profile.agency if hasattr(request.user, 'agent_profile') else None
            )
            
            if not user_agency or session.agency != user_agency:
                return Response(
                    {"error": "You do not have permission to access this chat session"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            messages = AIMessage.objects.filter(
                session_id=session_id
            ).order_by('created_at').values(
                'id',
                'sender',
                'text',
                'metadata',
                'created_at'
            )
            
            return Response({
                "session_id": session_id,
                "session_title": session.title,
                "trip_details": session.trip_details,
                "messages": list(messages),
                "total_messages": len(messages)
            }, status=status.HTTP_200_OK)
            
        except AIChatSession.DoesNotExist:
            return Response(
                {"error": f"Chat session with ID {session_id} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f" ERROR retrieving chat history: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
