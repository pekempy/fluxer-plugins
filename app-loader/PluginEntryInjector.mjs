import path from 'node:path';

export function injectEntry(originalEntry, bootstrapPath) {
  const entry = { ...originalEntry };

  if (entry.main) {
    if (Array.isArray(entry.main)) {
      entry.main = [bootstrapPath, ...entry.main];
    } else {
      entry.main = [bootstrapPath, entry.main];
    }
  }

  return entry;
}
