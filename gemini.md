# Project Constitution

## Data Schema (Data-First Rule)
```json
{
  "Client": {
    "id": "string (UUID)",
    "name": "string",
    "yearly_goals": "string",
    "logo_url": "string?",
    "card_color": "string? (hex color, default #3b82f6)"
  },
  "Task": {
    "id": "string (UUID)",
    "client_id": "string (UUID, foreign key)",
    "title": "string",
    "notes": "string?",
    "status": "string (Enum: 'Not Started', 'In Progress', 'Blocked', 'Ready for AM Review', 'Done')",
    "last_updated_at": "timestamp",
    "is_stale": "boolean",
    "is_archived": "boolean"
  },
  "TaskLog": {
    "id": "string (UUID)",
    "task_id": "string (UUID, foreign key)",
    "previous_status": "string",
    "new_status": "string",
    "note": "string",
    "timestamp": "timestamp"
  },
  "Comment": {
    "id": "string (UUID)",
    "task_id": "string (UUID, foreign key)",
    "author": "string",
    "content": "string (Markdown)",
    "timestamp": "timestamp"
  }
}
```

## Behavioral Rules
- **No Auth**: Do not build a login screen. Toggle UI switch to view app as "PM" or "AM".
- **Strict UI**: The app must look like a clean, modern SaaS dashboard. Use distinct color-coding for task statuses (e.g., Red for Blocked, Blue for In Progress).
- **The 24h Rule**: A task is considered "stale" if (current_time - last_updated_at) > 24 hours (excluding weekends).

## Architectural Invariants
- 3-Layer Architecture (Architecture, Navigation, Tools)
- Next.js (App Router) local web application
- Tailwind CSS and Lucide React icons
- Local SQLite database as Source of Truth
