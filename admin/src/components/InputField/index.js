import React from 'react';

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
      className="w-full p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 opacity-80"
    />
  );
};

export default InputField;