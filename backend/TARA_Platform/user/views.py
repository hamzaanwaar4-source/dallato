from django.shortcuts import render
from rest_framework.views import APIView
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import *
from django.contrib.auth.models import Group
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from rest_framework import status
from dotenv import load_dotenv
from django.contrib.auth import authenticate
from django.template.loader import render_to_string
from django.core.mail import send_mail
from datetime import datetime
from django.utils import timezone
import uuid
import logging
import platform
import psutil
import time
from django.db import connection
from user.config import IsPlatformSuperAdmin
from django.db.models import Q
from .serializers import UserSerializer, SuperAdminCRMOverviewSerializer
from agent.models import Client, ActivityLog
from . import email_messenger
from django.contrib.auth.password_validation import validate_password
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import Token

logger = logging.getLogger(__name__)
load_dotenv()

# Create your views here.

class LoginUserAPIView(APIView):
    """
    API view to handle user login requests.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """
        Authenticate a user based on username and password.

        If authentication is successful, serialize the user data and return it.
        If not, return a 404 not found response indicating the user could not be authenticated.
        """
        try:
            username = request.data.get('username')
            password = request.data.get('password')

            if not username or not password:
                return Response({"error": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

            user = authenticate(username=username, password=password)

            if user is None:
                return Response({"message": 'Invalid Credentials! '}, status=status.HTTP_404_NOT_FOUND)

            user.last_login = timezone.now()
            user.save()
            serializer = UserSerializer(user)
            response_data = serializer.data
            logger.info(f"User `{username}` logged-in successfully!")
            return Response(data=response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Internal Server Error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    """
    API view to handle password reset requests for users.
    """
    def __init__(self):
        self.EMAIL_SERVICE = email_messenger.EmailService()

    def post(self, request):
        """
        Handles POST request to reset a user's password.

        The method checks if an email is provided, finds the user with that email,
        generates a reset token, and sends a password reset email.
        """
        try:
            # Extract email from request data
            email = request.data.get('email')

            # Check if the email was provided
            if email is not None:
                # Query the database for users with the given email
                users = User.objects.filter(email=email)
                if users.exists():
                    user = users.first()
                    username = user.username

                    # Generate a unique token for password reset
                    token = str(uuid.uuid4())
                    user.update_reset_password_token(token)

                    # Construct the password reset URL with token as query parameter
                    reset_url = f"{settings.FORGOT_PASSWORD['RESET_URL']}?token={token}"

                    # Render the email message from a template
                    message = render_to_string(
                        "user/reset_password_link_email.html",
                        {"link": reset_url, "username": username}
                    )

                    # call send email module
                    subject = settings.FORGOT_PASSWORD["EMAIL_SUBJECT"]
                    execute_email = self.EMAIL_SERVICE.send_email(
                        email=user.email,
                        subject=subject,
                        message=message
                    )
                    if not execute_email:
                        return Response({
                            'error': f'Unable to send email to the user: `{user.email}`',
                        }, status=status.HTTP_400_BAD_REQUEST)

                else:
                    return Response({
                        'error': 'User not found',
                        'message': 'No user found with the provided email.'
                    }, status=status.HTTP_404_NOT_FOUND)

            else:
                # Return an error if email is not provided
                return Response({
                    'error': 'Missing email',
                    'message': 'Please provide an email address to reset the password.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Confirm that the password reset email was sent
            return Response({
                'message': 'Password recovery email sent'
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({
                'error': f'Internal Server Error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreatePasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def put(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        try:
            user = User.objects.filter(reset_password_token=token).first()
            
            if not user:
                return Response({
                    'error': 'Invalid token'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"{user} user attempting to set password!")

            if user.has_reset_password_token_expired:
                return Response(data={
                    'error': 'Expired token: The password creation link has expired. Please request a new link.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if user.is_onboarded and user.check_password(new_password):
                return Response(
                    "New password must be different from the old password",
                    status.HTTP_400_BAD_REQUEST
                )

            if new_password != confirm_password:
                return Response(
                    "New password and confirm new password does not match.",
                    status.HTTP_400_BAD_REQUEST
                )

            if not user.is_active:
                return Response("User not found", status.HTTP_401_UNAUTHORIZED)

            try:
                validate_password(new_password, user=user)
            except Exception as e:
                error_messages = []
                if hasattr(e, 'messages'):
                    error_messages = list(e.messages)
                else:
                    error_messages = [str(e)]
                
                formatted_errors = {
                    'error': 'Password validation failed',
                    'details': error_messages,
                    'requirements': [
                        'Password must be at least 8 characters long',
                        'Password cannot be too similar to your personal information',
                        'Password cannot be a commonly used password',
                        'Password cannot be entirely numeric'
                    ]
                }
                return Response(formatted_errors, status=status.HTTP_400_BAD_REQUEST)

            was_first_time = not user.is_onboarded  
            
            user.set_password(new_password)
            user.is_onboarded = True  
            user.reset_password_token = None  
            user.reset_password_token_created_at = None
            user.save()
            
            return Response(data={
                'message': 'Password set successfully',
                'username': user.username,
                'is_first_time': was_first_time
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(data={
                'error': f'Internal Server Error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class LogoutUserAPIView(APIView):
    """
    API view to handle user logout requests.
    Blacklists the refresh token to prevent reuse.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Logout the authenticated user by blacklisting their refresh token.
        
        Expected payload:
        {
            "refresh": "refresh_token_here"
        }
        """
        try:
            user = request.user
            username = user.username
            
            # Get refresh token from request
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response({       
                    'error': 'Refresh token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Blacklist the refresh token
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                
                logger.info(f"User `{username}` logged out successfully!")
                
                return Response({
                    'message': 'Logged out successfully',
                    'username': username
                }, status=status.HTTP_200_OK)
                
            except TokenError as e:
                return Response({
                    'error': f'Invalid token: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            except AttributeError:
                # Fallback if blacklist is not available
                logger.info(f"User `{username}` logged out (token blacklist not available)")
                return Response({
                    'message': 'Logged out successfully',
                    'username': username
                }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Internal Server Error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SystemHealthView(APIView):
    """
    API endpoint to provide detailed system health metrics.
    Only accessible by Platform Super Admins.
    """
    permission_classes = [IsPlatformSuperAdmin]

    def get(self, request):
        try:
            # CPU Metrics
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()

            # Memory Metrics
            memory = psutil.virtual_memory()
            
            # Disk Metrics
            disk = psutil.disk_usage('/')

            # Database Status
            db_status = "Healthy"
            try:
                connection.ensure_connection()
            except Exception:
                db_status = "Unhealthy"

            # Uptime
            boot_time = psutil.boot_time()
            uptime_seconds = time.time() - boot_time
            
            # Platform Info
            system_info = {
                "os": platform.system(),
                "os_release": platform.release(),
                "python_version": platform.python_version(),
                "processor": platform.processor(),
            }

            health_data = {
                "status": "Healthy" if db_status == "Healthy" and cpu_percent < 90 else "Warning",
                "timestamp": timezone.now(),
                "uptime": uptime_seconds,
                "cpu": {
                    "usage_percent": cpu_percent,
                    "cores": cpu_count,
                    "frequency_mhz": cpu_freq.current if cpu_freq else 0,
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "used": memory.used,
                    "percent": memory.percent,
                },
                "disk": {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent": disk.percent,
                },
                "database": {
                    "status": db_status,
                    "engine": settings.DATABASES['default']['ENGINE'].split('.')[-1],
                },
                "system": system_info
            }

            return Response(health_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in SystemHealthView: {str(e)}")
            return Response({
                "error": "Failed to collect system metrics",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SuperAdminCRMOverviewView(APIView):
    permission_classes = [IsPlatformSuperAdmin]
    
    def get(self, request):
        total_clients = Client.objects.all().count()
        
        current_month = datetime.now().month
        current_year = datetime.now().year
        new_clients = Client.objects.filter(
            created_at__month=current_month,
            created_at__year=current_year
        ).count()
        
        high_value_clients = Client.objects.filter(
            travel_style='LUXURY'
        ).count()
        
        recent_activities = ActivityLog.objects.all().select_related('agent', 'agency').order_by('-created_at')[:10]
        
        data = {
            'total_clients': total_clients,
            'new_clients': new_clients,
            'high_value_clients': high_value_clients,
            'recent_activities': recent_activities
        }
        
        serializer = SuperAdminCRMOverviewSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)