"""
Database persistence layer for Production Line Resource Scheduling System using SQLite.
Implements complete CRUD operations for:
- jobs
- resources
- schedules
- production_logs
Demonstrates OOP DatabaseManager class, context management, error handling, and transaction safety.
"""

import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "production_line.db")


class DatabaseError(Exception):
    """Custom exception for database access failures."""
    pass


class DatabaseManager:
    """
    Manages SQLite database connections, schema migrations, and CRUD operations.
    Encapsulates connection lifecycle and row-to-dictionary mapping.
    """

    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Returns connection with row factory configured for dictionary-like access."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Creates tables if they do not already exist."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()

                # 1. Jobs Table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS jobs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        product_code TEXT NOT NULL,
                        priority TEXT NOT NULL,
                        processing_time REAL NOT NULL,
                        deadline REAL NOT NULL,
                        required_resource_type TEXT NOT NULL,
                        batch_size INTEGER NOT NULL DEFAULT 100,
                        status TEXT NOT NULL DEFAULT 'pending',
                        created_at TEXT NOT NULL
                    )
                """)

                # 2. Resources Table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS resources (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        type TEXT NOT NULL,
                        capacity INTEGER NOT NULL DEFAULT 500,
                        hourly_rate REAL NOT NULL DEFAULT 50.0,
                        status TEXT NOT NULL DEFAULT 'active',
                        operational_cost REAL NOT NULL DEFAULT 15.0,
                        efficiency_factor REAL NOT NULL DEFAULT 0.95
                    )
                """)

                # 3. Schedules Table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS schedules (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        job_id INTEGER NOT NULL,
                        resource_id INTEGER NOT NULL,
                        start_time REAL NOT NULL,
                        end_time REAL NOT NULL,
                        scheduled_batch INTEGER NOT NULL DEFAULT 100,
                        status TEXT NOT NULL DEFAULT 'scheduled',
                        conflict_flag INTEGER NOT NULL DEFAULT 0,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
                    )
                """)

                # 4. Production Logs Table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS production_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        message TEXT NOT NULL,
                        details TEXT
                    )
                """)

                conn.commit()
        except sqlite3.Error as e:
            raise DatabaseError(f"Failed to initialize SQLite database: {e}")

    # ==================== PRODUCTION LOGS CRUD ====================

    def log_event(self, event_type: str, message: str, details: Optional[Dict[str, Any]] = None):
        """Appends an event to production_logs."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO production_logs (timestamp, event_type, message, details)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        datetime.now().isoformat(),
                        event_type,
                        message,
                        json.dumps(details) if details else None
                    )
                )
                conn.commit()
        except sqlite3.Error as e:
            # Do not crash the entire app if logging fails
            print(f"[WARN] Failed to write log: {e}")

    def get_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM production_logs ORDER BY id DESC LIMIT ?",
                (limit,)
            )
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    # ==================== JOBS CRUD ====================

    def create_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new Job in the database."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                created_at = job_data.get("created_at") or datetime.now().isoformat()
                cursor.execute(
                    """
                    INSERT INTO jobs (title, product_code, priority, processing_time, deadline, required_resource_type, batch_size, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        job_data["title"],
                        job_data["product_code"],
                        job_data.get("priority", "medium").lower(),
                        float(job_data["processing_time"]),
                        float(job_data["deadline"]),
                        job_data.get("required_resource_type", "CNC Milling"),
                        int(job_data.get("batch_size", 100)),
                        job_data.get("status", "pending"),
                        created_at
                    )
                )
                conn.commit()
                job_id = cursor.lastrowid
                self.log_event("JOB_CREATED", f"Job #{job_id} '{job_data['title']}' created", {"job_id": job_id})
                return self.get_job_by_id(job_id)
        except sqlite3.Error as e:
            raise DatabaseError(f"Error creating job: {e}")

    def get_job_by_id(self, job_id: int) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_all_jobs(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM jobs ORDER BY id ASC")
            return [dict(r) for r in cursor.fetchall()]

    def update_job(self, job_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            fields = []
            values = []
            allowed_fields = [
                "title", "product_code", "priority", "processing_time",
                "deadline", "required_resource_type", "batch_size", "status"
            ]
            for f in allowed_fields:
                if f in updates:
                    fields.append(f"{f} = ?")
                    val = updates[f]
                    if f in ("processing_time", "deadline"):
                        val = float(val)
                    elif f == "batch_size":
                        val = int(val)
                    elif f == "priority":
                        val = str(val).lower()
                    values.append(val)

            if not fields:
                return self.get_job_by_id(job_id)

            values.append(job_id)
            query = f"UPDATE jobs SET {', '.join(fields)} WHERE id = ?"

            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, tuple(values))
                conn.commit()
                self.log_event("JOB_UPDATED", f"Job #{job_id} updated", updates)
                return self.get_job_by_id(job_id)
        except sqlite3.Error as e:
            raise DatabaseError(f"Error updating job {job_id}: {e}")

    def delete_job(self, job_id: int) -> bool:
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM schedules WHERE job_id = ?", (job_id,))
                cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
                conn.commit()
                deleted = cursor.rowcount > 0
                if deleted:
                    self.log_event("JOB_DELETED", f"Job #{job_id} deleted")
                return deleted
        except sqlite3.Error as e:
            raise DatabaseError(f"Error deleting job {job_id}: {e}")

    # ==================== RESOURCES CRUD ====================

    def create_resource(self, res_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO resources (name, type, capacity, hourly_rate, status, operational_cost, efficiency_factor)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        res_data["name"],
                        res_data["type"],
                        int(res_data.get("capacity", 500)),
                        float(res_data.get("hourly_rate", 50.0)),
                        res_data.get("status", "active"),
                        float(res_data.get("operational_cost", 15.0)),
                        float(res_data.get("efficiency_factor", 0.95))
                    )
                )
                conn.commit()
                res_id = cursor.lastrowid
                self.log_event("RESOURCE_CREATED", f"Resource #{res_id} '{res_data['name']}' created")
                return self.get_resource_by_id(res_id)
        except sqlite3.Error as e:
            raise DatabaseError(f"Error creating resource: {e}")

    def get_resource_by_id(self, res_id: int) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM resources WHERE id = ?", (res_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_all_resources(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM resources ORDER BY id ASC")
            return [dict(r) for r in cursor.fetchall()]

    def update_resource(self, res_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            fields = []
            values = []
            allowed = ["name", "type", "capacity", "hourly_rate", "status", "operational_cost", "efficiency_factor"]
            for f in allowed:
                if f in updates:
                    fields.append(f"{f} = ?")
                    val = updates[f]
                    if f in ("hourly_rate", "operational_cost", "efficiency_factor"):
                        val = float(val)
                    elif f == "capacity":
                        val = int(val)
                    values.append(val)

            if not fields:
                return self.get_resource_by_id(res_id)

            values.append(res_id)
            query = f"UPDATE resources SET {', '.join(fields)} WHERE id = ?"
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, tuple(values))
                conn.commit()
                self.log_event("RESOURCE_UPDATED", f"Resource #{res_id} updated", updates)
                return self.get_resource_by_id(res_id)
        except sqlite3.Error as e:
            raise DatabaseError(f"Error updating resource {res_id}: {e}")

    def delete_resource(self, res_id: int) -> bool:
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM schedules WHERE resource_id = ?", (res_id,))
                cursor.execute("DELETE FROM resources WHERE id = ?", (res_id,))
                conn.commit()
                deleted = cursor.rowcount > 0
                if deleted:
                    self.log_event("RESOURCE_DELETED", f"Resource #{res_id} deleted")
                return deleted
        except sqlite3.Error as e:
            raise DatabaseError(f"Error deleting resource {res_id}: {e}")

    # ==================== SCHEDULES CRUD ====================

    def clear_all_schedules(self):
        """Clears all existing schedule entries and resets job scheduled statuses."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM schedules")
            cursor.execute("UPDATE jobs SET status = 'pending' WHERE status != 'completed'")
            conn.commit()
            self.log_event("SCHEDULES_CLEARED", "All schedule entries reset.")

    def save_schedule_entries(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch inserts or replaces schedule entries and updates job status."""
        created = []
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()
                for entry in entries:
                    cursor.execute(
                        """
                        INSERT INTO schedules (job_id, resource_id, start_time, end_time, scheduled_batch, status, conflict_flag, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            int(entry["job_id"]),
                            int(entry["resource_id"]),
                            float(entry["start_time"]),
                            float(entry["end_time"]),
                            int(entry.get("scheduled_batch", 100)),
                            entry.get("status", "scheduled"),
                            int(entry.get("conflict_flag", 0)),
                            now_str
                        )
                    )
                    entry_id = cursor.lastrowid
                    entry_copy = dict(entry)
                    entry_copy["id"] = entry_id
                    created.append(entry_copy)

                    # Update associated job status
                    j_status = "conflict" if entry.get("conflict_flag") else "scheduled"
                    cursor.execute("UPDATE jobs SET status = ? WHERE id = ?", (j_status, int(entry["job_id"])))

                conn.commit()
                self.log_event("SCHEDULES_SAVED", f"Persisted {len(created)} scheduled slots.")
                return created
        except sqlite3.Error as e:
            raise DatabaseError(f"Error saving schedule entries: {e}")

    def get_all_schedules(self) -> List[Dict[str, Any]]:
        """Returns all schedule entries joined with job and resource metadata."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    s.id,
                    s.job_id,
                    s.resource_id,
                    s.start_time,
                    s.end_time,
                    ROUND(s.end_time - s.start_time, 2) as duration,
                    s.scheduled_batch,
                    s.status,
                    s.conflict_flag,
                    s.created_at,
                    j.title as job_title,
                    j.product_code,
                    j.priority as job_priority,
                    j.deadline as job_deadline,
                    r.name as resource_name,
                    r.type as resource_type,
                    r.hourly_rate as resource_hourly_rate
                FROM schedules s
                JOIN jobs j ON s.job_id = j.id
                JOIN resources r ON s.resource_id = r.id
                ORDER BY s.start_time ASC, s.resource_id ASC
            """)
            return [dict(r) for r in cursor.fetchall()]

    # ==================== SAMPLE SEED DATA ====================

    def seed_sample_data(self, force: bool = False):
        """Populates realistic manufacturing production line data."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM jobs")
            count = cursor.fetchone()["cnt"]
            if count > 0 and not force:
                return  # already seeded

        if force:
            self.clear_all_schedules()
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM jobs")
                cursor.execute("DELETE FROM resources")
                cursor.execute("DELETE FROM production_logs")
                conn.commit()

        # Seed realistic manufacturing resources/machines
        sample_resources = [
            {"name": "CNC Mill Haas VF-4", "type": "CNC Milling", "capacity": 300, "hourly_rate": 85.0, "status": "active", "operational_cost": 22.0, "efficiency_factor": 0.98},
            {"name": "CNC Mill Mazak 5-Axis", "type": "CNC Milling", "capacity": 250, "hourly_rate": 110.0, "status": "active", "operational_cost": 28.0, "efficiency_factor": 0.95},
            {"name": "Trumpf Fiber Laser 4kW", "type": "Laser Cutting", "capacity": 600, "hourly_rate": 75.0, "status": "active", "operational_cost": 18.0, "efficiency_factor": 0.97},
            {"name": "Bystronic Laser 6kW", "type": "Laser Cutting", "capacity": 750, "hourly_rate": 90.0, "status": "active", "operational_cost": 24.0, "efficiency_factor": 0.96},
            {"name": "Engel 250T Injection Press", "type": "Injection Molding", "capacity": 1500, "hourly_rate": 60.0, "status": "active", "operational_cost": 14.0, "efficiency_factor": 0.92},
            {"name": "Robotic SMT Assembly Cell", "type": "Automated Assembly", "capacity": 2000, "hourly_rate": 95.0, "status": "active", "operational_cost": 20.0, "efficiency_factor": 0.99},
            {"name": "Zeiss CMM Metrology Lab", "type": "Quality Inspection", "capacity": 400, "hourly_rate": 70.0, "status": "active", "operational_cost": 12.0, "efficiency_factor": 0.94}
        ]

        for r in sample_resources:
            self.create_resource(r)

        # Seed diverse production jobs with realistic batch sizes, deadlines, and priorities
        sample_jobs = [
            {"title": "Aerospace Turbine Bracket", "product_code": "AERO-BRK-01", "priority": "urgent", "processing_time": 4.5, "deadline": 10.0, "required_resource_type": "CNC Milling", "batch_size": 120},
            {"title": "Titanium Flange Housing", "product_code": "TITAN-FLG-88", "priority": "high", "processing_time": 6.0, "deadline": 16.0, "required_resource_type": "CNC Milling", "batch_size": 180},
            {"title": "Medical Implant Chassis", "product_code": "MED-IMP-09", "priority": "urgent", "processing_time": 3.0, "deadline": 7.0, "required_resource_type": "CNC Milling", "batch_size": 90},
            {"title": "Automotive Sheet Chassis Frame", "product_code": "AUTO-FRM-42", "priority": "high", "processing_time": 5.0, "deadline": 14.0, "required_resource_type": "Laser Cutting", "batch_size": 500},
            {"title": "Solar Panel Mounting Bracket", "product_code": "SOL-BKT-12", "priority": "medium", "processing_time": 3.5, "deadline": 24.0, "required_resource_type": "Laser Cutting", "batch_size": 450},
            {"title": "HVAC Duct Baffle Plates", "product_code": "HVAC-BFL-05", "priority": "low", "processing_time": 4.0, "deadline": 36.0, "required_resource_type": "Laser Cutting", "batch_size": 700},
            {"title": "Polymer Enclosure Casing", "product_code": "POLY-ENC-31", "priority": "high", "processing_time": 7.0, "deadline": 20.0, "required_resource_type": "Injection Molding", "batch_size": 1200},
            {"title": "Sensor Housing Gasket Mold", "product_code": "SENS-GSK-11", "priority": "medium", "processing_time": 5.5, "deadline": 30.0, "required_resource_type": "Injection Molding", "batch_size": 800},
            {"title": "ECU PCB Control Board Surface Mount", "product_code": "ECU-PCB-07", "priority": "urgent", "processing_time": 4.0, "deadline": 12.0, "required_resource_type": "Automated Assembly", "batch_size": 1500},
            {"title": "Battery Management Unit Harness", "product_code": "BMU-HAR-90", "priority": "medium", "processing_time": 6.5, "deadline": 28.0, "required_resource_type": "Automated Assembly", "batch_size": 1100},
            {"title": "Critical CMM Dimensional Audit", "product_code": "QA-AUD-01", "priority": "high", "processing_time": 2.5, "deadline": 15.0, "required_resource_type": "Quality Inspection", "batch_size": 250},
            {"title": "Batch Tensile & Micro-Crack Scan", "product_code": "QA-TNS-04", "priority": "low", "processing_time": 3.5, "deadline": 48.0, "required_resource_type": "Quality Inspection", "batch_size": 300},
            # Edge-case job: capacity overshoot to demonstrate conflict detection
            {"title": "Heavy Crane Hydraulic Manifold (Oversized)", "product_code": "HYD-MNF-99", "priority": "high", "processing_time": 8.0, "deadline": 14.0, "required_resource_type": "CNC Milling", "batch_size": 950}
        ]

        for j in sample_jobs:
            self.create_job(j)

        self.log_event("SYSTEM_INIT", "Database seeded with 7 machines and 13 production jobs.")
