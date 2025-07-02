import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ViewCard from "../../../components/ViewCard";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";

const ViewRFQ = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfqData, setRfqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRfqData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/add-rfqs/${id}/`);
        const data = {
          ...response.data,
          si_no: 1, // Single RFQ, so SI No is 1
          rfq_no: `RFQ-${String(response.data.id).padStart(3, '0')}`,
          current_status: response.data.due_date && new Date(response.data.due_date) < new Date()
            ? "Completed"
            : "Processing",
          items: response.data.items || [], // Ensure items array is present
        };
        setRfqData(data);
      } catch (err) {
        console.error("Failed to fetch RFQ data:", err);
        setError("Failed to load RFQ.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRfqData();
  }, [id]);

  const tableFields = [
    { name: "si_no", label: "SI No" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "due_date", label: "Due Date", type: "date" },
    { name: "rfq_no", label: "RFQ No" },
    { name: "assign_to_name", label: "Assigned To" },
    { name: "current_status", label: "Status" },
  ];

  const allSingleFields = [
    { name: "company_name", label: "Company Name", type: "text" },
    { name: "reference", label: "Reference", type: "text" },
    { name: "address", label: "Address", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "rfq_channel", label: "RFQ Channel", type: "text" },
    { name: "attention_name", label: "Attention Name", type: "text" },
    { name: "attention_phone", label: "Attention Phone", type: "text" },
    { name: "attention_email", label: "Attention Email", type: "email" },
    { name: "due_date", label: "Due Date", type: "date" },
    { name: "assign_to_name", label: "Assigned To", type: "text" },
    { name: "assign_to_designation", label: "Designation", type: "text" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "current_status", label: "Status", type: "text" },
  ];

  const repeatableFields = [
    { name: "item_name", label: "Item" },
    { name: "product_name", label: "Product" },
    { name: "quantity", label: "Quantity" },
    { name: "unit", label: "Unit" },
  ];

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!rfqData) return <p>No RFQ data available.</p>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-lg font-medium mb-6 text-gray-800">View RFQ</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-100">
              {tableFields.map((field) => (
                <th key={field.name} className="px-4 py-2 text-xs font-medium text-gray-600 text-left">
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-2 text-xs font-medium text-gray-600 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              {tableFields.map((field) => (
                <td key={field.name} className="px-4 py-2 text-sm text-gray-800">
                  {field.type === "date"
                    ? rfqData[field.name] ? new Date(rfqData[field.name]).toLocaleDateString() : "N/A"
                    : rfqData[field.name] || "N/A"}
                </td>
              ))}
              <td className="px-4 py-2 text-sm text-gray-800">
                <button
                  onClick={() => {
                    setRfqData((prev) => ({ ...prev, isModalOpen: true }));
                  }}
                  className="bg-indigo-500 text-white px-3 py-1 text-sm rounded hover:bg-indigo-600"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {rfqData?.isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100 hover:scale-105">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              RFQ Details #{rfqData.rfq_no}
            </h3>
            <ViewCard
              apiBaseUrl="/add-rfqs/"
              singleFields={allSingleFields}
              repeatableFields={repeatableFields}
              title=""
              editPath={`/pre-job/add-rfq?id=${rfqData.id}`}
              showRepeatableFields={true}
              initialData={rfqData}
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => navigate(`/pre-job/add-rfq?id=${rfqData.id}`, { state: { rfqData, isEditing: true } })}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this RFQ?")) {
                    apiClient.delete(`${"/add-rfqs/"}${rfqData.id}/`).then(() => {
                      setRfqData(null);
                      toast.success("RFQ deleted successfully");
                      navigate("/pre-job/view-rfq");
                    }).catch(() => toast.error("Failed to delete RFQ"));
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Delete
              </button>
              <button
                onClick={() => setRfqData((prev) => ({ ...prev, isModalOpen: false }))}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewRFQ;