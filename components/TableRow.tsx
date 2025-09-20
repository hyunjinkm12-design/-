import React, { useState } from 'react';
import { Task, Status } from '../types';
import { EditableCell } from './EditableCell';
import { TrashIcon } from './icons/TrashIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ProgressBar } from './ProgressBar';
import { DragHandleIcon } from './icons/DragHandleIcon';

interface TableRowProps {
  task: Task;
  departments: { name: string; weight: number }[];
  baselineDate: string;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubTask: (parentId: string) => void;
  onToggleExpand: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onSelectTaskForDeliverables: (task: Task) => void;
  onMoveTask: (draggedId: string, targetId: string) => void;
  level: number;
  hasChildren: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ 
  task, 
  departments,
  baselineDate,
  onUpdateTask, 
  onDeleteTask, 
  onAddSubTask,
  onToggleExpand,
  onSelectTask,
  onSelectTaskForDeliverables,
  onMoveTask,
  level, 
  hasChildren 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleUpdate = (field: keyof Task, value: any) => {
    onUpdateTask({ ...task, [field]: value });
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.Completed: return 'bg-green-100 text-green-800';
      case Status.InProgress: return 'bg-blue-100 text-blue-800';
      case Status.OnHold: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = Object.values(Status);

  const calculateDuration = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
        return 0;
    }
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

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
    const progress = (elapsedDuration / totalDuration) * 100;

    return Math.round(progress);
  };
  
  const handleDepartmentProgressUpdate = (department: string, value: string) => {
    let numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) numericValue = 0;
    if (numericValue < 0) numericValue = 0;
    if (numericValue > 100) numericValue = 100;
    const updatedProgress = { ...task.departmentProgress, [department]: numericValue };
    handleUpdate('departmentProgress', updatedProgress);
  };

  const calculateOverallProgress = (): number => {
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
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    onMoveTask(draggedId, task.id);
  };

  const duration = calculateDuration(task.startDate, task.endDate);
  const plannedProgress = calculatePlannedProgress(task.startDate, task.endDate, baselineDate);
  const overallProgress = calculateOverallProgress();
  const overallProgressColor = overallProgress >= 100 ? 'bg-green-600' : 'bg-blue-600';
  
  const totalFiles = task.deliverables.reduce((sum, d) => sum + d.versions.length, 0);

  const gap = overallProgress - plannedProgress;
  let gapColor = 'text-gray-500';
  if (gap < 0) {
      gapColor = 'text-red-600 font-bold';
  } else if (gap > 0) {
      gapColor = 'text-green-600';
  }

  // Colors get lighter as the level increases (gets deeper)
  const levelColors = [
    'bg-gray-300',    // level 0
    'bg-gray-200',    // level 1
    'bg-gray-100',    // level 2
    'bg-gray-50',     // level 3 and deeper
  ];
  const rowBaseClass = levelColors[Math.min(level, levelColors.length - 1)];
  const dragOverClass = isDragOver ? 'outline outline-2 outline-offset-[-2px] outline-indigo-500' : '';

  return (
    <tr 
        className={`${rowBaseClass} ${dragOverClass}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {/* Ungrouped */}
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium border-r-2 border-gray-400">
        <div className="flex items-center justify-center gap-2">
           <button 
                onDragStart={handleDragStart}
                draggable
                className="cursor-move text-gray-400 hover:text-gray-700"
                aria-label="Drag to reorder task"
           >
                <DragHandleIcon className="w-5 h-5"/>
           </button>
          <button onClick={() => onAddSubTask(task.id)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition-colors" aria-label="Add sub-task">
              <PlusCircleIcon className="w-5 h-5" />
          </button>
          <button onClick={() => onDeleteTask(task.id)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors" aria-label="Delete task">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 border-r border-gray-200 text-center">{task.id}</td>
      <td 
        className="px-6 py-4 text-sm text-gray-700 border-r border-gray-200"
      >
        <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <button onClick={() => onToggleExpand(task.id)} className="mr-2 p-1 rounded-full hover:bg-gray-200 flex-shrink-0" aria-label={task.isExpanded ? 'Collapse' : 'Expand'}>
                {task.isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-7 h-4 mr-2 flex-shrink-0"></div>
            )}
             <div
              onClick={() => onSelectTask(task)}
              className="cursor-pointer hover:text-indigo-600 hover:underline truncate"
              title={task.name}
            >
              {task.name}
            </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200 text-center"><EditableCell value={task.assignee} onSave={(value) => handleUpdate('assignee', value)} /></td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200 text-center">
        <EditableCell value={task.deliverableName} onSave={(value) => handleUpdate('deliverableName', value)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
        <div className="flex items-center justify-center gap-4">
            <span className="text-gray-500">{totalFiles} file(s)</span>
            <button
                onClick={() => onSelectTaskForDeliverables(task)}
                className="ml-2 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
            >
                Manage
            </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r-2 border-gray-400">
        <EditableCell
          type="select"
          value={task.status}
          onSave={(value) => handleUpdate('status', value as Status)}
          options={statusOptions}
          displayTransform={(value) => (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(value as Status)}`}>
              {value}
            </span>
          )}
        />
      </td>
      
      {/* Plan Group */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
        <EditableCell type="date" value={task.startDate} onSave={(value) => handleUpdate('startDate', value)} readOnly={hasChildren} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
        <EditableCell type="date" value={task.endDate} onSave={(value) => handleUpdate('endDate', value)} readOnly={hasChildren} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">{duration > 0 ? `${duration}d` : '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r-2 border-gray-400">
        <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xs w-8 text-center">{plannedProgress}%</span>
            <ProgressBar progress={plannedProgress} color="bg-gray-400" />
        </div>
      </td>

      {/* Performance Group */}
      {departments.map(dep => (
        <td key={dep.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
            <EditableCell 
                type="text" 
                value={String(task.departmentProgress[dep.name] ?? 0)} 
                onSave={(value) => handleDepartmentProgressUpdate(dep.name, value)} 
                readOnly={hasChildren}
            />
        </td>
      ))}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r-2 border-gray-400">
        <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xs w-8 text-center">{overallProgress}%</span>
            <ProgressBar progress={overallProgress} color={overallProgressColor} />
        </div>
      </td>

      {/* GAP */}
      <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-mono border-r-2 border-gray-400 ${gapColor}`}>
        {gap > 0 ? `+${gap}` : gap}%
      </td>
      
      {/* Ungrouped */}
      <td className="px-6 py-4 text-sm text-gray-700 border-r border-gray-300 text-center"><EditableCell value={task.notes} onSave={(value) => handleUpdate('notes', value)} /></td>
    </tr>
  );
};