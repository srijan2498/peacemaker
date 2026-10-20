import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';
import {
  NotebookPen,
  Plus,
  Search,
  Pin,
  Trash2,
  Archive,
  RotateCcw,
  Tag,
  Check,
  Cloud,
  Clock,
  Sparkles
} from 'lucide-react';
import type { NoteSummary } from 'cozynest-shared';

export const NotesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [viewTab, setViewTab] = useState<'active' | 'archived' | 'trash'>('active');

  const [editingNote, setEditingNote] = useState<NoteSummary | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Editor Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('#FFFFFF');
  const [icon, setIcon] = useState('📝');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const pastelColors = [
    { name: 'Warm Cream', hex: '#FFFFFF' },
    { name: 'Soft Lavender', hex: '#F0EAFF' },
    { name: 'Mint Leaf', hex: '#E8F7EE' },
    { name: 'Peach Glow', hex: '#FFF2EB' },
    { name: 'Light Sky', hex: '#D9EEFF' },
    { name: 'Soft Rose', hex: '#FDF2F4' },
    { name: 'Warm Butter', hex: '#FEF9C3' }
  ];

  const noteIcons = ['📝', '🌻', '🌷', '🌙', '☕', '💡', '🍓', '🧸', '✨', '📖'];

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openNewNote();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Fetch Notes
  const { data, isLoading } = useQuery<{ notes: NoteSummary[]; tags: string[] }>({
    queryKey: ['notes', search, selectedTag, viewTab],
    queryFn: async () => {
      const res = await api.get('/notes', {
        params: {
          search,
          tag: selectedTag || undefined,
          archived: viewTab === 'archived' ? 'true' : undefined,
          trash: viewTab === 'trash' ? 'true' : undefined
        }
      });
      return res.data.data;
    }
  });

  const notes = data?.notes || [];
  const tags = data?.tags || [];

  const openNewNote = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTagsInput('');
    setColor('#FFFFFF');
    setIcon('📝');
    setSaveStatus('idle');
    setIsEditorOpen(true);
  };

  const openEditNote = (n: NoteSummary) => {
    setEditingNote(n);
    setTitle(n.title);
    setContent(n.content);
    setTagsInput(n.tags.join(', '));
    setColor(n.color || '#FFFFFF');
    setIcon(n.icon || '📝');
    setSaveStatus('idle');
    setIsEditorOpen(true);
  };

  // Debounced Autosave for editing existing note
  useEffect(() => {
    if (!editingNote || !isEditorOpen) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const splitTags = tagsInput
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);

        await api.patch(`/notes/${editingNote._id}`, {
          title: title.trim() || 'Untitled Note',
          content,
          tags: splitTags,
          color,
          icon
        });
        setSaveStatus('saved');
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (err) {
        setSaveStatus('idle');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [title, content, tagsInput, color, icon]);

  const handleSaveExplicit = async (e: React.FormEvent) => {
    e.preventDefault();
    const splitTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      if (editingNote) {
        await api.patch(`/notes/${editingNote._id}`, {
          title: title.trim() || 'Untitled Note',
          content,
          tags: splitTags,
          color,
          icon
        });
        toast.success('Note updated!');
      } else {
        await api.post('/notes', {
          title: title.trim() || 'Untitled Note',
          content,
          tags: splitTags,
          color,
          icon
        });
        toast.success('Note created! 📝');
      }
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsEditorOpen(false);
    } catch (err: any) {
      toast.error('Failed to save note.');
    }
  };

  const togglePinMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notes/${id}/toggle-pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const moveToTrashMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Note moved to trash.');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notes/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Note restored! 🌷');
    }
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}?permanent=true`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note permanently deleted.');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
              My Little Notebook
            </h2>
            <Badge variant="yellow" size="sm">
              Strictly Private 🔒
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
            A quiet, peaceful digital journal for your thoughts, lists, recipes & reflections
          </p>
        </div>

        <Button variant="primary" onClick={openNewNote} className="shadow-soft-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Write New Note
        </Button>
      </div>

      {/* Tabs & Search & Tag Filters */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setViewTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewTab === 'active'
                  ? 'bg-white dark:bg-cozy-darkCard shadow-xs text-cozy-lavender'
                  : 'text-cozy-muted'
              }`}
            >
              Notes 📝
            </button>
            <button
              onClick={() => setViewTab('trash')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewTab === 'trash'
                  ? 'bg-white dark:bg-cozy-darkCard shadow-xs text-cozy-lavender'
                  : 'text-cozy-muted'
              }`}
            >
              Trash 🗑️
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-cozy-muted" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/40 border border-purple-50 dark:border-purple-900/30 rounded-2xl pl-10 pr-4 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
            />
          </div>
        </div>

        {/* Tag Filters */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedTag('')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-all ${
                selectedTag === ''
                  ? 'bg-cozy-lavender text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-cozy-muted hover:text-cozy-text'
              }`}
            >
              All Tags
            </button>
            {tags.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-all ${
                  selectedTag === t
                    ? 'bg-cozy-lavender text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-cozy-muted hover:text-cozy-text'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Your little notebook is waiting for its first thought"
          description="Capture recipes, weekend family plans, book quotes, or quiet evening memories."
          actionLabel="Write Note Now"
          onAction={openNewNote}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {notes.map(note => (
            <div
              key={note._id}
              onClick={() => viewTab === 'active' && openEditNote(note)}
              className="p-5 rounded-3xl border border-purple-100/60 dark:border-purple-900/30 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-md cursor-pointer flex flex-col justify-between space-y-3 relative group text-left"
              style={{
                backgroundColor: note.color || '#FFFFFF',
                color: '#292D35'
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl">{note.icon || '📝'}</span>
                    <h4 className="text-sm font-bold truncate text-slate-800">{note.title}</h4>
                  </div>

                  {viewTab === 'active' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        togglePinMutation.mutate(note._id);
                      }}
                      className={`p-1 rounded-xl transition-colors ${
                        note.isPinned
                          ? 'text-purple-600 font-bold bg-white/80 shadow-xs'
                          : 'text-slate-400 hover:text-slate-700 opacity-60 group-hover:opacity-100'
                      }`}
                      title={note.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                  {note.content || 'Blank note...'}
                </p>
              </div>

              <div>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.map(t => (
                      <span
                        key={t}
                        className="text-[10px] font-semibold bg-white/70 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-[10px] text-slate-500">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>

                  {viewTab === 'active' ? (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        moveToTrashMutation.mutate(note._id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Move to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => restoreMutation.mutate(note._id)}
                        className="text-purple-600 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => permanentDeleteMutation.mutate(note._id)}
                        className="text-rose-600 hover:underline font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rich Note Editor Modal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingNote ? 'Edit Note' : 'Write Note'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveExplicit} className="space-y-4 text-left">
          {/* Top Bar with Icon & Color Picker */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-purple-50 dark:border-purple-900/30">
            {/* Mascot Icon Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-cozy-muted font-semibold">Icon:</span>
              <div className="flex gap-1">
                {noteIcons.map(ic => (
                  <button
                    type="button"
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-transform ${
                      icon === ic ? 'bg-cozy-lavender text-white scale-110 shadow-xs' : 'hover:scale-105'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Pastel Color Swatches */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-cozy-muted font-semibold">Card Color:</span>
              <div className="flex gap-1.5">
                {pastelColors.map(c => (
                  <button
                    type="button"
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 transition-transform ${
                      color === c.hex ? 'ring-2 ring-cozy-lavender scale-110' : 'hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <Input
            placeholder="Note Title (e.g. Grandma's Apple Crisp Recipe)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-base font-bold"
          />

          {/* Writing Area */}
          <div className="space-y-1">
            <textarea
              rows={9}
              placeholder="Write your thoughts, memories, recipes, or lists here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-3xl p-4 text-sm text-cozy-text dark:text-cozy-darkText placeholder-cozy-muted/60 outline-none focus:border-cozy-lavender focus:ring-4 focus:ring-cozy-lavender/10 resize-none font-sans leading-relaxed"
            />
          </div>

          <Input
            label="Tags (Comma separated)"
            placeholder="e.g. recipe, family, weekend, gratitude"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
          />

          {/* Footer Actions & Real Autosave Indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-purple-50 dark:border-purple-900/20">
            <div className="flex items-center gap-1.5 text-xs text-cozy-muted">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-purple-600">
                  <Cloud className="w-3.5 h-3.5 animate-pulse" /> Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Saved ☁️
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditorOpen(false)}>
                Done
              </Button>
              <Button type="submit" variant="primary">
                Save Note
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
