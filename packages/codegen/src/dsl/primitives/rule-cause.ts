export type RuleCause = 'alias-shape' | 'ambiguity';

export type RuleCauseDeclaration = { readonly kind: 'reauthored'; readonly cause: RuleCause } | { readonly kind: 'vocabulary' };

const RULE_CAUSE = Symbol.for('sittir.ruleCause');

function tag<F extends (...args: never[]) => unknown>(body: F, declaration: RuleCauseDeclaration): F {
	Object.defineProperty(body, RULE_CAUSE, { value: declaration, enumerable: false, writable: false });
	return body;
}

export function reauthored<F extends (...args: never[]) => unknown>(cause: RuleCause, body: F): F {
	return tag(body, { kind: 'reauthored', cause });
}

export function vocabulary<F extends (...args: never[]) => unknown>(body: F): F {
	return tag(body, { kind: 'vocabulary' });
}

export function ruleCauseOf(fn: unknown): RuleCauseDeclaration | undefined {
	if (typeof fn !== 'function') return undefined;
	return (fn as { [RULE_CAUSE]?: RuleCauseDeclaration })[RULE_CAUSE];
}
