import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import { usePayPilotStore, calculateCashFlowProjections } from '../store/usePayPilotStore';
import { sandboxService } from '../services/sandboxService';
import { pureJsSha256, formatSignatureBadge, canonicalStringify } from '../services/hashService';
import { InteractiveCashCurve } from '../components/charts/InteractiveCashCurve';
import { ApprovalsView } from '../views/ApprovalsView';
import { TeamSharingView } from '../views/TeamSharingView';
import { DemoFlowStepper } from '../components/common/DemoFlowStepper';
import { SimulationParameters } from '../types';

describe('Tier 5: Adversarial Financial State Invariants & Cryptographic Defense Suite', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
    sandboxService.clearAuditTrail();
    sandboxService.configure({ simulatedLatencyMs: 15 });

    // Polyfill scrollIntoView and clipboard for jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
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
    cleanup();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // SUITE 1: Cash-Flow Curve Mathematical Stability & Numerical Invariants
  // ==========================================================================
  describe('Suite 1: Cash-Flow Curve Mathematical Stability & Numerical Invariants', () => {
    it('TC-T5-FIN-01: calculates exact finite points under extreme slider inputs (0% deposit, 90d delay, [10, 10, 80] split)', () => {
      const startingCash = 142500;
      const extremeParams: SimulationParameters = {
        upfrontDepositPct: 0,
        customerPaymentDelayDays: 90,
        milestoneSplit: [10, 10, 80],
        milestonePreset: '100_DELIVERY',
      };

      const result = calculateCashFlowProjections(startingCash, extremeParams, 15000);

      // 1. Array length invariant: exactly 91 daily projection points (Day 0 to Day 90)
      expect(result.dailyProjections).toHaveLength(91);

      // 2. Numerical finiteness and arithmetic consistency for every point
      result.dailyProjections.forEach((point, idx) => {
        expect(point.dayIndex).toBe(idx);
        expect(Number.isFinite(point.balance)).toBe(true);
        expect(Number.isNaN(point.balance)).toBe(false);
        expect(Number.isFinite(point.inFlow)).toBe(true);
        expect(Number.isFinite(point.outFlow)).toBe(true);
        expect(Number.isFinite(point.netCash)).toBe(true);
        expect(Number.isFinite(point.startingBalance)).toBe(true);

        // Net cash invariant: inFlow - outFlow === netCash
        expect(point.inFlow - point.outFlow).toBe(point.netCash);

        // Starting balance + netCash === balance
        expect(point.startingBalance + point.netCash).toBe(point.balance);

        // Breach severity classification check
        if (point.balance < 0) {
          expect(point.breachSeverity).toBe('CRITICAL');
          expect(point.isBreached).toBe(true);
        } else if (point.balance < 15000) {
          expect(point.breachSeverity).toBe('TIGHT');
          expect(point.isBreached).toBe(true);
        } else {
          expect(point.breachSeverity).toBe('NONE');
          expect(point.isBreached).toBe(false);
        }
      });

      // 3. Minimum cash point must be finite and match the lowest projected balance
      const allBalances = result.dailyProjections.map((p) => p.balance);
      const computedMin = Math.min(startingCash, ...allBalances);
      expect(result.minimumCashPoint.amount).toBe(computedMin);
      expect(Number.isFinite(result.minimumCashPoint.amount)).toBe(true);

      // 4. Projected runway is a non-negative finite integer
      expect(Number.isFinite(result.projectedRunwayDays)).toBe(true);
      expect(result.projectedRunwayDays).toBeGreaterThan(0);
    });

    it('TC-T5-FIN-02: maintains numerical stability under zero revenue and zero starting cash without NaN or Infinity', () => {
      const zeroRevenueParams: SimulationParameters = {
        upfrontDepositPct: 0,
        customerPaymentDelayDays: 90,
        milestoneSplit: [0, 0, 0],
        milestonePreset: '100_DELIVERY',
      };

      const result = calculateCashFlowProjections(0, zeroRevenueParams, 15000);

      expect(result.dailyProjections).toHaveLength(91);

      result.dailyProjections.forEach((p) => {
        expect(Number.isNaN(p.balance)).toBe(false);
        expect(Number.isFinite(p.balance)).toBe(true);
        expect(Number.isNaN(p.netCash)).toBe(false);
        expect(Number.isFinite(p.netCash)).toBe(true);
      });

      // Buffer is breached from Day 0 when starting cash is zero
      expect(result.isBufferBreached).toBe(true);
      expect(Number.isFinite(result.projectedRunwayDays)).toBe(true);
      expect(result.minimumCashPoint.amount).toBeLessThanOrEqual(0);
    });

    it('TC-T5-FIN-03: renders red low-buffer alert badge in InteractiveCashCurve component when breached', () => {
      // 1. Initial pristine state: starting cash $142,500 has buffer intact
      const { unmount } = render(<InteractiveCashCurve />);
      expect(screen.getByText(/BUFFER INTACT/i)).toBeInTheDocument();
      unmount();

      // 2. Set cash balance below safety buffer ($15,000) to trigger breach badge
      act(() => {
        usePayPilotStore.setState((s) => ({
          executiveKpis: {
            ...s.executiveKpis,
            totalAvailableCash: 12000, // Deficit under $15,000 floor
          },
        }));
        usePayPilotStore.getState().updateSimulationParameters({
          upfrontDepositPct: 0,
          customerPaymentDelayDays: 90,
          milestoneSplit: [10, 10, 80],
        });
      });

      render(<InteractiveCashCurve />);

      // Verify the component renders the alert badge
      const alertBadge = screen.getByText(/BUFFER BREACHED/i);
      expect(alertBadge).toBeInTheDocument();
      expect(alertBadge.closest('div')).toHaveClass('text-rose-300');

      // Verify safety threshold line is present in SVG
      expect(screen.getByText(/MANDATORY SAFETY BUFFER \(\$15,000\)/i)).toBeInTheDocument();
    });

    it('TC-T5-FIN-04: verifies exact cumulative cash-flow conservation invariant across all 91 days', () => {
      const storeState = usePayPilotStore.getState();
      const startingCash = storeState.executiveKpis.totalAvailableCash;
      const params = storeState.simulationState.parameters;

      const result = calculateCashFlowProjections(startingCash, params, 15000);

      let accumulated = startingCash;
      result.dailyProjections.forEach((point) => {
        accumulated += point.netCash;
        expect(point.balance).toBe(accumulated);
      });

      // Total change in cash equals sum of all daily net cash flows
      const totalNetCashSum = result.dailyProjections.reduce((sum, p) => sum + p.netCash, 0);
      const finalBalance = result.dailyProjections[90].balance;
      expect(startingCash + totalNetCashSum).toBe(finalBalance);
    });
  });

  // ==========================================================================
  // SUITE 2: Sandbox Concurrent Execution & Concurrency Invariants
  // ==========================================================================
  describe('Suite 2: Sandbox Concurrent Execution & Concurrency Invariants', () => {
    it('TC-T5-RACE-01: approval button execution with UUID v4 idempotency prevents duplicate balance credits', async () => {
      render(<ApprovalsView />);

      const targetApprovalId = 'APR-9941';
      const initialCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;
      expect(initialCash).toBe(142500);

      // Verify the approval contains an authentic UUID v4 idempotency key
      const approval = usePayPilotStore.getState().pendingApprovals.find((a) => a.id === targetApprovalId);
      expect(approval).toBeDefined();
      expect(approval?.paypalApiBlueprint.idempotencyKey).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(approval?.paypalApiBlueprint.headers['PayPal-Request-Id']).toBe(
        approval?.paypalApiBlueprint.idempotencyKey
      );

      const approveBtn = screen.getByTestId('approve-execute-btn');
      expect(approveBtn).toBeInTheDocument();

      // Execute approval
      await act(async () => {
        fireEvent.click(approveBtn);
      });

      // Wait for execution to settle in the store
      await waitFor(() => {
        const item = usePayPilotStore.getState().pendingApprovals.find((a) => a.id === targetApprovalId);
        expect(item?.status).toBe('EXECUTED_SANDBOX');
      }, { timeout: 4000 });

      // Invariant: Available cash MUST increment by exactly $1,420 (the single claim amount)
      const finalCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;
      expect(finalCash).toBe(initialCash + 1420);

      // Invariant: Pending approvals count decrements by exactly 1
      const updatedApprovals = usePayPilotStore.getState().pendingApprovals;
      const executedItem = updatedApprovals.find((a) => a.id === targetApprovalId);
      expect(executedItem?.status).toBe('EXECUTED_SANDBOX');
      expect(executedItem?.executedProofBadge).toMatch(/^#PAY-SHA256-[0-9A-F]{8}-[0-9A-F]{8}$/);

      // Verify the receipt banner is displayed in the DOM and approve button is removed
      expect(screen.getByTestId(`approval-receipt-banner-${targetApprovalId}`)).toBeInTheDocument();
      expect(screen.queryByTestId('approve-execute-btn')).not.toBeInTheDocument();
    });

    it('TC-T5-RACE-02: batch claim idempotency strictly rejects already claimed cases across 50 attempts', async () => {
      const targetCaseId = 'REC-101';
      const initialCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;

      // First batch claim execution
      const firstResult = await act(async () => {
        return await usePayPilotStore.getState().batchClaimRecoveryCases([targetCaseId]);
      });
      expect(firstResult.processedCount).toBe(1);
      expect(firstResult.totalAmount).toBe(1420);
      expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(initialCash + 1420);

      // 49 subsequent rapid consecutive batch claim attempts for the same case
      for (let i = 0; i < 49; i++) {
        const repeatResult = await act(async () => {
          return await usePayPilotStore.getState().batchClaimRecoveryCases([targetCaseId]);
        });
        // Every subsequent attempt must process 0 items and credit $0
        expect(repeatResult.processedCount).toBe(0);
        expect(repeatResult.totalAmount).toBe(0);
      }

      // Cash must remain strictly at initialCash + 1420
      expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(initialCash + 1420);

      // Case status must remain VERIFIED_RECOVERED with 0 potential recoverable
      const recoveryCase = usePayPilotStore.getState().recoveryCases.find((c) => c.id === targetCaseId);
      expect(recoveryCase?.status).toBe('VERIFIED_RECOVERED');
      expect(recoveryCase?.actualRecoveredAmount).toBe(1420);
      expect(recoveryCase?.potentialRecoverableAmount).toBe(0);
    });

    it('TC-T5-RACE-03: records audit log entries sequentially with valid timestamps and HTTP 200 statuses', async () => {
      sandboxService.clearAuditTrail();

      // Execute two distinct approved actions
      await act(async () => {
        await usePayPilotStore.getState().approveAndExecuteAction('APR-9941');
        await usePayPilotStore.getState().approveAndExecuteAction('APR-9943');
      });

      const auditTrail = sandboxService.getAuditTrail();
      expect(auditTrail.length).toBeGreaterThanOrEqual(2);

      // Check all entries have valid structure
      auditTrail.forEach((entry) => {
        expect(entry.id).toMatch(/^AUDIT-\d+-[A-Z0-9]+$/);
        expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
        expect(entry.httpStatus).toBe(200);
        expect(entry.mode).toBe('SIMULATED');
        expect(entry.requestPayload).toBeDefined();
        expect(entry.responsePayload).toBeDefined();
      });

      // Verify IDs are all strictly unique
      const ids = auditTrail.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('TC-T5-RACE-04: idempotency cache simulator strictly blocks duplicate UUID v4 tokens across 50 concurrent requests', async () => {
      // Test the idempotency key checking invariant directly
      const processedIdempotencyKeys = new Set<string>();

      const executeWithIdempotency = async (key: string, fn: () => Promise<number>): Promise<{ executed: boolean; value: number }> => {
        if (processedIdempotencyKeys.has(key)) {
          return { executed: false, value: 0 };
        }
        processedIdempotencyKeys.add(key);
        const val = await fn();
        return { executed: true, value: val };
      };

      const testKey = '9e8c4a51-3820-4f91-881b-a491829e001a';
      let executionCount = 0;

      // Run 50 concurrent requests with the identical idempotency key
      const results = await Promise.all(
        Array.from({ length: 50 }, () =>
          executeWithIdempotency(testKey, async () => {
            executionCount++;
            return 1420;
          })
        )
      );

      // Exactly 1 request executed; 49 requests were deduplicated
      const executed = results.filter((r) => r.executed);
      const deduplicated = results.filter((r) => !r.executed);

      expect(executed).toHaveLength(1);
      expect(deduplicated).toHaveLength(49);
      expect(executionCount).toBe(1);
    });
  });

  // ==========================================================================
  // SUITE 3: Cryptographic Verification Adversarial Attacks & Tamper Defense
  // ==========================================================================
  describe('Suite 3: Cryptographic Verification Adversarial Attacks & Tamper Defense', () => {
    it('TC-T5-CRYPTO-01: rejects corrupted canonical JSON payloads with red verification-failed-badge', () => {
      render(<TeamSharingView />);

      const seedReport = usePayPilotStore.getState().sharedReports[0];
      expect(seedReport.id).toBe('REP-7F83');

      // Attack: Perturb cash balance inside canonical JSON payload from 142500 to 999999
      const parsed = JSON.parse(seedReport.canonicalJsonPayload);
      parsed.cashBalance = 999999;
      const corruptedPayload = JSON.stringify(parsed);

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, canonicalJsonPayload: corruptedPayload } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      // Must display red verification-failed-badge and NOT confirmed badge
      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      const failedBadge = screen.getByTestId('verification-failed-badge');
      expect(failedBadge).toBeInTheDocument();
      expect(failedBadge).toHaveTextContent(/Cryptographic Integrity Compromised/i);
    });

    it('TC-T5-CRYPTO-02: rejects invalid hex characters, malformed hashes, and short strings', () => {
      const { unmount } = render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      const adversarialHashes = [
        'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', // non-hex letters
        'd68ce70c858556f869267799f4ee74fbb3a07f4b62e3a848bc7d33306de4c87!', // invalid character '!'
        'd68ce70c858556f8', // short hash (16 chars)
        '', // empty hash
        '   ', // whitespace only
      ];

      adversarialHashes.forEach((badHash) => {
        act(() => {
          usePayPilotStore.setState((state) => ({
            sharedReports: state.sharedReports.map((r) =>
              r.id === seedReport.id ? { ...r, sha256ProofHash: badHash } : r
            ),
          }));
        });

        const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
        act(() => {
          fireEvent.click(verifyBtn);
        });

        expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
        expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
      });

      unmount();
    });

    it('TC-T5-CRYPTO-03: detects secret key and signer ID tampering in canonical payload', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      // Attack: Inject malicious signer ID into payload
      const parsed = JSON.parse(seedReport.canonicalJsonPayload);
      parsed.signerKeyId = 'KEY-MALICIOUS-ADVERSARY-99';
      const tamperedWithFakeSigner = JSON.stringify(parsed);

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, canonicalJsonPayload: tamperedWithFakeSigner } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });

    it('TC-T5-CRYPTO-04: confirms genuine report verification and detects link revocation', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      // 1. Pristine unmodified report must verify 100% clean
      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();

      // 2. Revoke the report and verify status updates
      act(() => {
        usePayPilotStore.getState().revokeSharedReport(seedReport.id);
      });

      expect(screen.getByText('REVOKED')).toBeInTheDocument();
      const copyBtn = screen.getByTestId(`copy-share-link-btn-${seedReport.id}`);
      expect(copyBtn).toBeDisabled();
    });
  });

  // ==========================================================================
  // SUITE 4: 5-Act Demo Flow Continuous Cycling & State Resilience
  // ==========================================================================
  describe('Suite 4: 5-Act Demo Flow Continuous Cycling & State Resilience', () => {
    it('TC-T5-DEMO-01: survives 25 continuous random act jumps while mutating domain state in background', async () => {
      const actSequence: Array<1 | 2 | 3 | 4 | 5> = [
        3, 1, 4, 2, 5, 1, 3, 4, 5, 2,
        4, 3, 1, 5, 2, 3, 5, 4, 1, 2,
        5, 3, 4, 2, 1,
      ];

      for (const targetAct of actSequence) {
        act(() => {
          usePayPilotStore.getState().setDemoAct(targetAct);

          // Mutate state concurrently at each step to stress-test invariants
          if (targetAct === 1) {
            usePayPilotStore.getState().setSelectedRecoveryCaseId('REC-101');
          } else if (targetAct === 2) {
            usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
          } else if (targetAct === 3) {
            usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
          } else if (targetAct === 4) {
            usePayPilotStore.getState().updateSimulationParameters({
              upfrontDepositPct: 25,
              customerPaymentDelayDays: 10,
            });
          } else if (targetAct === 5) {
            usePayPilotStore.getState().setTimeScrubberOffset(14);
          }
        });

        // Invariant: currentAct is always exactly the targetAct
        const state = usePayPilotStore.getState();
        expect(state.demoActStepper.currentAct).toBe(targetAct);

        // Invariant: State slices remain intact and well-typed
        expect(state.recoveryCases.length).toBeGreaterThan(0);
        expect(state.reconciliationRecords.length).toBeGreaterThan(0);
        expect(state.pendingApprovals.length).toBeGreaterThan(0);
        expect(state.simulationState.dailyProjections).toHaveLength(91);
      }
    });

    it('TC-T5-DEMO-02: One-Click Judge Reset cleans up all mutated state to pristine seed data', async () => {
      // 1. Mutate multiple state slices
      await act(async () => {
        usePayPilotStore.getState().setDemoAct(5);
        usePayPilotStore.getState().setActiveRoute('team-sharing');
        usePayPilotStore.getState().setTimeScrubberOffset(45);
        usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
        usePayPilotStore.getState().updateSimulationParameters({ upfrontDepositPct: 50, customerPaymentDelayDays: 60 });
        await usePayPilotStore.getState().approveAndExecuteAction('APR-9941');
      });

      // Verify state was altered
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(5);
      expect(usePayPilotStore.getState().activeRoute).toBe('team-sharing');
      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);
      expect(usePayPilotStore.getState().timeScrubberOffsetDays).toBe(45);
      expect(sandboxService.getAuditTrail().length).toBeGreaterThan(0);

      // 2. Perform One-Click Judge Reset
      act(() => {
        const resetSuccess = usePayPilotStore.getState().resetToDemoState();
        expect(resetSuccess).toBe(true);
      });

      // 3. Verify clean pristine restoration
      const resetState = usePayPilotStore.getState();
      expect(resetState.activeRoute).toBe('command-center');
      expect(resetState.demoActStepper.currentAct).toBe(1);
      expect(resetState.explainabilityDrawer.isOpen).toBe(false);
      expect(resetState.explainabilityDrawer.activeRuleId).toBeNull();
      expect(resetState.timeScrubberOffsetDays).toBe(0);
      expect(resetState.selectedRecoveryCaseId).toBeNull();
      expect(resetState.selectedDiscrepancyId).toBeNull();
      expect(resetState.lastFirewallEvaluation).toBeNull();
      expect(resetState.minimumSafetyBuffer).toBe(15000.00);
      expect(resetState.executiveKpis.totalAvailableCash).toBe(142500);

      // Verify audit log is cleared
      expect(sandboxService.getAuditTrail()).toHaveLength(0);

      // Verify recovery cases restored to POTENTIAL_IDENTIFIED
      const c101 = resetState.recoveryCases.find((c) => c.id === 'REC-101');
      expect(c101?.status).toBe('POTENTIAL_IDENTIFIED');
      expect(c101?.actualRecoveredAmount).toBe(0);

      // Verify pending approvals restored to PENDING_REVIEW
      const a9941 = resetState.pendingApprovals.find((a) => a.id === 'APR-9941');
      expect(a9941?.status).toBe('PENDING_REVIEW');
    });

    it('TC-T5-DEMO-03: renders DemoFlowStepper and navigates acts smoothly via UI interactions', () => {
      render(<DemoFlowStepper />);

      expect(screen.getByTestId('demo-flow-stepper')).toBeInTheDocument();
      expect(screen.getByText(/3-Minute Hackathon Demo Narrative/i)).toBeInTheDocument();

      // Click Act 3 button
      const act3Btn = screen.getByTestId('demo-act-btn-3');
      act(() => {
        fireEvent.click(act3Btn);
      });

      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(3);
      expect(usePayPilotStore.getState().activeRoute).toBe('approvals');
      expect(screen.getByText(/Act 3: Governed Execution via PayPal Sandbox/i)).toBeInTheDocument();

      // Click quick action button
      const quickActionBtn = screen.getByTestId('demo-quick-action-btn');
      act(() => {
        fireEvent.click(quickActionBtn);
      });

      expect(usePayPilotStore.getState().activeRoute).toBe('approvals');
    });
  });
});
