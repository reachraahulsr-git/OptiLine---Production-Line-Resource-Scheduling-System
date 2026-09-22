import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  DashboardData,
  Job,
  Resource,
  ScheduleEntry,
  ConflictsReport,
  PythonServerStatus
} from './types';

import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { JobsTab } from './components/JobsTab';
import { ResourcesTab } from './components/ResourcesTab';
import { ScheduleTab } from './components/ScheduleTab';
import { ConflictsTab } from './components/ConflictsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SymPyTab } from './components/SymPyTab';
import { MultiprocessingTab } from './components/MultiprocessingTab';
import { SocketInspectorModal } from './components/SocketInspectorModal';
import { TkinterModal } from './components/TkinterModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core Data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [conflicts, setConflicts] = useState<ConflictsReport | null>(null);

  // Python Socket telemetry
  const [pythonStatus, setPythonStatus] = useState<PythonServerStatus | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // UI state
  const [isScheduling, setIsScheduling] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isSocketModalOpen, setIsSocketModalOpen] = useState(false);
  const [isTkinterModalOpen, setIsTkinterModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Ping Python Socket Server & measure latency
  const checkPythonStatus = useCallback(async () => {
    try {
      const t0 = performance.now();
      const status = await api.getPythonStatus();
      const roundTrip = Math.round(performance.now() - t0);
      setPythonStatus(status);
      setLatencyMs(roundTrip);
    } catch (err: any) {
      console.warn('Python socket ping failed:', err.message);
      setPythonStatus(null);
      setLatencyMs(null);
    }
  }, []);

  // Fetch all primary manufacturing datasets
  const refreshAllData = useCallback(async () => {
    try {
      const [dashRes, jobsRes, resRes, schedRes, confRes] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getJobs().catch(() => ({ status: 'error', jobs: [] })),
        api.getResources().catch(() => ({ status: 'error', resources: [] })),
        api.getSchedules().catch(() => ({ status: 'error', schedules: [] })),
        api.getConflicts().catch(() => ({ status: 'error', conflicts: null as any }))
      ]);

      if (dashRes) setDashboardData(dashRes);
      if (jobsRes && jobsRes.jobs) setJobs(jobsRes.jobs);
      if (resRes && resRes.resources) setResources(resRes.resources);
      if (schedRes && schedRes.schedules) setSchedules(schedRes.schedules);
      if (confRes && confRes.conflicts) setConflicts(confRes.conflicts);
    } catch (err) {
      console.error('Error refreshing manufacturing data:', err);
    }
  }, []);

  // Initial mount load
  useEffect(() => {
    checkPythonStatus();
    refreshAllData();

    const interval = setInterval(() => {
      checkPythonStatus();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkPythonStatus, refreshAllData]);

  // Run Scheduling
  const handleRunScheduling = async (strategy: string = 'priority_first') => {
    setIsScheduling(true);
    try {
      const res = await api.runScheduling(strategy);
      if (res.result) {
        setSchedules(res.result.entries);
        setConflicts(res.result.conflicts);
        await refreshAllData();
        showToast(
          `Schedule generated using "${strategy}": ${res.result.scheduled_count} jobs allocated in ${res.result.makespan_hours.toFixed(1)} hours.`
        );
      }
    } catch (err: any) {
      showToast(`Scheduling Error: ${err.message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  // Clear Schedules
  const handleClearSchedules = async () => {
    try {
      await api.clearSchedules();
      setSchedules([]);
      await refreshAllData();
      showToast('Active schedule timetable cleared.');
    } catch (err: any) {
      showToast(`Error clearing timetable: ${err.message}`);
    }
  };

  // Reset Sample Data
  const handleResetData = async () => {
    if (!confirm('Reset SQLite database to default aerospace/manufacturing sample data?')) return;
    try {
      await api.resetSampleData();
      await refreshAllData();
      showToast('Database reset to standard manufacturing production dataset.');
    } catch (err: any) {
      showToast(`Reset error: ${err.message}`);
    }
  };

  // Jobs CRUD Handlers
  const handleAddJob = async (jobData: Partial<Job>) => {
    await api.createJob(jobData);
    await refreshAllData();
    showToast(`Job "${jobData.title}" created in SQLite.`);
  };

  const handleUpdateJob = async (id: number, updates: Partial<Job>) => {
    await api.updateJob(id, updates);
    await refreshAllData();
    showToast(`Job #${id} updated.`);
  };

  const handleDeleteJob = async (id: number) => {
    await api.deleteJob(id);
    await refreshAllData();
    showToast(`Job #${id} deleted from database.`);
  };

  // Resources CRUD Handlers
  const handleAddResource = async (resData: Partial<Resource>) => {
    await api.createResource(resData);
    await refreshAllData();
    showToast(`Workstation "${resData.name}" provisioned.`);
  };

  const handleUpdateResource = async (id: number, updates: Partial<Resource>) => {
    await api.updateResource(id, updates);
    await refreshAllData();
    showToast(`Machine #${id} updated.`);
  };

  const handleDeleteResource = async (id: number) => {
    await api.deleteResource(id);
    await refreshAllData();
    showToast(`Machine #${id} decommissioned.`);
  };

  // Refresh Analytics & Matplotlib chart
  const handleRefreshAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await api.getAnalytics();
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          chart_image: data.chart_image
        });
      }
      showToast('Analytics and Matplotlib plots refreshed.');
    } catch (err: any) {
      showToast(`Analytics error: ${err.message}`);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/50 text-slate-100 text-xs font-medium shadow-2xl flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pythonStatus={pythonStatus}
        latencyMs={latencyMs}
        onOpenSocketModal={() => setIsSocketModalOpen(true)}
        onOpenTkinterModal={() => setIsTkinterModalOpen(true)}
        onQuickRunSchedule={() => handleRunScheduling('priority_first')}
        onResetData={handleResetData}
        isScheduling={isScheduling}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            data={dashboardData}
            onNavigateTab={setActiveTab}
            onRunScheduler={() => handleRunScheduling('priority_first')}
            isScheduling={isScheduling}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsTab
            jobs={jobs}
            onAddJob={handleAddJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab
            resources={resources}
            onAddResource={handleAddResource}
            onUpdateResource={handleUpdateResource}
            onDeleteResource={handleDeleteResource}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab
            schedules={schedules}
            resources={resources}
            onRunScheduler={handleRunScheduling}
            onClearSchedules={handleClearSchedules}
            isScheduling={isScheduling}
          />
        )}

        {activeTab === 'conflicts' && (
          <ConflictsTab
            conflicts={conflicts}
            onRefreshConflicts={refreshAllData}
            onRunAlternativeStrategy={handleRunScheduling}
            isResolving={isScheduling}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            kpis={dashboardData ? dashboardData.kpis : null}
            chartImage={dashboardData?.chart_image}
            onRefreshAnalytics={handleRefreshAnalytics}
            isLoading={isLoadingAnalytics}
          />
        )}

        {activeTab === 'sympy' && <SymPyTab />}

        {activeTab === 'multiprocessing' && <MultiprocessingTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            OptiLine Production Line Resource Scheduling System • Python 3.x Backend with SQLite, SymPy & Multiprocessing
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Engine: {pythonStatus?.mode || 'Production HTTP REST API'} • Vercel & Express Ready
          </span>
        </div>
      </footer>

      {/* Modals */}
      <SocketInspectorModal
        isOpen={isSocketModalOpen}
        onClose={() => setIsSocketModalOpen(false)}
      />

      <TkinterModal
        isOpen={isTkinterModalOpen}
        onClose={() => setIsTkinterModalOpen(false)}
      />
    </div>
  );
}
