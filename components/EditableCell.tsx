import React, { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'date' | 'select';
  options?: string[];
  displayTransform?: (value: string) => React.ReactNode;
  readOnly?: boolean;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  type = 'text',
  options = [],
  displayTransform,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  const renderInput = () => {
    const commonProps = {
      value: currentValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCurrentValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
    };
    
    if (type === 'select') {
      return (
        <select 
          {...commonProps} 
          ref={inputRef as React.Ref<HTMLSelectElement>}
          className="w-full px-2 py-1 border border-indigo-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }
    
    return <input 
      {...commonProps} 
      type={type} 
      ref={inputRef as React.Ref<HTMLInputElement>}
      // The className is changed to remove w-full, allowing size to work.
      className="px-2 py-1 border border-indigo-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
      // Auto-adjust width based on content length, with a minimum size.
      size={Math.max(String(currentValue).length, 10)}
    />;
  };

  if (isEditing) {
    return renderInput();
  }

  return (
    <div 
      className={`min-h-[2.25rem] flex items-center w-full ${readOnly ? 'text-gray-500' : 'cursor-pointer'}`} 
      onClick={() => !readOnly && setIsEditing(true)}
      title={readOnly ? 'Progress is calculated from sub-tasks and cannot be edited directly.' : ''}
    >
        {displayTransform ? displayTransform(value) : value || <span className="text-gray-400">...</span>}
    </div>
  );
};