import type { HTMLElement } from 'node-html-parser';
import type { LoadedPlugin } from '@pekempy/fluxer-plugin-sdk/types/plugin';

export function injectSidebar(root: HTMLElement, plugins: LoadedPlugin[]) {
  const sidebarNav = root.querySelector('nav[data-sidebar-nav]');
  if (!sidebarNav) return;

  const items: Array<{ label: string; path: string; section?: string }> = [];

  for (const plugin of plugins) {
    const adminTargets = plugin.manifest.targets?.admin;
    if (!adminTargets) continue;

    // Collect custom pages
    const pages = adminTargets.pages || [];
    for (const page of pages) {
      if (page.nav) {
        items.push({
          label: page.nav.label,
          path: page.path,
          section: page.nav.section,
        });
      }
    }

    // Collect settings pages
    const settings = adminTargets.settings || [];
    for (const set of settings) {
      if (set.nav) {
        items.push({
          label: set.nav.label,
          path: set.path,
          section: set.nav.section,
        });
      }
    }
  }

  if (items.length === 0) return;

  // We group them under "Plugins" section
  // Determine if any link is active based on the current page.
  // In our proxy, we will match the current pathname. We can extract it if we inject script, 
  // or at proxy time we inspect the active page. We can check if there's any active item by looking 
  // at the existing active elements in the sidebar or from a script.
  // Actually, we can check this at proxy time by injecting class "bg-neutral-800 text-white" 
  // if the request URL pathname matches the link path.
  
  // Create HTML snippet
  let linksHtml = '';
  for (const item of items) {
    // Note: the original Maud layout includes base_path (usually /admin).
    // The items paths are configured as "/plugins/my-plugin/...". 
    // If the base path is "/admin", then the URL is "/admin/plugins/...".
    // We will prefix the item path with the resolved admin base path.
    // Let's find the base path by looking at existing links in the sidebar!
    let basePath = '/admin';
    const firstLink = sidebarNav.querySelector('a');
    if (firstLink) {
      const href = firstLink.getAttribute('href') || '';
      if (href.startsWith('/admin')) basePath = '/admin';
      else if (href.startsWith('/control')) basePath = '/control';
      else if (href.startsWith('/dashboard')) basePath = '/dashboard';
      else basePath = ''; // root level
    }

    const fullPath = `${basePath}${item.path}`;
    
    // We will let a client-side snippet highlight the active link, or do it during rendering.
    // Client-side script is cleaner for cached or static pages, but server-side is very easy here
    // since we proxy every request.
    
    // We generate the link with class names
    // We add data-active attribute if active
    linksHtml += `
      <a href="${fullPath}" 
         class="block min-h-[44px] px-3 py-2.5 rounded text-sm transition-colors text-neutral-300 hover:bg-neutral-800 hover:text-white navigation-plugin-item" 
         data-plugin-path="${fullPath}">
        ${item.label}
      </a>
    `;
  }

  const sectionHtml = `
    <div class="mt-4 pt-4 border-t border-neutral-800" id="plugins-sidebar-section">
      <div class="mb-2 px-3 text-neutral-400 text-xs uppercase tracking-wider">Plugins</div>
      <div class="space-y-1">
        ${linksHtml}
      </div>
    </div>
  `;

  // Inject a small client-side script at the end of the nav to handle active route highlighting
  const activeScriptHtml = `
    <script>
      (function() {
        const currentPath = window.location.pathname;
        document.querySelectorAll('.navigation-plugin-item').forEach(link => {
          const path = link.getAttribute('data-plugin-path');
          if (currentPath === path || currentPath.startsWith(path + '/')) {
            link.classList.remove('text-neutral-300', 'hover:bg-neutral-800', 'hover:text-white');
            link.classList.add('bg-neutral-800', 'text-white');
            link.setAttribute('aria-current', 'page');
            link.setAttribute('data-active', '');
          }
        });
      })();
    </script>
  `;

  sidebarNav.insertAdjacentHTML('beforeend', sectionHtml + activeScriptHtml);
}
