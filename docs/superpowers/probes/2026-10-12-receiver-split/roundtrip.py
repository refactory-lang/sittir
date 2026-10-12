"""Round-trip the receiver cases through sittir: python3 roundtrip.py <worktree> <grammar> > out.txt

For each case, the worktree's `sittir tool probe-kind` parses the source with the generated parser,
reads the case's parameter list (rust `parameters`, typescript `formal_parameters`) and renders it
with the native engine. The rendered list replaces the original in the source, which is parsed
again. Prints the source, the list as rendered, whether the text came back unchanged, and whether
the second parse's named nodes (kinds, fields and leaf text) equal the first's. Needs the
worktree's generated package and native binding built for the mode.
"""
import json, subprocess, sys

wt, grammar = sys.argv[1], sys.argv[2]
CASES = {
    'rust': [
        'fn f() {}',
        'fn f(&self) {}',
        'fn f(&self,) {}',
        'fn f(&self, a: u8) {}',
        'fn f(&self, a: u8,) {}',
        'fn f(a: u8, b: u16) {}',
        'fn f(self: Box<Self>, a: u8) {}',
        'fn f(#[cfg(x)] self) {}',
    ],
    'typescript': [
        'function f() {}',
        'function f(this: T) {}',
        'function f(this: T,) {}',
        'function f(this: T, a) {}',
        'function f(this: T, a,) {}',
        'function f(a, b) {}',
        'function f(this?: T) {}',
    ],
}
KIND = {'rust': 'parameters', 'typescript': 'formal_parameters'}


def probe(source):
    run = subprocess.run(['pnpm', 'exec', 'tsx', 'packages/cli/src/cli.ts', 'tool', 'probe-kind', '-g', grammar, '-s', source, '-k', KIND[grammar]], cwd=wt, capture_output=True, text=True)
    start = run.stdout.find('{')
    if start < 0:
        raise RuntimeError((run.stderr or run.stdout).strip().splitlines()[-1:])
    return json.loads(run.stdout[start:])


def named(node):
    kids = [named(c) for c in node.get('children', []) if c.get('named')]
    return [node['type'], node.get('field'), kids if kids else node.get('text')]


def span(source):
    start = source.index('(')
    depth = 0
    for i in range(start, len(source)):
        depth += {'(': 1, ')': -1}.get(source[i], 0)
        if depth == 0:
            return start, i + 1
    raise ValueError(source)


for source in CASES[grammar]:
    try:
        first = probe(source)
        rendered = first.get('rendered')
        start, end = span(source)
        again = source[:start] + rendered + source[end:]
        second = probe(again)
        same = named(first['cst']) == named(second['cst'])
        print(f'{source}\n  rendered: {rendered}\n  text: {"unchanged" if again == source else "changed"}; reparse: {"same tree" if same else "different tree"}')
        if not same:
            print(f'  first:  {json.dumps(named(first["cst"]))}\n  second: {json.dumps(named(second["cst"]))}')
    except Exception as error:
        print(f'{source}\n  probe failed: {error}')
