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
