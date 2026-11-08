import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { TeamSharingView } from '../views/TeamSharingView';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { pureJsSha256, formatSignatureBadge, canonicalStringify } from '../services/hashService';
import { HashSignedReport } from '../types';

describe('Challenger M5 IT2: Cryptographic Tamper-Proofing & Integrity Adversarial Suite', () => {
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

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. Single-Character & Fine-Grained Payload Tampering Detection
  // ==========================================================================
  describe('Requirement 1: Single-character and granular payload tampering detection', () => {
    it('TC-TAMPER-01: fails verification immediately when a single numeric digit in canonicalJsonPayload is modified', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      expect(seedReport.id).toBe('REP-7F83');

      // Original recoveredAmount is 4200.00 -> tamper to 4200.01 (1 cent change)
      const parsed = JSON.parse(seedReport.canonicalJsonPayload);
      parsed.recoveredAmount = 4200.01;
      const tamperedPayload = JSON.stringify(parsed);

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, canonicalJsonPayload: tamperedPayload } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
      expect(screen.getByText(/Cryptographic Integrity Compromised: SHA-256 Hash Mismatch/i)).toBeInTheDocument();
    });

    it('TC-TAMPER-02: fails verification when mutating single characters at first, middle, and last character index of canonicalJsonPayload', () => {
      const { unmount } = render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      const originalPayload = seedReport.canonicalJsonPayload;

      const testIndices = [0, Math.floor(originalPayload.length / 2), originalPayload.length - 1];

      for (const idx of testIndices) {
        // Substitute char at idx
        const originalChar = originalPayload[idx];
        const replacementChar = originalChar === 'X' ? 'Y' : 'X';
        const tampered =
          originalPayload.substring(0, idx) + replacementChar + originalPayload.substring(idx + 1);

        act(() => {
          usePayPilotStore.setState((state) => ({
            sharedReports: state.sharedReports.map((r) =>
              r.id === seedReport.id ? { ...r, canonicalJsonPayload: tampered } : r
            ),
          }));
        });

        const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
        act(() => {
          fireEvent.click(verifyBtn);
        });

        expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
        expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
      }
      unmount();
    });

    it('TC-TAMPER-03: fails verification when trailing whitespace or newline is injected into canonicalJsonPayload', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      const tamperedWithSpace = seedReport.canonicalJsonPayload + ' ';

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, canonicalJsonPayload: tamperedWithSpace } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });

    it('TC-TAMPER-04: fails verification when canonical JSON key order is perturbed without canonicalStringify normalization', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      // Reverse keys manually in raw string
      const nonCanonicalJson = JSON.stringify({
        platform: 'PayPilot PayPal AI Sandbox',
        casesCount: 12,
        potentialAmount: 18450.00,
        recoveredAmount: 4200.00,
        auditId: 'REP-7F83',
      });

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, canonicalJsonPayload: nonCanonicalJson } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      // Since the raw string differs from the canonical payload that was hashed, SHA-256 changes
      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 2. Arbitrary 64-Character String Rejection (Bypass Prevention)
  // ==========================================================================
  describe('Requirement 2: Arbitrary 64-character hash strings must fail verification', () => {
    it('TC-BYPASS-01: fails verification when sha256ProofHash is 64 "0"s', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      const allZeros64 = '0'.repeat(64);

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, sha256ProofHash: allZeros64 } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });

    it('TC-BYPASS-02: fails verification when sha256ProofHash is 64 "f"s or 64 "a"s', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      for (const char of ['f', 'a']) {
        const dummyHash = char.repeat(64);
        act(() => {
          usePayPilotStore.setState((state) => ({
            sharedReports: state.sharedReports.map((r) =>
              r.id === seedReport.id ? { ...r, sha256ProofHash: dummyHash } : r
            ),
          }));
        });

        const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
        act(() => {
          fireEvent.click(verifyBtn);
        });

        expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
        expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
      }
    });

    it('TC-BYPASS-03: fails verification on valid 64-character hex hash from an unrelated object', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      // A genuine 64-char SHA-256 hash, but of completely different content: "unrelated content"
      const unrelatedHash = pureJsSha256('completely unrelated payload string');
      expect(unrelatedHash).toHaveLength(64);
      expect(unrelatedHash).not.toBe(seedReport.sha256ProofHash);

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, sha256ProofHash: unrelatedHash } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });

    it('TC-BYPASS-04: fails verification when sha256ProofHash is non-hex 64-character alphanumeric string', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      const nonHex64 = 'Z'.repeat(64);

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, sha256ProofHash: nonHex64 } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. Case-Insensitive Hash Handling (Uppercase & Mixed Case)
  // ==========================================================================
  describe('Requirement 3: Uppercase and mixed-case SHA-256 hashes must be verified case-insensitively', () => {
    it('TC-CASE-01: verifies successfully when sha256ProofHash is converted to all-uppercase', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      const uppercaseHash = seedReport.sha256ProofHash.toUpperCase();
      expect(uppercaseHash).not.toBe(seedReport.sha256ProofHash);

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, sha256ProofHash: uppercaseHash } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
      expect(screen.getByText(/Tamper-Evident SHA-256 Match Verified/i)).toBeInTheDocument();
      expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();
    });

    it('TC-CASE-02: verifies successfully when sha256ProofHash is in alternating mixed case', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      // Alternating mixed case: even index uppercase, odd index lowercase
      const mixedCaseHash = seedReport.sha256ProofHash
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
        .join('');

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, sha256ProofHash: mixedCaseHash } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
      expect(screen.getByText(/Tamper-Evident SHA-256 Match Verified/i)).toBeInTheDocument();
      expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4. Genuine Unmodified Seed Report Verification
  // ==========================================================================
  describe('Requirement 4: Genuine unmodified seed reports pass verification', () => {
    it('TC-SEED-01: pristine seed report REP-7F83 passes verification and displays green badge', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      // Mathematical proof check before clicking
      const calculatedHash = pureJsSha256(seedReport.canonicalJsonPayload);
      expect(calculatedHash).toBe(seedReport.sha256ProofHash);
      expect(seedReport.sha256ProofHash).toBe('d68ce70c858556f869267799f4ee74fbb3a07f4b62e3a848bc7d33306de4c870');

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
      expect(screen.getByText(/Tamper-Evident SHA-256 Match Verified/i)).toBeInTheDocument();
      expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();

      // Check badge formatting
      const hashBadge = screen.getByTestId(`report-hash-badge-${seedReport.id}`);
      expect(hashBadge.textContent).toBe('#PAY-SHA256-D68CE70C-6DE4C870');
    });

    it('TC-SEED-02: pristine seed report survives multiple repeated verification clicks idempotently', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);

      for (let i = 0; i < 5; i++) {
        act(() => {
          fireEvent.click(verifyBtn);
        });
        expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
        expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();
      }
    });
  });

  // ==========================================================================
  // 5. Newly Generated Signed Reports Verification
  // ==========================================================================
  describe('Requirement 5: Newly generated signed reports pass verification', () => {
    it('TC-GEN-01: newly generated reports for all 3 report types verify cleanly', () => {
      render(<TeamSharingView />);
      const store = usePayPilotStore.getState();

      const reportTypes: HashSignedReport['reportType'][] = [
        'RECOVERY_AUDIT_PROOF',
        'PAYMENT_TRUTH_PACK',
        '90DAY_CASH_FLOW_FORECAST',
      ];

      for (const rType of reportTypes) {
        let generatedReport: HashSignedReport;
        act(() => {
          generatedReport = store.generateSignedReport(`Automated ${rType} Report`, rType);
        });

        const latestReport = usePayPilotStore.getState().sharedReports[0];
        expect(latestReport.reportType).toBe(rType);
        expect(latestReport.sha256ProofHash).toMatch(/^[0-9a-f]{64}$/);

        // Verification in UI
        const verifyBtn = screen.getByTestId(`verify-integrity-btn-${latestReport.id}`);
        act(() => {
          fireEvent.click(verifyBtn);
        });

        expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
        expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();
      }
    });

    it('TC-GEN-02: generating a report via the UI form and immediately verifying it passes', () => {
      render(<TeamSharingView />);

      const titleInput = screen.getByTestId('share-report-title-input');
      const typeSelect = screen.getByTestId('share-report-type-select');
      const generateBtn = screen.getByTestId('generate-signed-report-btn');

      act(() => {
        fireEvent.change(titleInput, { target: { value: 'End-to-End Form Generated Audit' } });
        fireEvent.change(typeSelect, { target: { value: 'PAYMENT_TRUTH_PACK' } });
      });

      act(() => {
        fireEvent.click(generateBtn);
      });

      expect(screen.getByText('End-to-End Form Generated Audit')).toBeInTheDocument();
      const latest = usePayPilotStore.getState().sharedReports[0];
      expect(latest.reportTitle).toBe('End-to-End Form Generated Audit');

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${latest.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();
    });

    it('TC-GEN-03: newly generated report subsequently tampered in state fails verification', () => {
      render(<TeamSharingView />);
      let newReport: HashSignedReport;
      act(() => {
        newReport = usePayPilotStore
          .getState()
          .generateSignedReport('Tamper Target Report', 'RECOVERY_AUDIT_PROOF');
      });

      // Verify it passes first
      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${newReport!.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });
      expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();

      // Now tamper the cashBalance in the canonicalJsonPayload
      const parsed = JSON.parse(newReport!.canonicalJsonPayload);
      parsed.cashBalance = 99999999.99;
      const corruptedJson = JSON.stringify(parsed);

      act(() => {
        usePayPilotStore.setState((s) => ({
          sharedReports: s.sharedReports.map((r) =>
            r.id === newReport!.id ? { ...r, canonicalJsonPayload: corruptedJson } : r
          ),
        }));
      });

      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 6. Edge Cases & State Recovery
  // ==========================================================================
  describe('Requirement 6: Edge cases, missing fields, truncation & state recovery', () => {
    it('TC-EDGE-01: fails verification gracefully when canonicalJsonPayload is empty string or undefined', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, canonicalJsonPayload: '' } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });

    it('TC-EDGE-02: fails verification when sha256ProofHash is truncated to 63 characters', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      const truncatedHash = seedReport.sha256ProofHash.slice(0, 63);

      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, sha256ProofHash: truncatedHash } : r
          ),
        }));
      });

      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);
      act(() => {
        fireEvent.click(verifyBtn);
      });

      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
    });

    it('TC-EDGE-03: recovers from verification failure to confirmed status when genuine payload is restored', () => {
      render(<TeamSharingView />);
      const seedReport = usePayPilotStore.getState().sharedReports[0];
      const genuinePayload = seedReport.canonicalJsonPayload;
      const verifyBtn = screen.getByTestId(`verify-integrity-btn-${seedReport.id}`);

      // 1. Tamper payload
      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, canonicalJsonPayload: '{"corrupted": true}' } : r
          ),
        }));
      });

      act(() => {
        fireEvent.click(verifyBtn);
      });
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();

      // 2. Restore genuine payload
      act(() => {
        usePayPilotStore.setState((state) => ({
          sharedReports: state.sharedReports.map((r) =>
            r.id === seedReport.id ? { ...r, canonicalJsonPayload: genuinePayload } : r
          ),
        }));
      });

      act(() => {
        fireEvent.click(verifyBtn);
      });
      expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();
    });

    it('TC-EDGE-04: verification status correctly transitions across multiple reports in the list', async () => {
      vi.useFakeTimers();
      render(<TeamSharingView />);
      const store = usePayPilotStore.getState();

      // Create 2 additional reports with distinct timestamps
      let r1: HashSignedReport;
      let r2: HashSignedReport;
      act(() => {
        r1 = store.generateSignedReport('Report Alpha', 'RECOVERY_AUDIT_PROOF');
      });
      vi.advanceTimersByTime(100);
      act(() => {
        r2 = store.generateSignedReport('Report Beta', 'PAYMENT_TRUTH_PACK');
      });

      expect(r1!.id).not.toBe(r2!.id);

      // Tamper r1 but leave r2 genuine
      act(() => {
        usePayPilotStore.setState((s) => ({
          sharedReports: s.sharedReports.map((r) =>
            r.id === r1!.id ? { ...r, canonicalJsonPayload: '{"tampered":1}' } : r
          ),
        }));
      });

      const btn1 = screen.getByTestId(`verify-integrity-btn-${r1!.id}`);
      const btn2 = screen.getByTestId(`verify-integrity-btn-${r2!.id}`);

      // Click r1 -> failed
      act(() => {
        fireEvent.click(btn1);
      });
      expect(screen.getByTestId('verification-failed-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();

      // Click r2 -> verified (replaces failed badge with confirmed badge on r2)
      act(() => {
        fireEvent.click(btn2);
      });
      expect(screen.getByTestId('verification-confirmed-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('verification-failed-badge')).not.toBeInTheDocument();

      // Fast forward 4000ms -> badge auto-clears
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.queryByTestId('verification-confirmed-badge')).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });
});
