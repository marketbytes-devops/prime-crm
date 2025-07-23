import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash, X } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import ClientSelectionModal from "../../../components/ClientSelectionModal";

const EditRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rfqData, isEditing, isQuotationMode = false } = location.state || {};
  const [formData, setFormData] = useState(null);
  const [rfqChannels, setRfqChannels] = useState([]);
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClientModal, setShowClientModal] = useState(!rfqData?.company_name && isEditing);
  const [isClientSelected, setIsClientSelected] = useState(!!rfqData?.company_name);
  const itemsSectionRef = useRef(null);

  useEffect(() => {
    if (isQuotationMode && itemsSectionRef.current) {
      itemsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isQuotationMode, formData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!rfqData || !rfqData.id || !isEditing) {
        setError("No RFQ data provided for editing or missing RFQ ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [
          rfqResponse,
          rfqChannelsResponse,
          itemsResponse,
          unitsResponse,
          teamResponse,
        ] = await Promise.all([
          apiClient.get(`/add-rfqs/${rfqData.id}/`),
          apiClient.get("/rfq-channels/"),
          apiClient.get("/items/").catch(() => ({ data: [] })),
          apiClient.get("/units/").catch(() => ({ data: [] })),
          apiClient.get("/teams/"),
        ]);

        // Prioritize rfqData.items in quotation mode, fallback to API response
        const initialItems = isQuotationMode && rfqData.items?.length
          ? rfqData.items.map((item, index) => ({
              id: item.id || Date.now() + index,
              item_name: item.item_name || "",
              quantity: String(item.quantity) || "",
              unit: item.unit || "",
              unit_price: String(item.unit_price) || "0",
            }))
          : rfqResponse.data.items?.length
          ? rfqResponse.data.items.map((item, index) => ({
              id: item.id || Date.now() + index,
              item_name: item.item_name || "",
              quantity: String(item.quantity) || "",
              unit: item.unit || "",
              unit_price: String(item.unit_price) || "0",
            }))
          : rfqData.items?.map((item, index) => ({
              id: item.id || Date.now() + index,
              item_name: item.item_name || "",
              quantity: String(item.quantity) || "",
              unit: item.unit || "",
              unit_price: String(item.unit_price) || "0",
            })) || [
              {
                id: Date.now(),
                item_name: "",
                quantity: "",
                unit: "",
                unit_price: "0",
              },
            ];

        setFormData({
          company_name: rfqResponse.data.company_name || rfqData.company_name || "",
          company_address: rfqResponse.data.address || rfqData.address || "",
          company_phone: rfqResponse.data.phone || rfqData.phone || "",
          company_email: rfqResponse.data.email || rfqData.email || "",
          rfq_channel: rfqResponse.data.rfq_channel || rfqData.rfq_channel || "",
          attention_name: rfqResponse.data.attention_name || rfqData.attention_name || "",
          attention_phone: rfqResponse.data.attention_phone || rfqData.attention_phone || "",
          attention_email: rfqResponse.data.attention_email || rfqData.attention_email || "",
          due_date: rfqResponse.data.due_date || rfqData.due_date || "",
          assign_to: rfqResponse.data.assign_to
            ? String(rfqResponse.data.assign_to)
            : rfqData.assign_to
            ? String(rfqData.assign_to)
            : "",
          rfq_no: rfqResponse.data.rfq_no || rfqData.rfq_no || "",
          items: initialItems,
        });

        setRfqChannels(
          rfqChannelsResponse.data.map((channel) => ({
            value: channel.channel_name,
            label: channel.channel_name,
          }))
        );
        setItems(
          itemsResponse.data.length
            ? itemsResponse.data.map((item) => item.name)
            : ["Default Item"]
        );
        setUnits(
          unitsResponse.data.length
            ? unitsResponse.data.map((unit) => unit.name)
            : ["Unit", "Piece", "Box"]
        );
        setTeamMembers(
          teamResponse.data.map((member) => ({
            value: String(member.id),
            label: `${member.name} (${member.designation})`,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch RFQ data:", err);
        setError("Failed to load RFQ data.");
        if (rfqData) {
          setFormData({
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
            rfq_no: rfqData.rfq_no || "",
            items: rfqData.items?.map((item, index) => ({
              id: item.id || Date.now() + index,
              item_name: item.item_name || "",
              quantity: String(item.quantity) || "",
              unit: item.unit || "",
              unit_price: String(item.unit_price) || "0",
            })) || [
              {
                id: Date.now(),
                item_name: "",
                quantity: "",
                unit: "",
                unit_price: "0",
              },
            ],
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rfqData, isEditing]);

  const handleClientSelect = (type) => {
    setShowClientModal(false);
    if (type === "existing") {
      navigate("/pre-job/existing-client");
    } else {
      setIsClientSelected(true);
    }
  };

  const handleClearClient = () => {
    setFormData((prev) => ({
      ...prev,
      company_name: "",
      company_address: "",
      company_phone: "",
      company_email: "",
    }));
    setIsClientSelected(false);
    setShowClientModal(true);
  };

  const handleSingleInputChange = (e) => {
    if (isQuotationMode) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const addFormBlock = () => {
    const newId = Date.now();
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: newId,
          item_name: "",
          quantity: "",
          unit: "",
          unit_price: "0",
        },
      ],
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
    if (!isQuotationMode) {
      const requiredFields = [
        "company_name",
        "company_address",
        "company_phone",
        "company_email",
        "due_date",
        "assign_to",
      ];
      for (const field of requiredFields) {
        if (!formData[field]) return `${field.replace("_", " ")} is required`;
      }
    }
    return null;
  };

  const validateEntry = (entry) => {
    if (!entry.item_name) return "Item is required";
    if (!entry.quantity) return "Quantity is required";
    if (parseFloat(entry.quantity) < 1) return "Quantity must be at least 1";
    if (!entry.unit) return "Unit is required";
    if (isQuotationMode && (entry.unit_price === "" || parseFloat(entry.unit_price) < 0)) {
      return "Unit price must be non-negative";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData || !rfqData.id) {
      toast.error("Invalid RFQ data or ID.");
      return;
    }

    const singleValidationError = validateSingleFields();
    if (singleValidationError) {
      toast.error(singleValidationError);
      return;
    }

    for (const entry of formData.items) {
      const validationError = validateEntry(entry);
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    if (isQuotationMode) {
      const payload = {
        rfq: rfqData.id,
        company_name: formData.company_name || null,
        address: formData.company_address || null,
        phone: formData.company_phone || null,
        email: formData.company_email || null,
        attention_name: formData.attention_name || null,
        attention_phone: formData.attention_phone || null,
        attention_email: formData.attention_email || null,
        due_date: formData.due_date || null,
        items: formData.items.map((item) => ({
          item_name: item.item_name || null,
          quantity: parseFloat(item.quantity) || null,
          unit: item.unit || null,
          unit_price: parseFloat(item.unit_price) || 0,
        })),
      };

      try {
        const response = await apiClient.post("/quotations/", payload);
        toast.success("Quotation created successfully!");
        navigate("/pre-job/view-quotation", {
          state: { quotationId: response.data.id, refresh: true, rfqId: rfqData.id },
        });
      } catch (err) {
        console.error("Failed to create quotation:", err);
        let errorMessage =
          "Failed to create quotation. Please try again or contact support.";
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.non_field_errors) {
          errorMessage = err.response.data.non_field_errors.join(", ");
        } else if (err.response?.data?.items) {
          errorMessage = err.response.data.items
            .map((item) => item.unit_price || item)
            .join(", ");
        }
        toast.error(errorMessage);
      }
    } else {
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
        items: formData.items.map((item) => ({
          id: item.id,
          item_name: item.item_name || null,
          quantity: parseFloat(item.quantity) || null,
          unit: item.unit || null,
          unit_price: parseFloat(item.unit_price) || null,
        })),
      };

      try {
        await apiClient.put(`/add-rfqs/${rfqData.id}/`, payload);
        toast.success("RFQ updated successfully!");
        navigate("/pre-job/view-rfq", { state: { refresh: true, rfqId: rfqData.id } });
      } catch (error) {
        console.error("Error updating RFQ:", error.response?.data || error.message);
        toast.error("Failed to update RFQ. Please check the required fields.");
      }
    }
  };

  const fields = [
    {
      name: "company_name",
      label: "Company Name",
      type: "text",
      required: true,
      placeholder: "Enter Company Name",
    },
    {
      name: "company_address",
      label: "Company Address",
      type: "text",
      required: true,
      placeholder: "Enter Company Address",
    },
    {
      name: "company_phone",
      label: "Company Phone",
      type: "text",
      required: true,
      placeholder: "Enter Company Phone",
    },
    {
      name: "company_email",
      label: "Company Email",
      type: "email",
      required: true,
      placeholder: "Enter Company Email",
    },
    {
      name: "rfq_channel",
      label: "RFQ Channel",
      type: "select",
      required: false,
      placeholder: "Select RFQ Channel",
      options: rfqChannels,
    },
    {
      name: "attention_name",
      label: "Name",
      type: "text",
      required: false,
      placeholder: "Enter Name",
    },
    {
      name: "attention_phone",
      label: "Phone",
      type: "text",
      required: false,
      placeholder: "Enter Phone",
    },
    {
      name: "attention_email",
      label: "Email",
      type: "email",
      required: false,
      placeholder: "Enter Email",
    },
    {
      name: "due_date",
      label: "Due Date for Quotation",
      type: "date",
      required: true,
      placeholder: "Select Due Date",
    },
    {
      name: "assign_to",
      label: "Assigned Sales Person",
      type: "select",
      required: true,
      placeholder: "Select Sales Person",
      options: teamMembers,
    },
  ];

  const repeatableFields = (entryId) => {
    const fields = [
      {
        name: "item_name",
        label: "Item",
        type: "select",
        required: true,
        placeholder: "Select Item",
        options: items.map((item) => ({ value: item, label: item })),
      },
      {
        name: "quantity",
        label: "Quantity",
        type: "number",
        required: true,
        min: 1,
        placeholder: "Enter Quantity",
      },
      {
        name: "unit",
        label: "Unit",
        type: "select",
        required: true,
        placeholder: "Select Unit",
        options: units.map((unit) => ({ value: unit, label: unit })),
      },
      {
        name: "unit_price",
        label: "Unit Price",
        type: "number",
        required: isQuotationMode,
        min: 0,
        step: "0.01",
        placeholder: "Enter Unit Price",
      },
    ];
    return fields;
  };

  const renderField = (field, entryId = null) => {
    const value = entryId
      ? formData.items.find((e) => e.id === entryId)?.[field.name] || ""
      : formData[field.name] || "";
    const options = field.options || [];
    const isDisabled = isQuotationMode && !entryId;

    if (field.type === "select") {
      return (
        <div
          key={`${field.name}-${entryId || field.name}`}
          className="mb-4 relative"
        >
          <label
            htmlFor={`${field.name}-${entryId || field.name}`}
            className="block text-xs font-medium text-black mb-1"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            id={`${field.name}-${entryId || field.name}`}
            name={field.name}
            value={value}
            onChange={(e) =>
              entryId ? handleInputChange(e, entryId) : handleSingleInputChange(e)
            }
            className={`w-full text-sm p-2 border border-gray-400 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500 ${isDisabled ? "bg-gray-100 text-black cursor-not-allowed" : ""}`}
            aria-required={field.required}
            disabled={isDisabled}
          >
            <option value="" disabled>
              {field.placeholder}
            </option>
            {options.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div key={`${field.name}-${entryId || field.name}`} className="mb-4">
        <label
          htmlFor={`${field.name}-${entryId || field.name}`}
          className="block text-xs font-medium text-black mb-1"
        >
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={`${field.name}-${entryId || field.name}`}
          type={field.type}
          name={field.name}
          value={value}
          onChange={(e) =>
            entryId ? handleInputChange(e, entryId) : handleSingleInputChange(e)
          }
          placeholder={field.placeholder}
          min={field.min}
          step={field.step}
          className={`w-full text-sm p-2 border border-gray-400 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500 ${isDisabled ? "bg-gray-100 text-black cursor-not-allowed" : ""}`}
          aria-required={field.required}
          disabled={isDisabled}
        />
        {isQuotationMode && field.name === "unit_price" && (
          <p className="text-xs text-gray-600 mt-1">Please enter the unit price</p>
        )}
      </div>
    );
  };

  if (loading) return <p className="text-black text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (!formData) return <p className="text-red-600 text-center">Form data not initialized.</p>;

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      {showClientModal && (
        <ClientSelectionModal
          onClose={() => setShowClientModal(false)}
          onSelect={handleClientSelect}
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/pre-job/view-rfq")}
            className="text-black hover:text-indigo-500 mr-3"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-black">
            {isQuotationMode ? `Edit Quotation for RFQ #${formData.rfq_no}` : `Edit RFQ #${formData.rfq_no}`}
          </h1>
        </div>
      </div>
      <div className="mx-auto">
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="space-y-6">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="text-md font-medium text-black mb-4">Company Details</h3>
              {isClientSelected ? (
                <div className="mb-4 flex items-center">
                  <input
                    type="text"
                    value={formData.company_name}
                    disabled
                    className="w-full text-sm p-2 border border-gray-400 rounded bg-gray-100 text-black"
                    placeholder="Selected Client"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search for a client..."
                    disabled
                    className="w-full text-sm p-2 border border-gray-400 rounded bg-gray-100 text-black cursor-not-allowed"
                    onClick={() => setShowClientModal(true)}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {fields.slice(1, 5).map((field) => renderField(field))}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="text-md font-medium text-black mb-4">RFQ Channel</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-x-4">
                {fields.slice(5, 6).map((field) => renderField(field))}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="text-md font-medium text-black mb-4">Point of Contact</h3>
              <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {fields.slice(6, 8).map((field) => renderField(field))}
                </div>
                <div className="grid grid-cols-1 gap-x-4">
                  {fields.slice(8, 9).map((field) => renderField(field))}
                </div>
              </div>
            </div>
            <div ref={itemsSectionRef} className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="text-md font-medium text-black mb-4">RFQ Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {fields.slice(9, 11).map((field) => renderField(field))}
              </div>
              {formData.items.map((entry) => (
                <div
                  key={entry.id}
                  className="mb-3 p-3 bg-gray-100 border border-gray-400 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-x-4 items-start"
                >
                  {repeatableFields(entry.id).map((field) =>
                    renderField(field, entry.id)
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => removeFormBlock(entry.id)}
                      disabled={formData.items.length === 1}
                      className={`text-sm px-3 py-2 rounded flex items-center transition-colors duration-200 ${formData.items.length === 1
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                    >
                      <Trash size="16" className="mr-1" /> Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addFormBlock}
                className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center mb-3"
              >
                <Plus size={16} className="mr-1" /> Add Item
              </button>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
            >
              {loading ? (isQuotationMode ? "Generating..." : "Updating...") : (isQuotationMode ? "Generate Quote" : "Update")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRFQ;