import { useState, useEffect, useCallback } from 'react';
import {
  ObligationItem,
  SimulateScheduleResponse,
} from '../types';
import * as obligationsApi from '../services/obligationsApi';

export function useObligations() {
  const [obligations, setObligations] = useState<ObligationItem[]>([]);
  const [simulation, setSimulation] = useState<SimulateScheduleResponse | null>(null);
  const [scenario, setScenario] = useState<'baseline' | 'delayed_inflow' | 'low_sales' | 'unexpected_expense'>('baseline');
  const [startingCash, setStartingCash] = useState<number>(142500.0);
  const [reserveFloor, setReserveFloor] = useState<number>(15000.0);
  const [prioritizeDiscounts, setPrioritizeDiscounts] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadObligations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await obligationsApi.fetchObligations();
      setObligations(data);
    } catch (err) {
      console.error('[useObligations] Failed to load obligations', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runSimulation = useCallback(
    async (
      overrideScenario?: 'baseline' | 'delayed_inflow' | 'low_sales' | 'unexpected_expense',
      overrideReserve?: number
    ) => {
      setIsSimulating(true);
      try {
        const result = await obligationsApi.simulateObligationSchedule({
          scenario_id: overrideScenario || scenario,
          starting_cash: startingCash,
          reserve_floor: overrideReserve ?? reserveFloor,
          prioritize_discounts: prioritizeDiscounts,
        });
        setSimulation(result);
        if (result.reserve_breached) {
          setActionMessage(`RESERVE BREACH DETECTED: Projected cash falls below $${(overrideReserve ?? reserveFloor).toLocaleString()} floor! Alternative dates calculated.`);
        } else {
          setActionMessage(`Schedule optimized: $${result.total_discounts_captured.toFixed(2)} discounts captured, $${result.total_late_fees_avoided.toFixed(2)} late fees avoided.`);
        }
      } catch (err) {
        console.error('[useObligations] Simulation error', err);
      } finally {
        setIsSimulating(false);
      }
    },
    [scenario, startingCash, reserveFloor, prioritizeDiscounts]
  );

  useEffect(() => {
    loadObligations();
    runSimulation();
  }, [loadObligations, runSimulation]);

  const changeScenario = (newScenario: 'baseline' | 'delayed_inflow' | 'low_sales' | 'unexpected_expense') => {
    setScenario(newScenario);
    runSimulation(newScenario);
  };

  const approveItems = async (selectedIds: string[]) => {
    if (!simulation) return;
    setIsSimulating(true);
    try {
      const result = await obligationsApi.approveObligationSchedule(simulation.schedule_id, selectedIds);
      setActionMessage(`Approved ${result.approved_items_count} scheduled obligations (Approval Hash: ${result.approval_hash.substring(0, 10)}...).`);
      await loadObligations();
      await runSimulation();
    } finally {
      setIsSimulating(false);
    }
  };

  const executePayment = async (obligationId: string, type: 'provider_direct' | 'task_reminder') => {
    setIsSimulating(true);
    try {
      const result = await obligationsApi.executeObligation(obligationId, type);
      setActionMessage(result.message);
      await loadObligations();
      await runSimulation();
    } finally {
      setIsSimulating(false);
    }
  };

  const addObligation = async (payload: {
    payee_name: string;
    amount: number;
    currency?: string;
    due_date: string;
    earliest_pay_date?: string;
    latest_pay_date?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    source_type?: any;
  }) => {
    setIsLoading(true);
    try {
      const created = await obligationsApi.createObligation(payload);
      setActionMessage(`Added obligation for ${created.payee_name} ($${created.amount.toLocaleString()}).`);
      await loadObligations();
      await runSimulation();
      return created;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    obligations,
    simulation,
    scenario,
    startingCash,
    reserveFloor,
    prioritizeDiscounts,
    isLoading,
    isSimulating,
    actionMessage,
    setStartingCash,
    setReserveFloor,
    setPrioritizeDiscounts,
    changeScenario,
    runSimulation,
    approveItems,
    executePayment,
    addObligation,
    clearActionMessage: () => setActionMessage(null),
  };
}
