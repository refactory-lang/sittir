import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = vi.hoisted(() => ({ dir: '' }));
vi.mock('../layout.ts', () => ({
	get CORPUS_ROOT() {
		return root.dir;
	},
	upstreamCorpusDir: (grammar: string) => `${root.dir}/${grammar}/upstream`,
	localCorpusPath: (grammar: string) => `${root.dir}/${grammar}/local.txt`,
	corpusSourcePath: (grammar: string) => `${root.dir}/${grammar}/upstream/SOURCE.json`
}));

const { fetchUpstreamCorpus } = await import('../fetch.ts');

const SHA = 'fedcba9876543210fedcba9876543210fedcba98';

function tarHeader(name: string, size: number, type: string): Buffer {
	const h = Buffer.alloc(512);
	h.write(name, 0, 'utf8');
	h.write('0000644\0', 100, 'ascii');
	h.write('0000000\0', 108, 'ascii');
	h.write('0000000\0', 116, 'ascii');
	h.write(size.toString(8).padStart(11, '0') + '\0', 124, 'ascii');
	h.write('00000000000\0', 136, 'ascii');
	h.write('        ', 148, 'ascii');
	h.write(type, 156, 'ascii');
	h.write('ustar\0', 257, 'ascii');
	h.write('00', 263, 'ascii');
	let sum = 0;
	for (const b of h) sum += b;
	h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 'ascii');
	return h;
}

function entry(name: string, contents: string, type = '0'): Buffer {
	const body = Buffer.from(contents, 'utf8');
	const padded = Buffer.alloc(Math.ceil(body.length / 512) * 512);
	body.copy(padded);
	return Buffer.concat([tarHeader(name, body.length, type), padded]);
}

function archive(files: Record<string, string>): Buffer {
	const record = `comment=${SHA}\n`;
	let length = record.length + 3;
	if (`${length} ${record}`.length !== length) length++;
	const parts = [entry('pax_global_header', `${length} ${record}`, 'g')];
	for (const [path, contents] of Object.entries(files)) parts.push(entry(`repo-${SHA}/test/corpus/${path}`, contents));
	return gzipSync(Buffer.concat([...parts, Buffer.alloc(1024)]));
}

const response = (status: number, body?: Buffer): Response =>
	({
		ok: status >= 200 && status < 300,
		status,
		statusText: String(status),
		arrayBuffer: async () => body!.buffer.slice(body!.byteOffset, body!.byteOffset + body!.byteLength)
	}) as Response;

const upstream = () => join(root.dir, 'rust', 'upstream');
const listing = () => readdirSync(upstream()).sort();
const source = () => JSON.parse(readFileSync(join(upstream(), 'SOURCE.json'), 'utf8'));

function seedCorpus(version: string): void {
	mkdirSync(upstream(), { recursive: true });
	writeFileSync(join(upstream(), 'old.txt'), 'old corpus');
	writeFileSync(join(upstream(), 'SOURCE.json'), JSON.stringify({ version, files: ['old.txt'] }));
}

describe('fetchUpstreamCorpus', () => {
	let fetchMock: ReturnType<typeof vi.fn>;
	beforeEach(() => {
		root.dir = mkdtempSync(join(tmpdir(), 'sittir-corpus-test-'));
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		rmSync(root.dir, { recursive: true, force: true });
	});

	it('refuses a version mismatch before any download or removal', async () => {
		seedCorpus('0.0.1');
		await expect(fetchUpstreamCorpus({ grammar: 'rust' })).rejects.toThrow(/pinned to .*@0\.0\.1.*--update/);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(listing()).toEqual(['SOURCE.json', 'old.txt']);
	});

	it('refetches with update: true, replacing the files and SOURCE.json together', async () => {
		seedCorpus('0.0.1');
		fetchMock.mockResolvedValue(response(200, archive({ 'a.txt': 'A', 'nested/b.txt': 'B', 'notes.md': 'skip' })));
		const result = await fetchUpstreamCorpus({ grammar: 'rust', update: true });
		expect(listing()).toEqual(['SOURCE.json', 'a.txt', 'nested-b.txt']);
		expect(readFileSync(join(upstream(), 'nested-b.txt'), 'utf8')).toBe('B');
		expect(source()).toEqual(result);
		expect(result).toMatchObject({ commit: SHA, files: ['a.txt', 'nested-b.txt'] });
		expect(existsSync(`${upstream()}.incoming`)).toBe(false);
	});

	it('falls through to the next ref only on a 404', async () => {
		fetchMock.mockResolvedValueOnce(response(404)).mockResolvedValueOnce(response(200, archive({ 'a.txt': 'A' })));
		const result = await fetchUpstreamCorpus({ grammar: 'rust' });
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(result.ref).toBe(result.version);
	});

	it('leaves the old corpus intact when the download fails', async () => {
		seedCorpus('0.0.1');
		fetchMock.mockResolvedValue(response(500));
		await expect(fetchUpstreamCorpus({ grammar: 'rust', update: true })).rejects.toThrow(/answered 500/);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(listing()).toEqual(['SOURCE.json', 'old.txt']);
		expect(readFileSync(join(upstream(), 'old.txt'), 'utf8')).toBe('old corpus');
	});
});
