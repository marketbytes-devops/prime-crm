from rest_framework import serializers
from django.db import transaction
from django.db.models import Max
from .models import WorkOrder, WorkOrderItem
from quotation.models import Quotation, PurchaseOrder
from team.models import TeamMember

class WorkOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrderItem
        fields = ['id', 'item_name', 'product_name', 'quantity', 'unit', 'unit_price']

class WorkOrderSerializer(serializers.ModelSerializer):
    items = WorkOrderItemSerializer(many=True, required=False)
    quotation = serializers.PrimaryKeyRelatedField(queryset=Quotation.objects.all())
    purchase_order = serializers.PrimaryKeyRelatedField(queryset=PurchaseOrder.objects.all(), required=False, allow_null=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=TeamMember.objects.all(), required=False, allow_null=True)

    class Meta:
        model = WorkOrder
        fields = [
            'id', 'work_order_no', 'quotation', 'purchase_order', 'assigned_to', 'created_at',
            'date_received', 'exp_date_completion', 'onsite_lab', 'range', 'serial_number',
            'site_location', 'remarks', 'current_status', 'work_order_type', 'items'
        ]
        read_only_fields = ['work_order_no', 'created_at']

    def validate(self, data):
        items = data.get('items', [])
        quotation = data.get('quotation')
        purchase_order = data.get('purchase_order', None)

        # Ensure quotation is provided
        if not quotation:
            raise serializers.ValidationError("Quotation is required.")

        # If purchase_order is provided, ensure it belongs to the quotation
        if purchase_order and purchase_order.quotation != quotation:
            raise serializers.ValidationError("Purchase order does not belong to the specified quotation.")

        # Validate items
        for item in items:
            if not item.get('quantity') or item.get('quantity') < 1:
                raise serializers.ValidationError({
                    'items': f"Quantity for {item.get('item_name') or item.get('product_name') or 'item'} must be at least 1."
                })
        return data

    def create(self, validated_data):
        with transaction.atomic():
            items_data = validated_data.pop('items', [])
            # Generate unique work_order_no
            prefix = "WO-"
            latest_work_order = WorkOrder.objects.select_for_update().aggregate(Max('work_order_no'))['work_order_no__max']
            if latest_work_order:
                try:
                    last_number = int(latest_work_order.split('-')[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            work_order_no = f"{prefix}{new_number:07d}"
            validated_data['work_order_no'] = work_order_no

            # Set assigned_to to quotation's RFQ assigned_to if not provided
            if not validated_data.get('assigned_to'):
                validated_data['assigned_to'] = validated_data['quotation'].rfq.assign_to

            # Create the work order
            work_order = WorkOrder.objects.create(**validated_data)

            # Create associated items
            for item_data in items_data:
                WorkOrderItem.objects.create(work_order=work_order, **item_data)

            return work_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.date_received = validated_data.get('date_received', instance.date_received)
        instance.exp_date_completion = validated_data.get('exp_date_completion', instance.exp_date_completion)
        instance.onsite_lab = validated_data.get('onsite_lab', instance.onsite_lab)
        instance.range = validated_data.get('range', instance.range)
        instance.serial_number = validated_data.get('serial_number', instance.serial_number)
        instance.site_location = validated_data.get('site_location', instance.site_location)
        instance.remarks = validated_data.get('remarks', instance.remarks)
        instance.current_status = validated_data.get('current_status', instance.current_status)
        instance.work_order_type = validated_data.get('work_order_type', instance.work_order_type)
        instance.assigned_to = validated_data.get('assigned_to', instance.assigned_to) or instance.quotation.rfq.assign_to
        instance.save()

        # Update items
        instance.items.all().delete()
        for item_data in items_data:
            WorkOrderItem.objects.create(work_order=instance, **item_data)

        return instance