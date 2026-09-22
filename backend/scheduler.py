"""
Production Line Scheduling Engine.
OOP class: Scheduler
Implements heuristics considering:
- Job Priority (Urgent > High > Medium > Low)
- Processing Time & Machine Efficiency Factor
- Deadline Constraints (Earliest Deadline First / Weighted Slack)
- Machine Availability & Resource Compatibility
- Machine Capacity Constraints
- Generates non-overlapping start/end times and tracks conflicts
"""

from typing import List, Dict, Any, Optional, Tuple
from models import Job, MachineResource, ScheduleEntry
from conflict_detector import ConflictDetector
import functools


class Scheduler:
    """
    Main Scheduling engine that sequences jobs onto compatible machines.
    Supports multiple strategies:
    - 'priority_first': Strict priority ranking, ties broken by deadline
    - 'earliest_deadline': Earliest Deadline First (EDF)
    - 'weighted_slack': Dynamic balance of slack hours (deadline - duration) and priority
    """

    STRATEGIES = ["priority_first", "earliest_deadline", "weighted_slack"]

    def __init__(
        self,
        jobs: List[Dict[str, Any]],
        resources: List[Dict[str, Any]],
        existing_schedules: Optional[List[Dict[str, Any]]] = None
    ):
        # Convert dictionary inputs to rich OOP domain objects
        self.jobs: List[Job] = [Job.from_dict(j) for j in jobs if j.get("status") != "completed"]
        self.machines: List[MachineResource] = [
            MachineResource.from_dict(r) for r in resources
        ]
        self.existing_schedules = existing_schedules or []

    def _sort_jobs(self, strategy: str = "priority_first") -> List[Job]:
        """
        Sorts jobs using functional lambda keys based on selected scheduling strategy.
        Demonstrates functional programming patterns.
        """
        if strategy == "earliest_deadline":
            # Earliest Deadline First (EDF), secondary key is priority score descending
            return sorted(self.jobs, key=lambda j: (j.deadline, -j.priority_score, j.processing_time))
        elif strategy == "weighted_slack":
            # Slack = deadline - processing_time; urgent jobs receive artificial bonus slack deduction
            return sorted(
                self.jobs,
                key=lambda j: (
                    (j.deadline - j.processing_time) - (j.priority_score * 3.0),
                    j.deadline
                )
            )
        else:
            # Default 'priority_first': Priority descending, deadline ascending, processing time ascending
            return sorted(
                self.jobs,
                key=lambda j: (-j.priority_score, j.deadline, j.processing_time)
            )

    def _find_compatible_machines(self, job: Job) -> List[MachineResource]:
        """
        Uses functional filter and lambda to find online, capable machines for this job.
        """
        compatible = list(filter(
            lambda m: m.is_compatible(job),
            self.machines
        ))
        # Prefer machines that satisfy capacity, sorted by efficiency factor descending
        capable = [m for m in compatible if m.capacity >= job.batch_size]
        if capable:
            return sorted(capable, key=lambda m: -m.efficiency_factor)
        # If no single machine meets capacity, return compatible ones (will flag capacity warning)
        return sorted(compatible, key=lambda m: -m.capacity)

    def _get_machine_busy_intervals(self, machine_id: int, current_entries: List[Dict[str, Any]]) -> List[Tuple[float, float]]:
        """
        Returns sorted list of occupied (start_time, end_time) blocks for a machine.
        """
        intervals = []
        # Include pre-existing schedules if any
        for s in self.existing_schedules:
            if int(s["resource_id"]) == machine_id:
                intervals.append((float(s["start_time"]), float(s["end_time"])))
        # Include newly placed entries in this scheduling run
        for e in current_entries:
            if int(e["resource_id"]) == machine_id:
                intervals.append((float(e["start_time"]), float(e["end_time"])))

        return sorted(intervals, key=lambda x: x[0])

    def _find_earliest_slot(
        self,
        machine: MachineResource,
        duration: float,
        current_entries: List[Dict[str, Any]],
        earliest_start: float = 0.0
    ) -> float:
        """
        Finds the earliest available start time on the machine that accommodates the required duration.
        """
        intervals = self._get_machine_busy_intervals(machine.id, current_entries)
        if not intervals:
            return earliest_start

        candidate = earliest_start
        for start, end in intervals:
            if candidate + duration <= start:
                # Found gap before this busy block
                return candidate
            if candidate < end:
                candidate = end

        return candidate

    def schedule(self, strategy: str = "priority_first") -> Dict[str, Any]:
        """
        Executes the scheduling algorithm across all pending jobs.
        Generates start_time, end_time, assigned machine, and flags conflicts.
        """
        sorted_jobs = self._sort_jobs(strategy)
        generated_entries: List[Dict[str, Any]] = []
        unscheduled_reasons: Dict[int, str] = {}

        for job in sorted_jobs:
            compatible_machines = self._find_compatible_machines(job)

            if not compatible_machines:
                unscheduled_reasons[job.id] = (
                    f"No active machine found with compatible type '{job.required_resource_type}'"
                )
                continue

            # Evaluate best machine candidate based on earliest completion time and cost
            best_choice: Optional[Tuple[MachineResource, float, float, bool]] = None
            # best_choice = (machine, start_time, end_time, is_capacity_conflict)

            for machine in compatible_machines:
                # Adjust actual duration by machine's efficiency factor
                effective_duration = round(job.processing_time / machine.efficiency_factor, 2)
                start_time = self._find_earliest_slot(machine, effective_duration, generated_entries)
                end_time = round(start_time + effective_duration, 2)
                has_cap_conflict = job.batch_size > machine.capacity

                if best_choice is None:
                    best_choice = (machine, start_time, end_time, has_cap_conflict)
                else:
                    # Prefer earlier completion time; if within 0.5h, prefer higher efficiency
                    current_best_end = best_choice[2]
                    if end_time < current_best_end - 0.2:
                        best_choice = (machine, start_time, end_time, has_cap_conflict)
                    elif abs(end_time - current_best_end) <= 0.2 and machine.efficiency_factor > best_choice[0].efficiency_factor:
                        best_choice = (machine, start_time, end_time, has_cap_conflict)

            if best_choice:
                chosen_machine, start_t, end_t, cap_conflict = best_choice
                is_deadline_missed = end_t > job.deadline
                conflict_flag = 1 if (is_deadline_missed or cap_conflict) else 0

                status = "scheduled"
                if conflict_flag:
                    status = "conflict"

                entry = {
                    "job_id": job.id,
                    "resource_id": chosen_machine.id,
                    "start_time": start_t,
                    "end_time": end_t,
                    "scheduled_batch": job.batch_size,
                    "status": status,
                    "conflict_flag": conflict_flag,
                    # Extra rich preview info
                    "job_title": job.title,
                    "product_code": job.product_code,
                    "job_priority": job.priority,
                    "job_deadline": job.deadline,
                    "resource_name": chosen_machine.name,
                    "resource_type": chosen_machine.type,
                    "effective_duration": round(end_t - start_t, 2),
                    "deadline_missed": is_deadline_missed,
                    "capacity_exceeded": cap_conflict
                }
                generated_entries.append(entry)

        # Run conflict detector on resulting schedule
        jobs_dicts = [j.to_dict() for j in self.jobs]
        resources_dicts = [m.to_dict() for m in self.machines]
        detector = ConflictDetector(jobs_dicts, resources_dicts, generated_entries)
        conflict_report = detector.detect_all_conflicts()

        # Compute schedule metrics
        total_duration = max([e["end_time"] for e in generated_entries], default=0.0)
        scheduled_count = len(generated_entries)
        unscheduled_count = len(self.jobs) - scheduled_count

        return {
            "strategy": strategy,
            "scheduled_count": scheduled_count,
            "unscheduled_count": unscheduled_count,
            "makespan_hours": total_duration,
            "entries": generated_entries,
            "conflicts": conflict_report,
            "unscheduled_reasons": unscheduled_reasons
        }
