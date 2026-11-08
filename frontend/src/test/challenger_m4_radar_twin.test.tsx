import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { SurvivalRadarChart } from '../components/charts/SurvivalRadarChart';
import { SurvivalRadarView } from '../views/SurvivalRadarView';
import { DigitalTwinView } from '../views/DigitalTwinView';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { RadarDimensionScore } from '../types';

// Standard 6-axis test dimensions
const test6Dimensions: RadarDimensionScore[] = [
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
];

describe('Adversarial Challenger Suite: Survival Radar & Digital Twin (Milestone 4)', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  // ==========================================================================
  // SUITE 1: Survival Radar 6-Axis Trigonometric Geometry & Mathematical Precision Oracle
  // ==========================================================================
  describe('Suite 1: Survival Radar 6-Axis Trigonometric Geometry & Mathematical Precision', () => {
    const center = 240;
    const maxRadius = 160;

    it('verifies exact trigonometric coordinates of all 6 axes for full score (100)', () => {
      const maxScoreDims = test6Dimensions.map((d) => ({ ...d, score: 100 }));
      render(<SurvivalRadarChart dimensions={maxScoreDims} overallSurvivalIndex={100} />);

      const svg = screen.getByTestId('radar-svg');
      // Find company polygon (has stroke="#00f2fe")
      const polygons = Array.from(svg.querySelectorAll('polygon'));
      const companyPoly = polygons.find((p) => p.getAttribute('stroke') === '#00f2fe');
      expect(companyPoly).toBeDefined();

      const pointsStr = companyPoly?.getAttribute('points') || '';
      const pointPairs = pointsStr.trim().split(' ').map((pair) => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
      });

      expect(pointPairs).toHaveLength(6);

      // Verify each axis trigonometric angle and coordinate:
      // Axis 0: -90° (Straight Up): x = 240, y = 80
      expect(pointPairs[0].x).toBeCloseTo(240, 1);
      expect(pointPairs[0].y).toBeCloseTo(80, 1);

      // Axis 1: -30° (Top Right): x = 240 + 160*cos(-30°) ≈ 378.6, y = 240 + 160*sin(-30°) = 160
      expect(pointPairs[1].x).toBeCloseTo(240 + maxRadius * Math.cos(-Math.PI / 6), 1);
      expect(pointPairs[1].y).toBeCloseTo(240 + maxRadius * Math.sin(-Math.PI / 6), 1);

      // Axis 2: +30° (Bottom Right): x = 240 + 160*cos(30°) ≈ 378.6, y = 240 + 160*sin(30°) = 320
      expect(pointPairs[2].x).toBeCloseTo(240 + maxRadius * Math.cos(Math.PI / 6), 1);
      expect(pointPairs[2].y).toBeCloseTo(240 + maxRadius * Math.sin(Math.PI / 6), 1);

      // Axis 3: +90° (Straight Down): x = 240, y = 400
      expect(pointPairs[3].x).toBeCloseTo(240, 1);
      expect(pointPairs[3].y).toBeCloseTo(400, 1);

      // Axis 4: +150° (Bottom Left): x = 240 + 160*cos(150°) ≈ 101.4, y = 240 + 160*sin(150°) = 320
      expect(pointPairs[4].x).toBeCloseTo(240 + maxRadius * Math.cos((5 * Math.PI) / 6), 1);
      expect(pointPairs[4].y).toBeCloseTo(240 + maxRadius * Math.sin((5 * Math.PI) / 6), 1);

      // Axis 5: -150° / 210° (Top Left): x = 240 + 160*cos(210°) ≈ 101.4, y = 240 + 160*sin(210°) = 160
      expect(pointPairs[5].x).toBeCloseTo(240 + maxRadius * Math.cos((7 * Math.PI) / 6), 1);
      expect(pointPairs[5].y).toBeCloseTo(240 + maxRadius * Math.sin((7 * Math.PI) / 6), 1);
    });

    it('verifies all 6 vertices collapse exactly to origin center (240.0, 240.0) when scores are 0', () => {
      const zeroScoreDims = test6Dimensions.map((d) => ({ ...d, score: 0 }));
      render(<SurvivalRadarChart dimensions={zeroScoreDims} overallSurvivalIndex={0} />);

      const svg = screen.getByTestId('radar-svg');
      const polygons = Array.from(svg.querySelectorAll('polygon'));
      const companyPoly = polygons.find((p) => p.getAttribute('stroke') === '#00f2fe');
      const pointsStr = companyPoly?.getAttribute('points') || '';
      const pointPairs = pointsStr.trim().split(' ').map((pair) => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
      });

      expect(pointPairs).toHaveLength(6);
      pointPairs.forEach((pt) => {
        expect(pt.x).toBe(240);
        expect(pt.y).toBe(240);
      });
    });

    it('guarantees polygon points remain strictly non-NaN for fractional, negative, and out-of-bounds scores', () => {
      const edgeScores = [0.001, 33.33333, 66.66667, 99.999, -42, 250];
      const edgeDims = test6Dimensions.map((d, i) => ({ ...d, score: edgeScores[i] }));
      render(<SurvivalRadarChart dimensions={edgeDims} overallSurvivalIndex={50} />);

      const svg = screen.getByTestId('radar-svg');
      const polygons = Array.from(svg.querySelectorAll('polygon'));
      
      polygons.forEach((poly) => {
        const points = poly.getAttribute('points') || '';
        expect(points).not.toContain('NaN');
        expect(points).not.toContain('undefined');
        expect(points).not.toContain('null');
        expect(points).toMatch(/^[0-9.,\s]+$/);
      });
    });

    it('verifies concentric grid polygons render all 5 tiers (20, 40, 60, 80, 100) and 6 radial spokes', () => {
      render(<SurvivalRadarChart dimensions={test6Dimensions} overallSurvivalIndex={84} />);

      const svg = screen.getByTestId('radar-svg');
      const lines = svg.querySelectorAll('line');
      // 6 radial spokes
      expect(lines).toHaveLength(6);
      lines.forEach((line) => {
        expect(Number(line.getAttribute('x1'))).toBe(center);
        expect(Number(line.getAttribute('y1'))).toBe(center);
        expect(Number(line.getAttribute('x2'))).not.toBeNaN();
        expect(Number(line.getAttribute('y2'))).not.toBeNaN();
      });

      // 5 grid scale texts: 20, 40, 60, 80, 100
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SUITE 2: Boundary Dimensions & Single Dimension Degradation
  // ==========================================================================
  describe('Suite 2: Boundary Dimensions & Single Dimension Degradation', () => {
    it('handles empty dimensions array gracefully without throwing or producing NaN polygons', () => {
      render(<SurvivalRadarChart dimensions={[]} overallSurvivalIndex={0} />);

      const svg = screen.getByTestId('radar-svg');
      expect(svg).toBeInTheDocument();
      const polygons = Array.from(svg.querySelectorAll('polygon'));
      polygons.forEach((p) => {
        const pts = p.getAttribute('points') || '';
        expect(pts).not.toContain('NaN');
      });
    });

    it('handles dynamic dimensional counts (3 axes triangle, 5 axes pentagon)', () => {
      const triangleDims = test6Dimensions.slice(0, 3);
      const { unmount } = render(<SurvivalRadarChart dimensions={triangleDims} overallSurvivalIndex={80} />);
      let svg = screen.getByTestId('radar-svg');
      let companyPoly = Array.from(svg.querySelectorAll('polygon')).find((p) => p.getAttribute('stroke') === '#00f2fe');
      expect(companyPoly?.getAttribute('points')?.trim().split(' ')).toHaveLength(3);
      unmount();

      const pentagonDims = test6Dimensions.slice(0, 5);
      render(<SurvivalRadarChart dimensions={pentagonDims} overallSurvivalIndex={80} />);
      svg = screen.getByTestId('radar-svg');
      companyPoly = Array.from(svg.querySelectorAll('polygon')).find((p) => p.getAttribute('stroke') === '#00f2fe');
      expect(companyPoly?.getAttribute('points')?.trim().split(' ')).toHaveLength(5);
    });

    it('identifies primary vulnerability when single dimension severely degrades to near-zero', () => {
      // Degrade single dimension: Customer Concentration = 12/100, others at 95/100
      const degraded = test6Dimensions.map((d) =>
        d.key === 'customer-concentration' ? { ...d, score: 12, metricValueText: 'Top client = 68% revenue' } : { ...d, score: 95 }
      );

      usePayPilotStore.setState((s) => ({
        survivalRadarState: {
          ...s.survivalRadarState,
          dimensions: degraded,
        },
      }));

      render(<SurvivalRadarView />);

      const banner = screen.getByTestId('primary-vulnerability-banner');
      expect(banner).toBeInTheDocument();
      expect(within(banner).getByText(/Customer Concentration/)).toBeInTheDocument();
      expect(within(banner).getByText(/12\/100/)).toBeInTheDocument();
    });

    it('renders amber warning color on vertex circle when dimension score is below 75', () => {
      const mixedDims = test6Dimensions.map((d, i) =>
        i === 0 ? { ...d, score: 60 } : { ...d, score: 90 }
      );
      render(<SurvivalRadarChart dimensions={mixedDims} overallSurvivalIndex={85} />);

      const svg = screen.getByTestId('radar-svg');
      const circles = svg.querySelectorAll('circle');
      expect(circles).toHaveLength(6);
      // First circle should be amber (#f59e0b)
      expect(circles[0].getAttribute('fill')).toBe('#f59e0b');
      // Second circle should be cyan (#00f2fe)
      expect(circles[1].getAttribute('fill')).toBe('#00f2fe');
    });
  });

  // ==========================================================================
  // SUITE 3: Financial Shock Simulations & Reversible Resilience Lifecycle
  // ==========================================================================
  describe('Suite 3: Financial Shock Simulations & Reversible Resilience Lifecycle', () => {
    it('executes each shock scenario and verifies composite resilience recalculation', () => {
      render(<SurvivalRadarView />);

      const store = usePayPilotStore.getState();
      expect(store.survivalRadarState.overallSurvivalIndex).toBe(84);
      expect(store.survivalRadarState.activeStressTestId).toBeNull();

      // 1. Trigger SHOCK-01 (Top Client Default: simulated score 71)
      const btnShock1 = screen.getByTestId('btn-simulate-SHOCK-01');
      act(() => {
        fireEvent.click(btnShock1);
      });
      expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBe('SHOCK-01');
      expect(usePayPilotStore.getState().survivalRadarState.overallSurvivalIndex).toBe(71);
      expect(screen.getByTestId('composite-survival-index')).toHaveTextContent('71 / 100');
      expect(screen.getByTestId('active-shock-banner')).toHaveTextContent('Top Client Default');

      // 2. Trigger SHOCK-02 (Dispute Surge & Reserve Hold: simulated score 81)
      const btnShock2 = screen.getByTestId('btn-simulate-SHOCK-02');
      act(() => {
        fireEvent.click(btnShock2);
      });
      expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBe('SHOCK-02');
      expect(usePayPilotStore.getState().survivalRadarState.overallSurvivalIndex).toBe(81);
      expect(screen.getByTestId('composite-survival-index')).toHaveTextContent('81 / 100');
      expect(screen.getByTestId('active-shock-banner')).toHaveTextContent('Dispute Surge');

      // 3. Trigger SHOCK-03 (Macro Revenue Shock: simulated score 54)
      const btnShock3 = screen.getByTestId('btn-simulate-SHOCK-03');
      act(() => {
        fireEvent.click(btnShock3);
      });
      expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBe('SHOCK-03');
      expect(usePayPilotStore.getState().survivalRadarState.overallSurvivalIndex).toBe(54);
      expect(screen.getByTestId('composite-survival-index')).toHaveTextContent('54 / 100');
      expect(screen.getByTestId('active-shock-banner')).toHaveTextContent('Macro Revenue Shock');
    });

    it('safely handles non-existent shock IDs without state corruption or crashes', () => {
      act(() => {
        usePayPilotStore.getState().triggerStressTest('NON_EXISTENT_SHOCK_ID');
      });
      expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBeNull();
      expect(usePayPilotStore.getState().survivalRadarState.overallSurvivalIndex).toBe(84);
    });

    it('clears stress test and completely restores pristine baseline score of 84', () => {
      render(<SurvivalRadarView />);

      act(() => {
        fireEvent.click(screen.getByTestId('btn-simulate-SHOCK-03'));
      });
      expect(screen.getByTestId('btn-reset-stress-test')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('btn-reset-stress-test'));
      });

      expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBeNull();
      expect(usePayPilotStore.getState().survivalRadarState.overallSurvivalIndex).toBe(84);
      expect(screen.queryByTestId('active-shock-banner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('btn-reset-stress-test')).not.toBeInTheDocument();
      expect(screen.getByTestId('composite-survival-index')).toHaveTextContent('84 / 100');
    });

    it('endures rapid thrashing loop of 50 trigger/clear cycles without state drift', () => {
      const scenarios = ['SHOCK-01', 'SHOCK-02', 'SHOCK-03'];
      for (let i = 0; i < 50; i++) {
        const scenario = scenarios[i % scenarios.length];
        act(() => {
          usePayPilotStore.getState().triggerStressTest(scenario);
        });
        expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBe(scenario);

        act(() => {
          usePayPilotStore.getState().clearStressTest();
        });
        expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBeNull();
        expect(usePayPilotStore.getState().survivalRadarState.overallSurvivalIndex).toBe(84);
      }
    });
  });

  // ==========================================================================
  // SUITE 4: Defense Playbook Checklist Interactive State Retention
  // ==========================================================================
  describe('Suite 4: Defense Playbook Checklist Interactive State Retention', () => {
    it('toggles multiple checklist items independently and tracks executed state', () => {
      render(<SurvivalRadarView />);

      const item0 = screen.getByTestId('playbook-item-0');
      const item1 = screen.getByTestId('playbook-item-1');
      const item2 = screen.getByTestId('playbook-item-2');

      expect(item0).toHaveTextContent('Pending');
      expect(item1).toHaveTextContent('Pending');
      expect(item2).toHaveTextContent('Pending');

      // Execute item 0 and item 2
      act(() => {
        fireEvent.click(item0);
        fireEvent.click(item2);
      });

      expect(item0).toHaveTextContent('Executed');
      expect(item1).toHaveTextContent('Pending');
      expect(item2).toHaveTextContent('Executed');

      // Revert item 0
      act(() => {
        fireEvent.click(item0);
      });
      expect(item0).toHaveTextContent('Pending');
      expect(item2).toHaveTextContent('Executed');
    });

    it('retains checked item execution state when switching between stress scenarios', () => {
      render(<SurvivalRadarView />);

      // Under SHOCK-01: contains 'Accelerate Udhari collections'
      act(() => {
        fireEvent.click(screen.getByTestId('btn-simulate-SHOCK-01'));
      });

      const shock1Item0 = screen.getByTestId('playbook-item-0');
      expect(shock1Item0).toHaveTextContent('Accelerate Udhari collections');
      expect(shock1Item0).toHaveTextContent('Pending');

      act(() => {
        fireEvent.click(shock1Item0);
      });
      expect(shock1Item0).toHaveTextContent('Executed');

      // Switch to SHOCK-02
      act(() => {
        fireEvent.click(screen.getByTestId('btn-simulate-SHOCK-02'));
      });
      const shock2Item0 = screen.getByTestId('playbook-item-0');
      expect(shock2Item0).toHaveTextContent('Submit delivery proofs');

      // Switch back to SHOCK-01: 'Accelerate Udhari collections' MUST still be Executed!
      act(() => {
        fireEvent.click(screen.getByTestId('btn-simulate-SHOCK-01'));
      });
      const restoredShock1Item0 = screen.getByTestId('playbook-item-0');
      expect(restoredShock1Item0).toHaveTextContent('Accelerate Udhari collections');
      expect(restoredShock1Item0).toHaveTextContent('Executed');
    });
  });

  // ==========================================================================
  // SUITE 5: Digital Twin Time Scrubber High-Frequency Thrashing (Day 0 to +180)
  // ==========================================================================
  describe('Suite 5: Digital Twin Time Scrubber High-Frequency Thrashing (Day 0 to +180)', () => {
    it('scrubs through all 181 days sequentially and verifies monotonic cash decay & pulse transitions', () => {
      const store = usePayPilotStore.getState();

      let previousCash = Infinity;
      let previousHealth = Infinity;

      for (let day = 0; day <= 180; day++) {
        act(() => {
          store.setTimeScrubberOffset(day);
        });

        const state = usePayPilotStore.getState();
        const metrics = state.digitalTwinMetrics;

        expect(state.timeScrubberOffsetDays).toBe(day);
        expect(metrics.scrubDayOffset).toBe(day);

        // Projected cash formula: Math.max(0, 142500 - day * (1515 - 420))
        const netBurn = 1515 - 420; // 1095
        const expectedCash = Math.max(0, 142500 - day * netBurn);
        const expectedRunway = Math.max(0, Math.round(expectedCash / 1515));

        expect(metrics.runwayDays).toBe(expectedRunway);
        expect(metrics.workingCapital).toBe(expectedCash - metrics.liabilities.accountsPayableNext30Days);

        // Verify strictly non-NaN numeric validity across all fields
        expect(Number.isFinite(metrics.runwayDays)).toBe(true);
        expect(Number.isFinite(metrics.workingCapital)).toBe(true);
        expect(Number.isFinite(metrics.healthScore)).toBe(true);
        expect(Number.isFinite(metrics.quickRatio)).toBe(true);
        expect(Number.isFinite(metrics.dailyBurnRate)).toBe(true);
        expect(Number.isFinite(metrics.netDailyCashFlow)).toBe(true);

        // Verify health score bounds: 20 <= healthScore <= 100
        expect(metrics.healthScore).toBeGreaterThanOrEqual(20);
        expect(metrics.healthScore).toBeLessThanOrEqual(100);

        // Verify Dynamic Pulse State transitions
        if (expectedCash < 25000) {
          expect(metrics.dynamicPulseState).toBe('CRITICAL');
          expect(metrics.orbColorHex).toBe('#EF4444');
        } else if (day > 60) {
          expect(metrics.dynamicPulseState).toBe('CONTRACTING');
          expect(metrics.orbColorHex).toBe('#F59E0B');
        } else {
          expect(metrics.dynamicPulseState).toBe('STABLE');
          expect(metrics.orbColorHex).toBe('#10B981');
        }

        // Monotonic sanity
        expect(expectedCash).toBeLessThanOrEqual(previousCash);
        expect(metrics.healthScore).toBeLessThanOrEqual(previousHealth);
        previousCash = expectedCash;
        previousHealth = metrics.healthScore;
      }

      // At Day 180: cash reaches zero, runway reaches 0
      const finalState = usePayPilotStore.getState().digitalTwinMetrics;
      expect(finalState.runwayDays).toBe(0);
      expect(finalState.dynamicPulseState).toBe('CRITICAL');
      expect(finalState.orbColorHex).toBe('#EF4444');
      expect(finalState.workingCapital).toBe(-43200);
    });

    it('preserves underlying liquidity reservoirs and liabilities structure under rapid random scrubbing', () => {
      const store = usePayPilotStore.getState();
      const pristineLiquidity = { ...store.digitalTwinMetrics.liquidity };
      const pristineLiabilities = { ...store.digitalTwinMetrics.liabilities };

      // Scrub random days 100 times
      for (let i = 0; i < 100; i++) {
        const randomDay = Math.floor(Math.random() * 181);
        act(() => {
          store.setTimeScrubberOffset(randomDay);
        });
      }

      const postScrubMetrics = usePayPilotStore.getState().digitalTwinMetrics;
      expect(postScrubMetrics.liquidity).toEqual(pristineLiquidity);
      expect(postScrubMetrics.liabilities).toEqual(pristineLiabilities);
      expect(postScrubMetrics.liquidity.paypalAvailableBalance).toBe(68400.00);
      expect(postScrubMetrics.liquidity.bankOperatingChecking).toBe(58100.00);
      expect(postScrubMetrics.liabilities.accountsPayableNext30Days).toBe(43200.00);
    });

    it('interactively responds to UI slider events and quick jump preset clicks', () => {
      render(<DigitalTwinView />);

      const slider = screen.getByTestId('time-scrubber-slider');
      const dateDisplay = screen.getByTestId('scrubbed-date');

      // Test preset button jumps
      const presets = [
        { label: 'Day +30', days: 30 },
        { label: 'Day +60', days: 60 },
        { label: 'Day +90', days: 90 },
        { label: 'Day +180', days: 180 },
        { label: 'Today (Day 0)', days: 0 },
      ];

      presets.forEach(({ label, days }) => {
        const btn = screen.getByText(label);
        act(() => {
          fireEvent.click(btn);
        });
        expect(usePayPilotStore.getState().timeScrubberOffsetDays).toBe(days);
        expect(dateDisplay).toHaveTextContent(`Day +${days}`);
      });

      // Test slider drag to 75
      act(() => {
        fireEvent.change(slider, { target: { value: '75' } });
      });
      expect(usePayPilotStore.getState().timeScrubberOffsetDays).toBe(75);
      expect(dateDisplay).toHaveTextContent('Day +75');
    });

    it('resets cleanly to Day 0 demo state with pristine metrics after full-scale simulation', () => {
      render(<DigitalTwinView />);

      act(() => {
        usePayPilotStore.getState().setTimeScrubberOffset(180);
        usePayPilotStore.getState().triggerStressTest('SHOCK-03');
      });

      expect(usePayPilotStore.getState().timeScrubberOffsetDays).toBe(180);
      expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBe('SHOCK-03');

      // Trigger One-Click Judge Reset
      act(() => {
        usePayPilotStore.getState().resetToDemoState();
      });

      expect(usePayPilotStore.getState().timeScrubberOffsetDays).toBe(0);
      expect(usePayPilotStore.getState().digitalTwinMetrics.runwayDays).toBe(94);
      expect(usePayPilotStore.getState().digitalTwinMetrics.healthScore).toBe(88);
      expect(usePayPilotStore.getState().digitalTwinMetrics.dynamicPulseState).toBe('STABLE');
      expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBeNull();
      expect(usePayPilotStore.getState().survivalRadarState.overallSurvivalIndex).toBe(84);
    });
  });
});
