import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import CRMManager from "../../../components/CRMManager";
import ClientSelectionModal from "../../../components/ClientSelectionModal.jsx";
import { toast } from "react-toastify";

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
  const [formData, setFormData] = useState({ items: [] });

  useEffect(() => {
    const fetchRfqChannels = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/rfq-channels/");
        setRfqChannels(response.data.map((channel) => channel.channel_name));
      } catch (err) {
        console.error(
          "Failed to fetch RFQ channels:",
          err.response || err.message
        );
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
        console.error(
          "Failed to fetch team members:",
          err.response || err.message
        );
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
            assign_to: response.data.assign_to
              ? String(response.data.assign_to)
              : "",
            due_date: response.data.due_date || "",
          };
          setInitialRfqData(data);
          setFormData(data);
          if (response.data.items) {
            setIncludeItems(response.data.items.some((item) => item.item_name));
            setIncludeProducts(
              response.data.items.some((item) => item.product_name)
            );
            setFormData((prev) => ({
              ...prev,
              items: response.data.items.map((item, index) => ({
                id: Date.now() + index,
                item_name: item.item_name || "",
                product_name: item.product_name || "",
                quantity: item.quantity || "",
                unit: item.unit || "",
              })),
            }));
          }
        } catch (err) {
          console.error(
            "Failed to fetch RFQ data:",
            err.response || err.message
          );
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
      options: loading ? [] : rfqChannels,
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
      options: teamMembersLoading
        ? []
        : teamMembers.map((member) => member.label),
      optionValues: teamMembersLoading
        ? []
        : teamMembers.map((member) => member.value),
    },
  ];

  const baseFields = [
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      required: true,
      placeholder: "Enter Quantity",
      min: 1,
    },
    {
      name: "unit",
      label: "Unit",
      type: "select",
      required: true,
      placeholder: "Select Unit",
      options: unitsLoading ? [] : units,
    },
  ];

  const itemFields = includeItems
    ? [
        {
          name: "item_name",
          label: "Item",
          type: "select",
          required: true,
          placeholder: "Select Item",
          options: itemsLoading ? [] : items,
        },
        ...baseFields,
      ]
    : [];

  const productFields = includeProducts
    ? [
        {
          name: "product_name",
          label: "Product",
          type: "select",
          required: true,
          placeholder: "Select Product",
          options: productsLoading ? [] : products,
        },
        ...baseFields,
      ]
    : [];

  const currentFields = [...itemFields, ...productFields];

  const handleInputChange = (e, entryId) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newItems = prev.items.map((item) =>
        item.id === entryId ? { ...item, [name]: value } : item
      );
      if (!newItems.some((item) => item.id === entryId)) {
        newItems.push({ id: entryId, [name]: value });
      }
      return { ...prev, items: newItems };
    });
  };

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (
    loading ||
    itemsLoading ||
    productsLoading ||
    unitsLoading ||
    teamMembersLoading
  )
    return <p>Loading data...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

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
            Add Company Details
          </h1>
        </div>
        <div className="flex items-center">
          <span className="mr-4 text-gray-800">prime</span>
          <Link to="/logout" className="text-blue-500 hover:underline">
            Logout
          </Link>
        </div>
      </div>
      <CRMManager
        apiBaseUrl="/add-rfqs/"
        fields={currentFields}
        title=""
        singleFields={
          currentStep === 1
            ? [...companyFields, ...attentionFields]
            : stepTwoFields
        }
        initialData={initialRfqData}
        isEditing={isEditing || !!id}
        showRepeatableFields={currentStep === 2}
        currentStep={currentStep}
        onNext={(e) => {
          e.preventDefault();
          setCurrentStep(2);
        }}
        totalSteps={2}
        onInputChange={handleInputChange}
        onSingleInputChange={handleSingleInputChange}
        formData={formData}
        onSubmit={async (e) => {
          e.preventDefault();
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
              await apiClient.put(
                `/add-rfqs/${initialRfqData.id}/`,
                combinedData
              );
              toast.success("RFQ updated successfully!");
            } else {
              const response = await apiClient.post("/add-rfqs/", combinedData);
              toast.success("RFQ saved successfully!");
              console.log("RFQ saved response:", response.data);
            }
            navigate("/pre-job/view-rfq");
          } catch (error) {
            console.error(
              "Error submitting to /add-rfq/:",
              error.response?.data || error.message
            );
            toast.error(
              `Failed to save RFQ: ${
                error.response?.data?.message ||
                "Please check the required fields."
              }`
            );
          }
        }}
      >
        {currentStep === 2 && (
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
        )}
        {currentStep === 2 && initialRfqData?.due_date && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-800">
              Due Date: {new Date(initialRfqData.due_date).toLocaleDateString()}
            </p>
          </div>
        )}
        {currentStep === 2 &&
          initialRfqData?.assign_to &&
          teamMembers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-800">
                Assigned To:{" "}
                {
                  teamMembers.find(
                    (member) =>
                      member.value === parseInt(initialRfqData.assign_to)
                  )?.label
                }
                (Email:{" "}
                {teamMembers.find(
                  (member) =>
                    member.value === parseInt(initialRfqData.assign_to)
                )?.email || "Not available here"}
                )
              </p>
            </div>
          )}
      </CRMManager>
    </div>
  );
};

export default AddRFQ;
