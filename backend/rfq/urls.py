from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rfq.views import RFQViewSet, RFQChannelViewSet, ClientViewSet, RFQItemViewSet

router = DefaultRouter()
router.register(r'add-rfqs', RFQViewSet, basename='rfq')
router.register(r'rfq-channels', RFQChannelViewSet, basename='rfqchannel')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'add-items', RFQItemViewSet, basename='rfqitem')

urlpatterns = [
    path('', include(router.urls)),
]