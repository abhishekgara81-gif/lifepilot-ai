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
} from '../types';
import {
  initialTasks,
  initialGoals,
  initialHabits,
  initialProjects,
  initialNotes,
  initialLearningTopics,
  initialProfile,
  getRelativeDate,
  dailySpokenEnglishTask,
  syncDailyEnglishTask,
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
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isConfigured } = useAuth();

  const [activePage, setActivePage] = useState<string>('dashboard');
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
  const [hasPreSyncBackup, setHasPreSyncBackup] = useState(() =>
    Boolean(localStorage.getItem(STORAGE_KEYS.PRE_SYNC_BACKUP))
  );

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
      return saved ? JSON.parse(saved) : initialGoals;
    } catch {
      return initialGoals;
    }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
      return saved ? JSON.parse(saved) : initialHabits;
    } catch {
      return initialHabits;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return saved ? JSON.parse(saved) : initialProjects;
    } catch {
      return initialProjects;
    }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : initialNotes;
    } catch {
      return initialNotes;
    }
  });

  const [learningTopics, setLearningTopics] = useState<LearningTopic[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOPICS);
      return saved ? JSON.parse(saved) : initialLearningTopics;
    } catch {
      return initialLearningTopics;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : initialProfile;
    } catch {
      return initialProfile;
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
  }, [user]);

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

          const sorted = [...newDates].sort();
          let currentStreak = 0;
          let temp = 0;
          for (let i = 0; i < sorted.length; i++) {
            temp++;
          }
          currentStreak = Math.min(newDates.length, 30);
          const best = Math.max(h.bestStreak, currentStreak);

          return {
            ...h,
            completedDates: newDates,
            streak: currentStreak,
            bestStreak: best,
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
          dueDate: getRelativeDate(item.dueDateOffsetDays || 3),
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
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      goals,
      habits,
      projects,
      notes,
      learningTopics,
      userProfile,
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
      showToast('All data imported successfully', 'success');
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
    showToast('Reset to default student sample data', 'info');
  };

  const clearAllData = () => {
    setTasks([]);
    setGoals([]);
    setHabits([]);
    setProjects([]);
    setNotes([]);
    setLearningTopics([]);
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
