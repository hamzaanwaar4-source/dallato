from django.urls import path
from .views import *

urlpatterns = [
    path('create/', CreateAgencyView.as_view(), name='create-agency'),
    path('update/', UpdateAgencyView.as_view(), name='update-agency'),
    path('delete/', DeleteAgencyView.as_view(), name='delete-agency'),
    path('list/', ListAgenciesView.as_view(), name='list-agencies'),
    path('toggle-status/', ToggleStatusView.as_view(), name='toggle-status'),
    
    # Agency Admin endpoints
    path('crm-overview/', CRMOverviewView.as_view(), name='crm-overview'),
    
    path('managed-suppliers/', AgencyManagedSuppliersView.as_view(), name='managed-suppliers'),
    
    path('revenue-overview/', AgencyRevenueOverviewView.as_view(), name='agency-revenue-overview'),
    path('revenue-overview-agency-wide/', AgencyWideRevenueOverviewView.as_view(), name='agency-wide-revenue-overview'),
    path('sales-pipeline/', SalesPipelineView.as_view(), name='sales-pipeline'),
    path('dashboard/stats/', AgencyDashboardStatsView.as_view(), name='agency-dashboard-stats'),
    path('dashboard/recent-activity/', AgencyRecentActivityView.as_view(), name='agency-recent-activity'),
    # Manage agents urls below
    path('agents/stats/', ManageAgentsStatsView.as_view(), name='agents-stats'),
    path('agents/list/', ListAllAgentsView.as_view(), name='agents-list'),
    path('agents/detail/', AgentDetailView.as_view(), name='agent-detail'),
    path('agents/remove/', RemoveAgentView.as_view(), name='remove-agent'),
    path('agents/set-commission/', SetCommissionView.as_view(), name='set-commission'),
    path('agents/add/', AddNewAgentView.as_view(), name='add-agent'),
    path('agents/update/', UpdateAgentView.as_view(), name='update-agent'),
    # Agent analytics page below
    path('analytics/stats/', AgentAnalyticsStatsView.as_view(), name='analytics-stats'),
    path('analytics/performance-leaderboard/', AgentPerformanceLeaderboardView.as_view(), name='performance-leaderboard'),
    path('analytics/conversion-rate/', ConversionRateByAgentView.as_view(), name='conversion-rate'),
    path('analytics/quotes-generated/', QuotesGeneratedView.as_view(), name='quotes-generated'),
    path('analytics/revenue-by-destination/', RevenueByDestinationView.as_view(), name='revenue-by-destination'),
    path('analytics/upcoming-departures/', UpcomingDeparturesView.as_view(), name='upcoming-departures'),
    path('analytics/top-performing-agents/', TopPerformingAgentsView.as_view(), name='top-performing-agents'),
    # Bookings and quotes page on agency dashboard
    path('quotes/list/', AgencyQuotesListView.as_view(), name='quotes-list'),
    path('quotes/detail/', QuoteDetailView.as_view(), name='quote-detail'),

    # Super admin agency management
    path('super-admin/agency-list/', SuperAdminAgencyListView.as_view(), name='super-admin-agency-list'),
    path('super-admin/agency-detail/', SuperAdminAgencyDetailView.as_view(), name='super-admin-agency-detail'),
    path('super-admin/agency-revenue/', SuperAdminAgencyRevenueView.as_view(), name='super-admin-agency-revenue'),
    path('super-admin/top-destinations/', SuperAdminTopDestinationsView.as_view(), name='super-admin-top-destinations'),
    path('super-admin/dashboard-stats/', SuperAdminDashboardStatsView.as_view(), name='super-admin-dashboard-stats'),
    
    # Super admin hotel and flight listings
    path('super-admin/hotels/', SuperAdminHotelListingView.as_view(), name='super-admin-hotels'),
    path('super-admin/flights/', SuperAdminFlightListingView.as_view(), name='super-admin-flights'),
    
    # Super admin hotel and flight details
    path('super-admin/hotels/details/', SuperAdminHotelDetailView.as_view(), name='super-admin-hotels-details'),
    path('super-admin/flights/details/', SuperAdminFlightDetailView.as_view(), name='super-admin-flights-details'),
]
