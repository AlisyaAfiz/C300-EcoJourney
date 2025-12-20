import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecojourney.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import UserRole

User = get_user_model()

print("=" * 70)
print("CREATING TEST ACCOUNTS FOR ALL ROLES")
print("=" * 70)

# Ensure roles exist
roles_data = [
    ('admin', 'Administrator - Full system access'),
    ('content_manager', 'Content Manager - Approval and content review'),
    ('content_producer', 'Content Producer - Create and manage content'),
]

roles = {}
for role_name, description in roles_data:
    role, created = UserRole.objects.get_or_create(
        name=role_name,
        defaults={'description': description}
    )
    roles[role_name] = role
    print(f"✓ Role '{role_name}' ready")

print("\n" + "=" * 70)

# Create test accounts
test_accounts = [
    ('admin', 'admin@ecojourney.com', 'Password123!', 'admin'),
    ('manager', 'manager@ecojourney.com', 'Password123!', 'content_manager'),
    ('producer', 'producer@ecojourney.com', 'Password123!', 'content_producer'),
]

for username, email, password, role_name in test_accounts:
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.email = email
        user.role = roles[role_name]
        user.set_password(password)
        user.save()
        print(f"✓ Updated account: {username} ({role_name})")
    else:
        if role_name == 'admin':
            user = User.objects.create_superuser(username, email, password)
        else:
            user = User.objects.create_user(username, email, password)
        user.role = roles[role_name]
        user.save()
        print(f"✓ Created account: {username} ({role_name})")

print("\n" + "=" * 70)
print("TEST ACCOUNTS CREATED")
print("=" * 70)

for username, email, password, role_name in test_accounts:
    print(f"\nRole: {role_name.upper()}")
    print(f"  Username: {username}")
    print(f"  Password: {password}")
    print(f"  Email: {email}")

print("\n" + "=" * 70)
print("LOGIN URL: http://127.0.0.1:8000/login/")
print("=" * 70)
