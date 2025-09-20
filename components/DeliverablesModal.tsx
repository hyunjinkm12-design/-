import React, { useState, useEffect, useRef } from 'react';
import { Task, Deliverable, DeliverableVersion } from '../types';
import { XCircleIcon } from './icons/XCircleIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';

interface DeliverablesModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const DeliverablesModal: React.FC<DeliverablesModalProps> = ({ task, onClose, onSave }) => {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDeliverableId, setActiveDeliverableId] = useState<string | null>(null);
  
  useEffect(() => {
    setDeliverables(JSON.parse(JSON.stringify(task.deliverables))); // Deep copy
  }, [task]);

  const handleSave = () => {
    onSave({ ...task, deliverables });
  };
  
  const handleAddDeliverable = () => {
    // This will now be used to trigger an upload for a *new* deliverable.
    // We clear the activeDeliverableId to signal this.
    setActiveDeliverableId(null);
    fileInputRef.current?.click();
  };

  const handleDeleteDeliverable = (deliverableId: string) => {
    if (window.confirm("Are you sure you want to delete this deliverable and all its versions?")) {
      setDeliverables(prev => prev.filter(d => d.id !== deliverableId));
    }
  };

  const handleAddVersionClick = (deliverableId: string) => {
    setActiveDeliverableId(deliverableId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const files = Array.from(event.target.files);
    
    // Case 1: We are adding a new version to an existing deliverable
    if (activeDeliverableId) {
        const deliverableToUpdate = deliverables.find(d => d.id === activeDeliverableId);
        if (!deliverableToUpdate) return;
        
        let lastVersionNumber = deliverableToUpdate.versions.reduce((max, v) => Math.max(max, v.version), 0);
        
        const filePromises = files.map(file => {
          return new Promise<DeliverableVersion>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              lastVersionNumber++;
              resolve({
                version: lastVersionNumber,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                uploadDate: new Date().toISOString(),
                base64Content: reader.result as string,
              });
            };
            reader.onerror = error => reject(error);
          });
        });

        try {
            const newVersions = await Promise.all(filePromises);
            setDeliverables(prev =>
                prev.map(d =>
                    d.id === activeDeliverableId
                        ? { ...d, versions: [...d.versions, ...newVersions] }
                        : d
                )
            );
        } catch (error) {
            console.error("Error reading files:", error);
            alert("There was an error processing the files.");
        }

    // Case 2: We are creating brand new deliverables from the uploaded files
    } else {
        const newDeliverablePromises = files.map(file => {
            return new Promise<Deliverable>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const newDeliverable: Deliverable = {
                        id: `${Date.now()}-${file.name}`,
                        name: file.name.split('.').slice(0, -1).join('.') || file.name,
                        versions: [{
                            version: 1,
                            fileName: file.name,
                            fileType: file.type,
                            fileSize: file.size,
                            uploadDate: new Date().toISOString(),
                            base64Content: reader.result as string,
                        }]
                    };
                    resolve(newDeliverable);
                };
                reader.onerror = error => reject(error);
            });
        });
        
        try {
            const newDeliverables = await Promise.all(newDeliverablePromises);
            setDeliverables(prev => [...prev, ...newDeliverables]);
        } catch (error) {
            console.error("Error creating new deliverables:", error);
            alert("There was an error processing the new files.");
        }
    }

    // Reset for next operation
    setActiveDeliverableId(null);
    event.target.value = '';
  };

  const handleDeleteVersion = (deliverableId: string, version: number) => {
     if (window.confirm("Are you sure you want to delete this file version?")) {
        setDeliverables(prev =>
            prev.map(d =>
                d.id === deliverableId
                    ? { ...d, versions: d.versions.filter(v => v.version !== version) }
                    : d
            )
        );
     }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Deliverables Management</h2>
            <p className="text-sm text-gray-500">Task: {task.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="flex justify-end mb-4">
            <button onClick={handleAddDeliverable} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500">
              <PlusIcon className="w-4 h-4" />
              Add Deliverable
            </button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="space-y-6">
            {deliverables.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">No deliverables yet.</p>
                    <p className="text-sm text-gray-400">Click 'Add Deliverable' to get started.</p>
                </div>
            ) : deliverables.map(deliverable => (
              <div key={deliverable.id} className="bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">{deliverable.name}</h3>
                  <div className="flex items-center gap-2">
                     <button onClick={() => handleAddVersionClick(deliverable.id)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500">
                        <UploadIcon className="w-3 h-3" />
                        Add Version
                    </button>
                    <button onClick={() => handleDeleteDeliverable(deliverable.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  {deliverable.versions.length > 0 ? (
                    <table className="w-full text-sm text-left">
                       <thead className="text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="p-2 w-16">Ver.</th>
                            <th className="p-2">File Name</th>
                            <th className="p-2 w-32">Size</th>
                            <th className="p-2 w-48">Date Uploaded</th>
                            <th className="p-2 w-16 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliverable.versions.sort((a,b) => b.version - a.version).map(version => (
                            <tr key={version.version} className="border-t border-gray-200 hover:bg-gray-100">
                                <td className="p-2 font-mono">v{version.version}</td>
                                <td className="p-2 text-blue-600 font-medium">
                                  <a href={version.base64Content} download={version.fileName} className="hover:underline" title={`Download ${version.fileName}`}>
                                    {version.fileName}
                                  </a>
                                </td>
                                <td className="p-2">{formatBytes(version.fileSize)}</td>
                                <td className="p-2">{new Date(version.uploadDate).toLocaleString()}</td>
                                <td className="p-2 text-center">
                                    <button onClick={() => handleDeleteVersion(deliverable.id, version.version)} className="p-1 text-gray-400 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-xs text-gray-500 py-4">No files uploaded for this deliverable yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 sm:px-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};