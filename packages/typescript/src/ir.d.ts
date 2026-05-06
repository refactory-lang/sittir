import * as F from './factories.js';
import * as FR from './from.js';
export declare const destructuringPattern: {
    readonly object: typeof F.objectPattern & {
        from: typeof FR.objectPatternFrom;
    };
    readonly array: typeof F.arrayPattern & {
        from: typeof FR.arrayPatternFrom;
    };
};
export declare const expressions: {
    readonly sequence: typeof F.sequenceExpression & {
        from: typeof FR.sequenceExpressionFrom;
    };
};
export declare const formalParameter: {
    readonly required: typeof F.requiredParameter & {
        from: typeof FR.requiredParameterFrom;
    };
    readonly optional: typeof F.optionalParameter & {
        from: typeof FR.optionalParameterFrom;
    };
};
export declare const identifier: {
    readonly undefined: typeof F.undefined_;
    readonly identifier: typeof F.identifier;
};
export declare const importIdentifier: {
    readonly identifier: typeof F.identifier;
};
export declare const jsxAttributeName: {
    readonly identifier: typeof F.identifier;
};
export declare const jsxChild: {
    readonly jsx: typeof F.jsxText;
};
export declare const jsxElementName: {
    readonly identifier: typeof F.identifier;
    readonly nested: typeof F.nestedIdentifier & {
        from: typeof FR.nestedIdentifierFrom;
    };
};
export declare const jsxIdentifier: {
    readonly identifier: typeof F.identifier;
};
export declare const moduleExportName: {
    readonly identifier: typeof F.identifier;
    readonly string: typeof F.string & {
        from: typeof FR.stringFrom;
        double: typeof F.stringUFormDouble & {
            from: typeof FR.stringUFormDoubleFrom;
        };
        single: typeof F.stringUFormSingle & {
            from: typeof FR.stringUFormSingleFrom;
        };
    };
};
export declare const propertyIdentifier: {
    readonly identifier: typeof F.identifier;
};
export declare const propertyName: {
    readonly identifier: typeof F.identifier;
    readonly privateProperty: typeof F.privatePropertyIdentifier;
    readonly string: typeof F.string & {
        from: typeof FR.stringFrom;
        double: typeof F.stringUFormDouble & {
            from: typeof FR.stringUFormDoubleFrom;
        };
        single: typeof F.stringUFormSingle & {
            from: typeof FR.stringUFormSingleFrom;
        };
    };
    readonly number: typeof F.number;
    readonly computedProperty: typeof F.computedPropertyName & {
        from: typeof FR.computedPropertyNameFrom;
    };
};
export declare const shorthandPropertyIdentifier: {
    readonly identifier: typeof F.identifier;
};
export declare const shorthandPropertyIdentifierPattern: {
    readonly identifier: typeof F.identifier;
};
export declare const statementIdentifier: {
    readonly identifier: typeof F.identifier;
};
export declare const tupleTypeMember: {
    readonly tuple: typeof F.tupleParameter & {
        from: typeof FR.tupleParameterFrom;
    };
    readonly optionalTuple: typeof F.optionalTupleParameter & {
        from: typeof FR.optionalTupleParameterFrom;
    };
    readonly optional: typeof F.optionalType & {
        from: typeof FR.optionalTypeFrom;
    };
    readonly rest: typeof F.restType & {
        from: typeof FR.restTypeFrom;
    };
};
export declare const declaration: {
    readonly function_: typeof F.functionSignature & {
        from: typeof FR.functionSignatureFrom;
    };
    readonly abstractClass: typeof F.abstractClassDeclaration & {
        from: typeof FR.abstractClassDeclarationFrom;
    };
    readonly module: typeof F.module & {
        from: typeof FR.moduleFrom;
    };
    readonly internal: typeof F.internalModule & {
        from: typeof FR.internalModuleFrom;
    };
    readonly typeAlias: typeof F.typeAliasDeclaration & {
        from: typeof FR.typeAliasDeclarationFrom;
    };
    readonly enum_: typeof F.enumDeclaration & {
        from: typeof FR.enumDeclarationFrom;
    };
    readonly interface_: typeof F.interfaceDeclaration & {
        from: typeof FR.interfaceDeclarationFrom;
    };
    readonly import_: typeof F.importAlias & {
        from: typeof FR.importAliasFrom;
    };
    readonly ambient: typeof F.ambientDeclaration & {
        from: typeof FR.ambientDeclarationFrom;
    };
};
export declare const expression: {
    readonly as: typeof F.asExpression & {
        from: typeof FR.asExpressionFrom;
    };
    readonly satisfies: typeof F.satisfiesExpression & {
        from: typeof FR.satisfiesExpressionFrom;
    };
    readonly instantiation: typeof F.instantiationExpression & {
        from: typeof FR.instantiationExpressionFrom;
    };
    readonly internal: typeof F.internalModule & {
        from: typeof FR.internalModuleFrom;
    };
    readonly type: typeof F.typeAssertion & {
        from: typeof FR.typeAssertionFrom;
    };
    readonly assignment: typeof F.assignmentExpression & {
        from: typeof FR.assignmentExpressionFrom;
    };
    readonly augmentedAssignment: typeof F.augmentedAssignmentExpression & {
        from: typeof FR.augmentedAssignmentExpressionFrom;
    };
    readonly await: typeof F.awaitExpression & {
        from: typeof FR.awaitExpressionFrom;
    };
    readonly unary: typeof F.unaryExpression & {
        from: typeof FR.unaryExpressionFrom;
    };
    readonly binary: typeof F.binaryExpression & {
        from: typeof FR.binaryExpressionFrom;
    };
    readonly ternary: typeof F.ternaryExpression & {
        from: typeof FR.ternaryExpressionFrom;
    };
    readonly update: typeof F.updateExpression & {
        from: typeof FR.updateExpressionFrom;
        postfix: typeof F.updateExpressionUFormPostfix & {
            from: typeof FR.updateExpressionUFormPostfixFrom;
        };
        prefix: typeof F.updateExpressionUFormPrefix & {
            from: typeof FR.updateExpressionUFormPrefixFrom;
        };
    };
    readonly new_: typeof F.newExpression & {
        from: typeof FR.newExpressionFrom;
    };
    readonly yield_: typeof F.yieldExpression & {
        from: typeof FR.yieldExpressionFrom;
    };
};
export declare const pattern: {
    readonly member: typeof F.memberExpression & {
        from: typeof FR.memberExpressionFrom;
    };
    readonly subscript: typeof F.subscriptExpression & {
        from: typeof FR.subscriptExpressionFrom;
    };
    readonly undefined: typeof F.undefined_;
    readonly identifier: typeof F.identifier;
    readonly object: typeof F.objectPattern & {
        from: typeof FR.objectPatternFrom;
    };
    readonly array: typeof F.arrayPattern & {
        from: typeof FR.arrayPatternFrom;
    };
    readonly nonNull: typeof F.nonNullExpression & {
        from: typeof FR.nonNullExpressionFrom;
    };
    readonly rest: typeof F.restPattern & {
        from: typeof FR.restPatternFrom;
    };
};
export declare const primaryExpression: {
    readonly nonNull: typeof F.nonNullExpression & {
        from: typeof FR.nonNullExpressionFrom;
    };
};
export declare const primaryType: {
    readonly parenthesized: typeof F.parenthesizedType & {
        from: typeof FR.parenthesizedTypeFrom;
    };
    readonly predefined: typeof F.predefinedType;
    readonly identifier: typeof F.identifier;
    readonly nestedType: typeof F.nestedTypeIdentifier & {
        from: typeof FR.nestedTypeIdentifierFrom;
    };
    readonly generic: typeof F.genericType & {
        from: typeof FR.genericTypeFrom;
    };
    readonly object: typeof F.objectType & {
        from: typeof FR.objectTypeFrom;
    };
    readonly array: typeof F.arrayType & {
        from: typeof FR.arrayTypeFrom;
    };
    readonly tuple: typeof F.tupleType & {
        from: typeof FR.tupleTypeFrom;
    };
    readonly flowMaybe: typeof F.flowMaybeType & {
        from: typeof FR.flowMaybeTypeFrom;
    };
    readonly type: typeof F.typeQuery & {
        from: typeof FR.typeQueryFrom;
    };
    readonly indexType: typeof F.indexTypeQuery & {
        from: typeof FR.indexTypeQueryFrom;
    };
    readonly this_: typeof F.this_;
    readonly literal: typeof F.literalType & {
        from: typeof FR.literalTypeFrom;
    };
    readonly lookup: typeof F.lookupType & {
        from: typeof FR.lookupTypeFrom;
    };
    readonly conditional: typeof F.conditionalType & {
        from: typeof FR.conditionalTypeFrom;
    };
    readonly templateLiteral: typeof F.templateLiteralType & {
        from: typeof FR.templateLiteralTypeFrom;
    };
    readonly intersection: typeof F.intersectionType & {
        from: typeof FR.intersectionTypeFrom;
    };
    readonly union: typeof F.unionType & {
        from: typeof FR.unionTypeFrom;
    };
};
export declare const statement: {
    readonly export_: typeof F.exportStatement & {
        from: typeof FR.exportStatementFrom;
        default: typeof F.exportStatementUFormDefault & {
            from: typeof FR.exportStatementUFormDefaultFrom;
        };
        type_export: typeof F.exportStatementUFormTypeExport & {
            from: typeof FR.exportStatementUFormTypeExportFrom;
        };
        equals_export: typeof F.exportStatementUFormEqualsExport & {
            from: typeof FR.exportStatementUFormEqualsExportFrom;
        };
        namespace_export: typeof F.exportStatementUFormNamespaceExport & {
            from: typeof FR.exportStatementUFormNamespaceExportFrom;
        };
    };
    readonly import_: typeof F.importStatement & {
        from: typeof FR.importStatementFrom;
    };
    readonly debugger_: typeof F.debuggerStatement & {
        from: typeof FR.debuggerStatementFrom;
    };
    readonly expression: typeof F.expressionStatement & {
        from: typeof FR.expressionStatementFrom;
    };
    readonly statementBlock: typeof F.statementBlock & {
        from: typeof FR.statementBlockFrom;
    };
    readonly if_: typeof F.ifStatement & {
        from: typeof FR.ifStatementFrom;
    };
    readonly switch_: typeof F.switchStatement & {
        from: typeof FR.switchStatementFrom;
    };
    readonly for_: typeof F.forStatement & {
        from: typeof FR.forStatementFrom;
    };
    readonly forIn: typeof F.forInStatement & {
        from: typeof FR.forInStatementFrom;
    };
    readonly while_: typeof F.whileStatement & {
        from: typeof FR.whileStatementFrom;
    };
    readonly do_: typeof F.doStatement & {
        from: typeof FR.doStatementFrom;
    };
    readonly try_: typeof F.tryStatement & {
        from: typeof FR.tryStatementFrom;
    };
    readonly with_: typeof F.withStatement & {
        from: typeof FR.withStatementFrom;
    };
    readonly break_: typeof F.breakStatement & {
        from: typeof FR.breakStatementFrom;
    };
    readonly continue_: typeof F.continueStatement & {
        from: typeof FR.continueStatementFrom;
    };
    readonly return_: typeof F.returnStatement & {
        from: typeof FR.returnStatementFrom;
    };
    readonly throw_: typeof F.throwStatement & {
        from: typeof FR.throwStatementFrom;
    };
    readonly labeled: typeof F.labeledStatement & {
        from: typeof FR.labeledStatementFrom;
    };
};
export declare const type: {
    readonly function_: typeof F.functionType & {
        from: typeof FR.functionTypeFrom;
    };
    readonly readonly: typeof F.readonlyType & {
        from: typeof FR.readonlyTypeFrom;
    };
    readonly constructor: typeof F.constructorType & {
        from: typeof FR.constructorTypeFrom;
    };
    readonly infer: typeof F.inferType & {
        from: typeof FR.inferTypeFrom;
    };
};
export declare const ir: {
    readonly abstractClass: typeof F.abstractClassDeclaration & {
        from: typeof FR.abstractClassDeclarationFrom;
    };
    readonly abstractMethodSignature: typeof F.abstractMethodSignature & {
        from: typeof FR.abstractMethodSignatureFrom;
    };
    readonly addingTypeAnnotation: typeof F.addingTypeAnnotation & {
        from: typeof FR.addingTypeAnnotationFrom;
    };
    readonly ambient: typeof F.ambientDeclaration & {
        from: typeof FR.ambientDeclarationFrom;
    };
    readonly arguments: typeof F.arguments_ & {
        from: typeof FR.arguments_From;
    };
    readonly array: typeof F.array & {
        from: typeof FR.arrayFrom;
    };
    readonly arrayPattern: typeof F.arrayPattern & {
        from: typeof FR.arrayPatternFrom;
    };
    readonly arrayType: typeof F.arrayType & {
        from: typeof FR.arrayTypeFrom;
    };
    readonly arrowFunctionParameter: typeof F.arrowFunctionParameter & {
        from: typeof FR.arrowFunctionParameterFrom;
    };
    readonly arrowFunctionCallSignature: typeof F.arrowFunctionUCallSignature & {
        from: typeof FR.arrowFunctionUCallSignatureFrom;
    };
    readonly arrowFunction: typeof F.arrowFunction & {
        from: typeof FR.arrowFunctionFrom;
        parameter: typeof F.arrowFunctionUFormParameter & {
            from: typeof FR.arrowFunctionUFormParameterFrom;
        };
        _call_signature: typeof F.arrowFunctionUFormUCallSignature & {
            from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
        };
    };
    readonly as: typeof F.asExpression & {
        from: typeof FR.asExpressionFrom;
    };
    readonly asserts: typeof F.asserts & {
        from: typeof FR.assertsFrom;
    };
    readonly assertsAnnotation: typeof F.assertsAnnotation & {
        from: typeof FR.assertsAnnotationFrom;
    };
    readonly assignment: typeof F.assignmentExpression & {
        from: typeof FR.assignmentExpressionFrom;
    };
    readonly assignmentPattern: typeof F.assignmentPattern & {
        from: typeof FR.assignmentPatternFrom;
    };
    readonly augmentedAssignment: typeof F.augmentedAssignmentExpression & {
        from: typeof FR.augmentedAssignmentExpressionFrom;
    };
    readonly awaitExpression: typeof F.awaitExpression & {
        from: typeof FR.awaitExpressionFrom;
    };
    readonly binary: typeof F.binaryExpression & {
        from: typeof FR.binaryExpressionFrom;
    };
    readonly breakStatement: typeof F.breakStatement & {
        from: typeof FR.breakStatementFrom;
    };
    readonly call: typeof F.callExpression & {
        from: typeof FR.callExpressionFrom;
        call: typeof F.callExpressionUFormCall & {
            from: typeof FR.callExpressionUFormCallFrom;
        };
        template_call: typeof F.callExpressionUFormTemplateCall & {
            from: typeof FR.callExpressionUFormTemplateCallFrom;
        };
        member: typeof F.callExpressionUFormMember & {
            from: typeof FR.callExpressionUFormMemberFrom;
        };
    };
    readonly callSignature: typeof F.callSignature & {
        from: typeof FR.callSignatureFrom;
    };
    readonly catchClause: typeof F.catchClause & {
        from: typeof FR.catchClauseFrom;
    };
    readonly class_: typeof F.class_ & {
        from: typeof FR.class_From;
    };
    readonly classBody: typeof F.classBody & {
        from: typeof FR.classBodyFrom;
    };
    readonly classDeclaration: typeof F.classDeclaration & {
        from: typeof FR.classDeclarationFrom;
    };
    readonly classHeritageExtendsClause: typeof F.classHeritageExtendsClause & {
        from: typeof FR.classHeritageExtendsClauseFrom;
    };
    readonly classHeritageImplementsClause: typeof F.classHeritageImplementsClause & {
        from: typeof FR.classHeritageImplementsClauseFrom;
    };
    readonly classHeritage: typeof F.classHeritage & {
        from: typeof FR.classHeritageFrom;
        extends_clause: typeof F.classHeritageUFormExtendsClause & {
            from: typeof FR.classHeritageUFormExtendsClauseFrom;
        };
        implements_clause: typeof F.classHeritageUFormImplementsClause & {
            from: typeof FR.classHeritageUFormImplementsClauseFrom;
        };
    };
    readonly classStaticBlock: typeof F.classStaticBlock & {
        from: typeof FR.classStaticBlockFrom;
    };
    readonly computedPropertyName: typeof F.computedPropertyName & {
        from: typeof FR.computedPropertyNameFrom;
    };
    readonly conditionalType: typeof F.conditionalType & {
        from: typeof FR.conditionalTypeFrom;
    };
    readonly constraint: typeof F.constraint & {
        from: typeof FR.constraintFrom;
    };
    readonly constructSignature: typeof F.constructSignature & {
        from: typeof FR.constructSignatureFrom;
    };
    readonly constructorType: typeof F.constructorType & {
        from: typeof FR.constructorTypeFrom;
    };
    readonly continueStatement: typeof F.continueStatement & {
        from: typeof FR.continueStatementFrom;
    };
    readonly debuggerStatement: typeof F.debuggerStatement & {
        from: typeof FR.debuggerStatementFrom;
    };
    readonly decorator: typeof F.decorator & {
        from: typeof FR.decoratorFrom;
    };
    readonly decoratorCall: typeof F.decoratorCallExpression & {
        from: typeof FR.decoratorCallExpressionFrom;
    };
    readonly decoratorMember: typeof F.decoratorMemberExpression & {
        from: typeof FR.decoratorMemberExpressionFrom;
    };
    readonly decoratorParenthesized: typeof F.decoratorParenthesizedExpression & {
        from: typeof FR.decoratorParenthesizedExpressionFrom;
    };
    readonly defaultType: typeof F.defaultType & {
        from: typeof FR.defaultTypeFrom;
    };
    readonly doStatement: typeof F.doStatement & {
        from: typeof FR.doStatementFrom;
    };
    readonly elseClause: typeof F.elseClause & {
        from: typeof FR.elseClauseFrom;
    };
    readonly enumAssignment: typeof F.enumAssignment & {
        from: typeof FR.enumAssignmentFrom;
    };
    readonly enumBody: typeof F.enumBody & {
        from: typeof FR.enumBodyFrom;
    };
    readonly enumDeclaration: typeof F.enumDeclaration & {
        from: typeof FR.enumDeclarationFrom;
    };
    readonly exportClause: typeof F.exportClause & {
        from: typeof FR.exportClauseFrom;
    };
    readonly exportSpecifier: typeof F.exportSpecifier & {
        from: typeof FR.exportSpecifierFrom;
    };
    readonly exportStatementTypeExport: typeof F.exportStatementTypeExport & {
        from: typeof FR.exportStatementTypeExportFrom;
    };
    readonly exportStatementEqualsExport: typeof F.exportStatementEqualsExport & {
        from: typeof FR.exportStatementEqualsExportFrom;
    };
    readonly exportStatementNamespaceExport: typeof F.exportStatementNamespaceExport & {
        from: typeof FR.exportStatementNamespaceExportFrom;
    };
    readonly exportStatement: typeof F.exportStatement & {
        from: typeof FR.exportStatementFrom;
        default: typeof F.exportStatementUFormDefault & {
            from: typeof FR.exportStatementUFormDefaultFrom;
        };
        type_export: typeof F.exportStatementUFormTypeExport & {
            from: typeof FR.exportStatementUFormTypeExportFrom;
        };
        equals_export: typeof F.exportStatementUFormEqualsExport & {
            from: typeof FR.exportStatementUFormEqualsExportFrom;
        };
        namespace_export: typeof F.exportStatementUFormNamespaceExport & {
            from: typeof FR.exportStatementUFormNamespaceExportFrom;
        };
    };
    readonly expressionStatement: typeof F.expressionStatement & {
        from: typeof FR.expressionStatementFrom;
    };
    readonly extendsClause: typeof F.extendsClause & {
        from: typeof FR.extendsClauseFrom;
    };
    readonly extendsTypeClause: typeof F.extendsTypeClause & {
        from: typeof FR.extendsTypeClauseFrom;
    };
    readonly finallyClause: typeof F.finallyClause & {
        from: typeof FR.finallyClauseFrom;
    };
    readonly flowMaybeType: typeof F.flowMaybeType & {
        from: typeof FR.flowMaybeTypeFrom;
    };
    readonly forIn: typeof F.forInStatement & {
        from: typeof FR.forInStatementFrom;
    };
    readonly forStatement: typeof F.forStatement & {
        from: typeof FR.forStatementFrom;
    };
    readonly formalParameters: typeof F.formalParameters & {
        from: typeof FR.formalParametersFrom;
    };
    readonly functionDeclaration: typeof F.functionDeclaration & {
        from: typeof FR.functionDeclarationFrom;
    };
    readonly functionExpression: typeof F.functionExpression & {
        from: typeof FR.functionExpressionFrom;
    };
    readonly functionSignature: typeof F.functionSignature & {
        from: typeof FR.functionSignatureFrom;
    };
    readonly functionType: typeof F.functionType & {
        from: typeof FR.functionTypeFrom;
    };
    readonly generatorFunction: typeof F.generatorFunction & {
        from: typeof FR.generatorFunctionFrom;
    };
    readonly generatorFunctionDeclaration: typeof F.generatorFunctionDeclaration & {
        from: typeof FR.generatorFunctionDeclarationFrom;
    };
    readonly genericType: typeof F.genericType & {
        from: typeof FR.genericTypeFrom;
    };
    readonly ifStatement: typeof F.ifStatement & {
        from: typeof FR.ifStatementFrom;
    };
    readonly implementsClause: typeof F.implementsClause & {
        from: typeof FR.implementsClauseFrom;
    };
    readonly importAlias: typeof F.importAlias & {
        from: typeof FR.importAliasFrom;
    };
    readonly importAttribute: typeof F.importAttribute & {
        from: typeof FR.importAttributeFrom;
    };
    readonly importClauseNamespaceImport: typeof F.importClauseNamespaceImport & {
        from: typeof FR.importClauseNamespaceImportFrom;
    };
    readonly importClauseNamedImports: typeof F.importClauseNamedImports & {
        from: typeof FR.importClauseNamedImportsFrom;
    };
    readonly importClauseDefaultImport: typeof F.importClauseDefaultImport & {
        from: typeof FR.importClauseDefaultImportFrom;
    };
    readonly importClause: typeof F.importClause & {
        from: typeof FR.importClauseFrom;
        namespace_import: typeof F.importClauseUFormNamespaceImport & {
            from: typeof FR.importClauseUFormNamespaceImportFrom;
        };
        named_imports: typeof F.importClauseUFormNamedImports & {
            from: typeof FR.importClauseUFormNamedImportsFrom;
        };
        default_import: typeof F.importClauseUFormDefaultImport & {
            from: typeof FR.importClauseUFormDefaultImportFrom;
        };
    };
    readonly importRequireClause: typeof F.importRequireClause & {
        from: typeof FR.importRequireClauseFrom;
    };
    readonly importSpecifierName: typeof F.importSpecifierName & {
        from: typeof FR.importSpecifierNameFrom;
    };
    readonly importSpecifier: typeof F.importSpecifier & {
        from: typeof FR.importSpecifierFrom;
        name: typeof F.importSpecifierUFormName & {
            from: typeof FR.importSpecifierUFormNameFrom;
        };
        as: typeof F.importSpecifierUFormAs & {
            from: typeof FR.importSpecifierUFormAsFrom;
        };
    };
    readonly importStatement: typeof F.importStatement & {
        from: typeof FR.importStatementFrom;
    };
    readonly indexSignatureMappedTypeClause: typeof F.indexSignatureMappedTypeClause & {
        from: typeof FR.indexSignatureMappedTypeClauseFrom;
    };
    readonly indexSignature: typeof F.indexSignature & {
        from: typeof FR.indexSignatureFrom;
        colon: typeof F.indexSignatureUFormColon & {
            from: typeof FR.indexSignatureUFormColonFrom;
        };
        mapped_type_clause: typeof F.indexSignatureUFormMappedTypeClause & {
            from: typeof FR.indexSignatureUFormMappedTypeClauseFrom;
        };
    };
    readonly indexTypeQuery: typeof F.indexTypeQuery & {
        from: typeof FR.indexTypeQueryFrom;
    };
    readonly inferType: typeof F.inferType & {
        from: typeof FR.inferTypeFrom;
    };
    readonly instantiation: typeof F.instantiationExpression & {
        from: typeof FR.instantiationExpressionFrom;
    };
    readonly interface: typeof F.interfaceDeclaration & {
        from: typeof FR.interfaceDeclarationFrom;
    };
    readonly internalModule: typeof F.internalModule & {
        from: typeof FR.internalModuleFrom;
    };
    readonly intersectionType: typeof F.intersectionType & {
        from: typeof FR.intersectionTypeFrom;
    };
    readonly labeled: typeof F.labeledStatement & {
        from: typeof FR.labeledStatementFrom;
    };
    readonly lexical: typeof F.lexicalDeclaration & {
        from: typeof FR.lexicalDeclarationFrom;
    };
    readonly literalType: typeof F.literalType & {
        from: typeof FR.literalTypeFrom;
    };
    readonly lookupType: typeof F.lookupType & {
        from: typeof FR.lookupTypeFrom;
    };
    readonly mappedTypeClause: typeof F.mappedTypeClause & {
        from: typeof FR.mappedTypeClauseFrom;
    };
    readonly member: typeof F.memberExpression & {
        from: typeof FR.memberExpressionFrom;
    };
    readonly method: typeof F.methodDefinition & {
        from: typeof FR.methodDefinitionFrom;
    };
    readonly methodSignature: typeof F.methodSignature & {
        from: typeof FR.methodSignatureFrom;
    };
    readonly module: typeof F.module & {
        from: typeof FR.moduleFrom;
    };
    readonly namedImports: typeof F.namedImports & {
        from: typeof FR.namedImportsFrom;
    };
    readonly namespaceExport: typeof F.namespaceExport & {
        from: typeof FR.namespaceExportFrom;
    };
    readonly namespaceImport: typeof F.namespaceImport & {
        from: typeof FR.namespaceImportFrom;
    };
    readonly nestedIdentifier: typeof F.nestedIdentifier & {
        from: typeof FR.nestedIdentifierFrom;
    };
    readonly nestedTypeIdentifier: typeof F.nestedTypeIdentifier & {
        from: typeof FR.nestedTypeIdentifierFrom;
    };
    readonly newExpression: typeof F.newExpression & {
        from: typeof FR.newExpressionFrom;
    };
    readonly nonNull: typeof F.nonNullExpression & {
        from: typeof FR.nonNullExpressionFrom;
    };
    readonly object: typeof F.object & {
        from: typeof FR.objectFrom;
    };
    readonly objectAssignmentPattern: typeof F.objectAssignmentPattern & {
        from: typeof FR.objectAssignmentPatternFrom;
    };
    readonly objectPattern: typeof F.objectPattern & {
        from: typeof FR.objectPatternFrom;
    };
    readonly objectType: typeof F.objectType & {
        from: typeof FR.objectTypeFrom;
        curly: typeof F.objectTypeCurly;
        flow: typeof F.objectTypeFlow;
    };
    readonly omittingTypeAnnotation: typeof F.omittingTypeAnnotation & {
        from: typeof FR.omittingTypeAnnotationFrom;
    };
    readonly optingTypeAnnotation: typeof F.optingTypeAnnotation & {
        from: typeof FR.optingTypeAnnotationFrom;
    };
    readonly optionalParameter: typeof F.optionalParameter & {
        from: typeof FR.optionalParameterFrom;
    };
    readonly optionalTupleParameter: typeof F.optionalTupleParameter & {
        from: typeof FR.optionalTupleParameterFrom;
    };
    readonly optionalType: typeof F.optionalType & {
        from: typeof FR.optionalTypeFrom;
    };
    readonly pair: typeof F.pair & {
        from: typeof FR.pairFrom;
    };
    readonly pairPattern: typeof F.pairPattern & {
        from: typeof FR.pairPatternFrom;
    };
    readonly parenthesizedExpressionSequence: typeof F.parenthesizedExpressionSequence & {
        from: typeof FR.parenthesizedExpressionSequenceFrom;
    };
    readonly parenthesized: typeof F.parenthesizedExpression & {
        from: typeof FR.parenthesizedExpressionFrom;
        typed: typeof F.parenthesizedExpressionUFormTyped & {
            from: typeof FR.parenthesizedExpressionUFormTypedFrom;
        };
        sequence: typeof F.parenthesizedExpressionUFormSequence & {
            from: typeof FR.parenthesizedExpressionUFormSequenceFrom;
        };
    };
    readonly parenthesizedType: typeof F.parenthesizedType & {
        from: typeof FR.parenthesizedTypeFrom;
    };
    readonly program: typeof F.program & {
        from: typeof FR.programFrom;
    };
    readonly propertySignature: typeof F.propertySignature & {
        from: typeof FR.propertySignatureFrom;
    };
    readonly publicField: typeof F.publicFieldDefinition & {
        from: typeof FR.publicFieldDefinitionFrom;
    };
    readonly readonlyType: typeof F.readonlyType & {
        from: typeof FR.readonlyTypeFrom;
    };
    readonly regex: typeof F.regex & {
        from: typeof FR.regexFrom;
    };
    readonly requiredParameter: typeof F.requiredParameter & {
        from: typeof FR.requiredParameterFrom;
    };
    readonly restPattern: typeof F.restPattern & {
        from: typeof FR.restPatternFrom;
    };
    readonly restType: typeof F.restType & {
        from: typeof FR.restTypeFrom;
    };
    readonly returnStatement: typeof F.returnStatement & {
        from: typeof FR.returnStatementFrom;
    };
    readonly satisfies: typeof F.satisfiesExpression & {
        from: typeof FR.satisfiesExpressionFrom;
    };
    readonly sequence: typeof F.sequenceExpression & {
        from: typeof FR.sequenceExpressionFrom;
    };
    readonly spreadElement: typeof F.spreadElement & {
        from: typeof FR.spreadElementFrom;
    };
    readonly statementBlock: typeof F.statementBlock & {
        from: typeof FR.statementBlockFrom;
    };
    readonly stringDouble: typeof F.stringDouble & {
        from: typeof FR.stringDoubleFrom;
    };
    readonly stringSingle: typeof F.stringSingle & {
        from: typeof FR.stringSingleFrom;
    };
    readonly string: typeof F.string & {
        from: typeof FR.stringFrom;
        double: typeof F.stringUFormDouble & {
            from: typeof FR.stringUFormDoubleFrom;
        };
        single: typeof F.stringUFormSingle & {
            from: typeof FR.stringUFormSingleFrom;
        };
    };
    readonly subscript: typeof F.subscriptExpression & {
        from: typeof FR.subscriptExpressionFrom;
    };
    readonly switchBody: typeof F.switchBody & {
        from: typeof FR.switchBodyFrom;
    };
    readonly switchCase: typeof F.switchCase & {
        from: typeof FR.switchCaseFrom;
    };
    readonly switchDefault: typeof F.switchDefault & {
        from: typeof FR.switchDefaultFrom;
    };
    readonly switchStatement: typeof F.switchStatement & {
        from: typeof FR.switchStatementFrom;
    };
    readonly templateLiteralType: typeof F.templateLiteralType & {
        from: typeof FR.templateLiteralTypeFrom;
    };
    readonly templateString: typeof F.templateString & {
        from: typeof FR.templateStringFrom;
    };
    readonly templateSubstitution: typeof F.templateSubstitution & {
        from: typeof FR.templateSubstitutionFrom;
    };
    readonly templateType: typeof F.templateType & {
        from: typeof FR.templateTypeFrom;
    };
    readonly ternary: typeof F.ternaryExpression & {
        from: typeof FR.ternaryExpressionFrom;
    };
    readonly throwStatement: typeof F.throwStatement & {
        from: typeof FR.throwStatementFrom;
    };
    readonly tryStatement: typeof F.tryStatement & {
        from: typeof FR.tryStatementFrom;
    };
    readonly tupleParameter: typeof F.tupleParameter & {
        from: typeof FR.tupleParameterFrom;
    };
    readonly tupleType: typeof F.tupleType & {
        from: typeof FR.tupleTypeFrom;
    };
    readonly typeAlias: typeof F.typeAliasDeclaration & {
        from: typeof FR.typeAliasDeclarationFrom;
    };
    readonly typeAnnotation: typeof F.typeAnnotation & {
        from: typeof FR.typeAnnotationFrom;
    };
    readonly typeArguments: typeof F.typeArguments & {
        from: typeof FR.typeArgumentsFrom;
    };
    readonly typeAssertion: typeof F.typeAssertion & {
        from: typeof FR.typeAssertionFrom;
    };
    readonly typeParameter: typeof F.typeParameter & {
        from: typeof FR.typeParameterFrom;
    };
    readonly typeParameters: typeof F.typeParameters & {
        from: typeof FR.typeParametersFrom;
    };
    readonly typePredicate: typeof F.typePredicate & {
        from: typeof FR.typePredicateFrom;
    };
    readonly typePredicateAnnotation: typeof F.typePredicateAnnotation & {
        from: typeof FR.typePredicateAnnotationFrom;
    };
    readonly typeQuery: typeof F.typeQuery & {
        from: typeof FR.typeQueryFrom;
    };
    readonly unary: typeof F.unaryExpression & {
        from: typeof FR.unaryExpressionFrom;
    };
    readonly unionType: typeof F.unionType & {
        from: typeof FR.unionTypeFrom;
    };
    readonly update: typeof F.updateExpression & {
        from: typeof FR.updateExpressionFrom;
        postfix: typeof F.updateExpressionUFormPostfix & {
            from: typeof FR.updateExpressionUFormPostfixFrom;
        };
        prefix: typeof F.updateExpressionUFormPrefix & {
            from: typeof FR.updateExpressionUFormPrefixFrom;
        };
    };
    readonly variable: typeof F.variableDeclaration & {
        from: typeof FR.variableDeclarationFrom;
    };
    readonly variableDeclarator: typeof F.variableDeclarator & {
        from: typeof FR.variableDeclaratorFrom;
    };
    readonly whileStatement: typeof F.whileStatement & {
        from: typeof FR.whileStatementFrom;
    };
    readonly withStatement: typeof F.withStatement & {
        from: typeof FR.withStatementFrom;
    };
    readonly yieldExpression: typeof F.yieldExpression & {
        from: typeof FR.yieldExpressionFrom;
    };
    readonly false_: typeof F.false_;
    readonly import_: typeof F.import_;
    readonly null_: typeof F.null_;
    readonly overrideModifier: typeof F.overrideModifier;
    readonly super: typeof F.super_;
    readonly this: typeof F.this_;
    readonly true_: typeof F.true_;
    readonly undefined: typeof F.undefined_;
    readonly accessibilityModifier: typeof F.accessibilityModifier;
    readonly comment: typeof F.comment;
    readonly escapeSequence: typeof F.escapeSequence;
    readonly hashBangLine: typeof F.hashBangLine;
    readonly identifier2: typeof F.identifier;
    readonly metaProperty: typeof F.metaProperty;
    readonly number: typeof F.number;
    readonly predefinedType: typeof F.predefinedType;
    readonly privatePropertyIdentifier: typeof F.privatePropertyIdentifier;
    readonly regexFlags: typeof F.regexFlags;
    readonly regexPattern: typeof F.regexPattern;
    readonly unescapedDoubleStringFragment: typeof F.unescapedDoubleStringFragment;
    readonly unescapedSingleStringFragment: typeof F.unescapedSingleStringFragment;
    readonly htmlComment: typeof F.htmlComment;
    readonly jsxText: typeof F.jsxText;
    readonly destructuringPattern: {
        readonly object: typeof F.objectPattern & {
            from: typeof FR.objectPatternFrom;
        };
        readonly array: typeof F.arrayPattern & {
            from: typeof FR.arrayPatternFrom;
        };
    };
    readonly expressions: {
        readonly sequence: typeof F.sequenceExpression & {
            from: typeof FR.sequenceExpressionFrom;
        };
    };
    readonly formalParameter: {
        readonly required: typeof F.requiredParameter & {
            from: typeof FR.requiredParameterFrom;
        };
        readonly optional: typeof F.optionalParameter & {
            from: typeof FR.optionalParameterFrom;
        };
    };
    readonly identifier: {
        readonly undefined: typeof F.undefined_;
        readonly identifier: typeof F.identifier;
    };
    readonly importIdentifier: {
        readonly identifier: typeof F.identifier;
    };
    readonly jsxAttributeName: {
        readonly identifier: typeof F.identifier;
    };
    readonly jsxChild: {
        readonly jsx: typeof F.jsxText;
    };
    readonly jsxElementName: {
        readonly identifier: typeof F.identifier;
        readonly nested: typeof F.nestedIdentifier & {
            from: typeof FR.nestedIdentifierFrom;
        };
    };
    readonly jsxIdentifier: {
        readonly identifier: typeof F.identifier;
    };
    readonly moduleExportName: {
        readonly identifier: typeof F.identifier;
        readonly string: typeof F.string & {
            from: typeof FR.stringFrom;
            double: typeof F.stringUFormDouble & {
                from: typeof FR.stringUFormDoubleFrom;
            };
            single: typeof F.stringUFormSingle & {
                from: typeof FR.stringUFormSingleFrom;
            };
        };
    };
    readonly propertyIdentifier: {
        readonly identifier: typeof F.identifier;
    };
    readonly propertyName: {
        readonly identifier: typeof F.identifier;
        readonly privateProperty: typeof F.privatePropertyIdentifier;
        readonly string: typeof F.string & {
            from: typeof FR.stringFrom;
            double: typeof F.stringUFormDouble & {
                from: typeof FR.stringUFormDoubleFrom;
            };
            single: typeof F.stringUFormSingle & {
                from: typeof FR.stringUFormSingleFrom;
            };
        };
        readonly number: typeof F.number;
        readonly computedProperty: typeof F.computedPropertyName & {
            from: typeof FR.computedPropertyNameFrom;
        };
    };
    readonly shorthandPropertyIdentifier: {
        readonly identifier: typeof F.identifier;
    };
    readonly shorthandPropertyIdentifierPattern: {
        readonly identifier: typeof F.identifier;
    };
    readonly statementIdentifier: {
        readonly identifier: typeof F.identifier;
    };
    readonly tupleTypeMember: {
        readonly tuple: typeof F.tupleParameter & {
            from: typeof FR.tupleParameterFrom;
        };
        readonly optionalTuple: typeof F.optionalTupleParameter & {
            from: typeof FR.optionalTupleParameterFrom;
        };
        readonly optional: typeof F.optionalType & {
            from: typeof FR.optionalTypeFrom;
        };
        readonly rest: typeof F.restType & {
            from: typeof FR.restTypeFrom;
        };
    };
    readonly declaration: {
        readonly function_: typeof F.functionSignature & {
            from: typeof FR.functionSignatureFrom;
        };
        readonly abstractClass: typeof F.abstractClassDeclaration & {
            from: typeof FR.abstractClassDeclarationFrom;
        };
        readonly module: typeof F.module & {
            from: typeof FR.moduleFrom;
        };
        readonly internal: typeof F.internalModule & {
            from: typeof FR.internalModuleFrom;
        };
        readonly typeAlias: typeof F.typeAliasDeclaration & {
            from: typeof FR.typeAliasDeclarationFrom;
        };
        readonly enum_: typeof F.enumDeclaration & {
            from: typeof FR.enumDeclarationFrom;
        };
        readonly interface_: typeof F.interfaceDeclaration & {
            from: typeof FR.interfaceDeclarationFrom;
        };
        readonly import_: typeof F.importAlias & {
            from: typeof FR.importAliasFrom;
        };
        readonly ambient: typeof F.ambientDeclaration & {
            from: typeof FR.ambientDeclarationFrom;
        };
    };
    readonly expression: {
        readonly as: typeof F.asExpression & {
            from: typeof FR.asExpressionFrom;
        };
        readonly satisfies: typeof F.satisfiesExpression & {
            from: typeof FR.satisfiesExpressionFrom;
        };
        readonly instantiation: typeof F.instantiationExpression & {
            from: typeof FR.instantiationExpressionFrom;
        };
        readonly internal: typeof F.internalModule & {
            from: typeof FR.internalModuleFrom;
        };
        readonly type: typeof F.typeAssertion & {
            from: typeof FR.typeAssertionFrom;
        };
        readonly assignment: typeof F.assignmentExpression & {
            from: typeof FR.assignmentExpressionFrom;
        };
        readonly augmentedAssignment: typeof F.augmentedAssignmentExpression & {
            from: typeof FR.augmentedAssignmentExpressionFrom;
        };
        readonly await: typeof F.awaitExpression & {
            from: typeof FR.awaitExpressionFrom;
        };
        readonly unary: typeof F.unaryExpression & {
            from: typeof FR.unaryExpressionFrom;
        };
        readonly binary: typeof F.binaryExpression & {
            from: typeof FR.binaryExpressionFrom;
        };
        readonly ternary: typeof F.ternaryExpression & {
            from: typeof FR.ternaryExpressionFrom;
        };
        readonly update: typeof F.updateExpression & {
            from: typeof FR.updateExpressionFrom;
            postfix: typeof F.updateExpressionUFormPostfix & {
                from: typeof FR.updateExpressionUFormPostfixFrom;
            };
            prefix: typeof F.updateExpressionUFormPrefix & {
                from: typeof FR.updateExpressionUFormPrefixFrom;
            };
        };
        readonly new_: typeof F.newExpression & {
            from: typeof FR.newExpressionFrom;
        };
        readonly yield_: typeof F.yieldExpression & {
            from: typeof FR.yieldExpressionFrom;
        };
    };
    readonly pattern: {
        readonly member: typeof F.memberExpression & {
            from: typeof FR.memberExpressionFrom;
        };
        readonly subscript: typeof F.subscriptExpression & {
            from: typeof FR.subscriptExpressionFrom;
        };
        readonly undefined: typeof F.undefined_;
        readonly identifier: typeof F.identifier;
        readonly object: typeof F.objectPattern & {
            from: typeof FR.objectPatternFrom;
        };
        readonly array: typeof F.arrayPattern & {
            from: typeof FR.arrayPatternFrom;
        };
        readonly nonNull: typeof F.nonNullExpression & {
            from: typeof FR.nonNullExpressionFrom;
        };
        readonly rest: typeof F.restPattern & {
            from: typeof FR.restPatternFrom;
        };
    };
    readonly primaryExpression: {
        readonly nonNull: typeof F.nonNullExpression & {
            from: typeof FR.nonNullExpressionFrom;
        };
    };
    readonly primaryType: {
        readonly parenthesized: typeof F.parenthesizedType & {
            from: typeof FR.parenthesizedTypeFrom;
        };
        readonly predefined: typeof F.predefinedType;
        readonly identifier: typeof F.identifier;
        readonly nestedType: typeof F.nestedTypeIdentifier & {
            from: typeof FR.nestedTypeIdentifierFrom;
        };
        readonly generic: typeof F.genericType & {
            from: typeof FR.genericTypeFrom;
        };
        readonly object: typeof F.objectType & {
            from: typeof FR.objectTypeFrom;
        };
        readonly array: typeof F.arrayType & {
            from: typeof FR.arrayTypeFrom;
        };
        readonly tuple: typeof F.tupleType & {
            from: typeof FR.tupleTypeFrom;
        };
        readonly flowMaybe: typeof F.flowMaybeType & {
            from: typeof FR.flowMaybeTypeFrom;
        };
        readonly type: typeof F.typeQuery & {
            from: typeof FR.typeQueryFrom;
        };
        readonly indexType: typeof F.indexTypeQuery & {
            from: typeof FR.indexTypeQueryFrom;
        };
        readonly this_: typeof F.this_;
        readonly literal: typeof F.literalType & {
            from: typeof FR.literalTypeFrom;
        };
        readonly lookup: typeof F.lookupType & {
            from: typeof FR.lookupTypeFrom;
        };
        readonly conditional: typeof F.conditionalType & {
            from: typeof FR.conditionalTypeFrom;
        };
        readonly templateLiteral: typeof F.templateLiteralType & {
            from: typeof FR.templateLiteralTypeFrom;
        };
        readonly intersection: typeof F.intersectionType & {
            from: typeof FR.intersectionTypeFrom;
        };
        readonly union: typeof F.unionType & {
            from: typeof FR.unionTypeFrom;
        };
    };
    readonly statement: {
        readonly export_: typeof F.exportStatement & {
            from: typeof FR.exportStatementFrom;
            default: typeof F.exportStatementUFormDefault & {
                from: typeof FR.exportStatementUFormDefaultFrom;
            };
            type_export: typeof F.exportStatementUFormTypeExport & {
                from: typeof FR.exportStatementUFormTypeExportFrom;
            };
            equals_export: typeof F.exportStatementUFormEqualsExport & {
                from: typeof FR.exportStatementUFormEqualsExportFrom;
            };
            namespace_export: typeof F.exportStatementUFormNamespaceExport & {
                from: typeof FR.exportStatementUFormNamespaceExportFrom;
            };
        };
        readonly import_: typeof F.importStatement & {
            from: typeof FR.importStatementFrom;
        };
        readonly debugger_: typeof F.debuggerStatement & {
            from: typeof FR.debuggerStatementFrom;
        };
        readonly expression: typeof F.expressionStatement & {
            from: typeof FR.expressionStatementFrom;
        };
        readonly statementBlock: typeof F.statementBlock & {
            from: typeof FR.statementBlockFrom;
        };
        readonly if_: typeof F.ifStatement & {
            from: typeof FR.ifStatementFrom;
        };
        readonly switch_: typeof F.switchStatement & {
            from: typeof FR.switchStatementFrom;
        };
        readonly for_: typeof F.forStatement & {
            from: typeof FR.forStatementFrom;
        };
        readonly forIn: typeof F.forInStatement & {
            from: typeof FR.forInStatementFrom;
        };
        readonly while_: typeof F.whileStatement & {
            from: typeof FR.whileStatementFrom;
        };
        readonly do_: typeof F.doStatement & {
            from: typeof FR.doStatementFrom;
        };
        readonly try_: typeof F.tryStatement & {
            from: typeof FR.tryStatementFrom;
        };
        readonly with_: typeof F.withStatement & {
            from: typeof FR.withStatementFrom;
        };
        readonly break_: typeof F.breakStatement & {
            from: typeof FR.breakStatementFrom;
        };
        readonly continue_: typeof F.continueStatement & {
            from: typeof FR.continueStatementFrom;
        };
        readonly return_: typeof F.returnStatement & {
            from: typeof FR.returnStatementFrom;
        };
        readonly throw_: typeof F.throwStatement & {
            from: typeof FR.throwStatementFrom;
        };
        readonly labeled: typeof F.labeledStatement & {
            from: typeof FR.labeledStatementFrom;
        };
    };
    readonly type: {
        readonly function_: typeof F.functionType & {
            from: typeof FR.functionTypeFrom;
        };
        readonly readonly: typeof F.readonlyType & {
            from: typeof FR.readonlyTypeFrom;
        };
        readonly constructor: typeof F.constructorType & {
            from: typeof FR.constructorTypeFrom;
        };
        readonly infer: typeof F.inferType & {
            from: typeof FR.inferTypeFrom;
        };
    };
};
export declare namespace from {
    function boolean(value: boolean): ReturnType<typeof F.true_> | ReturnType<typeof F.false_>;
    function number(value: number): ReturnType<typeof F.number>;
    function comment(text: string): ReturnType<typeof F.comment>;
    function type(name: string): ReturnType<typeof F.typeIdentifier>;
    function identifier(name: string): ReturnType<typeof F.identifier>;
}
//# sourceMappingURL=ir.d.ts.map