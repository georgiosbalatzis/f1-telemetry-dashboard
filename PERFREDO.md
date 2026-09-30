# PERFREDO: performance and cross-browser plan

Audit date: 2026-09-30 · Branch: `perf/perf-update` · Executor: Sonnet, one task per commit.

**Goal:** fast and correct in Safari, Chrome and Firefox on mobile, tablet and desktop, with less code.
**Hard constraint:** no visual change to the finished state of any screen, in either theme, at any width. Loading states may change only to *remove* layout shift. Nothing that works today may break.

---

## 0. How to use this file (read first, Sonnet)

1. Do the phases in order. Inside a phase, tasks are independent unless a task says otherwise.
2. One task = one commit: `perf(P1-03): <summary>`. Run `npm run ci` before every commit. It must stay green (baseline: **94/94 tests**, lint 0 warnings).
3. After every phase, run the visual check in **P0-02** and the metrics script in **P0-03**. Compare against the baseline. If any screenshot differs (other than live-data text), revert and re-plan that task. Don't adjust the baseline to make it pass.
4. Tasks marked **⚠ VISIBLE** change pixels somewhere. Do not ship them without the owner's explicit OK. They are optional, and they come last in their phase.
5. Don't widen scope. If you find something new, add it to §7 "Found during execution" instead of fixing it on the spot.
6. After code changes, run `graphify update .` (see CLAUDE.md).

---

## 1. Baseline (measured, production build, Chromium)

| Metric | Value | Notes |
|---|---|---|
| Initial JS (modulepreloaded on first paint) | **~720 KB min / ~205 KB gzip** | `index` 103K + `react-vendor` 187K + `charts` 293K + `vendor` 123K + `icons` 13K |
| `vendor` chunk content | 100% recharts dependencies | lodash 187K, decimal.js-light 48K, d3-* ~120K, fast-equals 21K, eventemitter3 10K (pre-minify) |
| CSS | 59 KB / 12.6 KB gzip | |
| `history.replaceState` calls | **18 on load**, **28 for 15 lap steps in 236 ms** | once per render of `DashboardContainer` |
| OpenF1 **429 Too Many Requests** | 5 on a cold load | 9 requests fired within ~1 s, then 1.5 s / 3 s retry back-off |
| Cold load to charts visible | ~9.7 s | dominated by the request waterfall plus 429 retries |
| CLS, mobile 390px | **~0.126** (needs improvement) | signal band grows when `.signal-partial` appears (0.083); lap strip / analysis content push down (0.031) |
| CLS, desktop 1366px | 0.052 | |
| Long tasks at 6× CPU throttle | 53–99 ms on tab switch and theme toggle | whole tree re-renders |
| LCP element | `H1.display` (Barlow Condensed) | fonts are not preloaded |
| Test suite | 20 files, 94 tests, green | |

Firefox and WebKit are not installed locally (only Chromium). P0-01 installs them.

---

## 2. Support matrix (make it explicit)

Tailwind v4 already requires **Safari 16.4+, Chrome/Edge 111+, Firefox 128+**. The CSS also uses `color-mix()`, `:has()` and `aspect-ratio`. That is the effective floor today, so write it down and build JS for it (P3-06).

| Platform | Engines to test |
|---|---|
| iPhone (Safari iOS 16.4+) | WebKit, 390×844, touch |
| iPad (Safari iPadOS 16.4+) | WebKit, 820×1180 and 1180×820 |
| Android phone | Chromium, 412×915, touch |
| Desktop | Chromium, Firefox, WebKit at 1366×900 and 1440×900 |

---

## 3. Findings by severity

| # | Severity | Finding | Where | Task |
|---|---|---|---|---|
| F1 | 🔴 Critical | Nothing upstream is referentially stable, so every `useMemo` downstream recomputes on **every render**: `filters` and `filters.snapshot` are new objects each render; `useFetch` returns a new object each render; `lapStates`, `telemetryByDriver` and `locationByDriver` are rebuilt each render. As a result every fetch resolution, toast, and keystroke in the preset input recomputes corner splits, three comparison datasets and lap summaries, and re-renders **all** charts. | `useDashboardFilters.ts:79,166`, `useOpenF1.ts:219`, `useDashboard.ts:73,133,140` | P1-01..05 |
| F2 | 🔴 Critical (Safari) | `history.replaceState` runs on every render because `filters.snapshot` is always new. WebKit throws `SecurityError` after 100 calls in 10 s; Chrome and Firefox throttle with warnings. Holding an arrow key on the lap strip reaches that in about 3 s. The effect lives in `DashboardContainer`, **outside** any error boundary, so in Safari the whole app goes blank. | `DashboardContainer.tsx:195` | P1-01, P1-06, P5-01 |
| F3 | 🟠 High | No request pacing. A cold load fires about 9 OpenF1 requests at once, which draws 429s and then 1.5 s / 3 s back-off. Each lap step fires 2 `car_data` requests, and intermediate laps during fast stepping are aborted but still count against the limit. The cache is also wiped on every session switch. | `api/openf1.ts` `fetchJson`, `useDashboardSelectionData.ts:70` | P2-01..05 |
| F4 | 🟠 High | Recharts (293K) and its dependencies (`vendor`, 123K) are modulepreloaded on first paint because `TelemetryTab` is imported eagerly. The `vendor` split buys nothing: it contains only recharts dependencies and is always loaded alongside `charts`. | `DashboardShell.tsx:29-30`, `vite.config.ts:19-43` | P3-01, P3-02 |
| F5 | 🟠 High | Mobile CLS is ~0.126. Status lines and the lap strip appear after data loads and push the page down. | `SignalBand.tsx`, `LapStrip.tsx`, Shell | P4-01, P4-02 |
| F6 | 🟠 High | `IntervalsTab` bucketing is O(buckets × drivers × samples) with a `new Date()` parse in the innermost loop (about 1M parses for a race), and `Math.min(...allDates)` spreads tens of thousands of arguments, which can throw `RangeError` on some engines and stack depths. `positionsUtils.ts` already has the correct O(n) pointer algorithm. | `IntervalsTab.tsx:40-60` | P3-03 |
| F7 | 🟡 Medium (iPhone) | The full-screen chart button calls `element.requestFullscreen()`, which does not exist on iPhone Safari. The result is an unhandled `TypeError` and a button that does nothing. | `ChartPanel.tsx:59-69` | P5-02 |
| F8 | 🟡 Medium | `Panel` declares an `icon` prop and never renders it. About 25 call sites build Lucide icon elements that are thrown away (dead code, dead imports, wasted element creation). | `shared.tsx:117`, `ChartPanel.tsx:14`, all tabs | P6-01 |
| F9 | 🟡 Medium | Fonts are discovered only after the CSS is parsed (no preload), and the LCP heading uses Barlow. | `fonts.css`, `index.html` | P3-04 |
| F10 | 🟡 Medium | Duplicated logic: 3 clipboard/share fallbacks, 4 tab-order arrays, 2 sector classifiers, 2 time-bucket algorithms, 2 lap-window URL builders, 2 URL builders, a double context memo, a redundant re-sort. | see P6 | P6-02..09 |
| F11 | 🟢 Low | CSS: duplicate or overridden rules, 6 unused tokens, dark theme re-declares identical font tokens. | `index.css` | P6-10 |
| F12 | 🟢 Low | Repo and deploy leftovers: CRA `public/index.html` (links Google Fonts for Roboto/JetBrains), unlinked stale `manifest.json` (old `#111113` theme), unused `src/assets/*`, `check.sh` checking files deleted long ago, a 33 KB PNG used as favicon and 36px logo. | see P6-11 | P6-11 |
| F13 | 🟢 Low (Safari a11y) | Timing tower `<tr>` elements use `display:grid`, so Safari/VoiceOver drops table semantics. | `.bc-tower-*`, `TimingTower.tsx` | P5-04 |
| F14 | 🟢 Low (iOS) | `#root { min-height: 100vh }` and `min-h-screen`: on iOS, 100vh is taller than the visible viewport. | `index.css:136`, Shell | P5-03 |

---

## 4. Phases and tasks

### Phase 0: Safety net (no product code changes)

**P0-01 ✅ · Install cross-browser engines**
- `npx playwright install chromium firefox webkit`
- Acceptance: all three launch headless.

**P0-02 ✅ · Visual baseline script** → `scripts/visual-baseline.mjs` (dev-only, not bundled)
- Use one fixed, historical scope so the data is stable, e.g. `?year=2025&circuit=Monza&session=9912&drivers=1,4&lap=52`.
- For each tab (10) × theme (light, dark) × viewport (390×844, 820×1180, 1440×900) × engine (chromium, webkit, firefox), save a full-page screenshot to `.perf-baseline/<engine>/<tab>-<theme>-<w>.png`. Add `.perf-baseline/` to `.gitignore`.
- Wait for `networkidle`, plus `.recharts-wrapper` on chart tabs. Disable animations (`reducedMotion: 'reduce'`).
- Pace navigation (≥1.5 s between pages) so the capture itself doesn't hit OpenF1's rate limit.
- Add `--compare` mode: pixel-diff against the baseline (use `pixelmatch` via `npx`; do not add a dependency) and list the files that exceed 0.1% of pixels.
- The existing design references in `docs/rework/final/*.png` are the owner's intended look. Use them for manual spot checks only (their data differs).

**P0-03 ✅ · Metrics script** → `scripts/perf-metrics.mjs`
- Load the fixed scope in Chromium with an init script that counts `history.replaceState` calls, long tasks, CLS (with sources) and LCP. Print JSON.
- Scenario: cold load; 15× `ArrowLeft` on the focused lap strip; tab switches Telemetry → Energy → Broadcast; theme toggle at 6× CPU throttle via CDP `Emulation.setCPUThrottlingRate`.
- Also print initial JS: parse `dist/index.html` for the entry script plus `modulepreload` links, and sum their gzip sizes.
- Save the result as `.perf-baseline/metrics-before.json`.

**P0-04 ✅ · Render-count probe (temporary, dev only)**
- Behind `import.meta.env.DEV && localStorage.perfProbe`, `usePerfCommit('TelemetryTab')` (an effect inside the component) counts real re-renders. A `<Profiler>` wrapper over-counts, because it fires whenever its parent renders even if a memo'd child bails out. Use it to prove P1. **Remove it in P7-01.**

---

### Phase 0 status: ✅ DONE (2026-09-30)

Implemented by `scripts/lib.mjs`, `scripts/visual-baseline.mjs`, `scripts/perf-metrics.mjs`, `scripts/render-probe.mjs` and `src/utils/perfProbe.ts`. `playwright@1.63.0` was added as a devDependency (scripts only, never bundled); Chromium, Firefox and WebKit are installed. `.perf-baseline/` and `.playwright-mcp/` are gitignored.

| Command | What it does |
|---|---|
| `npm run build && node scripts/visual-baseline.mjs` | writes the baseline: 180 PNGs (10 tabs × light/dark × 390/820/1440 × 3 engines) |
| `node scripts/visual-baseline.mjs --compare` | re-captures to `.perf-baseline/current/` and diffs; exit 1 on a Chromium/Firefox diff > 0.1% of pixels. Subsets: `--engines= --tabs= --themes= --widths=` |
| `node scripts/perf-metrics.mjs --label=after` | cold load (mobile and desktop), 15 lap steps, 6× throttled tab switches and theme toggle, initial-JS gzip; `--replay` uses recorded API data |
| `node scripts/render-probe.mjs` | dev server + `<PerfProbe>`; counts `TelemetryTab` commits for 10 keystrokes and a toast |

How it works, and what to know:
- **Deterministic data.** OpenF1 responses are recorded on first use to `.perf-baseline/fixtures/` (paced, 429-safe) and replayed afterwards. Delete that folder to re-record. **Never freeze `Date.now()`** in these scripts: the request pacer (P2-01) schedules with it, so a frozen clock makes queued requests pile up and pages look idle while still loading (it produced false Broadcast-tab diffs). The 2025 scope has no upcoming meeting, so nothing depends on "now".
- **Chromium and Firefox are strict gates** (0 diffs on a full self-compare). **WebKit headless is advisory**: identical runs differ by up to ~15 px of height or a text shift, at a different place each time (hero, map legend). Use `--strict-webkit` to gate on it; before Phase 7, eyeball any WebKit diffs against `docs/rework/final/`.
- Full-page capture neutralizes `#root`/`.min-h-screen` min-heights (they feed back through `100vh`). Pages are always taller than the viewport, so no pixel changes. This also means **P5-03 (dvh) is invisible to the screenshot check**: verify it manually on iOS.
- After Phase 1 changes, re-run `--compare` **before** committing each phase; re-baseline only for changes the owner approved (⚠ VISIBLE tasks).
- The metrics script needs a fresh `npm run build`; the probe uses the dev server. `usePerfCommit` is called at the top of `TelemetryTab` and removed in P7-01 (with `src/utils/perfProbe.ts`).

**Measured baseline** (`.perf-baseline/metrics-before.json`, production build, live API):

| Metric | Value |
|---|---|
| Initial JS / CSS gzip | 200.3 KB / 12.2 KB |
| Desktop cold load | 12 `replaceState`, 5 × 429, charts visible after 2.4 s, CLS 0.060 |
| Mobile 390px cold load | 11 `replaceState`, 3 × 429, CLS **0.198** |
| 15 lap steps | 19 `replaceState`, **32** `car_data` requests |
| Long tasks at 6× throttle | 51–72 ms on tab switch (energy/telemetry) and theme toggle; none on broadcast |
| `TelemetryTab` commits | 10 for 10 keystrokes, 2 for one toast (should be 0) |

Numbers differ a little from the audit-time ones (live API and timing vary); judge Phase 1–4 against this file, not §1. Mobile CLS is worse than first measured (0.198 vs 0.126), which makes P4 more valuable.

---

### Phase 1: Render stability (the root cause behind F1 and F2)

Order matters: P1-01 → P1-02 → P1-03 → P1-04 → P1-05 → P1-06.

**P1-01 · Stable filter state** · `src/hooks/useDashboardFilters.ts`
- `readInitialSnapshot()` runs on every render (line 79). Read it once: `const [initial] = useState(readInitialSnapshot)`.
- Wrap `snapshot` (line 166) in `useMemo` over its six fields.
- Wrap the returned object in `useMemo` so `filters` identity changes only when a value changes (all setters are already `useCallback` or state setters).
- Acceptance: `useDashboardFilters.test.ts` still passes; add one test that `result.current.snapshot` keeps its identity across a rerender with no state change.

**P1-02 · Stable fetch results** · `src/hooks/useOpenF1.ts:219`
- `return useMemo(() => ({ ...state, refetch }), [state, refetch])`.
- Don't `setState` when nothing changed: in the effect, skip `setState({data:null,loading:false,error:null})` when the state is already exactly that (a functional update that returns `prev` when equal).
- Acceptance: `openf1.test.ts` and `openf1.integration.test.ts` pass.

**P1-03 · Stable per-driver arrays** · `src/hooks/useDashboard.ts`
- `lapStates`, `telemetryStates` and `locationStates` are fresh arrays each render. Memoize each: `useMemo(() => [a, b, c, d], [a, b, c, d])`. This works once P1-02 is in.
- `locationByDriver` (line 133) and `telemetryByDriver` (line 140): memoize on `filters.driverNums` plus the four `.data` references.
- `comparisonDrivers`: `useMemo`.
- `stepLap` already uses `useCallback`; it becomes stable once `filters` is (P1-01).
- `useDashboard` returns a new object literal. Memoize it too, so `DashboardShell` props are stable.

**P1-04 · Selection data keyed on data, not on state objects** · `src/hooks/useDashboardSelectionData.ts`
- `allLaps` depends on `lapStates` (FetchState objects). Change the param to `lapData: (OpenF1Lap[] | null)[]` (memoized in `useDashboard`) so a `loading` flip on one slot doesn't rebuild `allLaps`, `lapOptions`, `telemetryWindows` and the entire view model.
- Update `useDashboard` and any test that constructs params (`useDashboardViewModel.test.ts`, `P0Comparison.test.ts`).

**P1-05 · Memoize heavy tab components** · all `src/components/dashboard/*Tab.tsx`, `BroadcastTab.tsx`, `SignalBand`, `LapStrip`, `DashboardSelectors`, `DriverSelector`, `DashboardHeader`
- `export const TelemetryTab = memo(function TelemetryTab(...) {...})`, and the same for each. For lazy tabs, the `lazy(() => import(...).then(m => ({ default: m.X })))` pattern keeps working.
- Make sure every prop passed from `DashboardShell` is stable: `onTelemetryRetry={primaryTelemetry?.refetch}` is stable after P1-02; handlers in `DashboardContainer` depend on `filters.snapshot` and become stable after P1-01.
- `tabLead` in `DashboardShell` builds `<CardBar>` inline, so it is new whenever its handlers change. After P1-01 it changes only when the snapshot changes. Verify.
- Acceptance: with the P0-04 probe, typing 10 characters in the preset input, or showing and clearing a toast, commits **0** `TelemetryTab` renders. Before: 1 per keystroke.

**P1-06 · URL sync: write only on change, never throw** · `src/components/DashboardContainer.tsx:190-199`
- Build the URL; if it equals `location.href`, return. Otherwise `try { history.replaceState(...) } catch { /* Safari rate limit: skip, the next change writes it */ }`.
- Also guard `openDashboardUrl`: it is already `useMemo`, and it becomes effective after P1-01.
- Acceptance (P0-03): cold load ≤ 6 `replaceState` calls (one per real filter change during auto-selection); 15 lap steps ≤ 15 calls.

**P1-07 · Driver context computed once** · `src/components/DashboardContainer.tsx`, `src/contexts/*`
- `DriverProvider` memoizes a value that `DashboardContainer` already memoized, which is a redundant double memo. Keep one (in the provider; the container passes raw inputs).
- `useDriverContext` returns `{...context, driverDash}` (a new object per call), and `driverDash` re-sorts teammates on every call. Precompute a `dashByDriver: Record<number, {line, brake}>` inside the provider's memo and have `driverDash` read from it. Return the context value unchanged: put `driverDash` inside the provider value.
- `driverColor` calls `chartColorForTheme` (a loop of up to 20 luminance computations) on every call. Cache per `(driverNumber, theme)` in the provider memo.
- Acceptance: identical colours and dash patterns (visual check); `P1Presentation.test.tsx` and `P2Polish.test.tsx` pass.

---

### Phase 1 status: ✅ DONE (P1-01..P1-07, 2026-09-30)

Measured with `scripts/perf-metrics.mjs --label=p1` (live API) and `render-probe.mjs`:

| Metric | Baseline | After Phase 1 | Target |
|---|---|---|---|
| `replaceState`, desktop cold load | 12 | **1** | ≤ 6 ✅ |
| `replaceState`, 15 lap steps | 19 | **15** | ≤ 15 ✅ |
| `TelemetryTab` renders, 10 keystrokes | 10 | **0** | 0 ✅ |
| `TelemetryTab` renders, toast show + clear | 2 | **0** | 0 ✅ |
| Screenshots, Chromium + Firefox, 80 shots | n/a | 0 diffs | 0 ✅ |

Notes for later phases:
- Long tasks at 6× throttle did **not** move (51–101 ms on tab switch and theme toggle). Those are real mounts and chart repaints, not wasted renders; the remaining lever is the chart work itself (P3).
- 429s (6 on cold load) and `car_data` per 15 lap steps (30) are unchanged: that's Phase 2. Mobile CLS is 0.28 this run (0.20 before, it varies with load timing): Phase 4.
- `DashboardSelectors` is memo'd but receives a fresh `children` element each render, so it still re-renders with the Shell (cheap; left as is).
- P1-07 moved `driverDash` and the teammate-index table into `DriverProvider`, so `useDriverContext()` now returns the context value itself (stable identity). `DriverProvider` keeps its three input props, so existing tests are unchanged.

---

### Phase 2: Network (F3)

**P2-01 · Request pacing plus Retry-After** · `src/api/openf1.ts` `fetchJson`
- First confirm the current free-tier limits at https://openf1.org/docs. They were 3 req/s and 30 req/min when last checked; don't trust this doc, check the source.
- Add a tiny module-level pacer: `let nextSlot = 0; async function takeSlot(signal) { const wait = Math.max(0, nextSlot - Date.now()); nextSlot = Math.max(Date.now(), nextSlot) + MIN_GAP_MS; if (wait) await sleep(wait, signal); }`, with `MIN_GAP_MS = 350`. Call it before each `fetch` attempt, retries included. Add the comment `// ponytail: global FIFO pacer; per-priority queue only if first paint suffers`.
- On 429, if a `Retry-After` header is present, sleep that many seconds (capped at 10 s) instead of the fixed back-off.
- Aborted requests must release their slot: if the signal aborts while waiting in `sleep`, it rejects and the request is never sent, so it costs nothing.
- Acceptance: cold load shows **0** 429s in the console (P0-03); cold load to charts visible is not slower than baseline (expected: faster).
- Add a unit test in `openf1.test.ts`: two back-to-back calls start ≥ `MIN_GAP_MS` apart (fake timers).

**P2-02 · Debounce lap-driven fetches** · `src/hooks/useDashboard.ts`
- The UI lap (selects, strip highlight, headline) updates instantly, but the telemetry and location **fetch keys** follow a debounced lap (200 ms): a small `useDebouncedValue(filters.lapNum, 200)` feeding the `telemetryWindows` lookup only.
- Put the helper in `src/hooks/` (about 8 lines, `useEffect` plus `setTimeout`). No library.
- Acceptance: 15 rapid lap steps produce ≤ 2 `car_data` requests per driver (P0-03 network count). Before: 30.

**P2-03 · Stop wiping the cache on session switch** · `src/hooks/useDashboardSelectionData.ts:63-73`, `src/hooks/useOpenF1.ts`
- `invalidateOpenF1SessionCache(previousSessionKey)` throws away data the user is likely to return to, and the LRU (200 entries) plus the 30-minute stale TTL already bound memory. Delete the effect, the ref, `invalidateOpenF1SessionCache` and `isSessionScopedCacheKey` if nothing else uses them (grep the tests too).
- Acceptance: switching session A → B → A issues 0 requests for A's already-loaded endpoints within 5 min.

**P2-04 · Longer freshness for immutable data** · `src/hooks/useOpenF1.ts:30`
- Completed sessions never change. Raise `CACHE_TTL` to 30 min and `CACHE_STALE_TTL` to 2 h. The only possibly-live data is the current weekend's session, and 30 min staleness is acceptable for this app. Mention it in a comment.

**P2-05 · Fetch order: critical first** · `src/hooks/useDashboard.ts`
- Effects run in hook order, and the P2-01 pacer is FIFO. Move `useRaceControl` (used only for the lap-strip safety-car shading and the Incidents tab) **after** the telemetry hooks so laps and `car_data` get the first slots.
- Acceptance: in the Network panel, `race_control` starts after both `car_data` requests on a cold load.

**P2-06 · Preconnect to the API** · `index.html`
- `<link rel="preconnect" href="https://api.openf1.org" crossorigin>` saves DNS and TLS time before the first request, which matters most on mobile networks.

---

### Phase 2 status: ✅ DONE (P2-01..P2-06, 2026-09-30)

Measured with `scripts/perf-metrics.mjs --label=p2` (live API):

| Metric | Baseline | After Phase 2 | Target |
|---|---|---|---|
| 429s on cold load (desktop / mobile) | 5 / 3 | **0 / 0** | 0 ✅ |
| Cold-load requests | `laps` 5, `session_result` 2, `race_control` 2 | `laps` 2, `session_result` 1, `race_control` 1 | n/a |
| `car_data` requests, 15 rapid lap steps | 32 | **2** (one per driver) | ≤ 4 ✅ |
| Charts visible on cold load | ~2.4 s | ~2.4 s | not slower ✅ |
| Screenshots, Chromium + Firefox, 80 shots | n/a | 0 diffs | 0 ✅ |

What changed and what was learned:
- **Rate limit, measured** (the docs page states none): sequential requests are never throttled; a burst of 4 concurrent requests gets one 429 and 9 get six. So about 3 concurrent / ~3 per second. `MIN_GAP_MS = 350`. There is no `Retry-After` header, so that branch (capped at 10 s) only applies if it ever appears.
- P2-01: one global FIFO pacer in `api/openf1.ts` (`takeSlot`), applied to every attempt including retries; a request aborted while queued hands its slot back if nobody queued behind it. The 12 s request timeout also covers time spent queued.
- P2-02: `useDebouncedValue` (200 ms) feeds only the telemetry/location windows (`windowLapNum`); the UI lap is instant, and auto-picked laps skip the delay (`lapSelectionAuto`). Known, accepted: for ≤200 ms after the last step, summaries can still show the previous lap's telemetry before the skeleton appears.
- P2-03/04: removed the session-switch cache wipe (`invalidateOpenF1SessionCache` and helpers); TTL 30 min fresh / 2 h stale. The app only shows finished sessions well; a live session can lag by up to 30 min.
- P2-05: hook order alone is not enough (race_control's key exists on the first render, the telemetry key only after laps arrive), so `race_control` is also gated on laps having arrived or the Incidents tab being open, and declared after the car-data hooks.
- P2-06: `preconnect` to `api.openf1.org`.

---

### Phase 3: Loading and bundle (F4, F6, F9)

**P3-01 · Lazy-load Telemetry and Track Map** · `src/components/DashboardShell.tsx:29-30`
- Convert both to `lazy()` like the other eight tabs.
- The Suspense fallback **must match the tab's own loading layout** so there is no shift: for telemetry, render the same lead-panel skeleton heights (`h-[240px] sm:h-[380px]`); for trackmap, `h-[260px] sm:h-[360px]`. Extend `TabLoadingPlaceholder` with a `className` prop; don't create a new component.
- Acceptance: `dist/index.html` no longer modulepreloads `charts-*.js`; the telemetry tab still renders identically once loaded; CLS is not worse (P0-03).

**P3-02 · Drop the pointless `vendor` split** · `vite.config.ts`
- Every `node_modules` import that isn't React or Lucide is a recharts dependency, so route it to `'charts'` (delete the `vendor` branch).
- Acceptance: no `vendor-*.js` in the build; initial JS gzip ≤ ~100 KB (from ~205 KB). Record the numbers in the commit message.

**P3-03 · Intervals bucketing: O(n) and spread-free** · `src/components/dashboard/IntervalsTab.tsx:28-80`, `positionsUtils.ts`
- Extract the pointer-advance nearest-sample logic from `buildPositionChartData` into an exported helper in `positionsUtils.ts` (e.g. `nearestPerBucket(samplesSortedByTs, bucketTimes)`). Use it in both places.
- Parse each date once (`Date.parse`). Compute tMin and tMax with a loop, not `Math.min(...arr)`.
- Output must be **identical** (same buckets, same clamping). Add a test in `positionsUtils.test.ts` comparing the old naive result with the new one on a small fixture.

**P3-04 · Preload critical fonts** · `index.html`, `src/fonts.css`
- Preload: `ibm-plex-sans-400-600.woff2` (latin), `ibm-plex-sans-400-600-greek.woff2` (the UI is Greek) and `barlow-condensed-700.woff2` (the LCP heading is "Telemetry" in Barlow). Don't preload latin-ext.
- Hashed names are unknown to `index.html`. Move these three files to `public/fonts/`, reference them as `url(/fonts/…)` in `fonts.css`, and add `<link rel="preload" as="font" type="font/woff2" href="/fonts/…" crossorigin>`. **Verify in `dist/`** that Vite prefixed both with `/f1-telemetry-dashboard/`. If it didn't, stop and use `%BASE_URL%` in the HTML instead.
- Acceptance: in the Network waterfall the fonts start in parallel with the CSS; no double download (the preload URL must equal the CSS URL exactly, including `crossorigin`).

**P3-05 · Collapse pass-through wrappers and the duplicate CSS import** · `src/main.tsx`, `src/App.tsx`, `src/components/F1TelemetryDashboard.tsx`
- `index.css` is imported in both `main.tsx` and `App.tsx`. `App` → `F1TelemetryDashboard` → `DashboardContainer` are three pass-through layers.
- `main.tsx` renders `<DashboardContainer />` inside the root error boundary from P5-01. Delete `App.tsx` and `F1TelemetryDashboard.tsx`. Fix any test imports (grep `F1TelemetryDashboard`, `App`). `check.sh` asserts these files exist, so it is removed in P6-11.

**P3-06 · Explicit build target** · `vite.config.ts`
- `build.target: ['es2022', 'safari16.4', 'chrome111', 'firefox128', 'edge111']` (matches Tailwind v4's floor, see §2). Add a README line documenting the support matrix.
- Acceptance: build passes; no syntax errors in WebKit or Firefox (P0-02 run).

---

### Phase 4: Layout stability (F5), loading states only

**P4-01 · Signal band: reserve the status line** · `SignalBand.tsx`, `index.css`
- `.signal-partial` and `.session-status` appear and disappear, wrapping the band on mobile and pushing the whole page down (0.083 CLS).
- Reserve the space so the finished (all-loaded) state looks exactly as today: give the band a mobile `min-height` equal to its two-line height **only while** `loading || failed.length > 0` was ever true during this load. The simpler alternative: render the partial line with `visibility: hidden` instead of unmounting it while telemetry is still loading. Pick whichever keeps the final screenshot identical (P0-02) and prove it.
- Acceptance: mobile CLS contribution from `.signal-band` ≤ 0.01.

**P4-02 · Lap strip placeholder** · `LapStrip.tsx`, `DashboardShell.tsx`
- While `lapsLoading` is true and there are no bars yet, render an empty `<section className="lap-strip" aria-hidden>` at the same height (same head row plus a 44/54px bars row) instead of `null`. When laps load, the real strip replaces it in place.
- Leave `bars.length < 2` with loading finished as `null` (today's behaviour).
- Acceptance: CLS sources no longer list `NAV.analysis-navigation` or `DIV.analysis-content` after load.

**P4-03 · Fallback font metrics (optional, no visible change after load)** · `fonts.css`
- Add `@font-face { font-family: 'Barlow Condensed Fallback'; src: local('Arial Narrow'), local('Arial'); size-adjust: …; ascent-override: … }` and put it in the `--font-brand` stack after Barlow. Only do this if P0-03 still shows a font-swap shift on the hero after P3-04. Safari ignores `ascent-override`; that's acceptable.

---

### Phase 5: Cross-browser and platform correctness

**P5-01 · Root error boundary** · `src/main.tsx`
- Wrap the app in the existing `ErrorBoundary` (label "Dashboard"). Today only the tab body is covered, so any effect error in the container blanks the page (this is how F2 manifests in Safari).

**P5-02 · Full-screen only where supported** · `ChartPanel.tsx`
- Render the full-screen menu item only when `document.fullscreenEnabled` is true (it is false on iPhone Safari).
- Wrap `requestFullscreen()` and `exitFullscreen()` in try/catch, since both return promises that can reject (permissions, iframes without `allowfullscreen`).
- Acceptance: on WebKit at 390px there's no full-screen item and no console error; on desktop it works as today.

**P5-03 · Dynamic viewport height** · `index.css:136`, `DashboardShell.tsx` (`min-h-screen`)
- `#root { min-height: 100vh; min-height: 100dvh; }`. Replace `min-h-screen` with `min-h-dvh` (Tailwind v4 has it). Identical on desktop; no phantom scroll on iOS.

**P5-04 · Timing tower semantics in Safari** · `TimingTower.tsx`
- Rows use `display:grid`, which drops table semantics in WebKit and VoiceOver. Add explicit roles: `role="table"` on `<table>`, `role="row"` on `<tr>`, `role="columnheader"` on `<th scope=col>`, `role="rowheader"` on the row `<th>`, `role="cell"` on `<td>`. No CSS change.
- Acceptance: the Safari accessibility inspector shows a table with 6 columns.

**P5-05 · Hover styles only on hover-capable devices** · `index.css`
- Tailwind v4 `hover:` utilities are already wrapped in `@media (hover:hover)`, but the hand-written `:hover` rules are not, so on iOS and Android the accent colour sticks after a tap (tab strip, lap-strip bars, card-bar buttons, next views, tower and sector rows).
- Wrap those rules in `@media (hover: hover) { … }`. Desktop is pixel-identical.

**P5-06 · Chart export resolves CSS variables** · `src/utils/exportChart.ts`
- Axis, grid and several series use `stroke="var(--…)"` / `fill="var(--…)"`. In a downloaded standalone `.svg` those variables are undefined, so they render black or disappear, in every viewer.
- Before serializing, walk the clone and replace any `var(--x)` attribute value with `getComputedStyle(document.documentElement).getPropertyValue('--x')`, falling back to the attribute's computed style.
- Acceptance: download "Speed Trace" in both themes, open the file in Safari, Chrome and Firefox: grid, ticks and lines are coloured like the screen.

**P5-07 · ⚠ VISIBLE (mobile only) · iOS input zoom**
- `.preset-controls input` (13px) and the Incidents search (`text-sm`, 14px) make iOS Safari zoom the page on focus, and it doesn't zoom back.
- Fix: `@supports (-webkit-touch-callout: none) { .preset-controls input, #incidents-search { font-size: 16px; } }`, scoped to iOS so desktop and Android don't change. **Needs owner OK.**

---

### Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)

Every item is a deletion or a merge with no behaviour change. Run `npx knip` (it found the items marked ✓) and `npm run ci` after each.

**P6-01 · Delete the dead `icon` prop.** `Panel` (`shared.tsx:108-140`) never renders `icon`, and `ChartPanel` only forwards it. Remove the prop from both types and remove every `icon={<… />}` and the now-unused `lucide-react` imports (Gauge, Timer, Activity, Map, Zap, CircleDot, Headphones, Flag, Sun, TrendingDown, Tv2, LayoutGrid…). Keep icons that actually render (toolbar buttons, theme toggle, chevrons, etc.). Zero visual change.

**P6-02 · One clipboard helper.** `shareSnapshot`, `embedSnapshot` and `handleEmbedPanel` in `DashboardContainer.tsx` repeat the same clipboard → prompt fallback. Extract one `copyWithFallback(text, label, promptTitle)` in the same file; keep `navigator.share` only in the share path.

**P6-03 · One tab order.** `TABS` (`DashboardTabs.tsx`), `ORDER` (`NextViews.tsx`), `VALID_TABS` (`useDashboardFilters.ts`) and `LAP_TABS` (`DashboardShell.tsx`) are four hand-maintained lists. Export `TAB_ORDER` from `tabLabels.ts` and reuse it (`VALID_TABS` only needs membership, so order doesn't matter there).

**P6-04 · One sector classifier.** `TelemetryTab.tsx:73` rebuilds sector classes with `classifySectorEntries` while `BroadcastTab` uses `buildSectorAnalysis` for the same thing. Use `useMemo(() => buildSectorAnalysis(sectorRows), [sectorRows])` in TelemetryTab.

**P6-05 · No redundant sorts or gaps.** `lapSummaries` is already sorted by lap time with `gapToLeader` filled in. `BroadcastTab`'s `sorted` should only `filter` (drop the sort), and `TimingTower` should use `summary.gapToLeader` instead of recomputing from `leaderTime` (drop the `leaderTime` prop). Output must be identical, including the `LEADER` badge.

**P6-06 · Single-pass lap summaries.** `useDashboardViewModel.ts:224-250` makes 7 passes over the telemetry, 4 of them `Math.max(...arr.map())`. Use one loop. Delete `avgSpeed` (computed, never displayed; remove it from `DriverLapSummary` in `types.ts` and from the tests' fixtures).

**P6-07 · One lap-window URL.** `getLocationForLap` and `getCarDataForLap` in `openf1.ts` are the same function with a different endpoint. Keep one private `getLapWindow<T>(endpoint, …)` and two one-line exports. Also fold `buildUrlWithDateFilters` into `buildUrl` with an optional `dateFilters` argument (the param loop is duplicated).

**P6-08 · Dead props and branches.**
- `DashboardTabs` accepts `embedMode`, `onShareTab` and `onEmbedTab` and ignores them; remove them from the type and the call site.
- Remove `DriverSelector`'s unused `embedMode`.
- `DashboardSelectors` has an `embedMode ? <details className="embed-scope">` branch, but the Shell never renders selectors in embed mode. Remove the branch, the prop and any `.embed-scope` CSS.
- `StrategyTab`'s `COMPOUND_COLORS = { ...COLORS.compound }` is a pointless copy; use `COLORS.compound`.

**P6-09 · Dead exports ✓ (knip).** Delete `withAlpha` (colors.ts), `COLORS.mutedDot`, `COLORS.warning` (0 uses) and `COLORS.sector.three`. Un-export `SkeletonBlock`, `AXIS_FONT_SIZE` and `timesAtPathFractions` (they are used internally). Un-export the types `CornerMark`, `LapBarState`, `LapBar`, `PositionChartResult`, `TabLead` and `DashboardShellProps` only if no test imports them. Check `contrastRatio`: if only a test uses it, keep it (the test documents the contrast rule).

**P6-10 · CSS dedupe** · `src/index.css` (no visual change; the P0-02 diff must be clean)
- Delete the second `.embed-mode .analysis-content` and `.embed-mode .dashboard-chart-actions` (lines ~903/904 and ~1065/1066 are duplicates; keep one pair).
- Merge the three `.brand` blocks and the two `.utility-menu > summary`, `.dashboard-chart-legend`, `.dashboard-chart-legend-item` and `.chart-tooltip` blocks into one each, keeping the **final** computed values.
- `.bc-sector-driver-cell`: delete the early `display:flex; align-items; gap` block (overridden to `table-cell` later). Also fold the later overrides of `.bc-sector-head`, `.bc-sector-th` and `.bc-sector-row` into their originals.
- `.bc-driver-card`: remove `transition: box-shadow …` (there is no box-shadow) and the no-op `box-shadow: none`.
- Delete unused tokens: `--paper-2`, `--paper-3`, `--ink-2`, `--accent-neutral`, `--teal`, `--color-muted-dot`, `--color-sector-three` (both themes).
- Delete the dark-theme re-declaration of `--font-body` / `--font-brand` (identical to `:root`).
- Fix the stray indentation at line ~375 (`.dashboard-chart-actions .utility-button > span`).
- Acceptance: CSS gzip smaller; P0-02 compare shows 0 diffs in all engines.

**P6-11 · Repo and deploy leftovers**
- Delete `public/index.html` (a CRA template with `%PUBLIC_URL%` and Google Fonts links; it is copied into `dist/` and then overwritten, which is a trap).
- Delete `src/assets/f1stories-logo.png` (56 KB) and `src/assets/f1stories-mark.svg` (identical to `public/favicon.svg`; neither is imported).
- Delete `check.sh` (it asserts files from a 2026-03 layout and just wraps `npm run ci`) and its README line.
- Delete `docs/rework/mockups/base.css` and `mock.js` ✓ knip; the HTML mockups reference them, so delete the whole `mockups/` folder or keep all of it. **Done**: the owner approved deleting `docs/rework/mockups/` (2026-09-30).
- `nextsteps.txt`: ✅ deleted by the owner's request (2026-09-30).
- `manifest.json`: it isn't linked and still has the old `#111113` colours. Link it from `index.html` with the colours updated to `#f2eee4`/`#181a1c`, point `icons` at `logo192.png` and `logo512.png`, and add `<link rel="apple-touch-icon" href="/logo192.png">` so Android and iOS home-screen installs look right. Losslessly compress `logo512.png` (210 KB; e.g. `npx @squoosh/cli --oxipng`) with pixel-identical output.
- Favicon: use `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` plus `<link rel="icon" href="/favicon.ico" sizes="any">` instead of the 33 KB PNG. **⚠ VISIBLE only in the browser tab.** Compare the SVG with the PNG side by side before switching; if they differ, keep the PNG.
- Header logo (`DashboardHeader.tsx`, a 36px `logo192.png`): add `width="36" height="36" decoding="async"`. Swap to the SVG only if it is visually identical.
- Add `.playwright-mcp/` and `.perf-baseline/` to `.gitignore`.
- Move `tailwindcss` and `@tailwindcss/vite` to `devDependencies` (build-only; hygiene).

---

### Phase 7: Close-out

**P7-01** Remove the P0-04 probe.
**P7-02** Run P0-03 → `.perf-baseline/metrics-after.json`. Put the before/after table in the PR description.
**P7-03** Run P0-02 `--compare` for all engines × viewports × themes → 0 unexpected diffs.
**P7-04** Manual smoke test on real devices if available (iPhone Safari, iPad Safari, Android Chrome): load, change lap by strip and keyboard, switch all tabs, theme toggle, share and embed copy, download chart, print preview.
**P7-05** `graphify update .` and `npm run ci`.

**Targets for the PR**

| Metric | Before | Target |
|---|---|---|
| Initial JS gzip | ~205 KB | ≤ 100 KB |
| `replaceState` on cold load / 15 lap steps | 18 / 28 | ≤ 6 / ≤ 15 |
| 429s on cold load | 5 | 0 |
| `car_data` requests for 15 rapid lap steps | 30 | ≤ 4 |
| Mobile CLS | ~0.126 | < 0.05 |
| Long tasks at 6× on tab switch | 53–99 ms | < 50 ms |
| Visual diffs | n/a | 0 |
| Tests | 94 green | all green (more is fine) |

---

## 5. Explicitly out of scope (don't do these)

- **Migrating to Recharts 3, or replacing Recharts with hand-rolled SVG.** It would be the biggest byte win, but it carries a high risk of visual drift. Revisit only as its own project with the P0-02 harness.
- **Service worker, offline mode, IndexedDB persistence.** YAGNI; the in-memory cache plus P2 covers it.
- **List virtualization.** The largest lists (radio, race control) are a few hundred rows of plain DOM.
- **CSS-in-JS or Tailwind rewrites** of the hand-written CSS. The CSS is fine apart from P6-10.
- **Changing the OpenF1 query format** (`date<=…+00:00`). It works in all engines as-is.
- **Hash-based cache headers.** GitHub Pages doesn't allow custom `Cache-Control`.

---

## 6. Risk notes for the executor

- P1-01..05 change hook identities. The main regression risk is **stale closures**: a memoized value that misses a dependency. Keep `eslint-plugin-react-hooks` at 0 warnings, and never silence `exhaustive-deps`.
- P1-04 changes a hook's parameter shape; update every test that builds those params.
- P2-02 must debounce only the *fetch key*. The selected lap shown in the UI stays instant.
- P3-01: if the Suspense fallback height doesn't match, you trade bundle size for CLS. Measure.
- P3-04: a preload URL that differs from the CSS URL by even `crossorigin` means a double download. Check the Network panel.
- P4-01: prove the finished-state screenshot is identical; only the loading state may differ.
- P6-10: merge CSS blocks by keeping the **last** declaration of each property (cascade order). Diff screenshots after the change.

---

## 7. Found during execution

(Sonnet: append new findings here with file:line and a proposed task ID; don't fix them without adding them to a phase first.)
