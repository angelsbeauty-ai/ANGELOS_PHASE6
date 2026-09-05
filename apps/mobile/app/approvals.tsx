import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import { apiFetch } from '../src/lib/api';
import { supabase } from '../src/lib/supabase';

interface Approval {
  id: string;
  type: 'message' | 'content' | 'booking';
  sourceChannel: string;
  content: string;
  clientName: string;
  clientId: string;
  actionRequired: string;
  createdAt: string;
  context?: Record<string, any>;
}

interface ApprovalRow {
  id: string;
  type: 'message' | 'content' | 'booking';
  source_channel: string;
  content: string;
  client_name: string;
  client_id: string;
  action_required: string;
  created_at: string;
  context?: Record<string, any>;
}

function mapApproval(row: ApprovalRow): Approval {
  return {
    id: row.id,
    type: row.type,
    sourceChannel: row.source_channel,
    content: row.content,
    clientName: row.client_name,
    clientId: row.client_id,
    actionRequired: row.action_required,
    createdAt: row.created_at,
    context: row.context,
  };
}

export default function ApprovalsScreen() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] =
    useState<Approval | null>(null);

  const [decisionNotes, setDecisionNotes] = useState('');
  const [revisedContent, setRevisedContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchPendingApprovals();

    const channel = supabase
      .channel('angelos-approvals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'approvals',
          filter: 'status=eq.pending',
        },
        (payload) => {
          const row = payload.new as ApprovalRow;

          setApprovals((current) => {
            if (current.some((item) => item.id === row.id)) {
              return current;
            }

            return [mapApproval(row), ...current];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPendingApprovals() {
    setLoading(true);

    try {
      const data = await apiFetch<ApprovalRow[]>('/approvals/pending');
      setApprovals(data.map(mapApproval));
    } catch (error) {
      console.error('Failed to load approvals:', error);
      Alert.alert('Error', 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }

  async function submitDecision(
    decision: 'approved' | 'rejected' | 'needs_revision',
  ) {
    if (!selectedApproval || submitting) return;

    if (decision === 'needs_revision' && !revisedContent.trim()) {
      Alert.alert('Error', 'Please provide revised content');
      return;
    }

    setSubmitting(true);

    try {
      const result = await apiFetch<{ delivery?: { status: 'sent' | 'failed' | 'unknown'; duplicatePrevented: boolean } | null }>('/approvals/decide', {
        method: 'POST',
        body: JSON.stringify({
          approvalId: selectedApproval.id,
          decision,
          notes: decisionNotes.trim() || undefined,
          revisedContent:
            decision === 'needs_revision'
              ? revisedContent.trim()
              : undefined,
        }),
      });

      setApprovals((current) =>
        current.filter((item) => item.id !== selectedApproval.id),
      );

      setSelectedApproval(null);
      setDecisionNotes('');
      setRevisedContent('');

      const deliveryMessage = result.delivery?.status === 'sent'
        ? 'Synthetic delivery recorded. Duplicate approvals will not resend it.'
        : result.delivery ? 'Delivery needs review. This approval will not resend the message.' : `Approval ${decision}`;
      Alert.alert('Approval recorded', deliveryMessage);
    } catch (error) {
      console.error('Failed to submit decision:', error);
      Alert.alert('Error', 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  }

  function closeApproval() {
    setSelectedApproval(null);
    setDecisionNotes('');
    setRevisedContent('');
  }

  function getTypeColor(type: string) {
    const colors: Record<string, string> = {
      message: '#4A90E2',
      content: '#E8860D',
      booking: '#2ECC71',
    };

    return colors[type] || '#999';
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      message: 'Message',
      content: 'Content',
      booking: 'Booking',
    };

    return labels[type] || type;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (selectedApproval) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          onPress={closeApproval}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.detailsCard}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.typeTag,
                {
                  backgroundColor: getTypeColor(
                    selectedApproval.type,
                  ),
                },
              ]}
            >
              <Text style={styles.typeTagText}>
                {getTypeLabel(selectedApproval.type)}
              </Text>
            </View>

            <Text style={styles.channelText}>
              from {selectedApproval.sourceChannel.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.clientName}>
            {selectedApproval.clientName}
          </Text>

          <Text style={styles.timestamp}>
            {new Date(selectedApproval.createdAt).toLocaleString()}
          </Text>

          <View style={styles.contentBox}>
            <Text style={styles.contentLabel}>
              {selectedApproval.type === 'message'
                ? 'Client Message:'
                : selectedApproval.type === 'booking'
                  ? 'Booking Request:'
                  : 'Content Draft:'}
            </Text>

            <Text style={styles.contentText}>
              {selectedApproval.content}
            </Text>
          </View>

          {selectedApproval.context && (
            <View style={styles.contextBox}>
              <Text style={styles.contextLabel}>
                Additional Info:
              </Text>

              {selectedApproval.context.imageUrl && (
                <Text style={styles.contextItem}>
                  Has image attachment
                </Text>
              )}

              {selectedApproval.context.serviceType && (
                <Text style={styles.contextItem}>
                  Service: {selectedApproval.context.serviceType}
                </Text>
              )}

              {selectedApproval.context.requestedDate && (
                <Text style={styles.contextItem}>
                  Date: {selectedApproval.context.requestedDate}
                </Text>
              )}
            </View>
          )}

          <TextInput
            style={styles.notesInput}
            placeholder="Your notes (optional)"
            placeholderTextColor="#999"
            value={decisionNotes}
            onChangeText={setDecisionNotes}
            multiline
          />

          <TextInput
            style={styles.revisedInput}
            placeholder="Revised content (optional)"
            placeholderTextColor="#999"
            value={revisedContent}
            onChangeText={setRevisedContent}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={() => void submitDecision('approved')}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>
                {submitting ? 'Processing...' : 'Approve'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.reviseButton]}
              onPress={() => void submitDecision('needs_revision')}
              disabled={submitting || !revisedContent.trim()}
            >
              <Text style={styles.buttonText}>
                {submitting ? 'Processing...' : 'Revise'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => void submitDecision('rejected')}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>
                {submitting ? 'Processing...' : 'Reject'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {approvals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No approvals needed</Text>
          <Text style={styles.emptySubtext}>
            All pending approvals have been handled.
          </Text>
        </View>
      ) : (
        <ScrollView>
          <Text style={styles.listTitle}>
            {approvals.length} Approval
            {approvals.length !== 1 ? 's' : ''} Needed
          </Text>

          {approvals.map((approval) => (
            <TouchableOpacity
              key={approval.id}
              style={styles.approvalCard}
              onPress={() => setSelectedApproval(approval)}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.typeTag,
                    {
                      backgroundColor: getTypeColor(approval.type),
                    },
                  ]}
                >
                  <Text style={styles.typeTagText}>
                    {getTypeLabel(approval.type)}
                  </Text>
                </View>

                <Text style={styles.cardChannel}>
                  {approval.sourceChannel.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.cardClient}>
                {approval.clientName}
              </Text>

              <Text style={styles.cardContent} numberOfLines={2}>
                {approval.content}
              </Text>

              <Text style={styles.cardTime}>
                {new Date(approval.createdAt).toLocaleTimeString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  backButton: {
    paddingVertical: 12,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#E8860D',
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3E50',
    marginBottom: 12,
    marginTop: 12,
  },
  approvalCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E8860D',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardChannel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  cardClient: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3E50',
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardTime: {
    fontSize: 12,
    color: '#999',
  },
  detailsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3E50',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  contentBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: '#2D3E50',
    lineHeight: 20,
  },
  contextBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  contextItem: {
    fontSize: 13,
    color: '#2D3E50',
    marginBottom: 4,
  },
  notesInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2D3E50',
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  revisedInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2D3E50',
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#2ECC71',
  },
  reviseButton: {
    backgroundColor: '#F39C12',
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3E50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
