from rest_framework import serializers
from .models import Order, OrderItem, Payment
from menu.models import MenuItem
from menu.serializers import MenuItemSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_id = serializers.IntegerField(write_only=True)
    menu_item_detail = MenuItemSerializer(source='menu_item', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_id', 'menu_item_detail',
                  'item_name', 'quantity', 'price_at_order', 'subtotal']
        read_only_fields = ['id', 'item_name', 'price_at_order', 'subtotal']


class OrderCreateSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField(), min_length=1)
    order_type = serializers.ChoiceField(choices=Order.OrderType.choices, default=Order.OrderType.DINE_IN)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, required=True)
    whatsapp_number = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_items(self, items):
        validated_items = []
        for item in items:
            menu_item_id = item.get('menu_item_id') or item.get('id') or item.get('menu_item')
            raw_quantity = item.get('quantity', 1)

            if not menu_item_id:
                raise serializers.ValidationError('menu_item_id is required.')

            try:
                quantity = int(raw_quantity)
                if quantity <= 0:
                    raise serializers.ValidationError('Quantity must be greater than 0.')
            except (ValueError, TypeError):
                raise serializers.ValidationError('Quantity must be a valid integer.')

            try:
                menu_item = MenuItem.objects.get(id=menu_item_id, is_available=True)
            except (MenuItem.DoesNotExist, ValueError, TypeError):
                raise serializers.ValidationError(f'Menu item {menu_item_id} not found or unavailable.')

            validated_items.append({
                'menu_item': menu_item,
                'quantity': quantity,
                'price': menu_item.price,
                'item_name': menu_item.name,
            })
        return validated_items


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_name', 'status', 'status_display', 'payment_method',
                  'payment_method_display', 'order_type', 'total_amount', 'whatsapp_number',
                  'notes', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'total_amount', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'method', 'status', 'amount',
                  'stripe_payment_intent_id', 'upi_transaction_ref',
                  'paid_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)


class AdminOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_phone = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_name', 'user_phone', 'status', 'status_display',
                  'payment_method', 'payment_method_display', 'order_type', 'total_amount',
                  'whatsapp_number', 'notes', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'total_amount', 'created_at', 'updated_at']

    def get_user_phone(self, obj):
        """Customers register with a WhatsApp number; phone_number is often empty."""
        return obj.user.phone_number or obj.user.whatsapp_number or ''
