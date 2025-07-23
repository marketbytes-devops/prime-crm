import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import ClientSelectionModal from "../../../components/ClientSelectionModal";
import CRMManager from "../../../components/CRMManager";

const AddRFQ = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rfqData = {}, isEditing = false } = location.state || {};
  const [showClientModal, setShowClientModal] = useState(!rfqData.company_name && !isEditing);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [formData, setFormData] = useState({
    company_name: rfqData.company_name || "",
    company_address: rfqData.address || "",
    company_phone: rfqData.phone || "",
    company_email: rfqData.email || "",
    rfq_channel: rfqData.rfq_channel || "",
    attention_name: rfqData.attention_name || "",
    attention_phone: rfqData.attention_phone || "",
    attention_email: rfqData.attention_email || "",
    due_date: rfqData.due_date || "",
    assign_to: rfqData.assign_to ? String(rfqData.assign_to) : "",
    series: 1,
    items: rfqData.items?.map((item, index) => ({
      id: Date.now() + index,
      item_name: item.item_name || "",
      quantity: item.quantity || "",
      unit: item.unit || "",
    })) || [{ id: Date.now(), item_name: "", quantity: "", unit: "" }],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rfqResponse, itemsResponse, unitsResponse, teamResponse] = await Promise.all([
          apiClient.get("/rfq-channels/"),
          apiClient.get("/items/"),
          apiClient.get("/units/"),
          apiClient.get("/teams/"),
        ]);

        setFormData((prev) => ({
          ...prev,
          rfq_channel_options: rfqResponse.data.map((channel) => ({
            value: channel.channel_name,
            label: channel.channel_name,
          })),
          item_options: itemsResponse.data.map((item) => ({
            value: item.name,
            label: item.name,
          })),
          unit_options: unitsResponse.data.map((unit) => ({
            value: unit.name,
            label: unit.name,
          })),
          assign_to_options: teamResponse.data.map((member) => ({
            value: String(member.id),
            label: `${member.name} (${member.designation})`,
          })),
        }));
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClientSelect = (type) => {
    setShowClientModal(false);
    if (type === "existing") navigate("/pre-job/existing-client");
  };

  const handleInputChange = (e, entryId) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === entryId ? { ...item, [name]: value } : item
      ),
    }));
  };

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveItem = (entryId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== entryId),
    }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), item_name: "", quantity: "", unit: "" }],
    }));
  };

  const renderField = (field) => {
    const value = formData[field.name] || "";
    const options = field.options || [];

    if (field.type === "select") {
      return (
        <div key={field.name} className="mb-4">
          <label htmlFor={field.name} className="block text-xs font-medium text-black mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={handleSingleInputChange}
            className="w-full text-sm p-2 border border-gray-400 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          >
            <option value="" disabled>
              {field.placeholder}
            </option>
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div key={field.name} className="mb-4">
        <label htmlFor={field.name} className="block text-xs font-medium text-black mb-1">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={field.name}
          type={field.type}
          name={field.name}
          value={value}
          onChange={handleSingleInputChange}
          placeholder={field.placeholder}
          min={field.min}
          step={field.type === "number" ? "1" : undefined}
          className="w-full text-sm p-2 border border-gray-400 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  const companyFields = [
    { name: "company_name", label: "Company Name", type: "text", required: true, placeholder: "Enter Company Name" },
    { name: "company_address", label: "Company Address", type: "text", required: true, placeholder: "Enter Company Address" },
    { name: "company_phone", label: "Company Phone", type: "text", required: true, placeholder: "Enter Company Phone" },
    { name: "company_email", label: "Company Email", type: "email", required: true, placeholder: "Enter Company Email" },
    { name: "rfq_channel", label: "RFQ Channel", type: "select", required: false, placeholder: "Select RFQ Channel", options: formData.rfq_channel_options || [] },
    { name: "attention_name", label: "Name", type: "text", required: false, placeholder: "Enter Name" },
    { name: "attention_phone", label: "Phone", type: "text", required: false, placeholder: "Enter Phone" },
    { name: "attention_email", label: "Email", type: "email", required: false, placeholder: "Enter Email" },
  ];

  const stepTwoFields = [
    {
      name: "assign_to",
      label: "Assigned Sales Person",
      type: "select",
      required: true,
      placeholder: "Select Sales Person",
      options: formData.assign_to_options || [],
    },
    { name: "due_date", label: "Due Date for Quotation", type: "date", required: true, placeholder: "Select Due Date" },
  ];

  const repeatableFields = [
    {
      name: "item_name",
      label: "Item",
      type: "select",
      required: true,
      placeholder: "Select Item",
      options: formData.item_options || [],
    },
    { name: "quantity", label: "Quantity", type: "number", required: true, placeholder: "Enter Quantity", min: 1, step: 1 },
    { name: "unit", label: "Unit", type: "select", required: true, placeholder: "Select Unit", options: formData.unit_options || [] },
  ];

  const validateForm = () => {
    for (const field of [...companyFields, ...stepTwoFields]) {
      if (field.required && !formData[field.name]) {
        return `${field.label} is required`;
      }
    }
    for (const item of formData.items) {
      for (const field of repeatableFields) {
        if (field.required && !item[field.name]) {
          return `${field.label} is required for all items`;
        }
        if (field.type === "number" && item[field.name]) {
          const num = parseFloat(item[field.name]);
          if (isNaN(num)) {
            return `${field.label} must be a valid number`;
          }
          if (num < field.min) {
            return `${field.label} must be at least ${field.min}`;
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); 
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      setIsSubmitting(false); 
      return;
    }

    const payload = {
      company_name: formData.company_name,
      address: formData.company_address,
      phone: formData.company_phone,
      email: formData.company_email,
      rfq_channel: formData.rfq_channel || null,
      attention_name: formData.attention_name || null,
      attention_phone: formData.attention_phone || null,
      attention_email: formData.attention_email || null,
      due_date: formData.due_date,
      assign_to: formData.assign_to ? parseInt(formData.assign_to) : null,
      series: formData.series,
      items: formData.items
        .filter((item) => item.item_name || item.quantity || item.unit)
        .map((item) => ({
          item_name: item.item_name || null,
          quantity: parseFloat(item.quantity) || null,
          unit: item.unit || null,
        })),
    };

    try {
      if (isEditing) {
        await apiClient.put(`/add-rfqs/${rfqData.id}/`, payload);
        toast.success("RFQ updated successfully!");
      } else {
        await apiClient.post("/add-rfqs/", payload);
        toast.success("RFQ created successfully!");
      }
      navigate("/pre-job/view-rfq");
    } catch (error) {
      console.error("Error submitting RFQ:", error.response?.data || error.message);
      toast.error("Failed to save RFQ. Please check the required fields.");
    } finally {
      setIsSubmitting(false); 
    }
  };

  if (loading) return <p className="text-black text-center">Loading data...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      {showClientModal && (
        <ClientSelectionModal onClose={() => setShowClientModal(false)} onSelect={handleClientSelect} />
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button onClick={() => navigate("/pre-job/view-rfq")} className="text-black hover:text-indigo-500 mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-black">{isEditing ? "Edit RFQ" : "Add RFQ"}</h1>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex-1">
            <div className={`h-2 rounded-full ${currentStep >= 1 ? "bg-indigo-500" : "bg-gray-300"}`}></div>
            <p className="text-xs text-center mt-1 text-black">Step 1: Company Details</p>
          </div>
          <div className="flex-1">
            <div className={`h-2 rounded-full ${currentStep === 2 ? "bg-indigo-500" : "bg-gray-300"}`}></div>
            <p className="text-xs text-center mt-1 text-black">Step 2: RFQ Details</p>
          </div>
        </div>
      </div>
      {currentStep === 1 ? (
        <div className="mx-auto">
          <form className="mb-4">
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="text-md font-semibold text-black mb-6">Company Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {companyFields.slice(0, 4).map((field) => renderField(field))}
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="text-md font-semibold text-black mb-6">RFQ Channel</h3>
                <div className="grid grid-cols-1 md:grid-cols-1">
                  {companyFields.slice(4, 5).map((field) => renderField(field))}
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="text-md font-semibold text-black mb-6">Point of Contact</h3>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    {companyFields.slice(5, 7).map((field) => renderField(field))}
                  </div>
                  <div className="grid grid-cols-1">
                    {companyFields.slice(7).map((field) => renderField(field))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 mt-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center"
                >
                  Next <ArrowRight size="16" className="ml-1" />
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center mb-4"
          >
            <ArrowLeft size="16" className="mr-1" /> Back
          </button>
          <CRMManager
            apiBaseUrl="/add-rfqs/"
            fields={repeatableFields}
            singleFields={stepTwoFields}
            title="RFQ Details"
            initialData={rfqData}
            isEditing={isEditing}
            showRepeatableFields={true}
            currentStep={2}
            totalSteps={2}
            formData={formData}
            onInputChange={handleInputChange}
            onSingleInputChange={handleSingleInputChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting} 
          />
        </>
      )}
    </div>
  );
};

export default AddRFQ;