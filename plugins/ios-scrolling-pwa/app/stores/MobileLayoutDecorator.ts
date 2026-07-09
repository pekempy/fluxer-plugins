// @ts-nocheck
import MobileLayout from '@app/features/ui/state/MobileLayout';

try {
  const mobxSymbol = Symbol.for('mobx administration');
  const adm = MobileLayout[mobxSymbol] || MobileLayout['$mobx'];
  if (adm && adm.values) {
    const observableValue = adm.values.get('enabled');
    if (observableValue) {
      const originalGet = observableValue.get;
      observableValue.get = function() {
        if (typeof window !== 'undefined' && (window as any).__BYPASS_MOBILE_DND__) {
          return false;
        }
        return originalGet.call(this);
      };
    }
  }
} catch (err) {
  console.error('[ios-scrolling-pwa] Failed to decorate MobileLayout store:', err);
}

const decorator = {
  decorate(store: any) {
    // Keep it as a registered decorator so the bootstrap setup loads us
  }
};
export default decorator;
