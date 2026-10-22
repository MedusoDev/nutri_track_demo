import { useColorScheme, ViewStyle } from 'react-native';
import { useApp } from './state/AppContext';
import { ThemeMode } from './types';

// Tokens from new-design/README.md (same names in both themes).
const light = {
  bg: '#F6F1E7',
  surface: '#FCFAF4',
  sunken: '#EDE6D6',
  line: '#DDD4C0',
  ink: '#1F2A21',
  ink2: '#4F5A4A',
  ink3: '#5C6656',
  primary: '#2F4A33',
  onPrimary: '#F6F1E7',
  hero: '#2F4A33',
  leafFill: '#A9CF86',
  soft: '#DFE7D0',
  accent: '#A8481F',
  accentSoft: '#F2DCCB',
  protein: '#8E3F58',
  carbs: '#B98A22',
  fat: '#437F7D',
  water: '#3F6F8C',
  waterSoft: '#DCE8EC',
  proteinSoft: '#EBD3D9',
  carbsSoft: '#F1E2B8',
  fatSoft: '#CFE3E1',
  onAccent: '#FFF8F0',
  lineStrong: '#B3A88F', // darker border for the main cards on Today
  waterLine: '#8FB0C2',
  shadow: '#1F2A21',
  overlay: 'rgba(18, 26, 20, 0.5)',

  // Older names still used by History, Foods and Settings (sections 07-09 keep their layout for now).
  background: '#F6F1E7',
  surfaceAlt: '#EDE6D6',
  border: '#DDD4C0',
  text: '#1F2A21',
  textMuted: '#5C6656',
  primarySoft: '#DFE7D0',
  danger: '#A8481F',
};

export type Colors = typeof light;

const dark: Colors = {
  bg: '#121A14',
  surface: '#1A251D',
  sunken: '#0F1711',
  line: '#2B3A2F',
  ink: '#EEE8D8',
  ink2: '#BAC3AD',
  ink3: '#98A38C',
  primary: '#A9CF86',
  onPrimary: '#14200F',
  hero: '#203526',
  leafFill: '#A9CF86',
  soft: '#26392A',
  accent: '#E69063',
  accentSoft: '#3A2A20',
  protein: '#E0909F',
  carbs: '#E3BC5A',
  fat: '#7FC0BB',
  water: '#8DBBD6',
  waterSoft: '#1E3039',
  proteinSoft: '#3A2830',
  carbsSoft: '#3A3320',
  fatSoft: '#1F3836',
  onAccent: '#FFF8F0',
  lineStrong: '#4A5E4F',
  waterLine: '#3E6476',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',

  background: '#121A14',
  surfaceAlt: '#0F1711',
  border: '#2B3A2F',
  text: '#EEE8D8',
  textMuted: '#98A38C',
  primarySoft: '#26392A',
  danger: '#E69063',
};

export const palettes: Record<'light' | 'dark', Colors> = { dark, light };

/** Colors that do not change with the theme (splash, welcome, toast, logo). */
export const fixed = {
  splash: '#1E3224',
  cream: '#F6F1E7',
  plateTop: '#CFC6B0',
  plateTopLight: '#E4DCC8',
  leafGreen: '#A9CF86',
  toast: '#1F2A21',
  toastAction: '#C9E2A3',
  overNumber: '#F2C9A8',
  overLeaf: '#E8B48E',
  overNoteText: '#3A1C0C',
  apple: '#1F2A21',
  // Leaf colors of the logo: bright on dark backgrounds, soft on light ones.
  leavesOnDark: { protein: '#E0909F', fat: '#7FC0BB', carbs: '#E3BC5A' },
  leavesOnLight: { protein: '#C27D90', fat: '#6FA7A3', carbs: '#D4AE4E' },
};

// Font files live in android/app/src/main/assets/fonts. If they are missing, Android
// falls back to the system font, so the app still runs.
export const fonts = {
  display: 'Fraunces-Regular',
  sans: 'InstrumentSans-Regular',
  sansMedium: 'InstrumentSans-Medium',
  sansSemiBold: 'InstrumentSans-SemiBold',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 10, md: 16, lg: 24, full: 999 };

/** The "leaf" corner shape of the design: big top-left and bottom-right corners. */
export function leaf(big: number, small: number): ViewStyle {
  return {
    borderTopLeftRadius: big,
    borderTopRightRadius: small,
    borderBottomRightRadius: big,
    borderBottomLeftRadius: small,
  };
}

/** Same shape, mirrored (used by the dashed empty slot). */
export function leafFlipped(big: number, small: number): ViewStyle {
  return leaf(small, big);
}

/** Overline style: small caps label. */
export const overline = {
  fontFamily: fonts.sansSemiBold,
  fontSize: 11.5,
  letterSpacing: 1,
  textTransform: 'uppercase' as const,
};

/** True when the app is dark: chosen in Settings, or following the phone ("system"). */
export function useIsDark(): boolean {
  const { state } = useApp();
  const scheme = useColorScheme();
  const mode: ThemeMode = state.theme;
  return mode === 'system' ? scheme === 'dark' : mode === 'dark';
}

export function useColors(): Colors {
  return palettes[useIsDark() ? 'dark' : 'light'];
}
