# Telemetry design tokens — Priority 4C

Authority: `georgiosbalatzis/f1StoriesPage/styles/editorial.css` and its specification
`docs/design-tokens.md`. Synced from revision `2523a16a9de82d463428f4d9b46aeb226c840637`
(audited 2026-10-03–04); the main repository was clean and its `check:tokens` passed.
[design-tokens.json](design-tokens.json) is an offline local snapshot, not a new authority.
`npm run check:tokens` verifies both resolved themes, aliases and fixed editions; CI runs it.
It has no dependency, network access, runtime import or sibling-checkout requirement.

## Audit and convergence

Telemetry already used Plex for UI/body and Barlow for product/brand labels, flat ruled
panels, compact controls and the established Race Desk system. Seven of eight light core
values matched; only the signal matched the dark core (the masthead already used canonical
dark). The old cooler dark dashboard palette and extra generic text/grid shades were drift.
No sizes, layout, chart dimensions, spacing, typography, navigation architecture, theme-state code,
copy, calculations, API behavior or data transformations were changed.

| Core role | Light before → after | Dark before → after |
|---|---|---|
| Canvas | `#f2eee4` unchanged | `#181a1c` → `#1b1a19` |
| Surface | `#e9e3d6` unchanged | `#222426` → `#242321` |
| Alternate surface | `#dfd9ca` unchanged | `#2c2e30` → `#2e2c29` |
| Primary text | `#20251f` unchanged | `#eee7dc` → `#eee8db` |
| Secondary text | `#565d51` → `#5b6256` | `#bcb8b0` → `#b6bbac` |
| Border | `#c8c8b9` unchanged | `#47494a` → `#4b5146` |
| Accent | `#a82e1c` unchanged | `#ff826b` → `#ff775f` |
| Signal | `#ed4c32` unchanged | `#ed4c32` unchanged |

Canonical names now define the shared core; existing usages retain these aliases:

| Local aliases | Canonical role |
|---|---|
| `bg`, `paper` | `bg-base` |
| `surface`, `surface-soft-2` | `bg-surface` |
| `surface-soft`, `surface-avatar` | `bg-surface-alt` |
| `text`, `text-strong`, `text-soft`, `ink` | `text-primary` |
| `text-muted`, `text-dim`, `text-faint`, `chart-axis`, `chart-axis-soft` | `text-secondary` |
| `line`, `chart-grid` | `border` |
| `line-strong` | `text-secondary` (strong control/tooltip edges) |
| `focus` | `accent` |

Names above omit `--`. Telemetry's historical `paper`/`ink` follow the resolved theme;
main-site inversion uses fixed paper/ink. Dedicated `colophon-bg`/`colophon-text` preserve
that fixed inversion here. Sponsor logo hover chips retain fixed paper and its matching
secondary foreground. `accent-hover`, `accent-muted`, `signal-ink`, inverse metadata/rules
also mirror canonical values. Selection/accent borders derive from accent locally.
Export/iframe fallback **colors** follow the core; export/share/embed behavior is unchanged.
The obsolete `accent-strong` alias was removed after moving its only series usages to gear.

## Preserved visualization semantics and exceptions

Exact theme-specific numeric inks remain local, including:

- Driver/team colors supplied by OpenF1 and existing light trace contrast adjustment;
  comparison traces, reference/RPM/gear traces and DRS thresholds/activation.
- Tyre compounds (including historical compounds), sector ranking and sector washes.
- Track base/centre dashes, faster-stretch traces, start/finish and driver markers/halos.
- Gain/loss, incident/radio/status, weather series, position leader and neutral lap bars.
- Gap teal bars/sign and their neutral rails.

Dedicated gear/DRS/lap/leader/track tokens freeze values formerly shared with generic UI.
Generic chart surfaces, grid/turn guides, ticks, legends and tooltip chrome use core roles;
measurement/reference strokes remain independent. Geometry and numeric inks are audited
separately: changing a guide's border color is not a change to a driver trace.

Existing gap and track technical spreads stay dark even on a light page; their UI now uses
canonical dark surface/text/border/accent, while map/measurement inks keep their old values.
The track's single 40px cut corner, circular markers, existing 1.5px selector underlines,
media 4px radius, overlay depth and print-on-white edition are intentional local geometry.
Telemetry's `font-display` remains a local alias to Barlow for product display, unlike the
main site's Plex editorial alias; actual font roles, font files and metrics are unchanged.

## Focus and contrast

Default focus: 2px accent outline, 5px offset. Race Desk retains its permitted 2px outward
clearance; sponsor controls retain 2px. Tabs (-4px), lap-bar controls (-2px), mobile-menu
links (-5px) and buttons/summaries inside clipped chart panels (-4px) use inset rings.
The latter fixes clipped chart action rings without changing overflow or layout. Keyboard
focus also reveals the full tab with native nearest scrolling: browsers otherwise leave
partially visible focused tabs clipped. Tab selection and initial centring remain unchanged. Signal-band
focus uses signal ink; light inverted-footer focus uses fixed paper, dark uses accent.
The fixed masthead's `z-index: 1` and existing overlay layers remain unchanged.

Secondary text passes 4.5:1 on canvas/surface in both themes (minimum 4.94:1). On light
alternate surface it is 4.48:1; Broadcast tower/sector hover backgrounds therefore use
surface, preserving text semantics and geometry. Primary/secondary tooltip/table/footer/
axis/nav text and status text are checked on their actual composites. Signal ink is 4.77:1.
The existing red wordmark punctuation is a brand-mark exception, not a body-text pairing.

## Raw-color inventory

Production CSS/TS/TSX/JS literals (`#`, rgb/rgba, hsl/hsla; tests excluded):
**164 occurrences / 78 unique before → 116 / 69 after**. All are centralized in
`src/index.css` and `src/constants/colors.ts`; colors arriving as driver data are additional
runtime domain values, not source literals. No goal of zero literals is appropriate.

| Purpose | Before | After |
|---|---:|---:|
| Shared generic primitives/fallbacks, including drift before | 87 | 34 |
| Data/domain definitions (some newly separated from UI aliases) | 61 | 66 |
| Print edition | 8 | 8 |
| Existing shell/media paints (sheens, hover washes, inverse gradient/white) | 7 | 7 |
| Trace-adjustment black fallback | 1 | 1 |

No unexplained generic palette remains. Core/fixed-edition definitions deliberately contain
literals; consumers use aliases. White/paper translucent shell paints, print ink and the
algorithm fallback remain specialized exceptions. Source definitions and runtime paints
were both compared; fewer repeated literals do not imply fewer domain colors.

## Verification and next product

Audit evidence is local and ignored under `.perf-baseline/priority4c/`: source inventory,
96 paired full-page views (88 dashboard + eight single-driver cases), geometry/paint JSON,
footer/mobile-menu/focus views and four auto-resolved cases. Six widths are
1440/1280/1024/768/390/375 in both themes; all tabs are represented, with dense tables,
Energy, Track Map, Tires/Strategy and Broadcast included. Geometry compares bounding boxes,
font metrics, margins/padding/borders/radii, SVG paths and chart dimensions.

Ghost Car Priority 4D should read the same authority, inventory before editing, separate
fixed-dark/3D/map inks from UI primitives, retain exact car/track/comparison values and
geometry, mirror core tokens offline, and test actual focus clipping and `auto`. Do not
copy Telemetry's technical-panel, tyre or DRS exceptions mechanically, and preserve Ghost
Car's intentional compact loaded-mobile replay. No sibling was changed by Priority 4C.


Priority 4C validation (2026-10-04):

- `npm run ci`: token guard, zero-warning lint, typecheck, production build and all
  **124 tests / 25 files passed**, including theme initialization/migration and
  preset/split/share/embed/export coverage. The contrast test reader now resolves aliases;
  its assertions and trace adjustment algorithm were preserved.
- `node scripts/shell-parity.mjs`: **36/36 passed** (Chromium/Firefox/WebKit × six widths ×
  light/dark), including actual menu/focus/touch/stacking, theme persistence and footer checks.
- Fresh paired captures: **88/88 identical geometry**, all original domain tokens unchanged,
  **1,620 paint records** checked; only generic grid references changed. Eight additional
  single-driver Energy/Track Map/Intervals/Broadcast pairs have exact data paints/paths;
  all 55 original numeric domain declarations and 12 marker/halo comparisons match.
- Pixel comparison (existing >24 RGB-sum tolerance): light 0.029–2.717%, dark 0.154–2.449%;
  all 88 image dimensions identical. Small light text/grid differences and the warmer dark
  edition are intentional; exact numeric comparisons include small dark shifts below that
  screenshot threshold. Typography, SVG path geometry, control/table sizes and spacing match.
- Historical `visual-baseline --compare --widths=1440,390`: captured all 120 images but its
  old dimensional gate fails. Before Priority 4C, Chromium snapshots were already 46px
  shorter on desktop and 87px on mobile. Those historical files were preserved. A separate
  reference set using the unchanged comparator/0.1% threshold passes all 80 strict
  Chromium/Firefox captures; two WebKit Track Map jitter advisories remain.
- **4,612 focused-control checks** across all tabs, 1440/390 and both themes have
  visible 2px rings and no clipping after the local fixes. All **720 forward/backward tab checks** pass in Chromium/Firefox/WebKit across six
  widths and both themes; contrast scanning found no text failures beyond logo punctuation.
  Four actual tooltip/open-tools cases also pass contrast/focus checks at 1440/390.
- A final 12-image, three-engine Telemetry comparison after the focus-scroll correction
  passes all strict captures (one WebKit mobile jitter advisory).
- Browser share links, clipboard iframe snippets and standalone SVG downloads passed in
  both editions, including canonical background/foreground and unchanged driver traces.
  Stored `auto` resolves to canonical OS light/dark at 1440/390 and remains `auto`, including
  after reloading with the opposite OS preference. Existing Priority 2 resolves OS at load;
  this task does not add a live OS listener or change pre-paint metadata.
- Performance replay: cold charts 1925→1867ms mobile, 1870→1865ms desktop; 15 lap steps
  160→183ms with two car-data requests/15 history updates and no long tasks. CLS remains
  0.0003 mobile / 0.0005 desktop, no 429s; 6× CPU tab/theme tasks stay near baseline
  (Telemetry 62→55ms, repeat 56→59ms, theme 66→67ms). Timing differences are single-run
  variation, not evidence of a speed improvement. Initial gzip JS **+45 bytes**, CSS
  **+278 bytes**; fonts/vendor chunks/requests unchanged, no dependency or network cost.
  Palette/guard add no runtime JS; the small focus handler runs only on tab focus.

Implementation files changed: `src/index.css`, `src/constants/colors.ts`,
`EnergyTab.tsx`, `IntervalsTab.tsx`, `TrackMapTab.tsx`, `DashboardTabs.tsx` (presentation/focus
only); `P2Polish.test.tsx` (alias-aware token reader); `package.json` (guard in CI); this
specification, `docs/design-tokens.json`, `scripts/check-design-tokens.mjs`.
No lockfile, product/data logic, shell structure, theme persistence or localized copy changed.

Priority 4C is complete with the documented historical-baseline and WebKit advisories.
The next implementation priority is Ghost Car 4D; old English system strings and historical
visual-baseline maintenance remain separate backlog work. No deploy, commit or PR was made.
