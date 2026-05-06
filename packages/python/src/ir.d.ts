import * as F from './factories.js';
import * as FR from './from.js';
export declare const compoundStatement: {
    readonly if_: typeof F.ifStatement & {
        from: typeof FR.ifStatementFrom;
    };
    readonly for_: typeof F.forStatement & {
        from: typeof FR.forStatementFrom;
    };
    readonly while_: typeof F.whileStatement & {
        from: typeof FR.whileStatementFrom;
    };
    readonly try_: typeof F.tryStatement & {
        from: typeof FR.tryStatementFrom;
    };
    readonly with_: typeof F.withStatement & {
        from: typeof FR.withStatementFrom;
    };
    readonly function_: typeof F.functionDefinition & {
        from: typeof FR.functionDefinitionFrom;
    };
    readonly class_: typeof F.classDefinition & {
        from: typeof FR.classDefinitionFrom;
    };
    readonly decorated: typeof F.decoratedDefinition & {
        from: typeof FR.decoratedDefinitionFrom;
    };
    readonly match: typeof F.matchStatement & {
        from: typeof FR.matchStatementFrom;
    };
};
export declare const dictPatternKv: {
    readonly splat: typeof F.splatPattern & {
        from: typeof FR.splatPatternFrom;
    };
};
export declare const expressionWithinForInClause: {
    readonly lambdaWithinForIn: typeof F.lambdaWithinForInClause & {
        from: typeof FR.lambdaWithinForInClauseFrom;
    };
};
export declare const expressions: {
    readonly expression: typeof F.expressionList & {
        from: typeof FR.expressionListFrom;
    };
};
export declare const fExpression: {
    readonly expression: typeof F.expressionList & {
        from: typeof FR.expressionListFrom;
    };
    readonly pattern: typeof F.patternList & {
        from: typeof FR.patternListFrom;
    };
    readonly yield_: typeof F.yield_ & {
        from: typeof FR.yield_From;
    };
};
export declare const leftHandSide: {
    readonly pattern: typeof F.patternList & {
        from: typeof FR.patternListFrom;
    };
};
export declare const namedExpressionLhs: {
    readonly identifier: typeof F.identifier;
};
export declare const rightHandSide: {
    readonly expression: typeof F.expressionList & {
        from: typeof FR.expressionListFrom;
    };
    readonly assignment: typeof F.assignment & {
        from: typeof FR.assignmentFrom;
        eq: typeof F.assignmentUFormEq & {
            from: typeof FR.assignmentUFormEqFrom;
        };
        type: typeof F.assignmentUFormType & {
            from: typeof FR.assignmentUFormTypeFrom;
        };
        typed: typeof F.assignmentUFormTyped & {
            from: typeof FR.assignmentUFormTypedFrom;
        };
    };
    readonly augmented: typeof F.augmentedAssignment & {
        from: typeof FR.augmentedAssignmentFrom;
    };
    readonly pattern: typeof F.patternList & {
        from: typeof FR.patternListFrom;
    };
    readonly yield_: typeof F.yield_ & {
        from: typeof FR.yield_From;
    };
};
export declare const simplePattern: {
    readonly class_: typeof F.classPattern & {
        from: typeof FR.classPatternFrom;
    };
    readonly splat: typeof F.splatPattern & {
        from: typeof FR.splatPatternFrom;
    };
    readonly union: typeof F.unionPattern & {
        from: typeof FR.unionPatternFrom;
    };
    readonly dict: typeof F.dictPattern & {
        from: typeof FR.dictPatternFrom;
    };
    readonly string: typeof F.string & {
        from: typeof FR.stringFrom;
    };
    readonly concatenated: typeof F.concatenatedString & {
        from: typeof FR.concatenatedStringFrom;
    };
    readonly true_: typeof F.true_;
    readonly false_: typeof F.false_;
    readonly none: typeof F.none;
    readonly complex: typeof F.complexPattern & {
        from: typeof FR.complexPatternFrom;
    };
    readonly dotted: typeof F.dottedName & {
        from: typeof FR.dottedNameFrom;
    };
};
export declare const simpleStatement: {
    readonly futureImport: typeof F.futureImportStatement & {
        from: typeof FR.futureImportStatementFrom;
    };
    readonly import_: typeof F.importStatement & {
        from: typeof FR.importStatementFrom;
    };
    readonly importFrom: typeof F.importFromStatement & {
        from: typeof FR.importFromStatementFrom;
    };
    readonly print: typeof F.printStatement & {
        from: typeof FR.printStatementFrom;
    };
    readonly assert: typeof F.assertStatement & {
        from: typeof FR.assertStatementFrom;
    };
    readonly expression: typeof F.expressionStatement & {
        from: typeof FR.expressionStatementFrom;
    };
    readonly return_: typeof F.returnStatement & {
        from: typeof FR.returnStatementFrom;
    };
    readonly delete_: typeof F.deleteStatement & {
        from: typeof FR.deleteStatementFrom;
    };
    readonly raise: typeof F.raiseStatement & {
        from: typeof FR.raiseStatementFrom;
    };
    readonly pass: typeof F.passStatement;
    readonly break_: typeof F.breakStatement;
    readonly continue_: typeof F.continueStatement;
    readonly global: typeof F.globalStatement & {
        from: typeof FR.globalStatementFrom;
    };
    readonly nonlocal: typeof F.nonlocalStatement & {
        from: typeof FR.nonlocalStatementFrom;
    };
    readonly exec: typeof F.execStatement & {
        from: typeof FR.execStatementFrom;
    };
    readonly typeAlias: typeof F.typeAliasStatement & {
        from: typeof FR.typeAliasStatementFrom;
    };
};
export declare const statement: {
    readonly if_: typeof F.ifStatement & {
        from: typeof FR.ifStatementFrom;
    };
    readonly for_: typeof F.forStatement & {
        from: typeof FR.forStatementFrom;
    };
    readonly while_: typeof F.whileStatement & {
        from: typeof FR.whileStatementFrom;
    };
    readonly try_: typeof F.tryStatement & {
        from: typeof FR.tryStatementFrom;
    };
    readonly with_: typeof F.withStatement & {
        from: typeof FR.withStatementFrom;
    };
    readonly function_: typeof F.functionDefinition & {
        from: typeof FR.functionDefinitionFrom;
    };
    readonly class_: typeof F.classDefinition & {
        from: typeof FR.classDefinitionFrom;
    };
    readonly decorated: typeof F.decoratedDefinition & {
        from: typeof FR.decoratedDefinitionFrom;
    };
    readonly match: typeof F.matchStatement & {
        from: typeof FR.matchStatementFrom;
    };
};
export declare const expression: {
    readonly comparison: typeof F.comparisonOperator & {
        from: typeof FR.comparisonOperatorFrom;
    };
    readonly not: typeof F.notOperator & {
        from: typeof FR.notOperatorFrom;
    };
    readonly boolean: typeof F.booleanOperator & {
        from: typeof FR.booleanOperatorFrom;
    };
    readonly lambda: typeof F.lambda & {
        from: typeof FR.lambdaFrom;
    };
    readonly conditional: typeof F.conditionalExpression & {
        from: typeof FR.conditionalExpressionFrom;
    };
    readonly named: typeof F.namedExpression & {
        from: typeof FR.namedExpressionFrom;
    };
    readonly as: typeof F.asPattern & {
        from: typeof FR.asPatternFrom;
    };
};
export declare const keywordIdentifier: {
    readonly identifier: typeof F.identifier;
};
export declare const parameter: {
    readonly identifier: typeof F.identifier;
    readonly typed: typeof F.typedParameter & {
        from: typeof FR.typedParameterFrom;
    };
    readonly default_: typeof F.defaultParameter & {
        from: typeof FR.defaultParameterFrom;
    };
    readonly typedDefault: typeof F.typedDefaultParameter & {
        from: typeof FR.typedDefaultParameterFrom;
    };
    readonly listSplat: typeof F.listSplatPattern & {
        from: typeof FR.listSplatPatternFrom;
    };
    readonly tuple: typeof F.tuplePattern & {
        from: typeof FR.tuplePatternFrom;
    };
    readonly dictionarySplat: typeof F.dictionarySplatPattern & {
        from: typeof FR.dictionarySplatPatternFrom;
    };
};
export declare const pattern: {
    readonly identifier: typeof F.identifier;
    readonly subscript: typeof F.subscript & {
        from: typeof FR.subscriptFrom;
    };
    readonly attribute: typeof F.attribute & {
        from: typeof FR.attributeFrom;
    };
    readonly listSplat: typeof F.listSplatPattern & {
        from: typeof FR.listSplatPatternFrom;
    };
    readonly tuple: typeof F.tuplePattern & {
        from: typeof FR.tuplePatternFrom;
    };
    readonly list: typeof F.listPattern & {
        from: typeof FR.listPatternFrom;
    };
};
export declare const primaryExpression: {
    readonly await: typeof F.await_ & {
        from: typeof FR.await_From;
    };
    readonly binary: typeof F.binaryOperator & {
        from: typeof FR.binaryOperatorFrom;
    };
    readonly identifier: typeof F.identifier;
    readonly string: typeof F.string & {
        from: typeof FR.stringFrom;
    };
    readonly concatenated: typeof F.concatenatedString & {
        from: typeof FR.concatenatedStringFrom;
    };
    readonly integer: typeof F.integer;
    readonly float: typeof F.float;
    readonly true_: typeof F.true_;
    readonly false_: typeof F.false_;
    readonly none: typeof F.none;
    readonly unary: typeof F.unaryOperator & {
        from: typeof FR.unaryOperatorFrom;
    };
    readonly attribute: typeof F.attribute & {
        from: typeof FR.attributeFrom;
    };
    readonly subscript: typeof F.subscript & {
        from: typeof FR.subscriptFrom;
    };
    readonly call: typeof F.call & {
        from: typeof FR.callFrom;
    };
    readonly list: typeof F.list & {
        from: typeof FR.listFrom;
    };
    readonly dictionary: typeof F.dictionary & {
        from: typeof FR.dictionaryFrom;
    };
    readonly set: typeof F.set & {
        from: typeof FR.setFrom;
    };
    readonly tuple: typeof F.tuple & {
        from: typeof FR.tupleFrom;
    };
    readonly parenthesized: typeof F.parenthesizedExpression & {
        from: typeof FR.parenthesizedExpressionFrom;
    };
    readonly generator: typeof F.generatorExpression & {
        from: typeof FR.generatorExpressionFrom;
    };
    readonly listSplat: typeof F.listSplatPattern & {
        from: typeof FR.listSplatPatternFrom;
    };
};
export declare const ir: {
    readonly aliasedImport: typeof F.aliasedImport & {
        from: typeof FR.aliasedImportFrom;
    };
    readonly argumentList: typeof F.argumentList & {
        from: typeof FR.argumentListFrom;
    };
    readonly asPattern: typeof F.asPattern & {
        from: typeof FR.asPatternFrom;
    };
    readonly assert: typeof F.assertStatement & {
        from: typeof FR.assertStatementFrom;
    };
    readonly assignment: typeof F.assignment & {
        from: typeof FR.assignmentFrom;
        eq: typeof F.assignmentUFormEq & {
            from: typeof FR.assignmentUFormEqFrom;
        };
        type: typeof F.assignmentUFormType & {
            from: typeof FR.assignmentUFormTypeFrom;
        };
        typed: typeof F.assignmentUFormTyped & {
            from: typeof FR.assignmentUFormTypedFrom;
        };
    };
    readonly attribute: typeof F.attribute & {
        from: typeof FR.attributeFrom;
    };
    readonly augmentedAssignment: typeof F.augmentedAssignment & {
        from: typeof FR.augmentedAssignmentFrom;
    };
    readonly await_: typeof F.await_ & {
        from: typeof FR.await_From;
    };
    readonly binaryOperator: typeof F.binaryOperator & {
        from: typeof FR.binaryOperatorFrom;
    };
    readonly block: typeof F.block & {
        from: typeof FR.blockFrom;
    };
    readonly booleanOperator: typeof F.booleanOperator & {
        from: typeof FR.booleanOperatorFrom;
    };
    readonly call: typeof F.call & {
        from: typeof FR.callFrom;
    };
    readonly caseClause: typeof F.caseClause & {
        from: typeof FR.caseClauseFrom;
    };
    readonly casePattern: typeof F.casePattern & {
        from: typeof FR.casePatternFrom;
    };
    readonly chevron: typeof F.chevron & {
        from: typeof FR.chevronFrom;
    };
    readonly classDefinition: typeof F.classDefinition & {
        from: typeof FR.classDefinitionFrom;
    };
    readonly classPattern: typeof F.classPattern & {
        from: typeof FR.classPatternFrom;
    };
    readonly comparisonOperator: typeof F.comparisonOperator & {
        from: typeof FR.comparisonOperatorFrom;
    };
    readonly complexPattern: typeof F.complexPattern & {
        from: typeof FR.complexPatternFrom;
    };
    readonly concatenatedString: typeof F.concatenatedString & {
        from: typeof FR.concatenatedStringFrom;
    };
    readonly conditional: typeof F.conditionalExpression & {
        from: typeof FR.conditionalExpressionFrom;
    };
    readonly constrainedType: typeof F.constrainedType & {
        from: typeof FR.constrainedTypeFrom;
    };
    readonly decorated: typeof F.decoratedDefinition & {
        from: typeof FR.decoratedDefinitionFrom;
    };
    readonly decorator: typeof F.decorator & {
        from: typeof FR.decoratorFrom;
    };
    readonly defaultParameter: typeof F.defaultParameter & {
        from: typeof FR.defaultParameterFrom;
    };
    readonly deleteStatement: typeof F.deleteStatement & {
        from: typeof FR.deleteStatementFrom;
    };
    readonly dictPattern: typeof F.dictPattern & {
        from: typeof FR.dictPatternFrom;
    };
    readonly dictionary: typeof F.dictionary & {
        from: typeof FR.dictionaryFrom;
    };
    readonly dictionaryComprehension: typeof F.dictionaryComprehension & {
        from: typeof FR.dictionaryComprehensionFrom;
    };
    readonly dictionarySplat: typeof F.dictionarySplat & {
        from: typeof FR.dictionarySplatFrom;
    };
    readonly dictionarySplatPattern: typeof F.dictionarySplatPattern & {
        from: typeof FR.dictionarySplatPatternFrom;
    };
    readonly dottedName: typeof F.dottedName & {
        from: typeof FR.dottedNameFrom;
    };
    readonly elifClause: typeof F.elifClause & {
        from: typeof FR.elifClauseFrom;
    };
    readonly elseClause: typeof F.elseClause & {
        from: typeof FR.elseClauseFrom;
    };
    readonly exceptClause: typeof F.exceptClause & {
        from: typeof FR.exceptClauseFrom;
    };
    readonly exec: typeof F.execStatement & {
        from: typeof FR.execStatementFrom;
    };
    readonly expressionList: typeof F.expressionList & {
        from: typeof FR.expressionListFrom;
    };
    readonly expressionStatementTuple: typeof F.expressionStatementTuple & {
        from: typeof FR.expressionStatementTupleFrom;
    };
    readonly expressionStatement: typeof F.expressionStatement & {
        from: typeof FR.expressionStatementFrom;
    };
    readonly finallyClause: typeof F.finallyClause & {
        from: typeof FR.finallyClauseFrom;
    };
    readonly forInClause: typeof F.forInClause & {
        from: typeof FR.forInClauseFrom;
    };
    readonly forStatement: typeof F.forStatement & {
        from: typeof FR.forStatementFrom;
    };
    readonly formatSpecifier: typeof F.formatSpecifier & {
        from: typeof FR.formatSpecifierFrom;
    };
    readonly functionDefinition: typeof F.functionDefinition & {
        from: typeof FR.functionDefinitionFrom;
    };
    readonly futureImport: typeof F.futureImportStatement & {
        from: typeof FR.futureImportStatementFrom;
    };
    readonly generator: typeof F.generatorExpression & {
        from: typeof FR.generatorExpressionFrom;
    };
    readonly genericType: typeof F.genericType & {
        from: typeof FR.genericTypeFrom;
    };
    readonly global: typeof F.globalStatement & {
        from: typeof FR.globalStatementFrom;
    };
    readonly ifClause: typeof F.ifClause & {
        from: typeof FR.ifClauseFrom;
    };
    readonly ifStatement: typeof F.ifStatement & {
        from: typeof FR.ifStatementFrom;
    };
    readonly importFrom: typeof F.importFromStatement & {
        from: typeof FR.importFromStatementFrom;
    };
    readonly importStatement: typeof F.importStatement & {
        from: typeof FR.importStatementFrom;
    };
    readonly interpolation: typeof F.interpolation & {
        from: typeof FR.interpolationFrom;
    };
    readonly keywordArgument: typeof F.keywordArgument & {
        from: typeof FR.keywordArgumentFrom;
    };
    readonly keywordPattern: typeof F.keywordPattern & {
        from: typeof FR.keywordPatternFrom;
    };
    readonly lambda: typeof F.lambda & {
        from: typeof FR.lambdaFrom;
    };
    readonly lambdaParameters: typeof F.lambdaParameters & {
        from: typeof FR.lambdaParametersFrom;
    };
    readonly lambdaWithinForInClause: typeof F.lambdaWithinForInClause & {
        from: typeof FR.lambdaWithinForInClauseFrom;
    };
    readonly list: typeof F.list & {
        from: typeof FR.listFrom;
    };
    readonly listComprehension: typeof F.listComprehension & {
        from: typeof FR.listComprehensionFrom;
    };
    readonly listPattern: typeof F.listPattern & {
        from: typeof FR.listPatternFrom;
    };
    readonly listSplat: typeof F.listSplat & {
        from: typeof FR.listSplatFrom;
    };
    readonly listSplatPattern: typeof F.listSplatPattern & {
        from: typeof FR.listSplatPatternFrom;
    };
    readonly match: typeof F.matchStatement & {
        from: typeof FR.matchStatementFrom;
    };
    readonly memberType: typeof F.memberType & {
        from: typeof FR.memberTypeFrom;
    };
    readonly module: typeof F.module & {
        from: typeof FR.moduleFrom;
    };
    readonly named: typeof F.namedExpression & {
        from: typeof FR.namedExpressionFrom;
    };
    readonly nonlocal: typeof F.nonlocalStatement & {
        from: typeof FR.nonlocalStatementFrom;
    };
    readonly notOperator: typeof F.notOperator & {
        from: typeof FR.notOperatorFrom;
    };
    readonly pair: typeof F.pair & {
        from: typeof FR.pairFrom;
    };
    readonly parameters: typeof F.parameters & {
        from: typeof FR.parametersFrom;
    };
    readonly parenthesized: typeof F.parenthesizedExpression & {
        from: typeof FR.parenthesizedExpressionFrom;
    };
    readonly parenthesizedListSplat: typeof F.parenthesizedListSplat & {
        from: typeof FR.parenthesizedListSplatFrom;
    };
    readonly patternList: typeof F.patternList & {
        from: typeof FR.patternListFrom;
    };
    readonly print: typeof F.printStatement & {
        from: typeof FR.printStatementFrom;
    };
    readonly raise: typeof F.raiseStatement & {
        from: typeof FR.raiseStatementFrom;
    };
    readonly relativeImport: typeof F.relativeImport & {
        from: typeof FR.relativeImportFrom;
    };
    readonly returnStatement: typeof F.returnStatement & {
        from: typeof FR.returnStatementFrom;
    };
    readonly set: typeof F.set & {
        from: typeof FR.setFrom;
    };
    readonly setComprehension: typeof F.setComprehension & {
        from: typeof FR.setComprehensionFrom;
    };
    readonly slice: typeof F.slice & {
        from: typeof FR.sliceFrom;
    };
    readonly splatPattern: typeof F.splatPattern & {
        from: typeof FR.splatPatternFrom;
    };
    readonly splatType: typeof F.splatType & {
        from: typeof FR.splatTypeFrom;
    };
    readonly string: typeof F.string & {
        from: typeof FR.stringFrom;
    };
    readonly stringContent: typeof F.stringContent & {
        from: typeof FR.stringContentFrom;
    };
    readonly subscript: typeof F.subscript & {
        from: typeof FR.subscriptFrom;
    };
    readonly tryStatement: typeof F.tryStatement & {
        from: typeof FR.tryStatementFrom;
    };
    readonly tuple: typeof F.tuple & {
        from: typeof FR.tupleFrom;
    };
    readonly tuplePattern: typeof F.tuplePattern & {
        from: typeof FR.tuplePatternFrom;
    };
    readonly type: typeof F.type & {
        from: typeof FR.typeFrom;
    };
    readonly typeAlias: typeof F.typeAliasStatement & {
        from: typeof FR.typeAliasStatementFrom;
    };
    readonly typeParameter: typeof F.typeParameter & {
        from: typeof FR.typeParameterFrom;
    };
    readonly typedDefaultParameter: typeof F.typedDefaultParameter & {
        from: typeof FR.typedDefaultParameterFrom;
    };
    readonly typedParameter: typeof F.typedParameter & {
        from: typeof FR.typedParameterFrom;
    };
    readonly unaryOperator: typeof F.unaryOperator & {
        from: typeof FR.unaryOperatorFrom;
    };
    readonly unionPattern: typeof F.unionPattern & {
        from: typeof FR.unionPatternFrom;
    };
    readonly unionType: typeof F.unionType & {
        from: typeof FR.unionTypeFrom;
    };
    readonly whileStatement: typeof F.whileStatement & {
        from: typeof FR.whileStatementFrom;
    };
    readonly withClauseBare: typeof F.withClauseBare & {
        from: typeof FR.withClauseBareFrom;
    };
    readonly withClauseParen: typeof F.withClauseParen & {
        from: typeof FR.withClauseParenFrom;
    };
    readonly withClause: typeof F.withClause & {
        from: typeof FR.withClauseFrom;
        bare: typeof F.withClauseUFormBare & {
            from: typeof FR.withClauseUFormBareFrom;
        };
        paren: typeof F.withClauseUFormParen & {
            from: typeof FR.withClauseUFormParenFrom;
        };
    };
    readonly withItem: typeof F.withItem & {
        from: typeof FR.withItemFrom;
    };
    readonly withStatement: typeof F.withStatement & {
        from: typeof FR.withStatementFrom;
    };
    readonly yield_: typeof F.yield_ & {
        from: typeof FR.yield_From;
    };
    readonly breakStatement: typeof F.breakStatement;
    readonly continueStatement: typeof F.continueStatement;
    readonly false_: typeof F.false_;
    readonly none: typeof F.none;
    readonly pass: typeof F.passStatement;
    readonly true_: typeof F.true_;
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
    readonly compoundStatement: {
        readonly if_: typeof F.ifStatement & {
            from: typeof FR.ifStatementFrom;
        };
        readonly for_: typeof F.forStatement & {
            from: typeof FR.forStatementFrom;
        };
        readonly while_: typeof F.whileStatement & {
            from: typeof FR.whileStatementFrom;
        };
        readonly try_: typeof F.tryStatement & {
            from: typeof FR.tryStatementFrom;
        };
        readonly with_: typeof F.withStatement & {
            from: typeof FR.withStatementFrom;
        };
        readonly function_: typeof F.functionDefinition & {
            from: typeof FR.functionDefinitionFrom;
        };
        readonly class_: typeof F.classDefinition & {
            from: typeof FR.classDefinitionFrom;
        };
        readonly decorated: typeof F.decoratedDefinition & {
            from: typeof FR.decoratedDefinitionFrom;
        };
        readonly match: typeof F.matchStatement & {
            from: typeof FR.matchStatementFrom;
        };
    };
    readonly dictPatternKv: {
        readonly splat: typeof F.splatPattern & {
            from: typeof FR.splatPatternFrom;
        };
    };
    readonly expressionWithinForInClause: {
        readonly lambdaWithinForIn: typeof F.lambdaWithinForInClause & {
            from: typeof FR.lambdaWithinForInClauseFrom;
        };
    };
    readonly expressions: {
        readonly expression: typeof F.expressionList & {
            from: typeof FR.expressionListFrom;
        };
    };
    readonly fExpression: {
        readonly expression: typeof F.expressionList & {
            from: typeof FR.expressionListFrom;
        };
        readonly pattern: typeof F.patternList & {
            from: typeof FR.patternListFrom;
        };
        readonly yield_: typeof F.yield_ & {
            from: typeof FR.yield_From;
        };
    };
    readonly leftHandSide: {
        readonly pattern: typeof F.patternList & {
            from: typeof FR.patternListFrom;
        };
    };
    readonly namedExpressionLhs: {
        readonly identifier: typeof F.identifier;
    };
    readonly rightHandSide: {
        readonly expression: typeof F.expressionList & {
            from: typeof FR.expressionListFrom;
        };
        readonly assignment: typeof F.assignment & {
            from: typeof FR.assignmentFrom;
            eq: typeof F.assignmentUFormEq & {
                from: typeof FR.assignmentUFormEqFrom;
            };
            type: typeof F.assignmentUFormType & {
                from: typeof FR.assignmentUFormTypeFrom;
            };
            typed: typeof F.assignmentUFormTyped & {
                from: typeof FR.assignmentUFormTypedFrom;
            };
        };
        readonly augmented: typeof F.augmentedAssignment & {
            from: typeof FR.augmentedAssignmentFrom;
        };
        readonly pattern: typeof F.patternList & {
            from: typeof FR.patternListFrom;
        };
        readonly yield_: typeof F.yield_ & {
            from: typeof FR.yield_From;
        };
    };
    readonly simplePattern: {
        readonly class_: typeof F.classPattern & {
            from: typeof FR.classPatternFrom;
        };
        readonly splat: typeof F.splatPattern & {
            from: typeof FR.splatPatternFrom;
        };
        readonly union: typeof F.unionPattern & {
            from: typeof FR.unionPatternFrom;
        };
        readonly dict: typeof F.dictPattern & {
            from: typeof FR.dictPatternFrom;
        };
        readonly string: typeof F.string & {
            from: typeof FR.stringFrom;
        };
        readonly concatenated: typeof F.concatenatedString & {
            from: typeof FR.concatenatedStringFrom;
        };
        readonly true_: typeof F.true_;
        readonly false_: typeof F.false_;
        readonly none: typeof F.none;
        readonly complex: typeof F.complexPattern & {
            from: typeof FR.complexPatternFrom;
        };
        readonly dotted: typeof F.dottedName & {
            from: typeof FR.dottedNameFrom;
        };
    };
    readonly simpleStatement: {
        readonly futureImport: typeof F.futureImportStatement & {
            from: typeof FR.futureImportStatementFrom;
        };
        readonly import_: typeof F.importStatement & {
            from: typeof FR.importStatementFrom;
        };
        readonly importFrom: typeof F.importFromStatement & {
            from: typeof FR.importFromStatementFrom;
        };
        readonly print: typeof F.printStatement & {
            from: typeof FR.printStatementFrom;
        };
        readonly assert: typeof F.assertStatement & {
            from: typeof FR.assertStatementFrom;
        };
        readonly expression: typeof F.expressionStatement & {
            from: typeof FR.expressionStatementFrom;
        };
        readonly return_: typeof F.returnStatement & {
            from: typeof FR.returnStatementFrom;
        };
        readonly delete_: typeof F.deleteStatement & {
            from: typeof FR.deleteStatementFrom;
        };
        readonly raise: typeof F.raiseStatement & {
            from: typeof FR.raiseStatementFrom;
        };
        readonly pass: typeof F.passStatement;
        readonly break_: typeof F.breakStatement;
        readonly continue_: typeof F.continueStatement;
        readonly global: typeof F.globalStatement & {
            from: typeof FR.globalStatementFrom;
        };
        readonly nonlocal: typeof F.nonlocalStatement & {
            from: typeof FR.nonlocalStatementFrom;
        };
        readonly exec: typeof F.execStatement & {
            from: typeof FR.execStatementFrom;
        };
        readonly typeAlias: typeof F.typeAliasStatement & {
            from: typeof FR.typeAliasStatementFrom;
        };
    };
    readonly statement: {
        readonly if_: typeof F.ifStatement & {
            from: typeof FR.ifStatementFrom;
        };
        readonly for_: typeof F.forStatement & {
            from: typeof FR.forStatementFrom;
        };
        readonly while_: typeof F.whileStatement & {
            from: typeof FR.whileStatementFrom;
        };
        readonly try_: typeof F.tryStatement & {
            from: typeof FR.tryStatementFrom;
        };
        readonly with_: typeof F.withStatement & {
            from: typeof FR.withStatementFrom;
        };
        readonly function_: typeof F.functionDefinition & {
            from: typeof FR.functionDefinitionFrom;
        };
        readonly class_: typeof F.classDefinition & {
            from: typeof FR.classDefinitionFrom;
        };
        readonly decorated: typeof F.decoratedDefinition & {
            from: typeof FR.decoratedDefinitionFrom;
        };
        readonly match: typeof F.matchStatement & {
            from: typeof FR.matchStatementFrom;
        };
    };
    readonly expression: {
        readonly comparison: typeof F.comparisonOperator & {
            from: typeof FR.comparisonOperatorFrom;
        };
        readonly not: typeof F.notOperator & {
            from: typeof FR.notOperatorFrom;
        };
        readonly boolean: typeof F.booleanOperator & {
            from: typeof FR.booleanOperatorFrom;
        };
        readonly lambda: typeof F.lambda & {
            from: typeof FR.lambdaFrom;
        };
        readonly conditional: typeof F.conditionalExpression & {
            from: typeof FR.conditionalExpressionFrom;
        };
        readonly named: typeof F.namedExpression & {
            from: typeof FR.namedExpressionFrom;
        };
        readonly as: typeof F.asPattern & {
            from: typeof FR.asPatternFrom;
        };
    };
    readonly keywordIdentifier: {
        readonly identifier: typeof F.identifier;
    };
    readonly parameter: {
        readonly identifier: typeof F.identifier;
        readonly typed: typeof F.typedParameter & {
            from: typeof FR.typedParameterFrom;
        };
        readonly default_: typeof F.defaultParameter & {
            from: typeof FR.defaultParameterFrom;
        };
        readonly typedDefault: typeof F.typedDefaultParameter & {
            from: typeof FR.typedDefaultParameterFrom;
        };
        readonly listSplat: typeof F.listSplatPattern & {
            from: typeof FR.listSplatPatternFrom;
        };
        readonly tuple: typeof F.tuplePattern & {
            from: typeof FR.tuplePatternFrom;
        };
        readonly dictionarySplat: typeof F.dictionarySplatPattern & {
            from: typeof FR.dictionarySplatPatternFrom;
        };
    };
    readonly pattern: {
        readonly identifier: typeof F.identifier;
        readonly subscript: typeof F.subscript & {
            from: typeof FR.subscriptFrom;
        };
        readonly attribute: typeof F.attribute & {
            from: typeof FR.attributeFrom;
        };
        readonly listSplat: typeof F.listSplatPattern & {
            from: typeof FR.listSplatPatternFrom;
        };
        readonly tuple: typeof F.tuplePattern & {
            from: typeof FR.tuplePatternFrom;
        };
        readonly list: typeof F.listPattern & {
            from: typeof FR.listPatternFrom;
        };
    };
    readonly primaryExpression: {
        readonly await: typeof F.await_ & {
            from: typeof FR.await_From;
        };
        readonly binary: typeof F.binaryOperator & {
            from: typeof FR.binaryOperatorFrom;
        };
        readonly identifier: typeof F.identifier;
        readonly string: typeof F.string & {
            from: typeof FR.stringFrom;
        };
        readonly concatenated: typeof F.concatenatedString & {
            from: typeof FR.concatenatedStringFrom;
        };
        readonly integer: typeof F.integer;
        readonly float: typeof F.float;
        readonly true_: typeof F.true_;
        readonly false_: typeof F.false_;
        readonly none: typeof F.none;
        readonly unary: typeof F.unaryOperator & {
            from: typeof FR.unaryOperatorFrom;
        };
        readonly attribute: typeof F.attribute & {
            from: typeof FR.attributeFrom;
        };
        readonly subscript: typeof F.subscript & {
            from: typeof FR.subscriptFrom;
        };
        readonly call: typeof F.call & {
            from: typeof FR.callFrom;
        };
        readonly list: typeof F.list & {
            from: typeof FR.listFrom;
        };
        readonly dictionary: typeof F.dictionary & {
            from: typeof FR.dictionaryFrom;
        };
        readonly set: typeof F.set & {
            from: typeof FR.setFrom;
        };
        readonly tuple: typeof F.tuple & {
            from: typeof FR.tupleFrom;
        };
        readonly parenthesized: typeof F.parenthesizedExpression & {
            from: typeof FR.parenthesizedExpressionFrom;
        };
        readonly generator: typeof F.generatorExpression & {
            from: typeof FR.generatorExpressionFrom;
        };
        readonly listSplat: typeof F.listSplatPattern & {
            from: typeof FR.listSplatPatternFrom;
        };
    };
};
export declare namespace from {
    function boolean(value: boolean): ReturnType<typeof F.true_> | ReturnType<typeof F.false_>;
    function number(value: number): ReturnType<typeof F.integer> | ReturnType<typeof F.float>;
    function comment(text: string): ReturnType<typeof F.comment>;
    function type(name: string): ReturnType<typeof F.identifier>;
    function identifier(name: string): ReturnType<typeof F.identifier>;
}
//# sourceMappingURL=ir.d.ts.map