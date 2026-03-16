from rest_framework import permissions

class IsPlatformSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.groups.filter(name='Platform SuperAdmin').exists()
             or request.user.role == 'Platform SuperAdmin'
            )
        )


class IsAgencyAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.groups.filter(name='Agency Admin').exists()
             or request.user.role == 'Agency Admin' 
            )
        )


class IsAgencyAgent(permissions.BasePermission):
    """Allows access only to agency agents."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.groups.filter(name='Agency Agent').exists()
             or request.user.role == 'Agency Agent'
            )
        )


class IsAgencyAdminOrAgent(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.groups.filter(name__in=['Agency Admin', 'Agency Agent']).exists()
             or request.user.role in ['Agency Admin', 'Agency Agent']
            )
        )

class IsAgencyMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.groups.filter(name__in=['Agency Admin', 'Agency Agent']).exists()
             or request.user.role in ['Agency Admin', 'Agency Agent']
            )
        )