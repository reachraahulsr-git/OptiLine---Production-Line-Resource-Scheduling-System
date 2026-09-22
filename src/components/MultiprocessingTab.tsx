import React, { useState } from 'react';
import { Workflow, Play, Cpu, Zap, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { ParallelSimReport } from '../types';

export const MultiprocessingTab: React.FC = () => {
  const [report, setReport] = useState<ParallelSimReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunSim = async () => {
    setIsRunning(true);
    try {
      const res = await api.runParallelSim();
      setReport(res.simulation);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight">Python Multiprocessing Parallel Simulator</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
              multiprocessing.Pool
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Executes parallel scenario evaluations, stochastic disruption stress-testing, and multicore benchmarking
          </p>
        </div>

        <button
          onClick={handleRunSim}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Distributing Processes...' : 'Run Parallel Simulation'}</span>
        </button>
      </div>

      {/* Benchmark Telemetry */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hardware Cores</span>
            </span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {report.cpu_cores_available} Cores
            </span>
            <span className="text-[10px] text-slate-500">{report.processes_spawned} worker processes</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Wall-Clock Time</span>
            </span>
            <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
              {report.wall_clock_time_ms.toFixed(1)} ms
            </span>
            <span className="text-[10px] text-slate-500">Cumulative: {report.cumulative_worker_cpu_time_ms.toFixed(1)} ms</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Parallel Speedup</span>
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              {report.parallel_speedup_factor.toFixed(2)}x
            </span>
            <span className="text-[10px] text-slate-500">Multiprocessing efficiency</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scenarios Evaluated</span>
            </span>
            <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
              {report.total_scenarios_simulated} Runs
            </span>
            <span className="text-[10px] text-slate-500">Stochastic stress tests</span>
          </div>
        </div>
      )}

      {/* Scenario Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white">Parallel Scenario Simulations Results</h3>

        {report ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.scenarios.map((sc) => (
              <div key={sc.scenario_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Scenario #{sc.scenario_id}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{sc.name}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      sc.risk_score_pct > 60
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : sc.risk_score_pct > 30
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    Risk: {sc.risk_score_pct}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Makespan</span>
                    <span className="font-mono font-bold text-cyan-400">{sc.simulated_makespan_hours}h</span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Est. Cost</span>
                    <span className="font-mono font-bold text-emerald-400">${sc.total_cost.toFixed(0)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Worker Time</span>
                    <span className="font-mono font-bold text-slate-300">{sc.worker_exec_time_ms.toFixed(1)}ms</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Critical Bottleneck Workstation:</span>
                  <span className="font-medium text-slate-200">{sc.bottleneck_machine}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-xl bg-slate-900 border border-dashed border-slate-800 text-center">
            <Workflow className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No Simulation Executed</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Click &quot;Run Parallel Simulation&quot; to spawn a Python multiprocessing pool and evaluate multi-scenario stress tests across CPU cores.
            </p>
            <button
              onClick={handleRunSim}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              Start Multiprocessing Benchmark
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
