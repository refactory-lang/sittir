"""Flag tokens of one kind that its grammar never spells together.

Usage, from the repository root: python3 exclusive.py <grammar> <kind> [<kind> ...]

Walks each kind's rule in the bound grammar's grammar.json, inlining hidden rules except the
ones that spell names (a contextual keyword used as a name is no flag), and records which pairs
of flag tokens can co-occur: a SEQ pairs the tokens of different members, a CHOICE pairs none
across its members, and a REPEAT pairs its own tokens. Prints each kind's flag tokens and the
pairs that never co-occur."""
import itertools
import json
import re
import sys

FLAGS = {'static', 'abstract', 'readonly', 'declare', 'override', 'accessor', 'async', 'await',
         'const', 'unsafe', 'default', 'mut', 'ref', 'move', 'gen', 'extern', 'using', 'let',
         'get', 'set', '?', '!', '*'}
SYMBOL_TOKENS = {'override_modifier': 'override', 'mutable_specifier': 'mut',
                 'extern_modifier': 'extern', 'accessibility_modifier': 'access'}
NAME_RULE = re.compile(r'name|identifier|reserved|keyword|pattern|expression|type')

grammar = sys.argv[1]
rules = json.load(open(f'packages/{grammar}/.sittir/src/grammar.json'))['rules']


def walk(rule, seen):
    kind = rule['type']
    if kind == 'STRING':
        return ({rule['value']} if rule['value'] in FLAGS else set()), set()
    if kind == 'SYMBOL':
        name = rule['name']
        if name in SYMBOL_TOKENS:
            return {SYMBOL_TOKENS[name]}, set()
        if name.startswith('_') and not NAME_RULE.search(name) and name in rules and name not in seen:
            return walk(rules[name], seen | {name})
        return set(), set()
    if kind in ('FIELD', 'ALIAS', 'PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC', 'IMMEDIATE_TOKEN', 'RESERVED'):
        return walk(rule['content'], seen)
    if kind in ('REPEAT', 'REPEAT1'):
        tokens, pairs = walk(rule['content'], seen)
        return tokens, pairs | {frozenset(p) for p in itertools.combinations(sorted(tokens), 2)}
    if kind == 'SEQ':
        tokens, pairs, parts = set(), set(), []
        for member in rule['members']:
            t, p = walk(member, seen)
            for earlier in parts:
                pairs |= {frozenset((a, b)) for a in earlier for b in t if a != b}
            parts.append(t)
            tokens |= t
            pairs |= p
        return tokens, pairs
    if kind == 'CHOICE':
        tokens, pairs = set(), set()
        for member in rule['members']:
            t, p = walk(member, seen)
            tokens |= t
            pairs |= p
        return tokens, pairs
    return set(), set()


for name in sys.argv[2:]:
    tokens, pairs = walk(rules[name], {name})
    never = [p for p in itertools.combinations(sorted(tokens), 2) if frozenset(p) not in pairs]
    print(f'{name}: {sorted(tokens)}' + (f'  never together: {never}' if never else ''))
