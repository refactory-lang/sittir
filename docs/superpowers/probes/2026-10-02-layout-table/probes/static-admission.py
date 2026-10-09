#!/usr/bin/env python3
"""Measures: whether "no line-sensitive token is valid at this seam" can be
  decided without rendering, from tree-sitter's outputs alone, and how the
  static answer compares with what the seam oracle observed.
  For a site addressed as (kind)/"token"/after or /before, the states are the
  ones whose kernel item, in a variable of that kind, has the dot next to the
  token; a state is line-sensitive when parser.c lists one of the grammar's
  external line tokens as valid in it (ts_lex_modes ->
  ts_external_scanner_states).
Run:    python3 static-admission.py <checkout-root> <grammar> <state-report> <records.jsonl> [<external-token,...|-> [<runtime-token,...|->]]
        <state-report> is state-report.sh's <grammar>-states.txt, made in the
        same checkout. Tokens default to line-tokens.json: `external` names
        are looked up in parser.c, `runtime` names in the oracle's records.
Prints: state totals; the sites by address form; per form, how many sites
  are free in every state, sensitive in some state, or have no item found,
  and how many observed sites agree with the oracle; then each site the
  static check calls free where the oracle saw a token ("missed").
Sound for token-after sites. For token-before sites the item's state is the
state before the previous symbol is reduced, not the lexing state, so this
lookup is an approximation there (it misses a few); a sound answer walks the
parse table back through the reductions.
"""
import collections, json, os, re, sys
from oracle_lib import Sites, line_tokens, records

root, grammar, report_path, records_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
external = set(line_tokens(grammar, 'external', sys.argv[5] if len(sys.argv) > 5 else '-'))
runtime = set(line_tokens(grammar, 'runtime', sys.argv[6] if len(sys.argv) > 6 else '-'))
pkg = os.path.join(root, 'packages', grammar, '.sittir', 'src')
parser = open(os.path.join(pkg, 'parser.c')).read()

# parse state -> external lex state -> valid external tokens
modes = {}
i = parser.index('ts_lex_modes[STATE_COUNT]')
for m in re.finditer(r'\[(\d+)\] = \{([^}]*)\}', parser[i:parser.index('};', i)]):
    ext = re.search(r'\.external_lex_state = (\d+)', m.group(2))
    modes[int(m.group(1))] = int(ext.group(1)) if ext else 0
i = parser.index('static const bool ts_external_scanner_states')
block = parser[i:parser.index('\n};', i)]
ext_states = {}
for m in re.finditer(r'\[(\d+)\] = \{(.*?)\n  \},', block, re.S):
    ext_states[int(m.group(1))] = set(re.findall(r'\[ts_external_token_(\w+)\] = true', m.group(2)))


def sensitive(state):
    return bool(ext_states.get(modes.get(state, 0), set()) & external)


print(f'{grammar}: {len(modes)} parse states, {len(ext_states)} external lex states; a line-sensitive token is valid in {sum(1 for s in modes if sensitive(s))} states')

# kernel items: (variable, symbol next to the dot) -> states
after = collections.defaultdict(set)   # the symbol before the dot
before = collections.defaultdict(set)  # the symbol after the dot, dot not at the start
state = None
items = 0
for line in open(report_path, errors='replace'):
    if line.startswith('state index: '):
        state = int(line.split(': ')[1])
        continue
    if state is None or '→' not in line or '•' not in line:
        continue
    lhs, rest = line.split(' → ', 1)
    syms = rest.split('\t')[0].strip().split(' ')
    if '•' not in syms:
        continue
    d = syms.index('•')
    items += 1
    if d > 0:
        after[(lhs.strip(), syms[d - 1])].add(state)
        if d + 1 < len(syms):
            before[(lhs.strip(), syms[d + 1])].add(state)
print(f'{items} kernel items read')

# sittir kind -> tree-sitter variables (the kind, its hidden form, what it aliases, their repeat helpers)
g = json.load(open(os.path.join(pkg, 'grammar.json')))
aliased = collections.defaultdict(set)


def walk(rule):
    if isinstance(rule, dict):
        if rule.get('type') == 'ALIAS' and rule.get('named') and isinstance(rule.get('content'), dict) and rule['content'].get('type') == 'SYMBOL':
            aliased[rule['value']].add(rule['content']['name'])
        for v in rule.values():
            walk(v)
    elif isinstance(rule, list):
        for v in rule:
            walk(v)


walk(g['rules'])
variables = set(v for v, _ in after) | set(v for v, _ in before)


def vars_of(kind):
    base = {kind, '_' + kind} | aliased.get(kind, set())
    return {v for v in variables if v in base or re.sub(r'_repeat\d+$', '', v) in base}


# the sites, by the form of the last option path that addresses each
sites = Sites(root, grammar)
roles = collections.Counter()
static = {}
for site, paths in sites.paths.items():
    path = paths[-1]
    m = re.match(r'^\((\w+)\)/(?:(\w+):/separator/)?"((?:[^"\\]|\\.)*)"/(after|before)$', path)
    if not m:
        role = 'kind edge' if re.match(r'^\(\w+\)/(after|before)$', path) else 'list seat' if re.search(r':/\(\w+\)/(after|before)$', path) else 'list start or end' if re.search(r':/(start|end)$', path) else 'separator, one site' if path.endswith(':/separator') else 'other'
        roles[role] += 1
        continue
    kind, slot, token, side = m.group(1), m.group(2), m.group(3).replace('\\"', '"'), m.group(4)
    role = ('separator ' if slot else 'token ') + side
    roles[role] += 1
    table = after if side == 'after' else before
    states = set()
    for v in vars_of(kind):
        states |= table.get((v, token), set())
    static[site] = (role, path, states, any(sensitive(s) for s in states))
print('sites by address form:', dict(roles))

# the oracle's per-site observation at inline gaps
obs = collections.defaultdict(collections.Counter)
obs_states = collections.defaultdict(set)
for r in records(records_path):
    if '\n' in r['ws']:
        continue
    for s in set(r['sites']):
        obs[s][bool(runtime & set(r['any']))] += 1
        obs_states[s].update(r['states'])

summary = collections.Counter()
missed = []
for site, (role, path, states, sens) in sorted(static.items(), key=lambda kv: kv[1][1]):
    if not states:
        summary[(role, 'no item found')] += 1
        continue
    summary[(role, 'token valid in some state' if sens else 'free in every state')] += 1
    if site in obs:
        seen_sens = obs[site][True] > 0
        covered = obs_states[site] <= states
        summary[(role, 'observed: agrees' if seen_sens == sens or (sens and not seen_sens) else 'observed: STATIC SAYS FREE, ORACLE SAW A TOKEN')] += 1
        if seen_sens and not sens:
            missed.append(path)
        summary[(role, 'observed: every observed state is among the static ones' if covered else 'observed: some observed state is not among the static ones')] += 1
for (role, what), n in sorted(summary.items()):
    print(f'  {role:18s} {what:60s} {n:5d}')
for path in missed:
    print('  missed:', path)
