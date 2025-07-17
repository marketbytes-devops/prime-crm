from django.db import models
from quotation.models import Quotation, PurchaseOrder
from team.models import TeamMember

class WorkOrder(models.Model):
    work_order_no = models.CharField(max_length=50, unique=True)
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='work_orders')
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, null=True, blank=True, related_name='work_orders')
    assigned_to = models.ForeignKey(TeamMember, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    date_received = models.DateField()
    exp_date_completion = models.DateField(null=True, blank=True)
    onsite_lab = models.CharField(max_length=20, choices=[('Onsite', 'Onsite'), ('Lab', 'Lab')], default='Onsite')
    range = models.CharField(max_length=100, null=True, blank=True)
    serial_number = models.CharField(max_length=100, null=True, blank=True)
    site_location = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    current_status = models.CharField(max_length=50, default='Collected')
    work_order_type = models.CharField(max_length=20, choices=[('single', 'Single WO'), ('split', 'Split WO')], default='single')

    def __str__(self):
        return f"WO {self.work_order_no} for Quotation {self.quotation.quotation_no}"

class WorkOrderItem(models.Model):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=255, null=True, blank=True)
    product_name = models.CharField(max_length=255, null=True, blank=True)
    quantity = models.IntegerField()
    unit = models.CharField(max_length=50, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.item_name or self.product_name} - {self.work_order.work_order_no}"