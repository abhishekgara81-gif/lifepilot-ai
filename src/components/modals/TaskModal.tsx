import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskPriority, TaskCategory, TaskStatus, Subtask, TaskRecurrence } from '../../types';
import { X, Plus, Trash2, Clock, Calendar, CheckSquare, Tag, Folder, Repeat } from 'lucide-react';
import { getRelativeDate } from '../../data/initialData';

export const TaskModal: React.FC = () => {
  const {
    taskModalOpen,
    setTaskModalOpen,
    editingTask,
    setEditingTask,
    addTask,
    updateTask,
    tasks,
    showToast,
    projects,
    goals,
  } = useApp();

  // Calendar and project entry points provide an unsaved task draft with an empty ID.
  // Only tasks with a persisted ID should take the edit path.
  const isEditingExistingTask = Boolean(editingTask?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [dueDate, setDueDate] = useState(getRelativeDate(0));
  const [dueTime, setDueTime] = useState('14:00');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [projectId, setProjectId] = useState<string>('');
  const [goalId, setGoalId] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setCategory(editingTask.category);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime || '12:00');
      setStartTime(editingTask.startTime || editingTask.dueTime || '14:00');
      setEndTime(editingTask.endTime || '15:00');
      setRecurrence(editingTask.recurrence || 'none');
      setEstimatedMinutes(editingTask.estimatedMinutes || 60);
      setProjectId(editingTask.projectId || '');
      setGoalId(editingTask.goalId || '');
      setSubtasks(editingTask.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setCategory('study');
      setDueDate(getRelativeDate(0));
      setDueTime('14:00');
      setStartTime('14:00');
      setEndTime('15:00');
      setRecurrence('none');
      setEstimatedMinutes(60);
      setProjectId(projects[0]?.id || '');
      setGoalId(goals[0]?.id || '');
      setSubtasks([]);
    }
  }, [editingTask, taskModalOpen, projects, goals]);

  if (!taskModalOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      category,
      dueDate,
      dueTime: startTime || dueTime || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      recurrence,
      estimatedMinutes: Number(estimatedMinutes) || 45,
      projectId: projectId || undefined,
      goalId: goalId || undefined,
      subtasks,
    };

    if (editingTask?.id && !tasks.some((task) => task.id === editingTask.id)) {
      showToast('This task no longer exists. Reopen it before saving changes.', 'error');
      return;
    }

    try {
      if (editingTask?.id) {
        updateTask(editingTask.id, taskData);
      } else {
        const createdTask = addTask(taskData);
        if (!createdTask.id) {
          showToast('Task could not be created. Please try again.', 'error');
          return;
        }
      }
    } catch {
      showToast('Task could not be saved. Please try again.', 'error');
      return;
    }

    setTaskModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {isEditingExistingTask ? 'Edit Action Task' : 'Create New Action Task'}
          </h2>
          <button
            onClick={() => {
              setTaskModalOpen(false);
              setEditingTask(null);
            }}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Task Title <span className="text-rose-700">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master C++ Memory Allocators & RAII"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Description & Strategy Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key concepts to focus on, links, or textbook problems..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
            />
          </div>

          {/* Grid: Priority, Category, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              >
                <option value="high">High (P1 Urgent)</option>
                <option value="medium">Medium (P2 Core)</option>
                <option value="low">Low (P3 Nice-to-have)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              >
                <option value="study">Study / Exam</option>
                <option value="coding">Coding / DSA</option>
                <option value="project">Project Build</option>
                <option value="revision">Revision</option>
                <option value="personal">Personal / Career</option>
                <option value="learning">Learning / Personal Development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Recurrence & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-blue-700" />
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              >
                <option value="none">One-time Task</option>
                <option value="daily">Every day (Daily recurring)</option>
                <option value="weekly">Every week (Weekly recurring)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                Duration (minutes)
              </label>
              <input
                type="number"
                min="10"
                max="480"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 45)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300 tabular-nums"
              />
            </div>
          </div>

          {/* Date & Start/End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                {recurrence === 'daily' ? 'Start Date' : 'Due Date'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setDueTime(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              />
            </div>
          </div>

          {/* Goal & Project Linkage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Link to Goal</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              >
                <option value="">(None / General Task)</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Link to Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              >
                <option value="">(None / Standalone)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-700">
                Action Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
              </label>
            </div>

            <div className="space-y-1.5 mb-2.5 max-h-36 overflow-y-auto">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-2 p-1.5 bg-slate-50/60 rounded-lg border border-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => handleToggleSubtask(st.id)}
                    className="w-4 h-4 rounded text-blue-700 focus:ring-0 focus:ring-offset-0 bg-slate-100 border-slate-300 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-xs truncate ${
                      st.completed ? 'line-through text-slate-500' : 'text-slate-800'
                    }`}
                  >
                    {st.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="text-slate-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add checklist subtask..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-300"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setTaskModalOpen(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              {isEditingExistingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
