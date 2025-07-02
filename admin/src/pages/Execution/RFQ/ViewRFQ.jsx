import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ViewCard from "../../../components/ViewCard";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";

const ViewRFQ = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfqData, setRfqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRfq, setSelectedRfq] = useState(null);

  useEffect(() => {
    const fetchRfqData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/add-rfqs/");
        const data = response.data.map((rfq, index) => ({
          ...rfq,
          si_no: index + 1, // Auto-generate SI No
          rfq_no: `RFQ-${String(rfq.id).padStart(3, '0')}`, // Generate RFQ No with padStart
          current_status: rfq.due_date && new Date(rfq.due_date) < new Date() ? "Completed" : "Processing", // Computed status
        }));
        setRfqData(data);
      } catch (err) {
        console.error("Failed to fetch RFQ data:", err);
        setError("Failed to load RFQs.");
        setRfqData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRfqData();
  }, []);

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

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-lg font-medium mb-6 text-gray-800">View RFQs</h2>
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
            {rfqData.map((rfq) => (
              <tr key={rfq.id} className="border-t">
                {tableFields.map((field) => (
                  <td key={field.name} className="px-4 py-2 text-sm text-gray-800">
                    {field.type === "date"
                      ? rfq[field.name] ? new Date(rfq[field.name]).toLocaleDateString() : "N/A"
                      : rfq[field.name] || "N/A"}
                  </td>
                ))}
                <td className="px-4 py-2 text-sm text-gray-800">
                  <button
                    onClick={() => setSelectedRfq(rfq)}
                    className="bg-indigo-500 text-white px-3 py-1 text-sm rounded hover:bg-indigo-600"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRfq && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4 text-gray-800">RFQ Details #{selectedRfq.rfq_no}</h3>
            <ViewCard
              apiBaseUrl="/add-rfqs/"
              singleFields={allSingleFields}
              repeatableFields={repeatableFields}
              title=""
              editPath={`/pre-job/add-rfq?id=${selectedRfq.id}`}
              showRepeatableFields={true}
              initialData={selectedRfq}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => navigate(`/pre-job/add-rfq?id=${selectedRfq.id}`, { state: { rfqData: selectedRfq, isEditing: true } })}
                className="bg-blue-500 text-white px-4 py-2 text-sm rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this RFQ?")) {
                    apiClient.delete(`${"/add-rfqs/"}${selectedRfq.id}/`).then(() => {
                      setRfqData(rfqData.filter(r => r.id !== selectedRfq.id));
                      setSelectedRfq(null);
                      toast.success("RFQ deleted successfully");
                    }).catch(() => toast.error("Failed to delete RFQ"));
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 text-sm rounded hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedRfq(null)}
                className="bg-gray-500 text-white px-4 py-2 text-sm rounded hover:bg-gray-600"
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