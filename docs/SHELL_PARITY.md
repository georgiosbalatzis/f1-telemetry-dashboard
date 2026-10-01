# Telemetry / F1Stories Priority 1 shell audit

Audited 2026-10-01 against `georgiosbalatzis/f1StoriesPage` main at `dce4547e727ddcecc46e6e79421fc255cb3a5e79`, fetched from origin during this task. The comparison used `partials/nav.html`, `partials/footer.html`, `styles/editorial.css`, `styles/shared-nav.css`, `scripts/shared-nav.js`, and the generated homepage and standings/data pages. Canonical assets were built in a temporary directory from that revision; the existing F1Stories checkout and its user changes were left intact. Ghost Car's current shell source was also inspected as a secondary reference.

## Findings and changes

- The seven global labels, their order and destinations were already canonical: Αρχική, Άρθρα, YouTube, Βαθμολογία, Δεδομένα, Συντάκτες, BetCast. Footer section links and privacy/terms destinations were also current. No URL substitutions were needed.
- Δεδομένα already had the visual current state but lacked `aria-current="page"`. Both desktop and mobile links now expose it; no other global item does.
- Global masthead/footer containers were capped at 1280px instead of 1476px. Their shell-only cap and edges now match canonical: 48px at desktop, 32px below 1200px, 22px below 768px. The content/hero container is unchanged.
- The masthead now uses the canonical `logo-nav.webp`, 38px normally and 32px on phones, and its wordmark dot uses the canonical signal color. Height, font weight, link spacing and active rule now match the data shell. Desktop navigation begins at 992px; mobile height is 67px, desktop inner height 75px. The masthead stays fixed while scrolling, as on the canonical site, with matching space reserved above the existing hero and scroll padding to keep the skip target visible.
- Mobile links now use canonical full-width 52px rows, current-item left rule, separators and external-link arrows. Native details/summary remain in place, with explicit expansion state and a panel relationship. Enter/Space toggle natively; Escape closes and returns focus; following a link closes the menu. Native named details keep the navigation and tools menus exclusive.
- A pre-existing tools-popup overflow at 375px was corrected by constraining its width within the masthead. Tool actions, presets and callbacks are unchanged.
- The footer retains the F1 Stories wordmark/mission/index/legal hierarchy and OpenF1 credit. It now includes the canonical five social/contact destinations and SVG symbols, with labels, safe new-tab links and 44px targets. The responsive grid, colors, borders and spacing follow the canonical dark colophon. Copyright uses the current year, as the canonical runtime does.
- Only feedback from masthead utilities was translated: save/load comparison, print, split toggle and empty history. No preset, print, split or navigation behavior was changed.

## Files changed

Existing application files: `src/copy.ts`, `src/components/dashboard/DashboardHeader.tsx`, `src/components/dashboard/SiteFooter.tsx`, `src/index.css`, and `src/components/DashboardContainer.tsx` (feedback copy only).

Added: `public/logo-nav.webp`, `public/f1stories-social.svg` (canonical assets), `src/components/__tests__/SiteShell.test.tsx`, `scripts/shell-parity.mjs`, and this report. No package manifest or lockfile changed.

## Intentionally unchanged

Telemetry's hero (`F1 Stories / Race Desk`, `Τηλεμετρία & ανάλυση γύρου`, `TELEMETRY.`), content width, charts, API/data flow, selection, export/share/embed paths, performance work, lazy loading and existing Lucide control icons remain intact. Theme initialization, persistence and the `f1stories-theme` key were not changed.

The existing next-meeting calculation and minute timer were preserved. Display rules now follow the shell's width constraints: full countdown at 768–991px and 1200px+, timer only at 576–767px, hidden on phones and compact desktop. Long meeting names truncate without hiding the time. A historical selected season may have no upcoming meeting; that product context remains valid.

Canonical cookies settings and standings cache-clearing controls were not added. Telemetry has neither the canonical tracking/consent system nor the standings cache, so those controls would have no corresponding action. Canonical homepage and data pages also differ slightly in their dark masthead treatment; Telemetry follows the data shell.

## Validation

- `npm test`: 110 tests across 24 files passed, including the new shell regression tests and the existing workflow/theme/share/embed checks.
- `npm run lint`: passed with zero warnings.
- `npm run build`: passed, including TypeScript.
- `node scripts/shell-parity.mjs`: all 36 combinations passed: Chromium, Firefox and WebKit × light/dark × 1440, 1280, 1024, 768, 390 and 375px. The checks exercise a long upcoming meeting name, global navigation, current state, menu expansion, keyboard order, Escape/focus return, visible touch targets, tools-popup bounds, fixed masthead/skip-target visibility, theme persistence after navigation and absence of horizontal overflow/runtime exceptions. Safari's default link-navigation convention uses Option-Tab. The script reuses the existing recorded OpenF1 calendar fixture; run the existing visual baseline tool first if fixtures are absent.
- `node scripts/visual-baseline.mjs --compare`: all 180 screenshots captured (10 tabs × light/dark × 390/820/1440px × three engines). The old full-page gate exits 1: 120 Chromium/Firefox images differ and 60 WebKit images are advisory. The intentional footer-height changes exceed its 24px dimension tolerance, which it reports as `100%`; this is not a measurement that every pixel changed. The original Chromium/Firefox images were preserved under `.perf-baseline/pre-shell/`. Their strict baselines were refreshed only after reviewing the intended shell changes and the dashboard-region comparison; WebKit baselines were left unchanged.
- `node scripts/visual-baseline.mjs --compare --tabs=telemetry`: final production verification passed across 18 screenshots, with zero blocking Chromium/Firefox differences and six WebKit advisories against the retained old shell snapshots.
- Every old/current image was checked with a separate shell-region comparison that accounts for the +1px desktop / -7px mobile masthead shift and excludes the changed colophon. All 120 Chromium/Firefox dashboard bodies remain below the existing 0.1% pixel threshold. WebKit has 13 body comparisons above that threshold: tab-strip/raster differences and text-wrap/height shifts consistent with the previously documented approximately 18px capture jitter. Those regions were inspected side by side; data, chart geometry and product structure remain intact. No product code was changed to compensate for browser capture behavior.
- The masthead/hero, open mobile menus, open tools and footers were visually inspected across the 36 shell combinations and compared with current canonical homepage/data captures. Footer contact sheets include both themes and all engines.
- Existing performance metrics completed against production with recorded data, while visual capture was running on separate preview ports. Initial JS is about 83.0KB gzip (previous 82.5KB), CSS 12.8KB (previous 12.1KB). Mobile/desktop charts appeared in about 1.88–1.94s; recorded CLS was 0.0003/0.0017. Fifteen lap steps and throttled tab/theme switches completed. This is a replay smoke check, not a fresh live-service performance benchmark.

Review artifacts are local and gitignored: `.perf-baseline/shell-parity/`, `.perf-baseline/shell-canonical/`, `.perf-baseline/shell-review/`, `.perf-baseline/shell-region-report.json`, `.perf-baseline/compare-report.json` and `.perf-baseline/metrics-shell.json`, and the preserved `.perf-baseline/pre-shell/` snapshots.

## Later product localization

Product-level English remains deliberately outside this pass: lazy-tab loading labels in `DashboardShell.tsx`, chart headings/metadata and empty/error states, driver loading statuses in `useDashboard.ts`, share/embed clipboard prompts and feedback in `DashboardContainer.tsx`, and the established English F1 tab terms. The product hero's English identity is intentional. No obvious untranslated global navigation/footer copy remains.

## Priority 1 judgment

The Telemetry shell implementation and responsive/accessibility review are complete. Δεδομένα is the sole current global item; Telemetry remains a content identity; countdown, theme and dashboard behavior are preserved. No new dependencies, PR or deployment were introduced. The original strict snapshots are preserved for review; the reviewed shell baselines have been refreshed. No unresolved shell defect was found. The old WebKit full-page baselines remain advisory because of the intended shell changes and their documented capture instability.

## Requested sponsors bar follow-up

The six-partner strip from the current [F1Stories homepage](https://f1stories.gr/) now sits immediately above the colophon. Its order, destinations, relationship labels and normalized 1x/2x WebP logos match the canonical homepage at the same revision. The paper background remains light in both themes; grayscale logos return to full color and opacity on hover or keyboard focus with the canonical 350ms transition. The existing reduced-motion rule disables that transition. The strip uses six columns on desktop and three below 992px, matching `home.css`, with the same heading, rule, spacing and shell edges.

Changes are confined to `SiteFooter.tsx`, shell CSS, the twelve canonical assets under `public/images/sponsors/normalized/`, the existing shell tests/check script and this report. Links retain `noopener sponsored`; image alternatives name each partner, targets remain at least 44px, and the strip is excluded from print and embed views. No dashboard feature, theme logic or dependency was changed.

- `npm test`: 111 tests passed; lint and production build passed.
- `node scripts/shell-parity.mjs`: all 36 browser/viewport/theme combinations passed, now also checking sponsor image loading, safe bounds, hover and actual keyboard-focus color changes, visible focus and reduced motion. All sponsor screenshots were visually inspected against the live homepage at 1440, 1280, 1024, 768, 390 and 375px in both themes. A separate normal-motion browser check verified the 350ms effect and print/embed exclusion.
- `node scripts/perf-metrics.mjs --label=sponsors --replay`: completed; charts appeared in approximately 1.88s on mobile and desktop, with CLS 0.0003/0.0017 and no 429 responses. Initial JS is 83.6KB gzip and CSS 13.1KB; sponsor images load lazily.
- Full visual baseline capture completed across all 180 tab/theme/viewport/browser combinations. The initial comparison correctly flags the added section's height in all old snapshots. A separate comparison of every dashboard region above the strip found all 120 Chromium/Firefox bodies pixel-identical; the retained older WebKit snapshots have 11 body comparisons above their advisory threshold, consistent with the previously recorded capture shifts. Sponsor captures and the relocated footer were reviewed, including before/after footer images with minor text-raster differences after the vertical move. The 120 strict snapshots were then refreshed, preserving originals in `.perf-baseline/pre-sponsors/`; WebKit baselines remain untouched.
- Final `node scripts/visual-baseline.mjs --compare --tabs=telemetry`: passed across 18 fresh captures with zero blocking differences and six advisories against the retained old WebKit snapshots.

Review artifacts remain local and gitignored: `.perf-baseline/sponsors-canonical/`, `.perf-baseline/sponsors-review-*.png`, the sponsor captures within `.perf-baseline/shell-parity/`, `.perf-baseline/sponsors-region-report.json`, `.perf-baseline/sponsors-initial-compare-report.json`, `.perf-baseline/pre-sponsors/`, and `.perf-baseline/metrics-sponsors.json`.
