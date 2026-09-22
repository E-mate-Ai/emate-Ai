# emate-Ai — AI System/Harness Build Roadmap

> Is file ko project root me rakho (e.g. `/docs/AI-HARNESS-ROADMAP.md`). Jab bhi ek step start/complete ho, status update kar do — yehi tera "project memory" hai.

**Status legend:** `[ ]` Not started · `[~]` In progress · `[x]` Done

## Locked Stack Decisions (do not change without updating this section)

- **Raw file storage:** Supabase Storage — free tier, 1 GB.
- **Database + Vector storage:** Supabase Postgres + pgvector — free tier, 500 MB. Same project as storage. Note: free-tier projects pause after 7 days inactivity — fine for dev, revisit before production.
- **Text extraction:** pdf-parse (PDF), mammoth (DOCX), native read (TXT/MD) — already implemented in src/lib/ingestion/documentParser.ts.
- **Embeddings:** Google Gemini text-embedding-004 (free tier, rate-limited). Fallback if rate-limited during dev: transformers.js (local, zero cost).
- **Rule:** Phase 3 (vector DB setup, embedding model, retrieval) must use this exact stack. Do not introduce Pinecone/Qdrant/OpenAI embeddings without updating this section first and getting confirmation.

## UI Integration Rule (applies to every step from here on)

Any step that produces a backend capability the end user would interact with (upload, chat, retrieval, quiz, summary, citations) MUST also be wired into the actual UI components (AddSourcesModal.tsx, ChatMainArea.tsx, ai-chat-input.tsx, or wherever relevant) and manually verified working in the browser — not just tested via API route or script. A step is not [x] complete until it works end-to-end from the UI, unless it is explicitly backend-only infrastructure (e.g. DB schema, index setup) with no direct UI surface yet. If a step is backend-only, say so explicitly in its Progress Log entry so it's clear UI wiring isn't skipped by mistake.

---

## Phase 1 — System Prompt Architecture
- [x] Base identity prompt likho (role, tone, hard constraints, safety rules) — `prompts/base-identity.md`
- [x] Feature-wise separate prompts banao (summarize / Q&A / quiz-gen / chat) — `prompts/feature-prompts.md` & `src/lib/prompts/index.ts`
- [x] Runtime context injection ka format decide karo (kaise retrieved docs + user history prompt me jaayenge)
- [x] Prompt versioning system (v1, v2...) + changelog file — `prompts/CHANGELOG.md` & `PROMPT_VERSIONS`

## Phase 2 — Document Ingestion & Chunking
- [x] File upload pipeline (PDF/docx/txt parsing) backend me finalize karo — `src/lib/ingestion/documentParser.ts` & `/api/documents/parse`
- [x] Chunking strategy decide karo — semantic (heading/paragraph-based) vs fixed-token — `src/lib/ingestion/chunker.ts`
- [x] Metadata store karo har chunk ke saath (source file, page/section, position) — `supabase/migrations/20260922000000_document_chunks_schema.sql` & `src/lib/ingestion/chunkStorage.ts`

## Phase 3 — Retrieval Layer (RAG core)
- [x] Vector DB choose + setup karo (pgvector / Qdrant / Pinecone) — locked to Supabase Postgres + pgvector — `supabase/migrations/20260922000001_vector_search_rpc.sql` & `src/lib/retrieval/vectorSearch.ts`
- [x] Embedding model finalize karo — Gemini text-embedding-004 + local fallback — `src/lib/retrieval/embeddings.ts`
- [x] Top-k retrieval implement karo — `src/lib/retrieval/topKRetrieval.ts` & UI wired in `src/components/AddSourcesModal.tsx`
- [x] Re-ranking step add karo (retrieve → re-rank → final context) — `src/lib/retrieval/reranker.ts` & `src/lib/retrieval/topKRetrieval.ts`
- [x] Citation grounding — response ke saath exact source/page reference return karna mandatory karo — `src/lib/prompts/index.ts`, `src/app/api/chat/route.ts`, `src/app/ai-topper-chat/components/ChatMainArea.tsx` & `ChatMessageBubble.tsx`

## Phase 4 — Token Efficiency
- [x] Prompt caching setup karo (repeated system prompt/context ke liye) — `src/lib/prompts/promptCache.ts`, `src/lib/prompts/index.ts`, `src/app/api/chat/route.ts`
- [x] Summarize-then-retrieve pattern implement karo bade documents ke liye — `src/lib/ingestion/summarizer.ts`, `src/lib/retrieval/queryClassifier.ts`, `src/lib/retrieval/topKRetrieval.ts`
- [x] Context window budget define karo (max chunks/tokens per query) — `src/lib/prompts/budget.ts` & `src/lib/prompts/index.ts`
- [x] Streaming responses enable karo — `src/lib/openrouter.ts`, `src/app/api/chat/route.ts`, `src/app/ai-topper-chat/components/ChatMainArea.tsx` & `ChatMessageBubble.tsx`

## Phase 5 — Harness / Orchestration
- [x] Tool-calling layer define karo (retrieval tool, summarizer, quiz-gen, citation-formatter alag-alag) — `src/lib/tools/index.ts`, `src/lib/tools/types.ts`, `src/lib/tools/registry.ts`, `src/app/api/chat/route.ts`
- [x] Hallucination guardrail: "not found in source" fallback jab context me answer na mile — `src/lib/retrieval/guardrail.ts`, `src/lib/prompts/index.ts`, `src/app/api/chat/route.ts`
- [x] Structured output (JSON schema) frontend-backend contract ke liye — `src/lib/tools/schemas.ts`, `src/lib/agents/mcqAgent.ts`, `src/app/api/agents/generate-quiz/route.ts`

## Phase 6 — Evaluation
- [ ] 20-30 sample Q&A pairs banao real docs se (eval set)
- [ ] Har prompt/harness change ke baad isi set pe test karo
- [ ] Regression log rakho (kya better hua, kya break hua)

---

## Progress Log
<!-- Har update yahan ek line add karte jao -->
- 2026-09-22 — Roadmap created
- 2026-09-22 — Base identity prompt drafted (Phase 1, step 1) — in review
- 2026-09-22 — Feature-wise prompts drafted (Phase 1, step 2) — in review
- 2026-09-22 — Feature-wise prompts implemented (summarize, qa, quiz-gen, chat) in markdown & TS module — enables modular, type-safe prompt building for all upcoming harness layers
- 2026-09-22 — Unified 3-block context injection schema implemented with XML chunk formatting and relevance-based whole-chunk budget truncation — standardizes context injection across all prompt builders without mid-chunk clipping
- 2026-09-22 — Prompt versioning system and CHANGELOG.md established (v1.0.0 baselines) with version traceability in PromptPayload metadata and strict no-silent-edit policy (Phase 1 complete)
- 2026-09-22 — Document ingestion & parsing pipeline finalized (PDF stream extractor with page boundaries, DOCX OpenXML heading/paragraph parser, TXT/MD/JSON decoder) at /api/documents/parse returning standard ParsedDocument with pageMap/sectionMap — replaced fragile frontend readAsText binary reads
- 2026-09-22 — Semantic chunking strategy implemented (heading/section hierarchy, page-boundary preservation, paragraph/sentence splitting with 40-word overlap) in src/lib/ingestion/chunker.ts — outputs chunks conforming to RetrievedChunk shape with zero mid-sentence slicing
- 2026-09-22 — Locked stack decisions recorded: Supabase Storage (raw files), Supabase Postgres + pgvector (database/vectors), Gemini text-embedding-004 (embeddings), and updated .env.example
- 2026-09-22 — Chunk metadata storage schema and insertion engine implemented with documents & document_chunks tables in Supabase Postgres with parent document linking and pgvector placeholder column (Phase 2 complete)
- 2026-09-22 — pgvector HNSW cosine index and match_document_chunks RPC function created with TypeScript search client in src/lib/retrieval/vectorSearch.ts and verified with dummy 768-dim vector plumbing
- 2026-09-22 — Embedding engine finalized with Google Gemini text-embedding-004 (768-dim, batching, exponential backoff) and local deterministic fallback in src/lib/retrieval/embeddings.ts, wired into chunkStorage pipeline and verified with end-to-end vector similarity test
- 2026-09-22 — Top-K retrieval service implemented in src/lib/retrieval/topKRetrieval.ts and UI integration completed in AddSourcesModal.tsx connecting real document upload/parsing/chunking/embedding pipeline with toast notifications and spinner state
- 2026-09-22 — Hybrid re-ranking layer (vector cosine 0.60 + BM25 keyword overlap 0.25 + heading match 0.15) implemented in src/lib/retrieval/reranker.ts and topKRetrieval.ts with candidate expansion (fetch 15, rerank to 5); (Backend-only infrastructure per UI Integration Rule — UI wiring in Step 5); test queries showed precision improvement on domain-specific keyword queries
- 2026-09-22 — Mandatory citation grounding implemented (Phase 3 complete) — defined Citation schema, updated chat/QA prompt builders with grounding instructions, attached structured citations via X-Citations header & SSE events in /api/chat, wired interactive inline chips and Grounded Sources drawer in ChatMessageBubble.tsx and ChatMainArea.tsx (empty when 0 chunks used)
- 2026-09-22 — Prompt & context caching layer implemented in src/lib/prompts/promptCache.ts and /api/chat/route.ts with SHA-256 fingerprinting of static system instructions & retrieved chunks, provider-native ephemeral cache_control breakpoints, session cache invalidation, and diagnostic hit/miss telemetry logging; (Backend-only infrastructure per UI Integration Rule — no UI wiring expected)
- 2026-09-22 — Summarize-then-retrieve pipeline implemented in src/lib/ingestion/summarizer.ts, src/lib/retrieval/queryClassifier.ts, and topKRetrieval.ts with ingestion-time executive summary generation, query intent routing (broad summary vs fine-grained factual RAG), and seamless citation grounding compatibility (cites "Document Summary"); verified zero regression on fine-grained queries
- 2026-09-22 — Context window budget engine implemented in src/lib/prompts/budget.ts and integrated into buildChatPrompt; configured strict limits (4800 max input tokens, 6000 total request tokens, 1200 reserved output) with deterministic whole-chunk trimming priority order (oldest history turns dropped first -> lowest relevance chunks dropped whole -> student notebook trimmed; system identity & user query protected) with dev-console telemetry; (Backend-only infrastructure per UI Integration Rule — no UI wiring expected)
- 2026-09-22 — Token-by-token streaming responses enabled end-to-end (Phase 4 complete) — OpenRouter stream: true piped through SSE via TransformStream in /api/chat/route.ts, citation grounding event appended upon completion, buffered chunk decoder in ChatMainArea.tsx preventing packet fragmentation, animated live typewriter cursor & waiting dots in ChatMessageBubble.tsx, and graceful mid-stream error recovery preserving partial text
- 2026-09-22 — Tool-calling layer and registry implemented in src/lib/tools (retrieval_tool, summarizer_tool, quiz_gen_tool, citation_formatter_tool) with standard Tool interface and JSON input schemas; refactored /api/chat/route.ts to execute via tool registry preserving zero regression on streaming, citations, budget, and caching; (Backend architecture refactor per UI Integration Rule — no UI wiring expected)
- 2026-09-22 — Hallucination guardrail implemented in src/lib/retrieval/guardrail.ts (MIN_RETRIEVAL_CONFIDENCE_THRESHOLD = 0.28) and wired into /api/chat/route.ts & buildChatPrompt; dual-layer defense (pre-generation relevance check + prompt instruction) triggers explicit "not found in source" fallback, protects summarize-then-retrieve broad path, logs dev telemetry, and renders cleanly in chat UI with empty citation drawer when ungrounded
- 2026-09-22 — Structured output JSON schemas and validation contracts finalized in src/lib/tools/schemas.ts (MCQQuiz, Citation, StudyAnalyzerReport, DocumentSummary) with automatic 1-attempt retry in mcqAgent.ts / quiz_gen_tool (Phase 5 complete) — conversational chat remains free-flowing SSE streamed markdown without JSON lock-in; MCQ assessment UI contract 100% preserved