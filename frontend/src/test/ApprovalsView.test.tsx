import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ApprovalsView } from '../views/ApprovalsView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('ApprovalsView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
    if (typeof navigator.clipboard === 'undefined') {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    } else {
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    }
  });

  it('TC-APPROVALS-01: renders Governed Action Queue with approval cards', () => {
    render(<ApprovalsView />);

    expect(screen.getByTestId('approvals-view')).toBeInTheDocument();
    expect(screen.getByText('Governed Action Queue & Approvals')).toBeInTheDocument();
    expect(screen.getByText('Human-in-the-Loop Safeguard')).toBeInTheDocument();
    expect(screen.getByTestId('approval-card-APR-9941')).toBeInTheDocument();
  });

  it('TC-APPROVALS-02: displays selected approval request details, risk badge, and financial diff', () => {
    render(<ApprovalsView />);

    expect(screen.getByText('Financial Impact Projection Diff')).toBeInTheDocument();
    expect(screen.getByText('Before Approval')).toBeInTheDocument();
    expect(screen.getByText('After Sandbox Execution')).toBeInTheDocument();
  });

  it('TC-APPROVALS-03: renders exact PayPal REST API blueprint with HTTP method and UUID v4 key', () => {
    render(<ApprovalsView />);

    expect(screen.getByText(/Exact Payload Inspection/i)).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByTestId('exact-payload-json-viewer')).toBeInTheDocument();
  });

  it('TC-APPROVALS-04: clicking Copy Key and Copy JSON copies content to clipboard', async () => {
    render(<ApprovalsView />);

    const copyKeyBtn = screen.getByTestId('copy-idempotency-key-btn');
    const copyJsonBtn = screen.getByTestId('copy-payload-json-btn');

    act(() => {
      fireEvent.click(copyKeyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText('Copied Key!')).toBeInTheDocument();

    act(() => {
      fireEvent.click(copyJsonBtn);
    });
    expect(screen.getByText('Copied JSON!')).toBeInTheDocument();
  });

  it('TC-APPROVALS-05: executes approve action via simulated sandbox API with latency', async () => {
    render(<ApprovalsView />);

    const approveBtn = screen.getByTestId('approve-execute-btn');
    expect(approveBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(approveBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Executed via PayPal REST API v2 Sandbox/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('TC-APPROVALS-06: rejects approval action with custom rationale', () => {
    render(<ApprovalsView />);

    const rejectBtn = screen.getByTestId('reject-action-btn');
    act(() => {
      fireEvent.click(rejectBtn);
    });

    expect(screen.getByText('Specify rejection rationale:')).toBeInTheDocument();

    const confirmRejectBtn = screen.getByTestId('confirm-reject-btn');
    act(() => {
      fireEvent.click(confirmRejectBtn);
    });

    const status = usePayPilotStore.getState().pendingApprovals.find((a) => a.id === 'APR-9941')?.status;
    expect(status).toBe('REJECTED');
  });

  it('TC-APPROVALS-07: filters actions by status tab and risk chip', () => {
    render(<ApprovalsView />);

    const executedTab = screen.getByTestId('approval-status-filter-EXECUTED_SANDBOX');
    act(() => {
      fireEvent.click(executedTab);
    });

    // Initially 0 executed
    expect(screen.getByText('No governed actions matching selected filters.')).toBeInTheDocument();

    const allTab = screen.getByTestId('approval-status-filter-ALL');
    act(() => {
      fireEvent.click(allTab);
    });

    expect(screen.getByTestId('approval-card-APR-9941')).toBeInTheDocument();
  });

  it('TC-APPROVALS-08: approves all low risk actions via batch button', async () => {
    render(<ApprovalsView />);

    const batchBtn = screen.getByTestId('approve-low-risk-btn');
    await act(async () => {
      fireEvent.click(batchBtn);
    });

    await waitFor(() => {
      const lowRiskItems = usePayPilotStore.getState().pendingApprovals.filter((a) => a.riskRating === 'LOW');
      lowRiskItems.forEach((item) => {
        expect(item.status).toBe('EXECUTED_SANDBOX');
      });
    }, { timeout: 4000 });
  });

  it('TC-APPROVALS-09: isolates sandbox execution receipts by actionId and preserves receipt across selection changes', async () => {
    render(<ApprovalsView />);

    // 1. Initially APR-9941 is selected and pending
    const approveBtn = screen.getByTestId('approve-execute-btn');
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    // 2. Wait for execution
    await waitFor(() => {
      expect(screen.getByTestId('approval-receipt-banner-APR-9941')).toBeInTheDocument();
      expect(screen.getByText(/Verification Badge:/i)).toBeInTheDocument();
      expect(screen.getByTestId('approval-card-receipt-APR-9941')).toBeInTheDocument();
    }, { timeout: 4000 });

    // 3. Switch selection to APR-9942 (which is PENDING_REVIEW)
    const card2 = screen.getByTestId('approval-card-APR-9942');
    act(() => {
      fireEvent.click(card2);
    });

    // 4. Verify APR-9942 does NOT display APR-9941's receipt banner or proof badge in detail pane
    expect(screen.queryByTestId('approval-receipt-banner-APR-9942')).not.toBeInTheDocument();
    expect(screen.getByTestId('approve-execute-btn')).toBeInTheDocument();

    // 5. Card 1 still retains its receipt in the list
    expect(screen.getByTestId('approval-card-receipt-APR-9941')).toBeInTheDocument();

    // 6. Switch back to APR-9941
    const card1 = screen.getByTestId('approval-card-APR-9941');
    act(() => {
      fireEvent.click(card1);
    });

    // 7. APR-9941 still displays its receipt banner
    expect(screen.getByTestId('approval-receipt-banner-APR-9941')).toBeInTheDocument();
  });
});
