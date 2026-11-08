import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { InteractiveCashCurve } from '../components/charts/InteractiveCashCurve';
import { CommitmentGanttChart } from '../components/charts/CommitmentGanttChart';
import { CommitmentsView } from '../views/CommitmentsView';
import { SimulationLabView } from '../views/SimulationLabView';
import { usePayPilotStore, calculateCashFlowProjections } from '../store/usePayPilotStore';
import { CommitmentItem, SimulationParameters } from '../types';

describe('Challenger M4: Adversarial Stress & Edge Cases for Cash Curve, Sliders, and Gantt', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  // ==========================================================================
  // SUITE 1: Slider Edge Values & Extreme Mathematical Projections
  // ==========================================================================
  describe('Suite 1: Slider Edge Values & Extreme Mathematical Projections', () => {
    it('handles 0% upfront deposit cleanly without producing NaN or projection corruption', () => {
      const res = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 0,
        customerPaymentDelayDays: 15,
        milestoneSplit: [0, 50, 50],
        milestonePreset: '50_50',
      });

      expect(res.dailyProjections).toHaveLength(91); // days 0 to 90
      expect(res.dailyProjections[0].inFlow).toBe(2200); // 2200 base, 0 upfront
      res.dailyProjections.forEach((p) => {
        expect(Number.isFinite(p.balance)).toBe(true);
        expect(Number.isNaN(p.balance)).toBe(false);
      });
      expect(res.minimumCashPoint.amount).toBeLessThanOrEqual(res.dailyProjections[0].balance);
      expect(Number.isFinite(res.projectedRunwayDays)).toBe(true);
    });

    it('handles 100% upfront deposit cleanly (entire pipeline contract upfront)', () => {
      const res = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 100,
        customerPaymentDelayDays: 15,
        milestoneSplit: [100, 0, 0],
        milestonePreset: '30_40_30',
      });

      expect(res.dailyProjections).toHaveLength(91);
      // Day 0 gets 2200 base + 60,000 upfront
      expect(res.dailyProjections[0].inFlow).toBe(62200);
      // Later milestone days get 0 additional milestone share
      const midDay = 30 + 15;
      expect(res.dailyProjections[midDay].inFlow).toBe(2200);
      res.dailyProjections.forEach((p) => {
        expect(Number.isFinite(p.balance)).toBe(true);
      });
    });

    it('handles negative and 0 payment delay days defensively', () => {
      // 0 days delay
      const resZero = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: 0,
        milestoneSplit: [30, 40, 30],
        milestonePreset: '30_40_30',
      });
      expect(resZero.dailyProjections).toHaveLength(91);
      expect(resZero.dailyProjections[30].inFlow).toBeGreaterThan(2200);

      // Negative delay: e.g. -20 days
      const resNeg = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: -20,
        milestoneSplit: [30, 40, 30],
        milestonePreset: '30_40_30',
      });
      expect(resNeg.dailyProjections).toHaveLength(91);
      resNeg.dailyProjections.forEach((p) => {
        expect(p.dayIndex).toBeGreaterThanOrEqual(0);
        expect(p.dayIndex).toBeLessThanOrEqual(90);
        expect(Number.isFinite(p.balance)).toBe(true);
      });
    });

    it('handles maximum 90-day delay (deferring client payments to boundary of model)', () => {
      const res = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: 90,
        milestoneSplit: [30, 40, 30],
        milestonePreset: '30_40_30',
      });

      // Both mid and final payment days clamped to day 90
      expect(res.dailyProjections[90].inFlow).toBeGreaterThan(2200);
      expect(res.dailyProjections[89].inFlow).toBe(2200);
      expect(res.minimumCashPoint.dayIndex).toBeGreaterThanOrEqual(0);
      expect(res.minimumCashPoint.dayIndex).toBeLessThanOrEqual(90);
    });

    it('survives extreme milestone splits (0/100, 100/0, 0/0) without division-by-zero or NaN', () => {
      // 0 / 100 split
      const res0_100 = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: 15,
        milestoneSplit: [0, 100, 0],
        milestonePreset: '30_40_30',
      });
      expect(Number.isNaN(res0_100.dailyProjections[45].inFlow)).toBe(false);

      // 100 / 0 / 0 split (mid and final are 0)
      const res100_0 = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: 15,
        milestoneSplit: [100, 0, 0],
        milestonePreset: '30_40_30',
      });
      expect(Number.isNaN(res100_0.dailyProjections[45].inFlow)).toBe(false);
      expect(Number.isNaN(res100_0.dailyProjections[75].inFlow)).toBe(false);

      // All zero split [0, 0, 0]
      const resZeroSplit = calculateCashFlowProjections(142500, {
        upfrontDepositPct: 20,
        customerPaymentDelayDays: 15,
        milestoneSplit: [0, 0, 0],
        milestonePreset: '30_40_30',
      });
      resZeroSplit.dailyProjections.forEach((p) => {
        expect(Number.isFinite(p.balance)).toBe(true);
        expect(Number.isNaN(p.inFlow)).toBe(false);
      });
    });
  });

  // ==========================================================================
  // SUITE 2: High-Frequency Slider Dragging & SVG Path Integrity
  // ==========================================================================
  describe('Suite 2: High-Frequency Slider Dragging & SVG Path Integrity', () => {
    it('survives 200 rapid high-frequency slider adjustments without DOM corruption or NaN coordinates', () => {
      const { container } = render(<InteractiveCashCurve showSliders={true} />);

      const depositSlider = screen.getByTestId('slider-deposit');
      const delaySlider = screen.getByTestId('slider-delay');

      const startTime = performance.now();

      // Simulate aggressive user scrubbing back and forth across 200 events
      act(() => {
        for (let i = 0; i < 200; i++) {
          const depVal = (i * 7) % 55; // 0 to 50+
          const delVal = (i * 11) % 65; // 0 to 60+
          fireEvent.change(depositSlider, { target: { value: String(depVal) } });
          fireEvent.change(delaySlider, { target: { value: String(delVal) } });
        }
      });

      const duration = performance.now() - startTime;
      // Should easily execute 200 updates well within reasonable threshold under test runner load
      expect(duration).toBeLessThan(30000);

      // Inspect rendered SVG cash curve path elements
      const svg = screen.getByTestId('cash-curve-svg');
      expect(svg).toBeInTheDocument();

      const paths = svg.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(2); // stroke and area fill

      paths.forEach((path) => {
        const d = path.getAttribute('d');
        expect(d).toBeTruthy();
        expect(d).not.toContain('NaN');
        expect(d).not.toContain('undefined');
        expect(d).not.toContain('Infinity');
        // Valid SVG path command start
        expect(d?.startsWith('M')).toBe(true);
      });

      // Verify circles (dip beacon, etc.) have valid finite coordinates
      const circles = svg.querySelectorAll('circle');
      circles.forEach((circle) => {
        const cx = circle.getAttribute('cx');
        const cy = circle.getAttribute('cy');
        const r = circle.getAttribute('r');
        if (cx !== null) expect(Number.isFinite(parseFloat(cx))).toBe(true);
        if (cy !== null) expect(Number.isFinite(parseFloat(cy))).toBe(true);
        if (r !== null) expect(Number.isFinite(parseFloat(r))).toBe(true);
      });
    });

    it('pointer hover tracking over SVG handles boundary and rapid mouse movement without crashing', () => {
      const hoverFn = vi.fn();
      render(<InteractiveCashCurve onPointHover={hoverFn} />);

      const svg = screen.getByTestId('cash-curve-svg');

      // Mock getBoundingClientRect for SVG
      svg.getBoundingClientRect = () => ({
        left: 100,
        top: 50,
        width: 920,
        height: 340,
        right: 1020,
        bottom: 390,
        x: 100,
        y: 50,
        toJSON: () => {},
      });

      // Rapid pointer movement across width
      act(() => {
        for (let x = 50; x <= 950; x += 50) {
          fireEvent.pointerMove(svg, { clientX: 100 + x });
        }
        fireEvent.pointerLeave(svg);
      });

      // Hover callback should have been called and ended with null on pointer leave
      expect(hoverFn).toHaveBeenCalled();
      expect(hoverFn).toHaveBeenLastCalledWith(null);
    });
  });

  // ==========================================================================
  // SUITE 3: Lowest Dip Marker Detection Across Extreme Starting Balances
  // ==========================================================================
  describe('Suite 3: Lowest Dip Marker Detection Across Extreme Starting Balances', () => {
    it('detects and renders lowest dip marker when starting balance is deeply negative (-$50,000)', () => {
      act(() => {
        usePayPilotStore.setState((state) => ({
          executiveKpis: {
            ...state.executiveKpis,
            totalAvailableCash: -50000,
          },
        }));
        usePayPilotStore.getState().updateSimulationParameters({
          upfrontDepositPct: 10,
          customerPaymentDelayDays: 30,
        });
      });

      const { container } = render(<InteractiveCashCurve />);

      // Projections will be in deficit
      const simState = usePayPilotStore.getState().simulationState;
      expect(simState.minimumCashPoint.amount).toBeLessThan(0);
      expect(simState.isBufferBreached).toBe(true);
      expect(simState.projectedRunwayDays).toBe(0);

      // Verify Dip text rendered in DOM
      expect(screen.getByText(/Dip:\s*\$?-/)).toBeInTheDocument();
      expect(screen.getByText('BUFFER BREACHED')).toBeInTheDocument();

      // Check SVG dip marker transform is valid
      const svg = screen.getByTestId('cash-curve-svg');
      const dipBeaconGroup = svg.querySelector('g[transform^="translate("]');
      expect(dipBeaconGroup).not.toBeNull();
      const transform = dipBeaconGroup?.getAttribute('transform');
      expect(transform).not.toContain('NaN');
    });

    it('detects and renders lowest dip marker when starting balance is $0', () => {
      act(() => {
        usePayPilotStore.setState((state) => ({
          executiveKpis: {
            ...state.executiveKpis,
            totalAvailableCash: 0,
          },
        }));
        usePayPilotStore.getState().updateSimulationParameters({
          upfrontDepositPct: 0,
          customerPaymentDelayDays: 15,
        });
      });

      render(<InteractiveCashCurve />);

      const simState = usePayPilotStore.getState().simulationState;
      expect(simState.minimumCashPoint.amount).toBeLessThanOrEqual(0);
      expect(simState.isBufferBreached).toBe(true);

      const svg = screen.getByTestId('cash-curve-svg');
      expect(svg.innerHTML).not.toContain('NaN');
    });

    it('detects lowest dip marker and scales Y-axis without overflow when starting balance is $100,000,000', () => {
      act(() => {
        usePayPilotStore.setState((state) => ({
          executiveKpis: {
            ...state.executiveKpis,
            totalAvailableCash: 100000000,
          },
        }));
        usePayPilotStore.getState().updateSimulationParameters({
          upfrontDepositPct: 50,
          customerPaymentDelayDays: 5,
        });
      });

      render(<InteractiveCashCurve />);

      const simState = usePayPilotStore.getState().simulationState;
      expect(simState.minimumCashPoint.amount).toBeGreaterThan(99000000);
      expect(simState.isBufferBreached).toBe(false);
      expect(screen.getByText('BUFFER INTACT')).toBeInTheDocument();

      const svg = screen.getByTestId('cash-curve-svg');
      const paths = svg.querySelectorAll('path');
      paths.forEach((p) => {
        const d = p.getAttribute('d');
        expect(d).not.toContain('NaN');
        expect(d).not.toContain('Infinity');
      });
    });
  });

  // ==========================================================================
  // SUITE 4: Safety Buffer Breach Zone & Visual Coordinate Validation
  // ==========================================================================
  describe('Suite 4: Safety Buffer Breach Zone & Visual Coordinate Validation', () => {
    it('renders valid SVG breach rectangle when balance never dips below safety buffer ($15,000)', () => {
      act(() => {
        usePayPilotStore.setState((state) => ({
          executiveKpis: {
            ...state.executiveKpis,
            totalAvailableCash: 250000, // Very healthy cash
          },
        }));
        usePayPilotStore.getState().updateSimulationParameters({
          upfrontDepositPct: 50,
          customerPaymentDelayDays: 0,
        });
      });

      render(<InteractiveCashCurve />);

      const svg = screen.getByTestId('cash-curve-svg');
      // Look for the breach rectangle that uses url(#safetyBreachGradient)
      const breachRect = svg.querySelector('rect[fill="url(#safetyBreachGradient)"]');
      expect(breachRect).not.toBeNull();

      const y = parseFloat(breachRect?.getAttribute('y') || '0');
      const height = parseFloat(breachRect?.getAttribute('height') || '0');
      const width = parseFloat(breachRect?.getAttribute('width') || '0');

      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(height)).toBe(true);
      expect(Number.isFinite(width)).toBe(true);
      expect(height).toBeGreaterThanOrEqual(0);
      expect(width).toBeGreaterThan(0);
      expect(screen.getByText('BUFFER INTACT')).toBeInTheDocument();
    });

    it('renders valid SVG breach rectangle when balance always stays below safety buffer ($15,000)', () => {
      act(() => {
        usePayPilotStore.setState((state) => ({
          executiveKpis: {
            ...state.executiveKpis,
            totalAvailableCash: 5000, // Deep under $15k threshold
          },
        }));
        usePayPilotStore.getState().updateSimulationParameters({
          upfrontDepositPct: 0,
          customerPaymentDelayDays: 60,
        });
      });

      render(<InteractiveCashCurve />);

      const svg = screen.getByTestId('cash-curve-svg');
      const breachRect = svg.querySelector('rect[fill="url(#safetyBreachGradient)"]');
      expect(breachRect).not.toBeNull();

      const height = parseFloat(breachRect?.getAttribute('height') || '0');
      expect(height).toBeGreaterThan(0);
      expect(Number.isNaN(height)).toBe(false);
      expect(screen.getByText('BUFFER BREACHED')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SUITE 5: Gantt Chart Time Horizon Shifts & Boundary Rendering
  // ==========================================================================
  describe('Suite 5: Gantt Chart Time Horizon Shifts & Boundary Rendering', () => {
    const stressCommitments: CommitmentItem[] = [
      {
        id: 'CMT-NOW',
        referenceNumber: 'PO-2024-NOW',
        title: 'Same-Day Urgent Supply',
        counterparty: 'Rapid Deliveries LLC',
        category: 'SUPPLIER_INVENTORY',
        startDate: '2024-11-06',
        dueDate: '2024-11-06', // Same-day
        totalCommittedAmount: 5000,
        amountPaidToDate: 5000,
        pendingBalance: 0,
        paymentTerms: 'DUE_ON_RECEIPT',
        milestones: [],
        firewallStatus: 'APPROVED_SAFE',
        firewallVerdict: {
          safe: true,
          lowestProjectedBuffer: 30000,
          explanation: 'Safe headroom intact',
        },
        priority: 'MEDIUM',
      },
      {
        id: 'CMT-OVERDUE',
        referenceNumber: 'PO-2024-PAST',
        title: 'Past Overdue Software',
        counterparty: 'Legacy Tech',
        category: 'SAAS_TOOLS',
        startDate: '2024-10-10',
        dueDate: '2024-10-25', // Overdue
        totalCommittedAmount: 7000,
        amountPaidToDate: 0,
        pendingBalance: 7000,
        paymentTerms: 'NET_15',
        milestones: [],
        firewallStatus: 'WARNING_BUFFER_TIGHT',
        firewallVerdict: {
          safe: true,
          lowestProjectedBuffer: 17000,
          explanation: 'Safety buffer tight',
        },
        priority: 'HIGH',
      },
      {
        id: 'CMT-30D',
        referenceNumber: 'PO-2024-30',
        title: 'Mid-term Rent',
        counterparty: 'WeWork Global',
        category: 'OFFICE_RENT',
        startDate: '2024-11-06',
        dueDate: '2024-12-01', // ~25 days out
        totalCommittedAmount: 18000,
        amountPaidToDate: 0,
        pendingBalance: 18000,
        paymentTerms: 'NET_30',
        milestones: [{ id: 'm1', name: 'Deposit', dueDate: '2024-11-15', percentageSplit: 50, amount: 9000, isPaid: true }],
        firewallStatus: 'APPROVED_SAFE',
        firewallVerdict: {
          safe: true,
          lowestProjectedBuffer: 28000,
          explanation: 'Safe headroom intact',
        },
        priority: 'HIGH',
      },
      {
        id: 'CMT-150D',
        referenceNumber: 'PO-2024-150',
        title: 'Long-term Equipment Lease',
        counterparty: 'Heavy Industries Corp',
        category: 'SUPPLIER_INVENTORY',
        startDate: '2024-11-06',
        dueDate: '2025-04-05', // ~150 days out
        totalCommittedAmount: 45000,
        amountPaidToDate: 0,
        pendingBalance: 45000,
        paymentTerms: 'NET_60',
        milestones: [],
        firewallStatus: 'APPROVED_SAFE',
        firewallVerdict: {
          safe: true,
          lowestProjectedBuffer: 22000,
          explanation: 'Safe headroom intact',
        },
        priority: 'MEDIUM',
      },
    ];

    it('renders and shifts time horizons (30d -> 60d -> 90d -> 180d) with zero out-of-bounds bar rendering or SVG coordinate NaN', () => {
      const { rerender } = render(
        <CommitmentGanttChart commitments={stressCommitments} horizonDays={30} />
      );

      const horizons: Array<30 | 60 | 90 | 180> = [30, 60, 90, 180];

      horizons.forEach((h) => {
        rerender(<CommitmentGanttChart commitments={stressCommitments} horizonDays={h} />);

        const svg = screen.getByTestId('gantt-svg-canvas');
        expect(svg).toBeInTheDocument();

        // Check all rects in SVG
        const rects = svg.querySelectorAll('rect');
        rects.forEach((rect) => {
          const x = rect.getAttribute('x');
          const y = rect.getAttribute('y');
          const width = rect.getAttribute('width');
          const height = rect.getAttribute('height');

          if (x !== null) {
            expect(x).not.toContain('NaN');
            const numX = parseFloat(x);
            expect(Number.isFinite(numX)).toBe(true);
            expect(numX).toBeGreaterThanOrEqual(0);
          }
          if (width !== null) {
            expect(width).not.toContain('NaN');
            const numW = parseFloat(width);
            expect(Number.isFinite(numW)).toBe(true);
            expect(numW).toBeGreaterThanOrEqual(0);
          }
          if (height !== null) {
            expect(height).not.toContain('NaN');
          }
        });

        // Check line elements
        const lines = svg.querySelectorAll('line');
        lines.forEach((line) => {
          ['x1', 'x2', 'y1', 'y2'].forEach((attr) => {
            const val = line.getAttribute(attr);
            if (val !== null) {
              expect(val).not.toContain('NaN');
              expect(Number.isFinite(parseFloat(val))).toBe(true);
            }
          });
        });

        // Check milestone circles
        const circles = svg.querySelectorAll('circle');
        circles.forEach((circle) => {
          const cx = circle.getAttribute('cx');
          const cy = circle.getAttribute('cy');
          if (cx !== null) expect(Number.isFinite(parseFloat(cx))).toBe(true);
          if (cy !== null) expect(Number.isFinite(parseFloat(cy))).toBe(true);
        });
      });
    });

    it('properly marks overdue commitment with hatch pattern without crashing', () => {
      render(<CommitmentGanttChart commitments={stressCommitments} horizonDays={90} />);

      const svg = screen.getByTestId('gantt-svg-canvas');
      const overdueRect = svg.querySelector('rect[fill="url(#overdueHatch)"]');
      expect(overdueRect).not.toBeNull();
      expect(overdueRect?.getAttribute('stroke')).toBe('#ef4444');
    });

    it('enforces minimum bar width of 32px even for same-day delivery', () => {
      render(<CommitmentGanttChart commitments={stressCommitments} horizonDays={90} />);

      const sameDayRow = screen.getByText('Rapid Deliveries LLC').closest('g');
      expect(sameDayRow).not.toBeNull();

      const barRect = sameDayRow?.querySelector('rect[stroke="#f59e0b"]');
      const width = parseFloat(barRect?.getAttribute('width') || '0');
      expect(width).toBeGreaterThanOrEqual(32);
    });
  });

  // ==========================================================================
  // SUITE 6: Order Evaluation Simulator Edge Cases
  // ==========================================================================
  describe('Suite 6: Order Evaluation Simulator Edge Cases', () => {
    it('evaluates ultra-micro order amount of $0.01 as safe with proper decimal formatting', () => {
      render(<CommitmentsView />);

      const vendorInput = screen.getByTestId('input-vendor-name');
      const amountInput = screen.getByTestId('input-order-amount');
      const commitBtn = screen.getByTestId('btn-commit-order');

      act(() => {
        fireEvent.change(vendorInput, { target: { value: 'Micro Services Inc' } });
        fireEvent.change(amountInput, { target: { value: '0.01' } });
      });

      // Live verdict banner
      const banner = screen.getByTestId('firewall-verdict-banner');
      expect(banner).toHaveTextContent(/PASS/);
      expect(banner).toHaveTextContent(/0\.01/);

      act(() => {
        fireEvent.click(commitBtn);
      });

      expect(screen.getByTestId('order-commit-success')).toHaveTextContent(
        /Order committed! PO #PO-2024-\d+ for \$0\.01 added to schedule/
      );

      // Verify in store
      const added = usePayPilotStore
        .getState()
        .commitments.find((c) => c.counterparty === 'Micro Services Inc');
      expect(added).toBeDefined();
      expect(added?.totalCommittedAmount).toBe(0.01);
      expect(added?.firewallStatus).toBe('APPROVED_SAFE');
    });

    it('evaluates extreme mega order of $10,000,000 as CRITICAL_BUFFER_BREACH', () => {
      render(<CommitmentsView />);

      const vendorInput = screen.getByTestId('input-vendor-name');
      const amountInput = screen.getByTestId('input-order-amount');
      const commitBtn = screen.getByTestId('btn-commit-order');

      act(() => {
        fireEvent.change(vendorInput, { target: { value: 'Mega Infrastructure Corp' } });
        fireEvent.change(amountInput, { target: { value: '10000000' } });
      });

      const banner = screen.getByTestId('firewall-verdict-banner');
      expect(banner).toHaveTextContent(/BLOCK: Force-Field Collapse/);
      expect(banner).toHaveTextContent(/10,000,000/);

      act(() => {
        fireEvent.click(commitBtn);
      });

      const added = usePayPilotStore
        .getState()
        .commitments.find((c) => c.counterparty === 'Mega Infrastructure Corp');
      expect(added).toBeDefined();
      expect(added?.firewallStatus).toBe('CRITICAL_BUFFER_BREACH');
      expect(added?.firewallVerdict.safe).toBe(false);
    });

    it('handles past target date and adds overdue commitment safely', () => {
      render(<CommitmentsView />);

      const vendorInput = screen.getByTestId('input-vendor-name');
      const amountInput = screen.getByTestId('input-order-amount');
      const dateInput = screen.getByTestId('input-target-date');
      const commitBtn = screen.getByTestId('btn-commit-order');

      act(() => {
        fireEvent.change(vendorInput, { target: { value: 'Past Due Vendor' } });
        fireEvent.change(amountInput, { target: { value: '4500' } });
        fireEvent.change(dateInput, { target: { value: '2024-10-15' } }); // Past date
      });

      act(() => {
        fireEvent.click(commitBtn);
      });

      expect(screen.getByTestId('order-commit-success')).toBeInTheDocument();
      const added = usePayPilotStore
        .getState()
        .commitments.find((c) => c.counterparty === 'Past Due Vendor');
      expect(added?.dueDate).toBe('2024-10-15');
    });

    it('handles same-day delivery with DUE_ON_RECEIPT terms correctly', () => {
      render(<CommitmentsView />);

      const vendorInput = screen.getByTestId('input-vendor-name');
      const amountInput = screen.getByTestId('input-order-amount');
      const termsSelect = screen.getByTestId('select-payment-terms');
      const dateInput = screen.getByTestId('input-target-date');
      const commitBtn = screen.getByTestId('btn-commit-order');

      act(() => {
        fireEvent.change(vendorInput, { target: { value: 'Immediate Cash Supplier' } });
        fireEvent.change(amountInput, { target: { value: '3200' } });
        fireEvent.change(dateInput, { target: { value: '2024-11-06' } });
        fireEvent.change(termsSelect, { target: { value: 'DUE_ON_RECEIPT' } });
      });

      act(() => {
        fireEvent.click(commitBtn);
      });

      const added = usePayPilotStore
        .getState()
        .commitments.find((c) => c.counterparty === 'Immediate Cash Supplier');
      expect(added).toBeDefined();
      expect(added?.paymentTerms).toBe('DUE_ON_RECEIPT');
      expect(added?.amountPaidToDate).toBe(3200);
      expect(added?.pendingBalance).toBe(0);
    });

    it('validates whitespace-only vendor names and negative order amounts cleanly', () => {
      render(<CommitmentsView />);

      const vendorInput = screen.getByTestId('input-vendor-name');
      const amountInput = screen.getByTestId('input-order-amount');
      const commitBtn = screen.getByTestId('btn-commit-order');

      // Whitespace vendor
      act(() => {
        fireEvent.change(vendorInput, { target: { value: '    ' } });
        fireEvent.change(amountInput, { target: { value: '500' } });
        fireEvent.click(commitBtn);
      });
      expect(screen.getByTestId('order-validation-error')).toHaveTextContent(
        'Vendor name is required.'
      );

      // Negative amount
      act(() => {
        fireEvent.change(vendorInput, { target: { value: 'Acme Supplies' } });
        fireEvent.change(amountInput, { target: { value: '-2500' } });
        fireEvent.click(commitBtn);
      });
      expect(screen.getByTestId('order-validation-error')).toHaveTextContent(
        'Order amount must be greater than $0.'
      );
    });
  });

  // ==========================================================================
  // SUITE 7: End-to-End Simulation Lab Scenario Integration
  // ==========================================================================
  describe('Suite 7: End-to-End Simulation Lab Scenario Integration', () => {
    it('applies Optimistic, Conservative, and Baseline scenarios cleanly with HUD updates', () => {
      render(<SimulationLabView />);

      const hudDip = screen.getByTestId('hud-lowest-dip');
      const hudRunway = screen.getByTestId('hud-runway-days');
      const hudCushion = screen.getByTestId('hud-buffer-cushion');

      // Initial baseline
      expect(hudDip).toBeInTheDocument();
      expect(hudRunway).toBeInTheDocument();
      expect(hudCushion).toBeInTheDocument();

      // Click Apply Optimistic
      const optBtn = screen.getByTestId('btn-apply-optimistic');
      act(() => {
        fireEvent.click(optBtn);
      });
      expect(usePayPilotStore.getState().simulationState.selectedScenario).toBe('OPTIMISTIC');
      expect(screen.getByText('Active Track')).toBeInTheDocument();

      // Click Apply Conservative
      const consBtn = screen.getByTestId('btn-apply-conservative');
      act(() => {
        fireEvent.click(consBtn);
      });
      expect(usePayPilotStore.getState().simulationState.selectedScenario).toBe('CONSERVATIVE');

      // Click Apply Baseline
      const baseBtn = screen.getByTestId('btn-apply-baseline');
      act(() => {
        fireEvent.click(baseBtn);
      });
      expect(usePayPilotStore.getState().simulationState.selectedScenario).toBe('BASELINE');
    });

    it('exports CSV comparison file without errors', () => {
      render(<SimulationLabView />);

      const exportBtn = screen.getByTestId('btn-export-csv');
      expect(exportBtn).toBeInTheDocument();

      // Mock createObjectURL & revokeObjectURL
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = vi.fn();

      act(() => {
        fireEvent.click(exportBtn);
      });

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    });
  });
});
