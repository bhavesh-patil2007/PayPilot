import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CopilotView, SUGGESTED_QUERIES } from '../views/CopilotView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('CopilotView Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('TC-COPILOT-01: renders Copilot header, initial welcome message, and citation badge', () => {
    render(<CopilotView />);

    expect(screen.getByTestId('copilot-view')).toBeInTheDocument();
    expect(screen.getByText('Grounded Financial Copilot')).toBeInTheDocument();
    expect(screen.getByText(/Verified Store Context Bound/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to PayPilot Copilot/i)).toBeInTheDocument();
    expect(screen.getAllByText('[REC-101]')[0]).toBeInTheDocument();
  });

  it('TC-COPILOT-02: displays Verified Context Inspector with live cash, runway, and recovery count', () => {
    render(<CopilotView />);

    expect(screen.getByText('Verified Context Inspector')).toBeInTheDocument();
    expect(screen.getByText('LIVE STATE BOUND')).toBeInTheDocument();
    expect(screen.getByText('$142,500.00')).toBeInTheDocument();
    expect(screen.getByText('94 Days')).toBeInTheDocument();
    expect(screen.getByText('$18,450.00')).toBeInTheDocument();
    expect(screen.getByText('$16,800.00')).toBeInTheDocument();
  });

  it('TC-COPILOT-03: renders all 4 seeded suggestion question chips', () => {
    render(<CopilotView />);

    SUGGESTED_QUERIES.forEach((query, idx) => {
      expect(screen.getByTestId(`copilot-suggestion-chip-${idx}`)).toBeInTheDocument();
      expect(screen.getByText(query)).toBeInTheDocument();
    });
  });

  it('TC-COPILOT-04: submitting a prompt sends user message and evaluates grounded reply', async () => {
    render(<CopilotView />);

    const input = screen.getByTestId('copilot-input-field');
    const submitBtn = screen.getByTestId('copilot-submit-btn');

    act(() => {
      fireEvent.change(input, { target: { value: 'What is our current runway and cash buffer?' } });
    });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getAllByText('What is our current runway and cash buffer?').length).toBeGreaterThanOrEqual(2);

    await waitFor(() => {
      expect(screen.getByText(/Your cash runway is/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('TC-COPILOT-05: clicking a suggestion chip immediately sends query', async () => {
    render(<CopilotView />);

    const chip = screen.getByTestId('copilot-suggestion-chip-0');
    await act(async () => {
      fireEvent.click(chip);
    });

    await waitFor(() => {
      expect(screen.getByText(/Your cash runway is/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('TC-COPILOT-06: shows typing indicator when isCopilotThinking is true', () => {
    act(() => {
      usePayPilotStore.setState({ isCopilotThinking: true });
    });

    render(<CopilotView />);

    expect(screen.getByTestId('copilot-thinking-indicator')).toBeInTheDocument();
    expect(screen.getByText(/Verifying query against immutable ledger truth/i)).toBeInTheDocument();
  });

  it('TC-COPILOT-07: clicking citation badge triggers explainability or navigation', () => {
    render(<CopilotView />);

    const citationBtn = screen.getByTestId('copilot-citation-REC-101');
    act(() => {
      fireEvent.click(citationBtn);
    });

    expect(usePayPilotStore.getState().explainabilityDrawer.isOpen).toBe(true);
    expect(usePayPilotStore.getState().explainabilityDrawer.activeRecordId).toBe('REC-101');
  });

  it('TC-COPILOT-08: clicking Clear History resets conversation to pristine seed state', async () => {
    render(<CopilotView />);

    act(() => {
      usePayPilotStore.setState({
        copilotMessages: [
          ...usePayPilotStore.getState().copilotMessages,
          {
            id: 'TEST-MSG',
            role: 'user',
            timestamp: new Date().toISOString(),
            content: 'Test query to clear',
          },
        ],
      });
    });

    expect(screen.getByText('Test query to clear')).toBeInTheDocument();

    const clearBtn = screen.getByTestId('copilot-clear-history-btn');
    act(() => {
      fireEvent.click(clearBtn);
    });

    expect(screen.queryByText('Test query to clear')).not.toBeInTheDocument();
  });

  it('TC-COPILOT-09: generates contextual citations for Udhari and Runway queries and navigates appropriately on click', async () => {
    render(<CopilotView />);

    const input = screen.getByTestId('copilot-input-field');
    const submitBtn = screen.getByTestId('copilot-submit-btn');

    // 1. Submit Udhari query
    act(() => {
      fireEvent.change(input, { target: { value: 'Which clients have overdue udhari debt?' } });
    });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('copilot-citation-UDH-101')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click UDH-101 citation
    const udhariCitationBtn = screen.getByTestId('copilot-citation-UDH-101');
    act(() => {
      fireEvent.click(udhariCitationBtn);
    });
    expect(usePayPilotStore.getState().activeRoute).toBe('udhari-ledger');

    // 2. Submit Runway query
    act(() => {
      fireEvent.change(input, { target: { value: 'What is our runway and burn status?' } });
    });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('copilot-citation-KPI-RUNWAY')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click KPI-RUNWAY citation
    const runwayCitationBtn = screen.getByTestId('copilot-citation-KPI-RUNWAY');
    act(() => {
      fireEvent.click(runwayCitationBtn);
    });
    expect(usePayPilotStore.getState().activeRoute).toBe('commitments');
  });
});
