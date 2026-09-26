# Development Standards & Architectural Rules

## Mandatory Coding Standards

### TypeScript
- **Strict Mode**: `"strict": false` in tsconfig, but treat as `true` locally
- **No `any` Types**: Always use explicit types or infer from context
- **Path Aliases**: Use `@/` for imports from `src/` directory
  ```tsx
  // ✅ Good
  import { createClient } from '@/lib/supabase/server';
  
  // ❌ Avoid
  import { createClient } from '../../../lib/supabase/server';
  ```

### React & Components
- **Functional Components Only**: No class components
- **Hooks**: Use hooks for state, effects, context
- **Naming**: Components in PascalCase, hooks in camelCase with `use` prefix
  ```tsx
  // ✅ Good
  export function ChatMessageBubble({ message }: Props) { }
  export function useQuotaRefresh() { }
  
  // ❌ Avoid
  export const ChatMessageBubble = () => { }
  export function getQuotaRefresh() { }
  ```

### Code Style
- **Formatting**: Prettier (run `npm run format` before commit)
  - Print width: 80 characters
  - Tab width: 2 spaces
  - Single quotes for strings
  - Trailing commas: es5
- **Linting**: ESLint with Next.js config (run `npm run lint:fix`)
- **Comments**: Only for "why", not "what"
  ```tsx
  // ✅ Good
  // Weekly reset logic: Sunday is day 0, so we calculate from current Sunday
  const weekStart = getWeekStart();
  
  // ❌ Avoid
  // Get the week start
  const weekStart = getWeekStart();
  ```

### File Organization
- **One exported entity per file** (except related constants/utilities)
- **Index files**: Use `index.ts` to export from folders for cleaner imports
- **Naming**: lowercase with hyphens for files (`user-quota.ts`), PascalCase for components (`ChatMainArea.tsx`)

---

## Architectural Principles

### 1. Server-Client Boundary
- **Server-side only**: Database queries, API key validation, sensitive secrets
  ```tsx
  // ✅ Server component (route handler)
  const supabase = await createClient(); // ← Service role key available
  const { data: { user } } = await supabase.auth.getUser();
  ```
- **Client-side only**: Browser APIs, localStorage, UI state
  ```tsx
  // ✅ Client component
  const [isOpen, setIsOpen] = useState(false); // ← localStorage safe here
  ```

### 2. API Route Design
- **Thin layer**: API routes validate input and delegate to lib functions
- **Consistent error responses**:
  ```tsx
  // ✅ Good
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ❌ Avoid
  if (!user) throw new Error('User not found');
  ```

### 3. Authentication Pattern
- **Middleware-first**: Auth state flows through middleware, not repeated in routes
- **Supabase SSR**: Use `@supabase/ssr` in server contexts, browser SDK in client
- **Token persistence**: HTTP-only secure cookies (Supabase default)

### 4. State Management
- **React Context**: Light-weight shared state (auth, theme, settings)
- **localStorage**: Guest credits, UI preferences (browser-only)
- **Supabase Real-time** (future): Real-time subscriptions for collaborative features
- **No Redux/Zustand**: Over-engineered for current scope

### 5. Data Fetching
- **Server-side rendering**: Fetch data in layout/page components when possible
- **Client-side fetching**: Use `useEffect` + `useState` for user-triggered actions
- **Error boundaries**: Wrap async components with Suspense/error boundaries
  ```tsx
  <Suspense fallback={<Loader />}>
    <AsyncComponent />
  </Suspense>
  ```

### 6. Database Queries
- **Parameterized queries**: Always use Supabase SDK (automatic escaping)
- **Transactions for atomic ops**: Multi-step operations use Supabase transactions
  ```tsx
  // ✅ Token consumption (atomic)
  const { data, error } = await supabase.rpc('consume_token', {
    user_id: userId,
    amount: 1,
  });
  ```
- **Indexes on hot paths**: `user_id`, `week_start`, `user_id + week_start`

### 7. API Integration (OpenRouter)
- **Fallback chain**: Primary model → fallback model → error response
- **Rate limit handling**: Retry with exponential backoff (3 attempts max)
- **User key precedence**: BYOK key > server key > error
- **Streaming**: SSE for chat responses, server-sent events for long-running tasks

### 8. Error Handling
- **User-facing errors**: Clear, actionable messages (not stack traces)
- **Logging**: `console.error` for debugging, no external logging yet
- **Recovery**: Graceful degradation (e.g., use server key if client key fails)

---

## Design Patterns

### Quota Management
- **Atomic deduction**: Supabase transactions prevent race conditions
- **Dual-tier system**: Free plan (50/week) + additional tokens (1B default)
- **Weekly reset**: Sunday at 00:00 local time, auto-trigger on first quota fetch
- **Overflow protection**: Free plan consumed first, then additional tokens

### Authentication Flow
```
Client sends JWT → Middleware validates → extractUserId → 
Route handler queries user_quotas → Success/Error response
```

### Token Consumption Flow
```
Chat request → Authenticate → POST /api/user/consume-token → 
Supabase transaction (deduct + return remaining) → 
Stream response → Update frontend state
```

---

## Forbidden Patterns

❌ **DO NOT**:
1. **Hardcode secrets**: All keys in environment variables only
2. **Query on client**: Never expose Supabase queries to client code
3. **Disable auth**: Every protected route must validate user identity
4. **Use `any` types**: Explicit typing required
5. **Modify git config**: Use global config only
6. **Force push to main**: Destructive operations require explicit approval
7. **Commit secrets**: Review `.env` files before staging
8. **Bulk git add**: Stage specific files by name, not `git add .`

---

## Preferred Development Workflow

### Before Starting Work
1. Check `MEMORY.md` for current context and blockers
2. Read `ARCHITECTURE.md` for relevant component/API structure
3. Check `DESIGN.md` if UI changes involved

### During Development
1. **Build & lint**: `npm run build` and `npm run lint:fix` before committing
2. **Branch naming**: `feature/feature-name` or `fix/bug-name`
3. **Commit messages**: Concise, imperative verb + description
   ```
   Add real-time quota fetching in Settings
   Fix spacing in chat message bubbles
   Refactor token consumption to atomic transactions
   ```

### Before Pushing
1. Run full build: `npm run build`
2. Type check: `npm run type-check`
3. Lint: `npm run lint`
4. Test manually: Visit affected pages, test happy path
5. Update `MEMORY.md` with completed task and next steps

### Pull Request Standards
- **Title**: Under 70 characters, imperative verb
- **Description**: Summary of changes, test plan, any breaking changes
- **Scope**: Keep PRs focused (1–3 files for small fixes, max 10 for features)

---

## Performance Constraints

- **Page load**: Target <3s on 4G (Lighthouse target: >85)
- **Chat response**: TTFT <500ms (Gemini 2.5 Flash achieves ~200–400ms)
- **Model fallback**: Trigger if primary fails, max 3 retries total
- **Bundle size**: Next.js default optimization (tree-shake unused code)

---

## Deployment

- **Hosting**: Vercel (Next.js native)
- **Database**: Supabase (managed PostgreSQL)
- **Edge Functions**: Not used currently (all logic in API routes)
- **Secrets**: Vercel environment variables synced from `.env`
- **Build**: `npm run build` on every push to main

