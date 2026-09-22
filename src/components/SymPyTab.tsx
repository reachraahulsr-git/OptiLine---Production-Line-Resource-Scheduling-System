import React, { useState } from 'react';
import { Calculator, Play, Sparkles, BookOpen, Layers, Check } from 'lucide-react';
import { api } from '../api';
import { SymPyBatchResult, SymPyDecayResult, SymPyLineBalanceResult } from '../types';

export const SymPyTab: React.FC = () => {
  const [activeModel, setActiveModel] = useState<'epq' | 'decay' | 'line_balance'>('epq');

  // EPQ Inputs
  const [epqDemand, setEpqDemand] = useState(12000);
  const [epqSetupCost, setEpqSetupCost] = useState(350);
  const [epqHoldingCost, setEpqHoldingCost] = useState(4.5);
  const [epqProdRate, setEpqProdRate] = useState(35000);
  const [epqResult, setEpqResult] = useState<SymPyBatchResult | null>(null);
  const [isCalculatingEpq, setIsCalculatingEpq] = useState(false);

  // Decay Inputs
  const [decayPMax, setDecayPMax] = useState(120);
  const [decayK, setDecayK] = useState(0.35);
  const [decayShift, setDecayShift] = useState(8.0);
  const [decayResult, setDecayResult] = useState<SymPyDecayResult | null>(null);
  const [isCalculatingDecay, setIsCalculatingDecay] = useState(false);

  // Line Balance Inputs
  const [cycleTime, setCycleTime] = useState(4.5);
  const [stationTimes, setStationTimes] = useState('2.5, 3.2, 4.1, 1.8, 3.9');
  const [balanceResult, setBalanceResult] = useState<SymPyLineBalanceResult | null>(null);
  const [isCalculatingBalance, setIsCalculatingBalance] = useState(false);

  const handleComputeEpq = async () => {
    setIsCalculatingEpq(true);
    try {
      const res = await api.calculateSymPyBatch({
        annual_demand: epqDemand,
        setup_cost: epqSetupCost,
        holding_cost_per_unit: epqHoldingCost,
        production_rate: epqProdRate
      });
      setEpqResult(res.sympy_result);
    } catch (err: any) {
      alert(`SymPy error: ${err.message}`);
    } finally {
      setIsCalculatingEpq(false);
    }
  };

  const handleComputeDecay = async () => {
    setIsCalculatingDecay(true);
    try {
      const res = await api.calculateSymPyDecay({
        p_max: decayPMax,
        k_decay: decayK,
        shift_hours: decayShift
      });
      setDecayResult(res.sympy_result);
    } catch (err: any) {
      alert(`SymPy error: ${err.message}`);
    } finally {
      setIsCalculatingDecay(false);
    }
  };

  const handleComputeBalance = async () => {
    setIsCalculatingBalance(false);
    try {
      const caps = stationTimes
        .split(',')
        .map((x) => parseFloat(x.trim()))
        .filter((x) => !isNaN(x) && x > 0);
      if (caps.length === 0) {
        alert('Please provide valid comma-separated task times');
        return;
      }
      setIsCalculatingBalance(true);
      const res = await api.calculateSymPyLineBalancing({
        station_capacities: caps,
        target_cycle_time: cycleTime
      });
      setBalanceResult(res.sympy_result);
    } catch (err: any) {
      alert(`SymPy error: ${err.message}`);
    } finally {
      setIsCalculatingBalance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight">SymPy Symbolic Mathematical Engine</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
              SymPy 1.x Symbolic Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Symbolic calculus, first-order derivatives, definite integrals, and exact closed-form algebraic solutions
          </p>
        </div>

        {/* Model Tabs */}
        <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs">
          <button
            onClick={() => setActiveModel('epq')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeModel === 'epq'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Economic Batch (EPQ)
          </button>
          <button
            onClick={() => setActiveModel('decay')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeModel === 'decay'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calculus Rate Integration
          </button>
          <button
            onClick={() => setActiveModel('line_balance')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeModel === 'line_balance'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Line Balancing Delay
          </button>
        </div>
      </div>

      {/* MODEL 1: EPQ */}
      {activeModel === 'epq' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Panel */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">EPQ Model Parameters</h3>
            <p className="text-xs text-slate-400">
              Derives optimal manufacturing batch $Q^*$ minimizing setup and holding inventory overheads:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Annual Product Demand (D)</label>
                <input
                  type="number"
                  value={epqDemand}
                  onChange={(e) => setEpqDemand(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Machine Setup Cost per Run (S)</label>
                <input
                  type="number"
                  value={epqSetupCost}
                  onChange={(e) => setEpqSetupCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Unit Holding Cost per Year (H)</label>
                <input
                  type="number"
                  step="0.1"
                  value={epqHoldingCost}
                  onChange={(e) => setEpqHoldingCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Annual Production Capacity (P)</label>
                <input
                  type="number"
                  value={epqProdRate}
                  onChange={(e) => setEpqProdRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleComputeEpq}
              disabled={isCalculatingEpq}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCalculatingEpq ? 'Deriving via SymPy...' : 'Symbolically Solve dTC/dQ = 0'}</span>
            </button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">SymPy Mathematical Derivation & Output</h3>

            {epqResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="text-slate-400"># SymPy Total Cost Function:</div>
                  <div className="text-cyan-300 font-semibold">
                    TC(Q) = (D/Q)*S + (Q/2)*H*(1 - D/P)
                  </div>
                  <div className="text-slate-400 pt-2"># First Derivative Solved for Extremum:</div>
                  <div className="text-amber-300">
                    d(TC)/dQ = {epqResult.derivative_expression || '-D*S/Q^2 + H*(1 - D/P)/2 = 0'}
                  </div>
                  <div className="text-slate-400 pt-2"># Exact Symbolic Closed-Form Solution:</div>
                  <div className="text-emerald-300 font-bold">
                    Q* = {epqResult.symbolic_formula}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 block">Optimal Batch Quantity (Q*)</span>
                    <span className="text-3xl font-bold font-mono text-cyan-400 mt-1 block">
                      {epqResult.optimal_batch_q} units
                    </span>
                    <span className="text-[10px] text-slate-400">Minimizes setup + carrying cost</span>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 block">Calculated Total Annual Cost</span>
                    <span className="text-3xl font-bold font-mono text-emerald-400 mt-1 block">
                      ${epqResult.total_annual_cost?.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">At optimal batch size</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                Click &quot;Symbolically Solve dTC/dQ = 0&quot; to execute SymPy calculus engine on Python backend.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODEL 2: DECAY */}
      {activeModel === 'decay' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Rate Model Parameters</h3>
            <p className="text-xs text-slate-400">
              Models production warm-up and tool wear via non-linear differential equation P(t) = P_max * (1 - e^(-kt)):
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Max Nominal Rate P_max (units/h)</label>
                <input
                  type="number"
                  value={decayPMax}
                  onChange={(e) => setDecayPMax(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Decay / Ramp Constant k</label>
                <input
                  type="number"
                  step="0.05"
                  value={decayK}
                  onChange={(e) => setDecayK(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Shift Duration T (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={decayShift}
                  onChange={(e) => setDecayShift(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleComputeDecay}
              disabled={isCalculatingDecay}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCalculatingDecay ? 'Integrating via SymPy...' : 'Symbolic Definite Integral'}</span>
            </button>
          </div>

          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Calculus Integral Evaluation</h3>

            {decayResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="text-slate-400"># SymPy Definite Integral Formulation:</div>
                  <div className="text-cyan-300">
                    Total_Units = ∫₀ᵀ P_max * (1 - e^(-k*t)) dt
                  </div>
                  <div className="text-slate-400 pt-2"># Symbolic Anti-Derivative:</div>
                  <div className="text-emerald-300">
                    {decayResult.symbolic_integral}
                  </div>
                  <div className="text-slate-400 pt-2"># Marginal Rate Acceleration dP/dt:</div>
                  <div className="text-amber-300 font-mono">
                    {decayResult.symbolic_derivative}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 block">Total Shift Yield (∫ P dt)</span>
                    <span className="text-3xl font-bold font-mono text-cyan-400 mt-1 block">
                      {decayResult.total_units_in_shift} units
                    </span>
                    <span className="text-[10px] text-slate-400">Cumulative produced over {decayShift} hours</span>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 block">Average Hourly Rate</span>
                    <span className="text-3xl font-bold font-mono text-indigo-400 mt-1 block">
                      {decayResult.average_hourly_rate?.toFixed(1)} u/h
                    </span>
                    <span className="text-[10px] text-slate-400">Effective average velocity</span>
                  </div>
                </div>

                {decayResult.curve_points && (
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60">
                    <span className="text-xs font-semibold text-slate-300 mb-2 block">
                      Hourly Production Velocity Progression:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
                      {decayResult.curve_points.map((pt) => (
                        <div key={pt.hour} className="p-2 rounded bg-slate-800 border border-slate-700">
                          <span className="text-[10px] text-slate-400 block">{pt.hour}h</span>
                          <span className="font-mono font-bold text-cyan-400">{pt.units_per_hour}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                Click &quot;Symbolic Definite Integral&quot; to execute SymPy calculus integration.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODEL 3: LINE BALANCING */}
      {activeModel === 'line_balance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Line Balancing Setup</h3>
            <p className="text-xs text-slate-400">
              Evaluates workstation cycle times against conveyor target takt time:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Cycle Takt Time C (minutes)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cycleTime}
                  onChange={(e) => setCycleTime(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Workstation Task Times (comma-separated minutes)
                </label>
                <input
                  type="text"
                  value={stationTimes}
                  onChange={(e) => setStationTimes(e.target.value)}
                  placeholder="2.5, 3.2, 4.1, 1.8, 3.9"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleComputeBalance}
              disabled={isCalculatingBalance}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCalculatingBalance ? 'Computing Line Balance...' : 'Compute Equilibrium'}</span>
            </button>
          </div>

          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Line Efficiency & Balance Delay Analysis</h3>

            {balanceResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="text-slate-400"># SymPy Theoretical Lower Bound:</div>
                  <div className="text-cyan-300">
                    N_min = ceil(Σ t_i / C) = {balanceResult.theoretical_min_stations} stations
                  </div>
                  <div className="text-slate-400 pt-2"># Symbolic Line Efficiency Formulation:</div>
                  <div className="text-emerald-300 font-mono">
                    Efficiency = (Σ t_i / (N * C)) * 100%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 block">Line Efficiency</span>
                    <span className="text-3xl font-bold font-mono text-emerald-400 mt-1 block">
                      {balanceResult.line_efficiency_pct}%
                    </span>
                    <span className="text-[10px] text-slate-400">Active utilization ratio</span>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 block">Balance Delay (Idle Waste)</span>
                    <span className="text-3xl font-bold font-mono text-amber-400 mt-1 block">
                      {balanceResult.balance_delay_pct}%
                    </span>
                    <span className="text-[10px] text-slate-400">Conveyor idle wait time</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                Click &quot;Compute Equilibrium&quot; to calculate line balancing statistics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
