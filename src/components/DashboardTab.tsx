import React from 'react';
import {
  Layers,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Zap,
  DollarSign,
  TrendingUp,
  Cpu,
  ArrowRight,
  ShieldAlert,
  Play
} from 'lucide-react';
import { DashboardData } from '../types';

interface DashboardTabProps {
  data: DashboardData | null;
  onNavigateTab: (tab: string) => void;
  onRunScheduler: () => void;
  isScheduling: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  data,
  onNavigateTab,
  onRunScheduler,
  isScheduling
}) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading manufacturing telemetry from Python backend...</p>
        </div>
      </div>
    );
  }

  const { kpis, conflicts_summary, recent_schedules, recent_logs, chart_image } = data;
  const hasConflicts = conflicts_summary.total_conflicts > 0;

  return (
    <div className="space-y-6">
      {/* Conflict Alert Banner if detected */}
      {hasConflicts && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-200">
                {conflicts_summary.total_conflicts} Operational Conflict{conflicts_summary.total_conflicts > 1 ? 's' : ''} Detected
              </h4>
              <p className="text-xs text-rose-300/80">
                {conflicts_summary.capacity_conflicts_count > 0 && `${conflicts_summary.capacity_conflicts_count} machine capacity overshoots. `}
                {conflicts_summary.deadline_conflicts_count > 0 && `${conflicts_summary.deadline_conflicts_count} delivery deadline delays. `}
                {conflicts_summary.overlap_conflicts_count > 0 && `${conflicts_summary.overlap_conflicts_count} temporal collisions.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('conflicts')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
          >
            <span>Review & Resolve</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Jobs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Production Jobs</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{kpis.total_jobs}</span>
            <span className="text-xs text-slate-400">{kpis.total_production_units} units</span>
          </div>
        </div>

        {/* Scheduled vs Unscheduled */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Scheduled vs Pending</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-emerald-400">{kpis.scheduled_jobs}</span>
              <span className="text-xs text-slate-400">/ {kpis.total_jobs}</span>
            </div>
            {kpis.unscheduled_jobs > 0 ? (
              <span className="text-xs text-amber-400 font-medium">{kpis.unscheduled_jobs} pending</span>
            ) : (
              <span className="text-xs text-emerald-400 font-medium">100% assigned</span>
            )}
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Fleet Utilization Rate</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-400">{kpis.fleet_utilization_pct}%</span>
            <span className="text-xs text-slate-400">{kpis.active_machines_count} machines active</span>
          </div>
        </div>

        {/* Makespan & Cost */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Makespan</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{kpis.total_makespan_hours}h</span>
            <span className="text-xs text-slate-400 font-mono">${kpis.total_estimated_cost.toFixed(0)} est.</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Gantt Timeline Preview + Machine Fleet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Schedules Strip */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Active Schedule Execution Sequence</h3>
                <p className="text-xs text-slate-400">Heuristic dispatch timetable calculated by Python Scheduler</p>
              </div>
              <button
                onClick={() => onNavigateTab('schedule')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
              >
                <span>Full Gantt View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recent_schedules && recent_schedules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-3">Job / Part</th>
                      <th className="py-2 px-3">Assigned Machine</th>
                      <th className="py-2 px-3 text-center">Start</th>
                      <th className="py-2 px-3 text-center">End</th>
                      <th className="py-2 px-3 text-center">Duration</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recent_schedules.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-200">{entry.job_title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{entry.product_code}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {entry.resource_name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-cyan-400">
                          {entry.start_time.toFixed(1)}h
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-cyan-400">
                          {entry.end_time.toFixed(1)}h
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                          {entry.duration ?? (entry.end_time - entry.start_time).toFixed(1)}h
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {entry.conflict_flag ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-semibold">
                              Conflict
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                              Confirmed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-400 mb-3">No active schedules generated yet.</p>
                <button
                  onClick={onRunScheduler}
                  disabled={isScheduling}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  <Play className="w-3.5 h-3.5 inline mr-1 fill-current" />
                  Run Scheduling Algorithm
                </button>
              </div>
            )}
          </div>

          {/* Machine Fleet Utilization List */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Machine Fleet Workload & Efficiency</h3>
                <p className="text-xs text-slate-400">Calculated via Pandas group-by aggregation</p>
              </div>
              <button
                onClick={() => onNavigateTab('resources')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
              >
                <span>Manage Fleet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {kpis.machine_breakdown.map((m) => (
                <div key={m.resource_id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{m.resource_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {m.resource_type}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Utilization ({m.total_busy_hours}h busy)</span>
                      <span className="font-semibold text-slate-200">{m.utilization_pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          m.utilization_pct > 80
                            ? 'bg-rose-500'
                            : m.utilization_pct > 50
                            ? 'bg-cyan-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, m.utilization_pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Matplotlib Visuals + Production Logs */}
        <div className="space-y-6">
          {/* Matplotlib Figure Preview */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Python Matplotlib Visualizer</h3>
                <p className="text-xs text-slate-400">Server-side rendered matplotlib figure</p>
              </div>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Expand
              </button>
            </div>
            {chart_image ? (
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-1">
                <img
                  src={chart_image}
                  alt="Matplotlib Analytics"
                  className="w-full h-auto rounded"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
                Run scheduling to render Matplotlib chart
              </div>
            )}
          </div>

          {/* SQLite Production Event Logs */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">SQLite Production Audit Logs</h3>
              <span className="text-[10px] text-slate-400 font-mono">Table: production_logs</span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {recent_logs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-slate-800/50 border border-slate-700/50 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="text-cyan-400 font-semibold">{log.event_type}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 text-slate-300 text-xs">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
