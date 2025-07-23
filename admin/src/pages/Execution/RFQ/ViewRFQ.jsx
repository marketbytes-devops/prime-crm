import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import { Printer, Edit, Trash } from "lucide-react";
import ViewCard from "../../../components/ViewCard";

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
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      const updatedRfqs = await Promise.all(
        data.map(async (rfq, index) => {
          let hasQuotation = false;
          let quotationItems = [];
          try {
            const quotationResponse = await apiClient.get(`/quotations/?rfq=${rfq.id}`);
            const quotations = Array.isArray(quotationResponse.data)
              ? quotationResponse.data
              : quotationResponse.data.results || [];
            hasQuotation = quotations.length > 0;
            if (hasQuotation && quotations[0]?.items?.length > 0) {
              quotationItems = quotations[0].items.map((item) => ({
                item_name: item.item_name || "",
                quantity: item.quantity || "",
                unit: item.unit || "",
              }));
            }
          } catch (err) {
            console.warn(`No quotation check for RFQ ${rfq.id}:`, err);
          }
          return {
            ...rfq,
            si_no: index + 1,
            hasQuotation,
            items: rfq.items?.length > 0 ? rfq.items : quotationItems,
            assign_to_name: rfq.assign_to_name || '',
            assign_to_designation: rfq.assign_to_designation || '',
          };
        })
      );
      const sortedRfqs = updatedRfqs.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setRfqs(sortedRfqs);
      if (location.state?.rfqId) {
        const newRfq = sortedRfqs.find((r) => r.id === location.state.rfqId);
        if (newRfq) setSelectedRfq(newRfq);
      }
    } catch (err) {
      console.error("Failed to fetch RFQs:", err);
      setError("Failed to load RFQs: " + (err.response?.data?.detail || err.message));
      toast.error("Failed to load RFQs.");
    } finally {
      setLoading(false);
    }
  };

  const updateRfqQuotationStatus = async (rfqId) => {
    try {
      const quotationResponse = await apiClient.get(`/quotations/?rfq=${rfqId}`);
      const hasQuotation = quotationResponse.data && (Array.isArray(quotationResponse.data) ? quotationResponse.data.length > 0 : quotationResponse.data.results?.length > 0);
      const quotations = Array.isArray(quotationResponse.data)
        ? quotationResponse.data
        : quotationResponse.data.results || [];
      const quotationItems = quotations[0]?.items?.length > 0
        ? quotations[0].items.map((item) => ({
            item_name: item.item_name || "",
            quantity: item.quantity || "",
            unit: item.unit || "",
          }))
        : [];
      setRfqs((prev) =>
        prev.map((rfq) =>
          rfq.id === rfqId ? { ...rfq, hasQuotation, items: rfq.items?.length > 0 ? rfq.items : quotationItems } : rfq
        )
      );
      const updatedRfq = rfqs.find((r) => r.id === rfqId);
      if (updatedRfq) setSelectedRfq({ ...updatedRfq, items: updatedRfq.items?.length > 0 ? updatedRfq.items : quotationItems });
    } catch (err) {
      console.error(`Failed to update quotation status for RFQ ${rfqId}:`, err);
    }
  };

  const updateRfqStatus = async (rfqId, newStatus) => {
    const previousRfqs = [...rfqs];
    setRfqs((prev) =>
      prev.map((rfq) => (rfq.id === rfqId ? { ...rfq, current_status: newStatus } : rfq))
    );
    try {
      await apiClient.patch(`/add-rfqs/${rfqId}/`, { current_status: newStatus });
      toast.success("RFQ status updated successfully");
    } catch (err) {
      setRfqs(previousRfqs);
      toast.error("Failed to update RFQ status.");
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  useEffect(() => {
    if (location.state?.refresh && location.state?.rfqId) {
      updateRfqQuotationStatus(location.state.rfqId);
    }
  }, [location.state]);

  const handleConvertToQuotation = (rfq) => {
    if (rfq.hasQuotation) {
      toast.error("A quotation already exists for this RFQ.");
      return;
    }
    navigate("/pre-job/edit-rfq", {
      state: { rfqData: rfq, isEditing: true, isQuotationMode: true },
    });
  };

  const handlePrint = (rfq) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RFQ ${rfq.rfq_no}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; }
          .details { margin-bottom: 20px; }
          .details p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>RFQ #${rfq.rfq_no}</h1>
        <div class="details">
          <p><strong>Company Name:</strong> ${rfq.company_name || ""}</p>
          <p><strong>Address:</strong> ${rfq.address || ""}</p>
          <p><strong>Phone:</strong> ${rfq.phone || ""}</p>
          <p><strong>Email:</strong> ${rfq.email || ""}</p>
          <p><strong>Attention Name:</strong> ${rfq.attention_name || ""}</p>
          <p><strong>Attention Phone:</strong> ${rfq.attention_phone || ""}</p>
          <p><strong>Attention Email:</strong> ${rfq.attention_email || ""}</p>
          <p><strong>Created At:</strong> ${rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : ""}</p>
          <p><strong>Due Date:</strong> ${rfq.due_date ? new Date(rfq.due_date).toLocaleDateString() : ""}</p>
          <p><strong>Assigned To:</strong> ${rfq.assign_to_name || ""}</p>
          <p><strong>RFQ Channel:</strong> ${rfq.rfq_channel || ""}</p>
          <p><strong>Status:</strong> ${rfq.current_status || "Processing"}</p>
        </div>
        ${rfq.items && rfq.items.length > 0
          ? `
          <h3>Items</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              ${rfq.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.item_name || ""}</td>
                  <td>${item.quantity || ""}</td>
                  <td>${item.unit || ""}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `
          : ""
        }
        <button class="no-print" onclick="window.print()">Print</button>
      </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDelete = async (rfqId) => {
    if (!window.confirm("Are you sure you want to delete this RFQ?")) return;
    try {
      await apiClient.delete(`/add-rfqs/${rfqId}/`);
      toast.success("RFQ deleted successfully");
      setRfqs((prev) => prev.filter((r) => r.id !== rfqId));
      setSelectedRfq(null);
    } catch (err) {
      console.error("Failed to delete RFQ:", err);
      toast.error("Failed to delete RFQ: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  const tableFields = [
    { name: "si_no", label: "SI No" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "due_date", label: "Due Date", type: "date" },
    { name: "rfq_no", label: "RFQ No" },
    { name: "assign_to_name", label: "Assigned Sales Person" }, 
    { name: "current_status", label: "Status", type: "select" },
  ];

  const allSingleFields = [
    { name: "rfq_no", label: "RFQ No", type: "text" },
    { name: "company_name", label: "Company Name", type: "text" },
    { name: "address", label: "Address", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "attention_name", label: "Attention Name", type: "text" },
    { name: "attention_phone", label: "Attention Phone", type: "text" },
    { name: "attention_email", label: "Attention Email", type: "email" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "due_date", label: "Due Date", type: "date" },
    { name: "assign_to_name", label: "Assigned Sales Person", type: "text" }, 
    { name: "assign_to_designation", label: "Designation", type: "text" },
    { name: "rfq_channel", label: "RFQ Channel", type: "text" },
    { name: "current_status", label: "Status", type: "text" },
  ];

  const repeatableFields = () => [
    { name: "item_name", label: "Item" },
    { name: "quantity", label: "Quantity" },
    { name: "unit", label: "Unit" },
  ];

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const totalPages = Math.ceil(rfqs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRfqs = rfqs.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <p className="text-black text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (rfqs.length === 0)
    return <p className="text-black text-center">No RFQs found.</p>;

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
                  className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRfqs.map((rfq) => (
              <tr key={rfq.id} className="border-t hover:bg-gray-50">
                {tableFields.map((field) => (
                  <td
                    key={field.name}
                    className="px-4 py-3 text-sm text-black whitespace-nowrap"
                  >
                    {field.type === "date"
                      ? rfq[field.name]
                        ? new Date(rfq[field.name]).toLocaleDateString()
                        : ""
                      : field.type === "select" ? (
                          <select
                            value={rfq.current_status || "Processing"}
                            onChange={(e) => updateRfqStatus(rfq.id, e.target.value)}
                            className="w-full text-sm p-1 border border-gray-300 rounded bg-transparent focus:outline-indigo-500"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Completed">Completed</option>
                          </select>
                        ) : rfq[field.name] || ""}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-black flex space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => setSelectedRfq(rfq)}
                    className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleConvertToQuotation(rfq)}
                    className={`bg-green-500 text-white px-3 py-2 text-sm rounded hover:bg-green-600 transition-colors duration-200 ${
                      rfq.hasQuotation || rfq.current_status !== "Completed"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={rfq.hasQuotation || rfq.current_status !== "Completed"}
                  >
                    Convert to Quotation
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/pre-job/edit-rfq`, {
                        state: { rfqData: rfq, isEditing: true },
                      })
                    }
                    className={`bg-blue-500 text-white px-3 py-2 text-sm rounded hover:bg-blue-600 transition-colors duration-200 flex items-center ${
                      rfq.hasQuotation ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""
                    }`}
                    disabled={rfq.hasQuotation}
                  >
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handlePrint(rfq)}
                    className="bg-blue-500 text-white px-3 py-2 text-sm rounded hover:bg-blue-600 transition-colors duration-200 flex items-center"
                  >
                    <Printer size={16} className="mr-1" /> Print
                  </button>
                  <button
                    onClick={() => handleDelete(rfq.id)}
                    className="bg-red-500 text-white px-3 py-2 text-sm rounded hover:bg-red-600 transition-colors duration-200 flex items-center"
                  >
                    <Trash size={16} className="mr-1" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? "bg-indigo-500 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
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
          <div className="scale-65 bg-white rounded-lg shadow-sm p-6 w-full">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              RFQ Details #{selectedRfq.rfq_no}
            </h3>
            <ViewCard
              singleFields={allSingleFields}
              repeatableFields={
                selectedRfq.items && selectedRfq.items.length > 0
                  ? repeatableFields()
                  : []
              }
              title={
                selectedRfq.items && selectedRfq.items.length > 0 ? "Items" : ""
              }
              showRepeatableFields={
                selectedRfq.items && selectedRfq.items.length > 0
              }
              initialData={selectedRfq}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() =>
                  navigate(`/pre-job/edit-rfq`, {
                    state: { rfqData: selectedRfq, isEditing: true },
                  })
                }
                className={`bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600 transition-colors duration-200 ${
                  selectedRfq.hasQuotation ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""
                }`}
                disabled={selectedRfq.hasQuotation}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedRfq.id)}
                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors duration-200"
              >
                Delete
              </button>
              <button
                onClick={() => handlePrint(selectedRfq)}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors duration-200 flex items-center"
              >
                <Printer size={16} className="mr-1" /> Print
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