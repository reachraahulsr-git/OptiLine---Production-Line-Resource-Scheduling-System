"""
Vercel Serverless Function Handler for OptiLine Production Scheduling System.
Provides a native HTTP REST API for Vercel deployment:
- Handles all /api/* requests serverlessly without requiring a background TCP daemon or 127.0.0.1:8765
- Seamlessly dispatches to the core Python scheduling, conflict detection, SymPy calculus,
  and SQLite persistence modules.
- Implements Vercel's standard BaseHTTPRequestHandler interface with CORS support.
"""

import os
import sys
import json
import urllib.parse
from http.server import BaseHTTPRequestHandler

# Add root and backend to sys.path so imports work properly on Vercel
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dispatcher import get_dispatcher


class handler(BaseHTTPRequestHandler):
    """Vercel serverless HTTP request handler."""

    def _set_cors_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.end_headers()

    def do_OPTIONS(self):
        """Handles CORS preflight checks."""
        self._set_cors_headers(200)

    def _read_json_body(self):
        """Reads and parses JSON from request body."""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 0:
                body_bytes = self.rfile.read(content_length)
                return json.loads(body_bytes.decode("utf-8"))
        except Exception:
            pass
        return {}

    def _send_json_response(self, data, status_code=200):
        self._set_cors_headers(status_code)
        response_bytes = json.dumps(data).encode("utf-8")
        self.wfile.write(response_bytes)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        dispatcher = get_dispatcher()

        # Handle health check
        if path == "/api/health" or path == "/health":
            self._send_json_response({
                "status": "ok",
                "service": "OptiLine Production Scheduling Engine (Vercel Serverless)",
                "runtime": "Python 3.x HTTP REST",
                "timestamp": None
            })
            return

        # Python status diagnostic
        if path == "/api/python/status" or path == "/python/status":
            res = dispatcher.dispatch({"action": "ping"})
            res["mode"] = "Production HTTP REST API (Vercel Ready)"
            res["socket_address"] = "HTTP REST API Endpoint"
            self._send_json_response(res)
            return

        # Dashboard
        if path == "/api/dashboard" or path == "/dashboard":
            res = dispatcher.dispatch({"action": "get_dashboard"})
            self._send_json_response(res)
            return

        # Jobs list
        if path == "/api/jobs" or path == "/jobs":
            res = dispatcher.dispatch({"action": "get_jobs"})
            self._send_json_response(res)
            return

        # Resources list
        if path == "/api/resources" or path == "/resources":
            res = dispatcher.dispatch({"action": "get_resources"})
            self._send_json_response(res)
            return

        # Schedules list
        if path == "/api/schedules" or path == "/schedules":
            res = dispatcher.dispatch({"action": "get_schedules"})
            self._send_json_response(res)
            return

        # Conflicts
        if path == "/api/conflicts" or path == "/conflicts":
            res = dispatcher.dispatch({"action": "detect_conflicts"})
            self._send_json_response(res)
            return

        # Analytics
        if path == "/api/analytics" or path == "/analytics":
            res = dispatcher.dispatch({"action": "get_analytics"})
            self._send_json_response(res)
            return

        self._send_json_response({"status": "error", "message": f"Route not found: {path}"}, 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = self._read_json_body()
        dispatcher = get_dispatcher()

        # Run Scheduling
        if path == "/api/schedule/run" or path == "/schedule/run":
            strategy = body.get("strategy", "priority_first")
            persist = body.get("persist", True)
            res = dispatcher.dispatch({
                "action": "run_scheduling",
                "payload": {"strategy": strategy, "persist": persist}
            })
            self._send_json_response(res)
            return

        # Create Job
        if path == "/api/jobs" or path == "/jobs":
            res = dispatcher.dispatch({"action": "create_job", "payload": body})
            self._send_json_response(res)
            return

        # Create Resource
        if path == "/api/resources" or path == "/resources":
            res = dispatcher.dispatch({"action": "create_resource", "payload": body})
            self._send_json_response(res)
            return

        # SymPy Calculations
        if path == "/api/sympy" or path == "/sympy":
            res = dispatcher.dispatch({"action": "run_sympy", "payload": body})
            self._send_json_response(res)
            return

        # Multiprocessing Parallel Simulator
        if path == "/api/parallel-sim" or path == "/parallel-sim":
            res = dispatcher.dispatch({"action": "run_parallel_sim", "payload": body})
            self._send_json_response(res)
            return

        # Reset Sample Data
        if path == "/api/reset-data" or path == "/reset-data":
            res = dispatcher.dispatch({"action": "seed_data", "payload": {"force": True}})
            self._send_json_response(res)
            return

        # Raw Command / Socket inspector proxy
        if path == "/api/socket/raw" or path == "/socket/raw":
            action = body.get("action", "ping")
            payload = body.get("payload", {})
            res = dispatcher.dispatch({"action": action, "payload": payload})
            self._send_json_response({
                "status": "ok",
                "raw_response": res,
                "latency_ms": 1,
                "socket_target": "HTTP Serverless / In-Process"
            })
            return

        self._send_json_response({"status": "error", "message": f"Route not found: {path}"}, 404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = self._read_json_body()
        dispatcher = get_dispatcher()

        # Update Job: /api/jobs/<id>
        if path.startswith("/api/jobs/") or path.startswith("/jobs/"):
            parts = path.split("/")
            job_id = int(parts[-1])
            res = dispatcher.dispatch({
                "action": "update_job",
                "payload": {"id": job_id, "updates": body}
            })
            self._send_json_response(res)
            return

        # Update Resource: /api/resources/<id>
        if path.startswith("/api/resources/") or path.startswith("/resources/"):
            parts = path.split("/")
            res_id = int(parts[-1])
            res = dispatcher.dispatch({
                "action": "update_resource",
                "payload": {"id": res_id, "updates": body}
            })
            self._send_json_response(res)
            return

        self._send_json_response({"status": "error", "message": f"Route not found: {path}"}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        dispatcher = get_dispatcher()

        # Delete Job: /api/jobs/<id>
        if path.startswith("/api/jobs/") or path.startswith("/jobs/"):
            parts = path.split("/")
            job_id = int(parts[-1])
            res = dispatcher.dispatch({
                "action": "delete_job",
                "payload": {"id": job_id}
            })
            self._send_json_response(res)
            return

        # Delete Resource: /api/resources/<id>
        if path.startswith("/api/resources/") or path.startswith("/resources/"):
            parts = path.split("/")
            res_id = int(parts[-1])
            res = dispatcher.dispatch({
                "action": "delete_resource",
                "payload": {"id": res_id}
            })
            self._send_json_response(res)
            return

        # Clear Schedules: /api/schedules
        if path == "/api/schedules" or path == "/schedules":
            res = dispatcher.dispatch({"action": "clear_schedules"})
            self._send_json_response(res)
            return

        self._send_json_response({"status": "error", "message": f"Route not found: {path}"}, 404)
