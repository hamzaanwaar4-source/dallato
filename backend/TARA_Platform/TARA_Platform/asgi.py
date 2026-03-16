"""
ASGI config for TARA_Platform project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'TARA_Platform.settings')

# Important: Capture Django ASGI app BEFORE importing channels
django_asgi_app = get_asgi_application()

# Now import channels components
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chatbot.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chatbot.routing.websocket_urlpatterns
        )
    ),
})

print("Routes: HTTP -> Django, WebSocket -> Channels")
print("WebSocket endpoints available:")
print("  - ws://localhost:8000/ws/travel-assistant/ (CRM data extraction)")
print("  - ws://localhost:8000/ws/transcription/ (Audio transcription only)")
print("ASGI ready on port 8000")
print("Note: MCP server runs separately on port 8001")