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

export type EducationLevel =
  | 'school'
  | 'college'
  | 'engineering'
  | 'medical_health'
  | 'nursing'
  | 'diploma'
  | 'competitive';

export interface NotificationPreferences {
  enabled: boolean;
  leadMinutes: number;
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string; // HH:MM
  dailyBriefingTime: string; // HH:MM
  browserAllowed: boolean;
}

export interface UserProfile {
  name: string;
  title: string;
  email: string;
  educationLevel?: EducationLevel;
  boardOrUniversity?: string;
  courseOrClass?: string;
  branchOrStream?: string;
  yearOrSemester?: string;
  currentYearOrSem?: string;
  targetScore?: string;
  studyHours?: {
    start: string;
    end: string;
  };
  // Legacy / fallback compatibility
  university?: string;
  branch?: string;
  course?: string;
  semester?: number;
  targetExam?: string;
  targetExamDate?: string;
  dailyTargetFocusMinutes: number;
  dayStartTime: string;
  dayEndTime: string;
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
  preferredLanguage?: 'en' | 'hi' | 'hinglish' | 'english' | 'hindi';
  preferredResponseLanguage?: 'en' | 'hi' | 'hinglish';
  themeMode?: 'light' | 'dark';
  showPlacementModule?: boolean;
  timeFormat?: '12h';
  notificationPreferences?: NotificationPreferences;
}

// ==========================================
// STUDENT SUCCESS PLATFORM MODULE TYPES
// ==========================================

// MODULE 1: Customized Syllabus & Notes Input
export interface SyllabusUnit {
  id: string;
  unitNumber: number;
  title: string;
  topics: string[];
  notesText?: string;
  uploadedFiles?: {
    name: string;
    size: number;
    uploadedAt: string;
  }[];
}

export interface StudentSubject {
  id: string;
  code?: string;
  name: string;
  educationLevel?: EducationLevel;
  courseOrClass?: string;
  branchOrStream?: string;
  yearOrSemester?: string | number;
  branch?: string;
  semester?: number | string;
  university?: string;
  boardOrUniversity?: string;
  board?: string;
  gradeOrClass?: string;
  academicYear?: string;
  teacherName?: string;
  subjectGroup?: string;
  units: SyllabusUnit[];
  examDate?: string;
  targetMarks?: number;
}

export interface SyllabusExtractionResult {
  topics: string[];
  units: {
    unitNumber: number;
    title: string;
    topics: string[];
  }[];
  importantFocusAreas: string[];
  summary: string;
  extractedTextPreview?: string;
  isFallback?: boolean;
  providerStatus?: 'live_ai' | 'local_fallback' | 'quota_exhausted' | 'unconfigured' | string;
  notice?: string;
}

// MODULE 2: Smart Star-Rating Question Bank
export type StarRating = 0 | 1 | 2 | 3;

export type QuestionSourceCategory =
  | 'verified_pyq'
  | 'source_backed_repeated'
  | 'source_repeated'
  | 'ai_practice'
  | 'teacher_provided'
  | 'student_saved';

export type QuestionKind =
  | 'theory'
  | 'important'
  | 'revision'
  | 'numerical'
  | 'mcq'
  | 'short_note'
  | 'long_answer'
  | 'programming';

export interface QuestionItem {
  id: string;
  subjectId: string;
  subjectName: string;
  unit: number;
  chapterOrUnitName?: string;
  question: string;
  expectedMarks: 2 | 5 | 8 | 10 | 16;
  stars: StarRating;
  isVerifiedPYQ: boolean;
  sourceCategory?: QuestionSourceCategory;
  questionKind?: QuestionKind;
  sourcePapers?: string[];
  repetitionCount: number;
  modelAnswer?: string;
  markingPoints?: string[];
  mcqOptions?: string[];
  correctAnswer?: string;
  keyTopics: string[];
  bookmarked?: boolean;
  revisionStatus?: 'not_revised' | 'needs_practice' | 'mastered';
  createdAt: string;
  isFallback?: boolean;
  providerStatus?: string;
  notice?: string;
}

export interface StudyFromSyllabusParams {
  educationLevel?: EducationLevel;
  boardOrUniversity?: string;
  courseOrClass?: string;
  subjectName: string;
  unitNumber?: number;
  selectedTopics: string[];
  questionType: 'all' | 'important' | 'revision' | 'mcq' | 'short_note' | 'long_answer' | 'programming' | 'numerical' | 'theory';
  expectedMarks: 2 | 5 | 8 | 10 | 16;
  difficulty?: 'beginner' | 'intermediate' | 'exam_ready';
  outputLanguage?: 'en' | 'hi' | 'hinglish';
  count?: number;
}

// IN-APP & BROWSER NOTIFICATIONS
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'exam_countdown' | 'study_session' | 'deadline' | 'daily_briefing' | 'task_reminder' | 'system';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  scheduledFor?: string;
}

// MODULE 3: Day-Wise Crash Study Planner
export type StudyTaskType = 'study' | 'revision' | 'practice_questions' | 'mock_test';

export interface CrashStudyTask {
  id: string;
  dayNumber: number;
  date: string;
  topic: string;
  unit: number;
  durationMinutes: number;
  type: StudyTaskType;
  completed: boolean;
  missed: boolean;
  completedAt?: string;
}

export interface CrashStudyDay {
  dayNumber: number;
  date: string;
  theme: string;
  tasks: CrashStudyTask[];
  targetMinutes: number;
}

export interface CrashStudyPlan {
  id: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  daysRemaining: number;
  totalDays?: number;
  dailyHours: number;
  days: CrashStudyDay[];
  createdAt: string;
  updatedAt: string;
}

// MODULE 4: Multimodal Test & Copy Checking
export type TestEvaluationMode = 'handwritten' | 'viva' | 'typed';

export interface StepEvaluationItem {
  stepNumber: number;
  stepDescription: string;
  status: 'correct' | 'partial' | 'incorrect';
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
}

export interface TestAttemptRecord {
  id: string;
  mode: TestEvaluationMode;
  subjectName: string;
  unit?: number;
  question: string;
  studentAnswer: string;
  answerImageUrl?: string;
  maxMarks: number;
  marksObtained: number;
  percentage: number;
  stepEvaluation: StepEvaluationItem[];
  strengths: string[];
  mistakes: string[];
  explanation: string;
  handwritingConfidence?: number;
  unclearHandwritingPrompt?: string;
  evaluatedAt: string;
  isFallback?: boolean;
  isEstimatedScore?: boolean;
  providerStatus?: string;
  notice?: string;
}

// MODULE 5: Branch and Domain-Specific Mock Interview
export type EngineeringBranch =
  | 'B.Tech CSE'
  | 'AI / ML & Data Science'
  | 'ECE'
  | 'Embedded Systems & VLSI'
  | 'Mechanical Engineering'
  | 'IT & Software Development';

export type InterviewRoundType =
  | 'fundamentals'
  | 'technical_logical'
  | 'coding_design'
  | 'real_world_problem';

export interface InterviewMessage {
  id: string;
  sender: 'ai' | 'student';
  text: string;
  timestamp: string;
  round: InterviewRoundType;
  turnIndex: number;
}

export interface InterviewReport {
  id: string;
  branch: EngineeringBranch;
  domain: string;
  difficulty: 'Entry-Level / Fresher' | 'Intermediate' | 'Core Engineering High-Difficulty';
  messages: InterviewMessage[];
  overallTechnicalScore: number;
  overallCommunicationScore: number;
  readinessRating: 'Ready for Placement' | 'Needs Targeted Practice' | 'Foundational Review';
  strengths: string[];
  areasForImprovement: string[];
  practiceRoadmap: string[];
  completedAt: string;
}
