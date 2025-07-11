from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Quotation, PurchaseOrder
from .serializers import QuotationSerializer, PurchaseOrderSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings

class SendDueReminderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        quotation_id = request.data.get('quotation_id')
        assign_to_email = request.data.get('assign_to_email')
        assign_to_name = request.data.get('assign_to_name')
        company_name = request.data.get('company_name')
        quotation_no = request.data.get('quotation_no')
        due_date = request.data.get('due_date')

        if not all([quotation_id, assign_to_email, assign_to_name, company_name, quotation_no, due_date]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quotation = Quotation.objects.get(id=quotation_id)
            if quotation.current_status != "Approved" or quotation.purchase_order.exists():
                return Response({"error": "Quotation is not eligible for due reminder"}, status=status.HTTP_400_BAD_REQUEST)

            subject = f'Reminder: Follow Up on Quotation #{quotation_no}'
            message = (
                f'Hello {assign_to_name},\n\n'
                f'The quotation #{quotation_no} for {company_name} is past due (Due Date: {due_date}).\n'
                f'Please follow up on the purchase order.\n'
                f'Check the PrimeCRM dashboard for details.\n\n'
                f'Regards,\nPrimeCRM Team'
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=[assign_to_email],
                fail_silently=True,
            )

            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Alert: Quotation #{quotation_no} Past Due'
            admin_message = (
                f'Hello Admin,\n\n'
                f'Quotation #{quotation_no} for {company_name} is past due (Due Date: {due_date}).\n'
                f'Assigned to: {assign_to_name} ({assign_to_email}).\n'
                f'Please ensure follow-up actions are taken.\n'
                f'Regards,\nPrimeCRM Team'
            )
            send_mail(
                subject=admin_subject,
                message=admin_message,
                from_email=None,
                recipient_list=[admin_email],
                fail_silently=True,
            )

            return Response({"message": "Due reminder emails sent successfully"}, status=status.HTTP_200_OK)
        except Quotation.DoesNotExist:
            return Response({"error": "Quotation not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Failed to send due reminder emails: {str(e)}")
            return Response({"error": "Failed to send emails"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class QuotationViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer

    def get_queryset(self):
        queryset = Quotation.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(quotation_no__icontains=search)
        return queryset

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer