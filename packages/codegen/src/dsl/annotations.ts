import type { RuleAnnotations } from '../types/rule.ts';

export function withAnnotations<R>(rule: R, extra: RuleAnnotations): R {
	const node = rule as { type?: string; content?: unknown; annotations?: RuleAnnotations };
	if (node?.type === 'ALIAS' && node.content !== null && typeof node.content === 'object') {
		const content = node.content as { annotations?: RuleAnnotations };
		return {
			...(node as object),
			content: { ...(content as object), annotations: { ...content.annotations, ...extra } }
		} as R;
	}
	return { ...(node as object), annotations: { ...node.annotations, ...extra } } as R;
}

export function annotationsOf(rule: unknown): RuleAnnotations | undefined {
	const node = rule as { type?: string; content?: unknown; annotations?: RuleAnnotations } | undefined;
	if (node?.type === 'ALIAS') return node.content !== null && typeof node.content === 'object' ? (node.content as { annotations?: RuleAnnotations }).annotations : undefined;
	return node?.annotations;
}

export function withHoistedAnnotation<T>(rule: T): T {
	return withAnnotations(rule, { hoisted: true });
}
