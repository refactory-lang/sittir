Node v24.21.0, linux-x64, 4× AMD EPYC 9V45 96-Core Processor. 5 rounds in alternating variant order, a fresh process per measurement; each measurement is the median of 100 timed passes after 10 warm-up passes, a pass parsing every corpus entry once and disposing its tree.

Stop rule: every variant's spread (max − min over the rounds, against their median) ≤ 4%. Attempts: 3; the counted run does NOT meet the rule.

### ms per pass (median of rounds; spread)

| grammar | (a) parse | parse, then the trivia table alone | (b) parse, then node_slots for every routed node | (c) parse, then a full read | (d) parse, then (b)'s walk, then a full read |
| --- | --- | --- | --- | --- | --- |
| rust | 2.95 (3.8%) | 4.58 (1.0%) | 10.40 (6.1%) | 10.13 (3.8%) | 18.03 (4.2%) |
| typescript | 2.65 (3.1%) | 4.04 (2.7%) | 8.76 (2.8%) | 8.76 (3.7%) | 15.42 (5.1%) |
| python | 2.91 (7.2%) | 4.57 (2.9%) | 10.91 (0.9%) | 10.39 (1.9%) | 18.79 (2.7%) |

### Change

| grammar | (b) over (a) | (d) over (c) | trivia table alone over (a) |
| --- | --- | --- | --- |
| rust | +253.3% | +78.0% | +55.3% |
| typescript | +229.9% | +76.1% | +52.1% |
| python | +274.5% | +80.9% | +56.8% |

### What a pass covers

| grammar | trees | nodes | routed nodes | nodes with a list slot | list slots | trivia runs | full reads refused |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rust | 149 | 8337 | 3298 | 246 | 246 | 4547 | 0 |
| typescript | 119 | 6784 | 2404 | 167 | 167 | 3931 | 0 |
| python | 116 | 8441 | 3959 | 316 | 316 | 4245 | 0 |

### Retained memory per 100 trees (MiB; 5 copies of the corpus held, after GC; median of rounds)

| grammar | trees held | variant | RSS | JS heap | external |
| --- | --- | --- | --- | --- | --- |
| rust | 745 | (a) parse | 1.53 | -0.00 | 0.00 |
| rust | 745 | parse, then the trivia table alone | 2.14 | -0.00 | 0.00 |
| rust | 745 | (b) parse, then node_slots for every routed node | 3.39 | 0.00 | 0.00 |
| typescript | 595 | (a) parse | 1.60 | 0.00 | 0.00 |
| typescript | 595 | parse, then the trivia table alone | 2.27 | 0.00 | 0.00 |
| typescript | 595 | (b) parse, then node_slots for every routed node | 3.54 | 0.00 | 0.00 |
| python | 580 | (a) parse | 1.49 | -0.00 | 0.00 |
| python | 580 | parse, then the trivia table alone | 2.23 | -0.00 | 0.00 |
| python | 580 | (b) parse, then node_slots for every routed node | 3.86 | 0.00 | 0.00 |

### Spread per attempt (%)

| attempt | grammar | a | t | b | c | d | meets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | rust | 2.7 | 3.3 | 5.2 | 4.9 | 0.8 | no |
| 1 | typescript | 4.3 | 6.2 | 7.3 | 7.6 | 4.9 | no |
| 1 | python | 4.1 | 2.1 | 5.8 | 5.8 | 3.3 | no |
| 2 | rust | 1.5 | 2.0 | 3.5 | 5.8 | 5.4 | no |
| 2 | typescript | 7.3 | 7.3 | 3.4 | 9.3 | 5.7 | no |
| 2 | python | 5.2 | 2.1 | 2.9 | 6.5 | 6.0 | no |
| 3 | rust | 3.8 | 1.0 | 6.1 | 3.8 | 4.2 | no |
| 3 | typescript | 3.1 | 2.7 | 2.8 | 3.7 | 5.1 | no |
| 3 | python | 7.2 | 2.9 | 0.9 | 1.9 | 2.7 | no |
