import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UdhariLedgerTable } from '../components/tables/UdhariLedgerTable';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('UdhariLedgerTable Component', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
  });

  it('renders table container, search input, and account count indicator', () => {
    render(<UdhariLedgerTable />);

    expect(screen.getByTestId('udhari-ledger-table')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search debtor name, business, code/i)).toBeInTheDocument();
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText(/accounts/i)).toBeInTheDocument();
  });

  it('updates search query input without error', () => {
    render(<UdhariLedgerTable />);

    const searchInput = screen.getByPlaceholderText(/Search debtor name, business, code/i);
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
    });

    expect(searchInput).toHaveValue('Acme');
  });

  it('filters by selectedBucket prop cleanly', () => {
    render(<UdhariLedgerTable selectedBucket="31_60_DAYS" />);

    expect(screen.getByTestId('udhari-ledger-table')).toBeInTheDocument();
  });

  it('opens built-in WhatsApp Reminder modal when onOpenWhatsAppModal is not supplied', () => {
    render(<UdhariLedgerTable />);

    const firstCustomer = usePayPilotStore.getState().udhariCustomers[0];

    // Simulate clicking action button via modal trigger
    const whatsappBtns = screen.getAllByTitle('Send WhatsApp Reminder');
    if (whatsappBtns.length > 0) {
      act(() => {
        fireEvent.click(whatsappBtns[0]);
      });
      expect(screen.getByTestId('whatsapp-modal-backdrop')).toBeInTheDocument();
      expect(screen.getAllByText('Send WhatsApp Reminder')[0]).toBeInTheDocument();
      expect(screen.getByText('FRIENDLY')).toBeInTheDocument();
      expect(screen.getByText('STANDARD')).toBeInTheDocument();
      expect(screen.getByText('FIRM')).toBeInTheDocument();
    }
  });

  it('opens built-in PayPal Invoice modal and generates checkout link', () => {
    render(<UdhariLedgerTable />);

    const invoiceBtns = screen.getAllByTitle('Generate PayPal Invoice');
    if (invoiceBtns.length > 0) {
      act(() => {
        fireEvent.click(invoiceBtns[0]);
      });
      expect(screen.getByTestId('invoice-modal-backdrop')).toBeInTheDocument();
      expect(screen.getByText('Generate PayPal Invoice')).toBeInTheDocument();
      expect(screen.getByText(/Dispatch via PayPal Sandbox REST v2/i)).toBeInTheDocument();
    }
  });

  it('opens built-in Settlement modal, allows selecting discount tier, and records settlement', () => {
    render(<UdhariLedgerTable />);

    const settleBtns = screen.getAllByTitle('Offer Settlement Discount');
    if (settleBtns.length > 0) {
      act(() => {
        fireEvent.click(settleBtns[0]);
      });
      expect(screen.getByTestId('settlement-modal-backdrop')).toBeInTheDocument();
      expect(screen.getByText('Offer Immediate Settlement Discount')).toBeInTheDocument();
      expect(screen.getByText('5% OFF')).toBeInTheDocument();
      expect(screen.getByText('10% OFF')).toBeInTheDocument();
      expect(screen.getByText('15% OFF')).toBeInTheDocument();

      const recordBtn = screen.getByText('Record Immediate Settlement');
      act(() => {
        fireEvent.click(recordBtn);
      });

      expect(screen.queryByTestId('settlement-modal-backdrop')).not.toBeInTheDocument();
    }
  });

  it('delegates to onOpenWhatsAppModal callback when provided as a prop', () => {
    const handleWhatsApp = vi.fn();
    render(<UdhariLedgerTable onOpenWhatsAppModal={handleWhatsApp} />);

    const whatsappBtns = screen.getAllByTitle('Send WhatsApp Reminder');
    if (whatsappBtns.length > 0) {
      act(() => {
        fireEvent.click(whatsappBtns[0]);
      });
      expect(handleWhatsApp).toHaveBeenCalled();
    }
  });

  it('delegates to onOpenPayPalInvoiceModal callback when provided as a prop', () => {
    const handleInvoice = vi.fn();
    render(<UdhariLedgerTable onOpenPayPalInvoiceModal={handleInvoice} />);

    const invoiceBtns = screen.getAllByTitle('Generate PayPal Invoice');
    if (invoiceBtns.length > 0) {
      act(() => {
        fireEvent.click(invoiceBtns[0]);
      });
      expect(handleInvoice).toHaveBeenCalled();
    }
  });

  it('delegates to onOpenSettlementModal callback when provided as a prop', () => {
    const handleSettlement = vi.fn();
    render(<UdhariLedgerTable onOpenSettlementModal={handleSettlement} />);

    const settleBtns = screen.getAllByTitle('Offer Settlement Discount');
    if (settleBtns.length > 0) {
      act(() => {
        fireEvent.click(settleBtns[0]);
      });
      expect(handleSettlement).toHaveBeenCalled();
    }
  });
});
