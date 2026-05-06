import * as F from './factories.js';
import * as FR from './from.js';
export declare const condition: {
    readonly unary: typeof F.unaryExpression & {
        from: typeof FR.unaryExpressionFrom;
    };
    readonly reference: typeof F.referenceExpression & {
        from: typeof FR.referenceExpressionFrom;
    };
    readonly try_: typeof F.tryExpression & {
        from: typeof FR.tryExpressionFrom;
    };
    readonly binary: typeof F.binaryExpression & {
        from: typeof FR.binaryExpressionFrom;
    };
    readonly assignment: typeof F.assignmentExpression & {
        from: typeof FR.assignmentExpressionFrom;
    };
    readonly compoundAssignment: typeof F.compoundAssignmentExpr & {
        from: typeof FR.compoundAssignmentExprFrom;
    };
    readonly typeCast: typeof F.typeCastExpression & {
        from: typeof FR.typeCastExpressionFrom;
    };
    readonly call: typeof F.callExpression & {
        from: typeof FR.callExpressionFrom;
    };
    readonly return_: typeof F.returnExpression & {
        from: typeof FR.returnExpressionFrom;
    };
    readonly yield_: typeof F.yieldExpression & {
        from: typeof FR.yieldExpressionFrom;
    };
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly self: typeof F.self;
    readonly scoped: typeof F.scopedIdentifier & {
        from: typeof FR.scopedIdentifierFrom;
    };
    readonly generic: typeof F.genericFunction & {
        from: typeof FR.genericFunctionFrom;
    };
    readonly await: typeof F.awaitExpression & {
        from: typeof FR.awaitExpressionFrom;
    };
    readonly field: typeof F.fieldExpression & {
        from: typeof FR.fieldExpressionFrom;
    };
    readonly array: typeof F.arrayExpression & {
        from: typeof FR.arrayExpressionFrom;
        semi: typeof F.arrayExpressionUFormSemi & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
        };
        list: typeof F.arrayExpressionUFormList & {
            from: typeof FR.arrayExpressionUFormListFrom;
        };
    };
    readonly tuple: typeof F.tupleExpression & {
        from: typeof FR.tupleExpressionFrom;
    };
    readonly macro: typeof F.macroInvocation & {
        from: typeof FR.macroInvocationFrom;
    };
    readonly unit: typeof F.unitExpression;
    readonly break_: typeof F.breakExpression & {
        from: typeof FR.breakExpressionFrom;
    };
    readonly continue_: typeof F.continueExpression & {
        from: typeof FR.continueExpressionFrom;
    };
    readonly index: typeof F.indexExpression & {
        from: typeof FR.indexExpressionFrom;
    };
    readonly metavariable: typeof F.metavariable;
    readonly closure: typeof F.closureExpression & {
        from: typeof FR.closureExpressionFrom;
        block: typeof F.closureExpressionUFormBlock & {
            from: typeof FR.closureExpressionUFormBlockFrom;
        };
        expr: typeof F.closureExpressionUFormExpr & {
            from: typeof FR.closureExpressionUFormExprFrom;
        };
    };
    readonly parenthesized: typeof F.parenthesizedExpression & {
        from: typeof FR.parenthesizedExpressionFrom;
    };
    readonly struct: typeof F.structExpression & {
        from: typeof FR.structExpressionFrom;
    };
    readonly unsafe: typeof F.unsafeBlock & {
        from: typeof FR.unsafeBlockFrom;
    };
    readonly async: typeof F.asyncBlock & {
        from: typeof FR.asyncBlockFrom;
    };
    readonly gen: typeof F.genBlock & {
        from: typeof FR.genBlockFrom;
    };
    readonly block: typeof F.block & {
        from: typeof FR.blockFrom;
    };
    readonly if_: typeof F.ifExpression & {
        from: typeof FR.ifExpressionFrom;
    };
    readonly match: typeof F.matchExpression & {
        from: typeof FR.matchExpressionFrom;
    };
    readonly while_: typeof F.whileExpression & {
        from: typeof FR.whileExpressionFrom;
    };
    readonly loop: typeof F.loopExpression & {
        from: typeof FR.loopExpressionFrom;
    };
    readonly for_: typeof F.forExpression & {
        from: typeof FR.forExpressionFrom;
    };
    readonly const_: typeof F.constBlock & {
        from: typeof FR.constBlockFrom;
    };
    readonly range: typeof F.rangeExpression & {
        from: typeof FR.rangeExpressionFrom;
        binary: typeof F.rangeExpressionUFormBinary & {
            from: typeof FR.rangeExpressionUFormBinaryFrom;
        };
        postfix: typeof F.rangeExpressionUFormPostfix & {
            from: typeof FR.rangeExpressionUFormPostfixFrom;
        };
        prefix: typeof F.rangeExpressionUFormPrefix & {
            from: typeof FR.rangeExpressionUFormPrefixFrom;
        };
        bare: typeof F.rangeExpressionUFormBare & {
            from: typeof FR.rangeExpressionUFormBareFrom;
        };
    };
    readonly let_: typeof F.letCondition & {
        from: typeof FR.letConditionFrom;
    };
};
export declare const declarationStatement: {
    readonly const_: typeof F.constItem & {
        from: typeof FR.constItemFrom;
    };
    readonly macro: typeof F.macroInvocation & {
        from: typeof FR.macroInvocationFrom;
    };
    readonly attribute: typeof F.attributeItem & {
        from: typeof FR.attributeItemFrom;
    };
    readonly innerAttribute: typeof F.innerAttributeItem & {
        from: typeof FR.innerAttributeItemFrom;
    };
    readonly mod: typeof F.modItem & {
        from: typeof FR.modItemFrom;
        external: typeof F.modItemUFormExternal & {
            from: typeof FR.modItemUFormExternalFrom;
        };
        inline: typeof F.modItemUFormInline & {
            from: typeof FR.modItemUFormInlineFrom;
        };
    };
    readonly foreignMod: typeof F.foreignModItem & {
        from: typeof FR.foreignModItemFrom;
        semi: typeof F.foreignModItemUFormSemi & {
            from: typeof FR.foreignModItemUFormSemiFrom;
        };
        body: typeof F.foreignModItemUFormBody & {
            from: typeof FR.foreignModItemUFormBodyFrom;
        };
    };
    readonly struct: typeof F.structItem & {
        from: typeof FR.structItemFrom;
        brace: typeof F.structItemUFormBrace & {
            from: typeof FR.structItemUFormBraceFrom;
        };
        tuple: typeof F.structItemUFormTuple & {
            from: typeof FR.structItemUFormTupleFrom;
        };
        unit: typeof F.structItemUFormUnit & {
            from: typeof FR.structItemUFormUnitFrom;
        };
    };
    readonly union: typeof F.unionItem & {
        from: typeof FR.unionItemFrom;
    };
    readonly enum_: typeof F.enumItem & {
        from: typeof FR.enumItemFrom;
    };
    readonly type: typeof F.typeItem & {
        from: typeof FR.typeItemFrom;
    };
    readonly function_: typeof F.functionItem & {
        from: typeof FR.functionItemFrom;
    };
    readonly functionSignature: typeof F.functionSignatureItem & {
        from: typeof FR.functionSignatureItemFrom;
    };
    readonly impl: typeof F.implItem & {
        from: typeof FR.implItemFrom;
        body: typeof F.implItemUFormBody & {
            from: typeof FR.implItemUFormBodyFrom;
        };
        semi: typeof F.implItemUFormSemi & {
            from: typeof FR.implItemUFormSemiFrom;
        };
    };
    readonly trait: typeof F.traitItem & {
        from: typeof FR.traitItemFrom;
    };
    readonly associated: typeof F.associatedType & {
        from: typeof FR.associatedTypeFrom;
    };
    readonly let_: typeof F.letDeclaration & {
        from: typeof FR.letDeclarationFrom;
    };
    readonly use: typeof F.useDeclaration & {
        from: typeof FR.useDeclarationFrom;
    };
    readonly externCrate: typeof F.externCrateDeclaration & {
        from: typeof FR.externCrateDeclarationFrom;
    };
    readonly static_: typeof F.staticItem & {
        from: typeof FR.staticItemFrom;
    };
};
export declare const delimTokens: {
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly mutable: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super_: typeof F.super_;
    readonly crate: typeof F.crate;
    readonly delimToken: typeof F.delimTokenTree & {
        from: typeof FR.delimTokenTreeFrom;
        paren: typeof F.delimTokenTreeUFormParen & {
            from: typeof FR.delimTokenTreeUFormParenFrom;
        };
        bracket: typeof F.delimTokenTreeUFormBracket & {
            from: typeof FR.delimTokenTreeUFormBracketFrom;
        };
        brace: typeof F.delimTokenTreeUFormBrace & {
            from: typeof FR.delimTokenTreeUFormBraceFrom;
        };
    };
};
export declare const expression: {
    readonly unary: typeof F.unaryExpression & {
        from: typeof FR.unaryExpressionFrom;
    };
    readonly reference: typeof F.referenceExpression & {
        from: typeof FR.referenceExpressionFrom;
    };
    readonly try_: typeof F.tryExpression & {
        from: typeof FR.tryExpressionFrom;
    };
    readonly binary: typeof F.binaryExpression & {
        from: typeof FR.binaryExpressionFrom;
    };
    readonly assignment: typeof F.assignmentExpression & {
        from: typeof FR.assignmentExpressionFrom;
    };
    readonly compoundAssignment: typeof F.compoundAssignmentExpr & {
        from: typeof FR.compoundAssignmentExprFrom;
    };
    readonly typeCast: typeof F.typeCastExpression & {
        from: typeof FR.typeCastExpressionFrom;
    };
    readonly call: typeof F.callExpression & {
        from: typeof FR.callExpressionFrom;
    };
    readonly return_: typeof F.returnExpression & {
        from: typeof FR.returnExpressionFrom;
    };
    readonly yield_: typeof F.yieldExpression & {
        from: typeof FR.yieldExpressionFrom;
    };
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly self: typeof F.self;
    readonly scoped: typeof F.scopedIdentifier & {
        from: typeof FR.scopedIdentifierFrom;
    };
    readonly generic: typeof F.genericFunction & {
        from: typeof FR.genericFunctionFrom;
    };
    readonly await: typeof F.awaitExpression & {
        from: typeof FR.awaitExpressionFrom;
    };
    readonly field: typeof F.fieldExpression & {
        from: typeof FR.fieldExpressionFrom;
    };
    readonly array: typeof F.arrayExpression & {
        from: typeof FR.arrayExpressionFrom;
        semi: typeof F.arrayExpressionUFormSemi & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
        };
        list: typeof F.arrayExpressionUFormList & {
            from: typeof FR.arrayExpressionUFormListFrom;
        };
    };
    readonly tuple: typeof F.tupleExpression & {
        from: typeof FR.tupleExpressionFrom;
    };
    readonly macro: typeof F.macroInvocation & {
        from: typeof FR.macroInvocationFrom;
    };
    readonly unit: typeof F.unitExpression;
    readonly break_: typeof F.breakExpression & {
        from: typeof FR.breakExpressionFrom;
    };
    readonly continue_: typeof F.continueExpression & {
        from: typeof FR.continueExpressionFrom;
    };
    readonly index: typeof F.indexExpression & {
        from: typeof FR.indexExpressionFrom;
    };
    readonly metavariable: typeof F.metavariable;
    readonly closure: typeof F.closureExpression & {
        from: typeof FR.closureExpressionFrom;
        block: typeof F.closureExpressionUFormBlock & {
            from: typeof FR.closureExpressionUFormBlockFrom;
        };
        expr: typeof F.closureExpressionUFormExpr & {
            from: typeof FR.closureExpressionUFormExprFrom;
        };
    };
    readonly parenthesized: typeof F.parenthesizedExpression & {
        from: typeof FR.parenthesizedExpressionFrom;
    };
    readonly struct: typeof F.structExpression & {
        from: typeof FR.structExpressionFrom;
    };
    readonly unsafe: typeof F.unsafeBlock & {
        from: typeof FR.unsafeBlockFrom;
    };
    readonly async: typeof F.asyncBlock & {
        from: typeof FR.asyncBlockFrom;
    };
    readonly gen: typeof F.genBlock & {
        from: typeof FR.genBlockFrom;
    };
    readonly block: typeof F.block & {
        from: typeof FR.blockFrom;
    };
    readonly if_: typeof F.ifExpression & {
        from: typeof FR.ifExpressionFrom;
    };
    readonly match: typeof F.matchExpression & {
        from: typeof FR.matchExpressionFrom;
    };
    readonly while_: typeof F.whileExpression & {
        from: typeof FR.whileExpressionFrom;
    };
    readonly loop: typeof F.loopExpression & {
        from: typeof FR.loopExpressionFrom;
    };
    readonly for_: typeof F.forExpression & {
        from: typeof FR.forExpressionFrom;
    };
    readonly const_: typeof F.constBlock & {
        from: typeof FR.constBlockFrom;
    };
    readonly range: typeof F.rangeExpression & {
        from: typeof FR.rangeExpressionFrom;
        binary: typeof F.rangeExpressionUFormBinary & {
            from: typeof FR.rangeExpressionUFormBinaryFrom;
        };
        postfix: typeof F.rangeExpressionUFormPostfix & {
            from: typeof FR.rangeExpressionUFormPostfixFrom;
        };
        prefix: typeof F.rangeExpressionUFormPrefix & {
            from: typeof FR.rangeExpressionUFormPrefixFrom;
        };
        bare: typeof F.rangeExpressionUFormBare & {
            from: typeof FR.rangeExpressionUFormBareFrom;
        };
    };
};
export declare const expressionEndingWithBlock: {
    readonly unsafe: typeof F.unsafeBlock & {
        from: typeof FR.unsafeBlockFrom;
    };
    readonly async: typeof F.asyncBlock & {
        from: typeof FR.asyncBlockFrom;
    };
    readonly gen: typeof F.genBlock & {
        from: typeof FR.genBlockFrom;
    };
    readonly try_: typeof F.tryBlock & {
        from: typeof FR.tryBlockFrom;
    };
    readonly block: typeof F.block & {
        from: typeof FR.blockFrom;
    };
    readonly if_: typeof F.ifExpression & {
        from: typeof FR.ifExpressionFrom;
    };
    readonly match: typeof F.matchExpression & {
        from: typeof FR.matchExpressionFrom;
    };
    readonly while_: typeof F.whileExpression & {
        from: typeof FR.whileExpressionFrom;
    };
    readonly loop: typeof F.loopExpression & {
        from: typeof FR.loopExpressionFrom;
    };
    readonly for_: typeof F.forExpression & {
        from: typeof FR.forExpressionFrom;
    };
    readonly const_: typeof F.constBlock & {
        from: typeof FR.constBlockFrom;
    };
};
export declare const expressionExceptRange: {
    readonly unary: typeof F.unaryExpression & {
        from: typeof FR.unaryExpressionFrom;
    };
    readonly reference: typeof F.referenceExpression & {
        from: typeof FR.referenceExpressionFrom;
    };
    readonly try_: typeof F.tryExpression & {
        from: typeof FR.tryExpressionFrom;
    };
    readonly binary: typeof F.binaryExpression & {
        from: typeof FR.binaryExpressionFrom;
    };
    readonly assignment: typeof F.assignmentExpression & {
        from: typeof FR.assignmentExpressionFrom;
    };
    readonly compoundAssignment: typeof F.compoundAssignmentExpr & {
        from: typeof FR.compoundAssignmentExprFrom;
    };
    readonly typeCast: typeof F.typeCastExpression & {
        from: typeof FR.typeCastExpressionFrom;
    };
    readonly call: typeof F.callExpression & {
        from: typeof FR.callExpressionFrom;
    };
    readonly return_: typeof F.returnExpression & {
        from: typeof FR.returnExpressionFrom;
    };
    readonly yield_: typeof F.yieldExpression & {
        from: typeof FR.yieldExpressionFrom;
    };
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly self: typeof F.self;
    readonly scoped: typeof F.scopedIdentifier & {
        from: typeof FR.scopedIdentifierFrom;
    };
    readonly generic: typeof F.genericFunction & {
        from: typeof FR.genericFunctionFrom;
    };
    readonly await: typeof F.awaitExpression & {
        from: typeof FR.awaitExpressionFrom;
    };
    readonly field: typeof F.fieldExpression & {
        from: typeof FR.fieldExpressionFrom;
    };
    readonly array: typeof F.arrayExpression & {
        from: typeof FR.arrayExpressionFrom;
        semi: typeof F.arrayExpressionUFormSemi & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
        };
        list: typeof F.arrayExpressionUFormList & {
            from: typeof FR.arrayExpressionUFormListFrom;
        };
    };
    readonly tuple: typeof F.tupleExpression & {
        from: typeof FR.tupleExpressionFrom;
    };
    readonly macro: typeof F.macroInvocation & {
        from: typeof FR.macroInvocationFrom;
    };
    readonly unit: typeof F.unitExpression;
    readonly break_: typeof F.breakExpression & {
        from: typeof FR.breakExpressionFrom;
    };
    readonly continue_: typeof F.continueExpression & {
        from: typeof FR.continueExpressionFrom;
    };
    readonly index: typeof F.indexExpression & {
        from: typeof FR.indexExpressionFrom;
    };
    readonly metavariable: typeof F.metavariable;
    readonly closure: typeof F.closureExpression & {
        from: typeof FR.closureExpressionFrom;
        block: typeof F.closureExpressionUFormBlock & {
            from: typeof FR.closureExpressionUFormBlockFrom;
        };
        expr: typeof F.closureExpressionUFormExpr & {
            from: typeof FR.closureExpressionUFormExprFrom;
        };
    };
    readonly parenthesized: typeof F.parenthesizedExpression & {
        from: typeof FR.parenthesizedExpressionFrom;
    };
    readonly struct: typeof F.structExpression & {
        from: typeof FR.structExpressionFrom;
    };
    readonly unsafe: typeof F.unsafeBlock & {
        from: typeof FR.unsafeBlockFrom;
    };
    readonly async: typeof F.asyncBlock & {
        from: typeof FR.asyncBlockFrom;
    };
    readonly gen: typeof F.genBlock & {
        from: typeof FR.genBlockFrom;
    };
    readonly block: typeof F.block & {
        from: typeof FR.blockFrom;
    };
    readonly if_: typeof F.ifExpression & {
        from: typeof FR.ifExpressionFrom;
    };
    readonly match: typeof F.matchExpression & {
        from: typeof FR.matchExpressionFrom;
    };
    readonly while_: typeof F.whileExpression & {
        from: typeof FR.whileExpressionFrom;
    };
    readonly loop: typeof F.loopExpression & {
        from: typeof FR.loopExpressionFrom;
    };
    readonly for_: typeof F.forExpression & {
        from: typeof FR.forExpressionFrom;
    };
    readonly const_: typeof F.constBlock & {
        from: typeof FR.constBlockFrom;
    };
};
export declare const literal: {
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
};
export declare const literalPattern: {
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly negative: typeof F.negativeLiteral & {
        from: typeof FR.negativeLiteralFrom;
    };
};
export declare const nonDelimToken: {
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly mutable: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super_: typeof F.super_;
    readonly crate: typeof F.crate;
};
export declare const path: {
    readonly self: typeof F.self;
    readonly identifier: typeof F.identifier;
    readonly metavariable: typeof F.metavariable;
    readonly super_: typeof F.super_;
    readonly crate: typeof F.crate;
    readonly scoped: typeof F.scopedIdentifier & {
        from: typeof FR.scopedIdentifierFrom;
    };
};
export declare const pattern: {
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly negative: typeof F.negativeLiteral & {
        from: typeof FR.negativeLiteralFrom;
    };
    readonly identifier: typeof F.identifier;
    readonly scoped: typeof F.scopedIdentifier & {
        from: typeof FR.scopedIdentifierFrom;
    };
    readonly generic: typeof F.genericPattern & {
        from: typeof FR.genericPatternFrom;
    };
    readonly tuple: typeof F.tuplePattern & {
        from: typeof FR.tuplePatternFrom;
    };
    readonly tupleStruct: typeof F.tupleStructPattern & {
        from: typeof FR.tupleStructPatternFrom;
    };
    readonly struct: typeof F.structPattern & {
        from: typeof FR.structPatternFrom;
    };
    readonly ref: typeof F.refPattern & {
        from: typeof FR.refPatternFrom;
    };
    readonly slice: typeof F.slicePattern & {
        from: typeof FR.slicePatternFrom;
    };
    readonly captured: typeof F.capturedPattern & {
        from: typeof FR.capturedPatternFrom;
    };
    readonly reference: typeof F.referencePattern & {
        from: typeof FR.referencePatternFrom;
    };
    readonly mut: typeof F.mutPattern & {
        from: typeof FR.mutPatternFrom;
    };
    readonly range: typeof F.rangePattern & {
        from: typeof FR.rangePatternFrom;
        left_with_right: typeof F.rangePatternUFormLeftWithRight & {
            from: typeof FR.rangePatternUFormLeftWithRightFrom;
        };
        left_bare: typeof F.rangePatternUFormLeftBare & {
            from: typeof FR.rangePatternUFormLeftBareFrom;
        };
        prefix: typeof F.rangePatternUFormPrefix & {
            from: typeof FR.rangePatternUFormPrefixFrom;
        };
    };
    readonly or: typeof F.orPattern & {
        from: typeof FR.orPatternFrom;
        binary: typeof F.orPatternUFormBinary & {
            from: typeof FR.orPatternUFormBinaryFrom;
        };
        prefix: typeof F.orPatternUFormPrefix & {
            from: typeof FR.orPatternUFormPrefixFrom;
        };
    };
    readonly const_: typeof F.constBlock & {
        from: typeof FR.constBlockFrom;
    };
    readonly macro: typeof F.macroInvocation & {
        from: typeof FR.macroInvocationFrom;
    };
};
export declare const statement: {
    readonly expression: typeof F.expressionStatement & {
        from: typeof FR.expressionStatementFrom;
        with_semi: typeof F.expressionStatementUFormWithSemi & {
            from: typeof FR.expressionStatementUFormWithSemiFrom;
        };
        block_ending: typeof F.expressionStatementUFormBlockEnding & {
            from: typeof FR.expressionStatementUFormBlockEndingFrom;
        };
    };
    readonly const_: typeof F.constItem & {
        from: typeof FR.constItemFrom;
    };
    readonly macro: typeof F.macroInvocation & {
        from: typeof FR.macroInvocationFrom;
    };
    readonly attribute: typeof F.attributeItem & {
        from: typeof FR.attributeItemFrom;
    };
    readonly innerAttribute: typeof F.innerAttributeItem & {
        from: typeof FR.innerAttributeItemFrom;
    };
    readonly mod: typeof F.modItem & {
        from: typeof FR.modItemFrom;
        external: typeof F.modItemUFormExternal & {
            from: typeof FR.modItemUFormExternalFrom;
        };
        inline: typeof F.modItemUFormInline & {
            from: typeof FR.modItemUFormInlineFrom;
        };
    };
    readonly foreignMod: typeof F.foreignModItem & {
        from: typeof FR.foreignModItemFrom;
        semi: typeof F.foreignModItemUFormSemi & {
            from: typeof FR.foreignModItemUFormSemiFrom;
        };
        body: typeof F.foreignModItemUFormBody & {
            from: typeof FR.foreignModItemUFormBodyFrom;
        };
    };
    readonly struct: typeof F.structItem & {
        from: typeof FR.structItemFrom;
        brace: typeof F.structItemUFormBrace & {
            from: typeof FR.structItemUFormBraceFrom;
        };
        tuple: typeof F.structItemUFormTuple & {
            from: typeof FR.structItemUFormTupleFrom;
        };
        unit: typeof F.structItemUFormUnit & {
            from: typeof FR.structItemUFormUnitFrom;
        };
    };
    readonly union: typeof F.unionItem & {
        from: typeof FR.unionItemFrom;
    };
    readonly enum_: typeof F.enumItem & {
        from: typeof FR.enumItemFrom;
    };
    readonly type: typeof F.typeItem & {
        from: typeof FR.typeItemFrom;
    };
    readonly function_: typeof F.functionItem & {
        from: typeof FR.functionItemFrom;
    };
    readonly functionSignature: typeof F.functionSignatureItem & {
        from: typeof FR.functionSignatureItemFrom;
    };
    readonly impl: typeof F.implItem & {
        from: typeof FR.implItemFrom;
        body: typeof F.implItemUFormBody & {
            from: typeof FR.implItemUFormBodyFrom;
        };
        semi: typeof F.implItemUFormSemi & {
            from: typeof FR.implItemUFormSemiFrom;
        };
    };
    readonly trait: typeof F.traitItem & {
        from: typeof FR.traitItemFrom;
    };
    readonly associated: typeof F.associatedType & {
        from: typeof FR.associatedTypeFrom;
    };
    readonly let_: typeof F.letDeclaration & {
        from: typeof FR.letDeclarationFrom;
    };
    readonly use: typeof F.useDeclaration & {
        from: typeof FR.useDeclarationFrom;
    };
    readonly externCrate: typeof F.externCrateDeclaration & {
        from: typeof FR.externCrateDeclarationFrom;
    };
    readonly static_: typeof F.staticItem & {
        from: typeof FR.staticItemFrom;
    };
};
export declare const tokenPattern: {
    readonly tokenTree: typeof F.tokenTreePattern & {
        from: typeof FR.tokenTreePatternFrom;
        paren: typeof F.tokenTreePatternUFormParen & {
            from: typeof FR.tokenTreePatternUFormParenFrom;
        };
        bracket: typeof F.tokenTreePatternUFormBracket & {
            from: typeof FR.tokenTreePatternUFormBracketFrom;
        };
        brace: typeof F.tokenTreePatternUFormBrace & {
            from: typeof FR.tokenTreePatternUFormBraceFrom;
        };
    };
    readonly tokenRepetition: typeof F.tokenRepetitionPattern & {
        from: typeof FR.tokenRepetitionPatternFrom;
    };
    readonly tokenBinding: typeof F.tokenBindingPattern & {
        from: typeof FR.tokenBindingPatternFrom;
    };
    readonly metavariable: typeof F.metavariable;
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly mutable: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super_: typeof F.super_;
    readonly crate: typeof F.crate;
};
export declare const tokens: {
    readonly token: typeof F.tokenTree & {
        from: typeof FR.tokenTreeFrom;
        paren: typeof F.tokenTreeUFormParen & {
            from: typeof FR.tokenTreeUFormParenFrom;
        };
        bracket: typeof F.tokenTreeUFormBracket & {
            from: typeof FR.tokenTreeUFormBracketFrom;
        };
        brace: typeof F.tokenTreeUFormBrace & {
            from: typeof FR.tokenTreeUFormBraceFrom;
        };
    };
    readonly metavariable: typeof F.metavariable;
    readonly string: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly rawString: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly mutable: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super_: typeof F.super_;
    readonly crate: typeof F.crate;
};
export declare const type: {
    readonly abstract: typeof F.abstractType & {
        from: typeof FR.abstractTypeFrom;
    };
    readonly reference: typeof F.referenceType & {
        from: typeof FR.referenceTypeFrom;
    };
    readonly metavariable: typeof F.metavariable;
    readonly pointer: typeof F.pointerType & {
        from: typeof FR.pointerTypeFrom;
        const: typeof F.pointerTypeUFormConst & {
            from: typeof FR.pointerTypeUFormConstFrom;
        };
        mut: typeof F.pointerTypeUFormMut & {
            from: typeof FR.pointerTypeUFormMutFrom;
        };
    };
    readonly generic: typeof F.genericType & {
        from: typeof FR.genericTypeFrom;
    };
    readonly scopedType: typeof F.scopedTypeIdentifier & {
        from: typeof FR.scopedTypeIdentifierFrom;
    };
    readonly tuple: typeof F.tupleType & {
        from: typeof FR.tupleTypeFrom;
    };
    readonly unit: typeof F.unitType;
    readonly array: typeof F.arrayType & {
        from: typeof FR.arrayTypeFrom;
    };
    readonly function_: typeof F.functionType & {
        from: typeof FR.functionTypeFrom;
    };
    readonly identifier: typeof F.identifier;
    readonly macro: typeof F.macroInvocation & {
        from: typeof FR.macroInvocationFrom;
    };
    readonly dynamic: typeof F.dynamicType & {
        from: typeof FR.dynamicTypeFrom;
    };
    readonly bounded: typeof F.boundedType & {
        from: typeof FR.boundedTypeFrom;
    };
    readonly removedTrait: typeof F.removedTraitBound & {
        from: typeof FR.removedTraitBoundFrom;
    };
};
export declare const useClause: {
    readonly self: typeof F.self;
    readonly identifier: typeof F.identifier;
    readonly metavariable: typeof F.metavariable;
    readonly super_: typeof F.super_;
    readonly crate: typeof F.crate;
    readonly scoped: typeof F.scopedIdentifier & {
        from: typeof FR.scopedIdentifierFrom;
    };
    readonly useAs: typeof F.useAsClause & {
        from: typeof FR.useAsClauseFrom;
    };
    readonly use: typeof F.useList & {
        from: typeof FR.useListFrom;
    };
    readonly scopedUse: typeof F.scopedUseList & {
        from: typeof FR.scopedUseListFrom;
    };
};
export declare const ir: {
    readonly abstractType: typeof F.abstractType & {
        from: typeof FR.abstractTypeFrom;
    };
    readonly arguments: typeof F.arguments_ & {
        from: typeof FR.arguments_From;
    };
    readonly array: typeof F.arrayExpression & {
        from: typeof FR.arrayExpressionFrom;
        semi: typeof F.arrayExpressionUFormSemi & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
        };
        list: typeof F.arrayExpressionUFormList & {
            from: typeof FR.arrayExpressionUFormListFrom;
        };
    };
    readonly arrayType: typeof F.arrayType & {
        from: typeof FR.arrayTypeFrom;
    };
    readonly assignment: typeof F.assignmentExpression & {
        from: typeof FR.assignmentExpressionFrom;
    };
    readonly associatedType: typeof F.associatedType & {
        from: typeof FR.associatedTypeFrom;
    };
    readonly asyncBlock: typeof F.asyncBlock & {
        from: typeof FR.asyncBlockFrom;
    };
    readonly attribute: typeof F.attribute & {
        from: typeof FR.attributeFrom;
    };
    readonly attributeItem: typeof F.attributeItem & {
        from: typeof FR.attributeItemFrom;
    };
    readonly awaitExpression: typeof F.awaitExpression & {
        from: typeof FR.awaitExpressionFrom;
    };
    readonly baseFieldInitializer: typeof F.baseFieldInitializer & {
        from: typeof FR.baseFieldInitializerFrom;
    };
    readonly binary: typeof F.binaryExpression & {
        from: typeof FR.binaryExpressionFrom;
    };
    readonly block: typeof F.block & {
        from: typeof FR.blockFrom;
    };
    readonly blockComment: typeof F.blockComment & {
        from: typeof FR.blockCommentFrom;
    };
    readonly boundedType: typeof F.boundedType & {
        from: typeof FR.boundedTypeFrom;
    };
    readonly bracketedType: typeof F.bracketedType & {
        from: typeof FR.bracketedTypeFrom;
    };
    readonly breakExpression: typeof F.breakExpression & {
        from: typeof FR.breakExpressionFrom;
    };
    readonly call: typeof F.callExpression & {
        from: typeof FR.callExpressionFrom;
    };
    readonly capturedPattern: typeof F.capturedPattern & {
        from: typeof FR.capturedPatternFrom;
    };
    readonly closureExpressionExpr: typeof F.closureExpressionExpr & {
        from: typeof FR.closureExpressionExprFrom;
    };
    readonly closure: typeof F.closureExpression & {
        from: typeof FR.closureExpressionFrom;
        block: typeof F.closureExpressionUFormBlock & {
            from: typeof FR.closureExpressionUFormBlockFrom;
        };
        expr: typeof F.closureExpressionUFormExpr & {
            from: typeof FR.closureExpressionUFormExprFrom;
        };
    };
    readonly closureParameters: typeof F.closureParameters & {
        from: typeof FR.closureParametersFrom;
    };
    readonly compoundAssignmentExpr: typeof F.compoundAssignmentExpr & {
        from: typeof FR.compoundAssignmentExprFrom;
    };
    readonly constBlock: typeof F.constBlock & {
        from: typeof FR.constBlockFrom;
    };
    readonly constItem: typeof F.constItem & {
        from: typeof FR.constItemFrom;
    };
    readonly constParameter: typeof F.constParameter & {
        from: typeof FR.constParameterFrom;
    };
    readonly continueExpression: typeof F.continueExpression & {
        from: typeof FR.continueExpressionFrom;
    };
    readonly declarationList: typeof F.declarationList & {
        from: typeof FR.declarationListFrom;
    };
    readonly delimTokenTreeParen: typeof F.delimTokenTreeParen & {
        from: typeof FR.delimTokenTreeParenFrom;
    };
    readonly delimTokenTreeBracket: typeof F.delimTokenTreeBracket & {
        from: typeof FR.delimTokenTreeBracketFrom;
    };
    readonly delimTokenTreeBrace: typeof F.delimTokenTreeBrace & {
        from: typeof FR.delimTokenTreeBraceFrom;
    };
    readonly delimTokenTree: typeof F.delimTokenTree & {
        from: typeof FR.delimTokenTreeFrom;
        paren: typeof F.delimTokenTreeUFormParen & {
            from: typeof FR.delimTokenTreeUFormParenFrom;
        };
        bracket: typeof F.delimTokenTreeUFormBracket & {
            from: typeof FR.delimTokenTreeUFormBracketFrom;
        };
        brace: typeof F.delimTokenTreeUFormBrace & {
            from: typeof FR.delimTokenTreeUFormBraceFrom;
        };
    };
    readonly dynamicType: typeof F.dynamicType & {
        from: typeof FR.dynamicTypeFrom;
    };
    readonly elseClause: typeof F.elseClause & {
        from: typeof FR.elseClauseFrom;
    };
    readonly enumItem: typeof F.enumItem & {
        from: typeof FR.enumItemFrom;
    };
    readonly enumVariant: typeof F.enumVariant & {
        from: typeof FR.enumVariantFrom;
    };
    readonly enumVariantList: typeof F.enumVariantList & {
        from: typeof FR.enumVariantListFrom;
    };
    readonly expressionStatementWithSemi: typeof F.expressionStatementWithSemi & {
        from: typeof FR.expressionStatementWithSemiFrom;
    };
    readonly expressionStatementBlockEnding: typeof F.expressionStatementBlockEnding & {
        from: typeof FR.expressionStatementBlockEndingFrom;
    };
    readonly expressionStatement: typeof F.expressionStatement & {
        from: typeof FR.expressionStatementFrom;
        with_semi: typeof F.expressionStatementUFormWithSemi & {
            from: typeof FR.expressionStatementUFormWithSemiFrom;
        };
        block_ending: typeof F.expressionStatementUFormBlockEnding & {
            from: typeof FR.expressionStatementUFormBlockEndingFrom;
        };
    };
    readonly externCrate: typeof F.externCrateDeclaration & {
        from: typeof FR.externCrateDeclarationFrom;
    };
    readonly externModifier: typeof F.externModifier & {
        from: typeof FR.externModifierFrom;
    };
    readonly field: typeof F.fieldDeclaration & {
        from: typeof FR.fieldDeclarationFrom;
    };
    readonly fieldDeclarationList: typeof F.fieldDeclarationList & {
        from: typeof FR.fieldDeclarationListFrom;
    };
    readonly fieldExpression: typeof F.fieldExpression & {
        from: typeof FR.fieldExpressionFrom;
    };
    readonly fieldInitializer: typeof F.fieldInitializer & {
        from: typeof FR.fieldInitializerFrom;
    };
    readonly fieldInitializerList: typeof F.fieldInitializerList & {
        from: typeof FR.fieldInitializerListFrom;
    };
    readonly fieldPatternShorthand: typeof F.fieldPatternShorthand & {
        from: typeof FR.fieldPatternShorthandFrom;
    };
    readonly fieldPattern: typeof F.fieldPattern & {
        from: typeof FR.fieldPatternFrom;
        shorthand: typeof F.fieldPatternUFormShorthand & {
            from: typeof FR.fieldPatternUFormShorthandFrom;
        };
        named: typeof F.fieldPatternUFormNamed & {
            from: typeof FR.fieldPatternUFormNamedFrom;
        };
    };
    readonly forExpression: typeof F.forExpression & {
        from: typeof FR.forExpressionFrom;
    };
    readonly forLifetimes: typeof F.forLifetimes & {
        from: typeof FR.forLifetimesFrom;
    };
    readonly foreignModItemBody: typeof F.foreignModItemBody & {
        from: typeof FR.foreignModItemBodyFrom;
    };
    readonly foreignMod: typeof F.foreignModItem & {
        from: typeof FR.foreignModItemFrom;
        semi: typeof F.foreignModItemUFormSemi & {
            from: typeof FR.foreignModItemUFormSemiFrom;
        };
        body: typeof F.foreignModItemUFormBody & {
            from: typeof FR.foreignModItemUFormBodyFrom;
        };
    };
    readonly functionItem: typeof F.functionItem & {
        from: typeof FR.functionItemFrom;
    };
    readonly functionModifiers: typeof F.functionModifiers & {
        from: typeof FR.functionModifiersFrom;
    };
    readonly functionSignature: typeof F.functionSignatureItem & {
        from: typeof FR.functionSignatureItemFrom;
    };
    readonly functionType: typeof F.functionType & {
        from: typeof FR.functionTypeFrom;
    };
    readonly genBlock: typeof F.genBlock & {
        from: typeof FR.genBlockFrom;
    };
    readonly genericFunction: typeof F.genericFunction & {
        from: typeof FR.genericFunctionFrom;
    };
    readonly genericPattern: typeof F.genericPattern & {
        from: typeof FR.genericPatternFrom;
    };
    readonly genericType: typeof F.genericType & {
        from: typeof FR.genericTypeFrom;
    };
    readonly genericTypeWithTurbofish: typeof F.genericTypeWithTurbofish & {
        from: typeof FR.genericTypeWithTurbofishFrom;
    };
    readonly higherRankedTraitBound: typeof F.higherRankedTraitBound & {
        from: typeof FR.higherRankedTraitBoundFrom;
    };
    readonly ifExpression: typeof F.ifExpression & {
        from: typeof FR.ifExpressionFrom;
    };
    readonly implItemBody: typeof F.implItemBody & {
        from: typeof FR.implItemBodyFrom;
    };
    readonly impl: typeof F.implItem & {
        from: typeof FR.implItemFrom;
        body: typeof F.implItemUFormBody & {
            from: typeof FR.implItemUFormBodyFrom;
        };
        semi: typeof F.implItemUFormSemi & {
            from: typeof FR.implItemUFormSemiFrom;
        };
    };
    readonly index: typeof F.indexExpression & {
        from: typeof FR.indexExpressionFrom;
    };
    readonly innerAttribute: typeof F.innerAttributeItem & {
        from: typeof FR.innerAttributeItemFrom;
    };
    readonly label: typeof F.label & {
        from: typeof FR.labelFrom;
    };
    readonly lastMatchArm: typeof F.lastMatchArm & {
        from: typeof FR.lastMatchArmFrom;
    };
    readonly letCondition: typeof F.letCondition & {
        from: typeof FR.letConditionFrom;
    };
    readonly letDeclaration: typeof F.letDeclaration & {
        from: typeof FR.letDeclarationFrom;
    };
    readonly lifetime: typeof F.lifetime & {
        from: typeof FR.lifetimeFrom;
    };
    readonly lifetimeParameter: typeof F.lifetimeParameter & {
        from: typeof FR.lifetimeParameterFrom;
    };
    readonly lineComment: typeof F.lineComment & {
        from: typeof FR.lineCommentFrom;
        regular_dslash: typeof F.lineCommentUFormRegularDslash & {
            from: typeof FR.lineCommentUFormRegularDslashFrom;
        };
        doc: typeof F.lineCommentUFormDoc & {
            from: typeof FR.lineCommentUFormDocFrom;
        };
        content: typeof F.lineCommentUFormContent & {
            from: typeof FR.lineCommentUFormContentFrom;
        };
    };
    readonly loop: typeof F.loopExpression & {
        from: typeof FR.loopExpressionFrom;
    };
    readonly macroDefinitionParen: typeof F.macroDefinitionParen & {
        from: typeof FR.macroDefinitionParenFrom;
    };
    readonly macroDefinitionBracket: typeof F.macroDefinitionBracket & {
        from: typeof FR.macroDefinitionBracketFrom;
    };
    readonly macroDefinitionBrace: typeof F.macroDefinitionBrace & {
        from: typeof FR.macroDefinitionBraceFrom;
    };
    readonly macro: typeof F.macroDefinition & {
        from: typeof FR.macroDefinitionFrom;
        paren: typeof F.macroDefinitionUFormParen & {
            from: typeof FR.macroDefinitionUFormParenFrom;
        };
        bracket: typeof F.macroDefinitionUFormBracket & {
            from: typeof FR.macroDefinitionUFormBracketFrom;
        };
        brace: typeof F.macroDefinitionUFormBrace & {
            from: typeof FR.macroDefinitionUFormBraceFrom;
        };
    };
    readonly macroInvocation: typeof F.macroInvocation & {
        from: typeof FR.macroInvocationFrom;
    };
    readonly macroRule: typeof F.macroRule & {
        from: typeof FR.macroRuleFrom;
    };
    readonly matchArmBlockEnding: typeof F.matchArmBlockEnding & {
        from: typeof FR.matchArmBlockEndingFrom;
    };
    readonly matchArm: typeof F.matchArm & {
        from: typeof FR.matchArmFrom;
        with_comma: typeof F.matchArmUFormWithComma & {
            from: typeof FR.matchArmUFormWithCommaFrom;
        };
        block_ending: typeof F.matchArmUFormBlockEnding & {
            from: typeof FR.matchArmUFormBlockEndingFrom;
        };
    };
    readonly matchBlock: typeof F.matchBlock & {
        from: typeof FR.matchBlockFrom;
    };
    readonly match: typeof F.matchExpression & {
        from: typeof FR.matchExpressionFrom;
    };
    readonly matchPattern: typeof F.matchPattern & {
        from: typeof FR.matchPatternFrom;
    };
    readonly modItemInline: typeof F.modItemInline & {
        from: typeof FR.modItemInlineFrom;
    };
    readonly mod: typeof F.modItem & {
        from: typeof FR.modItemFrom;
        external: typeof F.modItemUFormExternal & {
            from: typeof FR.modItemUFormExternalFrom;
        };
        inline: typeof F.modItemUFormInline & {
            from: typeof FR.modItemUFormInlineFrom;
        };
    };
    readonly mutPattern: typeof F.mutPattern & {
        from: typeof FR.mutPatternFrom;
    };
    readonly negativeLiteral: typeof F.negativeLiteral & {
        from: typeof FR.negativeLiteralFrom;
    };
    readonly orPattern: typeof F.orPattern & {
        from: typeof FR.orPatternFrom;
        binary: typeof F.orPatternUFormBinary & {
            from: typeof FR.orPatternUFormBinaryFrom;
        };
        prefix: typeof F.orPatternUFormPrefix & {
            from: typeof FR.orPatternUFormPrefixFrom;
        };
    };
    readonly orderedFieldDeclarationList: typeof F.orderedFieldDeclarationList & {
        from: typeof FR.orderedFieldDeclarationListFrom;
    };
    readonly parameter: typeof F.parameter & {
        from: typeof FR.parameterFrom;
    };
    readonly parameters: typeof F.parameters & {
        from: typeof FR.parametersFrom;
    };
    readonly parenthesized: typeof F.parenthesizedExpression & {
        from: typeof FR.parenthesizedExpressionFrom;
    };
    readonly pointerTypeMut: typeof F.pointerTypeMut & {
        from: typeof FR.pointerTypeMutFrom;
    };
    readonly pointerType: typeof F.pointerType & {
        from: typeof FR.pointerTypeFrom;
        const: typeof F.pointerTypeUFormConst & {
            from: typeof FR.pointerTypeUFormConstFrom;
        };
        mut: typeof F.pointerTypeUFormMut & {
            from: typeof FR.pointerTypeUFormMutFrom;
        };
    };
    readonly qualifiedType: typeof F.qualifiedType & {
        from: typeof FR.qualifiedTypeFrom;
    };
    readonly rangeExpressionBare: typeof F.rangeExpressionBare & {
        from: typeof FR.rangeExpressionBareFrom;
    };
    readonly range: typeof F.rangeExpression & {
        from: typeof FR.rangeExpressionFrom;
        binary: typeof F.rangeExpressionUFormBinary & {
            from: typeof FR.rangeExpressionUFormBinaryFrom;
        };
        postfix: typeof F.rangeExpressionUFormPostfix & {
            from: typeof FR.rangeExpressionUFormPostfixFrom;
        };
        prefix: typeof F.rangeExpressionUFormPrefix & {
            from: typeof FR.rangeExpressionUFormPrefixFrom;
        };
        bare: typeof F.rangeExpressionUFormBare & {
            from: typeof FR.rangeExpressionUFormBareFrom;
        };
    };
    readonly rangePattern: typeof F.rangePattern & {
        from: typeof FR.rangePatternFrom;
        left_with_right: typeof F.rangePatternUFormLeftWithRight & {
            from: typeof FR.rangePatternUFormLeftWithRightFrom;
        };
        left_bare: typeof F.rangePatternUFormLeftBare & {
            from: typeof FR.rangePatternUFormLeftBareFrom;
        };
        prefix: typeof F.rangePatternUFormPrefix & {
            from: typeof FR.rangePatternUFormPrefixFrom;
        };
    };
    readonly rawStringLiteral: typeof F.rawStringLiteral & {
        from: typeof FR.rawStringLiteralFrom;
    };
    readonly refPattern: typeof F.refPattern & {
        from: typeof FR.refPatternFrom;
    };
    readonly reference: typeof F.referenceExpression & {
        from: typeof FR.referenceExpressionFrom;
    };
    readonly referencePattern: typeof F.referencePattern & {
        from: typeof FR.referencePatternFrom;
    };
    readonly referenceType: typeof F.referenceType & {
        from: typeof FR.referenceTypeFrom;
    };
    readonly removedTraitBound: typeof F.removedTraitBound & {
        from: typeof FR.removedTraitBoundFrom;
    };
    readonly returnExpression: typeof F.returnExpression & {
        from: typeof FR.returnExpressionFrom;
    };
    readonly scopedIdentifier: typeof F.scopedIdentifier & {
        from: typeof FR.scopedIdentifierFrom;
    };
    readonly scopedTypeIdentifier: typeof F.scopedTypeIdentifier & {
        from: typeof FR.scopedTypeIdentifierFrom;
    };
    readonly scopedTypeIdentifierInExpressionPosition: typeof F.scopedTypeIdentifierInExpressionPosition & {
        from: typeof FR.scopedTypeIdentifierInExpressionPositionFrom;
    };
    readonly scopedUseList: typeof F.scopedUseList & {
        from: typeof FR.scopedUseListFrom;
    };
    readonly selfParameter: typeof F.selfParameter & {
        from: typeof FR.selfParameterFrom;
    };
    readonly shorthandFieldInitializer: typeof F.shorthandFieldInitializer & {
        from: typeof FR.shorthandFieldInitializerFrom;
    };
    readonly slicePattern: typeof F.slicePattern & {
        from: typeof FR.slicePatternFrom;
    };
    readonly sourceFile: typeof F.sourceFile & {
        from: typeof FR.sourceFileFrom;
    };
    readonly staticItem: typeof F.staticItem & {
        from: typeof FR.staticItemFrom;
    };
    readonly stringLiteral: typeof F.stringLiteral & {
        from: typeof FR.stringLiteralFrom;
    };
    readonly struct: typeof F.structExpression & {
        from: typeof FR.structExpressionFrom;
    };
    readonly structItem: typeof F.structItem & {
        from: typeof FR.structItemFrom;
        brace: typeof F.structItemUFormBrace & {
            from: typeof FR.structItemUFormBraceFrom;
        };
        tuple: typeof F.structItemUFormTuple & {
            from: typeof FR.structItemUFormTupleFrom;
        };
        unit: typeof F.structItemUFormUnit & {
            from: typeof FR.structItemUFormUnitFrom;
        };
    };
    readonly structPattern: typeof F.structPattern & {
        from: typeof FR.structPatternFrom;
    };
    readonly tokenBindingPattern: typeof F.tokenBindingPattern & {
        from: typeof FR.tokenBindingPatternFrom;
    };
    readonly tokenRepetition: typeof F.tokenRepetition & {
        from: typeof FR.tokenRepetitionFrom;
    };
    readonly tokenRepetitionPattern: typeof F.tokenRepetitionPattern & {
        from: typeof FR.tokenRepetitionPatternFrom;
    };
    readonly tokenTreeParen: typeof F.tokenTreeParen & {
        from: typeof FR.tokenTreeParenFrom;
    };
    readonly tokenTreeBracket: typeof F.tokenTreeBracket & {
        from: typeof FR.tokenTreeBracketFrom;
    };
    readonly tokenTreeBrace: typeof F.tokenTreeBrace & {
        from: typeof FR.tokenTreeBraceFrom;
    };
    readonly tokenTree: typeof F.tokenTree & {
        from: typeof FR.tokenTreeFrom;
        paren: typeof F.tokenTreeUFormParen & {
            from: typeof FR.tokenTreeUFormParenFrom;
        };
        bracket: typeof F.tokenTreeUFormBracket & {
            from: typeof FR.tokenTreeUFormBracketFrom;
        };
        brace: typeof F.tokenTreeUFormBrace & {
            from: typeof FR.tokenTreeUFormBraceFrom;
        };
    };
    readonly tokenTreePatternParen: typeof F.tokenTreePatternParen & {
        from: typeof FR.tokenTreePatternParenFrom;
    };
    readonly tokenTreePatternBracket: typeof F.tokenTreePatternBracket & {
        from: typeof FR.tokenTreePatternBracketFrom;
    };
    readonly tokenTreePatternBrace: typeof F.tokenTreePatternBrace & {
        from: typeof FR.tokenTreePatternBraceFrom;
    };
    readonly tokenTreePattern: typeof F.tokenTreePattern & {
        from: typeof FR.tokenTreePatternFrom;
        paren: typeof F.tokenTreePatternUFormParen & {
            from: typeof FR.tokenTreePatternUFormParenFrom;
        };
        bracket: typeof F.tokenTreePatternUFormBracket & {
            from: typeof FR.tokenTreePatternUFormBracketFrom;
        };
        brace: typeof F.tokenTreePatternUFormBrace & {
            from: typeof FR.tokenTreePatternUFormBraceFrom;
        };
    };
    readonly traitBounds: typeof F.traitBounds & {
        from: typeof FR.traitBoundsFrom;
    };
    readonly trait: typeof F.traitItem & {
        from: typeof FR.traitItemFrom;
    };
    readonly tryBlock: typeof F.tryBlock & {
        from: typeof FR.tryBlockFrom;
    };
    readonly tryExpression: typeof F.tryExpression & {
        from: typeof FR.tryExpressionFrom;
    };
    readonly tuple: typeof F.tupleExpression & {
        from: typeof FR.tupleExpressionFrom;
    };
    readonly tuplePattern: typeof F.tuplePattern & {
        from: typeof FR.tuplePatternFrom;
    };
    readonly tupleStructPattern: typeof F.tupleStructPattern & {
        from: typeof FR.tupleStructPatternFrom;
    };
    readonly tupleType: typeof F.tupleType & {
        from: typeof FR.tupleTypeFrom;
    };
    readonly typeArguments: typeof F.typeArguments & {
        from: typeof FR.typeArgumentsFrom;
    };
    readonly typeBinding: typeof F.typeBinding & {
        from: typeof FR.typeBindingFrom;
    };
    readonly typeCast: typeof F.typeCastExpression & {
        from: typeof FR.typeCastExpressionFrom;
    };
    readonly typeItem: typeof F.typeItem & {
        from: typeof FR.typeItemFrom;
    };
    readonly typeParameter: typeof F.typeParameter & {
        from: typeof FR.typeParameterFrom;
    };
    readonly typeParameters: typeof F.typeParameters & {
        from: typeof FR.typeParametersFrom;
    };
    readonly unary: typeof F.unaryExpression & {
        from: typeof FR.unaryExpressionFrom;
    };
    readonly union: typeof F.unionItem & {
        from: typeof FR.unionItemFrom;
    };
    readonly unsafeBlock: typeof F.unsafeBlock & {
        from: typeof FR.unsafeBlockFrom;
    };
    readonly useAsClause: typeof F.useAsClause & {
        from: typeof FR.useAsClauseFrom;
    };
    readonly useBounds: typeof F.useBounds & {
        from: typeof FR.useBoundsFrom;
    };
    readonly use: typeof F.useDeclaration & {
        from: typeof FR.useDeclarationFrom;
    };
    readonly useList: typeof F.useList & {
        from: typeof FR.useListFrom;
    };
    readonly useWildcard: typeof F.useWildcard & {
        from: typeof FR.useWildcardFrom;
    };
    readonly variadicParameter: typeof F.variadicParameter & {
        from: typeof FR.variadicParameterFrom;
    };
    readonly visibilityModifierCrate: typeof F.visibilityModifierCrate & {
        from: typeof FR.visibilityModifierCrateFrom;
    };
    readonly visibilityModifier: typeof F.visibilityModifier & {
        from: typeof FR.visibilityModifierFrom;
        in_path: typeof F.visibilityModifierUFormInPath & {
            from: typeof FR.visibilityModifierUFormInPathFrom;
        };
        crate: typeof F.visibilityModifierUFormCrate & {
            from: typeof FR.visibilityModifierUFormCrateFrom;
        };
        pub: typeof F.visibilityModifierUFormPub & {
            from: typeof FR.visibilityModifierUFormPubFrom;
        };
    };
    readonly whereClause: typeof F.whereClause & {
        from: typeof FR.whereClauseFrom;
    };
    readonly wherePredicate: typeof F.wherePredicate & {
        from: typeof FR.wherePredicateFrom;
    };
    readonly whileExpression: typeof F.whileExpression & {
        from: typeof FR.whileExpressionFrom;
    };
    readonly yieldExpression: typeof F.yieldExpression & {
        from: typeof FR.yieldExpressionFrom;
    };
    readonly crate: typeof F.crate;
    readonly mutableSpecifier: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super: typeof F.super_;
    readonly booleanLiteral: typeof F.booleanLiteral;
    readonly charLiteral: typeof F.charLiteral;
    readonly escapeSequence: typeof F.escapeSequence;
    readonly fragmentSpecifier: typeof F.fragmentSpecifier;
    readonly identifier: typeof F.identifier;
    readonly integerLiteral: typeof F.integerLiteral;
    readonly metavariable: typeof F.metavariable;
    readonly shebang: typeof F.shebang;
    readonly unit: typeof F.unitExpression;
    readonly unitType: typeof F.unitType;
    readonly stringContent: typeof F.stringContent;
    readonly rawStringLiteralContent: typeof F.rawStringLiteralContent;
    readonly floatLiteral: typeof F.floatLiteral;
    readonly condition: {
        readonly unary: typeof F.unaryExpression & {
            from: typeof FR.unaryExpressionFrom;
        };
        readonly reference: typeof F.referenceExpression & {
            from: typeof FR.referenceExpressionFrom;
        };
        readonly try_: typeof F.tryExpression & {
            from: typeof FR.tryExpressionFrom;
        };
        readonly binary: typeof F.binaryExpression & {
            from: typeof FR.binaryExpressionFrom;
        };
        readonly assignment: typeof F.assignmentExpression & {
            from: typeof FR.assignmentExpressionFrom;
        };
        readonly compoundAssignment: typeof F.compoundAssignmentExpr & {
            from: typeof FR.compoundAssignmentExprFrom;
        };
        readonly typeCast: typeof F.typeCastExpression & {
            from: typeof FR.typeCastExpressionFrom;
        };
        readonly call: typeof F.callExpression & {
            from: typeof FR.callExpressionFrom;
        };
        readonly return_: typeof F.returnExpression & {
            from: typeof FR.returnExpressionFrom;
        };
        readonly yield_: typeof F.yieldExpression & {
            from: typeof FR.yieldExpressionFrom;
        };
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly self: typeof F.self;
        readonly scoped: typeof F.scopedIdentifier & {
            from: typeof FR.scopedIdentifierFrom;
        };
        readonly generic: typeof F.genericFunction & {
            from: typeof FR.genericFunctionFrom;
        };
        readonly await: typeof F.awaitExpression & {
            from: typeof FR.awaitExpressionFrom;
        };
        readonly field: typeof F.fieldExpression & {
            from: typeof FR.fieldExpressionFrom;
        };
        readonly array: typeof F.arrayExpression & {
            from: typeof FR.arrayExpressionFrom;
            semi: typeof F.arrayExpressionUFormSemi & {
                from: typeof FR.arrayExpressionUFormSemiFrom;
            };
            list: typeof F.arrayExpressionUFormList & {
                from: typeof FR.arrayExpressionUFormListFrom;
            };
        };
        readonly tuple: typeof F.tupleExpression & {
            from: typeof FR.tupleExpressionFrom;
        };
        readonly macro: typeof F.macroInvocation & {
            from: typeof FR.macroInvocationFrom;
        };
        readonly unit: typeof F.unitExpression;
        readonly break_: typeof F.breakExpression & {
            from: typeof FR.breakExpressionFrom;
        };
        readonly continue_: typeof F.continueExpression & {
            from: typeof FR.continueExpressionFrom;
        };
        readonly index: typeof F.indexExpression & {
            from: typeof FR.indexExpressionFrom;
        };
        readonly metavariable: typeof F.metavariable;
        readonly closure: typeof F.closureExpression & {
            from: typeof FR.closureExpressionFrom;
            block: typeof F.closureExpressionUFormBlock & {
                from: typeof FR.closureExpressionUFormBlockFrom;
            };
            expr: typeof F.closureExpressionUFormExpr & {
                from: typeof FR.closureExpressionUFormExprFrom;
            };
        };
        readonly parenthesized: typeof F.parenthesizedExpression & {
            from: typeof FR.parenthesizedExpressionFrom;
        };
        readonly struct: typeof F.structExpression & {
            from: typeof FR.structExpressionFrom;
        };
        readonly unsafe: typeof F.unsafeBlock & {
            from: typeof FR.unsafeBlockFrom;
        };
        readonly async: typeof F.asyncBlock & {
            from: typeof FR.asyncBlockFrom;
        };
        readonly gen: typeof F.genBlock & {
            from: typeof FR.genBlockFrom;
        };
        readonly block: typeof F.block & {
            from: typeof FR.blockFrom;
        };
        readonly if_: typeof F.ifExpression & {
            from: typeof FR.ifExpressionFrom;
        };
        readonly match: typeof F.matchExpression & {
            from: typeof FR.matchExpressionFrom;
        };
        readonly while_: typeof F.whileExpression & {
            from: typeof FR.whileExpressionFrom;
        };
        readonly loop: typeof F.loopExpression & {
            from: typeof FR.loopExpressionFrom;
        };
        readonly for_: typeof F.forExpression & {
            from: typeof FR.forExpressionFrom;
        };
        readonly const_: typeof F.constBlock & {
            from: typeof FR.constBlockFrom;
        };
        readonly range: typeof F.rangeExpression & {
            from: typeof FR.rangeExpressionFrom;
            binary: typeof F.rangeExpressionUFormBinary & {
                from: typeof FR.rangeExpressionUFormBinaryFrom;
            };
            postfix: typeof F.rangeExpressionUFormPostfix & {
                from: typeof FR.rangeExpressionUFormPostfixFrom;
            };
            prefix: typeof F.rangeExpressionUFormPrefix & {
                from: typeof FR.rangeExpressionUFormPrefixFrom;
            };
            bare: typeof F.rangeExpressionUFormBare & {
                from: typeof FR.rangeExpressionUFormBareFrom;
            };
        };
        readonly let_: typeof F.letCondition & {
            from: typeof FR.letConditionFrom;
        };
    };
    readonly declarationStatement: {
        readonly const_: typeof F.constItem & {
            from: typeof FR.constItemFrom;
        };
        readonly macro: typeof F.macroInvocation & {
            from: typeof FR.macroInvocationFrom;
        };
        readonly attribute: typeof F.attributeItem & {
            from: typeof FR.attributeItemFrom;
        };
        readonly innerAttribute: typeof F.innerAttributeItem & {
            from: typeof FR.innerAttributeItemFrom;
        };
        readonly mod: typeof F.modItem & {
            from: typeof FR.modItemFrom;
            external: typeof F.modItemUFormExternal & {
                from: typeof FR.modItemUFormExternalFrom;
            };
            inline: typeof F.modItemUFormInline & {
                from: typeof FR.modItemUFormInlineFrom;
            };
        };
        readonly foreignMod: typeof F.foreignModItem & {
            from: typeof FR.foreignModItemFrom;
            semi: typeof F.foreignModItemUFormSemi & {
                from: typeof FR.foreignModItemUFormSemiFrom;
            };
            body: typeof F.foreignModItemUFormBody & {
                from: typeof FR.foreignModItemUFormBodyFrom;
            };
        };
        readonly struct: typeof F.structItem & {
            from: typeof FR.structItemFrom;
            brace: typeof F.structItemUFormBrace & {
                from: typeof FR.structItemUFormBraceFrom;
            };
            tuple: typeof F.structItemUFormTuple & {
                from: typeof FR.structItemUFormTupleFrom;
            };
            unit: typeof F.structItemUFormUnit & {
                from: typeof FR.structItemUFormUnitFrom;
            };
        };
        readonly union: typeof F.unionItem & {
            from: typeof FR.unionItemFrom;
        };
        readonly enum_: typeof F.enumItem & {
            from: typeof FR.enumItemFrom;
        };
        readonly type: typeof F.typeItem & {
            from: typeof FR.typeItemFrom;
        };
        readonly function_: typeof F.functionItem & {
            from: typeof FR.functionItemFrom;
        };
        readonly functionSignature: typeof F.functionSignatureItem & {
            from: typeof FR.functionSignatureItemFrom;
        };
        readonly impl: typeof F.implItem & {
            from: typeof FR.implItemFrom;
            body: typeof F.implItemUFormBody & {
                from: typeof FR.implItemUFormBodyFrom;
            };
            semi: typeof F.implItemUFormSemi & {
                from: typeof FR.implItemUFormSemiFrom;
            };
        };
        readonly trait: typeof F.traitItem & {
            from: typeof FR.traitItemFrom;
        };
        readonly associated: typeof F.associatedType & {
            from: typeof FR.associatedTypeFrom;
        };
        readonly let_: typeof F.letDeclaration & {
            from: typeof FR.letDeclarationFrom;
        };
        readonly use: typeof F.useDeclaration & {
            from: typeof FR.useDeclarationFrom;
        };
        readonly externCrate: typeof F.externCrateDeclaration & {
            from: typeof FR.externCrateDeclarationFrom;
        };
        readonly static_: typeof F.staticItem & {
            from: typeof FR.staticItemFrom;
        };
    };
    readonly delimTokens: {
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly mutable: typeof F.mutableSpecifier;
        readonly self: typeof F.self;
        readonly super_: typeof F.super_;
        readonly crate: typeof F.crate;
        readonly delimToken: typeof F.delimTokenTree & {
            from: typeof FR.delimTokenTreeFrom;
            paren: typeof F.delimTokenTreeUFormParen & {
                from: typeof FR.delimTokenTreeUFormParenFrom;
            };
            bracket: typeof F.delimTokenTreeUFormBracket & {
                from: typeof FR.delimTokenTreeUFormBracketFrom;
            };
            brace: typeof F.delimTokenTreeUFormBrace & {
                from: typeof FR.delimTokenTreeUFormBraceFrom;
            };
        };
    };
    readonly expression: {
        readonly unary: typeof F.unaryExpression & {
            from: typeof FR.unaryExpressionFrom;
        };
        readonly reference: typeof F.referenceExpression & {
            from: typeof FR.referenceExpressionFrom;
        };
        readonly try_: typeof F.tryExpression & {
            from: typeof FR.tryExpressionFrom;
        };
        readonly binary: typeof F.binaryExpression & {
            from: typeof FR.binaryExpressionFrom;
        };
        readonly assignment: typeof F.assignmentExpression & {
            from: typeof FR.assignmentExpressionFrom;
        };
        readonly compoundAssignment: typeof F.compoundAssignmentExpr & {
            from: typeof FR.compoundAssignmentExprFrom;
        };
        readonly typeCast: typeof F.typeCastExpression & {
            from: typeof FR.typeCastExpressionFrom;
        };
        readonly call: typeof F.callExpression & {
            from: typeof FR.callExpressionFrom;
        };
        readonly return_: typeof F.returnExpression & {
            from: typeof FR.returnExpressionFrom;
        };
        readonly yield_: typeof F.yieldExpression & {
            from: typeof FR.yieldExpressionFrom;
        };
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly self: typeof F.self;
        readonly scoped: typeof F.scopedIdentifier & {
            from: typeof FR.scopedIdentifierFrom;
        };
        readonly generic: typeof F.genericFunction & {
            from: typeof FR.genericFunctionFrom;
        };
        readonly await: typeof F.awaitExpression & {
            from: typeof FR.awaitExpressionFrom;
        };
        readonly field: typeof F.fieldExpression & {
            from: typeof FR.fieldExpressionFrom;
        };
        readonly array: typeof F.arrayExpression & {
            from: typeof FR.arrayExpressionFrom;
            semi: typeof F.arrayExpressionUFormSemi & {
                from: typeof FR.arrayExpressionUFormSemiFrom;
            };
            list: typeof F.arrayExpressionUFormList & {
                from: typeof FR.arrayExpressionUFormListFrom;
            };
        };
        readonly tuple: typeof F.tupleExpression & {
            from: typeof FR.tupleExpressionFrom;
        };
        readonly macro: typeof F.macroInvocation & {
            from: typeof FR.macroInvocationFrom;
        };
        readonly unit: typeof F.unitExpression;
        readonly break_: typeof F.breakExpression & {
            from: typeof FR.breakExpressionFrom;
        };
        readonly continue_: typeof F.continueExpression & {
            from: typeof FR.continueExpressionFrom;
        };
        readonly index: typeof F.indexExpression & {
            from: typeof FR.indexExpressionFrom;
        };
        readonly metavariable: typeof F.metavariable;
        readonly closure: typeof F.closureExpression & {
            from: typeof FR.closureExpressionFrom;
            block: typeof F.closureExpressionUFormBlock & {
                from: typeof FR.closureExpressionUFormBlockFrom;
            };
            expr: typeof F.closureExpressionUFormExpr & {
                from: typeof FR.closureExpressionUFormExprFrom;
            };
        };
        readonly parenthesized: typeof F.parenthesizedExpression & {
            from: typeof FR.parenthesizedExpressionFrom;
        };
        readonly struct: typeof F.structExpression & {
            from: typeof FR.structExpressionFrom;
        };
        readonly unsafe: typeof F.unsafeBlock & {
            from: typeof FR.unsafeBlockFrom;
        };
        readonly async: typeof F.asyncBlock & {
            from: typeof FR.asyncBlockFrom;
        };
        readonly gen: typeof F.genBlock & {
            from: typeof FR.genBlockFrom;
        };
        readonly block: typeof F.block & {
            from: typeof FR.blockFrom;
        };
        readonly if_: typeof F.ifExpression & {
            from: typeof FR.ifExpressionFrom;
        };
        readonly match: typeof F.matchExpression & {
            from: typeof FR.matchExpressionFrom;
        };
        readonly while_: typeof F.whileExpression & {
            from: typeof FR.whileExpressionFrom;
        };
        readonly loop: typeof F.loopExpression & {
            from: typeof FR.loopExpressionFrom;
        };
        readonly for_: typeof F.forExpression & {
            from: typeof FR.forExpressionFrom;
        };
        readonly const_: typeof F.constBlock & {
            from: typeof FR.constBlockFrom;
        };
        readonly range: typeof F.rangeExpression & {
            from: typeof FR.rangeExpressionFrom;
            binary: typeof F.rangeExpressionUFormBinary & {
                from: typeof FR.rangeExpressionUFormBinaryFrom;
            };
            postfix: typeof F.rangeExpressionUFormPostfix & {
                from: typeof FR.rangeExpressionUFormPostfixFrom;
            };
            prefix: typeof F.rangeExpressionUFormPrefix & {
                from: typeof FR.rangeExpressionUFormPrefixFrom;
            };
            bare: typeof F.rangeExpressionUFormBare & {
                from: typeof FR.rangeExpressionUFormBareFrom;
            };
        };
    };
    readonly expressionEndingWithBlock: {
        readonly unsafe: typeof F.unsafeBlock & {
            from: typeof FR.unsafeBlockFrom;
        };
        readonly async: typeof F.asyncBlock & {
            from: typeof FR.asyncBlockFrom;
        };
        readonly gen: typeof F.genBlock & {
            from: typeof FR.genBlockFrom;
        };
        readonly try_: typeof F.tryBlock & {
            from: typeof FR.tryBlockFrom;
        };
        readonly block: typeof F.block & {
            from: typeof FR.blockFrom;
        };
        readonly if_: typeof F.ifExpression & {
            from: typeof FR.ifExpressionFrom;
        };
        readonly match: typeof F.matchExpression & {
            from: typeof FR.matchExpressionFrom;
        };
        readonly while_: typeof F.whileExpression & {
            from: typeof FR.whileExpressionFrom;
        };
        readonly loop: typeof F.loopExpression & {
            from: typeof FR.loopExpressionFrom;
        };
        readonly for_: typeof F.forExpression & {
            from: typeof FR.forExpressionFrom;
        };
        readonly const_: typeof F.constBlock & {
            from: typeof FR.constBlockFrom;
        };
    };
    readonly expressionExceptRange: {
        readonly unary: typeof F.unaryExpression & {
            from: typeof FR.unaryExpressionFrom;
        };
        readonly reference: typeof F.referenceExpression & {
            from: typeof FR.referenceExpressionFrom;
        };
        readonly try_: typeof F.tryExpression & {
            from: typeof FR.tryExpressionFrom;
        };
        readonly binary: typeof F.binaryExpression & {
            from: typeof FR.binaryExpressionFrom;
        };
        readonly assignment: typeof F.assignmentExpression & {
            from: typeof FR.assignmentExpressionFrom;
        };
        readonly compoundAssignment: typeof F.compoundAssignmentExpr & {
            from: typeof FR.compoundAssignmentExprFrom;
        };
        readonly typeCast: typeof F.typeCastExpression & {
            from: typeof FR.typeCastExpressionFrom;
        };
        readonly call: typeof F.callExpression & {
            from: typeof FR.callExpressionFrom;
        };
        readonly return_: typeof F.returnExpression & {
            from: typeof FR.returnExpressionFrom;
        };
        readonly yield_: typeof F.yieldExpression & {
            from: typeof FR.yieldExpressionFrom;
        };
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly self: typeof F.self;
        readonly scoped: typeof F.scopedIdentifier & {
            from: typeof FR.scopedIdentifierFrom;
        };
        readonly generic: typeof F.genericFunction & {
            from: typeof FR.genericFunctionFrom;
        };
        readonly await: typeof F.awaitExpression & {
            from: typeof FR.awaitExpressionFrom;
        };
        readonly field: typeof F.fieldExpression & {
            from: typeof FR.fieldExpressionFrom;
        };
        readonly array: typeof F.arrayExpression & {
            from: typeof FR.arrayExpressionFrom;
            semi: typeof F.arrayExpressionUFormSemi & {
                from: typeof FR.arrayExpressionUFormSemiFrom;
            };
            list: typeof F.arrayExpressionUFormList & {
                from: typeof FR.arrayExpressionUFormListFrom;
            };
        };
        readonly tuple: typeof F.tupleExpression & {
            from: typeof FR.tupleExpressionFrom;
        };
        readonly macro: typeof F.macroInvocation & {
            from: typeof FR.macroInvocationFrom;
        };
        readonly unit: typeof F.unitExpression;
        readonly break_: typeof F.breakExpression & {
            from: typeof FR.breakExpressionFrom;
        };
        readonly continue_: typeof F.continueExpression & {
            from: typeof FR.continueExpressionFrom;
        };
        readonly index: typeof F.indexExpression & {
            from: typeof FR.indexExpressionFrom;
        };
        readonly metavariable: typeof F.metavariable;
        readonly closure: typeof F.closureExpression & {
            from: typeof FR.closureExpressionFrom;
            block: typeof F.closureExpressionUFormBlock & {
                from: typeof FR.closureExpressionUFormBlockFrom;
            };
            expr: typeof F.closureExpressionUFormExpr & {
                from: typeof FR.closureExpressionUFormExprFrom;
            };
        };
        readonly parenthesized: typeof F.parenthesizedExpression & {
            from: typeof FR.parenthesizedExpressionFrom;
        };
        readonly struct: typeof F.structExpression & {
            from: typeof FR.structExpressionFrom;
        };
        readonly unsafe: typeof F.unsafeBlock & {
            from: typeof FR.unsafeBlockFrom;
        };
        readonly async: typeof F.asyncBlock & {
            from: typeof FR.asyncBlockFrom;
        };
        readonly gen: typeof F.genBlock & {
            from: typeof FR.genBlockFrom;
        };
        readonly block: typeof F.block & {
            from: typeof FR.blockFrom;
        };
        readonly if_: typeof F.ifExpression & {
            from: typeof FR.ifExpressionFrom;
        };
        readonly match: typeof F.matchExpression & {
            from: typeof FR.matchExpressionFrom;
        };
        readonly while_: typeof F.whileExpression & {
            from: typeof FR.whileExpressionFrom;
        };
        readonly loop: typeof F.loopExpression & {
            from: typeof FR.loopExpressionFrom;
        };
        readonly for_: typeof F.forExpression & {
            from: typeof FR.forExpressionFrom;
        };
        readonly const_: typeof F.constBlock & {
            from: typeof FR.constBlockFrom;
        };
    };
    readonly literal: {
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
    };
    readonly literalPattern: {
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly negative: typeof F.negativeLiteral & {
            from: typeof FR.negativeLiteralFrom;
        };
    };
    readonly nonDelimToken: {
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly mutable: typeof F.mutableSpecifier;
        readonly self: typeof F.self;
        readonly super_: typeof F.super_;
        readonly crate: typeof F.crate;
    };
    readonly path: {
        readonly self: typeof F.self;
        readonly identifier: typeof F.identifier;
        readonly metavariable: typeof F.metavariable;
        readonly super_: typeof F.super_;
        readonly crate: typeof F.crate;
        readonly scoped: typeof F.scopedIdentifier & {
            from: typeof FR.scopedIdentifierFrom;
        };
    };
    readonly pattern: {
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly negative: typeof F.negativeLiteral & {
            from: typeof FR.negativeLiteralFrom;
        };
        readonly identifier: typeof F.identifier;
        readonly scoped: typeof F.scopedIdentifier & {
            from: typeof FR.scopedIdentifierFrom;
        };
        readonly generic: typeof F.genericPattern & {
            from: typeof FR.genericPatternFrom;
        };
        readonly tuple: typeof F.tuplePattern & {
            from: typeof FR.tuplePatternFrom;
        };
        readonly tupleStruct: typeof F.tupleStructPattern & {
            from: typeof FR.tupleStructPatternFrom;
        };
        readonly struct: typeof F.structPattern & {
            from: typeof FR.structPatternFrom;
        };
        readonly ref: typeof F.refPattern & {
            from: typeof FR.refPatternFrom;
        };
        readonly slice: typeof F.slicePattern & {
            from: typeof FR.slicePatternFrom;
        };
        readonly captured: typeof F.capturedPattern & {
            from: typeof FR.capturedPatternFrom;
        };
        readonly reference: typeof F.referencePattern & {
            from: typeof FR.referencePatternFrom;
        };
        readonly mut: typeof F.mutPattern & {
            from: typeof FR.mutPatternFrom;
        };
        readonly range: typeof F.rangePattern & {
            from: typeof FR.rangePatternFrom;
            left_with_right: typeof F.rangePatternUFormLeftWithRight & {
                from: typeof FR.rangePatternUFormLeftWithRightFrom;
            };
            left_bare: typeof F.rangePatternUFormLeftBare & {
                from: typeof FR.rangePatternUFormLeftBareFrom;
            };
            prefix: typeof F.rangePatternUFormPrefix & {
                from: typeof FR.rangePatternUFormPrefixFrom;
            };
        };
        readonly or: typeof F.orPattern & {
            from: typeof FR.orPatternFrom;
            binary: typeof F.orPatternUFormBinary & {
                from: typeof FR.orPatternUFormBinaryFrom;
            };
            prefix: typeof F.orPatternUFormPrefix & {
                from: typeof FR.orPatternUFormPrefixFrom;
            };
        };
        readonly const_: typeof F.constBlock & {
            from: typeof FR.constBlockFrom;
        };
        readonly macro: typeof F.macroInvocation & {
            from: typeof FR.macroInvocationFrom;
        };
    };
    readonly statement: {
        readonly expression: typeof F.expressionStatement & {
            from: typeof FR.expressionStatementFrom;
            with_semi: typeof F.expressionStatementUFormWithSemi & {
                from: typeof FR.expressionStatementUFormWithSemiFrom;
            };
            block_ending: typeof F.expressionStatementUFormBlockEnding & {
                from: typeof FR.expressionStatementUFormBlockEndingFrom;
            };
        };
        readonly const_: typeof F.constItem & {
            from: typeof FR.constItemFrom;
        };
        readonly macro: typeof F.macroInvocation & {
            from: typeof FR.macroInvocationFrom;
        };
        readonly attribute: typeof F.attributeItem & {
            from: typeof FR.attributeItemFrom;
        };
        readonly innerAttribute: typeof F.innerAttributeItem & {
            from: typeof FR.innerAttributeItemFrom;
        };
        readonly mod: typeof F.modItem & {
            from: typeof FR.modItemFrom;
            external: typeof F.modItemUFormExternal & {
                from: typeof FR.modItemUFormExternalFrom;
            };
            inline: typeof F.modItemUFormInline & {
                from: typeof FR.modItemUFormInlineFrom;
            };
        };
        readonly foreignMod: typeof F.foreignModItem & {
            from: typeof FR.foreignModItemFrom;
            semi: typeof F.foreignModItemUFormSemi & {
                from: typeof FR.foreignModItemUFormSemiFrom;
            };
            body: typeof F.foreignModItemUFormBody & {
                from: typeof FR.foreignModItemUFormBodyFrom;
            };
        };
        readonly struct: typeof F.structItem & {
            from: typeof FR.structItemFrom;
            brace: typeof F.structItemUFormBrace & {
                from: typeof FR.structItemUFormBraceFrom;
            };
            tuple: typeof F.structItemUFormTuple & {
                from: typeof FR.structItemUFormTupleFrom;
            };
            unit: typeof F.structItemUFormUnit & {
                from: typeof FR.structItemUFormUnitFrom;
            };
        };
        readonly union: typeof F.unionItem & {
            from: typeof FR.unionItemFrom;
        };
        readonly enum_: typeof F.enumItem & {
            from: typeof FR.enumItemFrom;
        };
        readonly type: typeof F.typeItem & {
            from: typeof FR.typeItemFrom;
        };
        readonly function_: typeof F.functionItem & {
            from: typeof FR.functionItemFrom;
        };
        readonly functionSignature: typeof F.functionSignatureItem & {
            from: typeof FR.functionSignatureItemFrom;
        };
        readonly impl: typeof F.implItem & {
            from: typeof FR.implItemFrom;
            body: typeof F.implItemUFormBody & {
                from: typeof FR.implItemUFormBodyFrom;
            };
            semi: typeof F.implItemUFormSemi & {
                from: typeof FR.implItemUFormSemiFrom;
            };
        };
        readonly trait: typeof F.traitItem & {
            from: typeof FR.traitItemFrom;
        };
        readonly associated: typeof F.associatedType & {
            from: typeof FR.associatedTypeFrom;
        };
        readonly let_: typeof F.letDeclaration & {
            from: typeof FR.letDeclarationFrom;
        };
        readonly use: typeof F.useDeclaration & {
            from: typeof FR.useDeclarationFrom;
        };
        readonly externCrate: typeof F.externCrateDeclaration & {
            from: typeof FR.externCrateDeclarationFrom;
        };
        readonly static_: typeof F.staticItem & {
            from: typeof FR.staticItemFrom;
        };
    };
    readonly tokenPattern: {
        readonly tokenTree: typeof F.tokenTreePattern & {
            from: typeof FR.tokenTreePatternFrom;
            paren: typeof F.tokenTreePatternUFormParen & {
                from: typeof FR.tokenTreePatternUFormParenFrom;
            };
            bracket: typeof F.tokenTreePatternUFormBracket & {
                from: typeof FR.tokenTreePatternUFormBracketFrom;
            };
            brace: typeof F.tokenTreePatternUFormBrace & {
                from: typeof FR.tokenTreePatternUFormBraceFrom;
            };
        };
        readonly tokenRepetition: typeof F.tokenRepetitionPattern & {
            from: typeof FR.tokenRepetitionPatternFrom;
        };
        readonly tokenBinding: typeof F.tokenBindingPattern & {
            from: typeof FR.tokenBindingPatternFrom;
        };
        readonly metavariable: typeof F.metavariable;
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly mutable: typeof F.mutableSpecifier;
        readonly self: typeof F.self;
        readonly super_: typeof F.super_;
        readonly crate: typeof F.crate;
    };
    readonly tokens: {
        readonly token: typeof F.tokenTree & {
            from: typeof FR.tokenTreeFrom;
            paren: typeof F.tokenTreeUFormParen & {
                from: typeof FR.tokenTreeUFormParenFrom;
            };
            bracket: typeof F.tokenTreeUFormBracket & {
                from: typeof FR.tokenTreeUFormBracketFrom;
            };
            brace: typeof F.tokenTreeUFormBrace & {
                from: typeof FR.tokenTreeUFormBraceFrom;
            };
        };
        readonly metavariable: typeof F.metavariable;
        readonly string: typeof F.stringLiteral & {
            from: typeof FR.stringLiteralFrom;
        };
        readonly rawString: typeof F.rawStringLiteral & {
            from: typeof FR.rawStringLiteralFrom;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly mutable: typeof F.mutableSpecifier;
        readonly self: typeof F.self;
        readonly super_: typeof F.super_;
        readonly crate: typeof F.crate;
    };
    readonly type: {
        readonly abstract: typeof F.abstractType & {
            from: typeof FR.abstractTypeFrom;
        };
        readonly reference: typeof F.referenceType & {
            from: typeof FR.referenceTypeFrom;
        };
        readonly metavariable: typeof F.metavariable;
        readonly pointer: typeof F.pointerType & {
            from: typeof FR.pointerTypeFrom;
            const: typeof F.pointerTypeUFormConst & {
                from: typeof FR.pointerTypeUFormConstFrom;
            };
            mut: typeof F.pointerTypeUFormMut & {
                from: typeof FR.pointerTypeUFormMutFrom;
            };
        };
        readonly generic: typeof F.genericType & {
            from: typeof FR.genericTypeFrom;
        };
        readonly scopedType: typeof F.scopedTypeIdentifier & {
            from: typeof FR.scopedTypeIdentifierFrom;
        };
        readonly tuple: typeof F.tupleType & {
            from: typeof FR.tupleTypeFrom;
        };
        readonly unit: typeof F.unitType;
        readonly array: typeof F.arrayType & {
            from: typeof FR.arrayTypeFrom;
        };
        readonly function_: typeof F.functionType & {
            from: typeof FR.functionTypeFrom;
        };
        readonly identifier: typeof F.identifier;
        readonly macro: typeof F.macroInvocation & {
            from: typeof FR.macroInvocationFrom;
        };
        readonly dynamic: typeof F.dynamicType & {
            from: typeof FR.dynamicTypeFrom;
        };
        readonly bounded: typeof F.boundedType & {
            from: typeof FR.boundedTypeFrom;
        };
        readonly removedTrait: typeof F.removedTraitBound & {
            from: typeof FR.removedTraitBoundFrom;
        };
    };
    readonly useClause: {
        readonly self: typeof F.self;
        readonly identifier: typeof F.identifier;
        readonly metavariable: typeof F.metavariable;
        readonly super_: typeof F.super_;
        readonly crate: typeof F.crate;
        readonly scoped: typeof F.scopedIdentifier & {
            from: typeof FR.scopedIdentifierFrom;
        };
        readonly useAs: typeof F.useAsClause & {
            from: typeof FR.useAsClauseFrom;
        };
        readonly use: typeof F.useList & {
            from: typeof FR.useListFrom;
        };
        readonly scopedUse: typeof F.scopedUseList & {
            from: typeof FR.scopedUseListFrom;
        };
    };
};
export declare namespace from {
    function boolean(value: boolean): ReturnType<typeof F.booleanLiteral>;
    function number(value: number): ReturnType<typeof F.integerLiteral> | ReturnType<typeof F.floatLiteral>;
    function string(value: string): ReturnType<typeof F.stringLiteral>;
    function type(name: string): ReturnType<typeof F.typeIdentifier>;
    function identifier(name: string): ReturnType<typeof F.identifier>;
}
//# sourceMappingURL=ir.d.ts.map