from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import URLValidator
import uuid

class UserRole(models.Model):
    """Define user roles in the system"""
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('content_producer', 'Content Producer'),
        ('content_manager', 'Content Manager'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True, null=True)
    permissions = models.JSONField(default=dict, help_text="Role-specific permissions")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.get_name_display()


class User(AbstractUser):
    """Extended User model with role management"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(UserRole, on_delete=models.PROTECT, null=True, blank=True)
    organization = models.CharField(max_length=255, blank=True, null=True)
    is_active_user = models.BooleanField(default=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    # Account metadata
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    login_attempts = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    locked_until = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No Role'})"

    def get_role_name(self):
        return self.role.get_name_display() if self.role else 'No Role'


class PasswordResetToken(models.Model):
    """Manage password reset tokens for 'Forgot Password' functionality"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='password_reset_token')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Password Reset Token for {self.user.username}"

    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and self.expires_at > timezone.now()
