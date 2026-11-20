import json, re, sys, collections
sys.path.insert(0, sys.argv[1])
from paper_rules import LANGS, KINDS, MEMBERS, LEVELS
S = sys.argv[1]
rows = json.load(open(f'{S}/rows.json'))
meas = {}
for g in ['go', 'c']:
    t = open(f'{S}/measure-{g}.json').read(); meas.update(json.loads(t[t.find('@@') + 2:]))
LV = ('private', 'public', 'protected', 'internal', 'parent', 'restricted')
def under(p, at): return p == at or p.startswith(at + '.')
def prefix_rule(table, path):
    parts = path.split('.')
    for i in range(len(parts), 0, -1):
        k = '.'.join(parts[:i])
        if k in table: return table[k]
    return 'HHHHHH'
def split_vis(path):
    parts = path.split('.')
    base = [x for x in parts if x not in LV]; lv = [x for x in parts if x in LV]
    return '.'.join(base), '.'.join(lv)
def kind_paper(path):
    base, lv = split_vis(path)
    if not lv: return prefix_rule(KINDS, path)
    b = prefix_rule(KINDS, base); l = LEVELS[lv]
    return ''.join('H' if x == 'H' and y == 'H' else ('L' if 'L' in (x, y) else 'D') for x, y in zip(b, l))
def member_paper(path, m):
    k = f'{path}.{m}'
    r = MEMBERS.get(k) or MEMBERS.get(f'*.{m}') or 'HHHHHH'
    kp = kind_paper(path)
    return ''.join('H' if x == 'H' and y == 'H' else ('L' if 'L' in (x, y) else 'D') for x, y in zip(kp, r))
COLS = ['p', 'r', 't', 'go', 'java', 'csharp', 'c', 'swift', 'cpp']
out = []
agree = collections.Counter()
for row in rows:
    paper = kind_paper(row['path']) if row['t'] == 'K' else member_paper(row['path'], row['member'])
    pv = dict(zip(LANGS, paper))
    cells = {}
    for g in 'prt': cells[g] = 'H' if g in row['held'] else 'L'
    for g in ['go', 'c']:
        mk = meas[g]['kinds']
        if row['t'] == 'K': h = any(under(k, row['path']) for k in mk)
        else: h = any(under(x.rsplit('.', 1)[0], row['path']) and x.rsplit('.', 1)[1] == row['member'] for x in meas[g]['members'])
        cells[g] = 'H' if h else ('D' if pv[g] == 'D' else 'L')
        agree[(g, pv[g] == 'H', h)] += 1
    for g in ['java', 'csharp', 'swift', 'cpp']: cells[g] = pv[g]
    out.append({**row, 'cells': ''.join(cells[c] for c in COLS)})
json.dump(out, open(f'{S}/matrix.json', 'w'))
print('rows', len(out))
for g in ['go', 'c']:
    tp = agree[(g, True, True)]; fp = agree[(g, True, False)]; fn = agree[(g, False, True)]; tn = agree[(g, False, False)]
    print(f'{g}: paper H & measured H {tp}, paper H only {fp}, measured H only {fn}, both not {tn}')
