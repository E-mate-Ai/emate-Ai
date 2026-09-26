# Technical Architecture

## Tech Stack Overview

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 15.5 (App Router, SSR/SSG) |
| **UI Library** | React 19 with TypeScript |
| **Styling** | Tailwind CSS 3.4 + CSS-in-JS (Tailwind Merge) |
| **Component Library** | shadcn/ui, Radix UI, Hero Icons, Lucide React |
| **Authentication** | Supabase Auth (SSR support via @supabase/ssr) |
| **Database** | PostgreSQL (via Supabase) |
| **Backend** | Next.js API Routes (edge-optimized) |
| **AI Models** | OpenRouter API (Gemini 2.5 Flash primary) |
| **Document Processing** | pdf-parse, mammoth (Word docs) |
| **Vector Storage** | Supabase pgvector extension |
| **Payments** | Razorpay (webhook-validated) |
| **Monitoring** | Sonner (toast notifications) |

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with auth providers
│   ├── page.tsx                 # Home page (redirects to chat)
│   ├── ai-topper-chat/
│   │   ├── page.tsx            # Chat interface root
│   │   └── components/
│   │       ├── ChatMainArea.tsx       # Main chat canvas (spacing refactored)
│   │       ├── ChatMessageBubble.tsx  # Message rendering (size refined)
│   │       ├── AITopperChatScreen.tsx # Chat orchestrator
│   │       └── [other UI components]
│   ├── api/                     # Next.js API routes
│   │   ├── chat/
│   │   │   └── route.ts         # Chat completion streaming endpoint
│   │   ├── user/
│   │   │   ├── quota/route.ts         # GET real-time user quota
│   │   │   └── consume-token/route.ts # POST atomic token deduction
│   │   ├── agents/              # LLM agent endpoints
│   │   │   ├── generate-quiz/route.ts
│   │   │   └── study-explain/route.ts
│   │   ├── documents/           # Document processing
│   │   ├── auth/                # OAuth callbacks
│   │   └── razorpay/            # Payment webhooks
│   └── auth/callback/route.ts   # Supabase auth callback
├── components/                  # Reusable UI components
│   ├── AppLayout.tsx
│   ├── SettingsPage.tsx        # Quota display + quota refresh loop
│   ├── AuthListener.tsx        # Auth state listener
│   ├── RazorpayCheckout.tsx
│   ├── RouteTracker.tsx
│   └── [other components]
├── hooks/                       # React hooks
│   └── useGeoCurrency.ts
├── lib/                         # Business logic & utilities
│   ├── supabase/
│   │   ├── server.ts           # Server-side Supabase client (SSR)
│   │   └── client.ts           # Client-side Supabase client (browser)
│   ├── openrouter.ts           # OpenRouter SDK wrapper, fallback logic
│   ├── prompts.ts              # Prompt templates & builders
│   ├── tools.ts                # Tool registry & evaluation
│   ├── credits.ts              # Guest credit tracking (localStorage)
│   ├── user-quota.ts           # Quota API client (fetchUserQuota, consumeToken)
│   └── utils.ts
├── styles/
│   └── tailwind.css            # Tailwind directives
├── types/
│   └── modules.d.ts            # Global type definitions
└── middleware.ts               # Supabase auth middleware

supabase/
└── migrations/
    ├── 20260917000000_init_profiles_and_activity.sql
    ├── 20260917000001_notebook_and_history_schema.sql
    ├── 20260918000000_add_search_indexes.sql
    ├── 20260922000000_document_chunks_schema.sql
    ├── 20260922000001_vector_search_rpc.sql
    ├── 20260922000002_add_document_summary.sql
    └── 20260924000000_user_quotas_schema.sql     # NEW: Real-time quota tracking

public/                         # Static assets
```

---

## Core Data Models

### User Quotas (Supabase Table)
```sql
CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  searches_used INT DEFAULT 0,
  additional_tokens BIGINT DEFAULT 1000000000,
  wallet_balance DECIMAL(10, 2) DEFAULT 100.0,
  auto_recharge BOOLEAN DEFAULT false,
  week_start DATE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### Study Sessions (Supabase Table)
- user_id, created_at, subject, unit, study_mode, context, messages[], results

### Notebooks & Notes
- Hierarchical structure: Notebook → Folder → Note
- Embedded document chunks with pgvector for semantic search

### Chat Messages
- User/Assistant messages, attachments, tokens consumed, model used

---

## API Endpoints

### Authentication
- `POST /api/auth/callback` — Supabase auth redirect
- `POST /api/auth/guest` — Guest session init (optional)
- `POST /api/auth/openrouter/connect` — Link OpenRouter API key
- `GET /api/auth/openrouter/status` — Check key validity

### Chat & Completion
- `POST /api/chat` — Stream chat completion (consumes 1 token per request)
  - Authenticates user → checks quota → streams response → atomically deducts token
  - Falls back to server key if client provides no BYOK key

### User Quota Management
- `GET /api/user/quota` — Fetch real-time quota from Supabase
  - Returns: free plan (used/remaining/total), additional tokens, wallet balance, auto-recharge status
  - Auto-initializes new user quota record on first call
  - Checks weekly reset, auto-resets Sunday if needed

- `POST /api/user/consume-token` — Atomically deduct tokens using Supabase transactions
  - Request: `{ cost: 1 }`
  - Response: `{ success, plan_used (free/additional), remaining }`
  - Returns 429 if quota exceeded, 404 if user not found

### Document Processing
- `POST /api/documents/parse` — Upload & parse PDF/DOCX
- `GET /api/documents/fetch-title` — Extract metadata from URL

### Agents (LLM)
- `POST /api/agents/generate-quiz` — Generate quiz from notes/document
- `POST /api/agents/study-explain` — Explain concept in study mode

### Payments
- `POST /api/razorpay/create-order` — Create Razorpay payment order
- `POST /api/razorpay/verify-payment` — Verify payment, credit tokens
- `POST /api/razorpay/webhook` — Process payment webhook

### Models
- `GET /api/models` — List available AI models with pricing/latency metadata

---

## Authentication Flow

1. **Supabase Middleware** (`middleware.ts`)
   - Validates JWT from secure HTTP-only cookie
   - Refreshes token if expired
   - Passes `authenticatedUserId` to route handlers

2. **Server-Side Auth** (in API routes)
   - `const supabase = await createClient()` (server-side Supabase client with service role key)
   - `const { data: { user } } = await supabase.auth.getUser()`
   - Extracts `user.id` and queries `user_quotas` table

3. **Client-Side Auth** (in React components)
   - `useEffect` listener for auth state changes
   - `SettingsPage` refreshes quota every 30s for authenticated users

---

## Token Consumption Flow

1. **Frontend sends chat request** with user message
2. **Backend validates OpenRouter key** (BYOK or server key)
3. **Authenticate user** (Supabase JWT from middleware)
4. **Consume token atomically** (call `POST /api/user/consume-token` before streaming)
   - Supabase transaction: deduct from free plan first (50 max), then additional tokens
   - Returns 429 if quota exceeded
5. **Stream response** from OpenRouter via Gemini 2.5 Flash
6. **Frontend updates local state** with remaining quota

---

## Weekly Reset Logic

- **Trigger**: `GET /api/user/quota` checks `quota.week_start` against `getWeekStart()`
- **getWeekStart()**: Returns ISO date string of most recent Sunday at 00:00 local time
- **Reset**: If `quota.week_start !== currentWeekStart`, update `searches_used = 0` and `week_start = currentWeekStart`
- **UI Refresh**: SettingsPage has 30s polling interval, so UI updates within 30s of Sunday midnight

---

## Styling & Design System

- **CSS Framework**: Tailwind CSS 3.4 with custom theme
- **Color Palette**: Brand (indigo #6366f1), Primary, Accent, Secondary, Muted, Success, Warning, Danger
- **Fonts**: Outfit (display), Geist (sans), JetBrains Mono (code)
- **Components**: shadcn/ui for base components (Button, Dialog, Select, etc.)
- **Spacing**: Tailwind default scale (4px base unit)
- **Breakpoints**: Responsive design with `sm:`, `md:`, `lg:` prefixes

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=your-server-key (fallback for guests/demo)
OPENROUTER_SERVER_FREE_KEY=your-free-tier-key

# Site
NEXT_PUBLIC_SITE_URL=https://emate-ai.vercel.app
NEXT_PUBLIC_BASE_URL=http://localhost:3000 (for local fetch calls)

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY=your-razorpay-key
RAZORPAY_SECRET=your-razorpay-secret
```


---

## Device Detection System

### Device Detector (`src/lib/device-detector.ts`)
- **Purpose**: Identify device OS, browser, device type, and generate human-readable device names
- **Function**: `detectDevice(): DeviceInfo`
  - Parses `navigator.userAgent` to extract:
    - OS: Windows, macOS, Linux, Android, iOS
    - Browser: Chrome, Safari, Firefox, Edge, Opera, IE
    - Device Type: desktop, tablet, mobile
    - Device Name: Mac, Windows PC, iPhone, iPad, Android Phone, etc.

- **Usage in SettingsPage.tsx**:
  ```tsx
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDeviceInfo(detectDevice());
    }
  }, []);
  ```

- **UI Display**: Devices tab shows dynamic device card with icon, name, OS/browser, and "Active Now" status

