# nutri_track_demo

Demo of **Nutri Track**, a calm calorie and macro tracker built with React Native CLI and TypeScript.
It started as a coding challenge (recreate a nutrition dashboard mockup) and is now being rebuilt with a new design, part by part.

**Version 0.2.0** · new design, work in progress

<img src="docs/welcome.png" alt="Nutri Track welcome screen: a plate with three macro leaves" width="320">

## What's in this demo

- **Splash**: the logo animates in: a plate rises and three leaves (protein, carbs, fat) sprout from it.
- **Onboarding**: goal, body data and pace. The app calculates the daily calories, macros and water target (Mifflin–St Jeor) and shows how it got there.
- **Today**: calories left with a leaf that fills up, macro bars, a water tracker and the day's meals.
- **Log food**: pick the meal and the time, add several foods to a list and log them all at once, with undo.
- **History, Foods and Settings** tabs.

## Stack

- TypeScript + React Native CLI
- react-native-svg for the logo, leaf and icons
- AsyncStorage to keep the data on the phone
- Local mock data (no backend)
- Jest for the unit tests

## Project structure

```
App.tsx               splash -> onboarding -> tabs
src/
  theme.ts            design tokens (light and dark), fonts
  types.ts            data shapes
  data/               food list and first-launch state
  state/              app state (reducer + context + local storage)
  utils/              nutrition maths and the daily target calculation
  components/         UI kit, logo, tab bar, toast...
  screens/            Splash, onboarding, Today, History, Foods, Settings
__tests__/            unit tests
```

## How to run

Requires Node 22+, JDK 17 and Android Studio with an emulator running.

```bash
git clone https://github.com/MedusoDev/nutri_track_demo.git
cd nutri_track_demo
npm install
```

Start Metro in one terminal and wait until it is ready:

```bash
npm start
```

Then, in a second terminal, build and open the app on the emulator:

```bash
npm run android
```

Run the tests with `npm test`.

---

Made by [Gabriel Barros](https://github.com/MedusoDev).
