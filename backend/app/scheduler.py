import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

from app.services.placement_drive_service import sync_all_sources

logger = logging.getLogger(__name__)

_scheduler = BackgroundScheduler()


def _run_sync_job():
    try:
        summary = sync_all_sources()
        logger.info("Placement drives sync complete: %s", summary)
    except Exception:
        # The scheduler must survive a bad run - an uncaught exception
        # here would silently kill all future scheduled runs too.
        logger.exception("Placement drives sync failed")


def start_scheduler():
    """
    Registers the Placement Drives sync job (job_sources -> upsert ->
    expire, see placement_drive_service.sync_all_sources) to run every
    24 hours, and starts the scheduler. Called once from main.py's
    lifespan handler on app startup.

    next_run_time=datetime.now() makes the first run fire immediately
    on startup rather than 24 hours from now - otherwise the feed
    would stay empty for up to a full day after every fresh deploy.
    Every run after that follows the normal 24-hour interval from
    whenever this first run happened.
    """
    if _scheduler.running:
        return

    _scheduler.add_job(
        _run_sync_job,
        trigger="interval",
        hours=24,
        id="placement_drives_sync",
        next_run_time=datetime.now(),
        replace_existing=True,
    )

    _scheduler.start()


def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)