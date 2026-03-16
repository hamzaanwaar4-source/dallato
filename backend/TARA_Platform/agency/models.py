from django.db import models
from django.conf import settings

class Agency(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agency'
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    default_currency = models.CharField(max_length=3, default='USD')
    default_markup_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    agent_commission = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'agency'
        verbose_name_plural = 'Agencies'

    def __str__(self):
        return self.name


class Supplier(models.Model):
    SUPPLIER_TYPE_CHOICES = [
        ('DUFFEL', 'Duffel'),
        ('AMADEUS', 'Amadeus'),
        ('BOOKING.COM', 'Booking.com'),
    ]
    
    SUPPLIER_CATEGORY_CHOICES = [
        ('FLIGHT', 'Flight'),
        ('HOTEL', 'Hotel'),
        ('BOTH', 'Both'),
    ]

    agency = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name='suppliers'
    )
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=SUPPLIER_TYPE_CHOICES)
    category = models.CharField(max_length=10, choices=SUPPLIER_CATEGORY_CHOICES, default='BOTH')
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supplier'

    def __str__(self):
        return f"{self.name} ({self.type})"
