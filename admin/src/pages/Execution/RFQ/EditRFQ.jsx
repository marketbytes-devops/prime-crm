import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Trash } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";

const EditRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rfqData, isEditing } = location.state || {};
  const [formData, setFormData] = useState(null);
  const [rfqChannels, setRfqChannels] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [seriesList, setSeriesList] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [entryFieldTypes, setEntryFieldTypes] = useState({});
  const [isPastDue, setIsPastDue] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!rfqData || !rfqData.id || !isEditing) {
        setError("No RFQ data provided for editing or missing RFQ ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [rfqResponse, rfqChannelsResponse, itemsResponse, productsResponse, unitsResponse, teamResponse, seriesResponse] = await Promise.all([
          apiClient.get(`/add-rfqs/${rfqData.id}/`),
          apiClient.get("/rfq-channels/"),
          apiClient.get("/items/"),
          apiClient.get("/products/"),
          apiClient.get("/units/"),
          apiClient.get("/teams/"),
          apiClient.get("/series/"), 
        ]);

        const fetchedItems = rfqResponse.data.items?.map((item, index) => ({
          id: item.id || Date.now() + index,
          item_name: item.item_name || "",
          product_name: item.product_name || "",
          quantity: String(item.quantity) || "",
          unit: item.unit || "",
        })) || [{ id: Date.now(), item_name: "", product_name: "", quantity: "", unit: "" }];

        const initialFieldTypes = {};
        fetchedItems.forEach((item) => {
          initialFieldTypes[item.id] = item.item_name ? "item" : item.product_name ? "product" : "";
        });

        setFormData({
          company_name: rfqResponse.data.company_name || "",
          reference: rfqResponse.data.reference || "",
          address: rfqResponse.data.address || "",
          phone: rfqResponse.data.phone || "",
          email: rfqResponse.data.email || "",
          rfq_channel: rfqResponse.data.rfq_channel || "",
          attention_name: rfqResponse.data.attention_name || "",
          attention_phone: rfqResponse.data.attention_phone || "",
          attention_email: rfqResponse.data.attention_email || "",
          due_date: rfqResponse.data.due_date || "",
          assign_to: rfqResponse.data.assign_to ? String(rfqResponse.data.assign_to) : "",
          rfq_no: rfqResponse.data.rfq_no || "",
          series: rfqResponse.data.series || "",
          current_status: rfqResponse.data.current_status || "Processing",
          items: fetchedItems,
        });

        setRfqChannels(rfqChannelsResponse.data.map((channel) => channel.channel_name));
        setItems(itemsResponse.data.map((item) => item.name));
        setProducts(productsResponse.data.map((product) => product.name));
        setUnits(unitsResponse.data.map((unit) => unit.name));
        setTeamMembers(
          teamResponse.data.map((member) => ({
            value: member.id,
            label: `${member.name} (${member.designation})`,
          }))
        );
        setSeriesList(seriesResponse.data);
        setEntryFieldTypes(initialFieldTypes);

        const dueDate = new Date(rfqResponse.data.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDate < today && rfqResponse.data.current_status !== "Completed") {
          setIsPastDue(true);
        }
      } catch (err) {
        console.error("Failed to fetch RFQ data:", err);
        setError("Failed to load RFQ data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rfqData, isEditing]);

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setActiveDropdown(null);
    if (name === "current_status" && value === "Completed") {
      setIsPastDue(false);
    }
  };

  const handleInputChange = (e, entryId) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === entryId ? { ...item, [name]: value } : item
      ),
    }));
    setActiveDropdown(null);
  };

  const handleFieldTypeChange = (entryId, value) => {
    setEntryFieldTypes((prev) => ({ ...prev, [entryId]: value }));
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === entryId
          ? { ...item, item_name: value === "item" ? item.item_name : "", product_name: value === "product" ? item.product_name : "" }
          : item
      ),
    }));
    setActiveDropdown(null);
  };

  const addFormBlock = () => {
    const newId = Date.now();
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: newId, item_name: "", product_name: "", quantity: "", unit: "" }],
    }));
    setEntryFieldTypes((prev) => ({ ...prev, [newId]: "" }));
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
    setEntryFieldTypes((prev) => {
      const newFieldTypes = { ...prev };
      delete newFieldTypes[entryId];
      return newFieldTypes;
    });
  };

  const validateSingleFields = () => {
    const requiredFields = ["company_name", "address", "phone", "email", "due_date", "assign_to", "current_status", "series"];
    for (const field of requiredFields) {
      if (!formData[field]) return `${field.replace("_", " ")} is required`;
    }
    return null;
  };

  const validateEntry = (entry) => {
    if (!entry.item_name && !entry.product_name) return "Either Item or Product is required";
    if (entry.item_name && entry.product_name) return "Only one of Item or Product can be provided";
    if (!entry.quantity) return "Quantity is required";
    if (parseFloat(entry.quantity) < 1) return "Quantity must be at least 1";
    if (!entry.unit) return "Unit is required";
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

    const payload = {
      ...formData,
      assign_to: formData.assign_to ? parseInt(formData.assign_to) : null,
      series: formData.series ? parseInt(formData.series) : null,
      items: formData.items.map((item) => ({
        id: item.id,
        item_name: item.item_name || "",
        product_name: item.product_name || "",
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || "",
      })),
    };

    try {
      await apiClient.put(`/add-rfqs/${rfqData.id}/`, payload);
      toast.success("RFQ updated successfully!");
      navigate("/pre-job/view-rfq", { state: { refresh: true } });
    } catch (error) {
      console.error("Error updating RFQ:", error.response?.data || error.message);
      toast.error("Failed to update RFQ. Please check the required fields.");
    }
  };

  const fields = [
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
      placeholder: "Select or Enter RFQ Channel",
      options: rfqChannels,
    },
    { name: "attention_name", label: "Attention Name", type: "text", required: false, placeholder: "Enter Attention Name" },
    { name: "attention_phone", label: "Attention Phone", type: "text", required: false, placeholder: "Enter Attention Phone" },
    { name: "attention_email", label: "Attention Email", type: "email", required: false, placeholder: "Enter Attention Email" },
    { name: "due_date", label: "Due Date", type: "date", required: true, placeholder: "Select Due Date" },
    {
      name: "assign_to",
      label: "Assigned To",
      type: "select",
      required: true,
      placeholder: "Select Team Member",
      options: teamMembers.map((member) => member.label),
      optionValues: teamMembers.map((member) => member.value),
    },
    {
      name: "current_status",
      label: "Status",
      type: "select",
      required: true,
      placeholder: "Select Status",
      options: ["Processing", "Completed"],
    },
    {
      name: "series",
      label: "Series",
      type: "select",
      required: true,
      placeholder: "Select Series",
      options: seriesList.map((s) => s.series_name),
      optionValues: seriesList.map((s) => s.id),
    },
  ];

  const repeatableFields = [
    {
      name: "item_name",
      label: "Item",
      type: "select",
      required: true,
      placeholder: "Select or Enter Item",
      options: items,
    },
    {
      name: "product_name",
      label: "Product",
      type: "select",
      required: true,
      placeholder: "Select or Enter Product",
      options: products,
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
      placeholder: "Select or Enter Unit",
      options: units,
    },
  ];

  const renderField = (field, entryId = null) => {
    const value = entryId ? formData.items.find((e) => e.id === entryId)?.[field.name] || "" : formData[field.name] || "";
    const options = field.name === "item_name" ? items : field.name === "product_name" ? products : field.name === "unit" ? units : field.name === "rfq_channel" ? rfqChannels : field.name === "assign_to" ? teamMembers.map((m) => m.label) : field.name === "series" ? seriesList.map((s) => s.series_name) : field.options || [];
    const optionValues = field.name === "series" ? seriesList.map((s) => s.id) : field.name === "assign_to" ? teamMembers.map((m) => m.value) : field.options || [];

    if (field.type === "select") {
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
              <option key={index} value={optionValues[index] || option}>{option}</option>
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

  if (loading) return <p className="text-black text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (!formData) return <p className="text-red-600 text-center">Form data not initialized.</p>;

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button onClick={() => navigate("/pre-job/view-rfq")} className="text-black hover:text-indigo-500 mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-black">Edit RFQ #{formData.rfq_no}</h1>
        </div>
        {isPastDue && (
          <div className="text-red-600 font-medium text-sm">
            Alert: This RFQ is past due. Please update the status to Completed or take action.
          </div>
        )}
      </div>
      <div className="mx-auto p-4 bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((field) => renderField(field))}
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-black mb-3">Items</h2>
            {formData.items.map((entry, index) => {
              const fieldType = entryFieldTypes[entry.id] || (entry.item_name ? "item" : entry.product_name ? "product" : "");
              return (
                <>
                  <div key={entry.id} className="mb-3 p-3 bg-gray-100 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    {!fieldType ? (
                      <div className="mb-4">
                        <label htmlFor={`field-type-${entry.id}`} className="block text-xs font-medium text-black mb-1">
                          Select Field Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          id={`field-type-${entry.id}`}
                          value={fieldType}
                          onChange={(e) => handleFieldTypeChange(entry.id, e.target.value)}
                          className="w-full text-sm p-2 border border-gray-300 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
                        >
                          <option value="" disabled>Select Item or Product</option>
                          <option value="item">Item</option>
                          <option value="product">Product</option>
                        </select>
                      </div>
                    ) : (
                      renderField(
                        repeatableFields.find((f) => f.name === (fieldType === "item" ? "item_name" : "product_name")),
                        entry.id
                      )
                    )}
                    {renderField(repeatableFields.find((f) => f.name === "quantity"), entry.id)}
                    {renderField(repeatableFields.find((f) => f.name === "unit"), entry.id)}
                  </div>
                  <div className="flex items-center justify-end mb-3">
                    <button
                      type="button"
                      onClick={() => removeFormBlock(entry.id)}
                      disabled={formData.items.length === 1}
                      className={`text-sm px-3 py-2 rounded flex items-center transition-colors duration-200 ${
                        formData.items.length === 1
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      <Trash size="16" className="mr-1" /> Remove
                    </button>
                  </div>
                </>
              );
            })}
            <button
              type="button"
              onClick={addFormBlock}
              className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center mb-3"
            >
              <Plus size="16" className="mr-1" /> Add Item
            </button>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRFQ;