from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, Count
from django.db import transaction
from datetime import datetime, date, timedelta
from collections import defaultdict
from .models import *
from .serializers import *
from .geocoding import geocode_trip_async
import threading
from agency.serializers import AgencyRevenueOverviewSerializer
from user.config import IsAgencyAgent
from chatbot.models import AIChatSession

class AgentSettingsView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        try:
            agent = Agent.objects.select_related('user').get(id=request.user.agent_profile.id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgentSerializer(
            agent,
            fields=['agent_id', 'name', 'email', 'phone', 'location', 'default_commission']
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = UpdateAgentSettingsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if 'name' in serializer.validated_data:
            agent.name = serializer.validated_data['name']
        if 'phone' in serializer.validated_data:
            agent.phone = serializer.validated_data['phone']
        if 'location' in serializer.validated_data:
            agent.location = serializer.validated_data['location']
        if 'default_commission' in serializer.validated_data:
            agent.commission_client_wise = serializer.validated_data['default_commission']
        
        agent.save()
        
        ActivityLog.objects.create(
            agency=agent.agency,
            agent=agent,
            table_name='AGENT',
            status_code=200,
            message=f'Agent settings updated for {agent.name}'
        )
        
        return Response({'message': 'Settings updated successfully'}, status=status.HTTP_200_OK)
    
    def patch(self, request):
        return self.post(request)


class AgentClientsListView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id

        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        clients = Client.objects.filter(agent=agent).order_by('-created_at')
        serializer = ClientSerializer(
            clients,
            many=True,
            fields=['id', 'full_name', 'email', 'phone', 'client_type', 'travel_style', 'membership', 'destination', 'created_at']
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClientDetailView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        client_id = request.query_params.get('client_id')
        agent_id = request.user.agent_profile.id

        if not client_id:
            return Response(
                {'error': 'client_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = Client.objects.select_related('agent').prefetch_related(
                'family_members', 'trips'
            ).get(id=client_id)

            if agent_id and str(client.agent.id) != str(agent_id):
                return Response(
                    {'error': 'Client does not belong to this agent'},
                    status=status.HTTP_403_FORBIDDEN
                )

        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ClientSerializer(
            client,
            fields=[
                'id', 'full_name', 'email', 'phone', 'location', 'client_type',
                'dob', 'travel_date', 'destination', 'origin', 'budget_range',
                'travel_style', 'notes', 'commission_percent', 'membership',
                'upcoming_trips', 'past_trips', 'total_revenue',
                'family_members', 'recent_activity'
            ]
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateClientView(APIView):
    permission_classes = [IsAgencyAgent]

    def post(self, request):
        agent_id = request.user.agent_profile.id    
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CreateClientSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        family_members_data = validated_data.pop('family_members', [])
        
        email = validated_data.get('email')
        if Client.objects.filter(email=email).exists():
            return Response(
                {'error': 'A client with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        client = Client.objects.create(
            agent=agent,
            **validated_data
        )
        
        for member_data in family_members_data:
            ClientFamilyMember.objects.create(
                client=client,
                **member_data
            )
        
        ActivityLog.objects.create(
            agency=agent.agency,
            agent=agent,
            client=client,
            table_name='CLIENT',
            status_code=201,
            message=f'Client onboarded: {client.full_name}'
        )
        
        return Response(
            {'message': 'Client created successfully', 'client_id': client.id},
            status=status.HTTP_201_CREATED
        )


class ClientPastTripsView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        client_id = request.query_params.get('client_id')
        agent_id = request.user.agent_profile.id
        
        if not client_id:
            return Response(
                {'error': 'client_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(id=client_id, agent_id=agent_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = date.today()
        past_trips = Trip.objects.filter(client=client, start_date__lt=today).order_by('-start_date')
        
        serializer = TripListSerializer(past_trips, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClientUpcomingTripsView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        client_id = request.query_params.get('client_id')
        agent_id = request.user.agent_profile.id
        
        if not client_id:
            return Response(
                {'error': 'client_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(id=client_id, agent_id=agent_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = date.today()
        upcoming_trips = Trip.objects.filter(client=client, start_date__gte=today).order_by('start_date')
        
        serializer = TripListSerializer(upcoming_trips, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClientQuotesView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        client_id = request.query_params.get('client_id')
        agent_id = request.user.agent_profile.id
        
        if not client_id:
            return Response(
                {'error': 'client_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(id=client_id, agent_id=agent_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        quotes = Quote.objects.filter(trip__client=client).order_by('-created_at')
        
        serializer = QuoteListSerializer(quotes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClientNotesView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        """Get client notes"""
        client_id = request.query_params.get('client_id')
        agent_id = request.user.agent_profile.id
        
        if not client_id:
            return Response(
                {'error': 'client_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(id=client_id, agent_id=agent_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'client_id': client.id,
            'client_name': client.full_name,
            'notes': client.notes or ''
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create or set client notes"""
        client_id = request.data.get('client_id')
        notes = request.data.get('notes', '')
        agent_id = request.user.agent_profile.id
        
        if not client_id:
            return Response(
                {'error': 'client_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(id=client_id, agent_id=agent_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        client.notes = notes
        client.save()
        
        ActivityLog.objects.create(
            agency=client.agent.agency,
            agent=client.agent,
            client=client,
            table_name='CLIENT',
            status_code=200,
            message=f'Notes updated for client: {client.full_name}'
        )
        
        return Response({
            'message': 'Notes saved successfully',
            'client_id': client.id,
            'notes': client.notes
        }, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """Update client notes"""
        return self.post(request)


class DeleteClientView(APIView):
    permission_classes = [IsAgencyAgent]

    def delete(self, request):
        client_id = request.data.get('client_id') or request.query_params.get('client_id')
        agent_id = request.user.agent_profile.id
        
        if not client_id:
            return Response(
                {'error': 'client_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(id=client_id, agent_id=agent_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        client_name = client.full_name
        agent = client.agent
        
        ActivityLog.objects.create(
            agency=agent.agency,
            agent=agent,
            client=None,
            table_name='CLIENT',
            status_code=200,
            message=f'Client deleted: {client_name}'
        )
        
        client.delete()
        
        return Response(
            {'message': 'Client and all related data deleted successfully'},
            status=status.HTTP_200_OK
        )


class UpdateClientView(APIView):
    permission_classes = [IsAgencyAgent]

    def patch(self, request):
        client_id = request.data.get('client_id')
        agent_id = request.user.agent_profile.id

        if not client_id:
            return Response(
                {'error': 'client_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = Client.objects.get(id=client_id, agent_id=agent_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UpdateClientSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if 'email' in serializer.validated_data:
            new_email = serializer.validated_data['email']
            if Client.objects.filter(email=new_email).exclude(id=client_id).exists():
                return Response(
                    {'error': 'A client with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        for field, value in serializer.validated_data.items():
            if field != 'family_members':
                setattr(client, field, value)

        client.save()

        if 'commission_percent' in serializer.validated_data:
            quotes = Quote.objects.filter(trip__client=client).select_related('agent__agency')
            for quote in quotes:
                quote.agent_commission_percent = client.commission_percent
                agent_commission_total = (quote.ai_base_total * quote.agent_commission_percent) / 100
                quote.agency_commission_amount = (agent_commission_total * quote.agency_commission_percent) / 100
                quote.agent_commission_amount = agent_commission_total - quote.agency_commission_amount
                quote.total_price = quote.ai_base_total + agent_commission_total
                quote.save()

        if 'destination' in serializer.validated_data:
            trips = Trip.objects.filter(client=client)
            trips.update(destination_city=serializer.validated_data['destination'])

        family_members_data = request.data.get('family_members', None)
        if family_members_data is not None:
            ClientFamilyMember.objects.filter(client=client).delete()
            for member_data in family_members_data:
                member_serializer = ClientFamilyMemberSerializer(data=member_data)
                if member_serializer.is_valid():
                    ClientFamilyMember.objects.create(client=client, **member_serializer.validated_data)
                else:
                    return Response(
                        {'error': 'Invalid family member data', 'details': member_serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        ActivityLog.objects.create(
            agency=client.agent.agency,
            agent=client.agent,
            client=client,
            table_name='CLIENT',
            status_code=200,
            message=f'Client updated: {client.full_name}'
        )

        return Response(
            {'message': 'Client updated successfully'},
            status=status.HTTP_200_OK
        )


class SaveTripDataView(APIView):
    permission_classes = [IsAgencyAgent]

    @transaction.atomic
    def post(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = SaveTripDataSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        try:
            client = Client.objects.get(id=validated_data['client_id'], agent=agent)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        trip = Trip.objects.create(
            client=client,
            agent=agent,
            title=validated_data['trip_title'],
            start_date=validated_data['start_date'],
            end_date=validated_data['end_date'],
            destination_city=validated_data.get('destination_city', ''),
            destination_country=validated_data.get('destination_country', ''),
            destination_formatted=validated_data.get('destination_formatted', ''),
            destination_latitude=validated_data.get('destination_latitude'),
            destination_longitude=validated_data.get('destination_longitude'),
            to_airport=validated_data.get('to_airport', ''),
            from_airport=validated_data.get('from_airport', ''),
            is_booked=False
        )
        
        ai_session = None
        session_id = validated_data.get('session_id')
        if session_id:
            try:
                ai_session = AIChatSession.objects.get(id=session_id, agency=agent.agency)
            except AIChatSession.DoesNotExist:
                pass
        
        quote = Quote.objects.create(
            trip=trip,
            agent=agent,
            ai_session=ai_session,
            version_number=1,
            currency=validated_data.get('currency', 'USD'),
            status='DRAFT',
            ai_base_total=validated_data['ai_base_total']
        )
        
        quote.calculate_commissions()
        
        flights_data = validated_data.get('flights', [])
        for flight_data in flights_data:
            Flight.objects.create(
                quote=quote,
                flight_type=flight_data['flight_type'],
                travel_class=flight_data['travel_class'],
                price_per_seat=flight_data['price_per_seat'],
                carrier=flight_data.get('carrier', ''),
                carrier_logo=flight_data.get('carrier_logo', ''),
                flight_currency=flight_data.get('flight_currency', 'USD'),
                source=flight_data.get('source', 'Duffel'),
                departure_datetime=flight_data.get('departure_datetime'),
                departure_airport=flight_data.get('departure_airport', ''),
                arrival_datetime=flight_data.get('arrival_datetime'),
                arrival_airport=flight_data.get('arrival_airport', ''),
                duration=flight_data.get('duration', ''),
                stops=flight_data.get('stops', 0),
                baggage_include=flight_data.get('baggage_include', ''),
                flight_number=flight_data.get('flight_number', '')
            )
        
        hotels_data = validated_data.get('hotels', [])
        for hotel_data in hotels_data:
            Hotel.objects.create(
                quote=quote,
                name=hotel_data['name'],
                price_total=hotel_data['price_total'],
                hotel_currency=hotel_data.get('hotel_currency', 'USD'),
                rating=hotel_data.get('rating'),
                review_count=hotel_data.get('review_count'),
                star_rating=hotel_data.get('star_rating'),
                country_code=hotel_data.get('country_code', ''),
                latitude=hotel_data.get('latitude'),
                longitude=hotel_data.get('longitude'),
                main_photo_url=hotel_data.get('main_photo_url', ''),
                checkin_time=hotel_data.get('checkin_time'),
                checkout_time=hotel_data.get('checkout_time'),
                room_type=hotel_data.get('room_type', []),
                labels=hotel_data.get('labels', []),
                source=hotel_data.get('source', 'Booking.com')
            )
        
        itinerary_data = validated_data.get('itinerary')
        if itinerary_data:
            itinerary = Itinerary.objects.create(quote=quote)
            
            days_data = itinerary_data.get('days', [])
            for day_data in days_data:
                itinerary_day = ItineraryDay.objects.create(
                    itinerary=itinerary,
                    date=day_data['date'],
                    title=day_data['title']
                )
                
                activities_data = day_data.get('activities', [])
                for activity_data in activities_data:
                    ItineraryActivity.objects.create(
                        itinerary_day=itinerary_day,
                        title=activity_data['title'],
                        description=activity_data.get('description', ''),
                        itineraryactivity_cost=activity_data.get('itineraryactivity_cost', 0.00),
                        start_time=activity_data.get('start_time'),
                        end_time=activity_data.get('end_time'),
                        date=activity_data['date']
                    )
        
        ActivityLog.objects.create(
            agency=agent.agency,
            agent=agent,
            client=client,
            table_name='TRIP',
            status_code=201,
            message=f'Trip created: {trip.title} for client {client.full_name}'
        )
        
        # if trip.destination_city or trip.destination_country:
        #     transaction.on_commit(lambda: threading.Thread(target=geocode_trip_async, args=(trip.id,)).start())
        
        return Response(
            {
                'message': 'Trip data saved successfully',
                'trip_id': trip.id,
                'quote_id': quote.id
            },
            status=status.HTTP_201_CREATED
        )


class ManagedBookingsView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        quotes = Quote.objects.filter(
            agent=agent,
            status__in=['INITIAL_CONTACT', 'QUOTE_SENT', 'IN_NEGOTIATION', 'CONFIRMED']
        ).select_related('trip', 'trip__client').order_by('-created_at')
        
        bookings_list = []
        for quote in quotes:
            # Determine display status
            display_status = quote.status
            if quote.status == 'CONFIRMED':
                display_status = 'Booked' if quote.trip.is_booked else 'Confirmed'
            elif quote.status == 'QUOTE_SENT':
                display_status = 'Quote Sent'
            elif quote.status == 'IN_NEGOTIATION':
                display_status = 'In Negotiation'
            elif quote.status == 'INITIAL_CONTACT':
                display_status = 'Initial Contact'
            
            bookings_list.append({
                'client_id': quote.trip.client.id,
                'client_name': quote.trip.client.full_name,
                'client_email': quote.trip.client.email,
                'quote_id': quote.id,
                'quote_number': f'Q-{quote.id}',
                'version_number': quote.version_number,
                'destination': quote.trip.destination_city or quote.trip.destination_country or '',
                'price': quote.ai_base_total,
                'status': display_status,
                'created_at': quote.created_at
            })
        
        serializer = ManagedBookingSerializer(bookings_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MarkQuoteAsBookedView(APIView):
    permission_classes = [IsAgencyAgent]

    def patch(self, request):
        client_id = request.data.get('client_id')
        quote_id = request.data.get('quote_id')
        agent_id = request.user.agent_profile.id
        
        if not client_id or not quote_id:
            return Response(
                {'error': 'client_id and quote_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quote = Quote.objects.select_related('trip', 'trip__client', 'agent', 'agent__agency').get(
                id=quote_id,
                trip__client_id=client_id,
                agent_id=agent_id
            )
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        quote.status = 'CONFIRMED'
        quote.save()
        
        trip = quote.trip
        trip.is_booked = True
        trip.save()
        
        ActivityLog.objects.create(
            agency=quote.agent.agency,
            agent=quote.agent,
            client=trip.client,
            table_name='QUOTE',
            status_code=200,
            message=f'Quote Q-{quote.id} marked as booked for client {trip.client.full_name}'
        )
        
        return Response(
            {'message': 'Quote marked as booked successfully'},
            status=status.HTTP_200_OK
        )


class PendingQuotesView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        quotes = Quote.objects.filter(
            agent=agent,
            status__in=['DRAFT']
        ).select_related('trip', 'trip__client').order_by('-created_at')
        
        pending_quotes_list = []
        for quote in quotes:
            pending_quotes_list.append({
                'quote_id': quote.id,
                'quote_number': f'Q-{quote.id}',
                'client_id': quote.trip.client.id,
                'client_name': quote.trip.client.full_name,
                'destination': quote.trip.destination_city or quote.trip.destination_country or '',
                'status': quote.status,
                'version_number': quote.version_number,
                'created_at': quote.created_at,
                'trip_title': quote.trip.title
            })
        
        serializer = PendingQuoteSerializer(pending_quotes_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateQuoteStatusView(APIView):
    permission_classes = [IsAgencyAgent]

    def patch(self, request):
        agent_id = request.user.agent_profile.id
        
        serializer = UpdateQuoteStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        quote_id = serializer.validated_data['quote_id']
        new_status = serializer.validated_data['status']
        
        try:
            quote = Quote.objects.select_related('trip', 'trip__client', 'agent', 'agent__agency').get(
                id=quote_id,
                agent_id=agent_id
            )
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        old_status = quote.status
        quote.status = new_status
        quote.save()
        
        # If status is changed to CONFIRMED, mark the trip as booked
        if new_status == 'CONFIRMED':
            trip = quote.trip
            trip.is_booked = True
            trip.save()
        # If status is changed from CONFIRMED to something else, mark the trip as not booked
        elif old_status == 'CONFIRMED' and new_status != 'CONFIRMED':
            trip = quote.trip
            trip.is_booked = False
            trip.save()
        
        ActivityLog.objects.create(
            agency=quote.agent.agency,
            agent=quote.agent,
            client=quote.trip.client,
            table_name='QUOTE',
            status_code=200,
            message=f'Quote Q-{quote.id} status changed from {old_status} to {new_status} for client {quote.trip.client.full_name}'
        )
        
        return Response(
            {
                'message': 'Quote status updated successfully',
                'quote_id': quote.id,
                'old_status': old_status,
                'new_status': new_status
            },
            status=status.HTTP_200_OK
        )
        
class UpdateTripDataView(APIView):
    permission_classes = [IsAgencyAgent]
    @transaction.atomic
    def patch(self, request):
        trip_id = request.data.get('trip_id')
        agent_id = request.user.agent_profile.id
        
        if not trip_id:
            return Response(
                {'error': 'trip_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            trip = Trip.objects.select_related('agent', 'agent__agency', 'client').get(id=trip_id, agent_id=agent_id)
        except Trip.DoesNotExist:
            return Response(
                {'error': 'Trip not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = UpdateTripDataSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        if 'trip_title' in validated_data:
            trip.title = validated_data['trip_title']
        if 'start_date' in validated_data:
            trip.start_date = validated_data['start_date']
        if 'end_date' in validated_data:
            trip.end_date = validated_data['end_date']
        if 'destination_city' in validated_data:
            trip.destination_city = validated_data['destination_city']
        if 'destination_country' in validated_data:
            trip.destination_country = validated_data['destination_country']
        if 'destination_formatted' in validated_data:
            trip.destination_formatted = validated_data['destination_formatted']
        if 'destination_latitude' in validated_data:
            trip.destination_latitude = validated_data['destination_latitude']
        if 'destination_longitude' in validated_data:
            trip.destination_longitude = validated_data['destination_longitude']
        if 'to_airport' in validated_data:
            trip.to_airport = validated_data['to_airport']
        if 'from_airport' in validated_data:
            trip.from_airport = validated_data['from_airport']
        
        trip.save()
        
        quote = Quote.objects.filter(trip=trip).first()
        if quote:
            needs_commission_recalc = False
            if 'currency' in validated_data:
                quote.currency = validated_data['currency']
            if 'ai_base_total' in validated_data:
                quote.ai_base_total = validated_data['ai_base_total']
                needs_commission_recalc = True
            
            if 'session_id' in validated_data:
                session_id = validated_data.get('session_id')
                if session_id:
                    
                    try:
                        ai_session = AIChatSession.objects.get(id=session_id, agency=trip.agent.agency)
                        quote.ai_session = ai_session
                    except AIChatSession.DoesNotExist:
                        pass
                else:
                    quote.ai_session = None
            
            client = trip.client
            agent = trip.agent
            agency = agent.agency
            
            quote.agent_commission_percent = client.commission_percent
            quote.agency_commission_percent = agency.agent_commission
            
            if needs_commission_recalc or 'ai_base_total' in validated_data:
                agent_commission_total = (quote.ai_base_total * quote.agent_commission_percent) / 100
                quote.agency_commission_amount = (agent_commission_total * quote.agency_commission_percent) / 100
                quote.agent_commission_amount = agent_commission_total - quote.agency_commission_amount
                quote.total_price = quote.ai_base_total + agent_commission_total
            
            quote.save()
            
            if 'flights' in validated_data:
                Flight.objects.filter(quote=quote).delete()
                for flight_data in validated_data['flights']:
                    Flight.objects.create(
                        quote=quote,
                        flight_type=flight_data['flight_type'],
                        travel_class=flight_data['travel_class'],
                        price_per_seat=flight_data['price_per_seat'],
                        carrier=flight_data.get('carrier', ''),
                        carrier_logo=flight_data.get('carrier_logo', ''),
                        flight_currency=flight_data.get('flight_currency', 'USD'),
                        source=flight_data.get('source', 'Duffel'),
                        departure_datetime=flight_data.get('departure_datetime'),
                        departure_airport=flight_data.get('departure_airport', ''),
                        arrival_datetime=flight_data.get('arrival_datetime'),
                        arrival_airport=flight_data.get('arrival_airport', ''),
                        duration=flight_data.get('duration', ''),
                        stops=flight_data.get('stops', 0),
                        baggage_include=flight_data.get('baggage_include', ''),
                        flight_number=flight_data.get('flight_number', '')
                    )
            
            if 'hotels' in validated_data:
                Hotel.objects.filter(quote=quote).delete()
                for hotel_data in validated_data['hotels']:
                    Hotel.objects.create(
                        quote=quote,
                        name=hotel_data['name'],
                        price_total=hotel_data['price_total'],
                        hotel_currency=hotel_data.get('hotel_currency', 'USD'),
                        rating=hotel_data.get('rating'),
                        review_count=hotel_data.get('review_count'),
                        star_rating=hotel_data.get('star_rating'),
                        country_code=hotel_data.get('country_code', ''),
                        latitude=hotel_data.get('latitude'),
                        longitude=hotel_data.get('longitude'),
                        main_photo_url=hotel_data.get('main_photo_url', ''),
                        checkin_time=hotel_data.get('checkin_time'),
                        checkout_time=hotel_data.get('checkout_time'),
                        room_type=hotel_data.get('room_type', []),
                        labels=hotel_data.get('labels', []),
                        source=hotel_data.get('source', 'Booking.com')
                    )
            
            if 'itinerary' in validated_data:
                itinerary_data = validated_data['itinerary']
                itinerary = Itinerary.objects.filter(quote=quote).first()
                
                if itinerary:
                    ItineraryDay.objects.filter(itinerary=itinerary).delete()
                else:
                    itinerary = Itinerary.objects.create(quote=quote)
                
                days_data = itinerary_data.get('days', [])
                for day_data in days_data:
                    itinerary_day = ItineraryDay.objects.create(
                        itinerary=itinerary,
                        date=day_data['date'],
                        title=day_data['title']
                    )
                    
                    activities_data = day_data.get('activities', [])
                    for activity_data in activities_data:
                        ItineraryActivity.objects.create(
                            itinerary_day=itinerary_day,
                            title=activity_data['title'],
                            description=activity_data.get('description', ''),
                            itineraryactivity_cost=activity_data.get('itineraryactivity_cost', 0.00),
                            start_time=activity_data.get('start_time'),
                            end_time=activity_data.get('end_time'),
                            date=activity_data['date']
                        )
        
        ActivityLog.objects.create(
            agency=trip.agent.agency,
            agent=trip.agent,
            client=trip.client,
            table_name='TRIP',
            status_code=200,
            message=f'Trip updated: {trip.title} for client {trip.client.full_name}'
        )
        
        # if 'destination_city' in validated_data or 'destination_country' in validated_data:
            # if trip.destination_city or trip.destination_country:
            #     # Run geocoding in background after transaction commits
            #     transaction.on_commit(lambda: threading.Thread(target=geocode_trip_async, args=(trip.id,)).start())        
        return Response(
            {'message': 'Trip data updated successfully'},
            status=status.HTTP_200_OK
        )


class DeleteTripDataView(APIView):
    permission_classes = [IsAgencyAgent]

    @transaction.atomic
    def delete(self, request):
        trip_id = request.query_params.get('trip_id')
        agent_id = request.user.agent_profile.id
        
        if not trip_id:
            return Response(
                {'error': 'trip_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            trip = Trip.objects.select_related('agent', 'agent__agency', 'client').get(id=trip_id, agent_id=agent_id)
        except Trip.DoesNotExist:
            return Response(
                {'error': 'Trip not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        trip_title = trip.title
        agent = trip.agent
        client_name = trip.client.full_name
        client_ref = trip.client
        
        ActivityLog.objects.create(
            agency=agent.agency,
            agent=agent,
            client=None,
            table_name='TRIP',
            status_code=200,
            message=f'Trip deleted: {trip_title} for client {client_name}'
        )
        
        trip.delete()
        
        return Response(
            {'message': 'Trip and all related data deleted successfully'},
            status=status.HTTP_200_OK
        )


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        total_quotes = Quote.objects.filter(agent=agent).count()
        
        current_month_start = date.today().replace(day=1)
        clients_this_month = Client.objects.filter(
            agent=agent,
            created_at__gte=current_month_start
        ).count()
        
        confirmed_bookings = Quote.objects.filter(
            agent=agent,
            status='CONFIRMED'
        ).count()
        
        total_quotes_excluding_draft = Quote.objects.filter(
            agent=agent
        ).exclude(status='DRAFT').count()
        
        if total_quotes_excluding_draft > 0:
            conversion_rate = (confirmed_bookings / total_quotes_excluding_draft) * 100
        else:
            conversion_rate = 0.00
        
        yield_aggregate = Quote.objects.filter(
            agent=agent,
            status='CONFIRMED'
        ).aggregate(total=Sum('agent_commission_amount'))
        total_yield = float(yield_aggregate['total'] or 0)
        
        average_yield = total_yield / confirmed_bookings if confirmed_bookings > 0 else 0.00
        
        analytics_data = {
            'total_quotes': total_quotes,
            'clients_this_month': clients_this_month,
            'confirmed_bookings': confirmed_bookings,
            'conversion_rate': round(conversion_rate, 2),
            'average_yield': round(average_yield, 2)
        }
        
        serializer = DashboardAnalyticsSerializer(analytics_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpcomingDeparturesView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id

        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = date.today()
        next_7_days = today + timedelta(days=7)
        urgent_threshold = today + timedelta(days=2)
        
        all_upcoming_trips = Trip.objects.filter(
            agent=agent,
            is_booked=True,
            start_date__gte=today,
            start_date__lte=next_7_days
        ).select_related('client').order_by('start_date')
        
        total_departures = all_upcoming_trips.count()
        
        urgent_departures = all_upcoming_trips.filter(
            start_date__lte=urgent_threshold
        ).count()
        
        trips = all_upcoming_trips
        
        departures_list = []
        for trip in trips:
            days_diff = (trip.start_date - today).days
            
            if days_diff == 0:
                days_until = 'TODAY'
            elif days_diff == 1:
                days_until = 'TOMORROW'
            else:
                days_until = f'IN {days_diff} DAYS'
            
            is_urgent = days_diff <= 2
            
            flight = Flight.objects.filter(
                quote__trip=trip,
                flight_type='OUTBOUND'
            ).first()
            
            departure_time = flight.departure_datetime.time() if flight and flight.departure_datetime else None      
            # Fetch the associated quote for this trip
            quote = Quote.objects.filter(trip=trip).first()
            
            departures_list.append({
                'client_id': trip.client.id,
                'client_name': trip.client.full_name,
                'destination': trip.destination_city or '',
                'destination_country': trip.destination_country or '',
                'departure_date': trip.start_date,
                'departure_time': departure_time,
                'return_date': trip.end_date,
                'days_until_departure': days_until,
                'is_urgent': is_urgent,
                'trip_title': trip.title,
                'from_airport': trip.from_airport or '',
                'to_airport': trip.to_airport or '',
                'quote_id': quote.id if quote else None,
                'trip_id': trip.id
            })
        
        response_data = {
            'total_departures': total_departures,
            'urgent_departures': urgent_departures,
            'departures': UpcomingDepartureSerializer(departures_list, many=True).data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class BookingsMapView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = date.today()
        month_param = request.query_params.get('month')
        year = request.query_params.get('year')
        
        month_mapping = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12
        }
        
        if month_param:
            month_lower = month_param.lower()
            if month_lower in month_mapping:
                month = month_mapping[month_lower]
            else:
                return Response(
                    {'error': 'Invalid month name. Use January, February, March, April, May, June, July, August, September, October, November, or December'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            month = today.month
        
        if year:
            try:
                year = int(year)
                if year < 1900 or year > 2100:
                    return Response(
                        {'error': 'Year must be between 1900 and 2100'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Invalid year format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            year = today.year
        
        try:
            current_month_start = date(year, month, 1)
            if month == 12:
                next_month_start = date(year + 1, 1, 1)
            else:
                next_month_start = date(year, month + 1, 1)
        except ValueError as e:
            return Response(
                {'error': f'Invalid date: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        trips = Trip.objects.filter(
            agent=agent,
            is_booked=True,
            created_at__gte=current_month_start,
            created_at__lt=next_month_start
        ).values(
            'destination_city',
            'destination_country',
            'destination_formatted',
            'destination_latitude',
            'destination_longitude'
        ).annotate(
            booking_count=Count('id')
        ).order_by('-booking_count')
        
        map_data_list = []
        for trip_data in trips:
            if trip_data['destination_latitude'] and trip_data['destination_longitude']:
                map_data_list.append({
                    'destination_city': trip_data['destination_city'] or '',
                    'destination_country': trip_data['destination_country'] or '',
                    'destination_formatted': trip_data['destination_formatted'] or '',
                    'destination_latitude': trip_data['destination_latitude'],
                    'destination_longitude': trip_data['destination_longitude'],
                    'booking_count': trip_data['booking_count']
                })
        
        serializer = BookingMapSerializer(map_data_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RevenueOverviewView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id

        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        current_month_start = date.today().replace(day=1)
        
        revenue_by_date = Quote.objects.filter(
            agent=agent,
            status='CONFIRMED',
            created_at__gte=current_month_start
        ).extra(
            select={'quote_date': 'DATE(created_at)'}
        ).values('quote_date').annotate(
            revenue=Sum('agent_commission_amount')
        ).order_by('quote_date')
        
        revenue_list = [
            {
                'date': item['quote_date'],
                'revenue': round(float(item['revenue']), 2)
            }
            for item in revenue_by_date
        ]
        
        serializer = RevenueOverviewSerializer(revenue_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TopDestinationsView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        trips = Trip.objects.filter(
            agent=agent,
            is_booked=True
        ).values(
            'destination_city',
            'destination_country'
        ).annotate(
            booking_count=Count('id')
        ).order_by('-booking_count')[:6]
        
        total_bookings = sum(item['booking_count'] for item in trips)
        
        top_destinations_list = []
        for trip_data in trips:
            percentage = (trip_data['booking_count'] / total_bookings * 100) if total_bookings > 0 else 0
            top_destinations_list.append({
                'destination': trip_data['destination_city'] or trip_data['destination_country'] or 'Unknown',
                'destination_country': trip_data['destination_country'] or '',
                'booking_count': trip_data['booking_count'],
                'percentage': round(percentage, 2)
            })
        
        serializer = TopDestinationSerializer(top_destinations_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TodoListView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id
        filter_type = request.query_params.get('filter', 'week')
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = date.today()
        if filter_type == 'week':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=7)
        else:
            start_date = today.replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1)
        
        pending_quotes = Quote.objects.filter(
            agent=agent,
            trip__is_booked=False,
            created_at__gte=start_date,
            created_at__lt=end_date
        ).exclude(status__in=['DRAFT', 'REMOVED', 'CONFIRMED']).select_related('trip', 'trip__client').order_by('-created_at')
        
        todo_list = []
        for quote in pending_quotes:
            trip = quote.trip
            client = trip.client
            days_pending = (today - quote.created_at.date()).days
            
            todo_list.append({
                'quote_id': quote.id,
                'quote_number': f'Q-{quote.id}',
                'client_id': client.id,
                'client_name': client.full_name,
                'client_email': client.email,
                'destination': trip.destination_city or trip.destination_country or 'N/A',
                'trip_title': trip.title,
                'quote_value': quote.ai_base_total,
                'status': quote.status,
                'created_at': quote.created_at,
                'days_pending': days_pending,
                'travel_date': trip.start_date
            })
        
        serializer = TodoQuoteSerializer(todo_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentRecentActivityView(APIView):
    permission_classes = [IsAgencyAgent]

    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        activity_logs = ActivityLog.objects.filter(
            agent=agent
        ).order_by('-created_at')[:20]
        
        recent_activities = []
        for log in activity_logs:
            activity_type = 'OTHER'
            client_name = 'N/A'
            related_id = 0
            
            if log.table_name == 'CLIENT':
                activity_type = 'CLIENT'
                if 'created' in log.message.lower():
                    try:
                        client_name = log.message.split('created:')[1].strip() if 'created:' in log.message else log.message
                    except:
                        client_name = 'N/A'
                elif 'updated' in log.message.lower():
                    try:
                        client_name = log.message.split('updated:')[1].strip() if 'updated:' in log.message else log.message
                    except:
                        client_name = 'N/A'
                elif 'deleted' in log.message.lower():
                    try:
                        client_name = log.message.split('deleted:')[1].strip() if 'deleted:' in log.message else log.message
                    except:
                        client_name = 'N/A'
            elif log.table_name == 'TRIP':
                activity_type = 'TRIP'
                try:
                    client_name = log.message.split('for')[1].split('-')[0].strip() if 'for' in log.message else 'N/A'
                except:
                    client_name = 'N/A'
            elif log.table_name == 'QUOTE':
                activity_type = 'QUOTE'
                try:
                    client_name = log.message.split('for')[1].strip() if 'for' in log.message else 'N/A'
                except:
                    client_name = 'N/A'
            elif log.table_name == 'AGENT':
                activity_type = 'SETTINGS'
                client_name = agent.name
            
            recent_activities.append({
                'activity_type': activity_type,
                'message': log.message,
                'client_name': client_name,
                'timestamp': log.created_at,
                'related_id': log.id
            })
        
        serializer = AgentRecentActivitySerializer(recent_activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentRevenueOverviewView(APIView):
    permission_classes = [IsAgencyAgent]
    
    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        current_month_start = date.today().replace(day=1)
        if current_month_start.month == 1:
            previous_month_start = current_month_start.replace(year=current_month_start.year - 1, month=12)
        else:
            previous_month_start = current_month_start.replace(month=current_month_start.month - 1)
        
        next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)
        if previous_month_start.month == 12:
            previous_month_end = previous_month_start.replace(year=previous_month_start.year + 1, month=1, day=1)
        else:
            previous_month_end = previous_month_start.replace(month=previous_month_start.month + 1, day=1)
        
        current_revenue_agg = Quote.objects.filter(
            agent=agent,
            status='CONFIRMED',
            created_at__gte=current_month_start,
            created_at__lt=next_month_start
        ).aggregate(total=Sum('agent_commission_amount'))
        monthly_revenue = float(current_revenue_agg['total'] or 0)
        
        previous_revenue_agg = Quote.objects.filter(
            agent=agent,
            status='CONFIRMED',
            created_at__gte=previous_month_start,
            created_at__lt=previous_month_end
        ).aggregate(total=Sum('agent_commission_amount'))
        previous_revenue = float(previous_revenue_agg['total'] or 0)
        
        if previous_revenue > 0:
            revenue_change_percent = ((monthly_revenue - previous_revenue) / previous_revenue) * 100
        else:
            revenue_change_percent = 0 if monthly_revenue == 0 else 100
        
        booked_quotes_agg = Quote.objects.filter(
            agent=agent,
            trip__is_booked=True
        ).aggregate(
            total_value=Sum('ai_base_total'),
            count=Count('id')
        )
        total_quote_value = float(booked_quotes_agg['total_value'] or 0)
        booked_count = booked_quotes_agg['count']
        avg_quote_value = total_quote_value / booked_count if booked_count > 0 else 0
        
        current_month_booked_agg = Quote.objects.filter(
            agent=agent,
            trip__is_booked=True,
            created_at__gte=current_month_start,
            created_at__lt=next_month_start
        ).aggregate(
            total_value=Sum('ai_base_total'),
            count=Count('id')
        )
        current_total = float(current_month_booked_agg['total_value'] or 0)
        current_count = current_month_booked_agg['count']
        current_avg = current_total / current_count if current_count > 0 else 0
        
        previous_month_booked_agg = Quote.objects.filter(
            agent=agent,
            trip__is_booked=True,
            created_at__gte=previous_month_start,
            created_at__lt=previous_month_end
        ).aggregate(
            total_value=Sum('ai_base_total'),
            count=Count('id')
        )
        previous_total = float(previous_month_booked_agg['total_value'] or 0)
        previous_count = previous_month_booked_agg['count']
        previous_avg = previous_total / previous_count if previous_count > 0 else 0
        
        if previous_avg > 0:
            avg_quote_change_percent = ((current_avg - previous_avg) / previous_avg) * 100
        else:
            avg_quote_change_percent = 0 if current_avg == 0 else 100
        
        pending_value_agg = Quote.objects.filter(
            agent=agent,
            trip__is_booked=False
        ).exclude(status__in=['DRAFT', 'REMOVED']).aggregate(
            total=Sum('ai_base_total')
        )
        pending_value = float(pending_value_agg['total'] or 0)
        
        previous_pending_agg = Quote.objects.filter(
            agent=agent,
            trip__is_booked=False,
            created_at__lt=current_month_start
        ).exclude(status__in=['DRAFT', 'REMOVED']).aggregate(
            total=Sum('ai_base_total')
        )
        previous_pending_value = float(previous_pending_agg['total'] or 0)
        
        if previous_pending_value > 0:
            pending_change_percent = ((pending_value - previous_pending_value) / previous_pending_value) * 100
        else:
            pending_change_percent = 0 if pending_value == 0 else 100
        
        data = {
            'monthly_revenue': round(monthly_revenue, 2),
            'revenue_change_percent': round(revenue_change_percent, 2),
            'avg_quote_value': round(avg_quote_value, 2),
            'avg_quote_change_percent': round(avg_quote_change_percent, 2),
            'pending_value': round(pending_value, 2),
            'pending_change_percent': round(pending_change_percent, 2)
        }
        
        serializer = AgencyRevenueOverviewSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentSalesPipelineView(APIView):
    permission_classes = [IsAgencyAgent]
    
    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        stats = Quote.objects.filter(
            agent=agent
        ).values('status').annotate(
            count=Count('id')
        )
        
        total_quotes = sum(stat['count'] for stat in stats)
        
        status_dict = {stat['status']: stat['count'] for stat in stats}
        
        status_stats = []
        for status_code, status_label in Quote.STATUS_CHOICES:
            count = status_dict.get(status_code, 0)
            percentage = (count / total_quotes * 100) if total_quotes > 0 else 0
            status_stats.append({
                'status': status_label,
                'count': count,
                'percentage': round(percentage, 2)
            })
        
        data = {
            'quote_status_stats': status_stats
        }
        
        serializer = SalesPipelineSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuoteDetailView(APIView):
    permission_classes = [IsAgencyAgent]
    
    def get(self, request):
        quote_id = request.query_params.get('quote_id')
        agent_id = request.user.agent_profile.id
        
        if not quote_id:
            return Response(
                {'error': 'quote_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quote = Quote.objects.select_related(
                'trip', 'trip__client', 'agent', 'agent__agency'
            ).prefetch_related(
                'flights', 'hotels', 'itinerary__days__activities'
            ).get(id=quote_id, agent_id=agent_id)
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found or does not belong to this agent'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        trip = quote.trip
        client = trip.client
        agent = quote.agent
        agency = agent.agency
        
        family_members_count = client.family_members.count()
        travelers_count = 1 + family_members_count
        
        flights_total = sum(float(f.price_per_seat) for f in quote.flights.all())
        hotels_total = sum(float(h.price_total) for h in quote.hotels.all())
        
        flights_data = []
        for flight in quote.flights.all():
            flights_data.append({
                'id': flight.id,
                'flight_type': flight.flight_type,
                'travel_class': flight.travel_class,
                'price_per_seat': float(flight.price_per_seat),
                'carrier': flight.carrier,
                'carrier_logo': flight.carrier_logo,
                'flight_currency': flight.flight_currency,
                'source': flight.source,
                'departure_datetime': flight.departure_datetime,
                'departure_airport': flight.departure_airport,
                'arrival_datetime': flight.arrival_datetime,
                'arrival_airport': flight.arrival_airport,
                'duration': flight.duration,
                'stops': flight.stops,
                'baggage_include': flight.baggage_include,
                'flight_number': flight.flight_number
            })
        
        hotels_data = []
        for hotel in quote.hotels.all():
            hotels_data.append({
                'id': hotel.id,
                'name': hotel.name,
                'price_total': float(hotel.price_total),
                'hotel_currency': hotel.hotel_currency,
                'rating': float(hotel.rating) if hotel.rating else None,
                'review_count': hotel.review_count,
                'star_rating': hotel.star_rating,
                'country_code': hotel.country_code,
                'latitude': float(hotel.latitude) if hotel.latitude else None,
                'longitude': float(hotel.longitude) if hotel.longitude else None,
                'main_photo_url': hotel.main_photo_url,
                'checkin_time': hotel.checkin_time,
                'checkout_time': hotel.checkout_time,
                'room_type': hotel.room_type,
                'labels': hotel.labels,
                'source': hotel.source
            })
        
        itinerary_data = None
        try:
            itinerary = quote.itinerary
            if itinerary:
                days_data = []
                for day in itinerary.days.all():
                    activities_data = []
                    for activity in day.activities.all():
                        activities_data.append({
                            'id': activity.id,
                            'title': activity.title,
                            'description': activity.description,
                            'cost': float(activity.itineraryactivity_cost),
                            'start_time': activity.start_time,
                            'end_time': activity.end_time,
                            'date': activity.date
                        })
                    days_data.append({
                        'id': day.id,
                        'date': day.date,
                        'title': day.title,
                        'activities': activities_data
                    })
                itinerary_data = {
                    'id': itinerary.id,
                    'days': days_data
                }
        except Itinerary.DoesNotExist:
            pass
        
        flights_total = sum(float(f.price_per_seat) for f in quote.flights.all())
        hotels_total = sum(float(h.price_total) for h in quote.hotels.all())
        
        response_data = {
            'quote_id': quote.id,
            'quote_number': f'Q-{quote.id}',
            'version_number': quote.version_number,
            'status': quote.status,
            'currency': quote.currency,
            'notes': quote.notes,
            'session_id': quote.ai_session.id if quote.ai_session else None,
            'created_at': quote.created_at,
            'updated_at': quote.updated_at,
            
            'trip': {
                'id': trip.id,
                'title': trip.title,
                'start_date': trip.start_date,
                'end_date': trip.end_date,
                'destination_city': trip.destination_city,
                'destination_country': trip.destination_country,
                'destination_formatted': trip.destination_formatted,
                'from_airport': trip.from_airport,
                'to_airport': trip.to_airport,
                'is_booked': trip.is_booked
            },
            
            'traveler': {
                'id': client.id,
                'full_name': client.full_name,
                'email': client.email,
                'phone': client.phone,
                'client_type': client.client_type,
                'membership': client.membership,
                'travelers_count': travelers_count,
                'family_members_count': family_members_count
            },
            
            'flights': flights_data,
            'hotels': hotels_data,
            'itinerary': itinerary_data,
            
            'price_summary': {
                'flights_total': round(flights_total, 2),
                'hotels_total': round(hotels_total, 2),
                'ai_base_total': round(float(quote.ai_base_total), 2),
                'agent_commission_percent': round(float(quote.agent_commission_percent), 2),
                'agent_commission_amount': round(float(quote.agent_commission_amount), 2),
                'agency_commission_percent': round(float(quote.agency_commission_percent), 2),
                'agency_commission_amount': round(float(quote.agency_commission_amount), 2),
                'total_price': round(float(quote.total_price), 2)
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class PendingClientApprovalView(APIView):
    permission_classes = [IsAgencyAgent]
    
    def get(self, request):
        agent_id = request.user.agent_profile.id
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        pending_quotes = Quote.objects.filter(
            agent=agent,
            status__in=['INITIAL_CONTACT', 'QUOTE_SENT', 'IN_NEGOTIATION']
        ).select_related('trip', 'trip__client').order_by('-created_at')
        
        client_pending = {}
        for quote in pending_quotes:
            client = quote.trip.client
            if client.id not in client_pending:
                client_pending[client.id] = {
                    'client_id': client.id,
                    'client_name': client.full_name,
                    'client_email': client.email,
                    'pending_quotes': []
                }
            
            client_pending[client.id]['pending_quotes'].append({
                'quote_id': quote.id,
                'quote_number': f'Q-{quote.id}',
                'trip_title': quote.trip.title,
                'destination': quote.trip.destination_city or quote.trip.destination_country or '',
                'status': quote.status,
                'quote_value': float(quote.ai_base_total),
                'created_at': quote.created_at
            })
        
        result = list(client_pending.values())
        
        return Response({
            'total_pending_clients': len(result),
            'clients': result
        }, status=status.HTTP_200_OK)
