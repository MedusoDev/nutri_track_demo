// Small stack navigator for the screens that open over the tabs.
import { createContext, useContext } from 'react';
import { Entry, Food, MealType, TabKey } from '../types';

export type Route =
  | { name: 'logFood'; meal: MealType; date: string }
  | {
      name: 'foodDetail';
      food: Food;
      meal: MealType;
      date: string;
      /** plate = add to the Log food list · log = log right away · edit = change a logged portion */
      mode: 'plate' | 'log' | 'edit';
      entry?: Entry;
    }
  | { name: 'mealDetail'; meal: MealType; date: string }
  | { name: 'createFood' }
  | { name: 'day'; date: string }
  | { name: 'editProfile' };

/** A food waiting in the Log food list ("Your plate"), not logged yet. */
export interface PlateItem {
  key: string;
  food: Food;
  servings: number;
}

export interface Nav {
  push: (route: Route) => void;
  pop: () => void;
  openTab: (tab: TabKey) => void;
  logged: (entries: Entry[]) => void;
  deleted: (entries: Entry[], label: string) => void;
  toast: (title: string, detail?: string) => void;
  plate: PlateItem[];
  addToPlate: (food: Food, servings: number) => void;
  removeFromPlate: (key: string) => void;
}

export const NavContext = createContext<Nav | null>(null);

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) {
    throw new Error('useNav must be used inside <NavContext.Provider>');
  }
  return nav;
}
