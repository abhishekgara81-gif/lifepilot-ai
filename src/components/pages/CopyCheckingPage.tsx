import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileCheck2,
  Camera,
  Mic,
  MicOff,
  Keyboard,
  Sparkles,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Clock,
  History,
  Trash2,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { evaluateTestAnswer } from '../../services/studentAIService';
import { TestAttemptRecord, TestEvaluationMode } from '../../types';

export const CopyCheckingPage: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    testAttempts,
    saveTestAttempt,
    deleteTestAttempt,
    showToast,
  } = useApp();

  const [testMode, setTestMode] = useState<TestEvaluationMode>('handwritten');
  const [questionText, setQuestionText] = useState(
    'Construct an AVL tree for the keys: 14, 17, 11, 7, 53, 4, 13. State rotations clearly.'
  );
  const [maxMarks, setMaxMarks] = useState<number>(10);
  const [studentAnswerText, setStudentAnswerText] = useState('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  // Voice Viva State
  const [isListening, setIsListening] = useState(false);

  // Evaluation & Result State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentResult, setCurrentResult] = useState<TestAttemptRecord | null>(null);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image (JPEG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size exceeds 8MB. Please take a clearer compressed photo.', 'error');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageBase64(reader.result as string);
      showToast(`Answer sheet "${file.name}" loaded. Ready for AI step checking.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Voice Recognition for Viva
  const toggleVivaMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not available. Please type your viva answer below.', 'warning');
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
        showToast('Viva microphone active. Speak your answer clearly.', 'info');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setStudentAnswerText((prev) => `${prev} ${finalTranscript}`.trim());
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        showToast(`Microphone error: ${event.error}`, 'error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Microphone access was denied or failed.', 'error');
    }
  };

  const handleEvaluate = async () => {
    if (!questionText.trim()) {
      showToast('Please enter the question to be evaluated.', 'warning');
      return;
    }

    if (testMode === 'handwritten' && !uploadedImageBase64) {
      showToast('Please upload a photograph of your handwritten answer sheet.', 'warning');
      return;
    }

    if (testMode !== 'handwritten' && !studentAnswerText.trim()) {
      showToast('Please provide your answer via voice or text input.', 'warning');
      return;
    }

    setIsEvaluating(true);
    setCurrentResult(null);

    try {
      const result = await evaluateTestAnswer({
        mode: testMode,
        subjectName: activeSubject?.name || 'General Engineering',
        question: questionText.trim(),
        studentAnswer: studentAnswerText.trim(),
        imageBase64: uploadedImageBase64 || undefined,
        maxMarks,
      });

      setCurrentResult(result);
      saveTestAttempt(result);
      showToast(`Evaluation Complete! Marks: ${result.marksObtained}/${result.maxMarks}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Copy evaluation failed. Please try again.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl">
      {/* Header Banner */}
      <div className="page-intro p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Module 4 · Multimodal Copy Checking</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            AI Test &amp; Copy Evaluation
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload handwritten university answer sheets, speak in live voice viva, or take typed exam tests with step-by-step partial marking.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl shrink-0 border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setTestMode('handwritten')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              testMode === 'handwritten' ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Handwritten Copy</span>
          </button>
          <button
            onClick={() => setTestMode('viva')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              testMode === 'viva' ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Voice Viva</span>
          </button>
          <button
            onClick={() => setTestMode('typed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              testMode === 'typed' ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Typed Test</span>
          </button>
        </div>
      </div>

      {/* Main Test Submission Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Test Question &amp; Marking Rubric
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Subject: {activeSubject?.name || 'Selected Subject'}
              </span>
            </div>

            {/* Question Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Exam Question *</label>
              <textarea
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Paste or type the exact exam question..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Maximum Marks</label>
                <select
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value={2}>2 Marks (Short Answer)</option>
                  <option value={5}>5 Marks (Medium Derivation)</option>
                  <option value={10}>10 Marks (Standard Long Question)</option>
                  <option value={16}>16 Marks (University Full-Length)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Evaluation Strictness</label>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60">
                  Standard University Rubric
                </div>
              </div>
            </div>

            {/* MODE A: HANDWRITTEN COPY UPLOAD */}
            {testMode === 'handwritten' && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Photograph of Handwritten Answer Sheet *
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/40 transition-colors">
                  <Camera className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Take photo or upload image</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400"> (JPG, PNG, WebP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Multimodal Vision AI will transcribe handwriting, verify steps, and score partial marks.
                  </div>
                  {imageFileName && (
                    <div className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-block">
                      ✓ Answer Sheet Loaded: {imageFileName}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE B: VOICE VIVA */}
            {testMode === 'viva' && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Spoken Viva Answer (Voice / Microphone)
                  </label>
                  <button
                    type="button"
                    onClick={toggleVivaMic}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Stop Speaking' : 'Start Microphone'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={studentAnswerText}
                  onChange={(e) => setStudentAnswerText(e.target.value)}
                  placeholder="Spoken words will transcribe here in real-time. You can also edit or type manually..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* MODE C: TYPED TEST */}
            {testMode === 'typed' && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Your Written Answer *
                </label>
                <textarea
                  rows={6}
                  value={studentAnswerText}
                  onChange={(e) => setStudentAnswerText(e.target.value)}
                  placeholder="Type your structured answer with definitions, step-by-step algorithms, or equations..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Evaluation Action Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isEvaluating
                    ? 'AI Evaluating Steps & Calculating Marks...'
                    : testMode === 'handwritten'
                    ? 'Check Handwritten Copy'
                    : 'Evaluate Answer'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Evaluation Report (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {currentResult ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 animate-in fade-in duration-300">
              {/* Score Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Evaluation Score</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {currentResult.marksObtained} <span className="text-base text-slate-400 dark:text-slate-500 font-semibold">/ {currentResult.maxMarks} Marks</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                      currentResult.isEstimatedScore || currentResult.isFallback
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : currentResult.percentage >= 75
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : currentResult.percentage >= 50
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {currentResult.percentage}% Score {currentResult.isEstimatedScore || currentResult.isFallback ? '· Estimate' : ''}
                  </span>
                  {currentResult.handwritingConfidence && !currentResult.isEstimatedScore ? (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      OCR Confidence: {currentResult.handwritingConfidence}%
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Provisional Estimate Disclaimer Banner */}
              {(currentResult.isEstimatedScore || currentResult.isFallback) && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Provisional Rubric Estimate · Not a Verified AI Score</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    {currentResult.notice || 'Live AI evaluation was unavailable (quota or network). This score is a structural rubric estimate and does not represent verified AI grading. Correctness of steps and formulas must be verified independently.'}
                  </p>
                </div>
              )}

              {/* Unclear Handwriting Notice */}
              {currentResult.unclearHandwritingPrompt && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Handwriting Clarification Requested</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    {currentResult.unclearHandwritingPrompt}
                  </p>
                </div>
              )}

              {/* Step by Step Breakdown */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Step-by-Step Marking Breakdown
                </span>

                <div className="space-y-2">
                  {currentResult.stepEvaluation.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-900 dark:text-slate-100">Step {step.stepNumber}: {step.stepDescription}</span>
                        <span
                          className={`font-bold ${
                            step.status === 'correct'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : step.status === 'partial'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          +{step.marksAwarded} / {step.maxMarks}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{step.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Mistakes */}
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                {currentResult.strengths?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Key Strengths:</span>
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                      {currentResult.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentResult.mistakes?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Mistakes &amp; Deduction Causes:</span>
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                      {currentResult.mistakes.map((mst, idx) => (
                        <li key={idx}>{mst}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Overall Examiner Feedback */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-400">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Examiner Feedback</span>
                </span>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">{currentResult.explanation}</p>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Award className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No active copy evaluation</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload your handwritten answer or submit an answer on the left to see your step-by-step score.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Test Copies & Attempts */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Test Copy History &amp; Evaluated Attempts</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {testAttempts.length} Total Evaluated Tests
          </span>
        </div>

        {testAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
            No past test attempts saved yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testAttempts.map((att) => (
              <div
                key={att.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      {att.mode}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {att.subjectName}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {att.marksObtained} / {att.maxMarks} Marks ({att.percentage}%)
                    {(att.isEstimatedScore || att.isFallback) && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        Estimate
                      </span>
                    )}
                  </span>
                </div>

                <p className="text-slate-800 dark:text-slate-200 font-medium line-clamp-2">{att.question}</p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Evaluated: {new Date(att.evaluatedAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => deleteTestAttempt(att.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete attempt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

