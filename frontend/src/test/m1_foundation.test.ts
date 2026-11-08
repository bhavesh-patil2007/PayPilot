import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { usePayPilotStore, calculateCashFlowProjections } from '../store/usePayPilotStore';
import { PRISTINE_DEMO_SEED_DATA } from '../store/demoSeedData';
import { sandboxService } from '../services/sandboxService';
import {
  canonicalStringify,
  computeSha256,
  formatSignatureBadge,
  signReportPayload,
  verifyReportIntegrity,
  pureJsSha256,
} from '../services/hashService';
import {
  disposeObject3D,
  disposeThreeScene,
  disposeMaterial,
  disposeTexture,
} from '../components/3d/utils/threeDisposal';
import { isWebGLAvailable, Default2DFallback } from '../components/3d/ThreeCanvasContainer';
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Milestone 1 Foundation Test Suite', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
    sandboxService.clearAuditTrail();
    sandboxService.configure({ simulatedLatencyMs: 1 }); // Fast test execution
  });

  describe('1. Zustand Store & Deterministic Seed Fixtures', () => {
    it('initializes with balanced financial universe matching specifications', () => {
      const state = usePayPilotStore.getState();

      expect(state.executiveKpis.totalAvailableCash).toBe(142500.00);
      expect(state.executiveKpis.identifiedLostRevenue).toBe(18450.00);
      expect(state.executiveKpis.upcoming30DayCommitments).toBe(43200.00);
      expect(state.executiveKpis.financialRunwayDays).toBe(94);
      expect(state.recoveryCases).toHaveLength(12);
      expect(state.reconciliationRecords).toHaveLength(5);
      expect(state.commitments).toHaveLength(4);
      expect(state.udhariCustomers).toHaveLength(5);
      expect(state.pendingApprovals).toHaveLength(3);
    });

    it('mutates state atomically via actions', () => {
      usePayPilotStore.getState().setActiveRoute('payback-hunter');
      expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');

      usePayPilotStore.getState().setDemoAct(3);
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(3);

      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
      const drawer = usePayPilotStore.getState().explainabilityDrawer;
      expect(drawer.isOpen).toBe(true);
      expect(drawer.activeRuleId).toBe('RULE-DUP-FEE-02');

      usePayPilotStore.getState().closeExplainability();
      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(false);
    });

    it('executes One-Click Judge Reset (resetToDemoState) cleanly reverting all mutations', async () => {
      // 1. Mutate multiple store slices
      usePayPilotStore.getState().setActiveRoute('approvals');
      usePayPilotStore.getState().setSelectedRecoveryCaseId('REC-101');
      
      // Execute a claim to alter cash and cases
      await usePayPilotStore.getState().executeSandboxClaim('REC-101');

      const mutatedCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;
      expect(mutatedCash).toBe(142500.00 + 1420.00);

      // 2. Perform Judge Reset
      const resetResult = usePayPilotStore.getState().resetToDemoState();
      expect(resetResult).toBe(true);

      // 3. Verify exact pristine restoration
      const resetState = usePayPilotStore.getState();
      expect(resetState.activeRoute).toBe('command-center');
      expect(resetState.executiveKpis.totalAvailableCash).toBe(142500.00);
      expect(resetState.executiveKpis.identifiedLostRevenue).toBe(18450.00);
      expect(resetState.selectedRecoveryCaseId).toBeNull();
      expect(resetState.demoActStepper.currentAct).toBe(1);

      const rec101 = resetState.recoveryCases.find((c) => c.id === 'REC-101');
      expect(rec101?.status).toBe('POTENTIAL_IDENTIFIED');
      expect(rec101?.actualRecoveredAmount).toBe(0);
    });
  });

  describe('2. Dynamic 3-Slider Cash Flow Recalculation', () => {
    it('calculates 91 daily projection points over 90 days', () => {
      const result = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: 15,
        milestoneSplit: [30, 40, 30],
        milestonePreset: '30_40_30',
      });

      expect(result.dailyProjections).toHaveLength(91);
      expect(result.dailyProjections[0].dayIndex).toBe(0);
      expect(result.dailyProjections[90].dayIndex).toBe(90);
      expect(result.minimumCashPoint.amount).toBeGreaterThan(0);
    });

    it('immediately increases day 0 cash when upfront deposit slider increases', () => {
      const baseline = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: 15,
        milestoneSplit: [30, 40, 30],
        milestonePreset: '30_40_30',
      });

      const highDeposit = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 60,
        customerPaymentDelayDays: 15,
        milestoneSplit: [30, 40, 30],
        milestonePreset: '30_40_30',
      });

      // Day 0 inflow with 60% of $60,000 = $36,000 + $2,200 vs 20% = $12,000 + $2,200
      expect(highDeposit.dailyProjections[0].inFlow).toBeGreaterThan(baseline.dailyProjections[0].inFlow);
      expect(highDeposit.dailyProjections[0].balance).toBeGreaterThan(baseline.dailyProjections[0].balance);
    });

    it('updates simulation state reactively in store', () => {
      usePayPilotStore.getState().updateSimulationParameters({ upfrontDepositPct: 50 });
      const currentSim = usePayPilotStore.getState().simulationState;
      expect(currentSim.parameters.upfrontDepositPct).toBe(50);
      expect(currentSim.dailyProjections).toHaveLength(91);

      usePayPilotStore.getState().setSimulationScenario('OPTIMISTIC');
      expect(usePayPilotStore.getState().simulationState.selectedScenario).toBe('OPTIMISTIC');
      expect(usePayPilotStore.getState().simulationState.parameters.upfrontDepositPct).toBe(50);
    });
  });

  describe('3. Simulated PayPal Sandbox Service', () => {
    it('executes simulated refund capture and logs audit trail', async () => {
      const res = await sandboxService.executeRefund({
        caseId: 'REC-101',
        captureId: 'TXN-90214-PP',
        amount: 1420.00,
        currency: 'USD',
      });

      expect(res.data.status).toBe('COMPLETED');
      expect(res.data.id).toMatch(/^REFUND-CAP-/);
      expect(res.data.amount.value).toBe('1420.00');

      const audit = sandboxService.getAuditTrail();
      expect(audit).toHaveLength(1);
      expect(audit[0].action).toBe('REFUND_CAPTURE');
      expect(audit[0].targetId).toBe('REC-101');
      expect(audit[0].httpStatus).toBe(200);
    });

    it('submits dispute evidence and returns UNDER_REVIEW', async () => {
      const res = await sandboxService.submitDisputeEvidence({
        caseId: 'REC-106',
        disputeId: 'PP-D-882914',
        evidenceType: 'PROOF_OF_FULFILLMENT',
        notes: 'Signed bill of lading submitted.',
      });

      expect(res.data.status).toBe('UNDER_REVIEW');
      expect(res.data.dispute_id).toBe('PP-D-882914');
      expect(sandboxService.getAuditTrail()).toHaveLength(1);
    });

    it('executes fee claim resolution', async () => {
      const res = await sandboxService.executeFeeClaim({
        caseId: 'REC-102',
        originalTxnId: 'TXN-8842',
        claimedAmount: 840.00,
        reasonCode: 'TIER_OVERCHARGE',
        justification: 'Volume tier discount breach',
      });

      expect(res.data.status).toBe('RESOLVED');
      expect(res.data.claim_id).toMatch(/^CLAIM-PP-/);
      expect(res.data.fee_credited.value).toBe('840.00');
    });

    it('verifies sandbox credentials and clears audit trail', async () => {
      const valid = await sandboxService.verifySandboxCredentials('sb-client-test-hackathon', 'secret');
      expect(valid.success).toBe(true);

      const invalid = await sandboxService.verifySandboxCredentials('short', 'secret');
      expect(invalid.success).toBe(false);

      expect(sandboxService.getAuditTrail().length).toBeGreaterThan(0);
      sandboxService.clearAuditTrail();
      expect(sandboxService.getAuditTrail()).toHaveLength(0);
    });
  });

  describe('4. Cryptographic Hash Service (SHA-256 & Verification Badge)', () => {
    it('canonicalStringify produces identical strings regardless of key order', () => {
      const obj1 = { z: 1, a: 2, m: { y: 10, b: 20 } };
      const obj2 = { a: 2, m: { b: 20, y: 10 }, z: 1 };

      expect(canonicalStringify(obj1)).toBe(canonicalStringify(obj2));
    });

    it('pureJsSha256 computes correct FIPS 180-2 hash', () => {
      // Known test vector for empty string: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      expect(pureJsSha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      // Known test vector for 'hello'
      expect(pureJsSha256('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('computes consistent SHA-256 for identical objects', async () => {
      const hash1 = await computeSha256({ amount: 1420, caseId: 'REC-101' });
      const hash2 = await computeSha256({ caseId: 'REC-101', amount: 1420 });

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('formats signature badge correctly', () => {
      const badge = formatSignatureBadge('7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069');
      expect(badge).toBe('#PAY-SHA256-7F83B165-126D9069');
    });

    it('signs report payload and verifies cryptographic integrity', async () => {
      const signed = await signReportPayload({
        id: 'REP-TEST-1',
        reportType: 'RECOVERY_AUDIT',
        title: 'Test Audit',
        generatedBy: 'Sarah Connor',
        scope: 'ACCOUNTANT_VERIFIED',
        data: { recovered: 1420 },
      });

      expect(signed.isVerified).toBe(true);
      expect(signed.payloadHash).toHaveLength(64);
      expect(signed.signatureBadge).toMatch(/^#PAY-SHA256-[A-F0-9]{8}-[A-F0-9]{8}$/);

      const isValid = await verifyReportIntegrity(signed);
      expect(isValid).toBe(true);

      // Tamper test: alter payload data
      signed.payload.data.recovered = 999999;
      const isTampered = await verifyReportIntegrity(signed);
      expect(isTampered).toBe(false);
    });
  });

  describe('5. Three.js GPU Resource Disposal Utility', () => {
    it('disposes geometries, materials, and textures without throwing errors', () => {
      const scene = new THREE.Scene();
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);

      const geomSpy = vi.spyOn(geom, 'dispose');
      const matSpy = vi.spyOn(mat, 'dispose');

      disposeObject3D(scene);

      expect(geomSpy).toHaveBeenCalled();
      expect(matSpy).toHaveBeenCalled();
    });

    it('clears all scene children and disposes render targets on disposeThreeScene', () => {
      const scene = new THREE.Scene();
      scene.add(new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()));
      scene.add(new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()));

      expect(scene.children.length).toBe(2);
      disposeThreeScene(scene);
      expect(scene.children.length).toBe(0);
    });
  });

  describe('6. ThreeCanvasContainer & 2D Fallback', () => {
    it('isWebGLAvailable returns boolean', () => {
      const available = isWebGLAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('renders Default2DFallback with high-polish dark theme elements', () => {
      render(React.createElement(Default2DFallback, { label: 'Globe Scene Test' }));
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByText('Globe Scene Test')).toBeInTheDocument();
      expect(screen.getByText(/2D High-Performance Fallback Active/i)).toBeInTheDocument();
    });
  });
});
