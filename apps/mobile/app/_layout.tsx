import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

export const colors = {
  primary: '#0ea5e9',
  background: '#0f172a',
  card: '#1e293b',
  text: '#f1f5f9',
  border: '#334155',
  notification: '#ef4444',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'AngelOs', headerShown: false }} />
        <Stack.Screen name="hermes-voice" options={{ title: 'Hermes', headerShown: false }} />
        <Stack.Screen name="hermes-settings" options={{ title: 'Settings', headerShown: false }} />
        <Stack.Screen name="hermes-history" options={{ title: 'History', headerShown: false }} />
        <Stack.Screen name="ai-settings" options={{ title: 'AI Settings', headerShown: false }} />
        <Stack.Screen name="approvals" options={{ title: 'Approvals', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
