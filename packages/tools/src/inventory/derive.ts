import { type PatternNode, walk } from './query.ts';
import type { ModelNode, ModelSlot, SlotModel } from './model.ts';

export interface GrammarInput {
	readonly grammar: string;
	readonly patterns: readonly PatternNode[];
	readonly model: SlotModel;
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
	readonly containers: PatternNode[];
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

function firstNodeSlot(slots: readonly ModelSlot[]): ModelSlot | undefined {
	return slots.find((s) => s.storage !== 'boolean' && s.kinds.length > 0);
}

function slotFor(slots: readonly ModelSlot[], n: PatternNode): ModelSlot | undefined {
	if (n.field !== null) return slotByField(slots, n.field);
	if (n.kind !== null && n.kind !== '<token>' && n.kind !== '_' && n.kind !== '<group>')
		return slotByKind(slots, n.kind);
	return firstNodeSlot(slots);
}

function modelNode(model: SlotModel, kind: string): ModelNode | undefined {
	return model.get(kind) ?? model.get(`_${kind}`);
}

function parentOf(top: PatternNode, n: PatternNode): PatternNode | undefined {
	for (const par of walk(top)) if (par.children.includes(n)) return par;
	return undefined;
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
	const containers: PatternNode[] = [];
	const push = <T>(m: Map<string, T[]>, k: string, v: T): void => {
		const list = m.get(k);
		if (list) list.push(v);
		else m.set(k, [v]);
	};
	for (const top of input.patterns) {
		const nodes = [...walk(top)];
		if (
			top.kind !== null &&
			top.kind !== '<group>' &&
			!top.captures.some((c) => c.includes('.')) &&
			nodes.some((n) => n.captures.includes('element'))
		) {
			containers.push(top);
			continue;
		}
		const hasPredicate = nodes.some((n) => n.predicates.length > 0);
		for (const n of nodes) {
			for (const pred of n.predicates) {
				if (pred[0] !== '#match?' || pred.length < 3) continue;
				const target = (pred[1] ?? '').slice(1);
				const rx = (pred[2] ?? '').slice(1, -1);
				const groups = [...rx.matchAll(/\(\?<(\w+)>/g)].map((m) => m[1] ?? '');
				if (groups.length === 0 || !(rx.startsWith('^') && rx.endsWith('$'))) continue;
				const template = rx.slice(1, -1).replace(/\(\?<\w+>[^)]*\)/g, '${string}');
				for (const v of nodes.flatMap((m) => m.captures.filter((c) => c.includes('.')))) {
					const h = holes.get(v) ?? new Map<string, string>();
					h.set(camel(target), `\`${template}\``);
					for (const grp of groups) h.set(camel(grp), 'string');
					holes.set(v, h);
				}
			}
		}
		const topKind = top.kind !== null && top.kind !== '<group>' ? top.kind : null;
		for (const n of nodes) {
			for (const cap of n.captures) {
				if (cap.includes('.') || (n === top && !cap.startsWith('_'))) {
					allvocab.add(cap);
					const k = n.kind !== null && n.kind !== '<group>' ? n.kind : (n.children[0]?.kind ?? null);
					if (hasPredicate)
						(contentDerived.get(cap) ?? contentDerived.set(cap, new Set<string>()).get(cap))?.add(input.grammar);
					const toplevel = n === top || (top.kind === '<group>' && top.children.includes(n));
					if (k !== null && k !== '<token>') {
						const fieldLiterals = n.kind !== null && n.kind !== '<group>' ? { ...n.fieldLiterals } : {};
						const slots = modelNode(input.model, k)?.slots ?? [];
						for (const child of n.children) {
							if (child.kind !== '<token>' || child.field !== null || child.text === null || child.captures.length > 0)
								continue;
							const text = child.text;
							const pinned = slots.find((sl) => sl.terminals.includes(text));
							if (pinned && !(pinned.name in fieldLiterals)) fieldLiterals[pinned.name] = text;
						}
						push(claims, k, { vocab: cap, predicate: hasPredicate, fieldLiterals, toplevel });
					}
					continue;
				}
				if (cap.startsWith('_') || cap === 'element') continue;
				const par = parentOf(top, n);
				if (par === undefined || par.kind === null || par.kind === '<group>') continue;
				if (par === top || topKind === null) {
					if (n.kind === '<token>' && n.field === null) {
						push(deep, par.kind, { name: cap, kinds: [], boolean: true, multiple: false, via: new Set<string>() });
						continue;
					}
					const key = n.field ?? n.kind;
					if (key !== null)
						(renames.get(par.kind) ?? renames.set(par.kind, new Map<string, string>()).get(par.kind))?.set(key, cap);
					continue;
				}
				const via = new Set<string>();
				let cursor: PatternNode | undefined = par;
				while (cursor !== undefined && cursor !== top) {
					if (cursor.kind !== null && cursor.kind !== '<group>') via.add(cursor.kind);
					cursor = parentOf(top, cursor);
				}
				if (n.kind === '<token>') {
					push(deep, topKind, { name: cap, kinds: [], boolean: true, multiple: false, via });
					continue;
				}
				const parNode = modelNode(input.model, par.kind);
				const named = n.kind !== null && n.kind !== '_' && n.kind !== '<group>';
				const slot = parNode && !named ? slotFor(parNode.slots, n) : undefined;
				push(deep, topKind, {
					name: cap,
					kinds: named && n.kind !== null ? [n.kind] : [...(slot?.kinds ?? [])],
					boolean: slot?.storage === 'boolean',
					multiple: (!named && (slot?.multiple ?? false)) || n.quantifier === '*' || n.quantifier === '+',
					via
				});
			}
		}
	}
	return { claims, renames, deep, containers };
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

	const derivedSuper = new Map<string, readonly string[] | null>();
	const inclusion = new Map<string, Set<string>>();
	const supertypeKind = (input: GrammarInput, sk: string, seen: readonly string[]): readonly string[] | null => {
		const memoKey = `${input.grammar} ${sk}`;
		const memo = derivedSuper.get(memoKey);
		if (memo !== undefined) return memo;
		const subtypes = modelNode(input.model, sk)?.subtypes ?? [];
		if (subtypes.length === 0 || seen.includes(sk)) return null;
		const vs: (readonly string[])[] = [];
		for (const m of subtypes) {
			const direct = vocabOf(input.grammar).get(m);
			const v = direct !== undefined ? [direct] : supertypeKind(input, m, [...seen, sk]);
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
		const inc = inclusion.get(memoKey) ?? inclusion.set(memoKey, new Set<string>()).get(memoKey);
		for (const p of parts) if (!p.includes('.') && p !== sk) inc?.add(p);
		derivedSuper.set(memoKey, parts);
		return parts;
	};

	const kindToVocab = (input: GrammarInput, k: string): readonly string[] => {
		const direct = vocabOf(input.grammar).get(k) ?? vocabOf(input.grammar).get(k.replace(/^_+/, ''));
		if (direct !== undefined) return [direct];
		const node = modelNode(input.model, k);
		if (node?.modelType === 'enum') return node.enumValues.map((v) => `text:${v}`);
		if (node?.modelType === 'token') return [`literal:${k}`];
		if (node && node.subtypes.length > 0) {
			const parts = supertypeKind(input, k, []);
			if (parts) return parts;
		}
		return [`<${input.grammar}:${k.replace(/^_+/, '')}>`];
	};
	const slotTokens = (input: GrammarInput, slot: ModelSlot): string[] => {
		if (slot.storage === 'boolean') return ['boolean'];
		const out = slot.terminals.map((t) => `text:${t}`);
		for (const k of slot.kinds) out.push(...kindToVocab(input, k));
		return out;
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
				const literals = Object.entries(claim.fieldLiterals);
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
				const node = modelNode(input.model, gk);
				if (!node) continue;
				const deep = c.deep.get(gk) ?? [];
				const via = new Set(deep.flatMap((d) => [...d.via]));
				const rn = c.renames.get(gk) ?? new Map<string, string>();
				for (const slot of node.slots) {
					if (slot.kinds.some((k) => via.has(k))) continue;
					const raw = slot.propertyName;
					const bare = raw.replace(/_$/, '');
					const renamed = rn.get(bare) ?? rn.get(snake(bare)) ?? [...rn].find(([k]) => snake(k) === bare)?.[1];
					const cm = camel(renamed ?? bare.replace(/(?:Marker|Modifier)$/, ''));
					const f = memberOf(claim.vocab, cm);
					for (const t of slotTokens(input, slot)) f.kinds.add(t);
					f.optional ||= !slot.required;
					f.multiple ||= slot.multiple;
					f.scalar ||= !slot.multiple;
					f.grammars.add(input.grammar);
				}
				for (const d of deep) {
					const f = memberOf(claim.vocab, camel(d.name));
					if (d.boolean) f.kinds.add('boolean');
					for (const k of d.kinds) for (const t of kindToVocab(input, k)) f.kinds.add(t);
					f.optional = true;
					f.multiple ||= d.multiple;
					f.scalar ||= !d.multiple;
					f.grammars.add(input.grammar);
				}
			}
		}
	}

	for (const input of inputs) {
		for (const top of collected.get(input.grammar)?.containers ?? []) {
			const slots = top.kind !== null ? (modelNode(input.model, top.kind)?.slots ?? []) : [];
			const element = [...walk(top)].find((n) => n.captures.includes('element'));
			if (!element) continue;
			const targets = new Set<string>();
			for (const k of slotFor(slots, element)?.kinds ?? []) {
				for (const v of kindToVocab(input, k)) {
					if (v.startsWith('<') || v === 'boolean' || v.startsWith('text:')) continue;
					if (v.includes('.')) targets.add(v);
					else
						for (const [p, gs] of claimers)
							if (gs.has(input.grammar) && (p === v || p.startsWith(`${v}.`))) targets.add(p);
				}
			}
			for (const n of walk(top)) {
				for (const cap of n.captures) {
					if (cap === 'element' || cap.startsWith('_')) continue;
					let kinds: string[];
					let multiple = false;
					if (n.kind === '<token>') kinds = ['boolean'];
					else {
						const slot = slotFor(slots, n);
						if (slot) {
							kinds = slotTokens(input, slot);
							multiple = slot.multiple;
						} else if (n.kind !== null && vocabOf(input.grammar).has(n.kind))
							kinds = [vocabOf(input.grammar).get(n.kind) ?? ''];
						else continue;
					}
					multiple ||= n.quantifier === '*' || n.quantifier === '+';
					for (const t of targets) {
						const f = memberOf(t, camel(cap));
						for (const k of kinds) f.kinds.add(k);
						f.optional = true;
						f.multiple ||= multiple;
						f.scalar ||= !multiple;
						f.grammars.add(input.grammar);
					}
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
	const cycles: string[] = [];
	for (const [key, bs] of inclusion) {
		const [g, a] = key.split(' ');
		for (const b of bs) if (a !== undefined && inclusion.get(`${g} ${b}`)?.has(a)) cycles.push(`${g}: ${a} <-> ${b}`);
	}
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
	const requiredIn = (o: string, cm: string): boolean => {
		const own = d.members.get(o)?.get(cm);
		return own !== undefined && !own.optional && superset(own.grammars, d.claimers.get(o) ?? new Set());
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
		m.optional = !beneath.every((o) => requiredIn(o, cm));
		merged.set(cm, m);
	}
	return merged;
}
