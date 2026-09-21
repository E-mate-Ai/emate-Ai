'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Trash2, Plus, Sparkles, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  getNotebook,
  saveNotebook,
  appendToNotebook,
  deleteNotebookEntry,
  clearNotebook,
  SubjectNotebook,
  NotebookEntry,
} from '@/lib/notebook';

interface NotebookOverlayProps {
  subjectName: string;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function NotebookOverlay({ subjectName, onClose, theme }: NotebookOverlayProps) {
  const [notebook, setNotebook] = useState<SubjectNotebook | null>(null);
  const [newNote, setNewNote] = useState('');

  const refreshNotebook = () => {
    setNotebook(getNotebook(subjectName));
  };

  useEffect(() => {
    refreshNotebook();
    const handleNotebookChange = (e: any) => {
      if (e.detail?.subject === subjectName) {
        refreshNotebook();
      }
    };
    window.addEventListener('nk-notebook-change', handleNotebookChange);
    return () => window.removeEventListener('nk-notebook-change', handleNotebookChange);
  }, [subjectName]);

  const handleAddNote = () => {
    const text = newNote.trim();
    if (!text) return;
    appendToNotebook(subjectName, text, 'user');
    setNewNote('');
    refreshNotebook();
    toast.success('Notebook entry saved successfully!');
  };

  const handleDeleteNote = (id: string) => {
    deleteNotebookEntry(subjectName, id);
    refreshNotebook();
    toast.info('Note removed from workspace.');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notes in this notebook?')) {
      clearNotebook(subjectName);
      refreshNotebook();
      toast.success('Notebook cleared successfully.');
    }
  };

  const bdr = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const surface = theme === 'dark' ? '#111113' : '#f9f9fb';
  const cardBg = theme === 'dark' ? '#18181b' : '#ffffff';
  const textPrimary = theme === 'dark' ? '#f4f4f5' : '#18181b';
  const textMuted = theme === 'dark' ? '#71717a' : '#71717a';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 animate-in fade-in zoom-in-95 duration-150"
      style={{ color: textPrimary }}
    >
      {/* Top Notebook Toolbar */}
      <div
        className="flex items-center justify-between px-8 py-4 border-b bg-zinc-50/50 dark:bg-zinc-900/50"
        style={{ borderColor: bdr }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
            title="Back to chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            Notebook
          </span>
          <h1 className="text-base font-bold">{subjectName}</h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          title="Close notebook"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Full Notebook Content Pane */}
      <div className="flex-1 overflow-y-auto p-8 w-full max-w-5xl mx-auto flex flex-col gap-6">
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4"
          style={{ borderColor: bdr }}
        >
          <div>
            <h2 className="text-lg font-bold">Personalized Knowledge Base</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Custom study context e-Mate pulls from dynamically when answering queries.
            </p>
          </div>
          {notebook && notebook.entries.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-medium px-4 py-2 rounded-full bg-[#db7a88] hover:bg-[#c96a78] text-white transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Notes
            </button>
          )}
        </div>

        {/* Add Quick Note Section */}
        <div className="p-4 rounded-2xl border" style={{ borderColor: bdr, background: surface }}>
          <label htmlFor="new-notebook-note" className="text-sm font-semibold mb-2 block">Add study notes or pyqs</label>
          <div className="flex gap-2 items-center">
            <textarea
              id="new-notebook-note"
              name="newNotebookNote"
              aria-label="Add study notes or pyqs"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Paste important questions, syllabus highlights, formulas, or general context here..."
              rows={2}
              className="flex-1 bg-white dark:bg-zinc-900 border text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              style={{ borderColor: bdr }}
            />
            <button
              onClick={handleAddNote}
              className="px-5 py-2.5 rounded-full bg-[#0060df] hover:bg-[#0052cc] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="flex-1">
          {!notebook || notebook.entries.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-2xl"
              style={{ borderColor: bdr }}
            >
              <BookOpen className="w-10 h-10 text-zinc-350 dark:text-zinc-600 mb-3" />
              <p className="font-semibold text-sm">Your notebook is currently empty</p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Add context notes manually above, or simply chat with e-Mate study copilot, which
                appends key concepts dynamically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notebook.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl border flex flex-col justify-between group relative transition-all hover:shadow-sm"
                  style={{ borderColor: bdr, background: cardBg }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>

                  <div
                    className="flex items-center justify-between mt-4 pt-3 border-t text-[10px]"
                    style={{ borderColor: bdr, color: textMuted }}
                  >
                    <div className="flex items-center gap-1">
                      {entry.source === 'ai' ? (
                        <span className="flex items-center gap-1 font-semibold text-indigo-500">
                          <Sparkles className="w-3 h-3" /> Auto-Saved
                        </span>
                      ) : (
                        <span className="font-semibold text-zinc-550 dark:text-zinc-400">
                          Manual Note
                        </span>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {entry.timestamp}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteNote(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-red-500 transition-all"
                      title="Delete note"
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
    </div>
  );
}
