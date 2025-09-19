import React, { useState } from 'react';
import { TeamMember } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DragHandleIcon } from './icons/DragHandleIcon';

interface EditableFieldProps {
    value: string;
    onSave: (newValue: string) => void;
    className: string;
    placeholder: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, onSave, className, placeholder }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [text, setText] = React.useState(value);
    
    const handleSave = () => {
        if (text.trim() || value) { // Allow saving empty strings to clear a field
             onSave(text.trim());
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className={`${className} bg-white border border-indigo-400 rounded px-1 -my-0.5 w-full`}
                autoFocus
            />
        );
    }
    return <div onClick={() => setIsEditing(true)} className={`${className} cursor-pointer w-full`}>{value || <span className="text-gray-400">{placeholder}</span>}</div>;
};


interface TeamMemberNodeProps {
    member: TeamMember;
    allMembers: TeamMember[];
    onUpdate: (updatedMember: TeamMember) => void;
    onAdd: (parentId: string) => void;
    onDelete: (memberId: string) => void;
    onMove: (draggedId: string, targetId: string) => void;
}

const TeamMemberNode: React.FC<TeamMemberNodeProps> = ({ member, allMembers, onUpdate, onAdd, onDelete, onMove }) => {
    const children = allMembers.filter(m => m.parentId === member.id);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ memberId: member.id }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const draggedId = data.memberId;
        onMove(draggedId, member.id);
    };

    return (
        <div className="flex flex-col items-center">
            <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                className={`bg-white border-2 rounded-lg p-3 shadow-md w-64 transition-all duration-200 ${isDragOver ? 'border-blue-500 scale-105 shadow-xl' : 'border-indigo-500'}`}
            >
                <div className="flex items-start gap-2">
                    <div 
                        draggable
                        onDragStart={handleDragStart}
                        className="cursor-move text-gray-400 hover:text-gray-800 pt-1"
                        aria-label="Drag to move member"
                    >
                        <DragHandleIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-grow text-center">
                        <EditableField 
                            value={member.name}
                            onSave={newName => onUpdate({ ...member, name: newName })}
                            className="font-bold text-gray-800"
                            placeholder="Member Name"
                        />
                        <EditableField 
                            value={member.role}
                            onSave={newRole => onUpdate({ ...member, role: newRole })}
                            className="text-sm text-gray-500"
                            placeholder="Member Role"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <button onClick={() => onAdd(member.id)} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-full" title="Add subordinate"><PlusIcon className="w-4 h-4"/></button>
                        <button onClick={() => onDelete(member.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full" title="Delete member"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            </div>

            {children.length > 0 && (
                <div className="flex pt-12 relative">
                    {/* Vertical line from parent to horizontal connector */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-12 w-px bg-gray-400"></div>

                    {children.map((child, index) => (
                        <div key={child.id} className="px-4 relative">
                            {/* Vertical line from child up to horizontal connector */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 h-12 w-px bg-gray-400"></div>
                            {/* Horizontal connector line */}
                            <div className="absolute bottom-full h-px bg-gray-400" style={{
                                left: index === 0 ? '50%' : '0%',
                                right: index === children.length - 1 ? '50%' : '0%'
                            }}></div>
                            <TeamMemberNode 
                                member={child} 
                                allMembers={allMembers}
                                onUpdate={onUpdate}
                                onAdd={onAdd}
                                onDelete={onDelete}
                                onMove={onMove}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


interface OrgChartProps {
    team: TeamMember[];
    onUpdateTeam: (newTeam: TeamMember[]) => void;
}

export const OrgChart: React.FC<OrgChartProps> = ({ team, onUpdateTeam }) => {

    const handleAddMember = (parentId: string | null) => {
        const newMember: TeamMember = {
            id: `tm-${Date.now()}`,
            parentId,
            name: 'New Member',
            role: 'New Role'
        };
        onUpdateTeam([...team, newMember]);
    };

    const handleUpdateMember = (updatedMember: TeamMember) => {
        onUpdateTeam(team.map(m => m.id === updatedMember.id ? updatedMember : m));
    };

    const handleDeleteMember = (memberId: string) => {
        const idsToDelete = new Set<string>();
        const findDescendants = (id: string) => {
            idsToDelete.add(id);
            team.forEach(m => { if (m.parentId === id) findDescendants(m.id); });
        };
        findDescendants(memberId);
        onUpdateTeam(team.filter(m => !idsToDelete.has(m.id)));
    };

    const handleMoveMember = (draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;

        let currentParentId: string | null = targetId;
        while(currentParentId) {
            if (currentParentId === draggedId) {
                alert("Cannot move a member into its own descendant.");
                return;
            }
            const parent = team.find(m => m.id === currentParentId);
            currentParentId = parent ? parent.parentId : null;
        }

        const newTeam = team.map(m =>
            m.id === draggedId ? { ...m, parentId: targetId } : m
        );
        onUpdateTeam(newTeam);
    };
    
    const rootMembers = team.filter(m => m.parentId === null);

    return (
        <div className="p-4 bg-gray-50 rounded-lg overflow-x-auto">
            <div className="inline-block min-w-full text-center py-8">
                {rootMembers.length > 0 ? rootMembers.map(member => (
                    <TeamMemberNode
                        key={member.id}
                        member={member}
                        allMembers={team}
                        onUpdate={handleUpdateMember}
                        onAdd={handleAddMember}
                        onDelete={handleDeleteMember}
                        onMove={handleMoveMember}
                    />
                )) : (
                     <p className="text-gray-500">No team members yet. Add a root member to start building the chart.</p>
                )}
                 <div className="mt-8">
                    <button
                        onClick={() => handleAddMember(null)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-500"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Root Member
                    </button>
                </div>
            </div>
        </div>
    );
};