'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PanelLeft } from 'lucide-react';

const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false });
const SettingsPage = dynamic(() => import('./SettingsPage'), { ssr: false });
const NotebookOverlay = dynamic(() => import('./NotebookOverlay'), { ssr: false });
const SignUpPopup = dynamic(() => import('./SignUpPopup'), { ssr: false });
const AddSourcesModal = dynamic(() => import('./AddSourcesModal'), { ssr: false });

interface AppLayoutProps {
  children: React.ReactNode;
}

const SIGNUP_POPUP_SUPPRESSED_KEY = 'nk-signup-popup-suppressed';

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
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

  const shouldAutoShowPopup = () => {
    if (typeof window === 'undefined') return false;
    if (window.localStorage.getItem(SIGNUP_POPUP_SUPPRESSED_KEY) === 'true') return false;

    const consent = window.localStorage.getItem('nk-cookie-consent-v1');
    if (!consent) return false;

    return true;
  };

  useEffect(() => {
    const syncPopupText = async () => {
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
    };

    async function checkAuthForPopup() {
      if (!shouldAutoShowPopup()) return;

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          await syncPopupText();
          setShowSignUpPopup(true);
        }
      } catch {
        await syncPopupText();
        setShowSignUpPopup(true);
      }
    }

    checkAuthForPopup();

    const handleOpenPopup = async () => {
      window.localStorage.removeItem(SIGNUP_POPUP_SUPPRESSED_KEY);
      await syncPopupText();
      setShowSignUpPopup(true);
    };

    const handleCookieConsentChanged = () => {
      if (shouldAutoShowPopup()) {
        checkAuthForPopup();
      }
    };

    window.addEventListener('nk-open-signup-popup', handleOpenPopup);
    window.addEventListener('nk-cookie-consent-changed', handleCookieConsentChanged);

    return () => {
      window.removeEventListener('nk-open-signup-popup', handleOpenPopup);
      window.removeEventListener('nk-cookie-consent-changed', handleCookieConsentChanged);
    };
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
      className="flex min-h-screen w-full justify-center overflow-x-hidden bg-[#edf1f5] transition-colors duration-300 md:bg-transparent"
      style={{
        background: theme === 'dark' ? '#000000' : '#edf1f5',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="relative flex min-h-screen w-full max-w-[430px] overflow-hidden bg-[#f5f6f8] shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.08)] md:max-w-none md:shadow-none">
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
            // Desktop: fixed sidebar — always anchored, never scrolls with content
            'md:fixed md:top-0 md:bottom-0 md:left-0 md:z-30',
            // Transform for mobile slide-in; on desktop only hide via width
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          ].join(' ')}
          style={{
            width: isMobile ? '288px' : sidebarOpen ? `${sidebarWidth}px` : '0px',
            opacity: isMobile ? 1 : sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
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

        {/* Desktop-only resize handle — fixed to match sidebar position */}
        {!isMobile && sidebarOpen && (
          <div
            onMouseDown={startResizing}
            className="fixed top-0 bottom-0 z-40 w-1 select-none cursor-col-resize transition-colors hover:bg-sky-500/50 active:bg-sky-500"
            style={{
              left: `${sidebarWidth}px`,
              background: isResizing ? '#0284c7' : 'transparent',
            }}
          />
        )}

        {/* ── Main content column ─────────────────────────────────────────── */}
        <main
          className="relative flex w-full h-screen h-[100dvh] max-h-screen min-w-0 flex-1 flex-col overflow-y-auto bg-[#f5f6f8] md:bg-transparent transition-[padding] duration-300 ease-in-out"
          style={{
            background: theme === 'dark' ? '#000000' : '#f5f6f8',
            // Push content right on desktop so it never sits under the fixed sidebar
            paddingLeft: !isMobile && sidebarOpen ? `${sidebarWidth + 1}px` : undefined,
          }}
        >
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => toggleSidebar(true)}
              className="absolute left-4 top-4 z-40 flex items-center justify-center rounded-full border border-zinc-200/80 bg-white/80 p-2 text-zinc-700 shadow-md backdrop-blur-md transition hover:bg-white active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm duration-150 animate-in fade-in sm:p-6"
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
          onClose={() => {
            setShowSignUpPopup(false);
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(SIGNUP_POPUP_SUPPRESSED_KEY, 'true');
            }
          }}
          onOpenFullAuth={() => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(SIGNUP_POPUP_SUPPRESSED_KEY);
            }
            router.push('/sign-up-login-screen');
          }}
          title={popupTitle}
          subtitle={popupSubtitle}
        />
      </div>
    </div>
  );
}
