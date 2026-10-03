import { ImageResponse } from 'next/og';
import { EMATE_LOGO_BASE64 } from './opengraph-logo';

export const alt = 'e-Mate AI — Smart Study Copilot & Academic Topper Workspace';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#030712',
          backgroundImage:
            'radial-gradient(circle at 24px 24px, rgba(255, 255, 255, 0.06) 1.5px, transparent 0)',
          backgroundSize: '40px 40px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
          padding: '44px 52px',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Outer Glowing Frame */}
        <div
          style={{
            position: 'absolute',
            inset: '16px',
            borderRadius: '28px',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            pointerEvents: 'none',
          }}
        />

        {/* Central Electric Blue Ambient Orb */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '850px',
            height: '420px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(37, 99, 235, 0.45) 0%, rgba(56, 189, 248, 0.18) 50%, transparent 80%)',
          }}
        />

        {/* Top-left Purple Nebula */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '-60px',
            width: '450px',
            height: '350px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Bottom-right Cyan Nebula */}
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            right: '-60px',
            width: '500px',
            height: '360px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, transparent 70%)',
          }}
        />

        {/* ── Top Bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Brand Tag Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 20px',
              borderRadius: '9999px',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 10px #38bdf8',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#bae6fd',
              }}
            >
              AI Study Copilot & Topper Suite
            </span>
          </div>

          {/* Trust Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 20px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* SVG Star */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#fbbf24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '0.02em',
              }}
            >
              4.9/5 • 10,000+ Students & Toppers
            </span>
          </div>
        </div>

        {/* ── Center Hero ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
            zIndex: 10,
            margin: 'auto 0',
          }}
        >
          {/* Logo & Brand row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '16px',
            }}
          >
            {/* 3D Glowing e-Mate Logo Badge */}
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '24px',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 0 45px rgba(56, 189, 248, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={EMATE_LOGO_BASE64}
                alt="e-Mate"
                width="68"
                height="68"
                style={{ objectFit: 'contain' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                fontSize: '66px',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              <span style={{ color: '#ffffff' }}>e-Mate</span>
              <span
                style={{
                  marginLeft: '14px',
                  background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                AI
              </span>
            </div>
          </div>

          {/* High-Impact Main Heading */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            Study 10x Faster. Ace Every Exam.
          </div>

          {/* Clean Tagline */}
          <div
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              lineHeight: 1.4,
              maxWidth: '860px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500,
            }}
          >
            Syllabus-aware RAG, instant flashcards, active recall quizzes & multi-model AI reasoning.
          </div>
        </div>

        {/* ── Feature Cards (4 Columns) ── */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            width: '100%',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              title: 'Instant Flashcards',
              desc: 'Any PDF to memory decks',
              accent: 'rgba(56, 189, 248, 0.15)',
              border: 'rgba(56, 189, 248, 0.3)',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              ),
              title: 'AI Exam Copilot',
              desc: 'Step-by-step topper logic',
              accent: 'rgba(129, 140, 248, 0.15)',
              border: 'rgba(129, 140, 248, 0.3)',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              ),
              title: 'Syllabus Context RAG',
              desc: 'Accurate chapter revision',
              accent: 'rgba(52, 211, 153, 0.15)',
              border: 'rgba(52, 211, 153, 0.3)',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                  <line x1="20" y1="9" x2="23" y2="9" />
                  <line x1="20" y1="14" x2="23" y2="14" />
                  <line x1="1" y1="9" x2="4" y2="9" />
                  <line x1="1" y1="14" x2="4" y2="14" />
                </svg>
              ),
              title: 'Multi-Model AI',
              desc: 'Claude • GPT-4o • DeepSeek',
              accent: 'rgba(244, 114, 182, 0.15)',
              border: 'rgba(244, 114, 182, 0.3)',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '18px',
                border: `1px solid ${card.border}`,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: card.accent,
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#f8fafc',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {card.title}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '2px',
                    fontWeight: 500,
                  }}
                >
                  {card.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom Bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            <span>• Powered by State-of-the-Art Academic LLMs</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.02em',
            }}
          >
            <span>emate-ai.runs-on.dev</span>
            <span style={{ fontSize: '18px' }}>→</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
