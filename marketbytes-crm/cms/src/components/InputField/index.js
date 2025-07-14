import PropTypes from 'prop-types';

const InputField = ({ type, placeholder, value, onChange, maxLength, pattern, title }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      pattern={pattern}
      title={title}
      className="w-full text-sm p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black text-black/80 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
    />
  );
};

InputField.propTypes = {
  type: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number,
  pattern: PropTypes.string,
  title: PropTypes.string,
};

InputField.defaultProps = {
  placeholder: '',
  maxLength: null,
  pattern: null,
  title: '',
};

export default InputField;