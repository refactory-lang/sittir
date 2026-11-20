import sys, json, runpy, collections
D, OUT_MD, OUT_TSV = sys.argv[1:4]
N = runpy.run_path(f'{D}/names.py')['N']
cells = json.load(open(f'{D}/t-cells.json'))
PARENT = {'Structs': 'StructPatterns'}
FAMS = [('C-family OO', 'c'), ('C-procedural', 'c'), ('Swift', 's')]
def holders(sig): return ' '.join(g for g in sig[:3] if g != '-')
def family(sig):
    if '/' not in sig: return ''
    f = sig.split('/')[1]
    held = [FAMS[i][0] for i, ch in enumerate(f) if ch != '-']
    return ', '.join(held) if held else 'none of the six'
def item(x):
    p, _, m = x.partition(':')
    return f'`{p}`' if not m else f'`{p}:{m}`'
rows = []
for c in cells:
    name, extra, summary = N[(c['area'], c['sig'])]
    core = c['area'].startswith('core:')
    parent = None if core else PARENT.get(c['area'], c['area'])
    if name == parent: parent = 'StructPatterns'
    ext = ([parent] if parent else []) + extra
    content = (summary + f' ({c["n"]} rows)') if summary else ', '.join(item(x) for x in c['items'])
    rows.append(dict(name=name, area=c['area'], core=core, parent=parent, ext=ext, hold=holders(c['sig']), fam=family(c['sig']), content=content, items=c['items'], sig=c['sig']))
md = []
def table(rs):
    md.append('| Feature | Holders | Cut for | Extends | Content |')
    md.append('|---|---|---|---|---|')
    for r in rs:
        md.append(f"| `{r['name']}` | {r['hold']} | {r['fam']} | {', '.join(r['ext']) or '—'} | {r['content']} |")
subs = [r for r in rows if not r['core']]
cores = [r for r in rows if r['core']]
md.append(f'### Sub-features of today\'s features ({len(subs)})')
md.append('')
table(sorted(subs, key=lambda r: (r['parent'], r['name'])))
md.append('')
md.append(f'### Core features ({len(cores)})')
md.append('')
table(sorted(cores, key=lambda r: (r['area'], r['name'])))
md.append('')
md.append('### Each grammar\'s held set')
md.append('')
for g, full in (('p', 'python'), ('r', 'rust'), ('t', 'typescript')):
    hs = sorted(r['name'] for r in rows if g in r['hold'].split())
    md.append(f'- **{full}** ({len(hs)}): ' + ', '.join(hs) + '.')
open(OUT_MD, 'w').write('\n'.join(md) + '\n')
with open(OUT_TSV, 'w') as f:
    f.write('feature\tholders\textends\tpath\tmember\n')
    for r in sorted(rows, key=lambda r: r['name']):
        for x in r['items']:
            p, _, m = x.partition(':')
            f.write(f"{r['name']}\t{r['hold'].replace(' ', '')}\t{','.join(r['ext'])}\t{p}\t{m}\n")
print(len(rows), len(subs), len(cores), {g: sum(g in r['hold'].split() for r in rows) for g in 'prt'})
