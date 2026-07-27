export type Language = "en" | "te";
export type InputMode = "voice" | "text";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
}

export interface Expense {
  id: string;
  user_id: string;
  item_name: string;
  amount: number;
  category_id: string | null;
  category_name?: string | null;
  expense_date: string; // YYYY-MM-DD
  raw_input: string | null;
  input_mode: InputMode;
  language: Language;
  created_at: string;
}

/** A parsed-but-unsaved line item returned by /api/expenses/text or /voice. */
export interface DraftLineItem {
  item_name: string;
  amount: number;
  category: string; // category name, matched against the user's category list
  expense_date: string; // YYYY-MM-DD, resolved server-side
  confidence: number; // 0-1, how sure the model is about this line item
}

export interface DraftParseResponse {
  transcript?: string; // present for voice
  language: Language;
  items: DraftLineItem[];
  raw_input: string;
}

export const DEFAULT_CATEGORIES = [
  "Food",
  "Groceries",
  "Pooja/Religious",
  "Fuel/Transport",
  "Utilities/Recharge",
  "Household",
  "Health",
  "Shopping",
  "Other",
] as const;
