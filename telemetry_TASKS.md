# F1 Telemetry Dashboard — TASKS

Implementation checklist derived from the current visual/functional critique.

Work in priority order: **P0 → P1 → P2 → P3**. Mark an item complete only after its acceptance criteria have been verified.

## P0 — Visually or functionally broken

### [x] P0-01 — Broadcast contradicts the available analysis

**Viewport:** All three sizes.

**State / Tab:** Broadcast versus Telemetry; same session, drivers, and lap.

**Observed:** Broadcast says “No sector data available for this lap,” although Telemetry displays all three sectors. Broadcast also shows throttle/DRS dashes and “Top Speed” values of 294/296; Telemetry shows 329/322 km/h. Evidence.

**Why it looks wrong:** An apparently finished analysis product gives conflicting measurements and a false empty state. Styling cannot compensate for that loss of credibility.

**F1Stories / BetCast reference:** BetCast’s summaries and charts establish a consistent analytical context; Telemetry’s views need the same continuity.

**Root cause / component:** Broadcast receives an empty sectorRows array because its calculation is gated to Telemetry. Broadcast also lacks telemetry inputs and labels a speed-trap fallback as top speed.

**Exact recommended change:** Supply Broadcast with the existing sector and telemetry measurements. Label speed-trap readings explicitly when used. Show unavailable values only when the underlying measurement is unavailable.

**Likely files:** useDashboardViewModel.ts, useDashboard.ts, BroadcastTab.tsx, TimingTower.tsx, DriverCards.tsx.

**Acceptance criteria:** Switching between Telemetry and Broadcast preserves sector values and measurement definitions for the same selection.

### [x] P0-02 — Partial failures masquerade as a complete comparison

**Viewport:** 390×844 and 768×1024.

**State / Tab:** Four-driver Telemetry, Energy, and Broadcast.

**Observed:** ANT/VER/RUS/NOR appear selected, but only ANT/VER have telemetry. RUS/NOR receive unexplained dashes, empty sector strips, and normal legend entries. Their lap requests returned HTTP 429 during inspection. Evidence.

**Why it looks wrong:** The interface presents missing requests as missing sporting data. A reader cannot tell whether the comparison is complete, loading, or broken.

**F1Stories / BetCast reference:** BetCast explicitly identifies the selected period and update status. Telemetry needs equally clear coverage information.

**Root cause / component:** Per-driver request failures are not carried through into comparison summaries and legends.

**Exact recommended change:** Show “2 of 4 drivers loaded” with the affected names and a retry action. Mark unavailable series explicitly; suppress their empty graphical strips.

**Likely files:** useDashboard.ts, DashboardShell.tsx, TelemetryTab.tsx, EnergyTab.tsx, ChartPanel.tsx.

**Acceptance criteria:** A failed secondary-driver request produces an explicit partial-data state, with no implication that every selected driver is plotted.

### [x] P0-03 — “22 drivers” ends at position 20

**Viewport:** Verified at 768×1024; shared component affects all sizes.

**State / Tab:** Positions → Current Standings.

**Observed:** The heading states “Latest recorded positions · 22 drivers,” but the list ends at 20, followed immediately by the data note and footer. Evidence.

**Why it looks wrong:** The apparently complete classification silently omits two entries.

**F1Stories / BetCast reference:** Neither reference supplies a timing-table specification; the relevant standard is trustworthy, clearly scoped data presentation.

**Root cause / component:** The standings list is capped at 20, and the chart also assumes a 20-position field.

**Exact recommended change:** Render the full returned classification and derive the position-axis extent from the session field.

**Likely files:** PositionsTab.tsx.

**Acceptance criteria:** A 22-driver session displays all 22 entries and supports positions 21–22 on the chart.

### [x] P0-04 — Selecting a lap draws a line at the corresponding position

**Viewport:** Verified at 768×1024.

**State / Tab:** Positions; change selected lap from 57 to 3.

**Observed:** Lap 3 introduces an unlabelled horizontal accent line at position 3. Evidence.

**Why it looks wrong:** The accent suggests a meaningful analytical threshold, but it represents the lap number on the position axis. This is precisely the kind of plausible-looking telemetry decoration that undermines confidence.

**F1Stories / BetCast reference:** BetCast’s reference lines have identifiable analytical meanings.

**Root cause / component:** ReferenceLine uses lapNum as its Y value.

**Exact recommended change:** Remove this line. Only restore a selected-lap marker when it can be placed correctly on the time axis and labelled.

**Likely files:** PositionsTab.tsx.

**Acceptance criteria:** Changing the lap never creates a horizontal position threshold.

## P1 — Strongly damages the F1Stories identity

### [x] P1-01 — The masthead resembles an abbreviated imitation of the sibling brand

**Viewport:** All three sizes; both themes.

**State / Tab:** Global header.

**Observed:** Telemetry omits the small F1Stories emblem. “TELEMETRY” is a tiny, lightly weighted, letter-spaced label; BetCast uses a more substantial condensed product name. Theme switching is buried inside “Tools.” Telemetry, BetCast.

**Why it looks wrong:** The wordmark survives, but the recognizable product-family lockup and utility hierarchy do not.

**F1Stories / BetCast reference:** Both F1Stories and BetCast pair the emblem with the wordmark and expose theme control in the masthead.

**Root cause / component:** Independently assembled header markup and .product-name styling.

**Exact recommended change:** Reuse the emblem–wordmark–divider arrangement; set Telemetry in the sibling’s condensed product-label treatment. Expose theme control beside Tools. Keep the session heading; do not add a marketing card.

**Likely files:** DashboardHeader.tsx, index.css.

**Acceptance criteria:** Switching between BetCast and Telemetry preserves recognizable masthead proportions, product-name emphasis, and theme-control placement.

### [x] P1-02 — Mobile introduces the controls before the product’s value

**Viewport:** Primarily 390×844; also 768×1024.

**State / Tab:** Default Telemetry, collapsed driver editor.

**Observed:** The chart heading begins around 634px, with plotted data around 704px. Header, session heading, selectors, comparison, navigation, and sharing each occupy separate bands. The first viewport cuts through the first chart. Evidence.

**Why it looks wrong:** It feels like desktop sections stacked automatically. The session setup lacks a compact mobile hierarchy.

**F1Stories / BetCast reference:** BetCast’s mobile view exposes substantive summary data around 340px and its chart around 610px.

**Root cause / component:** Independent vertical spacing across session, driver, navigation, and action components.

**Exact recommended change:** Put “Edit drivers” beside the selected-driver summary; place the Analysis label and selector on one row; move Share/Embed into Tools; shorten the session-heading spacing. Preserve 44px touch targets.

**Likely files:** DashboardHeader.tsx, DriverSelector.tsx, DashboardTabs.tsx, index.css.

**Acceptance criteria:** At 390×844, the first complete trace and its legend fit in the initial viewport with the editor closed.

### [x] P1-03 — Embed mode still behaves like a dashboard inside an article

**Viewport:** All three sizes; dark and light.

**State / Tab:** Whole-view and panel embed.

**Observed:** Whole-view embed retains session adjustment, driver editing, analysis navigation, Share/Embed, and chart actions. Its first plot begins around 558px on mobile. Panel embedding scrolls to a panel but retains the surrounding multi-panel page. Evidence.

**Why it looks wrong:** The embedded analysis competes with its host article through repeated navigation and authoring controls.

**F1Stories / BetCast reference:** F1Stories gives editorial content a clear reading order; embedded analysis should support that hierarchy.

**Root cause / component:** Embed mode mostly changes spacing; driver navigation and chart controls remain active. Panel URLs identify an anchor rather than an isolated presentation.

**Exact recommended change:** Default embed to a compact brand/context line, the requested analysis, legend, and “Open analysis.” Hide setup/navigation and re-embedding controls. A panel embed should render only its requested panel.

**Likely files:** DashboardShell.tsx, DashboardContainer.tsx, DashboardTabs.tsx, ChartPanel.tsx, index.css.

**Acceptance criteria:** A mobile embed shows useful analysis within its first 250px; a panel embed contains no unrelated panels.

### [x] P1-04 — Weather is the clearest surviving dashboard-template composition

**Viewport:** All three sizes.

**State / Tab:** Weather.

**Observed:** Eight equally emphasized statistics precede a large “Conditions Radar,” followed by the useful trend. Sample count receives the same visual weight as track temperature. The radar has no readable numeric scale. Evidence.

**Why it looks wrong:** The grid and radar seem selected to fill dashboard sections rather than express a weather-analysis priority. Removing card backgrounds has not removed the template composition.

**F1Stories / BetCast reference:** BetCast deliberately emphasizes Budget/ROI above secondary counts.

**Root cause / component:** Two uniform Stat grids and an independently normalized radar panel.

**Exact recommended change:** Remove the radar. Prioritize track/air temperature and rainfall; present pressure, direction, and sample count as compact secondary information. Move Conditions Trend directly below the primary readings.

**Likely files:** WeatherTab.tsx, useDashboardViewModel.ts.

**Acceptance criteria:** The trend follows the primary weather readings without an intervening decorative chart, and sample count reads as metadata.

### [x] P1-05 — Teammates become visually indistinguishable

**Viewport:** Verified with four drivers at 768×1024.

**State / Tab:** Positions and Intervals; shared driver encoding.

**Observed:** ANT and RUS use identical turquoise solid lines and identical legend swatches. Their traces are visibly separate but cannot be assigned reliably from the legend. Evidence.

**Why it looks wrong:** Team branding has been applied without completing the comparison design. The central analytical task becomes guesswork.

**F1Stories / BetCast reference:** BetCast distinguishes plotted series through both color and line treatment.

**Root cause / component:** Series identity derives only from team color.

**Exact recommended change:** Keep team colors, but assign teammates distinct, consistent stroke patterns or markers. Reproduce those distinctions in every legend. Preserve separate channel encoding for throttle/brake.

**Likely files:** useDashboardViewModel.ts, PositionsTab.tsx, IntervalsTab.tsx, TelemetryTab.tsx, ChartPanel.tsx.

**Acceptance criteria:** Every selected driver can be matched to their trace without opening a tooltip, including same-team comparisons.

## P2 — Noticeable polish issues

### [x] P2-01 — Light mode leaves driver colors insufficiently adapted

**Viewport:** All three sizes, particularly mobile.

**State / Tab:** Light theme; Strategy, Intervals, Broadcast.

**Observed:** Turquoise ANT/RUS names and large percentages are faint against the cream surface. The same raw team color is used for text, markers, and traces. Evidence.

**Why it looks wrong:** The surrounding theme feels considered, while driver content looks pasted in from a dark dashboard.

**F1Stories / BetCast reference:** BetCast’s light theme uses darker semantic text colors while retaining the warm background.

**Root cause / component:** Raw team colors bypass the theme’s text-color treatment.

**Exact recommended change:** Use normal foreground text for driver names and values, retaining team color in markers. Give chart strokes theme-adjusted variants where necessary.

**Likely files:** useDashboardViewModel.ts, StrategyTab.tsx, IntervalsTab.tsx, index.css.

**Acceptance criteria:** Small driver labels meet 4.5:1 contrast in light mode, and traces remain distinguishable against the chart background.

### [x] P2-02 — Desktop navigation consumes space without gaining prominence

**Viewport:** 1440×900.

**State / Tab:** Global analysis navigation.

**Observed:** Three widely separated groups use small 12px links. A separate Share/Embed row leaves the navigation occupying roughly 160px between comparison and chart. Evidence.

**Why it looks wrong:** The layout is simultaneously sparse and visually timid. The selected view feels detached from its content.

**F1Stories / BetCast reference:** BetCast places its analysis selector and section label in a compact, clearly bounded row.

**Root cause / component:** Three-column grouping, generous outer spacing, and an additional action row.

**Exact recommended change:** Retain the three useful groups, increase link text to 14px, reduce vertical spacing, and relocate Share/Embed to Tools. Keep the selected underline close to the content boundary.

**Likely files:** DashboardTabs.tsx, index.css.

**Acceptance criteria:** All ten views remain discoverable without horizontal scrolling, within a navigation band approximately 90px high.

### [x] P2-03 — Axes still expose automatic chart-library decisions

**Viewport:** Most severe at 390×844; visible on tablet and desktop.

**State / Tab:** Telemetry and Weather charts.

**Observed:** Lap-time labels crowd together and the final L57 is clipped. Weather timestamps collide. Y ticks include mixed precision such as 101.53 and 106.569; throttle/brake extends to 110%. Lap times, Weather.

**Why it looks wrong:** These are recognizable default-chart tells: available space and measurement meaning have not determined the ticks.

**F1Stories / BetCast reference:** BetCast’s mobile chart uses a sparser set of readable ticks and clearly formatted units.

**Root cause / component:** Fixed 9–10px text, desktop-oriented intervals, automatic domains, and insufficient endpoint margins.

**Exact recommended change:** Use roughly five mobile X ticks, preserve both endpoints, add right-side clearance, and standardize precision per measurement. Use meaningful percentage ticks and identify the throttle/brake halves.

**Likely files:** TelemetryTab.tsx, WeatherTab.tsx, EnergyTab.tsx, PositionsTab.tsx.

**Acceptance criteria:** At 390px, no axis labels overlap or clip; labels remain readable at 100% zoom and use consistent precision.

### [x] P2-04 — Strategy removes the lap information mobile users need

**Viewport:** 390×844.

**State / Tab:** Tyres / Strategy.

**Observed:** Stint bars show only M, S, or H; lap ranges visible on larger screens disappear. “2 STINTS” receives its own line, but the pit boundary has no visible lap label. Evidence.

**Why it looks wrong:** The mobile treatment preserves decoration and removes the analytical context.

**F1Stories / BetCast reference:** BetCast keeps the selected analysis context explicit at mobile width.

**Root cause / component:** Stint ranges are hidden below the small-screen breakpoint.

**Exact recommended change:** Keep ranges visible as compact labels beneath each segment or boundary. Put stint count beside the driver name. Do not depend on hover titles.

**Likely files:** StrategyTab.tsx, index.css.

**Acceptance criteria:** A mobile reader can identify compound, start/end laps, and pit transition without hovering.

### [x] P2-05 — Strategy rows wrap as loose cells instead of coherent records

**Viewport:** 390×844.

**State / Tab:** Stint Context and Pit Stops.

**Observed:** The five-cell stint record falls into a three-column grid: driver/compound/age on one line, then remaining laps/end on another. Pit-lane duration wraps beneath the driver. Evidence.

**Why it looks wrong:** Reading order follows grid mechanics rather than the relationship between a driver and their measurements.

**F1Stories / BetCast reference:** BetCast’s mobile summary preserves intentional primary and secondary groupings.

**Root cause / component:** One generic three-column .strategy-row handles records with different field counts.

**Exact recommended change:** Give each mobile record a full-width driver heading followed by a two-column measurement layout. Put labels consistently above values.

**Likely files:** StrategyTab.tsx, index.css.

**Acceptance criteria:** No measurement wraps into the driver-identity column, and each record remains understandable independently.

### [ ] P2-06 — Two-driver summaries leave two invisible slots

**Viewport:** 1440×900 and 768×1024.

**State / Tab:** Telemetry summaries, Energy, Intervals, Broadcast driver details.

**Observed:** Two selected drivers occupy the left half of a four-column layout, leaving the right half empty beneath a full-width chart or heading. Evidence.

**Why it looks wrong:** The empty area looks reserved for missing dashboard widgets. It exposes the component template rather than an intentional comparison layout.

**F1Stories / BetCast reference:** BetCast sizes its summary groups according to their actual content and importance.

**Root cause / component:** Fixed four-column summary grids regardless of selected-driver count.

**Exact recommended change:** Size the grid to the actual count: two balanced columns for two drivers, three for three, four for four. Keep mobile at two columns.

**Likely files:** TelemetryTab.tsx, EnergyTab.tsx, IntervalsTab.tsx, DriverCards.tsx, index.css.

**Acceptance criteria:** Two-driver states contain no unused summary slots and align sensibly with the analysis width.

### [ ] P2-07 — Track Map shrinks its labels with the drawing

**Viewport:** 390×844.

**State / Tab:** Track Map.

**Observed:** The circuit occupies a narrow central area, and ANT/VER labels shrink to approximately 6–7px on screen. The surrounding note is much more legible than the actual map annotations. Evidence.

**Why it looks wrong:** It resembles a desktop SVG scaled down wholesale. The information attached to the map becomes incidental.

**F1Stories / BetCast reference:** Both F1Stories and BetCast preserve readable caption and label sizes on mobile.

**Root cause / component:** Driver annotations sit inside a uniformly scaled SVG coordinate system.

**Exact recommended change:** Keep annotation text at an effective 11–12px minimum, fit the map bounds more tightly, and offset labels from markers where necessary.

**Likely files:** TrackMapTab.tsx, trackMapUtils.ts.

**Acceptance criteria:** Driver labels and start/finish identification are readable at 390px without zoom or overlap.

### [ ] P2-08 — Race Control retains the generic chip toolbar

**Viewport:** 390×844 and 768×1024.

**State / Tab:** Race Control.

**Observed:** Seven filled, bordered buttons follow the search field. They wrap across two mobile rows; the selected “ALL” differs mainly through a slightly stronger border. Evidence.

**Why it looks wrong:** This is a surviving generic dashboard filter block, with considerable visual mass and weak selection hierarchy.

**F1Stories / BetCast reference:** BetCast uses restrained native selectors; F1Stories uses accent and rules sparingly.

**Root cause / component:** Every flag is rendered as an equally filled filter button.

**Exact recommended change:** Use one labelled “Flag” select beside or below search on mobile/tablet. If desktop buttons remain, remove inactive fills and use the established accent underline for selection.

**Likely files:** IncidentsTab.tsx, index.css.

**Acceptance criteria:** Mobile filtering occupies at most two control rows, and the active filter is immediately identifiable.

### [ ] P2-09 — Weather’s auxiliary axis has no clear measurement identity

**Viewport:** All three sizes; especially 390×844.

**State / Tab:** Conditions Trend.

**Observed:** Four lines share two unlabelled scales. Humidity percentage and wind speed share the right-hand numeric axis, while the legend supplies units without indicating axis assignment. Evidence.

**Why it looks wrong:** The chart looks technical, but extracting a value requires reverse-engineering its scales.

**F1Stories / BetCast reference:** BetCast makes its main chart’s monetary unit explicit on the scale.

**Root cause / component:** Temperature uses one axis; two unrelated auxiliary measurements share another.

**Exact recommended change:** Keep the temperature comparison as the primary plot. Place humidity and wind in compact, separately labelled traces within the same panel, sharing the time axis.

**Likely files:** WeatherTab.tsx.

**Acceptance criteria:** Each plotted value can be read against an unambiguous unit-bearing scale without a tooltip.

### [ ] P2-10 — Timestamps acquire accidental uppercase and wrapping

**Viewport:** All sizes in the inspected Greek browser locale.

**State / Tab:** Race Control and Team Radio.

**Observed:** Radio displays 3:03:12 μ.μ.; Race Control transforms the suffix to uppercase and wraps it below the time. Wide letter spacing further fragments the timestamp. Evidence.

**Why it looks wrong:** Operational data is styled like a section label. The mixed formatting makes related views feel independently assembled.

**F1Stories / BetCast reference:** F1Stories uses tracked uppercase for editorial labels, not indiscriminately for every value.

**Root cause / component:** Locale-generated timestamps inherit uppercase/tracking styles from the event metadata container.

**Exact recommended change:** Use a consistent 24-hour HH:mm:ss presentation, normal tracking, tabular figures, and a non-wrapping time field. State the timezone once per view.

**Likely files:** IncidentsTab.tsx, RadioTab.tsx, index.css.

**Acceptance criteria:** Timestamps stay on one line and share the same format across Radio and Race Control.

## P3 — Micro-polish

### [ ] P3-01 — Theme feedback moves the mobile page

**Viewport:** 390×844.

**State / Tab:** Immediately after switching theme.

**Observed:** “Light mode enabled” inserts another line beneath the session subtitle, pushing all controls and charts down approximately 26px. Evidence.

**Why it looks wrong:** A purely visual preference unexpectedly changes the page geometry.

**F1Stories / BetCast reference:** BetCast communicates theme state through its masthead control.

**Root cause / component:** General feedback occupies the mobile session-heading flow.

**Exact recommended change:** Announce theme changes through the control state and a visually hidden live region; keep visible feedback for actions needing confirmation.

**Likely files:** DashboardHeader.tsx, DashboardContainer.tsx, index.css.

**Acceptance criteria:** Theme switching does not change the vertical position of the session controls or chart.

### [ ] P3-02 — Tooltip formatting remains generic

**Viewport:** 390×844 and 768×1024.

**State / Tab:** Speed Trace and DRS Activation hover states.

**Observed:** Speed tooltip reads “Lap progress · 39” without %; DRS tooltip displays 0 while the axis says CLOSED. Speed evidence, DRS evidence.

**Why it looks wrong:** The tooltip exposes raw data conventions rather than the chart’s displayed meaning. Its box styling is otherwise consistent with the theme.

**F1Stories / BetCast reference:** BetCast establishes explicit units and understandable series labels.

**Root cause / component:** ChartTip applies generic numeric formatting across different measurements.

**Exact recommended change:** Format progress as a percentage and DRS as Open/Closed. Keep measurement-specific precision consistent with the associated axis.

**Likely files:** shared.tsx, TelemetryTab.tsx, EnergyTab.tsx.

**Acceptance criteria:** Tooltip labels, units, and discrete states agree with the visible chart.

### [ ] P3-03 — Legend lines look like tiny curved bowls

**Viewport:** All sizes.

**State / Tab:** Shared chart legends.

**Observed:** Solid-series swatches curve upward at the ends rather than appearing as straight samples of the plotted line. Evidence.

**Why it looks wrong:** The small decorative shape has no relationship to the data encoding and makes the legend feel improvised.

**F1Stories / BetCast reference:** BetCast uses straightforward line samples matching its chart treatments.

**Root cause / component:** An 18×8px rounded element represents the stroke using only its bottom border.

**Exact recommended change:** Use a straight 18–20px rule or SVG line; reproduce actual dash patterns and thickness.

**Likely files:** ChartPanel.tsx, index.css.

**Acceptance criteria:** Every legend swatch accurately resembles its plotted series.

### [ ] P3-04 — Chart action glyphs are undersized

**Viewport:** 390×844 and 768×1024.

**State / Tab:** Chart headers, especially embed mode.

**Observed:** Download/fullscreen icons are only 12px inside 44px controls. With labels hidden, they look like small specks beside 21px chart headings; embed adds a third equally tiny symbol. Evidence.

**Why it looks wrong:** The touch area is adequate, but the visible control lacks proportion and recognition.

**F1Stories / BetCast reference:** The theme/menu controls in F1Stories and BetCast have more legible glyph-to-control proportions.

**Root cause / component:** Fixed 12px icons combined with responsive label hiding.

**Exact recommended change:** Increase chart action glyphs to 16px while retaining 44px targets; align their visual centers with the heading line.

**Likely files:** ChartPanel.tsx, shared.tsx, index.css.

**Acceptance criteria:** Download and fullscreen are recognizable at normal mobile scale without relying on tooltips.

---

## Final verification checklist

- [ ] Verify affected mobile states at **390×844**.
- [ ] Verify affected tablet states at **768×1024**.
- [ ] Verify affected desktop states at **1440×900**.
- [ ] Verify both dark and light themes where relevant.
- [ ] Verify whole-view and panel embed modes where relevant.
- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run ci`.
- [ ] Check the browser console for new errors.
- [ ] Do not deploy as part of this task unless explicitly requested.
