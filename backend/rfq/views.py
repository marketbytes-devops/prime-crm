from rest_framework import viewsets
from .models import RFQ, RFQChannel, Client
from .serializers import RFQSerializer, RFQChannelSerializer, ClientSerializer
from rest_framework.permissions import AllowAny
from series.models import NumberSeries

class RFQViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        series = instance.series
        response = super().destroy(request, *args, **kwargs)
        
        if series:
            rfqs = RFQ.objects.filter(series=series).order_by('created_at')
            sequence = 1
            for rfq in rfqs:
                rfq.rfq_no = f"{series.prefix}-{str(sequence).zfill(7)}"
                rfq.save()
                sequence += 1
            series.current_sequence = sequence - 1
            series.save()
        
        return response

class RFQChannelViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = RFQChannel.objects.all()
    serializer_class = RFQChannelSerializer

class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Client.objects.all()
    serializer_class = ClientSerializer