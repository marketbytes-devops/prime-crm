from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Series
from .serializers import SeriesSerializer

class SeriesViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Series.objects.all()
    serializer_class = SeriesSerializer