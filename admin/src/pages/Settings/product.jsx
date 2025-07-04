import { useState, useEffect } from "react";
import apiClient from "../../helpers/apiClient";

const Product = () => {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/products/?search=${searchQuery}`);
        setProducts(response.data);
      } catch (err) {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchQuery]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError("Product name is required.");
      return;
    }
    try {
      const response = await apiClient.post("/products/", {
        name: productName,
        price: parseFloat(productPrice) || null,
      });
      setProducts([...products, response.data]);
      setProductName("");
      setProductPrice("");
      setError(null);
    } catch (err) {
      setError("Failed to add product.");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product.id);
    setEditName(product.name || "");
    setEditPrice(product.price ? product.price.toString() : "");
  };

  const handleUpdateProduct = async (e, id) => {
    e.preventDefault();
    if (!editName.trim()) {
      setError("Product name is required.");
      return;
    }
    try {
      const response = await apiClient.put(`/products/${id}/`, {
        name: editName,
        price: editPrice ? parseFloat(editPrice) : null,
      });
      setProducts(products.map((product) => (product.id === id ? response.data : product)));
      setEditingProduct(null);
      setEditName("");
      setEditPrice("");
      setError(null);
    } catch (err) {
      setError("Failed to update product.");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditName("");
    setEditPrice("");
    setError(null);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await apiClient.delete(`/products/${id}/`);
      setProducts(products.filter((product) => product.id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete product.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Product Management</h2>
      <form onSubmit={handleAddProduct} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
          <input
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="Enter product price"
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
          placeholder="Search by product name"
          className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {loading ? (
        <p className="text-black">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <ul className="list-none">
          {products.map((product) => (
            <li
              key={product.id}
              className="py-2 flex justify-between items-center bg-white rounded-lg shadow-sm mb-2 p-4"
            >
              {editingProduct === product.id ? (
                <form
                  onSubmit={(e) => handleUpdateProduct(e, product.id)}
                  className="flex w-full space-x-2"
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter product name"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Enter product price"
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
                    {product.name}{" "}
                    {product.price != null ? `($${Number(product.price).toFixed(2)})` : "(No price)"}
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="py-1 px-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
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

export default Product;