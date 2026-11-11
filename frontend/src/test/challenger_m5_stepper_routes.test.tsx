// ============================================================================
// CHALLENGER M5 ADVERSARIAL STRESS TEST SUITE
// File: frontend/src/test/challenger_m5_stepper_routes.test.tsx
// ============================================================================
// Stress-tests:
// 1. 5-Act Stepper progression (forward 1->5, backward 5->1, boundary conditions)
// 2. Direct jumping across non-adjacent acts (Act 1 -> 4 -> 2 -> 5 -> 3 -> 1)
// 3. High-frequency route navigation (rapid switching across all 12 routes 50 times)
// 4. One-Click Judge Reset stress test with massive multi-slice mutations
// 5. Floating stepper minimize/maximize toggling, close/reopen lifecycle
// ============================================================================

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import App from '../App';
import { DemoFlowStepper, ACT_DEFINITIONS } from '../components/common/DemoFlowStepper';
import { Header } from '../components/layout/Header';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { PRISTINE_DEMO_SEED_DATA } from '../store/demoSeedData';
import { AppRoute, CommitmentItem } from '../types';
import { DEMO_CREDENTIALS, saveDemoSession } from '../services/appAuth';

describe('Challenger M5: 5-Act Stepper, 12-Route Router & One-Click Judge Reset Stress Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    usePayPilotStore.getState().resetToDemoState();
    saveDemoSession(DEMO_CREDENTIALS.email);
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // SUITE 1: 5-Act Stepper Progression & Boundary Transitions
  // ==========================================================================
  describe('Suite 1: Stepper Progression & Boundary Transitions', () => {
    it('steps forward sequentially from Act 1 to Act 5 and verifies route & narrative synchronization', () => {
      render(<DemoFlowStepper />);

      const nextBtn = screen.getByTestId('demo-next-act-btn');
      const prevBtn = screen.getByTestId('demo-prev-act-btn');

      // Initial state: Act 1
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(1);
      expect(screen.getByText(ACT_DEFINITIONS[0].headline)).toBeInTheDocument();
      expect(screen.getByText(ACT_DEFINITIONS[0].keyHighlight)).toBeInTheDocument();
      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // Step 1 -> 2 (Prove)
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(2);
      expect(usePayPilotStore.getState().activeRoute).toBe('payment-truth');
      expect(screen.getByText(ACT_DEFINITIONS[1].headline)).toBeInTheDocument();
      expect(screen.getByText(ACT_DEFINITIONS[1].keyHighlight)).toBeInTheDocument();
      expect(prevBtn).not.toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // Step 2 -> 3 (Recover)
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(3);
      expect(usePayPilotStore.getState().activeRoute).toBe('approvals');
      expect(screen.getByText(ACT_DEFINITIONS[2].headline)).toBeInTheDocument();
      expect(screen.getByText(ACT_DEFINITIONS[2].keyHighlight)).toBeInTheDocument();

      // Step 3 -> 4 (Protect)
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(4);
      expect(usePayPilotStore.getState().activeRoute).toBe('commitments');
      expect(screen.getByText(ACT_DEFINITIONS[3].headline)).toBeInTheDocument();
      expect(screen.getByText(ACT_DEFINITIONS[3].keyHighlight)).toBeInTheDocument();

      // Step 4 -> 5 (Share)
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(5);
      expect(usePayPilotStore.getState().activeRoute).toBe('team-sharing');
      expect(screen.getByText(ACT_DEFINITIONS[4].headline)).toBeInTheDocument();
      expect(screen.getByText(ACT_DEFINITIONS[4].keyHighlight)).toBeInTheDocument();
      expect(nextBtn).toBeDisabled();
      expect(prevBtn).not.toBeDisabled();
    });

    it('steps backward sequentially from Act 5 to Act 1 and updates active route at each transition', () => {
      // Initialize on Act 5
      act(() => {
        usePayPilotStore.getState().setDemoAct(5);
        usePayPilotStore.getState().setActiveRoute('team-sharing');
      });

      render(<DemoFlowStepper />);

      const prevBtn = screen.getByTestId('demo-prev-act-btn');
      const nextBtn = screen.getByTestId('demo-next-act-btn');

      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(5);
      expect(nextBtn).toBeDisabled();

      // Step 5 -> 4
      act(() => {
        fireEvent.click(prevBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(4);
      expect(usePayPilotStore.getState().activeRoute).toBe('commitments');

      // Step 4 -> 3
      act(() => {
        fireEvent.click(prevBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(3);
      expect(usePayPilotStore.getState().activeRoute).toBe('approvals');

      // Step 3 -> 2
      act(() => {
        fireEvent.click(prevBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(2);
      expect(usePayPilotStore.getState().activeRoute).toBe('payment-truth');

      // Step 2 -> 1
      act(() => {
        fireEvent.click(prevBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(1);
      expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');
      expect(prevBtn).toBeDisabled();
    });

    it('enforces boundary transition guards (clicking prev on Act 1 and next on Act 5 does not violate range [1, 5])', () => {
      render(<DemoFlowStepper />);

      const prevBtn = screen.getByTestId('demo-prev-act-btn');
      const nextBtn = screen.getByTestId('demo-next-act-btn');

      // On Act 1: click prev repeatedly
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(1);
      act(() => {
        fireEvent.click(prevBtn);
        fireEvent.click(prevBtn);
        fireEvent.click(prevBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(1);

      // Advance to Act 5
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-5'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(5);

      // On Act 5: click next repeatedly
      act(() => {
        fireEvent.click(nextBtn);
        fireEvent.click(nextBtn);
        fireEvent.click(nextBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(5);
      expect(usePayPilotStore.getState().activeRoute).toBe('team-sharing');
    });
  });

  // ==========================================================================
  // SUITE 2: Direct Non-Adjacent Act Jumping & Quick Action Triggers
  // ==========================================================================
  describe('Suite 2: Direct Non-Adjacent Act Jumping & Quick Actions', () => {
    it('handles direct non-adjacent jumps (Act 1 -> 4 -> 2 -> 5 -> 3 -> 1) accurately updating activeRoute', () => {
      render(<DemoFlowStepper />);

      // 1 -> 4
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-4'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(4);
      expect(usePayPilotStore.getState().activeRoute).toBe('commitments');
      expect(screen.getByText(ACT_DEFINITIONS[3].headline)).toBeInTheDocument();

      // 4 -> 2
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-2'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(2);
      expect(usePayPilotStore.getState().activeRoute).toBe('payment-truth');
      expect(screen.getByText(ACT_DEFINITIONS[1].headline)).toBeInTheDocument();

      // 2 -> 5
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-5'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(5);
      expect(usePayPilotStore.getState().activeRoute).toBe('team-sharing');
      expect(screen.getByText(ACT_DEFINITIONS[4].headline)).toBeInTheDocument();

      // 5 -> 3
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-3'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(3);
      expect(usePayPilotStore.getState().activeRoute).toBe('approvals');
      expect(screen.getByText(ACT_DEFINITIONS[2].headline)).toBeInTheDocument();

      // 3 -> 1
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-1'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(1);
      expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');
      expect(screen.getByText(ACT_DEFINITIONS[0].headline)).toBeInTheDocument();
    });

    it('triggers contextual quick actions correctly across all 5 acts', () => {
      render(<DemoFlowStepper />);

      // Act 1 Quick Action: Inspect Case REC-101 Formula
      act(() => {
        fireEvent.click(screen.getByTestId('demo-quick-action-btn'));
      });
      expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');
      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);
      expect(usePayPilotStore.getState().explainabilityDrawer.activeRuleId).toBe('RULE-DUP-FEE-02');
      expect(usePayPilotStore.getState().explainabilityDrawer.activeRecordId).toBe('REC-101');

      // Close drawer for next step
      act(() => {
        usePayPilotStore.getState().closeExplainability();
      });
      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(false);

      // Act 2 Quick Action: Inspect 3-Way Discrepancy
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-2'));
      });
      act(() => {
        fireEvent.click(screen.getByTestId('demo-quick-action-btn'));
      });
      expect(usePayPilotStore.getState().activeRoute).toBe('payment-truth');
      expect(usePayPilotStore.getState().selectedDiscrepancyId).toBe('REC-TRUTH-101');

      // Act 3 Quick Action: Review Governed Approval
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-3'));
      });
      act(() => {
        fireEvent.click(screen.getByTestId('demo-quick-action-btn'));
      });
      expect(usePayPilotStore.getState().activeRoute).toBe('approvals');

      // Act 4 Quick Action: Test Order in Commitments
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-4'));
      });
      act(() => {
        fireEvent.click(screen.getByTestId('demo-quick-action-btn'));
      });
      expect(usePayPilotStore.getState().activeRoute).toBe('commitments');

      // Act 5 Quick Action: Generate Signed Audit Pack
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-5'));
      });
      act(() => {
        fireEvent.click(screen.getByTestId('demo-quick-action-btn'));
      });
      expect(usePayPilotStore.getState().activeRoute).toBe('team-sharing');
    });

    it('synchronizes act selection bidirectionally between Header act buttons and DemoFlowStepper', () => {
      render(
        <div>
          <Header />
          <DemoFlowStepper />
        </div>
      );

      // Header button 4
      act(() => {
        fireEvent.click(screen.getByTestId('header-act-btn-4'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(4);
      expect(usePayPilotStore.getState().activeRoute).toBe('commitments');

      // Header button 2
      act(() => {
        fireEvent.click(screen.getByTestId('header-act-btn-2'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(2);
      expect(usePayPilotStore.getState().activeRoute).toBe('payment-truth');
    });
  });

  // ==========================================================================
  // SUITE 3: High-Frequency Route Navigation (50x rapid cycles across 12 routes)
  // ==========================================================================
  describe('Suite 3: High-Frequency Route Navigation Stress Test', () => {
    it('rapidly switches between all 12 routes 50 times without React crashes or DOM corruption', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);

      const all12Routes: AppRoute[] = [
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

      const iterations = 50;

      // Execute high-frequency switching
      act(() => {
        for (let i = 0; i < iterations; i++) {
          for (const route of all12Routes) {
            usePayPilotStore.getState().setActiveRoute(route);
          }
        }
      });

      // Verify that after 50 cycles (600 route transitions), the store is intact
      expect(usePayPilotStore.getState().activeRoute).toBe('settings');

      // Verify view container cleanly mounted
      const viewContainer = screen.getByTestId('app-view-container');
      expect(viewContainer).toBeInTheDocument();
      expect(screen.getByTestId('settings-view')).toBeInTheDocument();

      // Switch to a few distinct views and verify clean unmounting / remounting
      act(() => {
        usePayPilotStore.getState().setActiveRoute('command-center');
      });
      expect(screen.queryByTestId('settings-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('command-center-view')).toBeInTheDocument();

      act(() => {
        usePayPilotStore.getState().setActiveRoute('copilot');
      });
      expect(screen.getByTestId('copilot-view')).toBeInTheDocument();

      act(() => {
        usePayPilotStore.getState().setActiveRoute('approvals');
      });
      expect(screen.getByTestId('approvals-view')).toBeInTheDocument();

      act(() => {
        usePayPilotStore.getState().setActiveRoute('team-sharing');
      });
      expect(screen.getByTestId('team-sharing-view')).toBeInTheDocument();

      // Assert no unhandled React exceptions occurred
      const fatalErrors = consoleErrorSpy.mock.calls.filter(([msg]) =>
        typeof msg === 'string' &&
        (msg.includes('Uncaught') || msg.includes('Invariant Violation') || msg.includes('Minified React error'))
      );
      expect(fatalErrors).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================================================
  // SUITE 4: One-Click Judge Reset Stress Test (Massive Multi-Slice Mutations)
  // ==========================================================================
  describe('Suite 4: One-Click Judge Reset Stress Test (Deep State Recovery)', () => {
    it('restores 100% of state slices back to pristine demo state after aggressive concurrent mutations', async () => {
      // 1. Mutate Recovery Cases & Funnel
      await usePayPilotStore.getState().executeSandboxClaim('REC-101');
      await usePayPilotStore.getState().batchClaimRecoveryCases(['REC-102']);

      // 2. Mutate Approvals
      await usePayPilotStore.getState().approveAndExecuteAction('APR-9941');
      usePayPilotStore.getState().rejectApprovalAction('APR-8812', 'Test Rejection');

      // 3. Mutate Commitments
      const customCommitment: CommitmentItem = {
        id: 'COM-CUSTOM-STRESS-99',
        referenceNumber: 'PO-TEST-99',
        title: 'Adversarial Stress Test Commitment',
        counterparty: 'Adversarial Mega Corp',
        category: 'SAAS_TOOLS',
        startDate: '2024-11-01',
        dueDate: '2024-12-31',
        totalCommittedAmount: 75000,
        amountPaidToDate: 0,
        pendingBalance: 75000,
        paymentTerms: 'NET_30',
        milestones: [],
        firewallStatus: 'CRITICAL_BUFFER_BREACH',
        firewallVerdict: {
          safe: false,
          lowestProjectedBuffer: -5000,
          explanation: 'Breaches buffer threshold',
        },
        priority: 'HIGH',
      };
      usePayPilotStore.getState().addCommitment(customCommitment);

      // 4. Mutate Simulation Parameters
      usePayPilotStore.getState().updateSimulationParameters({
        upfrontDepositPct: 75,
        customerPaymentDelayDays: 50,
        milestoneSplit: [60, 20, 20],
      });

      // 5. Mutate Copilot History
      await usePayPilotStore.getState().sendCopilotMessage('Stress test prompt: calculate my cash runway.');

      // 6. Mutate Reports & Sharing
      usePayPilotStore.getState().generateSignedReport('Adversarial Test Report', 'RECOVERY_AUDIT_PROOF');

      // 7. Mutate PayPal Sandbox Config
      usePayPilotStore.getState().updatePayPalConfig({
        environment: 'LIVE',
        simulatorToggles: {
          simulateApiLatencyMs: 1500,
          simulateNetworkErrorRatePct: 5,
          autoCreditReserveOnDispute: false,
        },
      });

      // 8. Mutate Digital Twin, Radar, Discrepancies, and Stepper
      usePayPilotStore.getState().setTimeScrubberOffset(60);
      usePayPilotStore.getState().triggerStressTest('STRESS-01');
      usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
      usePayPilotStore.getState().setDemoAct(4);
      usePayPilotStore.getState().setActiveRoute('approvals');

      // VERIFY STATE HAS INDEED MUTATED FROM PRISTINE
      const mutatedState = usePayPilotStore.getState();
      expect(mutatedState.activeRoute).toBe('approvals');
      expect(mutatedState.demoActStepper.currentAct).toBe(4);
      expect(mutatedState.explainabilityDrawer.isOpen).toBe(true);
      expect(mutatedState.selectedDiscrepancyId).toBe('REC-TRUTH-101');
      expect(mutatedState.timeScrubberOffsetDays).toBe(60);
      expect(mutatedState.commitments.length).toBeGreaterThan(PRISTINE_DEMO_SEED_DATA.commitments.length);
      expect(mutatedState.sharedReports.length).toBeGreaterThan(PRISTINE_DEMO_SEED_DATA.sharedReports.length);
      expect(mutatedState.copilotMessages.length).toBeGreaterThan(PRISTINE_DEMO_SEED_DATA.copilotMessages.length);
      expect(mutatedState.executiveKpis.totalAvailableCash).not.toBe(PRISTINE_DEMO_SEED_DATA.executiveKpis.totalAvailableCash);
      expect(mutatedState.simulationState.parameters.upfrontDepositPct).toBe(75);

      // EXECUTE ONE-CLICK JUDGE RESET
      const resetOk = usePayPilotStore.getState().resetToDemoState();
      expect(resetOk).toBe(true);

      // VERIFY 100% PURGE & RESTORATION TO PRISTINE DATA FIXTURES
      const pristineState = usePayPilotStore.getState();

      // UI & Stepper
      expect(pristineState.activeRoute).toBe('command-center');
      expect(pristineState.demoActStepper.currentAct).toBe(1);
      expect(pristineState.demoActStepper.activeStepComplete).toBe(false);
      expect(pristineState.explainabilityDrawer.isOpen).toBe(false);
      expect(pristineState.explainabilityDrawer.activeRuleId).toBeNull();
      expect(pristineState.explainabilityDrawer.activeRecordId).toBeNull();
      expect(pristineState.selectedRecoveryCaseId).toBeNull();
      expect(pristineState.selectedDiscrepancyId).toBeNull();
      expect(pristineState.timeScrubberOffsetDays).toBe(0);
      expect(pristineState.isCopilotThinking).toBe(false);
      expect(pristineState.minimumSafetyBuffer).toBe(15000.00);

      // Slices deep check
      expect(pristineState.executiveKpis).toEqual(PRISTINE_DEMO_SEED_DATA.executiveKpis);
      expect(pristineState.recoveryCases).toEqual(PRISTINE_DEMO_SEED_DATA.recoveryCases);
      expect(pristineState.recoveryFunnelMetrics).toEqual(PRISTINE_DEMO_SEED_DATA.recoveryFunnelMetrics);
      expect(pristineState.reconciliationRecords).toEqual(PRISTINE_DEMO_SEED_DATA.reconciliationRecords);
      expect(pristineState.reconciliationSummary).toEqual(PRISTINE_DEMO_SEED_DATA.reconciliationSummary);
      expect(pristineState.commitments).toEqual(PRISTINE_DEMO_SEED_DATA.commitments);
      expect(pristineState.digitalTwinMetrics).toEqual(PRISTINE_DEMO_SEED_DATA.digitalTwinMetrics);
      expect(pristineState.simulationState).toEqual(PRISTINE_DEMO_SEED_DATA.simulationState);
      expect(pristineState.survivalRadarState).toEqual(PRISTINE_DEMO_SEED_DATA.survivalRadarState);
      expect(pristineState.udhariCustomers).toEqual(PRISTINE_DEMO_SEED_DATA.udhariCustomers);
      expect(pristineState.copilotMessages).toEqual(PRISTINE_DEMO_SEED_DATA.copilotMessages);
      expect(pristineState.pendingApprovals).toEqual(PRISTINE_DEMO_SEED_DATA.pendingApprovals);
      expect(pristineState.sharedReports).toEqual(PRISTINE_DEMO_SEED_DATA.sharedReports);
      expect(pristineState.paypalConfig).toEqual(PRISTINE_DEMO_SEED_DATA.paypalConfig);
    });

    it('ensures zero residual reference sharing across repeated reset -> mutate -> reset cycles', () => {
      // Run 5 full cycles of mutate -> reset
      for (let i = 0; i < 5; i++) {
        // Mutate array and object
        usePayPilotStore.getState().addCommitment({
          id: `COM-CYCLE-${i}`,
          referenceNumber: `PO-CYCLE-${i}`,
          title: `Cycle Title ${i}`,
          counterparty: `Cycle Vendor ${i}`,
          category: 'SAAS_TOOLS',
          startDate: '2024-11-01',
          dueDate: '2025-01-01',
          totalCommittedAmount: 1000 * (i + 1),
          amountPaidToDate: 0,
          pendingBalance: 1000 * (i + 1),
          paymentTerms: 'NET_30',
          milestones: [],
          firewallStatus: 'APPROVED_SAFE',
          firewallVerdict: {
            safe: true,
            lowestProjectedBuffer: 25000,
            explanation: 'Safe',
          },
          priority: 'LOW',
        });

        usePayPilotStore.getState().updateSimulationParameters({
          upfrontDepositPct: 30 + i * 5,
        });

        const resetOk = usePayPilotStore.getState().resetToDemoState();
        expect(resetOk).toBe(true);

        // Verify pristine array lengths
        expect(usePayPilotStore.getState().commitments).toHaveLength(PRISTINE_DEMO_SEED_DATA.commitments.length);
        expect(usePayPilotStore.getState().simulationState.parameters.upfrontDepositPct).toBe(
          PRISTINE_DEMO_SEED_DATA.simulationState.parameters.upfrontDepositPct
        );
      }
    });
  });

  // ==========================================================================
  // SUITE 5: Floating Stepper Minimize / Maximize & Close Lifecycle
  // ==========================================================================
  describe('Suite 5: Floating Stepper Minimize / Maximize & Lifecycle', () => {
    it('manages minimize/maximize toggling and close/re-open lifecycle cleanly in App', () => {
      render(<App />);

      const toggleBtn = screen.getByTestId('toggle-stepper-btn');

      // Initially closed
      expect(screen.queryByTestId('demo-flow-stepper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('demo-stepper-minimized')).not.toBeInTheDocument();

      // Open floating stepper via Header toggle
      act(() => {
        fireEvent.click(toggleBtn);
      });
      expect(screen.getByTestId('demo-flow-stepper')).toBeInTheDocument();

      // Minimize stepper
      const minBtn = screen.getByTestId('minimize-stepper-btn');
      act(() => {
        fireEvent.click(minBtn);
      });
      expect(screen.queryByTestId('demo-flow-stepper')).not.toBeInTheDocument();
      expect(screen.getByTestId('demo-stepper-minimized')).toBeInTheDocument();
      expect(screen.getByText('Act 1: Find')).toBeInTheDocument();

      // Maximize stepper by clicking minimized pill
      const minimizedPill = screen.getByTestId('demo-stepper-minimized');
      act(() => {
        fireEvent.click(minimizedPill);
      });
      expect(screen.getByTestId('demo-flow-stepper')).toBeInTheDocument();
      expect(screen.queryByTestId('demo-stepper-minimized')).not.toBeInTheDocument();

      // Advance to Act 3 (Recover) while open
      act(() => {
        fireEvent.click(screen.getByTestId('demo-act-btn-3'));
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(3);

      // Minimize again on Act 3
      act(() => {
        fireEvent.click(screen.getByTestId('minimize-stepper-btn'));
      });
      expect(screen.getByTestId('demo-stepper-minimized')).toBeInTheDocument();
      expect(screen.getByText('Act 3: Recover')).toBeInTheDocument();

      // Maximize again
      act(() => {
        fireEvent.click(screen.getByTestId('demo-stepper-minimized'));
      });
      expect(screen.getByTestId('demo-flow-stepper')).toBeInTheDocument();

      // Close stepper via close button (X)
      const closeBtn = screen.getByTestId('close-stepper-btn');
      act(() => {
        fireEvent.click(closeBtn);
      });
      expect(screen.queryByTestId('demo-flow-stepper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('demo-stepper-minimized')).not.toBeInTheDocument();

      // Re-open stepper via Header button
      act(() => {
        fireEvent.click(toggleBtn);
      });
      expect(screen.getByTestId('demo-flow-stepper')).toBeInTheDocument();
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(3);

      // Trigger Judge Reset in floating stepper footer
      const resetBtn = screen.getByTestId('judge-reset-stepper-btn');
      act(() => {
        fireEvent.click(resetBtn);
      });
      expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(1);
      expect(usePayPilotStore.getState().activeRoute).toBe('command-center');
    });
  });
});
