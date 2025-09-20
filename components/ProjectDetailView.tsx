import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { FilterDropdown } from './FilterDropdown';
import { PlusIcon } from './icons/PlusIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';

// This tells TypeScript that the XLSX object exists on the global scope (from the script tag in index.html)
declare const XLSX: any;

interface ProjectDetailViewProps {
    project: Project;
    user: User;
    onGoBack: () => void;
    onUpdateProject: (project: Project) => void;
    onLogout: () => void;
}

const recalculateTaskIdsAndProgress = (tasks: Task[], departments: {name: string; weight: number}[]): Task[] => {
    
    // Step 1: Recalculate IDs top-down to ensure a correct and clean hierarchy
    const taskMapByOldParentId = new Map<string | null, Task[]>();
    tasks.forEach(task => {
        if (!taskMapByOldParentId.has(task.parentId)) {
            taskMapByOldParentId.set(task.parentId, []);
        }
        taskMapByOldParentId.get(task.parentId)!.push(task);
    });

    const tasksWithNewIds: Task[] = [];
    const processLevel = (oldParentId: string | null, newParentId: string | null) => {
        const children = taskMapByOldParentId.get(oldParentId) || [];
        children.forEach((child, index) => {
            const newId = newParentId ? `${newParentId}.${index + 1}` : `${index + 1}`;
            const newTask = { ...child, id: newId, parentId: newParentId };
            tasksWithNewIds.push(newTask);
            processLevel(child.id, newId);
        });
    };
    processLevel(null, null);

    // Step 2: Perform bottom-up calculations (dates and progress)
    const taskMap = new Map(tasksWithNewIds.map(t => [t.id, { ...t }]));
    
    // Sort tasks from deepest to shallowest to ensure children are processed before parents
    const sortedTasks = [...tasksWithNewIds].sort((a, b) => b.id.split('.').length - a.id.split('.').length);

    for (const task of sortedTasks) {
        const children = tasksWithNewIds.filter(t => t.parentId === task.id);
        if (children.length > 0) {
            const updatedChildren = children.map(c => taskMap.get(c.id)!);
            const parentTask = taskMap.get(task.id)!;

            // Date roll-up: Set parent dates based on children's min/max dates
            let minStartDate: Date | null = null;
            let maxEndDate: Date | null = null;
            updatedChildren.forEach(child => {
                const childStartDate = new Date(child.startDate);
                const childEndDate = new Date(child.endDate);
                if (!isNaN(childStartDate.getTime())) {
                    if (minStartDate === null || childStartDate < minStartDate) minStartDate = childStartDate;
                }
                if (!isNaN(childEndDate.getTime())) {
                    if (maxEndDate === null || childEndDate > maxEndDate) maxEndDate = childEndDate;
                }
            });
            if (minStartDate) parentTask.startDate = minStartDate.toISOString().split('T')[0];
            if (maxEndDate) parentTask.endDate = maxEndDate.toISOString().split('T')[0];

            // Progress roll-up: Set parent progress based on average of children's progress
            const newParentDeptProgress: { [key: string]: number } = {};
            departments.forEach(dep => {
                const sumForDept = updatedChildren.reduce((sum, child) => sum + (child.departmentProgress[dep.name] ?? 0), 0);
                newParentDeptProgress[dep.name] = Math.round(sumForDept / updatedChildren.length);
            });
            parentTask.departmentProgress = newParentDeptProgress;
        }
    }

    // Return tasks sorted by the new ID for consistent rendering
    return Array.from(taskMap.values()).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
};


export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, user, onGoBack, onUpdateProject, onLogout }) => {
  const [tasks, setTasks] = useState<Task[]>(project.tasks);
  const [departments, setDepartments] = useState<{ name: string; weight: number }[]>(project.departments);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskForDeliverables, setSelectedTaskForDeliverables] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<'schedule' | 'dashboard' | 'charter'>('schedule');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update local state if the project prop changes from the parent
  useEffect(() => {
    setTasks(project.tasks);
    setDepartments(project.departments);
  }, [project]);

  // --- FILTERING & DYNAMIC CALCULATION LOGIC ---
  const [baselineDate, setBaselineDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [activeFilter, setActiveFilter] = useState<{ column: string; target: HTMLElement } | null>(null);
  
  const handleFilterChange = useCallback((column: string, values: string[]) => {
    setFilters(prev => {
        const newFilters = { ...prev };
        if (values.length > 0) {
            newFilters[column] = values;
        } else {
            delete newFilters[column];
        }
        return newFilters;
    });
  }, []);

  const calculatePlannedProgress = (start: string, end: string, baseline: string): number => {
    const today = new Date(baseline);
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
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  const calculateTaskOverallProgress = useCallback((task: Task): number => {
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
    if (totalWeight === 0) return 0;
    return Math.round(totalWeightedProgress / totalWeight);
  }, [departments]);
  
  const getTaskValueByColumn = useCallback((task: Task, columnKey: string): string => {
    if (columnKey.startsWith('department_')) {
        const deptName = columnKey.replace('department_', '');
        return String(task.departmentProgress[deptName] ?? 0);
    }
    switch (columnKey) {
        case 'overallProgress':
            return String(calculateTaskOverallProgress(task));
        case 'gap':
            const planned = calculatePlannedProgress(task.startDate, task.endDate, baselineDate);
            const overall = calculateTaskOverallProgress(task);
            return String(overall - planned);
        default:
            return String((task as any)[columnKey] ?? '');
    }
  }, [calculateTaskOverallProgress, baselineDate]);


  const uniqueValuesByColumn = useMemo(() => {
    const valueMap: Record<string, Set<string>> = {
        id: new Set(), name: new Set(), assignee: new Set(), deliverableName: new Set(), status: new Set(),
        startDate: new Set(), endDate: new Set(), notes: new Set(), gap: new Set(),
        overallProgress: new Set()
    };
    departments.forEach(dep => {
        valueMap[`department_${dep.name}`] = new Set();
    });

    tasks.forEach(task => {
        for (const column of Object.keys(valueMap)) {
            const value = getTaskValueByColumn(task, column);
            if(value) valueMap[column].add(value);
        }
    });

    const result: Record<string, string[]> = {};
    for (const column in valueMap) {
        result[column] = Array.from(valueMap[column]).sort();
    }
    return result;
  }, [tasks, departments, getTaskValueByColumn]);


  const filteredTasks = useMemo(() => {
    const activeFilterKeys = Object.keys(filters);
    if (activeFilterKeys.length === 0) return tasks;

    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visibleTaskIds = new Set<string>();

    // First, find all tasks that directly match the filter criteria.
    const matchingTasks = tasks.filter(task => {
        return activeFilterKeys.every(key => {
            const filterValues = filters[key];
            if (!filterValues || filterValues.length === 0) return true;
            const taskValue = getTaskValueByColumn(task, key);
            return filterValues.includes(taskValue);
        });
    });

    // For each matching task, add it and all its ancestors to the visible set.
    matchingTasks.forEach(task => {
        let currentTaskId: string | null = task.id;
        while (currentTaskId) {
            if (visibleTaskIds.has(currentTaskId)) break; // Already processed this branch
            visibleTaskIds.add(currentTaskId);
            const parent = taskMap.get(currentTaskId);
            currentTaskId = parent ? parent.parentId : null;
        }
    });

    return tasks.filter(task => visibleTaskIds.has(task.id));
  }, [tasks, filters, getTaskValueByColumn]);

  // --- END OF FILTERING LOGIC ---

  // Modal State
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isDeleteDeptModalOpen, setIsDeleteDeptModalOpen] = useState(false);
  const [departmentToModify, setDepartmentToModify] = useState<string | null>(null);
  
  const handleAddDepartment = useCallback((newDepartmentName: string) => {
    const trimmedDeptName = newDepartmentName.trim();
    if (!trimmedDeptName) {
        alert("Department name must be non-empty.");
        return;
    }

    setDepartments(currentDepts => {
        if (currentDepts.some(d => d.name === trimmedDeptName)) {
            alert("Department name must be unique.");
            return currentDepts;
        }
        const currentTotalWeight = currentDepts.reduce((sum, dep) => sum + dep.weight, 0);
        const newDeptWeight = 1;
        if (currentTotalWeight + newDeptWeight > 100) {
            alert(`Cannot add department. Total weight would exceed 100.`);
            return currentDepts;
        }
        
        const newDepartments = [...currentDepts, { name: trimmedDeptName, weight: newDeptWeight }];
        
        setTasks(currentTasks => {
            const newTasks = currentTasks.map(task => ({
                ...task,
                departmentProgress: { ...task.departmentProgress, [trimmedDeptName]: 0 }
            }));
            onUpdateProject({ ...project, tasks: newTasks, departments: newDepartments });
            return newTasks;
        });

        return newDepartments;
    });
  }, [onUpdateProject, project]);
  
  const openRemoveDepartmentModal = useCallback((departmentName: string) => {
      setDepartmentToModify(departmentName);
      setIsDeleteDeptModalOpen(true);
  }, []);

  const handleRemoveDepartment = useCallback(() => {
    if (!departmentToModify) return;
    const deptNameToRemove = departmentToModify;

    setDepartments(currentDepts => {
        const newDepartments = currentDepts.filter(dep => dep.name !== deptNameToRemove);
        setTasks(currentTasks => {
            const newTasks = currentTasks.map(task => {
                const { [deptNameToRemove]: _, ...restProgress } = task.departmentProgress;
                return { ...task, departmentProgress: restProgress };
            });
            onUpdateProject({ ...project, tasks: newTasks, departments: newDepartments });
            return newTasks;
        });
        return newDepartments;
    });

    setDepartmentToModify(null);
  }, [departmentToModify, onUpdateProject, project]);

  const handleRenameDepartment = useCallback((oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName || trimmedNewName === oldName) return;

    setDepartments(currentDepts => {
        if (currentDepts.some(d => d.name === trimmedNewName)) {
            alert("Department name already exists.");
            return currentDepts;
        }
        const newDepartments = currentDepts.map(dep => dep.name === oldName ? { ...dep, name: trimmedNewName } : dep);
        setTasks(currentTasks => {
            const newTasks = currentTasks.map(task => {
              if (Object.prototype.hasOwnProperty.call(task.departmentProgress, oldName)) {
                // Fix: Refactor to use immutable update pattern to avoid confusing TS error.
                const progressValue = task.departmentProgress[oldName];
                const { [oldName]: _, ...rest } = task.departmentProgress;
                return {
                  ...task,
                  departmentProgress: {
                    ...rest,
                    [trimmedNewName]: progressValue,
                  },
                };
              }
              return task;
            });
            onUpdateProject({ ...project, tasks: newTasks, departments: newDepartments });
            return newTasks;
        });
        return newDepartments;
    });
  }, [onUpdateProject, project]);
  
  const handleUpdateDepartmentWeight = useCallback((name: string, weight: number) => {
    const newWeight = isNaN(weight) || weight < 0 ? 0 : weight;

    setDepartments(currentDepts => {
        const totalWeightWithoutCurrent = currentDepts.reduce((sum, dep) => dep.name !== name ? sum + dep.weight : sum, 0);
        if (totalWeightWithoutCurrent + newWeight > 100) {
            alert(`Total weight cannot exceed 100.`);
            return [...currentDepts];
        }
        const newDepartments = currentDepts.map(dep => dep.name === name ? { ...dep, weight: newWeight } : dep);
        onUpdateProject({ ...project, tasks, departments: newDepartments });
        return newDepartments;
    });
  }, [onUpdateProject, project, tasks]);

  const handleAddTask = useCallback(() => {
    setTasks(currentTasks => {
        const topLevelTasks = currentTasks.filter(t => t.parentId === null);
        const maxId = topLevelTasks.reduce((max, task) => {
            const taskIdNum = parseInt(task.id, 10);
            return isNaN(taskIdNum) ? max : Math.max(max, taskIdNum);
        }, 0);
        const newTaskId = (maxId + 1).toString();

        const newDepartmentProgress = departments.reduce((acc, dep) => ({ ...acc, [dep.name]: 0 }), {});

        const newTask: Task = {
            id: newTaskId,
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
        
        const finalTasks = [...currentTasks, newTask];
        onUpdateProject({ ...project, tasks: finalTasks, departments });
        return finalTasks;
    });
  }, [departments, onUpdateProject, project]);

  const handleAddSubTask = useCallback((parentId: string) => {
    setTasks(currentTasks => {
        const parentTask = currentTasks.find(t => t.id === parentId);
        if (!parentTask) return currentTasks;

        const newDepartmentProgress = departments.reduce((acc, dep) => ({ ...acc, [dep.name]: 0 }), {});

        const newTask: Task = {
            id: `temp-${Date.now()}`,
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
        
        const updatedTasks = currentTasks.map(t => t.id === parentId ? { ...t, isExpanded: true } : t);
        const tasksWithNew = [...updatedTasks, newTask];
        
        const finalTasks = recalculateTaskIdsAndProgress(tasksWithNew, departments);
        onUpdateProject({ ...project, tasks: finalTasks, departments });
        return finalTasks;
    });
  }, [departments, onUpdateProject, project]);

  const handleToggleExpand = useCallback((taskId: string) => {
    setTasks(currentTasks => {
        const newTasks = currentTasks.map((task) => task.id === taskId ? { ...task, isExpanded: !task.isExpanded } : task);
        onUpdateProject({ ...project, tasks: newTasks, departments });
        return newTasks;
    });
  }, [departments, onUpdateProject, project]);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setTasks(currentTasks => {
        const tasksWithUpdate = currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
        const finalTasks = recalculateTaskIdsAndProgress(tasksWithUpdate, departments);
        onUpdateProject({ ...project, tasks: finalTasks, departments });
        return finalTasks;
    });
    setSelectedTask(null);
    setSelectedTaskForDeliverables(null);
  }, [departments, onUpdateProject, project]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(currentTasks => {
        const idsToDelete = new Set<string>();
        const findDescendants = (id: string) => {
            idsToDelete.add(id);
            currentTasks.forEach(task => { if (task.parentId === id) findDescendants(task.id); });
        };
        findDescendants(taskId);
        const remainingTasks = currentTasks.filter((task) => !idsToDelete.has(task.id));
        const finalTasks = recalculateTaskIdsAndProgress(remainingTasks, departments);
        onUpdateProject({ ...project, tasks: finalTasks, departments });
        return finalTasks;
    });
  }, [departments, onUpdateProject, project]);
  
  const handleMoveTask = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    setTasks(currentTasks => {
        let newTasks = [...currentTasks];
        const draggedIndex = newTasks.findIndex(t => t.id === draggedId);
        const targetIndex = newTasks.findIndex(t => t.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return currentTasks;

        const targetTask = newTasks[targetIndex];
        let currentParentId = targetTask.parentId;
        while (currentParentId) {
            if (currentParentId === draggedId) return currentTasks; // Prevent nesting into own child
            const parent = newTasks.find(t => t.id === currentParentId);
            currentParentId = parent ? parent.parentId : null;
        }

        const [draggedTask] = newTasks.splice(draggedIndex, 1);
        const newTargetIndex = newTasks.findIndex(t => t.id === targetId);
        draggedTask.parentId = targetTask.parentId;
        newTasks.splice(newTargetIndex, 0, draggedTask);

        const finalTasks = recalculateTaskIdsAndProgress(newTasks, departments);
        onUpdateProject({ ...project, tasks: finalTasks, departments });
        return finalTasks;
    });
  }, [departments, onUpdateProject, project]);

  const handleDownloadTemplate = useCallback(() => {
    const headers = [
        'id', 'parentId', 'name', 'deliverableName', 
        'startDate', 'endDate', 'assignee', 'status', 'notes'
    ];
    departments.forEach(dep => headers.push(`Progress: ${dep.name}`));

    const exampleData = [
        '1', null, 'Phase 1 Planning', 'Planning Document', 
        'YYYY-MM-DD', 'YYYY-MM-DD', 'John Doe', 'In Progress', 'Initial planning notes...'
    ];
    // FIX: The example data array was inferred as (string | null)[], causing a type error when pushing a number.
    // Changed 0 to '0' to match the inferred array type.
    departments.forEach(() => exampleData.push('0'));

    const dataToExport = [headers, exampleData];

    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    XLSX.writeFile(workbook, `${project.name}_tasks_template.xlsx`);
  }, [departments, project.name]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const formatDateForInput = (date: Date): string => {
            if (!(date instanceof Date) || isNaN(date.getTime())) { return new Date().toISOString().split('T')[0]; }
            return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        };
        
        const validStatuses = new Set(Object.values(Status));

        const importedTasks: Task[] = jsonData.map((row: any) => {
          const departmentProgress: { [key: string]: number } = {};
          for (const key in row) {
            if (key.startsWith('Progress: ')) {
              const depName = key.substring('Progress: '.length);
              const progressValue = Number(row[key]);
              if (!isNaN(progressValue)) {
                departmentProgress[depName] = Math.max(0, Math.min(100, progressValue));
              }
            }
          }

          const currentTask = tasks.find(t => t.id === String(row.id))

          return {
            id: String(row.id ?? `temp-${Math.random()}`),
            parentId: row.parentId ? String(row.parentId) : null,
            name: row.name ?? 'Unnamed Task',
            deliverableName: row.deliverableName ?? '',
            startDate: formatDateForInput(row.startDate),
            endDate: formatDateForInput(row.endDate),
            assignee: row.assignee ?? '',
            status: validStatuses.has(row.status) ? row.status : Status.NotStarted,
            notes: row.notes ?? '',
            departmentProgress,
            plannedProgress: 0, // This will be recalculated
            deliverables: currentTask?.deliverables || [], // Preserve existing deliverables
            isExpanded: currentTask?.isExpanded || false, // Preserve expanded state
          };
        });
        
        const finalTasks = recalculateTaskIdsAndProgress(importedTasks, departments);

        setTasks(finalTasks);
        onUpdateProject({ ...project, tasks: finalTasks });
        alert('Tasks imported successfully!');
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert('Failed to import tasks. Please check the file format and try again.');
      } finally {
        // Reset file input to allow re-uploading the same file
        if (event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const handleSelectTask = useCallback((task: Task) => setSelectedTask(task), []);
  const handleSelectTaskForDeliverables = useCallback((task: Task) => setSelectedTaskForDeliverables(task), []);
  const handleCloseModal = useCallback(() => setSelectedTask(null), []);
  const handleCloseDeliverablesModal = useCallback(() => setSelectedTaskForDeliverables(null), []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="p-4 sm:p-6 lg:p-8">
        <Header 
            projectName={project.name}
            user={user}
            onGoBack={onGoBack} 
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
                        } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-base`}
                    >
                        Schedule
                    </button>
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`${
                        activeView === 'dashboard'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-base`}
                    >
                        Dashboard & Gantt
                    </button>
                    <button
                        onClick={() => setActiveView('charter')}
                        className={`${
                        activeView === 'charter'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-base`}
                    >
                        Project Charter
                    </button>
                </nav>
            </div>
          
          {activeView === 'schedule' && (
            <>
              <ScheduleSummary tasks={tasks} departments={departments} baselineDate={baselineDate} />
              <div className="flex justify-between items-center my-4">
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <label htmlFor="baseline-date" className="text-sm font-medium text-gray-700 flex-shrink-0">
                            기준일:
                        </label>
                        <input
                            type="date"
                            id="baseline-date"
                            value={baselineDate}
                            onChange={(e) => setBaselineDate(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    />
                    <button
                        onClick={handleDownloadTemplate}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-md shadow-sm hover:bg-green-200 transition-colors"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Download Template</span>
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-md shadow-sm hover:bg-blue-200 transition-colors"
                    >
                        <UploadIcon className="w-5 h-5" />
                        <span>Upload Excel</span>
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddDeptModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Department</span>
                    </button>
                    <button
                        onClick={handleAddTask}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Task</span>
                    </button>
                </div>
              </div>
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 25rem)' }}>
                <ProjectTable
                    tasks={filteredTasks}
                    departments={departments}
                    filters={filters}
                    baselineDate={baselineDate}
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
                    onOpenFilter={(column, target) => setActiveFilter({ column, target })}
                />
              </div>
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
            key={selectedTaskForDeliverables.id}
            task={selectedTaskForDeliverables}
            onClose={handleCloseDeliverablesModal}
            onSave={handleUpdateTask}
          />
        )}
        {activeFilter && (
            <FilterDropdown
                isOpen={!!activeFilter}
                onClose={() => setActiveFilter(null)}
                onApply={(values) => handleFilterChange(activeFilter.column, values)}
                options={uniqueValuesByColumn[activeFilter.column] || []}
                appliedValues={filters[activeFilter.column] || []}
                targetElement={activeFilter.target}
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
