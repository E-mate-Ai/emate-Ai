export type RecallRating = 'again' | 'hard' | 'good' | 'easy';

export type FlashcardDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type FlashcardLearningMode =
  | 'definitions'
  | 'conceptual'
  | 'exam_revision'
  | 'visual_learning'
  | 'mnemonics';

export interface EducationalImage {
  url: string;
  alt: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  attribution?: string;
  width?: number;
  height?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  example?: string;
  imageQuery: string;
  image?: EducationalImage;
  tags: string[];
  difficulty: FlashcardDifficulty;
  scientificName?: string;
  categoryPill?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  topic: string;
  subject: string;
  difficulty: FlashcardDifficulty;
  learningMode: FlashcardLearningMode;
  cards: Flashcard[];
  cardCount: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface CardReviewRecord {
  rating: RecallRating;
  reviewedAt: string;
  reviewCount: number;
}

export interface DeckProgress {
  deckId: string;
  cardRatings: Record<string, CardReviewRecord>;
  bookmarkedCardIds: string[];
  cardsStudied: number;
  isCompleted: boolean;
  lastReviewedAt: string;
}

export interface FlashcardGenerationRequest {
  topic: string;
  subject?: string;
  count?: number;
  difficulty?: FlashcardDifficulty;
  learningMode?: FlashcardLearningMode;
  studyMaterial?: string;
  examDate?: string;
  userApiKey?: string;
}
