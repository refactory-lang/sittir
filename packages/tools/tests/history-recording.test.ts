import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { historyRecording } from '../src/history-recording.ts';

let repo: string;
let path: string;
const git = (...args: string[]): void => void execFileSync('git', args, { cwd: repo, stdio: 'ignore' });

beforeEach(() => {
	repo = mkdtempSync(join(tmpdir(), 'history-recording-'));
	path = join(repo, 'history.jsonl');
	git('init', '-q', '-b', 'master');
	writeFileSync(path, '');
	git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'root');
	vi.stubEnv('SITTIR_HISTORY_NO_COMMIT', '');
	vi.stubEnv('SITTIR_INTERNAL_CODEGEN_RUN', '');
	vi.stubEnv('SITTIR_HISTORY_COMMIT', '');
});

afterEach(() => {
	vi.unstubAllEnvs();
	rmSync(repo, { recursive: true, force: true });
});

describe('historyRecording', () => {
	it('commits a run on master and on feat/bindings', () => {
		expect(historyRecording(path)).toBe('commit');
		git('checkout', '-q', '-b', 'feat/bindings');
		expect(historyRecording(path)).toBe('commit');
	});

	it('records nothing on any other branch, so a pull request\'s tree stays clean for merges', () => {
		git('checkout', '-q', '-b', 'fix/topic');
		expect(historyRecording(path)).toBe('none');
	});

	it('records nothing on a detached head', () => {
		git('checkout', '-q', '--detach');
		expect(historyRecording(path)).toBe('none');
	});

	it('commits on any branch when SITTIR_HISTORY_COMMIT=1 asks for it', () => {
		git('checkout', '-q', '-b', 'fix/topic');
		vi.stubEnv('SITTIR_HISTORY_COMMIT', '1');
		expect(historyRecording(path)).toBe('commit');
	});

	it('appends without committing on a recording branch when SITTIR_HISTORY_NO_COMMIT=1 or a codegen-internal run asks', () => {
		vi.stubEnv('SITTIR_HISTORY_NO_COMMIT', '1');
		expect(historyRecording(path)).toBe('append');
		vi.stubEnv('SITTIR_HISTORY_NO_COMMIT', '');
		vi.stubEnv('SITTIR_INTERNAL_CODEGEN_RUN', '1');
		expect(historyRecording(path)).toBe('append');
	});

	it('records nothing outside a git checkout', () => {
		const outside = mkdtempSync(join(tmpdir(), 'history-outside-'));
		try {
			expect(historyRecording(join(outside, 'history.jsonl'))).toBe('none');
		} finally {
			rmSync(outside, { recursive: true, force: true });
		}
	});
});
