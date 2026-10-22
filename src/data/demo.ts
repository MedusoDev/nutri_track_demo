// Settings > "Load 2 months of demo data". Same input -> same data.
import { Entry, Food, Goals, MealType } from '../types';
import { addDays } from '../utils/date';
import { GoalKind } from '../utils/plan';
import { FOODS } from './foods';

type Plate = [string, number][]; // food id, servings

const PLATES: Record<MealType, Plate[]> = {
  breakfast: [
    [
      ['oatmeal', 1],
      ['banana', 1],
      ['coffee', 1],
    ],
    [
      ['bread', 2],
      ['egg', 2],
      ['coffee', 1],
    ],
    [
      ['yogurt', 1],
      ['berries', 1],
    ],
    [
      ['tapioca', 1],
      ['coffee', 1],
    ],
    [
      ['my-crepioca', 1],
      ['coffee', 1],
    ],
  ],
  lunch: [
    [
      ['my-feijoada', 1],
      ['rice', 1],
      ['salad', 1],
    ],
    [
      ['chicken', 1],
      ['rice', 1.5],
      ['beans', 1],
      ['salad', 1],
    ],
    [
      ['beef', 1.5],
      ['rice', 1],
      ['beans', 1],
      ['salad', 1],
    ],
    [
      ['salmon', 1.5],
      ['potato', 1],
      ['broccoli', 1],
    ],
    [
      ['pasta', 1.5],
      ['chicken', 0.75],
    ],
    [
      ['feijoada', 1.5],
      ['rice', 1],
    ],
  ],
  snack: [
    [['my-shake', 1]],
    [['acai', 1]],
    [
      ['whey', 1],
      ['banana', 1],
    ],
    [['yogurt', 1]],
    [
      ['peanut', 1],
      ['apple', 1],
    ],
    [['chocolate', 1]],
  ],
  dinner: [
    [
      ['chicken', 1],
      ['potato', 1],
      ['salad', 1],
    ],
    [
      ['egg', 3],
      ['bread', 2],
    ],
    [
      ['tuna', 1],
      ['rice', 1],
      ['salad', 1],
    ],
    [['pasta', 1.5]],
    [
      ['beef', 1],
      ['rice', 1],
      ['broccoli', 1],
    ],
  ],
};

const TIMES: Record<MealType, [number, number]> = {
  breakfast: [7, 15],
  lunch: [12, 20],
  snack: [15, 40],
  dinner: [19, 30],
};

/** Small seeded random generator (mulberry32), so the demo is the same every time. */
function random(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export interface DemoHistory {
  entries: Entry[];
  water: Record<string, number>;
  weights: Record<string, number>;
  ownFoods: Food[];
  favorites: string[];
}

const OWN_FOODS: Food[] = [
  {
    id: 'my-crepioca',
    name: 'Crepioca with cheese',
    emoji: '🥞',
    serving: 'My recipe · 1 unit',
    servingGrams: 120,
    unit: 'unit',
    category: 'grains',
    calories: 260,
    protein: 17,
    carbs: 22,
    fat: 11,
    custom: true,
  },
  {
    id: 'my-feijoada',
    name: "Mom's feijoada",
    emoji: '🍲',
    serving: "Mom's recipe · 250 g",
    servingGrams: 250,
    category: 'protein',
    calories: 420,
    protein: 26,
    carbs: 24,
    fat: 24,
    brand: 'Homemade',
    custom: true,
  },
  {
    id: 'my-shake',
    name: 'Banana protein shake',
    emoji: '🥤',
    serving: 'My recipe · 400 ml',
    servingGrams: 400,
    unit: 'ml',
    category: 'snacks',
    calories: 310,
    protein: 32,
    carbs: 38,
    fat: 4,
    custom: true,
  },
];

const DEMO_FAVORITES = [
  'banana',
  'yogurt',
  'whey',
  'bread',
  'egg',
  'my-crepioca',
  'my-shake',
];

export function buildDemoHistory(
  today: string,
  goals: Goals,
  weightKg: number,
  goal: GoalKind,
  days = 60,
): DemoHistory {
  const rand = random(20261022);
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  const food = (id: string) => [...FOODS, ...OWN_FOODS].find(f => f.id === id)!;

  const entries: Entry[] = [];
  const water: Record<string, number> = {};
  const weights: Record<string, number> = {};

  // Weight moves ~0.35 kg a week toward today's weight (down when losing, up when gaining).
  const weeks = days / 7;
  const startKg =
    goal === 'lose'
      ? weightKg + 0.35 * weeks
      : goal === 'gain'
      ? weightKg - 0.25 * weeks
      : weightKg + 0.3;

  for (let back = days; back >= 0; back--) {
    const date = addDays(today, -back);
    const isToday = back === 0;
    const inStreak = back <= 12;
    if (!inStreak && rand() < 0.1) {
      continue; // a day the user did not log
    }

    const meals: MealType[] = isToday
      ? ['breakfast', 'lunch']
      : ['breakfast', 'lunch', 'snack', 'dinner'];
    const dayMeals = meals.filter(m => m !== 'snack' || rand() < 0.75);
    const plates = dayMeals.map(meal => ({ meal, plate: pick(PLATES[meal]) }));

    // Scale portions so the day lands near the goal: mostly 88–108%, sometimes a big day.
    const raw = plates.reduce(
      (sum, p) =>
        sum +
        p.plate.reduce(
          (s, [id, servings]) => s + food(id).calories * servings,
          0,
        ),
      0,
    );
    const ratio = rand() < 0.15 ? 1.1 + rand() * 0.15 : 0.88 + rand() * 0.2;
    const target = isToday ? goals.calories * 0.5 : goals.calories * ratio;
    const factor = raw > 0 ? target / raw : 1;

    plates.forEach(({ meal, plate }) => {
      const [h, m] = TIMES[meal];
      const minutes = h * 60 + m + Math.round((rand() - 0.5) * 50);
      const time = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
      plate.forEach(([id, servings], i) => {
        entries.push({
          id: `demo-${date}-${meal}-${i}`,
          date,
          meal,
          servings: Math.max(0.25, Math.round(servings * factor * 4) / 4),
          food: food(id),
          time,
        });
      });
    });

    water[date] = isToday
      ? 4
      : Math.max(
          3,
          Math.min(12, Math.round(goals.water * (0.6 + rand() * 0.5))),
        );

    if (isToday || back % 4 === 0 || (back % 7 === 3 && rand() < 0.5)) {
      const progress = 1 - back / days;
      const noise = (rand() - 0.5) * 0.5;
      weights[date] =
        Math.round(
          (startKg + (weightKg - startKg) * progress + (isToday ? 0 : noise)) *
            10,
        ) / 10;
    }
  }

  return {
    entries,
    water,
    weights,
    ownFoods: OWN_FOODS,
    favorites: DEMO_FAVORITES,
  };
}
