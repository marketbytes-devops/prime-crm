# quotation/serializers.py
from django.db import transaction
from django.db.models import Max
from rest_framework import serializers
from .models import Quotation, QuotationItem, PurchaseOrder, PurchaseOrderItem
from rfq.models import RFQ

class QuotationItemSerializer(serializers.ModelSerializer):
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = QuotationItem
        fields = ['id', 'item_name', 'product_name', 'quantity', 'unit', 'unit_price', 'total_price']

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price is not None:
            return obj.quantity * obj.unit_price
        return 0

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'item_name', 'product_name', 'quantity', 'unit', 'unit_price']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = ['id', 'quotation', 'client_po_number', 'order_type', 'po_file', 'created_at', 'items']

    def validate(self, data):
        items = data.get('items', [])
        for item in items:
            if not item.get('quantity') or item.get('quantity') < 1:
                raise serializers.ValidationError("Quantity is required and must be at least 1.")
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item_data)
        return purchase_order

class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True)
    rfq = serializers.PrimaryKeyRelatedField(queryset=RFQ.objects.all())
    purchase_order = PurchaseOrderSerializer(many=True, read_only=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_no', 'created_at', 'rfq', 'company_name', 'address', 'phone', 'email',
            'attention_name', 'attention_phone', 'attention_email', 'items', 'due_date',
            'current_status', 'when_approved', 'latest_remarks', 'purchase_order', 'next_followup_date'
        ]
        read_only_fields = ['quotation_no', 'created_at', 'when_approved']

    def validate(self, data):
        items = data.get('items', [])
        rfq = data.get('rfq')
        # Validate RFQ status
        if self.instance is None and rfq and rfq.current_status != "Completed":
            raise serializers.ValidationError("Cannot create quotation: RFQ must be in 'Completed' status.")
        # Prevent duplicate quotations for the same RFQ (optional)
        if self.instance is None and rfq and Quotation.objects.filter(rfq=rfq).exists():
            raise serializers.ValidationError("A quotation already exists for this RFQ.")
        for item in items:
            if item.get('unit_price') is None or item.get('unit_price') < 0:
                raise serializers.ValidationError({
                    'items': f"Unit price for {item.get('item_name') or item.get('product_name') or 'item'} must be non-negative."
                })
            if not item.get('quantity') or item.get('quantity') < 1:
                raise serializers.ValidationError({
                    'items': f"Quantity for {item.get('item_name') or item.get('product_name') or 'item'} must be at least 1."
                })
        return data

    def create(self, validated_data):
        with transaction.atomic():
            items_data = validated_data.pop('items', [])
            rfq = validated_data.get('rfq')

            # Generate unique quotation_no
            prefix = "QT-"
            latest_quotation = Quotation.objects.select_for_update().aggregate(Max('quotation_no'))['quotation_no__max']
            if latest_quotation:
                try:
                    last_number = int(latest_quotation.split('-')[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1

            quotation_no = f"{prefix}{new_number:07d}"
            validated_data['quotation_no'] = quotation_no

            # Create the quotation
            quotation = Quotation.objects.create(**validated_data)

            # Create associated items
            for item_data in items_data:
                QuotationItem.objects.create(quotation=quotation, **item_data)

            return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.company_name = validated_data.get('company_name', instance.company_name)
        instance.address = validated_data.get('address', instance.address)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.email = validated_data.get('email', instance.email)
        instance.attention_name = validated_data.get('attention_name', instance.attention_name)
        instance.attention_phone = validated_data.get('attention_phone', instance.attention_phone)
        instance.attention_email = validated_data.get('attention_email', instance.attention_email)
        instance.due_date = validated_data.get('due_date', instance.due_date)
        instance.current_status = validated_data.get('current_status', instance.current_status)
        instance.when_approved = validated_data.get('when_approved', instance.when_approved)
        instance.latest_remarks = validated_data.get('latest_remarks', instance.latest_remarks)
        instance.next_followup_date = validated_data.get('next_followup_date', instance.next_followup_date)
        instance.save()

        # Update items
        instance.items.all().delete()
        for item_data in items_data:
            QuotationItem.objects.create(quotation=instance, **item_data)

        return instance