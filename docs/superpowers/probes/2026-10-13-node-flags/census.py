"""Census of vocabulary flag members per grammar kind, read from the generated models.

Run from the repo root: python3 docs/superpowers/probes/2026-10-13-node-flags/census.py
For each (grammar kind, flag) it prints the member route, the depth of its path, the
anchors on that path, and what the last slot holds, which decides the leaf a flag
lowers to: `present` (the slot holds only the keyword), `eq` (one keyword among
others) or `is` (a captured node kind).
"""
import json
import re
from collections import Counter

GRAMMARS = ('rust', 'typescript', 'python')

flags_ts = open('packages/types/src/vocabulary/flags.ts').read()
FLAGS = {name[0].lower() + name[1:] for name in re.findall(r'^\t(\w+) = 1 << \d+', flags_ts, re.M)}


def slot_of(nodes, owner, name):
    node = nodes.get(owner)
    return None if node is None else next((s for s in node['slots'] if s['name'] == name), None)


def leaf_of(member, slot):
    if member['route'] in ('kind', 'nested'):
        return 'is'
    if slot is None:
        return 'no slot'
    terminals = [v for v in slot.get('values', []) if v['kind'] == 'terminal']
    nodes = [v for v in slot.get('values', []) if v['kind'] != 'terminal'] or slot.get('kinds', [])
    return 'present' if len(terminals) == 1 and not nodes else 'eq'


rows = []
for grammar in GRAMMARS:
    portable = json.load(open(f'packages/{grammar}/src/node-model-portable.json5'))['kinds']
    model = json.load(open(f'packages/{grammar}/src/node-model.json5'))['nodes']
    nodes = model if isinstance(model, dict) else {n['kind']: n for n in model}
    for kind, entry in portable.items():
        by_flag = {}
        for member in entry.get('members', []):
            if member['name'] in FLAGS:
                by_flag.setdefault(member['name'], []).append(member)
        for flag, members in sorted(by_flag.items()):
            for member in members:
                path = member.get('path') or []
                last = path[-1] if path else None
                slot = None if last is None else slot_of(nodes, last['owner'], last['slot'])
                rows.append({
                    'grammar': grammar,
                    'kind': kind,
                    'flag': flag,
                    'route': member['route'],
                    'alternatives': len(members),
                    'depth': len(path),
                    'anchors': [s['anchor'] for s in path if s.get('anchor')],
                    'leaf': leaf_of(member, slot) if path else 'no path',
                })

print(f'{len(rows)} flag members over {len({(r["grammar"], r["kind"]) for r in rows})} kinds')
for key in ('route', 'depth', 'leaf', 'alternatives'):
    print(key, dict(sorted(Counter((r['grammar'], r[key]) for r in rows).items())))
print('anchored', [(r['grammar'], r['kind'], r['flag'], r['anchors']) for r in rows if r['anchors']])
print('no path', [(r['grammar'], r['kind'], r['flag']) for r in rows if r['leaf'] in ('no path', 'no slot')])
print('alternatives > 1', sorted({(r['grammar'], r['kind'], r['flag']) for r in rows if r['alternatives'] > 1}))
print()
print('| grammar | kind | flag | route | depth | anchors | leaf |')
print('|---|---|---|---|---:|---|---|')
for r in rows:
    print(f"| {r['grammar']} | {r['kind']} | {r['flag']} | {r['route']} | {r['depth']} | {' '.join(r['anchors']) or '—'} | {r['leaf']} |")
