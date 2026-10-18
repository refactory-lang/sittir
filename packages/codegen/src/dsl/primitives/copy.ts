import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { nativeRuleFn } from '../enrich.ts';
import { isParserHiddenName } from '../rule-patterns.ts';
import { recordAlias } from '../transform/transform.ts';
import { wireCopy, wireCopyOf, wireCopyReference, wireEditCopy, wireGetCurrentRuleKind, wireNoteCopyDisplay, wireNoteCopyReference, wireRefuse } from '../wire/wire.ts';

const symbol = (name: string): RuntimeRule => nativeRuleFn<(name: string) => RuntimeRule>('sym', 'symbol')(name);

const nativeAlias = (content: unknown, value: unknown): RuntimeRule => nativeRuleFn<(content: unknown, value: unknown) => RuntimeRule>('alias')(content, value);

const nameOf = (rule: unknown): string => (typeof rule === 'string' ? rule : (nativeAlias(symbol('_'), rule) as unknown as { readonly value: string }).value);

export function copyReference(copy: string, source: string, shown?: string): RuntimeRule {
	const display = shown ?? (isParserHiddenName(source) ? undefined : source);
	const reference = display === undefined ? symbol(copy) : nativeAlias(symbol(copy), symbol(display));
	if (shown !== undefined && shown !== source) recordAlias(source, shown);
	wireNoteCopyDisplay(copy, display);
	return wireNoteCopyReference(reference, copy);
}

export function reachedCopyReference(reference: RuntimeRule, copy: string, source: string, shown?: string): RuntimeRule {
	const display = displayOf(reference);
	if (shown !== undefined && shown !== display && !displaysConflict(copy, source, display, shown)) return copyReference(copy, source, shown);
	return referencedNameOf(reference) === copy ? reference : wireNoteCopyReference(repointed(reference, copy), copy);
}

function displayOf(reference: RuntimeRule): string | undefined {
	const alias = reference as unknown as { readonly type: string; readonly value?: string };
	return alias.type === 'ALIAS' ? alias.value : undefined;
}

function referencedNameOf(reference: RuntimeRule): string {
	const shown = reference as unknown as { readonly type: string; readonly name?: string; readonly content?: { readonly name: string } };
	return shown.type === 'ALIAS' ? shown.content!.name : shown.name!;
}

function repointed(reference: RuntimeRule, copy: string): RuntimeRule {
	const alias = reference as unknown as { readonly type: string; readonly named: boolean; readonly value: string };
	return alias.type === 'ALIAS' ? nativeAlias(symbol(copy), alias.named ? symbol(alias.value) : alias.value) : symbol(copy);
}

function displaysConflict(copy: string, source: string, display: string | undefined, shown: string): boolean {
	if (display === undefined || display === source) return false;
	const owner = wireGetCurrentRuleKind() ?? '';
	wireRefuse({
		code: 'edit-site-conflict',
		ownerKind: owner,
		message: `edits: '${owner}': the copy '${copy}' is shown as '${display}', and a path shows it as '${shown}'`,
		details: { kind: owner, copy, displays: [display, shown] }
	});
	return true;
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
	return shown.named ? copyReference(made, wireCopyOf(made)!.source, shown.value) : undefined;
}

export function editedCopy<R>(reference: R, edit: (body: RuntimeRule) => RuntimeRule): R | undefined {
	const made = wireCopyReference(reference);
	if (made === undefined) return undefined;
	wireEditCopy(made, edit);
	return reference;
}
