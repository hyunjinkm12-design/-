import React, { useState } from 'react';
import { Project, User, Task, Status } from '../types';
import { Header } from './Header';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { XCircleIcon } from './icons/XCircleIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ViewGridIcon } from './icons/ViewGridIcon';
import { ViewListIcon } from './icons/ViewListIcon';
import { DocumentDownloadIcon } from './icons/DocumentDownloadIcon';

// This tells TypeScript that the XLSX object exists on the global scope (from the script tag in index.html)
declare const XLSX: any;

const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
);

interface ProjectListViewProps {
    projects: Project[];
    user: User;
    onAddProject: (name: string, description: string, startDate: string, endDate: string, type: string, goal: string) => void;
    onDeleteProject: (projectId: string) => void;
    onSelectProject: (projectId: string) => void;
    onLogout: () => void;
    onUpdateProject: (project: Project) => void;
}

const initialFormState = {
    id: '',
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: '',
    goal: '',
};

// --- EXCEL EXPORT HELPERS ---
const calculateTaskOverallProgress = (task: Task, departments: { name: string; weight: number }[]): number => {
    const departmentWeights = new Map(departments.map(d => [d.name, d.weight]));
    let totalWeightedProgress = 0;
    let totalWeight = 0;
    for (const [depName, progress] of Object.entries(task.departmentProgress)) {
        const weight = departmentWeights.get(depName) ?? 0;
        if (weight > 0) {
            totalWeightedProgress += progress * weight;
            totalWeight += weight;
        }
    }
    return totalWeight === 0 ? 0 : Math.round(totalWeightedProgress / totalWeight);
};

const calculateProjectOverallProgress = (project: Project): number => {
    const topLevelTasks = project.tasks.filter(t => t.parentId === null);
    if (topLevelTasks.length === 0) return 0;
    
    let totalDuration = 0;
    let weightedProgressSum = 0;

    topLevelTasks.forEach(task => {
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.endDate);
        const duration = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) ? (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1 : 0;
        if(duration > 0) {
            totalDuration += duration;
            weightedProgressSum += calculateTaskOverallProgress(task, project.departments) * duration;
        }
    });

    if (totalDuration === 0) return 0;
    return Math.round(weightedProgressSum / totalDuration);
};

const calculatePlannedProgress = (start: string, end: string): number => {
    const today = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) return 0;

    if (today < startDate) return 0;
    if (today >= endDate) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    if (totalDuration === 0) return 100;

    const elapsedDuration = today.getTime() - startDate.getTime();
    const progress = (elapsedDuration / totalDuration) * 100;

    return Math.round(progress);
};
// --- END OF EXCEL EXPORT HELPERS ---

export const ProjectListView: React.FC<ProjectListViewProps> = ({ projects, user, onAddProject, onDeleteProject, onSelectProject, onLogout, onUpdateProject }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
    const [formData, setFormData] = useState(initialFormState);

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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.name.trim() || !formData.description.trim() || !formData.startDate || !formData.endDate || !formData.type.trim() || !formData.goal.trim()) {
            return;
        }

        if (modalMode === 'add') {
            onAddProject(
                formData.name.trim(),
                formData.description.trim(),
                formData.startDate,
                formData.endDate,
                formData.type.trim(),
                formData.goal.trim()
            );
        } else if (modalMode === 'edit') {
            const originalProject = projects.find(p => p.id === formData.id);
            if (originalProject) {
                const updatedProject: Project = {
                    ...originalProject,
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    type: formData.type.trim(),
                    goal: formData.goal.trim(),
                };
                onUpdateProject(updatedProject);
            }
        }
        closeModal();
    };

    const openAddModal = () => {
        setFormData(initialFormState);
        setModalMode('add');
    };
    
    const openEditModal = (project: Project) => {
        setFormData({
            id: project.id,
            name: project.name,
            description: project.description,
            startDate: project.startDate,
            endDate: project.endDate,
            type: project.type,
            goal: project.goal,
        });
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
    };
    
    const openDeleteModal = (project: Project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };
    
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
    };

    const confirmDelete = () => {
        if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            closeDeleteModal();
        }
    };

    const handleDownloadReport = (project: Project) => {
        const wb = XLSX.utils.book_new();

        // 1. Summary Sheet
        const overallProgress = calculateProjectOverallProgress(project);
        const statusCounts = project.tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<Status, number>);

        const summaryData = [
            ['Project Report'],
            [],
            ['Project Name', project.name],
            ['Description', project.description],
            ['Start Date', project.startDate],
            ['End Date', project.endDate],
            ['Type', project.type],
            ['Goal', project.goal],
            [],
            ['Overall Progress', { v: overallProgress / 100, t: 'n', z: '0%' }],
            ['Total Tasks', project.tasks.length],
            [Status.Completed, statusCounts[Status.Completed] || 0],
            [Status.InProgress, statusCounts[Status.InProgress] || 0],
            [Status.NotStarted, statusCounts[Status.NotStarted] || 0],
            [Status.OnHold, statusCounts[Status.OnHold] || 0],
        ];
        const summary_ws = XLSX.utils.aoa_to_sheet(summaryData);
        summary_ws['!cols'] = [{ wch: 20 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, summary_ws, 'Summary');

        // 2. Task Details Sheet
        const tasksData: any[] = [];
        const buildTaskRows = (parentId: string | null, level: number) => {
            project.tasks
                .filter(t => t.parentId === parentId)
                .forEach(task => {
                    tasksData.push({
                        'ID': task.id,
                        'Task Name': `${'  '.repeat(level)}${task.name}`,
                        'Assignee': task.assignee,
                        'Deliverable': task.deliverableName,
                        'Start Date': task.startDate,
                        'End Date': task.endDate,
                        'Status': task.status,
                        'Planned Progress (%)': calculatePlannedProgress(task.startDate, task.endDate),
                        'Actual Progress (%)': calculateTaskOverallProgress(task, project.departments),
                        'Notes': task.notes,
                    });
                    buildTaskRows(task.id, level + 1);
                });
        };
        buildTaskRows(null, 0);

        const tasks_ws = XLSX.utils.json_to_sheet(tasksData);
        tasks_ws['!cols'] = [{ wch: 10 },{ wch: 40 },{ wch: 20 },{ wch: 30 },{ wch: 12 },{ wch: 12 },{ wch: 15 },{ wch: 20 },{ wch: 20 },{ wch: 50 }];
        XLSX.utils.book_append_sheet(wb, tasks_ws, 'Task Details');
        
        // 3. Charter Sheet
        const charterData = [
            ['Project Charter'], [],
            ['Background/Purpose', project.charter.background],
            ['Scope', project.charter.scope],
            ['Key Stakeholders', project.charter.stakeholders],
            ['Budget & Resources', project.charter.budget],
            ['Key Milestones', project.charter.milestones],
            ['Key Risks', project.charter.risks]
        ];
        const charter_ws = XLSX.utils.aoa_to_sheet(charterData);
        charter_ws['!cols'] = [{ wch: 20 }, { wch: 80 }];
        XLSX.utils.book_append_sheet(wb, charter_ws, 'Project Charter');

        // 4. Team Sheet
        if (project.team && project.team.length > 0) {
            const teamData = project.team.map(member => ({ Name: member.name, Role: member.role }));
            const team_ws = XLSX.utils.json_to_sheet(teamData);
            team_ws['!cols'] = [{ wch: 30 }, { wch: 40 }];
            XLSX.utils.book_append_sheet(wb, team_ws, 'Team');
        }

        XLSX.writeFile(wb, `${project.name} Report.xlsx`);
    };

    const isSaveDisabled = !formData.name.trim() || !formData.description.trim() || !formData.startDate || !formData.endDate || !formData.type.trim() || !formData.goal.trim();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSaveDisabled) {
             handleSave();
        }
    };

    return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
        <div className="p-4 sm:p-6 lg:p-8">
            <Header user={user} onLogout={onLogout} />
            <main className="mt-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                         <div className="relative">
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
                        <div className="flex items-center bg-gray-200 rounded-md p-1">
                            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-300'}`} aria-label="Card View">
                                <ViewGridIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-300'}`} aria-label="Table View">
                                <ViewListIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Add New Project</span>
                    </button>
                </div>

                {filteredProjects.length > 0 ? (
                    viewMode === 'card' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProjects.map(project => (
                                <div key={project.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                                        <p className="mt-2 text-sm text-gray-600 flex-grow min-h-[40px]">{project.description}</p>
                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            <dl className="space-y-2 text-sm text-gray-500">
                                                <div className="flex justify-between">
                                                    <dt className="font-medium text-gray-600">Start Date:</dt>
                                                    <dd className="text-right font-semibold">{project.startDate}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="font-medium text-gray-600">End Date:</dt>
                                                    <dd className="text-right font-semibold">{project.endDate}</dd>
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
                                        <button onClick={() => handleDownloadReport(project)} className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-100 transition-colors" aria-label="Download report"><DocumentDownloadIcon className="w-5 h-5" /></button>
                                        <button onClick={() => openEditModal(project)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors" aria-label="Edit project"><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => openDeleteModal(project)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors" aria-label="Delete project"><TrashIcon className="w-5 h-5" /></button>
                                        <button onClick={() => onSelectProject(project.id)} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-md shadow-sm hover:bg-indigo-400">View Project</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProjects.map(project => (
                                        <tr key={project.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={project.description}>{project.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.startDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.endDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">{project.type}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => handleDownloadReport(project)} className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-100 transition-colors" aria-label="Download report"><DocumentDownloadIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => openEditModal(project)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors" aria-label="Edit project"><PencilIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => openDeleteModal(project)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors" aria-label="Delete project"><TrashIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => onSelectProject(project.id)} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-md shadow-sm hover:bg-indigo-400">View</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
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
        
        {modalMode && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={closeModal}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">{modalMode === 'add' ? 'Add New Project' : 'Edit Project'}</h2>
                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" autoFocus />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Project Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                                <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Project Type</label>
                            <input type="text" id="type" name="type" placeholder="e.g., Client Work" value={formData.type} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="goal" className="block text-sm font-medium text-gray-700">Project Goal</label>
                            <input type="text" id="goal" name="goal" placeholder="e.g., Launch V1 of the new platform" value={formData.goal} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">Cancel</button>
                        <button type="button" onClick={handleSave} disabled={isSaveDisabled} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:bg-indigo-300 disabled:cursor-not-allowed">
                            {modalMode === 'add' ? 'Save Project' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            onConfirm={confirmDelete}
            title="Delete Project"
            message={<>Are you sure you want to delete the project <strong>"{projectToDelete?.name}"</strong>? This action cannot be undone.</>}
        />
    </div>
    );
};