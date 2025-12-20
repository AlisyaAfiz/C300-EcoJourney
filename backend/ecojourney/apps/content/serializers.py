from rest_framework import serializers
from .models import (
    ContentCategory, MultimediaContent, 
    ContentApprovalWorkflow, ContentVersion
)


class ContentCategorySerializer(serializers.ModelSerializer):
    """Serializer for content categories"""
    class Meta:
        model = ContentCategory
        fields = ['id', 'name', 'description', 'icon', 'color_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContentVersionSerializer(serializers.ModelSerializer):
    """Serializer for content versions"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = ContentVersion
        fields = ['id', 'version_number', 'title', 'description', 'file', 
                 'created_by', 'created_by_username', 'change_log', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by']


class ContentApprovalWorkflowSerializer(serializers.ModelSerializer):
    """Serializer for content approval workflow"""
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)

    class Meta:
        model = ContentApprovalWorkflow
        fields = ['id', 'content', 'submitted_by', 'submitted_by_username', 'submitted_at',
                 'reviewed_by', 'reviewed_by_username', 'reviewed_at', 'approval_status',
                 'feedback', 'internal_notes', 'version', 'created_at', 'updated_at']
        read_only_fields = ['id', 'submitted_by', 'submitted_at', 'created_at', 'updated_at']


class MultimediaContentListSerializer(serializers.ModelSerializer):
    """Serializer for listing multimedia content"""
    category_name = serializers.CharField(source='category.get_name_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_id = serializers.CharField(source='created_by.id', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    status_badge = serializers.SerializerMethodField()

    class Meta:
        model = MultimediaContent
        fields = ['id', 'title', 'description', 'content_type', 'category', 'category_name',
                 'thumbnail', 'created_by', 'created_by_username', 'created_by_id', 'status',
                 'status_badge', 'submitted_at', 'approved_by', 'approved_by_username', 
                 'approved_at', 'views_count', 'likes_count', 'is_featured', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'views_count', 'likes_count', 'created_at', 'updated_at']

    def get_status_badge(self, obj):
        return obj.get_status_badge()


class MultimediaContentDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed multimedia content view"""
    category_name = serializers.CharField(source='category.get_name_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    rejected_by_username = serializers.CharField(source='rejected_by.username', read_only=True, allow_null=True)
    published_by_username = serializers.CharField(source='published_by.username', read_only=True, allow_null=True)
    versions = ContentVersionSerializer(many=True, read_only=True)
    approval_workflow = ContentApprovalWorkflowSerializer(read_only=True)
    status_badge = serializers.SerializerMethodField()
    tags_list = serializers.SerializerMethodField()

    class Meta:
        model = MultimediaContent
        fields = ['id', 'title', 'description', 'content_type', 'category', 'category_name',
                 'file', 'thumbnail', 'created_by', 'created_by_username', 'status',
                 'status_badge', 'submitted_at', 'approved_by', 'approved_by_username',
                 'approved_at', 'rejected_reason', 'rejected_at', 'rejected_by',
                 'rejected_by_username', 'published_at', 'published_by', 'published_by_username',
                 'views_count', 'likes_count', 'downloads_count', 'is_featured',
                 'tags', 'tags_list', 'versions', 'approval_workflow',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'views_count', 'likes_count', 'downloads_count',
                           'created_at', 'updated_at', 'submitted_at', 'approved_by',
                           'approved_at', 'rejected_at', 'rejected_by', 'published_at',
                           'published_by', 'versions', 'approval_workflow']

    def get_status_badge(self, obj):
        return obj.get_status_badge()

    def get_tags_list(self, obj):
        if obj.tags:
            return [tag.strip() for tag in obj.tags.split(',')]
        return []


class MultimediaContentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating multimedia content"""
    tags_list = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = MultimediaContent
        fields = ['id', 'title', 'description', 'content_type', 'category',
                 'file', 'thumbnail', 'tags_list', 'tags']
        read_only_fields = ['id', 'tags']

    def to_representation(self, instance):
        """Convert tags string to list for display"""
        ret = super().to_representation(instance)
        if instance.tags:
            ret['tags_list'] = [tag.strip() for tag in instance.tags.split(',')]
        return ret

    def create(self, validated_data):
        """Create content and convert tags list to string"""
        tags_list = validated_data.pop('tags_list', [])
        if tags_list:
            validated_data['tags'] = ', '.join(tags_list)
        
        validated_data['created_by'] = self.context['request'].user
        return MultimediaContent.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """Update content and convert tags list to string"""
        tags_list = validated_data.pop('tags_list', None)
        if tags_list is not None:
            validated_data['tags'] = ', '.join(tags_list)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ContentApprovalRequestSerializer(serializers.Serializer):
    """Serializer for submitting content for approval"""
    content_id = serializers.UUIDField(required=True)
    submission_notes = serializers.CharField(
        required=False,
        allow_blank=True
    )


class ContentApprovalReviewSerializer(serializers.Serializer):
    """Serializer for reviewing content approval"""
    content_id = serializers.UUIDField(required=True)
    approval_status = serializers.ChoiceField(
        choices=['approved', 'rejected', 'requested_changes'],
        required=True
    )
    feedback = serializers.CharField(
        required=False,
        allow_blank=True
    )
    internal_notes = serializers.CharField(
        required=False,
        allow_blank=True
    )
