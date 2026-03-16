from django.conf import settings
from django.db import models


class AIChatSession(models.Model):
    agency = models.ForeignKey(
        'agency.Agency',
        on_delete=models.CASCADE,
        related_name='ai_chat_sessions'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='ai_chat_sessions_created',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=255)
    trip_details = models.JSONField(null=True, blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_chatsession'

    def __str__(self):
        return self.title


class AIMessage(models.Model):
    SENDER_CHOICES = [
        ('USER', 'User'),
        ('ASSISTANT', 'Assistant'),
        ('SYSTEM', 'System'),
    ]

    session = models.ForeignKey(
        AIChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    text = models.TextField()
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_message'

    def __str__(self):
        return f"{self.sender}: {self.text[:50]}"


