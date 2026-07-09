// @ts-nocheck
import MobileLayout from '@app/features/ui/state/MobileLayout';

let value = MobileLayout.enabled;
Object.defineProperty(MobileLayout, 'enabled', {
  get() {
    if (typeof window !== 'undefined' && (window as any).__BYPASS_MOBILE_DND__) {
      return false;
    }
    return value;
  },
  set(val) {
    value = val;
  },
  configurable: true,
  enumerable: true
});

const decorator = (store: any) => store;
export default decorator;
