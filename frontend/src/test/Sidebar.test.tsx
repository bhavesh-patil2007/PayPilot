import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Sidebar, NAV_GROUPS } from '../components/layout/Sidebar';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { AppRoute } from '../types';

describe('Sidebar Component', () => {
  beforeEach(() => {
    window.alert = vi.fn();
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders branding, grouped categories, and all 12 navigation links', () => {
    render(<Sidebar />);

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByText('PayPilot')).toBeInTheDocument();
    expect(screen.getByText('PayPal Hackathon Platform')).toBeInTheDocument();
    expect(screen.getByText('Overview & Operations')).toBeInTheDocument();
    expect(screen.getByText('Recovery & Ground Truth')).toBeInTheDocument();
    expect(screen.getByText('Projections & Resilience')).toBeInTheDocument();
    expect(screen.getByText('Governance & Tools')).toBeInTheDocument();

    const allRoutes: AppRoute[] = [
      'command-center',
      'copilot',
      'payback-hunter',
      'payment-truth',
      'udhari-ledger',
      'commitments',
      'digital-twin',
      'simulation-lab',
      'survival-radar',
      'approvals',
      'team-sharing',
      'settings',
    ];

    allRoutes.forEach((route) => {
      expect(screen.getByTestId(`nav-item-${route}`)).toBeInTheDocument();
    });
  });

  it('updates store activeRoute when navigation item is clicked', () => {
    render(<Sidebar />);

    const approvalsNav = screen.getByTestId('nav-item-approvals');
    act(() => {
      fireEvent.click(approvalsNav);
    });

    expect(usePayPilotStore.getState().activeRoute).toBe('approvals');
  });

  it('displays dynamic notification badges across modules', () => {
    render(<Sidebar />);

    expect(screen.getAllByText('AI')[0]).toBeInTheDocument();
    expect(screen.getByText('12 cases')).toBeInTheDocument();
    expect(screen.getByText('4 flag')).toBeInTheDocument();
    expect(screen.getByText('$16.8k')).toBeInTheDocument();
    expect(screen.getByText('$43.2k')).toBeInTheDocument();
    expect(screen.getByText('3 pend')).toBeInTheDocument();
  });

  it('triggers Judge Reset button from sidebar', () => {
    render(<Sidebar />);

    act(() => {
      usePayPilotStore.getState().setActiveRoute('digital-twin');
    });

    const resetBtn = screen.getByTestId('judge-reset-sidebar-btn');
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(usePayPilotStore.getState().activeRoute).toBe('command-center');
    expect(window.alert).toHaveBeenCalled();
  });
});
