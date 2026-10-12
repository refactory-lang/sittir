"""Medians of `views-rounds.sh`'s JSON lines, per form and input, as a markdown table.

    python3 views-report.py runs.jsonl
"""
import json
import statistics
import sys
from collections import defaultdict

runs = defaultdict(list)
for line in open(sys.argv[1]):
    line = line.strip()
    if line.startswith('{'):
        row = json.loads(line)
        runs[(row['input'], row['form'])].append(row)

print('| input | form | every match | one per call | heap | fast nodes | read after many | fast after reaching | heap after reaching |')
print('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (source, form), rows in sorted(runs.items()):
    med = lambda key: statistics.median(row[key] for row in rows)
    total = rows[0]['nodes']
    print(f"| {source} | {form} | {med('batchNs') / 1000:.2f} µs | {med('oneNs') / 1000:.2f} µs | {med('heap'):.0f} B | {med('fast'):.0f} / {total} | {med('readManyNs') / 1000:.2f} µs | {med('fastAfter'):.0f} / {total} | {med('heapReached'):.0f} B |")
