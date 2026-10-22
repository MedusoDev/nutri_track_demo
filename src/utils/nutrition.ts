import { Entry, Food, MealType, Nutrition } from '../types';
import { addDays } from './date';

export const EMPTY: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Nutrition of one entry = food values x servings, rounded. */
export function entryNutrition(entry: Entry): Nutrition {
  const { food, servings } = entry;
  return {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings),
    carbs: Math.round(food.carbs * servings),
    fat: Math.round(food.fat * servings),
  };
}

export function sumNutrition(entries: Entry[]): Nutrition {
  return entries.reduce((total, entry) => {
    const n = entryNutrition(entry);
    return {
      calories: total.calories + n.calories,
      protein: total.protein + n.protein,
      carbs: total.carbs + n.carbs,
      fat: total.fat + n.fat,
    };
  }, EMPTY);
}

export function entriesOn(entries: Entry[], date: string): Entry[] {
  return entries.filter(entry => entry.date === date);
}

export function entriesByMeal(entries: Entry[], meal: MealType): Entry[] {
  return entries.filter(entry => entry.meal === meal);
}

/** Calories from macros: protein and carbs 4 kcal/g, fat 9 kcal/g. */
export function caloriesFromMacros(
  protein: number,
  carbs: number,
  fat: number,
): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

/** 0..1 progress, capped at 1. Safe for goal = 0. */
export function progress(value: number, goal: number): number {
  if (goal <= 0) {
    return 0;
  }
  return Math.min(value / goal, 1);
}

/** Meal suggested by the time of day: <10:30 breakfast, <15 lunch, <18 snack, then dinner. */
export function mealForHour(hour: number, minute = 0): MealType {
  const t = hour * 60 + minute;
  if (t < 10 * 60 + 30) {
    return 'breakfast';
  }
  if (t < 15 * 60) {
    return 'lunch';
  }
  if (t < 18 * 60) {
    return 'snack';
  }
  return 'dinner';
}

export function mealForNow(date = new Date()): MealType {
  return mealForHour(date.getHours(), date.getMinutes());
}

/** Nutrition of a food for a number of servings (not rounded, for live previews). */
export function scaled(food: Food, servings: number): Nutrition {
  return {
    calories: food.calories * servings,
    protein: food.protein * servings,
    carbs: food.carbs * servings,
    fat: food.fat * servings,
  };
}

/** Share of calories from each macro, in percent (sums to ~100). */
export function macroSplit(n: { protein: number; carbs: number; fat: number }) {
  const p = n.protein * 4;
  const c = n.carbs * 4;
  const f = n.fat * 9;
  const total = p + c + f || 1;
  return {
    protein: (p / total) * 100,
    carbs: (c / total) * 100,
    fat: (f / total) * 100,
  };
}

/** Most recently logged foods, newest first, without repeats. */
export function recentFoods(
  entries: Entry[],
  limit = 6,
): { food: Food; servings: number }[] {
  const seen = new Set<string>();
  const out: { food: Food; servings: number }[] = [];
  [...entries]
    .sort((a, b) =>
      (b.date + (b.time ?? '')).localeCompare(a.date + (a.time ?? '')),
    )
    .forEach(entry => {
      if (
        !seen.has(entry.food.id) &&
        out.length < limit &&
        entry.food.id !== 'quick'
      ) {
        seen.add(entry.food.id);
        out.push({ food: entry.food, servings: entry.servings });
      }
    });
  return out;
}

/** A "Quick add" food: only calories, one serving. */
export function quickAddFood(calories: number): Food {
  return {
    id: 'quick',
    name: 'Quick add',
    emoji: '⚡',
    serving: `${calories} kcal`,
    servingGrams: 1,
    category: 'snacks',
    calories,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
}

export type DayStatus = 'on' | 'under' | 'over' | 'missing';

/** On target = 90% to 105% of the goal; above 105% is over; nothing logged is missing. */
export function dayStatus(calories: number, goal: number): DayStatus {
  if (calories <= 0) {
    return 'missing';
  }
  if (calories > goal * 1.05) {
    return 'over';
  }
  if (calories < goal * 0.9) {
    return 'under';
  }
  return 'on';
}

/** Days in a row with at least one entry, ending today (or yesterday if today is still empty). */
export function streakDays(entries: Entry[], today: string): number {
  const logged = new Set(entries.map(entry => entry.date));
  let day = logged.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (logged.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

/** "HH:MM" of a date, used as the time of a logged food. */
export function timeOf(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

/** Moves an "HH:MM" time by some minutes, wrapping around midnight. */
export function shiftTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(
    total % 60,
  ).padStart(2, '0')}`;
}

/** Current time rounded down to 5 minutes, the default "when did you eat". */
export function nowRounded(date = new Date()): string {
  const rounded = new Date(date);
  rounded.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
  return timeOf(rounded);
}
