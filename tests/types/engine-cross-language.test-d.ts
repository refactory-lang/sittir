import type { Engine } from '@sittir/types';
import type { RustAPI, RustNode } from '@sittir/rust';
import type { PythonAPI, PythonNode } from '@sittir/python';
import type { TypescriptAPI, TypescriptNode } from '@sittir/typescript';
import type { TypeKeyOf as RustTypeKeyOf, NamespaceMap as RustNamespaceMap } from '../../packages/rust/src/types.ts';
import type { TypeKeyOf as PythonTypeKeyOf, NamespaceMap as PythonNamespaceMap } from '../../packages/python/src/types.ts';
import type {
	TypeKeyOf as TypescriptTypeKeyOf,
	NamespaceMap as TypescriptNamespaceMap
} from '../../packages/typescript/src/types.ts';
import type { TypeKeyOf as ScmTypeKeyOf, NamespaceMap as ScmNamespaceMap } from '../../packages/scm/src/types.ts';
import type { TypeKeyOf as RegexTypeKeyOf, NamespaceMap as RegexNamespaceMap } from '../../packages/regex/src/types.ts';

declare const rust: Engine<RustAPI>;
declare const python: Engine<PythonAPI>;
declare const typescript: Engine<TypescriptAPI>;
declare const rustNode: RustNode;
declare const pythonNode: PythonNode;
declare const typescriptNode: TypescriptNode;

rust.render(rustNode);
python.render(pythonNode);
typescript.render(typescriptNode);

// @ts-expect-error a python node through a rust engine
rust.render(pythonNode);
// @ts-expect-error a typescript node through a rust engine
rust.render(typescriptNode);
// @ts-expect-error a rust node through a python engine
python.render(rustNode);
// @ts-expect-error a typescript node through a python engine
python.render(typescriptNode);
// @ts-expect-error a rust node through a typescript engine
typescript.render(rustNode);
// @ts-expect-error a python node through a typescript engine
typescript.render(pythonNode);

type NoMemberOf<A, B> = [A extends B ? A : never] extends [never] ? true : false;

export const noMemberCrosses: {
	readonly rustInPython: true;
	readonly rustInTypescript: true;
	readonly pythonInRust: true;
	readonly pythonInTypescript: true;
	readonly typescriptInRust: true;
	readonly typescriptInPython: true;
} = null as unknown as {
	readonly rustInPython: NoMemberOf<RustNode, PythonNode>;
	readonly rustInTypescript: NoMemberOf<RustNode, TypescriptNode>;
	readonly pythonInRust: NoMemberOf<PythonNode, RustNode>;
	readonly pythonInTypescript: NoMemberOf<PythonNode, TypescriptNode>;
	readonly typescriptInRust: NoMemberOf<TypescriptNode, RustNode>;
	readonly typescriptInPython: NoMemberOf<TypescriptNode, PythonNode>;
};

type KeysEvery<Keys, NsMap> = [
	Exclude<keyof Keys, keyof NsMap> | Exclude<Extract<keyof NsMap, number>, keyof Keys>
] extends [never]
	? true
	: false;

export const typeKeysCoverTheKindsWithIds: {
	readonly rust: true;
	readonly python: true;
	readonly typescript: true;
	readonly scm: true;
	readonly regex: true;
} = null as unknown as {
	readonly rust: KeysEvery<RustTypeKeyOf, RustNamespaceMap>;
	readonly python: KeysEvery<PythonTypeKeyOf, PythonNamespaceMap>;
	readonly typescript: KeysEvery<TypescriptTypeKeyOf, TypescriptNamespaceMap>;
	readonly scm: KeysEvery<ScmTypeKeyOf, ScmNamespaceMap>;
	readonly regex: KeysEvery<RegexTypeKeyOf, RegexNamespaceMap>;
};
