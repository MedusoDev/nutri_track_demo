import {
  calculatePlan,
  goalsFromPlan,
  Profile,
  reachDate,
  targetError,
} from '../src/utils/plan';

// Example from new-design/calculo-de-metas.md
const gabriel: Profile = {
  goal: 'maintain',
  sex: 'male',
  age: 29,
  heightCm: 178,
  weightKg: 76,
  activity: 1, // lightly active
  pace: 1,
};

describe('calculatePlan', () => {
  it('matches the maintain example: 2,400 kcal, P150 C270 F80, 2.5 L', () => {
    const plan = calculatePlan(gabriel);
    expect(plan.bmr).toBeCloseTo(1732.5);
    expect(plan.kcal).toBe(2400);
    expect(plan.protein).toBe(150);
    expect(plan.carbs).toBe(270);
    expect(plan.fat).toBe(80);
    expect(plan.waterL).toBe(2.5);
  });

  it('removes 550 kcal for losing 0.5 kg a week', () => {
    const plan = calculatePlan({ ...gabriel, goal: 'lose', pace: 1, targetKg: 72 });
    expect(plan.adjustment).toBe(-550);
    expect(plan.kcal).toBe(1850);
  });

  it('never goes below the safety floor', () => {
    const plan = calculatePlan({
      goal: 'lose',
      sex: 'female',
      age: 60,
      heightCm: 150,
      weightKg: 45,
      activity: 0,
      pace: 2,
      targetKg: 43,
    });
    expect(plan.clamped).toBe(true);
    expect(plan.kcal).toBe(1200);
  });

  it('turns the plan into goals with water in 250 ml glasses', () => {
    expect(goalsFromPlan(calculatePlan(gabriel))).toEqual({
      calories: 2400,
      protein: 150,
      carbs: 270,
      fat: 80,
      water: 10,
    });
  });
});

describe('targetError', () => {
  it('asks for a lower goal weight when losing', () => {
    expect(targetError('lose', 76, 80, 178, 'kg')).toMatch(/below your current/);
  });

  it('blocks a goal below a healthy BMI', () => {
    expect(targetError('lose', 76, 50, 178, 'kg')).toMatch(/healthy weight/);
  });

  it('limits gains to +30%', () => {
    expect(targetError('gain', 76, 110, 178, 'kg')).toMatch(/closer goal/);
    expect(targetError('gain', 76, 80, 178, 'kg')).toBe('');
  });
});

it('estimates the date from the weekly pace', () => {
  const date = reachDate(76, 72, 0.5, new Date(2026, 9, 21));
  expect(date.toDateString()).toBe(new Date(2026, 9, 21 + 56).toDateString());
});
