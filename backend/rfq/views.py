# rfq/views.py
from rest_framework import viewsets
from .models import RFQ, RFQChannel, Client
from .serializers import RFQSerializer, RFQChannelSerializer, ClientSerializer
from rest_framework.permissions import AllowAny

class RFQViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer

class RFQChannelViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = RFQChannel.objects.all()
    serializer_class = RFQChannelSerializer

class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Client.objects.all()
    serializer_class = ClientSerializer