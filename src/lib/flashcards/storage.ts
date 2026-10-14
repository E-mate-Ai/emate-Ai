import type {
  FlashcardDeck,
  DeckProgress,
  RecallRating,
  CardReviewRecord,
} from './types';

const DECKS_STORAGE_KEY = 'emate_flashcard_decks_v1';
const PROGRESS_STORAGE_KEY = 'emate_flashcard_progress_v1';

/**
 * High-quality starter decks matching the prompt and reference image.
 * This guarantees the user can immediately experience the editorial visual cards!
 */
export const STARTER_DECKS: FlashcardDeck[] = [
  {
    id: 'starter_pharmacognosy_plants',
    title: 'Medicinal Plants & Natural Compounds',
    topic: 'Medicinal Plants & Botany',
    subject: 'Pharmacognosy',
    difficulty: 'intermediate',
    learningMode: 'visual_learning',
    cardCount: 6,
    thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_%28Plate_62%29_%287118329189%29.jpg/960px-K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_%28Plate_62%29_%287118329189%29.jpg',
    createdAt: '2026-10-14T10:00:00.000Z',
    updatedAt: '2026-10-14T10:00:00.000Z',
    cards: [
      {
        id: 'card_starter_1',
        front: 'Which common garden biennial yields potent cardiac glycosides used for arrhythmias and heart failure?',
        back: 'Foxglove (Digitalis purpurea)',
        scientificName: 'Digitalis purpurea',
        categoryPill: 'Botany & Pharmacology',
        explanation: 'Foxglove leaves contain digitalis glycosides (notably digitoxin and digoxin) that inhibit the Na+/K+-ATPase pump, increasing intracellular calcium and cardiac contractility.',
        example: 'Used clinically to formulate digoxin for congestive heart failure and atrial fibrillation.',
        imageQuery: 'Digitalis purpurea botanical plate Köhler illustration',
        image: {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_%28Plate_62%29_%287118329189%29.jpg/960px-K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_%28Plate_62%29_%287118329189%29.jpg',
          alt: 'Digitalis purpurea botanical illustration from Köhler Medizinal-Pflanzen',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_(Plate_62)_(7118329189).jpg',
          license: 'CC BY-SA 2.0 / Public Domain',
          attribution: 'Köhler’s Medizinal-Pflanzen (Biodiversity Heritage Library)',
        },
        tags: ['botany', 'cardiac', 'pharmacognosy'],
        difficulty: 'intermediate',
      },
      {
        id: 'card_starter_2',
        front: 'Which alkaloid isolated from willow bark (Salix alba) served as the historic precursor to modern aspirin?',
        back: 'Salicin (metabolized to Salicylic acid)',
        scientificName: 'Salix alba',
        categoryPill: 'Natural Analgesics',
        explanation: 'Willow bark contains salicin, an alcoholic β-glucoside. In 1897, Bayer chemist Felix Hoffmann synthesized acetylsalicylic acid to reduce gastric irritation while preserving antipyretic properties.',
        example: 'Chewing willow bark was used by Hippocrates in 400 BCE for fever and childbirth pain.',
        imageQuery: 'Salix alba willow bark botanical illustration Köhler',
        image: {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Modell_von_Salix_alba_%28Silber-Weide%29_-Brendel_Nr.19-.jpg/960px-Modell_von_Salix_alba_%28Silber-Weide%29_-Brendel_Nr.19-.jpg',
          alt: 'Salix alba white willow botanical drawing',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Modell_von_Salix_alba_(Silber-Weide)_-Brendel_Nr.19-.jpg',
          license: 'CC BY-SA 3.0 / Public Domain',
          attribution: 'Botanical Museum Collection (Salix alba)',
        },
        tags: ['pharmacology', 'willow', 'salicin'],
        difficulty: 'intermediate',
      },
      {
        id: 'card_starter_3',
        front: 'Which anti-malarial sesquiterpene lactone was discovered in Sweet Wormwood (Artemisia annua)?',
        back: 'Artemisinin (Qinghaosu)',
        scientificName: 'Artemisia annua',
        categoryPill: 'Antiparasitic',
        explanation: 'Discovered by Nobel laureate Tu Youyou via ancient Chinese medical texts, artemisinin features an unusual endoperoxide bridge that generates free radicals upon cleavage by heme in Plasmodium.',
        example: 'Forms the basis of WHO-recommended Artemisinin-based Combination Therapies (ACTs).',
        imageQuery: 'Artemisia annua plant botanical drawing',
        image: {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Artemisia_annua_kz05.jpg/960px-Artemisia_annua_kz05.jpg',
          alt: 'Artemisia annua botanical plate',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Artemisia_annua_kz05.jpg',
          license: 'CC BY-SA 4.0',
          attribution: 'Wikimedia Commons Contributors',
        },
        tags: ['malaria', 'artemisinin', 'nobel-prize'],
        difficulty: 'advanced',
      },
      {
        id: 'card_starter_4',
        front: 'Which tropical shrub produces reserpine, one of the earliest modern antipsychotic and antihypertensive drugs?',
        back: 'Indian Snakeroot (Rauvolfia serpentina)',
        scientificName: 'Rauvolfia serpentina',
        categoryPill: 'Alkaloid & CNS',
        explanation: 'Rauvolfia serpentina contains indole alkaloids that irreversibly block the vesicular monoamine transporter (VMAT), depleting dopamine, serotonin, and norepinephrine.',
        example: 'Used for millennia in Ayurvedic medicine for snakebites, fever, and insanity ("pagal-ki-dawa").',
        imageQuery: 'Rauvolfia serpentina botanical illustration',
        image: {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Rauvolfia_serpentina_002.JPG/960px-Rauvolfia_serpentina_002.JPG',
          alt: 'Rauvolfia serpentina illustration',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rauvolfia_serpentina_002.JPG',
          license: 'CC BY-SA 3.0',
          attribution: 'Wikimedia Commons Contributors',
        },
        tags: ['ayurveda', 'neuroscience', 'alkaloids'],
        difficulty: 'advanced',
      },
      {
        id: 'card_starter_5',
        front: 'Which flowering evergreen tree native to the Moluccas produces Eugenol with dental antiseptic properties?',
        back: 'Clove Tree (Syzygium aromaticum)',
        scientificName: 'Syzygium aromaticum',
        categoryPill: 'Essential Oils',
        explanation: 'Clove oil consists of 70–90% eugenol, an allyl chain-substituted guaiacol that acts as a local anesthetic, anti-inflammatory, and antimicrobial agent in endodontic procedures.',
        example: 'Mixed with zinc oxide to form zinc oxide eugenol (ZOE) for temporary dental restorations.',
        imageQuery: 'Syzygium aromaticum clove botanical illustration',
        image: {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Clove_plant_%28Syzygium_aromaticum%29%3B_stem_with_flower_buds._Wa_Wellcome_V0043507.jpg/960px-Clove_plant_%28Syzygium_aromaticum%29%3B_stem_with_flower_buds._Wa_Wellcome_V0043507.jpg',
          alt: 'Clove plant (Syzygium aromaticum) stem with flower buds',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Clove_plant_(Syzygium_aromaticum);_stem_with_flower_buds._Wa_Wellcome_V0043507.jpg',
          license: 'CC BY 4.0 / Wellcome Collection',
          attribution: 'Wellcome Collection (Syzygium aromaticum)',
        },
        tags: ['dentistry', 'eugenol', 'botany'],
        difficulty: 'beginner',
      },
      {
        id: 'card_starter_6',
        front: 'What tropane alkaloid derived from Deadly Nightshade (Atropa belladonna) acts as a competitive antagonist of muscarinic acetylcholine receptors?',
        back: 'Atropine',
        scientificName: 'Atropa belladonna',
        categoryPill: 'Anticholinergic',
        explanation: 'Atropine reversibly blocks muscarinic receptors (M1–M5), leading to pupil dilation (mydriasis), tachycardia, reduced glandular secretions, and bronchodilation.',
        example: 'Administered as an emergency antidote for organophosphate poisoning and nerve agent exposure.',
        imageQuery: 'Atropa belladonna deadly nightshade illustration Köhler',
        image: {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Atropa_belladonna_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-018.jpg/960px-Atropa_belladonna_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-018.jpg',
          alt: 'Atropa belladonna deadly nightshade botanical plate',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Atropa_belladonna_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-018.jpg',
          license: 'Public domain',
          attribution: 'Köhler’s Medizinal-Pflanzen (1887)',
        },
        tags: ['toxicology', 'atropine', 'pharmacology'],
        difficulty: 'intermediate',
      },
    ],
  },
  {
    id: 'starter_cs_linked_lists',
    title: 'Data Structures: Linked Lists & Pointers',
    topic: 'Data Structures: Linked Lists',
    subject: 'Computer Science',
    difficulty: 'intermediate',
    learningMode: 'conceptual',
    cardCount: 5,
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Singly-linked-list.svg/800px-Singly-linked-list.svg.png',
    createdAt: '2026-10-14T10:00:00.000Z',
    updatedAt: '2026-10-14T10:00:00.000Z',
    cards: [
      {
        id: 'card_cs_1',
        front: 'What is the fundamental difference in memory allocation between an Array and a Linked List?',
        back: 'Contiguous vs. Non-contiguous dynamic heap allocation',
        scientificName: 'Memory Layout & Cache Locality',
        categoryPill: 'Core Architecture',
        explanation: 'Arrays require a single contiguous block of memory and offer O(1) random indexing with high CPU cache locality. Linked list nodes reside anywhere on the heap and store explicit pointer addresses, trading cache locality for dynamic size.',
        example: 'Array elements: memory address = base + (index * size). Linked list: node->next.',
        imageQuery: 'Singly linked list node structure diagram computer science',
        image: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Singly-linked-list.svg/800px-Singly-linked-list.svg.png',
          alt: 'Singly linked list pointer schema',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Singly-linked-list.svg',
          license: 'Public domain',
          attribution: 'Wikimedia Commons Contributors',
        },
        tags: ['dsa', 'memory', 'pointers'],
        difficulty: 'beginner',
      },
      {
        id: 'card_cs_2',
        front: 'What is the time complexity of prepending a node to the head of a Singly Linked List vs. inserting at the start of an Array?',
        back: 'O(1) in Linked List vs. O(n) in Array',
        scientificName: 'Time Complexity Analysis',
        categoryPill: 'Algorithmic Complexity',
        explanation: 'In a linked list, prepending simply requires creating a new node, setting its next pointer to the current head, and updating head to point to the new node. In an array, all existing n elements must be shifted forward by 1 index.',
        example: 'newNode->next = head; head = newNode; // Exactly 2 pointer assignments.',
        imageQuery: 'linked list insertion at head diagram',
        image: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/CPT-LinkedLists-addingnode.svg/800px-CPT-LinkedLists-addingnode.svg.png',
          alt: 'Inserting a node in a linked list diagram',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:CPT-LinkedLists-addingnode.svg',
          license: 'CC BY-SA 3.0',
          attribution: 'Wikimedia Commons Contributors',
        },
        tags: ['time-complexity', 'linked-list', 'dsa'],
        difficulty: 'beginner',
      },
      {
        id: 'card_cs_3',
        front: 'How does Floyd\'s Cycle-Finding Algorithm (Tortoise and Hare) detect a loop in a linked list in O(n) time and O(1) space?',
        back: 'Two pointers moving at speeds 1x and 2x',
        scientificName: 'Floyd\'s Cycle Detection',
        categoryPill: 'Classic Algorithm',
        explanation: 'A slow pointer moves 1 step while a fast pointer moves 2 steps. If a loop exists, the fast pointer will eventually wrap around inside the loop and collide with the slow pointer. If fast reaches null, no cycle exists.',
        example: 'Relative velocity between pointers inside a loop of length L is 1 step per iteration.',
        imageQuery: 'Floyd cycle detection algorithm linked list',
        tags: ['algorithms', 'pointers', 'interview-prep'],
        difficulty: 'intermediate',
      },
      {
        id: 'card_cs_4',
        front: 'What extra storage trade-off is required for a Doubly Linked List over a Singly Linked List?',
        back: 'One extra pointer (prev) per node',
        scientificName: 'Doubly Linked List Structure',
        categoryPill: 'Data Representation',
        explanation: 'Each node maintains two references: next and prev. This allows O(1) backward traversal and O(1) node deletion given a pointer to that node, at the cost of 4 to 8 additional bytes per node.',
        example: 'Used in LRU Caches (combined with Hash Maps) and browser history navigation.',
        imageQuery: 'doubly linked list diagram computer science',
        image: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Doubly-linked-list.svg/800px-Doubly-linked-list.svg.png',
          alt: 'Doubly linked list diagram showing prev and next pointers',
          sourceName: 'Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Doubly-linked-list.svg',
          license: 'Public domain',
          attribution: 'Wikimedia Commons Contributors',
        },
        tags: ['doubly-linked-list', 'pointers'],
        difficulty: 'intermediate',
      },
      {
        id: 'card_cs_5',
        front: 'How do you reverse a Singly Linked List in place in a single pass?',
        back: 'Iterate with 3 pointers: prev, current, next',
        scientificName: 'In-Place Pointer Reversal',
        categoryPill: 'Implementation',
        explanation: 'At each node, store current->next in a temporary variable, reassign current->next = prev, advance prev = current, and move current = next. When current becomes null, prev is the new head.',
        example: 'Time Complexity: O(n), Space Complexity: O(1) auxiliary space.',
        imageQuery: 'reversing a linked list pointers diagram',
        tags: ['interview-prep', 'recursion', 'iteration'],
        difficulty: 'intermediate',
      },
    ],
  },
];

/** Retrieve all local decks, seeding starter decks on first visit and repairing broken legacy image URLs */
export function getLocalDecks(): FlashcardDeck[] {
  if (typeof window === 'undefined') return STARTER_DECKS;
  try {
    const raw = localStorage.getItem(DECKS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(STARTER_DECKS));
      return STARTER_DECKS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(STARTER_DECKS));
      return STARTER_DECKS;
    }

    // Auto-migrate legacy decks that contain broken Köhler-s URLs
    let needsUpdate = false;
    const starterMap = new Map(
      STARTER_DECKS.flatMap((d) => d.cards.map((c) => [c.id, c.image]))
    );

    const healedDecks = parsed.map((deck: FlashcardDeck) => {
      const updatedCards = deck.cards.map((card) => {
        if (card.image?.url && (card.image.url.includes('Köhler–s') || card.image.url.includes('K%C3%B6hler%E2%80%93s'))) {
          const validImage = starterMap.get(card.id);
          if (validImage) {
            needsUpdate = true;
            return { ...card, image: validImage };
          }
        }
        return card;
      });

      let updatedThumb = deck.thumbnailUrl;
      if (updatedThumb && (updatedThumb.includes('Köhler–s') || updatedThumb.includes('K%C3%B6hler%E2%80%93s'))) {
        const starterMatch = STARTER_DECKS.find((s) => s.id === deck.id);
        if (starterMatch?.thumbnailUrl) {
          updatedThumb = starterMatch.thumbnailUrl;
          needsUpdate = true;
        }
      }

      return {
        ...deck,
        thumbnailUrl: updatedThumb,
        cards: updatedCards,
      };
    });

    if (needsUpdate) {
      localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(healedDecks));
      return healedDecks;
    }

    return parsed;
  } catch (e) {
    console.warn('[flashcards/storage] Error reading local decks:', e);
    return STARTER_DECKS;
  }
}

/** Update a single card's educational image and persist */
export function updateCardImage(
  deckId: string,
  cardId: string,
  image: import('./types').EducationalImage
): FlashcardDeck | null {
  if (typeof window === 'undefined') return null;
  try {
    const decks = getLocalDecks();
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return null;

    const updatedCards = deck.cards.map((c) => (c.id === cardId ? { ...c, image } : c));
    const updatedDeck: FlashcardDeck = {
      ...deck,
      cards: updatedCards,
      updatedAt: new Date().toISOString(),
    };

    saveLocalDeck(updatedDeck);
    return updatedDeck;
  } catch (e) {
    console.error('[flashcards/storage] Error updating card image:', e);
    return null;
  }
}

/** Save or update a deck locally and silently sync to cloud if user is signed in */
export function saveLocalDeck(deck: FlashcardDeck): void {
  if (typeof window === 'undefined') return;
  try {
    const currentDecks = getLocalDecks();
    const existingIdx = currentDecks.findIndex((d) => d.id === deck.id);
    const updated = [...currentDecks];

    if (existingIdx >= 0) {
      updated[existingIdx] = { ...deck, updatedAt: new Date().toISOString() };
    } else {
      updated.unshift({ ...deck, updatedAt: new Date().toISOString() });
    }

    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('emate-flashcards-changed', { detail: { deckId: deck.id } }));

    // Background sync to cloud if authenticated
    fetch('/api/flashcards/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deck),
    }).catch(() => {
      // Offline / guest mode is fine
    });
  } catch (e) {
    console.error('[flashcards/storage] Error saving deck:', e);
  }
}

/** Delete a deck locally and from cloud */
export function deleteLocalDeck(deckId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalDecks().filter((d) => d.id !== deckId);
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('emate-flashcards-changed', { detail: { deckId } }));

    fetch(`/api/flashcards/decks/${deckId}`, { method: 'DELETE' }).catch(() => {});
  } catch (e) {
    console.error('[flashcards/storage] Error deleting deck:', e);
  }
}

/** Get review progress for a deck */
export function getDeckProgress(deckId: string): DeckProgress {
  const fallback: DeckProgress = {
    deckId,
    cardRatings: {},
    bookmarkedCardIds: [],
    cardsStudied: 0,
    isCompleted: false,
    lastReviewedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`${PROGRESS_STORAGE_KEY}_${deckId}`);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Save review progress locally and sync to cloud */
export function saveDeckProgress(progress: DeckProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${PROGRESS_STORAGE_KEY}_${progress.deckId}`,
      JSON.stringify(progress)
    );
    window.dispatchEvent(
      new CustomEvent('emate-flashcard-progress-changed', { detail: { deckId: progress.deckId } })
    );

    fetch('/api/flashcards/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    }).catch(() => {});
  } catch (e) {
    console.error('[flashcards/storage] Error saving progress:', e);
  }
}

/** Record a recall rating for a card */
export function recordCardRating(
  deck: FlashcardDeck,
  cardId: string,
  rating: RecallRating
): DeckProgress {
  const current = getDeckProgress(deck.id);
  const prevRecord = current.cardRatings[cardId];
  const count = (prevRecord?.reviewCount || 0) + 1;

  const newRecord: CardReviewRecord = {
    rating,
    reviewedAt: new Date().toISOString(),
    reviewCount: count,
  };

  const updatedRatings = {
    ...current.cardRatings,
    [cardId]: newRecord,
  };

  const cardsStudied = Object.keys(updatedRatings).length;
  const isCompleted = cardsStudied >= deck.cards.length;

  const updatedProgress: DeckProgress = {
    ...current,
    cardRatings: updatedRatings,
    cardsStudied,
    isCompleted,
    lastReviewedAt: new Date().toISOString(),
  };

  saveDeckProgress(updatedProgress);
  return updatedProgress;
}

/** Toggle bookmark for a card */
export function toggleBookmarkCard(deckId: string, cardId: string): boolean {
  const current = getDeckProgress(deckId);
  const exists = current.bookmarkedCardIds.includes(cardId);
  const updatedBookmarks = exists
    ? current.bookmarkedCardIds.filter((id) => id !== cardId)
    : [...current.bookmarkedCardIds, cardId];

  saveDeckProgress({
    ...current,
    bookmarkedCardIds: updatedBookmarks,
  });

  return !exists;
}
