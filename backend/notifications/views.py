from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer
from accounts.permissions import IsAdminRole


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """Get notifications for the current user, or mark all as read."""
    if request.method == 'GET':
        limit = int(request.query_params.get('limit', 50))
        unread_only = request.query_params.get('unread_only', '').lower() == 'true'

        notifications = Notification.objects.filter(user=request.user)
        if unread_only:
            notifications = notifications.filter(is_read=False)

        notifications = notifications[:limit]
        serializer = NotificationSerializer(notifications, many=True)

        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()

        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count,
        })

    # POST: mark specific notifications as read
    notification_ids = request.data.get('ids', [])
    if notification_ids:
        Notification.objects.filter(id__in=notification_ids, user=request.user).update(is_read=True)
    else:
        Notification.objects.filter(user=request.user).update(is_read=True)

    return Response({'message': 'Notifications marked as read.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Get unread notification count for the current user."""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'unread_count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, notification_id):
    """Mark a single notification as read."""
    notification = Notification.objects.filter(id=notification_id, user=request.user).first()
    if notification:
        notification.is_read = True
        notification.save()
        return Response({'message': 'Marked as read.'})
    return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_notification_list(request):
    """Get notifications for admin users (admin-specific feed)."""
    limit = int(request.query_params.get('limit', 50))
    notifications = Notification.objects.filter(user=request.user)[:limit]
    serializer = NotificationSerializer(notifications, many=True)

    unread_count = Notification.objects.filter(user=request.user, is_read=False).count()

    return Response({
        'notifications': serializer.data,
        'unread_count': unread_count,
    })
