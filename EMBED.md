# Article embeds: replace dashboard frames with editorial figures

Status: E01–E11 implemented and Release A/B E12 checks run. See the [E01–E03 evidence](docs/embeds/E01-E03.md), [E04–E06 evidence](docs/embeds/E04-E06.md), [E07–E08 / Release A report](docs/embeds/E07-E08-E12.md), and [E09–E11 / Release B report](docs/embeds/E09-E11-E12.md).

## 1. The decision

Make a telemetry embed feel like a figure belonging to the article: one chart, a useful title, the exact race/lap/driver context, a caption, a source, and a link to the full analysis. Let the article own scrolling, spacing, typography and theme.

**Recommended first release: saved, responsive figures with no iframe.** Export the figure and the data that produced it from the dashboard; publish them as local article assets. Readers see the chart immediately, including when JavaScript or OpenF1 is unavailable.

**Second release: optional interaction inside the same figure.** A reader presses “Εξερεύνηση γραφήματος” to load an inline chart using that saved data. Keep the caption and analysis link in normal article HTML. Mount a small chart renderer inside an open Shadow DOM for CSS isolation. Do not mount the dashboard inside the article.

This recommendation is based on the code and article sources inspected below. E01's [browser baseline](docs/embeds/E01-E03.md) now records fixed-height scrolling, spare space, API requests and the panel-hash issue found during implementation.

### Alternatives considered

| Approach | What it solves | Tradeoff | Decision |
| --- | --- | --- | --- |
| Resize the existing iframe automatically | Incorrect height and some nested scrolling | Still loads a separate application, retains two styling/theme contexts, depends on runtime data, requires changes in both parent and child | Compatibility option only; does not satisfy the primary direction |
| Screenshot or SVG plus an analysis link | Native article flow, no runtime API dependency, print support | No inline tooltips; desktop screenshots can become unreadable on phones | First release, with separately rendered narrow and wide assets |
| Native widget that fetches OpenF1 on every article visit | Inline interactivity and natural height | API failures/rate limits remain; historical articles can change; each visit repeats data preparation | Do not use as the default |
| Saved figure plus native interaction with saved data | Article reliability and optional exploration | Requires a small export format and a renderer | Recommended staged solution |
| Directly inline arbitrary exported SVG/HTML | Potentially crisp, native content | ID/style collisions and unsafe markup; existing article safeguards reject raw SVG/scripts | Avoid; deliver SVG through image elements |

A custom element is optional packaging, not a requirement. A `<div>` with an attached shadow root and a React root is sufficient for the interactive layer. No widget SDK, new UI framework, server-rendering service, oEmbed service, or database is needed.

## 2. What exists today

### Telemetry repository

| Location | Finding and consequence |
| --- | --- |
| `src/components/DashboardContainer.tsx` | `buildIframeSnippet()` copies a full app URL into an iframe. Whole tabs use 920px; individual panels use 720px. Height is independent of article width and actual content. |
| Same file | URL construction, theme changes, history replacement and preset storage are owned by the dashboard container. Reusing it directly would expose these page effects to the article. |
| `src/components/dashboard/shared.tsx` | `PanelSelection` reads `window.location.hash`. An inline figure needs an explicit panel prop; the article hash must remain available for article navigation. |
| `src/components/DashboardShell.tsx` | Embed mode hides site chrome, but uses the dashboard data/composition path. The first panel can still receive a tab-wide generated headline and summary. A figure needs panel-specific wording. |
| `src/hooks/useDashboard.ts` | Fetching is gated by tab, with shared meeting/session/driver/lap requests and derived selection. It is not a standalone chart renderer or a publication snapshot. |
| `src/utils/exportChart.ts` | Existing SVG export resolves theme variables and appends legends; `ChartPanel` stacks multiple chart SVGs when necessary. It exports chart surfaces, not a complete article figure with context/caption/HTML statistics. Reuse the useful parts rather than assuming export is already complete. |
| `src/components/dashboard/chartAxis.ts` | `useXTickCount()` uses the browser viewport. Inline charts must respond to their own width; a wide browser can still contain a narrow article column. |
| `src/components/dashboard/useProgressAxis.tsx` | Corner guides are inferred from comparison speed data. Preserve the guide positions and their interpretation in saved figures; do not silently reinterpret them as official circuit corner names. |
| `src/components/__tests__/VisualWorkflow.test.tsx` | Existing coverage includes clipboard snippets, whole-tab embeds, panel isolation, theme and open-analysis links. Preserve legacy compatibility while adding the new author workflow. |
| `docs/same-origin-deployment.md`, `scripts/build-f1stories.mjs`, `vite.config.ts` | Canonical assembly for `/telemetry/` is in progress alongside standalone GitHub Pages. Do not assume canonical production has already cut over. |

### Article repository: changes are also required here

Local checkout inspected: `../f1StoriesPage` (`/Users/giorgos/WebstormProjects/f1StoriesPage`). Verify these paths and that repository's instructions before editing it.

| Location | Finding and consequence |
| --- | --- |
| `blog-module/build/embeds.js` | Extracts `IFRAME:`, `EMBED:`/`WIDGET:` and raw iframe placeholders. A dedicated telemetry marker must be recognized here. |
| `blog-module/build/embed-render.js` | Produces `.embed-container.embed-iframe`. The `IFRAME:` path defaults to 650px, a dark background, border and rounded corners. The raw iframe path preserves allowed attributes. This wrapper must not surround new telemetry figures. |
| Same file | Raw widget handling disallows SVG, script and other elements. Do not loosen this generic safeguard to make telemetry work; use a dedicated validated renderer. |
| `blog-module/blog/article-editorial.css` | Owns article figure spacing/captions. Its generic `figcaption::before` says `ΕΙΚΟΝΑ /`; telemetry needs its own scoped data label. |
| `scripts/theme-init.js` | The article site's light mode is `data-theme="light"`; dark mode removes the attribute. Dashboard dark mode is `data-theme="dark"`. A shared reader must normalize both conventions. |
| `blog-module/build/worker.js`, `scripts/author/article-source.js` | Article source can be TXT/DOCX; generated `article.html` is not always the source. New markers must survive the existing publishing/source-editing workflow. |
| `docs/article-media-policy.md`, `scripts/build/public-artifact.mjs`, `scripts/deployment/build.mjs` | Article assets have delivery/repository budgets and an assembled public artifact. New figure assets and widget chunks must survive those paths. |

Concrete migration candidates found:

- `blog-module/blog-entries/20260927G/source.txt`: Baku 2026, session `11377`, drivers `1,43`, lap `36`, panel `telemetry-throttle-brake`. This has editable source and is the first migration candidate.
- `20260329G/article.html`: Suzuka 2026, session `11253`, drivers `3,10`, lap `53`, whole telemetry tab.
- `20260331J/article.html`: Suzuka 2026, session `11253`, drivers `12,81`, lap `49`, whole telemetry tab; the URL has leading whitespace.

The last two directories had no TXT/DOCX source in the inspected checkout. Treat them as legacy-source cases and establish the source-preservation path before changing them. Both also contain Ghost Car embeds. This brief specifies telemetry implementation; Ghost Car and other first-party tools may adopt the same figure contract through separate adapters. Do not convert their content using a telemetry renderer. Third-party video/social embeds keep their existing handling.

## 3. Scope and reader experience

### Release A — complete, useful replacement

Support these two panel IDs, which cover speed analysis and the concrete single-panel article found above:

1. `telemetry-speed-trace`
2. `telemetry-throttle-brake`

The Embed action opens a small composer rather than immediately copying an iframe. The author chooses one supported figure, writes a title and a short accessible explanation, checks the preview, and downloads one publication bundle. The composer also supplies the article marker and instructions for adding that bundle to the article folder.

For a supported panel action, preselect that panel. A whole-tab action opens the composer and asks the author to choose a figure. Do not export the whole tab as one enormous picture. For unsupported panels/tabs, show their support status and provide a full-analysis link plus the existing legacy iframe option. Do not silently export a different chart.

The first release is done when an author can publish one of these figures into a real article and it renders correctly without an iframe or live API access. Inline interaction is a separate release, not a prerequisite for shipping this improvement.

### Figure anatomy

- Compact label: `ΤΗΛΕΜΕΤΡΙΑ`.
- Author title in the article's heading style; no repeated dashboard masthead.
- One context line: year, GP, session name, driver acronyms and lap. Retain full driver names in accessible context.
- Chart and legend, with appropriate units and dash patterns. Throttle/brake legends must distinguish both driver and channel.
- Caption explaining the observation or how to read the chart. Require a useful description; do not invent a racing conclusion from a chart title.
- Source/method line identifying OpenF1, saved-data status and any partial-data notice. Record capture time as data provenance, not as the session date.
- Link: `Άνοιγμα πλήρους ανάλυσης`, preserving session, drivers, lap, tab and panel anchor, without `embed=1`.

Use the article column's natural width and height. No fixed-height outer shell, internal vertical scrollbar, repeated navigation, large logo bar, artificial browser frame, autoplay or animated chart entrance. On mobile, simplify tick density and wrap legends rather than shrinking a desktop screenshot. A data figure uses the article's existing rules and typography, with minimal scoped additions.

### Release B — optional exploration

Add an accessible button below the saved figure. Clicking it loads only the supported chart renderer and the saved panel data. Replace the image only after a usable chart has rendered. Keep the image on failure. Offer “Στατική προβολή” to return to the saved figure.

Initial interactions: hover/touch values and keyboard inspection of those same values. Keep the race, lap and comparison scope fixed. Changing those selections belongs to the full dashboard. Do not fetch fresh data or silently change the published conclusion.

## 4. Publication contract

Use one versioned JSON bundle downloaded by the author: `<slug>.f1embed.json`. This avoids a ZIP dependency and unreliable multiple automatic downloads. The article builder extracts validated assets from it at build time.

Required v1 fields:

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Integer `1`; reject unsupported versions with a clear author/build error. |
| `panelId` | One of the two supported panel IDs. |
| `capturedAt` | ISO timestamp when the data was captured for publication. |
| `scope` | Validated `DashboardFilterSnapshot`; require a resolved session, explicit lap and 1–4 distinct drivers. No automatic “latest” selections. |
| `context` | Displayable GP/session labels, full driver names/acronyms and source team colours. Plain text/validated colour values only. |
| `editorial` | Title, caption and accessible description. Bound text lengths; render as escaped text. |
| `provenance` | OpenF1 source, plotted sample counts, plot method/normalization, any inferred corner-guide explanation, and completeness for every requested driver. |
| `data` | Panel-specific plotted series, ordered driver metadata/dash patterns, guide positions/labels and axis mode. Numbers/nulls/plain labels only, no arbitrary JSX or chart options. |
| `images` | Four SVG image strings with dimensions: narrow/wide × light/dark. Each includes chart geometry, axis labels and its full legend. Context/caption remain ordinary HTML. |

Define a discriminated union for `data`. Start from existing `ComparisonPoint`/`SpeedPoint` types but allowlist the fields each panel consumes. Retain the distinction between progress-axis and sample-axis plots; do not relabel samples as distance or progress. Preserve missing values as missing, the existing brake plotting convention, driver order, original units, and current interpolation/gap behavior. Save inferred guides so later algorithm changes cannot alter the figure.

Store source team colours rather than only light/dark-adjusted strokes; render each theme through the existing colour/contrast rules. The SVG variants and interactive renderer must use the same frozen data. Capture an immutable copy when the composer opens; subsequent dashboard/lap changes cannot mutate the draft. Do not save unused API responses or the entire dashboard view model.

Reject an export while required requests are pending, the displayed data belongs to a previous selection, or no usable plot exists. If one selected driver lacks data, require an explicit author acknowledgement and keep that driver's status visibly attached to the published figure; never present a partial comparison as complete.

Article authoring syntax:

```text
TELEMETRY:baku-pedals.f1embed.json
```

Look for the file alongside the source or in its `embeds/` subfolder, following the existing local-file author workflow. Allow safe basenames only. The builder emits a normal `<figure class="f1-telemetry-figure">`, immutable local image/data assets and, for Release B, an enhancement host. It must not fetch OpenF1 while building an article.

Name extracted assets by a content digest derived from the validated bundle, with each variant distinguished. Rebuilding the same bundle produces identical asset names. Editing/re-exporting produces a new revision; never update a published figure merely because upstream data changed.

Derive full-analysis URLs from validated scope and an allowed deployment base. Default to `/telemetry/` only in canonical assembly; retain standalone base support for previews/legacy deployment. Do not trust a URL supplied in the bundle or rewrite the host article's URL. The analysis link opens the current dashboard; the figure stays a saved publication snapshot.

## 5. Tasks for Sonnet

Every task requires its implementation, the listed evidence, and an updated checkbox here. Paths marked “new” are suggested locations. Equivalent placement is fine when consistent with repository conventions. Do not mark a task complete on unit tests alone when its acceptance requires a real article preview.

### Release A

#### [x] E01 — Establish fixtures and the before/after baseline

**Repositories:** telemetry + article. **Dependencies:** none.

Inspect each checkout's instructions and current uncommitted changes. Confirm the two supported panels, the article theme convention and the publishing source path. Capture current speed/pedals iframe behavior at phone and desktop article widths. Record content height, clipping/scrolling, visual duplication and API requests; distinguish measurements from assumptions.

Create compact, deterministic API fixtures using the existing test/MSW or record/replay infrastructure. Include one driver, two drivers, four drivers, teammates sharing a colour, missing secondary telemetry and a sample-axis case. Use historical known-good data, not only the 2026 URLs, which may be unavailable.

**Acceptance:** baseline screenshots and observations are recorded; a saved fixture renders without live API access; the Baku source location is confirmed. Existing dirty changes are preserved. No general dashboard redesign is included.

#### [x] E02 — Add a pure scope/link and bundle contract

**Repository:** telemetry; mirrored consumption in article. **Dependencies:** E01.

**Files:** `DashboardContainer.tsx`, `useDashboardFilters.ts`; new `src/embeds/contract.ts`, `src/embeds/links.ts`, targeted contract tests; later a host validator in E06.

Extract the small pure URL-construction logic needed by publishing. Give it an explicit base URL, scope and panel ID; keep `window.location` adaptation in the dashboard. Define v1 types, serialization and runtime validation, including bounded input sizes, finite numeric data, driver order, panel-specific allowed keys, axis mode and missing-data metadata. Reject a panel/tab mismatch. Verify hostname/path exactly when parsing legacy links; normalize leading whitespace and HTML-escaped ampersands.

Do not force all three repositories to adopt a new shared package. Keep a checked-in contract fixture that both telemetry and article validators test against; document how to update the two readers together.

**Acceptance:** links round-trip the full selection under standalone and canonical bases; hostile/malformed fields are rejected; serialization does not mutate source data. Legacy iframe/share URL behavior still passes existing tests.

#### [x] E03 — Share the two chart renderers without dashboard side effects

**Repository:** telemetry. **Dependencies:** E02.

**Files:** `TelemetryTab.tsx`, `ChartPanel.tsx`, `chartAxis.ts`, `useProgressAxis.tsx`, driver context; new presentational chart components under `src/embeds/` or the existing dashboard chart directory.

Extract only the speed-trace and throttle/brake plot bodies and their legend/axis inputs. Both the dashboard and figure exporter must render through these components. Pass panel data, theme/colours, guide metadata and available width explicitly. Preserve the existing dashboard single-driver/sample-axis fallback.

The saved renderer must not import `DashboardContainer`, `main.tsx`, `useDashboard` or API hooks, and must not depend on page hash/history/storage. Read colour variables from its own scope rather than `document.documentElement`. Replace viewport-only tick decisions for these shared plots with container-width decisions; keep the remainder of the dashboard working.

**Acceptance:** fixture charts match the existing units, traces, guide positions and dash patterns; a 340px chart inside a 1440px page uses a readable narrow layout. Rendering two figures with different scopes cannot cross-contaminate their state.

#### [x] E04 — Produce complete, readable saved images

**Repository:** telemetry. **Dependencies:** E03.

**Files:** `src/utils/exportChart.ts`, its tests; new `src/embeds/exportFigure.ts` and a small offscreen render surface.

Reuse SVG cloning and CSS-variable resolution, adapting them to accept the render surface's computed theme rather than the global document. Render the frozen data at approximately 680px wide and 320px narrow, in both themes. Adjust final dimensions from the real article column; narrowly sized figures must remain readable at the smallest supported article width.

Use measured legend wrapping when allocating export height; the current estimate of four items per row is insufficient for long driver/channel labels. Preserve unique clip/gradient IDs and all axis/guide labels. Export the plot and full legend only; keep author text as HTML to prevent tiny baked-in captions. Disable plot animation; wait for fonts and layout before serializing. Embed no external resources or font URLs; choose a verified portable font stack for SVG image text.

Do not change the dashboard theme or selection while rendering variants. Separate container-scoped tokens from global `body`, `#root`, `:root`, media-query and viewport-height rules. Do not copy the entire dashboard stylesheet into a saved renderer.

**Acceptance:** all four SVGs open independently; no unresolved `var(...)`, external resources, clipped legend or unintentional tooltip is present. At 320/390px viewport sizes, final rendered axis/legend text is approximately 12px or larger, with no horizontal page overflow. Export failure retains the draft and gives an actionable error. Existing standalone SVG downloads still work.

#### [x] E05 — Replace immediate iframe copying with an author composer

**Repository:** telemetry. **Dependencies:** E02–E04.

**Files:** `DashboardContainer.tsx`, `dashboard/CardBar.tsx`, `dashboard/shared.tsx`, `copy.ts`, scoped styles; new `src/embeds/EmbedComposer.tsx`; `VisualWorkflow.test.tsx`.

Open a focus-managed dialog from both tab and panel Embed actions. Provide panel selection, required editorial title/description, caption, exact context, completeness notice, and narrow/wide preview. Show saved-data status and the generated full-analysis link. Download a single validated `.f1embed.json` and copy the `TELEMETRY:` marker with a selectable manual fallback when clipboard access fails.

Keep the existing iframe option behind a clearly labelled “Παλαιού τύπου iframe” choice. Existing iframe URLs remain renderable. Update tests that currently expect an immediate clipboard write from the default Embed action: assert the composer flow, and retain snippet/hash/theme assertions through the legacy choice. All new UI copy is in `copy.ts`, including errors and export progress. Prevent duplicate exports; cancel pending offscreen work when the dialog closes. Capture data once per draft; re-opening creates a new draft from the current dashboard state.

**Acceptance:** supported panel buttons select the right chart; whole-tab buttons offer a deliberate panel choice; unsupported tabs give useful alternatives. Escape closes, focus returns to the trigger, the dialog works on touch, and a lap change after opening cannot alter its exported data. A downloaded bundle validates and contains the preview's scope.

#### [x] E06 — Add a dedicated telemetry publication path to articles

**Repository:** article. **Dependencies:** E02, E05.

**Files:** `blog-module/build/embeds.js`, `embed-render.js`, `shared.js` as needed; new `telemetry-figure.js` and build tests; public-artifact/asset copying integration.

Recognize `TELEMETRY:<basename>.f1embed.json` in plain-text and DOCX placeholder handling. Resolve only local source files. Validate the contract independently, including bounds and consistency between scope, data and image dimensions. Parse/validate SVG using existing XML tooling: allow only the tags/attributes needed by the exporter, local fragment references and bounded dimensions; reject scripts, event handlers, `foreignObject`, external references, DTD/entities and CSS imports/URLs. Do not use a regex-only SVG sanitizer or inject exported SVG with `innerHTML`.

Emit SVGs as local image assets, plain HTML context/caption/source text and a validated analysis link. Fail an invalid/missing telemetry publication with its article/file identified rather than silently publishing an empty figure. Keep existing raw-widget restrictions. Document the intentional vector-chart exception to photo-oriented media policy and ensure SVGs survive the public artifact pipeline.

**Acceptance:** a TXT marker and a DOCX marker build the same figure; bad paths/version/markup fail clearly; no build network access is needed. Rebuilding an unchanged bundle is deterministic, and every emitted image is included in a clean public artifact.

#### [x] E07 — Integrate article layout, responsive images, theme and print

**Repository:** article. **Dependencies:** E06.

**Files:** `blog-module/blog/article-editorial.css`, `article-script.js` only if necessary; dedicated figure render markup; host build/browser tests.

Style the native figure using existing article tokens. Explicitly override the generic caption prefix only within `.f1-telemetry-figure`. Reserve chart geometry from asset dimensions, and wrap text/legends without internal scrollbars. Use narrow/wide `<picture>` sources appropriate to the article layout and light/dark variants selected by the host's normalized theme. Scoped CSS can switch between the two theme pictures without JavaScript; account for both variants potentially downloading rather than claiming hidden images cost nothing.

If actual article-column widths differ materially from viewport breakpoints, add container-aware selection instead of choosing a wide image that becomes unreadable. Normalize light as `data-theme="light"` and dark as explicit dark or the host's missing attribute. Do not write theme storage or alter the root attribute. Force the light saved figure in print and show the source/context/caption and useful destination URL. Image alternatives convey the figure's description; avoid announcing duplicate hidden theme pictures.

**Acceptance:** the real article renders at 320, 390, 768 and 1440px, in both themes, without an iframe or nested vertical scrolling. Theme changes update the figure. With JS disabled and OpenF1 blocked, the chart and link remain usable. Images reserve space; font/image loading causes no material figure-induced layout jump. Print includes the complete chart and caption.

#### [x] E08 — Review a pilot and document the author workflow

**Repositories:** telemetry + article. **Dependencies:** E05–E07.

Review `20260927G` as the source-based pilot. Replace only its telemetry iframe with a saved throttle/brake figure representing the same scope if the stored driver identities agree with the surrounding story. If the expected selection cannot be confirmed, keep the old article intact and make a dedicated fixture preview; do not substitute a different race/lap or driver selection into a published story.

Inventory the other two examples separately. Whole-tab frames require an editorial choice of one or more figures; do not automatically discard panels or convert all tabs to the first chart. Legacy source recovery and Ghost Car conversion are separate follow-ups. Preserve all unrelated prose/media.

Document the author steps: open Embed, select one figure, describe it, check data completeness, download bundle, place it beside article source/in `embeds/`, insert marker, build/preview. Include replacing a figure with a new revision, unsupported panels, malformed bundles and analysis-link meaning.

**Acceptance:** a new author can follow the guide without guessing paths; a complete pilot or faithful fixture preview is reviewable; no unrelated article content changed. Report Release A complete independently of Release B. Publishing/deployment is outside this brief's requested implementation deliverable.

### Release B — implement after Release A is accepted

#### [x] E09 — Build a small standalone interactive renderer

**Repository:** telemetry. **Dependencies:** E03, Release A.

**Files:** new `src/embeds/interactive-entry.tsx`, scoped `figure.css`, `vite.config.ts`, build scripts; an artifact manifest.

Create a separate entry exporting a mount function that accepts a container, validated saved data and normalized theme, and returns an unmount function. Use an open shadow root and a React root with a distinct ID prefix per figure. Load only the two shared renderers, their style tokens and required React/Recharts dependencies. Inject figure styles inside the root, not into the article's document head; keep tooltip DOM inside the same scope. Recharts synchronization IDs must be unique per figure if introduced.

Emit an artifact manifest listing the entry and its dependent chunks/styles. Keep generated names/build bases coherent under both standalone and `/telemetry/` assembly. The article integration must read this manifest rather than hard-code a hashed filename. Keep the full dashboard entry unchanged and avoid introducing a runtime CDN dependency.

**Acceptance:** the standalone fixture page hosts multiple independent figures under intentionally conflicting article CSS. Bundle inspection shows no dashboard container, API client, site nav, preset or history effects. Removing a figure cleans up React, listeners and observers. Both build bases resolve every dynamic import and font/style asset.

#### [x] E10 — Add resilient, explicit enhancement in the article host

**Repository:** article. **Dependencies:** E09.

**Files:** a small figure loader integrated with article assets/templates, artifact-copying rules and browser tests.

Show the Explore button only for a supported figure with a usable configured runtime; initialize that button progressively so JS-disabled articles do not contain a dead control. Load the runtime once per article, deduplicating simultaneous clicks. Fetch only the local saved-data asset when requested, validate it, and pass its scope to the renderer. If module loading fails, allow a later retry without retaining a permanently rejected import promise.

Keep the saved image visible while loading. Swap only when the chart is ready; retain reserved geometry and caption. On failure show a short inline status and keep the image/link. Returning to static view unmounts the chart. One figure failing cannot prevent others from working. Observe the host theme once per article and notify mounted figures; resize each renderer from its own host width. Do not write to localStorage, browser history, root theme attributes or global selection state.

**Acceptance:** no chart runtime/data/API request occurs before interaction; first activation loads one runtime, subsequent activations reuse it. Blocked chunks/JSON preserve the figure. Two figures with different sessions/themes behave independently; switching theme affects mounted charts and saved pictures consistently. All observers/listeners are disposed when no longer needed.

#### [x] E11 — Make touch, keyboard and assistive inspection useful

**Repositories:** telemetry + article. **Dependencies:** E10.

Hover can show a tooltip; tapping chooses a point without preventing normal article scrolling. Keyboard focus on the chart enables arrow-key movement through saved sample points, with Home/End for endpoints and an accessible textual value readout. Keep units, driver/channel names and unsigned brake percentages consistent with the display. Do not intercept page scrolling keys until the reader focuses the inspection control; do not announce every mouse movement through an assertive live region.

Preserve the author description and source in normal HTML, visible focus and approximately 44px touch targets. Provide a useful textual/table route to the same saved values through a collapsible HTML section or equivalent accessible inspector. Avoid a forced modal/fullscreen experience. Honour reduced motion, and restore focus when returning to the static figure.

**Acceptance:** touch scrolling stays natural, all inspection actions work by keyboard, and a screen reader can identify drivers/units and inspect values without hovering. No colour-only distinction between teammates/channels. Print still uses the saved light image even after interactive activation.

### Compatibility and release checks

#### [x] E12 — Verify regressions and provide review evidence

**Repositories:** both. **Dependencies:** relevant release tasks above.

Run telemetry `npm run ci` and `npm run build:f1stories`. Run article `npm run test:blog`, its targeted new tests, `npm run build:public`, and the existing relevant asset/static/performance guards. Use the Node versions specified by each repository; telemetry's README and Main's package currently have different guidance. Assemble a local canonical preview and test actual emitted artifact paths; do not declare success from a dev server alone.

Use browser checks in Chromium, Firefox and WebKit for both supported panels. Fixtures must make the checks independent of live OpenF1. Cover:

- Narrow and wide article layouts, light/dark and theme changes.
- 1/2/4 drivers, teammates, partial data, sample/progress axes, long Greek labels.
- Two figures in one article; article hash/query/history and stored theme remain intact.
- JS disabled, API blocked, missing image/data/chunk, clipboard denial and retry.
- Existing `?embed=1#panel` and whole-tab URLs, share, SVG export and dashboard filters.
- Print and, in Release B, interaction, static restore and removal/reinsertion cleanup.

Measure network delivery rather than infer it: Release A loads no telemetry app JavaScript and sends zero OpenF1 requests. Release B's heavy renderer/data load only after activation and send zero OpenF1 requests. Record compressed image/data/module sizes, initialization time and figure-attributable layout shift. Initial budget targets: at most 150 KiB compressed per selected SVG, 150 KiB for local plotted data, and 300 KiB for the lazily loaded runtime plus dependencies. Report actual totals, including both theme variants if fetched. If a target is exceeded, first remove unnecessary payload/imports; explain remaining measured tradeoffs rather than broadly increasing repository budgets.

**Acceptance:** passing commands, artifact checks, before/after screenshots, keyboard/touch results and measured payloads are recorded in a short implementation report. Any unavailable real-device check is labelled as unperformed, not passed. Release A's primary acceptance is a complete article-native figure with no iframe; Release B must not weaken that fallback.

## 6. Order and completion criteria

Release A E01 → E08 and Release B E09 → E11 are implemented and verified by E12. Keep telemetry changes and article integration reviewable separately, with the same contract fixture in both.

Do not spend the first release replacing every chart, adding live article dashboards or redesigning the site. Later candidates are track maps, weather trends, strategy/tables and separate Ghost Car figures. Each needs a real representation: multi-surface exports must retain labels/statistics, tables need semantic HTML, and radio needs an intentional media experience. They should not be advertised as supported by a two-panel implementation.

If the article checkout is unavailable, telemetry export/composer can be completed and tested with a fixture host, but **end-to-end article replacement remains incomplete**. Record the exact remaining host tasks; do not claim that changing this repository alone fixes published articles.

## 7. Technical references

- [MDN: Using Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM): supports the proposed CSS boundary; inherited properties/tokens still need deliberate handling. Shadow DOM is not a security sandbox.
- [MDN: SVG as an image](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image): SVG image contexts restrict scripting/external resources, which is why snapshots must be self-contained and delivered as images rather than injected markup. Validation still applies to publication inputs.
- [Vite: Building for Production](https://vite.dev/guide/build.html): multi-entry builds and base-path behavior underpin the proposed separate renderer artifact. Verify against this project's installed Vite version when implementing.
- [MDN: Window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage): if a later compatibility task adds iframe resizing, validate message origin, sender, schema and bounded height, and target an exact parent origin. No message bridge is required for the native figure path.
