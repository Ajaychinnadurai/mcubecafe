from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AccountsAPITests(APITestCase):

    def setUp(self):
        self.signup_url = reverse('signup')
        self.login_url = reverse('login')
        self.admin_login_url = reverse('admin-login')
        self.logout_url = reverse('logout')
        self.refresh_url = reverse('token-refresh')
        self.send_otp_url = reverse('send-otp')
        self.verify_otp_url = reverse('verify-otp')

        # Sample customer user
        self.user_password = 'TestPassword123!'
        self.customer_user = User.objects.create_user(
            username='testcustomer',
            email='customer@example.com',
            whatsapp_number='+919876543210',
            password=self.user_password,
            role=User.Role.CUSTOMER,
        )

        # Sample admin user
        self.admin_user = User.objects.create_user(
            username='testadmin',
            email='admin@example.com',
            whatsapp_number='+919998887770',
            password=self.user_password,
            role=User.Role.ADMIN,
        )

    # -------------------------------------------------------------------------
    # SIGNUP & VALIDATION TESTS
    # -------------------------------------------------------------------------
    def test_signup_success(self):
        """Test signup with valid email, strong password, and WhatsApp billing number."""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'whatsapp_number': '+919123456789',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
        }
        response = self.client.post(self.signup_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Signup follows an OTP-verification flow: no session is issued until
        # the emailed 6-digit code is verified via /auth/verify-otp/.
        self.assertTrue(response.data.get('requires_otp'))
        self.assertNotIn('access_token', response.data)
        self.assertEqual(response.data['user']['email'], 'newuser@example.com')

    def test_signup_duplicate_email_fails(self):
        """Test signup fails if email is already registered."""
        data = {
            'username': 'uniqueuser',
            'email': 'customer@example.com',  # Already exists
            'whatsapp_number': '+919123456789',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
        }
        response = self.client.post(self.signup_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_signup_weak_password_fails(self):
        """Test signup fails when password lacks uppercase, numbers, or special chars."""
        data = {
            'username': 'weakuser',
            'email': 'weak@example.com',
            'whatsapp_number': '+919123456789',
            'password': 'weakpassword',  # No uppercase, digit, or special char
            'password2': 'weakpassword',
        }
        response = self.client.post(self.signup_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_signup_missing_whatsapp_number_fails(self):
        """Test signup fails if WhatsApp billing number is missing."""
        data = {
            'username': 'nowhatsapp',
            'email': 'nowhatsapp@example.com',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
        }
        response = self.client.post(self.signup_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('whatsapp_number', response.data)

    # -------------------------------------------------------------------------
    # OTP GENERATION & VERIFICATION TESTS
    # -------------------------------------------------------------------------
    def test_send_and_verify_otp_flow(self):
        """Test sending OTP and verifying 6-digit code successfully."""
        # 1. Request OTP
        send_res = self.client.post(self.send_otp_url, {'email': 'customer@example.com'})
        self.assertEqual(send_res.status_code, status.HTTP_200_OK)

        # Retrieve generated OTP from DB
        self.customer_user.refresh_from_db()
        otp_code = self.customer_user.otp_code
        self.assertIsNotNone(otp_code)
        self.assertEqual(len(otp_code), 6)

        # 2. Verify OTP code
        verify_res = self.client.post(self.verify_otp_url, {
            'email': 'customer@example.com',
            'otp': otp_code,
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', verify_res.data)

        # Confirm user email marked verified
        self.customer_user.refresh_from_db()
        self.assertTrue(self.customer_user.is_email_verified)

    def test_verify_invalid_otp_fails(self):
        """Test verification fails with incorrect OTP code."""
        self.customer_user.generate_otp()
        response = self.client.post(self.verify_otp_url, {
            'email': 'customer@example.com',
            'otp': '000000',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('otp', response.data)

    # -------------------------------------------------------------------------
    # LOGIN & AUTHENTICATION TESTS
    # -------------------------------------------------------------------------
    def test_login_with_username_success(self):
        """Test logging in using username."""
        response = self.client.post(self.login_url, {
            'identifier': 'testcustomer',
            'password': self.user_password,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)

    def test_login_with_email_success(self):
        """Test logging in using email address."""
        response = self.client.post(self.login_url, {
            'identifier': 'customer@example.com',
            'password': self.user_password,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_invalid_password(self):
        """Test login fails with incorrect password."""
        response = self.client.post(self.login_url, {
            'identifier': 'testcustomer',
            'password': 'WrongPassword123!',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------------
    # GOOGLE LOGIN TESTS
    # -------------------------------------------------------------------------
    @override_settings(GOOGLE_CLIENT_ID='')
    def test_google_login_creates_user_with_avatar(self):
        """Dev-mode Google login auto-registers the user and stores the picture."""
        response = self.client.post(reverse('google-login'), {
            'email': 'gavatar@example.com',
            'username': 'G Avatar',
            'avatar': 'https://lh3.googleusercontent.com/a/test-avatar',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertEqual(response.data['user']['avatar'], 'https://lh3.googleusercontent.com/a/test-avatar')

        user = User.objects.get(email='gavatar@example.com')
        self.assertEqual(user.role, User.Role.CUSTOMER)
        self.assertTrue(user.is_email_verified)
        self.assertEqual(user.avatar, 'https://lh3.googleusercontent.com/a/test-avatar')

    @override_settings(GOOGLE_CLIENT_ID='')
    def test_google_login_updates_existing_user_avatar(self):
        """A returning Google user's avatar is refreshed on each sign-in."""
        self.customer_user.avatar = 'https://lh3.googleusercontent.com/a/old'
        self.customer_user.save(update_fields=['avatar'])

        response = self.client.post(reverse('google-login'), {
            'email': 'customer@example.com',
            'username': 'testcustomer',
            'avatar': 'https://lh3.googleusercontent.com/a/new',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer_user.refresh_from_db()
        self.assertEqual(self.customer_user.avatar, 'https://lh3.googleusercontent.com/a/new')
