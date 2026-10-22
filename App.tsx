import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Slide } from './src/components/kit';
import { TAB_BAR_HEIGHT, TabBar } from './src/components/TabBar';
import { Toast, ToastMessage } from './src/components/Toast';
import { MEALS } from './src/data/foods';
import { ForgotPasswordScreen } from './src/screens/onboarding/ForgotPasswordScreen';
import { LoginScreen } from './src/screens/onboarding/LoginScreen';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { WelcomeScreen } from './src/screens/onboarding/WelcomeScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { AppProvider, useApp } from './src/state/AppContext';
import { Nav, NavContext, PlateItem, Route } from './src/state/nav';
import { fixed, fonts, useColors, useIsDark } from './src/theme';
import { Entry, Food, MealType, TabKey } from './src/types';
import { entryNutrition, mealForNow } from './src/utils/nutrition';

interface StackItem {
  id: number;
  route: Route;
  leaving?: boolean;
}

function Main() {
  const { state, dispatch, today } = useApp();
  const colors = useColors();
  const dark = useIsDark();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabKey>('today');
  // A closed screen stays in the stack with `leaving` until its exit animation ends.
  const [stack, setStack] = useState<StackItem[]>([]);
  const live = stack.filter(item => !item.leaving);
  /** Keeps the first `keep` screens; only the top one animates out. */
  const closeTo = useCallback(
    (keep: number) =>
      setStack(s => {
        const open = s.filter(item => !item.leaving);
        if (open.length <= keep) {
          return s;
        }
        return [
          ...open.slice(0, keep),
          { ...open[open.length - 1], leaving: true },
        ];
      }),
    [],
  );
  const closeTop = useCallback(
    () =>
      setStack(s => {
        const open = s.filter(item => !item.leaving);
        if (!open.length) {
          return s;
        }
        const topId = open[open.length - 1].id;
        return s.map(item =>
          item.id === topId ? { ...item, leaving: true } : item,
        );
      }),
    [],
  );
  const [plate, setPlate] = useState<PlateItem[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [highlight, setHighlight] = useState<{
    meal: MealType;
    id: number;
  } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const nav: Nav = useMemo(() => {
    const label = (meal: MealType) => MEALS.find(m => m.key === meal)!.label;
    return {
      push: route => {
        if (
          route.name === 'createFood' ||
          route.name === 'logFood' ||
          route.name === 'foodDetail' ||
          route.name === 'mealDetail'
        ) {
          setToast({
            id: Date.now(),
            title: 'Logging food comes in the next update',
          });
          return;
        }
        setStack(s => [...s, { id: Date.now() + Math.random(), route }]);
      },
      pop: closeTop,
      openTab: next => {
        closeTo(0);
        setTab(next);
      },
      toast: (title, detail) => setToast({ id: Date.now(), title, detail }),
      plate,
      addToPlate: (food: Food, servings: number) =>
        setPlate(p => [
          ...p,
          { key: `${Date.now()}-${p.length}`, food, servings },
        ]),
      removeFromPlate: key => setPlate(p => p.filter(item => item.key !== key)),
      logged: (entries: Entry[]) => {
        if (entries.length === 0) {
          return;
        }
        dispatch({ type: 'addEntries', entries });
        setPlate([]);
        const id = Date.now();
        const date = entries[0].date;
        const kcal = entries.reduce(
          (sum, e) => sum + entryNutrition(e).calories,
          0,
        );
        setStack(s => {
          const open = s.filter(item => !item.leaving);
          const day = open.findIndex(
            item => item.route.name === 'day' && item.route.date === date,
          );
          const keep = day >= 0 ? day + 1 : 0;
          return open.length > keep
            ? [
                ...open.slice(0, keep),
                { ...open[open.length - 1], leaving: true },
              ]
            : open;
        });
        if (date === today) {
          setTab('today');
        }
        setHighlight({ meal: entries[0].meal, id });
        setToast({
          id,
          title: `Added to ${label(entries[0].meal)}`,
          detail:
            entries.length === 1
              ? `${entries[0].food.name} · ${kcal} kcal`
              : `${entries.length} foods · ${kcal} kcal`,
          action: {
            label: 'Undo',
            onPress: () => {
              entries.forEach(e => dispatch({ type: 'removeEntry', id: e.id }));
              setHighlight(null);
            },
          },
        });
      },
      deleted: (entries: Entry[], what: string) => {
        if (entries.length === 0) {
          return;
        }
        entries.forEach(e => dispatch({ type: 'removeEntry', id: e.id }));
        const kcal = entries.reduce(
          (sum, e) => sum + entryNutrition(e).calories,
          0,
        );
        setToast({
          id: Date.now(),
          title: `${what} removed`,
          detail: `${entries.length} ${
            entries.length === 1 ? 'food' : 'foods'
          } · ${kcal} kcal`,
          action: {
            label: 'Undo',
            onPress: () => dispatch({ type: 'addEntries', entries }),
          },
        });
      },
    };
  }, [plate, dispatch, today, closeTo, closeTop]);

  // The new tab slides in from the side of the tab you tapped.
  const fade = useRef(new Animated.Value(1)).current;
  const lastTab = useRef(tab);
  const tabDir = useRef(1);
  if (lastTab.current !== tab) {
    const order: TabKey[] = ['today', 'history', 'foods', 'settings'];
    tabDir.current =
      order.indexOf(tab) >= order.indexOf(lastTab.current) ? 1 : -1;
    lastTab.current = tab;
  }
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 280,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [tab, fade]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (live.length > 0) {
        closeTop();
        return true;
      }
      if (tab !== 'today') {
        setTab('today');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tab, live.length, closeTop]);

  const top = live[live.length - 1]?.route;
  const lightBar = top ? top.name === 'day' || dark : tab === 'today' || dark;

  return (
    <NavContext.Provider value={nav}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={lightBar ? 'light-content' : 'dark-content'} />

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fade,
              transform: [
                {
                  translateX: fade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [tabDir.current * 28, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {tab === 'today' && (
            <TodayScreen date={today} highlight={highlight} />
          )}
          {tab === 'history' && <ComingNext title="History" />}
          {tab === 'foods' && <ComingNext title="Foods" />}
          {tab === 'settings' && <ComingNext title="Settings" />}
        </Animated.View>

        <TabBar
          active={tab}
          onChange={next => setTab(next)}
          onLogFood={() =>
            nav.push({ name: 'logFood', meal: mealForNow(), date: today })
          }
        />

        {stack.map(item => {
          const route = item.route;
          const modal = route.name === 'logFood' || route.name === 'createFood';
          return (
            <View
              key={item.id}
              pointerEvents={item.leaving ? 'none' : 'auto'}
              style={StyleSheet.absoluteFill}
            >
              <Slide
                from={modal ? 'bottom' : 'side'}
                leaving={item.leaving}
                onLeft={() => setStack(s => s.filter(x => x.id !== item.id))}
                style={[modal && styles.sheet, { backgroundColor: colors.bg }]}
              >
                {renderRoute(route, highlight, (profile, goals) => {
                  dispatch({ type: 'updateProfile', profile, goals });
                  closeTop();
                  setToast({
                    id: Date.now(),
                    title: 'Targets updated',
                    detail: `${goals.calories} kcal a day`,
                  });
                })}
              </Slide>
            </View>
          );
        })}

        <Toast
          message={toast}
          bottom={insets.bottom + (top ? 24 : TAB_BAR_HEIGHT + 22)}
          onHide={hideToast}
        />
      </View>
    </NavContext.Provider>
  );

  function renderRoute(
    route: Route,
    flash: typeof highlight,
    onProfileSaved: (
      profile: NonNullable<typeof state.profile>,
      goals: typeof state.goals,
    ) => void,
  ) {
    switch (route.name) {
      case 'day':
        return <TodayScreen date={route.date} highlight={flash} />;
      case 'editProfile':
        return (
          <OnboardingFlow
            initial={state.profile ?? undefined}
            units={state.units}
            onExit={closeTop}
            onDone={(profile, goals) => onProfileSaved(profile, goals)}
          />
        );
    }
  }
}

/** Placeholder for a tab that lands in a later commit. */
function ComingNext({ title }: { title: string }) {
  const colors = useColors();
  return (
    <View
      style={[styles.container, styles.coming, { backgroundColor: colors.bg }]}
    >
      <Text style={[styles.comingTitle, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.comingText, { color: colors.ink2 }]}>
        Coming in the next update.
      </Text>
    </View>
  );
}

type AuthRoute = 'welcome' | 'onboarding' | 'login' | 'forgot';

function AuthFlow() {
  const { dispatch } = useApp();
  const [route, setRoute] = useState<AuthRoute>('welcome');

  const prevRoute = useRef(route);
  const dir = useRef(1);
  if (prevRoute.current !== route) {
    const depth = { welcome: 0, onboarding: 1, login: 1, forgot: 2 };
    dir.current = depth[route] >= depth[prevRoute.current] ? 1 : -1;
    prevRoute.current = route;
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route === 'login') {
        setRoute('welcome');
        return true;
      }
      if (route === 'forgot') {
        setRoute('login');
        return true;
      }
      return false; // onboarding handles its own back steps
    });
    return () => sub.remove();
  }, [route]);

  const light = route === 'welcome';
  return (
    <>
      <StatusBar barStyle={light ? 'light-content' : 'dark-content'} />
      <Slide
        key={route}
        dir={route === 'welcome' && dir.current === 1 ? 0 : dir.current}
      >
        {route === 'welcome' && (
          <WelcomeScreen
            onGetStarted={() => setRoute('onboarding')}
            onLogIn={() => setRoute('login')}
          />
        )}
        {route === 'onboarding' && (
          <OnboardingFlow
            onExit={() => setRoute('welcome')}
            onDone={(profile, goals, hasAccount) =>
              dispatch({
                type: 'completeOnboarding',
                profile,
                goals,
                hasAccount,
              })
            }
          />
        )}
        {route === 'login' && (
          <LoginScreen
            onBack={() => setRoute('welcome')}
            onLoggedIn={() => dispatch({ type: 'logIn' })}
            onForgot={() => setRoute('forgot')}
            onGetStarted={() => setRoute('onboarding')}
          />
        )}
        {route === 'forgot' && (
          <ForgotPasswordScreen onBack={() => setRoute('login')} />
        )}
      </Slide>
    </>
  );
}

function Root() {
  const { state, ready } = useApp();
  const colors = useColors();
  const [splashDone, setSplashDone] = useState(false);
  const [canExit, setCanExit] = useState(false);
  const startedAt = useRef(Date.now()).current;

  // Leave the splash only when data is ready, never before 1.7 s.
  // First launch (onboarding ahead) shows the whole 2.3 s intro + the dots.
  useEffect(() => {
    if (!ready) {
      return;
    }
    const minimum = state.onboarded ? 1700 : 2600;
    const timer = setTimeout(
      () => setCanExit(true),
      Math.max(0, minimum - (Date.now() - startedAt)),
    );
    return () => clearTimeout(timer);
  }, [ready, state.onboarded, startedAt]);

  const finishSplash = useCallback(() => setSplashDone(true), []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: ready ? colors.bg : fixed.splash },
      ]}
    >
      <StatusBar barStyle="light-content" />
      {ready && (
        <Slide key={String(state.onboarded)} dir={state.onboarded ? 1 : 0}>
          {state.onboarded ? <Main /> : <AuthFlow />}
        </Slide>
      )}
      {!splashDone && <SplashScreen ready={canExit} onFinish={finishSplash} />}
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coming: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  comingTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
  },
  comingText: {
    marginTop: 6,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  sheet: {
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
  },
});

export default App;
