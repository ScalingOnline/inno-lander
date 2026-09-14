export const RESEARCHER_TOKEN_HEADER = 'X-Inno-Researcher-Token';
export const RESEARCHER_STORAGE_KEY = 'inno-researcher-receipt-v1';
export const RESEARCHER_MAX_AGE = 30 * 24 * 60 * 60;

export type ResearcherReceipt = {
  token: string;
  expiresAt: number;
};
