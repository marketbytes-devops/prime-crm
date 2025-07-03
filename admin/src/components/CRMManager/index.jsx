import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Plus, Trash, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "../../helpers/apiClient";

const CRMManager = ({
  apiBaseUrl,
  fields,
  singleFields = [],
  title = "",
  initialData = null,
  isEditing = false,
  showRepeatableFields = true,
  currentStep = 2,
  onNext = () => {},
  totalSteps = 2,
  children,
  onInputChange,
  onSingleInputChange,
  formData,
  onSubmit,
  redirectPath = "/pre-job/view-rfq",
}) => {
  const navigate = useNavigate();
  const [formEntries, setFormEntries] = useState(
    initialData?.items && Array.isArray(initialData?.items)
      ? initialData.items.map((item, index) => ({
          id: item.id || Date.now() + index,
          data: item,
        }))
      : [{ id: Date.now(), data: {} }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [singleFieldOptions, setSingleFieldOptions] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      const options = {};
      for (const field of fields) {
        if (field.searchEndpoint) {
          try {
            const response = await apiClient.get(field.searchEndpoint);
            options[field.name] = response.data
              .map((item) => ({
                label: item[field.optionLabel] || item.name,
                value: item[field.optionValue] || item.name,
              }))
              .sort((a, b) => a.label.localeCompare(b.label));
          } catch (err) {
            console.error(`Failed to fetch options for ${field.name}:`, err);
            options[field.name] = [];
          }
        } else {
          options[field.name] = field.options || [];
        }
      }
      setDropdownOptions(options);
    };
    if (currentStep === 2 && fields.length > 0) fetchDropdownOptions();
  }, [fields, currentStep]);

  useEffect(() => {
    const fetchSingleFieldOptions = async () => {
      const options = {};
      for (const field of singleFields) {
        if (field.searchEndpoint) {
          try {
            const response = await apiClient.get(field.searchEndpoint);
            options[field.name] = response.data
              .map((item) => ({
                label: item[field.optionLabel] || item.name,
                value: item[field.optionValue] || item.name,
              }))
              .sort((a, b) => a.label.localeCompare(b.label));
          } catch (err) {
            console.error(`Failed to fetch options for ${field.name}:`, err);
            options[field.name] = [];
          }
        } else {
          options[field.name] = field.options || [];
        }
      }
      setSingleFieldOptions(options);
    };
    if (singleFields.length > 0) fetchSingleFieldOptions();
  }, [singleFields]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-container")) setActiveDropdown(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const validateEntry = (entry) => {
    for (const field of fields) {
      if (field.required && !entry.data[field.name]) return `${field.label} is required`;
      if (field.type === "number" && entry.data[field.name] && parseFloat(entry.data[field.name]) < field.min) {
        return `${field.label} must be at least ${field.min}`;
      }
    }
    return null;
  };

  const validateSingleFields = () => {
    for (const field of singleFields) {
      if (field.required && !formData[field.name]) return `${field.label} is required`;
      if (field.type === "number" && formData[field.name] && parseFloat(formData[field.name]) < field.min) {
        return `${field.label} must be at least ${field.min}`;
      }
    }
    return null;
  };

  const addFormBlock = () => {
    const newId = Date.now();
    setFormEntries((prev) => [...prev, { id: newId, data: {} }]);
    onInputChange(null, newId, {});
  };

  const removeFormBlock = (entryId) => {
    if (formEntries.length === 1) {
      toast.error("At least one form entry is required");
      return;
    }
    setFormEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    onInputChange(null, entryId, null, true);
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
      ? formEntries
          .map((entry) => ({ ...entry.data }))
          .filter((data) => Object.keys(data).length > 0)
      : [];

    if (showRepeatableFields && itemsData.length === 0) {
      toast.error("Please add at least one entry.");
      setIsSubmitting(false);
      return;
    }

    const combinedData = { ...formData, items: itemsData };

    try {
      if (isEditing && initialData?.id) {
        await apiClient.put(`${apiBaseUrl}${initialData.id}/`, combinedData);
        toast.success("Data updated successfully!");
      } else {
        await apiClient.post(apiBaseUrl, combinedData);
        toast.success("Data saved successfully!");
      }
      navigate(redirectPath, { state: { refresh: true } });
    } catch (error) {
      console.error(`Error submitting to ${apiBaseUrl}:`, error.response?.data || error.message);
      toast.error("Failed to save data. Please check the required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field, entryId) => {
    const entry = formEntries.find((e) => e.id === entryId);
    const value = entry?.data[field.name] || "";
    const options = dropdownOptions[field.name] || [];

    if (field.type === "select") {
      return (
        <div key={`${field.name}-${entryId}`} className="mb-4 relative dropdown-container">
          <label htmlFor={`${field.name}-${entryId}`} className="block text-xs font-medium text-black mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            id={`${field.name}-${entryId}`}
            name={field.name}
            value={value}
            onChange={(e) => onInputChange(e, entryId)}
            onFocus={() => setActiveDropdown(`${field.name}-${entryId}`)}
            placeholder={field.placeholder}
            className="w-full text-sm p-2 border border-gray-300 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          />
          {activeDropdown === `${field.name}-${entryId}` && options.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
              {options.map((option) => (
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
    return (
      <div key={`${field.name}-${entryId}`} className="mb-4">
        <label htmlFor={`${field.name}-${entryId}`} className="block text-xs font-medium text-black mb-1">
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
          className="w-full text-sm p-2 border border-gray-300 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  const renderSingleField = (field) => {
    const value = formData[field.name] || "";
    const options = singleFieldOptions[field.name] || [];

    if (field.type === "select") {
      return (
        <div key={field.name} className="mb-4 relative dropdown-container">
          <label htmlFor={field.name} className="block text-xs font-medium text-black mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={value}
            onChange={onSingleInputChange}
            onFocus={() => setActiveDropdown(field.name)}
            placeholder={field.placeholder}
            className="w-full text-sm p-2 border border-gray-300 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            aria-required={field.required}
          />
          {activeDropdown === field.name && options.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
              {options.map((option) => (
                <li
                  key={option.value}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onSingleInputChange({ target: { name: field.name, value: option.value } });
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
          className="w-full text-sm p-2 border border-gray-300 rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  return (
    <div className="mx-auto p-4 bg-transparent rounded-lg shadow-sm">
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
      {title && <h2 className="text-lg font-medium mb-4 text-black">{title}</h2>}
      <form onSubmit={onSubmit || handleSubmit} className="mb-4">
        {currentStep === 1 && singleFields.map((field) => renderSingleField(field))}
        {currentStep === 2 && (
          <>
            {singleFields.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                {singleFields.map((field) => renderSingleField(field))}
              </div>
            )}
            {showRepeatableFields && (
              <>
                {formEntries.map((entry) => (
                  <div key={entry.id} className="mb-3 p-3 bg-gray-100 rounded grid grid-cols-3 gap-3">
                    {fields.map((field) => renderField(field, entry.id))}
                    {formEntries.length > 1 && (
                      <div className="flex items-center justify-end col-span-3">
                        <button
                          type="button"
                          onClick={() => removeFormBlock(entry.id)}
                          className="bg-black text-white px-3 py-2 text-sm rounded hover:bg-gray-800 transition-colors duration-200 flex items-center"
                        >
                          <Trash size="16" className="mr-1" /> Remove
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
                  <Plus size="16" className="mr-1" /> Add Item
                </button>
              </>
            )}
          </>
        )}
        {children}
        <div className="flex justify-end mt-4">
          {currentStep === 1 && totalSteps > 1 ? (
            <button
              type="button"
              onClick={onNext}
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
      options: PropTypes.arrayOf(PropTypes.string),
      searchEndpoint: PropTypes.string,
      optionLabel: PropTypes.string,
      optionValue: PropTypes.string,
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
      options: PropTypes.arrayOf(PropTypes.string),
      searchEndpoint: PropTypes.string,
      optionLabel: PropTypes.string,
      optionValue: PropTypes.string,
    })
  ),
  title: PropTypes.string,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  showRepeatableFields: PropTypes.bool,
  currentStep: PropTypes.number,
  onNext: PropTypes.func,
  totalSteps: PropTypes.number,
  children: PropTypes.node,
  onInputChange: PropTypes.func.isRequired,
  onSingleInputChange: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
  redirectPath: PropTypes.string,
};

export default CRMManager;