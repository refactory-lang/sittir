export function portablePathHasFacts(path: string, read: string | undefined): boolean {
	if (read === undefined) return false;
	const facts = path.split('.');
	const segments = read.split('.');
	const kind = Math.min(2, facts.length);
	for (let i = 0; i < kind; i++) if (facts[i] !== segments[i]) return false;
	let at = kind;
	for (let i = kind; i < segments.length && at < facts.length; i++) if (segments[i] === facts[at]) at++;
	return at === facts.length;
}
