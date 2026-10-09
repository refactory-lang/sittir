#!/usr/bin/env python3
"""Measures: the native writer's time per render and the layout table's size,
  from the logs of writer-stats.mts (one log per run).
Run:    python3 writer-stats.py <run.log>...
Prints: per file and width, the lowest writer time of each log as a range
  over the logs (µs); with the table on, the part spent in the pass and the
  flatten (finish), and the table's figures: output and text bytes, rows,
  seams, lists (all / breakable / broken) and table bytes.
"""
import collections, re, sys

best = collections.defaultdict(list)
finish = collections.defaultdict(list)
table = {}
for path in sys.argv[1:]:
    cur = None
    low, low_finish = {}, {}
    for line in open(path):
        if line.startswith('TARGET'):
            cur = tuple(line.split()[1:3])
            low[cur] = low_finish[cur] = None
            continue
        if line.startswith('END'):
            cur = None
            continue
        if cur is None or not line.startswith('LAYOUT'):
            continue
        fields = dict(part.split('=') for part in line.split()[2:])
        total = int(fields['total_ns'])
        low[cur] = total if low[cur] is None else min(low[cur], total)
        if 'finish_ns' in fields:
            took = int(fields['finish_ns'])
            low_finish[cur] = took if low_finish[cur] is None else min(low_finish[cur], took)
            table[cur] = fields
    for key, ns in low.items():
        if ns is not None:
            best[key].append(ns / 1000)
    for key, ns in low_finish.items():
        if ns is not None:
            finish[key].append(ns / 1000)

runs = len(sys.argv) - 1
for key in best:
    line = f'{key[0]:18s} width {key[1]:4s}: writer {min(best[key]):.1f}-{max(best[key]):.1f} us over {runs} run{"s" if runs != 1 else ""}'
    if finish[key]:
        f = table[key]
        line += f'  pass+flatten {min(finish[key]):.0f}-{max(finish[key]):.0f}'
        line += f'  out {f["out"]} B, text {f["text"]} B, rows {f["rows"]}, seams {f["seams"]}, lists {f["lists"]}/{f["breakable"]}/{f["broken"]}, table {f["table_bytes"]} B'
    print(line)
