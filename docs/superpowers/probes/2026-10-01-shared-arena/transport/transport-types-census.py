"""Census of the choices (enums) in a generated transport.rs, for the spec's phase 0: how many
choices each family holds (per-slot `*TransportSlot`, supertype `*Transport`, enum-kind `*Enum`),
how many distinct variant sets and distinct generated bodies (names normalized) they come to, how
many nothing but their own items reference, the unit (fixed-literal) variants, the one-literal
choices, and the slot fields typed `AnyTransport`.
Usage: python3 transport-types-census.py <transport.rs>..."""
import re
import sys
from collections import Counter, defaultdict

OWN_ITEM = [
    re.compile(r'^(?:pub )?(?:enum|struct) (\w+)'),
    re.compile(r'^(?:unsafe )?impl\b.*?\bfor (?:Box<)?(\w+)'),
    re.compile(r'^impl\b(?:<[^>]*>)? (\w+)'),
    re.compile(r'^(?:pub )?fn (\w+)'),
]


def snake(name):
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()


def family(name):
    if name.endswith('TransportSlot'):
        return 'per-slot'
    if name.endswith('Enum'):
        return 'enum kind'
    return 'supertype or choice'


def census(path):
    with open(path) as f:
        text = f.read()
    lines = text.split('\n')
    owner = []
    current = None
    for line in lines:
        for pattern in OWN_ITEM:
            m = pattern.match(line)
            if m:
                current = m.group(1)
                break
        owner.append(current)
    enums = {}
    for m in re.finditer(r'^pub enum (\w+) \{\n(.*?)^\}', text, re.S | re.M):
        variants = []
        for line in m.group(2).split('\n'):
            v = re.match(r'\s+(\w+)(?:\((.*)\))?,\s*$', line)
            if v:
                variants.append(('node', re.sub(r'Box<(.*)>', r'\1', v.group(2))) if v.group(2) else ('unit', v.group(1)))
        enums[m.group(1)] = frozenset(variants)
    choices = {n: s for n, s in enums.items() if n not in ('AnyTransport', 'TriviaTransport')}
    bridge = {snake(c) + '_to_any': c for c in choices}
    bodies = defaultdict(list)
    for i, name in enumerate(owner):
        choice = name if name in choices else bridge.get(name)
        if choice is not None:
            bodies[choice].append(lines[i])
    unused = []
    for name in choices:
        own = {name, snake(name) + '_to_any', 'render_' + snake(name[: -len('Transport')] if name.endswith('Transport') else name)}
        refs = [i for i, line in enumerate(lines) if re.search(rf'\b{name}\b', line) and owner[i] not in own]
        if not refs:
            unused.append(name)
    normalized = Counter('\n'.join(b).replace(n, '@').replace(snake(n), '@') for n, b in bodies.items())
    units = Counter(v for s in choices.values() for k, v in s if k == 'unit')
    fields = re.findall(r'^\s+pub \w+: (.+),$', text, re.M)
    by_family = Counter(family(n) for n in choices)
    one_literal = [n for n, s in choices.items() if len(s) == 1 and next(iter(s))[0] == 'unit']
    print(f'## {path}')
    print(f'choices: {len(choices)} ({", ".join(f"{k} {v}" for k, v in sorted(by_family.items()))})')
    print(f'distinct variant sets: {len(set(choices.values()))}; distinct generated bodies, names normalized: {len(normalized)}')
    print(f'referenced only by their own items: {len(unused)} {sorted(unused)[:6]}{" …" if len(unused) > 6 else ""}')
    print(f'unit variants: {sum(units.values())} across choices, {len(units)} distinct; one-literal choices: {len(one_literal)}')
    print(f'slot fields typed AnyTransport: {sum(1 for f in fields if "AnyTransport" in f)}')


for p in sys.argv[1:]:
    census(p)
