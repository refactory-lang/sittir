import { type ContainerCapture, type ModelSlot, KNOWN_PREDICATE_OPERATORS, WILDCARD } from './facts.ts';
import { camel, snake } from './names.ts';
import { type GrammarInput, type GrammarRoutes, isLayout, modelNode, resolveRoutes, slotFor } from './routes.ts';

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

function unknownPredicates(inputs: readonly GrammarInput[]): string[] {
	const out = new Set<string>();
	for (const input of inputs)
		for (const claim of input.bindings.claims)
			for (const predicate of claim.predicates)
				if (!KNOWN_PREDICATE_OPERATORS.has(predicate.operator))
					out.add(
						`${input.grammar}: #${predicate.operator}?${predicate.capture === null ? '' : ` on @${predicate.capture}`} (${claim.vocab})`
					);
	return [...out].sort();
}

function wildcardUnrouted(
	inputs: readonly GrammarInput[],
	routesOf: (grammar: string) => GrammarRoutes | undefined,
	members: ReadonlyMap<string, ReadonlyMap<string, MemberFacts>>
): string[] {
	const out = new Set<string>();
	for (const input of inputs) {
		const routes = routesOf(input.grammar);
		for (const [kind, entries] of routes?.readEntries ?? []) {
			const routed = new Set((routes?.members.get(kind) ?? []).map((m) => m.name));
			for (const { claim, claimed, vocab } of entries) {
				if (claim.kind !== WILDCARD) continue;
				const missing = [...(members.get(vocab) ?? [])].filter(([name, f]) => !f.optional && !routed.has(name)).map(([name]) => name);
				if (missing.length > 0) out.add(`${input.grammar}: ${claimed} as ${vocab} has no route for ${missing.join(', ')}`);
			}
		}
	}
	return [...out].sort();
}

function wildcardContainers(inputs: readonly GrammarInput[], routesOf: (grammar: string) => GrammarRoutes | undefined): string[] {
	const out: string[] = [];
	for (const input of inputs) {
		const declared = new Set(input.bindings.containers.map((c) => c.kind));
		for (const [kind, entries] of routesOf(input.grammar)?.readEntries ?? []) {
			const lands = modelNode(input.model, kind)?.modelType === 'list' ? 'list' : declared.has(kind) ? 'container' : undefined;
			if (lands === undefined) continue;
			for (const { claim } of entries) {
				if (claim.kind !== WILDCARD) continue;
				const at = claim.field === null ? '' : `${claim.field}: `;
				out.push(`${input.grammar}: (${claim.within[0]} ${at}(_) @${claim.vocab}) lands on ${lands} ${kind}`);
			}
		}
	}
	return out.sort();
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
	readonly unknownPredicates: readonly string[];
	readonly wildcardContainers: readonly string[];
	readonly wildcardUnrouted: readonly string[];
}

const unmappedToken = (grammar: string, kind: string): string => `<${grammar}:${kind.replace(/^_+/, '')}>`;

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

const facts = (): MemberFacts => ({
	kinds: new Set(),
	optional: false,
	multiple: false,
	scalar: false,
	grammars: new Set()
});

const isVocabularyKind = (token: string): boolean =>
	!token.startsWith('<') && !token.startsWith('text:') && !token.startsWith('literal:') && token !== 'boolean';

const scalarOf = (tokens: readonly string[]): Resolution => ({ tokens, list: false, scalar: tokens.length > 0 });

function collect(
	input: GrammarInput,
	allvocab: Set<string>,
	contentDerived: Map<string, Set<string>>,
	holes: Map<string, Map<string, string>>
): void {
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
		if (claim.predicates.length > 0)
			(contentDerived.get(claim.vocab) ?? contentDerived.set(claim.vocab, new Set<string>()).get(claim.vocab))?.add(
				input.grammar
			);
	}
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
	const routed = new Map<string, GrammarRoutes>();
	for (const input of inputs) {
		collect(input, allvocab, contentDerived, holes);
		routed.set(input.grammar, resolveRoutes(input));
	}
	const routesOf = (g: string): GrammarRoutes | undefined => routed.get(g);
	const vocabOf = (g: string): ReadonlyMap<string, string> => routesOf(g)?.vocabOf ?? new Map<string, string>();

	const unclaimedOf = new Map(
		inputs.map((input) => [input.grammar, new Set(input.bindings.unclaimed.map((u) => u.kind))])
	);
	const placedClaims = new Map(
		inputs.map((input) => [
			input.grammar,
			input.bindings.claims.flatMap((c) =>
				c.kind !== null && c.predicates.length === 0 && c.within.length > 0
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

	const resolveKind = (input: GrammarInput, k: string, context: readonly string[]): Resolution => {
		const g = input.grammar;
		const direct = directVocab(input, k, context);
		if (direct !== undefined) return scalarOf([direct]);
		if (unclaimedOf.get(g)?.has(k)) return scalarOf([]);
		const node = modelNode(input.model, k);
		if (input.textTokens.has(k) && node?.pattern != null) return scalarOf([`text:${node.pattern}`]);
		if (node?.modelType === 'enum') return scalarOf(node.enumMembers.map((m) => `text:${m.text}`));
		if (node?.modelType === 'keyword' || node?.modelType === 'punctuation') return scalarOf([`literal:${k}`]);
		const container = node !== undefined && !context.includes(node.kind) ? (routesOf(g)?.containers.get(node.kind) ?? null) : null;
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
		return scalarOf([unmappedToken(g, k)]);
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
		const routes = routesOf(input.grammar);
		if (!routes) continue;
		for (const [gk, entries] of routes.readEntries) {
			for (const entry of [...entries].sort((a, b) => a.index - b.index)) {
				const { vocab } = entry;
				(claimers.get(vocab) ?? claimers.set(vocab, new Set<string>()).get(vocab))?.add(input.grammar);
				if (entry.claim.kind === WILDCARD || entry.claim.predicates.length > 0) continue;
				if (entry.pins.length > 0) {
					const parent = vocabOf(input.grammar).get(gk);
					if (parent !== undefined && parent !== vocab) {
						const refinement =
							refinements.get(vocab) ??
							refinements.set(vocab, { parent, literals: new Map<string, Set<string>>() }).get(vocab);
						for (const pin of entry.pins)
							(refinement?.literals.get(pin.member) ?? refinement?.literals.set(pin.member, new Set<string>()).get(pin.member))?.add(pin.text);
						continue;
					}
				}
				if (!modelNode(input.model, gk)) continue;
				for (const route of routes.members.get(gk) ?? []) {
					const f = memberOf(vocab, route.name);
					if (route.route === 'slot') {
						const resolved = slotResolution(input, gk, route.slot);
						for (const t of resolved.tokens) f.kinds.add(t);
						f.optional ||= !route.slot.required;
						f.multiple ||= route.slot.multiple || resolved.list;
						f.scalar ||= !route.slot.multiple && resolved.scalar;
						f.grammars.add(input.grammar);
						continue;
					}
					if (route.route === 'kind') {
						f.kinds.add('boolean');
						f.optional = true;
						f.scalar = true;
						f.grammars.add(input.grammar);
						continue;
					}
					const bySelector = route.route === 'nested' && route.selector.kind === null;
					const kinds = route.route === 'presence' ? [] : route.selector.kind !== null ? [route.selector.kind] : [...(route.slot?.kinds ?? [])];
					const multiple = route.route === 'nested' && ((bySelector && (route.slot?.multiple ?? false)) || route.multiple);
					if (route.route === 'presence' || (bySelector && route.slot?.storage === 'boolean')) f.kinds.add('boolean');
					let list = multiple;
					let scalar = false;
					for (const k of kinds) {
						const resolved = resolveKind(input, k, [gk]);
						for (const t of resolved.tokens) f.kinds.add(t);
						list ||= resolved.list;
						scalar ||= resolved.scalar;
					}
					f.optional = true;
					f.multiple ||= list;
					f.scalar ||= !multiple && (scalar || !list);
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
				return token !== null ? slots.find((slot) => slot.terminals.includes(token)) : slotFor(input.model, slots, capture);
			};
			const at = `${input.grammar}:${container.pattern.line} ${container.pattern.source.replace(/\s+/g, ' ')}`;
			const dropped = container.dropped.map((selector) => slotFor(input.model, slots, selector));
			const unexplained = (container.reason ?? '').trim() === '';
			for (const [i, slot] of dropped.entries()) {
				if (slot === undefined)
					uncaptured.push(
						`${at} marks a @dropped node that names no slot (${container.dropped[i]?.kind ?? 'a wildcard'})`
					);
				else if (unexplained) uncaptured.push(`${at} drops ${slot.name} without a #set! reason`);
			}
			const kept = new Set([slotFor(input.model, slots, container.element), ...container.captures.map(slotOf), ...dropped]);
			for (const slot of slots)
				if (!kept.has(slot) && !isLayout(input, container.kind, slot))
					uncaptured.push(`${at} leaves ${slot.name} uncaptured`);
			if (container.captures.length === 0) continue;
			const targets = new Set(
				(slotFor(input.model, slots, container.element)?.kinds ?? []).flatMap((k) => {
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
		unmapped,
		unknownPredicates: unknownPredicates(inputs),
		wildcardContainers: wildcardContainers(inputs, routesOf),
		wildcardUnrouted: wildcardUnrouted(inputs, routesOf, members)
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

export type ArmClass = 'scalar' | 'role' | 'ref' | 'text' | 'unmapped';
export type Scalar = 'string' | 'boolean' | 'number';
const SCALARS: ReadonlySet<string> = new Set<Scalar>(['string', 'boolean', 'number']);
export const isScalar = (kind: string): kind is Scalar => SCALARS.has(kind);

export function armClass(kind: string): ArmClass {
	if (isScalar(kind)) return 'scalar';
	if (kind.startsWith('text:') || kind.startsWith('literal:')) return 'text';
	if (kind.startsWith('<')) return 'unmapped';
	return kind.startsWith('set:') || kind.includes('.') ? 'ref' : 'role';
}

export function soleRole(d: Derivation, kinds: ReadonlySet<string>): { role: string; text: string[] } | undefined {
	const collapsed = collapsedKinds(d, kinds);
	const [role, ...others] = collapsed.filter((k) => armClass(k) === 'role');
	if (role === undefined || others.length > 0) return undefined;
	const text = collapsed.filter((k) => armClass(k) === 'text');
	return text.length + 1 === collapsed.length ? { role, text } : undefined;
}

export function directKinds(d: Derivation, kinds: ReadonlySet<string>): string[] | undefined {
	const sole = soleRole(d, kinds);
	if (sole !== undefined) return [sole.role];
	const collapsed = collapsedKinds(d, kinds);
	const classes = new Set(collapsed.map(armClass));
	if (collapsed.length > 0 && classes.size === 1 && (classes.has('ref') || classes.has('scalar'))) return collapsed;
	return undefined;
}

export interface SlotEntry {
	readonly path: string;
	readonly member: string;
	readonly facts: MemberFacts;
}

export function levelsWithMembers(d: Derivation): string[] {
	return [...new Set([...d.allvocab, ...d.prefixes])].filter((v) => !d.refinements.has(v) && !d.holes.has(v)).sort();
}

export function slotEntries(d: Derivation): SlotEntry[] {
	return levelsWithMembers(d).flatMap((v) =>
		[...levelMembers(d, v)]
			.sort(([a], [b]) => a.localeCompare(b))
			.filter(([, f]) => directKinds(d, f.kinds) === undefined)
			.map(([member, facts]) => ({ path: v, member, facts }))
	);
}

export function collapsedKinds(d: Derivation, kinds: ReadonlySet<string>): string[] {
	const byns = new Map<string, Set<string>>();
	for (const k of kinds) {
		if (k.includes('.') && !k.startsWith('text:') && !k.startsWith('literal:') && !k.startsWith('<')) {
			const ns = k.split('.')[0] ?? k;
			(byns.get(ns) ?? byns.set(ns, new Set()).get(ns))?.add(k);
		}
	}
	const remaining = new Set(kinds);
	const all = new Set([...d.allvocab, ...d.prefixes]);
	for (const [ns, ks] of byns) {
		if (remaining.has(ns)) {
			for (const k of ks) remaining.delete(k);
			continue;
		}
		if (ks.size < 2) continue;
		const prefix = commonPrefix([...ks].sort()) ?? ns;
		if (prefix === ns) {
			for (const k of ks) remaining.delete(k);
			remaining.add(ns);
		} else if ([...all].some((o) => o.startsWith(`${prefix}.`))) {
			for (const k of ks) remaining.delete(k);
			remaining.add(`set:${prefix}`);
		}
	}
	return [...remaining].sort();
}
