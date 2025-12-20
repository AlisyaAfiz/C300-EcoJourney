from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MultimediaContentViewSet

# Create router for MultimediaContentViewSet
router = DefaultRouter()
router.register(r'', MultimediaContentViewSet, basename='content')

urlpatterns = [
    path('', include(router.urls)),
]
