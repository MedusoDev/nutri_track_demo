import { AppState } from '../types';
import { FOODS } from './foods';

// Same as the onboarding example (M, 29, 178 cm, 76 kg, lightly active, maintain).
export const DEFAULT_GOALS = {
  calories: 2400,
  protein: 150,
  carbs: 270,
  fat: 80,
  water: 10, // 250 ml glasses = 2.5 L
};

/**
 * First launch: no foods logged and no water yet. The onboarding then sets the goals,
 * so the user sees the app work from a blank day with their own target.
 */
export function createSeedState(_today: string): AppState {
  return {
    onboarded: false,
    profile: null,
    entries: [],
    foods: FOODS,
    favorites: [], // a new user has not picked any yet
    water: {},
    goals: DEFAULT_GOALS,
    theme: 'light',
    name: 'Gabriel',
    weights: {},
    units: 'kg',
    reminders: [
      {
        id: 'breakfast',
        label: 'Log breakfast',
        schedule: 'Every day · 08:00',
        on: true,
      },
      {
        id: 'lunch',
        label: 'Log lunch',
        schedule: 'Every day · 12:30',
        on: true,
      },
      {
        id: 'dinner',
        label: 'Log dinner',
        schedule: 'Every day · 19:30',
        on: false,
      },
      {
        id: 'water',
        label: 'Drink water',
        schedule: 'Every 2 hours · 09:00–19:00',
        on: true,
      },
    ],
    hasAccount: false,
  };
}
