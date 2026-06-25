# Encora Badge Migration & Integration Guide

This guide explains how the `custom-badges` plugin integrates with your existing Encora badge database structure on your production server. It ensures that:
1. Existing Encora badges populated in the production database continue to work.
2. User profile badges are not broken or lost.
3. You can safely merge the plugin system without database migration conflicts.

---

## How It Works Under the Hood

The `custom-badges` plugin is designed to be backwards-compatible with your existing `add-encora-router` database schema:

1. **Database Fallback Check**: The API route handler `GET /api/v1/custom/badges/:userId` queries the native `userService.getUserById(userId)` from the Hono service container.
2. **Field Extraction**: If the user record contains `customBadgeUrl` and `customBadgeLink` (which are mapped from the `custom_badge_url` and `custom_badge_link` columns added by the `add-encora-router` branch), the handler automatically inserts it as the first item in the custom badges array.
3. **Graceful Fallback**: If the database columns do not exist in the active schema, the try-catch block swallows the error and proceeds with the configuration-managed custom badges list.
4. **Duplicate Prevention**: If the badge is already mapped via the JSON configuration file, the API automatically deduplicates it to prevent it from displaying twice on user cards.

---

## Migration Steps on Your Remote Production Server

To retain existing Encora badges while unlocking support for multiple custom badges:

### Step 1: Retain Database Columns
Keep the existing PostgreSQL tables and schema migrations that added `custom_badge_url` and `custom_badge_link` to the user profile table.

### Step 2: Clean Up Upstream Branches (Optional but recommended)
Since the `custom-badges` plugin handles React rendering and Hono mapping dynamically without modifying core files, you can **revert changes** to the original upstream files on your production repository to achieve clean, conflict-free merges:
- Revert modifications to `UserProfileBadges.tsx`.
- Revert modifications to `UserResponseSchemas.ts` and `UserMappers.ts`.

### Step 3: Verify Integration
After deploying the stack, run a curl request against your API to verify both database-driven and plugin-managed badges return together:

```bash
curl https://yourdomain.com/api/v1/custom/badges/USER_ID_HERE
```

Response mapping:
```json
{
  "userId": "USER_ID_HERE",
  "badges": [
    {
      "iconUrl": "https://url.to/existing-encora-badge.png",
      "tooltip": "Linked Encora Profile",
      "url": "https://encora.url/profile"
    },
    {
      "iconUrl": "https://url.to/custom-second-badge.png",
      "tooltip": "Server Moderator",
      "url": "https://yourdomain.com/roles"
    }
  ]
}
```
Both badges will display inline on the React frontend popout.
