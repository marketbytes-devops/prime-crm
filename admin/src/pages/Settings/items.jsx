import { useState, useEffect } from "react";
import apiClient from "../../helpers/apiClient";

const Item = () => {
  const [itemName, setItemName] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    if (!itemName.trim()) return;
    try {
      const response = await apiClient.post("/items/", { name: itemName });
      setItems([...items, response.data]);
      setItemName("");
      setError(null);
    } catch (err) {
      setError("Failed to add item.");
    }
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
      <h2 className="text-2xl font-bold mb-4">Item Management</h2>
      <form onSubmit={handleAddItem} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Enter item name"
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="py-2 px-4 bg-indigo-500 text-white rounded hover:bg-indigo-600"
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
          className="w-full p-2 border rounded"
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <ul className="list-disc pl-5">
          {items.map((item) => (
            <li key={item.id} className="py-1 flex justify-between items-center">
              {item.name}
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="ml-4 py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Item;