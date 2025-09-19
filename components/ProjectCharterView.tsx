import React, { useState, useCallback } from 'react';
import { Project, ProjectCharter, TeamMember } from '../types';
import { OrgChart } from './OrgChart';

interface ProjectCharterViewProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
}

const CharterField: React.FC<{ label: string; value: string; name: keyof ProjectCharter; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }> = ({ label, value, name, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={4}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
    </div>
);

export const ProjectCharterView: React.FC<ProjectCharterViewProps> = ({ project, onUpdateProject }) => {
    const [charter, setCharter] = useState<ProjectCharter>(project.charter);
    const [team, setTeam] = useState<TeamMember[]>(project.team);

    const handleCharterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCharter(prev => ({ ...prev, [name]: value }));
    };
    
    const handleTeamUpdate = useCallback((newTeam: TeamMember[]) => {
        setTeam(newTeam);
    }, []);

    const handleSaveChanges = () => {
        onUpdateProject({ ...project, charter, team });
        alert('Project Charter saved successfully!');
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Project Charter Details</h2>
                    <button
                        onClick={handleSaveChanges}
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500"
                    >
                        Save Changes
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CharterField label="프로젝트 배경/목적 (Background/Purpose)" name="background" value={charter.background} onChange={handleCharterChange} />
                    <CharterField label="프로젝트 범위 (Scope)" name="scope" value={charter.scope} onChange={handleCharterChange} />
                    <CharterField label="주요 이해관계자 (Key Stakeholders)" name="stakeholders" value={charter.stakeholders} onChange={handleCharterChange} />
                    <CharterField label="예산 및 자원 (Budget & Resources)" name="budget" value={charter.budget} onChange={handleCharterChange} />
                    <CharterField label="주요 일정 (Key Milestones)" name="milestones" value={charter.milestones} onChange={handleCharterChange} />
                    <CharterField label="주요 리스크 정의 (Key Risks)" name="risks" value={charter.risks} onChange={handleCharterChange} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Team & Roles (Organization Chart)</h2>
                <OrgChart team={team} onUpdateTeam={handleTeamUpdate} />
            </div>
        </div>
    );
};