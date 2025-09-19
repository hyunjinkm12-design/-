import React from 'react';
import { Project, Task } from '../types';
import { CircularProgressBar } from './CircularProgressBar';
import { ProgressBar } from './ProgressBar';
import { GanttChart } from './GanttChart';

interface DashboardGanttViewProps {
  project: Project;
}

const calculateOverallProgress = (tasks: Task[], departments: { name: string; weight: number }[]): number => {
    const topLevelTasks = tasks.filter(t => t.parentId === null);
    if (topLevelTasks.length === 0) return 0;
    
    let totalDuration = 0;
    let weightedProgressSum = 0;

    const departmentWeights = new Map(departments.map(d => [d.name, d.weight]));

    const getTaskOverallProgress = (task: Task): number => {
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
    }
    
    topLevelTasks.forEach(task => {
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.endDate);
        const duration = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) ? (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1 : 0;
        if(duration > 0) {
            totalDuration += duration;
            weightedProgressSum += getTaskOverallProgress(task) * duration;
        }
    });

    if (totalDuration === 0) return 0;
    return Math.round(weightedProgressSum / totalDuration);
};


export const DashboardGanttView: React.FC<DashboardGanttViewProps> = ({ project }) => {
    const { tasks, departments } = project;
    const overallProgress = calculateOverallProgress(tasks, departments);
    const topLevelTasks = tasks.filter(t => t.parentId === null);

    const getTaskOverallProgress = (task: Task): number => {
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
    }

  return (
    <div className="space-y-8">
      {/* Dashboard Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Project Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md col-span-1 flex flex-col items-center justify-center">
             <h3 className="text-lg font-medium text-gray-600 mb-4">Overall Project Progress</h3>
             <CircularProgressBar progress={overallProgress} size={150} strokeWidth={12} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Phase Progress</h3>
            <div className="space-y-4">
                {topLevelTasks.map(task => (
                    <div key={task.id}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-800">{task.name}</span>
                            <span className="text-sm font-mono text-gray-500">{getTaskOverallProgress(task)}%</span>
                        </div>
                        <ProgressBar progress={getTaskOverallProgress(task)} />
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Gantt Chart</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-200 rounded mr-2 border border-indigo-300"></div>
                <span>Scheduled Duration</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-500 rounded mr-2"></div>
                <span>Actual Progress</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <GanttChart tasks={tasks} />
        </div>
      </div>
    </div>
  );
};