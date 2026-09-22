import React, { useState } from 'react';
import { Play, RotateCcw, Calendar, AlertTriangle, CheckCircle, Clock, Info, Check } from 'lucide-react';
import { ScheduleEntry, Resource, PriorityLevel } from '../types';

interface ScheduleTabProps {
  schedules: ScheduleEntry[];
  resources: Resource[];
  onRunScheduler: (strategy: string) => Promise<void>;
  onClearSchedules: () => Promise<void>;
  isScheduling: boolean;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  schedules,
  resources,
  onRunScheduler,
  onClearSchedules,
  isScheduling
}) => {
  const [strategy, setStrategy] = useState<string>('priority_first');
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

  // Compute makespan
  const maxEndTime = schedules.reduce((max, s) => Math.max(max, s.end_time), 0);
  const timelineTotalHours = Math.max(16, Math.ceil(maxEndTime + 2));

  // Hourly markers for the Gantt chart ruler
  const hourMarkers = Array.from({ length: Math.ceil(timelineTotalHours / 2) + 1 }, (_, i) => i * 2);

  const getPriorityColor = (p?: PriorityLevel, isConflict?: boolean) => {
    if (isConflict) return 'bg-rose-900/90 border-rose-500 text-rose-100 hover:bg-rose-800';
    switch (p) {
      case 'urgent':
        return 'bg-rose-800/80 border-rose-500 text-rose-100 hover:bg-rose-700';
      case 'high':
        return 'bg-amber-800/80 border-amber-500 text-amber-100 hover:bg-amber-700';
      case 'medium':
        return 'bg-cyan-800/80 border-cyan-500 text-cyan-100 hover:bg-cyan-700';
      case 'low':
        return 'bg-emerald-800/80 border-emerald-500 text-emerald-100 hover:bg-emerald-700';
      default:
        return 'bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>Manufacturing Timeline & Gantt Dispatch</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated production dispatch computed via Python Heuristic Scheduling Engine
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Strategy selection */}
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <span className="font-medium">Algorithm:</span>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="priority_first">Priority-First with EDF Tie-Breaker</option>
              <option value="earliest_deadline">Earliest Deadline First (EDF)</option>
              <option value="weighted_slack">Minimum Slack Ratio</option>
            </select>
          </div>

          <button
            onClick={() => onRunScheduler(strategy)}
            disabled={isScheduling}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isScheduling ? 'animate-spin' : ''}`} />
            <span>{isScheduling ? 'Optimizing...' : 'Calculate Dispatch'}</span>
          </button>

          {schedules.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear current timetable?')) onClearSchedules();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition-colors"
              title="Clear Active Schedule"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Gantt Timeline Canvas */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-4 text-xs">
            <span className="font-semibold text-slate-200">
              Makespan: <span className="font-mono text-cyan-400">{maxEndTime.toFixed(1)} hours</span>
            </span>
            <span className="text-slate-400">
              Total Dispatches: <span className="font-semibold text-slate-200">{schedules.length}</span>
            </span>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center space-x-3 text-[10px] text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-700 inline-block" />
              <span>Urgent</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-700 inline-block" />
              <span>High</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-cyan-700 inline-block" />
              <span>Medium</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-700 inline-block" />
              <span>Low</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-600 border border-rose-300 inline-block" />
              <span>Conflict</span>
            </span>
          </div>
        </div>

        {schedules.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Timeline Header Ruler */}
              <div className="flex items-center mb-3">
                <div className="w-48 flex-shrink-0 text-xs font-semibold text-slate-400">
                  Workstation
                </div>
                <div className="flex-1 relative h-6">
                  {hourMarkers.map((h) => {
                    const leftPct = (h / timelineTotalHours) * 100;
                    return (
                      <div
                        key={h}
                        className="absolute text-[10px] font-mono text-slate-500 transform -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${leftPct}%` }}
                      >
                        <span>{h}h</span>
                        <div className="w-px h-2 bg-slate-700 mt-0.5" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resource Gantt Rows */}
              <div className="space-y-3">
                {resources.map((res) => {
                  const machineSchedules = schedules.filter((s) => s.resource_id === res.id);

                  return (
                    <div key={res.id} className="flex items-center group">
                      {/* Left: Resource label */}
                      <div className="w-48 flex-shrink-0 pr-3">
                        <div className="text-xs font-medium text-slate-200 truncate" title={res.name}>
                          {res.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{res.type}</div>
                      </div>

                      {/* Right: Gantt Track */}
                      <div className="flex-1 relative h-11 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-hidden">
                        {/* Background Grid Lines */}
                        {hourMarkers.map((h) => (
                          <div
                            key={h}
                            className="absolute top-0 bottom-0 w-px bg-slate-800/40 pointer-events-none"
                            style={{ left: `${(h / timelineTotalHours) * 100}%` }}
                          />
                        ))}

                        {/* Scheduled Job Blocks */}
                        {machineSchedules.map((item, idx) => {
                          const leftPct = (item.start_time / timelineTotalHours) * 100;
                          const widthPct = Math.max(
                            1.5,
                            ((item.end_time - item.start_time) / timelineTotalHours) * 100
                          );
                          const isConflict = item.conflict_flag === 1;

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedEntry(item)}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              className={`absolute top-1 bottom-1 rounded-md border px-2 py-0.5 cursor-pointer transition-all flex flex-col justify-center overflow-hidden shadow-sm ${getPriorityColor(
                                item.job_priority,
                                isConflict
                              )}`}
                              title={`Job: ${item.job_title} | Window: ${item.start_time.toFixed(1)}h - ${item.end_time.toFixed(1)}h`}
                            >
                              <div className="flex items-center space-x-1 text-[10px] font-bold leading-tight truncate">
                                {isConflict && <AlertTriangle className="w-2.5 h-2.5 text-rose-300 flex-shrink-0" />}
                                <span className="truncate">{item.job_title}</span>
                              </div>
                              <div className="text-[9px] opacity-80 font-mono truncate">
                                {item.start_time.toFixed(1)}h - {item.end_time.toFixed(1)}h ({item.scheduled_batch}u)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Schedule Timetable Empty</p>
            <p className="text-xs text-slate-500 mb-4">Click below to compute the production schedule via the Python backend.</p>
            <button
              onClick={() => onRunScheduler(strategy)}
              disabled={isScheduling}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              Run Optimization
            </button>
          </div>
        )}
      </div>

      {/* Selected Job Inspection Details Modal / Drawer */}
      {selectedEntry && (
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/80 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white">{selectedEntry.job_title}</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {selectedEntry.product_code}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-300">
                Priority: {selectedEntry.job_priority}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Allocated on <span className="text-slate-200 font-semibold">{selectedEntry.resource_name}</span> from{' '}
              <span className="font-mono text-cyan-400">{selectedEntry.start_time.toFixed(2)}h</span> to{' '}
              <span className="font-mono text-cyan-400">{selectedEntry.end_time.toFixed(2)}h</span> (Duration:{' '}
              {(selectedEntry.end_time - selectedEntry.start_time).toFixed(2)} hrs, Batch:{' '}
              {selectedEntry.scheduled_batch} units)
            </p>
            {selectedEntry.conflict_flag === 1 && (
              <p className="text-xs text-rose-400 font-medium flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Conflict Flagged: Exceeds machine capacity limit or deadline window.</span>
              </p>
            )}
          </div>
          <button
            onClick={() => setSelectedEntry(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Full Schedule Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Full Dispatch Sequence Table</h3>
          <span className="text-xs text-slate-400 font-mono">{schedules.length} active dispatches</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-medium">
                <th className="py-2.5 px-4">Part / Job Order</th>
                <th className="py-2.5 px-3">Machine</th>
                <th className="py-2.5 px-3 text-center">Start (h)</th>
                <th className="py-2.5 px-3 text-center">End (h)</th>
                <th className="py-2.5 px-3 text-center">Duration</th>
                <th className="py-2.5 px-3 text-center">Customer Deadline</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {schedules.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-200">{item.job_title}</div>
                    <div className="text-[10px] font-mono text-cyan-400">{item.product_code}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{item.resource_name}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-cyan-400">{item.start_time.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-cyan-400">{item.end_time.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                    {(item.end_time - item.start_time).toFixed(2)} hrs
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-amber-400">
                    Hour {item.job_deadline ?? '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.conflict_flag === 1 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-semibold">
                        Conflict
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                        Scheduled
                      </span>
                    )}
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
