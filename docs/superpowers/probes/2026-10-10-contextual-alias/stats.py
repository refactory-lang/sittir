"""Parser and node-types facts for one generated rust package: python3 stats.py <label> <.sittir/src dir> [<node-model.json5>]."""
import json, re, sys
label, src = sys.argv[1], sys.argv[2]
parser = open(f'{src}/parser.c').read()
row = {'label': label}
for k in ('STATE_COUNT', 'LARGE_STATE_COUNT', 'SYMBOL_COUNT', 'ALIAS_COUNT', 'TOKEN_COUNT', 'FIELD_COUNT', 'PRODUCTION_ID_COUNT', 'MAX_ALIAS_SEQUENCE_LENGTH'):
    m = re.search(rf'#define {k} (\d+)', parser)
    row[k] = int(m.group(1)) if m else None
row['parser_c_bytes'] = len(parser.encode())
types = json.load(open(f'{src}/node-types.json'))
named = [t for t in types if t.get('named')]
row['node_types_named'] = len(named)
watch = ('method_declaration', 'signature_method_declaration', 'function_declaration', 'function_signature_declaration', 'trait_interface_declaration_body', 'extension_declaration_body')
row['present'] = sorted(t['type'] for t in named if t['type'] in watch)
grammar = json.load(open(f'{src}/grammar.json'))
row['rules'] = len(grammar['rules'])
row['rule_names_watch'] = sorted(n for n in grammar['rules'] if n in watch or 'declaration_statement' in n)
print(json.dumps(row))
