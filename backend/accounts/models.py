import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'customer', _('Customer')
        ADMIN = 'admin', _('Admin')

    username = models.CharField(
        _('username'),
        max_length=150,
        unique=False,
        help_text=_('Required. 150 characters or fewer.'),
    )
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    whatsapp_number = models.CharField(max_length=15, blank=False, null=True, default='')
    avatar = models.URLField(max_length=500, blank=True, null=True)
    email = models.EmailField(_('email address'), unique=True, blank=False, null=True)

    # OTP verification fields
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)

    # Password reset fields
    password_reset_token = models.CharField(max_length=255, blank=True, null=True)
    password_reset_created = models.DateTimeField(blank=True, null=True)

    def generate_otp(self):
        """Generate a 6-digit random OTP and record timestamp."""
        import random
        from django.utils import timezone
        otp = f"{random.randint(100000, 999999)}"
        self.otp_code = otp
        self.otp_created_at = timezone.now()
        self.save(update_fields=['otp_code', 'otp_created_at'])
        return otp

    def verify_otp(self, code, expiry_minutes=5):
        """Verify the 6-digit OTP code within expiry window."""
        from django.utils import timezone
        if not self.otp_code or self.otp_code != str(code).strip():
            return False
        if not self.otp_created_at:
            return False
        elapsed = timezone.now() - self.otp_created_at
        if elapsed.total_seconds() > expiry_minutes * 60:
            return False
        # Valid OTP: mark email verified and clear OTP
        self.is_email_verified = True
        self.otp_code = None
        self.save(update_fields=['is_email_verified', 'otp_code'])
        return True

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username or self.email or self.phone_number or f"User {self.id}"

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_staff

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    def generate_password_reset_token(self):
        """Generate a unique token for password reset and save it with timestamp."""
        from django.utils import timezone
        self.password_reset_token = str(uuid.uuid4())
        self.password_reset_created = timezone.now()
        self.save(update_fields=['password_reset_token', 'password_reset_created'])
        return self.password_reset_token

    def verify_password_reset_token(self, token, expiry_hours=1):
        """Verify the token is valid and not expired."""
        from django.utils import timezone
        if not self.password_reset_token or self.password_reset_token != token:
            return False
        if not self.password_reset_created:
            return False
        elapsed = timezone.now() - self.password_reset_created
        if elapsed.total_seconds() > expiry_hours * 3600:
            return False
        return True
