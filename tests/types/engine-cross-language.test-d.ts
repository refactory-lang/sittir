import type { Engine, LanguageAPI } from '@sittir/types';
import type { RustNode, SourceFile } from '@sittir/rust';
import type { Module, PythonNode } from '@sittir/python';
import type { Program, TypescriptNode } from '@sittir/typescript';

interface NodesOf<Name extends string, Node extends RustNode | PythonNode | TypescriptNode, Root extends Node>
	extends LanguageAPI {
	readonly name: Name;
	readonly build: object;
	readonly is: object;
	readonly kinds: object;
	readonly types: object;
	readonly root: Root;
	readonly node: Node;
	readonly options: object;
}

declare const rust: Engine<NodesOf<'rust', RustNode, SourceFile>>;
declare const python: Engine<NodesOf<'python', PythonNode, Module>>;
declare const typescript: Engine<NodesOf<'typescript', TypescriptNode, Program>>;
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
