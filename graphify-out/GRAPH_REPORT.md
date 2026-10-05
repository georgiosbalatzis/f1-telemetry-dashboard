# Graph Report - f1-telemetry-dashboard  (2026-10-05)

## Corpus Check
- 152 files · ~656,471 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 4, .woff2 4, .css 3)

## Summary
- 1015 nodes · 2241 edges · 59 communities (53 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 109 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c709675`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)
- openf1.ts
- Telemetry / F1Stories Priority 1 shell audit
- /graphify skill
- types.ts
- Cookies
- TrackMapTab.tsx
- lib.mjs
- package.json
- compilerOptions
- devDependencies
- compilerOptions
- Release A
- LapStrip.tsx
- IntervalsTab.tsx
- vitest
- manifest.json
- Browser Automation with playwright-cli
- Test generation (plan → generate → heal)
- DashboardContainer.tsx
- Browser Session Management
- F1 Telemetry Dashboard README
- favicon.svg (F1 Stories App Icon)
- F1 Stories App Icon (512px)
- TelemetryTab.tsx
- F1 Stories App Icon (192px)
- tsconfig.json
- positionsUtils.ts
- Running Custom Playwright Code
- P2Polish.test.tsx
- DashboardShell.tsx
- robots.txt (allow all)
- 4. Phases and tasks
- Tracing
- useDashboardFilters.ts
- ErrorBoundary
- Race Desk in Telemetry
- copy.ts
- react
- SKILL.md
- Video Recording
- Advanced Mocking with run-code
- shared.tsx
- contract.ts
- Attaching Screenshots and Videos to Pull Requests
- PERFREDO: performance and cross-browser plan
- scripts
- Barlow Condensed SIL OFL 1.1 License
- IBM Plex Sans SIL OFL 1.1 License
- colors.ts
- readInitialThemeMode
- same-origin-deployment.md
- StrategyTab.tsx
- 3. Heal
- WeatherTab.tsx
- 2. Generate
- dependencies
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 38 edges
2. `vitest` - 30 edges
3. `copy` - 25 edges
4. `useDashboard()` - 25 edges
5. `useDriverContext()` - 22 edges
6. `DashboardContainer()` - 21 edges
7. `useFetch()` - 20 edges
8. `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` - 20 edges
9. `fetchJson()` - 19 edges
10. `Panel()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `1. Baseline (measured, production build, Chromium)` --references--> `DashboardContainer()`  [INFERRED]
  PERFREDO.md → src/components/DashboardContainer.tsx
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `LapBarState`  [INFERRED]
  PERFREDO.md → src/components/dashboard/lapStripUtils.ts
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `LapBar`  [INFERRED]
  PERFREDO.md → src/components/dashboard/lapStripUtils.ts
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `buildUrl()`  [INFERRED]
  PERFREDO.md → src/api/openf1.ts
- `Phase 2 status: ✅ DONE (P2-01..P2-06, 2026-09-30)` --references--> `takeSlot()`  [INFERRED]
  PERFREDO.md → src/api/openf1.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **npm run ci validation pipeline gating CI and Pages deploy** — _github_workflows_ci_ci_workflow, _github_workflows_deploy_deploy_to_github_pages, readme_npm_run_ci, readme_github_pages_deployment [EXTRACTED 1.00]
- **graphify extraction pipeline stages** — _claude_skills_graphify_skill_structural_ast_extraction, _claude_skills_graphify_skill_semantic_subagent_extraction, _claude_skills_graphify_skill_ast_semantic_merge, _claude_skills_graphify_skill_community_labeling, _claude_skills_graphify_skill_shrink_guard, _claude_skills_graphify_skill_graph_health_check, _claude_skills_graphify_skill_manifest_stamping [EXTRACTED 1.00]
- **Graph rebuild triggers (update, watch, hook, add)** — _claude_skills_graphify_references_update_incremental_update, _claude_skills_graphify_references_add_watch_watch_mode, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_add_watch_graphify_add, claude_graphify_update_after_changes [INFERRED 0.85]

## Communities (59 total, 6 thin omitted)

### Community 0 - "Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)"
Cohesion: 0.13
Nodes (18): 4. Phases and tasks, Phase 0: Safety net (no product code changes), Phase 0 status: ✅ DONE (2026-09-30), Phase 2: Network (F3), Phase 2 status: ✅ DONE (P2-01..P2-06, 2026-09-30), Phase 3: Loading and bundle (F4, F6, F9), Phase 3 status: ✅ DONE (P3-01..P3-06, 2026-09-30), Phase 4: Layout stability (F5), loading states only (+10 more)

### Community 1 - "openf1.ts"
Cohesion: 0.06
Nodes (70): msw, @testing-library/react, buildUrl(), combineSignals(), createTimeoutSignal(), fetchJson(), getCarDataForLap(), getDrivers() (+62 more)

### Community 2 - "Telemetry / F1Stories Priority 1 shell audit"
Cohesion: 0.22
Nodes (8): Files changed, Findings and changes, Intentionally unchanged, Later product localization, Priority 1 judgment, Requested sponsors bar follow-up, Telemetry / F1Stories Priority 1 shell audit, Validation

### Community 3 - "/graphify skill"
Cohesion: 0.10
Nodes (32): Project graphify skill registration (.claude/CLAUDE.md), /graphify add <url> ingestion, --watch folder auto-rebuild, Extra exports (wiki, Neo4j, FalkorDB, SVG, GraphML, MCP), Token reduction benchmark, Extraction subagent prompt spec, GitHub clone and cross-repo merge, graphify claude install (native CLAUDE.md integration) (+24 more)

### Community 4 - "types.ts"
Cohesion: 0.06
Nodes (50): 4. Publication contract, Phase 5: Headlines generated from the data, OpenF1CarData, OpenF1Stint, IndexedSectorTime, SectorAnalysisData, SectorClass, buildSectorAnalysis() (+42 more)

### Community 5 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 6 - "TrackMapTab.tsx"
Cohesion: 0.17
Nodes (20): OpenF1Location, MINI_SECTORS, Path, stretchPolylines(), stretchWinners(), timesAtPathFractions(), DriverMarker, mapPosition() (+12 more)

### Community 7 - "lib.mjs"
Cohesion: 0.05
Nodes (59): ref_node_assert, ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_http, ref_node_path, ref_node_url, ref_node_zlib (+51 more)

### Community 8 - "package.json"
Cohesion: 0.11
Nodes (18): name, packageManager, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks (+10 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 10 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, msw (+14 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 12 - "Release A"
Cohesion: 0.06
Nodes (31): E01–E03 implementation evidence, E01: fixtures and measured baseline, Findings, Validation and remaining scope, 1. The decision, 2. What exists today, 3. Scope and reader experience, 5. Tasks for Sonnet (+23 more)

### Community 13 - "LapStrip.tsx"
Cohesion: 0.27
Nodes (7): OpenF1Lap, fmt(), LapStrip, LapBar, lapBars(), LapBarState, safetyCarLaps()

### Community 14 - "IntervalsTab.tsx"
Cohesion: 0.16
Nodes (19): Telemetry repository, Phase 3: Navigation and section framing, ChartLegendItem, ChartPanel(), Props, Props, Props, CardGridSkeleton() (+11 more)

### Community 15 - "vitest"
Cohesion: 0.10
Nodes (25): vitest, cornerMarks(), points, localStorage, FigureData, FigureDriver, FigureGuide, figureLegend() (+17 more)

### Community 16 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, display, icons, id, name, scope, short_name, start_url (+1 more)

### Community 17 - "Browser Automation with playwright-cli"
Cohesion: 0.07
Nodes (27): Attaching screenshots and videos to pull requests, Browser Automation with playwright-cli, Browser Sessions, Commands, Core, DevTools, Emulation, Example: Debugging with DevTools (+19 more)

### Community 18 - "Test generation (plan → generate → heal)"
Cohesion: 0.17
Nodes (12): 0. How generation works, 1.1 Prerequisite: workspace, 1.2 Prerequisite: seed test, 1.3 Explore the app, 1.4 Write the spec file, 1. Planning, Add assertions manually, Building a test file (+4 more)

### Community 19 - "DashboardContainer.tsx"
Cohesion: 0.23
Nodes (14): Phase 1: Render stability (the root cause behind F1 and F2), Phase 6 status: ✅ DONE (P6-01..P6-11, 2026-09-30), buildDashboardUrl(), buildIframeSnippet(), DashboardContainer(), getClipboardErrorMessage(), isShareCancel(), readInitialEmbedMode() (+6 more)

### Community 20 - "Browser Session Management"
Cohesion: 0.10
Nodes (20): 1. Name Browser Sessions Semantically, 2. Always Clean Up, 3. Delete Stale Browser Data, A/B Testing Sessions, Attach by channel name, Attach via browser extension, Attach via CDP endpoint, Attaching to a Running Browser (+12 more)

### Community 21 - "F1 Telemetry Dashboard README"
Cohesion: 0.60
Nodes (6): CI Workflow (verify job), Deploy to GitHub Pages Workflow, Branch Discipline (main source, gh-pages deploy only), F1 Telemetry Dashboard README, GitHub Pages Deployment (/f1-telemetry-dashboard/ base), npm run ci validation script

### Community 22 - "favicon.svg (F1 Stories App Icon)"
Cohesion: 0.67
Nodes (4): favicon.svg (F1 Stories App Icon), Cyan X Accent (#6CCBFF, checkered-flag/finish motif), f1stories-gradient (coral #FF6847 to amber #FFB347 to cream #FFE2A3), Staggered Speed-Stripe Logo Mark (three slanted bars + dot)

### Community 23 - "F1 Stories App Icon (512px)"
Cohesion: 0.50
Nodes (4): F1 Stories App Icon (512px), F1 Stories Brand, PWA Manifest Icon, Red F1 Car Badge Emblem (navy arch, cream text)

### Community 24 - "TelemetryTab.tsx"
Cohesion: 0.18
Nodes (24): E03: shared plots and container sizing, recharts, AXIS_TICK, AXIS_TICK_SOFT, CHART_MARGIN, evenTicks(), formatLapAxis(), formatPedalAxis() (+16 more)

### Community 25 - "F1 Stories App Icon (192px)"
Cohesion: 1.00
Nodes (3): F1 Stories App Icon (192px), F1 Stories Brand, Red F1 Car Badge Emblem

### Community 27 - "positionsUtils.ts"
Cohesion: 0.43
Nodes (4): OpenF1Position, buildPositionChartData(), MAX_CHART_POINTS, nearestPerBucket()

### Community 28 - "Running Custom Playwright Code"
Cohesion: 0.15
Nodes (13): Clipboard, Complex Workflows, Error Handling, File Downloads, Frames and Iframes, Geolocation, JavaScript Execution, Media Emulation (+5 more)

### Community 29 - "P2Polish.test.tsx"
Cohesion: 0.18
Nodes (17): OpenF1RaceControl, OpenF1TeamRadio, flagTone(), IncidentsTab, Props, toneOf(), Props, RadioTab (+9 more)

### Community 30 - "DashboardShell.tsx"
Cohesion: 0.15
Nodes (14): lucide-react, CardBar(), formatDrsState(), ComparisonDriver, SignalBand, standIn(), BroadcastTab, EnergyTab (+6 more)

### Community 32 - "4. Phases and tasks"
Cohesion: 0.13
Nodes (14): 1. Decisions (agreed 2026-09-30), 2. Why it looks disjoint today (diagnosis), 3. Target design spec (A + B card + C strip), 4. Phases and tasks, 5. Suggested PR slicing, 6. Risks and notes, 7. Optional follow-ups in f1StoriesPage (not in scope), F1 Stories Telemetry: Rework Tasks (+6 more)

### Community 34 - "Tracing"
Cohesion: 0.12
Nodes (16): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Analyzing Performance, Basic Usage, Best Practices, Capturing Evidence, Debugging Failed Actions, Limitations (+8 more)

### Community 35 - "useDashboardFilters.ts"
Cohesion: 0.17
Nodes (18): NextViews(), TAB_LABELS, TAB_ORDER, Tab, CURRENT_YEAR, parseBoundedInt(), parseCircuit(), parseDriverNumber() (+10 more)

### Community 36 - "ErrorBoundary"
Cohesion: 0.13
Nodes (9): Vite HTML entry (F1 Stories / Telemetry), Phase 5: Cross-browser and platform correctness, Phase 5 status: ✅ DONE (P5-07 and P5-06b added 2026-10-01), react-dom, @testing-library/user-event, ErrorBoundary, Props, State (+1 more)

### Community 37 - "Race Desk in Telemetry"
Cohesion: 0.50
Nodes (3): Destinations, Race Desk in Telemetry, Visual rules

### Community 38 - "copy.ts"
Cohesion: 0.15
Nodes (15): OpenF1Meeting, DashboardHeader, NavCountdown(), Props, formatCountdown(), pickNextMeeting(), SiteFooter(), sponsors (+7 more)

### Community 39 - "react"
Cohesion: 0.24
Nodes (9): Phase 1 status: ✅ DONE (P1-01..P1-07, 2026-09-30), react, BRAKE_DASH, DriverProvider(), DriverProviderProps, LINE_DASH, DriverContext, DriverContextValue (+1 more)

### Community 40 - "SKILL.md"
Cohesion: 0.21
Nodes (4): Examples, Inspecting Element Attributes, Debugging Playwright Tests, Running Playwright Tests

### Community 41 - "Video Recording"
Cohesion: 0.20
Nodes (10): 1. Use Descriptive Filenames, 2. Record entire hero scripts., 3. Attach the recording to the pull request, Basic Recording, Best Practices, Cursor, Target Highlight and Click Point, Limitations, Overlay API Summary (+2 more)

### Community 42 - "Advanced Mocking with run-code"
Cohesion: 0.22
Nodes (8): Advanced Mocking with run-code, CLI Route Commands, Conditional Response Based on Request, Delayed Response, Modify Real Response, Request Mocking, Simulate Network Failures, URL Patterns

### Community 43 - "shared.tsx"
Cohesion: 0.24
Nodes (10): OpenF1Driver, DriverSelector, Props, ChartTip(), ChartTipPayload, DriverChip(), fixedValue(), TIP_PRECISION (+2 more)

### Community 44 - "contract.ts"
Cohesion: 0.10
Nodes (36): Audit and convergence, Focus and contrast, Preserved visualization semantics and exceptions, Raw-color inventory, Telemetry design tokens — Priority 4C, Verification and next product, E02: pure links and publication contract, array() (+28 more)

### Community 45 - "Attaching Screenshots and Videos to Pull Requests"
Cohesion: 0.40
Nodes (5): Attaching Screenshots and Videos to Pull Requests, From a local session, From CI, Limits, When to attach

### Community 46 - "PERFREDO: performance and cross-browser plan"
Cohesion: 0.22
Nodes (8): 0. How to use this file (read first, Sonnet), 1. Baseline (measured, production build, Chromium), 2. Support matrix (make it explicit), 3. Findings by severity, 5. Explicitly out of scope (don't do these), 6. Risk notes for the executor, 7. Found during execution, PERFREDO: performance and cross-browser plan

### Community 47 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, build:f1stories, check:tokens, ci, dev, lint, preview (+4 more)

### Community 50 - "colors.ts"
Cohesion: 0.60
Nodes (5): chartColorForTheme(), contrastRatio(), LIGHT_CHART_BACKGROUND, parseHex(), relativeLuminance()

### Community 51 - "readInitialThemeMode"
Cohesion: 0.25
Nodes (7): F1Stories contract, Origins: same contract, not yet shared state, Telemetry, Theme persistence, Phase 0: Foundations, normalizeThemeMode(), readInitialThemeMode()

### Community 53 - "StrategyTab.tsx"
Cohesion: 0.22
Nodes (9): OpenF1Pit, TableSkeleton(), PitStopCard, Props, stintCountLabel(), StrategyRow, StrategyTab, TyreLifeCard (+1 more)

### Community 54 - "3. Heal"
Cohesion: 0.33
Nodes (6): 3.1 Find failing tests, 3.2 Debug one failure, 3.3 Apply the fix, 3.4 Reconcile with the spec, 3.5 Iteration and giving up, 3. Heal

### Community 55 - "WeatherTab.tsx"
Cohesion: 0.33
Nodes (5): OpenF1Weather, Err(), AUX_TRACES, Props, WeatherTab

### Community 56 - "2. Generate"
Cohesion: 0.40
Nodes (5): 2.1 Inputs, 2.2 Generate one scenario, 2.3 Generate multiple scenarios, 2.4 Run generated tests, 2. Generate

### Community 57 - "dependencies"
Cohesion: 0.40
Nodes (5): dependencies, lucide-react, react, react-dom, recharts

### Community 58 - "vite.config.ts"
Cohesion: 0.40
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

## Knowledge Gaps
- **397 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+392 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 451 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `openf1.ts`, `useDashboardFilters.ts`, `types.ts`, `ErrorBoundary`, `copy.ts`, `TrackMapTab.tsx`, `package.json`, `shared.tsx`, `LapStrip.tsx`, `IntervalsTab.tsx`, `DashboardContainer.tsx`, `StrategyTab.tsx`, `WeatherTab.tsx`, `TelemetryTab.tsx`, `P2Polish.test.tsx`, `DashboardShell.tsx`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `playwright` connect `lib.mjs` to `package.json`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `openf1.ts`, `useDashboardFilters.ts`, `types.ts`, `ErrorBoundary`, `copy.ts`, `TrackMapTab.tsx`, `package.json`, `react`, `contract.ts`, `LapStrip.tsx`, `vite.config.ts`, `positionsUtils.ts`, `P2Polish.test.tsx`, `DashboardShell.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useDashboard()` (e.g. with `[x] E03 — Share the two chart renderers without dashboard side effects` and `Phase 1: Render stability (the root cause behind F1 and F2)`) actually correct?**
  _`useDashboard()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _397 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` be split into smaller, more focused modules?**
  _Cohesion score 0.13071895424836602 - nodes in this community are weakly interconnected._
- **Should `openf1.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06419753086419754 - nodes in this community are weakly interconnected._