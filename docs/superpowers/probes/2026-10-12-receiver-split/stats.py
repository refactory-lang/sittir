"""Parser and node-types facts for one generated package: python3 stats.py <label> <packages/<grammar>/.sittir/src>.

Prints one JSON row: the parser's defines, parser.c's size, the named node types, the rules, and the
fields and children node-types.json gives the kinds the receiver split touches.
"""
import json, re, sys

label, src = sys.argv[1], sys.argv[2]
WATCH = ('parameters', 'formal_parameters', 'attributed_parameter', 'self_parameter', 'parameter', 'required_parameter', 'optional_parameter', 'this_parameter')
parser = open(f'{src}/parser.c').read()
row = {'label': label}
for k in ('STATE_COUNT', 'LARGE_STATE_COUNT', 'SYMBOL_COUNT', 'ALIAS_COUNT', 'TOKEN_COUNT', 'FIELD_COUNT', 'PRODUCTION_ID_COUNT', 'MAX_ALIAS_SEQUENCE_LENGTH'):
    m = re.search(rf'#define {k} (\d+)', parser)
    row[k] = int(m.group(1)) if m else None
row['parser_c_bytes'] = len(parser.encode())
types = json.load(open(f'{src}/node-types.json'))
row['node_types_named'] = sum(1 for t in types if t.get('named'))
row['rules'] = len(json.load(open(f'{src}/grammar.json'))['rules'])
kinds = {}
for t in types:
    if t.get('named') and t['type'] in WATCH:
        fields = {name: sorted(x['type'] for x in f['types']) for name, f in sorted(t.get('fields', {}).items())}
        children = sorted(x['type'] for x in t.get('children', {}).get('types', []))
        kinds[t['type']] = {'fields': fields, **({'children': children} if children else {})}
row['kinds'] = kinds
print(json.dumps(row))
