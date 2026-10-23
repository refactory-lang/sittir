// The census sites: per grammar, each modifier-bearing kind in a source template that compiles with
// none of its atoms. An atom is one fact of the node:
// - `at` is where its text goes: 'mods' for a modifier (placed in every order), or a placeholder;
// - `slot` is the model slot that holds it, when the kind's model has one (a flag's own slot, the
//   enum slot of an accessibility modifier, the `name` that holds a private name);
// - `holds` is the kind the slot must admit for the atom (a private name);
// - atoms with the same `one` fill one position, so no witness holds two of them;
// - `fill` sets other placeholders when the atom is present (a setter takes one parameter).
// `fixed` modifiers sit in every witness of the site.
export interface Atom {
	readonly name: string;
	readonly text: string;
	readonly at: string;
	readonly slot?: string;
	readonly holds?: string;
	readonly one?: string;
	readonly fill?: Readonly<Record<string, string>>;
}

export interface Site {
	readonly name: string;
	readonly kinds: readonly string[];
	readonly template: string;
	readonly defaults: Readonly<Record<string, string>>;
	readonly fixed?: readonly string[];
	readonly atoms: readonly Atom[];
}

const mod = (name: string, slot: string | undefined = name, one?: string): Atom => ({
	name,
	text: name,
	at: 'mods',
	...(slot === undefined ? {} : { slot }),
	...(one === undefined ? {} : { one })
});
const unslotted = (name: string, one?: string): Atom => ({ name, text: name, at: 'mods', ...(one === undefined ? {} : { one }) });
const asyncMod: Atom = { ...mod('async'), fill: { ret: ': Promise<number>' } };
const access = ['public', 'private', 'protected'].map((a) => mod(a, 'accessibility_modifier', 'accessibility_modifier'));
const accessorKinds = (params: string, ret: string): Atom[] => [
	{ name: '*', text: '*', at: 'kind', slot: 'accessor_kind', one: 'accessor_kind' },
	{ name: 'get', text: 'get ', at: 'kind', slot: 'accessor_kind', one: 'accessor_kind', fill: { ret } },
	{ name: 'set', text: 'set ', at: 'kind', slot: 'accessor_kind', one: 'accessor_kind', fill: { params, ret: '' } }
];
const privateName = (text: string): Atom => ({ name: text, text, at: 'name', slot: 'name', holds: 'private_property_identifier' });
const methodAtoms: Atom[] = [...access, mod('static'), mod('override'), mod('readonly'), asyncMod, ...accessorKinds('(v: number)', ': number')];

const BASE = 'class B { x: number = 0; m(): number { return 1; } }\n';

const typescript: Site[] = [
	{
		name: 'class field',
		kinds: ['public_field_definition', 'public_field_definition_plain', 'public_field_definition_accessor'],
		template: `${BASE}export abstract class A extends B { {mods}{name}{q}: number{init}; }\n`,
		defaults: { name: 'x', q: '', init: '' },
		atoms: [
			mod('declare'),
			...access,
			mod('static'),
			mod('override'),
			mod('readonly'),
			mod('abstract'),
			mod('accessor'),
			privateName('#x'),
			{ name: '?', text: '?', at: 'q', slot: 'optionality', one: 'optionality' },
			{ name: '!', text: '!', at: 'q', slot: 'optionality', one: 'optionality' },
			{ name: 'initializer', text: ' = 1', at: 'init', slot: 'value' }
		]
	},
	{
		name: 'class method',
		kinds: ['method_definition', 'method_definition_plain', 'method_definition_getter', 'method_definition_setter'],
		template: `${BASE}export abstract class A extends B { {mods}{kind}{name}{q}{params}{ret} { return 1; } }\n`,
		defaults: { kind: '', name: 'm', q: '', params: '()', ret: ': number' },
		atoms: [...methodAtoms, privateName('#m'), { name: '?', text: '?', at: 'q', slot: 'optional' }]
	},
	{
		name: 'object literal method',
		kinds: ['method_definition', 'method_definition_plain', 'method_definition_getter', 'method_definition_setter'],
		template: 'export const o = { {mods}{kind}m{q}{params}{ret} { return 1; } };\n',
		defaults: { kind: '', q: '', params: '()', ret: ': number' },
		atoms: [...methodAtoms, { name: '?', text: '?', at: 'q', slot: 'optional' }]
	},
	{
		name: 'class method overload',
		kinds: ['method_signature', 'method_signature_plain', 'method_signature_getter', 'method_signature_setter'],
		template: `${BASE}export abstract class A extends B { {mods}{kind}{name}{q}{params}{ret}; {mods}{kind}{name}{q}{params}{ret} { return 1; } }\n`,
		defaults: { kind: '', name: 'm', q: '', params: '()', ret: ': number' },
		atoms: [...methodAtoms, privateName('#m'), { name: '?', text: '?', at: 'q', slot: 'optional' }]
	},
	{
		name: 'abstract method',
		kinds: ['abstract_method_signature', 'abstract_method_signature_plain', 'abstract_method_signature_getter', 'abstract_method_signature_setter'],
		template: `${BASE}export abstract class A extends B { {mods}{kind}{name}{q}{params}{ret}; }\n`,
		defaults: { kind: '', name: 'm', q: '', params: '()', ret: ': number' },
		fixed: ['abstract'],
		atoms: [...methodAtoms, privateName('#m'), { name: '?', text: '?', at: 'q', slot: 'optional' }]
	},
	{
		name: 'interface property',
		kinds: ['property_signature'],
		template: 'export interface I { {mods}x{q}: number; }\n',
		defaults: { q: '' },
		atoms: [...access, mod('static'), mod('override'), mod('readonly'), { name: '?', text: '?', at: 'q', slot: 'optional' }]
	},
	{
		name: 'interface method',
		kinds: ['method_signature', 'method_signature_plain', 'method_signature_getter', 'method_signature_setter'],
		template: 'export interface I { {mods}{kind}m{q}{params}{ret}; }\n',
		defaults: { kind: '', q: '', params: '()', ret: ': number' },
		atoms: [...methodAtoms, { name: '?', text: '?', at: 'q', slot: 'optional' }]
	},
	{
		name: 'class index signature',
		kinds: ['index_signature', 'index_signature_colon'],
		template: 'export class A { {mods}[k: string]: number; }\n',
		defaults: {},
		atoms: [mod('declare'), ...access, mod('static'), mod('override'), mod('readonly')]
	},
	{
		name: 'interface index signature',
		kinds: ['index_signature', 'index_signature_colon'],
		template: 'export interface I { {sign}{mods}[k: string]: number; }\n',
		defaults: { sign: '' },
		atoms: [...access, mod('static'), mod('readonly'), { name: '-', text: '-', at: 'sign', slot: 'sign' }, { name: '+', text: '+', at: 'sign', slot: 'sign' }]
	},
	{
		name: 'construct signature',
		kinds: ['construct_signature'],
		template: 'export interface I { {mods}new (): object }\n',
		defaults: {},
		atoms: [mod('abstract')]
	},
	{
		name: 'constructor type',
		kinds: ['constructor_type'],
		template: 'export type C = {mods}new () => object;\n',
		defaults: {},
		atoms: [mod('abstract')]
	},
	{
		name: 'constructor parameter',
		kinds: ['required_parameter', 'optional_parameter'],
		template: `${BASE}export class A extends B { constructor({mods}{rest}{name}{q}{type}{init}) { super(); } }\n`,
		defaults: { rest: '', name: 'a', q: '', type: ': number', init: '' },
		atoms: [
			...access,
			mod('override'),
			mod('readonly'),
			{ name: '...', text: '...', at: 'rest', slot: 'pattern', one: 'pattern', fill: { type: ': number[]' } },
			{ name: 'pattern', text: '{ a }', at: 'name', slot: 'pattern', one: 'pattern', fill: { type: ': { a: number }' } },
			{ name: '?', text: '?', at: 'q' },
			{ name: 'initializer', text: ' = 1', at: 'init', slot: 'value' }
		]
	},
	{
		name: 'function parameter',
		kinds: ['required_parameter', 'optional_parameter'],
		template: 'export function f({mods}{rest}{name}{q}{type}{init}) {}\n',
		defaults: { rest: '', name: 'a', q: '', type: ': number', init: '' },
		atoms: [
			...access,
			mod('override'),
			mod('readonly'),
			{ name: '...', text: '...', at: 'rest', slot: 'pattern', one: 'pattern', fill: { type: ': number[]' } },
			{ name: 'this', text: 'this', at: 'name', slot: 'pattern', one: 'pattern', fill: { type: ': object' } },
			{ name: '?', text: '?', at: 'q' },
			{ name: 'initializer', text: ' = 1', at: 'init', slot: 'value' }
		]
	},
	{
		name: 'setter parameter',
		kinds: ['setter_parameter', 'required_parameter'],
		template: 'declare const d: any;\nexport class A { set x({deco}{mods}{name}: number) {} }\n',
		defaults: { deco: '', name: 'v' },
		atoms: [...access, mod('override'), mod('readonly'), { name: 'decorator', text: '@d ', at: 'deco', slot: 'decorator' }, { name: 'pattern', text: '{ v }', at: 'name', slot: 'pattern', fill: {} }]
	},
	{
		name: 'class declaration',
		kinds: ['class_declaration', 'abstract_class_declaration'],
		template: 'export {mods}class C {}\n',
		defaults: {},
		atoms: [unslotted('declare'), unslotted('abstract')]
	},
	{
		name: 'enum declaration',
		kinds: ['enum_declaration'],
		template: 'export {mods}enum E { A }\n',
		defaults: {},
		atoms: [unslotted('declare'), mod('const')]
	},
	{
		name: 'for statement',
		kinds: ['for_in_statement'],
		template: 'export async function f(xs: number[]) { for {mods}(const x {op} xs) {} }\n',
		defaults: { op: 'of' },
		atoms: [mod('await'), { name: 'in', text: 'in', at: 'op' }]
	},
	{
		name: 'function type parameter',
		kinds: ['type_parameter'],
		template: 'export function f<{mods}T>(): void {}\n',
		defaults: {},
		atoms: [mod('const'), unslotted('in', 'variance'), unslotted('out', 'variance')]
	},
	{
		name: 'interface type parameter',
		kinds: ['type_parameter'],
		template: 'export interface I<{mods}T> { x?: T }\n',
		defaults: {},
		atoms: [mod('const'), unslotted('in', 'variance'), unslotted('out', 'variance')]
	}
];

const functionModifiers: Atom[] = [
	mod('const', 'modifier'),
	mod('async', 'modifier'),
	mod('unsafe', 'modifier'),
	unslotted('safe'),
	mod('default', 'modifier'),
	{ name: 'extern', text: 'extern "C"', at: 'mods', slot: 'modifier' }
];
const functionKinds = ['function_modifiers', 'function_item', 'function_signature_item'];

const rust: Site[] = [
	{ name: 'free function', kinds: functionKinds, template: 'pub {mods}fn f() {}\n', defaults: {}, atoms: functionModifiers },
	{ name: 'inherent method', kinds: functionKinds, template: 'pub struct S;\nimpl S {\n    pub {mods}fn f() {}\n}\n', defaults: {}, atoms: functionModifiers },
	{
		name: 'trait impl method',
		kinds: functionKinds,
		template: 'pub trait T {\n    fn f();\n}\npub struct S;\nimpl T for S {\n    {mods}fn f() {}\n}\n',
		defaults: {},
		atoms: functionModifiers
	},
	{
		name: 'trait method',
		kinds: functionKinds,
		template: 'pub trait T {\n    {mods}fn f();\n}\n',
		defaults: {},
		atoms: functionModifiers.filter((a) => a.name !== 'default')
	},
	{
		name: 'extern block function',
		kinds: functionKinds,
		template: 'unsafe extern "C" {\n    pub {mods}fn f();\n}\n',
		defaults: {},
		atoms: functionModifiers.filter((a) => a.name !== 'default' && a.name !== 'extern')
	},
	{ name: 'static item', kinds: ['static_item'], template: 'pub static {mods}X: i32 = 1;\n', defaults: {}, atoms: [mod('ref'), mod('mut', 'mutable')] },
	{
		name: 'extern block static',
		kinds: ['static_item'],
		template: 'unsafe extern "C" {\n    pub {pre}static {mods}X: i32;\n}\n',
		defaults: { pre: '' },
		atoms: [mod('ref'), mod('mut', 'mutable'), { name: 'safe', text: 'safe ', at: 'pre', one: 'safety' }, { name: 'unsafe', text: 'unsafe ', at: 'pre', one: 'safety' }]
	},
	{
		name: 'closure',
		kinds: ['closure_expression', 'closure_expression_block', 'closure_expression_expr'],
		template: 'pub fn g() {\n    let _f = {mods}|x: i32| x;\n}\n',
		defaults: {},
		atoms: [mod('static'), mod('async'), mod('move')]
	},
	{ name: 'trait', kinds: ['trait_item'], template: 'pub {mods}trait T {}\n', defaults: {}, atoms: [mod('unsafe'), unslotted('auto')] },
	{
		name: 'self parameter',
		kinds: ['self_parameter'],
		template: 'pub struct S;\nimpl S {\n    pub fn f({mods}self) {}\n}\n',
		defaults: {},
		atoms: [{ name: '&', text: '&', at: 'mods', slot: 'reference' }, mod('mut', 'mutable')]
	}
];

const python: Site[] = [
	{
		name: 'except clause',
		kinds: ['except_clause'],
		template: 'try:\n    pass\nexcept{star}{type}:\n    pass\n',
		defaults: { star: '', type: ' ValueError' },
		atoms: [
			{ name: '*', text: '*', at: 'star', slot: 'group' },
			{ name: 'no type', text: '', at: 'type', slot: 'exception' }
		]
	},
	{
		name: 'function definition',
		kinds: ['function_definition'],
		template: '{mods}def f():\n    {body}\n',
		defaults: { body: 'pass' },
		atoms: [mod('async'), { name: 'yield', text: 'yield 1', at: 'body', slot: 'body' }]
	},
	{
		name: 'async loop',
		kinds: ['for_statement'],
		template: 'async def f(xs, c):\n    {mods}for x in xs:\n        pass\n',
		defaults: {},
		atoms: [mod('async')]
	}
];

export const sites: Record<string, readonly Site[]> = { typescript, rust, python };
