// ============================================================================
// PAYPILOT UNIFIED TYPE DEFINITIONS
// File: frontend/src/types/index.ts
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Core Navigation & Common Types
// ----------------------------------------------------------------------------

export type AppRoute =
  | 'command-center'
  | 'payback-hunter'
  | 'payment-truth'
  | 'commitments'
  | 'digital-twin'
  | 'simulation-lab'
  | 'survival-radar'
  | 'udhari-ledger'
  | 'copilot'
  | 'approvals'
  | 'team-sharing'
  | 'sponsor-integrations'
  | 'settings';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'INR';

export interface CurrencyAmount {
  value: number;
  currency: CurrencyCode;
  formatted?: string;
}

// ----------------------------------------------------------------------------
// 2. Module 1: Command Center & Executive Overview
// ----------------------------------------------------------------------------

export interface ExecutiveKpiSummary {
  totalAvailableCash: number;         // e.g. $142,500.00
  identifiedLostRevenue: number;      // e.g. $18,450.00
  upcoming30DayCommitments: number;   // e.g. $43,200.00
  financialRunwayDays: number;        // e.g. 94 days
  financialHealthScore: number;       // 0 - 100 (e.g. 88)
  activeRecoveryCasesCount: number;   // e.g. 12
  reconciliationDiscrepanciesCount: number; // e.g. 4
  pendingApprovalsCount: number;      // e.g. 3
  lastUpdatedTimestamp: string;
}

export interface MonetaryTransitArc {
  id: string;
  sourceCity: string;
  sourceCoords: [number, number];     // [lat, lng]
  destCity: string;
  destCoords: [number, number];       // [lat, lng]
  amount: number;
  currency: CurrencyCode;
  type: 'PAYPAL_INFLOW' | 'SUPPLIER_OUTFLOW' | 'RECOVERY_CREDIT' | 'DISPUTE_HOLD';
  timestamp: string;
}

export interface AnomalyFeedItem {
  id: string;
  timestamp: string;
  type: 'RECOVERY_DETECTED' | 'DISCREPANCY_FLAGGED' | 'FIREWALL_BLOCKED' | 'PAYPAL_REFUND_EXECUTED' | 'UDHARI_REMINDER_SENT';
  title: string;
  description: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  actionRoute?: AppRoute;
  actionLabel?: string;
  entityId?: string;
}

// ----------------------------------------------------------------------------
// 3. Module 2: PayBack Hunter / Recovery Inbox & 4-Stage Funnel
// ----------------------------------------------------------------------------

export type RecoveryCategory =
  | 'DUPLICATE_PROCESSING_FEE'
  | 'UNAPPLIED_REFUND_CREDIT'
  | 'FX_SPREAD_LEAKAGE'
  | 'DISPUTE_CHARGEBACK_HOLD'
  | 'SUBSCRIPTION_OVERBILLING'
  | 'TIER_MISMATCH_SURCHARGE';

export type RecoveryFunnelStage =
  | 'POTENTIAL_IDENTIFIED'
  | 'CLAIM_SUBMITTED'
  | 'PROVIDER_PENDING'
  | 'VERIFIED_RECOVERED';

export interface LinkedSourceRecord {
  recordType: 'PAYPAL_TRANSACTION' | 'BANK_STATEMENT' | 'VENDOR_INVOICE' | 'DISPUTE_CASE';
  recordId: string;
  referenceNumber: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
  snippet: string;
  rawPayload?: Record<string, any>;
}

export interface ExplainabilityDetails {
  ruleId: string;
  ruleName: string;
  detectionFormula: string;
  explanationSummary: string;
  sourceRecords: LinkedSourceRecord[];
  rawPayPalPayload: Record<string, any>;
  confidenceScore: number;            // 0 - 100 (e.g. 98)
  categoryBadge: string;
}

export interface RecoveryAuditLogEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface RecoveryCase {
  id: string;                         // e.g. "REC-101"
  caseNumber: string;                 // e.g. "REC-2024-8841"
  title: string;
  provider: 'PayPal' | 'Stripe' | 'Chase' | 'Amex';
  category: RecoveryCategory;
  dateDetected: string;
  claimAmount: number;
  currency: CurrencyCode;
  confidenceScore: number;            // 0 - 100
  status: RecoveryFunnelStage;
  potentialRecoverableAmount: number;
  actualRecoveredAmount: number;
  paypalTransactionId?: string;
  paypalDisputeId?: string;
  explainability: ExplainabilityDetails;
  auditTrail: RecoveryAuditLogEntry[];
}

export interface RecoveryFunnelMetrics {
  identifiedAmount: number;           // e.g. $18,450.00
  identifiedCount: number;            // e.g. 12
  submittedAmount: number;            // e.g. $12,100.00
  submittedCount: number;             // e.g. 7
  pendingAmount: number;              // e.g. $7,500.00
  pendingCount: number;               // e.g. 4
  recoveredAmount: number;            // e.g. $4,200.00
  recoveredCount: number;             // e.g. 2
  conversionRatePct: number;          // e.g. 22.8%
}

// ----------------------------------------------------------------------------
// 4. Module 3: Money Map & Payment Truth (3-Way Reconciliation & 3D Node Graph)
// ----------------------------------------------------------------------------

export type TruthMatchStatus = 'RECONCILED' | 'DISCREPANCY_DETECTED' | 'INVESTIGATING';

export type DiscrepancyCategory =
  | 'TIMING_LAG'
  | 'DUPLICATE_FEE'
  | 'FX_MISMATCH'
  | 'MISSING_DEPOSIT'
  | 'UNREPORTED_HOLD';

export interface PayPalTransactionRecord {
  transactionId: string;              // e.g. "9XY8472910482910M"
  timestamp: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: CurrencyCode;
  payerName: string;
  payerEmail: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'HELD';
  captureMethod: 'API_CHECKOUT' | 'INVOICE' | 'SUBSCRIPTION';
  rawPayload: Record<string, any>;
}

export interface BankStatementRecord {
  bankReferenceId: string;
  bankName: string;
  clearingDate: string;
  depositAmount: number;
  currency: CurrencyCode;
  description: string;
}

export interface AccountingLedgerRecord {
  ledgerEntryId: string;
  accountCode: string;
  invoiceId: string;
  customerName: string;
  bookedAmount: number;
  bookedDate: string;
}

export interface TruthDiscrepancyRule {
  ruleId: string;
  ruleName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deltaAmount: number;
  description: string;
  recommendedAction: string;
}

export interface ReconciliationRecord {
  id: string;                         // e.g. "REC-TRUTH-101"
  reconciliationKey: string;          // e.g. "REC-3WAY-2024-1092"
  date: string;
  status: TruthMatchStatus;
  paypalRecord?: PayPalTransactionRecord;
  bankRecord?: BankStatementRecord;
  ledgerRecord?: AccountingLedgerRecord;
  varianceAmount: number;
  matchScore: number;                 // 0 - 100
  category: DiscrepancyCategory;
  discrepancies: TruthDiscrepancyRule[];
  resolutionStatus: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'AUTO_ADJUSTED';
  explainabilityRuleId?: string;
}

export interface TruthGraphNode {
  id: string;
  label: string;
  type: 'PAYPAL_TX' | 'BANK_DEPOSIT' | 'INVOICE' | 'CUSTOMER' | 'DISCREPANCY_ALERT';
  amount?: number;
  status: 'MATCHED' | 'DISCREPANT' | 'PENDING';
  position3D?: [number, number, number];
  metadata: Record<string, any>;
}

export interface TruthGraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  status: 'VERIFIED' | 'DISCREPANT' | 'IN_TRANSIT';
  flowSpeed: number;                  // For 3D flow particle velocity
}

export interface TruthGraphData {
  nodes: TruthGraphNode[];
  edges: TruthGraphEdge[];
}

export interface ReconciliationSummary {
  totalReconciledVolume: number;      // e.g. $542,000.00
  totalDiscrepancyAmount: number;     // e.g. $3,840.00
  autoMatchPrecisionPct: number;      // e.g. 99.4%
  unresolvedCount: number;            // e.g. 4
}

// ----------------------------------------------------------------------------
// 5. Module 4: Commitments, Commitment Workbench Gantt & Firewall
// ----------------------------------------------------------------------------

export type CommitmentCategory =
  | 'PAYROLL'
  | 'SUPPLIER_INVENTORY'
  | 'SAAS_TOOLS'
  | 'TAX_ESTIMATES'
  | 'OFFICE_RENT'
  | 'DEBT_SERVICE';

export type CommitmentFirewallStatus =
  | 'APPROVED_SAFE'
  | 'WARNING_BUFFER_TIGHT'
  | 'CRITICAL_BUFFER_BREACH';

export interface CommitmentMilestone {
  id: string;
  name: string;
  dueDate: string;
  percentageSplit: number;            // e.g. 40%
  amount: number;
  isPaid: boolean;
}

export interface CommitmentItem {
  id: string;                         // e.g. "CMT-101"
  referenceNumber: string;            // e.g. "PO-2024-918"
  title: string;
  counterparty: string;
  category: CommitmentCategory;
  startDate: string;
  dueDate: string;
  totalCommittedAmount: number;
  amountPaidToDate: number;
  pendingBalance: number;
  paymentTerms: 'DUE_ON_RECEIPT' | 'NET_15' | 'NET_30' | 'NET_60' | 'MILESTONE';
  milestones: CommitmentMilestone[];
  firewallStatus: CommitmentFirewallStatus;
  firewallVerdict: {
    safe: boolean;
    lowestProjectedBuffer: number;
    breachDate?: string;
    explanation: string;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface NewCommitmentInput {
  vendorName: string;
  amount: number;
  category: CommitmentCategory;
  paymentTerms: 'DUE_ON_RECEIPT' | 'NET_15' | 'NET_30' | 'NET_60';
  targetDate: string;
}

export interface FirewallEvaluationResult {
  status: CommitmentFirewallStatus;
  safe: boolean;
  orderAmount: number;
  currentBuffer: number;
  lowestProjectedBuffer: number;
  breachDate?: string;
  verdictHeadline: string;
  verdictExplanation: string;
  mitigationOptions?: string[];
}

// ----------------------------------------------------------------------------
// 6. Module 5: Financial Digital Twin & Time Scrubber
// ----------------------------------------------------------------------------

export interface DigitalTwinLiquidity {
  totalLiquidCash: number;            // $142,500.00
  paypalAvailableBalance: number;     // $68,400.00
  paypalPendingHoldBalance: number;   // $12,500.00
  bankOperatingChecking: number;      // $58,100.00
  emergencyReserveSavings: number;    // $16,000.00
  receivablesDueNext30Days: number;   // $38,400.00
}

export interface DigitalTwinLiabilities {
  accountsPayableNext30Days: number;  // $43,200.00
  committedSupplierObligations: number;// $22,500.00
  scheduledTaxProvisions: number;     // $8,400.00
  recurringSoftwareBurn: number;      // $4,300.00
}

export interface DigitalTwinMetrics {
  scrubDayOffset: number;             // 0 to 180 (time scrubbing position)
  timestamp: string;
  liquidity: DigitalTwinLiquidity;
  liabilities: DigitalTwinLiabilities;
  workingCapital: number;             // Assets - Liabilities (e.g. $99,300.00)
  quickRatio: number;                 // (Cash + AR) / Current Liabilities (e.g. 1.82)
  currentRatio: number;               // Current Assets / Current Liabilities (e.g. 2.14)
  dailyBurnRate: number;              // e.g. $1,515.00 / day
  netDailyCashFlow: number;           // Inflows - Outflows (e.g. +$420/day)
  runwayDays: number;                 // e.g. 94 days
  healthScore: number;                // 0 - 100 (e.g. 88)
  dynamicPulseState: 'EXPANDING' | 'STABLE' | 'CONTRACTING' | 'CRITICAL';
  orbColorHex: string;                // e.g. "#10B981" (Emerald) or "#EF4444" (Crimson)
  pulseFrequencyHz: number;           // For Three.js orb pulsing speed
}

// ----------------------------------------------------------------------------
// 7. Module 6: Simulation Lab & Cash-Flow Time Machine
// ----------------------------------------------------------------------------

export type MilestonePreset = '30_40_30' | '50_50' | '100_DELIVERY';

export interface SimulationParameters {
  upfrontDepositPct: number;          // 0% - 100% (Default: 20%)
  customerPaymentDelayDays: number;   // 0 - 60 Days (Default: 15 Days)
  milestoneSplit: [number, number, number]; // [deposit%, mid%, final%] e.g. [30, 40, 30]
  milestonePreset: MilestonePreset;
}

export interface DailyCashProjectionPoint {
  dayIndex: number;                   // 0 to 90
  date: string;                       // YYYY-MM-DD
  startingBalance: number;
  inFlow: number;
  outFlow: number;
  netCash: number;
  balance: number;                    // projected cash balance
  isBreached: boolean;                // true if balance < minimumBuffer ($15,000)
  breachSeverity?: 'NONE' | 'TIGHT' | 'CRITICAL';
}

export interface SimulationScenarioComparison {
  baselineEndingCash: number;
  optimisticEndingCash: number;
  conservativeEndingCash: number;
  baselineLowestDip: { amount: number; date: string };
  optimisticLowestDip: { amount: number; date: string };
  conservativeLowestDip: { amount: number; date: string };
  baselineRunwayDays: number;
  optimisticRunwayDays: number;
  conservativeRunwayDays: number;
}

export interface SimulationLabState {
  parameters: SimulationParameters;
  safetyBufferThreshold: number;      // Fixed at $15,000.00
  dailyProjections: DailyCashProjectionPoint[]; // 91 points (day 0 to 90)
  minimumCashPoint: { amount: number; dayIndex: number; date: string };
  projectedRunwayDays: number;
  isBufferBreached: boolean;
  selectedScenario: 'BASELINE' | 'OPTIMISTIC' | 'CONSERVATIVE';
  comparison: SimulationScenarioComparison;
}

// ----------------------------------------------------------------------------
// 8. Module 7: Business Survival Radar & Stress Testing
// ----------------------------------------------------------------------------

export interface RadarDimensionScore {
  key: string;
  name: string;
  score: number;                       // 0 - 100 (higher = safer)
  industryBenchmark: number;
  status: 'EXCELLENT' | 'ADEQUATE' | 'VULNERABLE' | 'CRITICAL';
  metricValueText: string;             // e.g. "Top client = 38% revenue"
  riskFactorSummary: string;
}

export interface StressTestScenario {
  id: string;                         // e.g. "SHOCK-01"
  title: string;
  description: string;
  appliedShock: string;
  immediateCashImpact: number;         // e.g. -$25,000.00
  runwayReductionDays: number;         // e.g. -24 days
  simulatedHealthScore: number;
  verdict: 'RESILIENT' | 'MODERATE_STRESS' | 'CRITICAL_INSOLVENCY';
  actionPlaybook: string[];
}

export interface BusinessSurvivalRadarState {
  overallSurvivalIndex: number;        // 0 - 100 (e.g. 84)
  dimensions: RadarDimensionScore[];
  stressScenarios: StressTestScenario[];
  activeStressTestId: string | null;
}

// ----------------------------------------------------------------------------
// 9. Module 8: Udhari Ledger (Customer Credit & Aging)
// ----------------------------------------------------------------------------

export type AgingBucket = '0_15_DAYS' | '16_30_DAYS' | '31_60_DAYS' | '60_PLUS_DAYS';

export interface UdhariRepaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'PAYPAL' | 'BANK_TRANSFER' | 'UPI' | 'CASH';
  referenceTransactionId?: string;
  notes?: string;
}

export interface UdhariCustomer {
  id: string;                         // e.g. "UDH-201"
  customerCode: string;               // e.g. "CUST-ACME"
  customerName: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  creditLimit: number;
  totalCreditGiven: number;
  totalRepaid: number;
  outstandingBalance: number;
  dueDate: string;
  daysOverdue: number;
  agingBucket: AgingBucket;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  trustScore: number;                 // 0 - 100
  lastPaymentDate?: string;
  lastReminderDate?: string;
  lastReminderChannel?: 'WHATSAPP' | 'EMAIL' | 'PAYPAL_INVOICE';
  remindersCount: number;
  repaymentHistory: UdhariRepaymentRecord[];
}

export interface UdhariLedgerSummary {
  totalOutstandingCredit: number;     // $16,800.00
  overdueAbove30Days: number;         // $6,450.00
  recoveredThisMonth: number;         // $9,200.00
  averageCollectionDays: number;      // 14 Days
  agingBucketDistribution: {
    bucket0to15: { amount: number; percentage: number };
    bucket16to30: { amount: number; percentage: number };
    bucket31to60: { amount: number; percentage: number };
    bucket60Plus: { amount: number; percentage: number };
  };
}

// ----------------------------------------------------------------------------
// 10. Module 9: Copilot / Agent Workspace
// ----------------------------------------------------------------------------

export interface CopilotEvidenceCitation {
  recordId: string;
  entityType: 'RECOVERY_CASE' | 'PAYPAL_TX' | 'COMMITMENT' | 'UDHARI_ACCOUNT';
  title: string;
  snippet: string;
}

export interface CopilotToolAction {
  actionId: string;
  actionType: 'NAVIGATE' | 'OPEN_EXPLAIN' | 'STAGE_CLAIM' | 'RUN_SIMULATION';
  label: string;
  payload: Record<string, any>;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  content: string;
  citations?: CopilotEvidenceCitation[];
  actions?: CopilotToolAction[];
}

export interface CopilotVerifiedContext {
  availableCash: number;
  identifiedRecoveries: number;
  unpaidUdhari: number;
  activeDiscrepanciesCount: number;
  paypalSandboxStatus: 'CONNECTED' | 'DISCONNECTED';
}

// ----------------------------------------------------------------------------
// 11. Module 10: Approvals & Governed Actions
// ----------------------------------------------------------------------------

export type ApprovalActionType =
  | 'PAYPAL_REFUND_EXECUTE'
  | 'PAYPAL_DISPUTE_SUBMIT'
  | 'SUPPLIER_PAYMENT_RELEASE'
  | 'UDHARI_SETTLEMENT_RECORD'
  | 'COMMITMENT_OVERRIDE';

export interface PayPalApiBlueprint {
  httpMethod: 'POST' | 'PUT' | 'PATCH';
  endpointPath: string;               // e.g. "/v1/customer-disputes"
  idempotencyKey: string;             // UUID v4
  headers: Record<string, string>;
  requestBody: Record<string, any>;
}

export interface ApprovalRequest {
  id: string;                         // e.g. "APR-9941"
  requestNumber: string;              // e.g. "DISP-9941"
  title: string;
  description: string;
  actionType: ApprovalActionType;
  targetEntityId: string;             // e.g. Case "REC-101"
  amount: number;
  currency: CurrencyCode;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  requestedAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'EXECUTED_SANDBOX' | 'REJECTED';
  beforeStateSnapshot: Record<string, any>;
  afterStateSnapshot: Record<string, any>;
  paypalApiBlueprint: PayPalApiBlueprint;
  executedTxnId?: string;
  executedTimestamp?: string;
  executedProofBadge?: string;
  executedAt?: string;
}

// ----------------------------------------------------------------------------
// 12. Module 11: Team & Cryptographic Secure Sharing
// ----------------------------------------------------------------------------

export type TeamUserRole = 'OWNER' | 'FINANCE_MANAGER' | 'EXTERNAL_ACCOUNTANT' | 'AUDITOR';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamUserRole;
  avatarUrl?: string;
  permissions: {
    canExecutePayPalClaims: boolean;
    canViewRawFinancials: boolean;
    canExportReports: boolean;
  };
  lastActive: string;
}

export interface HashSignedReport {
  id: string;                         // e.g. "REP-7F83"
  reportTitle: string;
  reportType: 'RECOVERY_AUDIT_PROOF' | 'PAYMENT_TRUTH_PACK' | '90DAY_CASH_FLOW_FORECAST';
  createdAt: string;
  expiresAt: string;
  accessCount: number;
  isPasswordProtected: boolean;
  revoked: boolean;
  canonicalJsonPayload: string;
  sha256ProofHash: string;            // e.g. "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
  signerKeyId: string;
  verificationBadgeLabel: string;     // e.g. "Verified by PayPilot Cryptographic Ledger"
  scopedShareUrl: string;
}

// ----------------------------------------------------------------------------
// 13. Module 12: Integrations & PayPal Sandbox Settings
// ----------------------------------------------------------------------------

export interface PayPalSimulatorToggles {
  simulateApiLatencyMs: number;        // Default: 800ms
  simulateNetworkErrorRatePct: number; // Default: 0%
  autoCreditReserveOnDispute: boolean; // Default: true
}

export interface PayPalSandboxConfig {
  clientId: string;                   // "sb-client-paypilot-hackathon-2024"
  clientSecretMasked: string;         // "••••••••••••••••"
  environment: 'SANDBOX' | 'LIVE';
  connectionStatus: 'CONNECTED_SANDBOX' | 'DISCONNECTED';
  apiVersion: string;                 // "v2"
  webhookId: string;                  // "WH-99214-PAYPILOT"
  webhookUrl: string;
  lastPingTimestamp: string;
  simulatorToggles: PayPalSimulatorToggles;
}

// ----------------------------------------------------------------------------
// 14. Global Drawer, Stepper & Three.js Controller Interfaces
// ----------------------------------------------------------------------------

export interface ExplainabilityDrawerState {
  isOpen: boolean;
  activeRuleId: string | null;
  activeRecordId: string | null;
  ruleTitle?: string;
  details?: ExplainabilityDetails;
}

export interface DemoActStepperState {
  currentAct: 1 | 2 | 3 | 4 | 5;      // 1: Find, 2: Prove, 3: Recover, 4: Protect, 5: Share
  actLabels: string[];
  activeStepComplete: boolean;
}

export interface ThreeSceneController<T = any> {
  init(container: HTMLElement, width: number, height: number): void;
  updateData?(data: T): void;
  resize(width: number, height: number): void;
  onPointerMove?(normalizedX: number, normalizedY: number, event: PointerEvent): void;
  onPointerClick?(normalizedX: number, normalizedY: number, event: PointerEvent): void;
  destroy(): void;
}
