import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import { Save, X } from "lucide-react";
import ViewCard from "../../../components/ViewCard";

const EditQuotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quotationData, isEditing } = location.state || {};
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!quotationData || !isEditing) {
      setError("No quotation data provided for editing.");
      setLoading(false);
      return;
    }

    setFormData({
      ...quotationData,
      items: quotationData.items.map((item) => ({
        ...item,
        total_price: (item.quantity || 0) * (item.unit_price || 0),
      })),
    });
    setLoading(false);
  }, [quotationData, isEditing]);

  const handleInputChange = (e, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: e.target.value,
    }));
  };

  const handleItemChange = (index, fieldName, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [fieldName]: value,
        total_price:
          fieldName === "quantity" || fieldName === "unit_price"
            ? (fieldName === "quantity" ? parseInt(value) || 0 : updatedItems[index].quantity || 0) *
              (fieldName === "unit_price" ? parseFloat(value) || 0 : updatedItems[index].unit_price || 0)
            : updatedItems[index].total_price,
      };
      return { ...prev, items: updatedItems };
    });
  };

  const handleAddItem = () => {
    setFormData((prev) => {
      const hasItems = prev.items.some((item) => item.item_name && item.item_name.trim() !== "");
      const hasProducts = prev.items.some((item) => item.product_name && item.product_name.trim() !== "");
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            item_name: hasItems ? "" : null,
            product_name: hasProducts ? "" : null,
            quantity: 0,
            unit: "",
            unit_price: 0,
            total_price: 0,
          },
        ],
      };
    });
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    const payload = {
      company_name: formData.company_name || null,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      attention_name: formData.attention_name || null,
      attention_phone: formData.attention_phone || null,
      attention_email: formData.attention_email || null,
      due_date: formData.due_date || null,
      current_status: formData.current_status || "Pending",
      latest_remarks: formData.latest_remarks || null,
      items: formData.items.map((item) => ({
        item_name: item.item_name || null,
        product_name: item.product_name || null,
        quantity: item.quantity || null,
        unit: item.unit || null,
        unit_price: item.unit_price || null,
        total_price: item.total_price || null,
      })),
    };

    try {
      await apiClient.patch(`/quotations/${formData.id}/`, payload);
      toast.success("Quotation updated successfully!");
      navigate("/pre-job/quotation", { state: { refresh: true, quotationId: formData.id } });
    } catch (err) {
      console.error("Failed to update quotation:", err);
      toast.error("Failed to update quotation: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  const rfqFields = [
    { name: "rfq_details.rfq_no", label: "RFQ No", type: "text" },
    { name: "rfq_details.reference", label: "Reference", type: "text" },
    { name: "rfq_details.rfq_channel", label: "RFQ Channel", type: "text" },
    { name: "rfq_details.assign_to_name", label: "Assigned To", type: "text" },
    { name: "rfq_details.assign_to_designation", label: "Designation", type: "text" },
  ];

  const editableFields = [
    { name: "company_name", label: "Company Name", type: "text", placeholder: "Enter Company Name" },
    { name: "address", label: "Address", type: "text", placeholder: "Enter Address" },
    { name: "phone", label: "Phone", type: "text", placeholder: "Enter Phone" },
    { name: "email", label: "Email", type: "email", placeholder: "Enter Email" },
    { name: "attention_name", label: "Attention Name", type: "text", placeholder: "Enter Attention Name" },
    { name: "attention_phone", label: "Attention Phone", type: "text", placeholder: "Enter Attention Phone" },
    { name: "attention_email", label: "Attention Email", type: "email", placeholder: "Enter Attention Email" },
    { name: "due_date", label: "Due Date", type: "date", placeholder: "Select Due Date" },
    { name: "current_status", label: "Status", type: "select", options: ["Pending", "Approved", "PO Created"] },
    { name: "latest_remarks", label: "Latest Remarks", type: "text", placeholder: "Enter Remarks" },
  ];

  const allItemFields = [
    { name: "item_name", label: "Item", type: "text", placeholder: "Enter Item Name" },
    { name: "product_name", label: "Product", type: "text", placeholder: "Enter Product Name" },
    { name: "quantity", label: "Quantity", type: "number", placeholder: "Enter Quantity" },
    { name: "unit", label: "Unit", type: "text", placeholder: "Enter Unit" },
    { name: "unit_price", label: "Unit Price", type: "number", placeholder: "Enter Unit Price" },
    { name: "total_price", label: "Total Price", type: "number", readOnly: true },
  ];

  const getItemFields = (items) => {
    const hasItems = items.some((item) => item.item_name && item.item_name.trim() !== "");
    const hasProducts = items.some((item) => item.product_name && item.product_name.trim() !== "");
    const hasUnitPrice = items.some((item) => item.unit_price != null);
    const hasTotalPrice = items.some((item) => item.total_price != null);

    return allItemFields.filter((field) => {
      return (
        (hasItems && field.name === "item_name") ||
        (hasProducts && field.name === "product_name") ||
        field.name === "quantity" ||
        field.name === "unit" ||
        (hasUnitPrice && field.name === "unit_price") ||
        (hasTotalPrice && field.name === "total_price")
      );
    });
  };

  if (loading) return <p className="text-black text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (!formData) return <p className="text-black text-center">No quotation data available.</p>;

  const itemFields = formData.items && formData.items.length > 0 ? getItemFields(formData.items) : allItemFields;

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-black">Edit Quotation #{formData.quotation_no}</h2>
      <div className="bg-white rounded-lg shadow-sm p-6 w-full mx-auto">
        {/* RFQ Details (Read-Only) */}
        <ViewCard
          singleFields={rfqFields}
          repeatableFields={[]}
          title="RFQ Details"
          showRepeatableFields={false}
          initialData={formData}
        />

        {/* Editable Quotation Fields */}
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2 text-black">Quotation Details</h3>
          <div className="grid grid-cols-1 gap-4">
            {editableFields.map((field) => (
              <div key={field.name} className="flex flex-col">
                <label className="text-xs font-medium text-gray-600">{field.label}</label>
                {field.type === "select" ? (
                  <select
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(e, field.name)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(e, field.name)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        {formData.items && formData.items.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2 text-black">
              {formData.items.some((item) => item.item_name && item.item_name.trim() !== "") &&
              formData.items.some((item) => item.product_name && item.product_name.trim() !== "")
                ? "Items & Products"
                : formData.items.some((item) => item.item_name && item.item_name.trim() !== "")
                ? "Items"
                : "Products"}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-100 rounded-lg">
                <thead>
                  <tr>
                    {itemFields.map((field) => (
                      <th
                        key={field.name}
                        className="px-4 py-2 text-xs font-medium text-gray-600 text-left"
                      >
                        {field.label}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-xs font-medium text-gray-600 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id || index} className="border-t">
                      {itemFields.map((field) => (
                        <td key={field.name} className="px-4 py-2 text-sm text-gray-800">
                          {field.readOnly ? (
                            `$${Number(item[field.name] || 0).toFixed(2)}`
                          ) : (
                            <input
                              type={field.type}
                              value={item[field.name] || ""}
                              onChange={(e) => handleItemChange(index, field.name, e.target.value)}
                              className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder={field.placeholder}
                              min={field.type === "number" ? 0 : undefined}
                              step={field.type === "number" && field.name === "unit_price" ? 0.01 : undefined}
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-sm text-gray-800">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors duration-200"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleAddItem}
              className="mt-2 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors duration-200"
            >
              Add Item
            </button>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleSubmit}
            className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center"
          >
            <Save size={16} className="mr-1" /> Save
          </button>
          <button
            onClick={() => navigate("/pre-job/quotation", { state: { refresh: true } })}
            className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition-colors duration-200 flex items-center"
          >
            <X size={16} className="mr-1" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuotation;