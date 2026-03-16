from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/travel-assistant/$', consumers.TravelAssistantConsumer.as_asgi()),
    re_path(r'ws/transcription/$', consumers.AudioTranscriptionConsumer.as_asgi()),

]
