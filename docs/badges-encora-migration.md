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
Both badges display inline on the React frontend; full-profile placement is described below.

## Full-profile badge placement

The full-profile modal renders `UserProfileBadges` in multiple locations. The custom Encora badge belongs only in the `user.user-profile-modal.profile-media-header.header` slot, right-aligned beneath the Message/Add/More action buttons. The React app wrapper renders custom badges only in that slot; the production sidecar removes its own badges from name/username rows, uses the same slot as a fallback, and yields when the app wrapper has rendered its badge group. The action-row badge is grouped in a compact, theme-aware container with a subtle background, border, and rounded corners.

For the currently deployed legacy sidecar, apply `plugins/custom-badges/legacy-encora-badges.patch` to the plugin runtime (not Fluxer core) with `git apply --ignore-space-change`, then run `repatch-plugins` to reload it. The patch also bumps the injected script URL to invalidate older clients. When replacing an already-applied release, verify the previous tagged patch with `git apply --reverse --check --ignore-space-change`, reverse it with `git apply --reverse --ignore-space-change`, then apply the new cumulative patch. Do not apply a cumulative patch twice.

