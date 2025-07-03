from rest_framework import serializers
from .models import Series

class SeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Series
        fields = ['id', 'series_name', 'current_sequence']