"""
TCP Socket Server for Production Line Resource Scheduling System.
Demonstrates Socket Programming in Python:
- Socket creation, bind, listen, accept
- Threaded connection handling
- JSON protocol over TCP
- Dispatches requests using central ProductionDispatcher
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

from dispatcher import get_dispatcher

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
        self.dispatcher = get_dispatcher()
        self.is_running = False
        self._server_socket = None

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
        """Routes action through central dispatcher and enriches with socket telemetry."""
        action = req.get("action", "")
        res = self.dispatcher.dispatch(req)
        if action == "ping" and res.get("status") == "ok":
            res["socket_address"] = f"{self.host}:{self.port}"
            res["mode"] = "TCP Socket (Development Mode)"
        return res


def main():
    server = SchedulingSocketServer()
    server.start()


if __name__ == "__main__":
    main()
