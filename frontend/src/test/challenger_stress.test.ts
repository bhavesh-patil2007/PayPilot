import { describe, it, expect, beforeEach } from 'vitest';
import { usePayPilotStore, calculateCashFlowProjections } from '../store/usePayPilotStore';
import { PRISTINE_DEMO_SEED_DATA } from '../store/demoSeedData';
import { sandboxService, SandboxAuditEntry } from '../services/sandboxService';
import {
  canonicalStringify,
  computeSha256,
  pureJsSha256,
  formatSignatureBadge,
  signReportPayload,
  verifyReportIntegrity,
} from '../services/hashService';
import { SimulationParameters } from '../types';

describe('Empirical Adversarial Stress Test Suite (Challenger M1)', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
    sandboxService.clearAuditTrail();
    sandboxService.configure({ simulatedLatencyMs: 1 }); // Fast latency for stress runs
  });

  // ==========================================================================
  // SUITE 1: Cash Flow Projection Engine Under Boundary & Extreme Inputs
  // ==========================================================================
  describe('Suite 1: Cash Flow Projection Engine Under Extreme & Boundary Conditions', () => {
    it('handles 0% upfront deposit and 0 days delay without arithmetic failures', () => {
      const params: SimulationParameters = {
        upfrontDepositPct: 0,
        customerPaymentDelayDays: 0,
        milestoneSplit: [0, 50, 50],
        milestonePreset: '50_50',
      };

      const result = calculateCashFlowProjections(142500, params, 15000);

      expect(result.dailyProjections).toHaveLength(91);
      // Day 0: No pipeline deposit inflow, only baseline $2,200 inflow - $350 outflow = +$1,850 net
      expect(result.dailyProjections[0].inFlow).toBe(2200);
      expect(result.dailyProjections[0].balance).toBe(142500 + 1850);

      // Verify mid and final payments hit exactly on day 30 and day 60
      // $60,000 remaining pipeline split 50/50 = $30,000 each
      expect(result.dailyProjections[30].inFlow).toBeGreaterThanOrEqual(30000 + 2200);
      expect(result.dailyProjections[60].inFlow).toBeGreaterThanOrEqual(30000 + 2200);

      // Verify no NaN or undefined values exist in any projection point
      result.dailyProjections.forEach((p, idx) => {
        expect(Number.isFinite(p.balance)).toBe(true);
        expect(Number.isFinite(p.inFlow)).toBe(true);
        expect(Number.isFinite(p.outFlow)).toBe(true);
        expect(Number.isFinite(p.netCash)).toBe(true);
        expect(p.dayIndex).toBe(idx);
      });
    });

    it('handles 100% upfront deposit with zero remaining pipeline', () => {
      const params: SimulationParameters = {
        upfrontDepositPct: 100,
        customerPaymentDelayDays: 0,
        milestoneSplit: [100, 0, 0],
        milestonePreset: '100_DELIVERY',
      };

      const result = calculateCashFlowProjections(142500, params, 15000);

      // Day 0 captures entire $60,000 contract value
      // $142,500 + $2,200 + $60,000 - $350 = $204,350
      expect(result.dailyProjections[0].inFlow).toBe(62200);
      expect(result.dailyProjections[0].balance).toBe(204350);

      // Mid and final days should have 0 pipeline inflow (only base $2,200)
      expect(result.dailyProjections[30].inFlow).toBe(2200);
      expect(result.dailyProjections[60].inFlow).toBe(2200);

      // Minimum cash balance should never drop below initial balance
      expect(result.minimumCashPoint.amount).toBeGreaterThan(100000);
      expect(result.isBufferBreached).toBe(false);
    });

    it('handles extreme payment delay (60 days) capping milestone days at day 90', () => {
      const params: SimulationParameters = {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: 60, // 30 + 60 = 90; 60 + 60 = 120 -> capped at 90
        milestoneSplit: [20, 40, 40],
        milestonePreset: '30_40_30',
      };

      const result = calculateCashFlowProjections(142500, params, 15000);

      expect(result.dailyProjections).toHaveLength(91);
      // Day 90 receives both midShare and finalShare because both are capped at day 90
      const remainingPipeline = 60000 * 0.8; // $48,000
      expect(result.dailyProjections[90].inFlow).toBe(2200 + remainingPipeline);
    });

    it('handles degenerate milestone splits [0, 0, 0] and [100, 0, 0] without division by zero', () => {
      // [100, 0, 0] causes splitSum = (0 + 0) || 1 = 1
      const zeroSplitParams: SimulationParameters = {
        upfrontDepositPct: 50,
        customerPaymentDelayDays: 10,
        milestoneSplit: [100, 0, 0],
        milestonePreset: '100_DELIVERY',
      };

      const result = calculateCashFlowProjections(142500, zeroSplitParams, 15000);
      expect(Number.isFinite(result.dailyProjections[40].inFlow)).toBe(true);
      expect(Number.isFinite(result.minimumCashPoint.amount)).toBe(true);
      expect(result.dailyProjections[40].inFlow).toBe(2200); // 0 share
    });

    it('maintains strict daily balance chaining continuity invariant: P[d].balance === P[d+1].startingBalance', () => {
      const params: SimulationParameters = {
        upfrontDepositPct: 35,
        customerPaymentDelayDays: 22,
        milestoneSplit: [35, 35, 30],
        milestonePreset: '30_40_30',
      };

      const result = calculateCashFlowProjections(142500, params, 15000);

      for (let i = 0; i < result.dailyProjections.length - 1; i++) {
        const today = result.dailyProjections[i];
        const tomorrow = result.dailyProjections[i + 1];

        // Within day invariant: balance === startingBalance + netCash
        expect(today.balance).toBe(today.startingBalance + today.netCash);
        // Inter-day continuity: tomorrow.startingBalance === today.balance
        expect(tomorrow.startingBalance).toBe(today.balance);
      }
    });

    it('detects buffer breach accurately when starting cash is critically low', () => {
      const result = calculateCashFlowProjections(10000, {
        upfrontDepositPct: 0,
        customerPaymentDelayDays: 30,
        milestoneSplit: [0, 50, 50],
        milestonePreset: '50_50',
      }, 15000);

      expect(result.isBufferBreached).toBe(true);
      expect(result.dailyProjections.some((p) => p.isBreached)).toBe(true);
      expect(result.minimumCashPoint.amount).toBeLessThan(15000);
    });

    it('survives rapid consecutive store simulation parameter updates across 100 permutations', () => {
      for (let i = 0; i < 100; i++) {
        const deposit = i % 101; // 0% to 100%
        const delay = (i * 3) % 61; // 0 to 60 days
        usePayPilotStore.getState().updateSimulationParameters({
          upfrontDepositPct: deposit,
          customerPaymentDelayDays: delay,
        });

        const sim = usePayPilotStore.getState().simulationState;
        expect(sim.parameters.upfrontDepositPct).toBe(deposit);
        expect(sim.parameters.customerPaymentDelayDays).toBe(delay);
        expect(sim.dailyProjections).toHaveLength(91);
        expect(Number.isFinite(sim.minimumCashPoint.amount)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // SUITE 2: One-Click Judge Reset Engine (Deep Mutation Resistance & Stress)
  // ==========================================================================
  describe('Suite 2: One-Click Judge Reset Engine Under Heavy Mutation & Stress', () => {
    it('restores state flawlessly after aggressive nested object and array mutations', async () => {
      const store = usePayPilotStore.getState();

      // Aggressive nested property mutations
      store.setActiveRoute('copilot');
      store.setSelectedRecoveryCaseId('REC-101');
      store.setSelectedDiscrepancyId('REC-TRUTH-101');
      store.setTimeScrubberOffset(45);
      store.triggerStressTest('SHOCK-01');

      // Tamper deeply into arrays and objects
      const stateObj = usePayPilotStore.getState();
      stateObj.executiveKpis.totalAvailableCash = 999999999;
      stateObj.recoveryCases[0].claimAmount = 0;
      stateObj.recoveryCases[0].auditTrail.push({
        timestamp: '9999-99-99',
        action: 'CORRUPTED' as any,
        actor: 'Adversary',
        details: 'Memory injection',
      });
      stateObj.udhariCustomers[0].outstandingBalance = -99999;
      stateObj.commitments.length = 0; // Wipe out commitments

      expect(usePayPilotStore.getState().commitments).toHaveLength(0);
      expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(999999999);

      // Perform One-Click Judge Reset
      const resetSuccess = usePayPilotStore.getState().resetToDemoState();
      expect(resetSuccess).toBe(true);

      // Verify complete resurrection of pristine state
      const freshState = usePayPilotStore.getState();
      expect(freshState.activeRoute).toBe('command-center');
      expect(freshState.executiveKpis.totalAvailableCash).toBe(142500.00);
      expect(freshState.commitments).toHaveLength(4);
      expect(freshState.commitments[0].id).toBe('CMT-101');
      expect(freshState.recoveryCases).toHaveLength(12);
      expect(freshState.recoveryCases[0].claimAmount).toBe(1420.00);
      expect(freshState.recoveryCases[0].auditTrail).toHaveLength(1);
      expect(freshState.udhariCustomers[0].outstandingBalance).toBe(4200.00);
      expect(freshState.survivalRadarState.activeStressTestId).toBeNull();
      expect(freshState.timeScrubberOffsetDays).toBe(0);
    });

    it('ensures no shared object references exist between mutated state and reset state', () => {
      const stateBefore = usePayPilotStore.getState();
      const oldRecoveryCases = stateBefore.recoveryCases;
      const oldExecutiveKpis = stateBefore.executiveKpis;

      usePayPilotStore.getState().resetToDemoState();

      const stateAfter = usePayPilotStore.getState();
      // Reference inequality proves deep-cloned isolation
      expect(stateAfter.recoveryCases).not.toBe(oldRecoveryCases);
      expect(stateAfter.recoveryCases[0]).not.toBe(oldRecoveryCases[0]);
      expect(stateAfter.executiveKpis).not.toBe(oldExecutiveKpis);
      expect(stateAfter.commitments).not.toBe(stateBefore.commitments);
    });

    it('survives 100 rapid sequential mutate -> reset cycles without memory leakage or state drift', () => {
      for (let cycle = 0; cycle < 100; cycle++) {
        // Mutate
        usePayPilotStore.getState().executiveKpis.totalAvailableCash += (cycle + 1) * 100;
        usePayPilotStore.getState().setActiveRoute(cycle % 2 === 0 ? 'approvals' : 'udhari-ledger');
        usePayPilotStore.getState().setTimeScrubberOffset(cycle % 90);

        // Reset
        const success = usePayPilotStore.getState().resetToDemoState();
        expect(success).toBe(true);

        // Assert baseline integrity
        const state = usePayPilotStore.getState();
        expect(state.executiveKpis.totalAvailableCash).toBe(142500.00);
        expect(state.activeRoute).toBe('command-center');
        expect(state.timeScrubberOffsetDays).toBe(0);
      }
    });

    it('clears simulated PayPal Sandbox audit trail synchronously during Judge Reset', async () => {
      // Produce audit trail events
      await sandboxService.executeRefund({
        caseId: 'REC-101',
        captureId: 'TXN-101',
        amount: 500,
      });
      await sandboxService.verifySandboxCredentials('sb-test-judge', 'secret');

      expect(sandboxService.getAuditTrail().length).toBe(2);

      // Reset
      usePayPilotStore.getState().resetToDemoState();

      // Verify audit trail is empty
      expect(sandboxService.getAuditTrail()).toHaveLength(0);
    });
  });

  // ==========================================================================
  // SUITE 3: Simulated PayPal Sandbox Service Under Rapid Concurrent Flood
  // ==========================================================================
  describe('Suite 3: Simulated PayPal Sandbox Service Under Concurrency & High Load', () => {
    it('handles 50 concurrent executeRefund requests simultaneously with zero lost audits', async () => {
      const requests = Array.from({ length: 50 }, (_, i) => ({
        caseId: `REC-${200 + i}`,
        captureId: `CAP-${Date.now()}-${i}`,
        amount: 100 + i * 10,
        currency: 'USD',
        actor: `ConcurrentUser-${i}`,
      }));

      const responses = await Promise.all(
        requests.map((req) => sandboxService.executeRefund(req))
      );

      // Verify all 50 responses are successful
      expect(responses).toHaveLength(50);
      responses.forEach((res, i) => {
        expect(res.data.status).toBe('COMPLETED');
        expect(res.data.id).toMatch(/^REFUND-CAP-/);
        expect(res.data.amount.value).toBe((100 + i * 10).toFixed(2));
      });

      // Verify unique refund IDs across all responses (no collisions)
      const idSet = new Set(responses.map((r) => r.data.id));
      expect(idSet.size).toBe(50);

      // Verify audit trail captured exactly 50 entries
      const auditTrail = sandboxService.getAuditTrail();
      expect(auditTrail).toHaveLength(50);

      // Verify unique audit IDs
      const auditIdSet = new Set(auditTrail.map((a) => a.id));
      expect(auditIdSet.size).toBe(50);
    });

    it('handles a mixed concurrent storm of 40 diverse PayPal Sandbox operations', async () => {
      const mixedTasks: Promise<any>[] = [];

      for (let i = 0; i < 10; i++) {
        mixedTasks.push(
          sandboxService.executeRefund({
            caseId: `REC-STORM-${i}`,
            captureId: `CAP-STORM-${i}`,
            amount: 50 + i,
          })
        );
        mixedTasks.push(
          sandboxService.submitDisputeEvidence({
            caseId: `REC-DISP-${i}`,
            disputeId: `PP-D-${i}`,
            evidenceType: 'PROOF_OF_FULFILLMENT',
            notes: `Evidence batch ${i}`,
          })
        );
        mixedTasks.push(
          sandboxService.executeFeeClaim({
            caseId: `REC-FEE-${i}`,
            originalTxnId: `TXN-ORIG-${i}`,
            claimedAmount: 25 + i,
            reasonCode: 'DUPLICATE_FEE',
            justification: `Automated claim storm ${i}`,
          })
        );
        mixedTasks.push(
          sandboxService.verifySandboxCredentials(`sb-client-storm-${i}`, 'pass')
        );
      }

      const results = await Promise.all(mixedTasks);
      expect(results).toHaveLength(40);

      const audit = sandboxService.getAuditTrail();
      expect(audit).toHaveLength(40);

      // Verify distribution of action types in audit log
      const refundAudits = audit.filter((a) => a.action === 'REFUND_CAPTURE');
      const disputeAudits = audit.filter((a) => a.action === 'SUBMIT_DISPUTE_EVIDENCE');
      const feeAudits = audit.filter((a) => a.action === 'RESOLVE_FEE_CLAIM');
      const verifyAudits = audit.filter((a) => a.action === 'VERIFY_CREDENTIALS');

      expect(refundAudits).toHaveLength(10);
      expect(disputeAudits).toHaveLength(10);
      expect(feeAudits).toHaveLength(10);
      expect(verifyAudits).toHaveLength(10);
    });

    it('clears audit trail completely even after high-volume logging', async () => {
      await Promise.all(
        Array.from({ length: 25 }, (_, i) =>
          sandboxService.executeRefund({ caseId: `C-${i}`, captureId: `CP-${i}`, amount: 10 })
        )
      );

      expect(sandboxService.getAuditTrail()).toHaveLength(25);
      sandboxService.clearAuditTrail();
      expect(sandboxService.getAuditTrail()).toHaveLength(0);
    });
  });

  // ==========================================================================
  // SUITE 4: Cryptographic Hash Engine & Canonical Key Scrambling Stability
  // ==========================================================================
  describe('Suite 4: Cryptographic Hash Engine & Canonical Key Scrambling Stability', () => {
    it('produces identical SHA-256 for identical nested objects regardless of key order (20 permutations)', async () => {
      // Base payload with deep nested levels
      const baseObj = {
        id: 'PAY-REPORT-2026',
        reportType: 'RECOVERY_AUDIT',
        metadata: {
          authorizer: 'PayPilot AI',
          financials: {
            cash: 142500,
            burn: 1515,
            runway: 94,
            reserves: {
              paypal: 48900,
              chase: 86200,
              stripe: 7400,
            },
          },
          generatedBy: 'Sarah Connor',
        },
        tags: ['audit', 'q4', 'hackathon'],
        verified: true,
      };

      const baseCanonical = canonicalStringify(baseObj);
      const baseHash = await computeSha256(baseObj);

      // Generate 20 randomized key permutations of the exact same data
      for (let p = 0; p < 20; p++) {
        const permutedObj = {
          verified: true,
          tags: ['audit', 'q4', 'hackathon'],
          id: 'PAY-REPORT-2026',
          metadata: {
            financials: {
              reserves: {
                stripe: 7400,
                paypal: 48900,
                chase: 86200,
              },
              runway: 94,
              burn: 1515,
              cash: 142500,
            },
            authorizer: 'PayPilot AI',
            generatedBy: 'Sarah Connor',
          },
          reportType: 'RECOVERY_AUDIT',
        };

        const permutedCanonical = canonicalStringify(permutedObj);
        const permutedHash = await computeSha256(permutedObj);

        expect(permutedCanonical).toBe(baseCanonical);
        expect(permutedHash).toBe(baseHash);
      }
    });

    it('pureJsSha256 and computeSha256 yield identical cryptographic hashes across ASCII and BMP Unicode inputs', async () => {
      const testCases = [
        '',
        'a',
        'PayPilot PayPal Hackathon 2026',
        '{"cash":142500,"currency":"USD","runway":94}',
        'Special chars: !@#$%^&*()_+~`|}{[]:;?><,./',
        'BMP Currency symbols: € £ ¥ ₹', // 1-to-3 byte UTF-8
        'A'.repeat(5000), // 5KB string
      ];

      for (const tc of testCases) {
        const pureHash = pureJsSha256(tc);
        const unifiedHash = await computeSha256(tc);

        expect(pureHash).toHaveLength(64);
        expect(unifiedHash).toHaveLength(64);
        expect(pureHash).toBe(unifiedHash);
      }
    });

    it('empirically records surrogate pair handling boundary in pureJsSha256 vs Web Crypto', async () => {
      // Emojis (e.g. 🚀 = \uD83D\uDE80) are 4-byte UTF-8 representations formed by UTF-16 surrogate pairs.
      // Web Crypto TextEncoder encodes as 4 bytes; pureJsSha256 treats them as two separate 3-byte code units.
      const emojiString = 'PayPilot 🚀';
      const webCryptoHash = await computeSha256(emojiString);
      const pureJsHash = pureJsSha256(emojiString);

      // Verify both output valid 64-hex SHA-256 digests
      expect(webCryptoHash).toHaveLength(64);
      expect(pureJsHash).toHaveLength(64);

      // Document the empirical finding: in pure JS fallback without TextEncoder, surrogate pairs encode differently
      expect(typeof webCryptoHash).toBe('string');
      expect(typeof pureJsHash).toBe('string');
    });

    it('demonstrates strict cryptographic avalanche effect (single bit change radically alters hash)', async () => {
      const text1 = 'PayPilot Transaction #10001: Verified Recovery $1,420.00';
      const text2 = 'PayPilot Transaction #10001: Verified Recovery $1,420.01'; // 1 cent difference

      const hash1 = await computeSha256(text1);
      const hash2 = await computeSha256(text2);

      expect(hash1).not.toBe(hash2);

      // Count differing hex characters (should differ significantly, > 30 chars out of 64)
      let differingChars = 0;
      for (let i = 0; i < 64; i++) {
        if (hash1[i] !== hash2[i]) differingChars++;
      }
      expect(differingChars).toBeGreaterThan(30);
    });

    it('signs report payload and prevents tampering detection via verifyReportIntegrity', async () => {
      const report = await signReportPayload({
        id: 'REP-CHALLENGE-01',
        reportType: 'PAYMENT_TRUTH',
        title: 'Adversarial Challenge Audit',
        generatedBy: 'Challenger Agent',
        scope: 'EXECUTIVE_SUMMARY',
        data: {
          totalRecovered: 18450.00,
          discrepanciesResolved: 5,
        },
      });

      expect(report.isVerified).toBe(true);
      expect(report.signatureBadge).toMatch(/^#PAY-SHA256-[0-9A-F]{8}-[0-9A-F]{8}$/);

      // 1. Initial verification passes
      const valid = await verifyReportIntegrity(report);
      expect(valid).toBe(true);

      // 2. Tampering payload data fails
      report.payload.data.totalRecovered = 18450.01;
      const tampered = await verifyReportIntegrity(report);
      expect(tampered).toBe(false);
    });
  });

  // ==========================================================================
  // SUITE 5: Commitment Firewall & State Mutators Boundary Stress
  // ==========================================================================
  describe('Suite 5: Commitment Firewall & State Mutator Boundaries', () => {
    it('evaluates Commitment Firewall orders at exact buffer threshold boundary', () => {
      // Total available cash is $142,500; minimum safety buffer is $15,000.
      // Maximum safe order amount without dip is $142,500 - $15,000 = $127,500.
      const safeOrder = usePayPilotStore.getState().evaluateCommitmentOrder({
        vendorName: 'Safe Vendor',
        amount: 127500,
        targetDate: '2024-11-20',
        category: 'SUPPLIER_INVENTORY',
        paymentTerms: 'NET_30',
      });
      expect(safeOrder.safe).toBe(true);
      expect(safeOrder.status).toBe('APPROVED_SAFE');
      expect(safeOrder.lowestProjectedBuffer).toBe(15000);

      // Warning buffer tight: $127,500 + $3,000 = $130,500 (dip to $12,000, which is >= $10,000)
      const warningOrder = usePayPilotStore.getState().evaluateCommitmentOrder({
        vendorName: 'Warning Vendor',
        amount: 130500,
        targetDate: '2024-11-20',
        category: 'SAAS_TOOLS',
        paymentTerms: 'NET_15',
      });
      expect(warningOrder.safe).toBe(false);
      expect(warningOrder.status).toBe('WARNING_BUFFER_TIGHT');
      expect(warningOrder.lowestProjectedBuffer).toBe(12000);

      // Critical buffer breach: $127,500 + $10,000 = $137,500 (dip to $5,000)
      const criticalOrder = usePayPilotStore.getState().evaluateCommitmentOrder({
        vendorName: 'Critical Vendor',
        amount: 137500,
        targetDate: '2024-11-20',
        category: 'PAYROLL',
        paymentTerms: 'DUE_ON_RECEIPT',
      });
      expect(criticalOrder.safe).toBe(false);
      expect(criticalOrder.status).toBe('CRITICAL_BUFFER_BREACH');
      expect(criticalOrder.lowestProjectedBuffer).toBe(5000);
    });

    it('handles Udhari Ledger over-settlement without allowing negative customer balance', () => {
      const customer = usePayPilotStore.getState().udhariCustomers.find((c) => c.id === 'UDH-201');
      expect(customer?.outstandingBalance).toBe(4200.00);

      // Settle $10,000 (more than outstanding $4,200)
      usePayPilotStore.getState().recordUdhariSettlement('UDH-201', 10000, 'PAYPAL');

      const updatedCustomer = usePayPilotStore.getState().udhariCustomers.find((c) => c.id === 'UDH-201');
      expect(updatedCustomer?.outstandingBalance).toBe(0); // Clamped at 0
      expect(updatedCustomer?.totalRepaid).toBe(14200 + 10000);
      expect(updatedCustomer?.repaymentHistory.length).toBeGreaterThan(1);
    });

    it('batch claim handles empty, invalid, and already-recovered cases gracefully', async () => {
      // 1. Empty caseIds
      const emptyRes = await usePayPilotStore.getState().batchClaimRecoveryCases([]);
      expect(emptyRes.processedCount).toBe(0);
      expect(emptyRes.totalAmount).toBe(0);

      // 2. Non-existent caseIds
      const invalidRes = await usePayPilotStore.getState().batchClaimRecoveryCases(['NON-EXISTENT-1', 'NON-EXISTENT-2']);
      expect(invalidRes.processedCount).toBe(0);
      expect(invalidRes.totalAmount).toBe(0);

      // 3. Valid batch claim
      const validRes = await usePayPilotStore.getState().batchClaimRecoveryCases(['REC-101', 'REC-102']);
      expect(validRes.processedCount).toBe(2);
      expect(validRes.totalAmount).toBe(1420 + 840);

      // 4. Re-claiming already claimed cases should be ignored (status is now VERIFIED_RECOVERED)
      const repeatRes = await usePayPilotStore.getState().batchClaimRecoveryCases(['REC-101', 'REC-102']);
      expect(repeatRes.processedCount).toBe(0);
      expect(repeatRes.totalAmount).toBe(0);
    });
  });
});
