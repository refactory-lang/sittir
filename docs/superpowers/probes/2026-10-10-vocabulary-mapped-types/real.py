"""Write the real-vocabulary variants the cost table measures.

usage: python3 real.py <vocabulary dir> <out dir>

The vocabulary dir is a checkout's packages/types/src/vocabulary with flags declared by the Flag
marker. owners.ts authors the five visibility values under the eleven top-level owners that take
them; every variant imports the vocabulary's namespace unions plus those values.
"""
import sys
from pathlib import Path

voc, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
here = Path(__file__).resolve().parent
owners = ['declaration.constant', 'declaration.enum', 'declaration.enum_member', 'declaration.field', 'declaration.function',
          'declaration.interface.trait', 'declaration.method', 'declaration.parameter', 'declaration.type_alias',
          'declaration.union', 'statement.import']
values = {'public': '', 'public.internal': '', 'public.restricted': "\treadonly scope: G['identifier'];\n", 'protected': '', 'private': ''}
ident = lambda p: ''.join(s.title().replace('_', '') for s in p.split('.'))
lines, names = [f"import type {{ GrammarContext }} from '{voc}/context.ts';", ''], []
for o in owners:
    for v, extra in values.items():
        names.append(ident(o) + ident(v))
        lines.append(f"export interface {names[-1]}<G extends GrammarContext<G>> {{\n\treadonly $kind: '{o}.{v}';\n{extra}}}")
lines.append('export type OwnerValues<G extends GrammarContext<G>> =\n' + '\n'.join(f'\t| {n}<G>' for n in names) + ';')
(out / 'owners.ts').write_text('\n'.join(lines) + '\n')

mapped = (here / 'mapped.ts').read_text().replace(
    "export declare const flag: unique symbol;\nexport type Flag = typeof flag;\n",
    f"import type {{ Flag }} from '{voc}/utils.ts';\nexport type {{ Flag }};\n")
(out / 'mapped.ts').write_text(mapped)
nss = ['Argument', 'Attribute', 'Clause', 'Comment', 'Declaration', 'Element', 'Expression', 'Identifier', 'Literal',
       'Modifier', 'Module', 'Pattern', 'Statement', 'Type']
head = f"""import type * as V from '{voc}/index.ts';
import type {{ GrammarContext }} from '{voc}/context.ts';
import type {{ OwnerValues }} from './owners.ts';
interface Full extends GrammarContext<Full> {{}}
type Authored<G extends GrammarContext<G>> = {' | '.join(f'V.{n}.Any<G>' for n in nss)} | OwnerValues<G>;
"""
mapped_head = """import type { Chain, Crossings, KindFlags, Paths } from './mapped.ts';
type Kinds<G extends GrammarContext<G>> = Authored<G> | Crossings<Authored<G>>;
"""
exclusions = """interface Exclusions {
	readonly $exclusions: {
		readonly 'declaration.field': readonly [readonly ['optional', 'definite'], readonly ['accessor', 'static']];
		readonly 'declaration.method': readonly [readonly ['generator', 'getter'], readonly ['generator', 'setter']];
	};
}
"""
variants = {
    'base': "export declare const paths: Authored<Full>['$kind'];\n",
    'crossings': "export declare const paths: Kinds<Full>['$kind'];\n",
    'chains': exclusions + """declare const field: Chain<Exclusions, Kinds<Full>, 'declaration.field'>;
export const f1 = field.optional.static;
declare const getter: Chain<Exclusions, Kinds<Full>, 'declaration.method.getter.public'>;
export const g1 = getter.static.async;
declare const fn: Chain<Exclusions, Kinds<Full>, 'declaration.function'>;
export const h1 = fn.async;
""",
    'crossing-members': "type Members = { readonly [P in Paths<Crossings<Authored<Full>>>]: keyof Extract<Kinds<Full>, { readonly $kind: P }> };\nexport declare const members: Members[keyof Members];\n",
    'all-flags': "type AllFlags = { readonly [P in Paths<Kinds<Full>>]: KindFlags<Kinds<Full>, P> };\nexport declare const flags: AllFlags[Paths<Kinds<Full>>];\n",
}
for name, body in variants.items():
    (out / f'{name}.ts').write_text(head + ('' if name == 'base' else mapped_head) + body)
print(f'{len(names)} owner values, variants: {", ".join(variants)}')
