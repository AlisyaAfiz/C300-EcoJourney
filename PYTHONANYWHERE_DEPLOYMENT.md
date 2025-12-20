# PythonAnywhere Deployment Guide for EcoJourney CMS

## Step 1: Create PythonAnywhere Account
1. Go to https://www.pythonanywhere.com/
2. Sign up for a free account (or paid for more resources)
3. Verify your email

## Step 2: Set Up Web App on PythonAnywhere

1. **Log in** to PythonAnywhere dashboard
2. Go to **Web** tab → **Add a new web app**
3. Choose **Python 3.10** (or latest available)
4. Choose **Django** framework
5. Select project path when prompted

## Step 3: Upload Code from GitHub

In PythonAnywhere console:

```bash
cd ~
git clone https://github.com/AlisyaAfiz/C300-EcoJourney.git
cd C300-EcoJourney/backend/ecojourney
```

## Step 4: Create Virtual Environment

```bash
mkvirtualenv --python=/usr/bin/python3.10 ecojourney
pip install -r requirements.txt
```

## Step 5: Configure Django Settings

### Edit WSGI Configuration

1. In PythonAnywhere dashboard → **Web** tab
2. Click on your web app
3. Edit **WSGI configuration file** and replace with:

```python
import os
import sys

# Add your project directory to sys.path
project_home = '/home/yourusername/C300-EcoJourney/backend/ecojourney'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ['DJANGO_SETTINGS_MODULE'] = 'ecojourney.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

Replace `yourusername` with your actual PythonAnywhere username.

### Set Environment Variables

In PythonAnywhere dashboard → **Web** → **Environment variables**:

```
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourusername.pythonanywhere.com
DATABASE_URL=sqlite:////home/yourusername/C300-EcoJourney/backend/ecojourney/db.sqlite3
```

## Step 6: Database Setup

In PythonAnywhere console:

```bash
cd /home/yourusername/C300-EcoJourney/backend/ecojourney
python manage.py migrate
python manage.py create_test_accounts.py
python manage.py collectstatic --noinput
```

## Step 7: Configure Static Files

In PythonAnywhere dashboard → **Web** tab:

Add this static file mapping:
- **URL**: `/static/`
- **Directory**: `/home/yourusername/C300-EcoJourney/frontend/static`

And for media files:
- **URL**: `/media/`
- **Directory**: `/home/yourusername/C300-EcoJourney/backend/ecojourney/media`

## Step 8: Reload Web App

In PythonAnywhere dashboard → **Web** tab:
- Click **Reload** button

Your app is now live at: `https://yourusername.pythonanywhere.com/`

## Step 9: Access Your CMS

- **Login page**: https://yourusername.pythonanywhere.com/login/
- **Admin panel**: https://yourusername.pythonanywhere.com/admin/

Use test credentials:
- Admin: `admin` / `Password123!`
- Manager: `manager` / `Password123!`
- Producer: `producer` / `Password123!`

## Step 10: Set Up Automatic Updates from GitHub

In PythonAnywhere console:

```bash
cd /home/yourusername/C300-EcoJourney
git pull origin main
cd backend/ecojourney
python manage.py migrate
python manage.py collectstatic --noinput
```

Then reload the web app.

## Troubleshooting

**Problem**: 500 error
- Check error log: **Web** tab → **Error log**

**Problem**: Static files not showing
- Run: `python manage.py collectstatic --noinput`
- Check static files configuration in dashboard

**Problem**: Database not found
- Run migrations: `python manage.py migrate`

**Problem**: Users not loading
- Check: `python manage.py create_test_accounts.py`

## For Team Collaboration

1. All team members pull the same code: `git pull origin main`
2. Everyone accesses the shared instance at: `https://yourusername.pythonanywhere.com/`
3. Each person logs in with their account
4. Changes are made through the CMS interface (no need for local servers)

## Update Production When Code Changes

After pushing changes to GitHub:

```bash
# In PythonAnywhere console
cd /home/yourusername/C300-EcoJourney
git pull origin main
cd backend/ecojourney
python manage.py migrate  # if models changed
# Reload in dashboard
```

---

Need help? Check PythonAnywhere docs: https://www.pythonanywhere.com/help/
