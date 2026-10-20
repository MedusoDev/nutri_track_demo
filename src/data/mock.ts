import { Macro, Meal, Tab } from '../types';

export const DAILY_CALORIE_GOAL = 2500;

export const MACROS: Macro[] = [
  { key: 'protein', label: 'Protein', consumed: 45, goal: 120 },
  { key: 'carbs', label: 'Carbs', consumed: 90, goal: 250 },
  { key: 'fat', label: 'Fat', consumed: 20, goal: 65 },
];

export const MEALS: Meal[] = [
  {
    id: '1',
    name: 'Breakfast',
    time: '08:00',
    description: 'Oatmeal, banana, coffee',
    calories: 380,
  },
  {
    id: '2',
    name: 'Lunch',
    time: '12:30',
    description: 'Chicken, rice, salad',
    calories: 450,
  },
];

export const TABS: Tab[] = [
  { key: 'today', label: 'TODAY' },
  { key: 'history', label: 'HISTORY' },
  { key: 'foods', label: 'FOODS' },
  { key: 'settings', label: 'SETTINGS' },
];
