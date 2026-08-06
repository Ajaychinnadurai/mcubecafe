from django.db import models
from django.conf import settings


class Notification(models.Model):
    class Type(models.TextChoices):
        ORDER_CONFIRMED = 'order_confirmed', 'Order Confirmed'
        PAYMENT_RECEIVED = 'payment_received', 'Payment Received'
        STATUS_CHANGE = 'status_change', 'Status Change'
        NEW_ORDER = 'new_order', 'New Order (Admin)'
        BILL_SENT = 'bill_sent', 'Bill Sent'
        GENERAL = 'general', 'General'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.TextField()
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.GENERAL)
    is_read = models.BooleanField(default=False)
    related_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.user.username}: {self.message[:50]}"
