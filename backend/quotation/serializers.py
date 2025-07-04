from rest_framework import serializers
from .models import Quotation, QuotationItem, PurchaseOrder, PurchaseOrderItem
from rfq.models import RFQ

class QuotationItemSerializer(serializers.ModelSerializer):
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = QuotationItem
        fields = ['id', 'item_name', 'product_name', 'quantity', 'unit', 'unit_price', 'total_price']

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'item_name', 'product_name', 'quantity', 'unit', 'unit_price']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)

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
    purchase_order = PurchaseOrderSerializer(many=True, read_only=True)  # Updated to many=True

    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_no', 'created_at', 'rfq', 'company_name', 'address', 'phone', 'email',
            'attention_name', 'attention_phone', 'attention_email', 'items', 'due_date',
            'current_status', 'when_approved', 'latest_remarks', 'purchase_order'
        ]
        read_only_fields = ['quotation_no', 'created_at', 'when_approved']

    def validate(self, data):
        items = data.get('items', [])
        for item in items:
            if not item.get('unit_price') or item.get('unit_price') < 0:
                raise serializers.ValidationError("Unit price is required and must be non-negative.")
            if not item.get('quantity') or item.get('quantity') < 1:
                raise serializers.ValidationError("Quantity is required and must be at least 1.")
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        rfq = validated_data.get('rfq')
        quotation_no = f"QT-{rfq.rfq_no}"
        quotation = Quotation.objects.create(quotation_no=quotation_no, **validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        return quotation