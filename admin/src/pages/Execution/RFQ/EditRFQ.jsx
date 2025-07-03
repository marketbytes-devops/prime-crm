import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CRMManager from "../../../components/CRMManager"; // Adjust path as needed
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";

const EditRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rfqData, isEditing } = location.state || {};

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define fields for CRMManager
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
      searchEndpoint: "/teams/",
      optionLabel: "name",
      optionValue: "id",
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
      placeholder: "Select Item",
      searchEndpoint: "/items/",
      optionLabel: "name",
      optionValue: "name",
    },
    {
      name: "product_name",
      label: "Product",
      type: "select",
      required: true,
      placeholder: "Select Product",
      searchEndpoint: "/products/",
      optionLabel: "name",
      optionValue: "name",
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
      searchEndpoint: "/units/",
      optionLabel: "name",
      optionValue: "name",
    },
  ];

  useEffect(() => {
    console.log("location.state:", JSON.stringify(location.state, null, 2)); // Debug: Log location.state

    const fetchRfqData = async () => {
      if (!rfqData || !rfqData.id || !isEditing) {
        console.error("Missing rfqData or rfqData.id:", { rfqData, isEditing });
        setError("No RFQ data provided for editing or missing RFQ ID.");
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching RFQ data for ID: ${rfqData.id}`); // Debug: Log RFQ ID
        const response = await apiClient.get(`/add-rfqs/${rfqData.id}/`);
        const fetchedData = response.data;
        console.log("Fetched RFQ data:", JSON.stringify(fetchedData, null, 2)); // Debug: Log fetched data
        setFormData({
          company_name: fetchedData.company_name || "",
          reference: fetchedData.reference || "",
          address: fetchedData.address || "",
          phone: fetchedData.phone || "",
          email: fetchedData.email || "",
          rfq_channel: fetchedData.rfq_channel || "",
          attention_name: fetchedData.attention_name || "",
          attention_phone: fetchedData.attention_phone || "",
          attention_email: fetchedData.attention_email || "",
          due_date: fetchedData.due_date || "",
          assign_to: fetchedData.assign_to ? String(fetchedData.assign_to) : "",
          assign_to_designation: fetchedData.assign_to_designation || "",
          rfq_no: fetchedData.rfq_no || `RFQ-${String(fetchedData.id).padStart(3, "0")}`,
          items: fetchedData.items?.map((item, index) => ({
            id: item.id || Date.now() + index, // Use backend ID if available
            item_name: item.item_name || "",
            product_name: item.product_name || "",
            quantity: String(item.quantity) || "", // Convert to string for input
            unit: item.unit || "",
          })) || [{ id: Date.now(), item_name: "", product_name: "", quantity: "", unit: "" }],
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch RFQ data:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError("Failed to load RFQ data. Please try again.");
        setLoading(false);
      }
    };

    fetchRfqData();
  }, [rfqData, isEditing]);

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating single field: ${name} = ${value}`); // Debug: Log single field changes
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      console.log("Updated formData (single):", JSON.stringify(newData, null, 2)); // Debug: Log updated formData
      return newData;
    });
  };

  const handleInputChange = (e, entryId, data = null, isRemove = false) => {
    if (isRemove) {
      console.log(`Removing item with ID: ${entryId}`); // Debug: Log item removal
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== entryId),
      }));
      return;
    }

    const { name, value } = e ? e.target : { name: null, value: null };
    console.log(`Updating item field: ${name} = ${value} for entry ${entryId}`); // Debug: Log item field changes
    setFormData((prev) => {
      const updatedItems = data
        ? prev.items.some((item) => item.id === entryId)
          ? prev.items.map((item) => (item.id === entryId ? { ...item, ...data } : item))
          : [...prev.items, { id: entryId, ...data }]
        : prev.items.map((item) =>
            item.id === entryId ? { ...item, [name]: value } : item
          );
      const newData = { ...prev, items: updatedItems };
      console.log("Updated formData (items):", JSON.stringify(newData, null, 2)); // Debug: Log updated formData
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted"); // Debug: Confirm form submission

    if (!formData) {
      console.error("Form data is null");
      toast.error("Form data is not initialized.");
      return;
    }

    if (!rfqData.id) {
      console.error("Invalid RFQ ID");
      toast.error("Invalid RFQ ID. Cannot update RFQ.");
      return;
    }

    try {
      const payload = {
        company_name: formData.company_name,
        reference: formData.reference || "",
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        rfq_channel: formData.rfq_channel || "",
        attention_name: formData.attention_name || "",
        attention_phone: formData.attention_phone || "",
        attention_email: formData.attention_email || "",
        due_date: formData.due_date,
        assign_to: formData.assign_to ? parseInt(formData.assign_to) : null,
        assign_to_designation: formData.assign_to_designation || "",
        items: formData.items.map((item) => ({
          id: item.id, // Include item ID for updates
          item_name: item.item_name || "",
          product_name: item.product_name || "",
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit || "",
        })),
      };
      console.log("Submitting payload to /add-rfqs/", JSON.stringify(payload, null, 2)); // Debug: Log payload
      const response = await apiClient.put(`/add-rfqs/${rfqData.id}/`, payload);
      console.log("API response:", JSON.stringify(response.data, null, 2)); // Debug: Log response
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
        error.response?.data?.detail ||
        error.response?.data?.message ||
        Object.values(error.response?.data || {}).join(", ") ||
        "Failed to update RFQ. Please check the form and try again.";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <p className="text-gray-600 text-center">Loading...</p>;
  }
  if (error) {
    return <p className="text-red-600 text-center">{error}</p>;
  }
  if (!formData) {
    return <p className="text-red-600 text-center">Form data not initialized. Please try again.</p>;
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
      <CRMManager
        apiBaseUrl="/add-rfqs/"
        fields={repeatableFields}
        singleFields={singleFields}
        title="Edit RFQ"
        initialData={formData}
        isEditing={true}
        showRepeatableFields={true}
        currentStep={2}
        totalSteps={2}
        formData={formData}
        onInputChange={handleInputChange}
        onSingleInputChange={handleSingleInputChange}
        onSubmit={handleSubmit}
        redirectPath="/pre-job/view-rfq"
      />
    </div>
  );
};

export default EditRFQ;