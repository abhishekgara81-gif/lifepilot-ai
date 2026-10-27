import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X } from 'lucide-react';

export const NoteModal: React.FC = () => {
  const { noteModalOpen, setNoteModalOpen, editingNote, setEditingNote, addNote, updateNote } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Study');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setCategory(editingNote.category);
      setTagsInput(editingNote.tags.join(', '));
    } else {
      setTitle('');
      setContent('');
      setCategory('Study');
      setTagsInput('');
    }
  }, [editingNote, noteModalOpen]);

  if (!noteModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingNote) {
      updateNote(editingNote.id, {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
      });
    } else {
      addNote({
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags.length ? tags : ['Notes'],
        pinned: false,
      });
    }

    setNoteModalOpen(false);
    setEditingNote(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {editingNote ? 'Edit Document / Note' : 'Draft Document / Study Note'}
          </h2>
          <button
            onClick={() => {
              setNoteModalOpen(false);
              setEditingNote(null);
            }}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Document Title <span className="text-rose-700">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. C++ Virtual Table & Memory Layout Deep Dive"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Study, Architecture, Interview Prep..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="C++, Exam, Algorithms..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Content (Markdown supported)
            </label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Heading&#10;&#10;Key insights, algorithmic formulas, memory diagrams, or review checklists..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-300"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setNoteModalOpen(false);
                setEditingNote(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-900 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30"
            >
              {editingNote ? 'Save Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
