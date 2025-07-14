from rest_framework import serializers
from django.core.mail import send_mail
from django.conf import settings
from .models import RFQ, RFQChannel, Client, RFQItem
from team.models import TeamMember
from series.models import NumberSeries
from datetime import date
from quotation.models import QuotationItem  

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
        fields = ['id', 'item_name', 'product_name', 'quantity', 'unit', 'unit_price']

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
    assign_to_email = serializers.CharField(source='assign_to.email', read_only=True)  

    class Meta:
        model = RFQ
        fields = [
            'id', 'created_at', 'company_name', 'reference', 'address', 'phone', 'email',
            'rfq_channel', 'attention_name', 'attention_phone', 'attention_email',
            'due_date', 'assign_to', 'assign_to_name', 'assign_to_designation', 'assign_to_email',
            'items', 'current_status', 'rfq_no', 'series'
        ]

    def validate(self, data):
        series = data.get('series')
        if not series and not self.instance:
            raise serializers.ValidationError("Series is required for creating an RFQ.")
        return data

    def validate_assign_to(self, value):
        if value and not value.email:
            raise serializers.ValidationError("Selected team member must have a valid email address.")
        return value

    def send_assignment_email(self, rfq, assign_to):
        email_sent = False
        if assign_to and assign_to.email:
            # Email to assigned person
            subject = f'You Have Been Assigned to RFQ #{rfq.rfq_no}'
            message = (
                f'Dear {assign_to.name},\n\n'
                f'You have been assigned to the following Request for Quotation (RFQ):\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.rfq_no}\n'
                f'🔹 Project: {rfq.company_name or "N/A"}\n'
                f'🔹 Due Date: {rfq.due_date or "Not specified"}\n'
                f'🔹 Status: {rfq.current_status or "Processing"}\n'
                f'------------------------------------------------------------\n'
                f'Please log in to your PrimeCRM dashboard to view the details and take the necessary actions.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
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
                print(f"Email sent successfully to {assign_to.email} for RFQ #{rfq.rfq_no}")
            except Exception as e:
                print(f"Failed to send email to {assign_to.email} for RFQ #{rfq.rfq_no}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'RFQ Assignment Notification – #{rfq.rfq_no}'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following RFQ has been assigned:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.rfq_no}\n'
                f'🔹 Assigned To: {assign_to.name} ({assign_to.email})\n'
                f'🔹 Team: {rfq.company_name or "N/A"}\n'
                f'🔹 Due Date: {rfq.due_date or "Not specified"}\n'
                f'🔹 Status: {rfq.current_status or "Processing"}\n'
                f'------------------------------------------------------------\n'
                f'Please take any necessary actions or follow up as required.\n\n'
                f'Best regards,\n'
                f'**PrimeCRM Team**\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
            )
            try:
                send_mail(
                    subject=admin_subject,
                    message=admin_message,
                    from_email=None,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
                print(f"Email sent successfully to {admin_email} for RFQ #{rfq.rfq_no}")
            except Exception as e:
                print(f"Failed to send email to {admin_email} for RFQ #{rfq.rfq_no}: {str(e)}")
                email_sent = False

        return email_sent

    def send_due_date_reminder(self, rfq, assign_to):
        email_sent = False
        if assign_to and assign_to.email and rfq.due_date == date.today() and rfq.current_status != 'Completed':
            # Email to assigned person
            subject = f'Reminder: RFQ #{rfq.rfq_no} Due Today'
            message = (
                f'Dear {assign_to.name},\n\n'
                f'Your due date for the following Request for Quotation (RFQ) is ending today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.rfq_no}\n'
                f'🔹 **Project: {rfq.company_name or "N/A"}\n'
                f'🔹 Due Date: {rfq.due_date}\n'
                f'🔹 Status: {rfq.current_status or "Processing"}\n'
                f'------------------------------------------------------------\n'
                f'Please ensure all necessary actions are completed promptly. Log in to your PrimeCRM dashboard for details.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
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
                print(f"Reminder email sent successfully to {assign_to.email} for RFQ #{rfq.rfq_no}")
            except Exception as e:
                print(f"Failed to send reminder email to {assign_to.email} for RFQ #{rfq.rfq_no}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'RFQ #{rfq.rfq_no} Due Today Notification'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following RFQ is due today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.rfq_no}\n'
                f'🔹 Assigned To: {assign_to.name} ({assign_to.email})\n'
                f'🔹 Team: {rfq.company_name or "N/A"}\n'
                f'🔹 Due Date: {rfq.due_date}\n'
                f'🔹 Status: {rfq.current_status or "Processing"}\n'
                f'------------------------------------------------------------\n'
                f'Please take any necessary actions or follow up as required.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
            )
            try:
                send_mail(
                    subject=admin_subject,
                    message=admin_message,
                    from_email=None,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
                print(f"Reminder email sent successfully to {admin_email} for RFQ #{rfq.rfq_no}")
            except Exception as e:
                print(f"Failed to send reminder email to {admin_email} for RFQ #{rfq.rfq_no}: {str(e)}")
                email_sent = False

        return email_sent

    def send_past_due_alert(self, rfq, assign_to):
        email_sent = False
        if assign_to and assign_to.email and rfq.due_date < date.today() and rfq.current_status != 'Completed':
            # Email to assigned person
            subject = f'Alert: RFQ #{rfq.rfq_no} Past Due'
            message = (
                f'Dear {assign_to.name},\n\n'
                f'The due date for the following Request for Quotation (RFQ) has passed:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.rfq_no}\n'
                f'🔹 Project: {rfq.company_name or "N/A"}\n'
                f'🔹 Due Date: {rfq.due_date}\n'
                f'🔹 Status: {rfq.current_status or "Processing"}\n'
                f'------------------------------------------------------------\n'
                f'Please take immediate action to address this. Log in to your PrimeCRM dashboard for details.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
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
                print(f"Past due alert email sent successfully to {assign_to.email} for RFQ #{rfq.rfq_no}")
            except Exception as e:
                print(f"Failed to send past due alert email to {assign_to.email} for RFQ #{rfq.rfq_no}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'RFQ #{rfq.rfq_no} Past Due Notification'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following RFQ is past due:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.rfq_no}\n'
                f'🔹 Assigned To: {assign_to.name} ({assign_to.email})\n'
                f'🔹 Team: {rfq.company_name or "N/A"}\n'
                f'🔹 Due Date: {rfq.due_date}\n'
                f'🔹 Status: {rfq.current_status or "Processing"}\n'
                f'------------------------------------------------------------\n'
                f'Please take any necessary actions or follow up as required.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
            )
            try:
                send_mail(
                    subject=admin_subject,
                    message=admin_message,
                    from_email=None,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
                print(f"Past due alert email sent successfully to {admin_email} for RFQ #{rfq.rfq_no}")
            except Exception as e:
                print(f"Failed to send past due alert email to {admin_email} for RFQ #{rfq.rfq_no}: {str(e)}")
                email_sent = False

        return email_sent

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        assign_to = validated_data.pop('assign_to', None)
        series = validated_data.pop('series', None)
        rfq_no = series.get_next_sequence() if series else None
        rfq = RFQ.objects.create(rfq_no=rfq_no, series=series, assign_to=assign_to, **validated_data)
        for item_data in items_data:
            RFQItem.objects.create(rfq=rfq, **item_data)
        email_sent = self.send_assignment_email(rfq, assign_to) if assign_to else False
        rfq.email_sent = email_sent
        rfq.save()
        return rfq

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        assign_to = validated_data.get('assign_to')
        series = validated_data.get('series', instance.series)

        if not instance.rfq_no and series:
            instance.rfq_no = series.get_next_sequence()

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
        instance.current_status = validated_data.get('current_status', instance.current_status)
        instance.series = series
        instance.save()

        instance.items.all().delete()
        for item_data in items_data:
            RFQItem.objects.create(rfq=instance, **item_data)

        if hasattr(instance, 'quotation'):
            quotation = instance.quotation
            quotation.company_name = instance.company_name
            quotation.address = instance.address
            quotation.phone = instance.phone
            quotation.email = instance.email
            quotation.attention_name = instance.attention_name
            quotation.attention_phone = instance.attention_phone
            quotation.attention_email = instance.attention_email
            quotation.due_date = instance.due_date
            quotation.save()

            quotation.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(
                    quotation=quotation,
                    item_name=item_data.get('item_name'),
                    product_name=item_data.get('product_name'),
                    quantity=item_data.get('quantity'),
                    unit=item_data.get('unit'),
                    unit_price=item_data.get('unit_price'),
                    total_price=(item_data.get('quantity') or 0) * (item_data.get('unit_price') or 0)
                )

        email_sent = False
        if assign_to and (not instance.assign_to or instance.assign_to.id != assign_to.id):
            email_sent = self.send_assignment_email(instance, assign_to)

        instance.email_sent = email_sent
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['email_sent'] = getattr(instance, 'email_sent', False)
        return representation