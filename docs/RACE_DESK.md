# Race Desk in Telemetry

Telemetry is one of four Race Desk products. The canonical architecture lives in the main site: [`f1StoriesPage/docs/race-desk-architecture.md`](https://github.com/georgiosbalatzis/f1StoriesPage/blob/main/docs/race-desk-architecture.md). This page only records how Telemetry applies it.

| Level | In Telemetry | Where |
|---|---|---|
| Global section | `Δεδομένα` is current (`aria-current="page"`) | Masthead, `SITE_NAV` in `src/copy.ts`. Unchanged; Race Desk and its products never go here. |
| Umbrella | `F1 STORIES / RACE DESK` | Kicker on the hero rule. Not a heading. |
| Products | `THE GRID` · `TELEMETRY` · `GHOST CAR` · `TYRES`, TELEMETRY current | `<nav aria-label="Race Desk" lang="en">` on the same rule, `RACE_DESK_NAV` in `src/copy.ts` |
| Product | `TELEMETRY.` with `Τηλεμετρία & ανάλυση γύρου` | The page's only H1 |
| Analysis views | Τηλεμετρία, DRS & RPM, Track Map, … | Dashboard tab strip. Not Race Desk products. |

Two current items at once is intended: `Δεδομένα` in the global nav and `TELEMETRY` in Race Desk sit at different levels.

## Destinations

| Product | URL |
|---|---|
| THE GRID | `https://f1stories.gr/standings/` (absolute, never the local redirect stub) |
| TELEMETRY | `import.meta.env.BASE_URL`, i.e. `https://georgiosbalatzis.github.io/f1-telemetry-dashboard/` in production |
| GHOST CAR | `https://georgiosbalatzis.github.io/ghostcar/` (not the main site's `/ghostcar/` stub) |
| TYRES | `https://georgiosbalatzis.github.io/Tyres/` (not the main site's `/tyres/` stub) |

The GitHub Pages hosts are deployment boundaries, not separate brands. Links open in the same tab, carry no ↗, and pass no dashboard state (`?theme=`, drivers, session, tab, embed). BetCast is a sibling F1 Stories product and is not in the switcher.

## Visual rules

Styles are `.race-desk-nav` in `src/index.css`, using existing tokens only. Labels are Barlow Condensed 700, 15px. Inactive labels use `--text-muted`; the current one uses `--text` plus a 3px `--signal` bar on the kicker rule, so state is not color alone. Focus is the global 2px `--focus` outline; no ancestor may set `overflow` that would clip it. Targets are 44px tall. Below 768px the products wrap onto their own `--line` sub-rule under the kicker, and below 401px their gap and tracking tighten so all four fit 320px. The dashboard tabs underline *below* the label, so the two levels never look alike.

Two details hold this together. `.site-nav` has `z-index: 1`, because the positioned switcher links would otherwise paint over the fixed masthead and the open mobile menu. The descriptor under the H1 keeps a whole-pixel line height (18px), so the dashboard below moves by whole pixels and stays pixel-identical in visual comparisons.

`node scripts/shell-parity.mjs` checks order, the single current item, 44px targets, overlap, overflow, an unclipped focus ring, and that the masthead and open menu cover the switcher, at 1440–375px in both themes and all three engines.
