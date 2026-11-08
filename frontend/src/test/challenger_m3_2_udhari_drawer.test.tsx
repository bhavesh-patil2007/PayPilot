import React, { useState } from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { ExplainabilityDrawer } from '../components/common/ExplainabilityDrawer';
import { AgingBucketVisualizer } from '../components/common/AgingBucketVisualizer';
import { UdhariLedgerTable } from '../components/tables/UdhariLedgerTable';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { AgingBucket, UdhariCustomer } from '../types';

describe('Adversarial Challenger Suite: Udhari Ledger, Aging Visualizer & Explainability Drawer', () => {
  beforeEach(() => {
    vi.useRealTimers();
    usePayPilotStore.getState().resetToDemoState();
    usePayPilotStore.getState().closeExplainability();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. EXPLAINABILITY DRAWER ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('Suite 1: ExplainabilityDrawer Edge Conditions & Attack Surface', () => {
    it('TC-DRW-01: handles unknown and non-existent rule IDs without throwing or crashing', () => {
      render(<ExplainabilityDrawer />);

      // Test completely unknown rule ID
      act(() => {
        usePayPilotStore.getState().openExplainability('RULE-UNKNOWN-999-STRESS', 'REC-NONEXISTENT');
      });

      expect(screen.getByTestId('explainability-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('explainability-drawer-panel')).toBeInTheDocument();

      // Renders clean fallback for rule ID and title
      expect(screen.getByText('RULE-UNKNOWN-999-STRESS')).toBeInTheDocument();
      expect(screen.getByText(/Rule: RULE-UNKNOWN-999-STRESS/i)).toBeInTheDocument();

      // Displays fallback confidence and formulas
      expect(screen.getByText(/98% Confidence/i)).toBeInTheDocument();
      expect(screen.getByTestId('detection-formula')).toBeInTheDocument();
      expect(screen.getByTestId('raw-paypal-payload-json')).toBeInTheDocument();

      // Source records fallback notice is rendered
      expect(
        screen.getByText(/Ground-truth records linked via PayPal Sandbox REST API v2 transaction captures/i)
      ).toBeInTheDocument();
    });

    it('TC-DRW-02: handles empty string, special characters, and XSS injection attempts in rule ID', () => {
      render(<ExplainabilityDrawer />);

      const maliciousRuleId = '<script>alert("xss")</script>';
      act(() => {
        usePayPilotStore.getState().openExplainability(maliciousRuleId, 'REC-INJECT');
      });

      expect(screen.getByTestId('explainability-drawer')).toBeInTheDocument();
      // Should be escaped as text, not executed as HTML
      const badges = screen.getAllByText(maliciousRuleId);
      expect(badges.length).toBeGreaterThan(0);
      expect(document.querySelector('script[src*="alert"]')).toBeNull();
    });

    it('TC-DRW-03: extreme long formula string does not cause horizontal layout blowout', () => {
      render(<ExplainabilityDrawer />);

      // Create a super long unbroken 2,000-character formula
      const longFormula = 'Variance_Assessed=' + 'TERM_'.repeat(400) + '_END';

      act(() => {
        usePayPilotStore.setState({
          explainabilityDrawer: {
            isOpen: true,
            activeRuleId: 'RULE-STRESS-FORMULA',
            activeRecordId: 'REC-BLOWOUT-TEST',
            ruleTitle: 'Stress Test Formula Containment',
            details: {
              ruleId: 'RULE-STRESS-FORMULA',
              ruleName: 'Stress Test Formula Containment',
              confidenceScore: 99,
              categoryBadge: 'STRESS',
              detectionFormula: longFormula,
              explanationSummary: 'Testing horizontal overflow containment.',
              sourceRecords: [],
              rawPayPalPayload: { test: 'payload' },
            },
          },
        });
      });

      const panel = screen.getByTestId('explainability-drawer-panel');
      const formulaEl = screen.getByTestId('detection-formula');

      expect(formulaEl).toBeInTheDocument();
      expect(formulaEl.textContent).toContain(longFormula);

      // Verify formula container has overflow-x-auto and whitespace-nowrap classes
      expect(formulaEl.className).toContain('overflow-x-auto');
      expect(formulaEl.className).toContain('whitespace-nowrap');

      // Verify panel retains fixed-width containment classes (max-w-2xl w-full)
      expect(panel.className).toContain('max-w-2xl');
      expect(panel.className).toContain('w-full');
    });

    it('TC-DRW-04: dismissal via Escape key closes drawer and cleans up listeners', () => {
      render(<ExplainabilityDrawer />);

      act(() => {
        usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02');
      });

      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);

      // Pressing non-Escape keys does NOT close drawer
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      });
      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);

      // Pressing Escape key closes drawer
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(false);
      expect(screen.queryByTestId('explainability-drawer')).not.toBeInTheDocument();
    });

    it('TC-DRW-05: dismissal via backdrop click closes drawer, but clicks inside panel do not close it', () => {
      render(<ExplainabilityDrawer />);

      act(() => {
        usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02');
      });

      const panel = screen.getByTestId('explainability-drawer-panel');
      // Clicking inside panel does not trigger close
      act(() => {
        fireEvent.click(panel);
      });
      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);

      // Clicking backdrop closes drawer
      const backdrop = screen.getByTestId('drawer-backdrop');
      act(() => {
        fireEvent.click(backdrop);
      });
      expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(false);
    });

    it('TC-DRW-06: raw JSON toggle collapses and expands payload cleanly', () => {
      render(<ExplainabilityDrawer />);

      act(() => {
        usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02');
      });

      expect(screen.getByTestId('raw-paypal-payload-json')).toBeInTheDocument();

      // Click toggle button to collapse
      const toggleBtn = screen.getByText(/Verbatim PayPal Sandbox API Response/i);
      act(() => {
        fireEvent.click(toggleBtn);
      });
      expect(screen.queryByTestId('raw-paypal-payload-json')).not.toBeInTheDocument();

      // Click toggle button to re-expand
      act(() => {
        fireEvent.click(toggleBtn);
      });
      expect(screen.getByTestId('raw-paypal-payload-json')).toBeInTheDocument();
    });

    it('TC-DRW-07: clipboard copy fallback handles API rejection gracefully without throwing', async () => {
      vi.useFakeTimers();

      // Mock navigator.clipboard.writeText to throw an error (e.g. permission denied)
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard permission denied')),
        },
        configurable: true,
        writable: true,
      });

      render(<ExplainabilityDrawer />);

      act(() => {
        usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02');
      });

      const copyBtn = screen.getByTestId('copy-json-button');
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      // Graceful fallback sets Copied!
      expect(screen.getByText('Copied!')).toBeInTheDocument();

      // After 2000ms, reverts back to "Copy JSON"
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText('Copy JSON')).toBeInTheDocument();

      // Restore clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
        writable: true,
      });
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // 2. AGING BUCKET VISUALIZER ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('Suite 2: AgingBucketVisualizer Mathematical & Coordination Invariants', () => {
    it('TC-AGV-01: bucket percentages sum to strictly 100% in baseline state', () => {
      render(<AgingBucketVisualizer selectedBucket="ALL" onSelectBucket={vi.fn()} />);

      const customers = usePayPilotStore.getState().udhariCustomers;
      const totalOutstanding = customers.reduce((s, c) => s + c.outstandingBalance, 0);

      const b0_15 = customers.filter((c) => c.agingBucket === '0_15_DAYS').reduce((s, c) => s + c.outstandingBalance, 0);
      const b16_30 = customers.filter((c) => c.agingBucket === '16_30_DAYS').reduce((s, c) => s + c.outstandingBalance, 0);
      const b31_60 = customers.filter((c) => c.agingBucket === '31_60_DAYS').reduce((s, c) => s + c.outstandingBalance, 0);
      const b60_plus = customers.filter((c) => c.agingBucket === '60_PLUS_DAYS').reduce((s, c) => s + c.outstandingBalance, 0);

      expect(totalOutstanding).toBe(16800);
      expect(b0_15 + b16_30 + b31_60 + b60_plus).toBe(totalOutstanding);

      const pct0_15 = (b0_15 / totalOutstanding) * 100;
      const pct16_30 = (b16_30 / totalOutstanding) * 100;
      const pct31_60 = (b31_60 / totalOutstanding) * 100;
      const pct60_plus = (b60_plus / totalOutstanding) * 100;

      const totalPct = pct0_15 + pct16_30 + pct31_60 + pct60_plus;
      expect(totalPct).toBeCloseTo(100.0, 5);

      // Verify DOM cards display percentages
      expect(screen.getByText(`${pct0_15.toFixed(1)}%`)).toBeInTheDocument();
      expect(screen.getByText(`${pct16_30.toFixed(1)}%`)).toBeInTheDocument();
      expect(screen.getByText(`${pct31_60.toFixed(1)}%`)).toBeInTheDocument();
      expect(screen.getByText(`${pct60_plus.toFixed(1)}%`)).toBeInTheDocument();
    });

    it('TC-AGV-02: empty customer list sums to 0% without NaN or division by zero errors', () => {
      act(() => {
        usePayPilotStore.setState({
          udhariCustomers: [],
          udhariSummary: {
            totalOutstandingCredit: 0,
            recoveredThisMonth: 0,
            averageCollectionDays: 0,
            highRiskAccountsCount: 0,
          } as any,
        });
      });

      render(<AgingBucketVisualizer selectedBucket="ALL" onSelectBucket={vi.fn()} />);

      const zeroAmounts = screen.getAllByText('$0.00');
      // Should find at least 5 zero amounts: total in header + 4 cards
      expect(zeroAmounts.length).toBeGreaterThanOrEqual(5);

      const zeroPcts = screen.getAllByText('0.0%');
      expect(zeroPcts.length).toBe(4);

      // Segmented progress bar has 0 segments rendered (no NaN styles)
      const progressBar = screen.getByTestId('aging-progress-bar');
      expect(progressBar.children.length).toBe(0);
    });

    it('TC-AGV-03: single-bucket concentration concentrates 100% in one bucket and 0% in others', () => {
      const singleCustomer: UdhariCustomer = {
        id: 'UDH-SOLO',
        customerCode: 'CUST-SOLO',
        customerName: 'Solo Debtor',
        businessName: 'Solo Corp',
        contactEmail: 'solo@example.com',
        contactPhone: '+1-555-000-0000',
        creditLimit: 5000,
        totalCreditGiven: 5000,
        totalRepaid: 0,
        outstandingBalance: 5000,
        dueDate: '2024-08-01',
        daysOverdue: 95,
        agingBucket: '60_PLUS_DAYS',
        riskTier: 'HIGH',
        trustScore: 30,
        remindersCount: 5,
        repaymentHistory: [],
      };

      act(() => {
        usePayPilotStore.setState({
          udhariCustomers: [singleCustomer],
          udhariSummary: {
            totalOutstandingCredit: 5000,
            recoveredThisMonth: 0,
            averageCollectionDays: 95,
            highRiskAccountsCount: 1,
          } as any,
        });
      });

      render(<AgingBucketVisualizer selectedBucket="ALL" onSelectBucket={vi.fn()} />);

      expect(screen.getByText('100.0%')).toBeInTheDocument();
      const zeroPcts = screen.getAllByText('0.0%');
      expect(zeroPcts.length).toBe(3);

      // 60+ days card has $5,000.00
      const card60 = screen.getByTestId('aging-card-60_PLUS_DAYS');
      expect(within(card60).getByText('$5,000.00')).toBeInTheDocument();
      expect(within(card60).getByText('100.0%')).toBeInTheDocument();
    });

    it('TC-AGV-04: interactive coordination: clicking bucket filters UdhariLedgerTable and reset button restores all rows', () => {
      // Integration Harness component binding AgingBucketVisualizer and UdhariLedgerTable
      const Harness: React.FC = () => {
        const [bucket, setBucket] = useState<AgingBucket | 'ALL'>('ALL');
        return (
          <div data-testid="harness">
            <AgingBucketVisualizer selectedBucket={bucket} onSelectBucket={setBucket} />
            <UdhariLedgerTable selectedBucket={bucket} />
          </div>
        );
      };

      render(<Harness />);

      // Helper to check account count text
      const verifyAccountCount = (showing: number, total: number) => {
        const indicator = screen.getByText((content, element) => {
          return (
            element?.tagName.toLowerCase() === 'span' &&
            Boolean(element?.textContent?.includes(`Showing ${showing} of ${total} accounts`))
          );
        });
        expect(indicator).toBeInTheDocument();
      };

      // Initially shows all accounts (5 accounts in seed data)
      verifyAccountCount(5, 5);
      expect(screen.queryByTestId('reset-bucket-filter')).not.toBeInTheDocument();

      // Click on "31 - 60 Days (Delinquent)" card
      const delinquentCard = screen.getByTestId('aging-card-31_60_DAYS');
      act(() => {
        fireEvent.click(delinquentCard);
      });

      // Filtered status appears in header
      expect(screen.getByText(/Filtered: 31_60_DAYS/i)).toBeInTheDocument();

      // Reset button appears
      const resetBtn = screen.getByTestId('reset-bucket-filter');
      expect(resetBtn).toBeInTheDocument();

      // UdhariLedgerTable now shows only 31_60_DAYS accounts (1 account: Vertex Architectural Design)
      verifyAccountCount(1, 5);

      // Click reset button ("Show All Accounts")
      act(() => {
        fireEvent.click(resetBtn);
      });

      // Restores all 5 accounts
      verifyAccountCount(5, 5);
      expect(screen.queryByTestId('reset-bucket-filter')).not.toBeInTheDocument();

      // Click bar segment for 0_15_DAYS
      const barSegment = screen.getByTestId('bar-segment-0_15_DAYS');
      act(() => {
        fireEvent.click(barSegment);
      });

      // Filters to 0_15_DAYS (2 accounts: Nexus Global Logistics & Horizon Energy)
      expect(screen.getByText(/Filtered: 0_15_DAYS/i)).toBeInTheDocument();
      verifyAccountCount(2, 5);

      // Clicking the active card toggles back to ALL
      const currentCard = screen.getByTestId('aging-card-0_15_DAYS');
      act(() => {
        fireEvent.click(currentCard);
      });

      verifyAccountCount(5, 5);
    });
  });

  // =========================================================================
  // 3. SETTLEMENT DISCOUNT & DEBT REDUCTION ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('Suite 3: Settlement Discount Calculations & Debt Balance Reductions', () => {
    it('TC-SET-01: calculates exact discount and net settlement amounts across all tiers (5%, 10%, 15%)', () => {
      render(<UdhariLedgerTable />);

      const firstCustomer = usePayPilotStore.getState().udhariCustomers[0];
      const originalBal = firstCustomer.outstandingBalance; // $4,200.00

      // Open settlement modal
      const settleBtns = screen.getAllByTitle('Offer Settlement Discount');
      act(() => {
        fireEvent.click(settleBtns[0]);
      });

      expect(screen.getByTestId('settlement-modal-backdrop')).toBeInTheDocument();
      expect(screen.getByText('Offer Immediate Settlement Discount')).toBeInTheDocument();

      // 1. Default Tier: 5%
      const discount5 = (originalBal * 0.05).toFixed(2); // 210.00
      const net5 = (originalBal * 0.95).toFixed(2); // 3990.00
      // Check in button and breakdown
      const discount5Elements = screen.getAllByText(`-$${discount5}`);
      expect(discount5Elements.length).toBe(2); // In button and breakdown row
      expect(screen.getByText(`$${net5}`)).toBeInTheDocument();

      // 2. Select Tier: 10%
      const btn10 = screen.getByText('10% OFF');
      act(() => {
        fireEvent.click(btn10);
      });

      const discount10 = (originalBal * 0.10).toFixed(2); // 420.00
      const net10 = (originalBal * 0.90).toFixed(2); // 3780.00
      const discount10Elements = screen.getAllByText(`-$${discount10}`);
      expect(discount10Elements.length).toBe(2);
      expect(screen.getByText(`$${net10}`)).toBeInTheDocument();

      // 3. Select Tier: 15%
      const btn15 = screen.getByText('15% OFF');
      act(() => {
        fireEvent.click(btn15);
      });

      const discount15 = (originalBal * 0.15).toFixed(2); // 630.00
      const net15 = (originalBal * 0.85).toFixed(2); // 3570.00
      const discount15Elements = screen.getAllByText(`-$${discount15}`);
      expect(discount15Elements.length).toBe(2);
      expect(screen.getByText(`$${net15}`)).toBeInTheDocument();
    });

    it('TC-SET-02: executing settlement reduces customer debt balance to 0 and updates total credit ledger', () => {
      render(<UdhariLedgerTable />);

      const customer = usePayPilotStore.getState().udhariCustomers[0];
      const customerId = customer.id;
      const initialTotalCredit = usePayPilotStore.getState().udhariSummary.totalOutstandingCredit;
      const initialRecovered = usePayPilotStore.getState().udhariSummary.recoveredThisMonth;

      // Open settlement modal and select 10% discount
      const settleBtns = screen.getAllByTitle('Offer Settlement Discount');
      act(() => {
        fireEvent.click(settleBtns[0]);
      });

      const btn10 = screen.getByText('10% OFF');
      act(() => {
        fireEvent.click(btn10);
      });

      // Record immediate settlement
      const recordBtn = screen.getByText('Record Immediate Settlement');
      act(() => {
        fireEvent.click(recordBtn);
      });

      // Modal closed
      expect(screen.queryByTestId('settlement-modal-backdrop')).not.toBeInTheDocument();

      // Verify Store State Updates
      const updatedCustomer = usePayPilotStore.getState().udhariCustomers.find((c) => c.id === customerId);
      expect(updatedCustomer).toBeDefined();
      expect(updatedCustomer!.outstandingBalance).toBe(0); // Debt cleared
      expect(updatedCustomer!.totalRepaid).toBe(customer.totalRepaid + customer.outstandingBalance);

      // Repayment history updated
      const latestRepayment = updatedCustomer!.repaymentHistory[updatedCustomer!.repaymentHistory.length - 1];
      expect(latestRepayment).toBeDefined();
      expect(latestRepayment.amount).toBe(customer.outstandingBalance);
      expect(latestRepayment.method).toBe('PAYPAL');

      // Total outstanding credit in summary decreased by settled balance
      const newTotalCredit = usePayPilotStore.getState().udhariSummary.totalOutstandingCredit;
      expect(newTotalCredit).toBe(initialTotalCredit - customer.outstandingBalance);

      // Recovered this month increased
      const newRecovered = usePayPilotStore.getState().udhariSummary.recoveredThisMonth;
      expect(newRecovered).toBe(initialRecovered + customer.outstandingBalance);

      // Toast feedback appears in table
      expect(screen.getByText(/Settlement of \$3780.00 recorded via PayPal/i)).toBeInTheDocument();
    });

    it('TC-SET-03: handles fractional odd cents balance settlement without precision drift', () => {
      // Inject customer with odd cents
      const oddCustomer: UdhariCustomer = {
        id: 'UDH-ODD',
        customerCode: 'CUST-ODD',
        customerName: 'Fractional Faucet',
        businessName: 'Odd Cents LLC',
        contactEmail: 'odd@cents.io',
        contactPhone: '+1-555-999-1234',
        creditLimit: 1000,
        totalCreditGiven: 1000,
        totalRepaid: 0,
        outstandingBalance: 123.45,
        dueDate: '2024-10-01',
        daysOverdue: 20,
        agingBucket: '16_30_DAYS',
        riskTier: 'MEDIUM',
        trustScore: 70,
        remindersCount: 1,
        repaymentHistory: [],
      };

      act(() => {
        usePayPilotStore.setState({
          udhariCustomers: [oddCustomer],
        });
      });

      render(<UdhariLedgerTable />);

      const settleBtn = screen.getByTitle('Offer Settlement Discount');
      act(() => {
        fireEvent.click(settleBtn);
      });

      // 5% of 123.45 = 6.1725 -> 6.17
      // Net: 123.45 * 0.95 = 117.2775 -> 117.28
      const discount5Elements = screen.getAllByText('-$6.17');
      expect(discount5Elements.length).toBe(2);
      expect(screen.getByText('$117.28')).toBeInTheDocument();

      // 15% of 123.45 = 18.5175 -> 18.52
      // Net: 123.45 * 0.85 = 104.9325 -> 104.93
      const btn15 = screen.getByText('15% OFF');
      act(() => {
        fireEvent.click(btn15);
      });
      const discount15Elements = screen.getAllByText('-$18.52');
      expect(discount15Elements.length).toBe(2);
      expect(screen.getByText('$104.93')).toBeInTheDocument();
    });
  });
});
