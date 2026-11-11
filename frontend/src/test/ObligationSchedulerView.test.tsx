import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ObligationSchedulerView } from '../views/ObligationSchedulerView';

describe('ObligationSchedulerView Component', () => {
  it('renders header, scenario selector, and cash forecast curve', async () => {
    render(<ObligationSchedulerView />);

    expect(screen.getByTestId('smart-obligation-scheduler-view')).toBeInTheDocument();
    expect(screen.getByText('Smart Obligation Scheduler')).toBeInTheDocument();
    expect(screen.getByText(/Cash-Aware Twin Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Baseline Forecast/i)).toBeInTheDocument();
  });

  it('allows switching to Delayed Receivables scenario to detect reserve breach', async () => {
    render(<ObligationSchedulerView />);

    const delayedBtn = screen.getByText('Delayed Receivables (Breach Test)');
    act(() => {
      fireEvent.click(delayedBtn);
    });

    await waitFor(() => {
      expect(screen.getAllByText(/BREACH/i)[0]).toBeInTheDocument();
    });
  });

  it('opens and closes add obligation modal', async () => {
    render(<ObligationSchedulerView />);

    const addBtn = screen.getByText('Add Obligation');
    act(() => {
      fireEvent.click(addBtn);
    });

    expect(screen.getByText('Add Business Obligation')).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancel');
    act(() => {
      fireEvent.click(cancelBtn);
    });

    expect(screen.queryByText('Add Business Obligation')).not.toBeInTheDocument();
  });
});
