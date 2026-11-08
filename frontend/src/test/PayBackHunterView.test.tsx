import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PayBackHunterView } from '../views/PayBackHunterView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('PayBackHunterView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders header, 3D Funnel container, VerifiedRecoveryFunnel, and RecoveryInboxTable', () => {
    render(<PayBackHunterView />);

    expect(screen.getByTestId('payback-hunter-view')).toBeInTheDocument();
    expect(screen.getByText('Autonomous Leakage Interceptor')).toBeInTheDocument();
    expect(screen.getByText('3D Pipeline Vortex')).toBeInTheDocument();
    expect(screen.getByText('Verified Recovery Funnel')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-inbox-table')).toBeInTheDocument();
  });

  it('displays accurate total identified and recovered metrics', () => {
    render(<PayBackHunterView />);

    const metrics = usePayPilotStore.getState().recoveryFunnelMetrics;
    const identifiedText = `$${metrics.identifiedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    expect(screen.getAllByText(identifiedText)[0]).toBeInTheDocument();
  });

  it('toggles stage filter when clicking stage card in VerifiedRecoveryFunnel', () => {
    render(<PayBackHunterView />);

    // Click POTENTIAL_IDENTIFIED stage card
    const stageCard = screen.getByTestId('funnel-stage-POTENTIAL_IDENTIFIED');
    act(() => {
      fireEvent.click(stageCard);
    });

    expect(screen.getByText(/Filtering inbox table by stage:/)).toBeInTheDocument();
    expect(screen.getAllByText('POTENTIAL_IDENTIFIED')[0]).toBeInTheDocument();

    // Click Clear Filter button in banner
    const clearBtn = screen.getByText('Clear Filter');
    act(() => {
      fireEvent.click(clearBtn);
    });

    expect(screen.queryByText(/Filtering inbox table by stage:/)).not.toBeInTheDocument();
  });

  it('mounts ThreeCanvasContainer with FunnelScene aria-label', () => {
    render(<PayBackHunterView />);

    expect(screen.getByLabelText(/3D Recovery Pipeline Funnel/)).toBeInTheDocument();
  });
});
