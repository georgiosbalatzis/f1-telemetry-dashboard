# Graph Report - f1-telemetry-dashboard  (2026-09-22)

## Corpus Check
- 100 files · ~72,974 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 4, .woff2 4, .css 2)

## Summary
- 779 nodes · 1584 edges · 39 communities (30 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9a907991`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- P2Polish.test.tsx
- openf1.ts
- F1 Stories / Telemetry Visual Rework
- /graphify skill
- DESIGN.md
- Cookies
- TrackMapTab.tsx
- shared.tsx
- package.json
- compilerOptions
- devDependencies
- compilerOptions
- DashboardContainer.tsx
- positionsUtils.test.ts
- scripts
- P2 — Noticeable polish issues
- manifest.json
- Browser Automation with playwright-cli
- 3. Heal
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
- React Logo SVG
- Senior AI Collaborator Operating Prompt
- robots.txt (allow all)
- Tracing
- exportChart.ts
- main.tsx
- openf1.integration.test.ts
- @testing-library/jest-dom

## God Nodes (most connected - your core abstractions)
1. `F1 Stories / Telemetry Visual Rework` - 31 edges
2. `react` - 28 edges
3. `useDashboard()` - 22 edges
4. `useDriverContext()` - 20 edges
5. `useFetch()` - 19 edges
6. `lucide-react` - 18 edges
7. `compilerOptions` - 18 edges
8. `/graphify skill` - 18 edges
9. `fetchJson()` - 17 edges
10. `DashboardContainer()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Unboxed shared Panel / chart treatment` --references--> `Panel()`  [INFERRED]
  TELEMETRY_VISUAL_REWORK.md → src/components/dashboard/shared.tsx
- `F1 Stories / Telemetry Visual Rework` --references--> `DashboardContainer()`  [INFERRED]
  TELEMETRY_VISUAL_REWORK.md → src/components/DashboardContainer.tsx
- `Embed mode treatment` --references--> `DashboardShell()`  [INFERRED]
  TELEMETRY_VISUAL_REWORK.md → src/components/DashboardShell.tsx
- `F1 Stories / Telemetry Visual Rework` --references--> `ErrorBoundary`  [INFERRED]
  TELEMETRY_VISUAL_REWORK.md → src/components/ErrorBoundary.tsx
- `F1 STORIES. / TELEMETRY masthead with Tools disclosure` --references--> `DashboardHeader()`  [INFERRED]
  TELEMETRY_VISUAL_REWORK.md → src/components/dashboard/DashboardHeader.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **npm run ci validation pipeline gating CI and Pages deploy** — _github_workflows_ci_ci_workflow, _github_workflows_deploy_deploy_to_github_pages, readme_npm_run_ci, readme_github_pages_deployment [EXTRACTED 1.00]
- **filters -> selectionData -> viewModel composed by useDashboard** — src_hooks_usedashboardfilters_usedashboardfilters, src_hooks_usedashboardselectiondata_usedashboardselectiondata, src_hooks_usedashboardviewmodel_usedashboardviewmodel, src_hooks_usedashboard_usedashboard [EXTRACTED 1.00]
- **graphify extraction pipeline stages** — _claude_skills_graphify_skill_structural_ast_extraction, _claude_skills_graphify_skill_semantic_subagent_extraction, _claude_skills_graphify_skill_ast_semantic_merge, _claude_skills_graphify_skill_community_labeling, _claude_skills_graphify_skill_shrink_guard, _claude_skills_graphify_skill_graph_health_check, _claude_skills_graphify_skill_manifest_stamping [EXTRACTED 1.00]
- **Graph rebuild triggers (update, watch, hook, add)** — _claude_skills_graphify_references_update_incremental_update, _claude_skills_graphify_references_add_watch_watch_mode, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_add_watch_graphify_add, claude_graphify_update_after_changes [INFERRED 0.85]

## Communities (39 total, 9 thin omitted)

### Community 0 - "P2Polish.test.tsx"
Cohesion: 0.08
Nodes (27): react, @testing-library/react, @testing-library/user-event, vitest, OpenF1Driver, OpenF1TeamRadio, formatLapAxis(), formatPedalAxis() (+19 more)

### Community 1 - "openf1.ts"
Cohesion: 0.07
Nodes (67): buildUrl(), buildUrlWithDateFilters(), combineSignals(), createTimeoutSignal(), fetchJson(), getCarDataForLap(), getDrivers(), getIntervals() (+59 more)

### Community 2 - "F1 Stories / Telemetry Visual Rework"
Cohesion: 0.09
Nodes (49): Codex Improvement Prompt (8 phases), Container + Presenter split, CSS-var semantic colour tokens (COLORS), Orbitron font loading fix, Phase 1 Critical Bug Fixes, Phase 2 Performance Optimizations, Phase 3 Accessibility, Phase 4 Visual / UI Improvements (+41 more)

### Community 3 - "/graphify skill"
Cohesion: 0.10
Nodes (32): Project graphify skill registration (.claude/CLAUDE.md), /graphify add <url> ingestion, --watch folder auto-rebuild, Extra exports (wiki, Neo4j, FalkorDB, SVG, GraphML, MCP), Token reduction benchmark, Extraction subagent prompt spec, GitHub clone and cross-repo merge, graphify claude install (native CLAUDE.md integration) (+24 more)

### Community 4 - "DESIGN.md"
Cohesion: 0.05
Nodes (38): Border Radius Scale, Brand & Accent, Breakpoints, Buttons, Cards & Containers, Collapsing Strategy, Colors, Components (+30 more)

### Community 5 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 6 - "TrackMapTab.tsx"
Cohesion: 0.23
Nodes (13): OpenF1Location, DriverMarker, mapPosition(), Props, buildTransform(), fitBox(), MAP_H, MAP_W (+5 more)

### Community 7 - "shared.tsx"
Cohesion: 0.05
Nodes (87): lucide-react, recharts, OpenF1Stint, IndexedSectorTime, SectorAnalysisData, SectorClass, buildSectorAnalysis(), classifySectorEntries() (+79 more)

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
Cohesion: 0.09
Nodes (34): GROUPS, TAB_LABELS, Tab, buildDashboardUrl(), buildIframeSnippet(), DashboardContainer(), getClipboardErrorMessage(), isShareCancel() (+26 more)

### Community 13 - "positionsUtils.test.ts"
Cohesion: 0.36
Nodes (4): OpenF1Position, buildPositionChartData(), MAX_CHART_POINTS, PositionChartResult

### Community 14 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, ci, dev, lint, preview, test, test:ui (+2 more)

### Community 15 - "P2 — Noticeable polish issues"
Cohesion: 0.07
Nodes (29): F1 Telemetry Dashboard — TASKS, Final verification checklist, P0 — Visually or functionally broken, P1 — Strongly damages the F1Stories identity, P2 — Noticeable polish issues, [ ] P3-03 — Legend lines look like tiny curved bowls, P3 — Micro-polish, [x] P0-01 — Broadcast contradicts the available analysis (+21 more)

### Community 16 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 17 - "Browser Automation with playwright-cli"
Cohesion: 0.07
Nodes (27): Attaching screenshots and videos to pull requests, Browser Automation with playwright-cli, Browser Sessions, Commands, Core, DevTools, Emulation, Example: Debugging with DevTools (+19 more)

### Community 18 - "3. Heal"
Cohesion: 0.09
Nodes (23): 0. How generation works, 1.1 Prerequisite: workspace, 1.2 Prerequisite: seed test, 1.3 Explore the app, 1.4 Write the spec file, 1. Planning, 2.1 Inputs, 2.2 Generate one scenario (+15 more)

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
Cohesion: 0.04
Nodes (40): Examples, Inspecting Element Attributes, Debugging Playwright Tests, Running Playwright Tests, Attaching Screenshots and Videos to Pull Requests, From a local session, From CI, Limits (+32 more)

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

## Knowledge Gaps
- **351 isolated node(s):** `check.sh script`, `name`, `private`, `version`, `type` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 379 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `P2Polish.test.tsx` to `openf1.ts`, `main.tsx`, `TrackMapTab.tsx`, `shared.tsx`, `package.json`, `DashboardContainer.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `shared.tsx` to `package.json`, `P2Polish.test.tsx`, `TrackMapTab.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `F1 Stories / Telemetry Visual Rework` (e.g. with `DriverCards()` and `TimingTower()`) actually correct?**
  _`F1 Stories / Telemetry Visual Rework` has 20 INFERRED edges - model-reasoned connections that need verification._
- **What connects `check.sh script`, `name`, `private` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `P2Polish.test.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07928118393234672 - nodes in this community are weakly interconnected._
- **Should `openf1.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07313738892686261 - nodes in this community are weakly interconnected._