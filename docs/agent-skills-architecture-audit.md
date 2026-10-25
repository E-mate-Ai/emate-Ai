# e-Mate Agent Skills: architecture audit and phased plan

## Current architecture audit

- `src/app/api/chat/route.ts` is the chat orchestrator. It resolves a Supabase server session, accepts guest requests, preserves user OpenRouter keys from the request/cookie, chooses a model, adds chat and document context, calls existing retrieval/citation tools, and streams OpenRouter output over SSE.
- `src/lib/tools/registry.ts` is a server-side tool registry used for retrieval, summarization, quiz generation, and citation formatting. It currently accepts arbitrary typed inputs without shared schema validation, timeout enforcement, authorization policy, or a common usage budget. The current route invokes selected tools itself; OpenRouter function/tool calling is not currently the execution mechanism.
- Attachments are parsed in the client and sent as extracted `text` or image data. The chat route embeds text attachments in the prompt and forwards image attachments. Model capability metadata lives in `src/lib/multimodal/registry.ts`, but selection/attachment compatibility is not enforced by a skill layer.
- Supabase authentication uses the request cookie session through `src/lib/supabase/server.ts`. Guests are supported. There is no skill permission/preferences store today; no database changes are required for safe, request-scoped local tools.
- There is no reusable `SKILL.md` folder convention, description-first registry, capability endpoint, or skill-use status event in the chat UI.
- OpenRouter BYOK and resilient model fallback are existing product behavior and must remain the model transport. Local tools must run server-side and pass bounded results into that same selected-model request.

## Phased implementation plan

### Phase 1 — Safe foundation (implemented in this increment)

1. Add six first-party, MIT-licensed skill folders with `SKILL.md` metadata and instructions: web research, document analysis, writing, data analysis, coding assistance, and image understanding.
2. Add a server-only registry that reads descriptions separately from full instructions and matches a request without loading every instruction into model context.
3. Implement document analysis end to end with a bounded, schema-validated local document-outline tool, execution timeout, per-user short-term usage cap, and an explicit-per-request permission gate. The tool only processes text explicitly attached by the user. The model remains the user-selected OpenRouter model.
4. Add a read-only capability endpoint and a per-user, browser-local skills menu so users can switch safe in-chat skills off; add an SSE status event so the interface shows the active skill/tool.
5. Add focused tests for skill selection/loading, tool validation and execution limits, and OpenRouter BYOK/chat integration invariants.

### Phase 2 — Expand deterministic local tools

1. Add tested, bounded structured-data analysis for user-provided tables/CSV text; do not evaluate arbitrary formulas or code.
2. Add writing and coding skill prompts; coding output remains unexecuted text/code unless an explicitly sandboxed runner is separately designed.
3. Add image-understanding compatibility checks against the selected model's vision capability before forwarding image attachments.
4. Add user-facing per-skill preference controls backed by an existing user settings store or a reviewed RLS-protected schema migration if no suitable store exists.

### Phase 3 — External research and consequential actions

1. Select a licensed search provider and implement a validated server-side search tool with source attribution, domain/recency limits, timeouts, and request budgets.
2. Keep web retrieval read-only. Require explicit confirmation before any consequential external action; ship no arbitrary script execution from skill folders.
3. Review license, code, dependency, and security implications before adding third-party skill packs or executable integrations.

## Current capability status

All six skill descriptions are catalogued. Writing, data-analysis, coding-assistance, and image-understanding are enabled as model-guidance skills; image understanding requires verified vision capability. Document analysis is the first enabled end-to-end server-tool integration. Web research remains unavailable until a search provider is configured. The model receives an explicit unavailable notice and must not claim to browse. Skill preferences are stored per signed-in user ID or guest in this browser; the server allowlist and explicit request gate remain authoritative for tools. Preferences are not yet synced across devices. No downloaded skill code or dependencies are executed.
