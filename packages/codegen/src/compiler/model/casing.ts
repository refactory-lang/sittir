export function casingWords(s: string): string[] {
	return s
		.split(/[\s-]+|_/)
		.flatMap((segment) =>
			segment
				.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
				.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
				.split('_')
		);
}

const nonEmptyWords = (s: string): string[] => casingWords(s).filter((word) => word.length > 0);

const upperFirst = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

export function pascalCase(s: string): string {
	return nonEmptyWords(s).map(upperFirst).join('');
}

export function lowerCamelCase(s: string): string {
	const [first, ...rest] = nonEmptyWords(s);
	if (first === undefined) return '';
	const head = first === first.toUpperCase() ? first.toLowerCase() : first.charAt(0).toLowerCase() + first.slice(1);
	return head + rest.map(upperFirst).join('');
}

export function kindTypeName(s: string): string {
	return upperFirst(lowerCamelCase(s));
}

export function irKeyOfTypeName(typeName: string): string {
	const stripped = typeName.replace(/^_+/, '');
	return stripped.charAt(0).toLowerCase() + stripped.slice(1);
}

export function screamingSnakeCase(s: string): string {
	return casingWords(s)
		.map((word) => word.toUpperCase())
		.join('_');
}

export function toScreamingSnakeCase(memberName: string, rawKind: string): string {
	const prefix = rawKind.match(/^_+/)?.[0] ?? '';
	const cleaned = memberName.replace(/^_+/, '');
	return /[a-z]/.test(cleaned) ? `${prefix}${screamingSnakeCase(cleaned)}` : `${prefix}${cleaned}`;
}
