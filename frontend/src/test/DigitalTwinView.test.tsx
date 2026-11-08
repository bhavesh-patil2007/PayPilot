import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DigitalTwinView } from '../views/DigitalTwinView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('DigitalTwinView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders central 3D visual container, pulse state indicator, and time scrubber', () => {
    render(<DigitalTwinView />);

    expect(screen.getByTestId('digital-twin-view')).toBeInTheDocument();
    expect(screen.getByText('Financial Digital Twin')).toBeInTheDocument();
    expect(screen.getByText(/Pulse State:/)).toBeInTheDocument();
    expect(screen.getByTestId('time-scrubber-slider')).toBeInTheDocument();
    expect(screen.getByTestId('scrubbed-date')).toBeInTheDocument();
  });

  it('scrubs time offset and updates forward projected metrics', () => {
    render(<DigitalTwinView />);

    const slider = screen.getByTestId('time-scrubber-slider');
    act(() => {
      fireEvent.change(slider, { target: { value: '45' } });
    });

    expect(usePayPilotStore.getState().timeScrubberOffsetDays).toBe(45);
    expect(screen.getByTestId('scrubbed-date')).toHaveTextContent('Day +45');
  });

  it('jumps time scrubber using preset buttons', () => {
    render(<DigitalTwinView />);

    const preset90Btn = screen.getByTestId('preset-day-90');
    act(() => {
      fireEvent.click(preset90Btn);
    });

    expect(usePayPilotStore.getState().timeScrubberOffsetDays).toBe(90);
    expect(screen.getByTestId('scrubbed-date')).toHaveTextContent('Day +90');
  });

  it('renders 4 executive health metric cards and deep-dive matrices', () => {
    render(<DigitalTwinView />);

    expect(screen.getByTestId('twin-health-score')).toBeInTheDocument();
    expect(screen.getByTestId('twin-working-capital')).toBeInTheDocument();
    expect(screen.getByTestId('twin-quick-ratio')).toBeInTheDocument();
    expect(screen.getByTestId('twin-runway')).toBeInTheDocument();

    expect(screen.getByText('Cash Reservoirs & Liquid Receivables')).toBeInTheDocument();
    expect(screen.getByText('30-Day Forward Obligations & Burn')).toBeInTheDocument();
    expect(screen.getByText('PayPal Available Balance')).toBeInTheDocument();
    expect(screen.getByText('Chase Operating Checking')).toBeInTheDocument();
  });
});
