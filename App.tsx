import React, { useState, useCallback, useEffect } from 'react';
import { Project, User, Task, Deliverable } from './types';
import { ProjectListView } from './components/ProjectListView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { LoginView } from './components/LoginView';
import { auth, db } from './firebase';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({ 
                    uid: firebaseUser.uid, 
                    email: firebaseUser.email!, 
                    displayName: firebaseUser.displayName 
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) {
            setProjects([]);
            return;
        }

        const projectsRef = ref(db, `projects/${user.uid}`);
        const unsubscribeDb = onValue(projectsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedProjects = Object.values(data).map((proj: any) => {
                    const sanitizedTasks = (proj.tasks || []).map((task: any) => ({
                        ...task,
                        parentId: task.parentId || null,
                        departmentProgress: task.departmentProgress || {},
                        deliverables: (task.deliverables || []).map((del: any) => ({
                            ...del,
                            versions: del.versions || [],
                        })),
                        isExpanded: task.isExpanded === undefined ? false : task.isExpanded,
                    }));
    
                    return {
                        ...proj,
                        startDate: proj.startDate || new Date().toISOString().split('T')[0],
                        endDate: proj.endDate || new Date().toISOString().split('T')[0],
                        tasks: sanitizedTasks,
                        departments: proj.departments || [{ name: 'General', weight: 1 }],
                        team: proj.team || [],
                        charter: proj.charter || { background: '', scope: '', stakeholders: '', budget: '', milestones: '', risks: '' },
                    };
                });
                setProjects(loadedProjects as Project[]);
            } else {
                setProjects([]);
            }
        });

        return () => unsubscribeDb();
    }, [user]);
    
    const handleAddProject = useCallback(async (name: string, description: string, startDate: string, endDate: string, type: string, goal: string) => {
        if (!user) return;
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            description,
            startDate,
            endDate,
            type,
            goal,
            tasks: [],
            departments: [{ name: 'General', weight: 1 }],
            charter: { background: '', scope: '', stakeholders: '', budget: '', milestones: '', risks: '' },
            team: [],
        };
        const projectRef = ref(db, `projects/${user.uid}/${newProject.id}`);
        await set(projectRef, newProject);
    }, [user]);

    const handleDeleteProject = useCallback(async (projectId: string) => {
        if (!user) return;
        const projectRef = ref(db, `projects/${user.uid}/${projectId}`);
        await remove(projectRef);
    }, [user]);

    const handleSelectProject = useCallback((projectId: string) => {
        setSelectedProjectId(projectId);
    }, []);

    const handleGoBackToProjects = useCallback(() => {
        setSelectedProjectId(null);
    }, []);

    const handleUpdateProject = useCallback(async (updatedProject: Project) => {
        if (!user) return;
        const projectRef = ref(db, `projects/${user.uid}/${updatedProject.id}`);
        await set(projectRef, updatedProject);
    }, [user]);

    const handleLogin = useCallback(async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    }, []);
    
    const handleSignUp = useCallback(async (email: string, password: string, displayName: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        // Manually update the user state so the UI refreshes immediately with the new name
        setUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email!,
            displayName: userCredential.user.displayName
        });
    }, []);

    const handleLogout = useCallback(async () => {
        await signOut(auth);
        setSelectedProjectId(null);
    }, []);

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <LoginView onLogin={handleLogin} onSignUp={handleSignUp} />;
    }
    
    if (selectedProject) {
        return <ProjectDetailView 
                    project={selectedProject} 
                    user={user}
                    onGoBack={handleGoBackToProjects} 
                    onUpdateProject={handleUpdateProject}
                    onLogout={handleLogout}
                />
    }

    return (
        <ProjectListView 
            projects={projects}
            user={user}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onSelectProject={handleSelectProject}
            onLogout={handleLogout}
            onUpdateProject={handleUpdateProject}
        />
    );
};

export default App;