from django.db import models
from django.conf import settings


class Agent(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agent_profile',
        blank=True,
        null=True
    )
    agency = models.ForeignKey(
        'agency.Agency',
        on_delete=models.CASCADE,
        related_name='agents'
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    commission_client_wise = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'agent'

    def __str__(self):
        return self.name


class Client(models.Model):
    CLIENT_TYPE_CHOICES = [
        ('SINGLE', 'Single'),
        ('COUPLE', 'Couple'),
        ('FAMILY_FRIENDS', 'Family/Friends'),
        ('CORPORATE', 'Corporate'),
    ]

    TRAVEL_STYLE_CHOICES = [
        ('LUXURY', 'Luxury'),
        ('BUDGET', 'Budget'),
        ('ADVENTURE', 'Adventure'),
        ('BUSINESS', 'Business'),
        ('FAMILY', 'Family'),
    ]

    MEMBERSHIP_CHOICES = [
        ('GOLD', 'Gold'),
        ('SILVER', 'Silver'),
        ('PLATINUM', 'Platinum'),
    ]

    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name='clients'
    )
    full_name = models.CharField(max_length=255)
    dob = models.DateField(blank=True, null=True)
    client_type = models.CharField(max_length=20, choices=CLIENT_TYPE_CHOICES)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    travel_date = models.DateField(blank=True, null=True)
    destination = models.CharField(max_length=255, blank=True, null=True)
    origin = models.CharField(max_length=255, blank=True, null=True)
    budget_range = models.CharField(max_length=100, blank=True, null=True)
    travel_style = models.CharField(max_length=20, choices=TRAVEL_STYLE_CHOICES, blank=True, null=True)
    membership = models.CharField(max_length=20, choices=MEMBERSHIP_CHOICES, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'client'

    def __str__(self):
        return self.full_name


class ClientFamilyMember(models.Model):
    RELATION_CHOICES = [
        ('SPOUSE', 'Spouse'),
        ('CHILD', 'Child'),
        ('FRIEND', 'Friend'),
        ('RELATIVE', 'Relative'),
        ('COLLEAGUE', 'Colleague'),
    ]

    AGE_GROUP_CHOICES = [
        ('ADULT', 'Adult'),
        ('CHILD', 'Child'),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='family_members'
    )
    full_name = models.CharField(max_length=255)
    relation = models.CharField(max_length=20, choices=RELATION_CHOICES)
    age_group = models.CharField(max_length=10, choices=AGE_GROUP_CHOICES)

    class Meta:
        db_table = 'client_family_member'

    def __str__(self):
        return f"{self.full_name} ({self.relation})"


class Trip(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='trips'
    )
    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name='trips'
    )
    title = models.CharField(max_length=255)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    to_airport = models.CharField(max_length=10, blank=True, null=True)
    from_airport = models.CharField(max_length=10, blank=True, null=True)
    is_booked = models.BooleanField(default=False)
    destination_city = models.CharField(max_length=255, blank=True, null=True)
    destination_country = models.CharField(max_length=255, blank=True, null=True)
    destination_country_code = models.CharField(max_length=5, blank=True, null=True)
    destination_formatted = models.TextField(blank=True, null=True)
    destination_latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    destination_longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    geocoding_confidence = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trip'

    def __str__(self):
        return self.title
    
    def geocode_destination(self):
        from .geocoding import GeoapifyGeocoder
        
        if not self.destination_city and not self.destination_country:
            return False
            
        geocoder = GeoapifyGeocoder()
        location_data = geocoder.geocode_destination(
            destination=self.destination_city or self.destination_country,
            country=None
        )
        
        if location_data:
            self.destination_latitude = location_data['lat']
            self.destination_longitude = location_data['lon']
            self.destination_city = location_data['city'] or self.destination_city
            self.destination_country = location_data['country'] or self.destination_country
            self.destination_country_code = location_data['country_code']
            self.destination_formatted = location_data['formatted']
            self.geocoding_confidence = location_data.get('confidence', 0)
            return True
        return False


class Quote(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('INITIAL_CONTACT', 'Initial Contact'),
        ('QUOTE_SENT', 'Quote Sent'),
        ('IN_NEGOTIATION', 'In Negotiation'),
        ('CONFIRMED', 'Confirmed'),
        ('REMOVED', 'Removed'),
    ]

    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='quotes'
    )
    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name='quotes'
    )
    ai_session = models.ForeignKey(
        'chatbot.AIChatSession',
        on_delete=models.SET_NULL,
        related_name='quotes',
        null=True,
        blank=True
    )
    version_number = models.IntegerField(default=1)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    ai_base_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    agent_commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    agent_commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    agency_commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    agency_commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quote'
        unique_together = ['trip', 'version_number']

    def __str__(self):
        return f"Quote v{self.version_number} for {self.trip.title}"
    
    def calculate_commissions(self):
        client = self.trip.client
        agent = self.agent
        agency = agent.agency
        
        client_commission_percent = client.commission_percent
        self.agent_commission_percent = client_commission_percent
        agent_commission_total = (self.ai_base_total * client_commission_percent) / 100
        
        agency_commission_percent = agency.agent_commission
        self.agency_commission_percent = agency_commission_percent
        self.agency_commission_amount = (agent_commission_total * agency_commission_percent) / 100
        
        self.agent_commission_amount = agent_commission_total - self.agency_commission_amount
        
        self.total_price = self.ai_base_total + self.agent_commission_amount + self.agency_commission_amount
        
        self.save()
        return {
            'ai_base_total': float(self.ai_base_total),
            'agent_commission_percent': float(self.agent_commission_percent),
            'agent_commission_amount': float(self.agent_commission_amount),
            'agency_commission_percent': float(self.agency_commission_percent),
            'agency_commission_amount': float(self.agency_commission_amount),
            'total_price': float(self.total_price)
        }


class Flight(models.Model):
    FLIGHT_TYPE_CHOICES = [
        ('OUTBOUND', 'Outbound'),
        ('RETURN', 'Return'),
    ]

    TRAVEL_CLASS_CHOICES = [
        ('ECONOMY', 'Economy'),
        ('BUSINESS', 'Business'),
        ('FIRST', 'First'),
    ]

    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name='flights'
    )
    flight_type = models.CharField(max_length=10, choices=FLIGHT_TYPE_CHOICES)
    travel_class = models.CharField(max_length=10, choices=TRAVEL_CLASS_CHOICES)
    price_per_seat = models.DecimalField(max_digits=10, decimal_places=2)
    carrier = models.CharField(max_length=100, blank=True, null=True)
    carrier_logo = models.URLField(blank=True, null=True)
    flight_currency = models.CharField(max_length=3, default='USD')
    source = models.CharField(max_length=50, default='Duffel')
    departure_datetime = models.DateTimeField(blank=True, null=True)
    departure_airport = models.CharField(max_length=10, blank=True, null=True)
    arrival_datetime = models.DateTimeField(blank=True, null=True)
    arrival_airport = models.CharField(max_length=10, blank=True, null=True)
    duration = models.CharField(max_length=20, blank=True, null=True)
    stops = models.IntegerField(default=0)
    baggage_include = models.CharField(max_length=255, blank=True, null=True)
    flight_number = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'flight'

    def __str__(self):
        return f"{self.carrier} {self.flight_number} - {self.flight_type}"


class Hotel(models.Model):
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name='hotels'
    )
    name = models.CharField(max_length=255)
    price_total = models.DecimalField(max_digits=10, decimal_places=2)
    hotel_currency = models.CharField(max_length=3, default='USD')
    rating = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    review_count = models.IntegerField(blank=True, null=True)
    star_rating = models.IntegerField(blank=True, null=True)
    country_code = models.CharField(max_length=2, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    main_photo_url = models.URLField(blank=True, null=True)
    checkin_time = models.TimeField(blank=True, null=True)
    checkout_time = models.TimeField(blank=True, null=True)
    room_type = models.JSONField(default=list, blank=True)
    labels = models.JSONField(default=list, blank=True)
    source = models.CharField(max_length=50, default='Booking.com')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hotel'

    def __str__(self):
        return self.name


class Itinerary(models.Model):
    quote = models.OneToOneField(
        Quote,
        on_delete=models.CASCADE,
        related_name='itinerary'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'itinerary'
        verbose_name_plural = 'Itineraries'

    def __str__(self):
        return f"Itinerary for {self.quote}"


class ItineraryDay(models.Model):
    itinerary = models.ForeignKey(
        Itinerary,
        on_delete=models.CASCADE,
        related_name='days'
    )
    date = models.DateField()
    title = models.CharField(max_length=255)

    class Meta:
        db_table = 'itinerary_day'
        ordering = ['date']

    def __str__(self):
        return f"{self.date} - {self.title}"


class ItineraryActivity(models.Model):
    itinerary_day = models.ForeignKey(
        ItineraryDay,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    itineraryactivity_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    date = models.DateField()

    class Meta:
        db_table = 'itinerary_activity'
        verbose_name_plural = 'Itinerary Activities'
        ordering = ['date', 'start_time']

    def __str__(self):
        return self.title


class ActivityLog(models.Model):
    TABLE_NAME_CHOICES = [
        ('AGENT', 'Agent'),
        ('AGENCY', 'Agency'),
        ('CLIENT', 'Client'),
        ('TRIP', 'Trip'),
        ('QUOTE', 'Quote'),
        ('FLIGHT', 'Flight'),
        ('HOTEL', 'Hotel'),
        ('ITINERARY', 'Itinerary'),
        ('USER', 'User'),
        ('SUPPLIER', 'Supplier'),
    ]
    
    agency = models.ForeignKey(
        'agency.Agency',
        on_delete=models.CASCADE,
        related_name='activity_logs',
        blank=True,
        null=True
    )
    agent = models.ForeignKey(
        Agent,
        on_delete=models.SET_NULL,
        related_name='activity_logs',
        blank=True,
        null=True
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        related_name='activity_logs',
        blank=True,
        null=True
    )
    table_name = models.CharField(max_length=20, choices=TABLE_NAME_CHOICES, blank=True, null=True)
    status_code = models.IntegerField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'activity_log'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status_code}] {self.message[:50]}"
