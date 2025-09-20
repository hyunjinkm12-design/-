import React from 'react';
import { Task, Status } from '../types';
import { CircularProgressBar } from './CircularProgressBar';

interface ScheduleSummaryProps {
  tasks: Task[];
  departments: { name: string; weight: number }[];
  baselineDate: string;
}

// Helper function to calculate a single task's weighted overall progress
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
    if (totalWeight === 0) return 0;
    return Math.round(totalWeightedProgress / totalWeight);
};

// Helper function to calculate the entire project's overall progress, weighted by top-level task duration
const calculateProjectOverallProgress = (tasks: Task[], departments: { name: string; weight: number }[]): number => {
    const topLevelTasks = tasks.filter(t => t.parentId === null);
    if (topLevelTasks.length === 0) return 0;
    
    let totalDuration = 0;
    let weightedProgressSum = 0;

    topLevelTasks.forEach(task => {
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.endDate);
        const duration = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) ? (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1 : 0;
        if(duration > 0) {
            totalDuration += duration;
            weightedProgressSum += calculateTaskOverallProgress(task, departments) * duration;
        }
    });

    if (totalDuration === 0) return 0;
    return Math.round(weightedProgressSum / totalDuration);
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
    return Math.round((elapsedDuration / totalDuration) * 100);
};


export const ScheduleSummary: React.FC<ScheduleSummaryProps> = ({ tasks, departments, baselineDate }) => {
    if (tasks.length === 0) {
        return null; // Don't show summary if there are no tasks
    }

    const overallProgress = calculateProjectOverallProgress(tasks, departments);

    const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<Status, number>);

    const delayedTasksCount = tasks.filter(task => {
        const overall = calculateTaskOverallProgress(task, departments);
        const planned = calculatePlannedProgress(task.startDate, task.endDate, baselineDate);
        // A task is delayed if its actual progress is less than its planned progress
        return overall < planned;
    }).length;

    return (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Progress */}
            <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
                <CircularProgressBar progress={overallProgress} size={80} strokeWidth={8} />
                <div className="flex-grow">
                    <div className="text-sm text-gray-500">Overall Progress</div>
                    <div className="text-2xl font-bold text-gray-800">{overallProgress}%</div>
                </div>
            </div>

            {/* Task Status */}
            <div className="bg-white p-4 rounded-lg shadow-md col-span-1 lg:col-span-2">
                 <div className="text-sm text-gray-500 mb-2">Task Status Breakdown</div>
                 <div className="flex justify-around items-center h-full">
                    <div className="text-center px-2">
                        <div className="text-2xl font-bold text-green-600">{statusCounts[Status.Completed] || 0}</div>
                        <div className="text-xs text-gray-500">{Status.Completed}</div>
                    </div>
                     <div className="text-center px-2">
                        <div className="text-2xl font-bold text-blue-600">{statusCounts[Status.InProgress] || 0}</div>
                        <div className="text-xs text-gray-500">{Status.InProgress}</div>
                    </div>
                     <div className="text-center px-2">
                        <div className="text-2xl font-bold text-gray-500">{statusCounts[Status.NotStarted] || 0}</div>
                        <div className="text-xs text-gray-500">{Status.NotStarted}</div>
                    </div>
                    <div className="text-center px-2">
                        <div className="text-2xl font-bold text-yellow-500">{statusCounts[Status.OnHold] || 0}</div>
                        <div className="text-xs text-gray-500">{Status.OnHold}</div>
                    </div>
                 </div>
            </div>

            {/* Delayed Tasks */}
            <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
                 <div className="flex-shrink-0 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-red-600">{delayedTasksCount}</span>
                 </div>
                 <div className="flex-grow">
                     <div className="text-sm text-gray-500">Delayed Tasks</div>
                     <div className={`text-xl font-bold ${delayedTasksCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {delayedTasksCount > 0 ? 'Action Required' : 'On Track'}
                     </div>
                 </div>
            </div>
        </div>
    );
};