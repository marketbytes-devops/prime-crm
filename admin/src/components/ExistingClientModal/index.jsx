import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ExistingClientModal = ({ onClose }) => {
  const navigate = useNavigate();

  const handleProceed = () => {
    navigate('/pre-job/existing-client');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-transparent backdrop-brightness-50 flex items-center justify-center z-50"
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
          <h2 className="text-xl font-semibold text-indigo-600 mb-4">Proceed to Select Client</h2>
          <p className="mb-4">Click below to select an existing client.</p>
          <button
            onClick={handleProceed}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            Proceed
          </button>
          <button
            onClick={onClose}
            className="ml-4 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExistingClientModal;