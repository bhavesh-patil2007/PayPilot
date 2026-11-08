import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { SurvivalRadarView } from '../views/SurvivalRadarView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('SurvivalRadarView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders header, composite survival index, and primary vulnerability banner', () => {
    render(<SurvivalRadarView />);

    expect(screen.getByTestId('survival-radar-view')).toBeInTheDocument();
    expect(screen.getByText('Business Survival Radar & Stress Lab')).toBeInTheDocument();
    expect(screen.getByTestId('composite-survival-index')).toHaveTextContent('84 / 100');
    
    const banner = screen.getByTestId('primary-vulnerability-banner');
    expect(banner).toBeInTheDocument();
    expect(within(banner).getByText(/Customer Concentration/)).toBeInTheDocument();
  });

  it('renders 6 dimension breakdown cards', () => {
    render(<SurvivalRadarView />);

    expect(screen.getByTestId('dimension-cards-grid')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-card-customer-concentration')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-card-cash-runway')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-card-margin-stability')).toBeInTheDocument();
  });

  it('simulates shock scenario and renders active shock alert banner', () => {
    render(<SurvivalRadarView />);

    const shockBtn = screen.getByTestId('btn-simulate-SHOCK-01');
    act(() => {
      fireEvent.click(shockBtn);
    });

    expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBe('SHOCK-01');
    expect(screen.getByTestId('active-shock-banner')).toBeInTheDocument();
    expect(screen.getByTestId('composite-survival-index')).toHaveTextContent('71 / 100');
    expect(screen.getByTestId('btn-reset-stress-test')).toBeInTheDocument();
  });

  it('resets stress lab and restores pristine baseline survival score', () => {
    render(<SurvivalRadarView />);

    const shockBtn = screen.getByTestId('btn-simulate-SHOCK-01');
    act(() => {
      fireEvent.click(shockBtn);
    });

    const resetBtn = screen.getByTestId('btn-reset-stress-test');
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(usePayPilotStore.getState().survivalRadarState.activeStressTestId).toBeNull();
    expect(usePayPilotStore.getState().survivalRadarState.overallSurvivalIndex).toBe(84);
    expect(screen.getByTestId('composite-survival-index')).toHaveTextContent('84 / 100');
  });

  it('toggles defense playbook checklist item completion status', () => {
    render(<SurvivalRadarView />);

    const playbookItem = screen.getByTestId('playbook-item-0');
    expect(playbookItem).toHaveTextContent('Pending');

    act(() => {
      fireEvent.click(playbookItem);
    });

    expect(playbookItem).toHaveTextContent('Executed');

    act(() => {
      fireEvent.click(playbookItem);
    });

    expect(playbookItem).toHaveTextContent('Pending');
  });
});
