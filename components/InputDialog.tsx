import React, { useState, useEffect } from 'react';
import { XCircleIcon } from './icons/XCircleIcon';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  label: string;
}

export const InputDialog: React.FC<InputDialogProps> = ({ isOpen, onClose, onSave, title, label }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <label htmlFor="dialog-input" className="block text-sm font-medium text-gray-700">{label}</label>
          <input
            type="text"
            id="dialog-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            autoFocus
          />
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};