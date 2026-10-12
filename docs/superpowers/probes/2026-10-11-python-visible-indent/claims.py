#!/usr/bin/env python3
"""Claims whose child tests can change when python's `_indent`/`_dedent` become named children.

usage: claims.py <base node-types.json> <after node-types.json> <bindings.scm>

1. The kinds whose child set changes between the two node-types files (the parents of the new
   named kinds, plus the kinds whose `children.multiple` flips).
2. For every bindings.scm pattern, each occurrence of such a parent, with the text of its child
   list and the child tests that depend on siblings: a `.` anchor (first/last/adjacent named
   child), a quantifier on a child, or a `(_)` wildcard child.
"""
import json
import re
import sys


def child_types(path):
    out = {}
    for node in json.load(open(path)):
        if not node.get('named'):
            continue
        kids = node.get('children')
        fields = node.get('fields', {})
        entry = {
            'children': sorted(t['type'] for t in kids['types']) if kids else [],
            'multiple': bool(kids and kids['multiple']),
            'required': bool(kids and kids['required']),
        }
        entry['fields'] = {k: sorted(t['type'] for t in v['types']) for k, v in fields.items()}
        out[node['type']] = entry
    return out


def changed_kinds(base, after):
    changed = {}
    for kind in sorted(set(base) | set(after)):
        if base.get(kind) != after.get(kind):
            changed[kind] = (base.get(kind), after.get(kind))
    return changed


def top_level_patterns(text):
    """(line, source) for every top-level pattern; comments stripped."""
    lines = [re.sub(r';.*$', '', l) if not l.lstrip().startswith('"') else l for l in text.split('\n')]
    out, depth, start, buf = [], 0, 0, []
    for i, line in enumerate(lines, 1):
        for ch in line:
            if ch in '([':
                if depth == 0:
                    start = i
                depth += 1
            elif ch in ')]':
                depth -= 1
        buf.append(line)
        if depth == 0 and any(c in ''.join(buf) for c in '(['):
            src = ' '.join(s.strip() for s in buf).strip()
            if src:
                out.append((start, src))
            buf = []
        elif depth == 0:
            buf = []
    return out


def group_end(src, open_at):
    depth = 0
    for j in range(open_at, len(src)):
        if src[j] in '([':
            depth += 1
        elif src[j] in ')]':
            depth -= 1
            if depth == 0:
                return j
    return len(src) - 1


def occurrences(src, kind):
    for m in re.finditer(r'\(' + re.escape(kind) + r'(?=[\s)])', src):
        end = group_end(src, m.start())
        yield src[m.start():end + 1], src[m.end():end]


def sibling_tests(children):
    tests = []
    if re.search(r'(^|\s)\.(\s|$)', children):
        tests.append('anchor')
    if re.search(r'\)[*+?]', children):
        tests.append('quantifier')
    if '(_)' in children:
        tests.append('wildcard')
    return tests


def main():
    base, after, scm = sys.argv[1:4]
    b, a = child_types(base), child_types(after)
    changed = changed_kinds(b, a)
    print('kinds whose declared child set changes:')
    for kind, (was, now) in changed.items():
        if was is None:
            print(f'  + {kind}: new named kind')
        elif now is None:
            print(f'  - {kind}: removed')
        else:
            print(f'  ~ {kind}: children {was["children"]} -> {now["children"]}; multiple {was["multiple"]} -> {now["multiple"]}')
    parents = [k for k, (was, now) in changed.items() if was is not None and now is not None]
    patterns = top_level_patterns(open(scm).read())
    print(f'\n{len(patterns)} patterns; occurrences of the changed parents:')
    total = 0
    depends = 0
    for kind in parents:
        for line, src in patterns:
            for whole, children in occurrences(src, kind):
                total += 1
                tests = sibling_tests(children)
                if tests:
                    depends += 1
                print(f'  L{line} ({kind}) tests={tests or "-"}\n      {whole[:200]}')
    print(f'\ntotal occurrences {total}; with a sibling-dependent test {depends}')


main()
