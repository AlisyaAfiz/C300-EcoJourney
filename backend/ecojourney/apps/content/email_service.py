from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class EmailNotificationService:
    """Handle email notifications for the CMS"""
    
    @staticmethod
    def send_email(subject, template_name, context, recipient_list, fail_silently=False):
        """
        Send email using HTML template
        
        Args:
            subject: Email subject
            template_name: Path to email template
            context: Context dictionary for template rendering
            recipient_list: List of recipient email addresses
            fail_silently: Whether to fail silently on error
        """
        try:
            html_message = render_to_string(template_name, context)
            text_message = strip_tags(html_message)
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipient_list
            )
            email.attach_alternative(html_message, 'text/html')
            email.send(fail_silently=fail_silently)
            
            logger.info(f"Email sent to {recipient_list} with subject: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_list}: {str(e)}")
            if not fail_silently:
                raise
            return False

    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new user"""
        context = {
            'user': user,
            'username': user.get_full_name() or user.username,
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject='Welcome to EcoJourney CMS',
            template_name='emails/welcome_email.html',
            context=context,
            recipient_list=[user.email],
            fail_silently=True
        )

    @staticmethod
    def send_password_reset_email(user, reset_token, reset_url):
        """Send password reset email"""
        context = {
            'user': user,
            'username': user.get_full_name() or user.username,
            'reset_url': reset_url,
            'token': reset_token,
            'expires_hours': 24,
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject='Reset Your EcoJourney Password',
            template_name='emails/password_reset_email.html',
            context=context,
            recipient_list=[user.email],
            fail_silently=True
        )

    @staticmethod
    def send_content_submission_notification(content):
        """Notify content managers when new content is submitted for approval"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get all content managers
        content_managers = User.objects.filter(role__name='content_manager')
        recipient_list = [manager.email for manager in content_managers if manager.email]
        
        if not recipient_list:
            logger.warning("No content managers found to notify")
            return False
        
        context = {
            'content_title': content.title,
            'content_id': content.id,
            'submitted_by': content.created_by.get_full_name() or content.created_by.username,
            'content_type': content.get_content_type_display(),
            'category': content.category.get_name_display() if content.category else 'N/A',
            'description': content.description[:200] if content.description else 'No description',
            'submission_date': content.submitted_at.strftime('%B %d, %Y at %I:%M %p'),
            'dashboard_url': f"{settings.SITE_URL}/dashboard/approvals/",
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject=f'New Content Submitted for Approval: {content.title}',
            template_name='emails/content_submission_notification.html',
            context=context,
            recipient_list=recipient_list,
            fail_silently=True
        )

    @staticmethod
    def send_content_approved_notification(content):
        """Notify content producer when content is approved"""
        context = {
            'content_title': content.title,
            'content_id': content.id,
            'approved_by': content.approved_by.get_full_name() or content.approved_by.username,
            'approved_date': content.approved_at.strftime('%B %d, %Y at %I:%M %p'),
            'dashboard_url': f"{settings.SITE_URL}/dashboard/content/",
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject=f'Your Content Has Been Approved: {content.title}',
            template_name='emails/content_approved_notification.html',
            context=context,
            recipient_list=[content.created_by.email],
            fail_silently=True
        )

    @staticmethod
    def send_content_rejected_notification(content, rejection_reason=''):
        """Notify content producer when content is rejected with feedback"""
        context = {
            'content_title': content.title,
            'content_id': content.id,
            'rejected_by': content.rejected_by.get_full_name() or content.rejected_by.username,
            'rejected_date': content.rejected_at.strftime('%B %d, %Y at %I:%M %p'),
            'rejection_reason': content.rejected_reason or rejection_reason or 'See dashboard for details',
            'dashboard_url': f"{settings.SITE_URL}/dashboard/content/",
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject=f'Content Feedback: {content.title}',
            template_name='emails/content_rejected_notification.html',
            context=context,
            recipient_list=[content.created_by.email],
            fail_silently=True
        )

    @staticmethod
    def send_content_published_notification(content):
        """Notify content producer when content is published"""
        context = {
            'content_title': content.title,
            'content_id': content.id,
            'published_date': content.published_at.strftime('%B %d, %Y at %I:%M %p'),
            'content_url': f"{settings.SITE_URL}/content/{content.id}/",
            'dashboard_url': f"{settings.SITE_URL}/dashboard/content/",
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject=f'Your Content is Live: {content.title}',
            template_name='emails/content_published_notification.html',
            context=context,
            recipient_list=[content.created_by.email],
            fail_silently=True
        )

    @staticmethod
    def send_changes_requested_notification(content, feedback=''):
        """Notify content producer when changes are requested"""
        context = {
            'content_title': content.title,
            'content_id': content.id,
            'feedback': feedback or content.rejected_reason or 'Please review the approval feedback',
            'dashboard_url': f"{settings.SITE_URL}/dashboard/content/",
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject=f'Changes Requested: {content.title}',
            template_name='emails/changes_requested_notification.html',
            context=context,
            recipient_list=[content.created_by.email],
            fail_silently=True
        )

    @staticmethod
    def send_user_role_assignment_notification(user, role):
        """Notify user when role is assigned"""
        context = {
            'user': user,
            'username': user.get_full_name() or user.username,
            'role': role.get_name_display(),
            'dashboard_url': f"{settings.SITE_URL}/dashboard/",
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject='Your Role Has Been Updated',
            template_name='emails/role_assignment_notification.html',
            context=context,
            recipient_list=[user.email],
            fail_silently=True
        )

    @staticmethod
    def send_account_disabled_notification(user):
        """Notify user when account is disabled"""
        context = {
            'user': user,
            'username': user.get_full_name() or user.username,
            'support_email': settings.SUPPORT_EMAIL,
            'site_url': settings.SITE_URL,
            'year': timezone.now().year,
        }
        
        return EmailNotificationService.send_email(
            subject='Your Account Has Been Disabled',
            template_name='emails/account_disabled_notification.html',
            context=context,
            recipient_list=[user.email],
            fail_silently=True
        )
