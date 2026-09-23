import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'e-Mate AI — Smart Study Copilot & Workflow Assistant';
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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, #18181b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #18181b 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* Glowing background orb */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0.05) 70%, transparent 100%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Top Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '9999px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
            }}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#93c5fd',
            }}
          >
            AI Study Copilot & Topper Workspace
          </span>
        </div>

        {/* Main Brand Title */}
        <div
          style={{
            fontSize: '68px',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#ffffff' }}>e-Mate</span>
          <span
            style={{
              marginLeft: '14px',
              background: 'linear-gradient(to right, #38bdf8, #3b82f6, #6366f1)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            AI
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '24px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '840px',
            lineHeight: 1.45,
            margin: '0 auto 36px',
          }}
        >
          Adaptive syllabus revision, instant flashcard generation, multi-model AI reasoning & automated exam prep.
        </p>

        {/* Feature Badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {['Instant Flashcards', 'Syllabus Context RAG', 'Active Recall Quizzes', 'Multi-Model AI'].map((feat) => (
            <div
              key={feat}
              style={{
                padding: '10px 18px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                fontSize: '15px',
                fontWeight: 600,
                color: '#e4e4e7',
              }}
            >
              {feat}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
