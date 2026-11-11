import { useState, useEffect, useCallback } from 'react';
import {
  DisputeItem,
  DisputeDetail,
  EvidenceChecklistItem,
  TimelineEvent,
} from '../types';
import * as disputesApi from '../services/disputesApi';

export function useDisputes() {
  const [disputes, setDisputes] = useState<DisputeItem[]>(disputesApi.FALLBACK_DISPUTES);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>('disp-paypal-8842');
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetail | null>(disputesApi.FALLBACK_DISPUTE_DETAIL);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await disputesApi.fetchDisputes();
      setDisputes(data);
      if (data.length > 0 && !selectedDisputeId) {
        setSelectedDisputeId(data[0].id);
      }
    } catch (err) {
      console.error('[useDisputes] Failed to fetch disputes', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDisputeId]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  useEffect(() => {
    if (!selectedDisputeId) {
      setSelectedDispute(null);
      return;
    }
    let isCancelled = false;
    disputesApi.fetchDisputeDetail(selectedDisputeId).then((detail) => {
      if (!isCancelled) setSelectedDispute(detail);
    });
    return () => {
      isCancelled = true;
    };
  }, [selectedDisputeId]);

  const investigate = async (disputeId: string) => {
    setIsActionLoading(true);
    try {
      const result = await disputesApi.investigateDispute(disputeId);
      if (selectedDispute && selectedDispute.id === disputeId) {
        setSelectedDispute({
          ...selectedDispute,
          checklist: result.checklist,
          timeline: result.timeline,
          contraindications: result.contradictions,
        });
      }
      setActionMessage(`Investigation complete: ${result.evidence_collected} records linked. Readiness: ${result.readiness_score}%.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const generateDraft = async (disputeId: string, tone: 'firm' | 'concise' | 'formal' = 'firm') => {
    setIsActionLoading(true);
    try {
      const result = await disputesApi.draftDisputeResponse(disputeId, tone);
      if (selectedDispute && selectedDispute.id === disputeId) {
        setSelectedDispute({
          ...selectedDispute,
          draft_response: result.draft_text,
        });
      }
      setActionMessage('AI Response Draft generated with citations to internal evidence records.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const submitForApproval = async (disputeId: string, draftText: string, evidenceIds: string[]) => {
    setIsActionLoading(true);
    try {
      const result = await disputesApi.submitDisputeApproval(disputeId, draftText, evidenceIds);
      setActionMessage(`Approval request #${result.approval_request_id} created. Bound to payload hash ${result.payload_hash.substring(0, 10)}...`);
      return result;
    } finally {
      setIsActionLoading(false);
    }
  };

  const submitToProvider = async (
    disputeId: string,
    approvalRequestId: string,
    mode: 'auto_provider_api' | 'manual_provider_portal' = 'auto_provider_api'
  ) => {
    setIsActionLoading(true);
    try {
      const result = await disputesApi.executeDisputeSubmission(disputeId, approvalRequestId, mode);
      if (selectedDispute && selectedDispute.id === disputeId) {
        setSelectedDispute({
          ...selectedDispute,
          status: 'UNDER_REVIEW',
        });
      }
      setActionMessage(result.receipt_message);
      loadDisputes();
      return result;
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesSearch =
      d.provider_dispute_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reason_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.currency.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return {
    disputes: filteredDisputes,
    rawDisputes: disputes,
    selectedDisputeId,
    selectedDispute,
    isLoading,
    isActionLoading,
    statusFilter,
    searchQuery,
    actionMessage,
    setStatusFilter,
    setSearchQuery,
    setSelectedDisputeId,
    refresh: loadDisputes,
    investigate,
    generateDraft,
    submitForApproval,
    submitToProvider,
    clearActionMessage: () => setActionMessage(null),
  };
}
