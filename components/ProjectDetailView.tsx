import React, { useState, useCallback, useEffect } from 'react';
import { ProjectTable } from './ProjectTable';
import { Header } from './Header';
import { Task, Status, Project, User } from '../types';
import { TaskModal } from './TaskModal';
import { InputDialog } from './InputDialog';
import { ConfirmationModal } from './ConfirmationModal';
import { DeliverablesModal } from './DeliverablesModal';
import { DashboardGanttView } from './DashboardGanttView';
import { ProjectCharterView } from './ProjectCharterView';
import { ScheduleSummary } from './ScheduleSummary';

interface ProjectDetailViewProps {
    project: Project;
    user: User;
    onGoBack: () => void;
    onUpdateProject: (project: Project) => void;
    onLogout: () => void;
}

const recalculateTaskIdsAndProgress = (tasks: Task[], departments: {name: string; weight: number}[]): Task[] => {
    
    const taskMapByOldParentId = new Map<string | null, Task[]>();
    tasks.forEach(task => {
        if (!taskMapByOldParentId.has(task.parentId)) {
            taskMapByOldParentId.set(task.parentId, []);
        }
        taskMapByOldParentId.get(task.parentId)!.push(task);
    });

    const newTasks: Task[] = [];
    const processLevel = (oldParentId: string | null, newParentId: string | null) => {
        const children = taskMapByOldParentId.get(oldParentId) || [];
        children.forEach((child, index) => {
            const newId = newParentId ? `${newParentId}.${index + 1}` : `${index + 1}`;
            const newTask = { ...child, id: newId, parentId: newParentId };
            newTasks.push(newTask);
            processLevel(child.id, newId);
        });
    };
    processLevel(null, null);

    const finalTasks = [...newTasks];
    const taskMapById = new Map(finalTasks.map(t => [t.id, t]));

    for (let i = finalTasks.length - 1; i >= 0; i--) {
        const parentTask = finalTasks[i];
        const children = finalTasks.filter(t => t.parentId === parentTask.id);

        if (children.length > 0) {
            const newParentDeptProgress: { [key: string]: number } = {};
            const departmentNames = departments.map(d => d.name);

            departmentNames.forEach(depName => {
                const sumForDept = children.reduce((sum, child) => {
                    const updatedChild = taskMapById.get(child.id)!;
                    return sum + (updatedChild.departmentProgress[depName] ?? 0);
                }, 0);
                newParentDeptProgress[depName] = Math.round(sumForDept / children.length);
            });
            
            const updatedParent = { ...parentTask, departmentProgress: newParentDeptProgress };
            finalTasks[i] = updatedParent;
            taskMapById.set(parentTask.id, updatedParent);
        }
    }

    return finalTasks;
};


export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, user, onGoBack, onUpdateProject, onLogout }) => {
  const [tasks, setTasks] = useState<Task[]>(project.tasks);
  const [departments, setDepartments] = useState<{ name: string; weight: number }[]>(project.departments);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskForDeliverables, setSelectedTaskForDeliverables] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<'schedule' | 'dashboard' | 'charter'>('schedule');
  
  // Update local state if the project prop changes from the parent
  useEffect(() => {
    setTasks(project.tasks);
    setDepartments(project.departments);
  }, [project]);

  // Modal State
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isDeleteDeptModalOpen, setIsDeleteDeptModalOpen] = useState(false);
  const [departmentToModify, setDepartmentToModify] = useState<string | null>(null);

  const updateParentProject = (newTasks: Task[], newDepartments: { name: string; weight: number }[]) => {
      onUpdateProject({ ...project, tasks: newTasks, departments: newDepartments });
  };
  
  const handleAddDepartment = useCallback((newDepartmentName: string) => {
    const trimmedDeptName = newDepartmentName.trim();
    if (!trimmedDeptName) return;

    const currentTotalWeight = departments.reduce((sum, dep) => sum + dep.weight, 0);
    const newDeptWeight = 1; // Default weight

    if (currentTotalWeight + newDeptWeight > 100) {
        alert(`Cannot add department. Total weight would exceed 100.`);
        return;
    }
    
    let newDepartments: { name: string; weight: number; }[] = [];
    setDepartments(prevDeps => {
        if (prevDeps.some(d => d.name === trimmedDeptName)) {
            alert("Department already exists.");
            return prevDeps;
        }
        newDepartments = [...prevDeps, { name: trimmedDeptName, weight: newDeptWeight }];
        return newDepartments;
    });

    if (newDepartments.length > departments.length) {
        const newTasks = tasks.map(task => ({
            ...task,
            departmentProgress: { ...task.departmentProgress, [trimmedDeptName]: 0 }
        }));
        updateParentProject(newTasks, newDepartments);
    }
  }, [departments, tasks, onUpdateProject, project]);
  
  const openRemoveDepartmentModal = useCallback((departmentName: string) => {
      setDepartmentToModify(departmentName);
      setIsDeleteDeptModalOpen(true);
  }, []);

  const handleRemoveDepartment = useCallback(() => {
      if (!departmentToModify) return;

      const newDepartments = departments.filter(dep => dep.name !== departmentToModify);
      const newTasks = tasks.map(task => {
          const { [departmentToModify]: _, ...restProgress } = task.departmentProgress;
          return { ...task, departmentProgress: restProgress };
      });
      
      updateParentProject(newTasks, newDepartments);
      setDepartmentToModify(null);
  }, [departmentToModify, departments, tasks, onUpdateProject, project]);

  const handleRenameDepartment = useCallback((oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName || trimmedNewName === oldName) return;

    if (departments.some(d => d.name === trimmedNewName)) {
        alert("Department name already exists.");
        return;
    }

    const newDepartments = departments.map(dep => dep.name === oldName ? { ...dep, name: trimmedNewName } : dep);
    const newTasks = tasks.map(task => {
      if (Object.prototype.hasOwnProperty.call(task.departmentProgress, oldName)) {
        const newDepartmentProgress = { ...task.departmentProgress };
        newDepartmentProgress[trimmedNewName] = newDepartmentProgress[oldName];
        delete newDepartmentProgress[oldName];
        return { ...task, departmentProgress: newDepartmentProgress };
      }
      return task;
    });
    
    updateParentProject(newTasks, newDepartments);
  }, [departments, tasks, onUpdateProject, project]);
  
  const handleUpdateDepartmentWeight = useCallback((name: string, weight: number) => {
    const newWeight = isNaN(weight) || weight < 0 ? 0 : weight;

    const totalWeightWithoutCurrent = departments.reduce((sum, dep) => dep.name !== name ? sum + dep.weight : sum, 0);

    if (totalWeightWithoutCurrent + newWeight > 100) {
      alert(`Total weight cannot exceed 100.`);
      setDepartments(prev => [...prev]); // Force re-render to revert input value
      return;
    }

    const newDepartments = departments.map(dep => dep.name === name ? { ...dep, weight: newWeight } : dep);
    updateParentProject(tasks, newDepartments);
  }, [departments, tasks, onUpdateProject, project]);

  const handleAddTask = useCallback(() => {
    const newDepartmentProgress = departments.reduce((acc, dep) => ({ ...acc, [dep.name]: 0 }), {});

    const newTask: Task = {
      id: 'temp-id',
      parentId: null,
      name: 'New Task',
      deliverableName: 'Not specified',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      assignee: '',
      deliverables: [],
      status: Status.NotStarted,
      plannedProgress: 0,
      departmentProgress: newDepartmentProgress,
      notes: '',
      isExpanded: false,
    };
    const newTasks = recalculateTaskIdsAndProgress([...tasks, newTask], departments);
    updateParentProject(newTasks, departments);
  }, [tasks, departments, onUpdateProject, project]);

  const handleAddSubTask = useCallback((parentId: string) => {
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) return;

    const newDepartmentProgress = departments.reduce((acc, dep) => ({ ...acc, [dep.name]: 0 }), {});

    const newTask: Task = {
      id: 'temp-id',
      parentId: parentId,
      name: 'New Sub-task',
      deliverableName: 'Not specified',
      startDate: parentTask.startDate,
      endDate: parentTask.endDate,
      assignee: '',
      deliverables: [],
      status: Status.NotStarted,
      plannedProgress: 0,
      departmentProgress: newDepartmentProgress,
      notes: '',
      isExpanded: false,
    };

    const parentIndex = tasks.findIndex(t => t.id === parentId);
    const updatedTasks = tasks.map(t => t.id === parentId ? { ...t, isExpanded: true } : t);
    updatedTasks.splice(parentIndex + 1, 0, newTask);
    const newTasks = recalculateTaskIdsAndProgress(updatedTasks, departments);
    updateParentProject(newTasks, departments);
  }, [tasks, departments, onUpdateProject, project]);

  const handleToggleExpand = useCallback((taskId: string) => {
    const newTasks = tasks.map((task) => task.id === taskId ? { ...task, isExpanded: !task.isExpanded } : task);
    updateParentProject(newTasks, departments);
  }, [tasks, departments, onUpdateProject, project]);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    const newTasks = recalculateTaskIdsAndProgress(
        tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        departments
    );
    updateParentProject(newTasks, departments);
    setSelectedTask(null);
    setSelectedTaskForDeliverables(null);
  }, [tasks, departments, onUpdateProject, project]);

  const handleDeleteTask = useCallback((taskId: string) => {
    const idsToDelete = new Set<string>();
    const findDescendants = (id: string) => {
        idsToDelete.add(id);
        tasks.forEach(task => { if (task.parentId === id) findDescendants(task.id); });
    };
    findDescendants(taskId);
    const remainingTasks = tasks.filter((task) => !idsToDelete.has(task.id));
    const newTasks = recalculateTaskIdsAndProgress(remainingTasks, departments);
    updateParentProject(newTasks, departments);
  }, [tasks, departments, onUpdateProject, project]);
  
  const handleMoveTask = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    let newTasks = [...tasks];
    const draggedIndex = newTasks.findIndex(t => t.id === draggedId);
    const targetIndex = newTasks.findIndex(t => t.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const targetTask = newTasks[targetIndex];
    let currentParentId = targetTask.parentId;
    while (currentParentId) {
        if (currentParentId === draggedId) return; // Prevent nesting into own child
        const parent = newTasks.find(t => t.id === currentParentId);
        currentParentId = parent ? parent.parentId : null;
    }

    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    const newTargetIndex = newTasks.findIndex(t => t.id === targetId);
    draggedTask.parentId = targetTask.parentId;
    newTasks.splice(newTargetIndex, 0, draggedTask);

    const finalTasks = recalculateTaskIdsAndProgress(newTasks, departments);
    updateParentProject(finalTasks, departments);
  }, [tasks, departments, onUpdateProject, project]);

  const handleSelectTask = useCallback((task: Task) => setSelectedTask(task), []);
  const handleSelectTaskForDeliverables = useCallback((task: Task) => setSelectedTaskForDeliverables(task), []);
  const handleCloseModal = useCallback(() => setSelectedTask(null), []);
  const handleCloseDeliverablesModal = useCallback(() => setSelectedTaskForDeliverables(null), []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Header 
            projectName={project.name}
            user={user}
            onGoBack={onGoBack} 
            onAddTask={activeView === 'schedule' ? handleAddTask : undefined} 
            onAddDepartment={activeView === 'schedule' ? () => setIsAddDeptModalOpen(true) : undefined}
            onLogout={onLogout}
        />
        <main className="mt-8">
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveView('schedule')}
                        className={`${
                        activeView === 'schedule'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Schedule
                    </button>
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`${
                        activeView === 'dashboard'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Dashboard & Gantt
                    </button>
                    <button
                        onClick={() => setActiveView('charter')}
                        className={`${
                        activeView === 'charter'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Project Charter
                    </button>
                </nav>
            </div>
          
          {activeView === 'schedule' && (
            <>
              <ScheduleSummary tasks={tasks} departments={departments} />
              <ProjectTable
                  tasks={tasks}
                  departments={departments}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onAddSubTask={handleAddSubTask}
                  onToggleExpand={handleToggleExpand}
                  onRemoveDepartment={openRemoveDepartmentModal}
                  onRenameDepartment={handleRenameDepartment}
                  onUpdateDepartmentWeight={handleUpdateDepartmentWeight}
                  onSelectTask={handleSelectTask}
                  onSelectTaskForDeliverables={handleSelectTaskForDeliverables}
                  onMoveTask={handleMoveTask}
              />
            </>
          )}

          {activeView === 'dashboard' && <DashboardGanttView project={project} />}

          {activeView === 'charter' && <ProjectCharterView project={project} onUpdateProject={onUpdateProject} />}

        </main>
        {selectedTask && (
            <TaskModal
                task={selectedTask}
                onClose={handleCloseModal}
                onSave={handleUpdateTask}
            />
        )}
        {selectedTaskForDeliverables && (
          <DeliverablesModal
            task={selectedTaskForDeliverables}
            onClose={handleCloseDeliverablesModal}
            onSave={handleUpdateTask}
          />
        )}
        <InputDialog
            isOpen={isAddDeptModalOpen}
            onClose={() => setIsAddDeptModalOpen(false)}
            onSave={handleAddDepartment}
            title="Add New Department"
            label="Department Name"
        />
        <ConfirmationModal
            isOpen={isDeleteDeptModalOpen}
            onClose={() => {
                setIsDeleteDeptModalOpen(false);
                setDepartmentToModify(null);
            }}
            onConfirm={handleRemoveDepartment}
            title="Confirm Deletion"
            message={
                <>
                    Are you sure you want to remove the <strong>"{departmentToModify}"</strong> department? 
                    This will remove its progress data from all tasks. This action cannot be undone.
                </>
            }
        />
      </div>
    </div>
  );
};