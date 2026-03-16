from rest_framework.response import Response
from rest_framework import status
from agency.models import Agency
from agent.models import Agent


def get_user_agency(user):
    if (user.groups.filter(name='Platform SuperAdmin').exists() or user.role == 'Platform SuperAdmin'):
            return None
    try:
        agency = Agency.objects.get(user=user)
        return agency
    except Agency.DoesNotExist:
        return None


def get_user_agent(user):
    if (user.groups.filter(name__in=['Platform SuperAdmin', 'Agency Admin']).exists() or user.role in ['Platform SuperAdmin', 'Agency Admin']):
            return None
    try:
        agent = Agent.objects.get(user=user)
        return agent
    except Agent.DoesNotExist:
        return None


def get_agency_from_request(request):
    if (request.user.groups.filter(name='Platform SuperAdmin').exists() or request.user.role == 'Platform SuperAdmin'):
        agency_id = request.query_params.get('agency_id') or request.data.get('agency_id')
        if not agency_id:
            return None, Response(
                {'error': 'agency_id is required for superadmin'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            return Agency.objects.get(id=agency_id), None
        except Agency.DoesNotExist:
            return None, Response(
                {'error': 'Agency not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    elif (request.user.groups.filter(name='Agency Admin').exists() or request.user.role == 'Agency Admin'):
        agency = get_user_agency(request.user)
        if not agency:
            return None, Response(
                {'error': 'Agency profile not found for user'},
                status=status.HTTP_404_NOT_FOUND
            )
        return agency, None
    return None, Response(
        {'error': 'Unauthorized access'},
        status=status.HTTP_403_FORBIDDEN
    )


def get_agent_from_request(request):
    if (request.user.groups.filter(name='Platform SuperAdmin').exists() or request.user.role == 'Platform SuperAdmin'):
        agent_id = request.query_params.get('agent_id') or request.data.get('agent_id')
        if not agent_id:
            return None, Response(
                {'error': 'agent_id is required for superadmin'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            return Agent.objects.get(id=agent_id), None
        except Agent.DoesNotExist:
            return None, Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    elif (request.user.groups.filter(name='Agency Admin').exists() or request.user.role == 'Agency Admin'):
        agent_id = request.query_params.get('agent_id') or request.data.get('agent_id')
        if not agent_id:
            return None, Response(
                {'error': 'agent_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        agency = get_user_agency(request.user)
        if not agency:
            return None, Response(
                {'error': 'Agency profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        try:
            agent = Agent.objects.get(id=agent_id, agency=agency)
            return agent, None
        except Agent.DoesNotExist:
            return None, Response(
                {'error': 'Agent not found or does not belong to your agency'},
                status=status.HTTP_404_NOT_FOUND
            )
    elif (request.user.groups.filter(name='Agency Agent').exists() or request.user.role == 'Agency Agent'):
        agent = get_user_agent(request.user)
        if not agent:
            return None, Response(
                {'error': 'Agent profile not found for user'},
                status=status.HTTP_404_NOT_FOUND
            )
        return agent, None
    return None, Response(
        {'error': 'Unauthorized access'},
        status=status.HTTP_403_FORBIDDEN
    )
