let HonoClass: any = null;

export async function getHonoClass(): Promise<any> {
  if (HonoClass) return HonoClass;
  try {
    const honoPath = '/usr/src/app/node_modules/hono';
    const honoModule = await import(honoPath);
    HonoClass = honoModule.Hono;
    console.log('[getHonoClass] Loaded Hono from /usr/src/app/node_modules/hono successfully');
  } catch (err: any) {
    console.log('[getHonoClass] Failed to load Hono from /usr/src/app/node_modules/hono, error:', err?.message || err);
    // Fallback for local compilation/testing on host
    const honoModule = await import('hono');
    HonoClass = honoModule.Hono;
    console.log('[getHonoClass] Loaded fallback Hono from api-loader node_modules');
  }
  return HonoClass;
}
