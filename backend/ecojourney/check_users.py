import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecojourney.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("=" * 60)
print("EXISTING USERS IN DATABASE")
print("=" * 60)

users = User.objects.all()
if users.exists():
    for u in users:
        role = u.role.name if u.role else "No Role"
        print(f"Username: {u.username}")
        print(f"Email: {u.email}")
        print(f"Role: {role}")
        print(f"Is Staff: {u.is_staff}")
        print(f"Is Superuser: {u.is_superuser}")
        print("-" * 60)
else:
    print("No users found in database")

print("\nAVAILABLE ROLES:")
from apps.users.models import UserRole
for role in UserRole.objects.all():
    print(f"  - {role.name}: {role.description}")
