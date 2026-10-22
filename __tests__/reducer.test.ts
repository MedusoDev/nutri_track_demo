import { AppState } from '../src/types';
import { createSeedState } from '../src/data/seed';
import { reducer } from '../src/state/reducer';
import { macroCheck, validateFood } from '../src/utils/foodForm';

const TODAY = '2026-10-22';
const initial = createSeedState(TODAY);

describe('reducer', () => {
  test('adds, updates and removes an entry', () => {
    const food = initial.foods[0];
    let state = reducer(initial, {
      type: 'addEntry',
      entry: { id: 'new', date: TODAY, meal: 'dinner', servings: 1, food },
    });
    expect(state.entries).toHaveLength(initial.entries.length + 1);

    state = reducer(state, {
      type: 'updateEntry',
      id: 'new',
      changes: { servings: 3 },
    });
    expect(state.entries.find(e => e.id === 'new')!.servings).toBe(3);

    state = reducer(state, { type: 'removeEntry', id: 'new' });
    expect(state.entries).toHaveLength(initial.entries.length);
  });

  test('does not mutate the previous state', () => {
    const before = JSON.stringify(initial);
    reducer(initial, { type: 'setWater', date: TODAY, glasses: 7 });
    expect(JSON.stringify(initial)).toBe(before);
  });

  test('toggles favorites', () => {
    const on = reducer(initial, { type: 'toggleFavorite', id: 'salmon' });
    expect(on.favorites).toContain('salmon');
    const off = reducer(on, { type: 'toggleFavorite', id: 'salmon' });
    expect(off.favorites).not.toContain('salmon');
  });

  test('removing a food also removes it from favorites', () => {
    const state = reducer(initial, { type: 'removeFood', id: 'chicken' });
    expect(state.foods.some(f => f.id === 'chicken')).toBe(false);
    expect(state.favorites).not.toContain('chicken');
  });

  test('water never goes below zero', () => {
    const state = reducer(initial, {
      type: 'setWater',
      date: TODAY,
      glasses: -1,
    });
    expect(state.water[TODAY]).toBe(0);
  });
});

describe('food form validation', () => {
  const valid = {
    name: 'Tapioca',
    servingSize: '180',
    calories: '295',
    protein: '11',
    carbs: '38',
    fat: '11',
  };

  test('accepts a valid food', () => {
    expect(validateFood(valid)).toEqual({});
  });

  test('rejects short names, empty serving and invalid numbers', () => {
    const errors = validateFood({
      ...valid,
      name: 'A',
      servingSize: '',
      protein: 'abc',
      calories: '-5',
    });
    expect(Object.keys(errors).sort()).toEqual([
      'calories',
      'name',
      'protein',
      'servingSize',
    ]);
  });

  test('checks that the macros match the calories within 10%', () => {
    expect(macroCheck(valid)).toEqual({ fromMacros: 295, matches: true });
    expect(macroCheck({ ...valid, calories: '200' }).matches).toBe(false);
  });
});

describe('new actions', () => {
  test('logs several entries at once and keeps the weight', () => {
    const food = initial.foods[0];
    let state = reducer(initial, {
      type: 'addEntries',
      entries: [
        { id: 'a', date: TODAY, meal: 'lunch', servings: 1, food },
        { id: 'b', date: TODAY, meal: 'lunch', servings: 2, food },
      ],
    });
    expect(state.entries).toHaveLength(2);
    state = reducer(state, { type: 'setWeight', date: TODAY, kg: 75.4 });
    expect(state.weights[TODAY]).toBe(75.4);
  });

  test('toggles a reminder', () => {
    const state = reducer(initial, { type: 'toggleReminder', id: 'dinner' });
    expect(state.reminders.find(r => r.id === 'dinner')!.on).toBe(true);
  });
});

describe('demo history', () => {
  const { buildDemoHistory } = require('../src/data/demo');
  const goals = {
    calories: 2400,
    protein: 150,
    carbs: 270,
    fat: 80,
    water: 10,
  };

  test('covers about two months, ends with a 12-day streak and weight going down', () => {
    const demo = buildDemoHistory(TODAY, goals, 76, 'lose');
    const days = Object.keys(demo.water);
    expect(days.length).toBeGreaterThan(48);
    const { streakDays } = require('../src/utils/nutrition');
    expect(streakDays(demo.entries, TODAY)).toBeGreaterThanOrEqual(13);
    const weighIns = Object.keys(demo.weights).sort();
    expect(demo.weights[weighIns[weighIns.length - 1]]).toBe(76);
    expect(demo.weights[weighIns[0]]).toBeGreaterThan(77);
  });

  test('is the same every time', () => {
    expect(buildDemoHistory(TODAY, goals, 76, 'maintain')).toEqual(
      buildDemoHistory(TODAY, goals, 76, 'maintain'),
    );
  });
});

test('new user keeps the plan and clears the log', () => {
  const profile = {
    goal: 'maintain' as const,
    sex: 'male' as const,
    age: 29,
    heightCm: 178,
    weightKg: 76,
    activity: 1,
    pace: 1,
  };
  const food = initial.foods[0];
  let state: AppState = {
    ...initial,
    profile,
    entries: [
      { id: 'x', date: TODAY, meal: 'lunch' as const, servings: 1, food },
    ],
  };
  state = reducer(state, { type: 'newUser', today: TODAY });
  expect(state.entries).toHaveLength(0);
  expect(state.profile).toBe(profile);
  expect(state.weights).toEqual({ [TODAY]: 76 });
});

test('a new user has no favourites or own recipes; the 2-month demo has both', () => {
  expect(initial.favorites).toEqual([]);
  expect(initial.foods.some(f => f.custom)).toBe(false);
  const { buildDemoHistory } = require('../src/data/demo');
  const demo = buildDemoHistory(TODAY, initial.goals, 76, 'lose');
  const state = reducer(initial, { type: 'loadDemo', ...demo });
  expect(state.favorites.length).toBeGreaterThan(0);
  expect(state.foods.filter(f => f.custom).length).toBe(3);
  const back = reducer(state, { type: 'newUser', today: TODAY });
  expect(back.favorites).toEqual([]);
  expect(back.foods.some(f => f.custom)).toBe(false);
});
