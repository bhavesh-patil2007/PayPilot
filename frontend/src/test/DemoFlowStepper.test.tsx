import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DemoFlowStepper } from '../components/common/DemoFlowStepper';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('DemoFlowStepper Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders 5-act progress buttons, headline, proof moment, and quick action button', () => {
    render(<DemoFlowStepper />);

    expect(screen.getByTestId('demo-flow-stepper')).toBeInTheDocument();
    expect(screen.getByText('3-Minute Hackathon Demo Narrative')).toBeInTheDocument();
    expect(screen.getByTestId('demo-act-btn-1')).toBeInTheDocument();
    expect(screen.getByTestId('demo-act-btn-2')).toBeInTheDocument();
    expect(screen.getByTestId('demo-act-btn-3')).toBeInTheDocument();
    expect(screen.getByTestId('demo-act-btn-4')).toBeInTheDocument();
    expect(screen.getByTestId('demo-act-btn-5')).toBeInTheDocument();
    expect(screen.getByText('Act 1: Autonomous Leakage Detection')).toBeInTheDocument();
    expect(screen.getByTestId('demo-quick-action-btn')).toBeInTheDocument();
  });

  it('steps forward to Act 2 and updates activeRoute to payment-truth', () => {
    render(<DemoFlowStepper />);

    const nextBtn = screen.getByTestId('demo-next-act-btn');
    act(() => {
      fireEvent.click(nextBtn);
    });

    expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(2);
    expect(usePayPilotStore.getState().activeRoute).toBe('payment-truth');
    expect(screen.getByText('Act 2: Deterministic 3-Way Reconciliation')).toBeInTheDocument();
  });

  it('steps backward from Act 2 to Act 1', () => {
    act(() => {
      usePayPilotStore.getState().setDemoAct(2);
      usePayPilotStore.getState().setActiveRoute('payment-truth');
    });

    render(<DemoFlowStepper />);

    const prevBtn = screen.getByTestId('demo-prev-act-btn');
    act(() => {
      fireEvent.click(prevBtn);
    });

    expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(1);
    expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');
  });

  it('allows direct jump to any act by clicking act button', () => {
    render(<DemoFlowStepper />);

    const act4Btn = screen.getByTestId('demo-act-btn-4');
    act(() => {
      fireEvent.click(act4Btn);
    });

    expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(4);
    expect(usePayPilotStore.getState().activeRoute).toBe('commitments');
    expect(screen.getByText('Act 4: Digital Twin & Commitment Firewall')).toBeInTheDocument();
  });

  it('triggers quick action button correctly', () => {
    render(<DemoFlowStepper />);

    const quickActionBtn = screen.getByTestId('demo-quick-action-btn');
    act(() => {
      fireEvent.click(quickActionBtn);
    });

    expect(usePayPilotStore.getState().activeRoute).toBe('payback-hunter');
    expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);
  });

  it('minimizes and restores stepper interface', () => {
    render(<DemoFlowStepper isFloating={true} />);

    const minBtn = screen.getByTestId('minimize-stepper-btn');
    act(() => {
      fireEvent.click(minBtn);
    });

    expect(screen.getByTestId('demo-stepper-minimized')).toBeInTheDocument();

    const restoredPill = screen.getByTestId('demo-stepper-minimized');
    act(() => {
      fireEvent.click(restoredPill);
    });

    expect(screen.getByTestId('demo-flow-stepper')).toBeInTheDocument();
  });

  it('invokes onClose when close button is clicked in floating mode', () => {
    const handleClose = vi.fn();
    render(<DemoFlowStepper isFloating={true} onClose={handleClose} />);

    const closeBtn = screen.getByTestId('close-stepper-btn');
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers Judge Reset button to restore pristine demo state', () => {
    act(() => {
      usePayPilotStore.getState().setDemoAct(4);
      usePayPilotStore.getState().setActiveRoute('commitments');
    });

    render(<DemoFlowStepper />);

    const resetBtn = screen.getByTestId('judge-reset-stepper-btn');
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(usePayPilotStore.getState().activeRoute).toBe('command-center');
    expect(usePayPilotStore.getState().demoActStepper.currentAct).toBe(1);
  });
});
