# Graph Report - f1-telemetry-dashboard  (2026-09-30)

## Corpus Check
- 125 files · ~442,821 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 4, .woff2 4, .css 2)

## Summary
- 856 nodes · 1896 edges · 53 communities (43 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ad82ffc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ErrorBoundary
- openf1.ts
- TelemetryTab.tsx
- /graphify skill
- BroadcastTab.tsx
- Cookies
- TrackMapTab.tsx
- lib.mjs
- package.json
- compilerOptions
- devDependencies
- compilerOptions
- DashboardContainer.tsx
- useDashboardFilters.ts
- Trace Output Files
- element-attributes.md
- manifest.json
- Browser Automation with playwright-cli
- 3. Heal
- DashboardShell.tsx
- Browser Session Management
- F1 Telemetry Dashboard README
- favicon.svg (F1 Stories App Icon)
- F1 Stories App Icon (512px)
- fmtLap
- F1 Stories App Icon (192px)
- tsconfig.json
- check.sh
- Running Custom Playwright Code
- headlines.ts
- SectorAnalysis.tsx
- robots.txt (allow all)
- 4. Phases and tasks
- Tracing
- exportChart.ts
- Phase 3: Loading and bundle (F4, F6, F9)
- scripts
- PERFREDO: performance and cross-browser plan
- Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)
- SKILL.md
- Video Recording
- Advanced Mocking with run-code
- dependencies
- openf1.integration.test.ts
- Attaching Screenshots and Videos to Pull Requests
- vite.config.ts
- 4. Phases and tasks
- Barlow Condensed SIL OFL 1.1 License
- IBM Plex Sans SIL OFL 1.1 License
- DriverContext.tsx
- positionsUtils.test.ts
- @testing-library/jest-dom

## God Nodes (most connected - your core abstractions)
1. `react` - 37 edges
2. `copy` - 23 edges
3. `vitest` - 22 edges
4. `useDriverContext()` - 22 edges
5. `useDashboard()` - 22 edges
6. `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` - 22 edges
7. `lucide-react` - 20 edges
8. `useFetch()` - 20 edges
9. `fetchJson()` - 19 edges
10. `compilerOptions` - 18 edges

## Surprising Connections (you probably didn't know these)
- `1. Baseline (measured, production build, Chromium)` --references--> `DashboardContainer()`  [INFERRED]
  PERFREDO.md → src/components/DashboardContainer.tsx
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `LapBarState`  [INFERRED]
  PERFREDO.md → src/components/dashboard/lapStripUtils.ts
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `LapBar`  [INFERRED]
  PERFREDO.md → src/components/dashboard/lapStripUtils.ts
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `buildUrl()`  [INFERRED]
  PERFREDO.md → src/api/openf1.ts
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `buildUrlWithDateFilters()`  [INFERRED]
  PERFREDO.md → src/api/openf1.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **npm run ci validation pipeline gating CI and Pages deploy** — _github_workflows_ci_ci_workflow, _github_workflows_deploy_deploy_to_github_pages, readme_npm_run_ci, readme_github_pages_deployment [EXTRACTED 1.00]
- **graphify extraction pipeline stages** — _claude_skills_graphify_skill_structural_ast_extraction, _claude_skills_graphify_skill_semantic_subagent_extraction, _claude_skills_graphify_skill_ast_semantic_merge, _claude_skills_graphify_skill_community_labeling, _claude_skills_graphify_skill_shrink_guard, _claude_skills_graphify_skill_graph_health_check, _claude_skills_graphify_skill_manifest_stamping [EXTRACTED 1.00]
- **Graph rebuild triggers (update, watch, hook, add)** — _claude_skills_graphify_references_update_incremental_update, _claude_skills_graphify_references_add_watch_watch_mode, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_add_watch_graphify_add, claude_graphify_update_after_changes [INFERRED 0.85]

## Communities (53 total, 10 thin omitted)

### Community 0 - "ErrorBoundary"
Cohesion: 0.18
Nodes (5): Phase 5: Cross-browser and platform correctness, @testing-library/user-event, ErrorBoundary, Props, State

### Community 1 - "openf1.ts"
Cohesion: 0.06
Nodes (76): Phase 2: Network (F3), buildUrl(), buildUrlWithDateFilters(), combineSignals(), createTimeoutSignal(), fetchJson(), getCarDataForLap(), getDrivers() (+68 more)

### Community 2 - "TelemetryTab.tsx"
Cohesion: 0.06
Nodes (85): lucide-react, react, recharts, @testing-library/react, Phase 3: Navigation and section framing, OpenF1Driver, TimingTowerProps, AXIS_FONT_SIZE (+77 more)

### Community 3 - "/graphify skill"
Cohesion: 0.10
Nodes (32): Project graphify skill registration (.claude/CLAUDE.md), /graphify add <url> ingestion, --watch folder auto-rebuild, Extra exports (wiki, Neo4j, FalkorDB, SVG, GraphML, MCP), Token reduction benchmark, Extraction subagent prompt spec, GitHub clone and cross-repo merge, graphify claude install (native CLAUDE.md integration) (+24 more)

### Community 4 - "BroadcastTab.tsx"
Cohesion: 0.19
Nodes (10): SpeedTrap(), SpeedTrapProps, Props, GapCard(), signed(), buildGapCards(), GapCardData, DriverLapSummary (+2 more)

### Community 5 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 6 - "TrackMapTab.tsx"
Cohesion: 0.15
Nodes (21): vitest, OpenF1Location, points, MINI_SECTORS, Path, stretchPolylines(), stretchWinners(), timesAtPathFractions() (+13 more)

### Community 7 - "lib.mjs"
Cohesion: 0.08
Nodes (39): ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_path, ref_node_url, ref_node_zlib, playwright, arg() (+31 more)

### Community 8 - "package.json"
Cohesion: 0.12
Nodes (18): name, packageManager, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks (+10 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 10 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, msw (+12 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 12 - "DashboardContainer.tsx"
Cohesion: 0.20
Nodes (17): Phase 0: Foundations, buildDashboardUrl(), buildIframeSnippet(), DashboardContainer(), getClipboardErrorMessage(), isShareCancel(), normalizeThemeMode(), readInitialEmbedMode() (+9 more)

### Community 13 - "useDashboardFilters.ts"
Cohesion: 0.20
Nodes (16): CURRENT_YEAR, DashboardFilterSnapshot, parseBoundedInt(), parseCircuit(), parseDriverNumber(), parseDriverNumbers(), parseLapNumber(), parseSessionKey() (+8 more)

### Community 14 - "Trace Output Files"
Cohesion: 0.50
Nodes (4): `resources/`, Trace Output Files, `trace-{timestamp}.network`, `trace-{timestamp}.trace`

### Community 16 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 17 - "Browser Automation with playwright-cli"
Cohesion: 0.07
Nodes (27): Attaching screenshots and videos to pull requests, Browser Automation with playwright-cli, Browser Sessions, Commands, Core, DevTools, Emulation, Example: Debugging with DevTools (+19 more)

### Community 18 - "3. Heal"
Cohesion: 0.09
Nodes (23): 0. How generation works, 1.1 Prerequisite: workspace, 1.2 Prerequisite: seed test, 1.3 Explore the app, 1.4 Write the spec file, 1. Planning, 2.1 Inputs, 2.2 Generate one scenario (+15 more)

### Community 19 - "DashboardShell.tsx"
Cohesion: 0.06
Nodes (41): OpenF1Meeting, OpenF1RaceControl, CardBar(), DashboardHeader, NavCountdown(), Props, DashboardSelectors, Props (+33 more)

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

### Community 24 - "fmtLap"
Cohesion: 0.40
Nodes (5): Phase 4: Data surfaces, DriverCards(), TimingTower(), SummaryStrip(), fmtLap()

### Community 25 - "F1 Stories App Icon (192px)"
Cohesion: 1.00
Nodes (3): F1 Stories App Icon (192px), F1 Stories Brand, Red F1 Car Badge Emblem

### Community 28 - "Running Custom Playwright Code"
Cohesion: 0.15
Nodes (13): Clipboard, Complex Workflows, Error Handling, File Downloads, Frames and Iframes, Geolocation, JavaScript Execution, Media Emulation (+5 more)

### Community 29 - "headlines.ts"
Cohesion: 0.18
Nodes (13): Phase 5: Headlines generated from the data, OpenF1Stint, buildHeadline(), Headline, HeadlineContext, lapHeadline(), PLACE, positionsHeadline() (+5 more)

### Community 30 - "SectorAnalysis.tsx"
Cohesion: 0.30
Nodes (7): IndexedSectorTime, SectorAnalysisData, SectorClass, SECTOR_STYLE, DriverCardsProps, SectorAnalysis(), SectorAnalysisProps

### Community 32 - "4. Phases and tasks"
Cohesion: 0.14
Nodes (13): 1. Decisions (agreed 2026-09-30), 2. Why it looks disjoint today (diagnosis), 3. Target design spec (A + B card + C strip), 4. Phases and tasks, 5. Suggested PR slicing, 6. Risks and notes, 7. Optional follow-ups in f1StoriesPage (not in scope), F1 Stories Telemetry: Rework Tasks (+5 more)

### Community 34 - "Tracing"
Cohesion: 0.17
Nodes (12): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Analyzing Performance, Basic Usage, Best Practices, Capturing Evidence, Debugging Failed Actions, Limitations (+4 more)

### Community 35 - "exportChart.ts"
Cohesion: 0.39
Nodes (7): appendLegend(), buildExportMarkup(), downloadSvg(), exportChartAsSvg(), ExportChartLegendItem, ExportChartOptions, getChartDimensions()

### Community 36 - "Phase 3: Loading and bundle (F4, F6, F9)"
Cohesion: 0.25
Nodes (8): Vite HTML entry (F1 Stories / Telemetry), Phase 3: Loading and bundle (F4, F6, F9), Legacy CRA public/index.html template, react-dom, App(), TabLoadingPlaceholder(), F1TelemetryDashboard(), src_index

### Community 37 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, ci, dev, lint, preview, test, test:ui (+2 more)

### Community 38 - "PERFREDO: performance and cross-browser plan"
Cohesion: 0.22
Nodes (8): 0. How to use this file (read first, Sonnet), 1. Baseline (measured, production build, Chromium), 2. Support matrix (make it explicit), 3. Findings by severity, 5. Explicitly out of scope (don't do these), 6. Risk notes for the executor, 7. Found during execution, PERFREDO: performance and cross-browser plan

### Community 39 - "Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)"
Cohesion: 0.22
Nodes (10): Phase 6: Remove redundancy and dead code (F8, F10, F11, F12), buildSectorAnalysis(), classifySectorEntries(), BroadcastTab, CornerMark, DashboardTabs(), PositionChartResult, TabLead (+2 more)

### Community 41 - "Video Recording"
Cohesion: 0.20
Nodes (10): 1. Use Descriptive Filenames, 2. Record entire hero scripts., 3. Attach the recording to the pull request, Basic Recording, Best Practices, Cursor, Target Highlight and Click Point, Limitations, Overlay API Summary (+2 more)

### Community 42 - "Advanced Mocking with run-code"
Cohesion: 0.22
Nodes (8): Advanced Mocking with run-code, CLI Route Commands, Conditional Response Based on Request, Delayed Response, Modify Real Response, Request Mocking, Simulate Network Failures, URL Patterns

### Community 43 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, lucide-react, react, react-dom, recharts, tailwindcss, @tailwindcss/vite

### Community 44 - "openf1.integration.test.ts"
Cohesion: 0.50
Nodes (3): msw, fakeMeeting, server

### Community 45 - "Attaching Screenshots and Videos to Pull Requests"
Cohesion: 0.40
Nodes (5): Attaching Screenshots and Videos to Pull Requests, From a local session, From CI, Limits, When to attach

### Community 47 - "4. Phases and tasks"
Cohesion: 0.29
Nodes (8): 4. Phases and tasks, Phase 0: Safety net (no product code changes), Phase 0 status: ✅ DONE (2026-09-30), Phase 1: Render stability (the root cause behind F1 and F2), Phase 1 status: ✅ DONE (P1-01..P1-07, 2026-09-30), Phase 4: Layout stability (F5), loading states only, Phase 7: Close-out, DriverProvider()

### Community 50 - "DriverContext.tsx"
Cohesion: 0.36
Nodes (6): BRAKE_DASH, DriverProviderProps, LINE_DASH, DriverContext, DriverContextValue, DriverDash

### Community 51 - "positionsUtils.test.ts"
Cohesion: 0.43
Nodes (3): OpenF1Position, buildPositionChartData(), MAX_CHART_POINTS

## Knowledge Gaps
- **334 isolated node(s):** `check.sh script`, `name`, `private`, `version`, `type` (+329 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 377 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `TelemetryTab.tsx` to `ErrorBoundary`, `openf1.ts`, `BroadcastTab.tsx`, `Phase 3: Loading and bundle (F4, F6, F9)`, `TrackMapTab.tsx`, `package.json`, `DashboardContainer.tsx`, `useDashboardFilters.ts`, `DriverContext.tsx`, `DashboardShell.tsx`, `headlines.ts`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `playwright` connect `lib.mjs` to `package.json`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `vitest` connect `TrackMapTab.tsx` to `ErrorBoundary`, `openf1.ts`, `TelemetryTab.tsx`, `BroadcastTab.tsx`, `package.json`, `openf1.integration.test.ts`, `useDashboardFilters.ts`, `vite.config.ts`, `DashboardShell.tsx`, `positionsUtils.test.ts`, `headlines.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useDriverContext()` (e.g. with `Phase 1: Render stability (the root cause behind F1 and F2)` and `Phase 1 status: ✅ DONE (P1-01..P1-07, 2026-09-30)`) actually correct?**
  _`useDriverContext()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `check.sh script`, `name`, `private` to the rest of the system?**
  _334 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `openf1.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06179775280898876 - nodes in this community are weakly interconnected._
- **Should `TelemetryTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06288573811509592 - nodes in this community are weakly interconnected._