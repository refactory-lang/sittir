/**
 * dsl/rule-walker.ts — RuleWalker<R>: the one traversal engine (R12 PR-6).
 *
 * One canonical child-edge relation (`childrenOf`) + thin primitives over it.
 * The walker owns RECURSION, never DISPATCH: call sites keep exhaustive
 * `switch (rule.type)` arms (feedback_rule_type_discrimination).
 * Layering mirrors RuleBuilder: dsl-side class; compiler's BaseCtx binds an
 * instance over its rules map (+ diagnostics).
 * Spec: docs/superpowers/specs/2026-07-01-r12-rulewalker-design.md
 */
import type { AnyRule } from '../types/rule.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import { SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts

export class RuleWalker<R extends AnyRule = AnyRule> {
	readonly #rules?: Readonly<Record<string, R>>;
	/** Sink for future diagnostic-emitting walks (slot-grouping family). Public
	 *  readonly (not #private) — nothing reads it yet; a private field would
	 *  trip the unused-member lint. */
	readonly diagnostics?: DiagnosticSink;

	constructor(rules?: Readonly<Record<string, R>>, diagnostics?: DiagnosticSink) {
		this.#rules = rules;
		this.diagnostics = diagnostics;
	}

	/**
	 * THE canonical child-edge relation — single source of truth for "what
	 * are this rule's children": `members` (seq/choice), `content` (wrappers/
	 * variant/group/token/alias), and a stamped separator rule (the nested
	 * `separator.value` — a single `Rule`, PR-S — `trailing`/`leading` live
	 * alongside it on the wrapper object but aren't rule-tree edges). Leaves
	 * return [].
	 * Walks needing a narrower set early-return on those types in their own
	 * lambda; this relation never grows per-walk options.
	 * map, fold, find, foldDeep, and findDeep all use this relation
	 * identically — no narrower traversal exists.
	 */
	childrenOf(rule: R): readonly R[] {
		const out: R[] = [];
		const bag = rule as { members?: readonly R[]; content?: R; separator?: { value: R } };
		if (Array.isArray(bag.members)) out.push(...bag.members);
		else if (bag.content && typeof bag.content === 'object') out.push(bag.content);
		if (bag.separator && typeof bag.separator === 'object' && 'value' in bag.separator)
			out.push(bag.separator.value as R);
		return out;
	}

	/**
	 * Bottom-up rebuild. Applies `visit` to each child's mapped result, then
	 * rebuilds this node ONLY if a child changed. Returns the SAME reference
	 * when nothing changed — load-bearing for fixpoint loops that compare
	 * `r === before` (enrich). Each edge (`members`, `content`, separator)
	 * tracks its own change independently, so an untouched sibling edge keeps
	 * its exact input reference even when another edge on the same node is
	 * rebuilt. Rebuilds via the SAME `childrenOf` edge relation `fold`/`find`
	 * use.
	 */
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

	/** Pre-order accumulate: visits `rule` itself, then descends childrenOf. */
	fold<A>(rule: R, init: A, f: (acc: A, r: R) => A): A {
		let acc = f(init, rule);
		for (const child of this.childrenOf(rule)) acc = this.fold(child, acc, f);
		return acc;
	}

	/** Pre-order search: tests `rule` itself, short-circuits on first match. */
	find(rule: R, pred: (r: R) => boolean): R | undefined {
		if (pred(rule)) return rule;
		for (const child of this.childrenOf(rule)) {
			const hit = this.find(child, pred);
			if (hit !== undefined) return hit;
		}
		return undefined;
	}

	/** One-step SYMBOL resolve through the bound rules map. */
	deref(ref: R): R | undefined {
		if (this.#rules === undefined) {
			throw new Error('RuleWalker.deref: walker was constructed without a rules map');
		}
		if (ref.type !== SYMBOL) return undefined;
		return this.#rules[(ref as { name: string }).name];
	}

	/**
	 * fold that additionally descends THROUGH symbol refs (cycle-safe). Each
	 * reachable rule node is visited at most once per invocation (seen-set
	 * keyed on node identity); symbol refs are followed through the bound
	 * rules map.
	 */
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

	/**
	 * find that additionally descends THROUGH symbol refs (cycle-safe). Each
	 * reachable rule node is visited at most once per invocation (seen-set
	 * keyed on node identity); symbol refs are followed through the bound
	 * rules map.
	 */
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
