import { injectPluginsIntoHtml } from './HtmlInjector.js';
import { runResponseInterceptors } from './ResponseInterceptor.js';
export async function createProxyMiddleware(upstreamUrl) {
    return async (ctx) => {
        const url = new URL(ctx.req.url);
        const targetUrl = `${upstreamUrl}${url.pathname}${url.search}`;
        // Clone headers, skipping Host header and Accept-Encoding to let fetch handle/request uncompressed data
        const headers = new Headers();
        ctx.req.raw.headers.forEach((val, key) => {
            const lowerKey = key.toLowerCase();
            if (lowerKey !== 'host' && lowerKey !== 'accept-encoding') {
                headers.set(key, val);
            }
        });
        const method = ctx.req.method;
        const body = ['GET', 'HEAD'].includes(method) ? undefined : await ctx.req.raw.clone().blob();
        try {
            const response = await fetch(targetUrl, {
                method,
                headers,
                body,
                redirect: 'manual',
            });
            const responseHeaders = new Headers();
            response.headers.forEach((val, key) => {
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'location') {
                    // Rewrite Location header to point to proxy instead of upstream
                    try {
                        const locUrl = new URL(val, url.origin);
                        const upstreamURLObj = new URL(upstreamUrl);
                        if (locUrl.host === upstreamURLObj.host) {
                            locUrl.protocol = url.protocol;
                            locUrl.host = url.host;
                        }
                        responseHeaders.set(key, locUrl.toString());
                    }
                    catch {
                        responseHeaders.set(key, val);
                    }
                }
                else if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length') {
                    responseHeaders.set(key, val);
                }
            });
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                let htmlText = await response.text();
                // 1. Run plugin response interceptors
                htmlText = await runResponseInterceptors(ctx, htmlText);
                // 2. Inject HTML fragments and Sidebar menus
                const modifiedHtml = await injectPluginsIntoHtml(htmlText, ctx);
                return ctx.html(modifiedHtml, response.status, responseHeaders);
            }
            // Non-HTML response, forward directly
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
            });
        }
        catch (err) {
            console.error(`[Admin Proxy] Failed to proxy request to ${targetUrl}:`, err);
            return ctx.text('Upstream Admin Server Unavailable', 502);
        }
    };
}
//# sourceMappingURL=ProxyMiddleware.js.map