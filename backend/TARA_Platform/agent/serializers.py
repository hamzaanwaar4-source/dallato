from rest_framework import serializers
from .models import Agent, Client, ClientFamilyMember, Trip, Quote, ActivityLog
from datetime import datetime, date
from utils.serializers import BaseModelSerializer
from agency.serializers import (
    RevenueOverviewSerializer,
    QuoteStatusStatsSerializer,
    SalesPipelineSerializer,
)


class AgentSerializer(BaseModelSerializer):
    agent_id = serializers.IntegerField(source='id', read_only=True)
    commission = serializers.DecimalField(
        source='commission_client_wise', max_digits=5, decimal_places=2, read_only=True
    )
    commission_percent = serializers.DecimalField(
        source='commission_client_wise', max_digits=5, decimal_places=2, read_only=True
    )
    default_commission = serializers.DecimalField(
        source='commission_client_wise', max_digits=5, decimal_places=2, read_only=True
    )
    status = serializers.SerializerMethodField()
    clients_count = serializers.SerializerMethodField()
    top_destination = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = [
            'id', 'agent_id', 'name', 'email', 'phone', 'location',
            'commission', 'commission_percent', 'default_commission',
            'status', 'clients_count', 'top_destination',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'phone' in data and data['phone'] is None:
            data['phone'] = ''
        if 'location' in data and data['location'] is None:
            data['location'] = ''
        return data

    def get_status(self, obj):
        if obj.user:
            return 'Active' if obj.user.is_active else 'Inactive'
        return 'Inactive'

    def get_clients_count(self, obj):
        if hasattr(obj, '_clients_count'):
            return obj._clients_count
        return obj.clients.count()

    def get_top_destination(self, obj):
        from django.db.models import Count
        result = obj.clients.exclude(
            destination__isnull=True
        ).exclude(destination='').values('destination').annotate(
            count=Count('destination')
        ).order_by('-count').first()
        return result['destination'] if result else '-'


class UpdateAgentSettingsSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    location = serializers.CharField(required=False)
    default_commission = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)


class ClientFamilyMemberSerializer(BaseModelSerializer):
    class Meta:
        model = ClientFamilyMember
        fields = ['id', 'full_name', 'relation', 'age_group']


class ClientSerializer(BaseModelSerializer):
    location = serializers.CharField(source='origin', read_only=True, default='')
    upcoming_trips = serializers.SerializerMethodField()
    past_trips = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    family_members = ClientFamilyMemberSerializer(many=True, read_only=True)
    recent_activity = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'full_name', 'email', 'phone', 'client_type', 'travel_style',
            'membership', 'destination', 'created_at',
            'dob', 'travel_date', 'origin', 'location', 'budget_range',
            'notes', 'commission_percent',
            'upcoming_trips', 'past_trips', 'total_revenue',
            'family_members', 'recent_activity'
        ]
        read_only_fields = ('id', 'created_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        nullable_to_empty = [
            'phone', 'travel_style', 'destination', 'membership',
            'origin', 'location', 'budget_range', 'notes'
        ]
        for field in nullable_to_empty:
            if field in data and data[field] is None:
                data[field] = ''
        return data

    def get_upcoming_trips(self, obj):
        return obj.trips.filter(start_date__gte=date.today()).count()

    def get_past_trips(self, obj):
        return obj.trips.filter(start_date__lt=date.today()).count()

    def get_total_revenue(self, obj):
        quotes = Quote.objects.filter(trip__client=obj, status='CONFIRMED')
        total = sum(float(q.agent_commission_amount) for q in quotes)
        return format(total, '.2f')

    def get_recent_activity(self, obj):
        logs = ActivityLog.objects.filter(
            agent=obj.agent, client=obj
        ).order_by('-created_at')[:5]
        return [
            {
                'message': log.message,
                'timestamp': log.created_at,
                'status_code': log.status_code
            }
            for log in logs
        ]


class CreateClientFamilyMemberSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    relation = serializers.ChoiceField(choices=['SPOUSE', 'CHILD', 'FRIEND', 'RELATIVE', 'COLLEAGUE'])
    age_group = serializers.ChoiceField(choices=['ADULT', 'CHILD'])


class CreateClientSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    dob = serializers.DateField(required=False, allow_null=True)
    client_type = serializers.ChoiceField(choices=['SINGLE', 'COUPLE', 'FAMILY_FRIENDS', 'CORPORATE'])
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    travel_date = serializers.DateField(required=False, allow_null=True)
    destination = serializers.CharField(max_length=255, required=False, allow_blank=True)
    origin = serializers.CharField(max_length=255, required=False, allow_blank=True)
    budget_range = serializers.CharField(max_length=100, required=False, allow_blank=True)
    travel_style = serializers.ChoiceField(
        choices=['LUXURY', 'BUDGET', 'ADVENTURE', 'BUSINESS', 'FAMILY'],
        required=False,
        allow_blank=True
    )
    membership = serializers.ChoiceField(
        choices=['GOLD', 'SILVER', 'PLATINUM'],
        required=False,
        allow_blank=True,
        allow_null=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    commission_percent = serializers.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    family_members = CreateClientFamilyMemberSerializer(many=True, required=False)


class UpdateClientSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, required=False)
    dob = serializers.DateField(required=False, allow_null=True)
    client_type = serializers.ChoiceField(
        choices=['SINGLE', 'COUPLE', 'FAMILY_FRIENDS', 'CORPORATE'],
        required=False
    )
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=20, required=False)
    travel_date = serializers.DateField(required=False, allow_null=True)
    destination = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=255)
    origin = serializers.CharField(required=False, allow_blank=True, max_length=255)
    budget_range = serializers.CharField(required=False, allow_blank=True, max_length=100)
    travel_style = serializers.ChoiceField(
        choices=['LUXURY', 'BUDGET', 'ADVENTURE', 'BUSINESS', 'FAMILY'],
        required=False
    )
    membership = serializers.ChoiceField(
        choices=['GOLD', 'SILVER', 'PLATINUM'],
        required=False,
        allow_null=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    commission_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)


class TripListSerializer(BaseModelSerializer):
    class Meta:
        model = Trip
        fields = ['id', 'title', 'start_date', 'end_date', 'destination_city',
                  'destination_country', 'is_booked', 'created_at']


class QuoteListSerializer(BaseModelSerializer):
    quote_number = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = ['id', 'quote_number', 'version_number', 'currency', 'status',
                  'ai_base_total', 'agent_commission_percent', 'agent_commission_amount',
                  'agency_commission_percent', 'agency_commission_amount', 'total_price',
                  'created_at', 'updated_at']
    
    def get_quote_number(self, obj):
        return f'Q-{obj.id}'


class UpdateQuoteStatusSerializer(serializers.Serializer):
    quote_id = serializers.IntegerField()
    status = serializers.ChoiceField(
        choices=['DRAFT', 'INITIAL_CONTACT', 'QUOTE_SENT', 'IN_NEGOTIATION', 'CONFIRMED', 'REMOVED']
    )


class ClientNotesSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    notes = serializers.ListField()


class FlightSerializer(serializers.Serializer):
    flight_type = serializers.ChoiceField(choices=['OUTBOUND', 'RETURN'])
    travel_class = serializers.ChoiceField(choices=['ECONOMY', 'BUSINESS', 'FIRST'])
    price_per_seat = serializers.DecimalField(max_digits=10, decimal_places=2)
    carrier = serializers.CharField(required=False, allow_blank=True)
    carrier_logo = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    flight_currency = serializers.CharField(max_length=3, default='USD')
    source = serializers.CharField(max_length=50, default='Duffel')
    departure_datetime = serializers.DateTimeField(required=False, allow_null=True)
    departure_airport = serializers.CharField(max_length=10, required=False, allow_blank=True)
    arrival_datetime = serializers.DateTimeField(required=False, allow_null=True)
    arrival_airport = serializers.CharField(max_length=10, required=False, allow_blank=True)
    duration = serializers.CharField(max_length=20, required=False, allow_blank=True)
    stops = serializers.IntegerField(default=0)
    baggage_include = serializers.CharField(max_length=255, required=False, allow_blank=True)
    flight_number = serializers.CharField(max_length=50, required=False, allow_blank=True)


class HotelSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    price_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    hotel_currency = serializers.CharField(max_length=3, default='USD')
    rating = serializers.DecimalField(max_digits=3, decimal_places=2, required=False, allow_null=True)
    review_count = serializers.IntegerField(required=False, allow_null=True)
    star_rating = serializers.IntegerField(required=False, allow_null=True)
    country_code = serializers.CharField(max_length=2, required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)
    main_photo_url = serializers.URLField(required=False, allow_blank=True)
    checkin_time = serializers.TimeField(required=False, allow_null=True)
    checkout_time = serializers.TimeField(required=False, allow_null=True)
    room_type = serializers.ListField(required=False)
    labels = serializers.ListField(required=False)
    source = serializers.CharField(max_length=50, default='Booking.com')


class ItineraryActivitySerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    itineraryactivity_cost = serializers.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    date = serializers.DateField()


class ItineraryDaySerializer(serializers.Serializer):
    date = serializers.DateField()
    title = serializers.CharField(max_length=255)
    activities = ItineraryActivitySerializer(many=True, required=False)


class ItinerarySerializer(serializers.Serializer):
    days = ItineraryDaySerializer(many=True, required=False)


class SaveTripDataSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    session_id = serializers.IntegerField(required=False, allow_null=True)
    trip_title = serializers.CharField(max_length=255)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    destination_city = serializers.CharField(max_length=255, required=False, allow_blank=True)
    destination_country = serializers.CharField(max_length=255, required=False, allow_blank=True)
    destination_formatted = serializers.CharField(required=False, allow_blank=True)
    destination_latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False, allow_null=True)
    destination_longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)
    to_airport = serializers.CharField(max_length=10, required=False, allow_blank=True)
    from_airport = serializers.CharField(max_length=10, required=False, allow_blank=True)
    traveler_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    traveler_email = serializers.EmailField(required=False, allow_blank=True)
    traveler_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    currency = serializers.CharField(max_length=3, default='USD')
    ai_base_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    flights = FlightSerializer(many=True, required=False)
    hotels = HotelSerializer(many=True, required=False)
    itinerary = ItinerarySerializer(required=False, allow_null=True)


class ManagedBookingSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    client_name = serializers.CharField()
    client_email = serializers.EmailField()
    quote_id = serializers.IntegerField()
    quote_number = serializers.CharField()
    version_number = serializers.IntegerField(required=False, default=1)
    destination = serializers.CharField()
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    created_at = serializers.DateTimeField()


class PendingQuoteSerializer(serializers.Serializer):
    quote_id = serializers.IntegerField()
    quote_number = serializers.CharField()
    client_id = serializers.IntegerField()
    client_name = serializers.CharField()
    destination = serializers.CharField()
    status = serializers.CharField()
    version_number = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    trip_title = serializers.CharField()


class UpdateTripDataSerializer(serializers.Serializer):
    trip_id = serializers.IntegerField()
    session_id = serializers.IntegerField(required=False, allow_null=True)
    trip_title = serializers.CharField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    destination_city = serializers.CharField(max_length=255, required=False)
    destination_country = serializers.CharField(max_length=255, required=False)
    destination_formatted = serializers.CharField(required=False)
    destination_latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False)
    destination_longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False)
    to_airport = serializers.CharField(max_length=10, required=False)
    from_airport = serializers.CharField(max_length=10, required=False)
    currency = serializers.CharField(max_length=3, required=False)
    ai_base_total = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    flights = FlightSerializer(many=True, required=False)
    hotels = HotelSerializer(many=True, required=False)
    itinerary = ItinerarySerializer(required=False)


class DashboardAnalyticsSerializer(serializers.Serializer):
    total_quotes = serializers.IntegerField()
    clients_this_month = serializers.IntegerField()
    confirmed_bookings = serializers.IntegerField()
    conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_yield = serializers.DecimalField(max_digits=12, decimal_places=2)


class UpcomingDepartureSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    client_name = serializers.CharField()
    destination = serializers.CharField()
    destination_country = serializers.CharField()
    departure_date = serializers.DateField()
    departure_time = serializers.TimeField()
    return_date = serializers.DateField()
    days_until_departure = serializers.CharField()
    trip_title = serializers.CharField()
    from_airport = serializers.CharField()
    to_airport = serializers.CharField()
    quote_id = serializers.IntegerField(required=False, allow_null=True)
    trip_id = serializers.IntegerField(required=False, allow_null=True)


class BookingMapSerializer(serializers.Serializer):
    destination_city = serializers.CharField()
    destination_country = serializers.CharField()
    destination_formatted = serializers.CharField()
    destination_latitude = serializers.DecimalField(max_digits=10, decimal_places=8)
    destination_longitude = serializers.DecimalField(max_digits=11, decimal_places=8)
    booking_count = serializers.IntegerField()


class RevenueOverviewSerializer(serializers.Serializer):
    date = serializers.DateField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class TopDestinationSerializer(serializers.Serializer):
    destination = serializers.CharField()
    destination_country = serializers.CharField()
    booking_count = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class TodoQuoteSerializer(serializers.Serializer):
    quote_id = serializers.IntegerField()
    quote_number = serializers.CharField()
    client_id = serializers.IntegerField()
    client_name = serializers.CharField()
    client_email = serializers.EmailField()
    destination = serializers.CharField()
    trip_title = serializers.CharField()
    quote_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    days_pending = serializers.IntegerField()
    travel_date = serializers.DateField()


class AgentRecentActivitySerializer(serializers.Serializer):
    activity_type = serializers.CharField()
    message = serializers.CharField()
    client_name = serializers.CharField()
    timestamp = serializers.DateTimeField()
    related_id = serializers.IntegerField()
