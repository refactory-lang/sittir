export function surfaceLabel(surface: string, kind: string): string {
	return `${surface}${SEPARATOR}${kind}`;
}

export function kindOfLabel(label: string): string {
	const at = label.indexOf(SEPARATOR);
	return at === -1 ? label : label.slice(at + SEPARATOR.length);
}

const SEPARATOR = ': ';
