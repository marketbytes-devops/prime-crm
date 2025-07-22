import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";

const PartialOrderSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quotationData } = location.state || {};
  const [numberOfPartialOrders, setNumberOfPartialOrders] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [createdPartialOrders, setCreatedPartialOrders] = useState([]);
  const [usedItemIds, setUsedItemIds] = useState([]);

  // Initialize savedItems from quotationData
  useEffect(() => {
    if (quotationData?.items) {
      console.log("Quotation Data Items:", quotationData.items);
      setSavedItems(quotationData.items);
    } else {
      console.warn("No quotation data or items found:", quotationData);
    }
  }, [quotationData]);

  // Handle input change for number of partial orders
  const handleNumberOfPartialOrdersChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    console.log("Number of Partial Orders Changed:", value);
    setNumberOfPartialOrders(value);
  };

  // Handle checkbox selection for multiple items
  const handleItemSelection = (itemId) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        console.log("Deselecting item:", itemId);
        return prev.filter((id) => id !== itemId);
      }
      if (prev.length >= savedItems.length - usedItemIds.length - 1) {
        toast.error("Cannot select all remaining items for a partial order.");
        console.warn("Cannot select all remaining items:", prev);
        return prev;
      }
      console.log("Selecting item:", itemId);
      return [...prev, itemId];
    });
  };

  // Determine if Generate button is disabled
  const isGenerateDisabled = () => {
    if (selectedItemIds.length === 0) {
      console.log("Generate disabled: No items selected");
      return true;
    }
    if (selectedItemIds.length >= savedItems.length - usedItemIds.length) {
      console.log("Generate disabled: Cannot select all remaining items");
      return true;
    }
    if (savedItems.length === 4 && usedItemIds.length + selectedItemIds.length > 3) {
      console.log("Generate disabled: Exceeds 3 items for 4-item case");
      return true;
    }
    if (selectedItemIds.some((id) => usedItemIds.includes(id))) {
      console.log("Generate disabled: Includes already used items");
      return true;
    }
    return false;
  };

  // Generate partial order with selected items
  const handleGeneratePartialOrder = async () => {
    console.log("Generating partial order with item IDs:", selectedItemIds);
    if (savedItems.length === 4 && usedItemIds.length + selectedItemIds.length > 3) {
      toast.error("Cannot select more than 3 items in total for 4 items.");
      console.warn("Exceeds item limit for 4-item case");
      return;
    }

    try {
      const selectedItems = savedItems.filter((item) => selectedItemIds.includes(item.id));
      if (!selectedItems.length) {
        toast.error("No valid items selected.");
        console.error("No valid items found for IDs:", selectedItemIds);
        return;
      }

      const formData = new FormData();
      formData.append("quotation", quotationData.id);
      formData.append("order_type", "partial");
      formData.append("client_po_number", "");
      formData.append(
        "items",
        JSON.stringify(
          selectedItems.map((item) => ({
            item_name: item.item_name || null,
            product_name: item.product_name || null,
            quantity: item.quantity,
            unit: item.unit || null,
            unit_price: item.unit_price || null,
          }))
        )
      );

      console.log("Sending formData to API:", Object.fromEntries(formData));
      const response = await apiClient.post("/purchase-orders/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCreatedPartialOrders((prev) => [...prev, { ...response.data, items: selectedItems }]);
      setUsedItemIds((prev) => [...prev, ...selectedItemIds]);
      setSelectedItemIds([]);
      toast.success(`Partial purchase order ${createdPartialOrders.length + 1} created successfully!`);
      console.log("API Response:", response.data);

      if (savedItems.length === 4 && usedItemIds.length + selectedItemIds.length === 3) {
        toast.success("All required partial orders created!");
        navigate("/pre-job/view-quotation");
      }
    } catch (err) {
      console.error("Failed to create partial purchase order:", err);
      toast.error("Failed to create partial purchase order: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  // Handle Finish button
  const handleFinish = () => {
    if (savedItems.length === 4 && usedItemIds.length !== 3) {
      toast.error("You must select exactly 3 items across partial orders.");
      console.warn("Incomplete selection for 4 items:", usedItemIds);
      return;
    }
    if (numberOfPartialOrders && createdPartialOrders.length < numberOfPartialOrders) {
      toast.error(`Please create ${numberOfPartialOrders} partial orders.`);
      console.warn("Not enough partial orders created:", createdPartialOrders.length, numberOfPartialOrders);
      return;
    }
    navigate("/pre-job/view-quotation");
  };

  // Filter remaining items
  const remainingItems = savedItems.filter((item) => !usedItemIds.includes(item.id));

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-black">Partial Order Selection</h2>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Number of Partial Orders</label>
          <input
            type="number"
            value={numberOfPartialOrders}
            onChange={handleNumberOfPartialOrdersChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            min="1"
            placeholder="Enter number of partial orders"
          />
        </div>

        {savedItems.length === 4 && (
          <p className="text-sm text-gray-600 mb-4">
            Note: You must select exactly 3 items across partial orders.
          </p>
        )}

        {createdPartialOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2 text-black">Created Partial Orders</h3>
            {createdPartialOrders.map((order, index) => (
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

        {remainingItems.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2 text-black">
              Select Items for Partial Order {createdPartialOrders.length + 1}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Selected items: {usedItemIds.length}/{savedItems.length === 4 ? 3 : savedItems.length - 1}
            </p>
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                      Select
                    </th>
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
                  {remainingItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => handleItemSelection(item.id)}
                          disabled={usedItemIds.includes(item.id)}
                        />
                      </td>
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
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleGeneratePartialOrder}
            className={`px-3 py-2 rounded transition-colors duration-200 flex items-center ${
              isGenerateDisabled()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
            disabled={isGenerateDisabled()}
          >
            Generate Partial
          </button>
          <button
            onClick={handleFinish}
            className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300"
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartialOrderSelection;