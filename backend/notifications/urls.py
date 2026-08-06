from django.urls import path
from . import views

urlpatterns = [
    path('notifications/', views.notification_list, name='notification-list'),
    path('notifications/unread-count/', views.unread_count, name='notification-unread-count'),
    path('notifications/<int:notification_id>/mark-read/', views.mark_read, name='notification-mark-read'),
    path('admin/notifications/', views.admin_notification_list, name='admin-notification-list'),
]
