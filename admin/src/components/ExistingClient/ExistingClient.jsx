import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../helpers/apiClient';
import { toast } from 'react-toastify';

const ExistingClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rfqData = {}, rfqId } = location.state || {};
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [rfqChannels, setRfqChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(rfqId ? rfqData : null);
  const [formData, setFormData] = useState({
    company_name: rfqData.company_name || '',
    reference: rfqData.reference || '',
    address: rfqData.address || '',
    phone: rfqData.phone || '',
    email: rfqData.email || '',
    rfq_channel: rfqData.rfq_channel || '',
    attention_name: rfqData.attention_name || '',
    attention_phone: rfqData.attention_phone || '',
    attention_email: rfqData.attention_email || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const [clientsResponse, channelsResponse] = await Promise.all([
          apiClient.get('/add-rfqs/'),
          apiClient.get('/rfq-channels/'),
        ]);
        const clientData = Array.isArray(clientsResponse.data) ? clientsResponse.data : clientsResponse.data.results || [];
        setClients(clientData);
        setFilteredClients(clientData.sort((a, b) => a.company_name.localeCompare(b.company_name)));
        setRfqChannels(channelsResponse.data.map((channel) => channel.channel_name));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load clients or RFQ channels.');
        toast.error('Failed to load clients or RFQ channels.');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients
      .filter(client => 
        client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.company_name.localeCompare(b.company_name));
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  useEffect(() => {
    if (selectedClient) {
      setFormData({
        company_name: selectedClient.company_name || '',
        reference: selectedClient.reference || '',
        address: selectedClient.address || '',
        phone: selectedClient.phone || '',
        email: selectedClient.email || '',
        rfq_channel: selectedClient.rfq_channel || '',
        attention_name: selectedClient.attention_name || '',
        attention_phone: selectedClient.attention_phone || '',
        attention_email: selectedClient.attention_email || '',
      });
    }
  }, [selectedClient]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSearchQuery(''); 
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const requiredFields = ['company_name', 'address', 'phone', 'email'];
    const missingField = requiredFields.find((field) => !formData[field]);
    if (missingField) {
      toast.error(`${missingField.replace('_', ' ').charAt(0).toUpperCase() + missingField.replace('_', ' ').slice(1)} is required.`);
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedClient && selectedClient.id) {
        await apiClient.put(`/add-rfqs/${selectedClient.id}/`, formData);
        toast.success('RFQ updated!');
      } else {
        await apiClient.post('/add-rfqs/', formData);
        toast.success('RFQ saved!');
      }
      navigate('/pre-job/view-rfq');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save RFQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Client Details</h2>
        <div className="mb-4 relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Client
          </label>
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
          />
          {searchQuery && filteredClients.length > 0 && (
            <ul className="absolute z-10 w-full max-w-md bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
              {filteredClients.map((client) => (
                <li
                  key={client.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleClientSelect(client)}
                >
                  {client.company_name} (ID: {client.id})
                </li>
              ))}
            </ul>
          )}
          {searchQuery && filteredClients.length === 0 && (
            <p className="text-gray-600 mt-2">No clients found.</p>
          )}
        </div>
        {loading && <p>Loading clients...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {selectedClient && (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              {[
                { name: 'company_name', label: 'Company Name', type: 'text', required: true },
                { name: 'reference', label: 'Reference', type: 'text', required: false },
                { name: 'address', label: 'Address', type: 'text', required: true },
                { name: 'phone', label: 'Phone', type: 'text', required: true },
                { name: 'email', label: 'Email', type: 'email', required: true },
                {
                  name: 'rfq_channel',
                  label: 'RFQ Channel',
                  type: 'select',
                  required: false,
                  options: rfqChannels,
                  placeholder: 'Select RFQ Channel',
                },
              ].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
                      required={field.required}
                    >
                      <option value="" disabled>
                        {field.placeholder}
                      </option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
                      placeholder={`Enter ${field.label}`}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              <h3 className="text-lg font-medium mt-4">Attention Details</h3>
              {[
                { name: 'attention_name', label: 'Attention Name', type: 'text', required: false },
                { name: 'attention_phone', label: 'Attention Phone', type: 'text', required: false },
                { name: 'attention_email', label: 'Attention Email', type: 'email', required: false },
              ].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    className="mt-1 p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
                    placeholder={`Enter ${field.label}`}
                    required={field.required}
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Saving...' : 'Save RFQ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ExistingClient;