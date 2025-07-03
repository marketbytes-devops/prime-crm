from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import  Item, Unit
from .serializers import  ItemSerializer, UnitSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [AllowAny]  
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name'] 
    filterset_fields = ['name']

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name']
    filterset_fields = ['name']