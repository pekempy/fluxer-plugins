import type { Context } from 'hono';

/**
 * Common helper to parse form body submissions and persist them directly
 * to the plugin's context configuration store.
 */
export async function handleSettingsPost(c: Context, plugin: any) {
  try {
    const body = await c.req.parseBody();
    const config = plugin.context.config;

    for (const [key, val] of Object.entries(body)) {
      // Parse JSON values if they look like objects or arrays
      let parsedVal: any = val;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            parsedVal = JSON.parse(trimmed);
          } catch {}
        } else if (trimmed === 'true') {
          parsedVal = true;
        } else if (trimmed === 'false') {
          parsedVal = false;
        } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
          parsedVal = Number(trimmed);
        }
      }
      await config.set(key, parsedVal);
    }

    return c.json({ ok: true, message: 'Settings saved successfully!' });
  } catch (err: any) {
    console.error(`[Admin Proxy] Failed to save settings for ${plugin.name}:`, err);
    return c.json({ ok: false, error: err.message }, 500);
  }
}
