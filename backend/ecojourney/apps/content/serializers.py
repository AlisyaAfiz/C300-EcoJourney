from rest_framework import serializers
from apps.content.models import ContentCategory, MultimediaContent, ContentApprovalWorkflow, ContentVersion
from apps.users.serializers import UserSerializer


class ContentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentCategory
        fields = ['id', 'name', 'description', 'color_code', 'created_at']


class ContentVersionSerializer(serializers.ModelSerializer):
    changed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ContentVersion
        fields = ['id', 'version_number', 'title', 'description', 'change_description', 'changed_by', 'created_at']


class MultimediaContentListSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    category = ContentCategorySerializer(read_only=True)
    
    class Meta:
        model = MultimediaContent
        fields = ['id', 'title', 'description', 'content_type', 'category', 'status', 'creator', 'view_count', 'created_at', 'published_at']


class MultimediaContentDetailSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    category = ContentCategorySerializer(read_only=True)
    versions = ContentVersionSerializer(many=True, read_only=True)
    
    class Meta:
        model = MultimediaContent
        fields = ['id', 'title', 'description', 'content_type', 'category', 'file', 'thumbnail', 'tags', 'status', 'creator', 'view_count', 'versions', 'created_at', 'updated_at', 'published_at']


class MultimediaContentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MultimediaContent
        fields = ['title', 'description', 'content_type', 'category', 'file', 'thumbnail', 'tags']
    
    def validate_file(self, value):
        """Validate file size and type"""
        if value.size > 104857600:  # 100MB
            raise serializers.ValidationError("File size cannot exceed 100MB")
        return value


class ContentApprovalWorkflowSerializer(serializers.ModelSerializer):
    content = MultimediaContentListSerializer(read_only=True)
    submitted_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    
    class Meta:
        model = ContentApprovalWorkflow
        fields = ['id', 'content', 'submitted_by', 'assigned_to', 'status', 'feedback', 'submitted_at', 'reviewed_at']


class ContentApprovalReviewSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=['approved', 'rejected', 'requested_changes'])
    feedback = serializers.CharField(required=False, allow_blank=True)
    
    def validate_decision(self, value):
        if value not in ['approved', 'rejected', 'requested_changes']:
            raise serializers.ValidationError("Invalid decision")
        return value
