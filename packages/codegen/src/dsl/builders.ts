/**
 * dsl/builders.ts — the `RuleBuilder` construction strategies shared across
 * normalize/simplify: `structuralBuilder` (builds real wrapper nodes) and
 * `attributeBuilder` (pushes modifiers onto leaf attributes instead of
 * wrapping). Every `attributeBuilder` constructor is a pure function of its
 * ALREADY-BUILT input, looking exactly one level down — `deleteWrapper`
 * (compiler/wrapper-deletion.ts) rebuilds a raw rule tree bottom-up by
 * calling these same methods, so this is the one place wrapper-vs-attribute
 * construction logic lives.
 *
 * dsl-side: the transforms that need a builder take a structural
 * `{ builder?: RuleBuilder }` slice, never a compiler ctx, so this module has
 * no dsl -> compiler dependency and no compiler phase module needs to import
 * another compiler phase module for builder code.
 */
import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, RenderRule, RuleBase, RuleId, SeqRule } from '../types/rule.ts';
import { isSpliceableBareSeq } from './rule-patterns.ts';
import { withAttrsFrom } from './rule-attrs.ts';
import { combineMultiplicity, type LeafMultiplicity } from './rule-transforms.ts';

// ---------------------------------------------------------------------------
// RuleBuilder — context-injected rule construction strategy
// ---------------------------------------------------------------------------

export type PrecKind = 'left' | 'right' | 'dynamic' | undefined;

type Separator = RuleBase<'normalize'>['separator'];

export interface RuleBuilder {
	seq(members: AnyRule[], multiplicity?: LeafMultiplicity, id?: RuleId): AnyRule;
	choice(members: AnyRule[], id?: RuleId): AnyRule;
	optional(content: AnyRule, id?: RuleId): AnyRule;
	repeat(content: AnyRule, separator?: Separator, id?: RuleId): AnyRule;
	repeat1(content: AnyRule, separator?: Separator, id?: RuleId): AnyRule;
	field(name: string, content: AnyRule, id?: RuleId): AnyRule;
	alias(content: AnyRule, value: string, named: boolean, id?: RuleId): AnyRule;
	token(content: AnyRule, id?: RuleId): AnyRule;
	tokenImmediate(content: AnyRule, id?: RuleId): AnyRule;
	prec(kind: PrecKind, value: number | string, content: AnyRule, id?: RuleId): AnyRule;
	variant(name: string, content: AnyRule, id?: RuleId): AnyRule;
	group(name: string, content: AnyRule, id?: RuleId): AnyRule;
	string(value: string, id?: RuleId): AnyRule;
	pattern(value: string, id?: RuleId): AnyRule;
	symbol(name: string, id?: RuleId): AnyRule;
	supertype(name: string, subtypes: AnyRule[], id?: RuleId): AnyRule;
	indent(id?: RuleId): AnyRule;
	dedent(id?: RuleId): AnyRule;
	newline(id?: RuleId): AnyRule;
}

export const structuralBuilder: RuleBuilder = {
	seq: (members, _multiplicity, id) => ({ type: SEQ, members, ...(id !== undefined ? { id } : {}) }),
	choice: (members, id) => ({ type: CHOICE, members, ...(id !== undefined ? { id } : {}) }),
	// Cast, not narrow: `AnyRule = Rule<PhaseName>` distributes across every
	// phase, while a single-content wrapper's own `content` field wants one
	// specific phase — same "narrow via AnyRule, cast back" convention as
	// rule-patterns.ts's `ruleChildren`.
	optional: (content, id) => ({ type: OPTIONAL, content, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	repeat: (content, separator, id) =>
		({
			type: REPEAT,
			content,
			...(separator !== undefined ? { separator } : {}),
			...(id !== undefined ? { id } : {})
		}) as AnyRule,
	repeat1: (content, separator, id) =>
		({
			type: REPEAT1,
			content,
			...(separator !== undefined ? { separator } : {}),
			...(id !== undefined ? { id } : {})
		}) as AnyRule,
	field: (name, content, id) => ({ type: FIELD, name, content, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	alias: (content, value, named, id) =>
		({ type: ALIAS, content, value, named, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	token: (content, id) => ({ type: TOKEN, content, immediate: false, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	tokenImmediate: (content, id) =>
		({ type: TOKEN, content, immediate: true, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	// The evaluate-only PREC family collapses to four distinct type tags —
	// structuralBuilder mirrors the runtime's own `prec`/`prec.left`/
	// `prec.right`/`prec.dynamic` shape (grammar-shapes/grammar-json.ts).
	prec: (kind, value, content, id) =>
		({
			type: kind === 'left' ? 'PREC_LEFT' : kind === 'right' ? 'PREC_RIGHT' : kind === 'dynamic' ? 'PREC_DYNAMIC' : 'PREC',
			content,
			value,
			...(id !== undefined ? { id } : {})
		}) as AnyRule,
	variant: (name, content, id) => ({ type: VARIANT, name, content, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	group: (name, content, id) => ({ type: GROUP, name, content, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	string: (value, id) => ({ type: STRING, value, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	pattern: (value, id) => ({ type: PATTERN, value, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	symbol: (name, id) => ({ type: SYMBOL, name, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	supertype: (name, subtypes, id) => ({ type: SUPERTYPE, name, subtypes, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	indent: (id) => ({ type: INDENT, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	dedent: (id) => ({ type: DEDENT, ...(id !== undefined ? { id } : {}) }) as AnyRule,
	newline: (id) => ({ type: NEWLINE, ...(id !== undefined ? { id } : {}) }) as AnyRule
};

// ---------------------------------------------------------------------------
// attributeBuilder — the RuleBuilder that pushes attributes instead of
// constructing wrapper nodes, so simplify stays field/optional/repeat-free.
// Every constructor is a pure function of its ALREADY-BUILT input, looking
// exactly one level down — `deleteWrapper` (compiler/wrapper-deletion.ts)
// rebuilds a raw rule tree bottom-up by calling these same methods, so this
// is the one place wrapper-vs-attribute construction logic lives.
// ---------------------------------------------------------------------------

function stampId<R extends AnyRule>(args: { built: R; id: RuleId | undefined; from: AnyRule }): R {
	const resolved = args.id ?? (args.from as { id?: RuleId }).id;
	return resolved !== undefined ? ({ ...args.built, id: resolved } as R) : args.built;
}

function collapseSingletonSeq(seq: AnyRule & { members: AnyRule[] }): AnyRule {
	const survivor = seq.members[0]!;
	const carried = withAttrsFrom(seq, survivor);
	const outerMult = (seq as { multiplicity?: LeafMultiplicity }).multiplicity;
	if (outerMult !== undefined) {
		const combined = combineMultiplicity(outerMult, (survivor as { multiplicity?: LeafMultiplicity }).multiplicity);
		if (combined !== undefined) return { ...carried, multiplicity: combined } as AnyRule;
	}
	return carried;
}

function buildSeq(input: { members: AnyRule[]; multiplicity?: LeafMultiplicity; id?: RuleId }): AnyRule {
	const { members: splicedInput, multiplicity, id } = input;
	const rawMembers = splicedInput.flatMap((m) => (isSpliceableBareSeq(m) ? (m as SeqRule).members : [m]));
	const multToPush = multiplicity === 'nonEmptyArray' ? 'array' : multiplicity;
	const pushed = rawMembers.map((m) => {
		const isBareLiteral = (m.type === STRING || m.type === PATTERN) && !isSlotPromotedLiteral(m as RenderRule);
		if (multToPush === undefined || isBareLiteral) return m;
		const combined = combineMultiplicity(multToPush, (m as { multiplicity?: LeafMultiplicity }).multiplicity);
		return combined !== undefined ? ({ ...m, multiplicity: combined } as AnyRule) : m;
	});
	const hasBareLiteral = rawMembers.some((m) => m.type === STRING || m.type === PATTERN);
	const seq: AnyRule = { type: SEQ, members: pushed };
	const withMult = hasBareLiteral && multToPush !== undefined ? ({ ...seq, multiplicity: multToPush } as AnyRule) : seq;
	const withId = id !== undefined ? ({ ...withMult, id } as AnyRule) : withMult;
	return pushed.length === 1 ? collapseSingletonSeq(withId as AnyRule & { members: AnyRule[] }) : withId;
}

function slotShaped(rule: AnyRule): boolean {
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			return true;
		default:
			return false;
	}
}

export function buildOptional(input: { content: AnyRule; id?: RuleId }): AnyRule {
	const { content, id } = input;
	if (content.type === SEQ) {
		const seqRule = content as SeqRule;
		const built = buildSeq({
			members: seqRule.members,
			multiplicity: combineMultiplicity('optional', seqRule.multiplicity as LeafMultiplicity)
		});
		const nonterminal = (seqRule as { nonterminal?: boolean }).nonterminal || slotShaped(content) || undefined;
		// The seq's own stamped facts (metadata, …) ride along under
		// `built`'s freshly-computed shape — `buildSeq` constructs a new node
		// and has no access to `content`'s identity. `built` may now be a
		// collapsed singleton survivor (buildSeq's own singleton collapse),
		// so its own `type`/`members` must win outright, not merely its
		// stamped attrs: a plain `{...content, ...built}` spread would leave
		// `content`'s stale `members` array on a survivor that has none.
		const merged = { ...content, ...built } as AnyRule & { members?: AnyRule[] };
		if (!('members' in (built as object))) delete merged.members;
		return nonterminal !== undefined
			? stampId({ built: { ...merged, nonterminal } as AnyRule, id, from: content })
			: stampId({ built: merged, id, from: content });
	}
	const c = content as { multiplicity?: LeafMultiplicity; nonterminal?: boolean };
	const nonterminal = c.nonterminal || slotShaped(content) || undefined;
	const patch: Record<string, unknown> = { multiplicity: combineMultiplicity('optional', c.multiplicity) };
	if (nonterminal !== undefined) patch['nonterminal'] = nonterminal;
	return stampId({ built: { ...content, ...patch } as AnyRule, id, from: content });
}

function foldOptionalEmptyMatch(input: { content: AnyRule; id?: RuleId }): AnyRule {
	const { content, id } = input;
	if (content.type === SEQ && content.members.length === 0)
		return stampId({ built: { type: SEQ, members: [] }, id, from: content });
	if (content.type === STRING && !isSlotPromotedLiteral(content))
		return stampId({ built: { type: SEQ, members: [] }, id, from: content });
	return buildOptional({ content, id });
}

function repeatCombine(input: { contentMult: LeafMultiplicity; native: 'array' | 'nonEmptyArray' }): 'array' | 'nonEmptyArray' {
	const { contentMult, native } = input;
	if (contentMult === 'optional') return native;
	return (combineMultiplicity(contentMult, native) ?? native) as 'array' | 'nonEmptyArray';
}

function buildRepeatLike(input: {
	content: AnyRule;
	separator: Separator | undefined;
	native: 'array' | 'nonEmptyArray';
	id?: RuleId;
}): AnyRule {
	const { content, separator, native, id } = input;
	const resolvedSep = separator ?? (content as { separator?: Separator }).separator;
	if (content.type === SEQ) {
		const seqRule = content as SeqRule;
		const contentMult = seqRule.multiplicity as LeafMultiplicity;
		const built = buildSeq({ members: seqRule.members, multiplicity: repeatCombine({ contentMult, native }) });
		const elided = contentMult === 'optional' && resolvedSep !== undefined ? true : undefined;
		const optionalElement = elided ?? (seqRule as { optionalElement?: boolean }).optionalElement;
		const patch: Record<string, unknown> = { nonterminal: true };
		if (resolvedSep !== undefined) patch['separator'] = resolvedSep;
		if (optionalElement !== undefined) patch['optionalElement'] = optionalElement;
		// See buildOptional's identical note: `built` is a fresh node from
		// `buildSeq` and may be a collapsed singleton survivor with no
		// `members` of its own — drop `content`'s stale array when so.
		const merged = { ...content, ...built } as AnyRule & { members?: AnyRule[] };
		if (!('members' in (built as object))) delete merged.members;
		return stampId({ built: { ...merged, ...patch } as AnyRule, id, from: content });
	}
	const c = content as { multiplicity?: LeafMultiplicity; optionalElement?: boolean };
	const elided = c.multiplicity === 'optional' && resolvedSep !== undefined ? true : undefined;
	const optionalElement = elided ?? c.optionalElement;
	const patch: Record<string, unknown> = {
		multiplicity: repeatCombine({ contentMult: c.multiplicity, native }),
		nonterminal: true
	};
	if (resolvedSep !== undefined) patch['separator'] = resolvedSep;
	if (optionalElement !== undefined) patch['optionalElement'] = optionalElement;
	return stampId({ built: { ...content, ...patch } as AnyRule, id, from: content });
}

export const attributeBuilder: RuleBuilder = {
	seq: (members, multiplicity, id) => buildSeq({ members, multiplicity, id }),
	choice: (members, id) => (id !== undefined ? { type: CHOICE, members, id } : { type: CHOICE, members }),
	optional: (content, id) => foldOptionalEmptyMatch({ content, id }),
	repeat: (content, separator, id) => buildRepeatLike({ content, separator, native: 'array', id }),
	repeat1: (content, separator, id) => buildRepeatLike({ content, separator, native: 'nonEmptyArray', id }),
	field: (name, content, id) =>
		stampId({ built: { ...content, fieldName: name, nonterminal: true } as AnyRule, id, from: content }),
	// aliasedFrom is the alias SOURCE (storage) name; `name` is the alias
	// TARGET — the same provenance form link's own
	// `resolveNamedAliasWithProvenance` (compiler/link.ts) produces, applied
	// one level down here: a SYMBOL content's own `.name` becomes
	// `aliasedFrom`, and the alias's `value` becomes the new `.name`.
	alias: (content, value, named, id) => {
		if (content.type === SYMBOL) {
			const c = content as { name: string; nonterminal?: boolean };
			return stampId({
				built: {
					...content,
					name: value,
					aliasedFrom: c.name,
					aliasNamed: named,
					inline: false,
					nonterminal: c.nonterminal || named || undefined
				} as AnyRule,
				id,
				from: content
			});
		}
		if (content.type === STRING) {
			// Alias of a literal: there is no storage rule to name (mirrors
			// link's own STRING-content branch, which stamps no
			// `aliasedFrom` either) — the literal text becomes the new
			// SYMBOL's `literal`, and the STRING-only `value` key is dropped.
			const { value: literalValue, ...rest } = content as { value: string } & Record<string, unknown>;
			const c = content as { nonterminal?: boolean };
			return stampId({
				built: {
					...rest,
					type: SYMBOL,
					name: value,
					literal: literalValue,
					inline: false,
					aliasNamed: named,
					nonterminal: c.nonterminal || named || undefined
				} as AnyRule,
				id,
				from: content
			});
		}
		// Structural alias body (SEQ/CHOICE/PATTERN/…): no storage name to
		// record — link never produces this shape (it collapses named
		// aliases to a SYMBOL ref before this point is reached).
		const c = content as { nonterminal?: boolean };
		return stampId({
			built: {
				...content,
				aliasNamed: named,
				inline: false,
				nonterminal: c.nonterminal || named || undefined
			} as AnyRule,
			id,
			from: content
		});
	},
	token: (content, id) => stampId({ built: { ...content, tokenized: true } as AnyRule, id, from: content }),
	tokenImmediate: (content, id) =>
		stampId({ built: { ...content, tokenized: true, immediate: true } as AnyRule, id, from: content }),
	prec: (kind, value, content, id) => stampId({ built: { ...content, prec: { kind, value } } as AnyRule, id, from: content }),
	variant: (name, content, id) =>
		(id !== undefined ? { type: VARIANT, name, content, id } : { type: VARIANT, name, content }) as AnyRule,
	group: (name, content, id) =>
		(id !== undefined ? { type: GROUP, name, content, id } : { type: GROUP, name, content }) as AnyRule,
	string: (value, id) => (id !== undefined ? { type: STRING, value, id } : { type: STRING, value }) as AnyRule,
	pattern: (value, id) => (id !== undefined ? { type: PATTERN, value, id } : { type: PATTERN, value }) as AnyRule,
	symbol: (name, id) => (id !== undefined ? { type: SYMBOL, name, id } : { type: SYMBOL, name }) as AnyRule,
	supertype: (name, subtypes, id) =>
		(id !== undefined ? { type: SUPERTYPE, name, subtypes, id } : { type: SUPERTYPE, name, subtypes }) as AnyRule,
	indent: (id) => (id !== undefined ? { type: INDENT, id } : { type: INDENT }) as AnyRule,
	dedent: (id) => (id !== undefined ? { type: DEDENT, id } : { type: DEDENT }) as AnyRule,
	newline: (id) => (id !== undefined ? { type: NEWLINE, id } : { type: NEWLINE }) as AnyRule
};

export function isSlotPromotedLiteral(rule: RenderRule): boolean {
	return (rule as { nonterminal?: boolean }).nonterminal === true;
}
