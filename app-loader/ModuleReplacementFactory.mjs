import path from 'node:path';

export function createModuleReplacements(rspack, mappings, appSrcDir) {
  return mappings.map(({ originalPath, wrapperPath }) => {
    // Normalize target path by removing extension
    const targetWithoutExt = originalPath.replace(/\.(web\.)?[jt]sx?$/, '');

    return new rspack.NormalModuleReplacementPlugin(
      /./, // intercept all resolve events, then filter in the callback
      (resource) => {
        if (!resource.request) return;

        // Skip original imports inside the wrapper modules
        if (resource.request.endsWith('?original')) {
          return;
        }

        let resolvedPath = '';
        if (resource.request.startsWith('@app/')) {
          resolvedPath = path.join(appSrcDir, resource.request.substring(5));
        } else if (resource.request.startsWith('.')) {
          resolvedPath = path.resolve(resource.context, resource.request);
        } else {
          return;
        }

        const requestWithoutExt = resolvedPath.replace(/\.(web\.)?[jt]sx?$/, '');
        
        if (requestWithoutExt === targetWithoutExt) {
          resource.request = wrapperPath;
        }
      }
    );
  });
}
