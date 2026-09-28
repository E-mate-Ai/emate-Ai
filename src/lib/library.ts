export type LibraryItemType = 'image' | 'document' | 'note';

export interface LibraryItem {
  id: string;
  title: string;
  type: LibraryItemType;
  description?: string;
  createdAt: string;
  url?: string;
  content?: string;
  mimeType?: string;
  fileName?: string;
  source: 'emate';
}

const STORAGE_KEY = 'nk-library-items';
const MAX_ITEMS = 60;

export function getLibraryItems(): LibraryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is LibraryItem => {
      if (!entry || typeof entry !== 'object') return false;

      const item = entry as Record<string, unknown>;
      return (
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        (item.type === 'image' || item.type === 'document' || item.type === 'note') &&
        typeof item.createdAt === 'string' &&
        (item.source === 'emate' || item.source === undefined)
      );
    }) as LibraryItem[];
  } catch {
    return [];
  }
}

export function saveLibraryItem(item: LibraryItem): LibraryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const items = getLibraryItems();
    const normalizedItem: LibraryItem = {
      ...item,
      source: 'emate' as const,
      createdAt: item.createdAt || new Date().toISOString(),
    };

    const next: LibraryItem[] = [
      normalizedItem,
      ...items.filter((entry) => entry.id !== item.id),
    ].slice(0, MAX_ITEMS);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('nk-library-change', { detail: { item } }));
    return next;
  } catch {
    return getLibraryItems();
  }
}

export function removeLibraryItem(id: string): LibraryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const next = getLibraryItems().filter((entry) => entry.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('nk-library-change', { detail: { id } }));
    return next;
  } catch {
    return getLibraryItems();
  }
}

export function addGeneratedAsset({
  title,
  type,
  description,
  url,
  content,
  mimeType,
  fileName,
}: {
  title: string;
  type: LibraryItemType;
  description?: string;
  url?: string;
  content?: string;
  mimeType?: string;
  fileName?: string;
}): LibraryItem {
  const item: LibraryItem = {
    id: `library-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim() || 'Untitled e-Mate asset',
    type,
    description,
    createdAt: new Date().toISOString(),
    url,
    content,
    mimeType,
    fileName,
    source: 'emate',
  };

  saveLibraryItem(item);
  return item;
}
