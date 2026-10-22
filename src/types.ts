import { Profile } from './utils/plan';

export type MacroKey = 'protein' | 'carbs' | 'fat';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodCategory =
  | 'protein'
  | 'grains'
  | 'fruits'
  | 'veggies'
  | 'dairy'
  | 'snacks';

/** Nutrition values for ONE serving of a food. */
export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type ServingUnit = 'g' | 'ml' | 'unit';

/** Extra label values for ONE serving (shown in Nutrition facts when known). */
export interface Details {
  saturated?: number; // g
  fiber?: number; // g
  sugars?: number; // g
  sodium?: number; // mg
  cholesterol?: number; // mg
}

export interface Food extends Nutrition {
  id: string;
  name: string;
  emoji: string;
  serving: string; // e.g. "100 g", "1 cup"
  servingGrams: number; // grams (or ml) in one serving, so portions can be picked in grams
  category: FoodCategory;
  brand?: string;
  unit?: ServingUnit; // how the serving is measured (default g)
  details?: Details;
  custom?: boolean; // created by the user ("My own recipes")
  recipe?: boolean; // a dish from the library, suggested to try
}

/** A food the user logged on a specific day. */
export interface Entry {
  id: string;
  date: string; // "YYYY-MM-DD"
  meal: MealType;
  servings: number;
  food: Food; // snapshot, so deleting a custom food keeps history intact
  time?: string; // "HH:MM" when it was logged
}

export interface Goals extends Nutrition {
  water: number; // glasses per day
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface Reminder {
  id: string;
  label: string;
  schedule: string; // e.g. "Every day · 08:00"
  on: boolean;
}

export interface AppState {
  onboarded: boolean; // false -> Welcome / onboarding is shown
  profile: Profile | null; // onboarding answers (null when the user only logged in)
  entries: Entry[];
  foods: Food[];
  favorites: string[]; // food ids
  water: Record<string, number>; // date -> glasses
  goals: Goals;
  theme: ThemeMode;
  name: string;
  weights: Record<string, number>; // date -> kg
  units: 'kg' | 'lb';
  reminders: Reminder[];
  hasAccount: boolean; // false when the user skipped "Save your plan"
}

export type TabKey = 'today' | 'history' | 'foods' | 'settings';
