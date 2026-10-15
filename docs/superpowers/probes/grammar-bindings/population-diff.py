"""Attributes a change in the validators' kind population to kinds.

The from and template-coverage validators count the node-types entries that are named, are not supertypes, and have
fields or children. This compares that set for a base and a bound node-types.json, with base names mapped through
the binding (renames, then aliases), and prints the kinds each side has alone, with the reason.

    python3 population-diff.py <base node-types.json> <bound node-types.json> <grammar.bindings.ts>
"""
import json, re, sys

base_path, bound_path, bindings_path = sys.argv[1:4]
text = open(bindings_path).read()
body = text[text.index('export const binding = ') + len('export const binding = '):text.index(';\n\nexport default')]
binding = json.loads(re.sub(r'^\t(\w+):', r'\t"\1":', body, flags=re.M))
renames, aliases = binding['renames'], binding['aliases']
bound = lambda name: aliases.get(name, renames.get(name, name))


def population(path):
    out = {}
    for entry in json.load(open(path)):
        if not entry.get('named') or entry.get('subtypes'):
            continue
        if not entry.get('fields') and 'children' not in entry:
            continue
        out[entry['type']] = entry
    return out


base, now = population(base_path), population(bound_path)
mapped = {}
for kind in base:
    mapped.setdefault(bound(kind), []).append(kind)
print(f'population: base {len(base)}, bound {len(now)}')
for target, sources in sorted(mapped.items()):
    if len(sources) > 1:
        print(f'  merged   {", ".join(sorted(sources))} → {target} (alias: one node-types entry)')
for target, sources in sorted(mapped.items()):
    if target not in now:
        print(f'  lost     {", ".join(sources)} → {target}')
for kind in sorted(now):
    if kind not in mapped:
        print(f'  gained   {kind}')
