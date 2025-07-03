from rest_framework import serializers
from .models import NumberSeries

class NumberSeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NumberSeries
        fields = ['id', 'series_name', 'prefix', 'current_sequence', 'created_at', 'updated_at']