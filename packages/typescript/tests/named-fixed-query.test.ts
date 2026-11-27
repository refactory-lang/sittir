import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const GRAMMAR = typescript;

const PAIRS = [
	{ name: 'object_type_content > automatic_semicolon', holder: typescript.kinds.ObjectTypeContent, token: typescript.kinds.AutomaticSemicolon, source: 'type T = {\n  a: string\n  b: number\n};\n' },
	{ name: 'method_definition_getter > formal_parameters', holder: typescript.kinds.MethodDefinitionGetter, token: typescript.kinds.FormalParametersGetAccessorSignature, source: 'class C { get a() { return 1; } }\n' },
	{ name: 'type_query_call_expression > import', holder: typescript.kinds.TypeQueryCallExpression, token: typescript.kinds.Import, source: "type T = typeof import('a');\n" },
	{ name: 'receiver_parameter_declaration > this', holder: typescript.kinds.ReceiverParameterDeclaration, token: typescript.kinds.This, source: 'function f(this: T) {}\n' },
	{ name: 'abstract_method_signature_getter > formal_parameters', holder: typescript.kinds.AbstractMethodSignatureGetter, token: typescript.kinds.FormalParametersGetAccessorSignature, source: 'abstract class C { abstract get a(): number; }\n' },
	{ name: 'method_signature_getter > formal_parameters', holder: typescript.kinds.MethodSignatureGetter, token: typescript.kinds.FormalParametersGetAccessorSignature, source: 'interface I { get a(): number; }\n' }
];

describe.each(['object', 'arena'] as const)('a named fixed token leaves a query for its holder (%s storage)', (nodeStorage) => {
	it.each(PAIRS)('$name', async ({ holder, token, source }) => {
		using engine = await createEngine(GRAMMAR, { nodeStorage });
		const root = engine.parse(source);
		const descendants = root.$query().$descendants as unknown as { ofType(kind: number): Iterable<unknown> };
		expect([...descendants.ofType(token)]).toHaveLength(0);
		expect([...descendants.ofType(holder)]).toHaveLength(1);
	});
});
