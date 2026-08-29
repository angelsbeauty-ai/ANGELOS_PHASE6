import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { getActiveWorkspace } from '../lib/workspace';
import { trackProductEvent } from '../lib/product-analytics';

export function UsageTracker() {
  const pathname = usePathname();
  const previous = useRef<{ path: string; startedAt: number; workspaceId: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const now = Date.now();
      const old = previous.current;
      if (old) void trackProductEvent(old.workspaceId, { eventName: 'screen_duration', screen: old.path, durationMs: Math.max(0, now - old.startedAt) });
      try {
        const workspace = await getActiveWorkspace();
        if (cancelled) return;
        previous.current = { path: pathname, startedAt: now, workspaceId: workspace.id };
        void trackProductEvent(workspace.id, { eventName: 'screen_view', screen: pathname });
      } catch { previous.current = null; }
    })();
    return () => { cancelled = true; };
  }, [pathname]);
  return null;
}
