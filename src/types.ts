export type MacroKey = 'protein' | 'carbs' | 'fat';

export interface Macro {
  key: MacroKey;
  label: string;
  consumed: number;
  goal: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  description: string;
  calories: number;
}

export type TabKey = 'today' | 'history' | 'foods' | 'settings';

export interface Tab {
  key: TabKey;
  label: string;
}
