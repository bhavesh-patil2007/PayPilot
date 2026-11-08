import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PaymentTruthTable, getNormalizedMatchStatus } from '../components/tables/PaymentTruthTable';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { ReconciliationRecord } from '../types';

describe('PaymentTruthTable Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders table container and filter chips with initial counts', () => {
    render(<PaymentTruthTable />);

    expect(screen.getByTestId('payment-truth-table')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-discrepancies')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-matched')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-orphans')).toBeInTheDocument();

    expect(screen.getByText('All Records')).toBeInTheDocument();
    expect(screen.getByText('Discrepancies')).toBeInTheDocument();
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.getByText('Orphans')).toBeInTheDocument();
  });

  it('switches active filter when clicking filter chips', () => {
    render(<PaymentTruthTable />);

    const discrepanciesChip = screen.getByTestId('filter-chip-discrepancies');
    act(() => {
      fireEvent.click(discrepanciesChip);
    });

    const matchedChip = screen.getByTestId('filter-chip-matched');
    act(() => {
      fireEvent.click(matchedChip);
    });

    const orphansChip = screen.getByTestId('filter-chip-orphans');
    act(() => {
      fireEvent.click(orphansChip);
    });

    const allChip = screen.getByTestId('filter-chip-all');
    act(() => {
      fireEvent.click(allChip);
    });
  });

  it('updates search query input without crashing', () => {
    render(<PaymentTruthTable />);

    const searchInput = screen.getByPlaceholderText(/Search by ID, payer, bank.../i);
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'REC-3WAY' } });
    });

    expect(searchInput).toHaveValue('REC-3WAY');
  });

  it('clicks auto-fit columns button safely', () => {
    render(<PaymentTruthTable />);

    const autoFitBtn = screen.getByTitle('Auto-fit columns');
    act(() => {
      fireEvent.click(autoFitBtn);
    });
    expect(autoFitBtn).toBeInTheDocument();
  });

  it('normalizes match status across all multi-source permutations', () => {
    const matchedRec: Partial<ReconciliationRecord> = {
      status: 'RECONCILED',
      varianceAmount: 0,
    };
    expect(getNormalizedMatchStatus(matchedRec as ReconciliationRecord)).toBe('MATCHED');

    const discrepancyRec: Partial<ReconciliationRecord> = {
      status: 'DISCREPANCY_DETECTED',
      varianceAmount: 1420,
      paypalRecord: { grossAmount: 40000 } as any,
      bankRecord: { depositAmount: 38580 } as any,
    };
    expect(getNormalizedMatchStatus(discrepancyRec as ReconciliationRecord)).toBe('DISCREPANCY');

    const orphanPaypal: Partial<ReconciliationRecord> = {
      paypalRecord: { grossAmount: 500 } as any,
      bankRecord: undefined,
      ledgerRecord: undefined,
      varianceAmount: 500,
    };
    expect(getNormalizedMatchStatus(orphanPaypal as ReconciliationRecord)).toBe('ORPHAN_PAYPAL');

    const orphanBank: Partial<ReconciliationRecord> = {
      paypalRecord: undefined,
      bankRecord: { depositAmount: 600 } as any,
      ledgerRecord: undefined,
      varianceAmount: 600,
    };
    expect(getNormalizedMatchStatus(orphanBank as ReconciliationRecord)).toBe('ORPHAN_BANK');

    const orphanInvoice: Partial<ReconciliationRecord> = {
      paypalRecord: undefined,
      bankRecord: undefined,
      ledgerRecord: { bookedAmount: 700 } as any,
      varianceAmount: 700,
    };
    expect(getNormalizedMatchStatus(orphanInvoice as ReconciliationRecord)).toBe('ORPHAN_INVOICE');
  });
});
