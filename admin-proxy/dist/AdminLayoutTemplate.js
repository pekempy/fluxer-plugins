/**
 * Static fallback layout in case the upstream admin panel is offline
 * and the proxy cannot dynamically fetch the native layout.
 */
export function renderFallbackLayout(title, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} ~ Fluxer Admin (Fallback)</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .container {
      background-color: #fff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 800px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 20px;
      color: #111;
      border-bottom: 1px solid #eaeaea;
      padding-bottom: 10px;
    }
    .fallback-badge {
      font-size: 11px;
      background-color: #fef3c7;
      color: #92400e;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 20px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="content">
      ${content}
    </div>
    <div class="fallback-badge">
      ⚠️ Upstream admin panel offline - Serving fallback layout
    </div>
  </div>
</body>
</html>
`;
}
//# sourceMappingURL=AdminLayoutTemplate.js.map