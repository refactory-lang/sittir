"""Reports over a vocabulary census: python3 -I report.py <root> <census.json> <proposal.json> <out-dir>

features.txt     each feature: the languages composing it, and the kinds, members and flags it owns
kinds.txt        every kind but the owner x level refinements: owner, claims per grammar, members, flags
identifiers.txt  each grammar's identifier-like kinds, the paths that claim them, and the words it
                 aliases to an identifier kind (reserved-word relaxations)
collisions.txt   the proposal's renames applied to the kinds, then each synonym checked against the
                 collision rule at every position its canonical segment has
"""
import collections, json, os, re, sys

root, census_path, proposal_path, out = sys.argv[1:5]
V = os.path.join(root, 'packages/types/src/vocabulary')
GRAMMARS = ('python', 'rust', 'typescript')
census = json.load(open(census_path))
K, C = census['kinds'], census['claims']
proposal = json.load(open(proposal_path))
os.makedirs(out, exist_ok=True)
LEVEL = re.compile(r'\.(public|private|protected)(\.|$)')


def owner_level(path):
    return LEVEL.search(path) and not path.startswith('modifier.visibility')


claimed = collections.defaultdict(lambda: collections.defaultdict(set))
for c in C:
    for p in c['paths']:
        claimed[p][c['grammar'][0]].add(c['node'] or '?')


def claims_of(path, width=70):
    return ' '.join(f"{g}:{','.join(sorted(n))[:width]}" for g, n in sorted(claimed.get(path, {}).items()))


# features.txt
features = {}
for dirpath, _, files in os.walk(os.path.join(V, 'features')):
    if 'index.ts' in files and dirpath != os.path.join(V, 'features'):
        text = open(os.path.join(dirpath, 'index.ts')).read()
        m = re.search(r"export interface (\w+)(?: extends ([\w, ]+))? \{\s*readonly '?([\w-]+)'?: true", text)
        doc = re.search(r'/\*\* (.*?) \*/', text, re.S)
        features[os.path.relpath(dirpath, os.path.join(V, 'features'))] = {
            'iface': m.group(1), 'parents': [p.strip() for p in (m.group(2) or '').split(',') if p.strip()],
            'doc': ' '.join(doc.group(1).split()) if doc else ''}
by_iface = {f['iface']: name for name, f in features.items()}
compositions = {m.group(1): [x.strip() for x in m.group(2).split(',') if x.strip()]
                for m in re.finditer(r'export interface (\w+)Features\s+extends\s+([\w,\s]+?)\s*\{\}', open(os.path.join(V, 'compositions.ts')).read())}


def closure(names, seen):
    for n in names:
        if n.endswith('Features'):
            closure(compositions[n[:-len('Features')]], seen)
        elif n not in seen:
            seen.add(n)
            if n in by_iface:
                closure(features[by_iface[n]]['parents'], seen)
    return seen


composed = {lang: closure(parents, set()) for lang, parents in compositions.items()}
with open(os.path.join(out, 'features.txt'), 'w') as f:
    print('feature [languages composing it: p python, t typescript, j javascript, r rust]', file=f)
    for name, info in sorted(features.items()):
        owner = 'feature:' + name
        langs = ''.join(l[0].lower() for l in ('Python', 'TypeScript', 'JavaScript', 'Rust') if info['iface'] in composed.get(l, ()))
        kinds = sorted(p for p, k in K.items() if k['owner'] == owner)
        levels = [p for p in kinds if owner_level(p)]
        members = sorted(f'{p}.{m}' for p, k in K.items() for m, o in k['members'].items() if o == owner and k['owner'] != owner)
        flags = sorted(f'{p}#{fl}' for p, k in K.items() for fl, o in k['flags'].items() if o == owner)
        print(f"\n## {name} [{langs}] {info['doc']}", file=f)
        for p in kinds:
            if p not in levels:
                print(f'   kind   {p:46} {claims_of(p)}', file=f)
        if levels:
            print(f'   + {len(levels)} owner x level refinements', file=f)
        for m in members:
            print(f'   member {m}', file=f)
        for fl in flags:
            print(f'   flag   {fl}', file=f)
        if not (kinds or members or flags):
            print('   (owns no kind, member or flag)', file=f)

# kinds.txt
with open(os.path.join(out, 'kinds.txt'), 'w') as f:
    print('path [owner] claims per grammar (p, r, t: grammar kinds) {members} #flags', file=f)
    for p in sorted(K):
        if owner_level(p):
            continue
        k = K[p]
        own = k['owner'].replace('feature:', 'f:').replace('base:', '').replace('.ts', '')
        fl = ','.join(k['flags'])
        print(f"{p:48} [{own}] {claims_of(p)}  {{{','.join(k['members'])}}}" + (f' #{fl}' if fl else ''), file=f)

# identifiers.txt
LIKE = re.compile(r'identifier|_name$|^(self|super|crate|this|metavariable|lifetime|label|primitive_type|predefined_type|dotted_name)$')
with open(os.path.join(out, 'identifiers.txt'), 'w') as f:
    for g in GRAMMARS:
        src = os.path.join(root, f'packages/{g}/.sittir/src')
        nodes = json.load(open(os.path.join(src, 'node-types.json')))
        rules = json.load(open(os.path.join(src, 'grammar.json')))['rules']
        lines = open(os.path.join(root, f'packages/{g}/bindings.scm')).read().splitlines()
        named = {n['type']: n for n in nodes if n.get('named')}
        print(f'== {g}', file=f)
        for name in sorted(n for n in named if LIKE.search(n)):
            node = named[name]
            shape = 'leaf' if not node.get('fields') and not node.get('children') else 'fields ' + ','.join(sorted(node.get('fields', {})))
            paths = sorted({p for c in C if c['grammar'] == g and c['node'] == name for p in c['paths']})
            print(f"  {name:46} {shape:24} {' '.join(paths) or '(no claim)'}", file=f)
        words = collections.defaultdict(set)

        def walk(r):
            if isinstance(r, dict):
                if r.get('type') == 'ALIAS' and r.get('named') and LIKE.search(r.get('value', '')) and r['content'].get('type') == 'STRING':
                    words[r['value']].add(r['content']['value'])
                for v in r.values():
                    walk(v)
            elif isinstance(r, list):
                for v in r:
                    walk(v)
        walk(rules)
        for kind, ws in sorted(words.items()):
            print(f'  words aliased to {kind}: {" ".join(sorted(ws))}', file=f)

# collisions.txt
SEGMENT = re.compile(r'^[a-z][a-z0-9]*(_[a-z0-9]+)*$')
renames = sorted(proposal['renames'], key=lambda r: -len(r[0]))
tree = {}
for p, k in K.items():
    q = p
    for old, new, _ in renames:
        if q == old or q.startswith(old + '.'):
            q = None if new is None else new + q[len(old):]
            break
    if q is None:
        continue
    node = tree.setdefault(q, {'members': set(), 'flags': set(), 'from': []})
    node['members'] |= set(k['members']); node['flags'] |= set(k['flags']); node['from'].append(p)
for q in proposal.get('adds', []):
    tree.setdefault(q[0], {'members': set(), 'flags': set(), 'from': []})
for q in list(tree):
    parts = q.split('.')
    for i in range(1, len(parts)):
        tree.setdefault('.'.join(parts[:i]), {'members': set(), 'flags': set(), 'from': []})
children = collections.defaultdict(set)
for q in tree:
    if '.' in q:
        children[q.rsplit('.', 1)[0]].add(q.rsplit('.', 1)[1])

# ruled-kinds.txt
with open(os.path.join(out, 'ruled-kinds.txt'), 'w') as f:
    print('ruled path <- the census kinds it comes from (none: an added kind or a level the renames imply); claims per grammar', file=f)
    for q in sorted(tree):
        if owner_level(q):
            continue
        origin = tree[q]['from']
        claims = ' '.join(sorted({claims_of(p) for p in origin if claims_of(p)}))
        print(f"{q:48} <- {', '.join(sorted(origin)) or 'none'}  {claims}".rstrip(), file=f)


def line(q):
    parts = q.split('.')
    return ['.'.join(parts[:i]) for i in range(1, len(parts) + 1)]


def lineage(q, field):
    return set().union(*(tree[a][field] for a in line(q)))


flag_syns = proposal.get('flags', {})
all_flags = set().union(*(n['flags'] for n in tree.values()))
problems, checked, notes = [], 0, []
with open(os.path.join(out, 'collisions.txt'), 'w') as f:
    print(f'{len(K)} kinds; {len(renames)} renames and {len(proposal.get("adds", []))} additions give {len(tree)} kinds\n', file=f)
    for level, table in sorted(proposal['levels'].items()):
        print(f'== {level}', file=f)
        for canon, syns in sorted(table.items()):
            positions = sorted(q for q in tree if q.split('.')[0] == level and '.' in q and q.rsplit('.', 1)[1] == canon)
            if not positions:
                problems.append(f'{level}: no segment `{canon}` for its synonyms')
            for q in positions:
                parent = q.rsplit('.', 1)[0]
                siblings = children[parent] - {canon}
                for t in syns:
                    checked += 1
                    why = []
                    if not SEGMENT.match(t):
                        why.append('not a segment')
                    if t == canon:
                        why.append('its own canonical name')
                    if t in siblings:
                        why.append(f'a sibling segment under {parent}')
                    clash = sorted(s for s in siblings if t in table.get(s, []))
                    if clash:
                        why.append(f'a synonym of sibling {clash}')
                    if t in lineage(parent, 'flags'):
                        why.append(f'a flag of {parent} or a kind above it')
                    if any(t in flag_syns.get(fl, []) for fl in lineage(parent, 'flags')):
                        why.append('a synonym of a flag above it')
                    for w in why:
                        problems.append(f'{q}: synonym `{t}` is {w}')
            elsewhere = sorted(q for q in tree if q.split('.')[0] == level and '.' in q and q.rsplit('.', 1)[1] in syns)
            for q in elsewhere:
                notes.append(f'{level}: `{q.rsplit(".", 1)[1]}` is a synonym of `{canon}` and the canonical segment of {q}')
            print(f"  {canon:16} {' '.join(syns):32} at {', '.join(positions[:4])}{' …' if len(positions) > 4 else ''} ({len(positions)})", file=f)
    print('\n== flags', file=f)
    for flag, syns in sorted(flag_syns.items()):
        owners = [q for q in tree if flag in tree[q]['flags']]
        reach = {q for q in tree for o in owners if q == o or q.startswith(o + '.')}
        for t in syns:
            checked += 1
            if t in all_flags:
                problems.append(f'#{flag}: synonym `{t}` is a flag')
            if any(t in s for g, s in flag_syns.items() if g != flag):
                problems.append(f'#{flag}: synonym `{t}` is another flag\'s synonym')
            for q in sorted(reach):
                if t in lineage(q, 'members'):
                    problems.append(f'#{flag}: synonym `{t}` is a member of {q}')
                if t in children[q] or any(t in proposal['levels'].get(q.split('.')[0], {}).get(s, []) for s in children[q]):
                    problems.append(f'#{flag}: synonym `{t}` is a refinement segment or synonym beneath {q}')
        print(f'  {flag:16} {" ".join(syns)} (declared on {len(owners)} kinds, reaching {len(reach)})', file=f)
    if not flag_syns:
        print('  (no flag synonyms proposed)', file=f)
    print('\n== excluded (a word two languages use for different facts is a synonym of neither)', file=f)
    for word, why in proposal.get('excluded', {}).items():
        print(f'  {word:8} {why}', file=f)
    print(f'\n{checked} synonym positions checked; {len(problems)} collisions', file=f)
    for p in problems:
        print('  COLLISION ' + p, file=f)
    for n in sorted(set(notes)):
        print('  note ' + n, file=f)
print(f'{checked} synonym positions checked; {len(problems)} collisions; {len(set(notes))} notes')
