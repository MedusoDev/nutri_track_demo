import { AppState, Entry, Food, Goals, ThemeMode } from '../types';
import { createSeedState } from '../data/seed';
import { toDateKey } from '../utils/date';
import { Profile } from '../utils/plan';

const today = () => toDateKey(new Date());

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'addEntry'; entry: Entry }
  | {
      type: 'updateEntry';
      id: string;
      changes: Partial<Pick<Entry, 'servings' | 'meal'>>;
    }
  | { type: 'removeEntry'; id: string }
  | { type: 'addFood'; food: Food }
  | { type: 'removeFood'; id: string }
  | { type: 'toggleFavorite'; id: string }
  | { type: 'setWater'; date: string; glasses: number }
  | { type: 'updateGoals'; goals: Goals }
  | { type: 'setTheme'; theme: ThemeMode }
  | { type: 'setName'; name: string }
  | {
      type: 'completeOnboarding';
      profile: Profile;
      goals: Goals;
      hasAccount: boolean;
    }
  | { type: 'updateProfile'; profile: Profile; goals: Goals }
  | { type: 'logIn' }
  | { type: 'createAccount' }
  | { type: 'addEntries'; entries: Entry[] }
  | { type: 'setWeight'; date: string; kg: number }
  | { type: 'setUnits'; units: 'kg' | 'lb' }
  | { type: 'toggleReminder'; id: string }
  | { type: 'newUser'; today: string }
  | {
      type: 'loadDemo';
      entries: Entry[];
      water: Record<string, number>;
      weights: Record<string, number>;
      ownFoods: Food[];
      favorites: string[];
    }
  | { type: 'reset'; state: AppState };

// Pure function: same state + action always gives the same new state.
// That makes every rule of the app easy to unit test.
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
    case 'reset':
      return action.state;

    case 'addEntry':
      return { ...state, entries: [...state.entries, action.entry] };

    case 'updateEntry':
      return {
        ...state,
        entries: state.entries.map(entry =>
          entry.id === action.id ? { ...entry, ...action.changes } : entry,
        ),
      };

    case 'removeEntry':
      return {
        ...state,
        entries: state.entries.filter(entry => entry.id !== action.id),
      };

    case 'addFood':
      return { ...state, foods: [action.food, ...state.foods] };

    case 'removeFood':
      return {
        ...state,
        foods: state.foods.filter(food => food.id !== action.id),
        favorites: state.favorites.filter(id => id !== action.id),
      };

    case 'toggleFavorite': {
      const isFavorite = state.favorites.includes(action.id);
      return {
        ...state,
        favorites: isFavorite
          ? state.favorites.filter(id => id !== action.id)
          : [...state.favorites, action.id],
      };
    }

    case 'setWater':
      return {
        ...state,
        water: { ...state.water, [action.date]: Math.max(0, action.glasses) },
      };

    case 'updateGoals':
      return { ...state, goals: action.goals };

    case 'setTheme':
      return { ...state, theme: action.theme };

    case 'setName':
      return { ...state, name: action.name };

    // The targets calculated in the onboarding feed the Today screen.
    case 'completeOnboarding':
      return {
        ...state,
        onboarded: true,
        profile: action.profile,
        goals: action.goals,
        hasAccount: action.hasAccount,
        // the onboarding weight is the first point of the weight chart
        weights: {
          ...state.weights,
          [today()]: Math.round(action.profile.weightKg * 10) / 10,
        },
      };

    // Editing the profile in Settings recalculates the targets.
    case 'updateProfile':
      return { ...state, profile: action.profile, goals: action.goals };

    case 'logIn':
      return { ...state, onboarded: true, hasAccount: true };

    case 'createAccount':
      return { ...state, hasAccount: true };

    case 'addEntries':
      return { ...state, entries: [...state.entries, ...action.entries] };

    case 'setWeight':
      return {
        ...state,
        weights: { ...state.weights, [action.date]: action.kg },
      };

    case 'setUnits':
      return { ...state, units: action.units };

    // Replaces the log with the 2-month demo history (Settings > Data).
    case 'loadDemo':
      return {
        ...state,
        entries: action.entries,
        water: action.water,
        weights: action.weights,
        foods: [
          ...state.foods.filter(f => !action.ownFoods.some(o => o.id === f.id)),
          ...action.ownFoods,
        ],
        favorites: action.favorites,
      };

    // "Day 1" demo: keeps the plan from the onboarding, but nothing logged yet,
    // the stock food list and only the onboarding weight.
    case 'newUser': {
      const fresh = createSeedState(action.today);
      return {
        ...state,
        entries: [],
        water: {},
        foods: fresh.foods,
        favorites: fresh.favorites,
        weights: state.profile
          ? { [action.today]: Math.round(state.profile.weightKg * 10) / 10 }
          : {},
      };
    }

    case 'toggleReminder':
      return {
        ...state,
        reminders: state.reminders.map(r =>
          r.id === action.id ? { ...r, on: !r.on } : r,
        ),
      };

    default:
      return state;
  }
}
