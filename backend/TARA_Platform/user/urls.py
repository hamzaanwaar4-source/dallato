from django.urls import path
from .views import *

urlpatterns = [
    path('login/', LoginUserAPIView.as_view(), name='login'),
    path('reset-password/', ResetPasswordAPIView.as_view(), name='reset_password'),
    path('create-password/', CreatePasswordAPIView.as_view(), name='create_password'),
    path('logout/', LogoutUserAPIView.as_view(), name='logout'),
    path('system-health/', SystemHealthView.as_view(), name='system-health'),
    path('crm-overview/', SuperAdminCRMOverviewView.as_view(), name='super_admin_crm_overview'),
]

