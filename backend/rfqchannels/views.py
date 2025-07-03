from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from .models import RFQChannel
from .serializers import RFQChannelSerializer
from rest_framework.permissions import AllowAny

class RFQChannelViewSet(viewsets.ModelViewSet):
    queryset = RFQChannel.objects.all()
    serializer_class = RFQChannelSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)