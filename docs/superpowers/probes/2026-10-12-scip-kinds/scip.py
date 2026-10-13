"""SCIP's symbol kinds against the ruled vocabulary: python3 -I scip.py <ruled-kinds.txt> <scip-kinds.json> <out-dir>

coverage.txt  each SCIP kind and how the vocabulary holds it; each declaration kind and the SCIP kinds that
              reach it, itself or through a kind above it; and every mapped path the ruled vocabulary lacks
"""
import collections, json, os, sys

ruled_path, scip_path, out = sys.argv[1:4]
ruled = {line.split()[0] for line in open(ruled_path).read().splitlines()[1:] if line.strip()}
scip = json.load(open(scip_path))['kinds']
HOLDS = ('kind', 'family', 'flag', 'owner')
os.makedirs(out, exist_ok=True)


def kind_of(path):
    return path.split('#', 1)[0]


reach = collections.defaultdict(list)
missing = []
for k in scip:
    for p in k['paths']:
        if kind_of(p) not in ruled:
            missing.append(f"{k['scip']}: {p}")
        if k['how'] in HOLDS:
            reach[kind_of(p)].append(k['scip'] + ('' if '#' not in p else f" (#{p.split('#', 1)[1]})"))


def reached(path):
    """The SCIP kinds that reach a kind: its own, else its nearest ancestor's below the level."""
    parts = path.split('.')
    for i in range(len(parts), 1, -1):
        hit = reach.get('.'.join(parts[:i]))
        if hit:
            return hit, '.'.join(parts[:i])
    return [], None


by_how = collections.Counter(k['how'] for k in scip)
declarations = sorted(p for p in ruled if p.startswith('declaration.'))
covered = {p: reached(p) for p in declarations}
with open(os.path.join(out, 'coverage.txt'), 'w') as f:
    print(f"{len(scip)} SCIP kinds: " + ', '.join(f'{n} {h}' for h, n in by_how.most_common()), file=f)
    print('kind: one vocabulary kind; family: one of SCIP\'s analogous kinds, which the vocabulary holds as one kind; '
          'flag: a kind with a flag set; owner: a kind under an owner kind; name: the same word for a different fact; '
          'none: a fact no vocabulary kind holds', file=f)
    for how in ('kind', 'family', 'flag', 'owner', 'name', 'none'):
        rows = [k for k in scip if k['how'] == how]
        print(f'\n== {how} ({len(rows)})', file=f)
        for k in rows:
            target = ', '.join(k['paths']) or '-'
            note = f"  ({k['note']})" if k['note'] else ''
            print(f"  {k['scip']:20} {target}{note}", file=f)
    hits = [p for p in declarations if covered[p][0]]
    print(f'\n== declaration kinds: {len(hits)} of {len(declarations)} reached by a SCIP kind', file=f)
    for p in declarations:
        kinds, via = covered[p]
        where = '' if via in (None, p) else f' through {via}'
        print(f"  {p:48} {', '.join(kinds) or '(none)'}{where}", file=f)
    print(f'\n== mapped paths the ruled vocabulary lacks ({len(missing)})', file=f)
    for m in missing:
        print(f'  {m}', file=f)
print(f"{len(scip)} SCIP kinds ({', '.join(f'{n} {h}' for h, n in by_how.most_common())}); "
      f"{len(hits)} of {len(declarations)} declaration kinds reached; {len(missing)} mapped paths missing")
