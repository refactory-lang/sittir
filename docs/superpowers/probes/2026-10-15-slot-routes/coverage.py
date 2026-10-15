"""Which kinds with query slots does the typed reader read without routing their children?

Run from the repo root: python3 docs/superpowers/probes/2026-10-15-slot-routes/coverage.py
A kind's transport struct reads its children by routing (`routes()` gives `Routed`) unless
its attribute marks it a text leaf (`text`), a token interior (`interior = ...`) or an
envelope (`content = ...`). For each grammar it lists the query-slot kinds of each
non-routed body and their slots, from the generated `querySlots` table.
"""
import re
from collections import defaultdict

for grammar in ('python', 'regex', 'rust', 'scm', 'typescript'):
    transport = open(f'rust/crates/sittir-{grammar}/src/render/transport.rs').read()
    consts = {}
    for path in (f'rust/crates/sittir-{grammar}/src/render/transport.rs', f'rust/crates/sittir-{grammar}/src/render/kind_ids.rs'):
        try:
            text = open(path).read()
        except FileNotFoundError:
            continue
        consts.update({name: int(num) for name, num in re.findall(r'pub const (\w+): (?:[\w:]+::)?KindId = (?:[\w:]+::)?KindId\((\d+)\)', text)})
    bodies = {}
    for attrs in re.findall(r"^#\[transport\(kind = kind::(\w+)(.*)\)\]$", transport, re.M):
        name, rest = attrs
        body = 'text' if re.search(r'\btext\b', rest) else 'interior' if 'interior' in rest else 'envelope' if 'content' in rest else 'routed'
        bodies[name] = body
    utils = open(f'packages/{grammar}/src/utils.ts').read()
    table = utils[utils.index('export const querySlots'):]
    table = table[: table.index('\n});')]
    slots_by_id = {}
    starts = list(re.finditer(r'^\t(\d+): ', table, re.M))
    for here, after in zip(starts, starts[1:] + [None]):
        row = table[here.end(): after.start() if after else len(table)]
        slots_by_id[int(here.group(1))] = re.findall(r"\[\s*'(\w+)',\s*\{", row)
    by_body = defaultdict(list)
    for name, body in bodies.items():
        kid = consts.get(name)
        if kid is not None and kid in slots_by_id and body != 'routed':
            by_body[body].append(f"{name.lower()}({', '.join(slots_by_id[kid])})")
    routed = sum(1 for name, body in bodies.items() if body == 'routed' and consts.get(name) in slots_by_id)
    print(f'{grammar}: routed {routed} kinds with query slots; ' + '; '.join(f'{body} {len(items)}' for body, items in sorted(by_body.items())))
    for body, items in sorted(by_body.items()):
        print(f'  {body}: ' + ', '.join(sorted(items)))
