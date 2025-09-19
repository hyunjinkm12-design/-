import React from 'react';
import { PlusIcon } from './icons/PlusIcon';

interface HeaderProps {
  projectName?: string;
  onGoBack?: () => void;
  onAddTask?: () => void;
  onAddDepartment?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ projectName, onGoBack, onAddTask, onAddDepartment }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex items-center justify-between pb-4 border-b border-gray-200">
      <div>
        {projectName ? (
           <div className="flex items-center gap-4">
            <button
                onClick={onGoBack}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
            >
                &larr; Back to Projects
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{projectName}</h1>
           </div>
        ) : (
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Today is <span className="font-semibold">{currentDate}</span>.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onAddDepartment && (
            <button
                onClick={onAddDepartment}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors"
            >
                <PlusIcon className="w-5 h-5" />
                <span>Add Department</span>
            </button>
        )}
        {onAddTask && (
            <button
            onClick={onAddTask}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
            <PlusIcon className="w-5 h-5" />
            <span>Add Task</span>
            </button>
        )}
      </div>
    </header>
  );
};