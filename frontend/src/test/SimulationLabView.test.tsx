import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SimulationLabView } from '../views/SimulationLabView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('SimulationLabView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('renders dual-panel layout, 3D terrain container, and telemetry HUD', () => {
    render(<SimulationLabView />);

    expect(screen.getByTestId('simulation-lab-view')).toBeInTheDocument();
    expect(
      screen.getByText('3D Topographical Cash-Flow Landscape')
    ).toBeInTheDocument();
    expect(screen.getByTestId('hud-lowest-dip')).toBeInTheDocument();
    expect(screen.getByTestId('hud-runway-days')).toBeInTheDocument();
    expect(screen.getByTestId('hud-buffer-cushion')).toBeInTheDocument();
  });

  it('renders all 3 scenario cards with comparison metrics', () => {
    render(<SimulationLabView />);

    expect(screen.getByTestId('scenario-card-baseline')).toBeInTheDocument();
    expect(screen.getByTestId('scenario-card-optimistic')).toBeInTheDocument();
    expect(screen.getByTestId('scenario-card-conservative')).toBeInTheDocument();
  });

  it('applies optimistic scenario and updates simulation parameters', () => {
    render(<SimulationLabView />);

    const applyOptimisticBtn = screen.getByTestId('btn-apply-optimistic');
    act(() => {
      fireEvent.click(applyOptimisticBtn);
    });

    expect(usePayPilotStore.getState().simulationState.selectedScenario).toBe('OPTIMISTIC');
    expect(usePayPilotStore.getState().simulationState.parameters.upfrontDepositPct).toBe(50);
    expect(usePayPilotStore.getState().simulationState.parameters.customerPaymentDelayDays).toBe(5);
  });

  it('applies conservative scenario and updates simulation parameters', () => {
    render(<SimulationLabView />);

    const applyConservativeBtn = screen.getByTestId('btn-apply-conservative');
    act(() => {
      fireEvent.click(applyConservativeBtn);
    });

    expect(usePayPilotStore.getState().simulationState.selectedScenario).toBe('CONSERVATIVE');
    expect(usePayPilotStore.getState().simulationState.parameters.upfrontDepositPct).toBe(10);
    expect(usePayPilotStore.getState().simulationState.parameters.customerPaymentDelayDays).toBe(35);
  });

  it('triggers CSV export when export button is clicked', () => {
    render(<SimulationLabView />);

    const exportBtn = screen.getByTestId('btn-export-csv');
    act(() => {
      fireEvent.click(exportBtn);
    });

    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });
});
