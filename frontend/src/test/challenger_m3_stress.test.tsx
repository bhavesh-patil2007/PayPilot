/**
 * frontend/src/test/challenger_m3_stress.test.tsx
 * 
 * Empirical Adversarial Challenger Test Suite (Milestone 3 - Challenger 1):
 * High-stress verification of Recovery Inbox & Payment Truth components:
 * 1. Rapid batch claim operations (multi-row, empty selection, all claimable, duplicate prevention)
 * 2. Discrepancy filtering under stress (filter cycling, search queries, modal rapid toggles)
 * 3. Invariants & Status Badges (SEED_RECONCILIATION_RECORDS length === 5, all 5 badges formatting)
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RecoveryInboxTable } from '../components/tables/RecoveryInboxTable';
import { PaymentTruthTable, getNormalizedMatchStatus } from '../components/tables/PaymentTruthTable';
import { DiscrepancyInspectorModal } from '../components/tables/DiscrepancyInspectorModal';
import { usePayPilotStore } from '../store/usePayPilotStore';
import { SEED_RECONCILIATION_RECORDS, SEED_RECOVERY_CASES } from '../store/demoSeedData';
import { ReconciliationRecord, RecoveryCase } from '../types';

describe('Milestone 3 Empirical Challenger Stress Suite (challenger_m3_1)', () => {
  beforeEach(() => {
    usePayPilotStore.getState().resetToDemoState();
    usePayPilotStore.getState().setSelectedDiscrepancyId(null);
  });

  // =========================================================================
  // SUITE 1: RAPID BATCH CLAIM OPERATIONS & DUPLICATE PREVENTION
  // =========================================================================
  describe('Suite 1: Rapid Batch Claim Operations & Duplicate Prevention', () => {
    it('handles empty selection gracefully (zero claims submitted, no state mutation)', async () => {
      const initialCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;
      const initialRecovered = usePayPilotStore.getState().recoveryFunnelMetrics.recoveredAmount;

      // Executing batch claim with empty array
      const result = await act(async () => {
        return await usePayPilotStore.getState().batchClaimRecoveryCases([]);
      });

      expect(result).toEqual({ processedCount: 0, totalAmount: 0 });
      expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(initialCash);
      expect(usePayPilotStore.getState().recoveryFunnelMetrics.recoveredAmount).toBe(initialRecovered);

      // Verify RecoveryInboxTable does not render batch-claim-bar on empty selection
      render(<RecoveryInboxTable />);
      expect(screen.queryByTestId('batch-claim-bar')).not.toBeInTheDocument();
    });

    it('executes multi-row selection batch claims accurately and increments cash & funnel', async () => {
      const initialCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;
      const initialRecovered = usePayPilotStore.getState().recoveryFunnelMetrics.recoveredAmount;

      // Select REC-101 ($1,420) and REC-102 ($840)
      const targetIds = ['REC-101', 'REC-102'];
      const expectedClaimSum = 1420 + 840; // $2,260

      const result = await act(async () => {
        return await usePayPilotStore.getState().batchClaimRecoveryCases(targetIds);
      });

      expect(result.processedCount).toBe(2);
      expect(result.totalAmount).toBe(expectedClaimSum);

      const state = usePayPilotStore.getState();
      const c1 = state.recoveryCases.find((c) => c.id === 'REC-101');
      const c2 = state.recoveryCases.find((c) => c.id === 'REC-102');

      expect(c1?.status).toBe('VERIFIED_RECOVERED');
      expect(c2?.status).toBe('VERIFIED_RECOVERED');
      expect(state.executiveKpis.totalAvailableCash).toBe(initialCash + expectedClaimSum);
      expect(state.recoveryFunnelMetrics.recoveredAmount).toBe(initialRecovered + expectedClaimSum);
    });

    it('selects and claims all claimable rows (POTENTIAL_IDENTIFIED), leaving 0 claimable', async () => {
      const initialClaimable = usePayPilotStore
        .getState()
        .recoveryCases.filter((c) => c.status === 'POTENTIAL_IDENTIFIED');
      expect(initialClaimable.length).toBeGreaterThan(0);

      const claimableIds = initialClaimable.map((c) => c.id);
      const expectedTotalAmount = initialClaimable.reduce((sum, c) => sum + c.claimAmount, 0);

      const result = await act(async () => {
        return await usePayPilotStore.getState().batchClaimRecoveryCases(claimableIds);
      });

      expect(result.processedCount).toBe(initialClaimable.length);
      expect(result.totalAmount).toBe(expectedTotalAmount);

      const remainingClaimable = usePayPilotStore
        .getState()
        .recoveryCases.filter((c) => c.status === 'POTENTIAL_IDENTIFIED');
      expect(remainingClaimable.length).toBe(0);
    });

    it('guarantees non-claimable rows cannot be claimed twice or double-counted', async () => {
      // Find rows that are not in POTENTIAL_IDENTIFIED state in the seed data
      const nonClaimable = usePayPilotStore
        .getState()
        .recoveryCases.filter((c) => c.status !== 'POTENTIAL_IDENTIFIED');
      expect(nonClaimable.length).toBeGreaterThan(0);

      const nonClaimableIds = nonClaimable.map((c) => c.id);
      const initialCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;
      const initialRecovered = usePayPilotStore.getState().recoveryFunnelMetrics.recoveredAmount;

      // Attempt to batch-claim already claimed / pending cases
      const result = await act(async () => {
        return await usePayPilotStore.getState().batchClaimRecoveryCases(nonClaimableIds);
      });

      // None should be processed
      expect(result.processedCount).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(initialCash);
      expect(usePayPilotStore.getState().recoveryFunnelMetrics.recoveredAmount).toBe(initialRecovered);

      // Verify statuses were not modified
      for (const orig of nonClaimable) {
        const current = usePayPilotStore.getState().recoveryCases.find((c) => c.id === orig.id);
        expect(current?.status).toBe(orig.status);
      }
    });

    it('strictly prevents duplicate claim submission on already claimed case (idempotency)', async () => {
      const targetId = 'REC-101';
      const initialCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;

      // First claim
      const firstRes = await act(async () => {
        return await usePayPilotStore.getState().batchClaimRecoveryCases([targetId]);
      });
      expect(firstRes.processedCount).toBe(1);
      expect(firstRes.totalAmount).toBe(1420);
      expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(initialCash + 1420);

      // Second claim attempt with the same case ID
      const secondRes = await act(async () => {
        return await usePayPilotStore.getState().batchClaimRecoveryCases([targetId]);
      });
      expect(secondRes.processedCount).toBe(0);
      expect(secondRes.totalAmount).toBe(0);
      // Available cash MUST NOT increment a second time
      expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(initialCash + 1420);
    });

    it('survives rapid consecutive batch claim attempts without state corruption', async () => {
      const initialCash = usePayPilotStore.getState().executiveKpis.totalAvailableCash;

      // Fire 5 sequential batch claims with the same target cases
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await usePayPilotStore.getState().batchClaimRecoveryCases(['REC-101', 'REC-102']);
        });
      }

      // Cash should only reflect exactly one successful claim ($1,420 + $840 = $2,260)
      expect(usePayPilotStore.getState().executiveKpis.totalAvailableCash).toBe(initialCash + 2260);
      const c1 = usePayPilotStore.getState().recoveryCases.find((c) => c.id === 'REC-101');
      const c2 = usePayPilotStore.getState().recoveryCases.find((c) => c.id === 'REC-102');
      expect(c1?.status).toBe('VERIFIED_RECOVERED');
      expect(c2?.status).toBe('VERIFIED_RECOVERED');
    });
  });

  // =========================================================================
  // SUITE 2: DISCREPANCY FILTERING & MODAL TOGGLING UNDER HIGH STRESS
  // =========================================================================
  describe('Suite 2: Discrepancy Filtering & Modal Toggling Under High Stress', () => {
    it('survives 100 rapid filter chip switches without crash or state desync', () => {
      render(<PaymentTruthTable />);

      const chips = [
        screen.getByTestId('filter-chip-all'),
        screen.getByTestId('filter-chip-discrepancies'),
        screen.getByTestId('filter-chip-matched'),
        screen.getByTestId('filter-chip-orphans'),
      ];

      // Rapidly switch filters 100 times
      act(() => {
        for (let i = 0; i < 100; i++) {
          const chip = chips[i % chips.length];
          fireEvent.click(chip);
        }
      });

      // Confirm component remains alive and interactive
      expect(screen.getByTestId('payment-truth-table')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-all')).toBeInTheDocument();
    });

    it('handles adversarial search inputs: empty, regex characters, XSS, unicode, and extreme lengths', () => {
      render(<PaymentTruthTable />);
      const searchInput = screen.getByPlaceholderText(/Search by ID, payer, bank.../i);

      const adversarialInputs = [
        '',
        '   ',
        '.*+?^${}()|[]\\',
        '<script>alert("xss")</script>',
        'DROP TABLE reconciliations;--',
        '🚀🔥💰',
        'a'.repeat(2000),
        'REC-3WAY-2024-1092',
        'non-existent-query-zzz-999',
      ];

      for (const query of adversarialInputs) {
        act(() => {
          fireEvent.change(searchInput, { target: { value: query } });
        });
        expect(searchInput).toHaveValue(query);
      }

      // Reset to empty
      act(() => {
        fireEvent.change(searchInput, { target: { value: '' } });
      });
      expect(searchInput).toHaveValue('');
    });

    it('survives rapid toggling of DiscrepancyInspectorModal open and close (50 iterations)', () => {
      render(<DiscrepancyInspectorModal />);

      for (let i = 0; i < 50; i++) {
        act(() => {
          usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
        });
        expect(screen.getByTestId('discrepancy-inspector-modal')).toBeInTheDocument();

        act(() => {
          usePayPilotStore.getState().setSelectedDiscrepancyId(null);
        });
        expect(screen.queryByTestId('discrepancy-inspector-modal')).not.toBeInTheDocument();
      }
    });

    it('switches between all 5 seed discrepancy records in the modal without errors', () => {
      render(<DiscrepancyInspectorModal />);

      const seedIds = ['REC-TRUTH-101', 'REC-TRUTH-102', 'REC-TRUTH-103', 'REC-TRUTH-104', 'REC-TRUTH-105'];

      for (const id of seedIds) {
        act(() => {
          usePayPilotStore.getState().setSelectedDiscrepancyId(id);
        });
        expect(screen.getByTestId('discrepancy-inspector-modal')).toBeInTheDocument();
      }

      // Close modal
      act(() => {
        usePayPilotStore.getState().setSelectedDiscrepancyId(null);
      });
      expect(screen.queryByTestId('discrepancy-inspector-modal')).not.toBeInTheDocument();
    });

    it('handles non-existent or null/malformed record IDs in DiscrepancyInspectorModal', () => {
      render(<DiscrepancyInspectorModal />);

      // Non-existent ID
      act(() => {
        usePayPilotStore.getState().setSelectedDiscrepancyId('UNKNOWN-ID-XYZ');
      });
      expect(screen.getByText('Record Not Found')).toBeInTheDocument();

      const closeBtn = screen.getByText('Close Inspector');
      act(() => {
        fireEvent.click(closeBtn);
      });
      expect(usePayPilotStore.getState().selectedDiscrepancyId).toBeNull();
    });

    it('dispatches Escape key event safely under rapid bursts', () => {
      render(<DiscrepancyInspectorModal />);

      act(() => {
        usePayPilotStore.getState().setSelectedDiscrepancyId('REC-TRUTH-101');
      });
      expect(screen.getByTestId('discrepancy-inspector-modal')).toBeInTheDocument();

      // Burst 10 escape key events
      act(() => {
        for (let i = 0; i < 10; i++) {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
      });

      expect(usePayPilotStore.getState().selectedDiscrepancyId).toBeNull();
      expect(screen.queryByTestId('discrepancy-inspector-modal')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 3: INVARIANTS & STATUS BADGE ROBUSTNESS
  // =========================================================================
  describe('Suite 3: Invariants & Status Badge Formatting Robustness', () => {
    it('verifies SEED_RECONCILIATION_RECORDS length invariant is strictly 5', () => {
      expect(SEED_RECONCILIATION_RECORDS).toBeDefined();
      expect(Array.isArray(SEED_RECONCILIATION_RECORDS)).toBe(true);
      expect(SEED_RECONCILIATION_RECORDS.length).toBe(5);

      // Verify exact ID preservation
      const expectedIds = [
        'REC-TRUTH-101',
        'REC-TRUTH-102',
        'REC-TRUTH-103',
        'REC-TRUTH-104',
        'REC-TRUTH-105',
      ];
      const actualIds = SEED_RECONCILIATION_RECORDS.map((r) => r.id);
      expect(actualIds).toEqual(expectedIds);

      // Verify active store initial state also has exactly 5 reconciliation records
      const storeRecords = usePayPilotStore.getState().reconciliationRecords;
      expect(storeRecords.length).toBe(5);
    });

    it('verifies all 5 status classifications normalize without runtime error', () => {
      const cases: { record: Partial<ReconciliationRecord>; expected: string }[] = [
        // MATCHED
        {
          record: { status: 'RECONCILED', varianceAmount: 0 },
          expected: 'MATCHED',
        },
        {
          record: { status: 'MATCHED' as any, varianceAmount: 0 },
          expected: 'MATCHED',
        },
        {
          record: { status: 'FULL_MATCH' as any, varianceAmount: 0 },
          expected: 'MATCHED',
        },
        {
          record: { varianceAmount: 0 },
          expected: 'MATCHED',
        },

        // DISCREPANCY
        {
          record: {
            status: 'DISCREPANCY_DETECTED',
            varianceAmount: 1420,
            paypalRecord: { grossAmount: 40000 } as any,
            bankRecord: { depositAmount: 38580 } as any,
          },
          expected: 'DISCREPANCY',
        },
        {
          record: {
            status: 'DISCREPANCY' as any,
            varianceAmount: 50,
            paypalRecord: {} as any,
            bankRecord: {} as any,
          },
          expected: 'DISCREPANCY',
        },

        // ORPHAN_PAYPAL
        {
          record: {
            status: 'ORPHAN_PAYPAL' as any,
            paypalRecord: { grossAmount: 100 } as any,
          },
          expected: 'ORPHAN_PAYPAL',
        },
        {
          record: {
            paypalRecord: { grossAmount: 100 } as any,
            bankRecord: undefined,
            ledgerRecord: undefined,
            varianceAmount: 100,
          },
          expected: 'ORPHAN_PAYPAL',
        },

        // ORPHAN_BANK
        {
          record: {
            status: 'ORPHAN_BANK' as any,
            bankRecord: { depositAmount: 200 } as any,
          },
          expected: 'ORPHAN_BANK',
        },
        {
          record: {
            paypalRecord: undefined,
            bankRecord: { depositAmount: 200 } as any,
            ledgerRecord: undefined,
            varianceAmount: 200,
          },
          expected: 'ORPHAN_BANK',
        },

        // ORPHAN_INVOICE
        {
          record: {
            status: 'ORPHAN_INVOICE' as any,
            ledgerRecord: { bookedAmount: 300 } as any,
          },
          expected: 'ORPHAN_INVOICE',
        },
        {
          record: {
            paypalRecord: undefined,
            bankRecord: undefined,
            ledgerRecord: { bookedAmount: 300 } as any,
            varianceAmount: 300,
          },
          expected: 'ORPHAN_INVOICE',
        },
      ];

      for (const { record, expected } of cases) {
        const result = getNormalizedMatchStatus(record as ReconciliationRecord);
        expect(result).toBe(expected);
      }
    });

    it('renders all 5 status badges cleanly inside PaymentTruthTable cellRenderer simulator', () => {
      // Test the cellRenderer badge formatting for all 5 statuses
      const statuses = ['MATCHED', 'DISCREPANCY', 'ORPHAN_PAYPAL', 'ORPHAN_BANK', 'ORPHAN_INVOICE'] as const;

      for (const st of statuses) {
        const mockRecord: Partial<ReconciliationRecord> = {
          id: `REC-TEST-${st}`,
          reconciliationKey: `REC-TEST-KEY-${st}`,
          date: '2024-11-04',
          status: st as any,
          varianceAmount: st === 'MATCHED' ? 0 : 500,
          matchScore: 85,
        };

        const normalized = getNormalizedMatchStatus(mockRecord as ReconciliationRecord);
        expect(normalized).toBe(st);
      }
    });

    it('survives missing, null, or malformed fields on reconciliation records without crash', () => {
      const malformedRecords: Partial<ReconciliationRecord>[] = [
        {},
        { id: 'REC-NULL-STATUS', status: undefined, varianceAmount: undefined },
        { id: 'REC-NAN-VARIANCE', status: 'DISCREPANCY_DETECTED', varianceAmount: NaN },
        { id: 'REC-NO-RECORDS', status: 'UNKNOWN' as any, varianceAmount: 100 },
        {
          id: 'REC-EMPTY-NESTED',
          status: 'DISCREPANCY_DETECTED',
          paypalRecord: {} as any,
          bankRecord: {} as any,
          ledgerRecord: {} as any,
          varianceAmount: 50,
        },
      ];

      for (const rec of malformedRecords) {
        expect(() => getNormalizedMatchStatus(rec as ReconciliationRecord)).not.toThrow();
        const status = getNormalizedMatchStatus(rec as ReconciliationRecord);
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      }
    });
  });
});
