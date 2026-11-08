import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReconciliationKpiCards } from '../components/tables/ReconciliationKpiCards';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('ReconciliationKpiCards Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders all 4 summary KPI cards with values from store', () => {
    render(<ReconciliationKpiCards />);

    expect(screen.getByTestId('reconciliation-kpi-cards')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-total-volume')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-matched-precision')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-active-discrepancies')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-unmatched-orphans')).toBeInTheDocument();

    expect(screen.getByText('Total Volume Reconciled')).toBeInTheDocument();
    expect(screen.getByText('Matched Precision Rate')).toBeInTheDocument();
    expect(screen.getByText('Active Discrepancies')).toBeInTheDocument();
    expect(screen.getByText('Unmatched Orphans')).toBeInTheDocument();

    // Check seed values ($542.0k volume, 99.4% precision, $3,840.00 discrepancy)
    expect(screen.getByText('$542.0k')).toBeInTheDocument();
    expect(screen.getByText('99.4%')).toBeInTheDocument();
    expect(screen.getByText('$3,840.00')).toBeInTheDocument();
  });
});
