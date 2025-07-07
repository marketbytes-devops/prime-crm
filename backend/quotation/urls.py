from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuotationViewSet, PurchaseOrderViewSet, SendDueReminderView

router = DefaultRouter()
router.register(r'quotations', QuotationViewSet, basename='quotation')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')

urlpatterns = [
    path('', include(router.urls)),
    path('quotations/send-due-reminder/', SendDueReminderView.as_view(), name='send-due-reminder'),
]