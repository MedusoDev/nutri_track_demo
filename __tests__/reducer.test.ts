import { AppState } from "../src/types";
import { createSeedState } from "../src/data/seed";
import { reducer } from "../src/state/reducer";

const TODAY = "2026-10-22";
const initial = createSeedState(TODAY);

describe("reducer", () => {
  test("adds, updates and removes an entry", () => {
    const food = initial.foods[0];
    let state = reducer(initial, {
      type: "addEntry",
      entry: { id: "new", date: TODAY, meal: "dinner", servings: 1, food },
    });
    expect(state.entries).toHaveLength(initial.entries.length + 1);

    state = reducer(state, {
      type: "updateEntry",
      id: "new",
      changes: { servings: 3 },
    });
    expect(state.entries.find((e) => e.id === "new")!.servings).toBe(3);

    state = reducer(state, { type: "removeEntry", id: "new" });
    expect(state.entries).toHaveLength(initial.entries.length);
  });

  test("does not mutate the previous state", () => {
    const before = JSON.stringify(initial);
    reducer(initial, { type: "setWater", date: TODAY, glasses: 7 });
    expect(JSON.stringify(initial)).toBe(before);
  });

  test("toggles favorites", () => {
    const on = reducer(initial, { type: "toggleFavorite", id: "salmon" });
    expect(on.favorites).toContain("salmon");
    const off = reducer(on, { type: "toggleFavorite", id: "salmon" });
    expect(off.favorites).not.toContain("salmon");
  });

  test("removing a food also removes it from favorites", () => {
    const state = reducer(initial, { type: "removeFood", id: "chicken" });
    expect(state.foods.some((f) => f.id === "chicken")).toBe(false);
    expect(state.favorites).not.toContain("chicken");
  });

  test("water never goes below zero", () => {
    const state = reducer(initial, {
      type: "setWater",
      date: TODAY,
      glasses: -1,
    });
    expect(state.water[TODAY]).toBe(0);
  });
});

describe("new actions", () => {
  test("logs several entries at once and keeps the weight", () => {
    const food = initial.foods[0];
    let state = reducer(initial, {
      type: "addEntries",
      entries: [
        { id: "a", date: TODAY, meal: "lunch", servings: 1, food },
        { id: "b", date: TODAY, meal: "lunch", servings: 2, food },
      ],
    });
    expect(state.entries).toHaveLength(2);
    state = reducer(state, { type: "setWeight", date: TODAY, kg: 75.4 });
    expect(state.weights[TODAY]).toBe(75.4);
  });

  test("toggles a reminder", () => {
    const state = reducer(initial, { type: "toggleReminder", id: "dinner" });
    expect(state.reminders.find((r) => r.id === "dinner")!.on).toBe(true);
  });
});

test("new user keeps the plan and clears the log", () => {
  const profile = {
    goal: "maintain" as const,
    sex: "male" as const,
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
      { id: "x", date: TODAY, meal: "lunch" as const, servings: 1, food },
    ],
  };
  state = reducer(state, { type: "newUser", today: TODAY });
  expect(state.entries).toHaveLength(0);
  expect(state.profile).toBe(profile);
  expect(state.weights).toEqual({ [TODAY]: 76 });
});
