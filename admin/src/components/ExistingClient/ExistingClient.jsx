// src/components/ExistingClient/ExistingClient.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../helpers/apiClient';
import { toast } from 'react-toastify';

const ExistingClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rfqData = {}, rfqId } = location.state || {}; // Extract rfqId
  const [formData, setFormData] = useState({
    company_name: rfqData.company_name || '',
    reference: rfqData.reference || '',
    address: rfqData.address || '',
    phone: rfqData.phone || '',
    email: rfqData.email || '',
    rfq_channel: rfqData.rfq_channel || '',
    attention_name: '',
    attention_phone: '',
    attention_email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      company_name: rfqData.company_name || '',
      reference: rfqData.reference || '',
      address: rfqData.address || '',
      phone: rfqData.phone || '',
      email: rfqData.email || '',
      rfq_channel: rfqData.rfq_channel || '',
      attention_name: '',
      attention_phone: '',
      attention_email: '',
    }));
  }, [rfqData]);

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
      if (rfqId) {
        // Update existing RFQ
        await apiClient.put(`/add-rfqs/${rfqId}/`, formData);
        toast.success('RFQ updated!');
      } else {
        // Fallback to create new RFQ if no id (should not happen)
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
        <div className="grid grid-cols-1 gap-4">
          {[
            { name: 'company_name', label: 'Company Name', type: 'text', required: true },
            { name: 'reference', label: 'Reference', type: 'text', required: false },
            { name: 'address', label: 'Address', type: 'text', required: true },
            { name: 'phone', label: 'Phone', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'rfq_channel', label: 'RFQ Channel', type: 'text', required: false },
          ].map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded"
                placeholder={`Enter ${field.label}`}
                required={field.required}
              />
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
                className="mt-1 p-2 border rounded"
                placeholder={`Enter ${field.label}`}
                required={field.required}
              />
            </div>
          ))}
        </div>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : 'Save RFQ'}
        </button>
      </div>
    </div>
  );
};

export default ExistingClient;