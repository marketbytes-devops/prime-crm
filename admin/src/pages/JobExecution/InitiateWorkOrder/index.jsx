import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Printer, Upload } from "lucide-react";
import ViewCard from "../../../components/ViewCard";

const InitiateWorkOrder = ({ handlePrint }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showAddWoModal, setShowAddWoModal] = useState(false);
  const [workOrderData, setWorkOrderData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Dummy data
  const dummyPurchaseOrders = [
    {
      id: 1,
      client_po_number: "PO001",
      created_at: "2025-07-01",
      current_status: "Collection Pending",
      assigned_to_name: "John Doe",
      items: [
        { item_name: "Widget A", product_name: "Product A", quantity: 10, unit: "pcs", unit_price: 100 },
        { item_name: "Widget B", product_name: "Product B", quantity: 5, unit: "pcs", unit_price: 200 },
      ],
    },
    {
      id: 2,
      client_po_number: "PO002",
      created_at: "2025-07-02",
      current_status: "Collection Pending",
      assigned_to_name: "Jane Smith",
      items: [
        { item_name: "Gadget X", product_name: "Product X", quantity: 8, unit: "pcs", unit_price: 150 },
      ],
    },
  ];

  const dummyWorkOrders = [
    {
      id: 1,
      purchase_order: 1,
      client_po_number: "PO001",
      created_at: "2025-07-03",
      current_status: "Collected",
      assigned_to_name: "John Doe",
    },
  ];

  const dummyTechnicians = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Mike Johnson" },
  ];

  useEffect(() => {
    // Set dummy data
    setPurchaseOrders(dummyPurchaseOrders);
    setWorkOrders(dummyWorkOrders);
    setTechnicians(dummyTechnicians);
  }, []);

  const handleConvertToWorkOrder = (po) => {
    setSelectedPurchaseOrder(po);
    setWorkOrderData({
      purchase_order: po.id,
      date_received: new Date().toISOString().split("T")[0],
      exp_date_completion: "",
      onsite_lab: "Onsite",
      range: "",
      serial_number: "",
      site_location: "",
      remarks: "",
      items: po.items.map((item) => ({ ...item })),
      assigned_to: "",
      work_order_type: "single",
    });
    setShowWorkOrderModal(true);
  };

  const handleAddWoWithoutPo = () => {
    setWorkOrderData({
      purchase_order: null,
      date_received: new Date().toISOString().split("T")[0],
      exp_date_completion: "",
      onsite_lab: "Onsite",
      range: "",
      serial_number: "",
      site_location: "",
      remarks: "",
      items: [],
      assigned_to: "",
      work_order_type: "single",
    });
    setShowAddWoModal(true);
  };

  const handleSaveWorkOrder = () => {
    if (!workOrderData) return;
    
    // Simulate saving work order
    const newWorkOrder = {
      id: workOrders.length + 1,
      ...workOrderData,
      client_po_number: selectedPurchaseOrder?.client_po_number || `WO${workOrders.length + 1}`,
      created_at: new Date().toISOString().split("T")[0],
      current_status: "Collected",
      assigned_to_name: technicians.find(tech => tech.id === workOrderData.assigned_to)?.name || "",
    };

    setWorkOrders(prev => workOrderData.id
      ? prev.map(wo => wo.id === newWorkOrder.id ? newWorkOrder : wo)
      : [...prev, newWorkOrder]);

    if (workOrderData.purchase_order) {
      setPurchaseOrders(prev =>
        prev.map(po =>
          po.id === workOrderData.purchase_order
            ? { ...po, current_status: "Collected" }
            : po
        )
      );
    }

    toast.success("Work order created successfully!");
    setShowWorkOrderModal(false);
    setShowAddWoModal(false);
    setWorkOrderData(null);
  };

  const handleMarkAsCollected = (po) => {
    setPurchaseOrders(prev =>
      prev.map(item =>
        item.id === po.id ? { ...item, current_status: "Collected" } : item
      )
    );
    toast.success(`Purchase Order #${po.client_po_number} marked as Collected!`);
  };

  const tableFields = [
    { name: "si_no", label: "Sl:No" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "client_po_number", label: "PO Number" },
    { name: "assigned_to_name", label: "Assigned To" },
    { name: "current_status", label: "Current Status" },
  ];

  const singleFields = [
    { name: "client_po_number", label: "PO Number", type: "text" },
    { name: "created_at", label: "Created At", type: "date" },
    { name: "current_status", label: "Current Status", type: "text" },
    { name: "assigned_to_name", label: "Assigned To", type: "text" },
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

  const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-black">Initiate Work Order</h2>
      <button
        onClick={handleAddWoWithoutPo}
        className="bg-blue-500 text-white px-4 py-2 mb-4 rounded hover:bg-blue-600"
      >
        Add WO Without PO
      </button>
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
          {getPaginatedData(purchaseOrders).map((po, index) => (
            <tr key={po.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-black">{index + 1 + (currentPage - 1) * itemsPerPage}</td>
              {tableFields.slice(1).map((field) => (
                <td key={field.name} className="px-4 py-3 text-sm text-black">
                  {field.type === "date" && po[field.name]
                    ? new Date(po[field.name]).toLocaleDateString()
                    : po[field.name] || ""}
                </td>
              ))}
              <td className="px-4 py-3 text-sm text-black flex space-x-2">
                <button
                  onClick={() => setSelectedPurchaseOrder(po)}
                  className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600"
                >
                  View PO
                </button>
                {po.current_status === "Collection Pending" ? (
                  <button
                    onClick={() => handleMarkAsCollected(po)}
                    className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
                  >
                    Mark as Collected
                  </button>
                ) : (
                  <button
                    onClick={() => handleConvertToWorkOrder(po)}
                    className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                  >
                    Convert to WO
                  </button>
                )}
                <button
                  onClick={() => handlePrint(po, "po")}
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

      {/* Purchase Order Details Modal */}
      {selectedPurchaseOrder && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              Purchase Order #{selectedPurchaseOrder.client_po_number}
            </h3>
            <ViewCard
              singleFields={singleFields}
              repeatableFields={selectedPurchaseOrder.items && selectedPurchaseOrder.items.length > 0 ? repeatableFields : []}
              title="Items"
              showRepeatableFields={selectedPurchaseOrder.items && selectedPurchaseOrder.items.length > 0}
              initialData={selectedPurchaseOrder}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => handlePrint(selectedPurchaseOrder, "po")}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <Printer size={16} className="mr-1" /> Print
              </button>
              <button
                onClick={() => setSelectedPurchaseOrder(null)}
                className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Work Order Modal (Convert from PO or Add Without PO) */}
      {(showWorkOrderModal || showAddWoModal) && workOrderData && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-black border-b pb-2">
              {showWorkOrderModal ? `Convert PO #${selectedPurchaseOrder?.client_po_number} to Work Order` : "Add Work Order Without PO"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Work Order Type</label>
              <select
                value={workOrderData.work_order_type}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, work_order_type: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="single">Single WO</option>
                <option value="split">Split WO</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Date Received</label>
              <input
                type="date"
                value={workOrderData.date_received}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, date_received: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text gray-700">Exp. Date of Completion</label>
              <input
                type="date"
                value={workOrderData.exp_date_completion}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, exp_date_completion: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700"> Onsite/Lab</label>
              <select
                value={workOrderData.onsite_lab}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, onsite_lab: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Onsite">Onsite</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Range</label>
              <input
                type="text"
                value={workOrderData.range}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, range: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Serial Number</label>
              <input
                type="text"
                value={workOrderData.serial_number}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, serial_number: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Site Location</label>
              <input
                type="text"
                value={workOrderData.site_location}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, site_location: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Remarks</label>
              <textarea
                value={workOrderData.remarks}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, remarks: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {showWorkOrderModal && workOrderData.items.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Items</label>
                {workOrderData.items.map((item, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={item.item_name || item.product_name || ""}
                      disabled
                      className="w-full p-2 border rounded bg-gray-100"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      disabled
                      className="w-24 p-2 border rounded bg-gray-100"
                    />
                  </div>
                ))}
              </div>
            )}
            {showAddWoModal && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Items</label>
                {workOrderData.items.map((item, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={item.item_name || ""}
                      onChange={(e) => {
                        const newItems = [...workOrderData.items];
                        newItems[index].item_name = e.target.value;
                        setWorkOrderData((prev) => ({ ...prev, items: newItems }));
                      }}
                      placeholder="Item Name"
                      className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) => {
                        const newItems = [...workOrderData.items];
                        newItems[index].quantity = parseInt(e.target.value) || 0;
                        setWorkOrderData((prev) => ({ ...prev, items: newItems }));
                      }}
                      placeholder="Quantity"
                      className="w-24 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => {
                        const newItems = workOrderData.items.filter((_, i) => i !== index);
                        setWorkOrderData((prev) => ({ ...prev, items: newItems }));
                      }}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setWorkOrderData((prev) => ({
                    ...prev,
                    items: [...prev.items, { item_name: "", quantity: 1, unit: "", unit_price: "" }],
                  }))}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mt-2"
                >
                  Add Item
                </button>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Assign To</label>
              <select
                value={workOrderData.assigned_to}
                onChange={(e) => setWorkOrderData((prev) => ({ ...prev, assigned_to: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Technician</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSaveWorkOrder}
                className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 flex items-center"
              >
                <Upload size={16} className="mr-1" /> Save Work Order
              </button>
              <button
                onClick={() => {
                  setShowWorkOrderModal(false);
                  setShowAddWoModal(false);
                  setWorkOrderData(null);
                }}
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

export default InitiateWorkOrder;