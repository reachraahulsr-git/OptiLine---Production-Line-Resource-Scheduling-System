"""
Domain models for Production Line Resource Scheduling System.
Demonstrates Object-Oriented Programming (OOP):
- Classes, objects, constructors (__init__)
- Encapsulation (properties, validation, private attributes)
- Inheritance (MachineResource inherits from ProductionResource)
- Method overriding (calculate_cost, status representations)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


class ModelValidationError(Exception):
    """Raised when domain model constraints or validations are violated."""
    pass


class Job:
    """
    Represents a manufacturing production job or order.
    Encapsulates job constraints like processing time, deadline, priority, and required resource.
    """

    PRIORITY_LEVELS = {"low": 1, "medium": 2, "high": 3, "urgent": 4}

    def __init__(
        self,
        id: int,
        title: str,
        product_code: str,
        priority: str,
        processing_time: float,
        deadline: float,
        required_resource_type: str,
        batch_size: int = 100,
        status: str = "pending",
        created_at: Optional[str] = None
    ):
        self.id = int(id)
        self.title = str(title).strip()
        self.product_code = str(product_code).strip().upper()
        self._priority = "medium"
        self._processing_time = 1.0
        self._deadline = 24.0
        self._status = "pending"
        self.batch_size = max(1, int(batch_size))
        self.required_resource_type = str(required_resource_type).strip()
        self.created_at = created_at or datetime.now().isoformat()

        # Apply properties with encapsulation validation
        self.priority = priority
        self.processing_time = processing_time
        self.deadline = deadline
        self.status = status

    @property
    def priority(self) -> str:
        return self._priority

    @priority.setter
    def priority(self, value: str):
        normalized = str(value).lower().strip()
        if normalized not in self.PRIORITY_LEVELS:
            raise ModelValidationError(f"Invalid priority '{value}'. Must be one of {list(self.PRIORITY_LEVELS.keys())}")
        self._priority = normalized

    @property
    def priority_score(self) -> int:
        """Returns integer weight for priority comparisons."""
        return self.PRIORITY_LEVELS.get(self._priority, 1)

    @property
    def processing_time(self) -> float:
        return self._processing_time

    @processing_time.setter
    def processing_time(self, value: float):
        try:
            val = float(value)
            if val <= 0:
                raise ValueError()
            self._processing_time = round(val, 2)
        except (ValueError, TypeError):
            raise ModelValidationError("processing_time must be a positive float number of hours.")

    @property
    def deadline(self) -> float:
        return self._deadline

    @deadline.setter
    def deadline(self, value: float):
        try:
            val = float(value)
            if val < 0:
                raise ValueError()
            self._deadline = round(val, 2)
        except (ValueError, TypeError):
            raise ModelValidationError("deadline must be a non-negative float hour timestamp from schedule start.")

    @property
    def status(self) -> str:
        return self._status

    @status.setter
    def status(self, value: str):
        allowed = {"pending", "scheduled", "in_progress", "completed", "delayed", "conflict"}
        normalized = str(value).lower().strip()
        if normalized not in allowed:
            raise ModelValidationError(f"Invalid status '{value}'. Allowed: {allowed}")
        self._status = normalized

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "product_code": self.product_code,
            "priority": self.priority,
            "priority_score": self.priority_score,
            "processing_time": self.processing_time,
            "deadline": self.deadline,
            "required_resource_type": self.required_resource_type,
            "batch_size": self.batch_size,
            "status": self.status,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Job":
        return cls(
            id=data.get("id", 0),
            title=data.get("title", ""),
            product_code=data.get("product_code", ""),
            priority=data.get("priority", "medium"),
            processing_time=data.get("processing_time", 2.0),
            deadline=data.get("deadline", 24.0),
            required_resource_type=data.get("required_resource_type", "General"),
            batch_size=data.get("batch_size", 100),
            status=data.get("status", "pending"),
            created_at=data.get("created_at")
        )

    def __repr__(self) -> str:
        return f"<Job id={self.id} title='{self.title}' priority={self.priority} dur={self.processing_time}h>"


class ProductionResource:
    """
    Base class representing any production line resource (labor, station, machine, fixture).
    Demonstrates base encapsulation and extensible methods.
    """

    def __init__(
        self,
        id: int,
        name: str,
        type: str,
        capacity: int = 500,
        hourly_rate: float = 45.0,
        status: str = "active"
    ):
        self.id = int(id)
        self.name = str(name).strip()
        self.type = str(type).strip()
        self._capacity = max(1, int(capacity))
        self._hourly_rate = max(0.0, float(hourly_rate))
        self._status = "active"
        self.status = status

    @property
    def capacity(self) -> int:
        return self._capacity

    @capacity.setter
    def capacity(self, value: int):
        if int(value) <= 0:
            raise ModelValidationError("Resource capacity must be greater than zero.")
        self._capacity = int(value)

    @property
    def hourly_rate(self) -> float:
        return self._hourly_rate

    @hourly_rate.setter
    def hourly_rate(self, value: float):
        if float(value) < 0:
            raise ModelValidationError("Hourly rate cannot be negative.")
        self._hourly_rate = round(float(value), 2)

    @property
    def status(self) -> str:
        return self._status

    @status.setter
    def status(self, value: str):
        allowed = {"active", "maintenance", "idle", "offline"}
        normalized = str(value).lower().strip()
        if normalized not in allowed:
            raise ModelValidationError(f"Invalid resource status: '{value}'. Allowed: {allowed}")
        self._status = normalized

    def is_available(self) -> bool:
        """Returns whether resource is currently operational."""
        return self.status in ("active", "idle")

    def calculate_cost(self, hours: float) -> float:
        """
        Base calculation of operational cost for running this resource.
        Subclasses can override this with specialized formulas.
        """
        return round(float(hours) * self.hourly_rate, 2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "capacity": self.capacity,
            "hourly_rate": self.hourly_rate,
            "status": self.status,
            "is_available": self.is_available()
        }


class MachineResource(ProductionResource):
    """
    Subclass demonstrating Inheritance and Method Overriding.
    Adds specialized machine traits such as efficiency factor, tooling setup time,
    and specialized maintenance cost calculations.
    """

    def __init__(
        self,
        id: int,
        name: str,
        type: str,
        capacity: int = 500,
        hourly_rate: float = 65.0,
        status: str = "active",
        operational_cost: float = 15.0,
        efficiency_factor: float = 0.95
    ):
        # Explicit call to superclass constructor
        super().__init__(id=id, name=name, type=type, capacity=capacity, hourly_rate=hourly_rate, status=status)
        self.operational_cost = max(0.0, float(operational_cost))
        self._efficiency_factor = min(1.5, max(0.1, float(efficiency_factor)))

    @property
    def efficiency_factor(self) -> float:
        return self._efficiency_factor

    @efficiency_factor.setter
    def efficiency_factor(self, value: float):
        val = float(value)
        if val <= 0 or val > 2.0:
            raise ModelValidationError("Efficiency factor must be between 0.1 and 2.0")
        self._efficiency_factor = round(val, 3)

    # Method Overriding: Specialized machine cost calculation including operational fixed overhead & efficiency
    def calculate_cost(self, hours: float) -> float:
        """
        Overridden method: Machine running cost includes:
        - Adjusted operator / tool wear rate via efficiency factor
        - Operational fixed power/coolant overhead
        """
        base_rate = super().calculate_cost(hours)
        adjusted_base = base_rate / self.efficiency_factor
        overhead = float(hours) * self.operational_cost
        return round(adjusted_base + overhead, 2)

    def is_compatible(self, job: Job) -> bool:
        """Determines if this machine satisfies job requirements."""
        if not self.is_available():
            return False
        # Type match check
        if self.type.lower() != job.required_resource_type.lower() and job.required_resource_type.lower() != "any":
            return False
        return True

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data.update({
            "operational_cost": self.operational_cost,
            "efficiency_factor": self.efficiency_factor,
            "effective_hourly_cost": self.calculate_cost(1.0)
        })
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MachineResource":
        return cls(
            id=data.get("id", 0),
            name=data.get("name", "Machine"),
            type=data.get("type", "CNC Milling"),
            capacity=data.get("capacity", 500),
            hourly_rate=data.get("hourly_rate", 65.0),
            status=data.get("status", "active"),
            operational_cost=data.get("operational_cost", 15.0),
            efficiency_factor=data.get("efficiency_factor", 0.95)
        )

    def __repr__(self) -> str:
        return f"<MachineResource id={self.id} name='{self.name}' type='{self.type}' eff={self.efficiency_factor}>"


class ScheduleEntry:
    """
    Represents an assigned block of time for a job on a specific machine.
    """

    def __init__(
        self,
        id: int,
        job_id: int,
        resource_id: int,
        start_time: float,
        end_time: float,
        scheduled_batch: int = 100,
        status: str = "confirmed",
        conflict_flag: int = 0,
        created_at: Optional[str] = None
    ):
        self.id = int(id)
        self.job_id = int(job_id)
        self.resource_id = int(resource_id)
        self.start_time = round(float(start_time), 2)
        self.end_time = round(float(end_time), 2)
        self.scheduled_batch = int(scheduled_batch)
        self.status = str(status)
        self.conflict_flag = int(conflict_flag)
        self.created_at = created_at or datetime.now().isoformat()

    @property
    def duration(self) -> float:
        return round(self.end_time - self.start_time, 2)

    def overlaps_with(self, other: "ScheduleEntry") -> bool:
        """Determines if two entries on the same resource have overlapping time bounds."""
        if self.resource_id != other.resource_id or self.id == other.id:
            return False
        # Overlap condition: max(start1, start2) < min(end1, end2)
        return max(self.start_time, other.start_time) < min(self.end_time, other.end_time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "job_id": self.job_id,
            "resource_id": self.resource_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.duration,
            "scheduled_batch": self.scheduled_batch,
            "status": self.status,
            "conflict_flag": self.conflict_flag,
            "created_at": self.created_at
        }
