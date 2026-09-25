export function polymorphVisibleName(parentKind: string, suffix: string): string {
	const visibleParent = parentKind.startsWith('_') ? parentKind.slice(1) : parentKind;
	return `${visibleParent}_${suffix}`;
}

export function undisplayedKindAddress(symbol: string): string {
	return symbol.replace(/^_+/, '');
}

export function prefixNamedSuffix(parentKind: string, targetName: string): string | null {
	const bareTarget = targetName.startsWith('_') ? targetName.slice(1) : targetName;
	const prefix = `${polymorphVisibleName(parentKind, '')}`;
	if (!bareTarget.startsWith(prefix)) return null;
	const suffix = bareTarget.slice(prefix.length);
	return suffix.length > 0 ? suffix : null;
}

const GROUP_TOKEN_SYNONYMS: Readonly<Record<string, string>> = {
	item: 'statement',
	stmt: 'statement',
	expr: 'expression',
	decl: 'declaration',
	impl: 'implementation'
};

const CATEGORY_TOKENS: ReadonlySet<string> = new Set([
	'expression',
	'statement',
	'literal',
	'declaration',
	'definition',
	'operator',
	'pattern',
	'type'
]);

function normalizeGroupToken(token: string): string {
	return GROUP_TOKEN_SYNONYMS[token] ?? token;
}

function tokensOf(name: string): string[] {
	return name.split('_').filter((t) => t.length > 0);
}

export function supertypeMemberName(memberKind: string, supertypeKind: string): string {
	const parts = tokensOf(memberKind);
	const bareMember = parts.join('_');
	const groupTokens = new Set(tokensOf(supertypeKind).map(normalizeGroupToken));
	let kept = parts.filter((t) => !groupTokens.has(normalizeGroupToken(t)));
	if (kept.length === parts.length && parts.length >= 2) {
		const tail = normalizeGroupToken(parts[parts.length - 1]!);
		if (CATEGORY_TOKENS.has(tail)) kept = parts.slice(0, -1);
	}
	if (kept.length === 0 || kept.join('_') === tokensOf(supertypeKind).join('_')) return bareMember;
	return kept.join('_');
}

export function armNameOf(owner: string, display: string, ownerIsSupertype: boolean): string {
	return ownerIsSupertype ? supertypeMemberName(display, owner) : (prefixNamedSuffix(owner, display) ?? display);
}
