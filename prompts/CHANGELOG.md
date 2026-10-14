# e-Mate AI — Prompt Changelog & Versioning History

This changelog tracks all changes to the prompt templates, schemas, and context injection formats across the e-Mate AI system harness.

---

## 📌 Prompt Modification Rules & Policy

> **CRITICAL RULE:**
> 1. **Never edit a prompt silently in place.**
> 2. Any change to prompt wording, tone directives, constraints, output schemas, or context formatting **MUST**:
>    - Bump the corresponding semantic version in `PROMPT_VERSIONS` in `src/lib/prompts/index.ts`.
>    - Add a dated entry below under the appropriate version section with what changed and why.
>    - Update regression test references in Phase 6 evaluation sets.

### Semantic Versioning Convention
- **Patch (`x.x.1`):** Typo fixes, minor prompt wording clarifications, non-breaking formatting tweaks.
- **Minor (`x.1.0`):** New context variables, enhanced guardrails, improved few-shot examples, new output subsections.
- **Major (`2.0.0`):** Breaking changes to JSON schemas, fundamental persona/role overhauls, or breaking XML tag changes.

---

## [1.1.0] — 2026-10-11

### Chat Prompt (`chat: 1.1.0`)
- **File:** `src/lib/prompts/index.ts`
- **Context continuity:** The chat prompt now receives the full available transcript and explicitly uses prior turns to resolve follow-up questions. The context budget prioritizes conversation history over retrieved excerpts and notebook notes when the model's input limit is reached.
- **Repeated preferences:** A compact profile may include only response preferences observed across at least two separate chats (such as beginner-friendly, detailed, concise, stepwise, example-based, or structured answers). It is capped at about 30% of the history target budget and remains subordinate to the current request.
- **Reasoning privacy:** The prompt directs the model not to reveal private analysis or narrate its interpretation of the user's message.

## [1.2.0] — 2026-10-13

### Chat Prompt (`chat: 1.2.0`)
- **File:** `src/lib/prompts/index.ts` and `prompts/feature-prompts.md`
- **Study structure:** Broad study topics now use a numbered teaching scaffold covering definitions, real-world examples, how it works, applications, advantages and limitations, exam-ready answers, and takeaways. Narrow follow-ups remain focused.
- **Study focus:** Explanations begin in plain language and build toward academic detail; sprint mode keeps the same intent concise.
- **Quiz intent:** The chat prompt explicitly avoids generating quizzes unless the student asks. The chat UI recognizes explicit quiz requests and places generated interactive quizzes in the transcript.

## [1.0.0] — 2026-09-22

### Base Identity Prompt (`baseIdentity: 1.0.0`)
- **File:** `prompts/base-identity.md` & `src/lib/prompts/index.ts`
- **Role:** University/college academic tutor and exam preparation assistant.
- **Tone & Directives:** Supportive, concise, pedagogically structured (intuition $\rightarrow$ definition $\rightarrow$ example $\rightarrow$ exam tip), math LaTeX support (`$...$`, `$$...$$`), collapsible `<details>` answers for flashcards.
- **Hard Constraints:** Anti-cheating (teach method, never solve live tests blindly), strict grounding, safety/content moderation.

---

### Summarization Prompt (`summarize: 1.0.0`)
- **File:** `prompts/feature-prompts.md` & `src/lib/prompts/index.ts` (`buildSummarizePrompt`)
- **Structure:**
  1. Executive Overview (2-3 sentences)
  2. Core Concepts & Definitions
  3. Formulas / Algorithms (LaTeX formatted)
  4. High-Yield Exam Points (marked with ⭐ / 📌)
  5. Quick Revision Self-Check Checklist (4-6 questions)
- **Modes:** Sprint Revision vs. Comprehensive Study.

---

### Document Q&A & Citation Prompt (`qa: 1.0.0`)
- **File:** `prompts/feature-prompts.md` & `src/lib/prompts/index.ts` (`buildQAPrompt`)
- **Grounding Rules:** Answers strictly from injected `<context_block>` elements.
- **Citations:** Mandates bracketed source attribution `[Source: <filename>, Page: <page>]`.
- **Hallucination Fallback:** Standardized fallback message when information is missing: *"Based on the provided study documents, this information is not covered."*

---

### Quiz & MCQ Generation Prompt (`quizGen: 1.0.0`)
- **File:** `prompts/feature-prompts.md` & `src/lib/prompts/index.ts` (`buildQuizGenPrompt`)
- **Output Schema:** Strict JSON output containing `quizTitle`, `subject`, and `questions[]` with `id`, `question`, `options` (A-D), `correctAnswer`, `explanation`, `difficulty`, `topic`, and `examTip`.
- **Distractor Quality:** Mandates realistic misconceptions/calculation traps without obvious joke answers.

---

### Interactive Academic Tutor / Chat Prompt (`chat: 1.0.0`)
- **File:** `prompts/feature-prompts.md` & `src/lib/prompts/index.ts` (`buildChatPrompt`)
- **Features:** Dynamic persona adaptation based on mode (`sprint` vs `deep-dive`), student personal notebook context integration, and the original sliding-window conversation history cap (superseded by v1.1.0).

---

### Runtime Context Injection Schema (`contextInjectionSchema: 1.0.0`)
- **File:** `src/lib/prompts/index.ts` (`formatRetrievedContext`)
- **Architecture:** Standard 3-block pipeline:
  - Block A: System/Base Identity
  - Block B: XML-tagged `<retrieved_context>` with `<context_block id="..." source="..." section="..." score="...">`
  - Block C: Conversation history (chat only) / task instruction payload
- **Budgeting & Truncation:** 12,000 char (≈ 3,000 token) default budget, relevance-descending priority, whole-chunk dropping (zero mid-chunk clipping).
