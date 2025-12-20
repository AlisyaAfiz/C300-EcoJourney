from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q

from .models import (
    ContentCategory, MultimediaContent, 
    ContentApprovalWorkflow, ContentVersion
)
from .serializers import (
    ContentCategorySerializer, MultimediaContentListSerializer,
    MultimediaContentDetailSerializer, MultimediaContentCreateUpdateSerializer,
    ContentApprovalWorkflowSerializer, ContentVersionSerializer,
    ContentApprovalRequestSerializer, ContentApprovalReviewSerializer
)
from .email_service import EmailNotificationService

User = get_user_model()


class ContentCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for content categories"""
    queryset = ContentCategory.objects.filter(is_active=True)
    serializer_class = ContentCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class MultimediaContentViewSet(viewsets.ModelViewSet):
    """ViewSet for multimedia content"""
    queryset = MultimediaContent.objects.all()
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'views_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return MultimediaContentListSerializer
        elif self.action == 'retrieve':
            return MultimediaContentDetailSerializer
        else:
            return MultimediaContentCreateUpdateSerializer

    def get_queryset(self):
        """Filter content based on user role"""
        user = self.request.user
        
        if user.role.name == 'admin':
            # Admin sees all content
            return MultimediaContent.objects.all()
        elif user.role.name == 'content_manager':
            # Content manager sees all content
            return MultimediaContent.objects.all()
        else:
            # Content producer sees only their content
            return MultimediaContent.objects.filter(created_by=user)

    def perform_create(self, serializer):
        """Create content"""
        content = serializer.save(created_by=self.request.user)
        return content

    def perform_update(self, serializer):
        """Update content"""
        content = serializer.save()
        
        # Create version record
        version_number = content.versions.count() + 1
        ContentVersion.objects.create(
            content=content,
            version_number=version_number,
            title=content.title,
            description=content.description,
            file=content.file,
            created_by=self.request.user,
            change_log='Content updated'
        )
        
        return content

    @action(detail=False, methods=['get'])
    def my_content(self, request):
        """Get current user's content"""
        user = request.user
        contents = MultimediaContent.objects.filter(created_by=user)
        
        # Apply filters
        status_filter = request.query_params.get('status')
        search_query = request.query_params.get('search')
        
        if status_filter:
            contents = contents.filter(status=status_filter)
        
        if search_query:
            contents = contents.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query)
            )
        
        # Paginate
        page = self.paginate_queryset(contents)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(contents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get pending content for approval (content manager only)"""
        if request.user.role.name != 'content_manager':
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        contents = MultimediaContent.objects.filter(status='pending')
        
        # Apply filters
        status_filter = request.query_params.get('status')
        search_query = request.query_params.get('search')
        
        if status_filter and status_filter != 'all':
            contents = contents.filter(status=status_filter)
        
        if search_query:
            contents = contents.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query)
            )
        
        # Paginate
        page = self.paginate_queryset(contents)
        if page is not None:
            serializer = MultimediaContentListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MultimediaContentListSerializer(contents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def all(self, request):
        """Get all content (admin only)"""
        if request.user.role.name != 'admin':
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        contents = MultimediaContent.objects.all()
        
        # Paginate
        page = self.paginate_queryset(contents)
        if page is not None:
            serializer = MultimediaContentListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MultimediaContentListSerializer(contents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def submit_approval(self, request):
        """Submit content for approval"""
        serializer = ContentApprovalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                content = MultimediaContent.objects.get(
                    id=serializer.validated_data['content_id'],
                    created_by=request.user
                )
                
                # Check if content is in draft status
                if content.status != 'draft':
                    return Response(
                        {'detail': 'Only draft content can be submitted'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update content status
                content.status = 'pending'
                content.submitted_at = timezone.now()
                content.save()
                
                # Create approval workflow
                ContentApprovalWorkflow.objects.create(
                    content=content,
                    submitted_by=request.user,
                    submission_notes=serializer.validated_data.get('submission_notes', ''),
                    approval_status='pending'
                )
                
                # Send notification to content managers
                EmailNotificationService.send_content_submission_notification(content)
                
                return Response({'detail': 'Content submitted for approval'})
            except MultimediaContent.DoesNotExist:
                return Response(
                    {'detail': 'Content not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def review_approval(self, request):
        """Review content approval (content manager only)"""
        if request.user.role.name != 'content_manager':
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ContentApprovalReviewSerializer(data=request.data)
        if serializer.is_valid():
            try:
                content = MultimediaContent.objects.get(
                    id=serializer.validated_data['content_id']
                )
                
                approval_status = serializer.validated_data['approval_status']
                feedback = serializer.validated_data.get('feedback', '')
                
                # Update approval workflow
                workflow = content.approval_workflow
                workflow.reviewed_by = request.user
                workflow.reviewed_at = timezone.now()
                workflow.approval_status = approval_status
                workflow.feedback = feedback
                workflow.save()
                
                # Update content status
                if approval_status == 'approved':
                    content.status = 'approved'
                    content.approved_by = request.user
                    content.approved_at = timezone.now()
                    content.save()
                    
                    # Send notification
                    EmailNotificationService.send_content_approved_notification(content)
                
                elif approval_status == 'rejected':
                    content.status = 'rejected'
                    content.rejected_by = request.user
                    content.rejected_at = timezone.now()
                    content.rejected_reason = feedback
                    content.save()
                    
                    # Send notification
                    EmailNotificationService.send_content_rejected_notification(content, feedback)
                
                elif approval_status == 'requested_changes':
                    content.status = 'draft'  # Return to draft
                    content.save()
                    
                    # Send notification
                    EmailNotificationService.send_changes_requested_notification(content, feedback)
                
                return Response({'detail': 'Content reviewed successfully'})
            except MultimediaContent.DoesNotExist:
                return Response(
                    {'detail': 'Content not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def publish(self, request):
        """Publish approved content (admin/content manager)"""
        if request.user.role.name not in ['admin', 'content_manager']:
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        content_id = request.data.get('content_id')
        try:
            content = MultimediaContent.objects.get(id=content_id)
            
            if content.status != 'approved':
                return Response(
                    {'detail': 'Only approved content can be published'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            content.status = 'published'
            content.published_at = timezone.now()
            content.published_by = request.user
            content.save()
            
            # Send notification
            EmailNotificationService.send_content_published_notification(content)
            
            return Response({'detail': 'Content published successfully'})
        except MultimediaContent.DoesNotExist:
            return Response(
                {'detail': 'Content not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['delete'])
    def delete_content(self, request):
        """Delete content"""
        content_id = request.data.get('content_id')
        try:
            content = MultimediaContent.objects.get(id=content_id)
            
            # Check permissions
            if request.user.role.name == 'admin' or content.created_by == request.user:
                content.delete()
                return Response({'detail': 'Content deleted successfully'})
            else:
                return Response(
                    {'detail': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except MultimediaContent.DoesNotExist:
            return Response(
                {'detail': 'Content not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def create(self, request):
        """Create new content"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                MultimediaContentDetailSerializer(serializer.instance).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContentVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for content versions"""
    queryset = ContentVersion.objects.all()
    serializer_class = ContentVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def by_content(self, request):
        """Get versions for a specific content"""
        content_id = request.query_params.get('content_id')
        versions = ContentVersion.objects.filter(content_id=content_id)
        serializer = self.get_serializer(versions, many=True)
        return Response(serializer.data)
