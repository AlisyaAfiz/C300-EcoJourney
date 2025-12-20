#!/usr/bin/env python
"""
Script to create test users for each role
Run with: python manage.py shell < create_test_users.py
Or: python -c "exec(open('create_test_users.py').read())"
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecojourney.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import UserRole

User = get_user_model()

# Get or create roles
admin_role, created = UserRole.objects.get_or_create(name='Admin')
if created:
    print("✓ Created Admin role")

manager_role, created = UserRole.objects.get_or_create(name='Content Manager')
if created:
    print("✓ Created Content Manager role")

producer_role, created = UserRole.objects.get_or_create(name='Content Producer')
if created:
    print("✓ Created Content Producer role")

# Create admin user
if not User.objects.filter(username='admin').exists():
    admin_user = User.objects.create_superuser(
        username='admin',
        email='admin@ecojourney.com',
        password='Password123!',
        role=admin_role
    )
    print("✓ Created admin user: admin / Password123!")
else:
    admin_user = User.objects.get(username='admin')
    admin_user.role = admin_role
    admin_user.save()
    print("✓ Admin user already exists")

# Create content manager user
if not User.objects.filter(username='manager').exists():
    manager_user = User.objects.create_user(
        username='manager',
        email='manager@ecojourney.com',
        password='Password123!',
        role=manager_role
    )
    manager_user.is_staff = True
    manager_user.save()
    print("✓ Created manager user: manager / Password123!")
else:
    print("✓ Manager user already exists")

# Create content producer user
if not User.objects.filter(username='producer').exists():
    producer_user = User.objects.create_user(
        username='producer',
        email='producer@ecojourney.com',
        password='Password123!',
        role=producer_role
    )
    print("✓ Created producer user: producer / Password123!")
else:
    print("✓ Producer user already exists")

print("\n" + "="*50)
print("✅ All test accounts created successfully!")
print("="*50)
print("\nAvailable test accounts:")
print("  ┌─ Admin")
print("  │  Username: admin")
print("  │  Password: Password123!")
print("  │  Role: Administrator")
print("  │")
print("  ├─ Content Manager")
print("  │  Username: manager")
print("  │  Password: Password123!")
print("  │  Role: Content Manager (can approve/reject content)")
print("  │")
print("  └─ Content Producer")
print("     Username: producer")
print("     Password: Password123!")
print("     Role: Content Producer (can upload content)")
print("\n" + "="*50)
