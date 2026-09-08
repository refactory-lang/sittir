import {
	buildFactoryNodeFromReference,
	type FactoryDispatchArtifacts,
	type FactoryDispatchOpts
} from '../validate/common.ts';
import type { FactoryShape } from '../codegen-surface.ts';

export interface PrintContext {
	readonly grammar: string;
	readonly kindNameFromId: (id: number) => string | undefined;
	readonly memberNameOfId: (id: number) => string | undefined;
	readonly irPathOfKind: (kind: string) => string;
	readonly delimiterArmOfId: (id: number) => string | undefined;
	readonly triviaByHandle?: ReadonlyMap<number, NodeTrivia>;
}

export interface NodeTrivia {
	readonly leading: readonly string[];
	readonly trailing: readonly string[];
}

export class Printed {
	readonly $named = true as const;
	constructor(
		readonly $type: number | string,
		readonly source: string,
		readonly handle?: number
	) {}
}

export interface ReadNodeLike {
	readonly $type?: string | number;
	readonly $text?: string;
	readonly $nodeHandle?: number;
	readonly $triviaData?: { leading?: readonly unknown[]; trailing?: readonly unknown[] };
}

const INDENT = '\t';

function pad(depth: number): string {
	return INDENT.repeat(depth);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Printed);
}

function triviaSuffix(trivia: NodeTrivia | undefined, ctx: PrintContext): string {
	if (trivia === undefined || (trivia.leading.length === 0 && trivia.trailing.length === 0)) return '';
	const parts: string[] = [];
	if (trivia.leading.length > 0) parts.push(`leading: ${printValue(trivia.leading, ctx, 0)}`);
	if (trivia.trailing.length > 0) parts.push(`trailing: ${printValue(trivia.trailing, ctx, 0)}`);
	return `.$trivia({ ${parts.join(', ')} })`;
}

export function printValue(value: unknown, ctx: PrintContext, depth: number): string {
	if (value instanceof Printed) {
		const trivia = value.handle === undefined ? undefined : ctx.triviaByHandle?.get(value.handle);
		return value.source + triviaSuffix(trivia, ctx);
	}
	if (typeof value === 'string') return JSON.stringify(value);
	if (typeof value === 'boolean') return String(value);
	if (typeof value === 'number') {
		const member = ctx.memberNameOfId(value);
		return member !== undefined ? `TSKindId.${member}` : String(value);
	}
	if (Array.isArray(value)) return `[${value.map((v) => printValue(v, ctx, depth)).join(', ')}]`;
	if (isPlainObject(value)) {
		const entries = Object.entries(value).filter(([k, v]) => v !== undefined && !k.startsWith('$'));
		if (entries.length === 0) return '{}';
		const body = entries.map(([k, v]) => `${pad(depth + 1)}${k}: ${printValue(v, ctx, depth + 1)},`).join('\n');
		return `{\n${body}\n${pad(depth)}}`;
	}
	return String(value);
}

function printListOptions(options: Record<string, unknown>, ctx: PrintContext): string {
	const parts: string[] = [];
	if (typeof options.delimiter === 'number') {
		parts.push(`delimiter: ${ctx.delimiterArmOfId(options.delimiter) ?? options.delimiter}`);
	}
	if (typeof options.separator === 'number') parts.push(`separator: ${printValue(options.separator, ctx, 0)}`);
	return `{ ${parts.join(', ')} }`;
}

export function triviaOf(node: ReadNodeLike | undefined): NodeTrivia | undefined {
	const trivia = node?.$triviaData;
	if (!trivia) return undefined;
	const texts = (list: readonly unknown[] | undefined): string[] =>
		(list ?? []).map((t) => (t as ReadNodeLike).$text).filter((t): t is string => typeof t === 'string');
	const leading = texts(trivia.leading);
	const trailing = texts(trivia.trailing);
	return leading.length === 0 && trailing.length === 0 ? undefined : { leading, trailing };
}

function handleOf(value: unknown): number | undefined {
	if (!isPlainObject(value)) return undefined;
	const handle = value.$nodeHandle;
	return typeof handle === 'number' ? handle : undefined;
}

export function printingFactoryMap(
	realShapes: Record<string, FactoryShape>,
	kindIdOfName: (kind: string) => number | undefined,
	ctx: PrintContext
): Record<string, (...args: unknown[]) => Printed> {
	const map: Record<string, (...args: unknown[]) => Printed> = {};
	for (const kind of Object.keys(realShapes)) {
		const shape = realShapes[kind]!;
		const path = ctx.irPathOfKind(kind);
		const id = kindIdOfName(kind) ?? kind;
		map[kind] = (...args: unknown[]): Printed => {
			switch (shape) {
				case 'text':
					return new Printed(id, `${path}(${JSON.stringify(String(args[0] ?? ''))})`);
				case 'direct':
				case 'forwarded':
					return new Printed(id, `${path}.strict(${printValue(args[0], ctx, 0)})`, handleOf(args[0]));
				case 'spread':
					return new Printed(id, `${path}.strict(${args.map((a) => printValue(a, ctx, 0)).join(', ')})`);
				case 'elements': {
					const [first, ...rest] = args;
					const hasOptions =
						isPlainObject(first) && !('$type' in first) && ('delimiter' in first || 'separator' in first);
					const elements = (hasOptions ? rest : args).map((a) => printValue(a, ctx, 0));
					const head = hasOptions ? [printListOptions(first as Record<string, unknown>, ctx)] : [];
					return new Printed(id, `${path}.strict(${[...head, ...elements].join(', ')})`);
				}
				case 'config':
				default:
					return new Printed(id, `${path}.strict(${printValue(args[0] ?? {}, ctx, 0)})`, handleOf(args[0]));
			}
		};
	}
	return map;
}

export function printFactorySource(
	root: ReadNodeLike,
	rootKind: string,
	artifacts: FactoryDispatchArtifacts,
	opts: FactoryDispatchOpts,
	ctx: PrintContext
): string {
	const printed = buildFactoryNodeFromReference(root, rootKind, artifacts, opts);
	if (!(printed instanceof Printed)) {
		throw new Error(`emit-factory-source: no factory for root kind '${rootKind}'`);
	}
	return printed.source + triviaSuffix(triviaOf(root), ctx);
}
