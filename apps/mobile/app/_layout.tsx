import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

const header = { headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f1f5f9' };

function RootLayoutNav() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="api-access" options={{ title: 'API Access', ...header }} />
        <Stack.Screen name="ai-settings" options={{ title: 'AI Settings', ...header }} />
        <Stack.Screen name="approvals" options={{ title: 'Approvals', ...header }} />
        <Stack.Screen name="hermes-voice" options={{ title: 'Talk', ...header }} />
        <Stack.Screen name="system-check" options={{ title: 'System Check', ...header }} />
      </Stack>
    </ThemeProvider>
  );
}
