export function portablePathHasFacts(path: string, read: string | undefined): boolean {
	if (read === undefined) return false;
	const facts = path.split('.');
	const segments = read.split('.');
	if (facts[0] !== segments[0]) return false;
	let at = 1;
	for (let i = 1; i < segments.length && at < facts.length; i++) if (segments[i] === facts[at]) at++;
	return at === facts.length;
}
