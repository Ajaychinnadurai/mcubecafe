import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


def validate_strong_password(value):
    if len(value) < 8:
        raise serializers.ValidationError('Password must be at least 8 characters long.')
    if not re.search(r'[A-Z]', value):
        raise serializers.ValidationError('Password must contain at least one uppercase letter (A-Z).')
    if not re.search(r'[a-z]', value):
        raise serializers.ValidationError('Password must contain at least one lowercase letter (a-z).')
    if not re.search(r'\d', value):
        raise serializers.ValidationError('Password must contain at least one digit (0-9).')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_=+\\[\]~`]', value):
        raise serializers.ValidationError('Password must contain at least one special character (!@#$%^&* etc.).')
    return value


class SignupSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True, validators=[])
    email = serializers.EmailField(required=True)
    whatsapp_number = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, validators=[validate_strong_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'whatsapp_number', 'password', 'password2']
        extra_kwargs = {
            'username': {'validators': []}
        }

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('This email address is already registered. Please sign in instead.')
        return value

    def validate_whatsapp_number(self, value):
        num = value.strip()
        if not num:
            raise serializers.ValidationError('WhatsApp number is required for billing.')
        if not (num.startswith('+') or num.startswith('91') or num.startswith('0') or len(num) >= 10):
            raise serializers.ValidationError('Please enter a valid WhatsApp phone number for billing.')
        return num

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        validated_data['role'] = User.Role.CUSTOMER
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = (attrs.get('identifier') or attrs.get('email') or '').strip()
        password = attrs.get('password')

        if not identifier:
            raise serializers.ValidationError('Username or email is required.')

        user = None
        # USERNAME_FIELD is 'email', so authenticate() must be called with the
        # user's email (not username) for the ModelBackend lookup to succeed.
        # Try email lookup first since email is strictly unique per user
        try:
            user_obj = User.objects.get(email__iexact=identifier)
            auth_user = authenticate(email=user_obj.email, password=password)
            if auth_user:
                user = auth_user
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            pass

        if not user:
            # Fallback to username lookup
            try:
                users = User.objects.filter(username__iexact=identifier)
                for u in users:
                    auth_user = authenticate(email=u.email, password=password)
                    if auth_user:
                        user = auth_user
                        break
            except Exception:
                pass

        if not user:
            raise serializers.ValidationError('Invalid username or password.')

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'whatsapp_number', 'avatar', 'role', 'is_email_verified']
        # avatar is read-only: only Google login (server-side) sets it
        read_only_fields = ['id', 'role', 'is_email_verified', 'avatar']


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        value = value.strip().lower()
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('No account found with this email address.')
        return value


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(min_length=6, max_length=6, required=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        otp = attrs.get('otp', '').strip()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'User not found.'})

        if not user.verify_otp(otp):
            raise serializers.ValidationError({'otp': 'Invalid or expired OTP code. Please request a new code.'})

        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('No account found with this email address.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_strong_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = None
        try:
            user_obj = User.objects.get(email__iexact=email)
            # USERNAME_FIELD is 'email', so pass the email to authenticate()
            user = authenticate(email=user_obj.email, password=password)
        except User.DoesNotExist:
            pass

        if not user or not user.is_admin_user:
            raise serializers.ValidationError('Invalid admin credentials.')

        attrs['user'] = user
        return attrs
