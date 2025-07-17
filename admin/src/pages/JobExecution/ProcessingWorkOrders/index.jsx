import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Printer, Upload } from "lucide-react";
import ViewCard from "../../../components/ViewCard";
import apiClient from "../../../helpers/apiClient";

const ProcessingWorkOrders = ({ handlePrint }) => {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [showUpdateWoModal, setShowUpdateWoModal] = useState(false);
  const [updateWoData, setUpdateWoData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    apiClient.get("work-orders/?current_status=Processing")
      .then(response => setWorkOrders(response.data))
      .catch(error => toast.error("Failed to fetch work orders: " + (error.response?.data?.detail || error.message)));
  }, []);

  const handleUpdateWorkOrder = (wo) => {
    setSelectedWorkOrder(wo);
    setUpdateWoData({
      ...wo,
      certificate_label: wo.certificate_label || "",
      certificate_number: wo.certificate_number || "",
      calibration_date: wo.calibration_date || "",
      calibration_due_date: wo.calibration_due_date || "",
      uuc_serial_number: wo.uuc_serial_number || "",
      certificate_file: null,
    });
    setShowUpdateWoModal(true);
  };

  const handleSaveUpdateWorkOrder = () => {
    if (!updateWoData) return;
    const formData = new FormData();
    Object.keys(updateWoData).forEach(key => {
      if (key === 'items') {
        formData.append('items', JSON.stringify(updateWoData.items));
      } else if (key === 'certificate_file' && updateWoData[key]) {
        formData.append(key, updateWoData[key]);
      } else if (updateWoData[key] !== null && updateWoData[key] !== undefined) {
        formData.append(key, updateWoData[key]);
      }
    });

    apiClient.put(`work-orders/${updateWoData.id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then(response => {
        setWorkOrders(prev =>
          prev.map(wo => wo.id === response.data.id ? response.data : wo)
        );
        toast.success("Work order updated successfully!");
        setShowUpdateWoModal(false);
        setUpdateWoData(null);
      })
      .catch(error => toast.error("Failed to update work order: " + (error.response?.data?.detail || error.message)));
  };

  const handleMoveToApproval = (wo) => {
    if (!wo.certificate_label || !wo.certificate_number) {
      toast.error("Certificate label and number are required to move to approval.");
      return;
    }
    apiClient.put(`work-orders/${wo.id}/`, {
      ...wo,
      current_status: "Pending Approval",
      items: wo.items,
    })
      .then(response => {
        setWorkOrders(prev =>
          prev.filter(w => w.id !== response.data.id)
        );
        toast.success("Work order moved to approval!");
        setShowUpdateWoModal(false);
        setUpdateWoData(null);
      })
      .catch(error => toast.error("Failed to move work order to approval: " + (error.response?.data?.detail || error.message)));
  };

  const tableFields = [
    { name: "si_no", label: "Sl:No" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "wo_number", label: "WO Number" },
    { name: "assigned_to_name", label: "Assigned To" },
    { name: "current_status", label: "Current Status" },
  ];

  const singleFields = [
    { name: "wo_number", label: "WO Number", type: "text" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "current_status", label: "Current Status", type: "text" },
    { name: "assigned_to_name", label: "Assigned To", type: "text" },
    { name: "date_received", label: "Date Received", type: "date" },
    { name: "exp_date_completion", label: "Exp. Completion", type: "date" },
    { name: "onsite_lab", label: "Onsite/Lab", type: "text" },
    { name: "range", label: "Range", type: "text" },
    { name: "serial_number", label: "Serial Number", type: "text" },
    { name: "site_location", label: "Site Location", type: "text" },
    { name: "remarks", label: "Remarks", type: "text" },
  ];

  const repeatableFields = [
    { name: "item_name", label: "Item" },
    { name: "product_name", label: "Product" },
    { name: "quantity", label: "Quantity" },
    { name: "unit", label: "Unit" },
    { name: "unit_price", label: "Unit Price" },
  ];

  const getPaginatedData = (data) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return data.slice(indexOfFirstItem, indexOfLastItem);
  };

  const totalPages = Math.ceil(workOrders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-black">Processing Work Orders</h2>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            {tableFields.map((field) => (
              <th key={field.name} className="px-4 py-2 text-sm font-medium text-black text-left">
                {field.label}
              </th>
            ))}
            <th className="px-4 py-2 text-sm font-medium text-black text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {getPaginatedData(workOrders).map((wo, index) => (
            <tr key={wo.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-black">{index + 1 + (currentPage - 1) * itemsPerPage}</td>
              {tableFields.slice(1).map((field) => (
                <td key={field.name} className="px-4 py-3 text-sm text-black">
                  {field.type === "date" && wo[field.name]
                    ? new Date(wo[field.name]).toLocaleDateString()
                    : wo[field.name] || ""}
                </td>
              ))}
              <td className="px-4 py-3 text-sm text-black flex space-x-2">
                <button
                  onClick={() => setSelectedWorkOrder(wo)}
                  className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600"
                >
                  View WO
                </button>
                <button
                  onClick={() => handleUpdateWorkOrder(wo)}
                  className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
                >
                  Update WO
                </button>
                <button
                  onClick={() => handlePrint(wo, "wo")}
                  className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
                >
                  <Printer size={16} className="mr-1" /> Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex justify-center items-center space-x-2">
        <button
          onClick={() => paginate(currentPage - 1)}
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
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          Next
        </button>
        <span className="text-sm text-black">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Work Order Details Modal */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Work Order #{selectedWorkOrder.wo_number}
            </h3>
            <ViewCard
              singleFields={singleFields}
              repeatableFields={selectedWorkOrder.items && selectedWorkOrder.items.length > 0 ? repeatableFields : []}
              title="Items"
              showRepeatableFields={selectedWorkOrder.items && selectedWorkOrder.items.length > 0}
              initialData={selectedWorkOrder}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => handlePrint(selectedWorkOrder, "wo")}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <Printer size={16} className="mr-1" /> Print
              </button>
              <button
                onClick={() => setSelectedWorkOrder(null)}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Work Order Modal */}
      {showUpdateWoModal && updateWoData && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Update Work Order #{updateWoData.wo_number}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Certificate & UUT Label</label>
              <select
                value={updateWoData.certificate_label}
                onChange={(e) => setUpdateWoData((prev) => ({ ...prev, certificate_label: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Label</option>
                <option value="Certificate">Certificate</option>
                <option value="UUT Label">UUT Label</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Certificate Number</label>
              <input
                type="text"
                value={updateWoData.certificate_number}
                onChange={(e) => setUpdateWoData((prev) => ({ ...prev, certificate_number: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Calibration Date</label>
              <input
                type="date"
                value={updateWoData.calibration_date}
                onChange={(e) => setUpdateWoData((prev) => ({ ...prev, calibration_date: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Calibration Due Date</label>
              <input
                type="date"
                value={updateWoData.calibration_due_date}
                onChange={(e) => setUpdateWoData((prev) => ({ ...prev, calibration_due_date: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">UUC Serial Number</label>
              <input
                type="text"
                value={updateWoData.uuc_serial_number}
                onChange={(e) => setUpdateWoData((prev) => ({ ...prev, uuc_serial_number: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Upload Certificates</label>
              <input
                type="file"
                onChange={(e) => setUpdateWoData((prev) => ({ ...prev, certificate_file: e.target.files[0] }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSaveUpdateWorkOrder}
                className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 flex items-center"
              >
                <Upload size={16} className="mr-1" /> Save
              </button>
              <button
                onClick={() => handleMoveToApproval(updateWoData)}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                disabled={!updateWoData.certificate_label || !updateWoData.certificate_number}
              >
                Move to Approval
              </button>
              <button
                onClick={() => setShowUpdateWoModal(false)}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300"
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

export default ProcessingWorkOrders;