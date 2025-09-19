export enum Status {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Completed = 'Completed',
  OnHold = 'On Hold',
}

export interface DeliverableVersion {
  version: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  base64Content: string;
}

export interface Deliverable {
  id: string;
  name: string;
  versions: DeliverableVersion[];
}

export interface Task {
  id: string;
  parentId: string | null;
  name:string;
  deliverableName: string;
  startDate: string;
  endDate: string;
  assignee: string;
  deliverables: Deliverable[];
  status: Status;
  plannedProgress: number;
  departmentProgress: { [key: string]: number };
  notes: string;
  isExpanded?: boolean;
}

export interface ProjectCharter {
  background: string;
  scope: string;
  stakeholders: string;
  budget: string;
  milestones: string;
  risks: string;
}

export interface TeamMember {
  id: string;
  parentId: string | null;
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  period: string;
  type: string;
  goal: string;
  tasks: Task[];
  departments: { name: string; weight: number }[];
  charter: ProjectCharter;
  team: TeamMember[];
}

export interface User {
  username: string;
}
