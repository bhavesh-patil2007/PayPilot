import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AgingBucketVisualizer } from '../components/common/AgingBucketVisualizer';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('AgingBucketVisualizer Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders title, segmented progress bar, and 4 metric cards', () => {
    const handleSelect = vi.fn();
    render(<AgingBucketVisualizer selectedBucket="ALL" onSelectBucket={handleSelect} />);

    expect(screen.getByTestId('aging-bucket-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('aging-progress-bar')).toBeInTheDocument();
    expect(screen.getByText('Receivables Debt Aging Distribution')).toBeInTheDocument();

    expect(screen.getByTestId('aging-card-0_15_DAYS')).toBeInTheDocument();
    expect(screen.getByTestId('aging-card-16_30_DAYS')).toBeInTheDocument();
    expect(screen.getByTestId('aging-card-31_60_DAYS')).toBeInTheDocument();
    expect(screen.getByTestId('aging-card-60_PLUS_DAYS')).toBeInTheDocument();
  });

  it('displays correct dollar totals across aging buckets', () => {
    render(<AgingBucketVisualizer selectedBucket="ALL" onSelectBucket={vi.fn()} />);

    // Total debt: $16,800.00
    expect(screen.getByText('$16,800.00')).toBeInTheDocument();
    // 0-15d: $6,720.00
    expect(screen.getByText('$6,720.00')).toBeInTheDocument();
    // 16-30d: $4,200.00
    expect(screen.getByText('$4,200.00')).toBeInTheDocument();
    // 31-60d: $3,360.00
    expect(screen.getByText('$3,360.00')).toBeInTheDocument();
    // 60+d: $2,520.00
    expect(screen.getByText('$2,520.00')).toBeInTheDocument();
  });

  it('triggers onSelectBucket when clicking a bucket card', () => {
    const handleSelect = vi.fn();
    render(<AgingBucketVisualizer selectedBucket="ALL" onSelectBucket={handleSelect} />);

    const card = screen.getByTestId('aging-card-31_60_DAYS');
    act(() => {
      fireEvent.click(card);
    });

    expect(handleSelect).toHaveBeenCalledWith('31_60_DAYS');
  });

  it('toggles selection to ALL when clicking the currently selected card', () => {
    const handleSelect = vi.fn();
    render(
      <AgingBucketVisualizer
        selectedBucket="31_60_DAYS"
        onSelectBucket={handleSelect}
      />
    );

    const card = screen.getByTestId('aging-card-31_60_DAYS');
    act(() => {
      fireEvent.click(card);
    });

    expect(handleSelect).toHaveBeenCalledWith('ALL');
  });

  it('renders Show All Accounts button when a specific bucket is filtered and clicks to reset', () => {
    const handleSelect = vi.fn();
    render(
      <AgingBucketVisualizer
        selectedBucket="60_PLUS_DAYS"
        onSelectBucket={handleSelect}
      />
    );

    const resetBtn = screen.getByTestId('reset-bucket-filter');
    expect(resetBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(handleSelect).toHaveBeenCalledWith('ALL');
  });

  it('clicking bar segment triggers onSelectBucket', () => {
    const handleSelect = vi.fn();
    render(<AgingBucketVisualizer selectedBucket="ALL" onSelectBucket={handleSelect} />);

    const segment = screen.getByTestId('bar-segment-0_15_DAYS');
    act(() => {
      fireEvent.click(segment);
    });

    expect(handleSelect).toHaveBeenCalledWith('0_15_DAYS');
  });
});
