// ============================================================================
// PAYPILOT UNIFIED ZUSTAND STATE STORE
// File: frontend/src/store/usePayPilotStore.ts
// ============================================================================

import { create } from 'zustand';
import {
  AppRoute,
  ExecutiveKpiSummary,
  MonetaryTransitArc,
  AnomalyFeedItem,
  RecoveryCase,
  RecoveryFunnelMetrics,
  ReconciliationRecord,
  TruthGraphData,
  ReconciliationSummary,
  CommitmentItem,
  NewCommitmentInput,
  FirewallEvaluationResult,
  DigitalTwinMetrics,
  SimulationParameters,
  DailyCashProjectionPoint,
  SimulationLabState,
  BusinessSurvivalRadarState,
  UdhariCustomer,
  UdhariLedgerSummary,
  CopilotEvidenceCitation,
  CopilotMessage,
  CopilotVerifiedContext,
  ApprovalRequest,
  TeamMember,
  HashSignedReport,
  PayPalSandboxConfig,
  ExplainabilityDrawerState,
  DemoActStepperState,
} from '../types';

import { PRISTINE_DEMO_SEED_DATA } from './demoSeedData';
import { sandboxService } from '../services/sandboxService';
import { formatSignatureBadge, pureJsSha256, canonicalStringify } from '../services/hashService';

// ----------------------------------------------------------------------------
// Cash Flow Recalculation Engine
// ----------------------------------------------------------------------------

export function calculateCashFlowProjections(
  startingCash: number,
  params: SimulationParameters,
  safetyBuffer: number = 15000
): {
  dailyProjections: DailyCashProjectionPoint[];
  minimumCashPoint: { amount: number; dayIndex: number; date: string };
  projectedRunwayDays: number;
  isBufferBreached: boolean;
} {
  const points: DailyCashProjectionPoint[] = [];
  let currentBalance = startingCash;
  const startDate = new Date('2024-11-06');

  const pipelineContractValue = 60000;
  const depositRatio = params.upfrontDepositPct / 100;
  const remainingPipeline = pipelineContractValue * (1 - depositRatio);

  const [mDeposit, mMid, mFinal] = params.milestoneSplit;
  const splitSum = (mMid + mFinal) || 1;
  const midShare = (mMid / splitSum) * remainingPipeline;
  const finalShare = (mFinal / splitSum) * remainingPipeline;

  const midPaymentDay = Math.min(90, 30 + params.customerPaymentDelayDays);
  const finalPaymentDay = Math.min(90, 60 + params.customerPaymentDelayDays);

  let minAmount = startingCash;
  let minDay = 0;
  let minDateStr = startDate.toISOString().split('T')[0];
  let breached = false;
  let zeroBalanceDay: number | null = null;

  for (let day = 0; day <= 90; day++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + day);
    const dateStr = curDate.toISOString().split('T')[0];

    let dayInflow = 2200;
    let dayOutflow = 350;

    if (day === 0) {
      dayInflow += pipelineContractValue * depositRatio;
    }
    if (day === midPaymentDay) {
      dayInflow += midShare;
    }
    if (day === finalPaymentDay) {
      dayInflow += finalShare;
    }

    const dayOfMonth = curDate.getDate();
    if (dayOfMonth === 1 || dayOfMonth === 15) {
      dayOutflow += 12000;
    }
    if (dayOfMonth === 1) {
      dayOutflow += 4400;
    }
    if (day === 14) {
      dayOutflow += 10500;
    }
    if (day === 22) {
      dayOutflow += 4300;
    }

    const net = dayInflow - dayOutflow;
    currentBalance += net;

    if (currentBalance < safetyBuffer) {
      breached = true;
    }

    if (currentBalance <= 0 && zeroBalanceDay === null) {
      zeroBalanceDay = day;
    }

    if (currentBalance < minAmount) {
      minAmount = currentBalance;
      minDay = day;
      minDateStr = dateStr;
    }

    points.push({
      dayIndex: day,
      date: dateStr,
      startingBalance: Math.round(currentBalance - net),
      inFlow: Math.round(dayInflow),
      outFlow: Math.round(dayOutflow),
      netCash: Math.round(net),
      balance: Math.round(currentBalance),
      isBreached: currentBalance < safetyBuffer,
      breachSeverity: currentBalance < 0 ? 'CRITICAL' : currentBalance < safetyBuffer ? 'TIGHT' : 'NONE',
    });
  }

  const projectedRunway = zeroBalanceDay !== null 
    ? zeroBalanceDay 
    : Math.round(currentBalance / 1515);

  return {
    dailyProjections: points,
    minimumCashPoint: { amount: Math.round(minAmount), dayIndex: minDay, date: minDateStr },
    projectedRunwayDays: projectedRunway,
    isBufferBreached: breached,
  };
}

// ----------------------------------------------------------------------------
// PayPilot Store State Interface
// ----------------------------------------------------------------------------

export interface PayPilotState {
  // Navigation & UI Shell
  activeRoute: AppRoute;
  explainabilityDrawer: ExplainabilityDrawerState;
  demoActStepper: DemoActStepperState;

  // Module 1: Command Center
  executiveKpis: ExecutiveKpiSummary;
  transitArcs: MonetaryTransitArc[];
  anomalyFeed: AnomalyFeedItem[];

  // Module 2: PayBack Hunter
  recoveryCases: RecoveryCase[];
  recoveryFunnelMetrics: RecoveryFunnelMetrics;
  selectedRecoveryCaseId: string | null;

  // Module 3: Money Map & Payment Truth
  reconciliationRecords: ReconciliationRecord[];
  reconciliationSummary: ReconciliationSummary;
  truthGraphData: TruthGraphData;
  selectedDiscrepancyId: string | null;

  // Module 4: Commitments & Firewall
  commitments: CommitmentItem[];
  minimumSafetyBuffer: number;
  lastFirewallEvaluation: FirewallEvaluationResult | null;

  // Module 5: Financial Digital Twin
  digitalTwinMetrics: DigitalTwinMetrics;
  timeScrubberOffsetDays: number;

  // Module 6: Simulation Lab
  simulationState: SimulationLabState;

  // Module 7: Survival Radar
  survivalRadarState: BusinessSurvivalRadarState;

  // Module 8: Udhari Ledger
  udhariCustomers: UdhariCustomer[];
  udhariSummary: UdhariLedgerSummary;

  // Module 9: Copilot
  copilotMessages: CopilotMessage[];
  copilotVerifiedContext: CopilotVerifiedContext;
  isCopilotThinking: boolean;

  // Module 10: Approvals
  pendingApprovals: ApprovalRequest[];

  // Module 11: Team & Sharing
  teamMembers: TeamMember[];
  sharedReports: HashSignedReport[];

  // Module 12: PayPal Sandbox & Settings
  paypalConfig: PayPalSandboxConfig;

  // --------------------------------------------------------------------------
  // ATOMIC ACTIONS & MUTATORS
  // --------------------------------------------------------------------------

  // System & Reset
  setActiveRoute: (route: AppRoute) => void;
  resetToDemoState: () => boolean;
  setDemoAct: (act: 1 | 2 | 3 | 4 | 5) => void;

  // Explainability Drawer
  openExplainability: (ruleId: string, recordId?: string) => void;
  closeExplainability: () => void;

  // PayBack Hunter Actions
  setSelectedRecoveryCaseId: (caseId: string | null) => void;
  executeSandboxClaim: (caseId: string, notes?: string) => Promise<{ success: boolean; txnId: string; timestamp: string }>;
  batchClaimRecoveryCases: (caseIds: string[]) => Promise<{ processedCount: number; totalAmount: number }>;

  // Payment Truth Actions
  setSelectedDiscrepancyId: (id: string | null) => void;
  resolveDiscrepancy: (recordId: string, note?: string) => void;

  // Commitments & Firewall Actions
  evaluateCommitmentOrder: (order: NewCommitmentInput) => FirewallEvaluationResult;
  addCommitment: (newCommitment: CommitmentItem) => void;

  // Digital Twin Actions
  setTimeScrubberOffset: (days: number) => void;

  // Simulation Lab Actions
  updateSimulationParameters: (params: Partial<SimulationParameters>) => void;
  setSimulationScenario: (scenario: 'BASELINE' | 'OPTIMISTIC' | 'CONSERVATIVE') => void;

  // Survival Radar Actions
  triggerStressTest: (scenarioId: string) => void;
  clearStressTest: () => void;

  // Udhari Ledger Actions
  sendUdhariReminder: (customerId: string, channel: 'WHATSAPP' | 'EMAIL' | 'PAYPAL_INVOICE') => { success: boolean; message: string };
  recordUdhariSettlement: (customerId: string, amount: number, method: 'PAYPAL' | 'BANK_TRANSFER' | 'UPI' | 'CASH') => void;

  // Copilot Actions
  sendCopilotMessage: (content: string) => Promise<void>;
  clearCopilotHistory: () => void;

  // Approvals Actions
  approveAndExecuteAction: (approvalId: string) => Promise<{
    success: boolean;
    executedTxnId: string;
    timestamp: string;
    proofBadge?: string;
    proofHashBadge?: string;
    executedAt?: string;
  }>;
  rejectApprovalAction: (approvalId: string, reason?: string) => void;

  // Team Sharing Actions
  generateSignedReport: (reportTitle: string, reportType: HashSignedReport['reportType']) => HashSignedReport;
  revokeSharedReport: (reportId: string) => void;

  // PayPal Settings Actions
  updatePayPalConfig: (updates: Partial<PayPalSandboxConfig>) => void;
  pingPayPalWebhook: () => Promise<{ success: boolean; latencyMs: number; status: string }>;
}

// ----------------------------------------------------------------------------
// Helper: Deep Clone Seed Data
// ----------------------------------------------------------------------------

function getPristineSeedClone() {
  if (typeof structuredClone === 'function') {
    return structuredClone(PRISTINE_DEMO_SEED_DATA);
  }
  return JSON.parse(JSON.stringify(PRISTINE_DEMO_SEED_DATA));
}

// ----------------------------------------------------------------------------
// Store Implementation
// ----------------------------------------------------------------------------

const initialData = getPristineSeedClone();

export const usePayPilotStore = create<PayPilotState>((set, get) => ({
  // Navigation & Shell
  activeRoute: 'command-center',
  explainabilityDrawer: {
    isOpen: false,
    activeRuleId: null,
    activeRecordId: null,
  },
  demoActStepper: {
    currentAct: 1,
    actLabels: ['Find Leaks', 'Prove Truth', 'Recover Funds', 'Protect Runway', 'Share Proof'],
    activeStepComplete: false,
  },

  // State slices initialized from pristine clone
  executiveKpis: initialData.executiveKpis,
  transitArcs: initialData.transitArcs,
  anomalyFeed: initialData.anomalyFeed,
  recoveryCases: initialData.recoveryCases,
  recoveryFunnelMetrics: initialData.recoveryFunnelMetrics,
  selectedRecoveryCaseId: null,
  reconciliationRecords: initialData.reconciliationRecords,
  reconciliationSummary: initialData.reconciliationSummary,
  truthGraphData: initialData.truthGraphData,
  selectedDiscrepancyId: null,
  commitments: initialData.commitments,
  minimumSafetyBuffer: 15000.00,
  lastFirewallEvaluation: null,
  digitalTwinMetrics: initialData.digitalTwinMetrics,
  timeScrubberOffsetDays: 0,
  simulationState: initialData.simulationState,
  survivalRadarState: initialData.survivalRadarState,
  udhariCustomers: initialData.udhariCustomers,
  udhariSummary: initialData.udhariSummary,
  copilotMessages: initialData.copilotMessages,
  copilotVerifiedContext: initialData.copilotVerifiedContext,
  isCopilotThinking: false,
  pendingApprovals: initialData.pendingApprovals,
  teamMembers: initialData.teamMembers,
  sharedReports: initialData.sharedReports,
  paypalConfig: initialData.paypalConfig,

  // --------------------------------------------------------------------------
  // ACTIONS IMPLEMENTATION
  // --------------------------------------------------------------------------

  setActiveRoute: (route: AppRoute) => {
    set({ activeRoute: route });
  },

  resetToDemoState: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('paypilot_demo_state_v1');
      }
      sandboxService.clearAuditTrail();

      const freshSeed = getPristineSeedClone();

      set({
        ...freshSeed,
        activeRoute: 'command-center',
        explainabilityDrawer: {
          isOpen: false,
          activeRuleId: null,
          activeRecordId: null,
        },
        demoActStepper: {
          currentAct: 1,
          actLabels: ['Find Leaks', 'Prove Truth', 'Recover Funds', 'Protect Runway', 'Share Proof'],
          activeStepComplete: false,
        },
        selectedRecoveryCaseId: null,
        selectedDiscrepancyId: null,
        minimumSafetyBuffer: 15000.00,
        lastFirewallEvaluation: null,
        timeScrubberOffsetDays: 0,
        isCopilotThinking: false,
      });

      return true;
    } catch (err) {
      console.error('Error in resetToDemoState:', err);
      return false;
    }
  },

  setDemoAct: (act: 1 | 2 | 3 | 4 | 5) => {
    set((state) => ({
      demoActStepper: {
        ...state.demoActStepper,
        currentAct: act,
        activeStepComplete: false,
      },
    }));
  },

  openExplainability: (ruleId: string, recordId?: string) => {
    const recoveryCase = get().recoveryCases.find((c) => c.explainability?.ruleId === ruleId || c.id === recordId);
    set({
      explainabilityDrawer: {
        isOpen: true,
        activeRuleId: ruleId,
        activeRecordId: recordId || null,
        ruleTitle: recoveryCase?.explainability?.ruleName || `Rule: ${ruleId}`,
        details: recoveryCase?.explainability,
      },
    });
  },

  closeExplainability: () => {
    set((state) => ({
      explainabilityDrawer: {
        ...state.explainabilityDrawer,
        isOpen: false,
        activeRuleId: null,
        activeRecordId: null,
      },
    }));
  },

  setSelectedRecoveryCaseId: (caseId: string | null) => {
    set({ selectedRecoveryCaseId: caseId });
  },

  executeSandboxClaim: async (caseId: string, notes?: string) => {
    const targetCase = get().recoveryCases.find((c) => c.id === caseId);
    if (!targetCase) {
      throw new Error(`Recovery case ${caseId} not found.`);
    }

    // 1. Transition case to CLAIM_SUBMITTED
    set((state) => ({
      recoveryCases: state.recoveryCases.map((c) =>
        c.id === caseId ? { ...c, status: 'CLAIM_SUBMITTED' as const } : c
      ),
    }));

    // 2. Call simulated PayPal Sandbox refund endpoint
    const { data } = await sandboxService.executeRefund({
      caseId,
      captureId: targetCase.paypalTransactionId || `TXN-${caseId}`,
      amount: targetCase.claimAmount,
      currency: targetCase.currency,
      noteToPayer: notes || `PayPilot Automated Recovery: ${targetCase.title}`,
      actor: 'PayPilot AI Copilot (Authorized)',
    });

    const recoveredAmt = targetCase.claimAmount;

    // 3. Complete recovery: transition to VERIFIED_RECOVERED, update balances
    set((state) => {
      const updatedCases = state.recoveryCases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: 'VERIFIED_RECOVERED' as const,
              actualRecoveredAmount: recoveredAmt,
              potentialRecoverableAmount: 0,
              auditTrail: [
                ...c.auditTrail,
                {
                  timestamp: data.create_time,
                  action: 'VERIFIED_RECOVERED',
                  actor: 'PayPal Sandbox REST v2',
                  details: `Refund capture ${data.id} confirmed for $${recoveredAmt.toFixed(2)}`,
                },
              ],
            }
          : c
      );

      // Recalculate Funnel Metrics
      const identifiedCount = updatedCases.length;
      const identifiedAmount = updatedCases.reduce((sum, c) => sum + (c.claimAmount || 0), 0);
      const submitted = updatedCases.filter((c) => c.status !== 'POTENTIAL_IDENTIFIED');
      const submittedAmount = submitted.reduce((sum, c) => sum + (c.claimAmount || 0), 0);
      const pending = updatedCases.filter((c) => c.status === 'PROVIDER_PENDING' || c.status === 'VERIFIED_RECOVERED');
      const pendingAmount = pending.reduce((sum, c) => sum + (c.claimAmount || 0), 0);
      const recovered = updatedCases.filter((c) => c.status === 'VERIFIED_RECOVERED');
      const recoveredAmount = recovered.reduce((sum, c) => sum + (c.actualRecoveredAmount || 0), 0);
      const conversionRatePct = identifiedAmount > 0 ? (recoveredAmount / identifiedAmount) * 100 : 0;

      // Update Executive KPIs and Available Cash
      const newCash = state.executiveKpis.totalAvailableCash + recoveredAmt;
      const newLost = Math.max(0, state.executiveKpis.identifiedLostRevenue - recoveredAmt);
      const newRunway = Math.round(newCash / 1515);

      return {
        recoveryCases: updatedCases,
        recoveryFunnelMetrics: {
          identifiedAmount,
          identifiedCount,
          submittedAmount,
          submittedCount: submitted.length,
          pendingAmount,
          pendingCount: pending.length,
          recoveredAmount,
          recoveredCount: recovered.length,
          conversionRatePct: Math.round(conversionRatePct * 10) / 10,
        },
        executiveKpis: {
          ...state.executiveKpis,
          totalAvailableCash: newCash,
          identifiedLostRevenue: newLost,
          financialRunwayDays: newRunway,
          activeRecoveryCasesCount: updatedCases.filter((c) => c.status !== 'VERIFIED_RECOVERED').length,
          lastUpdatedTimestamp: new Date().toISOString(),
        },
        digitalTwinMetrics: {
          ...state.digitalTwinMetrics,
          liquidity: {
            ...state.digitalTwinMetrics.liquidity,
            totalLiquidCash: newCash,
            paypalAvailableBalance: state.digitalTwinMetrics.liquidity.paypalAvailableBalance + recoveredAmt,
          },
          workingCapital: newCash - state.digitalTwinMetrics.liabilities.accountsPayableNext30Days,
          runwayDays: newRunway,
        },
      };
    });

    return {
      success: true,
      txnId: data.id,
      timestamp: data.create_time,
    };
  },

  batchClaimRecoveryCases: async (caseIds: string[]) => {
    let count = 0;
    let total = 0;

    for (const id of caseIds) {
      try {
        const c = get().recoveryCases.find((x) => x.id === id);
        if (c && c.status === 'POTENTIAL_IDENTIFIED') {
          await get().executeSandboxClaim(id);
          count++;
          total += c.claimAmount;
        }
      } catch (err) {
        console.error(`Batch claim failed for ${id}:`, err);
      }
    }

    return { processedCount: count, totalAmount: total };
  },

  setSelectedDiscrepancyId: (id: string | null) => {
    set({ selectedDiscrepancyId: id });
  },

  resolveDiscrepancy: (recordId: string, note?: string) => {
    set((state) => {
      const updated = state.reconciliationRecords.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'RECONCILED' as const,
              resolutionStatus: 'RESOLVED' as const,
              varianceAmount: 0,
              matchScore: 100,
            }
          : r
      );
      const unresolved = updated.filter((r) => r.status !== 'RECONCILED').length;
      const totalDisc = updated.reduce((sum, r) => sum + (r.varianceAmount || 0), 0);

      return {
        reconciliationRecords: updated,
        reconciliationSummary: {
          ...state.reconciliationSummary,
          totalDiscrepancyAmount: totalDisc,
          unresolvedCount: unresolved,
        },
        executiveKpis: {
          ...state.executiveKpis,
          reconciliationDiscrepanciesCount: unresolved,
        },
      };
    });
  },

  evaluateCommitmentOrder: (order: NewCommitmentInput): FirewallEvaluationResult => {
    const currentBuffer = get().executiveKpis.totalAvailableCash - get().minimumSafetyBuffer;
    const projectedLowest = currentBuffer - order.amount;
    const safe = projectedLowest >= 0;

    const result: FirewallEvaluationResult = {
      status: safe 
        ? 'APPROVED_SAFE' 
        : projectedLowest >= -5000 
          ? 'WARNING_BUFFER_TIGHT' 
          : 'CRITICAL_BUFFER_BREACH',
      safe,
      orderAmount: order.amount,
      currentBuffer,
      lowestProjectedBuffer: projectedLowest + get().minimumSafetyBuffer,
      breachDate: safe ? undefined : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      verdictHeadline: safe ? 'Order Cleared by Commitment Firewall' : 'Commitment Firewall Violation Detected',
      verdictExplanation: safe
        ? `Order of $${order.amount.toLocaleString()} preserves $${(projectedLowest + get().minimumSafetyBuffer).toLocaleString()} safety headroom above the $15,000 threshold.`
        : `Order of $${order.amount.toLocaleString()} would deplete liquidity below the mandatory $15,000 buffer (projected dip: $${(projectedLowest + get().minimumSafetyBuffer).toLocaleString()}).`,
      mitigationOptions: safe ? undefined : [
        'Renegotiate payment terms to NET_45 or NET_60',
        'Request 30% upfront deposit on customer pipeline contracts',
        'Accelerate Udhari collections via PayPal Invoicing',
      ],
    };

    set({ lastFirewallEvaluation: result });
    return result;
  },

  addCommitment: (newCommitment: CommitmentItem) => {
    set((state) => ({
      commitments: [newCommitment, ...state.commitments],
      executiveKpis: {
        ...state.executiveKpis,
        upcoming30DayCommitments: state.executiveKpis.upcoming30DayCommitments + newCommitment.pendingBalance,
      },
    }));
  },

  setTimeScrubberOffset: (days: number) => {
    const baseMetrics = PRISTINE_DEMO_SEED_DATA.digitalTwinMetrics;
    const burnPerDay = 1515;
    const projectedCash = Math.max(0, baseMetrics.liquidity.totalLiquidCash - days * (burnPerDay - 420));
    const projectedRunway = Math.max(0, Math.round(projectedCash / burnPerDay));

    set((state) => ({
      timeScrubberOffsetDays: days,
      digitalTwinMetrics: {
        ...state.digitalTwinMetrics,
        scrubDayOffset: days,
        runwayDays: projectedRunway,
        workingCapital: projectedCash - state.digitalTwinMetrics.liabilities.accountsPayableNext30Days,
        healthScore: Math.max(20, Math.min(100, Math.round(88 - days * 0.3))),
        dynamicPulseState: projectedCash < 25000 ? 'CRITICAL' : days > 60 ? 'CONTRACTING' : 'STABLE',
        orbColorHex: projectedCash < 25000 ? '#EF4444' : days > 60 ? '#F59E0B' : '#10B981',
      },
    }));
  },

  updateSimulationParameters: (params: Partial<SimulationParameters>) => {
    set((state) => {
      const mergedParams: SimulationParameters = {
        ...state.simulationState.parameters,
        ...params,
      };

      const recalculation = calculateCashFlowProjections(
        state.executiveKpis.totalAvailableCash,
        mergedParams,
        state.simulationState.safetyBufferThreshold
      );

      return {
        simulationState: {
          ...state.simulationState,
          parameters: mergedParams,
          dailyProjections: recalculation.dailyProjections,
          minimumCashPoint: recalculation.minimumCashPoint,
          projectedRunwayDays: recalculation.projectedRunwayDays,
          isBufferBreached: recalculation.isBufferBreached,
        },
      };
    });
  },

  setSimulationScenario: (scenario: 'BASELINE' | 'OPTIMISTIC' | 'CONSERVATIVE') => {
    set((state) => {
      let params = { ...state.simulationState.parameters };
      if (scenario === 'OPTIMISTIC') {
        params = { upfrontDepositPct: 50, customerPaymentDelayDays: 5, milestoneSplit: [50, 25, 25], milestonePreset: '50_50' };
      } else if (scenario === 'CONSERVATIVE') {
        params = { upfrontDepositPct: 10, customerPaymentDelayDays: 35, milestoneSplit: [10, 40, 50], milestonePreset: '100_DELIVERY' };
      } else {
        params = { upfrontDepositPct: 20, customerPaymentDelayDays: 15, milestoneSplit: [30, 40, 30], milestonePreset: '30_40_30' };
      }

      const recalculation = calculateCashFlowProjections(
        state.executiveKpis.totalAvailableCash,
        params,
        state.simulationState.safetyBufferThreshold
      );

      return {
        simulationState: {
          ...state.simulationState,
          selectedScenario: scenario,
          parameters: params,
          dailyProjections: recalculation.dailyProjections,
          minimumCashPoint: recalculation.minimumCashPoint,
          projectedRunwayDays: recalculation.projectedRunwayDays,
          isBufferBreached: recalculation.isBufferBreached,
        },
      };
    });
  },

  triggerStressTest: (scenarioId: string) => {
    set((state) => {
      const shock = state.survivalRadarState.stressScenarios.find((s) => s.id === scenarioId);
      if (!shock) return state;

      return {
        survivalRadarState: {
          ...state.survivalRadarState,
          activeStressTestId: scenarioId,
          overallSurvivalIndex: shock.simulatedHealthScore,
        },
      };
    });
  },

  clearStressTest: () => {
    set((state) => ({
      survivalRadarState: {
        ...state.survivalRadarState,
        activeStressTestId: null,
        overallSurvivalIndex: 84,
      },
    }));
  },

  sendUdhariReminder: (customerId: string, channel: 'WHATSAPP' | 'EMAIL' | 'PAYPAL_INVOICE') => {
    let customerName = 'Customer';
    let balance = 0;

    set((state) => {
      const updated = state.udhariCustomers.map((cust) => {
        if (cust.id === customerId) {
          customerName = cust.customerName;
          balance = cust.outstandingBalance;
          return {
            ...cust,
            remindersCount: cust.remindersCount + 1,
            lastReminderDate: new Date().toISOString().split('T')[0],
            lastReminderChannel: channel,
          };
        }
        return cust;
      });

      return { udhariCustomers: updated };
    });

    return {
      success: true,
      message: `Reminder sent to ${customerName} for $${balance.toFixed(2)} via ${channel}.`,
    };
  },

  recordUdhariSettlement: (customerId: string, amount: number, method: 'PAYPAL' | 'BANK_TRANSFER' | 'UPI' | 'CASH') => {
    set((state) => {
      const updated = state.udhariCustomers.map((cust) => {
        if (cust.id === customerId) {
          const newBal = Math.max(0, cust.outstandingBalance - amount);
          return {
            ...cust,
            outstandingBalance: newBal,
            totalRepaid: cust.totalRepaid + amount,
            repaymentHistory: [
              ...cust.repaymentHistory,
              {
                id: `REP-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount,
                method,
                notes: 'Settled via PayPilot Udhari interface',
              },
            ],
          };
        }
        return cust;
      });

      const totalOutstanding = updated.reduce((sum, c) => sum + c.outstandingBalance, 0);
      const newCash = state.executiveKpis.totalAvailableCash + amount;

      return {
        udhariCustomers: updated,
        udhariSummary: {
          ...state.udhariSummary,
          totalOutstandingCredit: totalOutstanding,
          recoveredThisMonth: state.udhariSummary.recoveredThisMonth + amount,
        },
        executiveKpis: {
          ...state.executiveKpis,
          totalAvailableCash: newCash,
        },
      };
    });
  },

  sendCopilotMessage: async (content: string) => {
    const userMsg: CopilotMessage = {
      id: `COP-USER-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toISOString(),
      content,
    };

    set((state) => ({
      copilotMessages: [...state.copilotMessages, userMsg],
      isCopilotThinking: true,
    }));

    // Simulate AI thinking latency
    await new Promise((r) => setTimeout(r, 600));

    const currentState = get();
    const lower = content.toLowerCase();

    let replyText = `I have verified your query against ground-truth data. Current available cash is **$${currentState.executiveKpis.totalAvailableCash.toLocaleString()}** with **${currentState.executiveKpis.financialRunwayDays} days runway**.`;
    let citations: CopilotEvidenceCitation[] = [
      {
        recordId: 'REC-101',
        entityType: 'RECOVERY_CASE',
        title: 'Verified Financial Context',
        snippet: `Current cash: $${currentState.executiveKpis.totalAvailableCash.toLocaleString()} with ${currentState.executiveKpis.financialRunwayDays} days runway.`,
      },
    ];

    if (
      lower.includes('recover') ||
      lower.includes('rec-101') ||
      lower.includes('leak') ||
      lower.includes('fee') ||
      lower.includes('duplicate')
    ) {
      replyText = `**Case REC-101** represents **$1,420.00** in duplicate processing fees on Black Friday Batch #9812. Ground truth indicates PayPal assessed $2,840 against a contracted ceiling of $1,420. You can approve the recovery filing in the Approvals queue.`;
      citations = [
        {
          recordId: 'REC-101',
          entityType: 'RECOVERY_CASE',
          title: 'Case REC-101: Duplicate Fee Assessment ($1,420)',
          snippet: 'Detection Rule RULE-DUP-FEE-02 flagged duplicate fee assessment within 140ms on Black Friday batch settlement.',
        },
      ];
    } else if (
      lower.includes('udhari') ||
      lower.includes('debt') ||
      lower.includes('credit') ||
      lower.includes('overdue')
    ) {
      replyText = `Total outstanding customer credit in Udhari Ledger is **$${currentState.udhariSummary.totalOutstandingCredit.toLocaleString()}**. Marcus Sterling has an overdue balance of $4,200 (19 days overdue).`;
      citations = [
        {
          recordId: 'UDH-101',
          entityType: 'UDHARI_ACCOUNT',
          title: 'Udhari Ledger: Marcus Sterling Overdue Credit ($4,200)',
          snippet: `Customer Marcus Sterling (Acme Industrial Robotics) has $4,200 outstanding across 19 days overdue. Bound by credit policy RULE-UDHARI-LIMIT-01.`,
        },
      ];
    } else if (
      lower.includes('runway') ||
      lower.includes('cash') ||
      lower.includes('burn') ||
      lower.includes('buffer') ||
      lower.includes('safety')
    ) {
      replyText = `Your cash runway is **${currentState.executiveKpis.financialRunwayDays} days** based on an average net daily burn of $1,515. The Commitment Firewall is actively enforcing your $15,000 minimum safety buffer.`;
      citations = [
        {
          recordId: 'KPI-RUNWAY',
          entityType: 'COMMITMENT',
          title: 'Executive KPI: Financial Runway & Commitment Firewall',
          snippet: `Runway: ${currentState.executiveKpis.financialRunwayDays} days. Available liquid cash: $${currentState.executiveKpis.totalAvailableCash.toLocaleString()}. Policy enforces $15,000 minimum buffer floor.`,
        },
      ];
    }

    const aiMsg: CopilotMessage = {
      id: `COP-AI-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      content: replyText,
      citations,
    };

    set((state) => ({
      copilotMessages: [...state.copilotMessages, aiMsg],
      isCopilotThinking: false,
    }));
  },

  clearCopilotHistory: () => {
    set({ copilotMessages: PRISTINE_DEMO_SEED_DATA.copilotMessages });
  },

  approveAndExecuteAction: async (approvalId: string) => {
    const item = get().pendingApprovals.find((a) => a.id === approvalId);
    if (!item) {
      throw new Error(`Approval request ${approvalId} not found.`);
    }

    const { data } = await sandboxService.executeRefund({
      caseId: item.targetEntityId,
      captureId: `CAP-${item.id}`,
      amount: item.amount,
      currency: item.currency,
      noteToPayer: `Approved via PayPilot Governed Action ${item.requestNumber}`,
      actor: 'Owner (Sarah Connor)',
    });

    // If target entity is a recovery case, update it
    if (item.targetEntityId.startsWith('REC-')) {
      const rc = get().recoveryCases.find((c) => c.id === item.targetEntityId);
      if (rc && rc.status !== 'VERIFIED_RECOVERED') {
        await get().executeSandboxClaim(item.targetEntityId);
      }
    }

    const proofHash = pureJsSha256(
      JSON.stringify({
        approvalId,
        txnId: data.id,
        timestamp: data.create_time,
      })
    );
    const proofBadge = formatSignatureBadge(proofHash);
    const receipt = {
      success: true,
      executedTxnId: data.id,
      timestamp: data.create_time,
      proofBadge,
      proofHashBadge: proofBadge,
      executedAt: data.create_time,
    };

    set((state) => ({
      pendingApprovals: state.pendingApprovals.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'EXECUTED_SANDBOX' as const,
              executedTxnId: data.id,
              executedTimestamp: data.create_time,
              executedProofBadge: receipt.proofHashBadge,
              executedAt: receipt.executedAt,
            }
          : a
      ),
      executiveKpis: {
        ...state.executiveKpis,
        pendingApprovalsCount: Math.max(0, state.executiveKpis.pendingApprovalsCount - 1),
      },
    }));

    return receipt;
  },

  rejectApprovalAction: (approvalId: string, reason?: string) => {
    set((state) => ({
      pendingApprovals: state.pendingApprovals.map((a) =>
        a.id === approvalId ? { ...a, status: 'REJECTED' as const } : a
      ),
      executiveKpis: {
        ...state.executiveKpis,
        pendingApprovalsCount: Math.max(0, state.executiveKpis.pendingApprovalsCount - 1),
      },
    }));
  },

  generateSignedReport: (reportTitle: string, reportType: HashSignedReport['reportType']) => {
    const state = get();
    const id = `REP-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const expires = new Date(now.getTime() + 72 * 3600000);

    const reportData = {
      id,
      reportTitle,
      reportType,
      createdAt: now.toISOString(),
      cashBalance: state.executiveKpis.totalAvailableCash,
      recoveredAmount: state.recoveryFunnelMetrics.recoveredAmount,
      runwayDays: state.executiveKpis.financialRunwayDays,
      verifiedLedgerEntries: state.recoveryCases.length,
    };

    // Deterministically serialize with recursive key sorting to guarantee canonical hashing
    const canonicalJson = canonicalStringify(reportData);
    // Cryptographically compute genuine FIPS PUB 180-2 compliant 64-char lowercase hex SHA-256
    const realSha256 = pureJsSha256(canonicalJson);

    const newReport: HashSignedReport = {
      id,
      reportTitle,
      reportType,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      accessCount: 0,
      isPasswordProtected: false,
      revoked: false,
      canonicalJsonPayload: canonicalJson,
      sha256ProofHash: realSha256,
      signerKeyId: 'KEY-ED25519-PAYPILOT-01',
      verificationBadgeLabel: formatSignatureBadge(realSha256),
      scopedShareUrl: `https://paypilot.app/share/${id.toLowerCase()}?sig=${realSha256.slice(0, 8)}`,
    };

    set((s) => ({
      sharedReports: [newReport, ...s.sharedReports],
    }));

    return newReport;
  },

  revokeSharedReport: (reportId: string) => {
    set((state) => ({
      sharedReports: state.sharedReports.map((r) =>
        r.id === reportId ? { ...r, revoked: true } : r
      ),
    }));
  },

  updatePayPalConfig: (updates: Partial<PayPalSandboxConfig>) => {
    set((state) => ({
      paypalConfig: { ...state.paypalConfig, ...updates },
    }));
  },

  pingPayPalWebhook: async () => {
    const config = get().paypalConfig;
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 200));
    const latency = Math.round(performance.now() - start);

    set((state) => ({
      paypalConfig: {
        ...state.paypalConfig,
        lastPingTimestamp: new Date().toISOString(),
      },
    }));

    return {
      success: true,
      latencyMs: latency,
      status: config.connectionStatus,
    };
  },
}));

export default usePayPilotStore;
