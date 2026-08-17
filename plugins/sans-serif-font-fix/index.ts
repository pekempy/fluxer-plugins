import type { PluginLifecycle } from '@pekempy/fluxer-plugin-sdk';

const plugin: PluginLifecycle = {
  init(context) {
    // The bundled stylesheet (app/styles/sans-serif-fix.css) forces the
    // default sans-serif stack unconditionally at every page load - that
    // covers the original "falls back to serif" bug for every user, signed
    // in or not.
    //
    // A signed-in user's saved custom font (stored server-side via
    // /v1/custom-font, see api/routes/CustomFontApi.ts) is fetched and
    // applied by AppearanceTabWrapper.tsx as soon as Settings > Appearance
    // mounts. It's deliberately NOT re-fetched here at plugin boot: doing so
    // would need this app's `http` client (for the /api/v1 prefix and the
    // bearer-token auth header it attaches - this app doesn't use cookies),
    // which lives under the @app/* alias that only resolves inside the
    // rspack-bundled app/ tree. This file is compiled by plain tsc as a
    // standalone Node/ESM module with no such path mapping available (the
    // fluxer and fluxer-plugins repos aren't guaranteed to share a
    // filesystem layout), so it has no way to attach that token.
    context.logger.info('Sans-serif font fix initialized.');
  },
  shutdown(context) {
    context.logger.info('Sans-serif font fix shutdown.');
  }
};

export default plugin;
