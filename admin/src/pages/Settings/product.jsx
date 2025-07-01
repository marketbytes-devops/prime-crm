import { useState, useEffect } from "react";
import apiClient from "../../helpers/apiClient";

const Product = () => {
  const [productName, setProductName] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    if (!productName.trim()) return;
    try {
      const response = await apiClient.post("/products/", { name: productName });
      setProducts([...products, response.data]);
      setProductName("");
      setError(null);
    } catch (err) {
      setError("Failed to add product.");
    }
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
      <h2 className="text-2xl font-bold mb-4">Product Management</h2>
      <form onSubmit={handleAddProduct} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
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
          placeholder="Search by product name"
          className="w-full p-2 border rounded"
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <ul className="list-disc pl-5">
          {products.map((product) => (
            <li key={product.id} className="py-1 flex justify-between items-center">
              {product.name}
              <button
                onClick={() => handleDeleteProduct(product.id)}
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

export default Product;