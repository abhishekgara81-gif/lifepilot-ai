import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Star,
  Clock,
  Calendar,
  Layers,
  Plus,
  Flame,
  Volume2,
} from 'lucide-react';
import { getRelativeDate } from '../../data/initialData';

export const StudentCenterPage: React.FC = () => {
  const { learningTopics, updateTopicConfidence, reviewTopic, addTopic, showToast } = useApp();

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(3);

  // New topic modal
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newSubject, setNewSubject] = useState('Advanced C++');
  const [newTopicName, setNewTopicName] = useState('');
  const [newNotesSnippet, setNewNotesSnippet] = useState('');

  // Audio completion sound generator using Web Audio API
  const playCompletionChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // Audio context might be restricted
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      playCompletionChime();
      if (timerMode === 'focus') {
        setSessionsCompleted((prev) => prev + 1);
        showToast('Focus session complete! Take a 5-minute breather.', 'success');
        setTimerMode('shortBreak');
        setTimeLeft(5 * 60);
      } else {
        showToast('Break finished! Ready for the next deep work session?', 'info');
        setTimerMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode]);

  const handleModeSwitch = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setTimerMode(mode);
    if (mode === 'focus') setTimeLeft(25 * 60);
    if (mode === 'shortBreak') setTimeLeft(5 * 60);
    if (mode === 'longBreak') setTimeLeft(15 * 60);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    if (timerMode === 'focus') setTimeLeft(25 * 60);
    if (timerMode === 'shortBreak') setTimeLeft(5 * 60);
    if (timerMode === 'longBreak') setTimeLeft(15 * 60);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    addTopic({
      subject: newSubject,
      topic: newTopicName.trim(),
      confidence: 3,
      nextReviewDate: getRelativeDate(1),
      leitnerBox: 1,
      notesSnippet: newNotesSnippet.trim() || 'Key definitions and core problem solving patterns.',
    });

    setNewTopicName('');
    setNewNotesSnippet('');
    setShowAddTopic(false);
  };

  const totalSeconds =
    timerMode === 'focus' ? 25 * 60 : timerMode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="page-intro p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Excellence Suite</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Student Learning Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Spaced repetition schedules, Leitner active recall boxes, and laser-focused Pomodoro sessions calibrated for university exams and technical assessments.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Focus Sessions</span>
            <span className="text-xl font-bold text-blue-700 font-mono tabular-nums">
              {sessionsCompleted} Done
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Pomodoro Focus Engine + Spaced Repetition Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pomodoro Study Timer (1 col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Pomodoro Study Engine</h3>
              <Volume2 className="w-4 h-4 text-slate-500" />
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl mb-6">
              <button
                onClick={() => handleModeSwitch('focus')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  timerMode === 'focus'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => handleModeSwitch('shortBreak')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  timerMode === 'shortBreak'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Break (5m)
              </button>
              <button
                onClick={() => handleModeSwitch('longBreak')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  timerMode === 'longBreak'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Long (15m)
              </button>
            </div>

            {/* Timer Display */}
            <div className="text-center py-6">
              <div className="text-5xl sm:text-6xl font-extrabold font-mono text-slate-900 tracking-tight tabular-nums">
                {formatTimer(timeLeft)}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {timerMode === 'focus'
                  ? 'Deep focus session · Zero tab switching'
                  : 'Rest session · Stretch & hydrate'}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden mt-6 border border-slate-200">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Session</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetTimer}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Study Protocol Tip:</span>
            <span>
              25 minutes of high-intensity deliberate recall yields 3x higher long-term retention
              than multi-hour passive rereading.
            </span>
          </div>
        </div>

        {/* Right: Spaced Repetition & Leitner Roadmap (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Spaced Repetition & Revision Roadmap
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Leitner box system automatically spaces out review intervals based on mastery.
              </p>
            </div>

            <button
              onClick={() => setShowAddTopic(!showAddTopic)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topic</span>
            </button>
          </div>

          {/* Inline Add Topic Form */}
          {showAddTopic && (
            <form
              onSubmit={handleCreateTopic}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Advanced C++"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Topic Name</label>
                  <input
                    type="text"
                    required
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="e.g. Smart Pointer Control Blocks"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Core Formula / Note Snippet</label>
                <textarea
                  rows={2}
                  value={newNotesSnippet}
                  onChange={(e) => setNewNotesSnippet(e.target.value)}
                  placeholder="Key equation, theorem, or implementation detail..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTopic(false)}
                  className="px-3 py-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Add Topic
                </button>
              </div>
            </form>
          )}

          {/* Topics List */}
          <div className="space-y-3">
            {learningTopics.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300/70 bg-white px-5 py-9 text-center">
                <BookOpen className="mx-auto h-5 w-5 text-slate-500" />
                <p className="mt-3 text-xs font-semibold text-slate-800">Your review queue is empty</p>
                <p className="mt-1 text-[10px] text-slate-500">Add a topic to start tracking confidence and spaced reviews.</p>
              </div>
            ) : learningTopics.map((topic) => (
              <div
                key={topic.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/40">
                        {topic.subject}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{topic.topic}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-mono">
                      "{topic.notesSnippet}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => reviewTopic(topic.id)}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Review Done
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span>Mastery Level:</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => updateTopicConfidence(topic.id, star)}
                          className="focus:outline-none"
                          title={`Set confidence ${star}/5`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              star <= topic.confidence
                                ? 'text-amber-700 fill-amber-400'
                                : 'text-slate-500'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">
                      Leitner Box: <strong className="text-slate-800">{topic.leitnerBox}</strong>/5
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums text-blue-700">
                      Next Due: {topic.nextReviewDate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
