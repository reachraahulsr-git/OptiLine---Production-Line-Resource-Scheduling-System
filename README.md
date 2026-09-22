# OptiLine - Production Line Resource Scheduling System

A comprehensive manufacturing resource scheduling and conflict detection system combining a high-performance **Python 3.x backend** with a **TypeScript/React web application** and a **Tkinter desktop GUI**.

---

## 🏗 System Architecture & Technology Stack

### 1. Python Backend Architecture (`backend/`)

- **`models.py` (Object-Oriented Programming)**:
  - `Job`: Encapsulates priority, deadline, duration, batch size, and validation with property getters/setters.
  - `ProductionResource`: Base resource class with encapsulated rates and availability checks.
  - `MachineResource(ProductionResource)`: Inherits from `ProductionResource`, demonstrating **Inheritance** and **Method Overriding** for machine efficiency factors and operational power/tool wear overhead calculations.
  - `ScheduleEntry`: Encapsulates temporal intervals `[start_time, end_time]` and overlap detection logic.
  - Custom exceptions (`ModelValidationError`, `DatabaseError`).

- **`server.py` & `client.py` (Socket Programming)**:
  - TCP Socket server (`socket.AF_INET`, `socket.SOCK_STREAM`) on port `8765`.
  - Multi-threaded client handling with JSON framing protocol over TCP.
  - Real-time client ↔ server IPC between Express/Node.js web bridge and the Python scheduling engine.
  - `SchedulingSocketClient`: Python client class with CLI support for direct socket querying.

- **`database.py` (Persistent Storage via SQLite)**:
  - Tables: `jobs`, `resources`, `schedules`, `production_logs`.
  - Complete **CRUD** (Create, Read, Update, Delete) operations.
  - Safe transactions and automated manufacturing sample data seeding.

- **`scheduler.py` (Heuristic Scheduling Algorithms)**:
  - Considers Job Priority (Urgent, High, Medium, Low), Earliest Deadline First (EDF), Processing Time, Machine Efficiency Factor, Capacity Constraints, and Non-overlapping time windows.
  - Heuristic strategies: `priority_first`, `earliest_deadline`, and `weighted_slack`.

- **`conflict_detector.py` (Conflict Detection Engine)**:
  - **Deadline Conflicts**: Flags jobs where completion hour exceeds customer deadline.
  - **Machine Overlap Collisions**: Diagnoses concurrent interval clashes on identical machines.
  - **Capacity Conflicts**: Identifies batches exceeding machine rated volume.
  - **Unscheduled Jobs**: Analyzes root causes (incompatibility, machine offline, tight horizons).

- **`sympy_engine.py` (SymPy Symbolic Mathematics)**:
  - **Economic Production Quantity (EPQ)**: Symbolic derivation solving $\frac{d(TC)}{dQ} = 0$ for $Q^* = \sqrt{\frac{2DS}{H(1 - D/P)}}$.
  - **Diminishing Production Rate Modeling**: Calculus ODE integration $\int_0^T P_{max}(1 - e^{-kt}) dt$ and marginal velocity $\frac{dP}{dt}$.
  - **Line Balancing Equilibrium**: Symbolic calculation of balance delay and theoretical station minimums.

- **`parallel_processing.py` (Multiprocessing Analytics)**:
  - Utilizes `multiprocessing.Pool` across CPU cores.
  - Runs parallel stochastic scenario simulations (tool wear, demand surges, bottleneck detection).
  - Benchmarks wall-clock execution vs. worker CPU time and computes parallel speedup factors.

- **`utils.py` (Functional Programming)**:
  - Real-world `lambda`, `map()`, and `filter()` applications.
  - List comprehensions and dictionary comprehensions for index building.
  - Reusable higher-order functions: `compose()`, `partition()`, and `timed_execution()`.

- **`gui.py` (Tkinter Desktop Interface)**:
  - Full-featured standalone Python Tkinter desktop application with Dashboard, Jobs CRUD, Machine status, Schedule generator, and Conflict logs.

---

## 🚀 Running the Project

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Python Backend Installation & Verification
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run full academic verification test suite
python3 backend/main.py --mode test

# Start the TCP Socket Server
python3 backend/main.py --mode server --port 8765

# Launch the Tkinter Desktop GUI (requires graphical environment)
python3 backend/main.py --mode gui
```

### 2. Running Web Frontend & Express Server
```bash
# Install Node dependencies
npm install

# Start development full-stack server (binds on port 3000 and bridges to Python socket server)
npm run dev
```
Open `http://localhost:3000` in your browser.
