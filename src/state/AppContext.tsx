import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { createSeedState } from '../data/seed';
import { FOODS } from '../data/foods';
import { AppState, Food } from '../types';
import { toDateKey } from '../utils/date';
import { Action, reducer } from './reducer';

const STORAGE_KEY = 'nutritrack:v4'; // v4 = foods with grams, weights, reminders (sections 04-09)

interface ContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  today: string;
  ready: boolean;
}

/**
 * Built-in foods always come from the current list (data/foods.ts); the user's own foods
 * are kept, and any saved food without grams gets them from its serving text.
 */
function migrate(state: AppState): AppState {
  const builtIn = new Set(FOODS.map(f => f.id));
  const own = state.foods.filter(f => f.custom && !builtIn.has(f.id));
  const grams = (f: Food) => f.servingGrams || parseFloat(f.serving) || 100;
  return {
    ...state,
    foods: [...FOODS, ...own.map(f => ({ ...f, servingGrams: grams(f) }))],
    entries: state.entries.map(e => ({
      ...e,
      food: { ...e.food, servingGrams: grams(e.food) },
    })),
  };
}

const AppContext = createContext<ContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const today = toDateKey(new Date());
  const [state, dispatch] = useReducer(reducer, today, createSeedState);
  const [ready, setReady] = useState(false);

  // 1. On startup, load saved data. First launch keeps the seed data.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved) {
          // Fields added in later versions get their default value.
          dispatch({
            type: 'hydrate',
            state: migrate({ ...createSeedState(today), ...JSON.parse(saved) }),
          });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [today]);

  // 2. After loading, save changes so data survives closing the app. Saving waits until the
  //    700 ms animations are done: stringifying months of history mid-animation made it stutter.
  useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [state, ready]);

  const value = useMemo(
    () => ({ state, dispatch, today, ready }),
    [state, today, ready],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): ContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
}
