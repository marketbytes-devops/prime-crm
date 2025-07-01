import { useState, useEffect } from "react";
import apiClient from "../../helpers/apiClient";

const Unit = () => {
  const [unitName, setUnitName] = useState("");
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/units/?search=${searchQuery}`);
        setUnits(response.data);
      } catch (err) {
        setError("Failed to load units.");
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, [searchQuery]);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) return;
    try {
      const response = await apiClient.post("/units/", { name: unitName });
      setUnits([...units, response.data]);
      setUnitName("");
      setError(null);
    } catch (err) {
      setError("Failed to add unit.");
    }
  };

  const handleDeleteUnit = async (id) => {
    try {
      await apiClient.delete(`/units/${id}/`);
      setUnits(units.filter((unit) => unit.id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete unit.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Unit of Measurement Management</h2>
      <form onSubmit={handleAddUnit} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder="Enter unit of measurement"
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
          placeholder="Search by unit name"
          className="w-full p-2 border rounded"
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <select className="w-full p-2 border rounded mb-4" size={units.length || 1}>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <ul className="list-disc pl-5">
          {units.map((unit) => (
            <li key={unit.id} className="py-1 flex justify-between items-center">
              {unit.name}
              <button
                onClick={() => handleDeleteUnit(unit.id)}
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

export default Unit;