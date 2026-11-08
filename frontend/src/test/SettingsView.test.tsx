import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { SettingsView } from '../views/SettingsView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('SettingsView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('TC-SETTINGS-01: renders PayPal Sandbox Credentials card with masked secret', () => {
    render(<SettingsView />);

    expect(screen.getByTestId('settings-view')).toBeInTheDocument();
    expect(screen.getByText('PayPal Developer Credentials')).toBeInTheDocument();
    expect(screen.getByTestId('paypal-client-id-input')).toBeInTheDocument();

    const secretInput = screen.getByTestId('paypal-secret-input');
    expect(secretInput).toHaveAttribute('type', 'password');
  });

  it('TC-SETTINGS-02: toggling secret reveal button toggles input type between text and password', () => {
    render(<SettingsView />);

    const secretInput = screen.getByTestId('paypal-secret-input');
    const toggleBtn = screen.getByTestId('toggle-secret-visibility');

    expect(secretInput).toHaveAttribute('type', 'password');

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(secretInput).toHaveAttribute('type', 'text');

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(secretInput).toHaveAttribute('type', 'password');
  });

  it('TC-SETTINGS-03: clicking Test Webhook Connection executes ping and displays latency badge', async () => {
    render(<SettingsView />);

    const pingBtn = screen.getByTestId('ping-webhook-btn');
    expect(pingBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(pingBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('webhook-latency-badge')).toBeInTheDocument();
      expect(screen.getByText(/200 OK/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('TC-SETTINGS-04: adjusting simulated latency slider updates configuration in store', () => {
    render(<SettingsView />);

    const latencySlider = screen.getByTestId('simulated-latency-slider');
    act(() => {
      fireEvent.change(latencySlider, { target: { value: '1200' } });
    });

    expect(usePayPilotStore.getState().paypalConfig.simulatorToggles.simulateApiLatencyMs).toBe(1200);
    expect(screen.getByText('1200 ms')).toBeInTheDocument();
  });

  it('TC-SETTINGS-05: toggling environment to LIVE renders safety warning dialog', () => {
    render(<SettingsView />);

    const liveBtn = screen.getByTestId('env-live-btn');
    act(() => {
      fireEvent.click(liveBtn);
    });

    expect(screen.getByTestId('live-environment-warning')).toBeInTheDocument();
    expect(screen.getByText(/WARNING: Live PayPal Production Rail Selected/i)).toBeInTheDocument();
  });

  it('TC-SETTINGS-06: renders Live FastAPI and Supabase backend endpoint configuration fields', () => {
    render(<SettingsView />);

    expect(screen.getByTestId('fastapi-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('supabase-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('backend-mode-toggle')).toBeInTheDocument();
  });

  it('TC-SETTINGS-07: clicking One-Click Judge Reset calls resetToDemoState and shows confirmation banner', () => {
    render(<SettingsView />);

    const resetBtn = screen.getByTestId('judge-demo-reset-btn');
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(screen.getByTestId('reset-confirmation-toast')).toBeInTheDocument();
    expect(screen.getByText(/Demo workspace successfully reset to pristine fixtures/i)).toBeInTheDocument();
  });

  it('TC-SETTINGS-08: renders Sandbox REST API audit trail container', () => {
    render(<SettingsView />);

    expect(screen.getByTestId('audit-trail-container')).toBeInTheDocument();
  });
});
