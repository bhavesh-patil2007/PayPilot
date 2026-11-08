import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { InteractiveCashCurve } from '../components/charts/InteractiveCashCurve';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('InteractiveCashCurve Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders SVG cash curve, safety buffer threshold, and dip beacon', () => {
    render(<InteractiveCashCurve />);

    expect(screen.getByTestId('interactive-cash-curve')).toBeInTheDocument();
    expect(screen.getByTestId('cash-curve-svg')).toBeInTheDocument();
    expect(screen.getByText('MANDATORY SAFETY BUFFER ($15,000)')).toBeInTheDocument();
    expect(screen.getByText(/Dip: \$/)).toBeInTheDocument();
    expect(screen.getByText('BUFFER INTACT')).toBeInTheDocument();
  });

  it('adjusts upfront deposit percentage slider and recalculates projections', () => {
    render(<InteractiveCashCurve />);

    const slider = screen.getByTestId('slider-deposit');
    act(() => {
      fireEvent.change(slider, { target: { value: '40' } });
    });

    expect(usePayPilotStore.getState().simulationState.parameters.upfrontDepositPct).toBe(40);
    expect(screen.getByTestId('deposit-val')).toHaveTextContent('40%');
  });

  it('adjusts client payment delay days slider and updates store', () => {
    render(<InteractiveCashCurve />);

    const slider = screen.getByTestId('slider-delay');
    act(() => {
      fireEvent.change(slider, { target: { value: '30' } });
    });

    expect(usePayPilotStore.getState().simulationState.parameters.customerPaymentDelayDays).toBe(30);
    expect(screen.getByTestId('delay-val')).toHaveTextContent('+30 Days');
  });

  it('switches milestone split preset buttons', () => {
    render(<InteractiveCashCurve />);

    const preset5050 = screen.getByTestId('preset-50_50');
    act(() => {
      fireEvent.click(preset5050);
    });

    expect(usePayPilotStore.getState().simulationState.parameters.milestonePreset).toBe('50_50');
    expect(usePayPilotStore.getState().simulationState.parameters.milestoneSplit).toEqual([50, 50, 0]);
  });
});
