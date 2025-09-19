import React from 'react';
import { Task } from '../types';
import { TableRow } from './TableRow';
import { XCircleIcon } from './icons/XCircleIcon';
import { EditableHeader } from './EditableHeader';

interface ProjectTableProps {
  tasks: Task[];
  departments: { name: string; weight: number }[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubTask: (parentId: string) => void;
  onToggleExpand: (taskId: string) => void;
  onRemoveDepartment: (department: string) => void;
  onRenameDepartment: (oldName: string, newName: string) => void;
  onUpdateDepartmentWeight: (name: string, weight: number) => void;
  onSelectTask: (task: Task) => void;
  onSelectTaskForDeliverables: (task: Task) => void;
  onMoveTask: (draggedId: string, targetId: string) => void;
}

const TableHeader: React.FC<{ 
    departments: { name: string; weight: number }[]; 
    onRemoveDepartment: (department: string) => void;
    onRenameDepartment: (oldName: string, newName: string) => void;
    onUpdateDepartmentWeight: (name: string, weight: number) => void;
}> = ({ departments, onRemoveDepartment, onRenameDepartment, onUpdateDepartmentWeight }) => {
    const totalWeight = departments.reduce((sum, dep) => sum + (dep.weight || 0), 0);

    return (
    <thead className="bg-gray-800 text-xs font-medium text-white uppercase tracking-wider align-bottom">
    <tr>
      {/* Ungrouped columns */}
      <th scope="col" rowSpan={2} className="px-3 py-3 text-left w-28 border-b border-r border-gray-700">Actions</th>
      <th scope="col" rowSpan={2} className="px-6 py-3 text-left border-b border-r border-gray-700 whitespace-nowrap">레벨</th>
      <th scope="col" rowSpan={2} className="px-6 py-3 text-left border-b border-r border-gray-700 min-w-[20rem]">업무명</th>
      <th scope="col" rowSpan={2} className="px-6 py-3 text-left border-b border-r border-gray-700">담당자</th>
      <th scope="col" rowSpan={2} className="px-6 py-3 text-left border-b border-r border-gray-700">산출물</th>
      <th scope="col" rowSpan={2} className="px-6 py-3 text-left border-b border-r border-gray-700">첨부</th>
      <th scope="col" rowSpan={2} className="px-6 py-3 text-left border-b border-r border-gray-700">진행상태</th>

      {/* Plan Group Header */}
      <th scope="colgroup" colSpan={4} className="px-6 py-3 text-center border-b border-x border-gray-700">
        계획 (Plan)
      </th>

      {/* Performance Group Header */}
      <th scope="colgroup" colSpan={departments.length + 1} className="px-6 py-3 text-center border-b border-r border-gray-700">
        <div className="flex items-center justify-center gap-2">
            <span>실적 (Performance)</span>
            <span className={`font-normal text-xs normal-case ${totalWeight > 100 ? 'text-red-400' : 'text-gray-400'}`}>
                (Total: {totalWeight.toFixed(1)} / 100)
            </span>
        </div>
      </th>
      
      {/* GAP column */}
      <th scope="col" rowSpan={2} className="px-6 py-3 text-left border-b border-r border-gray-700">GAP</th>
      
      {/* Ungrouped columns */}
      <th scope="col" rowSpan={2} className="px-6 py-3 text-left border-b border-r border-gray-700">Notes</th>
    </tr>
    <tr>
      {/* Plan Group Columns */}
      <th scope="col" className="px-6 py-3 text-left border-r border-gray-700">시작일</th>
      <th scope="col" className="px-6 py-3 text-left border-r border-gray-700">종료일</th>
      <th scope="col" className="px-6 py-3 text-left border-r border-gray-700 whitespace-nowrap">기간</th>
      <th scope="col" className="px-6 py-3 text-left">[계획]진척률</th>

      {/* Performance Group Columns */}
      {departments.map((dep) => (
        <th key={dep.name} scope="col" className="px-4 py-3 text-left min-w-[9rem] border-r border-gray-700 align-top">
           <div className="flex items-center justify-between gap-2 mb-1">
            <EditableHeader 
              value={dep.name}
              onSave={(newValue) => onRenameDepartment(dep.name, newValue)}
            />
            <button onClick={() => onRemoveDepartment(dep.name)} className="text-gray-400 hover:text-red-500 flex-shrink-0" aria-label={`Remove ${dep.name} department`}>
                <XCircleIcon className="w-4 h-4" />
            </button>
           </div>
           <div className="flex items-center gap-1">
             <label htmlFor={`weight-${dep.name}`} className="text-gray-300 font-normal normal-case text-[10px]">Weight:</label>
             <input
                id={`weight-${dep.name}`}
                type="number"
                value={dep.weight}
                onChange={(e) => onUpdateDepartmentWeight(dep.name, parseFloat(e.target.value))}
                min="0"
                step="0.1"
                className="w-full bg-gray-700 text-white text-xs font-medium rounded p-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
             />
           </div>
        </th>
      ))}
      <th scope="col" className="px-6 py-3 text-left">[실적]진척률</th>
    </tr>
  </thead>
)};

export const ProjectTable: React.FC<ProjectTableProps> = ({ tasks, departments, onUpdateTask, onDeleteTask, onAddSubTask, onToggleExpand, onRemoveDepartment, onRenameDepartment, onUpdateDepartmentWeight, onSelectTask, onSelectTaskForDeliverables, onMoveTask }) => {
  
  const rowsToRender: React.ReactElement[] = [];

  const buildRows = (parentId: string | null, level: number) => {
      const children = tasks.filter(t => t.parentId === parentId);

      children.forEach(task => {
          const hasChildren = tasks.some(t => t.parentId === task.id);
          rowsToRender.push(
              <TableRow
                  key={task.id}
                  task={task}
                  departments={departments}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  onAddSubTask={onAddSubTask}
                  onToggleExpand={onToggleExpand}
                  onSelectTask={onSelectTask}
                  onSelectTaskForDeliverables={onSelectTaskForDeliverables}
                  onMoveTask={onMoveTask}
                  level={level}
                  hasChildren={hasChildren}
              />
          );
          if (hasChildren && task.isExpanded) {
              buildRows(task.id, level + 1);
          }
      });
  };

  buildRows(null, 0);

  const columnCount = 14 + departments.length;
  
  return (
    <div className="overflow-x-auto shadow-md ring-1 ring-black ring-opacity-5 rounded-lg">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHeader 
            departments={departments} 
            onRemoveDepartment={onRemoveDepartment} 
            onRenameDepartment={onRenameDepartment}
            onUpdateDepartmentWeight={onUpdateDepartmentWeight}
          />
          <tbody className="bg-white divide-y divide-gray-200">
            {rowsToRender.length > 0 ? rowsToRender : (
                <tr>
                    <td colSpan={columnCount} className="text-center py-10 text-gray-500">
                        No tasks yet. Click 'Add Task' to get started!
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};