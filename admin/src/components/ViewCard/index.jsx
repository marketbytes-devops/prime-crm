import React from "react";

const ViewCard = ({ singleFields, repeatableFields, title, showRepeatableFields, initialData }) => {
  const getFieldValue = (field, data) => {
    if (field.value) {
      return field.value(data);
    }
    if (field.name.includes(".")) {
      const keys = field.name.split(".");
      let value = data;
      for (const key of keys) {
        value = value ? value[key] : undefined;
      }
      return value || "";
    }
    return data[field.name] || "";
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {singleFields.map((field) => (
          <div key={field.name} className="mb-2">
            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
            <span className="text-sm text-black">
              {field.type === "date" && getFieldValue(field, initialData)
                ? new Date(getFieldValue(field, initialData)).toLocaleDateString()
                : getFieldValue(field, initialData)}
            </span>
          </div>
        ))}
      </div>
      {showRepeatableFields && repeatableFields.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2 text-black">{title}</h3>
          <div className="overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  {repeatableFields.map((field) => (
                    <th
                      key={field.name}
                      className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap"
                    >
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {initialData.items && initialData.items.length > 0 ? (
                  initialData.items.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      {repeatableFields.map((field) => (
                        <td
                          key={field.name}
                          className="px-4 py-3 text-sm text-black whitespace-nowrap"
                        >
                          {field.name === "item_name"
                            ? item[field.name] || "N/A"
                            : field.name === "unit_price" || field.name === "total_price"
                            ? `$${item[field.name] != null ? Number(item[field.name]).toFixed(2) : "0.00"}`
                            : item[field.name] || "N/A"}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={repeatableFields.length}
                      className="px-4 py-3 text-sm text-black"
                    >
                      No items available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCard;