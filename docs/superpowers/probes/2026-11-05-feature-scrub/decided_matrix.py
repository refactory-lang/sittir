import json, sys
S = sys.argv[1]
m = json.load(open(f'{S}/matrix.json'))
COL = {'p': 0, 'r': 1, 't': 2}
SET = {
    'p': ['declaration.property', 'declaration.property.getter', 'declaration.property.setter',
          'declaration.property.getter:returnType', 'declaration.property:decorators',
          'declaration.method:override', 'declaration.property:override',
          'type.nullable',
          'declaration.method:privateName', 'expression.member:privateName',
          'declaration.constant:type', 'file:shebang'],
    'r': ['declaration.function.signature:async', 'declaration.method.signature:async'],
    't': ['declaration.property.getter:returnType', 'declaration.property.signature.getter:returnType',
          'declaration.property.signature.abstract.getter:returnType'],
}
EXEMPT = {'declaration.type_parameter.parameters:bounds', 'declaration.type_parameter.variadic:bounds',
          'declaration.type_parameter.value:bounds', 'declaration.property:definite', 'declaration.property:optionality'}
key = lambda r: r['path'] + ('' if r['t'] == 'K' else ':' + r['member'])
rows = {key(r): r for r in m}
for g, ks in SET.items():
    for k in ks:
        r = rows[k]
        c = list(r['cells']); c[COL[g]] = 'H'; r['cells'] = ''.join(c) if isinstance(r['cells'], str) else c
out = [r for r in m if key(r) not in EXEMPT]
json.dump(out, open(f'{S}/decided/matrix.json', 'w'))
print('rows', len(m), '->', len(out))
