from django.db import models

class RFQ(models.Model):
    quote_no = models.CharField(max_length=100)
    date = models.DateField()
    due_date = models.DateField()
    assign_to = models.CharField(max_length=50, choices=[
    ('Admin', 'Admin'),
    ('SuperAdmin', 'SuperAdmin'),
    ('User', 'User')
], default='User')


    status = models.CharField(max_length=50, choices=[
        ('Processing', 'Processing'),
        ('Completed', 'Completed')
    ], default='Processing')
    company_name = models.CharField(max_length=255)
    reference = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField()
    telephone = models.CharField(max_length=20)
    attention = models.CharField(max_length=255, blank=True, null=True)
    email_id = models.EmailField()
    account_name = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=50)
    IBAN = models.CharField(max_length=34, blank=True, null=True)
    bank_address = models.TextField()
    company_address = models.TextField()
    po_number = models.CharField(max_length=100)
    vat_no = models.CharField(max_length=50)
    make = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    vat_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    other = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    total_inr = models.DecimalField(max_digits=10, decimal_places=2)
    comments = models.TextField(blank=True, null=True)
    issue_date = models.DateField()
    rev_no = models.CharField(max_length=20)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RFQ {self.quote_no} - {self.company_name}"

class RFQItem(models.Model):
    rfq = models.ForeignKey(RFQ, related_name='items', on_delete=models.CASCADE)
    item_description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=50)
    rfq_channel = models.CharField(max_length=50, choices=[(ch, ch) for ch in ["WhatsApp", "Email", "Number", "LinkedIn"]])

    def __str__(self):
        return f"Item - {self.item_description}"