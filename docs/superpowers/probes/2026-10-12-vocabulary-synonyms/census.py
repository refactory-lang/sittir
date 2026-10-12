"""Census of the vocabulary: python3 -I census.py <root> <out.json>

<root> holds packages/types/src/vocabulary and packages/<grammar>/bindings.scm (an export of one commit).
Writes every kind (path, owner, TS name, claimed-by, members, flags) and every bindings claim
(grammar, line, top grammar kind, each vocabulary path its captures name), as JSON.

A feature file restates a base interface under the same qualified TS name; its members and flags are
credited to the feature that declares them.
"""
import json, os, re, sys

root, out = sys.argv[1], sys.argv[2]
V = os.path.join(root, 'packages/types/src/vocabulary')
SKIP = {'context.ts', 'augment.ts', 'index.ts', 'utils.ts', 'flags.ts', 'compositions.ts'}

open_ns = re.compile(r'^\s*export namespace (\w+) \{')
open_if = re.compile(r'^\s*export interface (\w+)(?:<.*?>)?(?:\s+extends\s+(.*?))?\s*\{')
kind_re = re.compile(r"readonly \$kind: '([^']+)'")
member_re = re.compile(r'^\s*readonly (\w+)(\??): (.*?);?\s*$')
claimed_re = re.compile(r'//\s*claimed by (\w+)')
strings = re.compile(r"'[^']*'")


def owner_of(path):
    parts = os.path.relpath(path, V).split(os.sep)
    return 'feature:' + '/'.join(parts[1:-1]) if parts[0] == 'features' else 'base:' + parts[0]


decls = []
for dirpath, _, files in os.walk(V):
    for f in sorted(files):
        p = os.path.join(dirpath, f)
        if not f.endswith('.ts') or f == 'index.ts' or (f in SKIP and dirpath == V):
            continue
        owner = owner_of(p)
        stack = []  # ('ns', name) | ('if', name, record) | ('anon',)
        for line in open(p):
            code = strings.sub("''", line.split('//')[0])
            opens, closes = code.count('{'), code.count('}')
            m_ns, m_if = open_ns.match(line), open_if.match(line)
            top = stack[-1] if stack else None
            if top and top[0] == 'if' and not m_if:
                rec = top[2]
                m = kind_re.search(line)
                if m:
                    rec['kind'] = m.group(1)
                elif claimed_re.search(line) and rec['claimed'] is None:
                    rec['claimed'] = claimed_re.search(line).group(1)
                else:
                    m = member_re.match(line)
                    if m:
                        name, typ = m.group(1), m.group(3)
                        (rec['flags'].append(name) if typ == 'Flag' else rec['members'].__setitem__(name, typ))
            if m_ns:
                stack.append(('ns', m_ns.group(1)))
                opens -= 1
            elif m_if:
                q = '.'.join([s[1] for s in stack if s[0] in ('ns', 'if')] + [m_if.group(1)])
                stack.append(('if', m_if.group(1), {'qualified': q, 'owner': owner, 'kind': None, 'members': {}, 'flags': [], 'claimed': None}))
                opens -= 1
            stack.extend([('anon',)] * opens)
            for _ in range(closes):
                frame = stack.pop()
                if frame[0] == 'if':
                    decls.append(frame[2])

by_name = {d['qualified']: d['kind'] for d in decls if d['kind']}
kinds = {}
for d in decls:
    path = d['kind'] or by_name.get(d['qualified'])
    if path is None:
        continue
    k = kinds.setdefault(path, {'path': path, 'owner': None, 'qualified': d['qualified'], 'claimed': None, 'members': {}, 'flags': {}})
    if d['kind']:
        k['owner'], k['claimed'] = d['owner'], d['claimed']
    for name in d['members']:
        k['members'].setdefault(name, d['owner'])
    for name in d['flags']:
        k['flags'].setdefault(name, d['owner'])

claims = []
cap = re.compile(r'@([a-z_]+(?:\.[a-z_]+)*)')
top_kind = re.compile(r'^\s*\(+\s*([a-z_]+)')
bare = re.compile(r'^\([a-z_]+\)\s*@([a-z_]+)$')  # `(identifier) @identifier`: a single-segment path claimed
for g in ('python', 'rust', 'typescript'):
    p = os.path.join(root, f'packages/{g}/bindings.scm')
    for n, line in enumerate(open(p), 1):
        s = line.strip()
        if not s or s.startswith(';'):
            continue
        paths = [c for c in cap.findall(s) if c in kinds and '.' in c]
        if bare.match(s) and bare.match(s).group(1) in kinds:
            paths.append(bare.match(s).group(1))
        if paths:
            t = top_kind.match(s)
            claims.append({'grammar': g, 'line': n, 'node': t.group(1) if t else None, 'paths': paths, 'text': s[:240]})

json.dump({'kinds': kinds, 'claims': claims}, open(out, 'w'), indent=1)
flags = sorted({f for k in kinds.values() for f in k['flags']})
print(len(kinds), 'kinds;', len(flags), 'flag names;', len(claims), 'claim lines;',
      sum('.' not in k['qualified'] and '.' in k['path'] for k in kinds.values()), 'unqualified refinements')
