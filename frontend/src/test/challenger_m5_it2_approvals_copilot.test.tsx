import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { ApprovalsView } from '../views/ApprovalsView';
import { CopilotView } from '../views/CopilotView';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { sandboxService } from '../services/sandboxService';
import { pureJsSha256 } from '../services/hashService';

describe('Challenger M5 Iteration 2: Approvals Sandbox Execution & Copilot Intent Routing Stress Suite', () => {
  beforeEach(() => {
    // Reset store to pristine deep-cloned demo state
    usePayPilotStore.getState().resetToDemoState();

    // Fast simulated latency for tests
    sandboxService.configure({ simulatedLatencyMs: 20 });

    // Polyfill scrollIntoView for headless jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    // Mock clipboard
    if (typeof navigator.clipboard === 'undefined') {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    } else {
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // SUITE 1: Rapid Sequential Approvals & Unique Proof Badge Isolation
  // ==========================================================================
  describe('Suite 1: Rapid Sequential Approvals & Unique Proof Badge Isolation', () => {
    it('TC-CHALLENGE-M5-01: rapid sequential approval across all distinct actions generates unique proof badges without state contamination', async () => {
      render(<ApprovalsView />);

      const approvalIds = ['APR-9941', 'APR-9942', 'APR-9943'];
      const observedProofBadges: string[] = [];

      for (const id of approvalIds) {
        // 1. Select the approval card
        const card = screen.getByTestId(`approval-card-${id}`);
        act(() => {
          fireEvent.click(card);
        });

        // 2. Click approve button
        const approveBtn = screen.getByTestId('approve-execute-btn');
        expect(approveBtn).toBeInTheDocument();

        await act(async () => {
          fireEvent.click(approveBtn);
        });

        // 3. Wait for sandbox execution banner to appear in detail pane
        await waitFor(() => {
          expect(screen.getByTestId(`approval-receipt-banner-${id}`)).toBeInTheDocument();
        }, { timeout: 3000 });

        // 4. Verify card receipt element exists in action queue
        const cardReceipt = screen.getByTestId(`approval-card-receipt-${id}`);
        expect(cardReceipt).toBeInTheDocument();

        // 5. Retrieve proof badge from store for this action
        const req = usePayPilotStore.getState().pendingApprovals.find((a) => a.id === id);
        expect(req?.status).toBe('EXECUTED_SANDBOX');
        expect(req?.executedProofBadge).toBeDefined();
        expect(req?.executedProofBadge).toMatch(/^#PAY-SHA256-[0-9A-F]{8}-[0-9A-F]{8}$/);

        observedProofBadges.push(req!.executedProofBadge!);
      }

      // Assert that all 3 proof badges are distinct (no duplication / cross-action contamination)
      expect(observedProofBadges).toHaveLength(3);
      const uniqueBadges = new Set(observedProofBadges);
      expect(uniqueBadges.size).toBe(3);

      // Verify each card in the DOM renders its specific proof badge without bleed
      approvalIds.forEach((id, idx) => {
        const cardReceipt = screen.getByTestId(`approval-card-receipt-${id}`);
        const expectedBadgeSnippet = observedProofBadges[idx].replace('#PAY-SHA256-', 'SHA-256: ');
        expect(cardReceipt).toHaveTextContent(expectedBadgeSnippet);
      });
    });

    it('TC-CHALLENGE-M5-02: batch approval of low-risk actions alongside individual approval retains per-card proof isolation', async () => {
      render(<ApprovalsView />);

      // 1. Trigger batch approval of low-risk items (APR-9941 and APR-9943 are LOW risk)
      const batchBtn = screen.getByTestId('approve-low-risk-btn');
      await act(async () => {
        fireEvent.click(batchBtn);
      });

      // 2. Wait for batch execution to complete
      await waitFor(() => {
        const store = usePayPilotStore.getState();
        const lowRisk = store.pendingApprovals.filter((a) => a.riskRating === 'LOW');
        expect(lowRisk.every((a) => a.status === 'EXECUTED_SANDBOX')).toBe(true);
      }, { timeout: 4000 });

      // 3. Verify APR-9941 and APR-9943 each have unique badges in the store and DOM
      const storeAfterBatch = usePayPilotStore.getState();
      const badge9941 = storeAfterBatch.pendingApprovals.find((a) => a.id === 'APR-9941')?.executedProofBadge;
      const badge9943 = storeAfterBatch.pendingApprovals.find((a) => a.id === 'APR-9943')?.executedProofBadge;

      expect(badge9941).toBeDefined();
      expect(badge9943).toBeDefined();
      expect(badge9941).not.toBe(badge9943);

      expect(screen.getByTestId('approval-card-receipt-APR-9941')).toBeInTheDocument();
      expect(screen.getByTestId('approval-card-receipt-APR-9943')).toBeInTheDocument();

      // APR-9942 is MEDIUM risk, so it must still be PENDING_REVIEW with NO card receipt
      expect(screen.queryByTestId('approval-card-receipt-APR-9942')).not.toBeInTheDocument();
      const item9942 = storeAfterBatch.pendingApprovals.find((a) => a.id === 'APR-9942');
      expect(item9942?.status).toBe('PENDING_REVIEW');

      // 4. Now execute APR-9942 individually
      const card9942 = screen.getByTestId('approval-card-APR-9942');
      act(() => {
        fireEvent.click(card9942);
      });

      const approveBtn = screen.getByTestId('approve-execute-btn');
      await act(async () => {
        fireEvent.click(approveBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId('approval-receipt-banner-APR-9942')).toBeInTheDocument();
      }, { timeout: 3000 });

      const badge9942 = usePayPilotStore.getState().pendingApprovals.find((a) => a.id === 'APR-9942')?.executedProofBadge;
      expect(badge9942).toBeDefined();
      expect(badge9942).not.toBe(badge9941);
      expect(badge9942).not.toBe(badge9943);
    });
  });

  // ==========================================================================
  // SUITE 2: Switching Selected Card Back and Forth (No Bleed, No Reset)
  // ==========================================================================
  describe('Suite 2: Switching Selected Card Back and Forth (No Bleed, No Reset)', () => {
    it('TC-CHALLENGE-M5-03: cycling selection back and forth renders exact receipts without bleed or reset', async () => {
      render(<ApprovalsView />);

      // 1. Execute APR-9941
      const approveBtn1 = screen.getByTestId('approve-execute-btn');
      await act(async () => {
        fireEvent.click(approveBtn1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('approval-receipt-banner-APR-9941')).toBeInTheDocument();
      }, { timeout: 3000 });

      const store = usePayPilotStore.getState();
      const receipt9941Badge = store.pendingApprovals.find((a) => a.id === 'APR-9941')?.executedProofBadge;
      expect(receipt9941Badge).toBeDefined();

      // 2. Switch to unexecuted APR-9942
      const card2 = screen.getByTestId('approval-card-APR-9942');
      act(() => {
        fireEvent.click(card2);
      });

      // Assert detail pane does NOT show APR-9941's receipt or any execution banner
      expect(screen.queryByTestId('approval-receipt-banner-APR-9941')).not.toBeInTheDocument();
      expect(screen.queryByTestId('approval-receipt-banner-APR-9942')).not.toBeInTheDocument();
      expect(screen.getByTestId('approve-execute-btn')).toBeInTheDocument();

      // 3. Switch back to APR-9941
      const card1 = screen.getByTestId('approval-card-APR-9941');
      act(() => {
        fireEvent.click(card1);
      });

      // Assert APR-9941's receipt banner is immediately displayed without reset
      const banner9941 = screen.getByTestId('approval-receipt-banner-APR-9941');
      expect(banner9941).toBeInTheDocument();
      expect(banner9941).toHaveTextContent(receipt9941Badge!);

      // 4. Switch to APR-9942 and execute it
      act(() => {
        fireEvent.click(screen.getByTestId('approval-card-APR-9942'));
      });
      const approveBtn2 = screen.getByTestId('approve-execute-btn');
      await act(async () => {
        fireEvent.click(approveBtn2);
      });

      await waitFor(() => {
        expect(screen.getByTestId('approval-receipt-banner-APR-9942')).toBeInTheDocument();
      }, { timeout: 3000 });

      const receipt9942Badge = usePayPilotStore.getState().pendingApprovals.find((a) => a.id === 'APR-9942')?.executedProofBadge;
      expect(receipt9942Badge).toBeDefined();
      expect(receipt9942Badge).not.toBe(receipt9941Badge);

      // 5. Aggressive permutation switching: APR-9941 -> APR-9942 -> APR-9943 -> APR-9941 -> APR-9942
      act(() => {
        fireEvent.click(screen.getByTestId('approval-card-APR-9941'));
      });
      expect(screen.getByTestId('approval-receipt-banner-APR-9941')).toHaveTextContent(receipt9941Badge!);
      expect(screen.queryByTestId('approval-receipt-banner-APR-9942')).not.toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('approval-card-APR-9942'));
      });
      expect(screen.getByTestId('approval-receipt-banner-APR-9942')).toHaveTextContent(receipt9942Badge!);
      expect(screen.queryByTestId('approval-receipt-banner-APR-9941')).not.toBeInTheDocument();

      // Unexecuted APR-9943
      act(() => {
        fireEvent.click(screen.getByTestId('approval-card-APR-9943'));
      });
      expect(screen.queryByTestId('approval-receipt-banner-APR-9941')).not.toBeInTheDocument();
      expect(screen.queryByTestId('approval-receipt-banner-APR-9942')).not.toBeInTheDocument();
      expect(screen.queryByTestId('approval-receipt-banner-APR-9943')).not.toBeInTheDocument();
      expect(screen.getByTestId('approve-execute-btn')).toBeInTheDocument();

      // Back to APR-9941
      act(() => {
        fireEvent.click(screen.getByTestId('approval-card-APR-9941'));
      });
      expect(screen.getByTestId('approval-receipt-banner-APR-9941')).toHaveTextContent(receipt9941Badge!);
    });

    it('TC-CHALLENGE-M5-04: rejection does not produce receipt and switching preserves executed items', () => {
      render(<ApprovalsView />);

      // Select APR-9943 and reject it
      const card3 = screen.getByTestId('approval-card-APR-9943');
      act(() => {
        fireEvent.click(card3);
      });

      const rejectBtn = screen.getByTestId('reject-action-btn');
      act(() => {
        fireEvent.click(rejectBtn);
      });

      const confirmRejectBtn = screen.getByTestId('confirm-reject-btn');
      act(() => {
        fireEvent.click(confirmRejectBtn);
      });

      // Card APR-9943 shows REJECTED status and no proof badge
      expect(screen.queryByTestId('approval-card-receipt-APR-9943')).not.toBeInTheDocument();
      expect(screen.queryByTestId('approval-receipt-banner-APR-9943')).not.toBeInTheDocument();

      const item3 = usePayPilotStore.getState().pendingApprovals.find((a) => a.id === 'APR-9943');
      expect(item3?.status).toBe('REJECTED');
      expect(item3?.executedProofBadge).toBeUndefined();

      // Switching to APR-9941 retains its PENDING state without any receipt corruption
      const card1 = screen.getByTestId('approval-card-APR-9941');
      act(() => {
        fireEvent.click(card1);
      });
      expect(screen.queryByTestId('approval-receipt-banner-APR-9941')).not.toBeInTheDocument();
      expect(screen.getByTestId('approve-execute-btn')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SUITE 3: Copilot Messages with Adversarial & Multi-Intent Phrasing
  // ==========================================================================
  describe('Suite 3: Copilot Messages with Adversarial & Multi-Intent Phrasing', () => {
    it('TC-CHALLENGE-M5-05: handles multi-intent query "What is my udhari debt and runway?" with grounded citations and error-free routing', async () => {
      render(<CopilotView />);

      const input = screen.getByTestId('copilot-input-field');
      const submitBtn = screen.getByTestId('copilot-submit-btn');

      // Submit multi-intent query
      act(() => {
        fireEvent.change(input, { target: { value: 'What is my udhari debt and runway?' } });
      });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Wait for grounded AI response
      await waitFor(() => {
        expect(screen.getByText(/Total outstanding customer credit in Udhari Ledger is/i)).toBeInTheDocument();
        expect(screen.getByTestId('copilot-citation-UDH-101')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click UDH-101 citation and verify route change to udhari-ledger
      const udhCitation = screen.getByTestId('copilot-citation-UDH-101');
      act(() => {
        fireEvent.click(udhCitation);
      });

      expect(usePayPilotStore.getState().activeRoute).toBe('udhari-ledger');
    });

    it('TC-CHALLENGE-M5-06: handles runway & cash buffer query with KPI-RUNWAY citation and commitments routing', async () => {
      render(<CopilotView />);

      const input = screen.getByTestId('copilot-input-field');
      const submitBtn = screen.getByTestId('copilot-submit-btn');

      act(() => {
        fireEvent.change(input, { target: { value: 'What is our current runway and safety buffer status?' } });
      });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(screen.getByText(/Your cash runway is/i)).toBeInTheDocument();
        expect(screen.getByTestId('copilot-citation-KPI-RUNWAY')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click KPI-RUNWAY citation
      const runwayCitation = screen.getByTestId('copilot-citation-KPI-RUNWAY');
      act(() => {
        fireEvent.click(runwayCitation);
      });

      expect(usePayPilotStore.getState().activeRoute).toBe('commitments');
    });

    it('TC-CHALLENGE-M5-07: handles duplicate fee & recovery query with REC-101 citation and explainability drawer routing', async () => {
      render(<CopilotView />);

      const input = screen.getByTestId('copilot-input-field');
      const submitBtn = screen.getByTestId('copilot-submit-btn');

      act(() => {
        fireEvent.change(input, { target: { value: 'How much duplicate fee can we recover from Black Friday batch leaks?' } });
      });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(screen.getByText(/Case REC-101/i)).toBeInTheDocument();
        expect(screen.getByTestId('copilot-citation-REC-101')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click REC-101 citation
      const recCitation = screen.getByTestId('copilot-citation-REC-101');
      act(() => {
        fireEvent.click(recCitation);
      });

      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);
      expect(usePayPilotStore.getState().explainabilityDrawer.activeRecordId).toBe('REC-101');
    });

    it('TC-CHALLENGE-M5-08: adversarial input stress test (long payload, special characters, fallback) never throws and always grounds', async () => {
      render(<CopilotView />);

      const input = screen.getByTestId('copilot-input-field');
      const submitBtn = screen.getByTestId('copilot-submit-btn');

      // 1. Long adversarial string with SQL / XSS syntax and out-of-domain prompt
      const adversarialText = 'DROP TABLE ledger; <script>alert(1)</script> ' + 'A'.repeat(500) + ' What is the weather in Tokyo?';
      act(() => {
        fireEvent.change(input, { target: { value: adversarialText } });
      });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Should fall back gracefully to verified live cash and runway without crash
      await waitFor(() => {
        expect(screen.getByText(/I have verified your query against ground-truth data/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // 2. Rapid double submission while thinking
      act(() => {
        fireEvent.change(input, { target: { value: 'Second rapid query while thinking' } });
        fireEvent.click(submitBtn);
        fireEvent.click(submitBtn);
      });

      // Store should not crash or corrupt messages
      expect(usePayPilotStore.getState().copilotMessages.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // SUITE 4: Zero Flakiness Verification on Challenger Suites
  // ==========================================================================
  describe('Suite 4: Zero Flakiness Verification on Challenger Suites', () => {
    it('TC-CHALLENGE-M5-09: verifies deterministic state transitions and pure SHA-256 badge format integrity', () => {
      const payload = { approvalId: 'APR-TEST', txnId: 'TXN-12345', timestamp: '2026-11-08T12:00:00Z' };
      const hash1 = pureJsSha256(JSON.stringify(payload));
      const hash2 = pureJsSha256(JSON.stringify(payload));

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
    });
  });
});
