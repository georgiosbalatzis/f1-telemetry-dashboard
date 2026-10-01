# Theme persistence

## F1Stories contract

| | |
|---|---|
| Storage | `localStorage`, key **`f1stories-theme`** (shared by f1stories.gr, Telemetry, Ghost Car, BetCast) |
| Explicit values | `light`, `dark` |
| Anything else / absent | No explicit choice: follow `prefers-color-scheme`. Other values (e.g. a sibling app's `auto`) are left in place, never overwritten or deleted |
| Written | Only when the reader presses the theme toggle |

The canonical reader is `f1StoriesPage/scripts/theme-init.js`. Each app owns how it paints the result. Telemetry sets `data-theme="light|dark"` on `<html>`.

Legacy keys, migrated once and then removed by the owning app:

| App | Legacy key |
|---|---|
| Telemetry | `f1-telemetry-dashboard:theme` |
| Ghost Car | `f1s-theme` |
| BetCast | `betcast_theme` |

## Telemetry

Resolution order, run by the inline script in `index.html` before first paint (no flash). `readInitialThemeMode` in `DashboardContainer.tsx` repeats it for React state:

1. `?theme=light|dark`: one view only; never stored. Used by embeds and share/embed links.
2. `f1stories-theme` when it is `light` or `dark`.
3. OS `prefers-color-scheme`.
4. `light` (paper) when nothing else applies.

Migration: if `f1stories-theme` is absent and `f1-telemetry-dashboard:theme` is `light`/`dark`, it is copied over. The legacy key is then removed in all cases. A canonical value always wins over the legacy one.

The address bar does not carry `?theme=` (except in embeds), so a reload or bookmark follows the stored choice. Share and embed links still include it.

Not supported, matching f1stories.gr:
- No live response to OS theme changes while the page is open. The OS preference applies on the next load.
- No `storage`-event sync between open tabs. Other tabs pick up the choice on reload.

Storage failures (blocked storage, `SecurityError`) are swallowed. The page falls back to the OS preference.

Tests: `src/components/__tests__/ThemeInit.test.ts` runs the real `index.html` script. `VisualWorkflow.test.tsx` covers the toggle and React's initial state.

## Origins: same contract, not yet shared state

`localStorage` is per origin. Telemetry is served from `https://georgiosbalatzis.github.io/f1-telemetry-dashboard/` and the main site from `https://f1stories.gr`. Different origins mean **a theme chosen on f1stories.gr is not visible to Telemetry today**, even though both use the same key. All GitHub Pages apps under `georgiosbalatzis.github.io` share one origin, so Telemetry, Ghost Car and BetCast do share the key with each other once each app uses it.

Once the apps are served under `f1stories.gr/...`, the shared preference works with no code change. No cross-origin workaround (iframes, cookies, query propagation) is used, by design.
