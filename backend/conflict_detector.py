"""
Conflict Detector Module for Production Line Resource Scheduling System.
OOP class: ConflictDetector
Detects:
- Deadline conflicts (job finishes past committed deadline)
- Machine/resource conflicts (overlapping job intervals on same machine)
- Capacity conflicts (job batch size exceeds machine rated capacity)
- Unscheduled jobs (unscheduled or orphaned jobs with reasons)
"""

from typing import List, Dict, Any


class ConflictDetector:
    """
    Evaluates current and candidate schedules against operational constraints.
    Encapsulates detection heuristics and formats diagnostic conflict reports.
    """

    def __init__(
        self,
        jobs: List[Dict[str, Any]],
        resources: List[Dict[str, Any]],
        schedules: List[Dict[str, Any]]
    ):
        self.jobs_map = {int(j["id"]): j for j in jobs}
        self.resources_map = {int(r["id"]): r for r in resources}
        self.schedules = schedules

    def detect_all_conflicts(self) -> Dict[str, Any]:
        """
        Runs comprehensive validation across all 4 conflict categories.
        Returns detailed diagnostic breakdown and total conflict count.
        """
        deadline_conflicts = self.detect_deadline_conflicts()
        overlap_conflicts = self.detect_machine_overlap_conflicts()
        capacity_conflicts = self.detect_capacity_conflicts()
        unscheduled_jobs = self.detect_unscheduled_jobs()

        total_conflict_items = (
            len(deadline_conflicts) +
            len(overlap_conflicts) +
            len(capacity_conflicts) +
            len(unscheduled_jobs)
        )

        return {
            "summary": {
                "total_conflicts": total_conflict_items,
                "deadline_conflicts_count": len(deadline_conflicts),
                "overlap_conflicts_count": len(overlap_conflicts),
                "capacity_conflicts_count": len(capacity_conflicts),
                "unscheduled_jobs_count": len(unscheduled_jobs),
                "has_critical_blockers": (len(overlap_conflicts) > 0 or len(deadline_conflicts) > 0)
            },
            "deadline_conflicts": deadline_conflicts,
            "overlap_conflicts": overlap_conflicts,
            "capacity_conflicts": capacity_conflicts,
            "unscheduled_jobs": unscheduled_jobs
        }

    def detect_deadline_conflicts(self) -> List[Dict[str, Any]]:
        """
        Flags any scheduled entry where end_time > job.deadline.
        Calculates exact delay in hours.
        """
        conflicts = []
        for s in self.schedules:
            job_id = int(s["job_id"])
            job = self.jobs_map.get(job_id)
            if not job:
                continue

            end_time = float(s["end_time"])
            deadline = float(job["deadline"])

            if end_time > deadline:
                lateness_hours = round(end_time - deadline, 2)
                conflicts.append({
                    "schedule_id": s.get("id"),
                    "job_id": job_id,
                    "job_title": job["title"],
                    "product_code": job["product_code"],
                    "priority": job.get("priority", "medium"),
                    "scheduled_end_time": end_time,
                    "deadline": deadline,
                    "lateness_hours": lateness_hours,
                    "severity": "CRITICAL" if job.get("priority") in ("urgent", "high") else "WARNING",
                    "resolution_suggestion": (
                        f"Expedite by swapping to higher-efficiency machine or reprioritizing before hour {deadline}."
                    )
                })
        return conflicts

    def detect_machine_overlap_conflicts(self) -> List[Dict[str, Any]]:
        """
        Flags temporal collisions where two or more jobs are scheduled simultaneously
        on the exact same resource.
        """
        conflicts = []
        # Group entries by resource_id
        by_resource: Dict[int, List[Dict[str, Any]]] = {}
        for s in self.schedules:
            rid = int(s["resource_id"])
            by_resource.setdefault(rid, []).append(s)

        for rid, entries in by_resource.items():
            res = self.resources_map.get(rid, {"name": f"Resource #{rid}"})
            n = len(entries)
            for i in range(n):
                for j in range(i + 1, n):
                    e1 = entries[i]
                    e2 = entries[j]

                    s1, e_end1 = float(e1["start_time"]), float(e1["end_time"])
                    s2, e_end2 = float(e2["start_time"]), float(e2["end_time"])

                    # Overlap interval condition
                    overlap_start = max(s1, s2)
                    overlap_end = min(e_end1, e_end2)

                    if overlap_start < overlap_end:
                        overlap_dur = round(overlap_end - overlap_start, 2)
                        j1 = self.jobs_map.get(int(e1["job_id"]), {})
                        j2 = self.jobs_map.get(int(e2["job_id"]), {})

                        conflicts.append({
                            "resource_id": rid,
                            "resource_name": res["name"],
                            "entry_1": {
                                "schedule_id": e1.get("id"),
                                "job_id": e1["job_id"],
                                "job_title": j1.get("title", f"Job {e1['job_id']}"),
                                "start_time": s1,
                                "end_time": e_end1
                            },
                            "entry_2": {
                                "schedule_id": e2.get("id"),
                                "job_id": e2["job_id"],
                                "job_title": j2.get("title", f"Job {e2['job_id']}"),
                                "start_time": s2,
                                "end_time": e_end2
                            },
                            "overlap_duration_hours": overlap_dur,
                            "overlap_interval": [overlap_start, overlap_end],
                            "severity": "CRITICAL_COLLISION",
                            "resolution_suggestion": f"Shift start time of Job #{e2['job_id']} to hour {e_end1} or reroute to parallel machine."
                        })
        return conflicts

    def detect_capacity_conflicts(self) -> List[Dict[str, Any]]:
        """
        Flags when a job's batch size exceeds the assigned machine's maximum rated capacity.
        """
        conflicts = []
        for s in self.schedules:
            job_id = int(s["job_id"])
            res_id = int(s["resource_id"])

            job = self.jobs_map.get(job_id)
            res = self.resources_map.get(res_id)
            if not job or not res:
                continue

            batch_size = int(job.get("batch_size", 0))
            capacity = int(res.get("capacity", 0))

            if batch_size > capacity:
                excess_units = batch_size - capacity
                conflicts.append({
                    "schedule_id": s.get("id"),
                    "job_id": job_id,
                    "job_title": job["title"],
                    "resource_id": res_id,
                    "resource_name": res["name"],
                    "job_batch_size": batch_size,
                    "machine_capacity": capacity,
                    "excess_units": excess_units,
                    "severity": "CAPACITY_EXCEEDED",
                    "resolution_suggestion": f"Split batch into {((batch_size + capacity - 1) // capacity)} sub-batches or reassign to higher capacity line."
                })
        return conflicts

    def detect_unscheduled_jobs(self) -> List[Dict[str, Any]]:
        """
        Finds all active jobs that do not have a corresponding schedule entry.
        Diagnoses reasons (e.g. no compatible machine online, capacity too small).
        """
        scheduled_job_ids = set(int(s["job_id"]) for s in self.schedules)
        unscheduled = []

        for j_id, job in self.jobs_map.items():
            if j_id not in scheduled_job_ids and job.get("status") != "completed":
                # Diagnose why it is unscheduled
                rtype = job.get("required_resource_type", "")
                compatible_resources = [
                    r for r in self.resources_map.values()
                    if r.get("type", "").lower() == rtype.lower()
                ]

                reasons = []
                if not compatible_resources:
                    reasons.append(f"No available resources matching required type '{rtype}'.")
                else:
                    active_compatible = [r for r in compatible_resources if r.get("status") == "active"]
                    if not active_compatible:
                        reasons.append(f"All matching {rtype} machines are in maintenance or offline.")
                    else:
                        capable = [r for r in active_compatible if r.get("capacity", 0) >= job.get("batch_size", 0)]
                        if not capable:
                            reasons.append(f"Batch size ({job.get('batch_size')}) exceeds maximum machine capacity ({max(r['capacity'] for r in active_compatible)}).")
                        else:
                            reasons.append("Slot constrained: tight deadline or prior schedule saturation.")

                unscheduled.append({
                    "job_id": j_id,
                    "title": job["title"],
                    "product_code": job["product_code"],
                    "priority": job.get("priority", "medium"),
                    "processing_time": job["processing_time"],
                    "deadline": job["deadline"],
                    "batch_size": job.get("batch_size", 100),
                    "required_resource_type": rtype,
                    "diagnosis": " ".join(reasons) or "Awaiting scheduling optimization run."
                })

        return unscheduled
