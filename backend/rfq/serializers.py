from rest_framework import serializers
from django.core.mail import send_mail
from django.conf import settings  
from .models import RFQ, RFQChannel, Client, RFQItem
from team.models import TeamMember

class RFQChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQChannel
        fields = ['id', 'channel_name']

class ClientSerializer(serializers.ModelSerializer):
    rfq_channel = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = Client
        fields = [
            'id', 'company_name', 'reference', 'address', 'phone', 'email',
            'rfq_channel', 'attention_name', 'attention_phone', 'attention_email',
            'created_at'
        ]

class RFQItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQItem
        fields = ['id', 'item_name', 'product_name', 'quantity', 'unit']

class RFQSerializer(serializers.ModelSerializer):
    rfq_channel = serializers.CharField(allow_null=True, required=False)
    items = RFQItemSerializer(many=True, required=False)
    assign_to = serializers.PrimaryKeyRelatedField(
        queryset=TeamMember.objects.all(),
        allow_null=True,
        required=False
    )
    assign_to_name = serializers.CharField(source='assign_to.name', read_only=True)
    assign_to_designation = serializers.CharField(source='assign_to.designation', read_only=True)

    class Meta:
        model = RFQ
        fields = [
            'id', 'created_at',
            'company_name', 'reference', 'address', 'phone', 'email',
            'rfq_channel', 'attention_name', 'attention_phone', 'attention_email',
            'due_date', 'assign_to', 'assign_to_name', 'assign_to_designation', 'items'
        ]

    def validate_assign_to(self, value):  
        if value and not value.email:
            raise serializers.ValidationError("Selected team member must have a valid email address.")
        return value

    def send_assignment_email(self, rfq, assign_to):
        email_sent = False
        if assign_to and assign_to.email:
            subject = f'You have been assigned to RFQ #{rfq.id}'
            message = (
                f'Hello {assign_to.name},\n\n'
                f'You have been assigned to RFQ #{rfq.id} for {rfq.company_name}.\n'
                f'Due Date: {rfq.due_date or "Not specified"}\n'
                f'Please check the PrimeCRM dashboard for details.\n\n'
                f'Regards,\nPrimeCRM Team'
            )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=None,
                    recipient_list=[assign_to.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Email sent successfully to {assign_to.email} for RFQ #{rfq.id}")
            except Exception as e:
                print(f"Failed to send email to {assign_to.email} for RFQ #{rfq.id}: {str(e)}")

            admin_email = settings.ADMIN_EMAIL  
            admin_subject = f'RFQ #{rfq.id} Assignment Notification'
            admin_message = (
                f'Hello Admin,\n\n'
                f'{assign_to.name} (email: {assign_to.email}) is assigned to RFQ #{rfq.id} for {rfq.company_name}.\n'
                f'Due Date: {rfq.due_date or "Not specified"}\n'
                f'Regards,\nPrimeCRM Team'
            )
            try:
                send_mail(
                    subject=admin_subject,
                    message=admin_message,
                    from_email=None,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
                print(f"Email sent successfully to {admin_email} for RFQ #{rfq.id}")
            except Exception as e:
                print(f"Failed to send email to {admin_email} for RFQ #{rfq.id}: {str(e)}")
                email_sent = False  
                
        return email_sent

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        assign_to = validated_data.get('assign_to')
        rfq = RFQ.objects.create(**validated_data)
        for item_data in items_data:
            RFQItem.objects.create(rfq=rfq, **item_data)
        email_sent = self.send_assignment_email(rfq, assign_to) if assign_to else False
        rfq.email_sent = email_sent
        return rfq

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        assign_to = validated_data.get('assign_to')
        instance.company_name = validated_data.get('company_name', instance.company_name)
        instance.reference = validated_data.get('reference', instance.reference)
        instance.address = validated_data.get('address', instance.address)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.email = validated_data.get('email', instance.email)
        instance.rfq_channel = validated_data.get('rfq_channel', instance.rfq_channel)
        instance.attention_name = validated_data.get('attention_name', instance.attention_name)
        instance.attention_phone = validated_data.get('attention_phone', instance.attention_phone)
        instance.attention_email = validated_data.get('attention_email', instance.attention_email)
        instance.due_date = validated_data.get('due_date', instance.due_date)
        instance.assign_to = assign_to
        instance.save()

        instance.items.all().delete()
        for item_data in items_data:
            RFQItem.objects.create(rfq=instance, **item_data)
        email_sent = False
        if assign_to and (not instance.assign_to or instance.assign_to.id != assign_to.id):
            email_sent = self.send_assignment_email(instance, assign_to)
        instance.email_sent = email_sent
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['email_sent'] = getattr(instance, 'email_sent', False)
        return representation