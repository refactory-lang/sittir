import { execFileSync } from 'node:child_process';

export interface TypeCheckDiagnostic {
	readonly head: string;
	readonly file: string | undefined;
	readonly line: number | undefined;
	readonly column: number | undefined;
	readonly code: string;
	readonly message: string;
	readonly detail: readonly string[];
}

const HEAD = /^(?:(.+)\((\d+),(\d+)\): )?error (TS\d+): (.*)$/;

export function parseTypeCheckDiagnostics(output: string): TypeCheckDiagnostic[] {
	const out: { head: string; file: string | undefined; line: number | undefined; column: number | undefined; code: string; message: string; detail: string[] }[] = [];
	for (const text of output.split('\n')) {
		const head = HEAD.exec(text);
		if (head !== null) {
			const [, file, line, column, code, message] = head;
			out.push({ head: text, file, line: line === undefined ? undefined : Number(line), column: column === undefined ? undefined : Number(column), code: code!, message: message!, detail: [] });
			continue;
		}
		const last = out.at(-1);
		if (last !== undefined && /^\s/.test(text) && text.trim() !== '') last.detail.push(text.trim());
	}
	return out;
}

export function typeCheckOutput(command: string, args: readonly string[], cwd: string): string {
	try {
		return execFileSync(command, [...args, '--pretty', 'false'], { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
	} catch (e) {
		const failure = e as { stdout?: string };
		const out = String(failure.stdout ?? '');
		if (!out.includes('error TS')) throw e;
		return out;
	}
}
