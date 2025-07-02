import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Plus, Trash, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from '../../helpers/apiClient';

const CRMManager = ({
  apiBaseUrl,
  fields,
  title,
  singleFields = [],
  initialData = null,
  isEditing = false,
  showRepeatableFields = true,
  currentStep,
  onNext,
  totalSteps,
  children,
  onInputChange,
  onSingleInputChange,
  formData,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const [formEntries, setFormEntries] = useState(
    initialData?.items && Array.isArray(initialData?.items)
      ? initialData.items.map((item, index) => ({
          id: Date.now() + index,
          data: {
            item_name: item.item_name || "",
            product_name: item.product_name || "",
            quantity: item.quantity || "",
            unit: item.unit || "",
          },
        }))
      : [{ id: Date.now(), data: {} }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null); // Track active dropdown

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      const options = {};
      for (const field of fields) {
        if (field.searchEndpoint) {
          try {
            console.log(`Fetching options for ${field.name} from ${field.searchEndpoint}`);
            const response = await apiClient.get(field.searchEndpoint);
            options[field.name] = response.data
              .map((item) => ({
                label: item[field.optionLabel] || item.name,
                value: item[field.optionValue] || item.name,
              }))
              .sort((a, b) => a.label.localeCompare(b.label));
          } catch (err) {
            console.error(`Failed to fetch options for ${field.name}:`, err);
          }
        } else {
          options[field.name] = field.options || [];
        }
      }
      setDropdownOptions(options);
    };
    if (currentStep === 2 && fields.length > 0) fetchDropdownOptions();
  }, [fields, currentStep]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-container")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
      if (field.required && !formData[field.name]) {
        return `${field.label} is required`;
      }
      if (field.type === "number" && formData[field.name]) {
        const value = parseFloat(formData[field.name]);
        if (field.min !== undefined && value < field.min) {
          return `${field.label} must be at least ${field.min}`;
        }
      }
    }
    return null;
  };

  const addFormBlock = () => {
    const newId = Date.now();
    setFormEntries((prev) => [...prev, { id: newId, data: {} }]);
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: newId, item_name: "", product_name: "", quantity: "", unit: "" }],
    }));
  };

  const removeFormBlock = (entryId) => {
    if (formEntries.length === 1) {
      toast.error("At least one form entry is required");
      return;
    }
    setFormEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== entryId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("HandleSubmit triggered");
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
      ? formEntries
          .map((entry) => ({
            ...entry.data,
          }))
          .filter((data) => Object.keys(data).length > 0)
      : [];

    if (showRepeatableFields && itemsData.length === 0) {
      toast.error("Please add at least one item or product.");
      setIsSubmitting(false);
      return;
    }

    const combinedData = {
      ...formData,
      assign_to: formData.assign_to ? parseInt(formData.assign_to) : null,
      items: itemsData,
    };

    try {
      console.log("Submitting data to /add-rfqs/:", combinedData);
      if (isEditing && initialData?.id) {
        await apiClient.put(`${apiBaseUrl}${initialData.id}/`, combinedData);
        toast.success("RFQ updated!");
      } else {
        await apiClient.post(apiBaseUrl, combinedData);
        toast.success("RFQ saved!");
      }
      navigate("/pre-job/view-rfq");
    } catch (error) {
      console.error("Error submitting to /add-rfqs/:", error.response?.data || error.message);
      toast.error("Failed to save RFQ. Please check the required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field, entryId) => {
    const entry = formEntries.find((e) => e.id === entryId);
    const value = entry?.data[field.name] || "";
    const options = dropdownOptions[field.name] || field.options || [];

    if (field.type === "select" && field.searchEndpoint) {
      const filteredOptions = options
        .filter((option) => option.label.toLowerCase().includes(value.toLowerCase()))
        .sort((a, b) => a.label.localeCompare(b.label));

      return (
        <div key={field.name} className="mb-4 relative dropdown-container">
          <label
            htmlFor={`${field.name}-${entryId}`}
            className="block text-xs font-medium text-gray-800 mb-1"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            id={`${field.name}-${entryId}`}
            name={field.name}
            value={value}
            onChange={(e) => {
              console.log("Input event:", e.target.name, e.target.value, entryId);
              onInputChange(e, entryId);
              setActiveDropdown(`${field.name}-${entryId}`);
            }}
            onFocus={() => setActiveDropdown(`${field.name}-${entryId}`)}
            placeholder={field.placeholder}
            disabled={false}
            className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          />
          {activeDropdown === `${field.name}-${entryId}` && value && filteredOptions.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
              {filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onInputChange({ target: { name: field.name, value: option.value } }, entryId);
                    setActiveDropdown(null);
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    if (field.type === "select" && !field.searchEndpoint) {
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
            value={value || ""}
            onChange={(e) => {
              console.log("Select change:", { name: field.name, value: e.target.value, entryId });
              onInputChange(e, entryId);
            }}
            disabled={false}
            className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          >
            <option value="" disabled>
              {field.placeholder}
            </option>
            {options.map((option, index) => (
              <option
                key={index}
                value={field.optionValues ? field.optionValues[index] : option}
              >
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
            onChange={(e) => onInputChange(e, entryId)}
            placeholder={field.placeholder}
            disabled={false}
            className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
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
          value={value || ""}
          onChange={(e) => {
            console.log("Input event:", e.target.name, e.target.value, entryId);
            onInputChange(e, entryId);
          }}
          placeholder={field.placeholder}
          min={field.min}
          disabled={false}
          className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
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
            onChange={onSingleInputChange}
            disabled={false}
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
            onChange={onSingleInputChange}
            placeholder={field.placeholder}
            disabled={false}
            className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
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
          onChange={onSingleInputChange}
          placeholder={field.placeholder}
          min={field.min}
          disabled={false}
          className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  return (
    <div className="mx-auto p-4 bg-white rounded-lg shadow-md">
      <style>
        {`
          .dropdown-container {
            position: relative;
          }
          input, select, textarea {
            pointer-events: auto !important;
          }
          ul {
            z-index: 20;
          }
        `}
      </style>
      {title && <h2 className="text-lg font-medium mb-6 text-gray-800">{title}</h2>}
      <form onSubmit={onSubmit || handleSubmit} className="mb-6">
        {currentStep === 1 &&
          singleFields.map((field) => renderSingleField(field))}
        {currentStep === 2 && (
          <>
            {singleFields.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-4">
                {singleFields.map((field) => renderSingleField(field))}
              </div>
            )}
            {showRepeatableFields && (
              <>
                {formEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="mb-4 p-4 bg-gray-100 rounded grid grid-cols-3 gap-4"
                  >
                    {fields.map((field) => renderField(field, entry.id))}
                    {formEntries.length > 1 && (
                      <div className="flex items-center justify-end col-span-3">
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
                  className="bg-green-500 text-white px-4 py-2 text-sm rounded hover:bg-green-600 transition-colors duration-200 flex items-center mb-4"
                >
                  <Plus size={18} className="mr-2" /> Add Item
                </button>
              </>
            )}
          </>
        )}
        {children}
        <div className="flex justify-end mt-4">
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onNext(e);
              }}
              disabled={isSubmitting}
              className="bg-indigo-500 text-white px-4 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center"
            >
              Next <ArrowRight size={18} className="ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-500 text-white px-4 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          )}
        </div>
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
      searchEndpoint: PropTypes.string,
      optionLabel: PropTypes.string,
      optionValue: PropTypes.string,
      optionValues: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
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
  currentStep: PropTypes.number,
  onNext: PropTypes.func,
  totalSteps: PropTypes.number,
  children: PropTypes.node,
  onInputChange: PropTypes.func,
  onSingleInputChange: PropTypes.func,
  formData: PropTypes.object,
  onSubmit: PropTypes.func,
};

export default CRMManager;