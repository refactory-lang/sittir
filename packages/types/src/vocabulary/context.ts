// Generated from the grammars' bindings.scm. Do not edit.
import type * as V from './index.ts';
/** The typemap: one key per top-level namespace, projecting to that namespace's kind-set for a grammar, and the slots whose type the grammar states. */
export interface GrammarContext {
	readonly argument: unknown;
	readonly attribute: unknown;
	readonly clause: unknown;
	readonly comment: unknown;
	readonly declaration: unknown;
	readonly element: unknown;
	readonly expression: unknown;
	readonly identifier: unknown;
	readonly literal: unknown;
	readonly modifier: unknown;
	readonly module: unknown;
	readonly pattern: unknown;
	readonly statement: unknown;
	readonly type: unknown;
	readonly slots: SlotTable;
}

/** The slots the vocabulary names and the language states: by kind path, then member. A grammar fills each from its bindings. */
export interface SlotTable {
	readonly argument: {
		readonly value: unknown;
	};
	readonly 'argument.keyword': {
		readonly value: unknown;
	};
	readonly attribute: {
		readonly content: unknown;
	};
	readonly 'attribute.content': {
		readonly input: unknown;
	};
	readonly 'attribute.content.call': {
		readonly arguments: unknown;
		readonly function: unknown;
		readonly typeArguments: unknown;
	};
	readonly 'attribute.content.member': {
		readonly object: unknown;
	};
	readonly 'attribute.content.parenthesized': {
		readonly expression: unknown;
	};
	readonly 'attribute.decorator': {
		readonly content: unknown;
	};
	readonly 'clause.bounds': {
		readonly bounds: unknown;
	};
	readonly 'clause.bounds.higher_ranked': {
		readonly type: unknown;
	};
	readonly 'clause.bounds.removed': {
		readonly type: unknown;
	};
	readonly 'clause.case': {
		readonly bodies: unknown;
		readonly consequence: unknown;
		readonly value: unknown;
	};
	readonly 'clause.case.default': {
		readonly bodies: unknown;
	};
	readonly 'clause.catch': {
		readonly catchClauseGroup: unknown;
	};
	readonly 'clause.comprehension.for': {
		readonly left: unknown;
		readonly rights: unknown;
	};
	readonly 'clause.comprehension.if': {
		readonly condition: unknown;
	};
	readonly 'clause.constraint': {
		readonly content: unknown;
		readonly type: unknown;
	};
	readonly 'clause.default': {
		readonly type: unknown;
	};
	readonly 'clause.elif': {
		readonly condition: unknown;
		readonly consequence: unknown;
	};
	readonly 'clause.else': {
		readonly body: unknown;
	};
	readonly 'clause.except': {
		readonly exception: unknown;
		readonly suite: unknown;
	};
	readonly 'clause.export.namespace': {
		readonly moduleExportName: unknown;
	};
	readonly 'clause.export.specifier': {
		readonly alias: unknown;
		readonly exportKind: unknown;
		readonly name: unknown;
	};
	readonly 'clause.extends': {
		readonly extendsClauseSingles: unknown;
	};
	readonly 'clause.extends.type': {
		readonly types: unknown;
	};
	readonly 'clause.finally': {
		readonly block: unknown;
	};
	readonly 'clause.implements': {
		readonly types: unknown;
	};
	readonly 'clause.import.attribute': {
		readonly attributeKind: unknown;
	};
	readonly 'clause.import.list': {
		readonly useClauses: unknown;
	};
	readonly 'clause.import.names': {
		readonly content: unknown;
	};
	readonly 'clause.import.wildcard': {
		readonly useWildcardGroup: unknown;
	};
	readonly 'clause.let': {
		readonly pattern: unknown;
		readonly value: unknown;
	};
	readonly 'clause.let.chain': {
		readonly left: unknown;
		readonly rights: unknown;
	};
	readonly 'clause.mapped_type': {
		readonly alias: unknown;
		readonly type: unknown;
	};
	readonly 'clause.match.arm.last': {
		readonly value: unknown;
	};
	readonly 'clause.print': {
		readonly expression: unknown;
	};
	readonly 'clause.print.chevron': {
		readonly expression: unknown;
	};
	readonly 'clause.where.predicate': {
		readonly left: unknown;
	};
	readonly 'clause.with.item': {
		readonly value: unknown;
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
		readonly content: unknown;
	};
	readonly 'comment.line.doc': {
		readonly content: unknown;
	};
	readonly 'comment.line.doc.inner': {
		readonly content: unknown;
	};
	readonly 'declaration.ambient': {
		readonly content: unknown;
	};
	readonly 'declaration.class': {
		readonly bases: unknown;
		readonly body: unknown;
		readonly implements: unknown;
	};
	readonly 'declaration.class.abstract': {
		readonly body: unknown;
		readonly implements: unknown;
	};
	readonly 'declaration.constant': {
		readonly type: unknown;
		readonly value: unknown;
	};
	readonly 'declaration.enum_member': {
		readonly body: unknown;
		readonly name: unknown;
		readonly value: unknown;
	};
	readonly 'declaration.enum_member.struct': {
		readonly body: unknown;
		readonly value: unknown;
	};
	readonly 'declaration.enum_member.tuple': {
		readonly body: unknown;
		readonly value: unknown;
	};
	readonly 'declaration.extension': {
		readonly implements: unknown;
		readonly traitClause: unknown;
		readonly type: unknown;
	};
	readonly 'declaration.extension.conformance': {
		readonly implements: unknown;
		readonly traitClause: unknown;
		readonly type: unknown;
	};
	readonly 'declaration.field': {
		readonly name: unknown;
		readonly optionality: unknown;
		readonly type: unknown;
		readonly value: unknown;
		readonly visibility: unknown;
	};
	readonly 'declaration.field.signature': {
		readonly name: unknown;
		readonly type: unknown;
		readonly visibility: unknown;
	};
	readonly 'declaration.function': {
		readonly body: unknown;
		readonly parameters: unknown;
		readonly returnType: unknown;
	};
	readonly 'declaration.function.generator': {
		readonly returnType: unknown;
	};
	readonly 'declaration.function.signature': {
		readonly functionModifiers: unknown;
		readonly parameters: unknown;
		readonly returnType: unknown;
	};
	readonly 'declaration.interface': {
		readonly body: unknown;
	};
	readonly 'declaration.interface.trait': {
		readonly body: unknown;
	};
	readonly 'declaration.method': {
		readonly accessor: unknown;
		readonly body: unknown;
		readonly name: unknown;
		readonly parameters: unknown;
		readonly returnType: unknown;
		readonly visibility: unknown;
	};
	readonly 'declaration.method.signature': {
		readonly accessor: unknown;
		readonly functionModifiers: unknown;
		readonly name: unknown;
		readonly parameters: unknown;
		readonly returnType: unknown;
		readonly visibility: unknown;
	};
	readonly 'declaration.method.signature.abstract': {
		readonly accessorKind: unknown;
		readonly name: unknown;
		readonly returnType: unknown;
		readonly visibility: unknown;
	};
	readonly 'declaration.method.static': {
		readonly parameters: unknown;
		readonly returnType: unknown;
	};
	readonly 'declaration.module': {
		readonly name: unknown;
	};
	readonly 'declaration.module.external': {
		readonly name: unknown;
	};
	readonly 'declaration.module_property': {
		readonly type: unknown;
	};
	readonly 'declaration.parameter': {
		readonly default: unknown;
		readonly name: unknown;
		readonly type: unknown;
		readonly visibility: unknown;
	};
	readonly 'declaration.parameter.default': {
		readonly default: unknown;
		readonly name: unknown;
	};
	readonly 'declaration.parameter.optional': {
		readonly default: unknown;
		readonly name: unknown;
		readonly type: unknown;
		readonly visibility: unknown;
	};
	readonly 'declaration.parameter.typed': {
		readonly name: unknown;
	};
	readonly 'declaration.parameter.typed_default': {
		readonly default: unknown;
	};
	readonly 'declaration.parameter.variadic': {
		readonly pattern: unknown;
	};
	readonly 'declaration.signature.call': {
		readonly returnType: unknown;
	};
	readonly 'declaration.signature.construct': {
		readonly type: unknown;
	};
	readonly 'declaration.type_alias': {
		readonly value: unknown;
	};
	readonly 'declaration.type_parameter': {
		readonly default: unknown;
	};
	readonly 'declaration.type_parameter.const': {
		readonly type: unknown;
		readonly value: unknown;
	};
	readonly 'declaration.variable': {
		readonly name: unknown;
		readonly type: unknown;
		readonly value: unknown;
	};
	readonly 'declaration.variable.lexical': {
		readonly keyword: unknown;
	};
	readonly 'declaration.variable.pattern': {
		readonly name: unknown;
		readonly type: unknown;
		readonly value: unknown;
	};
	readonly 'declaration.variable.static': {
		readonly type: unknown;
		readonly value: unknown;
	};
	readonly 'element.macro.token_repetition': {
		readonly operator: unknown;
		readonly tokens: unknown;
	};
	readonly 'element.macro.token_repetition.pattern': {
		readonly operator: unknown;
		readonly tokenPatterns: unknown;
	};
	readonly 'element.pair': {
		readonly key: unknown;
		readonly value: unknown;
	};
	readonly 'element.splat': {
		readonly expression: unknown;
	};
	readonly 'element.splat.dictionary': {
		readonly expression: unknown;
	};
	readonly 'element.struct.base': {
		readonly value: unknown;
	};
	readonly 'element.struct.field': {
		readonly value: unknown;
	};
	readonly 'element.template': {
		readonly type: unknown;
	};
	readonly 'element.template.substitution': {
		readonly type: unknown;
	};
	readonly 'element.tuple': {
		readonly name: unknown;
		readonly type: unknown;
	};
	readonly 'element.tuple.member': {
		readonly name: unknown;
		readonly type: unknown;
	};
	readonly 'element.tuple.member.optional': {
		readonly type: unknown;
	};
	readonly 'element.type_argument': {
		readonly content: unknown;
	};
	readonly 'element.type_binding': {
		readonly type: unknown;
	};
	readonly 'expression.assignment': {
		readonly left: unknown;
		readonly right: unknown;
	};
	readonly 'expression.assignment.compound': {
		readonly left: unknown;
		readonly operator: unknown;
		readonly right: unknown;
	};
	readonly 'expression.await': {
		readonly expression: unknown;
	};
	readonly 'expression.binary': {
		readonly binaryExpressionIn: unknown;
		readonly left: unknown;
		readonly operator: unknown;
		readonly right: unknown;
	};
	readonly 'expression.binary.identity': {
		readonly left: unknown;
		readonly operator: unknown;
	};
	readonly 'expression.binary.identity.is': {
		readonly left: unknown;
		readonly operator: unknown;
	};
	readonly 'expression.binary.identity.is_not': {
		readonly left: unknown;
		readonly operator: unknown;
	};
	readonly 'expression.binary.logical': {
		readonly left: unknown;
		readonly operator: unknown;
		readonly right: unknown;
	};
	readonly 'expression.binary.membership': {
		readonly left: unknown;
		readonly operator: unknown;
	};
	readonly 'expression.binary.membership.not_in': {
		readonly left: unknown;
		readonly operator: unknown;
	};
	readonly 'expression.call': {
		readonly arguments: unknown;
		readonly function: unknown;
		readonly typeArguments: unknown;
	};
	readonly 'expression.call.member': {
		readonly arguments: unknown;
		readonly function: unknown;
		readonly typeArguments: unknown;
	};
	readonly 'expression.call.new': {
		readonly arguments: unknown;
		readonly function: unknown;
		readonly typeArguments: unknown;
	};
	readonly 'expression.call.path': {
		readonly arguments: unknown;
		readonly function: unknown;
	};
	readonly 'expression.call.template': {
		readonly function: unknown;
	};
	readonly 'expression.cast': {
		readonly expression: unknown;
	};
	readonly 'expression.cast.as': {
		readonly expression: unknown;
		readonly type: unknown;
		readonly typeAnnotation: unknown;
		readonly value: unknown;
	};
	readonly 'expression.cast.assertion': {
		readonly expression: unknown;
		readonly typeArguments: unknown;
	};
	readonly 'expression.cast.non_null': {
		readonly expression: unknown;
	};
	readonly 'expression.cast.satisfies': {
		readonly expression: unknown;
		readonly typeAnnotation: unknown;
	};
	readonly 'expression.class': {
		readonly body: unknown;
		readonly implements: unknown;
	};
	readonly 'expression.collection.list': {
		readonly collectionElements: unknown;
		readonly elements: unknown;
	};
	readonly 'expression.collection.object': {
		readonly properties: unknown;
	};
	readonly 'expression.collection.set': {
		readonly collectionElements: unknown;
	};
	readonly 'expression.collection.struct': {
		readonly name: unknown;
	};
	readonly 'expression.collection.tuple': {
		readonly elements: unknown;
		readonly expressions: unknown;
	};
	readonly 'expression.comprehension': {
		readonly body: unknown;
	};
	readonly 'expression.comprehension.generator': {
		readonly body: unknown;
	};
	readonly 'expression.comprehension.list': {
		readonly body: unknown;
	};
	readonly 'expression.comprehension.set': {
		readonly body: unknown;
	};
	readonly 'expression.conditional': {
		readonly alternative: unknown;
		readonly condition: unknown;
		readonly consequence: unknown;
	};
	readonly 'expression.function': {
		readonly returnType: unknown;
	};
	readonly 'expression.function.generator': {
		readonly returnType: unknown;
	};
	readonly 'expression.instantiation': {
		readonly expression: unknown;
		readonly function: unknown;
		readonly typeArguments: unknown;
	};
	readonly 'expression.interpolation': {
		readonly expression: unknown;
	};
	readonly 'expression.interpolation.format': {
		readonly elements: unknown;
	};
	readonly 'expression.lambda': {
		readonly body: unknown;
		readonly parameters: unknown;
	};
	readonly 'expression.member': {
		readonly object: unknown;
		readonly property: unknown;
	};
	readonly 'expression.parenthesized': {
		readonly expression: unknown;
	};
	readonly 'expression.sequence': {
		readonly expressions: unknown;
	};
	readonly 'expression.slice': {
		readonly start: unknown;
		readonly step: unknown;
		readonly stop: unknown;
	};
	readonly 'expression.subscript': {
		readonly index: unknown;
		readonly object: unknown;
	};
	readonly 'expression.try': {
		readonly argument: unknown;
	};
	readonly 'expression.unary': {
		readonly argument: unknown;
		readonly operator: unknown;
	};
	readonly 'expression.update': {
		readonly argument: unknown;
		readonly operator: unknown;
	};
	readonly 'expression.yield': {
		readonly content: unknown;
		readonly expression: unknown;
	};
	readonly 'expression.yield.delegate': {
		readonly expression: unknown;
	};
	readonly 'identifier.metavariable': {
		readonly name: unknown;
	};
	readonly 'identifier.property.computed': {
		readonly expression: unknown;
	};
	readonly 'identifier.property.private': {
		readonly content: unknown;
	};
	readonly 'identifier.scoped': {
		readonly path: unknown;
	};
	readonly 'literal.number.float': {
		readonly exponent: unknown;
		readonly fraction: unknown;
		readonly integer: unknown;
		readonly marker: unknown;
		readonly sign: unknown;
	};
	readonly 'literal.number.integer': {
		readonly content: unknown;
		readonly prefix: unknown;
	};
	readonly 'literal.number.integer.hex': {
		readonly content: unknown;
		readonly prefix: unknown;
		readonly suffix: unknown;
	};
	readonly 'literal.string': {
		readonly content: unknown;
		readonly contents: unknown;
	};
	readonly 'literal.string.docstring': {
		readonly contents: unknown;
	};
	readonly 'literal.string.escape': {
		readonly content: unknown;
	};
	readonly 'literal.string.raw': {
		readonly content: unknown;
	};
	readonly 'literal.template': {
		readonly elements: unknown;
	};
	readonly module: {
		readonly statements: unknown;
	};
	readonly 'pattern.array': {
		readonly elements: unknown;
	};
	readonly 'pattern.as': {
		readonly alias: unknown;
		readonly expression: unknown;
	};
	readonly 'pattern.assignment': {
		readonly left: unknown;
		readonly right: unknown;
	};
	readonly 'pattern.captured': {
		readonly pattern: unknown;
	};
	readonly 'pattern.case': {
		readonly content: unknown;
	};
	readonly 'pattern.case.complex': {
		readonly operator: unknown;
	};
	readonly 'pattern.case.dictionary': {
		readonly elements: unknown;
	};
	readonly 'pattern.case.keyword': {
		readonly value: unknown;
	};
	readonly 'pattern.case.or': {
		readonly patterns: unknown;
	};
	readonly 'pattern.case.splat': {
		readonly operator: unknown;
	};
	readonly 'pattern.list': {
		readonly patterns: unknown;
	};
	readonly 'pattern.match': {
		readonly condition: unknown;
		readonly pattern: unknown;
	};
	readonly 'pattern.mutable': {
		readonly pattern: unknown;
	};
	readonly 'pattern.object': {
		readonly properties: unknown;
	};
	readonly 'pattern.object.assignment': {
		readonly left: unknown;
		readonly right: unknown;
	};
	readonly 'pattern.object.pair': {
		readonly key: unknown;
		readonly value: unknown;
	};
	readonly 'pattern.reference': {
		readonly pattern: unknown;
	};
	readonly 'pattern.reference.value': {
		readonly pattern: unknown;
	};
	readonly 'pattern.rest': {
		readonly lhsExpression: unknown;
	};
	readonly 'pattern.slice': {
		readonly patterns: unknown;
	};
	readonly 'pattern.splat': {
		readonly target: unknown;
	};
	readonly 'pattern.splat.dictionary': {
		readonly target: unknown;
	};
	readonly 'pattern.tuple': {
		readonly elements: unknown;
		readonly patterns: unknown;
	};
	readonly 'pattern.tuple.struct': {
		readonly patterns: unknown;
		readonly type: unknown;
	};
	readonly 'statement.assert': {
		readonly expressions: unknown;
	};
	readonly 'statement.block': {
		readonly statements: unknown;
		readonly trailingExpression: unknown;
	};
	readonly 'statement.break': {
		readonly expression: unknown;
	};
	readonly 'statement.delete': {
		readonly expressions: unknown;
	};
	readonly 'statement.exec': {
		readonly code: unknown;
		readonly inClauses: unknown;
	};
	readonly 'statement.expression': {
		readonly content: unknown;
		readonly expression: unknown;
	};
	readonly 'statement.if': {
		readonly condition: unknown;
		readonly consequence: unknown;
	};
	readonly 'statement.import': {
		readonly argument: unknown;
		readonly fromClause: unknown;
		readonly importClause: unknown;
	};
	readonly 'statement.labeled': {
		readonly body: unknown;
		readonly label: unknown;
	};
	readonly 'statement.loop': {
		readonly body: unknown;
	};
	readonly 'statement.loop.counted': {
		readonly body: unknown;
		readonly condition: unknown;
		readonly increment: unknown;
		readonly initializer: unknown;
	};
	readonly 'statement.loop.do_while': {
		readonly body: unknown;
	};
	readonly 'statement.loop.for': {
		readonly body: unknown;
		readonly forHeader: unknown;
		readonly left: unknown;
		readonly right: unknown;
	};
	readonly 'statement.loop.while': {
		readonly body: unknown;
		readonly condition: unknown;
	};
	readonly 'statement.match': {
		readonly body: unknown;
		readonly subject: unknown;
	};
	readonly 'statement.print': {
		readonly printArguments: unknown;
	};
	readonly 'statement.print.chevron': {
		readonly printChevronArguments: unknown;
	};
	readonly 'statement.return': {
		readonly expression: unknown;
	};
	readonly 'statement.scope': {
		readonly body: unknown;
	};
	readonly 'statement.throw': {
		readonly cause: unknown;
		readonly expression: unknown;
	};
	readonly 'statement.try': {
		readonly body: unknown;
	};
	readonly 'statement.with': {
		readonly body: unknown;
	};
	readonly type: {
		readonly content: unknown;
	};
	readonly 'type.abstract': {
		readonly trait: unknown;
	};
	readonly 'type.array': {
		readonly element: unknown;
		readonly length: unknown;
		readonly type: unknown;
	};
	readonly 'type.bounded': {
		readonly left: unknown;
		readonly right: unknown;
	};
	readonly 'type.bracketed': {
		readonly type: unknown;
	};
	readonly 'type.conditional': {
		readonly alternative: unknown;
		readonly consequence: unknown;
		readonly left: unknown;
		readonly right: unknown;
	};
	readonly 'type.dynamic': {
		readonly trait: unknown;
	};
	readonly 'type.function': {
		readonly content: unknown;
		readonly parameters: unknown;
		readonly returnType: unknown;
	};
	readonly 'type.function.constructor': {
		readonly type: unknown;
	};
	readonly 'type.generic': {
		readonly name: unknown;
		readonly type: unknown;
		readonly typeArguments: unknown;
	};
	readonly 'type.index_query': {
		readonly type: unknown;
	};
	readonly 'type.infer': {
		readonly type: unknown;
	};
	readonly 'type.intersection': {
		readonly left: unknown;
		readonly right: unknown;
	};
	readonly 'type.literal': {
		readonly content: unknown;
	};
	readonly 'type.lookup': {
		readonly indexType: unknown;
		readonly type: unknown;
	};
	readonly 'type.maybe': {
		readonly type: unknown;
	};
	readonly 'type.object': {
		readonly closing: unknown;
		readonly members: unknown;
		readonly opening: unknown;
	};
	readonly 'type.optional': {
		readonly type: unknown;
	};
	readonly 'type.parenthesized': {
		readonly type: unknown;
	};
	readonly 'type.path': {
		readonly path: unknown;
	};
	readonly 'type.path.expression': {
		readonly path: unknown;
	};
	readonly 'type.predicate': {
		readonly name: unknown;
		readonly type: unknown;
	};
	readonly 'type.predicate.asserts': {
		readonly value: unknown;
	};
	readonly 'type.qualified': {
		readonly alias: unknown;
		readonly type: unknown;
	};
	readonly 'type.query': {
		readonly expression: unknown;
	};
	readonly 'type.readonly': {
		readonly type: unknown;
	};
	readonly 'type.reference': {
		readonly type: unknown;
	};
	readonly 'type.rest': {
		readonly type: unknown;
	};
	readonly 'type.splat': {
		readonly operator: unknown;
	};
	readonly 'type.template': {
		readonly elements: unknown;
	};
	readonly 'type.tuple': {
		readonly tupleTypeMembers: unknown;
		readonly types: unknown;
	};
	readonly 'type.union': {
		readonly left: unknown;
		readonly right: unknown;
	};
}

/** A grammar kind a member admits that no binding claims yet; the name says which. */
export interface Unmapped<K extends string> {
	readonly $unmapped: K;
}

/** The permissive closure: every namespace's full kind-set, and each slot's roles and refs, or `string` where it is text. */
export interface BaseContext extends GrammarContext {
	readonly argument: V.Argument.Any<BaseContext>;
	readonly attribute: V.Attribute.Any<BaseContext>;
	readonly clause: V.Clause.Any<BaseContext>;
	readonly comment: V.Comment.Any<BaseContext>;
	readonly declaration: V.Declaration.Any<BaseContext>;
	readonly element: V.Element.Any<BaseContext>;
	readonly expression: V.Expression.Any<BaseContext>;
	readonly identifier: V.Identifier.Any<BaseContext>;
	readonly literal: V.Literal.Any<BaseContext>;
	readonly modifier: V.Modifier.Any<BaseContext>;
	readonly module: V.Module.Any<BaseContext>;
	readonly pattern: V.Pattern.Any<BaseContext>;
	readonly statement: V.Statement.Any<BaseContext>;
	readonly type: V.Type.Any<BaseContext>;
	readonly slots: {
		readonly argument: {
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'argument.keyword': {
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly attribute: {
			readonly content:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Attribute.Content.Any<BaseContext>;
		};
		readonly 'attribute.content': {
			readonly input: unknown;
		};
		readonly 'attribute.content.call': {
			readonly arguments:
				| V.Declaration.Module<BaseContext>
				| V.Element.Splat<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly function: V.Attribute.Content.Member<BaseContext> | BaseContext['identifier'];
			readonly typeArguments: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'attribute.content.member': {
			readonly object: V.Attribute.Content.Member<BaseContext> | BaseContext['identifier'];
		};
		readonly 'attribute.content.parenthesized': {
			readonly expression: BaseContext['identifier'] | V.Attribute.Content.Any<BaseContext>;
		};
		readonly 'attribute.decorator': {
			readonly content:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Attribute.Content.Any<BaseContext>;
		};
		readonly 'clause.bounds': {
			readonly bounds:
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| V.Clause.Bounds.Any<BaseContext>
				| BaseContext['type'];
		};
		readonly 'clause.bounds.higher_ranked': {
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'clause.bounds.removed': {
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'clause.case': {
			readonly bodies: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
			readonly consequence: V.Declaration.TypeAlias<BaseContext> | BaseContext['statement'];
			readonly value:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'clause.case.default': {
			readonly bodies: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
		};
		readonly 'clause.catch': {
			readonly catchClauseGroup: unknown;
		};
		readonly 'clause.comprehension.for': {
			readonly left: BaseContext['expression'] | BaseContext['identifier'] | BaseContext['pattern'];
			readonly rights:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'clause.comprehension.if': {
			readonly condition:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'clause.constraint': {
			readonly content: string;
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'clause.default': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'clause.elif': {
			readonly condition:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly consequence: V.Declaration.TypeAlias<BaseContext> | BaseContext['statement'];
		};
		readonly 'clause.else': {
			readonly body: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
		};
		readonly 'clause.except': {
			readonly exception:
				| unknown
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly suite: V.Declaration.TypeAlias<BaseContext> | BaseContext['statement'];
		};
		readonly 'clause.export.namespace': {
			readonly moduleExportName: BaseContext['identifier'] | V.Literal.String<BaseContext>;
		};
		readonly 'clause.export.specifier': {
			readonly alias: BaseContext['identifier'] | V.Literal.String<BaseContext>;
			readonly exportKind: string;
			readonly name: BaseContext['identifier'] | V.Literal.String<BaseContext>;
		};
		readonly 'clause.extends': {
			readonly extendsClauseSingles: unknown;
		};
		readonly 'clause.extends.type': {
			readonly types: V.Identifier.Type<BaseContext> | BaseContext['type'];
		};
		readonly 'clause.finally': {
			readonly block: V.Declaration.TypeAlias<BaseContext> | BaseContext['statement'];
		};
		readonly 'clause.implements': {
			readonly types: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'clause.import.attribute': {
			readonly attributeKind: string;
		};
		readonly 'clause.import.list': {
			readonly useClauses: BaseContext['identifier'] | V.Clause.Import.Any<BaseContext>;
		};
		readonly 'clause.import.names': {
			readonly content: unknown | V.Clause.Import.Any<BaseContext>;
		};
		readonly 'clause.import.wildcard': {
			readonly useWildcardGroup: unknown;
		};
		readonly 'clause.let': {
			readonly pattern: unknown;
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'clause.let.chain': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Clause.Let.Any<BaseContext>
				| BaseContext['statement'];
			readonly rights:
				| V.Clause.Let<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'clause.mapped_type': {
			readonly alias: BaseContext['identifier'] | BaseContext['type'];
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'clause.match.arm.last': {
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'clause.print': {
			readonly expression:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'clause.print.chevron': {
			readonly expression:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'clause.where.predicate': {
			readonly left: V.Clause.Bounds.HigherRanked<BaseContext> | BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'clause.with.item': {
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
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
			readonly content: unknown;
		};
		readonly 'comment.line.doc': {
			readonly content: unknown;
		};
		readonly 'comment.line.doc.inner': {
			readonly content: unknown;
		};
		readonly 'declaration.ambient': {
			readonly content:
				| V.Clause.Import.Alias<BaseContext>
				| BaseContext['declaration']
				| V.Statement.Block<BaseContext>;
		};
		readonly 'declaration.class': {
			readonly bases:
				| V.Argument.Keyword<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Element.Splat.Any<BaseContext>;
			readonly body: BaseContext['declaration'] | BaseContext['statement'];
			readonly implements: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'declaration.class.abstract': {
			readonly body: BaseContext['declaration'] | V.Statement.Block.Static<BaseContext>;
			readonly implements: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'declaration.constant': {
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'declaration.enum_member': {
			readonly body: unknown | V.Declaration.Field<BaseContext>;
			readonly name: BaseContext['identifier'] | BaseContext['literal'] | string;
			readonly value:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'declaration.enum_member.struct': {
			readonly body: unknown | V.Declaration.Field<BaseContext>;
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'declaration.enum_member.tuple': {
			readonly body: unknown | V.Declaration.Field<BaseContext>;
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'declaration.extension': {
			readonly implements: unknown;
			readonly traitClause: unknown;
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'declaration.extension.conformance': {
			readonly implements: unknown;
			readonly traitClause: unknown;
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'declaration.field': {
			readonly name: BaseContext['identifier'] | BaseContext['literal'] | string;
			readonly optionality: string;
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly value:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly visibility: V.Modifier.Visibility<BaseContext> | string;
		};
		readonly 'declaration.field.signature': {
			readonly name: BaseContext['literal'] | V.Identifier.Property.Any<BaseContext> | string;
			readonly type: BaseContext['identifier'] | BaseContext['type'];
			readonly visibility: string;
		};
		readonly 'declaration.function': {
			readonly body: V.Declaration.TypeAlias<BaseContext> | BaseContext['statement'];
			readonly parameters:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['pattern']
				| V.Declaration.Parameter.Any<BaseContext>
				| string
				| BaseContext['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'declaration.function.generator': {
			readonly returnType: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'declaration.function.signature': {
			readonly functionModifiers: V.Modifier.Extern<BaseContext> | string;
			readonly parameters:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| V.Declaration.Parameter.Any<BaseContext>
				| string
				| BaseContext['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'declaration.interface': {
			readonly body:
				| BaseContext['attribute']
				| BaseContext['declaration']
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['statement']
				| V.Type.Object<BaseContext>;
		};
		readonly 'declaration.interface.trait': {
			readonly body:
				| BaseContext['attribute']
				| BaseContext['declaration']
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['statement'];
		};
		readonly 'declaration.method': {
			readonly accessor: string;
			readonly body: V.Declaration.TypeAlias<BaseContext> | BaseContext['statement'];
			readonly name: BaseContext['identifier'] | BaseContext['literal'] | string;
			readonly parameters:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['pattern']
				| V.Declaration.Parameter.Any<BaseContext>
				| string
				| BaseContext['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly visibility: V.Modifier.Visibility<BaseContext> | string;
		};
		readonly 'declaration.method.signature': {
			readonly accessor: string;
			readonly functionModifiers: V.Modifier.Extern<BaseContext> | string;
			readonly name: BaseContext['identifier'] | BaseContext['literal'] | string;
			readonly parameters:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| V.Declaration.Parameter.Any<BaseContext>
				| string
				| BaseContext['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly visibility: V.Modifier.Visibility<BaseContext> | string;
		};
		readonly 'declaration.method.signature.abstract': {
			readonly accessorKind: string;
			readonly name: BaseContext['literal'] | V.Identifier.Property.Any<BaseContext> | string;
			readonly returnType: BaseContext['identifier'] | BaseContext['type'];
			readonly visibility: string;
		};
		readonly 'declaration.method.static': {
			readonly parameters:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| V.Declaration.Parameter.Any<BaseContext>
				| string
				| BaseContext['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'declaration.module': {
			readonly name: BaseContext['identifier'] | V.Literal.String<BaseContext>;
		};
		readonly 'declaration.module.external': {
			readonly name: BaseContext['identifier'] | V.Literal.String<BaseContext>;
		};
		readonly 'declaration.module_property': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'declaration.parameter': {
			readonly default:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly name:
				| unknown
				| BaseContext['expression']
				| BaseContext['identifier']
				| V.Literal.Null.Undefined<BaseContext>
				| BaseContext['pattern'];
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly visibility: string;
		};
		readonly 'declaration.parameter.default': {
			readonly default:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly name: BaseContext['identifier'] | V.Pattern.Tuple<BaseContext>;
		};
		readonly 'declaration.parameter.optional': {
			readonly default:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly name:
				| BaseContext['expression']
				| BaseContext['identifier']
				| V.Literal.Null.Undefined<BaseContext>
				| BaseContext['pattern'];
			readonly type: BaseContext['identifier'] | BaseContext['type'];
			readonly visibility: string;
		};
		readonly 'declaration.parameter.typed': {
			readonly name: BaseContext['identifier'] | V.Pattern.Splat.Any<BaseContext>;
		};
		readonly 'declaration.parameter.typed_default': {
			readonly default:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'declaration.parameter.variadic': {
			readonly pattern: unknown;
		};
		readonly 'declaration.signature.call': {
			readonly returnType: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'declaration.signature.construct': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'declaration.type_alias': {
			readonly value:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'declaration.type_parameter': {
			readonly default:
				| BaseContext['clause']
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'declaration.type_parameter.const': {
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly value: BaseContext['identifier'] | BaseContext['literal'] | V.Statement.Block<BaseContext>;
		};
		readonly 'declaration.variable': {
			readonly name: unknown | BaseContext['expression'] | BaseContext['identifier'] | BaseContext['pattern'];
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly value:
				| BaseContext['declaration']
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
		};
		readonly 'declaration.variable.lexical': {
			readonly keyword: string;
		};
		readonly 'declaration.variable.pattern': {
			readonly name: BaseContext['identifier'] | BaseContext['pattern'];
			readonly type: BaseContext['identifier'] | BaseContext['type'];
			readonly value:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'declaration.variable.static': {
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'element.macro.token_repetition': {
			readonly operator: string;
			readonly tokens:
				| BaseContext['identifier']
				| BaseContext['literal']
				| string
				| V.Element.Macro.Any<BaseContext>
				| V.Type.Primitive<BaseContext>;
		};
		readonly 'element.macro.token_repetition.pattern': {
			readonly operator: string;
			readonly tokenPatterns:
				| BaseContext['identifier']
				| BaseContext['literal']
				| string
				| V.Element.Macro.Any<BaseContext>
				| V.Type.Primitive<BaseContext>;
		};
		readonly 'element.pair': {
			readonly key:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| string;
			readonly value:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'element.splat': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'element.splat.dictionary': {
			readonly expression:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'element.struct.base': {
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'element.struct.field': {
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'element.template': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'element.template.substitution': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'element.tuple': {
			readonly name: BaseContext['identifier'] | V.Pattern.Rest<BaseContext>;
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'element.tuple.member': {
			readonly name: BaseContext['identifier'] | V.Pattern.Rest<BaseContext>;
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'element.tuple.member.optional': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'element.type_argument': {
			readonly content:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Element.TypeBinding<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Statement.Block<BaseContext>
				| BaseContext['type'];
		};
		readonly 'element.type_binding': {
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'expression.assignment': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement']
				| string;
			readonly right:
				| BaseContext['declaration']
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
		};
		readonly 'expression.assignment.compound': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement']
				| string;
			readonly operator: string;
			readonly right:
				| BaseContext['declaration']
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
		};
		readonly 'expression.await': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>
				| BaseContext['statement'];
		};
		readonly 'expression.binary': {
			readonly binaryExpressionIn: unknown;
			readonly left:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
			readonly operator: string;
			readonly right:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
		};
		readonly 'expression.binary.identity': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>;
			readonly operator: unknown;
		};
		readonly 'expression.binary.identity.is': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>;
			readonly operator: unknown;
		};
		readonly 'expression.binary.identity.is_not': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>;
			readonly operator: unknown;
		};
		readonly 'expression.binary.logical': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly operator: string;
			readonly right:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'expression.binary.membership': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>;
			readonly operator: unknown;
		};
		readonly 'expression.binary.membership.not_in': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>;
			readonly operator: unknown;
		};
		readonly 'expression.call': {
			readonly arguments:
				| V.Argument.Keyword<BaseContext>
				| V.Declaration.Module<BaseContext>
				| BaseContext['element']
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
			readonly function:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>
				| BaseContext['statement']
				| string;
			readonly typeArguments: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.call.member': {
			readonly arguments:
				| V.Argument.Keyword<BaseContext>
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Element.Splat.Any<BaseContext>
				| BaseContext['statement'];
			readonly function:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>
				| BaseContext['statement']
				| string;
			readonly typeArguments: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.call.new': {
			readonly arguments:
				| V.Declaration.Module<BaseContext>
				| V.Element.Splat<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly function: BaseContext['expression'] | BaseContext['identifier'] | BaseContext['literal'];
			readonly typeArguments: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.call.path': {
			readonly arguments:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
			readonly function:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement']
				| string;
		};
		readonly 'expression.call.template': {
			readonly function: BaseContext['expression'] | BaseContext['identifier'] | BaseContext['literal'];
		};
		readonly 'expression.cast': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'expression.cast.as': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly typeAnnotation: BaseContext['identifier'] | string | BaseContext['type'];
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'expression.cast.assertion': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly typeArguments: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.cast.non_null': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'expression.cast.satisfies': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly typeAnnotation: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.class': {
			readonly body: BaseContext['declaration'] | V.Statement.Block.Static<BaseContext>;
			readonly implements: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.collection.list': {
			readonly collectionElements:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Element.Splat.Any<BaseContext>;
			readonly elements:
				| V.Declaration.Module<BaseContext>
				| V.Element.Splat<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'expression.collection.object': {
			readonly properties:
				| V.Declaration.Method<BaseContext>
				| BaseContext['element']
				| V.Identifier.Property.Shorthand<BaseContext>
				| string;
		};
		readonly 'expression.collection.set': {
			readonly collectionElements:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Element.Splat.Any<BaseContext>;
		};
		readonly 'expression.collection.struct': {
			readonly name: V.Identifier.Type<BaseContext> | BaseContext['type'];
		};
		readonly 'expression.collection.tuple': {
			readonly elements:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Element.Splat.Any<BaseContext>;
			readonly expressions:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'expression.comprehension': {
			readonly body:
				| V.Element.Pair<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'expression.comprehension.generator': {
			readonly body:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'expression.comprehension.list': {
			readonly body:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'expression.comprehension.set': {
			readonly body:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'expression.conditional': {
			readonly alternative:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly condition:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly consequence:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'expression.function': {
			readonly returnType: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.function.generator': {
			readonly returnType: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.instantiation': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly function: V.Expression.Member<BaseContext> | BaseContext['identifier'];
			readonly typeArguments: V.Element.TypeArgument<BaseContext> | BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'expression.interpolation': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'expression.interpolation.format': {
			readonly elements: V.Expression.Interpolation<BaseContext> | string;
		};
		readonly 'expression.lambda': {
			readonly body:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Statement.Block<BaseContext>;
			readonly parameters:
				| BaseContext['identifier']
				| BaseContext['pattern']
				| V.Declaration.Parameter.Any<BaseContext>;
		};
		readonly 'expression.member': {
			readonly object:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>
				| BaseContext['statement'];
			readonly property: BaseContext['identifier'] | V.Literal.Number.Integer<BaseContext>;
		};
		readonly 'expression.parenthesized': {
			readonly expression:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
		};
		readonly 'expression.sequence': {
			readonly expressions:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'expression.slice': {
			readonly start:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly step:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly stop:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'expression.subscript': {
			readonly index:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
			readonly object:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>
				| BaseContext['statement'];
		};
		readonly 'expression.try': {
			readonly argument:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'expression.unary': {
			readonly argument:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Pattern.Splat<BaseContext>
				| BaseContext['statement'];
			readonly operator: string;
		};
		readonly 'expression.update': {
			readonly argument:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly operator: string;
		};
		readonly 'expression.yield': {
			readonly content:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'expression.yield.delegate': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'identifier.metavariable': {
			readonly name: unknown;
		};
		readonly 'identifier.property.computed': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'identifier.property.private': {
			readonly content: unknown;
		};
		readonly 'identifier.scoped': {
			readonly path: BaseContext['identifier'] | string | BaseContext['type'];
		};
		readonly 'literal.number.float': {
			readonly exponent: unknown;
			readonly fraction: unknown;
			readonly integer: unknown;
			readonly marker: string;
			readonly sign: string;
		};
		readonly 'literal.number.integer': {
			readonly content: unknown;
			readonly prefix: string;
		};
		readonly 'literal.number.integer.hex': {
			readonly content: unknown;
			readonly prefix: string;
			readonly suffix: string;
		};
		readonly 'literal.string': {
			readonly content: unknown | V.Literal.String.Escape<BaseContext>;
			readonly contents:
				| unknown
				| V.Expression.Interpolation<BaseContext>
				| V.Literal.String.Escape<BaseContext>
				| string;
		};
		readonly 'literal.string.docstring': {
			readonly contents:
				| unknown
				| V.Expression.Interpolation<BaseContext>
				| V.Literal.String.Escape<BaseContext>
				| string;
		};
		readonly 'literal.string.escape': {
			readonly content: unknown;
		};
		readonly 'literal.string.raw': {
			readonly content: unknown;
		};
		readonly 'literal.template': {
			readonly elements: unknown | V.Expression.Interpolation<BaseContext> | V.Literal.String.Escape<BaseContext>;
		};
		readonly module: {
			readonly statements:
				| BaseContext['attribute']
				| V.Clause.Import.Alias<BaseContext>
				| BaseContext['declaration']
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['statement'];
		};
		readonly 'pattern.array': {
			readonly elements:
				| BaseContext['expression']
				| BaseContext['identifier']
				| V.Literal.Null.Undefined<BaseContext>
				| BaseContext['pattern'];
		};
		readonly 'pattern.as': {
			readonly alias:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly expression:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'pattern.assignment': {
			readonly left:
				| BaseContext['expression']
				| BaseContext['identifier']
				| V.Literal.Null.Undefined<BaseContext>
				| BaseContext['pattern'];
			readonly right:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'pattern.captured': {
			readonly pattern: unknown;
		};
		readonly 'pattern.case': {
			readonly content:
				| unknown
				| V.Identifier.Dotted<BaseContext>
				| BaseContext['literal']
				| string
				| V.Pattern.Case.Any<BaseContext>;
		};
		readonly 'pattern.case.complex': {
			readonly operator: string;
		};
		readonly 'pattern.case.dictionary': {
			readonly elements: unknown | V.Pattern.Case.Splat<BaseContext>;
		};
		readonly 'pattern.case.keyword': {
			readonly value:
				| unknown
				| V.Identifier.Dotted<BaseContext>
				| BaseContext['literal']
				| string
				| V.Pattern.Case.Any<BaseContext>;
		};
		readonly 'pattern.case.or': {
			readonly patterns:
				| unknown
				| V.Identifier.Dotted<BaseContext>
				| BaseContext['literal']
				| string
				| V.Pattern.Case.Any<BaseContext>;
		};
		readonly 'pattern.case.splat': {
			readonly operator: string;
		};
		readonly 'pattern.list': {
			readonly patterns: BaseContext['expression'] | BaseContext['identifier'] | BaseContext['pattern'];
		};
		readonly 'pattern.match': {
			readonly condition:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Clause.Let.Any<BaseContext>
				| BaseContext['statement'];
			readonly pattern: unknown;
		};
		readonly 'pattern.mutable': {
			readonly pattern: unknown;
		};
		readonly 'pattern.object': {
			readonly properties: BaseContext['identifier'] | BaseContext['pattern'] | string;
		};
		readonly 'pattern.object.assignment': {
			readonly left: BaseContext['identifier'] | BaseContext['pattern'] | string;
			readonly right:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'pattern.object.pair': {
			readonly key: BaseContext['literal'] | V.Identifier.Property.Any<BaseContext> | string;
			readonly value:
				| BaseContext['expression']
				| BaseContext['identifier']
				| V.Literal.Null.Undefined<BaseContext>
				| BaseContext['pattern'];
		};
		readonly 'pattern.reference': {
			readonly pattern: unknown;
		};
		readonly 'pattern.reference.value': {
			readonly pattern: unknown;
		};
		readonly 'pattern.rest': {
			readonly lhsExpression:
				| BaseContext['expression']
				| BaseContext['identifier']
				| V.Literal.Null.Undefined<BaseContext>
				| BaseContext['pattern']
				| string;
		};
		readonly 'pattern.slice': {
			readonly patterns: unknown;
		};
		readonly 'pattern.splat': {
			readonly target: BaseContext['expression'] | BaseContext['identifier'] | string;
		};
		readonly 'pattern.splat.dictionary': {
			readonly target: BaseContext['expression'] | BaseContext['identifier'] | string;
		};
		readonly 'pattern.tuple': {
			readonly elements: unknown | V.Expression.Lambda<BaseContext>;
			readonly patterns: unknown | BaseContext['expression'] | BaseContext['identifier'] | BaseContext['pattern'];
		};
		readonly 'pattern.tuple.struct': {
			readonly patterns: unknown;
			readonly type: BaseContext['identifier'] | V.Type.Generic.Turbofish<BaseContext>;
		};
		readonly 'statement.assert': {
			readonly expressions:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'statement.block': {
			readonly statements:
				| BaseContext['attribute']
				| V.Clause.Import.Alias<BaseContext>
				| BaseContext['declaration']
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['statement'];
			readonly trailingExpression:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'statement.break': {
			readonly expression:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'statement.delete': {
			readonly expressions:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'statement.exec': {
			readonly code: BaseContext['identifier'] | V.Literal.String<BaseContext>;
			readonly inClauses:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'statement.expression': {
			readonly content:
				| V.Declaration.Variable<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
		};
		readonly 'statement.if': {
			readonly condition:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Clause.Let.Any<BaseContext>
				| BaseContext['statement'];
			readonly consequence: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
		};
		readonly 'statement.import': {
			readonly argument: BaseContext['identifier'] | V.Clause.Import.Any<BaseContext> | string;
			readonly fromClause: unknown | V.Clause.Import.Require<BaseContext> | V.Literal.String<BaseContext>;
			readonly importClause: string;
		};
		readonly 'statement.labeled': {
			readonly body: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
			readonly label: V.Identifier.Label<BaseContext> | string;
		};
		readonly 'statement.loop': {
			readonly body: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
		};
		readonly 'statement.loop.counted': {
			readonly body: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
			readonly condition:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Statement.Empty<BaseContext>;
			readonly increment:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal'];
			readonly initializer:
				| BaseContext['declaration']
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Statement.Empty<BaseContext>;
		};
		readonly 'statement.loop.do_while': {
			readonly body: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
		};
		readonly 'statement.loop.for': {
			readonly body: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
			readonly forHeader: unknown;
			readonly left: unknown | BaseContext['expression'] | BaseContext['identifier'] | BaseContext['pattern'];
			readonly right:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
		};
		readonly 'statement.loop.while': {
			readonly body: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
			readonly condition:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| V.Clause.Let.Any<BaseContext>
				| BaseContext['statement'];
		};
		readonly 'statement.match': {
			readonly body: unknown | V.Clause.Case<BaseContext> | string;
			readonly subject:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
		};
		readonly 'statement.print': {
			readonly printArguments:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'statement.print.chevron': {
			readonly printChevronArguments:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| string;
		};
		readonly 'statement.return': {
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern']
				| BaseContext['statement'];
		};
		readonly 'statement.scope': {
			readonly body: V.Clause.Import.Alias<BaseContext> | BaseContext['declaration'] | BaseContext['statement'];
		};
		readonly 'statement.throw': {
			readonly cause:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
			readonly expression:
				| V.Declaration.Module<BaseContext>
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['pattern'];
		};
		readonly 'statement.try': {
			readonly body: V.Declaration.TypeAlias<BaseContext> | BaseContext['statement'];
		};
		readonly 'statement.with': {
			readonly body: V.Declaration.TypeAlias<BaseContext> | BaseContext['statement'];
		};
		readonly type: {
			readonly content:
				| unknown
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| V.Modifier.Extern<BaseContext>
				| BaseContext['pattern']
				| string
				| BaseContext['type'];
		};
		readonly 'type.abstract': {
			readonly trait: V.Clause.Bounds.Removed<BaseContext> | V.Identifier.Type<BaseContext> | BaseContext['type'];
		};
		readonly 'type.array': {
			readonly element:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly length:
				| BaseContext['expression']
				| BaseContext['identifier']
				| BaseContext['literal']
				| BaseContext['statement'];
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.bounded': {
			readonly left:
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| V.Clause.Bounds.Any<BaseContext>
				| BaseContext['type'];
			readonly right:
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| V.Clause.Bounds.Any<BaseContext>
				| BaseContext['type'];
		};
		readonly 'type.bracketed': {
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'type.conditional': {
			readonly alternative: BaseContext['identifier'] | BaseContext['type'];
			readonly consequence: BaseContext['identifier'] | BaseContext['type'];
			readonly left: BaseContext['identifier'] | BaseContext['type'];
			readonly right: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.dynamic': {
			readonly trait: V.Clause.Bounds.HigherRanked<BaseContext> | V.Identifier.Type<BaseContext> | BaseContext['type'];
		};
		readonly 'type.function': {
			readonly content: unknown | V.Modifier.Extern<BaseContext> | string;
			readonly parameters:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| V.Declaration.Parameter.Any<BaseContext>
				| string
				| BaseContext['type'];
			readonly returnType:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'type.function.constructor': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.generic': {
			readonly name: BaseContext['identifier'] | string | V.Type.Path<BaseContext>;
			readonly type: BaseContext['identifier'] | string | V.Type.Path<BaseContext>;
			readonly typeArguments: V.Element.TypeArgument<BaseContext> | BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.index_query': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.infer': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.intersection': {
			readonly left: BaseContext['identifier'] | BaseContext['type'];
			readonly right: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.literal': {
			readonly content: unknown | BaseContext['literal'];
		};
		readonly 'type.lookup': {
			readonly indexType: BaseContext['identifier'] | BaseContext['type'];
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.maybe': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.object': {
			readonly closing: string;
			readonly members: BaseContext['declaration'] | V.Statement.Export<BaseContext>;
			readonly opening: string;
		};
		readonly 'type.optional': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.parenthesized': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.path': {
			readonly path: BaseContext['identifier'] | string | BaseContext['type'];
		};
		readonly 'type.path.expression': {
			readonly path: BaseContext['identifier'] | string | V.Type.Generic.Turbofish<BaseContext>;
		};
		readonly 'type.predicate': {
			readonly name: BaseContext['identifier'] | V.Type.Primitive<BaseContext>;
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.predicate.asserts': {
			readonly value: BaseContext['identifier'] | V.Type.Predicate<BaseContext>;
		};
		readonly 'type.qualified': {
			readonly alias:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'type.query': {
			readonly expression: unknown | BaseContext['identifier'];
		};
		readonly 'type.readonly': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.reference': {
			readonly type:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'type.rest': {
			readonly type: BaseContext['identifier'] | BaseContext['type'];
		};
		readonly 'type.splat': {
			readonly operator: string;
		};
		readonly 'type.template': {
			readonly elements: unknown | V.Element.Template.Substitution<BaseContext>;
		};
		readonly 'type.tuple': {
			readonly tupleTypeMembers:
				| BaseContext['identifier']
				| V.Element.Tuple.Member.Any<BaseContext>
				| BaseContext['type'];
			readonly types:
				| V.Clause.Bounds.Removed<BaseContext>
				| V.Expression.Call.Macro<BaseContext>
				| BaseContext['identifier']
				| BaseContext['type'];
		};
		readonly 'type.union': {
			readonly left: BaseContext['identifier'] | BaseContext['type'];
			readonly right: BaseContext['identifier'] | BaseContext['type'];
		};
	};
}
