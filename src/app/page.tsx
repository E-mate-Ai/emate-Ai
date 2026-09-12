'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  ChevronDown,
  Moon,
  Sun,
  ArrowUpRight,
  Check,
  Brain,
  MousePointer2,
  Link2,
  ShieldCheck,
  Sparkles,
  Zap,
  Building2,
  Menu,
  X,
  Mail,
  Phone,
} from 'lucide-react';
import { applyTheme } from '@/lib/theme';
import { useGeoCurrency } from '@/hooks/useGeoCurrency';
import RazorpayCheckout from '@/components/RazorpayCheckout';

const logos = [
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'Computer Science',
  'Medicine',
  'Law',
  'Engineering',
];
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');

/** Plans without prices — prices are injected dynamically by useGeoCurrency */
const PLANS = [
  {
    name: 'Free',
    tier: 'free' as const,
    eyebrow: 'For students getting started',
    action: 'Start Learning for Free',
    href: `${APP_URL}/sign-up-login-screen`,
    icon: 'sparkles',
    tagline: 'Explore e-Mate and build your first flashcards.',
    note: 'Free forever · No credit card',
    features: ['5 daily queries', 'Basic notebook uploads', 'OpenRouter BYOK support'],
  },
  {
    name: 'Growth',
    tier: 'growth' as const,
    eyebrow: 'For power learners',
    action: 'Start Learning for Free',
    href: `${APP_URL}/sign-up-login-screen`,
    featured: true,
    icon: 'zap',
    tagline: 'Your full AI study copilot with unlimited momentum.',
    note: 'Bill monthly · Cancel anytime',
    features: [
      '25 active agents',
      '150 simulation runs',
      'Full RAG & active recall loops',
      'Nitro routing',
    ],
  },
  {
    name: 'Scale',
    tier: 'scale' as const,
    eyebrow: 'For teams & enterprises',
    action: 'Contact sales',
    href: `${APP_URL}/sign-up-login-screen`,
    icon: 'building',
    tagline: 'Dedicated infrastructure for org-wide studying.',
    note: 'Annual billing · SSO & support',
    features: [
      'Unlimited active agents',
      'Unlimited simulations',
      'Dedicated workspaces',
      'Enterprise security',
    ],
  },
];

const styles = `
.site{--ink:#303030;--muted:#929292;--line:#e5e7eb;--accent:#1f51ff;--accent-bright:#1f51ff;background:#fff;color:var(--ink);font-family:Arial,Helvetica,sans-serif;min-height:100vh;overflow-x:hidden;padding-bottom:env(safe-area-inset-bottom)}.site.dark{--ink:#f4f4f4;--muted:#a3a3a3;--line:#383838;--accent-bright:#8aa2ff;background:#171717;color:var(--ink)}.site *{box-sizing:border-box}.nav-shell{height:64px;margin:12px auto 0;max-width:calc(100% - 56px);border:1px solid var(--line);border-radius:999px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:12px;z-index:40;background:#fff;box-shadow:0 2px 4px #0000000b;animation:navIn .5s cubic-bezier(.16,.84,.32,1) both}.site.dark .nav-shell{background:#171717}.brand{display:flex;align-items:center;gap:10px;color:inherit;text-decoration:none;font-size:20px;letter-spacing:-.5px;min-height:44px}.brand-mark{height:26px;width:26px;display:flex;align-items:center;justify-content:center;color:var(--accent-bright);flex-shrink:0}.brand-mark img{width:26px;height:26px;display:block;object-fit:contain}.nav-shell nav{display:flex;gap:30px;margin:0 auto}.nav-shell nav a{color:var(--muted);font-size:15px;text-decoration:none;min-height:44px;display:inline-flex;align-items:center}.nav-actions{display:flex;align-items:center;gap:16px;justify-content:flex-end}.icon-button{border:0;background:none;color:var(--muted);cursor:pointer;min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center}.button{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:999px;padding:10px 18px;font-size:14px;line-height:1;min-height:44px;cursor:pointer;transition:transform .2s,background .2s}.button:hover{transform:translateY(-2px)}.dark-button{background:#222;color:#fff}.site.dark .dark-button{background:#fff;color:#222}.outline-button{border:1px solid var(--line);color:inherit;background:transparent}.accent-button{background:var(--accent);color:#fff;border:0}.section-frame{border-bottom:1px solid var(--line)}.hero{position:relative;overflow:hidden;isolation:isolate;text-align:center;min-height:520px;padding:120px 24px 72px}.kicker{color:var(--accent-bright);font-size:16px;margin:0 0 16px}.kicker.shine{color:transparent;background-image:linear-gradient(110deg,var(--accent-bright) 35%,#9fb4ff 50%,var(--accent-bright) 75%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;animation:kickerShine 2s linear infinite,fadeUp .7s cubic-bezier(.16,.84,.32,1) both}
@keyframes kickerShine{0%{background-position:200% 0}100%{background-position:-200% 0}}.hero h1{font-size:52px;line-height:1.1;letter-spacing:-2px;font-weight:500;margin:0;animation:fadeUp .7s cubic-bezier(.16,.84,.32,1) .08s both}.hero h1 em{font-style:normal;color:var(--accent-bright)}.hero-copy{font-size:18px;line-height:1.6;color:var(--muted);margin:24px 0;animation:fadeUp .7s cubic-bezier(.16,.84,.32,1) .16s both}.button-row{display:flex;gap:12px;justify-content:center;animation:fadeUp .7s cubic-bezier(.16,.84,.32,1) .24s both}.hero-orbs{position:absolute;inset:0;z-index:-1;pointer-events:none}.hero-orbs i{position:absolute;border-radius:50%;filter:blur(64px);opacity:.5;will-change:transform}.hero-orbs i:nth-child(1){width:340px;height:340px;left:-90px;top:-70px;background:radial-gradient(circle,var(--accent),transparent 65%);animation:orbit1 24s ease-in-out infinite alternate}.hero-orbs i:nth-child(2){width:300px;height:300px;right:-80px;top:14%;background:radial-gradient(circle,#3782f5,transparent 65%);animation:orbit2 28s ease-in-out infinite alternate}.hero-orbs i:nth-child(3){width:200px;height:200px;left:14%;bottom:-60px;background:radial-gradient(circle,#9fb4ff,transparent 65%);animation:orbit3 22s ease-in-out infinite alternate}.site.dark .hero-orbs i{opacity:.38}@keyframes orbit1{from{transform:translate(0,0) scale(1)}to{transform:translate(60px,40px) scale(1.08)}}@keyframes orbit2{from{transform:translate(0,0) scale(1)}to{transform:translate(-50px,30px) scale(.94)}}@keyframes orbit3{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,-46px) scale(1.06)}}.feature-intro{text-align:center;padding:80px 24px 80px}.feature-intro .kicker{margin-bottom:16px}.feature-intro h2,.how h2{font-size:38px;font-weight:500;letter-spacing:-1.5px;margin:0 0 18px}.feature-intro>p:last-child,.how>p:last-of-type{font-size:17px;line-height:1.6;color:var(--muted);margin:0}.feature-grid{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--line)}.feature-grid article{min-height:420px;padding:48px 40px;border-right:1px solid var(--line);overflow:hidden}.feature-grid article:last-child{border-right:0}.feature-title{display:flex;gap:12px;align-items:center}.feature-title h3{font-size:22px;font-weight:500;margin:0}.feature-grid article>p{font-size:16px;color:var(--muted);line-height:1.6;max-width:640px}.model-window,.chat-window{margin:36px 0 0;border:1px solid var(--line);border-radius:18px;width:100%;height:auto;box-shadow:0 10px 24px #0000000c;position:relative;background:#fff}.site.dark .model-window,.site.dark .chat-window{background:#202020}.window-dots{display:flex;gap:10px;padding:14px 18px}.window-dots b{width:10px;height:10px;border-radius:50%;background:#ff2f3d}.window-dots b:nth-child(2){background:#ffb800}.window-dots b:nth-child(3){background:#06c75b}.model-list{border-top:1px solid var(--line);display:flex;flex-direction:column;gap:12px;padding:16px 18px;font-size:14px}.model-list span{display:flex;align-items:center;gap:8px}.model-list small,.model-list strong{margin-left:auto;color:var(--muted);font-weight:400}.chat-window{background:radial-gradient(110% 110% at 50% 0%,#e4ebff 0%,transparent 68%);display:flex;align-items:flex-end;justify-content:flex-end;padding:20px;min-height:160px}.site.dark .chat-window{background:radial-gradient(110% 110% at 50% 0%,#1c2a5e 0%,transparent 68%)}.chat-bubble{background:#3782f5;color:#fff;border-radius:18px;padding:16px;font-size:15px;line-height:1.5}.trusted{text-align:center}.mono-label{font:600 11px/1.2 monospace;color:var(--muted);letter-spacing:1.5px;text-align:center;margin:0;padding:40px 16px 28px}.logo-grid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line)}.logo{height:120px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:500;color:#333}.site.dark .logo{color:#ddd}.logo:nth-child(4n){border-right:0}.logo-0:before{content:'⚡';background:#444;color:#fff;border-radius:6px;padding:3px;margin-right:8px}.logo-1{font-weight:800;font-size:26px}.logo-2{font-weight:700}.logo-4{font-size:16px}.logo-5{font-weight:700}.how{text-align:center;padding:80px 24px 56px}.how .kicker{margin-bottom:16px}.how h2{margin-bottom:18px}.integration-card{max-width:640px;height:96px;border:1px solid var(--line);border-radius:18px;margin:32px auto 0;display:flex;align-items:center;justify-content:space-between;padding:24px 28px;font-size:16px;text-align:left}.faq{text-align:center;padding:56px 0 0}.faq .kicker{font-size:14px;margin-bottom:12px}.faq h2{font-size:28px;font-weight:500;margin:0 0 18px}.faq>p{color:var(--muted);line-height:1.6;font-size:13px}.faq .button{font-size:12px;padding:10px 16px}.faq-list{margin-top:24px;text-align:left}.faq-row{position:relative;width:100%;display:flex;justify-content:space-between;align-items:center;border:0;border-top:1px solid var(--line);background:transparent;color:inherit;padding:16px 18px;font-size:14px;text-align:left;cursor:pointer;min-height:44px}.faq-row:last-child{border-bottom:1px solid var(--line)}.faq-row .rotate{transform:rotate(180deg)}.answer{position:absolute;left:18px;top:44px;color:var(--muted);font-size:13px}.faq-row:has(.answer){padding-bottom:44px}.final-cta{text-align:center;min-height:360px;padding:72px 24px 56px;overflow:hidden}.final-cta h2{font-size:34px;line-height:1.15;letter-spacing:-1px;font-weight:500;margin:48px 0 20px}.final-cta h2 em{font-style:normal;color:var(--accent-bright)}.orbit{height:22px;position:relative;max-width:300px;margin:auto;border-radius:50%;box-shadow:0 -24px 0 -23px var(--line),0 -56px 0 -55px var(--line),0 -88px 0 -87px var(--line)}.orbit span{position:absolute;background:#fff;border:1px solid var(--line);padding:6px;border-radius:6px}.site.dark .orbit span{background:#171717}.orbit span:nth-child(1){left:24%;top:5px}.orbit span:nth-child(2){left:48%;top:-14px}.orbit span:nth-child(3){right:16%;top:6px}footer{display:flex;justify-content:space-between;padding:22px 7%;color:var(--muted);font-size:13px}@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@keyframes navIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}html.js [data-reveal]{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.16,.84,.32,1),transform .7s cubic-bezier(.16,.84,.32,1)}html.js [data-reveal].in{opacity:1;transform:none}.feature-grid article[data-reveal]:nth-child(2){transition-delay:.1s}.button:active{transform:translateY(0) scale(.97)}.integration-card svg{transition:transform .25s}.integration-card:hover svg{transform:translate(2px,-2px)}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}html.js [data-reveal]{opacity:1!important;transform:none!important}.hero-orbs i{animation:none!important}}@media(max-width:800px){.hero-orbs i:nth-child(1){width:230px;height:230px;left:-70px;top:-40px}.hero-orbs i:nth-child(2){width:210px;height:210px;right:-60px;top:20%}.hero-orbs i:nth-child(3){width:150px;height:150px;left:6%;bottom:10%}.nav-shell{max-width:calc(100% - 24px);height:56px;border-radius:18px}.brand{font-size:18px;gap:8px}.brand-mark{transform:scale(.8);transform-origin:left center;width:22px}.nav-shell nav{display:none}.nav-actions{gap:10px}.nav-actions .button{padding:9px 14px;font-size:13px}.hero{padding-top:88px;min-height:440px}.hero h1{font-size:34px;letter-spacing:-1px}.hero-copy{font-size:16px}.kicker{font-size:14px}.feature-intro h2,.how h2{font-size:28px}.feature-intro>p:last-child,.how>p:last-of-type{font-size:16px}.feature-grid{grid-template-columns:1fr}.feature-grid article{border-right:0;border-bottom:1px solid var(--line);padding:32px 24px;min-height:auto}.feature-title h3{font-size:20px}.feature-grid article>p{font-size:15px}.logo-grid{grid-template-columns:repeat(2,1fr)}.logo{height:80px;font-size:16px}.logo:nth-child(4n){border-right:1px solid var(--line)}.logo:nth-child(2n){border-right:0}.final-cta h2{font-size:26px}footer{display:block;line-height:2}.desktop{display:none}}
`;

export default function LandingPage() {
  const [dark, setDark] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currency, toggleCurrency, formatTierPrice } = useGeoCurrency();

  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem('nk-theme') as 'light' | 'dark' | null;
      setDark((savedTheme || 'light') === 'dark');
    };

    updateTheme();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'nk-theme') updateTheme();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    const t = next ? 'dark' : 'light';
    try {
      localStorage.setItem('nk-theme', t);
    } catch (_) {}
    applyTheme(t);
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    document.documentElement.classList.add('js');
    if (
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const faqs = [
    {
      q: 'What exactly does e-Mate AI do?',
      a: 'e-Mate AI is an AI-powered study workspace that generates flashcards, quizzes, and automated RAG workflows from your uploaded notes and textbooks.',
    },
    {
      q: 'How does the BYOK OpenRouter integration work?',
      a: 'You can seamlessly connect your OpenRouter API key via 1-click authentication to stream high-speed LLM models at zero extra platform markup.',
    },
  ];

  return (
    <main className={dark ? 'site dark' : 'site'}>
      <style>{styles}</style>
      <header className="nav-shell">
        <a className="brand" href={`${APP_URL}/sign-up-login-screen`} aria-label="e-Mate AI home">
          <span className="brand-mark" aria-hidden="true">
            <Image src="/android-chrome-512x512.png" alt="e-Mate AI Logo" width={32} height={32} className="object-contain bg-transparent" loading="lazy" />
          </span>
          <span>e-Mate AI</span>
        </a>
        <nav>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <a href="#careers">Careers</a>
          <a href="#blog">Blog</a>
        </nav>
        <div className="nav-actions">
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="icon-button md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <a className="button dark-button hidden sm:inline-flex" href={`${APP_URL}/sign-up-login-screen`}>
            Start Learning for Free
          </a>
        </div>
      </header>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 p-6 flex flex-col justify-between animate-in fade-in duration-200 md:hidden">
          <div className="flex items-center justify-between">
            <a className="brand" href={`${APP_URL}/sign-up-login-screen`} aria-label="e-Mate AI home">
              <span className="brand-mark" aria-hidden="true">
                <Image src="/android-chrome-512x512.png" alt="e-Mate AI Logo" width={32} height={32} className="object-contain bg-transparent" loading="lazy" />
              </span>
              <span className="font-semibold text-lg">e-Mate AI</span>
            </a>
            <button
              className="icon-button p-2"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close mobile menu"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col gap-6 text-center text-lg font-medium my-auto">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-500 py-2">About</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-500 py-2">Pricing</a>
            <a href="#careers" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-500 py-2">Careers</a>
            <a href="#blog" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-500 py-2">Contact &amp; Support</a>
          </div>
          <div className="flex flex-col gap-3">
            <a
              className="button dark-button text-center w-full py-3"
              href={`${APP_URL}/sign-up-login-screen`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Learning for Free
            </a>
          </div>
        </div>
      )}
      <section id="top" className="hero section-frame">
        <div className="hero-orbs" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <p className="kicker shine">Built for Fast-Paced Learning &amp; Engineering Teams</p>
        <h1>
          Manage and simulate
          <br />
          AI-driven <em>study workflows</em>
        </h1>
        <p className="hero-copy">
          e-Mate empowers students and technical teams to create, simulate, and
          <br className="desktop" /> manage personalized AI study workflows, RAG notebooks, and
          agentic workflows visually.
        </p>
        <div className="button-row">
          <a className="button dark-button" href={`${APP_URL}/sign-up-login-screen`}>
            Start Learning for Free
          </a>
          <a className="button outline-button" href="#pricing">
            View Pricing
          </a>
        </div>
      </section>
      <section id="about" className="section-frame feature-intro" data-reveal>
        <p className="kicker">Features</p>
        <h2>
          Built for <em>Agentic &amp; Academic Intelligence</em>
        </h2>
        <p>
          Build, test, and run AI study agents and RAG workflows with a fast
          <br className="desktop" /> visual interface
        </p>
      </section>
      <section className="feature-grid">
        <article data-reveal>
          <div className="feature-title">
            <Brain size={26} />
            <h3>LLM Model Selector</h3>
          </div>
          <p>
            Track real-time activity of agents with detailed records of triggers, tools used,
            outcomes, and timestamps.
          </p>
          <div className="model-window">
            <div className="window-dots">
              <b />
              <b />
              <b />
            </div>
            <div className="model-list">
              <span>
                <Check size={13} /> All Models <small>Nitro + BYOK</small>
              </span>
              <span>
                ✦ Gemini 2.0 Flash <strong>Ultra-Fast</strong>
              </span>
              <span>
                ◉ OpenAI GPT-4o <small>GPT-4o-mini</small>
              </span>
              <span>
                ✦ Claude 3.5 Sonnet <strong>Reasoning</strong>
              </span>
            </div>
          </div>
        </article>
        <article>
          <div className="feature-title">
            <MousePointer2 size={26} />
            <h3>Text to workflow builder</h3>
          </div>
          <p>
            Type natural prompts like &quot;Create a flashcard &amp; summary workflow from my
            uploaded OS notes&quot; to preview logic in a safe sandbox before running.
          </p>
          <div className="chat-window">
            <div className="chat-bubble">
              Create a flashcard &amp; summary
              <br /> workflow from my uploaded notes
            </div>
          </div>
        </article>
      </section>
      <section className="trusted section-frame" data-reveal>
        <p className="mono-label">TRUSTED BY STUDENTS &amp; FAST-MOVING TEAMS</p>
        <div className="logo-grid">
          {logos.map((logo, i) => (
            <div key={logo} className={`logo logo-${i}`}>
              {logo}
            </div>
          ))}
        </div>
      </section>
      <section className="section-frame how" data-reveal>
        <p className="kicker">How it works</p>
        <h2>
          Start learning <em>easily</em>
        </h2>
        <p>
          Upload your notes and let e-Mate turn them into flashcards, quizzes, and study workflows
        </p>
        <div className="integration-card">
          <Link2 size={34} />
          <span>Turn your notes into flashcards &amp; quizzes</span>
          <ArrowUpRight size={24} />
        </div>
      </section>
      <section id="pricing" className="section-frame">
        <div className="w-full max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
          {/* Currency toggle */}
          <div className="flex items-center justify-center gap-3 my-8">
            <span className="text-sm font-medium text-zinc-500">Pricing in</span>
            <button
              type="button"
              role="switch"
              aria-checked={currency.currency === 'INR'}
              onClick={toggleCurrency}
              className="relative inline-flex h-9 w-28 shrink-0 cursor-pointer items-center rounded-full bg-zinc-200/80 p-1 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-zinc-800"
            >
              <span
                className={`absolute left-1 top-1 flex h-7 w-12 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm transition-transform duration-200 ease-in-out ${
                  currency.currency === 'INR' ? 'translate-x-[52px]' : 'translate-x-0'
                }`}
              >
                {currency.currency}
              </span>
              <span className="flex w-full items-center justify-between px-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                <span className={currency.currency === 'USD' ? 'opacity-0' : 'opacity-100'}>USD</span>
                <span className={currency.currency === 'INR' ? 'opacity-0' : 'opacity-100'}>INR</span>
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full mt-4">
            {PLANS.map((plan) => {
              const featured = !!plan.featured;
              const price = formatTierPrice(plan.tier);
              const cardClass = featured
                ? 'relative bg-white dark:bg-zinc-900 border-2 border-blue-500/80 rounded-3xl p-8 shadow-xl flex flex-col justify-between transform md:-translate-y-2'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between';

              const iconMap: Record<string, typeof Zap> = {
                sparkles: Sparkles,
                zap: Zap,
                building: Building2,
              };
              const PlanIcon = iconMap[plan.icon] ?? Sparkles;

              return (
                <article key={plan.name} data-reveal className={cardClass}>
                  {featured && (
                    <>
                      <div
                        className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
                        aria-hidden="true"
                      >
                        <div
                          className="absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl"
                          style={{ background: 'radial-gradient(circle,#1f51ff,transparent 70%)' }}
                        />
                      </div>
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                        Most Popular
                      </span>
                    </>
                  )}

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          'flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ' +
                          (featured
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 ring-1 ring-blue-600/10')
                        }
                      >
                        <PlanIcon size={20} strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-zinc-500">{plan.eyebrow}</p>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 mt-5">
                      {plan.tagline}
                    </p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {price}
                      </span>
                      {plan.tier !== 'free' && (
                        <span className="text-sm text-zinc-500">/ seat / mo</span>
                      )}
                    </div>
                  </div>

                  <div className="relative mt-6">
                    {plan.tier === 'free' ? (
                      <a
                        href={plan.href}
                        className={
                          featured
                            ? 'w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-all block text-center'
                            : 'w-full py-3 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors block text-center'
                        }
                      >
                        {plan.action}
                      </a>
                    ) : plan.tier === 'growth' && currency.currency === 'INR' ? (
                      <RazorpayCheckout
                        amount={699}
                        planTier="growth"
                        className={
                          featured
                            ? 'w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-all block text-center'
                            : 'w-full py-3 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors block text-center'
                        }
                      >
                        {plan.action} · ₹699/mo
                      </RazorpayCheckout>
                    ) : plan.tier === 'scale' && currency.currency === 'INR' ? (
                      <RazorpayCheckout
                        amount={2099}
                        planTier="scale"
                        className="w-full py-3 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors block text-center"
                      >
                        {plan.action} · ₹2,099/mo
                      </RazorpayCheckout>
                    ) : (
                      <a
                        href={`${APP_URL}/sign-up-login-screen`}
                        className={
                          featured
                            ? 'w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-all block text-center'
                            : 'w-full py-3 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors block text-center'
                        }
                      >
                        {plan.action}
                      </a>
                    )}
                  </div>

                  <div className="relative my-6 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" aria-hidden="true" />

                  <ul className="space-y-3.5 text-sm text-zinc-600 dark:text-zinc-300 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span
                          className={
                            'flex h-5 w-5 items-center justify-center rounded-full shrink-0 mt-0.5 ' +
                            (featured
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300')
                          }
                        >
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-6">
                    {plan.note}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800 w-full max-w-4xl mx-auto" data-reveal>
        <p className="mono-label">FOR SECURITY FIRST TEAMS</p>
        <div className="flex items-center justify-between gap-8 py-4">
          <div className="max-w-md">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Scale securely <em>with confidence</em>
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Our AI assistant is designed with enterprise-grade security practices and compliant
              with global data protection standards.
            </p>
            <a
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity mt-5"
              href={`${APP_URL}/sign-up-login-screen`}
            >
              Start Learning for Free
            </a>
          </div>
          <div className="flex items-center gap-8 text-zinc-500 dark:text-zinc-400">
            <div className="flex flex-col items-center gap-1.5 text-xs">
              <ShieldCheck size={40} className="text-blue-600 dark:text-blue-400" />
              <span>CCPA</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-xs">
              <ShieldCheck size={40} className="text-blue-600 dark:text-blue-400" />
              <span>GDPR</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-xs">
              <ShieldCheck size={40} className="text-blue-600 dark:text-blue-400" />
              <span>ISO</span>
            </div>
          </div>
        </div>
      </section>
      <section className="faq section-frame" data-reveal>
        <p className="kicker">FAQs</p>
        <h2>Frequently Asked Questions</h2>
        <p>
          Find all your doubts and questions in one place. Still couldn&apos;t find what
          <br className="desktop" /> you&apos;re looking for?
        </p>
        <div className="button-row">
          <a className="button dark-button" href={`${APP_URL}/ai-topper-chat`}>
            Read Docs
          </a>
          <a className="button outline-button" href="mailto:support@emate.ai">
            Contact Us
          </a>
        </div>
        <div className="faq-list">
          {faqs.map((faq, i) => (
            <button
              key={faq.q}
              className="faq-row"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <span>{faq.q}</span>
              <ChevronDown size={15} className={openFaq === i ? 'rotate' : ''} />
              {openFaq === i && <span className="answer">{faq.a}</span>}
            </button>
          ))}
        </div>
      </section>
      <section id="careers" className="final-cta section-frame" data-reveal>
        <div className="orbit">
          <span>
            <Link2 />
          </span>
          <span>
            <Brain />
          </span>
          <span>
            <MousePointer2 />
          </span>
        </div>
        <h2>
          Upload your syllabus
          <br />
          and Start <em>Learning</em>
        </h2>
        <a className="button dark-button" href={`${APP_URL}/sign-up-login-screen`}>
          Start Learning for Free
        </a>
      </section>
      <footer id="blog" className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-8 text-xs sm:text-sm text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
        <span>© 2026 e-Mate AI. All rights reserved.</span>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <a href="mailto:support@emate.ai" className="hover:underline flex items-center gap-1">
            <Mail size={14} /> support@emate.ai
          </a>
          <a href="tel:+1234567890" className="hover:underline flex items-center gap-1">
            <Phone size={14} /> +1 (234) 567-890
          </a>
          <a href="#about" className="hover:underline">About</a>
          <a href="#pricing" className="hover:underline">Pricing</a>
        </div>
      </footer>
    </main>
  );
}
