# Writing App Plugins

App plugins extend `fluxer-app` (React/MobX/Rspack) by replacing component modules at build-time, wrapping stores at runtime, adding routing endpoints, and injecting styles.

---

## 1. Component Wrappers

The App loader uses Rspack's NormalModuleReplacementPlugin to replace original imports with wrapper modules.
A wrapper component receives the `OriginalComponent` as a prop and can render it with customized attributes or inject additional layout nodes:

```tsx
// app/components/MessageContentWrapper.tsx
import React from 'react';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import type { ComponentWrapper } from '@pekempy/fluxer-plugin-sdk/types/app';

const MessageContentWrapper: ComponentWrapper = ({ OriginalComponent, ...props }) => {
  return (
    <div style={{ borderLeft: '3px solid #7c3aed', paddingLeft: '8px' }}>
      {/* Render the original layout */}
      <OriginalComponent {...props} />
      
      {/* Inject custom plugin element */}
      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
        ✔ Monitored by security plugin
      </div>
    </div>
  );
};

export default wrapComponent(MessageContentWrapper);
```

Specify the target module in your manifest:
```yaml
targets:
  app:
    components:
      - target: "features/messaging/components/MessageContent/MessageContent"
        wrapper: "./app/components/MessageContentWrapper.tsx"
```

---

## 2. Store Decorators

Plugins can extend MobX singletons (stores) by proxying them. This allows you to intercept actions or add custom state keys:

```typescript
// app/stores/MessageStoreDecorator.ts
import { extendStore } from '@pekempy/fluxer-plugin-sdk/helpers/app';

export default extendStore({
  target: 'features/messaging/state/MessageStore',
  decorate: (originalStore) => {
    return new Proxy(originalStore, {
      get(target, prop, receiver) {
        // Intercept createMessage action
        if (prop === 'createMessage') {
          return async (channelId: string, content: string) => {
            console.log(`[Plugin] intercepting createMessage: ${content}`);
            // Perform modify content
            const decoratedContent = `${content} [sent via plugin]`;
            return target.createMessage(channelId, decoratedContent);
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
});
```

---

## 3. Custom Routes & Pages

You can add new SPA router pages:

```tsx
// app/pages/PluginPage.tsx
import React from 'react';

const PluginPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h1>Custom Plugin Page</h1>
      <p>This is a custom route added by the plugin system.</p>
    </div>
  );
};

export default PluginPage;
```

Mount it using the manifest routing targets:
```yaml
targets:
  app:
    routes:
      - path: "/plugin-page"
        component: "./app/pages/PluginPage.tsx"
```

---

## 4. Injecting Stylesheets

To override look-and-feel variables (like Tailwind or global CSS classes), include a stylesheet:

```css
/* app/styles/plugin.css */
:root {
  --primary-color: #8b5cf6; /* Customize theme color */
}

.message-content {
  font-family: 'Courier New', Courier, monospace;
}
```

Enable it in the manifest:
```yaml
targets:
  app:
    styles:
      - file: "./app/styles/plugin.css"
```
