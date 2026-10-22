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
import { AppState } from '../types';
import { toDateKey } from '../utils/date';
import { Action, reducer } from './reducer';

const STORAGE_KEY = 'nutritrack:v3'; // v3 = starts empty, goals come from the onboarding

interface ContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  today: string;
  ready: boolean;
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
          dispatch({ type: 'hydrate', state: JSON.parse(saved) });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // 2. After loading, save every change so data survives closing the app.
  useEffect(() => {
    if (ready) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }
  }, [state, ready]);

  const value = useMemo(() => ({ state, dispatch, today, ready }), [state, today, ready]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): ContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
}
