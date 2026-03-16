from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Sum, Avg
from datetime import datetime, timedelta, date
from collections import defaultdict
from .models import Agency, Supplier
from agent.models import Client, Agent, ActivityLog, Hotel, Flight, Quote, Trip, Itinerary
from user.models import User
from user.config import IsAgencyAdmin, IsPlatformSuperAdmin
from user.utils import get_agency_from_request
from .serializers import *
from agent.serializers import AgentSerializer
from django.contrib.auth.models import Group
from user import email_messenger
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.text import slugify
from django.utils.crypto import get_random_string
import logging
import math
import uuid
        
logger = logging.getLogger(__name__)


class CreateAgencyView(APIView):
    permission_classes = [IsPlatformSuperAdmin]
    
    def post(self, request):
       
        serializer = CreateAgencySerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            full_name = serializer.validated_data['full_name']
            email = serializer.validated_data['email']
            agency_name = serializer.validated_data['agency_name']
            default_currency = serializer.validated_data.get('default_currency', 'USD')
            default_markup_percent = serializer.validated_data.get('default_markup_percent', 0.00)
            agent_commission = serializer.validated_data.get('agent_commission', 0.00)
            
            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'A user with this username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'A user with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            base_slug = slugify(agency_name)
            slug = base_slug
            counter = 1
            while Agency.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=get_random_string(12),  
                role='Agency Admin',
                full_name=full_name,
                is_onboarded=False  
            )
            
            token = str(uuid.uuid4())
            user.update_reset_password_token(token)
            
            agency = Agency.objects.create(
                user=user,
                name=agency_name,
                slug=slug,
                default_currency=default_currency,
                default_markup_percent=default_markup_percent,
                agent_commission=agent_commission
            )
            
            Supplier.objects.create(
                agency=agency,
                name='Duffel',
                type='DUFFEL',
                category='FLIGHT',
                commission_percent=agent_commission
            )
            Supplier.objects.create(
                agency=agency,
                name='Amadeus',
                type='AMADEUS',
                category='FLIGHT',
                commission_percent=agent_commission
            )
            Supplier.objects.create(
                agency=agency,
                name='Booking.com',
                type='BOOKING.COM',
                category='HOTEL',
                commission_percent=agent_commission
            )
            
            agency_admin_group = Group.objects.get(name='Agency Admin')
            user.groups.add(agency_admin_group)
            
            create_password_url = f"{settings.FORGOT_PASSWORD['RESET_URL']}?token={token}"
            message = render_to_string(
                "user/set_password_agency_email.html",
                {
                    "link": create_password_url, 
                    "username": username,
                    "full_name": full_name,
                    "agency_name": agency_name
                }
            )
            
            email_service = email_messenger.EmailService()
            email_sent = email_service.send_email(
                email=email,
                subject="Welcome to TARA - Set Your Agency Password",
                message=message
            )
            
            if not email_sent:
                logger.warning(f"Failed to send onboarding email to {email}")
            
            return Response(
                {
                    'message': 'Agency created successfully. Onboarding email sent.',
                    'agency_id': agency.id,
                    'agency_name': agency.name,
                    'admin_username': username,
                    'admin_email': email
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteAgencyView(APIView):
    """Delete an agency and all related data (Super Admin only)"""
    permission_classes = [IsPlatformSuperAdmin]
    
    def delete(self, request):
        agency_id = request.data.get('agency_id') or request.query_params.get('agency_id')
        if not agency_id:
            return Response(
                {'error': 'agency_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agency = Agency.objects.get(id=agency_id)
        except Agency.DoesNotExist:
            return Response(
                {'error': 'Agency not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        agency_name = agency.name
        user = agency.user
        
        agency.delete()
        
        if user:
            user.delete()
        
        return Response(
            {'message': f'Agency "{agency_name}" and all related data deleted successfully'},
            status=status.HTTP_200_OK
        )


class ListAgenciesView(APIView):
    permission_classes = [IsPlatformSuperAdmin]

    def get(self, request):
        agencies = Agency.objects.all().select_related('user').prefetch_related('agents')
        serializer = AgencySerializer(
            agencies,
            many=True,
            fields=[
                'id', 'name', 'slug', 'admin_username', 'admin_email', 'is_active',
                'agents_count', 'clients_count', 'default_currency',
                'default_markup_percent', 'agent_commission', 'created_at'
            ]
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateAgencyView(APIView):
    permission_classes = [IsPlatformSuperAdmin]
    
    def patch(self, request):
        agency_id = request.data.get('agency_id')
        if not agency_id:
            return Response(
                {'error': 'agency_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agency = Agency.objects.get(id=agency_id)
        except Agency.DoesNotExist:
            return Response(
                {'error': 'Agency not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = UpdateAgencySerializer(data=request.data)
        if serializer.is_valid():
            if 'default_markup_percent' in serializer.validated_data:
                agency.default_markup_percent = serializer.validated_data['default_markup_percent']
            if 'agent_commission' in serializer.validated_data:
                old_agent_commission = agency.agent_commission
                agency.agent_commission = serializer.validated_data['agent_commission']
                
                quotes = Quote.objects.filter(agent__agency=agency).select_related('agent', 'trip__client')
                for quote in quotes:
                    quote.agency_commission_percent = agency.agent_commission
                    agent_commission_total = (quote.ai_base_total * quote.agent_commission_percent) / 100
                    quote.agency_commission_amount = (agent_commission_total * quote.agency_commission_percent) / 100
                    quote.agent_commission_amount = agent_commission_total - quote.agency_commission_amount
                    quote.total_price = quote.ai_base_total + agent_commission_total
                    quote.save()
                
            if 'default_currency' in serializer.validated_data:
                agency.default_currency = serializer.validated_data['default_currency']
            if 'is_active' in serializer.validated_data:
                agency.is_active = serializer.validated_data['is_active']
            
            agency.save()
            
            return Response(
                {
                    'message': 'Agency updated successfully',
                    'agency_id': agency.id,
                    'default_markup_percent': agency.default_markup_percent,
                    'agent_commission': agency.agent_commission
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ToggleStatusView(APIView):
    """
    Handles activation/deactivation of agencies and agents.
    Super Admin -> Manage Agencies
    Agency Admin -> Manage Agents
    """
    
    def patch(self, request):
        # Validate authentication
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Validate required field
        is_active = request.data.get('is_active')
        if is_active is None:
            return Response(
                {'error': 'is_active is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Route to appropriate handler
        if self._is_super_admin(request.user):
            return self._handle_agency_toggle(request, is_active)
        
        if self._is_agency_admin(request.user):
            return self._handle_agent_toggle(request, is_active)
        
        return Response(
            {'error': 'Unauthorized'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    def _is_super_admin(self, user):
        return user.role in ['PLATFORM_SUPERADMIN', 'Platform SuperAdmin']
    
    def _is_agency_admin(self, user):
        return user.role in ['AGENCY_ADMIN', 'Agency Admin']
    
    def _handle_agency_toggle(self, request, is_active):
        """Super Admin: Toggle agency and all its agents"""
        agency_id = request.data.get('agency_id')
        if not agency_id:
            return Response(
                {'error': 'agency_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agency = Agency.objects.get(id=agency_id)
        except Agency.DoesNotExist:
            return Response(
                {'error': 'Agency not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update agency status
        agency.is_active = is_active
        agency.save()
        
        # Update agency user
        if agency.user:
            agency.user.is_active = is_active
            agency.user.save()
        
        # Update all agents under this agency
        self._toggle_agency_agents(agency, is_active)
        
        # Log activity
        action = 'activated' if is_active else 'deactivated'
        self._log_activity(
            agency=agency,
            table_name='AGENCY',
            message=f'Super Admin {action} agency: {agency.name}'
        )
        
        return Response({
            'message': f'Agency {action} successfully',
            'agency_id': agency.id,
            'is_active': agency.is_active
        }, status=status.HTTP_200_OK)
    
    def _handle_agent_toggle(self, request, is_active):
        """Agency Admin: Toggle individual agent"""
        agent_id = request.data.get('agent_id')
        if not agent_id:
            return Response(
                {'error': 'agent_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agency = Agency.objects.get(user=request.user)
            agent = Agent.objects.get(id=agent_id, agency=agency)
        except (Agency.DoesNotExist, Agent.DoesNotExist):
            return Response(
                {'error': 'Agent not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not agent.user:
            return Response(
                {'error': 'Agent has no user account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update agent status
        agent.user.is_active = is_active
        agent.user.save()
        
        # Log activity
        action = 'activated' if is_active else 'deactivated'
        self._log_activity(
            agency=agency,
            agent=agent,
            table_name='AGENT',
            message=f'Agency {action} agent: {agent.name}'
        )
        
        return Response({
            'message': f'Agent {action} successfully',
            'agent_id': agent.id,
            'agent_name': agent.name,
            'is_active': agent.user.is_active
        }, status=status.HTTP_200_OK)
    
    def _toggle_agency_agents(self, agency, is_active):
        """Update all agents under an agency"""
        agents = Agent.objects.filter(agency=agency)
        for agent in agents:
            if agent.user:
                agent.user.is_active = is_active
                agent.user.save()
    
    def _log_activity(self, agency, table_name, message, agent=None):
        """Create activity log entry"""
        ActivityLog.objects.create(
            agency=agency,
            agent=agent,
            table_name=table_name,
            status_code=200,
            message=message
        )


class CRMOverviewView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        agents = Agent.objects.filter(agency=agency)
        
        total_clients = Client.objects.filter(agent__agency=agency).count()
        
        current_month = datetime.now().month
        current_year = datetime.now().year
        new_clients = Client.objects.filter(
            agent__agency=agency,
            created_at__month=current_month,
            created_at__year=current_year
        ).count()
        
        high_value_clients = Client.objects.filter(
            agent__agency=agency,
            travel_style='LUXURY'
        ).count()
        
        recent_activities = ActivityLog.objects.filter(
            agent__agency=agency
        ).order_by('-created_at')[:10]
        
        data = {
            'total_clients': total_clients,
            'new_clients': new_clients,
            'high_value_clients': high_value_clients,
            'recent_activities': recent_activities
        }
        
        serializer = CRMOverviewSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgencyManagedSuppliersView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        suppliers = Supplier.objects.filter(agency=agency)
        
        total_bookings = Flight.objects.filter(quote__agent__agency=agency).count() + Hotel.objects.filter(quote__agent__agency=agency).count()
        
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
        
        suppliers_data = []
        for supplier in suppliers:
            if supplier.category == 'HOTEL':
                bookings_count = Hotel.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name
                ).count()
                
                current_month_bookings = Hotel.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name,
                    created_at__gte=current_month_start,
                    created_at__lt=next_month_start
                ).count()
                
                previous_month_bookings = Hotel.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name,
                    created_at__gte=previous_month_start,
                    created_at__lt=previous_month_end
                ).count()
            elif supplier.category == 'FLIGHT':
                bookings_count = Flight.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name
                ).count()
                
                current_month_bookings = Flight.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name,
                    created_at__gte=current_month_start,
                    created_at__lt=next_month_start
                ).count()
                
                previous_month_bookings = Flight.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name,
                    created_at__gte=previous_month_start,
                    created_at__lt=previous_month_end
                ).count()
            else:
                hotel_bookings = Hotel.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name
                ).count()
                flight_bookings = Flight.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name
                ).count()
                bookings_count = hotel_bookings + flight_bookings
                
                current_hotel_bookings = Hotel.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name,
                    created_at__gte=current_month_start,
                    created_at__lt=next_month_start
                ).count()
                current_flight_bookings = Flight.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name,
                    created_at__gte=current_month_start,
                    created_at__lt=next_month_start
                ).count()
                current_month_bookings = current_hotel_bookings + current_flight_bookings
                
                previous_hotel_bookings = Hotel.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name,
                    created_at__gte=previous_month_start,
                    created_at__lt=previous_month_end
                ).count()
                previous_flight_bookings = Flight.objects.filter(
                    quote__agent__agency=agency,
                    source__icontains=supplier.name,
                    created_at__gte=previous_month_start,
                    created_at__lt=previous_month_end
                ).count()
                previous_month_bookings = previous_hotel_bookings + previous_flight_bookings
            
            usage_percent = (bookings_count / total_bookings * 100) if total_bookings > 0 else 0
            
            if previous_month_bookings > 0:
                trend_percent = ((current_month_bookings - previous_month_bookings) / previous_month_bookings) * 100
            else:
                trend_percent = 0 if current_month_bookings == 0 else 100
            
            suppliers_data.append({
                'supplier_name': supplier.name,
                'supplier_type': supplier.type,
                'supplier_category': supplier.category,
                'api_status': 'Active',
                'commission': supplier.commission_percent,
                'bookings_count': bookings_count,
                'usage_percent': round(usage_percent, 2),
                'trend_percent': round(trend_percent, 2)
            })
        
        data = {'suppliers': suppliers_data}
        serializer = AgencyManagedSuppliersSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ManageAgentsStatsView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response

        total_agents = Agent.objects.filter(agency=agency).count()
        total_bookings = Trip.objects.filter(agent__agency=agency, is_booked=True).count()
        total_quotes = Quote.objects.filter(agent__agency=agency).count()
        total_quotes_excl_draft = Quote.objects.filter(agent__agency=agency).exclude(status='DRAFT').count()

        revenue_aggregate = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED'
        ).aggregate(total=Sum('agency_commission_amount'))
        total_revenue = float(revenue_aggregate['total'] or 0)

        conversion_rate = (total_bookings / total_quotes_excl_draft * 100) if total_quotes_excl_draft > 0 else 0

        data = {
            'total_agents': total_agents,
            'total_bookings': total_bookings,
            'total_quotes': total_quotes,
            'conversion_rate': f"{conversion_rate:.2f}",
            'total_revenue': f"{total_revenue:.2f}"
        }

        return Response(data, status=status.HTTP_200_OK)


class ListAllAgentsView(APIView):
    permission_classes = [IsAgencyAdmin]

    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response

        agents = Agent.objects.filter(agency=agency).select_related('user')
        serializer = AgentSerializer(
            agents,
            many=True,
            fields=['id', 'name', 'email', 'phone', 'location', 'status', 'clients_count', 'commission']
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentDetailView(APIView):
    permission_classes = [IsAgencyAdmin]

    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response

        agent_id = request.query_params.get('agent_id')
        if not agent_id:
            return Response(
                {'error': 'agent_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            agent = Agent.objects.select_related('user').get(id=agent_id, agency=agency)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found or does not belong to your agency'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgentSerializer(
            agent,
            fields=['id', 'name', 'email', 'phone', 'location', 'commission_percent', 'clients_count', 'top_destination']
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class RemoveAgentView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def delete(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        agent_id = request.data.get('agent_id') or request.query_params.get('agent_id')
        if not agent_id:
            return Response({'error': 'agent_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            agent = Agent.objects.get(id=agent_id, agency=agency)
        except Agent.DoesNotExist:
            return Response({'error': 'Agent not found or does not belong to your agency'}, status=status.HTTP_404_NOT_FOUND)
        
        agent_name = agent.name
        user = agent.user
        
        ActivityLog.objects.create(
            agency=agency,
            agent=agent,
            table_name='AGENCY',
            status_code=200,
            message=f'Agency removed agent: {agent_name}'
        )
        
        if user:
            user.delete()            
        
        agent.delete()
        
        
        return Response({'message': 'Agent and associated user removed successfully'}, status=status.HTTP_200_OK)


class SetCommissionView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def patch(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        agent_id = request.data.get('agent_id')
        if not agent_id:
            return Response({'error': 'agent_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            agent = Agent.objects.get(id=agent_id, agency=agency)
        except Agent.DoesNotExist:
            return Response({'error': 'Agent not found or does not belong to your agency'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SetCommissionSerializer(data=request.data)
        if serializer.is_valid():
            old_commission = agent.commission_client_wise
            agent.commission_client_wise = serializer.validated_data['commission']
            agent.save()
            
            ActivityLog.objects.create(
                agency=agency,
                agent=agent,
                table_name='AGENCY',
                status_code=200,
                message=f'Agency updated commission for {agent.name}: {old_commission}% → {agent.commission_client_wise}%'
            )
            
            return Response({'message': 'Commission updated successfully', 'commission': agent.commission_client_wise}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddNewAgentView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def post(self, request):
        
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        serializer = AddAgentSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            full_name = serializer.validated_data['full_name']
            email = serializer.validated_data['email']
            phone = serializer.validated_data.get('phone', '')
            location = serializer.validated_data.get('location', '')
            commission = serializer.validated_data.get('commission', 0.00)
            
            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'A user with this username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if Agent.objects.filter(email=email).exists():
                return Response(
                    {'error': 'An agent with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'A user with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=get_random_string(12),
                role='Agency Agent',
                full_name=full_name,
                is_onboarded=False  
            )
            
            token = str(uuid.uuid4())
            user.update_reset_password_token(token)
            
            agent = Agent.objects.create(
                user=user,
                agency=agency,
                name=full_name,
                email=email,
                phone=phone,
                location=location,
                commission_client_wise=commission
            )
            
            agent_group = Group.objects.get(name='Agency Agent')
            user.groups.add(agent_group)
            
            create_password_url = f"{settings.FORGOT_PASSWORD['RESET_URL']}?token={token}"
            message = render_to_string(
                "user/set_password_email.html",
                {
                    "link": create_password_url, 
                    "username": username,
                    "full_name": full_name,
                    "agency_name": agency.name
                }
            )
            
            email_service = email_messenger.EmailService()
            email_sent = email_service.send_email(
                email=email,
                subject="Welcome to TARA - Set Your Password",
                message=message
            )
            
            if not email_sent:
                logger.warning(f"Failed to send onboarding email to {email}")
            
            ActivityLog.objects.create(
                agency=agency,
                agent=agent,
                table_name='AGENCY',
                status_code=201,
                message=f'Agency created new agent: {full_name}'
            )
            
            return Response(
                {
                    'message': 'Agent added successfully. Onboarding email sent.',
                    'agent_id': agent.id,
                    'name': agent.name,
                    'email': agent.email,
                    'username': username
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateAgentView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def patch(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        agent_id = request.data.get('agent_id')
        if not agent_id:
            return Response(
                {'error': 'agent_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agent = Agent.objects.get(id=agent_id, agency=agency)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found or does not belong to your agency'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = UpdateAgentSerializer(data=request.data)
        if serializer.is_valid():
            if 'name' in serializer.validated_data:
                agent.name = serializer.validated_data['name']
            if 'phone' in serializer.validated_data:
                agent.phone = serializer.validated_data['phone']
            if 'location' in serializer.validated_data:
                agent.location = serializer.validated_data['location']
            if 'commission' in serializer.validated_data:
                agent.commission_client_wise = serializer.validated_data['commission']
            
            agent.save()
            
            ActivityLog.objects.create(
                agency=agency,
                agent=agent,
                table_name='AGENCY',
                status_code=200,
                message=f'Agency updated agent details: {agent.name}'
            )
            
            return Response(
                {
                    'message': 'Agent updated successfully',
                    'agent_id': agent.id,
                    'name': agent.name,
                    'commission': agent.commission_client_wise
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgentAnalyticsStatsView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        agents = Agent.objects.filter(agency=agency)
        total_agents = agents.count()
        
        if total_agents == 0:
            return Response(
                {
                    'avg_revenue_per_agent': 0.00,
                    'avg_clients_per_agent': 0.00,
                    'total_bookings': 0
                },
                status=status.HTTP_200_OK
            )
        
        total_clients = Client.objects.filter(agent__agency=agency).count()
        avg_clients_per_agent = total_clients / total_agents if total_agents > 0 else 0
        
        revenue_aggregate = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED'
        ).aggregate(total=Sum('agency_commission_amount'))
        total_revenue = float(revenue_aggregate['total'] or 0)
        
        avg_revenue_per_agent = total_revenue / total_agents if total_agents > 0 else 0
        
        total_bookings = Trip.objects.filter(agent__agency=agency, is_booked=True).count()
        
        data = {
            'avg_revenue_per_agent': avg_revenue_per_agent,
            'avg_clients_per_agent': math.ceil(avg_clients_per_agent),
            'total_bookings': math.ceil(total_bookings)
        }
        
        serializer = AgentAnalyticsStatsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentPerformanceLeaderboardView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        month = request.query_params.get('month', 'this_month')
        current_date = datetime.now()
        
        if month == 'this_month':
            start_date = current_date.replace(day=1)
            end_date = current_date
        elif month == 'last_month':
            last_month = current_date.replace(day=1) - timedelta(days=1)
            start_date = last_month.replace(day=1)
            end_date = last_month.replace(day=28) + timedelta(days=4)
            end_date = end_date - timedelta(days=end_date.day)
        else:
            start_date = current_date.replace(day=1)
            end_date = current_date
        
        agents_data = Agent.objects.filter(agency=agency).annotate(
            total_revenue=Sum(
                'quotes__agency_commission_amount',
                filter=Q(
                    quotes__status='CONFIRMED',
                    quotes__created_at__gte=start_date,
                    quotes__created_at__lte=end_date
                )
            )
        ).values('name', 'total_revenue')
        
        agents_list = [
            {
                'agent_name': agent['name'],
                'total_revenue': float(agent['total_revenue'] or 0)
            }
            for agent in agents_data
        ]
        agents_list.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        data = {'agents': agents_list}
        serializer = AgentPerformanceLeaderboardSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConversionRateByAgentView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        agents_data = Agent.objects.filter(agency=agency).annotate(
            total_quotes=Count('quotes'),
            booked_trips=Count('trips', filter=Q(trips__is_booked=True))
        ).values('name', 'total_quotes', 'booked_trips')
        
        conversion_data = [
            {
                'agent_name': agent['name'],
                'conversion_rate': round(
                    (agent['booked_trips'] / agent['total_quotes'] * 100) if agent['total_quotes'] > 0 else 0,
                    2
                )
            }
            for agent in agents_data
        ]
        
        return Response(conversion_data, status=status.HTTP_200_OK)


class QuotesGeneratedView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        period = request.query_params.get('period', 'monthly')
        current_date = datetime.now()
        
        if period == 'weekly':
            start_date = current_date - timedelta(days=7)
        else:
            start_date = current_date.replace(day=1)
        
        agents_data = Agent.objects.filter(agency=agency).annotate(
            quotes_count=Count(
                'quotes',
                filter=Q(
                    quotes__created_at__gte=start_date,
                    quotes__created_at__lte=current_date
                )
            )
        ).values('name', 'quotes_count')
        
        total_quotes = sum(agent['quotes_count'] for agent in agents_data)
        
        agents_list = [
            {
                'agent_name': agent['name'],
                'quotes_count': agent['quotes_count'],
                'percentage': round(
                    (agent['quotes_count'] / total_quotes * 100) if total_quotes > 0 else 0,
                    2
                )
            }
            for agent in agents_data
        ]
        agents_list.sort(key=lambda x: x['quotes_count'], reverse=True)
        return Response(agents_list, status=status.HTTP_200_OK)


class RevenueByDestinationView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        destinations_data = Trip.objects.filter(
            agent__agency=agency,
            is_booked=True  
        ).exclude(
            destination_city__isnull=True
        ).exclude(
            destination_city=''
        ).values('destination_city').annotate(
            revenue=Sum(
                'quotes__agency_commission_amount',
                filter=Q(quotes__status='CONFIRMED')
            ),
            bookings_count=Count(
                'quotes',
                filter=Q(quotes__status='CONFIRMED')
            )
        ).order_by('-revenue')
        
        destinations_list = [
            {
                'destination': dest['destination_city'],
                'revenue': float(dest['revenue'] or 0),
                'bookings_count': dest['bookings_count']
            }
            for dest in destinations_data
        ]
        
        return Response(destinations_list, status=status.HTTP_200_OK)


class AgencyQuotesListView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        quotes = Quote.objects.filter(
            agent__agency=agency,
            status__in=['DRAFT', 'INITIAL_CONTACT', 'QUOTE_SENT', 'IN_NEGOTIATION']
        ).select_related('trip', 'trip__client', 'agent').order_by('-created_at')
        
        quotes_list = []
        for quote in quotes:
            trip = quote.trip
            client = trip.client if trip else None
            destination = trip.destination_city if trip and trip.destination_city else 'N/A'
            
            expiry_date = quote.created_at + timedelta(days=30)
            days_left = (expiry_date.date() - datetime.now().date()).days
            days_left = max(0, days_left)
            
            quotes_list.append({
                'id': quote.id,
                'quote_number': f'Q-{quote.id}',
                'client_name': client.full_name if client else 'N/A',
                'destination': destination,
                'quote_value': quote.ai_base_total,
                'status': quote.status,
                'days_left': days_left,
                'created_at': quote.created_at
            })
        
        serializer = QuoteListSerializer(quotes_list, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuoteDetailView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        quote_id = request.query_params.get('quote_id')
        if not quote_id:
            return Response(
                {'error': 'quote_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quote = Quote.objects.select_related(
                'agent', 'agent__agency', 'trip', 'trip__client'
            ).prefetch_related(
                'flights', 'hotels', 'itinerary__days__activities'
            ).get(id=quote_id, agent__agency=agency)
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found or does not belong to your agency'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        trip = quote.trip
        client = trip.client if trip else None
        agent = quote.agent
        
        start_date = trip.start_date if trip and trip.start_date else None
        end_date = trip.end_date if trip and trip.end_date else None
        travel_dates = f"{start_date} to {end_date}" if start_date and end_date else "N/A"
        
        expiry_date = quote.created_at + timedelta(days=30)
        days_left = (expiry_date.date() - datetime.now().date()).days
        days_left = max(0, days_left)
        expiry_str = f"{days_left} days left"
        
        activity_logs = ActivityLog.objects.filter(
            table_name='QUOTE',
            message__icontains=f'Q-{quote.id}'
        ).order_by('created_at')
        
        if not activity_logs.exists():
            default_timeline = [
                {
                    'step_number': 1,
                    'title': 'Quote Created',
                    'description': f'Quote created on {quote.created_at.strftime("%b %d, %Y")} by {agent.name}',
                    'timestamp': quote.created_at
                }
            ]
            
            if quote.status in ['QUOTE_SENT', 'IN_NEGOTIATION', 'CONFIRMED', 'REMOVED']:
                default_timeline.append({
                    'step_number': 2,
                    'title': 'Quote Sent to Client',
                    'description': f'Quote sent to {client.full_name if client else "client"}',
                    'timestamp': quote.created_at
                })
            
            if quote.status == 'CONFIRMED':
                default_timeline.append({
                    'step_number': 3,
                    'title': 'Quote Confirmed by Client',
                    'description': f'Quote confirmed by {client.full_name if client else "client"}',
                    'timestamp': quote.updated_at
                })
            
            quote_activity_timeline = default_timeline
        else:
            quote_activity_timeline = [
                {
                    'step_number': idx + 1,
                    'title': log.message.split('-')[0].strip() if '-' in log.message else log.message,
                    'description': log.message,
                    'timestamp': log.created_at
                }
                for idx, log in enumerate(activity_logs)
            ]
        
        itinerary_data = None
        try:
            itinerary = quote.itinerary
            from .serializers import ItineraryDetailSerializer
            itinerary_data = ItineraryDetailSerializer(itinerary).data
        except Itinerary.DoesNotExist:
            itinerary_data = None
        
        from .serializers import FlightDetailSerializer, HotelDetailSerializer
        
        quote_detail = {
            'id': quote.id,
            'quote_number': f'Q-{quote.id}',
            'agent_name': agent.name,
            'agent_email': agent.email,
            'client_name': client.full_name if client else 'N/A',
            'client_email': client.email if client else 'N/A',
            'destination': trip.destination_city if trip and trip.destination_city else 'N/A',
            'travel_dates': travel_dates,
            'version_number': quote.version_number,
            'quote_value': quote.ai_base_total,
            'currency': quote.currency,
            'status': quote.status,
            'expiry': expiry_str,
            'quote_activity_timeline': quote_activity_timeline,
            'flights': FlightDetailSerializer(quote.flights.all(), many=True).data,
            'hotels': HotelDetailSerializer(quote.hotels.all(), many=True).data,
            'itinerary': itinerary_data,
            'trip_title': trip.title if trip else 'N/A',
            'created_at': quote.created_at,
            'updated_at': quote.updated_at
        }
        
        serializer = QuoteDetailSerializer(quote_detail)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgencyRevenueOverviewView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
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
        
        current_revenue = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED',
            created_at__gte=current_month_start,
            created_at__lt=next_month_start
        ).aggregate(total=Sum('agency_commission_amount'))
        monthly_revenue = float(current_revenue['total'] or 0)
        
        previous_revenue_agg = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED',
            created_at__gte=previous_month_start,
            created_at__lt=previous_month_end
        ).aggregate(total=Sum('agency_commission_amount'))
        previous_revenue = float(previous_revenue_agg['total'] or 0)
        
        if previous_revenue > 0:
            revenue_change_percent = ((monthly_revenue - previous_revenue) / previous_revenue) * 100
        else:
            revenue_change_percent = 0 if monthly_revenue == 0 else 100
        
        booked_quotes_agg = Quote.objects.filter(
            agent__agency=agency,
            trip__is_booked=True
        ).aggregate(
            total_value=Sum('ai_base_total'),
            count=Count('id')
        )
        total_quote_value = float(booked_quotes_agg['total_value'] or 0)
        booked_count = booked_quotes_agg['count']
        avg_quote_value = total_quote_value / booked_count if booked_count > 0 else 0
        
        current_month_booked_agg = Quote.objects.filter(
            agent__agency=agency,
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
            agent__agency=agency,
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
            agent__agency=agency,
            trip__is_booked=False
        ).exclude(status__in=['DRAFT', 'REMOVED']).aggregate(
            total=Sum('ai_base_total')
        )
        pending_value = float(pending_value_agg['total'] or 0)
        
        previous_pending_agg = Quote.objects.filter(
            agent__agency=agency,
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


class SalesPipelineView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        stats = Quote.objects.filter(
            agent__agency=agency
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


class AgencyWideRevenueOverviewView(APIView):
    permission_classes = [IsAgencyAdmin]

    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        current_month_start = date.today().replace(day=1)
        quote_table = Quote._meta.db_table
        
        revenue_by_date = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED',
            created_at__gte=current_month_start
        ).extra(
            select={'quote_date': f'DATE("{quote_table}"."created_at")'}
        ).values('quote_date').annotate(
            revenue=Sum('agency_commission_amount')
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

class UpcomingDeparturesView(APIView):
    permission_classes = [IsAgencyAdmin]

    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response

        today = date.today()
        next_7_days = today + timedelta(days=7)
        urgent_threshold = today + timedelta(days=2)
                
        all_upcoming_trips = Trip.objects.filter(
            agent__agency=agency,
            is_booked=True,
            start_date__gte=today,
            start_date__lte=next_7_days
        ).select_related('client', 'agent').order_by('start_date')

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

            client = trip.client
            agent = trip.agent
            departures_list.append({
                'trip_id': trip.id,
                'trip_title': trip.title,
                'client_id': client.id if client else None,
                'client_name': client.full_name if client else 'N/A',
                'client_email': client.email if client else 'N/A',
                'agent_id': agent.id if agent else None,
                'agent_name': agent.name if agent else 'N/A',
                'destination': trip.destination_city or '',
                'destination_country': trip.destination_country or '',
                'departure_date': trip.start_date,
                'departure_time': departure_time,
                'return_date': trip.end_date,
                'days_until_departure': days_until,
                'is_urgent': is_urgent,
                'from_airport': trip.from_airport or '',
                'to_airport': trip.to_airport or ''
            })

        response_data = {
            'total_departures': total_departures,
            'urgent_departures': urgent_departures,
            'departures': UpcomingDepartureSerializer(departures_list, many=True).data
        }

        return Response(response_data, status=status.HTTP_200_OK)

class TopPerformingAgentsView(APIView):
    permission_classes = [IsAgencyAdmin]

    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response

        filter_param = request.query_params.get('filter', 'monthly').lower()
        
        today = date.today()
        
        if filter_param == 'weekly':
            start_date = today - timedelta(days=7)
            end_date = today
        elif filter_param == 'monthly':
            start_date = today.replace(day=1)
            end_date = today
        elif filter_param == 'overall':
            start_date = None
            end_date = None
        else:
            return Response(
                {'error': 'Invalid filter. Use weekly, monthly, or overall'},
                status=status.HTTP_400_BAD_REQUEST
            )

        agents = Agent.objects.filter(agency=agency).select_related('agency')

        top_revenue_agent = None
        top_bookings_agent = None
        top_conversion_agent = None

        max_revenue = 0
        max_bookings = 0
        max_conversion_rate = 0

        for agent in agents:
            if start_date and end_date:
                quotes = Quote.objects.filter(
                    agent=agent,
                    created_at__gte=start_date,
                    created_at__lte=end_date
                )
                confirmed_bookings = Trip.objects.filter(
                    agent=agent,
                    is_booked=True,
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).count()
            else:
                quotes = Quote.objects.filter(agent=agent)
                confirmed_bookings = Trip.objects.filter(agent=agent, is_booked=True).count()

            confirmed_quotes = quotes.filter(status='CONFIRMED')
            total_ai_base = sum([quote.ai_base_total for quote in confirmed_quotes])
            
            total_revenue = sum([float(quote.agency_commission_amount) for quote in confirmed_quotes])

            total_quotes_excl_draft = quotes.exclude(status='DRAFT').count()
            conversion_rate = (confirmed_bookings / total_quotes_excl_draft * 100) if total_quotes_excl_draft > 0 else 0

            if total_revenue > max_revenue:
                max_revenue = total_revenue
                top_revenue_agent = {
                    'agent_name': agent.name,
                    'revenue': round(float(total_revenue), 2),
                    'ai_base_total': round(float(total_ai_base), 2),
                    'markup_percent': float(agency.default_markup_percent),
                    'commission_percent': float(agent.commission_client_wise)
                }

            if confirmed_bookings > max_bookings:
                max_bookings = confirmed_bookings
                top_bookings_agent = {
                    'agent_name': agent.name,
                    'bookings': confirmed_bookings
                }

            if conversion_rate > max_conversion_rate:
                max_conversion_rate = conversion_rate
                top_conversion_agent = {
                    'agent_name': agent.name,
                    'conversion_rate': round(conversion_rate, 2)
                }

        data = {
            'filter_applied': filter_param,
            'top_revenue_agent': top_revenue_agent,
            'top_bookings_agent': top_bookings_agent,
            'top_conversion_agent': top_conversion_agent
        }

        serializer = TopPerformingAgentsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AgencyDashboardStatsView(APIView):
    """
    View to get overall agency dashboard statistics including total agents, total bookings quotes converstion rate, total revenue.,
    conversion_rate = (confirmed_bookings / total_quotes_excluding_draft) * 100
    """
    permission_classes = [IsAgencyAdmin]
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response

        total_agents = Agent.objects.filter(agency=agency).count()
        total_bookings = Trip.objects.filter(agent__agency=agency, is_booked=True).count()
        total_quotes = Quote.objects.filter(agent__agency=agency).count()
        total_quotes_excl_draft = Quote.objects.filter(agency=agency).exclude(status='DRAFT').count()

        revenue_aggregate = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED'
        ).aggregate(total=Sum('agency_commission_amount'))
        total_revenue = float(revenue_aggregate['total'] or 0)

        conversion_rate = (total_bookings / total_quotes_excl_draft * 100) if total_quotes_excl_draft > 0 else 0

        data = {
            'total_agents': total_agents,
            'total_bookings': total_bookings,
            'total_quotes': total_quotes,
            'conversion_rate': round(conversion_rate, 2),
            'total_revenue': round(total_revenue, 2)
        }

        serializer = AgencyDashboardStatsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgencyRecentActivityView(APIView):
    permission_classes = [IsAgencyAdmin]
    
    def get(self, request):
        agency, error_response = get_agency_from_request(request)
        if error_response:
            return error_response
        
        activity_logs = ActivityLog.objects.filter(
            Q(agency=agency) | Q(agent__agency=agency)
        ).select_related('agent').order_by('-created_at')[:20]
        
        activities_list = []
        for log in activity_logs:
            activities_list.append({
                'id': log.id,
                'agent_name': log.agent.name if log.agent else 'System',
                'message': log.message,
                'status_code': log.status_code,
                'created_at': log.created_at
            })
        
        return Response(activities_list, status=status.HTTP_200_OK)
    
class SuperAdminAgencyListView(APIView):
    permission_classes = [IsPlatformSuperAdmin]

    def get(self, request):
        agencies = Agency.objects.all().select_related('user').order_by('-created_at')
        serializer = AgencySerializer(
            agencies,
            many=True,
            fields=['id', 'name', 'email', 'is_active', 'created_at']
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class SuperAdminAgencyDetailView(APIView):
    permission_classes = [IsPlatformSuperAdmin]

    def get(self, request):
        agency_id = request.query_params.get('agency_id')
        if not agency_id:
            return Response(
                {'error': 'agency_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            agency = Agency.objects.select_related('user').get(id=agency_id)
        except Agency.DoesNotExist:
            return Response(
                {'error': 'Agency not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgencySerializer(
            agency,
            fields=[
                'id', 'name', 'slug', 'admin_username', 'admin_email', 'is_active',
                'default_currency', 'default_markup_percent', 'agent_commission',
                'agents_count', 'clients_count', 'created_at', 'updated_at'
            ]
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
class SuperAdminDashboardStatsView(APIView):
    permission_classes = [IsPlatformSuperAdmin]
    
    def get(self, request):
        total_agencies = Agency.objects.all().count()
        
        active_agencies = Agency.objects.filter(is_active=True).count()
        
        total_agents = Agent.objects.all().count()
        
        revenue_aggregate = Quote.objects.filter(
            status='CONFIRMED'
        ).aggregate(total=Sum('agency_commission_amount'))
        total_revenue = float(revenue_aggregate['total'] or 0)
        
        stats = {
            'total_agencies': total_agencies,
            'active_agencies': active_agencies,
            'total_agents': total_agents,
            'total_revenue': round(total_revenue, 2)
        }
        
        return Response(stats, status=status.HTTP_200_OK)


class SuperAdminAgencyRevenueView(APIView):
    permission_classes = [IsPlatformSuperAdmin]
    
    def get(self, request):
        agency_id = request.query_params.get('agency_id')
        if not agency_id:
            return Response(
                {'error': 'agency_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agency = Agency.objects.get(id=agency_id)
        except Agency.DoesNotExist:
            return Response(
                {'error': 'Agency not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        current_month_start = date.today().replace(day=1)
        if current_month_start.month == 1:
            previous_month_start = date(current_month_start.year - 1, 12, 1)
        else:
            previous_month_start = date(current_month_start.year, current_month_start.month - 1, 1)
        
        next_month = current_month_start.month + 1 if current_month_start.month < 12 else 1
        next_year = current_month_start.year if current_month_start.month < 12 else current_month_start.year + 1
        current_month_end = date(next_year, next_month, 1)
        
        current_revenue_agg = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED',
            created_at__gte=current_month_start,
            created_at__lt=current_month_end
        ).aggregate(total=Sum('agency_commission_amount'))
        current_revenue = float(current_revenue_agg['total'] or 0)
        
        previous_revenue_agg = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED',
            created_at__gte=previous_month_start,
            created_at__lt=current_month_start
        ).aggregate(total=Sum('agency_commission_amount'))
        previous_revenue = float(previous_revenue_agg['total'] or 0)
        
        if previous_revenue > 0:
            revenue_change_percent = ((current_revenue - previous_revenue) / previous_revenue) * 100
        else:
            revenue_change_percent = 100 if current_revenue > 0 else 0
        
        total_quotes_agg = Quote.objects.filter(
            agent__agency=agency,
            status='CONFIRMED'
        ).aggregate(
            count=Count('id'),
            total_revenue=Sum('agency_commission_amount')
        )
        total_quotes = total_quotes_agg['count']
        total_revenue = float(total_quotes_agg['total_revenue'] or 0)
        avg_quote_value = total_revenue / total_quotes if total_quotes > 0 else 0
        
        pending_value_agg = Quote.objects.filter(
            agent__agency=agency,
            status__in=['DRAFT', 'INITIAL_CONTACT', 'QUOTE_SENT', 'IN_NEGOTIATION']
        ).aggregate(total=Sum('agency_commission_amount'))
        pending_value = float(pending_value_agg['total'] or 0)
        
        revenue_data = {
            'current_month_revenue': current_revenue,
            'revenue_change_percent': round(revenue_change_percent, 2),
            'total_revenue': total_revenue,
            'avg_quote_value': round(avg_quote_value, 2),
            'pending_value': pending_value,
            'total_quotes': total_quotes
        }
        
        return Response(revenue_data, status=status.HTTP_200_OK)


class SuperAdminTopDestinationsView(APIView):
    permission_classes = [IsPlatformSuperAdmin]
    
    def get(self, request):
        agency_id = request.query_params.get('agency_id')
        
        if agency_id:
            try:
                agency = Agency.objects.get(id=agency_id)
                trips_qs = Trip.objects.filter(agent__agency=agency, is_booked=True)
            except Agency.DoesNotExist:
                return Response(
                    {'error': 'Agency not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            trips_qs = Trip.objects.filter(is_booked=True)
        
        top_destinations = trips_qs.exclude(
            destination_country__isnull=True
        ).exclude(
            destination_country=''
        ).values('destination_country').annotate(
            bookings=Count('id'),
            revenue=Sum(
                'quotes__agency_commission_amount',
                filter=Q(quotes__status='CONFIRMED')
            )
        ).order_by('-revenue')[:10]
        
        result = [
            {
                'destination': dest['destination_country'],
                'bookings': dest['bookings'],
                'revenue': round(float(dest['revenue'] or 0), 2)
            }
            for dest in top_destinations
        ]
        
        return Response(result, status=status.HTTP_200_OK)


class SuperAdminHotelListingView(APIView):
    """
    Super Admin API to list all hotels booked across all agencies.
    Shows hotel name, rating, booking count, booked dates, and agency breakdown.
    """
    permission_classes = [IsPlatformSuperAdmin]
    
    def get(self, request):
        # Get all hotels from confirmed quotes
        hotels = Hotel.objects.filter(
            quote__status='CONFIRMED'
        ).select_related(
            'quote__trip__agent__agency',
            'quote__trip'
        ).order_by('name')
        
        # Aggregate data by hotel name
        hotel_data = defaultdict(lambda: {
            'hotel_name': '',
            'ratings': [],
            'bookings': [],
            'agencies': set(),
            'source': ''
        })
        
        for hotel in hotels:
            name = hotel.name
            hotel_data[name]['hotel_name'] = name
            
            # Collect source (use first source encountered)
            if not hotel_data[name]['source'] and hotel.source:
                hotel_data[name]['source'] = hotel.source
            
            # Collect rating if available
            if hotel.rating:
                hotel_data[name]['ratings'].append(float(hotel.rating))
            
            # Collect booked date (trip start date)
            if hotel.quote.trip.start_date:
                hotel_data[name]['bookings'].append(hotel.quote.trip.start_date)
            
            # Collect agency information
            agency = hotel.quote.trip.agent.agency
            hotel_data[name]['agencies'].add((agency.id, agency.name))
        
        # Format the response
        result = []
        for name, data in hotel_data.items():
            # Calculate average rating
            avg_rating = None
            if data['ratings']:
                avg_rating = round(sum(data['ratings']) / len(data['ratings']), 2)
            
            # Get unique booked dates sorted
            unique_dates = sorted(set(data['bookings']))
            
            # Format agencies list
            agencies_list = [
                {'agency_id': agency_id, 'agency_name': agency_name}
                for agency_id, agency_name in sorted(data['agencies'], key=lambda x: x[1])
            ]
            
            result.append({
                'hotel_name': data['hotel_name'],
                'average_rating': avg_rating,
                'total_bookings': len(data['bookings']),
                'booked_dates': unique_dates,
                'agencies': agencies_list,
                'source': data['source'] or 'Unknown'
            })
        
        # Sort by total bookings (descending)
        result.sort(key=lambda x: x['total_bookings'], reverse=True)
        
        serializer = SuperAdminHotelListingSerializer(result, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SuperAdminFlightListingView(APIView):
    """
    Super Admin API to list all flights booked across all agencies.
    Shows carrier, flight number, booking count, booked dates, and agency breakdown.
    """
    permission_classes = [IsPlatformSuperAdmin]
    
    def get(self, request):
        # Get all flights from confirmed quotes
        flights = Flight.objects.filter(
            quote__status='CONFIRMED'
        ).select_related(
            'quote__trip__agent__agency',
            'quote__trip'
        ).order_by('carrier', 'flight_number')
        
        # Aggregate data by carrier + flight_number
        flight_data = defaultdict(lambda: {
            'carrier': '',
            'flight_number': '',
            'bookings': [],
            'agencies': set(),
            'source': ''
        })
        
        for flight in flights:
            # Create unique key for carrier + flight_number
            carrier = flight.carrier or 'Unknown'
            flight_num = flight.flight_number or 'N/A'
            key = f"{carrier}_{flight_num}"
            
            flight_data[key]['carrier'] = carrier
            flight_data[key]['flight_number'] = flight_num
            
            # Collect source (use first source encountered)
            if not flight_data[key]['source'] and flight.source:
                flight_data[key]['source'] = flight.source
            
            # Collect booked date (departure date or trip start date)
            booked_date = None
            if flight.departure_datetime:
                booked_date = flight.departure_datetime.date()
            elif flight.quote.trip.start_date:
                booked_date = flight.quote.trip.start_date
            
            if booked_date:
                flight_data[key]['bookings'].append(booked_date)
            
            # Collect agency information
            agency = flight.quote.trip.agent.agency
            flight_data[key]['agencies'].add((agency.id, agency.name))
        
        # Format the response
        result = []
        for key, data in flight_data.items():
            # Get unique booked dates sorted
            unique_dates = sorted(set(data['bookings']))
            
            # Format agencies list
            agencies_list = [
                {'agency_id': agency_id, 'agency_name': agency_name}
                for agency_id, agency_name in sorted(data['agencies'], key=lambda x: x[1])
            ]
            
            result.append({
                'carrier': data['carrier'],
                'flight_number': data['flight_number'],
                'total_bookings': len(data['bookings']),
                'booked_dates': unique_dates,
                'agencies': agencies_list,
                'source': data['source'] or 'Unknown'
            })
        
        # Sort by total bookings (descending)
        result.sort(key=lambda x: x['total_bookings'], reverse=True)
        
        serializer = SuperAdminFlightListingSerializer(result, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SuperAdminHotelDetailView(APIView):
    """
    Super Admin API to get detailed hotel booking information.
    Shows all bookings for each hotel with images, pricing, and client details.
    """
    permission_classes = [IsPlatformSuperAdmin]
    
    def get(self, request):
        # 1. Get Base Queryset
        confirmed_hotels = Hotel.objects.filter(
            quote__status='CONFIRMED'
        ).select_related(
            'quote__trip__agent__agency',
            'quote__trip__client',
            'quote__trip'
        )

        # 2. Get Aggregated Stats per Hotel Name
        hotel_stats = confirmed_hotels.values('name').annotate(
            total_bookings=Count('id'),
            total_revenue=Sum('price_total'),
            avg_rating=Avg('rating'),
        ).order_by('-total_revenue')


        hotel_details_map = defaultdict(list)
        hotel_metadata_map = {}

        for hotel in confirmed_hotels:
            name = hotel.name
            
            # Capture metadata from the first occurrence (or update if missing)
            if name not in hotel_metadata_map:
                hotel_metadata_map[name] = {
                    'hotel_image': hotel.main_photo_url,
                    'address': None, # Not directly on Hotel model based on previous code
                    'country': hotel.destination_country if hasattr(hotel, 'destination_country') else None, # Fallback or check Trip
                    'country_code': hotel.country_code,
                    'star_rating': hotel.star_rating,
                    'review_count': hotel.review_count,
                    'source': hotel.source or 'Unknown'
                }
            
            # Calculate nights
            nights = 0
            if hotel.quote.trip.start_date and hotel.quote.trip.end_date:
                delta = hotel.quote.trip.end_date - hotel.quote.trip.start_date
                nights = delta.days
            
            booking_detail = {
                'booking_id': hotel.id,
                'quote_id': str(hotel.quote.id),
                'quote_number': f"Q-{hotel.quote.id}",
                'agency_name': hotel.quote.trip.agent.agency.name,
                'agency_id': hotel.quote.trip.agent.agency.id,
                'client_name': hotel.quote.trip.client.full_name,
                'check_in_date': hotel.quote.trip.start_date,
                'check_out_date': hotel.quote.trip.end_date,
                'nights': nights,
                'room_type': hotel.room_type[0] if isinstance(hotel.room_type, list) and hotel.room_type else str(hotel.room_type), # Handle list or string
                'price': hotel.price_total,
                'currency': hotel.hotel_currency,
                'booked_date': hotel.quote.created_at,
                'status': hotel.quote.status
            }
            hotel_details_map[name].append(booking_detail)

        # 5. Merge Aggregated Stats with Details
        result = []
        for stat in hotel_stats:
            name = stat['name']
            metadata = hotel_metadata_map.get(name, {})
            
            result.append({
                'id': hash(name) % 1000000,
                'hotel_name': name,
                'hotel_image': metadata.get('hotel_image'),
                'address': metadata.get('address'),
                'country': metadata.get('country'),
                'country_code': metadata.get('country_code'),
                'star_rating': metadata.get('star_rating'),
                'average_rating': stat['avg_rating'], # Use DB calculated average
                'review_count': metadata.get('review_count'),
                'total_bookings': stat['total_bookings'], # Use DB calculated count
                'total_revenue': stat['total_revenue'], # Use DB calculated sum
                'source': metadata.get('source'),
                'bookings': hotel_details_map.get(name, [])
            })
        
        serializer = SuperAdminHotelDetailSerializer(result, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SuperAdminFlightDetailView(APIView):
    """
    Super Admin API to get detailed flight booking information.
    Shows all bookings for each flight with pricing and client details.
    """
    permission_classes = [IsPlatformSuperAdmin]
    
    def get(self, request):
        # 1. Get Base Queryset
        confirmed_flights = Flight.objects.filter(
            quote__status='CONFIRMED'
        ).select_related(
            'quote__trip__agent__agency',
            'quote__trip__client',
            'quote__trip'
        )


        
        flight_stats = confirmed_flights.values('carrier', 'flight_number').annotate(
            total_bookings=Count('id'),
            total_revenue=Sum('price_per_seat'), # Note: Flight model used price_per_seat in original code logic
            # Metadata:
        ).order_by('-total_revenue')

        # 3. Group details in Python (Hybrid approach)
        flight_details_map = defaultdict(list)
        flight_metadata_map = {}

        for flight in confirmed_flights:
            carrier = flight.carrier or 'Unknown'
            flight_num = flight.flight_number or 'N/A'
            key = f"{carrier}_{flight_num}" # Same key strategy
            
            if key not in flight_metadata_map:
                flight_metadata_map[key] = {
                    'carrier_logo': flight.carrier_logo,
                    'source': flight.source or 'Unknown',
                    'aircraft_type': None # Not in model
                }

            # Dates logic
            departure_date = None
            departure_time = None
            arrival_date = None
            arrival_time = None
            
            if flight.departure_datetime:
                departure_date = flight.departure_datetime.date()
                departure_time = flight.departure_datetime.time()
            elif flight.quote.trip.start_date:
                departure_date = flight.quote.trip.start_date
            
            if flight.arrival_datetime:
                arrival_date = flight.arrival_datetime.date()
                arrival_time = flight.arrival_datetime.time()
            elif flight.quote.trip.end_date:
                arrival_date = flight.quote.trip.end_date

            booking_detail = {
                'booking_id': flight.id,
                'quote_id': str(flight.quote.id),
                'quote_number': f"Q-{flight.quote.id}",
                'agency_name': flight.quote.trip.agent.agency.name,
                'agency_id': flight.quote.trip.agent.agency.id,
                'client_name': flight.quote.trip.client.full_name,
                'departure_airport': flight.departure_airport or flight.quote.trip.from_airport or 'N/A',
                'arrival_airport': flight.arrival_airport or flight.quote.trip.to_airport or 'N/A',
                'departure_date': departure_date,
                'departure_time': departure_time,
                'arrival_date': arrival_date,
                'arrival_time': arrival_time,
                'cabin_class': flight.travel_class,
                'price': flight.price_per_seat,
                'currency': flight.flight_currency,
                'booked_date': flight.quote.created_at,
                'status': flight.quote.status
            }
            flight_details_map[key].append(booking_detail)

        # 4. Construct Result
        result = []
        for stat in flight_stats:
            carrier = stat['carrier'] or 'Unknown'
            flight_num = stat['flight_number'] or 'N/A'
            key = f"{carrier}_{flight_num}"
            
            metadata = flight_metadata_map.get(key, {})
            
            result.append({
                'id': hash(key) % 1000000,
                'carrier': carrier,
                'carrier_logo': metadata.get('carrier_logo'),
                'flight_number': flight_num,
                'aircraft_type': metadata.get('aircraft_type'),
                'total_bookings': stat['total_bookings'],
                'total_revenue': stat['total_revenue'],
                'source': metadata.get('source'),
                'bookings': flight_details_map.get(key, [])
            })
            
        serializer = SuperAdminFlightDetailSerializer(result, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

