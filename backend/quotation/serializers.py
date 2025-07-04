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
    purchase_order = PurchaseOrderSerializer(many=True, read_only=True)

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

    def update(self, instance, validated_data):
        # Update scalar fields
        instance.rfq = validated_data.get('rfq', instance.rfq)
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
        instance.save()

        # Handle nested items
        items_data = validated_data.get('items', [])
        existing_items = {item.id: item for item in instance.items.all()}
        item_ids_to_keep = set()

        for item_data in items_data:
            item_id = item_data.get('id')
            if item_id:
                # Update existing item
                if item_id in existing_items:
                    item = existing_items[item_id]
                    item.item_name = item_data.get('item_name', item.item_name)
                    item.product_name = item_data.get('product_name', item.product_name)
                    item.quantity = item_data.get('quantity', item.quantity)
                    item.unit = item_data.get('unit', item.unit)
                    item.unit_price = item_data.get('unit_price', item.unit_price)
                    item.total_price = item.quantity * item.unit_price if item.quantity and item.unit_price else 0
                    item.save()
                    item_ids_to_keep.add(item_id)
                else:
                    # Create new item if ID is provided but doesn't exist (shouldn't happen with PUT)
                    QuotationItem.objects.create(quotation=instance, **item_data)
            else:
                # Create new item
                QuotationItem.objects.create(quotation=instance, **item_data)

        # Delete items that were not in the updated data
        for item_id, item in existing_items.items():
            if item_id not in item_ids_to_keep:
                item.delete()

        return instance