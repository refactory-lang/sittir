/**
 * Type-level pins for what a builder admits where a slot names a node: a
 * node of the slot's kinds, built, parsed or a draft, checked by kind; never
 * a node of another kind, and never the storage shape.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

export function draftsIntoBuilders(): string[] {
	const fn = ts.parse('function f(a) { a; }\n').statements()[0]!;
	if (!ts.is.functionDeclaration(fn)) return [];
	const body = fn.body();
	const draftBody = body.$with.statements(...body.statements());
	const params = fn.parameters();
	const elements = params.elements();
	if (elements === undefined || !ts.is.formalParametersElements(elements)) return [];
	const [first, ...rest] = elements;
	if (first === undefined) return [];
	const draftParams = params.$with.elements(ts.build.formalParametersElements(first, ...rest));
	return [
		ts.build.functionDeclaration({ name: 'g', parameters: ts.build.formalParameters(), body: draftBody }).$render(),
		ts.build.functionDeclaration({ name: 'g', parameters: draftParams, body: ts.build.statementBlock() }).$render(),
		ts.build.functionDeclaration.strict({ name: ts.build.identifier('g'), parameters: draftParams, body: draftBody }).$render(),
		ts.build.statementBlock({ statements: [body.statements()[0]!] }).$render()
	];
}

export function wrongKindRefused(): void {
	// @ts-expect-error a FormalParameters node is not a StatementBlock
	ts.build.functionDeclaration({ name: 'g', parameters: ts.build.formalParameters(), body: ts.build.formalParameters() });
	// @ts-expect-error a FormalParameters node is not a StatementBlock
	ts.build.functionDeclaration.strict({ name: ts.build.identifier('g'), parameters: ts.build.formalParameters(), body: ts.build.formalParameters() });
}

export function listBuilderOptionsRefuseNodes(): void {
	const fn = ts.parse('function f(a) {}\n').statements()[0]!;
	if (!ts.is.functionDeclaration(fn)) return;
	// @ts-expect-error a FormalParameters list is not the options bag of type arguments
	ts.build.typeArguments(fn.parameters(), ts.build.identifier('T'));
}

export function storageShapeRefused(storage: T.StatementBlock): void {
	const fn = ts.build.functionDeclaration({ name: 'g', parameters: ts.build.formalParameters(), body: ts.build.statementBlock() });
	// @ts-expect-error the storage interface is not a node
	ts.build.functionDeclaration.strict({ name: ts.build.identifier('g'), parameters: ts.build.formalParameters(), body: storage });
	// @ts-expect-error a storage-shaped literal is not a node
	ts.build.functionDeclaration.strict({ name: ts.build.identifier('g'), parameters: ts.build.formalParameters(), body: { $type: ts.kinds.StatementBlock } });
	// @ts-expect-error the storage interface is not a node
	fn.$with.body(storage);
	// @ts-expect-error a storage-shaped literal is not a node
	fn.$with.body({ $type: ts.kinds.StatementBlock });
}

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function aliasContentNamesBuiltForms(): void {
	expectTrue<Equals<T.TypeIdentifier.Types, T.Identifier.Bound>>();
}

export function optionsAndValueKeepTheirPlaces(): void {
	const statement = ts.build.expressionStatement.strict(ts.build.identifier('x'));
	// @ts-expect-error the static block takes its body first; a terminator object is not a StatementBlock
	ts.build.classStaticBlock.strict({ terminator: ts.kinds.AutomaticSemicolon }, statement);
	// @ts-expect-error a statement is not the static block's options
	ts.build.classStaticBlock.strict(ts.build.statementBlock.strict(statement), statement);
	ts.build.classStaticBlock.strict(ts.build.statementBlock.strict(statement), { terminator: ts.kinds.AutomaticSemicolon });
}
