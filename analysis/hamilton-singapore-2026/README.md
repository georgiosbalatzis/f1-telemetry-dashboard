# Hamilton / Singapore 2026 Q3

Open `index.html` for the figures or read `report.el.md` for the Greek article. The report distinguishes recorded facts, reconstructed distance and unverified interpretations.

- Lap A: session 11384, driver 44, lap 21, 91.496 s.
- Lap B: session 11384, driver 44, lap 24, 91.648 s.
- `raw/`: untouched OpenF1 responses plus MultiViewer circuit geometry.
- `aligned.csv`: every aligned channel (speed, throttle, brake state, gear, RPM, elapsed time), with empty cells for unsupported regions.
- `processed.json`: reference geometry, per-lap samples, stream validation, coverage, corner windows and measurements.
- `manifest.json`: request URLs and SHA-256 hashes.
- `figures/`: A/B individual speeds, C combined speed, D pedals, E T1/T3 speed/pedals, and stacked E detail figures. Each has light/dark, 360px mobile / 680px desktop SVGs and 3× PNGs. Individual panels include strict version-2 `.f1embed.json` publication bundles. Stacked E images use the two corresponding panel bundles as their underlying datasets.

## Reproduce

Start `npm run dev -- --host 127.0.0.1`, then run `node scripts/generate-singapore-figures.mjs` in another terminal. This reuses the production alignment, contract and export renderer; it reads the frozen responses without downloading replacement data. The installed Playwright Chromium is used for real SVG and PNG rendering. Set `TELEMETRY_URL` if the local server runs on another port (deployment base must stay `/f1-telemetry-dashboard/`).

The figures span 0–4927 m and 0–350 km/h in 50 km/h steps. A and B share domains, ticks and chart dimensions. T1/T3 windows are 200–450 m / 450–800 m, chosen around sourced map positions; they are analysis windows, not official corner entry/exit lines. Corner positions are projected geometrically, never inferred from speed minima. No extrapolation fills the unsampled lap endpoints. The ~20 m spatial caveat is a practical qualification supported by sector station discrepancies, not a statistical confidence interval.

## Verification limits

FIA Doc 74 independently verifies Lap A's best Q3 time; FIA Docs 69 and 70 do not delete either Hamilton attempt. Phase-tagged OpenF1 race-control records establish Q3 (14:17–14:30 UTC); the scheduled OpenF1 session end at 14:00 UTC is not used for segmentation. The complete attempt list contains two flying laps, two out-laps, one in-lap and a final incomplete in-lap. Lap B's time and both sets of sectors were retrieved from OpenF1 but could not be independently checked against a complete FIA lap/sector timing sheet. Requests to the Formula 1 static live-timing archive returned HTTP 401; direct FIA downloads returned 403 in the shell, although FIA documents were readable through web browsing. No blocked response is saved as a PDF or treated as evidence.

The two plotted traces have approximately 92.2% / 93.4% usable grid coverage under a 600 ms telemetry interpolation limit. They are suitable for a qualified descriptive comparison with visible gaps. They do **not** meet an uninterrupted-full-coverage requirement, certify metre-level braking differences, provide a validated cumulative finish delta or prove a vehicle-dynamics snap. Those interpretations are non-publishable from this dataset. The Greek report states these limits explicitly.

## Sources reviewed

- OpenF1: https://openf1.org/docs/ and the canonical API requests in `manifest.json`.
- FIA final classification: https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_final_qualifying_classification.pdf
- FIA circuit map (4.927 km, sector stations and corner numbering): https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_competition_notes_-_circuit_map_pit_lane_drawing_and_emergency_exits_map.pdf
- FIA deleted laps: https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_infringement_-_qualifying_deleted_lap_times.pdf
- FIA double-yellow deleted laps: https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_infringement_-_qualifying_deleted_lap_times_-_double_yellow.pdf
- MultiViewer geometry: https://api.multiviewer.app/api/v1/circuits/61/2026
- Hamilton's comments: https://www.formula1.com/en/latest/article/i-had-a-lot-of-struggles-leclerc-reveals-misjudgement-that-cost-him-singapore-pole.10ZX0dKhEvCzFcqEfu3M0m.10ZX0dKhEvCzFcqEfu3M0m
