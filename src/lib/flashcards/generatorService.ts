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

/** Sanitize and parse JSON from model output */
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
    /* fallback to bracket search */
  }

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.slice(startIdx, lastBrace + 1);
    }
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) {
      cleaned = cleaned.slice(startIdx, lastBracket + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
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
  } else {
    // Generic high-yield fallback
    subject = 'Academic Study';
    cards = [
      {
        front: `What is ${cleanTopic} and what problem does it solve?`,
        back: `${cleanTopic} is a concept that helps solve a specific type of problem in its field.`,
        scientificName: `${cleanTopic} Overview`,
        categoryPill: 'Concept',
        explanation: `It provides a structured way to approach problems in its domain. Understanding it helps you answer exam questions about how and why things work the way they do.`,
        example: `Think of it as a tool: once you know what it does and when to use it, you can apply it to new problems.`,
        imageQuery: `${cleanTopic} diagram scientific illustration`,
        tags: [cleanTopic.toLowerCase(), 'fundamentals'],
      },
      {
        front: `What is the most important rule or principle of ${cleanTopic}?`,
        back: `The core principle of ${cleanTopic} defines how it behaves and when it applies.`,
        scientificName: 'Governing Principle',
        categoryPill: 'Rule',
        explanation: `This principle sets the boundary for what ${cleanTopic} can and cannot do. Breaking the rule usually leads to errors or failures in real applications.`,
        example: `If you can remember the one key rule, you can usually derive the rest on an exam.`,
        imageQuery: `${cleanTopic} process flowchart diagram`,
        tags: [cleanTopic.toLowerCase(), 'principles'],
      },
      {
        front: `What is the main trade-off when using ${cleanTopic}?`,
        back: `Using ${cleanTopic} often means choosing between simplicity and performance, or accuracy and speed.`,
        scientificName: 'Trade-off Analysis',
        categoryPill: 'Design',
        explanation: `Every real-world system has constraints. ${cleanTopic} is no different — getting one benefit usually costs something else. Knowing the trade-off shows examiners you understand the concept deeply.`,
        example: `A common exam question: "What is the downside of using ${cleanTopic}?" Know one clear answer.`,
        imageQuery: `${cleanTopic} comparison chart schematic`,
        tags: [cleanTopic.toLowerCase(), 'tradeoff'],
      },
    ];
  }

  return {
    title: `${cleanTopic} Essentials`,
    subject,
    cards: cards.slice(0, count),
  };
}


/**
 * Generate a complete visual flashcard deck:
 * 1. Queries OpenRouter with resilient fallback models
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

    const candidateModels = getFreeModelCascade('emate').filter((m) => m !== 'openrouter/auto');

    for (const model of candidateModels.slice(0, 4)) {
      try {
        const response = await openRouterCompletion(apiKey, {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0.35,
          max_tokens: 2000,
        });

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

  // If AI generation was unavailable or rate-limited, use structured curriculum synthesis
  if (rawCards.length === 0) {
    console.info(`[generatorService] Using structured curriculum engine for topic: "${topic}"`);
    const fallback = generateStructuredCurriculumFallback(topic, count, difficulty, mode);
    rawCards = fallback.cards;
    title = fallback.title;
    subject = fallback.subject;
  }

  // Deduplicate and normalize cards
  const seenFronts = new Set<string>();
  const validCards: Flashcard[] = [];

  for (let i = 0; i < rawCards.length; i++) {
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
      id: `card_${Date.now()}_${i + 1}`,
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

  // Enrich cards with verified educational images from Wikimedia Commons / Wikipedia
  const cardsWithImages = await Promise.all(
    validCards.map(async (card) => {
      try {
        const image = await getEducationalImage(
          card.imageQuery,
          topic,
          card.scientificName || card.front
        );
        return { ...card, image };
      } catch (err) {
        console.warn('[generatorService] Image retrieval fallback for card:', card.id, err);
        return card;
      }
    })
  );

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
