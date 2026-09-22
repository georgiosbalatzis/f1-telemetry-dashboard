# Graph Report - f1-telemetry-dashboard  (2026-09-22)

## Corpus Check
- 99 files · ~58,499 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 4, .woff2 4, .css 2)

## Summary
- 550 nodes · 1393 edges · 34 communities (25 shown, 9 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 138 edges (avg confidence: 0.89)
- Token cost: 279,107 input · 0 output

## Community Hubs (Navigation)
- Broadcast Timing Components
- OpenF1 API Client
- Dashboard Shell & Rework Plan
- graphify Skill Docs
- Tabs & Shared Types
- App Entry & Container
- Improvement Phases & Track Map
- Strategy & Driver Selection
- Package & ESLint Config
- TS App Config
- Dev Dependencies
- TS Node Config
- URL Filter Parsing
- Error Boundary
- npm Scripts
- API & Comparison Tests
- PWA Manifest
- Position Chart Utils
- Chart SVG Export
- Runtime Dependencies
- Sector Analysis Utils
- CI & Deployment
- Favicon Branding
- 512px App Icon
- Vite Build Config
- 192px App Icon
- TS Root Config
- Check Script
- Test Setup
- Template React Logo
- Operating Prompt
- Robots.txt

## God Nodes (most connected - your core abstractions)
1. `F1 Stories / Telemetry Visual Rework` - 31 edges
2. `react` - 27 edges
3. `Telemetry TASKS checklist (P0-P3)` - 26 edges
4. `useDashboard()` - 24 edges
5. `useDriverContext()` - 20 edges
6. `useFetch()` - 19 edges
7. `lucide-react` - 18 edges
8. `DashboardContainer()` - 18 edges
9. `compilerOptions` - 18 edges
10. `/graphify skill` - 18 edges

## Surprising Connections (you probably didn't know these)
- `P3-03 Legend lines look like curved bowls` --references--> `ChartPanel()`  [INFERRED]
  telemetry_TASKS.md → src/components/dashboard/ChartPanel.tsx
- `P3-04 Chart action glyphs undersized` --references--> `ChartPanel()`  [INFERRED]
  telemetry_TASKS.md → src/components/dashboard/ChartPanel.tsx
- `P0-04 Lap selection draws line at position axis` --references--> `PositionsTab()`  [INFERRED]
  telemetry_TASKS.md → src/components/dashboard/PositionsTab.tsx
- `Unboxed shared Panel / chart treatment` --references--> `Panel()`  [INFERRED]
  TELEMETRY_VISUAL_REWORK.md → src/components/dashboard/shared.tsx
- `P1-03 Embed behaves like dashboard in article` --references--> `DashboardContainer()`  [INFERRED]
  telemetry_TASKS.md → src/components/DashboardContainer.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graph rebuild triggers (update, watch, hook, add)** — _claude_skills_graphify_references_update_incremental_update, _claude_skills_graphify_references_add_watch_watch_mode, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_add_watch_graphify_add, claude_graphify_update_after_changes [INFERRED 0.85]
- **graphify extraction pipeline stages** — _claude_skills_graphify_skill_structural_ast_extraction, _claude_skills_graphify_skill_semantic_subagent_extraction, _claude_skills_graphify_skill_ast_semantic_merge, _claude_skills_graphify_skill_community_labeling, _claude_skills_graphify_skill_shrink_guard, _claude_skills_graphify_skill_graph_health_check, _claude_skills_graphify_skill_manifest_stamping [EXTRACTED 1.00]
- **npm run ci validation pipeline gating CI and Pages deploy** — _github_workflows_ci_ci_workflow, _github_workflows_deploy_deploy_to_github_pages, readme_npm_run_ci, readme_github_pages_deployment [EXTRACTED 1.00]
- **F1Stories brand alignment (tokens, fonts, masthead, BetCast principles)** — telemetry_visual_rework_f1stories_design_tokens, telemetry_visual_rework_self_hosted_fonts, telemetry_visual_rework_masthead, telemetry_visual_rework_betcast_translation_principles, telemetry_tasks_p1_01 [INFERRED 0.85]
- **filters -> selectionData -> viewModel composed by useDashboard** — src_hooks_usedashboardfilters_usedashboardfilters, src_hooks_usedashboardselectiondata_usedashboardselectiondata, src_hooks_usedashboardviewmodel_usedashboardviewmodel, src_hooks_usedashboard_usedashboard [EXTRACTED 1.00]

## Communities (34 total, 9 thin omitted)

### Community 0 - "Broadcast Timing Components"
Cohesion: 0.08
Nodes (65): lucide-react, react, recharts, SECTOR_STYLE, DriverCards(), DriverCardsProps, SectorAnalysis(), SectorAnalysisProps (+57 more)

### Community 1 - "OpenF1 API Client"
Cohesion: 0.09
Nodes (61): buildUrl(), buildUrlWithDateFilters(), combineSignals(), createTimeoutSignal(), fetchJson(), getCarDataForLap(), getDrivers(), getIntervals() (+53 more)

### Community 2 - "Dashboard Shell & Rework Plan"
Cohesion: 0.07
Nodes (48): Container + Presenter split, CSS-var semantic colour tokens (COLORS), Orbitron font loading fix, Phase 4 Visual / UI Improvements, Barlow Condensed SIL OFL 1.1 License, IBM Plex Sans SIL OFL 1.1 License, OpenF1RaceControl, OpenF1Weather (+40 more)

### Community 3 - "graphify Skill Docs"
Cohesion: 0.10
Nodes (32): Project graphify skill registration (.claude/CLAUDE.md), /graphify add <url> ingestion, --watch folder auto-rebuild, Extra exports (wiki, Neo4j, FalkorDB, SVG, GraphML, MCP), Token reduction benchmark, Extraction subagent prompt spec, GitHub clone and cross-repo merge, graphify claude install (native CLAUDE.md integration) (+24 more)

### Community 4 - "Tabs & Shared Types"
Cohesion: 0.10
Nodes (22): OpenF1CarData, OpenF1TeamRadio, Props, GROUPS, TAB_LABELS, ComparisonPoint, SectorRow, SelectOption (+14 more)

### Community 5 - "App Entry & Container"
Cohesion: 0.11
Nodes (22): Vite HTML entry (F1 Stories / Telemetry), Legacy CRA public/index.html template, react-dom, App(), buildDashboardUrl(), buildIframeSnippet(), DashboardContainer(), getClipboardErrorMessage() (+14 more)

### Community 6 - "Improvement Phases & Track Map"
Cohesion: 0.15
Nodes (26): Codex Improvement Prompt (8 phases), Phase 1 Critical Bug Fixes, Phase 2 Performance Optimizations, Phase 3 Accessibility, Phase 5 Error Handling & Resilience, Phase 6 Code Quality & Housekeeping, Phase 7 Architecture Refactor, Phase 8 Testing (Vitest + RTL + msw) (+18 more)

### Community 7 - "Strategy & Driver Selection"
Cohesion: 0.13
Nodes (23): OpenF1Driver, OpenF1Pit, OpenF1Stint, Props, DriverChip(), COMPOUND_COLORS, PitStopCard, Props (+15 more)

### Community 8 - "Package & ESLint Config"
Cohesion: 0.12
Nodes (18): name, packageManager, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks (+10 more)

### Community 9 - "TS App Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 10 - "Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, msw (+11 more)

### Community 11 - "TS Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 12 - "URL Filter Parsing"
Cohesion: 0.21
Nodes (15): CURRENT_YEAR, DashboardFilterSnapshot, parseBoundedInt(), parseCircuit(), parseDriverNumber(), parseDriverNumbers(), parseLapNumber(), parseSessionKey() (+7 more)

### Community 13 - "Error Boundary"
Cohesion: 0.20
Nodes (4): @testing-library/user-event, ErrorBoundary, Props, State

### Community 14 - "npm Scripts"
Cohesion: 0.20
Nodes (10): scripts, build, ci, dev, lint, preview, test, test:ui (+2 more)

### Community 15 - "API & Comparison Tests"
Cohesion: 0.22
Nodes (7): msw, @testing-library/react, vitest, fakeMeeting, server, lap, sample

### Community 16 - "PWA Manifest"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 17 - "Position Chart Utils"
Cohesion: 0.36
Nodes (4): OpenF1Position, buildPositionChartData(), MAX_CHART_POINTS, PositionChartResult

### Community 18 - "Chart SVG Export"
Cohesion: 0.39
Nodes (7): appendLegend(), buildExportMarkup(), downloadSvg(), exportChartAsSvg(), ExportChartLegendItem, ExportChartOptions, getChartDimensions()

### Community 19 - "Runtime Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, lucide-react, react, react-dom, recharts, tailwindcss, @tailwindcss/vite

### Community 20 - "Sector Analysis Utils"
Cohesion: 0.48
Nodes (5): IndexedSectorTime, SectorAnalysisData, SectorClass, buildSectorAnalysis(), classifySectorEntries()

### Community 21 - "CI & Deployment"
Cohesion: 0.60
Nodes (6): CI Workflow (verify job), Deploy to GitHub Pages Workflow, Branch Discipline (main source, gh-pages deploy only), F1 Telemetry Dashboard README, GitHub Pages Deployment (/f1-telemetry-dashboard/ base), npm run ci validation script

### Community 22 - "Favicon Branding"
Cohesion: 0.67
Nodes (4): favicon.svg (F1 Stories App Icon), Cyan X Accent (#6CCBFF, checkered-flag/finish motif), f1stories-gradient (coral #FF6847 to amber #FFB347 to cream #FFE2A3), Staggered Speed-Stripe Logo Mark (three slanted bars + dot)

### Community 23 - "512px App Icon"
Cohesion: 0.50
Nodes (4): F1 Stories App Icon (512px), F1 Stories Brand, PWA Manifest Icon, Red F1 Car Badge Emblem (navy arch, cream text)

### Community 25 - "192px App Icon"
Cohesion: 1.00
Nodes (3): F1 Stories App Icon (192px), F1 Stories Brand, Red F1 Car Badge Emblem

## Ambiguous Edges - Review These
- `chartAxis.ts` → `P2-03 Axes expose chart-library defaults`  [AMBIGUOUS]
  telemetry_TASKS.md · relation: references

## Knowledge Gaps
- **162 isolated node(s):** `check.sh script`, `name`, `private`, `version`, `type` (+157 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `chartAxis.ts` and `P2-03 Axes expose chart-library defaults`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `react` connect `Broadcast Timing Components` to `OpenF1 API Client`, `Dashboard Shell & Rework Plan`, `Tabs & Shared Types`, `App Entry & Container`, `Improvement Phases & Track Map`, `Strategy & Driver Selection`, `Package & ESLint Config`, `URL Filter Parsing`, `Error Boundary`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies` to `Package & ESLint Config`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Broadcast Timing Components` to `Dashboard Shell & Rework Plan`, `Tabs & Shared Types`, `Improvement Phases & Track Map`, `Strategy & Driver Selection`, `Package & ESLint Config`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `F1 Stories / Telemetry Visual Rework` (e.g. with `DriverCards()` and `TimingTower()`) actually correct?**
  _`F1 Stories / Telemetry Visual Rework` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Telemetry TASKS checklist (P0-P3)` (e.g. with `Blocked Telemetry Visual Critique` and `BetCast translation principles`) actually correct?**
  _`Telemetry TASKS checklist (P0-P3)` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `useDashboard()` (e.g. with `P0-01 Broadcast contradicts available analysis (sectors/top speed)` and `P0-02 Partial failures masquerade as complete comparison`) actually correct?**
  _`useDashboard()` has 2 INFERRED edges - model-reasoned connections that need verification._