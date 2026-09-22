# OptiLine - Production Line Resource Scheduling System

A production-grade manufacturing resource scheduling, conflict detection, and mathematical optimization system featuring:
- **Python 3.x Engine**: Object-Oriented Models, SQLite persistence, SymPy closed-form calculus, Multiprocessing parallel simulation, and Tkinter desktop GUI.
- **Modern React & Tailwind Web App**: Gantt schedule timeline, real-time metrics, interactive conflict resolver, and API diagnostic console.
- **Universal Deployment Support**: Native Vercel Serverless HTTP API (`api/index.py`) + Full-Stack Local Express/Vite bridge with TCP Socket IPC (`server.ts` & `backend/server.py`).

---

## 🌟 Key Features

1. **Production Scheduling Engine**: Heuristic scheduling algorithms (`priority_first`, `earliest_deadline`, `weighted_slack`) considering machine capacity, processing rates, efficiency factors, and setup overhead.
2. **Automated Conflict Detection Hub**: Diagnoses deadline breaches, machine overlap collisions, volume capacity overruns, and incompatible workstations.
3. **SymPy Symbolic Optimization**:
   - Economic Production Quantity (EPQ) with closed-form derivative solutions $\frac{d(TC)}{dQ} = 0$.
   - Diminishing production rate integration $\int_0^T P_{max}(1 - e^{-kt}) dt$.
   - Assembly line balancing equilibrium and balance delay metrics.
4. **Multiprocessing Simulation**: Parallel stochastic monte-carlo scenarios simulating demand surges, maintenance bottlenecks, and machine failure risks across CPU cores.
5. **Dual Architecture (Production + Local Dev)**:
   - **Vercel / Cloud**: Direct HTTP REST Serverless Function in `api/index.py` with zero reliance on local background sockets.
   - **Local Development**: Express.js bridge (`server.ts`) connecting via low-level TCP Sockets (`127.0.0.1:8765`) or direct in-process fallback runner (`backend/dispatch.py`).
6. **Tkinter Desktop GUI**: Standalone Python desktop interface (`backend/gui.py`) with scheduling controls, jobs CRUD, and conflict diagnosis.

---

## 🚀 Pushing This Project to GitHub

Follow these quick steps to publish the project to your GitHub account:

```bash
# 1. Initialize Git in the project root
git init

# 2. Stage all project files (safe .gitignore is already pre-configured)
git add .

# 3. Create your initial commit
git commit -m "Initial commit: OptiLine Production Scheduling System"

# 4. Create a new repository on GitHub (e.g. 'optiline-scheduling')
# Then link your remote and push (replace USERNAME and REPO with yours):
git branch -M main
git remote add origin https://github.com/USERNAME/optiline-scheduling.git
git push -u origin main
```

---

## 🌐 Deploying to Vercel

This repository is pre-configured with `vercel.json`, `api/index.py`, and root `requirements.txt`:

1. Push your code to GitHub as shown above.
2. Go to [Vercel Dashboard](https://vercel.com/new) and select **Import Project**.
3. Select your GitHub repository.
4. Vercel will automatically detect:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Python Serverless API**: `api/index.py`
5. Click **Deploy**. Your web app and serverless Python scheduling endpoints will be live immediately!

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# Install Node.js packages
npm install
```

### 2. Run Local Full-Stack Development Server

```bash
npm run dev
```

The Express dev server boots on `http://localhost:3000`. It automatically launches or connects to the Python backend on demand.

### 3. Run Standalone Python Modules

```bash
# Run comprehensive academic verification tests
python3 backend/main.py --mode test

# Run the standalone TCP Socket server directly
python3 backend/server.py

# Query the running socket server via CLI
python3 backend/client.py --action ping
python3 backend/client.py --action run_scheduling --strategy priority_first

# Launch the desktop Tkinter interface
python3 backend/main.py --mode gui
```

---

## 📂 Project Structure

```
├── api/
│   └── index.py            # Vercel Serverless HTTP REST API handler
├── backend/
│   ├── models.py           # OOP models (Job, ProductionResource, MachineResource)
│   ├── database.py         # SQLite persistence & automated seed data
│   ├── scheduler.py        # Priority, EDF & Weighted Slack heuristics
│   ├── conflict_detector.py # Conflict diagnosis (deadline, overlap, capacity)
│   ├── sympy_engine.py     # SymPy closed-form calculus & equilibrium models
│   ├── parallel_processing.py # Multiprocessing Pool stochastic simulator
│   ├── utils.py            # Functional programming (lambda, map, filter, compose)
│   ├── dispatcher.py       # Unified central request dispatcher
│   ├── dispatch.py         # Resilient direct CLI execution runner
│   ├── server.py           # TCP Socket Server (port 8765)
│   ├── client.py           # Low-level TCP Socket client
│   ├── gui.py              # Tkinter Desktop GUI application
│   └── main.py             # Unified CLI runner
├── src/
│   ├── components/         # Modular React UI views & tabs
│   ├── api.ts              # Resilient HTTP API client with offline fallback
│   ├── types.ts            # Shared TypeScript interfaces & types
│   ├── App.tsx             # Main layout & tab router
│   └── main.tsx            # React root mount
├── server.ts               # Express bridge & dual-mode Python runner
├── vercel.json             # Vercel deployment & API rewrite routing
├── requirements.txt        # Python dependencies for Vercel
└── package.json            # Node.js project manifest
```
