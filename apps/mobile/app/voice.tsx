import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SectionTitle, SupportText, ui } from '../src/components/ui';
import { ANGEL_SKILLS, VOICE_SKILLS_LATER, VOICE_SKILLS_V1 } from '../src/lib/voice-skills';

export default function VoiceModeScreen() {
  return (
    <Screen>
      <Pill tone="gold">Voice Mode</Pill>
      <ScreenTitle>Talk to AngelOS</ScreenTitle>
      <SupportText>
        Hold to talk, release to send. Communication is an AngelOS skill — not Hermes.
      </SupportText>

      <Card premium>
        <SectionTitle>How to use it</SectionTitle>
        <BodyText>1. Open Assistant and keep Voice Mode on.</BodyText>
        <BodyText>2. Hold the bot to speak. Release to send.</BodyText>
        <BodyText>3. Publishing, sending or booking still asks yes or no.</BodyText>
        <SupportText>
          Native microphone capture stays paused in Expo Go so the rest of AngelOS can load.
          The skill list and handoff design ship now; recording returns in a development build.
        </SupportText>
        <Link href="/ai" asChild>
          <Pressable style={styles.action}>
            <PrimaryActionLabel>Open Assistant</PrimaryActionLabel>
          </Pressable>
        </Link>
      </Card>

      <Card>
        <SectionTitle>AngelOS skills</SectionTitle>
        <SupportText>Voice hands a task to the matching skill. Hermes is not in this path.</SupportText>
        {ANGEL_SKILLS.map((skill) => (
          <View key={skill.id} style={styles.row}>
            <Text style={styles.name}>{skill.name}</Text>
            <SupportText>{skill.detail}</SupportText>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle>First version</SectionTitle>
        {VOICE_SKILLS_V1.map((skill) => (
          <View key={skill.id} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.name}>{skill.name}</Text>
              <Pill tone="gold">on</Pill>
            </View>
            <SupportText>{skill.detail}</SupportText>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle>Later</SectionTitle>
        <SupportText>Named so we do not lose them. Some already sit inside the first ten.</SupportText>
        {VOICE_SKILLS_LATER.map((skill) => (
          <View key={skill.id} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.name}>{skill.name}</Text>
              <Pill>next</Pill>
            </View>
            <SupportText>{skill.detail}</SupportText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: { marginTop: ui.spacing.xs },
  row: {
    paddingVertical: ui.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: ui.colors.border,
    gap: 2
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ui.spacing.sm
  },
  name: {
    color: ui.colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
    flex: 1
  }
});
