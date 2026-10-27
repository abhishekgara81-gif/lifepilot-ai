import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateActionPlan } from '../../services/aiPlannerService';
import { AIPlan, AIPlanTask, TaskPriority, TaskCategory } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  Edit3,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

export const AIPlannerPage: React.FC = () => {
  const { approveAndSavePlan, hasGeminiKey, showToast } = useApp();

  const [prompt, setPrompt] = useState(
    'I want to prepare for my C++ exam, practice DSA daily (LeetCode Mediums), and complete my full-stack AI project in 30 days.'
  );
  const [timeframeDays, setTimeframeDays] = useState(30);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [domain, setDomain] = useState('academic');

  const [loading, setLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<AIPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editablePlan, setEditablePlan] = useState<AIPlan | null>(null);

  const samplePrompts = [
    {
      label: 'C++ Exam + DSA + AI Project (30 Days)',
      text: 'I want to prepare for my C++ exam, practice DSA daily (LeetCode Mediums), and complete my full-stack AI project in 30 days.',
      timeframe: 30,
      hours: 3,
      domain: 'academic',
    },
    {
      label: 'Software Internship Grind (45 Days)',
      text: 'Targeting 50 software engineering internship applications, master the Blind 75 algorithms, build 1 showcase full-stack repo, and do 5 mock interviews in 45 days.',
      timeframe: 45,
      hours: 4,
      domain: 'career',
    },
    {
      label: 'Operating Systems Midterm Sprint (14 Days)',
      text: 'Need to master Virtual Memory, Page Tables, Process Scheduling, and Deadlock algorithms before my university midterm in 14 days.',
      timeframe: 14,
      hours: 3,
      domain: 'academic',
    },
    {
      label: 'Full-Stack TypeScript & AI App in 21 Days',
      text: 'Architect, implement, and deploy a production web application with React 19, Express, Tailwind CSS, and Gemini API in 3 weeks.',
      timeframe: 21,
      hours: 4,
      domain: 'software',
    },
  ];

  const handleGenerate = async () => {
    if (prompt.trim().length < 5 || prompt.trim().length > 4000) {
      const message = 'Goal description must be between 5 and 4,000 characters.';
      setGenerationError(message);
      showToast(message, 'warning');
      return;
    }

    setLoading(true);
    setGenerationError(null);
    setGeneratedPlan(null);
    setIsEditing(false);

    try {
      const plan = await generateActionPlan({
        prompt: prompt.trim(),
        timeframeDays,
        hoursPerDay,
        domain,
      });
      setGeneratedPlan(plan);
      setEditablePlan(JSON.parse(JSON.stringify(plan)));
      showToast('Gemini action plan generated. Review it before saving.', 'success');
    } catch (err: any) {
      const message = err.message || 'Plan generation failed. Please try again.';
      setGenerationError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    const finalPlan = isEditing && editablePlan ? editablePlan : generatedPlan;
    if (!finalPlan) return;
    approveAndSavePlan(finalPlan);
  };

  const handleExportJSON = () => {
    const planToExport = isEditing && editablePlan ? editablePlan : generatedPlan;
    if (!planToExport) return;
    const blob = new Blob([JSON.stringify(planToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifepilot-plan-${Date.now()}.json`;
    a.click();
    showToast('Plan downloaded as JSON', 'info');
  };

  // Editing helpers
  const handleUpdateTaskInPlan = (
    phaseIdx: number,
    taskIdx: number,
    updates: Partial<AIPlanTask>
  ) => {
    if (!editablePlan) return;
    const copy = { ...editablePlan };
    copy.phases[phaseIdx].tasks[taskIdx] = {
      ...copy.phases[phaseIdx].tasks[taskIdx],
      ...updates,
    };
    setEditablePlan(copy);
  };

  const handleDeleteTaskFromPlan = (phaseIdx: number, taskIdx: number) => {
    if (!editablePlan) return;
    const copy = { ...editablePlan };
    copy.phases[phaseIdx].tasks.splice(taskIdx, 1);
    setEditablePlan(copy);
  };

  const handleAddTaskToPhase = (phaseIdx: number) => {
    if (!editablePlan) return;
    const copy = { ...editablePlan };
    copy.phases[phaseIdx].tasks.push({
      title: 'New Custom Task',
      description: 'Add execution instructions...',
      priority: 'medium',
      estimatedMinutes: 60,
      category: 'study',
      dueDateOffsetDays: phaseIdx * 7 + 2,
      subtasks: ['Action step 1', 'Action step 2'],
    });
    setEditablePlan(copy);
  };

  const activePlan = isEditing && editablePlan ? editablePlan : generatedPlan;

  return (
    <div className="space-y-6 pb-16">
      {/* Engine Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          {hasGeminiKey ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-slate-800 font-medium">AI Status:</span>
              <span className="text-emerald-700 font-semibold">Gemini API key configured</span>
              <span className="hidden text-slate-500 lg:inline">· Plans are generated on the server by Gemini</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span className="text-slate-800 font-medium">Planner Engine:</span>
              <span className="text-amber-700 font-medium">Gemini setup required</span>
              <span className="hidden text-slate-500 lg:inline">· Add GEMINI_API_KEY to the local .env file</span>
            </>
          )}
        </div>
        <div className="text-slate-500 text-[11px]">
          Decomposes high-level ambitions into actionable, time-bounded milestones
        </div>
      </div>

      {/* Main Prompt Generator Card */}
      <div className="ai-planner-card p-6 rounded-2xl border space-y-5">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Goal Decomposition</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Describe Your Goals & Target Ambition
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Describe an exam, project, or habit goal. Gemini returns a phased roadmap with time estimates, priorities, and subtasks. API or configuration errors are shown directly.
          </p>
        </div>

        {/* Large Natural Language Input */}
        <div>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={4000}
            placeholder="e.g. I want to prepare for my C++ exam, practice DSA daily, and complete my AI project in 30 days..."
            className="w-full p-4 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 transition-colors leading-relaxed"
          />
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-xs font-medium text-slate-500 mb-2 block">Quick Student & Dev Templates:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(s.text);
                  setTimeframeDays(s.timeframe);
                  setHoursPerDay(s.hours);
                  setDomain(s.domain);
                }}
                className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-200 hover:border-blue-300/50 hover:bg-white text-left transition-all group"
              >
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                  {s.timeframe} days · {s.hours}h/day
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Target Timeframe
            </label>
            <select
              value={timeframeDays}
              onChange={(e) => setTimeframeDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
            >
              <option value={7}>7 Days (Sprint Review)</option>
              <option value={14}>14 Days (Midterm Exam Prep)</option>
              <option value={21}>21 Days (3-Week Accelerator)</option>
              <option value={30}>30 Days (1-Month Comprehensive)</option>
              <option value={45}>45 Days (Internship / Interview Sprint)</option>
              <option value={60}>60 Days (Full Semester)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Available Daily Focus Hours
            </label>
            <select
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
            >
              <option value={2}>2 Hours / Day (Part-time / Light)</option>
              <option value={3}>3 Hours / Day (Recommended Balance)</option>
              <option value={4}>4 Hours / Day (Intensive Semester)</option>
              <option value={6}>6 Hours / Day (Full-Time Bootcamp)</option>
              <option value={8}>8 Hours / Day (Immersive Sprint)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Domain Orientation
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
            >
              <option value="academic">Academic & Exams (C++, Math, OS)</option>
              <option value="software">Software Engineering & Full-stack</option>
              <option value="career">Job Hunting & Interviews</option>
              <option value="research">AI Research & Prototyping</option>
            </select>
          </div>
        </div>

        {/* Generate Action CTA */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Estimated capacity:{' '}
            <span className="font-semibold text-slate-800 tabular-nums">
              ~{Math.round(timeframeDays * hoursPerDay * 0.75)} hours
            </span>{' '}
            allocated to deep work.
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            aria-busy={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-slate-900 font-semibold rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Preparing your roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Action Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Plan Review Section */}
      {loading && (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-300/30 flex items-center justify-center mx-auto text-blue-700">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Preparing your roadmap</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Gemini is preparing your roadmap. If the request fails, the app will show the error instead of creating a substitute plan.
            </p>
          </div>
        </div>
      )}

      {generationError && !loading && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-500/20 bg-rose-50/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
            <div>
              <h3 className="text-xs font-semibold text-rose-800">The plan could not be prepared</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-rose-800/70">{generationError}</p>
            </div>
          </div>
          <button onClick={handleGenerate} className="shrink-0 self-start rounded-lg border border-rose-200/15 px-3 py-1.5 text-[10px] font-semibold text-rose-800 transition-colors hover:bg-rose-300/10 sm:self-center">
            Try again
          </button>
        </div>
      )}

      {activePlan && !loading && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6">
          {/* Plan Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-700 font-medium mb-1">
                <span>Proposed Action Blueprint</span>
                <span aria-hidden="true">·</span>
                <span>Review Before Saving</span>
                {activePlan.isAIGenerated ? (
                  <span className="text-emerald-700 font-semibold">(Gemini 3.8 Flash)</span>
                ) : (
                  <span className="text-amber-700">(Not generated by Gemini)</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{activePlan.title}</h3>
              <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-3xl leading-relaxed">
                {activePlan.summary}
              </p>
            </div>

            {/* Actions: Approve, Edit, Export */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  isEditing
                    ? 'bg-amber-600/20 border-amber-500/40 text-amber-700'
                    : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Editing Mode' : 'Edit Plan'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900"
                title="Download JSON blueprint"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Approve & Add to My Tasks</span>
              </button>
            </div>
          </div>

          {activePlan.notice && (
            <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[10px] leading-relaxed ${
              activePlan.isAIGenerated
                ? 'border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-800/75'
                : 'border-amber-300/20 bg-amber-300/[0.06] text-amber-800/80'
            }`}>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{activePlan.notice}</span>
            </div>
          )}

          {/* Metrics summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50/60 border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 block">Total Workload</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {activePlan.totalEstimatedHours}h
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Timeframe</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {activePlan.timeframeDays} Days
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Phases</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {activePlan.phases.length} Sprints
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Action Tasks</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {activePlan.phases.reduce((sum, p) => sum + p.tasks.length, 0)} Tasks
              </span>
            </div>
          </div>

          {/* Phased Breakdown Cards */}
          <div className="space-y-6">
            {activePlan.phases.map((phase, pIdx) => (
              <div key={pIdx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {phase.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{phase.description}</p>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleAddTaskToPhase(pIdx)}
                      className="text-xs text-blue-700 hover:text-blue-700 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Task</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {phase.tasks.map((task, tIdx) => (
                    <div
                      key={tIdx}
                      className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2 mb-2">
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) =>
                                handleUpdateTaskInPlan(pIdx, tIdx, { title: e.target.value })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
                            />
                            <textarea
                              rows={1}
                              value={task.description}
                              onChange={(e) =>
                                handleUpdateTaskInPlan(pIdx, tIdx, { description: e.target.value })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-sm font-semibold text-slate-900 mb-1">
                              {task.title}
                            </div>
                            <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                              {task.description}
                            </p>
                          </>
                        )}

                        {/* Checklist subtasks */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="space-y-1 pl-1 pt-1 border-t border-slate-200/80">
                            {task.subtasks.map((st, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center gap-2 text-[11px] text-slate-500"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                <span>{st}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                          <span className="capitalize">{task.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{task.estimatedMinutes}m</span>
                          <span aria-hidden="true">·</span>
                          <span>Day +{task.dueDateOffsetDays}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              task.priority === 'high'
                                ? 'bg-rose-50/60 text-rose-700 border border-rose-200/40'
                                : task.priority === 'medium'
                                ? 'bg-amber-50/60 text-amber-700 border border-amber-200/40'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>

                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTaskFromPlan(pIdx, tIdx)}
                              className="p-1 text-slate-500 hover:text-rose-700"
                              title="Delete task from plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tactical Recommendations */}
          {activePlan.recommendations && activePlan.recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-50/30 border border-blue-900/40 space-y-2">
              <span className="text-xs font-semibold text-blue-700 block">
                Tactical Execution Guidelines:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {activePlan.recommendations.map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2">
                    <span className="text-blue-700 font-bold shrink-0">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bottom approval bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Ready to execute? Approving saves these tasks directly into your task queue and calendar.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGeneratedPlan(null)}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Approve & Add All Tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
