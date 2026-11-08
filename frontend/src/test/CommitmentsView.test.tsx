import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CommitmentsView } from '../views/CommitmentsView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('CommitmentsView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders workbench header, safety buffer metrics, and commitments table', () => {
    render(<CommitmentsView />);

    expect(screen.getByTestId('commitments-view')).toBeInTheDocument();
    expect(screen.getByText('Commitment Workbench & Firewall')).toBeInTheDocument();
    expect(screen.getByText('Safety Buffer:')).toBeInTheDocument();
    expect(screen.getByTestId('commitments-table')).toBeInTheDocument();
    expect(screen.getByTestId('firewall-verdict-banner')).toBeInTheDocument();
  });

  it('validates empty inputs on simulator submission', () => {
    render(<CommitmentsView />);

    const commitBtn = screen.getByTestId('btn-commit-order');
    act(() => {
      fireEvent.click(commitBtn);
    });

    expect(screen.getByTestId('order-validation-error')).toHaveTextContent(
      'Vendor name is required.'
    );
  });

  it('validates non-positive order amounts', () => {
    render(<CommitmentsView />);

    const vendorInput = screen.getByTestId('input-vendor-name');
    const amountInput = screen.getByTestId('input-order-amount');
    const commitBtn = screen.getByTestId('btn-commit-order');

    act(() => {
      fireEvent.change(vendorInput, { target: { value: 'Global Logistics Corp' } });
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(commitBtn);
    });

    expect(screen.getByTestId('order-validation-error')).toHaveTextContent(
      'Order amount must be greater than $0.'
    );
  });

  it('evaluates and commits a safe purchase order to the schedule', () => {
    render(<CommitmentsView />);

    const initialCommitmentsCount = usePayPilotStore.getState().commitments.length;

    const vendorInput = screen.getByTestId('input-vendor-name');
    const amountInput = screen.getByTestId('input-order-amount');
    const commitBtn = screen.getByTestId('btn-commit-order');

    act(() => {
      fireEvent.change(vendorInput, { target: { value: 'Foxconn Electronics' } });
      fireEvent.change(amountInput, { target: { value: '12500' } });
    });

    // Verify live firewall evaluation banner shows PASS
    expect(screen.getByTestId('firewall-verdict-banner')).toHaveTextContent(/PASS/);

    act(() => {
      fireEvent.click(commitBtn);
    });

    expect(screen.getByTestId('order-commit-success')).toHaveTextContent(
      /Order committed! PO #PO-2024-\d+ for \$12,500 added to schedule./
    );

    expect(usePayPilotStore.getState().commitments.length).toBe(initialCommitmentsCount + 1);
    expect(screen.getAllByText('Foxconn Electronics')[0]).toBeInTheDocument();
  });

  it('triggers block verdict on large order exceeding liquid cash buffer', () => {
    render(<CommitmentsView />);

    const vendorInput = screen.getByTestId('input-vendor-name');
    const amountInput = screen.getByTestId('input-order-amount');

    act(() => {
      fireEvent.change(vendorInput, { target: { value: 'Massive Equipment PO' } });
      fireEvent.change(amountInput, { target: { value: '180000' } });
    });

    expect(screen.getByTestId('firewall-verdict-banner')).toHaveTextContent(/BLOCK/);
  });
});
