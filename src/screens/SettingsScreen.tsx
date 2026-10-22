import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../components/Icon';
import {
  Body,
  EditSheet,
  GhostButton,
  LeafSwitch,
  LineField,
  OrDivider,
  Overline,
  PrimaryButton,
  RoundButton,
  Segmented,
  SplitBar,
  SsoButton,
} from '../components/kit';
import { buildDemoHistory } from '../data/demo';
import { createSeedState } from '../data/seed';
import { useApp } from '../state/AppContext';
import { useNav } from '../state/nav';
import { fonts, leaf, useColors } from '../theme';
import { Goals } from '../types';
import { macroSplit } from '../utils/nutrition';
import {
  ACTIVITIES,
  calculatePlan,
  GOAL_NAMES,
  goalsFromPlan,
  LB_PER_KG,
} from '../utils/plan';
import { EMAIL_RE } from './onboarding/LoginScreen';

const fmt = (x: number) => Math.round(x).toLocaleString('en-US');
type Sheet =
  | null
  | 'name'
  | 'calories'
  | 'split'
  | 'water'
  | 'how'
  | 'privacy'
  | 'account';

/** Grams from a calorie target and a split in percent. */
function gramsFromSplit(
  kcal: number,
  split: { protein: number; carbs: number; fat: number },
) {
  const r5 = (x: number) => Math.round(x / 5) * 5;
  return {
    protein: r5((kcal * split.protein) / 100 / 4),
    carbs: r5((kcal * split.carbs) / 100 / 4),
    fat: r5((kcal * split.fat) / 100 / 9),
  };
}

export function SettingsScreen() {
  const { state, dispatch, today } = useApp();
  const colors = useColors();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { goals, profile } = state;
  const lb = state.units === 'lb';

  const [sheet, setSheet] = useState<Sheet>(null);
  const [text, setText] = useState('');
  const [split, setSplit] = useState({ protein: 25, carbs: 45, fat: 30 });
  const [water, setWater] = useState(goals.water);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const plan = profile ? calculatePlan(profile) : null;
  const planGoals = plan ? goalsFromPlan(plan) : null;
  const current = macroSplit(goals);
  const custom = {
    calories: !!planGoals && planGoals.calories !== goals.calories,
    split:
      !!planGoals &&
      (planGoals.protein !== goals.protein ||
        planGoals.carbs !== goals.carbs ||
        planGoals.fat !== goals.fat),
    water: !!planGoals && planGoals.water !== goals.water,
  };

  const setGoals = (changes: Partial<Goals>, message: string) => {
    dispatch({ type: 'updateGoals', goals: { ...goals, ...changes } });
    setSheet(null);
    nav.toast(message);
  };

  const weightText = profile
    ? lb
      ? `${Math.round(profile.weightKg * LB_PER_KG)} lb`
      : `${Math.round(profile.weightKg * 10) / 10} kg`
    : '';
  const summary = profile
    ? `${GOAL_NAMES[profile.goal]} · ${weightText} · ${Math.round(
        profile.heightCm,
      )} cm`
    : 'Set up your profile to get your own targets';

  function confirm(title: string, message: string, onYes: () => void) {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onYes },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48, // the tab bar sits below the scroll; this is room for the raised "+"
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, styles.pad, { color: colors.ink }]}>
        Settings
      </Text>

      {!state.hasAccount && (
        <Pressable
          onPress={() => setSheet('account')}
          style={[styles.account, { backgroundColor: colors.accentSoft }]}
          accessibilityRole="button"
        >
          <View style={styles.flex}>
            <Text style={[styles.accountTitle, { color: colors.ink }]}>
              Save your progress
            </Text>
            <Text style={[styles.small, { color: colors.ink2 }]}>
              Your plan and meals live only on this phone. Create an account to
              keep them.
            </Text>
          </View>
          <Icon name="forward" size={20} color={colors.ink} strokeWidth={1.5} />
        </Pressable>
      )}

      <View style={[styles.profile, { backgroundColor: colors.soft }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
            {(state.name || 'G').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Pressable
          style={styles.flex}
          onPress={() => {
            setText(state.name);
            setSheet('name');
          }}
          accessibilityRole="button"
          accessibilityHint="Change your name"
        >
          <Text style={[styles.name, { color: colors.ink }]}>
            {state.name || 'You'}
          </Text>
          <Text style={[styles.summary, { color: colors.ink2 }]}>
            {summary}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => nav.push({ name: 'editProfile' })}
          style={[styles.edit, { borderColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Icon
            name="pencil"
            size={20}
            color={colors.primary}
            strokeWidth={1.5}
          />
        </Pressable>
      </View>

      <Section title="Goals" />
      <View style={styles.pad}>
        <Row
          icon="target"
          label="Daily calories"
          tag={custom.calories}
          value={fmt(goals.calories)}
          unit="kcal"
          onPress={() => {
            setText(String(goals.calories));
            setSheet('calories');
          }}
        />
        <Pressable
          onPress={() => {
            setSplit({
              protein: Math.round(current.protein / 5) * 5,
              carbs: Math.round(current.carbs / 5) * 5,
              fat:
                100 -
                Math.round(current.protein / 5) * 5 -
                Math.round(current.carbs / 5) * 5,
            });
            setSheet('split');
          }}
          style={[styles.splitRow, { borderBottomColor: colors.line }]}
          accessibilityRole="button"
        >
          <View style={styles.rowInner}>
            <Icon
              name="tabToday"
              size={24}
              color={colors.primary}
              strokeWidth={1.5}
            />
            <Text style={[styles.rowLabel, { color: colors.ink }]}>
              Macro split
            </Text>
            {custom.split && <Tag />}
            <Icon
              name="forward"
              size={18}
              color={colors.ink3}
              strokeWidth={1.5}
            />
          </View>
          <View style={styles.mt12}>
            <SplitBar
              protein={current.protein}
              carbs={current.carbs}
              fat={current.fat}
            />
          </View>
          <View style={styles.splitLabels}>
            <Text style={[styles.small, { color: colors.ink2 }]}>
              Protein {Math.round(current.protein)}%
            </Text>
            <Text style={[styles.small, { color: colors.ink2 }]}>
              Carbs {Math.round(current.carbs)}%
            </Text>
            <Text style={[styles.small, { color: colors.ink2 }]}>
              Fat {Math.round(current.fat)}%
            </Text>
          </View>
        </Pressable>
        <Row
          icon="waterDrop"
          label="Water"
          tag={custom.water}
          value={String(goals.water * 0.25)}
          unit="L"
          onPress={() => {
            setWater(goals.water);
            setSheet('water');
          }}
        />
      </View>

      <Section title="Units & look" />
      <View style={styles.pad}>
        <View style={[styles.row, { borderBottomColor: colors.line }]}>
          <Icon
            name="ruler"
            size={24}
            color={colors.primary}
            strokeWidth={1.5}
          />
          <Text style={[styles.rowLabel, { color: colors.ink }]}>Weight</Text>
          <Segmented
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lb', label: 'lb' },
            ]}
            value={state.units}
            onChange={units => dispatch({ type: 'setUnits', units })}
          />
        </View>
        <View style={[styles.row, { borderBottomColor: colors.line }]}>
          <Icon
            name="moon"
            size={24}
            color={colors.primary}
            strokeWidth={1.5}
          />
          <Text style={[styles.rowLabel, { color: colors.ink }]}>Theme</Text>
          <Segmented
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'Auto' },
            ]}
            value={state.theme}
            onChange={theme => dispatch({ type: 'setTheme', theme })}
          />
        </View>
      </View>

      <Section title="Reminders" />
      <View style={styles.pad}>
        {state.reminders.map(r => (
          <View
            key={r.id}
            style={[styles.row, { borderBottomColor: colors.line }]}
          >
            <Icon
              name="bell"
              size={24}
              color={colors.primary}
              strokeWidth={1.5}
            />
            <View style={styles.flex}>
              <Text style={[styles.rowText, { color: colors.ink }]}>
                {r.label}
              </Text>
              <Text style={[styles.small, { color: colors.ink2 }]}>
                {r.schedule}
              </Text>
            </View>
            <LeafSwitch
              value={r.on}
              onChange={() => dispatch({ type: 'toggleReminder', id: r.id })}
              label={`${r.label} reminder`}
            />
          </View>
        ))}
        <Text style={[styles.note, { color: colors.ink3 }]}>
          Demo: reminders are saved, but notifications are not sent yet.
        </Text>
      </View>

      <Section title="About" />
      <View style={styles.pad}>
        <Row
          label="How we calculate your targets"
          onPress={() => setSheet('how')}
        />
        <Row label="Privacy" onPress={() => setSheet('privacy')} />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.ink }]}>
            Nutri Track
          </Text>
          <Text style={[styles.small, { color: colors.ink3 }]}>
            Version 0.2.0
          </Text>
        </View>
      </View>

      <Section title="Data" />
      <View style={styles.pad}>
        <Row
          label="Clear today's log"
          onPress={() =>
            confirm(
              'Clear today?',
              'All foods and water logged today will be removed.',
              () => {
                state.entries
                  .filter(entry => entry.date === today)
                  .forEach(entry =>
                    dispatch({ type: 'removeEntry', id: entry.id }),
                  );
                dispatch({ type: 'setWater', date: today, glasses: 0 });
                nav.toast("Today's log cleared");
              },
            )
          }
        />
        <Row
          label="Show as a new user (day 1)"
          onPress={() =>
            confirm(
              'Show as a new user?',
              'Everything logged is cleared, as if the account was created today. Your plan and goals from the onboarding stay.',
              () => {
                dispatch({ type: 'newUser', today });
                nav.toast('New user · day 1', 'Nothing logged yet');
              },
            )
          }
        />
        <Row
          label="Load 2 months of demo data"
          onPress={() =>
            confirm(
              'Load demo data?',
              'Your log, water and weight are replaced by about 2 months of example days, as if you had used Nutri Track for 2 months. Your goals stay the same.',
              () => {
                const demo = buildDemoHistory(
                  today,
                  goals,
                  profile?.weightKg ?? 76,
                  profile?.goal ?? 'maintain',
                );
                dispatch({ type: 'loadDemo', ...demo });
                nav.toast(
                  'Demo data loaded',
                  `${Object.keys(demo.water).length} days · open History`,
                );
              },
            )
          }
        />
        <Row
          label="Start over"
          danger
          onPress={() =>
            confirm(
              'Start over?',
              'Your log and goals are erased and the onboarding starts again.',
              () => dispatch({ type: 'reset', state: createSeedState(today) }),
            )
          }
        />
      </View>

      <EditSheet
        visible={sheet === 'name'}
        title="Your name"
        onClose={() => setSheet(null)}
      >
        <LineField
          label="Name"
          value={text}
          onChangeText={setText}
          autoFocus
          style={styles.mt16}
        />
        <View style={styles.mt20}>
          <PrimaryButton
            label="Save"
            disabled={!text.trim()}
            onPress={() => {
              dispatch({ type: 'setName', name: text.trim() });
              setSheet(null);
            }}
          />
        </View>
      </EditSheet>

      <EditSheet
        visible={sheet === 'calories'}
        title="Daily calories"
        onClose={() => setSheet(null)}
      >
        <View style={styles.bigRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
            accessibilityLabel="Daily calories"
            style={[
              styles.bigInput,
              { color: colors.ink, borderBottomColor: colors.line },
            ]}
          />
          <Text style={[styles.unit, { color: colors.ink3 }]}>kcal</Text>
        </View>
        <Body style={[styles.mt8, styles.small]}>
          Grams of each macro follow the new total, keeping the split.
        </Body>
        <View style={styles.mt20}>
          <PrimaryButton
            label="Save"
            disabled={!(Number(text) >= 1000 && Number(text) <= 6000)}
            onPress={() => {
              const kcal = Math.round(Number(text) / 50) * 50;
              setGoals(
                { calories: kcal, ...gramsFromSplit(kcal, current) },
                `Daily target · ${fmt(kcal)} kcal`,
              );
            }}
          />
          {planGoals && (
            <GhostButton
              label={`Use my plan (${fmt(planGoals.calories)} kcal)`}
              onPress={() => setGoals(planGoals, 'Targets back to your plan')}
            />
          )}
        </View>
      </EditSheet>

      <EditSheet
        visible={sheet === 'split'}
        title="Macro split"
        onClose={() => setSheet(null)}
      >
        <View style={styles.mt16}>
          <SplitBar
            protein={split.protein}
            carbs={split.carbs}
            fat={split.fat}
          />
        </View>
        {(
          [
            ['protein', 'Protein', colors.protein],
            ['carbs', 'Carbs', colors.carbs],
            ['fat', 'Fat', colors.fat],
          ] as const
        ).map(([key, label]) => {
          const grams = gramsFromSplit(goals.calories, split)[key];
          return (
            <View
              key={key}
              style={[styles.row, { borderBottomColor: colors.line }]}
            >
              <View style={styles.flex}>
                <Text style={[styles.rowText, { color: colors.ink }]}>
                  {label}
                </Text>
                <Text style={[styles.small, { color: colors.ink2 }]}>
                  {grams} g a day
                </Text>
              </View>
              <RoundButton
                icon="minus"
                size={40}
                label={`Less ${label}`}
                onPress={() =>
                  setSplit(s => ({ ...s, [key]: Math.max(5, s[key] - 5) }))
                }
              />
              <Text style={[styles.percent, { color: colors.ink }]}>
                {split[key]}%
              </Text>
              <RoundButton
                icon="add"
                size={40}
                label={`More ${label}`}
                onPress={() =>
                  setSplit(s => ({ ...s, [key]: Math.min(80, s[key] + 5) }))
                }
              />
            </View>
          );
        })}
        <Text
          style={[
            styles.note,
            {
              color:
                split.protein + split.carbs + split.fat === 100
                  ? colors.ink3
                  : colors.accent,
            },
          ]}
        >
          Total {split.protein + split.carbs + split.fat}% · it has to be 100%.
        </Text>
        <View style={styles.mt16}>
          <PrimaryButton
            label="Save"
            disabled={split.protein + split.carbs + split.fat !== 100}
            onPress={() =>
              setGoals(
                gramsFromSplit(goals.calories, split),
                'Macro split saved',
              )
            }
          />
        </View>
      </EditSheet>

      <EditSheet
        visible={sheet === 'water'}
        title="Water a day"
        onClose={() => setSheet(null)}
      >
        <View style={[styles.waterRow, styles.mt16]}>
          <RoundButton
            icon="minus"
            label="Less water"
            onPress={() => setWater(w => Math.max(4, w - 1))}
          />
          <Text>
            <Text style={[styles.waterValue, { color: colors.ink }]}>
              {water * 0.25}
            </Text>
            <Text style={[styles.unit, { color: colors.ink2 }]}> L</Text>
          </Text>
          <RoundButton
            icon="add"
            label="More water"
            onPress={() => setWater(w => Math.min(24, w + 1))}
          />
        </View>
        <Body style={[styles.mt8, styles.small, styles.center]}>
          {water} glasses of 250 ml
        </Body>
        <View style={styles.mt20}>
          <PrimaryButton
            label="Save"
            onPress={() =>
              setGoals({ water }, `Water · ${water * 0.25} L a day`)
            }
          />
        </View>
      </EditSheet>

      <EditSheet
        visible={sheet === 'how'}
        title="How we calculate"
        onClose={() => setSheet(null)}
      >
        <Body style={styles.mt8}>
          Resting burn uses the Mifflin–St Jeor formula: 10 × weight + 6.25 ×
          height − 5 × age, + 5 for men or − 161 for women. It is multiplied by
          your activity, then the goal adds or removes 1,100 kcal per kg a week.
          Protein is 2 g per kg, fat 30% of the calories and carbs the rest.
          Water is 33 ml per kg.
        </Body>
        {profile && plan && (
          <View style={styles.mt16}>
            {[
              ['Resting burn', `${fmt(plan.bmr)} kcal`],
              [
                `× ${ACTIVITIES[profile.activity].factor} activity`,
                `${fmt(plan.tdee)} kcal`,
              ],
              [
                'Goal',
                `${
                  plan.adjustment > 0 ? '+' : plan.adjustment < 0 ? '−' : '±'
                }${fmt(Math.abs(plan.adjustment))} kcal`,
              ],
              ['Your plan', `${fmt(plan.kcal)} kcal`],
            ].map(([l, v]) => (
              <View
                key={l}
                style={[styles.howRow, { borderTopColor: colors.line }]}
              >
                <Text style={[styles.small, { color: colors.ink2 }]}>{l}</Text>
                <Text style={[styles.rowText, { color: colors.ink }]}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </EditSheet>

      <EditSheet
        visible={sheet === 'privacy'}
        title="Privacy"
        onClose={() => setSheet(null)}
      >
        <Body style={styles.mt8}>
          This demo keeps everything on your phone: your plan, meals, water and
          weight. Nothing is sent to a server. “Start over” erases it all.
        </Body>
      </EditSheet>

      <EditSheet
        visible={sheet === 'account'}
        title="Create your account"
        onClose={() => setSheet(null)}
      >
        <Body style={styles.mt8}>
          Keep your plan and meals safe if you change phones.
        </Body>
        <View style={[styles.gap10, styles.mt16]}>
          <SsoButton
            provider="apple"
            onPress={() => {
              dispatch({ type: 'createAccount' });
              setSheet(null);
              nav.toast('Account created');
            }}
          />
          <SsoButton
            provider="google"
            onPress={() => {
              dispatch({ type: 'createAccount' });
              setSheet(null);
              nav.toast('Account created');
            }}
          />
        </View>
        <OrDivider />
        <LineField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
        />
        <LineField
          label="Password"
          value={pw}
          onChangeText={setPw}
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 8 characters"
          style={styles.mt8}
        />
        <View style={styles.mt20}>
          <PrimaryButton
            label="Create account"
            disabled={!(EMAIL_RE.test(email) && pw.length >= 8)}
            onPress={() => {
              dispatch({ type: 'createAccount' });
              setSheet(null);
              nav.toast('Account created', email);
            }}
          />
        </View>
      </EditSheet>
    </ScrollView>
  );
}

function Section({ title }: { title: string }) {
  return <Overline style={styles.section}>{title}</Overline>;
}

function Tag() {
  const colors = useColors();
  return (
    <View style={[styles.tag, { backgroundColor: colors.soft }]}>
      <Text style={[styles.tagText, { color: colors.primary }]}>Custom</Text>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  unit,
  tag,
  danger,
  onPress,
}: {
  icon?: IconName;
  label: string;
  value?: string;
  unit?: string;
  tag?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.line }]}
      accessibilityRole="button"
    >
      {icon && (
        <Icon name={icon} size={24} color={colors.primary} strokeWidth={1.5} />
      )}
      <Text
        style={[
          styles.rowLabel,
          { color: danger ? colors.accent : colors.ink },
        ]}
      >
        {label}
      </Text>
      {tag && <Tag />}
      {value !== undefined && (
        <Text style={[styles.rowValue, { color: colors.ink }]}>{value}</Text>
      )}
      {unit && (
        <Text style={[styles.small, { color: colors.ink3 }]}>{unit}</Text>
      )}
      <Icon name="forward" size={18} color={colors.ink3} strokeWidth={1.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -0.7,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
  mt16: {
    marginTop: 16,
  },
  mt20: {
    marginTop: 20,
  },
  gap10: {
    gap: 10,
  },
  center: {
    textAlign: 'center',
  },
  small: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  account: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...leaf(22, 6),
  },
  accountTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  profile: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...leaf(32, 8),
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(32, 8),
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: 32,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 24,
  },
  summary: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 13.5,
  },
  edit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingTop: 26,
    paddingBottom: 6,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  rowText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  rowValue: {
    fontFamily: fonts.display,
    fontSize: 22,
  },
  splitRow: {
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  splitLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tag: {
    height: 20,
    paddingHorizontal: 8,
    justifyContent: 'center',
    ...leaf(10, 3),
  },
  tagText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
  },
  note: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  bigInput: {
    minWidth: 150,
    fontFamily: fonts.display,
    fontSize: 52,
    padding: 0,
    borderBottomWidth: 1.5,
  },
  unit: {
    fontFamily: fonts.sans,
    fontSize: 17,
  },
  percent: {
    width: 56,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 22,
  },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waterValue: {
    fontFamily: fonts.display,
    fontSize: 56,
  },
  howRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
  },
});
