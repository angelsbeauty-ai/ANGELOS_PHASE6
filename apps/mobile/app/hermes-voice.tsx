import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';

const palette = {
  background: '#FCFBF8',
  elevated: '#FFFFFF',
  primaryText: '#191919',
  secondaryText: '#6F6A63',
  border: '#EAE5DD',
  gold: '#B9975B',
  critical: '#A45E59',
};

const radius = { card: 18 };
const spacing = { xs: 8, sm: 16, md: 24 };

/**
 * Expo Go safe stub.
 * Do not import expo-av here: missing native ExponentAV crashes the whole JS bundle
 * when Expo Router evaluates this route module.
 * Restore recording UI behind a custom dev client later.
 */
export default function HermesVoiceScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Talk to Hermes</Text>
        <Text style={styles.mutedText}>
          Voice recording is paused in Expo Go so the rest of AngelOS can load.
          Core screens (Home, Services, Calendar, Clients, Connections) still work.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Voice paused for Expo Go</Text>
          <Text style={styles.bodyText}>
            Native module ExponentAV is not available in this Expo Go build.
            Hermes voice will return in a development build.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: spacing.sm,
  },
  mutedText: {
    color: palette.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.primaryText,
    marginBottom: spacing.xs,
  },
  card: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.elevated,
    marginTop: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.primaryText,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 23,
    color: palette.secondaryText,
  },
});
