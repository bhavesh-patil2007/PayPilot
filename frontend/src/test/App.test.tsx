import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { AppRoute } from '../types';

describe('App Root Component & 12-Route Router', () => {
  beforeEach(() => {
    window.alert = vi.fn();
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders PayPilot brand, navigation items, and header', () => {
    render(<App />);

    expect(screen.getByText('PayPilot')).toBeInTheDocument();
    expect(screen.getByText('PayPal Hackathon Platform')).toBeInTheDocument();
    expect(screen.getAllByText('Command Center')[0]).toBeInTheDocument();
    expect(screen.getAllByText('PayBack Hunter')[0]).toBeInTheDocument();
    expect(screen.getByText('Judge Reset (One-Click)')).toBeInTheDocument();
  });

  it('switches active route when clicking nav item', () => {
    render(<App />);

    const paybackButton = screen.getAllByText('PayBack Hunter')[0];
    act(() => {
      fireEvent.click(paybackButton);
    });

    expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');
  });

  it('triggers judge reset button cleanly', () => {
    render(<App />);

    act(() => {
      usePayPilotStore.getState().setActiveRoute('payment-truth');
    });
    expect(usePayPilotStore.getState().activeRoute).toBe('payment-truth');

    const resetButton = screen.getByText('Judge Reset (One-Click)');
    act(() => {
      fireEvent.click(resetButton);
    });

    expect(usePayPilotStore.getState().activeRoute).toBe('command-center');
    expect(window.alert).toHaveBeenCalled();
  });

  it('navigates to Copilot and renders CopilotView', () => {
    render(<App />);

    act(() => {
      usePayPilotStore.getState().setActiveRoute('copilot');
    });

    expect(screen.getByTestId('copilot-view')).toBeInTheDocument();
  });

  it('navigates to Approvals and renders ApprovalsView', () => {
    render(<App />);

    act(() => {
      usePayPilotStore.getState().setActiveRoute('approvals');
    });

    expect(screen.getByTestId('approvals-view')).toBeInTheDocument();
  });

  it('navigates to Team Sharing and renders TeamSharingView', () => {
    render(<App />);

    act(() => {
      usePayPilotStore.getState().setActiveRoute('team-sharing');
    });

    expect(screen.getByTestId('team-sharing-view')).toBeInTheDocument();
  });

  it('navigates to Settings and renders SettingsView', () => {
    render(<App />);

    act(() => {
      usePayPilotStore.getState().setActiveRoute('settings');
    });

    expect(screen.getByTestId('settings-view')).toBeInTheDocument();
  });

  it('navigates across all 12 core routes seamlessly without crash', () => {
    render(<App />);

    const allRoutes: AppRoute[] = [
      'command-center',
      'payback-hunter',
      'payment-truth',
      'commitments',
      'digital-twin',
      'simulation-lab',
      'survival-radar',
      'udhari-ledger',
      'copilot',
      'approvals',
      'team-sharing',
      'settings',
    ];

    for (const r of allRoutes) {
      act(() => {
        usePayPilotStore.getState().setActiveRoute(r);
      });
      expect(usePayPilotStore.getState().activeRoute).toBe(r);
    }
  });

  it('toggles 5-Act Demo Stepper floating controller', () => {
    render(<App />);

    const toggleBtn = screen.getByTestId('toggle-stepper-btn');
    expect(screen.queryByTestId('demo-flow-stepper')).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('demo-flow-stepper')).toBeInTheDocument();

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.queryByTestId('demo-flow-stepper')).not.toBeInTheDocument();
  });

  it('renders ExplainabilityDrawer when openExplainability is invoked', () => {
    render(<App />);

    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
    });

    expect(screen.getByTestId('explainability-drawer')).toBeInTheDocument();
  });
});
