# Product Requirements Document (PRD)

## Product Vision
**e-Mate AI** is an intelligent, AI-powered study companion that transforms passive learning into active, adaptive knowledge acquisition. It combines conversational AI, spaced repetition, and multi-modal content processing to accelerate academic achievement for students.

## Core Value Proposition
- **Smart Study Copilot**: Real-time AI assistance for conceptual clarity, problem-solving, and exam prep
- **Active Learning**: Interactive flashcards, dynamic quizzes, and personalized revision schedules
- **Content Intelligence**: Instant PDF summarization, note breakdown, image explanation
- **Flexible Access Tiers**: Free guest mode (50 searches/week) + authenticated tier (1B tokens/week + wallet system)

---

## Key Functional Requirements

### 1. AI Chat & Conversational Learning
- **Primary Model**: Gemini 2.5 Flash via OpenRouter (TTFT ~200-400ms)
- **Fallback Chain**: Automatic model switching on rate limits/failures
- **Context Awareness**: Multi-modal support (text, images, PDFs, attachments)
- **Study Modes**: General chat, concept explanation, flashcard generation, quiz generation
- **API Integration**: OpenRouter for model orchestration; BYOK or server key

### 2. Authentication & Access Control
- **Guest Mode**: 50 searches/week (localStorage-backed)
- **Supabase Auth**: Email/password, OAuth integrations
- **Session Persistence**: Middleware-enforced auth with SSR support

### 3. Token Quota & Billing System
- **Free Plan**: 50 searches/week (resets Sundays), 1B additional tokens
- **Wallet System**: $100 USD default for paid operations
- **Atomic Consumption**: Supabase transactions prevent race conditions
- **Weekly Reset**: Automatic Sunday reset

### 4. Document Processing
- **PDF Parsing**: `pdf-parse` + `mammoth` for extraction
- **Summarization**: Concise academic document summaries
- **Vector Retrieval**: Semantic search on document chunks

### 5. Quiz & Flashcard Generation
- **Quiz Agent**: Multi-choice, short-answer exams on demand
- **Flashcard Engine**: Active recall sets from notes/documents
- **Performance Tracking**: Score history, pattern analysis

### 6. Image Intelligence
- **Image Explanation**: Visual problem solving for charts, equations, diagrams
- **Image Generation**: Create illustrations from descriptions (future)

### 7. Notebook & Session Management
- **Note Organization**: Hierarchical folders with templates
- **Study Sessions**: Timestamped learning records
- **Persistent Context**: Retrieve and continue from prior work

---

## Current Feature Set

| Feature | Status |
|---------|--------|
| AI Chat | ✅ Live |
| Guest Mode (50 searches/week) | ✅ Live |
| Supabase Authentication | ✅ Live |
| PDF Upload & Summarization | ✅ Live |
| Flashcard Generation | ✅ Live |
| Quiz Generation | ✅ Live |
| Real-time Token Quota | ✅ Live |
| Wallet & Billing (Razorpay) | ✅ Live |
| Image Explanation | ✅ Live |
| Study Sessions & History | ✅ Live |
| Settings Dashboard | ✅ Live |

