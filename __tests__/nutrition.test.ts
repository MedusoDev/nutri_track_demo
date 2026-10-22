import { FOODS } from '../src/data/foods';
import { Entry } from '../src/types';
import { addDays, lastDays } from '../src/utils/date';
import {
  caloriesFromMacros,
  entryNutrition,
  mealForHour,
  progress,
  sumNutrition,
} from '../src/utils/nutrition';

const chicken = FOODS.find(f => f.id === 'chicken')!;
const rice = FOODS.find(f => f.id === 'rice')!;

const entry = (id: string, food = chicken, servings = 1): Entry => ({
  id,
  date: '2026-10-22',
  meal: 'lunch',
  servings,
  food,
});

describe('nutrition', () => {
  test('multiplies food values by servings', () => {
    expect(entryNutrition(entry('1', chicken, 2))).toEqual({
      calories: chicken.calories * 2,
      protein: chicken.protein * 2,
      carbs: chicken.carbs * 2,
      fat: chicken.fat * 2,
    });
  });

  test('sums all entries of a day', () => {
    const total = sumNutrition([entry('1'), entry('2', rice)]);
    expect(total.calories).toBe(chicken.calories + rice.calories);
    expect(total.carbs).toBe(chicken.carbs + rice.carbs);
  });

  test('calories from macros use 4/4/9 kcal per gram', () => {
    expect(caloriesFromMacros(10, 20, 5)).toBe(10 * 4 + 20 * 4 + 5 * 9);
  });

  test('progress is capped at 100% and safe with goal 0', () => {
    expect(progress(500, 1000)).toBe(0.5);
    expect(progress(3000, 2000)).toBe(1);
    expect(progress(100, 0)).toBe(0);
  });

  test('suggests a meal by the hour of the day', () => {
    expect(mealForHour(8)).toBe('breakfast');
    expect(mealForHour(13)).toBe('lunch');
    expect(mealForHour(16)).toBe('snack');
    expect(mealForHour(20)).toBe('dinner');
  });
});

describe('dates', () => {
  test('adds days across months', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });

  test('returns the last 7 days, oldest first', () => {
    const days = lastDays('2026-10-22', 7);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-10-16');
    expect(days[6]).toBe('2026-10-22');
  });
});

describe('shiftTime', () => {
  const { shiftTime, nowRounded } = require('../src/utils/nutrition');
  test('moves forward and back, wrapping midnight', () => {
    expect(shiftTime('07:45', 15)).toBe('08:00');
    expect(shiftTime('00:05', -15)).toBe('23:50');
    expect(shiftTime('23:55', 15)).toBe('00:10');
  });
  test('rounds now down to 5 minutes', () => {
    expect(nowRounded(new Date(2026, 9, 21, 12, 43))).toBe('12:40');
  });
});

describe('new design helpers', () => {
  const {
    mealForHour,
    dayStatus,
    macroSplit,
  } = require('../src/utils/nutrition');
  test('meal by time follows the design (10:30 / 15 / 18)', () => {
    expect(mealForHour(10, 29)).toBe('breakfast');
    expect(mealForHour(10, 30)).toBe('lunch');
    expect(mealForHour(17, 59)).toBe('snack');
    expect(mealForHour(18, 0)).toBe('dinner');
  });
  test('day status: on target is 90% to 105% of the goal', () => {
    expect(dayStatus(0, 2400)).toBe('missing');
    expect(dayStatus(2100, 2400)).toBe('under');
    expect(dayStatus(2400, 2400)).toBe('on');
    expect(dayStatus(2600, 2400)).toBe('over');
  });
  test('macro split is in percent of calories', () => {
    const split = macroSplit({ protein: 150, carbs: 270, fat: 80 });
    expect(Math.round(split.protein + split.carbs + split.fat)).toBe(100);
    expect(Math.round(split.fat)).toBe(30);
  });
});

describe('meal sky', () => {
  const { phaseOf, skyIsDark } = require('../src/components/MealSky');
  test('follows the time of the meal', () => {
    expect(phaseOf('07:30')).toBe('morning');
    expect(phaseOf('12:40')).toBe('midday');
    expect(phaseOf('15:35')).toBe('afternoon');
    expect(phaseOf('19:10')).toBe('dusk');
    expect(phaseOf('03:00')).toBe('night');
    expect(skyIsDark('07:30')).toBe(false);
    expect(skyIsDark('21:00')).toBe(true);
  });
});
