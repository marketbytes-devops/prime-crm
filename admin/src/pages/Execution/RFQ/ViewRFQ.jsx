import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FileText, Printer, Edit, Trash } from "lucide-react";
import ViewCard from "../../../components/ViewCard";
import apiClient from "../../../helpers/apiClient";
import { format } from "date-fns"; 
import PropTypes from "prop-types"; 

const ViewRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); 
  const [error, setError] = useState(null);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleError = useCallback((err, defaultMessage) => {
    const message = err.response?.data?.detail || err.message || defaultMessage;
    console.error(defaultMessage, err);
    setError(message);
    toast.error(message);
  }, []);

  const fetchRfqs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/add-rfqs/");
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
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
            assign_to_name: rfq.assigned_sales_person?.name || rfq.assign_to_name || "Unassigned",
            assign_to_designation: rfq.assigned_sales_person?.designation || rfq.assign_to_designation || "",
            assign_to_email: rfq.assigned_sales_person?.email || rfq.assign_to_email || "",
          };
        })
      );
      setRfqs(updatedRfqs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      if (location.state?.rfqId) {
        const newRfq = updatedRfqs.find((r) => r.id === location.state.rfqId);
        if (newRfq) setSelectedRfq(newRfq);
      }
    } catch (err) {
      handleError(err, "Failed to load RFQs.");
    } finally {
      setLoading(false);
    }
  }, [location.state, handleError]);

  const updateRfqQuotationStatus = useCallback(async (rfqId) => {
    setActionLoading((prev) => ({ ...prev, [rfqId]: true }));
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
    } finally {
      setActionLoading((prev) => ({ ...prev, [rfqId]: false }));
    }
  }, [rfqs]);

  const updateRfqStatus = useCallback(async (rfqId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [rfqId]: true }));
    try {
      const response = await apiClient.patch(`/add-rfqs/${rfqId}/`, { current_status: newStatus });
      setRfqs((prev) =>
        prev.map((rfq) => (rfq.id === rfqId ? { ...rfq, current_status: newStatus } : rfq))
      );
      toast.success("RFQ status updated successfully");
    } catch (err) {
      handleError(err, "Failed to update RFQ status.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [rfqId]: false }));
    }
  }, [handleError]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  useEffect(() => {
    if (location.state?.refresh && location.state?.rfqId) {
      updateRfqQuotationStatus(location.state.rfqId);
    }
  }, [location.state, updateRfqQuotationStatus]);

  const handleConvertToQuotation = useCallback((rfq) => {
    if (rfq.hasQuotation) {
      toast.error("A quotation already exists for this RFQ.");
      return;
    }
    setActionLoading((prev) => ({ ...prev, [rfq.id]: true }));
    navigate("/pre-job/edit-rfq", {
      state: {
        rfqData: {
          ...rfq,
          items: rfq.items.map((item) => ({
            id: item.id,
            item_name: item.item_name || "",
            quantity: item.quantity || 1,
            unit: item.unit || "",
            unit_price: item.unit_price || 0.0,
          })),
        },
        isEditing: true,
        isQuotationMode: true,
      },
    });
    setActionLoading((prev) => ({ ...prev, [rfq.id]: false }));
  }, [navigate]);

  const handlePrint = useCallback((rfq) => {
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
          <p><strong>Created At:</strong> ${rfq.created_at ? format(new Date(rfq.created_at), "MM/dd/yyyy") : ""}</p>
          <p><strong>Due Date:</strong> ${rfq.due_date ? format(new Date(rfq.due_date), "MM/dd/yyyy") : ""}</p>
          <p><strong>Assigned Sales Person:</strong> ${rfq.assign_to_name || "Unassigned"}</p>
          <p><strong>Designation:</strong> ${rfq.assign_to_designation || ""}</p>
          <p><strong>Email:</strong> ${rfq.assign_to_email || ""}</p>
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
                  <td>${item.item_name || "N/A"}</td>
                  <td>${item.quantity || "N/A"}</td>
                  <td>${item.unit || "N/A"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `
          : ""}
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
  }, []);

  const handleDelete = useCallback(async (rfqId) => {
    setActionLoading((prev) => ({ ...prev, [rfqId]: true }));
    try {
      await apiClient.delete(`/add-rfqs/${rfqId}/`);
      toast.success("RFQ deleted successfully");
      setRfqs((prev) => prev.filter((r) => r.id !== rfqId));
      setSelectedRfq(null);
      setShowDeleteModal(null);
    } catch (err) {
      handleError(err, "Failed to delete RFQ.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [rfqId]: false }));
    }
  }, [handleError]);

  const tableFields = useMemo(
    () => [
      { name: "si_no", label: "SI No" },
      { name: "created_at", label: "Created At", type: "date" },
      { name: "due_date", label: "Due Date", type: "date" },
      { name: "rfq_no", label: "RFQ No" },
      {
        name: "assign_to_name",
        label: "Assigned Sales Person",
        render: (rfq) => rfq.assign_to_name || "Unassigned",
      },
      { name: "current_status", label: "Status", type: "select" },
    ],
    []
  );

  const allSingleFields = useMemo(
    () => [
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
      {
        name: "assign_to_name",
        label: "Assigned Sales Person",
        type: "text",
        value: (rfq) => rfq.assign_to_name || "Unassigned",
      },
      {
        name: "assign_to_designation",
        label: "Designation",
        type: "text",
        value: (rfq) => rfq.assign_to_designation || "",
      },
      {
        name: "assign_to_email",
        label: "Email",
        type: "email",
        value: (rfq) => rfq.assign_to_email || "",
      },
      { name: "rfq_channel", label: "RFQ Channel", type: "text" },
      { name: "current_status", label: "Status", type: "text" },
    ],
    []
  );

  const repeatableFields = useMemo(
    () => [
      { name: "item_name", label: "Item" },
      { name: "quantity", label: "Quantity" },
      { name: "unit", label: "Unit" },
    ],
    []
  );

  const currentRfqs = useMemo(
    () => rfqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [rfqs, currentPage]
  );

  const totalPages = Math.ceil(rfqs.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  if (loading) return <p className="text-black text-center" aria-live="polite">Loading...</p>;
  if (error) return <p className="text-red-600 text-center" aria-live="assertive">{error}</p>;
  if (rfqs.length === 0)
    return <p className="text-black text-center" aria-live="polite">No RFQs found.</p>;

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
                    {field.type === "date" ? (
                      rfq[field.name] ? format(new Date(rfq[field.name]), "MM/dd/yyyy") : ""
                    ) : field.type === "select" ? (
                      <select
                        value={rfq.current_status || "Processing"}
                        onChange={(e) => updateRfqStatus(rfq.id, e.target.value)}
                        className="w-full text-sm p-1 border border-gray-300 rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={actionLoading[rfq.id]}
                        aria-label={`Status for RFQ ${rfq.rfq_no}`}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : field.render ? (
                      field.render(rfq)
                    ) : (
                      rfq[field.name] || ""
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-black flex space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => setSelectedRfq(rfq)}
                    className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={actionLoading[rfq.id]}
                    aria-label={`View details for RFQ ${rfq.rfq_no}`}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleConvertToQuotation(rfq)}
                    className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
                      rfq.hasQuotation || rfq.current_status !== "Completed"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                    disabled={rfq.hasQuotation || rfq.current_status !== "Completed" || actionLoading[rfq.id]}
                    aria-label={`Convert RFQ ${rfq.rfq_no} to quotation`}
                  >
                    Convert to Quotation
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/pre-job/edit-rfq`, {
                        state: { rfqData: rfq, isEditing: true },
                      })
                    }
                    className={`px-3 py-2 text-sm rounded transition-colors duration-200 flex items-center ${
                      rfq.hasQuotation
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    disabled={rfq.hasQuotation || actionLoading[rfq.id]}
                    aria-label={`Edit RFQ ${rfq.rfq_no}`}
                  >
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handlePrint(rfq)}
                    className="bg-blue-500 text-white px-3 py-2 text-sm rounded hover:bg-blue-600 transition-colors duration-200 flex items-center disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={actionLoading[rfq.id]}
                    aria-label={`Print RFQ ${rfq.rfq_no}`}
                  >
                    <Printer size={16} className="mr-1" /> Print
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(rfq.id)}
                    className="bg-red-500 text-white px-3 py-2 text-sm rounded hover:bg-red-600 transition-colors duration-200 flex items-center disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={actionLoading[rfq.id]}
                    aria-label={`Delete RFQ ${rfq.rfq_no}`}
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
          aria-label="Previous page"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => paginate(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page ? "bg-indigo-500 text-white" : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          Next
        </button>
        <span className="text-sm text-black" aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {selectedRfq && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              RFQ Details #{selectedRfq.rfq_no}
            </h3>
            <ViewCard
              singleFields={allSingleFields}
              repeatableFields={
                selectedRfq.items && selectedRfq.items.length > 0 ? repeatableFields : []
              }
              title={selectedRfq.items && selectedRfq.items.length > 0 ? "Items" : ""}
              showRepeatableFields={selectedRfq.items && selectedRfq.items.length > 0}
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
                disabled={selectedRfq.hasQuotation || actionLoading[selectedRfq.id]}
                aria-label={`Edit RFQ ${selectedRfq.rfq_no}`}
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(selectedRfq.id)}
                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={actionLoading[selectedRfq.id]}
                aria-label={`Delete RFQ ${selectedRfq.rfq_no}`}
              >
                Delete
              </button>
              <button
                onClick={() => handlePrint(selectedRfq)}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors duration-200 flex items-center disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={actionLoading[selectedRfq.id]}
                aria-label={`Print RFQ ${selectedRfq.rfq_no}`}
              >
                <Printer size={16} className="mr-1" /> Print
              </button>
              <button
                onClick={() => setSelectedRfq(null)}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition-colors duration-200"
                aria-label="Close RFQ details"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-4 w-64">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete RFQ #{rfqs.find((r) => r.id === showDeleteModal)?.rfq_no}?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={actionLoading[showDeleteModal]}
                aria-label="Confirm delete RFQ"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition-colors duration-200"
                aria-label="Cancel delete RFQ"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ViewRFQ.propTypes = {
  rfqs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      rfq_no: PropTypes.string,
      company_name: PropTypes.string,
      address: PropTypes.string,
      phone: PropTypes.string,
      email: PropTypes.string,
      attention_name: PropTypes.string,
      attention_phone: PropTypes.string,
      attention_email: PropTypes.string,
      created_at: PropTypes.string,
      due_date: PropTypes.string,
      assign_to_name: PropTypes.string,
      assign_to_designation: PropTypes.string,
      assign_to_email: PropTypes.string,
      rfq_channel: PropTypes.string,
      current_status: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number,
          item_name: PropTypes.string,
          quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
          unit: PropTypes.string,
          unit_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        })
      ),
      hasQuotation: PropTypes.bool,
    })
  ),
};

export default ViewRFQ;