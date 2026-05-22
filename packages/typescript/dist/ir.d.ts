import * as F from './factories.js';
import * as FR from './from.js';
export declare const destructuringPattern: {
    readonly object: typeof FR.objectPatternFrom & {
        from: typeof FR.objectPatternFrom;
        strict: typeof F.objectPattern;
    };
    readonly array: typeof FR.arrayPatternFrom & {
        from: typeof FR.arrayPatternFrom;
        strict: typeof F.arrayPattern;
    };
};
export declare const expressions: {
    readonly sequence: typeof FR.sequenceExpressionFrom & {
        from: typeof FR.sequenceExpressionFrom;
        strict: typeof F.sequenceExpression;
    };
};
export declare const formalParameter: {
    readonly required: typeof FR.requiredParameterFrom & {
        from: typeof FR.requiredParameterFrom;
        strict: typeof F.requiredParameter;
    };
    readonly optional: typeof FR.optionalParameterFrom & {
        from: typeof FR.optionalParameterFrom;
        strict: typeof F.optionalParameter;
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
    readonly nested: typeof FR.nestedIdentifierFrom & {
        from: typeof FR.nestedIdentifierFrom;
        strict: typeof F.nestedIdentifier;
    };
};
export declare const jsxIdentifier: {
    readonly identifier: typeof F.identifier;
};
export declare const moduleExportName: {
    readonly identifier: typeof F.identifier;
    readonly string: typeof FR.stringFrom & {
        from: typeof FR.stringFrom;
        strict: typeof F.string;
    };
};
export declare const propertyIdentifier: {
    readonly identifier: typeof F.identifier;
};
export declare const propertyName: {
    readonly identifier: typeof F.identifier;
    readonly privateProperty: typeof F.privatePropertyIdentifier;
    readonly string: typeof FR.stringFrom & {
        from: typeof FR.stringFrom;
        strict: typeof F.string;
    };
    readonly number: typeof F.number;
    readonly computedProperty: typeof FR.computedPropertyNameFrom & {
        from: typeof FR.computedPropertyNameFrom;
        strict: typeof F.computedPropertyName;
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
    readonly tuple: typeof FR.tupleParameterFrom & {
        from: typeof FR.tupleParameterFrom;
        strict: typeof F.tupleParameter;
    };
    readonly optionalTuple: typeof FR.optionalTupleParameterFrom & {
        from: typeof FR.optionalTupleParameterFrom;
        strict: typeof F.optionalTupleParameter;
    };
    readonly optional: typeof FR.optionalTypeFrom & {
        from: typeof FR.optionalTypeFrom;
        strict: typeof F.optionalType;
    };
    readonly rest: typeof FR.restTypeFrom & {
        from: typeof FR.restTypeFrom;
        strict: typeof F.restType;
    };
};
export declare const declaration: {
    readonly function: typeof FR.functionDeclarationFrom & {
        from: typeof FR.functionDeclarationFrom;
        strict: typeof F.functionDeclaration;
    };
    readonly generatorFunction: typeof FR.generatorFunctionDeclarationFrom & {
        from: typeof FR.generatorFunctionDeclarationFrom;
        strict: typeof F.generatorFunctionDeclaration;
    };
    readonly class: typeof FR.classDeclarationFrom & {
        from: typeof FR.classDeclarationFrom;
        strict: typeof F.classDeclaration;
    };
    readonly lexical: typeof FR.lexicalDeclarationFrom & {
        from: typeof FR.lexicalDeclarationFrom;
        strict: typeof F.lexicalDeclaration;
    };
    readonly variable: typeof FR.variableDeclarationFrom & {
        from: typeof FR.variableDeclarationFrom;
        strict: typeof F.variableDeclaration;
    };
    readonly abstractClass: typeof FR.abstractClassDeclarationFrom & {
        from: typeof FR.abstractClassDeclarationFrom;
        strict: typeof F.abstractClassDeclaration;
    };
    readonly module: typeof FR.moduleFrom & {
        from: typeof FR.moduleFrom;
        strict: typeof F.module;
    };
    readonly internal: typeof FR.internalModuleFrom & {
        from: typeof FR.internalModuleFrom;
        strict: typeof F.internalModule;
    };
    readonly typeAlias: typeof FR.typeAliasDeclarationFrom & {
        from: typeof FR.typeAliasDeclarationFrom;
        strict: typeof F.typeAliasDeclaration;
    };
    readonly enum: typeof FR.enumDeclarationFrom & {
        from: typeof FR.enumDeclarationFrom;
        strict: typeof F.enumDeclaration;
    };
    readonly interface: typeof FR.interfaceDeclarationFrom & {
        from: typeof FR.interfaceDeclarationFrom;
        strict: typeof F.interfaceDeclaration;
    };
    readonly import: typeof FR.importAliasFrom & {
        from: typeof FR.importAliasFrom;
        strict: typeof F.importAlias;
    };
    readonly ambient: typeof FR.ambientDeclarationFrom & {
        from: typeof FR.ambientDeclarationFrom;
        strict: typeof F.ambientDeclaration;
        declaration: typeof FR.ambientDeclarationUFormDeclarationFrom & {
            from: typeof FR.ambientDeclarationUFormDeclarationFrom;
            strict: typeof F.ambientDeclarationUFormDeclaration;
        };
        global: typeof FR.ambientDeclarationUFormGlobalFrom & {
            from: typeof FR.ambientDeclarationUFormGlobalFrom;
            strict: typeof F.ambientDeclarationUFormGlobal;
        };
        module: typeof FR.ambientDeclarationUFormModuleFrom & {
            from: typeof FR.ambientDeclarationUFormModuleFrom;
            strict: typeof F.ambientDeclarationUFormModule;
        };
    };
};
export declare const expression: {
    readonly as: typeof FR.asExpressionFrom & {
        from: typeof FR.asExpressionFrom;
        strict: typeof F.asExpression;
    };
    readonly satisfies: typeof FR.satisfiesExpressionFrom & {
        from: typeof FR.satisfiesExpressionFrom;
        strict: typeof F.satisfiesExpression;
    };
    readonly instantiation: typeof FR.instantiationExpressionFrom & {
        from: typeof FR.instantiationExpressionFrom;
        strict: typeof F.instantiationExpression;
    };
    readonly internal: typeof FR.internalModuleFrom & {
        from: typeof FR.internalModuleFrom;
        strict: typeof F.internalModule;
    };
    readonly type: typeof FR.typeAssertionFrom & {
        from: typeof FR.typeAssertionFrom;
        strict: typeof F.typeAssertion;
    };
    readonly assignment: typeof FR.assignmentExpressionFrom & {
        from: typeof FR.assignmentExpressionFrom;
        strict: typeof F.assignmentExpression;
    };
    readonly augmentedAssignment: typeof FR.augmentedAssignmentExpressionFrom & {
        from: typeof FR.augmentedAssignmentExpressionFrom;
        strict: typeof F.augmentedAssignmentExpression;
    };
    readonly await: typeof FR.awaitExpressionFrom & {
        from: typeof FR.awaitExpressionFrom;
        strict: typeof F.awaitExpression;
    };
    readonly unary: typeof FR.unaryExpressionFrom & {
        from: typeof FR.unaryExpressionFrom;
        strict: typeof F.unaryExpression;
    };
    readonly binary: typeof FR.binaryExpressionFrom & {
        from: typeof FR.binaryExpressionFrom;
        strict: typeof F.binaryExpression;
    };
    readonly ternary: typeof FR.ternaryExpressionFrom & {
        from: typeof FR.ternaryExpressionFrom;
        strict: typeof F.ternaryExpression;
    };
    readonly update: typeof FR.updateExpressionFrom & {
        from: typeof FR.updateExpressionFrom;
        strict: typeof F.updateExpression;
        postfix: typeof FR.updateExpressionUFormPostfixFrom & {
            from: typeof FR.updateExpressionUFormPostfixFrom;
            strict: typeof F.updateExpressionUFormPostfix;
        };
        prefix: typeof FR.updateExpressionUFormPrefixFrom & {
            from: typeof FR.updateExpressionUFormPrefixFrom;
            strict: typeof F.updateExpressionUFormPrefix;
        };
    };
    readonly "new": typeof FR.newExpressionFrom & {
        from: typeof FR.newExpressionFrom;
        strict: typeof F.newExpression;
    };
    readonly yield: typeof FR.yieldExpressionFrom & {
        from: typeof FR.yieldExpressionFrom;
        strict: typeof F.yieldExpression;
    };
};
export declare const pattern: {
    readonly member: typeof FR.memberExpressionFrom & {
        from: typeof FR.memberExpressionFrom;
        strict: typeof F.memberExpression;
    };
    readonly subscript: typeof FR.subscriptExpressionFrom & {
        from: typeof FR.subscriptExpressionFrom;
        strict: typeof F.subscriptExpression;
    };
    readonly undefined: typeof F.undefined_;
    readonly identifier: typeof F.identifier;
    readonly object: typeof FR.objectPatternFrom & {
        from: typeof FR.objectPatternFrom;
        strict: typeof F.objectPattern;
    };
    readonly array: typeof FR.arrayPatternFrom & {
        from: typeof FR.arrayPatternFrom;
        strict: typeof F.arrayPattern;
    };
    readonly nonNull: typeof FR.nonNullExpressionFrom & {
        from: typeof FR.nonNullExpressionFrom;
        strict: typeof F.nonNullExpression;
    };
    readonly rest: typeof FR.restPatternFrom & {
        from: typeof FR.restPatternFrom;
        strict: typeof F.restPattern;
    };
};
export declare const primaryExpression: {
    readonly subscript: typeof FR.subscriptExpressionFrom & {
        from: typeof FR.subscriptExpressionFrom;
        strict: typeof F.subscriptExpression;
    };
    readonly member: typeof FR.memberExpressionFrom & {
        from: typeof FR.memberExpressionFrom;
        strict: typeof F.memberExpression;
    };
    readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
        typed: typeof FR.parenthesizedExpressionUFormTypedFrom & {
            from: typeof FR.parenthesizedExpressionUFormTypedFrom;
            strict: typeof F.parenthesizedExpressionUFormTyped;
        };
        sequence: typeof FR.parenthesizedExpressionUFormSequenceFrom & {
            from: typeof FR.parenthesizedExpressionUFormSequenceFrom;
            strict: typeof F.parenthesizedExpressionUFormSequence;
        };
    };
    readonly undefined: typeof F.undefined_;
    readonly identifier: typeof F.identifier;
    readonly this: typeof F.this_;
    readonly super: typeof F.super_;
    readonly number: typeof F.number;
    readonly string: typeof FR.stringFrom & {
        from: typeof FR.stringFrom;
        strict: typeof F.string;
    };
    readonly template: typeof FR.templateStringFrom & {
        from: typeof FR.templateStringFrom;
        strict: typeof F.templateString;
    };
    readonly regex: typeof FR.regexFrom & {
        from: typeof FR.regexFrom;
        strict: typeof F.regex;
    };
    readonly true: typeof F.true_;
    readonly false: typeof F.false_;
    readonly null: typeof F.null_;
    readonly object: typeof FR.objectFrom & {
        from: typeof FR.objectFrom;
        strict: typeof F.object;
    };
    readonly array: typeof FR.arrayFrom & {
        from: typeof FR.arrayFrom;
        strict: typeof F.array;
    };
    readonly function: typeof FR.functionExpressionFrom & {
        from: typeof FR.functionExpressionFrom;
        strict: typeof F.functionExpression;
    };
    readonly arrow: typeof FR.arrowFunctionFrom & {
        from: typeof FR.arrowFunctionFrom;
        strict: typeof F.arrowFunction;
        parameter: typeof FR.arrowFunctionUFormParameterFrom & {
            from: typeof FR.arrowFunctionUFormParameterFrom;
            strict: typeof F.arrowFunctionUFormParameter;
        };
        callSignature: typeof FR.arrowFunctionUFormUCallSignatureFrom & {
            from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
            strict: typeof F.arrowFunctionUFormUCallSignature;
        };
        _call_signature: typeof FR.arrowFunctionUFormUCallSignatureFrom & {
            from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
            strict: typeof F.arrowFunctionUFormUCallSignature;
        };
    };
    readonly generator: typeof FR.generatorFunctionFrom & {
        from: typeof FR.generatorFunctionFrom;
        strict: typeof F.generatorFunction;
    };
    readonly class: typeof FR.class_From & {
        from: typeof FR.class_From;
        strict: typeof F.class_;
    };
    readonly meta: typeof F.metaProperty;
    readonly call: typeof FR.callExpressionFrom & {
        from: typeof FR.callExpressionFrom;
        strict: typeof F.callExpression;
        call: typeof FR.callExpressionUFormCallFrom & {
            from: typeof FR.callExpressionUFormCallFrom;
            strict: typeof F.callExpressionUFormCall;
        };
        templateCall: typeof FR.callExpressionUFormTemplateCallFrom & {
            from: typeof FR.callExpressionUFormTemplateCallFrom;
            strict: typeof F.callExpressionUFormTemplateCall;
        };
        template_call: typeof FR.callExpressionUFormTemplateCallFrom & {
            from: typeof FR.callExpressionUFormTemplateCallFrom;
            strict: typeof F.callExpressionUFormTemplateCall;
        };
        member: typeof FR.callExpressionUFormMemberFrom & {
            from: typeof FR.callExpressionUFormMemberFrom;
            strict: typeof F.callExpressionUFormMember;
        };
    };
    readonly nonNull: typeof FR.nonNullExpressionFrom & {
        from: typeof FR.nonNullExpressionFrom;
        strict: typeof F.nonNullExpression;
    };
};
export declare const primaryType: {
    readonly parenthesized: typeof FR.parenthesizedTypeFrom & {
        from: typeof FR.parenthesizedTypeFrom;
        strict: typeof F.parenthesizedType;
    };
    readonly predefined: typeof F.predefinedType;
    readonly nestedType: typeof FR.nestedTypeIdentifierFrom & {
        from: typeof FR.nestedTypeIdentifierFrom;
        strict: typeof F.nestedTypeIdentifier;
    };
    readonly generic: typeof FR.genericTypeFrom & {
        from: typeof FR.genericTypeFrom;
        strict: typeof F.genericType;
    };
    readonly object: typeof FR.objectTypeFrom & {
        from: typeof FR.objectTypeFrom;
        strict: typeof F.objectType;
    };
    readonly array: typeof FR.arrayTypeFrom & {
        from: typeof FR.arrayTypeFrom;
        strict: typeof F.arrayType;
    };
    readonly tuple: typeof FR.tupleTypeFrom & {
        from: typeof FR.tupleTypeFrom;
        strict: typeof F.tupleType;
    };
    readonly flowMaybe: typeof FR.flowMaybeTypeFrom & {
        from: typeof FR.flowMaybeTypeFrom;
        strict: typeof F.flowMaybeType;
    };
    readonly type: typeof FR.typeQueryFrom & {
        from: typeof FR.typeQueryFrom;
        strict: typeof F.typeQuery;
    };
    readonly indexType: typeof FR.indexTypeQueryFrom & {
        from: typeof FR.indexTypeQueryFrom;
        strict: typeof F.indexTypeQuery;
    };
    readonly this: typeof F.this_;
    readonly literal: typeof FR.literalTypeFrom & {
        from: typeof FR.literalTypeFrom;
        strict: typeof F.literalType;
    };
    readonly lookup: typeof FR.lookupTypeFrom & {
        from: typeof FR.lookupTypeFrom;
        strict: typeof F.lookupType;
    };
    readonly conditional: typeof FR.conditionalTypeFrom & {
        from: typeof FR.conditionalTypeFrom;
        strict: typeof F.conditionalType;
    };
    readonly templateLiteral: typeof FR.templateLiteralTypeFrom & {
        from: typeof FR.templateLiteralTypeFrom;
        strict: typeof F.templateLiteralType;
    };
    readonly intersection: typeof FR.intersectionTypeFrom & {
        from: typeof FR.intersectionTypeFrom;
        strict: typeof F.intersectionType;
    };
    readonly union: typeof FR.unionTypeFrom & {
        from: typeof FR.unionTypeFrom;
        strict: typeof F.unionType;
    };
};
export declare const statement: {
    readonly export: typeof FR.exportStatementFrom & {
        from: typeof FR.exportStatementFrom;
        strict: typeof F.exportStatement;
        default: typeof FR.exportStatementUFormDefaultFrom & {
            from: typeof FR.exportStatementUFormDefaultFrom;
            strict: typeof F.exportStatementUFormDefault;
        };
        typeExport: typeof FR.exportStatementUFormTypeExportFrom & {
            from: typeof FR.exportStatementUFormTypeExportFrom;
            strict: typeof F.exportStatementUFormTypeExport;
        };
        type_export: typeof FR.exportStatementUFormTypeExportFrom & {
            from: typeof FR.exportStatementUFormTypeExportFrom;
            strict: typeof F.exportStatementUFormTypeExport;
        };
        equalsExport: typeof FR.exportStatementUFormEqualsExportFrom & {
            from: typeof FR.exportStatementUFormEqualsExportFrom;
            strict: typeof F.exportStatementUFormEqualsExport;
        };
        equals_export: typeof FR.exportStatementUFormEqualsExportFrom & {
            from: typeof FR.exportStatementUFormEqualsExportFrom;
            strict: typeof F.exportStatementUFormEqualsExport;
        };
        namespaceExport: typeof FR.exportStatementUFormNamespaceExportFrom & {
            from: typeof FR.exportStatementUFormNamespaceExportFrom;
            strict: typeof F.exportStatementUFormNamespaceExport;
        };
        namespace_export: typeof FR.exportStatementUFormNamespaceExportFrom & {
            from: typeof FR.exportStatementUFormNamespaceExportFrom;
            strict: typeof F.exportStatementUFormNamespaceExport;
        };
    };
    readonly import: typeof FR.importStatementFrom & {
        from: typeof FR.importStatementFrom;
        strict: typeof F.importStatement;
    };
    readonly debugger: typeof FR.debuggerStatementFrom & {
        from: typeof FR.debuggerStatementFrom;
        strict: typeof F.debuggerStatement;
    };
    readonly expression: typeof FR.expressionStatementFrom & {
        from: typeof FR.expressionStatementFrom;
        strict: typeof F.expressionStatement;
    };
    readonly statementBlock: typeof FR.statementBlockFrom & {
        from: typeof FR.statementBlockFrom;
        strict: typeof F.statementBlock;
    };
    readonly if: typeof FR.ifStatementFrom & {
        from: typeof FR.ifStatementFrom;
        strict: typeof F.ifStatement;
    };
    readonly switch: typeof FR.switchStatementFrom & {
        from: typeof FR.switchStatementFrom;
        strict: typeof F.switchStatement;
    };
    readonly for: typeof FR.forStatementFrom & {
        from: typeof FR.forStatementFrom;
        strict: typeof F.forStatement;
    };
    readonly forIn: typeof FR.forInStatementFrom & {
        from: typeof FR.forInStatementFrom;
        strict: typeof F.forInStatement;
    };
    readonly while: typeof FR.whileStatementFrom & {
        from: typeof FR.whileStatementFrom;
        strict: typeof F.whileStatement;
    };
    readonly do: typeof FR.doStatementFrom & {
        from: typeof FR.doStatementFrom;
        strict: typeof F.doStatement;
    };
    readonly try: typeof FR.tryStatementFrom & {
        from: typeof FR.tryStatementFrom;
        strict: typeof F.tryStatement;
    };
    readonly with: typeof FR.withStatementFrom & {
        from: typeof FR.withStatementFrom;
        strict: typeof F.withStatement;
    };
    readonly break: typeof FR.breakStatementFrom & {
        from: typeof FR.breakStatementFrom;
        strict: typeof F.breakStatement;
    };
    readonly continue: typeof FR.continueStatementFrom & {
        from: typeof FR.continueStatementFrom;
        strict: typeof F.continueStatement;
    };
    readonly return: typeof FR.returnStatementFrom & {
        from: typeof FR.returnStatementFrom;
        strict: typeof F.returnStatement;
    };
    readonly throw: typeof FR.throwStatementFrom & {
        from: typeof FR.throwStatementFrom;
        strict: typeof F.throwStatement;
    };
    readonly labeled: typeof FR.labeledStatementFrom & {
        from: typeof FR.labeledStatementFrom;
        strict: typeof F.labeledStatement;
    };
};
export declare const type: {
    readonly function: typeof FR.functionTypeFrom & {
        from: typeof FR.functionTypeFrom;
        strict: typeof F.functionType;
    };
    readonly readonly: typeof FR.readonlyTypeFrom & {
        from: typeof FR.readonlyTypeFrom;
        strict: typeof F.readonlyType;
    };
    readonly constructor: typeof FR.constructorTypeFrom & {
        from: typeof FR.constructorTypeFrom;
        strict: typeof F.constructorType;
    };
    readonly infer: typeof FR.inferTypeFrom & {
        from: typeof FR.inferTypeFrom;
        strict: typeof F.inferType;
    };
};
export declare const from: {
    boolean(value: boolean): ReturnType<typeof F.true_> | ReturnType<typeof F.false_>;
    number(value: number): ReturnType<typeof F.number>;
    comment(text: string): ReturnType<typeof F.comment>;
    type(name: string): ReturnType<typeof F.typeIdentifier>;
    identifier(name: string): ReturnType<typeof F.identifier>;
    readonly function: typeof FR.functionSignatureFrom & {
        from: typeof FR.functionSignatureFrom;
        strict: typeof F.functionSignature;
    };
    readonly class: typeof FR.abstractClassDeclarationFrom & {
        from: typeof FR.abstractClassDeclarationFrom;
        strict: typeof F.abstractClassDeclaration;
    };
    readonly method: typeof FR.methodSignatureFrom & {
        from: typeof FR.methodSignatureFrom;
        strict: typeof F.methodSignature;
    };
    readonly module: typeof FR.moduleFrom & {
        from: typeof FR.moduleFrom;
        strict: typeof F.module;
    };
    readonly interface: typeof FR.interfaceDeclarationFrom & {
        from: typeof FR.interfaceDeclarationFrom;
        strict: typeof F.interfaceDeclaration;
    };
};
export declare const ir: {
    readonly abstractClassDeclaration: typeof FR.abstractClassDeclarationFrom & {
        from: typeof FR.abstractClassDeclarationFrom;
        strict: typeof F.abstractClassDeclaration;
    };
    readonly abstractMethodSignature: typeof FR.abstractMethodSignatureFrom & {
        from: typeof FR.abstractMethodSignatureFrom;
        strict: typeof F.abstractMethodSignature;
    };
    readonly addingTypeAnnotation: typeof FR.addingTypeAnnotationFrom & {
        from: typeof FR.addingTypeAnnotationFrom;
        strict: typeof F.addingTypeAnnotation;
    };
    readonly ambientDeclarationDeclaration: typeof FR.ambientDeclarationDeclarationFrom & {
        from: typeof FR.ambientDeclarationDeclarationFrom;
        strict: typeof F.ambientDeclarationDeclaration;
    };
    readonly ambientDeclaration: typeof FR.ambientDeclarationFrom & {
        from: typeof FR.ambientDeclarationFrom;
        strict: typeof F.ambientDeclaration;
        declaration: typeof FR.ambientDeclarationUFormDeclarationFrom & {
            from: typeof FR.ambientDeclarationUFormDeclarationFrom;
            strict: typeof F.ambientDeclarationUFormDeclaration;
        };
        global: typeof FR.ambientDeclarationUFormGlobalFrom & {
            from: typeof FR.ambientDeclarationUFormGlobalFrom;
            strict: typeof F.ambientDeclarationUFormGlobal;
        };
        module: typeof FR.ambientDeclarationUFormModuleFrom & {
            from: typeof FR.ambientDeclarationUFormModuleFrom;
            strict: typeof F.ambientDeclarationUFormModule;
        };
    };
    readonly arguments: typeof FR.arguments_From & {
        from: typeof FR.arguments_From;
        strict: typeof F.arguments_;
    };
    readonly array: typeof FR.arrayFrom & {
        from: typeof FR.arrayFrom;
        strict: typeof F.array;
    };
    readonly arrayPattern: typeof FR.arrayPatternFrom & {
        from: typeof FR.arrayPatternFrom;
        strict: typeof F.arrayPattern;
    };
    readonly arrayType: typeof FR.arrayTypeFrom & {
        from: typeof FR.arrayTypeFrom;
        strict: typeof F.arrayType;
    };
    readonly arrowFunctionParameter: typeof FR.arrowFunctionParameterFrom & {
        from: typeof FR.arrowFunctionParameterFrom;
        strict: typeof F.arrowFunctionParameter;
    };
    readonly arrowFunctionCallSignature: typeof FR.arrowFunctionUCallSignatureFrom & {
        from: typeof FR.arrowFunctionUCallSignatureFrom;
        strict: typeof F.arrowFunctionUCallSignature;
    };
    readonly arrowFunction: typeof FR.arrowFunctionFrom & {
        from: typeof FR.arrowFunctionFrom;
        strict: typeof F.arrowFunction;
        parameter: typeof FR.arrowFunctionUFormParameterFrom & {
            from: typeof FR.arrowFunctionUFormParameterFrom;
            strict: typeof F.arrowFunctionUFormParameter;
        };
        callSignature: typeof FR.arrowFunctionUFormUCallSignatureFrom & {
            from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
            strict: typeof F.arrowFunctionUFormUCallSignature;
        };
        _call_signature: typeof FR.arrowFunctionUFormUCallSignatureFrom & {
            from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
            strict: typeof F.arrowFunctionUFormUCallSignature;
        };
    };
    readonly asExpression: typeof FR.asExpressionFrom & {
        from: typeof FR.asExpressionFrom;
        strict: typeof F.asExpression;
    };
    readonly asserts: typeof FR.assertsFrom & {
        from: typeof FR.assertsFrom;
        strict: typeof F.asserts;
    };
    readonly assertsAnnotation: typeof FR.assertsAnnotationFrom & {
        from: typeof FR.assertsAnnotationFrom;
        strict: typeof F.assertsAnnotation;
    };
    readonly assignmentExpression: typeof FR.assignmentExpressionFrom & {
        from: typeof FR.assignmentExpressionFrom;
        strict: typeof F.assignmentExpression;
    };
    readonly assignmentPattern: typeof FR.assignmentPatternFrom & {
        from: typeof FR.assignmentPatternFrom;
        strict: typeof F.assignmentPattern;
    };
    readonly augmentedAssignmentExpression: typeof FR.augmentedAssignmentExpressionFrom & {
        from: typeof FR.augmentedAssignmentExpressionFrom;
        strict: typeof F.augmentedAssignmentExpression;
    };
    readonly awaitExpression: typeof FR.awaitExpressionFrom & {
        from: typeof FR.awaitExpressionFrom;
        strict: typeof F.awaitExpression;
    };
    readonly binaryExpression: typeof FR.binaryExpressionFrom & {
        from: typeof FR.binaryExpressionFrom;
        strict: typeof F.binaryExpression;
    };
    readonly breakStatement: typeof FR.breakStatementFrom & {
        from: typeof FR.breakStatementFrom;
        strict: typeof F.breakStatement;
    };
    readonly callExpression: typeof FR.callExpressionFrom & {
        from: typeof FR.callExpressionFrom;
        strict: typeof F.callExpression;
        call: typeof FR.callExpressionUFormCallFrom & {
            from: typeof FR.callExpressionUFormCallFrom;
            strict: typeof F.callExpressionUFormCall;
        };
        templateCall: typeof FR.callExpressionUFormTemplateCallFrom & {
            from: typeof FR.callExpressionUFormTemplateCallFrom;
            strict: typeof F.callExpressionUFormTemplateCall;
        };
        template_call: typeof FR.callExpressionUFormTemplateCallFrom & {
            from: typeof FR.callExpressionUFormTemplateCallFrom;
            strict: typeof F.callExpressionUFormTemplateCall;
        };
        member: typeof FR.callExpressionUFormMemberFrom & {
            from: typeof FR.callExpressionUFormMemberFrom;
            strict: typeof F.callExpressionUFormMember;
        };
    };
    readonly callSignature: typeof FR.callSignatureFrom & {
        from: typeof FR.callSignatureFrom;
        strict: typeof F.callSignature;
    };
    readonly catchClause: typeof FR.catchClauseFrom & {
        from: typeof FR.catchClauseFrom;
        strict: typeof F.catchClause;
    };
    readonly class: typeof FR.class_From & {
        from: typeof FR.class_From;
        strict: typeof F.class_;
    };
    readonly classBody: typeof FR.classBodyFrom & {
        from: typeof FR.classBodyFrom;
        strict: typeof F.classBody;
    };
    readonly classDeclaration: typeof FR.classDeclarationFrom & {
        from: typeof FR.classDeclarationFrom;
        strict: typeof F.classDeclaration;
    };
    readonly classHeritageExtendsClause: typeof FR.classHeritageExtendsClauseFrom & {
        from: typeof FR.classHeritageExtendsClauseFrom;
        strict: typeof F.classHeritageExtendsClause;
    };
    readonly classHeritageImplementsClause: typeof FR.classHeritageImplementsClauseFrom & {
        from: typeof FR.classHeritageImplementsClauseFrom;
        strict: typeof F.classHeritageImplementsClause;
    };
    readonly classHeritage: typeof FR.classHeritageFrom & {
        from: typeof FR.classHeritageFrom;
        strict: typeof F.classHeritage;
        extendsClause: typeof FR.classHeritageUFormExtendsClauseFrom & {
            from: typeof FR.classHeritageUFormExtendsClauseFrom;
            strict: typeof F.classHeritageUFormExtendsClause;
        };
        extends_clause: typeof FR.classHeritageUFormExtendsClauseFrom & {
            from: typeof FR.classHeritageUFormExtendsClauseFrom;
            strict: typeof F.classHeritageUFormExtendsClause;
        };
        implementsClause: typeof FR.classHeritageUFormImplementsClauseFrom & {
            from: typeof FR.classHeritageUFormImplementsClauseFrom;
            strict: typeof F.classHeritageUFormImplementsClause;
        };
        implements_clause: typeof FR.classHeritageUFormImplementsClauseFrom & {
            from: typeof FR.classHeritageUFormImplementsClauseFrom;
            strict: typeof F.classHeritageUFormImplementsClause;
        };
    };
    readonly classStaticBlock: typeof FR.classStaticBlockFrom & {
        from: typeof FR.classStaticBlockFrom;
        strict: typeof F.classStaticBlock;
    };
    readonly computedPropertyName: typeof FR.computedPropertyNameFrom & {
        from: typeof FR.computedPropertyNameFrom;
        strict: typeof F.computedPropertyName;
    };
    readonly conditionalType: typeof FR.conditionalTypeFrom & {
        from: typeof FR.conditionalTypeFrom;
        strict: typeof F.conditionalType;
    };
    readonly constraint: typeof FR.constraintFrom & {
        from: typeof FR.constraintFrom;
        strict: typeof F.constraint;
    };
    readonly constructSignature: typeof FR.constructSignatureFrom & {
        from: typeof FR.constructSignatureFrom;
        strict: typeof F.constructSignature;
    };
    readonly constructorType: typeof FR.constructorTypeFrom & {
        from: typeof FR.constructorTypeFrom;
        strict: typeof F.constructorType;
    };
    readonly continueStatement: typeof FR.continueStatementFrom & {
        from: typeof FR.continueStatementFrom;
        strict: typeof F.continueStatement;
    };
    readonly debuggerStatement: typeof FR.debuggerStatementFrom & {
        from: typeof FR.debuggerStatementFrom;
        strict: typeof F.debuggerStatement;
    };
    readonly decorator: typeof FR.decoratorFrom & {
        from: typeof FR.decoratorFrom;
        strict: typeof F.decorator;
    };
    readonly decoratorCallExpression: typeof FR.decoratorCallExpressionFrom & {
        from: typeof FR.decoratorCallExpressionFrom;
        strict: typeof F.decoratorCallExpression;
    };
    readonly decoratorMemberExpression: typeof FR.decoratorMemberExpressionFrom & {
        from: typeof FR.decoratorMemberExpressionFrom;
        strict: typeof F.decoratorMemberExpression;
    };
    readonly decoratorParenthesizedExpression: typeof FR.decoratorParenthesizedExpressionFrom & {
        from: typeof FR.decoratorParenthesizedExpressionFrom;
        strict: typeof F.decoratorParenthesizedExpression;
    };
    readonly defaultType: typeof FR.defaultTypeFrom & {
        from: typeof FR.defaultTypeFrom;
        strict: typeof F.defaultType;
    };
    readonly doStatement: typeof FR.doStatementFrom & {
        from: typeof FR.doStatementFrom;
        strict: typeof F.doStatement;
    };
    readonly elseClause: typeof FR.elseClauseFrom & {
        from: typeof FR.elseClauseFrom;
        strict: typeof F.elseClause;
    };
    readonly enumAssignment: typeof FR.enumAssignmentFrom & {
        from: typeof FR.enumAssignmentFrom;
        strict: typeof F.enumAssignment;
    };
    readonly enumBody: typeof FR.enumBodyFrom & {
        from: typeof FR.enumBodyFrom;
        strict: typeof F.enumBody;
    };
    readonly enumDeclaration: typeof FR.enumDeclarationFrom & {
        from: typeof FR.enumDeclarationFrom;
        strict: typeof F.enumDeclaration;
    };
    readonly exportClause: typeof FR.exportClauseFrom & {
        from: typeof FR.exportClauseFrom;
        strict: typeof F.exportClause;
    };
    readonly exportSpecifier: typeof FR.exportSpecifierFrom & {
        from: typeof FR.exportSpecifierFrom;
        strict: typeof F.exportSpecifier;
    };
    readonly exportStatementTypeExport: typeof FR.exportStatementTypeExportFrom & {
        from: typeof FR.exportStatementTypeExportFrom;
        strict: typeof F.exportStatementTypeExport;
    };
    readonly exportStatementEqualsExport: typeof FR.exportStatementEqualsExportFrom & {
        from: typeof FR.exportStatementEqualsExportFrom;
        strict: typeof F.exportStatementEqualsExport;
    };
    readonly exportStatementNamespaceExport: typeof FR.exportStatementNamespaceExportFrom & {
        from: typeof FR.exportStatementNamespaceExportFrom;
        strict: typeof F.exportStatementNamespaceExport;
    };
    readonly exportStatement: typeof FR.exportStatementFrom & {
        from: typeof FR.exportStatementFrom;
        strict: typeof F.exportStatement;
        default: typeof FR.exportStatementUFormDefaultFrom & {
            from: typeof FR.exportStatementUFormDefaultFrom;
            strict: typeof F.exportStatementUFormDefault;
        };
        typeExport: typeof FR.exportStatementUFormTypeExportFrom & {
            from: typeof FR.exportStatementUFormTypeExportFrom;
            strict: typeof F.exportStatementUFormTypeExport;
        };
        type_export: typeof FR.exportStatementUFormTypeExportFrom & {
            from: typeof FR.exportStatementUFormTypeExportFrom;
            strict: typeof F.exportStatementUFormTypeExport;
        };
        equalsExport: typeof FR.exportStatementUFormEqualsExportFrom & {
            from: typeof FR.exportStatementUFormEqualsExportFrom;
            strict: typeof F.exportStatementUFormEqualsExport;
        };
        equals_export: typeof FR.exportStatementUFormEqualsExportFrom & {
            from: typeof FR.exportStatementUFormEqualsExportFrom;
            strict: typeof F.exportStatementUFormEqualsExport;
        };
        namespaceExport: typeof FR.exportStatementUFormNamespaceExportFrom & {
            from: typeof FR.exportStatementUFormNamespaceExportFrom;
            strict: typeof F.exportStatementUFormNamespaceExport;
        };
        namespace_export: typeof FR.exportStatementUFormNamespaceExportFrom & {
            from: typeof FR.exportStatementUFormNamespaceExportFrom;
            strict: typeof F.exportStatementUFormNamespaceExport;
        };
    };
    readonly expressionStatement: typeof FR.expressionStatementFrom & {
        from: typeof FR.expressionStatementFrom;
        strict: typeof F.expressionStatement;
    };
    readonly extendsClause: typeof FR.extendsClauseFrom & {
        from: typeof FR.extendsClauseFrom;
        strict: typeof F.extendsClause;
    };
    readonly extendsTypeClause: typeof FR.extendsTypeClauseFrom & {
        from: typeof FR.extendsTypeClauseFrom;
        strict: typeof F.extendsTypeClause;
    };
    readonly finallyClause: typeof FR.finallyClauseFrom & {
        from: typeof FR.finallyClauseFrom;
        strict: typeof F.finallyClause;
    };
    readonly flowMaybeType: typeof FR.flowMaybeTypeFrom & {
        from: typeof FR.flowMaybeTypeFrom;
        strict: typeof F.flowMaybeType;
    };
    readonly forInStatement: typeof FR.forInStatementFrom & {
        from: typeof FR.forInStatementFrom;
        strict: typeof F.forInStatement;
    };
    readonly forStatement: typeof FR.forStatementFrom & {
        from: typeof FR.forStatementFrom;
        strict: typeof F.forStatement;
    };
    readonly formalParameters: typeof FR.formalParametersFrom & {
        from: typeof FR.formalParametersFrom;
        strict: typeof F.formalParameters;
    };
    readonly functionDeclaration: typeof FR.functionDeclarationFrom & {
        from: typeof FR.functionDeclarationFrom;
        strict: typeof F.functionDeclaration;
    };
    readonly functionExpression: typeof FR.functionExpressionFrom & {
        from: typeof FR.functionExpressionFrom;
        strict: typeof F.functionExpression;
    };
    readonly functionSignature: typeof FR.functionSignatureFrom & {
        from: typeof FR.functionSignatureFrom;
        strict: typeof F.functionSignature;
    };
    readonly functionType: typeof FR.functionTypeFrom & {
        from: typeof FR.functionTypeFrom;
        strict: typeof F.functionType;
    };
    readonly generatorFunction: typeof FR.generatorFunctionFrom & {
        from: typeof FR.generatorFunctionFrom;
        strict: typeof F.generatorFunction;
    };
    readonly generatorFunctionDeclaration: typeof FR.generatorFunctionDeclarationFrom & {
        from: typeof FR.generatorFunctionDeclarationFrom;
        strict: typeof F.generatorFunctionDeclaration;
    };
    readonly genericType: typeof FR.genericTypeFrom & {
        from: typeof FR.genericTypeFrom;
        strict: typeof F.genericType;
    };
    readonly ifStatement: typeof FR.ifStatementFrom & {
        from: typeof FR.ifStatementFrom;
        strict: typeof F.ifStatement;
    };
    readonly implementsClause: typeof FR.implementsClauseFrom & {
        from: typeof FR.implementsClauseFrom;
        strict: typeof F.implementsClause;
    };
    readonly importAlias: typeof FR.importAliasFrom & {
        from: typeof FR.importAliasFrom;
        strict: typeof F.importAlias;
    };
    readonly importAttribute: typeof FR.importAttributeFrom & {
        from: typeof FR.importAttributeFrom;
        strict: typeof F.importAttribute;
    };
    readonly importClauseNamespaceImport: typeof FR.importClauseNamespaceImportFrom & {
        from: typeof FR.importClauseNamespaceImportFrom;
        strict: typeof F.importClauseNamespaceImport;
    };
    readonly importClauseNamedImports: typeof FR.importClauseNamedImportsFrom & {
        from: typeof FR.importClauseNamedImportsFrom;
        strict: typeof F.importClauseNamedImports;
    };
    readonly importClauseDefaultImport: typeof FR.importClauseDefaultImportFrom & {
        from: typeof FR.importClauseDefaultImportFrom;
        strict: typeof F.importClauseDefaultImport;
    };
    readonly importClause: typeof FR.importClauseFrom & {
        from: typeof FR.importClauseFrom;
        strict: typeof F.importClause;
        namespaceImport: typeof FR.importClauseUFormNamespaceImportFrom & {
            from: typeof FR.importClauseUFormNamespaceImportFrom;
            strict: typeof F.importClauseUFormNamespaceImport;
        };
        namespace_import: typeof FR.importClauseUFormNamespaceImportFrom & {
            from: typeof FR.importClauseUFormNamespaceImportFrom;
            strict: typeof F.importClauseUFormNamespaceImport;
        };
        namedImports: typeof FR.importClauseUFormNamedImportsFrom & {
            from: typeof FR.importClauseUFormNamedImportsFrom;
            strict: typeof F.importClauseUFormNamedImports;
        };
        named_imports: typeof FR.importClauseUFormNamedImportsFrom & {
            from: typeof FR.importClauseUFormNamedImportsFrom;
            strict: typeof F.importClauseUFormNamedImports;
        };
        defaultImport: typeof FR.importClauseUFormDefaultImportFrom & {
            from: typeof FR.importClauseUFormDefaultImportFrom;
            strict: typeof F.importClauseUFormDefaultImport;
        };
        default_import: typeof FR.importClauseUFormDefaultImportFrom & {
            from: typeof FR.importClauseUFormDefaultImportFrom;
            strict: typeof F.importClauseUFormDefaultImport;
        };
    };
    readonly importRequireClause: typeof FR.importRequireClauseFrom & {
        from: typeof FR.importRequireClauseFrom;
        strict: typeof F.importRequireClause;
    };
    readonly importSpecifierName: typeof FR.importSpecifierNameFrom & {
        from: typeof FR.importSpecifierNameFrom;
        strict: typeof F.importSpecifierName;
    };
    readonly importSpecifier: typeof FR.importSpecifierFrom & {
        from: typeof FR.importSpecifierFrom;
        strict: typeof F.importSpecifier;
        name: typeof FR.importSpecifierUFormNameFrom & {
            from: typeof FR.importSpecifierUFormNameFrom;
            strict: typeof F.importSpecifierUFormName;
        };
        as: typeof FR.importSpecifierUFormAsFrom & {
            from: typeof FR.importSpecifierUFormAsFrom;
            strict: typeof F.importSpecifierUFormAs;
        };
    };
    readonly importStatement: typeof FR.importStatementFrom & {
        from: typeof FR.importStatementFrom;
        strict: typeof F.importStatement;
    };
    readonly indexSignatureMappedTypeClause: typeof FR.indexSignatureMappedTypeClauseFrom & {
        from: typeof FR.indexSignatureMappedTypeClauseFrom;
        strict: typeof F.indexSignatureMappedTypeClause;
    };
    readonly indexSignature: typeof FR.indexSignatureFrom & {
        from: typeof FR.indexSignatureFrom;
        strict: typeof F.indexSignature;
        colon: typeof FR.indexSignatureUFormColonFrom & {
            from: typeof FR.indexSignatureUFormColonFrom;
            strict: typeof F.indexSignatureUFormColon;
        };
        mappedTypeClause: typeof FR.indexSignatureUFormMappedTypeClauseFrom & {
            from: typeof FR.indexSignatureUFormMappedTypeClauseFrom;
            strict: typeof F.indexSignatureUFormMappedTypeClause;
        };
        mapped_type_clause: typeof FR.indexSignatureUFormMappedTypeClauseFrom & {
            from: typeof FR.indexSignatureUFormMappedTypeClauseFrom;
            strict: typeof F.indexSignatureUFormMappedTypeClause;
        };
    };
    readonly indexTypeQuery: typeof FR.indexTypeQueryFrom & {
        from: typeof FR.indexTypeQueryFrom;
        strict: typeof F.indexTypeQuery;
    };
    readonly inferType: typeof FR.inferTypeFrom & {
        from: typeof FR.inferTypeFrom;
        strict: typeof F.inferType;
    };
    readonly instantiationExpression: typeof FR.instantiationExpressionFrom & {
        from: typeof FR.instantiationExpressionFrom;
        strict: typeof F.instantiationExpression;
    };
    readonly interfaceDeclaration: typeof FR.interfaceDeclarationFrom & {
        from: typeof FR.interfaceDeclarationFrom;
        strict: typeof F.interfaceDeclaration;
    };
    readonly internalModule: typeof FR.internalModuleFrom & {
        from: typeof FR.internalModuleFrom;
        strict: typeof F.internalModule;
    };
    readonly intersectionType: typeof FR.intersectionTypeFrom & {
        from: typeof FR.intersectionTypeFrom;
        strict: typeof F.intersectionType;
    };
    readonly labeledStatement: typeof FR.labeledStatementFrom & {
        from: typeof FR.labeledStatementFrom;
        strict: typeof F.labeledStatement;
    };
    readonly lexicalDeclaration: typeof FR.lexicalDeclarationFrom & {
        from: typeof FR.lexicalDeclarationFrom;
        strict: typeof F.lexicalDeclaration;
    };
    readonly literalType: typeof FR.literalTypeFrom & {
        from: typeof FR.literalTypeFrom;
        strict: typeof F.literalType;
    };
    readonly lookupType: typeof FR.lookupTypeFrom & {
        from: typeof FR.lookupTypeFrom;
        strict: typeof F.lookupType;
    };
    readonly mappedTypeClause: typeof FR.mappedTypeClauseFrom & {
        from: typeof FR.mappedTypeClauseFrom;
        strict: typeof F.mappedTypeClause;
    };
    readonly memberExpression: typeof FR.memberExpressionFrom & {
        from: typeof FR.memberExpressionFrom;
        strict: typeof F.memberExpression;
    };
    readonly methodDefinition: typeof FR.methodDefinitionFrom & {
        from: typeof FR.methodDefinitionFrom;
        strict: typeof F.methodDefinition;
    };
    readonly methodSignature: typeof FR.methodSignatureFrom & {
        from: typeof FR.methodSignatureFrom;
        strict: typeof F.methodSignature;
    };
    readonly module: typeof FR.moduleFrom & {
        from: typeof FR.moduleFrom;
        strict: typeof F.module;
    };
    readonly namedImports: typeof FR.namedImportsFrom & {
        from: typeof FR.namedImportsFrom;
        strict: typeof F.namedImports;
    };
    readonly namespaceExport: typeof FR.namespaceExportFrom & {
        from: typeof FR.namespaceExportFrom;
        strict: typeof F.namespaceExport;
    };
    readonly namespaceImport: typeof FR.namespaceImportFrom & {
        from: typeof FR.namespaceImportFrom;
        strict: typeof F.namespaceImport;
    };
    readonly nestedIdentifier: typeof FR.nestedIdentifierFrom & {
        from: typeof FR.nestedIdentifierFrom;
        strict: typeof F.nestedIdentifier;
    };
    readonly nestedTypeIdentifier: typeof FR.nestedTypeIdentifierFrom & {
        from: typeof FR.nestedTypeIdentifierFrom;
        strict: typeof F.nestedTypeIdentifier;
    };
    readonly newExpression: typeof FR.newExpressionFrom & {
        from: typeof FR.newExpressionFrom;
        strict: typeof F.newExpression;
    };
    readonly nonNullExpression: typeof FR.nonNullExpressionFrom & {
        from: typeof FR.nonNullExpressionFrom;
        strict: typeof F.nonNullExpression;
    };
    readonly object: typeof FR.objectFrom & {
        from: typeof FR.objectFrom;
        strict: typeof F.object;
    };
    readonly objectAssignmentPattern: typeof FR.objectAssignmentPatternFrom & {
        from: typeof FR.objectAssignmentPatternFrom;
        strict: typeof F.objectAssignmentPattern;
    };
    readonly objectPattern: typeof FR.objectPatternFrom & {
        from: typeof FR.objectPatternFrom;
        strict: typeof F.objectPattern;
    };
    readonly objectType: typeof FR.objectTypeFrom & {
        from: typeof FR.objectTypeFrom;
        strict: typeof F.objectType;
        curly: typeof F.objectTypeCurly;
        flow: typeof F.objectTypeFlow;
    };
    readonly omittingTypeAnnotation: typeof FR.omittingTypeAnnotationFrom & {
        from: typeof FR.omittingTypeAnnotationFrom;
        strict: typeof F.omittingTypeAnnotation;
    };
    readonly optingTypeAnnotation: typeof FR.optingTypeAnnotationFrom & {
        from: typeof FR.optingTypeAnnotationFrom;
        strict: typeof F.optingTypeAnnotation;
    };
    readonly optionalParameter: typeof FR.optionalParameterFrom & {
        from: typeof FR.optionalParameterFrom;
        strict: typeof F.optionalParameter;
    };
    readonly optionalTupleParameter: typeof FR.optionalTupleParameterFrom & {
        from: typeof FR.optionalTupleParameterFrom;
        strict: typeof F.optionalTupleParameter;
    };
    readonly optionalType: typeof FR.optionalTypeFrom & {
        from: typeof FR.optionalTypeFrom;
        strict: typeof F.optionalType;
    };
    readonly pair: typeof FR.pairFrom & {
        from: typeof FR.pairFrom;
        strict: typeof F.pair;
    };
    readonly pairPattern: typeof FR.pairPatternFrom & {
        from: typeof FR.pairPatternFrom;
        strict: typeof F.pairPattern;
    };
    readonly parenthesizedExpressionSequence: typeof FR.parenthesizedExpressionSequenceFrom & {
        from: typeof FR.parenthesizedExpressionSequenceFrom;
        strict: typeof F.parenthesizedExpressionSequence;
    };
    readonly parenthesizedExpression: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
        typed: typeof FR.parenthesizedExpressionUFormTypedFrom & {
            from: typeof FR.parenthesizedExpressionUFormTypedFrom;
            strict: typeof F.parenthesizedExpressionUFormTyped;
        };
        sequence: typeof FR.parenthesizedExpressionUFormSequenceFrom & {
            from: typeof FR.parenthesizedExpressionUFormSequenceFrom;
            strict: typeof F.parenthesizedExpressionUFormSequence;
        };
    };
    readonly parenthesizedType: typeof FR.parenthesizedTypeFrom & {
        from: typeof FR.parenthesizedTypeFrom;
        strict: typeof F.parenthesizedType;
    };
    readonly program: typeof FR.programFrom & {
        from: typeof FR.programFrom;
        strict: typeof F.program;
    };
    readonly propertySignature: typeof FR.propertySignatureFrom & {
        from: typeof FR.propertySignatureFrom;
        strict: typeof F.propertySignature;
    };
    readonly publicFieldDefinition: typeof FR.publicFieldDefinitionFrom & {
        from: typeof FR.publicFieldDefinitionFrom;
        strict: typeof F.publicFieldDefinition;
    };
    readonly readonlyType: typeof FR.readonlyTypeFrom & {
        from: typeof FR.readonlyTypeFrom;
        strict: typeof F.readonlyType;
    };
    readonly regex: typeof FR.regexFrom & {
        from: typeof FR.regexFrom;
        strict: typeof F.regex;
    };
    readonly requiredParameter: typeof FR.requiredParameterFrom & {
        from: typeof FR.requiredParameterFrom;
        strict: typeof F.requiredParameter;
    };
    readonly restPattern: typeof FR.restPatternFrom & {
        from: typeof FR.restPatternFrom;
        strict: typeof F.restPattern;
    };
    readonly restType: typeof FR.restTypeFrom & {
        from: typeof FR.restTypeFrom;
        strict: typeof F.restType;
    };
    readonly returnStatement: typeof FR.returnStatementFrom & {
        from: typeof FR.returnStatementFrom;
        strict: typeof F.returnStatement;
    };
    readonly satisfiesExpression: typeof FR.satisfiesExpressionFrom & {
        from: typeof FR.satisfiesExpressionFrom;
        strict: typeof F.satisfiesExpression;
    };
    readonly sequenceExpression: typeof FR.sequenceExpressionFrom & {
        from: typeof FR.sequenceExpressionFrom;
        strict: typeof F.sequenceExpression;
    };
    readonly spreadElement: typeof FR.spreadElementFrom & {
        from: typeof FR.spreadElementFrom;
        strict: typeof F.spreadElement;
    };
    readonly statementBlock: typeof FR.statementBlockFrom & {
        from: typeof FR.statementBlockFrom;
        strict: typeof F.statementBlock;
    };
    readonly string: typeof FR.stringFrom & {
        from: typeof FR.stringFrom;
        strict: typeof F.string;
        double: typeof F.stringDouble;
        single: typeof F.stringSingle;
    };
    readonly subscriptExpression: typeof FR.subscriptExpressionFrom & {
        from: typeof FR.subscriptExpressionFrom;
        strict: typeof F.subscriptExpression;
    };
    readonly switchBody: typeof FR.switchBodyFrom & {
        from: typeof FR.switchBodyFrom;
        strict: typeof F.switchBody;
    };
    readonly switchCase: typeof FR.switchCaseFrom & {
        from: typeof FR.switchCaseFrom;
        strict: typeof F.switchCase;
    };
    readonly switchDefault: typeof FR.switchDefaultFrom & {
        from: typeof FR.switchDefaultFrom;
        strict: typeof F.switchDefault;
    };
    readonly switchStatement: typeof FR.switchStatementFrom & {
        from: typeof FR.switchStatementFrom;
        strict: typeof F.switchStatement;
    };
    readonly templateLiteralType: typeof FR.templateLiteralTypeFrom & {
        from: typeof FR.templateLiteralTypeFrom;
        strict: typeof F.templateLiteralType;
    };
    readonly templateString: typeof FR.templateStringFrom & {
        from: typeof FR.templateStringFrom;
        strict: typeof F.templateString;
    };
    readonly templateSubstitution: typeof FR.templateSubstitutionFrom & {
        from: typeof FR.templateSubstitutionFrom;
        strict: typeof F.templateSubstitution;
    };
    readonly templateType: typeof FR.templateTypeFrom & {
        from: typeof FR.templateTypeFrom;
        strict: typeof F.templateType;
    };
    readonly ternaryExpression: typeof FR.ternaryExpressionFrom & {
        from: typeof FR.ternaryExpressionFrom;
        strict: typeof F.ternaryExpression;
    };
    readonly throwStatement: typeof FR.throwStatementFrom & {
        from: typeof FR.throwStatementFrom;
        strict: typeof F.throwStatement;
    };
    readonly tryStatement: typeof FR.tryStatementFrom & {
        from: typeof FR.tryStatementFrom;
        strict: typeof F.tryStatement;
    };
    readonly tupleParameter: typeof FR.tupleParameterFrom & {
        from: typeof FR.tupleParameterFrom;
        strict: typeof F.tupleParameter;
    };
    readonly tupleType: typeof FR.tupleTypeFrom & {
        from: typeof FR.tupleTypeFrom;
        strict: typeof F.tupleType;
    };
    readonly typeAliasDeclaration: typeof FR.typeAliasDeclarationFrom & {
        from: typeof FR.typeAliasDeclarationFrom;
        strict: typeof F.typeAliasDeclaration;
    };
    readonly typeAnnotation: typeof FR.typeAnnotationFrom & {
        from: typeof FR.typeAnnotationFrom;
        strict: typeof F.typeAnnotation;
    };
    readonly typeArguments: typeof FR.typeArgumentsFrom & {
        from: typeof FR.typeArgumentsFrom;
        strict: typeof F.typeArguments;
    };
    readonly typeAssertion: typeof FR.typeAssertionFrom & {
        from: typeof FR.typeAssertionFrom;
        strict: typeof F.typeAssertion;
    };
    readonly typeParameter: typeof FR.typeParameterFrom & {
        from: typeof FR.typeParameterFrom;
        strict: typeof F.typeParameter;
    };
    readonly typeParameters: typeof FR.typeParametersFrom & {
        from: typeof FR.typeParametersFrom;
        strict: typeof F.typeParameters;
    };
    readonly typePredicate: typeof FR.typePredicateFrom & {
        from: typeof FR.typePredicateFrom;
        strict: typeof F.typePredicate;
    };
    readonly typePredicateAnnotation: typeof FR.typePredicateAnnotationFrom & {
        from: typeof FR.typePredicateAnnotationFrom;
        strict: typeof F.typePredicateAnnotation;
    };
    readonly typeQuery: typeof FR.typeQueryFrom & {
        from: typeof FR.typeQueryFrom;
        strict: typeof F.typeQuery;
    };
    readonly unaryExpression: typeof FR.unaryExpressionFrom & {
        from: typeof FR.unaryExpressionFrom;
        strict: typeof F.unaryExpression;
    };
    readonly unionType: typeof FR.unionTypeFrom & {
        from: typeof FR.unionTypeFrom;
        strict: typeof F.unionType;
    };
    readonly updateExpression: typeof FR.updateExpressionFrom & {
        from: typeof FR.updateExpressionFrom;
        strict: typeof F.updateExpression;
        postfix: typeof FR.updateExpressionUFormPostfixFrom & {
            from: typeof FR.updateExpressionUFormPostfixFrom;
            strict: typeof F.updateExpressionUFormPostfix;
        };
        prefix: typeof FR.updateExpressionUFormPrefixFrom & {
            from: typeof FR.updateExpressionUFormPrefixFrom;
            strict: typeof F.updateExpressionUFormPrefix;
        };
    };
    readonly variableDeclaration: typeof FR.variableDeclarationFrom & {
        from: typeof FR.variableDeclarationFrom;
        strict: typeof F.variableDeclaration;
    };
    readonly variableDeclarator: typeof FR.variableDeclaratorFrom & {
        from: typeof FR.variableDeclaratorFrom;
        strict: typeof F.variableDeclarator;
    };
    readonly whileStatement: typeof FR.whileStatementFrom & {
        from: typeof FR.whileStatementFrom;
        strict: typeof F.whileStatement;
    };
    readonly withStatement: typeof FR.withStatementFrom & {
        from: typeof FR.withStatementFrom;
        strict: typeof F.withStatement;
    };
    readonly yieldExpression: typeof FR.yieldExpressionFrom & {
        from: typeof FR.yieldExpressionFrom;
        strict: typeof F.yieldExpression;
    };
    readonly false: typeof F.false_;
    readonly import: typeof F.import_;
    readonly null: typeof F.null_;
    readonly overrideModifier: typeof F.overrideModifier;
    readonly super: typeof F.super_;
    readonly this: typeof F.this_;
    readonly true: typeof F.true_;
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
    readonly abstractClass: typeof FR.abstractClassDeclarationFrom & {
        from: typeof FR.abstractClassDeclarationFrom;
        strict: typeof F.abstractClassDeclaration;
    };
    readonly ambient: typeof FR.ambientDeclarationFrom & {
        from: typeof FR.ambientDeclarationFrom;
        strict: typeof F.ambientDeclaration;
        declaration: typeof FR.ambientDeclarationUFormDeclarationFrom & {
            from: typeof FR.ambientDeclarationUFormDeclarationFrom;
            strict: typeof F.ambientDeclarationUFormDeclaration;
        };
        global: typeof FR.ambientDeclarationUFormGlobalFrom & {
            from: typeof FR.ambientDeclarationUFormGlobalFrom;
            strict: typeof F.ambientDeclarationUFormGlobal;
        };
        module: typeof FR.ambientDeclarationUFormModuleFrom & {
            from: typeof FR.ambientDeclarationUFormModuleFrom;
            strict: typeof F.ambientDeclarationUFormModule;
        };
    };
    readonly arrow: typeof FR.arrowFunctionFrom & {
        from: typeof FR.arrowFunctionFrom;
        strict: typeof F.arrowFunction;
        parameter: typeof FR.arrowFunctionUFormParameterFrom & {
            from: typeof FR.arrowFunctionUFormParameterFrom;
            strict: typeof F.arrowFunctionUFormParameter;
        };
        callSignature: typeof FR.arrowFunctionUFormUCallSignatureFrom & {
            from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
            strict: typeof F.arrowFunctionUFormUCallSignature;
        };
        _call_signature: typeof FR.arrowFunctionUFormUCallSignatureFrom & {
            from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
            strict: typeof F.arrowFunctionUFormUCallSignature;
        };
    };
    readonly as: typeof FR.asExpressionFrom & {
        from: typeof FR.asExpressionFrom;
        strict: typeof F.asExpression;
    };
    readonly assignment: typeof FR.assignmentExpressionFrom & {
        from: typeof FR.assignmentExpressionFrom;
        strict: typeof F.assignmentExpression;
    };
    readonly augmentedAssignment: typeof FR.augmentedAssignmentExpressionFrom & {
        from: typeof FR.augmentedAssignmentExpressionFrom;
        strict: typeof F.augmentedAssignmentExpression;
    };
    readonly await: typeof FR.awaitExpressionFrom & {
        from: typeof FR.awaitExpressionFrom;
        strict: typeof F.awaitExpression;
    };
    readonly binary: typeof FR.binaryExpressionFrom & {
        from: typeof FR.binaryExpressionFrom;
        strict: typeof F.binaryExpression;
    };
    readonly break: typeof FR.breakStatementFrom & {
        from: typeof FR.breakStatementFrom;
        strict: typeof F.breakStatement;
    };
    readonly call: typeof FR.callExpressionFrom & {
        from: typeof FR.callExpressionFrom;
        strict: typeof F.callExpression;
        call: typeof FR.callExpressionUFormCallFrom & {
            from: typeof FR.callExpressionUFormCallFrom;
            strict: typeof F.callExpressionUFormCall;
        };
        templateCall: typeof FR.callExpressionUFormTemplateCallFrom & {
            from: typeof FR.callExpressionUFormTemplateCallFrom;
            strict: typeof F.callExpressionUFormTemplateCall;
        };
        template_call: typeof FR.callExpressionUFormTemplateCallFrom & {
            from: typeof FR.callExpressionUFormTemplateCallFrom;
            strict: typeof F.callExpressionUFormTemplateCall;
        };
        member: typeof FR.callExpressionUFormMemberFrom & {
            from: typeof FR.callExpressionUFormMemberFrom;
            strict: typeof F.callExpressionUFormMember;
        };
    };
    readonly computedProperty: typeof FR.computedPropertyNameFrom & {
        from: typeof FR.computedPropertyNameFrom;
        strict: typeof F.computedPropertyName;
    };
    readonly conditional: typeof FR.conditionalTypeFrom & {
        from: typeof FR.conditionalTypeFrom;
        strict: typeof F.conditionalType;
    };
    readonly constructor: typeof FR.constructorTypeFrom & {
        from: typeof FR.constructorTypeFrom;
        strict: typeof F.constructorType;
    };
    readonly continue: typeof FR.continueStatementFrom & {
        from: typeof FR.continueStatementFrom;
        strict: typeof F.continueStatement;
    };
    readonly debugger: typeof FR.debuggerStatementFrom & {
        from: typeof FR.debuggerStatementFrom;
        strict: typeof F.debuggerStatement;
    };
    readonly do: typeof FR.doStatementFrom & {
        from: typeof FR.doStatementFrom;
        strict: typeof F.doStatement;
    };
    readonly enum: typeof FR.enumDeclarationFrom & {
        from: typeof FR.enumDeclarationFrom;
        strict: typeof F.enumDeclaration;
    };
    readonly export: typeof FR.exportStatementFrom & {
        from: typeof FR.exportStatementFrom;
        strict: typeof F.exportStatement;
        default: typeof FR.exportStatementUFormDefaultFrom & {
            from: typeof FR.exportStatementUFormDefaultFrom;
            strict: typeof F.exportStatementUFormDefault;
        };
        typeExport: typeof FR.exportStatementUFormTypeExportFrom & {
            from: typeof FR.exportStatementUFormTypeExportFrom;
            strict: typeof F.exportStatementUFormTypeExport;
        };
        type_export: typeof FR.exportStatementUFormTypeExportFrom & {
            from: typeof FR.exportStatementUFormTypeExportFrom;
            strict: typeof F.exportStatementUFormTypeExport;
        };
        equalsExport: typeof FR.exportStatementUFormEqualsExportFrom & {
            from: typeof FR.exportStatementUFormEqualsExportFrom;
            strict: typeof F.exportStatementUFormEqualsExport;
        };
        equals_export: typeof FR.exportStatementUFormEqualsExportFrom & {
            from: typeof FR.exportStatementUFormEqualsExportFrom;
            strict: typeof F.exportStatementUFormEqualsExport;
        };
        namespaceExport: typeof FR.exportStatementUFormNamespaceExportFrom & {
            from: typeof FR.exportStatementUFormNamespaceExportFrom;
            strict: typeof F.exportStatementUFormNamespaceExport;
        };
        namespace_export: typeof FR.exportStatementUFormNamespaceExportFrom & {
            from: typeof FR.exportStatementUFormNamespaceExportFrom;
            strict: typeof F.exportStatementUFormNamespaceExport;
        };
    };
    readonly flowMaybe: typeof FR.flowMaybeTypeFrom & {
        from: typeof FR.flowMaybeTypeFrom;
        strict: typeof F.flowMaybeType;
    };
    readonly for: typeof FR.forStatementFrom & {
        from: typeof FR.forStatementFrom;
        strict: typeof F.forStatement;
    };
    readonly forIn: typeof FR.forInStatementFrom & {
        from: typeof FR.forInStatementFrom;
        strict: typeof F.forInStatement;
    };
    readonly function: typeof FR.functionDeclarationFrom & {
        from: typeof FR.functionDeclarationFrom;
        strict: typeof F.functionDeclaration;
    };
    readonly generator: typeof FR.generatorFunctionFrom & {
        from: typeof FR.generatorFunctionFrom;
        strict: typeof F.generatorFunction;
    };
    readonly generic: typeof FR.genericTypeFrom & {
        from: typeof FR.genericTypeFrom;
        strict: typeof F.genericType;
    };
    readonly if: typeof FR.ifStatementFrom & {
        from: typeof FR.ifStatementFrom;
        strict: typeof F.ifStatement;
    };
    readonly indexType: typeof FR.indexTypeQueryFrom & {
        from: typeof FR.indexTypeQueryFrom;
        strict: typeof F.indexTypeQuery;
    };
    readonly infer: typeof FR.inferTypeFrom & {
        from: typeof FR.inferTypeFrom;
        strict: typeof F.inferType;
    };
    readonly instantiation: typeof FR.instantiationExpressionFrom & {
        from: typeof FR.instantiationExpressionFrom;
        strict: typeof F.instantiationExpression;
    };
    readonly interface: typeof FR.interfaceDeclarationFrom & {
        from: typeof FR.interfaceDeclarationFrom;
        strict: typeof F.interfaceDeclaration;
    };
    readonly internal: typeof FR.internalModuleFrom & {
        from: typeof FR.internalModuleFrom;
        strict: typeof F.internalModule;
    };
    readonly intersection: typeof FR.intersectionTypeFrom & {
        from: typeof FR.intersectionTypeFrom;
        strict: typeof F.intersectionType;
    };
    readonly jsx: typeof F.jsxText;
    readonly labeled: typeof FR.labeledStatementFrom & {
        from: typeof FR.labeledStatementFrom;
        strict: typeof F.labeledStatement;
    };
    readonly lexical: typeof FR.lexicalDeclarationFrom & {
        from: typeof FR.lexicalDeclarationFrom;
        strict: typeof F.lexicalDeclaration;
    };
    readonly literal: typeof FR.literalTypeFrom & {
        from: typeof FR.literalTypeFrom;
        strict: typeof F.literalType;
    };
    readonly lookup: typeof FR.lookupTypeFrom & {
        from: typeof FR.lookupTypeFrom;
        strict: typeof F.lookupType;
    };
    readonly member: typeof FR.memberExpressionFrom & {
        from: typeof FR.memberExpressionFrom;
        strict: typeof F.memberExpression;
    };
    readonly meta: typeof F.metaProperty;
    readonly nested: typeof FR.nestedIdentifierFrom & {
        from: typeof FR.nestedIdentifierFrom;
        strict: typeof F.nestedIdentifier;
    };
    readonly nestedType: typeof FR.nestedTypeIdentifierFrom & {
        from: typeof FR.nestedTypeIdentifierFrom;
        strict: typeof F.nestedTypeIdentifier;
    };
    readonly new: typeof FR.newExpressionFrom & {
        from: typeof FR.newExpressionFrom;
        strict: typeof F.newExpression;
    };
    readonly nonNull: typeof FR.nonNullExpressionFrom & {
        from: typeof FR.nonNullExpressionFrom;
        strict: typeof F.nonNullExpression;
    };
    readonly optional: typeof FR.optionalParameterFrom & {
        from: typeof FR.optionalParameterFrom;
        strict: typeof F.optionalParameter;
    };
    readonly optionalTuple: typeof FR.optionalTupleParameterFrom & {
        from: typeof FR.optionalTupleParameterFrom;
        strict: typeof F.optionalTupleParameter;
    };
    readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
        typed: typeof FR.parenthesizedExpressionUFormTypedFrom & {
            from: typeof FR.parenthesizedExpressionUFormTypedFrom;
            strict: typeof F.parenthesizedExpressionUFormTyped;
        };
        sequence: typeof FR.parenthesizedExpressionUFormSequenceFrom & {
            from: typeof FR.parenthesizedExpressionUFormSequenceFrom;
            strict: typeof F.parenthesizedExpressionUFormSequence;
        };
    };
    readonly predefined: typeof F.predefinedType;
    readonly privateProperty: typeof F.privatePropertyIdentifier;
    readonly readonly: typeof FR.readonlyTypeFrom & {
        from: typeof FR.readonlyTypeFrom;
        strict: typeof F.readonlyType;
    };
    readonly required: typeof FR.requiredParameterFrom & {
        from: typeof FR.requiredParameterFrom;
        strict: typeof F.requiredParameter;
    };
    readonly rest: typeof FR.restTypeFrom & {
        from: typeof FR.restTypeFrom;
        strict: typeof F.restType;
    };
    readonly return: typeof FR.returnStatementFrom & {
        from: typeof FR.returnStatementFrom;
        strict: typeof F.returnStatement;
    };
    readonly satisfies: typeof FR.satisfiesExpressionFrom & {
        from: typeof FR.satisfiesExpressionFrom;
        strict: typeof F.satisfiesExpression;
    };
    readonly sequence: typeof FR.sequenceExpressionFrom & {
        from: typeof FR.sequenceExpressionFrom;
        strict: typeof F.sequenceExpression;
    };
    readonly subscript: typeof FR.subscriptExpressionFrom & {
        from: typeof FR.subscriptExpressionFrom;
        strict: typeof F.subscriptExpression;
    };
    readonly switch: typeof FR.switchStatementFrom & {
        from: typeof FR.switchStatementFrom;
        strict: typeof F.switchStatement;
    };
    readonly template: typeof FR.templateStringFrom & {
        from: typeof FR.templateStringFrom;
        strict: typeof F.templateString;
    };
    readonly templateLiteral: typeof FR.templateLiteralTypeFrom & {
        from: typeof FR.templateLiteralTypeFrom;
        strict: typeof F.templateLiteralType;
    };
    readonly ternary: typeof FR.ternaryExpressionFrom & {
        from: typeof FR.ternaryExpressionFrom;
        strict: typeof F.ternaryExpression;
    };
    readonly throw: typeof FR.throwStatementFrom & {
        from: typeof FR.throwStatementFrom;
        strict: typeof F.throwStatement;
    };
    readonly try: typeof FR.tryStatementFrom & {
        from: typeof FR.tryStatementFrom;
        strict: typeof F.tryStatement;
    };
    readonly tuple: typeof FR.tupleParameterFrom & {
        from: typeof FR.tupleParameterFrom;
        strict: typeof F.tupleParameter;
    };
    readonly typeAlias: typeof FR.typeAliasDeclarationFrom & {
        from: typeof FR.typeAliasDeclarationFrom;
        strict: typeof F.typeAliasDeclaration;
    };
    readonly unary: typeof FR.unaryExpressionFrom & {
        from: typeof FR.unaryExpressionFrom;
        strict: typeof F.unaryExpression;
    };
    readonly union: typeof FR.unionTypeFrom & {
        from: typeof FR.unionTypeFrom;
        strict: typeof F.unionType;
    };
    readonly update: typeof FR.updateExpressionFrom & {
        from: typeof FR.updateExpressionFrom;
        strict: typeof F.updateExpression;
        postfix: typeof FR.updateExpressionUFormPostfixFrom & {
            from: typeof FR.updateExpressionUFormPostfixFrom;
            strict: typeof F.updateExpressionUFormPostfix;
        };
        prefix: typeof FR.updateExpressionUFormPrefixFrom & {
            from: typeof FR.updateExpressionUFormPrefixFrom;
            strict: typeof F.updateExpressionUFormPrefix;
        };
    };
    readonly variable: typeof FR.variableDeclarationFrom & {
        from: typeof FR.variableDeclarationFrom;
        strict: typeof F.variableDeclaration;
    };
    readonly while: typeof FR.whileStatementFrom & {
        from: typeof FR.whileStatementFrom;
        strict: typeof F.whileStatement;
    };
    readonly with: typeof FR.withStatementFrom & {
        from: typeof FR.withStatementFrom;
        strict: typeof F.withStatement;
    };
    readonly yield: typeof FR.yieldExpressionFrom & {
        from: typeof FR.yieldExpressionFrom;
        strict: typeof F.yieldExpression;
    };
    readonly destructuringPattern: {
        readonly object: typeof FR.objectPatternFrom & {
            from: typeof FR.objectPatternFrom;
            strict: typeof F.objectPattern;
        };
        readonly array: typeof FR.arrayPatternFrom & {
            from: typeof FR.arrayPatternFrom;
            strict: typeof F.arrayPattern;
        };
    };
    readonly expressions: {
        readonly sequence: typeof FR.sequenceExpressionFrom & {
            from: typeof FR.sequenceExpressionFrom;
            strict: typeof F.sequenceExpression;
        };
    };
    readonly formalParameter: {
        readonly required: typeof FR.requiredParameterFrom & {
            from: typeof FR.requiredParameterFrom;
            strict: typeof F.requiredParameter;
        };
        readonly optional: typeof FR.optionalParameterFrom & {
            from: typeof FR.optionalParameterFrom;
            strict: typeof F.optionalParameter;
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
        readonly nested: typeof FR.nestedIdentifierFrom & {
            from: typeof FR.nestedIdentifierFrom;
            strict: typeof F.nestedIdentifier;
        };
    };
    readonly jsxIdentifier: {
        readonly identifier: typeof F.identifier;
    };
    readonly moduleExportName: {
        readonly identifier: typeof F.identifier;
        readonly string: typeof FR.stringFrom & {
            from: typeof FR.stringFrom;
            strict: typeof F.string;
        };
    };
    readonly propertyIdentifier: {
        readonly identifier: typeof F.identifier;
    };
    readonly propertyName: {
        readonly identifier: typeof F.identifier;
        readonly privateProperty: typeof F.privatePropertyIdentifier;
        readonly string: typeof FR.stringFrom & {
            from: typeof FR.stringFrom;
            strict: typeof F.string;
        };
        readonly number: typeof F.number;
        readonly computedProperty: typeof FR.computedPropertyNameFrom & {
            from: typeof FR.computedPropertyNameFrom;
            strict: typeof F.computedPropertyName;
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
        readonly tuple: typeof FR.tupleParameterFrom & {
            from: typeof FR.tupleParameterFrom;
            strict: typeof F.tupleParameter;
        };
        readonly optionalTuple: typeof FR.optionalTupleParameterFrom & {
            from: typeof FR.optionalTupleParameterFrom;
            strict: typeof F.optionalTupleParameter;
        };
        readonly optional: typeof FR.optionalTypeFrom & {
            from: typeof FR.optionalTypeFrom;
            strict: typeof F.optionalType;
        };
        readonly rest: typeof FR.restTypeFrom & {
            from: typeof FR.restTypeFrom;
            strict: typeof F.restType;
        };
    };
    readonly declaration: {
        readonly function: typeof FR.functionDeclarationFrom & {
            from: typeof FR.functionDeclarationFrom;
            strict: typeof F.functionDeclaration;
        };
        readonly generatorFunction: typeof FR.generatorFunctionDeclarationFrom & {
            from: typeof FR.generatorFunctionDeclarationFrom;
            strict: typeof F.generatorFunctionDeclaration;
        };
        readonly class: typeof FR.classDeclarationFrom & {
            from: typeof FR.classDeclarationFrom;
            strict: typeof F.classDeclaration;
        };
        readonly lexical: typeof FR.lexicalDeclarationFrom & {
            from: typeof FR.lexicalDeclarationFrom;
            strict: typeof F.lexicalDeclaration;
        };
        readonly variable: typeof FR.variableDeclarationFrom & {
            from: typeof FR.variableDeclarationFrom;
            strict: typeof F.variableDeclaration;
        };
        readonly abstractClass: typeof FR.abstractClassDeclarationFrom & {
            from: typeof FR.abstractClassDeclarationFrom;
            strict: typeof F.abstractClassDeclaration;
        };
        readonly module: typeof FR.moduleFrom & {
            from: typeof FR.moduleFrom;
            strict: typeof F.module;
        };
        readonly internal: typeof FR.internalModuleFrom & {
            from: typeof FR.internalModuleFrom;
            strict: typeof F.internalModule;
        };
        readonly typeAlias: typeof FR.typeAliasDeclarationFrom & {
            from: typeof FR.typeAliasDeclarationFrom;
            strict: typeof F.typeAliasDeclaration;
        };
        readonly enum: typeof FR.enumDeclarationFrom & {
            from: typeof FR.enumDeclarationFrom;
            strict: typeof F.enumDeclaration;
        };
        readonly interface: typeof FR.interfaceDeclarationFrom & {
            from: typeof FR.interfaceDeclarationFrom;
            strict: typeof F.interfaceDeclaration;
        };
        readonly import: typeof FR.importAliasFrom & {
            from: typeof FR.importAliasFrom;
            strict: typeof F.importAlias;
        };
        readonly ambient: typeof FR.ambientDeclarationFrom & {
            from: typeof FR.ambientDeclarationFrom;
            strict: typeof F.ambientDeclaration;
            declaration: typeof FR.ambientDeclarationUFormDeclarationFrom & {
                from: typeof FR.ambientDeclarationUFormDeclarationFrom;
                strict: typeof F.ambientDeclarationUFormDeclaration;
            };
            global: typeof FR.ambientDeclarationUFormGlobalFrom & {
                from: typeof FR.ambientDeclarationUFormGlobalFrom;
                strict: typeof F.ambientDeclarationUFormGlobal;
            };
            module: typeof FR.ambientDeclarationUFormModuleFrom & {
                from: typeof FR.ambientDeclarationUFormModuleFrom;
                strict: typeof F.ambientDeclarationUFormModule;
            };
        };
    };
    readonly expression: {
        readonly as: typeof FR.asExpressionFrom & {
            from: typeof FR.asExpressionFrom;
            strict: typeof F.asExpression;
        };
        readonly satisfies: typeof FR.satisfiesExpressionFrom & {
            from: typeof FR.satisfiesExpressionFrom;
            strict: typeof F.satisfiesExpression;
        };
        readonly instantiation: typeof FR.instantiationExpressionFrom & {
            from: typeof FR.instantiationExpressionFrom;
            strict: typeof F.instantiationExpression;
        };
        readonly internal: typeof FR.internalModuleFrom & {
            from: typeof FR.internalModuleFrom;
            strict: typeof F.internalModule;
        };
        readonly type: typeof FR.typeAssertionFrom & {
            from: typeof FR.typeAssertionFrom;
            strict: typeof F.typeAssertion;
        };
        readonly assignment: typeof FR.assignmentExpressionFrom & {
            from: typeof FR.assignmentExpressionFrom;
            strict: typeof F.assignmentExpression;
        };
        readonly augmentedAssignment: typeof FR.augmentedAssignmentExpressionFrom & {
            from: typeof FR.augmentedAssignmentExpressionFrom;
            strict: typeof F.augmentedAssignmentExpression;
        };
        readonly await: typeof FR.awaitExpressionFrom & {
            from: typeof FR.awaitExpressionFrom;
            strict: typeof F.awaitExpression;
        };
        readonly unary: typeof FR.unaryExpressionFrom & {
            from: typeof FR.unaryExpressionFrom;
            strict: typeof F.unaryExpression;
        };
        readonly binary: typeof FR.binaryExpressionFrom & {
            from: typeof FR.binaryExpressionFrom;
            strict: typeof F.binaryExpression;
        };
        readonly ternary: typeof FR.ternaryExpressionFrom & {
            from: typeof FR.ternaryExpressionFrom;
            strict: typeof F.ternaryExpression;
        };
        readonly update: typeof FR.updateExpressionFrom & {
            from: typeof FR.updateExpressionFrom;
            strict: typeof F.updateExpression;
            postfix: typeof FR.updateExpressionUFormPostfixFrom & {
                from: typeof FR.updateExpressionUFormPostfixFrom;
                strict: typeof F.updateExpressionUFormPostfix;
            };
            prefix: typeof FR.updateExpressionUFormPrefixFrom & {
                from: typeof FR.updateExpressionUFormPrefixFrom;
                strict: typeof F.updateExpressionUFormPrefix;
            };
        };
        readonly new: typeof FR.newExpressionFrom & {
            from: typeof FR.newExpressionFrom;
            strict: typeof F.newExpression;
        };
        readonly yield: typeof FR.yieldExpressionFrom & {
            from: typeof FR.yieldExpressionFrom;
            strict: typeof F.yieldExpression;
        };
    };
    readonly pattern: {
        readonly member: typeof FR.memberExpressionFrom & {
            from: typeof FR.memberExpressionFrom;
            strict: typeof F.memberExpression;
        };
        readonly subscript: typeof FR.subscriptExpressionFrom & {
            from: typeof FR.subscriptExpressionFrom;
            strict: typeof F.subscriptExpression;
        };
        readonly undefined: typeof F.undefined_;
        readonly identifier: typeof F.identifier;
        readonly object: typeof FR.objectPatternFrom & {
            from: typeof FR.objectPatternFrom;
            strict: typeof F.objectPattern;
        };
        readonly array: typeof FR.arrayPatternFrom & {
            from: typeof FR.arrayPatternFrom;
            strict: typeof F.arrayPattern;
        };
        readonly nonNull: typeof FR.nonNullExpressionFrom & {
            from: typeof FR.nonNullExpressionFrom;
            strict: typeof F.nonNullExpression;
        };
        readonly rest: typeof FR.restPatternFrom & {
            from: typeof FR.restPatternFrom;
            strict: typeof F.restPattern;
        };
    };
    readonly primaryExpression: {
        readonly subscript: typeof FR.subscriptExpressionFrom & {
            from: typeof FR.subscriptExpressionFrom;
            strict: typeof F.subscriptExpression;
        };
        readonly member: typeof FR.memberExpressionFrom & {
            from: typeof FR.memberExpressionFrom;
            strict: typeof F.memberExpression;
        };
        readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
            from: typeof FR.parenthesizedExpressionFrom;
            strict: typeof F.parenthesizedExpression;
            typed: typeof FR.parenthesizedExpressionUFormTypedFrom & {
                from: typeof FR.parenthesizedExpressionUFormTypedFrom;
                strict: typeof F.parenthesizedExpressionUFormTyped;
            };
            sequence: typeof FR.parenthesizedExpressionUFormSequenceFrom & {
                from: typeof FR.parenthesizedExpressionUFormSequenceFrom;
                strict: typeof F.parenthesizedExpressionUFormSequence;
            };
        };
        readonly undefined: typeof F.undefined_;
        readonly identifier: typeof F.identifier;
        readonly this: typeof F.this_;
        readonly super: typeof F.super_;
        readonly number: typeof F.number;
        readonly string: typeof FR.stringFrom & {
            from: typeof FR.stringFrom;
            strict: typeof F.string;
        };
        readonly template: typeof FR.templateStringFrom & {
            from: typeof FR.templateStringFrom;
            strict: typeof F.templateString;
        };
        readonly regex: typeof FR.regexFrom & {
            from: typeof FR.regexFrom;
            strict: typeof F.regex;
        };
        readonly true: typeof F.true_;
        readonly false: typeof F.false_;
        readonly null: typeof F.null_;
        readonly object: typeof FR.objectFrom & {
            from: typeof FR.objectFrom;
            strict: typeof F.object;
        };
        readonly array: typeof FR.arrayFrom & {
            from: typeof FR.arrayFrom;
            strict: typeof F.array;
        };
        readonly function: typeof FR.functionExpressionFrom & {
            from: typeof FR.functionExpressionFrom;
            strict: typeof F.functionExpression;
        };
        readonly arrow: typeof FR.arrowFunctionFrom & {
            from: typeof FR.arrowFunctionFrom;
            strict: typeof F.arrowFunction;
            parameter: typeof FR.arrowFunctionUFormParameterFrom & {
                from: typeof FR.arrowFunctionUFormParameterFrom;
                strict: typeof F.arrowFunctionUFormParameter;
            };
            callSignature: typeof FR.arrowFunctionUFormUCallSignatureFrom & {
                from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
                strict: typeof F.arrowFunctionUFormUCallSignature;
            };
            _call_signature: typeof FR.arrowFunctionUFormUCallSignatureFrom & {
                from: typeof FR.arrowFunctionUFormUCallSignatureFrom;
                strict: typeof F.arrowFunctionUFormUCallSignature;
            };
        };
        readonly generator: typeof FR.generatorFunctionFrom & {
            from: typeof FR.generatorFunctionFrom;
            strict: typeof F.generatorFunction;
        };
        readonly class: typeof FR.class_From & {
            from: typeof FR.class_From;
            strict: typeof F.class_;
        };
        readonly meta: typeof F.metaProperty;
        readonly call: typeof FR.callExpressionFrom & {
            from: typeof FR.callExpressionFrom;
            strict: typeof F.callExpression;
            call: typeof FR.callExpressionUFormCallFrom & {
                from: typeof FR.callExpressionUFormCallFrom;
                strict: typeof F.callExpressionUFormCall;
            };
            templateCall: typeof FR.callExpressionUFormTemplateCallFrom & {
                from: typeof FR.callExpressionUFormTemplateCallFrom;
                strict: typeof F.callExpressionUFormTemplateCall;
            };
            template_call: typeof FR.callExpressionUFormTemplateCallFrom & {
                from: typeof FR.callExpressionUFormTemplateCallFrom;
                strict: typeof F.callExpressionUFormTemplateCall;
            };
            member: typeof FR.callExpressionUFormMemberFrom & {
                from: typeof FR.callExpressionUFormMemberFrom;
                strict: typeof F.callExpressionUFormMember;
            };
        };
        readonly nonNull: typeof FR.nonNullExpressionFrom & {
            from: typeof FR.nonNullExpressionFrom;
            strict: typeof F.nonNullExpression;
        };
    };
    readonly primaryType: {
        readonly parenthesized: typeof FR.parenthesizedTypeFrom & {
            from: typeof FR.parenthesizedTypeFrom;
            strict: typeof F.parenthesizedType;
        };
        readonly predefined: typeof F.predefinedType;
        readonly nestedType: typeof FR.nestedTypeIdentifierFrom & {
            from: typeof FR.nestedTypeIdentifierFrom;
            strict: typeof F.nestedTypeIdentifier;
        };
        readonly generic: typeof FR.genericTypeFrom & {
            from: typeof FR.genericTypeFrom;
            strict: typeof F.genericType;
        };
        readonly object: typeof FR.objectTypeFrom & {
            from: typeof FR.objectTypeFrom;
            strict: typeof F.objectType;
        };
        readonly array: typeof FR.arrayTypeFrom & {
            from: typeof FR.arrayTypeFrom;
            strict: typeof F.arrayType;
        };
        readonly tuple: typeof FR.tupleTypeFrom & {
            from: typeof FR.tupleTypeFrom;
            strict: typeof F.tupleType;
        };
        readonly flowMaybe: typeof FR.flowMaybeTypeFrom & {
            from: typeof FR.flowMaybeTypeFrom;
            strict: typeof F.flowMaybeType;
        };
        readonly type: typeof FR.typeQueryFrom & {
            from: typeof FR.typeQueryFrom;
            strict: typeof F.typeQuery;
        };
        readonly indexType: typeof FR.indexTypeQueryFrom & {
            from: typeof FR.indexTypeQueryFrom;
            strict: typeof F.indexTypeQuery;
        };
        readonly this: typeof F.this_;
        readonly literal: typeof FR.literalTypeFrom & {
            from: typeof FR.literalTypeFrom;
            strict: typeof F.literalType;
        };
        readonly lookup: typeof FR.lookupTypeFrom & {
            from: typeof FR.lookupTypeFrom;
            strict: typeof F.lookupType;
        };
        readonly conditional: typeof FR.conditionalTypeFrom & {
            from: typeof FR.conditionalTypeFrom;
            strict: typeof F.conditionalType;
        };
        readonly templateLiteral: typeof FR.templateLiteralTypeFrom & {
            from: typeof FR.templateLiteralTypeFrom;
            strict: typeof F.templateLiteralType;
        };
        readonly intersection: typeof FR.intersectionTypeFrom & {
            from: typeof FR.intersectionTypeFrom;
            strict: typeof F.intersectionType;
        };
        readonly union: typeof FR.unionTypeFrom & {
            from: typeof FR.unionTypeFrom;
            strict: typeof F.unionType;
        };
    };
    readonly statement: {
        readonly export: typeof FR.exportStatementFrom & {
            from: typeof FR.exportStatementFrom;
            strict: typeof F.exportStatement;
            default: typeof FR.exportStatementUFormDefaultFrom & {
                from: typeof FR.exportStatementUFormDefaultFrom;
                strict: typeof F.exportStatementUFormDefault;
            };
            typeExport: typeof FR.exportStatementUFormTypeExportFrom & {
                from: typeof FR.exportStatementUFormTypeExportFrom;
                strict: typeof F.exportStatementUFormTypeExport;
            };
            type_export: typeof FR.exportStatementUFormTypeExportFrom & {
                from: typeof FR.exportStatementUFormTypeExportFrom;
                strict: typeof F.exportStatementUFormTypeExport;
            };
            equalsExport: typeof FR.exportStatementUFormEqualsExportFrom & {
                from: typeof FR.exportStatementUFormEqualsExportFrom;
                strict: typeof F.exportStatementUFormEqualsExport;
            };
            equals_export: typeof FR.exportStatementUFormEqualsExportFrom & {
                from: typeof FR.exportStatementUFormEqualsExportFrom;
                strict: typeof F.exportStatementUFormEqualsExport;
            };
            namespaceExport: typeof FR.exportStatementUFormNamespaceExportFrom & {
                from: typeof FR.exportStatementUFormNamespaceExportFrom;
                strict: typeof F.exportStatementUFormNamespaceExport;
            };
            namespace_export: typeof FR.exportStatementUFormNamespaceExportFrom & {
                from: typeof FR.exportStatementUFormNamespaceExportFrom;
                strict: typeof F.exportStatementUFormNamespaceExport;
            };
        };
        readonly import: typeof FR.importStatementFrom & {
            from: typeof FR.importStatementFrom;
            strict: typeof F.importStatement;
        };
        readonly debugger: typeof FR.debuggerStatementFrom & {
            from: typeof FR.debuggerStatementFrom;
            strict: typeof F.debuggerStatement;
        };
        readonly expression: typeof FR.expressionStatementFrom & {
            from: typeof FR.expressionStatementFrom;
            strict: typeof F.expressionStatement;
        };
        readonly statementBlock: typeof FR.statementBlockFrom & {
            from: typeof FR.statementBlockFrom;
            strict: typeof F.statementBlock;
        };
        readonly if: typeof FR.ifStatementFrom & {
            from: typeof FR.ifStatementFrom;
            strict: typeof F.ifStatement;
        };
        readonly switch: typeof FR.switchStatementFrom & {
            from: typeof FR.switchStatementFrom;
            strict: typeof F.switchStatement;
        };
        readonly for: typeof FR.forStatementFrom & {
            from: typeof FR.forStatementFrom;
            strict: typeof F.forStatement;
        };
        readonly forIn: typeof FR.forInStatementFrom & {
            from: typeof FR.forInStatementFrom;
            strict: typeof F.forInStatement;
        };
        readonly while: typeof FR.whileStatementFrom & {
            from: typeof FR.whileStatementFrom;
            strict: typeof F.whileStatement;
        };
        readonly do: typeof FR.doStatementFrom & {
            from: typeof FR.doStatementFrom;
            strict: typeof F.doStatement;
        };
        readonly try: typeof FR.tryStatementFrom & {
            from: typeof FR.tryStatementFrom;
            strict: typeof F.tryStatement;
        };
        readonly with: typeof FR.withStatementFrom & {
            from: typeof FR.withStatementFrom;
            strict: typeof F.withStatement;
        };
        readonly break: typeof FR.breakStatementFrom & {
            from: typeof FR.breakStatementFrom;
            strict: typeof F.breakStatement;
        };
        readonly continue: typeof FR.continueStatementFrom & {
            from: typeof FR.continueStatementFrom;
            strict: typeof F.continueStatement;
        };
        readonly return: typeof FR.returnStatementFrom & {
            from: typeof FR.returnStatementFrom;
            strict: typeof F.returnStatement;
        };
        readonly throw: typeof FR.throwStatementFrom & {
            from: typeof FR.throwStatementFrom;
            strict: typeof F.throwStatement;
        };
        readonly labeled: typeof FR.labeledStatementFrom & {
            from: typeof FR.labeledStatementFrom;
            strict: typeof F.labeledStatement;
        };
    };
    readonly type: {
        readonly function: typeof FR.functionTypeFrom & {
            from: typeof FR.functionTypeFrom;
            strict: typeof F.functionType;
        };
        readonly readonly: typeof FR.readonlyTypeFrom & {
            from: typeof FR.readonlyTypeFrom;
            strict: typeof F.readonlyType;
        };
        readonly constructor: typeof FR.constructorTypeFrom & {
            from: typeof FR.constructorTypeFrom;
            strict: typeof F.constructorType;
        };
        readonly infer: typeof FR.inferTypeFrom & {
            from: typeof FR.inferTypeFrom;
            strict: typeof F.inferType;
        };
    };
    readonly from: {
        readonly boolean: (value: boolean) => ReturnType<typeof F.true_> | ReturnType<typeof F.false_>;
        readonly number: (value: number) => ReturnType<typeof F.number>;
        readonly comment: (text: string) => ReturnType<typeof F.comment>;
        readonly type: (name: string) => ReturnType<typeof F.typeIdentifier>;
        readonly identifier: (name: string) => ReturnType<typeof F.identifier>;
        readonly function: typeof FR.functionSignatureFrom & {
            from: typeof FR.functionSignatureFrom;
            strict: typeof F.functionSignature;
        };
        readonly class: typeof FR.abstractClassDeclarationFrom & {
            from: typeof FR.abstractClassDeclarationFrom;
            strict: typeof F.abstractClassDeclaration;
        };
        readonly method: typeof FR.methodSignatureFrom & {
            from: typeof FR.methodSignatureFrom;
            strict: typeof F.methodSignature;
        };
        readonly module: typeof FR.moduleFrom & {
            from: typeof FR.moduleFrom;
            strict: typeof F.module;
        };
        readonly interface: typeof FR.interfaceDeclarationFrom & {
            from: typeof FR.interfaceDeclarationFrom;
            strict: typeof F.interfaceDeclaration;
        };
    };
};
//# sourceMappingURL=ir.d.ts.map