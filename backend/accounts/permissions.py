from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Check if user has admin role - used for admin-only API endpoints."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_admin_user or request.user.is_staff)
        )


class IsCustomerUser(BasePermission):
    """Check if user is a customer."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_customer
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level permission: only the owner or admin can access."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_user or request.user.is_staff:
            return True
        # Check if the object has a 'user' field
        owner = getattr(obj, 'user', None)
        if owner:
            return owner == request.user
        return False
