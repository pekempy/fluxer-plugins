let HonoClass: any = null;

export async function getHonoClass(): Promise<any> {
  if (HonoClass) return HonoClass;
  try {
    // Import the absolute path of the ESM entrypoint file directly to bypass Node ESM directory resolution limitations
    const honoPath = '/usr/src/app/fluxer_api/node_modules/.pnpm/hono@4.12.2/node_modules/hono/dist/index.js';
    const honoModule = await import(honoPath);
    HonoClass = honoModule.Hono;
    console.log('[getHonoClass] Loaded Hono from /usr/src/app/fluxer_api/node_modules/.pnpm/hono@4.12.2/node_modules/hono/dist/index.js successfully');
  } catch (err: any) {
    console.log('[getHonoClass] Failed to load Hono from ESM file path, error:', err?.message || err);
    // Fallback for local compilation/testing on host
    const honoModule = await import('hono');
    HonoClass = honoModule.Hono;
    console.log('[getHonoClass] Loaded fallback Hono from api-loader node_modules');
  }
  return HonoClass;
}
