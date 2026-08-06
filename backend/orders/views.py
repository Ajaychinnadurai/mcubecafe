import stripe
import qrcode
import io
import base64
from decimal import Decimal
from datetime import datetime
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order, OrderItem, Payment
from .serializers import (
    OrderSerializer, OrderCreateSerializer, PaymentSerializer,
    AdminOrderSerializer, OrderStatusUpdateSerializer,
)
from accounts.permissions import IsAdminRole, IsOwnerOrAdmin
from notifications.models import Notification


def _create_notification(user, message, type_, order=None):
    """Helper to create a notification."""
    Notification.objects.create(
        user=user,
        message=message,
        type=type_,
        related_order=order,
    )


def _create_bill_data(order):
    """Generate bill data (to be used for PDF and WhatsApp)."""
    items = []
    for item in order.items.all():
        items.append({
            'name': item.item_name,
            'item_name': item.item_name,
            'quantity': item.quantity,
            'price': float(item.price_at_order),
            'subtotal': float(item.subtotal),
        })
    return {
        'order_id': order.id,
        'cafe_name': "M Cube's Cafe",
        'cafe_address': 'Near Bharathiyar University, Coimbatore, Tamil Nadu 641046',
        'date': order.created_at.strftime('%d %b %Y, %I:%M %p'),
        'items': items,
        'total': float(order.total_amount),
        'total_amount': float(order.total_amount),
        'payment_method': order.get_payment_method_display() if order.payment_method else 'N/A',
        'status': order.get_status_display(),
        'order_type': order.get_order_type_display(),
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create a new order with items."""
    serializer = OrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        print(">>> CREATE ORDER INVALID PAYLOAD:", request.data)
        print(">>> CREATE ORDER SERIALIZER ERRORS:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    try:
        with transaction.atomic():
            # Calculate total
            total = Decimal('0')
            order_items_data = []
            for item_data in data['items']:
                menu_item = item_data['menu_item']
                qty = int(item_data['quantity'])
                price = Decimal(str(menu_item.price))
                subtotal = price * qty
                total += subtotal
                order_items_data.append({
                    'menu_item': menu_item,
                    'quantity': qty,
                    'price': price,
                    'item_name': menu_item.name,
                })

            # Determine initial status based on payment method
            payment_method = data['payment_method']
            if payment_method == 'cash':
                initial_status = Order.Status.PENDING_COUNTER
            else:
                initial_status = Order.Status.PENDING_PAYMENT

            whatsapp_num = (data.get('whatsapp_number') or getattr(request.user, 'whatsapp_number', '') or '')[:15]

            # Create order
            order = Order.objects.create(
                user=request.user,
                status=initial_status,
                payment_method=payment_method,
                order_type=data.get('order_type', Order.OrderType.DINE_IN),
                total_amount=total,
                whatsapp_number=whatsapp_num,
                notes=data.get('notes', ''),
            )

            # Create order items
            for item_data in order_items_data:
                OrderItem.objects.create(
                    order=order,
                    menu_item=item_data['menu_item'],
                    item_name=item_data['item_name'],
                    quantity=item_data['quantity'],
                    price_at_order=item_data['price'],
                )

            # Create a pending payment record
            if payment_method != 'cash':
                Payment.objects.create(
                    order=order,
                    method=payment_method,
                    status=Payment.PaymentStatus.PENDING,
                    amount=total,
                )

            # Create notification for customer
            try:
                _create_notification(
                    request.user,
                    f'Order #{order.id} has been placed!',
                    'order_confirmed',
                    order
                )
            except Exception as ne:
                print(f"Failed to create customer notification: {ne}")

            # Create notification for admins
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                admins = User.objects.filter(role='admin', is_active=True)
                user_identifier = getattr(request.user, 'username', None) or getattr(request.user, 'email', None) or 'Customer'
                for admin in admins:
                    _create_notification(
                        admin,
                        f'New order #{order.id} from {user_identifier} — ₹{total}',
                        'new_order',
                        order
                    )
            except Exception as ne:
                print(f"Failed to create admin notification: {ne}")

        response_data = OrderSerializer(order).data

        # For cash orders, auto-generate bill immediately
        if payment_method == 'cash':
            bill_data = _create_bill_data(order)
            response_data['bill'] = bill_data

        return Response(response_data, status=status.HTTP_201_CREATED)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders(request):
    """Get current user's order history."""
    orders = Order.objects.filter(user=request.user).prefetch_related('items__menu_item')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """Get a single order's details."""
    order = get_object_or_404(Order, id=order_id)
    if order.user != request.user and not request.user.is_admin_user:
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stripe_payment(request):
    """Create a Stripe PaymentIntent for an order."""
    order_id = request.data.get('order_id')
    order = get_object_or_404(Order, id=order_id, user=request.user)

    if order.status not in [Order.Status.PENDING_PAYMENT]:
        return Response({'error': 'Order is not in pending payment state.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        intent = stripe.PaymentIntent.create(
            amount=int(order.total_amount * 100),  # Convert to paise
            currency='inr',
            metadata={
                'order_id': order.id,
                'user_id': request.user.id,
            },
        )

        # Update payment record
        payment, created = Payment.objects.get_or_create(
            order=order,
            method='stripe',
            defaults={'amount': order.total_amount, 'status': 'pending'}
        )
        payment.stripe_payment_intent_id = intent.id
        payment.save()

        return Response({
            'client_secret': intent.client_secret,
            'publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
            'amount': float(order.total_amount),
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stripe_payment_confirm(request):
    """Confirm a Stripe payment (called after successful payment on frontend)."""
    order_id = request.data.get('order_id')
    payment_intent_id = request.data.get('payment_intent_id')

    order = get_object_or_404(Order, id=order_id, user=request.user)

    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        if intent.status == 'succeeded':
            with transaction.atomic():
                order.status = Order.Status.PAID
                order.save()

                payment = Payment.objects.get(order=order, method='stripe')
                payment.status = 'completed'
                payment.paid_at = datetime.now()
                payment.save()

                # Notifications
                _create_notification(
                    request.user,
                    f'Payment received for Order #{order.id}! Your order is being prepared.',
                    'payment_received',
                    order
                )

                from django.contrib.auth import get_user_model
                User = get_user_model()
                admins = User.objects.filter(role='admin', is_active=True)
                for admin in admins:
                    _create_notification(
                        admin,
                        f'Payment confirmed for Order #{order.id} (Stripe) — ₹{order.total_amount}',
                        'payment_received',
                        order
                    )

            return Response({
                'success': True,
                'message': 'Payment successful!',
                'order': OrderSerializer(order).data,
                'bill': _create_bill_data(order),
            })
        else:
            return Response({'error': f'Payment status: {intent.status}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upi_payment(request):
    """Generate UPI deep link and QR code for payment."""
    order_id = request.data.get('order_id')
    order = get_object_or_404(Order, id=order_id, user=request.user)

    if order.status != Order.Status.PENDING_PAYMENT:
        return Response({'error': 'Order is not in pending payment state.'}, status=status.HTTP_400_BAD_REQUEST)

    upi_id = settings.UPI_ID
    payee_name = settings.UPI_PAYEE_NAME
    amount = float(order.total_amount)
    transaction_ref = f"MCUBE{order.id}{datetime.now().strftime('%y%m%d%H%M%S')}"

    # Generate UPI deep link
    upi_link = f"upi://pay?pa={upi_id}&pn={payee_name}&am={amount}&cu=INR&tn=Order%20#{order.id}&tr={transaction_ref}"

    # Generate QR code as base64
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(upi_link)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    # Update payment record
    payment, created = Payment.objects.get_or_create(
        order=order,
        method='upi',
        defaults={'amount': order.total_amount, 'status': 'pending'}
    )
    payment.upi_transaction_ref = transaction_ref
    payment.save()

    return Response({
        'upi_link': upi_link,
        'qr_code': f'data:image/png;base64,{qr_base64}',
        'transaction_ref': transaction_ref,
        'amount': amount,
        'payee_name': payee_name,
        'upi_id': upi_id,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upi_payment_confirm(request):
    """Confirm a UPI payment (for testing, in production this would be a webhook)."""
    order_id = request.data.get('order_id')
    transaction_ref = request.data.get('transaction_ref', '')

    order = get_object_or_404(Order, id=order_id, user=request.user)

    with transaction.atomic():
        order.status = Order.Status.PAID
        order.save()

        payment = Payment.objects.get(order=order, method='upi')
        payment.status = 'completed'
        payment.paid_at = datetime.now()
        if transaction_ref:
            payment.upi_transaction_ref = transaction_ref
        payment.save()

        _create_notification(
            request.user,
            f'UPI payment received for Order #{order.id}! Your order is being prepared.',
            'payment_received',
            order
        )

    return Response({
        'success': True,
        'message': 'UPI payment confirmed!',
        'order': OrderSerializer(order).data,
        'bill': _create_bill_data(order),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cash_payment(request):
    """Place an order as cash on delivery / pay at counter."""
    order_id = request.data.get('order_id')
    order = get_object_or_404(Order, id=order_id, user=request.user)

    if order.status != Order.Status.PENDING_COUNTER:
        return Response({'error': 'Order is not in pending counter state.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        order.status = Order.Status.PAID
        order.save()

        Payment.objects.create(
            order=order,
            method='cash',
            status='completed',
            amount=order.total_amount,
            paid_at=datetime.now(),
        )

        _create_notification(
            request.user,
            f'Cash payment confirmed for Order #{order.id}! Thanks for your visit!',
            'payment_received',
            order
        )

    return Response({
        'success': True,
        'message': 'Cash payment confirmed!',
        'order': OrderSerializer(order).data,
        'bill': _create_bill_data(order),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_bill(request, order_id):
    """Get bill data for an order (JSON)."""
    order = get_object_or_404(Order, id=order_id)
    if order.user != request.user and not request.user.is_admin_user:
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    bill_data = _create_bill_data(order)
    return Response(bill_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_bill_pdf(request, order_id):
    """Download bill as PDF for an order."""
    order = get_object_or_404(Order, id=order_id)
    if order.user != request.user and not request.user.is_admin_user:
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    from .bill_generator import generate_bill_pdf

    bill_data = _create_bill_data(order)
    pdf_buffer = generate_bill_pdf(bill_data)

    response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Mcubes_Bill_#{order.id}.pdf"'
    response['Content-Length'] = pdf_buffer.tell()
    return response


# ======== ADMIN ENDPOINTS ========

@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_orders(request):
    """Get all orders (admin only)."""
    status_filter = request.query_params.get('status')
    payment_filter = request.query_params.get('payment_method')

    orders = Order.objects.all().prefetch_related('items__menu_item', 'user')

    if status_filter:
        orders = orders.filter(status=status_filter)
    if payment_filter:
        orders = orders.filter(payment_method=payment_filter)

    serializer = AdminOrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminRole])
def admin_order_detail(request, order_id):
    """Get or update an order (admin only)."""
    order = get_object_or_404(Order, id=order_id)

    if request.method == 'GET':
        serializer = AdminOrderSerializer(order)
        return Response(serializer.data)

    # PATCH: update order status
    serializer = OrderStatusUpdateSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    new_status = serializer.validated_data.get('status')
    old_status = order.status

    with transaction.atomic():
        order.status = new_status
        order.save()

        # Create notifications for status changes
        status_messages = {
            'paid': 'Your payment has been confirmed!',
            'preparing': 'Your order is now being prepared! 🍳',
            'ready': 'Your order is ready! 🎉 Please collect it from the counter.',
            'completed': 'Your order has been completed. Thank you!',
            'cancelled': 'Your order has been cancelled.',
        }

        if new_status in status_messages:
            _create_notification(
                order.user,
                f'Order #{order.id}: {status_messages[new_status]}',
                'status_change',
                order
            )

        # If marking cash as paid
        if new_status == 'paid' and old_status == Order.Status.PENDING_COUNTER:
            Payment.objects.create(
                order=order,
                method='cash',
                status='completed',
                amount=order.total_amount,
                paid_at=datetime.now(),
            )

    serializer = AdminOrderSerializer(order)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminRole])
def admin_mark_cash_paid(request, order_id):
    """Mark a cash order as paid (admin only)."""
    order = get_object_or_404(Order, id=order_id, payment_method='cash')

    with transaction.atomic():
        order.status = Order.Status.PAID
        order.save()

        Payment.objects.create(
            order=order,
            method='cash',
            status='completed',
            amount=order.total_amount,
            paid_at=datetime.now(),
        )

        _create_notification(
            order.user,
            f'Order #{order.id}: Cash payment confirmed at counter!',
            'payment_received',
            order
        )

    return Response(AdminOrderSerializer(order).data)


@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_dashboard_stats(request):
    """Get sales overview incl. 7-day trend, status breakdown and top items (admin only)."""
    from django.utils import timezone
    from django.db.models import Sum, F
    from datetime import timedelta

    today = timezone.now().date()
    now = timezone.now()

    today_orders = Order.objects.filter(created_at__date=today)
    total_today = sum(o.total_amount for o in today_orders)

    pending_orders = Order.objects.filter(
        status__in=['pending_payment', 'pending_counter', 'paid', 'preparing']
    ).count()

    # Revenue from orders that actually count as revenue
    revenue_statuses = ['paid', 'preparing', 'ready', 'completed']

    # Last 7 days revenue series
    week_revenue = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_orders = Order.objects.filter(created_at__date=day, status__in=revenue_statuses)
        week_revenue.append({
            'date': day.strftime('%a %d'),
            'revenue': float(sum(o.total_amount for o in day_orders)),
            'orders': day_orders.count(),
        })

    # Status breakdown
    status_counts = {
        status_value: Order.objects.filter(status=status_value).count()
        for status_value, _ in Order.Status.choices
    }

    # Top selling items (last 30 days)
    month_ago = now - timedelta(days=30)
    top_item_qs = (
        OrderItem.objects
        .filter(order__created_at__gte=month_ago)
        .annotate(line_revenue=F('quantity') * F('price_at_order'))
        .values('item_name')
        .annotate(quantity=Sum('quantity'), revenue=Sum('line_revenue'))
        .order_by('-quantity')[:5]
    )
    top_items = [{
        'name': t['item_name'],
        'quantity': t['quantity'],
        'revenue': float(t['revenue'] or 0),
    } for t in top_item_qs]

    # Last 30 days revenue series for Trend Line Graph
    month_trend = []
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        day_orders = Order.objects.filter(created_at__date=day, status__in=revenue_statuses)
        month_trend.append({
            'date': day.strftime('%b %d'),
            'full_date': day.strftime('%d %b %Y'),
            'revenue': float(sum(o.total_amount for o in day_orders)),
            'orders': day_orders.count(),
        })

    # Month totals
    month_start = today.replace(day=1)
    month_orders = Order.objects.filter(created_at__date__gte=month_start)
    month_revenue = sum(o.total_amount for o in month_orders.filter(status__in=revenue_statuses))

    return Response({
        'today_orders_count': today_orders.count(),
        'today_revenue': float(total_today),
        'pending_orders_count': pending_orders,
        'total_orders_count': Order.objects.count(),
        'week_revenue': week_revenue,
        'month_trend': month_trend,
        'month_revenue': float(month_revenue),
        'month_orders_count': month_orders.count(),
        'status_counts': status_counts,
        'top_items': top_items,
    })


# ======== ADMIN EXPORT / DATA DOWNLOAD ENDPOINTS ========

import csv

@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_export_orders_csv(request):
    """Export orders to CSV (admin only)."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="mcubes_orders_{datetime.now().strftime("%Y%m%d_%H%M")}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Order ID', 'Date & Time', 'Customer Username', 'Customer Email',
        'WhatsApp Number', 'Order Type', 'Payment Method', 'Status',
        'Items Purchased', 'Total Amount (INR)'
    ])

    status_filter = request.query_params.get('status')
    payment_filter = request.query_params.get('payment_method')

    orders = Order.objects.all().prefetch_related('items', 'user').order_by('-created_at')
    if status_filter:
        orders = orders.filter(status=status_filter)
    if payment_filter:
        orders = orders.filter(payment_method=payment_filter)

    for order in orders:
        items_str = ", ".join([f"{item.quantity}x {item.item_name}" for item in order.items.all()])
        writer.writerow([
            order.id,
            order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            getattr(order.user, 'username', 'N/A'),
            getattr(order.user, 'email', 'N/A'),
            order.whatsapp_number or getattr(order.user, 'whatsapp_number', 'N/A'),
            order.get_order_type_display(),
            order.get_payment_method_display() if order.payment_method else 'N/A',
            order.get_status_display(),
            items_str,
            float(order.total_amount)
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_export_menu_csv(request):
    """Export menu items to CSV (admin only)."""
    from menu.models import MenuItem
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="mcubes_menu_{datetime.now().strftime("%Y%m%d_%H%M")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Item ID', 'Item Name', 'Category', 'Price (INR)', 'Bestseller', 'Veg/Non-Veg', 'Available', 'Description'])

    items = MenuItem.objects.all().select_related('category').order_by('category__order', 'name')
    for item in items:
        writer.writerow([
            item.id,
            item.name,
            item.category.name,
            float(item.price),
            'Yes' if item.is_bestseller else 'No',
            'Veg' if item.is_veg else 'Non-Veg',
            'Yes' if item.is_available else 'No',
            item.description
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_export_sales_csv(request):
    """Export sales metrics summary to CSV (admin only)."""
    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Sum, F

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="mcubes_sales_report_{datetime.now().strftime("%Y%m%d_%H%M")}.csv"'

    writer = csv.writer(response)

    # Overview section
    revenue_statuses = ['paid', 'preparing', 'ready', 'completed']
    all_completed = Order.objects.filter(status__in=revenue_statuses)
    total_rev = sum(o.total_amount for o in all_completed)

    writer.writerow(['=== M CUBE\'S CAFE SALES OVERVIEW REPORT ==='])
    writer.writerow(['Generated At', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    writer.writerow(['Total All-Time Revenue (INR)', float(total_rev)])
    writer.writerow(['Total Orders Placed', Order.objects.count()])
    writer.writerow(['Total Paid/Completed Orders', all_completed.count()])
    writer.writerow([])

    # Daily breakdown (last 14 days)
    writer.writerow(['=== DAILY REVENUE BREAKDOWN (LAST 14 DAYS) ==='])
    writer.writerow(['Date', 'Completed Orders', 'Daily Revenue (INR)'])
    today = timezone.now().date()
    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        day_orders = Order.objects.filter(created_at__date=day, status__in=revenue_statuses)
        day_rev = sum(o.total_amount for o in day_orders)
        writer.writerow([day.strftime('%Y-%m-%d (%a)'), day_orders.count(), float(day_rev)])
    writer.writerow([])

    # Top selling items
    writer.writerow(['=== TOP SELLING ITEMS (ALL TIME) ==='])
    writer.writerow(['Item Name', 'Total Quantity Sold', 'Total Revenue Generated (INR)'])
    top_items = (
        OrderItem.objects
        .annotate(line_revenue=F('quantity') * F('price_at_order'))
        .values('item_name')
        .annotate(quantity=Sum('quantity'), revenue=Sum('line_revenue'))
        .order_by('-quantity')
    )
    for ti in top_items:
        writer.writerow([ti['item_name'], ti['quantity'], float(ti['revenue'] or 0)])

    return response


@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_export_customers_csv(request):
    """Export customer directory to CSV (admin only)."""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="mcubes_customers_{datetime.now().strftime("%Y%m%d_%H%M")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['User ID', 'Username', 'Email', 'WhatsApp / Phone', 'Role', 'Date Joined', 'Total Orders Placed', 'Total Spent (INR)'])

    users = User.objects.all().order_by('-date_joined')
    for u in users:
        u_orders = Order.objects.filter(user=u)
        paid_orders = u_orders.filter(status__in=['paid', 'preparing', 'ready', 'completed'])
        total_spent = sum(o.total_amount for o in paid_orders)
        writer.writerow([
            u.id,
            u.username,
            u.email,
            getattr(u, 'whatsapp_number', 'N/A') or getattr(u, 'phone_number', 'N/A'),
            u.role,
            u.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
            u_orders.count(),
            float(total_spent)
        ])

    return response

