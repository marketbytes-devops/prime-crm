import { useState, useEffect } from "react";
import apiClient from "../../helpers/apiClient";

const Item = () => {
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/items/?search=${searchQuery}`);
        setItems(response.data);
      } catch (err) {
        setError("Failed to load items.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [searchQuery]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }
    try {
      const response = await apiClient.post("/items/", {
        name: itemName,
        price: parseFloat(itemPrice) || null,
      });
      setItems([...items, response.data]);
      setItemName("");
      setItemPrice("");
      setError(null);
    } catch (err) {
      setError("Failed to add item.");
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item.id);
    setEditName(item.name || "");
    setEditPrice(item.price ? item.price.toString() : "");
  };

  const handleUpdateItem = async (e, id) => {
    e.preventDefault();
    if (!editName.trim()) {
      setError("Item name is required.");
      return;
    }
    try {
      const response = await apiClient.put(`/items/${id}/`, {
        name: editName,
        price: editPrice ? parseFloat(editPrice) : null,
      });
      setItems(items.map((item) => (item.id === id ? response.data : item)));
      setEditingItem(null);
      setEditName("");
      setEditPrice("");
      setError(null);
    } catch (err) {
      setError("Failed to update item.");
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditName("");
    setEditPrice("");
    setError(null);
  };

  const handleDeleteItem = async (id) => {
    try {
      await apiClient.delete(`/items/${id}/`);
      setItems(items.filter((item) => item.id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete item.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Item Management</h2>
      <form onSubmit={handleAddItem} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Enter item name"
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
          <input
            type="number"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            placeholder="Enter item price"
            className="w-1/4 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            min="0"
            step="0.01"
          />
          <button
            type="submit"
            className="py-2 px-4 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors duration-200"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by item name"
          className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {loading ? (
        <p className="text-black">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <ul className="list-none">
          {items.map((item) => (
            <li
              key={item.id}
              className="py-2 flex justify-between items-center bg-white rounded-lg shadow-sm mb-2 p-4"
            >
              {editingItem === item.id ? (
                <form
                  onSubmit={(e) => handleUpdateItem(e, item.id)}
                  className="flex w-full space-x-2"
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter item name"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Enter item price"
                    className="w-1/4 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors duration-200"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2 px-4 bg-gray-200 text-black rounded hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className="text-black">
                    {item.name}{" "}
                    {item.price != null ? `($${Number(item.price).toFixed(2)})` : "(No price)"}
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="py-1 px-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Item;