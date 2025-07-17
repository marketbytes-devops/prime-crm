import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Printer, Upload } from "lucide-react";
import ViewCard from "../../../components/ViewCard";
import apiClient from "../../../helpers/apiClient";

const Delivery = ({ handlePrint }) => {
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    // Fetch delivery notes
    apiClient.get("delivery-notes/")
      .then(response => setDeliveryNotes(response.data))
      .catch(error => toast.error("Failed to fetch delivery notes: " + (error.response?.data?.detail || error.message)));

    // Fetch technicians
    apiClient.get("teams/")
      .then(response => setTechnicians(response.data))
      .catch(error => toast.error("Failed to fetch technicians: " + (error.response?.data?.detail || error.message)));
  }, []);

  const handleUpdateDeliveryNote = (dn) => {
    setSelectedDeliveryNote(dn);
    setUpdateData({
      ...dn,
      signed_delivery_note: null,
      delivery_status: dn.delivery_status,
      assigned_to: dn.assigned_to || "",
    });
    setShowUpdateModal(true);
  };

  const handleSaveDeliveryNote = () => {
    if (!updateData) return;
    const formData = new FormData();
    Object.keys(updateData).forEach(key => {
      if (key === 'items') {
        formData.append('items', JSON.stringify(updateData.items));
      } else if (key === 'signed_delivery_note' && updateData[key]) {
        formData.append(key, updateData[key]);
      } else if (updateData[key] !== null && updateData[key] !== undefined) {
        formData.append(key, updateData[key]);
      }
    });

    apiClient.put(`delivery-notes/${updateData.id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then(response => {
        setDeliveryNotes(prev =>
          prev.map(dn => dn.id === response.data.id ? response.data : dn)
        );
        toast.success("Delivery note updated successfully!");
        setShowUpdateModal(false);
        setUpdateData(null);
      })
      .catch(error => toast.error("Failed to update delivery note: " + (error.response?.data?.detail || error.message)));
  };

  const tableFields = [
    { name: "si_no", label: "Sl:No" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "delivery_note_number", label: "DN Number" },
    { name: "work_order", label: "WO Number", render: (dn) => dn.work_order.wo_number },
    { name: "assigned_to_name", label: "Assigned To" },
    { name: "delivery_status", label: "Status" },
  ];

  const singleFields = [
    { name: "delivery_note_number", label: "DN Number", type: "text" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "delivery_status", label: "Status", type: "text" },
    { name: "assigned_to_name", label: "Assigned To", type: "text" },
    { name: "work_order", label: "WO Number", render: (dn) => dn.work_order.wo_number, type: "text" },
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

  const totalPages = Math.ceil(deliveryNotes.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-black">Delivery Notes</h2>
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
          {getPaginatedData(deliveryNotes).map((dn, index) => (
            <tr key={dn.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-black">{index + 1 + (currentPage - 1) * itemsPerPage}</td>
              {tableFields.slice(1).map((field) => (
                <td key={field.name} className="px-4 py-3 text-sm text-black">
                  {field.render
                    ? field.render(dn)
                    : field.type === "date" && dn[field.name]
                    ? new Date(dn[field.name]).toLocaleDateString()
                    : dn[field.name] || ""}
                </td>
              ))}
              <td className="px-4 py-3 text-sm text-black flex space-x-2">
                <button
                  onClick={() => setSelectedDeliveryNote(dn)}
                  className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600"
                >
                  View DN
                </button>
                <button
                  onClick={() => handleUpdateDeliveryNote(dn)}
                  className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
                >
                  Update DN
                </button>
                <button
                  onClick={() => handlePrint(dn, "dn")}
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

      {/* Delivery Note Details Modal */}
      {selectedDeliveryNote && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Delivery Note #{selectedDeliveryNote.delivery_note_number}
            </h3>
            <ViewCard
              singleFields={singleFields}
              repeatableFields={selectedDeliveryNote.items && selectedDeliveryNote.items.length > 0 ? repeatableFields : []}
              title="Items"
              showRepeatableFields={selectedDeliveryNote.items && selectedDeliveryNote.items.length > 0}
              initialData={selectedDeliveryNote}
            />
            {selectedDeliveryNote.signed_delivery_note && (
              <div className="mt-4">
                <a
                  href={selectedDeliveryNote.signed_delivery_note}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Signed Delivery Note
                </a>
              </div>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => handlePrint(selectedDeliveryNote, "dn")}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <Printer size={16} className="mr-1" /> Print
              </button>
              <button
                onClick={() => setSelectedDeliveryNote(null)}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Delivery Note Modal */}
      {showUpdateModal && updateData && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Update Delivery Note #{updateData.delivery_note_number}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Delivery Status</label>
              <select
                value={updateData.delivery_status}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, delivery_status: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Delivery Pending">Delivery Pending</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Assign To</label>
              <select
                value={updateData.assigned_to}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, assigned_to: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Technician</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Upload Signed Delivery Note</label>
              <input
                type="file"
                onChange={(e) => setUpdateData((prev) => ({ ...prev, signed_delivery_note: e.target.files[0] }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSaveDeliveryNote}
                className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 flex items-center"
              >
                <Upload size={16} className="mr-1" /> Save
              </button>
              <button
                onClick={() => setShowUpdateModal(false)}
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

export default Delivery;