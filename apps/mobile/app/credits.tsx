import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, ScreenTitle, SectionTitle, SupportText, ui } from '../src/components/ui';
import { getAiCredits, type AiCredits } from '../src/lib/ai';
import { getActiveWorkspace } from '../src/lib/workspace';

export default function CreditsScreen() {
  const router = useRouter();
  const [credits, setCredits] = useState<AiCredits | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();
        setCredits(await getAiCredits(workspace.id));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not load credits');
      }
    })();
  }, []);

  return (
    <Screen>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable>
      <Pill tone="gold">OpenAI meter</Pill>
      <ScreenTitle>AI Credits</ScreenTitle>
      <SupportText>Chat and talking voice on Full plan use Angel's OpenAI key. Each reply is 1 credit. Ollama plan does not use credits.</SupportText>

      {error ? <Card><BodyText>{error}</BodyText></Card> : null}

      {credits ? (
        <>
          <Card premium>
            <SectionTitle>This month</SectionTitle>
            <Text style={styles.big}>
              {credits.unlimited ? 'Unlimited' : `${credits.remaining} left`}
            </Text>
            <BodyText>
              Used {credits.used}
              {credits.allowance >= 0 ? ` of ${credits.allowance}` : ''}
              {' · plan '}{credits.planCode}
            </BodyText>
            <SupportText>Period starts {credits.periodStart} (UTC month).</SupportText>
          </Card>
          <Card>
            <SectionTitle>How it works</SectionTitle>
            <BodyText>{credits.note}</BodyText>
            <SupportText>Free = 0. Automations = 0. Ollama = no OpenAI bill. Full / Solo = 200 / month. Founder = unlimited, still logged.</SupportText>
          </Card>
        </>
      ) : !error ? (
        <Card><BodyText>Loading credits...</BodyText></Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: ui.colors.gold, fontSize: 16, marginBottom: 8 },
  big: { color: ui.colors.primaryText, fontSize: 36, fontWeight: '700', marginVertical: 8 }
});
