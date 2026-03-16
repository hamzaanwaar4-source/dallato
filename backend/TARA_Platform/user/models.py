from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    ROLE_CHOICES = [
        ('PLATFORM_SUPERADMIN', 'Platform SuperAdmin'),
        ('AGENCY_ADMIN', 'Agency Admin'),
        ('AGENCY_AGENT', 'Agency Agent'),
    ]
    
    full_name = models.CharField(max_length=255, blank=True, null=True)
    reset_password_token = models.CharField(null=True, blank=True, max_length=255)
    reset_password_token_created_at = models.DateTimeField(null=True, blank=True)
    is_onboarded = models.BooleanField(default=False)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='AGENCY_AGENT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    first_name = None
    last_name = None

    @property
    def has_reset_password_token_expired(self):
        expiration_time = self.reset_password_token_created_at + timedelta(minutes=30)
        return expiration_time <= timezone.now()

    def update_reset_password_token(self, token):
        self.reset_password_token = token
        self.reset_password_token_created_at = timezone.now()
        self.save()

    def __str__(self):
        return self.username