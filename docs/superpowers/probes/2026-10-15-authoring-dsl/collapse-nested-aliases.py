# Writes a copy of a grammar.json with every alias(alias(x, v), v) collapsed to alias(x, v).
# Run: python3 docs/superpowers/probes/2026-10-15-authoring-dsl/collapse-nested-aliases.py <grammar.json> <out.json>
# Only an outer alias with the inner one's value and namedness is collapsed; any other nesting is kept.
import json
import sys

source, target = sys.argv[1], sys.argv[2]
grammar = json.load(open(source))
collapsed = 0


def collapse(node):
    global collapsed
    if isinstance(node, list):
        return [collapse(item) for item in node]
    if not isinstance(node, dict):
        return node
    node = {key: collapse(value) for key, value in node.items()}
    inner = node.get('content')
    if (
        node.get('type') == 'ALIAS'
        and isinstance(inner, dict)
        and inner.get('type') == 'ALIAS'
        and inner.get('value') == node.get('value')
        and inner.get('named') == node.get('named')
    ):
        collapsed += 1
        return inner
    return node


grammar['rules'] = collapse(grammar['rules'])
json.dump(grammar, open(target, 'w'), indent=2)
print(f'{source}: collapsed {collapsed}')
