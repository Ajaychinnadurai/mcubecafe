from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from menu.models import MenuCategory, MenuItem
from orders.models import Order, Payment

User = get_user_model()

class CreateOrderTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='Password123!',
            role='customer',
            whatsapp_number='1234567890'
        )
        self.admin = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='Password123!',
            role='admin'
        )
        self.category = MenuCategory.objects.create(name='Drinks', slug='drinks', order=1)
        self.item1 = MenuItem.objects.create(
            category=self.category,
            name='Coffee',
            price=50.00,
            is_available=True
        )

    def test_create_order_cash(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'items': [{'menu_item_id': self.item1.id, 'quantity': 2}],
            'order_type': 'dine_in',
            'payment_method': 'cash',
            'whatsapp_number': '9876543210',
            'notes': 'No sugar'
        }
        response = self.client.post('/api/orders/create/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_order_string_quantity(self):
        """Test sending quantity as a string '2' which can cause Decimal * str TypeError."""
        self.client.force_authenticate(user=self.user)
        payload = {
            'items': [{'menu_item_id': self.item1.id, 'quantity': '2'}],
            'order_type': 'dine_in',
            'payment_method': 'cash',
        }
        response = self.client.post('/api/orders/create/', payload, format='json')
        print("STRING QUANTITY STATUS:", response.status_code, response.data if hasattr(response, 'data') else response.content)

    def test_create_order_long_whatsapp(self):
        """Test sending a long whatsapp number exceeding 15 chars."""
        self.client.force_authenticate(user=self.user)
        payload = {
            'items': [{'menu_item_id': self.item1.id, 'quantity': 1}],
            'order_type': 'dine_in',
            'payment_method': 'cash',
            'whatsapp_number': '+91 (98765) 432100000'
        }
        response = self.client.post('/api/orders/create/', payload, format='json')
        print("LONG WHATSAPP STATUS:", response.status_code, response.data if hasattr(response, 'data') else response.content)

    def test_create_order_invalid_item_id(self):
        """Test sending invalid menu_item_id string 'abc'."""
        self.client.force_authenticate(user=self.user)
        payload = {
            'items': [{'menu_item_id': 'abc', 'quantity': 1}],
            'order_type': 'dine_in',
            'payment_method': 'cash',
        }
        response = self.client.post('/api/orders/create/', payload, format='json')
        print("INVALID ITEM ID STATUS:", response.status_code, response.data if hasattr(response, 'data') else response.content)


