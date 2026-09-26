'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PanelLeft } from 'lucide-react';
import SidebarSkeleton from './SidebarSkeleton';

const Sidebar = dynamic(() => import('./Sidebar'), {
  ssr: false,
  loading: ({ }) => <SidebarSkeleton width={248} />,
});
const SettingsPage = dynamic(() => import('./SettingsPage'), { ssr: false });
const NotebookOverlay = dynamic(() => import('./NotebookOverlay'), { ssr: false });
const SignUpPopup = dynamic(() => import('./SignUpPopup'), { ssr: false });
const AddSourcesModal = dynamic(() => import('./AddSourcesModal'), { ssr: false });

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  // `mounted` guards against hydration mismatch — all localStorage-derived
  // state is applied in a single effect after the first paint, then the
  // component fades in so there is no visible layout shift.
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(248);
  const [isResizing, setIsResizing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobile, setIsMobile] = useState(false);
  const [activeModalView, setActiveModalView] = useState<'none' | 'settings' | 'notebook'>('none');
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [sourcesSubject, setSourcesSubject] = useState('');
  const [showSignUpPopup, setShowSignUpPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState('Login or sign up for free');
  const [popupSubtitle, setPopupSubtitle] = useState('Save and sync your searches');

  const pathname = usePathname();

  useEffect(() => {
    async function checkAuthForPopup() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          const { getGuestCredits } = await import('@/lib/credits');
          const remaining = getGuestCredits();
          if (remaining <= 0) {
            setPopupTitle('Sign up to use');
            setPopupSubtitle('You have used all 50 free credits. Create a free account to continue.');
          }
          setShowSignUpPopup(true);
        }
      } catch {
        setShowSignUpPopup(true);
      }
    }
    checkAuthForPopup();

    const handleOpenPopup = async () => {
      try {
        const { getGuestCredits } = await import('@/lib/credits');
        const remaining = getGuestCredits();
        if (remaining <= 0) {
          setPopupTitle('Sign up to use');
          setPopupSubtitle('You have used all 50 free credits. Create a free account to continue.');
        } else {
          setPopupTitle('Login or sign up for free');
          setPopupSubtitle('Save and sync your searches');
        }
      } catch {}
      setShowSignUpPopup(true);
    };
    window.addEventListener('nk-open-signup-popup', handleOpenPopup);
    return () => window.removeEventListener('nk-open-signup-popup', handleOpenPopup);
  }, []);

  // Single effect that reads all localStorage state synchronously so the
  // very first rendered frame already has the correct sidebar open/width
  // values — this eliminates the sidebar layout-shift flicker.
  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    // Sidebar open state — respect saved preference, default closed on mobile
    const savedSidebarOpen = localStorage.getItem('nk-sidebar-open');
    if (savedSidebarOpen !== null) {
      setSidebarOpen(mobile ? false : savedSidebarOpen === 'true');
    } else {
      setSidebarOpen(!mobile);
    }

    // Sidebar width
    const savedWidth = localStorage.getItem('nk-sidebar-width');
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));

    // Theme
    const savedTheme = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);

    // Mark as mounted — triggers the fade-in animation
    setMounted(true);

    const handleResize = () => {
      const mob = window.innerWidth < 768;
      setIsMobile(mob);
      if (mob) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync sidebar open state with children and other tabs (event-driven only
  // after mount — initial state is read above in the first effect).
  useEffect(() => {
    const handleSidebarEvent = () => {
      const saved = localStorage.getItem('nk-sidebar-open');
      if (saved !== null) setSidebarOpen(saved === 'true');
    };
    const handleOpenSourcesEvent = (e: any) => {
      const subj = e.detail?.subject || localStorage.getItem('nk-subject') || '';
      if (subj) {
        setSourcesSubject(subj);
        setIsSourcesModalOpen(true);
      }
    };
    window.addEventListener('nk-sidebar-change', handleSidebarEvent);
    window.addEventListener('nk-open-notebook', handleOpenSourcesEvent);
    window.addEventListener('nk-open-sources-modal', handleOpenSourcesEvent);
    return () => {
      window.removeEventListener('nk-sidebar-change', handleSidebarEvent);
      window.removeEventListener('nk-open-notebook', handleOpenSourcesEvent);
      window.removeEventListener('nk-open-sources-modal', handleOpenSourcesEvent);
    };
  }, []);

  const toggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem('nk-sidebar-open', String(open));
    window.dispatchEvent(new Event('nk-sidebar-change'));
  };

  useEffect(() => {
    // Theme updates from other tabs / settings page
    const updateTheme = () => {
      const t = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
      setTheme(t || 'light');
    };
    window.addEventListener('storage', updateTheme);
    window.addEventListener('nk-theme', updateTheme);
    return () => {
      window.removeEventListener('storage', updateTheme);
      window.removeEventListener('nk-theme', updateTheme);
    };
  }, []);

  // Persist last visited path so the landing page can redirect back
  useEffect(() => {
    if (pathname) {
      localStorage.setItem('nk-last-path', pathname);
    }
  }, [pathname]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(180, Math.min(e.clientX, 480));
      setSidebarWidth(newWidth);
      localStorage.setItem('nk-sidebar-width', String(newWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Escape key global listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalView('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-300"
      style={{
        background: theme === 'dark' ? '#000000' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        // Fade in the entire layout once localStorage state is applied
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.18s ease, background-color 0.3s ease',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────
           Desktop (md+): static inline panel — always in the flex row,
                          sized by sidebarWidth, never overlays content.
           Mobile (<md):  off-canvas fixed drawer that slides in from the left
                          via CSS transform so the GPU handles the animation.
      ──────────────────────────────────────────────────────────────────── */}
      <div
        className={[
          // Mobile: fixed off-canvas drawer
          'fixed inset-y-0 left-0 z-50 will-change-transform overflow-hidden',
          // Desktop: static inline panel that smoothly shrinks its width
          'md:relative md:inset-auto md:z-auto md:flex-shrink-0 md:h-full',
          // Transform for mobile slide-in
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{
          width: isMobile ? '288px' : sidebarOpen ? `${sidebarWidth}px` : '0px',
          // Use max-width transition for smooth collapse on desktop
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          opacity: sidebarOpen ? 1 : 0,
        }}
      >
        <Sidebar
          width={isMobile ? 288 : sidebarWidth}
          onToggle={() => toggleSidebar(false)}
          onOpenSettings={() => setActiveModalView('settings')}
          onOpenNotebook={(subjName) => {
            setActiveNotebookId(subjName);
            setActiveModalView('notebook');
          }}
        />
      </div>

      {/* Mobile-only backdrop — never shown on desktop */}
      {sidebarOpen && (
        <div
          onClick={() => toggleSidebar(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Desktop-only resize handle between sidebar and main */}
      {!isMobile && sidebarOpen && (
        <div
          onMouseDown={startResizing}
          className="w-1 shrink-0 h-full select-none cursor-col-resize z-40 transition-colors hover:bg-sky-500/50 active:bg-sky-500"
          style={{ background: isResizing ? '#0284c7' : 'transparent' }}
        />
      )}

      {/* ── Main content column ─────────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full relative"
        style={{ background: theme === 'dark' ? '#000000' : '#ffffff' }}
      >
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => toggleSidebar(true)}
            className="absolute top-4 left-4 z-40 p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-md hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <PanelLeft size={16} />
          </button>
        )}
        {children}
      </main>

      {/* ── Settings Modal Overlay ─────────────────────────────────── */}
      {activeModalView === 'settings' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModalView('none');
            }
          }}
        >
          <SettingsPage onBack={() => setActiveModalView('none')} />
        </div>
      )}

      {/* ── Full-Screen Notebook Overlay ─────────────────────────────────── */}
      {activeModalView === 'notebook' && activeNotebookId && (
        <NotebookOverlay
          subjectName={activeNotebookId}
          onClose={() => setActiveModalView('none')}
          theme={theme}
        />
      )}

      {/* ── Gemini-style Sources Modal Popup ────────────────────────────── */}
      <AddSourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        subject={sourcesSubject}
      />

      {/* ── Removable Sign Up Popup ─────────────────────────────────────── */}
      <SignUpPopup
        isOpen={showSignUpPopup}
        onClose={() => setShowSignUpPopup(false)}
        onOpenFullAuth={() => router.push('/sign-up-login-screen')}
        title={popupTitle}
        subtitle={popupSubtitle}
      />
    </div>
  );
}
