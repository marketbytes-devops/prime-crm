import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import apiClient from "../../helpers/apiClient";
import { Plus, Trash } from "lucide-react";
import { toast } from "react-toastify";

const CRMManager = ({
  apiBaseUrl,
  fields,
  title,
  singleFields = [],
  initialData = null,
  isEditing = false,
  showRepeatableFields = true, 
}) => {
  const navigate = useNavigate();
  const [formEntries, setFormEntries] = useState([{ id: Date.now(), data: {} }]);
  const [singleFormData, setSingleFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("Initial Data in CRMManager:", initialData);
    if (initialData) {
      const initialSingleData = {};
      singleFields.forEach((field) => {
        initialSingleData[field.name] = initialData[field.name] || "";
      });
      setSingleFormData(initialSingleData);

      const entries = initialData.items && Array.isArray(initialData.items)
        ? initialData.items.map((item, index) => ({
            id: Date.now() + index,
            data: item || {},
          }))
        : [{ id: Date.now(), data: {} }];
      setFormEntries(entries);
    }
  }, [initialData, singleFields]);

  const validateEntry = (entry) => {
    for (const field of fields) {
      if (field.required && !entry.data[field.name]) {
        return `${field.label} is required`;
      }
      if (field.type === "number" && entry.data[field.name]) {
        const value = parseFloat(entry.data[field.name]);
        if (field.min !== undefined && value < field.min) {
          return `${field.label} must be at least ${field.min}`;
        }
      }
    }
    return null;
  };

  const validateSingleFields = () => {
    for (const field of singleFields) {
      if (field.required && !singleFormData[field.name]) {
        return `${field.label} is required`;
      }
      if (field.type === "number" && singleFormData[field.name]) {
        const value = parseFloat(singleFormData[field.name]);
        if (field.min !== undefined && value < field.min) {
          return `${field.label} must be at least ${field.min}`;
        }
      }
    }
    return null;
  };

  const handleInputChange = (e, entryId) => {
    const { name, value } = e.target;
    setFormEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, data: { ...entry.data, [name]: value } }
          : entry
      )
    );
  };

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setSingleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addFormBlock = () => {
    setFormEntries((prev) => [...prev, { id: Date.now(), data: {} }]);
  };

  const removeFormBlock = (entryId) => {
    if (formEntries.length === 1) {
      toast.error("At least one form entry is required");
      return;
    }
    setFormEntries((prev) => prev.filter((entry) => entry.id !== entryId));
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

    if (showRepeatableFields) {
      for (const entry of formEntries) {
        const validationError = validateEntry(entry);
        if (validationError) {
          toast.error(validationError);
          setIsSubmitting(false);
          return;
        }
      }
    }

    const itemsData = showRepeatableFields
      ? formEntries.map((entry) => entry.data).filter((data) => 
          Object.keys(data).length > 0
        )
      : [];

    if (showRepeatableFields && itemsData.length === 0) {
      toast.error("Please add at least one item.");
      setIsSubmitting(false);
      return;
    }

    const combinedData = {
      ...singleFormData,
      items: itemsData,
    };
    console.log("Sending to backend (Full Data):", combinedData);
    console.log("Items Array:", itemsData);

    try {
      if (isEditing && initialData?.id) {
        await apiClient.put(`${apiBaseUrl}${initialData.id}/`, combinedData);
        toast.success("RFQ updated!");
      } else {
        await apiClient.post(apiBaseUrl, combinedData);
        toast.success("RFQ saved!");
      }
      setSingleFormData({});
      setFormEntries([{ id: Date.now(), data: {} }]);
      navigate("/pre-job/view-rfq");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save RFQ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field, entryId) => {
    const entry = formEntries.find((e) => e.id === entryId);
    const value = entry?.data[field.name] || "";

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
            className="w-full text-sm p-2 border border-gray-800 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 opacity-80"
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
    if (field.type === "textarea") {
      return (
        <div key={field.name} className="mb-4">
          <label
            htmlFor={`${field.name}-${entryId}`}
            className="block text-xs font-medium text-gray-800 mb-1"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id={`${field.name}-${entryId}`}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(e, entryId)}
            placeholder={field.placeholder}
            className="w-full text-sm p-2 border border-gray-800 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 opacity-80"
            aria-required={field.required}
          />
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
          className="w-full text-sm p-2 border border-gray-800 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 opacity-80"
          aria-required={field.required}
        />
      </div>
    );
  };

  const renderSingleField = (field) => {
    const value = singleFormData[field.name] || "";
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
            className="w-full text-sm p-2 border border-gray-800 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 opacity-80"
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
    if (field.type === "textarea") {
      return (
        <div key={field.name} className="mb-4">
          <label
            htmlFor={field.name}
            className="block text-xs font-medium text-gray-800 mb-1"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id={field.name}
            name={field.name}
            value={value}
            onChange={handleSingleInputChange}
            placeholder={field.placeholder}
            className="w-full text-sm p-2 border border-gray-800 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 opacity-80"
            aria-required={field.required}
          />
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
          min={field.min}
          className="w-full text-sm p-2 border border-gray-800 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 opacity-80"
          aria-required={field.required}
        />
      </div>
    );
  };

  return (
    <div className="mx-auto p-4">
      <h2 className="text-lg font-medium mb-6 text-gray-800">{title}</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        {singleFields.map((field) => renderSingleField(field))}
        {showRepeatableFields && (
          <>
            {formEntries.map((entry) => (
              <div key={entry.id} className="mb-4 p-4 bg-gray-100 shadow rounded">
                {formEntries.length > 1 && (
                  <div className="flex items-center justify-end mb-4">
                    <button
                      type="button"
                      onClick={() => removeFormBlock(entry.id)}
                      className="bg-red-400 text-white px-4 py-2 text-sm rounded hover:bg-red-500 transition-colors duration-200 flex items-center"
                    >
                      <Trash size={18} className="mr-2" /> Remove
                    </button>
                  </div>
                )}
                {fields.map((field) => renderField(field, entry.id))}
              </div>
            ))}
            <button
              type="button"
              onClick={addFormBlock}
              className="bg-green-500 text-white px-4 py-2 text-sm rounded hover:bg-green-600 transition-colors duration-200 flex items-center mb-4"
            >
              <Plus size={18} className="mr-2" /> Add Item
            </button>
          </>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-500 text-white px-4 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
        >
          {isEditing ? "Update" : "Save"}
        </button>
      </form>
    </div>
  );
};

CRMManager.propTypes = {
  apiBaseUrl: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      min: PropTypes.number,
      options: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  singleFields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      min: PropTypes.number,
      options: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  showRepeatableFields: PropTypes.bool, 
};

export default CRMManager;