export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type JobStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'conflict';

export interface Job {
  id: number;
  title: string;
  product_code: string;
  priority: PriorityLevel;
  priority_score?: number;
  processing_time: number;
  deadline: number;
  required_resource_type: string;
  batch_size: number;
  status: JobStatus;
  created_at: string;
}

export type ResourceStatus = 'active' | 'maintenance' | 'idle' | 'offline';

export interface Resource {
  id: number;
  name: string;
  type: string;
  capacity: number;
  hourly_rate: number;
  status: ResourceStatus;
  operational_cost?: number;
  efficiency_factor?: number;
  effective_hourly_cost?: number;
}

export interface ScheduleEntry {
  id?: number;
  job_id: number;
  resource_id: number;
  start_time: number;
  end_time: number;
  duration?: number;
  scheduled_batch: number;
  status: string;
  conflict_flag: number;
  created_at?: string;
  job_title?: string;
  product_code?: string;
  job_priority?: PriorityLevel;
  job_deadline?: number;
  resource_name?: string;
  resource_type?: string;
  deadline_missed?: boolean;
  capacity_exceeded?: boolean;
}

export interface DeadlineConflict {
  schedule_id?: number;
  job_id: number;
  job_title: string;
  product_code: string;
  priority: string;
  scheduled_end_time: number;
  deadline: number;
  lateness_hours: number;
  severity: 'CRITICAL' | 'WARNING';
  resolution_suggestion: string;
}

export interface OverlapConflict {
  resource_id: number;
  resource_name: string;
  entry_1: {
    schedule_id?: number;
    job_id: number;
    job_title: string;
    start_time: number;
    end_time: number;
  };
  entry_2: {
    schedule_id?: number;
    job_id: number;
    job_title: string;
    start_time: number;
    end_time: number;
  };
  overlap_duration_hours: number;
  overlap_interval: [number, number];
  severity: string;
  resolution_suggestion: string;
}

export interface CapacityConflict {
  schedule_id?: number;
  job_id: number;
  job_title: string;
  resource_id: number;
  resource_name: string;
  job_batch_size: number;
  machine_capacity: number;
  excess_units: number;
  severity: string;
  resolution_suggestion: string;
}

export interface UnscheduledJobDiagnosis {
  job_id: number;
  title: string;
  product_code: string;
  priority: string;
  processing_time: number;
  deadline: number;
  batch_size: number;
  required_resource_type: string;
  diagnosis: string;
}

export interface ConflictsReport {
  summary: {
    total_conflicts: number;
    deadline_conflicts_count: number;
    overlap_conflicts_count: number;
    capacity_conflicts_count: number;
    unscheduled_jobs_count: number;
    has_critical_blockers: boolean;
  };
  deadline_conflicts: DeadlineConflict[];
  overlap_conflicts: OverlapConflict[];
  capacity_conflicts: CapacityConflict[];
  unscheduled_jobs: UnscheduledJobDiagnosis[];
}

export interface MachineUtilizationMetric {
  resource_id: number;
  resource_name: string;
  resource_type: string;
  total_busy_hours: number;
  utilization_pct: number;
  status: string;
}

export interface DashboardKPIs {
  total_jobs: number;
  scheduled_jobs: number;
  unscheduled_jobs: number;
  total_makespan_hours: number;
  fleet_utilization_pct: number;
  total_production_units: number;
  total_estimated_cost: number;
  on_time_rate_pct: number;
  active_machines_count: number;
  machine_breakdown: MachineUtilizationMetric[];
  priority_breakdown: Record<string, number>;
}

export interface ProductionLog {
  id: number;
  timestamp: string;
  event_type: string;
  message: string;
  details?: string;
}

export interface DashboardData {
  status: string;
  kpis: DashboardKPIs;
  conflicts_summary: ConflictsReport['summary'];
  recent_schedules: ScheduleEntry[];
  active_resources_count: number;
  recent_logs: ProductionLog[];
  chart_image?: string;
}

export interface PythonServerStatus {
  status: string;
  message: string;
  python_version: string;
  server_pid?: number;
  socket_address?: string;
  mode?: string;
  socket_target?: string;
}

export interface SymPyBatchResult {
  engine: string;
  optimal_batch_q: number;
  total_annual_cost?: number;
  symbolic_formula?: string;
  derivative_expression?: string;
  latex_formula?: string;
  latex_cost_function?: string;
  parameters: {
    annual_demand: number;
    setup_cost: number;
    holding_cost: number;
    production_rate: number;
  };
}

export interface SymPyDecayResult {
  engine: string;
  total_units_in_shift: number;
  average_hourly_rate?: number;
  final_hourly_rate?: number;
  initial_acceleration?: number;
  symbolic_integral?: string;
  symbolic_derivative?: string;
  latex_rate?: string;
  latex_integral?: string;
  curve_points?: Array<{ hour: number; units_per_hour: number }>;
  parameters: {
    p_max: number;
    k_decay: number;
    shift_hours: number;
  };
}

export interface SymPyLineBalanceResult {
  engine: string;
  sum_task_times_hours: number;
  target_cycle_time: number;
  actual_stations: number;
  theoretical_min_stations: number;
  line_efficiency_pct: number;
  balance_delay_pct: number;
  symbolic_efficiency?: string;
  latex_efficiency?: string;
}

export interface ScenarioSimulationResult {
  scenario_id: number;
  name: string;
  demand_multiplier: number;
  downtime_bias: number;
  simulated_makespan_hours: number;
  total_cost: number;
  bottleneck_machine: string;
  risk_score_pct: number;
  worker_exec_time_ms: number;
}

export interface ParallelSimReport {
  execution_mode: string;
  cpu_cores_available: number;
  processes_spawned: number;
  total_scenarios_simulated: number;
  wall_clock_time_ms: number;
  cumulative_worker_cpu_time_ms: number;
  parallel_speedup_factor: number;
  scenarios: ScenarioSimulationResult[];
}
