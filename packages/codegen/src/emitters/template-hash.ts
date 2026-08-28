import { createHash } from 'node:crypto';

export interface TemplateFile {
	filename: string;
	content: string;
}

export function computeTemplateBundleHash(files: readonly TemplateFile[]): string {
	const sorted = [...files].sort((a, b) => (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0));
	const hash = createHash('sha256');
	for (const { filename, content } of sorted) {
		const normalized = content.replace(/\r\n/g, '\n');
		hash.update(filename);
		hash.update('\0');
		hash.update(normalized);
		hash.update('\0');
	}
	return hash.digest('hex');
}
