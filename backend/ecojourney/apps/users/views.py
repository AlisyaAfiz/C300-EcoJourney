from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from datetime import timedelta
import uuid

from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    ChangePasswordSerializer, UserRoleSerializer
)
from .models import PasswordResetToken, UserRole

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def user(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """Register a new user"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create default role (content_producer)
            try:
                producer_role = UserRole.objects.get(name='content_producer')
                user.role = producer_role
                user.save()
            except UserRole.DoesNotExist:
                pass
            
            # Send welcome email
            from apps.content.email_service import EmailNotificationService
            EmailNotificationService.send_welcome_email(user)
            
            return Response(
                {'detail': 'User registered successfully. Check your email for confirmation.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        """Login user and return token"""
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Get or create token
            token, _ = Token.objects.get_or_create(user=user)
            
            # Update last login IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            
            user.last_login_ip = ip
            user.login_attempts = 0
            user.save()
            
            user_serializer = UserSerializer(user)
            return Response({
                'token': token.key,
                'user': user_serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        """Logout user by deleting token"""
        request.user.auth_token.delete()
        return Response({'detail': 'Logged out successfully'})

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def password_reset_request(self, request):
        """Request password reset"""
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Create reset token
            token = str(uuid.uuid4())
            expires_at = timezone.now() + timedelta(hours=24)
            
            PasswordResetToken.objects.filter(user=user).delete()
            reset_token = PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=expires_at
            )
            
            # Send email
            from apps.content.email_service import EmailNotificationService
            reset_url = f"{request.build_absolute_uri('/forgot-password')}?token={token}"
            EmailNotificationService.send_password_reset_email(user, token, reset_url)
            
            return Response({'detail': 'Password reset email sent'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def password_reset_confirm(self, request):
        """Confirm password reset with token"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            password = serializer.validated_data['password']
            
            try:
                reset_token = PasswordResetToken.objects.get(token=token)
                
                if not reset_token.is_valid():
                    return Response(
                        {'detail': 'Token has expired'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update password
                reset_token.user.set_password(password)
                reset_token.user.save()
                
                # Mark token as used
                reset_token.is_used = True
                reset_token.save()
                
                return Response({'detail': 'Password reset successfully'})
            except PasswordResetToken.DoesNotExist:
                return Response(
                    {'detail': 'Invalid token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['put'], permission_classes=[permissions.IsAuthenticated])
    def profile_update(self, request):
        """Update user profile"""
        user = request.user
        
        # Update basic info
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'organization' in request.data:
            user.organization = request.data['organization']
        if 'phone_number' in request.data:
            user.phone_number = request.data['phone_number']
        
        # Change password if requested
        if 'old_password' in request.data and 'new_password' in request.data:
            old_password = request.data['old_password']
            new_password = request.data['new_password']
            
            if not user.check_password(old_password):
                return Response(
                    {'detail': 'Current password is incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(new_password)
        
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'detail': 'Old password is incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({'detail': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def users(self, request):
        """List all users (admin only)"""
        if request.user.role.name != 'admin':
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        users = User.objects.all()
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
