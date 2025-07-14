import { useState, useRef, useEffect } from 'react';

const Dropdown = ({ triggerText, icon: Icon, children, onApply, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleApply = () => {
    if (onApply) onApply();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center space-x-2 min-w-fit whitespace-nowrap"
        onClick={() => setIsOpen(!isOpen)}
      >
        {Icon && <Icon className="w-4 h-4 text-gray-600" />}
        <span className="text-sm font-semibold">{triggerText}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-auto bg-white rounded-lg shadow-lg p-4 z-10">
          {children}
          {onApply && (
            <button
              onClick={handleApply}
              className="w-full py-2 bg-black text-white rounded hover:bg-black/80 transition-colors mt-2"
            >
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;