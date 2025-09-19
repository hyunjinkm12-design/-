import React, { useState } from 'react';
import { Project, User } from '../types';
import { Header } from './Header';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { XCircleIcon } from './icons/XCircleIcon';
import { SearchIcon } from './icons/SearchIcon';

interface ProjectListViewProps {
    projects: Project[];
    user: User;
    onAddProject: (name: string, description: string, period: string, type: string, goal: string) => void;
    onDeleteProject: (projectId: string) => void;
    onSelectProject: (projectId: string) => void;
    onLogout: () => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({ projects, user, onAddProject, onDeleteProject, onSelectProject, onLogout }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [newProjectPeriod, setNewProjectPeriod] = useState('');
    const [newProjectType, setNewProjectType] = useState('');
    const [newProjectGoal, setNewProjectGoal] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    
    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        return (
            project.name.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query) ||
            project.type.toLowerCase().includes(query) ||
            project.goal.toLowerCase().includes(query)
        );
    });

    const handleAddProject = () => {
        if (
            newProjectName.trim() &&
            newProjectDescription.trim() &&
            newProjectPeriod.trim() &&
            newProjectType.trim() &&
            newProjectGoal.trim()
        ) {
            onAddProject(
                newProjectName.trim(),
                newProjectDescription.trim(),
                newProjectPeriod.trim(),
                newProjectType.trim(),
                newProjectGoal.trim()
            );
            closeAddModal();
        }
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectPeriod('');
        setNewProjectType('');
        setNewProjectGoal('');
    };
    
    const openDeleteModal = (project: Project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            setProjectToDelete(null);
        }
    };

    const isSaveDisabled = !newProjectName.trim() || !newProjectDescription.trim() || !newProjectPeriod.trim() || !newProjectType.trim() || !newProjectGoal.trim();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSaveDisabled) {
             handleAddProject();
        }
    };

    return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Header user={user} onLogout={onLogout} />
            <main className="mt-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                     <div className="relative flex-grow sm:flex-grow-0">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Add New Project</span>
                    </button>
                </div>

                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => (
                            <div key={project.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                                    <p className="mt-2 text-sm text-gray-600 flex-grow min-h-[40px]">{project.description}</p>
                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                        <dl className="space-y-2 text-sm text-gray-500">
                                            <div className="flex justify-between">
                                                <dt className="font-medium text-gray-600">Period:</dt>
                                                <dd className="text-right font-semibold">{project.period}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="font-medium text-gray-600">Type:</dt>
                                                <dd className="text-right">
                                                    <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">{project.type}</span>
                                                </dd>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <dt className="font-medium text-gray-600 shrink-0 mr-2">Goal:</dt>
                                                <dd className="text-right truncate" title={project.goal}>{project.goal}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end items-center gap-2">
                                    <button
                                        onClick={() => openDeleteModal(project)}
                                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                        aria-label="Delete project"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onSelectProject(project.id)}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-md shadow-sm hover:bg-indigo-400"
                                    >
                                        View Project
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                         <h3 className="text-lg font-semibold text-gray-700">No Projects Found</h3>
                         <p className="mt-1">
                            {searchQuery 
                                ? `Your search for "${searchQuery}" did not match any projects.`
                                : "There are no projects yet. Click 'Add New Project' to get started!"
                            }
                         </p>
                    </div>
                )}
            </main>
        </div>
        
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={closeAddModal}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Add New Project</h2>
                        <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600">
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input
                                type="text"
                                id="project-name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="project-description" className="block text-sm font-medium text-gray-700">Project Description</label>
                            <textarea
                                id="project-description"
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="project-period" className="block text-sm font-medium text-gray-700">Project Period</label>
                                <input
                                    type="text"
                                    id="project-period"
                                    placeholder="e.g., Q4 2024"
                                    value={newProjectPeriod}
                                    onChange={(e) => setNewProjectPeriod(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="project-type" className="block text-sm font-medium text-gray-700">Project Type</label>
                                <input
                                    type="text"
                                    id="project-type"
                                    placeholder="e.g., Client Work"
                                    value={newProjectType}
                                    onChange={(e) => setNewProjectType(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="project-goal" className="block text-sm font-medium text-gray-700">Project Goal</label>
                            <input
                                type="text"
                                id="project-goal"
                                placeholder="e.g., Launch V1 of the new platform"
                                value={newProjectGoal}
                                onChange={(e) => setNewProjectGoal(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3">
                        <button type="button" onClick={closeAddModal} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAddProject}
                            disabled={isSaveDisabled}
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        >
                            Save Project
                        </button>
                    </div>
                </div>
            </div>
        )}

        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setProjectToDelete(null)}
            onConfirm={confirmDelete}
            title="Delete Project"
            message={<>Are you sure you want to delete the project <strong>"{projectToDelete?.name}"</strong>? This action cannot be undone.</>}
        />
    </div>
    );
};