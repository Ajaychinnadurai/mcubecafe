from django.urls import path
from . import views

urlpatterns = [
    # Customer endpoints
    path('orders/create/', views.create_order, name='create-order'),
    path('orders/my/', views.my_orders, name='my-orders'),
    path('orders/<int:order_id>/', views.order_detail, name='order-detail'),
    path('orders/<int:order_id>/bill/', views.order_bill, name='order-bill'),
    path('orders/<int:order_id>/bill/download/', views.order_bill_pdf, name='order-bill-pdf'),

    # Payment endpoints
    path('orders/pay/stripe/', views.stripe_payment, name='stripe-payment'),
    path('orders/pay/stripe/confirm/', views.stripe_payment_confirm, name='stripe-payment-confirm'),
    path('orders/pay/upi/', views.upi_payment, name='upi-payment'),
    path('orders/pay/upi/confirm/', views.upi_payment_confirm, name='upi-payment-confirm'),
    path('orders/pay/cash/', views.cash_payment, name='cash-payment'),

    # Admin endpoints
    path('admin/orders/', views.admin_orders, name='admin-orders'),
    path('admin/orders/stats/', views.admin_dashboard_stats, name='admin-dashboard-stats'),
    path('admin/orders/<int:order_id>/', views.admin_order_detail, name='admin-order-detail'),
    path('admin/orders/<int:order_id>/mark-cash-paid/', views.admin_mark_cash_paid, name='admin-mark-cash-paid'),

    # Admin Export / Download Endpoints
    path('admin/export/orders/', views.admin_export_orders_csv, name='admin-export-orders'),
    path('admin/export/menu/', views.admin_export_menu_csv, name='admin-export-menu'),
    path('admin/export/sales/', views.admin_export_sales_csv, name='admin-export-sales'),
    path('admin/export/customers/', views.admin_export_customers_csv, name='admin-export-customers'),
]
