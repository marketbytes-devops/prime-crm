import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus, Trash, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import ClientSelectionModal from "../../../components/ClientSelectionModal.jsx";

const AddRFQ = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { rfqData = {}, isEditing = false } = location.state || {};
  const [showClientModal, setShowClientModal] = useState(
    !rfqData.company_name && !isEditing && !id
  );
  const [rfqChannels, setRfqChannels] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialRfqData, setInitialRfqData] = useState(rfqData);
  const [currentStep, setCurrentStep] = useState(1);
  const [includeItems, setIncludeItems] = useState(false);
  const [includeProducts, setIncludeProducts] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    reference: "",
    address: "",
    phone: "",
    email: "",
    rfq_channel: "",
    attention_name: "",
    attention_phone: "",
    attention_email: "",
    due_date: "",
    assign_to: "",
    items: [{ id: Date.now(), item_name: "", product_name: "", quantity: "", unit: "" }],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRfqChannels = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/rfq-channels/");
        setRfqChannels(response.data.map((channel) => channel.channel_name));
      } catch (err) {
        console.error("Failed to fetch RFQ channels:", err.response || err.message);
        setError("Failed to load RFQ channels.");
        setRfqChannels([]);
      }
    };

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
            email: member.email,
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

    const fetchRfqData = async () => {
      if (id) {
        try {
          const response = await apiClient.get(`/add-rfqs/${id}/`);
          const data = {
            ...response.data,
            assign_to: response.data.assign_to ? String(response.data.assign_to) : "",
            due_date: response.data.due_date || "",
            items: response.data.items?.map((item, index) => ({
              id: Date.now() + index,
              item_name: item.item_name || "",
              product_name: item.product_name || "",
              quantity: item.quantity || "",
              unit: item.unit || "",
            })) || [{ id: Date.now(), item_name: "", product_name: "", quantity: "", unit: "" }],
          };
          setInitialRfqData(data);
          setFormData(data);
          setIncludeItems(data.items.some((item) => item.item_name));
          setIncludeProducts(data.items.some((item) => item.product_name));
        } catch (err) {
          console.error("Failed to fetch RFQ data:", err.response || err.message);
          setError("Failed to load RFQ data.");
        }
      }
    };

    Promise.all([
      fetchRfqChannels(),
      fetchItems(),
      fetchProducts(),
      fetchUnits(),
      fetchTeamMembers(),
      fetchRfqData(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [id]);

  const handleClientSelect = (type) => {
    setShowClientModal(false);
    if (type === "existing") {
      navigate("/pre-job/existing-client");
    }
  };

  const handleInputChange = (e, entryId) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newItems = prev.items.map((item) =>
        item.id === entryId ? { ...item, [name]: value } : item
      );
      return { ...prev, items: newItems };
    });
  };

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    const fields = [
      { name: "company_name", label: "Company Name", required: true },
      { name: "address", label: "Address", required: true },
      { name: "phone", label: "Phone", required: true },
      { name: "email", label: "Email", required: true },
    ];
    for (const field of fields) {
      if (field.required && !formData[field.name]) {
        return `${field.label} is required`;
      }
    }
    return null;
  };

  const validateEntry = (entry) => {
    if (includeItems && !entry.item_name) {
      return "Item is required";
    }
    if (includeProducts && !entry.product_name) {
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

    const combinedData = {
      ...formData,
      assign_to: formData.assign_to ? parseInt(formData.assign_to) : null,
      items: formData.items.map((item) => ({
        item_name: item.item_name || "",
        product_name: item.product_name || "",
        quantity: item.quantity || "",
        unit: item.unit || "",
      })),
    };

    try {
      if (isEditing && initialRfqData?.id) {
        await apiClient.put(`/add-rfqs/${initialRfqData.id}/`, combinedData);
        toast.success("RFQ updated successfully!");
      } else {
        await apiClient.post("/add-rfqs/", combinedData);
        toast.success("RFQ saved successfully!");
      }
      navigate("/pre-job/view-rfq");
    } catch (error) {
      console.error("Error submitting to /add-rfq/:", error.response?.data || error.message);
      toast.error(
        `Failed to save RFQ: ${
          error.response?.data?.message || "Please check the required fields."
        }`
      );
      setIsSubmitting(false);
    }
  };

  const companyFields = [
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
      type: "select",
      required: false,
      options: rfqChannels,
      placeholder: "Select RFQ Channel",
    },
  ];

  const attentionFields = [
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
  ];

  const stepTwoFields = [
    {
      name: "due_date",
      label: "Due Date",
      type: "date",
      required: false,
      placeholder: "Select Due Date",
    },
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
          disabled={false}
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
          disabled={false}
          className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          aria-required={field.required}
        />
      </div>
    );
  };

  if (loading || itemsLoading || productsLoading || unitsLoading || teamMembersLoading) {
    return <p>Loading data...</p>;
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="container mx-auto p-4 bg-blue-50 min-h-screen">
      {showClientModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <ClientSelectionModal
            onClose={() => setShowClientModal(false)}
            onSelect={handleClientSelect}
          />
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
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
          <h1 className="text-lg font-medium text-gray-800">
            {isEditing ? "Edit RFQ" : "Add RFQ"}
          </h1>
        </div>
      </div>
      <div className="mx-auto p-4 bg-white rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="mb-6">
          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {[...companyFields, ...attentionFields].map((field) => renderSingleField(field))}
            </div>
          )}
          {currentStep === 2 && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-4">
                {stepTwoFields.map((field) => renderSingleField(field))}
              </div>
              <div className="mb-4">
                <label className="mr-4">
                  <input
                    type="checkbox"
                    checked={includeItems}
                    onChange={(e) => setIncludeItems(e.target.checked)}
                    className="mr-2"
                  />
                  Include Items
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={includeProducts}
                    onChange={(e) => setIncludeProducts(e.target.checked)}
                    className="mr-2"
                  />
                  Include Products
                </label>
              </div>
              {(includeItems || includeProducts) && (
                <>
                  {formData.items.map((entry) => (
                    <div
                      key={entry.id}
                      className="mb-4 p-4 bg-gray-100 rounded grid grid-cols-3 gap-4"
                    >
                      {includeItems && renderEntryField(
                        {
                          name: "item_name",
                          label: "Item",
                          type: "select",
                          required: true,
                          placeholder: "Select Item",
                          options: items,
                        },
                        entry.id
                      )}
                      {includeProducts && renderEntryField(
                        {
                          name: "product_name",
                          label: "Product",
                          type: "select",
                          required: true,
                          placeholder: "Select Product",
                          options: products,
                        },
                        entry.id
                      )}
                      {renderEntryField(
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
                      {renderEntryField(
                        {
                          name: "unit",
                          label: "Unit",
                          type: "select",
                          required: true,
                          placeholder: "Select Unit",
                          options: units,
                        },
                        entry.id
                      )}
                      {formData.items.length > 1 && (
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
                    <Plus size= "18" className="mr-2" /> Add Entry
                  </button>
                </>
              )}
              {initialRfqData?.due_date && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-800">
                    Due Date: {new Date(initialRfqData.due_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {initialRfqData?.assign_to && teamMembers.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-800">
                    Assigned To:{" "}
                    {
                      teamMembers.find(
                        (member) => member.value === parseInt(initialRfqData.assign_to)
                      )?.label
                    }
                    (Email:{" "}
                    {teamMembers.find(
                      (member) => member.value === parseInt(initialRfqData.assign_to)
                    )?.email || "Not available"}
                    )
                  </p>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end mt-4">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
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
    </div>
  );
};

export default AddRFQ;