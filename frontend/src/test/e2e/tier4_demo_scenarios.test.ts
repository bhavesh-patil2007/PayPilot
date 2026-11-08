import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPayPilotStore,
  calculateDailyCashProjections,
  evaluateOrderAgainstBuffer,
  computeCanonicalSha256,
} from './testHarness';

describe('Tier 4: Real-World Application Scenarios — 5-Act Hackathon Demo Flow', () => {
  let store: any;

  beforeEach(async () => {
    store = await getPayPilotStore();
    store.resetToDemoState();
  });

  it('Full 5-Act Hackathon Demo Flow: [Find ➔ Prove ➔ Recover ➔ Protect ➔ Share]', async () => {
    // =========================================================================
    // ACT 1: FIND (PayBack Hunter & Autonomous Audit Detection)
    // =========================================================================
    // 1.1 Judge navigates to PayBack Hunter
    store.setActiveRoute('payback-hunter');
    store.setDemoAct(1);
    expect(store.getState().activeRoute).toBe('payback-hunter');
    expect(store.getState().demoAct).toBe(1);

    // 1.2 Inspect Recovery Funnel metrics
    const cases = store.getState().recoveryCases;
    const identifiedCases = cases.filter((c: any) => c.status === 'POTENTIAL_IDENTIFIED');
    expect(identifiedCases.length).toBeGreaterThanOrEqual(3);

    // 1.3 Find Case REC-101: Duplicate Merchant Fee Overcharge of $1,420.00
    const rec101 = cases.find((c: any) => c.caseNumber === 'REC-101');
    expect(rec101).toBeDefined();
    expect(rec101.claimAmount).toBe(1420);
    expect(rec101.merchantOrProvider).toBe('PayPal Commerce Platform');
    expect(rec101.category).toBe('DUPLICATE_PAYMENT');

    // 1.4 Click "Why flagged?" and assert Explainability Drawer opens
    store.openExplainability(rec101.explainability.ruleId, rec101.id);
    const drawer = store.getState().explainabilityDrawer;
    expect(drawer.isOpen).toBe(true);
    expect(drawer.ruleId).toBe('RULE-DUP-FEE-02');
    expect(drawer.recordId).toBe(rec101.id);

    // 1.5 Verify 4 pillars in Explainability Drawer
    // Pillar 1: Plain-English detection rule
    expect(rec101.explainability.ruleName).toContain('Duplicate Processing Fee');
    // Pillar 2: Mathematical formula
    expect(rec101.explainability.detectionFormula).toContain('Overcharge');
    // Pillar 3: Linked source records (PayPal capture vs Bank deposit)
    expect(rec101.explainability.sourceRecords.length).toBe(2);
    expect(rec101.explainability.sourceRecords[0].recordType).toBe('PAYPAL_TRANSACTION');
    expect(rec101.explainability.sourceRecords[1].recordType).toBe('BANK_STATEMENT');
    // Pillar 4: Raw PayPal API JSON payload
    expect(rec101.explainability.rawPayPalPayload.id).toBe('9XY8472910482910M');
    expect(rec101.explainability.rawPayPalPayload.duplicate_flag).toBe(true);

    // =========================================================================
    // ACT 2: PROVE (Payment Truth Engine & 3-Way Reconciliation)
    // =========================================================================
    // 2.1 Navigate to Payment Truth view
    store.setActiveRoute('payment-truth');
    store.setDemoAct(2);
    store.closeExplainability();
    expect(store.getState().activeRoute).toBe('payment-truth');
    expect(store.getState().demoAct).toBe(2);

    // 2.2 Verify Reconciliation Truth Queue contains discrepancy record
    const discRecord = store.getState().reconciliationRecords.find((r: any) => r.status === 'DISCREPANCY_FLAGGED');
    expect(discRecord).toBeDefined();
    expect(discRecord.varianceAmount).toBe(1420);
    expect(discRecord.paypalRecord.transactionId).toBe('9XY8472910482910M');
    expect(discRecord.bankRecord.bankReferenceId).toBe('DEP-4819');

    // 2.3 Verify matched records demonstrate 3-way reconciliation precision
    const fullMatch = store.getState().reconciliationRecords.find((r: any) => r.status === 'FULL_MATCH');
    expect(fullMatch).toBeDefined();
    expect(fullMatch.varianceAmount).toBe(0);
    expect(fullMatch.matchScore).toBe(100);

    // =========================================================================
    // ACT 3: RECOVER (Governed Approvals & PayPal Sandbox Execution)
    // =========================================================================
    // 3.1 Navigate to Approvals Console
    store.setActiveRoute('approvals');
    store.setDemoAct(3);
    expect(store.getState().activeRoute).toBe('approvals');
    expect(store.getState().demoAct).toBe(3);

    // 3.2 Verify pending approval action exists for Case REC-101
    const pendingApproval = store.getState().approvalRequests.find((a: any) => a.targetEntityId === rec101.id);
    expect(pendingApproval).toBeDefined();
    expect(pendingApproval.actionType).toBe('PAYPAL_DISPUTE_SUBMIT');
    expect(pendingApproval.amount).toBe(1420);
    expect(pendingApproval.riskRating).toBe('LOW');

    // 3.3 Inspect exact PayPal REST API blueprint payload
    const blueprint = pendingApproval.paypalApiBlueprint;
    expect(blueprint.httpMethod).toBe('POST');
    expect(blueprint.endpointPath).toBe('/v1/customer-disputes');
    expect(blueprint.requestBody.dispute_amount.value).toBe('1420.00');
    expect(blueprint.requestBody.reason).toBe('DUPLICATE_PROCESSING_FEE');

    // 3.4 User clicks "Approve & Execute via PayPal Sandbox"
    const initialCash = store.getState().digitalTwinMetrics.totalLiquidCash;
    const initialYTD = store.getState().kpiSummary.verifiedRecoveriesYTD;
    const executionResponse = await store.executeSandboxClaim(rec101.id);

    // 3.5 Verify Sandbox execution result
    expect(executionResponse.success).toBe(true);
    expect(executionResponse.txnId).toMatch(/^PP-TXN-/);
    expect(executionResponse.timestamp).toBeDefined();

    // 3.6 Assert Case status updated to VERIFIED_RECOVERED
    const recoveredCase = store.getState().recoveryCases.find((c: any) => c.id === rec101.id);
    expect(recoveredCase.status).toBe('VERIFIED_RECOVERED');
    expect(recoveredCase.actualRecoveredAmount).toBe(1420);

    // 3.7 Assert Liquid Cash and KPI counters incremented by +$1,420
    expect(store.getState().digitalTwinMetrics.totalLiquidCash).toBe(initialCash + 1420);
    expect(store.getState().kpiSummary.verifiedRecoveriesYTD).toBe(initialYTD + 1420);

    // =========================================================================
    // ACT 4: PROTECT (Commitment Firewall & Simulation Lab Tuning)
    // =========================================================================
    // 4.1 Navigate to Commitments Workbench
    store.setActiveRoute('commitments');
    store.setDemoAct(4);
    expect(store.getState().activeRoute).toBe('commitments');
    expect(store.getState().demoAct).toBe(4);

    // 4.2 Stress-test incoming purchase order: $35,000, Net-15 terms
    const activeLiquidCash = store.getState().digitalTwinMetrics.totalLiquidCash;
    const highOrderAmount = 35000;
    // Evaluate under low initial buffer scenario
    const tightScenarioCash = 40000;
    const tightEval = evaluateOrderAgainstBuffer(tightScenarioCash, highOrderAmount, 'NET_15');
    // Buffer drops to $5,000, which breaches the $15,000 threshold
    expect(tightEval.verdict).toBe('WARNING_LIQUIDITY_TIGHT');
    expect(tightEval.lowestBuffer).toBe(5000);

    // 4.3 Open Simulation Lab to mitigate buffer breach
    store.setActiveRoute('simulation-lab');
    expect(store.getState().activeRoute).toBe('simulation-lab');

    // 4.4 User drags "Upfront Deposit %" slider from 20% to 40%
    store.updateSimulationParameters({ upfrontDepositPct: 40 });
    expect(store.getState().simulationParameters.upfrontDepositPct).toBe(40);

    // 4.5 Projected daily cash curve recalculates dynamically in real time
    const updatedCurve = store.getState().dailyProjections;
    expect(updatedCurve.length).toBe(90);
    // Inflow bump boosts operational buffer
    const mitigatedCash = tightScenarioCash + 15000; // +$15k deposit collection
    const mitigatedEval = evaluateOrderAgainstBuffer(mitigatedCash, highOrderAmount, 'NET_15');
    // Buffer is now $20,000, safe above $15k threshold
    expect(mitigatedEval.verdict).toBe('APPROVED_SAFE');
    expect(mitigatedEval.lowestBuffer).toBe(20000);

    // =========================================================================
    // ACT 5: SHARE (Cryptographic Audit Proof & Scoped Accountant Link)
    // =========================================================================
    // 5.1 Navigate to Team & Secure Sharing
    store.setActiveRoute('team-sharing');
    store.setDemoAct(5);
    expect(store.getState().activeRoute).toBe('team-sharing');
    expect(store.getState().demoAct).toBe(5);

    // 5.2 Select and generate "Recovery Audit Proof Report"
    const signedReport = store.generateSignedReport('RECOVERY_AUDIT_PROOF');

    // 5.3 Verify SHA-256 Cryptographic Hash Badge
    expect(signedReport.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(signedReport.signatureBadge).toBe(`sha256:${signedReport.payloadHash}`);

    // 5.4 Independently verify cryptographic integrity
    const verifiedHash = computeCanonicalSha256(signedReport.data);
    expect(signedReport.payloadHash).toBe(verifiedHash);

    // 5.5 Generate Scoped Expiring Share Link for external CPA (48h expiry)
    const token = '7f83b165-ff1f-c53b-92dc-18148a1d65df';
    const scopedLink = `https://paypilot.app/share/audit-${signedReport.payloadHash.slice(0, 8)}?token=${token}&role=EXTERNAL_ACCOUNTANT&exp=48h`;
    expect(scopedLink).toContain(signedReport.payloadHash.slice(0, 8));
    expect(scopedLink).toContain('role=EXTERNAL_ACCOUNTANT');
    expect(scopedLink).toContain('exp=48h');

    // 5.6 Complete Hackathon Demo Stepper
    expect(store.getState().demoAct).toBe(5);
  });
});
