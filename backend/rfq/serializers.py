from rest_framework import serializers
from .models import *

class RFQSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQ
        fields = [
            'id', 'created_at',
            'company_name', 'reference', 'address', 'phone', 'email',
            'attention_name', 'attention_phone', 'attention_email'
        ]