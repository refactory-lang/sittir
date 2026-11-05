import { isVisibleGroupAlias } from '../rule-metadata.ts';
import { isParserHiddenName, isRecord } from '../rule-patterns.ts';

export function foldedDisplays(bodies: ReadonlyMap<string, unknown>): ReadonlyMap<string, readonly string[]> {
	const displays = new Map<string, Set<string>>();
	const visit = (rule: unknown): void => {
		if (Array.isArray(rule)) return rule.forEach(visit);
		if (!isRecord(rule)) return;
		const content = rule.content;
		if (
			rule.type === 'ALIAS' &&
			rule.named === true &&
			typeof rule.value === 'string' &&
			!isVisibleGroupAlias(rule) &&
			isRecord(content) &&
			content.type === 'SYMBOL' &&
			typeof content.name === 'string' &&
			isParserHiddenName(content.name)
		)
			(displays.get(content.name) ?? displays.set(content.name, new Set()).get(content.name)!).add(rule.value);
		Object.values(rule).forEach(visit);
	};
	bodies.forEach(visit);
	return new Map([...displays].filter(([, shown]) => shown.size > 1).map(([name, shown]) => [name, [...shown].sort()]));
}
