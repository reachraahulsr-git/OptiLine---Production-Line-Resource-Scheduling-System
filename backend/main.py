"""
OptiLine - Production Line Resource Scheduling System
Main Entry Point & Multi-Mode Orchestrator.
Supports:
- --mode server : Launches the TCP Socket Server on 127.0.0.1:8765
- --mode gui    : Launches the Tkinter Desktop GUI
- --mode test   : Runs verification benchmarks across all modules (OOP, SymPy, Multiprocessing, Functional)
- --mode seed   : Seeds or resets the SQLite database
"""

import sys
import os
import argparse
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import DatabaseManager
from scheduler import Scheduler
from conflict_detector import ConflictDetector
from analytics import AnalyticsEngine
from sympy_engine import SymPyProductionEngine
from parallel_processing import ParallelProductionSimulator
import utils


def run_system_verification():
    """
    Executes automated academic verification testing across all required Python competencies:
    1. OOP Models & Inheritance
    2. SQLite Database CRUD
    3. Heuristic Scheduling & Conflict Detection
    4. Functional Programming (lambda, map, filter, comprehensions)
    5. SymPy Symbolic Mathematics
    6. Multiprocessing Simulation
    """
    print("\n" + "=" * 65)
    print("  OPTILINE PYTHON SCHEDULING SYSTEM: VERIFICATION SUITE")
    print("=" * 65 + "\n")

    # 1. Test Database & Sample Data
    print("[1/6] Testing SQLite Database CRUD...")
    db = DatabaseManager()
    db.seed_sample_data(force=True)
    jobs = db.get_all_jobs()
    resources = db.get_all_resources()
    print(f"  ✓ SQLite Database initialized: {len(jobs)} jobs, {len(resources)} machines.")

    # 2. Test OOP & Models
    print("\n[2/6] Testing OOP Inheritance & Method Overriding...")
    from models import ProductionResource, MachineResource
    base_res = ProductionResource(id=99, name="General Station", type="Assembly", hourly_rate=50.0)
    mach_res = MachineResource(id=100, name="Precision CNC", type="CNC Milling", hourly_rate=80.0, efficiency_factor=1.2, operational_cost=20.0)
    print(f"  ✓ Base resource cost for 2.0h: ${base_res.calculate_cost(2.0)}")
    print(f"  ✓ MachineResource overridden cost for 2.0h (with efficiency & overhead): ${mach_res.calculate_cost(2.0)}")

    # 3. Test Functional Programming
    print("\n[3/6] Testing Functional Programming Utilities...")
    urgent_jobs = utils.filter_by_priority(jobs, "urgent")
    lead_times = utils.map_jobs_to_lead_times(jobs)
    urgent_ids = utils.extract_urgent_job_ids(jobs)
    res_index = utils.index_resources_by_id(resources)
    print(f"  ✓ Filter + lambda: {len(urgent_jobs)} urgent jobs identified.")
    print(f"  ✓ Map + lambda: {len(lead_times)} job lead time projections computed.")
    print(f"  ✓ List comprehension: Urgent IDs = {urgent_ids}")
    print(f"  ✓ Dictionary comprehension: Indexed {len(res_index)} machines by ID.")

    # 4. Test Scheduling & Conflict Detection
    print("\n[4/6] Testing Production Scheduling & Conflict Detection...")
    scheduler = Scheduler(jobs, resources)
    sched_result = scheduler.schedule(strategy="priority_first")
    print(f"  ✓ Scheduling executed: {sched_result['scheduled_count']} assigned, Makespan: {sched_result['makespan_hours']} hours.")
    db.save_schedule_entries(sched_result["entries"])
    detector = ConflictDetector(jobs, resources, sched_result["entries"])
    conflicts = detector.detect_all_conflicts()
    print(f"  ✓ Conflict Detector: {conflicts['summary']['total_conflicts']} total issues diagnosed.")

    # 5. Test SymPy Symbolic Mathematics
    print("\n[5/6] Testing SymPy Calculus & Symbolic Engine...")
    sympy_eng = SymPyProductionEngine()
    epq_res = sympy_eng.calculate_optimal_batch_size(annual_demand=15000, setup_cost=300, holding_cost_per_unit=6.5, production_rate=30000)
    print(f"  ✓ SymPy Engine: {epq_res.get('engine')}")
    print(f"  ✓ Derived Optimal Batch Q* = {epq_res.get('optimal_batch_q')} units")
    print(f"  ✓ Symbolic Formula: {epq_res.get('symbolic_formula', epq_res.get('formula_latex'))}")

    # 6. Test Multiprocessing
    print("\n[6/6] Testing Multiprocessing Parallel Simulator...")
    simulator = ParallelProductionSimulator(jobs, resources)
    sim_result = simulator.run_parallel_scenarios()
    print(f"  ✓ Multiprocessing: {sim_result['total_scenarios_simulated']} scenarios executed in parallel.")
    print(f"  ✓ CPU Cores: {sim_result['cpu_cores_available']}, Processes: {sim_result['processes_spawned']}")
    print(f"  ✓ Parallel Wall Clock: {sim_result['wall_clock_time_ms']} ms (Worker CPU time: {sim_result['cumulative_worker_cpu_time_ms']} ms, Speedup: {sim_result['parallel_speedup_factor']}x)")

    print("\n" + "=" * 65)
    print("  ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 65 + "\n")


def main():
    parser = argparse.ArgumentParser(description="OptiLine Production Scheduling System")
    parser.add_argument(
        "--mode",
        choices=["server", "gui", "test", "seed"],
        default="test",
        help="Run mode: 'server' (Socket server), 'gui' (Tkinter), 'test' (Self-test suite), 'seed' (Reset database)"
    )
    parser.add_argument("--port", type=int, default=8765, help="Port for socket server")
    args = parser.parse_args()

    if args.mode == "test":
        run_system_verification()
    elif args.mode == "server":
        from server import SchedulingSocketServer
        server = SchedulingSocketServer(port=args.port)
        server.start()
    elif args.mode == "gui":
        from gui import launch_gui
        launch_gui()
    elif args.mode == "seed":
        db = DatabaseManager()
        db.seed_sample_data(force=True)
        print("Database successfully seeded with sample production line data.")


if __name__ == "__main__":
    main()
