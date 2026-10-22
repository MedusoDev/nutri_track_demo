import { AppState, Entry, Food, Goals, ThemeMode } from '../types';
import { Profile } from '../utils/plan';

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'addEntry'; entry: Entry }
  | { type: 'updateEntry'; id: string; changes: Partial<Pick<Entry, 'servings' | 'meal'>> }
  | { type: 'removeEntry'; id: string }
  | { type: 'addFood'; food: Food }
  | { type: 'removeFood'; id: string }
  | { type: 'toggleFavorite'; id: string }
  | { type: 'setWater'; date: string; glasses: number }
  | { type: 'updateGoals'; goals: Goals }
  | { type: 'setTheme'; theme: ThemeMode }
  | { type: 'setName'; name: string }
  | { type: 'completeOnboarding'; profile: Profile; goals: Goals }
  | { type: 'logIn' }
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
      return { ...state, entries: state.entries.filter(entry => entry.id !== action.id) };

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
      return { ...state, onboarded: true, profile: action.profile, goals: action.goals };

    case 'logIn':
      return { ...state, onboarded: true };

    default:
      return state;
  }
}
