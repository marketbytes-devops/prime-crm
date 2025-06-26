import { useLocation } from "react-router-dom";
import CRMManager from "../../../components/CRMManager";

const AddRFQ = () => {
  const location = useLocation();
  const { rfqData, isEditing } = location.state || {};

  console.log("RFQ Data in AddRFQ:", rfqData);

  const singleFields = [
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
      name: "phone",
      label: "Phone",
      type: "text",
      required: true,
      placeholder: "Enter Phone Number",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "Enter Email",
    },
    {
      name: "rfq_channel",
      label: "RFQ Channel",
      type: "select",
      required: false,
      options: ["WhatsApp", "Email", "Number", "LinkedIn"],
      placeholder: "Select RFQ Channel",
    },
    {
      name: "attention_name",
      label: "Attention Name",
      type: "text",
      required: false,
      placeholder: "Enter Attention Name",
    },
    {
      name: "attention_phone",
      label: "Attention Phone",
      type: "text",
      required: false,
      placeholder: "Enter Attention Phone",
    },
    {
      name: "attention_email",
      label: "Attention Email",
      type: "email",
      required: true,
      placeholder: "Enter Attention Email",
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <CRMManager
        apiBaseUrl="/add-rfqs/"
        fields={[]}
        title={isEditing ? "Edit Company Details" : "Add Company Details"}
        singleFields={singleFields}
        initialData={rfqData}
        isEditing={isEditing || false}
        showRepeatableFields={false} 
      />
    </div>
  );
};

export default AddRFQ;