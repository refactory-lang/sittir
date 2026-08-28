import type { AnyRule } from '../types/rule.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import { SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts

export class RuleWalker<R extends AnyRule = AnyRule> {
	readonly #rules?: Readonly<Record<string, R>>;
	readonly diagnostics?: DiagnosticSink;

	constructor(rules?: Readonly<Record<string, R>>, diagnostics?: DiagnosticSink) {
		this.#rules = rules;
		this.diagnostics = diagnostics;
	}

	childEdgesOf(rule: R): readonly { readonly segment: readonly (string | number)[]; readonly child: R }[] {
		const out: { readonly segment: readonly (string | number)[]; readonly child: R }[] = [];
		const bag = rule as { members?: readonly R[]; content?: R; separator?: { value: R } };
		if (Array.isArray(bag.members)) {
			bag.members.forEach((child, i) => out.push({ segment: ['members', i], child }));
		} else if (bag.content && typeof bag.content === 'object') {
			out.push({ segment: ['content'], child: bag.content });
		}
		if (bag.separator && typeof bag.separator === 'object' && 'value' in bag.separator)
			out.push({ segment: ['separator', 'value'], child: bag.separator.value as R });
		return out;
	}

	childrenOf(rule: R): readonly R[] {
		return this.childEdgesOf(rule).map((e) => e.child);
	}

	map(rule: R, visit: (r: R) => R): R {
		const bag = rule as {
			members?: readonly R[];
			content?: R;
			separator?: { value: R; trailing?: boolean; leading?: boolean };
		};
		const patch: {
			members?: readonly R[];
			content?: R;
			separator?: { value: R; trailing?: boolean; leading?: boolean };
		} = {};

		if (Array.isArray(bag.members)) {
			let membersChanged = false;
			const next = bag.members.map((m) => {
				const out = visit(this.map(m, visit));
				if (out !== m) membersChanged = true;
				return out;
			});
			if (membersChanged) patch.members = next;
		} else if (bag.content && typeof bag.content === 'object') {
			const out = visit(this.map(bag.content, visit));
			if (out !== bag.content) patch.content = out;
		}

		const sep = bag.separator;
		if (sep && typeof sep === 'object' && 'value' in sep) {
			const out = visit(this.map(sep.value, visit));
			if (out !== sep.value) patch.separator = { ...sep, value: out };
		}

		return Object.keys(patch).length > 0 ? ({ ...(rule as object), ...patch } as unknown as R) : rule;
	}

	fold<A>(rule: R, init: A, f: (acc: A, r: R) => A): A {
		let acc = f(init, rule);
		for (const child of this.childrenOf(rule)) acc = this.fold(child, acc, f);
		return acc;
	}

	find(rule: R, pred: (r: R) => boolean): R | undefined {
		if (pred(rule)) return rule;
		for (const child of this.childrenOf(rule)) {
			const hit = this.find(child, pred);
			if (hit !== undefined) return hit;
		}
		return undefined;
	}

	deref(ref: R): R | undefined {
		if (this.#rules === undefined) {
			throw new Error('RuleWalker.deref: walker was constructed without a rules map');
		}
		if (ref.type !== SYMBOL) return undefined;
		return this.#rules[(ref as { name: string }).name];
	}

	foldDeep<A>(rule: R, init: A, f: (acc: A, r: R) => A): A {
		const seen = new Set<R>();
		const go = (r: R, acc: A): A => {
			if (seen.has(r)) return acc;
			seen.add(r);
			acc = f(acc, r);
			if (r.type === SYMBOL) {
				const target = this.deref(r);
				return target === undefined ? acc : go(target, acc);
			}
			for (const child of this.childrenOf(r)) acc = go(child, acc);
			return acc;
		};
		return go(rule, init);
	}

	findDeep(rule: R, pred: (r: R) => boolean): R | undefined {
		const seen = new Set<R>();
		const go = (r: R): R | undefined => {
			if (seen.has(r)) return undefined;
			seen.add(r);
			if (pred(r)) return r;
			if (r.type === SYMBOL) {
				const target = this.deref(r);
				return target === undefined ? undefined : go(target);
			}
			for (const child of this.childrenOf(r)) {
				const hit = go(child);
				if (hit !== undefined) return hit;
			}
			return undefined;
		};
		return go(rule);
	}
}
