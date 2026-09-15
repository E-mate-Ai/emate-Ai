<div align="center">

<img src="./public/asset/images/ematelogo.png" alt="e-Mate AI Logo" width="120" />

# e-Mate AI

### The AI Study Platform for Flashcards, Quizzes & Structured Learning

Turn your notes into flashcards, quizzes, and structured learning workflows — powered by AI.

[![Website](https://img.shields.io/badge/Website-emate--ai.vercel.app-2563EB?style=for-the-badge)](https://emate-ai.vercel.app)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)]()

[Live Demo](https://emate-ai.vercel.app) · [Report a Bug](#) · [Request a Feature](#)

</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Pricing](#pricing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Contact](#contact)

---

## About

**e-Mate AI** is an AI-powered study workspace built for students and fast-moving technical teams. It helps you convert raw notes, PDFs, and syllabi into interactive flashcards, quizzes, and structured study workflows — so you spend less time re-reading and more time actually understanding.

Instead of manually organizing notes into revision material, e-Mate lets you describe what you want in plain language (e.g. *"Create a flashcard and summary workflow from my uploaded OS notes"*) and builds it for you inside a visual, sandboxed workflow builder.

The project is currently **in active development**. Features, pricing, and the interface are evolving quickly — feedback and contributions are welcome.

---

## Features

- **Text-to-Workflow Builder** — Describe what you want in natural language and preview the generated study workflow before running it.
- **AI-Generated Flashcards & Quizzes** — Automatically generate revision material from uploaded notes or PDFs.
- **PDF & Notes Summarization** — Condense long documents into digestible summaries.
- **RAG Notebooks** — Build notebooks that let AI reference and reason over your own uploaded material.
- **Multi-Model Support** — Choose the underlying model per task (e.g. Gemini, GPT-4o, Claude 3.5 Sonnet), with BYOK (Bring Your Own Key) support via OpenRouter.
- **Agentic Workflows** — Chain multiple study actions (summarize → generate flashcards → quiz) into a single automated flow.
- **Voice Studying** *(in progress)* — Hands-free study mode for reviewing material on the go.

---

## How It Works

1. **Upload** your notes, PDFs, or syllabus.
2. **Describe** the workflow you want, or pick from a template (flashcards, quiz, summary).
3. **Preview** the generated workflow in a sandboxed environment before running it.
4. **Run** the workflow and study using the generated flashcards, quizzes, or summaries.
5. **Iterate** — refine prompts or notebooks as your syllabus evolves.

---

## Tech Stack

> Update this section with your actual stack — the items below are inferred from the public site and marked accordingly.

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Styling | _add here (e.g. Tailwind CSS)_ |
| Backend / API | _add here_ |
| AI Models | Gemini 2.0 Flash, GPT-4o / GPT-4o-mini, Claude 3.5 Sonnet (via OpenRouter, BYOK supported) |
| Database | _add here_ |
| Hosting | Vercel |
| Auth | _add here_ |

---

## Getting Started

Follow these steps to set up e-Mate AI locally for development.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm / pnpm / yarn
- An OpenRouter API key (or relevant LLM provider key) for AI features

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/emate-ai.git

# Move into the project directory
cd emate-ai

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENROUTER_API_KEY=your_api_key_here
DATABASE_URL=your_database_url_here
# Add any additional keys your integrations require
```

> Never commit your `.env.local` file. Make sure it's listed in `.gitignore`.

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
emate-ai/
├── app/                # Application routes and pages
├── components/         # Reusable UI components
├── lib/                # Utility functions, API clients, helpers
├── public/             # Static assets (logo, icons, images)
├── styles/             # Global styles
├── .env.local          # Local environment variables (not committed)
└── README.md
```

> Adjust this to match your actual folder layout.

---

## Pricing

| Plan | Price | Best For |
|---|---|---|
| **Free** | $0 | Getting started with basic notebook uploads and daily queries |
| **Growth** | $8 / seat / month | Power learners who want full RAG, active agents, and unlimited momentum |
| **Scale** | $25 / seat / month | Teams and enterprises needing dedicated infrastructure and SSO |

Full pricing details available at [emate-ai.vercel.app](https://emate-ai.vercel.app/#pricing).

---

## Roadmap

- [ ] Public launch
- [ ] Voice-based hands-free studying
- [ ] Mobile app
- [ ] Team/classroom collaboration features
- [ ] More granular agent controls and simulation logs
- [ ] Expanded model marketplace

> This roadmap is subject to change as the product evolves.

---

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add: your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please open an issue first to discuss significant changes before submitting a PR.

---

## Security

If you discover a security vulnerability, please **do not** open a public issue. Instead, email **support@emate.ai** directly with details, and we will respond as soon as possible.

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

> Replace this with your actual license if different (e.g. proprietary/all rights reserved, if this is a closed-source commercial product).

---

## Contact

- **Website:** [emate-ai.vercel.app](https://emate-ai.vercel.app)
- **Email:** [support@emate.ai](mailto:support@emate.ai)
- **X (Twitter):** [@Try_Emate](https://x.com/Try_Emate)

<div align="center">

Built with ❤️ for students and lifelong learners.

</div>
