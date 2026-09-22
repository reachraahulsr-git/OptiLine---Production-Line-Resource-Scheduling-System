import React from 'react';
import {
  AlertTriangle,
  Clock,
  Layers,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  RotateCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { ConflictsReport } from '../types';

interface ConflictsTabProps {
  conflicts: ConflictsReport | null;
  onRefreshConflicts: () => Promise<void>;
  onRunAlternativeStrategy: (strategy: string) => Promise<void>;
  isResolving: boolean;
}

export const ConflictsTab: React.FC<ConflictsTabProps> = ({
  conflicts,
  onRefreshConflicts,
  onRunAlternativeStrategy,
  isResolving
}) => {
  if (!conflicts) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, deadline_conflicts, overlap_conflicts, capacity_conflicts, unscheduled_jobs } = conflicts;
  const hasNoConflicts = summary.total_conflicts === 0;

  return (
    <div className="space-y-6">
      {/* Header and Quick Resolution bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight">Production Conflict Detection Engine</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              hasNoConflicts
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}>
              {hasNoConflicts ? 'ZERO CONFLICTS' : `${summary.total_conflicts} ACTIVE ISSUES`}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time validation against machine physical bounds, temporal exclusivity, and customer SLA deadlines
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefreshConflicts}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Re-scan Database</span>
          </button>

          {!hasNoConflicts && (
            <button
              onClick={() => onRunAlternativeStrategy('earliest_deadline')}
              disabled={isResolving}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isResolving ? 'Resolving...' : 'Try EDF Re-Dispatch'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Deadline Overruns */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Deadline Lateness</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {summary.deadline_conflicts_count}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">SLA delivery breaches</div>
        </div>

        {/* Machine Overlaps */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Machine Collisions</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {summary.overlap_conflicts_count}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Temporal interval overlaps</div>
        </div>

        {/* Capacity Overshoots */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Capacity Exceeded</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {summary.capacity_conflicts_count}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Batch size &gt; Machine limit</div>
        </div>

        {/* Unscheduled */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Unscheduled Orders</span>
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {summary.unscheduled_jobs_count}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Unassigned or unroutable</div>
        </div>
      </div>

      {hasNoConflicts ? (
        <div className="p-12 rounded-xl bg-slate-900 border border-emerald-800/40 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Zero Production Conflicts</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            All jobs are sequenced within valid machine capacity thresholds, with non-overlapping execution intervals and before required delivery deadlines.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Capacity Overshoots Section */}
          {capacity_conflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Workstation Capacity Constraints ({capacity_conflicts.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {capacity_conflicts.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-indigo-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{c.job_title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                          {c.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Assigned machine <span className="font-semibold text-white">{c.resource_name}</span> has rated capacity limit of{' '}
                        <span className="font-mono text-cyan-400 font-bold">{c.machine_capacity} units</span>, but requested job batch size is{' '}
                        <span className="font-mono text-rose-400 font-bold">{c.job_batch_size} units</span> (overshoot by{' '}
                        <span className="font-mono text-rose-300">{c.excess_units} units</span>).
                      </p>
                      <div className="text-xs text-amber-300/90 font-medium flex items-center space-x-1.5 pt-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Recommendation: {c.resolution_suggestion}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deadline Conflicts Section */}
          {deadline_conflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Delivery Deadline Overruns ({deadline_conflicts.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {deadline_conflicts.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-rose-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{c.job_title}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{c.product_code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                          OVERDUE BY {c.lateness_hours.toFixed(1)}h
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Estimated completion at <span className="font-mono text-rose-400">{c.scheduled_end_time.toFixed(1)}h</span> misses required deadline of{' '}
                        <span className="font-mono text-slate-200">{c.deadline.toFixed(1)}h</span>.
                      </p>
                      <p className="text-xs text-amber-300/90 font-medium pt-1">
                        Recommendation: {c.resolution_suggestion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overlap Conflicts */}
          {overlap_conflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Concurrent Machine Collisions ({overlap_conflicts.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {overlap_conflicts.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-amber-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Machine: {c.resource_name}</span>
                      <span className="text-xs text-amber-400 font-mono">
                        Overlap duration: {c.overlap_duration_hours.toFixed(1)} hours
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Collision between Job &quot;{c.entry_1.job_title}&quot; ({c.entry_1.start_time.toFixed(1)}h - {c.entry_1.end_time.toFixed(1)}h) and Job &quot;{c.entry_2.job_title}&quot; ({c.entry_2.start_time.toFixed(1)}h - {c.entry_2.end_time.toFixed(1)}h).
                    </p>
                    <p className="text-xs text-amber-300/90">
                      Recommendation: {c.resolution_suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unscheduled Jobs Diagnosis */}
          {unscheduled_jobs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Unscheduled Job Diagnostics ({unscheduled_jobs.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {unscheduled_jobs.map((u, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{u.title}</span>
                      <span className="font-mono text-cyan-400 text-[10px]">{u.product_code}</span>
                      <span className="text-slate-400 text-[10px]">Required: {u.required_resource_type}</span>
                    </div>
                    <p className="text-slate-300">Root Cause Diagnosis: {u.diagnosis}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
