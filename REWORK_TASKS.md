# F1 Stories Telemetry: Rework Tasks

Goal: make Telemetry look and read like a page of **f1stories.gr** instead of a separate dark dashboard.
Nothing here is implemented yet. Work phase by phase; tick a task only when its acceptance check passes.

- Mockups: `docs/rework/` (PNGs, desktop 1440 and mobile 390) and `docs/rework/mockups/*.html` (live HTML, site fonts and tokens).
- Baseline: `docs/rework/00-current-*.png` (this app today) and `docs/rework/00-f1stories-data-hub.png` (the site's closest sibling page).
- Re-render: `python3 -m http.server 5301` from the repo root, then open `http://127.0.0.1:5301/docs/rework/mockups/a-data-hub.html`.

---

## 1. Decisions (agreed 2026-09-30)

| Topic | Decision |
|---|---|
| Direction | **A (Data Hub Chapter) as the base**, plus **B's dark Tech Desk gap card** and **C's lap-time strip** for picking the lap |
| Language | **Greek UI, with F1 terms kept in English** (Telemetry, DRS, Track Map, Intervals, Team Radio, Race Control, Broadcast, sector/lap codes) |
| Theme | **Follow the site**: stored choice, then `?theme=`, then `prefers-color-scheme`. Light paper and dark both stay |
| Hosting | **Stay on github.io**. Keep reading `?theme=`. Moving the domain is a later decision |
| Masthead | **Full site navigation**, the same links as `f1StoriesPage/partials/nav.html` (absolute `https://f1stories.gr/...` URLs), plus race countdown and theme toggle |
| Chart headlines | **Rule-based headlines generated from the data**, falling back to a neutral title |
| Views | **Keep all 10 tabs and restyle them.** No URL or embed breakage |
| f1StoriesPage repo | **Out of scope**. Suggestions are listed in §7 |

## 2. Why it looks disjoint today (diagnosis)

The colour tokens already match the site's dark home palette (`src/index.css :root` copies `body.home-page`). The problem is that none of the site's **signature layout moves** are used:

| f1stories.gr does | Telemetry today does |
|---|---|
| Light cream **paper** by default (`#f2eee4`), with dark as an option | Hard dark default. Light theme only by toggle; ignores the OS setting |
| **Giant Barlow Condensed uppercase display** with a red period: `THE GRID.`, `THE NUMBERS.`, `ON AIR.` | Plain 42px Plex `Baku · Race` |
| Numbered, letter-spaced kickers (`05 / F1 DATA HUB`) above a 1px ink rule | A small `DATA HUB / RACE ANALYSIS` label with no rule |
| A **red signal band** (`#ed4c32`) with status and a condensed slogan | None |
| Full-width **tab strip** with a red underline (Data Hub) | Three grouped mini-tab clusters |
| **2px ink top rule** on tables; team colour as a 3px left bar; big position numerals | Thin hairlines everywhere; charts stacked one after another with no hierarchy |
| A **dark Tech Desk panel** inside the light page (teal accent, huge `+2.473s` numeral, S1/S2/S3, bar rows) | No summary numerals; every section is a chart |
| Media with a 40px **rounded bottom-right corner** (`--cut-md`) | None |
| Full site nav, dark ink colophon footer | A product lockup and a one-line footer |
| Greek copy | English copy |

The result is a long, flat scroll of same-weight charts (see `00-current-desktop.png`). Every section has the same visual weight, so nothing tells the reader what matters.

## 3. Target design spec (A + B card + C strip)

See `A-data-hub-desktop.png` / `A-data-hub-mobile.png` for the page, `B-lap-story-desktop.png` ("03 / Tech desk" section) for the card, and `C-pit-wall-desktop.png` (the lap bars under the header) for the strip.

Page order, top to bottom:

1. **Site masthead**: logo and `F1 STORIES.` wordmark; nav links; race countdown; theme toggle. On mobile, a hamburger menu.
2. **Hero**: kicker row `F1 STORIES / RACE DESK` … `ΤΗΛΕΜΕΤΡΙΑ & ΑΝΑΛΥΣΗ ΓΥΡΟΥ` above a 1px ink rule. Display headline `TELEMETRY.` (red period). Subtitle `Baku · Αγώνας · Γύρος 49 από 51`. Right-hand aside `Κάθε γύρος, μια ιστορία.` (desktop only).
3. **Signal band**: `● Live δεδομένα · OpenF1 | RUS vs VER | Γύρος 49 / 51`, with the slogan `EVERY TENTH COUNTS.` on the right (desktop only). Loading and partial-data status goes here.
4. **Scope bar**: underlined fields (the site's contact-form style): Σεζόν, Grand Prix, Συνεδρία, Γύρος (‹ n ›), Οδηγοί (chips with team bars and `+ ΠΡΟΣΘΗΚΗ`).
5. **Lap strip (from C)**: one bar per lap for the reference driver, with height set by lap time. The selected lap is red, safety-car laps are amber and pit laps are grey. Click or tap a bar to select that lap.
6. **Tab strip**: all 10 views in one row with a red 2px underline. Scrolls horizontally on mobile.
7. **Section header**: `■ ΤΗΛΕΜΕΤΡΙΑ · ΓΥΡΟΣ 49` kicker, then an **h3 headline generated from the data** (Plex 600, about 46px), then a lead paragraph.
8. **Card bar**: `Καρτέλα …` with a caption, plus the outline buttons `Κοινοποίηση καρτέλας` and `Ενσωμάτωση καρτέλας` (the same pattern as the Data Hub).
9. **Summary strip**: paper-2 background with a 3px signal left border. Shows the session name, each driver's lap time, the gap and top speeds.
10. **Primary chart** on paper, with corner ticks (T1…) on the x-axis instead of 0–100%.
11. **Pair row**: the **Tech Desk gap card (from B)**, always dark (teal, big `+0.104s`, S1/S2/S3, slow/medium/fast-corner bars), next to the **sector table** in THE NUMBERS style.
12. Secondary charts (delta, throttle and brake) use the same heading pattern.
13. **"Next" row**: numbered links to the other views (`01 TELEMETRY …`), like the homepage's 5-column quick links.
14. **Site colophon footer** (dark ink).

Tokens: take the values from `f1StoriesPage/styles/editorial.css` (`body.editorial-page` and `[data-theme="light"]`): paper `#f2eee4` / `#e9e3d6` / `#dfd9ca`, ink `#20251f`, ink-2 `#5b6256`, rule `#c8c8b9`, signal `#ed4c32`, light accent `#a82e1c`, dark accent `#ff775f`, teal `#3c9990` / `#6ec6bb`, `--cut-md: 40px`, control radius 2px, no shadows.

---

## 4. Phases and tasks

Each task lists **Files**, **Change** and **Accept**. Keep diffs small. Don't introduce an i18n library, a CSS framework or a component library. Plain CSS in `src/index.css` and one copy module are enough.

### Phase 0: Foundations

- [x] ✅ **R0-01 Tokens rebased on editorial.css**
  Files: `src/index.css`.
  Change: make **light paper the base `:root`** palette and move dark into `[data-theme="dark"]` (see R0-02). Add `--paper-*`, `--ink*`, `--signal`, `--teal*`, `--cut: 40px` and `--font-display` (Barlow Condensed). Keep the existing semantic chart variables (`--color-sector-*`, `--color-compound-*`, …) but retune their light values against paper. Add a one-line comment naming the source file, `f1StoriesPage/styles/editorial.css`, so a later sync is easy.
  Accept: every colour contrast in `colors.ts` still passes (text ≥4.5:1, traces ≥3:1, the existing `chartColorForTheme` logic); no raw hex values outside `index.css` and `constants/colors.ts`.

- [x] ✅ **R0-02 Theme resolution that matches the site, with no flash**
  Files: `index.html`, `src/components/DashboardContainer.tsx` (`readInitialThemeMode`, `THEME_STORAGE_KEY`), `src/components/DashboardShell.tsx` (the `theme-light`/`theme-dark` class).
  Change: add a tiny inline script in `<head>` that mirrors `f1StoriesPage/scripts/theme-init.js`: `?theme=`, then localStorage `f1stories-theme` (the site's key name; separate origin today, same key if the app ever moves to the site's domain), then the old key `f1-telemetry-dashboard:theme` (migrate it), then `prefers-color-scheme`. Set `data-theme` on `<html>`. React reads the attribute instead of recomputing. Replace the `.theme-light` class with `[data-theme]`.
  Accept: a first visit with OS in light mode renders paper with no dark flash; `?theme=dark` wins; the toggle persists across reloads; embeds still honour `?theme=`.

- [x] ✅ **R0-03 Greek copy module**
  Files: new `src/copy.ts` (a plain `as const` object, Greek only), `index.html` (`lang="el"`, Greek `<title>` and meta description), `src/components/dashboard/tabLabels.ts`.
  Change: a single place for UI strings. Tab labels in Greek where the site uses Greek (`Τηλεμετρία`, `Θέσεις`, `Ελαστικά`, `Καιρός`), English where the site keeps English terms (`DRS & RPM`, `Track Map`, `Intervals`, `Team Radio`, `Race Control`, `Broadcast`). Use `el-GR` for `toLocaleTimeString` (`useDashboardViewModel.ts:255`) and for dates.
  Accept: `copy.ts` exists with the Greek tab labels, `lang="el"`, Greek meta description and `el-GR` time formatting. Remaining English strings move into the module as R1–R6 touch each component (done in Phase 0: tab labels only).

- [x] ✅ **R0-04 Test strategy for the copy change**
  Files: `src/components/__tests__/{P2Polish,P3Polish,VisualWorkflow,ErrorBoundary}.test.tsx` (58 `getBy*` queries today).
  Change: point text queries at `copy.ts` constants, or at roles and accessible names, instead of literal English. Do this per phase as strings change; don't do a big-bang rewrite.
  Accept: `npm run ci` is green at the end of every phase.

### Phase 1: Site chrome (masthead, hero, band, footer)

- [x] ✅ **R1-01 Full site masthead**
  Files: `src/components/dashboard/DashboardHeader.tsx`, `src/index.css` (`.masthead*`, `.brand`, `.utility-menu`).
  Change: rebuild the nav to match `partials/nav.html`: logo (48px), `F1 STORIES.` in Barlow 28px with a red dot, links (Αρχική, Άρθρα, YouTube, Βαθμολογία, Δεδομένα, Συντάκτες, BetCast) as absolute f1stories.gr URLs, a 2px short red underline on hover and active, and a theme toggle drawn as the site's moon/sun glyph. Below 1024px, a hamburger opens the link list plus the theme toggle (native `<details>`, no JS library). Move **Tools** (Back, Print, Split view, presets) into an overflow menu (`⋯`) on the right, since Share and Embed move to the card bar (R3-03). The race countdown shows the next session from OpenF1 `/meetings`, which is already fetched; hide it if nothing upcoming is in the data.
  Accept: a side-by-side screenshot at 1440 and 390 with f1stories.gr shows the same masthead height, wordmark, link order and toggle position.

- [x] ✅ **R1-02 Hero with display headline**
  Files: `DashboardHeader.tsx` (`.session-heading` block), `index.css`.
  Change: add a kicker row with a 1px ink rule. `TELEMETRY.` uses `font: 700 clamp(64px,10vw,150px)/.84 var(--font-display)`, uppercase, red period. The h2 subtitle holds the session context (`{circuit} · {session} · Γύρος {lap} από {total}`). The right aside (≥1024px) has the tagline. Use a paper-2 → paper vertical gradient, like `/standings`. Keep the `h1` semantics on the display word and put the session in the `h2`, so the document outline stays sensible.
  Accept: matches `A-data-hub-desktop.png` above the band; on 390px the headline stays on one line (`TELEMETRY.` at about 64px).

- [x] ✅ **R1-03 Signal band as the status line**
  Files: `DashboardHeader.tsx`, `DashboardShell.tsx` (the partial-data `<section>` currently at the top of the ErrorBoundary), `index.css`.
  Change: a full-bleed `#ed4c32` band with ink text shows `● Live δεδομένα · OpenF1`, the driver comparison, and the lap. The **loading spinner, the feedback toast text and the "2 of 4 drivers loaded" message** move here with `role="status"`, and retry actions render as underlined ink links inside the band. Desktop-only slogan in Barlow 24px.
  Accept: with a failed driver request, the band reads `2 / 4 οδηγοί φορτώθηκαν · Επανάληψη NOR`, and nothing else on the page shifts.

- [x] ✅ **R1-04 Colophon footer**
  Files: `DashboardShell.tsx` (`.page-footer`), `index.css`.
  Change: a dark ink gradient footer, as on the site: wordmark, tagline `Τεχνική ανάλυση, άποψη και ελληνική F1 κοινότητα.`, uppercase letter-spaced links, and the `Δεδομένα από OpenF1` credit.
  Accept: visually identical to the site footer in both themes.

### Phase 2: Controls

- [ ] **R2-01 Scope bar with underlined fields**
  Files: `src/components/dashboard/DashboardSelectors.tsx`, `DriverSelector.tsx`, `index.css` (`.session-scope`, `.scope-fields`, `.dashboard-select`, `.driver-*`).
  Change: keep the native `<select>` elements but style them as the site's contact-form fields: uppercase 11px label, 16px value, no box, 1.5px ink bottom border, custom caret. Grid on desktop: `.7fr 1.4fr 1fr 1.2fr 2fr`. Lap stepper: 28px outline squares around the number (44px hit area kept through padding). Driver field: chips with a 3px team bar and code, `+ ΠΡΟΣΘΗΚΗ` in accent, which opens the existing roster; restyle the roster as THE NUMBERS rows (team bar, code, surname, number). On mobile, show 2 columns and hide Season behind the roster/overflow menu.
  Accept: every control is keyboard reachable and 44px tall; the 390px layout matches `A-data-hub-mobile.png`.

- [ ] **R2-02 Lap strip (from C)**
  Files: new `src/components/dashboard/LapStrip.tsx`, `DashboardShell.tsx`, `index.css`. Data: `viewModel.lapTimeData` (already computed), race control SC/VSC periods from `raceControl`, pit laps from `pits`.
  Change: a row of `<button>` bars (one per lap) inside a labelled group; bar height is inversely proportional to lap time (clamped); states for selected, SC/VSC and pit. Clicking calls `filters.setLapNum`. Each bar's accessible name reads `Γύρος 34, 2:18.4, Safety car`. Hidden when fewer than 2 laps are loaded. Mobile: 34px tall, sitting just above the tab strip.
  Accept: clicking bar 12 updates the selectors, the URL `lap=12` and the charts; arrow keys move the selection; SC laps are visually distinct in both themes.

### Phase 3: Navigation and section framing

- [x] ✅ **R3-01 Data Hub tab strip**
  Files: `DashboardTabs.tsx`, `index.css` (`.analysis-*`, `.mobile-analysis-selector`).
  Change: replace the three grouped clusters and the mobile `<select>` with one horizontal strip of 10 tabs: 15px text, 18px padding, a 2px `--signal` underline on the active tab, a 1px rule below. Mobile: horizontal scroll with the active tab scrolled into view; no select. Use `role="tablist"` / `role="tab"` with `aria-selected` and roving tabindex, or keep the buttons with `aria-current`; pick one and update the tests to match.
  Accept: matches the `/standings` tab strip at 1440 and 390; every tab is reachable by keyboard.

- [ ] **R3-02 Section header with kicker, headline and lede**
  Files: `src/components/dashboard/shared.tsx` (`Panel`), `ChartPanel.tsx`, `index.css` (`.panel-heading`, `.dashboard-panel`).
  Change: `Panel`/`ChartPanel` accept `kicker`, `title` and `lede`. The **first** panel of each tab renders the large header (red square kicker, 46px h3, lede). Later panels render a compact header: 2px ink top rule, uppercase 12px title on the left, unit on the right (THE NUMBERS style). Drop the three per-panel icon buttons from compact panels. Download and Full screen move into a single `⋯` panel menu; Embed moves to the card bar.
  Accept: each tab has exactly one large headline; secondary panels look like `Sectors · Γύρος 49 ▸ ΧΡΟΝΟΣ` in the mockup.

- [ ] **R3-03 Card bar (share and embed per tab)**
  Files: `DashboardShell.tsx`, `DashboardContainer.tsx` (`onShareTab`, `onEmbedTab`, which already exist), `index.css`.
  Change: under each tab's lead, a bordered bar reading `Καρτέλα {tab}` with a caption, plus the outline buttons `↗ Κοινοποίηση καρτέλας` and `</> Ενσωμάτωση καρτέλας`, copying the Data Hub's `Καρτέλα Ρυθμός ελαστικών` bar exactly. Stack them full width on mobile.
  Accept: the share URL keeps season, GP, session, lap, drivers and tab; the embed snippet is unchanged in behaviour.

### Phase 4: Data surfaces

- [ ] **R4-01 Summary strip**
  Files: `TelemetryTab.tsx` (replaces `.lap-comparison`), `index.css`.
  Change: a paper-2 block with a 3px signal left border: session and lap on the left; right-aligned stats per driver (lap time), `ΔΙΑΦΟΡΑ`, `TOP SPEED a / b`. Uppercase 11px labels, 18px 600 values. Mobile: 2-column grid.
  Accept: shows the same values as the current `lap-comparison` cards, and partial-data drivers show `—` plus a status in the band (R1-03).

- [ ] **R4-02 Tech Desk gap card (from B)**
  Files: new `src/components/dashboard/GapCard.tsx`, `TelemetryTab.tsx`, `BroadcastTab.tsx` (replacing or absorbing `DriverCards` where it overlaps), `index.css`.
  Change: **always dark**, in both themes (as on the homepage): charcoal-2 background, 1px rule, 2px teal top border, kicker `R15 / BAKU GP · RACE · L49`, `{DRIVER} · ΑΠΟΣΤΑΣΗ ΑΠΟ {REF}`, a large numeral (`+0.104s`, teal sign), a sub-line, an S1/S2/S3 row with dividers, then three bar rows `ΑΡΓΕΣ ΣΤΡΟΦΕΣ / ΜΕΣΑΙΕΣ ΣΤΡΟΦΕΣ / ΕΥΘΕΙΕΣ` with time deltas. Source line `ΠΗΓΗ / OPENF1 · CAR_DATA`. For the corner-type split, bucket each sample by the reference driver's speed (<150, 150–250, >250 km/h) and integrate the time difference. Put that in a pure function in `src/components/dashboard/utils.ts` with one unit test.
  Accept: the card numbers add up to within ±0.01s of the lap gap; the test covers a synthetic two-lap input.

- [ ] **R4-03 Tables in THE NUMBERS style**
  Files: `TelemetryTab.tsx` (sector table), `PositionsTab.tsx` (standings list), `StrategyTab.tsx` (strategy rows), `broadcast/TimingTower.tsx`, `IntervalsTab.tsx` (if tabular), `index.css`.
  Change: one shared table look: 2px ink top rule with uppercase header row, 60px rows with 1px rules, a 3px team-colour left bar, a 24px 600 position numeral (P1 in accent), the name as a 14px letter-spaced code plus team in muted text, right-aligned numbers, purple for the personal best sector and green for the second best (existing `--color-sector-*`). A plain CSS class (`.data-table`), not a component, unless three or more tabs need the same markup.
  Accept: every tabular view shares the same header, row and bar treatment in both themes.

- [ ] **R4-04 Chart restyle**
  Files: `ChartPanel.tsx`, `chartAxis.ts`, `shared.tsx` (`ChartTip`), `TelemetryTab.tsx`, `EnergyTab.tsx`, `index.css` (`.recharts-*`, `.chart-tooltip`, `.dashboard-chart-legend*`).
  Change: legend **above** the chart as uppercase 12px letter-spaced labels with 22×3px swatches. On distance-based charts, the x-axis shows **corner labels (T1…)** with dotted vertical guides when the circuit's corner positions are known; otherwise keep percentages. Corner positions per circuit are a static map, filled in only for circuits we have data for. The tooltip becomes a paper-2 box with an ink 2px top rule (accent in dark). The source line under each chart reads `Πηγή: OpenF1 …`. The primary chart is 380px tall on desktop and 240px on mobile. Keep dashed/solid styling per driver for colour-blind users.
  Accept: speed trace at 1440 matches `A-data-hub-desktop.png`; no trace falls below 3:1 contrast on paper.

### Phase 5: Headlines generated from the data

- [ ] **R5-01 `buildHeadline()`**
  Files: new `src/components/dashboard/headlines.ts` plus `headlines.test.ts`.
  Change: a pure function `(tab, viewModel) → { title, lede } | null`, with about 6 templates in Greek. Examples: lap winner and gap (`Ο {A} ήταν ταχύτερος κατά {gap}s`); where the time came from (`… κερδίζει στα φρένα, ο {B} στις ευθείες`, using the R4-02 buckets); the sector that decided it; top-speed advantage; positions (`{n} προσπεράσεις στους πρώτους 10 γύρους`); strategy (`Ο {A} σταμάτησε {k} φορές`). Return `null` when there are fewer than 2 loaded drivers or data is missing; the caller then uses the static tab title from `copy.ts`. Greek driver names come from OpenF1 `last_name` as-is, with no declension.
  Accept: the tests cover each template, the null fallback and a tie (|gap| < 0.001s → neutral wording).

- [ ] **R5-02 Wire the headlines into the tab headers**
  Files: every `*Tab.tsx` first panel (R3-02 `title`/`lede` props).
  Accept: switching drivers or laps updates the headline; embeds show the same headline.

### Phase 6: Restyle each tab

For each tab: large header (R3-02), card bar (R3-03), primary visual, then compact secondary panels. Check it in both themes at 1440, 768 and 390.

- [ ] **R6-01 Τηλεμετρία**: summary strip, speed trace, then a pair row (gap card | sector table), then delta, then throttle and brake. `TelemetryTab.tsx`.
- [ ] **R6-02 DRS & RPM**: the same frame; gear/RPM traces share the corner axis. `EnergyTab.tsx`.
- [ ] **R6-03 Track Map**: the map sits in a charcoal panel with the `--cut` bottom-right corner (as in mockup B's cover); segments show which driver was faster per mini-sector, if available, else use the current rendering. `TrackMapTab.tsx`, `trackMapUtils.ts`.
- [ ] **R6-04 Θέσεις**: position chart plus the full classification in the R4-03 table (keep the 22-driver fix from P0-03). `PositionsTab.tsx`.
- [ ] **R6-05 Intervals**: gap chart plus the table. `IntervalsTab.tsx`.
- [ ] **R6-06 Ελαστικά**: stint bars as paper-2 segments with a 3px compound-colour top border and a `MEDIUM · 1–17` label (as in mockup B's `STINTS.`). `StrategyTab.tsx`.
- [ ] **R6-07 Team Radio**: list rows with a 1px rule, driver bar, time and a play link, in the style of the homepage's "ΠΡΟΣΦΑΤΑ" list. `RadioTab.tsx`.
- [ ] **R6-08 Race Control**: rows with a 3px flag-colour left rule and a lap code (as in mockup C's race control list). `IncidentsTab.tsx`.
- [ ] **R6-09 Καιρός**: four big stat numerals (Πίστα / Αέρας / Υγρασία / Άνεμος) with a 2px top rule, then trend charts. `WeatherTab.tsx`.
- [ ] **R6-10 Broadcast**: gap card (R4-02), timing tower (R4-03), speed trap and sector analysis in the compact panel style. `BroadcastTab.tsx`, `broadcast/*`.
- [ ] **R6-11 "Next" row**: numbered links to 5 other views at the end of each tab (the homepage quick-link pattern). `DashboardShell.tsx`.

### Phase 7: Embed mode and mobile pass

- [ ] **R7-01 Embed mode in the new chrome**
  Files: `DashboardShell.tsx`, `DashboardHeader.tsx`, `index.css` (`.embed-mode *`).
  Change: embeds get no site nav, no hero display, no scope bar, no tabs and no card bar. What remains is a slim line (`F1 STORIES.` wordmark · session · `Άνοιξε την ανάλυση ↗`), the headline, the requested panel, the legend and the source line. The theme comes from `?theme=` (the host article's theme). Keep P1-03's rule that a panel embed shows only its panel.
  Accept: a mobile embed shows the chart within the first 250px; there is no nav or band inside an article.

- [ ] **R7-02 Mobile layout audit at 390×844**
  Accept: no horizontal page scroll (only the tab strip and lap strip scroll); every target is at least 44px; the first chart's legend is visible within 2 screen heights with the roster closed.

### Phase 8: QA and polish

- [ ] **R8-01 Visual comparison**: screenshots of every tab × {light, dark} × {1440, 390}, saved next to `docs/rework/` mockups for review. Use the Playwright MCP (already used for the mockups).
- [ ] **R8-02 Accessibility**: focus rings in accent; a visible skip link styled like the site; `lang="el"`; chart summaries (`aria-label` on each chart with the headline text); contrast of `--ink-2` on paper-2 at 11px (bump to 12px if it fails).
- [ ] **R8-03 Performance**: no new runtime dependencies; the fonts are the same self-hosted woff2 files; keep the lazy-loaded tabs; the lap strip renders ≤80 buttons.
- [ ] **R8-04 Clean-up**: remove the dead `.theme-light` / `.utility-*` / `.analysis-group*` CSS, `src/tailwind.config.js` if unused, and `src/assets/react.svg`. Run `graphify update .`.

---

## 5. Suggested PR slicing

1. Phase 0 (tokens, theme, copy module, test pattern): no visual structure change, and dark stays pixel-close.
2. Phase 1 plus R3-01: the page starts to look like f1stories.
3. Phase 2 plus R3-02/03.
4. Phase 4 plus Phase 5.
5. Phase 6 (tabs can be split across 2–3 PRs).
6. Phases 7 and 8.

## 6. Risks and notes

- **Separate origin**: github.io can't read f1stories.gr's localStorage, so the theme only carries over through `?theme=` in links. That needs a site-side change (§7), which is not in scope.
- **Hard-coded nav links**: the masthead copies `partials/nav.html` by hand. If the site nav changes, this copy has to be updated too. A comment in `DashboardHeader.tsx` points at the source.
- **Corner labels** need per-circuit data; without them the axis falls back to percentages. Start with the current season's circuits only.
- **OpenF1 rate limits (429)** already occur during page load; the lap strip and gap card reuse data that is already fetched and add no requests.
- **Always-dark gap card inside the light page** is intentional (homepage Tech Desk); check its contrast separately.

## 7. Optional follow-ups in f1StoriesPage (not in scope)

- Add a `Telemetry` link to `partials/nav.html` and the footer. Today the tool is reachable only through `/f1telemetry/`, which redirects.
- Add a Telemetry entry to the `/standings` tab strip or the homepage's `THE NUMBERS` quick links.
- Append `?theme=<current>` to outbound telemetry links so the reader's theme carries over.
- Later: serve the build at `f1stories.gr/f1telemetry/` for a shared origin, shared theme storage and site-relative nav.
