from rest_framework import serializers
from .models import Quotation, QuotationItem, PurchaseOrder, PurchaseOrderItem
from rfq.models import RFQ, RFQItem

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
        # Copy fields from RFQ
        validated_data['company_name'] = rfq.company_name
        validated_data['address'] = rfq.address
        validated_data['phone'] = rfq.phone
        validated_data['email'] = rfq.email
        validated_data['attention_name'] = rfq.attention_name
        validated_data['attention_phone'] = rfq.attention_phone
        validated_data['attention_email'] = rfq.attention_email
        validated_data['due_date'] = rfq.due_date
        # Generate quotation_no based on rfq_no
        quotation_no = f"QT-{rfq.rfq_no}"
        # Check for duplicate quotation_no
        if Quotation.objects.filter(quotation_no=quotation_no).exists():
            raise serializers.ValidationError({"quotation_no": f"Quotation number {quotation_no} already exists."})
        quotation = Quotation.objects.create(quotation_no=quotation_no, **validated_data)
        # Copy items from RFQ
        for item_data in items_data:
            # Find matching RFQ item to ensure unit_price and other fields are copied
            rfq_item = rfq.items.filter(
                item_name=item_data.get('item_name'),
                product_name=item_data.get('product_name')
            ).first()
            if rfq_item:
                item_data['unit_price'] = rfq_item.unit_price or item_data.get('unit_price')
                item_data['quantity'] = rfq_item.quantity or item_data.get('quantity')
                item_data['unit'] = rfq_item.unit or item_data.get('unit')
            QuotationItem.objects.create(
                quotation=quotation,
                item_name=item_data.get('item_name'),
                product_name=item_data.get('product_name'),
                quantity=item_data.get('quantity'),
                unit=item_data.get('unit'),
                unit_price=item_data.get('unit_price'),
                total_price=(item_data.get('quantity') or 0) * (item_data.get('unit_price') or 0)
            )
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        rfq = instance.rfq

        # Update Quotation fields
        instance.company_name = validated_data.get('company_name', instance.company_name)
        instance.address = validated_data.get('address', instance.address)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.email = validated_data.get('email', instance.email)
        instance.attention_name = validated_data.get('attention_name', instance.attention_name)
        instance.attention_phone = validated_data.get('attention_phone', instance.attention_phone)
        instance.attention_email = validated_data.get('attention_email', instance.attention_email)
        instance.due_date = validated_data.get('due_date', instance.due_date)
        instance.current_status = validated_data.get('current_status', instance.current_status)
        instance.latest_remarks = validated_data.get('latest_remarks', instance.latest_remarks)
        instance.save()

        # Update corresponding RFQ fields
        rfq.company_name = instance.company_name
        rfq.address = instance.address
        rfq.phone = instance.phone
        rfq.email = instance.email
        rfq.attention_name = instance.attention_name
        rfq.attention_phone = instance.attention_phone
        rfq.attention_email = instance.attention_email
        rfq.due_date = instance.due_date
        rfq.save()

        # Update Quotation items
        instance.items.all().delete()
        for item_data in items_data:
            QuotationItem.objects.create(
                quotation=instance,
                item_name=item_data.get('item_name'),
                product_name=item_data.get('product_name'),
                quantity=item_data.get('quantity'),
                unit=item_data.get('unit'),
                unit_price=item_data.get('unit_price'),
                total_price=(item_data.get('quantity') or 0) * (item_data.get('unit_price') or 0)
            )

        # Update RFQ items
        rfq.items.all().delete()
        for item_data in items_data:
            RFQItem.objects.create(
                rfq=rfq,
                item_name=item_data.get('item_name'),
                product_name=item_data.get('product_name'),
                quantity=item_data.get('quantity'),
                unit=item_data.get('unit'),
                unit_price=item_data.get('unit_price')
            )

        return instance