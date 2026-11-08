import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DiscrepancyInspectorModal } from '../components/tables/DiscrepancyInspectorModal';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('DiscrepancyInspectorModal Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
    usePayPilotStore.getState().setSelectedDiscrepancyId(null);
  });

  it('does not render when selectedDiscrepancyId is null', () => {
    render(<DiscrepancyInspectorModal />);
    expect(screen.queryByTestId('discrepancy-inspector-modal')).not.toBeInTheDocument();
  });

  it('renders fallback dialog when selected record does not exist', () => {
    act(() => {
      usePayPilotStore.getState().setSelectedDiscrepancyId('non-existent-rec');
    });

    render(<DiscrepancyInspectorModal />);

    expect(screen.getByText('Record Not Found')).toBeInTheDocument();
    expect(screen.getByText('Close Inspector')).toBeInTheDocument();

    const closeBtn = screen.getByText('Close Inspector');
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(usePayPilotStore.getState().selectedDiscrepancyId).toBeNull();
  });

  it('renders multi-source breakdown, equation, and 3 source cards for a valid record', () => {
    act(() => {
      usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
    });

    render(<DiscrepancyInspectorModal />);

    expect(screen.getByTestId('discrepancy-inspector-modal')).toBeInTheDocument();
    expect(screen.getByText('Visual Variance Calculation')).toBeInTheDocument();
    expect(screen.getByText('PayPal Record')).toBeInTheDocument();
    expect(screen.getByText('Bank Feed')).toBeInTheDocument();
    expect(screen.getByText('Internal Invoice')).toBeInTheDocument();
    expect(screen.getByText('Mark Reconciled')).toBeInTheDocument();
    expect(screen.getByText('Create Adjustment Entry')).toBeInTheDocument();
    expect(screen.getByText('Dispute via PayPal')).toBeInTheDocument();
  });

  it('marks record reconciled and updates store when Mark Reconciled is clicked', async () => {
    act(() => {
      usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
    });

    render(<DiscrepancyInspectorModal />);

    const reconcileBtn = screen.getByText('Mark Reconciled');
    act(() => {
      fireEvent.click(reconcileBtn);
    });

    const updated = usePayPilotStore.getState().reconciliationRecords.find((r) => r.id === 'REC-TRUTH-101');
    expect(updated?.status).toBe('RECONCILED');
    expect(updated?.varianceAmount).toBe(0);
  });

  it('creates adjustment entry feedback when Create Adjustment Entry is clicked', () => {
    act(() => {
      usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
    });

    render(<DiscrepancyInspectorModal />);

    const adjBtn = screen.getByText('Create Adjustment Entry');
    act(() => {
      fireEvent.click(adjBtn);
    });

    expect(screen.getByText(/Journal Entry ADJ-/i)).toBeInTheDocument();
  });

  it('navigates to approvals view and closes modal when Dispute via PayPal is clicked', () => {
    act(() => {
      usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
    });

    render(<DiscrepancyInspectorModal />);

    const disputeBtn = screen.getByText('Dispute via PayPal');
    act(() => {
      fireEvent.click(disputeBtn);
    });

    expect(usePayPilotStore.getState().activeRoute).toBe('approvals');
    expect(usePayPilotStore.getState().selectedDiscrepancyId).toBeNull();
  });

  it('closes on Escape key trigger', () => {
    act(() => {
      usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
    });

    render(<DiscrepancyInspectorModal />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(usePayPilotStore.getState().selectedDiscrepancyId).toBeNull();
  });
});
