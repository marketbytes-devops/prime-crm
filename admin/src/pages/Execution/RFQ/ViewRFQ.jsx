// src/components/ViewRFQ.js
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import { FileText, Printer, Edit, Trash } from "lucide-react";
import ViewCard from "../../../components/ViewCard";

const ViewRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [convertRfq, setConvertRfq] = useState(null);
  const [quotationItems, setQuotationItems] = useState([]);
  const itemsPerPage = 20;

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/add-rfqs/");
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      const updatedRfqs = data.map((rfq, index) => ({
        ...rfq,
        si_no: index + 1,
        current_status: rfq.current_status || "Processing",
        is_past_due:
          rfq.current_status !== "Completed" &&
          rfq.due_date &&
          new Date(rfq.due_date) < new Date().setHours(0, 0, 0, 0),
      }));
      setRfqs(updatedRfqs);
      if (location.state?.rfqId) {
        const newRfq = updatedRfqs.find((r) => r.id === location.state.rfqId);
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

  useEffect(() => {
    fetchRfqs();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchRfqs();
    }
  }, [location.state]);

  const updateStatus = async (rfqId, newStatus) => {
    try {
      setLoading(true);
      const rfqToUpdate = rfqs.find((r) => r.id === rfqId) || selectedRfq;
      if (!rfqToUpdate) throw new Error("RFQ not found in state.");

      const payload = {
        current_status: newStatus,
        company_name: rfqToUpdate.company_name || null,
        address: rfqToUpdate.address || null,
        phone: rfqToUpdate.phone || null,
        email: rfqToUpdate.email || null,
        attention_name: rfqToUpdate.attention_name || null,
        attention_phone: rfqToUpdate.attention_phone || null,
        attention_email: rfqToUpdate.attention_email || null,
        due_date: rfqToUpdate.due_date || null,
        assign_to: rfqToUpdate.assign_to || null,
        rfq_channel: rfqToUpdate.rfq_channel || null,
        series: rfqToUpdate.series || null,
        items: rfqToUpdate.items.map((item) => ({
          item_name: item.item_name || null,
          product_name: item.product_name || null,
          quantity: item.quantity || 1,
          unit: item.unit || null,
        })),
      };

      await apiClient.put(`/add-rfqs/${rfqId}/`, payload);
      setRfqs((prev) =>
        prev.map((r) =>
          r.id === rfqId
            ? {
                ...r,
                current_status: newStatus,
                is_past_due: newStatus !== "Completed" && r.due_date && new Date(r.due_date) < new Date().setHours(0, 0, 0, 0),
              }
            : r
        )
      );
      if (selectedRfq && selectedRfq.id === rfqId) {
        setSelectedRfq((prev) => ({
          ...prev,
          current_status: newStatus,
          is_past_due: newStatus !== "Completed" && prev.due_date && new Date(prev.due_date) < new Date().setHours(0, 0, 0, 0),
        }));
      }
      toast.success(`Status changed to ${newStatus}`);
    } catch (err) {
      console.error("Failed to update RFQ status:", err);
      toast.error("Failed to update status: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToQuotation = (rfq) => {
    if (rfq.current_status !== "Completed") {
      toast.error("Please complete the RFQ first.");
      return;
    }
    setConvertRfq(rfq);
    setQuotationItems(
      rfq.items.map((item) => ({
        ...item,
        unit_price: item.unit_price || 0,
        error: null,
      }))
    );
    setShowQuotationModal(true);
  };

  const handleUnitPriceChange = (itemId, value) => {
    const unitPrice = value === "" ? "" : parseFloat(value) || 0;
    setQuotationItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              unit_price: unitPrice,
              error: unitPrice === "" || unitPrice < 0 ? "Unit price must be non-negative" : null,
            }
          : item
      )
    );
  };

  const applyDefaultUnitPrice = (defaultPrice) => {
    const parsedPrice = parseFloat(defaultPrice) || 0;
    if (parsedPrice < 0) {
      toast.error("Default unit price must be non-negative.");
      return;
    }
    setQuotationItems((prev) =>
      prev.map((item) => ({
        ...item,
        unit_price: parsedPrice,
        error: null,
      }))
    );
  };

  const validateQuotationItems = () => {
    let isValid = true;
    const updatedItems = quotationItems.map((item) => {
      if (item.unit_price === "" || item.unit_price == null || item.unit_price < 0) {
        isValid = false;
        return { ...item, error: "Unit price must be non-negative" };
      }
      return { ...item, error: null };
    });
    setQuotationItems(updatedItems);
    return isValid;
  };

  const submitQuotation = async () => {
    if (!validateQuotationItems()) {
      toast.error("Please fix all unit price errors before submitting.");
      return;
    }

    const payload = {
      rfq: convertRfq.id,
      company_name: convertRfq.company_name || null,
      address: convertRfq.address || null,
      phone: convertRfq.phone || null,
      email: convertRfq.email || null,
      attention_name: convertRfq.attention_name || null,
      attention_phone: convertRfq.attention_phone || null,
      attention_email: convertRfq.attention_email || null,
      due_date: convertRfq.due_date || null,
      items: quotationItems.map((item) => ({
        item_name: item.item_name || null,
        product_name: item.product_name || null,
        quantity: item.quantity || 1,
        unit: item.unit || null,
        unit_price: item.unit_price,
      })),
    };

    try {
      const response = await apiClient.post("/quotations/", payload);
      toast.success("Quotation created successfully!");
      setShowQuotationModal(false);
      setConvertRfq(null);
      setQuotationItems([]);
      const quotation = response.data;
      navigate("/pre-job/view-quotation", {
        state: { quotationId: quotation.id, refresh: true },
      });
    } catch (err) {
      console.error("Failed to create quotation:", err);
      let errorMessage = "Failed to create quotation. Please try again or contact support.";
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.non_field_errors) {
        errorMessage = err.response.data.non_field_errors.join(", ");
      } else if (err.response?.data?.items) {
        errorMessage = err.response.data.items.map((item) => item.unit_price || item).join(", ");
      }
      toast.error(errorMessage);
    }
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
          <p><strong>Company Name:</strong> ${rfq.company_name || "N/A"}</p>
          <p><strong>Address:</strong> ${rfq.address || "N/A"}</p>
          <p><strong>Phone:</strong> ${rfq.phone || "N/A"}</p>
          <p><strong>Email:</strong> ${rfq.email || "N/A"}</p>
          <p><strong>Attention Name:</strong> ${rfq.attention_name || "N/A"}</p>
          <p><strong>Attention Phone:</strong> ${rfq.attention_phone || "N/A"}</p>
          <p><strong>Attention Email:</strong> ${rfq.attention_email || "N/A"}</p>
          <p><strong>Created At:</strong> ${rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : "N/A"}</p>
          <p><strong>Due Date:</strong> ${rfq.due_date ? new Date(rfq.due_date).toLocaleDateString() : "N/A"}</p>
          <p><strong>Status:</strong> ${rfq.current_status || "N/A"}</p>
          <p><strong>Assigned To:</strong> ${rfq.assign_to_name || "N/A"}</p>
          <p><strong>RFQ Channel:</strong> ${rfq.rfq_channel || "N/A"}</p>
        </div>
        ${
          rfq.items && rfq.items.length > 0
            ? `
          <h3>Items & Products</h3>
          <table>
            <thead>
              <tr>
                <th>Item/Product</th>
                <th>Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              ${rfq.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.item_name || item.product_name || "N/A"}</td>
                  <td>${item.quantity || "N/A"}</td>
                  <td>${item.unit || "N/A"}</td>
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
    { name: "assign_to_name", label: "Assigned To" },
    { name: "current_status", label: "Status" },
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
    { name: "current_status", label: "Status", type: "text" },
    { name: "assign_to_name", label: "Assigned To", type: "text" },
    { name: "rfq_channel", label: "RFQ Channel", type: "text" },
  ];

  const repeatableFields = [
    { name: "item_name", label: "Item" },
    { name: "product_name", label: "Product" },
    { name: "quantity", label: "Quantity" },
    { name: "unit", label: "Unit" },
  ];

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const totalPages = Math.ceil(rfqs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRfqs = rfqs.slice(indexOfFirstItem, indexOfLastItem);

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
                  {field.name === "current_status" ? (
                    <div className="flex items-center">
                      {field.label}
                      <span className="ml-1 text-xs text-gray-500">(Editable)</span>
                    </div>
                  ) : (
                    field.label
                  )}
                </th>
              ))}
              <th className="px-4 py-2 text-sm font-medium text-black text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRfqs.map((rfq) => (
              <tr
                key={rfq.id}
                className={`border-t hover:bg-gray-50 ${rfq.is_past_due ? "bg-red-50" : ""}`}
              >
                {tableFields.map((field) => (
                  <td key={field.name} className="px-4 py-3 text-sm text-black">
                    {field.name === "current_status" ? (
                      <select
                        value={rfq.current_status || "Processing"}
                        onChange={(e) => updateStatus(rfq.id, e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={loading}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : field.type === "date" ? (
                      rfq[field.name] ? new Date(rfq[field.name]).toLocaleDateString() : "N/A"
                    ) : (
                      rfq[field.name] || "N/A"
                    )}
                    {field.name === "due_date" && rfq.is_past_due && (
                      <span className="text-red-600 text-xs ml-2">(Past Due)</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-black flex space-x-2">
                  <button
                    onClick={() => setSelectedRfq(rfq)}
                    className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleConvertToQuotation(rfq)}
                    className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
                      rfq.current_status === "Completed"
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={rfq.current_status !== "Completed"}
                  >
                    Convert to Quotation
                  </button>
                  <button
                    onClick={() => navigate(`/pre-job/edit-rfq`, { state: { rfqData: rfq, isEditing: true } })}
                    className="bg-blue-500 text-white px-3 py-2 text-sm rounded hover:bg-blue-600 transition-colors duration-200 flex items-center"
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
              currentPage === page ? "bg-indigo-500 text-white" : "bg-gray-200 text-black hover:bg-gray-300"
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
              {selectedRfq.is_past_due && (
                <span className="text-red-600 text-sm ml-2">(Past Due)</span>
              )}
            </h3>
            <ViewCard
              singleFields={allSingleFields}
              repeatableFields={
                selectedRfq.items && selectedRfq.items.length > 0 ? repeatableFields : []
              }
              title={
                selectedRfq.items && selectedRfq.items.length > 0
                  ? (() => {
                      const hasItems = selectedRfq.items.some(
                        (item) => item.item_name && item.item_name.trim() !== ""
                      );
                      const hasProducts = selectedRfq.items.some(
                        (item) => item.product_name && item.product_name.trim() !== ""
                      );
                      return hasItems && hasProducts
                        ? "Items & Products"
                        : hasItems
                        ? "Items"
                        : hasProducts
                        ? "Products"
                        : "";
                    })()
                  : ""
              }
              showRepeatableFields={selectedRfq.items && selectedRfq.items.length > 0}
              initialData={selectedRfq}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => navigate(`/pre-job/edit-rfq`, { state: { rfqData: selectedRfq, isEditing: true } })}
                className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600 transition-colors duration-200"
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

      {showQuotationModal && convertRfq && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Create Quotation for RFQ #{convertRfq.rfq_no}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Set Default Unit Price for All Items
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter default price"
                  onChange={(e) => applyDefaultUnitPrice(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => applyDefaultUnitPrice(0)}
                  className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300"
                >
                  Set to $0
                </button>
              </div>
            </div>
            <h4 className="text-md font-semibold mb-2 text-black">Items</h4>
            {quotationItems.length > 0 ? (
              quotationItems.map((item) => (
                <div key={item.id} className="mb-3 p-3 border rounded">
                  <p className="text-sm text-black">
                    <strong>Item/Product:</strong> {item.item_name || item.product_name || "N/A"}
                  </p>
                  <p className="text-sm text-black">
                    <strong>Quantity:</strong> {item.quantity || "N/A"} {item.unit || ""}
                  </p>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                      className={`w-full p-2 border rounded focus:outline-none focus:ring-1 ${
                        item.error ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"
                      }`}
                    />
                    {item.error && <p className="text-red-500 text-xs mt-1">{item.error}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No items available for this RFQ.</p>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={submitQuotation}
                className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors duration-200"
                disabled={quotationItems.length === 0}
              >
                Create Quotation
              </button>
              <button
                onClick={() => {
                  setShowQuotationModal(false);
                  setConvertRfq(null);
                  setQuotationItems([]);
                }}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition-colors duration-200"
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

export default ViewRFQ;