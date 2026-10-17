import { IMMEDIATE_TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import {
	isPrecWrapper as isPrecWrapperShape,
	isContainerType,
	isWrapperType,
	isSeqType,
	isChoiceType,
	isFieldType,
	isTokenWrapperType
} from '../../types/runtime-shapes.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { readRuleMetadata } from '../rule-metadata.ts';
import { wireCopy, wireCopyBody, wireCopySource, wireGetLiftBody, wireInsideCopy, wireSetLiftBody, wireWithLiftScope, withWireContext } from '../wire/wire.ts';
import { copyReference } from '../primitives/copy.ts';
import { isParserHiddenName } from '../rule-patterns.ts';

interface RuntimeDsl {
	seq?: (...members: RuntimeRule[]) => RuntimeRule;
	choice?: (...members: RuntimeRule[]) => RuntimeRule;
	optional?: (content: RuntimeRule) => RuntimeRule;
	repeat?: (content: RuntimeRule) => RuntimeRule;
	repeat1?: (content: RuntimeRule) => RuntimeRule;
	token?: ((content: RuntimeRule) => RuntimeRule) & { immediate?: (content: RuntimeRule) => RuntimeRule };
	field?: (name: string, content: RuntimeRule) => RuntimeRule;
	reserved?: (contextName: string, content: RuntimeRule) => RuntimeRule;
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
	| { kind: 'literal'; text: string }
	| {
			kind: 'kind-match';
			name: string;
			as?: string;
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

export function splitSegments(pathStr: string): string[] {
	const parts: string[] = [];
	let current = '';
	let inLiteral = false;
	for (const c of pathStr) {
		if (c === '"') {
			inLiteral = !inLiteral;
			current += c;
		} else if (c === '/' && !inLiteral) {
			parts.push(current);
			current = '';
		} else {
			current += c;
		}
	}
	if (inLiteral) throw new Error(`parsePath: unterminated literal in path '${pathStr}'`);
	parts.push(current);
	return parts;
}

const KIND_SEGMENT = /^\(([A-Za-z_][A-Za-z0-9_]*)(?: as ([A-Za-z_][A-Za-z0-9_]*))?\)$/;

export function parsePath(pathStr: string): PathSegment[] {
	if (pathStr === '.') return [];
	if (typeof pathStr !== 'string' || pathStr.length === 0) {
		throw new Error(`parsePath: path must be a non-empty string, got ${JSON.stringify(pathStr)}`);
	}
	if (pathStr.startsWith('/') || pathStr.endsWith('/')) {
		throw new Error(`parsePath: leading/trailing slash not allowed in path '${pathStr}'`);
	}
	const parts = splitSegments(pathStr);
	const segments: PathSegment[] = [];
	for (const part of parts) {
		if (part.length >= 2 && part.startsWith('"') && part.endsWith('"')) {
			segments.push({ kind: 'literal', text: part.slice(1, -1) });
		} else if (part === '_') {
			segments.push({ kind: 'wildcard' });
		} else if (/^-?\d+$/.test(part)) {
			segments.push({ kind: 'index', value: Number(part) });
		} else if (KIND_SEGMENT.test(part)) {
			const [, name, as] = KIND_SEGMENT.exec(part)!;
			segments.push(as === undefined ? { kind: 'kind-match', name: name! } : { kind: 'kind-match', name: name!, as });
		} else if (/^[A-Za-z_][A-Za-z0-9_]*:$/.test(part)) {
			segments.push({ kind: 'fieldName', name: part.slice(0, -1) });
		} else if (part === '*') {
			throw new Error(`parsePath: path segment '*' is no longer valid — use '_' for wildcard`);
		} else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)) {
			throw new Error(
				`parsePath: bare kind name '${part}' is no longer valid as a path segment — use '(${part})' instead`
			);
		} else {
			throw new Error(
				`parsePath: invalid segment '${part}' in path '${pathStr}' — must be a numeric index, '_' (wildcard), '(name)' (kind-match), or 'name:' (field traversal)`
			);
		}
	}
	return segments;
}

const membersOf = (r: RuntimeRule): RuntimeRule[] => (r as unknown as { members: RuntimeRule[] }).members;
const contentOf = (r: RuntimeRule): RuntimeRule => (r as unknown as { content: RuntimeRule }).content;

export function applyPath(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing?: readonly RuntimeRule[]
): RuntimeRule {
	if (isPrecWrapperShape(rule)) {
		return descendThroughPrecWrapper(rule, segments, patch, enclosing);
	}

	if (segments.length === 0) {
		return typeof patch === 'function' ? patch(rule, enclosing) : patch;
	}

	if (isEnrichGroupLiftSymbol(rule)) {
		return descendThroughGroupLiftSymbol(rule, segments, patch, enclosing);
	}

	if (isEnrichContentAlias(rule)) {
		return descendThroughEnrichContentAlias(rule, segments, patch, enclosing);
	}

	const [head, ...rest] = segments;
	const t = rule.type;

	switch (head!.kind) {
		case 'kind-match':
			return dispatchKindMatch(rule, head!, rest, patch, enclosing);

		case 'fieldName':
			return descendThroughNamedField(rule, head!.name, rest, patch, enclosing);

		case 'index':
		case 'literal':
		case 'wildcard': {
			if (isContainerType(t)) {
				return applyToMembers(rule, head!, rest, patch, enclosing);
			}
			if (isWrapperType(t)) {
				return descendThroughSingleWrapper(rule, head!, rest, patch, enclosing);
			}
			if (t === 'ALIAS') {
				return descendThroughAlias(rule, head!, rest, patch, enclosing);
			}
			throw new ApplyPathSkip(
				`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`
			);
		}

		default: {
			const _exhaustive: never = head;
			throw new Error(`applyPath: unknown segment kind '${(_exhaustive as PathSegment).kind}'`);
		}
	}
}

export function applyPathInRules(
	rules: Record<string, unknown>,
	kind: string,
	segments: readonly PathSegment[],
	patch: (member: RuntimeRule) => RuntimeRule
): void {
	const { result, ctx } = withWireContext(kind, () => applyPath(rules[kind] as RuntimeRule, segments, patch), { grammar: { rules } });
	rules[kind] = result;
	for (const [name, body] of ctx.liftBodies) rules[name] = body;
}

function descendThroughPrecWrapper(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const newStack = enclosing ? [...enclosing, rule] : [rule];
	const newContent = applyPath(contentOf(rule), segments, patch, newStack);
	return reconstructPrec(rule, newContent);
}

export function isEnrichGroupLiftSymbol(rule: RuntimeRule): boolean {
	const t = (rule as { type?: string }).type;
	if (t !== 'SYMBOL') return false;
	const meta = readRuleMetadata('metadata' in rule ? rule.metadata : undefined);
	return meta?.symbolSource === 'group-lift';
}

function descendThroughGroupLiftSymbol(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const name = (rule as unknown as { name?: string }).name;
	if (!name) {
		throw new ApplyPathSkip('applyPath: enrich group-lift symbol has no name to resolve its body');
	}
	const body = wireGetLiftBody(name);
	if (body === undefined) {
		throw new ApplyPathSkip(
			`applyPath: enrich group-lift symbol '${name}' — no body in the active wire() context ` +
				`(no wire() context, or the name was pruned)`
		);
	}
	wireSetLiftBody(
		name,
		wireWithLiftScope(name, () => applyPath(body, segments, patch, enclosing))
	);
	return rule;
}

function isEnrichContentAlias(rule: RuntimeRule): boolean {
	const t = (rule as { type?: string }).type;
	if (t !== 'ALIAS') return false;
	return readRuleMetadata('metadata' in rule ? rule.metadata : undefined)?.aliasSource === 'visible-group';
}

function descendThroughEnrichContentAlias(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const body = (rule as unknown as { content?: RuntimeRule }).content;
	if (body === undefined) {
		throw new ApplyPathSkip('applyPath: enrich content-alias has no content to travel through');
	}
	const newBody = applyPath(body, segments, patch, enclosing);
	return { ...(rule as unknown as Record<string, unknown>), content: newBody } as unknown as RuntimeRule;
}

export const insideLexicalToken = (enclosing: readonly RuntimeRule[] | undefined): boolean =>
	enclosing?.some((wrapper) => isTokenWrapperType(wrapper.type)) ?? false;

function descendThroughSingleWrapper(
	rule: RuntimeRule,
	head: PathSegment,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const inner = isTokenWrapperType(rule.type) ? [...(enclosing ?? []), rule] : enclosing;
	const descend = (): RuntimeRule => reconstructWrapper(rule, applyPath(contentOf(rule), rest, patch, inner));
	switch (head.kind) {
		case 'wildcard':
			return descend();
		case 'index': {
			if (head.value === 0 || head.value === -1) return descend();
			throw new ApplyPathSkip(
				`applyPath: index ${head.value} out of bounds — '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
			);
		}
		case 'literal': {
			if (literalTextOfMember(contentOf(rule)) !== head.text) {
				throw new ApplyPathSkip(
					`applyPath: '${rule.type}' does not wrap the literal ${JSON.stringify(head.text)}`
				);
			}
			return descend();
		}
		case 'kind-match':
		case 'fieldName': {
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
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing: readonly RuntimeRule[] | undefined
): RuntimeRule {
	switch (head.kind) {
		case 'wildcard': {
			const newContent = applyPath(contentOf(rule), rest, patch, enclosing);
			return reconstructAlias(rule, newContent);
		}
		case 'index': {
			if (head.value === 0 || head.value === -1) {
				const newContent = applyPath(contentOf(rule), rest, patch, enclosing);
				return reconstructAlias(rule, newContent);
			}
			throw new ApplyPathSkip(
				`applyPath: index ${head.value} out of bounds — '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
			);
		}
		case 'literal': {
			if (literalTextOfMember(contentOf(rule)) !== head.text) {
				throw new ApplyPathSkip(
					`applyPath: '${rule.type}' does not wrap the literal ${JSON.stringify(head.text)}`
				);
			}
			const newContent = applyPath(contentOf(rule), rest, patch, enclosing);
			return reconstructWrapper(rule, newContent);
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
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing: readonly RuntimeRule[] | undefined
): RuntimeRule {
	if (!isFieldType(rule.type)) {
		const found = walkMatches(rule, enclosing, false, (node, stack) =>
			node.type !== 'FIELD'
				? undefined
				: (node as unknown as { name: string }).name === fieldName
					? { rule: reconstructWrapper(node, applyPath(contentOf(node), rest, patch, stack)), matched: true }
					: { rule: node, matched: false }
		);
		if (!found.matched) throw new ApplyPathSkip(`applyPath: path segment '${fieldName}:' names no field of this subtree`);
		return found.rule;
	}
	const actualName = (rule as unknown as { name: string }).name;
	if (actualName !== fieldName) {
		throw new Error(
			`applyPath: path segment '${fieldName}:' doesn't match field name '${actualName}' at this position`
		);
	}
	const newContent = applyPath(contentOf(rule), rest, patch, enclosing);
	return reconstructWrapper(rule, newContent);
}

type KindSegment = Extract<PathSegment, { kind: 'kind-match' }>;

type PathPatch = RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule);

interface WalkResult {
	readonly rule: RuntimeRule;
	readonly matched: boolean;
}

type WalkLeaf = (rule: RuntimeRule, enclosing: readonly RuntimeRule[] | undefined, insideNamedField: boolean) => WalkResult | undefined;

function dispatchKindMatch(rule: RuntimeRule, segment: KindSegment, rest: readonly PathSegment[], patch: PathPatch, enclosing: readonly RuntimeRule[] | undefined): RuntimeRule {
	const result = walkKindMatch(rule, segment, rest, patch, enclosing, false);
	if (!result.matched) {
		throw new ApplyPathSkip(`applyPath: kind '${segment.name}' matched zero occurrences in this subtree`);
	}
	return result.rule;
}

function applyKindMatchToSymbol(
	rule: RuntimeRule,
	segment: KindSegment,
	rest: readonly PathSegment[],
	patch: PathPatch,
	enclosing: readonly RuntimeRule[] | undefined,
	insideNamedField: boolean
): WalkResult {
	const name = (rule as unknown as { name: string }).name;
	const source = wireCopySource(name) ?? name;
	if (source !== segment.name) return enteredHiddenRule(rule, source, segment, rest, patch);
	if (insideNamedField) return { rule, matched: false };
	if (rest.length === 0 && segment.as === undefined) return { rule: typeof patch === 'function' ? patch(rule, enclosing) : patch, matched: true };
	return { rule: enteredCopy(rule, source, (body) => applyPath(body, rest, patch), segment.as), matched: true };
}

function enteredCopy(rule: RuntimeRule, source: string, edit: (body: RuntimeRule) => RuntimeRule, shown?: string): RuntimeRule {
	const made = wireCopy({ source, part: '.', via: 'path' }, edit);
	return made === undefined || made === (rule as unknown as { name: string }).name ? rule : copyReference(made, source, shown);
}

const entering = new Set<string>();

function enteredHiddenRule(rule: RuntimeRule, source: string, segment: KindSegment, rest: readonly PathSegment[], patch: PathPatch): WalkResult {
	const body = isParserHiddenName(source) && !isEnrichGroupLiftSymbol(rule) && !entering.has(source) ? wireCopyBody(source, '.') : undefined;
	if (body === undefined) return { rule, matched: false };
	entering.add(source);
	try {
		const inner = wireInsideCopy(() => walkKindMatch(body, segment, rest, patch, undefined, false));
		return inner.matched ? { rule: enteredCopy(rule, source, () => inner.rule), matched: true } : { rule, matched: false };
	} finally {
		entering.delete(source);
	}
}

function walkKindMatch(
	rule: RuntimeRule,
	segment: KindSegment,
	rest: readonly PathSegment[],
	patch: PathPatch,
	enclosing: readonly RuntimeRule[] | undefined,
	insideNamedField: boolean
): WalkResult {
	return walkMatches(rule, enclosing, insideNamedField, (node, stack, inField) =>
		node.type === 'SYMBOL' ? applyKindMatchToSymbol(node, segment, rest, patch, stack, inField) : applyKindMatchToCopyReference(node, segment, rest, patch, stack, inField)
	);
}

function applyKindMatchToCopyReference(
	rule: RuntimeRule,
	segment: KindSegment,
	rest: readonly PathSegment[],
	patch: PathPatch,
	enclosing: readonly RuntimeRule[] | undefined,
	insideNamedField: boolean
): WalkResult | undefined {
	const content = (rule as unknown as { content?: RuntimeRule }).content;
	if (rule.type !== 'ALIAS' || content?.type !== 'SYMBOL') return undefined;
	const source = wireCopySource((content as unknown as { name: string }).name);
	if (source === undefined) return undefined;
	if (source !== segment.name || insideNamedField) return { rule, matched: false };
	if (rest.length === 0 && segment.as === undefined) return { rule: typeof patch === 'function' ? patch(rule, enclosing) : patch, matched: true };
	enteredCopy(content, source, (body) => applyPath(body, rest, patch));
	return { rule, matched: true };
}

function walkMatches(rule: RuntimeRule, enclosing: readonly RuntimeRule[] | undefined, insideNamedField: boolean, leaf: WalkLeaf): WalkResult {
	if (!isWalkableNode(rule)) {
		return { rule, matched: false };
	}
	const t = rule.type;

	if (isPrecWrapperShape(rule)) {
		const stack = enclosing ? [...enclosing, rule] : [rule];
		const inner = walkMatches(contentOf(rule), stack, insideNamedField, leaf);
		return {
			rule: inner.matched ? reconstructPrec(rule, inner.rule) : rule,
			matched: inner.matched
		};
	}

	const own = leaf(rule, enclosing, insideNamedField);
	if (own !== undefined) return own;

	if (t === 'FIELD') {
		const inner = walkMatches(contentOf(rule), enclosing, insideNamedField || readRuleMetadata('metadata' in rule ? rule.metadata : undefined)?.fieldSource !== 'enriched', leaf);
		return {
			rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
			matched: inner.matched
		};
	}

	if (isWrapperType(t)) {
		const inner = walkMatches(contentOf(rule), enclosing, insideNamedField, leaf);
		return {
			rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
			matched: inner.matched
		};
	}

	if (isContainerType(t)) {
		const members = [...membersOf(rule)];
		let anyMatched = false;
		for (let i = 0; i < members.length; i++) {
			const inner = walkMatches(members[i]!, enclosing, insideNamedField, leaf);
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
	if (isSeqType(t)) return carryOverProperties(rule, nativeRequired('seq')(...members));
	if (isChoiceType(t)) return carryOverProperties(rule, nativeRequired('choice')(...members));
	throw new Error(`reconstructContainer: unknown container type '${t}'`);
}

export function reconstructWrapper(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
	const t = rule.type;
	if (t === 'OPTIONAL') return carryOverProperties(rule, nativeRequired('optional')(newContent));
	if (t === 'REPEAT' || t === 'REPEAT1') {
		return carryOverProperties(rule, nativeRequired(t === 'REPEAT' ? 'repeat' : 'repeat1')(newContent));
	}
	if (t === 'TOKEN') return carryOverProperties(rule, nativeRequired('token')(newContent));
	if (t === IMMEDIATE_TOKEN) {
		const immediate = nativeRequired('token').immediate;
		if (typeof immediate !== 'function') throw new Error('transform: native token.immediate not available');
		return carryOverProperties(rule, immediate(newContent));
	}
	if (isFieldType(t)) {
		if (isFieldType(newContent.type)) return newContent;
		const name = (rule as unknown as { name: string }).name;
		return carryOverProperties(rule, nativeRequired('field')(name, newContent));
	}
	throw new Error(
		`reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' — this is a bug in the path-descent logic.`
	);
}

function carryOverProperties(rule: RuntimeRule, rebuilt: RuntimeRule): RuntimeRule {
	if (rebuilt.type !== rule.type) return rebuilt;
	const original = rule as unknown as Record<string, unknown>;
	const out = rebuilt as unknown as Record<string, unknown>;
	for (const key of Object.keys(original)) {
		if (key in out) continue;
		const value = original[key];
		if (value === undefined) continue;
		out[key] = value;
	}
	return rebuilt;
}

const PREC_VARIANT_MAP = {
	PREC_LEFT: 'left',
	PREC_RIGHT: 'right',
	PREC_DYNAMIC: 'dynamic'
} as const;

export function reconstructPrec(rule: RuntimeRule, newContent: RuntimeRule): RuntimeRule {
	const t = rule.type;
	if (t === 'RESERVED') {
		return nativeRequired('reserved')((rule as unknown as { context_name: string }).context_name, newContent);
	}
	const value = (rule as { value?: number }).value ?? 0;
	const prec = nativeRequired('prec');
	const variant = PREC_VARIANT_MAP[t as keyof typeof PREC_VARIANT_MAP];
	if (variant) {
		const fn = prec[variant];
		if (typeof fn !== 'function') throw new Error(`transform: native prec.${variant} not available`);
		return carryOverProperties(rule, fn(value, newContent));
	}
	return carryOverProperties(rule, prec(value, newContent));
}

export function wrapInPrecStack(
	content: RuntimeRule,
	enclosing: readonly RuntimeRule[] | undefined,
	reconstructPrec: (wrapper: RuntimeRule, newContent: RuntimeRule) => RuntimeRule
): RuntimeRule {
	if (!enclosing?.length) return content;
	let result = content;
	for (let i = enclosing.length - 1; i >= 0; i--) {
		if (isPrecWrapperShape(enclosing[i]!)) result = reconstructPrec(enclosing[i]!, result);
	}
	return result;
}

export { isContainerType, isWrapperType, isPrecWrapperShape as isPrecWrapper };

function applyToMembers(
	rule: RuntimeRule,
	head: PathSegment,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing?: readonly RuntimeRule[]
): RuntimeRule {
	const members = [...membersOf(rule)];

	switch (head.kind) {
		case 'index':
			return applyToIndexedMember(rule, members, head.value, rest, patch, enclosing);

		case 'literal': {
			const at = members.findIndex((m) => literalTextOfMember(m) === head.text);
			if (at < 0) throw new ApplyPathSkip(`applyPath: no literal ${JSON.stringify(head.text)} in ${rule.type}`);
			members[at] = applyPath(members[at]!, rest, patch, enclosing);
			return reconstructContainer(rule, members);
		}

		case 'wildcard':
			return applyWildcardToMembers(rule, members, rest, patch, enclosing);

		case 'kind-match':
		case 'fieldName': {
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

function literalTextOfMember(rule: RuntimeRule): string | undefined {
	const r = rule as { type?: string; value?: unknown };
	return r.type === 'STRING' && typeof r.value === 'string' ? r.value : undefined;
}

function applyToIndexedMember(
	rule: RuntimeRule,
	members: RuntimeRule[],
	indexValue: number,
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing: readonly RuntimeRule[] | undefined
): RuntimeRule {
	const idx = indexValue < 0 ? members.length + indexValue : indexValue;
	if (idx < 0 || idx >= members.length) {
		throw new ApplyPathSkip(`applyPath: index ${indexValue} out of bounds in ${rule.type} of length ${members.length}`);
	}
	members[idx] = applyPath(members[idx]!, rest, patch, enclosing);
	return reconstructContainer(rule, members);
}

function applyWildcardToMembers(
	rule: RuntimeRule,
	members: RuntimeRule[],
	rest: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, enclosing?: readonly RuntimeRule[]) => RuntimeRule),
	enclosing: readonly RuntimeRule[] | undefined
): RuntimeRule {
	if (members.length === 0) {
		throw new ApplyPathSkip(`applyPath: wildcard matched zero members in empty ${rule.type}`);
	}
	let anyApplied = false;
	for (let i = 0; i < members.length; i++) {
		try {
			members[i] = applyPath(members[i]!, rest, patch, enclosing);
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
