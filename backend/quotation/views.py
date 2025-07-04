from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Quotation, PurchaseOrder
from .serializers import QuotationSerializer, PurchaseOrderSerializer

class QuotationViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer

    def get_queryset(self):
        queryset = Quotation.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(quotation_no__icontains=search)
        return queryset

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer