'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false });
const SettingsPage = dynamic(() => import('./SettingsPage'), { ssr: false });
const NotebookOverlay = dynamic(() => import('./NotebookOverlay'), { ssr: false });
const SignUpPopup = dynamic(() => import('./SignUpPopup'), { ssr: false });

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(248);
  const [isResizing, setIsResizing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobile, setIsMobile] = useState(false);
  const [activeModalView, setActiveModalView] = useState<'none' | 'settings' | 'notebook'>('none');
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
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

  useEffect(() => {
    // Detect mobile viewport size
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Close sidebar on mobile load
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync sidebar open state with children and other tabs
  useEffect(() => {
    const savedSidebar = localStorage.getItem('nk-sidebar-open');
    if (savedSidebar !== null) {
      setSidebarOpen(savedSidebar === 'true');
    }

    const handleSidebarEvent = () => {
      const saved = localStorage.getItem('nk-sidebar-open');
      if (saved !== null) setSidebarOpen(saved === 'true');
    };
    const handleOpenNotebookEvent = (e: any) => {
      if (e.detail?.subject) {
        setActiveNotebookId(e.detail.subject);
        setActiveModalView('notebook');
      }
    };
    window.addEventListener('nk-sidebar-change', handleSidebarEvent);
    window.addEventListener('nk-open-notebook', handleOpenNotebookEvent);
    return () => {
      window.removeEventListener('nk-sidebar-change', handleSidebarEvent);
      window.removeEventListener('nk-open-notebook', handleOpenNotebookEvent);
    };
  }, []);

  const toggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem('nk-sidebar-open', String(open));
    window.dispatchEvent(new Event('nk-sidebar-change'));
  };

  useEffect(() => {
    // Sync theme and sidebar width from localStorage after hydration
    const savedTheme = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);

    const savedWidth = localStorage.getItem('nk-sidebar-width');
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));

    const updateTheme = () => {
      const t = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
      setTheme(t || 'light');
    };
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
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
          'fixed inset-y-0 left-0 z-50 will-change-transform transition-all duration-300 ease-in-out overflow-hidden',
          // Desktop: static inline panel that smoothly shrinks its width
          'md:relative md:inset-auto md:z-auto md:flex-shrink-0 md:h-full',
          // Transform for mobile slide-in
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{
          width: isMobile ? '288px' : sidebarOpen ? `${sidebarWidth}px` : '0px',
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
        className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full"
        style={{ background: theme === 'dark' ? '#000000' : '#ffffff' }}
      >
        {children}
      </main>

      {/* ── Full-Screen Settings Overlay ─────────────────────────────────── */}
      {activeModalView === 'settings' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
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
