import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Plus, Trash, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

const CRMManager = ({
  apiBaseUrl,
  fields,
  singleFields = [],
  title = "",
  initialData = null,
  isEditing = false,
  showRepeatableFields = true,
  currentStep = 1,
  totalSteps = 1,
  formData,
  onInputChange,
  onSingleInputChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  redirectPath = "/pre-job/view-rfq",
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEntry = (item) => {
    for (const field of fields) {
      if (field.required && !item[field.name]) {
        return `${field.label} is required`;
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
    return null;
  };

  const validateSingleFields = () => {
    for (const field of singleFields) {
      if (field.required && !formData[field.name]) {
        return `${field.label} is required`;
      }
      if (field.type === "number" && formData[field.name]) {
        const num = parseFloat(formData[field.name]);
        if (isNaN(num)) {
          return `${field.label} must be a valid number`;
        }
        if (num < field.min) {
          return `${field.label} must be at least ${field.min}`;
        }
      }
    }
    return null;
  };

  const renderField = (field, entryId) => {
    const item = formData.items.find((i) => i.id === entryId) || {};
    const value = item[field.name] || "";
    const options = field.options || [];

    if (field.type === "select") {
      return (
        <div key={`${field.name}-${entryId}`} className="mb-4">
          <label
            htmlFor={`${field.name}-${entryId}`}
            className="block text-xs font-medium text-black mb-1"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            id={`${field.name}-${entryId}`}
            name={field.name}
            value={value}
            onChange={(e) => onInputChange(e, entryId)}
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
      <div key={`${field.name}-${entryId}`} className="mb-4">
        <label
          htmlFor={`${field.name}-${entryId}`}
          className="block text-xs font-medium text-black mb-1"
        >
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={`${field.name}-${entryId}`}
          type={field.type}
          name={field.name}
          value={value}
          onChange={(e) => onInputChange(e, entryId)}
          placeholder={field.placeholder}
          min={field.min}
          step={field.type === "number" ? "1" : undefined}
          className="w-full text-sm p-2 border border-gray-400 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  const renderSingleField = (field) => {
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
            onChange={onSingleInputChange}
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
          onChange={onSingleInputChange}
          placeholder={field.placeholder}
          min={field.min}
          step={field.type === "number" ? "1" : undefined}
          className="w-full text-sm p-2 border border-gray-400 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const singleValidationError = validateSingleFields();
    if (singleValidationError) {
      toast.error(singleValidationError);
      setIsSubmitting(false);
      return;
    }

    if (showRepeatableFields) {
      for (const item of formData.items) {
        const validationError = validateEntry(item);
        if (validationError) {
          toast.error(validationError);
          setIsSubmitting(false);
          return;
        }
      }
      if (formData.items.length === 0 || !formData.items.some((item) => item.item_name || item.quantity || item.unit)) {
        toast.error("Please add at least one valid item.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (isEditing && initialData?.id) {
        await apiClient.put(`${apiBaseUrl}${initialData.id}/`, formData);
        toast.success("RFQ updated successfully!");
      } else {
        await apiClient.post(apiBaseUrl, formData);
        toast.success("RFQ created successfully!");
      }
      navigate(redirectPath);
    } catch (error) {
      console.error(`Error submitting to ${apiBaseUrl}:`, error.response?.data || error.message);
      toast.error("Failed to save RFQ. Please check the required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto p-4 bg-white rounded-lg shadow-sm">
      <style>
        {`
          input, select, textarea {
            pointer-events: auto !important;
          }
        `}
      </style>
      {title && <h2 className="text-lg font-medium text-black mb-4">{title}</h2>}
      <form onSubmit={onSubmit || handleFormSubmit} className="mb-4">
        {currentStep === 1 && singleFields.map((field) => renderSingleField(field))}
        {currentStep === 2 && (
          <>
            {singleFields.length > 0 && (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {singleFields.map((field) => renderSingleField(field))}
              </div>
            )}
            {showRepeatableFields && (
              <>
                {formData.items.map((item) => (
                  <div
                    key={item.id}
                    className="mb-4 p-3 bg-gray-100 border border-gray-400 rounded grid grid-cols-1 md:grid-cols-3 gap-3"
                  >
                    {fields.map((field) => renderField(field, item.id))}
                    {formData.items.length > 1 && (
                      <div className="-mt-4 flex items-center justify-end md:col-span-3">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="bg-red-500 text-white hover:bg-red-600 px-3 py-2 text-sm rounded transition-colors duration-200 flex items-center"
                        >
                          <Trash size="16" className="mr-1" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={onAddItem}
                  className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 flex items-center mb-3"
                >
                  <Plus size="16" className="mr-1" /> Add Item
                </button>
              </>
            )}
          </>
        )}
        <div className="flex justify-end mt-4">
          {currentStep === 1 && totalSteps > 1 ? (
            <button
              type="button"
              onClick={() => onSubmit()}
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
      step: PropTypes.number,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  singleFields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      min: PropTypes.number,
      step: PropTypes.number,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
    })
  ),
  title: PropTypes.string,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  showRepeatableFields: PropTypes.bool,
  currentStep: PropTypes.number,
  totalSteps: PropTypes.number,
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onSingleInputChange: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  redirectPath: PropTypes.string,
};

export default CRMManager;