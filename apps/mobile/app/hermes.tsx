import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SectionTitle, SupportText, ui } from '../src/components/ui';
import { getHermesOverview, decideApproval, type HermesOverview, type ApprovalItem, type ApprovalDecision } from '../src/lib/hermes';
import { getActiveWorkspace } from '../src/lib/workspace';

export default function HermesScreen() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [overview, setOverview] = useState<HermesOverview | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [revisedContent, setRevisedContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const decisionInFlight = useRef(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setBusy(true);
      setLoadError(null);
      const workspace = await getActiveWorkspace();
      setWorkspaceId(workspace.id);
      const data = await getHermesOverview(workspace.id);
      setOverview(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load overview.');
    } finally {
      setBusy(false);
    }
  }

  function selectApproval(approval: ApprovalItem | null) {
    setSelectedApproval(approval);
    setDecisionNotes('');
    setRevisedContent('');
  }

  async function submitDecision(decision: ApprovalDecision) {
    if (!selectedApproval || !workspaceId || decisionInFlight.current || busy || loadError) return;
    if (decision === 'needs_revision' && !revisedContent.trim()) {
      Alert.alert('Revision required', 'Please provide revised content.');
      return;
    }

    decisionInFlight.current = true;
    setSubmitting(true);
    try {
      const result = await decideApproval(
        selectedApproval.id,
        decision,
        decisionNotes.trim() || undefined,
        decision === 'needs_revision' ? revisedContent.trim() : undefined,
        workspaceId
      );
      const deliveryMessage = result.delivery?.status === 'sent'
        ? 'Synthetic delivery recorded. Duplicate approvals will not resend it.'
        : result.delivery
          ? 'Delivery needs review. This approval will not resend the message.'
          : decision === 'needs_revision' ? 'Revision recorded.' : `Approval ${decision}.`;
      Alert.alert('Decision recorded', deliveryMessage);
      const approvalId = selectedApproval.id;
      setOverview(current => {
        if (!current) return current;
        const items = current.pendingApprovalsItems.filter(item => item.id !== approvalId);
        return { ...current, pendingApprovals: items.length, pendingApprovalsItems: items };
      });
      selectApproval(null);
      await load();
    } catch (error) {
      Alert.alert('Could not record decision', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      decisionInFlight.current = false;
      setSubmitting(false);
    }
  }

  if (busy && !overview) return <Screen><Card><BodyText>Loading Hermes overview...</BodyText></Card></Screen>;
  if (!overview) return (
    <Screen><Card>
      <SectionTitle>Could not load Hermes</SectionTitle>
      <BodyText>{loadError ?? 'Overview is unavailable.'}</BodyText>
      <Pressable accessibilityRole="button" onPress={() => void load()}>
        <PrimaryActionLabel>Retry</PrimaryActionLabel>
      </Pressable>
    </Card></Screen>
  );

  const openApprovals = overview.pendingApprovalsItems;
  const openAttention = overview.attentionItems.filter(a => a.status === 'open');

  return (
    <Screen>
      <Pill tone="gold">Unified Control</Pill>
      <ScreenTitle>Hermes Overview</ScreenTitle>
      <SupportText>Pending approvals and attention in one place.</SupportText>
      {loadError ? <Card>
        <SupportText tone="critical">{loadError}</SupportText>
        <SupportText>Showing the last loaded overview. Refresh before deciding.</SupportText>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void load()}>
          <PrimaryActionLabel>{busy ? 'Refreshing...' : 'Retry'}</PrimaryActionLabel>
        </Pressable>
      </Card> : null}

      {selectedApproval ? (
        <Card premium>
          <SectionTitle>Decide Approval</SectionTitle>
          <SupportText>{selectedApproval.type} — {selectedApproval.sourceChannel}</SupportText>
          <SectionTitle>{selectedApproval.clientName}</SectionTitle>
          <BodyText>{selectedApproval.content}</BodyText>
          <TextInput
            accessibilityLabel="Decision notes"
            editable={!submitting}
            value={decisionNotes}
            onChangeText={setDecisionNotes}
            placeholder="Add decision notes (optional)"
            placeholderTextColor={ui.colors.secondaryText}
            multiline
            style={[styles.input, styles.multiline]}
          />
          <TextInput
            accessibilityLabel="Revised content"
            editable={!submitting}
            value={revisedContent}
            onChangeText={setRevisedContent}
            placeholder="Revised content (required for Revise)"
            placeholderTextColor={ui.colors.secondaryText}
            multiline
            style={[styles.input, styles.multiline]}
          />
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" style={[styles.button, styles.reject]} disabled={submitting || busy || !!loadError} onPress={() => void submitDecision('rejected')}>
              <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Reject'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={[styles.button, styles.approve]} disabled={submitting || busy || !!loadError} onPress={() => void submitDecision('approved')}>
              <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Approve'}</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" disabled={submitting || busy || !!loadError || !revisedContent.trim()} onPress={() => void submitDecision('needs_revision')}>
            <PrimaryActionLabel>{submitting ? 'Submitting...' : 'Revise'}</PrimaryActionLabel>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={submitting} onPress={() => selectApproval(null)}>
            <Text style={styles.cancelLink}>Cancel</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          <Card premium>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <SupportText>Pending approvals</SupportText>
                <Text style={styles.bigNumber}>{openApprovals.length}</Text>
              </View>
              <Pill tone={openAttention.length > 0 ? 'warning' : 'success'}>{openAttention.length} attention</Pill>
            </View>
            <Pressable disabled={busy} onPress={() => void load()}>
              <PrimaryActionLabel>{busy ? 'Refreshing...' : 'Refresh'}</PrimaryActionLabel>
            </Pressable>
          </Card>

          <Card>
            <View style={styles.sectionHeader}>
              <SectionTitle>Approvals</SectionTitle>
              <Pill tone={openApprovals.length > 0 ? 'warning' : 'success'}>{openApprovals.length}</Pill>
            </View>
            {openApprovals.length === 0 ? (
              <SupportText>No pending approvals.</SupportText>
            ) : (
              openApprovals.map(approval => (
                <Pressable accessibilityRole="button" key={approval.id} disabled={busy || submitting || !!loadError} onPress={() => selectApproval(approval)}>
                  <View style={styles.item}>
                    <View style={styles.itemRow}>
                      <Text style={styles.itemType}>{approval.type}</Text>
                      <Pill tone="warning">{approval.sourceChannel}</Pill>
                    </View>
                    <BodyText>{approval.clientName}</BodyText>
                    <BodyText>{approval.content.slice(0, 80)}</BodyText>
                    <SupportText>{new Date(approval.createdAt).toLocaleString()}</SupportText>
                  </View>
                </Pressable>
              ))
            )}
          </Card>

          <Card>
            <View style={styles.sectionHeader}>
              <SectionTitle>Attention Items</SectionTitle>
              <Pill tone={openAttention.length > 0 ? 'warning' : 'success'}>{openAttention.length}</Pill>
            </View>
            {openAttention.length === 0 ? (
              <SupportText>No open attention items.</SupportText>
            ) : (
              openAttention.map(item => (
                <View key={item.id} style={styles.item}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemType}>{item.title}</Text>
                    <Pill tone={item.severity === 'urgent' ? 'critical' : item.severity === 'today' ? 'warning' : 'secondary'}>
                      {item.severity}
                    </Pill>
                  </View>
                  <BodyText>{item.summary}</BodyText>
                  <SupportText>{item.managedBy} | {new Date(item.createdAt).toLocaleString()}</SupportText>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ui.spacing.sm },
  headerCopy: { flex: 1, gap: 2 },
  bigNumber: { color: ui.colors.primaryText, fontSize: 27, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm },
  item: { gap: ui.spacing.xs, paddingTop: ui.spacing.sm, borderTopWidth: 1, borderTopColor: ui.colors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ui.spacing.sm },
  itemType: { color: ui.colors.primaryText, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  input: {
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.control,
    backgroundColor: ui.colors.elevated,
    color: ui.colors.primaryText,
    padding: ui.spacing.sm,
    fontSize: 15,
    textAlignVertical: 'top'
  },
  multiline: { minHeight: 78 },
  actions: { flexDirection: 'row', gap: ui.spacing.sm },
  button: { flex: 1, minHeight: 46, justifyContent: 'center', alignItems: 'center', borderRadius: ui.radius.control },
  approve: { backgroundColor: ui.colors.softGold },
  reject: { backgroundColor: ui.colors.critical },
  buttonText: { color: ui.colors.primaryText, fontWeight: '700', fontSize: 15 },
  cancelLink: { color: ui.colors.gold, fontWeight: '600', paddingVertical: ui.spacing.xs, textAlign: 'center' }
});
