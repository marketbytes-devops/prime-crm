import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import CRMManager from "../../../components/CRMManager";
import ClientSelectionModal from "../../../components/ClientSelectionModal.jsx";
import ExistingClientModal from "../../../components/ExistingClientModal";
import ExistingClient from "../../../components/ExistingClient/ExistingClient.jsx";

const AddRFQ = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { rfqData = {}, isEditing = false } = location.state || {};
  const [showClientModal, setShowClientModal] = useState(!rfqData.company_name && !isEditing && !id);
  const [showExistingClientModal, setShowExistingClientModal] = useState(false);
  const [rfqChannels, setRfqChannels] = useState([]);
  const [items, setItems] = useState([]); // New state for items
  const [products, setProducts] = useState([]); // New state for products
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialRfqData, setInitialRfqData] = useState(rfqData);
  const [currentStep, setCurrentStep] = useState(1);
  const [includeItems, setIncludeItems] = useState(false);
  const [includeProducts, setIncludeProducts] = useState(false);

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
        setItems(response.data.map((item) => item.name)); // Assuming 'name' is the field
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
        setProducts(response.data.map((product) => product.name)); // Assuming 'name' is the field
      } catch (err) {
        console.error("Failed to fetch products:", err.response || err.message);
        setError("Failed to load products.");
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    const fetchRfqData = async () => {
      if (id) {
        try {
          const response = await apiClient.get(`/add-rfqs/${id}/`);
          setInitialRfqData(response.data);
          if (response.data.items) {
            setIncludeItems(response.data.items.some((item) => item.item_name));
            setIncludeProducts(response.data.items.some((item) => item.product_name));
          }
        } catch (err) {
          console.error("Failed to fetch RFQ data:", err.response || err.message);
          setError("Failed to load RFQ data.");
        }
      }
    };

    Promise.all([fetchRfqChannels(), fetchItems(), fetchProducts(), fetchRfqData()]).finally(() => {
      setLoading(false);
    });
  }, [id]);

  const handleClientSelect = (type) => {
    setShowClientModal(false);
    if (type === "existing") {
      setShowExistingClientModal(true);
    }
  };

  const companyAttentionFields = [
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
      searchEndpoint: "/units/",
      optionLabel: "name",
      optionValue: "name",
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
          options: itemsLoading ? [] : items, // Use fetched items as options
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
          options: productsLoading ? [] : products, // Use fetched products as options
        },
        ...baseFields,
      ]
    : [];

  const currentFields = [...itemFields, ...productFields];

  if (location.pathname === "/pre-job/existing-client") {
    return <ExistingClient />;
  }

  if (loading || itemsLoading || productsLoading) return <p>Loading data...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="container mx-auto p-4 relative">
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ClientSelectionModal
            onClose={() => setShowClientModal(false)}
            onSelect={handleClientSelect}
          />
        </div>
      )}
      {showExistingClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ExistingClientModal
            onClose={() => setShowExistingClientModal(false)}
          />
        </div>
      )}
      <CRMManager
        apiBaseUrl="/add-rfqs/"
        fields={currentFields}
        title={isEditing || id ? "Edit Company Details" : "Add Company Details"}
        singleFields={currentStep === 1 ? companyAttentionFields : []}
        initialData={initialRfqData}
        isEditing={isEditing || !!id}
        showRepeatableFields={currentStep === 2}
        currentStep={currentStep}
        onNext={(e) => {
          e.preventDefault();
          setCurrentStep(2);
        }}
        totalSteps={2}
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
      </CRMManager>
    </div>
  );
};

export default AddRFQ;