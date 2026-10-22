import { Food, FoodCategory, MealType } from '../types';

export const CATEGORIES: { key: FoodCategory; label: string }[] = [
  { key: 'protein', label: 'Protein' },
  { key: 'grains', label: 'Grains' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'veggies', label: 'Veggies' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'snacks', label: 'Snacks' },
];

export const MEALS: { key: MealType; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'snack', label: 'Snack', emoji: '🍪' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙' },
];

// Approximate values per serving.
export const FOODS: Food[] = [
  { id: 'chicken', name: 'Grilled Chicken', emoji: '🍗', serving: '100 g', category: 'protein', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { id: 'salmon', name: 'Salmon', emoji: '🐟', serving: '100 g', category: 'protein', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'egg', name: 'Boiled Egg', emoji: '🥚', serving: '1 large', category: 'protein', calories: 78, protein: 6, carbs: 1, fat: 5 },
  { id: 'beef', name: 'Lean Beef', emoji: '🥩', serving: '100 g', category: 'protein', calories: 217, protein: 26, carbs: 0, fat: 12 },
  { id: 'tuna', name: 'Tuna', emoji: '🐠', serving: '1 can', category: 'protein', calories: 120, protein: 26, carbs: 0, fat: 1 },
  { id: 'tofu', name: 'Tofu', emoji: '🧈', serving: '100 g', category: 'protein', calories: 76, protein: 8, carbs: 2, fat: 5 },
  { id: 'beans', name: 'Black Beans', emoji: '🫘', serving: '1/2 cup', category: 'protein', calories: 114, protein: 8, carbs: 20, fat: 0 },

  { id: 'rice', name: 'White Rice', emoji: '🍚', serving: '1 cup', category: 'grains', calories: 205, protein: 4, carbs: 45, fat: 0 },
  { id: 'oatmeal', name: 'Oatmeal', emoji: '🥣', serving: '1 cup', category: 'grains', calories: 158, protein: 6, carbs: 27, fat: 3 },
  { id: 'bread', name: 'Whole Wheat Bread', emoji: '🍞', serving: '1 slice', category: 'grains', calories: 81, protein: 4, carbs: 14, fat: 1 },
  { id: 'pasta', name: 'Pasta', emoji: '🍝', serving: '1 cup', category: 'grains', calories: 221, protein: 8, carbs: 43, fat: 1 },
  { id: 'potato', name: 'Sweet Potato', emoji: '🍠', serving: '1 medium', category: 'grains', calories: 112, protein: 2, carbs: 26, fat: 0 },

  { id: 'banana', name: 'Banana', emoji: '🍌', serving: '1 medium', category: 'fruits', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { id: 'apple', name: 'Apple', emoji: '🍎', serving: '1 medium', category: 'fruits', calories: 95, protein: 0, carbs: 25, fat: 0 },
  { id: 'berries', name: 'Strawberries', emoji: '🍓', serving: '1 cup', category: 'fruits', calories: 49, protein: 1, carbs: 12, fat: 0 },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', serving: '1/2 fruit', category: 'fruits', calories: 160, protein: 2, carbs: 9, fat: 15 },
  { id: 'orange', name: 'Orange', emoji: '🍊', serving: '1 medium', category: 'fruits', calories: 62, protein: 1, carbs: 15, fat: 0 },

  { id: 'salad', name: 'Green Salad', emoji: '🥗', serving: '1 bowl', category: 'veggies', calories: 35, protein: 2, carbs: 7, fat: 0 },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', serving: '1 cup', category: 'veggies', calories: 55, protein: 4, carbs: 11, fat: 1 },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', serving: '1 medium', category: 'veggies', calories: 25, protein: 1, carbs: 6, fat: 0 },
  { id: 'tomato', name: 'Tomato', emoji: '🍅', serving: '1 medium', category: 'veggies', calories: 22, protein: 1, carbs: 5, fat: 0 },

  { id: 'yogurt', name: 'Greek Yogurt', emoji: '🥛', serving: '170 g', category: 'dairy', calories: 100, protein: 17, carbs: 6, fat: 1 },
  { id: 'milk', name: 'Milk', emoji: '🥛', serving: '1 cup', category: 'dairy', calories: 122, protein: 8, carbs: 12, fat: 5 },
  { id: 'cheese', name: 'Cheddar Cheese', emoji: '🧀', serving: '30 g', category: 'dairy', calories: 113, protein: 7, carbs: 0, fat: 9 },

  { id: 'acai', name: 'Açaí bowl with granola & banana', emoji: '🫐', serving: '250 g', category: 'snacks', calories: 380, protein: 6, carbs: 64, fat: 12 },
  { id: 'almonds', name: 'Almonds', emoji: '🌰', serving: '28 g', category: 'snacks', calories: 164, protein: 6, carbs: 6, fat: 14 },
  { id: 'peanut', name: 'Peanut Butter', emoji: '🥜', serving: '2 tbsp', category: 'snacks', calories: 188, protein: 8, carbs: 6, fat: 16 },
  { id: 'chocolate', name: 'Dark Chocolate', emoji: '🍫', serving: '30 g', category: 'snacks', calories: 170, protein: 2, carbs: 13, fat: 12 },
  { id: 'coffee', name: 'Coffee with Milk', emoji: '☕', serving: '1 cup', category: 'snacks', calories: 50, protein: 3, carbs: 5, fat: 2 },
  { id: 'shake', name: 'Protein Shake', emoji: '🥤', serving: '1 scoop', category: 'snacks', calories: 120, protein: 24, carbs: 3, fat: 1 },
];
