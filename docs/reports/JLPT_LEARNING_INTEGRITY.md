# JLPT learning integrity

Run `npm run audit:jlpt-content -- reports/jlpt-content-quality.json` to produce the machine-readable curriculum report. The command inspects the raw N5–N1 sources and does not claim to assess Japanese linguistic correctness.

## Current structural baseline

| Level | Lessons | Raw items | Quarantined structural items |
| ----- | ------: | --------: | ---------------------------: |
| N5    |      25 |       663 |                            0 |
| N4    |      25 |       675 |                            0 |
| N3    |      30 |       720 |                           87 |
| N2    |      30 |       649 |                           90 |
| N1    |      30 |       645 |                           90 |

The 267 quarantined exercises contain generated explanatory placeholders in answer options. They are excluded by both the level modules and the production curriculum loader. They need Japanese-language expert rewrites before publication. The validator also reports duplicate options, missing explanations, invalid answer references, duplicate IDs and repeated prompts. Repeated prompts are flagged for review rather than automatically removed.

## Assessment integrity

Readiness separates measured, estimated and insufficient-data evidence. Reading can be estimated from related progress but is labelled accordingly. Listening has no estimate when there is no scored listening assessment. Speaking is displayed as a separate activity and is not listening evidence.

The mock exam only uses recorded listening audio in timed mode. Practice mode can use explicitly labelled synthetic playback when a transcript exists. Synthetic listening attempts are excluded from comparable listening evidence.

Timed mock answers create local per-user records for accuracy, first-answer duration and skipped questions. The Weakness Analysis tab summarizes these records. It presents custom practice evidence, not official JLPT scaled scores.

## Manual review

Automated checks cannot verify grammar naturalness, ambiguity, difficulty calibration, explanation pedagogy, audio authenticity or copyright and source permissions. A Japanese-language expert must review all quarantined items and any `review` issue from the generated report before publication.
