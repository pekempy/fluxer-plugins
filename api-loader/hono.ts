import { createRequire } from 'module';

let HonoClass: any = null;

export async function getHonoClass(): Promise<any> {
  if (HonoClass) return HonoClass;
  try {
    const fluxerRequire = createRequire('/usr/src/app/fluxer_api/package.json');
    const honoPath = fluxerRequire.resolve('hono');
    const honoModule = await import(honoPath);
    HonoClass = honoModule.Hono;
    console.log('[getHonoClass] Loaded Hono from fluxer_api context:', honoPath);
  } catch (err: any) {
    console.log('[getHonoClass] Failed to load Hono from fluxer_api, falling back:', err?.message || err);
    const honoModule = await import('hono');
    HonoClass = honoModule.Hono;
    console.log('[getHonoClass] Loaded fallback Hono from api-loader node_modules');
  }
  return HonoClass;
}
