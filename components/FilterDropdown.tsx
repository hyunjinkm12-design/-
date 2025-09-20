import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedValues: string[]) => void;
  options: string[];
  appliedValues: string[];
  targetElement: HTMLElement | null;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ isOpen, onClose, onApply, options, appliedValues, targetElement }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState(new Set(appliedValues));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setSelectedValues(new Set(appliedValues));
  }, [appliedValues, isOpen]);

  useEffect(() => {
      if(isOpen && targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX,
        });
      }
  }, [isOpen, targetElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedValues(prev => new Set([...prev, ...filteredOptions]));
    } else {
        const filteredSet = new Set(filteredOptions);
        setSelectedValues(prev => new Set([...prev].filter(item => !filteredSet.has(item))));
    }
  };
  
  const handleValueChange = (value: string) => {
    setSelectedValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  const handleApply = () => {
    onApply(Array.from(selectedValues));
    onClose();
  };

  const handleClear = () => {
    setSelectedValues(new Set());
  };

  if (!isOpen) return null;

  const isAllFilteredVisibleSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedValues.has(opt));

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-2xl z-50 w-64 flex flex-col"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <SearchIcon className="w-4 h-4 text-gray-400" />
            </span>
            <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1 border border-gray-300 rounded-md text-sm"
            />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto max-h-60 p-2">
         <label className="flex items-center space-x-2 px-2 py-1 text-sm hover:bg-gray-100 rounded">
            <input
                type="checkbox"
                checked={isAllFilteredVisibleSelected}
                onChange={handleToggleSelectAll}
                className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <span>(모두 선택)</span>
        </label>
        {filteredOptions.map(option => (
          <label key={option} className="flex items-center space-x-2 px-2 py-1 text-sm hover:bg-gray-100 rounded">
            <input
              type="checkbox"
              checked={selectedValues.has(option)}
              onChange={() => handleValueChange(option)}
              className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <div className="p-2 border-t border-gray-200 flex justify-end gap-2">
        <button 
            onClick={onClose} 
            className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
            취소
        </button>
        <button
            onClick={handleApply}
            className="px-3 py-1 text-sm text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700"
        >
            확인
        </button>
      </div>
    </div>
  );
};
