import type * as V from './index.ts';
/**
 * The namespace map: one key per top-level namespace, holding that namespace's kinds over the context `G`, and the
 * slot table, each slot holding its permissive fill over `G`: roles and refs where its arms are kinds, `string` where
 * they are text. A grammar's context extends the map over itself and narrows each key to what the grammar realizes.
 */
export interface GrammarContext<G extends GrammarContext<G>> {
	readonly argument: V.Argument.Any<G>;
	readonly attribute: V.Attribute.Any<G>;
	readonly clause: V.Clause.Any<G>;
	readonly comment: V.Comment.Any<G>;
	readonly declaration: V.Declaration.Any<G>;
	readonly element: V.Element.Any<G>;
	readonly expression: V.Expression.Any<G>;
	readonly identifier: V.Identifier.Any<G>;
	readonly literal: V.Literal.Any<G>;
	readonly modifier: V.Modifier.Any<G>;
	readonly module: V.Module.Any<G>;
	readonly pattern: V.Pattern.Any<G>;
	readonly statement: V.Statement.Any<G>;
	readonly type: V.Type.Any<G>;
	readonly slots: {
		readonly argument: {
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'argument.keyword': {
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly attribute: {
			readonly content:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Attribute.Content.Any<G>;
		};
		readonly 'attribute.content': {
			readonly input:
				| V.Element.Macro.TokenTree.Delimited<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
				| V.Type.Primitive<G>;
		};
		readonly 'attribute.content.call': {
			readonly arguments:
				| V.Declaration.Module<G>
				| V.Element.Splat<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly function: V.Attribute.Content.Member<G> | G['identifier'];
			readonly typeArguments: G['identifier'] | G['type'];
		};
		readonly 'attribute.content.member': {
			readonly object: V.Attribute.Content.Member<G> | G['identifier'];
		};
		readonly 'attribute.content.parenthesized': {
			readonly expression: G['identifier'] | V.Attribute.Content.Any<G>;
		};
		readonly 'attribute.decorator': {
			readonly content:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Attribute.Content.Any<G>;
		};
		readonly 'clause.bounds': {
			readonly bounds:
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| V.Clause.Bounds.Any<G>
				| G['type'];
		};
		readonly 'clause.bounds.higher_ranked': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'clause.bounds.removed': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'clause.case': {
			readonly bodies: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly consequence: V.Declaration.TypeAlias<G> | G['statement'];
			readonly value:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'clause.case.default': {
			readonly bodies: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		};
		readonly 'clause.catch': {
			readonly catchClauseGroup: unknown;
		};
		readonly 'clause.comprehension.for': {
			readonly left: G['expression'] | G['identifier'] | G['pattern'];
			readonly rights:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'clause.comprehension.if': {
			readonly condition:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'clause.constraint': {
			readonly content: string;
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'clause.default': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'clause.elif': {
			readonly condition:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly consequence: V.Declaration.TypeAlias<G> | G['statement'];
		};
		readonly 'clause.else': {
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		};
		readonly 'clause.except': {
			readonly alias:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly exception:
				| unknown
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly suite: V.Declaration.TypeAlias<G> | G['statement'];
		};
		readonly 'clause.export.namespace': {
			readonly moduleExportName: G['identifier'] | V.Literal.String<G>;
		};
		readonly 'clause.export.specifier': {
			readonly alias: G['identifier'] | V.Literal.String<G>;
			readonly exportKind: string;
			readonly name: G['identifier'] | V.Literal.String<G>;
		};
		readonly 'clause.extends': {
			readonly extendsClauseSingles: unknown;
		};
		readonly 'clause.extends.type': {
			readonly types: V.Identifier.Type<G> | G['type'];
		};
		readonly 'clause.finally': {
			readonly block: V.Declaration.TypeAlias<G> | G['statement'];
		};
		readonly 'clause.implements': {
			readonly types: G['identifier'] | G['type'];
		};
		readonly 'clause.import.attribute': {
			readonly attributeKind: string;
		};
		readonly 'clause.import.list': {
			readonly useClauses: G['identifier'] | V.Clause.Import.Any<G>;
		};
		readonly 'clause.import.names': {
			readonly content: V.Clause.Import.Any<G>;
		};
		readonly 'clause.import.specifier': {
			readonly alias: G['identifier'] | string;
			readonly importKind: string;
			readonly name:
				| G['identifier']
				| V.Literal.String<G>
				| string;
		};
		readonly 'clause.import.wildcard': {
			readonly useWildcardGroup: unknown;
		};
		readonly 'clause.let': {
			readonly pattern: unknown;
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'clause.let.chain': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Clause.Let.Any<G>
				| G['statement'];
			readonly rights:
				| V.Clause.Let<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'clause.mapped_type': {
			readonly alias: G['identifier'] | G['type'];
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'clause.match.arm': {
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
				| V.Type.Primitive<G>;
		};
		readonly 'clause.match.arm.last': {
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'clause.print': {
			readonly expression:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'clause.print.chevron': {
			readonly expression:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'clause.where.predicate': {
			readonly left: V.Clause.Bounds.HigherRanked<G> | G['identifier'] | G['type'];
		};
		readonly 'clause.with.item': {
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly comment: {
			readonly content: unknown;
		};
		readonly 'comment.block': {
			readonly content: unknown;
		};
		readonly 'comment.block.doc': {
			readonly content: unknown;
		};
		readonly 'comment.block.doc.inner': {
			readonly content: unknown;
		};
		readonly 'comment.line': {
			readonly content: V.Comment.Text<G>;
		};
		readonly 'comment.line.doc': {
			readonly content: V.Comment.Text<G>;
		};
		readonly 'comment.line.doc.inner': {
			readonly content: V.Comment.Text<G>;
		};
		readonly 'declaration.ambient': {
			readonly content:
				| V.Clause.Import.Alias<G>
				| G['declaration']
				| V.Statement.Block<G>;
		};
		readonly 'declaration.class': {
			readonly bases:
				| V.Argument.Keyword<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Element.Splat.Any<G>;
			readonly body: G['declaration'] | G['statement'];
			readonly implements: G['identifier'] | G['type'];
		};
		readonly 'declaration.constant': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'declaration.enum_member': {
			readonly body: V.Declaration.Field<G>;
			readonly name: G['identifier'] | G['literal'] | string;
			readonly value:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'declaration.enum_member.struct': {
			readonly body: V.Declaration.Field<G>;
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'declaration.enum_member.tuple': {
			readonly body: V.Declaration.Field<G>;
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'declaration.extension': {
			readonly implements: unknown;
			readonly traitClause: unknown;
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'declaration.extension.conformance': {
			readonly implements: unknown;
			readonly traitClause: unknown;
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'declaration.field': {
			readonly name: G['expression'] | G['identifier'] | G['literal'] | string;
			readonly optionality: string;
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly value:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly visibility: V.Modifier.Visibility<G>;
		};
		readonly 'declaration.field.signature': {
			readonly name: G['expression'] | G['literal'] | V.Identifier.Property<G> | string;
			readonly type: G['identifier'] | G['type'];
			readonly visibility: V.Modifier.Visibility<G>;
		};
		readonly 'declaration.function': {
			readonly body: V.Declaration.TypeAlias<G> | G['statement'];
			readonly parameters:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['pattern']
				| V.Declaration.Parameter.Any<G>
				| string
				| G['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'declaration.function.signature': {
			readonly functionModifiers: V.Modifier.Extern<G> | string;
			readonly parameters:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| V.Declaration.Parameter.Any<G>
				| string
				| G['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'declaration.interface': {
			readonly body:
				| G['attribute']
				| G['declaration']
				| V.Expression.Call.Macro<G>
				| G['statement']
				| V.Type.Object<G>;
		};
		readonly 'declaration.interface.trait': {
			readonly body:
				| G['attribute']
				| G['declaration']
				| V.Expression.Call.Macro<G>
				| G['statement'];
		};
		readonly 'declaration.macro': {
			readonly name: G['identifier'] | string;
		};
		readonly 'declaration.method': {
			readonly accessor: string;
			readonly body: V.Declaration.TypeAlias<G> | G['statement'];
			readonly name: G['expression'] | G['identifier'] | G['literal'] | string;
			readonly parameters:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['pattern']
				| V.Declaration.Parameter.Any<G>
				| string
				| G['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly visibility: V.Modifier.Visibility<G>;
		};
		readonly 'declaration.method.signature': {
			readonly accessor: string;
			readonly functionModifiers: V.Modifier.Extern<G> | string;
			readonly name: G['expression'] | G['identifier'] | G['literal'] | string;
			readonly parameters:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| V.Declaration.Parameter.Any<G>
				| string
				| G['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly visibility: V.Modifier.Visibility<G>;
		};
		readonly 'declaration.method.signature.abstract': {
			readonly accessorKind: string;
			readonly name: G['expression'] | G['literal'] | V.Identifier.Property<G> | string;
			readonly returnType: G['identifier'] | G['type'];
			readonly visibility: V.Modifier.Visibility<G>;
		};
		readonly 'declaration.method.static': {
			readonly parameters:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| V.Declaration.Parameter.Any<G>
				| string
				| G['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'declaration.module': {
			readonly body:
				| G['attribute']
				| G['declaration']
				| V.Expression.Call.Macro<G>
				| G['statement'];
			readonly name: G['identifier'] | V.Literal.String<G>;
		};
		readonly 'declaration.module.external': {
			readonly name: G['identifier'] | V.Literal.String<G>;
		};
		readonly 'declaration.module_property': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'declaration.parameter': {
			readonly default:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly name:
				| unknown
				| G['expression']
				| G['identifier']
				| V.Literal.Null.Undefined<G>
				| G['pattern'];
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly visibility: V.Modifier.Visibility<G>;
		};
		readonly 'declaration.parameter.default': {
			readonly default:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly name: G['identifier'] | V.Pattern.Tuple<G>;
		};
		readonly 'declaration.parameter.typed': {
			readonly name: G['identifier'] | V.Pattern.Splat.Any<G>;
		};
		readonly 'declaration.parameter.typed_default': {
			readonly default:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'declaration.parameter.variadic': {
			readonly pattern: unknown;
		};
		readonly 'declaration.signature.call': {
			readonly returnType: G['identifier'] | G['type'];
		};
		readonly 'declaration.signature.construct': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'declaration.signature.index': {
			readonly indexType: G['identifier'] | G['type'];
			readonly name: G['identifier'] | string;
			readonly sign: string;
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'declaration.struct': {
			readonly body: V.Declaration.Field<G>;
		};
		readonly 'declaration.struct.tuple': {
			readonly body: V.Declaration.Field<G>;
		};
		readonly 'declaration.type_alias': {
			readonly value:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'declaration.type_parameter': {
			readonly default:
				| G['clause']
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'declaration.type_parameter.const': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly value: G['identifier'] | G['literal'] | V.Statement.Block<G>;
		};
		readonly 'declaration.variable': {
			readonly binding: string;
			readonly name: unknown | G['expression'] | G['identifier'] | G['pattern'];
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly value:
				| G['declaration']
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
		};
		readonly 'declaration.variable.pattern': {
			readonly name: G['identifier'] | G['pattern'];
			readonly type: G['identifier'] | G['type'];
			readonly value:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'declaration.variable.static': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'element.macro.token_repetition': {
			readonly operator: string;
			readonly tokens:
				| G['identifier']
				| G['literal']
				| string
				| V.Element.Macro.Any<G>
				| V.Type.Primitive<G>;
		};
		readonly 'element.macro.token_repetition.pattern': {
			readonly operator: string;
			readonly tokenPatterns:
				| G['identifier']
				| G['literal']
				| string
				| V.Element.Macro.Any<G>
				| V.Type.Primitive<G>;
		};
		readonly 'element.macro.token_tree': {
			readonly tokens:
				| V.Element.Macro.Any<G>
				| G['identifier']
				| G['literal']
				| string;
		};
		readonly 'element.pair': {
			readonly key:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| string;
			readonly value:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'element.splat': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'element.splat.dictionary': {
			readonly expression:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'element.struct.base': {
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'element.struct.field': {
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'element.template': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'element.template.substitution': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'element.tuple': {
			readonly name: G['identifier'] | V.Pattern.Rest<G>;
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'element.tuple.member': {
			readonly name: G['identifier'] | V.Pattern.Rest<G>;
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'element.tuple.member.optional': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'element.type_argument': {
			readonly content:
				| V.Clause.Bounds.Removed<G>
				| V.Element.TypeBinding<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['literal']
				| V.Statement.Block<G>
				| G['type'];
		};
		readonly 'element.type_binding': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'expression.assignment': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement']
				| string;
			readonly right:
				| G['declaration']
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
		};
		readonly 'expression.assignment.compound': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement']
				| string;
			readonly operator: string;
			readonly right:
				| G['declaration']
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
		};
		readonly 'expression.await': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>
				| G['statement'];
		};
		readonly 'expression.binary': {
			readonly left:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
			readonly operator: string;
			readonly right:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
		};
		readonly 'expression.binary.identity': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>;
			readonly operator: unknown;
		};
		readonly 'expression.binary.identity.is': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>;
			readonly operator: unknown;
		};
		readonly 'expression.binary.identity.is_not': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>;
			readonly operator: unknown;
		};
		readonly 'expression.binary.logical': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly operator: string;
			readonly right:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'expression.binary.membership': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>;
			readonly operator: unknown;
		};
		readonly 'expression.binary.membership.not_in': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>;
			readonly operator: unknown;
		};
		readonly 'expression.call': {
			readonly arguments:
				| V.Argument.Keyword<G>
				| V.Declaration.Module<G>
				| G['element']
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
			readonly function:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>
				| G['statement']
				| string;
			readonly typeArguments: G['identifier'] | G['type'];
		};
		readonly 'expression.call.member': {
			readonly arguments:
				| V.Argument.Keyword<G>
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Element.Splat.Any<G>
				| G['statement'];
			readonly function:
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>
				| G['statement']
				| string;
			readonly typeArguments: G['identifier'] | G['type'];
		};
		readonly 'expression.call.new': {
			readonly arguments:
				| V.Declaration.Module<G>
				| V.Element.Splat<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly function: G['expression'] | G['identifier'] | G['literal'];
			readonly typeArguments: G['identifier'] | G['type'];
		};
		readonly 'expression.call.path': {
			readonly arguments:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
			readonly function:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
				| string;
		};
		readonly 'expression.call.template': {
			readonly function: G['expression'] | G['identifier'] | G['literal'];
		};
		readonly 'expression.cast': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'expression.cast.as': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly typeAnnotation: G['identifier'] | string | G['type'];
			readonly value:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'expression.cast.assertion': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly typeArguments: G['identifier'] | G['type'];
		};
		readonly 'expression.cast.non_null': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'expression.cast.satisfies': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly typeAnnotation: G['identifier'] | G['type'];
		};
		readonly 'expression.class': {
			readonly body: G['declaration'] | V.Statement.Block.Static<G>;
			readonly implements: G['identifier'] | G['type'];
		};
		readonly 'expression.collection.list': {
			readonly elements:
				| V.Declaration.Module<G>
				| V.Element.Splat.Any<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['modifier']
				| G['pattern']
				| G['statement']
				| V.Type.Primitive<G>;
		};
		readonly 'expression.collection.list.repeat': {
			readonly element:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
				| V.Type.Primitive<G>;
			readonly length:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
				| V.Type.Primitive<G>;
		};
		readonly 'expression.collection.object': {
			readonly properties:
				| V.Declaration.Method<G>
				| G['element']
				| string;
		};
		readonly 'expression.collection.set': {
			readonly collectionElements:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Element.Splat.Any<G>;
		};
		readonly 'expression.collection.struct': {
			readonly name: V.Identifier.Type<G> | G['type'];
		};
		readonly 'expression.collection.tuple': {
			readonly elements:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Element.Splat.Any<G>;
			readonly expressions:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'expression.comprehension': {
			readonly body:
				| V.Element.Pair<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'expression.comprehension.generator': {
			readonly body:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'expression.comprehension.list': {
			readonly body:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'expression.comprehension.set': {
			readonly body:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'expression.conditional': {
			readonly alternative:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly condition:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly consequence:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'expression.function': {
			readonly returnType: G['identifier'] | G['type'];
		};
		readonly 'expression.instantiation': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly function: V.Expression.Member<G> | G['identifier'];
			readonly typeArguments: V.Element.TypeArgument<G> | G['identifier'] | G['type'];
		};
		readonly 'expression.interpolation': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'expression.interpolation.format': {
			readonly elements: V.Expression.Interpolation<G> | string;
		};
		readonly 'expression.lambda': {
			readonly body:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['modifier']
				| G['pattern']
				| G['statement']
				| V.Type.Primitive<G>
				| string;
			readonly parameters:
				| G['identifier']
				| G['pattern']
				| V.Declaration.Parameter.Any<G>;
			readonly returnType:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'expression.member': {
			readonly object:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>
				| G['statement'];
			readonly property: G['identifier'] | V.Literal.Number.Integer<G>;
		};
		readonly 'expression.parenthesized': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['modifier']
				| G['pattern']
				| G['statement']
				| V.Type.Primitive<G>;
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'expression.range': {
			readonly end:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
				| V.Type.Primitive<G>;
			readonly operator: string;
			readonly start:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
				| V.Type.Primitive<G>;
		};
		readonly 'expression.reference': {
			readonly argument:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement']
				| V.Type.Primitive<G>;
		};
		readonly 'expression.sequence': {
			readonly expressions:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'expression.slice': {
			readonly start:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly step:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly stop:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'expression.subscript': {
			readonly index:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
			readonly object:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>
				| G['statement'];
		};
		readonly 'expression.try': {
			readonly argument:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'expression.unary': {
			readonly argument:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Pattern.Splat<G>
				| G['statement'];
			readonly operator: string;
		};
		readonly 'expression.update': {
			readonly argument:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly operator: string;
		};
		readonly 'expression.yield': {
			readonly content:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'expression.yield.delegate': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'identifier.metavariable': {
			readonly name: unknown;
		};
		readonly 'identifier.scoped': {
			readonly path: G['identifier'] | string | G['type'];
		};
		readonly 'literal.number.float': {
			readonly exponent: unknown;
			readonly fraction: unknown;
			readonly imaginary: unknown;
			readonly integer: unknown;
			readonly marker: string;
			readonly sign: string;
		};
		readonly 'literal.number.float.leading_point': {
			readonly exponent: unknown;
			readonly fraction: unknown;
			readonly imaginary: unknown;
			readonly integer: unknown;
			readonly marker: string;
			readonly sign: string;
		};
		readonly 'literal.number.float.scientific': {
			readonly exponent: unknown;
			readonly imaginary: unknown;
			readonly integer: unknown;
			readonly marker: string;
			readonly sign: string;
		};
		readonly 'literal.number.integer': {
			readonly content: unknown;
			readonly suffix: string;
		};
		readonly 'literal.number.integer.big.binary': {
			readonly content: unknown;
		};
		readonly 'literal.number.integer.big.hex': {
			readonly content: unknown;
		};
		readonly 'literal.number.integer.big.octal': {
			readonly content: unknown;
		};
		readonly 'literal.number.integer.binary': {
			readonly content: unknown;
			readonly prefix: string;
			readonly suffix: string;
		};
		readonly 'literal.number.integer.hex': {
			readonly content: unknown;
			readonly prefix: string;
			readonly suffix: string;
		};
		readonly 'literal.number.integer.octal': {
			readonly content: unknown;
			readonly prefix: string;
			readonly suffix: string;
		};
		readonly 'literal.string': {
			readonly elements:
				| unknown
				| V.Expression.Interpolation<G>
				| V.Literal.String.Escape<G>
				| V.Literal.String.Text<G>
				| string;
		};
		readonly 'literal.string.escape': {
			readonly content: unknown;
		};
		readonly 'literal.string.raw': {
			readonly content: unknown;
		};
		readonly 'literal.template': {
			readonly elements: unknown | V.Expression.Interpolation<G> | V.Literal.String.Escape<G>;
		};
		readonly module: {
			readonly statements:
				| G['attribute']
				| V.Clause.Import.Alias<G>
				| G['declaration']
				| V.Expression.Call.Macro<G>
				| G['statement'];
		};
		readonly 'pattern.array': {
			readonly elements:
				| G['expression']
				| G['identifier']
				| V.Literal.Null.Undefined<G>
				| G['pattern'];
		};
		readonly 'pattern.as': {
			readonly alias:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly expression:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'pattern.assignment': {
			readonly left:
				| G['expression']
				| G['identifier']
				| V.Literal.Null.Undefined<G>
				| G['pattern'];
			readonly right:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'pattern.captured': {
			readonly pattern: unknown;
		};
		readonly 'pattern.case': {
			readonly content:
				| unknown
				| V.Identifier.Dotted<G>
				| G['literal']
				| string
				| V.Pattern.Case.Any<G>;
		};
		readonly 'pattern.case.complex': {
			readonly operator: string;
		};
		readonly 'pattern.case.dictionary': {
			readonly elements: unknown | V.Pattern.Case.Splat<G>;
		};
		readonly 'pattern.case.keyword': {
			readonly value:
				| unknown
				| V.Identifier.Dotted<G>
				| G['literal']
				| string
				| V.Pattern.Case.Any<G>;
		};
		readonly 'pattern.case.or': {
			readonly patterns:
				| unknown
				| V.Identifier.Dotted<G>
				| G['literal']
				| string
				| V.Pattern.Case.Any<G>;
		};
		readonly 'pattern.case.splat': {
			readonly operator: string;
		};
		readonly 'pattern.list': {
			readonly patterns: G['expression'] | G['identifier'] | G['pattern'];
		};
		readonly 'pattern.match': {
			readonly condition:
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Clause.Let.Any<G>
				| G['statement'];
			readonly pattern: unknown;
		};
		readonly 'pattern.mutable': {
			readonly pattern: unknown;
		};
		readonly 'pattern.object': {
			readonly properties: G['identifier'] | G['pattern'] | string;
		};
		readonly 'pattern.object.assignment': {
			readonly left: G['identifier'] | G['pattern'] | string;
			readonly right:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'pattern.object.pair': {
			readonly key: G['expression'] | G['literal'] | V.Identifier.Property<G> | string;
			readonly value:
				| G['expression']
				| G['identifier']
				| V.Literal.Null.Undefined<G>
				| G['pattern'];
		};
		readonly 'pattern.or': {
			readonly left:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Type.Primitive<G>;
			readonly right:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Type.Primitive<G>;
		};
		readonly 'pattern.range': {
			readonly left:
				| G['identifier']
				| G['literal']
				| string;
			readonly right:
				| G['identifier']
				| G['literal']
				| string;
		};
		readonly 'pattern.reference': {
			readonly pattern: unknown;
		};
		readonly 'pattern.reference.value': {
			readonly pattern: unknown;
		};
		readonly 'pattern.rest': {
			readonly lhsExpression:
				| G['expression']
				| G['identifier']
				| V.Literal.Null.Undefined<G>
				| G['pattern']
				| string;
		};
		readonly 'pattern.slice': {
			readonly patterns: unknown;
		};
		readonly 'pattern.splat': {
			readonly target: G['expression'] | G['identifier'] | string;
		};
		readonly 'pattern.splat.dictionary': {
			readonly target: G['expression'] | G['identifier'] | string;
		};
		readonly 'pattern.struct.field': {
			readonly pattern:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Type.Primitive<G>;
		};
		readonly 'pattern.tuple': {
			readonly elements: unknown | V.Expression.Lambda<G>;
			readonly patterns: unknown | G['expression'] | G['identifier'] | G['pattern'];
		};
		readonly 'pattern.tuple.struct': {
			readonly patterns: unknown;
			readonly type: G['identifier'] | V.Type.Generic.Turbofish<G>;
		};
		readonly 'statement.assert': {
			readonly expressions:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'statement.block': {
			readonly statements:
				| G['attribute']
				| V.Clause.Import.Alias<G>
				| G['declaration']
				| V.Expression.Call.Macro<G>
				| G['statement'];
			readonly trailingExpression:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'statement.break': {
			readonly expression:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'statement.delete': {
			readonly expressions:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'statement.exec': {
			readonly code: G['identifier'] | V.Literal.String<G>;
			readonly inClauses:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'statement.export': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['modifier']
				| V.Type.Primitive<G>;
		};
		readonly 'statement.expression': {
			readonly content:
				| V.Declaration.Variable<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
		};
		readonly 'statement.if': {
			readonly condition:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Clause.Let.Any<G>
				| G['statement'];
			readonly consequence: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		};
		readonly 'statement.import': {
			readonly argument: G['identifier'] | V.Clause.Import.Any<G> | string;
			readonly fromClause: V.Clause.Import.Require<G> | V.Literal.String<G>;
			readonly importClause: string;
		};
		readonly 'statement.labeled': {
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly label: V.Identifier.Label<G> | string;
		};
		readonly 'statement.loop': {
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		};
		readonly 'statement.loop.counted': {
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly condition:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Statement.Empty<G>;
			readonly increment:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal'];
			readonly initializer:
				| G['declaration']
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Statement.Empty<G>;
		};
		readonly 'statement.loop.do_while': {
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		};
		readonly 'statement.loop.for': {
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly forHeader: unknown;
			readonly left: unknown | G['expression'] | G['identifier'] | G['pattern'];
			readonly right:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
		};
		readonly 'statement.loop.while': {
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
			readonly condition:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| V.Clause.Let.Any<G>
				| G['statement'];
		};
		readonly 'statement.match': {
			readonly body: unknown | V.Clause.Case<G> | string;
			readonly subject:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
		};
		readonly 'statement.print': {
			readonly printArguments:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'statement.print.chevron': {
			readonly printChevronArguments:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| string;
		};
		readonly 'statement.return': {
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern']
				| G['statement'];
		};
		readonly 'statement.scope': {
			readonly body: V.Clause.Import.Alias<G> | G['declaration'] | G['statement'];
		};
		readonly 'statement.throw': {
			readonly cause:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
			readonly expression:
				| V.Declaration.Module<G>
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['pattern'];
		};
		readonly 'statement.try': {
			readonly body: V.Declaration.TypeAlias<G> | G['statement'];
		};
		readonly 'statement.with': {
			readonly body: V.Declaration.TypeAlias<G> | G['statement'];
		};
		readonly type: {
			readonly content:
				| unknown
				| G['expression']
				| G['identifier']
				| G['literal']
				| V.Modifier.Extern<G>
				| G['pattern']
				| string
				| G['type'];
		};
		readonly 'type.abstract': {
			readonly trait: V.Clause.Bounds.Removed<G> | V.Identifier.Type<G> | G['type'];
		};
		readonly 'type.array': {
			readonly element:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly length:
				| G['expression']
				| G['identifier']
				| G['literal']
				| G['statement'];
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.bounded': {
			readonly left:
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| V.Clause.Bounds.Any<G>
				| G['type'];
			readonly right:
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| V.Clause.Bounds.Any<G>
				| G['type'];
		};
		readonly 'type.bracketed': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'type.conditional': {
			readonly alternative: G['identifier'] | G['type'];
			readonly consequence: G['identifier'] | G['type'];
			readonly left: G['identifier'] | G['type'];
			readonly right: G['identifier'] | G['type'];
		};
		readonly 'type.dynamic': {
			readonly trait: V.Clause.Bounds.HigherRanked<G> | V.Identifier.Type<G> | G['type'];
		};
		readonly 'type.function': {
			readonly parameters:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| V.Declaration.Parameter.Any<G>
				| string
				| G['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly trait: V.Identifier.Type<G> | V.Type.Path<G>;
		};
		readonly 'type.function.constructor': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.generic': {
			readonly name: G['identifier'] | string | V.Type.Path<G>;
			readonly type: G['identifier'] | string | V.Type.Path<G>;
			readonly typeArguments: V.Element.TypeArgument<G> | G['identifier'] | G['type'];
		};
		readonly 'type.index_query': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.infer': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.intersection': {
			readonly left: G['identifier'] | G['type'];
			readonly right: G['identifier'] | G['type'];
		};
		readonly 'type.literal': {
			readonly content: unknown | G['literal'];
		};
		readonly 'type.lookup': {
			readonly indexType: G['identifier'] | G['type'];
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.maybe': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.object': {
			readonly closing: string;
			readonly members: G['declaration'] | V.Statement.Export<G>;
			readonly opening: string;
		};
		readonly 'type.optional': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.parenthesized': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.path': {
			readonly path: G['identifier'] | string | G['type'];
		};
		readonly 'type.path.expression': {
			readonly path: G['identifier'] | string | V.Type.Generic.Turbofish<G>;
		};
		readonly 'type.pointer': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'type.predicate': {
			readonly name: G['identifier'] | V.Type.Primitive<G>;
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.predicate.asserts': {
			readonly value: G['identifier'] | V.Type.Predicate<G>;
		};
		readonly 'type.qualified': {
			readonly alias:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'type.query': {
			readonly expression: unknown | G['identifier'];
		};
		readonly 'type.readonly': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.reference': {
			readonly type:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'type.rest': {
			readonly type: G['identifier'] | G['type'];
		};
		readonly 'type.splat': {
			readonly operator: string;
		};
		readonly 'type.template': {
			readonly elements: unknown | V.Element.Template.Substitution<G>;
		};
		readonly 'type.tuple': {
			readonly tupleTypeMembers:
				| G['identifier']
				| V.Element.Tuple.Member.Any<G>
				| G['type'];
			readonly types:
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| G['identifier']
				| G['type'];
		};
		readonly 'type.union': {
			readonly left: G['identifier'] | G['type'];
			readonly right: G['identifier'] | G['type'];
		};
	};
}

/** A grammar kind a member admits that no binding claims yet; the name says which. */
export interface Unmapped<K extends string> {
	readonly $unmapped: K;
}

