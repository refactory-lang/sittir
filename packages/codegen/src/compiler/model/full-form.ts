import type { RenderRule } from '../../types/rule.ts';
import { CHOICE, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { isSoleEnumContent } from '../token-interior.ts';
import {
	AbstractAssembledCompound,
	AssembledPattern,
	AssembledPolymorph,
	charEdgeClass,
	edgeClassesOfKind,
	isFixedTextLeaf,
	patternLeadingEdgeClass,
	patternTrailingEdgeClass,
	seamNeedsSpace,
	uniformEdgeClass,
	wordCharPredicate,
	type AssembledNode,
	type EdgeClassCtx,
	type FullForm,
	type FullFormAffix,
	type KindEdgeClasses,
	type SeamEdgeClass
} from './node-map.ts';

function affixOf(member: RenderRule, forms: FullForms): FullFormAffix | undefined {
	if (member.multiplicity !== undefined) return undefined;
	if (member.type === STRING) return { texts: [member.value] };
	if (member.type === SYMBOL) {
		const text = forms.fixedText(member.name);
		return text === undefined ? undefined : { texts: [text] };
	}
	if (member.type !== CHOICE || member.fieldName === undefined) return undefined;
	const texts = member.members.map((arm) => (arm.type === STRING ? arm.value : undefined));
	return texts.every((text) => text !== undefined) ? { texts, slot: member.fieldName } : undefined;
}

function isEnumContent(member: RenderRule): boolean {
	return member.type === CHOICE && member.fieldName !== undefined && member.members.every((arm) => arm.type === STRING);
}

function enumContentAsText(affixes: readonly (FullFormAffix | undefined)[]): readonly (FullFormAffix | undefined)[] {
	const roles = affixes.map((affix) => (affix === undefined ? 'content' : affix.slot === undefined ? 'literal' : 'enum'));
	return isSoleEnumContent(roles) ? affixes.map((affix, i) => (roles[i] === 'enum' ? undefined : affix)) : affixes;
}

function joinRun(run: readonly FullFormAffix[]): FullFormAffix | undefined {
	if (run.length === 0) return { texts: [''] };
	if (run.length === 1) return run[0];
	if (run.some((affix) => affix.slot !== undefined)) return undefined;
	return { texts: [run.map((affix) => affix.texts[0]).join('')] };
}

function isTextContent(member: RenderRule, node: AbstractAssembledCompound, forms: FullForms): boolean {
	if (member.type === PATTERN) return true;
	if (member.type === SYMBOL) return forms.isPattern(member.name);
	if (isEnumContent(member)) return true;
	if (member.type !== CHOICE || !(node instanceof AssembledPolymorph)) return false;
	const arms = new Set(node.arms.flatMap((arm) => (arm.type === SYMBOL ? [arm.name] : [])));
	return member.members.every((arm) => arm.type === SYMBOL && arms.has(arm.name) && forms.isText(arm.name));
}

function contentEdges(member: RenderRule, ctx: EdgeClassCtx): KindEdgeClasses {
	if (member.type === PATTERN) {
		return { starts: patternLeadingEdgeClass(member.value, ctx), ends: patternTrailingEdgeClass(member.value, ctx) };
	}
	if (member.type === SYMBOL) return edgeClassesOfKind(member.name, ctx);
	const arms =
		member.type === CHOICE
			? member.members.flatMap((arm) =>
					arm.type === SYMBOL
						? [edgeClassesOfKind(arm.name, ctx)]
						: arm.type === STRING && arm.value !== ''
							? [{ starts: charEdgeClass(arm.value[0], ctx), ends: charEdgeClass(arm.value[arm.value.length - 1], ctx) }]
							: []
				)
			: [];
	return {
		starts: uniformEdgeClass(arms.map((arm) => arm.starts)),
		ends: uniformEdgeClass(arms.map((arm) => arm.ends))
	};
}

function affixEdge(affix: FullFormAffix, side: 'starts' | 'ends', ctx: EdgeClassCtx): SeamEdgeClass | undefined {
	const texts = affix.texts.filter((text) => text !== '');
	if (texts.length === 0) return undefined;
	return uniformEdgeClass(texts.map((text) => charEdgeClass(side === 'starts' ? text[0] : text[text.length - 1], ctx)));
}

const CONCRETE_EDGES: readonly SeamEdgeClass[] = ['word', 'not-word'];

function maySpace(seam: { readonly left: SeamEdgeClass; readonly right: SeamEdgeClass }): boolean {
	const concrete = (edge: SeamEdgeClass) => (edge === 'varies' ? CONCRETE_EDGES : [edge]);
	return concrete(seam.left).some((left) => concrete(seam.right).some((right) => seamNeedsSpace({ left, right })));
}

function isSeparated(node: AbstractAssembledCompound, form: FullForm, content: RenderRule, ctx: EdgeClassCtx): boolean {
	if (node.lexedInterior) return false;
	const edges = contentEdges(content, ctx);
	const openEnd = affixEdge(form.open, 'ends', ctx);
	const closeStart = affixEdge(form.close, 'starts', ctx);
	return (
		(openEnd !== undefined && maySpace({ left: openEnd, right: edges.starts })) ||
		(closeStart !== undefined && maySpace({ left: edges.ends, right: closeStart }))
	);
}

function fullFormOf(node: AbstractAssembledCompound, forms: FullForms): FullForm | undefined {
	if (node.renderRule.type !== SEQ) return undefined;
	const members = node.renderRule.members;
	const affixes = enumContentAsText(members.map((member) => affixOf(member, forms)));
	let start = 0;
	while (start < members.length && affixes[start] !== undefined) start++;
	let end = members.length;
	while (end > start && affixes[end - 1] !== undefined) end--;
	if (end - start !== 1 || (start === 0 && end === members.length)) return undefined;
	if (!isTextContent(members[start]!, node, forms)) return undefined;
	const run = (from: number, to: number) => affixes.slice(from, to).filter((affix) => affix !== undefined);
	const open = joinRun(run(0, start));
	const close = joinRun(run(end, members.length));
	if (open === undefined || close === undefined) return undefined;
	const form = { open, close };
	return isSeparated(node, form, members[start]!, forms.edges) ? undefined : form;
}

class FullForms {
	private readonly forms = new Map<string, FullForm | undefined>();
	readonly edges: EdgeClassCtx;
	constructor(
		private readonly nodes: ReadonlyMap<string, AssembledNode>,
		wordMatcher: RegExp | undefined
	) {
		this.edges = { nodes, isWordChar: wordCharPredicate(wordMatcher) };
	}

	fixedText(kind: string): string | undefined {
		const node = this.nodes.get(kind);
		return node !== undefined && isFixedTextLeaf(node) ? node.text : undefined;
	}

	isPattern(kind: string): boolean {
		return this.nodes.get(kind) instanceof AssembledPattern;
	}

	isText(kind: string): boolean {
		const node = this.nodes.get(kind);
		return (
			node instanceof AssembledPattern || (node instanceof AbstractAssembledCompound && this.of(node) !== undefined)
		);
	}

	of(node: AbstractAssembledCompound): FullForm | undefined {
		if (!this.forms.has(node.kind)) {
			this.forms.set(node.kind, undefined);
			this.forms.set(node.kind, fullFormOf(node, this));
		}
		return this.forms.get(node.kind);
	}
}

export function stampFullForms(nodes: ReadonlyMap<string, AssembledNode>, wordMatcher: RegExp | undefined): void {
	const forms = new FullForms(nodes, wordMatcher);
	for (const node of nodes.values()) {
		if (node instanceof AbstractAssembledCompound) node.fullForm = forms.of(node);
	}
}
