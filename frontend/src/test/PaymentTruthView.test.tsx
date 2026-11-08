import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PaymentTruthView } from '../views/PaymentTruthView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('PaymentTruthView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders header, ReconciliationKpiCards, 3D Node Graph, and PaymentTruthTable', () => {
    render(<PaymentTruthView />);

    expect(screen.getByTestId('payment-truth-view')).toBeInTheDocument();
    expect(screen.getByText('3-Way Multi-Source Ledger')).toBeInTheDocument();
    expect(screen.getByText('Multi-Source Relationship Graph')).toBeInTheDocument();
    expect(screen.getByTestId('payment-truth-table')).toBeInTheDocument();
  });

  it('toggles 3D force graph display when clicking Hide/Show button', () => {
    render(<PaymentTruthView />);

    const toggleBtn = screen.getByText('Hide 3D Graph');
    expect(screen.getByLabelText(/Payment Truth 3D Force-Directed Node Graph/)).toBeInTheDocument();

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByText('Show 3D Graph')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Payment Truth 3D Force-Directed Node Graph/)).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Show 3D Graph'));
    });

    expect(screen.getByText('Hide 3D Graph')).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Truth 3D Force-Directed Node Graph/)).toBeInTheDocument();
  });

  it('renders node graph legend tags accurately', () => {
    render(<PaymentTruthView />);

    expect(screen.getAllByText('PayPal Txn')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Bank Deposit')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Invoice')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Discrepancy')[0]).toBeInTheDocument();
  });
});
