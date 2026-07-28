/**
 * dsl/field.ts — sittir field shadow with one-arg placeholder form.
 *
 * Tree-sitter's baseline `field()` takes two args: `field(name, content)`.
 * Sittir's transform() patches need a one-arg form so authors can write:
 *
 *     transform(original, { 0: field('expression') })
 *
 * Two-arg calls delegate to whichever `field` is provided as a global
 * by the runtime — sittir's grammarFn-injected field (`{type:'FIELD'}`)
 * in sittir's pipeline, or tree-sitter's native field (same shape) when
 * the transpiled grammar.js is loaded by tree-sitter's CLI. This keeps
 * the same call site valid for both consumers.
 *
 * One-arg calls return a sittir-only placeholder marker that
 * `transform()`'s resolvePatch swaps out before the result reaches
 * the runtime's grammar() processing. The marker never escapes into
 * a final grammar tree.
 *
 * Import explicitly when you want the one-arg form:
 *
 *     import { field } from '@sittir/codegen/dsl'
 */

import type { Rule } from '../../types/rule.ts';
import type { FieldLike } from '../../types/runtime-shapes.ts';
import { wireRegisterSyntheticInline, wireRegisterSyntheticRule } from '../wire/wire.ts';
import { isStringType, isOptionalType, isChoiceType } from '../../types/runtime-shapes.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { makeRuleMetadata } from '../rule-metadata.ts';

export function maybeKeywordSymbol(
	fieldName: string,
	content: unknown,
	wrapSyntheticBody?: (body: RuntimeRule) => RuntimeRule
): unknown {
	const c = content as { type?: string; value?: string };
	if (!c || typeof c.type !== 'string') return content;

	// Bare STRING — synthesize the hidden rule and return a SYMBOL ref.
	if (isStringType(c.type)) {
		return synthesizeKwSymbol(fieldName, content, wrapSyntheticBody);
	}

	// OPTIONAL(STRING) — descend through the wrapper, recurse into
	// content, and rebuild the optional around the new SYMBOL ref.
	// Tree-sitter's FIELD(OPTIONAL(SYMBOL)) survives; FIELD(OPTIONAL(STRING))
	// may not.
	if (isOptionalType(c.type)) {
		return descendOptional(fieldName, content, wrapSyntheticBody, 'optional');
	}

	// CHOICE(STRING, BLANK) is tree-sitter's normalized form for
	// `optional(STRING)`. Detect the shape and treat as optional.
	if (isChoiceType(c.type)) {
		const members = (content as { members?: Array<{ type?: string }> }).members;
		if (Array.isArray(members) && members.length === 2) {
			const blankIdx = members.findIndex((m) => m?.type === 'BLANK');
			if (blankIdx !== -1) {
				return descendOptional(fieldName, content, wrapSyntheticBody, 'choice-blank');
			}
		}
		return content;
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

function descendOptional(
	fieldName: string,
	content: unknown,
	wrapSyntheticBody: ((body: RuntimeRule) => RuntimeRule) | undefined,
	wrapperKind: 'optional' | 'choice-blank'
): unknown {
	let inner: unknown;
	if (wrapperKind === 'optional') {
		inner = (content as { content?: unknown }).content;
	} else {
		const members = (content as { members: Array<{ type?: string }> }).members;
		const nonBlank = members.find((m) => m.type !== 'BLANK');
		inner = nonBlank;
	}

	const rewritten = maybeKeywordSymbol(fieldName, inner, wrapSyntheticBody);
	if (rewritten === inner) return content;

	// Rebuild the wrapper around the rewritten inner.
	if (wrapperKind === 'optional') {
		const nativeOptional = (globalThis as { optional?: (c: unknown) => unknown }).optional;
		if (typeof nativeOptional !== 'function') return content;
		return nativeOptional(rewritten);
	}
	// choice-blank: reconstruct the CHOICE preserving the BLANK position.
	const c = content as { type: string; members: Array<{ type?: string }> };
	const newMembers = c.members.map((m) => (m.type === 'BLANK' ? m : (rewritten as typeof m)));
	return { ...c, members: newMembers };
}

type Input = string | RegExp | Rule;

/** Marker emitted by `field('name')` — a placeholder for transform patches. */
export interface FieldPlaceholder {
	readonly __sittirPlaceholder: 'field';
	readonly name: string;
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
