let HonoClass: any = null;

export async function getHonoClass(): Promise<any> {
  if (HonoClass) return HonoClass;
  try {
    const honoPath = '/usr/src/app/node_modules/hono';
    const honoModule = await import(honoPath);
    HonoClass = honoModule.Hono;
  } catch {
    // Fallback for local compilation/testing on host
    const honoModule = await import('hono');
    HonoClass = honoModule.Hono;
  }
  return HonoClass;
}
