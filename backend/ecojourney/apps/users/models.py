import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import secrets
import string


class UserRole(models.Model):
    """User role definitions for role-based access control"""
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('content_manager', 'Content Manager'),
        ('content_producer', 'Content Producer'),
    ]
    
    name = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)
    description = models.TextField()
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'user_roles'
        ordering = ['name']


class User(AbstractUser):
    """Extended User model with role-based access control"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    role = models.ForeignKey(UserRole, on_delete=models.SET_NULL, null=True, related_name='users')
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    bio = models.TextField(blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    login_attempts = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    groups = models.ManyToManyField('auth.Group', related_name='ecojourney_users')
    user_permissions = models.ManyToManyField('auth.Permission', related_name='ecojourney_users')
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def get_role_display(self):
        """Get human-readable role name"""
        if self.role:
            return self.role.get_name_display()
        return 'No Role'
    
    def lock_account(self):
        """Lock account for security"""
        self.is_locked = True
        self.locked_until = timezone.now() + timezone.timedelta(minutes=15)
        self.save()
    
    def unlock_account(self):
        """Unlock account"""
        self.is_locked = False
        self.locked_until = None
        self.login_attempts = 0
        self.save()


class PasswordResetToken(models.Model):
    """One-time password reset tokens"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='password_reset_token')
    token = models.CharField(max_length=256, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'password_reset_tokens'
    
    def __str__(self):
        return f"Reset token for {self.user.username}"
    
    @staticmethod
    def generate_token():
        """Generate a secure random token"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(64))
    
    def is_valid(self):
        """Check if token is still valid"""
        return (
            not self.is_used and
            timezone.now() < self.expires_at
        )
    
    @classmethod
    def create_for_user(cls, user):
        """Create a new password reset token for a user"""
        # Delete existing token if any
        cls.objects.filter(user=user).delete()
        
        # Create new token
        token = cls.generate_token()
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
