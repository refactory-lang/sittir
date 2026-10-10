"""The modules Node loads to run each grammar: python3 grammar-graph.py, from the repository root.

Starts at each grammar package's `.sittir/grammar.js`, the file tree-sitter's CLI loads, and follows
the imports and re-exports Node evaluates: a type-only import or export (`import type`,
`export type`, an import whose every name is `type`) is stripped and loads nothing. Resolves a
relative specifier as a path and a `@sittir/*` one through its package's `exports` (the `import`
condition). Prints each grammar's loaded modules by package, any module that declares an enum,
and whether any loaded module lies under the vocabulary."""
import json
import os
import re

ROOT = os.getcwd()
GRAMMARS = ['python', 'rust', 'typescript']
VOCAB = os.path.join(ROOT, 'packages/types/src/vocabulary')
SPEC = re.compile(r'''^\s*(import|export)\s+(type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]''', re.M)
ENUM = re.compile(r'^\s*(export\s+)?(declare\s+)?(const\s+)?enum\s+\w+', re.M)


def all_type(clause: str) -> bool:
    names = re.search(r'\{([^}]*)\}', clause)
    if names is None or re.search(r'\w', clause[:clause.find('{')].replace('export', '').replace('import', '')):
        return False
    parts = [p.strip() for p in names.group(1).split(',') if p.strip()]
    return len(parts) > 0 and all(p.startswith('type ') for p in parts)


def resolve(spec: str, frm: str) -> str | None:
    if spec.startswith('.'):
        p = os.path.normpath(os.path.join(os.path.dirname(frm), spec))
        return p if os.path.exists(p) else None
    m = re.match(r'(@sittir/[\w-]+)(/.*)?$', spec)
    if m is None:
        return None
    pkg_dir = os.path.join(ROOT, 'packages', m.group(1).split('/')[1])
    exports = json.load(open(os.path.join(pkg_dir, 'package.json'))).get('exports', {})
    entry = exports.get('.' + (m.group(2) or ''), {})
    target = entry.get('import') if isinstance(entry, dict) else entry
    return os.path.normpath(os.path.join(pkg_dir, target)) if target else None


for g in GRAMMARS:
    start = os.path.join(ROOT, f'packages/{g}/.sittir/grammar.js')
    seen, todo, bare, missing = set(), [start], set(), set()
    while todo:
        f = todo.pop()
        if f in seen or not f.endswith(('.ts', '.js', '.mts', '.mjs')):
            continue
        seen.add(f)
        for m in SPEC.finditer(open(f).read()):
            spec = m.group(4) or m.group(5)
            if m.group(2) or (m.group(3) and all_type(m.group(3))):
                continue
            if not spec.startswith('.'):
                bare.add(spec)
            r = resolve(spec, f)
            if r is None:
                if not spec.startswith('node:') and spec.startswith(('.', '@sittir/')):
                    missing.add(spec)
                continue
            todo.append(r)
    by_pkg: dict[str, int] = {}
    for f in seen:
        rel = os.path.relpath(f, ROOT)
        top = '/'.join(rel.split('/')[:2])
        by_pkg[top] = by_pkg.get(top, 0) + 1
    enums = sorted(os.path.relpath(f, ROOT) for f in seen if ENUM.search(open(f).read()))
    vocab = sorted(os.path.relpath(f, ROOT) for f in seen if f.startswith(VOCAB))
    print(f'{g}: {len(seen)} modules {dict(sorted(by_pkg.items()))}')
    print(f'  bare specifiers: {sorted(bare)}')
    print(f'  unresolved: {sorted(missing)}')
    print(f'  modules declaring an enum: {enums}')
    print(f'  modules under the vocabulary: {vocab}')
