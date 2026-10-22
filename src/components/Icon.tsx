import Svg, { Path } from 'react-native-svg';

// Simple stroke icons drawn with SVG, so the app needs no icon font.
const PATHS = {
  home: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  chart: 'M4 20V11 M10 20V4 M16 20v-7 M21 20H3',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01',
  settings:
    'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
  trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  close: 'M18 6L6 18 M6 6l12 12',
  chevronRight: 'M9 18l6-6-6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  flame:
    'M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z',
  drop: 'M12 2.7l5.7 5.6a8 8 0 1 1-11.4 0z',
  check: 'M20 6L9 17l-5-5',

  // New design (1.5 px stroke, 24 grid)
  arrowRight: 'M5 12h14m-5-5 5 5-5 5',
  back: 'm14.5 5-7 7 7 7',
  chevronDown: 'm5 9.5 7 7 7-7',
  tick: 'M5 12.5 9.5 17 19 7.5',
  dash: 'M7 12h10',
  add: 'M12 5v14M5 12h14',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  mail: 'M6.5 5.5h11a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z m-2 2 7.5 6 7.5-6',
  goalLose: 'M4 7l5.5 5.5 3.5-3.5L20 16.5M20 16.5V11M20 16.5h-5.5',
  goalMaintain: 'M5 9h14M5 15h14',
  goalGain: 'M4 16.5l5.5-5.5 3.5 3.5L20 7.5M20 7.5V13M20 7.5h-5.5',
  waterDrop: 'M12 3.5C8 8.5 6 11.5 6 14.5a6 6 0 0 0 12 0c0-3-2-6-6-11Z',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4Z M13.5 6.5l4 4',
  bin: 'M4.5 7h15 M9.5 7V4.5h5V7 M6.5 7l1 12.5h9l1-12.5 M10 11v5 M14 11v5',
  x: 'M6 6l12 12M18 6 6 18',
  magnifier: 'M4.5 11a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0 M16 16l4.5 4.5',
  barcode:
    'M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M8 9v6M12 9v6M16 9v6',
  heart:
    'M12 19.5C6 15.5 4 12.5 4 9.5A4.2 4.2 0 0 1 12 7.8 4.2 4.2 0 0 1 20 9.5c0 3-2 6-8 10Z',
  forward: 'm9.5 5 7 7-7 7',
  dots: 'M5 12h1M11.5 12h1M18 12h1',
  copy: 'M11 8h5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z M16 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1',
  target:
    'M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M11.4 12h1.2',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z',
  bell: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5ZM10 20.5h4',
  ruler: 'M4 15 15 4l5 5L9 20l-5-5ZM8 11l2 2M11 8l2 2',
  scale:
    'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z M8.5 10a3.5 3.5 0 0 1 7 0 M12 10l1.5-2',
  user: 'M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M4.5 20c.8-3.5 3.8-5.5 7.5-5.5s6.7 2 7.5 5.5',
  mealBreakfast:
    'M3.5 18h17 M7 18a5 5 0 0 1 10 0 M12 6.5v3 M5.8 10.8l1.6 1.2 M18.2 10.8l-1.6 1.2 M8.5 21h7',
  mealLunch:
    'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M12 3.5v2 M12 18.5v2 M3.5 12h2 M18.5 12h2 M6 6l1.4 1.4 M16.6 16.6 18 18 M6 18l1.4-1.4 M16.6 7.4 18 6',
  mealSnack:
    'M12 8.5c-2-1.6-6.5-1.2-6.8 3.4C5 16.4 8 20.5 10.2 20.5c.8 0 1.1-.4 1.8-.4s1 .4 1.8.4c2.2 0 5.2-4.1 5-8.6-.3-4.6-4.8-5-6.8-3.4Z M12 8.5c0-2.2 1.1-3.8 3.2-4.6',
  clock: 'M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M12 7.5V12l3 2',
  book: 'M4 5.5c2.2-1 5-1 8 .7 3-1.7 5.8-1.7 8-.7V19c-2.2-1-5-1-8 .7-3-1.7-5.8-1.7-8-.7Z M12 6.2v13.5',
  pot: 'M4.5 10.5h15v2.5a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6v-2.5Z M3 10.5h18 M9.5 7c0-1 1-1.2 1-2.5M14 7c0-1 1-1.2 1-2.5',
  leafMark: 'M4.5 19.5C4 11 9.5 4.5 20 4c.5 10-5 16-13 15.5Z',
  streak: 'M4.5 19.5C4 11 9.5 4.5 20 4c.5 10-5 16-13 15.5 M4.5 19.5 14 10',
  tabToday:
    'M12 20v-8M12 12c0-3.5-2.5-6-6.5-6 0 3.5 2.5 6 6.5 6ZM12 14c0-3 2.2-5.5 6.5-5.5 0 3.5-2.5 5.5-6.5 5.5Z',
  tabHistory: 'M4 19V5M4 19h16M8 15l3.5-4 3 2.5L19 8',
  tabFoods:
    'M3.5 12h17c0 4.7-3.8 8-8.5 8s-8.5-3.3-8.5-8ZM12 12V9M12 9c0-2.5 1.8-4 4.5-4 0 2.5-1.8 4-4.5 4Z',
  tabSettings:
    'M4 7h9M17 7h3M4 17h3M11 17h9 M13 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M7 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
};

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  size?: number;
  color: string;
  filled?: boolean;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 22,
  color,
  filled = false,
  strokeWidth = 2,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={PATHS[name]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}
