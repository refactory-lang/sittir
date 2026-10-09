"""Compares corpus parse trees of a base and a bound parser (`tree-sitter parse` output of each).

Both sides are brought to one spelling before comparing: the base side takes the binding's aliases (an alias
merges two base kinds under one name, so it cannot map back), and the bound side maps every other edit back to
the base: renamed kinds, renamed fields (per owner), fields a wrap added, split arms and their placement clones. Reports how many
trees are identical, and the first difference of each tree that is not.

    python3 tree-neutrality.py <base parse output> <bound parse output> <grammar.bindings.ts>
"""
import re, sys, json

base_path, bound_path, bindings_path = sys.argv[1:4]
text = open(bindings_path).read()
body = text[text.index('export const binding = ') + len('export const binding = '):text.index(';\n\nexport default')]
binding = json.loads(re.sub(r'^\t(\w+):', r'\t"\1":', body, flags=re.M))
renames, aliases = binding['renames'], binding['aliases']
bound = lambda name: aliases.get(name, renames.get(name, name))
back = {to: frm for frm, to in renames.items()}
for split in binding.get('splits', []):
    back[split['as']] = split['kind']
    for ancestor, container in zip(split['within'][:-1], split['containers']):
        back[container['name']] = ancestor
fields_back = {(bound(f['owner']), f['to']): f['from'] for f in binding.get('fieldRenames', [])}
wrapped = {(bound(w['owner']), w['field']) for w in binding.get('fieldWraps', [])}
container_field = {}
for split in binding.get('splits', []):
    outer = bound(split['within'][-1])
    for container in split['containers']:
        container_field[(outer, container['name'], container['field'])] = container['baseField']


def parse(path):
    """Each tree as nested [kind, field, position, children]."""
    trees, stack, field = [], [], None
    for token in re.findall(r'\(|\)|\w+:|\[\d+, \d+\] - \[\d+, \d+\]|[^\s()\[\]]+', open(path).read()):
        if token == '(':
            node = [None, field, None, []]
            field = None
            (stack[-1][3] if stack else trees).append(node)
            stack.append(node)
        elif token == ')':
            stack.pop()
        elif token.endswith(':') and not token.startswith('['):
            field = token[:-1]
        elif token.startswith('['):
            stack[-1][2] = token
        elif stack and stack[-1][0] is None:
            stack[-1][0] = token
    return trees


def normalize(node, side, parent=None):
    kind, field, position, children = node
    if side == 'base':
        return [aliases.get(kind, kind), field, position, [normalize(c, side) for c in children]]
    if (parent, kind, field) in container_field:
        field = container_field[(parent, kind, field)]
    elif (parent, field) in fields_back:
        field = fields_back[(parent, field)]
    elif (parent, field) in wrapped:
        field = None
    return [back.get(kind, kind), field, position, [normalize(c, side, kind) for c in children]]


def show(node, depth=0):
    kind, field, position, children = node
    head = f"{'  ' * depth}{field + ': ' if field else ''}({kind} {position or ''}"
    return '\n'.join([head] + [show(c, depth + 1) for c in children])


a = [normalize(t, 'base') for t in parse(base_path)]
b = [normalize(t, 'bound') for t in parse(bound_path)]
same = sum(1 for x, y in zip(a, b) if x == y)
print(f'trees: base {len(a)}, bound {len(b)}, identical after mapping {same}')
shown = 0
for i, (x, y) in enumerate(zip(a, b)):
    if x != y and shown < 5:
        xs, ys = show(x).splitlines(), show(y).splitlines()
        j = next((k for k in range(min(len(xs), len(ys))) if xs[k] != ys[k]), min(len(xs), len(ys)))
        print(f'  tree {i}: base  {xs[j].strip()[:110] if j < len(xs) else "<end>"!r}\n          bound {ys[j].strip()[:110] if j < len(ys) else "<end>"!r}')
        shown += 1
