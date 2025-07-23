import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import { FileText, Upload, Printer } from "lucide-react";
import ViewCard from "../../../components/ViewCard";

const ViewQuotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [convertPurchaseOrder, setConvertPurchaseOrder] = useState(null);
  const [purchaseOrderData, setPurchaseOrderData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [partialOrders, setPartialOrders] = useState([]);
  const [uploadedPOFiles, setUploadedPOFiles] = useState({}); // Track uploaded files per quotation
  const [showUploadPOModal, setShowUploadPOModal] = useState(false); // New state for upload PO modal
  const itemsPerPage = 20;

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/quotations/");
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      const updatedQuotations = await Promise.all(
        data.map(async (quotation, index) => {
          let rfqDetails = {};
          try {
            if (quotation.rfq) {
              const rfqResponse = await apiClient.get(`/add-rfqs/${quotation.rfq}/`);
              rfqDetails = rfqResponse.data;
            } else {
              console.warn(`No RFQ ID for quotation ${quotation.id}`);
            }
          } catch (err) {
            console.error(`Failed to fetch RFQ ${quotation.rfq} for quotation ${quotation.id}:`, err);
            rfqDetails = {
              rfq_no: "",
              rfq_channel: "",
              assign_to_name: "",
              assign_to_designation: "",
            };
          }
          const nextFollowupDate = calculateNextFollowupDate(quotation);
          const isDueReminder =
            quotation.current_status === "Approved" &&
            (!quotation.purchase_order || quotation.purchase_order.length === 0) &&
            new Date(quotation.due_date) < new Date().setHours(0, 0, 0, 0);
          return {
            ...quotation,
            si_no: index + 1,
            current_status: quotation.current_status || "Pending",
            next_followup_date: nextFollowupDate,
            is_due_reminder: isDueReminder,
            latest_remarks: quotation.latest_remarks || "",
            rfq_details: rfqDetails,
          };
        })
      );
      const sortedQuotations = updatedQuotations.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
      setQuotations(sortedQuotations);
      if (location.state?.quotationId) {
        const newQuotation = sortedQuotations.find((q) => q.id === location.state.quotationId);
        if (newQuotation) {
          setSelectedQuotation(newQuotation);
          const existingPOs = newQuotation.purchase_order?.filter(po => po.order_type === "partial") || [];
          const statePartialOrders = location.state?.partialOrders || [];
          setPartialOrders(statePartialOrders.length > 0 ? statePartialOrders : existingPOs.map(po => ({
            ...po,
            items: po.items.map(item => ({
              ...item,
              item_name: item.item_name || item.product_name || "",
              quantity: item.quantity || "",
              unit: item.unit || "",
              unit_price: item.unit_price || 0.00,
            })),
          })));
          if (location.state?.uploadedPOFiles && location.state?.quotationId in location.state.uploadedPOFiles) {
            setUploadedPOFiles(prev => ({ ...prev, [location.state.quotationId]: location.state.uploadedPOFiles[location.state.quotationId] }));
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch quotations:", err);
      setError("Failed to load quotations: " + (err.response?.data?.detail || err.message));
      toast.error("Failed to load quotations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchQuotations();
    }
  }, [location.state]);

  const calculateNextFollowupDate = (quotation) => {
    if (!quotation.due_date) return null;
    const dueDate = new Date(quotation.due_date);
    const now = new Date();
    let followupDate = new Date(dueDate);
    followupDate.setHours(0, 0, 0, 0);
    if (now > dueDate) {
      const daysPastDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      const cycles = Math.floor(daysPastDue / 7);
      followupDate.setDate(dueDate.getDate() + (cycles + 1) * 7);
    } else {
      followupDate.setDate(dueDate.getDate() + 1);
    }
    return followupDate.toISOString().split("T")[0];
  };

  const updateStatus = async (quotationId, newStatus) => {
    try {
      setLoading(true);
      const quotationToUpdate = quotations.find((q) => q.id === quotationId) || selectedQuotation;
      if (!quotationToUpdate) throw new Error("Quotation not found in state.");

      const payload = {
        current_status: newStatus,
        rfq: quotationToUpdate.rfq || null,
        items: quotationToUpdate.items
          ? quotationToUpdate.items.map((item) => ({
              id: item.id || null,
              item_name: item.item_name || null,
              product_name: item.product_name || null,
              quantity: item.quantity || 1,
              unit: item.unit || null,
              unit_price: item.unit_price || 0.00,
              total_price: item.total_price || (item.quantity || 1) * (item.unit_price || 0.00),
            }))
          : [],
      };
      console.log("Updating quotation status with payload:", payload);

      const response = await apiClient.put(`/quotations/${quotationId}/`, payload);
      console.log("API response:", response.data);
      const updatedQuotation = response.data;

      setQuotations((prev) =>
        prev.map((q) =>
          q.id === quotationId
            ? {
                ...q,
                current_status: updatedQuotation.current_status,
                is_due_reminder:
                  updatedQuotation.current_status === "Approved" &&
                  (!updatedQuotation.purchase_order || updatedQuotation.purchase_order.length === 0) &&
                  new Date(updatedQuotation.due_date) < new Date().setHours(0, 0, 0, 0),
              }
            : q
        )
      );

      if (selectedQuotation && selectedQuotation.id === quotationId) {
        setSelectedQuotation((prev) => ({
          ...prev,
          current_status: updatedQuotation.current_status,
          is_due_reminder:
            updatedQuotation.current_status === "Approved" &&
            (!updatedQuotation.purchase_order || updatedQuotation.purchase_order.length === 0) &&
            new Date(updatedQuotation.due_date) < new Date().setHours(0, 0, 0, 0),
        }));
      }

      if (convertPurchaseOrder && convertPurchaseOrder.id === quotationId) {
        setConvertPurchaseOrder((prev) => ({
          ...prev,
          current_status: updatedQuotation.current_status,
          is_due_reminder:
            updatedQuotation.current_status === "Approved" &&
            (!updatedQuotation.purchase_order || updatedQuotation.purchase_order.length === 0) &&
            new Date(updatedQuotation.due_date) < new Date().setHours(0, 0, 0, 0),
        }));
        setPurchaseOrderData((prev) => ({
          ...prev,
          current_status: updatedQuotation.current_status,
        }));
      }

      toast.success(`Status changed to ${newStatus}`);
    } catch (err) {
      console.error("Failed to update quotation status:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      if (err.response?.status === 400 && err.response?.data?.rfq && err.response?.data?.items) {
        try {
          const patchPayload = { current_status: newStatus };
          console.log("Falling back to PATCH with payload:", patchPayload);
          const patchResponse = await apiClient.patch(`/quotations/${quotationId}/`, patchPayload);
          console.log("PATCH API response:", patchResponse.data);
          const patchedQuotation = patchResponse.data;

          setQuotations((prev) =>
            prev.map((q) =>
              q.id === quotationId
                ? {
                    ...q,
                    current_status: patchedQuotation.current_status,
                    is_due_reminder:
                      patchedQuotation.current_status === "Approved" &&
                      (!patchedQuotation.purchase_order || patchedQuotation.purchase_order.length === 0) &&
                      new Date(patchedQuotation.due_date) < new Date().setHours(0, 0, 0, 0),
                  }
                : q
            )
          );

          if (selectedQuotation && selectedQuotation.id === quotationId) {
            setSelectedQuotation((prev) => ({
              ...prev,
              current_status: patchedQuotation.current_status,
              is_due_reminder:
                patchedQuotation.current_status === "Approved" &&
                (!patchedQuotation.purchase_order || patchedQuotation.purchase_order.length === 0) &&
                new Date(patchedQuotation.due_date) < new Date().setHours(0, 0, 0, 0),
            }));
          }

          if (convertPurchaseOrder && convertPurchaseOrder.id === quotationId) {
            setConvertPurchaseOrder((prev) => ({
              ...prev,
              current_status: patchedQuotation.current_status,
              is_due_reminder:
                patchedQuotation.current_status === "Approved" &&
                (!patchedQuotation.purchase_order || patchedQuotation.purchase_order.length === 0) &&
                new Date(patchedQuotation.due_date) < new Date().setHours(0, 0, 0, 0),
            }));
            setPurchaseOrderData((prev) => ({
              ...prev,
              current_status: patchedQuotation.current_status,
            }));
          }

          toast.success(`Status changed to ${newStatus} (via PATCH)`);
          return;
        } catch (patchErr) {
          console.error("Failed to update quotation status with PATCH:", {
            message: patchErr.message,
            response: patchErr.response?.data,
            status: patchErr.response?.status,
          });
        }
      }
      toast.error(
        `Failed to update status: ${err.response?.data?.detail ||
          err.response?.data?.current_status?.[0] ||
          err.response?.data?.rfq?.[0] ||
          err.response?.data?.items?.[0] ||
          err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToPurchaseOrder = (quotation) => {
    setConvertPurchaseOrder(quotation);
    setShowOrderTypeModal(true);
  };

  const selectOrderType = (orderType) => {
    setShowOrderTypeModal(false);
    if (orderType === "full") {
      setPurchaseOrderData({
        ...convertPurchaseOrder,
        client_po_number: "",
        po_file: null,
        items: convertPurchaseOrder.items.map((item) => ({
          ...item,
          quantity: item.quantity,
        })),
        order_type: orderType,
      });
    } else if (orderType === "partial") {
      const totalItems = convertPurchaseOrder.items.length;
      const existingPartialOrders = convertPurchaseOrder.purchase_order?.filter(po => po.order_type === "partial").length || 0;
      const maxSelectableItems = totalItems - existingPartialOrders - 1;

      if (maxSelectableItems <= 0) {
        toast.error("No more items can be selected for a partial order.");
        return;
      }

      setPartialOrders([]); // Reset partial orders for new selection
      navigate("/pre-job/partial-order-selection", {
        state: {
          quotationData: convertPurchaseOrder,
          maxSelectableItems: maxSelectableItems,
        },
      });
    }
  };

  const handlePoFileChange = (e, index) => {
    const file = e.target.files[0];
    setPurchaseOrderData((prev) => {
      const newFiles = prev?.po_files ? [...prev.po_files] : [];
      newFiles[index] = file;
      return {
        ...prev,
        po_files: newFiles,
      };
    });
  };

  const handleSavePurchaseOrder = async () => {
    if (!purchaseOrderData) return;

    const formData = new FormData();
    formData.append("quotation", convertPurchaseOrder.id);
    formData.append("client_po_number", purchaseOrderData.client_po_number || "");
    formData.append("order_type", purchaseOrderData.order_type || "full");
    formData.append(
      "items",
      JSON.stringify(
        purchaseOrderData.items.map((item) => ({
          item_name: item.item_name || null,
          product_name: item.product_name || null,
          quantity: item.quantity,
          unit: item.unit || null,
          unit_price: item.unit_price || null,
        }))
      )
    );
    if (purchaseOrderData.po_file) {
      formData.append("po_file", purchaseOrderData.po_file);
    } else if (purchaseOrderData.po_files) {
      purchaseOrderData.po_files.forEach((file, index) => {
        if (file) formData.append(`po_file_${index}`, file);
      });
    }

    try {
      const response = await apiClient.post("/purchase-orders/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Purchase order created successfully!");
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === convertPurchaseOrder.id
            ? { ...q, purchase_order: [...(q.purchase_order || []), response.data], current_status: "PO Created" }
            : q
        )
      );
      if (selectedQuotation && selectedQuotation.id === convertPurchaseOrder.id) {
        setSelectedQuotation((prev) => ({
          ...prev,
          purchase_order: [...(prev.purchase_order || []), response.data],
          current_status: "PO Created",
        }));
      }
      // Store uploaded file info
      setUploadedPOFiles(prev => ({
        ...prev,
        [convertPurchaseOrder.id]: {
          client_po_number: purchaseOrderData.client_po_number,
          fileName: purchaseOrderData.po_file ? purchaseOrderData.po_file.name : purchaseOrderData.po_files.map(f => f?.name).join(", "),
        },
      }));
      setConvertPurchaseOrder(null);
      setPurchaseOrderData(null);
      setShowUploadPOModal(false); // Close upload modal
      fetchQuotations();
    } catch (err) {
      console.error("Failed to create purchase order:", err);
      toast.error("Failed to create purchase order: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  const handlePrint = (quotation) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation ${quotation.quotation_no}</title>
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
        <h1>Quotation #${quotation.quotation_no}</h1>
        <div class="details">
          <p><strong>Company Name:</strong> ${quotation.company_name || ""}</p>
          <p><strong>Address:</strong> ${quotation.address || ""}</p>
          <p><strong>Phone:</strong> ${quotation.phone || ""}</p>
          <p><strong>Email:</strong> ${quotation.email || ""}</p>
          <p><strong>Attention Name:</strong> ${quotation.attention_name || ""}</p>
          <p><strong>Attention Phone:</strong> ${quotation.attention_phone || ""}</p>
          <p><strong>Attention Email:</strong> ${quotation.attention_email || ""}</p>
          <p><strong>Created At:</strong> ${quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : ""}</p>
          <p><strong>Due Date:</strong> ${quotation.due_date ? new Date(quotation.due_date).toLocaleDateString() : ""}</p>
          <p><strong>Status:</strong> ${quotation.current_status || ""}</p>
          <p><strong>Latest Remarks:</strong> ${quotation.latest_remarks || ""}</p>
          <h3>RFQ Details</h3>
          <p><strong>RFQ No:</strong> ${quotation.rfq_details?.rfq_no || ""}</p>
          <p><strong>RFQ Channel:</strong> ${quotation.rfq_details?.rfq_channel || ""}</p>
          <p><strong>Assigned To:</strong> ${quotation.rfq_details?.assign_to_name || ""}</p>
          <p><strong>Designation:</strong> ${quotation.rfq_details?.assign_to_designation || ""}</p>
        </div>
        ${quotation.items && quotation.items.length > 0
          ? `
          <h3>Items & Products</h3>
          <table>
            <thead>
              <tr>
                <th>Item/Product</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.item_name || item.product_name || ""}</td>
                  <td>${item.quantity || ""}</td>
                  <td>${item.unit || ""}</td>
                  <td>$${item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}</td>
                  <td>$${item.total_price != null ? Number(item.total_price).toFixed(2) : "0.00"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="total">
            Total Amount: $${quotation.items
              .reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0)
              .toFixed(2)}
          </div>
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

  const handleDelete = async (quotationId) => {
    if (!window.confirm("Are you sure you want to delete this quotation?")) return;
    try {
      await apiClient.delete(`/quotations/${quotationId}/`);
      toast.success("Quotation deleted successfully");
      setQuotations((prev) => prev.filter((q) => q.id !== quotationId));
      setSelectedQuotation(null);
      setConvertPurchaseOrder(null);
      setUploadedPOFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[quotationId];
        return newFiles;
      });
    } catch (err) {
      console.error("Failed to delete quotation:", err);
      toast.error("Failed to delete quotation: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  const handleAddRemark = async (quotationId, remark) => {
    try {
      const response = await apiClient.patch(`/quotations/${quotationId}/`, {
        latest_remarks: remark,
      });
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === quotationId ? { ...q, latest_remarks: response.data.latest_remarks } : q
        )
      );
      if (selectedQuotation?.id === quotationId) {
        setSelectedQuotation((prev) => ({ ...prev, latest_remarks: response.data.latest_remarks }));
      }
      toast.success("Remark added successfully!");
    } catch (err) {
      console.error("Failed to add remark:", err);
      toast.error("Failed to add remark: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

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

  const tableFields = [
    { name: "si_no", label: "SI No" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "quotation_no", label: "Quotation No" },
    { name: "rfq_details.rfq_no", label: "RFQ No" },
    { name: "rfq_details.assign_to_name", label: "Assigned To" },
    { name: "current_status", label: "Status" },
    { name: "next_followup_date", label: "Next Followup Date", type: "date" },
    { name: "latest_remarks", label: "Latest Remarks" },
  ];

  const allSingleFields = [
    { name: "quotation_no", label: "Quotation No", type: "text" },
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
    { name: "next_followup_date", label: "Next Followup Date", type: "date" },
    { name: "rfq_details.rfq_no", label: "RFQ No", type: "text" },
    { name: "rfq_details.rfq_channel", label: "RFQ Channel", type: "text" },
    { name: "rfq_details.assign_to_name", label: "Assigned To", type: "text" },
    { name: "rfq_details.assign_to_designation", label: "Designation", type: "text" },
    { name: "latest_remarks", label: "Latest Remarks", type: "text" },
  ];

  const repeatableFields = [
    { name: "item_name", label: "Item" },
    { name: "product_name", label: "Product" },
    { name: "quantity", label: "Quantity" },
    { name: "unit", label: "Unit" },
    { name: "unit_price", label: "Unit Price" },
    { name: "total_price", label: "Total Price" },
  ];

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const totalPages = Math.ceil(quotations.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotations = quotations.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <p className="text-black text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (quotations.length === 0) return <p className="text-black text-center">No quotations found.</p>;

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-black">View Quotations</h2>
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {tableFields.map((field) => (
                <th
                  key={field.name}
                  className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap"
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
              <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentQuotations.map((quotation) => (
              <tr
                key={quotation.id}
                className={`border-t hover:bg-gray-50 ${quotation.is_due_reminder ? "bg-red-50" : ""}`}
              >
                {tableFields.map((field) => (
                  <td
                    key={field.name}
                    className="px-4 py-3 text-sm text-black whitespace-nowrap"
                  >
                    {field.name === "current_status" ? (
                      <select
                        value={quotation.current_status || "Pending"}
                        onChange={(e) => updateStatus(quotation.id, e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={loading}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="PO Created">PO Created</option>
                      </select>
                    ) : field.name === "latest_remarks" ? (
                      <input
                        type="text"
                        value={quotation.latest_remarks || ""}
                        onChange={(e) => handleAddRemark(quotation.id, e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Add remark"
                      />
                    ) : field.name.includes("rfq_details.") ? (
                      quotation.rfq_details[field.name.split(".")[1]] || ""
                    ) : field.type === "date" ? (
                      quotation[field.name]
                        ? new Date(quotation[field.name]).toLocaleDateString()
                        : ""
                    ) : (
                      quotation[field.name] || ""
                    )}
                    {field.name === "next_followup_date" && quotation.is_due_reminder && (
                      <span className="text-red-600 text-xs ml-2">(Due Reminder)</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-black flex space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => setSelectedQuotation(quotation)}
                    className="bg-indigo-500 text-white px-3 py-2 text-sm rounded hover:bg-indigo-600 transition-colors duration-200"
                  >
                    View Details
                  </button>
                  {(!quotation.purchase_order || quotation.purchase_order.length === 0) && (
                    <button
                      onClick={() => handleConvertToPurchaseOrder(quotation)}
                      className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
                        quotation.current_status === "Approved"
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      disabled={quotation.current_status !== "Approved"}
                    >
                      Convert to PO
                    </button>
                  )}
                  {(quotation.purchase_order && quotation.purchase_order.some(po => po.order_type === "partial") && !uploadedPOFiles[quotation.id]) && (
                    <button
                      onClick={() => {
                        setConvertPurchaseOrder(quotation);
                        setPurchaseOrderData({
                          ...quotation,
                          client_po_number: "",
                          po_files: new Array(partialOrders.length).fill(null), // Initialize array for multiple files
                          order_type: "partial",
                        });
                        setShowUploadPOModal(true);
                      }}
                      className="px-3 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 flex items-center"
                    >
                      <Upload size={16} className="mr-1" /> Upload PO
                    </button>
                  )}
                  {uploadedPOFiles[quotation.id] && (
                    <button
                      disabled
                      className="px-3 py-2 text-sm rounded bg-gray-300 text-gray-500 cursor-not-allowed flex items-center"
                    >
                      <Upload size={16} className="mr-1" /> Upload PO (Uploaded)
                    </button>
                  )}
                  <button
                    onClick={() => handlePrint(quotation)}
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

      {selectedQuotation && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="scale-65 bg-white rounded-lg shadow-sm p-6 w-full">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Quotation Details #{selectedQuotation.quotation_no}
              {selectedQuotation.is_due_reminder && (
                <span className="text-red-600 text-sm ml-2">(Due Reminder)</span>
              )}
            </h3>
            <ViewCard
              singleFields={allSingleFields}
              repeatableFields={
                selectedQuotation.items && selectedQuotation.items.length > 0
                  ? getRepeatableFields(selectedQuotation.items)
                  : []
              }
              title={
                selectedQuotation.items && selectedQuotation.items.length > 0
                  ? (() => {
                      const hasItems = selectedQuotation.items.some(
                        (item) => item.item_name && item.item_name.trim() !== ""
                      );
                      const hasProducts = selectedQuotation.items.some(
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
              showRepeatableFields={selectedQuotation.items && selectedQuotation.items.length > 0}
              initialData={selectedQuotation}
            />
            {partialOrders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2 text-black">Created Partial Orders</h3>
                {partialOrders.map((order, index) => (
                  <div key={index} className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Partial Order {index + 1}</h4>
                    <div className="overflow-x-auto rounded-lg shadow-sm">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                              Item/Product
                            </th>
                            <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                              Unit
                            </th>
                            <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                              Unit Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                                {item.item_name || item.product_name || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                                {item.quantity || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                                {item.unit || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                                ${item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => navigate(`/pre-job/edit-quotation`, {
                  state: { quotationData: selectedQuotation, isEditing: true, partialOrders, uploadedPOFiles: uploadedPOFiles[selectedQuotation.id] ? { [selectedQuotation.id]: uploadedPOFiles[selectedQuotation.id] } : {} },
                })}
                className={`px-3 py-2 rounded transition-colors duration-200 ${
                  partialOrders.length > 0 || (selectedQuotation.purchase_order && selectedQuotation.purchase_order.some(po => po.order_type === "full"))
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-500 text-white hover:bg-indigo-600"
                }`}
                disabled={partialOrders.length > 0 || (selectedQuotation.purchase_order && selectedQuotation.purchase_order.some(po => po.order_type === "full"))}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedQuotation.id)}
                className="bg-red-500 text-white hover:bg-red-600 px-3 py-2 rounded transition-colors duration-200"
              >
                Delete
              </button>
              <button
                onClick={() => handlePrint(selectedQuotation)}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors duration-200 flex items-center"
              >
                <Printer size={16} className="mr-1" /> Print
              </button>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderTypeModal && convertPurchaseOrder && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-4 w-64">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">Select Order Type</h3>
            <button
              onClick={() => selectOrderType("full")}
              className="w-full bg-green-500 text-white px-4 py-2 mb-2 rounded hover:bg-green-600 transition-colors duration-200"
            >
              Full Order
            </button>
            <button
              onClick={() => selectOrderType("partial")}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200"
            >
              Partial Order
            </button>
            <button
              onClick={() => setShowOrderTypeModal(false)}
              className="w-full bg-gray-200 text-black px-4 py-2 mt-2 rounded hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {convertPurchaseOrder && purchaseOrderData && purchaseOrderData.order_type === "full" && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Convert Quotation #{convertPurchaseOrder.quotation_no} to Full Purchase Order
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Client PO Number</label>
              <input
                type="text"
                value={purchaseOrderData.client_po_number}
                onChange={(e) =>
                  setPurchaseOrderData((prev) => ({
                    ...prev,
                    client_po_number: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter Client PO Number (Optional)"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Upload PO File</label>
              <input
                type="file"
                onChange={handlePoFileChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSavePurchaseOrder}
                className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors duration-200 flex items-center"
              >
                <Upload size={16} className="mr-1" /> Save Purchase Order
              </button>
              <button
                onClick={() => {
                  setConvertPurchaseOrder(null);
                  setPurchaseOrderData(null);
                }}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadPOModal && convertPurchaseOrder && purchaseOrderData && purchaseOrderData.order_type === "partial" && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-gradient-to-br from-indigo-100 to-white rounded-lg shadow-2xl p-6 w-full max-w-2xl h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-indigo-900 border-b-2 border-indigo-300 pb-2">
              Upload PO Files for Quotation #{convertPurchaseOrder.quotation_no}
            </h3>
            <p className="text-gray-600 mb-6">
              Please upload {partialOrders.length} PO files corresponding to the {partialOrders.length} partial orders created.
            </p>
            <div className="space-y-4">
              {Array.from({ length: partialOrders.length }, (_, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Partial Order {index + 1}</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Upload PO File</label>
                    <input
                      type="file"
                      onChange={(e) => handlePoFileChange(e, index)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    />
                  </div>
                  {purchaseOrderData.po_files && purchaseOrderData.po_files[index] && (
                    <p className="text-sm text-green-600 mt-1">Selected: {purchaseOrderData.po_files[index].name}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={handleSavePurchaseOrder}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center disabled:bg-gray-400"
                disabled={purchaseOrderData.po_files?.some(file => !file)}
              >
                <Upload size={18} className="mr-2" /> Save All POs
              </button>
              <button
                onClick={() => {
                  setShowUploadPOModal(false);
                  setConvertPurchaseOrder(null);
                  setPurchaseOrderData(null);
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200"
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

export default ViewQuotation;