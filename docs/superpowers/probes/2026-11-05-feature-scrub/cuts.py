import json, sys, collections
S = sys.argv[1]
m = json.load(open(f'{S}/matrix.json'))
COLS = ['p', 'r', 't', 'go', 'java', 'csharp', 'c', 'swift', 'cpp']
PAPER6 = COLS[3:]
def group(p):
    ns = p.split('.')[0]
    if p.startswith(('expression.binary', 'expression.unary', 'expression.assignment', 'expression.update')) or p.startswith('element.comparator'): return 'operators'
    if ns == 'literal': return 'literals'
    if ns in ('declaration', 'modifier', 'argument', 'attribute', 'pattern'): return 'declarations'
    if ns == 'comment': return 'comments'
    if ns in ('statement', 'clause'): return 'statements'
    return 'expressions'
for r in m:
    r['area'] = r['feature'] or 'core:' + group(r['path'])
    r['v'] = {c: r['cells'][i] == 'H' for i, c in enumerate(COLS)}
composers = collections.defaultdict(set)
for r in m:
    for g in 'prt':
        if r['v'][g]: composers[r['area']].add(g)
def sig(r, cols): return ''.join(c[0] if r['v'][c] else '-' for c in cols)
def cut(cols, merge=None):
    cells = collections.defaultdict(list)
    for r in m:
        key = (r['area'], sig(r, cols) if merge is None else merge(r))
        cells[key].append(r)
    return cells
def is_parent(key):
    area, s = key
    full = ''.join(g if g in composers[area] else '-' for g in 'prt')
    return s[:3] == full and all(ch != '-' for ch in s[3:]) if len(s) > 3 else s == full
def new_features(cells): return sum(1 for k in cells if not is_parent(k))
def splits(cells, g):
    n = 0
    for k, items in cells.items():
        h = sum(r['v'][g] for r in items)
        if 0 < h < len(items): n += 1
    return n
def held(cells, g):
    return sum(1 for k, items in cells.items() if not is_parent(k) and all(r['v'][g] for r in items))
res = {}
A = cut(['p', 'r', 't'])
res['A'] = {'features': new_features(A), 'splits': {g: splits(A, g) for g in PAPER6}, 'held': {g: held(A, g) for g in 'prt'}}
B = cut(COLS)
res['B'] = {'features': new_features(B), 'held': {g: held(B, g) for g in 'prt'}}
loo = {}
for g in PAPER6:
    cols = [c for c in COLS if c != g]
    loo[g] = splits(cut(cols), g)
res['B']['leave_one_out_splits'] = loo
FAM = {'cproc': ['c', 'go'], 'coo': ['java', 'csharp', 'cpp'], 'swift': ['swift']}
def fam_sig(r):
    s = sig(r, ['p', 'r', 't'])
    for f, langs in FAM.items():
        hs = [r['v'][x] for x in langs]
        s += f[0] if sum(hs) * 2 >= len(hs) else '-'
    return s
C = cut(None, fam_sig)
famfeat = sum(1 for (a, s) in C if not (s[:3] == ''.join(g if g in composers[a] else '-' for g in 'prt') and '-' not in s[3:]))
res['C'] = {'features': famfeat, 'splits': {g: splits(C, g) for g in PAPER6}, 'held': {g: sum(1 for (a, s), items in C.items() if all(r['v'][g] for r in items)) for g in 'prt'}}
print(json.dumps(res, indent=1))
print('--- split sources under A')
for g in PAPER6:
    par = [k for k, it in A.items() if is_parent(k) and 0 < sum(r['v'][g] for r in it) < len(it)]
    sub = [k for k, it in A.items() if not is_parent(k) and 0 < sum(r['v'][g] for r in it) < len(it)]
    print(g, 'parent/core cells', len(par), 'sub cells', len(sub))
print('A cells total', len(A), 'parent cells', sum(1 for k in A if is_parent(k)))
def famsplit(r):
    s = sig(r, ['p', 'r', 't'])
    full = ''.join(g if g in composers[r['area']] else '-' for g in 'prt')
    if s == full: return s
    for f, langs in FAM.items():
        hs = [r['v'][x] for x in langs]; s += f[0] if sum(hs) * 2 >= len(hs) else '-'
    return s
D = cut(None, famsplit)
dfeat = sum(1 for k in D if not is_parent((k[0], k[1][:3])) or len(k[1]) > 3)
print('D features', dfeat, 'splits', {g: splits(D, g) for g in PAPER6}, 'held', {g: sum(1 for (a, s), it in D.items() if len(s) > 3 and all(r['v'][g] for r in it)) for g in 'prt'})
for g in PAPER6:
    sub = [k for k, it in D.items() if len(k[1]) > 3 and 0 < sum(r['v'][g] for r in it) < len(it)]
    print(' D', g, 'sub-cell splits', len(sub))
print('--- variants (family split on sub-feature cells only)')
def variant(fams, minsize=0):
    base = collections.defaultdict(list)
    for r in m: base[(r['area'], sig(r, ['p','r','t']))].append(r)
    def key(r):
        s = sig(r, ['p','r','t'])
        full = ''.join(g if g in composers[r['area']] else '-' for g in 'prt')
        if s == full or len(base[(r['area'], s)]) < minsize: return s
        for f in fams:
            hs = [r['v'][x] for x in FAM[f]]; s += f[0] if sum(hs) * 2 >= len(hs) else '-'
        return s
    cells = cut(None, key)
    feats = sum(1 for (a, s) in cells if s[:3] != ''.join(g if g in composers[a] else '-' for g in 'prt'))
    sub = {g: sum(1 for (a, s), it in cells.items() if s[:3] != ''.join(x if x in composers[a] else '-' for x in 'prt') and 0 < sum(r['v'][g] for r in it) < len(it)) for g in PAPER6}
    return feats, sub
for fams, ms in [(['coo'],0),(['cproc'],0),(['coo','cproc'],0),(['coo','cproc','swift'],0),(['coo','cproc','swift'],4),(['coo','cproc','swift'],8),(['coo','cproc'],4)]:
    f, sub = variant(fams, ms)
    print(fams, 'minsize', ms, 'features', f, 'sub-cell splits', sub, 'total', sum(sub.values()))
print('--- targeted family splits')
fams = ['coo', 'cproc', 'swift']
def fsig(r):
    return ''.join(f[0] if sum(r['v'][x] for x in FAM[f]) * 2 >= len(FAM[f]) else '-' for f in fams)
chosen = []; tot_add = 0; tot_save = 0
for (a, s), it in A.items():
    if is_parent((a, s)): continue
    before = sum(1 for g in PAPER6 if 0 < sum(r['v'][g] for r in it) < len(it))
    parts = collections.defaultdict(list)
    for r in it: parts[fsig(r)].append(r)
    after = sum(1 for g in PAPER6 for p in parts.values() if 0 < sum(r['v'][g] for r in p) < len(p))
    add = len(parts) - 1
    if add > 0 and before - after >= 2 * add:
        chosen.append((a, s, add, before - after, len(it))); tot_add += add; tot_save += before - after
print('cells split', len(chosen), 'features added', tot_add, 'splits saved', tot_save, '-> features', new_features(A) + tot_add, 'sub-cell splits', 149 - tot_save)
for c in sorted(chosen, key=lambda x: -x[3])[:25]: print('  ', c)
print('--- targeted cut detail')
chosen_keys = {(a, s) for a, s, *_ in chosen}
T = collections.defaultdict(list)
for r in m:
    s = sig(r, ['p','r','t']); k = (r['area'], s)
    T[(r['area'], s + ('/' + fsig(r) if k in chosen_keys else ''))].append(r)
def tparent(k):
    a, s = k; return s[:3] == ''.join(g if g in composers[a] else '-' for g in 'prt') and '/' not in s
tfeat = sum(1 for k in T if not tparent(k))
print('features', tfeat)
print('held', {g: sum(1 for k, it in T.items() if not tparent(k) and all(r['v'][g] for r in it)) for g in 'prt'})
for name, cells in [('A', A), ('T', T)]:
    sp = {g: splits(cells, g) for g in PAPER6}
    spsub = {g: sum(1 for k, it in cells.items() if not (is_parent(k) if name=='A' else tparent(k)) and 0 < sum(r['v'][g] for r in it) < len(it)) for g in PAPER6}
    print(name, 'all splits', sp, 'sub-cell', spsub)
print('H rows per language', {c: sum(r['v'][c] for r in m) for c in COLS})
print('examples:')
for (a, s), it in sorted(T.items()):
    if (a, s.split('/')[0]) in chosen_keys:
        print('  ', a, s, ' '.join((r['path'] + ('' if r['t']=='K' else '.'+r['member'])) for r in it)[:230])
