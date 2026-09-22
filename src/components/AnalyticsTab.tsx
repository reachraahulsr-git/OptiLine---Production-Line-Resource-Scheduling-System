import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Download, Cpu, Clock, RefreshCw } from 'lucide-react';
import { DashboardKPIs } from '../types';

interface AnalyticsTabProps {
  kpis: DashboardKPIs | null;
  chartImage?: string;
  onRefreshAnalytics: () => Promise<void>;
  isLoading: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  kpis,
  chartImage,
  onRefreshAnalytics,
  isLoading
}) => {
  if (!kpis) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight">Production Analytics & Reporting</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
              Pandas 1.5+ & Matplotlib
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated KPI dataframes, statistical aggregations, and visual chart rendering
          </p>
        </div>

        <button
          onClick={onRefreshAnalytics}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Fleet Utilization</span>
          <span className="text-2xl font-bold text-cyan-400 font-mono mt-1 block">
            {kpis.fleet_utilization_pct}%
          </span>
          <span className="text-[10px] text-slate-500">Active machine busy ratio</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Total Makespan</span>
          <span className="text-2xl font-bold text-amber-400 font-mono mt-1 block">
            {kpis.total_makespan_hours}h
          </span>
          <span className="text-[10px] text-slate-500">Total shift horizon</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Estimated Production Cost</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">
            ${kpis.total_estimated_cost.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500">Base rate + machine overhead</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">On-Time SLA Delivery</span>
          <span className="text-2xl font-bold text-indigo-400 font-mono mt-1 block">
            {kpis.on_time_rate_pct}%
          </span>
          <span className="text-[10px] text-slate-500">Deadline compliance</span>
        </div>
      </div>

      {/* Matplotlib Rendered Visualization Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Python Matplotlib Analytical Plots</span>
            </h3>
            <p className="text-xs text-slate-400">
              Generated directly via Python `matplotlib.pyplot` with multi-axis subplots and exported as base64 artifact
            </p>
          </div>

          {chartImage && (
            <a
              href={chartImage}
              download="optiline_analytics_report.png"
              className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PNG</span>
            </a>
          )}
        </div>

        {chartImage ? (
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex justify-center">
            <img
              src={chartImage}
              alt="Matplotlib Analytics Plots"
              className="w-full max-w-4xl h-auto rounded-lg shadow-md"
            />
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            No chart generated yet. Click &quot;Refresh Analytics&quot; to compute.
          </div>
        )}
      </div>

      {/* Machine Breakdown Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Machine Utilization & Capacity Ledger</h3>
          <p className="text-xs text-slate-400">Aggregated with Pandas groupby across scheduled entries</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400">
                <th className="py-2.5 px-4">Machine Identifier</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Busy Hours</th>
                <th className="py-2.5 px-3 text-center">Utilization Rate</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {kpis.machine_breakdown.map((m) => (
                <tr key={m.resource_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-200">{m.resource_name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.resource_type}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-cyan-400">{m.total_busy_hours} hrs</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            m.utilization_pct > 80 ? 'bg-rose-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, m.utilization_pct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-200 font-bold">{m.utilization_pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold uppercase">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
