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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRfqs = rfqs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(rfqs.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  if (loading) return <p className="text-black text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (rfqs.length === 0) return <p className="text-black text-center">No RFQs found.</p>;

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-black">View RFQs</h2>
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {tableFields.map((field) => (
                <th
                  key={field.name}
                  className="px-4 py-2 text-sm font-medium text-black text-left"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-2 text-sm font-medium text-black text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRfqs.map((rfq) => (
              <tr key={rfq.id} className="border-t hover:bg-gray-50">
                {tableFields.map((field) => (
                  <td key={field.name} className="px-4 py-3 text-sm text-black">
                    {field.type === "date"
                      ? rfq[field.name]
                        ? new Date(rfq[field.name]).toLocaleDateString()
                        : "N/A"
                      : rfq[field.name] || "N/A"}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-black">
                  <button
                    onClick={() => setSelectedRfq(rfq)}
                    className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center items-center space-x-2">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => paginate(page)}
            className={`px-3 py-1 rounded ${currentPage === page ? "bg-indigo-500 text-white" : "bg-gray-200 text-black hover:bg-gray-300"}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          Next
        </button>
        <span className="text-sm text-black">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {selectedRfq && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="scale-80 bg-white rounded-lg shadow-sm p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              RFQ Details #{selectedRfq.rfq_no}
            </h3>
            <ViewCard
              singleFields={allSingleFields}
              repeatableFields={repeatableFields}
              title=""
              showRepeatableFields={true}
              initialData={selectedRfq}
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() =>
                  navigate(`/pre-job/edit-rfq`, {
                    state: { rfqData: selectedRfq, isEditing: true },
                  })
                }
                className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600 transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedRfq.id)}
                className="bg-black text-white px-3 py-2 rounded hover:bg-gray-800 transition-colors duration-200"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedRfq(null)}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition-colors duration-200"
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