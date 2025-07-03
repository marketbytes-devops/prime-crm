import { useState, useEffect } from "react";
import apiClient from "../../helpers/apiClient";
import { toast } from "react-toastify";

const NumberSeries = () => {
  const [seriesName, setSeriesName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/series/?search=${searchQuery}`);
        setSeriesList(response.data);
      } catch (err) {
        setError("Failed to load series.");
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [searchQuery]);

  const handleAddSeries = async (e) => {
    e.preventDefault();
    if (!seriesName.trim() || !prefix.trim()) {
      setError("Series Name and Prefix are required.");
      return;
    }
    try {
      const response = await apiClient.post("/series/", { series_name: seriesName, prefix });
      setSeriesList([...seriesList, response.data]);
      setSeriesName("");
      setPrefix("");
      setError(null);
      toast.success("Series added successfully!");
    } catch (err) {
      setError("Failed to add series.");
      toast.error("Failed to add series.");
    }
  };

  const handleDeleteSeries = async (id) => {
    if (!window.confirm("Are you sure you want to delete this series?")) return;
    try {
      await apiClient.delete(`/series/${id}/`);
      setSeriesList(seriesList.filter((series) => series.id !== id));
      setError(null);
      toast.success("Series deleted successfully!");
    } catch (err) {
      setError("Failed to delete series.");
      toast.error("Failed to delete series.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Series Management</h2>
      <form onSubmit={handleAddSeries} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            placeholder="Enter series name"
            className="w-full p-2 border rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="Enter prefix (e.g., QU-PI-SIGC)"
            className="w-full p-2 border rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            required
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
          placeholder="Search by series name or prefix"
          className="w-full p-2 border rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
        />
      </div>
      {loading ? (
        <p className="text-black text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : (
        <ul className="list-disc pl-5">
          {seriesList.map((series) => (
            <li key={series.id} className="py-1 flex justify-between items-center text-black">
              {series.series_name} ({series.prefix}-{String(series.current_sequence).padStart(7, '0')})
              <button
                onClick={() => handleDeleteSeries(series.id)}
                className="ml-4 py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
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

export default NumberSeries;