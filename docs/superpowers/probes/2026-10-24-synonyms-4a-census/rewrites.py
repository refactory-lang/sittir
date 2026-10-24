import json, re, sys, collections
census, proposal, out = sys.argv[1:4]
c = json.load(open(census)); p = json.load(open(proposal))
levels, excluded = p['levels'], set(p['excluded'])
per = collections.defaultdict(list)
for cl in c['claims']:
    g = cl['grammar']
    line_kinds = {w for k in re.findall(r'\(([a-z_][a-z0-9_]*)', cl['text']) for w in k.strip('_').split('_')}
    line_strings = set(re.findall(r'"([a-z][a-z0-9_]*)"', cl['text']))
    spelled = line_kinds | line_strings
    for path in cl['paths']:
        segs = path.split('.'); table = levels.get(segs[0], {}); new = list(segs)
        for i, s in enumerate(segs[1:], 1):
            hits = [w for w in table.get(s, []) if w not in excluded and w in spelled]
            if len(hits) > 1: print('AMBIGUOUS', g, cl['line'], path, s, hits)
            if hits: new[i] = hits[0]
        if new != segs: per[g].append((cl['line'], path, '.'.join(new)))
with open(out, 'w') as f:
    for g in ('python', 'rust', 'typescript'):
        rows = per[g]; lines = sorted({l for l, _, _ in rows})
        print(f'== {g}: {len(lines)} claim lines, {len({(a,b) for _, a, b in rows})} distinct paths', file=f)
        for old, new in sorted({(a, b) for _, a, b in rows}):
            ls = sorted({l for l, a, b in rows if a == old})
            print(f'  {old:48} -> {new:44} lines {",".join(map(str, ls))}', file=f)
