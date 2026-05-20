import React from 'react';
import Select from 'react-select';
import { useTheme } from '../ThemeContext';

const SearchableSelect = ({ name, value, options, onChange, placeholder, required = false }) => {
  const { theme } = useTheme();

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: 'var(--input-bg)',
      borderColor: state.isFocused ? 'var(--accent-primary)' : 'var(--glass-border)',
      color: 'var(--text-main)',
      padding: '2px 5px',
      borderRadius: '8px',
      boxShadow: state.isFocused ? '0 0 0 1px var(--accent-primary)' : 'none',
      '&:hover': {
        borderColor: 'var(--accent-primary)'
      },
      cursor: 'pointer'
    }),
    menu: (provided) => ({
      ...provided,
      background: 'var(--bg-primary)',
      border: '1px solid var(--glass-border)',
      borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }),
    menuPortal: base => ({
      ...base,
      zIndex: 999999
    }),
    option: (provided, state) => ({
      ...provided,
      background: state.isSelected 
        ? 'var(--accent-primary)' 
        : state.isFocused 
          ? 'var(--glass-bg)' 
          : 'transparent',
      color: state.isSelected 
        ? '#ffffff' 
        : 'var(--text-main)',
      cursor: 'pointer',
      '&:active': {
        background: 'var(--accent-primary)',
        color: '#ffffff'
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-main)'
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-main)'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-muted)'
    })
  };

  const selectedOption = options.find(opt => opt.value === value) || null;

  const handleChange = (option) => {
    // Mimic the standard event for the existing handleChange handler
    const mockEvent = {
      target: {
        name: name,
        value: option ? option.value : '',
        type: 'select-one',
        checked: false
      }
    };
    onChange(mockEvent);
  };

  return (
    <Select
      name={name}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      styles={customStyles}
      placeholder={placeholder || "-- Select --"}
      isClearable={!required}
      isSearchable={true}
      required={required}
      menuPosition="fixed"
      menuPortalTarget={document.body}
    />
  );
};

export default SearchableSelect;
