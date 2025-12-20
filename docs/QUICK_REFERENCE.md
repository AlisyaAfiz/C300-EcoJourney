# EcoJourney CMS - Quick Reference Guide

## 🚀 Quick Start (5 Minutes)

### 1. Clone & Setup
```bash
cd C300\ EcoJourney
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django djangorestframework pillow python-decouple
```

### 2. Create `.env` File
```
DEBUG=True
SECRET_KEY=django-insecure-your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@ecojourney.com
SITE_URL=http://localhost:8000
SUPPORT_EMAIL=support@ecojourney.com
```

### 3. Migrate & Run
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py shell
# In shell:
# from apps.users.models import UserRole
# UserRole.objects.create(name='admin', description='Administrator')
# UserRole.objects.create(name='content_producer', description='Content Producer')
# UserRole.objects.create(name='content_manager', description='Content Manager')
exit()
python manage.py runserver
```

### 4. Access
- **Dashboard:** http://localhost:8000/dashboard
- **Admin:** http://localhost:8000/admin

---

## 📁 Key Files Reference

### Backend Models
| File | Models | Purpose |
|------|--------|---------|
| `apps/users/models.py` | User, UserRole, PasswordResetToken | User management |
| `apps/content/models.py` | ContentCategory, MultimediaContent, ContentApprovalWorkflow, ContentVersion | Content management |

### Backend Views/API
| File | Endpoints | Purpose |
|------|-----------|---------|
| `apps/users/views.py` | `/api/auth/` | Authentication |
| `apps/content/views.py` | `/api/content/` | Content management |

### Frontend Pages
| File | Route | Purpose |
|------|-------|---------|
| `dashboard.html` | `/dashboard` | Main dashboard |
| `login.html` | `/login` | User login |
| `forgot-password.html` | `/forgot-password` | Password reset |

### Frontend JavaScript
| File | Functions | Purpose |
|------|-----------|---------|
| `dashboard.js` | All dashboard functionality | Dashboard operations |
| `auth.js` | Login, logout, token management | Authentication |
| `forgot-password.js` | Password reset flow | Password recovery |

---

## 🔑 User Roles Overview

### Admin
```
- Full system access
- Manage users
- Manage categories
- Moderate all content
- System configuration
- View analytics
Menu Access: Dashboard + Admin Panel
```

### Content Manager
```
- Review pending content
- Approve/reject submissions
- Request changes
- View all content
- Publish approved content
Menu Access: Dashboard + Approvals
```

### Content Producer
```
- Upload content
- Edit own content
- Submit for approval
- Track approval status
- Manage profile
Menu Access: Dashboard + My Content
```

---

## 🔄 Content Workflow

```
CREATE (Draft)
    ↓
SUBMIT (Pending)
    ↓
REVIEW by Manager
    ├→ APPROVE → PUBLISH (Live)
    ├→ REJECT → Return to DRAFT
    └→ REQUEST CHANGES → Return to DRAFT
    
Repeat cycle until Published
```

---

## 📧 Email Notifications

| Event | Recipient | Email Type |
|-------|-----------|-----------|
| User Registration | New User | Welcome Email |
| Password Reset Request | User | Reset Link Email |
| Content Submission | Content Managers | New Submission Alert |
| Content Approved | Content Producer | Approval Confirmation |
| Content Rejected | Content Producer | Rejection with Feedback |
| Changes Requested | Content Producer | Revision Request |
| Content Published | Content Producer | Publication Confirmation |
| Role Assignment | User | Role Update Notification |

---

## 🛠️ API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/login/                  - User login
POST   /api/auth/register/               - User registration
POST   /api/auth/logout/                 - User logout
GET    /api/auth/user/                   - Get current user
POST   /api/auth/password-reset-request/ - Request password reset
POST   /api/auth/password-reset-confirm/ - Confirm password reset
PUT    /api/auth/profile/update/         - Update profile
GET    /api/auth/users/                  - List all users (admin)
```

### Content
```
GET    /api/content/                     - List content
POST   /api/content/create/              - Upload content
GET    /api/content/{id}/                - Get content details
PUT    /api/content/{id}/                - Update content
DELETE /api/content/{id}/                - Delete content
GET    /api/content/my-content/          - Get user's content
GET    /api/content/pending-approvals/   - Get pending (managers)
POST   /api/content/submit-approval/     - Submit for approval
POST   /api/content/review-approval/     - Review submission
POST   /api/content/publish/             - Publish content
```

### Categories
```
GET    /api/content/categories/          - List categories
```

---

## 🎨 UI Components

### Dashboard Sections
- **Stats Cards** - Real-time statistics
- **Recent Content** - Last 5 uploads
- **Category Breakdown** - Content by category
- **Content List** - Searchable/filterable table
- **Approval Queue** - Pending approvals
- **Admin Panel** - System management
- **Profile** - User information

### Colors
| Color | Code | Use |
|-------|------|-----|
| Primary Green | #2ecc71 | Primary buttons, success |
| Secondary Blue | #3498db | Secondary actions |
| Danger Red | #e74c3c | Errors, deletions |
| Warning Orange | #f39c12 | Warnings, alerts |
| Dark Gray | #2c3e50 | Text, borders |
| Light Gray | #ecf0f1 | Backgrounds |

---

## 🔐 Security Checklist

- ✅ Strong password validation (8+ chars, mixed case, numbers, special)
- ✅ Token-based authentication
- ✅ CSRF protection
- ✅ Role-based access control
- ✅ File upload validation
- ✅ Input sanitization
- ✅ SQL injection protection (ORM)
- ✅ Session management
- ✅ Error handling
- ✅ Logging

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found" error
**Solution:** Ensure you're in the correct directory and virtual environment is activated

### Issue: Database errors
**Solution:** Run `python manage.py migrate` again

### Issue: Email not sending
**Solution:** Check `EMAIL_BACKEND` in `.env` - use console backend for development

### Issue: Static files not loading
**Solution:** Run `python manage.py collectstatic`

### Issue: CSRF token error on forms
**Solution:** Ensure CSRF token is included in headers for POST/PUT/DELETE

### Issue: Login redirects to login page
**Solution:** Check token is stored in localStorage and sent in Authorization header

---

## 📝 File Upload

**Supported Types:**
- Images: JPG, PNG, GIF, WebP
- Videos: MP4, MOV, AVI, MKV
- Audio: MP3, WAV, FLAC, OGG
- Documents: PDF, DOC, DOCX, XLSX
- Articles: TXT, MD, HTML

**Size Limits:**
- Images: 50MB
- Videos: 100MB
- Audio: 30MB
- Documents: 20MB

---

## 🔧 Database Models Quick View

### User Model
```
id (UUID)
username (str, unique)
email (str, unique)
first_name (str)
last_name (str)
role (ForeignKey → UserRole)
organization (str)
phone_number (str)
is_active_user (bool)
login_attempts (int)
is_locked (bool)
```

### Content Model
```
id (UUID)
title (str)
description (text)
content_type (choice)
category (ForeignKey → Category)
file (FileField)
status (choice: draft, pending, approved, rejected, published)
created_by (ForeignKey → User)
approved_by (ForeignKey → User)
submitted_at (datetime)
approved_at (datetime)
views_count (int)
likes_count (int)
tags (str)
```

### Approval Workflow Model
```
id (UUID)
content (OneToOne → MultimediaContent)
submitted_by (ForeignKey → User)
submitted_at (datetime)
reviewed_by (ForeignKey → User)
reviewed_at (datetime)
approval_status (choice)
feedback (text)
internal_notes (text)
```

---

## 🚀 Deployment Checklist

- [ ] Set `DEBUG=False` in settings
- [ ] Generate secure `SECRET_KEY`
- [ ] Configure PostgreSQL database
- [ ] Set `ALLOWED_HOSTS` properly
- [ ] Configure email service (SMTP)
- [ ] Set up static file serving (Nginx/Apache)
- [ ] Configure CORS if needed
- [ ] Run `collectstatic`
- [ ] Run migrations
- [ ] Create superuser
- [ ] Test all endpoints
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring
- [ ] Configure backups

---

## 📚 Documentation Files

| File | Content |
|------|---------|
| `PROJECT_OVERVIEW.md` | Complete project overview |
| `SETUP_GUIDE.md` | Installation & configuration |
| `FEATURES.md` | Detailed features & specs |
| `README.md` | Project readme (main) |
| `QUICK_REFERENCE.md` | This file! |

---

## 💡 Pro Tips

1. **Use Django Shell for Testing**
   ```bash
   python manage.py shell
   from apps.users.models import User
   User.objects.all()
   ```

2. **Check Email in Console**
   - With `EMAIL_BACKEND=console`, emails print to console

3. **Debug JavaScript**
   - Use browser DevTools Console
   - Check Network tab for API calls

4. **Test API with curl**
   ```bash
   curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/auth/user/
   ```

5. **Access Django Admin**
   - http://localhost:8000/admin
   - Create superuser first

---

## 🎯 Next Actions

1. ✅ Review documentation files
2. ✅ Run setup steps
3. ✅ Create test data
4. ✅ Test user flows
5. ✅ Test approval workflow
6. ✅ Verify emails
7. ✅ Test admin panel
8. ✅ Performance testing
9. ✅ Security audit
10. ✅ Deploy!

---

## 📞 Quick Help

**For Installation Issues:**
- See `SETUP_GUIDE.md`
- Check Python version (3.8+)
- Verify virtual environment activation

**For Feature Questions:**
- See `FEATURES.md`
- Check `PROJECT_OVERVIEW.md`
- Review inline code comments

**For API Questions:**
- Check endpoint documentation in views.py
- Review serializers.py for field names
- Test with browser DevTools

**For Deployment:**
- See production deployment notes
- Configure environment variables
- Use Gunicorn + Nginx

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Quick Reference:** Complete ✅
