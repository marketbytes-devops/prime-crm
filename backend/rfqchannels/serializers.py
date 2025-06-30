
from rest_framework import serializers
from .models import RFQChannel

class RFQChannelSerializer(serializers.ModelSerializer):
    """
    Serializer for RFQChannel model.
    """
    class Meta:
        model = RFQChannel
        fields = ['id', 'channel_name']