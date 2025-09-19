import React, { useState, useCallback } from 'react';
import { Project, Task, Status } from './types';
import { ProjectListView } from './components/ProjectListView';
import { ProjectDetailView } from './components/ProjectDetailView';

const initialTasksData = [
    {
    id: '1',
    parentId: null,
    name: 'UI/UX Design Phase',
    deliverableName: 'Design System',
    startDate: '2024-07-01',
    endDate: '2024-07-15',
    assignee: 'Alice',
    department: 'Design',
    status: Status.Completed,
    actualProgress: 100,
    plannedProgress: 100,
    notes: 'Initial design phase.',
    isExpanded: true,
  },
  {
    id: '1.1',
    parentId: '1',
    name: 'User Research',
    deliverableName: 'Research Report',
    startDate: '2024-07-01',
    endDate: '2024-07-05',
    assignee: 'Alice',
    department: 'Design',
    status: Status.Completed,
    actualProgress: 100,
    plannedProgress: 100,
    notes: '',
  },
  {
    id: '1.2',
    parentId: '1',
    name: 'Finalize Mockups',
    deliverableName: 'Figma Mockups',
    startDate: '2024-07-06',
    endDate: '2024-07-15',
    assignee: 'Alice',
    department: 'Design',
    status: Status.Completed,
    actualProgress: 100,
    plannedProgress: 100,
    notes: '',
  },
  {
    id: '2',
    parentId: null,
    name: 'Frontend Development',
    deliverableName: 'React Component Library',
    startDate: '2024-07-16',
    endDate: '2024-08-10',
    assignee: 'Bob',
    department: 'Frontend',
    status: Status.InProgress,
    actualProgress: 60,
    plannedProgress: 80,
    notes: 'Implementing React components.',
    isExpanded: true,
  },
  {
    id: '2.1',
    parentId: '2',
    name: 'Component Library Setup',
    deliverableName: 'Storybook Setup',
    startDate: '2024-07-16',
    endDate: '2024-07-25',
    assignee: 'Bob',
    department: 'Frontend',
    status: Status.InProgress,
    actualProgress: 75,
    plannedProgress: 100,
    notes: '',
  },
  {
    id: '3',
    parentId: null,
    name: 'Backend API Integration',
    deliverableName: 'API Documentation',
    startDate: '2024-08-01',
    endDate: '2024-08-20',
    assignee: 'Charlie',
    department: 'Backend',
    status: Status.NotStarted,
    actualProgress: 0,
    plannedProgress: 50,
    notes: 'Connecting to the database.',
  },
];

const initialDepartmentNames = [...new Set(initialTasksData.map(t => t.department))];
const initialDepartments = initialDepartmentNames.map(name => ({ name, weight: 1 }));


const initialTasks: Task[] = initialTasksData.map(taskData => {
  const { department, actualProgress, ...rest } = taskData;

  const departmentProgress = initialDepartmentNames.reduce((acc, depName) => {
    acc[depName] = (depName === department) ? actualProgress : 0;
    return acc;
  }, {} as { [key: string]: number });

  return {
    id: rest.id,
    parentId: rest.parentId,
    name: rest.name,
    deliverableName: rest.deliverableName,
    startDate: rest.startDate,
    endDate: rest.endDate,
    assignee: rest.assignee,
    deliverables: [],
    status: rest.status,
    notes: rest.notes,
    isExpanded: rest.isExpanded,
    departmentProgress,
    plannedProgress: rest.plannedProgress,
  };
});


const initialProjects: Project[] = [
    {
        id: 'proj-1',
        name: 'Website Redesign',
        description: 'Complete overhaul of the main company website and user dashboard.',
        period: 'Q3 2024',
        type: 'Internal R&D',
        goal: 'Increase user engagement by 20%',
        tasks: initialTasks,
        departments: initialDepartments,
        charter: {
            background: 'The current website has an outdated design and a poor user experience, leading to high bounce rates.',
            scope: 'Redesign and redevelop the public-facing website, user dashboard, and component library. Mobile app is out of scope.',
            stakeholders: 'Marketing Dept, Executive Team, Sales Team, End Users.',
            budget: '$150,000 USD',
            milestones: 'Design Finalized: July 15, Frontend Complete: Aug 10, Backend Integration: Aug 20, Launch: Sep 1.',
            risks: 'Potential for scope creep from marketing. Delays in backend API development could block frontend work.',
        },
        team: [
            { id: 'tm-1', parentId: null, name: 'Sarah Chen', role: 'Project Sponsor' },
            { id: 'tm-2', parentId: 'tm-1', name: 'John Doe', role: 'Project Manager' },
            { id: 'tm-3', parentId: 'tm-2', name: 'Alice', role: 'Lead UI/UX Designer' },
            { id: 'tm-4', parentId: 'tm-2', name: 'Bob', role: 'Lead Frontend Dev' },
            { id: 'tm-5', parentId: 'tm-2', name: 'Charlie', role: 'Lead Backend Dev' },
        ],
    },
    {
        id: 'proj-2',
        name: 'Mobile App Launch',
        description: 'Development and launch of the new iOS and Android mobile applications.',
        period: '2024 Full Year',
        type: 'New Product',
        goal: 'Achieve 10,000 downloads in first month',
        tasks: [],
        departments: [{name: 'Mobile', weight: 1}],
        charter: { background: '', scope: '', stakeholders: '', budget: '', milestones: '', risks: '' },
        team: [],
    }
]

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    
    const handleAddProject = useCallback((name: string, description: string, period: string, type: string, goal: string) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            description,
            period,
            type,
            goal,
            tasks: [],
            departments: [{ name: 'General', weight: 1 }],
            charter: { background: '', scope: '', stakeholders: '', budget: '', milestones: '', risks: '' },
            team: [],
        };
        setProjects(prev => [...prev, newProject]);
    }, []);

    const handleDeleteProject = useCallback((projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    }, []);

    const handleSelectProject = useCallback((projectId: string) => {
        setSelectedProjectId(projectId);
    }, []);

    const handleGoBackToProjects = useCallback(() => {
        setSelectedProjectId(null);
    }, []);

    const handleUpdateProject = useCallback((updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }, []);

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    
    if (selectedProject) {
        return <ProjectDetailView 
                    project={selectedProject} 
                    onGoBack={handleGoBackToProjects} 
                    onUpdateProject={handleUpdateProject} 
                />
    }

    return (
        <ProjectListView 
            projects={projects}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onSelectProject={handleSelectProject}
        />
    );
};

export default App;