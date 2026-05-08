import { writeFileSync } from 'node:fs';
import type { AnyNodeData, Edit, FormatRecord } from '@sittir/types';
import type { TreeHandle } from './readNode.ts';

export interface EngineOptions {
	readonly format?: FormatRecord;
}

export interface RenderHandle {
	save(path: string): void;
	toString(): string;
	print(): string;
}

export function createRenderHandle(
	renderText: () => string,
	saveImpl?: (path: string) => boolean
): RenderHandle {
	let cached: string | undefined;
	function getText(): string {
		if (cached === undefined) cached = renderText();
		return cached;
	}
	return {
		save(path: string): void {
			if (saveImpl?.(path) === true) return;
			writeFileSync(path, getText(), 'utf8');
		},
		toString(): string {
			return getText();
		},
		print(): string {
			const text = getText();
			process.stdout.write(text);
			return text;
		}
	};
}

export interface NativeEngineLike<TTransport = unknown> {
	parseAndRead(source: string): string;
	readNode(handle: number, childIndex: number): string;
	render(node: TTransport): string;
	renderToFile?(node: TTransport, path: string): void;
	applyEdits(
		source: string,
		edits: { startPos: number; endPos: number; insertedText: string }[]
	): string;
	dispose(): void;
}

export interface NativeModuleLike<
	TTransport = unknown,
	TEngine extends NativeEngineLike<TTransport> = NativeEngineLike<TTransport>
> {
	SittirEngine: new (options?: { format?: string }) => TEngine;
}

export type NativeBackendStatusLike<TModule extends NativeModuleLike = NativeModuleLike> = {
	readonly name: 'native';
	readonly native: TModule;
	readonly hashMatch?: true;
};

export type JsBackendStatusLike = {
	readonly name: 'js';
	readonly reason?: string;
	readonly hashMatch?: false;
};

export type BackendStatusLike<TModule extends NativeModuleLike = NativeModuleLike> =
	| NativeBackendStatusLike<TModule>
	| JsBackendStatusLike;

export type NativeRenderTransportProjector<TTransport = unknown> = (
	node: AnyNodeData
) => TTransport;

export interface GrammarEngineConfig<
	TTransport = unknown,
	TModule extends NativeModuleLike<TTransport> = NativeModuleLike<TTransport>
> {
	templatesPath: string;
	kindNames: ReadonlyMap<number, string>;
	toNativeRenderTransport: NativeRenderTransportProjector<TTransport>;
	getActiveBackend: () => BackendStatusLike<TModule>;
}

export interface SittirEngineReader {
	parseAndRead(source: string): ParseAndReadResult;
	readNode(handle: number, childIndex?: number): AnyNodeData;
}

export interface SittirEngineLike {
	render(node: AnyNodeData, options?: { ignoreFormat?: boolean }): RenderHandle;
	applyEdits(source: string, edits: readonly Edit[]): string;
	dispose(): void;
	readonly reader?: SittirEngineReader;
}

export interface ParseAndReadResult {
	root: AnyNodeData;
	tree: TreeHandle;
}
