import React, { useState } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Layers, AlertCircle, X, Check } from 'lucide-react';
import { Job, PriorityLevel } from '../types';

interface JobsTabProps {
  jobs: Job[];
  onAddJob: (jobData: Partial<Job>) => Promise<void>;
  onUpdateJob: (id: number, updates: Partial<Job>) => Promise<void>;
  onDeleteJob: (id: number) => Promise<void>;
}

export const JobsTab: React.FC<JobsTabProps> = ({
  jobs,
  onAddJob,
  onUpdateJob,
  onDeleteJob
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    product_code: '',
    priority: 'medium' as PriorityLevel,
    processing_time: 3.5,
    deadline: 18.0,
    required_resource_type: 'CNC Milling',
    batch_size: 150
  });

  const resourceTypes = [
    'CNC Milling',
    'Laser Cutting',
    'Injection Molding',
    'Automated Assembly',
    'Quality Inspection'
  ];

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      product_code: `PRD-${Math.floor(100 + Math.random() * 900)}`,
      priority: 'medium',
      processing_time: 4.0,
      deadline: 20.0,
      required_resource_type: 'CNC Milling',
      batch_size: 200
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      product_code: job.product_code,
      priority: job.priority,
      processing_time: job.processing_time,
      deadline: job.deadline,
      required_resource_type: job.required_resource_type,
      batch_size: job.batch_size
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await onUpdateJob(editingJob.id, formData);
      } else {
        await onAddJob(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving job: ${err.message}`);
    }
  };

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.product_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || j.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || j.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-800 text-[10px] font-semibold">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-medium">MEDIUM</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-medium">LOW</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Production Job Catalog</h2>
          <p className="text-xs text-slate-400">
            CRUD operations stored in SQLite database with constraints & validation
          </p>
        </div>
        <button
          id="add-job-button"
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Production Order</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search job title or product code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-1 text-xs text-slate-400">
          <span>Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1 text-xs text-slate-400">
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="conflict">Conflict</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 ml-auto font-mono">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      </div>

      {/* Jobs Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-medium">
                <th className="py-3 px-4">Job Order & Code</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-3">Required Workstation</th>
                <th className="py-3 px-3 text-center">Duration</th>
                <th className="py-3 px-3 text-center">Deadline</th>
                <th className="py-3 px-3 text-center">Batch Size</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{job.title}</div>
                      <div className="text-[10px] font-mono text-cyan-400">{job.product_code}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getPriorityBadge(job.priority)}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                        {job.required_resource_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-200">
                      {job.processing_time} hrs
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-400">
                      Hour {job.deadline}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {job.batch_size} units
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        job.status === 'conflict'
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : job.status === 'scheduled'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {job.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(job)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Edit Job"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete job "${job.title}" (#${job.id})?`)) {
                            onDeleteJob(job.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No production jobs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingJob ? `Edit Job #${editingJob.id}` : 'Create New Production Order'}
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
                <label className="block text-slate-300 font-medium mb-1">Part / Job Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Hydraulic Actuator Piston"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Product Code</label>
                  <input
                    type="text"
                    required
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={formData.processing_time}
                    onChange={(e) => setFormData({ ...formData, processing_time: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Deadline (hr)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1.0"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: parseFloat(e.target.value) || 24.0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.batch_size}
                    onChange={(e) => setFormData({ ...formData, batch_size: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Required Resource / Machine Type</label>
                <select
                  value={formData.required_resource_type}
                  onChange={(e) => setFormData({ ...formData, required_resource_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {resourceTypes.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
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
                  {editingJob ? 'Update Order' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
