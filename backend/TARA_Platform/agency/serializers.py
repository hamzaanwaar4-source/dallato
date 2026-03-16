from rest_framework import serializers
from .models import Agency, Supplier
from agent.models import Client, ActivityLog, Agent, Quote, Trip, Flight, Hotel, Itinerary, ItineraryDay, ItineraryActivity
from django.db.models import Count
from datetime import datetime, timedelta
from utils.serializers import BaseModelSerializer


class AgencySerializer(BaseModelSerializer):
    admin_username = serializers.SerializerMethodField()
    admin_email = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    agents_count = serializers.SerializerMethodField()
    clients_count = serializers.SerializerMethodField()

    class Meta:
        model = Agency
        fields = [
            'id', 'name', 'slug', 'default_currency', 'default_markup_percent',
            'agent_commission', 'created_at', 'updated_at', 'is_active',
            'admin_username', 'admin_email', 'email', 'agents_count', 'clients_count'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_admin_username(self, obj):
        return obj.user.username if obj.user else 'N/A'

    def get_admin_email(self, obj):
        return obj.user.email if obj.user else 'N/A'

    def get_email(self, obj):
        return obj.user.email if obj.user else 'N/A'

    def get_agents_count(self, obj):
        if hasattr(obj, '_agents_count'):
            return obj._agents_count
        return obj.agents.count()

    def get_clients_count(self, obj):
        if hasattr(obj, '_clients_count'):
            return obj._clients_count
        return Client.objects.filter(agent__agency=obj).count()


class CreateAgencySerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    agency_name = serializers.CharField(max_length=255)
    default_currency = serializers.CharField(max_length=3, default='USD')
    default_markup_percent = serializers.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    agent_commission = serializers.DecimalField(max_digits=5, decimal_places=2, default=0.00)


class UpdateAgencySerializer(serializers.Serializer):
    default_markup_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    agent_commission = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    default_currency = serializers.CharField(max_length=3, required=False)
    is_active = serializers.BooleanField(required=False)


class ActivityLogSerializer(BaseModelSerializer):
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True)
    performer_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ['id', 'agent_name', 'agency_name', 'performer_name', 'status_code', 'message', 'created_at']

    def get_performer_name(self, obj):
        if obj.table_name == 'AGENCY' and obj.agency:
            return obj.agency.name
        if obj.agent:
            return obj.agent.name
        if obj.agency:
            return obj.agency.name
        return "System"


class CRMOverviewSerializer(serializers.Serializer):
    total_clients = serializers.IntegerField()
    new_clients = serializers.IntegerField()
    high_value_clients = serializers.IntegerField()
    recent_activities = ActivityLogSerializer(many=True)


class SupplierStatsSerializer(serializers.Serializer):
    supplier_name = serializers.CharField()
    supplier_type = serializers.CharField()
    supplier_category = serializers.CharField()
    api_status = serializers.CharField()
    commission = serializers.DecimalField(max_digits=5, decimal_places=2)
    bookings_count = serializers.IntegerField()
    usage_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
    trend_percent = serializers.DecimalField(max_digits=5, decimal_places=2)


class AgencyManagedSuppliersSerializer(serializers.Serializer):
    suppliers = SupplierStatsSerializer(many=True)


class ManageAgentsStatsSerializer(serializers.Serializer):
    total_agents = serializers.IntegerField()
    active_agents = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class AddAgentSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    location = serializers.CharField(max_length=255, required=False, allow_blank=True)
    commission = serializers.DecimalField(max_digits=5, decimal_places=2, default=0.00)


class UpdateAgentSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=20, required=False)
    location = serializers.CharField(max_length=255, required=False)
    commission = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)


class SetCommissionSerializer(serializers.Serializer):
    commission = serializers.DecimalField(max_digits=5, decimal_places=2)


class AgentAnalyticsStatsSerializer(serializers.Serializer):
    avg_revenue_per_agent = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_clients_per_agent = serializers.IntegerField()
    total_bookings = serializers.IntegerField()


class AgentPerformanceSerializer(serializers.Serializer):
    agent_name = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class AgentPerformanceLeaderboardSerializer(serializers.Serializer):
    agents = AgentPerformanceSerializer(many=True)


class ConversionRateSerializer(serializers.Serializer):
    agent_name = serializers.CharField()
    conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class QuotesGeneratedSerializer(serializers.Serializer):
    agent_name = serializers.CharField()
    quotes_count = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class RevenueDestinationSerializer(serializers.Serializer):
    destination = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    bookings_count = serializers.IntegerField()


class QuoteListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    quote_number = serializers.CharField()
    client_name = serializers.CharField()
    destination = serializers.CharField()
    quote_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    days_left = serializers.IntegerField()
    created_at = serializers.DateTimeField()


class QuoteActivityTimelineSerializer(serializers.Serializer):
    step_number = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    timestamp = serializers.DateTimeField()


class FlightDetailSerializer(BaseModelSerializer):
    class Meta:
        model = Flight
        fields = ['id', 'flight_type', 'travel_class', 'price_per_seat', 'carrier',
                  'carrier_logo', 'flight_currency', 'source', 'departure_datetime',
                  'departure_airport', 'arrival_datetime', 'arrival_airport',
                  'duration', 'stops', 'baggage_include', 'flight_number']


class HotelDetailSerializer(BaseModelSerializer):
    class Meta:
        model = Hotel
        fields = ['id', 'name', 'price_total', 'hotel_currency', 'rating',
                  'review_count', 'star_rating', 'country_code', 'latitude',
                  'longitude', 'main_photo_url', 'checkin_time', 'checkout_time',
                  'room_type', 'labels', 'source']


class ItineraryActivityDetailSerializer(BaseModelSerializer):
    class Meta:
        model = ItineraryActivity
        fields = ['id', 'title', 'description', 'itineraryactivity_cost',
                  'start_time', 'end_time', 'date']


class ItineraryDayDetailSerializer(BaseModelSerializer):
    activities = ItineraryActivityDetailSerializer(many=True, read_only=True)

    class Meta:
        model = ItineraryDay
        fields = ['id', 'date', 'title', 'activities']


class ItineraryDetailSerializer(BaseModelSerializer):
    days = ItineraryDayDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Itinerary
        fields = ['id', 'days', 'created_at']


class QuoteDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    quote_number = serializers.CharField()
    agent_name = serializers.CharField()
    agent_email = serializers.EmailField()
    client_name = serializers.CharField()
    client_email = serializers.EmailField()
    destination = serializers.CharField()
    travel_dates = serializers.CharField()
    version_number = serializers.IntegerField()
    quote_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField()
    expiry = serializers.CharField()
    quote_activity_timeline = QuoteActivityTimelineSerializer(many=True)
    flights = FlightDetailSerializer(many=True)
    hotels = HotelDetailSerializer(many=True)
    itinerary = ItineraryDetailSerializer()
    trip_title = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class AgencyRevenueOverviewSerializer(serializers.Serializer):
    monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_change_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
    avg_quote_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_quote_change_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
    pending_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_change_percent = serializers.DecimalField(max_digits=5, decimal_places=2)


class SupplierUsageTrendsSerializer(serializers.Serializer):
    supplier_name = serializers.CharField()
    total_bookings = serializers.IntegerField()
    usage_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
    trend_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
    distribution_percent = serializers.DecimalField(max_digits=5, decimal_places=2)


class QuoteStatusStatsSerializer(serializers.Serializer):
    status = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class SalesPipelineSerializer(serializers.Serializer):
    quote_status_stats = QuoteStatusStatsSerializer(many=True)


class RevenueOverviewSerializer(serializers.Serializer):
    date = serializers.DateField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)

class UpcomingDepartureSerializer(serializers.Serializer):
    """
    Serializer for upcoming departures data.
    """
    trip_id = serializers.IntegerField()
    trip_title = serializers.CharField()
    client_id = serializers.IntegerField(allow_null=True)
    client_name = serializers.CharField()
    client_email = serializers.EmailField()
    agent_id = serializers.IntegerField(allow_null=True)
    agent_name = serializers.CharField()
    destination = serializers.CharField()
    destination_country = serializers.CharField()
    departure_date = serializers.DateField()
    departure_time = serializers.TimeField(allow_null=True)
    return_date = serializers.DateField()
    days_until_departure = serializers.CharField()
    from_airport = serializers.CharField()
    to_airport = serializers.CharField()


class TopRevenueAgentSerializer(serializers.Serializer):
    agent_name = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    ai_base_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    markup_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
    commission_percent = serializers.DecimalField(max_digits=5, decimal_places=2)


class TopBookingsAgentSerializer(serializers.Serializer):
    agent_name = serializers.CharField()
    bookings = serializers.IntegerField()


class TopConversionAgentSerializer(serializers.Serializer):
    agent_name = serializers.CharField()
    conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class TopPerformingAgentsSerializer(serializers.Serializer):
    filter_applied = serializers.CharField()
    top_revenue_agent = TopRevenueAgentSerializer(allow_null=True)
    top_bookings_agent = TopBookingsAgentSerializer(allow_null=True)
    top_conversion_agent = TopConversionAgentSerializer(allow_null=True)


class AgencyDashboardStatsSerializer(serializers.Serializer):
    total_agents = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    total_quotes = serializers.IntegerField()
    conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)

class SuperAdminAgencyListSerializer(serializers.Serializer):
    """
    Serializer for super admin agency list.
    """
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()

class SuperAdminHotelListingSerializer(serializers.Serializer):
    """
    Serializer for super admin hotel listing with aggregated booking data.
    """
    hotel_name = serializers.CharField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, allow_null=True)
    total_bookings = serializers.IntegerField()
    booked_dates = serializers.ListField(child=serializers.DateField())
    agencies = serializers.ListField(child=serializers.DictField())
    source = serializers.CharField()


class SuperAdminFlightListingSerializer(serializers.Serializer):
    """
    Serializer for super admin flight listing with aggregated booking data.
    """
    carrier = serializers.CharField()
    flight_number = serializers.CharField()
    total_bookings = serializers.IntegerField()
    booked_dates = serializers.ListField(child=serializers.DateField())
    agencies = serializers.ListField(child=serializers.DictField())
    source = serializers.CharField()


class HotelBookingDetailSerializer(serializers.Serializer):
    """Individual booking detail for a hotel"""
    booking_id = serializers.IntegerField()
    quote_id = serializers.CharField()
    quote_number = serializers.CharField()
    agency_name = serializers.CharField()
    agency_id = serializers.IntegerField()
    client_name = serializers.CharField()
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    nights = serializers.IntegerField()
    room_type = serializers.CharField(allow_null=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    booked_date = serializers.DateTimeField()
    status = serializers.CharField()


class SuperAdminHotelDetailSerializer(serializers.Serializer):
    """Detailed hotel information with all bookings"""
    id = serializers.IntegerField()
    hotel_name = serializers.CharField()
    hotel_image = serializers.CharField(allow_null=True)
    address = serializers.CharField(allow_null=True)
    country = serializers.CharField(allow_null=True)
    country_code = serializers.CharField(allow_null=True)
    star_rating = serializers.IntegerField(allow_null=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, allow_null=True)
    review_count = serializers.IntegerField(allow_null=True)
    total_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    source = serializers.CharField()
    bookings = HotelBookingDetailSerializer(many=True)


class FlightBookingDetailSerializer(serializers.Serializer):
    """Individual booking detail for a flight"""
    booking_id = serializers.IntegerField()
    quote_id = serializers.CharField()
    quote_number = serializers.CharField()
    agency_name = serializers.CharField()
    agency_id = serializers.IntegerField()
    client_name = serializers.CharField()
    departure_airport = serializers.CharField()
    arrival_airport = serializers.CharField()
    departure_date = serializers.DateField()
    departure_time = serializers.TimeField(allow_null=True)
    arrival_date = serializers.DateField(allow_null=True)
    arrival_time = serializers.TimeField(allow_null=True)
    cabin_class = serializers.CharField(allow_null=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    booked_date = serializers.DateTimeField()
    status = serializers.CharField()


class SuperAdminFlightDetailSerializer(serializers.Serializer):
    """Detailed flight information with all bookings"""
    id = serializers.IntegerField()
    carrier = serializers.CharField()
    carrier_logo = serializers.CharField(allow_null=True)
    flight_number = serializers.CharField()
    aircraft_type = serializers.CharField(allow_null=True)
    total_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    source = serializers.CharField()
    bookings = FlightBookingDetailSerializer(many=True)

