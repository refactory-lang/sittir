import type { Rule } from '../../types/rule.ts';
import type { FieldLike } from '../../types/runtime-shapes.ts';
import { wireRegisterSyntheticInline, wireRegisterSyntheticRule } from '../wire/wire.ts';
import { isStringType } from '../../types/runtime-shapes.ts';
import { optionalContentOf, withOptionalContent } from '../rule-patterns.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { makeRuleMetadata } from '../rule-metadata.ts';

export function maybeKeywordSymbol(
	fieldName: string,
	content: unknown,
	wrapSyntheticBody?: (body: RuntimeRule) => RuntimeRule
): unknown {
	const c = content as { type?: string; value?: string };
	if (!c || typeof c.type !== 'string') return content;

	if (isStringType(c.type)) {
		return synthesizeKwSymbol(fieldName, content, wrapSyntheticBody);
	}

	const optional = optionalContentOf(c as { type: string });
	if (optional !== undefined) {
		const rewritten = maybeKeywordSymbol(fieldName, optional, wrapSyntheticBody);
		return rewritten === optional ? content : withOptionalContent(c as { type: string }, rewritten as { type: string });
	}

	return content;
}

function synthesizeKwSymbol(
	fieldName: string,
	content: unknown,
	wrapSyntheticBody: ((body: RuntimeRule) => RuntimeRule) | undefined
): unknown {
	const hiddenName = `_kw_${fieldName}`;
	let body = content as RuntimeRule;
	if (wrapSyntheticBody) body = wrapSyntheticBody(body);
	if (!wireRegisterSyntheticRule(hiddenName, body)) {
		throw new Error(
			`field('${fieldName}', <STRING>): no active wire() context — call must occur inside a rule callback wrapped by wire()`
		);
	}
	wireRegisterSyntheticInline(hiddenName);
	return {
		type: 'SYMBOL',
		name: hiddenName
	};
}

type Input = string | RegExp | Rule;

export interface FieldPlaceholder<N extends string = string> {
	readonly __sittirPlaceholder: 'field';
	readonly name: N;
}

export function isFieldPlaceholder(v: unknown): v is FieldPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'field';
}

export function field(name: string, content?: Input): FieldPlaceholder | FieldLike {
	if (content === undefined) {
		return {
			__sittirPlaceholder: 'field' as const,
			name
		} satisfies FieldPlaceholder;
	}
	const native = (globalThis as { field?: (n: string, c: Input) => unknown }).field;
	if (typeof native !== 'function') {
		throw new Error(
			'field(): no global field() found — must be called inside a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)'
		);
	}
	return buildTwoArgFieldResult(native, name, content);
}

function buildTwoArgFieldResult(native: (n: string, c: Input) => unknown, name: string, content: Input): FieldLike {
	const initial = native(name, content) as FieldLike & { content?: unknown };
	const inner = initial.content;
	const symbolized = maybeKeywordSymbol(name, inner);
	const metadata = makeRuleMetadata({ fieldSource: 'override' });
	if (symbolized !== inner) {
		const reconstructed = native(name, symbolized as Input) as FieldLike;
		return {
			...reconstructed,
			metadata
		};
	}
	return { ...initial, metadata };
}
