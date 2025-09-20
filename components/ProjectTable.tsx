import React from 'react';
import { Task } from '../types';
import { TableRow } from './TableRow';
import { XCircleIcon } from './icons/XCircleIcon';
import { EditableHeader } from './EditableHeader';
import { FilterIcon } from './icons/FilterIcon';

interface ProjectTableProps {
  tasks: Task[];
  departments: { name: string; weight: number }[];
  filters: Record<string, string[]>;
  baselineDate: string;
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
  onOpenFilter: (column: string, target: HTMLElement) => void;
}

interface FilterableHeaderProps {
  title: string;
  columnKey: string;
  filters: Record<string, string[]>;
  onOpenFilter: (column: string, target: HTMLElement) => void;
  className?: string;
  children?: React.ReactNode;
}

const FilterableHeader: React.FC<FilterableHeaderProps> = ({ title, columnKey, filters, onOpenFilter, className = '', children }) => {
    const isFiltered = filters[columnKey] && filters[columnKey].length > 0;
    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            <span className="flex-grow whitespace-nowrap">{title}</span>
            {children}
            <div className="flex items-center flex-shrink-0">
                <button
                    onClick={(e) => onOpenFilter(columnKey, e.currentTarget)}
                    className={`p-1 rounded-full ${isFiltered ? 'bg-blue-200 text-blue-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    aria-label={`Filter by ${title}`}
                >
                    <FilterIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const TableHeader: React.FC<{ 
    departments: { name: string; weight: number }[]; 
    filters: Record<string, string[]>;
    onRemoveDepartment: (department: string) => void;
    onRenameDepartment: (oldName: string, newName: string) => void;
    onUpdateDepartmentWeight: (name: string, weight: number) => void;
    onOpenFilter: (column: string, target: HTMLElement) => void;
}> = ({ departments, filters, onRemoveDepartment, onRenameDepartment, onUpdateDepartmentWeight, onOpenFilter }) => {
    const totalWeight = departments.reduce((sum, dep) => sum + (dep.weight || 0), 0);
    
    return (
    <thead className="text-sm font-medium uppercase tracking-wider align-bottom sticky top-0 z-20">
    <tr>
      {/* Actions */}
      <th scope="col" rowSpan={2} className="px-3 py-3 text-center bg-[rgb(64,64,64)] text-white border-b border-r border-white">
        Actions
      </th>
      
      {/* Basic Info Group Header */}
      <th scope="colgroup" colSpan={6} className="px-6 py-3 text-center bg-[rgb(64,64,64)] text-white border-b border-white">
        기본정보
      </th>

      {/* Plan Group Header */}
      <th scope="colgroup" colSpan={4} className="px-6 py-3 text-center bg-[rgb(161,108,54)] text-[rgb(250,250,250)] border-b border-x border-white">
        계획 (Plan)
      </th>

      {/* Performance Group Header */}
      <th scope="colgroup" colSpan={departments.length + 1} className="px-6 py-3 text-center bg-[rgb(57,102,77)] text-[rgb(240,240,240)] border-b border-r border-white">
        <div className="flex items-center justify-center gap-2">
            <span>실적 (Performance)</span>
            <span className={`font-normal text-xs normal-case ${totalWeight > 100 ? 'text-red-300' : 'text-gray-200'}`}>
                (Total: {totalWeight.toFixed(1)} / 100)
            </span>
        </div>
      </th>
      
      {/* GAP column */}
      <th scope="col" rowSpan={2} className="px-6 py-3 text-center bg-[rgb(64,64,64)] text-white border-b border-r border-white">
        <FilterableHeader title="GAP" columnKey="gap" filters={filters} onOpenFilter={onOpenFilter} />
      </th>
      
      {/* Notes */}
      <th scope="col" rowSpan={2} className="px-6 py-3 text-center bg-[rgb(64,64,64)] text-white border-b border-r border-white">
        <FilterableHeader title="Notes" columnKey="notes" filters={filters} onOpenFilter={onOpenFilter} />
      </th>
    </tr>
    <tr>
      {/* Basic Info Group Columns */}
      <th scope="col" className="px-2 py-3 text-center bg-[rgb(64,64,64)] text-white border-r border-white text-base"><FilterableHeader title="레벨" columnKey="id" filters={filters} onOpenFilter={onOpenFilter} /></th>
      <th scope="col" className="px-2 py-3 text-center bg-[rgb(64,64,64)] text-white border-r border-white text-base"><FilterableHeader title="업무명" columnKey="name" filters={filters} onOpenFilter={onOpenFilter} /></th>
      <th scope="col" className="px-2 py-3 text-center bg-[rgb(64,64,64)] text-white border-r border-white text-base"><FilterableHeader title="담당자" columnKey="assignee" filters={filters} onOpenFilter={onOpenFilter} /></th>
      <th scope="col" className="px-2 py-3 text-center bg-[rgb(64,64,64)] text-white border-r border-white text-base"><FilterableHeader title="산출물" columnKey="deliverableName" filters={filters} onOpenFilter={onOpenFilter} /></th>
      <th scope="col" className="px-6 py-3 text-center bg-[rgb(64,64,64)] text-white border-r border-white text-base">첨부</th>
      <th scope="col" className="px-2 py-3 text-center bg-[rgb(64,64,64)] text-white border-r border-white text-base"><FilterableHeader title="진행상태" columnKey="status" filters={filters} onOpenFilter={onOpenFilter} /></th>
      
      {/* Plan Group Columns */}
      <th scope="col" className="px-2 py-3 text-center bg-[rgb(161,108,54)] text-[rgb(250,250,250)] border-r border-white text-base"><FilterableHeader title="시작일" columnKey="startDate" filters={filters} onOpenFilter={onOpenFilter} /></th>
      <th scope="col" className="px-2 py-3 text-center bg-[rgb(161,108,54)] text-[rgb(250,250,250)] border-r border-white text-base"><FilterableHeader title="종료일" columnKey="endDate" filters={filters} onOpenFilter={onOpenFilter} /></th>
      <th scope="col" className="px-6 py-3 text-center bg-[rgb(161,108,54)] text-[rgb(250,250,250)] border-r border-white text-base whitespace-nowrap">기간</th>
      <th scope="col" className="px-6 py-3 text-center bg-[rgb(161,108,54)] text-[rgb(250,250,250)] border-r border-white text-base whitespace-nowrap">[계획]진척률</th>

      {/* Performance Group Columns */}
      {departments.map((dep) => (
        <th key={dep.name} scope="col" className="px-4 py-3 text-center bg-[rgb(57,102,77)] text-[rgb(240,240,240)] border-r border-white align-top text-base">
           <FilterableHeader title="" columnKey={`department_${dep.name}`} filters={filters} onOpenFilter={onOpenFilter}>
                <div className="flex-grow">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <EditableHeader 
                        value={dep.name}
                        onSave={(newValue) => onRenameDepartment(dep.name, newValue)}
                        />
                        <button onClick={() => onRemoveDepartment(dep.name)} className="text-gray-300 hover:text-red-400 flex-shrink-0" aria-label={`Remove ${dep.name} department`}>
                            <XCircleIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        <label htmlFor={`weight-${dep.name}`} className="text-[rgb(240,240,240)] font-normal normal-case text-[10px]">Weight:</label>
                        <input
                            id={`weight-${dep.name}`}
                            type="number"
                            value={dep.weight}
                            onChange={(e) => onUpdateDepartmentWeight(dep.name, parseFloat(e.target.value))}
                            min="0"
                            step="0.1"
                            className="w-full bg-[rgb(41,75,56)] text-[rgb(240,240,240)] text-xs font-medium rounded p-1 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                        />
                    </div>
                </div>
           </FilterableHeader>
        </th>
      ))}
      <th scope="col" className="px-2 py-3 text-center bg-[rgb(57,102,77)] text-[rgb(240,240,240)] border-r border-white text-base">
        <FilterableHeader title="[실적]진척률" columnKey="overallProgress" filters={filters} onOpenFilter={onOpenFilter} />
      </th>
    </tr>
  </thead>
)};

export const ProjectTable: React.FC<ProjectTableProps> = (props) => {
  const { tasks, departments, filters, baselineDate, onUpdateTask, onDeleteTask, onAddSubTask, onToggleExpand, onRemoveDepartment, onRenameDepartment, onUpdateDepartmentWeight, onSelectTask, onSelectTaskForDeliverables, onMoveTask, onOpenFilter } = props;

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
                  baselineDate={baselineDate}
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

  const totalColumnCount = 14 + departments.length;
  
  return (
    <div className="shadow-md ring-1 ring-black ring-opacity-5 rounded-lg">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <TableHeader 
            departments={departments} 
            filters={filters}
            onRemoveDepartment={onRemoveDepartment} 
            onRenameDepartment={onRenameDepartment}
            onUpdateDepartmentWeight={onUpdateDepartmentWeight}
            onOpenFilter={onOpenFilter}
          />
          <tbody className="bg-white divide-y divide-gray-200">
            {rowsToRender.length > 0 ? rowsToRender : (
                <tr>
                    <td colSpan={totalColumnCount} className="text-center py-10 text-gray-500">
                        No tasks match the current filters.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};