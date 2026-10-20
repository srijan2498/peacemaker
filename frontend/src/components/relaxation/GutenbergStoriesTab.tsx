import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GutenbergBookItem, GutenbergStoryChapter, ReadingProgressItem } from 'cozynest-shared';
import { freeSourcesService } from '../../services/freeSourcesService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Moon,
  Sun,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Library,
  Clock,
  Compass,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  BookmarkCheck,
  History
} from 'lucide-react';
import { toast } from 'sonner';

const PARAGRAPHS_PER_PAGE = 3;

export const GutenbergStoriesTab: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('bedtime');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch stories list with query parameters (Open Library & Gutenberg API)
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['gutenberg-stories', debouncedQuery, selectedCategory, currentPage],
    queryFn: () =>
      freeSourcesService.getGutenbergStories({
        q: debouncedQuery,
        category: selectedCategory,
        page: currentPage,
        limit: 16
      }),
    staleTime: 1000 * 60 * 15
  });

  const stories: GutenbergBookItem[] = data?.stories || [];
  const totalCount = data?.total || stories.length;
  const totalPages = data?.totalPages || 1;

  // Selected Book & Reading State
  const [selectedBookId, setSelectedBookId] = useState<string>('gutenberg_11');
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  // Fetch Full Book Details with ALL Chapters & Paragraphs
  const { data: fullBookData, isLoading: isBookLoading } = useQuery({
    queryKey: ['full-story-details', selectedBookId],
    queryFn: () => freeSourcesService.getFullStory(selectedBookId),
    staleTime: 1000 * 60 * 30
  });

  // Fetch Saved Reading Progress from API & LocalStorage
  const { data: serverProgress } = useQuery({
    queryKey: ['reading-progress'],
    queryFn: freeSourcesService.getReadingProgress,
    staleTime: 1000 * 60 * 5
  });

  const [localProgress, setLocalProgress] = useState<ReadingProgressItem | null>(() => {
    try {
      const stored = localStorage.getItem('cozynest_reading_progress');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const activeProgress: ReadingProgressItem | null = serverProgress || localProgress;

  // Reader Settings
  const [readerTheme, setReaderTheme] = useState<'night' | 'sepia' | 'day'>('night');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');

  // Text-to-Speech Narrator State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9); // Gentle bedtime pace
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Find book from fullBookData, or catalog list, or fallback
  const currentBook: GutenbergBookItem =
    fullBookData ||
    stories.find(s => s.id === selectedBookId) ||
    stories[0] || {
      id: 'gutenberg_11',
      title: "Alice's Adventures in Wonderland",
      author: 'Lewis Carroll',
      year: 1865,
      coverEmoji: '🐇',
      coverGradient: 'from-purple-600 via-indigo-600 to-pink-500',
      description: 'The whimsical classic following young Alice down the rabbit-hole.',
      genre: 'Classic Fantasy',
      readingTimeMinutes: 20,
      gutenbergUrl: 'https://www.gutenberg.org/ebooks/11',
      chapters: [
        {
          chapterNumber: 1,
          title: 'Down the Rabbit-Hole',
          paragraphs: [
            'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.',
            'Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.',
            'Suddenly a White Rabbit with pink eyes ran close by her, and down the rabbit-hole she went.'
          ]
        }
      ]
    };

  const chapters = currentBook.chapters || [];
  const currentChapter: GutenbergStoryChapter =
    chapters[activeChapterIndex] ||
    chapters[0] || {
      chapterNumber: 1,
      title: currentBook.title,
      paragraphs: [currentBook.description]
    };

  // Divide chapter paragraphs into distinct pages
  const chapterParagraphs = currentChapter.paragraphs || [];
  const totalChapterPages = Math.max(1, Math.ceil(chapterParagraphs.length / PARAGRAPHS_PER_PAGE));
  const currentPageParagraphs = chapterParagraphs.slice(
    activePageIndex * PARAGRAPHS_PER_PAGE,
    (activePageIndex + 1) * PARAGRAPHS_PER_PAGE
  );

  // Auto-save Reading Progress whenever book, chapter, or page changes
  const saveProgressMutation = useMutation({
    mutationFn: async (item: ReadingProgressItem) => {
      // Save to localStorage immediately
      localStorage.setItem('cozynest_reading_progress', JSON.stringify(item));
      setLocalProgress(item);
      // Sync to backend
      await freeSourcesService.saveReadingProgress(item);
    }
  });

  const recordCurrentProgress = (chIdx: number, pgIdx: number) => {
    const totalChapters = Math.max(1, chapters.length);
    const totalUnits = totalChapters * totalChapterPages;
    const currentUnit = chIdx * totalChapterPages + (pgIdx + 1);
    const percent = Math.min(100, Math.round((currentUnit / totalUnits) * 100));

    const progressItem: ReadingProgressItem = {
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      bookAuthor: currentBook.author,
      coverImageUrl: currentBook.coverImageUrl,
      coverGradient: currentBook.coverGradient,
      coverEmoji: currentBook.coverEmoji,
      chapterIndex: chIdx,
      chapterTitle: chapters[chIdx]?.title || currentChapter.title,
      pageNumber: pgIdx + 1,
      totalChapterPages: totalChapterPages,
      totalBookChapters: totalChapters,
      percentCompleted: percent,
      lastReadAt: new Date().toISOString()
    };

    saveProgressMutation.mutate(progressItem);
  };

  // Initialize SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Stop speech when chapter, page or book changes
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [selectedBookId, activeChapterIndex, activePageIndex]);

  const toggleNarrator = () => {
    if (!synthRef.current || !currentPageParagraphs.length) {
      toast.error('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      return;
    }

    synthRef.current.cancel();

    const textToRead = `${currentBook.title}. ${currentChapter.title}, Page ${activePageIndex + 1}. ${currentPageParagraphs.join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(
      v =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Female') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Victoria'))
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      toast.info('Page narration finished.');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
    toast.success(`Narrating Page ${activePageIndex + 1} of ${currentChapter.title}`);
  };

  const stopNarrator = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Page Turner Navigation
  const goToNextPage = () => {
    if (activePageIndex < totalChapterPages - 1) {
      const nextPg = activePageIndex + 1;
      setActivePageIndex(nextPg);
      recordCurrentProgress(activeChapterIndex, nextPg);
      scrollToReader();
    } else if (activeChapterIndex < chapters.length - 1) {
      // Turn to next chapter, page 1
      const nextCh = activeChapterIndex + 1;
      setActiveChapterIndex(nextCh);
      setActivePageIndex(0);
      recordCurrentProgress(nextCh, 0);
      scrollToReader();
      toast.info(`Turned to Chapter ${nextCh + 1}: ${chapters[nextCh]?.title || ''}`);
    } else {
      toast.success('Congratulations! You completed the entire book! 🌟');
      recordCurrentProgress(activeChapterIndex, activePageIndex);
    }
  };

  const goToPrevPage = () => {
    if (activePageIndex > 0) {
      const prevPg = activePageIndex - 1;
      setActivePageIndex(prevPg);
      recordCurrentProgress(activeChapterIndex, prevPg);
      scrollToReader();
    } else if (activeChapterIndex > 0) {
      // Go to previous chapter's last page
      const prevCh = activeChapterIndex - 1;
      const prevChParas = chapters[prevCh]?.paragraphs || [];
      const prevChPages = Math.max(1, Math.ceil(prevChParas.length / PARAGRAPHS_PER_PAGE));
      setActiveChapterIndex(prevCh);
      setActivePageIndex(prevChPages - 1);
      recordCurrentProgress(prevCh, prevChPages - 1);
      scrollToReader();
    }
  };

  const scrollToReader = () => {
    const readerElem = document.getElementById('story-reader-view');
    if (readerElem) {
      readerElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResumeReading = (prog: ReadingProgressItem) => {
    setSelectedBookId(prog.bookId);
    setActiveChapterIndex(prog.chapterIndex || 0);
    setActivePageIndex((prog.pageNumber || 1) - 1);
    scrollToReader();
    toast.success(`Resumed ${prog.bookTitle} at Chapter ${(prog.chapterIndex || 0) + 1}, Page ${prog.pageNumber || 1}! 📖`);
  };

  const handleBookmark = () => {
    recordCurrentProgress(activeChapterIndex, activePageIndex);
    toast.success(
      `Bookmarked Chapter ${activeChapterIndex + 1}, Page ${activePageIndex + 1} in "${currentBook.title}"! 🔖`
    );
  };

  // Font size mapping
  const fontSizeClass = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-loose',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose font-serif'
  }[fontSize];

  // Theme styles
  const themeClass = {
    night: 'bg-slate-950 text-slate-200 border-purple-950',
    sepia: 'bg-[#faf4e6] text-[#433422] border-amber-200 dark:bg-[#2b241c] dark:text-[#f2e6d5]',
    day: 'bg-white text-slate-800 border-purple-100 dark:bg-slate-900 dark:text-slate-100'
  }[readerTheme];

  const categories = [
    { id: 'bedtime', label: '🌙 Bedtime Stories (2,600+)' },
    { id: 'fairy_tales', label: '🏰 Fairy Tales (18,000+)' },
    { id: 'fables', label: '🦊 Fables & Moral Tales (12,000+)' },
    { id: 'children', label: '🎈 Children’s Classics' },
    { id: 'gutenberg_classics', label: '📖 Complete Multi-Chapter Classics' }
  ];

  return (
    <div className="space-y-6">
      {/* Resume Reading Progress Banner (Always Remembers User's Last Story & Page) */}
      {activeProgress && (
        <Card className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-200 dark:border-amber-900/40 shadow-soft-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl shadow-xs overflow-hidden shrink-0 border border-amber-300 dark:border-amber-800">
                {activeProgress.coverImageUrl ? (
                  <img
                    src={activeProgress.coverImageUrl}
                    alt={activeProgress.bookTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{activeProgress.coverEmoji || '📖'}</span>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="peach" size="sm" className="gap-1">
                    <Bookmark className="w-3 h-3 fill-current" /> Bookmark Saved
                  </Badge>
                  <span className="text-[11px] text-cozy-muted">
                    {activeProgress.percentCompleted}% Completed
                  </span>
                </div>
                <h4 className="text-sm font-black text-cozy-text dark:text-cozy-darkText">
                  {activeProgress.bookTitle}
                </h4>
                <p className="text-xs text-cozy-muted">
                  Paused at <strong className="text-cozy-lavender">Chapter {(activeProgress.chapterIndex || 0) + 1}</strong>, <strong className="text-amber-600 dark:text-amber-400">Page {activeProgress.pageNumber || 1}</strong> of {activeProgress.totalChapterPages || 1}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleResumeReading(activeProgress)}
              className="gap-2 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-soft-xs whitespace-nowrap self-end sm:self-center"
            >
              <History className="w-4 h-4" />
              Resume Reading
            </Button>
          </div>
        </Card>
      )}

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-4xl bg-gradient-to-r from-amber-950 via-purple-950 to-indigo-950 text-white relative overflow-hidden shadow-soft-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="peach" size="sm">
                Open Library & Project Gutenberg Complete Archive
              </Badge>
              <span className="text-xs text-amber-200/80 font-medium">
                {totalCount.toLocaleString()}+ Free Public Domain Stories Available
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-amber-300" />
              Bedtime Stories & Classic Literature Vault
            </h3>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              Complete, unabridged classic stories and literature with all chapters and pages.
              Read with adjustable typography and night themes, or listen via in-browser audiobook narration.
            </p>
          </div>

          {/* Quick Audiobook Control Pod */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={toggleNarrator}
              className="gap-2 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-bold"
            >
              {isSpeaking && !isPaused ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  Pause Narration
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  {isPaused ? 'Resume' : 'Listen with Audio'}
                </>
              )}
            </Button>

            {isSpeaking && (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopNarrator}
                className="text-white/80 hover:text-white"
              >
                <VolumeX className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar & Category Navigation */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cozy-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search 1,000+ bedtime stories, fairy tales, authors (e.g. Peter Pan, Moon, Bear, Rabbit)..."
              className="pl-10 text-xs rounded-2xl bg-white dark:bg-cozy-darkCard shadow-soft-xs"
            />
            {isFetching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-cozy-muted font-bold animate-pulse">
                Searching library...
              </div>
            )}
          </div>

          <div className="text-xs font-bold text-cozy-muted px-2 flex items-center gap-1.5 shrink-0">
            <Library className="w-3.5 h-3.5 text-amber-500" />
            <span>{totalCount.toLocaleString()} Stories Found</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-soft-sm'
                  : 'text-cozy-muted hover:text-cozy-text'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-purple-200 dark:border-purple-900/40 space-y-2">
            <BookOpen className="w-8 h-8 text-cozy-muted mx-auto" />
            <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
              No stories found matching "{debouncedQuery}"
            </h4>
            <p className="text-xs text-cozy-muted">
              Try searching for "rabbit", "bedtime", "bear", or switch categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stories.map(book => {
              const isSelected = book.id === currentBook?.id;

              return (
                <div
                  key={book.id}
                  onClick={() => {
                    setSelectedBookId(book.id);
                    setActiveChapterIndex(0);
                    setActivePageIndex(0);
                    recordCurrentProgress(0, 0);
                    scrollToReader();
                  }}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-soft-md ring-2 ring-amber-500/30'
                      : 'border-purple-100 dark:border-purple-900/30 bg-white dark:bg-cozy-darkCard hover:border-amber-300 hover:shadow-soft-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {book.coverImageUrl ? (
                      <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 shadow-sm border border-purple-100 dark:border-purple-900/30">
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          onError={e => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-14 h-20 rounded-xl bg-gradient-to-br ${book.coverGradient} flex items-center justify-center text-2xl shadow-sm shrink-0`}
                      >
                        {book.coverEmoji || '📖'}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText line-clamp-2 leading-snug">
                        {book.title}
                      </h4>
                      <p className="text-xs text-cozy-muted truncate">{book.author}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-cozy-muted">
                        <span>{book.year > 0 ? book.year : 'Classic'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="w-2.5 h-2.5" />
                          ~{book.readingTimeMinutes}m
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-cozy-muted line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>

                  <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 pt-2 border-t border-purple-50 dark:border-purple-900/20">
                    <span className="text-[10px] text-cozy-muted font-normal truncate max-w-[120px]">
                      {book.chapters?.length || 1} Chapter{(book.chapters?.length || 1) > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {isSelected ? 'Reading Now' : 'Read Story'}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/30">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="text-xs gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous 16 Stories
            </Button>

            <span className="text-xs font-bold text-cozy-muted">
              Page {currentPage} of {totalPages} ({totalCount.toLocaleString()} Total Stories)
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages || isFetching}
              onClick={() => setCurrentPage(p => p + 1)}
              className="text-xs gap-1"
            >
              Next Stories <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Active Story Reader & Page-by-Page Reading Container */}
      {currentBook && currentChapter && (
        <Card
          id="story-reader-view"
          className={`p-6 sm:p-10 rounded-3xl border shadow-soft-xl transition-colors ${themeClass}`}
        >
          {/* Reader Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10 dark:border-purple-900/30">
            {/* Chapter Navigator Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                disabled={activeChapterIndex === 0 && activePageIndex === 0}
                onClick={goToPrevPage}
                className="p-1.5"
                title="Previous Page / Chapter"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <select
                value={activeChapterIndex}
                onChange={e => {
                  const newCh = Number(e.target.value);
                  setActiveChapterIndex(newCh);
                  setActivePageIndex(0);
                  recordCurrentProgress(newCh, 0);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 dark:bg-purple-950/40 border border-white/20 text-inherit focus:outline-none max-w-[220px] sm:max-w-[280px] truncate"
              >
                {chapters.map((ch, idx) => (
                  <option key={ch.chapterNumber || idx} value={idx} className="bg-slate-900 text-white">
                    Ch {idx + 1}: {ch.title}
                  </option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                disabled={activeChapterIndex >= chapters.length - 1 && activePageIndex >= totalChapterPages - 1}
                onClick={goToNextPage}
                className="p-1.5"
                title="Next Page / Chapter"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Page Tracker Pill */}
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-xs font-bold text-amber-500">
                Page {activePageIndex + 1} of {totalChapterPages}
              </span>
            </div>

            {/* Customizer (TTS Rate + Font + Theme + Bookmark) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bookmark Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBookmark}
                className="gap-1.5 text-xs rounded-xl"
              >
                <Bookmark className="w-3.5 h-3.5 fill-current text-amber-500" />
                Bookmark Page
              </Button>

              {/* Narration Pace */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 text-xs font-semibold">
                <Volume2 className="w-3.5 h-3.5" />
                <button
                  onClick={() => setSpeechRate(r => (r === 0.8 ? 1.0 : r === 1.0 ? 1.2 : 0.8))}
                  className="hover:underline"
                >
                  {speechRate}x Speed
                </button>
              </div>

              {/* Font Size Pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/10 text-xs font-bold">
                {(['sm', 'base', 'lg', 'xl'] as const).map(sz => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`px-2 py-0.5 rounded-lg uppercase ${
                      fontSize === sz ? 'bg-amber-500 text-white' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Theme Pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/10 text-xs font-bold">
                <button
                  onClick={() => setReaderTheme('night')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                    readerTheme === 'night' ? 'bg-purple-600 text-white' : 'opacity-70'
                  }`}
                >
                  <Moon className="w-3 h-3" /> Night
                </button>
                <button
                  onClick={() => setReaderTheme('sepia')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                    readerTheme === 'sepia' ? 'bg-amber-600 text-white' : 'opacity-70'
                  }`}
                >
                  <Eye className="w-3 h-3" /> Sepia
                </button>
                <button
                  onClick={() => setReaderTheme('day')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                    readerTheme === 'day' ? 'bg-sky-600 text-white' : 'opacity-70'
                  }`}
                >
                  <Sun className="w-3 h-3" /> Day
                </button>
              </div>
            </div>
          </div>

          {/* Book Content (Full Page by Page) */}
          <article className="max-w-3xl mx-auto py-8 space-y-6">
            <header className="text-center space-y-2 border-b border-current/10 pb-6">
              <span className="text-xs font-extrabold uppercase tracking-widest opacity-60">
                {currentBook.title} • {currentBook.author} ({currentBook.year > 0 ? currentBook.year : 'Classic'})
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentChapter.title}
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs opacity-75">
                <span>Chapter {activeChapterIndex + 1} of {chapters.length}</span>
                <span>•</span>
                <span className="font-bold text-amber-500">
                  Page {activePageIndex + 1} of {totalChapterPages}
                </span>
                <span>•</span>
                <span>Source: {currentBook.source || 'Project Gutenberg Complete Text'}</span>
              </div>
            </header>

            {/* Paragraphs on Current Page */}
            <div className={`space-y-5 ${fontSizeClass}`}>
              {currentPageParagraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-justify font-serif tracking-normal leading-relaxed">
                  {pIdx === 0 && activePageIndex === 0 && para.length > 0 ? (
                    <span className="text-4xl font-bold float-left mr-2.5 leading-none text-amber-500">
                      {para.charAt(0)}
                    </span>
                  ) : null}
                  {pIdx === 0 && activePageIndex === 0 && para.length > 0 ? para.slice(1) : para}
                </p>
              ))}
            </div>
          </article>

          {/* Bottom Dual Page & Chapter Turner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-current/10 max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeChapterIndex === 0 && activePageIndex === 0}
              onClick={goToPrevPage}
              className="gap-1 text-inherit w-full sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Page
            </Button>

            {/* Page & Progress Status */}
            <div className="text-center space-y-0.5">
              <div className="text-xs font-black tracking-wider text-amber-500">
                Page {activePageIndex + 1} of {totalChapterPages} in Chapter {activeChapterIndex + 1}
              </div>
              <div className="text-[11px] opacity-60">
                Total Story Progress: ~
                {Math.round(
                  (((activeChapterIndex * totalChapterPages + (activePageIndex + 1)) /
                    (Math.max(1, chapters.length) * totalChapterPages)) *
                    100)
                )}
                % Complete
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              className="gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold w-full sm:w-auto"
            >
              {activePageIndex < totalChapterPages - 1 ? (
                <>Next Page <ChevronRight className="w-4 h-4" /></>
              ) : activeChapterIndex < chapters.length - 1 ? (
                <>Next Chapter ({activeChapterIndex + 2}) <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Finish Story 🌟</>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
