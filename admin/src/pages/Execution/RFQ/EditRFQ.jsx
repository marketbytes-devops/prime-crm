import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Trash } from "lucide-react";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";

const EditRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rfqData, isEditing } = location.state || {};

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      type: "text",
      required: false,
      placeholder: "Enter RFQ Channel",
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
      required: false,
      placeholder: "Enter Attention Email",
    },
    {
      name: "due_date",
      label: "Due Date",
      type: "date",
      required: true,
      placeholder: "Select Due Date",
    },
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
      name: "assign_to_designation",
      label: "Designation",
      type: "text",
      required: false,
      placeholder: "Enter Designation",
    },
  ];

  const repeatableFields = [
    {
      name: "item_name",
      label: "Item",
      type: "select",
      required: true,
      options: items,
      placeholder: "Select Item",
    },
    {
      name: "product_name",
      label: "Product",
      type: "select",
      required: true,
      options: products,
      placeholder: "Select Product",
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
      options: units,
      placeholder: "Select Unit",
    },
  ];

  useEffect(() => {
    if (!rfqData || !isEditing || !rfqData.id) {
      setError("No RFQ data provided for editing or missing RFQ ID.");
      setLoading(false);
      return;
    }

    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        const response = await apiClient.get("/items/");
        setItems(response.data.map((item) => item.name));
      } catch (err) {
        console.error("Failed to fetch items:", err.response || err.message);
        setError("Failed to load items.");
        setItems([]);
      } finally {
        setItemsLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await apiClient.get("/products/");
        setProducts(response.data.map((product) => product.name));
      } catch (err) {
        console.error("Failed to fetch products:", err.response || err.message);
        setError("Failed to load products.");
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    const fetchUnits = async () => {
      try {
        setUnitsLoading(true);
        const response = await apiClient.get("/units/");
        setUnits(response.data.map((unit) => unit.name));
      } catch (err) {
        console.error("Failed to fetch units:", err.response || err.message);
        setError("Failed to load units.");
        setUnits([]);
      } finally {
        setUnitsLoading(false);
      }
    };

    const fetchTeamMembers = async () => {
      try {
        setTeamMembersLoading(true);
        const response = await apiClient.get("/teams/");
        if (response.data.length === 0) {
          setError("No team members available. Please add team members first.");
        }
        setTeamMembers(
          response.data.map((member) => ({
            value: member.id,
            label: `${member.name} (${member.designation})`,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch team members:", err.response || err.message);
        setError("Failed to load team members.");
        setTeamMembers([]);
      } finally {
        setTeamMembersLoading(false);
      }
    };

    const initializeFormData = () => {
      setFormData({
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
        assign_to_designation: rfqData.assign_to_designation || "",
        rfq_no: rfqData.rfq_no || "",
        items: rfqData.items?.map((item, index) => ({
          id: Date.now() + index,
          item_name: item.item_name || "",
          product_name: item.product_name || "",
          quantity: item.quantity || "",
          unit: item.unit || "",
        })) || [{ id: Date.now(), item_name: "", product_name: "", quantity: "", unit: "" }],
      });
    };

    Promise.all([fetchItems(), fetchProducts(), fetchUnits(), fetchTeamMembers()])
      .then(() => {
        initializeFormData();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [rfqData, isEditing]);

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInputChange = (e, entryId) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedItems = prev.items.map((item) =>
        item.id === entryId ? { ...item, [name]: value } : item
      );
      return { ...prev, items: updatedItems };
    });
  };

  const addFormBlock = () => {
    const newId = Date.now();
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: newId, item_name: "", product_name: "", quantity: "", unit: "" }],
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
    const requiredFields = singleFields.filter((field) => field.required);
    for (const field of requiredFields) {
      if (!formData[field.name]) {
        return `${field.label} is required`;
      }
    }
    return null;
  };

  const validateEntry = (entry) => {
    if (!entry.item_name) {
      return "Item is required";
    }
    if (!entry.product_name) {
      return "Product is required";
    }
    if (!entry.quantity) {
      return "Quantity is required";
    }
    if (parseFloat(entry.quantity) < 1) {
      return "Quantity must be at least 1";
    }
    if (!entry.unit) {
      return "Unit is required";
    }
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

    if (!rfqData.id) {
      toast.error("Invalid RFQ ID. Cannot update RFQ.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        assign_to: formData.assign_to ? parseInt(formData.assign_to) : null,
        items: formData.items.map((item) => ({
          item_name: item.item_name || "",
          product_name: item.product_name || "",
          quantity: item.quantity || "",
          unit: item.unit || "",
        })),
      };
      console.log("Submitting payload:", JSON.stringify(payload, null, 2));
      const response = await apiClient.put(`/add-rfqs/${rfqData.id}/`, payload);
      console.log("API response:", response.data);
      toast.success("RFQ updated successfully!");
      navigate("/pre-job/view-rfq", { state: { refresh: true } });
    } catch (error) {
      console.error("Error updating RFQ:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to update RFQ. Please try again.";
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const renderSingleField = (field) => {
    const value = formData[field.name] || "";
    if (field.type === "select") {
      return (
        <div key={field.name} className="mb-4">
          <label
            htmlFor={field.name}
            className="block text-xs font-medium text-gray-800 mb-1"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={handleSingleInputChange}
            disabled={isSubmitting}
            className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          >
            <option value="" disabled>
              {field.placeholder}
            </option>
            {field.options.map((option, index) => (
              <option
                key={option}
                value={field.optionValues ? field.optionValues[index] : option}
              >
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div key={field.name} className="mb-4">
        <label
          htmlFor={field.name}
          className="block text-xs font-medium text-gray-800 mb-1"
        >
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={field.name}
          type={field.type}
          name={field.name}
          value={value}
          onChange={handleSingleInputChange}
          placeholder={field.placeholder}
          disabled={isSubmitting}
          className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  const renderEntryField = (field, entryId) => {
    const entry = formData.items.find((e) => e.id === entryId);
    const value = entry[field.name] || "";
    if (field.type === "select") {
      return (
        <div key={field.name} className="mb-4">
          <label
            htmlFor={`${field.name}-${entryId}`}
            className="block text-xs font-medium text-gray-800 mb-1"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            id={`${field.name}-${entryId}`}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(e, entryId)}
            disabled={isSubmitting}
            className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          >
            <option value="" disabled>
              {field.placeholder}
            </option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div key={field.name} className="mb-4">
        <label
          htmlFor={`${field.name}-${entryId}`}
          className="block text-xs font-medium text-gray-800 mb-1"
        >
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={`${field.name}-${entryId}`}
          type={field.type}
          name={field.name}
          value={value}
          onChange={(e) => handleInputChange(e, entryId)}
          placeholder={field.placeholder}
          min={field.min}
          disabled={isSubmitting}
          className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  if (loading || itemsLoading || productsLoading || unitsLoading || teamMembersLoading) {
    return <p className="text-gray-600 text-center">Loading...</p>;
  }
  if (error) {
    return <p className="text-red-600 text-center">{error}</p>;
  }
  if (!formData) {
    return <p className="text-red-600 text-center">Form data not initialized.</p>;
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/pre-job/view-rfq")}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <svg
              className="w-6 h-6"
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
          <h1 className="text-2xl font-semibold text-gray-800">
            Edit RFQ #{formData.rfq_no}
          </h1>
        </div>
      </div>
      <div className="mx-auto p-6 bg-white rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {singleFields.map((field) => renderSingleField(field))}
          </div>
          <div className="mb-6">
            {formData.items.map((entry) => (
              <div
                key={entry.id}
                className="mb-4 p-4 bg-gray-100 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                {repeatableFields.map((field) => renderEntryField(field, entry.id))}
                {formData.items.length > 1 && (
                  <div className="flex items-center justify-end md:col-span-4">
                    <button
                      type="button"
                      onClick={() => removeFormBlock(entry.id)}
                      className="bg-red-400 text-white px-2 py-1 text-sm rounded hover:bg-red-500 transition-colors duration-200 flex items-center"
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
              className="bg-green-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center mb-4"
            >
              <Plus size={18} className="mr-2" /> Add Entry
            </button>
          </div>
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-600 transition-colors duration-200"
            >
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRFQ;