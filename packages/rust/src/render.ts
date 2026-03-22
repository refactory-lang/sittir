import type {
	RustIrNode,
	StructItem,
	FunctionItem,
	UseDeclaration,
	ImplItem,
	IfExpression,
	MacroInvocation,
	SourceFile,
} from './types.js';

/** Indent every line of `text` by 4 spaces. */
function indent(text: string): string {
	return text
		.split('\n')
		.map((line) => '    ' + line)
		.join('\n');
}

/**
 * Render any IR node to a Rust source string.
 *
 * Pure function — no side effects. Dispatches by `node.kind` to a
 * per-kind renderer. All 7 supported node kinds are handled exhaustively.
 */
export function renderSilent(node: RustIrNode): string {
	switch (node.kind) {
		case 'struct_item':
			return renderStruct(node);
		case 'function_item':
			return renderFunction(node);
		case 'use_declaration':
			return renderUse(node);
		case 'impl_item':
			return renderImpl(node);
		case 'if_expression':
			return renderIf(node);
		case 'macro_invocation':
			return renderMacro(node);
		case 'source_file':
			return renderSourceFile(node);
		default:
			throw new Error(
				`render: unimplemented node kind: ${(node as { kind: string }).kind}`,
			);
	}
}

/**
 * Render a value that may be an IR node or a pre-rendered string.
 * Used in composition patterns where children may already be rendered
 * (e.g., sourceFile children are pre-rendered item strings).
 *
 * @throws {Error} if `item` is not a string or an object with a `kind` property.
 */
function renderChild(item: unknown): string {
	if (typeof item === 'string') return item;
	if (typeof item === 'object' && item !== null && 'kind' in item) {
		return renderSilent(item as RustIrNode);
	}
	throw new Error(
		`render: expected a string or RustIrNode, got ${typeof item}: ${String(item).slice(0, 80)}`,
	);
}

// ---------------------------------------------------------------------------
// source_file
// ---------------------------------------------------------------------------

function renderSourceFile(node: SourceFile): string {
	// Defensive — builder validates non-empty children; guards against manual construction
	if (!node.children || (Array.isArray(node.children) && node.children.length === 0)) {
		throw new Error(
			`render: source_file node has no children (got ${JSON.stringify(node.children)})`,
		);
	}
	const items = node.children as unknown[];
	return items.map(renderChild).join('\n\n');
}

// ---------------------------------------------------------------------------
// macro_invocation
// ---------------------------------------------------------------------------

function renderMacro(node: MacroInvocation): string {
	const content = String(node.children);
	// Detect delimiter style from content: [..] → ![], {..} → !{}, otherwise !()
	if (content.startsWith('[') || content.startsWith('{')) return `${node.macro}!${content}`;
	return `${node.macro}!(${content})`;
}

// ---------------------------------------------------------------------------
// if_expression
// ---------------------------------------------------------------------------

function renderIf(node: IfExpression): string {
	let output = `if ${node.condition} {\n${indent(String(node.consequence))}\n}`;
	if (node.alternative !== undefined) {
		const alt = renderChild(node.alternative);
		// If alternative is a pre-rendered if-expression, emit "else if ..." (no braces);
		// otherwise wrap in "else { ... }" block.
		if (alt.startsWith('if ')) {
			output += ` else ${alt}`;
		} else {
			output += ` else {\n${indent(alt)}\n}`;
		}
	}
	return output;
}

// ---------------------------------------------------------------------------
// impl_item
// TODO: typeParameters rendering (deferred — no active transform needs generics yet)
// ---------------------------------------------------------------------------

function renderImpl(node: ImplItem): string {
	const header = node.trait ? `impl ${node.trait} for ${node.type} {` : `impl ${node.type} {`;

	if (!node.body) return `${header}\n}`;

	const bodyVal = node.body as unknown;
	let bodyStr: string;

	// Array of methods — render and indent each item
	if (Array.isArray(bodyVal)) {
		bodyStr = (bodyVal as unknown[]).map((item) => indent(renderChild(item))).join('\n');
	} else if (typeof bodyVal === 'object' && bodyVal !== null && 'kind' in bodyVal) {
		// Single IR node (e.g., one method) — render and indent
		bodyStr = indent(renderSilent(bodyVal as RustIrNode));
	} else if (typeof bodyVal === 'string') {
		// Pre-rendered string body — auto-indent for consistency with node/array paths
		bodyStr = indent(bodyVal);
	} else {
		throw new Error(
			`renderImpl: unexpected body type: ${typeof bodyVal} (${String(bodyVal).slice(0, 80)})`,
		);
	}

	return bodyStr.length > 0 ? `${header}\n${bodyStr}\n}` : `${header}\n}`;
}

// ---------------------------------------------------------------------------
// use_declaration
// ---------------------------------------------------------------------------

function renderUse(node: UseDeclaration): string {
	return `use ${node.argument};`;
}

// ---------------------------------------------------------------------------
// function_item
// TODO: typeParameters rendering (deferred — no active transform needs generics yet)
// ---------------------------------------------------------------------------

function renderFunction(node: FunctionItem): string {
	// Grammar `children` slot carries the visibility modifier (e.g., "pub")
	const vis =
		node.children !== undefined
			? `${Array.isArray(node.children) ? (node.children as unknown[]).join(' ') : node.children} `
			: '';
	const paramList = node.parameters ?? '';
	const ret = node.returnType !== undefined ? ` -> ${node.returnType}` : '';
	return `${vis}fn ${node.name}(${paramList})${ret} {\n${indent(String(node.body))}\n}`;
}

// ---------------------------------------------------------------------------
// struct_item
// TODO: typeParameters rendering (deferred — no active transform needs generics yet)
// ---------------------------------------------------------------------------

function renderStruct(node: StructItem): string {
	// Grammar `children` slot carries the visibility modifier (e.g., "pub")
	const vis =
		node.children !== undefined
			? `${Array.isArray(node.children) ? (node.children as unknown[]).join(' ') : node.children} `
			: '';
	if (node.body) {
		return `${vis}struct ${node.name} {\n${indent(String(node.body))}\n}`;
	}
	return `${vis}struct ${node.name};`;
}
