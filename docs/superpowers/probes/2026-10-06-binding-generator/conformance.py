"""Sorts the type errors of a generated binding by cause, for spec.md's conformance table.

Reads `tsc -p tsconfig.json --noEmit` output on stdin. Each error in the generated views is a view
member the vocabulary interface rejects (TS2416); the deepest "Type A is not assignable to B" pair
says why. Errors elsewhere are listed by code.

    pnpm exec tsc -p tsconfig.json --noEmit | python3 conformance.py
"""
import collections
import re
import sys

text = sys.stdin.read()
diags = [d for d in re.split(r'\n(?=\S+\(\d+,\d+\): error)', text) if 'error TS' in d]

CAUSES = [
    ('extra member', 'a member the bindings route that the interface does not declare',
     lambda d, pairs: 'TS2353' in d.split('\n')[0]),
    ('missing member', 'a member the interface requires that the view has no route for',
     lambda d, pairs: 'TS2741' in d.split('\n')[0] or any(' is missing in type ' in p for p in pairs)),
    ('refinement', "kind is a sub-path of the target's: a refinement where its parent is admitted",
     lambda d, pairs: any(re.search(r"Type '\"([a-z_.]+)\"' is not assignable to type '\"([a-z_.]+)\"", p) and
                          p.split('"')[1].startswith(p.split('"')[3] + '.') for p in pairs)),
    ('predicate', 'a content-derived claim (prelude type, true/false) the member type leaves out',
     lambda d, pairs: re.search(r"(\b(Prelude|True|False)<Ctx>|\"(type\.named\.prelude|literal\.boolean\.(true|false))\")[^']*' is not assignable", d) is not None),
    ('token text', "a token read as text that the member type does not admit ('_', 'gen', 'union', …)",
     lambda d, pairs: re.search(r"Type '\"[^\"]+\"' is not assignable", d) is not None),
    ('absent', 'the view can be absent where the member is required (an optional element inside a container)',
     lambda d, pairs: "Type 'undefined' is not assignable" in d),
    ('unmapped', 'the member type is an unmapped marker where the view reads a mapped kind',
     lambda d, pairs: any('Unmapped<' in p.split(' is not assignable')[1] and 'Unmapped<' not in p.split(' is not assignable')[0] for p in pairs)),
    ('text leaf', "a text leaf read as a plain string where the member admits only kinds",
     lambda d, pairs: any(p.startswith("Type 'string' is not assignable") for p in pairs)),
    ('untyped reader', 'the low-level reader is typed unknown',
     lambda d, pairs: "Type 'unknown' is not assignable" in d),
]

by_cause = collections.Counter()
examples = {}
others = collections.Counter()
for d in diags:
    code = re.search(r'error (TS\d+)', d).group(1)
    if code not in ('TS2416', 'TS2322', 'TS2353', 'TS2741') or '.vocab.ts' not in d.split('\n')[0]:
        others[code] += 1
        continue
    lines = d.split('\n')
    pairs = [l.strip() for l in lines if 'is not assignable to type' in l]
    member = re.search(r"Property '([^']+)' in type '([^']+)'", d)
    where = re.search(r'([\w.-]+\.vocab\.ts\(\d+,\d+\))', lines[0])
    label = f'{member.group(2)}.{member.group(1)}' if member else (where.group(1) if where else '?')
    for name, _, test in CAUSES:
        if test(d, pairs):
            by_cause[name] += 1
            examples.setdefault(name, label)
            break
    else:
        by_cause['other'] += 1
        examples.setdefault('other', label + ' :: ' + (pairs[-1][:160] if pairs else ''))

total = sum(by_cause.values())
print(f'{total} view members rejected by their interface')
for name, why, _ in CAUSES + [('other', 'not classified', None)]:
    if by_cause[name]:
        print(f'  {by_cause[name]:4}  {name:15} {why}\n        e.g. {examples[name]}')
for code, n in others.most_common():
    print(f'  {n:4}  {code} outside the view members')
