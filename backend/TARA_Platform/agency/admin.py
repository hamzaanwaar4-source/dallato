from django.contrib import admin
from .models import Agency, Supplier


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'default_currency', 'is_active', 'created_at']
    list_filter = ['is_active', 'default_currency', 'created_at']
    search_fields = ['name', 'slug']
    readonly_fields = ['created_at', 'updated_at']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'agency', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
