from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RFQViewSet, RFQChannelViewSet, ClientViewSet

router = DefaultRouter()
router.register(r'add-rfqs', RFQViewSet, basename='rfq')
router.register(r'rfq-channels', RFQChannelViewSet, basename='rfqchannel')
router.register(r'clients', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
]