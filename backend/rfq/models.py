from django.db import models
from team.models import TeamMember

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
    rfq_channel = models.CharField(max_length=100, blank=True, null=True)
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
    rfq_channel = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    attention_name = models.CharField(max_length=255, blank=True, null=True)
    attention_phone = models.CharField(max_length=255, blank=True, null=True)
    attention_email = models.EmailField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)  # Added field
    assign_to = models.ForeignKey(TeamMember, on_delete=models.SET_NULL, null=True, blank=True)  # Added field

    def __str__(self):
        return f"RFQ {self.company_name or 'Unnamed Company'}"

class RFQItem(models.Model):
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=255, blank=True, null=True)
    product_name = models.CharField(max_length=255, blank=True, null=True)
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.item_name or self.product_name} for RFQ {self.rfq.id}"