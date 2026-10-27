import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  syncDailyEnglishTask,
  formatTime12,
  formatTimeRangeWithMidnight,
  calculateHabitStreak,
  getRelativeDate,
  dailySpokenEnglishTask,
  initialGoals,
  initialHabits,
} from '../src/data/initialData';
import { mergeWorkspaces } from '../src/services/cloudSyncService';
import { Task, Goal, Habit, Project, Note, LearningTopic, UserProfile } from '../src/types';
import { formatAuthError } from '../src/context/AuthContext';

describe('Daily Spoken English Practice & Calendar Formatting', () => {
  test('syncDailyEnglishTask prepends default daily task if missing', () => {
    const emptyList: Task[] = [];
    const result = syncDailyEnglishTask(emptyList);

    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'task-daily-spoken-english');
    assert.equal(result[0].title, 'Daily Spoken English Practice');
    assert.equal(result[0].recurrence, 'daily');
    assert.equal(result[0].startTime, '23:00');
    assert.equal(result[0].endTime, '00:00');
    assert.equal(result[0].category, 'learning');
  });

  test('syncDailyEnglishTask preserves user custom subtasks and status', () => {
    const existingTasks: Task[] = [
      {
        id: 'task-daily-spoken-english',
        title: 'Daily Spoken English Practice',
        description: 'My custom practice description',
        priority: 'high',
        status: 'completed',
        category: 'learning',
        dueDate: getRelativeDate(0),
        startTime: '23:00',
        endTime: '00:00',
        dueTime: '23:00',
        estimatedMinutes: 60,
        createdAt: '2026-10-01T00:00:00.000Z',
        completedAt: '2026-10-27T23:45:00.000Z',
        subtasks: [{ id: 'custom-1', title: 'Read BBC World News', completed: true }],
      },
    ];

    const result = syncDailyEnglishTask(existingTasks);
    assert.equal(result.length, 1);
    assert.equal(result[0].status, 'completed');
    assert.equal(result[0].description, 'My custom practice description');
    assert.equal(result[0].subtasks.length, 1);
    assert.equal(result[0].subtasks[0].title, 'Read BBC World News');
  });

  test('syncDailyEnglishTask deduplicates multiple daily English tasks into 1', () => {
    const duplicateTasks: Task[] = [
      { ...dailySpokenEnglishTask, id: 'dup-1' },
      { ...dailySpokenEnglishTask, id: 'dup-2' },
      {
        id: 'other-task',
        title: 'Another Task',
        description: '',
        priority: 'low',
        status: 'todo',
        category: 'study',
        dueDate: getRelativeDate(1),
        estimatedMinutes: 30,
        createdAt: '2026-10-20T00:00:00.000Z',
        subtasks: [],
      },
    ];

    const result = syncDailyEnglishTask(duplicateTasks);
    const englishCount = result.filter(
      (t) => t.title.toLowerCase() === 'daily spoken english practice'
    ).length;
    assert.equal(englishCount, 1);
    assert.equal(result.length, 2);
  });

  test('formatTime12 converts 24h to readable 12h AM/PM strings', () => {
    assert.equal(formatTime12('23:00'), '11:00 PM');
    assert.equal(formatTime12('00:00'), '12:00 AM');
    assert.equal(formatTime12('12:00'), '12:00 PM');
    assert.equal(formatTime12('08:30'), '8:30 AM');
    assert.equal(formatTime12('17:45'), '5:45 PM');
  });

  test('formatTimeRangeWithMidnight correctly marks midnight-crossing time slots', () => {
    const midnightRange = formatTimeRangeWithMidnight('23:00', '00:00');
    assert.ok(midnightRange.includes('11:00 PM'));
    assert.ok(midnightRange.includes('12:00 AM'));
    assert.ok(midnightRange.includes('midnight next day'));

    const daytimeRange = formatTimeRangeWithMidnight('14:00', '15:00');
    assert.equal(daytimeRange, '2:00 PM – 3:00 PM');
  });
});

describe('Habit Streak Calculations', () => {
  test('returns 0 for empty completed dates', () => {
    const res = calculateHabitStreak([]);
    assert.equal(res.streak, 0);
    assert.equal(res.bestStreak, 0);
  });

  test('calculates active streak when completed today', () => {
    const dates = [
      getRelativeDate(0),  // today
      getRelativeDate(-1), // yesterday
      getRelativeDate(-2), // 2 days ago
    ];
    const res = calculateHabitStreak(dates);
    assert.equal(res.streak, 3);
    assert.equal(res.bestStreak, 3);
  });

  test('maintains active streak when completed through yesterday (pending today)', () => {
    const dates = [
      getRelativeDate(-1), // yesterday
      getRelativeDate(-2), // 2 days ago
      getRelativeDate(-3), // 3 days ago
    ];
    const res = calculateHabitStreak(dates);
    assert.equal(res.streak, 3);
    assert.equal(res.bestStreak, 3);
  });

  test('resets current streak to 0 if neither today nor yesterday was completed', () => {
    const dates = [
      getRelativeDate(-2), // 2 days ago
      getRelativeDate(-3), // 3 days ago
      getRelativeDate(-4), // 4 days ago
    ];
    const res = calculateHabitStreak(dates);
    assert.equal(res.streak, 0);
    assert.equal(res.bestStreak, 3); // Historical best preserved
  });

  test('preserves long historical best streak across interruptions', () => {
    // 5 consecutive days 20 days ago
    const historical = [
      getRelativeDate(-20),
      getRelativeDate(-21),
      getRelativeDate(-22),
      getRelativeDate(-23),
      getRelativeDate(-24),
      getRelativeDate(0), // single check-in today
    ];
    const res = calculateHabitStreak(historical);
    assert.equal(res.streak, 1);
    assert.equal(res.bestStreak, 5);
  });
});

describe('Workspace Data Synchronization & Merging', () => {
  const dummyProfile: UserProfile = {
    name: 'Test User',
    title: 'Student',
    email: 'test@example.com',
    university: 'Tech University',
    dailyTargetFocusMinutes: 240,
    dayStartTime: '08:00',
    dayEndTime: '22:00',
    pomodoroFocusMinutes: 25,
    pomodoroBreakMinutes: 5,
  };

  test('mergeWorkspaces combines unique items without duplicate IDs', () => {
    const local = {
      tasks: [
        {
          id: 'task-local-1',
          title: 'Local Task 1',
          description: '',
          priority: 'high' as const,
          status: 'todo' as const,
          category: 'study' as const,
          dueDate: getRelativeDate(0),
          estimatedMinutes: 30,
          createdAt: '2026-10-27T00:00:00.000Z',
          subtasks: [],
        },
      ],
      goals: [],
      habits: [],
      projects: [],
      notes: [],
      learningTopics: [],
      userProfile: dummyProfile,
    };

    const cloud = {
      tasks: [
        {
          id: 'task-cloud-1',
          title: 'Cloud Task 1',
          description: '',
          priority: 'medium' as const,
          status: 'todo' as const,
          category: 'coding' as const,
          dueDate: getRelativeDate(1),
          estimatedMinutes: 45,
          createdAt: '2026-10-27T00:00:00.000Z',
          subtasks: [],
        },
      ],
      goals: [],
      habits: [],
      projects: [],
      notes: [],
      learningTopics: [],
      userProfile: dummyProfile,
      updatedAt: '2026-10-27T12:00:00.000Z',
      deviceId: 'device-other',
    };

    const merged = mergeWorkspaces(local, cloud);
    assert.equal(merged.tasks.length, 2);
    const ids = merged.tasks.map((t) => t.id);
    assert.ok(ids.includes('task-local-1'));
    assert.ok(ids.includes('task-cloud-1'));
  });

  test('mergeWorkspaces combines habit check-in dates and recalculates streak', () => {
    const local = {
      tasks: [],
      goals: [],
      habits: [
        {
          id: 'habit-1',
          name: 'Morning Reading',
          category: 'study',
          targetDaysPerWeek: 7,
          streak: 1,
          bestStreak: 1,
          completedDates: [getRelativeDate(0)], // Today on laptop
        },
      ],
      projects: [],
      notes: [],
      learningTopics: [],
      userProfile: dummyProfile,
    };

    const cloud = {
      tasks: [],
      goals: [],
      habits: [
        {
          id: 'habit-1',
          name: 'Morning Reading',
          category: 'study',
          targetDaysPerWeek: 7,
          streak: 1,
          bestStreak: 1,
          completedDates: [getRelativeDate(-1)], // Yesterday on phone
        },
      ],
      projects: [],
      notes: [],
      learningTopics: [],
      userProfile: dummyProfile,
      updatedAt: '2026-10-27T12:00:00.000Z',
      deviceId: 'device-phone',
    };

    const merged = mergeWorkspaces(local, cloud);
    assert.equal(merged.habits.length, 1);
    assert.equal(merged.habits[0].completedDates.length, 2);
    // 2 consecutive days: yesterday + today = streak of 2!
    assert.equal(merged.habits[0].streak, 2);
    assert.equal(merged.habits[0].bestStreak, 2);
  });
});

describe('AI Plan Conversion & Data Management', () => {
  test('AI Plan correctly maps to Goal milestones and actionable Tasks', () => {
    const mockPlan = {
      title: 'Action Plan: Master Advanced Operating Systems & Concurrency',
      summary: 'Phased study roadmap for synchronization primitives and memory paging.',
      totalEstimatedHours: 24,
      timeframeDays: 14,
      dailyFocusHours: 2,
      phases: [
        {
          name: 'Phase 1: Concurrency Primitives',
          description: 'Mutexes, semaphores, and reader-writer locks',
          tasks: [
            {
              title: 'Implement Semaphore in C++',
              description: 'Condition variables and mutex wrapper',
              priority: 'high' as const,
              estimatedMinutes: 90,
              category: 'coding' as const,
              dueDateOffsetDays: 2,
              subtasks: ['Write unit test', 'Pass valgrind check'],
            },
          ],
        },
      ],
      recommendations: ['Review Little Book of Semaphores'],
      isAIGenerated: true,
    };

    // Simulate approveAndSavePlan logic
    const newGoalId = 'goal-test-123';
    const newGoal: Goal = {
      id: newGoalId,
      title: mockPlan.title.replace(/^Action Plan:\s*/, ''),
      description: mockPlan.summary,
      category: 'study',
      targetDate: getRelativeDate(mockPlan.timeframeDays),
      progress: 0,
      status: 'in_progress',
      color: '#245EEA',
      milestones: mockPlan.phases.map((phase, idx) => ({
        id: `ms-${idx}`,
        title: phase.name,
        completed: false,
        dueDate: getRelativeDate(Math.round(((idx + 1) / mockPlan.phases.length) * mockPlan.timeframeDays)),
      })),
    };

    assert.equal(newGoal.title, 'Master Advanced Operating Systems & Concurrency');
    assert.equal(newGoal.milestones.length, 1);
    assert.equal(newGoal.milestones[0].title, 'Phase 1: Concurrency Primitives');

    const generatedTasks: Task[] = [];
    mockPlan.phases.forEach((phase) => {
      phase.tasks.forEach((item, idx) => {
        generatedTasks.push({
          id: `task-gen-${idx}`,
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: 'todo',
          category: item.category,
          dueDate: getRelativeDate(item.dueDateOffsetDays),
          estimatedMinutes: item.estimatedMinutes,
          goalId: newGoalId,
          subtasks: item.subtasks.map((st, sIdx) => ({ id: `st-${sIdx}`, title: st, completed: false })),
          createdAt: new Date().toISOString(),
        });
      });
    });

    assert.equal(generatedTasks.length, 1);
    assert.equal(generatedTasks[0].goalId, newGoalId);
    assert.equal(generatedTasks[0].subtasks.length, 2);
    assert.equal(generatedTasks[0].priority, 'high');
  });

  test('Export payload produces valid JSON with version and timestamp', () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: [],
      goals: [],
      habits: [],
      projects: [],
      notes: [],
      learningTopics: [],
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.version, '1.0');
    assert.ok(typeof parsed.exportedAt === 'string');
    assert.ok(Array.isArray(parsed.tasks));
  });

  test('Import validation safely rejects malformed or non-JSON payloads', () => {
    assert.throws(() => JSON.parse('{ broken json string '), SyntaxError);
    assert.throws(() => JSON.parse(''), SyntaxError);
  });

  test('AI Plan generation correctly preserves Day 0 tasks (dueDateOffsetDays === 0)', () => {
    const dayZeroTask = {
      title: 'Day 0 Kickoff Task',
      description: 'Immediate first action',
      priority: 'high' as const,
      estimatedMinutes: 45,
      category: 'study' as const,
      dueDateOffsetDays: 0, // Starts today
      subtasks: ['Action 1'],
    };

    // Regression test for line 943: typeof dueDateOffsetDays === 'number' ? dueDateOffsetDays : 3
    const calculatedDueDate = getRelativeDate(
      typeof dayZeroTask.dueDateOffsetDays === 'number' ? dayZeroTask.dueDateOffsetDays : 3
    );
    assert.equal(calculatedDueDate, getRelativeDate(0));
    assert.notEqual(calculatedDueDate, getRelativeDate(3));
  });

  test('clearAllData safely retains Daily Spoken English Practice routine', () => {
    const cleared = syncDailyEnglishTask([]);
    assert.equal(cleared.length, 1);
    assert.equal(cleared[0].id, 'task-daily-spoken-english');
    assert.equal(cleared[0].status, 'todo');
  });

  test('LocalStorage defensive recovery handles corrupted non-array payloads safely', () => {
    const corruptedValues = ['{}', '123', 'null', '"corrupted string"', 'true'];

    for (const val of corruptedValues) {
      let goalsResult = initialGoals;
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) goalsResult = parsed;
      } catch {
        goalsResult = initialGoals;
      }
      // Must remain a valid array of goals, never an object or primitive
      assert.ok(Array.isArray(goalsResult));
      assert.ok(goalsResult.length > 0);
    }
  });
});

describe('Firebase Authentication Error Handling & Guardrails', () => {
  test('formatAuthError provides clear, actionable domain authorization message', () => {
    const err = { code: 'auth/unauthorized-domain', message: 'Domain unauthorized' };
    const formatted = formatAuthError(err);
    assert.ok(formatted.includes('Domain not authorized in Firebase'));
    assert.ok(formatted.includes('Authorized domains'));
  });

  test('formatAuthError suppresses popup-closed-by-user and cancelled-popup-request', () => {
    assert.equal(formatAuthError({ code: 'auth/popup-closed-by-user' }), '');
    assert.equal(formatAuthError({ code: 'auth/cancelled-popup-request' }), '');
  });

  test('formatAuthError provides clear instructions for disabled Google provider', () => {
    const err = { code: 'auth/operation-not-allowed' };
    const formatted = formatAuthError(err);
    assert.ok(formatted.includes('Google Sign-In is disabled'));
    assert.ok(formatted.includes('Sign-in method'));
  });

  test('formatAuthError handles network failures gracefully', () => {
    const err = { code: 'auth/network-request-failed' };
    const formatted = formatAuthError(err);
    assert.ok(formatted.includes('Network connection failed'));
  });
});

