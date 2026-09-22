"""
Analytics and Reporting Engine for Production Line Scheduling.
OOP class: AnalyticsEngine
Uses:
- Pandas for dataframes, aggregations, group-by operations, and summary statistics
- Matplotlib for generating static analytical chart visualizations (base64 image export)
- Structured KPIs for real-time web dashboard consumption
"""

from typing import List, Dict, Any, Optional
import io
import base64

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except Exception:
    PANDAS_AVAILABLE = False

try:
    import matplotlib
    matplotlib.use("Agg")  # Headless backend for web & server usage
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except Exception:
    MATPLOTLIB_AVAILABLE = False


class AnalyticsEngine:
    """
    Computes production metrics, fleet utilization, bottleneck points,
    and visual analytics using Pandas and Matplotlib.
    """

    def __init__(
        self,
        jobs: List[Dict[str, Any]],
        resources: List[Dict[str, Any]],
        schedules: List[Dict[str, Any]]
    ):
        self.jobs = jobs
        self.resources = resources
        self.schedules = schedules

    def compute_summary_kpis(self) -> Dict[str, Any]:
        """
        Calculates high-level manufacturing KPIs using Pandas DataFrame operations.
        """
        total_jobs = len(self.jobs)
        scheduled_jobs_count = len(self.schedules)
        unscheduled_jobs_count = max(0, total_jobs - scheduled_jobs_count)

        if not self.schedules:
            return {
                "total_jobs": total_jobs,
                "scheduled_jobs": 0,
                "unscheduled_jobs": total_jobs,
                "total_makespan_hours": 0.0,
                "fleet_utilization_pct": 0.0,
                "total_production_units": 0,
                "total_estimated_cost": 0.0,
                "on_time_rate_pct": 100.0,
                "active_machines_count": len([r for r in self.resources if r.get("status") == "active"]),
                "machine_breakdown": [],
                "priority_breakdown": {}
            }

        if PANDAS_AVAILABLE:
            df_schedules = pd.DataFrame(self.schedules)
            df_resources = pd.DataFrame(self.resources)
            df_jobs = pd.DataFrame(self.jobs)

            makespan = float(df_schedules["end_time"].max()) if not df_schedules.empty else 0.0
            total_runtime = float(df_schedules["duration"].sum()) if "duration" in df_schedules.columns else 0.0
            total_units = int(df_schedules["scheduled_batch"].sum()) if "scheduled_batch" in df_schedules.columns else 0

            # Merge schedules with resources to calculate actual operational costs
            cost = 0.0
            if not df_schedules.empty and not df_resources.empty:
                merged = df_schedules.merge(df_resources, left_on="resource_id", right_on="id", suffixes=("", "_res"))
                if "duration" in merged.columns and "hourly_rate" in merged.columns:
                    # Cost = duration * hourly_rate + duration * operational_cost
                    merged["total_cost"] = merged["duration"] * (merged["hourly_rate"] + merged.get("operational_cost", 15.0))
                    cost = float(merged["total_cost"].sum())

            # Machine utilization calculation
            total_available_capacity_hours = makespan * len(self.resources) if makespan > 0 else 1.0
            fleet_utilization = (total_runtime / max(1.0, total_available_capacity_hours)) * 100.0

            # On-time delivery rate
            conflict_count = int((df_schedules["conflict_flag"] > 0).sum()) if "conflict_flag" in df_schedules.columns else 0
            on_time_rate = max(0.0, 100.0 - ((conflict_count / max(1, scheduled_jobs_count)) * 100.0))

            # Utilization breakdown per resource
            machine_breakdown = []
            res_grp = df_schedules.groupby("resource_id") if not df_schedules.empty else None
            for r in self.resources:
                r_id = r["id"]
                r_hours = float(df_schedules[df_schedules["resource_id"] == r_id]["duration"].sum()) if not df_schedules.empty else 0.0
                util_pct = (r_hours / max(0.1, makespan)) * 100.0 if makespan > 0 else 0.0
                machine_breakdown.append({
                    "resource_id": r_id,
                    "resource_name": r["name"],
                    "resource_type": r["type"],
                    "total_busy_hours": round(r_hours, 2),
                    "utilization_pct": round(min(100.0, util_pct), 1),
                    "status": r.get("status", "active")
                })

            # Priority counts
            priority_counts = df_jobs["priority"].value_counts().to_dict() if not df_jobs.empty else {}

        else:
            # Native Python fallback if Pandas is initializing
            makespan = max([s["end_time"] for s in self.schedules], default=0.0)
            total_runtime = sum([s.get("duration", s["end_time"] - s["start_time"]) for s in self.schedules])
            total_units = sum([s.get("scheduled_batch", 100) for s in self.schedules])
            cost = total_runtime * 75.0
            fleet_utilization = (total_runtime / max(1.0, makespan * len(self.resources))) * 100.0 if makespan > 0 else 0.0
            conflicts = sum(1 for s in self.schedules if s.get("conflict_flag", 0) > 0)
            on_time_rate = max(0.0, 100.0 - ((conflicts / max(1, scheduled_jobs_count)) * 100.0))

            machine_breakdown = []
            for r in self.resources:
                r_id = r["id"]
                r_hours = sum([s.get("duration", s["end_time"] - s["start_time"]) for s in self.schedules if s["resource_id"] == r_id])
                util = (r_hours / max(0.1, makespan)) * 100.0 if makespan > 0 else 0.0
                machine_breakdown.append({
                    "resource_id": r_id,
                    "resource_name": r["name"],
                    "resource_type": r["type"],
                    "total_busy_hours": round(r_hours, 2),
                    "utilization_pct": round(min(100.0, util), 1),
                    "status": r.get("status", "active")
                })
            priority_counts = {}
            for j in self.jobs:
                p = j.get("priority", "medium")
                priority_counts[p] = priority_counts.get(p, 0) + 1

        return {
            "total_jobs": total_jobs,
            "scheduled_jobs": scheduled_jobs_count,
            "unscheduled_jobs": unscheduled_jobs_count,
            "total_makespan_hours": round(makespan, 2),
            "fleet_utilization_pct": round(min(100.0, fleet_utilization), 1),
            "total_production_units": total_units,
            "total_estimated_cost": round(cost, 2),
            "on_time_rate_pct": round(on_time_rate, 1),
            "active_machines_count": len([r for r in self.resources if r.get("status") == "active"]),
            "machine_breakdown": machine_breakdown,
            "priority_breakdown": priority_counts
        }

    def generate_matplotlib_chart(self) -> Optional[str]:
        """
        Renders a Matplotlib multi-axis figure with machine utilization and schedule load.
        Returns a base64 encoded PNG string for direct display in the web UI.
        """
        if not MATPLOTLIB_AVAILABLE or not self.schedules or not self.resources:
            return None

        try:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.2), dpi=100)
            fig.patch.set_facecolor("#0f172a")

            # Chart 1: Machine busy hours bar chart
            machine_names = [r["name"].split()[0] + " " + r["type"][:8] for r in self.resources]
            busy_hours = []
            for r in self.resources:
                r_id = r["id"]
                hrs = sum([s.get("duration", s["end_time"] - s["start_time"]) for s in self.schedules if s["resource_id"] == r_id])
                busy_hours.append(hrs)

            colors = ["#38bdf8", "#818cf8", "#34d399", "#f472b6", "#fbbf24", "#a78bfa", "#2dd4bf"]
            bars = ax1.barh(machine_names, busy_hours, color=colors[:len(machine_names)], height=0.6)
            ax1.set_title("Machine Busy Hours", color="#f8fafc", fontsize=12, fontweight="bold", pad=12)
            ax1.set_xlabel("Hours Allocated", color="#94a3b8", fontsize=10)
            ax1.set_facecolor("#1e293b")
            ax1.tick_params(colors="#cbd5e1", labelsize=9)
            for spine in ax1.spines.values():
                spine.set_color("#334155")
            ax1.grid(axis="x", color="#334155", linestyle="--", alpha=0.5)

            # Chart 2: Priority composition pie chart
            priorities = {}
            for j in self.jobs:
                p = j.get("priority", "medium").capitalize()
                priorities[p] = priorities.get(p, 0) + 1

            p_labels = list(priorities.keys())
            p_values = list(priorities.values())
            pie_colors = {"Urgent": "#ef4444", "High": "#f97316", "Medium": "#3b82f6", "Low": "#10b981"}
            colors_list = [pie_colors.get(k, "#64748b") for k in p_labels]

            wedges, texts, autotexts = ax2.pie(
                p_values,
                labels=p_labels,
                autopct="%1.0f%%",
                startangle=140,
                colors=colors_list,
                textprops=dict(color="#f8fafc", fontsize=9),
                wedgeprops=dict(width=0.45, edgecolor="#0f172a")
            )
            for at in autotexts:
                at.set_color("#ffffff")
                at.set_fontweight("bold")
            ax2.set_title("Job Priority Distribution", color="#f8fafc", fontsize=12, fontweight="bold", pad=12)
            ax2.set_facecolor("#1e293b")

            plt.tight_layout()
            buf = io.BytesIO()
            plt.savefig(buf, format="png", bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor="none")
            plt.close(fig)
            buf.seek(0)
            return "data:image/png;base64," + base64.b64encode(buf.read()).decode("utf-8")

        except Exception as e:
            print(f"[WARN] Failed to render Matplotlib chart: {e}")
            return None
