import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { EducationLevel } from '../../types';
import { TimePicker12 } from '../common/TimePicker12';
import {
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  Check,
  X,
  School,
  Briefcase,
  Stethoscope,
  Cpu,
  Trophy,
} from 'lucide-react';

interface AcademicSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EDUCATION_LEVELS: {
  id: EducationLevel;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
  defaultCourse: string;
  defaultBoard: string;
  defaultStream?: string;
}[] = [
  {
    id: 'school',
    title: 'School Education',
    subtitle: 'Classes 6 to 12 • CBSE, ICSE, State Boards',
    icon: School,
    badge: 'K-12 Board Exam',
    defaultCourse: 'Class 12',
    defaultBoard: 'CBSE',
    defaultStream: 'Science (PCM)',
  },
  {
    id: 'engineering',
    title: 'Engineering & Tech',
    subtitle: 'B.Tech / B.E. • CSE, AI/ML, ECE, IT, ME, CE',
    icon: Cpu,
    badge: 'Semester & Placements',
    defaultCourse: 'B.Tech CSE',
    defaultBoard: 'IKGPTU / PTU',
    defaultStream: 'Computer Science & Engineering',
  },
  {
    id: 'nursing',
    title: 'Medical & Healthcare',
    subtitle: 'B.Sc Nursing, GNM, MBBS, BDS, B.Pharm',
    icon: Stethoscope,
    badge: 'Clinical & University Exams',
    defaultCourse: 'B.Sc Nursing',
    defaultBoard: 'BFUHS / INC',
    defaultStream: 'Nursing Sciences',
  },
  {
    id: 'college',
    title: 'General College Degrees',
    subtitle: 'B.Com, BBA, B.Sc, B.A, BCA, MCA, MBA',
    icon: GraduationCap,
    badge: 'Undergrad & Postgrad',
    defaultCourse: 'B.Com',
    defaultBoard: 'Panjab University',
    defaultStream: 'Commerce & Finance',
  },
  {
    id: 'diploma',
    title: 'Diploma & Polytechnic',
    subtitle: 'Polytechnic 3-Year Technical Diplomas',
    icon: Briefcase,
    badge: 'Technical Board',
    defaultCourse: 'Diploma CSE',
    defaultBoard: 'State Board of Technical Education',
    defaultStream: 'Computer Engineering',
  },
  {
    id: 'competitive',
    title: 'Competitive Exams',
    subtitle: 'JEE, NEET, GATE, CUET, NDA, UPSC Foundation',
    icon: Trophy,
    badge: 'National Rank Prep',
    defaultCourse: 'JEE Main & Advanced',
    defaultBoard: 'NTA',
    defaultStream: 'Engineering Entrance',
  },
];

export const AcademicSetupModal: React.FC<AcademicSetupModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateUserProfile, switchAcademicLevel, showToast } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>(
    userProfile.educationLevel || 'engineering'
  );
  const [boardOrUniversity, setBoardOrUniversity] = useState(
    userProfile.boardOrUniversity || 'IKGPTU'
  );
  const [courseOrClass, setCourseOrClass] = useState(
    userProfile.courseOrClass || 'B.Tech CSE'
  );
  const [branchOrStream, setBranchOrStream] = useState(
    userProfile.branchOrStream || 'Computer Science'
  );
  const [currentYearOrSem, setCurrentYearOrSem] = useState(
    userProfile.currentYearOrSem || 'Semester 6'
  );
  const [targetExamDate, setTargetExamDate] = useState(
    userProfile.targetExamDate || ''
  );
  const [targetScore, setTargetScore] = useState(
    userProfile.targetScore || '85%'
  );
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi' | 'hinglish'>(
    userProfile.preferredLanguage === 'hindi' || userProfile.preferredLanguage === 'hi'
      ? 'hi'
      : userProfile.preferredLanguage === 'hinglish'
      ? 'hinglish'
      : 'en'
  );
  const [studyStartTime, setStudyStartTime] = useState(
    userProfile.studyHours?.start || '08:00'
  );
  const [studyEndTime, setStudyEndTime] = useState(
    userProfile.studyHours?.end || '22:00'
  );
  const [loadPresets, setLoadPresets] = useState(true);

  // Reset scroll and reinitialize on modal open
  useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      setSelectedLevel(userProfile.educationLevel || 'engineering');
      setBoardOrUniversity(userProfile.boardOrUniversity || 'IKGPTU');
      setCourseOrClass(userProfile.courseOrClass || 'B.Tech CSE');
      setBranchOrStream(userProfile.branchOrStream || 'Computer Science');
      setCurrentYearOrSem(userProfile.currentYearOrSem || 'Semester 6');
      setTargetExamDate(userProfile.targetExamDate || '');
      setTargetScore(userProfile.targetScore || '85%');
    }
  }, [isOpen, userProfile]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectLevelCard = (lvl: typeof EDUCATION_LEVELS[0]) => {
    setSelectedLevel(lvl.id);
    setBoardOrUniversity(lvl.defaultBoard);
    setCourseOrClass(lvl.defaultCourse);
    if (lvl.defaultStream) setBranchOrStream(lvl.defaultStream);
  };

  const handleSave = () => {
    switchAcademicLevel(selectedLevel, { loadStarterSubjects: loadPresets });
    updateUserProfile({
      educationLevel: selectedLevel,
      boardOrUniversity,
      courseOrClass,
      branchOrStream,
      currentYearOrSem,
      targetExamDate,
      targetScore,
      preferredLanguage,
      studyHours: {
        start: studyStartTime,
        end: studyEndTime,
      },
    });
    showToast('Academic profile updated successfully!', 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="academic-setup-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="academic-setup-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Academic Profile &amp; Stream Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailor syllabus, questions, study plans &amp; mock interviews to your curriculum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* Step 1: Select Education Stream */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              1. Select Your Education Level / Stream
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EDUCATION_LEVELS.map((lvl) => {
                const Icon = lvl.icon;
                const isSelected = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => handleSelectLevelCard(lvl)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{lvl.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {lvl.subtitle}
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {lvl.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Course, Board & Branch Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              2. Academic Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {selectedLevel === 'school' ? 'Board of Education' : 'University / Board / Council'}
                </label>
                <input
                  type="text"
                  value={boardOrUniversity}
                  onChange={(e) => setBoardOrUniversity(e.target.value)}
                  placeholder={selectedLevel === 'school' ? 'e.g. CBSE, PSEB, ICSE' : 'e.g. IKGPTU, BFUHS, Delhi University'}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {selectedLevel === 'school' ? 'Class' : 'Degree / Course'}
                </label>
                <input
                  type="text"
                  value={courseOrClass}
                  onChange={(e) => setCourseOrClass(e.target.value)}
                  placeholder={selectedLevel === 'school' ? 'e.g. Class 12, Class 10' : 'e.g. B.Tech CSE, B.Sc Nursing, B.Com'}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {selectedLevel === 'school' ? 'Stream / Group (if Class 11–12)' : 'Branch / Specialization'}
                </label>
                <input
                  type="text"
                  value={branchOrStream}
                  onChange={(e) => setBranchOrStream(e.target.value)}
                  placeholder={selectedLevel === 'school' ? 'e.g. Science (PCM), Commerce, Arts' : 'e.g. CSE, AI/ML, Medical-Surgical Nursing'}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {selectedLevel === 'school' ? 'Academic Session / Term' : 'Year / Semester'}
                </label>
                <input
                  type="text"
                  value={currentYearOrSem}
                  onChange={(e) => setCurrentYearOrSem(e.target.value)}
                  placeholder={selectedLevel === 'school' ? 'e.g. 2026-27 Term 2' : 'e.g. Semester 6, Year 3'}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Exam Target & Target Score */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              3. Examination Target &amp; Benchmark
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Target Exam Date
                </label>
                <input
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Score / GPA / Rank
                </label>
                <input
                  type="text"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="e.g. 90%, 9.5 CGPA, AIR < 500"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Language & Starter Curriculum Checkbox */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              4. Language &amp; Starter Curriculum
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Study &amp; Answer Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="en">English (Standard academic questions &amp; terms)</option>
                  <option value="hi">Hindi (हिंदी माध्यम - प्रश्न और समाधान)</option>
                  <option value="hinglish">Hinglish (Conversational mix for easy understanding)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4 sm:pt-6">
                <input
                  type="checkbox"
                  id="loadPresetsCheck"
                  checked={loadPresets}
                  onChange={(e) => setLoadPresets(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="loadPresetsCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Load curriculum starter preset for this stream
                </label>
              </div>
            </div>
          </div>

          {/* Step 5: Daily Study Hours Window */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Daily Study Window (12-Hour AM / PM Format)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Start Study Window
                </label>
                <TimePicker12 value={studyStartTime} onChange={setStudyStartTime} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  End Study Window
                </label>
                <TimePicker12 value={studyEndTime} onChange={setStudyEndTime} />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            Save Academic Profile
          </button>
        </div>
      </div>
    </div>
  );
};
