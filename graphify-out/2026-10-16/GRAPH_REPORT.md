# Graph Report - f1-telemetry-dashboard  (2026-10-16)

## Corpus Check
- 201 files · ~1,392,105 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 4, .woff2 4, .css 3)

## Summary
- 1202 nodes · 2721 edges · 81 communities (71 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f37bae3d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SameDriverComparison.tsx
- openf1.ts
- Telemetry / F1Stories Priority 1 shell audit
- /graphify skill
- TelemetryTab.tsx
- Cookies
- TrackMapTab.tsx
- lib.mjs
- package.json
- compilerOptions
- devDependencies
- compilerOptions
- Article embeds: replace dashboard frames with editorial figures
- article-figure-check.mjs
- ChartPanel.tsx
- plotModel.ts
- manifest.json
- Browser Automation with playwright-cli
- 3. Heal
- DashboardContainer.tsx
- Browser Session Management
- F1 Telemetry Dashboard README
- favicon.svg (F1 Stories App Icon)
- F1 Stories App Icon (512px)
- EnergyTab.tsx
- F1 Stories App Icon (192px)
- tsconfig.json
- embed-interactive-check.mjs
- Running Custom Playwright Code
- P2Polish.test.tsx
- ref_node_fs
- robots.txt (allow all)
- headlines.ts
- Tracing
- react
- 4. Phases and tasks
- Race Desk in Telemetry
- copy.ts
- DashboardShell.tsx
- SKILL.md
- Video Recording
- Advanced Mocking with run-code
- VisualWorkflow.test.tsx
- contract.ts
- Attaching Screenshots and Videos to Pull Requests
- EmbedDialog.tsx
- scripts
- Barlow Condensed SIL OFL 1.1 License
- IBM Plex Sans SIL OFL 1.1 License
- embed-baseline.mjs
- perf-metrics.mjs
- same-origin-deployment.md
- shared.tsx
- check-design-tokens.mjs
- E01–E03 implementation evidence
- exportFigure.tsx
- dependencies
- vite.config.ts
- useDashboardFilters.ts
- E09–E11 and Release B verification
- Release A
- hamilton-singapore-2026/manifest.json
- Telemetry design tokens — Priority 4C
- vitest
- 5. Tasks for Sonnet
- Hamilton / Singapore 2026 Q3
- EMBED.md
- E07–E08 and Release A verification
- DashboardHeader.tsx
- 0. How generation works
- report.el.md
- @testing-library/jest-dom
- 1. Planning
- Theme persistence
- 4. Phases and tasks
- useEmbedHeightReporter.test.tsx
- lucide-react
- 3. Scope and reader experience
- RESULTS.md

## God Nodes (most connected - your core abstractions)
1. `react` - 43 edges
2. `vitest` - 36 edges
3. `copy` - 27 edges
4. `DashboardContainer()` - 25 edges
5. `useDashboard()` - 25 edges
6. `useDriverContext()` - 24 edges
7. `SameDriverComparison()` - 21 edges
8. `useFetch()` - 21 edges
9. `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` - 20 edges
10. `fetchJson()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Telemetry` --references--> `readInitialThemeMode()`  [INFERRED]
  docs/THEME.md → src/components/DashboardContainer.tsx
- `1. Baseline (measured, production build, Chromium)` --references--> `DashboardContainer()`  [INFERRED]
  PERFREDO.md → src/components/DashboardContainer.tsx
- `Phase 6: Remove redundancy and dead code (F8, F10, F11, F12)` --references--> `PositionChartResult`  [INFERRED]
  PERFREDO.md → src/components/dashboard/positionsUtils.ts
- `E04: complete saved figures` --references--> `TelemetryPlot()`  [INFERRED]
  docs/embeds/E04-E06.md → src/embeds/TelemetryPlot.tsx
- `Audit and convergence` --references--> `text()`  [INFERRED]
  docs/DESIGN_TOKENS.md → src/embeds/contract.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **npm run ci validation pipeline gating CI and Pages deploy** — _github_workflows_ci_ci_workflow, _github_workflows_deploy_deploy_to_github_pages, readme_npm_run_ci, readme_github_pages_deployment [EXTRACTED 1.00]
- **graphify extraction pipeline stages** — _claude_skills_graphify_skill_structural_ast_extraction, _claude_skills_graphify_skill_semantic_subagent_extraction, _claude_skills_graphify_skill_ast_semantic_merge, _claude_skills_graphify_skill_community_labeling, _claude_skills_graphify_skill_shrink_guard, _claude_skills_graphify_skill_graph_health_check, _claude_skills_graphify_skill_manifest_stamping [EXTRACTED 1.00]
- **Graph rebuild triggers (update, watch, hook, add)** — _claude_skills_graphify_references_update_incremental_update, _claude_skills_graphify_references_add_watch_watch_mode, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_add_watch_graphify_add, claude_graphify_update_after_changes [INFERRED 0.85]

## Communities (81 total, 10 thin omitted)

### Community 0 - "SameDriverComparison.tsx"
Cohesion: 0.13
Nodes (36): Props, SameDriverComparison(), alignedCsv(), lapFigureBundle(), lapFigureData(), selectLapFigure(), useComparisonLap(), AlignedLap (+28 more)

### Community 1 - "openf1.ts"
Cohesion: 0.05
Nodes (87): 3. Findings by severity, Phase 2: Network (F3), Phase 2 status: ✅ DONE (P2-01..P2-06, 2026-09-30), msw, buildUrl(), combineSignals(), createTimeoutSignal(), fetchJson() (+79 more)

### Community 2 - "Telemetry / F1Stories Priority 1 shell audit"
Cohesion: 0.22
Nodes (8): Files changed, Findings and changes, Intentionally unchanged, Later product localization, Priority 1 judgment, Requested sponsors bar follow-up, Telemetry / F1Stories Priority 1 shell audit, Validation

### Community 3 - "/graphify skill"
Cohesion: 0.10
Nodes (32): Project graphify skill registration (.claude/CLAUDE.md), /graphify add <url> ingestion, --watch folder auto-rebuild, Extra exports (wiki, Neo4j, FalkorDB, SVG, GraphML, MCP), Token reduction benchmark, Extraction subagent prompt spec, GitHub clone and cross-repo merge, graphify claude install (native CLAUDE.md integration) (+24 more)

### Community 4 - "TelemetryTab.tsx"
Cohesion: 0.13
Nodes (24): IndexedSectorTime, SectorAnalysisData, SectorClass, SECTOR_STYLE, DriverCards(), DriverCardsProps, SectorAnalysis(), SectorAnalysisProps (+16 more)

### Community 5 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 6 - "TrackMapTab.tsx"
Cohesion: 0.18
Nodes (19): MINI_SECTORS, Path, stretchPolylines(), stretchWinners(), timesAtPathFractions(), DriverMarker, mapPosition(), Props (+11 more)

### Community 7 - "lib.mjs"
Cohesion: 0.14
Nodes (20): ref_node_path, BASE_PATH, fixturePath(), FIXTURES, OUT, record(), replayOpenF1(), SCOPE (+12 more)

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (17): name, packageManager, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks (+9 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 10 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, msw (+14 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 12 - "Article embeds: replace dashboard frames with editorial figures"
Cohesion: 0.22
Nodes (9): 1. The decision, 2. What exists today, 6. Order and completion criteria, 7. Technical references, Alternatives considered, Article embeds: replace dashboard frames with editorial figures, Article repository: changes are also required here, Same-driver lap publications (version 2) (+1 more)

### Community 13 - "article-figure-check.mjs"
Cohesion: 0.10
Nodes (19): ref_node_os, address, articleCss, articleCssPath, articleRequire, articleRoot, assets, bundlePath (+11 more)

### Community 14 - "ChartPanel.tsx"
Cohesion: 0.13
Nodes (18): Phase 6: Remove redundancy and dead code (F8, F10, F11, F12), Phase 6 status: ✅ DONE (P6-01..P6-11, 2026-09-30), Phase 3: Navigation and section framing, buildSectorAnalysis(), classifySectorEntries(), BroadcastTab, ChartPanel(), Props (+10 more)

### Community 15 - "plotModel.ts"
Cohesion: 0.18
Nodes (19): E03: shared plots and container sizing, react-dom, FigureData, FigureDriver, FigureTheme, format(), InteractiveFigure(), MountOptions (+11 more)

### Community 16 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, display, icons, id, name, scope, short_name, start_url (+1 more)

### Community 17 - "Browser Automation with playwright-cli"
Cohesion: 0.07
Nodes (27): Attaching screenshots and videos to pull requests, Browser Automation with playwright-cli, Browser Sessions, Commands, Core, DevTools, Emulation, Example: Debugging with DevTools (+19 more)

### Community 18 - "3. Heal"
Cohesion: 0.15
Nodes (13): 2.1 Inputs, 2.2 Generate one scenario, 2.3 Generate multiple scenarios, 2.4 Run generated tests, 2. Generate, 3.1 Find failing tests, 3.2 Debug one failure, 3.3 Apply the fix (+5 more)

### Community 19 - "DashboardContainer.tsx"
Cohesion: 0.14
Nodes (21): Vite HTML entry (F1 Stories / Telemetry), Phase 1: Render stability (the root cause behind F1 and F2), Phase 0: Foundations, cornerMarks(), points, buildDashboardUrl(), buildIframeSnippet(), DashboardContainer() (+13 more)

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

### Community 24 - "EnergyTab.tsx"
Cohesion: 0.12
Nodes (33): 4. Publication contract, Telemetry repository, recharts, AXIS_TICK, AXIS_TICK_SOFT, CHART_MARGIN, evenTicks(), formatDrsState() (+25 more)

### Community 25 - "F1 Stories App Icon (192px)"
Cohesion: 1.00
Nodes (3): F1 Stories App Icon (192px), F1 Stories Brand, Red F1 Car Badge Emblem

### Community 27 - "embed-interactive-check.mjs"
Cohesion: 0.11
Nodes (16): ref_node_module, ref_node_url, ref_node_zlib, bundles, count(), manifest, pedals, require (+8 more)

### Community 28 - "Running Custom Playwright Code"
Cohesion: 0.15
Nodes (13): Clipboard, Complex Workflows, Error Handling, File Downloads, Frames and Iframes, Geolocation, JavaScript Execution, Media Emulation (+5 more)

### Community 29 - "P2Polish.test.tsx"
Cohesion: 0.17
Nodes (19): formatLapAxis(), flagTone(), IncidentsTab, Props, toneOf(), Props, RadioTab, Err() (+11 more)

### Community 30 - "ref_node_fs"
Cohesion: 0.13
Nodes (11): /f1-telemetry-dashboard/src/embeds/contract.ts, /f1-telemetry-dashboard/src/embeds/exportFigure.tsx, /f1-telemetry-dashboard/src/telemetry/lapComparison.ts, /f1-telemetry-dashboard/src/embeds/lapFigures.ts, ref_node_assert, ref_node_child_process, ref_node_crypto, ref_node_fs (+3 more)

### Community 32 - "headlines.ts"
Cohesion: 0.20
Nodes (12): Phase 5: Headlines generated from the data, buildHeadline(), Headline, HeadlineContext, lapHeadline(), PLACE, positionsHeadline(), signed() (+4 more)

### Community 34 - "Tracing"
Cohesion: 0.12
Nodes (16): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Analyzing Performance, Basic Usage, Best Practices, Capturing Evidence, Debugging Failed Actions, Limitations (+8 more)

### Community 35 - "react"
Cohesion: 0.33
Nodes (7): react, BRAKE_DASH, DriverProviderProps, LINE_DASH, DriverContext, DriverContextValue, DriverDash

### Community 36 - "4. Phases and tasks"
Cohesion: 0.05
Nodes (37): 0. How to use this file (read first, Sonnet), 1. Baseline (measured, production build, Chromium), 2. Support matrix (make it explicit), 4. Phases and tasks, 5. Explicitly out of scope (don't do these), 6. Risk notes for the executor, 7. Found during execution, PERFREDO: performance and cross-browser plan (+29 more)

### Community 37 - "Race Desk in Telemetry"
Cohesion: 0.50
Nodes (3): Destinations, Race Desk in Telemetry, Visual rules

### Community 38 - "copy.ts"
Cohesion: 0.23
Nodes (10): DashboardHeader, ComparisonDriver, SignalBand, standIn(), SiteFooter(), sponsors, copy, SITE_FOOTER_LINKS (+2 more)

### Community 39 - "DashboardShell.tsx"
Cohesion: 0.13
Nodes (18): buildGapCards(), fmt(), LapStrip, lapBars(), safetyCarLaps(), BroadcastTab, DashboardShell(), EnergyTab (+10 more)

### Community 40 - "SKILL.md"
Cohesion: 0.21
Nodes (4): Examples, Inspecting Element Attributes, Debugging Playwright Tests, Running Playwright Tests

### Community 41 - "Video Recording"
Cohesion: 0.20
Nodes (10): 1. Use Descriptive Filenames, 2. Record entire hero scripts., 3. Attach the recording to the pull request, Basic Recording, Best Practices, Cursor, Target Highlight and Click Point, Limitations, Overlay API Summary (+2 more)

### Community 42 - "Advanced Mocking with run-code"
Cohesion: 0.22
Nodes (8): Advanced Mocking with run-code, CLI Route Commands, Conditional Response Based on Request, Delayed Response, Modify Real Response, Request Mocking, Simulate Network Failures, URL Patterns

### Community 43 - "VisualWorkflow.test.tsx"
Cohesion: 0.19
Nodes (6): DashboardTabs(), NextViews(), TAB_LABELS, TAB_ORDER, Tab, failures

### Community 44 - "contract.ts"
Cohesion: 0.21
Nodes (21): array(), DistanceAxis, EMBED_PANEL_IDS, fail(), FigureGuide, FigurePoint, finite(), integer() (+13 more)

### Community 45 - "Attaching Screenshots and Videos to Pull Requests"
Cohesion: 0.40
Nodes (5): Attaching Screenshots and Videos to Pull Requests, From a local session, From CI, Limits, When to attach

### Community 46 - "EmbedDialog.tsx"
Cohesion: 0.24
Nodes (10): EmbedPanelId, PublicationScope, EmbedDialog(), escapeAttribute(), PANELS, Props, buildDashboardLink(), LEGACY_BASES (+2 more)

### Community 47 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build:f1stories, build:interactive, check:tokens, ci, dev, lint (+5 more)

### Community 50 - "embed-baseline.mjs"
Cohesion: 0.15
Nodes (12): ref_node_http, articleRoot, fixture, host, measurements, mime, output, phase (+4 more)

### Community 51 - "perf-metrics.mjs"
Cohesion: 0.22
Nodes (10): dashboardUrl(), settle(), file, label, loadPass(), observers(), out, read() (+2 more)

### Community 53 - "shared.tsx"
Cohesion: 0.13
Nodes (20): Phase 4: Data surfaces, DriverSelector, Props, CardGridSkeleton(), ChartTip(), ChartTipPayload, DriverChip(), fixedValue() (+12 more)

### Community 54 - "check-design-tokens.mjs"
Cohesion: 0.20
Nodes (9): blocks, css, dark, declarations(), light, manifest, normalize(), resolve() (+1 more)

### Community 55 - "E01–E03 implementation evidence"
Cohesion: 0.40
Nodes (5): E01–E03 implementation evidence, E01: fixtures and measured baseline, E02: pure links and publication contract, Findings, Validation and remaining scope

### Community 56 - "exportFigure.tsx"
Cohesion: 0.13
Nodes (17): FigureBundle, FigureImage, EmbedComposer(), FigureDraft, FigureImages, PANEL_LABEL, PANEL_ORDER, previewUrl() (+9 more)

### Community 57 - "dependencies"
Cohesion: 0.40
Nodes (5): dependencies, lucide-react, react, react-dom, recharts

### Community 58 - "vite.config.ts"
Cohesion: 0.33
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 59 - "useDashboardFilters.ts"
Cohesion: 0.24
Nodes (14): CURRENT_YEAR, parseBoundedInt(), parseCircuit(), parseDriverNumber(), parseDriverNumbers(), parseLapNumber(), parseSessionKey(), parseTab() (+6 more)

### Community 60 - "E09–E11 and Release B verification"
Cohesion: 0.33
Nodes (5): Checks, E09–E11 and Release B verification, E09: standalone runtime, E11: inspection and fallback behavior, Release B browser and payload results

### Community 61 - "Release A"
Cohesion: 0.22
Nodes (9): Release A, [x] E01 — Establish fixtures and the before/after baseline, [x] E02 — Add a pure scope/link and bundle contract, [x] E03 — Share the two chart renderers without dashboard side effects, [x] E04 — Produce complete, readable saved images, [x] E05 — Replace immediate iframe copying with an author composer, [x] E06 — Add a dedicated telemetry publication path to articles, [x] E07 — Integrate article layout, responsive images, theme and print (+1 more)

### Community 62 - "hamilton-singapore-2026/manifest.json"
Cohesion: 0.29
Nodes (6): generatedAt, limitations, outputFiles, rawFiles, sessionKey, sourceRequests

### Community 63 - "Telemetry design tokens — Priority 4C"
Cohesion: 0.29
Nodes (6): Audit and convergence, Focus and contrast, Preserved visualization semantics and exceptions, Raw-color inventory, Telemetry design tokens — Priority 4C, Verification and next product

### Community 64 - "vitest"
Cohesion: 0.16
Nodes (12): E10: progressive article enhancement, @testing-library/react, vitest, localStorage, parseFigureBundle(), mount(), bundle(), src_embeds_tests_fixtures_publication_v1 (+4 more)

### Community 65 - "5. Tasks for Sonnet"
Cohesion: 0.29
Nodes (7): 5. Tasks for Sonnet, Compatibility and release checks, Release B — implement after Release A is accepted, [x] E09 — Build a small standalone interactive renderer, [x] E10 — Add resilient, explicit enhancement in the article host, [x] E11 — Make touch, keyboard and assistive inspection useful, [x] E12 — Verify regressions and provide review evidence

### Community 66 - "Hamilton / Singapore 2026 Q3"
Cohesion: 0.40
Nodes (4): Hamilton / Singapore 2026 Q3, Reproduce, Sources reviewed, Verification limits

### Community 67 - "EMBED.md"
Cohesion: 0.29
Nodes (5): E04: complete saved figures, E04–E06 implementation evidence, E05: publication composer, E06: article publication path, Remaining work

### Community 68 - "E07–E08 and Release A verification"
Cohesion: 0.40
Nodes (4): E07: article layout, theme, responsive images and print, E07–E08 and Release A verification, E08: source workflow and pilot review, Release A checks

### Community 69 - "DashboardHeader.tsx"
Cohesion: 0.22
Nodes (8): NavCountdown(), Props, formatCountdown(), pickNextMeeting(), NOW, RACE_DESK_NAV, SITE, SITE_NAV

### Community 70 - "0. How generation works"
Cohesion: 0.40
Nodes (5): 0. How generation works, Add assertions manually, Building a test file, Explore before recording, Use semantic locators

### Community 74 - "1. Planning"
Cohesion: 0.40
Nodes (5): 1.1 Prerequisite: workspace, 1.2 Prerequisite: seed test, 1.3 Explore the app, 1.4 Write the spec file, 1. Planning

### Community 75 - "Theme persistence"
Cohesion: 0.40
Nodes (4): F1Stories contract, Origins: same contract, not yet shared state, Telemetry, Theme persistence

### Community 76 - "4. Phases and tasks"
Cohesion: 0.14
Nodes (13): 1. Decisions (agreed 2026-09-30), 2. Why it looks disjoint today (diagnosis), 3. Target design spec (A + B card + C strip), 4. Phases and tasks, 5. Suggested PR slicing, 6. Risks and notes, 7. Optional follow-ups in f1StoriesPage (not in scope), F1 Stories Telemetry: Rework Tasks (+5 more)

### Community 77 - "useEmbedHeightReporter.test.tsx"
Cohesion: 0.22
Nodes (5): callbacks, disconnect, parent, postMessage, useEmbedHeightReporter()

### Community 78 - "lucide-react"
Cohesion: 0.29
Nodes (5): lucide-react, CardBar(), DashboardSelectors, Props, SelectOption

### Community 79 - "3. Scope and reader experience"
Cohesion: 0.50
Nodes (4): 3. Scope and reader experience, Figure anatomy, Release A — complete, useful replacement, Release B — optional exploration

## Knowledge Gaps
- **473 isolated node(s):** `generatedAt`, `sessionKey`, `sourceRequests`, `rawFiles`, `outputFiles` (+468 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 544 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `playwright` connect `ref_node_fs` to `lib.mjs`, `package.json`, `article-figure-check.mjs`, `embed-baseline.mjs`, `perf-metrics.mjs`, `embed-interactive-check.mjs`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `SameDriverComparison.tsx`, `openf1.ts`, `TelemetryTab.tsx`, `TrackMapTab.tsx`, `package.json`, `ChartPanel.tsx`, `plotModel.ts`, `DashboardContainer.tsx`, `EnergyTab.tsx`, `P2Polish.test.tsx`, `4. Phases and tasks`, `copy.ts`, `DashboardShell.tsx`, `VisualWorkflow.test.tsx`, `EmbedDialog.tsx`, `shared.tsx`, `exportFigure.tsx`, `useDashboardFilters.ts`, `DashboardHeader.tsx`, `useEmbedHeightReporter.test.tsx`, `lucide-react`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `SameDriverComparison.tsx`, `openf1.ts`, `TelemetryTab.tsx`, `TrackMapTab.tsx`, `package.json`, `plotModel.ts`, `DashboardContainer.tsx`, `EnergyTab.tsx`, `P2Polish.test.tsx`, `headlines.ts`, `react`, `4. Phases and tasks`, `copy.ts`, `VisualWorkflow.test.tsx`, `contract.ts`, `exportFigure.tsx`, `vite.config.ts`, `useDashboardFilters.ts`, `DashboardHeader.tsx`, `useEmbedHeightReporter.test.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `DashboardContainer()` (e.g. with `E02: pure links and publication contract` and `[x] E03 — Share the two chart renderers without dashboard side effects`) actually correct?**
  _`DashboardContainer()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `useDashboard()` (e.g. with `[x] E03 — Share the two chart renderers without dashboard side effects` and `Phase 1: Render stability (the root cause behind F1 and F2)`) actually correct?**
  _`useDashboard()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `generatedAt`, `sessionKey`, `sourceRequests` to the rest of the system?**
  _473 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SameDriverComparison.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.132890365448505 - nodes in this community are weakly interconnected._