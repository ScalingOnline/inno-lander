import {RESEARCHER_STORAGE_KEY, RESEARCHER_TOKEN_HEADER, type ResearcherReceipt} from './researcher-session';

function isCurrentReceipt(value: unknown): value is ResearcherReceipt {
  if (!value || typeof value !== 'object') return false;
  const receipt = value as ResearcherReceipt;
  return typeof receipt.token === 'string' && receipt.token.length < 2048 &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(receipt.token) &&
    Number.isFinite(receipt.expiresAt) && receipt.expiresAt > Date.now();
}

// This receipt records the entry acknowledgement only. Protected API requests
// still verify its server signature and original expiry on every request.
export function readResearcherReceipt(): ResearcherReceipt | null {
  if (typeof window === 'undefined') return null;
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      const value: unknown = JSON.parse(storage.getItem(RESEARCHER_STORAGE_KEY) || 'null');
      if (isCurrentReceipt(value)) return value;
      storage.removeItem(RESEARCHER_STORAGE_KEY);
    } catch { /* Cookies or the other storage mechanism can still work. */ }
  }
  return null;
}

export function saveResearcherReceipt(receipt: unknown) {
  if (typeof window === 'undefined' || !isCurrentReceipt(receipt)) return;
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try { window[name].setItem(RESEARCHER_STORAGE_KEY, JSON.stringify(receipt)); } catch {}
  }
}

export function clearResearcherReceipt() {
  if (typeof window === 'undefined') return;
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try { window[name].removeItem(RESEARCHER_STORAGE_KEY); } catch {}
  }
}

export function researcherHeaders(initial: HeadersInit = {}): Headers {
  const headers = new Headers(initial);
  const receipt = readResearcherReceipt();
  if (receipt) headers.set(RESEARCHER_TOKEN_HEADER, receipt.token);
  return headers;
}
