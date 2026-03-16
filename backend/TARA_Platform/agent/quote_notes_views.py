from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from agent.models import Quote
from user.config import IsAgencyAdminOrAgent
from user.utils import get_agent_from_request


class QuoteNotesView(APIView):
    permission_classes = [IsAgencyAdminOrAgent]
    
    def get(self, request):
        agent, error_response = get_agent_from_request(request)
        if error_response:
            return error_response
        
        quote_id = request.query_params.get('quote_id')
        if not quote_id:
            return Response(
                {'error': 'quote_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quote = Quote.objects.get(id=quote_id, agent=agent)
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found or does not belong to your agent profile'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'quote_id': quote.id,
            'notes': quote.notes or ''
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        agent, error_response = get_agent_from_request(request)
        if error_response:
            return error_response
        
        quote_id = request.data.get('quote_id')
        notes = request.data.get('notes', '')
        
        if not quote_id:
            return Response(
                {'error': 'quote_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quote = Quote.objects.get(id=quote_id, agent=agent)
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found or does not belong to your agent profile'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        quote.notes = notes
        quote.save()
        
        return Response({
            'message': 'Notes saved successfully',
            'quote_id': quote.id,
            'notes': quote.notes
        }, status=status.HTTP_200_OK)
    
    def patch(self, request):
        return self.post(request)
