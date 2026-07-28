/**
 * dsl/transform-path.ts — path addressing for transform() patches.
 *
 * Path strings use forward-slash delimiters. Segment forms:
 *
 *   'N'         → positional index (0-based)
 *   '-N'        → reverse index from the end (-1 = last member)
 *   '_'         → wildcard — matches every sibling at this level
 *   '(name)'    → kind-match — finds every occurrence of symbol `name`
 *                 in the current subtree, skipping pre-fielded ones
 *   'name:'     → field traversal — descends through a field('name', ...)
 *                 wrapper at the current position (hard-errors on mismatch)
 *
 * Examples:
 *   '0'              → first position of the top-level seq
 *   '0/1/2'          → nested descent by positional indices
 *   '0/_/1'          → position 1 of every branch at level 1 under pos 0
 *   '(_expression)'  → every `_expression` symbol in the subtree
 *   '2/elements:'    → descend into field('elements', ...) at position 2
 *
 * Migration notes:
 *   '*' → '_'         (wildcard)
 *   'name' → '(name)' (kind-match)
 *
 * Rules:
 * - No leading slash (`/0` is invalid).
 * - No trailing slash.
 * - `_` wildcard matches a single level only — not recursive.
 * - Out-of-bounds paths and zero-match wildcards are hard errors at
 *   apply time (with the path + actual rule shape in the message).
 */

import {
	isPrecWrapper as isPrecWrapperShape,
	isContainerType,
	isWrapperType,
	isSeqType,
	isChoiceType,
	isFieldType
} from '../../types/runtime-shapes.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

// ---------------------------------------------------------------------------
// Native DSL accessors — we call the runtime-injected DSL functions
// (sittir's grammarFn-injected globals OR tree-sitter CLI's native
// globals) instead of reconstructing rule objects directly. This keeps
// the rule shape consistent with whichever runtime is processing the
// transform call, and runs whatever normalization the runtime does.
// ---------------------------------------------------------------------------

interface RuntimeDsl {
	seq?: (...members: RuntimeRule[]) => RuntimeRule;
	choice?: (...members: RuntimeRule[]) => RuntimeRule;
	optional?: (content: RuntimeRule) => RuntimeRule;
	repeat?: (content: RuntimeRule) => RuntimeRule;
	repeat1?: (content: RuntimeRule) => RuntimeRule;
	field?: (name: string, content: RuntimeRule) => RuntimeRule;
	prec?: ((value: number, content: RuntimeRule) => RuntimeRule) & {
		left?: (value: number, content: RuntimeRule) => RuntimeRule;
		right?: (value: number, content: RuntimeRule) => RuntimeRule;
		dynamic?: (value: number, content: RuntimeRule) => RuntimeRule;
	};
}

function dsl(): RuntimeDsl {
	return globalThis as unknown as RuntimeDsl;
}

function nativeRequired<K extends keyof RuntimeDsl>(name: K): NonNullable<RuntimeDsl[K]> {
	const fn = dsl()[name];
	if (typeof fn !== 'function') {
		throw new Error(
			`transform: no global ${String(name)}() found — must be called inside a runtime that injects ${String(name)}() (sittir evaluate.ts or tree-sitter CLI)`
		);
	}
	return fn as NonNullable<RuntimeDsl[K]>;
}

export type PathSegment =
	| { kind: 'index'; value: number }
	| { kind: 'wildcard' }
	| {
			kind: 'kind-match';
			name: string;
	  }
	| {
			kind: 'fieldName';
			name: string;
	  };

export class ApplyPathSkip extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ApplyPathSkip';
	}
}

export function parsePath(pathStr: string): PathSegment[] {
	if (typeof pathStr !== 'string' || pathStr.length === 0) {
		throw new Error(`parsePath: path must be a non-empty string, got ${JSON.stringify(pathStr)}`);
	}
	if (pathStr.startsWith('/') || pathStr.endsWith('/')) {
		throw new Error(`parsePath: leading/trailing slash not allowed in path '${pathStr}'`);
	}
	const parts = pathStr.split('/');
	const segments: PathSegment[] = [];
	for (const part of parts) {
		if (part === '_') {
			// Wildcard syntax.
			segments.push({ kind: 'wildcard' });
		} else if (/^-?\d+$/.test(part)) {
			segments.push({ kind: 'index', value: Number(part) });
		} else if (/^\([A-Za-z_][A-Za-z0-9_]*\)$/.test(part)) {
			// Kind-match syntax: (name).
			segments.push({ kind: 'kind-match', name: part.slice(1, -1) });
		} else if (/^[A-Za-z_][A-Za-z0-9_]*:$/.test(part)) {
			// Field-traversal syntax: name:.
			segments.push({ kind: 'fieldName', name: part.slice(0, -1) });
		} else if (part === '*') {
			throw new Error(`parsePath: path segment '*' is no longer valid — use '_' for wildcard; see ADR-0010`);
			// ASCII-identifier shape — kept inline (NOT util/isAsciiIdentifier): this file is bundled into the transpiled grammar.js override runtime, so importing the util would pull it into that generated artifact.
		} else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)) {
			throw new Error(
				`parsePath: bare kind name '${part}' is no longer valid as a path segment — use '(${part})' instead; see ADR-0010`
			);
		} else {
			throw new Error(
				`parsePath: invalid segment '${part}' in path '${pathStr}' — must be a numeric index, '_' (wildcard), '(name)' (kind-match), or 'name:' (field traversal)`
			);
		}
	}
	return segments;
}

/**
 * Apply a patch at one or more positions inside a rule tree, addressed
 * by a parsed path. Returns a new rule (no mutation). Wildcards expand
 * to every matching sibling at that level.
 *
 * The patch may be either a Rule (replace the target) or a function
 * `(originalMember: Rule) => Rule` for in-place wrapping.
 *
 * Throws on out-of-bounds indices or zero-match wildcards.
 */
// Local accessors for the container/wrapper field shapes RuntimeRule
// doesn't expose structurally. Consolidated so the casts live in one
// spot rather than scattered through applyPath's branches.
const membersOf = (r: RuntimeRule): RuntimeRule[] => (r as unknown as { members: RuntimeRule[] }).members;
const contentOf = (r: RuntimeRule): RuntimeRule => (r as unknown as { content: RuntimeRule }).content;

export function applyPath(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	if (segments.length === 0) {
		// Reached the target position — apply the patch.
		return typeof patch === 'function' ? patch(rule, precStack) : patch;
	}

	if (isPrecWrapperShape(rule)) {
		return descendThroughPrecWrapper(rule, segments, patch, precStack);
	}

	// Enrich group-lift symbols are transparent to path addressing, like prec
	// wrappers. enrich hoists `optional(seq)` / `repeat(seq)` into a SYMBOL ref
	// tagged `metadata.author === 'enrich'` (debt: source-homonym resolution,
	// decision 6 — was `metadata.source === 'enrich'`) that carries the hoisted
	// seq body on `content`. An authored patch whose path was written against the pre-hoist
	// seq must travel THROUGH the symbol into that body. We descend without
	// consuming a segment (transparent) and rebuild the symbol around the patched
	// body. Works in both runtimes (sittir evaluate + tree-sitter generate)
	// because the tag + body ride the symbol object itself — no rule-map resolver.
	if (isEnrichGroupLiftSymbol(rule)) {
		return descendThroughGroupLiftSymbol(rule, segments, patch, precStack);
	}

	// Enrich content-aliases are ALSO transparent to path addressing. enrich
	// wraps an inline-unsafe `optional(seq)` / bare `choice` in
	// `alias(<content>, $.<name>)` (the visible-kind form) tagged
	// `metadata.author === 'enrich'` (was `metadata.source === 'enrich'`,
	// decision 6). enrich runs BEFORE the authored
	// transform()/variant()/groups path-patches, so a patch whose path was
	// written against the pre-alias content must travel THROUGH the alias into
	// that content. Without this, `descendThroughAlias` (single-content, index 0
	// only) rejects any index ≥1 a real patch uses (e.g. rust visibility_modifier
	// `1/1/0/1/3`). We descend into `content` WITHOUT consuming a segment
	// (transparent, like prec / the group-lift symbol) and rebuild the alias.
	if (isEnrichContentAlias(rule)) {
		return descendThroughEnrichContentAlias(rule, segments, patch, precStack);
	}

	const [head, ...rest] = segments;
	const t = rule.type;

	switch (head!.kind) {
		case 'kind-match':
			return dispatchKindMatch(rule, head!.name, rest, patch, precStack);

		case 'fieldName':
			return descendThroughNamedField(rule, head!.name, rest, patch, precStack);

		case 'index':
		case 'wildcard': {
			// Containers we can descend into — predicates in runtime-shapes.ts
			// work across both the sittir and tree-sitter-CLI runtimes.
			if (isContainerType(t)) {
				return applyToMembers(rule, head!, rest, patch, precStack);
			}
			if (isWrapperType(t)) {
				return descendThroughSingleWrapper(rule, head!, rest, patch, precStack);
			}
			if (t === 'ALIAS') {
				return descendThroughAlias(rule, head!, rest, patch, precStack);
			}
			throw new ApplyPathSkip(
				`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`
			);
		}

		default: {
			// Exhaustiveness guard — TypeScript narrows `head` to `never` here.
			const _exhaustive: never = head;
			throw new Error(`applyPath: unknown segment kind '${(_exhaustive as PathSegment).kind}'`);
		}
	}
}

function descendThroughPrecWrapper(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const newStack = precStack ? [...precStack, rule] : [rule];
	const newContent = applyPath(contentOf(rule), segments, patch, newStack);
	return reconstructPrec(rule, newContent);
}

function isEnrichGroupLiftSymbol(rule: RuntimeRule): boolean {
	// MUST be a SYMBOL — an enrich content-alias (`alias(<content>, $.<name>)`)
	// also carries `metadata.author === 'enrich'` but is handled separately by
	// `isEnrichContentAlias` / `descendThroughEnrichContentAlias`. Without the
	// type guard, an alias would match here and `descendThroughGroupLiftSymbol`
	// would throw "group-lift symbol has no name" (an alias has no `.name`).
	const t = (rule as { type?: string }).type;
	if (t !== 'SYMBOL') return false;
	const meta = (rule as unknown as { metadata?: { author?: string } }).metadata;
	return meta?.author === 'enrich';
}

export interface GroupLiftRuleMap {
	get(name: string): RuntimeRule | undefined;
	set(name: string, body: RuntimeRule): void;
}

let groupLiftRuleMap: GroupLiftRuleMap | undefined;

export function setGroupLiftRuleMap(map: GroupLiftRuleMap | undefined): void {
	groupLiftRuleMap = map;
}

export function getGroupLiftRuleBody(name: string): RuntimeRule | undefined {
	return groupLiftRuleMap?.get(name);
}

function descendThroughGroupLiftSymbol(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const name = (rule as unknown as { name?: string }).name;
	if (!name) {
		throw new ApplyPathSkip('applyPath: enrich group-lift symbol has no name to resolve its body');
	}
	const body = groupLiftRuleMap?.get(name);
	if (body === undefined) {
		throw new ApplyPathSkip(
			`applyPath: enrich group-lift symbol '${name}' — referenced rule not found in the group-lift rule map ` +
				`(enrich resolver not registered, or the name was pruned)`
		);
	}
	const newBody = applyPath(body, segments, patch, precStack);
	groupLiftRuleMap?.set(name, newBody);
	return rule;
}

function isEnrichContentAlias(rule: RuntimeRule): boolean {
	const t = (rule as { type?: string }).type;
	if (t !== 'ALIAS') return false;
	const meta = (rule as unknown as { metadata?: { author?: string } }).metadata;
	return meta?.author === 'enrich';
}

function descendThroughEnrichContentAlias(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const body = (rule as unknown as { content?: RuntimeRule }).content;
	if (body === undefined) {
		throw new ApplyPathSkip('applyPath: enrich content-alias has no content to travel through');
	}
	const newBody = applyPath(body, segments, patch, precStack);
	return { ...(rule as unknown as Record<string, unknown>), content: newBody } as unknown as RuntimeRule;
}

function descendThroughSingleWrapper(
	rule: RuntimeRule,
	head: PathSegment,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	switch (head.kind) {
		case 'wildcard': {
			const newContent = applyPath(contentOf(rule), rest, patch, precStack);
			return reconstructWrapper(rule, newContent);
		}
		case 'index': {
			if (head.value === 0 || head.value === -1) {
				const newContent = applyPath(contentOf(rule), rest, patch, precStack);
				return reconstructWrapper(rule, newContent);
			}
			throw new ApplyPathSkip(
				`applyPath: index ${head.value} out of bounds — '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
			);
		}
		case 'kind-match':
		case 'fieldName': {
			// Dispatched before reaching descendThroughSingleWrapper — should never arrive here.
			throw new Error(
				`descendThroughSingleWrapper: unexpected segment kind '${head.kind}' — this is a bug in applyPath dispatch`
			);
		}
		default: {
			const _exhaustive: never = head;
			throw new Error(
				`descendThroughSingleWrapper: unexpected segment ${JSON.stringify(_exhaustive)} — this is a bug in applyPath dispatch`
			);
		}
	}
}

function descendThroughAlias(
	rule: RuntimeRule,
	head: PathSegment,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	switch (head.kind) {
		case 'wildcard': {
			const newContent = applyPath(contentOf(rule), rest, patch, precStack);
			return reconstructAlias(rule, newContent);
		}
		case 'index': {
			if (head.value === 0 || head.value === -1) {
				const newContent = applyPath(contentOf(rule), rest, patch, precStack);
				return reconstructAlias(rule, newContent);
			}
			throw new ApplyPathSkip(
				`applyPath: index ${head.value} out of bounds — '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
			);
		}
		case 'kind-match':
		case 'fieldName': {
			throw new Error(
				`descendThroughAlias: unexpected segment kind '${head.kind}' — this is a bug in applyPath dispatch`
			);
		}
		default: {
			const _exhaustive: never = head;
			throw new Error(
				`descendThroughAlias: unexpected segment ${JSON.stringify(_exhaustive)} — this is a bug in applyPath dispatch`
			);
		}
	}
}

function reconstructAlias(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
	return {
		...(rule as unknown as Record<string, unknown>),
		content: newContent
	} as unknown as RuntimeRule;
}

function descendThroughNamedField(
	rule: RuntimeRule,
	fieldName: string,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	if (!isFieldType(rule.type)) {
		throw new Error(
			`applyPath: path segment '${fieldName}:' at this level expects a field('${fieldName}', ...) wrapper; got type '${rule.type}'`
		);
	}
	const actualName = (rule as unknown as { name: string }).name;
	if (actualName !== fieldName) {
		throw new Error(
			`applyPath: path segment '${fieldName}:' doesn't match field name '${actualName}' at this position`
		);
	}
	const newContent = applyPath(contentOf(rule), rest, patch, precStack);
	return reconstructWrapper(rule, newContent);
}

function dispatchKindMatch(
	rule: RuntimeRule,
	kindName: string,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	return applyKindMatch(rule, kindName, rest, patch, precStack, false);
}

function applyKindMatch(
	rule: RuntimeRule,
	targetKind: string,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined,
	insideNamedField: boolean
): RuntimeRule {
	// Track whether we matched anything so callers can error on zero.
	const result = walkKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField);
	if (!result.matched) {
		throw new ApplyPathSkip(`applyPath: kind '${targetKind}' matched zero occurrences in this subtree`);
	}
	return result.rule;
}

function applyKindMatchToSymbol(
	rule: RuntimeRule,
	targetKind: string,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined,
	insideNamedField: boolean
): { rule: RuntimeRule; matched: boolean } {
	const name = (rule as unknown as { name: string }).name;
	if (name !== targetKind) return { rule, matched: false };
	if (insideNamedField) return { rule, matched: false };
	const patched =
		rest.length === 0
			? typeof patch === 'function'
				? patch(rule, precStack)
				: patch
			: applyPath(rule, rest, patch, precStack);
	return { rule: patched, matched: true };
}

function walkKindMatch(
	rule: RuntimeRule,
	targetKind: string,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined,
	insideNamedField: boolean
): { rule: RuntimeRule; matched: boolean } {
	if (!isWalkableNode(rule)) {
		return { rule, matched: false };
	}
	const t = rule.type;

	// Prec wrappers are transparent.
	if (isPrecWrapperShape(rule)) {
		const stack = precStack ? [...precStack, rule] : [rule];
		const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, stack, insideNamedField);
		return {
			rule: inner.matched ? reconstructPrec(rule, inner.rule) : rule,
			matched: inner.matched
		};
	}

	if (t === 'SYMBOL') {
		return applyKindMatchToSymbol(rule, targetKind, rest, patch, precStack, insideNamedField);
	}

	// Field: descend into content but mark insideNamedField=true so nested
	// `_expression` references inside already-fielded symbols don't get
	// re-wrapped.
	if (t === 'FIELD') {
		const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, true);
		return {
			rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
			matched: inner.matched
		};
	}

	// Other wrappers — descend transparently.
	if (isWrapperType(t)) {
		const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, insideNamedField);
		return {
			rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
			matched: inner.matched
		};
	}

	// Containers — descend into every member.
	if (isContainerType(t)) {
		const members = [...membersOf(rule)];
		let anyMatched = false;
		for (let i = 0; i < members.length; i++) {
			const inner = walkKindMatch(members[i]!, targetKind, rest, patch, precStack, insideNamedField);
			if (inner.matched) {
				members[i] = inner.rule;
				anyMatched = true;
			}
		}
		return {
			rule: anyMatched ? reconstructContainer(rule, members) : rule,
			matched: anyMatched
		};
	}

	// Leaf types we don't descend into (string, pattern, blank, etc.).
	return { rule, matched: false };
}

function isWalkableNode(rule: unknown): rule is RuntimeRule {
	return (
		rule !== null &&
		rule !== undefined &&
		typeof rule === 'object' &&
		typeof (rule as { type?: unknown }).type === 'string'
	);
}

export function reconstructContainer(rule: RuntimeRule, members: RuntimeRule[]): RuntimeRule {
	const t = rule.type;
	if (isSeqType(t)) return nativeRequired('seq')(...members);
	if (isChoiceType(t)) return nativeRequired('choice')(...members);
	throw new Error(`reconstructContainer: unknown container type '${t}'`);
}

export function reconstructWrapper(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
	const t = rule.type;
	if (t === 'OPTIONAL') return nativeRequired('optional')(newContent);
	if (t === 'REPEAT' || t === 'REPEAT1') {
		return reconstructRepeatWithMetadata(rule, newContent);
	}
	if (isFieldType(t)) {
		const name = (rule as unknown as { name: string }).name;
		return nativeRequired('field')(name, newContent);
	}
	throw new Error(
		`reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' — this is a bug in the path-descent logic.`
	);
}

function reconstructRepeatWithMetadata(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
	const r = rule as {
		type: string;
		separator?: unknown;
		leading?: unknown;
		trailing?: unknown;
	};
	const t = r.type;
	const baseNode = nativeRequired(t === 'REPEAT' ? 'repeat' : 'repeat1')(newContent) as Record<string, unknown>;
	if (r.separator !== undefined) baseNode.separator = r.separator;
	if (r.leading !== undefined) baseNode.leading = r.leading;
	if (r.trailing !== undefined) baseNode.trailing = r.trailing;
	return baseNode as unknown as RuntimeRule;
}

/**
 * Reconstruct a precedence wrapper via the runtime's native prec.left/
 * prec.right/prec.dynamic/prec function. Preserves the precedence
 * value so tree-sitter's parser-generator can resolve conflicts the
 * same way as the base grammar.
 */
const PREC_VARIANT_MAP = {
	PREC_LEFT: 'left',
	PREC_RIGHT: 'right',
	PREC_DYNAMIC: 'dynamic'
} as const;

export function reconstructPrec(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
	const t = rule.type;
	const value = (rule as { value?: number }).value ?? 0;
	const prec = nativeRequired('prec');
	const variant = PREC_VARIANT_MAP[t as keyof typeof PREC_VARIANT_MAP];
	if (variant) {
		const fn = prec[variant];
		if (typeof fn !== 'function') throw new Error(`transform: native prec.${variant} not available`);
		return fn(value, newContent);
	}
	return prec(value, newContent);
}

export function wrapInPrecStack(
	content: RuntimeRule,
	precStack: readonly RuntimeRule[] | undefined,
	reconstructPrec: (wrapper: RuntimeRule, newContent: RuntimeRule) => RuntimeRule
): RuntimeRule {
	if (!precStack?.length) return content;
	let result = content;
	for (let i = precStack.length - 1; i >= 0; i--) {
		result = reconstructPrec(precStack[i]!, result);
	}
	return result;
}

// Re-export so transform.ts's `applyFlatPatches` can reach the
// shared predicates through the canonical path-related module.
export { isContainerType, isWrapperType, isPrecWrapperShape as isPrecWrapper };

function applyToMembers(
	rule: RuntimeRule,
	head: PathSegment,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	const members = [...membersOf(rule)];

	switch (head.kind) {
		case 'index':
			return applyToIndexedMember(rule, members, head.value, rest, patch, precStack);

		case 'wildcard':
			return applyWildcardToMembers(rule, members, rest, patch, precStack);

		case 'kind-match':
		case 'fieldName': {
			// Dispatched before reaching applyToMembers — should never arrive here.
			throw new Error(`applyToMembers: unexpected segment kind '${head.kind}' — this is a bug in applyPath dispatch`);
		}
		default: {
			const _exhaustive: never = head;
			throw new Error(
				`applyToMembers: unexpected segment ${JSON.stringify(_exhaustive)} — this is a bug in applyPath dispatch`
			);
		}
	}
}

function applyToIndexedMember(
	rule: RuntimeRule,
	members: RuntimeRule[],
	indexValue: number,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const idx = indexValue < 0 ? members.length + indexValue : indexValue;
	if (idx < 0 || idx >= members.length) {
		throw new ApplyPathSkip(`applyPath: index ${indexValue} out of bounds in ${rule.type} of length ${members.length}`);
	}
	members[idx] = applyPath(members[idx]!, rest, patch, precStack);
	return reconstructContainer(rule, members);
}

function applyWildcardToMembers(
	rule: RuntimeRule,
	members: RuntimeRule[],
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack: readonly RuntimeRule[] | undefined
): RuntimeRule {
	if (members.length === 0) {
		throw new ApplyPathSkip(`applyPath: wildcard matched zero members in empty ${rule.type}`);
	}
	let anyApplied = false;
	for (let i = 0; i < members.length; i++) {
		try {
			members[i] = applyPath(members[i]!, rest, patch, precStack);
			anyApplied = true;
		} catch (e) {
			if (e instanceof ApplyPathSkip) continue;
			throw e;
		}
	}
	if (!anyApplied) {
		throw new ApplyPathSkip(
			`applyPath: wildcard matched zero members successfully in ${rule.type} of length ${members.length}`
		);
	}
	return reconstructContainer(rule, members);
}
