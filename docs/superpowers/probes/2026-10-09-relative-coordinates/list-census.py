"""Census of list storage keys a type marks optional, and how a grammar's fixtures hold them."""
import collections, json, os, re, sys

lang = sys.argv[1]
types = open(f'packages/{lang}/src/types.ts').read()
interfaces = re.findall(r'export interface (\w+) \{\n\s+readonly \$type: TSKindId\.(\w+);([\s\S]*?)\n\}', types)
optional = {kind: keys for _, kind, body in interfaces
            if (keys := re.findall(r'readonly (_\w+)\?: (?:readonly|NonEmptyArray)', body))}
ids = {}
for name in os.listdir(f'packages/{lang}/src'):
    if name.endswith('.ts'):
        for kind, value in re.findall(r'\b(\w+) = (\d+)', open(f'packages/{lang}/src/{name}').read()):
            ids.setdefault(kind, int(value))
wanted = {ids[kind]: keys for kind, keys in optional.items() if kind in ids}
unresolved = [kind for kind in optional if kind not in ids]
counts = collections.Counter()

def walk(value):
    if isinstance(value, dict):
        for key in wanted.get(value.get('$type'), []):
            counts['absent' if key not in value else 'empty' if value[key] == [] else 'items'] += 1
        for child in value.values():
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)

walk(json.load(open(f'rust/crates/sittir-{lang}/test-fixtures.json')))
print(lang, 'optional list keys:', sum(map(len, optional.values())), 'unresolved kinds:', unresolved, dict(counts))
