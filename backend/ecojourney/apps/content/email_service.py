from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


class EmailNotificationService:
    """Service for sending email notifications"""
    
    FROM_EMAIL = 'noreply@ecojourney.com'
    
    @classmethod
    def send_email(cls, subject, template_name, context, recipient_email):
        """Send HTML email"""
        try:
            html_message = render_to_string(template_name, context)
            plain_message = strip_tags(html_message)
            send_mail(
                subject,
                plain_message,
                cls.FROM_EMAIL,
                [recipient_email],
                html_message=html_message,
            )
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    @classmethod
    def send_welcome_email(cls, user):
        """Send welcome email to new user"""
        context = {
            'user_name': user.get_full_name() or user.username,
            'site_url': 'http://localhost:8000',
        }
        return cls.send_email(
            'Welcome to EcoJourney CMS',
            'emails/welcome_email.html',
            context,
            user.email
        )
    
    @classmethod
    def send_password_reset_email(cls, user, reset_token):
        """Send password reset email"""
        reset_url = f"http://localhost:8000/forgot-password/?token={reset_token.token}"
        context = {
            'user_name': user.get_full_name() or user.username,
            'reset_link': reset_url,
            'token': reset_token.token,
        }
        return cls.send_email(
            'Password Reset Request',
            'emails/password_reset_email.html',
            context,
            user.email
        )
    
    @classmethod
    def send_content_submission_notification(cls, content, manager_emails):
        """Notify manager of new content submission"""
        context = {
            'content_title': content.title,
            'content_description': content.description,
            'creator_name': content.creator.get_full_name() or content.creator.username,
            'category': content.category.get_name_display(),
            'dashboard_url': 'http://localhost:8000/admin',
        }
        for email in manager_emails:
            cls.send_email(
                f'New Content Submission: {content.title}',
                'emails/content_submission_notification.html',
                context,
                email
            )
    
    @classmethod
    def send_content_approved_notification(cls, content):
        """Notify creator that content was approved"""
        context = {
            'user_name': content.creator.get_full_name() or content.creator.username,
            'content_title': content.title,
            'dashboard_url': 'http://localhost:8000',
        }
        return cls.send_email(
            f'Content Approved: {content.title}',
            'emails/content_approved_notification.html',
            context,
            content.creator.email
        )
    
    @classmethod
    def send_content_rejected_notification(cls, content, feedback):
        """Notify creator that content was rejected"""
        context = {
            'user_name': content.creator.get_full_name() or content.creator.username,
            'content_title': content.title,
            'feedback': feedback,
            'dashboard_url': 'http://localhost:8000',
        }
        return cls.send_email(
            f'Content Rejected: {content.title}',
            'emails/content_rejected_notification.html',
            context,
            content.creator.email
        )
    
    @classmethod
    def send_changes_requested_notification(cls, content, feedback):
        """Notify creator that changes are requested"""
        context = {
            'user_name': content.creator.get_full_name() or content.creator.username,
            'content_title': content.title,
            'feedback': feedback,
            'dashboard_url': 'http://localhost:8000',
        }
        return cls.send_email(
            f'Changes Requested: {content.title}',
            'emails/changes_requested_notification.html',
            context,
            content.creator.email
        )
    
    @classmethod
    def send_content_published_notification(cls, content):
        """Notify creator that content was published"""
        context = {
            'user_name': content.creator.get_full_name() or content.creator.username,
            'content_title': content.title,
            'content_url': f'http://localhost:8000/content/{content.id}',
            'dashboard_url': 'http://localhost:8000',
        }
        return cls.send_email(
            f'Content Published: {content.title}',
            'emails/content_published_notification.html',
            context,
            content.creator.email
        )
