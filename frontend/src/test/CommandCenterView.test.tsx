import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CommandCenterView } from '../views/CommandCenterView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('CommandCenterView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders executive header and status badges', () => {
    render(<CommandCenterView />);

    expect(screen.getByTestId('command-center-view')).toBeInTheDocument();
    expect(screen.getByText('Executive Command Center')).toBeInTheDocument();
    expect(screen.getByText('PayPal Sandbox Active')).toBeInTheDocument();
    expect(screen.getByTestId('judge-reset-btn')).toBeInTheDocument();
  });

  it('renders hero section with 3D Globe telemetry information', () => {
    render(<CommandCenterView />);

    expect(screen.getByText('Autonomous Capital Protection & Leakage Interceptor')).toBeInTheDocument();
    expect(screen.getByText('$46,770.00')).toBeInTheDocument();
    expect(screen.getByText('4 Global Routes')).toBeInTheDocument();
  });

  it('renders all 5 Executive KPI cards with correct metrics', () => {
    render(<CommandCenterView />);

    const kpiMatrix = screen.getByTestId('executive-kpi-matrix');
    expect(kpiMatrix).toBeInTheDocument();

    expect(screen.getByTestId('kpi-total-cash')).toHaveTextContent('$142.5k');
    expect(screen.getByTestId('kpi-recoverable')).toHaveTextContent('$18.4k');
    expect(screen.getByTestId('kpi-payables')).toHaveTextContent('$43.2k');
    expect(screen.getByTestId('kpi-runway')).toHaveTextContent('94d');
    expect(screen.getByTestId('kpi-health-score')).toHaveTextContent('88/100');
  });

  it('renders real-time anomaly feed items and handles navigation actions', () => {
    render(<CommandCenterView />);

    const anomalyFeed = screen.getByTestId('anomaly-feed-stream');
    expect(anomalyFeed).toBeInTheDocument();

    const actionButtons = screen.getAllByRole('button');
    const claimBtn = actionButtons.find((btn) => btn.textContent?.includes('Review Case'));
    if (claimBtn) {
      act(() => {
        fireEvent.click(claimBtn);
      });
      expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');
    }
  });

  it('provides quick action direct portals to core modules', () => {
    render(<CommandCenterView />);

    const hunterPortal = screen.getByTestId('quick-action-hunter');
    act(() => {
      fireEvent.click(hunterPortal);
    });
    expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');

    const truthPortal = screen.getByTestId('quick-action-truth');
    act(() => {
      fireEvent.click(truthPortal);
    });
    expect(usePayPilotStore.getState().activeRoute).toBe('payment-truth');

    const commitmentsPortal = screen.getByTestId('quick-action-commitments');
    act(() => {
      fireEvent.click(commitmentsPortal);
    });
    expect(usePayPilotStore.getState().activeRoute).toBe('commitments');

    const simPortal = screen.getByTestId('quick-action-simulation');
    act(() => {
      fireEvent.click(simPortal);
    });
    expect(usePayPilotStore.getState().activeRoute).toBe('simulation-lab');
  });

  it('calls resetToDemoState when Judge Reset button is clicked', () => {
    render(<CommandCenterView />);

    act(() => {
      usePayPilotStore.getState().setActiveRoute('commitments');
    });

    const resetBtn = screen.getByTestId('judge-reset-btn');
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(usePayPilotStore.getState().activeRoute).toBe('command-center');
  });
});
