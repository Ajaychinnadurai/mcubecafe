from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='related_order.id', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'type', 'is_read', 'related_order',
                  'order_id', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
