"""
Tkinter Desktop GUI for Production Line Resource Scheduling System.
Provides a standalone Python desktop interface demonstrating:
- Basic Dashboard & KPIs
- Jobs Management view & adding jobs
- Resources/Machines status table
- Interactive Schedule Generation
- Conflict Detection alert log
"""

import sys
import os
import json

# Ensure backend directory is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import DatabaseManager
from scheduler import Scheduler
from conflict_detector import ConflictDetector
from analytics import AnalyticsEngine
from sympy_engine import SymPyProductionEngine

try:
    import tkinter as tk
    from tkinter import ttk, messagebox
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False


class ProductionSchedulingDesktopApp:
    """
    Tkinter GUI Application for Manufacturing Line Scheduling.
    """

    def __init__(self, root: "tk.Tk"):
        self.root = root
        self.root.title("OptiLine - Production Line Resource Scheduling System")
        self.root.geometry("980x680")
        self.root.minsize(800, 550)

        self.db = DatabaseManager()
        self.db.seed_sample_data(force=False)
        self.sympy_engine = SymPyProductionEngine()

        self._build_ui()
        self.refresh_data()

    def _build_ui(self):
        # Configure styles
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass

        # Top banner
        header_frame = tk.Frame(self.root, bg="#0f172a", height=60)
        header_frame.pack(fill=tk.X)

        title_lbl = tk.Label(
            header_frame,
            text="OptiLine Desktop - Manufacturing Resource Scheduling",
            font=("Helvetica", 14, "bold"),
            fg="#38bdf8",
            bg="#0f172a",
            padx=16,
            pady=12
        )
        title_lbl.pack(side=tk.LEFT)

        subtitle_lbl = tk.Label(
            header_frame,
            text="Python OOP + SQLite + SymPy + Heuristic Dispatch",
            font=("Helvetica", 9),
            fg="#94a3b8",
            bg="#0f172a",
            padx=16
        )
        subtitle_lbl.pack(side=tk.RIGHT)

        # Tabbed navigation
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=8)

        # Tab 1: Dashboard
        self.tab_dashboard = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_dashboard, text=" Dashboard ")
        self._setup_dashboard_tab()

        # Tab 2: Jobs Management
        self.tab_jobs = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_jobs, text=" Jobs Management ")
        self._setup_jobs_tab()

        # Tab 3: Resources / Machines
        self.tab_resources = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_resources, text=" Resources & Machines ")
        self._setup_resources_tab()

        # Tab 4: Schedule Generation & View
        self.tab_schedule = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_schedule, text=" Schedule Engine ")
        self._setup_schedule_tab()

        # Tab 5: Conflict Detection
        self.tab_conflicts = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_conflicts, text=" Conflict Detection ")
        self._setup_conflicts_tab()

    # ==================== TAB 1: DASHBOARD ====================
    def _setup_dashboard_tab(self):
        kpi_frame = tk.Frame(self.tab_dashboard, bg="#f1f5f9", pady=10)
        kpi_frame.pack(fill=tk.X, padx=8, pady=8)

        self.lbl_total_jobs = self._create_kpi_card(kpi_frame, "Total Jobs", "0", "#0284c7")
        self.lbl_scheduled = self._create_kpi_card(kpi_frame, "Scheduled", "0", "#16a34a")
        self.lbl_conflicts = self._create_kpi_card(kpi_frame, "Conflicts", "0", "#dc2626")
        self.lbl_utilization = self._create_kpi_card(kpi_frame, "Fleet Utilization", "0%", "#7c3aed")
        self.lbl_makespan = self._create_kpi_card(kpi_frame, "Makespan", "0.0 hrs", "#d97706")

        btn_bar = tk.Frame(self.tab_dashboard, pady=6)
        btn_bar.pack(fill=tk.X, padx=8)

        ttk.Button(btn_bar, text="▶ Run Scheduling Optimization", command=self.run_scheduler_action).pack(side=tk.LEFT, padx=4)
        ttk.Button(btn_bar, text="⟳ Refresh Dashboard", command=self.refresh_data).pack(side=tk.LEFT, padx=4)
        ttk.Button(btn_bar, text="Reset Sample Data", command=self.reset_sample_data).pack(side=tk.RIGHT, padx=4)

        # Overview Table
        lbl_sub = tk.Label(self.tab_dashboard, text="Current Production Schedules Overview:", font=("Helvetica", 10, "bold"))
        lbl_sub.pack(anchor=tk.W, padx=10, pady=(10, 4))

        self.dash_tree = ttk.Treeview(
            self.tab_dashboard,
            columns=("job", "resource", "start", "end", "duration", "status"),
            show="headings",
            height=12
        )
        for col, w in [("job", 220), ("resource", 180), ("start", 80), ("end", 80), ("duration", 80), ("status", 100)]:
            self.dash_tree.heading(col, text=col.capitalize())
            self.dash_tree.column(col, width=w, anchor=tk.CENTER if col in ("start", "end", "duration") else tk.W)
        self.dash_tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=4)

    def _create_kpi_card(self, parent, title: str, default_val: str, color: str):
        card = tk.Frame(parent, bg="white", relief=tk.SOLID, borderwidth=1, padx=12, pady=8)
        card.pack(side=tk.LEFT, expand=True, fill=tk.BOTH, padx=6)
        tk.Label(card, text=title, font=("Helvetica", 9), fg="#64748b", bg="white").pack()
        val_lbl = tk.Label(card, text=default_val, font=("Helvetica", 16, "bold"), fg=color, bg="white")
        val_lbl.pack()
        return val_lbl

    # ==================== TAB 2: JOBS ====================
    def _setup_jobs_tab(self):
        btn_frame = tk.Frame(self.tab_jobs, pady=6)
        btn_frame.pack(fill=tk.X, padx=8)

        ttk.Button(btn_frame, text="+ Add New Job", command=self.open_add_job_modal).pack(side=tk.LEFT, padx=4)
        ttk.Button(btn_frame, text="Delete Selected Job", command=self.delete_selected_job).pack(side=tk.LEFT, padx=4)
        ttk.Button(btn_frame, text="⟳ Refresh Jobs", command=self.refresh_jobs_list).pack(side=tk.RIGHT, padx=4)

        self.jobs_tree = ttk.Treeview(
            self.tab_jobs,
            columns=("id", "title", "code", "priority", "time", "deadline", "rtype", "batch", "status"),
            show="headings"
        )
        col_widths = {
            "id": 40, "title": 200, "code": 110, "priority": 80,
            "time": 75, "deadline": 75, "rtype": 130, "batch": 75, "status": 90
        }
        for col, w in col_widths.items():
            self.jobs_tree.heading(col, text=col.replace("_", " ").title())
            self.jobs_tree.column(col, width=w, anchor=tk.CENTER if col in ("id", "priority", "time", "deadline", "batch", "status") else tk.W)
        self.jobs_tree.pack(fill=tk.BOTH, expand=True, padx=8, pady=4)

    # ==================== TAB 3: RESOURCES ====================
    def _setup_resources_tab(self):
        lbl = tk.Label(self.tab_resources, text="Available Production Machines & Workstations:", font=("Helvetica", 10, "bold"))
        lbl.pack(anchor=tk.W, padx=10, pady=8)

        self.res_tree = ttk.Treeview(
            self.tab_resources,
            columns=("id", "name", "type", "capacity", "hourly_rate", "cost", "efficiency", "status"),
            show="headings"
        )
        col_widths = {
            "id": 40, "name": 200, "type": 140, "capacity": 80,
            "hourly_rate": 90, "cost": 90, "efficiency": 90, "status": 80
        }
        for col, w in col_widths.items():
            self.res_tree.heading(col, text=col.replace("_", " ").title())
            self.res_tree.column(col, width=w, anchor=tk.CENTER if col in ("id", "capacity", "status") else tk.W)
        self.res_tree.pack(fill=tk.BOTH, expand=True, padx=8, pady=4)

    # ==================== TAB 4: SCHEDULE ENGINE ====================
    def _setup_schedule_tab(self):
        ctrl_frame = tk.Frame(self.tab_schedule, pady=8)
        ctrl_frame.pack(fill=tk.X, padx=8)

        tk.Label(ctrl_frame, text="Dispatch Strategy:").pack(side=tk.LEFT, padx=4)
        self.strategy_var = tk.StringVar(value="priority_first")
        strat_combo = ttk.Combobox(ctrl_frame, textvariable=self.strategy_var, values=["priority_first", "earliest_deadline", "weighted_slack"], state="readonly", width=18)
        strat_combo.pack(side=tk.LEFT, padx=4)

        ttk.Button(ctrl_frame, text="Generate Schedule", command=self.run_scheduler_action).pack(side=tk.LEFT, padx=8)
        ttk.Button(ctrl_frame, text="Clear Schedules", command=self.clear_schedules_action).pack(side=tk.LEFT, padx=4)

        self.sched_tree = ttk.Treeview(
            self.tab_schedule,
            columns=("job", "resource", "start", "end", "dur", "batch", "conflict"),
            show="headings"
        )
        for col, w in [("job", 220), ("resource", 180), ("start", 70), ("end", 70), ("dur", 70), ("batch", 80), ("conflict", 100)]:
            self.sched_tree.heading(col, text=col.capitalize())
            self.sched_tree.column(col, width=w, anchor=tk.CENTER if col in ("start", "end", "dur", "batch", "conflict") else tk.W)
        self.sched_tree.pack(fill=tk.BOTH, expand=True, padx=8, pady=4)

    # ==================== TAB 5: CONFLICTS ====================
    def _setup_conflicts_tab(self):
        btn_frame = tk.Frame(self.tab_conflicts, pady=6)
        btn_frame.pack(fill=tk.X, padx=8)
        ttk.Button(btn_frame, text="Audit Conflicts Now", command=self.refresh_conflicts).pack(side=tk.LEFT, padx=4)

        self.conflict_text = tk.Text(self.tab_conflicts, font=("Courier", 10), bg="#0f172a", fg="#f8fafc", padx=10, pady=10)
        self.conflict_text.pack(fill=tk.BOTH, expand=True, padx=8, pady=4)

    # ==================== DATA SYNC & ACTIONS ====================
    def refresh_data(self):
        jobs = self.db.get_all_jobs()
        resources = self.db.get_all_resources()
        schedules = self.db.get_all_schedules()

        # Update KPIs
        self.lbl_total_jobs.config(text=str(len(jobs)))
        self.lbl_scheduled.config(text=str(len(schedules)))

        detector = ConflictDetector(jobs, resources, schedules)
        conflicts = detector.detect_all_conflicts()
        c_count = conflicts["summary"]["total_conflicts"]
        self.lbl_conflicts.config(text=str(c_count))

        analytics = AnalyticsEngine(jobs, resources, schedules)
        kpis = analytics.compute_summary_kpis()
        self.lbl_utilization.config(text=f"{kpis['fleet_utilization_pct']}%")
        self.lbl_makespan.config(text=f"{kpis['total_makespan_hours']} hrs")

        # Update overview table
        for item in self.dash_tree.get_children():
            self.dash_tree.delete(item)
        for s in schedules:
            self.dash_tree.insert("", tk.END, values=(
                s.get("job_title", f"Job #{s['job_id']}"),
                s.get("resource_name", f"Resource #{s['resource_id']}"),
                f"{s['start_time']}h",
                f"{s['end_time']}h",
                f"{s.get('duration', round(s['end_time'] - s['start_time'], 2))}h",
                "Conflict" if s.get("conflict_flag") else "Normal"
            ))

        self.refresh_jobs_list()
        self.refresh_resources_list()
        self.refresh_schedules_list()
        self.refresh_conflicts()

    def refresh_jobs_list(self):
        jobs = self.db.get_all_jobs()
        for item in self.jobs_tree.get_children():
            self.jobs_tree.delete(item)
        for j in jobs:
            self.jobs_tree.insert("", tk.END, values=(
                j["id"], j["title"], j["product_code"], j["priority"].upper(),
                f"{j['processing_time']}h", f"{j['deadline']}h", j["required_resource_type"],
                j["batch_size"], j["status"].capitalize()
            ))

    def refresh_resources_list(self):
        resources = self.db.get_all_resources()
        for item in self.res_tree.get_children():
            self.res_tree.delete(item)
        for r in resources:
            self.res_tree.insert("", tk.END, values=(
                r["id"], r["name"], r["type"], r["capacity"],
                f"${r['hourly_rate']}/h", f"${r.get('operational_cost', 15.0)}/h",
                f"{int(r.get('efficiency_factor', 0.95) * 100)}%", r["status"].capitalize()
            ))

    def refresh_schedules_list(self):
        schedules = self.db.get_all_schedules()
        for item in self.sched_tree.get_children():
            self.sched_tree.delete(item)
        for s in schedules:
            self.sched_tree.insert("", tk.END, values=(
                s.get("job_title", f"Job #{s['job_id']}"),
                s.get("resource_name", f"Resource #{s['resource_id']}"),
                f"{s['start_time']}h",
                f"{s['end_time']}h",
                f"{s.get('duration', round(s['end_time'] - s['start_time'], 2))}h",
                s.get("scheduled_batch", 100),
                "YES" if s.get("conflict_flag") else "NO"
            ))

    def refresh_conflicts(self):
        jobs = self.db.get_all_jobs()
        resources = self.db.get_all_resources()
        schedules = self.db.get_all_schedules()
        detector = ConflictDetector(jobs, resources, schedules)
        report = detector.detect_all_conflicts()

        self.conflict_text.delete("1.0", tk.END)
        self.conflict_text.insert(tk.END, "=== OPTILINE CONFLICT AUDIT REPORT ===\n\n")
        self.conflict_text.insert(tk.END, f"Total Conflict Issues: {report['summary']['total_conflicts']}\n")
        self.conflict_text.insert(tk.END, f"Deadline Overruns:    {report['summary']['deadline_conflicts_count']}\n")
        self.conflict_text.insert(tk.END, f"Machine Collisions:   {report['summary']['overlap_conflicts_count']}\n")
        self.conflict_text.insert(tk.END, f"Capacity Exceeded:    {report['summary']['capacity_conflicts_count']}\n")
        self.conflict_text.insert(tk.END, f"Unscheduled Jobs:     {report['summary']['unscheduled_jobs_count']}\n\n")

        if report["deadline_conflicts"]:
            self.conflict_text.insert(tk.END, "[!] DEADLINE CONFLICTS:\n")
            for dc in report["deadline_conflicts"]:
                self.conflict_text.insert(tk.END, f"  - Job #{dc['job_id']} '{dc['job_title']}': Completed at {dc['scheduled_end_time']}h, Deadline was {dc['deadline']}h (Delay: +{dc['lateness_hours']}h)\n")

        if report["capacity_conflicts"]:
            self.conflict_text.insert(tk.END, "\n[!] CAPACITY EXCEEDED:\n")
            for cc in report["capacity_conflicts"]:
                self.conflict_text.insert(tk.END, f"  - Job #{cc['job_id']} on {cc['resource_name']}: Batch size {cc['job_batch_size']} exceeds max {cc['machine_capacity']} (Over by {cc['excess_units']})\n")

        if report["unscheduled_jobs"]:
            self.conflict_text.insert(tk.END, "\n[!] UNSCHEDULED JOBS:\n")
            for uj in report["unscheduled_jobs"]:
                self.conflict_text.insert(tk.END, f"  - Job #{uj['job_id']} '{uj['title']}': {uj['diagnosis']}\n")

    def run_scheduler_action(self):
        jobs = self.db.get_all_jobs()
        resources = self.db.get_all_resources()
        strategy = self.strategy_var.get()

        scheduler = Scheduler(jobs, resources)
        res = scheduler.schedule(strategy=strategy)

        self.db.clear_all_schedules()
        self.db.save_schedule_entries(res["entries"])
        self.refresh_data()
        messagebox.showinfo("Scheduler", f"Scheduling complete!\nAssigned: {res['scheduled_count']}\nMakespan: {res['makespan_hours']} hours\nConflicts: {res['conflicts']['summary']['total_conflicts']}")

    def clear_schedules_action(self):
        self.db.clear_all_schedules()
        self.refresh_data()
        messagebox.showinfo("Scheduler", "All schedule records cleared.")

    def reset_sample_data(self):
        if messagebox.askyesno("Reset", "Reset database to default manufacturing sample data?"):
            self.db.seed_sample_data(force=True)
            self.refresh_data()

    def delete_selected_job(self):
        selected = self.jobs_tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Select a job to delete.")
            return
        item = self.jobs_tree.item(selected[0])
        job_id = int(item["values"][0])
        if messagebox.askyesno("Delete", f"Delete Job #{job_id}?"):
            self.db.delete_job(job_id)
            self.refresh_data()

    def open_add_job_modal(self):
        modal = tk.Toplevel(self.root)
        modal.title("Add New Production Job")
        modal.geometry("380x360")
        modal.grab_set()

        fields = [
            ("Title", "Hydraulic Cylinder Rod"),
            ("Product Code", "HYD-ROD-01"),
            ("Priority (urgent/high/medium/low)", "high"),
            ("Processing Time (hours)", "4.0"),
            ("Deadline (hours)", "18.0"),
            ("Resource Type", "CNC Milling"),
            ("Batch Size", "150")
        ]
        entries = {}
        for idx, (label, default) in enumerate(fields):
            tk.Label(modal, text=label).grid(row=idx, column=0, sticky=tk.W, padx=10, pady=4)
            ent = tk.Entry(modal, width=22)
            ent.insert(0, default)
            ent.grid(row=idx, column=1, padx=10, pady=4)
            entries[label] = ent

        def save():
            try:
                self.db.create_job({
                    "title": entries["Title"].get(),
                    "product_code": entries["Product Code"].get(),
                    "priority": entries["Priority (urgent/high/medium/low)"].get(),
                    "processing_time": float(entries["Processing Time (hours)"].get()),
                    "deadline": float(entries["Deadline (hours)"].get()),
                    "required_resource_type": entries["Resource Type"].get(),
                    "batch_size": int(entries["Batch Size"].get())
                })
                modal.destroy()
                self.refresh_data()
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save job: {e}")

        ttk.Button(modal, text="Save Job", command=save).grid(row=len(fields), column=1, pady=16)


def launch_gui():
    if not TKINTER_AVAILABLE:
        print("[OptiLine Desktop] Tkinter library is not installed or available.")
        return

    # Check for X11 / Wayland display
    if not os.environ.get("DISPLAY") and not os.name == "nt":
        print("[OptiLine Desktop] Note: Running in headless Linux environment (no DISPLAY detected).")
        print("To run GUI on local machine with a screen, execute: python3 backend/gui.py")
        return

    root = tk.Tk()
    app = ProductionSchedulingDesktopApp(root)
    root.mainloop()


if __name__ == "__main__":
    launch_gui()
