export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskCategory = 'study' | 'coding' | 'project' | 'revision' | 'personal' | 'learning';
export type TaskRecurrence = 'none' | 'daily' | 'weekly';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  recurrence?: TaskRecurrence;
  estimatedMinutes: number;
  actualMinutes?: number;
  projectId?: string;
  goalId?: string;
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  targetDate: string;
  progress: number; // 0 to 100
  status: 'not_started' | 'in_progress' | 'achieved';
  milestones: GoalMilestone[];
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  targetDaysPerWeek: number;
  streak: number;
  bestStreak: number;
  completedDates: string[]; // YYYY-MM-DD
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'planning' | 'completed' | 'on_hold';
  deadline: string;
  color: string;
  tags: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  pinned?: boolean;
  tags: string[];
}

export interface LearningTopic {
  id: string;
  subject: string;
  topic: string;
  confidence: number; // 1-5
  nextReviewDate: string;
  leitnerBox: number; // 1-5
  notesSnippet: string;
}

export interface AIPlanTask {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  category: TaskCategory;
  dueDateOffsetDays: number;
  subtasks: string[];
}

export interface AIPlanPhase {
  name: string;
  description: string;
  tasks: AIPlanTask[];
}

export interface AIPlan {
  title: string;
  summary: string;
  totalEstimatedHours: number;
  timeframeDays: number;
  dailyFocusHours: number;
  phases: AIPlanPhase[];
  recommendations: string[];
  isAIGenerated: boolean;
  notice?: string;
}

export interface UserProfile {
  name: string;
  title: string;
  email: string;
  university: string;
  dailyTargetFocusMinutes: number;
  dayStartTime: string;
  dayEndTime: string;
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
}
