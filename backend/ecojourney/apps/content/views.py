from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.template.loader import render_to_string

from apps.content.models import ContentCategory, MultimediaContent, ContentApprovalWorkflow, ContentVersion
from apps.content.serializers import (
    ContentCategorySerializer,
    MultimediaContentListSerializer,
    MultimediaContentDetailSerializer,
    MultimediaContentCreateUpdateSerializer,
    ContentApprovalWorkflowSerializer,
    ContentApprovalReviewSerializer,
)


class ContentCategoryViewSet(viewsets.ModelViewSet):
    """API endpoints for content categories"""
    queryset = ContentCategory.objects.all()
    serializer_class = ContentCategorySerializer
    permission_classes = [IsAuthenticated]


class MultimediaContentViewSet(viewsets.ModelViewSet):
    """API endpoints for multimedia content"""
    queryset = MultimediaContent.objects.all()
    serializer_class = MultimediaContentListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MultimediaContentCreateUpdateSerializer
        elif self.action == 'retrieve':
            return MultimediaContentDetailSerializer
        return MultimediaContentListSerializer
    
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_content(self, request):
        """Get current user's content"""
        content = MultimediaContent.objects.filter(creator=request.user)
        serializer = MultimediaContentListSerializer(content, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get pending approvals (for managers)"""
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        pending = ContentApprovalWorkflow.objects.filter(status='pending')
        serializer = ContentApprovalWorkflowSerializer(pending, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit_approval(self, request, pk=None):
        """Submit content for approval"""
        content = self.get_object()
        
        if content.creator != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if content.status not in ['draft', 'rejected', 'requested_changes']:
            return Response({'error': 'Content cannot be submitted for approval'}, status=status.HTTP_400_BAD_REQUEST)
        
        content.status = 'pending'
        content.save()
        
        # Create or update approval workflow
        workflow, created = ContentApprovalWorkflow.objects.update_or_create(
            content=content,
            defaults={
                'submitted_by': request.user,
                'status': 'pending'
            }
        )
        
        # Send notification email to managers
        try:
            send_mail(
                f'New Content Submission: {content.title}',
                f'New content submitted for review: {content.title}',
                'noreply@ecojourney.com',
                ['manager@ecojourney.com'],
            )
        except:
            pass
        
        return Response({
            'message': 'Content submitted for approval',
            'workflow': ContentApprovalWorkflowSerializer(workflow).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def review_approval(self, request, pk=None):
        """Review and approve/reject content"""
        content = self.get_object()
        
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ContentApprovalReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        decision = serializer.validated_data['decision']
        feedback = serializer.validated_data.get('feedback', '')
        
        workflow = content.approval_workflow
        
        if decision == 'approved':
            workflow.approve(reviewed_by=request.user, feedback=feedback)
            email_subject = f'Your content "{content.title}" has been approved!'
            message = f'Your content has been approved. It is ready to be published.'
        elif decision == 'rejected':
            workflow.reject(reviewed_by=request.user, feedback=feedback)
            email_subject = f'Your content "{content.title}" has been rejected'
            message = f'Your content was rejected. Feedback: {feedback}'
        else:  # requested_changes
            workflow.request_changes(reviewed_by=request.user, feedback=feedback)
            email_subject = f'Changes requested for "{content.title}"'
            message = f'Please make the following changes: {feedback}'
        
        # Send notification email
        try:
            send_mail(
                email_subject,
                message,
                'noreply@ecojourney.com',
                [content.creator.email],
            )
        except:
            pass
        
        return Response({
            'message': f'Content {decision}',
            'workflow': ContentApprovalWorkflowSerializer(workflow).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish approved content"""
        content = self.get_object()
        
        if content.status != 'approved':
            return Response({'error': 'Only approved content can be published'}, status=status.HTTP_400_BAD_REQUEST)
        
        if content.publish():
            # Send publication email
            try:
                send_mail(
                    f'Your content "{content.title}" has been published!',
                    'Your content is now live on the platform.',
                    'noreply@ecojourney.com',
                    [content.creator.email],
                )
            except:
                pass
            
            return Response({
                'message': 'Content published successfully',
                'content': MultimediaContentDetailSerializer(content).data
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Failed to publish content'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Increment view count"""
        content = self.get_object()
        content.increment_view_count()
        return Response({'view_count': content.view_count}, status=status.HTTP_200_OK)
