from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import logout as django_logout
from django.conf import settings

from .serializers import (
    SignupSerializer, LoginSerializer, AdminLoginSerializer,
    UserSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, SendOTPSerializer, VerifyOTPSerializer,
)


def _send_email(subject, text_message, recipient_email, html_message=None, fail_silently=True):
    """Helper to send an email via SMTP with optional HTML content."""
    print(f"\n==========================================")
    print(f" [EMAIL DISPATCH] To: {recipient_email}")
    print(f" Subject: {subject}")
    print(f" Message:\n{text_message}")
    if html_message:
        print(f" [HTML content included]")
    print(f"==========================================\n")
    try:
        from django.core.mail import EmailMultiAlternatives
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email],
        )
        if html_message:
            email.attach_alternative(html_message, 'text/html')
        email.send(fail_silently=fail_silently)
    except Exception as e:
        if not fail_silently:
            raise


def _render_html_email(template_name, context):
    """Render an HTML email template from the 'emails/' directory."""
    from django.template.loader import render_to_string
    return render_to_string(f'emails/{template_name}', context)


def _send_otp_notification(user, otp):
    """Helper to print OTP to console and attempt email dispatch."""
    subject = "M Cube's Cafe - Your 6-Digit OTP Verification Code"
    text_message = (
        f"Hello {user.username},\n\n"
        f"Your OTP code for M Cube's Cafe account verification is: {otp}.\n\n"
        f"This code expires in 5 minutes.\n\n"
        f"Thank you!"
    )
    html_message = _render_html_email('otp_email.html', {
        'username': user.username,
        'otp': otp,
    })
    _send_email(subject, text_message, user.email, html_message, fail_silently=True)


def _set_jwt_cookies(response, user):
    """Helper to set JWT cookies on the response."""
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    refresh['username'] = user.username

    access_token = str(refresh.access_token)
    refresh_token_str = str(refresh)

    response.set_cookie(
        'access_token',
        access_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=7200,  # 2 hours
        path='/'
    )
    response.set_cookie(
        'refresh_token',
        refresh_token_str,
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=2592000,  # 30 days
        path='/'
    )
    # Also return tokens in the response body for the frontend to use
    response.data['access_token'] = access_token
    response.data['refresh_token'] = refresh_token_str
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        otp = user.generate_otp()
        _send_otp_notification(user, otp)

        return Response({
            'user': UserSerializer(user).data,
            'requires_otp': True,
            'message': 'Account created! A 6-digit OTP code has been sent to your email.',
            'otp': otp if settings.DEBUG else None,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """Generate and send a 6-digit OTP to user's registered email."""
    serializer = SendOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(email__iexact=email)
        otp = user.generate_otp()
        _send_otp_notification(user, otp)
        return Response({
            'message': f'A 6-digit OTP has been sent to {email}.',
            'email': email,
            'otp': otp if settings.DEBUG else None,
        })
    except User.DoesNotExist:
        return Response({'email': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify 6-digit OTP and complete authentication."""
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data['user']
    user.is_email_verified = True
    user.save()

    response = Response({
        'user': UserSerializer(user).data,
        'role': user.role,
        'message': 'OTP verified successfully! Account authenticated.',
    })
    return _set_jwt_cookies(response, user)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        response = Response({
            'user': UserSerializer(user).data,
            'role': user.role,
            'message': 'Login successful!',
        })
        return _set_jwt_cookies(response, user)
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """Authenticate or auto-register a real user via Google OAuth data.

    Production mode (GOOGLE_CLIENT_ID configured): verifies the Google ID
    token server-side with google-auth before trusting the profile data.
    Dev mode (no Client ID): accepts the payload directly for testing.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    token = request.data.get('token', '').strip()
    raw_email = request.data.get('email', '').strip().lower()
    raw_username = request.data.get('username', '').strip()

    google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')

    if google_client_id:
        # Production: verify the Google ID token server-side.
        if not token:
            return Response({'email': 'Google ID token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests
            info = id_token.verify_oauth2_token(token, requests.Request(), google_client_id)
        except Exception:
            return Response({'email': 'Invalid or expired Google credential.'}, status=status.HTTP_400_BAD_REQUEST)

        email = (info.get('email') or '').strip().lower()
        if not email:
            return Response({'email': 'Google account has no verified email address.'}, status=status.HTTP_400_BAD_REQUEST)
        if info.get('email_verified') is not True:
            return Response({'email': 'Google email address is not verified.'}, status=status.HTTP_400_BAD_REQUEST)
        username = (info.get('name') or '').strip() or email.split('@')[0]
        picture = (info.get('picture') or '').strip()
    else:
        # Dev mode fallback: trust the payload so the flow works without a Client ID.
        if not raw_email or '@' not in raw_email:
            return Response({'email': 'Valid real Google email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
        email = raw_email
        username = raw_username or email.split('@')[0]
        picture = (request.data.get('avatar') or '').strip()

    try:
        user = User.objects.get(email__iexact=email)
        # Ensure email verification flag + profile picture are up to date
        changed_fields = []
        if not user.is_email_verified:
            user.is_email_verified = True
            changed_fields.append('is_email_verified')
        if picture:
            user.avatar = picture
            changed_fields.append('avatar')
        if changed_fields:
            user.save(update_fields=changed_fields)
    except User.DoesNotExist:
        user = User.objects.create(
            email=email,
            username=username,
            role='customer',
            is_email_verified=True,
            avatar=picture or None,
        )
        user.set_unusable_password()
        user.save()

    response = Response({
        'user': UserSerializer(user).data,
        'role': user.role,
        'message': f'Google Sign-In successful for {user.email}!',
    })
    return _set_jwt_cookies(response, user)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    serializer = AdminLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        response = Response({
            'user': UserSerializer(user).data,
            'role': user.role,
            'message': 'Admin login successful!',
        })
        return _set_jwt_cookies(response, user)
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh_token') or request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception:
        pass

    django_logout(request)
    response = Response({'message': 'Logged out successfully.'})
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Request a password reset link.
    Generates a token and (TODO) sends an email with the reset link.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        user = User.objects.get(email=email)
        token = user.generate_password_reset_token()
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        text_message = (
            f"Hello {user.username},\n\n"
            f"We received a request to reset your password for your M Cube's Cafe account.\n\n"
            f"Click the link below to reset your password:\n"
            f"{reset_url}\n\n"
            f"This link expires in 1 hour.\n\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"Thank you,\nM Cube's Cafe Team"
        )
        html_message = _render_html_email('password_reset_email.html', {
            'username': user.username,
            'reset_url': reset_url,
        })
        _send_email(
            subject="M Cube's Cafe - Password Reset Link",
            text_message=text_message,
            recipient_email=email,
            html_message=html_message,
            fail_silently=True,
        )

        return Response({
            'message': 'If an account exists with this email, a password reset link has been sent.',
            # Include the reset URL in dev mode for testing
            'reset_url': reset_url if settings.DEBUG else None,
        })
    except User.DoesNotExist:
        # Always return the same message to prevent email enumeration
        return Response({
            'message': 'If an account exists with this email, a password reset link has been sent.',
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Confirm a password reset with a valid token and new password."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']

    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        user = User.objects.get(password_reset_token=token)
        if not user.verify_password_reset_token(token):
            return Response({
                'error': 'This reset link has expired or is invalid. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_created = None
        user.save()

        return Response({
            'message': 'Password has been reset successfully! You can now log in with your new password.'
        })
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid reset token. Please request a new password reset.'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """Refresh the access token using the refresh token cookie."""
    refresh_token = request.COOKIES.get('refresh_token')
    if not refresh_token:
        return Response({'error': 'No refresh token found.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        token = RefreshToken(refresh_token)
        user_id = token.get('user_id')
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        response = Response({
            'user': UserSerializer(user).data,
            'role': user.role,
            'message': 'Token refreshed.',
        })
        return _set_jwt_cookies(response, user)
    except Exception as e:
        return Response({'error': 'Invalid refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Allow an authenticated user to change their password."""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not old_password or not new_password:
        return Response({'error': 'Old password and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(old_password):
        return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({'message': 'Password changed successfully!'})

