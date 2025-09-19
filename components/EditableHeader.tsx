import React, { useState, useEffect, useRef } from 'react';

interface EditableHeaderProps {
  value: string;
  onSave: (value: string) => void;
}

export const EditableHeader: React.FC<EditableHeaderProps> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedValue = currentValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue);
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

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="bg-white text-gray-800 p-1 border border-indigo-400 rounded focus:ring-1 focus:ring-indigo-500 font-medium text-xs uppercase"
        // Auto-adjust width based on content length, with a minimum size.
        size={Math.max(currentValue.length, 10)}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className="cursor-pointer hover:bg-gray-700 p-1 -m-1 rounded w-full"
    >
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
};