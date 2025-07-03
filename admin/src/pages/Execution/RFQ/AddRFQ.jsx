import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import ClientSelectionModal from "../../../components/ClientSelectionModal";

const AddRFQ = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rfqData = {}, isEditing = false } = location.state || {};
  const [showClientModal, setShowClientModal] = useState(!rfqData.company_name && !isEditing);
  const [rfqChannels, setRfqChannels] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [includeItems, setIncludeItems] = useState(rfqData.items?.some((item) => item.item_name) || false);
  const [includeProducts, setIncludeProducts] = useState(rfqData.items?.some((item) => item.product_name) || false);
  const [formData, setFormData] = useState({
    company_name: rfqData.company_name || "",
    reference: rfqData.reference || "",
    address: rfqData.address || "",
    phone: rfqData.phone || "",
    email: rfqData.email || "",
    rfq_channel: rfqData.rfq_channel || "",
    attention_name: rfqData.attention_name || "",
    attention_phone: rfqData.attention_phone || "",
    attention_email: rfqData.attention_email || "",
    due_date: rfqData.due_date || "",
    assign_to: rfqData.assign_to ? String(rfqData.assign_to) : "",
    items: rfqData.items?.map((item, index) => ({
      id: Date.now() + index,
      item_name: item.item_name || "",
      product_name: item.product_name || "",
      quantity: item.quantity || "",
      unit: item.unit || "",
    })) || [{ id: Date.now(), item_name: "", product_name: "", quantity: "", unit: "" }],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rfqResponse, itemsResponse, productsResponse, unitsResponse, teamResponse] = await Promise.all([
          apiClient.get("/rfq-channels/"),
          apiClient.get("/items/"),
          apiClient.get("/products/"),
          apiClient.get("/units/"),
          apiClient.get("/teams/"),
        ]);

        setRfqChannels(rfqResponse.data.map((channel) => channel.channel_name));
        setItems(itemsResponse.data.map((item) => item.name));
        setProducts(productsResponse.data.map((product) => product.name));
        setUnits(unitsResponse.data.map((unit) => unit.name));
        setTeamMembers(
          teamResponse.data.map((member) => ({
            value: member.id,
            label: `${member.name} (${member.designation})`,
          }))
        );
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

  const addFormBlock = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), item_name: "", product_name: "", quantity: "", unit: "" }],
    }));
  };

  const removeFormBlock = (entryId) => {
    if (formData.items.length === 1) {
      toast.error("At least one entry is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== entryId),
    }));
  };

  const validateSingleFields = () => {
    const requiredFields = ["company_name", "address", "phone", "email"];
    for (const field of requiredFields) {
      if (!formData[field]) return `${field.replace("_", " ")} is required`;
    }
    return null;
  };

  const validateEntry = (entry) => {
    if (includeItems && !entry.item_name) return "Item is required";
    if (includeProducts && !entry.product_name) return "Product is required";
    if (!entry.quantity) return "Quantity is required";
    if (parseFloat(entry.quantity) < 1) return "Quantity must be at least 1";
    if (!entry.unit) return "Unit is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const singleValidationError = validateSingleFields();
    if (singleValidationError) {
      toast.error(singleValidationError);
      setIsSubmitting(false);
      return;
    }

    for (const entry of formData.items) {
      const validationError = validateEntry(entry);
      if (validationError) {
        toast.error(validationError);
        setIsSubmitting(false);
        return;
      }
    }

    if (formData.items.length === 0) {
      toast.error("Please add at least one item or product.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      ...formData,
      assign_to: formData.assign_to ? parseInt(formData.assign_to) : null,
      items: formData.items.map((item) => ({
        item_name: item.item_name || "",
        product_name: item.product_name || "",
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || "",
      })),
    };

    try {
      await apiClient.post("/add-rfqs/", payload);
      toast.success("RFQ created successfully!");
      navigate("/pre-job/view-rfq");
    } catch (error) {
      console.error("Error submitting RFQ:", error.response?.data || error.message);
      toast.error("Failed to save RFQ. Please check the required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyFields = [
    { name: "company_name", label: "Company Name", type: "text", required: true, placeholder: "Enter Company Name" },
    { name: "reference", label: "Reference", type: "text", required: false, placeholder: "Enter Reference" },
    { name: "address", label: "Address", type: "text", required: true, placeholder: "Enter Address" },
    { name: "phone", label: "Phone", type: "text", required: true, placeholder: "Enter Phone Number" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "Enter Email" },
    {
      name: "rfq_channel",
      label: "RFQ Channel",
      type: "select",
      required: false,
      placeholder: "Select RFQ Channel",
      options: rfqChannels,
    },
    { name: "attention_name", label: "Attention Name", type: "text", required: false, placeholder: "Enter Attention Name" },
    { name: "attention_phone", label: "Attention Phone", type: "text", required: false, placeholder: "Enter Attention Phone" },
    { name: "attention_email", label: "Attention Email", type: "email", required: false, placeholder: "Enter Attention Email" },
  ];

  const stepTwoFields = [
    { name: "due_date", label: "Due Date", type: "date", required: false, placeholder: "Select Due Date" },
    {
      name: "assign_to",
      label: "Assign To",
      type: "select",
      required: false,
      placeholder: "Select Team Member",
      options: teamMembers.map((member) => member.label),
      optionValues: teamMembers.map((member) => member.value),
    },
  ];

  const renderField = (field, entryId = null) => {
    const value = entryId ? formData.items.find((e) => e.id === entryId)?.[field.name] || "" : formData[field.name] || "";
    const options = field.name === "item_name" ? items : field.name === "product_name" ? products : field.name === "unit" ? units : field.name === "rfq_channel" ? rfqChannels : field.options || [];

    if (field.type === "select" && field.name !== "assign_to") {
      return (
        <div key={`${field.name}-${entryId || field.name}`} className="mb-4 relative">
          <label htmlFor={`${field.name}-${entryId || field.name}`} className="block text-xs font-medium text-black mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            id={`${field.name}-${entryId || field.name}`}
            name={field.name}
            value={value}
            onChange={(e) => (entryId ? handleInputChange(e, entryId) : handleSingleInputChange(e))}
            className="w-full text-sm p-2 border border-gray-300 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          >
            <option value="" disabled>{field.placeholder}</option>
            {options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    } else if (field.type === "select" && field.name === "assign_to") {
      return (
        <div key={`${field.name}-${entryId || field.name}`} className="mb-4">
          <label htmlFor={`${field.name}-${entryId || field.name}`} className="block text-xs font-medium text-black mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            id={`${field.name}-${entryId || field.name}`}
            name={field.name}
            value={value}
            onChange={(e) => handleSingleInputChange(e)}
            className="w-full text-sm p-2 border border-gray-300 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          >
            <option value="" disabled>{field.placeholder}</option>
            {teamMembers.map((member, index) => (
              <option key={index} value={member.value}>{member.label}</option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div key={`${field.name}-${entryId || field.name}`} className="mb-4">
        <label htmlFor={`${field.name}-${entryId || field.name}`} className="block text-xs font-medium text-black mb-1">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={`${field.name}-${entryId || field.name}`}
          type={field.type}
          name={field.name}
          value={value}
          onChange={(e) => (entryId ? handleInputChange(e, entryId) : handleSingleInputChange(e))}
          placeholder={field.placeholder}
          min={field.min}
          className="w-full text-sm p-2 border border-gray-300 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  if (loading) return <p className="text-black text-center">Loading data...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;

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
          <h1 className="text-xl font-semibold text-black">Add RFQ</h1>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex-1">
            <div className={`h-2 rounded-full ${currentStep >= 1 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
            <p className="text-xs text-center mt-1 text-black">Step 1: Company Details</p>
          </div>
          <div className="flex-1">
            <div className={`h-2 rounded-full ${currentStep === 2 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
            <p className="text-xs text-center mt-1 text-black">Step 2: RFQ Details</p>
          </div>
        </div>
      </div>
      <div className="mx-auto p-4 bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="mb-4">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {companyFields.map((field) => renderField(field))}
            </div>
          )}
          {currentStep === 2 && (
            <>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {stepTwoFields.map((field) => renderField(field))}
              </div>
              <div className="mb-4">
                <label className="mr-4">
                  <input
                    type="checkbox"
                    checked={includeItems}
                    onChange={(e) => setIncludeItems(e.target.checked)}
                    className="mr-2 relative top-0.5"
                  />
                  <span className="text-black text-sm">Include Items</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={includeProducts}
                    onChange={(e) => setIncludeProducts(e.target.checked)}
                    className="mr-2 relative top-0.5"
                  />
                  <span className="text-black text-sm">Include Products</span>
                </label>
              </div>
              {(includeItems || includeProducts) && (
                <>
                  {formData.items.map((entry) => (
                    <div
                      key={entry.id}
                      className="mb-3 p-3 bg-gray-100 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3"
                    >
                      {includeItems && renderField(
                        {
                          name: "item_name",
                          label: "Item",
                          type: "select",
                          required: true,
                          placeholder: "Select or Enter Item",
                        },
                        entry.id
                      )}
                      {includeProducts && renderField(
                        {
                          name: "product_name",
                          label: "Product",
                          type: "select",
                          required: true,
                          placeholder: "Select or Enter Product",
                        },
                        entry.id
                      )}
                      {renderField(
                        {
                          name: "quantity",
                          label: "Quantity",
                          type: "number",
                          required: true,
                          placeholder: "Enter Quantity",
                          min: 1,
                        },
                        entry.id
                      )}
                      {renderField(
                        {
                          name: "unit",
                          label: "Unit",
                          type: "select",
                          required: true,
                          placeholder: "Select or Enter Unit",
                        },
                        entry.id
                      )}
                      {formData.items.length > 1 && (
                        <div className="flex items-center justify-end md:col-span-3">
                          <button
                            type="button"
                            onClick={() => removeFormBlock(entry.id)}
                            className="bg-black text-white px-3 py-2 text-sm rounded hover:bg-gray-800 transition-colors duration-200 flex items-center"
                          >
                            <Trash size={16} className="mr-1" /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFormBlock}
                    className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center mb-3"
                  >
                    <Plus size={16} className="mr-1" /> Add Entry
                  </button>
                </>
              )}
            </>
          )}
          <div className="flex justify-end mt-4">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={isSubmitting}
                className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center"
              >
                Next <ArrowRight size="16" className="ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRFQ;