from django.db import models
from rfq.models import RFQ

class Quotation(models.Model):
    quotation_no = models.CharField(max_length=50, unique=True)
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    attention_name = models.CharField(max_length=255, null=True, blank=True)
    attention_phone = models.CharField(max_length=20, null=True, blank=True)
    attention_email = models.EmailField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    current_status = models.CharField(max_length=50, default="Pending")
    when_approved = models.DateField(null=True, blank=True)
    latest_remarks = models.TextField(null=True, blank=True)
    next_followup_date = models.DateField(null=True, blank=True)  

    def __str__(self):
        return self.quotation_no

class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, related_name="items", on_delete=models.CASCADE)
    item_name = models.CharField(max_length=255, null=True, blank=True)
    product_name = models.CharField(max_length=255, null=True, blank=True)
    quantity = models.IntegerField(null=True, blank=True)
    unit = models.CharField(max_length=50, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.item_name or self.product_name} - {self.quotation.quotation_no}"

class PurchaseOrder(models.Model):
    quotation = models.ForeignKey(Quotation, related_name="purchase_order", on_delete=models.CASCADE)
    client_po_number = models.CharField(max_length=50, blank=True)
    order_type = models.CharField(max_length=20, choices=[("full", "Full"), ("partial", "Partial")])
    po_file = models.FileField(upload_to="purchase_orders/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PO for {self.quotation.quotation_no} - {self.order_type}"

class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, related_name="items", on_delete=models.CASCADE)
    item_name = models.CharField(max_length=255, null=True, blank=True)
    product_name = models.CharField(max_length=255, null=True, blank=True)
    quantity = models.IntegerField()
    unit = models.CharField(max_length=50, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.item_name or self.product_name} - {self.purchase_order}"