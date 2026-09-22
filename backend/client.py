"""
Python Socket Client for Production Line Resource Scheduling System.
Demonstrates:
- Client-side Socket Programming using socket.AF_INET and socket.SOCK_STREAM
- JSON request transmission and stream parsing
- CLI interface to test socket server commands directly from terminal
"""

import socket
import json
import sys
import argparse
from typing import Dict, Any, Optional

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
BUFFER_SIZE = 65536


class SchedulingSocketClient:
    """
    OOP Client for connecting to the OptiLine Python Socket Server.
    Provides encapsulated methods to invoke remote scheduling routines.
    """

    def __init__(self, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, timeout: float = 10.0):
        self.host = host
        self.port = port
        self.timeout = timeout
        self._socket: Optional[socket.socket] = None

    def connect(self):
        """Establishes TCP connection to the scheduling socket server."""
        self._socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._socket.settimeout(self.timeout)
        self._socket.connect((self.host, self.port))

    def close(self):
        """Closes the client socket."""
        if self._socket:
            try:
                self._socket.close()
            except Exception:
                pass
            self._socket = None

    def send_request(self, action: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Sends a JSON framed request over the socket and reads the newline-delimited response.
        """
        must_close = False
        if not self._socket:
            self.connect()
            must_close = True

        try:
            req_data = {
                "action": action,
                "payload": payload or {}
            }
            msg = json.dumps(req_data) + "\n"
            self._socket.sendall(msg.encode("utf-8"))

            # Accumulate response until newline
            buffer = ""
            while True:
                chunk = self._socket.recv(BUFFER_SIZE)
                if not chunk:
                    raise ConnectionError("Connection closed prematurely by server.")
                buffer += chunk.decode("utf-8")
                if "\n" in buffer:
                    line, _ = buffer.split("\n", 1)
                    return json.loads(line.strip())

        finally:
            if must_close:
                self.close()

    # Convenient API wrappers
    def ping(self) -> Dict[str, Any]:
        return self.send_request("ping")

    def get_dashboard(self) -> Dict[str, Any]:
        return self.send_request("get_dashboard")

    def run_scheduling(self, strategy: str = "priority_first") -> Dict[str, Any]:
        return self.send_request("run_scheduling", {"strategy": strategy, "persist": True})

    def detect_conflicts(self) -> Dict[str, Any]:
        return self.send_request("detect_conflicts")

    def run_sympy(self, calculation_type: str = "batch_optimization") -> Dict[str, Any]:
        return self.send_request("run_sympy", {"calculation_type": calculation_type})

    def run_parallel_sim(self) -> Dict[str, Any]:
        return self.send_request("run_parallel_sim")


def main():
    parser = argparse.ArgumentParser(description="OptiLine Python Scheduling Socket Client")
    parser.add_argument("--action", default="ping", choices=[
        "ping", "get_dashboard", "get_jobs", "get_resources",
        "run_scheduling", "detect_conflicts", "get_analytics",
        "run_sympy", "run_parallel_sim", "seed_data"
    ], help="Action to execute over socket")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Server IP")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Server Port")
    parser.add_argument("--strategy", default="priority_first", help="Scheduling strategy")

    args = parser.parse_args()

    client = SchedulingSocketClient(host=args.host, port=args.port)
    try:
        print(f"Connecting to socket server at {args.host}:{args.port}...")
        payload = {}
        if args.action == "run_scheduling":
            payload = {"strategy": args.strategy, "persist": True}

        resp = client.send_request(args.action, payload)
        print("\n--- Response Received over TCP Socket ---")
        print(json.dumps(resp, indent=2))
    except Exception as e:
        print(f"Socket Client Error: {e}")
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    main()
