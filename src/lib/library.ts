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
    const parsed = JSON.parse(raw) as LibraryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLibraryItem(item: LibraryItem): LibraryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const items = getLibraryItems();
    const next = [
      { ...item, source: 'emate', createdAt: item.createdAt || new Date().toISOString() },
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
