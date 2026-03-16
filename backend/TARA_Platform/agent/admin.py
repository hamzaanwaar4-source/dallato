from django.contrib import admin
from .models import (
    Agent, Client, ClientFamilyMember, Trip, Quote,
    Flight, Hotel, Itinerary, ItineraryDay, ItineraryActivity, ActivityLog
)


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'agency', 'location', 'commission_client_wise']
    list_filter = ['agency', 'created_at']
    search_fields = ['name', 'email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'client_type', 'agent', 'travel_style', 'destination', 'travel_date']
    list_filter = ['client_type', 'travel_style', 'created_at']
    search_fields = ['full_name', 'email', 'destination']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ClientFamilyMember)
class ClientFamilyMemberAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'client', 'relation', 'age_group']
    list_filter = ['relation', 'age_group']
    search_fields = ['full_name', 'client__full_name']


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'agent', 'start_date', 'end_date', 'is_booked']
    list_filter = ['is_booked', 'created_at']
    search_fields = ['title', 'client__full_name', 'destination_city']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['trip', 'version_number', 'status', 'currency', 'ai_base_total', 'agent']
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['trip__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ['quote', 'flight_type', 'carrier', 'flight_number', 'departure_airport', 'arrival_airport', 'price_per_seat']
    list_filter = ['flight_type', 'travel_class', 'carrier']
    search_fields = ['flight_number', 'carrier']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ['name', 'quote', 'star_rating', 'price_total', 'hotel_currency']
    list_filter = ['star_rating', 'country_code']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


class ItineraryDayInline(admin.TabularInline):
    model = ItineraryDay
    extra = 0


@admin.register(Itinerary)
class ItineraryAdmin(admin.ModelAdmin):
    list_display = ['quote', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ItineraryDayInline]


class ItineraryActivityInline(admin.TabularInline):
    model = ItineraryActivity
    extra = 0


@admin.register(ItineraryDay)
class ItineraryDayAdmin(admin.ModelAdmin):
    list_display = ['itinerary', 'date', 'title']
    list_filter = ['date']
    search_fields = ['title']
    inlines = [ItineraryActivityInline]


@admin.register(ItineraryActivity)
class ItineraryActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'itinerary_day', 'date', 'start_time', 'end_time', 'itineraryactivity_cost']
    list_filter = ['date']
    search_fields = ['title', 'description']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['status_code', 'message_short', 'agent', 'created_at']
    list_filter = ['status_code', 'created_at']
    search_fields = ['message']
    readonly_fields = ['created_at', 'updated_at']
    
    def message_short(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_short.short_description = 'Message'
