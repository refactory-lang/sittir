import * as F from './factories.js';
import * as FR from './from.js';
export declare const compoundStatement: {
    readonly if: typeof FR.ifStatementFrom & {
        from: typeof FR.ifStatementFrom;
        strict: typeof F.ifStatement;
    };
    readonly for: typeof FR.forStatementFrom & {
        from: typeof FR.forStatementFrom;
        strict: typeof F.forStatement;
    };
    readonly while: typeof FR.whileStatementFrom & {
        from: typeof FR.whileStatementFrom;
        strict: typeof F.whileStatement;
    };
    readonly try: typeof FR.tryStatementFrom & {
        from: typeof FR.tryStatementFrom;
        strict: typeof F.tryStatement;
    };
    readonly with: typeof FR.withStatementFrom & {
        from: typeof FR.withStatementFrom;
        strict: typeof F.withStatement;
    };
    readonly function: typeof FR.functionDefinitionFrom & {
        from: typeof FR.functionDefinitionFrom;
        strict: typeof F.functionDefinition;
    };
    readonly class: typeof FR.classDefinitionFrom & {
        from: typeof FR.classDefinitionFrom;
        strict: typeof F.classDefinition;
    };
    readonly decorated: typeof FR.decoratedDefinitionFrom & {
        from: typeof FR.decoratedDefinitionFrom;
        strict: typeof F.decoratedDefinition;
    };
    readonly match: typeof FR.matchStatementFrom & {
        from: typeof FR.matchStatementFrom;
        strict: typeof F.matchStatement;
    };
};
export declare const dictPatternKv: {
    readonly splat: typeof FR.splatPatternFrom & {
        from: typeof FR.splatPatternFrom;
        strict: typeof F.splatPattern;
    };
};
export declare const expressionWithinForInClause: {
    readonly lambdaWithinForIn: typeof FR.lambdaWithinForInClauseFrom & {
        from: typeof FR.lambdaWithinForInClauseFrom;
        strict: typeof F.lambdaWithinForInClause;
    };
};
export declare const expressions: {
    readonly expression: typeof FR.expressionListFrom & {
        from: typeof FR.expressionListFrom;
        strict: typeof F.expressionList;
    };
};
export declare const fExpression: {
    readonly expression: typeof FR.expressionListFrom & {
        from: typeof FR.expressionListFrom;
        strict: typeof F.expressionList;
    };
    readonly pattern: typeof FR.patternListFrom & {
        from: typeof FR.patternListFrom;
        strict: typeof F.patternList;
    };
    readonly yield: typeof FR.yield_From & {
        from: typeof FR.yield_From;
        strict: typeof F.yield_;
    };
};
export declare const leftHandSide: {
    readonly pattern: typeof FR.patternListFrom & {
        from: typeof FR.patternListFrom;
        strict: typeof F.patternList;
    };
};
export declare const namedExpressionLhs: {
    readonly identifier: typeof F.identifier;
};
export declare const rightHandSide: {
    readonly expression: typeof FR.expressionListFrom & {
        from: typeof FR.expressionListFrom;
        strict: typeof F.expressionList;
    };
    readonly assignment: typeof FR.assignmentFrom & {
        from: typeof FR.assignmentFrom;
        strict: typeof F.assignment;
    };
    readonly augmented: typeof FR.augmentedAssignmentFrom & {
        from: typeof FR.augmentedAssignmentFrom;
        strict: typeof F.augmentedAssignment;
    };
    readonly pattern: typeof FR.patternListFrom & {
        from: typeof FR.patternListFrom;
        strict: typeof F.patternList;
    };
    readonly yield: typeof FR.yield_From & {
        from: typeof FR.yield_From;
        strict: typeof F.yield_;
    };
};
export declare const simplePattern: {
    readonly class: typeof FR.classPatternFrom & {
        from: typeof FR.classPatternFrom;
        strict: typeof F.classPattern;
    };
    readonly splat: typeof FR.splatPatternFrom & {
        from: typeof FR.splatPatternFrom;
        strict: typeof F.splatPattern;
    };
    readonly union: typeof FR.unionPatternFrom & {
        from: typeof FR.unionPatternFrom;
        strict: typeof F.unionPattern;
    };
    readonly dict: typeof FR.dictPatternFrom & {
        from: typeof FR.dictPatternFrom;
        strict: typeof F.dictPattern;
    };
    readonly string: typeof FR.stringFrom & {
        from: typeof FR.stringFrom;
        strict: typeof F.string;
    };
    readonly concatenated: typeof FR.concatenatedStringFrom & {
        from: typeof FR.concatenatedStringFrom;
        strict: typeof F.concatenatedString;
    };
    readonly true: typeof F.true_;
    readonly false: typeof F.false_;
    readonly none: typeof F.none;
    readonly complex: typeof FR.complexPatternFrom & {
        from: typeof FR.complexPatternFrom;
        strict: typeof F.complexPattern;
    };
    readonly dotted: typeof FR.dottedNameFrom & {
        from: typeof FR.dottedNameFrom;
        strict: typeof F.dottedName;
    };
};
export declare const simpleStatement: {
    readonly futureImport: typeof FR.futureImportStatementFrom & {
        from: typeof FR.futureImportStatementFrom;
        strict: typeof F.futureImportStatement;
    };
    readonly import: typeof FR.importStatementFrom & {
        from: typeof FR.importStatementFrom;
        strict: typeof F.importStatement;
    };
    readonly importFrom: typeof FR.importFromStatementFrom & {
        from: typeof FR.importFromStatementFrom;
        strict: typeof F.importFromStatement;
    };
    readonly print: typeof FR.printStatementFrom & {
        from: typeof FR.printStatementFrom;
        strict: typeof F.printStatement;
    };
    readonly assert: typeof FR.assertStatementFrom & {
        from: typeof FR.assertStatementFrom;
        strict: typeof F.assertStatement;
    };
    readonly expression: typeof FR.expressionStatementFrom & {
        from: typeof FR.expressionStatementFrom;
        strict: typeof F.expressionStatement;
    };
    readonly return: typeof FR.returnStatementFrom & {
        from: typeof FR.returnStatementFrom;
        strict: typeof F.returnStatement;
    };
    readonly delete: typeof FR.deleteStatementFrom & {
        from: typeof FR.deleteStatementFrom;
        strict: typeof F.deleteStatement;
    };
    readonly raise: typeof FR.raiseStatementFrom & {
        from: typeof FR.raiseStatementFrom;
        strict: typeof F.raiseStatement;
    };
    readonly pass: typeof F.passStatement;
    readonly break: typeof F.breakStatement;
    readonly continue: typeof F.continueStatement;
    readonly global: typeof FR.globalStatementFrom & {
        from: typeof FR.globalStatementFrom;
        strict: typeof F.globalStatement;
    };
    readonly nonlocal: typeof FR.nonlocalStatementFrom & {
        from: typeof FR.nonlocalStatementFrom;
        strict: typeof F.nonlocalStatement;
    };
    readonly exec: typeof FR.execStatementFrom & {
        from: typeof FR.execStatementFrom;
        strict: typeof F.execStatement;
    };
    readonly typeAlias: typeof FR.typeAliasStatementFrom & {
        from: typeof FR.typeAliasStatementFrom;
        strict: typeof F.typeAliasStatement;
    };
};
export declare const statement: {
    readonly if: typeof FR.ifStatementFrom & {
        from: typeof FR.ifStatementFrom;
        strict: typeof F.ifStatement;
    };
    readonly for: typeof FR.forStatementFrom & {
        from: typeof FR.forStatementFrom;
        strict: typeof F.forStatement;
    };
    readonly while: typeof FR.whileStatementFrom & {
        from: typeof FR.whileStatementFrom;
        strict: typeof F.whileStatement;
    };
    readonly try: typeof FR.tryStatementFrom & {
        from: typeof FR.tryStatementFrom;
        strict: typeof F.tryStatement;
    };
    readonly with: typeof FR.withStatementFrom & {
        from: typeof FR.withStatementFrom;
        strict: typeof F.withStatement;
    };
    readonly function: typeof FR.functionDefinitionFrom & {
        from: typeof FR.functionDefinitionFrom;
        strict: typeof F.functionDefinition;
    };
    readonly class: typeof FR.classDefinitionFrom & {
        from: typeof FR.classDefinitionFrom;
        strict: typeof F.classDefinition;
    };
    readonly decorated: typeof FR.decoratedDefinitionFrom & {
        from: typeof FR.decoratedDefinitionFrom;
        strict: typeof F.decoratedDefinition;
    };
    readonly match: typeof FR.matchStatementFrom & {
        from: typeof FR.matchStatementFrom;
        strict: typeof F.matchStatement;
    };
};
export declare const expression: {
    readonly comparison: typeof FR.comparisonOperatorFrom & {
        from: typeof FR.comparisonOperatorFrom;
        strict: typeof F.comparisonOperator;
    };
    readonly not: typeof FR.notOperatorFrom & {
        from: typeof FR.notOperatorFrom;
        strict: typeof F.notOperator;
    };
    readonly boolean: typeof FR.booleanOperatorFrom & {
        from: typeof FR.booleanOperatorFrom;
        strict: typeof F.booleanOperator;
    };
    readonly lambda: typeof FR.lambdaFrom & {
        from: typeof FR.lambdaFrom;
        strict: typeof F.lambda;
    };
    readonly conditional: typeof FR.conditionalExpressionFrom & {
        from: typeof FR.conditionalExpressionFrom;
        strict: typeof F.conditionalExpression;
    };
    readonly named: typeof FR.namedExpressionFrom & {
        from: typeof FR.namedExpressionFrom;
        strict: typeof F.namedExpression;
    };
    readonly as: typeof FR.asPatternFrom & {
        from: typeof FR.asPatternFrom;
        strict: typeof F.asPattern;
    };
};
export declare const parameter: {
    readonly identifier: typeof F.identifier;
    readonly typed: typeof FR.typedParameterFrom & {
        from: typeof FR.typedParameterFrom;
        strict: typeof F.typedParameter;
    };
    readonly default: typeof FR.defaultParameterFrom & {
        from: typeof FR.defaultParameterFrom;
        strict: typeof F.defaultParameter;
    };
    readonly typedDefault: typeof FR.typedDefaultParameterFrom & {
        from: typeof FR.typedDefaultParameterFrom;
        strict: typeof F.typedDefaultParameter;
    };
    readonly listSplat: typeof FR.listSplatPatternFrom & {
        from: typeof FR.listSplatPatternFrom;
        strict: typeof F.listSplatPattern;
    };
    readonly tuple: typeof FR.tuplePatternFrom & {
        from: typeof FR.tuplePatternFrom;
        strict: typeof F.tuplePattern;
    };
    readonly dictionarySplat: typeof FR.dictionarySplatPatternFrom & {
        from: typeof FR.dictionarySplatPatternFrom;
        strict: typeof F.dictionarySplatPattern;
    };
};
export declare const pattern: {
    readonly identifier: typeof F.identifier;
    readonly subscript: typeof FR.subscriptFrom & {
        from: typeof FR.subscriptFrom;
        strict: typeof F.subscript;
    };
    readonly attribute: typeof FR.attributeFrom & {
        from: typeof FR.attributeFrom;
        strict: typeof F.attribute;
    };
    readonly listSplat: typeof FR.listSplatPatternFrom & {
        from: typeof FR.listSplatPatternFrom;
        strict: typeof F.listSplatPattern;
    };
    readonly tuple: typeof FR.tuplePatternFrom & {
        from: typeof FR.tuplePatternFrom;
        strict: typeof F.tuplePattern;
    };
    readonly list: typeof FR.listPatternFrom & {
        from: typeof FR.listPatternFrom;
        strict: typeof F.listPattern;
    };
};
export declare const primaryExpression: {
    readonly await: typeof FR.await_From & {
        from: typeof FR.await_From;
        strict: typeof F.await_;
    };
    readonly binary: typeof FR.binaryOperatorFrom & {
        from: typeof FR.binaryOperatorFrom;
        strict: typeof F.binaryOperator;
    };
    readonly identifier: typeof F.identifier;
    readonly string: typeof FR.stringFrom & {
        from: typeof FR.stringFrom;
        strict: typeof F.string;
    };
    readonly concatenated: typeof FR.concatenatedStringFrom & {
        from: typeof FR.concatenatedStringFrom;
        strict: typeof F.concatenatedString;
    };
    readonly integer: typeof F.integer;
    readonly float: typeof F.float;
    readonly true: typeof F.true_;
    readonly false: typeof F.false_;
    readonly none: typeof F.none;
    readonly unary: typeof FR.unaryOperatorFrom & {
        from: typeof FR.unaryOperatorFrom;
        strict: typeof F.unaryOperator;
    };
    readonly attribute: typeof FR.attributeFrom & {
        from: typeof FR.attributeFrom;
        strict: typeof F.attribute;
    };
    readonly subscript: typeof FR.subscriptFrom & {
        from: typeof FR.subscriptFrom;
        strict: typeof F.subscript;
    };
    readonly call: typeof FR.callFrom & {
        from: typeof FR.callFrom;
        strict: typeof F.call;
    };
    readonly list: typeof FR.listFrom & {
        from: typeof FR.listFrom;
        strict: typeof F.list;
    };
    readonly dictionary: typeof FR.dictionaryFrom & {
        from: typeof FR.dictionaryFrom;
        strict: typeof F.dictionary;
    };
    readonly set: typeof FR.setFrom & {
        from: typeof FR.setFrom;
        strict: typeof F.set;
    };
    readonly tuple: typeof FR.tupleFrom & {
        from: typeof FR.tupleFrom;
        strict: typeof F.tuple;
    };
    readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
    };
    readonly generator: typeof FR.generatorExpressionFrom & {
        from: typeof FR.generatorExpressionFrom;
        strict: typeof F.generatorExpression;
    };
    readonly listSplat: typeof FR.listSplatPatternFrom & {
        from: typeof FR.listSplatPatternFrom;
        strict: typeof F.listSplatPattern;
    };
};
export declare const from: {
    boolean(value: boolean): ReturnType<typeof F.true_> | ReturnType<typeof F.false_>;
    number: ((value: number) => ReturnType<typeof F.integer> | ReturnType<typeof F.float>) & {
        integer(value: number): ReturnType<typeof F.integer>;
        float(value: number): ReturnType<typeof F.float>;
    };
    comment(text: string): ReturnType<typeof F.comment>;
    type(name: string): ReturnType<typeof F.identifier>;
    identifier(name: string): ReturnType<typeof F.identifier>;
    readonly function: typeof FR.functionDefinitionFrom & {
        from: typeof FR.functionDefinitionFrom;
        strict: typeof F.functionDefinition;
    };
    readonly class: typeof FR.classDefinitionFrom & {
        from: typeof FR.classDefinitionFrom;
        strict: typeof F.classDefinition;
    };
};
export declare const ir: {
    readonly aliasedImport: typeof FR.aliasedImportFrom & {
        from: typeof FR.aliasedImportFrom;
        strict: typeof F.aliasedImport;
    };
    readonly argumentList: typeof FR.argumentListFrom & {
        from: typeof FR.argumentListFrom;
        strict: typeof F.argumentList;
    };
    readonly asPattern: typeof FR.asPatternFrom & {
        from: typeof FR.asPatternFrom;
        strict: typeof F.asPattern;
    };
    readonly assertStatement: typeof FR.assertStatementFrom & {
        from: typeof FR.assertStatementFrom;
        strict: typeof F.assertStatement;
    };
    readonly assignment: typeof FR.assignmentFrom & {
        from: typeof FR.assignmentFrom;
        strict: typeof F.assignment;
    };
    readonly attribute: typeof FR.attributeFrom & {
        from: typeof FR.attributeFrom;
        strict: typeof F.attribute;
    };
    readonly augmentedAssignment: typeof FR.augmentedAssignmentFrom & {
        from: typeof FR.augmentedAssignmentFrom;
        strict: typeof F.augmentedAssignment;
    };
    readonly await: typeof FR.await_From & {
        from: typeof FR.await_From;
        strict: typeof F.await_;
    };
    readonly binaryOperator: typeof FR.binaryOperatorFrom & {
        from: typeof FR.binaryOperatorFrom;
        strict: typeof F.binaryOperator;
    };
    readonly block: typeof FR.blockFrom & {
        from: typeof FR.blockFrom;
        strict: typeof F.block;
    };
    readonly booleanOperator: typeof FR.booleanOperatorFrom & {
        from: typeof FR.booleanOperatorFrom;
        strict: typeof F.booleanOperator;
    };
    readonly call: typeof FR.callFrom & {
        from: typeof FR.callFrom;
        strict: typeof F.call;
    };
    readonly caseClause: typeof FR.caseClauseFrom & {
        from: typeof FR.caseClauseFrom;
        strict: typeof F.caseClause;
    };
    readonly casePattern: typeof FR.casePatternFrom & {
        from: typeof FR.casePatternFrom;
        strict: typeof F.casePattern;
    };
    readonly chevron: typeof FR.chevronFrom & {
        from: typeof FR.chevronFrom;
        strict: typeof F.chevron;
    };
    readonly classDefinition: typeof FR.classDefinitionFrom & {
        from: typeof FR.classDefinitionFrom;
        strict: typeof F.classDefinition;
    };
    readonly classPattern: typeof FR.classPatternFrom & {
        from: typeof FR.classPatternFrom;
        strict: typeof F.classPattern;
    };
    readonly comparisonOperator: typeof FR.comparisonOperatorFrom & {
        from: typeof FR.comparisonOperatorFrom;
        strict: typeof F.comparisonOperator;
    };
    readonly complexPattern: typeof FR.complexPatternFrom & {
        from: typeof FR.complexPatternFrom;
        strict: typeof F.complexPattern;
    };
    readonly concatenatedString: typeof FR.concatenatedStringFrom & {
        from: typeof FR.concatenatedStringFrom;
        strict: typeof F.concatenatedString;
    };
    readonly conditionalExpression: typeof FR.conditionalExpressionFrom & {
        from: typeof FR.conditionalExpressionFrom;
        strict: typeof F.conditionalExpression;
    };
    readonly constrainedType: typeof FR.constrainedTypeFrom & {
        from: typeof FR.constrainedTypeFrom;
        strict: typeof F.constrainedType;
    };
    readonly decoratedDefinition: typeof FR.decoratedDefinitionFrom & {
        from: typeof FR.decoratedDefinitionFrom;
        strict: typeof F.decoratedDefinition;
    };
    readonly decorator: typeof FR.decoratorFrom & {
        from: typeof FR.decoratorFrom;
        strict: typeof F.decorator;
    };
    readonly defaultParameter: typeof FR.defaultParameterFrom & {
        from: typeof FR.defaultParameterFrom;
        strict: typeof F.defaultParameter;
    };
    readonly deleteStatement: typeof FR.deleteStatementFrom & {
        from: typeof FR.deleteStatementFrom;
        strict: typeof F.deleteStatement;
    };
    readonly dictPattern: typeof FR.dictPatternFrom & {
        from: typeof FR.dictPatternFrom;
        strict: typeof F.dictPattern;
    };
    readonly dictionary: typeof FR.dictionaryFrom & {
        from: typeof FR.dictionaryFrom;
        strict: typeof F.dictionary;
    };
    readonly dictionaryComprehension: typeof FR.dictionaryComprehensionFrom & {
        from: typeof FR.dictionaryComprehensionFrom;
        strict: typeof F.dictionaryComprehension;
    };
    readonly dictionarySplat: typeof FR.dictionarySplatFrom & {
        from: typeof FR.dictionarySplatFrom;
        strict: typeof F.dictionarySplat;
    };
    readonly dictionarySplatPattern: typeof FR.dictionarySplatPatternFrom & {
        from: typeof FR.dictionarySplatPatternFrom;
        strict: typeof F.dictionarySplatPattern;
    };
    readonly dottedName: typeof FR.dottedNameFrom & {
        from: typeof FR.dottedNameFrom;
        strict: typeof F.dottedName;
    };
    readonly elifClause: typeof FR.elifClauseFrom & {
        from: typeof FR.elifClauseFrom;
        strict: typeof F.elifClause;
    };
    readonly elseClause: typeof FR.elseClauseFrom & {
        from: typeof FR.elseClauseFrom;
        strict: typeof F.elseClause;
    };
    readonly exceptClause: typeof FR.exceptClauseFrom & {
        from: typeof FR.exceptClauseFrom;
        strict: typeof F.exceptClause;
    };
    readonly execStatement: typeof FR.execStatementFrom & {
        from: typeof FR.execStatementFrom;
        strict: typeof F.execStatement;
    };
    readonly expressionList: typeof FR.expressionListFrom & {
        from: typeof FR.expressionListFrom;
        strict: typeof F.expressionList;
    };
    readonly expressionStatement: typeof FR.expressionStatementFrom & {
        from: typeof FR.expressionStatementFrom;
        strict: typeof F.expressionStatement;
    };
    readonly finallyClause: typeof FR.finallyClauseFrom & {
        from: typeof FR.finallyClauseFrom;
        strict: typeof F.finallyClause;
    };
    readonly forInClause: typeof FR.forInClauseFrom & {
        from: typeof FR.forInClauseFrom;
        strict: typeof F.forInClause;
    };
    readonly forStatement: typeof FR.forStatementFrom & {
        from: typeof FR.forStatementFrom;
        strict: typeof F.forStatement;
    };
    readonly formatSpecifier: typeof FR.formatSpecifierFrom & {
        from: typeof FR.formatSpecifierFrom;
        strict: typeof F.formatSpecifier;
    };
    readonly functionDefinition: typeof FR.functionDefinitionFrom & {
        from: typeof FR.functionDefinitionFrom;
        strict: typeof F.functionDefinition;
    };
    readonly futureImportStatement: typeof FR.futureImportStatementFrom & {
        from: typeof FR.futureImportStatementFrom;
        strict: typeof F.futureImportStatement;
    };
    readonly generatorExpression: typeof FR.generatorExpressionFrom & {
        from: typeof FR.generatorExpressionFrom;
        strict: typeof F.generatorExpression;
    };
    readonly genericType: typeof FR.genericTypeFrom & {
        from: typeof FR.genericTypeFrom;
        strict: typeof F.genericType;
    };
    readonly globalStatement: typeof FR.globalStatementFrom & {
        from: typeof FR.globalStatementFrom;
        strict: typeof F.globalStatement;
    };
    readonly ifClause: typeof FR.ifClauseFrom & {
        from: typeof FR.ifClauseFrom;
        strict: typeof F.ifClause;
    };
    readonly ifStatement: typeof FR.ifStatementFrom & {
        from: typeof FR.ifStatementFrom;
        strict: typeof F.ifStatement;
    };
    readonly importFromStatement: typeof FR.importFromStatementFrom & {
        from: typeof FR.importFromStatementFrom;
        strict: typeof F.importFromStatement;
    };
    readonly importStatement: typeof FR.importStatementFrom & {
        from: typeof FR.importStatementFrom;
        strict: typeof F.importStatement;
    };
    readonly interpolation: typeof FR.interpolationFrom & {
        from: typeof FR.interpolationFrom;
        strict: typeof F.interpolation;
    };
    readonly keywordArgument: typeof FR.keywordArgumentFrom & {
        from: typeof FR.keywordArgumentFrom;
        strict: typeof F.keywordArgument;
    };
    readonly keywordPattern: typeof FR.keywordPatternFrom & {
        from: typeof FR.keywordPatternFrom;
        strict: typeof F.keywordPattern;
    };
    readonly lambda: typeof FR.lambdaFrom & {
        from: typeof FR.lambdaFrom;
        strict: typeof F.lambda;
    };
    readonly lambdaParameters: typeof FR.lambdaParametersFrom & {
        from: typeof FR.lambdaParametersFrom;
        strict: typeof F.lambdaParameters;
    };
    readonly lambdaWithinForInClause: typeof FR.lambdaWithinForInClauseFrom & {
        from: typeof FR.lambdaWithinForInClauseFrom;
        strict: typeof F.lambdaWithinForInClause;
    };
    readonly list: typeof FR.listFrom & {
        from: typeof FR.listFrom;
        strict: typeof F.list;
    };
    readonly listComprehension: typeof FR.listComprehensionFrom & {
        from: typeof FR.listComprehensionFrom;
        strict: typeof F.listComprehension;
    };
    readonly listPattern: typeof FR.listPatternFrom & {
        from: typeof FR.listPatternFrom;
        strict: typeof F.listPattern;
    };
    readonly listSplat: typeof FR.listSplatFrom & {
        from: typeof FR.listSplatFrom;
        strict: typeof F.listSplat;
    };
    readonly listSplatPattern: typeof FR.listSplatPatternFrom & {
        from: typeof FR.listSplatPatternFrom;
        strict: typeof F.listSplatPattern;
    };
    readonly matchStatement: typeof FR.matchStatementFrom & {
        from: typeof FR.matchStatementFrom;
        strict: typeof F.matchStatement;
    };
    readonly memberType: typeof FR.memberTypeFrom & {
        from: typeof FR.memberTypeFrom;
        strict: typeof F.memberType;
    };
    readonly module: typeof FR.moduleFrom & {
        from: typeof FR.moduleFrom;
        strict: typeof F.module;
    };
    readonly namedExpression: typeof FR.namedExpressionFrom & {
        from: typeof FR.namedExpressionFrom;
        strict: typeof F.namedExpression;
    };
    readonly nonlocalStatement: typeof FR.nonlocalStatementFrom & {
        from: typeof FR.nonlocalStatementFrom;
        strict: typeof F.nonlocalStatement;
    };
    readonly notOperator: typeof FR.notOperatorFrom & {
        from: typeof FR.notOperatorFrom;
        strict: typeof F.notOperator;
    };
    readonly pair: typeof FR.pairFrom & {
        from: typeof FR.pairFrom;
        strict: typeof F.pair;
    };
    readonly parameters: typeof FR.parametersFrom & {
        from: typeof FR.parametersFrom;
        strict: typeof F.parameters;
    };
    readonly parenthesizedExpression: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
    };
    readonly parenthesizedListSplat: typeof FR.parenthesizedListSplatFrom & {
        from: typeof FR.parenthesizedListSplatFrom;
        strict: typeof F.parenthesizedListSplat;
    };
    readonly patternList: typeof FR.patternListFrom & {
        from: typeof FR.patternListFrom;
        strict: typeof F.patternList;
    };
    readonly printStatement: typeof FR.printStatementFrom & {
        from: typeof FR.printStatementFrom;
        strict: typeof F.printStatement;
    };
    readonly raiseStatement: typeof FR.raiseStatementFrom & {
        from: typeof FR.raiseStatementFrom;
        strict: typeof F.raiseStatement;
    };
    readonly relativeImport: typeof FR.relativeImportFrom & {
        from: typeof FR.relativeImportFrom;
        strict: typeof F.relativeImport;
    };
    readonly returnStatement: typeof FR.returnStatementFrom & {
        from: typeof FR.returnStatementFrom;
        strict: typeof F.returnStatement;
    };
    readonly set: typeof FR.setFrom & {
        from: typeof FR.setFrom;
        strict: typeof F.set;
    };
    readonly setComprehension: typeof FR.setComprehensionFrom & {
        from: typeof FR.setComprehensionFrom;
        strict: typeof F.setComprehension;
    };
    readonly slice: typeof FR.sliceFrom & {
        from: typeof FR.sliceFrom;
        strict: typeof F.slice;
    };
    readonly splatPattern: typeof FR.splatPatternFrom & {
        from: typeof FR.splatPatternFrom;
        strict: typeof F.splatPattern;
    };
    readonly splatType: typeof FR.splatTypeFrom & {
        from: typeof FR.splatTypeFrom;
        strict: typeof F.splatType;
    };
    readonly string: typeof FR.stringFrom & {
        from: typeof FR.stringFrom;
        strict: typeof F.string;
    };
    readonly stringContent: typeof FR.stringContentFrom & {
        from: typeof FR.stringContentFrom;
        strict: typeof F.stringContent;
    };
    readonly subscript: typeof FR.subscriptFrom & {
        from: typeof FR.subscriptFrom;
        strict: typeof F.subscript;
    };
    readonly tryStatement: typeof FR.tryStatementFrom & {
        from: typeof FR.tryStatementFrom;
        strict: typeof F.tryStatement;
    };
    readonly tuple: typeof FR.tupleFrom & {
        from: typeof FR.tupleFrom;
        strict: typeof F.tuple;
    };
    readonly tuplePattern: typeof FR.tuplePatternFrom & {
        from: typeof FR.tuplePatternFrom;
        strict: typeof F.tuplePattern;
    };
    readonly type: typeof FR.typeFrom & {
        from: typeof FR.typeFrom;
        strict: typeof F.type;
    };
    readonly typeAliasStatement: typeof FR.typeAliasStatementFrom & {
        from: typeof FR.typeAliasStatementFrom;
        strict: typeof F.typeAliasStatement;
    };
    readonly typeParameter: typeof FR.typeParameterFrom & {
        from: typeof FR.typeParameterFrom;
        strict: typeof F.typeParameter;
    };
    readonly typedDefaultParameter: typeof FR.typedDefaultParameterFrom & {
        from: typeof FR.typedDefaultParameterFrom;
        strict: typeof F.typedDefaultParameter;
    };
    readonly typedParameter: typeof FR.typedParameterFrom & {
        from: typeof FR.typedParameterFrom;
        strict: typeof F.typedParameter;
    };
    readonly unaryOperator: typeof FR.unaryOperatorFrom & {
        from: typeof FR.unaryOperatorFrom;
        strict: typeof F.unaryOperator;
    };
    readonly unionPattern: typeof FR.unionPatternFrom & {
        from: typeof FR.unionPatternFrom;
        strict: typeof F.unionPattern;
    };
    readonly unionType: typeof FR.unionTypeFrom & {
        from: typeof FR.unionTypeFrom;
        strict: typeof F.unionType;
    };
    readonly whileStatement: typeof FR.whileStatementFrom & {
        from: typeof FR.whileStatementFrom;
        strict: typeof F.whileStatement;
    };
    readonly withClause: typeof FR.withClauseFrom & {
        from: typeof FR.withClauseFrom;
        strict: typeof F.withClause;
    };
    readonly withItem: typeof FR.withItemFrom & {
        from: typeof FR.withItemFrom;
        strict: typeof F.withItem;
    };
    readonly withStatement: typeof FR.withStatementFrom & {
        from: typeof FR.withStatementFrom;
        strict: typeof F.withStatement;
    };
    readonly yield: typeof FR.yield_From & {
        from: typeof FR.yield_From;
        strict: typeof F.yield_;
    };
    readonly sliceGroup1: typeof FR.sliceGroup1From & {
        from: typeof FR.sliceGroup1From;
        strict: typeof F.sliceGroup1;
    };
    readonly breakStatement: typeof F.breakStatement;
    readonly continueStatement: typeof F.continueStatement;
    readonly false: typeof F.false_;
    readonly none: typeof F.none;
    readonly passStatement: typeof F.passStatement;
    readonly true: typeof F.true_;
    readonly comment: typeof F.comment;
    readonly escapeSequence: typeof F.escapeSequence;
    readonly float: typeof F.float;
    readonly identifier: typeof F.identifier;
    readonly importPrefix: typeof F.importPrefix;
    readonly integer: typeof F.integer;
    readonly lineContinuation: typeof F.lineContinuation;
    readonly typeConversion: typeof F.typeConversion;
    readonly stringStart: typeof F.stringStart;
    readonly escapeInterpolation: typeof F.escapeInterpolation;
    readonly stringEnd: typeof F.stringEnd;
    readonly except: typeof F.except;
    readonly as: typeof FR.asPatternFrom & {
        from: typeof FR.asPatternFrom;
        strict: typeof F.asPattern;
    };
    readonly assert: typeof FR.assertStatementFrom & {
        from: typeof FR.assertStatementFrom;
        strict: typeof F.assertStatement;
    };
    readonly augmented: typeof FR.augmentedAssignmentFrom & {
        from: typeof FR.augmentedAssignmentFrom;
        strict: typeof F.augmentedAssignment;
    };
    readonly binary: typeof FR.binaryOperatorFrom & {
        from: typeof FR.binaryOperatorFrom;
        strict: typeof F.binaryOperator;
    };
    readonly boolean: typeof FR.booleanOperatorFrom & {
        from: typeof FR.booleanOperatorFrom;
        strict: typeof F.booleanOperator;
    };
    readonly break: typeof F.breakStatement;
    readonly class: typeof FR.classDefinitionFrom & {
        from: typeof FR.classDefinitionFrom;
        strict: typeof F.classDefinition;
    };
    readonly comparison: typeof FR.comparisonOperatorFrom & {
        from: typeof FR.comparisonOperatorFrom;
        strict: typeof F.comparisonOperator;
    };
    readonly complex: typeof FR.complexPatternFrom & {
        from: typeof FR.complexPatternFrom;
        strict: typeof F.complexPattern;
    };
    readonly concatenated: typeof FR.concatenatedStringFrom & {
        from: typeof FR.concatenatedStringFrom;
        strict: typeof F.concatenatedString;
    };
    readonly conditional: typeof FR.conditionalExpressionFrom & {
        from: typeof FR.conditionalExpressionFrom;
        strict: typeof F.conditionalExpression;
    };
    readonly continue: typeof F.continueStatement;
    readonly decorated: typeof FR.decoratedDefinitionFrom & {
        from: typeof FR.decoratedDefinitionFrom;
        strict: typeof F.decoratedDefinition;
    };
    readonly default: typeof FR.defaultParameterFrom & {
        from: typeof FR.defaultParameterFrom;
        strict: typeof F.defaultParameter;
    };
    readonly delete: typeof FR.deleteStatementFrom & {
        from: typeof FR.deleteStatementFrom;
        strict: typeof F.deleteStatement;
    };
    readonly dict: typeof FR.dictPatternFrom & {
        from: typeof FR.dictPatternFrom;
        strict: typeof F.dictPattern;
    };
    readonly dotted: typeof FR.dottedNameFrom & {
        from: typeof FR.dottedNameFrom;
        strict: typeof F.dottedName;
    };
    readonly exec: typeof FR.execStatementFrom & {
        from: typeof FR.execStatementFrom;
        strict: typeof F.execStatement;
    };
    readonly for: typeof FR.forStatementFrom & {
        from: typeof FR.forStatementFrom;
        strict: typeof F.forStatement;
    };
    readonly function: typeof FR.functionDefinitionFrom & {
        from: typeof FR.functionDefinitionFrom;
        strict: typeof F.functionDefinition;
    };
    readonly futureImport: typeof FR.futureImportStatementFrom & {
        from: typeof FR.futureImportStatementFrom;
        strict: typeof F.futureImportStatement;
    };
    readonly generator: typeof FR.generatorExpressionFrom & {
        from: typeof FR.generatorExpressionFrom;
        strict: typeof F.generatorExpression;
    };
    readonly global: typeof FR.globalStatementFrom & {
        from: typeof FR.globalStatementFrom;
        strict: typeof F.globalStatement;
    };
    readonly if: typeof FR.ifStatementFrom & {
        from: typeof FR.ifStatementFrom;
        strict: typeof F.ifStatement;
    };
    readonly import: typeof FR.importStatementFrom & {
        from: typeof FR.importStatementFrom;
        strict: typeof F.importStatement;
    };
    readonly importFrom: typeof FR.importFromStatementFrom & {
        from: typeof FR.importFromStatementFrom;
        strict: typeof F.importFromStatement;
    };
    readonly lambdaWithinForIn: typeof FR.lambdaWithinForInClauseFrom & {
        from: typeof FR.lambdaWithinForInClauseFrom;
        strict: typeof F.lambdaWithinForInClause;
    };
    readonly match: typeof FR.matchStatementFrom & {
        from: typeof FR.matchStatementFrom;
        strict: typeof F.matchStatement;
    };
    readonly named: typeof FR.namedExpressionFrom & {
        from: typeof FR.namedExpressionFrom;
        strict: typeof F.namedExpression;
    };
    readonly nonlocal: typeof FR.nonlocalStatementFrom & {
        from: typeof FR.nonlocalStatementFrom;
        strict: typeof F.nonlocalStatement;
    };
    readonly not: typeof FR.notOperatorFrom & {
        from: typeof FR.notOperatorFrom;
        strict: typeof F.notOperator;
    };
    readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
    };
    readonly pass: typeof F.passStatement;
    readonly print: typeof FR.printStatementFrom & {
        from: typeof FR.printStatementFrom;
        strict: typeof F.printStatement;
    };
    readonly raise: typeof FR.raiseStatementFrom & {
        from: typeof FR.raiseStatementFrom;
        strict: typeof F.raiseStatement;
    };
    readonly return: typeof FR.returnStatementFrom & {
        from: typeof FR.returnStatementFrom;
        strict: typeof F.returnStatement;
    };
    readonly splat: typeof FR.splatPatternFrom & {
        from: typeof FR.splatPatternFrom;
        strict: typeof F.splatPattern;
    };
    readonly try: typeof FR.tryStatementFrom & {
        from: typeof FR.tryStatementFrom;
        strict: typeof F.tryStatement;
    };
    readonly typeAlias: typeof FR.typeAliasStatementFrom & {
        from: typeof FR.typeAliasStatementFrom;
        strict: typeof F.typeAliasStatement;
    };
    readonly typed: typeof FR.typedParameterFrom & {
        from: typeof FR.typedParameterFrom;
        strict: typeof F.typedParameter;
    };
    readonly typedDefault: typeof FR.typedDefaultParameterFrom & {
        from: typeof FR.typedDefaultParameterFrom;
        strict: typeof F.typedDefaultParameter;
    };
    readonly unary: typeof FR.unaryOperatorFrom & {
        from: typeof FR.unaryOperatorFrom;
        strict: typeof F.unaryOperator;
    };
    readonly union: typeof FR.unionPatternFrom & {
        from: typeof FR.unionPatternFrom;
        strict: typeof F.unionPattern;
    };
    readonly while: typeof FR.whileStatementFrom & {
        from: typeof FR.whileStatementFrom;
        strict: typeof F.whileStatement;
    };
    readonly with: typeof FR.withStatementFrom & {
        from: typeof FR.withStatementFrom;
        strict: typeof F.withStatement;
    };
    readonly compoundStatement: {
        readonly if: typeof FR.ifStatementFrom & {
            from: typeof FR.ifStatementFrom;
            strict: typeof F.ifStatement;
        };
        readonly for: typeof FR.forStatementFrom & {
            from: typeof FR.forStatementFrom;
            strict: typeof F.forStatement;
        };
        readonly while: typeof FR.whileStatementFrom & {
            from: typeof FR.whileStatementFrom;
            strict: typeof F.whileStatement;
        };
        readonly try: typeof FR.tryStatementFrom & {
            from: typeof FR.tryStatementFrom;
            strict: typeof F.tryStatement;
        };
        readonly with: typeof FR.withStatementFrom & {
            from: typeof FR.withStatementFrom;
            strict: typeof F.withStatement;
        };
        readonly function: typeof FR.functionDefinitionFrom & {
            from: typeof FR.functionDefinitionFrom;
            strict: typeof F.functionDefinition;
        };
        readonly class: typeof FR.classDefinitionFrom & {
            from: typeof FR.classDefinitionFrom;
            strict: typeof F.classDefinition;
        };
        readonly decorated: typeof FR.decoratedDefinitionFrom & {
            from: typeof FR.decoratedDefinitionFrom;
            strict: typeof F.decoratedDefinition;
        };
        readonly match: typeof FR.matchStatementFrom & {
            from: typeof FR.matchStatementFrom;
            strict: typeof F.matchStatement;
        };
    };
    readonly dictPatternKv: {
        readonly splat: typeof FR.splatPatternFrom & {
            from: typeof FR.splatPatternFrom;
            strict: typeof F.splatPattern;
        };
    };
    readonly expressionWithinForInClause: {
        readonly lambdaWithinForIn: typeof FR.lambdaWithinForInClauseFrom & {
            from: typeof FR.lambdaWithinForInClauseFrom;
            strict: typeof F.lambdaWithinForInClause;
        };
    };
    readonly expressions: {
        readonly expression: typeof FR.expressionListFrom & {
            from: typeof FR.expressionListFrom;
            strict: typeof F.expressionList;
        };
    };
    readonly fExpression: {
        readonly expression: typeof FR.expressionListFrom & {
            from: typeof FR.expressionListFrom;
            strict: typeof F.expressionList;
        };
        readonly pattern: typeof FR.patternListFrom & {
            from: typeof FR.patternListFrom;
            strict: typeof F.patternList;
        };
        readonly yield: typeof FR.yield_From & {
            from: typeof FR.yield_From;
            strict: typeof F.yield_;
        };
    };
    readonly leftHandSide: {
        readonly pattern: typeof FR.patternListFrom & {
            from: typeof FR.patternListFrom;
            strict: typeof F.patternList;
        };
    };
    readonly namedExpressionLhs: {
        readonly identifier: typeof F.identifier;
    };
    readonly rightHandSide: {
        readonly expression: typeof FR.expressionListFrom & {
            from: typeof FR.expressionListFrom;
            strict: typeof F.expressionList;
        };
        readonly assignment: typeof FR.assignmentFrom & {
            from: typeof FR.assignmentFrom;
            strict: typeof F.assignment;
        };
        readonly augmented: typeof FR.augmentedAssignmentFrom & {
            from: typeof FR.augmentedAssignmentFrom;
            strict: typeof F.augmentedAssignment;
        };
        readonly pattern: typeof FR.patternListFrom & {
            from: typeof FR.patternListFrom;
            strict: typeof F.patternList;
        };
        readonly yield: typeof FR.yield_From & {
            from: typeof FR.yield_From;
            strict: typeof F.yield_;
        };
    };
    readonly simplePattern: {
        readonly class: typeof FR.classPatternFrom & {
            from: typeof FR.classPatternFrom;
            strict: typeof F.classPattern;
        };
        readonly splat: typeof FR.splatPatternFrom & {
            from: typeof FR.splatPatternFrom;
            strict: typeof F.splatPattern;
        };
        readonly union: typeof FR.unionPatternFrom & {
            from: typeof FR.unionPatternFrom;
            strict: typeof F.unionPattern;
        };
        readonly dict: typeof FR.dictPatternFrom & {
            from: typeof FR.dictPatternFrom;
            strict: typeof F.dictPattern;
        };
        readonly string: typeof FR.stringFrom & {
            from: typeof FR.stringFrom;
            strict: typeof F.string;
        };
        readonly concatenated: typeof FR.concatenatedStringFrom & {
            from: typeof FR.concatenatedStringFrom;
            strict: typeof F.concatenatedString;
        };
        readonly true: typeof F.true_;
        readonly false: typeof F.false_;
        readonly none: typeof F.none;
        readonly complex: typeof FR.complexPatternFrom & {
            from: typeof FR.complexPatternFrom;
            strict: typeof F.complexPattern;
        };
        readonly dotted: typeof FR.dottedNameFrom & {
            from: typeof FR.dottedNameFrom;
            strict: typeof F.dottedName;
        };
    };
    readonly simpleStatement: {
        readonly futureImport: typeof FR.futureImportStatementFrom & {
            from: typeof FR.futureImportStatementFrom;
            strict: typeof F.futureImportStatement;
        };
        readonly import: typeof FR.importStatementFrom & {
            from: typeof FR.importStatementFrom;
            strict: typeof F.importStatement;
        };
        readonly importFrom: typeof FR.importFromStatementFrom & {
            from: typeof FR.importFromStatementFrom;
            strict: typeof F.importFromStatement;
        };
        readonly print: typeof FR.printStatementFrom & {
            from: typeof FR.printStatementFrom;
            strict: typeof F.printStatement;
        };
        readonly assert: typeof FR.assertStatementFrom & {
            from: typeof FR.assertStatementFrom;
            strict: typeof F.assertStatement;
        };
        readonly expression: typeof FR.expressionStatementFrom & {
            from: typeof FR.expressionStatementFrom;
            strict: typeof F.expressionStatement;
        };
        readonly return: typeof FR.returnStatementFrom & {
            from: typeof FR.returnStatementFrom;
            strict: typeof F.returnStatement;
        };
        readonly delete: typeof FR.deleteStatementFrom & {
            from: typeof FR.deleteStatementFrom;
            strict: typeof F.deleteStatement;
        };
        readonly raise: typeof FR.raiseStatementFrom & {
            from: typeof FR.raiseStatementFrom;
            strict: typeof F.raiseStatement;
        };
        readonly pass: typeof F.passStatement;
        readonly break: typeof F.breakStatement;
        readonly continue: typeof F.continueStatement;
        readonly global: typeof FR.globalStatementFrom & {
            from: typeof FR.globalStatementFrom;
            strict: typeof F.globalStatement;
        };
        readonly nonlocal: typeof FR.nonlocalStatementFrom & {
            from: typeof FR.nonlocalStatementFrom;
            strict: typeof F.nonlocalStatement;
        };
        readonly exec: typeof FR.execStatementFrom & {
            from: typeof FR.execStatementFrom;
            strict: typeof F.execStatement;
        };
        readonly typeAlias: typeof FR.typeAliasStatementFrom & {
            from: typeof FR.typeAliasStatementFrom;
            strict: typeof F.typeAliasStatement;
        };
    };
    readonly statement: {
        readonly if: typeof FR.ifStatementFrom & {
            from: typeof FR.ifStatementFrom;
            strict: typeof F.ifStatement;
        };
        readonly for: typeof FR.forStatementFrom & {
            from: typeof FR.forStatementFrom;
            strict: typeof F.forStatement;
        };
        readonly while: typeof FR.whileStatementFrom & {
            from: typeof FR.whileStatementFrom;
            strict: typeof F.whileStatement;
        };
        readonly try: typeof FR.tryStatementFrom & {
            from: typeof FR.tryStatementFrom;
            strict: typeof F.tryStatement;
        };
        readonly with: typeof FR.withStatementFrom & {
            from: typeof FR.withStatementFrom;
            strict: typeof F.withStatement;
        };
        readonly function: typeof FR.functionDefinitionFrom & {
            from: typeof FR.functionDefinitionFrom;
            strict: typeof F.functionDefinition;
        };
        readonly class: typeof FR.classDefinitionFrom & {
            from: typeof FR.classDefinitionFrom;
            strict: typeof F.classDefinition;
        };
        readonly decorated: typeof FR.decoratedDefinitionFrom & {
            from: typeof FR.decoratedDefinitionFrom;
            strict: typeof F.decoratedDefinition;
        };
        readonly match: typeof FR.matchStatementFrom & {
            from: typeof FR.matchStatementFrom;
            strict: typeof F.matchStatement;
        };
    };
    readonly expression: {
        readonly comparison: typeof FR.comparisonOperatorFrom & {
            from: typeof FR.comparisonOperatorFrom;
            strict: typeof F.comparisonOperator;
        };
        readonly not: typeof FR.notOperatorFrom & {
            from: typeof FR.notOperatorFrom;
            strict: typeof F.notOperator;
        };
        readonly boolean: typeof FR.booleanOperatorFrom & {
            from: typeof FR.booleanOperatorFrom;
            strict: typeof F.booleanOperator;
        };
        readonly lambda: typeof FR.lambdaFrom & {
            from: typeof FR.lambdaFrom;
            strict: typeof F.lambda;
        };
        readonly conditional: typeof FR.conditionalExpressionFrom & {
            from: typeof FR.conditionalExpressionFrom;
            strict: typeof F.conditionalExpression;
        };
        readonly named: typeof FR.namedExpressionFrom & {
            from: typeof FR.namedExpressionFrom;
            strict: typeof F.namedExpression;
        };
        readonly as: typeof FR.asPatternFrom & {
            from: typeof FR.asPatternFrom;
            strict: typeof F.asPattern;
        };
    };
    readonly parameter: {
        readonly identifier: typeof F.identifier;
        readonly typed: typeof FR.typedParameterFrom & {
            from: typeof FR.typedParameterFrom;
            strict: typeof F.typedParameter;
        };
        readonly default: typeof FR.defaultParameterFrom & {
            from: typeof FR.defaultParameterFrom;
            strict: typeof F.defaultParameter;
        };
        readonly typedDefault: typeof FR.typedDefaultParameterFrom & {
            from: typeof FR.typedDefaultParameterFrom;
            strict: typeof F.typedDefaultParameter;
        };
        readonly listSplat: typeof FR.listSplatPatternFrom & {
            from: typeof FR.listSplatPatternFrom;
            strict: typeof F.listSplatPattern;
        };
        readonly tuple: typeof FR.tuplePatternFrom & {
            from: typeof FR.tuplePatternFrom;
            strict: typeof F.tuplePattern;
        };
        readonly dictionarySplat: typeof FR.dictionarySplatPatternFrom & {
            from: typeof FR.dictionarySplatPatternFrom;
            strict: typeof F.dictionarySplatPattern;
        };
    };
    readonly pattern: {
        readonly identifier: typeof F.identifier;
        readonly subscript: typeof FR.subscriptFrom & {
            from: typeof FR.subscriptFrom;
            strict: typeof F.subscript;
        };
        readonly attribute: typeof FR.attributeFrom & {
            from: typeof FR.attributeFrom;
            strict: typeof F.attribute;
        };
        readonly listSplat: typeof FR.listSplatPatternFrom & {
            from: typeof FR.listSplatPatternFrom;
            strict: typeof F.listSplatPattern;
        };
        readonly tuple: typeof FR.tuplePatternFrom & {
            from: typeof FR.tuplePatternFrom;
            strict: typeof F.tuplePattern;
        };
        readonly list: typeof FR.listPatternFrom & {
            from: typeof FR.listPatternFrom;
            strict: typeof F.listPattern;
        };
    };
    readonly primaryExpression: {
        readonly await: typeof FR.await_From & {
            from: typeof FR.await_From;
            strict: typeof F.await_;
        };
        readonly binary: typeof FR.binaryOperatorFrom & {
            from: typeof FR.binaryOperatorFrom;
            strict: typeof F.binaryOperator;
        };
        readonly identifier: typeof F.identifier;
        readonly string: typeof FR.stringFrom & {
            from: typeof FR.stringFrom;
            strict: typeof F.string;
        };
        readonly concatenated: typeof FR.concatenatedStringFrom & {
            from: typeof FR.concatenatedStringFrom;
            strict: typeof F.concatenatedString;
        };
        readonly integer: typeof F.integer;
        readonly float: typeof F.float;
        readonly true: typeof F.true_;
        readonly false: typeof F.false_;
        readonly none: typeof F.none;
        readonly unary: typeof FR.unaryOperatorFrom & {
            from: typeof FR.unaryOperatorFrom;
            strict: typeof F.unaryOperator;
        };
        readonly attribute: typeof FR.attributeFrom & {
            from: typeof FR.attributeFrom;
            strict: typeof F.attribute;
        };
        readonly subscript: typeof FR.subscriptFrom & {
            from: typeof FR.subscriptFrom;
            strict: typeof F.subscript;
        };
        readonly call: typeof FR.callFrom & {
            from: typeof FR.callFrom;
            strict: typeof F.call;
        };
        readonly list: typeof FR.listFrom & {
            from: typeof FR.listFrom;
            strict: typeof F.list;
        };
        readonly dictionary: typeof FR.dictionaryFrom & {
            from: typeof FR.dictionaryFrom;
            strict: typeof F.dictionary;
        };
        readonly set: typeof FR.setFrom & {
            from: typeof FR.setFrom;
            strict: typeof F.set;
        };
        readonly tuple: typeof FR.tupleFrom & {
            from: typeof FR.tupleFrom;
            strict: typeof F.tuple;
        };
        readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
            from: typeof FR.parenthesizedExpressionFrom;
            strict: typeof F.parenthesizedExpression;
        };
        readonly generator: typeof FR.generatorExpressionFrom & {
            from: typeof FR.generatorExpressionFrom;
            strict: typeof F.generatorExpression;
        };
        readonly listSplat: typeof FR.listSplatPatternFrom & {
            from: typeof FR.listSplatPatternFrom;
            strict: typeof F.listSplatPattern;
        };
    };
    readonly from: {
        readonly boolean: (value: boolean) => ReturnType<typeof F.true_> | ReturnType<typeof F.false_>;
        readonly number: ((value: number) => ReturnType<typeof F.integer> | ReturnType<typeof F.float>) & {
            integer(value: number): ReturnType<typeof F.integer>;
            float(value: number): ReturnType<typeof F.float>;
        };
        readonly comment: (text: string) => ReturnType<typeof F.comment>;
        readonly type: (name: string) => ReturnType<typeof F.identifier>;
        readonly identifier: (name: string) => ReturnType<typeof F.identifier>;
        readonly function: typeof FR.functionDefinitionFrom & {
            from: typeof FR.functionDefinitionFrom;
            strict: typeof F.functionDefinition;
        };
        readonly class: typeof FR.classDefinitionFrom & {
            from: typeof FR.classDefinitionFrom;
            strict: typeof F.classDefinition;
        };
    };
};
//# sourceMappingURL=ir.d.ts.map