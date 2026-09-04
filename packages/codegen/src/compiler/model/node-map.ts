import type { VariantChild } from '../variant-structural.ts';
import { CHOICE, DEDENT, INDENT, NEWLINE, PATTERN, SEQ, STRING, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type {
	AnyRule,
	RuleBase,
	RenderRule,
	SimplifiedRule,
	ChoiceRule,
	StringRule,
	SupertypeRule,
	SymbolRule,
	Multiplicity,
	RuleId,
	RuleAnnotations
} from '../../types/rule.ts';
import { isEnumChoiceRule, collectFixedLiteral } from '../../dsl/rule-patterns.ts';
import {
	literalTextOf,
	isLinkSymbol,
	subtypeParseNamesOf,
	subtypeRestampPairsOf,
	aliasRestampRequired,
	transitiveParseKinds
} from '../../types/rule.ts';
import { isStringType } from '../../types/runtime-shapes.ts';
import type { RuleMetadata } from '../../types/rule-metadata-brand.ts';
import type { GeneratedKindEntry } from '../generated-metadata.ts';
import { findEntryForKindName, findEntryForLiteralText } from '../generated-metadata.ts';
import { tokenToName } from '../normalize.ts';
import { collectSlots, drainSynthesizedUnionChoiceIds, setUnionSlotRouting } from '../collect-slots.ts';
import { assertNever } from '../../polymorph-variant.ts';
import { opaqueFacts, type OpaqueFacts } from '../opaque-facts.ts';
import {
	diagnoseParseKindCollisions,
	type ParseKindCollisionDiagnostic,
	type ParseKindCollisionValue
} from '../../types/parsekind-collisions.ts';
import { describeDeriveShape, type DeriveShapeDiagnostic } from '../diagnostics/derive-shapes.ts';

const _parseKindCollisionDiagnostics: ParseKindCollisionDiagnostic[] = [];
const _parseKindCollisionSeen = new Set<string>();

function parseKindCollisionKey(diagnostic: ParseKindCollisionDiagnostic): string {
	return [
		diagnostic.code,
		diagnostic.ownerKind,
		diagnostic.slotName,
		diagnostic.parseKind,
		diagnostic.storageKinds.join(',')
	].join(' ');
}

function recordParseKindCollisionDiagnostic(diagnostic: ParseKindCollisionDiagnostic): void {
	const key = parseKindCollisionKey(diagnostic);
	if (_parseKindCollisionSeen.has(key)) return;
	_parseKindCollisionSeen.add(key);
	_parseKindCollisionDiagnostics.push(diagnostic);
}

export function resetParseKindCollisionDiagnostics(): void {
	_parseKindCollisionDiagnostics.length = 0;
	_parseKindCollisionSeen.clear();
}

export function drainParseKindCollisionDiagnostics(): ParseKindCollisionDiagnostic[] {
	const out = [..._parseKindCollisionDiagnostics];
	resetParseKindCollisionDiagnostics();
	return out;
}

const _deriveShapeDiagnostics: DeriveShapeDiagnostic[] = [];
const _deriveShapeSeen = new Set<string>();

function recordDeriveShapeDiagnostic(d: DeriveShapeDiagnostic): void {
	const key = `${d.code}|${d.ownerKind ?? ''}|${d.details.rawShape}|${d.details.context}`;
	if (_deriveShapeSeen.has(key)) return;
	_deriveShapeSeen.add(key);
	_deriveShapeDiagnostics.push(d);
}

export function resetDeriveShapeDiagnostics(): void {
	_deriveShapeDiagnostics.length = 0;
	_deriveShapeSeen.clear();
}

export function drainDeriveShapeDiagnostics(): DeriveShapeDiagnostic[] {
	const out = [..._deriveShapeDiagnostics];
	resetDeriveShapeDiagnostics();
	return out;
}

export interface AssembleWarning {
	readonly code: string;
	readonly message: string;
	readonly ownerKind?: string;
	readonly details?: Record<string, unknown>;
}

const _assembleWarnings: AssembleWarning[] = [];
const _assembleWarningSeen = new Set<string>();

function assembleWarningKey(w: AssembleWarning): string {
	return `${w.code}|${w.ownerKind ?? ''}|${w.message}`;
}

export function recordAssembleWarning(w: AssembleWarning): void {
	const key = assembleWarningKey(w);
	if (_assembleWarningSeen.has(key)) return;
	_assembleWarningSeen.add(key);
	_assembleWarnings.push(w);
}

export function resetAssembleWarnings(): void {
	_assembleWarnings.length = 0;
	_assembleWarningSeen.clear();
}

export function drainAssembleWarnings(): AssembleWarning[] {
	const out = [..._assembleWarnings];
	resetAssembleWarnings();
	return out;
}

export { type Multiplicity } from '../../types/rule.ts';

export interface UnresolvedRef {
	readonly kind: 'unresolved-ref';
	readonly name: string;
}

export type FieldStorageKind = 'verbatim' | 'boolean' | 'bitflag' | 'kindEnum' | 'mixedEnum';

export interface FieldStorageInfo {
	readonly kind: FieldStorageKind;
	readonly texts: readonly string[];
	readonly enumKinds: readonly string[];
	readonly enumKindsById: ReadonlyMap<string, number>;
	readonly collapsesMultiplicity: boolean;
}

export type KindStorage = 'node' | 'kindId';

export type ValueStorage =
	| {
			readonly via: 'node';
			readonly kind: string;
			readonly typeName: string;
			readonly missing?: true;
	  }
	| {
			readonly via: 'kindId';
			readonly kind: string;
			readonly kindId?: number;
			readonly text: string;
			readonly immediate?: boolean;
	  }
	| { readonly via: 'literal'; readonly text: string; readonly immediate?: boolean };

export type TextValueStorage = Extract<ValueStorage, { text: string }>;

export interface NodeRef<T extends AssembledNode = AssembledNode> {
	readonly node?: T | UnresolvedRef;
	readonly storageKindId?: number;
	storage?: ValueStorage;
	readonly value?: string;
	readonly resolvedKind?: string;
	readonly resolvedKindId?: number;
	readonly parseKind?: UnresolvedRef;
	readonly parseKindId?: number;
	readonly parseName?: string;
	readonly variant?: string;
	readonly variantOf?: string;
	readonly default?: true;
	readonly multiplicity: Multiplicity;
	readonly separator?: string;
	readonly trailing?: boolean;
	readonly leading?: boolean;
	readonly optionalElement?: boolean;
	readonly immediate?: boolean;
	readonly tokenized?: boolean;
}

export type NodeOrTerminal = NodeRef;

export interface SubtypeRef {
	readonly name: string;
	readonly storageKindId?: number;
}

export type NodeBackedRef = NodeRef & { node: AssembledNode | UnresolvedRef };

export function isNodeRef(v: NodeOrTerminal): v is NodeBackedRef {
	return v.node !== undefined;
}

export function isTerminalValue(v: NodeOrTerminal): v is NodeRef & { value: string } {
	return v.value !== undefined;
}

const EMPTY_SEEN: ReadonlySet<string> = new Set();

export interface ArgumentOptionalCtx {
	readonly nodeByKindId: ReadonlyMap<number, AssembledNode>;
	readonly seen?: ReadonlySet<string>;
}

export function isUnresolvedRef(v: NodeRef['node']): v is UnresolvedRef {
	return typeof v === 'object' && (v as { kind?: unknown }).kind === 'unresolved-ref';
}

export function isRequired(slot: { values: readonly NodeOrTerminal[] }): boolean {
	return (
		slot.values.length > 0 &&
		slot.values.every((v) => v.multiplicity === 'single' || v.multiplicity === 'nonEmptyArray')
	);
}

export function isMultiple(slot: { values: readonly NodeOrTerminal[] }): boolean {
	return slot.values.some((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
}

export function isNonEmpty(slot: { values: readonly NodeOrTerminal[] }): boolean {
	const multis = slot.values.filter((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
	return multis.length > 0 && multis.every((v) => v.multiplicity === 'nonEmptyArray');
}

export function hasOptionalElements(slot: { values: readonly NodeOrTerminal[] }): boolean {
	return slot.values.some((v) => v.optionalElement === true);
}

export interface SlotCardinality {
	readonly required: boolean;
	readonly multiple: boolean;
	readonly nonEmpty: boolean;
}

export function deriveSlotCardinality(slot: { values: readonly NodeOrTerminal[] }): SlotCardinality {
	return {
		required: isRequired(slot),
		multiple: isMultiple(slot),
		nonEmpty: isNonEmpty(slot)
	};
}

export function deriveUnnamedChildrenCardinality(
	children: readonly {
		values: readonly NodeOrTerminal[];
	}[]
): SlotCardinality {
	if (children.length === 0) {
		return { required: false, multiple: false, nonEmpty: false };
	}
	return children.length === 1 ? deriveSlotCardinality(children[0]!) : deriveChildrenCardinality(children);
}

export function deriveChildrenCardinality(
	children: readonly {
		values: readonly NodeOrTerminal[];
	}[]
): SlotCardinality {
	if (children.length === 0) {
		return { required: false, multiple: false, nonEmpty: false };
	}
	return {
		required: children.some((child) => isRequired(child)),
		multiple: children.some((child) => isMultiple(child)),
		nonEmpty: children.some((child) => isNonEmpty(child))
	};
}

export interface RenderTemplateSurface {
	readonly slots: readonly RenderTemplateSlot[];
	readonly usesChildren: boolean;
	readonly usesVariant: boolean;
	readonly usesText: boolean;
}

export interface RenderTemplateSlot {
	readonly name: string;
	readonly view: 'scalar' | 'list' | 'field';
	readonly required: boolean;
	readonly hasLeadingDelimiter: boolean;
	readonly hasTrailingDelimiter: boolean;
	readonly trailingDelimiter: 'mandatory' | 'optional' | 'none';
	readonly leadingDelimiter: 'mandatory' | 'optional' | 'none';
}

const RESERVED_ACCESSOR_NAMES: ReadonlySet<string> = new Set([
	'constructor',
	'toString',
	'valueOf',
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'toLocaleString',
	'__proto__'
]);

export function snakeToCamel(name: string): string {
	const camel = name.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/_(\d)/g, '$1');
	return RESERVED_ACCESSOR_NAMES.has(camel) ? `${camel}_` : camel;
}

export function pluralize(name: string): string {
	if (name.endsWith('s') || name.endsWith('List') || name.endsWith('children') || name.endsWith('Children'))
		return name;
	if (/[Cc]hild$/.test(name)) return name.slice(0, -5) + (name.endsWith('Child') ? 'Children' : 'children');
	if (name.endsWith('y') && !/[aeiou]y$/.test(name)) return name.slice(0, -1) + 'ies';
	return name + 's';
}

const TS_RESERVED = new Set([
	'arguments',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'import',
	'in',
	'instanceof',
	'new',
	'null',
	'return',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'let',
	'static',
	'implements',
	'interface',
	'package',
	'private',
	'protected',
	'public'
]);

export function safeParamName(name: string): string {
	return TS_RESERVED.has(name) ? `${name}_` : name;
}

const DERIVE_AUDIT = process.env.SITTIR_AUDIT_DERIVE === '1';
function deriveAuditMode(): 'strict' | 'report' | 'off' {
	const v = process.env.SITTIR_AUDIT_DERIVE;
	if (v === '1') return 'report';
	if (v === 'off') return 'off';
	return 'strict';
}
const auditCounts = new Map<string, number>();
const auditKindsByShape = new Map<string, string[]>();
let currentAuditKind: string | undefined;
export function setAuditKindContext(kind: string | undefined): void {
	currentAuditKind = kind;
}
function auditDerivationShape(rule: SimplifiedRule, context: 'fields' | 'children'): void {
	const mode = deriveAuditMode();
	if (mode === 'off') return;
	const shape = classifyTopLevelShape(rule);
	if (shape === 'canonical') return;
	recordDeriveShapeDiagnostic(
		describeDeriveShape({
			rawShape: shape,
			ruleType: rule.type,
			context,
			ownerKind: currentAuditKind,
			ruleId: rule.id
		})
	);
	const key = `${context}:${shape}`;
	auditCounts.set(key, (auditCounts.get(key) ?? 0) + 1);
	if (currentAuditKind !== undefined) {
		const kinds = auditKindsByShape.get(key) ?? [];
		if (!kinds.includes(currentAuditKind)) kinds.push(currentAuditKind);
		auditKindsByShape.set(key, kinds);
		if (process.env.SITTIR_AUDIT_DUMP === currentAuditKind) {
			console.error(`[audit-dump] ${currentAuditKind} (${key}):`);
			console.error(JSON.stringify(rule, null, 2));
		}
	}
}
function classifyTopLevelShape(rule: SimplifiedRule): string {
	switch (rule.type) {
		case SEQ: {
			for (const m of rule.members) {
				if (m.type === SEQ) {
					if (m.multiplicity !== undefined || m.separator !== undefined) continue;
					return 'seq-with-nested-seq';
				}
				const inner = classifyTopLevelShape(m);
				if (inner !== 'canonical') return `seq-member-${inner}`;
			}
			return 'canonical';
		}
		case SYMBOL:
		case STRING:
		case PATTERN:
		case SUPERTYPE:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return 'canonical';
		case CHOICE: {
			const allTokenLike = rule.members.every(isTokenLikeChoiceMember);
			if (allTokenLike) return 'canonical';
			const allFlatSymbolSeq = rule.members.every(isFlatSymbolSeqOrTokenLike);
			if (allFlatSymbolSeq) return 'canonical';
			return 'choice-needs-variant-or-merge';
		}
		default:
			return assertNever(rule);
	}
}
function isTokenLikeChoiceMember(m: SimplifiedRule): boolean {
	const core = m;
	if (core.type === SYMBOL || core.type === SUPERTYPE || isEnumChoiceRule(core)) return true;
	if (core.type === STRING || core.type === PATTERN) return true;
	if (core.type === INDENT || core.type === DEDENT || core.type === NEWLINE) return true;
	if (core.type === CHOICE && core.members.every(isTokenLikeChoiceMember)) return true;
	return false;
}

function isFlatSymbolSeqOrTokenLike(m: SimplifiedRule): boolean {
	if (m.type === SEQ) {
		return m.members.every(isTokenLikeChoiceMember);
	}
	return isTokenLikeChoiceMember(m);
}

export function dumpDerivationAudit(label: string = 'derivation-audit'): void {
	if (!DERIVE_AUDIT || auditCounts.size === 0) return;
	const sorted = [...auditCounts.entries()].sort((a, b) => b[1] - a[1]);
	console.error(`[${label}] non-canonical shapes reaching derivation:`);
	for (const [key, n] of sorted) {
		const kinds = auditKindsByShape.get(key) ?? [];
		console.error(`  ${n.toString().padStart(5)} ${key}  [${kinds.join(', ')}]`);
	}
	auditCounts.clear();
	auditKindsByShape.clear();
}

function _deriveSlotsInternal(rule: SimplifiedRule, ctx?: DeriveCtx): AssembledNonterminal[] {
	const prevAuditKind = currentAuditKind;
	if (ctx?.kindName !== undefined) setAuditKindContext(ctx.kindName);
	try {
		if (ctx?.shapeAudit !== false) auditDerivationShape(rule, 'fields');
		const kindName = ctx?.kindName ?? currentAuditKind;
		let slots = mergeSlotsByName(collectSlots(rule, kindName, ctx?.kindEntries));
		const unionChoiceIds = drainSynthesizedUnionChoiceIds();
		if (unionChoiceIds.size > 0) {
			const isUnionSlot = (s: AssembledNonterminal): boolean => s.sourceRuleIds.some((id) => unionChoiceIds.has(id));
			const colliding = slots.filter(
				(s) => isUnionSlot(s) && slots.some((other) => other !== s && other.storageName === s.storageName)
			);
			if (colliding.length > 0) {
				recordAssembleWarning({
					code: 'union-slot-content-collision',
					ownerKind: kindName,
					message:
						`[derive-slots] kind '${kindName ?? '(unknown)'}': union slot name(s) ` +
						`[${[...new Set(colliding.map((s) => s.storageName))].join(', ')}] already claimed by a sibling ` +
						`slot — union routing disabled for this rule (status-quo distribution). Free the name via ` +
						`field() naming in overrides (named slots bypass the claim).`
				});
				const prev = setUnionSlotRouting(false);
				try {
					slots = mergeSlotsByName(collectSlots(rule, kindName, ctx?.kindEntries));
				} finally {
					setUnionSlotRouting(prev);
					drainSynthesizedUnionChoiceIds();
				}
			}
		}
		return slots;
	} finally {
		setAuditKindContext(prevAuditKind);
	}
}

export function mergeDelimiterMode(
	modes: readonly ['mandatory' | 'optional' | 'none', 'mandatory' | 'optional' | 'none']
): 'mandatory' | 'optional' | 'none' {
	const [a, b] = modes;
	return a === b ? a : 'optional';
}

function mergeSlotsByName(slots: AssembledNonterminal[]): AssembledNonterminal[] {
	if (slots.length <= 1) return slots;
	const out: AssembledNonterminal[] = [];
	const namedIndexByName = new Map<string, number>();
	for (const f of slots) {
		if (f.isUnnamed) {
			out.push(f);
			continue;
		}
		const idx = namedIndexByName.get(f.name);
		if (idx === undefined) {
			namedIndexByName.set(f.name, out.length);
			out.push(f);
			continue;
		}
		const existing = out[idx]!;
		out[idx] = existing.with({
			values: dedupeValues([...existing.values, ...f.values]),
			hasTrailingDelimiter: existing.hasTrailingDelimiter || f.hasTrailingDelimiter,
			hasLeadingDelimiter: existing.hasLeadingDelimiter || f.hasLeadingDelimiter,
			trailingDelimiter: mergeDelimiterMode([existing.trailingDelimiter, f.trailingDelimiter]),
			leadingDelimiter: mergeDelimiterMode([existing.leadingDelimiter, f.leadingDelimiter]),
			sourceRuleIds: mergeSourceRuleIds(existing.sourceRuleIds, f.sourceRuleIds)
		});
	}
	return out;
}

export interface ParseKindCollisionContext {
	readonly ruleSignatures: Readonly<Record<string, string>>;
}

export interface DeriveCtx {
	readonly kindEntries?: readonly GeneratedKindEntry[];
	readonly kindName?: string;
	readonly shapeAudit?: false;
	readonly collision?: ParseKindCollisionContext;
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	readonly simplifiedRules?: Record<string, SimplifiedRule>;
	readonly nodes?: ReadonlyMap<string, AssembledNodeBase>;
	readonly stampArmFieldNamesAsParseName?: boolean;
}

export interface KindedDeriveCtx extends DeriveCtx {
	readonly kindName: string;
}

export function buildParseKindRuleSignatures<T extends AnyRule>(
	rules: Readonly<Record<string, T>>
): Readonly<Record<string, string>> {
	return Object.fromEntries(Object.entries(rules).map(([kind, rule]) => [kind, canonicalRuleSignature(rule)]));
}

export function storageKindOfRef(node: AssembledNode | UnresolvedRef): string {
	return isUnresolvedRef(node) ? node.name : node.kind;
}

export function storageKindOfValue(value: NodeOrTerminal): string | undefined {
	if (isNodeRef(value)) {
		return storageKindOfRef(value.node);
	}
	return value.resolvedKind ?? value.value;
}

function resolveParseKindCollisions(
	slots: readonly AssembledNonterminal[],
	ctx: KindedDeriveCtx
): AssembledNonterminal[] {
	if (slots.length === 0) return [...slots];
	return mergeSlotsByName(slots.map((slot) => resolveParseKindCollisionsInSlot(slot, ctx)));
}

function resolveParseKindCollisionsInSlot(slot: AssembledNonterminal, ctx: KindedDeriveCtx): AssembledNonterminal {
	const describedValues: ParseKindCollisionValue<NodeOrTerminal>[] = slot.values.map((value) => {
		const storageKind = storageKindOfValue(value);
		const stampedStorageKindId = isNodeRef(value) ? value.storageKindId : value.resolvedKindId;
		const storageKindId =
			stampedStorageKindId ??
			(storageKind !== undefined && ctx.kindEntries !== undefined
				? findEntryForKindName(ctx.kindEntries, storageKind)?.id
				: undefined);
		return {
			original: value,
			parseKind: value.parseKind?.name,
			storageKind,
			parseKindId: value.parseKindId,
			storageKindId,
			structuralSignature: structuralSignatureOfValue(value, ctx, storageKind),
			preferRepresentative: storageKind !== undefined && storageKind === value.parseKind?.name
		};
	});
	const resolution = diagnoseParseKindCollisions({
		ownerKind: ctx.kindName,
		slotName: slot.name,
		values: describedValues
	});
	for (const diagnostic of resolution.diagnostics) {
		recordParseKindCollisionDiagnostic(diagnostic);
	}
	const nextValues = [...resolution.values];
	const unchanged =
		nextValues.length === slot.values.length && nextValues.every((value, index) => value === slot.values[index]);
	return unchanged ? slot : slot.with({ values: dedupeValues(nextValues) });
}

function structuralSignatureOfValue(value: NodeOrTerminal, ctx: DeriveCtx, storageKind: string | undefined): string {
	const surface = [
		value.multiplicity,
		value.separator ?? '',
		value.trailing ? 't' : '',
		value.leading ? 'l' : '',
		value.optionalElement ? 'oe' : '',
		isTerminalValue(value) && value.immediate ? 'i' : '',
		isTerminalValue(value) && value.tokenized ? 'tok' : ''
	].join('|');
	if (isTerminalValue(value)) {
		return `terminal:${value.value}:${value.resolvedKind ?? ''}:${surface}`;
	}
	return `node:${structuralSignatureOfStorageKind(storageKind, ctx)}:${surface}`;
}

function structuralSignatureOfStorageKind(storageKind: string | undefined, ctx: DeriveCtx): string {
	if (storageKind === undefined) return 'missing';
	return ctx.collision?.ruleSignatures[storageKind] ?? `missing:${storageKind}`;
}

function canonicalRuleSignature(value: unknown): string {
	return JSON.stringify(normalizeRuleForSignature(value));
}

function normalizeRuleForSignature(value: unknown): unknown {
	if (Array.isArray(value)) return value.map((member) => normalizeRuleForSignature(member));
	if (value === null || typeof value !== 'object') return value;
	const obj = value as Record<string, unknown>;
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(obj).sort()) {
		if (key === 'id' || key === 'source') continue;
		const normalized = normalizeRuleForSignature(obj[key]);
		if (normalized !== undefined) out[key] = normalized;
	}
	return out;
}

export function extractSeparatorString(sep: RuleBase<'normalize'>['separator']): string | undefined {
	if (sep === undefined) return undefined;
	if (isStringType(sep.value.type)) {
		const v = (sep.value as { value: string }).value;
		return v || undefined;
	}
	return undefined;
}

export interface ListSlotFactsCtx {
	readonly separator?: string;
	readonly optionalElement?: boolean;
}

export function stampListFactsOnValues(values: NodeOrTerminal[], ctx: ListSlotFactsCtx): NodeOrTerminal[] {
	const { separator, optionalElement } = ctx;
	if (!separator && optionalElement !== true) return values;
	return values.map((v) => {
		if (v.multiplicity !== 'array' && v.multiplicity !== 'nonEmptyArray') return v;
		return {
			...v,
			...(separator ? { separator } : {}),
			...(optionalElement === true ? { optionalElement: true } : {})
		};
	});
}

export function deriveSlots(rule: SimplifiedRule, ctx?: DeriveCtx): readonly AssembledNonterminal[] {
	return _deriveSlotsInternal(rule, ctx);
}

const DBG_KINDID_FALLBACK = process.env.DBG_KINDID_FALLBACK === '1';
function noteKindIdFallbackHit(hit: { site: string; name: string }): void {
	if (!DBG_KINDID_FALLBACK) return;
	process.stderr.write(
		`[DBG_KINDID_FALLBACK] ${hit.site}: literal/name lookup resolved an id for '${hit.name}' with no stamp present\n`
	);
}

function findKindEntryById(lookup: {
	entries: readonly GeneratedKindEntry[];
	id: number;
}): GeneratedKindEntry | undefined {
	return lookup.entries.find((entry) => entry.id === lookup.id);
}

export interface ArmFacts {
	readonly variant?: string;
	readonly variantOf?: string;
	readonly default?: true;
}

export function armFactsOf(rule: { annotations?: RuleAnnotations }): ArmFacts {
	const annotations = rule.annotations;
	if (annotations === undefined) return {};
	return {
		...(annotations.variant === undefined ? {} : { variant: annotations.variant, variantOf: annotations.variantOf }),
		...(annotations.default === true ? { default: true as const } : {})
	};
}

export function deriveValuesForRule(
	rule: RenderRule,
	ctx: DeriveCtx | undefined,
	multiplicity: Multiplicity
): NodeOrTerminal[] {
	switch (rule.type) {
		case SYMBOL: {
			const armFacts = armFactsOf(rule);
			if (rule.literal !== undefined) {
				if (rule.kindId !== undefined) {
					return [
						{
							value: rule.literal,
							resolvedKind: rule.name,
							resolvedKindId: rule.kindId,
							parseKind: { kind: 'unresolved-ref', name: rule.aliasedTo ?? rule.name },
							parseKindId: rule.aliasedToId ?? rule.kindId,
							...armFacts,
							multiplicity
						}
					];
				}
				const entry = findEntryForLiteralText(ctx?.kindEntries ?? [], rule.literal);
				if (entry !== undefined) noteKindIdFallbackHit({ site: 'SYMBOL(literal)', name: rule.literal });
				return [
					{
						value: rule.literal,
						resolvedKind: rule.name,
						resolvedKindId: entry?.id,
						parseKind: { kind: 'unresolved-ref', name: rule.name },
						parseKindId: entry?.parseId ?? entry?.id,
						...armFacts,
						multiplicity
					}
				];
			}
			if (rule.kindId !== undefined) {
				return [
					{
						node: { kind: 'unresolved-ref', name: rule.name },
						storageKindId: rule.kindId,
						parseKind: { kind: 'unresolved-ref', name: rule.aliasedTo ?? rule.name },
						parseKindId: rule.aliasedToId ?? rule.kindId,
						...armFacts,
						multiplicity
					}
				];
			}
			const entry = findEntryForKindName(ctx?.kindEntries ?? [], rule.name);
			const parseEntry =
				rule.aliasedTo === undefined ? entry : findEntryForKindName(ctx?.kindEntries ?? [], rule.aliasedTo);
			if (entry !== undefined || parseEntry !== undefined)
				noteKindIdFallbackHit({ site: 'SYMBOL(ref)', name: rule.name });
			return [
				{
					node: { kind: 'unresolved-ref', name: rule.name },
					storageKindId: entry?.id,
					parseKind: { kind: 'unresolved-ref', name: rule.aliasedTo ?? rule.name },
					parseKindId: rule.aliasedToId ?? parseEntry?.parseId ?? parseEntry?.id,
					...armFacts,
					multiplicity
				}
			];
		}
		case SUPERTYPE:
			return rule.subtypes.map((subRef) => {
				const name = subRef.name;
				if (subRef.kindId !== undefined) {
					return {
						node: { kind: 'unresolved-ref' as const, name },
						storageKindId: subRef.kindId,
						parseKind: { kind: 'unresolved-ref' as const, name: subRef.aliasedTo ?? name },
						parseKindId: subRef.aliasedToId ?? subRef.kindId,
						multiplicity
					};
				}
				const entry = findEntryForKindName(ctx?.kindEntries ?? [], name);
				if (entry !== undefined) noteKindIdFallbackHit({ site: 'SUPERTYPE(subtype)', name });
				return {
					node: { kind: 'unresolved-ref' as const, name },
					storageKindId: entry?.id,
					parseKind: { kind: 'unresolved-ref' as const, name: subRef.aliasedTo ?? name },
					parseKindId: subRef.aliasedToId ?? entry?.parseId ?? entry?.id,
					multiplicity
				};
			});
		case STRING:
		case PATTERN: {
			if (rule.resolvedKindId !== undefined) {
				const entry = findKindEntryById({ entries: ctx?.kindEntries ?? [], id: rule.resolvedKindId });
				const rk = entry?.kind;
				return [
					{
						value: rule.value,
						resolvedKind: rk,
						resolvedKindId: rule.resolvedKindId,
						parseKind: rk !== undefined ? { kind: 'unresolved-ref', name: rk } : undefined,
						parseKindId: entry?.parseId ?? rule.resolvedKindId,
						multiplicity
					}
				];
			}
			const entry = findEntryForLiteralText(ctx?.kindEntries ?? [], rule.value);
			if (entry !== undefined) noteKindIdFallbackHit({ site: 'STRING/PATTERN', name: rule.value });
			const rk = entry?.kind;
			return [
				{
					value: rule.value,
					resolvedKind: rk,
					resolvedKindId: entry?.id,
					parseKind: rk !== undefined ? { kind: 'unresolved-ref', name: rk } : undefined,
					parseKindId: entry?.parseId ?? entry?.id,
					multiplicity
				}
			];
		}
		case CHOICE: {
			const members = rule.members;
			if (isEnumChoiceRule(rule)) {
				return members.map((m) => {
					const text = literalTextOf(m) ?? '';
					const symName = isLinkSymbol(m) ? m.name : undefined;
					const entry =
						(text ? findEntryForLiteralText(ctx?.kindEntries ?? [], text) : undefined) ??
						(symName !== undefined ? findEntryForKindName(ctx?.kindEntries ?? [], symName) : undefined);
					const rk = entry?.kind ?? symName;
					return {
						value: text,
						resolvedKind: rk,
						resolvedKindId: entry?.id,
						parseKind: rk !== undefined ? { kind: 'unresolved-ref' as const, name: rk } : undefined,
						parseKindId: entry?.parseId ?? entry?.id,
						multiplicity
					};
				});
			}
			const isBlank = (r: RenderRule): boolean =>
				(r.type === CHOICE && r.members.length === 0) || (r.type === SEQ && r.members.length === 0);
			const nonBlank = members.filter((m) => !isBlank(m));
			const hasBlank = nonBlank.length < members.length;
			const armMult: Multiplicity =
				hasBlank && nonBlank.length >= 1
					? multiplicity === 'nonEmptyArray'
						? 'array'
						: multiplicity === 'single'
							? 'optional'
							: multiplicity
					: multiplicity;
			if (!ctx?.stampArmFieldNamesAsParseName) {
				return nonBlank.flatMap((m) => deriveValuesForRule(m, ctx, armMult));
			}
			return nonBlank.flatMap((m) => {
				const values = deriveValuesForRule(m, ctx, armMult);
				const fieldName = m.fieldName;
				return fieldName === undefined ? values : values.map((v) => ({ ...v, parseName: fieldName }));
			});
		}
		case SEQ:
			return rule.members.flatMap((m) => deriveValuesForRule(m, ctx, multiplicity));
		default:
			return [];
	}
}

export function dedupeValues(values: NodeOrTerminal[]): NodeOrTerminal[] {
	const seen = new Set<string>();
	const result: NodeOrTerminal[] = [];
	for (const v of values) {
		const parseKind = v.parseKind?.name ?? '';
		const nodeName = isNodeRef(v) ? storageKindOfRef(v.node) : undefined;
		const key = isNodeRef(v)
			? `node-ref:${nodeName ?? '?'}:${parseKind}:${v.multiplicity}:${v.parseName ?? ''}`
			: `terminal:${v.value ?? ''}:${parseKind}:${v.multiplicity}:${v.parseName ?? ''}`;
		if (!seen.has(key)) {
			seen.add(key);
			result.push(v);
		}
	}
	return result;
}

export const FACTORY_NAME_RESERVED = new Set([
	'arguments',
	'eval',
	'yield',
	'await',
	'async',
	'function',
	'class',
	'import',
	'export',
	'default',
	'return',
	'throw',
	'new',
	'delete',
	'typeof',
	'instanceof',
	'in',
	'of',
	'let',
	'const',
	'var',
	'null',
	'true',
	'false',
	'undefined',
	'NaN',
	'Infinity',
	'static',
	'public',
	'private',
	'protected',
	'interface',
	'package',
	'implements'
]);

function prepareKindForPascalCase(normalized: string): string {
	return normalized.replace(/^_+/, '').replace(/__+/g, '_U_');
}

export function nameNode(kind: string): {
	typeName: string;
	factoryName: string;
	irKey: string;
} {
	const normalized = /^[\w_]+$/.test(kind) ? kind : tokenToName(kind);
	const marked = prepareKindForPascalCase(normalized);
	let typeName =
		marked
			.split('_')
			.filter(Boolean)
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join('') || 'Anonymous';
	if (/^\d/.test(typeName)) typeName = `Tok_${typeName}`;
	let factoryName = typeName.charAt(0).toLowerCase() + typeName.slice(1);
	const irKey = factoryName;
	if (FACTORY_NAME_RESERVED.has(factoryName)) factoryName = `${factoryName}_`;
	return { typeName, factoryName, irKey };
}

export type ModelType = 'envelope' | 'branch' | 'polymorph' | 'supertype' | 'enum' | 'token' | 'pattern' | 'list';

export abstract class AssembledNodeBase<R extends AnyRule = RenderRule> {
	readonly kind: string;
	readonly kindEntry?: GeneratedKindEntry;
	typeName: string;
	factoryName?: string;
	irKey?: string;
	abstract readonly modelType: ModelType;

	get kindId(): number | undefined {
		return this.kindEntry?.id;
	}

	get parameterless(): boolean {
		return false;
	}

	argumentOptional(_ctx: ArgumentOptionalCtx): boolean {
		return this.parameterless;
	}

	get storage(): KindStorage {
		return 'node';
	}

	get slots(): readonly AssembledNonterminal[] {
		return [];
	}

	get stampExpression(): string | undefined {
		return undefined;
	}

	get stampChildExpression(): string | undefined {
		return this.stampExpression;
	}
	protected readonly rule: R;

	get ruleMetadata(): RuleMetadata | undefined {
		return this.rule.metadata;
	}

	get diagnosticRule(): R {
		return this.rule;
	}

	userFacing: boolean = true;

	factoryInline: boolean = false;

	readonly enrichment: NodeEnrichment;

	constructor(
		kind: string,
		rule: R,
		opts?: {
			factoryName?: string;
			irKey?: string;
			hidden?: boolean;
			enrichment?: NodeEnrichment;
			kindEntries?: readonly GeneratedKindEntry[];
		}
	) {
		this.kind = kind;
		this.rule = rule;
		this.enrichment = opts?.enrichment ?? {};
		const derived = nameNode(kind);
		this.typeName = derived.typeName;
		this.factoryName = opts?.hidden === true ? undefined : (opts?.factoryName ?? derived.factoryName);
		this.irKey = opts?.irKey ?? derived.irKey;
		this.kindEntry = findEntryForKindName(opts?.kindEntries ?? [], kind);
	}

	get hidden(): boolean {
		return this.factoryName === undefined;
	}

	get transparent(): boolean {
		return false;
	}

	get rawFactoryName(): string | undefined {
		if (this.factoryName === undefined) return undefined;
		return `build${this.typeName}`;
	}

	get treeTypeName(): string {
		return `${this.typeName}Tree`;
	}

	get configTypeName(): string {
		return `${this.typeName}Config`;
	}

	get fromInputTypeName(): string {
		return `Loose${this.typeName}`;
	}

	get fromFunctionName(): string | undefined {
		if (this.factoryName === undefined) return undefined;
		return `coerceTo${this.typeName}`;
	}
}

export interface AssembledNonterminalInit {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly inlinedFrom?: string;
	readonly hasTrailingDelimiter: boolean;
	readonly hasLeadingDelimiter: boolean;
	readonly trailingDelimiter?: 'mandatory' | 'optional' | 'none';
	readonly leadingDelimiter?: 'mandatory' | 'optional' | 'none';
	readonly sourceRuleIds: readonly RuleId[];
	readonly metadata?: OpaqueFacts;
	readonly ruleMetadata?: RuleMetadata;
	storageInfo?: FieldStorageInfo;
}

export function mergeSourceRuleIds(...groups: readonly (readonly RuleId[] | undefined)[]): readonly RuleId[] {
	const seen = new Set<RuleId>();
	const out: RuleId[] = [];
	for (const group of groups) {
		for (const id of group ?? []) {
			if (seen.has(id)) continue;
			seen.add(id);
			out.push(id);
		}
	}
	return out;
}

export class AssembledNonterminal {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly inlinedFrom?: string;
	readonly hasTrailingDelimiter: boolean;
	readonly hasLeadingDelimiter: boolean;
	readonly trailingDelimiter: 'mandatory' | 'optional' | 'none';
	readonly leadingDelimiter: 'mandatory' | 'optional' | 'none';
	readonly sourceRuleIds: readonly RuleId[];
	readonly metadata: OpaqueFacts;
	readonly ruleMetadata?: RuleMetadata;
	storageInfo?: FieldStorageInfo;

	get storageName(): string {
		return projectSlotNaming(this).storageName;
	}
	get name(): string {
		return projectSlotNaming(this).name;
	}
	get configKey(): string {
		return projectSlotNaming(this).configKey;
	}
	get propertyName(): string {
		return projectSlotNaming(this).propertyName;
	}
	get paramName(): string {
		return projectSlotNaming(this).paramName;
	}
	get parseNames(): readonly string[] {
		return projectSlotNaming(this).parseNames;
	}
	get isUnnamed(): boolean {
		return this.fieldName === undefined;
	}
	get arity(): 'one' | 'many' {
		return isMultiple(this) ? 'many' : 'one';
	}
	get storageKey(): string {
		return `_${this.storageName}`;
	}

	constructor(init: AssembledNonterminalInit) {
		this.values = init.values;
		this.fieldName = init.fieldName;
		this.inlinedFrom = init.inlinedFrom;
		this.hasTrailingDelimiter = init.hasTrailingDelimiter;
		this.hasLeadingDelimiter = init.hasLeadingDelimiter;
		this.trailingDelimiter = init.trailingDelimiter ?? (init.hasTrailingDelimiter ? 'mandatory' : 'none');
		this.leadingDelimiter = init.leadingDelimiter ?? (init.hasLeadingDelimiter ? 'mandatory' : 'none');
		this.sourceRuleIds = init.sourceRuleIds;
		this.metadata = init.metadata ?? opaqueFacts({});
		this.ruleMetadata = init.ruleMetadata;
		this.storageInfo = init.storageInfo;
	}

	with(overrides: Partial<AssembledNonterminalInit>): AssembledNonterminal {
		return new AssembledNonterminal({
			values: this.values,
			fieldName: this.fieldName,
			inlinedFrom: this.inlinedFrom,
			hasTrailingDelimiter: this.hasTrailingDelimiter,
			hasLeadingDelimiter: this.hasLeadingDelimiter,
			trailingDelimiter: this.trailingDelimiter,
			leadingDelimiter: this.leadingDelimiter,
			sourceRuleIds: this.sourceRuleIds,
			metadata: this.metadata,
			ruleMetadata: this.ruleMetadata,
			storageInfo: this.storageInfo,
			...overrides
		});
	}
}

export function kindsOf(slot: AssembledNonterminal): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const v of slot.values) {
		if (!isNodeRef(v)) continue;
		const name = storageKindOfRef(v.node);
		if (!seen.has(name)) {
			seen.add(name);
			out.push(name);
		}
	}
	return out;
}

export function storageKindIdByNameOf(slot: { values: readonly NodeOrTerminal[] }): ReadonlyMap<string, number> {
	const out = new Map<string, number>();
	for (const v of slot.values) {
		if (!isNodeRef(v) || v.storageKindId === undefined) continue;
		const name = storageKindOfRef(v.node);
		if (!out.has(name)) out.set(name, v.storageKindId);
	}
	return out;
}

export function valueParseKindsOf(slot: { values: readonly NodeOrTerminal[] }): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of slot.values) {
		const parseKind = value.parseKind?.name;
		if (parseKind === undefined || seen.has(parseKind)) continue;
		seen.add(parseKind);
		out.push(parseKind);
	}
	return out;
}

function valueParseNamesOf(slot: { values: readonly NodeOrTerminal[] }): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of slot.values) {
		const name = value.parseName ?? value.parseKind?.name;
		if (name === undefined || seen.has(name)) continue;
		seen.add(name);
		out.push(name);
	}
	return out;
}

export function valueParseLabelsOf(slot: { values: readonly NodeOrTerminal[] }): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of slot.values) {
		const name = value.parseName;
		if (name === undefined || seen.has(name)) continue;
		seen.add(name);
		out.push(name);
	}
	return out;
}

export function aliasTargetToSourceMapOf(slot: {
	values: readonly NodeOrTerminal[];
}): Readonly<Record<string, string>> {
	const out: Record<string, string> = {};
	for (const value of slot.values) {
		if (!isNodeRef(value)) continue;
		const parseKind = value.parseKind?.name;
		const sourceKind = storageKindOfRef(value.node);
		if (parseKind === undefined || parseKind === sourceKind) continue;
		out[parseKind] = sourceKind;
	}
	return out;
}

export interface SlotAliasPairsCtx {
	readonly nodes: ReadonlyMap<
		string,
		{ modelType: string; subtypeRestampPairs?: ReadonlyArray<readonly [string, string]> }
	>;
}

export function resolveSlotAliasPairs(
	slot: { values: readonly NodeOrTerminal[] },
	ctx: SlotAliasPairsCtx
): readonly (readonly [string, string])[] | undefined {
	const byParseName = new Map<string, string>();
	for (const value of slot.values) {
		if (!isNodeRef(value)) continue;
		const parseKind = value.parseKind?.name;
		const sourceKind = storageKindOfRef(value.node);
		if (parseKind === undefined || parseKind === sourceKind) continue;
		if (!aliasRestampRequired(value.parseKindId, value.storageKindId)) continue;
		byParseName.set(parseKind, sourceKind);
	}
	const pairs: (readonly [string, string])[] = [...byParseName.entries()];
	for (const parseKind of valueParseKindsOf(slot)) {
		const normalized = parseKind.startsWith('_') ? parseKind.slice(1) : parseKind;
		const node = ctx.nodes.get(parseKind) ?? ctx.nodes.get(normalized);
		if (node?.subtypeRestampPairs === undefined) continue;
		for (const pair of node.subtypeRestampPairs ?? []) pairs.push(pair);
	}
	return pairs.length > 0 ? pairs : undefined;
}

export function acceptedIdPairsByKindOf(slot: {
	values: readonly NodeOrTerminal[];
}): ReadonlyMap<string, readonly number[]> {
	const out = new Map<string, number[]>();
	for (const value of slot.values) {
		if (!isNodeRef(value)) continue;
		const kind = storageKindOfRef(value.node);
		for (const id of [value.storageKindId, value.parseKindId]) {
			if (id === undefined) continue;
			const ids = out.get(kind);
			if (ids === undefined) {
				out.set(kind, [id]);
			} else if (!ids.includes(id)) {
				ids.push(id);
			}
		}
	}
	return out;
}

export interface SlotNamingInputs {
	readonly fieldName?: string;
	readonly inlinedFrom?: string;
	readonly values: readonly NodeOrTerminal[];
}

export function projectSlotNaming(slot: SlotNamingInputs): {
	storageName: string;
	name: string;
	configKey: string;
	propertyName: string;
	paramName: string;
	parseNames: readonly string[];
} {
	const parseNames = slot.fieldName !== undefined ? [slot.fieldName] : valueParseNamesOf(slot);
	const nodeRefStorageKinds = [...new Set(slot.values.filter(isNodeRef).map((v) => storageKindOfRef(v.node)))];
	const literalStorageKinds = [
		...new Set(
			slot.values
				.filter(isTerminalValue)
				.map((v) => v.resolvedKind)
				.filter((k): k is string => k !== undefined)
		)
	];
	const distinctStorageKinds = nodeRefStorageKinds.length > 0 ? nodeRefStorageKinds : literalStorageKinds;
	const hasUnnamedValue = slot.fieldName === undefined && slot.values.some((v) => v.parseKind?.name === undefined);
	const storageName =
		slot.fieldName ??
		(distinctStorageKinds.length === 1 && !hasUnnamedValue
			? distinctStorageKinds[0]!.replace(/^_+/, '') || distinctStorageKinds[0]!
			: slot.inlinedFrom?.replace(/^_+/, '') || 'content');
	const configKey = snakeToCamel(storageName);
	const isMulti = slot.values.some((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
	const propertyName = isMulti ? pluralize(configKey) : configKey;
	return {
		storageName,
		name: storageName,
		configKey,
		propertyName,
		paramName: safeParamName(propertyName),
		parseNames
	};
}

function foldParseKindDuplicateSingularSlots(slots: readonly AssembledNonterminal[]): AssembledNonterminal[] {
	const arrayParseKinds = new Set<string>();
	for (const slot of slots) {
		if (slot.arity !== 'many' || slot.fieldName !== undefined) continue;
		for (const v of slot.values) {
			const pk = v.parseKind?.name;
			if (pk !== undefined) arrayParseKinds.add(pk);
		}
	}
	if (arrayParseKinds.size === 0) return [...slots];

	const out: AssembledNonterminal[] = [];
	const toMergeIntoArraySlot = new Map<string, NodeOrTerminal[]>();

	for (const slot of slots) {
		if (slot.arity !== 'one' || slot.fieldName !== undefined || slot.values.length === 0) {
			out.push(slot);
			continue;
		}
		const allCovered = slot.values.every((v) => {
			const pk = v.parseKind?.name;
			return pk !== undefined && arrayParseKinds.has(pk);
		});
		if (!allCovered) {
			out.push(slot);
			continue;
		}
		const pk0 = slot.values[0]?.parseKind?.name;
		if (pk0 === undefined) {
			out.push(slot);
			continue;
		}
		void pk0;
		void toMergeIntoArraySlot;
	}
	return out;
}

function expandSlotWithVisibleAliasSources(slot: AssembledNonterminal, ctx: KindedDeriveCtx): AssembledNonterminal {
	if (slot.fieldName !== undefined) return slot;

	const sources = ctx.visibleAliasTargets?.get(ctx.kindName);
	if (!sources || sources.length === 0) return slot;

	const dominantMult = slot.values.reduce<Multiplicity>((acc, v) => {
		if (v.multiplicity === 'nonEmptyArray' || v.multiplicity === 'array') return v.multiplicity;
		if (acc === 'single' && v.multiplicity === 'optional') return 'optional';
		return acc;
	}, 'single');

	const existingSupertypeClosure = existingSupertypeClosureOf(slot, ctx);

	const extraValues: NodeOrTerminal[] = [];
	for (const sourceKind of sources) {
		const sourceRule = ctx.simplifiedRules?.[sourceKind];
		if (!sourceRule) continue;
		const unwrappedSource = sourceRule;
		if (unwrappedSource.type !== CHOICE) continue;
		const derived = deriveValuesForRule(sourceRule, ctx, dominantMult);
		for (const d of derived) {
			const dpk = d.parseKind?.name;
			if (dpk === undefined) continue;
			const alreadyPresent =
				slot.values.some((existing) => existing.parseKind?.name === dpk) ||
				extraValues.some((existing) => existing.parseKind?.name === dpk) ||
				existingSupertypeClosure.has(dpk);
			if (!alreadyPresent) extraValues.push(d);
		}
	}
	if (extraValues.length === 0) return slot;

	return slot.with({ values: dedupeValues([...slot.values, ...extraValues]) });
}

function existingSupertypeClosureOf(slot: AssembledNonterminal, ctx: KindedDeriveCtx): ReadonlySet<string> {
	const closure = new Set<string>();
	for (const existing of slot.values) {
		const name = existing.parseKind?.name;
		if (name === undefined) continue;
		for (const n of transitiveParseKinds(name, (n) => {
			const r = ctx.simplifiedRules?.[n];
			return r?.type === SUPERTYPE ? r : undefined;
		}).keys()) {
			closure.add(n);
		}
	}
	return closure;
}

export function fixedTextOfKind(node: AssembledNodeBase | undefined): string | undefined {
	if (node === undefined) return undefined;
	const assembled = node as AssembledNode;
	return isKindIdStored(assembled) ? assembled.text : undefined;
}

export function storageTargetOf(node: AssembledNode, ctx: NodesCtx): AssembledNode {
	if (node instanceof AssembledSupertype && node.subtypeNames.length === 1) {
		const sole = ctx.nodes.get(node.subtypeNames[0]!);
		if (sole !== undefined) return storageTargetOf(sole, ctx);
	}
	return node;
}

export function isKindIdStored(node: AssembledNode): node is AssembledKeyword | AssembledToken {
	return node.storage === 'kindId';
}

export interface NodeEnrichment {
	readonly hoisted?: true;
}

export interface CompoundOpts {
	factoryName?: string;
	irKey?: string;
	hidden?: boolean;
	variantChildKinds?: readonly VariantChild[];
	hoisted?: true;
	kindEntries?: readonly GeneratedKindEntry[];
	parseKindCollisionContext?: ParseKindCollisionContext;
	slots?: readonly AssembledNonterminal[];
	visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	simplifiedRules?: Record<string, SimplifiedRule>;
}

export abstract class AbstractAssembledCompound<R extends RenderRule = RenderRule> extends AssembledNodeBase<R> {
	readonly simplifiedRule: SimplifiedRule;
	readonly renderRule: RenderRule;
	readonly variantChildKinds: readonly VariantChild[];

	get hoisted(): boolean {
		return this.enrichment.hoisted === true;
	}

	protected readonly _slots: readonly AssembledNonterminal[];

	constructor(
		kind: string,
		simplifiedRule: SimplifiedRule,
		renderRule: RenderRule,
		opts?: CompoundOpts,
		rule: R = renderRule as R
	) {
		const hoisted = opts?.hoisted === true;
		const factoryName =
			opts?.factoryName ?? (hoisted && kind.startsWith('_') ? `_${nameNode(kind).factoryName}` : undefined);
		super(kind, rule, { ...opts, factoryName, enrichment: hoisted ? { hoisted: true } : {} });
		this.simplifiedRule = simplifiedRule;
		this.renderRule = renderRule;
		this.variantChildKinds = opts?.variantChildKinds ?? [];
		if (opts?.slots !== undefined) {
			this._slots = Object.freeze([...opts.slots]);
		} else {
			const ctx: KindedDeriveCtx = {
				kindName: kind,
				kindEntries: opts?.kindEntries,
				collision: opts?.parseKindCollisionContext,
				visibleAliasTargets: opts?.visibleAliasTargets,
				simplifiedRules: opts?.simplifiedRules
			};
			const slots = [...deriveSlots(simplifiedRule, ctx)];
			let resolvedSlots = resolveParseKindCollisions(slots, ctx);

			resolvedSlots = foldParseKindDuplicateSingularSlots(resolvedSlots);

			if (ctx.visibleAliasTargets && ctx.simplifiedRules) {
				resolvedSlots = resolvedSlots.map((slot) => expandSlotWithVisibleAliasSources(slot, ctx));
			}

			const byName = new Map<string, AssembledNonterminal>();
			for (const slot of resolvedSlots) {
				byName.set(slot.name, slot);
			}

			const byStorageName = new Map<string, AssembledNonterminal[]>();
			for (const slot of resolvedSlots) {
				const list = byStorageName.get(slot.storageName) ?? [];
				list.push(slot);
				byStorageName.set(slot.storageName, list);
			}
			for (const [storageName, slots] of byStorageName) {
				if (slots.length > 1) {
					const details = slots.map((s) => {
						const kinds = s.values.map((v) =>
							isTerminalValue(v)
								? `"${v.value}"`
								: isNodeRef(v) && isUnresolvedRef(v.node)
									? v.node.name
									: isNodeRef(v)
										? (v.node as AssembledNode).kind
										: '?'
						);
						const mult = s.values.length > 0 ? s.values[0]!.multiplicity : 'single';
						const named = s.isUnnamed ? 'positional' : 'named';
						return `    ${s.name} (${named}, multiplicity: ${mult}, values: [${kinds.join(', ')}])`;
					});
					recordAssembleWarning({
						code: 'storagename-collision',
						message:
							`[assemble] storageName collision: kind '${kind}' has ${slots.length} slots ` +
							`with storageName '${storageName}':\n${details.join('\n')}`,
						ownerKind: kind,
						details: { storageName, slotCount: slots.length }
					});
				}
			}

			this._slots = Object.freeze([...byName.values()]);
		}
	}

	override get slots(): readonly AssembledNonterminal[] {
		return this._slots;
	}

	get soleSlot(): AssembledNonterminal | undefined {
		return this._slots.length === 1 ? this._slots[0] : undefined;
	}

	get keywordConstructibleText(): string | undefined {
		const r = this.renderRule;
		const lead = r.type === SEQ ? r.members[0] : r;
		if (lead === undefined || lead.type !== STRING) return undefined;
		if (!this._slots.every((f) => !isRequired(f))) return undefined;
		return lead.value;
	}

	get separator(): string | undefined {
		return undefined;
	}

	#computing = false;

	override get parameterless(): boolean {
		if (this.#computing) return false;
		this.#computing = true;
		try {
			return this.#computeParameterless();
		} finally {
			this.#computing = false;
		}
	}

	#computeParameterless(): boolean {
		return this.rawFactoryName !== undefined && this._slots.length === 0;
	}

	override argumentOptional(ctx: ArgumentOptionalCtx): boolean {
		const seen = ctx.seen ?? EMPTY_SEEN;
		if (seen.has(this.kind)) return false;
		if (this._slots.every((slot) => !isRequired(slot))) return true;
		const slot = this.soleSlot;
		if (slot === undefined || isMultiple(slot)) return false;
		const refs = slot.values.filter(isNodeRef);
		const kindId = refs.length === 1 ? refs[0]!.storageKindId : undefined;
		const target = kindId === undefined ? undefined : ctx.nodeByKindId.get(kindId);
		return target !== undefined && target.argumentOptional({ ...ctx, seen: new Set([...seen, this.kind]) });
	}
}

export class AssembledBranch extends AbstractAssembledCompound {
	readonly modelType = 'branch' as const;
}

export class AssembledEnvelope<
	R extends RenderRule = RenderRule,
	M extends 'envelope' | 'polymorph' | 'list' = 'envelope'
> extends AbstractAssembledCompound<R> {
	readonly modelType: M = 'envelope' as M;
}

export class AssembledPolymorph extends AssembledEnvelope<RenderRule, 'polymorph'> {
	override readonly modelType = 'polymorph' as const;

	get arms(): readonly SimplifiedRule[] {
		const body = this.simplifiedRule;
		return body.type === CHOICE ? body.members : [];
	}
}

export function isLeafShapedMember(rule: SimplifiedRule): boolean {
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return true;
		default:
			return false;
	}
}

export type CompoundClass = typeof AssembledBranch | typeof AssembledEnvelope | typeof AssembledPolymorph;

export type CompoundModelType = 'envelope' | 'branch' | 'polymorph';

export function compoundModelTypeFor(simplifiedRule: SimplifiedRule): CompoundModelType {
	const body = simplifiedRule;
	if (body.type === SYMBOL || (body.type === SEQ && body.members.length === 0)) return 'envelope';
	if (body.type === CHOICE && (body.multiplicity === 'array' || body.multiplicity === 'nonEmptyArray'))
		return 'envelope';
	if (body.type === CHOICE && body.members.length > 0 && body.members.every(isLeafShapedMember)) return 'polymorph';
	return 'branch';
}

const COMPOUND_CLASS_BY_MODEL_TYPE: Record<CompoundModelType, CompoundClass> = {
	envelope: AssembledEnvelope,
	branch: AssembledBranch,
	polymorph: AssembledPolymorph
};

export function branchClassFor(simplifiedRule: SimplifiedRule): CompoundClass {
	return COMPOUND_CLASS_BY_MODEL_TYPE[compoundModelTypeFor(simplifiedRule)];
}

export abstract class AssembledLeaf<R extends AnyRule = RenderRule> extends AssembledNodeBase<R> {
	get immediate(): boolean {
		return 'immediate' in this.rule && this.rule.immediate === true;
	}

	get tokenized(): boolean {
		return 'tokenized' in this.rule && this.rule.tokenized === true;
	}

	get word(): boolean {
		return false;
	}
}

export class AssembledPattern extends AssembledLeaf<RenderRule> {
	readonly modelType = 'pattern' as const;

	constructor(
		kind: string,
		rule: RenderRule,
		opts?: { factoryName?: string; irKey?: string; kindEntries?: readonly GeneratedKindEntry[] }
	) {
		super(kind, rule, opts);
	}

	get pattern(): string | undefined {
		return this.rule.type === PATTERN ? this.rule.value || undefined : undefined;
	}

	get fixedLiteralText(): string | undefined {
		if (this.rule.type === PATTERN) return undefined;
		return collectFixedLiteral(this.rule);
	}
}

export class AssembledKeyword extends AssembledLeaf<StringRule> {
	readonly modelType = 'token' as const;
	readonly #word: boolean;

	override get word(): boolean {
		return this.#word;
	}
	readonly resolvedKind?: string;
	readonly resolvedKindId?: number;

	constructor(
		kind: string,
		rule: StringRule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			hidden?: boolean;
			kindEntries?: readonly GeneratedKindEntry[];
			word?: boolean;
		}
	) {
		super(kind, rule, opts);
		this.#word = opts?.word ?? true;
		if (rule.resolvedKindId !== undefined) {
			this.resolvedKindId = rule.resolvedKindId;
			this.resolvedKind = findKindEntryById({ entries: opts?.kindEntries ?? [], id: rule.resolvedKindId })?.kind;
		} else {
			const entry = findEntryForLiteralText(opts?.kindEntries ?? [], rule.value);
			if (entry !== undefined) noteKindIdFallbackHit({ site: 'AssembledKeyword', name: rule.value });
			this.resolvedKind = entry?.kind;
			this.resolvedKindId = entry?.id;
		}
	}

	get text(): string {
		return this.rule.value;
	}

	override get parameterless(): boolean {
		return true;
	}

	override get storage(): KindStorage {
		return 'kindId';
	}

	override get stampExpression(): string {
		return `${JSON.stringify(this.rule.value)} as const`;
	}

	override get stampChildExpression(): string {
		const kind = JSON.stringify(this.kind);
		const text = JSON.stringify(this.rule.value);
		return `{ $type: ${kind} as const, $text: ${text} as const, $source: 2 as const, $named: true as const }`;
	}
}

export class AssembledToken extends AssembledLeaf<StringRule> {
	readonly modelType = 'token' as const;
	readonly resolvedKind?: string;
	readonly resolvedKindId?: number;

	constructor(kind: string, rule: StringRule, opts?: { kindEntries?: readonly GeneratedKindEntry[] }) {
		super(kind, rule, { hidden: true, kindEntries: opts?.kindEntries });
		if (rule.resolvedKindId !== undefined) {
			this.resolvedKindId = rule.resolvedKindId;
			this.resolvedKind = findKindEntryById({ entries: opts?.kindEntries ?? [], id: rule.resolvedKindId })?.kind;
		} else {
			const entry = findEntryForLiteralText(opts?.kindEntries ?? [], rule.value);
			if (entry !== undefined) noteKindIdFallbackHit({ site: 'AssembledToken', name: rule.value });
			this.resolvedKind = entry?.kind;
			this.resolvedKindId = entry?.id;
		}
	}

	override get parameterless(): boolean {
		return true;
	}

	override get storage(): KindStorage {
		return 'kindId';
	}

	override get stampExpression(): string {
		return `${JSON.stringify(this.rule.value)} as const`;
	}

	get text(): string {
		return this.rule.value;
	}

	override get stampChildExpression(): string {
		const kind = JSON.stringify(this.kind);
		const text = JSON.stringify(this.rule.value);
		return `{ $type: ${kind} as const, $text: ${text} as const, $source: 2 as const, $named: false as const }`;
	}
}

export class AssembledEnum extends AssembledLeaf<ChoiceRule> {
	readonly modelType = 'enum' as const;
	readonly resolvedKinds: readonly string[];
	readonly resolvedKindIds: readonly number[];
	readonly resolvedByText: ReadonlyMap<string, { readonly kind: string; readonly id: number }>;

	constructor(
		kind: string,
		rule: ChoiceRule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			kindEntries?: readonly GeneratedKindEntry[];
		}
	) {
		super(kind, rule, opts);
		const resolved: string[] = [];
		const resolvedIds: number[] = [];
		const byText = new Map<string, { kind: string; id: number }>();
		for (const member of rule.members) {
			const text = literalTextOf(member);
			if (text === undefined) continue;
			const entry =
				findEntryForLiteralText(opts?.kindEntries ?? [], text) ??
				(isLinkSymbol(member) ? findEntryForKindName(opts?.kindEntries ?? [], member.name) : undefined);
			if (entry === undefined) continue;
			resolved.push(entry.kind);
			resolvedIds.push(entry.id);
			if (!byText.has(text)) byText.set(text, { kind: entry.kind, id: entry.id });
		}
		this.resolvedKinds = resolved;
		this.resolvedKindIds = resolvedIds;
		this.resolvedByText = byText;
		if (this.values.length < 2) {
			throw new Error(
				`AssembledEnum '${kind}' must have at least two members; normalize single-literal sets upstream to a StringRule`
			);
		}
	}

	get values(): string[] {
		return [...new Set(this.rule.members.map((m) => literalTextOf(m) ?? '').filter(Boolean))];
	}
}

export class AssembledSupertype extends AssembledNodeBase<SupertypeRule | ChoiceRule> {
	readonly modelType = 'supertype' as const;

	override get transparent(): boolean {
		return true;
	}
	readonly #subtypes: readonly NodeOrTerminal[];
	transitiveParseKinds?: readonly NodeOrTerminal[];

	constructor(kind: string, rule: SupertypeRule | ChoiceRule, subtypes: readonly SubtypeRef[]) {
		super(kind, rule, { hidden: true });
		this.#subtypes = subtypes.map(
			(s): NodeOrTerminal => ({
				node: { kind: 'unresolved-ref', name: s.name },
				storageKindId: s.storageKindId,
				multiplicity: 'single'
			})
		);
	}

	get subtypes(): readonly NodeOrTerminal[] {
		return this.#subtypes;
	}

	get subtypeNames(): readonly string[] {
		return this.#subtypes.filter(isNodeRef).map((v) => storageKindOfRef(v.node));
	}

	get subtypeParseNames(): Readonly<Record<string, string>> | undefined {
		if (this.rule.type !== SUPERTYPE) return undefined;
		const pairs = subtypeParseNamesOf(this.rule);
		return Object.keys(pairs).length > 0 ? pairs : undefined;
	}

	get subtypeRestampPairs(): ReadonlyArray<readonly [string, string]> | undefined {
		if (this.rule.type !== SUPERTYPE) return undefined;
		const pairs = subtypeRestampPairsOf(this.rule);
		return pairs.length > 0 ? pairs : undefined;
	}
}

export type SeparatedListElementRule = SymbolRule | ChoiceRule;

export class AssembledList extends AssembledEnvelope<SeparatedListElementRule, 'list'> {
	override readonly modelType = 'list' as const;
	readonly elements: readonly NodeOrTerminal[];
	readonly separatorRule: RenderRule | undefined;
	readonly leadingDelimiter: 'mandatory' | 'optional' | 'none';
	readonly trailingDelimiter: 'mandatory' | 'optional' | 'none';

	constructor(
		kind: string,
		rule: SeparatedListElementRule,
		ctx: DeriveCtx | undefined,
		opts: {
			separatorRule: RenderRule | undefined;
			simplifiedRule: SimplifiedRule;
			renderRule: RenderRule;
			kindEntries?: readonly GeneratedKindEntry[];
			parseKindCollisionContext?: ParseKindCollisionContext;
		}
	) {
		super(
			kind,
			opts.simplifiedRule,
			opts.renderRule,
			{ kindEntries: opts.kindEntries, parseKindCollisionContext: opts.parseKindCollisionContext },
			rule
		);
		const sep = rule.separator;
		this.elements = deriveValuesForRule(
			rule,
			{ ...ctx, stampArmFieldNamesAsParseName: true },
			rule.multiplicity === 'nonEmptyArray' ? 'nonEmptyArray' : 'array'
		);
		this.separatorRule = opts.separatorRule;
		this.leadingDelimiter = sep?.leading ?? 'none';
		this.trailingDelimiter = sep?.trailing ?? 'none';
	}

	override get parameterless(): boolean {
		return false;
	}

	get nonEmpty(): boolean {
		return this.rule.multiplicity === 'nonEmptyArray';
	}

	get terminatedSeparator(): boolean {
		return this.rule.separator?.terminated === true;
	}

	override get separator(): string | undefined {
		return extractSeparatorString(this.rule.separator);
	}
}
export type AssembledNode =
	| AssembledBranch
	| AssembledEnvelope
	| AssembledPolymorph
	| AssembledPattern
	| AssembledKeyword
	| AssembledToken
	| AssembledEnum
	| AssembledSupertype
	| AssembledList;

export interface NodesCtx {
	readonly nodes: ReadonlyMap<string, AssembledNode>;
}

export interface LeftImmediateCtx extends NodesCtx {
	readonly normalizedRules?: Record<string, RenderRule>;
}

const isNullableMultiplicity = (rule: RenderRule): boolean =>
	rule.multiplicity === 'optional' || rule.multiplicity === 'array';

export function isLeftImmediateKind(kind: string, ctx: LeftImmediateCtx): boolean {
	const node = ctx.nodes.get(kind);
	if (node instanceof AssembledLeaf) return node.immediate;
	const rules = ctx.normalizedRules;
	if (!rules) return false;
	return leftmostTerminalImmediate(rules[kind], { rules, visiting: new Set([kind]) });
}

interface LeftmostWalkCtx {
	readonly rules: Record<string, RenderRule>;
	readonly visiting: Set<string>;
}

function leftmostTerminalImmediate(rule: RenderRule | undefined, ctx: LeftmostWalkCtx): boolean {
	if (!rule) return false;
	if (isNullableMultiplicity(rule)) return false;
	if (rule.immediate === true) return true;
	switch (rule.type) {
		case 'SEQ':
			return rule.members.length > 0 && leftmostTerminalImmediate(rule.members[0], ctx);
		case 'CHOICE':
			return (
				rule.members.length > 0 &&
				rule.members.every((m) => leftmostTerminalImmediate(m, { rules: ctx.rules, visiting: new Set(ctx.visiting) }))
			);
		case 'SYMBOL': {
			if (ctx.visiting.has(rule.name)) return false;
			ctx.visiting.add(rule.name);
			return leftmostTerminalImmediate(ctx.rules[rule.name], ctx);
		}
		default:
			return false;
	}
}

export type SeamEdgeClass = 'word' | 'not-word' | 'varies';

export interface KindEdgeClasses {
	readonly starts: SeamEdgeClass;
	readonly ends: SeamEdgeClass;
}

export interface EdgeClassCtx {
	readonly nodes: ReadonlyMap<string, AssembledNode>;
	readonly normalizedRules?: Record<string, RenderRule>;
	readonly isWordChar: (c: string) => boolean;
}

const uniformEdgeClass = (classes: readonly SeamEdgeClass[]): SeamEdgeClass => {
	if (classes.length === 0) return 'varies';
	const first = classes[0]!;
	return classes.every((c) => c === first) ? first : 'varies';
};

const charEdgeClass = (c: string | undefined, ctx: { isWordChar: (c: string) => boolean }): SeamEdgeClass =>
	c === undefined || c === '' ? 'varies' : ctx.isWordChar(c) ? 'word' : 'not-word';

const REGEX_CONTROL_ESCAPES: Record<string, string> = {
	n: '\n',
	r: '\r',
	t: '\t',
	f: '\f',
	v: '\v',
	'0': '\0'
};

function bracketExprEdgeClass(
	source: string,
	openBracketIdx: number,
	ctx: { isWordChar: (c: string) => boolean }
): SeamEdgeClass {
	if (source[openBracketIdx + 1] === '^') return 'varies';
	const chars: string[] = [];
	for (let i = openBracketIdx + 1; i < source.length && source[i] !== ']'; i++) {
		let ch = source[i]!;
		if (ch === '\\') {
			const esc = source[++i];
			if (esc === undefined) return 'varies';
			if (esc === 'd' || esc === 'w') {
				chars.push('a');
				continue;
			}
			if (esc === 's' || esc === 'S' || esc === 'D' || esc === 'W' || esc === 'p' || esc === 'u' || esc === 'x')
				return 'varies';
			ch = REGEX_CONTROL_ESCAPES[esc] ?? esc;
		}
		if (source[i + 1] === '-' && source[i + 2] !== undefined && source[i + 2] !== ']') {
			const lo = ch.charCodeAt(0);
			const hi = source[i + 2]!.charCodeAt(0);
			i += 2;
			if (hi < lo || hi - lo > 128) return 'varies';
			for (let code = lo; code <= hi; code++) chars.push(String.fromCharCode(code));
			continue;
		}
		chars.push(ch);
	}
	return uniformEdgeClass(chars.map((c) => charEdgeClass(c, ctx)));
}

function escapeCodeEdgeClass(esc: string | undefined, ctx: { isWordChar: (c: string) => boolean }): SeamEdgeClass {
	if (esc === 'd' || esc === 'w') return 'word';
	if (
		esc === undefined ||
		esc === 's' ||
		esc === 'S' ||
		esc === 'D' ||
		esc === 'W' ||
		esc === 'p' ||
		esc === 'u' ||
		esc === 'x'
	)
		return 'varies';
	return charEdgeClass(REGEX_CONTROL_ESCAPES[esc] ?? esc, ctx);
}

export function patternLeadingEdgeClass(source: string, ctx: { isWordChar: (c: string) => boolean }): SeamEdgeClass {
	if (source.length === 0) return 'varies';
	const c0 = source[0]!;
	if (c0 === '[') return bracketExprEdgeClass(source, 0, ctx);
	if (c0 === '\\') return escapeCodeEdgeClass(source[1], ctx);
	if (c0 === '(' || c0 === '^' || c0 === '.') return 'varies';
	return charEdgeClass(c0, ctx);
}

function precedingBackslashCount(pos: { source: string; index: number }): number {
	const { source, index } = pos;
	let n = 0;
	while (index - 1 - n >= 0 && source[index - 1 - n] === '\\') n++;
	return n;
}

function hasUnescapedPipe(source: string): boolean {
	for (let i = 0; i < source.length; i++) {
		if (source[i] === '|' && precedingBackslashCount({ source, index: i }) % 2 === 0) return true;
	}
	return false;
}

const QUANTIFIER_CHARS = new Set(['*', '?', '+', '}']);

interface TrailingAtom {
	readonly edgeClass: SeamEdgeClass;
	readonly atomStart: number;
}

function endsHexOrUnicodeEscape(pos: { source: string; end: number }): boolean {
	const { source, end } = pos;
	for (const [prefix, digits] of [
		['x', 2],
		['u', 4]
	] as const) {
		const start = end - (digits + 2);
		if (start < 0) continue;
		if (source[start] !== '\\' || source[start + 1] !== prefix) continue;
		if (precedingBackslashCount({ source, index: start }) % 2 !== 0) continue;
		if (/^[0-9a-fA-F]+$/.test(source.slice(start + 2, end))) return true;
	}
	return false;
}

function atomEndingAt(
	source: string,
	end: number,
	ctx: { isWordChar: (c: string) => boolean }
): TrailingAtom | undefined {
	if (end === 0) return undefined;
	const cLast = source[end - 1]!;
	if (precedingBackslashCount({ source, index: end - 1 }) % 2 === 1) {
		return { edgeClass: escapeCodeEdgeClass(cLast, ctx), atomStart: end - 2 };
	}
	if (cLast === ']') {
		let i = end - 2;
		while (i >= 0 && !(source[i] === '[' && precedingBackslashCount({ source, index: i }) % 2 === 0)) {
			if (source[i] === ']' && precedingBackslashCount({ source, index: i }) % 2 === 0) return undefined;
			i--;
		}
		return i < 0 ? undefined : { edgeClass: bracketExprEdgeClass(source, i, ctx), atomStart: i };
	}
	if (cLast === ')' || cLast === '(' || cLast === '^' || cLast === '.' || QUANTIFIER_CHARS.has(cLast)) return undefined;
	if (endsHexOrUnicodeEscape({ source, end })) return undefined;
	return { edgeClass: charEdgeClass(cLast, ctx), atomStart: end - 1 };
}

export function patternTrailingEdgeClass(source: string, ctx: { isWordChar: (c: string) => boolean }): SeamEdgeClass {
	if (source.length === 0 || hasUnescapedPipe(source)) return 'varies';
	let end = source.length;
	const last = source[end - 1]!;
	const lastIsLiteral = precedingBackslashCount({ source, index: end - 1 }) % 2 === 1;
	let permitsZero = false;
	if (!lastIsLiteral && (last === '*' || last === '?')) {
		permitsZero = true;
		end -= 1;
	} else if (!lastIsLiteral && last === '}') {
		const braceStart = source.lastIndexOf('{', end - 2);
		if (braceStart === -1 || precedingBackslashCount({ source, index: braceStart }) % 2 === 1) return 'varies';
		const quant = /^(\d+)(,\d*)?$/.exec(source.slice(braceStart + 1, end - 1));
		if (!quant) return 'varies';
		permitsZero = Number(quant[1]) === 0;
		end = braceStart;
	} else if (!lastIsLiteral && last === '+') {
		end -= 1;
	}
	const atom = atomEndingAt(source, end, ctx);
	if (atom === undefined) return 'varies';
	if (!permitsZero) return atom.edgeClass;
	if (atom.edgeClass === 'varies') return 'varies';
	const preceding = atomEndingAt(source, atom.atomStart, ctx);
	return preceding !== undefined && preceding.edgeClass === atom.edgeClass ? atom.edgeClass : 'varies';
}

export function edgeClassesOfKind(kind: string, ctx: EdgeClassCtx): KindEdgeClasses {
	const node = ctx.nodes.get(kind);
	if (node instanceof AssembledKeyword) {
		return {
			starts: charEdgeClass(node.text[0], ctx),
			ends: charEdgeClass(node.text[node.text.length - 1], ctx)
		};
	}
	if (node instanceof AssembledEnum) {
		const values = node.values;
		return {
			starts: uniformEdgeClass(values.map((v) => charEdgeClass(v[0], ctx))),
			ends: uniformEdgeClass(values.map((v) => charEdgeClass(v[v.length - 1], ctx)))
		};
	}
	if (node instanceof AssembledPattern) {
		const fixed = node.fixedLiteralText;
		if (fixed !== undefined && fixed !== '') {
			return { starts: charEdgeClass(fixed[0], ctx), ends: charEdgeClass(fixed[fixed.length - 1], ctx) };
		}
		const pattern = node.pattern;
		if (pattern !== undefined)
			return { starts: patternLeadingEdgeClass(pattern, ctx), ends: patternTrailingEdgeClass(pattern, ctx) };
		return { starts: 'varies', ends: 'varies' };
	}
	const rule = ctx.normalizedRules?.[kind];
	return {
		starts: ruleEdgeClass(rule, 'starts', ctx, new Set([kind])),
		ends: ruleEdgeClass(rule, 'ends', ctx, new Set([kind]))
	};
}

function ruleEdgeClass(
	rule: RenderRule | undefined,
	side: 'starts' | 'ends',
	ctx: EdgeClassCtx,
	visiting: Set<string>
): SeamEdgeClass {
	if (!rule) return 'varies';
	if (isNullableMultiplicity(rule)) return 'varies';
	switch (rule.type) {
		case 'STRING': {
			const c = side === 'starts' ? rule.value[0] : rule.value[rule.value.length - 1];
			return charEdgeClass(c, ctx);
		}
		case 'PATTERN':
			return side === 'starts' ? patternLeadingEdgeClass(rule.value, ctx) : patternTrailingEdgeClass(rule.value, ctx);
		case 'SEQ': {
			const member = side === 'starts' ? rule.members[0] : rule.members[rule.members.length - 1];
			return ruleEdgeClass(member, side, ctx, visiting);
		}
		case 'CHOICE':
			return uniformEdgeClass(rule.members.map((m) => ruleEdgeClass(m, side, ctx, new Set(visiting))));
		case 'SYMBOL': {
			if (visiting.has(rule.name)) return 'varies';
			visiting.add(rule.name);
			const node = ctx.nodes.get(rule.name);
			if (node instanceof AssembledLeaf) {
				return edgeClassesOfKind(rule.name, ctx)[side];
			}
			return ruleEdgeClass(ctx.normalizedRules?.[rule.name], side, ctx, visiting);
		}
		default:
			return 'varies';
	}
}

export interface KindEdgeCharSets {
	readonly starts?: ReadonlySet<string>;
	readonly ends?: ReadonlySet<string>;
}

export function edgeCharSetsOfKind(kind: string, ctx: EdgeClassCtx): KindEdgeCharSets {
	const node = ctx.nodes.get(kind);
	if (node instanceof AssembledKeyword) {
		return node.text === ''
			? {}
			: { starts: new Set([node.text[0]!]), ends: new Set([node.text[node.text.length - 1]!]) };
	}
	if (node instanceof AssembledEnum) {
		const values = node.values.filter((v) => v !== '');
		if (values.length === 0) return {};
		return {
			starts: new Set(values.map((v) => v[0]!)),
			ends: new Set(values.map((v) => v[v.length - 1]!))
		};
	}
	if (node instanceof AssembledPattern) {
		const fixed = node.fixedLiteralText;
		if (fixed !== undefined && fixed !== '') {
			return { starts: new Set([fixed[0]!]), ends: new Set([fixed[fixed.length - 1]!]) };
		}
		return {};
	}
	const rule = ctx.normalizedRules?.[kind];
	return {
		starts: ruleEdgeCharSet(rule, 'starts', ctx, new Set([kind])),
		ends: ruleEdgeCharSet(rule, 'ends', ctx, new Set([kind]))
	};
}

function ruleEdgeCharSet(
	rule: RenderRule | undefined,
	side: 'starts' | 'ends',
	ctx: EdgeClassCtx,
	visiting: Set<string>,
	nullableMember = false
): ReadonlySet<string> | undefined {
	if (!rule) return undefined;
	if (!nullableMember && isNullableMultiplicity(rule)) return undefined;
	switch (rule.type) {
		case 'STRING': {
			const c = side === 'starts' ? rule.value[0] : rule.value[rule.value.length - 1];
			return c === undefined ? undefined : new Set([c]);
		}
		case 'SEQ': {
			const members = side === 'starts' ? rule.members : [...rule.members].reverse();
			const union = new Set<string>();
			for (const m of members) {
				const nullable = isNullableMultiplicity(m);
				const s = ruleEdgeCharSet(m, side, ctx, new Set(visiting), nullable);
				if (s === undefined) return undefined;
				for (const c of s) union.add(c);
				if (!nullable) return union;
			}
			return union.size > 0 ? union : undefined;
		}
		case 'CHOICE': {
			const union = new Set<string>();
			for (const m of rule.members) {
				const s = ruleEdgeCharSet(m, side, ctx, new Set(visiting));
				if (s === undefined) return undefined;
				for (const c of s) union.add(c);
			}
			return union.size > 0 ? union : undefined;
		}
		case 'SYMBOL': {
			if (visiting.has(rule.name)) return undefined;
			visiting.add(rule.name);
			const node = ctx.nodes.get(rule.name);
			if (node instanceof AssembledLeaf) {
				return edgeCharSetsOfKind(rule.name, ctx)[side];
			}
			return ruleEdgeCharSet(ctx.normalizedRules?.[rule.name], side, ctx, visiting);
		}
		default:
			return undefined;
	}
}

export const DelimiterFlags = {
	none: 0,
	leading: 1,
	trailing: 2,
	both: 3
} as const;
