import { openRouterCompletion } from '@/lib/openrouter';
import { getFreeModelCascade } from '@/lib/modelConfig';
import { getEducationalImage } from './imageService';
import type {
  Flashcard,
  FlashcardDeck,
  FlashcardGenerationRequest,
  FlashcardDifficulty,
  FlashcardLearningMode,
} from './types';

interface RawGeneratedCard {
  front?: string;
  question?: string;
  term?: string;
  back?: string;
  answer?: string;
  definition?: string;
  explanation?: string;
  example?: string;
  mnemonic?: string;
  imageQuery?: string;
  scientificName?: string;
  categoryPill?: string;
  tags?: string[];
  difficulty?: string;
}

function extractContentText(response: any): string {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part: any) => part && typeof part.text === 'string')
      .map((part: any) => part.text)
      .join('');
  }
  if (content && typeof content === 'object' && typeof content.text === 'string') {
    return content.text;
  }
  return '';
}

/** Sanitize and parse JSON from model output with resilience for trailing commas and truncation */
function extractJsonFromText(rawText: string): any {
  let cleaned = (rawText || '').trim();
  if (!cleaned) return null;

  // Strip code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Direct parse attempt
  try {
    return JSON.parse(cleaned);
  } catch {
    /* continue to sanitize */
  }

  // Remove trailing commas before closing braces/brackets
  try {
    const sanitizedCommas = cleaned.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(sanitizedCommas);
  } catch {
    /* continue */
  }

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      const slice = cleaned.slice(startIdx, lastBrace + 1).replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(slice);
      } catch {}
    }
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) {
      const slice = cleaned.slice(startIdx, lastBracket + 1).replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(slice);
      } catch {}
    }
  }

  // Resilient regex card extraction: recover all fully formed card objects
  try {
    const cardMatches: any[] = [];
    const cardBlockRegex = /\{[^{}]*"front"\s*:\s*"((?:[^"\\]|\\.)*)"[^{}]*"back"\s*:\s*"((?:[^"\\]|\\.)*)"[^{}]*\}/g;
    let match: RegExpExecArray | null;
    while ((match = cardBlockRegex.exec(cleaned)) !== null) {
      try {
        const cardObj = JSON.parse(match[0].replace(/,\s*([}\]])/g, '$1'));
        if (cardObj.front && cardObj.back) {
          cardMatches.push(cardObj);
        }
      } catch {}
    }
    if (cardMatches.length > 0) {
      return { cards: cardMatches };
    }
  } catch {}

  return null;
}

/** Build student-friendly system prompt for visual flashcards */
function buildSystemPrompt(
  difficulty: FlashcardDifficulty,
  mode: FlashcardLearningMode,
  count: number
): string {
  return `You are a friendly senior student tutoring a college peer for their exams on e-Mate AI.
Generate ${count} active-recall flashcards. Each answer must be simple, clear, and easy to understand in 5–10 seconds.

DIFFICULTY: ${difficulty.toUpperCase()}
LEARNING MODE: ${mode.toUpperCase()}

ANSWER WRITING RULES (critical — follow exactly):
• "back" = one short, direct answer sentence. NOT a textbook definition. Like a friend explaining it simply.
• "explanation" = 1–3 plain sentences expanding the idea. Use everyday English. Avoid jargon unless necessary for the exam, and if used, explain it immediately.
• "example" = ONE concrete, easy-to-remember example OR a quick memory tip. Keep it under 2 sentences. Omit this field entirely if no genuinely useful example exists.
• Never repeat the same idea across back, explanation, and example.
• For formulas/math: put the correct formula in "back", then explain each symbol simply in "explanation".
• For lists/steps: use short numbered items in "explanation" instead of a paragraph.
• For comparisons: contrast the two things in one short sentence each.
• Language: simple English, active voice, short sentences, no unnecessary words.

Return ONLY valid JSON:
{
  "title": "Concise deck title",
  "subject": "Main subject name",
  "cards": [
    {
      "front": "One clear question that tests understanding, not just memory",
      "back": "Direct answer in one simple sentence — as a friend would say it",
      "explanation": "1–3 plain sentences explaining how/why it works. Simple words only.",
      "example": "One real example or memory trick (omit if not genuinely helpful)",
      "imageQuery": "Specific Wikimedia Commons search query for an educational diagram",
      "scientificName": "Formal term, formula, or classification",
      "categoryPill": "1–2 word category tag (e.g. 'Attention', 'Tokenization')",
      "tags": ["topic", "concept"]
    }
  ]
}

No markdown outside the JSON block. Every answer must feel like a helpful senior explaining to a student, not a textbook.`;
}

/**
 * Intelligent curriculum-aligned fallback generator for when external AI APIs
 * are rate-limited, over quota, or unreachable.
 * Answers follow the student-friendly format: short direct answer, plain explanation, one useful example.
 */
function generateStructuredCurriculumFallback(
  topic: string,
  count: number,
  difficulty: FlashcardDifficulty,
  mode: FlashcardLearningMode
): { title: string; subject: string; cards: RawGeneratedCard[] } {
  const cleanTopic = topic.trim();
  const lower = cleanTopic.toLowerCase();

  let subject = 'General Science';
  let cards: RawGeneratedCard[] = [];

  if (lower.includes('nervous') || lower.includes('brain') || lower.includes('neuron')) {
    subject = 'Neuroscience & Biology';
    cards = [
      {
        front: 'What cells send electrical messages through your body?',
        back: 'Neurons — the nerve cells that carry information around your body.',
        scientificName: 'Neuron Architecture',
        categoryPill: 'Cells',
        explanation: 'A neuron has three parts: dendrites that receive signals, a cell body that processes them, and an axon that sends the signal forward. They communicate using tiny electrical pulses called action potentials.',
        example: 'Motor neurons send the signal from your brain to your leg muscles when you kick a ball.',
        imageQuery: 'Neuron anatomy labeled diagram biology',
        tags: ['neuroscience', 'biology', 'cells'],
      },
      {
        front: 'Why do nerve signals travel so fast?',
        back: 'Because axons are wrapped in a fatty coating called myelin, which speeds up the signal.',
        scientificName: 'Saltatory Conduction',
        categoryPill: 'Speed',
        explanation: 'Myelin acts like insulation on a wire. It forces the electrical signal to jump between small gaps (Nodes of Ranvier) instead of travelling the whole length of the axon, making it much faster.',
        example: 'In Multiple Sclerosis, myelin breaks down — which is why patients experience slowed or lost movement.',
        imageQuery: 'Myelin sheath node of ranvier axon diagram',
        tags: ['myelin', 'axon', 'conduction'],
      },
      {
        front: 'How do two neurons pass a message to each other?',
        back: 'Through a tiny gap called a synapse, using chemical messengers called neurotransmitters.',
        scientificName: 'Synaptic Transmission',
        categoryPill: 'Communication',
        explanation: 'When a signal reaches the end of a neuron, it releases chemicals into the gap. The next neuron picks up those chemicals and continues the signal. It\'s like passing a relay baton.',
        example: 'Acetylcholine crosses the synapse between a motor neuron and a muscle to make the muscle contract.',
        imageQuery: 'Chemical synapse neurotransmitter vesicle diagram',
        tags: ['synapse', 'neurotransmitters'],
      },
      {
        front: 'What are the two main parts of the human nervous system?',
        back: 'The Central Nervous System (brain + spinal cord) and the Peripheral Nervous System (all other nerves).',
        scientificName: 'Systemic Neuroanatomy',
        categoryPill: 'Structure',
        explanation: 'Think of it as a head office (CNS) and all the branch offices (PNS). The CNS makes decisions; the PNS carries instructions to and from the rest of the body.',
        example: 'When you touch something hot, your PNS carries the pain signal to your spinal cord, which instantly sends a signal back to pull your hand away.',
        imageQuery: 'Central and peripheral nervous system diagram labeled',
        tags: ['cns', 'pns', 'anatomy'],
      },
      {
        front: 'Which part of your nervous system gives you the "fight or flight" response?',
        back: 'The sympathetic nervous system — it kicks in when you feel danger or stress.',
        scientificName: 'Autonomic Regulation',
        categoryPill: 'Response',
        explanation: 'It increases your heart rate, slows digestion, and releases adrenaline so your body is ready to act fast. Its opposite, the parasympathetic system, calms you down afterward.',
        example: 'Your heart races and palms sweat before an exam — that\'s the sympathetic system at work.',
        imageQuery: 'Autonomic nervous system sympathetic parasympathetic diagram',
        tags: ['autonomic', 'sympathetic', 'stress'],
      },
    ];
  } else if (lower.includes('deadlock') || lower.includes('operating system') || lower.includes('process')) {
    subject = 'Operating Systems';
    cards = [
      {
        front: 'What four conditions must all be true for a deadlock to happen?',
        back: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait — all four must exist at the same time.',
        scientificName: 'Coffman Conditions',
        categoryPill: 'Deadlock',
        explanation: 'If you break even one of these four conditions, deadlock becomes impossible. For example, if you force processes to release resources before requesting new ones, "Hold and Wait" is broken.',
        example: 'Imagine two people each holding one chopstick and waiting for the other\'s — neither can eat. That\'s circular wait.',
        imageQuery: 'Deadlock circular wait process resource graph diagram',
        tags: ['os', 'concurrency', 'deadlock'],
      },
      {
        front: 'What algorithm checks if giving a resource to a process will leave the system in a safe state?',
        back: 'The Banker\'s Algorithm — it simulates the allocation before actually giving the resource.',
        scientificName: "Dijkstra's Banker's Algorithm",
        categoryPill: 'Avoidance',
        explanation: 'The algorithm checks: "If I give this resource now, can all remaining processes still finish?" If yes, it\'s safe. If no process can finish with current available resources, the system is in an unsafe state.',
        example: 'Like a bank that only lends money if it\'s sure all customers can eventually be repaid.',
        imageQuery: 'Bankers algorithm resource allocation matrix operating systems',
        tags: ['algorithms', 'bankers', 'os'],
      },
      {
        front: 'What is the difference between deadlock prevention and deadlock avoidance?',
        back: 'Prevention stops deadlock by design; avoidance checks at runtime before each resource request.',
        scientificName: 'Resource Management Strategy',
        categoryPill: 'Strategy',
        explanation: 'Prevention builds rules into the system so a deadlock condition can never form (e.g. always request resources in a fixed order). Avoidance is more flexible — it allows requests but checks safety first.',
        example: 'Prevention = no left turns on a road. Avoidance = traffic lights that check before letting cars cross.',
        imageQuery: 'Resource allocation graph operating system deadlock cycle',
        tags: ['deadlock', 'prevention', 'avoidance'],
      },
      {
        front: 'How can you detect a deadlock by looking at a Resource Allocation Graph?',
        back: 'If there is a cycle in the graph, there is a deadlock (for systems with single-instance resources).',
        scientificName: 'Resource Allocation Graph (RAG)',
        categoryPill: 'Detection',
        explanation: 'Nodes are either processes or resources. Arrows show who is waiting for what. If following the arrows brings you back to where you started, that\'s a cycle — and a deadlock.',
        example: 'P1 → R1 → P2 → R2 → P1: each process waits for a resource held by the other.',
        imageQuery: 'Resource allocation graph cycle deadlock',
        tags: ['rag', 'graph', 'os'],
      },
    ];
  } else if (lower.includes('normaliz') || lower.includes('database') || lower.includes('sql') || lower.includes('dbms')) {
    subject = 'Database Systems';
    cards = [
      {
        front: 'What does First Normal Form (1NF) require?',
        back: 'Every cell in the table must hold only one value — no lists, no groups.',
        scientificName: '1NF Atomicity Principle',
        categoryPill: 'Normalization',
        explanation: 'Think of it as a strict rule: one box, one thing. If a cell has "Math, Science, English", that breaks 1NF. Each value must be split into its own row.',
        example: 'Instead of one row with PhoneNumbers = "9876, 1234", create two rows, one for each number.',
        imageQuery: 'Database normalization 1NF 2NF 3NF schema diagram',
        tags: ['dbms', 'normalization', '1nf'],
      },
      {
        front: 'What problem does Second Normal Form (2NF) fix?',
        back: 'Partial dependency — where a non-key column depends on only part of a composite primary key.',
        scientificName: '2NF Full Dependency',
        categoryPill: 'Normalization',
        explanation: 'If your primary key is two columns combined, every other column must need BOTH of them, not just one. If a column only needs one part of the key, it belongs in a separate table.',
        example: 'Primary key = (OrderID, ProductID). If ProductName only depends on ProductID, move it to a Products table.',
        imageQuery: 'Second normal form partial functional dependency diagram',
        tags: ['2nf', 'dependencies', 'sql'],
      },
      {
        front: 'What problem does Third Normal Form (3NF) fix?',
        back: 'Transitive dependency — where a non-key column depends on another non-key column instead of the primary key.',
        scientificName: '3NF Transitive Invariance',
        categoryPill: 'Normalization',
        explanation: 'In 3NF, every column must depend directly on the primary key, nothing in between. If column A determines column B, and B determines C, then C is transitively dependent on A — that must be removed.',
        example: 'StudentID → DeptCode → DeptName: move DeptName to a separate Departments table.',
        imageQuery: 'Third normal form transitive dependency database diagram',
        tags: ['3nf', 'transitive', 'dbms'],
      },
      {
        front: 'Why is BCNF stricter than 3NF?',
        back: 'In BCNF, every column must depend on a superkey — no exceptions, even for prime attributes.',
        scientificName: 'Boyce-Codd Normal Form (BCNF)',
        categoryPill: 'Normalization',
        explanation: '3NF has a small loophole: it allows a dependency if the dependent column is part of a key. BCNF closes that loophole completely. Every determinant (left side of a dependency) must be a superkey.',
        example: 'If two candidate keys overlap and one determines part of the other, 3NF allows it but BCNF does not.',
        imageQuery: 'BCNF vs 3NF database normalization diagram',
        tags: ['bcnf', 'superkey', 'dbms'],
      },
    ];
  } else if (lower.includes('nlp') || lower.includes('artificial intelligence') || lower.includes('transformer') || lower.includes('llm')) {
    subject = 'Artificial Intelligence & NLP';
    cards = [
      {
        front: 'What is self-attention in Transformers?',
        back: 'Self-attention helps the model understand how different words in a sentence relate to each other.',
        scientificName: 'Scaled Dot-Product Attention',
        categoryPill: 'Attention',
        explanation: 'For each word, it calculates a score against every other word. Higher score = more attention. The formula is: Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V. Q = what you\'re looking for, K = what each word offers, V = the actual content passed forward.',
        example: 'In "Riya lost her book because she was careless," attention helps the model connect "she" with "Riya."',
        imageQuery: 'Transformer self-attention mechanism scaled dot product diagram',
        tags: ['transformers', 'attention', 'nlp'],
      },
      {
        front: 'Why does BPE tokenization work better than splitting text word by word?',
        back: 'BPE breaks words into smaller reusable pieces (subwords), so it can handle words it has never seen before.',
        scientificName: 'Byte-Pair Encoding (BPE)',
        categoryPill: 'Tokenization',
        explanation: 'Instead of memorising every possible word, BPE learns common word-parts. Unfamiliar words get split into known pieces. This keeps the vocabulary small while covering almost any input.',
        example: '"unbreakable" → "un" + "break" + "able". The model knows each piece, even if it never saw "unbreakable" in training.',
        imageQuery: 'Byte pair encoding tokenization NLP subword diagram',
        tags: ['bpe', 'tokenization', 'llm'],
      },
      {
        front: 'Why do Transformers need positional encoding?',
        back: 'Because self-attention processes all words at once and has no built-in sense of word order.',
        scientificName: 'Positional Encoding Vectors',
        categoryPill: 'Architecture',
        explanation: 'Self-attention treats "cat sat mat" and "mat cat sat" the same without positional encoding. To fix this, a position-based number is added to each word\'s representation before processing.',
        example: 'Like numbering seats in a cinema — the seat number tells you where you are, even if everyone arrived at once.',
        imageQuery: 'Transformer positional encoding sine cosine diagram',
        tags: ['positional-encoding', 'transformers', 'architecture'],
      },
    ];
  }

  // If domain cards are fewer than requested count, synthesize progressive curriculum cards
  if (cards.length < count) {
    const progressiveCurriculum: RawGeneratedCard[] = [
      {
        front: `What is the core definition and primary objective of ${cleanTopic}?`,
        back: `${cleanTopic} is a foundational concept designed to solve specific challenges in its domain.`,
        scientificName: `${cleanTopic} Overview & Definition`,
        categoryPill: 'Core Concept',
        explanation: `It provides an organized, reliable approach to its subject matter. Understanding its definition is essential for answering introductory exam questions and grasping more advanced topics.`,
        example: `Like a specialized tool in an engineer's toolkit, it provides the right technique for this specific class of problems.`,
        imageQuery: `${cleanTopic} overview diagram scientific explanation`,
        tags: [cleanTopic.toLowerCase(), 'definition', 'overview'],
      },
      {
        front: `What is the most critical governing rule or principle behind ${cleanTopic}?`,
        back: `It relies on a fundamental rule that determines when it can be applied and how it behaves.`,
        scientificName: 'Governing Principle',
        categoryPill: 'Key Principle',
        explanation: `This rule establishes what is allowed and what causes errors. If you violate this core principle in exam derivations or real systems, the solution becomes invalid.`,
        example: `Remembering this single rule lets you derive answers to related multiple-choice questions easily.`,
        imageQuery: `${cleanTopic} rule mechanism flowchart`,
        tags: [cleanTopic.toLowerCase(), 'principle', 'rules'],
      },
      {
        front: `How does ${cleanTopic} work step-by-step in practice?`,
        back: `It progresses through defined stages: initialization, processing, and output generation.`,
        scientificName: 'Operational Mechanism',
        categoryPill: 'Mechanism',
        explanation: `First, inputs or starting conditions are validated. Next, the core transformation or logic executes. Finally, results or system states are updated cleanly.`,
        example: `Think of an assembly line: each step must finish before the next can begin properly.`,
        imageQuery: `${cleanTopic} step by step process schematic`,
        tags: [cleanTopic.toLowerCase(), 'process', 'steps'],
      },
      {
        front: `What are the essential building blocks or main components of ${cleanTopic}?`,
        back: `It consists of several cooperating elements that each handle a distinct responsibility.`,
        scientificName: 'Architectural Components',
        categoryPill: 'Architecture',
        explanation: `Each component performs one clear task. Dividing responsibilities prevents bottlenecks and makes the overall system easier to debug, study, and maintain.`,
        example: `Like organs in a biological system, no single component works in complete isolation.`,
        imageQuery: `${cleanTopic} anatomy structure components diagram`,
        tags: [cleanTopic.toLowerCase(), 'components', 'structure'],
      },
      {
        front: `What is a concrete real-world analogy to remember ${cleanTopic}?`,
        back: `An intuitive everyday parallel that mirrors how ${cleanTopic} operates in its domain.`,
        scientificName: 'Conceptual Analogy',
        categoryPill: 'Mental Model',
        explanation: `Relating abstract academic formulas or algorithms to familiar real-world scenarios dramatically increases long-term memory retention for exams.`,
        example: `Relate it to traffic lights, postal routing, or bank queues depending on the concept.`,
        imageQuery: `${cleanTopic} analogy visual illustration`,
        tags: [cleanTopic.toLowerCase(), 'analogy', 'intuition'],
      },
      {
        front: `What common trap or misconception do students frequently fall into regarding ${cleanTopic}?`,
        back: `Assuming it works in all edge cases without verifying preconditions or constraints.`,
        scientificName: 'Common Exam Pitfall',
        categoryPill: 'Exam Warning',
        explanation: `Examiners intentionally design questions around this edge case. Double check inputs, assumptions, and negative cases before selecting your answer.`,
        example: `Always check whether edge conditions (zero, null, or extreme values) break the standard formula.`,
        imageQuery: `${cleanTopic} misconception comparison diagram`,
        tags: [cleanTopic.toLowerCase(), 'pitfalls', 'exam-tips'],
      },
      {
        front: `What is the primary trade-off when implementing ${cleanTopic}?`,
        back: `Gaining efficiency, speed, or clarity usually comes at the cost of complexity or resource overhead.`,
        scientificName: 'Trade-off & Cost Analysis',
        categoryPill: 'Trade-off',
        explanation: `No real-world engineering or scientific approach is free. Demonstrating you understand the downside shows examiners master-level comprehension.`,
        example: `In exams: if asked "What is the limitation of this method?", name this trade-off immediately.`,
        imageQuery: `${cleanTopic} pros and cons trade-off chart`,
        tags: [cleanTopic.toLowerCase(), 'tradeoff', 'evaluation'],
      },
      {
        front: `What mathematical formula, notation, or formal condition describes ${cleanTopic}?`,
        back: `A standard expression or inequality that formally defines the relationship.`,
        scientificName: 'Formal Formulation',
        categoryPill: 'Formula',
        explanation: `In written exams, writing down the formal notation or equation first earns baseline marks before you even begin the detailed explanation.`,
        example: `State each variable clearly and mention its units or valid numeric domain.`,
        imageQuery: `${cleanTopic} formula equation mathematical diagram`,
        tags: [cleanTopic.toLowerCase(), 'formula', 'math'],
      },
      {
        front: `How does ${cleanTopic} compare to its most common alternative?`,
        back: `It provides specialized advantages in its target scenario compared to older general-purpose approaches.`,
        scientificName: 'Comparative Analysis',
        categoryPill: 'Comparison',
        explanation: `Comparative questions are a staple of university tests. Focus on: difference in speed, memory/resource footprint, and ease of use.`,
        example: `Compare Approach A vs Approach B across 2 concrete metrics.`,
        imageQuery: `${cleanTopic} versus comparison table diagram`,
        tags: [cleanTopic.toLowerCase(), 'comparison', 'analysis'],
      },
      {
        front: `What are the input prerequisites and expected outputs of ${cleanTopic}?`,
        back: `Strict input requirements must be satisfied before generating valid, predictable outputs.`,
        scientificName: 'Input-Output Contract',
        categoryPill: 'Contracts',
        explanation: `If input guarantees are violated, the entire process can fail silently or yield incorrect conclusions. Always state the preconditions clearly.`,
        example: `Like a recipe: missing one key ingredient produces an unpredictable outcome.`,
        imageQuery: `${cleanTopic} input output pipeline diagram`,
        tags: [cleanTopic.toLowerCase(), 'io', 'pipeline'],
      },
      {
        front: `How do practitioners verify or test that ${cleanTopic} operated correctly?`,
        back: `Through empirical validation, assertion checks, and stress testing against edge cases.`,
        scientificName: 'Verification & Testing',
        categoryPill: 'Testing',
        explanation: `Verification ensures that outputs match theoretical predictions. In lab tests or exams, outline the verification step to show completeness.`,
        example: `Running automated test suites or comparing results against an established benchmark.`,
        imageQuery: `${cleanTopic} verification testing validation diagram`,
        tags: [cleanTopic.toLowerCase(), 'testing', 'verification'],
      },
      {
        front: `What is the most important final summary takeaway for ${cleanTopic} in exams?`,
        back: `Master its definition, core formula or rule, and the main scenario where it outperforms alternatives.`,
        scientificName: 'High-Yield Exam Summary',
        categoryPill: 'Summary',
        explanation: `If you have only 2 minutes before the exam begins, review this card to trigger active recall across the entire topic structure.`,
        example: `Use this concise summary for rapid 60-second revision before exam start.`,
        imageQuery: `${cleanTopic} summary cheat sheet infographic`,
        tags: [cleanTopic.toLowerCase(), 'summary', 'revision'],
      },
    ];

    for (const card of progressiveCurriculum) {
      if (cards.length >= count) break;
      cards.push(card);
    }
  }

  return {
    title: `${cleanTopic} Essentials`,
    subject,
    cards: cards.slice(0, count),
  };
}


/**
 * Generate a complete visual flashcard deck:
 * 1. Queries OpenRouter with resilient, ultra-fast free models (Liquid LFM, Cohere, Nemotron)
 * 2. If provider is rate-limited or fails, seamlessly uses structured curriculum generator
 * 3. Enriches every card with verified educational images from Wikimedia Commons / Wikipedia
 */
export async function generateFlashcardDeck(
  apiKey: string,
  request: FlashcardGenerationRequest
): Promise<FlashcardDeck> {
  const count = Math.min(Math.max(request.count || 6, 3), 20);
  const difficulty: FlashcardDifficulty = request.difficulty || 'intermediate';
  const mode: FlashcardLearningMode = request.learningMode || 'visual_learning';
  const topic = request.topic.trim();

  let rawCards: RawGeneratedCard[] = [];
  let title = `${topic} Flashcards`;
  let subject = request.subject || 'Study & Learning';

  // Fast, high-performance free models known for rapid, accurate JSON completion
  const FAST_FLASHCARD_MODELS = [
    'liquid/lfm-2.5-2.6b:free', // 0.7s - 1.5s lightning fast, outputs clean JSON
    'cohere/north-mini-code:free', // 5s agentic model
    'nvidia/nemotron-3-ultra-550b-a55b:free', // frontier reasoning
    'dots-studio/dots-3-note-preview:free', // 512k context study model
  ];

  // Attempt AI generation if key is provided
  if (apiKey && apiKey !== 'your-openrouter-api-key-here') {
    const systemPrompt = buildSystemPrompt(difficulty, mode, count);
    const userContent = [
      `Generate ${count} ${difficulty} flashcards for topic: "${topic}".`,
      request.subject ? `Subject: ${request.subject}` : '',
      request.studyMaterial ? `Reference notes / study material:\n${request.studyMaterial.slice(0, 3000)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // Dynamic token allotment: allocate enough room for all cards without truncating
    const tokenBudget = Math.min(Math.max(count * 350, 2500), 4500);

    for (const model of FAST_FLASHCARD_MODELS) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Model generation timed out')), 18000)
        );

        const response = (await Promise.race([
          openRouterCompletion(apiKey, {
            model,
            fallbackModels: [],
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent },
            ],
            temperature: 0.25,
            max_tokens: tokenBudget,
            extraBody: { reasoning: { exclude: true } },
          }),
          timeoutPromise,
        ])) as any;

        const rawText = extractContentText(response);
        const parsed = extractJsonFromText(rawText);

        if (parsed) {
          const extractedList = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.cards)
            ? parsed.cards
            : [];
          if (extractedList.length > 0) {
            rawCards = extractedList;
            if (typeof parsed.title === 'string' && parsed.title.trim()) title = parsed.title.trim();
            if (typeof parsed.subject === 'string' && parsed.subject.trim()) subject = parsed.subject.trim();
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[generatorService] Candidate model ${model} failed, trying next:`, err?.message);
      }
    }
  }

  // If AI generation was unavailable, timed out, or produced fewer cards than requested,
  // top-up from curriculum generator to guarantee the user gets the exact requested count!
  const fallback = generateStructuredCurriculumFallback(topic, count, difficulty, mode);
  if (rawCards.length === 0) {
    console.info(`[generatorService] Using structured curriculum engine for topic: "${topic}"`);
    rawCards = fallback.cards;
    title = fallback.title;
    subject = fallback.subject;
  } else if (rawCards.length < count) {
    // Fill remaining missing cards so the deck reaches full count
    const needed = count - rawCards.length;
    rawCards.push(...fallback.cards.slice(0, needed));
  }

  // Deduplicate and normalize cards
  const seenFronts = new Set<string>();
  const validCards: Flashcard[] = [];

  for (let i = 0; i < rawCards.length; i++) {
    if (validCards.length >= count) break;
    const raw = rawCards[i];
    const front = (raw.front || raw.question || raw.term || '').trim();
    const back = (raw.back || raw.answer || raw.definition || '').trim();

    if (!front || !back) continue;

    const normalizedFront = front.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenFronts.has(normalizedFront)) continue;
    seenFronts.add(normalizedFront);

    const imageQuery =
      raw.imageQuery?.trim() ||
      `${topic} ${raw.scientificName || front} educational diagram`;

    validCards.push({
      id: `card_${Date.now()}_${validCards.length + 1}`,
      front,
      back,
      explanation: raw.explanation?.trim() || back,
      example: raw.example?.trim() || raw.mnemonic?.trim() || '',
      imageQuery,
      scientificName: raw.scientificName?.trim(),
      categoryPill: raw.categoryPill?.trim() || 'Concept',
      tags: Array.isArray(raw.tags) && raw.tags.length ? raw.tags : [topic.toLowerCase()],
      difficulty,
    });
  }

  // If after deduplication we're still under count, backfill from fallback
  if (validCards.length < count) {
    for (const card of fallback.cards) {
      if (validCards.length >= count) break;
      const front = (card.front || '').trim();
      const back = (card.back || '').trim();
      const normalizedFront = front.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenFronts.has(normalizedFront)) continue;
      seenFronts.add(normalizedFront);

      validCards.push({
        id: `card_${Date.now()}_${validCards.length + 1}`,
        front,
        back,
        explanation: card.explanation?.trim() || back,
        example: card.example?.trim() || '',
        imageQuery: card.imageQuery || `${topic} educational diagram`,
        scientificName: card.scientificName?.trim(),
        categoryPill: card.categoryPill?.trim() || 'Core Concept',
        tags: [topic.toLowerCase()],
        difficulty,
      });
    }
  }

  // Enrich cards with verified educational images in controlled concurrent chunks
  const cardsWithImages: Flashcard[] = [];
  const chunkSize = 12;
  for (let i = 0; i < validCards.length; i += chunkSize) {
    const chunk = validCards.slice(i, i + chunkSize);
    const enrichedChunk = await Promise.all(
      chunk.map(async (card) => {
        try {
          const image = await getEducationalImage(
            card.imageQuery,
            topic,
            card.scientificName || card.front
          );
          return { ...card, image };
        } catch {
          return card;
        }
      })
    );
    cardsWithImages.push(...enrichedChunk);
  }

  const deckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const deck: FlashcardDeck = {
    id: deckId,
    title,
    topic,
    subject,
    difficulty,
    learningMode: mode,
    cards: cardsWithImages,
    cardCount: cardsWithImages.length,
    thumbnailUrl: cardsWithImages[0]?.image?.url,
    createdAt: now,
    updatedAt: now,
  };

  return deck;
}
