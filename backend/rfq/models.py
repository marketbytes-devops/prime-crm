from django.db import models
from team.models import TeamMember
from series.models import NumberSeries

class RFQChannel(models.Model):
    channel_name = models.CharField(max_length=100, unique=True, null=True, blank=True)

    def __str__(self):
        return self.channel_name

class Client(models.Model):
    company_name = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    rfq_channel = models.CharField(max_length=100, blank=True, null=True)
    attention_name = models.CharField(max_length=255, blank=True, null=True)
    attention_phone = models.CharField(max_length=255, blank=True, null=True)
    attention_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name or 'Unnamed Client'

class RFQ(models.Model):
    company_name = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    rfq_channel = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    attention_name = models.CharField(max_length=255, blank=True, null=True)
    attention_phone = models.CharField(max_length=255, blank=True, null=True)
    attention_email = models.EmailField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    assign_to = models.ForeignKey(TeamMember, on_delete=models.SET_NULL, null=True, blank=True)
    
    current_status = models.CharField(
        max_length=20,
        choices=[('Processing', 'Processing'), ('Completed', 'Completed')],
        default='Processing',
        null=True,
        blank=True
    )
    rfq_no = models.CharField(max_length=100, unique=True, blank=True, null=True)
    series = models.ForeignKey(NumberSeries, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"RFQ {self.rfq_no or self.company_name or 'Unnamed Company'}"

class RFQItem(models.Model):
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=255, blank=True, null=True)
    quantity = models.PositiveIntegerField(null=True, blank=True)
    unit = models.CharField(max_length=100, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"{self.item_name} for RFQ {self.rfq.id}"