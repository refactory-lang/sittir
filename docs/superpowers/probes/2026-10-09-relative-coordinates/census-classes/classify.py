import json, sys, difflib, re
from collections import Counter, defaultdict
d = json.load(open(sys.argv[1]))
COMMENT = {'rust': ('//', '/*', '*/'), 'typescript': ('//', '/*', '*/'), 'python': ('#',), 'scm': (';',), 'regex': ()}
def is_comment(g, line):
    s = line.strip()
    return bool(s) and any(s.startswith(p) or s.endswith(p) for p in COMMENT[g] if p != '*/') or (s.endswith('*/') and '*/' in COMMENT[g])
def has_comment(g, line):
    return any(p in line for p in COMMENT[g])
bare = lambda t: re.sub(r'\s+', '', t)
def classify(g, a, b):
    A, B = a.split('\n'), b.split('\n')
    classes = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
        if op == 'equal': continue
        la, lb = A[i1:i2], B[j1:j2]
        prev = A[i1 - 1] if i1 > 0 else ''
        nxt = A[i2] if i2 < len(A) else ''
        if bare(''.join(la)) != bare(''.join(lb)):
            classes.append(('iv', la, lb)); continue
        if op == 'replace' and len(la) == len(lb):
            for x, y in zip(la, lb):
                if x == y: continue
                ix, iy = len(x) - len(x.lstrip()), len(y) - len(y.lstrip())
                if x.strip() == y.strip() or (ix != iy and re.sub(r'\s', '', x) == re.sub(r'\s', '', y) and x.lstrip().replace(' ', '') == y.lstrip().replace(' ', '') and x.strip().split() == y.strip().split()):
                    classes.append(('ii-indent', [x], [y]))
                else:
                    classes.append(('i', [x], [y]))
            continue
        # line structure differs: blank lines inserted/removed, or lines split/joined
        involved = la + lb
        if any(is_comment(g, l) or has_comment(g, l) for l in involved) or (op in ('insert', 'delete') and (is_comment(g, prev) or is_comment(g, nxt))):
            classes.append(('iii', la, lb))
        else:
            classes.append(('ii-break', la, lb))
    return classes
per = defaultdict(Counter); first = defaultdict(Counter); ex = defaultdict(list)
for e in d:
    cs = classify(e['grammar'], e['live'], e['snapshot'])
    kinds = sorted({c[0] for c in cs})
    for k in kinds: per[e['grammar']][k] += 1
    first[e['grammar']][cs[0][0] if cs else 'none'] += 1
    for c in cs:
        key = (e['grammar'], c[0])
        if len(ex[key]) < 2 and all(x[0] != e['entry'] for x in ex[key]):
            ex[key].append((e['entry'], c[1][:3], c[2][:3]))
for g in ['rust', 'typescript', 'python', 'scm', 'regex']:
    print(g, 'entries with class:', dict(per[g]), '| first difference:', dict(first[g]))
print()
for (g, k), xs in sorted(ex.items()):
    for name, a, b in xs:
        print(f'{g:10} {k:9} {name[:45]:45} live={json.dumps(a)[:110]} snap={json.dumps(b)[:110]}')

print('\n--- refined: iv inside a whitespace-only entry is a misaligned line break (ii-break)')
per2 = defaultdict(Counter); dirn = Counter(); iex = []
for e in d:
    ws = bare(e['live']) == bare(e['snapshot'])
    cs = [(('ii-break' if c[0] == 'iv' and ws else c[0]),) + c[1:] for c in classify(e['grammar'], e['live'], e['snapshot'])]
    for k in sorted({c[0] for c in cs}): per2[e['grammar']][k] += 1
    if not ws: print('  text entry:', e['grammar'], e['entry'])
    for c in cs:
        if c[0] == 'i':
            for x, y in zip(c[1], c[2]):
                gx, gy = len(re.findall(r'\s', x.strip())), len(re.findall(r'\s', y.strip()))
                dirn['snapshot adds' if gy > gx else 'snapshot removes' if gy < gx else 'moves'] += 1
                if gy > gx and len(iex) < 8: iex.append((e['grammar'], x.strip()[:60], y.strip()[:60]))
only = defaultdict(Counter)
for e in d:
    ws = bare(e['live']) == bare(e['snapshot'])
    ks = {('ii-break' if c[0] == 'iv' and ws else c[0]) for c in classify(e['grammar'], e['live'], e['snapshot'])}
    ks = {'ii' if k.startswith('ii') else k for k in ks}
    only[e['grammar']]['+'.join(sorted(ks))] += 1
for g in ['rust', 'typescript', 'python', 'scm', 'regex']:
    print(g, dict(per2[g]))
    print('   entries by class set:', dict(only[g]))
print('in-line line pairs:', dict(dirn))
for x in iex: print('   adds:', x)

print('\n--- entries per class (an entry may hold several), and entries with only (i)')
for g in ['rust', 'typescript', 'python', 'scm', 'regex']:
    c = Counter(); n = 0; only_i = 0
    for e in d:
        if e['grammar'] != g: continue
        n += 1
        ws = bare(e['live']) == bare(e['snapshot'])
        ks = set()
        for x in classify(g, e['live'], e['snapshot']):
            k = x[0]
            if k == 'iv' and ws: k = 'ii-break'
            ks.add({'ii-break': 'ii', 'ii-indent': 'ii'}.get(k, k))
        for k in ks: c[k] += 1
        if ks == {'i'}: only_i += 1
    print(f'{g}: {n} entries; (i) {c["i"]}, (ii) {c["ii"]}, (iii) {c["iii"]}, (iv) {c["iv"]}; only (i): {only_i}')
