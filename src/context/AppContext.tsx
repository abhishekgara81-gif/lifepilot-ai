import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Task,
  Goal,
  Habit,
  Project,
  Note,
  LearningTopic,
  UserProfile,
  AIPlan,
  StudentSubject,
  SyllabusUnit,
  QuestionItem,
  CrashStudyPlan,
  CrashStudyTask,
  TestAttemptRecord,
  InterviewReport,
  AppNotification,
  EducationLevel,
} from '../types';
import {
  initialTasks,
  initialGoals,
  initialHabits,
  initialProjects,
  initialNotes,
  initialLearningTopics,
  initialProfile,
  initialSubjects,
  initialQuestions,
  initialCrashPlan,
  initialTestAttempts,
  initialInterviewReports,
  initialNotifications,
  getStarterSubjectsForLevel,
  getRelativeDate,
  dailySpokenEnglishTask,
  syncDailyEnglishTask,
  calculateHabitStreak,
} from '../data/initialData';
import { checkAIHealth } from '../services/aiPlannerService';
import { useAuth } from './AuthContext';
import {
  fetchCloudWorkspace,
  saveCloudWorkspace,
  subscribeToCloudWorkspace,
  mergeWorkspaces,
  type CloudWorkspacePayload,
} from '../services/cloudSyncService';
import { DataMigrationModal } from '../components/modals/DataMigrationModal';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  activePage: string;
  setActivePage: (page: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hasGeminiKey: boolean;

  // Cloud Sync
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'unconfigured';
  lastSyncedAt: Date | null;
  triggerManualSync: () => Promise<void>;
  hasPreSyncBackup: boolean;
  restorePreSyncBackup: () => boolean;
  openMigrationModal: () => void;

  // Task actions
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // Goal actions
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  // Habit actions
  habits: Habit[];
  addHabit: (name: string, category: string, targetDays: number) => void;
  toggleHabitDate: (habitId: string, dateStr: string) => void;
  deleteHabit: (id: string) => void;

  // Project actions
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Note actions
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Learning Topics
  learningTopics: LearningTopic[];
  updateTopicConfidence: (id: string, confidence: number) => void;
  reviewTopic: (id: string) => void;
  addTopic: (topic: Omit<LearningTopic, 'id'>) => void;

  // User Profile
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  switchAcademicLevel: (level: EducationLevel, options?: { loadStarterSubjects?: boolean }) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission>;

  // Theme & Appearance
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // ==========================================
  // STUDENT SUCCESS PLATFORM MODULE ACTIONS
  // ==========================================

  // Module 1: Syllabus & Notes
  subjects: StudentSubject[];
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  addSubject: (subject: Omit<StudentSubject, 'id'>) => StudentSubject;
  updateSubject: (id: string, updates: Partial<StudentSubject>) => void;
  deleteSubject: (id: string) => void;
  addUnitToSubject: (subjectId: string, unit: { unitNumber: number; title: string; topics: string[]; notesText?: string }) => void;

  // Module 2: Question Bank
  questions: QuestionItem[];
  addQuestion: (q: Omit<QuestionItem, 'id' | 'createdAt'>) => QuestionItem;
  deleteQuestion: (id: string) => void;
  toggleBookmarkQuestion: (id: string) => void;
  updateQuestionRevisionStatus: (id: string, status: 'not_revised' | 'needs_practice' | 'mastered') => void;
  addCustomQuestion: (q: Omit<QuestionItem, 'id' | 'createdAt'>) => QuestionItem;

  // Module 3: Crash Study Planner
  crashPlans: CrashStudyPlan[];
  activeCrashPlan: CrashStudyPlan | null;
  saveCrashPlan: (plan: CrashStudyPlan) => void;
  toggleCrashTask: (planId: string, taskId: string) => void;
  rescheduleMissedTasks: (planId: string) => void;

  // Module 4: Multimodal Test Copies
  testAttempts: TestAttemptRecord[];
  saveTestAttempt: (record: TestAttemptRecord) => void;
  deleteTestAttempt: (id: string) => void;

  // Module 5: Mock Interview Reports
  interviewReports: InterviewReport[];
  saveInterviewReport: (report: InterviewReport) => void;
  deleteInterviewReport: (id: string) => void;

  // AI Plan approval & import
  approveAndSavePlan: (plan: AIPlan) => void;

  // Data persistence & export
  exportAllData: () => string;
  importAllData: (jsonStr: string) => boolean;
  resetToSampleData: () => void;
  clearAllData: () => void;

  // Modals state
  taskModalOpen: boolean;
  setTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;

  goalModalOpen: boolean;
  setGoalModalOpen: (open: boolean) => void;
  editingGoal: Goal | null;
  setEditingGoal: (goal: Goal | null) => void;

  projectModalOpen: boolean;
  setProjectModalOpen: (open: boolean) => void;

  noteModalOpen: boolean;
  setNoteModalOpen: (open: boolean) => void;
  editingNote: Note | null;
  setEditingNote: (note: Note | null) => void;

  // Toasts
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TASKS: 'lifepilot_tasks_v1',
  GOALS: 'lifepilot_goals_v1',
  HABITS: 'lifepilot_habits_v1',
  PROJECTS: 'lifepilot_projects_v1',
  NOTES: 'lifepilot_notes_v1',
  TOPICS: 'lifepilot_topics_v1',
  PROFILE: 'lifepilot_profile_v1',
  SIDEBAR: 'lifepilot_sidebar_collapsed',
  PRE_SYNC_BACKUP: 'lifepilot_backup_pre_sync',
  SUBJECTS: 'lifepilot_student_subjects_v1',
  QUESTIONS: 'lifepilot_student_questions_v1',
  CRASH_PLANS: 'lifepilot_student_crash_plans_v1',
  TEST_ATTEMPTS: 'lifepilot_student_test_attempts_v1',
  INTERVIEW_REPORTS: 'lifepilot_student_interview_reports_v1',
  NOTIFICATIONS: 'lifepilot_student_notifications_v1',
  THEME: 'lifepilot_theme_mode',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isConfigured } = useAuth();

  const [activePage, setActivePage] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlPage = new URLSearchParams(window.location.search).get('page');
        if (urlPage) return urlPage;
      }
    } catch {}
    return 'dashboard';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR) === 'true';
    } catch {
      return false;
    }
  });

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);

  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'unconfigured'
  >(() => (isConfigured ? 'idle' : 'unconfigured'));
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [migrationCloudData, setMigrationCloudData] = useState<CloudWorkspacePayload | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [hasPreSyncBackup, setHasPreSyncBackup] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEYS.PRE_SYNC_BACKUP));
    } catch {
      return false;
    }
  });

  const isRemoteUpdateRef = useRef(false);
  const activeUnsubRef = useRef<(() => void) | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Core entities state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) {
        const parsed: Task[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const synced = syncDailyEnglishTask(parsed);
          try {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(synced));
          } catch {
            // ignore
          }
          return synced;
        }
      }
      const initialSynced = syncDailyEnglishTask(initialTasks);
      try {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(initialSynced));
      } catch {
        // ignore
      }
      return initialSynced;
    } catch {
      return syncDailyEnglishTask(initialTasks);
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return initialGoals;
    } catch {
      return initialGoals;
    }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return initialHabits;
    } catch {
      return initialHabits;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return initialProjects;
    } catch {
      return initialProjects;
    }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return initialNotes;
    } catch {
      return initialNotes;
    }
  });

  const [learningTopics, setLearningTopics] = useState<LearningTopic[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return initialLearningTopics;
    } catch {
      return initialLearningTopics;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      }
      return initialProfile;
    } catch {
      return initialProfile;
    }
  });

  // ==========================================
  // STUDENT SUCCESS PLATFORM MODULE STATES
  // ==========================================

  // Module 1: Customized Syllabus & Notes
  const [subjects, setSubjects] = useState<StudentSubject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialSubjects;
    } catch {
      return initialSubjects;
    }
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return initialSubjects[0]?.id || '';
  });

  // Module 2: Smart Star-Rating Question Bank
  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialQuestions;
    } catch {
      return initialQuestions;
    }
  });

  // Module 3: Day-Wise Crash Study Planner
  const [crashPlans, setCrashPlans] = useState<CrashStudyPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CRASH_PLANS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [initialCrashPlan];
    } catch {
      return [initialCrashPlan];
    }
  });

  const activeCrashPlan = crashPlans.find((cp) => cp.subjectId === selectedSubjectId) || crashPlans[0] || null;

  // Module 4: Multimodal Test Copies
  const [testAttempts, setTestAttempts] = useState<TestAttemptRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEST_ATTEMPTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialTestAttempts;
    } catch {
      return initialTestAttempts;
    }
  });

  // Module 5: Mock Interview Reports
  const [interviewReports, setInterviewReports] = useState<InterviewReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERVIEW_REPORTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialInterviewReports;
    } catch {
      return initialInterviewReports;
    }
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlTheme = new URLSearchParams(window.location.search).get('theme');
        if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme;
      }
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    } catch {
      return 'light';
    }
  });

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [goalModalOpen, setGoalModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState<boolean>(false);

  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Toasts notification stack
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check backend Gemini status on mount
  useEffect(() => {
    checkAIHealth().then((res) => {
      setHasGeminiKey(res.hasGeminiKey);
    });
  }, []);

  // Online / offline network detection
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setSyncStatus('idle');
        // Synchronize pending local edits once internet connectivity is restored
        saveCloudWorkspace(user.uid, {
          tasks,
          goals,
          habits,
          projects,
          notes,
          learningTopics,
          userProfile,
        })
          .then(() => {
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          })
          .catch((err) => {
            console.warn('Post-reconnection sync failed:', err);
          });
      }
    };
    const handleOffline = () => {
      if (user) {
        setSyncStatus('offline');
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, tasks, goals, habits, projects, notes, learningTopics, userProfile]);

  // Save changes to localStorage immediately
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(learningTopics));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [learningTopics]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR, String(sidebarCollapsed));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [sidebarCollapsed]);

  // Persist Student Platform Modules
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CRASH_PLANS, JSON.stringify(crashPlans));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [crashPlans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEST_ATTEMPTS, JSON.stringify(testAttempts));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [testAttempts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INTERVIEW_REPORTS, JSON.stringify(interviewReports));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [interviewReports]);

  // Persist Notifications & Theme
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (e) {
      console.warn('Theme save failed:', e);
    }
  }, [theme]);

  // Apply cloud data to local state
  const applyCloudWorkspace = (
    data: Omit<CloudWorkspacePayload, 'updatedAt' | 'deviceId'> &
      Partial<Pick<CloudWorkspacePayload, 'updatedAt' | 'deviceId'>>
  ) => {
    isRemoteUpdateRef.current = true;
    if (Array.isArray(data.tasks)) setTasks(syncDailyEnglishTask(data.tasks));
    if (Array.isArray(data.goals)) setGoals(data.goals);
    if (Array.isArray(data.habits)) setHabits(data.habits);
    if (Array.isArray(data.projects)) setProjects(data.projects);
    if (Array.isArray(data.notes)) setNotes(data.notes);
    if (Array.isArray(data.learningTopics)) setLearningTopics(data.learningTopics);
    if (data.userProfile) setUserProfile(data.userProfile);
    setTimeout(() => {
      isRemoteUpdateRef.current = false;
    }, 400);
  };

  // Google User login & initial synchronization workflow
  useEffect(() => {
    if (!user) {
      if (activeUnsubRef.current) {
        activeUnsubRef.current();
        activeUnsubRef.current = null;
      }
      setSyncStatus(isConfigured ? 'idle' : 'unconfigured');
      return;
    }

    let isMounted = true;

    async function initUserCloudSync() {
      if (!user) return;
      setSyncStatus('syncing');

      // Create an automatic pre-sync local safety backup snapshot
      try {
        const backupData = exportAllData();
        localStorage.setItem(STORAGE_KEYS.PRE_SYNC_BACKUP, backupData);
        setHasPreSyncBackup(true);
      } catch (err) {
        console.warn('Failed to save pre-sync backup:', err);
      }

      try {
        const cloudData = await fetchCloudWorkspace(user.uid);
        if (!isMounted) return;

        const syncKey = `lifepilot_synced_${user.uid}`;
        const hasSyncedBefore = localStorage.getItem(syncKey) === 'true';

        if (cloudData && (cloudData.tasks?.length > 0 || cloudData.goals?.length > 0)) {
          // If returning user has synced before or local data is only sample/empty data,
          // load cloud workspace directly so existing users don't get trapped in an account-setup modal!
          const isSampleData = tasks.every((t) => initialTasks.some((it) => it.id === t.id));
          if (hasSyncedBefore || tasks.length === 0 || isSampleData) {
            applyCloudWorkspace(cloudData);
            localStorage.setItem(syncKey, 'true');
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          } else {
            // First time login on a device with unsynced custom local tasks:
            // Prompt user with merge options so they don't lose local work
            setMigrationCloudData(cloudData);
            setMigrationModalOpen(true);
            setSyncStatus('idle');
          }
        } else {
          // Cloud workspace is empty: upload local data to cloud automatically
          await saveCloudWorkspace(user.uid, {
            tasks,
            goals,
            habits,
            projects,
            notes,
            learningTopics,
            userProfile,
          });
          localStorage.setItem(syncKey, 'true');
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        }
      } catch (error) {
        console.warn('Initial cloud fetch error:', error);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
      }

      // Start real-time listener for multi-device sync
      if (activeUnsubRef.current) {
        activeUnsubRef.current();
      }
      activeUnsubRef.current = subscribeToCloudWorkspace(
        user.uid,
        (remoteData, isRemote) => {
          if (isRemote) {
            applyCloudWorkspace(remoteData);
            setLastSyncedAt(new Date());
            setSyncStatus('synced');
            showToast('Workspace synchronized from cloud', 'info');
          }
        },
        (err) => {
          console.warn('Subscription error:', err);
          setSyncStatus('error');
        }
      );
    }

    initUserCloudSync();

    return () => {
      isMounted = false;
      if (activeUnsubRef.current) {
        activeUnsubRef.current();
        activeUnsubRef.current = null;
      }
    };
  }, [user]);

  // Debounced auto-save to Cloud Firestore
  useEffect(() => {
    if (!user || isRemoteUpdateRef.current || migrationModalOpen) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        await saveCloudWorkspace(user.uid, {
          tasks,
          goals,
          habits,
          projects,
          notes,
          learningTopics,
          userProfile,
        });
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn('Cloud auto-save error:', err);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
      }
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [tasks, goals, habits, projects, notes, learningTopics, userProfile, user, migrationModalOpen]);

  // Migration modal actions
  const handleConfirmMerge = async () => {
    if (!user || !migrationCloudData) return;
    setIsMigrating(true);
    try {
      const merged = mergeWorkspaces(
        { tasks, goals, habits, projects, notes, learningTopics, userProfile },
        migrationCloudData
      );
      applyCloudWorkspace(merged);
      await saveCloudWorkspace(user.uid, merged);
      localStorage.setItem(`lifepilot_synced_${user.uid}`, 'true');
      setMigrationModalOpen(false);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      showToast('Workspace merged and synchronized across devices!', 'success');
    } catch (err) {
      console.error('Merge failed:', err);
      showToast('Merge failed. Your local data remains intact.', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleConfirmUseCloud = async () => {
    if (!user || !migrationCloudData) return;
    setIsMigrating(true);
    try {
      applyCloudWorkspace(migrationCloudData);
      localStorage.setItem(`lifepilot_synced_${user.uid}`, 'true');
      setMigrationModalOpen(false);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      showToast('Cloud workspace loaded. Local backup safely preserved in Settings.', 'success');
    } catch (err) {
      console.error('Use cloud failed:', err);
      showToast('Failed to apply cloud workspace.', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleConfirmUploadLocal = async () => {
    if (!user) return;
    setIsMigrating(true);
    try {
      await saveCloudWorkspace(user.uid, {
        tasks,
        goals,
        habits,
        projects,
        notes,
        learningTopics,
        userProfile,
      });
      localStorage.setItem(`lifepilot_synced_${user.uid}`, 'true');
      setMigrationModalOpen(false);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      showToast('Local workspace uploaded to cloud! Now syncing.', 'success');
    } catch (err) {
      console.error('Upload local failed:', err);
      showToast('Upload failed. Your local data remains intact.', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const triggerManualSync = async () => {
    if (!user) {
      showToast('Please sign in with Google to enable cloud sync.', 'info');
      return;
    }
    setSyncStatus('syncing');
    try {
      await saveCloudWorkspace(user.uid, {
        tasks,
        goals,
        habits,
        projects,
        notes,
        learningTopics,
        userProfile,
      });
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      showToast('Workspace synchronized with Google Cloud.', 'success');
    } catch (err) {
      console.error('Manual sync error:', err);
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      showToast('Sync failed. Please check your internet connection.', 'error');
    }
  };

  const restorePreSyncBackup = (): boolean => {
    try {
      const backup = localStorage.getItem(STORAGE_KEYS.PRE_SYNC_BACKUP);
      if (!backup) {
        showToast('No pre-sync backup found.', 'warning');
        return false;
      }
      const ok = importAllData(backup);
      if (ok) {
        showToast('Pre-sync local backup restored successfully.', 'success');
      }
      return ok;
    } catch {
      showToast('Failed to restore backup.', 'error');
      return false;
    }
  };

  const openMigrationModal = () => {
    if (!user) return;
    fetchCloudWorkspace(user.uid).then((cloud) => {
      setMigrationCloudData(cloud);
      setMigrationModalOpen(true);
    });
  };

  // Task actions
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      subtasks: taskData.subtasks || [],
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast(`Task "${newTask.title}" added`, 'success');
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updates.status === 'completed' && t.status !== 'completed') {
            updated.completedAt = new Date().toISOString();
          } else if (updates.status && updates.status !== 'completed') {
            updated.completedAt = undefined;
          }
          return updated;
        }
        return t;
      })
    );
    showToast('Task updated', 'info');
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast(`Task "${taskToDelete?.title || ''}" deleted`, 'warning');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isDone = t.status === 'completed';
          const newStatus = isDone ? 'todo' : 'completed';
          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allDone = updatedSubtasks.every((st) => st.completed);
          return {
            ...t,
            subtasks: updatedSubtasks,
            status: allDone && updatedSubtasks.length > 0 ? 'completed' : t.status,
            completedAt: allDone ? new Date().toISOString() : t.completedAt,
          };
        }
        return t;
      })
    );
  };

  // Goal actions
  const addGoal = (goalData: Omit<Goal, 'id'>): Goal => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setGoals((prev) => [...prev, newGoal]);
    showToast(`Goal "${newGoal.title}" created`, 'success');
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    showToast('Goal updated', 'info');
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    showToast('Goal removed', 'warning');
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedMilestones = g.milestones.map((ms) =>
            ms.id === milestoneId ? { ...ms, completed: !ms.completed } : ms
          );
          const completedCount = updatedMilestones.filter((m) => m.completed).length;
          const progress = Math.round((completedCount / updatedMilestones.length) * 100);
          return {
            ...g,
            milestones: updatedMilestones,
            progress,
            status: progress === 100 ? 'achieved' : progress > 0 ? 'in_progress' : 'not_started',
          };
        }
        return g;
      })
    );
  };

  // Habit actions
  const addHabit = (name: string, category: string, targetDays: number) => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name,
      category,
      targetDaysPerWeek: targetDays,
      streak: 0,
      bestStreak: 0,
      completedDates: [],
    };
    setHabits((prev) => [...prev, newHabit]);
    showToast(`Habit "${name}" created`, 'success');
  };

  const toggleHabitDate = (habitId: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const exists = h.completedDates.includes(dateStr);
          const newDates = exists
            ? h.completedDates.filter((d) => d !== dateStr)
            : [...h.completedDates, dateStr];

          const { streak, bestStreak } = calculateHabitStreak(newDates);

          return {
            ...h,
            completedDates: newDates,
            streak,
            bestStreak: Math.max(h.bestStreak, bestStreak),
          };
        }
        return h;
      })
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    showToast('Habit removed', 'warning');
  };

  // Project actions
  const addProject = (projectData: Omit<Project, 'id'>): Project => {
    const newProj: Project = {
      ...projectData,
      id: `project-${Date.now()}`,
    };
    setProjects((prev) => [...prev, newProj]);
    showToast(`Project "${newProj.name}" created`, 'success');
    return newProj;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Project updated', 'info');
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Project removed', 'warning');
  };

  // Note actions
  const addNote = (noteData: Omit<Note, 'id' | 'updatedAt'>): Note => {
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    showToast(`Note "${newNote.title}" saved`, 'success');
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    );
    showToast('Note updated', 'info');
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Note deleted', 'warning');
  };

  // Learning Topics
  const updateTopicConfidence = (id: string, confidence: number) => {
    setLearningTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, confidence } : t))
    );
  };

  const reviewTopic = (id: string) => {
    setLearningTopics((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextBox = Math.min(5, t.leitnerBox + 1);
          const intervalDays = [1, 2, 4, 7, 14][nextBox - 1];
          return {
            ...t,
            leitnerBox: nextBox,
            nextReviewDate: getRelativeDate(intervalDays),
          };
        }
        return t;
      })
    );
    showToast('Topic reviewed & spaced interval updated', 'success');
  };

  const addTopic = (topicData: Omit<LearningTopic, 'id'>) => {
    const newTopic: LearningTopic = {
      ...topicData,
      id: `topic-${Date.now()}`,
    };
    setLearningTopics((prev) => [...prev, newTopic]);
    showToast(`Topic "${newTopic.topic}" added to Learning Center`, 'success');
  };

  // Profile
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
    showToast('Profile preferences updated', 'success');
  };

  const switchAcademicLevel = (level: EducationLevel, options?: { loadStarterSubjects?: boolean }) => {
    const isHigherEdu = level === 'engineering' || level === 'college';
    updateUserProfile({
      educationLevel: level,
      showPlacementModule: isHigherEdu,
    });
    if (options?.loadStarterSubjects) {
      const starters = getStarterSubjectsForLevel(level);
      setSubjects(starters);
      if (starters.length > 0) {
        setSelectedSubjectId(starters[0].id);
      }
      showToast(`Loaded curriculum presets for ${level.replace('_', ' ').toUpperCase()}`, 'success');
    }
  };

  // Notifications Actions
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/icons/lifepilot-icon.png',
        });
      } catch {
        // Ignore native notification restriction
      }
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('All notifications cleared', 'info');
  };

  const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Browser notifications are not supported in this browser.', 'warning');
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('Browser notifications enabled successfully!', 'success');
        updateUserProfile({
          notificationPreferences: {
            ...(userProfile.notificationPreferences || {
              enabled: true,
              leadMinutes: 15,
              quietHoursStart: '23:00',
              quietHoursEnd: '07:00',
              dailyBriefingTime: '08:00',
              browserAllowed: true,
            }),
            browserAllowed: true,
          },
        });
      } else {
        showToast('Browser notification permission was not granted.', 'info');
      }
      return permission;
    } catch {
      return 'denied';
    }
  };

  // Theme Actions
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ==========================================
  // MODULE 1: Syllabus & Notes Actions
  // ==========================================
  const addSubject = (subjectData: Omit<StudentSubject, 'id'>): StudentSubject => {
    const newSub: StudentSubject = {
      ...subjectData,
      id: `sub-${Date.now()}`,
      units: subjectData.units || [],
    };
    setSubjects((prev) => [newSub, ...prev]);
    setSelectedSubjectId(newSub.id);
    showToast(`Subject "${newSub.name}" added to syllabus`, 'success');
    return newSub;
  };

  const updateSubject = (id: string, updates: Partial<StudentSubject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Subject syllabus updated', 'info');
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (selectedSubjectId === id) {
      const remaining = subjects.filter((s) => s.id !== id);
      setSelectedSubjectId(remaining[0]?.id || '');
    }
    showToast('Subject removed', 'warning');
  };

  const addUnitToSubject = (
    subjectId: string,
    unitData: { unitNumber: number; title: string; topics: string[]; notesText?: string }
  ) => {
    const newUnit: SyllabusUnit = {
      ...unitData,
      id: `u-${Date.now()}`,
    };
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id === subjectId) {
          return {
            ...s,
            units: [...s.units, newUnit],
          };
        }
        return s;
      })
    );
    showToast(`Unit ${unitData.unitNumber} added to subject`, 'success');
  };

  // ==========================================
  // MODULE 2: Question Bank Actions
  // ==========================================
  const addQuestion = (qData: Omit<QuestionItem, 'id' | 'createdAt'>): QuestionItem => {
    const newQ: QuestionItem = {
      ...qData,
      id: `q-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) => [newQ, ...prev]);
    showToast('New question saved to bank', 'success');
    return newQ;
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    showToast('Question removed from bank', 'warning');
  };

  const toggleBookmarkQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, bookmarked: !q.bookmarked } : q))
    );
  };

  const updateQuestionRevisionStatus = (id: string, status: 'not_revised' | 'needs_practice' | 'mastered') => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, revisionStatus: status } : q))
    );
  };

  const addCustomQuestion = (qData: Omit<QuestionItem, 'id' | 'createdAt'>): QuestionItem => {
    return addQuestion(qData);
  };

  // ==========================================
  // MODULE 3: Crash Study Planner Actions
  // ==========================================
  const saveCrashPlan = (plan: CrashStudyPlan) => {
    setCrashPlans((prev) => {
      const filtered = prev.filter((p) => p.subjectId !== plan.subjectId);
      return [plan, ...filtered];
    });
    showToast(`Crash study plan saved for ${plan.subjectName}`, 'success');
  };

  const toggleCrashTask = (planId: string, taskId: string) => {
    setCrashPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          const updatedDays = plan.days.map((day) => ({
            ...day,
            tasks: day.tasks.map((task) => {
              if (task.id === taskId) {
                const nextState = !task.completed;
                return {
                  ...task,
                  completed: nextState,
                  missed: false,
                  completedAt: nextState ? new Date().toISOString() : undefined,
                };
              }
              return task;
            }),
          }));
          return { ...plan, days: updatedDays, updatedAt: new Date().toISOString() };
        }
        return plan;
      })
    );
  };

  const rescheduleMissedTasks = (planId: string) => {
    const todayStr = getRelativeDate(0);
    setCrashPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          // Identify uncompleted tasks from past days
          const missedTasks: CrashStudyTask[] = [];
          plan.days.forEach((day) => {
            if (day.date < todayStr) {
              day.tasks.forEach((t) => {
                if (!t.completed) {
                  missedTasks.push({ ...t, missed: false });
                }
              });
            }
          });

          if (missedTasks.length === 0) {
            showToast('No past missed tasks found to reschedule!', 'info');
            return plan;
          }

          // Redistribute into today and remaining days
          const futureDays = plan.days.filter((d) => d.date >= todayStr);
          if (futureDays.length === 0) {
            showToast('Exam date has passed or no future days remain.', 'warning');
            return plan;
          }

          let distributeIdx = 0;
          const futureDayMap = new Map<number, CrashStudyTask[]>();
          futureDays.forEach((fd) => futureDayMap.set(fd.dayNumber, []));

          missedTasks.forEach((mt) => {
            const targetDay = futureDays[distributeIdx % futureDays.length];
            futureDayMap.get(targetDay.dayNumber)?.push({
              ...mt,
              id: `ct-resched-${Date.now()}-${mt.id}`,
              date: targetDay.date,
              dayNumber: targetDay.dayNumber,
            });
            distributeIdx++;
          });

          const updatedDays = plan.days.map((day) => {
            if (day.date < todayStr) {
              return {
                ...day,
                tasks: day.tasks.map((t) => (t.completed ? t : { ...t, missed: true })),
              };
            }
            const appended = futureDayMap.get(day.dayNumber) || [];
            return {
              ...day,
              tasks: [...day.tasks, ...appended],
            };
          });

          showToast(`Rescheduled ${missedTasks.length} missed topics into your remaining days!`, 'success');
          return { ...plan, days: updatedDays, updatedAt: new Date().toISOString() };
        }
        return plan;
      })
    );
  };

  // ==========================================
  // MODULE 4: Test Copies Actions
  // ==========================================
  const saveTestAttempt = (record: TestAttemptRecord) => {
    setTestAttempts((prev) => [record, ...prev]);
    showToast(`Test evaluation complete (${record.marksObtained}/${record.maxMarks} Marks)`, 'success');
  };

  const deleteTestAttempt = (id: string) => {
    setTestAttempts((prev) => prev.filter((t) => t.id !== id));
    showToast('Test record deleted', 'warning');
  };

  // ==========================================
  // MODULE 5: Mock Interview Actions
  // ==========================================
  const saveInterviewReport = (report: InterviewReport) => {
    setInterviewReports((prev) => [report, ...prev]);
    showToast(`Placement interview report saved: ${report.readinessRating}`, 'success');
  };

  const deleteInterviewReport = (id: string) => {
    setInterviewReports((prev) => prev.filter((r) => r.id !== id));
    showToast('Interview report deleted', 'warning');
  };

  // Approve & Save Plan into actual tasks, goal, and project
  const approveAndSavePlan = (plan: AIPlan) => {
    const newGoalId = `goal-${Date.now()}`;
    const newGoal: Goal = {
      id: newGoalId,
      title: plan.title.replace(/^Action Plan:\s*/, ''),
      description: plan.summary,
      category: 'study',
      targetDate: getRelativeDate(plan.timeframeDays),
      progress: 0,
      status: 'in_progress',
      color: '#245EEA',
      milestones: plan.phases.map((phase, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        title: phase.name,
        completed: false,
        dueDate: getRelativeDate(Math.round(((idx + 1) / plan.phases.length) * plan.timeframeDays)),
      })),
    };

    setGoals((prev) => [...prev, newGoal]);

    const generatedTasks: Task[] = [];
    let taskCounter = 0;

    plan.phases.forEach((phase) => {
      phase.tasks.forEach((item) => {
        taskCounter++;
        const subtasks = item.subtasks.map((st, sIdx) => ({
          id: `st-${Date.now()}-${taskCounter}-${sIdx}`,
          title: st,
          completed: false,
        }));

        generatedTasks.push({
          id: `task-${Date.now()}-${taskCounter}`,
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: 'todo',
          category: item.category,
          dueDate: getRelativeDate(typeof item.dueDateOffsetDays === 'number' ? item.dueDateOffsetDays : 3),
          dueTime: '17:00',
          startTime: '17:00',
          endTime: '18:00',
          estimatedMinutes: item.estimatedMinutes || 60,
          goalId: newGoalId,
          subtasks,
          createdAt: new Date().toISOString(),
        });
      });
    });

    setTasks((prev) => [...generatedTasks, ...prev]);
    showToast(`Plan approved! Added 1 Goal and ${generatedTasks.length} actionable tasks to My Tasks.`, 'success');
    setActivePage('tasks');
  };

  // Data management
  const exportAllData = (): string => {
    const payload = {
      version: '2.0-student-platform',
      exportedAt: new Date().toISOString(),
      tasks,
      goals,
      habits,
      projects,
      notes,
      learningTopics,
      userProfile,
      subjects,
      questions,
      crashPlans,
      testAttempts,
      interviewReports,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importAllData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.tasks)) setTasks(syncDailyEnglishTask(data.tasks));
      if (Array.isArray(data.goals)) setGoals(data.goals);
      if (Array.isArray(data.habits)) setHabits(data.habits);
      if (Array.isArray(data.projects)) setProjects(data.projects);
      if (Array.isArray(data.notes)) setNotes(data.notes);
      if (Array.isArray(data.learningTopics)) setLearningTopics(data.learningTopics);
      if (data.userProfile) setUserProfile(data.userProfile);
      if (Array.isArray(data.subjects) && data.subjects.length > 0) setSubjects(data.subjects);
      if (Array.isArray(data.questions) && data.questions.length > 0) setQuestions(data.questions);
      if (Array.isArray(data.crashPlans) && data.crashPlans.length > 0) setCrashPlans(data.crashPlans);
      if (Array.isArray(data.testAttempts)) setTestAttempts(data.testAttempts);
      if (Array.isArray(data.interviewReports)) setInterviewReports(data.interviewReports);
      showToast('All student platform data imported successfully', 'success');
      return true;
    } catch {
      showToast('Invalid JSON backup file', 'error');
      return false;
    }
  };

  const resetToSampleData = () => {
    setTasks(syncDailyEnglishTask(initialTasks));
    setGoals(initialGoals);
    setHabits(initialHabits);
    setProjects(initialProjects);
    setNotes(initialNotes);
    setLearningTopics(initialLearningTopics);
    setUserProfile(initialProfile);
    setSubjects(initialSubjects);
    setSelectedSubjectId(initialSubjects[0]?.id || '');
    setQuestions(initialQuestions);
    setCrashPlans([initialCrashPlan]);
    setTestAttempts(initialTestAttempts);
    setInterviewReports(initialInterviewReports);
    showToast('Reset to default university student platform sample data', 'info');
  };

  const clearAllData = () => {
    setTasks(syncDailyEnglishTask([]));
    setGoals([]);
    setHabits([]);
    setProjects([]);
    setNotes([]);
    setLearningTopics([]);
    setSubjects([]);
    setQuestions([]);
    setCrashPlans([]);
    setTestAttempts([]);
    setInterviewReports([]);
    showToast('All custom data cleared', 'warning');
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        sidebarCollapsed,
        setSidebarCollapsed,
        searchQuery,
        setSearchQuery,
        hasGeminiKey,

        // Cloud sync
        syncStatus,
        lastSyncedAt,
        triggerManualSync,
        hasPreSyncBackup,
        restorePreSyncBackup,
        openMigrationModal,

        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        toggleSubtask,

        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleMilestone,

        habits,
        addHabit,
        toggleHabitDate,
        deleteHabit,

        projects,
        addProject,
        updateProject,
        deleteProject,

        notes,
        addNote,
        updateNote,
        deleteNote,

        learningTopics,
        updateTopicConfidence,
        reviewTopic,
        addTopic,

        userProfile,
        updateUserProfile,
        switchAcademicLevel,

        // Notifications
        notifications,
        unreadNotificationsCount,
        addNotification,
        markNotificationRead,
        clearAllNotifications,
        requestBrowserNotificationPermission,

        // Theme
        theme,
        toggleTheme,

        approveAndSavePlan,
        exportAllData,
        importAllData,
        resetToSampleData,
        clearAllData,

        taskModalOpen,
        setTaskModalOpen,
        editingTask,
        setEditingTask,

        goalModalOpen,
        setGoalModalOpen,
        editingGoal,
        setEditingGoal,

        projectModalOpen,
        setProjectModalOpen,

        noteModalOpen,
        setNoteModalOpen,
        editingNote,
        setEditingNote,

        // Student Success Platform Module 1: Syllabus & Notes
        subjects,
        selectedSubjectId,
        setSelectedSubjectId,
        addSubject,
        updateSubject,
        deleteSubject,
        addUnitToSubject,

        // Student Success Platform Module 2: Question Bank
        questions,
        addQuestion,
        deleteQuestion,
        toggleBookmarkQuestion,
        updateQuestionRevisionStatus,
        addCustomQuestion,

        // Student Success Platform Module 3: Crash Study Planner
        crashPlans,
        activeCrashPlan,
        saveCrashPlan,
        toggleCrashTask,
        rescheduleMissedTasks,

        // Student Success Platform Module 4: Test Copies
        testAttempts,
        saveTestAttempt,
        deleteTestAttempt,

        // Student Success Platform Module 5: Mock Interview Reports
        interviewReports,
        saveInterviewReport,
        deleteInterviewReport,

        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
      <DataMigrationModal
        isOpen={migrationModalOpen}
        onClose={() => setMigrationModalOpen(false)}
        localStats={{
          tasksCount: tasks.length,
          goalsCount: goals.length,
          habitsCount: habits.length,
        }}
        cloudData={migrationCloudData}
        onConfirmMerge={handleConfirmMerge}
        onConfirmUseCloud={handleConfirmUseCloud}
        onConfirmUploadLocal={handleConfirmUploadLocal}
        isProcessing={isMigrating}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
