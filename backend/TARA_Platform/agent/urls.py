from django.urls import path
from .views import (
    AgentSettingsView, AgentClientsListView, ClientDetailView,
    CreateClientView, ClientPastTripsView, ClientUpcomingTripsView,
    ClientQuotesView, ClientNotesView, DeleteClientView, UpdateClientView,
    SaveTripDataView, ManagedBookingsView, MarkQuoteAsBookedView, PendingQuotesView,
    UpdateTripDataView, DeleteTripDataView, DashboardAnalyticsView,
    UpcomingDeparturesView, BookingsMapView, RevenueOverviewView, TopDestinationsView,
    TodoListView, AgentRecentActivityView, AgentRevenueOverviewView, AgentSalesPipelineView,
    QuoteDetailView, PendingClientApprovalView, UpdateQuoteStatusView
)
from .quote_notes_views import QuoteNotesView

urlpatterns = [
    #settings page
    path('settings/', AgentSettingsView.as_view(), name='agent-settings'),
    
    #clients page
    path('clients/list/', AgentClientsListView.as_view(), name='agent-clients-list'),
    path('clients/detail/', ClientDetailView.as_view(), name='client-detail'),
    path('clients/create/', CreateClientView.as_view(), name='create-client'),
    path('clients/update/', UpdateClientView.as_view(), name='update-client'),
    path('clients/delete/', DeleteClientView.as_view(), name='delete-client'),
    path('clients/past-trips/', ClientPastTripsView.as_view(), name='client-past-trips'),
    path('clients/upcoming-trips/', ClientUpcomingTripsView.as_view(), name='client-upcoming-trips'),
    path('clients/quotes/', ClientQuotesView.as_view(), name='client-quotes'),
    path('clients/notes/', ClientNotesView.as_view(), name='client-notes'),
    
    #quote assistant page
    path('trips/save/', SaveTripDataView.as_view(), name='save-trip-data'),
    path('trips/update/', UpdateTripDataView.as_view(), name='update-trip-data'),
    path('trips/delete/', DeleteTripDataView.as_view(), name='delete-trip-data'),
    
    #manage bookings page
    path('bookings/managed/', ManagedBookingsView.as_view(), name='managed-bookings'),
    path('bookings/mark-booked/', MarkQuoteAsBookedView.as_view(), name='mark-quote-booked'),
    
    #quotes page
    path('quotes/pending/', PendingQuotesView.as_view(), name='pending-quotes'),
    path('quotes/detail/', QuoteDetailView.as_view(), name='quote-detail'),
    path('quotes/notes/', QuoteNotesView.as_view(), name='quote-notes'),
    path('quotes/update-status/', UpdateQuoteStatusView.as_view(), name='update-quote-status'),
    
    #dashboard
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
    path('dashboard/upcoming-departures/', UpcomingDeparturesView.as_view(), name='upcoming-departures'),
    path('dashboard/bookings-map/', BookingsMapView.as_view(), name='bookings-map'),
    path('dashboard/revenue-overview/', RevenueOverviewView.as_view(), name='revenue-overview'),
    path('dashboard/top-destinations/', TopDestinationsView.as_view(), name='top-destinations'),
    path('dashboard/agent-revenue-overview/', AgentRevenueOverviewView.as_view(), name='agent-revenue-overview'),
    path('dashboard/sales-pipeline/', AgentSalesPipelineView.as_view(), name='agent-sales-pipeline'),
    path('dashboard/pending-approvals/', PendingClientApprovalView.as_view(), name='pending-approvals'),
    
    # todo list and activity
    path('todo-list/', TodoListView.as_view(), name='todo-list'),
    path('recent-activity/', AgentRecentActivityView.as_view(), name='recent-activity'),
]
