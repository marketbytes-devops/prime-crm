# rfq/serializers.py
from rest_framework import serializers
from .models import RFQ, RFQChannel, Client

class RFQChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQChannel
        fields = ['id', 'channel_name']

class ClientSerializer(serializers.ModelSerializer):
    rfq_channel = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = Client
        fields = [
            'id', 'company_name', 'reference', 'address', 'phone', 'email',
            'rfq_channel', 'attention_name', 'attention_phone', 'attention_email',
            'created_at'
        ]

class RFQSerializer(serializers.ModelSerializer):
    rfq_channel = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = RFQ
        fields = [
            'id', 'created_at',
            'company_name', 'reference', 'address', 'phone', 'email',
            'rfq_channel', 'attention_name', 'attention_phone', 'attention_email'
        ]