from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'full_name', 'role', 'is_onboarded', 'is_staff']
    list_filter = ['role', 'is_onboarded', 'is_staff', 'is_superuser', 'created_at']
    search_fields = ['username', 'email', 'full_name']
    readonly_fields = ['created_at', 'updated_at', 'reset_password_token_created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('full_name', 'role', 'is_onboarded', 'reset_password_token', 'reset_password_token_created_at', 'created_at', 'updated_at')
        }),
    )
