import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ViewCard from "../../../components/ViewCard";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import { FileText, Printer } from "lucide-react";

const ViewRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [convertQuotationRfq, setConvertQuotationRfq] = useState(null);
  const [quotationData, setQuotationData] = useState(null);
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
        current_status: rfq.current_status || "Processing",
        is_past_due: rfq.due_date && new Date(rfq.due_date) < new Date().setHours(0, 0, 0, 0) && rfq.current_status !== "Completed",
      }));
      setRfqs(updatedRfqs);
      if (selectedRfq) {
        const updatedSelectedRfq = updatedRfqs.find((rfq) => rfq.id === selectedRfq.id);
        if (updatedSelectedRfq) {
          setSelectedRfq(updatedSelectedRfq);
        }
      }
      if (convertQuotationRfq) {
        const updatedConvertRfq = updatedRfqs.find((rfq) => rfq.id === convertQuotationRfq.id);
        if (updatedConvertRfq) {
          setConvertQuotationRfq(updatedConvertRfq);
          setQuotationData({
            ...updatedConvertRfq,
            items: updatedConvertRfq.items.map((item) => ({
              ...item,
              unit_price: item.unit_price || 0,
              total_price: (item.quantity || 0) * (item.unit_price || 0),
            })),
          });
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

  const handleConvertToQuotation = (rfq) => {
    setConvertQuotationRfq(rfq);
    setQuotationData({
      ...rfq,
      items: rfq.items.map((item) => ({
        ...item,
        unit_price: item.unit_price || 0,
        total_price: (item.quantity || 0) * (item.unit_price || 0),
      })),
    });
  };

  const handleUnitPriceChange = (itemId, value) => {
    const unitPrice = parseFloat(value) || 0;
    setQuotationData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, unit_price: unitPrice, total_price: (item.quantity || 0) * unitPrice }
          : item
      ),
    }));
  };

  const handlePrint = (data, isQuotation = false) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${isQuotation ? `Quotation ${data.quotation_no}` : `RFQ ${data.rfq_no}`}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; }
          .details { margin-bottom: 20px; }
          .details p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { margin-top: 20px; font-weight: bold; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${isQuotation ? `Quotation #${data.quotation_no}` : `RFQ #${data.rfq_no}`}</h1>
        <div class="details">
          <p><strong>Company Name:</strong> ${data.company_name || "N/A"}</p>
          <p><strong>Address:</strong> ${data.address || "N/A"}</p>
          <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
          <p><strong>Email:</strong> ${data.email || "N/A"}</p>
          ${isQuotation ? "" : `<p><strong>Reference:</strong> ${data.reference || "N/A"}</p>`}
          ${isQuotation ? "" : `<p><strong>RFQ Channel:</strong> ${data.rfq_channel || "N/A"}</p>`}
          <p><strong>Due Date:</strong> ${data.due_date ? new Date(data.due_date).toLocaleDateString() : "N/A"}</p>
          <p><strong>Created At:</strong> ${data.created_at ? new Date(data.created_at).toLocaleDateString() : "N/A"}</p>
          ${isQuotation ? "" : `<p><strong>Assigned To:</strong> ${data.assign_to_name || "N/A"}</p>`}
          ${isQuotation ? "" : `<p><strong>Designation:</strong> ${data.assign_to_designation || "N/A"}</p>`}
          <p><strong>Status:</strong> ${data.current_status || "N/A"}</p>
        </div>
        ${data.items && data.items.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Item/Product</th>
                <th>Quantity</th>
                <th>Unit</th>
                ${isQuotation ? `
                  <th>Unit Price</th>
                  <th>Total Price</th>
                ` : ""}
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item) => `
                <tr>
                  <td>${item.item_name || item.product_name || "N/A"}</td>
                  <td>${item.quantity || "N/A"}</td>
                  <td>${item.unit || "N/A"}</td>
                  ${isQuotation ? `
                    <td>$${item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}</td>
                    <td>$${item.total_price != null ? Number(item.total_price).toFixed(2) : "0.00"}</td>
                  ` : ""}
                </tr>
              `).join("")}
            </tbody>
          </table>
          ${isQuotation ? `
            <div class="total">
              Total Amount: $${data.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0).toFixed(2)}
            </div>
          ` : ""}
        ` : ""}
        <button class="no-print" onclick="window.print()">Print</button>
      </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    // Delay to ensure content is rendered before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSaveQuotation = async () => {
    if (!quotationData) return;

    const payload = {
      rfq: convertQuotationRfq.id,
      company_name: quotationData.company_name || null,
      address: quotationData.address || null,
      phone: quotationData.phone || null,
      email: quotationData.email || null,
      attention_name: quotationData.attention_name || null,
      attention_phone: quotationData.attention_phone || null,
      attention_email: quotationData.attention_email || null,
      items: quotationData.items.map((item) => ({
        item_name: item.item_name || null,
        product_name: item.product_name || null,
        quantity: item.quantity || null,
        unit: item.unit || null,
        unit_price: item.unit_price || null,
      })),
    };

    try {
      const response = await apiClient.post("/quotations/", payload);
      toast.success("Quotation created successfully!");
      const quotation = response.data;

      // Update RFQ items with unit_price and total_price
      setRfqs((prev) =>
        prev.map((rfq) =>
          rfq.id === convertQuotationRfq.id
            ? {
                ...rfq,
                items: rfq.items.map((rfqItem) => {
                  const quotationItem = quotation.items.find(
                    (qi) => qi.item_name === rfqItem.item_name && qi.product_name === rfqItem.product_name
                  );
                  return quotationItem
                    ? {
                        ...rfqItem,
                        unit_price: quotationItem.unit_price,
                        total_price: quotationItem.total_price,
                      }
                    : rfqItem;
                }),
              }
            : rfq
        )
      );
      if (selectedRfq && selectedRfq.id === convertQuotationRfq.id) {
        setSelectedRfq((prev) => ({
          ...prev,
          items: prev.items.map((rfqItem) => {
            const quotationItem = quotation.items.find(
              (qi) => qi.item_name === rfqItem.item_name && qi.product_name === rfqItem.product_name
            );
            return quotationItem
              ? {
                  ...rfqItem,
                  unit_price: quotationItem.unit_price,
                  total_price: quotationItem.total_price,
                }
              : rfqItem;
          }),
        }));
      }

      // Trigger print for the quotation
      handlePrint(quotation, true);

      // Navigate to ViewQuotation
      navigate("/pre-job/quotation", { state: { quotationId: quotation.id } });

      setConvertQuotationRfq(null);
      setQuotationData(null);
    } catch (err) {
      console.error("Failed to create quotation:", err);
      toast.error("Failed to create quotation: " + (err.response?.data?.quotation_no || "Unknown error"));
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
    { name: "unit_price", label: "Unit Price" },
    { name: "total_price", label: "Total Price" },
  ];

  const getRepeatableFields = (items) => {
    const hasItems = items.some((item) => item.item_name && item.item_name.trim() !== "");
    const hasProducts = items.some((item) => item.product_name && item.product_name.trim() !== "");
    const hasUnitPrice = items.some((item) => item.unit_price != null);
    const hasTotalPrice = items.some((item) => item.total_price != null);

    return repeatableFields.filter((field) => {
      return (
        (hasItems && field.name === "item_name") ||
        (hasProducts && field.name === "product_name") ||
        field.name === "quantity" ||
        field.name === "unit" ||
        (hasUnitPrice && field.name === "unit_price") ||
        (hasTotalPrice && field.name === "total_price")
      );
    });
  };

  const handleDelete = async (rfqId) => {
    if (!window.confirm("Are you sure you want to delete this RFQ?")) return;
    try {
      await apiClient.delete(`/add-rfqs/${rfqId}/`);
      toast.success("RFQ deleted successfully");
      setRfqs((prev) => prev.filter((rfq) => rfq.id !== rfqId));
      setSelectedRfq(null);
      setConvertQuotationRfq(null);
    } catch (err) {
      console.error("Failed to delete RFQ:", err);
      toast.error("Failed to delete RFQ.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (rfqId, newStatus) => {
    try {
      const response = await apiClient.put(`/add-rfqs/${rfqId}/`, { current_status: newStatus });
      const updatedRfq = response.data;
      setRfqs((prev) =>
        prev.map((rfq) => (rfq.id === rfqId ? { ...rfq, current_status: updatedRfq.current_status, is_past_due: updatedRfq.current_status !== "Completed" && new Date(rfq.due_date) < new Date().setHours(0, 0, 0, 0) } : rfq))
      );
      if (selectedRfq && selectedRfq.id === rfqId) {
        setSelectedRfq((prev) => ({ ...prev, current_status: updatedRfq.current_status, is_past_due: updatedRfq.current_status !== "Completed" && new Date(prev.due_date) < new Date().setHours(0, 0, 0, 0) }));
      }
      if (convertQuotationRfq && convertQuotationRfq.id === rfqId) {
        setConvertQuotationRfq((prev) => ({ ...prev, current_status: updatedRfq.current_status, is_past_due: updatedRfq.current_status !== "Completed" && new Date(prev.due_date) < new Date().setHours(0, 0, 0, 0) }));
        setQuotationData((prev) => ({ ...prev, current_status: updatedRfq.current_status }));
      }
      toast.success(`Status changed to ${newStatus}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status. Please try again.");
    }
  };

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
              <th className="px-4 py-2 text-sm font-medium text-black text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRfqs.map((rfq) => (
              <tr key={rfq.id} className={`border-t hover:bg-gray-50 ${rfq.is_past_due ? "bg-red-50" : ""}`}>
                {tableFields.map((field) => (
                  <td key={field.name} className="px-4 py-3 text-sm text-black">
                    {field.name === "current_status" ? (
                      <select
                        value={rfq.current_status || "Processing"}
                        onChange={(e) => updateStatus(rfq.id, e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : field.type === "date" ? (
                      rfq[field.name]
                        ? new Date(rfq[field.name]).toLocaleDateString()
                        : "N/A"
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
                    className="bg-green-500 text-white px-3 py-2 text-sm rounded hover:bg-green-600 transition-colors duration-200 flex items-center"
                  >
                    <FileText size={16} className="mr-1" /> Convert to Quotation
                  </button>
                  <button
                    onClick={() => handlePrint(rfq)}
                    className="bg-blue-500 text-white px-3 py-2 text-sm rounded hover:bg-blue-600 transition-colors duration-200 flex items-center"
                  >
                    <Printer size={16} className="mr-1" /> Print
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
              {selectedRfq.is_past_due && (
                <span className="text-red-600 text-sm ml-2">(Past Due)</span>
              )}
            </h3>
            <ViewCard
              singleFields={allSingleFields}
              repeatableFields={
                selectedRfq.items && selectedRfq.items.length > 0
                  ? getRepeatableFields(selectedRfq.items)
                  : []
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
                className="bg-red-500 text-white hover:bg-red-600 px-3 py-2 rounded transition-colors duration-200"
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

      {convertQuotationRfq && quotationData && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="scale-80 bg-white rounded-lg shadow-sm p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Convert RFQ #{convertQuotationRfq.rfq_no} to Quotation
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-100 rounded-lg">
                <thead>
                  <tr>
                    {repeatableFields.map((field) => (
                      <th
                        key={field.name}
                        className="px-4 py-2 text-xs font-medium text-gray-600 text-left"
                      >
                        {field.label}
                        {field.name === "unit_price" && (
                          <span className="ml-1 text-xs text-gray-500">(Editable)</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotationData.items.map((item, index) => (
                    <tr key={item.id || index} className="border-t">
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {item.item_name || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {item.product_name || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {item.quantity || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {item.unit || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        <input
                          type="number"
                          value={item.unit_price || ""}
                          onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          min="0"
                          step="0.01"
                          placeholder="Enter Unit Price"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        ${item.total_price != null ? Number(item.total_price).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleSaveQuotation}
                className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600 transition-colors duration-200"
              >
                Save Quotation
              </button>
              <button
                onClick={() => {
                  setConvertQuotationRfq(null);
                  setQuotationData(null);
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