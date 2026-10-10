"""Configure a worktree's grammar for one mode: python3 configure.py <worktree> <unbound|nosplit|split|alias> [grammar].

The grammar is rust unless named. unbound: the grammar without its overlay. nosplit: the overlay with
no splits. split: the overlay's splits as clones. alias: the same splits as parser aliases at their
sites. The bound modes also re-address the options labels the overlay's fields move (README, gap 2).
"""
import os, sys

wt, mode = sys.argv[1], sys.argv[2]
grammar = sys.argv[3] if len(sys.argv) > 3 else 'rust'
assert mode in ('unbound', 'nosplit', 'split', 'alias'), mode
here = os.path.dirname(os.path.abspath(__file__))

# Per grammar: each options label the overlay moves (base, bound), and the splits block measured.
LABELS = {
    'rust': [("'field_initializer/attribute_item:/separator'", "'field_initializer/attributes:/separator'")],
    'python': [],
}
SPLITS = {'rust': 'splits-block.txt', 'python': 'splits-block-python.txt'}

g = f'{wt}/packages/{grammar}/grammar.sittir.ts'
t = open(g).read()
imp = "import binding from './grammar.bindings.ts';\n"
cfg = 'export default sittirGrammar(base, {\n\tresolutions,\n'
bound = cfg.replace('resolutions,\n', 'resolutions,\n\tbindings: binding,\n')
if mode == 'unbound':
    t = t.replace(imp, '').replace(bound, cfg)
else:
    if imp not in t:
        t = t.replace("import base from './base.ts';\n", "import base from './base.ts';\n" + imp)
    if bound not in t:
        assert t.count(cfg) == 1
        t = t.replace(cfg, bound)
for base_label, bound_label in LABELS[grammar]:
    t = t.replace(bound_label, base_label) if mode == 'unbound' else t.replace(base_label, bound_label)
open(g, 'w').write(t)

b = f'{wt}/packages/{grammar}/grammar.bindings.ts'
s = open(b).read()
start = s.index('\tsplits: [')
end = start + len('\tsplits: []\n') if s.startswith('\tsplits: []\n', start) else s.index('\t]\n', start) + 3
block = open(os.path.join(here, SPLITS[grammar])).read()
if mode == 'alias':
    block = block.replace(' })', ', alias: true })')
s = s[:start] + ('\tsplits: []\n' if mode == 'nosplit' else block) + s[end:]
dsl = "} from '../codegen/src/dsl/dsl-authoring.ts';"
head = s[: s.index(dsl)]
if 'split(' in s and ' split' not in head and '{ split' not in head:
    s = s.replace(dsl, dsl.replace('}', ', split }', 1), 1)
open(b, 'w').write(s)
print(grammar, mode, 'configured')
