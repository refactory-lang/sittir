import { type BindingFacts, type ContainerCapture, type SlotSelector, WILDCARD } from './bindings.ts';
import type { ModelNode, ModelSlot, SlotModel } from './model.ts';

export interface LayoutSlot {
	readonly kind: string | null;
	readonly slot: string;
}

export interface GrammarInput {
	readonly grammar: string;
	readonly bindings: BindingFacts;
	readonly model: SlotModel;
	readonly textTokens: ReadonlySet<string>;
	readonly layoutSlots: readonly LayoutSlot[];
}

interface Resolution {
	readonly tokens: readonly string[];
	readonly list: boolean;
	readonly scalar: boolean;
}

export interface MemberFacts {
	readonly kinds: Set<string>;
	optional: boolean;
	multiple: boolean;
	scalar: boolean;
	readonly grammars: Set<string>;
}

export interface Refinement {
	readonly parent: string;
	readonly literals: Map<string, Set<string>>;
}

export interface Derivation {
	readonly grammars: readonly string[];
	readonly allvocab: Set<string>;
	readonly prefixes: Set<string>;
	readonly claimers: Map<string, Set<string>>;
	readonly contentDerived: Map<string, Set<string>>;
	readonly refinements: Map<string, Refinement>;
	readonly holes: Map<string, Map<string, string>>;
	readonly members: Map<string, Map<string, MemberFacts>>;
	readonly cycles: readonly string[];
	readonly untargeted: readonly string[];
	readonly uncaptured: readonly string[];
	readonly unmapped: Map<string, number>;
}

export const snake = (s: string): string => s.replace(/(?<!^)(?=[A-Z])/g, '_').toLowerCase();
export const camel = (s: string): string =>
	s.replace(/^_+/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
export const tsname = (seg: string): string =>
	seg
		.split('_')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join('');

export function commonPrefix(paths: readonly string[]): string | null {
	if (paths.length === 0) return null;
	const parts = paths.map((p) => p.split('.'));
	const first = parts[0] ?? [];
	const out: string[] = [];
	for (let i = 0; i < Math.min(...parts.map((p) => p.length)); i += 1) {
		const seg = first[i];
		if (seg !== undefined && parts.every((p) => p[i] === seg)) out.push(seg);
		else break;
	}
	return out.length > 0 ? out.join('.') : null;
}

interface Claim {
	readonly vocab: string;
	readonly predicate: boolean;
	readonly fieldLiterals: Record<string, string>;
	readonly toplevel: boolean;
}

interface DeepMember {
	readonly name: string;
	readonly kinds: readonly string[];
	readonly boolean: boolean;
	readonly multiple: boolean;
	readonly via: ReadonlySet<string>;
}

interface Collected {
	readonly claims: Map<string, Claim[]>;
	readonly renames: Map<string, Map<string, string>>;
	readonly deep: Map<string, DeepMember[]>;
}

const facts = (): MemberFacts => ({
	kinds: new Set(),
	optional: false,
	multiple: false,
	scalar: false,
	grammars: new Set()
});

function slotByField(slots: readonly ModelSlot[], field: string): ModelSlot | undefined {
	return slots.find((s) => s.name === field || snake(s.propertyName) === field);
}

function slotByKind(slots: readonly ModelSlot[], kind: string): ModelSlot | undefined {
	return slots.find((s) => s.kinds.includes(kind));
}

const holdsNodes = (slot: ModelSlot): boolean => slot.storage !== 'boolean' && slot.kinds.length > 0;

const isVocabularyKind = (token: string): boolean =>
	!token.startsWith('<') && !token.startsWith('text:') && !token.startsWith('literal:') && token !== 'boolean';

const TRANSPARENT_MODEL_TYPES: ReadonlySet<string> = new Set(['envelope', 'alias', 'polymorph']);

const scalarOf = (tokens: readonly string[]): Resolution => ({ tokens, list: false, scalar: tokens.length > 0 });

function slotFor(slots: readonly ModelSlot[], n: SlotSelector): ModelSlot | undefined {
	if (n.field !== null) return slotByField(slots, n.field);
	if (n.kind !== null) return slotByKind(slots, n.kind);
	const previous = n.after === null ? undefined : slotFor(slots, n.after);
	return slots.slice(previous === undefined ? 0 : slots.indexOf(previous) + 1).find(holdsNodes);
}

function modelNode(model: SlotModel, kind: string): ModelNode | undefined {
	return model.get(kind) ?? model.get(`_${kind}`);
}

function collect(
	input: GrammarInput,
	allvocab: Set<string>,
	contentDerived: Map<string, Set<string>>,
	holes: Map<string, Map<string, string>>
): Collected {
	const claims = new Map<string, Claim[]>();
	const renames = new Map<string, Map<string, string>>();
	const deep = new Map<string, DeepMember[]>();
	const push = <T>(m: Map<string, T[]>, k: string, v: T): void => {
		const list = m.get(k);
		if (list) list.push(v);
		else m.set(k, [v]);
	};
	for (const template of input.bindings.templates) {
		for (const v of template.vocabs) {
			const h = holes.get(v) ?? new Map<string, string>();
			h.set(camel(template.target), `\`${template.template}\``);
			for (const hole of template.holes) h.set(camel(hole), 'string');
			holes.set(v, h);
		}
	}
	for (const claim of input.bindings.claims) {
		allvocab.add(claim.vocab);
		if (claim.predicate)
			(contentDerived.get(claim.vocab) ?? contentDerived.set(claim.vocab, new Set<string>()).get(claim.vocab))?.add(
				input.grammar
			);
		if (claim.kind === null) continue;
		const fieldLiterals = { ...claim.fieldLiterals };
		const slots = modelNode(input.model, claim.kind)?.slots ?? [];
		for (const text of claim.tokens) {
			const pinned = slots.find((sl) => sl.terminals.includes(text));
			if (pinned && !(pinned.name in fieldLiterals)) fieldLiterals[pinned.name] = text;
		}
		push(claims, claim.kind, {
			vocab: claim.vocab,
			predicate: claim.predicate,
			fieldLiterals,
			toplevel: claim.toplevel
		});
	}
	for (const member of input.bindings.members) {
		switch (member.route) {
			case 'rename': {
				const slot = slotFor(modelNode(input.model, member.owner)?.slots ?? [], member);
				if (slot !== undefined)
					(renames.get(member.owner) ?? renames.set(member.owner, new Map<string, string>()).get(member.owner))?.set(
						slot.name,
						member.name
					);
				break;
			}
			case 'presence':
				push(deep, member.owner, {
					name: member.name,
					kinds: [],
					boolean: true,
					multiple: false,
					via: new Set(member.via)
				});
				break;
			case 'nested': {
				const parent = modelNode(input.model, member.parent);
				const slot = parent && member.kind === null ? slotFor(parent.slots, member) : undefined;
				push(deep, member.owner, {
					name: member.name,
					kinds: member.kind !== null ? [member.kind] : [...(slot?.kinds ?? [])],
					boolean: slot?.storage === 'boolean',
					multiple: (member.kind === null && (slot?.multiple ?? false)) || member.multiple,
					via: new Set(member.via)
				});
				break;
			}
		}
	}
	return { claims, renames, deep };
}

function memberNameOf(renames: ReadonlyMap<string, string>, slotName: string, propertyName: string): string {
	return camel(renames.get(slotName) ?? propertyName.replace(/_$/, '').replace(/Modifier$/, ''));
}

const KEY_SEPARATOR = '\u0000';

function inclusionKey(grammar: string, kind: string): string {
	return `${grammar}${KEY_SEPARATOR}${kind}`;
}

export function inclusionCycles(inclusion: ReadonlyMap<string, ReadonlySet<string>>): string[] {
	const grammarOf = (key: string): string => key.slice(0, key.indexOf(KEY_SEPARATOR));
	const edges = (key: string): string[] =>
		[...(inclusion.get(key) ?? [])].map((to) => inclusionKey(grammarOf(key), to)).filter((to) => inclusion.has(to));
	const index = new Map<string, number>();
	const low = new Map<string, number>();
	const stack: string[] = [];
	const onStack = new Set<string>();
	const cycles: string[] = [];
	let counter = 0;
	const visit = (key: string): void => {
		index.set(key, counter);
		low.set(key, counter);
		counter += 1;
		stack.push(key);
		onStack.add(key);
		for (const to of edges(key)) {
			if (!index.has(to)) {
				visit(to);
				low.set(key, Math.min(low.get(key)!, low.get(to)!));
			} else if (onStack.has(to)) low.set(key, Math.min(low.get(key)!, index.get(to)!));
		}
		if (low.get(key) !== index.get(key)) return;
		const component: string[] = [];
		for (let member = stack.pop()!; ; member = stack.pop()!) {
			onStack.delete(member);
			component.push(member);
			if (member === key) break;
		}
		if (component.length < 2) return;
		const grammar = grammarOf(key);
		const kinds = component.map((m) => m.slice(grammar.length + 1)).sort();
		cycles.push(`${grammar}: ${kinds.join(' <-> ')}`);
	};
	for (const key of inclusion.keys()) if (!index.has(key)) visit(key);
	return cycles.sort();
}

export function derive(inputs: readonly GrammarInput[]): Derivation {
	const allvocab = new Set<string>();
	const contentDerived = new Map<string, Set<string>>();
	const holes = new Map<string, Map<string, string>>();
	const collected = new Map<string, Collected>();
	for (const input of inputs) collected.set(input.grammar, collect(input, allvocab, contentDerived, holes));

	const gk2v = new Map<string, Map<string, string>>();
	for (const input of inputs) {
		const map = new Map<string, string>();
		for (const [gk, list] of collected.get(input.grammar)?.claims ?? []) {
			const plain = list.filter((c) => !c.predicate && Object.keys(c.fieldLiterals).length === 0 && c.toplevel);
			const first = plain[0] ?? list.find((c) => c.toplevel);
			if (first) map.set(gk, first.vocab);
		}
		gk2v.set(input.grammar, map);
	}
	const vocabOf = (g: string): Map<string, string> => gk2v.get(g) ?? new Map();

	const unclaimedOf = new Map(
		inputs.map((input) => [input.grammar, new Set(input.bindings.unclaimed.map((u) => u.kind))])
	);
	const placedClaims = new Map(
		inputs.map((input) => [
			input.grammar,
			input.bindings.claims.flatMap((c) =>
				c.kind !== null && !c.predicate && c.within.length > 0
					? [{ kind: c.kind, vocab: c.vocab, chain: [...c.within].reverse() }]
					: []
			)
		])
	);
	const placed = (input: GrammarInput, k: string, context: readonly string[]): string | undefined => {
		if (context.length < 2) return undefined;
		for (const claim of placedClaims.get(input.grammar) ?? []) {
			if (claim.kind !== k && claim.kind !== WILDCARD) continue;
			const offset = context.length - claim.chain.length;
			if (offset >= 0 && claim.chain.every((kind, i) => kind === WILDCARD || kind === context[offset + i]))
				return claim.vocab;
		}
		return undefined;
	};
	const directVocab = (input: GrammarInput, k: string, context: readonly string[]): string | undefined =>
		placed(input, k, context) ?? vocabOf(input.grammar).get(k) ?? vocabOf(input.grammar).get(k.replace(/^_+/, ''));

	const isLayout = (input: GrammarInput, owner: string, slot: ModelSlot): boolean =>
		input.layoutSlots.some((l) => (l.kind === null || l.kind === owner) && l.slot === slot.name) ||
		(slot.kinds.length > 0 &&
			slot.terminals.length === 0 &&
			slot.kinds.every((k) => unclaimedOf.get(input.grammar)?.has(k) ?? false));

	const derivedSuper = new Map<string, readonly string[] | null>();
	const inclusion = new Map<string, Set<string>>();
	const supertypeKind = (
		input: GrammarInput,
		sk: string,
		seen: readonly string[],
		context: readonly string[]
	): readonly string[] | null => {
		const inclusionAt = inclusionKey(input.grammar, sk);
		const memoKey = context.length < 2 ? inclusionAt : `${inclusionAt}${KEY_SEPARATOR}${context.join('/')}`;
		const memo = derivedSuper.get(memoKey);
		if (memo !== undefined) return memo;
		const subtypes = modelNode(input.model, sk)?.subtypes ?? [];
		if (subtypes.length === 0 || seen.includes(sk)) return null;
		const vs: (readonly string[])[] = [];
		for (const m of subtypes) {
			const direct = directVocab(input, m, context);
			const v =
				direct !== undefined
					? [direct]
					: (modelNode(input.model, m)?.subtypes.length ?? 0) > 0
						? supertypeKind(input, m, [...seen, sk], context)
						: resolveKind(input, m, context).tokens.filter(isVocabularyKind);
			if (v && v.length > 0) vs.push(v);
		}
		const flat = vs.flat();
		if (flat.length === 0 || vs.length < Math.max(2, Math.floor(subtypes.length / 2))) {
			derivedSuper.set(memoKey, null);
			return null;
		}
		const byns = new Map<string, Set<string>>();
		for (const v of flat) {
			const ns = v.split('.')[0] ?? v;
			(byns.get(ns) ?? byns.set(ns, new Set<string>()).get(ns))?.add(v);
		}
		const parts: string[] = [];
		for (const [ns, ps] of byns) {
			const claimedInNs = new Set(
				[...vocabOf(input.grammar).values()].filter((x) => x === ns || x.startsWith(`${ns}.`))
			);
			const cover = ps.size / Math.max(1, claimedInNs.size);
			if (cover >= 1) parts.push(ns);
			else parts.push(...[...ps].sort());
		}
		const inc = inclusion.get(inclusionAt) ?? inclusion.set(inclusionAt, new Set<string>()).get(inclusionAt);
		for (const p of parts) if (!p.includes('.') && p !== sk) inc?.add(p);
		derivedSuper.set(memoKey, parts);
		return parts;
	};

	const containerOf = (
		input: GrammarInput,
		node: ModelNode
	): { readonly kinds: readonly string[]; readonly terminals: readonly string[]; readonly list: boolean } | null => {
		const declared = input.bindings.containers.find((c) => c.kind === node.kind);
		if (declared === undefined && node.modelType === 'list')
			return { kinds: node.elementKinds, terminals: [], list: true };
		const content = node.slots.filter((slot) => !isLayout(input, node.kind, slot));
		const element = declared
			? slotFor(node.slots, declared.element)
			: TRANSPARENT_MODEL_TYPES.has(node.modelType) && content.length === 1
				? content[0]
				: undefined;
		return element !== undefined && holdsNodes(element)
			? { kinds: element.kinds, terminals: element.terminals, list: element.multiple }
			: null;
	};

	const resolveKind = (input: GrammarInput, k: string, context: readonly string[]): Resolution => {
		const g = input.grammar;
		const direct = directVocab(input, k, context);
		if (direct !== undefined) return scalarOf([direct]);
		if (unclaimedOf.get(g)?.has(k)) return scalarOf([]);
		const node = modelNode(input.model, k);
		if (input.textTokens.has(k) && node?.pattern != null) return scalarOf([`text:${node.pattern}`]);
		if (node?.modelType === 'enum') return scalarOf(node.enumValues.map((v) => `text:${v}`));
		if (node?.modelType === 'keyword' || node?.modelType === 'punctuation') return scalarOf([`literal:${k}`]);
		const container = node !== undefined && !context.includes(node.kind) ? containerOf(input, node) : null;
		if (node !== undefined && container !== null) {
			const inner = [...context, node.kind];
			const texts = container.terminals.map((t) => `text:${t}`);
			const parts = container.kinds.map((element) => resolveKind(input, element, inner));
			return {
				tokens: [...texts, ...parts.flatMap((p) => p.tokens)],
				list: container.list || parts.some((p) => p.list),
				scalar: !container.list && (texts.length > 0 || parts.some((p) => p.scalar))
			};
		}
		if (node && node.subtypes.length > 0) {
			const parts = supertypeKind(input, k, [], context);
			if (parts) return scalarOf(parts);
		}
		return scalarOf([`<${g}:${k.replace(/^_+/, '')}>`]);
	};
	const slotResolution = (input: GrammarInput, owner: string, slot: ModelSlot): Resolution => {
		if (slot.storage === 'boolean') return scalarOf(['boolean']);
		const tokens = slot.terminals.map((t) => `text:${t}`);
		let list = false;
		let scalar = slot.terminals.length > 0;
		for (const k of slot.kinds) {
			const resolved = resolveKind(input, k, [owner]);
			tokens.push(...resolved.tokens);
			list ||= resolved.list;
			scalar ||= resolved.scalar;
		}
		return { tokens, list, scalar };
	};

	const refinements = new Map<string, Refinement>();
	const members = new Map<string, Map<string, MemberFacts>>();
	const claimers = new Map<string, Set<string>>();
	const memberOf = (v: string, cm: string): MemberFacts => {
		const m = members.get(v) ?? members.set(v, new Map<string, MemberFacts>()).get(v);
		const f = m?.get(cm) ?? facts();
		m?.set(cm, f);
		return f;
	};
	for (const input of inputs) {
		const c = collected.get(input.grammar);
		if (!c) continue;
		for (const [gk, list] of c.claims) {
			for (const claim of list) {
				(claimers.get(claim.vocab) ?? claimers.set(claim.vocab, new Set<string>()).get(claim.vocab))?.add(
					input.grammar
				);
				if (claim.predicate) continue;
				const rn = c.renames.get(gk) ?? new Map<string, string>();
				const node = modelNode(input.model, gk);
				const literals = Object.entries(claim.fieldLiterals).map(([f, t]): [string, string] => {
					const slot = slotByField(node?.slots ?? [], f);
					return [memberNameOf(rn, slot?.name ?? f, slot?.propertyName ?? f), t];
				});
				if (literals.length > 0) {
					const parent = vocabOf(input.grammar).get(gk);
					if (parent !== undefined && parent !== claim.vocab) {
						const entry =
							refinements.get(claim.vocab) ??
							refinements.set(claim.vocab, { parent, literals: new Map<string, Set<string>>() }).get(claim.vocab);
						for (const [f, t] of literals)
							(entry?.literals.get(f) ?? entry?.literals.set(f, new Set<string>()).get(f))?.add(t);
						continue;
					}
				}
				if (!node) continue;
				const deep = c.deep.get(gk) ?? [];
				const via = new Set(deep.flatMap((d) => [...d.via]));
				for (const slot of node.slots) {
					if (isLayout(input, gk, slot) || slot.kinds.some((k) => via.has(k))) continue;
					const resolved = slotResolution(input, gk, slot);
					const f = memberOf(claim.vocab, memberNameOf(rn, slot.name, slot.propertyName));
					for (const t of resolved.tokens) f.kinds.add(t);
					f.optional ||= !slot.required;
					f.multiple ||= slot.multiple || resolved.list;
					f.scalar ||= !slot.multiple && resolved.scalar;
					f.grammars.add(input.grammar);
				}
				for (const d of deep) {
					const f = memberOf(claim.vocab, camel(d.name));
					if (d.boolean) f.kinds.add('boolean');
					let list = d.multiple;
					let scalar = false;
					for (const k of d.kinds) {
						const resolved = resolveKind(input, k, [gk]);
						for (const t of resolved.tokens) f.kinds.add(t);
						list ||= resolved.list;
						scalar ||= resolved.scalar;
					}
					f.optional = true;
					f.multiple ||= list;
					f.scalar ||= !d.multiple && (scalar || !list);
					f.grammars.add(input.grammar);
				}
			}
		}
	}

	const untargeted: string[] = [];
	const uncaptured: string[] = [];
	for (const input of inputs) {
		for (const container of input.bindings.containers) {
			const slots = modelNode(input.model, container.kind)?.slots ?? [];
			const slotOf = (capture: ContainerCapture): ModelSlot | undefined => {
				const { token } = capture;
				return token !== null ? slots.find((slot) => slot.terminals.includes(token)) : slotFor(slots, capture);
			};
			const at = `${input.grammar}:${container.pattern.line} ${container.pattern.source.replace(/\s+/g, ' ')}`;
			const dropped = container.dropped.map((selector) => slotFor(slots, selector));
			const unexplained = (container.reason ?? '').trim() === '';
			for (const [i, slot] of dropped.entries()) {
				if (slot === undefined)
					uncaptured.push(
						`${at} marks a @dropped node that names no slot (${container.dropped[i]?.kind ?? 'a wildcard'})`
					);
				else if (unexplained) uncaptured.push(`${at} drops ${slot.name} without a #set! reason`);
			}
			const kept = new Set([slotFor(slots, container.element), ...container.captures.map(slotOf), ...dropped]);
			for (const slot of slots)
				if (!kept.has(slot) && !isLayout(input, container.kind, slot))
					uncaptured.push(`${at} leaves ${slot.name} uncaptured`);
			if (container.captures.length === 0) continue;
			const targets = new Set(
				(slotFor(slots, container.element)?.kinds ?? []).flatMap((k) => {
					const direct = directVocab(input, k, [container.kind]);
					return direct === undefined ? [] : [direct];
				})
			);
			if (targets.size === 0) {
				untargeted.push(`${input.grammar}: ${container.kind} (${container.captures.map((c) => c.name).join(', ')})`);
				continue;
			}
			for (const capture of container.captures) {
				let kinds: string[];
				let multiple = false;
				if (capture.token !== null) kinds = ['boolean'];
				else {
					const slot = slotOf(capture);
					if (slot) {
						const resolved = slotResolution(input, container.kind, slot);
						kinds = [...resolved.tokens];
						multiple = slot.multiple || resolved.list;
					} else if (capture.kind !== null && vocabOf(input.grammar).has(capture.kind))
						kinds = [vocabOf(input.grammar).get(capture.kind) ?? ''];
					else continue;
				}
				multiple ||= capture.multiple;
				for (const t of targets) {
					const f = memberOf(t, camel(capture.name));
					for (const k of kinds) f.kinds.add(k);
					f.optional = true;
					f.multiple ||= multiple;
					f.scalar ||= !multiple;
					f.grammars.add(input.grammar);
				}
			}
		}
	}

	const collapse = (kinds: Set<string>): void => {
		if ([...kinds].some((k) => k.startsWith('text:'))) kinds.delete('number');
		for (const ns of ['expression', 'statement', 'pattern', 'type', 'declaration']) {
			if (!kinds.has(ns)) continue;
			for (const k of kinds) if (k.startsWith(`${ns}.`)) kinds.delete(k);
		}
	};
	for (const m of members.values()) for (const f of m.values()) collapse(f.kinds);

	const prefixes = new Set<string>();
	for (const v of allvocab) {
		const parts = v.split('.');
		for (let i = 1; i < parts.length; i += 1) prefixes.add(parts.slice(0, i).join('.'));
	}
	const cycles = inclusionCycles(inclusion);
	const unmapped = new Map<string, number>();
	for (const m of members.values())
		for (const f of m.values())
			for (const k of f.kinds) if (k.startsWith('<')) unmapped.set(k, (unmapped.get(k) ?? 0) + 1);

	return {
		grammars: inputs.map((i) => i.grammar),
		allvocab,
		prefixes,
		claimers,
		contentDerived,
		refinements,
		holes,
		members,
		cycles,
		untargeted: untargeted.sort(),
		uncaptured: uncaptured.sort(),
		unmapped
	};
}

export function childrenOf(d: Derivation, v: string): string[] {
	const depth = v.split('.').length;
	return [...new Set([...d.allvocab, ...d.prefixes])]
		.filter((o) => o.startsWith(`${v}.`) && o.split('.').length === depth + 1)
		.sort();
}

export function claimedBeneath(d: Derivation, v: string): string[] {
	return [...d.allvocab].filter((o) => (o === v || o.startsWith(`${v}.`)) && !d.refinements.has(o)).sort();
}

export function levelMembers(d: Derivation, v: string): Map<string, MemberFacts> {
	const merged = new Map<string, MemberFacts>();
	if (d.refinements.has(v)) return merged;
	const superset = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean => [...b].every((x) => a.has(x));
	const plainClaimers = (o: string): Set<string> => {
		const derivedIn = d.contentDerived.get(o) ?? new Set<string>();
		return new Set([...(d.claimers.get(o) ?? [])].filter((g) => !derivedIn.has(g)));
	};
	const requiredIn = (o: string, cm: string): boolean => {
		const own = d.members.get(o)?.get(cm);
		return own !== undefined && !own.optional && superset(own.grammars, plainClaimers(o));
	};
	const carriers = d.members.has(v) ? [v] : claimedBeneath(d, v);
	if (carriers.length === 0) return merged;
	const shared = [...(d.members.get(carriers[0] ?? v)?.keys() ?? [])].filter((cm) =>
		carriers.every((o) => d.members.get(o)?.has(cm))
	);
	const beneath = claimedBeneath(d, v);
	for (const cm of shared.sort()) {
		const m: MemberFacts = { ...facts(), scalar: false };
		for (const o of beneath) {
			const slot = d.members.get(o)?.get(cm);
			if (!slot) continue;
			for (const k of slot.kinds) m.kinds.add(k);
			m.multiple ||= slot.multiple;
			m.scalar ||= slot.scalar;
			for (const g of slot.grammars) m.grammars.add(g);
		}
		for (const [o, r] of d.refinements) {
			if (r.parent !== v && !r.parent.startsWith(`${v}.`)) continue;
			for (const t of r.literals.get(snake(cm)) ?? r.literals.get(cm) ?? []) m.kinds.add(`text:${t}`);
			for (const g of d.claimers.get(o) ?? []) m.grammars.add(g);
		}
		m.optional = !beneath.filter((o) => plainClaimers(o).size > 0).every((o) => requiredIn(o, cm));
		merged.set(cm, m);
	}
	return merged;
}
