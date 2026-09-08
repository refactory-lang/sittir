import type { RuleAnnotations } from '../types/rule.ts';
import type { RuntimeRule } from '../types/runtime-shapes.ts';

export function withAnnotations(rule: unknown, extra: RuleAnnotations): RuntimeRule {
	const node = rule as { type?: string; content?: unknown; annotations?: RuleAnnotations };
	if (node?.type === 'ALIAS' && node.content !== null && typeof node.content === 'object') {
		const content = node.content as { annotations?: RuleAnnotations };
		return {
			...(node as object),
			content: { ...(content as object), annotations: { ...content.annotations, ...extra } }
		} as unknown as RuntimeRule;
	}
	return { ...(node as object), annotations: { ...node.annotations, ...extra } } as unknown as RuntimeRule;
}

export function withHoistedAnnotation<T>(rule: T): T {
	return withAnnotations(rule, { hoisted: true }) as unknown as T;
}
