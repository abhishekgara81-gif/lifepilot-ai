import { Task, Goal, Habit, Project, Note, LearningTopic, UserProfile } from '../types';

export function getRelativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function formatTime12(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m === 0 ? ':00' : `:${m.toString().padStart(2, '0')}`;
  return `${displayH}${displayM} ${period}`;
}

export function formatTimeRangeWithMidnight(startTime?: string, endTime?: string): string {
  const start = startTime || '23:00';
  const end = endTime || '00:00';
  const startFmt = formatTime12(start);
  const endFmt = formatTime12(end);
  const isMidnightNextDay =
    (start >= '12:00' && (end === '00:00' || end === '24:00' || end.startsWith('00:'))) ||
    (start === '23:00' && (end === '00:00' || end === '24:00'));
  const note = isMidnightNextDay ? ' (midnight next day)' : (end === '00:00' ? ' (midnight)' : '');
  return `${startFmt} – ${endFmt}${note}`;
}

export function formatScheduleRange(startTime?: string, endTime?: string, recurrence?: string): string {
  const rangeStr = formatTimeRangeWithMidnight(startTime, endTime);
  if (recurrence === 'daily') {
    return `Every day, from ${rangeStr.replace(' – ', ' to ')}`;
  }
  return rangeStr;
}

export const initialProfile: UserProfile = {
  name: 'Alex Morgan',
  title: 'Computer Science & AI Undergraduate',
  email: 'alex.morgan@university.edu',
  university: 'School of Computing & Engineering',
  dailyTargetFocusMinutes: 240, // 4 hours
  dayStartTime: '08:30',
  dayEndTime: '22:30',
  pomodoroFocusMinutes: 25,
  pomodoroBreakMinutes: 5,
};

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'LifePilot AI Capstone',
    description: 'Full-stack AI task orchestrator with responsive dashboard and autonomous goal decomposition.',
    status: 'active',
    deadline: getRelativeDate(25),
    color: '#245EEA', // Cobalt
    tags: ['Fullstack', 'TypeScript', 'Gemini API', 'React'],
  },
  {
    id: 'proj-2',
    name: 'Advanced C++ & Systems Lab',
    description: 'High-performance memory allocator, RAII implementations, and multi-threaded cache engine.',
    status: 'active',
    deadline: getRelativeDate(12),
    color: '#3B82F6', // Blue
    tags: ['C++', 'Concurrency', 'OS', 'Systems'],
  },
  {
    id: 'proj-3',
    name: 'Fall Internship Applications',
    description: 'Targeting 45 engineering internships, technical coding screens, and behavioral prep.',
    status: 'active',
    deadline: getRelativeDate(40),
    color: '#0E8C87', // Teal
    tags: ['Career', 'DSA', 'Resumes', 'Interviews'],
  },
];

export const initialGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Achieve 4.0 in Advanced C++ & Operating Systems',
    description: 'Master virtual memory, smart pointer internals, RAII patterns, and pass midterms with >92%.',
    category: 'study',
    targetDate: getRelativeDate(18),
    progress: 72,
    status: 'in_progress',
    color: '#3B82F6',
    milestones: [
      { id: 'm-1', title: 'Complete custom vector allocator assignment', completed: true, dueDate: getRelativeDate(-2) },
      { id: 'm-2', title: 'Midterm practice exam review and error cataloging', completed: false, dueDate: getRelativeDate(4) },
      { id: 'm-3', title: 'Multi-threading synchronization lab delivery', completed: false, dueDate: getRelativeDate(11) },
    ],
  },
  {
    id: 'goal-2',
    title: 'Solve 150 LeetCode Problems (Top Interview 150)',
    description: 'Strengthen core graph algorithms, dynamic programming, and interval scheduling patterns.',
    category: 'coding',
    targetDate: getRelativeDate(35),
    progress: 58,
    status: 'in_progress',
    color: '#245EEA',
    milestones: [
      { id: 'm-4', title: '50 Easy warm-up problems on two pointers & sliding window', completed: true },
      { id: 'm-5', title: '50 Medium problems on trees, tries, and graph DFS/BFS', completed: true },
      { id: 'm-6', title: '30 Dynamic Programming & 20 Hard problems', completed: false, dueDate: getRelativeDate(20) },
    ],
  },
  {
    id: 'goal-3',
    title: 'Publish Production AI Planner Portfolio Project',
    description: 'Deploy full-stack web app with clean typography, responsive design, and Gemini API integration.',
    category: 'project',
    targetDate: getRelativeDate(28),
    progress: 85,
    status: 'in_progress',
    color: '#10B981',
    milestones: [
      { id: 'm-7', title: 'Design system, navigation architecture, and responsive dashboard', completed: true },
      { id: 'm-8', title: 'Implement AI Planner prompt validation and API error handling', completed: true },
      { id: 'm-9', title: 'Performance audit, dark navy polish, and GitHub documentation', completed: false, dueDate: getRelativeDate(6) },
    ],
  },
];

export const dailySpokenEnglishTask: Task = {
  id: 'task-daily-spoken-english',
  title: 'Daily Spoken English Practice',
  description: 'Practice spoken English, pronunciation, vocabulary, fluency, and confidence.',
  priority: 'high',
  status: 'todo',
  category: 'learning',
  dueDate: getRelativeDate(0),
  dueTime: '23:00',
  startTime: '23:00',
  endTime: '00:00',
  estimatedMinutes: 60,
  recurrence: 'daily',
  createdAt: new Date().toISOString(),
  subtasks: [
    { id: 'st-dse-1', title: 'Pronunciation & accent clarity drills (15 mins)', completed: false },
    { id: 'st-dse-2', title: 'Vocabulary expansion & active phrase building (15 mins)', completed: false },
    { id: 'st-dse-3', title: 'Spontaneous fluency monologue & topic speaking (15 mins)', completed: false },
    { id: 'st-dse-4', title: 'Conversational confidence & recorded self-review (15 mins)', completed: false },
  ],
};

export function syncDailyEnglishTask(taskList: Task[]): Task[] {
  let englishTaskFound = false;
  const result: Task[] = [];

  for (const t of taskList) {
    const isEnglishTask =
      t.id === 'task-daily-spoken-english' ||
      t.title.trim().toLowerCase() === 'daily spoken english practice';

    if (isEnglishTask) {
      if (!englishTaskFound) {
        // Update its scheduling & category fields while preserving existing user state
        const updatedTask: Task = {
          ...t,
          id: t.id || 'task-daily-spoken-english',
          title: 'Daily Spoken English Practice',
          description: t.description?.trim() ? t.description : dailySpokenEnglishTask.description,
          category: 'learning',
          recurrence: 'daily',
          startTime: '23:00',
          endTime: '00:00',
          dueTime: '23:00',
          estimatedMinutes: 60,
          createdAt: t.createdAt || dailySpokenEnglishTask.createdAt,
          subtasks: (t.subtasks && t.subtasks.length > 0) ? t.subtasks : dailySpokenEnglishTask.subtasks,
        };
        result.push(updatedTask);
        englishTaskFound = true;
      }
      // Drop any duplicate tasks named "Daily Spoken English Practice"
    } else {
      result.push(t);
    }
  }

  // If no task named "Daily Spoken English Practice" existed, prepend it
  if (!englishTaskFound) {
    result.unshift(dailySpokenEnglishTask);
  }

  return result;
}

export const initialTasks: Task[] = [
  dailySpokenEnglishTask,
  {
    id: 'task-1',
    title: 'Review C++ Smart Pointers & Move Semantics',
    description: 'Deep dive into std::unique_ptr, std::shared_ptr control block internals, and std::move rvalue casts.',
    priority: 'high',
    status: 'todo',
    category: 'study',
    dueDate: getRelativeDate(0), // Today
    dueTime: '14:00',
    estimatedMinutes: 75,
    projectId: 'proj-2',
    goalId: 'goal-1',
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-1', title: 'Read Scott Meyers Effective Modern C++ Item 18-21', completed: true },
      { id: 'st-2', title: 'Implement toy unique_ptr with custom deleter', completed: false },
      { id: 'st-3', title: 'Dry run reference counter atomic increments', completed: false },
    ],
  },
  {
    id: 'task-2',
    title: 'Daily DSA: 2 LeetCode Mediums on Graphs (Topological Sort)',
    description: 'Solve Course Schedule II and Alien Dictionary with clean cycle detection logic.',
    priority: 'high',
    status: 'in_progress',
    category: 'coding',
    dueDate: getRelativeDate(0), // Today
    dueTime: '16:30',
    estimatedMinutes: 60,
    projectId: 'proj-3',
    goalId: 'goal-2',
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-4', title: 'Kahn algorithm BFS implementation with in-degree array', completed: true },
      { id: 'st-5', title: 'DFS three-color visitation state cycle check', completed: false },
    ],
  },
  {
    id: 'task-3',
    title: 'Build Interactive Study Center Pomodoro Timer',
    description: 'Create focused countdown timer with audio chime and interval tracking for student study sessions.',
    priority: 'medium',
    status: 'completed',
    category: 'project',
    dueDate: getRelativeDate(0), // Today
    dueTime: '11:00',
    estimatedMinutes: 45,
    actualMinutes: 40,
    projectId: 'proj-1',
    goalId: 'goal-3',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-6', title: 'Hook state with pause/resume and interval cleanup', completed: true },
      { id: 'st-7', title: 'Synthesized Web Audio API completion ping', completed: true },
    ],
  },
  {
    id: 'task-4',
    title: 'Operating Systems Midterm Cheat Sheet Drafting',
    description: 'Summarize page replacement algorithms (LRU, FIFO, Clock), translation lookaside buffer (TLB), and thrashing.',
    priority: 'high',
    status: 'todo',
    category: 'revision',
    dueDate: getRelativeDate(1), // Tomorrow
    dueTime: '10:00',
    estimatedMinutes: 90,
    projectId: 'proj-2',
    goalId: 'goal-1',
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-8', title: 'TLB hit/miss effective access time calculations', completed: false },
      { id: 'st-9', title: 'Belady anomaly explanation and diagram', completed: false },
    ],
  },
  {
    id: 'task-5',
    title: 'Submit 5 Software Engineering Internship Applications',
    description: 'Customize resume bullets with quantitative metrics for distributed systems and AI platform teams.',
    priority: 'medium',
    status: 'todo',
    category: 'personal',
    dueDate: getRelativeDate(2),
    dueTime: '17:00',
    estimatedMinutes: 60,
    projectId: 'proj-3',
    goalId: 'goal-2',
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-10', title: 'Draft tailored cover letter intro for Stripe and Cloudflare', completed: false },
      { id: 'st-11', title: 'Update LinkedIn portfolio link and featured repositories', completed: false },
    ],
  },
  {
    id: 'task-6',
    title: 'Gemini Planner Request Validation & Error Handling',
    description: 'Ensure missing keys, invalid inputs, API failures, and rate limits are reported clearly without substitute plans.',
    priority: 'low',
    status: 'completed',
    category: 'project',
    dueDate: getRelativeDate(-1),
    estimatedMinutes: 50,
    actualMinutes: 45,
    projectId: 'proj-1',
    goalId: 'goal-3',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-12', title: 'Verify invalid prompts and parameters return actionable errors', completed: true },
      { id: 'st-13', title: 'Validate Gemini structured response parsing and task fields', completed: true },
    ],
  },
];

export const initialHabits: Habit[] = [
  {
    id: 'hab-1',
    name: 'Daily DSA Practice (minimum 1 problem)',
    category: 'Coding',
    targetDaysPerWeek: 7,
    streak: 14,
    bestStreak: 28,
    completedDates: [
      getRelativeDate(-6),
      getRelativeDate(-5),
      getRelativeDate(-4),
      getRelativeDate(-3),
      getRelativeDate(-2),
      getRelativeDate(-1),
      getRelativeDate(0),
    ],
  },
  {
    id: 'hab-2',
    name: 'Deep Work Focus Block (90 mins uninterrupted)',
    category: 'Productivity',
    targetDaysPerWeek: 6,
    streak: 8,
    bestStreak: 19,
    completedDates: [
      getRelativeDate(-5),
      getRelativeDate(-4),
      getRelativeDate(-3),
      getRelativeDate(-2),
      getRelativeDate(-1),
      getRelativeDate(0),
    ],
  },
  {
    id: 'hab-3',
    name: 'Active Recall Spaced Review (20 mins)',
    category: 'Academics',
    targetDaysPerWeek: 6,
    streak: 5,
    bestStreak: 12,
    completedDates: [
      getRelativeDate(-4),
      getRelativeDate(-3),
      getRelativeDate(-2),
      getRelativeDate(-1),
    ],
  },
  {
    id: 'hab-4',
    name: 'Physical Workout or 30-min brisk walk',
    category: 'Wellness',
    targetDaysPerWeek: 5,
    streak: 3,
    bestStreak: 15,
    completedDates: [
      getRelativeDate(-3),
      getRelativeDate(-2),
      getRelativeDate(0),
    ],
  },
];

export const initialLearningTopics: LearningTopic[] = [
  {
    id: 'lt-1',
    subject: 'Advanced C++',
    topic: 'Virtual Table (vptr & vtable) & Dynamic Dispatch',
    confidence: 4,
    nextReviewDate: getRelativeDate(1),
    leitnerBox: 3,
    notesSnippet: 'Every class with virtual functions gets a vtable. Object instance has hidden vptr pointer at offset 0.',
  },
  {
    id: 'lt-2',
    subject: 'Operating Systems',
    topic: 'Page Table Multi-Level Inversion & TLB Shoots',
    confidence: 3,
    nextReviewDate: getRelativeDate(0),
    leitnerBox: 2,
    notesSnippet: '4-level paging in x86-64 reduces physical RAM overhead for sparse virtual address spaces.',
  },
  {
    id: 'lt-3',
    subject: 'Algorithms',
    topic: 'Dijkstra vs A* Shortest Path & Heuristic Admissibility',
    confidence: 5,
    nextReviewDate: getRelativeDate(4),
    leitnerBox: 4,
    notesSnippet: 'A* requires admissible (never overestimating) and consistent heuristics to guarantee optimality.',
  },
  {
    id: 'lt-4',
    subject: 'System Design',
    topic: 'Consistent Hashing with Virtual Nodes',
    confidence: 4,
    nextReviewDate: getRelativeDate(2),
    leitnerBox: 3,
    notesSnippet: 'Virtual nodes prevent hot-spot skew when nodes join or fail in distributed ring topologies.',
  },
];

export const initialNotes: Note[] = [
  {
    id: 'note-1',
    title: 'C++ Modern Memory & RAII Cheatsheet',
    content: `# Modern C++ Memory Guidelines

## Smart Pointers Rule of Thumb
- Use \`std::unique_ptr\` by default for single exclusive ownership. Zero runtime space overhead compared to raw pointers.
- Use \`std::make_unique<T>()\` to avoid leaks during argument evaluation exceptions.
- Use \`std::shared_ptr\` ONLY when true shared ownership is required (e.g. shared graph nodes). Control block allocates reference count and weak count dynamically.
- Use \`std::weak_ptr\` to break circular dependency cycles in graphs and observer subscriber lists.

## Rule of Five / Rule of Zero
If you define one of these, define all five (or prefer Rule of Zero with STL containers):
1. Destructor \`~Class()\`
2. Copy constructor \`Class(const Class&)\`
3. Copy assignment \`Class& operator=(const Class&)\`
4. Move constructor \`Class(Class&&) noexcept\`
5. Move assignment \`Class& operator=(Class&&) noexcept\`
`,
    category: 'Study',
    updatedAt: getRelativeDate(-1),
    pinned: true,
    tags: ['C++', 'Systems', 'Exam Prep'],
  },
  {
    id: 'note-2',
    title: 'The 14 Fundamental Coding Patterns for Technical Interviews',
    content: `# Core Algorithmic Patterns

1. **Sliding Window**: Maximum sum subarray, longest substring without repeating chars.
2. **Two Pointers**: Three sum, trapping rainwater, palindrome verification.
3. **Fast & Slow Pointers**: Floyd's cycle detection in linked lists.
4. **Merge Intervals**: Calendar scheduling, non-overlapping intervals.
5. **Cyclic Sort**: Finding missing positive integers in O(N) time and O(1) space.
6. **In-place Reversal of Linked List**: Reversing sub-lists.
7. **Tree BFS**: Level order traversal, right side view.
8. **Tree DFS**: Path sum III, maximum path sum.
9. **Two Heaps**: Median from data stream, sliding window median.
10. **Subsets & Backtracking**: Permutations, combinations, word search.
11. **Modified Binary Search**: Search in rotated sorted array.
12. **Top K Elements**: QuickSelect or Min-Heap for k largest.
13. **K-way Merge**: Merge k sorted lists.
14. **0/1 Knapsack & Topological Sort**: Coin change, course schedule.
`,
    category: 'Interview Prep',
    updatedAt: getRelativeDate(-3),
    pinned: true,
    tags: ['DSA', 'LeetCode', 'Interview'],
  },
  {
    id: 'note-3',
    title: 'LifePilot AI Capstone Architectural Brief',
    content: `# LifePilot Architecture Overview

- **Core Goal**: Deconstruct broad student ambitions into structured, realistic timeblocked tasks.
- **Backend Model**: Server-side proxy with Google Gemini 3.8 Flash (\`@google/genai\`) returning structured JSON plan.
- **Error Handling**: Missing keys, invalid input, Gemini failures, and rate limits return clear errors; the server never substitutes a synthetic plan.
- **State Store**: Clean AppContext backed by browser LocalStorage with export/import capabilities.
`,
    category: 'Project',
    updatedAt: getRelativeDate(-5),
    pinned: false,
    tags: ['Architecture', 'LifePilot'],
  },
];
