# rfq/models.py
from django.db import models

class RFQ(models.Model):
    company_name = models.CharField(max_length=255)
    reference = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    rfq_channel = models.CharField(max_length=100, null=True, blank=True)  # Match RFQChannel max_length
    created_at = models.DateTimeField(auto_now_add=True)
    attention_name = models.CharField(max_length=255, null=True, blank=True)
    attention_phone = models.CharField(max_length=255, null=True, blank=True)
    attention_email = models.EmailField()

    def __str__(self):
        return f"RFQ {self.company_name or 'Unnamed Company'}"