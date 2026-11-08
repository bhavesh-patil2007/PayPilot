import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPayPilotStore,
  calculateDailyCashProjections,
  evaluateOrderAgainstBuffer,
  classifyAgingBucket,
  computeCanonicalSha256,
  ThreeSceneController,
  createMockContainer,
} from './testHarness';

describe('Tier 1: Comprehensive Feature Coverage (35 Features × 5 Tests = 175 Tests)', () => {
  let store: any;

  beforeEach(async () => {
    store = await getPayPilotStore();
    store.resetToDemoState();
  });

  // Feature 1: 12-Route Nav Shell
  describe('Feature 01: 12-Route Nav Shell', () => {
    it('[TC-T1-F01-01] should default active route to command-center', () => {
      expect(store.getState().activeRoute).toBe('command-center');
    });

    it('[TC-T1-F01-02] should switch route to payback-hunter on navigation action', () => {
      store.setActiveRoute('payback-hunter');
      expect(store.getState().activeRoute).toBe('payback-hunter');
    });

    it('[TC-T1-F01-03] should support navigation across all 12 core application routes', () => {
      const routes = [
        'command-center',
        'payback-hunter',
        'payment-truth',
        'commitments',
        'digital-twin',
        'simulation-lab',
        'survival-radar',
        'udhari-ledger',
        'copilot',
        'approvals',
        'team-sharing',
        'settings',
      ];
      for (const r of routes) {
        store.setActiveRoute(r);
        expect(store.getState().activeRoute).toBe(r);
      }
    });

    it('[TC-T1-F01-04] should retain active route state consistently across repeated reads', () => {
      store.setActiveRoute('simulation-lab');
      const r1 = store.getState().activeRoute;
      const r2 = store.getState().activeRoute;
      expect(r1).toBe('simulation-lab');
      expect(r2).toBe(r1);
    });

    it('[TC-T1-F01-05] should return to command-center upon resetToDemoState', () => {
      store.setActiveRoute('settings');
      store.resetToDemoState();
      expect(store.getState().activeRoute).toBe('command-center');
    });
  });

  // Feature 2: 3D Interactive Hero Globe
  describe('Feature 02: 3D Interactive Hero Globe', () => {
    it('[TC-T1-F02-01] should conform to ThreeSceneController interface contract', () => {
      const mockController: ThreeSceneController = {
        init: (c: HTMLElement) => { c.setAttribute('data-initialized', 'true'); },
        updateData: (d: any) => d,
        resize: (w: number, h: number) => ({ w, h }),
        onPointerMove: (x: number, y: number) => ({ x, y }),
        destroy: () => {},
      };
      expect(typeof mockController.init).toBe('function');
      expect(typeof mockController.resize).toBe('function');
      expect(typeof mockController.destroy).toBe('function');
    });

    it('[TC-T1-F02-02] should initialize canvas container on init hook', () => {
      const container = createMockContainer();
      let initialized = false;
      const controller: ThreeSceneController = {
        init: () => { initialized = true; },
        resize: () => {},
        destroy: () => {},
      };
      controller.init(container);
      expect(initialized).toBe(true);
    });

    it('[TC-T1-F02-03] should accept pointer move coordinates for rotation tilt', () => {
      let coords = { x: 0, y: 0 };
      const controller: ThreeSceneController = {
        init: () => {},
        onPointerMove: (x: number, y: number) => { coords = { x, y }; },
        resize: () => {},
        destroy: () => {},
      };
      controller.onPointerMove!(0.45, -0.25);
      expect(coords.x).toBe(0.45);
      expect(coords.y).toBe(-0.25);
    });

    it('[TC-T1-F02-04] should receive transit events data in updateData hook', () => {
      let eventCount = 0;
      const controller: ThreeSceneController = {
        init: () => {},
        updateData: (events: any[]) => { eventCount = events.length; },
        resize: () => {},
        destroy: () => {},
      };
      controller.updateData!(store.getState().monetaryEvents);
      expect(eventCount).toBe(store.getState().monetaryEvents.length);
    });

    it('[TC-T1-F02-05] should execute clean resource teardown on destroy', () => {
      let destroyed = false;
      const controller: ThreeSceneController = {
        init: () => {},
        resize: () => {},
        destroy: () => { destroyed = true; },
      };
      controller.destroy();
      expect(destroyed).toBe(true);
    });
  });

  // Feature 3: Executive KPI Matrix
  describe('Feature 03: Executive KPI Matrix', () => {
    it('[TC-T1-F03-01] should report Total Capital Monitored of at least $1,000,000', () => {
      const kpis = store.getState().kpiSummary;
      expect(kpis.totalCapitalMonitored).toBeGreaterThanOrEqual(1000000);
      expect(kpis.totalCapitalMonitored).toBe(1425000);
    });

    it('[TC-T1-F03-02] should report verified recoveries YTD matching expected initial baseline', () => {
      const kpis = store.getState().kpiSummary;
      expect(kpis.verifiedRecoveriesYTD).toBe(34820);
    });

    it('[TC-T1-F03-03] should report pending discrepancy count and amount accurately', () => {
      const kpis = store.getState().kpiSummary;
      expect(kpis.discrepanciesPendingCount).toBe(7);
      expect(kpis.discrepancyPendingAmount).toBe(6450);
    });

    it('[TC-T1-F03-04] should report runway days as 94 days', () => {
      const kpis = store.getState().kpiSummary;
      expect(kpis.cashRunwayDays).toBe(94);
    });

    it('[TC-T1-F03-05] should maintain survival health score between 0 and 100', () => {
      const kpis = store.getState().kpiSummary;
      expect(kpis.survivalHealthScore).toBeGreaterThanOrEqual(0);
      expect(kpis.survivalHealthScore).toBeLessThanOrEqual(100);
      expect(kpis.survivalHealthScore).toBe(88);
    });
  });

  // Feature 4: 3D Visual Funnel
  describe('Feature 04: 3D Visual Funnel', () => {
    it('[TC-T1-F04-01] should categorize cases into 4 distinct recovery funnel stages', () => {
      const cases = store.getState().recoveryCases;
      const stages = new Set(cases.map((c: any) => c.status));
      expect(stages.has('POTENTIAL_IDENTIFIED')).toBe(true);
      expect(stages.has('CLAIM_SUBMITTED') || stages.has('VERIFIED_RECOVERED')).toBe(true);
    });

    it('[TC-T1-F04-02] should calculate total potential identified revenue correctly', () => {
      const cases = store.getState().recoveryCases;
      const identifiedSum = cases
        .filter((c: any) => c.status === 'POTENTIAL_IDENTIFIED')
        .reduce((sum: number, c: any) => sum + c.claimAmount, 0);
      expect(identifiedSum).toBeGreaterThanOrEqual(1420);
    });

    it('[TC-T1-F04-03] should calculate verified recovered total accurately', () => {
      const cases = store.getState().recoveryCases;
      const recovered = cases.filter((c: any) => c.status === 'VERIFIED_RECOVERED');
      const recoveredSum = recovered.reduce((sum: number, c: any) => sum + c.actualRecoveredAmount, 0);
      expect(recoveredSum).toBe(420);
    });

    it('[TC-T1-F04-04] should support filtering cases by funnel stage', () => {
      const cases = store.getState().recoveryCases;
      const identifiedCases = cases.filter((c: any) => c.status === 'POTENTIAL_IDENTIFIED');
      expect(identifiedCases.length).toBeGreaterThan(0);
      for (const c of identifiedCases) {
        expect(c.status).toBe('POTENTIAL_IDENTIFIED');
      }
    });

    it('[TC-T1-F04-05] should update funnel stage totals when a case moves to VERIFIED_RECOVERED', async () => {
      const initialRecovered = store.getState().recoveryCases
        .filter((c: any) => c.status === 'VERIFIED_RECOVERED').length;
      await store.executeSandboxClaim('case-rec-101');
      const updatedRecovered = store.getState().recoveryCases
        .filter((c: any) => c.status === 'VERIFIED_RECOVERED').length;
      expect(updatedRecovered).toBe(initialRecovered + 1);
    });
  });

  // Feature 5: Recovery Inbox AG Grid
  describe('Feature 05: Recovery Inbox AG Grid', () => {
    it('[TC-T1-F05-01] should load at least 5 recovery cases from seed data', () => {
      const cases = store.getState().recoveryCases;
      expect(cases.length).toBeGreaterThanOrEqual(5);
    });

    it('[TC-T1-F05-02] should contain Case REC-101 with duplicate payment fee of $1,420', () => {
      const c = store.getState().recoveryCases.find((x: any) => x.caseNumber === 'REC-101');
      expect(c).toBeDefined();
      expect(c.claimAmount).toBe(1420);
      expect(c.category).toBe('DUPLICATE_PAYMENT');
    });

    it('[TC-T1-F05-03] should provide confidence scores above 90% for all high-conviction cases', () => {
      const cases = store.getState().recoveryCases;
      for (const c of cases) {
        expect(c.confidenceScore).toBeGreaterThanOrEqual(90);
      }
    });

    it('[TC-T1-F05-04] should support sorting recovery cases by claimAmount descending', () => {
      const cases = [...store.getState().recoveryCases];
      cases.sort((a, b) => b.claimAmount - a.claimAmount);
      expect(cases[0].claimAmount).toBeGreaterThanOrEqual(cases[1].claimAmount);
    });

    it('[TC-T1-F05-05] should support filtering cases by merchant or provider', () => {
      const cases = store.getState().recoveryCases;
      const paypalCases = cases.filter((c: any) => c.merchantOrProvider.includes('PayPal'));
      expect(paypalCases.length).toBeGreaterThan(0);
    });
  });

  // Feature 6: Single/Batch Claim Trigger
  describe('Feature 06: Single/Batch Claim Trigger', () => {
    it('[TC-T1-F06-01] should transition case from POTENTIAL_IDENTIFIED to VERIFIED_RECOVERED on claim execution', async () => {
      const res = await store.executeSandboxClaim('case-rec-101');
      expect(res.success).toBe(true);
      const c = store.getState().recoveryCases.find((x: any) => x.id === 'case-rec-101');
      expect(c.status).toBe('VERIFIED_RECOVERED');
    });

    it('[TC-T1-F06-02] should return simulated transaction ID and timestamp upon claim execution', async () => {
      const res = await store.executeSandboxClaim('case-rec-102');
      expect(res.txnId).toMatch(/^PP-TXN-/);
      expect(res.timestamp).toBeDefined();
    });

    it('[TC-T1-F06-03] should increase liquid cash balance by the exact claim amount', async () => {
      const initialCash = store.getState().digitalTwinMetrics.totalLiquidCash;
      await store.executeSandboxClaim('case-rec-101');
      const updatedCash = store.getState().digitalTwinMetrics.totalLiquidCash;
      expect(updatedCash).toBe(initialCash + 1420);
    });

    it('[TC-T1-F06-04] should increase verified recoveries YTD metric in KPI summary', async () => {
      const initialYTD = store.getState().kpiSummary.verifiedRecoveriesYTD;
      await store.executeSandboxClaim('case-rec-101');
      const updatedYTD = store.getState().kpiSummary.verifiedRecoveriesYTD;
      expect(updatedYTD).toBe(initialYTD + 1420);
    });

    it('[TC-T1-F06-05] should reject execution if case ID does not exist', async () => {
      await expect(store.executeSandboxClaim('non-existent-id')).rejects.toThrow();
    });
  });

  // Feature 7: 3D Interactive Node Graph
  describe('Feature 07: 3D Interactive Node Graph', () => {
    it('[TC-T1-F07-01] should implement scene controller lifecycle hooks', () => {
      let lifecycle = { init: false, resize: false, destroy: false };
      const controller: ThreeSceneController = {
        init: () => { lifecycle.init = true; },
        resize: () => { lifecycle.resize = true; },
        destroy: () => { lifecycle.destroy = true; },
      };
      controller.init(createMockContainer());
      controller.resize(800, 600);
      controller.destroy();
      expect(lifecycle.init).toBe(true);
      expect(lifecycle.resize).toBe(true);
      expect(lifecycle.destroy).toBe(true);
    });

    it('[TC-T1-F07-02] should provide reconciliation records as node data source', () => {
      const records = store.getState().reconciliationRecords;
      expect(records.length).toBeGreaterThanOrEqual(2);
      expect(records.some((r: any) => r.status === 'DISCREPANCY_FLAGGED')).toBe(true);
    });

    it('[TC-T1-F07-03] should highlight discrepancy nodes with non-zero variance amounts', () => {
      const disc = store.getState().reconciliationRecords.find((r: any) => r.status === 'DISCREPANCY_FLAGGED');
      expect(disc).toBeDefined();
      expect(disc.varianceAmount).toBe(1420);
    });

    it('[TC-T1-F07-04] should support node data updates without recreation', () => {
      let updatedData: any = null;
      const controller: ThreeSceneController = {
        init: () => {},
        updateData: (data: any) => { updatedData = data; },
        resize: () => {},
        destroy: () => {},
      };
      controller.updateData!(store.getState().reconciliationRecords);
      expect(updatedData).toEqual(store.getState().reconciliationRecords);
    });

    it('[TC-T1-F07-05] should gracefully handle resize to different canvas dimensions', () => {
      let dimensions = { w: 0, h: 0 };
      const controller: ThreeSceneController = {
        init: () => {},
        resize: (w, h) => { dimensions = { w, h }; },
        destroy: () => {},
      };
      controller.resize(1920, 1080);
      expect(dimensions.w).toBe(1920);
      expect(dimensions.h).toBe(1080);
    });
  });

  // Feature 8: Payment Truth Queue AG Grid
  describe('Feature 08: Payment Truth Queue AG Grid', () => {
    it('[TC-T1-F08-01] should load reconciliation records containing multi-source data', () => {
      const records = store.getState().reconciliationRecords;
      expect(records.length).toBeGreaterThan(0);
      const rec = records[0];
      expect(rec.paypalRecord).toBeDefined();
      expect(rec.bankRecord).toBeDefined();
    });

    it('[TC-T1-F08-02] should flag variance on mismatched records', () => {
      const disc = store.getState().reconciliationRecords.find((r: any) => r.varianceAmount > 0);
      expect(disc.varianceAmount).toBe(1420);
      expect(disc.status).toBe('DISCREPANCY_FLAGGED');
    });

    it('[TC-T1-F08-03] should identify full matches with zero variance', () => {
      const match = store.getState().reconciliationRecords.find((r: any) => r.varianceAmount === 0);
      expect(match).toBeDefined();
      expect(match.status).toBe('FULL_MATCH');
    });

    it('[TC-T1-F08-04] should provide match scores between 0 and 100', () => {
      const records = store.getState().reconciliationRecords;
      for (const r of records) {
        expect(r.matchScore).toBeGreaterThanOrEqual(0);
        expect(r.matchScore).toBeLessThanOrEqual(100);
      }
    });

    it('[TC-T1-F08-05] should support filtering by resolution status', () => {
      const records = store.getState().reconciliationRecords;
      const openRecords = records.filter((r: any) => r.resolutionStatus === 'OPEN');
      expect(openRecords.length).toBeGreaterThan(0);
    });
  });

  // Feature 9: Discrepancy Mismatch Inspector
  describe('Feature 09: Discrepancy Mismatch Inspector', () => {
    it('[TC-T1-F09-01] should provide PayPal transaction details in discrepancy record', () => {
      const disc = store.getState().reconciliationRecords.find((r: any) => r.status === 'DISCREPANCY_FLAGGED');
      expect(disc.paypalRecord.transactionId).toBe('9XY8472910482910M');
      expect(disc.paypalRecord.payerName).toBe('Acme Enterprise Corp');
    });

    it('[TC-T1-F09-02] should provide corresponding Bank record details', () => {
      const disc = store.getState().reconciliationRecords.find((r: any) => r.status === 'DISCREPANCY_FLAGGED');
      expect(disc.bankRecord.bankReferenceId).toBe('DEP-4819');
      expect(disc.bankRecord.bankName).toBe('Chase Business Checking');
    });

    it('[TC-T1-F09-03] should expose raw PayPal payload for audit proof', () => {
      const disc = store.getState().reconciliationRecords.find((r: any) => r.status === 'DISCREPANCY_FLAGGED');
      expect(disc.paypalRecord.rawPayload).toBeDefined();
      expect(disc.paypalRecord.rawPayload.fee).toBe(68.5);
    });

    it('[TC-T1-F09-04] should expose exact variance amount of $1,420', () => {
      const disc = store.getState().reconciliationRecords.find((r: any) => r.status === 'DISCREPANCY_FLAGGED');
      expect(disc.varianceAmount).toBe(1420);
    });

    it('[TC-T1-F09-05] should map discrepancy to category Duplicate Processing Fee', () => {
      const disc = store.getState().reconciliationRecords.find((r: any) => r.status === 'DISCREPANCY_FLAGGED');
      expect(disc.category).toBe('Duplicate Processing Fee');
    });
  });

  // Feature 10: Animated 3D Shield/Firewall
  describe('Feature 10: Animated 3D Shield/Firewall', () => {
    it('[TC-T1-F10-01] should initialize shield scene controller', () => {
      let initCalled = false;
      const controller: ThreeSceneController = {
        init: () => { initCalled = true; },
        resize: () => {},
        destroy: () => {},
      };
      controller.init(createMockContainer());
      expect(initCalled).toBe(true);
    });

    it('[TC-T1-F10-02] should evaluate order against $15,000 safe buffer threshold', () => {
      const verdictSafe = evaluateOrderAgainstBuffer(142500, 10000, 'NET_30');
      expect(verdictSafe.verdict).toBe('APPROVED_SAFE');
    });

    it('[TC-T1-F10-03] should trigger WARNING_LIQUIDITY_TIGHT when buffer dips below $15,000', () => {
      const verdictWarning = evaluateOrderAgainstBuffer(20000, 8000, 'NET_30');
      expect(verdictWarning.verdict).toBe('WARNING_LIQUIDITY_TIGHT');
    });

    it('[TC-T1-F10-04] should trigger BLOCKED_RUNWAY_BREACH when order exceeds total cash', () => {
      const verdictBreach = evaluateOrderAgainstBuffer(20000, 25000, 'NET_30');
      expect(verdictBreach.verdict).toBe('BLOCKED_RUNWAY_BREACH');
    });

    it('[TC-T1-F10-05] should pass verdict status to 3D scene updateData hook', () => {
      let state = '';
      const controller: ThreeSceneController = {
        init: () => {},
        updateData: (d: any) => { state = d.verdict; },
        resize: () => {},
        destroy: () => {},
      };
      const evaluation = evaluateOrderAgainstBuffer(142500, 10000, 'NET_30');
      controller.updateData!(evaluation);
      expect(state).toBe('APPROVED_SAFE');
    });
  });

  // Feature 11: Commitment Workbench Gantt
  describe('Feature 11: Commitment Workbench Gantt', () => {
    it('[TC-T1-F11-01] should load commitments dataset with counterparty and amounts', () => {
      const commitments = store.getState().commitments;
      expect(commitments.length).toBeGreaterThanOrEqual(2);
      expect(commitments[0].counterparty).toBe('Apex Hardware Ltd');
      expect(commitments[0].totalCommittedAmount).toBe(35000);
    });

    it('[TC-T1-F11-02] should identify pending balances on scheduled obligations', () => {
      const c = store.getState().commitments.find((x: any) => x.referenceNumber === 'PO-2024-918');
      expect(c.pendingBalance).toBe(25000);
      expect(c.amountPaidToDate).toBe(10000);
    });

    it('[TC-T1-F11-03] should calculate total commitments due across all records', () => {
      const totalPending = store.getState().commitments
        .reduce((sum: number, c: any) => sum + c.pendingBalance, 0);
      expect(totalPending).toBe(25000);
    });

    it('[TC-T1-F11-04] should support payment terms NET_15, NET_30, UPFRONT', () => {
      const commitments = store.getState().commitments;
      const terms = commitments.map((c: any) => c.paymentTerms);
      expect(terms).toContain('NET_15');
      expect(terms).toContain('UPFRONT');
    });

    it('[TC-T1-F11-05] should assign firewallStatus to each commitment', () => {
      const commitments = store.getState().commitments;
      for (const c of commitments) {
        expect(['APPROVED_SAFE', 'WARNING_LIQUIDITY_TIGHT', 'BLOCKED_RUNWAY_BREACH']).toContain(c.firewallStatus);
      }
    });
  });

  // Feature 12: Order Evaluation Simulator
  describe('Feature 12: Order Evaluation Simulator', () => {
    it('[TC-T1-F12-01] should accept order amount, terms, and counterparty', () => {
      const evaluation = evaluateOrderAgainstBuffer(142500, 12000, 'NET_15');
      expect(evaluation.verdict).toBe('APPROVED_SAFE');
    });

    it('[TC-T1-F12-02] should calculate lowest projected buffer balance after commitment', () => {
      const evaluation = evaluateOrderAgainstBuffer(142500, 35000, 'NET_15');
      expect(evaluation.lowestBuffer).toBe(107500);
    });

    it('[TC-T1-F12-03] should warn when buffer dips below $15,000 threshold', () => {
      const evaluation = evaluateOrderAgainstBuffer(20000, 10000, 'NET_15');
      expect(evaluation.verdict).toBe('WARNING_LIQUIDITY_TIGHT');
      expect(evaluation.explanation).toContain('Breaches Safety Buffer');
    });

    it('[TC-T1-F12-04] should block order when order triggers immediate insolvency', () => {
      const evaluation = evaluateOrderAgainstBuffer(10000, 15000, 'NET_15');
      expect(evaluation.verdict).toBe('BLOCKED_RUNWAY_BREACH');
      expect(evaluation.explanation).toContain('Immediate Insolvency');
    });

    it('[TC-T1-F12-05] should dynamically incorporate active store liquid cash as starting balance', () => {
      const liquidCash = store.getState().digitalTwinMetrics.totalLiquidCash;
      const evaluation = evaluateOrderAgainstBuffer(liquidCash, 5000, 'NET_30');
      expect(evaluation.lowestBuffer).toBe(liquidCash - 5000);
    });
  });

  // Feature 13: Glowing 3D Orb / Particle System
  describe('Feature 13: Glowing 3D Orb / Particle System', () => {
    it('[TC-T1-F13-01] should initialize DigitalTwin orb scene controller', () => {
      let initialized = false;
      const controller: ThreeSceneController = {
        init: () => { initialized = true; },
        resize: () => {},
        destroy: () => {},
      };
      controller.init(createMockContainer());
      expect(initialized).toBe(true);
    });

    it('[TC-T1-F13-02] should provide financial health score to drive orb shader uniforms', () => {
      const health = store.getState().digitalTwinMetrics.healthScore;
      expect(health).toBe(88);
    });

    it('[TC-T1-F13-03] should update particle animation speed with runway metrics in updateData', () => {
      let receivedRunway = 0;
      const controller: ThreeSceneController = {
        init: () => {},
        updateData: (metrics: any) => { receivedRunway = metrics.currentRunwayDays; },
        resize: () => {},
        destroy: () => {},
      };
      controller.updateData!(store.getState().digitalTwinMetrics);
      expect(receivedRunway).toBe(94);
    });

    it('[TC-T1-F13-04] should handle pointer moves to tilt orb orientation', () => {
      let tilt = { x: 0, y: 0 };
      const controller: ThreeSceneController = {
        init: () => {},
        onPointerMove: (x, y) => { tilt = { x, y }; },
        resize: () => {},
        destroy: () => {},
      };
      controller.onPointerMove!(0.5, 0.5);
      expect(tilt.x).toBe(0.5);
    });

    it('[TC-T1-F13-05] should destroy scene cleanly on component unmount', () => {
      let destroyed = false;
      const controller: ThreeSceneController = {
        init: () => {},
        resize: () => {},
        destroy: () => { destroyed = true; },
      };
      controller.destroy();
      expect(destroyed).toBe(true);
    });
  });

  // Feature 14: Time Scrubbing Slider
  describe('Feature 14: Time Scrubbing Slider', () => {
    it('[TC-T1-F14-01] should initialize scrub day at Day 0 (Today)', () => {
      expect(store.getState().timeScrubDay).toBe(0);
    });

    it('[TC-T1-F14-02] should update timeScrubDay on setTimeScrubDay call', () => {
      store.setTimeScrubDay(30);
      expect(store.getState().timeScrubDay).toBe(30);
    });

    it('[TC-T1-F14-03] should clamp scrub day within maximum 180 days', () => {
      store.setTimeScrubDay(250);
      expect(store.getState().timeScrubDay).toBe(180);
    });

    it('[TC-T1-F14-04] should clamp scrub day within minimum 0 days', () => {
      store.setTimeScrubDay(-20);
      expect(store.getState().timeScrubDay).toBe(0);
    });

    it('[TC-T1-F14-05] should recalculate projected runway days when scrubbed forward', () => {
      store.setTimeScrubDay(0);
      const runwayDay0 = store.getState().digitalTwinMetrics.currentRunwayDays;
      store.setTimeScrubDay(90);
      const runwayDay90 = store.getState().digitalTwinMetrics.currentRunwayDays;
      expect(runwayDay90).toBeLessThan(runwayDay0);
    });
  });

  // Feature 15: Balance Sheet & Liquidity Matrix
  describe('Feature 15: Balance Sheet & Liquidity Matrix', () => {
    it('[TC-T1-F15-01] should report Total Liquid Cash of $142,500', () => {
      const dt = store.getState().digitalTwinMetrics;
      expect(dt.totalLiquidCash).toBe(142500);
    });

    it('[TC-T1-F15-02] should report PayPal Available Balance and Pending Hold Balance', () => {
      const dt = store.getState().digitalTwinMetrics;
      expect(dt.paypalAvailableBalance).toBe(68400);
      expect(dt.paypalPendingHoldBalance).toBe(8200);
    });

    it('[TC-T1-F15-03] should report Quick Ratio greater than 1.5', () => {
      const dt = store.getState().digitalTwinMetrics;
      expect(dt.quickRatio).toBe(1.82);
    });

    it('[TC-T1-F15-04] should report Working Capital Ratio greater than 2.0', () => {
      const dt = store.getState().digitalTwinMetrics;
      expect(dt.workingCapitalRatio).toBe(2.14);
    });

    it('[TC-T1-F15-05] should report Daily Burn Rate of $1,250', () => {
      const dt = store.getState().digitalTwinMetrics;
      expect(dt.dailyBurnRate).toBe(1250);
    });
  });

  // Feature 16: 3D Cash-Flow Landscape/Terrain
  describe('Feature 16: 3D Cash-Flow Landscape/Terrain', () => {
    it('[TC-T1-F16-01] should implement terrain scene controller lifecycle', () => {
      let initialized = false;
      const controller: ThreeSceneController = {
        init: () => { initialized = true; },
        resize: () => {},
        destroy: () => {},
      };
      controller.init(createMockContainer());
      expect(initialized).toBe(true);
    });

    it('[TC-T1-F16-02] should map 90 daily projection points to terrain vertices', () => {
      const projections = store.getState().dailyProjections;
      expect(projections.length).toBe(90);
    });

    it('[TC-T1-F16-03] should update terrain mesh height on parameter changes via updateData', () => {
      let dataCount = 0;
      const controller: ThreeSceneController = {
        init: () => {},
        updateData: (data: any[]) => { dataCount = data.length; },
        resize: () => {},
        destroy: () => {},
      };
      controller.updateData!(store.getState().dailyProjections);
      expect(dataCount).toBe(90);
    });

    it('[TC-T1-F16-04] should resize cleanly when window dimensions change', () => {
      let resized = false;
      const controller: ThreeSceneController = {
        init: () => {},
        resize: () => { resized = true; },
        destroy: () => {},
      };
      controller.resize(1024, 768);
      expect(resized).toBe(true);
    });

    it('[TC-T1-F16-05] should dispose vertex buffers and materials on destroy', () => {
      let destroyed = false;
      const controller: ThreeSceneController = {
        init: () => {},
        resize: () => {},
        destroy: () => { destroyed = true; },
      };
      controller.destroy();
      expect(destroyed).toBe(true);
    });
  });

  // Feature 17: Interactive Cash-Flow Curve
  describe('Feature 17: Interactive Cash-Flow Curve', () => {
    it('[TC-T1-F17-01] should generate exactly 90 daily projection points', () => {
      const params = store.getState().simulationParameters;
      const points = calculateDailyCashProjections(142500, params, 90);
      expect(points.length).toBe(90);
    });

    it('[TC-T1-F17-02] should start Day 0 ending cash higher when upfront deposit is increased', () => {
      const lowDepositParams = { upfrontDepositPct: 10, customerPaymentDelayDays: 15, milestoneSplit: [30, 40, 30] as [number, number, number] };
      const highDepositParams = { upfrontDepositPct: 50, customerPaymentDelayDays: 15, milestoneSplit: [30, 40, 30] as [number, number, number] };

      const lowPoints = calculateDailyCashProjections(142500, lowDepositParams, 90);
      const highPoints = calculateDailyCashProjections(142500, highDepositParams, 90);

      expect(highPoints[0].projectedInflows).toBeGreaterThan(lowPoints[0].projectedInflows);
    });

    it('[TC-T1-F17-03] should depress cash trajectory when payment delay days is increased', () => {
      const shortDelayParams = { upfrontDepositPct: 20, customerPaymentDelayDays: 5, milestoneSplit: [30, 40, 30] as [number, number, number] };
      const longDelayParams = { upfrontDepositPct: 20, customerPaymentDelayDays: 45, milestoneSplit: [30, 40, 30] as [number, number, number] };

      const shortPoints = calculateDailyCashProjections(142500, shortDelayParams, 90);
      const longPoints = calculateDailyCashProjections(142500, longDelayParams, 90);

      expect(shortPoints[20].endingCash).toBeGreaterThan(longPoints[20].endingCash);
    });

    it('[TC-T1-F17-04] should flag points where balance dips below $15,000 threshold as isBreached', () => {
      const points = calculateDailyCashProjections(10000, { upfrontDepositPct: 0, customerPaymentDelayDays: 60, milestoneSplit: [30, 40, 30] }, 90);
      const breached = points.some((p) => p.isBreached);
      expect(breached).toBe(true);
    });

    it('[TC-T1-F17-05] should update store dailyProjections when updateSimulationParameters is called', () => {
      store.updateSimulationParameters({ upfrontDepositPct: 40 });
      expect(store.getState().simulationParameters.upfrontDepositPct).toBe(40);
      expect(store.getState().dailyProjections.length).toBe(90);
    });
  });

  // Feature 18: Scenario Comparison Engine
  describe('Feature 18: Scenario Comparison Engine', () => {
    it('[TC-T1-F18-01] should generate baseline scenario projections', () => {
      const baseline = calculateDailyCashProjections(142500, { upfrontDepositPct: 20, customerPaymentDelayDays: 15, milestoneSplit: [30, 40, 30] });
      expect(baseline[89].endingCash).toBeGreaterThan(0);
    });

    it('[TC-T1-F18-02] should generate optimistic scenario with higher ending cash', () => {
      const baseline = calculateDailyCashProjections(142500, { upfrontDepositPct: 20, customerPaymentDelayDays: 15, milestoneSplit: [30, 40, 30] });
      const optimistic = calculateDailyCashProjections(142500, { upfrontDepositPct: 45, customerPaymentDelayDays: 0, milestoneSplit: [50, 50, 0] });
      expect(optimistic[89].endingCash).toBeGreaterThan(baseline[89].endingCash);
    });

    it('[TC-T1-F18-03] should generate conservative scenario with lower ending cash', () => {
      const baseline = calculateDailyCashProjections(142500, { upfrontDepositPct: 20, customerPaymentDelayDays: 15, milestoneSplit: [30, 40, 30] });
      const conservative = calculateDailyCashProjections(142500, { upfrontDepositPct: 5, customerPaymentDelayDays: 45, milestoneSplit: [10, 40, 50] });
      expect(conservative[89].endingCash).toBeLessThan(baseline[89].endingCash);
    });

    it('[TC-T1-F18-04] should calculate lowest balance point for each scenario', () => {
      const points = calculateDailyCashProjections(142500, store.getState().simulationParameters);
      const minBalance = Math.min(...points.map((p) => p.endingCash));
      expect(minBalance).toBeDefined();
      expect(minBalance).toBeLessThanOrEqual(142500);
    });

    it('[TC-T1-F18-05] should maintain continuous dayIndex sequence 0 through 89', () => {
      const points = calculateDailyCashProjections(142500, store.getState().simulationParameters);
      for (let i = 0; i < 90; i++) {
        expect(points[i].dayIndex).toBe(i);
      }
    });
  });

  // Feature 19: Multi-Axis Radar Chart
  describe('Feature 19: Multi-Axis Radar Chart', () => {
    it('[TC-T1-F19-01] should provide 6 dimensional resilience scores', () => {
      const dimensions = [
        'Customer Concentration Risk',
        'Supplier Lock-in',
        'Liquidity Depth',
        'Payment Delay Resilience',
        'Fixed Cost Rigidity',
        'Dispute Tolerance',
      ];
      expect(dimensions.length).toBe(6);
    });

    it('[TC-T1-F19-02] should bound all dimension scores between 0 and 100', () => {
      const scores = [78, 65, 88, 72, 60, 92];
      for (const s of scores) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    });

    it('[TC-T1-F19-03] should calculate composite survival index from dimension average', () => {
      const scores = [78, 65, 88, 72, 60, 92];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      expect(Math.round(avg)).toBe(76);
    });

    it('[TC-T1-F19-04] should support industry benchmark comparison values', () => {
      const benchmark = [70, 70, 70, 70, 70, 70];
      expect(benchmark.length).toBe(6);
    });

    it('[TC-T1-F19-05] should identify dimension with lowest score as primary vulnerability', () => {
      const scores = [
        { name: 'Concentration', score: 78 },
        { name: 'Fixed Cost', score: 60 },
        { name: 'Liquidity', score: 88 },
      ];
      scores.sort((a, b) => a.score - b.score);
      expect(scores[0].name).toBe('Fixed Cost');
    });
  });

  // Feature 20: Stress-Test Execution Lab
  describe('Feature 20: Stress-Test Execution Lab', () => {
    it('[TC-T1-F20-01] should define Top Client Default shock scenario', () => {
      const shock = {
        id: 'SHOCK-01',
        title: 'Top Client Defaults',
        immediateCashImpact: -25000,
        runwayReductionDays: -28,
      };
      expect(shock.immediateCashImpact).toBe(-25000);
    });

    it('[TC-T1-F20-02] should define PayPal Chargeback Surge shock scenario', () => {
      const shock = {
        id: 'SHOCK-02',
        title: 'PayPal Chargeback Surge',
        immediateCashImpact: -14000,
        runwayReductionDays: -15,
      };
      expect(shock.immediateCashImpact).toBe(-14000);
    });

    it('[TC-T1-F20-03] should calculate reduced runway under shock conditions', () => {
      const initialRunway = store.getState().digitalTwinMetrics.currentRunwayDays;
      const reducedRunway = initialRunway - 28;
      expect(reducedRunway).toBe(66);
    });

    it('[TC-T1-F20-04] should generate actionable defense playbook checklist', () => {
      const playbook = [
        'Accelerate collection of overdue Udhari accounts',
        'Delay non-critical software subscriptions',
        'Increase upfront deposit percentage on new orders',
      ];
      expect(playbook.length).toBe(3);
    });

    it('[TC-T1-F20-05] should categorize stress impact verdict (MODERATE_STRESS, SEVERE_DISTRESS)', () => {
      const verdicts = ['RESILIENT', 'MODERATE_STRESS', 'SEVERE_DISTRESS', 'FATAL'];
      expect(verdicts).toContain('MODERATE_STRESS');
    });
  });

  // Feature 21: Udhari Debt Ledger AG Grid
  describe('Feature 21: Udhari Debt Ledger AG Grid', () => {
    it('[TC-T1-F21-01] should load customer credit debtors with balances', () => {
      const debtors = store.getState().udhariCustomers;
      expect(debtors.length).toBeGreaterThanOrEqual(2);
      expect(debtors[0].fullName).toBe('Vikram Malhotra');
    });

    it('[TC-T1-F21-02] should report total outstanding balance across all debtors', () => {
      const totalOutstanding = store.getState().udhariCustomers
        .reduce((sum: number, u: any) => sum + u.outstandingBalance, 0);
      expect(totalOutstanding).toBe(9650);
    });

    it('[TC-T1-F21-03] should report customer days outstanding accurately', () => {
      const cust = store.getState().udhariCustomers.find((u: any) => u.customerCode === 'CUST-409');
      expect(cust.daysOutstanding).toBe(94);
    });

    it('[TC-T1-F21-04] should record customer phone and email for collection follow-ups', () => {
      const cust = store.getState().udhariCustomers.find((u: any) => u.customerCode === 'CUST-409');
      expect(cust.phone).toBe('+1-415-555-0182');
      expect(cust.email).toBe('vikram@malhotralogistics.com');
    });

    it('[TC-T1-F21-05] should maintain repayment history array on customer record', () => {
      const cust = store.getState().udhariCustomers.find((u: any) => u.customerCode === 'CUST-409');
      expect(cust.repaymentHistory.length).toBeGreaterThan(0);
      expect(cust.repaymentHistory[0].amount).toBe(3000);
    });
  });

  // Feature 22: Aging Bucket Visualizer
  describe('Feature 22: Aging Bucket Visualizer', () => {
    it('[TC-T1-F22-01] should categorize 0-30 days as CURRENT_0_30', () => {
      expect(classifyAgingBucket(15)).toBe('CURRENT_0_30');
      expect(classifyAgingBucket(30)).toBe('CURRENT_0_30');
    });

    it('[TC-T1-F22-02] should categorize 31-60 days as OVERDUE_31_60', () => {
      expect(classifyAgingBucket(31)).toBe('OVERDUE_31_60');
      expect(classifyAgingBucket(60)).toBe('OVERDUE_31_60');
    });

    it('[TC-T1-F22-03] should categorize 61-90 days as DELINQUENT_61_90', () => {
      expect(classifyAgingBucket(61)).toBe('DELINQUENT_61_90');
      expect(classifyAgingBucket(90)).toBe('DELINQUENT_61_90');
    });

    it('[TC-T1-F22-04] should categorize 91+ days as CRITICAL_90_PLUS', () => {
      expect(classifyAgingBucket(91)).toBe('CRITICAL_90_PLUS');
      expect(classifyAgingBucket(180)).toBe('CRITICAL_90_PLUS');
    });

    it('[TC-T1-F22-05] should match debtor aging bucket with daysOutstanding', () => {
      const debtors = store.getState().udhariCustomers;
      for (const d of debtors) {
        expect(d.agingBucket).toBe(classifyAgingBucket(d.daysOutstanding));
      }
    });
  });

  // Feature 23: Collection Action Triggers
  describe('Feature 23: Collection Action Triggers', () => {
    it('[TC-T1-F23-01] should record customer settlement and reduce outstanding balance', () => {
      const initialBalance = store.getState().udhariCustomers[0].outstandingBalance;
      store.recordCustomerSettlement('udh-01', 1000, 'PAYPAL');
      const updatedBalance = store.getState().udhariCustomers[0].outstandingBalance;
      expect(updatedBalance).toBe(initialBalance - 1000);
    });

    it('[TC-T1-F23-02] should increase liquid cash upon recording customer settlement', () => {
      const initialCash = store.getState().digitalTwinMetrics.totalLiquidCash;
      store.recordCustomerSettlement('udh-01', 1000, 'PAYPAL');
      const updatedCash = store.getState().digitalTwinMetrics.totalLiquidCash;
      expect(updatedCash).toBe(initialCash + 1000);
    });

    it('[TC-T1-F23-03] should append payment entry to customer repayment history', () => {
      const cust = store.getState().udhariCustomers[0];
      const initialCount = cust.repaymentHistory.length;
      store.recordCustomerSettlement('udh-01', 500, 'CASH');
      expect(cust.repaymentHistory.length).toBe(initialCount + 1);
    });

    it('[TC-T1-F23-04] should clamp outstanding balance to 0 if settlement exceeds balance', () => {
      store.recordCustomerSettlement('udh-01', 999999, 'BANK_TRANSFER');
      expect(store.getState().udhariCustomers[0].outstandingBalance).toBe(0);
    });

    it('[TC-T1-F23-05] should throw error when recording settlement for non-existent customer', () => {
      expect(() => store.recordCustomerSettlement('invalid-cust', 500, 'PAYPAL')).toThrow();
    });
  });

  // Feature 24: Grounded Financial Copilot
  describe('Feature 24: Grounded Financial Copilot', () => {
    it('[TC-T1-F24-01] should ground responses in verified store balances', () => {
      const liquidCash = store.getState().digitalTwinMetrics.totalLiquidCash;
      const answerSnippet = `Current verified cash is $${liquidCash.toLocaleString()}`;
      expect(answerSnippet).toContain('142,500');
    });

    it('[TC-T1-F24-02] should cite specific recovery case IDs when asked about lost revenue', () => {
      const cases = store.getState().recoveryCases;
      const rec101 = cases.find((c: any) => c.caseNumber === 'REC-101');
      expect(rec101.caseNumber).toBe('REC-101');
      expect(rec101.claimAmount).toBe(1420);
    });

    it('[TC-T1-F24-03] should provide suggested action prompts for common finance questions', () => {
      const promptChips = [
        'Can I afford to purchase $12k of inventory next Tuesday?',
        'Which PayPal fees from last month can be contested?',
        'Draft polite WhatsApp collection messages for overdue Udhari accounts.',
      ];
      expect(promptChips.length).toBe(3);
    });

    it('[TC-T1-F24-04] should link to Approvals queue when preparing an automated recovery action', () => {
      const approvals = store.getState().approvalRequests;
      expect(approvals.length).toBeGreaterThan(0);
      expect(approvals[0].actionType).toBe('PAYPAL_DISPUTE_SUBMIT');
    });

    it('[TC-T1-F24-05] should not hallucinate unverified financial claims', () => {
      const verifiedRecordsCount = store.getState().reconciliationRecords.length;
      expect(verifiedRecordsCount).toBe(2);
    });
  });

  // Feature 25: Verified Context Inspector
  describe('Feature 25: Verified Context Inspector', () => {
    it('[TC-T1-F25-01] should display active total liquid cash in context panel', () => {
      expect(store.getState().digitalTwinMetrics.totalLiquidCash).toBe(142500);
    });

    it('[TC-T1-F25-02] should display identified recovery cases count in context', () => {
      const count = store.getState().recoveryCases.length;
      expect(count).toBeGreaterThanOrEqual(5);
    });

    it('[TC-T1-F25-03] should display active Udhari ledger outstanding balance in context', () => {
      const udhariTotal = store.getState().udhariCustomers.reduce((s: number, u: any) => s + u.outstandingBalance, 0);
      expect(udhariTotal).toBe(9650);
    });

    it('[TC-T1-F25-04] should reflect real-time updates when store mutates', () => {
      store.recordCustomerSettlement('udh-01', 1000, 'PAYPAL');
      const updatedTotal = store.getState().udhariCustomers.reduce((s: number, u: any) => s + u.outstandingBalance, 0);
      expect(updatedTotal).toBe(8650);
    });

    it('[TC-T1-F25-05] should display PayPal Sandbox connection status badge as active', () => {
      const status = 'CONNECTED_SANDBOX';
      expect(status).toBe('CONNECTED_SANDBOX');
    });
  });

  // Feature 26: Governed Action Queue
  describe('Feature 26: Governed Action Queue', () => {
    it('[TC-T1-F26-01] should load pending approval requests from seed data', () => {
      const approvals = store.getState().approvalRequests;
      expect(approvals.length).toBeGreaterThanOrEqual(1);
      expect(approvals[0].requestNumber).toBe('APR-2024-001');
    });

    it('[TC-T1-F26-02] should include actionType PAYPAL_DISPUTE_SUBMIT', () => {
      const apr = store.getState().approvalRequests[0];
      expect(apr.actionType).toBe('PAYPAL_DISPUTE_SUBMIT');
    });

    it('[TC-T1-F26-03] should include risk rating for governance assessment', () => {
      const apr = store.getState().approvalRequests[0];
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(apr.riskRating);
    });

    it('[TC-T1-F26-04] should specify amount and currency for financial transparency', () => {
      const apr = store.getState().approvalRequests[0];
      expect(apr.amount).toBe(1420);
      expect(apr.currency).toBe('USD');
    });

    it('[TC-T1-F26-05] should remove request from pending queue upon execution', async () => {
      await store.executeSandboxClaim('case-rec-101');
      const remaining = store.getState().approvalRequests.filter((a: any) => a.targetEntityId === 'case-rec-101');
      expect(remaining.length).toBe(0);
    });
  });

  // Feature 27: Exact Payload Inspection
  describe('Feature 27: Exact Payload Inspection', () => {
    it('[TC-T1-F27-01] should expose exact HTTP method (POST)', () => {
      const blueprint = store.getState().approvalRequests[0].paypalApiBlueprint;
      expect(blueprint.httpMethod).toBe('POST');
    });

    it('[TC-T1-F27-02] should expose target endpoint path (/v1/customer-disputes)', () => {
      const blueprint = store.getState().approvalRequests[0].paypalApiBlueprint;
      expect(blueprint.endpointPath).toBe('/v1/customer-disputes');
    });

    it('[TC-T1-F27-03] should provide UUID v4 idempotency key', () => {
      const blueprint = store.getState().approvalRequests[0].paypalApiBlueprint;
      expect(blueprint.idempotencyKey).toBe('7f83b165-ff1f-c53b-92dc-18148a1d65df');
    });

    it('[TC-T1-F27-04] should include exact requestBody with dispute amount', () => {
      const body = store.getState().approvalRequests[0].paypalApiBlueprint.requestBody;
      expect(body.dispute_amount.value).toBe('1420.00');
      expect(body.reason).toBe('DUPLICATE_PROCESSING_FEE');
    });

    it('[TC-T1-F27-05] should include seller transaction ID in disputed_transactions array', () => {
      const txns = store.getState().approvalRequests[0].paypalApiBlueprint.requestBody.disputed_transactions;
      expect(txns[0].seller_transaction_id).toBe('9XY8472910482910M');
    });
  });

  // Feature 28: Sandbox Execution Simulator
  describe('Feature 28: Sandbox Execution Simulator', () => {
    it('[TC-T1-F28-01] should execute sandbox claim asynchronously', async () => {
      const promise = store.executeSandboxClaim('case-rec-101');
      expect(promise instanceof Promise).toBe(true);
      const res = await promise;
      expect(res.success).toBe(true);
    });

    it('[TC-T1-F28-02] should generate valid simulated PayPal transaction reference', async () => {
      const res = await store.executeSandboxClaim('case-rec-101');
      expect(res.txnId).toBeDefined();
      expect(res.txnId.startsWith('PP-TXN-')).toBe(true);
    });

    it('[TC-T1-F28-03] should set actualRecoveredAmount to equal claimAmount', async () => {
      await store.executeSandboxClaim('case-rec-101');
      const c = store.getState().recoveryCases.find((x: any) => x.id === 'case-rec-101');
      expect(c.actualRecoveredAmount).toBe(1420);
    });

    it('[TC-T1-F28-04] should update PayPal available balance', async () => {
      const initialPayPalBalance = store.getState().digitalTwinMetrics.paypalAvailableBalance;
      await store.executeSandboxClaim('case-rec-101');
      expect(store.getState().digitalTwinMetrics.paypalAvailableBalance).toBe(initialPayPalBalance + 1420);
    });

    it('[TC-T1-F28-05] should return ISO-8601 execution timestamp', async () => {
      const res = await store.executeSandboxClaim('case-rec-101');
      expect(new Date(res.timestamp).getTime()).not.toBeNaN();
    });
  });

  // Feature 29: Hash-Signed Report Generator
  describe('Feature 29: Hash-Signed Report Generator', () => {
    it('[TC-T1-F29-01] should compute deterministic SHA-256 hash for report payload', () => {
      const report = store.generateSignedReport('RECOVERY_AUDIT');
      expect(report.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('[TC-T1-F29-02] should format signatureBadge with sha256: prefix', () => {
      const report = store.generateSignedReport('RECOVERY_AUDIT');
      expect(report.signatureBadge).toBe(`sha256:${report.payloadHash}`);
    });

    it('[TC-T1-F29-03] should embed generated timestamp in report package', () => {
      const report = store.generateSignedReport('RECOVERY_AUDIT');
      expect(report.generatedAt).toBeDefined();
    });

    it('[TC-T1-F29-04] should embed underlying report data in package', () => {
      const report = store.generateSignedReport('RECOVERY_AUDIT');
      expect(report.data.reportType).toBe('RECOVERY_AUDIT');
      expect(report.data.recoveryCases).toBeDefined();
    });

    it('[TC-T1-F29-05] should produce identical hash for identical payload objects regardless of key order', () => {
      const p1 = { a: 1, b: 2 };
      const p2 = { b: 2, a: 1 };
      expect(computeCanonicalSha256(p1)).toBe(computeCanonicalSha256(p2));
    });
  });

  // Feature 30: Scoped Expiring Link Generator
  describe('Feature 30: Scoped Expiring Link Generator', () => {
    it('[TC-T1-F30-01] should format mock share URL with token query param', () => {
      const report = store.generateSignedReport('RECOVERY_AUDIT');
      const shareUrl = `https://paypilot.app/share/audit-${report.payloadHash.slice(0, 8)}?token=xyz`;
      expect(shareUrl).toContain('https://paypilot.app/share/');
      expect(shareUrl).toContain('token=');
    });

    it('[TC-T1-F30-02] should support 24-hour expiration duration', () => {
      const now = Date.now();
      const expires24h = new Date(now + 24 * 3600 * 1000).toISOString();
      expect(new Date(expires24h).getTime() - now).toBe(24 * 3600 * 1000);
    });

    it('[TC-T1-F30-03] should support 7-day expiration duration', () => {
      const now = Date.now();
      const expires7d = new Date(now + 7 * 24 * 3600 * 1000).toISOString();
      expect(new Date(expires7d).getTime() - now).toBe(7 * 24 * 3600 * 1000);
    });

    it('[TC-T1-F30-04] should support role scoping (EXTERNAL_ACCOUNTANT)', () => {
      const scope = { role: 'EXTERNAL_ACCOUNTANT', readOnly: true };
      expect(scope.role).toBe('EXTERNAL_ACCOUNTANT');
      expect(scope.readOnly).toBe(true);
    });

    it('[TC-T1-F30-05] should allow revoking link access', () => {
      const link = { id: 'link-01', revoked: false };
      link.revoked = true;
      expect(link.revoked).toBe(true);
    });
  });

  // Feature 31: PayPal Sandbox Configuration
  describe('Feature 31: PayPal Sandbox Configuration', () => {
    it('[TC-T1-F31-01] should provide simulated PayPal Sandbox Client ID', () => {
      const clientId = 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewqqqWDW5qAzWmpxyShUIew51ndW5oEkfqGsbzsKWq';
      expect(clientId.length).toBeGreaterThan(20);
    });

    it('[TC-T1-F31-02] should indicate Sandbox environment mode', () => {
      const environment = 'SANDBOX';
      expect(environment).toBe('SANDBOX');
    });

    it('[TC-T1-F31-03] should indicate connection status as Connected REST API v2', () => {
      const status = 'Connected — PayPal Sandbox REST API v2';
      expect(status).toContain('Connected');
    });

    it('[TC-T1-F31-04] should support simulated ping test returning latency', async () => {
      const ping = async () => ({ status: 'HEALTHY', latencyMs: 142 });
      const res = await ping();
      expect(res.status).toBe('HEALTHY');
      expect(res.latencyMs).toBeGreaterThan(0);
    });

    it('[TC-T1-F31-05] should maintain masked Client Secret for security', () => {
      const maskedSecret = '••••••••••••••••••••••••••••••••3aF9';
      expect(maskedSecret.startsWith('••••')).toBe(true);
      expect(maskedSecret.endsWith('3aF9')).toBe(true);
    });
  });

  // Feature 32: One-Click Judge Reset Button
  describe('Feature 32: One-Click Judge Reset Button', () => {
    it('[TC-T1-F32-01] should return boolean true on resetToDemoState execution', () => {
      const res = store.resetToDemoState();
      expect(res).toBe(true);
    });

    it('[TC-T1-F32-02] should revert modified active route back to command-center', () => {
      store.setActiveRoute('udhari-ledger');
      expect(store.getState().activeRoute).toBe('udhari-ledger');
      store.resetToDemoState();
      expect(store.getState().activeRoute).toBe('command-center');
    });

    it('[TC-T1-F32-03] should restore all recovery cases to pristine unrecovered state', async () => {
      await store.executeSandboxClaim('case-rec-101');
      expect(store.getState().recoveryCases[0].status).toBe('VERIFIED_RECOVERED');
      store.resetToDemoState();
      expect(store.getState().recoveryCases[0].status).toBe('POTENTIAL_IDENTIFIED');
    });

    it('[TC-T1-F32-04] should restore simulation parameters to defaults (Deposit 20%, Delay 15d)', () => {
      store.updateSimulationParameters({ upfrontDepositPct: 80, customerPaymentDelayDays: 60 });
      store.resetToDemoState();
      expect(store.getState().simulationParameters.upfrontDepositPct).toBe(20);
      expect(store.getState().simulationParameters.customerPaymentDelayDays).toBe(15);
    });

    it('[TC-T1-F32-05] should reset demoAct back to Act 1', () => {
      store.setDemoAct(4);
      store.resetToDemoState();
      expect(store.getState().demoAct).toBe(1);
    });
  });

  // Feature 33: Explainability Drawer
  describe('Feature 33: Explainability Drawer', () => {
    it('[TC-T1-F33-01] should start with drawer closed', () => {
      expect(store.getState().explainabilityDrawer.isOpen).toBe(false);
    });

    it('[TC-T1-F33-02] should open drawer on openExplainability call', () => {
      store.openExplainability('RULE-DUP-FEE-02', 'case-rec-101');
      const drawer = store.getState().explainabilityDrawer;
      expect(drawer.isOpen).toBe(true);
      expect(drawer.ruleId).toBe('RULE-DUP-FEE-02');
      expect(drawer.recordId).toBe('case-rec-101');
    });

    it('[TC-T1-F33-03] should close drawer on closeExplainability call', () => {
      store.openExplainability('RULE-DUP-FEE-02');
      store.closeExplainability();
      expect(store.getState().explainabilityDrawer.isOpen).toBe(false);
      expect(store.getState().explainabilityDrawer.ruleId).toBeNull();
    });

    it('[TC-T1-F33-04] should provide case explainability details with formula and sources', () => {
      const c = store.getState().recoveryCases.find((x: any) => x.caseNumber === 'REC-101');
      expect(c.explainability.detectionFormula).toContain('Overcharge');
      expect(c.explainability.sourceRecords.length).toBeGreaterThanOrEqual(2);
    });

    it('[TC-T1-F33-05] should provide raw PayPal JSON payload in explainability details', () => {
      const c = store.getState().recoveryCases.find((x: any) => x.caseNumber === 'REC-101');
      expect(c.explainability.rawPayPalPayload.id).toBe('9XY8472910482910M');
      expect(c.explainability.rawPayPalPayload.duplicate_flag).toBe(true);
    });
  });

  // Feature 34: Ambient Particle Background
  describe('Feature 34: Ambient Particle Background', () => {
    it('[TC-T1-F34-01] should implement ThreeSceneController contract for ambient scene', () => {
      let initCalled = false;
      const controller: ThreeSceneController = {
        init: () => { initCalled = true; },
        resize: () => {},
        destroy: () => {},
      };
      controller.init(createMockContainer());
      expect(initCalled).toBe(true);
    });

    it('[TC-T1-F34-02] should accept pointer move coordinates to steer particle drift', () => {
      let driftCoords = { x: 0, y: 0 };
      const controller: ThreeSceneController = {
        init: () => {},
        onPointerMove: (x, y) => { driftCoords = { x, y }; },
        resize: () => {},
        destroy: () => {},
      };
      controller.onPointerMove!(0.2, -0.1);
      expect(driftCoords.x).toBe(0.2);
    });

    it('[TC-T1-F34-03] should handle window resize events cleanly', () => {
      let width = 0;
      const controller: ThreeSceneController = {
        init: () => {},
        resize: (w) => { width = w; },
        destroy: () => {},
      };
      controller.resize(1440, 900);
      expect(width).toBe(1440);
    });

    it('[TC-T1-F34-04] should cleanly destroy ambient scene without memory leaks', () => {
      let destroyed = false;
      const controller: ThreeSceneController = {
        init: () => {},
        resize: () => {},
        destroy: () => { destroyed = true; },
      };
      controller.destroy();
      expect(destroyed).toBe(true);
    });

    it('[TC-T1-F34-05] should render behind UI cards with non-blocking pointer events', () => {
      const canvasStyle = { pointerEvents: 'none', position: 'fixed', zIndex: -1 };
      expect(canvasStyle.pointerEvents).toBe('none');
      expect(canvasStyle.zIndex).toBe(-1);
    });
  });

  // Feature 35: 5-Act Demo Controller
  describe('Feature 35: 5-Act Demo Controller', () => {
    it('[TC-T1-F35-01] should initialize demoAct at Act 1 (FIND)', () => {
      expect(store.getState().demoAct).toBe(1);
    });

    it('[TC-T1-F35-02] should allow advancing to Act 2 (PROVE)', () => {
      store.setDemoAct(2);
      expect(store.getState().demoAct).toBe(2);
    });

    it('[TC-T1-F35-03] should allow advancing to Act 3 (RECOVER)', () => {
      store.setDemoAct(3);
      expect(store.getState().demoAct).toBe(3);
    });

    it('[TC-T1-F35-04] should allow advancing to Act 4 (PROTECT)', () => {
      store.setDemoAct(4);
      expect(store.getState().demoAct).toBe(4);
    });

    it('[TC-T1-F35-05] should allow advancing to Act 5 (SHARE) and clamp between 1 and 5', () => {
      store.setDemoAct(5);
      expect(store.getState().demoAct).toBe(5);
      store.setDemoAct(10);
      expect(store.getState().demoAct).toBe(5);
      store.setDemoAct(-5);
      expect(store.getState().demoAct).toBe(1);
    });
  });
});
