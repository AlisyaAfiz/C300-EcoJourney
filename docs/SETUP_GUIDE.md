# EcoJourney CMS - Content Management System

A comprehensive Django-based Content Management System designed for managing multimedia content with role-based access control, approval workflows, and automated email notifications.

## 🎯 Objectives

- ✅ Develop a basic CMS for multimedia content upload and interaction
- ✅ Support role-based account management (Admin, Content Producers, Content Managers)
- ✅ Provide category-wise content classification (Environmental, Social, Governance, Economic)
- ✅ Ensure automated email notifications for approvals and updates

## 🎨 Features

### User Authentication & Authorization
- User registration and login with email verification
- Forgot password functionality with secure token-based reset
- Session management with token-based authentication
- Account security features (password strength validation, login attempts tracking)

### Role Management
- **Admin**: Full system control, user management, content moderation, system settings
- **Content Producer**: Upload and manage their own content, submit for approval
- **Content Manager**: Review and approve/reject content submissions with feedback

### Content Management
- Upload multimedia content (images, videos, audio, documents, articles)
- Organize content by categories (Environmental, Social, Governance, Economic)
- Tag-based organization for better searchability
- Content versioning with change history tracking
- Approval workflow with feedback system

### Email Notifications
- Welcome emails for new users
- Password reset notifications
- Content submission alerts to managers
- Approval/rejection notifications
- Changes requested notifications
- Content published notifications
- User role assignment notifications

### Admin Dashboard
- System-wide analytics and statistics
- User management and role assignment
- Content category management
- All content moderation
- System configuration settings

### User Dashboard
- Personal content management
- Content submission tracking
- Approval status monitoring
- Profile management
- Password change functionality

## 📋 Project Structure

```
C300 EcoJourney/
├── backend/
│   └── ecojourney/
│       ├── apps/
│       │   ├── users/
│       │   │   ├── models.py           # User, Role, PasswordReset models
│       │   │   ├── views.py            # Authentication endpoints
│       │   │   ├── serializers.py      # User serializers
│       │   │   └── urls.py             # User routes
│       │   └── content/
│       │       ├── models.py           # Content, Category, Approval models
│       │       ├── views.py            # Content endpoints
│       │       ├── serializers.py      # Content serializers
│       │       ├── email_service.py    # Email notifications
│       │       └── urls.py             # Content routes
│       ├── settings.py                 # Django settings
│       ├── urls.py                     # Main URL router
│       └── wsgi.py
├── frontend/
│   ├── templates/
│   │   ├── dashboard.html              # Main dashboard
│   │   ├── login.html                  # Login page
│   │   └── forgot-password.html        # Password reset page
│   └── static/
│       ├── css/
│       │   ├── dashboard.css           # Dashboard styles
│       │   └── auth.css                # Authentication styles
│       └── js/
│           ├── dashboard.js            # Dashboard functionality
│           ├── auth.js                 # Login functionality
│           └── forgot-password.js      # Password reset functionality
└── docs/
    └── README.md                       # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- pip
- Virtual environment (recommended)
- PostgreSQL or SQLite (for development)

### Backend Setup

1. **Create Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies**
```bash
pip install django djangorestframework django-cors-headers pillow python-decouple
```

3. **Configure Environment**
Create `.env` file in backend root:
```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@ecojourney.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Site URL
SITE_URL=http://localhost:8000
SUPPORT_EMAIL=support@ecojourney.com
```

4. **Run Migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Create Superuser**
```bash
python manage.py createsuperuser
```

6. **Create Initial Roles**
```bash
python manage.py shell
>>> from apps.users.models import UserRole
>>> UserRole.objects.create(name='admin', description='Administrator')
>>> UserRole.objects.create(name='content_producer', description='Content Producer')
>>> UserRole.objects.create(name='content_manager', description='Content Manager')
```

7. **Create Initial Categories**
```bash
python manage.py shell
>>> from apps.content.models import ContentCategory
>>> ContentCategory.objects.create(name='environmental', description='Environmental Content')
>>> ContentCategory.objects.create(name='social', description='Social Content')
>>> ContentCategory.objects.create(name='governance', description='Governance Content')
>>> ContentCategory.objects.create(name='economic', description='Economic Content')
```

8. **Start Development Server**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Navigate to Frontend Directory**
```bash
cd frontend
```

2. **No build process required!** The frontend uses CDN-based Bootstrap and pure vanilla JavaScript.

3. **Access the Application**
- Dashboard: http://localhost:8000/dashboard
- Login: http://localhost:8000/login
- Forgot Password: http://localhost:8000/forgot-password

## 📱 API Endpoints

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/user/` - Get current user
- `POST /api/auth/password-reset-request/` - Request password reset
- `POST /api/auth/password-reset-confirm/` - Confirm password reset
- `PUT /api/auth/profile/update/` - Update profile
- `POST /api/auth/change-password/` - Change password
- `GET /api/auth/users/` - List all users (admin only)

### Content Endpoints
- `GET /api/content/` - List content (filtered by role)
- `POST /api/content/create/` - Upload new content
- `GET /api/content/{id}/` - Get content details
- `PUT /api/content/{id}/` - Update content
- `DELETE /api/content/{id}/` - Delete content
- `GET /api/content/my-content/` - Get user's content
- `GET /api/content/pending-approvals/` - Get pending approvals (manager)
- `GET /api/content/all/` - Get all content (admin)
- `POST /api/content/submit-approval/` - Submit for approval
- `POST /api/content/review-approval/` - Review submission
- `POST /api/content/publish/` - Publish content

### Category Endpoints
- `GET /api/content/categories/` - List categories
- `POST /api/content/categories/` - Create category (admin)
- `PUT /api/content/categories/{id}/` - Update category (admin)
- `DELETE /api/content/categories/{id}/` - Delete category (admin)

## 🔐 Security Features

- **Password Security**: Strong password requirements (uppercase, lowercase, numbers, special characters)
- **Token Authentication**: JWT-like token-based authentication
- **Password Reset**: Secure token-based password reset with expiration
- **Access Control**: Role-based permissions on all endpoints
- **CSRF Protection**: CSRF token validation for forms
- **Account Locking**: Tracks login attempts and can lock accounts
- **File Upload Security**: Validates and restricts file types

## 🎨 UI/UX Design

### Dashboard Features
- Clean, modern interface with green eco-friendly color scheme
- Responsive design for desktop and mobile devices
- Sidebar navigation with role-based menu items
- Real-time statistics cards
- Content management tables with sorting and filtering
- Modal dialogs for content upload and approval review
- User profile management section

### Color Scheme
- Primary: #2ecc71 (Green - Eco-friendly)
- Secondary: #3498db (Blue)
- Danger: #e74c3c (Red)
- Warning: #f39c12 (Orange)
- Dark: #2c3e50 (Dark Blue)
- Light: #ecf0f1 (Light Gray)

## 📊 Database Schema

### User Models
- `User` - Extended Django User with roles, profile info
- `UserRole` - Role definitions with permissions
- `PasswordResetToken` - Secure password reset tokens

### Content Models
- `ContentCategory` - Content categories (ESG)
- `MultimediaContent` - Main content model with all metadata
- `ContentApprovalWorkflow` - Approval workflow tracking
- `ContentVersion` - Version history of content

## 🚀 Deployment

### Using Gunicorn

1. Install Gunicorn
```bash
pip install gunicorn
```

2. Run with Gunicorn
```bash
gunicorn ecojourney.wsgi:application --bind 0.0.0.0:8000
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "ecojourney.wsgi:application", "--bind", "0.0.0.0:8000"]
```

Build and run:
```bash
docker build -t ecojourney .
docker run -p 8000:8000 ecojourney
```

## 📧 Email Configuration

The system uses Django's email backend. For development, you can use:
- **Console Backend**: Prints emails to console
- **File Backend**: Saves emails to files
- **SMTP**: Configure with your email provider

### Gmail Configuration Example
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-specific-password'
```

## 🧪 Testing

Run tests:
```bash
python manage.py test
```

Run tests with coverage:
```bash
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

## 🔧 Configuration

### Settings File (`ecojourney/settings.py`)

Key configurations to set:
- `ALLOWED_HOSTS` - List of allowed domain names
- `DEBUG` - Set to False in production
- `DATABASES` - Database configuration
- `INSTALLED_APPS` - Installed Django apps
- `MIDDLEWARE` - Active middleware
- `EMAIL_*` - Email configuration
- `AUTH_USER_MODEL` - Custom user model

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'apps'"
**Solution**: Ensure you're running manage.py from the project root with proper PYTHONPATH

### Issue: "Email not sending"
**Solution**: Check email configuration in settings.py and verify SMTP credentials

### Issue: "Static files not loading"
**Solution**: Run `python manage.py collectstatic` and ensure STATIC_URL is correct

## 📝 License

This project is for educational purposes. All rights reserved.

## 👥 Contributors

- EcoJourney Development Team

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Django and DRF documentation
3. Contact: support@ecojourney.com

## 🔄 Future Enhancements

- [ ] Advanced analytics and reporting
- [ ] Content scheduling and publishing
- [ ] Multi-language support
- [ ] Content rating and feedback system
- [ ] Batch content operations
- [ ] Advanced search with filters
- [ ] Content collaboration features
- [ ] Mobile app development
- [ ] Video streaming optimization
- [ ] Integration with social media

---

**Last Updated**: December 2024
**Version**: 1.0.0
