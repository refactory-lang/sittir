export const snake = (s: string): string => s.replace(/(?<!^)(?=[A-Z])/g, '_').toLowerCase();
export const camel = (s: string): string =>
	s.replace(/^_+/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
export const tsname = (seg: string): string =>
	seg
		.split('_')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join('');
export const boundKindName = (vocab: string, hidden: boolean, shortened: ReadonlySet<string>): string => {
	const segments = vocab.split('.');
	const kept = segments.filter((_, at) => at === segments.length - 1 || !shortened.has(segments.slice(0, at + 1).join('.')));
	return `${hidden ? '_' : ''}${kept.reverse().join('_')}`;
};
