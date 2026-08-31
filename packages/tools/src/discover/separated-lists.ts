/**
 * discover/separated-lists -- census of separated-list shapes for the
 * visible-list-kind migration.
 *
 * Two populations:
 *   A. kind-level lists -- kinds whose own rule is a list element (array
 *      multiplicity) with a separator. Flank-carrying ones (an 'optional' flank or a nonterminal
 *      separator) classify as modelType 'separatedList'; flankless ones stay
 *      'branch'/'group'.
 *   B. inline list slots -- array-valued slot positions on other kinds whose
 *      values carry a stamped separator.
 *
 * Target-state classification: flank-carrying lists hoist to VISIBLE
 * separatedList kinds named after their element field (collision fallback:
 * <kind>_elements); flankless lists stay inline/hidden -- no visible node.
 *
 * Usage:
 *   separated-lists [--grammar <g>] [--all-grammars] [--format table|json]
 */

import { buildNodeMap } from '../codegen-surface.ts';
import type { AssembledNode, AssembledNodeMap as NodeMap } from '../codegen-surface.ts';

export interface SeparatedListsOptions {
	grammar: string;
	allGrammars: boolean;
	format: string;
}

type FlankMode = 'mandatory' | 'optional' | 'none';

interface KindLevelEntry {
	kind: string;
	modelType: string;
	separator: string;
	leading: FlankMode;
	trailing: FlankMode;
	nonterminalSeparator: boolean;
	flankCarrying: boolean;
	elementFields: string[];
	elementKinds: string[];
	proposedName: string | undefined;
	proposedCollision: boolean;
	/** Informational: this entry's proposed name collides with entries of the
	 *  IDENTICAL list shape (element kinds + separator + flanks). */
	sharedShape: boolean;
	fallbackName: string;
	effectiveName: string;
	/** The composite fallback still collides (duplicate effective name or an
	 *  existing kind) — needs a manual naming decision. */
	unresolvedCollision?: boolean;
	parents: { kind: string; slotCount: number }[];
}

interface InlineSlotEntry {
	kind: string;
	slot: string;
	separator: string;
	leading: FlankMode;
	trailing: FlankMode;
	flankCarrying: boolean;
	elementKinds: string[];
	proposedName: string;
	proposedCollision: boolean;
	/** See {@link KindLevelEntry.sharedShape}. */
	sharedShape: boolean;
	fallbackName: string;
	effectiveName: string;
	/** See {@link KindLevelEntry.unresolvedCollision}. */
	unresolvedCollision?: boolean;
}

export interface SeparatedListsCensus {
	grammar: string;
	kindLevel: KindLevelEntry[];
	inline: InlineSlotEntry[];
}

// ---------------------------------------------------------------------------
// Rule-shape helpers (duck-typed over the link-phase rule tree)
// ---------------------------------------------------------------------------

interface AnyRule {
	type?: unknown;
	value?: unknown;
	name?: unknown;
	members?: AnyRule[];
	multiplicity?: string;
	separator?: { value?: AnyRule; trailing?: FlankMode; leading?: FlankMode };
}

function ruleType(rule: AnyRule | undefined): string {
	return String(rule?.type ?? '').toUpperCase();
}

function isListMultiplicity(rule: AnyRule | undefined): boolean {
	return rule?.multiplicity === 'array' || rule?.multiplicity === 'nonEmptyArray';
}

/** Human-readable spelling of a separator rule: literal text, or a structural
 *  sketch (`choice(','|';')`, `$name`) for nonterminal separators. */
function describeSeparatorRule(rule: AnyRule | undefined): string {
	if (!rule) return '?';
	const t = ruleType(rule);
	if (t === 'STRING') return JSON.stringify(rule.value);
	if (t === 'CHOICE') return `choice(${(rule.members ?? []).map(describeSeparatorRule).join('|')})`;
	if (t === 'SYMBOL') return `$${String(rule.name)}`;
	return t.toLowerCase();
}

function isNonterminalSeparatorRule(rule: AnyRule | undefined): boolean {
	return rule !== undefined && ruleType(rule) !== 'STRING';
}

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

/** Naive English pluralization, mirroring the array-slot naming convention.
 *  Names that already end in a plural-looking 's' pass through unchanged. */
export function pluralizeFieldName(name: string): string {
	if (/(?:s|ses|xes|zes|ches|shes)$/.test(name) && !name.endsWith('ss')) return name;
	if (/(?:s|x|z|ch|sh)$/.test(name)) return `${name}es`;
	if (/[^aeiou]y$/.test(name)) return `${name.slice(0, -1)}ies`;
	return `${name}s`;
}

// ---------------------------------------------------------------------------
// Census
// ---------------------------------------------------------------------------

interface SlotLike {
	name: string;
	arity: 'one' | 'many';
	trailingDelimiter: FlankMode;
	leadingDelimiter: FlankMode;
	values: readonly {
		node?: { kind?: string; name?: string };
		value?: unknown;
		multiplicity?: string;
		separator?: string;
	}[];
}

function slotsOf(node: AssembledNode): readonly SlotLike[] {
	const fields = (node as { fields?: readonly SlotLike[] }).fields;
	return Array.isArray(fields) ? fields : [];
}

function refKindName(ref: { node?: { kind?: string; name?: string } }): string | undefined {
	const target = ref.node;
	if (target === undefined) return undefined;
	// Slot values hold either a resolved AssembledNode (`.kind`) or an
	// UnresolvedRef sentinel (`kind: 'unresolved-ref'`, target in `.name`).
	return target.kind === 'unresolved-ref' ? target.name : (target.kind ?? target.name);
}

/** The owning-kind spelling used by the `<kind>_elements` collision fallback:
 *  a group kind's base (`_arguments_group1` -> `arguments`), or the parent
 *  kind itself for an inline slot. */
function baseKindOf(listKind: string): string {
	return listKind.replace(/^_/, '').replace(/_group\d+$/, '');
}

/** Collision fallback: the composite `<kind>_<field>`, without doubling when
 *  the base already ends in the field spelling (`_collection_elements` with
 *  field `elements` -> `collection_elements`, not `collection_elements_elements`). */
function fallbackNameOf(listKind: string, pluralField: string): string {
	const base = baseKindOf(listKind);
	if (base === pluralField || base.endsWith(`_${pluralField}`)) return base;
	return `${base}_${pluralField}`;
}

export function computeSeparatedListsCensus(grammar: string, nm: NodeMap): SeparatedListsCensus {
	const allKinds = new Set(nm.nodes.keys());

	// Reverse index: list kind -> referencing parents (for the forwarded-factory
	// column: a single-slot parent forwards the hoisted list's constructor).
	const parentsOf = new Map<string, { kind: string; slotCount: number }[]>();
	for (const [kind, node] of nm.nodes) {
		const slots = slotsOf(node);
		for (const slot of slots) {
			for (const v of slot.values) {
				const target = refKindName(v);
				if (target === undefined) continue;
				const list = parentsOf.get(target) ?? [];
				if (!list.some((p) => p.kind === kind)) list.push({ kind, slotCount: slots.length });
				parentsOf.set(target, list);
			}
		}
	}

	const kindLevel: KindLevelEntry[] = [];
	const inline: InlineSlotEntry[] = [];

	for (const [kind, node] of nm.nodes) {
		const rule = node.diagnosticRule as AnyRule;
		const modelType = String((node as { modelType?: string }).modelType ?? '?');

		if (isListMultiplicity(rule) && rule?.separator) {
			const sepValue = rule.separator.value;
			const nonterminal = isNonterminalSeparatorRule(sepValue);
			const leading = rule.separator.leading ?? 'none';
			const trailing = rule.separator.trailing ?? 'none';
			const flankCarrying = nonterminal || leading === 'optional' || trailing === 'optional';
			const slots = slotsOf(node);
			const elementFields = slots.map((s) => s.name);
			const elementKinds = [
				...new Set(slots.flatMap((s) => s.values.map((v) => refKindName(v) ?? JSON.stringify(v.value))))
			].sort();
			const proposedName = elementFields.length === 1 ? pluralizeFieldName(elementFields[0]!) : undefined;
			const fallbackName = fallbackNameOf(kind, proposedName ?? 'elements');
			kindLevel.push({
				kind,
				modelType,
				separator: describeSeparatorRule(sepValue),
				leading,
				trailing,
				nonterminalSeparator: nonterminal,
				flankCarrying,
				elementFields,
				elementKinds,
				proposedName,
				// The group kind itself is renamed, so its own name is not a
				// collision target; any OTHER existing kind is.
				proposedCollision: proposedName !== undefined && proposedName !== kind && allKinds.has(proposedName),
				sharedShape: false,
				fallbackName,
				effectiveName: fallbackName, // finalized after cross-entry collision detection
				parents: parentsOf.get(kind) ?? []
			});
			continue; // its own slots restate the same list -- not an inline site
		}

		for (const slot of slotsOf(node)) {
			const arrayValues = slot.values.filter((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
			if (arrayValues.length === 0) continue;
			const separators = [...new Set(arrayValues.map((v) => v.separator).filter((s) => s !== undefined))];
			if (separators.length === 0) continue;
			const flankCarrying = slot.trailingDelimiter === 'optional' || slot.leadingDelimiter === 'optional';
			const proposedName = pluralizeFieldName(slot.name);
			const fallbackName = fallbackNameOf(kind, proposedName);
			inline.push({
				kind,
				slot: slot.name,
				separator: separators.map((s) => JSON.stringify(s)).join('|'),
				leading: slot.leadingDelimiter,
				trailing: slot.trailingDelimiter,
				flankCarrying,
				elementKinds: [...new Set(arrayValues.map((v) => refKindName(v) ?? JSON.stringify(v.value)))].sort(),
				proposedName,
				// Hoisting mints a NEW kind next to the parent, so a proposal
				// matching ANY existing kind (the parent included) collides.
				proposedCollision: allKinds.has(proposedName),
				sharedShape: false,
				fallbackName,
				effectiveName: fallbackName
			});
		}
	}

	// Cross-entry collisions: all hoist candidates (kind-level AND inline) mint
	// visible kinds into one namespace, so a name proposed twice collides and
	// takes the composite `<kind>_<field>` fallback. `sharedShape` stays
	// informational: it marks colliding entries whose list shape (element
	// kinds + separator + flanks) is identical.
	const hoisting = [...kindLevel.filter((e) => e.flankCarrying), ...inline.filter((e) => e.flankCarrying)];
	const shapeOf = (e: { elementKinds: string[]; separator: string; leading: FlankMode; trailing: FlankMode }) =>
		`${e.elementKinds.join('|')} sep=${e.separator} ${e.leading}/${e.trailing}`;
	const byProposed = new Map<string, typeof hoisting>();
	for (const e of hoisting) {
		if (e.proposedName === undefined) continue;
		const group = byProposed.get(e.proposedName) ?? [];
		group.push(e);
		byProposed.set(e.proposedName, group);
	}
	for (const group of byProposed.values()) {
		if (group.length < 2) continue;
		for (const e of group) e.proposedCollision = true;
		if (new Set(group.map(shapeOf)).size === 1) for (const e of group) e.sharedShape = true;
	}
	for (const e of hoisting) {
		e.effectiveName = e.proposedName !== undefined && !e.proposedCollision ? e.proposedName : e.fallbackName;
	}
	// Composite-fallback degeneracies, resolved in order:
	//  - field name equals the parent base (the collapse lands on an existing
	//    kind) -> `<base>_elements`;
	//  - two arms of the same base kind duplicate the composite -> full kind
	//    spelling with its group suffix (`print_statement_group1_arguments`).
	// Anything still colliding after both is surfaced as UNRESOLVED.
	const countByEffective = () => {
		const m = new Map<string, number>();
		for (const e of hoisting) m.set(e.effectiveName, (m.get(e.effectiveName) ?? 0) + 1);
		return m;
	};
	for (const e of hoisting) {
		// A kind-level hoist RENAMES its kind, so its own name is free to reuse;
		// an inline hoist mints a NEW kind beside its (surviving) parent, so any
		// existing kind -- the parent included -- is a conflict.
		const isKindLevelRename = 'parents' in e && e.effectiveName === e.kind;
		if (!isKindLevelRename && allKinds.has(e.effectiveName)) {
			e.effectiveName = `${baseKindOf(e.kind)}_elements`;
		}
	}
	let dupCounts = countByEffective();
	for (const e of hoisting) {
		if (dupCounts.get(e.effectiveName)! > 1) {
			e.effectiveName = `${e.kind.replace(/^_/, '')}_${e.proposedName ?? 'elements'}`;
		}
	}
	dupCounts = countByEffective();
	for (const e of hoisting) {
		e.unresolvedCollision =
			dupCounts.get(e.effectiveName)! > 1 ||
			(!('parents' in e && e.effectiveName === e.kind) && allKinds.has(e.effectiveName));
	}

	kindLevel.sort((a, b) => Number(b.flankCarrying) - Number(a.flankCarrying) || a.kind.localeCompare(b.kind));
	inline.sort((a, b) => Number(b.flankCarrying) - Number(a.flankCarrying) || a.kind.localeCompare(b.kind));
	return { grammar, kindLevel, inline };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function printCensus(census: SeparatedListsCensus): void {
	const w = (s: string) => process.stdout.write(`${s}\n`);
	w(`\n=== ${census.grammar} ===`);

	const hoist = census.kindLevel.filter((e) => e.flankCarrying);
	const demote = census.kindLevel.filter((e) => !e.flankCarrying);
	w(
		`\n-- kind-level lists: ${hoist.length} flank-carrying (hoist -> visible), ${demote.length} flankless (stay hidden/inline) --`
	);
	for (const e of census.kindLevel) {
		const target = e.flankCarrying ? 'hoist ' : 'stays ';
		const name = e.flankCarrying
			? ` -> ${e.effectiveName}${e.unresolvedCollision ? ' [UNRESOLVED]' : ''}${e.sharedShape ? ' [shared shape]' : ''}${e.proposedCollision ? ` (field-name '${e.proposedName}' collides)` : ''}`
			: `  fields=[${e.elementFields.join(',')}]`;
		const parents = e.parents.map((p) => `${p.kind}${p.slotCount === 1 ? ' [single-slot->forwarded]' : ''}`).join(', ');
		w(
			`  [${target}] ${e.kind}  (${e.modelType})  sep=${e.separator}  leading=${e.leading} trailing=${e.trailing}${name}  elements=[${e.elementKinds.join(',')}]  parents=[${parents}]`
		);
	}

	const hoistInline = census.inline.filter((e) => e.flankCarrying);
	w(
		`\n-- inline list slots: ${hoistInline.length} flank-carrying (hoist -> visible), ${census.inline.length - hoistInline.length} flankless (stay) --`
	);
	for (const e of census.inline) {
		const target = e.flankCarrying ? 'hoist ' : 'stays ';
		const name = e.flankCarrying
			? ` -> ${e.effectiveName}${e.unresolvedCollision ? ' [UNRESOLVED]' : ''}${e.sharedShape ? ' [shared shape]' : ''}${e.proposedCollision ? ` (field-name '${e.proposedName}' collides)` : ''}`
			: '';
		w(
			`  [${target}] ${e.kind}.${e.slot}  sep=${e.separator}  leading=${e.leading} trailing=${e.trailing}${name}  elements=[${e.elementKinds.join(',')}]`
		);
	}
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: SeparatedListsOptions): Promise<number> {
	const grammars = opts.allGrammars ? ['rust', 'typescript', 'python'] : [opts.grammar];
	const results: SeparatedListsCensus[] = [];
	for (const grammar of grammars) {
		let nm: NodeMap;
		try {
			nm = await buildNodeMap(grammar);
		} catch (e) {
			process.stderr.write(`${grammar}: ERROR building nodeMap -- ${(e as Error).message}\n`);
			return 1;
		}
		results.push(computeSeparatedListsCensus(grammar, nm));
	}

	if (opts.format === 'json') {
		process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
	} else {
		for (const census of results) printCensus(census);
	}
	return 0;
}
