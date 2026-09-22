import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Cpu, Activity, AlertCircle, X, Power } from 'lucide-react';
import { Resource, ResourceStatus } from '../types';

interface ResourcesTabProps {
  resources: Resource[];
  onAddResource: (resData: Partial<Resource>) => Promise<void>;
  onUpdateResource: (id: number, updates: Partial<Resource>) => Promise<void>;
  onDeleteResource: (id: number) => Promise<void>;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  resources,
  onAddResource,
  onUpdateResource,
  onDeleteResource
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'CNC Milling',
    capacity: 250,
    hourly_rate: 65.0,
    operational_cost: 15.0,
    efficiency_factor: 1.0,
    status: 'active' as ResourceStatus
  });

  const resourceTypes = [
    'CNC Milling',
    'Laser Cutting',
    'Injection Molding',
    'Automated Assembly',
    'Quality Inspection'
  ];

  const handleOpenAddModal = () => {
    setEditingResource(null);
    setFormData({
      name: '',
      type: 'CNC Milling',
      capacity: 300,
      hourly_rate: 70.0,
      operational_cost: 18.0,
      efficiency_factor: 1.0,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (res: Resource) => {
    setEditingResource(res);
    setFormData({
      name: res.name,
      type: res.type,
      capacity: res.capacity,
      hourly_rate: res.hourly_rate,
      operational_cost: res.operational_cost ?? 15.0,
      efficiency_factor: res.efficiency_factor ?? 1.0,
      status: res.status
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await onUpdateResource(editingResource.id, formData);
      } else {
        await onAddResource(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving machine: ${err.message}`);
    }
  };

  const handleToggleStatus = async (res: Resource) => {
    const nextStatus: ResourceStatus =
      res.status === 'active' ? 'maintenance' : res.status === 'maintenance' ? 'idle' : 'active';
    await onUpdateResource(res.id, { status: nextStatus });
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Machine Fleet & Production Cells</h2>
          <p className="text-xs text-slate-400">
            OOP MachineResource models featuring encapsulated rates, overheads, and efficiency multipliers
          </p>
        </div>
        <button
          id="add-machine-button"
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Machine</span>
        </button>
      </div>

      {/* Grid of Machines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((res) => {
          const isMaint = res.status === 'maintenance';
          const isIdle = res.status === 'idle';
          const isActive = res.status === 'active';

          return (
            <div
              key={res.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isMaint
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : isIdle
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                      ID #{res.id} • {res.type}
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-white tracking-tight">{res.name}</h3>
                  </div>

                  {/* Status badge & quick toggle */}
                  <button
                    onClick={() => handleToggleStatus(res)}
                    title="Click to toggle status (Active -> Maintenance -> Idle)"
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                      isActive
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                        : isMaint
                        ? 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Power className="w-2.5 h-2.5" />
                    <span>{res.status.toUpperCase()}</span>
                  </button>
                </div>

                {/* Specs List */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Batch Limit</span>
                    <span className="text-sm font-bold font-mono text-slate-200">{res.capacity} units</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Base Hourly Rate</span>
                    <span className="text-sm font-bold font-mono text-slate-200">${res.hourly_rate}/h</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Efficiency Factor</span>
                    <span className="text-sm font-bold font-mono text-cyan-400">
                      {res.efficiency_factor ? `${(res.efficiency_factor * 100).toFixed(0)}%` : '100%'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Effective Cost</span>
                    <span className="text-sm font-bold font-mono text-indigo-400">
                      ${res.effective_hourly_cost ? res.effective_hourly_cost.toFixed(2) : ((res.hourly_rate + (res.operational_cost || 0)) / (res.efficiency_factor || 1.0)).toFixed(2)}/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  OOP Polymorphic Class: MachineResource
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditModal(res)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Edit Machine Properties"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete machine "${res.name}" (#${res.id})?`)) {
                        onDeleteResource(res.id);
                      }
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950 transition-colors"
                    title="Decommission Machine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingResource ? `Configure Machine #${editingResource.id}` : 'Provision New Production Machine'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Machine Designation / Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mazak Integrex e-500H 5-Axis"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Workstation Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {resourceTypes.map((rt) => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Operating Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ResourceStatus })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="active">Active (Available)</option>
                    <option value="maintenance">Maintenance (Offline)</option>
                    <option value="idle">Idle (Standby)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Capacity Limit</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Base Rate ($/h)</label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 50.0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Overhead ($/h)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={formData.operational_cost}
                    onChange={(e) => setFormData({ ...formData, operational_cost: parseFloat(e.target.value) || 10.0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Efficiency Factor (0.50 - 1.20)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.5"
                  required
                  value={formData.efficiency_factor}
                  onChange={(e) => setFormData({ ...formData, efficiency_factor: parseFloat(e.target.value) || 1.0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Higher efficiency decreases actual job duration. (Duration = Nominal Duration / Efficiency).
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
                >
                  {editingResource ? 'Update Machine' : 'Save Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
