import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TeamSharingView } from '../views/TeamSharingView';
import { usePayPilotStore } from '../store/usePayPilotStore';

describe('TeamSharingView Component', () => {
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

  it('TC-SHARING-01: renders Scoped Expiring Link Generator form and active reports list', () => {
    render(<TeamSharingView />);

    expect(screen.getByTestId('team-sharing-view')).toBeInTheDocument();
    expect(screen.getByText('Generate Signed Audit Report')).toBeInTheDocument();
    expect(screen.getByText(/Active Cryptographic Reports/i)).toBeInTheDocument();
    expect(screen.getByText('Authorized Team Members & Permissions Roster')).toBeInTheDocument();
  });

  it('TC-SHARING-02: generates a new signed report and displays formatted #PAY-SHA256-... badge', () => {
    render(<TeamSharingView />);

    const titleInput = screen.getByTestId('share-report-title-input');
    const generateBtn = screen.getByTestId('generate-signed-report-btn');

    act(() => {
      fireEvent.change(titleInput, { target: { value: 'New Test Audit Report' } });
    });

    act(() => {
      fireEvent.click(generateBtn);
    });

    expect(screen.getByText('New Test Audit Report')).toBeInTheDocument();
    const reports = usePayPilotStore.getState().sharedReports;
    const latest = reports[0];
    expect(latest.verificationBadgeLabel).toMatch(/^#PAY-SHA256-/);
  });

  it('TC-SHARING-03: copies scoped share URL with role and expiry parameters to clipboard', () => {
    render(<TeamSharingView />);

    const firstReport = usePayPilotStore.getState().sharedReports[0];
    const copyBtn = screen.getByTestId(`copy-share-link-btn-${firstReport.id}`);

    act(() => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('TC-SHARING-04: verifies cryptographic SHA-256 integrity against canonical JSON payload', () => {
    render(<TeamSharingView />);

    const firstReport = usePayPilotStore.getState().sharedReports[0];
    const verifyBtn = screen.getByTestId(`verify-integrity-btn-${firstReport.id}`);

    act(() => {
      fireEvent.click(verifyBtn);
    });

    expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
    expect(screen.getByText(/Tamper-Evident SHA-256 Match Verified/i)).toBeInTheDocument();
  });

  it('TC-SHARING-05: revokes an active shared report', () => {
    render(<TeamSharingView />);

    const firstReport = usePayPilotStore.getState().sharedReports[0];
    const revokeBtn = screen.getByTestId(`revoke-report-btn-${firstReport.id}`);

    act(() => {
      fireEvent.click(revokeBtn);
    });

    const updated = usePayPilotStore.getState().sharedReports.find((r) => r.id === firstReport.id);
    expect(updated?.revoked).toBe(true);
    expect(screen.getByText('REVOKED')).toBeInTheDocument();
  });

  it('TC-SHARING-06: renders Team Members roster with permissions checklists', () => {
    render(<TeamSharingView />);

    const members = usePayPilotStore.getState().teamMembers;
    members.forEach((m) => {
      expect(screen.getByTestId(`team-member-card-${m.id}`)).toBeInTheDocument();
      expect(screen.getByText(m.name)).toBeInTheDocument();
    });

    expect(screen.getAllByText('Execute PayPal Claims')[0]).toBeInTheDocument();
    expect(screen.getAllByText('View Raw Financials')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Export Signed Reports')[0]).toBeInTheDocument();
  });

  it('TC-SHARING-07: fails cryptographic integrity verification when canonical JSON payload is tampered', () => {
    render(<TeamSharingView />);

    const firstReport = usePayPilotStore.getState().sharedReports[0];
    const tamperedPayload = JSON.stringify({
      auditId: firstReport.id,
      recoveredAmount: 999999.00, // Tampered amount
      potentialAmount: 18450.00,
      casesCount: 12,
      platform: 'PayPilot PayPal AI Sandbox',
    });

    // Mutate the report payload in state
    act(() => {
      usePayPilotStore.setState((state) => ({
        sharedReports: state.sharedReports.map((r) =>
          r.id === firstReport.id
            ? { ...r, canonicalJsonPayload: tamperedPayload }
            : r
        ),
      }));
    });

    const verifyBtn = screen.getByTestId(`verify-integrity-btn-${firstReport.id}`);
    act(() => {
      fireEvent.click(verifyBtn);
    });

    // Confirmed badge must NOT be shown
    expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/Tamper-Evident SHA-256 Match Verified/i)).not.toBeInTheDocument();

    // Failed badge MUST be shown
    expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    expect(screen.getByText(/Cryptographic Integrity Compromised: SHA-256 Hash Mismatch/i)).toBeInTheDocument();
  });

  it('TC-SHARING-08: rejects verification when sha256ProofHash is an arbitrary 64-character hex string', () => {
    render(<TeamSharingView />);

    const firstReport = usePayPilotStore.getState().sharedReports[0];
    const bogus64CharHash = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

    act(() => {
      usePayPilotStore.setState((state) => ({
        sharedReports: state.sharedReports.map((r) =>
          r.id === firstReport.id
            ? { ...r, sha256ProofHash: bogus64CharHash }
            : r
        ),
      }));
    });

    const verifyBtn = screen.getByTestId(`verify-integrity-btn-${firstReport.id}`);
    act(() => {
      fireEvent.click(verifyBtn);
    });

    expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
    expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
  });

  it('TC-SHARING-09: freshly generated signed report passes strict SHA-256 verification end-to-end', () => {
    render(<TeamSharingView />);

    // Generate a fresh report dynamically
    act(() => {
      usePayPilotStore.getState().generateSignedReport('Q4 Executive Audit Pack', 'RECOVERY_AUDIT_PROOF');
    });

    const newReport = usePayPilotStore.getState().sharedReports[0];
    expect(newReport.reportTitle).toBe('Q4 Executive Audit Pack');

    const verifyBtn = screen.getByTestId(`verify-integrity-btn-${newReport.id}`);
    act(() => {
      fireEvent.click(verifyBtn);
    });

    expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();
  });
});
