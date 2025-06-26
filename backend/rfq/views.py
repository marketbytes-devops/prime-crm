from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.permissions import AllowAny

class RFQViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer
