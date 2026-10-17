import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { nativeRuleFn } from '../enrich.ts';
import { isParserHiddenName } from '../rule-patterns.ts';
import { recordAlias } from '../transform/transform.ts';
import { wireCopy, wireCopyReference, wireCopySource, wireEditCopy, wireNoteCopyReference } from '../wire/wire.ts';

const symbol = (name: string): RuntimeRule => nativeRuleFn<(name: string) => RuntimeRule>('sym', 'symbol')(name);

const nativeAlias = (content: unknown, value: unknown): RuntimeRule => nativeRuleFn<(content: unknown, value: unknown) => RuntimeRule>('alias')(content, value);

const nameOf = (rule: unknown): string => (typeof rule === 'string' ? rule : (nativeAlias(symbol('_'), rule) as unknown as { readonly value: string }).value);

export function copyReference(copy: string, source: string, shown?: string): RuntimeRule {
	const reference =
		shown === undefined && isParserHiddenName(source)
			? symbol(copy)
			: nativeAlias(symbol(copy), symbol(shown ?? source));
	if (shown !== undefined && shown !== source) recordAlias(source, shown);
	return wireNoteCopyReference(reference, copy);
}

export function copy(source: unknown, path = '.'): RuntimeRule {
	const name = nameOf(source);
	const made = wireCopy({ source: name, part: path, via: 'copy' }, (body) => body);
	return made === undefined ? symbol(name) : copyReference(made, name);
}

export function namedCopy(reference: unknown, value: unknown): RuntimeRule | undefined {
	const made = wireCopyReference(reference);
	if (made === undefined) return undefined;
	const shown = nativeAlias(symbol(made), value) as unknown as { readonly named: boolean; readonly value: string };
	return shown.named ? copyReference(made, wireCopySource(made)!, shown.value) : undefined;
}

export function editedCopy<R>(reference: R, edit: (body: RuntimeRule) => RuntimeRule): R | undefined {
	const made = wireCopyReference(reference);
	if (made === undefined) return undefined;
	wireEditCopy(made, edit);
	return reference;
}
