"""Render Workflow tasks for idempotent PayPilot review follow-ups."""

from render import Retry, TaskContext, Workflows

app = Workflows(default_retry=Retry(max_retries=3, wait_duration_ms=1500, backoff_scaling=2.0), default_timeout=90)


@app.task(name="recovery_review", timeout_seconds=90)
def recovery_review(ctx: TaskContext, workspace_id: str, case_id: str, requested_by: str, idempotency_key: str) -> dict:
    """Create a durable, auditable review task record without financial execution."""
    # Render retains the task run and result; the caller supplies a stable idempotency key.
    return {
        "status": "ready_for_review",
        "workspace_id": workspace_id,
        "case_id": case_id,
        "requested_by": requested_by,
        "idempotency_key": idempotency_key,
        "financial_action_executed": False,
        "render_run_id": getattr(ctx, "run_id", None),
    }
