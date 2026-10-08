#!/usr/bin/env python3
"""Measures: how well "no line-sensitive token is valid at the seam" predicts
  that a line break there is safe. Crosses each site's class from the oracle
  (token valid at none / some / every inline gap) with what the validators
  counted when a line break was forced at that site alone.
Run:    python3 forced-report.py <checkout-root> <grammar> <records.jsonl> <forced-dir> <token,...|-|none> [--list]
        <forced-dir> is forced-run.sh's output directory.
Prints: the baseline counts; a 3 x 2 table (class by "no count changes" /
  "a count changes"); with --list, the option path of every site in the cells
  that matter, with the counts it lost.
"""
import collections, os, sys
from oracle_lib import COUNT_KEYS, EVERY, FREE, SOME, Sites, counts, inline_observations, line_tokens, site_class

root, grammar, records, forced = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
observed = inline_observations(records, line_tokens(grammar, 'runtime', sys.argv[5]))
sites = Sites(root, grammar)
base = counts(os.path.join(forced, 'baseline.txt'))
assert base is not None, 'baseline.txt has no counts'

table = collections.Counter()
detail = collections.defaultdict(list)
missing = 0
for s in sorted(observed):
    got = counts(os.path.join(forced, f'{s}.txt'))
    if got is None:
        missing += 1
        continue
    lost = {k: base[k] - got[k] for k in COUNT_KEYS if got[k] != base[k]}
    outcome = 'a count changes' if lost else 'no count changes'
    table[(site_class(observed[s]), outcome)] += 1
    detail[(site_class(observed[s]), outcome)].append((sites.path(s), lost))
print(f'{grammar}: baseline ' + ', '.join(f'{k}={base[k]}' for k in ['read-render-parsePass', 'factory-render-parsePass', 'ir-render-parsePass']))
print(f'sites with a result: {sum(table.values())}; without: {missing}')
for k in [FREE, SOME, EVERY]:
    print(f'  {k:36s} forced line break: no count changes {table[(k, "no count changes")]:4d}   a count changes {table[(k, "a count changes")]:4d}')
if '--list' in sys.argv:
    for key in [(FREE, 'a count changes'), (EVERY, 'no count changes'), (SOME, 'no count changes'), (SOME, 'a count changes'), (EVERY, 'a count changes')]:
        print(f'\n== {key[0]}; {key[1]}')
        for path, lost in sorted(detail[key]):
            print(f'  {path:70s} ' + ', '.join(f'{k} -{v}' for k, v in lost.items()))
