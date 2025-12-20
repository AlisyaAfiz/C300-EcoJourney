from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class ContentCategory(models.Model):
    """Content categories (Environmental, Social, Governance, etc.)"""
    CATEGORY_TYPES = [
        ('environmental', 'Environmental'),
        ('social', 'Social'),
        ('governance', 'Governance'),
        ('economic', 'Economic'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, choices=CATEGORY_TYPES, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.ImageField(upload_to='category_icons/', blank=True, null=True)
    color_code = models.CharField(max_length=7, default='#000000', help_text="Hex color code")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Content Categories'
        ordering = ['name']

    def __str__(self):
        return self.get_name_display()


class MultimediaContent(models.Model):
    """Multimedia content model for uploads"""
    CONTENT_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('document', 'Document'),
        ('article', 'Article'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    category = models.ForeignKey(ContentCategory, on_delete=models.SET_NULL, null=True, related_name='content_items')
    
    # File handling
    file = models.FileField(upload_to='content_files/', blank=True, null=True)
    thumbnail = models.ImageField(upload_to='content_thumbnails/', blank=True, null=True)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_content')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Approval workflow
    submitted_at = models.DateTimeField(blank=True, null=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_content')
    approved_at = models.DateTimeField(blank=True, null=True)
    rejected_reason = models.TextField(blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    rejected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='rejected_content')
    
    # Publishing
    published_at = models.DateTimeField(blank=True, null=True)
    published_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='published_content')
    
    # Metadata
    views_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    downloads_count = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    
    tags = models.CharField(max_length=500, blank=True, null=True, help_text="Comma-separated tags")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_by']),
            models.Index(fields=['category']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_content_type_display()})"

    def get_status_badge(self):
        """Return badge color for status"""
        status_colors = {
            'draft': 'secondary',
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'published': 'primary',
            'archived': 'dark',
        }
        return status_colors.get(self.status, 'secondary')


class ContentApprovalWorkflow(models.Model):
    """Track approval workflow and feedback"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.OneToOneField(MultimediaContent, on_delete=models.CASCADE, related_name='approval_workflow')
    
    # Submission details
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_approvals')
    submitted_at = models.DateTimeField(auto_now_add=True)
    submission_notes = models.TextField(blank=True, null=True)
    
    # Approval details
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_approvals')
    reviewed_at = models.DateTimeField(blank=True, null=True)
    approval_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('requested_changes', 'Changes Requested'),
    ], default='pending')
    
    # Feedback
    feedback = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    
    # History
    version = models.IntegerField(default=1)
    previous_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='next_version')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Content Approval Workflows'
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Approval for {self.content.title} - {self.approval_status}"


class ContentVersion(models.Model):
    """Store version history of content"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.ForeignKey(MultimediaContent, on_delete=models.CASCADE, related_name='versions')
    
    version_number = models.IntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='content_versions/')
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_versions')
    change_log = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = ('content', 'version_number')

    def __str__(self):
        return f"{self.content.title} - Version {self.version_number}"
