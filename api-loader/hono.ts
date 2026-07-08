let HonoClass: any = null;

export async function getHonoClass(): Promise<any> {
  if (HonoClass) return HonoClass;
  try {
    // Import directly from the physical pnpm store directory inside fluxer_api to bypass broken symlink resolution
    const honoPath = '/usr/src/app/fluxer_api/node_modules/.pnpm/hono@4.12.2/node_modules/hono';
    const honoModule = await import(honoPath);
    HonoClass = honoModule.Hono;
    console.log('[getHonoClass] Loaded Hono from physical directory /usr/src/app/fluxer_api/node_modules/.pnpm/hono@4.12.2/node_modules/hono successfully');
  } catch (err: any) {
    console.log('[getHonoClass] Failed to load Hono from physical directory, error:', err?.message || err);
    // Fallback for local compilation/testing on host
    const honoModule = await import('hono');
    HonoClass = honoModule.Hono;
    console.log('[getHonoClass] Loaded fallback Hono from api-loader node_modules');
  }
  return HonoClass;
}
