import {
  Task,
  Goal,
  Habit,
  Project,
  Note,
  LearningTopic,
  UserProfile,
  StudentSubject,
  QuestionItem,
  CrashStudyPlan,
  TestAttemptRecord,
  InterviewReport,
  AppNotification,
  EducationLevel,
} from '../types';
import { getRelativeDate as safeGetRelativeDate, formatLocalDate, parseLocalDate, isSameDay, formatDisplayDate } from '../utils/dateUtils';

export { formatLocalDate, parseLocalDate, isSameDay, formatDisplayDate };

export function getRelativeDate(offsetDays: number, baseDate?: Date | string): string {
  return safeGetRelativeDate(offsetDays, baseDate);
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

export function calculateHabitStreak(completedDates: string[]): { streak: number; bestStreak: number } {
  if (!completedDates || completedDates.length === 0) {
    return { streak: 0, bestStreak: 0 };
  }

  const uniqueDates = Array.from(new Set(completedDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))));
  if (uniqueDates.length === 0) {
    return { streak: 0, bestStreak: 0 };
  }

  const dateSet = new Set(uniqueDates);

  // 1. Current streak: consecutive days ending today or yesterday
  const todayStr = getRelativeDate(0);
  const yesterdayStr = getRelativeDate(-1);

  let currentStreak = 0;
  if (dateSet.has(todayStr)) {
    let offset = 0;
    while (dateSet.has(getRelativeDate(offset))) {
      currentStreak++;
      offset--;
    }
  } else if (dateSet.has(yesterdayStr)) {
    let offset = -1;
    while (dateSet.has(getRelativeDate(offset))) {
      currentStreak++;
      offset--;
    }
  }

  // 2. Best streak: longest consecutive daily run in history
  const sortedDates = [...uniqueDates].sort();
  let maxStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const currentDate = new Date(Date.UTC(year, month - 1, day));

    if (prevDate === null) {
      runningStreak = 1;
    } else {
      const diffMs = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    if (runningStreak > maxStreak) {
      maxStreak = runningStreak;
    }
    prevDate = currentDate;
  }

  return {
    streak: currentStreak,
    bestStreak: Math.max(maxStreak, currentStreak),
  };
}

export const initialProfile: UserProfile = {
  name: 'Alex Morgan',
  title: 'Undergraduate Student',
  email: 'alex.morgan@university.edu',
  educationLevel: 'engineering',
  boardOrUniversity: 'Punjab Technical University (PTU)',
  courseOrClass: 'B.Tech',
  branchOrStream: 'Computer Science & Engineering',
  yearOrSemester: 'Semester 5',
  university: 'Punjab Technical University (PTU)',
  branch: 'B.Tech CSE',
  course: 'B.Tech',
  semester: 5,
  targetExamDate: getRelativeDate(18),
  dailyTargetFocusMinutes: 240, // 4 hours
  dayStartTime: '08:30', // 8:30 AM
  dayEndTime: '22:30',   // 10:30 PM
  pomodoroFocusMinutes: 25,
  pomodoroBreakMinutes: 5,
  preferredLanguage: 'en',
  preferredResponseLanguage: 'en',
  themeMode: 'light',
  showPlacementModule: true,
  timeFormat: '12h',
  notificationPreferences: {
    enabled: true,
    leadMinutes: 15,
    quietHoursStart: '23:00', // 11:00 PM
    quietHoursEnd: '07:00',   // 7:00 AM
    dailyBriefingTime: '08:00', // 8:00 AM
    browserAllowed: false,
  },
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

// ==========================================
// STUDENT SUCCESS PLATFORM INITIAL DATA
// ==========================================

export const initialSubjects: StudentSubject[] = [
  {
    id: 'sub-dsa',
    code: 'CS-301',
    name: 'Data Structures & Algorithms',
    branch: 'B.Tech CSE',
    semester: 5,
    university: 'Punjab Technical University (PTU)',
    examDate: getRelativeDate(18),
    targetMarks: 85,
    units: [
      {
        id: 'u-dsa-1',
        unitNumber: 1,
        title: 'Linear Data Structures: Arrays, Stacks, Queues & Linked Lists',
        topics: [
          'Array representations & multi-dimensional addressing',
          'Stack applications: Infix to Postfix & Evaluation',
          'Circular & Priority Queues implementation',
          'Singly, Doubly and Circular Linked Lists operations',
        ],
        notesText: 'Stacks follow LIFO; recursion stack simulation. Circular queues eliminate linear queue shifting waste using front = (front + 1) % capacity.',
      },
      {
        id: 'u-dsa-2',
        unitNumber: 2,
        title: 'Non-Linear Structures: Trees & Binary Search Trees',
        topics: [
          'Binary Tree traversals (Inorder, Preorder, Postorder)',
          'Binary Search Tree (BST) insertion, search, and deletion',
          'AVL Trees & Rotations (LL, RR, LR, RL)',
          'B-Trees & B+ Trees in indexing',
        ],
        notesText: 'AVL tree balance factor is Height(Left) - Height(Right), allowed values {-1, 0, +1}. Deletion in BST requires replacing with inorder predecessor or successor.',
      },
      {
        id: 'u-dsa-3',
        unitNumber: 3,
        title: 'Graphs: Traversals & Shortest Paths',
        topics: [
          'Graph representations: Adjacency Matrix vs List',
          'BFS & DFS traversals and cycle detection',
          'Minimum Spanning Trees: Kruskal and Prim algorithms',
          'Single Source Shortest Path: Dijkstra & Bellman-Ford',
        ],
        notesText: 'Dijkstra fails on negative edge weights; use Bellman-Ford for negative weights (O(V*E) complexity).',
      },
      {
        id: 'u-dsa-4',
        unitNumber: 4,
        title: 'Sorting & Searching Techniques',
        topics: [
          'Comparison sorts: QuickSort & MergeSort divide-and-conquer',
          'HeapSort & Binary Heap construction (Heapify)',
          'Non-comparison sorts: Radix Sort & Counting Sort',
          'Hashing techniques, Collision resolution (Chaining & Open Addressing)',
        ],
        notesText: 'MergeSort is stable with guaranteed O(N log N) worst-case. QuickSort average is O(N log N) but worst-case O(N^2) on sorted arrays with naive pivot.',
      },
      {
        id: 'u-dsa-5',
        unitNumber: 5,
        title: 'Algorithmic Paradigms & Dynamic Programming',
        topics: [
          'Greedy Strategy: Fractional Knapsack & Huffman Coding',
          'Dynamic Programming: 0/1 Knapsack, LCS, Matrix Chain Multiplication',
          'Backtracking: N-Queens problem & Subset Sum',
          'Branch & Bound: Traveling Salesperson Problem',
        ],
        notesText: 'DP requires Overlapping Subproblems and Optimal Substructure. 0/1 Knapsack recurrence: dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w-wt[i-1]]).',
      },
    ],
  },
  {
    id: 'sub-os',
    code: 'CS-302',
    name: 'Operating Systems',
    branch: 'B.Tech CSE',
    semester: 5,
    university: 'Punjab Technical University (PTU)',
    examDate: getRelativeDate(24),
    targetMarks: 80,
    units: [
      {
        id: 'u-os-1',
        unitNumber: 1,
        title: 'OS Overview, System Calls & Process Management',
        topics: [
          'OS Architecture: Monolithic vs Microkernel vs Hybrid',
          'Process Control Block (PCB) & Context Switching',
          'Process Scheduling algorithms: FCFS, SJF, SRTF, Round Robin, Multilevel Queue',
          'Inter-Process Communication (IPC): Shared Memory & Message Passing',
        ],
      },
      {
        id: 'u-os-2',
        unitNumber: 2,
        title: 'Process Synchronization & Deadlocks',
        topics: [
          'Critical Section Problem & Peterson Solution',
          'Hardware synchronization: TestAndSet, CompareAndSwap',
          'Mutex Locks & Counting Semaphores (Wait/Signal)',
          'Classical problems: Producer-Consumer, Readers-Writers, Dining Philosophers',
          'Deadlock characterization (Coffman conditions), Banker Algorithm & Prevention',
        ],
      },
      {
        id: 'u-os-3',
        unitNumber: 3,
        title: 'Memory Management & Virtual Memory',
        topics: [
          'Logical vs Physical address spaces, MMU translation',
          'Contiguous allocation, Internal vs External fragmentation',
          'Paging hardware, Page Table structures, Translation Lookaside Buffer (TLB)',
          'Virtual Memory & Demand Paging, Page Fault handling',
          'Page Replacement Algorithms: FIFO, Optimal, LRU, Second-Chance',
        ],
      },
      {
        id: 'u-os-4',
        unitNumber: 4,
        title: 'Storage Management & File Systems',
        topics: [
          'File concept, Directory structures, Access methods',
          'Allocation methods: Contiguous, Linked list, Indexed (i-nodes)',
          'Free-space management: Bit vector, Linked list',
          'Disk scheduling algorithms: FCFS, SSTF, SCAN, C-SCAN, LOOK',
        ],
      },
    ],
  },
  {
    id: 'sub-dbms',
    code: 'CS-303',
    name: 'Database Management Systems',
    branch: 'B.Tech CSE',
    semester: 5,
    university: 'Punjab Technical University (PTU)',
    examDate: getRelativeDate(30),
    targetMarks: 85,
    units: [
      {
        id: 'u-dbms-1',
        unitNumber: 1,
        title: 'ER Modeling & Relational Algebra',
        topics: [
          '3-tier ANSI-SPARC schema architecture & data independence',
          'Entity-Relationship (ER) model: Entities, Attributes, Relationships, Weak entities',
          'Relational Algebra operators: Select, Project, Join (Theta, Natural, Outer), Union, Set Difference',
        ],
      },
      {
        id: 'u-dbms-2',
        unitNumber: 2,
        title: 'SQL, Normalization & Relational Design',
        topics: [
          'Advanced SQL: Subqueries, Window functions, Joins, Aggregations',
          'Functional Dependencies & Armstrong Axioms',
          'Normal Forms: 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF)',
          'Lossless join decomposition & Dependency preservation checks',
        ],
      },
      {
        id: 'u-dbms-3',
        unitNumber: 3,
        title: 'Transaction Processing & Concurrency Control',
        topics: [
          'ACID properties and transaction state transition diagram',
          'Serializability: Conflict vs View serializability, Precedence Graphs',
          'Concurrency control: Two-Phase Locking (2PL), Strict 2PL, Timestamp ordering',
          'Deadlock handling in DBMS: Wait-Die vs Wound-Wait schemes',
        ],
      },
    ],
  },
];

export const initialQuestions: QuestionItem[] = [
  // 3-STAR QUESTIONS (High frequency in university previous-year papers)
  {
    id: 'q-dsa-1',
    subjectId: 'sub-dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 2,
    question: 'Explain AVL Tree rotations with diagrams. Construct an AVL tree by inserting the following sequence: 14, 17, 11, 7, 53, 4, 13.',
    expectedMarks: 10,
    stars: 3,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU Dec 2023', 'PTU May 2022', 'AKTU 2023', 'PTU Dec 2020'],
    repetitionCount: 4,
    keyTopics: ['AVL Trees', 'Rotations', 'Tree Balance'],
    modelAnswer: 'AVL Trees are self-balancing binary search trees where height difference |Height(L) - Height(R)| <= 1. Rotations restore balance:\n1. LL Rotation: Right rotate around root.\n2. RR Rotation: Left rotate around root.\n3. LR Rotation: Left rotate left child, then Right rotate root.\n4. RL Rotation: Right rotate right child, then Left rotate root.\nStep-by-step trace of inserts maintains balance factor after every step.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-dsa-2',
    subjectId: 'sub-dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 3,
    question: 'Differentiate between Dijkstra algorithm and Bellman-Ford algorithm. Solve single source shortest path for the given directed weighted graph starting from node A.',
    expectedMarks: 10,
    stars: 3,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU Dec 2022', 'PTU May 2021', 'VTU 2023'],
    repetitionCount: 3,
    keyTopics: ['Dijkstra', 'Bellman-Ford', 'Shortest Paths'],
    modelAnswer: 'Dijkstra uses a greedy approach with min-heap running in O((V + E) log V). It fails on negative weight cycles. Bellman-Ford uses dynamic programming relaxing all edges V-1 times in O(V*E), capable of detecting negative weight cycles.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-dsa-3',
    subjectId: 'sub-dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 5,
    question: 'Explain the 0/1 Knapsack problem using Dynamic Programming. Write the state transition recurrence relation and trace the DP matrix for weights [2, 3, 4, 5], values [3, 4, 5, 6], with knapsack capacity W = 5.',
    expectedMarks: 16,
    stars: 3,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU May 2023', 'PTU Dec 2021', 'AKTU 2022', 'PTU May 2019'],
    repetitionCount: 4,
    keyTopics: ['0/1 Knapsack', 'Dynamic Programming', 'Recurrence Relation'],
    modelAnswer: 'State: dp[i][w] is max value achievable using items 1..i and weight limit w.\nRecurrence:\n- If wt[i-1] > w: dp[i][w] = dp[i-1][w]\n- Else: dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w - wt[i-1]])\nDP Table dimensions (4+1) x (5+1). Final cell dp[4][5] = 7 (selecting items with wt 2 & 3, val 3+4=7).',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-os-1',
    subjectId: 'sub-os',
    subjectName: 'Operating Systems',
    unit: 2,
    question: 'State Coffman conditions for Deadlock. Explain Banker Algorithm for deadlock avoidance with safety algorithm pseudo-code and state transition matrix.',
    expectedMarks: 10,
    stars: 3,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU Dec 2023', 'PTU May 2022', 'PTU Dec 2021'],
    repetitionCount: 3,
    keyTopics: ['Coffman Conditions', 'Deadlock Avoidance', 'Banker Algorithm'],
    modelAnswer: 'The 4 simultaneous Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Banker algorithm maintains Allocation, Max, Available, and Need matrices. Safe state requires finding an execution vector where Work >= Need[i].',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-os-2',
    subjectId: 'sub-os',
    subjectName: 'Operating Systems',
    unit: 3,
    question: 'What is Belady Anomaly? Explain FIFO, LRU, and Optimal page replacement algorithms. Given page reference string: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2 with 3 page frames, calculate page faults for each.',
    expectedMarks: 16,
    stars: 3,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU Dec 2023', 'PTU May 2023', 'PTU Dec 2020', 'VTU 2022'],
    repetitionCount: 4,
    keyTopics: ['Page Replacement', 'Belady Anomaly', 'LRU vs FIFO'],
    modelAnswer: 'Belady anomaly is where increasing frame count leads to more page faults (occurs in FIFO, never in stack algorithms like LRU). For the given string: Optimal gives 9 page faults; LRU gives 12 page faults; FIFO gives 15 page faults.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-dbms-1',
    subjectId: 'sub-dbms',
    subjectName: 'Database Management Systems',
    unit: 2,
    question: 'Explain 1NF, 2NF, 3NF, and BCNF with concrete counterexamples and decomposition steps. Why is BCNF considered stricter than 3NF?',
    expectedMarks: 16,
    stars: 3,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU Dec 2023', 'PTU May 2022', 'AKTU 2023', 'PTU Dec 2021'],
    repetitionCount: 4,
    keyTopics: ['Normalization', 'BCNF vs 3NF', 'Functional Dependencies'],
    modelAnswer: '1NF: Atomic values only, no repeating groups. 2NF: 1NF + no partial dependency (non-prime attributes fully dependent on candidate keys). 3NF: 2NF + no transitive dependency (X->A requires X is superkey OR A is prime attribute). BCNF: For every FD X->A, X must be a superkey (no exceptions for prime attributes).',
    createdAt: '2026-10-01T00:00:00.000Z',
  },

  // 2-STAR QUESTIONS (Important medium priority)
  {
    id: 'q-dsa-4',
    subjectId: 'sub-dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 1,
    question: 'Write an algorithm to convert an infix mathematical expression to postfix using a stack. Trace for: (A + B) * (C - D) / E.',
    expectedMarks: 5,
    stars: 2,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU Dec 2022', 'PTU May 2020'],
    repetitionCount: 2,
    keyTopics: ['Stack Applications', 'Infix to Postfix'],
    modelAnswer: 'Precedence order: parenthesis, ^, (*, /), (+, -). Operands output immediately; operators pushed based on precedence; opening parenthesis pushed; closing parenthesis pops until matching opening parenthesis.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-dsa-5',
    subjectId: 'sub-dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 4,
    question: 'Explain QuickSort partitioning scheme (Lomuto vs Hoare). Derive its best, average, and worst case time complexity with recurrence relations.',
    expectedMarks: 10,
    stars: 2,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU May 2023', 'PTU Dec 2021'],
    repetitionCount: 2,
    keyTopics: ['QuickSort', 'Partitioning', 'Complexity Analysis'],
    modelAnswer: 'Best case T(N) = 2T(N/2) + O(N) -> O(N log N). Worst case when pivot is always smallest/largest T(N) = T(N-1) + O(N) -> O(N^2). Randomized pivot avoids worst case on pre-sorted arrays.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-os-3',
    subjectId: 'sub-os',
    subjectName: 'Operating Systems',
    unit: 1,
    question: 'Explain Round Robin CPU scheduling. Given 4 processes P1(burst=5), P2(burst=3), P3(burst=8), P4(burst=6) with time quantum = 2ms, draw the Gantt chart and compute average turnaround and waiting times.',
    expectedMarks: 10,
    stars: 2,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU Dec 2022', 'PTU May 2021'],
    repetitionCount: 2,
    keyTopics: ['CPU Scheduling', 'Round Robin', 'Gantt Chart'],
    modelAnswer: 'Processes executed in circular FIFO order for up to time quantum. Ready queue: P1, P2, P3, P4. Gantt chart computed in 2ms slices until completion. Average Waiting Time = 9.25ms.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-dbms-2',
    subjectId: 'sub-dbms',
    subjectName: 'Database Management Systems',
    unit: 3,
    question: 'Explain Two-Phase Locking (2PL) protocol. Contrast Basic 2PL, Conservative 2PL, and Strict 2PL regarding cascading rollbacks.',
    expectedMarks: 5,
    stars: 2,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU May 2023', 'AKTU 2022'],
    repetitionCount: 2,
    keyTopics: ['Concurrency Control', '2PL', 'Serializability'],
    modelAnswer: '2PL ensures conflict serializability by dividing lock operations into Growing Phase (locks acquired, none released) and Shrinking Phase (locks released, none acquired). Strict 2PL holds exclusive locks until commit/abort, guaranteeing freedom from cascading aborts.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },

  // 1-STAR QUESTIONS (Occasional / Lower priority)
  {
    id: 'q-dsa-6',
    subjectId: 'sub-dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 1,
    question: 'Define Priority Queue and explain how a Min-Heap efficiently implements priority queue operations with complexity.',
    expectedMarks: 5,
    stars: 1,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU May 2019'],
    repetitionCount: 1,
    keyTopics: ['Priority Queue', 'Min-Heap', 'Heapify'],
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-os-4',
    subjectId: 'sub-os',
    subjectName: 'Operating Systems',
    unit: 4,
    question: 'Compare SCAN, C-SCAN, and LOOK disk arm scheduling algorithms with a diagram illustrating track travel.',
    expectedMarks: 5,
    stars: 1,
    isVerifiedPYQ: true,
    sourcePapers: ['PTU Dec 2020'],
    repetitionCount: 1,
    keyTopics: ['Disk Scheduling', 'SCAN', 'C-SCAN'],
    createdAt: '2026-10-01T00:00:00.000Z',
  },

  // NO-STAR QUESTIONS (General syllabus practice & concept revision)
  {
    id: 'q-dsa-7',
    subjectId: 'sub-dsa',
    subjectName: 'Data Structures & Algorithms',
    unit: 4,
    question: 'What is Quadratic Probing in open addressing hash tables? How does it alleviate primary clustering?',
    expectedMarks: 2,
    stars: 0,
    isVerifiedPYQ: false,
    repetitionCount: 0,
    keyTopics: ['Hashing', 'Open Addressing', 'Quadratic Probing'],
    modelAnswer: 'Quadratic probing calculates probe index: hash(k, i) = (hash(k) + c1*i + c2*i^2) % table_size. Because step size increases quadratically with i, keys hashing to adjacent slots do not follow identical probe sequences.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-os-5',
    subjectId: 'sub-os',
    subjectName: 'Operating Systems',
    unit: 1,
    question: 'What is a system call? Explain the difference between user mode and kernel mode CPU execution rings.',
    expectedMarks: 2,
    stars: 0,
    isVerifiedPYQ: false,
    repetitionCount: 0,
    keyTopics: ['System Calls', 'Dual Mode', 'Kernel Ring'],
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'q-dbms-3',
    subjectId: 'sub-dbms',
    subjectName: 'Database Management Systems',
    unit: 1,
    question: 'What is physical data independence? How does the three-schema database architecture ensure it?',
    expectedMarks: 2,
    stars: 0,
    isVerifiedPYQ: false,
    repetitionCount: 0,
    keyTopics: ['Data Independence', '3-Tier Architecture'],
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

export const initialCrashPlan: CrashStudyPlan = {
  id: 'crash-dsa-2026',
  subjectId: 'sub-dsa',
  subjectName: 'Data Structures & Algorithms',
  examDate: getRelativeDate(18),
  daysRemaining: 18,
  dailyHours: 4,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  days: [
    {
      dayNumber: 1,
      date: getRelativeDate(0),
      theme: 'Day 1 Kickoff: Trees & AVL Rotations Masterclass (Unit 2)',
      targetMinutes: 240,
      tasks: [
        {
          id: 'ct-1-1',
          dayNumber: 1,
          date: getRelativeDate(0),
          topic: 'Review AVL Tree balance factors & practice LL, RR, LR, RL rotations',
          unit: 2,
          durationMinutes: 90,
          type: 'study',
          completed: true,
          missed: false,
          completedAt: getRelativeDate(0),
        },
        {
          id: 'ct-1-2',
          dayNumber: 1,
          date: getRelativeDate(0),
          topic: 'Solve 3-Star PYQ: AVL Tree insertion from PTU Dec 2023 paper',
          unit: 2,
          durationMinutes: 60,
          type: 'practice_questions',
          completed: true,
          missed: false,
          completedAt: getRelativeDate(0),
        },
        {
          id: 'ct-1-3',
          dayNumber: 1,
          date: getRelativeDate(0),
          topic: 'B-Tree & B+ Tree property comparisons for indexing',
          unit: 2,
          durationMinutes: 45,
          type: 'revision',
          completed: false,
          missed: false,
        },
        {
          id: 'ct-1-4',
          dayNumber: 1,
          date: getRelativeDate(0),
          topic: 'Unit 2 Quick Check: 15-minute diagnostic self-test',
          unit: 2,
          durationMinutes: 45,
          type: 'mock_test',
          completed: false,
          missed: false,
        },
      ],
    },
    {
      dayNumber: 2,
      date: getRelativeDate(1),
      theme: 'Day 2: Graph Shortest Paths & Spanning Trees (Unit 3)',
      targetMinutes: 240,
      tasks: [
        {
          id: 'ct-2-1',
          dayNumber: 2,
          date: getRelativeDate(1),
          topic: 'Dijkstra vs Bellman-Ford algorithm complexity & negative weight rules',
          unit: 3,
          durationMinutes: 75,
          type: 'study',
          completed: false,
          missed: false,
        },
        {
          id: 'ct-2-2',
          dayNumber: 2,
          date: getRelativeDate(1),
          topic: 'Solve Minimum Spanning Tree: Prim and Kruskal with disjoint-set union',
          unit: 3,
          durationMinutes: 75,
          type: 'practice_questions',
          completed: false,
          missed: false,
        },
        {
          id: 'ct-2-3',
          dayNumber: 2,
          date: getRelativeDate(1),
          topic: 'Graph traversal revision: BFS vs DFS applications (Cycle & Bipartite check)',
          unit: 3,
          durationMinutes: 50,
          type: 'revision',
          completed: false,
          missed: false,
        },
        {
          id: 'ct-2-4',
          dayNumber: 2,
          date: getRelativeDate(1),
          topic: '2-Star PYQ: Graph traversal and cycle detection proofs',
          unit: 3,
          durationMinutes: 40,
          type: 'practice_questions',
          completed: false,
          missed: false,
        },
      ],
    },
    {
      dayNumber: 3,
      date: getRelativeDate(2),
      theme: 'Day 3: Dynamic Programming Core Patterns (Unit 5)',
      targetMinutes: 240,
      tasks: [
        {
          id: 'ct-3-1',
          dayNumber: 3,
          date: getRelativeDate(2),
          topic: '0/1 Knapsack recurrence derivation & matrix backtracking for item selection',
          unit: 5,
          durationMinutes: 90,
          type: 'study',
          completed: false,
          missed: false,
        },
        {
          id: 'ct-3-2',
          dayNumber: 3,
          date: getRelativeDate(2),
          topic: 'Longest Common Subsequence (LCS) DP table trace & string reconstruction',
          unit: 5,
          durationMinutes: 75,
          type: 'practice_questions',
          completed: false,
          missed: false,
        },
        {
          id: 'ct-3-3',
          dayNumber: 3,
          date: getRelativeDate(2),
          topic: 'Greedy vs DP comparative analysis (Fractional vs 0/1 Knapsack)',
          unit: 5,
          durationMinutes: 45,
          type: 'revision',
          completed: false,
          missed: false,
        },
        {
          id: 'ct-3-4',
          dayNumber: 3,
          date: getRelativeDate(2),
          topic: 'Full 16-Mark DP mock exam question timed write-up',
          unit: 5,
          durationMinutes: 30,
          type: 'mock_test',
          completed: false,
          missed: false,
        },
      ],
    },
  ],
};

export const initialTestAttempts: TestAttemptRecord[] = [
  {
    id: 'test-att-1',
    mode: 'handwritten',
    subjectName: 'Data Structures & Algorithms',
    unit: 2,
    question: 'Construct an AVL tree for the keys: 14, 17, 11, 7, 53, 4, 13. State rotations clearly.',
    studentAnswer: '[Answer Sheet Photo Uploaded: 2 pages analyzed with OCR & Step Verification]',
    maxMarks: 10,
    marksObtained: 8.5,
    percentage: 85,
    stepEvaluation: [
      {
        stepNumber: 1,
        stepDescription: 'Insert 14, 17, 11 - Initial balanced BST setup',
        status: 'correct',
        marksAwarded: 2,
        maxMarks: 2,
        feedback: 'Correct root 14 with children 11 and 17. Balance factor is 0 across all nodes.',
      },
      {
        stepNumber: 2,
        stepDescription: 'Insert 7 and detect Left-Left imbalance on node 11',
        status: 'correct',
        marksAwarded: 2.5,
        maxMarks: 2.5,
        feedback: 'Node 11 balance factor becomes +2. LL rotation performed cleanly with node 7.',
      },
      {
        stepNumber: 3,
        stepDescription: 'Insert 53 and 4 with subsequent rotation',
        status: 'partial',
        marksAwarded: 2,
        maxMarks: 3,
        feedback: 'Tree diagram after inserting 4 is mostly correct, but the balance factor of node 14 (+2) was not labeled before rotation.',
      },
      {
        stepNumber: 4,
        stepDescription: 'Final AVL tree layout with node 13',
        status: 'correct',
        marksAwarded: 2,
        maxMarks: 2.5,
        feedback: 'Final root 14 with height 3. Clean structure matches textbook solution.',
      },
    ],
    strengths: [
      'Accurate identification of LL rotation triggers',
      'Clean step-by-step sub-trees drawn clearly',
      'Final tree satisfies AVL invariant for all 7 keys',
    ],
    mistakes: [
      'Forgot to write explicit numerical balance factors (+2 / -1) beside nodes in Step 3',
      'Slight ambiguity in node label 13 vs 18; confirmed as 13 from context',
    ],
    explanation: 'Overall strong university-level answer sheet. To secure full 10/10 marks in PTU/AKTU semester evaluations, write the formula Balance Factor = Height(Left) - Height(Right) in the margin for every flagged node.',
    handwritingConfidence: 94,
    evaluatedAt: getRelativeDate(-1),
  },
  {
    id: 'test-att-2',
    mode: 'viva',
    subjectName: 'Operating Systems',
    unit: 2,
    question: 'What is the Critical Section Problem, and what three conditions must any valid solution satisfy?',
    studentAnswer: 'The critical section is the code segment where shared variables are accessed. Any solution must satisfy mutual exclusion, progress, and bounded waiting.',
    maxMarks: 5,
    marksObtained: 4.5,
    percentage: 90,
    stepEvaluation: [
      {
        stepNumber: 1,
        stepDescription: 'Definition of Critical Section',
        status: 'correct',
        marksAwarded: 1.5,
        maxMarks: 1.5,
        feedback: 'Accurate definition regarding shared resources and race conditions.',
      },
      {
        stepNumber: 2,
        stepDescription: 'Three Essential Criteria named',
        status: 'correct',
        marksAwarded: 2,
        maxMarks: 2,
        feedback: 'Named Mutual Exclusion, Progress, and Bounded Waiting precisely.',
      },
      {
        stepNumber: 3,
        stepDescription: 'Explanation of Bounded Waiting',
        status: 'partial',
        marksAwarded: 1,
        maxMarks: 1.5,
        feedback: 'Briefly missed stating that bounded waiting guarantees a limit on process starvation.',
      },
    ],
    strengths: [
      'Immediate, confident recall of synchronization principles',
      'Accurate technical terminology',
    ],
    mistakes: [
      'Could have mentioned Peterson algorithm or hardware TestAndSet as an illustrative example',
    ],
    explanation: 'Excellent viva response. Standard technical interview and university viva grade.',
    evaluatedAt: getRelativeDate(-2),
  },
];

export const initialInterviewReports: InterviewReport[] = [
  {
    id: 'rep-cse-01',
    branch: 'B.Tech CSE',
    domain: 'Full-Stack Software Engineering & Core CS',
    difficulty: 'Intermediate',
    messages: [
      {
        id: 'msg-1',
        sender: 'ai',
        text: 'Welcome Alex. Let us start with Round 1: Core Fundamentals. Can you explain the difference between Process and Thread, and how OS context switching overhead differs between the two?',
        timestamp: '2026-10-27T10:00:00.000Z',
        round: 'fundamentals',
        turnIndex: 1,
      },
      {
        id: 'msg-2',
        sender: 'student',
        text: 'A process is an executing program with its own address space, PCB, and file descriptors. A thread is the smallest unit of CPU scheduling that shares code, data, and heap with peer threads within the same process. Context switching between processes requires saving registers, flushing the MMU page table cache (TLB invalidation), making it expensive. Thread switching within the same process does not flush the TLB or switch page tables, so it has much lower overhead.',
        timestamp: '2026-10-27T10:01:30.000Z',
        round: 'fundamentals',
        turnIndex: 1,
      },
      {
        id: 'msg-3',
        sender: 'ai',
        text: 'Spot-on explanation regarding TLB invalidation and address spaces. Now moving to Round 2: Technical Design. Suppose our web service has 100,000 requests per minute accessing a product catalog. What caching layer would you introduce, and how would you prevent cache stampede / dogpiling when a popular cache key expires?',
        timestamp: '2026-10-27T10:02:00.000Z',
        round: 'technical_logical',
        turnIndex: 2,
      },
      {
        id: 'msg-4',
        sender: 'student',
        text: 'I would use Redis as an in-memory distributed cache with LRU eviction. To prevent cache stampede, I would use two strategies: first, probabilistic early expiration (XFetch algorithm) where background workers refresh keys before true TTL. Second, a distributed mutex lock (Redlock or SETNX) so only one worker queries the database to recompute the cache while other incoming requests wait or read slightly stale data.',
        timestamp: '2026-10-27T10:04:15.000Z',
        round: 'technical_logical',
        turnIndex: 2,
      },
    ],
    overallTechnicalScore: 88,
    overallCommunicationScore: 92,
    readinessRating: 'Ready for Placement',
    strengths: [
      'Crisp low-level systems knowledge (TLB flushing and memory spaces)',
      'Modern distributed architecture intuition (Redis, distributed locks, XFetch)',
      'Concise, structured delivery without filler phrases',
    ],
    areasForImprovement: [
      'Could expand on trade-offs between Redis single-threaded event loop vs multi-threaded cluster sharding',
      'Add quantitative benchmarks when discussing high-throughput latency targets',
    ],
    practiceRoadmap: [
      'Practice System Design round: Design a Distributed Rate Limiter',
      'Review CAP Theorem trade-offs in Distributed Databases',
      'Solve 5 Graph Cycle Detection questions before campus placement drives',
    ],
    completedAt: getRelativeDate(-1),
  },
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Upcoming Exam Countdown',
    message: 'Data Structures & Algorithms exam is in 18 days. Review 3★ AVL Tree PYQs.',
    type: 'exam_countdown',
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: 'planner',
  },
  {
    id: 'notif-2',
    title: 'Daily Study Briefing Ready',
    message: 'Your 4-hour daily study block is scheduled today: 2 concept topics and 1 PYQ practice session.',
    type: 'daily_briefing',
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: 'planner',
  },
  {
    id: 'notif-3',
    title: 'Copy Checking Ready',
    message: 'Upload photos of handwritten answers or try viva to get instant grading against exam rubrics.',
    type: 'study_session',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true,
    actionUrl: 'tests',
  },
];

// Multi-Level Starter Curriculum Presets
export const starterSchoolClass12Subjects: StudentSubject[] = [
  {
    id: 'sub-school-phy',
    code: 'PHY-12',
    name: 'Physics (Class 12)',
    educationLevel: 'school',
    courseOrClass: 'Class 12',
    branchOrStream: 'Science (PCM/PCB)',
    boardOrUniversity: 'CBSE / State Board',
    examDate: getRelativeDate(28),
    targetMarks: 95,
    units: [
      {
        id: 'u-phy-1',
        unitNumber: 1,
        title: 'Electrostatics & Electric Fields',
        topics: ['Coulombs Law', 'Electric Field and Dipole', 'Gausss Theorem & Applications', 'Capacitance & Energy Stored'],
      },
      {
        id: 'u-phy-2',
        unitNumber: 2,
        title: 'Current Electricity & Circuits',
        topics: ['Ohms Law & Drift Velocity', 'Kirchhoffs Laws & Wheatstone Bridge', 'Potentiometer & Meter Bridge', 'Internal Resistance of Cells'],
      },
      {
        id: 'u-phy-3',
        unitNumber: 3,
        title: 'Electromagnetic Induction & AC',
        topics: ['Faradays Laws & Lenzs Law', 'Eddy Currents & Self/Mutual Inductance', 'LCR Series Circuit & Resonance', 'Transformers & AC Generator'],
      },
      {
        id: 'u-phy-4',
        unitNumber: 4,
        title: 'Optics: Wave & Ray Optics',
        topics: ['Total Internal Reflection & Lenses', 'Wavefront & Huygens Principle', 'Youngs Double Slit Experiment', 'Diffraction & Polarization'],
      },
    ],
  },
  {
    id: 'sub-school-chem',
    code: 'CHEM-12',
    name: 'Chemistry (Class 12)',
    educationLevel: 'school',
    courseOrClass: 'Class 12',
    branchOrStream: 'Science (PCM/PCB)',
    boardOrUniversity: 'CBSE / State Board',
    examDate: getRelativeDate(35),
    targetMarks: 92,
    units: [
      {
        id: 'u-chem-1',
        unitNumber: 1,
        title: 'Solutions & Colligative Properties',
        topics: ['Raoults Law & Henrys Law', 'Elevation in Boiling Point', 'Depression in Freezing Point', 'Vant Hoff Factor'],
      },
      {
        id: 'u-chem-2',
        unitNumber: 2,
        title: 'Electrochemistry & Chemical Kinetics',
        topics: ['Nernst Equation & Gibbs Energy', 'Kohlrauschs Law', 'Integrated Rate Equations (Zero & First Order)', 'Arrhenius Equation & Activation Energy'],
      },
      {
        id: 'u-chem-3',
        unitNumber: 3,
        title: 'Organic Chemistry: Haloalkanes & Alcohols',
        topics: ['SN1 and SN2 Reaction Mechanisms', 'Lucas Test & Reimer-Tiemann Reaction', 'Aldol Condensation & Cannizzaro Reaction', 'Carboxylic Acid Derivations'],
      },
    ],
  },
  {
    id: 'sub-school-math',
    code: 'MATH-12',
    name: 'Mathematics (Class 12)',
    educationLevel: 'school',
    courseOrClass: 'Class 12',
    branchOrStream: 'Science (PCM)',
    boardOrUniversity: 'CBSE / State Board',
    examDate: getRelativeDate(42),
    targetMarks: 90,
    units: [
      {
        id: 'u-math-1',
        unitNumber: 1,
        title: 'Calculus: Continuity & Differentiation',
        topics: ['Chain Rule & Implicit Differentiation', 'Rolle & Mean Value Theorem', 'Maxima and Minima Word Problems', 'Increasing & Decreasing Functions'],
      },
      {
        id: 'u-math-2',
        unitNumber: 2,
        title: 'Integrals & Differential Equations',
        topics: ['Integration by Parts & Partial Fractions', 'Definite Integrals Properties', 'Area Under Curves', 'Separable & Linear Differential Equations'],
      },
      {
        id: 'u-math-3',
        unitNumber: 3,
        title: 'Vectors & 3-Dimensional Geometry',
        topics: ['Dot & Cross Product Properties', 'Direction Cosines & Ratios', 'Shortest Distance Between Skew Lines', 'Equation of Planes'],
      },
    ],
  },
];

export const starterNursingSubjects: StudentSubject[] = [
  {
    id: 'sub-nursing-anat',
    code: 'NURS-101',
    name: 'Applied Anatomy & Physiology',
    educationLevel: 'medical_health',
    courseOrClass: 'B.Sc Nursing',
    branchOrStream: 'Nursing & Health Sciences',
    boardOrUniversity: 'State Medical University / INC',
    examDate: getRelativeDate(30),
    targetMarks: 85,
    units: [
      {
        id: 'u-nurs-1',
        unitNumber: 1,
        title: 'Cardiovascular & Lymphatic System',
        topics: ['Structure of Heart & Cardiac Cycle', 'Systemic and Pulmonary Circulation', 'Conduction System & ECG Waveforms', 'Blood Groups and Lymph Nodes'],
      },
      {
        id: 'u-nurs-2',
        unitNumber: 2,
        title: 'Respiratory & Digestive Anatomy',
        topics: ['Anatomy of Lungs and Trachea', 'Mechanism of Respiration & Gas Exchange', 'GI Tract histology and digestive enzymes', 'Liver, Gallbladder and Pancreas functions'],
      },
      {
        id: 'u-nurs-3',
        unitNumber: 3,
        title: 'Nervous & Endocrine Physiology',
        topics: ['Central and Peripheral Nervous System', 'Reflex Arc and Action Potential', 'Pituitary, Thyroid and Adrenal Hormones', 'Regulation of Blood Glucose and Calcium'],
      },
    ],
  },
  {
    id: 'sub-nursing-found',
    code: 'NURS-102',
    name: 'Nursing Foundation & Patient Care',
    educationLevel: 'medical_health',
    courseOrClass: 'B.Sc Nursing',
    branchOrStream: 'Nursing & Health Sciences',
    boardOrUniversity: 'State Medical University / INC',
    examDate: getRelativeDate(38),
    targetMarks: 88,
    units: [
      {
        id: 'u-nurs-f1',
        unitNumber: 1,
        title: 'Vital Signs & Clinical Assessment',
        topics: ['Temperature, Pulse, Respiration and BP techniques', 'Infection Prevention & Aseptic technique', 'CPR guidelines & Emergency Triaging', 'Documentation and SBAR handover'],
      },
      {
        id: 'u-nurs-f2',
        unitNumber: 2,
        title: 'Medication Administration & Safety',
        topics: ['Ten Rights of Drug Administration', 'Oral, IV, IM, and Subcutaneous routes', 'Dosage calculations and metric conversions', 'Adverse drug reaction monitoring'],
      },
    ],
  },
];

export const starterBComSubjects: StudentSubject[] = [
  {
    id: 'sub-bcom-acc',
    code: 'BCOM-201',
    name: 'Financial Accounting & Corporate Reporting',
    educationLevel: 'college',
    courseOrClass: 'B.Com',
    branchOrStream: 'Commerce & Accountancy',
    boardOrUniversity: 'University Commerce Faculty',
    examDate: getRelativeDate(24),
    targetMarks: 85,
    units: [
      {
        id: 'u-bcom-1',
        unitNumber: 1,
        title: 'Corporate Financial Statements',
        topics: ['Schedule III Balance Sheet formulation', 'Cash Flow Statement (AS-3 Direct vs Indirect)', 'Issue & Forfeiture of Shares', 'Redemption of Preference Shares'],
      },
      {
        id: 'u-bcom-2',
        unitNumber: 2,
        title: 'Partnership & Amalgamation Accounts',
        topics: ['Admission, Retirement and Death of Partner', 'Dissolution and Realisation Account', 'Amalgamation of Firms', 'Goodwill valuation methods'],
      },
    ],
  },
  {
    id: 'sub-bcom-law',
    code: 'BCOM-202',
    name: 'Business Regulatory Framework & Law',
    educationLevel: 'college',
    courseOrClass: 'B.Com',
    branchOrStream: 'Commerce & Accountancy',
    boardOrUniversity: 'University Commerce Faculty',
    examDate: getRelativeDate(32),
    targetMarks: 80,
    units: [
      {
        id: 'u-bcom-l1',
        unitNumber: 1,
        title: 'Indian Contract Act 1872',
        topics: ['Essential elements of valid contract', 'Offer and Acceptance rules', 'Free Consent (Coercion, Undue Influence, Fraud)', 'Breach of Contract & Remedies'],
      },
      {
        id: 'u-bcom-l2',
        unitNumber: 2,
        title: 'Sale of Goods & Consumer Protection',
        topics: ['Conditions vs Warranties', 'Doctrine of Caveat Emptor & Exceptions', 'Consumer Protection Act 2019 rights', 'Dispute Redressal Commissions'],
      },
    ],
  },
];

export function getStarterSubjectsForLevel(level: EducationLevel): StudentSubject[] {
  switch (level) {
    case 'school':
      return starterSchoolClass12Subjects;
    case 'medical_health':
    case 'nursing':
      return starterNursingSubjects;
    case 'college':
      return starterBComSubjects;
    case 'engineering':
    case 'diploma':
    case 'competitive':
    default:
      return initialSubjects;
  }
}
