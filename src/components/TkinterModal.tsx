import React, { useState } from 'react';
import { Monitor, Copy, Check, X, Terminal, ExternalLink } from 'lucide-react';

interface TkinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TkinterModal: React.FC<TkinterModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const launchCommand = 'python3 backend/main.py --mode gui';

  const handleCopy = () => {
    navigator.clipboard.writeText(launchCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tkinter Python Desktop Interface</h3>
              <p className="text-xs text-slate-400">Native Python GUI module for standalone workstation operations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-cyan-400 flex items-center space-x-2">
              <Terminal className="w-4 h-4" />
              <span>Launch Command</span>
            </h4>
            <p className="text-slate-300">
              Execute this command in any terminal with a graphical desktop environment (or X11 display):
            </p>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white">
              <span>{launchCommand}</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-sans font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Tkinter Architecture Implementation Details:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong className="text-slate-100">File:</strong> <code className="text-cyan-400 font-mono">backend/gui.py</code>
              </li>
              <li>
                <strong className="text-slate-100">Components:</strong> Built using <code className="text-slate-200 font-mono">tkinter.ttk.Notebook</code> for multi-tab views (Dashboard, Jobs CRUD, Machine Status, Schedule Timetable, Conflict Logs).
              </li>
              <li>
                <strong className="text-slate-100">Treeview Data Tables:</strong> Utilizes <code className="text-slate-200 font-mono">ttk.Treeview</code> for high-performance sorting and data rendering.
              </li>
              <li>
                <strong className="text-slate-100">Shared SQLite & Socket Sync:</strong> Works directly with <code className="text-slate-200 font-mono">backend/database.py</code> and can query the TCP socket server synchronously.
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-indigo-300 text-[11px]">
            <strong>Cloud Container Note:</strong> In headless cloud environments where an X11 display server is not attached, the desktop window can be rendered headlessly using <code className="font-mono">xvfb-run python3 backend/gui.py</code> or run locally after downloading the repository.
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
