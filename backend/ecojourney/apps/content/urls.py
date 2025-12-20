from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContentCategoryViewSet, MultimediaContentViewSet

router = DefaultRouter()
router.register(r'categories', ContentCategoryViewSet, basename='category')
router.register(r'', MultimediaContentViewSet, basename='content')

urlpatterns = [
    path('', include(router.urls)),
]
