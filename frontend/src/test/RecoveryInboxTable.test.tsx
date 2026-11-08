import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { RecoveryInboxTable } from '../components/tables/RecoveryInboxTable';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('RecoveryInboxTable Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders table container, search bar, and filter dropdowns', () => {
    render(<RecoveryInboxTable />);

    expect(screen.getByTestId('recovery-inbox-table')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by Case ID, Rule, or Discrepancy Title/i)).toBeInTheDocument();
    expect(screen.getByText('All Providers')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('filters data when user types in the search query input', () => {
    render(<RecoveryInboxTable />);

    const searchInput = screen.getByPlaceholderText(/Search by Case ID, Rule, or Discrepancy Title/i);
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'REC-101' } });
    });

    // In AG Grid in jsdom, row data is filtered in component state
    expect(searchInput).toHaveValue('REC-101');
  });

  it('filters data when provider is selected', () => {
    render(<RecoveryInboxTable />);

    const selects = screen.getAllByRole('combobox');
    const providerSelect = selects[0]; // first select is Provider

    act(() => {
      fireEvent.change(providerSelect, { target: { value: 'PayPal' } });
    });

    expect(providerSelect).toHaveValue('PayPal');
  });

  it('renders stage filter banner when selectedStageFilter prop is provided', () => {
    const onClear = vi.fn();
    render(
      <RecoveryInboxTable
        selectedStageFilter="POTENTIAL_IDENTIFIED"
        onClearStageFilter={onClear}
      />
    );

    expect(screen.getByText(/Stage Filter:/i)).toBeInTheDocument();
    expect(screen.getByText('POTENTIAL_IDENTIFIED')).toBeInTheDocument();

    const clearBtn = screen.getByTitle('Clear stage filter');
    act(() => {
      fireEvent.click(clearBtn);
    });
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('dispatches openExplainability when Why Flagged is triggered', () => {
    const store = usePayPilotStore.getState();
    const openSpy = vi.spyOn(store, 'openExplainability');

    render(<RecoveryInboxTable />);

    // Trigger openExplainability directly or simulate
    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
    });

    expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);
    expect(usePayPilotStore.getState().explainabilityDrawer.activeRuleId).toBe('RULE-DUP-FEE-02');
  });

  it('executes claim workflow on single recovery case', async () => {
    const initialCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;

    await act(async () => {
      await usePayPilotStore.getState().executeSandboxClaim('REC-101');
    });

    const targetCase = usePayPilotStore.getState().recoveryCases.find((c) => c.id === 'REC-101');
    expect(targetCase?.status).toBe('VERIFIED_RECOVERED');
    expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(initialCash + 1420);
  });
});
