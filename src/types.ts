import { Profile } from './utils/plan';

export type MacroKey = 'protein' | 'carbs' | 'fat';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodCategory = 'protein' | 'grains' | 'fruits' | 'veggies' | 'dairy' | 'snacks';

/** Nutrition values for ONE serving of a food. */
export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Food extends Nutrition {
  id: string;
  name: string;
  emoji: string;
  serving: string; // e.g. "100 g", "1 cup"
  category: FoodCategory;
  custom?: boolean;
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

export type ThemeMode = 'dark' | 'light';

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
}

export type TabKey = 'today' | 'history' | 'foods' | 'settings';
