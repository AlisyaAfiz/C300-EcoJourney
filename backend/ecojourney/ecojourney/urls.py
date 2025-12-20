from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/content/', include('apps.content.urls')),
    
    # Frontend routes
    path('', TemplateView.as_view(template_name='dashboard.html'), name='dashboard'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
    path('forgot-password/', TemplateView.as_view(template_name='forgot-password.html'), name='forgot_password'),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
