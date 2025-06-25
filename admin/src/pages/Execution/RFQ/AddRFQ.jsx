import { useLocation } from "react-router-dom";
import CRMManager from "../../../components/CRMManager";

const AddRFQ = () => {
  const location = useLocation();
  const { rfqData, isEditing } = location.state || {};

  // Debug log to check received data
  console.log("RFQ Data in AddRFQ:", rfqData);

  const repeatableFields = [
    {
      name: "serial_number",
      label: "Sl No",
      type: "number",
      required: true,
      placeholder: "Enter RFQ Sl No",
    },
    {
      name: "item_description",
      label: "Item Description",
      type: "text",
      required: true,
      placeholder: "Enter item description",
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      required: true,
      min: 1,
      placeholder: "Enter quantity",
    },
    {
      name: "unit",
      label: "Unit Of Measurement (UOM)",
      type: "text",
      required: true,
      placeholder: "Enter unit",
    },
    {
      name: "rfq_channel",
      label: "RFQ Channel",
      type: "select",
      required: true,
      options: ["WhatsApp", "Email", "Number", "LinkedIn"],
      placeholder: "Select RFQ Channel",
    },
  ];

  const singleFields = [
    {
      name: "quote_no",
      label: "Quote No",
      type: "text",
      required: true,
      placeholder: "Enter Quote No",
    },
    {
      name: "date",
      label: "Date",
      type: "date",
      required: true,
      placeholder: "Select Date",
    },
    {
      name: "company_name",
      label: "Company Name",
      type: "text",
      required: true,
      placeholder: "Enter Company Name",
    },
    {
      name: "reference",
      label: "Reference",
      type: "text",
      required: false,
      placeholder: "Enter Reference",
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      required: true,
      placeholder: "Enter Address",
    },
    {
      name: "telephone",
      label: "Telephone",
      type: "text",
      required: true,
      placeholder: "Enter Telephone",
    },
    {
      name: "attention",
      label: "Attention/Contact Person",
      type: "text",
      required: false,
      placeholder: "Enter Attention/Contact Person",
    },
    {
      name: "email_id",
      label: "Email ID",
      type: "email",
      required: true,
      placeholder: "Enter Email ID",
    },
    {
      name: "account_name",
      label: "Account Name",
      type: "text",
      required: true,
      placeholder: "Enter Account Name",
    },
    {
      name: "account_number",
      label: "Account Number",
      type: "text",
      required: true,
      placeholder: "Enter Account Number",
    },
    {
      name: "IBAN",
      label: "IBAN",
      type: "text",
      required: true,
      placeholder: "Enter IBAN",
    },
    {
      name: "bank_address",
      label: "Bank Address",
      type: "text",
      required: true,
      placeholder: "Enter Bank Address",
    },
    {
      name: "company_address",
      label: "Company Address",
      type: "text",
      required: true,
      placeholder: "Enter Company Address",
    },
    {
      name: "po_number",
      label: "PO # (Purchase Order Number)",
      type: "text",
      required: true,
      placeholder: "Enter Purchase Order Number",
    },
    {
      name: "vat_no",
      label: "VAT No (Vendor VAT Number)",
      type: "text",
      required: true,
      placeholder: "Enter VAT Number",
    },
    {
      name: "make",
      label: "Make (Manufacturer)",
      type: "text",
      required: true,
      placeholder: "Enter Manufacturer",
    },
    {
      name: "model",
      label: "Model (Model Number)",
      type: "text",
      required: true,
      placeholder: "Enter Model Number",
    },
    {
      name: "unit_price",
      label: "Unit Price (INR)",
      type: "number",
      required: true,
      min: 0,
      placeholder: "Enter Unit Price in INR",
    },
    {
      name: "total_price",
      label: "Total Price (INR)",
      type: "number",
      required: true,
      min: 0,
      placeholder: "Enter Total Price in INR",
    },
    {
      name: "subtotal",
      label: "Subtotal",
      type: "number",
      required: true,
      min: 0,
      placeholder: "Enter Subtotal",
    },
    {
      name: "vat_percentage",
      label: "VAT@15% (VAT Percentage)",
      type: "number",
      required: true,
      min: 0,
      placeholder: "Enter VAT Percentage",
    },
    {
      name: "shipping",
      label: "Shipping",
      type: "number",
      required: false,
      min: 0,
      placeholder: "Enter Shipping Cost",
    },
    {
      name: "other",
      label: "Other",
      type: "number",
      required: false,
      min: 0,
      placeholder: "Enter Other Costs",
    },
    {
      name: "total_inr",
      label: "Total INR (Total Amount in INR)",
      type: "number",
      required: true,
      min: 0,
      placeholder: "Enter Total Amount in INR",
    },
    {
      name: "comments",
      label: "Comments or Special Instructions",
      type: "textarea",
      required: false,
      placeholder: "Enter Comments or Special Instructions",
    },
    {
      name: "issue_date",
      label: "Issue Date",
      type: "date",
      required: true,
      placeholder: "Select Issue Date",
    },
    {
      name: "rev_no",
      label: "Rev No (Revision Number)",
      type: "text",
      required: true,
      placeholder: "Enter Revision Number",
    },
    {
      name: "website",
      label: "Website",
      type: "text",
      required: false,
      placeholder: "Enter Website URL",
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <CRMManager
        apiBaseUrl="/add-rfqs/"
        fields={repeatableFields}
        title={isEditing ? "Edit RFQ" : "Add RFQ"}
        singleFields={singleFields}
        initialData={rfqData} // Pass rfqData directly
        isEditing={isEditing || false}
      />
    </div>
  );
};

export default AddRFQ;