import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Task,
  Goal,
  Habit,
  Project,
  Note,
  LearningTopic,
  UserProfile,
} from '../types';

export interface CloudWorkspacePayload {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  projects: Project[];
  notes: Note[];
  learningTopics: LearningTopic[];
  userProfile?: UserProfile;
  updatedAt: string;
  deviceId: string;
}

// Unique identifier for the current browser session to detect own vs remote writes
const CURRENT_DEVICE_ID = `device-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export const getDeviceId = (): string => CURRENT_DEVICE_ID;

/**
 * Fetch cloud workspace document once for migration checks
 */
export async function fetchCloudWorkspace(uid: string): Promise<CloudWorkspacePayload | null> {
  if (!db) return null;
  const docRef = doc(db, 'users', uid, 'workspace', 'data');
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as CloudWorkspacePayload;
}

/**
 * Save workspace payload to Cloud Firestore
 */
export async function saveCloudWorkspace(
  uid: string,
  data: Omit<CloudWorkspacePayload, 'updatedAt' | 'deviceId'>
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const payload: CloudWorkspacePayload = {
    ...data,
    updatedAt: new Date().toISOString(),
    deviceId: CURRENT_DEVICE_ID,
  };

  const docRef = doc(db, 'users', uid, 'workspace', 'data');
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Real-time listener for cross-device synchronization
 */
export function subscribeToCloudWorkspace(
  uid: string,
  onUpdate: (data: CloudWorkspacePayload, isRemoteUpdate: boolean) => void,
  onError: (error: Error) => void
): Unsubscribe | null {
  if (!db) return null;

  const docRef = doc(db, 'users', uid, 'workspace', 'data');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudWorkspacePayload;
        // Determine whether this update originated from another device
        const isRemote = data.deviceId !== CURRENT_DEVICE_ID;
        onUpdate(data, isRemote);
      }
    },
    (err) => {
      console.warn('[LifePilot Sync] Snapshot error:', err);
      onError(err);
    }
  );
}

/**
 * Helper to merge two datasets without creating duplicate IDs
 */
export function mergeWorkspaces(
  local: {
    tasks: Task[];
    goals: Goal[];
    habits: Habit[];
    projects: Project[];
    notes: Note[];
    learningTopics: LearningTopic[];
    userProfile: UserProfile;
  },
  cloud: CloudWorkspacePayload
) {
  // Merge tasks by id
  const taskMap = new Map<string, Task>();
  cloud.tasks.forEach((t) => taskMap.set(t.id, t));
  local.tasks.forEach((t) => {
    // If not present in cloud, add local; if already present, prefer more recent completion or cloud version
    if (!taskMap.has(t.id)) {
      taskMap.set(t.id, t);
    }
  });

  // Merge goals by id
  const goalMap = new Map<string, Goal>();
  cloud.goals.forEach((g) => goalMap.set(g.id, g));
  local.goals.forEach((g) => {
    if (!goalMap.has(g.id)) goalMap.set(g.id, g);
  });

  // Merge habits by id
  const habitMap = new Map<string, Habit>();
  cloud.habits.forEach((h) => habitMap.set(h.id, h));
  local.habits.forEach((h) => {
    if (!habitMap.has(h.id)) {
      habitMap.set(h.id, h);
    } else {
      // Merge completion dates
      const existing = habitMap.get(h.id)!;
      const mergedDates = Array.from(new Set([...existing.completedDates, ...h.completedDates]));
      habitMap.set(h.id, {
        ...existing,
        completedDates: mergedDates,
        streak: Math.max(existing.streak, h.streak),
        bestStreak: Math.max(existing.bestStreak, h.bestStreak),
      });
    }
  });

  // Merge projects by id
  const projectMap = new Map<string, Project>();
  cloud.projects.forEach((p) => projectMap.set(p.id, p));
  local.projects.forEach((p) => {
    if (!projectMap.has(p.id)) projectMap.set(p.id, p);
  });

  // Merge notes by id
  const noteMap = new Map<string, Note>();
  cloud.notes.forEach((n) => noteMap.set(n.id, n));
  local.notes.forEach((n) => {
    if (!noteMap.has(n.id)) noteMap.set(n.id, n);
  });

  // Merge topics by id
  const topicMap = new Map<string, LearningTopic>();
  cloud.learningTopics.forEach((t) => topicMap.set(t.id, t));
  local.learningTopics.forEach((t) => {
    if (!topicMap.has(t.id)) topicMap.set(t.id, t);
  });

  // Profile: Prefer user-edited cloud profile if populated, otherwise local
  const mergedProfile = cloud.userProfile?.name ? cloud.userProfile : local.userProfile;

  return {
    tasks: Array.from(taskMap.values()),
    goals: Array.from(goalMap.values()),
    habits: Array.from(habitMap.values()),
    projects: Array.from(projectMap.values()),
    notes: Array.from(noteMap.values()),
    learningTopics: Array.from(topicMap.values()),
    userProfile: mergedProfile,
  };
}

