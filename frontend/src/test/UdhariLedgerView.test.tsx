import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UdhariLedgerView } from '../views/UdhariLedgerView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('UdhariLedgerView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders header, AgingBucketVisualizer, and UdhariLedgerTable', () => {
    render(<UdhariLedgerView />);

    expect(screen.getByTestId('udhari-ledger-view')).toBeInTheDocument();
    expect(screen.getByText('Customer Credit & Aging')).toBeInTheDocument();
    expect(screen.getByText('Receivables Debt Aging Distribution')).toBeInTheDocument();
    expect(screen.getByTestId('udhari-ledger-table')).toBeInTheDocument();
  });

  it('displays accurate summary metrics in header', () => {
    render(<UdhariLedgerView />);

    const summary = usePayPilotStore.getState().udhariSummary;
    const outstandingText = `$${summary.totalOutstandingCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    expect(screen.getAllByText(outstandingText)[0]).toBeInTheDocument();
  });

  it('filters table by aging bucket when selecting a bucket card', () => {
    render(<UdhariLedgerView />);

    const bucketCard = screen.getByTestId('aging-card-60_PLUS_DAYS');
    act(() => {
      fireEvent.click(bucketCard);
    });

    expect(screen.getByText(/Filtered:\s*60_PLUS_DAYS/i)).toBeInTheDocument();
  });
});
