export const PAYLOAD_CEILING_BYTES = 256;

interface Niche {
	readonly offset: number;
	readonly width: number;
	readonly available: bigint;
}

interface Layout {
	readonly size: number;
	readonly align: number;
	readonly niche: Niche | undefined;
}

interface RustType {
	readonly name: string;
	readonly args: readonly RustType[];
}

type Declaration =
	| { readonly tag: 'struct'; readonly fields: readonly RustType[] }
	| { readonly tag: 'enum'; readonly variants: readonly (RustType | undefined)[] };

type Bias = 'start' | 'end';

const CAPACITY: Niche = { offset: 0, width: 8, available: 1n << 63n };
const BUFFER: Layout = { size: 24, align: 8, niche: CAPACITY };
const POINTER: Layout = { size: 8, align: 8, niche: { offset: 0, width: 8, available: 1n } };

const LEAVES: ReadonlyMap<string, Layout> = new Map([
	['bool', { size: 1, align: 1, niche: { offset: 0, width: 1, available: 254n } }],
	['Box', POINTER],
	['Vec', BUFFER],
	['NonEmptyVec', BUFFER],
	['String', BUFFER],
	['VerbatimNode', BUFFER],
	['KindId', { size: 2, align: 2, niche: undefined }],
	['Delimiter', { size: 1, align: 1, niche: undefined }],
	['Edges', { size: 8, align: 2, niche: { offset: 6, width: 1, available: 249n } }],
	['TriviaText', { size: 96, align: 8, niche: CAPACITY }],
	['NodeCoordinate', { size: 40, align: 8, niche: { offset: 36, width: 2, available: 65534n } }]
]);

const roundUp = (n: number, align: number): number => Math.ceil(n / align) * align;
const trailingZeros = (n: number): number => (n === 0 ? 64 : Math.log2(n & -n));
const available = (layout: Layout): bigint => layout.niche?.available ?? 0n;
const isOneZst = (layout: Layout): boolean => layout.size === 0 && layout.align === 1;

function layoutOf(size: number, align: number, niche: Niche | undefined): Layout {
	return { size, align, niche: niche !== undefined && niche.available > 0n ? niche : undefined };
}

function compareKeys(a: readonly (number | bigint | boolean)[], b: readonly (number | bigint | boolean)[]): number {
	for (let i = 0; i < a.length; i++) {
		const x = a[i]!;
		const y = b[i]!;
		if (x < y) return -1;
		if (x > y) return 1;
	}
	return 0;
}

function placeFields(fields: readonly Layout[], bias: Bias, prefix?: number): { layout: Layout; offsets: number[] } {
	if (fields.length === 0) return { layout: layoutOf(prefix ?? 0, prefix ?? 1, undefined), offsets: [] };
	const maxAlign = Math.max(...fields.map((field) => field.align));
	const largest = fields.reduce((most, field) => (available(field) > most ? available(field) : most), 0n);
	const group = (field: Layout): number => {
		const sizeAsAlign = trailingZeros(Math.max(field.align, field.size));
		if (largest === 0n) return sizeAsAlign;
		if (bias === 'start') return Math.min(trailingZeros(maxAlign), sizeAsAlign);
		return available(field) === largest ? trailingZeros(field.align) : sizeAsAlign;
	};
	const key = (field: Layout): (number | bigint | boolean)[] => {
		if (prefix !== undefined) return [group(field), available(field)];
		const niche = field.niche;
		const inner = niche === undefined ? 0 : bias === 'start' ? niche.offset : -(field.size - niche.width - niche.offset);
		return [!isOneZst(field), -group(field), bias === 'start' ? -available(field) : available(field), inner];
	};
	const order = fields.map((_, i) => i);
	if (fields.length > 1) order.sort((a, b) => compareKeys(key(fields[a]!), key(fields[b]!)) || a - b);
	const offsets = fields.map(() => 0);
	let offset = prefix ?? 0;
	let align = prefix ?? 1;
	let niche: Niche | undefined;
	for (const i of order) {
		const field = fields[i]!;
		offset = roundUp(offset, field.align);
		align = Math.max(align, field.align);
		offsets[i] = offset;
		const own = field.niche;
		if (own !== undefined && (bias === 'start' ? own.available > (niche?.available ?? 0n) : own.available >= (niche?.available ?? 0n))) {
			niche = { ...own, offset: own.offset + offset };
		}
		offset += field.size;
	}
	return { layout: layoutOf(roundUp(offset, align), align, niche), offsets };
}

function structLayout(fields: readonly Layout[]): Layout {
	const { layout } = placeFields(fields, 'start');
	const niche = layout.niche;
	if (niche === undefined || fields.length < 2) return layout;
	const head = niche.offset;
	const tail = layout.size - head - niche.width;
	if (head === 0 || tail <= 0) return layout;
	const { layout: alt } = placeFields(fields, 'end');
	const altHead = alt.niche!.offset;
	return altHead > head && altHead > tail ? alt : layout;
}

function enumLayout(variants: readonly (readonly Layout[])[]): Layout {
	if (variants.length === 1) return structLayout(variants[0]!);
	const filled = nicheFilled(variants);
	const tagged = taggedLayout(variants);
	if (filled === undefined) return tagged;
	if (tagged.size > filled.size || (tagged.size === filled.size && available(tagged) < available(filled))) return filled;
	return tagged;
}

function nicheFilled(variants: readonly (readonly Layout[])[]): Layout | undefined {
	const layouts = variants.map(structLayout);
	const align = Math.max(1, ...layouts.map((layout) => layout.align));
	const most = Math.max(...layouts.map((layout) => layout.size));
	const largest = layouts.findLastIndex((layout) => layout.size === most);
	const others = layouts.map((_, i) => i).filter((i) => i !== largest);
	const count = BigInt(others.at(-1)! - others[0]! + 1);
	const niche = layouts[largest]!.niche;
	if (niche === undefined || niche.available < count) return undefined;
	const size = roundUp(layouts[largest]!.size, align);
	const fits = others.every((i) => {
		const layout = layouts[i]!;
		return layout.size <= niche.offset || roundUp(niche.offset + niche.width, layout.align) + layout.size <= size;
	});
	return fits ? layoutOf(size, align, { ...niche, available: niche.available - count }) : undefined;
}

function taggedLayout(variants: readonly (readonly Layout[])[]): Layout {
	const minTag = variants.length <= 256 ? 1 : 2;
	let size = 0;
	let align = 1;
	let startAlign = 256;
	for (const fields of variants) {
		const { layout, offsets } = placeFields(fields, 'start', minTag);
		const first = fields
			.map((field, i) => ({ field, offset: offsets[i]! }))
			.sort((a, b) => a.offset - b.offset)
			.find(({ field }) => !isOneZst(field));
		if (first !== undefined) startAlign = Math.min(startAlign, first.field.align);
		size = Math.max(size, layout.size);
		align = Math.max(align, layout.align);
	}
	const tag = startAlign !== 256 && [1, 2, 4, 8, 16].includes(startAlign) && startAlign > minTag ? startAlign : minTag;
	return layoutOf(roundUp(size, align), align, { offset: 0, width: tag, available: (1n << BigInt(8 * tag)) - BigInt(variants.length) });
}

function parseType(text: string): RustType {
	const tokens = text.match(/[A-Za-z_][\w:]*|[<>,]/g) ?? [];
	let at = 0;
	const parse = (): RustType => {
		const name = tokens[at++]!.split('::').at(-1)!;
		const args: RustType[] = [];
		if (tokens[at] === '<') {
			at++;
			while (tokens[at] !== '>') {
				if (tokens[at] === ',') at++;
				else args.push(parse());
			}
			at++;
		}
		return { name, args };
	};
	return parse();
}

function declarationsOf(nodeRs: string): ReadonlyMap<string, Declaration> {
	const declarations = new Map<string, Declaration>();
	for (const [, tag, name, body] of nodeRs.matchAll(/^pub (struct|enum) (\w+) \{\n(.*?)^\}/gms)) {
		const lines = body!.split('\n');
		declarations.set(
			name!,
			tag === 'struct'
				? { tag: 'struct', fields: lines.flatMap((line) => /^ {4}pub \w+: (.+),$/.exec(line)?.slice(1, 2) ?? []).map(parseType) }
				: {
						tag: 'enum',
						variants: lines.flatMap((line) => {
							const variant = /^ {4}\w+(?:\((.+)\))?,$/.exec(line);
							return variant === null ? [] : [variant[1] === undefined ? undefined : parseType(variant[1])];
						})
					}
		);
	}
	return declarations;
}

const BY_REFERENCE = new Set(['Box', 'Vec', 'NonEmptyVec', 'String']);

function heldByValue(type: RustType, declarations: ReadonlyMap<string, Declaration>): string[] {
	if (BY_REFERENCE.has(type.name)) return [];
	if (declarations.has(type.name)) return [type.name];
	return type.args.flatMap((arg) => heldByValue(arg, declarations));
}

interface HeldEdge {
	readonly to: string;
	readonly payload: boolean;
}

function unboundedPayloads(declarations: ReadonlyMap<string, Declaration>, payloads: ReadonlySet<string>): ReadonlySet<string> {
	const edges = new Map<string, readonly HeldEdge[]>();
	for (const [name, declaration] of declarations) {
		const types = declaration.tag === 'struct' ? declaration.fields : declaration.variants.filter((variant) => variant !== undefined);
		edges.set(
			name,
			types.flatMap((type): HeldEdge[] =>
				declaration.tag === 'enum' && type.args.length === 0 && payloads.has(type.name)
					? [{ to: type.name, payload: true }]
					: heldByValue(type, declarations).map((to) => ({ to, payload: false }))
			)
		);
	}
	const component = new Map<string, number>();
	const index = new Map<string, number>();
	const low = new Map<string, number>();
	const stack: string[] = [];
	let next = 0;
	const visit = (name: string): void => {
		index.set(name, next);
		low.set(name, next++);
		stack.push(name);
		for (const { to } of edges.get(name) ?? []) {
			if (!index.has(to)) {
				visit(to);
				low.set(name, Math.min(low.get(name)!, low.get(to)!));
			} else if (!component.has(to)) low.set(name, Math.min(low.get(name)!, index.get(to)!));
		}
		if (low.get(name) === index.get(name)) {
			let member: string;
			do {
				member = stack.pop()!;
				component.set(member, index.get(name)!);
			} while (member !== name);
		}
	};
	for (const name of declarations.keys()) if (!index.has(name)) visit(name);
	const unbounded = new Set<string>();
	for (const [name, out] of edges) {
		for (const { to, payload } of out) if (payload && component.get(to) === component.get(name)) unbounded.add(to);
	}
	return unbounded;
}

export function boxedPayloadsOf(nodeRs: string, payloads: ReadonlySet<string>): string[] {
	const declarations = declarationsOf(nodeRs);
	const sized = new Map<string, Layout>();
	const unbounded = unboundedPayloads(declarations, payloads);
	const open: string[] = [];
	const boxed = (name: string): boolean => payloads.has(name) && (unbounded.has(name) || named(name).size > PAYLOAD_CEILING_BYTES);
	const typeLayout = (type: RustType): Layout => {
		switch (type.name) {
			case 'Option':
				return enumLayout([[], [typeLayout(type.args[0]!)]]);
			case 'SlotValue':
				return enumLayout([[LEAVES.get('NodeCoordinate')!], [typeLayout(type.args[0]!)]]);
			default:
				return LEAVES.get(type.name) ?? named(type.name);
		}
	};
	const named = (name: string): Layout => {
		const known = sized.get(name);
		if (known !== undefined) return known;
		if (open.includes(name)) throw new Error(`${[...open.slice(open.indexOf(name)), name].join(' -> ')} holds itself by value`);
		open.push(name);
		const declaration = declarations.get(name);
		if (declaration === undefined) throw new Error(`${name} is no type the payload byte rule knows: declare its layout in boxed-payloads.ts`);
		const layout =
			declaration.tag === 'struct'
				? structLayout(declaration.fields.map(typeLayout))
				: enumLayout(declaration.variants.map((variant) => (variant === undefined ? [] : [variant.args.length === 0 && boxed(variant.name) ? POINTER : typeLayout(variant)])));
		open.pop();
		sized.set(name, layout);
		return layout;
	};
	return [...payloads].filter(boxed).sort();
}
