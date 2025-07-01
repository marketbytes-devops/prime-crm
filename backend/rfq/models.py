# rfq/models.py
from django.db import models

class RFQChannel(models.Model):
    channel_name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.channel_name

class Client(models.Model):
    company_name = models.CharField(max_length=255)
    reference = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    rfq_channel = models.CharField(max_length=100, blank=True, null=True)  # Matches RFQ
    attention_name = models.CharField(max_length=255, blank=True, null=True)
    attention_phone = models.CharField(max_length=255, blank=True, null=True)
    attention_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name or 'Unnamed Client'

class RFQ(models.Model):
    company_name = models.CharField(max_length=255)
    reference = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    rfq_channel = models.CharField(max_length=100, blank=True, null=True)  # Match RFQChannel max_length
    created_at = models.DateTimeField(auto_now_add=True)
    attention_name = models.CharField(max_length=255, blank=True, null=True)
    attention_phone = models.CharField(max_length=255, blank=True, null=True)
    attention_email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return f"RFQ {self.company_name or 'Unnamed Company'}"