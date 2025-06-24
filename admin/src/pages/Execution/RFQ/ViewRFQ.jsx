import ViewCard from "../../../components/ViewCard";

const ViewRFQ = () => {
  const repeatableFields = [
    { name: "serial_number", label: "Sl No", type: "number" },
    { name: "item_description", label: "Item Description", type: "text" },
    { name: "quantity", label: "Quantity", type: "number" },
    { name: "unit", label: "Unit Of Measurement (UOM)", type: "text" },
    { name: "rfq_channel", label: "RFQ Channel", type: "select" },
  ];

  const singleFields = [
    { name: "quote_no", label: "Quote No", type: "text" },
    { name: "date", label: "Date", type: "date" },
    { name: "company_name", label: "Company Name", type: "text" },
    { name: "reference", label: "Reference", type: "text" },
    { name: "address", label: "Address", type: "text" },
    { name: "telephone", label: "Telephone", type: "text" },
    { name: "attention", label: "Attention/Contact Person", type: "text" },
    { name: "email_id", label: "Email ID", type: "email" },
    { name: "account_name", label: "Account Name", type: "text" },
    { name: "account_number", label: "Account Number", type: "text" },
    { name: "IBAN", label: "IBAN", type: "text" },
    { name: "bank_address", label: "Bank Address", type: "text" },
    { name: "company_address", label: "Company Address", type: "text" },
    { name: "po_number", label: "PO # (Purchase Order Number)", type: "text" },
    { name: "vat_no", label: "VAT No (Vendor VAT Number)", type: "text" },
    { name: "make", label: "Make (Manufacturer)", type: "text" },
    { name: "model", label: "Model (Model Number)", type: "text" },
    { name: "unit_price", label: "Unit Price (INR)", type: "number" },
    { name: "total_price", label: "Total Price (INR)", type: "number" },
    { name: "subtotal", label: "Subtotal", type: "number" },
    { name: "vat_percentage", label: "VAT@15% (VAT Percentage)", type: "number" },
    { name: "shipping", label: "Shipping", type: "number" },
    { name: "other", label: "Other", type: "number" },
    { name: "total_inr", label: "Total INR (Total Amount in INR)", type: "number" },
    { name: "comments", label: "Comments or Special Instructions", type: "textarea" },
    { name: "issue_date", label: "Issue Date", type: "date" },
    { name: "rev_no", label: "Rev No (Revision Number)", type: "text" },
    { name: "website", label: "Website", type: "text" },
  ];

  return (
    <div className="container mx-auto p-4">
      <ViewCard
        apiBaseUrl="/add-rfqs/"
        singleFields={singleFields}
        repeatableFields={repeatableFields}
        title="View RFQs"
        editPath="/pre-job/add-rfq" // Ensure this matches the AddRFQ route
      />
    </div>
  );
};

export default ViewRFQ;