# EcoJourney CMS - PythonAnywhere Quick Start

## What You're Deploying

A Django-based Content Management System with:
- ✅ Role-based access (Admin, Content Manager, Content Producer)
- ✅ Content approval workflow
- ✅ File upload support
- ✅ Email notifications
- ✅ REST API
- ✅ User management

---

## 5-Minute Quick Start

### 1. Create Free Account
- Go to **https://www.pythonanywhere.com/**
- Sign up and verify email
- Choose **yourusername** (you'll use this for your URL)

### 2. Open PythonAnywhere Bash Console
In dashboard → **Consoles** → **Bash**:

```bash
cd ~
git clone https://github.com/AlisyaAfiz/C300-EcoJourney.git
cd C300-EcoJourney/backend/ecojourney
mkvirtualenv --python=/usr/bin/python3.10 ecojourney
pip install -r requirements.txt
python manage.py migrate
python manage.py create_test_accounts.py
python manage.py collectstatic --noinput
```

### 3. Configure Web App
In dashboard → **Web** tab:

1. Click **Add a new web app**
2. Choose **Manual configuration** → **Python 3.10**
3. Edit **WSGI configuration file**:

```python
import os, sys
project_home = '/home/yourusername/C300-EcoJourney/backend/ecojourney'
if project_home not in sys.path:
    sys.path.insert(0, project_home)
os.environ['DJANGO_SETTINGS_MODULE'] = 'ecojourney.settings'
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

4. Add **Static files** mapping:
   - URL: `/static/`
   - Directory: `/home/yourusername/C300-EcoJourney/frontend/static`

5. Add **Media files** mapping:
   - URL: `/media/`
   - Directory: `/home/yourusername/C300-EcoJourney/backend/ecojourney/media`

6. Click **Reload**

### 4. Access Your CMS
- **Dashboard**: `https://yourusername.pythonanywhere.com/`
- **Login**: `https://yourusername.pythonanywhere.com/login/`
- **Admin**: `https://yourusername.pythonanywhere.com/admin/`

**Test Credentials:**
```
Username: admin     |  manager           |  producer
Password: Password123!  (same for all)
Role:     Admin     |  Content Manager   |  Content Producer
```

---

## Team Access

All team members:
1. Go to `https://yourusername.pythonanywhere.com/`
2. Log in with their account
3. Use the CMS
4. **No local Django server needed!**

---

## Update When Code Changes

After pushing to GitHub:

```bash
# In PythonAnywhere Bash console
cd ~/C300-EcoJourney
git pull origin main
cd backend/ecojourney
python manage.py migrate  # if models changed
python manage.py collectstatic --noinput
# Then reload web app in dashboard
```

---

## File Structure on PythonAnywhere

```
/home/yourusername/
├── C300-EcoJourney/
│   ├── backend/ecojourney/
│   │   ├── manage.py
│   │   ├── db.sqlite3 (database)
│   │   ├── media/ (uploaded files)
│   │   ├── ecojourney/
│   │   │   ├── settings.py
│   │   │   ├── wsgi.py
│   │   │   └── urls.py
│   │   ├── apps/
│   │   │   ├── users/
│   │   │   └── content/
│   │   └── requirements.txt
│   └── frontend/
│       ├── static/ (CSS, JS, images)
│       └── templates/ (HTML files)
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| 404 errors | Check static files configuration |
| 500 errors | Check error log in Web tab |
| Database locked | Restart web app or delete db.sqlite3 and migrate again |
| Users not showing | Run `python manage.py create_test_accounts.py` |
| Uploads not working | Create `/home/yourusername/C300-EcoJourney/backend/ecojourney/media/` directory |

---

## Need More Details?

See **PYTHONANYWHERE_DEPLOYMENT.md** in the root directory for step-by-step instructions.

For help: https://www.pythonanywhere.com/help/
