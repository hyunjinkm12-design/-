import React, { useState, useEffect } from 'react';
import { Task, Status } from '../types';
import { XCircleIcon } from './icons/XCircleIcon';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
  const [editedTask, setEditedTask] = useState<Task>(task);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setEditedTask(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
  };

  const handleSave = () => {
    onSave(editedTask);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">Task Details: {task.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Task Name</label>
            <input type="text" name="name" id="name" value={editedTask.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          
          <div>
            <label htmlFor="deliverableName" className="block text-sm font-medium text-gray-700">Deliverable Name</label>
            <input type="text" name="deliverableName" id="deliverableName" value={editedTask.deliverableName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">Assignee</label>
              <input type="text" name="assignee" id="assignee" value={editedTask.assignee} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="status" name="status" value={editedTask.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" name="startDate" id="startDate" value={editedTask.startDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" name="endDate" id="endDate" value={editedTask.endDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
           <div>
              <label htmlFor="plannedProgress" className="block text-sm font-medium text-gray-700">Planned Progress (%)</label>
              <input type="number" name="plannedProgress" id="plannedProgress" value={editedTask.plannedProgress} onChange={handleChange} min="0" max="100" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Issues / Special Notes</label>
            <textarea id="notes" name="notes" rows={3} value={editedTask.notes} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 sm:px-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
