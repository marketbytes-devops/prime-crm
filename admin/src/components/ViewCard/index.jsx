import PropTypes from "prop-types";

const ViewCard = ({ singleFields, repeatableFields, title, showRepeatableFields = true, initialData }) => {
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const renderFieldValue = (field, value) => {
    if (value === null || value === undefined) return "N/A";
    if (field.type === "date") {
      return value ? new Date(value).toLocaleDateString() : "N/A";
    }
    if (field.name === "total_price" || field.name === "unit_price") {
      return value ? `$${Number(value).toFixed(2)}` : "$0.00";
    }
    return value.toString() || "N/A";
  };

  if (!initialData) {
    return <p className="text-gray-600 text-center">No data available.</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {singleFields.map((field) => (
            <div key={field.name} className="flex flex-col">
              <span className="text-xs font-medium text-gray-600">{field.label}</span>
              <span className="text-sm text-gray-800">
                {renderFieldValue(field, getNestedValue(initialData, field.name))}
              </span>
            </div>
          ))}
        </div>
        {showRepeatableFields && initialData.items && initialData.items.length > 0 ? (
          <div className="p-4">
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
                  {initialData.items.map((item, index) => (
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
          <p className="text-sm text-gray-600 p-4">No items found.</p>
        ) : null}
      </div>
    </div>
  );
};

ViewCard.propTypes = {
  singleFields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      options: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  repeatableFields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      options: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  showRepeatableFields: PropTypes.bool,
  initialData: PropTypes.object,
};

export default ViewCard;