from django.contrib import admin
from .models import ContentCategory, MultimediaContent, ContentApprovalWorkflow, ContentVersion

@admin.register(ContentCategory)
class ContentCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'color_code', 'created_at')
    search_fields = ('name',)

@admin.register(MultimediaContent)
class MultimediaContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'content_type', 'category', 'status', 'creator', 'created_at')
    list_filter = ('status', 'content_type', 'category', 'created_at')
    search_fields = ('title', 'description', 'creator__username')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('id', 'title', 'description', 'content_type')}),
        ('Files & Media', {'fields': ('file', 'thumbnail')}),
        ('Classification', {'fields': ('category', 'tags')}),
        ('Status & Workflow', {'fields': ('status', 'approval_workflow')}),
        ('Creator', {'fields': ('creator',)}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )

@admin.register(ContentApprovalWorkflow)
class ContentApprovalWorkflowAdmin(admin.ModelAdmin):
    list_display = ('content', 'submitted_by', 'assigned_to', 'status', 'submitted_at')
    list_filter = ('status', 'submitted_at')
    search_fields = ('content__title', 'submitted_by__username')

@admin.register(ContentVersion)
class ContentVersionAdmin(admin.ModelAdmin):
    list_display = ('content', 'version_number', 'changed_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content__title', 'changed_by__username')
