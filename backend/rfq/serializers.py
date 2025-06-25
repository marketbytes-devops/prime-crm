from rest_framework import serializers
from .models import *

class RFQItemSerializer(serializers.ModelSerializer):
    serial_number = serializers.SerializerMethodField()

    class Meta:
        model = RFQItem
        fields = ['serial_number', 'item_description', 'quantity', 'unit', 'rfq_channel']

    def get_serial_number(self, obj):
        # Serial number is generated based on the order of items
        items = obj.rfq.items.all().order_by('id')
        return list(items).index(obj) + 1

class RFQSerializer(serializers.ModelSerializer):
    items = RFQItemSerializer(many=True)

    class Meta:
        model = RFQ
        fields = [
            'id', 'quote_no', 'date', 'due_date', 'assign_to', 'status', 'created_at',
            'company_name', 'reference', 'address', 'telephone', 'attention', 'email_id',
            'account_name', 'account_number', 'IBAN', 'bank_address', 'company_address',
            'po_number', 'vat_no', 'make', 'model', 'unit_price', 'total_price', 'subtotal',
            'vat_percentage', 'shipping', 'other', 'total_inr', 'comments', 'issue_date',
            'rev_no', 'website', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        rfq = RFQ.objects.create(**validated_data)
        for item_data in items_data:
            RFQItem.objects.create(rfq=rfq, **item_data)
        return rfq

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.quote_no = validated_data.get('quote_no', instance.quote_no)
        instance.date = validated_data.get('date', instance.date)
        instance.due_date = validated_data.get('due_date', instance.due_date)
        instance.assign_to = validated_data.get('assign_to', instance.assign_to)
        instance.status = validated_data.get('status', instance.status)
        instance.company_name = validated_data.get('company_name', instance.company_name)
        instance.reference = validated_data.get('reference', instance.reference)
        instance.address = validated_data.get('address', instance.address)
        instance.telephone = validated_data.get('telephone', instance.telephone)
        instance.attention = validated_data.get('attention', instance.attention)
        instance.email_id = validated_data.get('email_id', instance.email_id)
        instance.account_name = validated_data.get('account_name', instance.account_name)
        instance.account_number = validated_data.get('account_number', instance.account_number)
        instance.IBAN = validated_data.get('IBAN', instance.IBAN)
        instance.bank_address = validated_data.get('bank_address', instance.bank_address)
        instance.company_address = validated_data.get('company_address', instance.company_address)
        instance.po_number = validated_data.get('po_number', instance.po_number)
        instance.vat_no = validated_data.get('vat_no', instance.vat_no)
        instance.make = validated_data.get('make', instance.make)
        instance.model = validated_data.get('model', instance.model)
        instance.unit_price = validated_data.get('unit_price', instance.unit_price)
        instance.total_price = validated_data.get('total_price', instance.total_price)
        instance.subtotal = validated_data.get('subtotal', instance.subtotal)
        instance.vat_percentage = validated_data.get('vat_percentage', instance.vat_percentage)
        instance.shipping = validated_data.get('shipping', instance.shipping)
        instance.other = validated_data.get('other', instance.other)
        instance.total_inr = validated_data.get('total_inr', instance.total_inr)
        instance.comments = validated_data.get('comments', instance.comments)
        instance.issue_date = validated_data.get('issue_date', instance.issue_date)
        instance.rev_no = validated_data.get('rev_no', instance.rev_no)
        instance.website = validated_data.get('website', instance.website)
        instance.save()

        instance.items.all().delete()
        for item_data in items_data:
            RFQItem.objects.create(rfq=instance, **item_data)
        return instance

    def to_representation(self, instance):
        response = super().to_representation(instance)
        response['items'] = RFQItemSerializer(instance.items.all(), many=True).data
        return response