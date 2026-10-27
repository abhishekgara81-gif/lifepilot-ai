import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Goal, TaskCategory, GoalMilestone } from '../../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { getRelativeDate } from '../../data/initialData';

export const GoalModal: React.FC = () => {
  const { goalModalOpen, setGoalModalOpen, editingGoal, setEditingGoal, addGoal, updateGoal } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [targetDate, setTargetDate] = useState(getRelativeDate(30));
  const [color, setColor] = useState('#245EEA');
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description);
      setCategory(editingGoal.category);
      setTargetDate(editingGoal.targetDate);
      setColor(editingGoal.color || '#245EEA');
      setMilestones(editingGoal.milestones || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('study');
      setTargetDate(getRelativeDate(30));
      setColor('#245EEA');
      setMilestones([]);
    }
  }, [editingGoal, goalModalOpen]);

  if (!goalModalOpen) return null;

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones((prev) => [
      ...prev,
      {
        id: `ms-${Date.now()}`,
        title: newMilestoneTitle.trim(),
        completed: false,
      },
    ]);
    setNewMilestoneTitle('');
  };

  const handleToggleMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const completedCount = milestones.filter((m) => m.completed).length;
    const progress = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0;
    const status = progress === 100 ? 'achieved' : progress > 0 ? 'in_progress' : 'not_started';

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate,
        color,
        milestones,
        progress,
        status,
      });
    } else {
      addGoal({
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate,
        color,
        milestones,
        progress,
        status,
      });
    }

    setGoalModalOpen(false);
    setEditingGoal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {editingGoal ? 'Edit Strategic Goal' : 'Establish Strategic Goal'}
          </h2>
          <button
            onClick={() => {
              setGoalModalOpen(false);
              setEditingGoal(null);
            }}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Goal Objective <span className="text-rose-700">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Operating Systems & Score >90% on Final"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Description & Impact</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this goal matters and what success looks like..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              >
                <option value="study">Study / Academic</option>
                <option value="coding">Coding / Technical</option>
                <option value="project">Project Deliverable</option>
                <option value="personal">Career & Personal</option>
                <option value="learning">Learning / Personal Development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Target Completion Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              />
            </div>
          </div>

          {/* Milestones list */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Key Milestones ({milestones.filter((m) => m.completed).length}/{milestones.length})
            </label>
            <div className="space-y-1.5 mb-2.5 max-h-36 overflow-y-auto">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-1.5 bg-slate-50/60 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => handleToggleMilestone(m.id)}
                    className="w-4 h-4 rounded text-blue-700 bg-slate-100 border-slate-300 cursor-pointer"
                  />
                  <span className={`flex-1 text-xs truncate ${m.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                    {m.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(m.id)}
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
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
                placeholder="Add milestone step..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-300"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setGoalModalOpen(false);
                setEditingGoal(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-900 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30"
            >
              {editingGoal ? 'Save Changes' : 'Establish Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
