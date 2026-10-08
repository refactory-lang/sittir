#!/usr/bin/env python3
"""Makes: the site sets for the all-at-once run (forced-all.sh), from the
  one-site-at-a-time results: every site whose forced line break moved no
  validator count, and the subset of those that the oracle saw free (no
  line-sensitive token valid at any inline gap).
Run:    python3 forced-sets.py <grammar> <records.jsonl> <forced-dir> <token,...|-|none> <out-prefix>
Writes: <out-prefix>-unchanged.txt and <out-prefix>-free-unchanged.txt, one
  site id per line.
Prints: the size of each set.
"""
import os, sys
from oracle_lib import counts, inline_observations, line_tokens

grammar, records, forced, prefix = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[5]
observed = inline_observations(records, line_tokens(grammar, 'runtime', sys.argv[4]))
base = counts(os.path.join(forced, 'baseline.txt'))
assert base is not None, 'baseline.txt has no counts'
unchanged = [site for site in sorted(observed) if counts(os.path.join(forced, f'{site}.txt')) == base]
free = [site for site in unchanged if not observed[site][True]]
for name, sites in (('unchanged', unchanged), ('free-unchanged', free)):
    with open(f'{prefix}-{name}.txt', 'w') as f:
        f.write('\n'.join(map(str, sites)) + '\n')
print(f'{grammar}: individually unchanged: {len(unchanged)}; of them free by the state condition: {len(free)}')
