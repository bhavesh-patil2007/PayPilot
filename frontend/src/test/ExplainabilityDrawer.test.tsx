import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ExplainabilityDrawer } from '../components/common/ExplainabilityDrawer';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('ExplainabilityDrawer Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
    usePayPilotStore.getState().closeExplainability();
  });

  it('renders nothing when drawer isOpen is false', () => {
    render(<ExplainabilityDrawer />);
    expect(screen.queryByTestId('explainability-drawer')).not.toBeInTheDocument();
  });

  it('renders slide-over drawer when openExplainability is invoked', () => {
    render(<ExplainabilityDrawer />);

    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
    });

    expect(screen.getByTestId('explainability-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('explainability-drawer-panel')).toBeInTheDocument();
    expect(screen.getByText('PayPilot AI Explainability Engine')).toBeInTheDocument();
    expect(screen.getByText('RULE-DUP-FEE-02')).toBeInTheDocument();
    expect(screen.getByText(/98% Confidence/i)).toBeInTheDocument();
  });

  it('renders mathematical formula in overflow-safe container', () => {
    render(<ExplainabilityDrawer />);

    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
    });

    const formula = screen.getByTestId('detection-formula');
    expect(formula).toBeInTheDocument();
    expect(formula.textContent).toContain('Variance');
  });

  it('renders connected multi-source records and raw JSON payload', () => {
    render(<ExplainabilityDrawer />);

    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
    });

    expect(screen.getByText('Connected Multi-Source Records (3-Way Truth)')).toBeInTheDocument();
    expect(screen.getByTestId('raw-paypal-payload-json')).toBeInTheDocument();
  });

  it('copies JSON payload when copy button is clicked', async () => {
    render(<ExplainabilityDrawer />);

    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
    });

    const copyBtn = screen.getByTestId('copy-json-button');
    act(() => {
      fireEvent.click(copyBtn);
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('closes drawer on backdrop click', () => {
    render(<ExplainabilityDrawer />);

    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
    });

    const backdrop = screen.getByTestId('drawer-backdrop');
    act(() => {
      fireEvent.click(backdrop);
    });

    expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(false);
  });

  it('closes drawer on Escape key press', () => {
    render(<ExplainabilityDrawer />);

    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-DUP-FEE-02', 'REC-101');
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(false);
  });

  it('handles non-existent rule ID gracefully with fallback presentation', () => {
    render(<ExplainabilityDrawer />);

    act(() => {
      usePayPilotStore.getState().openExplainability('RULE-UNKNOWN-999');
    });

    expect(screen.getByTestId('explainability-drawer')).toBeInTheDocument();
    expect(screen.getByText('RULE-UNKNOWN-999')).toBeInTheDocument();
  });
});
