export const snake = (s: string): string => s.replace(/(?<!^)(?=[A-Z])/g, '_').toLowerCase();
export const camel = (s: string): string =>
	s.replace(/^_+/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
export const tsname = (seg: string): string =>
	seg
		.split('_')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join('');
