# Telemetry P-04 startup performance record

## Outcome

A defect in the OpenF1 pacer was found and fixed.
In the final matched run, chartReady was faster in all nine cells.
The literal predeclared verdict is **REJECTED** solely because first-party gzip bytes increased by 186 B in every cell, triggering clause 1 of the mirrored rule.
The rule was not relaxed. Acceptance of this trade is an owner decision.

## Cause

In three instrumented control profiles, a queued lap-1 `car_data` key was superseded by lap 52 before dispatch. Race control was queued behind it; the lap-1 request had no dispatch mark. The old `takeSlot` could reclaim only the last reservation, so the superseded request retained its slot and race control waited an extra 350 ms slot. The key change and missing dispatch were observed. The abort follows from hook cleanup, and the retained reservation follows from the old code and queue order; abort and reservation timestamps were not instrumented. Evidence: evidence archive: telemetry/CHANGE.md; evidence archive: telemetry/ATTRIBUTION.md; evidence archive: telemetry/results-diag/summary.md.

## Change

The pacer uses a FIFO pending queue and removes aborted queued requests. It keeps at least 350 ms between actual dispatches using the monotonic `performance.now()` clock. `MIN_GAP_MS`, retries, Retry-After, timeouts and URLs are unchanged. The added `src/api/__tests__/pacer.test.ts` contains 11 cases. Reviews identified and resolved a clock issue and test coverage gaps; the test-only follow-up to the third review was addressed at `pacer.test.ts:197`. Final test review: see PR. Evidence: evidence archive: logs/sol-c.review.md; evidence archive: logs/sol-c2.review.md; evidence archive: logs/sol-c3.review.md.

## Measurement method and validity

The harness served gzip like production, replayed captured fixtures fail-closed, interleaved artifacts in seeded order, gated on load and used Chrome 157. It measured mobile and desktop, light and dark, cold and warm, plus mobile-light-cold standalone: nine cells. Round 2 had five valid navigations per artifact per cell, 90 in total. Round 1 used seed `p04`; round 2 used `p04b`. The control baseline and diagnostic profiles establish control behavior; the matched run supports the comparisons below within the harness conditions. Round 1 measured pre-review code and is superseded. Evidence: evidence archive: telemetry/bench.mjs; evidence archive: telemetry/results-control/summary.md; evidence archive: telemetry/paired-01/verdict.md; evidence archive: telemetry/paired-02/verdict.md; evidence archive: telemetry/paired-02/summary.json.

The predeclared chartReady rule requires variant max below control min, or a median gain of at least 10% and 150 ms with non-overlapping IQRs. The mirrored rule tests regressions; any provider request multiset change rejects. Missing required measurements cannot establish acceptance. Evidence: evidence archive: telemetry/CHANGE.md.

## Results: round 2

Delta is variant minus control. Clause 1 means variant max is below control min; clause 2 also requires the median and IQR conditions above. Values are from evidence archive: telemetry/paired-02/verdict.md.

| Cell | Control median [min–max] ms | Variant median [min–max] ms | Delta ms | Delta % | Clause |
|---|---:|---:|---:|---:|---|
| mobile-light-cold | 4687.9 [4682.7–4690.9] | 4402.1 [4378.3–4419.5] | -285.8 | -6.097% | 1 |
| mobile-light-warm | 4562.6 [4545.9–4578.7] | 4233.9 [4230.1–4259.3] | -328.7 | -7.204% | 1 |
| mobile-dark-cold | 4682.4 [4679.3–4690.1] | 4420.4 [4395.5–4430] | -262 | -5.595% | 1 |
| mobile-dark-warm | 4558.5 [4554.4–4577.7] | 4245.8 [4229.4–4280.4] | -312.7 | -6.86% | 1 |
| desktop-light-cold | 3255.4 [3251.6–3259.1] | 2912.5 [2897.6–2916.5] | -342.9 | -10.533% | 1+2 |
| desktop-light-warm | 3223.2 [3221.9–3227.8] | 2881.4 [2880.6–2884.6] | -341.8 | -10.604% | 1+2 |
| desktop-dark-cold | 3257 [3251.1–3258.8] | 2917.8 [2914.5–2918.1] | -339.2 | -10.414% | 1+2 |
| desktop-dark-warm | 3224 [3222.4–3227.6] | 2878.6 [2869.4–2884.2] | -345.4 | -10.713% | 1+2 |
| mobile-light-cold-standalone | 4680.5 [4677.8–4687.1] | 4409.4 [4358.6–4426.3] | -271.1 | -5.792% | 1 |

DashboardReady, FCP and LCP triggered no regression clause. Cold-cell ScriptDuration and TaskDuration triggered no clause. Provider bytes were identical at 249,137 B, and the provider request multiset was equal in all 225 cross-artifact pairs. First-party bytes increased from 686,508 to 686,694 on mobile and from 561,432 to 561,618 on desktop.

## Limitations

The harness routes every request, disabling the HTTP cache. Warm means a second navigation in the same context, not cache-warm. Warm-cell ScriptDuration and TaskDuration are invalid because the harness subtracts counters across documents. Six tabs lacked fixtures: Track Map, Θέσεις, Intervals, Ελαστικά, Team Radio and Καιρός. Race Control was also unmeasured in two navigations. The measurements used local loopback, not production. Evidence: evidence archive: telemetry/bench.mjs; evidence archive: telemetry/paired-02/verdict.md.

Round 2 measured the final `openf1.ts` with SHA-256 `58975dc2fbcb64e2e1728ced3504424d4ea2434a7bc714f89d2ccfffb48b0cf9`; the variant patch has SHA-256 prefix `3836c49b`. Build provenance is based on process evidence, not independent reproduction of the served artifact. Evidence: evidence archive: telemetry/variant-paired-02.patch; evidence archive: logs/sol-c3.review.md.

## Deployment and pins

Nothing was deployed. The f1StoriesPage pin `38c3dd201` is unchanged. Publishing requires owner approval, a separate pin-bump PR and release authorization. Rollback: revert the commit.
