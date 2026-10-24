# Counts the aliases whose content is itself an alias in each grammar's grammar.json.
# Run from the checkout: python3 docs/superpowers/probes/2026-10-15-authoring-dsl/nested-aliases.py [revision]
# With no revision it reads the files on disk; with one, the files committed at it.
# Prints one line per grammar: the count, then each site as (rule, outer value, inner value, aliased symbol).
import json
import os
import subprocess
import sys

revision = sys.argv[1] if len(sys.argv) > 1 else None


def grammar_json(grammar):
    path = os.path.join('packages', grammar, '.sittir', 'src', 'grammar.json')
    if revision is None:
        return json.load(open(path)) if os.path.exists(path) else None
    shown = subprocess.run(['git', 'show', f'{revision}:{path}'], capture_output=True, text=True)
    return json.loads(shown.stdout) if shown.returncode == 0 else None


for grammar in sorted(os.listdir('packages')):
    loaded = grammar_json(grammar)
    if loaded is None:
        continue
    sites = []

    def walk(owner, node):
        if isinstance(node, list):
            for item in node:
                walk(owner, item)
        elif isinstance(node, dict):
            content = node.get('content')
            if node.get('type') == 'ALIAS' and isinstance(content, dict) and content.get('type') == 'ALIAS':
                sites.append((owner, node.get('value'), content.get('value'), content.get('content', {}).get('name')))
            for value in node.values():
                walk(owner, value)

    for name, body in loaded['rules'].items():
        walk(name, body)
    print(f'{grammar}: {len(sites)}', *sites, sep='\n  ')
