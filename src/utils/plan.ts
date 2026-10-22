// Daily targets from the onboarding answers. Rules: new-design/calculo-de-metas.md
import { Goals } from '../types';

export type GoalKind = 'lose' | 'maintain' | 'gain';
export type Sex = 'male' | 'female';

export interface Profile {
  goal: GoalKind;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: number; // index into ACTIVITIES
  pace: number; // index into pacesFor(goal)
  targetKg?: number; // only for lose / gain
}

export const ACTIVITIES = [
  { title: 'Mostly seated', subtitle: 'Desk job, little exercise', factor: 1.2 },
  { title: 'Lightly active', subtitle: 'On your feet some, 1–3 workouts a week', factor: 1.375 },
  { title: 'Active', subtitle: 'Moving most of the day, 3–5 workouts', factor: 1.55 },
  { title: 'Very active', subtitle: 'Physical job or daily hard training', factor: 1.725 },
];

export const GOAL_NAMES: Record<GoalKind, string> = {
  lose: 'Lose weight',
  maintain: 'Maintain',
  gain: 'Gain muscle',
};

export const LB_PER_KG = 2.20462;
const KCAL_PER_KG_WEEK = 1100; // 7,700 kcal per kg / 7 days

/** kg per week for each pace option. */
export function pacesFor(goal: GoalKind): number[] {
  return goal === 'gain' ? [0.1, 0.25, 0.5] : [0.25, 0.5, 0.75];
}

const round50 = (x: number) => Math.round(x / 50) * 50;
const round5 = (x: number) => Math.round(x / 5) * 5;

export interface PlanResult {
  bmr: number;
  tdee: number;
  adjustment: number; // kcal added (+) or removed (−) for the goal
  rawKcal: number;
  kcal: number;
  clamped: boolean; // true when the safety floor was used
  floor: number;
  protein: number;
  carbs: number;
  fat: number;
  waterL: number;
}

export function calculatePlan(p: Profile, paceIndex = p.pace): PlanResult {
  const male = p.sex === 'male';
  const factor = ACTIVITIES[p.activity].factor;
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (male ? 5 : -161);
  const tdee = bmr * factor;
  const pace = p.goal === 'maintain' ? 0 : pacesFor(p.goal)[paceIndex];
  const adjustment = p.goal === 'lose' ? -pace * KCAL_PER_KG_WEEK : pace * KCAL_PER_KG_WEEK;
  const floor = male ? 1500 : 1200;
  const rawKcal = tdee + adjustment;
  const kcal = round50(Math.max(rawKcal, floor));
  const protein = round5(2 * p.weightKg);
  const fat = round5((kcal * 0.3) / 9);
  const carbs = round5((kcal - protein * 4 - fat * 9) / 4);
  const waterL = Math.round(p.weightKg * 0.033 * 4) / 4;
  return {
    bmr,
    tdee,
    adjustment,
    rawKcal,
    kcal,
    clamped: rawKcal < floor,
    floor,
    protein,
    carbs,
    fat,
    waterL,
  };
}

/** Plan -> app goals. Water is stored as 250 ml glasses. */
export function goalsFromPlan(plan: PlanResult): Goals {
  return {
    calories: plan.kcal,
    protein: plan.protein,
    carbs: plan.carbs,
    fat: plan.fat,
    water: Math.round(plan.waterL / 0.25),
  };
}

// ---- validation (messages shown under the fields) ----

export function ageError(age: number): string {
  return age >= 16 && age <= 100 ? '' : 'Enter an age between 16 and 100.';
}

export function heightError(cm: number): string {
  return cm >= 120 && cm <= 230
    ? ''
    : 'Enter a height between 120 and 230 cm (3 ft 11 in – 7 ft 6 in).';
}

export function weightError(kg: number, unit: 'kg' | 'lb'): string {
  if (kg >= 35 && kg <= 250) {
    return '';
  }
  return unit === 'kg' ? 'Enter a weight between 35 and 250 kg.' : 'Enter a weight between 77 and 551 lb.';
}

export function formatWeight(kg: number, unit: 'kg' | 'lb'): string {
  return unit === 'kg' ? `${kg.toFixed(1)} kg` : `${Math.round(kg * LB_PER_KG)} lb`;
}

export function targetError(
  goal: GoalKind,
  weightKg: number,
  targetKg: number,
  heightCm: number,
  unit: 'kg' | 'lb',
): string {
  if (goal === 'lose') {
    const minHealthy = 18.5 * Math.pow(heightCm / 100, 2);
    if (!(targetKg < weightKg)) {
      return 'Your goal weight should be below your current weight.';
    }
    if (targetKg < minHealthy) {
      return `That's below a healthy weight for your height (${formatWeight(minHealthy, unit)}).`;
    }
  }
  if (goal === 'gain') {
    if (!(targetKg > weightKg)) {
      return 'Your goal weight should be above your current weight.';
    }
    if (targetKg > weightKg * 1.3) {
      return `Try a closer goal first: up to ${formatWeight(weightKg * 1.3, unit)}.`;
    }
  }
  return '';
}

/** Estimated date to reach the goal weight at a given pace. */
export function reachDate(weightKg: number, targetKg: number, kgPerWeek: number, from = new Date()) {
  const days = Math.round((Math.abs(targetKg - weightKg) / kgPerWeek) * 7);
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date;
}
