# Graph Report - f1-telemetry-dashboard  (2026-09-30)

## Corpus Check
- 127 files · ~446,185 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 4, .woff2 4, .css 2)

## Summary
- 866 nodes · 1931 edges · 43 communities (33 shown, 10 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `730cc66e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 4. Phases and tasks
- openf1.ts
- TelemetryTab.tsx
- /graphify skill
- types.ts
- Cookies
- TrackMapTab.tsx
- perf-metrics.mjs
- package.json
- compilerOptions
- devDependencies
- compilerOptions
- scripts
- dependencies
- Trace Output Files
- vite.config.ts
- manifest.json
- Browser Automation with playwright-cli
- 3. Heal
- DashboardContainer.tsx
- Browser Session Management
- F1 Telemetry Dashboard README
- favicon.svg (F1 Stories App Icon)
- F1 Stories App Icon (512px)
- vitest
- F1 Stories App Icon (192px)
- tsconfig.json
- check.sh
- Running Custom Playwright Code
- element-attributes.md
- DashboardShell.tsx
- robots.txt (allow all)
- 4. Phases and tasks
- Tracing
- exportChart.ts
- @testing-library/jest-dom
- SKILL.md
- Video Recording
- Advanced Mocking with run-code
- Attaching Screenshots and Videos to Pull Requests
- Barlow Condensed SIL OFL 1.1 License
- IBM Plex Sans SIL OFL 1.1 License

## God Nodes (most connected - your core abstractions)
1. `react` - 38 edges
2. `vitest` - 25 edges
3. `useDashboard()` - 24 edges
4. `copy` - 23 edges
5. `useDriverContext()` - 22 edges
6. `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` - 22 edges
7. `lucide-react` - 20 edges
8. `fetchJson()` - 20 edges
9. `useFetch()` - 20 edges
10. `DashboardContainer()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `CornerMark`  [INFERRED]
  PERFREDO.md → src/components/dashboard/cornerMarks.ts
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

## Communities (43 total, 10 thin omitted)

### Community 0 - "4. Phases and tasks"
Cohesion: 0.07
Nodes (25): Vite HTML entry (F1 Stories / Telemetry), 4. Phases and tasks, Phase 0: Safety net (no product code changes), Phase 0 status: ✅ DONE (2026-09-30), Phase 2: Network (F3), Phase 2 status: ✅ DONE (P2-01..P2-06, 2026-09-30), Phase 3: Loading and bundle (F4, F6, F9), Phase 3 status: ✅ DONE (P3-01..P3-06, 2026-09-30) (+17 more)

### Community 1 - "openf1.ts"
Cohesion: 0.06
Nodes (75): buildUrl(), buildUrlWithDateFilters(), combineSignals(), createTimeoutSignal(), fetchJson(), getCarDataForLap(), getDrivers(), getIntervals() (+67 more)

### Community 2 - "TelemetryTab.tsx"
Cohesion: 0.06
Nodes (86): Phase 1 status: ✅ DONE (P1-01..P1-07, 2026-09-30), lucide-react, react, recharts, @testing-library/react, Phase 3: Navigation and section framing, OpenF1Driver, AXIS_FONT_SIZE (+78 more)

### Community 3 - "/graphify skill"
Cohesion: 0.10
Nodes (32): Project graphify skill registration (.claude/CLAUDE.md), /graphify add <url> ingestion, --watch folder auto-rebuild, Extra exports (wiki, Neo4j, FalkorDB, SVG, GraphML, MCP), Token reduction benchmark, Extraction subagent prompt spec, GitHub clone and cross-repo merge, graphify claude install (native CLAUDE.md integration) (+24 more)

### Community 4 - "types.ts"
Cohesion: 0.07
Nodes (46): Phase 6: Remove redundancy and dead code (F8, F10, F11, F12), Phase 5: Headlines generated from the data, OpenF1Stint, IndexedSectorTime, SectorAnalysisData, SectorClass, buildSectorAnalysis(), classifySectorEntries() (+38 more)

### Community 5 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 6 - "TrackMapTab.tsx"
Cohesion: 0.17
Nodes (20): OpenF1Location, MINI_SECTORS, Path, stretchPolylines(), stretchWinners(), timesAtPathFractions(), DriverMarker, mapPosition() (+12 more)

### Community 7 - "perf-metrics.mjs"
Cohesion: 0.09
Nodes (37): ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_path, ref_node_url, ref_node_zlib, playwright, arg() (+29 more)

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

### Community 12 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, ci, dev, lint, preview, test, test:ui (+2 more)

### Community 13 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, lucide-react, react, react-dom, recharts, tailwindcss, @tailwindcss/vite

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

### Community 19 - "DashboardContainer.tsx"
Cohesion: 0.07
Nodes (45): 0. How to use this file (read first, Sonnet), 1. Baseline (measured, production build, Chromium), 2. Support matrix (make it explicit), 3. Findings by severity, 5. Explicitly out of scope (don't do these), 6. Risk notes for the executor, 7. Found during execution, PERFREDO: performance and cross-browser plan (+37 more)

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

### Community 24 - "vitest"
Cohesion: 0.22
Nodes (7): msw, vitest, fakeMeeting, server, CornerMark, cornerMarks(), points

### Community 25 - "F1 Stories App Icon (192px)"
Cohesion: 1.00
Nodes (3): F1 Stories App Icon (192px), F1 Stories Brand, Red F1 Car Badge Emblem

### Community 28 - "Running Custom Playwright Code"
Cohesion: 0.15
Nodes (13): Clipboard, Complex Workflows, Error Handling, File Downloads, Frames and Iframes, Geolocation, JavaScript Execution, Media Emulation (+5 more)

### Community 30 - "DashboardShell.tsx"
Cohesion: 0.06
Nodes (43): OpenF1Lap, OpenF1Meeting, OpenF1RaceControl, CardBar(), DashboardHeader, NavCountdown(), Props, DashboardSelectors (+35 more)

### Community 32 - "4. Phases and tasks"
Cohesion: 0.13
Nodes (14): 1. Decisions (agreed 2026-09-30), 2. Why it looks disjoint today (diagnosis), 3. Target design spec (A + B card + C strip), 4. Phases and tasks, 5. Suggested PR slicing, 6. Risks and notes, 7. Optional follow-ups in f1StoriesPage (not in scope), F1 Stories Telemetry: Rework Tasks (+6 more)

### Community 34 - "Tracing"
Cohesion: 0.17
Nodes (12): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Analyzing Performance, Basic Usage, Best Practices, Capturing Evidence, Debugging Failed Actions, Limitations (+4 more)

### Community 35 - "exportChart.ts"
Cohesion: 0.29
Nodes (8): appendLegend(), buildExportMarkup(), downloadSvg(), exportChartAsSvg(), ExportChartLegendItem, ExportChartOptions, getChartDimensions(), resolveCssVariables()

### Community 41 - "Video Recording"
Cohesion: 0.20
Nodes (10): 1. Use Descriptive Filenames, 2. Record entire hero scripts., 3. Attach the recording to the pull request, Basic Recording, Best Practices, Cursor, Target Highlight and Click Point, Limitations, Overlay API Summary (+2 more)

### Community 42 - "Advanced Mocking with run-code"
Cohesion: 0.22
Nodes (8): Advanced Mocking with run-code, CLI Route Commands, Conditional Response Based on Request, Delayed Response, Modify Real Response, Request Mocking, Simulate Network Failures, URL Patterns

### Community 45 - "Attaching Screenshots and Videos to Pull Requests"
Cohesion: 0.40
Nodes (5): Attaching Screenshots and Videos to Pull Requests, From a local session, From CI, Limits, When to attach

## Knowledge Gaps
- **333 isolated node(s):** `check.sh script`, `name`, `private`, `version`, `type` (+328 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 380 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `TelemetryTab.tsx` to `4. Phases and tasks`, `openf1.ts`, `types.ts`, `TrackMapTab.tsx`, `package.json`, `DashboardContainer.tsx`, `DashboardShell.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `playwright` connect `perf-metrics.mjs` to `package.json`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `4. Phases and tasks`, `openf1.ts`, `TelemetryTab.tsx`, `exportChart.ts`, `types.ts`, `TrackMapTab.tsx`, `package.json`, `vite.config.ts`, `DashboardContainer.tsx`, `DashboardShell.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useDashboard()` (e.g. with `Phase 1: Render stability (the root cause behind F1 and F2)` and `Phase 4 status: ✅ DONE (P4-01, P4-02; P4-03 skipped, 2026-09-30)`) actually correct?**
  _`useDashboard()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `useDriverContext()` (e.g. with `Phase 1: Render stability (the root cause behind F1 and F2)` and `Phase 1 status: ✅ DONE (P1-01..P1-07, 2026-09-30)`) actually correct?**
  _`useDriverContext()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `check.sh script`, `name`, `private` to the rest of the system?**
  _333 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `4. Phases and tasks` be split into smaller, more focused modules?**
  _Cohesion score 0.06827880512091039 - nodes in this community are weakly interconnected._