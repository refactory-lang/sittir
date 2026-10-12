"""Configure a worktree's grammar for one mode: python3 configure.py <worktree> <grammar> <base|lead|lead-typed>.

base: the committed grammar, which passes no grammar bindings. lead: grammar bindings holding only the
receiver split, the lead entry below. lead-typed (rust): the same, where the receiver also admits a
`parameter` named `self` (`self: Box<Self>`). lead-typed-named (rust): lead-typed with its visible
variants named, the receiver's wrapper `attributed_parameter_receiver` and typed self
`typed_self_parameter`. The grammar file is restored from git first, so the modes never stack.
"""
import os, subprocess, sys

wt, grammar, mode = sys.argv[1], sys.argv[2], sys.argv[3]
LEADS = {
    ('rust', 'lead'): "lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter')]))",
    ('rust', 'lead-typed'): "lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] })]))",
    ('rust', 'lead-typed-named'): "lead('parameters_elements', 'item', 'receiver', match('attributed_parameter', [match('self_parameter'), match('parameter', { name: [match('self')] }, 'typed_self_parameter')], 'attributed_parameter_receiver'))",
    ('typescript', 'lead'): "lead('formal_parameters_elements', 'item', 'receiver', match('required_parameter', { pattern: [match('this')] }, 'this_parameter'))",
}
assert mode == 'base' or (grammar, mode) in LEADS, (grammar, mode)
rel = f'packages/{grammar}/grammar.sittir.ts'
subprocess.run(['git', '-C', wt, 'checkout', '--', rel], check=True)
if mode != 'base':
    path = os.path.join(wt, rel)
    t = open(path).read()
    dsl = "\n} from '../codegen/src/dsl/dsl-authoring.ts';"
    call = 'sittirGrammar(base, {\n\tresolutions,\n'
    assert t.count(dsl) == 1 and t.count(call) == 1
    t = t.replace(dsl, ',\n\tbindings,\n\tlead,\n\tmatch' + dsl, 1)
    t = t.replace(call, call + f'\tbindings: bindings({{ leads: [{LEADS[(grammar, mode)]}] }}),\n', 1)
    open(path, 'w').write(t)
print(grammar, mode, 'configured')
