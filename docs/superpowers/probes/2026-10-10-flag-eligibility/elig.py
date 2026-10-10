"""Slot eligibility of flag pairs: python3 elig.py <grammar> <plain> <flagged> [...pairs].

For each pair, compares what each kind admits (its fields and children, by type, supertypes
expanded) and which (parent, field) slots admit it, from the bound grammar's node-types.json."""
import json, sys
g = sys.argv[1]
nt = json.load(open(f'packages/{g}/.sittir/src/node-types.json'))
sub = {n['type']: [s['type'] for s in n.get('subtypes', [])] for n in nt if n.get('subtypes')}
def expand(t, seen=None):
    seen = seen or set()
    if t in seen: return set()
    seen.add(t)
    out = {t}
    for s in sub.get(t, []):
        out |= expand(s, seen)
    return out
admits = {}
for n in nt:
    if not n.get('named'): continue
    slots = {}
    for f, spec in (n.get('fields') or {}).items():
        slots[f] = (frozenset(x['type'] for x in spec['types'] if x.get('named')), spec['required'], spec['multiple'])
    if n.get('children'):
        c = n['children']
        slots['*'] = (frozenset(x['type'] for x in c['types'] if x.get('named')), c['required'], c['multiple'])
    admits[n['type']] = slots
admitters = {}
for p, slots in admits.items():
    for f, (types, _, _) in slots.items():
        for t in types:
            for k in expand(t):
                admitters.setdefault(k, set()).add(f'{p}.{f}')
def show(a, b):
    print(f'## {a} -> {b}')
    sa, sb = admits.get(a, {}), admits.get(b, {})
    for f in sorted(set(sa) | set(sb)):
        if sa.get(f) != sb.get(f):
            fa = sa.get(f); fb = sb.get(f)
            def fmt(x):
                return 'absent' if x is None else f"{sorted(x[0])} req={x[1]} mult={x[2]}"
            print(f'  admits {f}: {fmt(fa)}  |  {fmt(fb)}')
    xa, xb = admitters.get(a, set()), admitters.get(b, set())
    only_a, only_b = sorted(xa - xb), sorted(xb - xa)
    if only_a: print(f'  admitted only as {a}: {only_a[:12]}{" …" if len(only_a)>12 else ""} ({len(only_a)})')
    if only_b: print(f'  admitted only as {b}: {only_b[:12]}{" …" if len(only_b)>12 else ""} ({len(only_b)})')
    if sa == sb and xa == xb: print('  same eligibility')
args = sys.argv[2:]
for i in range(0, len(args), 2):
    show(args[i], args[i+1])
