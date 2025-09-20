import React from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { User } from '../types';
import { UserIcon } from './icons/UserIcon';
import { LogoutIcon } from './icons/LogoutIcon';

interface HeaderProps {
  projectName?: string;
  user?: User | null;
  onGoBack?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ projectName, user, onGoBack, onLogout }) => {
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
      <div className="flex items-center gap-4">
        {user && onLogout && (
          <div className="flex items-center gap-3">
            <UserIcon className="w-6 h-6 text-gray-500" />
            <div className="text-sm text-right">
              <div className="font-medium text-gray-700">{user.displayName}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300 transition-colors"
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};