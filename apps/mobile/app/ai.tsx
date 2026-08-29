import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Screen } from '../src/components/Screen';
import {
  BodyText,
  Card,
  Pill,
  PrimaryActionLabel,
  Row,
  ScreenTitle,
  SecondaryActionLabel,
  SectionTitle,
  SupportText,
  ui
} from '../src/components/ui';
import {
  approveAiAction,
  cancelAiAction,
  createConversation,
  getAssistantProfile,
  sendAiMessage,
  type AiActionProposal,
  type AiMessage,
  type AiScreenContext
} from '../src/lib/ai';
import { getActiveWorkspace } from '../src/lib/workspace';

export default function AiScreen() {
  const params = useLocalSearchParams<{ screen?: string; entityType?: string; entityId?: string; entityLabel?: string }>();
  const screenContext: AiScreenContext = {
    screen: params.screen ?? 'ai',
    entityType: params.entityType,
    entityId: params.entityId,
    entityLabel: params.entityLabel
  };
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [assistantName, setAssistantName] = useState('AngelOS');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [composer, setComposer] = useState('');
  const [action, setAction] = useState<AiActionProposal | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    try {
      const workspace = await getActiveWorkspace();
      setWorkspaceId(workspace.id);
      const [{ profile }, conversation] = await Promise.all([
        getAssistantProfile(workspace.id),
        createConversation(workspace.id, screenContext)
      ]);
      setAssistantName(profile.display_name);
      setConversationId(conversation.id);
      setMessages([
        {
          id: 'welcome',
          author_type: 'assistant',
          content: `Tell me what you're trying to get done. You don't need to know the perfect question. I'll help you figure out the next useful step.`,
          metadata: {},
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      Alert.alert('AI setup needs attention', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = composer.trim();
    if (!text || !workspaceId || !conversationId || busy) return;
    setComposer('');
    setBusy(true);
    const optimistic: AiMessage = {
      id: `local-${Date.now()}`,
      author_type: 'user',
      content: text,
      metadata: {},
      created_at: new Date().toISOString()
    };
    setMessages((current) => [...current, optimistic]);

    try {
      const result = await sendAiMessage(workspaceId, conversationId, text, screenContext);
      setMessages((current) => [...current, result.message]);
      setAction(result.action);
    } catch (error) {
      Alert.alert('Could not reach your assistant', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function resolveAction(approved: boolean) {
    if (!workspaceId || !action) return;
    setBusy(true);
    try {
      if (approved) {
        await approveAiAction(workspaceId, action.id);
        if (action.action_key === 'update_assistant_name') {
          const nextName = String(action.input.displayName ?? 'AngelOS');
          setAssistantName(nextName);
        }
      } else {
        await cancelAiAction(workspaceId, action.id);
      }
      setMessages((current) => [
        ...current,
        {
          id: `action-${Date.now()}`,
          author_type: 'system_action',
          content: approved ? 'Approved action completed and verified.' : 'Action cancelled.',
          metadata: { actionId: action.id },
          created_at: new Date().toISOString()
        }
      ]);
      setAction(null);
    } catch (error) {
      Alert.alert('Action needs attention', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Card premium>
        <View style={styles.headerRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{assistantName.slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.headerCopy}>
            <ScreenTitle>{assistantName}</ScreenTitle>
            <SupportText>Your calm AI business partner.</SupportText>
            {screenContext.entityLabel ? <SupportText>Working with: {screenContext.entityLabel}</SupportText> : null}
          </View>
          <Link href="/ai-settings" style={styles.settingsLink}>Settings</Link>
        </View>
      </Card>

      <View style={styles.shortcuts}>
        <Pill>What needs attention?</Pill>
        <Pill>Draft a reply</Pill>
        <Pill>Prepare content</Pill>
      </View>

      <View style={styles.thread}>
        {messages.map((message) => (
          <Card
            key={message.id}
            premium={message.author_type !== 'user'}
          >
            <View style={styles.messageHeader}>
              <Pill tone={message.author_type === 'user' ? 'secondary' : 'gold'}>
                {message.author_type === 'user' ? 'You' : message.author_type === 'assistant' ? assistantName : 'Verified'}
              </Pill>
            </View>
            <BodyText>{message.content}</BodyText>
          </Card>
        ))}
      </View>

      {action ? (
        <Card>
          <View style={styles.cardHeader}>
            <SectionTitle>Review & Approve</SectionTitle>
            <Pill tone={action.risk_level === 'high' ? 'critical' : action.risk_level === 'medium' ? 'warning' : 'success'}>
              {action.risk_level} risk
            </Pill>
          </View>
          <BodyText>{action.summary ?? action.action_key}</BodyText>
          <SupportText>AngelOS needs your approval before completing this action.</SupportText>
          <View style={styles.actionButtons}>
            <Pressable disabled={busy} onPress={() => void resolveAction(true)} style={styles.actionButton}>
              <PrimaryActionLabel>Approve</PrimaryActionLabel>
            </Pressable>
            <Pressable disabled={busy} onPress={() => void resolveAction(false)} style={styles.actionButton}>
              <SecondaryActionLabel>Cancel</SecondaryActionLabel>
            </Pressable>
          </View>
        </Card>
      ) : null}

      <Card>
        <Row>
          <View>
            <SectionTitle>Tell AngelOS</SectionTitle>
            <SupportText>One instruction is enough. It will organize the next step.</SupportText>
          </View>
        </Row>
        <TextInput
          placeholder="Tell me what's going on with your business..."
          placeholderTextColor={ui.colors.secondaryText}
          multiline
          value={composer}
          onChangeText={setComposer}
          style={styles.input}
        />
        <Pressable disabled={busy || !composer.trim()} onPress={() => void send()} style={styles.sendButton}>
          <PrimaryActionLabel>{busy ? 'Working...' : 'Send to AngelOS'}</PrimaryActionLabel>
        </Pressable>
      </Card>

      <SupportText>Voice capture is still waiting on the device adapter; text uses the same assistant and approval system.</SupportText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: ui.spacing.sm },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.colors.softGold,
    backgroundColor: ui.colors.elevated,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { color: ui.colors.gold, fontSize: 20, fontWeight: '700' },
  headerCopy: { flex: 1 },
  settingsLink: {
    color: ui.colors.gold,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: ui.spacing.xs
  },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ui.spacing.xs
  },
  thread: { gap: ui.spacing.sm },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ui.spacing.sm
  },
  actionButtons: { flexDirection: 'row', gap: ui.spacing.sm },
  actionButton: { flex: 1 },
  input: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    backgroundColor: ui.colors.elevated,
    color: ui.colors.primaryText,
    fontSize: 16,
    lineHeight: 22,
    padding: ui.spacing.sm,
    textAlignVertical: 'top'
  },
  sendButton: { opacity: 1 }
});
