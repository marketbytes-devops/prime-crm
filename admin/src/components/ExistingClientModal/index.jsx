import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../helpers/apiClient';
import { toast } from 'react-toastify';

const ExistingClientModal = ({ onClose }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/add-rfqs/');
        setClients(Array.isArray(response.data) ? response.data : response.data.results || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        setError('Failed to load clients.');
        toast.error('Failed to load clients.');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleClientSelect = (client) => {
    navigate('/pre-job/existing-client', { state: { rfqData: client, rfqId: client.id } });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-200 transform transition-all duration-300 hover:shadow-3xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-indigo-600">Select Existing Client</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              ×
            </button>
          </div>
          {loading && <p>Loading clients...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && clients.length === 0 && (
            <p className="text-gray-600">No clients found.</p>
          )}
          {!loading && !error && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full text-left p-3 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {client.company_name} (ID: {client.id})
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExistingClientModal;