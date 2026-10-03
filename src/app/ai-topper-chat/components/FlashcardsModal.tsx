'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Shuffle, RotateCcw, Brain, Download, Copy, Check } from 'lucide-react';
import type { SelectedContext } from './AITopperChatScreen';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContext: SelectedContext;
  theme: 'light' | 'dark';
}

const SUBJECT_FLASHCARDS: Record<string, Flashcard[]> = {
  'DBMS': [
    { id: '1', front: 'What is 3NF (Third Normal Form)?', back: 'A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key. In simple terms: no transitive dependencies.' },
    { id: '2', front: 'What is BCNF (Boyce-Codd Normal Form)?', back: 'A relation is in BCNF if for every non-trivial functional dependency X → Y, X is a superkey. BCNF is stricter than 3NF - every BCNF relation is in 3NF, but not vice versa.' },
    { id: '3', front: 'Difference between 3NF and BCNF?', back: '3NF allows transitive dependencies if the dependent attribute is part of a candidate key. BCNF forbids ALL transitive dependencies. BCNF is stronger - eliminates more anomalies.' },
    { id: '4', front: 'What is a transitive dependency?', back: 'When A → B and B → C, then A → C is a transitive dependency. Example: StudentID → DeptID and DeptID → DeptName, so StudentID → DeptName transitively.' },
    { id: '5', front: 'What are Armstrong\'s Axioms?', back: 'Reflexivity: If Y ⊆ X, then X → Y. Augmentation: If X → Y, then XZ → YZ. Transitivity: If X → Y and Y → Z, then X → Z. Used to infer all FDs from a given set.' },
    { id: '6', front: 'What is a candidate key?', back: 'A minimal superkey - a set of attributes that uniquely identifies a tuple, with no proper subset having the same property.' },
    { id: '7', front: 'What is lossless join decomposition?', back: 'A decomposition R1, R2 of R is lossless if R1 ⋈ R2 = R. For binary decomposition: R1 ∩ R2 → R1 or R1 ∩ R2 → R2 must hold.' },
    { id: '8', front: 'What is dependency preserving decomposition?', back: 'A decomposition preserves dependencies if the closure of FDs in the decomposed relations equals the closure of FDs in the original relation. Allows checking constraints without joins.' },
    { id: '9', front: 'What is a functional dependency?', back: 'X → Y means for any two tuples with same X values, their Y values must also be same. X functionally determines Y.' },
    { id: '10', front: 'What is a superkey?', back: 'A set of attributes that uniquely identifies a tuple. A candidate key is a minimal superkey (no subset is also a superkey).' },
  ],
  'Data Structures': [
    { id: '1', front: 'What is the time complexity of binary search?', back: 'O(log n) - divides search space in half each iteration. Requires sorted array.' },
    { id: '2', front: 'Difference between stack and queue?', back: 'Stack: LIFO (Last In First Out) - push/pop at top. Queue: FIFO (First In First Out) - enqueue at rear, dequeue at front.' },
    { id: '3', front: 'What is a binary heap?', back: 'Complete binary tree satisfying heap property: parent ≥ children (max-heap) or parent ≤ children (min-heap). Array-based implementation: parent at i, children at 2i+1, 2i+2.' },
    { id: '4', front: 'Time complexity of heap operations?', back: 'Insert: O(log n). Extract min/max: O(log n). Peek: O(1). Build heap: O(n).' },
    { id: '5', front: 'What is a hash table?', back: 'Array + hash function mapping keys to indices. Handles collisions via chaining (linked lists) or open addressing (linear/quadratic probing, double hashing).' },
    { id: '6', front: 'Load factor in hash tables?', back: 'α = n/m where n = elements, m = buckets. When α exceeds threshold (usually 0.75), resize table (rehash).' },
    { id: '7', front: 'Difference between DFS and BFS?', back: 'DFS: Uses stack (recursion), goes deep first, good for path finding, cycle detection. BFS: Uses queue, explores level by level, finds shortest path in unweighted graphs.' },
    { id: '8', front: 'Time complexity of DFS/BFS?', back: 'O(V + E) for adjacency list. O(V²) for adjacency matrix. V = vertices, E = edges.' },
    { id: '9', front: 'What is topological sort?', back: 'Linear ordering of vertices in a DAG where for every directed edge u→v, u comes before v. Uses DFS with stack or Kahn\'s algorithm (BFS with indegree).' },
    { id: '10', front: 'What is Dijkstra\'s algorithm?', back: 'Finds shortest paths from source to all vertices in weighted graph with non-negative edges. Uses priority queue. Time: O((V+E) log V) with binary heap.' },
  ],
  'Operating Systems': [
    { id: '1', front: 'What is a process vs thread?', back: 'Process: Independent execution unit with own memory space. Thread: Lightweight unit within a process, shares memory but has own stack/PC. Threads in same process share heap/global data.' },
    { id: '2', front: 'What is context switching?', back: 'Saving state of current process/thread and loading state of next one. Involves CPU registers, PC, stack pointer, memory maps. Overhead: microseconds to milliseconds.' },
    { id: '3', front: 'What are scheduling algorithms?', back: 'FCFS: First Come First Served. SJF: Shortest Job First. Round Robin: Time slice. Priority: Priority-based. Multilevel Queue: Multiple queues with different priorities.' },
    { id: '4', front: 'What is a deadlock?', back: 'Four conditions (Coffman): Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. All four must hold simultaneously for deadlock.' },
    { id: '5', front: 'Deadlock prevention vs avoidance?', back: 'Prevention: Design system so at least one condition never holds (e.g., resource ordering). Avoidance: Dynamically check if state is safe (Banker\'s Algorithm) before granting resources.' },
    { id: '6', front: 'What is paging?', back: 'Memory management scheme: physical memory divided into frames, logical memory into pages (same size). Page table maps page # → frame #. Eliminates external fragmentation.' },
    { id: '7', front: 'What is virtual memory?', back: 'Allows processes to use more memory than physically available. Uses demand paging: pages loaded on demand. Page fault when page not in memory.' },
    { id: '8', front: 'Page replacement algorithms?', back: 'FIFO, LRU (Least Recently Used), Optimal (Belady\'s), Clock/Second Chance. LRU approximates optimal but needs hardware support.' },
    { id: '9', front: 'What is thrashing?', back: 'Process spends more time paging than executing. Caused by insufficient frames for working set. Solution: increase frames, reduce multiprogramming level.' },
    { id: '10', front: 'What is a semaphore?', back: 'Synchronization primitive: integer variable with atomic wait() (P) and signal() (V) operations. Binary semaphore = mutex. Counting semaphore for resource pools.' },
  ],
  'Web Technologies': [
    { id: '1', front: 'What is the Virtual DOM?', back: 'Lightweight copy of real DOM. React creates new VDOM on state change, diffs against previous, applies minimal updates to real DOM. Improves performance by batching DOM operations.' },
    { id: '2', front: 'What are React hooks?', back: 'useState: local state. useEffect: side effects. useContext: consume context. useReducer: complex state logic. useRef: mutable ref. useMemo/useCallback: memoization.' },
    { id: '3', front: 'useEffect cleanup function?', back: 'Return function from useEffect runs on unmount and before next effect. Used for subscriptions, timers, event listeners cleanup to prevent memory leaks.' },
    { id: '4', front: 'Difference between useMemo and useCallback?', back: 'useMemo: memoizes computed value. useCallback: memoizes function reference. useCallback(fn, deps) ≡ useMemo(() => fn, deps).' },
    { id: '5', front: 'What is REST?', back: 'Representational State Transfer. Stateless, cacheable, uniform interface (GET/POST/PUT/DELETE), resource-based URLs. HATEOAS: hypermedia as engine of application state.' },
    { id: '6', front: 'HTTP status code categories?', back: '1xx: Informational. 2xx: Success (200 OK, 201 Created). 3xx: Redirection (301, 302). 4xx: Client error (400, 401, 403, 404). 5xx: Server error (500, 502, 503).' },
    { id: '7', front: 'What is CORS?', back: 'Cross-Origin Resource Sharing. Browser security feature blocking cross-origin requests. Server must send Access-Control-Allow-Origin header to allow.' },
    { id: '8', front: 'Difference between localStorage and sessionStorage?', back: 'localStorage: persists until explicitly cleared, shared across tabs. sessionStorage: cleared when tab closes, isolated per tab.' },
    { id: '9', front: 'What is JWT?', back: 'JSON Web Token. Header.Payload.Signature. Stateless auth. Payload contains claims (sub, exp, iat). Verify signature to trust. Don\'t store sensitive data in payload (base64 encoded).' },
    { id: '10', front: 'What is CSRF?', back: 'Cross-Site Request Forgery. Attacker tricks user into submitting request to site where they\'re authenticated. Defense: CSRF tokens, SameSite cookies, double-submit cookies.' },
  ],
};

export default function FlashcardsModal({ isOpen, onClose, selectedContext, theme }: FlashcardsModalProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState<'copied' | 'downloaded' | null>(null);

  const subjectCards = SUBJECT_FLASHCARDS[selectedContext.subject] || [];

  useEffect(() => {
    if (isOpen) {
      setFlashcards(subjectCards);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen, selectedContext.subject, subjectCards]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    // In real app, this would call the AI API to generate flashcards
    setIsGenerating(false);
    setShowToast('copied');
    setTimeout(() => setShowToast(null), 2000);
  }, []);

  const handleFlip = () => setIsFlipped(prev => !prev);
  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };
  const handleShuffle = () => {
    setFlashcards(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
  };
  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCopy = async () => {
    const card = flashcards[currentIndex];
    const text = `Q: ${card.front}\nA: ${card.back}`;
    await navigator.clipboard.writeText(text);
    setShowToast('copied');
    setTimeout(() => setShowToast(null), 2000);
  };

  const handleDownload = () => {
    const card = flashcards[currentIndex];
    const text = `e-Mate AI Flashcard\nSubject: ${selectedContext.subject}\nUnit: ${selectedContext.unit}\n\nQ: ${card.front}\nA: ${card.back}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcard-${selectedContext.subject}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowToast('downloaded');
    setTimeout(() => setShowToast(null), 2000);
  };

  if (!isOpen || flashcards.length === 0) return null;

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: theme === 'dark' ? '#111111' : '#ffffff',
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Brain size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>Flashcards</p>
              <p className="text-xs text-zinc-500">{selectedContext.subject} · {selectedContext.unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/5 transition" title="Copy card" style={{ color: theme === 'dark' ? '#a1a1aa' : '#71717a' }}>
              <Copy size={16} />
            </button>
            <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-white/5 transition" title="Download card" style={{ color: theme === 'dark' ? '#a1a1aa' : '#71717a' }}>
              <Download size={16} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition" style={{ color: theme === 'dark' ? '#a1a1aa' : '#71717a' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Flashcard Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: theme === 'dark' ? '#a1a1aa' : '#71717a' }}>
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #a855f7)' }} />
            </div>
          </div>

          {/* Flashcard */}
          <div className="perspective-1000">
            <div
              className={`relative w-full aspect-[4/3] max-h-[500px] cursor-pointer transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
              onClick={handleFlip}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
              aria-label={isFlipped ? 'Show question' : 'Show answer'}
            >
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border flex flex-col items-center justify-center p-8 text-center" style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }}>
                <div className="flex items-center gap-2 mb-4" style={{ color: theme === 'dark' ? '#a1a1aa' : '#71717a' }}>
                  <RotateCcw size={16} />
                  <span className="text-xs font-medium">Click to flip</span>
                </div>
                <p className="text-lg font-medium leading-relaxed" style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
                  {currentCard.front}
                </p>
              </div>

              {/* Back */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border flex flex-col items-center justify-center p-8 text-center rotate-y-180" style={{
                background: theme === 'dark' ? 'rgba(139,92,246,0.05)' : 'rgba(139,92,246,0.03)',
                borderColor: theme === 'dark' ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)',
              }}>
                <div className="flex items-center gap-2 mb-4" style={{ color: '#a855f7' }}>
                  <Brain size={16} />
                  <span className="text-xs font-medium">Answer</span>
                </div>
                <p className="text-base leading-relaxed" style={{ color: theme === 'dark' ? '#e4e4e7' : '#27272a' }}>
                  {currentCard.back}
                </p>
              </div>
            </div>
          </div>

          {/* Hint */}
          <p className="text-center text-xs mt-4" style={{ color: theme === 'dark' ? '#71717a' : '#a1a1aa' }}>
            Click card or press Enter to flip • Use arrow keys or buttons to navigate
          </p>
        </div>

        {/* Navigation */}
        <div className="p-4 border-t shrink-0" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                color: theme === 'dark' ? '#ffffff' : '#000000',
              }}
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShuffle}
                className="p-2 rounded-lg border transition hover:bg-white/5"
                title="Shuffle cards"
                style={{
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  color: theme === 'dark' ? '#a1a1aa' : '#71717a',
                }}
              >
                <Shuffle size={16} />
              </button>
              <button
                onClick={handleRestart}
                className="p-2 rounded-lg border transition hover:bg-white/5"
                title="Restart"
                style={{
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  color: theme === 'dark' ? '#a1a1aa' : '#71717a',
                }}
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                color: theme === 'dark' ? '#ffffff' : '#000000',
              }}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Generate more button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-4 px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            style={{
              background: isGenerating
                ? (theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')
                : (theme === 'dark' ? '#8b5cf6' : '#7c3aed'),
              color: isGenerating ? (theme === 'dark' ? '#a1a1aa' : '#71717a') : '#ffffff',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating more cards...
              </>
            ) : (
              <>
                <Brain size={16} />
                Generate More with AI
              </>
            )}
          </button>
        </div>

        {/* Toast */}
        {(showToast === 'copied' || showToast === 'downloaded') && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 animate-slide-up">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg" style={{
              background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            }}>
              <Check size={18} className="text-emerald-500" />
              <span className="text-sm font-medium" style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
                {showToast === 'copied' ? 'Flashcard copied to clipboard!' : 'Flashcard downloaded!'}
              </span>
            </div>
          </div>
        )}

        <style jsx>{`
          .perspective-1000 {
            perspective: 1000px;
          }
          .transform-style-3d {
            transform-style: preserve-3d;
          }
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
          .backface-hidden {
            backface-visibility: hidden;
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateX(-50%) translateY(10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}