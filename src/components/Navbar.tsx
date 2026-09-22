import React from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Terminal,
  RotateCcw,
  Play,
  Monitor,
  Calendar,
  AlertTriangle,
  BarChart3,
  Calculator,
  Workflow
} from 'lucide-react';
import { PythonServerStatus } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pythonStatus: PythonServerStatus | null;
  latencyMs: number | null;
  onOpenSocketModal: () => void;
  onOpenTkinterModal: () => void;
  onQuickRunSchedule: () => void;
  onResetData: () => void;
  isScheduling: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pythonStatus,
  latencyMs,
  onOpenSocketModal,
  onOpenTkinterModal,
  onQuickRunSchedule,
  onResetData,
  isScheduling
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'jobs', label: 'Job Management', icon: Layers },
    { id: 'resources', label: 'Machines & Lines', icon: Cpu },
    { id: 'schedule', label: 'Gantt Schedule', icon: Calendar },
    { id: 'conflicts', label: 'Conflict Hub', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics (Pandas)', icon: BarChart3 },
    { id: 'sympy', label: 'SymPy Math Engine', icon: Calculator },
    { id: 'multiprocessing', label: 'Parallel Sim', icon: Workflow }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top utility row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-800/80">
          {/* Brand & Engine Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">OptiLine</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-300 font-medium">
                  Manufacturing OS
                </span>
              </div>
              <p className="text-xs text-slate-400">Production Line Resource Scheduling System</p>
            </div>
          </div>

          {/* System Telemetry Badges & Quick Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Python Socket Health Pill */}
            <div
              onClick={onOpenSocketModal}
              title="Click to open Python Socket Terminal & IPC Inspector"
              className="cursor-pointer flex items-center space-x-2 px-2.5 py-1.5 rounded-md bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/40 transition-colors text-xs text-slate-300"
            >
              <div className="relative flex items-center justify-center">
                <span className={`w-2 h-2 rounded-full ${pythonStatus ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-semibold text-slate-200">
                  TCP Socket: {pythonStatus ? '8765 Active' : 'Connecting...'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {pythonStatus ? `Python ${pythonStatus.python_version} (PID ${pythonStatus.server_pid})` : 'Offline'}
                  {latencyMs !== null && ` • ${latencyMs}ms`}
                </span>
              </div>
            </div>

            {/* Tkinter Desktop Launcher Pill */}
            <button
              id="tkinter-desktop-btn"
              onClick={onOpenTkinterModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs font-medium text-slate-200 transition-colors"
            >
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tkinter GUI</span>
            </button>

            {/* Socket Inspector button */}
            <button
              id="socket-inspector-btn"
              onClick={onOpenSocketModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs font-medium text-slate-200 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Socket Console</span>
            </button>

            {/* Reset Data */}
            <button
              id="reset-data-btn"
              onClick={onResetData}
              title="Reset database to default sample manufacturing records"
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Run Optimizer Trigger */}
            <button
              id="run-quick-scheduler-btn"
              onClick={onQuickRunSchedule}
              disabled={isScheduling}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isScheduling ? 'animate-spin' : ''}`} />
              <span>{isScheduling ? 'Optimizing...' : 'Run Scheduling'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation row */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
