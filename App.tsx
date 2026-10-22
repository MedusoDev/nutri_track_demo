import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Body, Display, GhostButton, Overline, Slide } from './src/components/kit';
import { createSeedState } from './src/data/seed';
import { ForgotPasswordScreen } from './src/screens/onboarding/ForgotPasswordScreen';
import { LoginScreen } from './src/screens/onboarding/LoginScreen';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { WelcomeScreen } from './src/screens/onboarding/WelcomeScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { AppProvider, useApp } from './src/state/AppContext';
import { fixed, useColors } from './src/theme';

/** The Today screen is being rebuilt with the new design: for now, show the saved plan. */
function PlanSaved() {
  const { state, dispatch, today } = useApp();
  const colors = useColors();
  const { goals } = state;
  return (
    <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="dark-content" />
      <Overline>Your plan is saved</Overline>
      <Display size={52} style={styles.gap}>
        {goals.calories.toLocaleString('en-US')} kcal
      </Display>
      <Body style={styles.gap}>
        Protein {goals.protein} g · Carbs {goals.carbs} g · Fat {goals.fat} g · Water{' '}
        {goals.water * 0.25} L
      </Body>
      <Body style={styles.gap}>The Today screen with the new design comes next.</Body>
      <GhostButton
        label="Start over"
        onPress={() => dispatch({ type: 'reset', state: createSeedState(today) })}
      />
    </View>
  );
}

type AuthRoute = 'welcome' | 'onboarding' | 'login' | 'forgot';

/** Welcome -> onboarding, or Welcome -> Login (-> Forgot password). */
function AuthFlow() {
  const { dispatch } = useApp();
  const [route, setRoute] = useState<AuthRoute>('welcome');

  // Welcome is the start; going back to it slides in from the left.
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
      return false; // welcome closes the app; onboarding handles its own steps
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
            onDone={(profile, goals) =>
              dispatch({ type: 'completeOnboarding', profile, goals })
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
          {state.onboarded ? <PlanSaved /> : <AuthFlow />}
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
  center: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  gap: {
    marginTop: 10,
  },
});

export default App;
