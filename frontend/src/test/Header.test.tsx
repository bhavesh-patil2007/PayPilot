import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Header } from '../components/layout/Header';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('Header Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders header, breadcrumbs, and live telemetry metrics', () => {
    render(<Header />);

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByText('Overview & Operations')).toBeInTheDocument();
    expect(screen.getByText('Command Center')).toBeInTheDocument();
    expect(screen.getByText('Cash:')).toBeInTheDocument();
    expect(screen.getByText('$142.5k')).toBeInTheDocument();
    expect(screen.getByText('Recoverable:')).toBeInTheDocument();
    expect(screen.getByText('$18.4k')).toBeInTheDocument();
    expect(screen.getByText('Runway:')).toBeInTheDocument();
    expect(screen.getByText('94d')).toBeInTheDocument();
  });

  it('renders quick 5-act navigation pills and updates act and route on click', () => {
    render(<Header />);

    const act3Btn = screen.getByTestId('header-act-btn-3');
    act(() => {
      fireEvent.click(act3Btn);
    });

    expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(3);
    expect(usePayPilotStore.getState().activeRoute).toBe('approvals');
    expect(screen.getByText('Governance & Tools')).toBeInTheDocument();
    expect(screen.getByText('Approvals')).toBeInTheDocument();
  });

  it('triggers onToggleStepper when Demo Stepper button is clicked', () => {
    const handleToggle = vi.fn();
    render(<Header onToggleStepper={handleToggle} isStepperOpen={false} />);

    const toggleBtn = screen.getByTestId('toggle-stepper-btn');
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
