// The Nutri Track logo: a plate seen from the side with three macro leaves.
// viewBox 200 x 200; every leaf grows from the plate centre (100, 146).
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { fixed } from '../theme';

export const LEAF_PATH = 'M0 0C-6-10-24-22-24-42C-24-58-10-68 2-76C12-66 24-56 23-40C22-22 7-10 0 0Z';
const LEAF_SHADE = 'M0 0C7-10 22-22 23-40C24-56 12-66 2-76C1-50 1-25 0 0Z';
const LEAF_VEINS =
  'M0-2C1-26 1.5-50 2-72M.5-18-13-30M.8-18 13-29M1-34-17-46M1.2-34 17-45M1.5-50-12-60M1.6-50 11-59';
export const PLATE_BODY = 'M36 140A64 10 0 0 0 164 140C160 157 138 167 100 167C62 167 40 157 36 140Z';
export const PLATE_FOOT = 'M86 167h28l-3 9H89Z';

/** Rest pose of each leaf (degrees, scale) and its colour key. */
export const LEAVES = [
  { key: 'protein', rest: -34, scale: 0.95 },
  { key: 'fat', rest: 36, scale: 0.95 },
  { key: 'carbs', rest: 2, scale: 1.08 },
] as const;

export type LeafColors = { protein: string; fat: string; carbs: string };

/** One leaf with its stem, drawn at the origin pointing up. */
export function Leaf({ color, stem, detailed = true }: { color: string; stem: string; detailed?: boolean }) {
  return (
    <G>
      <Path d="M0 0V-14" stroke={stem} strokeWidth={2.6} strokeLinecap="round" />
      <G transform="translate(0 -12)">
        <Path d={LEAF_PATH} fill={color} />
        {detailed && <Path d={LEAF_SHADE} fill="#000" fillOpacity={0.16} />}
        {detailed && (
          <Path
            d={LEAF_VEINS}
            stroke="#fff"
            strokeOpacity={0.5}
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </G>
    </G>
  );
}

interface Props {
  size: number;
  /** "dark" = cream plate for green backgrounds, "light" = green plate for cream backgrounds. */
  tone?: 'dark' | 'light';
  shadow?: boolean;
  detailed?: boolean;
}

/** Static logo. Draw order: plate top -> leaves -> plate body, so the leaf bases hide behind the rim. */
export function PlateLogo({ size, tone = 'dark', shadow = false, detailed = true }: Props) {
  const plate = tone === 'dark' ? fixed.cream : '#2F4A33';
  const top = tone === 'dark' ? fixed.plateTop : fixed.plateTopLight;
  const colors = tone === 'dark' ? fixed.leavesOnDark : fixed.leavesOnLight;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {shadow && <Ellipse cx={100} cy={182} rx={56} ry={5} fill="#000" fillOpacity={0.3} />}
      <Ellipse cx={100} cy={140} rx={64} ry={10} fill={top} stroke={plate} strokeWidth={tone === 'dark' ? 3 : 5} />
      {LEAVES.map(leaf => (
        <G key={leaf.key} transform={`translate(100 146) rotate(${leaf.rest}) scale(${leaf.scale})`}>
          <Leaf color={colors[leaf.key]} stem={plate} detailed={detailed} />
        </G>
      ))}
      <Path d={PLATE_BODY} fill={plate} />
      <Path d={PLATE_FOOT} fill={plate} />
    </Svg>
  );
}
