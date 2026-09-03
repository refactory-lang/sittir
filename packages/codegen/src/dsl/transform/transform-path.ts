import {
	isPrecWrapper as isPrecWrapperShape,
	isContainerType,
	isWrapperType,
	isSeqType,
	isChoiceType,
	isFieldType
} from '../../types/runtime-shapes.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

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
			segments.push({ kind: 'wildcard' });
		} else if (/^-?\d+$/.test(part)) {
			segments.push({ kind: 'index', value: Number(part) });
		} else if (/^\([A-Za-z_][A-Za-z0-9_]*\)$/.test(part)) {
			segments.push({ kind: 'kind-match', name: part.slice(1, -1) });
		} else if (/^[A-Za-z_][A-Za-z0-9_]*:$/.test(part)) {
			segments.push({ kind: 'fieldName', name: part.slice(0, -1) });
		} else if (part === '*') {
			throw new Error(`parsePath: path segment '*' is no longer valid — use '_' for wildcard; see ADR-0010`);
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

const membersOf = (r: RuntimeRule): RuntimeRule[] => (r as unknown as { members: RuntimeRule[] }).members;
const contentOf = (r: RuntimeRule): RuntimeRule => (r as unknown as { content: RuntimeRule }).content;

export function applyPath(
	rule: RuntimeRule,
	segments: readonly PathSegment[],
	patch: RuntimeRule | ((member: RuntimeRule, precStack?: readonly RuntimeRule[]) => RuntimeRule),
	precStack?: readonly RuntimeRule[]
): RuntimeRule {
	if (isPrecWrapperShape(rule)) {
		return descendThroughPrecWrapper(rule, segments, patch, precStack);
	}

	if (segments.length === 0) {
		return typeof patch === 'function' ? patch(rule, precStack) : patch;
	}

	if (isEnrichGroupLiftSymbol(rule)) {
		return descendThroughGroupLiftSymbol(rule, segments, patch, precStack);
	}

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

export function isEnrichGroupLiftSymbol(rule: RuntimeRule): boolean {
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

export function setGroupLiftRuleBody(name: string, body: RuntimeRule): void {
	groupLiftRuleMap?.set(name, body);
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

	if (t === 'FIELD') {
		const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, true);
		return {
			rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
			matched: inner.matched
		};
	}

	if (isWrapperType(t)) {
		const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, insideNamedField);
		return {
			rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
			matched: inner.matched
		};
	}

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
	if (t === 'OPTIONAL') return carryOverProperties(rule, nativeRequired('optional')(newContent));
	if (t === 'REPEAT' || t === 'REPEAT1') {
		return carryOverProperties(rule, nativeRequired(t === 'REPEAT' ? 'repeat' : 'repeat1')(newContent));
	}
	if (isFieldType(t)) {
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
