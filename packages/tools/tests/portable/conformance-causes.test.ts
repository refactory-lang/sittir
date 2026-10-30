import { describe, expect, it } from 'vitest';
import { parseTypeCheckDiagnostics } from '@sittir/codegen';
import { classify } from '../../src/portable/conformance.ts';

const MODULE = 'packages/rust/.sittir/portable.typed.ts';

const causeOf = (...lines: string[]): string => {
	const { causes } = classify(parseTypeCheckDiagnostics(lines.join('\n')), MODULE, []);
	const counted = causes.filter((cause) => cause.count > 0);
	expect(counted.length, JSON.stringify(counted)).toBe(1);
	return counted[0]!.name;
};

describe('portable conformance causes', () => {
	it('counts a list read into a one-value member as arity', () => {
		expect(
			causeOf(
				`${MODULE}(10,3): error TS2322: Type '(this: Held<Parsed>) => readonly ViewForm<Predicate<Ctx>>[] | undefined' is not assignable to type '() => ViewForm<Where<Ctx>> | undefined'.`,
				"  Type 'readonly ViewForm<Predicate<Ctx>>[]' is missing the following properties from type 'PortableHandle': $type, [low], [flags]"
			)
		).toBe('arity');
	});

	it('counts one value read into a list member as arity', () => {
		expect(
			causeOf(
				`${MODULE}(10,3): error TS2322: Type '(this: Held<Parsed>) => ViewForm<Parameter<Ctx>>' is not assignable to type '() => readonly (ViewForm<Parameter<Ctx>> | ViewForm<Variadic<Ctx>>)[]'.`,
				"  Type 'ViewForm<Parameter<Ctx>>' is missing the following properties from type 'readonly (ViewForm<Parameter<Ctx>> | ViewForm<Variadic<Ctx>>)[]': length, concat, join, slice"
			)
		).toBe('arity');
	});

	it('counts an unmapped marker read where a view is wanted as unmapped, not arity', () => {
		expect(
			causeOf(
				`${MODULE}(10,3): error TS2322: Type '(this: Held<Parsed>) => Unmapped<"rust:token_tree">' is not assignable to type '() => ViewForm<Macro<Ctx>>'.`,
				"  Type 'Unmapped<\"rust:token_tree\">' is missing the following properties from type 'PortableHandle': $type, [low], [flags]"
			)
		).toBe('unmapped');
	});

	it('counts a required member the literal lacks as a missing member', () => {
		expect(
			causeOf(
				`${MODULE}(10,2): error TS2322: Type '{ $type: TSKindId; [low]: T.BinaryExpression.Parsed; [flags]: number; }' is not assignable to type 'ViewForm<Binary<Ctx>>'.`,
				"  Property 'operator' is missing in type '{ $type: TSKindId; [low]: T.BinaryExpression.Parsed; [flags]: number; }' but required in type '{ readonly operator: () => string; }'."
			)
		).toBe('missing member');
	});

	it('counts a read that can be absent where the member is required as absent', () => {
		expect(
			causeOf(
				`${MODULE}(10,3): error TS2322: Type '(this: Held<Parsed>) => ViewForm<Block<Ctx>> | undefined' is not assignable to type '() => ViewForm<Block<Ctx>>'.`,
				"  Type 'undefined' is not assignable to type 'ViewForm<Block<Ctx>>'."
			)
		).toBe('absent');
	});

	it('counts a reader typed unknown as an untyped reader', () => {
		expect(
			causeOf(
				`${MODULE}(10,3): error TS2322: Type '(this: Held<Parsed>) => unknown' is not assignable to type '() => string'.`,
				"  Type 'unknown' is not assignable to type 'string'."
			)
		).toBe('untyped reader');
	});

	it('counts a fit check as context fill, and an error elsewhere as outside', () => {
		expect(causeOf(`${MODULE}(40,13): error TS2344: Type '"bool"' does not satisfy the constraint 'Abstract<Ctx>'.`)).toBe('context fill');
		expect(causeOf("packages/common/src/metrics.ts(13,31): error TS2591: Cannot find name 'node:fs'.")).toBe('outside');
	});
});
