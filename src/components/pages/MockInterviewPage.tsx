import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  History,
  RotateCcw,
  Check,
  User,
  Bot,
} from 'lucide-react';
import { executeInterviewTurn } from '../../services/studentAIService';
import { EngineeringBranch, InterviewMessage, InterviewReport, InterviewRoundType } from '../../types';

export const MockInterviewPage: React.FC = () => {
  const { interviewReports, saveInterviewReport, deleteInterviewReport, showToast, userProfile } = useApp();

  // Interview Configuration State
  const [branch, setBranch] = useState<EngineeringBranch>(
    (userProfile.branch as EngineeringBranch) || 'B.Tech CSE'
  );
  const [domain, setDomain] = useState('Full-Stack Software Engineering & Core CS');
  const [difficulty, setDifficulty] = useState<
    'Entry-Level / Fresher' | 'Intermediate' | 'Core Engineering High-Difficulty'
  >('Intermediate');

  // Active Session State
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentRound, setCurrentRound] = useState<InterviewRoundType>('fundamentals');
  const [turnCount, setTurnCount] = useState(1);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [studentInput, setStudentInput] = useState('');
  const [isEvaluatingTurn, setIsEvaluatingTurn] = useState(false);
  const [lastTurnFeedback, setLastTurnFeedback] = useState<{
    feedback: string;
    techScore: number;
    commScore: number;
  } | null>(null);

  // Final Report View
  const [activeReport, setActiveReport] = useState<InterviewReport | null>(
    interviewReports[0] || null
  );

  // Voice Input State
  const [isListening, setIsListening] = useState(false);

  const BRANCH_DOMAINS: Record<EngineeringBranch, string[]> = {
    'B.Tech CSE': [
      'Full-Stack Software Engineering & Core CS',
      'Data Structures, Algorithms & Problem Solving',
      'Backend Systems, Caching & Distributed Databases',
      'Operating Systems, Concurrency & Networking',
    ],
    'AI / ML & Data Science': [
      'Deep Learning & Transformer Architectures',
      'Classical Machine Learning, NLP & Feature Engineering',
      'Computer Vision & Object Detection Pipelines',
      'MLOps, Model Deployment & Vector Databases',
    ],
    'ECE': [
      'Digital Signal Processing & Modulation Schemes',
      'Microcontrollers (8051, ARM Cortex) & Peripherals',
      'Analog CMOS & Circuit Theory',
      'Wireless Communications & RF Design',
    ],
    'Embedded Systems & VLSI': [
      'Embedded C, RTOS & Device Drivers',
      'Verilog / VHDL & ASIC / FPGA Flow',
      'Static Timing Analysis & Physical Design',
      'I2C, SPI, UART, CAN Bus & IoT Hardware',
    ],
    'Mechanical Engineering': [
      'Thermodynamics, Heat Transfer & Power Plants',
      'Fluid Mechanics & CFD Simulations',
      'Machine Design & Strength of Materials',
      'CAD/CAM, Manufacturing & Industrial Automation',
    ],
    'IT & Software Development': [
      'Web Services, RESTful APIs & Cloud Architecture',
      'Database Architecture (SQL vs NoSQL) & Indexing',
      'DevOps, CI/CD, Docker & Kubernetes',
      'Cybersecurity & Network Protocols',
    ],
  };

  const startNewInterview = () => {
    setIsInterviewActive(true);
    setCurrentRound('fundamentals');
    setTurnCount(1);
    setLastTurnFeedback(null);
    setActiveReport(null);

    const openingMessage: InterviewMessage = {
      id: `msg-${Date.now()}-1`,
      sender: 'ai',
      text: `Hello Alex. I am your Technical Placement Interviewer for ${branch} (${domain}). Let us begin with Round 1: Core Fundamentals.\n\nCould you introduce yourself briefly and explain how your core understanding of ${domain.split(',')[0]} helped you tackle your most challenging technical academic project?`,
      timestamp: new Date().toISOString(),
      round: 'fundamentals',
      turnIndex: 1,
    };

    setMessages([openingMessage]);
    showToast(`Mock Interview session started (${difficulty})`, 'info');
  };

  const handleSendAnswer = async () => {
    if (!studentInput.trim()) {
      showToast('Please type or speak your interview answer.', 'warning');
      return;
    }

    const currentAnswer = studentInput.trim();
    setStudentInput('');

    const userMsg: InterviewMessage = {
      id: `msg-${Date.now()}-student`,
      sender: 'student',
      text: currentAnswer,
      timestamp: new Date().toISOString(),
      round: currentRound,
      turnIndex: turnCount,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsEvaluatingTurn(true);

    const isFinal = turnCount >= 4;

    try {
      const response = await executeInterviewTurn({
        branch,
        domain,
        difficulty,
        round: currentRound,
        history: nextMessages.map((m) => ({ sender: m.sender, text: m.text })),
        studentAnswer: currentAnswer,
        isFinalTurn: isFinal,
      });

      setLastTurnFeedback({
        feedback: response.feedback,
        techScore: response.technicalAccuracyScore,
        commScore: response.communicationScore,
      });

      if (isFinal && response.report) {
        saveInterviewReport(response.report);
        setActiveReport(response.report);
        setIsInterviewActive(false);
        showToast('Placement mock interview complete! View your final report.', 'success');
      } else if (response.followUpQuestion) {
        const nextRound: InterviewRoundType =
          turnCount === 1 ? 'technical_logical' : turnCount === 2 ? 'coding_design' : 'real_world_problem';
        setCurrentRound(nextRound);
        setTurnCount((prev) => prev + 1);

        const aiFollowUp: InterviewMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: response.followUpQuestion,
          timestamp: new Date().toISOString(),
          round: nextRound,
          turnIndex: turnCount + 1,
        };

        setMessages((prev) => [...prev, aiFollowUp]);
      }
    } catch (err: any) {
      showToast(err.message || 'Interview turn evaluation failed.', 'error');
    } finally {
      setIsEvaluatingTurn(false);
    }
  };

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not available. Please type your answer.', 'warning');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Microphone active. Speak your answer clearly.', 'info');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript) {
          setStudentInput((prev) => `${prev} ${transcript}`.trim());
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Microphone permission denied.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl">
      {/* Header Banner */}
      <div className="page-intro p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              {userProfile.showPlacementModule === false
                ? 'Module 5 · Oral Examination & Practical Viva'
                : 'Module 5 · Placement & Campus Hiring'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {userProfile.showPlacementModule === false
              ? 'Practical Viva Voce & Oral Defense Simulator'
              : 'Branch & Domain-Specific Mock Interview'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {userProfile.showPlacementModule === false
              ? 'Practice oral examiner questions, lab viva defense, and step-by-step conceptual explanations with instant scoring.'
              : 'Simulate authentic placement rounds across CSE, AI/ML, ECE, Embedded & Mechanical with dual rubric scoring.'}
          </p>
        </div>

        {!isInterviewActive && (
          <button
            onClick={startNewInterview}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {userProfile.showPlacementModule === false
                ? 'Start Live Viva Practice'
                : 'Start Live Mock Interview'}
            </span>
          </button>
        )}
      </div>

      {/* Configuration & Selection Strip */}
      {!isInterviewActive && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block pb-2 border-b border-slate-200 dark:border-slate-700">
            Interview Target Parameters
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Engineering Branch</label>
              <select
                value={branch}
                onChange={(e) => {
                  const b = e.target.value as EngineeringBranch;
                  setBranch(b);
                  setDomain(BRANCH_DOMAINS[b][0]);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {Object.keys(BRANCH_DOMAINS).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Specialization Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {BRANCH_DOMAINS[branch].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Entry-Level / Fresher">Campus Placement (Entry-Level)</option>
                <option value="Intermediate">Tier-1 Product / Intermediate</option>
                <option value="Core Engineering High-Difficulty">High-Difficulty Technical Bar</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE INTERVIEW CONVERSATION WORKSPACE */}
      {isInterviewActive && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Chat Conversation (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-[600px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header info */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{branch} · {domain}</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                Round {turnCount} of 4: {currentRound.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 text-xs sm:text-sm ${
                    m.sender === 'student' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-[85%] whitespace-pre-line leading-relaxed ${
                      m.sender === 'student'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.sender === 'student' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-600 text-white flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isEvaluatingTurn && (
                <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400 italic">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Interviewer is analyzing your response and scoring rubrics...</span>
                </div>
              )}
            </div>

            {/* Student Input Box with Speech & Send */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <textarea
                  rows={2}
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAnswer();
                    }
                  }}
                  placeholder="Type your structured answer, or click the mic button to speak aloud..."
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />

                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  title={isListening ? 'Stop recording' : 'Speak answer with voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleSendAnswer}
                  disabled={isEvaluatingTurn || !studentInput.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
                  title="Submit answer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Turn Rubric (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block pb-2 border-b border-slate-200 dark:border-slate-700">
                Live Turn Scoring Rubric
              </span>

              {lastTurnFeedback ? (
                <div className="space-y-4 text-xs animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                      <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block">Technical Accuracy</span>
                      <span className="text-xl font-black text-blue-900 dark:text-blue-100">{lastTurnFeedback.techScore}%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center">
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 block">Communication</span>
                      <span className="text-xl font-black text-purple-900 dark:text-purple-100">{lastTurnFeedback.commScore}%</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Interviewer Instant Feedback:</span>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">{lastTurnFeedback.feedback}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                  Submit your first response to see your real-time rubric scores.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED INTERVIEW REPORT DRAWER */}
      {activeReport && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Verified Assessment
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {activeReport.branch} · {activeReport.domain}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">Placement Mock Interview Report</h3>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 inline-block">
                {activeReport.readinessRating}
              </span>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Completed {new Date(activeReport.completedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Technical Accuracy</span>
                <div className="text-3xl font-black text-blue-900 dark:text-blue-100 mt-0.5">{activeReport.overallTechnicalScore}%</div>
                <span className="text-[11px] text-blue-700 dark:text-blue-400">Theoretical rigor &amp; algorithmic logic</span>
              </div>
              <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Communication &amp; Clarity</span>
                <div className="text-3xl font-black text-purple-900 dark:text-purple-100 mt-0.5">{activeReport.overallCommunicationScore}%</div>
                <span className="text-[11px] text-purple-700 dark:text-purple-400">Structure, conciseness &amp; delivery</span>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Candidate Strengths Observed</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                {activeReport.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Areas for Targeted Improvement</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                {activeReport.areasForImprovement.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Placement Roadmap */}
          {activeReport.practiceRoadmap?.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Suggested Practice Roadmap Before Hiring Drives</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                {activeReport.practiceRoadmap.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Past Reports List */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Interview Assessment Records</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {interviewReports.length} Total Saved Reports
          </span>
        </div>

        {interviewReports.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
            No completed mock interviews yet. Click &quot;Start Live Mock Interview&quot; above to practice.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {interviewReports.map((rep) => (
              <div
                key={rep.id}
                onClick={() => setActiveReport(rep)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 text-xs ${
                  activeReport?.id === rep.id
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/10'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{rep.branch}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    {rep.readinessRating}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{rep.domain}</div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Tech: {rep.overallTechnicalScore}% · Comm: {rep.overallCommunicationScore}%</span>
                  <span className="text-slate-400 dark:text-slate-500">{new Date(rep.completedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

