import { motion, AnimatePresence } from 'framer-motion';

const ClientSelectionModal = ({ onClose, onSelect }) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-transparent flex items-center justify-center z-50 backdrop-brightness-50"
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-600">Select Client Type</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-indigo-600 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => onSelect('new')}
              className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              New Client
            </button>
            <button
              onClick={() => onSelect('existing')}
              className="bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              Existing Client
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientSelectionModal;