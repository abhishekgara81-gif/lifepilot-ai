import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  FileCheck2,
  BookOpen,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Plus,
  ArrowRight,
  HelpCircle,
  Clock,
  Award,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Bookmark,
  BookmarkCheck,
  Check,
  Languages,
  ListChecks,
  AlertCircle,
  FileQuestion,
} from 'lucide-react';
import { extractSyllabus, generatePracticeQuestions } from '../../services/studentAIService';
import { QuestionItem, StarRating, QuestionSourceCategory, QuestionKind } from '../../types';

export const QuestionBankPage: React.FC = () => {
  const {
    questions,
    addQuestion,
    toggleBookmarkQuestion,
    updateQuestionRevisionStatus,
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    userProfile,
    showToast,
    setActivePage,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<number | 'all'>('all');
  const [selectedMarks, setSelectedMarks] = useState<number | 'all'>('all');
  const [selectedStar, setSelectedStar] = useState<StarRating | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<QuestionSourceCategory | 'all'>('all');
  const [selectedRevisionFilter, setSelectedRevisionFilter] = useState<'all' | 'needs_practice' | 'mastered' | 'bookmarked'>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // "Study from Your Syllabus" Workflow State
  const [syllabusInputMode, setSyllabusInputMode] = useState<'upload' | 'text'>('upload');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/jpeg');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [rawSyllabusText, setRawSyllabusText] = useState('');
  const [isExtractingTopics, setIsExtractingTopics] = useState(false);

  // Extracted Topics Checklist
  const [extractedTopics, setExtractedTopics] = useState<{ id: string; name: string; selected: boolean }[]>([]);
  const [newTopicInput, setNewTopicInput] = useState('');

  // Generation options
  const [genQuestionType, setGenQuestionType] = useState<QuestionKind>('important');
  const [genMarks, setGenMarks] = useState<2 | 5 | 8 | 10 | 16>(5);
  const [genCount, setGenCount] = useState<number>(3);
  const [genLanguage, setGenLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [isGenerating, setIsGenerating] = useState(false);

  // Add Custom Question Modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customUnit, setCustomUnit] = useState<number>(1);
  const [customMarks, setCustomMarks] = useState<2 | 5 | 8 | 10 | 16>(5);
  const [customCategory, setCustomCategory] = useState<QuestionSourceCategory>('student_saved');
  const [customModelAnswer, setCustomModelAnswer] = useState('');
  const [customSourcePaper, setCustomSourcePaper] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Handle syllabus file upload (Photo / Screenshot / PDF)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB.', 'error');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImagePreviewUrl(file.type.startsWith('image/') ? dataUrl : null);
        const base64Data = dataUrl.split(',')[1];
        setUploadedBase64(base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Extract topics using Multimodal Vision / NLP
  const handleExtractTopics = async () => {
    if (!activeSubject) return;
    if (syllabusInputMode === 'upload' && !uploadedBase64) {
      showToast('Please upload an image or PDF of your syllabus first.', 'warning');
      return;
    }
    if (syllabusInputMode === 'text' && !rawSyllabusText.trim()) {
      showToast('Please paste your syllabus text or chapter headings.', 'warning');
      return;
    }

    setIsExtractingTopics(true);
    try {
      const extraction = await extractSyllabus({
        text: syllabusInputMode === 'text' ? rawSyllabusText : undefined,
        imageBase64: syllabusInputMode === 'upload' ? uploadedBase64 || undefined : undefined,
        mimeType: uploadedMimeType,
        educationLevel: userProfile.educationLevel,
        boardOrUniversity: userProfile.boardOrUniversity,
        courseOrClass: userProfile.courseOrClass,
      });

      const extracted: { id: string; name: string; selected: boolean }[] = [];
      let idCounter = 1;
      extraction.units.forEach((u) => {
        u.topics.forEach((top) => {
          extracted.push({
            id: `top-${Date.now()}-${idCounter++}`,
            name: `${u.title}: ${top}`,
            selected: true,
          });
        });
      });

      if (extracted.length === 0 && extraction.extractedTextPreview) {
        // Fallback: split preview into lines
        extraction.extractedTextPreview
          .split('\n')
          .filter((l: string) => l.trim().length > 3)
          .slice(0, 10)
          .forEach((line: string) => {
            extracted.push({
              id: `top-${Date.now()}-${idCounter++}`,
              name: line.replace(/^[•\-*\d.]+\s*/, ''),
              selected: true,
            });
          });
      }

      setExtractedTopics(extracted);
      showToast(`Extracted ${extracted.length} syllabus topics for review!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to extract syllabus topics.', 'error');
    } finally {
      setIsExtractingTopics(false);
    }
  };

  const handleToggleTopic = (id: string) => {
    setExtractedTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleDeleteTopic = (id: string) => {
    setExtractedTopics((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    setExtractedTopics((prev) => [
      ...prev,
      { id: `top-${Date.now()}`, name: newTopicInput.trim(), selected: true },
    ]);
    setNewTopicInput('');
  };

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    showToast('Question generation cancelled.', 'info');
  };

  // Step 2: Generate Questions from selected syllabus topics
  const handleGenerateFromSyllabus = async () => {
    if (!activeSubject) return;
    const selectedTopicsList = extractedTopics
      .filter((t) => t.selected)
      .map((t) => t.name);

    if (selectedTopicsList.length === 0) {
      showToast('Please select at least 1 topic from the checklist.', 'warning');
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsGenerating(true);
    try {
      const generated = await generatePracticeQuestions({
        subjectName: activeSubject.name,
        topics: selectedTopicsList,
        count: genCount,
        educationLevel: userProfile.educationLevel,
        boardOrUniversity: userProfile.boardOrUniversity,
        courseOrClass: userProfile.courseOrClass,
        questionType: genQuestionType,
        expectedMarks: genMarks,
        language: genLanguage,
        signal: abortController.signal,
      });

      const isFallback = generated.some((q) => q.isFallback);
      generated.forEach((q) => {
        addQuestion({
          ...q,
          subjectId: activeSubject.id,
          subjectName: activeSubject.name,
          sourceCategory: 'ai_practice',
          questionKind: genQuestionType,
          isFallback: q.isFallback,
        });
      });

      if (isFallback) {
        showToast(`Generated ${generated.length} practice questions via deterministic local engine (AI quota exhausted or offline).`, 'info');
      } else {
        showToast(`Generated ${generated.length} questions tailored to your syllabus via Gemini AI!`, 'success');
      }
    } catch (err: any) {
      if (abortController.signal.aborted || err?.message?.includes('cancelled')) {
        // Handled via user cancellation
        return;
      }
      showToast(err.message || 'Failed to generate practice questions.', 'error');
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Step 3: Handle manual custom question creation
  const handleSaveCustomQuestion = () => {
    if (!activeSubject || !customQuestionText.trim()) return;
    addQuestion({
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      unit: customUnit,
      question: customQuestionText.trim(),
      expectedMarks: customMarks,
      stars: customCategory === 'verified_pyq' ? 3 : 0,
      isVerifiedPYQ: customCategory === 'verified_pyq',
      repetitionCount: customCategory === 'verified_pyq' ? 1 : 0,
      sourcePapers: customSourcePaper.trim() ? [customSourcePaper.trim()] : [],
      keyTopics: ['custom-study'],
      modelAnswer: customModelAnswer.trim() || undefined,
      sourceCategory: customCategory,
      questionKind: 'important',
    });
    setShowAddCustomModal(false);
    setCustomQuestionText('');
    setCustomModelAnswer('');
    setCustomSourcePaper('');
  };

  // Filtering Logic
  const filteredQuestions = questions.filter((q) => {
    if (activeSubject && q.subjectId !== activeSubject.id && q.subjectName !== activeSubject.name) {
      return false;
    }
    if (selectedUnit !== 'all' && q.unit !== selectedUnit) {
      return false;
    }
    if (selectedMarks !== 'all' && q.expectedMarks !== selectedMarks) {
      return false;
    }
    if (selectedStar !== 'all' && q.stars !== selectedStar) {
      return false;
    }
    if (selectedCategory !== 'all') {
      const cat = q.sourceCategory || (q.isVerifiedPYQ ? 'verified_pyq' : 'ai_practice');
      if (cat !== selectedCategory) return false;
    }
    if (selectedRevisionFilter === 'needs_practice' && q.revisionStatus !== 'needs_practice') {
      return false;
    }
    if (selectedRevisionFilter === 'mastered' && q.revisionStatus !== 'mastered') {
      return false;
    }
    if (selectedRevisionFilter === 'bookmarked' && !q.bookmarked) {
      return false;
    }
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      const matchesQ = q.question.toLowerCase().includes(qLower);
      const matchesTopic = q.keyTopics?.some((t) => t.toLowerCase().includes(qLower));
      const matchesPaper = q.sourcePapers?.some((p) => p.toLowerCase().includes(qLower));
      return Boolean(matchesQ || matchesTopic || matchesPaper);
    }
    return true;
  });

  // Calculate statistics for active subject
  const totalSubjectQuestions = questions.filter(
    (q) => !activeSubject || q.subjectId === activeSubject.id || q.subjectName === activeSubject.name
  );
  const threeStarCount = totalSubjectQuestions.filter((q) => q.stars === 3).length;
  const verifiedPyqCount = totalSubjectQuestions.filter((q) => q.isVerifiedPYQ).length;
  const bookmarkedCount = totalSubjectQuestions.filter((q) => q.bookmarked).length;
  const masteredCount = totalSubjectQuestions.filter((q) => q.revisionStatus === 'mastered').length;

  const renderStars = (stars: StarRating) => {
    return (
      <div className="flex items-center gap-0.5" title={`${stars} Star Exam Priority`}>
        {[1, 2, 3].map((starNum) => (
          <Star
            key={starNum}
            className={`w-3.5 h-3.5 ${
              starNum <= stars
                ? 'fill-amber-400 text-amber-500'
                : 'fill-slate-100 dark:fill-slate-800 text-slate-300 dark:text-slate-700'
            }`}
          />
        ))}
      </div>
    );
  };

  const getCategoryBadge = (q: QuestionItem) => {
    const cat = q.sourceCategory || (q.isVerifiedPYQ ? 'verified_pyq' : 'ai_practice');
    switch (cat) {
      case 'verified_pyq':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Verified PYQ {q.repetitionCount ? `(${q.repetitionCount}x repeated)` : ''}
          </span>
        );
      case 'source_repeated':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Source Repeated Question
          </span>
        );
      case 'teacher_provided':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <BookOpen className="w-3 h-3 text-purple-600" />
            Teacher Provided
          </span>
        );
      case 'student_saved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Bookmark className="w-3 h-3 text-indigo-600" />
            Student Saved
          </span>
        );
      default:
        return (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            q.isFallback
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          }`}>
            {q.isFallback ? 'Practice Question · Local Engine' : 'Practice Question · Gemini AI'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Page Title & Intro */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Smart Question Bank & Study from Your Syllabus</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Question Bank ({activeSubject?.name || 'All Subjects'})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Study from past-paper citations, or upload a photo/PDF of your syllabus to generate tailored practice questions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Plus className="w-4 h-4" />
            Add Custom Question
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HERO SECTION: "STUDY FROM YOUR SYLLABUS" WORKFLOW */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Study from Your Syllabus
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Upload a photo/screenshot of your textbook table of contents or syllabus PDF to generate topic-wise questions
              </p>
            </div>
          </div>

          {/* Toggle upload vs text */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setSyllabusInputMode('upload')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors ${
                syllabusInputMode === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Upload Image / PDF
            </button>
            <button
              type="button"
              onClick={() => setSyllabusInputMode('text')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors ${
                syllabusInputMode === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Paste Topics
            </button>
          </div>
        </div>

        {/* Step 1 Input Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            {syllabusInputMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800/80 hover:border-blue-500 bg-white dark:bg-slate-800 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {uploadedFileName ? uploadedFileName : 'Click to upload syllabus photo, screenshot or PDF'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Supports PNG, JPEG, WEBP or PDF (max 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  rows={4}
                  value={rawSyllabusText}
                  onChange={(e) => setRawSyllabusText(e.target.value)}
                  placeholder="Paste your syllabus units, chapter topics, or course outline here (e.g. Unit 1: Pointers & Dynamic Memory, Unit 2: Linked Lists & Stacks)..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Subject:{' '}
                <strong className="text-slate-800 dark:text-slate-200">{activeSubject?.name}</strong>
              </span>
              <button
                type="button"
                onClick={handleExtractTopics}
                disabled={isExtractingTopics}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isExtractingTopics ? 'Extracting with Gemini...' : 'Extract Topics with AI'}</span>
              </button>
            </div>
          </div>

          {/* Thumbnail preview if image */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[140px]">
            {imagePreviewUrl ? (
              <div className="relative w-full h-full max-h-36 overflow-hidden rounded-lg">
                <img
                  src={imagePreviewUrl}
                  alt="Syllabus upload preview"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="text-center text-slate-400 dark:text-slate-500 text-xs p-4">
                <ImageIcon className="w-7 h-7 mx-auto mb-1 opacity-40" />
                <span>Live image preview appears here</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Extracted Topics Checklist & Generation Settings */}
        {extractedTopics.length > 0 && (
          <div className="pt-4 border-t border-blue-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-blue-600" />
                Extracted Topics Checklist ({extractedTopics.filter((t) => t.selected).length} selected)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExtractedTopics((prev) => prev.map((t) => ({ ...t, selected: true })))
                  }
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setExtractedTopics((prev) => prev.map((t) => ({ ...t, selected: false })))
                  }
                  className="text-[11px] font-semibold text-slate-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Topics Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {extractedTopics.map((topic) => (
                <div
                  key={topic.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs transition-colors ${
                    topic.selected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topic.selected}
                      onChange={() => handleToggleTopic(topic.id)}
                      className="rounded text-blue-600"
                    />
                    <span className="truncate">{topic.name}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                    title="Remove topic"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Topic Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                placeholder="Add missing syllabus topic..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              >
                Add Topic
              </button>
            </div>

            {/* Question Type & Marks Options */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Question Type
                </label>
                <select
                  value={genQuestionType}
                  onChange={(e) => setGenQuestionType(e.target.value as QuestionKind)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="important">Important Questions</option>
                  <option value="revision">Quick Revision</option>
                  <option value="mcq">MCQs with Explanations</option>
                  <option value="short_note">Short Notes (2 Marks)</option>
                  <option value="long_answer">Long Answers (10/16 Marks)</option>
                  <option value="numerical">Numerical Problems</option>
                  <option value="programming">Programming Problems</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Target Marks
                </label>
                <select
                  value={genMarks}
                  onChange={(e) => setGenMarks(Number(e.target.value) as any)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value={2}>2 Marks (Short)</option>
                  <option value={5}>5 Marks (Medium)</option>
                  <option value={8}>8 Marks</option>
                  <option value={10}>10 Marks (Detailed)</option>
                  <option value={16}>16 Marks (Full Essay)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Language
                </label>
                <select
                  value={genLanguage}
                  onChange={(e) => setGenLanguage(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Count
                </label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={8}>8 Questions</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {isGenerating && (
                <button
                  type="button"
                  onClick={handleCancelGeneration}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateFromSyllabus}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGenerating
                    ? 'Generating Questions from Syllabus...'
                    : `Generate ${genCount} Practice Questions`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subject Filter Bar & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Selected Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code ? `${s.code} - ` : ''}{s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              3-Star PYQs
            </span>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-0.5">
              {threeStarCount}
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400">High repeat frequency</span>
          </div>
          <div className="flex gap-0.5 text-amber-500">
            <Star className="w-4 h-4 fill-amber-400" />
            <Star className="w-4 h-4 fill-amber-400" />
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Verified PYQs
            </span>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
              {verifiedPyqCount}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Past paper citations</span>
          </div>
          <FileCheck2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Mastered / Saved
            </span>
            <div className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-0.5">
              {masteredCount} / {bookmarkedCount}
            </div>
            <span className="text-[10px] text-blue-700 dark:text-blue-400">Mastered & bookmarked</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions by topic, keyword, or past paper citation (e.g. Dijkstra, Dec 2023)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Units</option>
              {[1, 2, 3, 4, 5].map((u) => (
                <option key={u} value={u}>Unit {u}</option>
              ))}
            </select>

            <select
              value={selectedMarks}
              onChange={(e) => setSelectedMarks(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Marks</option>
              <option value={2}>2 Marks</option>
              <option value={5}>5 Marks</option>
              <option value={8}>8 Marks</option>
              <option value={10}>10 Marks</option>
              <option value={16}>16 Marks</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Categories</option>
              <option value="verified_pyq">Verified PYQ</option>
              <option value="source_repeated">Source-backed Repeated</option>
              <option value="ai_practice">AI Practice</option>
              <option value="teacher_provided">Teacher Provided</option>
              <option value="student_saved">Student Saved</option>
            </select>

            <select
              value={selectedRevisionFilter}
              onChange={(e) => setSelectedRevisionFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Status</option>
              <option value="bookmarked">Bookmarked Only</option>
              <option value="needs_practice">Needs Practice</option>
              <option value="mastered">Mastered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-3.5">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No questions found matching your filter
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your filter or upload a syllabus photo above to generate new practice questions.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isExpanded = expandedQuestionId === q.id;
            const isBookmarked = Boolean(q.bookmarked);
            const revision = q.revisionStatus || 'not_revised';

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm space-y-3"
              >
                {/* Header: Stars, Unit, Marks, Category & Bookmark */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderStars(q.stars)}

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Unit {q.unit}
                    </span>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      {q.expectedMarks} Marks
                    </span>

                    {getCategoryBadge(q)}

                    {revision === 'needs_practice' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                        Needs Practice
                      </span>
                    )}

                    {revision === 'mastered' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                        Mastered
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {q.sourcePapers && q.sourcePapers.length > 0 && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{q.sourcePapers.join(', ')}</span>
                      </div>
                    )}
                    <button
                      onClick={() => toggleBookmarkQuestion(q.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBookmarked
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 fill-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {q.question}
                </h3>

                {/* MCQ Options Display if available */}
                {q.mcqOptions && q.mcqOptions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {q.mcqOptions.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Topics Tags */}
                {q.keyTopics && q.keyTopics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {q.keyTopics.map((topic, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Controls & Revision Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>
                      {isExpanded ? 'Hide Model Answer & Rubric' : 'View Model Answer & Key Points'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Revision status toggle */}
                    <button
                      onClick={() =>
                        updateQuestionRevisionStatus(
                          q.id,
                          revision === 'needs_practice' ? 'not_revised' : 'needs_practice'
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        revision === 'needs_practice'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Needs Practice
                    </button>
                    <button
                      onClick={() =>
                        updateQuestionRevisionStatus(
                          q.id,
                          revision === 'mastered' ? 'not_revised' : 'mastered'
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        revision === 'mastered'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Mastered
                    </button>

                    <button
                      onClick={() => setActivePage('tests')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <span>Test on this question</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Model Answer Drawer */}
                {isExpanded && q.modelAnswer && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Model Answer Key Points &amp; Marking Rubric</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
                      {q.modelAnswer}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Custom Question */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Add Question to Bank
              </h4>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  placeholder="Enter the full exam question..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {[1, 2, 3, 4, 5].map((u) => (
                      <option key={u} value={u}>Unit {u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Marks</label>
                  <select
                    value={customMarks}
                    onChange={(e) => setCustomMarks(Number(e.target.value) as 2 | 5 | 8 | 10 | 16)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value={2}>2 Marks</option>
                    <option value={5}>5 Marks</option>
                    <option value={8}>8 Marks</option>
                    <option value={10}>10 Marks</option>
                    <option value={16}>16 Marks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="student_saved">Student Saved</option>
                    <option value="teacher_provided">Teacher Provided</option>
                    <option value="verified_pyq">Verified PYQ</option>
                    <option value="source_repeated">Source-backed Repeated</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Source Paper Citation (if verified)
                  </label>
                  <input
                    type="text"
                    value={customSourcePaper}
                    onChange={(e) => setCustomSourcePaper(e.target.value)}
                    placeholder="e.g. PTU Dec 2023, CBSE 2024"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Model Answer / Marking Rubric (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customModelAnswer}
                  onChange={(e) => setCustomModelAnswer(e.target.value)}
                  placeholder="Key points, diagrams, formulas, and marks breakdown..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomQuestion}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Save to Bank
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
