"""
TCP Socket Server for Production Line Resource Scheduling System.
Demonstrates Socket Programming in Python:
- Socket creation, bind, listen, accept
- Threaded connection handling
- JSON protocol over TCP
- Dispatches requests to DatabaseManager, Scheduler, ConflictDetector,
  SymPyProductionEngine, and ParallelProductionSimulator.
"""

import socket
import threading
import json
import os
import sys
import traceback
from typing import Dict, Any

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import DatabaseManager
from scheduler import Scheduler
from conflict_detector import ConflictDetector
from analytics import AnalyticsEngine
from parallel_processing import ParallelProductionSimulator
from sympy_engine import SymPyProductionEngine

HOST = "127.0.0.1"
PORT = 8765
BUFFER_SIZE = 65536


class SchedulingSocketServer:
    """
    Socket server handling client connections and dispatching manufacturing commands.
    """

    def __init__(self, host: str = HOST, port: int = PORT):
        self.host = host
        self.port = port
        self.db = DatabaseManager()
        self.sympy_engine = SymPyProductionEngine()
        self.is_running = False
        self._server_socket = None
        # Ensure database is seeded with initial data
        self.db.seed_sample_data(force=False)

    def start(self):
        """Binds and begins listening for client socket connections."""
        self._server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        try:
            self._server_socket.bind((self.host, self.port))
            self._server_socket.listen(10)
            self.is_running = True
            print(f"[OptiLine Python Server] TCP Socket listening on {self.host}:{self.port} (PID: {os.getpid()})")

            while self.is_running:
                try:
                    client_conn, client_addr = self._server_socket.accept()
                    # Handle each connection in a dedicated thread
                    t = threading.Thread(
                        target=self._handle_client,
                        args=(client_conn, client_addr),
                        daemon=True
                    )
                    t.start()
                except socket.error:
                    if not self.is_running:
                        break
        except Exception as e:
            print(f"[OptiLine Server Error] Failed to start socket server: {e}")
        finally:
            self.stop()

    def stop(self):
        """Shuts down server socket."""
        self.is_running = False
        if self._server_socket:
            try:
                self._server_socket.close()
            except Exception:
                pass
            self._server_socket = None
        print("[OptiLine Python Server] Stopped.")

    def _handle_client(self, conn: socket.socket, addr):
        """Processes requests from a single connected client over the socket."""
        conn.settimeout(30.0)
        buffer = ""

        try:
            while self.is_running:
                data = conn.recv(BUFFER_SIZE)
                if not data:
                    break

                buffer += data.decode("utf-8")

                # Messages are delimited by newline (\n)
                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        req = json.loads(line)
                        response = self._dispatch_action(req)
                    except json.JSONDecodeError as jde:
                        response = {"status": "error", "message": f"Invalid JSON payload: {jde}"}
                    except Exception as e:
                        traceback.print_exc()
                        response = {"status": "error", "message": f"Server processing error: {e}"}

                    # Send response back with trailing newline
                    resp_bytes = (json.dumps(response) + "\n").encode("utf-8")
                    conn.sendall(resp_bytes)

        except (socket.timeout, ConnectionResetError, BrokenPipeError):
            pass
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def _dispatch_action(self, req: Dict[str, Any]) -> Dict[str, Any]:
        """Routes the parsed socket action to the appropriate engine module."""
        action = req.get("action", "")
        payload = req.get("payload", {})

        # 1. Ping / Health check
        if action == "ping":
            return {
                "status": "ok",
                "message": "OptiLine Python Socket Server Online",
                "python_version": sys.version.split()[0],
                "server_pid": os.getpid(),
                "socket_address": f"{self.host}:{self.port}"
            }

        # 2. Complete Dashboard State
        elif action == "get_dashboard":
            jobs = self.db.get_all_jobs()
            resources = self.db.get_all_resources()
            schedules = self.db.get_all_schedules()

            analytics_eng = AnalyticsEngine(jobs, resources, schedules)
            kpis = analytics_eng.compute_summary_kpis()
            chart_base64 = analytics_eng.generate_matplotlib_chart()

            detector = ConflictDetector(jobs, resources, schedules)
            conflicts = detector.detect_all_conflicts()
            recent_logs = self.db.get_logs(limit=15)

            return {
                "status": "ok",
                "kpis": kpis,
                "conflicts_summary": conflicts["summary"],
                "recent_schedules": schedules[:8],
                "active_resources_count": len([r for r in resources if r.get("status") == "active"]),
                "recent_logs": recent_logs,
                "chart_image": chart_base64
            }

        # 3. Jobs Management CRUD
        elif action == "get_jobs":
            return {"status": "ok", "jobs": self.db.get_all_jobs()}

        elif action == "create_job":
            job = self.db.create_job(payload)
            return {"status": "ok", "job": job}

        elif action == "update_job":
            job_id = int(payload.get("id", 0))
            updated = self.db.update_job(job_id, payload.get("updates", {}))
            return {"status": "ok", "job": updated}

        elif action == "delete_job":
            job_id = int(payload.get("id", 0))
            success = self.db.delete_job(job_id)
            return {"status": "ok", "deleted": success}

        # 4. Resource / Machine Management CRUD
        elif action == "get_resources":
            return {"status": "ok", "resources": self.db.get_all_resources()}

        elif action == "create_resource":
            res = self.db.create_resource(payload)
            return {"status": "ok", "resource": res}

        elif action == "update_resource":
            res_id = int(payload.get("id", 0))
            updated = self.db.update_resource(res_id, payload.get("updates", {}))
            return {"status": "ok", "resource": updated}

        elif action == "delete_resource":
            res_id = int(payload.get("id", 0))
            success = self.db.delete_resource(res_id)
            return {"status": "ok", "deleted": success}

        # 5. Scheduling Algorithm Execution
        elif action == "run_scheduling":
            strategy = payload.get("strategy", "priority_first")
            jobs = self.db.get_all_jobs()
            resources = self.db.get_all_resources()

            scheduler = Scheduler(jobs, resources)
            schedule_result = scheduler.schedule(strategy=strategy)

            # Persist generated schedules if requested (default True)
            if payload.get("persist", True):
                self.db.clear_all_schedules()
                saved_entries = self.db.save_schedule_entries(schedule_result["entries"])
                schedule_result["saved_count"] = len(saved_entries)

            return {"status": "ok", "result": schedule_result}

        elif action == "get_schedules":
            return {"status": "ok", "schedules": self.db.get_all_schedules()}

        elif action == "clear_schedules":
            self.db.clear_all_schedules()
            return {"status": "ok", "message": "All schedules cleared"}

        # 6. Conflict Detection
        elif action == "detect_conflicts":
            jobs = self.db.get_all_jobs()
            resources = self.db.get_all_resources()
            schedules = self.db.get_all_schedules()
            detector = ConflictDetector(jobs, resources, schedules)
            report = detector.detect_all_conflicts()
            return {"status": "ok", "conflicts": report}

        # 7. Analytics & Reports
        elif action == "get_analytics":
            jobs = self.db.get_all_jobs()
            resources = self.db.get_all_resources()
            schedules = self.db.get_all_schedules()
            engine = AnalyticsEngine(jobs, resources, schedules)
            kpis = engine.compute_summary_kpis()
            chart = engine.generate_matplotlib_chart()
            return {"status": "ok", "analytics": kpis, "chart_image": chart}

        # 8. SymPy Engine Calculations
        elif action == "run_sympy":
            calc_type = payload.get("calculation_type", "batch_optimization")

            if calc_type == "batch_optimization":
                demand = float(payload.get("annual_demand", 12000.0))
                setup_cost = float(payload.get("setup_cost", 250.0))
                holding = float(payload.get("holding_cost_per_unit", 8.0))
                rate = float(payload.get("production_rate", 24000.0))
                res = self.sympy_engine.calculate_optimal_batch_size(demand, setup_cost, holding, rate)

            elif calc_type == "production_rate_decay":
                p_max = float(payload.get("p_max", 120.0))
                k = float(payload.get("k_decay", 0.45))
                shift_hours = float(payload.get("shift_hours", 8.0))
                res = self.sympy_engine.calculate_diminishing_production_rate(p_max, k, shift_hours)

            elif calc_type == "line_balancing":
                caps = payload.get("station_capacities", [3.2, 4.1, 2.8, 4.4, 3.9])
                target = float(payload.get("target_cycle_time", 4.5))
                res = self.sympy_engine.solve_line_balancing_equilibrium(caps, target)

            else:
                return {"status": "error", "message": f"Unknown calculation_type '{calc_type}'"}

            return {"status": "ok", "sympy_result": res}

        # 9. Multiprocessing Parallel Simulations
        elif action == "run_parallel_sim":
            jobs = self.db.get_all_jobs()
            resources = self.db.get_all_resources()
            simulator = ParallelProductionSimulator(jobs, resources)
            sim_result = simulator.run_parallel_scenarios()
            return {"status": "ok", "simulation": sim_result}

        # 10. Database Seed / Reset
        elif action == "seed_data":
            force = payload.get("force", True)
            self.db.seed_sample_data(force=force)
            return {"status": "ok", "message": "Database successfully reset with sample data"}

        else:
            return {"status": "error", "message": f"Unrecognized action: {action}"}


def main():
    server = SchedulingSocketServer()
    server.start()


if __name__ == "__main__":
    main()
