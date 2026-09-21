# F1 Stories / Telemetry — visual rework

Implementation date: 21 September 2026. **Not deployed.**

The application has been recomposed around the F1 Stories publication identity. Code-quality and component workflow checks pass. **Visual acceptance is still pending:** this environment could neither start a local server nor launch Chrome. No screenshots, live-data browser validation, or side-by-side rendered sibling comparison are claimed.

## 1. Current design problems identified

The supplied working tree already included visual edits. Its actual starting point used Roboto, a cyan identity, gradients, universal rounded surfaces, a sticky multi-row toolbar, repeated lap summaries, and separate mobile/desktop control trees. It did not still use Orbitron as its active heading font. Existing edits were used as the baseline rather than reverted.

The biggest structural problem was the distance between selecting a session and seeing a chart: utilities, presets, lap cards, summary chips, the full driver roster, and an ungrouped ten-view rail all competed with the analysis. Telemetry repeated the fastest selected lap in both driver cards and a separate reference card. Positions rendered twenty small cards before its chart. Strategy repeated remaining stint laps as a large number and a second metric.

## 2. F1Stories visual traits identified

The live homepage was inspected through the web reader at https://f1stories.gr/. It exposes the F1 STORIES. masthead, editorial section labels, Greek-first publication hierarchy, and Data Hub relationship. The web reader does not expose computed styles or screenshots.

Design values were inspected directly in the available local F1Stories checkout:

- `../f1StoriesPage/home.css`: homepage charcoal overrides.
- `../f1StoriesPage/styles/editorial.css`: shared typography, light palette, controls, spacing and masthead.
- `../f1StoriesPage/styles/home-fonts.css`: self-hosted font faces and glyph subsets.

| Token | Dark homepage | Light editorial system |
| --- | --- | --- |
| Page | `#181a1c` | `#f2eee4` |
| Surface | `#222426` | `#e9e3d6` |
| Secondary surface | `#2c2e30` | `#dfd9ca` |
| Text | `#eee7dc` | `#20251f` |
| Muted | `#bcb8b0` | `#5b6256` |
| Accent | `#ff826b` | `#a82e1c` |
| Rule | `#47494a` | `#c8c8b9` |

IBM Plex Sans is the reading/interface family; Barlow Condensed is the brand family. The parent uses small uppercase metadata, substantial but tightly spaced headings, restrained rules, 2px buttons, 4px media corners, and a 1476px maximum container with 48px desktop gutters. Its homepage has some expressive editorial treatments; those decorative treatments were not transferred into charts.

Local source matches the requested palette and the live homepage's content structure, but its exact deployment revision could not be verified.

## 3. BetCast translation principles reused

The live BetCast URL was requested but unavailable through the web reader. Its current local source was inspected in `../BetCastVisualisation/src/App.css` and `src/index.css`.

Reused principles: visible parent wordmark, restrained sub-brand, neutral page, readable data typography, thin rules instead of card outlines, native mobile analysis selection, compact scope labels, and quiet utilities. Telemetry has a session/driver/lap workflow and technical traces; it does not copy BetCast's profit summaries or page composition.

## 4. New visual system

- Coherent dark and light tokens for page, surface, text, rules, controls, focus, chart structure, status, weather, sectors and tyres.
- Removed obsolete toolbar, brand-card, pill, gradient, shadow, and embed-surface tokens.
- Self-hosted IBM Plex Sans Latin, Latin Extended and Greek subsets, plus Barlow Condensed for the Latin wordmark. Font licenses are included.
- Tabular numbers use the interface family. Monospace is reserved for actual code rather than the whole timing interface.
- Mostly square sections, 2px controls, no page gradients, glow, background grid, or sticky glass header.
- Main content is capped at 1280px including gutters: narrower than the publication to keep analytical charts readable.

## 5. Header changes

`F1 STORIES. / TELEMETRY` is the masthead, followed by the actual circuit/session as the page heading. Parent branding is integrated rather than represented as a partner or edition badge. Loading feedback says “Loading session” rather than implying that historical data is live. Feedback remains a status announcement.

Tools uses native disclosure for Back, Share, Embed, Theme, Print, Split and presets. The parent wordmark remains direct navigation to F1 Stories. There is no permanent wall of utilities.

## 6. Filter changes

One labelled session scope serves all layouts. Season, Grand Prix, Session and Lap share a rule and consistent control treatment. Mobile uses two columns, tablet/desktop four. Previous/next lap controls have accessible names. Existing callbacks, dependent resets, values and disabled states are retained.

Duplicated lap-focus cards, P1/P2 pills and quick chips were removed from the presentation. Their useful data is already represented by selected drivers, lap selection, timings and the strategy view.

## 7. Driver selection changes

Selected drivers are always visible as comparison context. Thin team-colour marks identify them; surrounding text and surfaces remain neutral. The complete roster opens via “Edit drivers”, using labelled buttons with `aria-pressed`, driver surnames and explicit selection guidance. No full roster blocks the initial chart.

The existing one-to-four selection rules remain unchanged, including replacing the first selection when a fifth driver is chosen. Embed also exposes selected identities and an editable roster.

## 8. Navigation changes

Desktop groups all ten existing views into Performance, Race and Context. Active navigation uses an underline and `aria-current`, with a relationship to the analysis content. These are native navigation buttons rather than an incomplete ARIA tab widget.

Mobile and tablet use one labelled native select with optgroups. The selected view is explicit; no swipe-only rail is needed. Share/embed view actions remain available.

## 9. Chart changes

The shared Panel now provides a heading, explanation, top rule and content, without another filled box. Decorative title icons are no longer rendered. Charts retain download, fullscreen and panel embed handlers.

Cartesian grids use horizontal neutral rules. Axes, RPM traces, references and tooltip surfaces follow the theme. Legends wrap rather than requiring horizontal swiping. Team colours still distinguish data series. Tooltips use compact label/value columns, a thin border, neutral text, explicit units for telemetry/intervals, timing precision, and unsigned percentages for the display of the mirrored brake trace. The underlying negative brake values remain unchanged.

## 10. Telemetry changes

Speed Trace is first. Compact lap comparisons follow, then speed delta, throttle/brake, sector comparison, sector times, lap-time history and gap history. The reference/density/comparison card trio was removed; sample counts remain in the speed context where applicable.

Sector proportions use adjacent neutral segments and an explicit S1/S2/S3 caption. Sector timing tables retain all measurements and their existing benchmark calculations. Their scroll region is keyboard focusable on narrow screens. All chart series and calculations are retained.

## 11. Other tab changes

- **Strategy:** stint sequence leads; tyre context and pit stops use aligned rows. “Recorded stint end” clarifies the existing historical value without changing its calculation. Duplicate remaining-lap display was removed.
- **DRS/Gears/RPM:** quieter summaries, neutral chart structure and readable RPM traces; existing technical measurements retained.
- **Track map:** thinner neutral track, smaller endpoint markers, readable labels beside the markers. GPS construction and sampling remain unchanged.
- **Positions:** position history leads; latest standings use compact ruled rows instead of twenty cards.
- **Intervals:** removed individual summary-card borders and backgrounds; kept gap calculations, DRS windows and reference thresholds.
- **Radio:** recording entries read as an editorial list with driver, timestamp and a named listening link; no chat bubbles or timestamp pills.
- **Race control:** timestamp/category/message rows; semantic flag-colour rules rather than coloured cards. Filter buttons wrap and expose pressed state.
- **Weather:** neutral summary numbers, restrained trace colours, both existing charts retained.
- **Broadcast:** lap classification and driver detail replace HUD-oriented titles; quieter rules, typography and surfaces retain the existing tables, ranking and sector semantics.

## 12. Mobile changes — 390 × 844 target

20px gutters, compact masthead, two-column scope, collapsed roster, grouped native analysis selector and chart-first telemetry. Touch controls have 44px minimum height. Legends wrap, long tables scroll inside their own region, and the Tools disclosure is capped to viewport width.

These are implemented responsive rules, **not screenshot-verified results**. Real chart labels, tooltips, long event names, and browser-native selects still require the 390px rendered check.

## 13. Tablet changes — 768 × 1024 target

32px gutters, four-column scope, five-column expanded driver roster, grouped native analysis selection and four-column timing comparisons. Charts remain one column below 1024px even when split preference is stored, avoiding two cramped tablet plots. Four-driver timing density needs rendered confirmation.

## 14. Desktop changes — 1440 × 900 target

1280px maximum shell, 48px internal gutters, three analysis families, visible driver surnames and restrained utilities. Split mode enables two columns at 1024px and above, with the first analysis item spanning both. Width is bounded instead of filling the entire viewport with a giant chart.

## 15. Light/dark treatment

Light mode uses warm paper and dark ink rather than an inversion. Status, tyre, sector and weather tokens have darker light-mode variants. Both themes retain URL precedence and localStorage persistence. Print styling removes controls and uses paper/ink text and neutral chart structure.

Team colours remain the OpenF1 colours; exact contrast of pale series and legacy colour-coded names must be checked on real light-mode charts. No blanket recolouring or data-identity change was made.

## 16. Embed treatment

Compact parent masthead, circuit/session heading, lap/driver context, grouped view selection and the same unboxed chart surfaces. Session controls are available under “Adjust session & lap”, rather than deleted. Existing URL construction, selected view, light theme, open-full link, panel anchors, iframe heights, and embed clipboard handlers are retained.

## 17. Files changed

Presentation and integration:

- `src/components/DashboardContainer.tsx`: removed duplicate visual summary derivation, layout classes, reduced-motion anchor behavior.
- `src/components/DashboardShell.tsx`: presentation props, analysis region, embed comparison context, publication footer.
- `src/components/ErrorBoundary.tsx`: theme-aware error colour and small corners.
- `src/components/dashboard/DashboardHeader.tsx`
- `src/components/dashboard/DashboardSelectors.tsx`
- `src/components/dashboard/DriverSelector.tsx`
- `src/components/dashboard/DashboardTabs.tsx`
- `src/components/dashboard/shared.tsx`
- All ten view files: `TelemetryTab`, `StrategyTab`, `EnergyTab`, `TrackMapTab`, `PositionsTab`, `IntervalsTab`, `RadioTab`, `IncidentsTab`, `WeatherTab`; Broadcast is updated through `broadcast/DriverCards.tsx`, `broadcast/TimingTower.tsx` and shared styling.
- `src/constants/colors.ts`: export and iframe background fallbacks.
- `src/index.css`, `src/fonts.css`, `src/fonts/*.woff2`, `public/fonts/*-OFL.txt`.
- `index.html`: self-hosted fonts replace external font links; title/theme metadata.
- `src/components/__tests__/VisualWorkflow.test.tsx`.
- `TELEMETRY_VISUAL_REWORK.md`.

Pre-existing changes in `context.md`, `public/index.html` and `public/manifest.json` were left untouched. Pre-existing edits to the main presentation files were built upon.

No changes to API modules, data hooks, race calculation helpers, dependencies, lockfile, Vite config, GitHub workflows, Pages configuration, or branches. No deployment, push or commit was performed.

## 18. Verification performed

`npm run ci` passes: ESLint, TypeScript, production build, and **51 tests across 8 files**. The original 46 tests remain intact. The new five tests cover:

1. Scope controls, lap stepping, driver selection, all ten view routes, desktop/mobile navigation wiring and URL updates.
2. Presets, clipboard share/embed, print callback, split layout, theme and localStorage persistence.
3. Restoring a light article embed, switching its lap, preserving embed URL state and opening the full product.
4. Timing tooltip units/precision and mirrored brake display.
5. Loading status and error retry accessibility.

These tests use the real container, shell and URL filter hook with mocked data; they do not prove live API success or browser layout. Clipboard and print are mocked. Existing API integration tests use MSW, not a live OpenF1 connection. The build resolves all four font assets; no unresolved-font warning remains. A token scan found no undefined CSS variable references. `git diff --check` passes.

### Browser environment limitation

- `npm run dev -- --host 127.0.0.1` failed: `listen EPERM: operation not permitted 127.0.0.1:5173`.
- Shell fetch of F1Stories failed: `Could not resolve host`.
- Installed Chrome launched through available Puppeteer with pipe transport terminated with `TargetCloseError` before page creation.
- No browser connector was available. The configured approval policy prevents requesting broader execution permissions.

Consequently, baseline rendering, real-data interaction, browser console inspection, screenshots at 390×844 / 768×1024 / 1440×900, and the side-by-side sibling test remain unperformed. **No screenshot paths are listed because no screenshots were captured.**

### Five-point second-pass critique

This was a source-level critique, not a rendered visual review:

| Remaining template-like trait after the first implementation | Subtraction/fix |
| --- | --- |
| Interval summaries still had individual containers | Removed their card wrapper styling; retained aligned timing columns |
| Weather summaries coloured every measurement | Neutralised summary values; kept series differentiation in the chart |
| Racing typography remained in secondary views | Reduced heavy weights and wide tracking; changed broadcast timing text to Plex tabular numerals |
| Data notes still appeared as separate cards | Converted them to plain captions |
| Sector proportion bars looked like brightly coloured badges | Used adjacent neutral segments with explicit sector-order context |

### Outstanding rendered review

Run `npm run dev` in an environment that permits local serving. At each requested viewport inspect Telemetry, Strategy, Positions, Track Map and Radio/Race Control, then repeat representative checks in light theme and embed. Use a historical race session with real OpenF1 data and two-to-four drivers. Check chart hover/touch tooltips, download/fullscreen, print preview, split layout, loading/error transitions, console messages, page overflow and Greek font rendering. Compare the current F1Stories and BetCast pages alongside Telemetry before final visual acceptance.

## 19. Remaining compromises

- The requested rendered visual loop is blocked, so this is a code-verified implementation awaiting visual acceptance, not a claim that the final visual standard has been demonstrated.
- Exact live BetCast styling/deployment revision could not be checked. Local reference source supplied the design values.
- Native selectors deliberately retain platform-specific popup presentation.
- Long sector tables preserve all columns via local horizontal scrolling. The main analysis navigation does not require swiping.
- Split mode falls back to one column on mobile/tablet; its preference and URL state remain intact.
- Track markers remain final recorded GPS positions, not a synchronised playback system. Position charts retain session-bucket semantics. Existing analytical limitations and calculations were not rewritten as part of this visual task.
- Live sharing permissions, actual print output, fullscreen behavior, image/font loading and four-driver chart legibility remain browser checks.
