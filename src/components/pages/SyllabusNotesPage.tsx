import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Upload,
  Mic,
  MicOff,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  HelpCircle,
  GraduationCap,
  Layers,
  ArrowRight,
  Search,
  AlertCircle,
  Edit2,
  Copy,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { extractSyllabus } from '../../services/studentAIService';
import { StudentSubject, SyllabusUnit, SyllabusExtractionResult, EducationLevel } from '../../types';

export const SyllabusNotesPage: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    addSubject,
    updateSubject,
    deleteSubject,
    addUnitToSubject,
    userProfile,
    showToast,
    setActivePage,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'syllabus' | 'addSubject' | 'extract'>('syllabus');

  // Education level for the Add Subject form (defaults to userProfile)
  const defaultLevel: EducationLevel = userProfile.educationLevel || 'college';
  const [formLevel, setFormLevel] = useState<EducationLevel>(defaultLevel);

  // Common Subject Form state
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subExamDate, setSubExamDate] = useState('');

  // School-specific state
  const [schoolBoard, setSchoolBoard] = useState('CBSE');
  const [schoolClass, setSchoolClass] = useState('Class 12');
  const [schoolStream, setSchoolStream] = useState('Science');
  const [schoolAcademicYear, setSchoolAcademicYear] = useState('2026-2027');
  const [schoolGroup, setSchoolGroup] = useState('');
  const [schoolTeacher, setSchoolTeacher] = useState('');

  // College-specific state
  const [collegeUniversity, setCollegeUniversity] = useState(
    userProfile.boardOrUniversity || userProfile.university || 'IKGPTU'
  );
  const [collegeDegree, setCollegeDegree] = useState(userProfile.courseOrClass || 'B.Tech');
  const [collegeBranch, setCollegeBranch] = useState(
    userProfile.branchOrStream || userProfile.branch || 'Computer Science & Engineering'
  );
  const [collegeSemester, setCollegeSemester] = useState<string | number>(
    userProfile.currentYearOrSem || userProfile.semester || 5
  );

  // Other / Competitive state
  const [otherProgram, setOtherProgram] = useState(userProfile.targetExam || 'Competitive Exam / Diploma');

  // Edit Subject Modal state
  const [editingSubject, setEditingSubject] = useState<StudentSubject | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editCourseOrClass, setEditCourseOrClass] = useState('');
  const [editExamDate, setEditExamDate] = useState('');
  const [editTeacher, setEditTeacher] = useState('');

  // AI Extraction & Natural Language Query state
  const [queryPrompt, setQueryPrompt] = useState('');
  const [pastedSyllabus, setPastedSyllabus] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/jpeg');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<SyllabusExtractionResult | null>(null);

  // Editable units inside extraction review screen
  const [reviewedUnits, setReviewedUnits] = useState<
    { unitNumber: number; title: string; topics: string[] }[]
  >([]);
  const [newTopicInputs, setNewTopicInputs] = useState<Record<number, string>>({});

  // Voice Input State
  const [isListening, setIsListening] = useState(false);

  // New Unit Form inside active subject
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitNumber, setNewUnitNumber] = useState(1);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitTopics, setNewUnitTopics] = useState('');
  const [newUnitNotes, setNewUnitNotes] = useState('');

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Speech Recognition setup (Web Speech API)
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'warning');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Listening... Speak your syllabus query or topic prompt.', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQueryPrompt(transcript);
        setIsListening(false);
        showToast(`Heard: "${transcript}"`, 'success');
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        showToast(`Voice input error: ${event.error}`, 'error');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds 10MB limit.', 'error');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPastedSyllabus(content);
        setUploadedBase64(null);
        showToast(`Loaded ${file.name} successfully. Ready to extract topics.`, 'success');
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const base64Data = dataUrl.split(',')[1];
          setUploadedBase64(base64Data);
          setPastedSyllabus(`[Uploaded Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - Ready for AI Vision & Syllabus Parsing]`);
          showToast(`Loaded ${file.name}. Click "Extract Syllabus Topics" to analyze with Gemini Multimodal AI.`, 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractSyllabus = async () => {
    const textToAnalyze = queryPrompt.trim() || pastedSyllabus.trim();
    if (!textToAnalyze && !uploadedBase64) {
      showToast('Please type a prompt, paste syllabus text, or upload a syllabus photo/PDF.', 'warning');
      return;
    }

    setIsExtracting(true);
    try {
      const result = await extractSyllabus({
        text: pastedSyllabus,
        imageBase64: uploadedBase64 || undefined,
        mimeType: uploadedMimeType,
        queryPrompt: queryPrompt,
        university: activeSubject?.university || userProfile.boardOrUniversity || userProfile.university,
        boardOrUniversity: userProfile.boardOrUniversity,
        courseOrClass: userProfile.courseOrClass,
        branch: activeSubject?.branch || userProfile.branchOrStream || userProfile.branch,
        educationLevel: userProfile.educationLevel,
        semester: activeSubject?.semester || userProfile.currentYearOrSem || userProfile.semester,
      });

      setExtractionResult(result);
      setReviewedUnits(result.units.map((u) => ({ ...u, topics: [...u.topics] })));
      if (result.isFallback) {
        showToast(result.notice || 'Syllabus structured using deterministic local engine (AI quota exhausted or offline).', 'info');
      } else {
        showToast('Syllabus extracted in real time via Gemini AI!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Syllabus extraction failed.', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyExtractedToSubject = () => {
    if (!reviewedUnits.length || !activeSubject) return;

    const newUnits: SyllabusUnit[] = reviewedUnits.map((u, idx) => ({
      id: `u-ext-${Date.now()}-${idx}`,
      unitNumber: u.unitNumber,
      title: u.title.trim() || `Unit ${u.unitNumber}`,
      topics: u.topics.filter(Boolean),
      notesText: `High-yield focus topics extracted for ${activeSubject.name}`,
    }));

    updateSubject(activeSubject.id, {
      units: [...activeSubject.units, ...newUnits],
    });

    showToast(`Added ${newUnits.length} reviewed units to ${activeSubject.name}!`, 'success');
    setExtractionResult(null);
    setReviewedUnits([]);
    setPastedSyllabus('');
    setQueryPrompt('');
    setActiveTab('syllabus');
  };

  const handleRemoveReviewTopic = (unitIndex: number, topicIndex: number) => {
    setReviewedUnits((prev) =>
      prev.map((u, uIdx) => {
        if (uIdx !== unitIndex) return u;
        return {
          ...u,
          topics: u.topics.filter((_, tIdx) => tIdx !== topicIndex),
        };
      })
    );
  };

  const handleAddReviewTopic = (unitIndex: number) => {
    const text = (newTopicInputs[unitIndex] || '').trim();
    if (!text) return;
    setReviewedUnits((prev) =>
      prev.map((u, uIdx) => {
        if (uIdx !== unitIndex) return u;
        return { ...u, topics: [...u.topics, text] };
      })
    );
    setNewTopicInputs((prev) => ({ ...prev, [unitIndex]: '' }));
  };

  const handleAddReviewUnit = () => {
    const nextNum = reviewedUnits.length + 1;
    setReviewedUnits((prev) => [
      ...prev,
      { unitNumber: nextNum, title: `Unit ${nextNum}: New Topic Block`, topics: ['Core fundamental topic'] },
    ]);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      showToast('Please provide a subject name.', 'warning');
      return;
    }

    let subjectData: Partial<StudentSubject>;

    if (formLevel === 'school') {
      subjectData = {
        name: subName.trim(),
        code: subCode.trim() || undefined,
        educationLevel: 'school',
        board: schoolBoard,
        boardOrUniversity: schoolBoard,
        gradeOrClass: schoolClass,
        courseOrClass: schoolClass,
        branchOrStream: ['Class 11', 'Class 12'].includes(schoolClass) ? schoolStream : undefined,
        academicYear: schoolAcademicYear,
        subjectGroup: schoolGroup.trim() || undefined,
        teacherName: schoolTeacher.trim() || undefined,
        examDate: subExamDate || undefined,
        units: [
          {
            id: `u-init-${Date.now()}-1`,
            unitNumber: 1,
            title: 'Unit 1: Fundamentals & Core Chapters',
            topics: ['Chapter introduction', 'Key definitions & formulas', 'NCERT/Textbook exercises'],
          },
        ],
      };
    } else if (formLevel === 'college') {
      subjectData = {
        name: subName.trim(),
        code: subCode.trim() || undefined,
        educationLevel: 'college',
        university: collegeUniversity.trim() || undefined,
        boardOrUniversity: collegeUniversity.trim() || undefined,
        courseOrClass: collegeDegree.trim() || undefined,
        branch: collegeBranch.trim() || undefined,
        branchOrStream: collegeBranch.trim() || undefined,
        semester: collegeSemester,
        yearOrSemester: collegeSemester,
        examDate: subExamDate || undefined,
        units: [
          {
            id: `u-init-${Date.now()}-1`,
            unitNumber: 1,
            title: 'Unit 1: Foundations & Core Concepts',
            topics: ['Introduction to syllabus', 'Fundamental principles', 'Basic terminology & definitions'],
          },
        ],
      };
    } else {
      subjectData = {
        name: subName.trim(),
        code: subCode.trim() || undefined,
        educationLevel: formLevel,
        boardOrUniversity: otherProgram.trim() || 'Professional / Competitive Board',
        courseOrClass: otherProgram.trim() || undefined,
        examDate: subExamDate || undefined,
        units: [
          {
            id: `u-init-${Date.now()}-1`,
            unitNumber: 1,
            title: 'Section 1: Foundations & Core Modules',
            topics: ['Overview & scope', 'Key high-yield concepts', 'Practice problems'],
          },
        ],
      };
    }

    const created = addSubject(subjectData as any);
    setSelectedSubjectId(created.id);
    showToast(`Subject "${subName.trim()}" added successfully!`, 'success');

    // Reset form
    setSubName('');
    setSubCode('');
    setSubExamDate('');
    setSchoolGroup('');
    setSchoolTeacher('');
    setActiveTab('syllabus');
  };

  const handleOpenEditModal = (subject: StudentSubject) => {
    setEditingSubject(subject);
    setEditName(subject.name);
    setEditCode(subject.code || '');
    setEditInstitution(subject.university || subject.board || subject.boardOrUniversity || '');
    setEditCourseOrClass(subject.gradeOrClass || subject.courseOrClass || subject.branch || '');
    setEditExamDate(subject.examDate || '');
    setEditTeacher(subject.teacherName || '');
  };

  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editName.trim()) return;

    updateSubject(editingSubject.id, {
      name: editName.trim(),
      code: editCode.trim() || undefined,
      university: editInstitution.trim() || undefined,
      boardOrUniversity: editInstitution.trim() || undefined,
      gradeOrClass: editCourseOrClass.trim() || undefined,
      courseOrClass: editCourseOrClass.trim() || undefined,
      examDate: editExamDate || undefined,
      teacherName: editTeacher.trim() || undefined,
    });

    setEditingSubject(null);
    showToast(`Subject updated successfully!`, 'success');
  };

  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    if (subjects.length <= 1) {
      showToast('You must keep at least one enrolled subject in your workspace.', 'warning');
      return;
    }
    if (window.confirm(`Are you sure you want to remove "${subjectName}"? Your saved notes and units will be deleted.`)) {
      deleteSubject(subjectId);
    }
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject || !newUnitTitle.trim()) return;

    const topicsArr = newUnitTopics
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    addUnitToSubject(activeSubject.id, {
      unitNumber: newUnitNumber,
      title: newUnitTitle.trim(),
      topics: topicsArr.length > 0 ? topicsArr : ['Core unit topic 1', 'Important formulas and derivations'],
      notesText: newUnitNotes.trim() || undefined,
    });

    setShowAddUnitModal(false);
    setNewUnitTitle('');
    setNewUnitTopics('');
    setNewUnitNotes('');
    setNewUnitNumber((prev) => prev + 1);
  };

  const isSchoolSubject = (s: StudentSubject) =>
    s.educationLevel === 'school' ||
    (s.gradeOrClass && s.gradeOrClass.toLowerCase().includes('class')) ||
    (s.courseOrClass && s.courseOrClass.toLowerCase().includes('class'));

  return (
    <div className="space-y-6 pb-16 max-w-6xl">
      {/* Header Banner */}
      <div className="page-intro p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Module 1 · Academic Core</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customized Syllabus &amp; Notes Input
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your school, college, or competitive subjects, upload notes, extract syllabus with Gemini AI, and review units.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2 shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'syllabus'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'extract'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>AI Syllabus Extractor</span>
          </button>
          <button
            onClick={() => setActiveTab('addSubject')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'addSubject'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SUBJECT & UNIT VIEWER */}
      {activeTab === 'syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Subjects List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Enrolled Subjects
              </span>
              <button
                onClick={() => setActiveTab('addSubject')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2">
              {subjects.map((s) => {
                const isSchool = isSchoolSubject(s);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSubjectId(s.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      selectedSubjectId === s.id
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/10'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {s.code ? (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {s.code}
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {isSchool ? (s.gradeOrClass || 'School') : 'Subject'}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {s.units.length} Units
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">{s.name}</h4>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                      {isSchool ? (
                        <span>{s.board || s.boardOrUniversity || 'Board'} · {s.gradeOrClass || s.courseOrClass}</span>
                      ) : (
                        <span>Sem {s.semester || s.yearOrSemester || '1'} · {s.branch || s.courseOrClass || 'Major'}</span>
                      )}
                      {s.examDate && <span className="text-rose-600 font-semibold">{s.examDate}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 space-y-1 mt-4">
              <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Exam Prep Strategy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                Keep your unit topics updated. They directly power your 3-Star Question Bank, Crash Planner, and Copy Checking modules.
              </p>
            </div>
          </div>

          {/* Right Column: Units & Topic Breakdown */}
          <div className="lg:col-span-3 space-y-4">
            {activeSubject ? (
              <div className="space-y-4">
                {/* Active Subject Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {activeSubject.code && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          {activeSubject.code}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isSchoolSubject(activeSubject) ? (
                          <>
                            {activeSubject.board || activeSubject.boardOrUniversity || 'School'} · {activeSubject.gradeOrClass || activeSubject.courseOrClass || 'Class 12'}
                            {activeSubject.branchOrStream ? ` (${activeSubject.branchOrStream})` : ''}
                            {activeSubject.teacherName ? ` · Faculty: ${activeSubject.teacherName}` : ''}
                          </>
                        ) : (
                          <>
                            {activeSubject.university || activeSubject.boardOrUniversity || 'Institution'} · {activeSubject.branch || activeSubject.courseOrClass}
                            {activeSubject.semester ? ` (Sem ${activeSubject.semester})` : ''}
                          </>
                        )}
                      </span>
                      {activeSubject.examDate && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Exam: {activeSubject.examDate}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">{activeSubject.name}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(activeSubject)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                      title="Edit subject details"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(activeSubject.id, activeSubject.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                      title="Delete subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => setShowAddUnitModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Unit</span>
                    </button>
                    <button
                      onClick={() => setActivePage('questions')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <span>Practice PYQ</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Units List */}
                <div className="space-y-3">
                  {activeSubject.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0 ring-1 ring-blue-200 dark:ring-blue-800">
                            U{unit.unitNumber}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{unit.title}</h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {unit.topics.length} Syllabus Topics
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Unit {unit.unitNumber}
                        </span>
                      </div>

                      {/* Topics Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {unit.topics.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Unit Notes Snippet */}
                      {unit.notesText && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Quick Unit Revision Summary</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">{unit.notesText}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Subjects Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Add your school, college, or competitive subjects to start tracking your curriculum.
                </p>
                <button
                  onClick={() => setActiveTab('addSubject')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                >
                  Add Subject Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI SYLLABUS EXTRACTOR & MULTIMODAL PARSER */}
      {activeTab === 'extract' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>AI Syllabus &amp; Notes Extraction</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload a syllabus photo, textbook PDF, or voice/text query. Gemini decomposes it into units and topics.
            </p>
          </div>

          {/* Voice & Search Input Bar */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Voice / Natural Language Query
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={queryPrompt}
                  onChange={(e) => setQueryPrompt(e.target.value)}
                  placeholder="e.g. 'Extract all chapters for Class 12 CBSE Physics' or 'Divide Unit 2 Graph Algorithms'"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-600" />}
                <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Query'}</span>
              </button>
            </div>
          </div>

          {/* Or File Upload / Paste Syllabus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Upload Syllabus PDF, Document, or Photo
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-5 text-center bg-slate-50/50 dark:bg-slate-800/40 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-bold text-blue-600 hover:underline">Choose file</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400"> or drag PDF / Image here</span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <div className="text-[11px] text-slate-400 mt-1">Maximum file size: 10MB</div>
                {uploadedFileName && (
                  <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-block">
                    ✓ {uploadedFileName}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Or Paste Syllabus Text / Unit Outline
              </label>
              <textarea
                value={pastedSyllabus}
                onChange={(e) => setPastedSyllabus(e.target.value)}
                placeholder="Paste course syllabus units, chapters, or textbook topic list..."
                rows={5}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleExtractSyllabus}
              disabled={isExtracting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExtracting ? 'Analyzing Syllabus with Gemini AI...' : 'Extract Syllabus Topics'}</span>
            </button>
          </div>

          {/* INTERACTIVE REVIEW & EDIT SCREEN BEFORE SAVING */}
          {extractionResult && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-5 mt-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Review &amp; Edit Extracted Syllabus</h4>
                    {extractionResult.isFallback ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Local Fallback Engine
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Live Gemini AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {extractionResult.notice || extractionResult.summary}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddReviewUnit}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    + Add Unit
                  </button>
                  <button
                    onClick={handleApplyExtractedToSubject}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to {activeSubject?.name || 'Subject'}</span>
                  </button>
                </div>
              </div>

              {/* Units Review & Edit Blocks */}
              <div className="space-y-4">
                {reviewedUnits.map((u, uIdx) => (
                  <div key={uIdx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 shrink-0">
                        Unit {u.unitNumber}:
                      </span>
                      <input
                        type="text"
                        value={u.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReviewedUnits((prev) =>
                            prev.map((item, idx) => (idx === uIdx ? { ...item, title: val } : item))
                          );
                        }}
                        className="flex-1 p-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="Unit title..."
                      />
                      <button
                        onClick={() => {
                          setReviewedUnits((prev) => prev.filter((_, idx) => idx !== uIdx));
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Topics chips with delete button */}
                    <div className="flex flex-wrap gap-1.5">
                      {u.topics.map((tp, tpIdx) => (
                        <span
                          key={tpIdx}
                          className="text-[11px] pl-2.5 pr-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                        >
                          <span>{tp}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveReviewTopic(uIdx, tpIdx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                            title="Remove topic"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add Topic Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newTopicInputs[uIdx] || ''}
                        onChange={(e) => setNewTopicInputs((prev) => ({ ...prev, [uIdx]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddReviewTopic(uIdx);
                          }
                        }}
                        placeholder="+ Add topic and press Enter..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddReviewTopic(uIdx)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* High Yield Focus Areas */}
              {extractionResult.importantFocusAreas?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>High-Yield Examination Focus Areas (Gemini AI Insight)</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800 dark:text-amber-300">
                    {extractionResult.importantFocusAreas.map((fa, faIdx) => (
                      <li key={faIdx}>{fa}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DYNAMIC "ADD SUBJECT" FORM (SCHOOL vs COLLEGE vs OTHER) */}
      {activeTab === 'addSubject' && (
        <form
          onSubmit={handleCreateSubject}
          className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 max-w-2xl"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Add New Academic Subject</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure curriculum setup specifically tailored to your education level.
            </p>
          </div>

          {/* Education Level Switcher */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Education Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormLevel('school')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  formLevel === 'school'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                🏫 School (Class 6–12)
              </button>
              <button
                type="button"
                onClick={() => setFormLevel('college')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  formLevel === 'college'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                🎓 College / University
              </button>
              <button
                type="button"
                onClick={() => setFormLevel('competitive')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  formLevel === 'competitive' || formLevel === 'diploma' || formLevel === 'nursing'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                🎯 Other / Competitive
              </button>
            </div>
          </div>

          {/* DYNAMIC FIELDS: FOR SCHOOL STUDENTS */}
          {formLevel === 'school' && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>School Academic Information (No university semester required)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    School Board *
                  </label>
                  <select
                    value={schoolBoard}
                    onChange={(e) => setSchoolBoard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="CBSE">CBSE (Central Board)</option>
                    <option value="ICSE">ICSE / ISC</option>
                    <option value="State Board">State Board</option>
                    <option value="IB">IB / Cambridge</option>
                    <option value="Other">Other Board</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Class *
                  </label>
                  <select
                    value={schoolClass}
                    onChange={(e) => setSchoolClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stream for Classes 11–12 */}
              {['Class 11', 'Class 12'].includes(schoolClass) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Academic Stream (Class 11–12)
                    </label>
                    <select
                      value={schoolStream}
                      onChange={(e) => setSchoolStream(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="Science">Science (PCM / PCB)</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts / Humanities">Arts / Humanities</option>
                      <option value="Vocational">Vocational / Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={schoolAcademicYear}
                      onChange={(e) => setSchoolAcademicYear(e.target.value)}
                      placeholder="e.g. 2026-2027"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subject Group or Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={schoolGroup}
                    onChange={(e) => setSchoolGroup(e.target.value)}
                    placeholder="e.g. Core Subject / Elective / Language"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Teacher / Tutor Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={schoolTeacher}
                    onChange={(e) => setSchoolTeacher(e.target.value)}
                    placeholder="e.g. Mrs. Sharma"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: FOR COLLEGE / UNIVERSITY STUDENTS */}
          {formLevel === 'college' && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>College / University Setup</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    University / College Name
                  </label>
                  <input
                    type="text"
                    value={collegeUniversity}
                    onChange={(e) => setCollegeUniversity(e.target.value)}
                    placeholder="e.g. Punjab Technical University (PTU)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Degree / Course
                  </label>
                  <input
                    type="text"
                    value={collegeDegree}
                    onChange={(e) => setCollegeDegree(e.target.value)}
                    placeholder="e.g. B.Tech, B.Sc, B.Com, MBBS, BCA"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Branch / Specialization
                  </label>
                  <input
                    type="text"
                    value={collegeBranch}
                    onChange={(e) => setCollegeBranch(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Semester / Year
                  </label>
                  <select
                    value={collegeSemester}
                    onChange={(e) => setCollegeSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                    {['Year 1', 'Year 2', 'Year 3', 'Year 4'].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: FOR OTHER / COMPETITIVE / DIPLOMA */}
          {formLevel !== 'school' && formLevel !== 'college' && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Program / Target Exam Information</span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Exam or Diploma Program *
                </label>
                <input
                  type="text"
                  value={otherProgram}
                  onChange={(e) => setOtherProgram(e.target.value)}
                  placeholder="e.g. NEET-UG, JEE Advanced, Polytechnic Diploma, Nursing Council Exam"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* COMMON SUBJECT NAME & OPTIONAL CODE */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subject Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder={
                formLevel === 'school'
                  ? 'e.g. Physics, Accountancy, or Political Science'
                  : 'e.g. Design & Analysis of Algorithms'
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subject Code <span className="text-slate-400 font-normal">(Strictly Optional)</span>
              </label>
              <input
                type="text"
                value={subCode}
                onChange={(e) => setSubCode(e.target.value)}
                placeholder={formLevel === 'school' ? 'Optional (e.g. 042)' : 'Optional (e.g. CS-301)'}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Upcoming Exam Date (Optional)
              </label>
              <input
                type="date"
                value={subExamDate}
                onChange={(e) => setSubExamDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('syllabus')}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Add Subject
            </button>
          </div>
        </form>
      )}

      {/* EDIT SUBJECT MODAL */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Subject Details</span>
              </h3>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subject Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    placeholder="e.g. 042 or CS-301"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Exam Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={editExamDate}
                    onChange={(e) => setEditExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Board / University
                  </label>
                  <input
                    type="text"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    placeholder="e.g. CBSE or PTU"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Class / Branch / Course
                  </label>
                  <input
                    type="text"
                    value={editCourseOrClass}
                    onChange={(e) => setEditCourseOrClass(e.target.value)}
                    placeholder="e.g. Class 12 or B.Tech CSE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Teacher / Faculty Name (Optional)
                </label>
                <input
                  type="text"
                  value={editTeacher}
                  onChange={(e) => setEditTeacher(e.target.value)}
                  placeholder="e.g. Mrs. Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD UNIT MODAL */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Syllabus Unit to {activeSubject?.name}</span>
              </h3>
              <button
                onClick={() => setShowAddUnitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Unit #</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newUnitNumber}
                    onChange={(e) => setNewUnitNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-bold"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Unit Title *</label>
                  <input
                    type="text"
                    required
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder="e.g. Unit 3: Dynamic Programming"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Topics / Chapters (One per line)
                </label>
                <textarea
                  rows={4}
                  value={newUnitTopics}
                  onChange={(e) => setNewUnitTopics(e.target.value)}
                  placeholder="Introduction to Dynamic Programming&#10;0/1 Knapsack Problem&#10;Longest Common Subsequence (LCS)&#10;Matrix Chain Multiplication"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quick Revision Notes / Key Formulas (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newUnitNotes}
                  onChange={(e) => setNewUnitNotes(e.target.value)}
                  placeholder="Important formulas, runtime complexities, or exam definitions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
