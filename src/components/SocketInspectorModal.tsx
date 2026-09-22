import React, { useState } from 'react';
import { Terminal, Send, X, Globe, Cpu } from 'lucide-react';
import { api } from '../api';

interface SocketInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocketInspectorModal: React.FC<SocketInspectorModalProps> = ({ isOpen, onClose }) => {
  const [action, setAction] = useState('ping');
  const [payloadStr, setPayloadStr] = useState('{}');
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [targetSocket, setTargetSocket] = useState<string>('HTTP REST /api/ (Serverless Ready)');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'code'>('console');

  if (!isOpen) return null;

  const presetActions = [
    { label: 'Ping Engine Health', action: 'ping', payload: '{}' },
    { label: 'Get Dashboard Data', action: 'get_dashboard', payload: '{}' },
    { label: 'Fetch All Jobs', action: 'get_jobs', payload: '{}' },
    { label: 'Fetch All Machines', action: 'get_resources', payload: '{}' },
    { label: 'Run Priority Scheduling', action: 'run_scheduling', payload: '{"strategy": "priority_first"}' },
    { label: 'Run Earliest Deadline', action: 'run_scheduling', payload: '{"strategy": "earliest_deadline"}' },
    { label: 'Detect Conflicts', action: 'detect_conflicts', payload: '{}' },
    { label: 'Run Parallel Simulation', action: 'run_parallel_sim', payload: '{}' }
  ];

  const handleSelectPreset = (p: { action: string; payload: string }) => {
    setAction(p.action);
    setPayloadStr(p.payload);
  };

  const handleSendCommand = async () => {
    setIsSending(true);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(payloadStr);
      } catch (e) {
        alert('Invalid JSON in payload field');
        setIsSending(false);
        return;
      }

      const res = await api.sendRawSocketCommand(action, parsedPayload);
      setResponseOutput(res.raw_response);
      setLatency(res.latency_ms);
      setTargetSocket(res.socket_target);
    } catch (err: any) {
      setResponseOutput({ error: err.message });
      setLatency(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[650px] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Python API Terminal & IPC Inspector</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  {targetSocket}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Standard HTTP REST / Serverless interface with dual TCP socket IPC support
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('console')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'console' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                API Console
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'code' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Architecture Stack
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'console' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Command presets & Payload builder */}
            <div className="w-full md:w-80 border-r border-slate-800 p-4 space-y-4 overflow-y-auto bg-slate-900/50 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Preset Commands</label>
                <div className="space-y-1">
                  {presetActions.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(p)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-colors ${
                        action === p.action && payloadStr === p.payload
                          ? 'bg-indigo-950/70 text-indigo-200 border-indigo-700'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Action Identifier</label>
                <input
                  type="text"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-cyan-400 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">JSON Payload Parameter</label>
                <textarea
                  rows={4}
                  value={payloadStr}
                  onChange={(e) => setPayloadStr(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-200 focus:border-indigo-500 text-[11px]"
                />
              </div>

              <button
                onClick={handleSendCommand}
                disabled={isSending}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Transmitting...' : 'Execute Command'}</span>
              </button>
            </div>

            {/* Right Column: Terminal Response Inspector */}
            <div className="flex-1 flex flex-col p-4 bg-slate-950 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Output ({targetSocket})</span>
                </span>
                {latency !== null && (
                  <span className="text-cyan-400 text-[11px]">Latency: {latency} ms</span>
                )}
              </div>

              <div className="flex-1 overflow-auto mt-2 text-slate-300 pr-2">
                {responseOutput ? (
                  <pre className="text-[11px] leading-relaxed text-emerald-400 whitespace-pre-wrap">
                    {JSON.stringify(responseOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600">
                    Select a preset or enter an action and click &quot;Execute Command&quot;
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Code Architecture View */
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs font-mono bg-slate-950 text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold block flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span># 1. Production HTTP REST API & Serverless (api/index.py)</span>
              </span>
              <p className="text-slate-400 font-sans">
                Native Vercel Serverless Function eliminating local socket dependencies for 100% production uptime:
              </p>
              <pre className="text-[11px] text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto">
{`class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self._read_json_body()
        res = dispatcher.dispatch({"action": "run_scheduling", "payload": body})
        self._send_json_response(res)`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold block flex items-center space-x-2">
                <Cpu className="w-4 h-4" />
                <span># 2. Local Socket & Direct Python Fallback (server.ts & backend/dispatch.py)</span>
              </span>
              <pre className="text-[11px] text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto">
{`export async function executePythonAction(action: string, payload: any = {}) {
    try {
        const data = await sendSocketRequest(action, payload);
        return { data, mode: 'socket' };
    } catch (err) {
        // Direct Python execution fallback
        const data = await executeDirectPython(action, payload);
        return { data, mode: 'direct_python' };
    }
}`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold block"># 3. Core Functional & OOP Engines (backend/)</span>
              <pre className="text-[11px] text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto">
{`# Functional map, filter, lambda:
urgent_jobs = list(filter(lambda j: j.priority == 'urgent', jobs))
projected_hours = list(map(lambda j: j.processing_time * 1.15, jobs))

# Symbolic calculus with SymPy:
from sympy import symbols, diff, solve
Q_opt = sqrt(2 * D * S / (H * (1 - D / P)))`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
