import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CommitmentGanttChart } from '../components/charts/CommitmentGanttChart';
import { CommitmentItem } from '../types';

const mockCommitments: CommitmentItem[] = [
  {
    id: 'CMT-1',
    referenceNumber: 'PO-2024-001',
    title: 'Cloudflare Enterprise Plan',
    counterparty: 'Cloudflare Inc',
    category: 'SAAS_TOOLS',
    startDate: '2024-11-06',
    dueDate: '2024-11-20',
    totalCommittedAmount: 8500,
    amountPaidToDate: 0,
    pendingBalance: 8500,
    paymentTerms: 'NET_15',
    milestones: [],
    firewallStatus: 'APPROVED_SAFE',
    firewallVerdict: {
      safe: true,
      lowestProjectedBuffer: 35000,
      explanation: 'Headroom intact',
    },
    priority: 'MEDIUM',
  },
  {
    id: 'CMT-2',
    referenceNumber: 'PO-2024-002',
    title: 'Bi-Weekly Engineering Payroll',
    counterparty: 'Gusto Payroll Inc',
    category: 'PAYROLL',
    startDate: '2024-11-06',
    dueDate: '2024-11-15',
    totalCommittedAmount: 24000,
    amountPaidToDate: 12000,
    pendingBalance: 12000,
    paymentTerms: 'DUE_ON_RECEIPT',
    milestones: [{ id: 'm1', name: 'Half-run', dueDate: '2024-11-10', percentageSplit: 50, amount: 12000, isPaid: true }],
    firewallStatus: 'WARNING_BUFFER_TIGHT',
    firewallVerdict: {
      safe: true,
      lowestProjectedBuffer: 18000,
      explanation: 'Buffer tight',
    },
    priority: 'HIGH',
  },
];

describe('CommitmentGanttChart Component', () => {
  it('renders SVG timeline canvas, toolbar, and safety buffer line', () => {
    render(<CommitmentGanttChart commitments={mockCommitments} />);

    expect(screen.getByTestId('commitment-gantt-chart')).toBeInTheDocument();
    expect(screen.getByTestId('gantt-svg-canvas')).toBeInTheDocument();
    expect(screen.getByText('Pinned Safety Buffer: $25,000')).toBeInTheDocument();
    expect(screen.getByText(/Cloudflare Inc/)).toBeInTheDocument();
    expect(screen.getByText(/Gusto Payroll Inc/)).toBeInTheDocument();
  });

  it('switches forecasting horizon buttons and invokes onHorizonChange', () => {
    const handleHorizonChange = vi.fn();
    render(<CommitmentGanttChart commitments={mockCommitments} onHorizonChange={handleHorizonChange} />);

    const btn60 = screen.getByText('60d');
    act(() => {
      fireEvent.click(btn60);
    });

    expect(handleHorizonChange).toHaveBeenCalledWith(60);
  });

  it('filters commitments by category', () => {
    const handleSelectCat = vi.fn();
    render(
      <CommitmentGanttChart
        commitments={mockCommitments}
        selectedCategory="ALL"
        onSelectCategory={handleSelectCat}
      />
    );

    const payrollFilter = screen.getByRole('button', { name: /Payroll & Team/ });
    act(() => {
      fireEvent.click(payrollFilter);
    });

    expect(handleSelectCat).toHaveBeenCalledWith('PAYROLL');
  });

  it('renders graceful empty state message when no commitments match', () => {
    render(<CommitmentGanttChart commitments={[]} />);

    expect(
      screen.getByText(/No upcoming commitments scheduled within the 90-day horizon/)
    ).toBeInTheDocument();
  });

  it('invokes onSelectCommitment when a commitment row is clicked', () => {
    const handleSelectCommitment = vi.fn();
    render(
      <CommitmentGanttChart
        commitments={mockCommitments}
        onSelectCommitment={handleSelectCommitment}
      />
    );

    const cloudflareLabel = screen.getByText('Cloudflare Inc');
    act(() => {
      fireEvent.click(cloudflareLabel);
    });

    expect(handleSelectCommitment).toHaveBeenCalledWith(mockCommitments[0]);
  });
});
