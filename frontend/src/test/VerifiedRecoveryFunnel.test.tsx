import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VerifiedRecoveryFunnel } from '../components/common/VerifiedRecoveryFunnel';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('VerifiedRecoveryFunnel Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders all 4 stages with correct labels, dollar amounts, and counts', () => {
    render(<VerifiedRecoveryFunnel />);

    expect(screen.getByTestId('verified-recovery-funnel')).toBeInTheDocument();
    expect(screen.getByText('Potential Identified')).toBeInTheDocument();
    expect(screen.getByText('Claim Submitted')).toBeInTheDocument();
    expect(screen.getByText('Provider Pending')).toBeInTheDocument();
    expect(screen.getByText('Verified Recovered')).toBeInTheDocument();

    expect(screen.getByText('$18,450.00')).toBeInTheDocument();
    expect(screen.getByText('$12,100.00')).toBeInTheDocument();
    expect(screen.getByText('$7,500.00')).toBeInTheDocument();
    expect(screen.getByText('$4,200.00')).toBeInTheDocument();

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays overall pipeline conversion percentage and ratio', () => {
    render(<VerifiedRecoveryFunnel />);

    expect(screen.getByText('Total Conversion')).toBeInTheDocument();
    expect(screen.getByText('22.8%')).toBeInTheDocument();
    expect(screen.getByText('$4,200.00 / $18,450.00')).toBeInTheDocument();
  });

  it('calls onSelectStage with stageId when an inactive stage card is clicked', () => {
    const handleSelect = vi.fn();
    render(<VerifiedRecoveryFunnel onSelectStage={handleSelect} />);

    const stage1Btn = screen.getByTestId('funnel-stage-POTENTIAL_IDENTIFIED');
    act(() => {
      fireEvent.click(stage1Btn);
    });

    expect(handleSelect).toHaveBeenCalledWith('POTENTIAL_IDENTIFIED');
  });

  it('calls onSelectStage with null when the active stage card is clicked again (toggle off)', () => {
    const handleSelect = vi.fn();
    render(
      <VerifiedRecoveryFunnel
        activeStage="POTENTIAL_IDENTIFIED"
        onSelectStage={handleSelect}
      />
    );

    const stage1Btn = screen.getByTestId('funnel-stage-POTENTIAL_IDENTIFIED');
    act(() => {
      fireEvent.click(stage1Btn);
    });

    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it('shows FILTER APPLIED badge on the active stage card', () => {
    render(<VerifiedRecoveryFunnel activeStage="CLAIM_SUBMITTED" />);

    expect(screen.getByText('FILTER APPLIED')).toBeInTheDocument();
  });

  it('renders inter-stage conversion rate bar', () => {
    render(<VerifiedRecoveryFunnel />);

    expect(screen.getByText(/65.6% Claimed/i)).toBeInTheDocument();
    expect(screen.getByText(/62% Under Review/i)).toBeInTheDocument();
    expect(screen.getByText(/56% Settled/i)).toBeInTheDocument();
  });
});
