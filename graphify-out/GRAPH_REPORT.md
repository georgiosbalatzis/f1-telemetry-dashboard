# Graph Report - f1-telemetry-dashboard  (2026-09-30)

## Corpus Check
- 120 files · ~834,236 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 4, .woff2 4, .css 3)

## Summary
- 812 nodes · 1813 edges · 50 communities (42 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55ab3df5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- P2Polish.test.tsx
- openf1.ts
- TelemetryTab.tsx
- /graphify skill
- types.ts
- Cookies
- TrackMapTab.tsx
- react
- package.json
- compilerOptions
- devDependencies
- compilerOptions
- DashboardContainer.tsx
- DashboardShell.tsx
- scripts
- DashboardHeader.tsx
- manifest.json
- Browser Automation with playwright-cli
- Test generation (plan → generate → heal)
- dependencies
- Browser Session Management
- F1 Telemetry Dashboard README
- favicon.svg (F1 Stories App Icon)
- F1 Stories App Icon (512px)
- vite.config.ts
- F1 Stories App Icon (192px)
- tsconfig.json
- check.sh
- Running Custom Playwright Code
- shared.tsx
- mock.js
- robots.txt (allow all)
- 4. Phases and tasks
- Tracing
- exportChart.ts
- main.tsx
- openf1.integration.test.ts
- @testing-library/jest-dom
- RadioTab.tsx
- SKILL.md
- Video Recording
- Advanced Mocking with run-code
- WeatherTab.tsx
- 3. Heal
- Attaching Screenshots and Videos to Pull Requests
- 2. Generate
- COLORS
- Barlow Condensed SIL OFL 1.1 License
- IBM Plex Sans SIL OFL 1.1 License

## God Nodes (most connected - your core abstractions)
1. `react` - 34 edges
2. `copy` - 23 edges
3. `vitest` - 22 edges
4. `useDashboard()` - 22 edges
5. `lucide-react` - 20 edges
6. `useDriverContext()` - 20 edges
7. `useFetch()` - 19 edges
8. `compilerOptions` - 18 edges
9. `/graphify skill` - 18 edges
10. `fetchJson()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Phase 5: Headlines generated from the data` --references--> `buildHeadline()`  [INFERRED]
  REWORK_TASKS.md → src/components/dashboard/headlines.ts
- `Phase 4: Data surfaces` --references--> `DriverCards()`  [INFERRED]
  REWORK_TASKS.md → src/components/dashboard/broadcast/DriverCards.tsx
- `Phase 4: Data surfaces` --references--> `ChartTip()`  [INFERRED]
  REWORK_TASKS.md → src/components/dashboard/shared.tsx
- `Phase 0: Foundations` --references--> `readInitialThemeMode()`  [INFERRED]
  REWORK_TASKS.md → src/components/DashboardContainer.tsx
- `Container + Presenter split` --references--> `DashboardContainer()`  [EXTRACTED]
  nextsteps.txt → src/components/DashboardContainer.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **npm run ci validation pipeline gating CI and Pages deploy** — _github_workflows_ci_ci_workflow, _github_workflows_deploy_deploy_to_github_pages, readme_npm_run_ci, readme_github_pages_deployment [EXTRACTED 1.00]
- **filters -> selectionData -> viewModel composed by useDashboard** — src_hooks_usedashboardfilters_usedashboardfilters, src_hooks_usedashboardselectiondata_usedashboardselectiondata, src_hooks_usedashboardviewmodel_usedashboardviewmodel, src_hooks_usedashboard_usedashboard [EXTRACTED 1.00]
- **graphify extraction pipeline stages** — _claude_skills_graphify_skill_structural_ast_extraction, _claude_skills_graphify_skill_semantic_subagent_extraction, _claude_skills_graphify_skill_ast_semantic_merge, _claude_skills_graphify_skill_community_labeling, _claude_skills_graphify_skill_shrink_guard, _claude_skills_graphify_skill_graph_health_check, _claude_skills_graphify_skill_manifest_stamping [EXTRACTED 1.00]
- **Graph rebuild triggers (update, watch, hook, add)** — _claude_skills_graphify_references_update_incremental_update, _claude_skills_graphify_references_add_watch_watch_mode, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_add_watch_graphify_add, claude_graphify_update_after_changes [INFERRED 0.85]

## Communities (50 total, 8 thin omitted)

### Community 0 - "P2Polish.test.tsx"
Cohesion: 0.07
Nodes (20): @testing-library/react, @testing-library/user-event, vitest, OpenF1Driver, OpenF1Position, buildPositionChartData(), MAX_CHART_POINTS, PositionChartResult (+12 more)

### Community 1 - "openf1.ts"
Cohesion: 0.06
Nodes (85): Codex Improvement Prompt (8 phases), Phase 1 Critical Bug Fixes, Phase 2 Performance Optimizations, Phase 3 Accessibility, Phase 5 Error Handling & Resilience, Phase 6 Code Quality & Housekeeping, Phase 7 Architecture Refactor, Phase 8 Testing (Vitest + RTL + msw) (+77 more)

### Community 2 - "TelemetryTab.tsx"
Cohesion: 0.14
Nodes (28): recharts, AXIS_FONT_SIZE, AXIS_TICK, AXIS_TICK_SOFT, CHART_MARGIN, evenTicks(), formatDrsState(), formatLapAxis() (+20 more)

### Community 3 - "/graphify skill"
Cohesion: 0.10
Nodes (32): Project graphify skill registration (.claude/CLAUDE.md), /graphify add <url> ingestion, --watch folder auto-rebuild, Extra exports (wiki, Neo4j, FalkorDB, SVG, GraphML, MCP), Token reduction benchmark, Extraction subagent prompt spec, GitHub clone and cross-repo merge, graphify claude install (native CLAUDE.md integration) (+24 more)

### Community 4 - "types.ts"
Cohesion: 0.09
Nodes (32): OpenF1Stint, IndexedSectorTime, SectorAnalysisData, SectorClass, buildSectorAnalysis(), classifySectorEntries(), SECTOR_STYLE, DriverCards() (+24 more)

### Community 5 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 6 - "TrackMapTab.tsx"
Cohesion: 0.18
Nodes (19): OpenF1Location, MINI_SECTORS, Path, stretchPolylines(), stretchWinners(), timesAtPathFractions(), DriverMarker, mapPosition() (+11 more)

### Community 7 - "react"
Cohesion: 0.12
Nodes (22): react, ChartLegendItem, DriverSelector(), Props, Props, Props, CardGridSkeleton(), DriverChip() (+14 more)

### Community 8 - "package.json"
Cohesion: 0.12
Nodes (18): name, packageManager, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks (+10 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 10 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, msw (+11 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 12 - "DashboardContainer.tsx"
Cohesion: 0.08
Nodes (38): Phase 0: Foundations, DashboardTabs(), TABS, NextViews(), ORDER, TAB_LABELS, Tab, buildDashboardUrl() (+30 more)

### Community 13 - "DashboardShell.tsx"
Cohesion: 0.14
Nodes (17): lucide-react, CardBar(), DashboardSelectors(), Props, ComparisonDriver, SignalBand(), SiteFooter(), SummaryStrip() (+9 more)

### Community 14 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, ci, dev, lint, preview, test, test:ui (+2 more)

### Community 15 - "DashboardHeader.tsx"
Cohesion: 0.12
Nodes (15): Container + Presenter split, OpenF1RaceControl, NavCountdown(), Props, fmt(), LapStrip(), LapBar, lapBars() (+7 more)

### Community 16 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 17 - "Browser Automation with playwright-cli"
Cohesion: 0.07
Nodes (27): Attaching screenshots and videos to pull requests, Browser Automation with playwright-cli, Browser Sessions, Commands, Core, DevTools, Emulation, Example: Debugging with DevTools (+19 more)

### Community 18 - "Test generation (plan → generate → heal)"
Cohesion: 0.17
Nodes (12): 0. How generation works, 1.1 Prerequisite: workspace, 1.2 Prerequisite: seed test, 1.3 Explore the app, 1.4 Write the spec file, 1. Planning, Add assertions manually, Building a test file (+4 more)

### Community 19 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, lucide-react, react, react-dom, recharts, tailwindcss, @tailwindcss/vite

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

### Community 25 - "F1 Stories App Icon (192px)"
Cohesion: 1.00
Nodes (3): F1 Stories App Icon (192px), F1 Stories Brand, Red F1 Car Badge Emblem

### Community 28 - "Running Custom Playwright Code"
Cohesion: 0.15
Nodes (13): Clipboard, Complex Workflows, Error Handling, File Downloads, Frames and Iframes, Geolocation, JavaScript Execution, Media Emulation (+5 more)

### Community 29 - "shared.tsx"
Cohesion: 0.16
Nodes (18): Phase 3: Navigation and section framing, TimingTowerProps, ChartPanel(), Props, Headline, ChartTipPayload, EmbedPanelButton(), NoData() (+10 more)

### Community 30 - "mock.js"
Cohesion: 0.12
Nodes (10): A, B, CORNER_LABELS, CORNERS, DELTA, LAPTIMES, PA, PALETTE (+2 more)

### Community 32 - "4. Phases and tasks"
Cohesion: 0.12
Nodes (15): 1. Decisions (agreed 2026-09-30), 2. Why it looks disjoint today (diagnosis), 3. Target design spec (A + B card + C strip), 4. Phases and tasks, 5. Suggested PR slicing, 6. Risks and notes, 7. Optional follow-ups in f1StoriesPage (not in scope), F1 Stories Telemetry: Rework Tasks (+7 more)

### Community 34 - "Tracing"
Cohesion: 0.12
Nodes (16): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Analyzing Performance, Basic Usage, Best Practices, Capturing Evidence, Debugging Failed Actions, Limitations (+8 more)

### Community 35 - "exportChart.ts"
Cohesion: 0.39
Nodes (7): appendLegend(), buildExportMarkup(), downloadSvg(), exportChartAsSvg(), ExportChartLegendItem, ExportChartOptions, getChartDimensions()

### Community 36 - "main.tsx"
Cohesion: 0.38
Nodes (5): Vite HTML entry (F1 Stories / Telemetry), Legacy CRA public/index.html template, react-dom, App(), src_index

### Community 37 - "openf1.integration.test.ts"
Cohesion: 0.50
Nodes (3): msw, fakeMeeting, server

### Community 39 - "RadioTab.tsx"
Cohesion: 0.22
Nodes (13): flagTone(), IncidentsTab(), Props, toneOf(), Props, RadioTab(), Err(), Spinner() (+5 more)

### Community 40 - "SKILL.md"
Cohesion: 0.21
Nodes (4): Examples, Inspecting Element Attributes, Debugging Playwright Tests, Running Playwright Tests

### Community 41 - "Video Recording"
Cohesion: 0.20
Nodes (10): 1. Use Descriptive Filenames, 2. Record entire hero scripts., 3. Attach the recording to the pull request, Basic Recording, Best Practices, Cursor, Target Highlight and Click Point, Limitations, Overlay API Summary (+2 more)

### Community 42 - "Advanced Mocking with run-code"
Cohesion: 0.22
Nodes (8): Advanced Mocking with run-code, CLI Route Commands, Conditional Response Based on Request, Delayed Response, Modify Real Response, Request Mocking, Simulate Network Failures, URL Patterns

### Community 43 - "WeatherTab.tsx"
Cohesion: 0.29
Nodes (6): ChartSkeleton(), ChartTip(), fixedValue(), AUX_TRACES, Props, WeatherTab

### Community 44 - "3. Heal"
Cohesion: 0.33
Nodes (6): 3.1 Find failing tests, 3.2 Debug one failure, 3.3 Apply the fix, 3.4 Reconcile with the spec, 3.5 Iteration and giving up, 3. Heal

### Community 45 - "Attaching Screenshots and Videos to Pull Requests"
Cohesion: 0.40
Nodes (5): Attaching Screenshots and Videos to Pull Requests, From a local session, From CI, Limits, When to attach

### Community 46 - "2. Generate"
Cohesion: 0.40
Nodes (5): 2.1 Inputs, 2.2 Generate one scenario, 2.3 Generate multiple scenarios, 2.4 Run generated tests, 2. Generate

### Community 47 - "COLORS"
Cohesion: 0.50
Nodes (5): CSS-var semantic colour tokens (COLORS), Orbitron font loading fix, Phase 4 Visual / UI Improvements, DashboardHeader(), COLORS

## Knowledge Gaps
- **325 isolated node(s):** `check.sh script`, `CORNERS`, `CORNER_LABELS`, `A`, `B` (+320 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 368 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `P2Polish.test.tsx`, `openf1.ts`, `TelemetryTab.tsx`, `types.ts`, `main.tsx`, `TrackMapTab.tsx`, `RadioTab.tsx`, `package.json`, `DashboardContainer.tsx`, `DashboardShell.tsx`, `DashboardHeader.tsx`, `shared.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `vitest` connect `P2Polish.test.tsx` to `openf1.ts`, `types.ts`, `openf1.integration.test.ts`, `TrackMapTab.tsx`, `package.json`, `DashboardContainer.tsx`, `DashboardShell.tsx`, `DashboardHeader.tsx`, `vite.config.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `check.sh script`, `CORNERS`, `CORNER_LABELS` to the rest of the system?**
  _325 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `P2Polish.test.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07307692307692308 - nodes in this community are weakly interconnected._
- **Should `openf1.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058848797250859106 - nodes in this community are weakly interconnected._
- **Should `TelemetryTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14260249554367202 - nodes in this community are weakly interconnected._