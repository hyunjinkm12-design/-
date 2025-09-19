import React from 'react';
import { Task } from '../types';

interface GanttChartProps {
  tasks: Task[];
}

const getDaysBetween = (date1: Date, date2: Date): number => {
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
    if (tasks.length === 0) {
        return <div className="text-center p-8 text-gray-500">No tasks to display in Gantt chart.</div>;
    }

    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const getTaskOverallProgress = (task: Task): number => {
        // Simplified progress for Gantt bar display. A full weighted calculation is expensive here.
        // We assume departmentProgress is already rolled up from children.
        const progressValues = Object.values(task.departmentProgress);
        if (progressValues.length === 0) return 0;
        const sum = progressValues.reduce((a, b) => a + b, 0);
        return Math.round(sum / progressValues.length);
    };

    const sortedTasks: Task[] = [];
    const buildSortedTasks = (parentId: string | null) => {
        const children = tasks.filter(t => t.parentId === parentId).sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true}));
        children.forEach(child => {
            sortedTasks.push(child);
            buildSortedTasks(child.id);
        });
    }
    buildSortedTasks(null);

    const { minDate, maxDate } = tasks.reduce(
        (acc, task) => {
            const start = new Date(task.startDate);
            const end = new Date(task.endDate);
            if (!isNaN(start.getTime())) {
                acc.minDate = acc.minDate ? (start < acc.minDate ? start : acc.minDate) : start;
            }
            if (!isNaN(end.getTime())) {
                acc.maxDate = acc.maxDate ? (end > acc.maxDate ? end : acc.maxDate) : end;
            }
            return acc;
        },
        { minDate: null as Date | null, maxDate: null as Date | null }
    );

    if (!minDate || !maxDate) {
        return <div className="text-center p-8 text-gray-500">Tasks have invalid dates.</div>;
    }
    
    minDate.setDate(minDate.getDate() - 2); // Add some padding
    maxDate.setDate(maxDate.getDate() + 2);

    const totalDays = getDaysBetween(minDate, maxDate) + 1;
    const dateArray = Array.from({ length: totalDays }, (_, i) => {
        const date = new Date(minDate);
        date.setDate(minDate.getDate() + i);
        return date;
    });

    const months: { name: string; year: number, days: number }[] = [];
    dateArray.forEach(date => {
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const lastMonth = months[months.length - 1];
        if (!lastMonth || lastMonth.name !== monthName || lastMonth.year !== year) {
            months.push({ name: monthName, year, days: 1 });
        } else {
            lastMonth.days++;
        }
    });

    return (
        <div className="overflow-x-auto relative">
            <div className="grid" style={{ gridTemplateColumns: `minmax(250px, 1fr) repeat(${totalDays}, minmax(30px, 1fr))` }}>
                {/* Headers */}
                <div className="sticky left-0 z-10 bg-gray-100 border-r border-b border-gray-300 p-2 font-semibold text-sm">Task Name</div>
                {months.map((month, i) => (
                    <div key={`${month.name}-${month.year}`} className="text-center border-b border-r border-gray-300 p-1 text-xs font-bold" style={{ gridColumn: `span ${month.days}` }}>
                        {month.name} '{String(month.year).slice(-2)}
                    </div>
                ))}
                
                <div className="sticky left-0 z-10 bg-gray-100 border-r border-b-2 border-gray-300"></div>
                {dateArray.map((date, i) => (
                    <div key={i} className={`text-center border-b-2 border-r border-gray-300 p-1 text-xs ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-100' : ''}`}>
                        {date.getDate()}
                    </div>
                ))}
                
                {/* Task Rows */}
                {sortedTasks.map((task, index) => {
                    const startDate = new Date(task.startDate);
                    const endDate = new Date(task.endDate);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) return null;

                    const startDayIndex = getDaysBetween(minDate, startDate) + 1;
                    const duration = getDaysBetween(startDate, endDate) + 1;
                    const level = task.id.split('.').length - 1;
                    const overallProgress = getTaskOverallProgress(task);

                    return (
                        <React.Fragment key={task.id}>
                            <div className="sticky left-0 z-10 bg-white border-r border-b border-gray-200 p-2 text-sm truncate" style={{ paddingLeft: `${1 + level * 1.5}rem` }}>
                                {task.name}
                            </div>
                            <div className="border-b border-r border-gray-200 relative" style={{ gridColumn: `${startDayIndex + 1} / span ${duration}` }}>
                                <div className="absolute inset-0 flex items-center pr-2">
                                     <div className="h-5 w-full bg-indigo-200 rounded">
                                        <div className="h-full bg-indigo-500 rounded" style={{ width: `${overallProgress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                             {/* Empty cells to fill the rest of the row */}
                             <div className="border-b border-gray-200" style={{ gridColumn: `${startDayIndex + duration + 1} / ${totalDays + 2}` }}></div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
