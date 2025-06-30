import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ExistingClientModal = ({ onClose }) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const navigate = useNavigate();

  // Placeholder client data; replace with API call or actual data source
  const clients = [
    { id: 1, company_name: 'Acme Corp', email: 'contact@acme.com', phone: '123-456-7890', address: '123 Acme St', attention_name: 'John Doe', attention_email: 'john@acme.com', attention_phone: '987-654-3210' },
    { id: 2, company_name: 'Beta Inc', email: 'info@beta.com', phone: '456-789-0123', address: '456 Beta Rd', attention_name: 'Jane Smith', attention_email: 'jane@beta.com', attention_phone: '654-321-0987' },
  ];

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    // Navigate to AddRFQ with the selected client's data
    navigate('/pre-job/add-rfq', { state: { rfqData: client, isEditing: true } });
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-white rounded-lg p-6 w-full max-w-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Select Existing Client</h2>
            <button onClick={handleClose} className="text-gray-600 hover:text-gray-800">
              ×
            </button>
          </div>
          <div className="space-y-2">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleClientSelect(client)}
                className="w-full text-left p-3 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {client.company_name}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExistingClientModal;