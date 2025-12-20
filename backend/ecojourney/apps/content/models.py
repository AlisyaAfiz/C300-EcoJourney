import uuid
from django.db import models
from django.utils import timezone
from apps.users.models import User


class ContentCategory(models.Model):
    """Content categories for ESG classification"""
    CATEGORY_TYPES = [
        ('environmental', 'Environmental'),
        ('social', 'Social'),
        ('governance', 'Governance'),
        ('economic', 'Economic'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, choices=CATEGORY_TYPES, unique=True)
    description = models.TextField(blank=True)
    color_code = models.CharField(max_length=7, default='#2ecc71')  # Hex color
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_categories'
        ordering = ['name']
        verbose_name_plural = 'Content Categories'
    
    def __str__(self):
        return self.get_name_display()


class MultimediaContent(models.Model):
    """Main content model for multimedia files"""
    CONTENT_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('document', 'Document'),
        ('article', 'Article'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    category = models.ForeignKey(ContentCategory, on_delete=models.SET_NULL, null=True, related_name='content')
    file = models.FileField(upload_to='content/')
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_content')
    view_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'multimedia_content'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['creator']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return self.title
    
    def increment_view_count(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def publish(self):
        """Publish the content"""
        if self.status == 'approved':
            self.status = 'published'
            self.published_at = timezone.now()
            self.save()
            return True
        return False


class ContentApprovalWorkflow(models.Model):
    """Approval workflow for content management"""
    WORKFLOW_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('requested_changes', 'Changes Requested'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.OneToOneField(MultimediaContent, on_delete=models.CASCADE, related_name='approval_workflow')
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_approvals')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_approvals')
    status = models.CharField(max_length=20, choices=WORKFLOW_STATUS, default='pending')
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'content_approval_workflow'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"Approval: {self.content.title} - {self.status}"
    
    def approve(self, reviewed_by=None, feedback=''):
        """Approve the content"""
        self.status = 'approved'
        self.feedback = feedback
        self.reviewed_at = timezone.now()
        if reviewed_by:
            self.assigned_to = reviewed_by
        self.content.status = 'approved'
        self.content.save()
        self.save()
    
    def reject(self, reviewed_by=None, feedback=''):
        """Reject the content"""
        self.status = 'rejected'
        self.feedback = feedback
        self.reviewed_at = timezone.now()
        if reviewed_by:
            self.assigned_to = reviewed_by
        self.content.status = 'rejected'
        self.content.save()
        self.save()
    
    def request_changes(self, reviewed_by=None, feedback=''):
        """Request changes on the content"""
        self.status = 'requested_changes'
        self.feedback = feedback
        self.reviewed_at = timezone.now()
        if reviewed_by:
            self.assigned_to = reviewed_by
        self.content.status = 'pending'
        self.content.save()
        self.save()


class ContentVersion(models.Model):
    """Track content versions and changes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.ForeignKey(MultimediaContent, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField(default=1)
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to='content/versions/')
    change_description = models.TextField(blank=True, help_text="What changed in this version?")
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'content_versions'
        ordering = ['-version_number']
        unique_together = ['content', 'version_number']
    
    def __str__(self):
        return f"{self.content.title} v{self.version_number}"
