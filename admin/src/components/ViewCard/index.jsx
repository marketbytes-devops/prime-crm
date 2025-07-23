const ViewCard = ({ singleFields, repeatableFields, title, showRepeatableFields, initialData }) => {

  const renderFieldValue = (field, data) => {
    if (field.name.includes('.')) {
      const [parent, child] = field.name.split('.');
      return data[parent]?.[child] || '';
    }
    if (field.type === 'date') {
      return data[field.name] ? new Date(data[field.name]).toLocaleDateString() : '';
    }
    return data[field.name] || '';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-md font-semibold mb-2 text-black">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {singleFields.map((field) => (
          <div key={field.name} className="flex flex-col">
            <span className="text-xs font-medium text-gray-600">{field.label}</span>
            {field.editable ? (
              <input
                type={field.type}
                value={initialData[field.name] || ''}
                onChange={(e) => {
                  console.log(`Update ${field.name} to ${e.target.value}`);
                }}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <span className="text-sm text-black">{renderFieldValue(field, initialData)}</span>
            )}
          </div>
        ))}
      </div>
      {showRepeatableFields && repeatableFields.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-2 text-black">Items</h4>
          <table className="min-w-full bg-gray-100 rounded-lg">
            <thead>
              <tr>
                {repeatableFields.map((field) => (
                  <th key={field.name} className="px-4 py-2 text-xs font-medium text-gray-600 text-left">
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialData.items.map((item, index) => (
                <tr key={index} className="border-t">
                  {repeatableFields.map((field) => (
                    <td key={field.name} className="px-4 py-2 text-sm text-gray-800">
                      {field.name === 'unit_price' || field.name === 'total_price'
                        ? `$${Number(item[field.name] || 0).toFixed(2)}`
                        : item[field.name] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewCard;