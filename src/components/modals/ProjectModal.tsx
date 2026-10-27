import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X } from 'lucide-react';
import { getRelativeDate } from '../../data/initialData';

export const ProjectModal: React.FC = () => {
  const { projectModalOpen, setProjectModalOpen, addProject } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(getRelativeDate(30));
  const [color, setColor] = useState('#245EEA');
  const [tagsInput, setTagsInput] = useState('');

  if (!projectModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addProject({
      name: name.trim(),
      description: description.trim(),
      deadline,
      color,
      status: 'active',
      tags: tags.length ? tags : ['Project'],
    });

    setName('');
    setDescription('');
    setTagsInput('');
    setProjectModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Create New Project Workspace</h2>
          <button
            onClick={() => setProjectModalOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Project Name <span className="text-rose-700">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Distributed Database Cache Engine"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Description & Scope</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary deliverables, architecture requirements, or lab expectations..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Project Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2 pt-1">
                {['#245EEA', '#0E8C87', '#7291D8', '#D88C36', '#DF705F'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-lg transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-white/60' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. C++, Concurrency, High Performance"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
