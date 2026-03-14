# State and Actions Architecture (SOP)

## Layer 2: Next.js Server Actions as Tools
For this local Next.js application, "Tools" (Layer 3) are strictly implemented as Next.js Server Actions. These deterministic functions interact directly with the local SQLite database via Prisma ORM.

### The 24h Stale Logic
- **Rule**: A task is flagged as "stale" `is_stale = true` if the time elapsed since `last_updated_at` exceeds 24 business hours (ignoring weekends).
- **Execution**: The `checkAndMarkStaleTasks()` utility runs dynamically (e.g. on page load of the Dashboard) to evaluate all active tasks.
- If a task is updated, its `last_updated_at` resets and `is_stale` is reverted to `false`.

### Task Log Creation Rule
- **Rule**: Every status update must accurately track the transition and provide an optional note.
- **Execution**: The `updateTaskStatus` Server Action leverages a single Prisma `$transaction`. It simultaneously:
  1. Updates the `Task` record (new status, `last_updated_at = now()`, `is_stale = false`).
  2. Creates a `TaskLog` record documenting `previous_status`, `new_status`, and `note`.
- This ensures atomicity: if the log fails to create, the task status is not updated.
