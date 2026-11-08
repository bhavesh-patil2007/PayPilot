// ============================================================================
// PAYPILOT DETERMINISTIC DEMO SEED DATA FIXTURES
// File: frontend/src/store/demoSeedData.ts
// ============================================================================

import {
  ExecutiveKpiSummary,
  MonetaryTransitArc,
  AnomalyFeedItem,
  RecoveryCase,
  RecoveryFunnelMetrics,
  ReconciliationRecord,
  TruthGraphData,
  ReconciliationSummary,
  CommitmentItem,
  DigitalTwinMetrics,
  SimulationLabState,
  BusinessSurvivalRadarState,
  UdhariCustomer,
  UdhariLedgerSummary,
  CopilotMessage,
  CopilotVerifiedContext,
  ApprovalRequest,
  TeamMember,
  HashSignedReport,
  PayPalSandboxConfig,
  DailyCashProjectionPoint,
} from '../types';

// ----------------------------------------------------------------------------
// 1. Executive KPIs (Master Balance Sheet)
// ----------------------------------------------------------------------------

export const SEED_EXECUTIVE_KPIS: ExecutiveKpiSummary = {
  totalAvailableCash: 142500.00,
  identifiedLostRevenue: 18450.00,
  upcoming30DayCommitments: 43200.00,
  financialRunwayDays: 94,
  financialHealthScore: 88,
  activeRecoveryCasesCount: 12,
  reconciliationDiscrepanciesCount: 4,
  pendingApprovalsCount: 3,
  lastUpdatedTimestamp: '2024-11-06T14:30:00Z',
};

// ----------------------------------------------------------------------------
// 2. Monetary Transit Arcs (3D Globe Visualization)
// ----------------------------------------------------------------------------

export const SEED_TRANSIT_ARCS: MonetaryTransitArc[] = [
  {
    id: 'ARC-1',
    sourceCity: 'San Jose, CA',
    sourceCoords: [37.3382, -121.8863],
    destCity: 'London, UK',
    destCoords: [51.5074, -0.1278],
    amount: 14200.00,
    currency: 'USD',
    type: 'PAYPAL_INFLOW',
    timestamp: '2024-11-06T12:00:00Z',
  },
  {
    id: 'ARC-2',
    sourceCity: 'Berlin, DE',
    sourceCoords: [52.5200, 13.4050],
    destCity: 'New York, NY',
    destCoords: [40.7128, -74.0060],
    amount: 8650.00,
    currency: 'USD',
    type: 'PAYPAL_INFLOW',
    timestamp: '2024-11-06T12:15:00Z',
  },
  {
    id: 'ARC-3',
    sourceCity: 'Singapore',
    sourceCoords: [1.3521, 103.8198],
    destCity: 'San Jose, CA',
    destCoords: [37.3382, -121.8863],
    amount: 22500.00,
    currency: 'USD',
    type: 'SUPPLIER_OUTFLOW',
    timestamp: '2024-11-06T12:30:00Z',
  },
  {
    id: 'ARC-4',
    sourceCity: 'Toronto, CA',
    sourceCoords: [43.6532, -79.3832],
    destCity: 'San Jose, CA',
    destCoords: [37.3382, -121.8863],
    amount: 1420.00,
    currency: 'USD',
    type: 'RECOVERY_CREDIT',
    timestamp: '2024-11-06T13:00:00Z',
  },
];

// ----------------------------------------------------------------------------
// 3. Anomaly Feed Items
// ----------------------------------------------------------------------------

export const SEED_ANOMALY_FEED: AnomalyFeedItem[] = [
  {
    id: 'ANOM-1',
    timestamp: '2024-11-06T14:15:00Z',
    type: 'RECOVERY_DETECTED',
    title: 'Duplicate Merchant Fee Flagged ($1,420.00)',
    description: 'Black Friday batch capture assessed twice within 140ms on PayPal transaction 9XY8472910482910M.',
    severity: 'WARNING',
    actionRoute: 'payback-hunter',
    actionLabel: 'Inspect Case REC-101',
    entityId: 'REC-101',
  },
  {
    id: 'ANOM-2',
    timestamp: '2024-11-06T13:45:00Z',
    type: 'DISCREPANCY_FLAGGED',
    title: 'Bank Settlement Variance ($1,420.00)',
    description: 'Chase Commerce deposit short $1,420.00 compared to PayPal captured gross batch.',
    severity: 'WARNING',
    actionRoute: 'payment-truth',
    actionLabel: 'View Payment Truth',
    entityId: 'REC-TRUTH-101',
  },
  {
    id: 'ANOM-3',
    timestamp: '2024-11-06T11:20:00Z',
    type: 'UDHARI_REMINDER_SENT',
    title: 'Overdue Udhari Debt Alert ($4,200.00)',
    description: 'Marcus Sterling (Acme Industrial) payment overdue by 19 days. WhatsApp reminder ready.',
    severity: 'INFO',
    actionRoute: 'udhari-ledger',
    actionLabel: 'Open Udhari Ledger',
    entityId: 'UDH-201',
  },
  {
    id: 'ANOM-4',
    timestamp: '2024-11-05T18:00:00Z',
    type: 'FIREWALL_BLOCKED',
    title: 'Commitment Firewall Stress-Tested',
    description: 'Simulated new equipment purchase order of $28,000 would breach $15,000 cash buffer on Day 18.',
    severity: 'CRITICAL',
    actionRoute: 'commitments',
    actionLabel: 'Review Firewall',
  },
];

// ----------------------------------------------------------------------------
// 4. 12 Recovery Cases (PayBack Hunter)
// ----------------------------------------------------------------------------

export const SEED_RECOVERY_CASES: RecoveryCase[] = [
  // --- STAGE 1: POTENTIAL IDENTIFIED ($6,350.00) ---
  {
    id: 'REC-101',
    caseNumber: 'REC-2024-8841',
    title: 'Duplicate Merchant Fee Overcharge on Black Friday Payout Batch',
    provider: 'PayPal',
    category: 'DUPLICATE_PROCESSING_FEE',
    dateDetected: '2024-11-04',
    claimAmount: 1420.00,
    currency: 'USD',
    confidenceScore: 98,
    status: 'POTENTIAL_IDENTIFIED',
    potentialRecoverableAmount: 1420.00,
    actualRecoveredAmount: 0,
    paypalTransactionId: '9XY8472910482910M',
    explainability: {
      ruleId: 'RULE-DUP-FEE-02',
      ruleName: 'Duplicate Merchant Fee Assessment on Same Batch Batch-Capture',
      detectionFormula: 'Variance = Fee_Assessed ($2,840.00) - Contracted_Max_Cap ($1,420.00) = +$1,420.00',
      explanationSummary: 'Merchant processing fee was assessed twice on Black Friday Batch settlement #9812 within 140ms due to duplicate webhook trigger.',
      sourceRecords: [
        {
          recordType: 'PAYPAL_TRANSACTION',
          recordId: 'TXN-90214-PP',
          referenceNumber: '9XY8472910482910M',
          date: '2024-11-03',
          amount: 1420.00,
          currency: 'USD',
          snippet: 'FEE_DEBIT: $1,420.00 assessed at 04:12:01 UTC',
        },
        {
          recordType: 'BANK_STATEMENT',
          recordId: 'DEP-4819-CHASE',
          referenceNumber: 'CHK-994821',
          date: '2024-11-04',
          amount: 38580.00,
          currency: 'USD',
          snippet: 'CHASE COMMERCE NET DEPOSIT: $38,580.00 (Expected $40,000.00, short $1,420.00)',
        },
      ],
      rawPayPalPayload: {
        id: '9XY8472910482910M',
        status: 'COMPLETED',
        amount: { total: '40000.00', currency: 'USD' },
        transaction_fee: { value: '2840.00', currency: 'USD' },
        duplicate_event_timestamp: '2024-11-03T04:12:01.142Z',
        contracted_fee_ceiling: '1420.00',
      },
      confidenceScore: 98,
      categoryBadge: 'High Confidence (Rule Engine Verified)',
    },
    auditTrail: [
      { timestamp: '2024-11-04T08:15:00Z', action: 'DETECTED', actor: 'PayBack Hunter Autonomous Engine', details: 'Identified duplicate fee assessment in batch #9812' },
    ],
  },
  {
    id: 'REC-102',
    caseNumber: 'REC-2024-8842',
    title: 'Standard Merchant Processing Rate Tier Mismatch',
    provider: 'PayPal',
    category: 'TIER_MISMATCH_SURCHARGE',
    dateDetected: '2024-11-02',
    claimAmount: 840.00,
    currency: 'USD',
    confidenceScore: 94,
    status: 'POTENTIAL_IDENTIFIED',
    potentialRecoverableAmount: 840.00,
    actualRecoveredAmount: 0,
    paypalTransactionId: '8AB7362910419201K',
    explainability: {
      ruleId: 'RULE-TIER-003',
      ruleName: 'Enterprise Volume Tier Rate Discount Not Applied',
      detectionFormula: 'Overcharge = Billed_Rate (3.49% + $0.49) - Contract_Tier (2.89% + $0.30) = $840.00 delta',
      explanationSummary: 'Monthly volume exceeded $100,000 threshold on Oct 25, qualifying for Tier 2 rate; billed transactions remained on Tier 1.',
      sourceRecords: [],
      rawPayPalPayload: { volume_tier_active: 1, volume_tier_qualified: 2, total_overcharge: '840.00' },
      confidenceScore: 94,
      categoryBadge: 'High Confidence',
    },
    auditTrail: [{ timestamp: '2024-11-02T10:00:00Z', action: 'DETECTED', actor: 'PayBack Hunter', details: 'Volume tier discount breach detected' }],
  },
  {
    id: 'REC-103',
    caseNumber: 'REC-2024-8843',
    title: 'EUR to USD FX Spread Markup Drift on Payout',
    provider: 'PayPal',
    category: 'FX_SPREAD_LEAKAGE',
    dateDetected: '2024-10-29',
    claimAmount: 1850.00,
    currency: 'USD',
    confidenceScore: 91,
    status: 'POTENTIAL_IDENTIFIED',
    potentialRecoverableAmount: 1850.00,
    actualRecoveredAmount: 0,
    paypalTransactionId: '7GH3918291048271P',
    explainability: {
      ruleId: 'RULE-FX-009',
      ruleName: 'Interbank FX Spread Cap Exceeded (Spread > 2.5%)',
      detectionFormula: 'Variance = Billed_Spread (4.2%) - Agreement_Max (2.5%) on €110,000 = $1,850.00',
      explanationSummary: 'Cross-border payout settlement spread exceeded the agreed PayPal enterprise contract cap.',
      sourceRecords: [],
      rawPayPalPayload: { currency: 'EUR', amount: '110000.00', billed_rate: 1.042, agreed_rate: 1.025 },
      confidenceScore: 91,
      categoryBadge: 'High Confidence',
    },
    auditTrail: [{ timestamp: '2024-10-29T14:22:00Z', action: 'DETECTED', actor: 'PayBack Hunter', details: 'FX spread drift flagged' }],
  },
  {
    id: 'REC-104',
    caseNumber: 'REC-2024-8844',
    title: 'Unapplied Vendor Credit Memo on Expedited Logistics',
    provider: 'Chase',
    category: 'UNAPPLIED_REFUND_CREDIT',
    dateDetected: '2024-10-28',
    claimAmount: 1290.00,
    currency: 'USD',
    confidenceScore: 96,
    status: 'POTENTIAL_IDENTIFIED',
    potentialRecoverableAmount: 1290.00,
    actualRecoveredAmount: 0,
    explainability: {
      ruleId: 'RULE-CREDIT-04',
      ruleName: 'Open Credit Memo Unapplied Past 30 Days',
      detectionFormula: 'Credit_Unapplied = $1,290.00 over 34 days',
      explanationSummary: 'Carrier credit memo #CM-901 was accepted by supplier but never deducted from subsequent automated ACH payments.',
      sourceRecords: [],
      rawPayPalPayload: {},
      confidenceScore: 96,
      categoryBadge: 'Verified Accounting Match',
    },
    auditTrail: [{ timestamp: '2024-10-28T16:00:00Z', action: 'DETECTED', actor: 'PayBack Hunter', details: 'Unapplied credit memo detected' }],
  },
  {
    id: 'REC-105',
    caseNumber: 'REC-2024-8845',
    title: 'Duplicate Micro-Authorization Fees on Cancelled Orders',
    provider: 'PayPal',
    category: 'DUPLICATE_PROCESSING_FEE',
    dateDetected: '2024-10-27',
    claimAmount: 950.00,
    currency: 'USD',
    confidenceScore: 93,
    status: 'POTENTIAL_IDENTIFIED',
    potentialRecoverableAmount: 950.00,
    actualRecoveredAmount: 0,
    paypalTransactionId: '6DF9182910482918Q',
    explainability: {
      ruleId: 'RULE-AUTH-01',
      ruleName: 'Authorization Surcharge Assessed on Voided Pre-Auth',
      detectionFormula: 'Voided_Auth_Fees = 190 x $5.00 = $950.00',
      explanationSummary: 'Fees assessed on pre-authorizations that were cancelled within 15 minutes without merchant capture.',
      sourceRecords: [],
      rawPayPalPayload: { voided_auth_count: 190, fee_per_void: '5.00' },
      confidenceScore: 93,
      categoryBadge: 'Rule Match',
    },
    auditTrail: [{ timestamp: '2024-10-27T09:30:00Z', action: 'DETECTED', actor: 'PayBack Hunter', details: 'Duplicate pre-auth fees found' }],
  },

  // --- STAGE 2: CLAIM SUBMITTED ($4,600.00) ---
  {
    id: 'REC-106',
    caseNumber: 'REC-2024-8831',
    title: 'Won Dispute Hold Reversal Delay on Client Chargeback',
    provider: 'PayPal',
    category: 'DISPUTE_CHARGEBACK_HOLD',
    dateDetected: '2024-10-20',
    claimAmount: 2100.00,
    currency: 'USD',
    confidenceScore: 99,
    status: 'CLAIM_SUBMITTED',
    potentialRecoverableAmount: 2100.00,
    actualRecoveredAmount: 0,
    paypalDisputeId: 'PP-D-882914',
    explainability: {
      ruleId: 'RULE-DISP-08',
      ruleName: 'Reserve Hold Retained After Dispute Resolution in Merchant Favor',
      detectionFormula: 'Hold_Amount = $2,100.00 retained 14 days post-win',
      explanationSummary: 'PayPal dispute PP-D-882914 was resolved in merchant favor on Oct 6, but $2,100 reserve hold was not released back to available balance.',
      sourceRecords: [],
      rawPayPalPayload: { dispute_id: 'PP-D-882914', outcome: 'RESOLVED_MERCHANT_FAVOR', hold_status: 'ACTIVE' },
      confidenceScore: 99,
      categoryBadge: 'Verified Win',
    },
    auditTrail: [
      { timestamp: '2024-10-20T11:00:00Z', action: 'DETECTED', actor: 'PayBack Hunter', details: 'Unreleased dispute hold detected' },
      { timestamp: '2024-10-22T14:30:00Z', action: 'SUBMITTED', actor: 'Finance Admin', details: 'Claim submitted to PayPal Merchant Support' },
    ],
  },
  {
    id: 'REC-107',
    caseNumber: 'REC-2024-8832',
    title: 'Cross-Border Assessment Surcharge on Domestic Canadian Card',
    provider: 'PayPal',
    category: 'TIER_MISMATCH_SURCHARGE',
    dateDetected: '2024-10-18',
    claimAmount: 1350.00,
    currency: 'USD',
    confidenceScore: 95,
    status: 'CLAIM_SUBMITTED',
    potentialRecoverableAmount: 1350.00,
    actualRecoveredAmount: 0,
    explainability: {
      ruleId: 'RULE-CROSS-02',
      ruleName: 'Cross-Border Fee Applied to Domestic Entity',
      detectionFormula: 'Misclassified_Volume ($90,000) x 1.5% Cross_Border_Rate = $1,350.00',
      explanationSummary: 'Canadian entity payments billed at international rate despite domestic PayPal Canada processing.',
      sourceRecords: [],
      rawPayPalPayload: {},
      confidenceScore: 95,
      categoryBadge: 'Rule Match',
    },
    auditTrail: [{ timestamp: '2024-10-18T10:00:00Z', action: 'SUBMITTED', actor: 'Finance Admin', details: 'Claim filed' }],
  },
  {
    id: 'REC-108',
    caseNumber: 'REC-2024-8833',
    title: 'SaaS Tool Annual Auto-Renewal Double Billing',
    provider: 'Amex',
    category: 'SUBSCRIPTION_OVERBILLING',
    dateDetected: '2024-10-15',
    claimAmount: 1150.00,
    currency: 'USD',
    confidenceScore: 97,
    status: 'CLAIM_SUBMITTED',
    potentialRecoverableAmount: 1150.00,
    actualRecoveredAmount: 0,
    explainability: {
      ruleId: 'RULE-SUB-01',
      ruleName: 'Overlapping Recurring Charge on Single Subscription ID',
      detectionFormula: 'Double_Charge = $1,150.00 on Oct 14 & Oct 15',
      explanationSummary: 'Figma Enterprise billed twice within 24 hours on company corporate card.',
      sourceRecords: [],
      rawPayPalPayload: {},
      confidenceScore: 97,
      categoryBadge: 'Exact Match',
    },
    auditTrail: [{ timestamp: '2024-10-15T09:00:00Z', action: 'SUBMITTED', actor: 'Finance Admin', details: 'Chargeback dispute filed' }],
  },

  // --- STAGE 3: PROVIDER PENDING ($3,300.00) ---
  {
    id: 'REC-109',
    caseNumber: 'REC-2024-8821',
    title: 'Contested Interchange Tier Downgrade Surcharge',
    provider: 'PayPal',
    category: 'TIER_MISMATCH_SURCHARGE',
    dateDetected: '2024-10-10',
    claimAmount: 1900.00,
    currency: 'USD',
    confidenceScore: 92,
    status: 'PROVIDER_PENDING',
    potentialRecoverableAmount: 1900.00,
    actualRecoveredAmount: 0,
    explainability: {
      ruleId: 'RULE-INTER-05',
      ruleName: 'Custom Tier Qualification Delay',
      detectionFormula: 'Variance = $1,900.00',
      explanationSummary: 'Downgraded interchange fees undergoing secondary provider risk audit.',
      sourceRecords: [],
      rawPayPalPayload: {},
      confidenceScore: 92,
      categoryBadge: 'Under Review',
    },
    auditTrail: [{ timestamp: '2024-10-12T15:00:00Z', action: 'PENDING_REVIEW', actor: 'PayPal Operations', details: 'Under risk investigation' }],
  },
  {
    id: 'REC-110',
    caseNumber: 'REC-2024-8822',
    title: 'Uncredited Return Processing Fee Reversal',
    provider: 'Stripe',
    category: 'UNAPPLIED_REFUND_CREDIT',
    dateDetected: '2024-10-08',
    claimAmount: 1400.00,
    currency: 'USD',
    confidenceScore: 90,
    status: 'PROVIDER_PENDING',
    potentialRecoverableAmount: 1400.00,
    actualRecoveredAmount: 0,
    explainability: {
      ruleId: 'RULE-RET-02',
      ruleName: 'Merchant Return Processing Credit Due',
      detectionFormula: 'Variance = $1,400.00',
      explanationSummary: 'Customer return fee credits approved by gateway awaiting final ledger release.',
      sourceRecords: [],
      rawPayPalPayload: {},
      confidenceScore: 90,
      categoryBadge: 'Under Review',
    },
    auditTrail: [{ timestamp: '2024-10-09T11:00:00Z', action: 'PENDING_REVIEW', actor: 'Stripe Support', details: 'Awaiting ledger release' }],
  },

  // --- STAGE 4: VERIFIED RECOVERED ($4,200.00) ---
  {
    id: 'REC-111',
    caseNumber: 'REC-2024-8801',
    title: 'Disputed Fraudulent Chargeback Successfully Clawed Back',
    provider: 'PayPal',
    category: 'DISPUTE_CHARGEBACK_HOLD',
    dateDetected: '2024-09-25',
    claimAmount: 2700.00,
    currency: 'USD',
    confidenceScore: 100,
    status: 'VERIFIED_RECOVERED',
    potentialRecoverableAmount: 2700.00,
    actualRecoveredAmount: 2700.00,
    paypalDisputeId: 'PP-D-771924',
    explainability: {
      ruleId: 'RULE-DISP-01',
      ruleName: 'Fraudulent Buyer Friendly-Fraud Dispute Defended',
      detectionFormula: 'Recovered = $2,700.00 + $20.00 dispute fee refund',
      explanationSummary: 'Delivery proof and signed Bill of Lading accepted by PayPal; full $2,700 credit deposited to PayPal available balance.',
      sourceRecords: [],
      rawPayPalPayload: { status: 'SETTLED_CREDIT_ISSUED', amount: '2700.00' },
      confidenceScore: 100,
      categoryBadge: 'Settled & Verified',
    },
    auditTrail: [
      { timestamp: '2024-09-25T10:00:00Z', action: 'DETECTED', actor: 'PayBack Hunter', details: 'Dispute filed' },
      { timestamp: '2024-10-02T16:00:00Z', action: 'RECOVERED', actor: 'PayPal Sandbox Engine', details: 'Funds credited to available balance' },
    ],
  },
  {
    id: 'REC-112',
    caseNumber: 'REC-2024-8802',
    title: 'Inadvertent Dual Debit ACH Settlement Refund',
    provider: 'Chase',
    category: 'DUPLICATE_PROCESSING_FEE',
    dateDetected: '2024-09-20',
    claimAmount: 1500.00,
    currency: 'USD',
    confidenceScore: 100,
    status: 'VERIFIED_RECOVERED',
    potentialRecoverableAmount: 1500.00,
    actualRecoveredAmount: 1500.00,
    explainability: {
      ruleId: 'RULE-ACH-02',
      ruleName: 'Dual Debit Settlement Reversed',
      detectionFormula: 'Recovered = $1,500.00',
      explanationSummary: 'Bank reversed second automated debit and credited merchant operating account.',
      sourceRecords: [],
      rawPayPalPayload: {},
      confidenceScore: 100,
      categoryBadge: 'Settled & Verified',
    },
    auditTrail: [{ timestamp: '2024-09-22T10:00:00Z', action: 'RECOVERED', actor: 'Bank ACH System', details: 'Reversal cleared' }],
  },
];

// ----------------------------------------------------------------------------
// 5. Recovery Funnel Metrics
// ----------------------------------------------------------------------------

export const SEED_RECOVERY_FUNNEL_METRICS: RecoveryFunnelMetrics = {
  identifiedAmount: 18450.00,
  identifiedCount: 12,
  submittedAmount: 12100.00,
  submittedCount: 7,
  pendingAmount: 7500.00,
  pendingCount: 4,
  recoveredAmount: 4200.00,
  recoveredCount: 2,
  conversionRatePct: 22.8,
};

// ----------------------------------------------------------------------------
// 6. Reconciliation Records (Payment Truth)
// ----------------------------------------------------------------------------

export const SEED_RECONCILIATION_RECORDS: ReconciliationRecord[] = [
  {
    id: 'REC-TRUTH-101',
    reconciliationKey: 'REC-3WAY-2024-1092',
    date: '2024-11-04',
    status: 'DISCREPANCY_DETECTED',
    paypalRecord: {
      transactionId: '9XY8472910482910M',
      timestamp: '2024-11-03T04:12:00Z',
      grossAmount: 40000.00,
      feeAmount: 2840.00,
      netAmount: 37160.00,
      currency: 'USD',
      payerName: 'Apex Enterprise Portal Batch',
      payerEmail: 'billing@apex-portal.io',
      status: 'COMPLETED',
      captureMethod: 'API_CHECKOUT',
      rawPayload: { batch_id: '9812', duplicate_flag: true },
    },
    bankRecord: {
      bankReferenceId: 'CHK-994821',
      bankName: 'Chase Commercial',
      clearingDate: '2024-11-04',
      depositAmount: 38580.00,
      currency: 'USD',
      description: 'CHASE COMMERCE NET DEPOSIT BATCH 9812',
    },
    ledgerRecord: {
      ledgerEntryId: 'LED-99120',
      accountCode: '4000-REVENUE',
      invoiceId: 'INV-2024-BF-9812',
      customerName: 'Apex Enterprise',
      bookedAmount: 40000.00,
      bookedDate: '2024-11-03',
    },
    varianceAmount: 1420.00,
    matchScore: 78,
    category: 'DUPLICATE_FEE',
    discrepancies: [
      {
        ruleId: 'RULE-DUP-FEE-02',
        ruleName: 'Double Processing Fee Charge',
        severity: 'HIGH',
        deltaAmount: 1420.00,
        description: 'PayPal fee debited was $2,840 instead of contracted ceiling $1,420.',
        recommendedAction: 'Trigger refund recovery via PayPal Dispute API',
      },
    ],
    resolutionStatus: 'OPEN',
    explainabilityRuleId: 'RULE-DUP-FEE-02',
  },
  {
    id: 'REC-TRUTH-102',
    reconciliationKey: 'REC-3WAY-2024-1093',
    date: '2024-11-02',
    status: 'DISCREPANCY_DETECTED',
    varianceAmount: 840.00,
    matchScore: 82,
    category: 'MISSING_DEPOSIT',
    discrepancies: [
      {
        ruleId: 'RULE-TIER-003',
        ruleName: 'Tier Rate Mismatch on Processing',
        severity: 'MEDIUM',
        deltaAmount: 840.00,
        description: 'Processing billed at 3.49% rather than qualified 2.89% tier.',
        recommendedAction: 'Submit volume tier correction claim',
      },
    ],
    resolutionStatus: 'OPEN',
    explainabilityRuleId: 'RULE-TIER-003',
  },
  {
    id: 'REC-TRUTH-103',
    reconciliationKey: 'REC-3WAY-2024-1094',
    date: '2024-10-30',
    status: 'DISCREPANCY_DETECTED',
    varianceAmount: 950.00,
    matchScore: 80,
    category: 'DUPLICATE_FEE',
    discrepancies: [
      {
        ruleId: 'RULE-AUTH-01',
        ruleName: 'Voided Authorization Fees Retained',
        severity: 'MEDIUM',
        deltaAmount: 950.00,
        description: '190 pre-auth void fees uncredited.',
        recommendedAction: 'File authorization fee clawback',
      },
    ],
    resolutionStatus: 'OPEN',
    explainabilityRuleId: 'RULE-AUTH-01',
  },
  {
    id: 'REC-TRUTH-104',
    reconciliationKey: 'REC-3WAY-2024-1095',
    date: '2024-10-25',
    status: 'DISCREPANCY_DETECTED',
    varianceAmount: 630.00,
    matchScore: 84,
    category: 'TIMING_LAG',
    discrepancies: [
      {
        ruleId: 'RULE-TIMING-02',
        ruleName: 'Weekend Settlement Clearing Delay',
        severity: 'LOW',
        deltaAmount: 630.00,
        description: 'Settlement transit lag across Sunday banking cutoff.',
        recommendedAction: 'Monitor automatic ledger sync',
      },
    ],
    resolutionStatus: 'INVESTIGATING',
    explainabilityRuleId: 'RULE-TIMING-02',
  },
  {
    id: 'REC-TRUTH-105',
    reconciliationKey: 'REC-3WAY-2024-1096',
    date: '2024-10-24',
    status: 'RECONCILED',
    varianceAmount: 0.00,
    matchScore: 100,
    category: 'TIMING_LAG',
    discrepancies: [],
    resolutionStatus: 'RESOLVED',
  },
];

export const SEED_TRUTH_GRAPH_DATA: TruthGraphData = {
  nodes: [
    { id: 'N-TX-1', label: 'PayPal TX #9XY847', type: 'PAYPAL_TX', amount: 40000, status: 'DISCREPANT', position3D: [-3, 2, 0], metadata: { fee: 2840 } },
    { id: 'N-BK-1', label: 'Chase Deposit #994821', type: 'BANK_DEPOSIT', amount: 38580, status: 'DISCREPANT', position3D: [3, 2, 0], metadata: { date: '2024-11-04' } },
    { id: 'N-INV-1', label: 'Invoice #INV-BF-9812', type: 'INVOICE', amount: 40000, status: 'MATCHED', position3D: [0, -2, 0], metadata: { terms: 'Due on Receipt' } },
    { id: 'N-CUST-1', label: 'Apex Enterprise', type: 'CUSTOMER', status: 'MATCHED', position3D: [-2, -3, 1], metadata: { rating: 'Tier 1' } },
    { id: 'N-ALERT-1', label: 'Duplicate Fee: $1,420', type: 'DISCREPANCY_ALERT', amount: 1420, status: 'DISCREPANT', position3D: [0, 3, 2], metadata: { rule: 'RULE-DUP-FEE-02' } },
  ],
  edges: [
    { id: 'E-1', source: 'N-TX-1', target: 'N-ALERT-1', amount: 1420, status: 'DISCREPANT', flowSpeed: 1.5 },
    { id: 'E-2', source: 'N-TX-1', target: 'N-BK-1', amount: 38580, status: 'DISCREPANT', flowSpeed: 1.0 },
    { id: 'E-3', source: 'N-INV-1', target: 'N-TX-1', amount: 40000, status: 'VERIFIED', flowSpeed: 2.0 },
    { id: 'E-4', source: 'N-CUST-1', target: 'N-INV-1', amount: 40000, status: 'VERIFIED', flowSpeed: 1.0 },
  ],
};

export const SEED_RECONCILIATION_SUMMARY: ReconciliationSummary = {
  totalReconciledVolume: 542000.00,
  totalDiscrepancyAmount: 3840.00,
  autoMatchPrecisionPct: 99.4,
  unresolvedCount: 4,
};

// ----------------------------------------------------------------------------
// 7. Commitments (Commitment Workbench & Firewall)
// ----------------------------------------------------------------------------

export const SEED_COMMITMENTS: CommitmentItem[] = [
  {
    id: 'CMT-101',
    referenceNumber: 'PO-2024-918',
    title: 'Q4 Raw Materials & Inventory Batch (Alibaba Logistics)',
    counterparty: 'Shenzhen Apex Electronic Components Co.',
    category: 'SUPPLIER_INVENTORY',
    startDate: '2024-11-01',
    dueDate: '2024-11-20',
    totalCommittedAmount: 22500.00,
    amountPaidToDate: 12000.00,
    pendingBalance: 10500.00,
    paymentTerms: 'NET_30',
    milestones: [
      { id: 'M1', name: 'Order Deposit (50%)', dueDate: '2024-11-01', percentageSplit: 50, amount: 12000.00, isPaid: true },
      { id: 'M2', name: 'Bill of Lading Delivery (50%)', dueDate: '2024-11-20', percentageSplit: 50, amount: 10500.00, isPaid: false },
    ],
    firewallStatus: 'APPROVED_SAFE',
    firewallVerdict: {
      safe: true,
      lowestProjectedBuffer: 31200.00,
      explanation: 'Sustains required $15,000 buffer with $16,200 safety headroom.',
    },
    priority: 'HIGH',
  },
  {
    id: 'CMT-102',
    referenceNumber: 'PAYROLL-2024-11A',
    title: 'Mid-Month Core Engineering & Operations Payroll',
    counterparty: 'Gusto Payroll Service',
    category: 'PAYROLL',
    startDate: '2024-11-01',
    dueDate: '2024-11-15',
    totalCommittedAmount: 24000.00,
    amountPaidToDate: 0,
    pendingBalance: 24000.00,
    paymentTerms: 'DUE_ON_RECEIPT',
    milestones: [
      { id: 'M1', name: 'Direct Deposit Run', dueDate: '2024-11-15', percentageSplit: 100, amount: 24000.00, isPaid: false },
    ],
    firewallStatus: 'APPROVED_SAFE',
    firewallVerdict: {
      safe: true,
      lowestProjectedBuffer: 28400.00,
      explanation: 'Mandatory obligation protected by priority cash reservation.',
    },
    priority: 'CRITICAL',
  },
  {
    id: 'CMT-103',
    referenceNumber: 'RENT-2024-12',
    title: 'Commercial Office & Warehousing Lease',
    counterparty: 'Hudson Commercial Real Estate LLC',
    category: 'OFFICE_RENT',
    startDate: '2024-11-01',
    dueDate: '2024-12-01',
    totalCommittedAmount: 4400.00,
    amountPaidToDate: 0,
    pendingBalance: 4400.00,
    paymentTerms: 'DUE_ON_RECEIPT',
    milestones: [],
    firewallStatus: 'APPROVED_SAFE',
    firewallVerdict: {
      safe: true,
      lowestProjectedBuffer: 42000.00,
      explanation: 'Standard fixed lease obligation.',
    },
    priority: 'MEDIUM',
  },
  {
    id: 'CMT-104',
    referenceNumber: 'SAAS-2024-11',
    title: 'Cloud Infrastructure (AWS + Snowflake + PayPal APIs)',
    counterparty: 'Amazon Web Services, Inc.',
    category: 'SAAS_TOOLS',
    startDate: '2024-11-01',
    dueDate: '2024-11-22',
    totalCommittedAmount: 4300.00,
    amountPaidToDate: 0,
    pendingBalance: 4300.00,
    paymentTerms: 'NET_15',
    milestones: [],
    firewallStatus: 'APPROVED_SAFE',
    firewallVerdict: {
      safe: true,
      lowestProjectedBuffer: 38200.00,
      explanation: 'Sustained within standard operating budget.',
    },
    priority: 'MEDIUM',
  },
];

// ----------------------------------------------------------------------------
// 8. Financial Digital Twin State
// ----------------------------------------------------------------------------

export const SEED_DIGITAL_TWIN_METRICS: DigitalTwinMetrics = {
  scrubDayOffset: 0,
  timestamp: '2024-11-06T14:30:00Z',
  liquidity: {
    totalLiquidCash: 142500.00,
    paypalAvailableBalance: 68400.00,
    paypalPendingHoldBalance: 12500.00,
    bankOperatingChecking: 58100.00,
    emergencyReserveSavings: 16000.00,
    receivablesDueNext30Days: 38400.00,
  },
  liabilities: {
    accountsPayableNext30Days: 43200.00,
    committedSupplierObligations: 22500.00,
    scheduledTaxProvisions: 8400.00,
    recurringSoftwareBurn: 4300.00,
  },
  workingCapital: 99300.00,
  quickRatio: 1.82,
  currentRatio: 2.14,
  dailyBurnRate: 1515.00,
  netDailyCashFlow: 420.00,
  runwayDays: 94,
  healthScore: 88,
  dynamicPulseState: 'STABLE',
  orbColorHex: '#10B981',
  pulseFrequencyHz: 1.2,
};

// ----------------------------------------------------------------------------
// 9. Simulation Lab & Initial Projections
// ----------------------------------------------------------------------------

export function generateInitialDailyProjections(): DailyCashProjectionPoint[] {
  const points: DailyCashProjectionPoint[] = [];
  let balance = 142500;
  const startDate = new Date('2024-11-06');

  for (let day = 0; day <= 90; day++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + day);
    const dateStr = curDate.toISOString().split('T')[0];

    let inFlow = 2200;
    let outFlow = 350;

    if (day === 0) inFlow += 12000;
    if (day === 45) inFlow += 24000;
    if (day === 75) inFlow += 24000;

    const dayOfMonth = curDate.getDate();
    if (dayOfMonth === 1 || dayOfMonth === 15) outFlow += 12000;
    if (dayOfMonth === 1) outFlow += 4400;
    if (day === 14) outFlow += 10500;
    if (day === 22) outFlow += 4300;

    const net = inFlow - outFlow;
    balance += net;

    points.push({
      dayIndex: day,
      date: dateStr,
      startingBalance: balance - net,
      inFlow,
      outFlow,
      netCash: net,
      balance,
      isBreached: balance < 15000,
      breachSeverity: balance < 0 ? 'CRITICAL' : balance < 15000 ? 'TIGHT' : 'NONE',
    });
  }

  return points;
}

export const SEED_SIMULATION_STATE: SimulationLabState = {
  parameters: {
    upfrontDepositPct: 20,
    customerPaymentDelayDays: 15,
    milestoneSplit: [30, 40, 30],
    milestonePreset: '30_40_30',
  },
  safetyBufferThreshold: 15000.00,
  dailyProjections: generateInitialDailyProjections(),
  minimumCashPoint: { amount: 64200, dayIndex: 28, date: '2024-12-04' },
  projectedRunwayDays: 94,
  isBufferBreached: false,
  selectedScenario: 'BASELINE',
  comparison: {
    baselineEndingCash: 168400,
    optimisticEndingCash: 215000,
    conservativeEndingCash: 112000,
    baselineLowestDip: { amount: 64200, date: '2024-12-04' },
    optimisticLowestDip: { amount: 89000, date: '2024-12-04' },
    conservativeLowestDip: { amount: 24100, date: '2024-12-18' },
    baselineRunwayDays: 94,
    optimisticRunwayDays: 142,
    conservativeRunwayDays: 68,
  },
};

// ----------------------------------------------------------------------------
// 10. Business Survival Radar
// ----------------------------------------------------------------------------

export const SEED_SURVIVAL_RADAR: BusinessSurvivalRadarState = {
  overallSurvivalIndex: 84,
  dimensions: [
    {
      key: 'customer-concentration',
      name: 'Customer Concentration',
      score: 72,
      industryBenchmark: 65,
      status: 'ADEQUATE',
      metricValueText: 'Top client = 28% revenue',
      riskFactorSummary: 'Diversification recommended if top client exceeds 30%',
    },
    {
      key: 'cash-runway',
      name: 'Cash Runway',
      score: 89,
      industryBenchmark: 60,
      status: 'EXCELLENT',
      metricValueText: '94 days runway ($142.5k)',
      riskFactorSummary: 'Healthy 3-month operating reserve maintained',
    },
    {
      key: 'margin-stability',
      name: 'Gross Margin Stability',
      score: 85,
      industryBenchmark: 70,
      status: 'EXCELLENT',
      metricValueText: '64.2% stable margin',
      riskFactorSummary: 'Consistent software & service delivery margins',
    },
    {
      key: 'dispute-ratio',
      name: 'Dispute / Chargeback Health',
      score: 91,
      industryBenchmark: 75,
      status: 'EXCELLENT',
      metricValueText: '0.24% PayPal dispute rate',
      riskFactorSummary: 'Well below 1.0% card network monitoring threshold',
    },
    {
      key: 'working-capital',
      name: 'Working Capital Buffer',
      score: 86,
      industryBenchmark: 70,
      status: 'EXCELLENT',
      metricValueText: '$99.3k net buffer',
      riskFactorSummary: 'Strong liquidity covering short-term liabilities',
    },
    {
      key: 'vendor-dependency',
      name: 'Vendor Single-Point Risk',
      score: 78,
      industryBenchmark: 68,
      status: 'ADEQUATE',
      metricValueText: 'Alibaba logistics 48% inventory',
      riskFactorSummary: 'Secondary domestic logistics vendor recommended',
    },
  ],
  stressScenarios: [
    {
      id: 'SHOCK-01',
      title: 'Top Client Default (30-Day Payment Freeze)',
      description: 'Simulates primary enterprise customer withholding payment for 30 days due to client restructuring.',
      appliedShock: '-$35,000 cash inflow delay',
      immediateCashImpact: -35000.00,
      runwayReductionDays: -23,
      simulatedHealthScore: 71,
      verdict: 'RESILIENT',
      actionPlaybook: ['Accelerate Udhari collections', 'Defer non-essential SaaS tooling', 'Draw on emergency line'],
    },
    {
      id: 'SHOCK-02',
      title: 'Dispute Surge & Reserve Hold (PayPal 15% Hold)',
      description: 'Simulates seasonal spike triggering a 15% temporary rolling reserve on PayPal account balance.',
      appliedShock: '-$10,260 available cash hold',
      immediateCashImpact: -10260.00,
      runwayReductionDays: -7,
      simulatedHealthScore: 81,
      verdict: 'RESILIENT',
      actionPlaybook: ['Submit delivery proofs via Sandbox Dispute API', 'Request reserve cap review'],
    },
    {
      id: 'SHOCK-03',
      title: 'Macro Revenue Shock (-40% Monthly Volume)',
      description: 'Simulates severe market downturn slashing sales by 40% across two consecutive quarters.',
      appliedShock: '-$38,000 monthly inflow reduction',
      immediateCashImpact: -45000.00,
      runwayReductionDays: -41,
      simulatedHealthScore: 54,
      verdict: 'MODERATE_STRESS',
      actionPlaybook: ['Enact emergency budget cuts', 'Renegotiate vendor terms to NET_60', 'Shift to high-margin retainers'],
    },
  ],
  activeStressTestId: null,
};

// ----------------------------------------------------------------------------
// 11. Udhari Debt Ledger (Customer Credit & Aging)
// ----------------------------------------------------------------------------

export const SEED_UDHARI_CUSTOMERS: UdhariCustomer[] = [
  {
    id: 'UDH-201',
    customerCode: 'CUST-ACME',
    customerName: 'Marcus Sterling',
    businessName: 'Acme Industrial Robotics',
    contactEmail: 'm.sterling@acme-robotics.io',
    contactPhone: '+1 (555) 392-8819',
    creditLimit: 10000.00,
    totalCreditGiven: 18400.00,
    totalRepaid: 14200.00,
    outstandingBalance: 4200.00,
    dueDate: '2024-10-18',
    daysOverdue: 19,
    agingBucket: '16_30_DAYS',
    riskTier: 'MEDIUM',
    trustScore: 78,
    lastPaymentDate: '2024-09-30',
    lastReminderDate: '2024-11-02',
    lastReminderChannel: 'WHATSAPP',
    remindersCount: 2,
    repaymentHistory: [
      { id: 'REP-1', date: '2024-09-30', amount: 3500.00, method: 'PAYPAL', referenceTransactionId: 'PP-PAY-88214' },
    ],
  },
  {
    id: 'UDH-202',
    customerCode: 'CUST-NEXUS',
    customerName: 'Elena Rostova',
    businessName: 'Nexus Global Logistics',
    contactEmail: 'elena@nexuslogistics.ca',
    contactPhone: '+1 (555) 847-2910',
    creditLimit: 8000.00,
    totalCreditGiven: 12500.00,
    totalRepaid: 8900.00,
    outstandingBalance: 3600.00,
    dueDate: '2024-11-12',
    daysOverdue: 0,
    agingBucket: '0_15_DAYS',
    riskTier: 'LOW',
    trustScore: 92,
    lastPaymentDate: '2024-10-15',
    remindersCount: 0,
    repaymentHistory: [],
  },
  {
    id: 'UDH-203',
    customerCode: 'CUST-VERTEX',
    customerName: 'Devon Vance',
    businessName: 'Vertex Architectural Design',
    contactEmail: 'devon@vertexdesign.co',
    contactPhone: '+1 (555) 773-4012',
    creditLimit: 5000.00,
    totalCreditGiven: 7500.00,
    totalRepaid: 4140.00,
    outstandingBalance: 3360.00,
    dueDate: '2024-09-24',
    daysOverdue: 43,
    agingBucket: '31_60_DAYS',
    riskTier: 'HIGH',
    trustScore: 54,
    lastPaymentDate: '2024-09-02',
    lastReminderDate: '2024-10-25',
    lastReminderChannel: 'PAYPAL_INVOICE',
    remindersCount: 4,
    repaymentHistory: [],
  },
  {
    id: 'UDH-204',
    customerCode: 'CUST-SOLARIS',
    customerName: 'Aria Chen',
    businessName: 'Solaris Biotech Labs',
    contactEmail: 'a.chen@solaris-bio.org',
    contactPhone: '+1 (555) 482-9901',
    creditLimit: 6000.00,
    totalCreditGiven: 6000.00,
    totalRepaid: 3480.00,
    outstandingBalance: 2520.00,
    dueDate: '2024-08-30',
    daysOverdue: 68,
    agingBucket: '60_PLUS_DAYS',
    riskTier: 'HIGH',
    trustScore: 41,
    lastPaymentDate: '2024-08-10',
    lastReminderDate: '2024-10-20',
    lastReminderChannel: 'WHATSAPP',
    remindersCount: 5,
    repaymentHistory: [],
  },
  {
    id: 'UDH-205',
    customerCode: 'CUST-KAIZEN',
    customerName: 'Kenji Takahashi',
    businessName: 'Kaizen Modern Retail',
    contactEmail: 'kenji@kaizen-retail.com',
    contactPhone: '+1 (555) 601-3829',
    creditLimit: 5000.00,
    totalCreditGiven: 9000.00,
    totalRepaid: 5880.00,
    outstandingBalance: 3120.00,
    dueDate: '2024-11-09',
    daysOverdue: 0,
    agingBucket: '0_15_DAYS',
    riskTier: 'LOW',
    trustScore: 88,
    lastPaymentDate: '2024-10-22',
    remindersCount: 0,
    repaymentHistory: [],
  },
];

export const SEED_UDHARI_SUMMARY: UdhariLedgerSummary = {
  totalOutstandingCredit: 16800.00,
  overdueAbove30Days: 5880.00,
  recoveredThisMonth: 9200.00,
  averageCollectionDays: 14,
  agingBucketDistribution: {
    bucket0to15: { amount: 6720.00, percentage: 40.0 },
    bucket16to30: { amount: 4200.00, percentage: 25.0 },
    bucket31to60: { amount: 3360.00, percentage: 20.0 },
    bucket60Plus: { amount: 2520.00, percentage: 15.0 },
  },
};

// ----------------------------------------------------------------------------
// 12. Approvals & Governed Actions
// ----------------------------------------------------------------------------

export const SEED_APPROVALS: ApprovalRequest[] = [
  {
    id: 'APR-9941',
    requestNumber: 'DISP-9941',
    title: 'Submit PayPal Dispute Claim #DISP-9941 for $1,420.00',
    description: 'Autonomous recovery filing for duplicate batch merchant fee overcharge on Case REC-101.',
    actionType: 'PAYPAL_DISPUTE_SUBMIT',
    targetEntityId: 'REC-101',
    amount: 1420.00,
    currency: 'USD',
    riskRating: 'LOW',
    requestedAt: '2024-11-06T14:30:00Z',
    status: 'PENDING_REVIEW',
    beforeStateSnapshot: {
      caseId: 'REC-101',
      status: 'POTENTIAL_IDENTIFIED',
      recoveredAmount: 0.00,
      paypalAvailableCash: 68400.00,
    },
    afterStateSnapshot: {
      caseId: 'REC-101',
      status: 'VERIFIED_RECOVERED',
      recoveredAmount: 1420.00,
      paypalAvailableCash: 69820.00,
    },
    paypalApiBlueprint: {
      httpMethod: 'POST',
      endpointPath: '/v1/customer-disputes',
      idempotencyKey: '9e8c4a51-3820-4f91-881b-a491829e001a',
      headers: {
        'Content-Type': 'application/json',
        'PayPal-Request-Id': '9e8c4a51-3820-4f91-881b-a491829e001a',
        'Authorization': 'Bearer A21AAL...SIMULATED_TOKEN',
      },
      requestBody: {
        dispute_flow: 'DISPUTE_INTERNAL_AUDIT',
        dispute_amount: {
          currency_code: 'USD',
          value: '1420.00',
        },
        disputed_transactions: [
          {
            buyer_transaction_id: '9XY8472910482910M',
            seller_transaction_id: 'TXN-90214-PP',
            invoice_number: 'INV-2024-BF-9812',
          },
        ],
        reason: 'DUPLICATE_PROCESSING_FEE',
        evidence: [
          {
            evidence_type: 'PROOF_OF_OVERCHARGE',
            evidence_info: {
              rule_id: 'RULE-DUP-FEE-02',
              calculated_excess: '1420.00 USD',
              duplicate_window_ms: 140,
            },
          },
        ],
      },
    },
  },
  {
    id: 'APR-9942',
    requestNumber: 'CLAW-8832',
    title: 'Dispute Canadian Domestic Surcharge ($1,350.00)',
    description: 'File claim for misclassified cross-border transaction rate on Case REC-107.',
    actionType: 'PAYPAL_REFUND_EXECUTE',
    targetEntityId: 'REC-107',
    amount: 1350.00,
    currency: 'USD',
    riskRating: 'MEDIUM',
    requestedAt: '2024-11-06T11:15:00Z',
    status: 'PENDING_REVIEW',
    beforeStateSnapshot: { caseId: 'REC-107', status: 'CLAIM_SUBMITTED' },
    afterStateSnapshot: { caseId: 'REC-107', status: 'VERIFIED_RECOVERED' },
    paypalApiBlueprint: {
      httpMethod: 'POST',
      endpointPath: '/v2/payments/captures/8AB7362910419201K/refund',
      idempotencyKey: '4f1a8b92-7104-4c28-990a-f10293847561',
      headers: { 'Content-Type': 'application/json' },
      requestBody: {
        amount: { value: '1350.00', currency_code: 'USD' },
        note_to_payer: 'Automated PayPilot Recovery: Surcharge tier correction',
      },
    },
  },
  {
    id: 'APR-9943',
    requestNumber: 'PO-OVERRIDE-918',
    title: 'Commitment Authorization: Alibaba Raw Materials Balance ($10,500.00)',
    description: 'Release milestone payment upon verification of Bill of Lading delivery receipt.',
    actionType: 'SUPPLIER_PAYMENT_RELEASE',
    targetEntityId: 'CMT-101',
    amount: 10500.00,
    currency: 'USD',
    riskRating: 'LOW',
    requestedAt: '2024-11-06T09:40:00Z',
    status: 'PENDING_REVIEW',
    beforeStateSnapshot: { commitmentId: 'CMT-101', pendingBalance: 10500.00 },
    afterStateSnapshot: { commitmentId: 'CMT-101', pendingBalance: 0.00 },
    paypalApiBlueprint: {
      httpMethod: 'POST',
      endpointPath: '/v1/payments/payouts',
      idempotencyKey: '7c8d9e01-1234-4567-89ab-cdef01234567',
      headers: { 'Content-Type': 'application/json' },
      requestBody: {
        sender_batch_header: { sender_batch_id: 'BATCH-ALIBABA-918' },
        items: [{ recipient_type: 'EMAIL', amount: { value: '10500.00', currency: 'USD' }, receiver: 'payables@shenzhen-apex.cn' }],
      },
    },
  },
];

// ----------------------------------------------------------------------------
// 13. Copilot / Agent Messages
// ----------------------------------------------------------------------------

export const SEED_COPILOT_MESSAGES: CopilotMessage[] = [
  {
    id: 'COP-1',
    role: 'assistant',
    timestamp: '2024-11-06T14:31:00Z',
    content: "Welcome to PayPilot Copilot. I've analyzed your financial universe: **$142.5k available cash**, **94 days runway**, and **$18.45k recoverable revenue** across 12 flagged cases. \n\nCase **REC-101** ($1,420.00 duplicate fee on transaction 9XY8472910482910M) is ready for immediate PayPal Sandbox recovery.",
    citations: [
      {
        recordId: 'REC-101',
        entityType: 'RECOVERY_CASE',
        title: 'Case REC-101: Duplicate Fee Assessment ($1,420)',
        snippet: 'Fee assessed twice within 140ms on Black Friday batch settlement.',
      },
    ],
    actions: [
      {
        actionId: 'ACT-NAV-101',
        actionType: 'NAVIGATE',
        label: 'Inspect Case in PayBack Hunter',
        payload: { route: 'payback-hunter', caseId: 'REC-101' },
      },
      {
        actionId: 'ACT-STAGE-101',
        actionType: 'STAGE_CLAIM',
        label: 'Stage PayPal Sandbox Dispute ($1,420)',
        payload: { caseId: 'REC-101' },
      },
    ],
  },
];

export const SEED_COPILOT_CONTEXT: CopilotVerifiedContext = {
  availableCash: 142500.00,
  identifiedRecoveries: 18450.00,
  unpaidUdhari: 16800.00,
  activeDiscrepanciesCount: 4,
  paypalSandboxStatus: 'CONNECTED',
};

// ----------------------------------------------------------------------------
// 14. Team Members & Secure Sharing
// ----------------------------------------------------------------------------

export const SEED_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'USR-1',
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne-defense.com',
    role: 'OWNER',
    permissions: {
      canExecutePayPalClaims: true,
      canViewRawFinancials: true,
      canExportReports: true,
    },
    lastActive: 'Just now',
  },
  {
    id: 'USR-2',
    name: 'David Miller, CPA',
    email: 'd.miller@miller-accounting.tax',
    role: 'EXTERNAL_ACCOUNTANT',
    permissions: {
      canExecutePayPalClaims: false,
      canViewRawFinancials: true,
      canExportReports: true,
    },
    lastActive: '2 hours ago',
  },
  {
    id: 'USR-3',
    name: 'Alex Rivera',
    email: 'a.rivera@cyberdyne-defense.com',
    role: 'FINANCE_MANAGER',
    permissions: {
      canExecutePayPalClaims: true,
      canViewRawFinancials: true,
      canExportReports: true,
    },
    lastActive: 'Yesterday',
  },
];

export const SEED_SHARED_REPORTS: HashSignedReport[] = [
  {
    id: 'REP-7F83',
    reportTitle: 'Q4 2024 PayPal Fee Leakage & Recovery Proof Audit',
    reportType: 'RECOVERY_AUDIT_PROOF',
    createdAt: '2024-11-06T14:00:00Z',
    expiresAt: '2024-11-09T14:00:00Z',
    accessCount: 3,
    isPasswordProtected: false,
    revoked: false,
    canonicalJsonPayload: JSON.stringify({
      auditId: 'REP-7F83',
      recoveredAmount: 4200.00,
      potentialAmount: 18450.00,
      casesCount: 12,
      platform: 'PayPilot PayPal AI Sandbox',
    }),
    sha256ProofHash: 'd68ce70c858556f869267799f4ee74fbb3a07f4b62e3a848bc7d33306de4c870',
    signerKeyId: 'KEY-ED25519-PAYPILOT-01',
    verificationBadgeLabel: '#PAY-SHA256-D68CE70C-6DE4C870',
    scopedShareUrl: 'https://paypilot.app/share/rep-7f83?sig=d68ce70c',
  },
];

// ----------------------------------------------------------------------------
// 15. PayPal Sandbox Settings Configuration
// ----------------------------------------------------------------------------

export const SEED_PAYPAL_CONFIG: PayPalSandboxConfig = {
  clientId: 'sb-client-paypilot-hackathon-2024',
  clientSecretMasked: '••••••••••••••••••••••••••••••••',
  environment: 'SANDBOX',
  connectionStatus: 'CONNECTED_SANDBOX',
  apiVersion: 'v2',
  webhookId: 'WH-99214-PAYPILOT',
  webhookUrl: 'https://paypilot.app/api/webhooks/paypal',
  lastPingTimestamp: '2024-11-06T14:28:10Z',
  simulatorToggles: {
    simulateApiLatencyMs: 800,
    simulateNetworkErrorRatePct: 0,
    autoCreditReserveOnDispute: true,
  },
};

// ----------------------------------------------------------------------------
// 16. Pristine Demo Seed Bundle (for Deep-Cloning & Reset)
// ----------------------------------------------------------------------------

export const PRISTINE_DEMO_SEED_DATA = {
  executiveKpis: SEED_EXECUTIVE_KPIS,
  transitArcs: SEED_TRANSIT_ARCS,
  anomalyFeed: SEED_ANOMALY_FEED,
  recoveryCases: SEED_RECOVERY_CASES,
  recoveryFunnelMetrics: SEED_RECOVERY_FUNNEL_METRICS,
  reconciliationRecords: SEED_RECONCILIATION_RECORDS,
  truthGraphData: SEED_TRUTH_GRAPH_DATA,
  reconciliationSummary: SEED_RECONCILIATION_SUMMARY,
  commitments: SEED_COMMITMENTS,
  digitalTwinMetrics: SEED_DIGITAL_TWIN_METRICS,
  simulationState: SEED_SIMULATION_STATE,
  survivalRadarState: SEED_SURVIVAL_RADAR,
  udhariCustomers: SEED_UDHARI_CUSTOMERS,
  udhariSummary: SEED_UDHARI_SUMMARY,
  copilotMessages: SEED_COPILOT_MESSAGES,
  copilotVerifiedContext: SEED_COPILOT_CONTEXT,
  pendingApprovals: SEED_APPROVALS,
  teamMembers: SEED_TEAM_MEMBERS,
  sharedReports: SEED_SHARED_REPORTS,
  paypalConfig: SEED_PAYPAL_CONFIG,
};
