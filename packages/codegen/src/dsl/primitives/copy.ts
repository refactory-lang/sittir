import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { nativeRuleFn } from '../enrich.ts';
import { recordAlias } from '../transform/transform.ts';
import type { AnyRule } from '../../types/rule.ts';
import { RuleWalker } from '../rule-walker.ts';
import { VerbRefusal } from '../verbs/copy.ts';
import { wireCopy, wireCopyDeposit, wireCopyOf, wireCopyReference, wireEditCopy, wireEntryShown, wireIsShown, wireNoteCopyDisplay, wireNoteCopyReference } from '../wire/wire.ts';

const walker = new RuleWalker<AnyRule>();

const symbol = (name: string): RuntimeRule => nativeRuleFn<(name: string) => RuntimeRule>('sym', 'symbol')(name);

const nativeAlias = (content: unknown, value: unknown): RuntimeRule => nativeRuleFn<(content: unknown, value: unknown) => RuntimeRule>('alias')(content, value);

const nameOf = (rule: unknown): string => (typeof rule === 'string' ? rule : (nativeAlias(symbol('_'), rule) as unknown as { readonly value: string }).value);

export function copyReference(copy: string, source: string, shown?: string): RuntimeRule {
	const display = shown ?? (wireIsShown(source) ? source : undefined);
	if (display === undefined) return bareReference(copy);
	const reference = nativeAlias(symbol(copy), symbol(display));
	if (shown !== undefined && shown !== source) recordAlias(source, shown);
	wireNoteCopyDisplay(copy, display);
	return wireNoteCopyReference(reference, copy);
}

function bareReference(copy: string): RuntimeRule {
	wireNoteCopyDisplay(copy, undefined);
	return wireNoteCopyReference(symbol(copy), copy);
}

export function reachedCopyReference(reference: RuntimeRule, copy: string, source: string, shown?: string): RuntimeRule {
	const display = displayOf(reference);
	if (shown !== undefined && shown !== display) {
		refuseRedisplay(copy, source, display, shown);
		return copyReference(copy, source, shown);
	}
	return referencedNameOf(reference) === copy ? reference : wireNoteCopyReference(repointed(reference, copy), copy);
}

export function refuseSplitDisplays(rule: RuntimeRule): RuntimeRule {
	const shown = wireEntryShown();
	if (shown.size === 0) return rule;
	const displays = referenceDisplays(rule);
	for (const [copy, display] of shown)
		for (const other of displays.get(copy) ?? [])
			if (other !== display)
				throw new VerbRefusal('edit-site-conflict', `the copy '${copy}' is shown as '${display ?? copy}' and as '${other ?? copy}'`, { copy, displays: [display ?? copy, other ?? copy] });
	return rule;
}

function referenceDisplays(rule: RuntimeRule): Map<string, Set<string | undefined>> {
	const displays = new Map<string, Set<string | undefined>>();
	const visit = (node: RuntimeRule | undefined): void => {
		if (node === undefined) return;
		const copy = copyReferencedBy(node);
		if (copy === undefined) return walker.childrenOf(node as unknown as AnyRule).forEach((child) => visit(child as unknown as RuntimeRule));
		const seen = displays.get(copy);
		if (seen !== undefined) return void seen.add(displayOf(node));
		displays.set(copy, new Set([displayOf(node)]));
		visit(wireCopyDeposit(copy));
	};
	visit(rule);
	return displays;
}

function copyReferencedBy(node: RuntimeRule): string | undefined {
	const shown = node as unknown as { readonly type: string; readonly name?: string; readonly content?: { readonly type: string; readonly name?: string } };
	const name = shown.type === 'SYMBOL' ? shown.name : shown.type === 'ALIAS' && shown.content?.type === 'SYMBOL' ? shown.content.name : undefined;
	return name !== undefined && wireCopyOf(name) !== undefined ? name : undefined;
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

function refuseRedisplay(copy: string, source: string, display: string | undefined, shown: string): void {
	if (display === undefined || display === source) return;
	throw new VerbRefusal('edit-site-conflict', `the copy '${copy}' is shown as '${display}', and a path shows it as '${shown}'`, { copy, displays: [display, shown] });
}

export function copy(source: unknown, path = '.'): RuntimeRule {
	const name = nameOf(source);
	const made = wireCopy({ source: name, part: path, via: 'copy' }, (body) => body);
	if (made === undefined) return symbol(name);
	return path === '.' ? copyReference(made, name) : bareReference(made);
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
