import openai
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from datetime import datetime
import json
import logging
import re
from django.core.cache import cache

logger = logging.getLogger(__name__)

class DestinationSuggestionsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get travel destination suggestions for next 3 months (with caching)"""
        
        # Cache key based on current month
        current_month = datetime.now().strftime("%Y-%m")
        cache_key = f"destinations_{current_month}"
        
        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"✓ Returning cached destinations for {current_month}")
            return Response(cached_data)
        
        try:
            openai.api_key = os.getenv('OPENAI_API_KEY')
            
            model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
            
            logger.info(f"Using model: {model}")
            
            current_date = datetime.now().strftime("%B %Y")
            
            # Simplified prompt for faster response
            prompt = f"""Current date: {current_date}

            List 3 top travel destinations for each of the next 2 months.

            Return valid JSON only:
            {{
                "months": [
                    {{
                        "month_name": "Month",
                        "destinations": [
                            {{
                                "name": "City, Country",
                                "country": "Country",
                                "why_visit": "Brief reason",
                                "temperature": "XX-XX°C",
                                "best_for": "Categories"
                            }}
                        ]
                    }}
                ]
            }}

            No markdown, no explanations.reply Fast"""
            
            response = openai.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.7,
                response_format={"type": "json_object"}  
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean JSON
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            response_text = re.sub(r',(\s*[}\]])', r'\1', response_text)
            
            try:
                data = json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                logger.error(f"Response: {response_text}")
                return Response(self._get_fallback())
            
            data['generated_at'] = datetime.now().isoformat()
            
            # Cache for 24 hours
            cache.set(cache_key, data, timeout=86400)
            logger.info(f"✓ Cached destinations for {current_month}")
            
            return Response(data)
            
        except Exception as e:
            logger.error(f"Error generating destinations: {str(e)}")
            return Response(self._get_fallback())
    