import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { InvoiceFraudShieldView } from '../views/InvoiceFraudShieldView';

describe('InvoiceFraudShieldView Component', () => {
  it('renders header, review queue, and 3-way matching stats', async () => {
    render(<InvoiceFraudShieldView />);

    expect(screen.getByTestId('invoice-fraud-shield-view')).toBeInTheDocument();
    expect(screen.getByText('Vendor & Invoice Fraud Shield')).toBeInTheDocument();
    expect(screen.getByText(/Pre-Payment Defense/i)).toBeInTheDocument();
    expect(screen.getByText(/Invoice Review Queue/i)).toBeInTheDocument();
  });

  it('displays flagged invoices with changed beneficiary alert', async () => {
    render(<InvoiceFraudShieldView />);

    await waitFor(() => {
      expect(screen.getByText(/Pre-Payment Inspection/i)).toBeInTheDocument();
    });

    // Verify 3-way matching panel exists
    expect(screen.getByText(/Three-Way Matching/i)).toBeInTheDocument();

    // Verify Beneficiary verification alert
    expect(screen.getByText(/Beneficiary Remittance Verification/i)).toBeInTheDocument();
  });

  it('opens and closes the invoice intake modal', async () => {
    render(<InvoiceFraudShieldView />);

    const intakeBtn = screen.getByText('Intake Invoice');
    act(() => {
      fireEvent.click(intakeBtn);
    });

    expect(screen.getByText('Intake Supplier Invoice (Simulator)')).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancel');
    act(() => {
      fireEvent.click(cancelBtn);
    });

    expect(screen.queryByText('Intake Supplier Invoice (Simulator)')).not.toBeInTheDocument();
  });
});
