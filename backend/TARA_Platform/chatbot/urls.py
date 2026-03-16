from django.urls import path
from .views import FlightSearchView, HotelSearchView, ItineraryBuildView, PlanChatView, TravelInsightsView, ChatHistoryView
from .destination_suggestions import DestinationSuggestionsView

urlpatterns = [
    path('plan/', PlanChatView.as_view(), name='plan-chat'),
    path('flights/', FlightSearchView.as_view(), name='search-flights'),
    path('hotels/', HotelSearchView.as_view(), name='search-hotels'),
    path('itinerary/', ItineraryBuildView.as_view(), name='build-itinerary'),
    path('destination-suggestions/', DestinationSuggestionsView.as_view(), name='destination-suggestions'),
    path('travel-insights/', TravelInsightsView.as_view(), name='travel-insights'),
    path('chat-history/', ChatHistoryView.as_view(), name='chat-history'),
]
