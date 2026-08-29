import { UsageTracker } from '../src/components/UsageTracker';
import { Stack } from 'expo-router';
import { colors } from '../src/design/theme';

export default function RootLayout() {
  return <>
    <UsageTracker />
    <Stack screenOptions={{
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: colors.light.background },
      headerTintColor: colors.light.primaryText,
      headerTitleStyle: { fontWeight: '700' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.light.background }
    }}>
      <Stack.Screen name="index" options={{ title: 'AngelOS' }} />
      <Stack.Screen name="login" options={{ title: 'Sign In' }} />
      <Stack.Screen name="founder-admin" options={{ title: 'Founder' }} />
    </Stack>
  </>;
}
