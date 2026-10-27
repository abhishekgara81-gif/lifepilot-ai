import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Tag,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  BookOpen,
} from 'lucide-react';
import { Note } from '../../types';

export const DocumentsPage: React.FC = () => {
  const { notes, setNoteModalOpen, setEditingNote, deleteNote, showToast, searchQuery } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');

  const categories = ['all', ...Array.from(new Set(notes.map((n) => n.category)))];

  const filteredNotes = notes.filter((note) => {
    if (selectedCategory !== 'all' && note.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeNote = notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || notes[0];

  const handleCopyMarkdown = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Markdown copied to clipboard', 'info');
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setNoteModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingNote(null);
    setNoteModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="page-intro flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-0.5">
            <FileText className="w-4 h-4" />
            <span>Personal Knowledge Vault</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Documents & Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Study cheat-sheets, technical interview guides, and project specifications.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-slate-900 shadow-sm'
                : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            {cat === 'all' ? 'All Documents' : cat}
          </button>
        ))}
      </div>

      {/* 2-Column Split: Document Navigator + Markdown Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Document List (1 col) */}
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs">
              No documents match this category.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;

              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300/60 ring-1 ring-blue-300/30 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/40">
                      {note.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {note.pinned && <Pin className="w-3.5 h-3.5 text-amber-700 fill-amber-400" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(note);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-900"
                        title="Edit note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-700"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{note.title}</h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3 font-mono">
                    {note.content.replace(/[#*`]/g, '')}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    <span className="tabular-nums">Updated {note.updatedAt}</span>
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="text-[10px] text-slate-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Markdown Reader View (2 cols) */}
        <div className="lg:col-span-2">
          {activeNote ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-blue-700 font-medium mb-1">
                    <span>{activeNote.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Updated {activeNote.updatedAt}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {activeNote.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyMarkdown(activeNote.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Raw</span>
                  </button>

                  <button
                    onClick={() => handleEdit(activeNote)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Note</span>
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {activeNote.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Formatted Content View */}
              <div className="p-5 rounded-xl bg-slate-50/60 border border-slate-200 text-slate-800 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap select-text overflow-x-auto">
                {activeNote.content}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm">
              Select or draft a document to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
