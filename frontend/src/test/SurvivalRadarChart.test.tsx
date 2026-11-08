import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SurvivalRadarChart } from '../components/charts/SurvivalRadarChart';
import { RadarDimensionScore } from '../types';

const mockDimensions: RadarDimensionScore[] = [
  {
    key: 'concentration',
    name: 'Customer Concentration',
    score: 72,
    industryBenchmark: 65,
    status: 'ADEQUATE',
    metricValueText: 'Top client = 28% revenue',
    riskFactorSummary: 'Diversify top 3 accounts',
  },
  {
    key: 'runway',
    name: 'Cash Runway Depth',
    score: 89,
    industryBenchmark: 60,
    status: 'EXCELLENT',
    metricValueText: '94 days runway',
    riskFactorSummary: 'Healthy buffer',
  },
  {
    key: 'margin',
    name: 'Gross Margin Stability',
    score: 85,
    industryBenchmark: 70,
    status: 'EXCELLENT',
    metricValueText: '68% net margin',
    riskFactorSummary: 'Stable product pricing',
  },
  {
    key: 'dispute',
    name: 'Dispute & Chargeback',
    score: 91,
    industryBenchmark: 75,
    status: 'EXCELLENT',
    metricValueText: '0.12% dispute rate',
    riskFactorSummary: 'Low risk threshold',
  },
  {
    key: 'capital',
    name: 'Working Capital Buffer',
    score: 86,
    industryBenchmark: 70,
    status: 'EXCELLENT',
    metricValueText: '$99,300 cushion',
    riskFactorSummary: 'Safe AP headroom',
  },
  {
    key: 'vendor',
    name: 'Vendor Concentration',
    score: 78,
    industryBenchmark: 68,
    status: 'ADEQUATE',
    metricValueText: 'Top vendor = 32% COGS',
    riskFactorSummary: 'Dual sourcing suggested',
  },
];

describe('SurvivalRadarChart Component', () => {
  it('renders SVG radar chart, concentric polygons, and composite rating', () => {
    render(<SurvivalRadarChart dimensions={mockDimensions} overallSurvivalIndex={84} />);

    expect(screen.getByTestId('survival-radar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('radar-svg')).toBeInTheDocument();
    expect(screen.getByText('84 / 100 (Resilient Tier)')).toBeInTheDocument();
    expect(screen.getByText('Customer Concentration')).toBeInTheDocument();
    expect(screen.getByText('Cash Runway Depth')).toBeInTheDocument();
  });

  it('handles vertex click and calls onSelectDimension', () => {
    const handleSelect = vi.fn();
    render(<SurvivalRadarChart dimensions={mockDimensions} onSelectDimension={handleSelect} />);

    const label = screen.getByText('Customer Concentration');
    act(() => {
      fireEvent.click(label);
    });

    expect(handleSelect).toHaveBeenCalledWith(mockDimensions[0]);
  });

  it('handles all scores set to 0 without crashing', () => {
    const zeroDimensions = mockDimensions.map((d) => ({ ...d, score: 0 }));
    render(<SurvivalRadarChart dimensions={zeroDimensions} overallSurvivalIndex={0} />);

    expect(screen.getByTestId('radar-svg')).toBeInTheDocument();
    expect(screen.getByText('0 / 100 (Resilient Tier)')).toBeInTheDocument();
  });

  it('handles all scores set to 100 without crashing', () => {
    const maxDimensions = mockDimensions.map((d) => ({ ...d, score: 100 }));
    render(<SurvivalRadarChart dimensions={maxDimensions} overallSurvivalIndex={100} />);

    expect(screen.getByTestId('radar-svg')).toBeInTheDocument();
    expect(screen.getByText('100 / 100 (Resilient Tier)')).toBeInTheDocument();
  });

  it('renders empty chart gracefully when no dimensions provided', () => {
    render(<SurvivalRadarChart dimensions={[]} />);

    expect(screen.getByTestId('radar-svg')).toBeInTheDocument();
  });
});
