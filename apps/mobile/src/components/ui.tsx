import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../design/theme';

const palette = colors.light;

type TextTone = 'primary' | 'secondary' | 'gold' | 'success' | 'warning' | 'critical';

function toneColor(tone: TextTone) {
  switch (tone) {
    case 'gold':
      return palette.gold;
    case 'success':
      return palette.success;
    case 'warning':
      return palette.warning;
    case 'critical':
      return palette.critical;
    case 'secondary':
      return palette.secondaryText;
    default:
      return palette.primaryText;
  }
}

export function AppTitle({ children }: PropsWithChildren) {
  return <Text style={styles.appTitle}>{children}</Text>;
}

export function ScreenTitle({ children }: PropsWithChildren) {
  return <Text style={styles.screenTitle}>{children}</Text>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function BodyText({ children, tone = 'primary' }: PropsWithChildren<{ tone?: TextTone }>) {
  return <Text style={[styles.body, { color: toneColor(tone) }]}>{children}</Text>;
}

export function SupportText({ children, tone = 'secondary' }: PropsWithChildren<{ tone?: TextTone }>) {
  return <Text style={[styles.support, { color: toneColor(tone) }]}>{children}</Text>;
}

export function Card({ children, premium = false }: PropsWithChildren<{ premium?: boolean }>) {
  return <View style={[styles.card, premium && styles.premiumCard]}>{children}</View>;
}

export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={[styles.card, styles.statCard]}>
      <SupportText>{label}</SupportText>
      <Text style={styles.statValue}>{value}</Text>
      <SupportText>{detail}</SupportText>
    </View>
  );
}

export function Pill({ children, tone = 'secondary' }: PropsWithChildren<{ tone?: TextTone }>) {
  return (
    <View style={[styles.pill, tone === 'gold' && styles.goldPill]}>
      <Text style={[styles.pillText, { color: tone === 'gold' ? palette.primaryText : toneColor(tone) }]}>
        {children}
      </Text>
    </View>
  );
}

export function Row({ children, accessory }: PropsWithChildren<{ accessory?: ReactNode }>) {
  return (
    <View style={styles.row}>
      <View style={styles.rowContent}>{children}</View>
      {accessory}
    </View>
  );
}

export function PrimaryActionLabel({ children }: PropsWithChildren) {
  return <Text style={styles.primaryAction}>{children}</Text>;
}

export function SecondaryActionLabel({ children }: PropsWithChildren) {
  return <Text style={styles.secondaryAction}>{children}</Text>;
}

export const ui = {
  colors: palette,
  spacing,
  radius,
  typography,
  shadow,
};

const styles = StyleSheet.create({
  appTitle: {
    color: palette.primaryText,
    fontSize: typography.display,
    fontWeight: '700',
    letterSpacing: 0
  },
  screenTitle: {
    color: palette.primaryText,
    fontSize: typography.screenTitle,
    fontWeight: '700',
    letterSpacing: 0
  },
  sectionTitle: {
    color: palette.primaryText,
    fontSize: typography.section,
    fontWeight: '700',
    letterSpacing: 0
  },
  body: {
    fontSize: typography.body,
    lineHeight: 23
  },
  support: {
    fontSize: typography.support,
    lineHeight: 20
  },
  card: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.elevated,
    ...shadow.soft
  },
  premiumCard: {
    backgroundColor: palette.warmSurface,
    borderColor: palette.softGold
  },
  statCard: {
    flex: 1
  },
  statValue: {
    color: palette.primaryText,
    fontSize: 26,
    fontWeight: '700'
  },
  pill: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.elevated
  },
  goldPill: {
    backgroundColor: palette.softGold,
    borderColor: palette.softGold
  },
  pillText: {
    fontSize: typography.metadata,
    fontWeight: '700'
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border
  },
  rowContent: {
    flex: 1,
    gap: 2
  },
  primaryAction: {
    minHeight: 50,
    overflow: 'hidden',
    borderRadius: radius.control,
    backgroundColor: palette.gold,
    color: palette.primaryText,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm
  },
  secondaryAction: {
    minHeight: 50,
    overflow: 'hidden',
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.elevated,
    color: palette.primaryText,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm
  }
});
