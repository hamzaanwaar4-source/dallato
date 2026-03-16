from rest_framework import serializers
from .models import AIMessage, AIChatSession

class TripPlanRequestSerializer(serializers.Serializer):
    """
    Validates incoming trip planning requests
    message: User's trip planning request
    history: Optional conversation history for context
    client_name: Optional name of the client to personalize the conversation
    checkin_date: Check-in date for itinerary building
    origin: Departure city or airport code
    destination: Destination name for itinerary building
    checkout_date: Check-out date for itinerary building
    """
    message = serializers.CharField(required=True, max_length=5000)
    client_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        max_length=50
    )
    
    checkin_date = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    origin = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    destination = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    checkout_date = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class FlightSearchSerializer(serializers.Serializer):
    """Validates flight search requests"""
    dest_name = serializers.CharField(required=True)
    from_airport = serializers.CharField(required=True)
    to_airport = serializers.CharField(required=True)
    depart_date = serializers.CharField(required=True)
    return_date = serializers.CharField(required=True)
    adults = serializers.IntegerField(required=False)


class HotelSearchSerializer(serializers.Serializer):
    """Validates hotel search requests"""
    dest_name = serializers.CharField(required=True)
    to_airport = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    checkin = serializers.CharField(required=True)
    checkout = serializers.CharField(required=True)
    adults = serializers.IntegerField(required=False)


class ItineraryBuildSerializer(serializers.Serializer):
    """Validates itinerary building requests"""
    dest_name = serializers.CharField(required=True)
    checkin = serializers.CharField(required=True)
    checkout = serializers.CharField(required=True)

class PersistentTripPlanRequestSerializer(serializers.Serializer):
    message = serializers.CharField(required=True, max_length=5000)
    session_id = serializers.IntegerField(required=False, allow_null=True)


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ["id", "sender", "text", "metadata", "created_at"]


class AIChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatSession
        fields = ["id", "title", "created_at", "updated_at"]

class PlanChatRequestSerializer(serializers.Serializer):
    """Validates incoming plan chat requests"""
    message = serializers.CharField(required=True, max_length=5000)
    session_id = serializers.IntegerField(required=False, allow_null=True)


class TravelInsightsSerializer(serializers.Serializer):
    """Serializer for Travel Insights API request"""
    origin = serializers.CharField(
        max_length=100,
        required=True,
        help_text="Origin city or country (e.g., 'Indonesia', 'Jakarta')"
    )
    destination = serializers.CharField(
        max_length=100,
        required=True,
        help_text="Destination city or country (e.g., 'Chicago', 'USA')"
    )
    departure_date = serializers.DateField(
        required=True,
        help_text="Departure date in YYYY-MM-DD format"
    )
    return_date = serializers.DateField(
        required=True,
        help_text="Return date in YYYY-MM-DD format"
    )

    def validate(self, data):
        """Validate that return date is after departure date"""
        if data['return_date'] <= data['departure_date']:
            raise serializers.ValidationError(
                "Return date must be after departure date"
            )
        return data
