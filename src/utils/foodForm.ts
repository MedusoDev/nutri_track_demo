export interface FoodForm {
  name: string;
  servingSize: string; // number as text
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export type FoodFormErrors = Partial<Record<keyof FoodForm, string>>;

const num = (text: string) => Number(text.replace(',', '.') || 0);

export function validateFood(form: FoodForm): FoodFormErrors {
  const errors: FoodFormErrors = {};
  if (form.name.trim().length < 2) {
    errors.name = 'Give it a name with at least 2 letters.';
  }
  const size = num(form.servingSize);
  if (!(size > 0 && size <= 5000)) {
    errors.servingSize = 'Use a serving from 1 to 5000.';
  }
  const kcal = num(form.calories);
  if (Number.isNaN(kcal) || kcal < 0 || kcal > 5000) {
    errors.calories = 'Use a number from 0 to 5000.';
  }
  (['protein', 'carbs', 'fat'] as const).forEach(key => {
    const value = num(form[key]);
    if (Number.isNaN(value) || value < 0 || value > 500) {
      errors[key] = 'Use 0 to 500 g.';
    }
  });
  return errors;
}

/** kcal from the macros and whether it is within 10% of the calories typed. */
export function macroCheck(form: FoodForm) {
  const fromMacros = Math.round(
    num(form.protein) * 4 + num(form.carbs) * 4 + num(form.fat) * 9,
  );
  const typed = num(form.calories);
  const matches =
    typed > 0 ? Math.abs(fromMacros - typed) <= typed * 0.1 : fromMacros === 0;
  return { fromMacros, matches };
}
