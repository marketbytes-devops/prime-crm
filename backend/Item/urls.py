from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  ItemViewSet, UnitViewSet

router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='item')
router.register(r'units', UnitViewSet, basename='unit')  # Unique basename for Unit

urlpatterns = [
    path('', include(router.urls)),
]