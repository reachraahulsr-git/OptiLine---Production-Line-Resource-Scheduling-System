import React, { useState } from 'react';
import { Terminal, Send, X, Check, Copy, Code, Cpu, Server } from 'lucide-react';
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
  const [targetSocket, setTargetSocket] = useState<string>('127.0.0.1:8765');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'code'>('console');

  if (!isOpen) return null;

  const presetActions = [
    { label: 'Ping Server', action: 'ping', payload: '{}' },
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
                <span>Python TCP Socket Terminal & IPC Inspector</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  port {targetSocket}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direct low-level TCP socket client sending newline-delimited JSON packets to `server.py`
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
                Socket Terminal
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'code' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Python Code Architecture
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
                <label className="block text-slate-400 font-medium mb-1">Preset Socket Commands</label>
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
                <span>{isSending ? 'Transmitting...' : 'Send Socket Packet'}</span>
              </button>
            </div>

            {/* Right Column: Terminal Response Inspector */}
            <div className="flex-1 flex flex-col p-4 bg-slate-950 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>TCP Stream Output ({targetSocket})</span>
                </span>
                {latency !== null && (
                  <span className="text-cyan-400 text-[11px]">Round-trip: {latency} ms</span>
                )}
              </div>

              <div className="flex-1 overflow-auto mt-2 text-slate-300 pr-2">
                {responseOutput ? (
                  <pre className="text-[11px] leading-relaxed text-emerald-400 whitespace-pre-wrap">
                    {JSON.stringify(responseOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600">
                    Select a preset or enter an action and click &quot;Send Socket Packet&quot;
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Code Architecture View */
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs font-mono bg-slate-950 text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold block"># 1. OOP Models (backend/models.py)</span>
              <p className="text-slate-400 font-sans">
                Encapsulates entities with attributes, validation, and polymorphic method overriding:
              </p>
              <pre className="text-[11px] text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto">
{`class ProductionResource:
    def __init__(self, resource_id, name, resource_type, capacity, hourly_rate, status="active"):
        self._id = resource_id
        self._capacity = capacity
        ...
    def calculate_cost(self, duration_hours):
        return self._hourly_rate * duration_hours

class MachineResource(ProductionResource):
    """Demonstrates Inheritance and Method Overriding."""
    def calculate_cost(self, duration_hours):
        effective_hours = duration_hours / self._efficiency_factor
        return (self._hourly_rate + self._operational_cost) * effective_hours`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold block"># 2. Functional Programming (backend/utils.py)</span>
              <pre className="text-[11px] text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto">
{`# Functional map, filter, lambda:
urgent_jobs = list(filter(lambda j: j.priority == 'urgent', jobs))
projected_hours = list(map(lambda j: j.processing_time * 1.15, jobs))

# List and dictionary comprehensions:
urgent_ids = [j.id for j in jobs if j.priority == 'urgent']
resource_map = {r.id: r for r in resources}

# Higher-order function composition:
pipeline = compose(validate_job, prioritize_job, schedule_job)`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold block"># 3. Socket IPC Server (backend/server.py)</span>
              <pre className="text-[11px] text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto">
{`server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server_sock.bind(('127.0.0.1', 8765))
server_sock.listen(10)
# Multi-threaded client handling with JSON newline framing`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
