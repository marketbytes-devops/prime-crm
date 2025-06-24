from django.contrib import admin
from .models import RFQ, RFQItem

class RFQItemInline(admin.TabularInline):
    model = RFQItem
    extra = 1
    fields = ('serial_number', 'item_description', 'quantity', 'unit', 'rfq_channel')
    readonly_fields = ()

class RFQAdmin(admin.ModelAdmin):
    list_display = ('quote_no', 'company_name', 'date', 'po_number', 'total_price', 'created_at')
    search_fields = ('quote_no', 'company_name', 'po_number', 'make', 'model')
    list_filter = ('date', 'created_at', 'company_name')
    inlines = [RFQItemInline]
    readonly_fields = ('created_at',)

admin.site.register(RFQ, RFQAdmin)
admin.site.register(RFQItem)
