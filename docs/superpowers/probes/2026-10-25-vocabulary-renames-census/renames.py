"""The ruled vocabulary renames that have not landed, and where each is spelled.

Usage: renames.py <sources> <census.json> <proposal.json> <results dir>
<sources> is an extracted archive of the commit's packages/, tests/ and rust/crates/ trees.
Writes pending.txt (each rename, its claims and members) and reach.txt (the files that spell its old path).
"""
import json
import os
import re
import sys

ROOT, CENSUS, PROPOSAL, OUT = sys.argv[1:5]
GENERATED = (
    re.compile(r'^packages/(python|rust|typescript|regex|scm)/src/'),
    re.compile(r'^packages/(python|rust|typescript|regex|scm)/\.sittir/'),
    re.compile(r'^packages/(python|rust|typescript)/grammar\.bindings\.ts$'),
    re.compile(r'^packages/types/src/vocabulary/(augment|flags)\.ts$'),
    re.compile(r'^packages/types/src/vocabulary/features/index\.ts$'),
    re.compile(r'^packages/common/src/portable/vocabulary-paths\.ts$'),
    re.compile(r'^rust/crates/sittir-[a-z]+/src/'),
)
TEXT = ('.ts', '.mts', '.json', '.json5', '.scm', '.rs')


def classify(rel):
    if any(p.search(rel) for p in GENERATED):
        return 'generated'
    if '/tests/' in rel or '/__tests__/' in rel or rel.startswith('tests/'):
        return 'test'
    return 'source'


def qualified(path):
    return '.'.join(''.join(w.capitalize() for w in seg.split('_')) for seg in path.split('.'))


census = json.load(open(CENSUS))
proposal = json.load(open(PROPOSAL))
kinds = census['kinds']
targets = {to for _, to, _ in proposal['renames'] if to}
pending = [r for r in proposal['renames'] if r[0] in kinds]


def claims_of(path):
    return [c for c in census['claims'] if path in c['paths']]


with open(os.path.join(OUT, 'pending.txt'), 'w') as out:
    kept = [r for r in pending if r[1] is None and r[0] in targets]
    out.write(f'{len(proposal["renames"])} ruled renames; {len(pending)} old paths still in the vocabulary, '
              f'{len(kept)} of them the target of another rename (the removal concerns the path\'s old meaning)\n')
    for frm, to, q in pending:
        kind = kinds[frm]
        if to is None and frm in targets:
            status = 'kept: the target of another rename'
        elif to is None:
            status = 'removed'
        else:
            status = f'-> {to} ({"exists" if to in kinds else "to add"})'
        out.write(f'\n{frm} [{q}] {status}\n')
        out.write(f'  owner {kind["owner"]}; members {", ".join(kind["members"]) or "none"}\n')
        if to in kinds:
            out.write(f'  target members {", ".join(kinds[to]["members"]) or "none"}\n')
        for c in claims_of(frm):
            out.write(f'  {c["grammar"]}:{c["line"]} {c["text"]}\n')

patterns = {
    frm: [
        re.compile(r'(?<![\w])' + re.escape(frm) + r'(?![\w]|\.[a-z_])'),
        re.compile(r'(?<![\w.])' + re.escape(qualified(frm)) + r'(?![\w]|\.[A-Z])'),
    ]
    for frm, _, _ in pending
}
hits = {frm: {} for frm, _, _ in pending}
for base, _, files in os.walk(ROOT):
    for name in files:
        if not name.endswith(TEXT):
            continue
        full = os.path.join(base, name)
        rel = os.path.relpath(full, ROOT)
        try:
            text = open(full, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        for frm, pats in patterns.items():
            count = sum(len(p.findall(text)) for p in pats)
            if count:
                hits[frm].setdefault(classify(rel), []).append((rel, count))

with open(os.path.join(OUT, 'reach.txt'), 'w') as out:
    out.write('Each old path, and the files that spell it (as a path or as its qualified interface name), with counts\n')
    for frm, to, q in pending:
        out.write(f'\n{frm} -> {to or "(removed)"} [{q}]\n')
        for cls in ('source', 'test', 'generated'):
            files = sorted(hits[frm].get(cls, []))
            if files:
                out.write(f'  {cls}: ' + ', '.join(f'{rel} ({n})' for rel, n in files) + '\n')
print(f'{len(pending)} old paths; results in {OUT}')
