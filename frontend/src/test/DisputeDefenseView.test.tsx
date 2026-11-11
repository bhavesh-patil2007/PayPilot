import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { DisputeDefenseView } from '../views/DisputeDefenseView';

describe('DisputeDefenseView Component', () => {
  it('renders header, metrics, and dispute inbox', async () => {
    render(<DisputeDefenseView />);

    expect(screen.getByTestId('dispute-defense-studio-view')).toBeInTheDocument();
    expect(screen.getByText('Dispute Defense Studio')).toBeInTheDocument();
    expect(screen.getByText(/PayPal Disputes API/i)).toBeInTheDocument();
    expect(screen.getByText(/Dispute Inbox/i)).toBeInTheDocument();
  });

  it('displays seeded disputes and allows switching tabs in Case Workspace', async () => {
    render(<DisputeDefenseView />);

    await waitFor(() => {
      expect(screen.getByText(/Case Workspace/i)).toBeInTheDocument();
    });

    // Check tabs
    const checklistTab = screen.getByText(/Checklist/i);
    act(() => {
      fireEvent.click(checklistTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Proof of Delivery (POD)')).toBeInTheDocument();
    });

    const responseTab = screen.getByText('Response & Approval');
    act(() => {
      fireEvent.click(responseTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Execute Submission')).toBeInTheDocument();
    });
  });

  it('triggers AI draft generation', async () => {
    render(<DisputeDefenseView />);

    await waitFor(() => {
      expect(screen.getByText(/Case Workspace/i)).toBeInTheDocument();
    });

    const draftBtn = screen.getByText('AI Draft');
    act(() => {
      fireEvent.click(draftBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/AI Response Draft generated/i)).toBeInTheDocument();
    });
  });
});
