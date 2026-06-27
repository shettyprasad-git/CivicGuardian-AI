import { User } from 'firebase/auth';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'Reported' | 'AI Verified' | 'Community Verified' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface Locality {
  area: string;
  city: string;
  state: string;
  country: string;
  formatted: string;
}

export interface Report {
  id: string;
  reportId?: string; // e.g. CG-2026-0001
  userId: string;
  userName: string;
  userPhoto?: string;
  category: string;
  severity: Severity;
  status: IssueStatus;
  suggestedDepartment: string;
  suggestedPriority: string;
  summary: string;
  description: string;
  impact: string;
  action: string;
  location: { lat: number; lng: number };
  locality?: Locality;
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  votes: number;
  upvotedBy?: string[]; // Array of user/device IDs
  aiConfidence?: number;
  priorityScore?: number;
  reasoning?: string;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: number;
}

export interface Vote {
  id: string;
  reportId: string;
  userId: string;
  type: 'upvote' | 'downvote';
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  role: 'citizen' | 'admin';
  score: number;
}
