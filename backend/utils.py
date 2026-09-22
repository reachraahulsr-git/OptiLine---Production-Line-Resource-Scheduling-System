"""
Functional Programming Utilities for Production Line Resource Scheduling System.
Demonstrates:
- lambda functions
- map() and filter() usage
- list and dictionary comprehensions
- reusable higher-order functions (compose, partition, time_profiler, memoize)
"""

from typing import Callable, Iterable, List, Dict, Any, Tuple, TypeVar
import functools
import time

T = TypeVar("T")
U = TypeVar("U")


# 1. Reusable Higher-Order Functions
def compose(*functions: Callable[[Any], Any]) -> Callable[[Any], Any]:
    """
    Higher-order function that composes multiple single-argument functions from right to left.
    compose(f, g, h)(x) == f(g(h(x)))
    """
    return functools.reduce(lambda f, g: lambda x: f(g(x)), functions, lambda x: x)


def partition(predicate: Callable[[T], bool], iterable: Iterable[T]) -> Tuple[List[T], List[T]]:
    """
    Higher-order function that splits an iterable into two lists based on a boolean predicate:
    (matches, non_matches)
    """
    matches = []
    non_matches = []
    for item in iterable:
        if predicate(item):
            matches.append(item)
        else:
            non_matches.append(item)
    return matches, non_matches


def pipeline_processor(data: Any, *steps: Callable[[Any], Any]) -> Any:
    """Passes data sequentially through an arbitrary series of transform functions."""
    result = data
    for step in steps:
        result = step(result)
    return result


def timed_execution(func: Callable) -> Callable:
    """Higher-order decorator to profile functional execution time."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        res = func(*args, **kwargs)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        if isinstance(res, dict):
            res["_benchmark_ms"] = round(elapsed_ms, 3)
        return res
    return wrapper


# 2. Functional Data Transformation helpers using map, filter, lambda, and comprehensions

def filter_by_priority(jobs: List[Dict[str, Any]], priority_level: str) -> List[Dict[str, Any]]:
    """Uses filter() and lambda to filter jobs by given priority."""
    return list(filter(lambda j: j.get("priority", "").lower() == priority_level.lower(), jobs))


def extract_urgent_job_ids(jobs: List[Dict[str, Any]]) -> List[int]:
    """Uses list comprehension with conditional logic to extract urgent jobs."""
    return [int(j["id"]) for j in jobs if j.get("priority") == "urgent"]


def map_jobs_to_lead_times(jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Uses map() and lambda to compute lead times and slack hours."""
    return list(map(
        lambda j: {
            "id": j["id"],
            "title": j["title"],
            "processing_time": j["processing_time"],
            "deadline": j["deadline"],
            "slack_hours": round(float(j["deadline"]) - float(j["processing_time"]), 2),
            "urgency_ratio": round(float(j["processing_time"]) / max(0.1, float(j["deadline"])), 3)
        },
        jobs
    ))


def index_resources_by_id(resources: List[Dict[str, Any]]) -> Dict[int, Dict[str, Any]]:
    """Uses dictionary comprehension to construct rapid O(1) lookup map."""
    return {int(r["id"]): r for r in resources}


def group_jobs_by_resource_type(jobs: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Uses dictionary comprehension and filtering to partition jobs by machine requirement."""
    distinct_types = set(j.get("required_resource_type", "General") for j in jobs)
    return {
        rtype: list(filter(lambda j: j.get("required_resource_type") == rtype, jobs))
        for rtype in distinct_types
    }


def compute_priority_weight_sorter(weight_overdue: float = 2.0) -> Callable[[Dict[str, Any]], float]:
    """
    Higher-order function returning a custom lambda sorting key based on configurable penalty weights.
    """
    priority_scores = {"urgent": 100, "high": 50, "medium": 20, "low": 10}
    return lambda j: (
        -priority_scores.get(j.get("priority", "medium"), 10),
        j.get("deadline", 999.0) + (j.get("processing_time", 1.0) * weight_overdue)
    )
