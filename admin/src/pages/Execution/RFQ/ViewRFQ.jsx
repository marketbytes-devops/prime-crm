import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ViewCard from "../../../components/ViewCard";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";

const ViewRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRfq, setSelectedRfq] = useState(null);

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/add-rfqs/");
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      const updatedRfqs = data.map((rfq, index) => ({
        ...rfq,
        si_no: index + 1,
        rfq_no: `RFQ-${String(rfq.id).padStart(3, "0")}`,
        current_status:
          rfq.due_date && new Date(rfq.due_date) < new Date() ? "Completed" : "Processing",
      }));
      setRfqs(updatedRfqs);
      if (selectedRfq) {
        const updatedSelectedRfq = updatedRfqs.find((rfq) => rfq.id === selectedRfq.id);
        if (updatedSelectedRfq) {
          setSelectedRfq(updatedSelectedRfq);
        }
      }
    } catch (err) {
      console.error("Failed to fetch RFQs:", err);
      setError("Failed to load RFQs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchRfqs();
    }
  }, [location.state]);

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

  const handleDelete = async (rfqId) => {
    if (!window.confirm("Are you sure you want to delete this RFQ?")) return;
    try {
      await apiClient.delete(`/add-rfqs/${rfqId}/`);
      toast.success("RFQ deleted successfully");
      setRfqs((prev) => prev.filter((rfq) => rfq.id !== rfqId));
      setSelectedRfq(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-gray-600 text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (rfqs.length === 0) return <p className="text-gray-600 text-center">No RFQs found.</p>;

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">View RFQs</h2>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {tableFields.map((field) => (
                <th
                  key={field.name}
                  className="px-6 py-3 text-sm font-medium text-gray-600 text-left"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-6 py-3 text-sm font-medium text-gray-600 text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((rfq) => (
              <tr key={rfq.id} className="border-t hover:bg-gray-50">
                {tableFields.map((field) => (
                  <td key={field.name} className="px-6 py-4 text-sm text-gray-800">
                    {field.type === "date"
                      ? rfq[field.name]
                        ? new Date(rfq[field.name]).toLocaleDateString()
                        : "N/A"
                      : rfq[field.name] || "N/A"}
                  </td>
                ))}
                <td className="px-6 py-4 text-sm text-gray-800">
                  <button
                    onClick={() => setSelectedRfq(rfq)}
                    className="bg-indigo-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-600 transition-colors duration-200"
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
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="scale-80 bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              RFQ Details #{selectedRfq.rfq_no}
            </h3>
            <ViewCard
              singleFields={allSingleFields}
              repeatableFields={repeatableFields}
              title=""
              showRepeatableFields={true}
              initialData={selectedRfq}
            />
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() =>
                  navigate(`/pre-job/edit-rfq`, {
                    state: { rfqData: selectedRfq, isEditing: true },
                  })
                }
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedRfq.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedRfq(null)}
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