import express from 'express';
import path from 'path';
import net from 'net';
import { spawn, ChildProcess } from 'child_process';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const PYTHON_SOCKET_HOST = process.env.PYTHON_SOCKET_HOST || '127.0.0.1';
const PYTHON_SOCKET_PORT = parseInt(process.env.PYTHON_SOCKET_PORT || '8765', 10);

let pythonProcess: ChildProcess | null = null;

// Ensure Python socket server is actively running in background for local dev
function ensurePythonServer() {
  const testSock = new net.Socket();
  testSock.setTimeout(800);

  testSock.on('connect', () => {
    testSock.destroy();
    console.log(`[Express Bridge] Connected to Python Socket Server on port ${PYTHON_SOCKET_PORT}`);
  });

  testSock.on('error', () => {
    testSock.destroy();
    console.log(`[Express Bridge] Launching Python Socket Server on port ${PYTHON_SOCKET_PORT}...`);
    try {
      const pythonScript = path.join(process.cwd(), 'backend', 'server.py');
      pythonProcess = spawn('python3', [pythonScript], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      pythonProcess.stdout?.on('data', (data) => {
        console.log(`[Python Server stdout] ${data.toString().trim()}`);
      });

      pythonProcess.stderr?.on('data', (data) => {
        console.error(`[Python Server stderr] ${data.toString().trim()}`);
      });

      pythonProcess.on('exit', (code) => {
        console.log(`[Python Server] Exited with code ${code}`);
        pythonProcess = null;
      });
    } catch (err) {
      console.error('[Express Bridge] Failed to spawn Python process:', err);
    }
  });

  testSock.on('timeout', () => {
    testSock.destroy();
  });

  testSock.connect(PYTHON_SOCKET_PORT, PYTHON_SOCKET_HOST);
}

// Low-level TCP Socket IPC Client (used for local socket testing)
export function sendSocketRequest(action: string, payload: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let responseData = '';
    let isResolved = false;

    // Fast 1.5s connection timeout so fallback triggers promptly if socket is down
    client.setTimeout(1500);

    client.connect(PYTHON_SOCKET_PORT, PYTHON_SOCKET_HOST, () => {
      // Once connected, extend timeout to 25s for heavy calculations
      client.setTimeout(25000);
      const message = JSON.stringify({ action, payload }) + '\n';
      client.write(message, 'utf-8');
    });

    client.on('data', (chunk) => {
      responseData += chunk.toString('utf-8');
      if (responseData.includes('\n')) {
        const [firstLine] = responseData.split('\n');
        try {
          const parsed = JSON.parse(firstLine.trim());
          isResolved = true;
          client.destroy();
          resolve(parsed);
        } catch (e) {
          // If incomplete, continue buffering
        }
      }
    });

    client.on('timeout', () => {
      if (!isResolved) {
        client.destroy();
        reject(new Error(`Socket operation '${action}' timed out`));
      }
    });

    client.on('error', (err) => {
      if (!isResolved) {
        reject(new Error(`TCP Socket connection failed to ${PYTHON_SOCKET_HOST}:${PYTHON_SOCKET_PORT}: ${err.message}`));
      }
    });
  });
}

// Direct Python Execution Runner (in-process fallback, removes 127.0.0.1:8765 hard dependency)
export function executeDirectPython(action: string, payload: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const pythonScript = path.join(process.cwd(), 'backend', 'dispatch.py');
      const inputPayload = JSON.stringify({ action, payload });
      const py = spawn('python3', [pythonScript, inputPayload], {
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (d) => {
        stdout += d.toString();
      });

      py.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      py.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse Python response: ${stdout || stderr}`));
        }
      });

      py.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Resilient executor: tries TCP socket first, falls back instantly to direct Python execution
export async function executePythonAction(action: string, payload: any = {}): Promise<{ data: any; mode: string }> {
  try {
    const data = await sendSocketRequest(action, payload);
    return { data, mode: 'socket' };
  } catch (socketErr) {
    // Graceful fallback to direct Python execution
    const data = await executeDirectPython(action, payload);
    return { data, mode: 'direct_python' };
  }
}

async function startServer() {
  ensurePythonServer();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // CORS for dev and production flexibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==================== API ROUTES ====================

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'OptiLine Production Scheduling Engine',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // Python Engine Status / Diagnostics
  app.get('/api/python/status', async (req, res) => {
    try {
      const { data, mode } = await executePythonAction('ping');
      res.json({
        ...data,
        mode: mode === 'socket' ? 'TCP Socket (Development)' : 'HTTP REST (Production / In-Process)',
        socket_target: mode === 'socket' ? `${PYTHON_SOCKET_HOST}:${PYTHON_SOCKET_PORT}` : 'Direct Python Execution'
      });
    } catch (err: any) {
      res.status(503).json({ status: 'error', message: err.message });
    }
  });

  // Dashboard Aggregates
  app.get('/api/dashboard', async (req, res) => {
    try {
      const { data } = await executePythonAction('get_dashboard');
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Jobs CRUD
  app.get('/api/jobs', async (req, res) => {
    try {
      const { data } = await executePythonAction('get_jobs');
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.post('/api/jobs', async (req, res) => {
    try {
      const { data } = await executePythonAction('create_job', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.put('/api/jobs/:id', async (req, res) => {
    try {
      const { data } = await executePythonAction('update_job', {
        id: req.params.id,
        updates: req.body
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.delete('/api/jobs/:id', async (req, res) => {
    try {
      const { data } = await executePythonAction('delete_job', { id: req.params.id });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Resources CRUD
  app.get('/api/resources', async (req, res) => {
    try {
      const { data } = await executePythonAction('get_resources');
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.post('/api/resources', async (req, res) => {
    try {
      const { data } = await executePythonAction('create_resource', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.put('/api/resources/:id', async (req, res) => {
    try {
      const { data } = await executePythonAction('update_resource', {
        id: req.params.id,
        updates: req.body
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.delete('/api/resources/:id', async (req, res) => {
    try {
      const { data } = await executePythonAction('delete_resource', { id: req.params.id });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Scheduling Execution
  app.post('/api/schedule/run', async (req, res) => {
    try {
      const strategy = req.body.strategy || 'priority_first';
      const persist = req.body.persist !== undefined ? req.body.persist : true;
      const { data } = await executePythonAction('run_scheduling', { strategy, persist });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.get('/api/schedules', async (req, res) => {
    try {
      const { data } = await executePythonAction('get_schedules');
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.delete('/api/schedules', async (req, res) => {
    try {
      const { data } = await executePythonAction('clear_schedules');
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Conflict Detection
  app.get('/api/conflicts', async (req, res) => {
    try {
      const { data } = await executePythonAction('detect_conflicts');
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Analytics & Reports
  app.get('/api/analytics', async (req, res) => {
    try {
      const { data } = await executePythonAction('get_analytics');
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // SymPy Symbolic Calculations
  app.post('/api/sympy', async (req, res) => {
    try {
      const { data } = await executePythonAction('run_sympy', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Multiprocessing Parallel Simulations
  app.post('/api/parallel-sim', async (req, res) => {
    try {
      const { data } = await executePythonAction('run_parallel_sim', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Database Seed / Reset
  app.post('/api/reset-data', async (req, res) => {
    try {
      const { data } = await executePythonAction('seed_data', { force: true });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Raw Command Terminal inspector endpoint
  app.post('/api/socket/raw', async (req, res) => {
    try {
      const { action, payload } = req.body;
      const t0 = Date.now();
      const { data, mode } = await executePythonAction(action, payload);
      const latencyMs = Date.now() - t0;
      res.json({
        raw_response: data,
        latency_ms: latencyMs,
        socket_target: mode === 'socket' ? `${PYTHON_SOCKET_HOST}:${PYTHON_SOCKET_PORT}` : 'HTTP REST Engine (Direct Python)'
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // ==================== VITE / STATIC SERVING ====================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OptiLine Web Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
