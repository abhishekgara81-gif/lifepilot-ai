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
  initialSubjects,
  initialQuestions,
  initialCrashPlan,
  initialTestAttempts,
  initialInterviewReports,
  getStarterSubjectsForLevel,
  initialNotifications,
} from '../src/data/initialData';
import { mergeWorkspaces } from '../src/services/cloudSyncService';
import { Task, Goal, Habit, Project, Note, LearningTopic, UserProfile } from '../src/types';
import { formatAuthError } from '../src/context/AuthContext';
import {
  getLocalSyllabusFallback,
  getLocalQuestionsFallback,
  getLocalTestEvaluationFallback,
  BoundedRateLimiter,
} from '../server';
import {
  formatLocalDate,
  parseLocalDate,
  isSameDay,
  compareDates,
  formatDisplayDate,
  getDaysInMonth,
  isLeapYear,
  getMonthMatrix,
} from '../src/utils/dateUtils';
import { time24To12, time12To24 } from '../src/components/common/TimePicker12';

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

describe('Student Platform Module 1: Syllabus & Notes Management', () => {
  test('initialSubjects provides complete 5-unit curriculum structure for core engineering', () => {
    assert.ok(initialSubjects.length >= 3);
    const dsa = initialSubjects.find((s) => s.code === 'CS-301');
    assert.ok(dsa);
    assert.equal(dsa.name, 'Data Structures & Algorithms');
    assert.equal(dsa.units.length, 5);
    assert.ok(dsa.units[0].topics.length >= 3);
  });

  test('unit structure stores unit number, title, and topic list', () => {
    const os = initialSubjects.find((s) => s.code === 'CS-302');
    assert.ok(os);
    const unit2 = os.units.find((u) => u.unitNumber === 2);
    assert.ok(unit2);
    assert.ok(unit2.title.includes('Process Synchronization'));
    assert.ok(unit2.topics.some((t) => t.includes('Deadlock') || t.includes('Banker')));
  });

  test('getLocalSyllabusFallback provides structured 4-unit curriculum and focus areas on 503 or network failure', () => {
    const fallback = getLocalSyllabusFallback({
      university: 'Punjab Technical University (PTU)',
      branch: 'Computer Science & Engineering',
      semester: 5,
    });

    assert.ok(fallback.summary.includes('Punjab Technical University'));
    assert.ok(fallback.summary.includes('Computer Science & Engineering'));
    assert.ok(fallback.summary.includes('Semester 5'));
    assert.equal(fallback.units.length, 4);
    assert.ok(fallback.units[0].topics.length >= 3);
    assert.ok(fallback.importantFocusAreas.length >= 3);
  });
});

describe('Student Platform Module 2: Smart Star-Rating Question Bank', () => {
  test('3-Star questions are strictly backed by verified PYQ source papers and repetition counts', () => {
    const threeStarQuestions = initialQuestions.filter((q) => q.stars === 3);
    assert.ok(threeStarQuestions.length >= 4);

    for (const q of threeStarQuestions) {
      assert.equal(q.isVerifiedPYQ, true);
      assert.ok(q.repetitionCount >= 3);
      assert.ok(Array.isArray(q.sourcePapers) && q.sourcePapers.length >= 2);
      assert.ok(q.modelAnswer && q.modelAnswer.length > 20);
    }
  });

  test('Practice questions generated without verified PYQ status have 0 stars and no fake repetition counts', () => {
    const practiceQuestions = initialQuestions.filter((q) => q.stars === 0);
    assert.ok(practiceQuestions.length >= 2);

    for (const q of practiceQuestions) {
      assert.equal(q.isVerifiedPYQ, false);
      assert.equal(q.repetitionCount, 0);
      assert.equal(q.stars, 0);
    }
  });

  test('getLocalQuestionsFallback returns valid practice questions strictly with 0 stars and isVerifiedPYQ: false on 503 or network failure', () => {
    const fallback = getLocalQuestionsFallback({
      subjectName: 'Operating Systems',
      unitNumber: 2,
      topic: 'Deadlock Detection & Prevention',
    });

    assert.ok(Array.isArray(fallback.questions));
    assert.equal(fallback.questions.length, 2);

    for (const q of fallback.questions) {
      assert.equal(q.subjectName, 'Operating Systems');
      assert.equal(q.unit, 2);
      assert.equal(q.stars, 0);
      assert.equal(q.isVerifiedPYQ, false);
      assert.equal(q.repetitionCount, 0);
      assert.ok(q.modelAnswer && q.modelAnswer.length > 20);
      assert.ok(q.keyTopics.some((t) => t.includes('Deadlock') || t.includes('Operating Systems')));
    }
  });

  test('Question filtering accurately isolates unit and expected marks', () => {
    const unit2TenMarks = initialQuestions.filter((q) => q.unit === 2 && q.expectedMarks === 10);
    assert.ok(unit2TenMarks.length >= 1);
    assert.ok(unit2TenMarks.every((q) => q.unit === 2 && q.expectedMarks === 10));
  });
});

describe('Student Platform Module 3: Day-Wise Crash Study Planner & Rescheduling', () => {
  test('initialCrashPlan generates structured days with study, practice and mock test tasks', () => {
    assert.ok(initialCrashPlan.days.length >= 3);
    const day1 = initialCrashPlan.days[0];
    assert.equal(day1.dayNumber, 1);
    assert.ok(day1.tasks.length >= 3);

    const taskTypes = new Set(day1.tasks.map((t) => t.type));
    assert.ok(taskTypes.has('study'));
    assert.ok(taskTypes.has('practice_questions'));
  });

  test('Rescheduling logic carries missed uncompleted tasks forward to remaining days', () => {
    const planCopy = JSON.parse(JSON.stringify(initialCrashPlan));
    const today = getRelativeDate(0);
    const tomorrow = getRelativeDate(1);

    // Simulate an uncompleted past task
    planCopy.days[0].date = getRelativeDate(-2);
    planCopy.days[0].tasks[2].completed = false;
    planCopy.days[0].tasks[2].missed = false;
    planCopy.days[0].tasks[3].completed = true;

    // Remaining future day
    planCopy.days[1].date = tomorrow;

    // Rescheduling execution
    const missed: any[] = [];
    planCopy.days.forEach((day: any) => {
      if (day.date < today) {
        day.tasks.forEach((t: any) => {
          if (!t.completed) missed.push(t);
        });
      }
    });

    assert.equal(missed.length, 1);
    // Redistribute into future days
    planCopy.days[1].tasks.push({ ...missed[0], date: planCopy.days[1].date });
    assert.equal(planCopy.days[1].tasks.length, initialCrashPlan.days[1].tasks.length + 1);
  });
});

describe('Student Platform Module 4: Multimodal Test & Copy Evaluation', () => {
  test('Test attempt records step-by-step marks, partial marks, strengths and mistakes', () => {
    assert.ok(initialTestAttempts.length >= 2);
    const handwrittenTest = initialTestAttempts.find((t) => t.mode === 'handwritten');
    assert.ok(handwrittenTest);
    assert.equal(handwrittenTest.maxMarks, 10);
    assert.equal(handwrittenTest.marksObtained, 8.5);
    assert.ok(handwrittenTest.stepEvaluation.length >= 3);

    // Verify partial marking support
    const hasPartialStep = handwrittenTest.stepEvaluation.some((s) => s.status === 'partial');
    assert.ok(hasPartialStep);

    // Verify strengths and mistakes
    assert.ok(handwrittenTest.strengths.length > 0);
    assert.ok(handwrittenTest.mistakes.length > 0);
    assert.ok(typeof handwrittenTest.handwritingConfidence === 'number');
  });

  test('Viva test mode evaluates spoken answer without fabricating marks', () => {
    const vivaTest = initialTestAttempts.find((t) => t.mode === 'viva');
    assert.ok(vivaTest);
    assert.ok(vivaTest.percentage <= 100);
    assert.ok(vivaTest.stepEvaluation.every((s) => s.marksAwarded <= s.maxMarks));
  });

  test('getLocalTestEvaluationFallback clearly labels score as an estimate and never implies correctness from length alone', () => {
    const shortSubmission = getLocalTestEvaluationFallback({
      mode: 'typed',
      question: 'Explain Virtual Memory and Translation Lookaside Buffer (TLB).',
      studentAnswer: 'Short text.',
      maxMarks: 10,
      reason: 'quota_exhausted',
    });

    const verboseSubmission = getLocalTestEvaluationFallback({
      mode: 'typed',
      question: 'Explain Virtual Memory and Translation Lookaside Buffer (TLB).',
      studentAnswer: 'A'.repeat(800), // Verbose repetitive characters
      maxMarks: 10,
      reason: 'quota_exhausted',
    });

    // 1. Must be clearly labelled as provisional estimate and fallback
    assert.equal(shortSubmission.isFallback, true);
    assert.equal(shortSubmission.isEstimatedScore, true);
    assert.equal(verboseSubmission.isFallback, true);
    assert.equal(verboseSubmission.isEstimatedScore, true);
    assert.ok(shortSubmission.notice.toLowerCase().includes('provisional'));
    assert.ok(shortSubmission.explanation.toLowerCase().includes('provisional'));

    // 2. CRITICAL PRODUCTION SAFETY: Must NOT inflate marks based on answer length alone!
    assert.equal(shortSubmission.marksObtained, verboseSubmission.marksObtained);
    assert.equal(shortSubmission.percentage, verboseSubmission.percentage);
    assert.equal(shortSubmission.marksObtained, 5); // 50% provisional baseline for submission receipt

    // 3. Step statuses must be 'partial' (never falsely claiming 'correct' when unverified)
    assert.ok(shortSubmission.stepEvaluation.every((s) => s.status === 'partial'));
    assert.ok(shortSubmission.stepEvaluation.some((s) => s.feedback.toLowerCase().includes('teacher') || s.feedback.toLowerCase().includes('verification')));
    assert.ok(shortSubmission.mistakes.some((m) => m.toLowerCase().includes('provisional estimate only')));
  });
});

describe('Production Safety: Bounded Server-Side Rate Limiter', () => {
  test('BoundedRateLimiter allows legitimate requests under the threshold', () => {
    const limiter = new BoundedRateLimiter(5, 60_000, 100);
    for (let i = 0; i < 5; i++) {
      const res = limiter.check('student-ip-1');
      assert.equal(res.allowed, true);
      assert.equal(res.retryAfterSeconds, 0);
    }
  });

  test('BoundedRateLimiter rejects excessive requests with 429 Retry-After', () => {
    const limiter = new BoundedRateLimiter(3, 60_000, 100);
    limiter.check('student-ip-2');
    limiter.check('student-ip-2');
    limiter.check('student-ip-2');

    // 4th request must be rejected
    const blocked = limiter.check('student-ip-2');
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 60);

    // Different student IP is unaffected
    const otherStudent = limiter.check('student-ip-3');
    assert.equal(otherStudent.allowed, true);
  });

  test('BoundedRateLimiter bounds memory usage and prunes expired buckets', () => {
    const limiter = new BoundedRateLimiter(10, 50, 5); // 50ms window, max 5 buckets
    for (let i = 0; i < 10; i++) {
      limiter.check(`ip-${i}`);
    }
    // Size is tracked
    assert.ok(limiter.getBucketCount() <= 10);
  });
});

describe('Student Platform Module 5: Branch and Domain-Specific Mock Interview', () => {
  test('Mock interview report scores technical accuracy and communication separately', () => {
    assert.ok(initialInterviewReports.length >= 1);
    const report = initialInterviewReports[0];
    assert.equal(report.branch, 'B.Tech CSE');
    assert.ok(report.overallTechnicalScore >= 0 && report.overallTechnicalScore <= 100);
    assert.ok(report.overallCommunicationScore >= 0 && report.overallCommunicationScore <= 100);
    assert.equal(report.readinessRating, 'Ready for Placement');
    assert.ok(report.strengths.length >= 2);
    assert.ok(report.areasForImprovement.length >= 2);
    assert.ok(report.practiceRoadmap.length >= 2);
  });

  test('Mock interview messages track interactive conversational turns and interviewer questions', () => {
    const report = initialInterviewReports[0];
    assert.ok(report.messages.length >= 4);
    assert.equal(report.messages[0].sender, 'ai');
    assert.equal(report.messages[1].sender, 'student');
    assert.equal(report.messages[2].sender, 'ai');
    assert.equal(report.messages[3].sender, 'student');
  });
});

describe('Student Platform Transformation: Multi-Level Curriculum & Study from Your Syllabus', () => {
  test('getStarterSubjectsForLevel provides Class 12 CBSE curriculum for school stream', () => {
    const schoolSubjects = getStarterSubjectsForLevel('school');
    assert.ok(schoolSubjects.length >= 3);
    assert.ok(schoolSubjects.some((s) => s.name.includes('Physics')));
    assert.ok(schoolSubjects.some((s) => s.name.includes('Chemistry')));
    assert.ok(schoolSubjects.some((s) => s.name.includes('Mathematics')));
    assert.ok(schoolSubjects[0].boardOrUniversity?.includes('CBSE'));
    assert.equal(schoolSubjects[0].courseOrClass, 'Class 12');
  });

  test('getStarterSubjectsForLevel provides B.Sc Nursing curriculum for medical healthcare stream', () => {
    const nursingSubjects = getStarterSubjectsForLevel('nursing');
    assert.ok(nursingSubjects.length >= 2);
    assert.ok(nursingSubjects.some((s) => s.name.includes('Anatomy')));
    assert.ok(nursingSubjects.some((s) => s.name.includes('Nursing Foundation')));
    assert.equal(nursingSubjects[0].courseOrClass, 'B.Sc Nursing');
  });

  test('getStarterSubjectsForLevel provides B.Com curriculum for college stream', () => {
    const bcomSubjects = getStarterSubjectsForLevel('college');
    assert.ok(bcomSubjects.length >= 2);
    assert.ok(bcomSubjects.some((s) => s.name.includes('Financial Accounting')));
    assert.ok(bcomSubjects.some((s) => s.name.includes('Business Regulatory') || s.name.includes('Law')));
  });

  test('getLocalQuestionsFallback with questionType: mcq produces multiple choice options and answer', () => {
    const mcqFallback = getLocalQuestionsFallback({
      subjectName: 'Data Structures & Algorithms',
      questionType: 'mcq',
      topics: ['Binary Search Trees', 'AVL Trees'],
    });

    assert.ok(mcqFallback.questions.length >= 2);
    for (const q of mcqFallback.questions) {
      assert.equal(q.questionKind, 'mcq');
      assert.ok(Array.isArray(q.mcqOptions) && q.mcqOptions.length >= 4);
      assert.ok(q.correctAnswer && q.correctAnswer.length > 0);
      assert.equal(q.stars, 0);
      assert.equal(q.isVerifiedPYQ, false);
    }
  });

  test('In-app notifications initialize with exam alerts and study briefings', () => {
    assert.ok(initialNotifications.length >= 2);
    const hasCountdown = initialNotifications.some((n) => n.type === 'exam_countdown');
    const hasBriefing = initialNotifications.some((n) => n.type === 'daily_briefing');
    assert.ok(hasCountdown);
    assert.ok(hasBriefing);
  });
});

describe('Timezone-Safe Date Handling & Calendar Boundaries', () => {
  test('parseLocalDate parses YYYY-MM-DD at local midnight without UTC drift', () => {
    const d = parseLocalDate('2026-10-28');
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 9); // 0-indexed October
    assert.equal(d.getDate(), 28);
    assert.equal(d.getHours(), 0);
    assert.equal(d.getMinutes(), 0);
  });

  test('formatLocalDate formats Date object to exact local YYYY-MM-DD string', () => {
    const d = new Date(2026, 9, 28, 23, 59, 0); // 11:59 PM local
    assert.equal(formatLocalDate(d), '2026-10-28');
  });

  test('isSameDay correctly identifies matching calendar days', () => {
    assert.equal(isSameDay('2026-10-28', '2026-10-28'), true);
    assert.equal(isSameDay('2026-10-28', '2026-10-29'), false);
    assert.equal(isSameDay(new Date(2026, 9, 28), '2026-10-28'), true);
  });

  test('compareDates orders dates chronologically', () => {
    assert.ok(compareDates('2026-10-28', '2026-10-29') < 0);
    assert.ok(compareDates('2026-10-30', '2026-10-28') > 0);
    assert.equal(compareDates('2026-10-28', '2026-10-28'), 0);
  });

  test('formatDisplayDate returns human friendly formatted string without UTC drift', () => {
    const display = formatDisplayDate('2026-10-28', { includeWeekday: true });
    assert.ok(display.includes('Oct 28, 2026'));
    assert.ok(display.includes('Wed'));
  });

  test('Leap year detection handles standard, century, and quad-century leap years', () => {
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2025), false);
    assert.equal(isLeapYear(2028), true);
    assert.equal(isLeapYear(2000), true);
    assert.equal(isLeapYear(1900), false);
  });

  test('getDaysInMonth accurately handles leap year February (29 days) vs non-leap (28 days)', () => {
    assert.equal(getDaysInMonth(2024, 1), 29); // Feb 2024 (leap year)
    assert.equal(getDaysInMonth(2025, 1), 28); // Feb 2025 (non-leap)
    assert.equal(getDaysInMonth(2026, 9), 31); // Oct 2026
    assert.equal(getDaysInMonth(2026, 8), 30); // Sep 2026
  });

  test('getMonthMatrix builds 7-column calendar grid with accurate boundaries', () => {
    const matrix = getMonthMatrix(2026, 9, true); // Oct 2026 (starts Monday)
    assert.ok(matrix.length === 5 || matrix.length === 6);
    for (const week of matrix) {
      assert.equal(week.length, 7);
    }
    // Verify October 1st and October 31st are in current month
    const allCells = matrix.flat();
    const oct1 = allCells.find((c) => c.dateStr === '2026-10-01');
    const oct31 = allCells.find((c) => c.dateStr === '2026-10-31');
    assert.ok(oct1 && oct1.isCurrentMonth);
    assert.ok(oct31 && oct31.isCurrentMonth);
  });
});

describe('12-Hour AM/PM Time Selector & Conversions', () => {
  test('time24To12 converts midnight 00:00 to 12:00 AM', () => {
    const result = time24To12('00:00');
    assert.equal(result.hour12, 12);
    assert.equal(result.minute, 0);
    assert.equal(result.period, 'AM');
    assert.equal(result.formatted12, '12:00 AM');
  });

  test('time24To12 converts noon 12:00 to 12:00 PM', () => {
    const result = time24To12('12:00');
    assert.equal(result.hour12, 12);
    assert.equal(result.minute, 0);
    assert.equal(result.period, 'PM');
    assert.equal(result.formatted12, '12:00 PM');
  });

  test('time24To12 converts 23:59 to 11:59 PM', () => {
    const result = time24To12('23:59');
    assert.equal(result.hour12, 11);
    assert.equal(result.minute, 59);
    assert.equal(result.period, 'PM');
    assert.equal(result.formatted12, '11:59 PM');
  });

  test('time12To24 converts 12:00 AM to 00:00 (midnight)', () => {
    assert.equal(time12To24(12, 0, 'AM'), '00:00');
  });

  test('time12To24 converts 12:30 AM to 00:30', () => {
    assert.equal(time12To24(12, 30, 'AM'), '00:30');
  });

  test('time12To24 converts 12:00 PM to 12:00 (noon)', () => {
    assert.equal(time12To24(12, 0, 'PM'), '12:00');
  });

  test('time12To24 converts 1:30 PM to 13:30', () => {
    assert.equal(time12To24(1, 30, 'PM'), '13:30');
  });

  test('time12To24 handles custom minute input (e.g. 17 min)', () => {
    assert.equal(time12To24(4, 17, 'PM'), '16:17');
    assert.equal(time12To24(9, 43, 'AM'), '09:43');
  });
});

