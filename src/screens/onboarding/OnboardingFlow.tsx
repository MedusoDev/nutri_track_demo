// Section 02: Goal -> Body -> Pace (lose / gain only) -> Building your plan -> Your targets -> Save your plan.
// Reference: new-design/02-onboarding/OnboardingFlow.dc.html. The maths lives in utils/plan.ts.
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';
import { AnimatedPlate } from '../../components/AnimatedPlate';
import { Icon, IconName } from '../../components/Icon';
import {
  BackButton,
  Body,
  Display,
  ErrorText,
  GhostButton,
  IconTile,
  LeafMark,
  LineField,
  OrDivider,
  Overline,
  Press,
  PrimaryButton,
  Segmented,
  Slide,
  SsoButton,
} from '../../components/kit';
import { LEAF_PATH, LEAVES, PLATE_BODY } from '../../components/Logo';
import { fixed, fonts, leaf, overline, useColors } from '../../theme';
import { Goals } from '../../types';
import {
  ACTIVITIES,
  ageError,
  calculatePlan,
  formatWeight,
  GOAL_NAMES,
  GoalKind,
  goalsFromPlan,
  heightError,
  LB_PER_KG,
  pacesFor,
  Profile,
  reachDate,
  Sex,
  targetError,
  weightError,
} from '../../utils/plan';
import { EMAIL_RE } from './LoginScreen';

type Step = 'goal' | 'body' | 'pace' | 'calc' | 'result' | 'signup';
const ORDER: Step[] = ['goal', 'body', 'pace', 'calc', 'result', 'signup'];

const GOALS: {
  id: GoalKind;
  title: string;
  subtitle: string;
  icon: IconName;
}[] = [
  {
    id: 'lose',
    title: 'Lose weight',
    subtitle: 'A gentle deficit, at your pace',
    icon: 'goalLose',
  },
  {
    id: 'maintain',
    title: 'Maintain',
    subtitle: 'Eat to stay where you are, and feel steady',
    icon: 'goalMaintain',
  },
  {
    id: 'gain',
    title: 'Gain muscle',
    subtitle: 'A small surplus with plenty of protein',
    icon: 'goalGain',
  },
];

const MONO = 'monospace';
const fmt = (x: number) => Math.round(x).toLocaleString('en-US');
const num = (v: string) => {
  const x = parseFloat(v.replace(',', '.'));
  return isNaN(x) ? NaN : x;
};

interface Props {
  onExit: () => void; // back from the first step -> Welcome
  onDone: (profile: Profile, goals: Goals) => void;
}

export function OnboardingFlow({ onExit, onDone }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // ---- answers (kept as text so the fields can be edited freely) ----
  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState<GoalKind>('maintain');
  const [sex, setSex] = useState<Sex>('male');
  const [ageS, setAgeS] = useState('29');
  const [hUnit, setHUnit] = useState<'cm' | 'ft'>('cm');
  const [hS, setHS] = useState('178');
  const [ftS, setFtS] = useState('5');
  const [inS, setInS] = useState('10');
  const [wUnit, setWUnit] = useState<'kg' | 'lb'>('kg');
  const [wS, setWS] = useState('76.0');
  const [activity, setActivity] = useState(1);
  const [targetS, setTargetS] = useState('72');
  const [pace, setPace] = useState(1);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showHow, setShowHow] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [calcTapped, setCalcTapped] = useState(false);

  // Slide direction: forward steps come from the right, going back comes from the left.
  const prevStep = useRef(step);
  const dir = useRef(1);
  if (prevStep.current !== step) {
    dir.current =
      ORDER.indexOf(step) >= ORDER.indexOf(prevStep.current) ? 1 : -1;
    prevStep.current = step;
  }

  // ---- derived values ----
  const age = num(ageS);
  const hCm =
    hUnit === 'cm' ? num(hS) : num(ftS) * 30.48 + (num(inS) || 0) * 2.54;
  const wKg = wUnit === 'kg' ? num(wS) : num(wS) / LB_PER_KG;
  const tKg = wUnit === 'kg' ? num(targetS) : num(targetS) / LB_PER_KG;
  const errors = {
    age: ageError(age),
    height: heightError(hCm),
    weight: weightError(wKg, wUnit),
    target: goal === 'maintain' ? '' : targetError(goal, wKg, tKg, hCm, wUnit),
  };
  const bodyOk = !errors.age && !errors.height && !errors.weight;

  const profile: Profile = {
    goal,
    sex,
    age,
    heightCm: hCm,
    weightKg: wKg,
    activity,
    pace,
    targetKg: goal === 'maintain' ? undefined : tKg,
  };
  const plan = calculatePlan(profile);
  const paces = pacesFor(goal);

  const questionSteps: Step[] =
    goal === 'maintain' ? ['goal', 'body'] : ['goal', 'body', 'pace'];
  const nextOf: Partial<Record<Step, Step>> = {
    goal: 'body',
    body: goal === 'maintain' ? 'calc' : 'pace',
    pace: 'calc',
  };
  const backOf: Partial<Record<Step, Step>> = {
    body: 'goal',
    pace: 'body',
    result: goal === 'maintain' ? 'body' : 'pace',
    signup: 'result',
  };
  const cantGo =
    step === 'body'
      ? !bodyOk
      : step === 'pace'
      ? !!errors.target || !bodyOk
      : false;

  function back() {
    if (skipOpen) {
      setSkipOpen(false);
    } else if (step === 'goal') {
      onExit();
    } else if (backOf[step]) {
      setStep(backOf[step]!);
    }
  }

  // Android back button follows the same rules as the on-screen back arrow.
  const backRef = useRef(back);
  backRef.current = back;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      backRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  // "Building your plan" moves on by itself, slowly enough to read the maths.
  // First tap shows every line at once and moves on sooner; second tap goes straight on.
  useEffect(() => {
    if (step !== 'calc') {
      setCalcTapped(false);
      return;
    }
    const timer = setTimeout(() => setStep('result'), calcTapped ? 2500 : 7000);
    return () => clearTimeout(timer);
  }, [step, calcTapped]);

  const finish = () => onDone(profile, goalsFromPlan(plan));

  function pickGoal(id: GoalKind) {
    setGoal(id);
    setPace(1);
    const target = id === 'gain' ? 80 : 72;
    setTargetS(
      wUnit === 'kg' ? String(target) : String(Math.round(target * LB_PER_KG)),
    );
  }

  function changeHeightUnit(unit: 'cm' | 'ft') {
    if (unit === hUnit) {
      return;
    }
    if (unit === 'cm') {
      setHS(isFinite(hCm) ? String(Math.round(hCm)) : '');
    } else {
      const inches = hCm / 2.54;
      setFtS(isFinite(inches) ? String(Math.floor(inches / 12)) : '');
      setInS(isFinite(inches) ? String(Math.round(inches % 12)) : '');
    }
    setHUnit(unit);
  }

  function changeWeightUnit(unit: 'kg' | 'lb') {
    if (unit === wUnit) {
      return;
    }
    if (unit === 'kg') {
      setWS(isFinite(wKg) ? wKg.toFixed(1) : '');
      setTargetS(isFinite(tKg) ? tKg.toFixed(1) : '');
    } else {
      setWS(isFinite(wKg) ? String(Math.round(wKg * LB_PER_KG)) : '');
      setTargetS(isFinite(tKg) ? String(Math.round(tKg * LB_PER_KG)) : '');
    }
    setWUnit(unit);
  }

  const summary = `${GOAL_NAMES[goal]} · ${
    isFinite(wKg) ? formatWeight(wKg, wUnit) : '–'
  } · ${ACTIVITIES[activity].title.toLowerCase()}`;
  const clampNote = plan.clamped
    ? `We kept your target at ${fmt(
        plan.floor,
      )} kcal, the safe minimum, instead of ${fmt(plan.rawKcal)}.`
    : '';
  const macroList = [
    {
      name: 'Protein',
      grams: plan.protein,
      color: colors.protein,
      note: '2.0 g per kg',
    },
    { name: 'Carbs', grams: plan.carbs, color: colors.carbs, note: 'the rest' },
    { name: 'Fat', grams: plan.fat, color: colors.fat, note: '30% of kcal' },
  ];

  // ================= QUESTION STEPS =================
  if (step === 'goal' || step === 'body' || step === 'pace') {
    const idx = Math.max(0, questionSteps.indexOf(step));
    const barColors = [colors.protein, colors.carbs, colors.fat];
    const label = `Step ${idx + 1} of ${questionSteps.length}`;
    return (
      <View
        style={[
          styles.flex,
          { backgroundColor: colors.bg, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <BackButton onPress={back} />
          <View style={styles.bars} accessibilityLabel={label}>
            {questionSteps.map((key, i) => (
              <View
                key={key}
                style={[
                  styles.bar,
                  {
                    width: i === idx ? 34 : 16,
                    backgroundColor: i <= idx ? barColors[i] : colors.line,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <Slide key={step} dir={dir.current}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Overline>{label}</Overline>

            {step === 'goal' && (
              <>
                <Display size={36} style={styles.mt10}>
                  What are you growing toward?
                </Display>
                <Body style={styles.mt10}>
                  We'll shape your daily target around this. You can change it
                  any time.
                </Body>
                <View style={styles.options}>
                  {GOALS.map(g => {
                    const on = g.id === goal;
                    return (
                      <Press
                        key={g.id}
                        onPress={() => pickGoal(g.id)}
                        accessibilityState={{ selected: on }}
                        style={[styles.option, optionStyle(on, colors)]}
                      >
                        <IconTile name={g.icon} on={on} />
                        <View style={styles.flex}>
                          <Display size={22}>{g.title}</Display>
                          <Text
                            style={[styles.optionSub, { color: colors.ink2 }]}
                          >
                            {g.subtitle}
                          </Text>
                        </View>
                      </Press>
                    );
                  })}
                </View>
              </>
            )}

            {step === 'body' && (
              <>
                <Display size={34} style={styles.mt8}>
                  A little about you
                </Display>
                <Body style={[styles.mt8, styles.small]}>
                  Used only to estimate how much energy your body burns.
                </Body>

                <View style={[styles.rowBetween, styles.mt20]}>
                  <View>
                    <Overline>Sex</Overline>
                    <Text style={[styles.caption, { color: colors.ink3 }]}>
                      For the calorie formula
                    </Text>
                  </View>
                  <Segmented
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                    value={sex}
                    onChange={setSex}
                  />
                </View>

                <View style={[styles.grid, styles.mt18]}>
                  <View style={styles.ageCol}>
                    <View style={styles.fieldHead}>
                      <Overline>Age</Overline>
                    </View>
                    <BigField bad={!!errors.age}>
                      <BigInput
                        value={ageS}
                        onChangeText={setAgeS}
                        label="Age"
                      />
                      <Unit>yrs</Unit>
                    </BigField>
                  </View>
                  <View style={styles.heightCol}>
                    <View style={styles.fieldHead}>
                      <Overline>Height</Overline>
                      <Segmented
                        small
                        options={[
                          { value: 'cm', label: 'cm' },
                          { value: 'ft', label: 'ft' },
                        ]}
                        value={hUnit}
                        onChange={changeHeightUnit}
                      />
                    </View>
                    <BigField bad={!!errors.height}>
                      {hUnit === 'cm' ? (
                        <>
                          <BigInput
                            value={hS}
                            onChangeText={setHS}
                            label="Height in centimetres"
                          />
                          <Unit>cm</Unit>
                        </>
                      ) : (
                        <>
                          <BigInput
                            value={ftS}
                            onChangeText={setFtS}
                            label="Feet"
                          />
                          <Unit>ft</Unit>
                          <BigInput
                            value={inS}
                            onChangeText={setInS}
                            label="Inches"
                          />
                          <Unit>in</Unit>
                        </>
                      )}
                    </BigField>
                  </View>
                </View>
                {!!errors.age && <ErrorText>{errors.age}</ErrorText>}
                {!!errors.height && <ErrorText>{errors.height}</ErrorText>}

                <View style={styles.mt18}>
                  <View style={styles.fieldHead}>
                    <Overline>Weight</Overline>
                    <Segmented
                      small
                      options={[
                        { value: 'kg', label: 'kg' },
                        { value: 'lb', label: 'lb' },
                      ]}
                      value={wUnit}
                      onChange={changeWeightUnit}
                    />
                  </View>
                  <BigField bad={!!errors.weight}>
                    <BigInput
                      value={wS}
                      onChangeText={setWS}
                      label="Weight"
                      decimal
                    />
                    <Unit>{wUnit}</Unit>
                  </BigField>
                  {!!errors.weight && <ErrorText>{errors.weight}</ErrorText>}
                </View>

                <Overline style={styles.listTitle}>
                  How active are your days?
                </Overline>
                <View style={styles.gap8}>
                  {ACTIVITIES.map((a, i) => {
                    const on = i === activity;
                    return (
                      <Press
                        key={a.title}
                        onPress={() => setActivity(i)}
                        accessibilityState={{ selected: on }}
                        style={[styles.act, actStyle(on, colors)]}
                      >
                        <LeafMark on={on} />
                        <View style={styles.flex}>
                          <Text
                            style={[styles.actTitle, { color: colors.ink }]}
                          >
                            {a.title}
                          </Text>
                          <Text style={[styles.actSub, { color: colors.ink2 }]}>
                            {a.subtitle}
                          </Text>
                        </View>
                        <Text style={[styles.mono, { color: colors.ink3 }]}>
                          ×{a.factor}
                        </Text>
                      </Press>
                    );
                  })}
                </View>
              </>
            )}

            {step === 'pace' && (
              <>
                <Display size={34} style={styles.mt8}>
                  {goal === 'gain'
                    ? 'How fast do you want to gain?'
                    : 'How fast do you want to lose?'}
                </Display>
                <Body style={[styles.mt8, styles.small]}>
                  Slower changes are easier to keep. You can adjust this later.
                </Body>
                <View style={styles.mt20}>
                  <View style={styles.fieldHead}>
                    <Overline>Goal weight</Overline>
                  </View>
                  <BigField bad={!!errors.target}>
                    <BigInput
                      value={targetS}
                      onChangeText={setTargetS}
                      label="Goal weight"
                      decimal
                    />
                    <Unit>{wUnit}</Unit>
                    <Text style={[styles.now, { color: colors.ink3 }]}>
                      now {isFinite(wKg) ? formatWeight(wKg, wUnit) : '–'}
                    </Text>
                  </BigField>
                  {!!errors.target && <ErrorText>{errors.target}</ErrorText>}
                </View>

                <Overline style={styles.listTitle}>Pace</Overline>
                <View style={styles.gap10}>
                  {paces.map((p, i) => {
                    const on = i === pace;
                    const names =
                      goal === 'gain'
                        ? ['Lean', 'Steady', 'Fast']
                        : ['Gentle', 'Steady', 'Fast'];
                    const rate =
                      wUnit === 'kg'
                        ? `${p} kg/week`
                        : `${(p * LB_PER_KG).toFixed(1)} lb/week`;
                    const kcal = bodyOk
                      ? `${fmt(calculatePlan(profile, i).kcal)} kcal`
                      : '–';
                    const date =
                      errors.target || !isFinite(tKg)
                        ? 'Set a goal weight to see a date'
                        : `Reach ${formatWeight(tKg, wUnit)} around ${reachDate(
                            wKg,
                            tKg,
                            p,
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}`;
                    const warn =
                      i === 2
                        ? goal === 'gain'
                          ? 'More of the gain tends to be fat'
                          : 'Harder to stick with'
                        : '';
                    return (
                      <Press
                        key={p}
                        onPress={() => setPace(i)}
                        accessibilityState={{ selected: on }}
                        style={[
                          styles.act,
                          styles.paceOption,
                          actStyle(on, colors),
                        ]}
                      >
                        <LeafMark on={on} />
                        <View style={styles.flex}>
                          <View style={styles.rowBetween}>
                            <Text
                              style={[styles.actTitle, { color: colors.ink }]}
                            >
                              {names[i]} · {rate}
                            </Text>
                            <Display size={18}>{kcal}</Display>
                          </View>
                          <Text style={[styles.actSub, { color: colors.ink2 }]}>
                            {date}
                          </Text>
                          {!!warn && (
                            <Text
                              style={[styles.actSub, { color: colors.accent }]}
                            >
                              {warn}
                            </Text>
                          )}
                        </View>
                      </Press>
                    );
                  })}
                </View>
                {!!clampNote && <Note>{clampNote}</Note>}
              </>
            )}
          </ScrollView>
        </Slide>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.bg, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <PrimaryButton
            label="Continue"
            arrow
            disabled={cantGo}
            onPress={() => setStep(nextOf[step]!)}
          />
        </View>
      </View>
    );
  }

  // ================= BUILDING YOUR PLAN =================
  if (step === 'calc') {
    const goalLine =
      goal === 'maintain'
        ? '±0 kcal'
        : `${plan.adjustment < 0 ? '− ' : '+ '}${fmt(
            Math.abs(plan.adjustment),
          )} kcal`;
    const lines = [
      {
        label: 'Resting burn (BMR)',
        value: `${fmt(plan.bmr)} kcal`,
        delay: 900,
        size: 20,
      },
      {
        label: `× ${ACTIVITIES[activity].factor}, ${ACTIVITIES[
          activity
        ].title.toLowerCase()}`,
        value: `${fmt(plan.tdee)} kcal`,
        delay: 2100,
        size: 20,
      },
      {
        label: `Goal: ${GOAL_NAMES[goal].toLowerCase()}`,
        value: goalLine,
        delay: 3300,
        size: 20,
      },
      {
        label: 'Your daily target',
        value: `${fmt(plan.kcal)} kcal`,
        delay: 4500,
        size: 28,
      },
    ];
    return (
      <Slide
        key="calc"
        dir={dir.current}
        style={{ backgroundColor: colors.bg }}
      >
        <Pressable
          style={[styles.flex, styles.calc]}
          onPress={() => (calcTapped ? setStep('result') : setCalcTapped(true))}
          accessibilityHint="Tap to go faster"
        >
          <AnimatedPlate
            size={150}
            tone="light"
            sway={false}
            shadow={false}
            leafDelays={[100, 350, 600]}
          />
          <Display size={30} style={styles.mt16}>
            Building your plan
          </Display>
          <View style={styles.calcLines}>
            {lines.map(line => (
              <FadeIn key={line.label} delay={calcTapped ? 0 : line.delay}>
                <View
                  style={[styles.calcLine, { borderTopColor: colors.line }]}
                >
                  <Text style={[styles.calcLabel, { color: colors.ink2 }]}>
                    {line.label}
                  </Text>
                  <Display size={line.size}>{line.value}</Display>
                </View>
              </FadeIn>
            ))}
          </View>
          <Text style={[styles.calcHint, { color: colors.ink3 }]}>
            {calcTapped ? 'Tap again to see your plan' : 'Tap to go faster'}
          </Text>
        </Pressable>
      </Slide>
    );
  }

  // ================= YOUR TARGETS =================
  if (step === 'result') {
    const total = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;
    const eq =
      `${fmt(plan.bmr)} × ${ACTIVITIES[activity].factor} = ${fmt(plan.tdee)}` +
      (plan.adjustment
        ? `${plan.adjustment < 0 ? ' − ' : ' + '}${fmt(
            Math.abs(plan.adjustment),
          )} = ${fmt(plan.rawKcal)}`
        : '') +
      ` → ${fmt(plan.kcal)} kcal`;
    const how = [
      {
        label: 'BMR (Mifflin–St Jeor)',
        value: `10×${isFinite(wKg) ? wKg.toFixed(1) : '–'} + 6.25×${Math.round(
          hCm,
        )} − 5×${age}${sex === 'male' ? ' + 5' : ' − 161'} = ${fmt(plan.bmr)}`,
      },
      {
        label: 'Activity',
        value: `× ${ACTIVITIES[activity].factor} = ${fmt(plan.tdee)}`,
      },
      {
        label: 'Goal',
        value:
          goal === 'maintain'
            ? '±0'
            : `${plan.adjustment < 0 ? '−' : '+'}${fmt(
                Math.abs(plan.adjustment),
              )} (${paces[pace]} kg/wk × 7,700 ÷ 7)`,
      },
      { label: 'Rounded to 50', value: `${fmt(plan.kcal)} kcal` },
      {
        label: 'Protein · fat · carbs',
        value: `${plan.protein} g · ${plan.fat} g · ${plan.carbs} g`,
      },
      { label: 'Water', value: `33 ml × kg = ${plan.waterL} L` },
    ];
    return (
      <Slide
        key="result"
        dir={dir.current}
        style={{ backgroundColor: colors.bg }}
      >
        <View
          style={[
            styles.resultHero,
            { paddingTop: insets.top, height: insets.top + 297 },
          ]}
        >
          <DecorLeaves />
          <View style={styles.header}>
            <BackButton onPress={back} color="rgba(246,241,231,0.8)" />
          </View>
          <View style={styles.resultTop}>
            <Text style={[overline, styles.heroOverline]}>
              Your daily target
            </Text>
            <Text style={styles.resultNumber}>{fmt(plan.kcal)}</Text>
            <Text style={styles.resultUnit}>kcal a day</Text>
            <Text style={styles.resultSummary}>{summary}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.resultScroll}>
          <View
            style={styles.split}
            accessibilityLabel={`Protein ${plan.protein} grams, carbs ${plan.carbs} grams, fat ${plan.fat} grams`}
          >
            <View
              style={[
                styles.splitStart,
                {
                  flex: (plan.protein * 4) / total,
                  backgroundColor: colors.protein,
                },
              ]}
            />
            <View
              style={{
                flex: (plan.carbs * 4) / total,
                backgroundColor: colors.carbs,
              }}
            />
            <View
              style={[
                styles.splitEnd,
                { flex: (plan.fat * 9) / total, backgroundColor: colors.fat },
              ]}
            />
          </View>
          <View style={styles.macroCols}>
            {macroList.map((m, i) => (
              <View
                key={m.name}
                style={[
                  styles.macroCol,
                  i > 0 && {
                    paddingLeft: 12,
                    borderLeftWidth: 1,
                    borderLeftColor: colors.line,
                  },
                ]}
              >
                <View style={styles.dotRow}>
                  <View style={[styles.dot, { backgroundColor: m.color }]} />
                  <Text style={[styles.macroName, { color: colors.ink2 }]}>
                    {m.name}
                  </Text>
                </View>
                <Text>
                  <Text style={[styles.macroGrams, { color: colors.ink }]}>
                    {m.grams}
                  </Text>
                  <Text style={[styles.macroUnit, { color: colors.ink3 }]}>
                    {' '}
                    g
                  </Text>
                </Text>
                <Text style={[styles.macroNote, { color: colors.ink3 }]}>
                  {m.note}
                </Text>
              </View>
            ))}
          </View>
          <View style={[styles.waterLine, { borderTopColor: colors.line }]}>
            <Icon
              name="waterDrop"
              size={24}
              color={colors.water}
              strokeWidth={1.5}
            />
            <Text style={[styles.waterText, { color: colors.ink }]}>
              <Text style={{ fontFamily: fonts.sansSemiBold }}>
                {plan.waterL} L
              </Text>{' '}
              of water a day
            </Text>
          </View>
          {!!clampNote && <Note>{clampNote}</Note>}

          <Pressable
            onPress={() => setShowHow(v => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showHow }}
            style={[styles.howToggle, { borderTopColor: colors.line }]}
          >
            <Text style={[styles.howTitle, { color: colors.primary }]}>
              How we calculated this
            </Text>
            <View style={showHow && styles.rotated}>
              <Icon
                name="chevronDown"
                size={18}
                color={colors.primary}
                strokeWidth={1.5}
              />
            </View>
          </Pressable>
          <Text style={[styles.mono, { color: colors.ink2 }]}>{eq}</Text>
          {showHow && (
            <View style={styles.mt8}>
              {how.map(row => (
                <View
                  key={row.label}
                  style={[styles.howRow, { borderTopColor: colors.line }]}
                >
                  <Text style={[styles.howLabel, { color: colors.ink2 }]}>
                    {row.label}
                  </Text>
                  <Text
                    style={[
                      styles.mono,
                      styles.howValue,
                      { color: colors.ink },
                    ]}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
              <Text style={[styles.howFoot, { color: colors.ink3 }]}>
                Mifflin–St Jeor estimate. Real needs vary by about ±10%; we'll
                nudge your target as your weight trend comes in.
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            styles.gap2,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <PrimaryButton
            label="Save my plan"
            arrow
            onPress={() => setStep('signup')}
          />
          <GhostButton
            label="Adjust my answers"
            onPress={() => setStep('goal')}
          />
        </View>
      </Slide>
    );
  }

  // ================= SAVE YOUR PLAN =================
  const emailOk = EMAIL_RE.test(email);
  const pwOk = pw.length >= 8;
  return (
    <Slide
      key="signup"
      dir={dir.current}
      style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      <View style={styles.header}>
        <BackButton onPress={back} />
      </View>
      <ScrollView
        contentContainerStyle={styles.signupScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Overline>Last step</Overline>
        <Display size={34} style={styles.mt8}>
          Save your plan
        </Display>
        <Body style={[styles.mt8, styles.small]}>
          Create an account so your plan and meals are safe if you change
          phones.
        </Body>

        <View style={[styles.planCard, { backgroundColor: colors.soft }]}>
          <View style={styles.flex}>
            <Text>
              <Text style={[styles.planKcal, { color: colors.ink }]}>
                {fmt(plan.kcal)}{' '}
              </Text>
              <Text style={[styles.caption, { color: colors.ink2 }]}>
                kcal / day
              </Text>
            </Text>
            <Text style={[styles.caption, styles.mt4, { color: colors.ink2 }]}>
              {summary}
            </Text>
          </View>
          <View style={styles.gap3}>
            {macroList.map(m => (
              <View key={m.name} style={styles.dotRow}>
                <View style={[styles.dot, { backgroundColor: m.color }]} />
                <Text style={[styles.caption, { color: colors.ink }]}>
                  {m.grams} g
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.gap10, styles.mt18]}>
          <SsoButton provider="apple" onPress={finish} />
          <SsoButton provider="google" onPress={finish} />
        </View>
        <OrDivider />
        <LineField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
          error={!!email && !emailOk}
        />
        {!!email && !emailOk && (
          <ErrorText>That email looks incomplete.</ErrorText>
        )}
        <LineField
          label="Password"
          value={pw}
          onChangeText={setPw}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          style={styles.mt10}
        />
        <View style={[styles.dotRow, styles.mt6]}>
          <Icon
            name={pwOk ? 'tick' : 'dash'}
            size={16}
            color={pwOk ? colors.primary : colors.ink3}
            strokeWidth={1.5}
          />
          <Text
            style={[
              styles.caption,
              { color: pwOk ? colors.primary : colors.ink3 },
            ]}
          >
            At least 8 characters
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          styles.gap2,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <PrimaryButton
          label="Create account"
          disabled={!(emailOk && pwOk)}
          onPress={finish}
        />
        <GhostButton
          label="Skip for now"
          color={colors.ink3}
          onPress={() => setSkipOpen(true)}
        />
      </View>

      <Modal
        visible={skipOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setSkipOpen(false)}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSkipOpen(false)}
          />
          <View
            style={[
              styles.skipSheet,
              { backgroundColor: colors.bg, paddingBottom: insets.bottom + 34 },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.line }]} />
            <Display size={26}>Use Nutri Track without an account?</Display>
            <Body style={[styles.mt10, styles.skipText]}>
              Your plan and meals stay on this phone only. If you delete the app
              or switch phones, they're gone.
            </Body>
            <Body style={[styles.mt8, styles.skipText]}>
              You can create an account any time in Settings, and everything you
              logged comes with you.
            </Body>
            <View style={[styles.gap4, styles.mt20]}>
              <PrimaryButton
                label="Create an account"
                onPress={() => setSkipOpen(false)}
              />
              <GhostButton
                label="Continue without an account"
                color={colors.ink2}
                onPress={() => {
                  setSkipOpen(false);
                  finish();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Slide>
  );
}

// ---------------- small pieces ----------------

type C = ReturnType<typeof useColors>;

const optionStyle = (on: boolean, c: C) =>
  on
    ? {
        backgroundColor: c.soft,
        borderColor: c.primary,
        borderWidth: 2,
        padding: 13,
      }
    : {
        backgroundColor: c.surface,
        borderColor: c.line,
        borderWidth: 1.5,
        padding: 14,
      };

const actStyle = (on: boolean, c: C) =>
  on
    ? { backgroundColor: c.soft, borderColor: c.primary, borderWidth: 2 }
    : { backgroundColor: c.surface, borderColor: c.line, borderWidth: 1.5 };

function BigField({ bad, children }: { bad: boolean; children: ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.bigField,
        {
          borderBottomColor: bad ? colors.accent : colors.line,
          borderBottomWidth: bad ? 2.5 : 1.5,
        },
      ]}
    >
      {children}
    </View>
  );
}

/** Width follows the typed value, so the unit sits right after the number. */
function BigInput({
  value,
  onChangeText,
  label,
  decimal,
}: {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  decimal?: boolean;
}) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      accessibilityLabel={label}
      selectTextOnFocus
      style={[
        styles.bigInput,
        { width: Math.max(1, value.length) * 23 + 6, color: colors.ink },
      ]}
    />
  );
}

function Unit({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.unit, { color: colors.ink3 }]}>{children}</Text>;
}

function Note({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.note, { backgroundColor: colors.accentSoft }]}>
      <Text style={[styles.noteText, { color: colors.ink }]}>{children}</Text>
    </View>
  );
}

/** Fade + rise 8 px after a delay (calc lines). */
function FadeIn({ delay, children }: { delay: number; children: ReactNode }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [value, delay]);
  return (
    <Animated.View
      style={{
        opacity: value,
        transform: [
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Faint logo leaves behind the big number on the result hero. */
function DecorLeaves() {
  const colors = fixed.leavesOnDark;
  return (
    <View style={styles.decor} pointerEvents="none">
      <Svg width={230} height={230} viewBox="0 0 200 200">
        {LEAVES.map(l => (
          <G
            key={l.key}
            transform={`translate(100 146) rotate(${l.rest}) scale(${l.scale})`}
          >
            <Path
              transform="translate(0 -12)"
              d={LEAF_PATH}
              fill={colors[l.key]}
            />
          </G>
        ))}
        <Path d={PLATE_BODY} fill={fixed.cream} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingLeft: 8,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 44,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    height: 8,
    ...leaf(5, 2),
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
  mt16: { marginTop: 16 },
  mt18: { marginTop: 18 },
  mt20: { marginTop: 20 },
  gap2: { gap: 2 },
  gap3: { gap: 3 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap10: { gap: 10 },
  small: {
    fontSize: 14,
    lineHeight: 19,
  },
  options: {
    gap: 12,
    marginTop: 26,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 84,
    borderRadius: 22,
  },
  optionSub: {
    marginTop: 3,
    fontFamily: fonts.sans,
    fontSize: 13.5,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    gap: 24,
  },
  ageCol: {
    flex: 0.8,
  },
  heightCol: {
    flex: 1.2,
  },
  fieldHead: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bigField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingTop: 2,
    paddingBottom: 4,
  },
  bigInput: {
    fontFamily: fonts.display,
    fontSize: 40,
    height: 52,
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'bottom',
    letterSpacing: -0.8,
  },
  unit: {
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingBottom: 9,
  },
  now: {
    marginLeft: 'auto',
    paddingBottom: 9,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  listTitle: {
    marginTop: 22,
    marginBottom: 10,
  },
  act: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  paceOption: {
    minHeight: 72,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  actTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  actSub: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    marginTop: 2,
  },
  mono: {
    fontFamily: MONO,
    fontSize: 12,
  },
  note: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...leaf(14, 4),
  },
  noteText: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  calc: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  calcHint: {
    position: 'absolute',
    bottom: 48,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  calcLines: {
    alignSelf: 'stretch',
    marginTop: 22,
  },
  calcLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  calcLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  resultHero: {
    backgroundColor: '#2F4A33',
    overflow: 'hidden',
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 64,
  },
  decor: {
    position: 'absolute',
    right: -56,
    top: 70,
    opacity: 0.22,
  },
  resultTop: {
    paddingHorizontal: 24,
    paddingTop: 11,
  },
  heroOverline: {
    color: 'rgba(246,241,231,0.75)',
  },
  resultNumber: {
    marginTop: 8,
    fontFamily: fonts.display,
    fontSize: 100,
    lineHeight: 96,
    letterSpacing: -4.5,
    color: fixed.cream,
  },
  resultUnit: {
    marginTop: 10,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    color: fixed.cream,
  },
  resultSummary: {
    marginTop: 6,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: 'rgba(246,241,231,0.82)',
  },
  resultScroll: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 10,
  },
  split: {
    flexDirection: 'row',
    gap: 3,
    height: 12,
  },
  splitStart: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  splitEnd: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  macroCols: {
    flexDirection: 'row',
    marginTop: 12,
  },
  macroCol: {
    flex: 1,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  macroGrams: {
    fontFamily: fonts.display,
    fontSize: 30,
  },
  macroUnit: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  macroNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  waterLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  waterText: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  howToggle: {
    marginTop: 12,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  howTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  rotated: {
    transform: [{ rotate: '180deg' }],
  },
  howRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
  },
  howLabel: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  howValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  howFoot: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  signupScroll: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 10,
  },
  planCard: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...leaf(22, 6),
  },
  planKcal: {
    fontFamily: fonts.display,
    fontSize: 30,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  skipSheet: {
    paddingTop: 14,
    paddingHorizontal: 24,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 18,
  },
  skipText: {
    fontSize: 14.5,
  },
});
