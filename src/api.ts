import {
  DashboardData,
  Job,
  Resource,
  ScheduleEntry,
  ConflictsReport,
  PythonServerStatus,
  ParallelSimReport,
  SymPyBatchResult,
  SymPyDecayResult,
  SymPyLineBalanceResult
} from './types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.message) errorMsg = errData.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Python Socket Status
  getPythonStatus: () => fetchJson<PythonServerStatus>('/api/python/status'),

  // Dashboard Aggregates
  getDashboard: () => fetchJson<DashboardData>('/api/dashboard'),

  // Jobs CRUD
  getJobs: () => fetchJson<{ status: string; jobs: Job[] }>('/api/jobs'),
  createJob: (jobData: Partial<Job>) =>
    fetchJson<{ status: string; job: Job }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    }),
  updateJob: (id: number, updates: Partial<Job>) =>
    fetchJson<{ status: string; job: Job }>(`/api/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  deleteJob: (id: number) =>
    fetchJson<{ status: string; deleted: boolean }>(`/api/jobs/${id}`, {
      method: 'DELETE'
    }),

  // Resources CRUD
  getResources: () => fetchJson<{ status: string; resources: Resource[] }>('/api/resources'),
  createResource: (resData: Partial<Resource>) =>
    fetchJson<{ status: string; resource: Resource }>('/api/resources', {
      method: 'POST',
      body: JSON.stringify(resData)
    }),
  updateResource: (id: number, updates: Partial<Resource>) =>
    fetchJson<{ status: string; resource: Resource }>(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  deleteResource: (id: number) =>
    fetchJson<{ status: string; deleted: boolean }>(`/api/resources/${id}`, {
      method: 'DELETE'
    }),

  // Scheduling
  runScheduling: (strategy: string = 'priority_first') =>
    fetchJson<{
      status: string;
      result: {
        strategy: string;
        scheduled_count: number;
        unscheduled_count: number;
        makespan_hours: number;
        entries: ScheduleEntry[];
        conflicts: ConflictsReport;
        unscheduled_reasons: Record<string, string>;
        saved_count?: number;
      };
    }>('/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({ strategy })
    }),
  getSchedules: () => fetchJson<{ status: string; schedules: ScheduleEntry[] }>('/api/schedules'),
  clearSchedules: () => fetchJson<{ status: string; message: string }>('/api/schedules', { method: 'DELETE' }),

  // Conflicts
  getConflicts: () => fetchJson<{ status: string; conflicts: ConflictsReport }>('/api/conflicts'),

  // Analytics
  getAnalytics: () =>
    fetchJson<{ status: string; analytics: any; chart_image?: string }>('/api/analytics'),

  // SymPy Calculations
  calculateSymPyBatch: (params: {
    annual_demand: number;
    setup_cost: number;
    holding_cost_per_unit: number;
    production_rate: number;
  }) =>
    fetchJson<{ status: string; sympy_result: SymPyBatchResult }>('/api/sympy', {
      method: 'POST',
      body: JSON.stringify({ calculation_type: 'batch_optimization', ...params })
    }),

  calculateSymPyDecay: (params: { p_max: number; k_decay: number; shift_hours: number }) =>
    fetchJson<{ status: string; sympy_result: SymPyDecayResult }>('/api/sympy', {
      method: 'POST',
      body: JSON.stringify({ calculation_type: 'production_rate_decay', ...params })
    }),

  calculateSymPyLineBalancing: (params: { station_capacities: number[]; target_cycle_time: number }) =>
    fetchJson<{ status: string; sympy_result: SymPyLineBalanceResult }>('/api/sympy', {
      method: 'POST',
      body: JSON.stringify({ calculation_type: 'line_balancing', ...params })
    }),

  // Multiprocessing Parallel Simulator
  runParallelSim: () =>
    fetchJson<{ status: string; simulation: ParallelSimReport }>('/api/parallel-sim', {
      method: 'POST'
    }),

  // Reset Sample Data
  resetSampleData: () =>
    fetchJson<{ status: string; message: string }>('/api/reset-data', {
      method: 'POST'
    }),

  // Raw Socket Command for Terminal/Console
  sendRawSocketCommand: (action: string, payload: any = {}) =>
    fetchJson<{ raw_response: any; latency_ms: number; socket_target: string }>('/api/socket/raw', {
      method: 'POST',
      body: JSON.stringify({ action, payload })
    })
};
