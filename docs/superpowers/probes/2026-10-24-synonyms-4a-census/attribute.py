import json, re, sys, collections
root, census, proposal, out = sys.argv[1:5]
c = json.load(open(census)); p = json.load(open(proposal))
levels, excluded = p['levels'], set(p['excluded'])
WORD = re.compile(r'^[a-z][a-z0-9_]*$')
spelled = {}
for g in ('python', 'rust', 'typescript'):
    gj = json.load(open(f'{root}/packages/{g}/.sittir/src/grammar.json'))
    toks, kinds = set(), set(gj['rules'].keys())
    def walk(r):
        if isinstance(r, dict):
            if r.get('type') == 'STRING' and WORD.match(r.get('value', '')): toks.add(r['value'])
            if r.get('type') == 'ALIAS' and r.get('named') and isinstance(r.get('value'), str): kinds.add(r['value'])
            for v in r.values(): walk(v)
        elif isinstance(r, list):
            for v in r: walk(v)
    walk(gj['rules'])
    for nt in json.load(open(f'{root}/packages/{g}/.sittir/src/node-types.json')):
        kinds.add(nt['type'])
    parts = {w for k in kinds for w in k.strip('_').split('_') if w}
    spelled[g] = (toks, parts)
rows = collections.defaultdict(list)
for cl in c['claims']:
    g = cl['grammar']; toks, parts = spelled[g]
    line_words = set(re.findall(r'[a-z][a-z0-9]*', cl['text'].split(';')[0]))
    line_kinds = {w for k in re.findall(r'\(([a-z_][a-z0-9_]*)', cl['text']) for w in k.strip('_').split('_')}
    line_strings = set(re.findall(r'"([a-z][a-z0-9_]*)"', cl['text']))
    for path in cl['paths']:
        segs = path.split('.'); level = segs[0]
        table = levels.get(level, {})
        for i, s in enumerate(segs[1:], 1):
            for syn in table.get(s, []):
                if syn in excluded: continue
                strong = syn in line_kinds or syn in line_strings
                weak = syn in toks or syn in parts
                if strong or weak:
                    rows[(g, path, i, s, syn, 'claim line' if strong else 'grammar')].append(cl['line'])
with open(out, 'w') as f:
    for g in ('python', 'rust', 'typescript'):
        print(f'== {g}', file=f)
        for (gg, path, i, s, syn, where), lines in sorted(rows.items()):
            if gg != g: continue
            segs = path.split('.'); segs[i] = syn
            print(f'  {path:48} -> {".".join(segs):44} [{s}: {syn}; {where}] lines {",".join(map(str, sorted(set(lines))))}', file=f)
print(sum(len(v) for v in rows.values()), 'claim-segment hits;', len(rows), 'rows')
