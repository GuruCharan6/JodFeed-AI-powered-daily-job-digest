from app.database import admin


def delete_all_jobs():
    """Delete all jobs older than retention period."""
    try:
        # Delete jobs older than 7 days (or all if you want immediate cleanup)
        admin.table("jobs").delete().lt(
            "created_at", 
            "now() - interval '7 days'"
        ).execute()
        print("Cleanup: old job rows deleted")
    except Exception as e:
        print(f"Cleanup error: {e}")


def delete_all_jobs_immediate():
    """Delete all jobs immediately after emails sent."""
    try:
        admin.table("jobs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Cleanup: all job rows deleted")
    except Exception as e:
        print(f"Cleanup error: {e}")