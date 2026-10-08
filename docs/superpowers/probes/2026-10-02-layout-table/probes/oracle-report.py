#!/usr/bin/env python3
"""Measures: per spacing site, whether a line-sensitive token could be read at
  the gaps where the site's mark met, from the seam oracle's records. A gap is
  line-sensitive when one of the grammar's line tokens is valid in a parse
  state in which the token after the gap was lexed.
Run:    python3 oracle-report.py <checkout-root> <grammar> <records.jsonl> <token,...|-|none> [flags]
        <checkout-root> is the checkout the records were made in (site ids are
        its numbering); `-` takes the tokens from line-tokens.json.
        --list         name the sites whose inline gaps saw a token
        --depth        split inline gaps by lexical bracket depth
        --lists        one line per list kind in the list table
        --all-renders  count fragment renders too, not only root renders
Prints: gap, render and site totals; sites by class (token never / sometimes /
  always valid at an inline gap, or only seen holding a line break) and by
  whether their default arm is a line break; with --depth the inline gaps
  inside and outside brackets; then separated lists of two or more items by
  where they sit (at brackets, inside, outside) and whether their head,
  separator and tail gaps are free.
Only root renders that reparse without error are counted unless --all-renders.
"""
import collections, sys
from oracle_lib import Sites, line_tokens, records

root, grammar, path = sys.argv[1], sys.argv[2], sys.argv[3]
ls = set(line_tokens(grammar, 'runtime', sys.argv[4]))
flags = set(sys.argv[5:])
sites = Sites(root, grammar)

rows = list(records(path, all_renders='--all-renders' in flags))
print(f'{grammar}: {len(rows)} gaps in {len({r["r"] for r in rows})} renders; line-sensitive tokens {sorted(ls)}')

# per site: observations by (gap holds a line break, a line-sensitive token is valid)
stat = collections.defaultdict(collections.Counter)
for r in rows:
    sens = bool(ls & set(r['any']))
    line = '\n' in r['ws']
    for s in set(r['sites']):
        stat[s][(line, sens)] += 1

print(f'sites observed: {len(stat)} of {len(sites)}')
cls = collections.Counter()
detail = collections.defaultdict(list)
for s, c in stat.items():
    inline_free = c[(False, False)]
    inline_sens = c[(False, True)]
    line_free = c[(True, False)]
    line_sens = c[(True, True)]
    default_line = sites.is_line(sites.specs[s][0])
    if inline_sens and not inline_free:
        k = 'inline gap, token valid in every occurrence'
    elif inline_sens and inline_free:
        k = 'inline gap, token valid in some occurrences'
    elif inline_free:
        k = 'inline gap, token never valid'
    else:
        k = 'only seen holding a line break'
    cls[(k, 'default is a line break' if default_line else 'default is inline')] += 1
    detail[k].append((s, inline_free, inline_sens, line_free, line_sens, default_line))
for (k, d), n in sorted(cls.items()):
    print(f'  {n:5d}  {k}; {d}')

name = sites.name

if '--list' in flags:
    for k in ['inline gap, token valid in every occurrence', 'inline gap, token valid in some occurrences']:
        print(f'\n== {k}')
        for s, a, b, c, d, dl in sorted(detail[k], key=lambda t: name(t[0])):
            print(f'  {name(s):70s} inline free {a:4d}  inline sensitive {b:4d}  line free {c:4d}  line sensitive {d:4d}{"  DEFAULT LINE" if dl else ""}')

# by lexical bracket depth: inline gaps only
if '--depth' in flags:
    gaps = collections.Counter()
    by_site = collections.defaultdict(collections.Counter)
    for r in rows:
        if '\n' in r['ws']:
            continue
        sens = bool(ls & set(r['any']))
        inside = r.get('depth', 0) > 0
        gaps[(inside, sens)] += 1
        for s in set(r['sites']):
            by_site[s][(inside, sens)] += 1
    print('\ninline gaps by lexical bracket depth:')
    for inside in (True, False):
        for sens in (False, True):
            print(f'  {"inside brackets" if inside else "outside brackets":17s} {"token valid" if sens else "no token valid":15s} {gaps[(inside, sens)]:6d}')
    lax = [(s, c) for s, c in by_site.items() if c[(False, False)]]
    strict_in = [(s, c) for s, c in by_site.items() if c[(True, True)]]
    print(f'sites seen outside brackets with no token valid: {len(lax)}')
    print(f'sites seen inside brackets with a token valid: {len(strict_in)}')
    if '--list' in flags:
        print('\n== outside brackets, no token valid (inline gaps)')
        for s, c in sorted(lax, key=lambda t: name(t[0])):
            print(f'  {name(s):70s} outside free {c[(False, False)]:4d}  outside sensitive {c[(False, True)]:4d}  inside free {c[(True, False)]:4d}  inside sensitive {c[(True, True)]:4d}')
        print('\n== inside brackets, token valid (inline gaps)')
        for s, c in sorted(strict_in, key=lambda t: name(t[0])):
            print(f'  {name(s):70s} outside free {c[(False, False)]:4d}  outside sensitive {c[(False, True)]:4d}  inside free {c[(True, False)]:4d}  inside sensitive {c[(True, True)]:4d}')

# separated lists: roles are 1 head, 2 before a separator, 3 after a separator, 4 tail
lists = collections.defaultdict(lambda: {'sep': False, 'gaps': []})
for r in rows:
    for role, lid, sep in r['roles']:
        e = lists[(r['r'], lid)]
        e['sep'] = sep
        e['gaps'].append((role, r))
by_kind = collections.defaultdict(collections.Counter)
for (rid, lid), e in lists.items():
    if not e['sep']:
        continue
    head = next((g for role, g in e['gaps'] if role == 1), None)
    tail = next((g for role, g in e['gaps'] if role == 4), None)
    afters = [g for role, g in e['gaps'] if role == 3]
    if head is None or tail is None or not afters:
        continue
    bracketed = bool(head['flags'] & 1) and bool(tail['flags'] & 2)
    kind = afters[0]['lca'] or '?'
    inside = min(g.get('depth', 0) for g in afters) > 0

    def sens(g):
        return bool(ls & set(g['any']))

    key = (
        'at brackets' if bracketed else ('inside brackets' if inside else 'outside brackets'),
        'head ' + ('sensitive' if sens(head) else 'free'),
        'after-separator ' + ('sensitive' if any(sens(g) for g in afters) else 'free'),
        'tail ' + ('sensitive' if sens(tail) else 'free'),
    )
    by_kind[kind][key] += 1
print('\nlists with two or more items and a separator, by the kind that holds the separators:')
tot = collections.Counter()
for kind in sorted(by_kind):
    for key, n in sorted(by_kind[kind].items()):
        tot[key] += n
        if '--lists' in flags:
            print(f'  {kind:40s} {n:5d}  ' + '; '.join(key))
print('totals:')
for key, n in sorted(tot.items()):
    print(f'  {n:6d}  ' + '; '.join(key))
