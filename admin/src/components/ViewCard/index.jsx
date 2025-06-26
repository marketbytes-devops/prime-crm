import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import apiClient from "../../helpers/apiClient";
import { FilePenLine, Trash } from "lucide-react";
import { toast } from "react-toastify";

const ViewCard = ({ apiBaseUrl, singleFields, repeatableFields, title, editPath, showRepeatableFields = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiBaseUrl);
      console.log("API Response:", response.data);
      let data = response.data;

      if (Array.isArray(data)) {
        setRfqs(data);
      } else if (data && typeof data === "object") {
        setRfqs(data.results || [data]);
      } else {
        setRfqs([]);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching RFQs:", err);
      setError("Failed to load RFQs. Please try again.");
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [apiBaseUrl, location.pathname]);

  const handleDelete = async (rfqId) => {
    if (!window.confirm("Are you sure you want to delete this RFQ?")) return;
    try {
      await apiClient.delete(`${apiBaseUrl}${rfqId}/`);
      toast.success("RFQ deleted successfully");
      fetchRfqs();
    } catch (error) {
      console.error("Error deleting RFQ:", error);
      toast.error("Failed to delete RFQ");
    }
  };

  const handleEdit = (rfq) => {
    navigate(editPath, { state: { rfqData: rfq, isEditing: true } });
  };

  const renderFieldValue = (field, value) => {
    if (field.type === "date") {
      return value ? new Date(value).toLocaleDateString() : "N/A";
    }
    return value || "N/A";
  };

  return (
    <div className="mx-auto p-4">
      <h2 className="text-lg font-medium mb-6 text-gray-800">{title}</h2>
      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && rfqs.length === 0 && (
        <p className="text-gray-600">No RFQs found.</p>
      )}
      {!loading && !error && rfqs.length > 0 && (
        <div className="space-y-6">
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="p-6 bg-white shadow-md rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold text-gray-800">
                  RFQ #{rfq.quote_no || rfq.id || "N/A"}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(rfq)}
                    className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 flex items-center"
                  >
                    <FilePenLine size={16} className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rfq.id)}
                    className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 flex items-center"
                  >
                    <Trash size={16} className="mr-1" /> Delete
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {singleFields.map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <span className="text-xs font-medium text-gray-600">
                      {field.label}
                    </span>
                    <span className="text-sm text-gray-800">
                      {renderFieldValue(field, rfq[field.name])}
                    </span>
                  </div>
                ))}
              </div>
              {showRepeatableFields && rfq.items && rfq.items.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Items</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-100 rounded-lg">
                      <thead>
                        <tr>
                          {repeatableFields.map((field) => (
                            <th
                              key={field.name}
                              className="px-4 py-2 text-xs font-medium text-gray-600 text-left"
                            >
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rfq.items.map((item, index) => (
                          <tr key={item.id || index} className="border-t">
                            {repeatableFields.map((field) => (
                              <td
                                key={field.name}
                                className="px-4 py-2 text-sm text-gray-800"
                              >
                                {renderFieldValue(field, item[field.name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : showRepeatableFields ? (
                <p className="text-sm text-gray-600">No items found for this RFQ.</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ViewCard.propTypes = {
  apiBaseUrl: PropTypes.string.isRequired,
  singleFields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      options: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  repeatableFields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      options: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  editPath: PropTypes.string.isRequired,
  showRepeatableFields: PropTypes.bool,
};

export default ViewCard;