import * as F from './factories.js';
import * as FR from './from.js';
export declare const condition: {
    readonly unary: typeof FR.unaryExpressionFrom & {
        from: typeof FR.unaryExpressionFrom;
        strict: typeof F.unaryExpression;
    };
    readonly reference: typeof FR.referenceExpressionFrom & {
        from: typeof FR.referenceExpressionFrom;
        strict: typeof F.referenceExpression;
    };
    readonly try: typeof FR.tryExpressionFrom & {
        from: typeof FR.tryExpressionFrom;
        strict: typeof F.tryExpression;
    };
    readonly binary: typeof FR.binaryExpressionFrom & {
        from: typeof FR.binaryExpressionFrom;
        strict: typeof F.binaryExpression;
    };
    readonly assignment: typeof FR.assignmentExpressionFrom & {
        from: typeof FR.assignmentExpressionFrom;
        strict: typeof F.assignmentExpression;
    };
    readonly compoundAssignment: typeof FR.compoundAssignmentExprFrom & {
        from: typeof FR.compoundAssignmentExprFrom;
        strict: typeof F.compoundAssignmentExpr;
    };
    readonly typeCast: typeof FR.typeCastExpressionFrom & {
        from: typeof FR.typeCastExpressionFrom;
        strict: typeof F.typeCastExpression;
    };
    readonly call: typeof FR.callExpressionFrom & {
        from: typeof FR.callExpressionFrom;
        strict: typeof F.callExpression;
    };
    readonly return: typeof FR.returnExpressionFrom & {
        from: typeof FR.returnExpressionFrom;
        strict: typeof F.returnExpression;
    };
    readonly yield: typeof FR.yieldExpressionFrom & {
        from: typeof FR.yieldExpressionFrom;
        strict: typeof F.yieldExpression;
    };
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly self: typeof F.self;
    readonly scoped: typeof FR.scopedIdentifierFrom & {
        from: typeof FR.scopedIdentifierFrom;
        strict: typeof F.scopedIdentifier;
    };
    readonly generic: typeof FR.genericFunctionFrom & {
        from: typeof FR.genericFunctionFrom;
        strict: typeof F.genericFunction;
    };
    readonly await: typeof FR.awaitExpressionFrom & {
        from: typeof FR.awaitExpressionFrom;
        strict: typeof F.awaitExpression;
    };
    readonly field: typeof FR.fieldExpressionFrom & {
        from: typeof FR.fieldExpressionFrom;
        strict: typeof F.fieldExpression;
    };
    readonly array: typeof FR.arrayExpressionFrom & {
        from: typeof FR.arrayExpressionFrom;
        strict: typeof F.arrayExpression;
        semi: typeof FR.arrayExpressionUFormSemiFrom & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
            strict: typeof F.arrayExpressionUFormSemi;
        };
        list: typeof FR.arrayExpressionUFormListFrom & {
            from: typeof FR.arrayExpressionUFormListFrom;
            strict: typeof F.arrayExpressionUFormList;
        };
    };
    readonly tuple: typeof FR.tupleExpressionFrom & {
        from: typeof FR.tupleExpressionFrom;
        strict: typeof F.tupleExpression;
    };
    readonly macro: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
    readonly unit: typeof F.unitExpression;
    readonly break: typeof FR.breakExpressionFrom & {
        from: typeof FR.breakExpressionFrom;
        strict: typeof F.breakExpression;
    };
    readonly continue: typeof FR.continueExpressionFrom & {
        from: typeof FR.continueExpressionFrom;
        strict: typeof F.continueExpression;
    };
    readonly index: typeof FR.indexExpressionFrom & {
        from: typeof FR.indexExpressionFrom;
        strict: typeof F.indexExpression;
    };
    readonly metavariable: typeof F.metavariable;
    readonly closure: typeof FR.closureExpressionFrom & {
        from: typeof FR.closureExpressionFrom;
        strict: typeof F.closureExpression;
        block: typeof FR.closureExpressionUFormBlockFrom & {
            from: typeof FR.closureExpressionUFormBlockFrom;
            strict: typeof F.closureExpressionUFormBlock;
        };
        expr: typeof FR.closureExpressionUFormExprFrom & {
            from: typeof FR.closureExpressionUFormExprFrom;
            strict: typeof F.closureExpressionUFormExpr;
        };
    };
    readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
    };
    readonly struct: typeof FR.structExpressionFrom & {
        from: typeof FR.structExpressionFrom;
        strict: typeof F.structExpression;
    };
    readonly unsafe: typeof FR.unsafeBlockFrom & {
        from: typeof FR.unsafeBlockFrom;
        strict: typeof F.unsafeBlock;
    };
    readonly async: typeof FR.asyncBlockFrom & {
        from: typeof FR.asyncBlockFrom;
        strict: typeof F.asyncBlock;
    };
    readonly gen: typeof FR.genBlockFrom & {
        from: typeof FR.genBlockFrom;
        strict: typeof F.genBlock;
    };
    readonly block: typeof FR.blockFrom & {
        from: typeof FR.blockFrom;
        strict: typeof F.block;
    };
    readonly if: typeof FR.ifExpressionFrom & {
        from: typeof FR.ifExpressionFrom;
        strict: typeof F.ifExpression;
    };
    readonly match: typeof FR.matchExpressionFrom & {
        from: typeof FR.matchExpressionFrom;
        strict: typeof F.matchExpression;
    };
    readonly while: typeof FR.whileExpressionFrom & {
        from: typeof FR.whileExpressionFrom;
        strict: typeof F.whileExpression;
    };
    readonly loop: typeof FR.loopExpressionFrom & {
        from: typeof FR.loopExpressionFrom;
        strict: typeof F.loopExpression;
    };
    readonly for: typeof FR.forExpressionFrom & {
        from: typeof FR.forExpressionFrom;
        strict: typeof F.forExpression;
    };
    readonly const: typeof FR.constBlockFrom & {
        from: typeof FR.constBlockFrom;
        strict: typeof F.constBlock;
    };
    readonly range: typeof FR.rangeExpressionFrom & {
        from: typeof FR.rangeExpressionFrom;
        strict: typeof F.rangeExpression;
        binary: typeof FR.rangeExpressionUFormBinaryFrom & {
            from: typeof FR.rangeExpressionUFormBinaryFrom;
            strict: typeof F.rangeExpressionUFormBinary;
        };
        postfix: typeof FR.rangeExpressionUFormPostfixFrom & {
            from: typeof FR.rangeExpressionUFormPostfixFrom;
            strict: typeof F.rangeExpressionUFormPostfix;
        };
        prefix: typeof FR.rangeExpressionUFormPrefixFrom & {
            from: typeof FR.rangeExpressionUFormPrefixFrom;
            strict: typeof F.rangeExpressionUFormPrefix;
        };
        bare: typeof FR.rangeExpressionUFormBareFrom & {
            from: typeof FR.rangeExpressionUFormBareFrom;
            strict: typeof F.rangeExpressionUFormBare;
        };
    };
    readonly let: typeof FR.letConditionFrom & {
        from: typeof FR.letConditionFrom;
        strict: typeof F.letCondition;
    };
};
export declare const declarationStatement: {
    readonly const: typeof FR.constItemFrom & {
        from: typeof FR.constItemFrom;
        strict: typeof F.constItem;
    };
    readonly macro: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
    readonly attribute: typeof FR.attributeItemFrom & {
        from: typeof FR.attributeItemFrom;
        strict: typeof F.attributeItem;
    };
    readonly innerAttribute: typeof FR.innerAttributeItemFrom & {
        from: typeof FR.innerAttributeItemFrom;
        strict: typeof F.innerAttributeItem;
    };
    readonly mod: typeof FR.modItemFrom & {
        from: typeof FR.modItemFrom;
        strict: typeof F.modItem;
        external: typeof FR.modItemUFormExternalFrom & {
            from: typeof FR.modItemUFormExternalFrom;
            strict: typeof F.modItemUFormExternal;
        };
        inline: typeof FR.modItemUFormInlineFrom & {
            from: typeof FR.modItemUFormInlineFrom;
            strict: typeof F.modItemUFormInline;
        };
    };
    readonly foreignMod: typeof FR.foreignModItemFrom & {
        from: typeof FR.foreignModItemFrom;
        strict: typeof F.foreignModItem;
        semi: typeof FR.foreignModItemUFormSemiFrom & {
            from: typeof FR.foreignModItemUFormSemiFrom;
            strict: typeof F.foreignModItemUFormSemi;
        };
        body: typeof FR.foreignModItemUFormBodyFrom & {
            from: typeof FR.foreignModItemUFormBodyFrom;
            strict: typeof F.foreignModItemUFormBody;
        };
    };
    readonly struct: typeof FR.structItemFrom & {
        from: typeof FR.structItemFrom;
        strict: typeof F.structItem;
        brace: typeof FR.structItemUFormBraceFrom & {
            from: typeof FR.structItemUFormBraceFrom;
            strict: typeof F.structItemUFormBrace;
        };
        tuple: typeof FR.structItemUFormTupleFrom & {
            from: typeof FR.structItemUFormTupleFrom;
            strict: typeof F.structItemUFormTuple;
        };
        unit: typeof FR.structItemUFormUnitFrom & {
            from: typeof FR.structItemUFormUnitFrom;
            strict: typeof F.structItemUFormUnit;
        };
    };
    readonly union: typeof FR.unionItemFrom & {
        from: typeof FR.unionItemFrom;
        strict: typeof F.unionItem;
    };
    readonly enum: typeof FR.enumItemFrom & {
        from: typeof FR.enumItemFrom;
        strict: typeof F.enumItem;
    };
    readonly type: typeof FR.typeItemFrom & {
        from: typeof FR.typeItemFrom;
        strict: typeof F.typeItem;
    };
    readonly function: typeof FR.functionItemFrom & {
        from: typeof FR.functionItemFrom;
        strict: typeof F.functionItem;
    };
    readonly functionSignature: typeof FR.functionSignatureItemFrom & {
        from: typeof FR.functionSignatureItemFrom;
        strict: typeof F.functionSignatureItem;
    };
    readonly impl: typeof FR.implItemFrom & {
        from: typeof FR.implItemFrom;
        strict: typeof F.implItem;
        body: typeof FR.implItemUFormBodyFrom & {
            from: typeof FR.implItemUFormBodyFrom;
            strict: typeof F.implItemUFormBody;
        };
        semi: typeof FR.implItemUFormSemiFrom & {
            from: typeof FR.implItemUFormSemiFrom;
            strict: typeof F.implItemUFormSemi;
        };
    };
    readonly trait: typeof FR.traitItemFrom & {
        from: typeof FR.traitItemFrom;
        strict: typeof F.traitItem;
    };
    readonly associated: typeof FR.associatedTypeFrom & {
        from: typeof FR.associatedTypeFrom;
        strict: typeof F.associatedType;
    };
    readonly let: typeof FR.letDeclarationFrom & {
        from: typeof FR.letDeclarationFrom;
        strict: typeof F.letDeclaration;
    };
    readonly use: typeof FR.useDeclarationFrom & {
        from: typeof FR.useDeclarationFrom;
        strict: typeof F.useDeclaration;
    };
    readonly externCrate: typeof FR.externCrateDeclarationFrom & {
        from: typeof FR.externCrateDeclarationFrom;
        strict: typeof F.externCrateDeclaration;
    };
    readonly static: typeof FR.staticItemFrom & {
        from: typeof FR.staticItemFrom;
        strict: typeof F.staticItem;
    };
};
export declare const delimTokens: {
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly mutable: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super: typeof F.super_;
    readonly crate: typeof F.crate;
    readonly delimToken: typeof FR.delimTokenTreeFrom & {
        from: typeof FR.delimTokenTreeFrom;
        strict: typeof F.delimTokenTree;
        paren: typeof FR.delimTokenTreeUFormParenFrom & {
            from: typeof FR.delimTokenTreeUFormParenFrom;
            strict: typeof F.delimTokenTreeUFormParen;
        };
        bracket: typeof FR.delimTokenTreeUFormBracketFrom & {
            from: typeof FR.delimTokenTreeUFormBracketFrom;
            strict: typeof F.delimTokenTreeUFormBracket;
        };
        brace: typeof FR.delimTokenTreeUFormBraceFrom & {
            from: typeof FR.delimTokenTreeUFormBraceFrom;
            strict: typeof F.delimTokenTreeUFormBrace;
        };
    };
};
export declare const expression: {
    readonly unary: typeof FR.unaryExpressionFrom & {
        from: typeof FR.unaryExpressionFrom;
        strict: typeof F.unaryExpression;
    };
    readonly reference: typeof FR.referenceExpressionFrom & {
        from: typeof FR.referenceExpressionFrom;
        strict: typeof F.referenceExpression;
    };
    readonly try: typeof FR.tryExpressionFrom & {
        from: typeof FR.tryExpressionFrom;
        strict: typeof F.tryExpression;
    };
    readonly binary: typeof FR.binaryExpressionFrom & {
        from: typeof FR.binaryExpressionFrom;
        strict: typeof F.binaryExpression;
    };
    readonly assignment: typeof FR.assignmentExpressionFrom & {
        from: typeof FR.assignmentExpressionFrom;
        strict: typeof F.assignmentExpression;
    };
    readonly compoundAssignment: typeof FR.compoundAssignmentExprFrom & {
        from: typeof FR.compoundAssignmentExprFrom;
        strict: typeof F.compoundAssignmentExpr;
    };
    readonly typeCast: typeof FR.typeCastExpressionFrom & {
        from: typeof FR.typeCastExpressionFrom;
        strict: typeof F.typeCastExpression;
    };
    readonly call: typeof FR.callExpressionFrom & {
        from: typeof FR.callExpressionFrom;
        strict: typeof F.callExpression;
    };
    readonly return: typeof FR.returnExpressionFrom & {
        from: typeof FR.returnExpressionFrom;
        strict: typeof F.returnExpression;
    };
    readonly yield: typeof FR.yieldExpressionFrom & {
        from: typeof FR.yieldExpressionFrom;
        strict: typeof F.yieldExpression;
    };
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly self: typeof F.self;
    readonly scoped: typeof FR.scopedIdentifierFrom & {
        from: typeof FR.scopedIdentifierFrom;
        strict: typeof F.scopedIdentifier;
    };
    readonly generic: typeof FR.genericFunctionFrom & {
        from: typeof FR.genericFunctionFrom;
        strict: typeof F.genericFunction;
    };
    readonly await: typeof FR.awaitExpressionFrom & {
        from: typeof FR.awaitExpressionFrom;
        strict: typeof F.awaitExpression;
    };
    readonly field: typeof FR.fieldExpressionFrom & {
        from: typeof FR.fieldExpressionFrom;
        strict: typeof F.fieldExpression;
    };
    readonly array: typeof FR.arrayExpressionFrom & {
        from: typeof FR.arrayExpressionFrom;
        strict: typeof F.arrayExpression;
        semi: typeof FR.arrayExpressionUFormSemiFrom & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
            strict: typeof F.arrayExpressionUFormSemi;
        };
        list: typeof FR.arrayExpressionUFormListFrom & {
            from: typeof FR.arrayExpressionUFormListFrom;
            strict: typeof F.arrayExpressionUFormList;
        };
    };
    readonly tuple: typeof FR.tupleExpressionFrom & {
        from: typeof FR.tupleExpressionFrom;
        strict: typeof F.tupleExpression;
    };
    readonly macro: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
    readonly unit: typeof F.unitExpression;
    readonly break: typeof FR.breakExpressionFrom & {
        from: typeof FR.breakExpressionFrom;
        strict: typeof F.breakExpression;
    };
    readonly continue: typeof FR.continueExpressionFrom & {
        from: typeof FR.continueExpressionFrom;
        strict: typeof F.continueExpression;
    };
    readonly index: typeof FR.indexExpressionFrom & {
        from: typeof FR.indexExpressionFrom;
        strict: typeof F.indexExpression;
    };
    readonly metavariable: typeof F.metavariable;
    readonly closure: typeof FR.closureExpressionFrom & {
        from: typeof FR.closureExpressionFrom;
        strict: typeof F.closureExpression;
        block: typeof FR.closureExpressionUFormBlockFrom & {
            from: typeof FR.closureExpressionUFormBlockFrom;
            strict: typeof F.closureExpressionUFormBlock;
        };
        expr: typeof FR.closureExpressionUFormExprFrom & {
            from: typeof FR.closureExpressionUFormExprFrom;
            strict: typeof F.closureExpressionUFormExpr;
        };
    };
    readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
    };
    readonly struct: typeof FR.structExpressionFrom & {
        from: typeof FR.structExpressionFrom;
        strict: typeof F.structExpression;
    };
    readonly unsafe: typeof FR.unsafeBlockFrom & {
        from: typeof FR.unsafeBlockFrom;
        strict: typeof F.unsafeBlock;
    };
    readonly async: typeof FR.asyncBlockFrom & {
        from: typeof FR.asyncBlockFrom;
        strict: typeof F.asyncBlock;
    };
    readonly gen: typeof FR.genBlockFrom & {
        from: typeof FR.genBlockFrom;
        strict: typeof F.genBlock;
    };
    readonly block: typeof FR.blockFrom & {
        from: typeof FR.blockFrom;
        strict: typeof F.block;
    };
    readonly if: typeof FR.ifExpressionFrom & {
        from: typeof FR.ifExpressionFrom;
        strict: typeof F.ifExpression;
    };
    readonly match: typeof FR.matchExpressionFrom & {
        from: typeof FR.matchExpressionFrom;
        strict: typeof F.matchExpression;
    };
    readonly while: typeof FR.whileExpressionFrom & {
        from: typeof FR.whileExpressionFrom;
        strict: typeof F.whileExpression;
    };
    readonly loop: typeof FR.loopExpressionFrom & {
        from: typeof FR.loopExpressionFrom;
        strict: typeof F.loopExpression;
    };
    readonly for: typeof FR.forExpressionFrom & {
        from: typeof FR.forExpressionFrom;
        strict: typeof F.forExpression;
    };
    readonly const: typeof FR.constBlockFrom & {
        from: typeof FR.constBlockFrom;
        strict: typeof F.constBlock;
    };
    readonly range: typeof FR.rangeExpressionFrom & {
        from: typeof FR.rangeExpressionFrom;
        strict: typeof F.rangeExpression;
        binary: typeof FR.rangeExpressionUFormBinaryFrom & {
            from: typeof FR.rangeExpressionUFormBinaryFrom;
            strict: typeof F.rangeExpressionUFormBinary;
        };
        postfix: typeof FR.rangeExpressionUFormPostfixFrom & {
            from: typeof FR.rangeExpressionUFormPostfixFrom;
            strict: typeof F.rangeExpressionUFormPostfix;
        };
        prefix: typeof FR.rangeExpressionUFormPrefixFrom & {
            from: typeof FR.rangeExpressionUFormPrefixFrom;
            strict: typeof F.rangeExpressionUFormPrefix;
        };
        bare: typeof FR.rangeExpressionUFormBareFrom & {
            from: typeof FR.rangeExpressionUFormBareFrom;
            strict: typeof F.rangeExpressionUFormBare;
        };
    };
};
export declare const expressionEndingWithBlock: {
    readonly unsafe: typeof FR.unsafeBlockFrom & {
        from: typeof FR.unsafeBlockFrom;
        strict: typeof F.unsafeBlock;
    };
    readonly async: typeof FR.asyncBlockFrom & {
        from: typeof FR.asyncBlockFrom;
        strict: typeof F.asyncBlock;
    };
    readonly gen: typeof FR.genBlockFrom & {
        from: typeof FR.genBlockFrom;
        strict: typeof F.genBlock;
    };
    readonly try: typeof FR.tryBlockFrom & {
        from: typeof FR.tryBlockFrom;
        strict: typeof F.tryBlock;
    };
    readonly block: typeof FR.blockFrom & {
        from: typeof FR.blockFrom;
        strict: typeof F.block;
    };
    readonly if: typeof FR.ifExpressionFrom & {
        from: typeof FR.ifExpressionFrom;
        strict: typeof F.ifExpression;
    };
    readonly match: typeof FR.matchExpressionFrom & {
        from: typeof FR.matchExpressionFrom;
        strict: typeof F.matchExpression;
    };
    readonly while: typeof FR.whileExpressionFrom & {
        from: typeof FR.whileExpressionFrom;
        strict: typeof F.whileExpression;
    };
    readonly loop: typeof FR.loopExpressionFrom & {
        from: typeof FR.loopExpressionFrom;
        strict: typeof F.loopExpression;
    };
    readonly for: typeof FR.forExpressionFrom & {
        from: typeof FR.forExpressionFrom;
        strict: typeof F.forExpression;
    };
    readonly const: typeof FR.constBlockFrom & {
        from: typeof FR.constBlockFrom;
        strict: typeof F.constBlock;
    };
};
export declare const expressionExceptRange: {
    readonly unary: typeof FR.unaryExpressionFrom & {
        from: typeof FR.unaryExpressionFrom;
        strict: typeof F.unaryExpression;
    };
    readonly reference: typeof FR.referenceExpressionFrom & {
        from: typeof FR.referenceExpressionFrom;
        strict: typeof F.referenceExpression;
    };
    readonly try: typeof FR.tryExpressionFrom & {
        from: typeof FR.tryExpressionFrom;
        strict: typeof F.tryExpression;
    };
    readonly binary: typeof FR.binaryExpressionFrom & {
        from: typeof FR.binaryExpressionFrom;
        strict: typeof F.binaryExpression;
    };
    readonly assignment: typeof FR.assignmentExpressionFrom & {
        from: typeof FR.assignmentExpressionFrom;
        strict: typeof F.assignmentExpression;
    };
    readonly compoundAssignment: typeof FR.compoundAssignmentExprFrom & {
        from: typeof FR.compoundAssignmentExprFrom;
        strict: typeof F.compoundAssignmentExpr;
    };
    readonly typeCast: typeof FR.typeCastExpressionFrom & {
        from: typeof FR.typeCastExpressionFrom;
        strict: typeof F.typeCastExpression;
    };
    readonly call: typeof FR.callExpressionFrom & {
        from: typeof FR.callExpressionFrom;
        strict: typeof F.callExpression;
    };
    readonly return: typeof FR.returnExpressionFrom & {
        from: typeof FR.returnExpressionFrom;
        strict: typeof F.returnExpression;
    };
    readonly yield: typeof FR.yieldExpressionFrom & {
        from: typeof FR.yieldExpressionFrom;
        strict: typeof F.yieldExpression;
    };
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly self: typeof F.self;
    readonly scoped: typeof FR.scopedIdentifierFrom & {
        from: typeof FR.scopedIdentifierFrom;
        strict: typeof F.scopedIdentifier;
    };
    readonly generic: typeof FR.genericFunctionFrom & {
        from: typeof FR.genericFunctionFrom;
        strict: typeof F.genericFunction;
    };
    readonly await: typeof FR.awaitExpressionFrom & {
        from: typeof FR.awaitExpressionFrom;
        strict: typeof F.awaitExpression;
    };
    readonly field: typeof FR.fieldExpressionFrom & {
        from: typeof FR.fieldExpressionFrom;
        strict: typeof F.fieldExpression;
    };
    readonly array: typeof FR.arrayExpressionFrom & {
        from: typeof FR.arrayExpressionFrom;
        strict: typeof F.arrayExpression;
        semi: typeof FR.arrayExpressionUFormSemiFrom & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
            strict: typeof F.arrayExpressionUFormSemi;
        };
        list: typeof FR.arrayExpressionUFormListFrom & {
            from: typeof FR.arrayExpressionUFormListFrom;
            strict: typeof F.arrayExpressionUFormList;
        };
    };
    readonly tuple: typeof FR.tupleExpressionFrom & {
        from: typeof FR.tupleExpressionFrom;
        strict: typeof F.tupleExpression;
    };
    readonly macro: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
    readonly unit: typeof F.unitExpression;
    readonly break: typeof FR.breakExpressionFrom & {
        from: typeof FR.breakExpressionFrom;
        strict: typeof F.breakExpression;
    };
    readonly continue: typeof FR.continueExpressionFrom & {
        from: typeof FR.continueExpressionFrom;
        strict: typeof F.continueExpression;
    };
    readonly index: typeof FR.indexExpressionFrom & {
        from: typeof FR.indexExpressionFrom;
        strict: typeof F.indexExpression;
    };
    readonly metavariable: typeof F.metavariable;
    readonly closure: typeof FR.closureExpressionFrom & {
        from: typeof FR.closureExpressionFrom;
        strict: typeof F.closureExpression;
        block: typeof FR.closureExpressionUFormBlockFrom & {
            from: typeof FR.closureExpressionUFormBlockFrom;
            strict: typeof F.closureExpressionUFormBlock;
        };
        expr: typeof FR.closureExpressionUFormExprFrom & {
            from: typeof FR.closureExpressionUFormExprFrom;
            strict: typeof F.closureExpressionUFormExpr;
        };
    };
    readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
    };
    readonly struct: typeof FR.structExpressionFrom & {
        from: typeof FR.structExpressionFrom;
        strict: typeof F.structExpression;
    };
    readonly unsafe: typeof FR.unsafeBlockFrom & {
        from: typeof FR.unsafeBlockFrom;
        strict: typeof F.unsafeBlock;
    };
    readonly async: typeof FR.asyncBlockFrom & {
        from: typeof FR.asyncBlockFrom;
        strict: typeof F.asyncBlock;
    };
    readonly gen: typeof FR.genBlockFrom & {
        from: typeof FR.genBlockFrom;
        strict: typeof F.genBlock;
    };
    readonly block: typeof FR.blockFrom & {
        from: typeof FR.blockFrom;
        strict: typeof F.block;
    };
    readonly if: typeof FR.ifExpressionFrom & {
        from: typeof FR.ifExpressionFrom;
        strict: typeof F.ifExpression;
    };
    readonly match: typeof FR.matchExpressionFrom & {
        from: typeof FR.matchExpressionFrom;
        strict: typeof F.matchExpression;
    };
    readonly while: typeof FR.whileExpressionFrom & {
        from: typeof FR.whileExpressionFrom;
        strict: typeof F.whileExpression;
    };
    readonly loop: typeof FR.loopExpressionFrom & {
        from: typeof FR.loopExpressionFrom;
        strict: typeof F.loopExpression;
    };
    readonly for: typeof FR.forExpressionFrom & {
        from: typeof FR.forExpressionFrom;
        strict: typeof F.forExpression;
    };
    readonly const: typeof FR.constBlockFrom & {
        from: typeof FR.constBlockFrom;
        strict: typeof F.constBlock;
    };
};
export declare const literal: {
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
};
export declare const literalPattern: {
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly negative: typeof FR.negativeLiteralFrom & {
        from: typeof FR.negativeLiteralFrom;
        strict: typeof F.negativeLiteral;
    };
};
export declare const nonDelimToken: {
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly mutable: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super: typeof F.super_;
    readonly crate: typeof F.crate;
};
export declare const path: {
    readonly self: typeof F.self;
    readonly identifier: typeof F.identifier;
    readonly metavariable: typeof F.metavariable;
    readonly super: typeof F.super_;
    readonly crate: typeof F.crate;
    readonly scoped: typeof FR.scopedIdentifierFrom & {
        from: typeof FR.scopedIdentifierFrom;
        strict: typeof F.scopedIdentifier;
    };
};
export declare const pattern: {
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly negative: typeof FR.negativeLiteralFrom & {
        from: typeof FR.negativeLiteralFrom;
        strict: typeof F.negativeLiteral;
    };
    readonly identifier: typeof F.identifier;
    readonly scoped: typeof FR.scopedIdentifierFrom & {
        from: typeof FR.scopedIdentifierFrom;
        strict: typeof F.scopedIdentifier;
    };
    readonly generic: typeof FR.genericPatternFrom & {
        from: typeof FR.genericPatternFrom;
        strict: typeof F.genericPattern;
    };
    readonly tuple: typeof FR.tuplePatternFrom & {
        from: typeof FR.tuplePatternFrom;
        strict: typeof F.tuplePattern;
    };
    readonly tupleStruct: typeof FR.tupleStructPatternFrom & {
        from: typeof FR.tupleStructPatternFrom;
        strict: typeof F.tupleStructPattern;
    };
    readonly struct: typeof FR.structPatternFrom & {
        from: typeof FR.structPatternFrom;
        strict: typeof F.structPattern;
    };
    readonly ref: typeof FR.refPatternFrom & {
        from: typeof FR.refPatternFrom;
        strict: typeof F.refPattern;
    };
    readonly slice: typeof FR.slicePatternFrom & {
        from: typeof FR.slicePatternFrom;
        strict: typeof F.slicePattern;
    };
    readonly captured: typeof FR.capturedPatternFrom & {
        from: typeof FR.capturedPatternFrom;
        strict: typeof F.capturedPattern;
    };
    readonly reference: typeof FR.referencePatternFrom & {
        from: typeof FR.referencePatternFrom;
        strict: typeof F.referencePattern;
    };
    readonly mut: typeof FR.mutPatternFrom & {
        from: typeof FR.mutPatternFrom;
        strict: typeof F.mutPattern;
    };
    readonly range: typeof FR.rangePatternFrom & {
        from: typeof FR.rangePatternFrom;
        strict: typeof F.rangePattern;
        prefix: typeof FR.rangePatternUFormPrefixFrom & {
            from: typeof FR.rangePatternUFormPrefixFrom;
            strict: typeof F.rangePatternUFormPrefix;
        };
        leftWithRight: typeof FR.rangePatternUFormLeftWithRightFrom & {
            from: typeof FR.rangePatternUFormLeftWithRightFrom;
            strict: typeof F.rangePatternUFormLeftWithRight;
        };
        left_with_right: typeof FR.rangePatternUFormLeftWithRightFrom & {
            from: typeof FR.rangePatternUFormLeftWithRightFrom;
            strict: typeof F.rangePatternUFormLeftWithRight;
        };
        leftBare: typeof FR.rangePatternUFormLeftBareFrom & {
            from: typeof FR.rangePatternUFormLeftBareFrom;
            strict: typeof F.rangePatternUFormLeftBare;
        };
        left_bare: typeof FR.rangePatternUFormLeftBareFrom & {
            from: typeof FR.rangePatternUFormLeftBareFrom;
            strict: typeof F.rangePatternUFormLeftBare;
        };
    };
    readonly or: typeof FR.orPatternFrom & {
        from: typeof FR.orPatternFrom;
        strict: typeof F.orPattern;
        binary: typeof FR.orPatternUFormBinaryFrom & {
            from: typeof FR.orPatternUFormBinaryFrom;
            strict: typeof F.orPatternUFormBinary;
        };
        prefix: typeof FR.orPatternUFormPrefixFrom & {
            from: typeof FR.orPatternUFormPrefixFrom;
            strict: typeof F.orPatternUFormPrefix;
        };
    };
    readonly const: typeof FR.constBlockFrom & {
        from: typeof FR.constBlockFrom;
        strict: typeof F.constBlock;
    };
    readonly macro: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
};
export declare const statement: {
    readonly expression: typeof FR.expressionStatementFrom & {
        from: typeof FR.expressionStatementFrom;
        strict: typeof F.expressionStatement;
        withSemi: typeof FR.expressionStatementUFormWithSemiFrom & {
            from: typeof FR.expressionStatementUFormWithSemiFrom;
            strict: typeof F.expressionStatementUFormWithSemi;
        };
        with_semi: typeof FR.expressionStatementUFormWithSemiFrom & {
            from: typeof FR.expressionStatementUFormWithSemiFrom;
            strict: typeof F.expressionStatementUFormWithSemi;
        };
        blockEnding: typeof FR.expressionStatementUFormBlockEndingFrom & {
            from: typeof FR.expressionStatementUFormBlockEndingFrom;
            strict: typeof F.expressionStatementUFormBlockEnding;
        };
        block_ending: typeof FR.expressionStatementUFormBlockEndingFrom & {
            from: typeof FR.expressionStatementUFormBlockEndingFrom;
            strict: typeof F.expressionStatementUFormBlockEnding;
        };
    };
    readonly const: typeof FR.constItemFrom & {
        from: typeof FR.constItemFrom;
        strict: typeof F.constItem;
    };
    readonly macro: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
    readonly attribute: typeof FR.attributeItemFrom & {
        from: typeof FR.attributeItemFrom;
        strict: typeof F.attributeItem;
    };
    readonly innerAttribute: typeof FR.innerAttributeItemFrom & {
        from: typeof FR.innerAttributeItemFrom;
        strict: typeof F.innerAttributeItem;
    };
    readonly mod: typeof FR.modItemFrom & {
        from: typeof FR.modItemFrom;
        strict: typeof F.modItem;
        external: typeof FR.modItemUFormExternalFrom & {
            from: typeof FR.modItemUFormExternalFrom;
            strict: typeof F.modItemUFormExternal;
        };
        inline: typeof FR.modItemUFormInlineFrom & {
            from: typeof FR.modItemUFormInlineFrom;
            strict: typeof F.modItemUFormInline;
        };
    };
    readonly foreignMod: typeof FR.foreignModItemFrom & {
        from: typeof FR.foreignModItemFrom;
        strict: typeof F.foreignModItem;
        semi: typeof FR.foreignModItemUFormSemiFrom & {
            from: typeof FR.foreignModItemUFormSemiFrom;
            strict: typeof F.foreignModItemUFormSemi;
        };
        body: typeof FR.foreignModItemUFormBodyFrom & {
            from: typeof FR.foreignModItemUFormBodyFrom;
            strict: typeof F.foreignModItemUFormBody;
        };
    };
    readonly struct: typeof FR.structItemFrom & {
        from: typeof FR.structItemFrom;
        strict: typeof F.structItem;
        brace: typeof FR.structItemUFormBraceFrom & {
            from: typeof FR.structItemUFormBraceFrom;
            strict: typeof F.structItemUFormBrace;
        };
        tuple: typeof FR.structItemUFormTupleFrom & {
            from: typeof FR.structItemUFormTupleFrom;
            strict: typeof F.structItemUFormTuple;
        };
        unit: typeof FR.structItemUFormUnitFrom & {
            from: typeof FR.structItemUFormUnitFrom;
            strict: typeof F.structItemUFormUnit;
        };
    };
    readonly union: typeof FR.unionItemFrom & {
        from: typeof FR.unionItemFrom;
        strict: typeof F.unionItem;
    };
    readonly enum: typeof FR.enumItemFrom & {
        from: typeof FR.enumItemFrom;
        strict: typeof F.enumItem;
    };
    readonly type: typeof FR.typeItemFrom & {
        from: typeof FR.typeItemFrom;
        strict: typeof F.typeItem;
    };
    readonly function: typeof FR.functionItemFrom & {
        from: typeof FR.functionItemFrom;
        strict: typeof F.functionItem;
    };
    readonly functionSignature: typeof FR.functionSignatureItemFrom & {
        from: typeof FR.functionSignatureItemFrom;
        strict: typeof F.functionSignatureItem;
    };
    readonly impl: typeof FR.implItemFrom & {
        from: typeof FR.implItemFrom;
        strict: typeof F.implItem;
        body: typeof FR.implItemUFormBodyFrom & {
            from: typeof FR.implItemUFormBodyFrom;
            strict: typeof F.implItemUFormBody;
        };
        semi: typeof FR.implItemUFormSemiFrom & {
            from: typeof FR.implItemUFormSemiFrom;
            strict: typeof F.implItemUFormSemi;
        };
    };
    readonly trait: typeof FR.traitItemFrom & {
        from: typeof FR.traitItemFrom;
        strict: typeof F.traitItem;
    };
    readonly associated: typeof FR.associatedTypeFrom & {
        from: typeof FR.associatedTypeFrom;
        strict: typeof F.associatedType;
    };
    readonly let: typeof FR.letDeclarationFrom & {
        from: typeof FR.letDeclarationFrom;
        strict: typeof F.letDeclaration;
    };
    readonly use: typeof FR.useDeclarationFrom & {
        from: typeof FR.useDeclarationFrom;
        strict: typeof F.useDeclaration;
    };
    readonly externCrate: typeof FR.externCrateDeclarationFrom & {
        from: typeof FR.externCrateDeclarationFrom;
        strict: typeof F.externCrateDeclaration;
    };
    readonly static: typeof FR.staticItemFrom & {
        from: typeof FR.staticItemFrom;
        strict: typeof F.staticItem;
    };
};
export declare const tokenPattern: {
    readonly tokenTree: typeof FR.tokenTreePatternFrom & {
        from: typeof FR.tokenTreePatternFrom;
        strict: typeof F.tokenTreePattern;
        paren: typeof FR.tokenTreePatternUFormParenFrom & {
            from: typeof FR.tokenTreePatternUFormParenFrom;
            strict: typeof F.tokenTreePatternUFormParen;
        };
        bracket: typeof FR.tokenTreePatternUFormBracketFrom & {
            from: typeof FR.tokenTreePatternUFormBracketFrom;
            strict: typeof F.tokenTreePatternUFormBracket;
        };
        brace: typeof FR.tokenTreePatternUFormBraceFrom & {
            from: typeof FR.tokenTreePatternUFormBraceFrom;
            strict: typeof F.tokenTreePatternUFormBrace;
        };
    };
    readonly tokenRepetition: typeof FR.tokenRepetitionPatternFrom & {
        from: typeof FR.tokenRepetitionPatternFrom;
        strict: typeof F.tokenRepetitionPattern;
    };
    readonly tokenBinding: typeof FR.tokenBindingPatternFrom & {
        from: typeof FR.tokenBindingPatternFrom;
        strict: typeof F.tokenBindingPattern;
    };
    readonly metavariable: typeof F.metavariable;
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly mutable: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super: typeof F.super_;
    readonly crate: typeof F.crate;
};
export declare const tokens: {
    readonly token: typeof FR.tokenTreeFrom & {
        from: typeof FR.tokenTreeFrom;
        strict: typeof F.tokenTree;
        paren: typeof FR.tokenTreeUFormParenFrom & {
            from: typeof FR.tokenTreeUFormParenFrom;
            strict: typeof F.tokenTreeUFormParen;
        };
        bracket: typeof FR.tokenTreeUFormBracketFrom & {
            from: typeof FR.tokenTreeUFormBracketFrom;
            strict: typeof F.tokenTreeUFormBracket;
        };
        brace: typeof FR.tokenTreeUFormBraceFrom & {
            from: typeof FR.tokenTreeUFormBraceFrom;
            strict: typeof F.tokenTreeUFormBrace;
        };
    };
    readonly metavariable: typeof F.metavariable;
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly char: typeof F.charLiteral;
    readonly boolean: typeof F.booleanLiteral;
    readonly integer: typeof F.integerLiteral;
    readonly float: typeof F.floatLiteral;
    readonly identifier: typeof F.identifier;
    readonly mutable: typeof F.mutableSpecifier;
    readonly self: typeof F.self;
    readonly super: typeof F.super_;
    readonly crate: typeof F.crate;
};
export declare const type: {
    readonly abstract: typeof FR.abstractTypeFrom & {
        from: typeof FR.abstractTypeFrom;
        strict: typeof F.abstractType;
    };
    readonly reference: typeof FR.referenceTypeFrom & {
        from: typeof FR.referenceTypeFrom;
        strict: typeof F.referenceType;
    };
    readonly metavariable: typeof F.metavariable;
    readonly pointer: typeof FR.pointerTypeFrom & {
        from: typeof FR.pointerTypeFrom;
        strict: typeof F.pointerType;
        const: typeof FR.pointerTypeUFormConstFrom & {
            from: typeof FR.pointerTypeUFormConstFrom;
            strict: typeof F.pointerTypeUFormConst;
        };
        mut: typeof FR.pointerTypeUFormMutFrom & {
            from: typeof FR.pointerTypeUFormMutFrom;
            strict: typeof F.pointerTypeUFormMut;
        };
    };
    readonly generic: typeof FR.genericTypeFrom & {
        from: typeof FR.genericTypeFrom;
        strict: typeof F.genericType;
    };
    readonly scopedType: typeof FR.scopedTypeIdentifierFrom & {
        from: typeof FR.scopedTypeIdentifierFrom;
        strict: typeof F.scopedTypeIdentifier;
    };
    readonly tuple: typeof FR.tupleTypeFrom & {
        from: typeof FR.tupleTypeFrom;
        strict: typeof F.tupleType;
    };
    readonly unit: typeof F.unitType;
    readonly array: typeof FR.arrayTypeFrom & {
        from: typeof FR.arrayTypeFrom;
        strict: typeof F.arrayType;
    };
    readonly function: typeof FR.functionTypeFrom & {
        from: typeof FR.functionTypeFrom;
        strict: typeof F.functionType;
    };
    readonly macro: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
    readonly dynamic: typeof FR.dynamicTypeFrom & {
        from: typeof FR.dynamicTypeFrom;
        strict: typeof F.dynamicType;
    };
    readonly bounded: typeof FR.boundedTypeFrom & {
        from: typeof FR.boundedTypeFrom;
        strict: typeof F.boundedType;
    };
    readonly removedTrait: typeof FR.removedTraitBoundFrom & {
        from: typeof FR.removedTraitBoundFrom;
        strict: typeof F.removedTraitBound;
    };
};
export declare const useClause: {
    readonly self: typeof F.self;
    readonly identifier: typeof F.identifier;
    readonly metavariable: typeof F.metavariable;
    readonly super: typeof F.super_;
    readonly crate: typeof F.crate;
    readonly scoped: typeof FR.scopedIdentifierFrom & {
        from: typeof FR.scopedIdentifierFrom;
        strict: typeof F.scopedIdentifier;
    };
    readonly useAs: typeof FR.useAsClauseFrom & {
        from: typeof FR.useAsClauseFrom;
        strict: typeof F.useAsClause;
    };
    readonly use: typeof FR.useListFrom & {
        from: typeof FR.useListFrom;
        strict: typeof F.useList;
    };
    readonly scopedUse: typeof FR.scopedUseListFrom & {
        from: typeof FR.scopedUseListFrom;
        strict: typeof F.scopedUseList;
    };
};
export declare const from: {
    boolean(value: boolean): ReturnType<typeof F.booleanLiteral>;
    number: ((value: number) => ReturnType<typeof F.integerLiteral> | ReturnType<typeof F.floatLiteral>) & {
        integer(value: number): ReturnType<typeof F.integerLiteral>;
        float(value: number): ReturnType<typeof F.floatLiteral>;
    };
    string(value: string): ReturnType<typeof F.stringLiteral>;
    type(name: string): ReturnType<typeof F.typeIdentifier>;
    identifier(name: string): ReturnType<typeof F.identifier>;
    readonly function: typeof FR.functionItemFrom & {
        from: typeof FR.functionItemFrom;
        strict: typeof F.functionItem;
    };
    readonly class: typeof FR.structItemFrom & {
        from: typeof FR.structItemFrom;
        strict: typeof F.structItem;
        brace: typeof FR.structItemUFormBraceFrom & {
            from: typeof FR.structItemUFormBraceFrom;
            strict: typeof F.structItemUFormBrace;
        };
        tuple: typeof FR.structItemUFormTupleFrom & {
            from: typeof FR.structItemUFormTupleFrom;
            strict: typeof F.structItemUFormTuple;
        };
        unit: typeof FR.structItemUFormUnitFrom & {
            from: typeof FR.structItemUFormUnitFrom;
            strict: typeof F.structItemUFormUnit;
        };
    };
    readonly method: typeof FR.functionItemFrom & {
        from: typeof FR.functionItemFrom;
        strict: typeof F.functionItem;
    };
    readonly module: typeof FR.modItemFrom & {
        from: typeof FR.modItemFrom;
        strict: typeof F.modItem;
        external: typeof FR.modItemUFormExternalFrom & {
            from: typeof FR.modItemUFormExternalFrom;
            strict: typeof F.modItemUFormExternal;
        };
        inline: typeof FR.modItemUFormInlineFrom & {
            from: typeof FR.modItemUFormInlineFrom;
            strict: typeof F.modItemUFormInline;
        };
    };
    readonly interface: typeof FR.traitItemFrom & {
        from: typeof FR.traitItemFrom;
        strict: typeof F.traitItem;
    };
};
export declare const ir: {
    readonly abstractType: typeof FR.abstractTypeFrom & {
        from: typeof FR.abstractTypeFrom;
        strict: typeof F.abstractType;
    };
    readonly arguments: typeof FR.arguments_From & {
        from: typeof FR.arguments_From;
        strict: typeof F.arguments_;
    };
    readonly arrayExpression: typeof FR.arrayExpressionFrom & {
        from: typeof FR.arrayExpressionFrom;
        strict: typeof F.arrayExpression;
        semi: typeof FR.arrayExpressionUFormSemiFrom & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
            strict: typeof F.arrayExpressionUFormSemi;
        };
        list: typeof FR.arrayExpressionUFormListFrom & {
            from: typeof FR.arrayExpressionUFormListFrom;
            strict: typeof F.arrayExpressionUFormList;
        };
    };
    readonly arrayType: typeof FR.arrayTypeFrom & {
        from: typeof FR.arrayTypeFrom;
        strict: typeof F.arrayType;
    };
    readonly assignmentExpression: typeof FR.assignmentExpressionFrom & {
        from: typeof FR.assignmentExpressionFrom;
        strict: typeof F.assignmentExpression;
    };
    readonly associatedType: typeof FR.associatedTypeFrom & {
        from: typeof FR.associatedTypeFrom;
        strict: typeof F.associatedType;
    };
    readonly asyncBlock: typeof FR.asyncBlockFrom & {
        from: typeof FR.asyncBlockFrom;
        strict: typeof F.asyncBlock;
    };
    readonly attribute: typeof FR.attributeFrom & {
        from: typeof FR.attributeFrom;
        strict: typeof F.attribute;
    };
    readonly attributeItem: typeof FR.attributeItemFrom & {
        from: typeof FR.attributeItemFrom;
        strict: typeof F.attributeItem;
    };
    readonly awaitExpression: typeof FR.awaitExpressionFrom & {
        from: typeof FR.awaitExpressionFrom;
        strict: typeof F.awaitExpression;
    };
    readonly baseFieldInitializer: typeof FR.baseFieldInitializerFrom & {
        from: typeof FR.baseFieldInitializerFrom;
        strict: typeof F.baseFieldInitializer;
    };
    readonly binaryExpression: typeof FR.binaryExpressionFrom & {
        from: typeof FR.binaryExpressionFrom;
        strict: typeof F.binaryExpression;
    };
    readonly block: typeof FR.blockFrom & {
        from: typeof FR.blockFrom;
        strict: typeof F.block;
    };
    readonly blockComment: typeof FR.blockCommentFrom & {
        from: typeof FR.blockCommentFrom;
        strict: typeof F.blockComment;
    };
    readonly boundedType: typeof FR.boundedTypeFrom & {
        from: typeof FR.boundedTypeFrom;
        strict: typeof F.boundedType;
    };
    readonly bracketedType: typeof FR.bracketedTypeFrom & {
        from: typeof FR.bracketedTypeFrom;
        strict: typeof F.bracketedType;
    };
    readonly breakExpression: typeof FR.breakExpressionFrom & {
        from: typeof FR.breakExpressionFrom;
        strict: typeof F.breakExpression;
    };
    readonly callExpression: typeof FR.callExpressionFrom & {
        from: typeof FR.callExpressionFrom;
        strict: typeof F.callExpression;
    };
    readonly capturedPattern: typeof FR.capturedPatternFrom & {
        from: typeof FR.capturedPatternFrom;
        strict: typeof F.capturedPattern;
    };
    readonly closureExpressionExpr: typeof FR.closureExpressionExprFrom & {
        from: typeof FR.closureExpressionExprFrom;
        strict: typeof F.closureExpressionExpr;
    };
    readonly closureExpression: typeof FR.closureExpressionFrom & {
        from: typeof FR.closureExpressionFrom;
        strict: typeof F.closureExpression;
        block: typeof FR.closureExpressionUFormBlockFrom & {
            from: typeof FR.closureExpressionUFormBlockFrom;
            strict: typeof F.closureExpressionUFormBlock;
        };
        expr: typeof FR.closureExpressionUFormExprFrom & {
            from: typeof FR.closureExpressionUFormExprFrom;
            strict: typeof F.closureExpressionUFormExpr;
        };
    };
    readonly closureParameters: typeof FR.closureParametersFrom & {
        from: typeof FR.closureParametersFrom;
        strict: typeof F.closureParameters;
    };
    readonly compoundAssignmentExpr: typeof FR.compoundAssignmentExprFrom & {
        from: typeof FR.compoundAssignmentExprFrom;
        strict: typeof F.compoundAssignmentExpr;
    };
    readonly constBlock: typeof FR.constBlockFrom & {
        from: typeof FR.constBlockFrom;
        strict: typeof F.constBlock;
    };
    readonly constItem: typeof FR.constItemFrom & {
        from: typeof FR.constItemFrom;
        strict: typeof F.constItem;
    };
    readonly constParameter: typeof FR.constParameterFrom & {
        from: typeof FR.constParameterFrom;
        strict: typeof F.constParameter;
    };
    readonly continueExpression: typeof FR.continueExpressionFrom & {
        from: typeof FR.continueExpressionFrom;
        strict: typeof F.continueExpression;
    };
    readonly declarationList: typeof FR.declarationListFrom & {
        from: typeof FR.declarationListFrom;
        strict: typeof F.declarationList;
    };
    readonly delimTokenTreeParen: typeof FR.delimTokenTreeParenFrom & {
        from: typeof FR.delimTokenTreeParenFrom;
        strict: typeof F.delimTokenTreeParen;
    };
    readonly delimTokenTreeBracket: typeof FR.delimTokenTreeBracketFrom & {
        from: typeof FR.delimTokenTreeBracketFrom;
        strict: typeof F.delimTokenTreeBracket;
    };
    readonly delimTokenTreeBrace: typeof FR.delimTokenTreeBraceFrom & {
        from: typeof FR.delimTokenTreeBraceFrom;
        strict: typeof F.delimTokenTreeBrace;
    };
    readonly delimTokenTree: typeof FR.delimTokenTreeFrom & {
        from: typeof FR.delimTokenTreeFrom;
        strict: typeof F.delimTokenTree;
        paren: typeof FR.delimTokenTreeUFormParenFrom & {
            from: typeof FR.delimTokenTreeUFormParenFrom;
            strict: typeof F.delimTokenTreeUFormParen;
        };
        bracket: typeof FR.delimTokenTreeUFormBracketFrom & {
            from: typeof FR.delimTokenTreeUFormBracketFrom;
            strict: typeof F.delimTokenTreeUFormBracket;
        };
        brace: typeof FR.delimTokenTreeUFormBraceFrom & {
            from: typeof FR.delimTokenTreeUFormBraceFrom;
            strict: typeof F.delimTokenTreeUFormBrace;
        };
    };
    readonly dynamicType: typeof FR.dynamicTypeFrom & {
        from: typeof FR.dynamicTypeFrom;
        strict: typeof F.dynamicType;
    };
    readonly elseClause: typeof FR.elseClauseFrom & {
        from: typeof FR.elseClauseFrom;
        strict: typeof F.elseClause;
    };
    readonly enumItem: typeof FR.enumItemFrom & {
        from: typeof FR.enumItemFrom;
        strict: typeof F.enumItem;
    };
    readonly enumVariant: typeof FR.enumVariantFrom & {
        from: typeof FR.enumVariantFrom;
        strict: typeof F.enumVariant;
    };
    readonly enumVariantList: typeof FR.enumVariantListFrom & {
        from: typeof FR.enumVariantListFrom;
        strict: typeof F.enumVariantList;
    };
    readonly expressionStatementWithSemi: typeof FR.expressionStatementWithSemiFrom & {
        from: typeof FR.expressionStatementWithSemiFrom;
        strict: typeof F.expressionStatementWithSemi;
    };
    readonly expressionStatementBlockEnding: typeof FR.expressionStatementBlockEndingFrom & {
        from: typeof FR.expressionStatementBlockEndingFrom;
        strict: typeof F.expressionStatementBlockEnding;
    };
    readonly expressionStatement: typeof FR.expressionStatementFrom & {
        from: typeof FR.expressionStatementFrom;
        strict: typeof F.expressionStatement;
        withSemi: typeof FR.expressionStatementUFormWithSemiFrom & {
            from: typeof FR.expressionStatementUFormWithSemiFrom;
            strict: typeof F.expressionStatementUFormWithSemi;
        };
        with_semi: typeof FR.expressionStatementUFormWithSemiFrom & {
            from: typeof FR.expressionStatementUFormWithSemiFrom;
            strict: typeof F.expressionStatementUFormWithSemi;
        };
        blockEnding: typeof FR.expressionStatementUFormBlockEndingFrom & {
            from: typeof FR.expressionStatementUFormBlockEndingFrom;
            strict: typeof F.expressionStatementUFormBlockEnding;
        };
        block_ending: typeof FR.expressionStatementUFormBlockEndingFrom & {
            from: typeof FR.expressionStatementUFormBlockEndingFrom;
            strict: typeof F.expressionStatementUFormBlockEnding;
        };
    };
    readonly externCrateDeclaration: typeof FR.externCrateDeclarationFrom & {
        from: typeof FR.externCrateDeclarationFrom;
        strict: typeof F.externCrateDeclaration;
    };
    readonly externModifier: typeof FR.externModifierFrom & {
        from: typeof FR.externModifierFrom;
        strict: typeof F.externModifier;
    };
    readonly fieldDeclaration: typeof FR.fieldDeclarationFrom & {
        from: typeof FR.fieldDeclarationFrom;
        strict: typeof F.fieldDeclaration;
    };
    readonly fieldDeclarationList: typeof FR.fieldDeclarationListFrom & {
        from: typeof FR.fieldDeclarationListFrom;
        strict: typeof F.fieldDeclarationList;
    };
    readonly fieldExpression: typeof FR.fieldExpressionFrom & {
        from: typeof FR.fieldExpressionFrom;
        strict: typeof F.fieldExpression;
    };
    readonly fieldInitializer: typeof FR.fieldInitializerFrom & {
        from: typeof FR.fieldInitializerFrom;
        strict: typeof F.fieldInitializer;
    };
    readonly fieldInitializerList: typeof FR.fieldInitializerListFrom & {
        from: typeof FR.fieldInitializerListFrom;
        strict: typeof F.fieldInitializerList;
    };
    readonly fieldPatternShorthand: typeof FR.fieldPatternShorthandFrom & {
        from: typeof FR.fieldPatternShorthandFrom;
        strict: typeof F.fieldPatternShorthand;
    };
    readonly fieldPattern: typeof FR.fieldPatternFrom & {
        from: typeof FR.fieldPatternFrom;
        strict: typeof F.fieldPattern;
        shorthand: typeof FR.fieldPatternUFormShorthandFrom & {
            from: typeof FR.fieldPatternUFormShorthandFrom;
            strict: typeof F.fieldPatternUFormShorthand;
        };
        named: typeof FR.fieldPatternUFormNamedFrom & {
            from: typeof FR.fieldPatternUFormNamedFrom;
            strict: typeof F.fieldPatternUFormNamed;
        };
    };
    readonly forExpression: typeof FR.forExpressionFrom & {
        from: typeof FR.forExpressionFrom;
        strict: typeof F.forExpression;
    };
    readonly forLifetimes: typeof FR.forLifetimesFrom & {
        from: typeof FR.forLifetimesFrom;
        strict: typeof F.forLifetimes;
    };
    readonly foreignModItemBody: typeof FR.foreignModItemBodyFrom & {
        from: typeof FR.foreignModItemBodyFrom;
        strict: typeof F.foreignModItemBody;
    };
    readonly foreignModItem: typeof FR.foreignModItemFrom & {
        from: typeof FR.foreignModItemFrom;
        strict: typeof F.foreignModItem;
        semi: typeof FR.foreignModItemUFormSemiFrom & {
            from: typeof FR.foreignModItemUFormSemiFrom;
            strict: typeof F.foreignModItemUFormSemi;
        };
        body: typeof FR.foreignModItemUFormBodyFrom & {
            from: typeof FR.foreignModItemUFormBodyFrom;
            strict: typeof F.foreignModItemUFormBody;
        };
    };
    readonly functionItem: typeof FR.functionItemFrom & {
        from: typeof FR.functionItemFrom;
        strict: typeof F.functionItem;
    };
    readonly functionModifiers: typeof FR.functionModifiersFrom & {
        from: typeof FR.functionModifiersFrom;
        strict: typeof F.functionModifiers;
    };
    readonly functionSignatureItem: typeof FR.functionSignatureItemFrom & {
        from: typeof FR.functionSignatureItemFrom;
        strict: typeof F.functionSignatureItem;
    };
    readonly functionType: typeof FR.functionTypeFrom & {
        from: typeof FR.functionTypeFrom;
        strict: typeof F.functionType;
    };
    readonly genBlock: typeof FR.genBlockFrom & {
        from: typeof FR.genBlockFrom;
        strict: typeof F.genBlock;
    };
    readonly genericFunction: typeof FR.genericFunctionFrom & {
        from: typeof FR.genericFunctionFrom;
        strict: typeof F.genericFunction;
    };
    readonly genericPattern: typeof FR.genericPatternFrom & {
        from: typeof FR.genericPatternFrom;
        strict: typeof F.genericPattern;
    };
    readonly genericType: typeof FR.genericTypeFrom & {
        from: typeof FR.genericTypeFrom;
        strict: typeof F.genericType;
    };
    readonly genericTypeWithTurbofish: typeof FR.genericTypeWithTurbofishFrom & {
        from: typeof FR.genericTypeWithTurbofishFrom;
        strict: typeof F.genericTypeWithTurbofish;
    };
    readonly higherRankedTraitBound: typeof FR.higherRankedTraitBoundFrom & {
        from: typeof FR.higherRankedTraitBoundFrom;
        strict: typeof F.higherRankedTraitBound;
    };
    readonly ifExpression: typeof FR.ifExpressionFrom & {
        from: typeof FR.ifExpressionFrom;
        strict: typeof F.ifExpression;
    };
    readonly implItemBody: typeof FR.implItemBodyFrom & {
        from: typeof FR.implItemBodyFrom;
        strict: typeof F.implItemBody;
    };
    readonly implItem: typeof FR.implItemFrom & {
        from: typeof FR.implItemFrom;
        strict: typeof F.implItem;
        body: typeof FR.implItemUFormBodyFrom & {
            from: typeof FR.implItemUFormBodyFrom;
            strict: typeof F.implItemUFormBody;
        };
        semi: typeof FR.implItemUFormSemiFrom & {
            from: typeof FR.implItemUFormSemiFrom;
            strict: typeof F.implItemUFormSemi;
        };
    };
    readonly indexExpression: typeof FR.indexExpressionFrom & {
        from: typeof FR.indexExpressionFrom;
        strict: typeof F.indexExpression;
    };
    readonly innerAttributeItem: typeof FR.innerAttributeItemFrom & {
        from: typeof FR.innerAttributeItemFrom;
        strict: typeof F.innerAttributeItem;
    };
    readonly label: typeof FR.labelFrom & {
        from: typeof FR.labelFrom;
        strict: typeof F.label;
    };
    readonly lastMatchArm: typeof FR.lastMatchArmFrom & {
        from: typeof FR.lastMatchArmFrom;
        strict: typeof F.lastMatchArm;
    };
    readonly letCondition: typeof FR.letConditionFrom & {
        from: typeof FR.letConditionFrom;
        strict: typeof F.letCondition;
    };
    readonly letDeclaration: typeof FR.letDeclarationFrom & {
        from: typeof FR.letDeclarationFrom;
        strict: typeof F.letDeclaration;
    };
    readonly lifetime: typeof FR.lifetimeFrom & {
        from: typeof FR.lifetimeFrom;
        strict: typeof F.lifetime;
    };
    readonly lifetimeParameter: typeof FR.lifetimeParameterFrom & {
        from: typeof FR.lifetimeParameterFrom;
        strict: typeof F.lifetimeParameter;
    };
    readonly lineComment: typeof FR.lineCommentFrom & {
        from: typeof FR.lineCommentFrom;
        strict: typeof F.lineComment;
        regularDslash: typeof FR.lineCommentUFormRegularDslashFrom & {
            from: typeof FR.lineCommentUFormRegularDslashFrom;
            strict: typeof F.lineCommentUFormRegularDslash;
        };
        regular_dslash: typeof FR.lineCommentUFormRegularDslashFrom & {
            from: typeof FR.lineCommentUFormRegularDslashFrom;
            strict: typeof F.lineCommentUFormRegularDslash;
        };
        doc: typeof FR.lineCommentUFormDocFrom & {
            from: typeof FR.lineCommentUFormDocFrom;
            strict: typeof F.lineCommentUFormDoc;
        };
        content: typeof FR.lineCommentUFormContentFrom & {
            from: typeof FR.lineCommentUFormContentFrom;
            strict: typeof F.lineCommentUFormContent;
        };
    };
    readonly loopExpression: typeof FR.loopExpressionFrom & {
        from: typeof FR.loopExpressionFrom;
        strict: typeof F.loopExpression;
    };
    readonly macroDefinitionParen: typeof FR.macroDefinitionParenFrom & {
        from: typeof FR.macroDefinitionParenFrom;
        strict: typeof F.macroDefinitionParen;
    };
    readonly macroDefinitionBracket: typeof FR.macroDefinitionBracketFrom & {
        from: typeof FR.macroDefinitionBracketFrom;
        strict: typeof F.macroDefinitionBracket;
    };
    readonly macroDefinitionBrace: typeof FR.macroDefinitionBraceFrom & {
        from: typeof FR.macroDefinitionBraceFrom;
        strict: typeof F.macroDefinitionBrace;
    };
    readonly macroDefinition: typeof FR.macroDefinitionFrom & {
        from: typeof FR.macroDefinitionFrom;
        strict: typeof F.macroDefinition;
        paren: typeof FR.macroDefinitionUFormParenFrom & {
            from: typeof FR.macroDefinitionUFormParenFrom;
            strict: typeof F.macroDefinitionUFormParen;
        };
        bracket: typeof FR.macroDefinitionUFormBracketFrom & {
            from: typeof FR.macroDefinitionUFormBracketFrom;
            strict: typeof F.macroDefinitionUFormBracket;
        };
        brace: typeof FR.macroDefinitionUFormBraceFrom & {
            from: typeof FR.macroDefinitionUFormBraceFrom;
            strict: typeof F.macroDefinitionUFormBrace;
        };
    };
    readonly macroInvocation: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
    readonly macroRule: typeof FR.macroRuleFrom & {
        from: typeof FR.macroRuleFrom;
        strict: typeof F.macroRule;
    };
    readonly matchArmBlockEnding: typeof FR.matchArmBlockEndingFrom & {
        from: typeof FR.matchArmBlockEndingFrom;
        strict: typeof F.matchArmBlockEnding;
    };
    readonly matchArm: typeof FR.matchArmFrom & {
        from: typeof FR.matchArmFrom;
        strict: typeof F.matchArm;
        withComma: typeof FR.matchArmUFormWithCommaFrom & {
            from: typeof FR.matchArmUFormWithCommaFrom;
            strict: typeof F.matchArmUFormWithComma;
        };
        with_comma: typeof FR.matchArmUFormWithCommaFrom & {
            from: typeof FR.matchArmUFormWithCommaFrom;
            strict: typeof F.matchArmUFormWithComma;
        };
        blockEnding: typeof FR.matchArmUFormBlockEndingFrom & {
            from: typeof FR.matchArmUFormBlockEndingFrom;
            strict: typeof F.matchArmUFormBlockEnding;
        };
        block_ending: typeof FR.matchArmUFormBlockEndingFrom & {
            from: typeof FR.matchArmUFormBlockEndingFrom;
            strict: typeof F.matchArmUFormBlockEnding;
        };
    };
    readonly matchBlock: typeof FR.matchBlockFrom & {
        from: typeof FR.matchBlockFrom;
        strict: typeof F.matchBlock;
    };
    readonly matchExpression: typeof FR.matchExpressionFrom & {
        from: typeof FR.matchExpressionFrom;
        strict: typeof F.matchExpression;
    };
    readonly matchPattern: typeof FR.matchPatternFrom & {
        from: typeof FR.matchPatternFrom;
        strict: typeof F.matchPattern;
    };
    readonly modItemInline: typeof FR.modItemInlineFrom & {
        from: typeof FR.modItemInlineFrom;
        strict: typeof F.modItemInline;
    };
    readonly modItem: typeof FR.modItemFrom & {
        from: typeof FR.modItemFrom;
        strict: typeof F.modItem;
        external: typeof FR.modItemUFormExternalFrom & {
            from: typeof FR.modItemUFormExternalFrom;
            strict: typeof F.modItemUFormExternal;
        };
        inline: typeof FR.modItemUFormInlineFrom & {
            from: typeof FR.modItemUFormInlineFrom;
            strict: typeof F.modItemUFormInline;
        };
    };
    readonly mutPattern: typeof FR.mutPatternFrom & {
        from: typeof FR.mutPatternFrom;
        strict: typeof F.mutPattern;
    };
    readonly negativeLiteral: typeof FR.negativeLiteralFrom & {
        from: typeof FR.negativeLiteralFrom;
        strict: typeof F.negativeLiteral;
    };
    readonly orPattern: typeof FR.orPatternFrom & {
        from: typeof FR.orPatternFrom;
        strict: typeof F.orPattern;
        binary: typeof FR.orPatternUFormBinaryFrom & {
            from: typeof FR.orPatternUFormBinaryFrom;
            strict: typeof F.orPatternUFormBinary;
        };
        prefix: typeof FR.orPatternUFormPrefixFrom & {
            from: typeof FR.orPatternUFormPrefixFrom;
            strict: typeof F.orPatternUFormPrefix;
        };
    };
    readonly orderedFieldDeclarationList: typeof FR.orderedFieldDeclarationListFrom & {
        from: typeof FR.orderedFieldDeclarationListFrom;
        strict: typeof F.orderedFieldDeclarationList;
    };
    readonly parameter: typeof FR.parameterFrom & {
        from: typeof FR.parameterFrom;
        strict: typeof F.parameter;
    };
    readonly parameters: typeof FR.parametersFrom & {
        from: typeof FR.parametersFrom;
        strict: typeof F.parameters;
    };
    readonly parenthesizedExpression: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
    };
    readonly pointerTypeMut: typeof FR.pointerTypeMutFrom & {
        from: typeof FR.pointerTypeMutFrom;
        strict: typeof F.pointerTypeMut;
    };
    readonly pointerType: typeof FR.pointerTypeFrom & {
        from: typeof FR.pointerTypeFrom;
        strict: typeof F.pointerType;
        const: typeof FR.pointerTypeUFormConstFrom & {
            from: typeof FR.pointerTypeUFormConstFrom;
            strict: typeof F.pointerTypeUFormConst;
        };
        mut: typeof FR.pointerTypeUFormMutFrom & {
            from: typeof FR.pointerTypeUFormMutFrom;
            strict: typeof F.pointerTypeUFormMut;
        };
    };
    readonly qualifiedType: typeof FR.qualifiedTypeFrom & {
        from: typeof FR.qualifiedTypeFrom;
        strict: typeof F.qualifiedType;
    };
    readonly rangeExpressionBare: typeof FR.rangeExpressionBareFrom & {
        from: typeof FR.rangeExpressionBareFrom;
        strict: typeof F.rangeExpressionBare;
    };
    readonly rangeExpression: typeof FR.rangeExpressionFrom & {
        from: typeof FR.rangeExpressionFrom;
        strict: typeof F.rangeExpression;
        binary: typeof FR.rangeExpressionUFormBinaryFrom & {
            from: typeof FR.rangeExpressionUFormBinaryFrom;
            strict: typeof F.rangeExpressionUFormBinary;
        };
        postfix: typeof FR.rangeExpressionUFormPostfixFrom & {
            from: typeof FR.rangeExpressionUFormPostfixFrom;
            strict: typeof F.rangeExpressionUFormPostfix;
        };
        prefix: typeof FR.rangeExpressionUFormPrefixFrom & {
            from: typeof FR.rangeExpressionUFormPrefixFrom;
            strict: typeof F.rangeExpressionUFormPrefix;
        };
        bare: typeof FR.rangeExpressionUFormBareFrom & {
            from: typeof FR.rangeExpressionUFormBareFrom;
            strict: typeof F.rangeExpressionUFormBare;
        };
    };
    readonly rangePattern: typeof FR.rangePatternFrom & {
        from: typeof FR.rangePatternFrom;
        strict: typeof F.rangePattern;
        prefix: typeof FR.rangePatternUFormPrefixFrom & {
            from: typeof FR.rangePatternUFormPrefixFrom;
            strict: typeof F.rangePatternUFormPrefix;
        };
        leftWithRight: typeof FR.rangePatternUFormLeftWithRightFrom & {
            from: typeof FR.rangePatternUFormLeftWithRightFrom;
            strict: typeof F.rangePatternUFormLeftWithRight;
        };
        left_with_right: typeof FR.rangePatternUFormLeftWithRightFrom & {
            from: typeof FR.rangePatternUFormLeftWithRightFrom;
            strict: typeof F.rangePatternUFormLeftWithRight;
        };
        leftBare: typeof FR.rangePatternUFormLeftBareFrom & {
            from: typeof FR.rangePatternUFormLeftBareFrom;
            strict: typeof F.rangePatternUFormLeftBare;
        };
        left_bare: typeof FR.rangePatternUFormLeftBareFrom & {
            from: typeof FR.rangePatternUFormLeftBareFrom;
            strict: typeof F.rangePatternUFormLeftBare;
        };
    };
    readonly rawStringLiteral: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly refPattern: typeof FR.refPatternFrom & {
        from: typeof FR.refPatternFrom;
        strict: typeof F.refPattern;
    };
    readonly referenceExpression: typeof FR.referenceExpressionFrom & {
        from: typeof FR.referenceExpressionFrom;
        strict: typeof F.referenceExpression;
    };
    readonly referencePattern: typeof FR.referencePatternFrom & {
        from: typeof FR.referencePatternFrom;
        strict: typeof F.referencePattern;
    };
    readonly referenceType: typeof FR.referenceTypeFrom & {
        from: typeof FR.referenceTypeFrom;
        strict: typeof F.referenceType;
    };
    readonly removedTraitBound: typeof FR.removedTraitBoundFrom & {
        from: typeof FR.removedTraitBoundFrom;
        strict: typeof F.removedTraitBound;
    };
    readonly returnExpression: typeof FR.returnExpressionFrom & {
        from: typeof FR.returnExpressionFrom;
        strict: typeof F.returnExpression;
    };
    readonly scopedIdentifier: typeof FR.scopedIdentifierFrom & {
        from: typeof FR.scopedIdentifierFrom;
        strict: typeof F.scopedIdentifier;
    };
    readonly scopedTypeIdentifier: typeof FR.scopedTypeIdentifierFrom & {
        from: typeof FR.scopedTypeIdentifierFrom;
        strict: typeof F.scopedTypeIdentifier;
    };
    readonly scopedTypeIdentifierInExpressionPosition: typeof FR.scopedTypeIdentifierInExpressionPositionFrom & {
        from: typeof FR.scopedTypeIdentifierInExpressionPositionFrom;
        strict: typeof F.scopedTypeIdentifierInExpressionPosition;
    };
    readonly scopedUseList: typeof FR.scopedUseListFrom & {
        from: typeof FR.scopedUseListFrom;
        strict: typeof F.scopedUseList;
    };
    readonly selfParameter: typeof FR.selfParameterFrom & {
        from: typeof FR.selfParameterFrom;
        strict: typeof F.selfParameter;
    };
    readonly shorthandFieldInitializer: typeof FR.shorthandFieldInitializerFrom & {
        from: typeof FR.shorthandFieldInitializerFrom;
        strict: typeof F.shorthandFieldInitializer;
    };
    readonly slicePattern: typeof FR.slicePatternFrom & {
        from: typeof FR.slicePatternFrom;
        strict: typeof F.slicePattern;
    };
    readonly sourceFile: typeof FR.sourceFileFrom & {
        from: typeof FR.sourceFileFrom;
        strict: typeof F.sourceFile;
    };
    readonly staticItem: typeof FR.staticItemFrom & {
        from: typeof FR.staticItemFrom;
        strict: typeof F.staticItem;
    };
    readonly stringLiteral: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly structExpression: typeof FR.structExpressionFrom & {
        from: typeof FR.structExpressionFrom;
        strict: typeof F.structExpression;
    };
    readonly structItem: typeof FR.structItemFrom & {
        from: typeof FR.structItemFrom;
        strict: typeof F.structItem;
        brace: typeof FR.structItemUFormBraceFrom & {
            from: typeof FR.structItemUFormBraceFrom;
            strict: typeof F.structItemUFormBrace;
        };
        tuple: typeof FR.structItemUFormTupleFrom & {
            from: typeof FR.structItemUFormTupleFrom;
            strict: typeof F.structItemUFormTuple;
        };
        unit: typeof FR.structItemUFormUnitFrom & {
            from: typeof FR.structItemUFormUnitFrom;
            strict: typeof F.structItemUFormUnit;
        };
    };
    readonly structPattern: typeof FR.structPatternFrom & {
        from: typeof FR.structPatternFrom;
        strict: typeof F.structPattern;
    };
    readonly tokenBindingPattern: typeof FR.tokenBindingPatternFrom & {
        from: typeof FR.tokenBindingPatternFrom;
        strict: typeof F.tokenBindingPattern;
    };
    readonly tokenRepetition: typeof FR.tokenRepetitionFrom & {
        from: typeof FR.tokenRepetitionFrom;
        strict: typeof F.tokenRepetition;
    };
    readonly tokenRepetitionPattern: typeof FR.tokenRepetitionPatternFrom & {
        from: typeof FR.tokenRepetitionPatternFrom;
        strict: typeof F.tokenRepetitionPattern;
    };
    readonly tokenTreeParen: typeof FR.tokenTreeParenFrom & {
        from: typeof FR.tokenTreeParenFrom;
        strict: typeof F.tokenTreeParen;
    };
    readonly tokenTreeBracket: typeof FR.tokenTreeBracketFrom & {
        from: typeof FR.tokenTreeBracketFrom;
        strict: typeof F.tokenTreeBracket;
    };
    readonly tokenTreeBrace: typeof FR.tokenTreeBraceFrom & {
        from: typeof FR.tokenTreeBraceFrom;
        strict: typeof F.tokenTreeBrace;
    };
    readonly tokenTree: typeof FR.tokenTreeFrom & {
        from: typeof FR.tokenTreeFrom;
        strict: typeof F.tokenTree;
        paren: typeof FR.tokenTreeUFormParenFrom & {
            from: typeof FR.tokenTreeUFormParenFrom;
            strict: typeof F.tokenTreeUFormParen;
        };
        bracket: typeof FR.tokenTreeUFormBracketFrom & {
            from: typeof FR.tokenTreeUFormBracketFrom;
            strict: typeof F.tokenTreeUFormBracket;
        };
        brace: typeof FR.tokenTreeUFormBraceFrom & {
            from: typeof FR.tokenTreeUFormBraceFrom;
            strict: typeof F.tokenTreeUFormBrace;
        };
    };
    readonly tokenTreePatternParen: typeof FR.tokenTreePatternParenFrom & {
        from: typeof FR.tokenTreePatternParenFrom;
        strict: typeof F.tokenTreePatternParen;
    };
    readonly tokenTreePatternBracket: typeof FR.tokenTreePatternBracketFrom & {
        from: typeof FR.tokenTreePatternBracketFrom;
        strict: typeof F.tokenTreePatternBracket;
    };
    readonly tokenTreePatternBrace: typeof FR.tokenTreePatternBraceFrom & {
        from: typeof FR.tokenTreePatternBraceFrom;
        strict: typeof F.tokenTreePatternBrace;
    };
    readonly tokenTreePattern: typeof FR.tokenTreePatternFrom & {
        from: typeof FR.tokenTreePatternFrom;
        strict: typeof F.tokenTreePattern;
        paren: typeof FR.tokenTreePatternUFormParenFrom & {
            from: typeof FR.tokenTreePatternUFormParenFrom;
            strict: typeof F.tokenTreePatternUFormParen;
        };
        bracket: typeof FR.tokenTreePatternUFormBracketFrom & {
            from: typeof FR.tokenTreePatternUFormBracketFrom;
            strict: typeof F.tokenTreePatternUFormBracket;
        };
        brace: typeof FR.tokenTreePatternUFormBraceFrom & {
            from: typeof FR.tokenTreePatternUFormBraceFrom;
            strict: typeof F.tokenTreePatternUFormBrace;
        };
    };
    readonly traitBounds: typeof FR.traitBoundsFrom & {
        from: typeof FR.traitBoundsFrom;
        strict: typeof F.traitBounds;
    };
    readonly traitItem: typeof FR.traitItemFrom & {
        from: typeof FR.traitItemFrom;
        strict: typeof F.traitItem;
    };
    readonly tryBlock: typeof FR.tryBlockFrom & {
        from: typeof FR.tryBlockFrom;
        strict: typeof F.tryBlock;
    };
    readonly tryExpression: typeof FR.tryExpressionFrom & {
        from: typeof FR.tryExpressionFrom;
        strict: typeof F.tryExpression;
    };
    readonly tupleExpression: typeof FR.tupleExpressionFrom & {
        from: typeof FR.tupleExpressionFrom;
        strict: typeof F.tupleExpression;
    };
    readonly tuplePattern: typeof FR.tuplePatternFrom & {
        from: typeof FR.tuplePatternFrom;
        strict: typeof F.tuplePattern;
    };
    readonly tupleStructPattern: typeof FR.tupleStructPatternFrom & {
        from: typeof FR.tupleStructPatternFrom;
        strict: typeof F.tupleStructPattern;
    };
    readonly tupleType: typeof FR.tupleTypeFrom & {
        from: typeof FR.tupleTypeFrom;
        strict: typeof F.tupleType;
    };
    readonly typeArguments: typeof FR.typeArgumentsFrom & {
        from: typeof FR.typeArgumentsFrom;
        strict: typeof F.typeArguments;
    };
    readonly typeBinding: typeof FR.typeBindingFrom & {
        from: typeof FR.typeBindingFrom;
        strict: typeof F.typeBinding;
    };
    readonly typeCastExpression: typeof FR.typeCastExpressionFrom & {
        from: typeof FR.typeCastExpressionFrom;
        strict: typeof F.typeCastExpression;
    };
    readonly typeItem: typeof FR.typeItemFrom & {
        from: typeof FR.typeItemFrom;
        strict: typeof F.typeItem;
    };
    readonly typeParameter: typeof FR.typeParameterFrom & {
        from: typeof FR.typeParameterFrom;
        strict: typeof F.typeParameter;
    };
    readonly typeParameters: typeof FR.typeParametersFrom & {
        from: typeof FR.typeParametersFrom;
        strict: typeof F.typeParameters;
    };
    readonly unaryExpression: typeof FR.unaryExpressionFrom & {
        from: typeof FR.unaryExpressionFrom;
        strict: typeof F.unaryExpression;
    };
    readonly unionItem: typeof FR.unionItemFrom & {
        from: typeof FR.unionItemFrom;
        strict: typeof F.unionItem;
    };
    readonly unsafeBlock: typeof FR.unsafeBlockFrom & {
        from: typeof FR.unsafeBlockFrom;
        strict: typeof F.unsafeBlock;
    };
    readonly useAsClause: typeof FR.useAsClauseFrom & {
        from: typeof FR.useAsClauseFrom;
        strict: typeof F.useAsClause;
    };
    readonly useBounds: typeof FR.useBoundsFrom & {
        from: typeof FR.useBoundsFrom;
        strict: typeof F.useBounds;
    };
    readonly useDeclaration: typeof FR.useDeclarationFrom & {
        from: typeof FR.useDeclarationFrom;
        strict: typeof F.useDeclaration;
    };
    readonly useList: typeof FR.useListFrom & {
        from: typeof FR.useListFrom;
        strict: typeof F.useList;
    };
    readonly useWildcard: typeof FR.useWildcardFrom & {
        from: typeof FR.useWildcardFrom;
        strict: typeof F.useWildcard;
    };
    readonly variadicParameter: typeof FR.variadicParameterFrom & {
        from: typeof FR.variadicParameterFrom;
        strict: typeof F.variadicParameter;
    };
    readonly visibilityModifierCrate: typeof FR.visibilityModifierCrateFrom & {
        from: typeof FR.visibilityModifierCrateFrom;
        strict: typeof F.visibilityModifierCrate;
    };
    readonly visibilityModifier: typeof FR.visibilityModifierFrom & {
        from: typeof FR.visibilityModifierFrom;
        strict: typeof F.visibilityModifier;
        crate: typeof FR.visibilityModifierUFormCrateFrom & {
            from: typeof FR.visibilityModifierUFormCrateFrom;
            strict: typeof F.visibilityModifierUFormCrate;
        };
        pub: typeof FR.visibilityModifierUFormPubFrom & {
            from: typeof FR.visibilityModifierUFormPubFrom;
            strict: typeof F.visibilityModifierUFormPub;
        };
        inPath: typeof FR.visibilityModifierUFormInPathFrom & {
            from: typeof FR.visibilityModifierUFormInPathFrom;
            strict: typeof F.visibilityModifierUFormInPath;
        };
        in_path: typeof FR.visibilityModifierUFormInPathFrom & {
            from: typeof FR.visibilityModifierUFormInPathFrom;
            strict: typeof F.visibilityModifierUFormInPath;
        };
    };
    readonly whereClause: typeof FR.whereClauseFrom & {
        from: typeof FR.whereClauseFrom;
        strict: typeof F.whereClause;
    };
    readonly wherePredicate: typeof FR.wherePredicateFrom & {
        from: typeof FR.wherePredicateFrom;
        strict: typeof F.wherePredicate;
    };
    readonly whileExpression: typeof FR.whileExpressionFrom & {
        from: typeof FR.whileExpressionFrom;
        strict: typeof F.whileExpression;
    };
    readonly yieldExpression: typeof FR.yieldExpressionFrom & {
        from: typeof FR.yieldExpressionFrom;
        strict: typeof F.yieldExpression;
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
    readonly unitExpression: typeof F.unitExpression;
    readonly unitType: typeof F.unitType;
    readonly stringContent: typeof F.stringContent;
    readonly rawStringLiteralContent: typeof F.rawStringLiteralContent;
    readonly floatLiteral: typeof F.floatLiteral;
    readonly abstract: typeof FR.abstractTypeFrom & {
        from: typeof FR.abstractTypeFrom;
        strict: typeof F.abstractType;
    };
    readonly array: typeof FR.arrayExpressionFrom & {
        from: typeof FR.arrayExpressionFrom;
        strict: typeof F.arrayExpression;
        semi: typeof FR.arrayExpressionUFormSemiFrom & {
            from: typeof FR.arrayExpressionUFormSemiFrom;
            strict: typeof F.arrayExpressionUFormSemi;
        };
        list: typeof FR.arrayExpressionUFormListFrom & {
            from: typeof FR.arrayExpressionUFormListFrom;
            strict: typeof F.arrayExpressionUFormList;
        };
    };
    readonly assignment: typeof FR.assignmentExpressionFrom & {
        from: typeof FR.assignmentExpressionFrom;
        strict: typeof F.assignmentExpression;
    };
    readonly associated: typeof FR.associatedTypeFrom & {
        from: typeof FR.associatedTypeFrom;
        strict: typeof F.associatedType;
    };
    readonly async: typeof FR.asyncBlockFrom & {
        from: typeof FR.asyncBlockFrom;
        strict: typeof F.asyncBlock;
    };
    readonly await: typeof FR.awaitExpressionFrom & {
        from: typeof FR.awaitExpressionFrom;
        strict: typeof F.awaitExpression;
    };
    readonly binary: typeof FR.binaryExpressionFrom & {
        from: typeof FR.binaryExpressionFrom;
        strict: typeof F.binaryExpression;
    };
    readonly boolean: typeof F.booleanLiteral;
    readonly bounded: typeof FR.boundedTypeFrom & {
        from: typeof FR.boundedTypeFrom;
        strict: typeof F.boundedType;
    };
    readonly break: typeof FR.breakExpressionFrom & {
        from: typeof FR.breakExpressionFrom;
        strict: typeof F.breakExpression;
    };
    readonly call: typeof FR.callExpressionFrom & {
        from: typeof FR.callExpressionFrom;
        strict: typeof F.callExpression;
    };
    readonly captured: typeof FR.capturedPatternFrom & {
        from: typeof FR.capturedPatternFrom;
        strict: typeof F.capturedPattern;
    };
    readonly char: typeof F.charLiteral;
    readonly closure: typeof FR.closureExpressionFrom & {
        from: typeof FR.closureExpressionFrom;
        strict: typeof F.closureExpression;
        block: typeof FR.closureExpressionUFormBlockFrom & {
            from: typeof FR.closureExpressionUFormBlockFrom;
            strict: typeof F.closureExpressionUFormBlock;
        };
        expr: typeof FR.closureExpressionUFormExprFrom & {
            from: typeof FR.closureExpressionUFormExprFrom;
            strict: typeof F.closureExpressionUFormExpr;
        };
    };
    readonly compoundAssignment: typeof FR.compoundAssignmentExprFrom & {
        from: typeof FR.compoundAssignmentExprFrom;
        strict: typeof F.compoundAssignmentExpr;
    };
    readonly const: typeof FR.constBlockFrom & {
        from: typeof FR.constBlockFrom;
        strict: typeof F.constBlock;
    };
    readonly continue: typeof FR.continueExpressionFrom & {
        from: typeof FR.continueExpressionFrom;
        strict: typeof F.continueExpression;
    };
    readonly delimToken: typeof FR.delimTokenTreeFrom & {
        from: typeof FR.delimTokenTreeFrom;
        strict: typeof F.delimTokenTree;
        paren: typeof FR.delimTokenTreeUFormParenFrom & {
            from: typeof FR.delimTokenTreeUFormParenFrom;
            strict: typeof F.delimTokenTreeUFormParen;
        };
        bracket: typeof FR.delimTokenTreeUFormBracketFrom & {
            from: typeof FR.delimTokenTreeUFormBracketFrom;
            strict: typeof F.delimTokenTreeUFormBracket;
        };
        brace: typeof FR.delimTokenTreeUFormBraceFrom & {
            from: typeof FR.delimTokenTreeUFormBraceFrom;
            strict: typeof F.delimTokenTreeUFormBrace;
        };
    };
    readonly dynamic: typeof FR.dynamicTypeFrom & {
        from: typeof FR.dynamicTypeFrom;
        strict: typeof F.dynamicType;
    };
    readonly enum: typeof FR.enumItemFrom & {
        from: typeof FR.enumItemFrom;
        strict: typeof F.enumItem;
    };
    readonly externCrate: typeof FR.externCrateDeclarationFrom & {
        from: typeof FR.externCrateDeclarationFrom;
        strict: typeof F.externCrateDeclaration;
    };
    readonly field: typeof FR.fieldExpressionFrom & {
        from: typeof FR.fieldExpressionFrom;
        strict: typeof F.fieldExpression;
    };
    readonly float: typeof F.floatLiteral;
    readonly for: typeof FR.forExpressionFrom & {
        from: typeof FR.forExpressionFrom;
        strict: typeof F.forExpression;
    };
    readonly foreignMod: typeof FR.foreignModItemFrom & {
        from: typeof FR.foreignModItemFrom;
        strict: typeof F.foreignModItem;
        semi: typeof FR.foreignModItemUFormSemiFrom & {
            from: typeof FR.foreignModItemUFormSemiFrom;
            strict: typeof F.foreignModItemUFormSemi;
        };
        body: typeof FR.foreignModItemUFormBodyFrom & {
            from: typeof FR.foreignModItemUFormBodyFrom;
            strict: typeof F.foreignModItemUFormBody;
        };
    };
    readonly function: typeof FR.functionItemFrom & {
        from: typeof FR.functionItemFrom;
        strict: typeof F.functionItem;
    };
    readonly functionSignature: typeof FR.functionSignatureItemFrom & {
        from: typeof FR.functionSignatureItemFrom;
        strict: typeof F.functionSignatureItem;
    };
    readonly gen: typeof FR.genBlockFrom & {
        from: typeof FR.genBlockFrom;
        strict: typeof F.genBlock;
    };
    readonly generic: typeof FR.genericFunctionFrom & {
        from: typeof FR.genericFunctionFrom;
        strict: typeof F.genericFunction;
    };
    readonly if: typeof FR.ifExpressionFrom & {
        from: typeof FR.ifExpressionFrom;
        strict: typeof F.ifExpression;
    };
    readonly impl: typeof FR.implItemFrom & {
        from: typeof FR.implItemFrom;
        strict: typeof F.implItem;
        body: typeof FR.implItemUFormBodyFrom & {
            from: typeof FR.implItemUFormBodyFrom;
            strict: typeof F.implItemUFormBody;
        };
        semi: typeof FR.implItemUFormSemiFrom & {
            from: typeof FR.implItemUFormSemiFrom;
            strict: typeof F.implItemUFormSemi;
        };
    };
    readonly index: typeof FR.indexExpressionFrom & {
        from: typeof FR.indexExpressionFrom;
        strict: typeof F.indexExpression;
    };
    readonly innerAttribute: typeof FR.innerAttributeItemFrom & {
        from: typeof FR.innerAttributeItemFrom;
        strict: typeof F.innerAttributeItem;
    };
    readonly integer: typeof F.integerLiteral;
    readonly let: typeof FR.letConditionFrom & {
        from: typeof FR.letConditionFrom;
        strict: typeof F.letCondition;
    };
    readonly loop: typeof FR.loopExpressionFrom & {
        from: typeof FR.loopExpressionFrom;
        strict: typeof F.loopExpression;
    };
    readonly macro: typeof FR.macroInvocationFrom & {
        from: typeof FR.macroInvocationFrom;
        strict: typeof F.macroInvocation;
    };
    readonly match: typeof FR.matchExpressionFrom & {
        from: typeof FR.matchExpressionFrom;
        strict: typeof F.matchExpression;
    };
    readonly mod: typeof FR.modItemFrom & {
        from: typeof FR.modItemFrom;
        strict: typeof F.modItem;
        external: typeof FR.modItemUFormExternalFrom & {
            from: typeof FR.modItemUFormExternalFrom;
            strict: typeof F.modItemUFormExternal;
        };
        inline: typeof FR.modItemUFormInlineFrom & {
            from: typeof FR.modItemUFormInlineFrom;
            strict: typeof F.modItemUFormInline;
        };
    };
    readonly mut: typeof FR.mutPatternFrom & {
        from: typeof FR.mutPatternFrom;
        strict: typeof F.mutPattern;
    };
    readonly mutable: typeof F.mutableSpecifier;
    readonly negative: typeof FR.negativeLiteralFrom & {
        from: typeof FR.negativeLiteralFrom;
        strict: typeof F.negativeLiteral;
    };
    readonly or: typeof FR.orPatternFrom & {
        from: typeof FR.orPatternFrom;
        strict: typeof F.orPattern;
        binary: typeof FR.orPatternUFormBinaryFrom & {
            from: typeof FR.orPatternUFormBinaryFrom;
            strict: typeof F.orPatternUFormBinary;
        };
        prefix: typeof FR.orPatternUFormPrefixFrom & {
            from: typeof FR.orPatternUFormPrefixFrom;
            strict: typeof F.orPatternUFormPrefix;
        };
    };
    readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
        from: typeof FR.parenthesizedExpressionFrom;
        strict: typeof F.parenthesizedExpression;
    };
    readonly pointer: typeof FR.pointerTypeFrom & {
        from: typeof FR.pointerTypeFrom;
        strict: typeof F.pointerType;
        const: typeof FR.pointerTypeUFormConstFrom & {
            from: typeof FR.pointerTypeUFormConstFrom;
            strict: typeof F.pointerTypeUFormConst;
        };
        mut: typeof FR.pointerTypeUFormMutFrom & {
            from: typeof FR.pointerTypeUFormMutFrom;
            strict: typeof F.pointerTypeUFormMut;
        };
    };
    readonly range: typeof FR.rangeExpressionFrom & {
        from: typeof FR.rangeExpressionFrom;
        strict: typeof F.rangeExpression;
        binary: typeof FR.rangeExpressionUFormBinaryFrom & {
            from: typeof FR.rangeExpressionUFormBinaryFrom;
            strict: typeof F.rangeExpressionUFormBinary;
        };
        postfix: typeof FR.rangeExpressionUFormPostfixFrom & {
            from: typeof FR.rangeExpressionUFormPostfixFrom;
            strict: typeof F.rangeExpressionUFormPostfix;
        };
        prefix: typeof FR.rangeExpressionUFormPrefixFrom & {
            from: typeof FR.rangeExpressionUFormPrefixFrom;
            strict: typeof F.rangeExpressionUFormPrefix;
        };
        bare: typeof FR.rangeExpressionUFormBareFrom & {
            from: typeof FR.rangeExpressionUFormBareFrom;
            strict: typeof F.rangeExpressionUFormBare;
        };
    };
    readonly rawString: typeof FR.rawStringLiteralFrom & {
        from: typeof FR.rawStringLiteralFrom;
        strict: typeof F.rawStringLiteral;
    };
    readonly ref: typeof FR.refPatternFrom & {
        from: typeof FR.refPatternFrom;
        strict: typeof F.refPattern;
    };
    readonly reference: typeof FR.referenceExpressionFrom & {
        from: typeof FR.referenceExpressionFrom;
        strict: typeof F.referenceExpression;
    };
    readonly removedTrait: typeof FR.removedTraitBoundFrom & {
        from: typeof FR.removedTraitBoundFrom;
        strict: typeof F.removedTraitBound;
    };
    readonly return: typeof FR.returnExpressionFrom & {
        from: typeof FR.returnExpressionFrom;
        strict: typeof F.returnExpression;
    };
    readonly scoped: typeof FR.scopedIdentifierFrom & {
        from: typeof FR.scopedIdentifierFrom;
        strict: typeof F.scopedIdentifier;
    };
    readonly scopedType: typeof FR.scopedTypeIdentifierFrom & {
        from: typeof FR.scopedTypeIdentifierFrom;
        strict: typeof F.scopedTypeIdentifier;
    };
    readonly scopedUse: typeof FR.scopedUseListFrom & {
        from: typeof FR.scopedUseListFrom;
        strict: typeof F.scopedUseList;
    };
    readonly slice: typeof FR.slicePatternFrom & {
        from: typeof FR.slicePatternFrom;
        strict: typeof F.slicePattern;
    };
    readonly static: typeof FR.staticItemFrom & {
        from: typeof FR.staticItemFrom;
        strict: typeof F.staticItem;
    };
    readonly string: typeof FR.stringLiteralFrom & {
        from: typeof FR.stringLiteralFrom;
        strict: typeof F.stringLiteral;
    };
    readonly struct: typeof FR.structExpressionFrom & {
        from: typeof FR.structExpressionFrom;
        strict: typeof F.structExpression;
    };
    readonly token: typeof FR.tokenTreeFrom & {
        from: typeof FR.tokenTreeFrom;
        strict: typeof F.tokenTree;
        paren: typeof FR.tokenTreeUFormParenFrom & {
            from: typeof FR.tokenTreeUFormParenFrom;
            strict: typeof F.tokenTreeUFormParen;
        };
        bracket: typeof FR.tokenTreeUFormBracketFrom & {
            from: typeof FR.tokenTreeUFormBracketFrom;
            strict: typeof F.tokenTreeUFormBracket;
        };
        brace: typeof FR.tokenTreeUFormBraceFrom & {
            from: typeof FR.tokenTreeUFormBraceFrom;
            strict: typeof F.tokenTreeUFormBrace;
        };
    };
    readonly tokenBinding: typeof FR.tokenBindingPatternFrom & {
        from: typeof FR.tokenBindingPatternFrom;
        strict: typeof F.tokenBindingPattern;
    };
    readonly trait: typeof FR.traitItemFrom & {
        from: typeof FR.traitItemFrom;
        strict: typeof F.traitItem;
    };
    readonly try: typeof FR.tryExpressionFrom & {
        from: typeof FR.tryExpressionFrom;
        strict: typeof F.tryExpression;
    };
    readonly tuple: typeof FR.tupleExpressionFrom & {
        from: typeof FR.tupleExpressionFrom;
        strict: typeof F.tupleExpression;
    };
    readonly tupleStruct: typeof FR.tupleStructPatternFrom & {
        from: typeof FR.tupleStructPatternFrom;
        strict: typeof F.tupleStructPattern;
    };
    readonly typeCast: typeof FR.typeCastExpressionFrom & {
        from: typeof FR.typeCastExpressionFrom;
        strict: typeof F.typeCastExpression;
    };
    readonly unary: typeof FR.unaryExpressionFrom & {
        from: typeof FR.unaryExpressionFrom;
        strict: typeof F.unaryExpression;
    };
    readonly union: typeof FR.unionItemFrom & {
        from: typeof FR.unionItemFrom;
        strict: typeof F.unionItem;
    };
    readonly unit: typeof F.unitExpression;
    readonly unsafe: typeof FR.unsafeBlockFrom & {
        from: typeof FR.unsafeBlockFrom;
        strict: typeof F.unsafeBlock;
    };
    readonly use: typeof FR.useDeclarationFrom & {
        from: typeof FR.useDeclarationFrom;
        strict: typeof F.useDeclaration;
    };
    readonly useAs: typeof FR.useAsClauseFrom & {
        from: typeof FR.useAsClauseFrom;
        strict: typeof F.useAsClause;
    };
    readonly while: typeof FR.whileExpressionFrom & {
        from: typeof FR.whileExpressionFrom;
        strict: typeof F.whileExpression;
    };
    readonly yield: typeof FR.yieldExpressionFrom & {
        from: typeof FR.yieldExpressionFrom;
        strict: typeof F.yieldExpression;
    };
    readonly condition: {
        readonly unary: typeof FR.unaryExpressionFrom & {
            from: typeof FR.unaryExpressionFrom;
            strict: typeof F.unaryExpression;
        };
        readonly reference: typeof FR.referenceExpressionFrom & {
            from: typeof FR.referenceExpressionFrom;
            strict: typeof F.referenceExpression;
        };
        readonly try: typeof FR.tryExpressionFrom & {
            from: typeof FR.tryExpressionFrom;
            strict: typeof F.tryExpression;
        };
        readonly binary: typeof FR.binaryExpressionFrom & {
            from: typeof FR.binaryExpressionFrom;
            strict: typeof F.binaryExpression;
        };
        readonly assignment: typeof FR.assignmentExpressionFrom & {
            from: typeof FR.assignmentExpressionFrom;
            strict: typeof F.assignmentExpression;
        };
        readonly compoundAssignment: typeof FR.compoundAssignmentExprFrom & {
            from: typeof FR.compoundAssignmentExprFrom;
            strict: typeof F.compoundAssignmentExpr;
        };
        readonly typeCast: typeof FR.typeCastExpressionFrom & {
            from: typeof FR.typeCastExpressionFrom;
            strict: typeof F.typeCastExpression;
        };
        readonly call: typeof FR.callExpressionFrom & {
            from: typeof FR.callExpressionFrom;
            strict: typeof F.callExpression;
        };
        readonly return: typeof FR.returnExpressionFrom & {
            from: typeof FR.returnExpressionFrom;
            strict: typeof F.returnExpression;
        };
        readonly yield: typeof FR.yieldExpressionFrom & {
            from: typeof FR.yieldExpressionFrom;
            strict: typeof F.yieldExpression;
        };
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly self: typeof F.self;
        readonly scoped: typeof FR.scopedIdentifierFrom & {
            from: typeof FR.scopedIdentifierFrom;
            strict: typeof F.scopedIdentifier;
        };
        readonly generic: typeof FR.genericFunctionFrom & {
            from: typeof FR.genericFunctionFrom;
            strict: typeof F.genericFunction;
        };
        readonly await: typeof FR.awaitExpressionFrom & {
            from: typeof FR.awaitExpressionFrom;
            strict: typeof F.awaitExpression;
        };
        readonly field: typeof FR.fieldExpressionFrom & {
            from: typeof FR.fieldExpressionFrom;
            strict: typeof F.fieldExpression;
        };
        readonly array: typeof FR.arrayExpressionFrom & {
            from: typeof FR.arrayExpressionFrom;
            strict: typeof F.arrayExpression;
            semi: typeof FR.arrayExpressionUFormSemiFrom & {
                from: typeof FR.arrayExpressionUFormSemiFrom;
                strict: typeof F.arrayExpressionUFormSemi;
            };
            list: typeof FR.arrayExpressionUFormListFrom & {
                from: typeof FR.arrayExpressionUFormListFrom;
                strict: typeof F.arrayExpressionUFormList;
            };
        };
        readonly tuple: typeof FR.tupleExpressionFrom & {
            from: typeof FR.tupleExpressionFrom;
            strict: typeof F.tupleExpression;
        };
        readonly macro: typeof FR.macroInvocationFrom & {
            from: typeof FR.macroInvocationFrom;
            strict: typeof F.macroInvocation;
        };
        readonly unit: typeof F.unitExpression;
        readonly break: typeof FR.breakExpressionFrom & {
            from: typeof FR.breakExpressionFrom;
            strict: typeof F.breakExpression;
        };
        readonly continue: typeof FR.continueExpressionFrom & {
            from: typeof FR.continueExpressionFrom;
            strict: typeof F.continueExpression;
        };
        readonly index: typeof FR.indexExpressionFrom & {
            from: typeof FR.indexExpressionFrom;
            strict: typeof F.indexExpression;
        };
        readonly metavariable: typeof F.metavariable;
        readonly closure: typeof FR.closureExpressionFrom & {
            from: typeof FR.closureExpressionFrom;
            strict: typeof F.closureExpression;
            block: typeof FR.closureExpressionUFormBlockFrom & {
                from: typeof FR.closureExpressionUFormBlockFrom;
                strict: typeof F.closureExpressionUFormBlock;
            };
            expr: typeof FR.closureExpressionUFormExprFrom & {
                from: typeof FR.closureExpressionUFormExprFrom;
                strict: typeof F.closureExpressionUFormExpr;
            };
        };
        readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
            from: typeof FR.parenthesizedExpressionFrom;
            strict: typeof F.parenthesizedExpression;
        };
        readonly struct: typeof FR.structExpressionFrom & {
            from: typeof FR.structExpressionFrom;
            strict: typeof F.structExpression;
        };
        readonly unsafe: typeof FR.unsafeBlockFrom & {
            from: typeof FR.unsafeBlockFrom;
            strict: typeof F.unsafeBlock;
        };
        readonly async: typeof FR.asyncBlockFrom & {
            from: typeof FR.asyncBlockFrom;
            strict: typeof F.asyncBlock;
        };
        readonly gen: typeof FR.genBlockFrom & {
            from: typeof FR.genBlockFrom;
            strict: typeof F.genBlock;
        };
        readonly block: typeof FR.blockFrom & {
            from: typeof FR.blockFrom;
            strict: typeof F.block;
        };
        readonly if: typeof FR.ifExpressionFrom & {
            from: typeof FR.ifExpressionFrom;
            strict: typeof F.ifExpression;
        };
        readonly match: typeof FR.matchExpressionFrom & {
            from: typeof FR.matchExpressionFrom;
            strict: typeof F.matchExpression;
        };
        readonly while: typeof FR.whileExpressionFrom & {
            from: typeof FR.whileExpressionFrom;
            strict: typeof F.whileExpression;
        };
        readonly loop: typeof FR.loopExpressionFrom & {
            from: typeof FR.loopExpressionFrom;
            strict: typeof F.loopExpression;
        };
        readonly for: typeof FR.forExpressionFrom & {
            from: typeof FR.forExpressionFrom;
            strict: typeof F.forExpression;
        };
        readonly const: typeof FR.constBlockFrom & {
            from: typeof FR.constBlockFrom;
            strict: typeof F.constBlock;
        };
        readonly range: typeof FR.rangeExpressionFrom & {
            from: typeof FR.rangeExpressionFrom;
            strict: typeof F.rangeExpression;
            binary: typeof FR.rangeExpressionUFormBinaryFrom & {
                from: typeof FR.rangeExpressionUFormBinaryFrom;
                strict: typeof F.rangeExpressionUFormBinary;
            };
            postfix: typeof FR.rangeExpressionUFormPostfixFrom & {
                from: typeof FR.rangeExpressionUFormPostfixFrom;
                strict: typeof F.rangeExpressionUFormPostfix;
            };
            prefix: typeof FR.rangeExpressionUFormPrefixFrom & {
                from: typeof FR.rangeExpressionUFormPrefixFrom;
                strict: typeof F.rangeExpressionUFormPrefix;
            };
            bare: typeof FR.rangeExpressionUFormBareFrom & {
                from: typeof FR.rangeExpressionUFormBareFrom;
                strict: typeof F.rangeExpressionUFormBare;
            };
        };
        readonly let: typeof FR.letConditionFrom & {
            from: typeof FR.letConditionFrom;
            strict: typeof F.letCondition;
        };
    };
    readonly declarationStatement: {
        readonly const: typeof FR.constItemFrom & {
            from: typeof FR.constItemFrom;
            strict: typeof F.constItem;
        };
        readonly macro: typeof FR.macroInvocationFrom & {
            from: typeof FR.macroInvocationFrom;
            strict: typeof F.macroInvocation;
        };
        readonly attribute: typeof FR.attributeItemFrom & {
            from: typeof FR.attributeItemFrom;
            strict: typeof F.attributeItem;
        };
        readonly innerAttribute: typeof FR.innerAttributeItemFrom & {
            from: typeof FR.innerAttributeItemFrom;
            strict: typeof F.innerAttributeItem;
        };
        readonly mod: typeof FR.modItemFrom & {
            from: typeof FR.modItemFrom;
            strict: typeof F.modItem;
            external: typeof FR.modItemUFormExternalFrom & {
                from: typeof FR.modItemUFormExternalFrom;
                strict: typeof F.modItemUFormExternal;
            };
            inline: typeof FR.modItemUFormInlineFrom & {
                from: typeof FR.modItemUFormInlineFrom;
                strict: typeof F.modItemUFormInline;
            };
        };
        readonly foreignMod: typeof FR.foreignModItemFrom & {
            from: typeof FR.foreignModItemFrom;
            strict: typeof F.foreignModItem;
            semi: typeof FR.foreignModItemUFormSemiFrom & {
                from: typeof FR.foreignModItemUFormSemiFrom;
                strict: typeof F.foreignModItemUFormSemi;
            };
            body: typeof FR.foreignModItemUFormBodyFrom & {
                from: typeof FR.foreignModItemUFormBodyFrom;
                strict: typeof F.foreignModItemUFormBody;
            };
        };
        readonly struct: typeof FR.structItemFrom & {
            from: typeof FR.structItemFrom;
            strict: typeof F.structItem;
            brace: typeof FR.structItemUFormBraceFrom & {
                from: typeof FR.structItemUFormBraceFrom;
                strict: typeof F.structItemUFormBrace;
            };
            tuple: typeof FR.structItemUFormTupleFrom & {
                from: typeof FR.structItemUFormTupleFrom;
                strict: typeof F.structItemUFormTuple;
            };
            unit: typeof FR.structItemUFormUnitFrom & {
                from: typeof FR.structItemUFormUnitFrom;
                strict: typeof F.structItemUFormUnit;
            };
        };
        readonly union: typeof FR.unionItemFrom & {
            from: typeof FR.unionItemFrom;
            strict: typeof F.unionItem;
        };
        readonly enum: typeof FR.enumItemFrom & {
            from: typeof FR.enumItemFrom;
            strict: typeof F.enumItem;
        };
        readonly type: typeof FR.typeItemFrom & {
            from: typeof FR.typeItemFrom;
            strict: typeof F.typeItem;
        };
        readonly function: typeof FR.functionItemFrom & {
            from: typeof FR.functionItemFrom;
            strict: typeof F.functionItem;
        };
        readonly functionSignature: typeof FR.functionSignatureItemFrom & {
            from: typeof FR.functionSignatureItemFrom;
            strict: typeof F.functionSignatureItem;
        };
        readonly impl: typeof FR.implItemFrom & {
            from: typeof FR.implItemFrom;
            strict: typeof F.implItem;
            body: typeof FR.implItemUFormBodyFrom & {
                from: typeof FR.implItemUFormBodyFrom;
                strict: typeof F.implItemUFormBody;
            };
            semi: typeof FR.implItemUFormSemiFrom & {
                from: typeof FR.implItemUFormSemiFrom;
                strict: typeof F.implItemUFormSemi;
            };
        };
        readonly trait: typeof FR.traitItemFrom & {
            from: typeof FR.traitItemFrom;
            strict: typeof F.traitItem;
        };
        readonly associated: typeof FR.associatedTypeFrom & {
            from: typeof FR.associatedTypeFrom;
            strict: typeof F.associatedType;
        };
        readonly let: typeof FR.letDeclarationFrom & {
            from: typeof FR.letDeclarationFrom;
            strict: typeof F.letDeclaration;
        };
        readonly use: typeof FR.useDeclarationFrom & {
            from: typeof FR.useDeclarationFrom;
            strict: typeof F.useDeclaration;
        };
        readonly externCrate: typeof FR.externCrateDeclarationFrom & {
            from: typeof FR.externCrateDeclarationFrom;
            strict: typeof F.externCrateDeclaration;
        };
        readonly static: typeof FR.staticItemFrom & {
            from: typeof FR.staticItemFrom;
            strict: typeof F.staticItem;
        };
    };
    readonly delimTokens: {
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly mutable: typeof F.mutableSpecifier;
        readonly self: typeof F.self;
        readonly super: typeof F.super_;
        readonly crate: typeof F.crate;
        readonly delimToken: typeof FR.delimTokenTreeFrom & {
            from: typeof FR.delimTokenTreeFrom;
            strict: typeof F.delimTokenTree;
            paren: typeof FR.delimTokenTreeUFormParenFrom & {
                from: typeof FR.delimTokenTreeUFormParenFrom;
                strict: typeof F.delimTokenTreeUFormParen;
            };
            bracket: typeof FR.delimTokenTreeUFormBracketFrom & {
                from: typeof FR.delimTokenTreeUFormBracketFrom;
                strict: typeof F.delimTokenTreeUFormBracket;
            };
            brace: typeof FR.delimTokenTreeUFormBraceFrom & {
                from: typeof FR.delimTokenTreeUFormBraceFrom;
                strict: typeof F.delimTokenTreeUFormBrace;
            };
        };
    };
    readonly expression: {
        readonly unary: typeof FR.unaryExpressionFrom & {
            from: typeof FR.unaryExpressionFrom;
            strict: typeof F.unaryExpression;
        };
        readonly reference: typeof FR.referenceExpressionFrom & {
            from: typeof FR.referenceExpressionFrom;
            strict: typeof F.referenceExpression;
        };
        readonly try: typeof FR.tryExpressionFrom & {
            from: typeof FR.tryExpressionFrom;
            strict: typeof F.tryExpression;
        };
        readonly binary: typeof FR.binaryExpressionFrom & {
            from: typeof FR.binaryExpressionFrom;
            strict: typeof F.binaryExpression;
        };
        readonly assignment: typeof FR.assignmentExpressionFrom & {
            from: typeof FR.assignmentExpressionFrom;
            strict: typeof F.assignmentExpression;
        };
        readonly compoundAssignment: typeof FR.compoundAssignmentExprFrom & {
            from: typeof FR.compoundAssignmentExprFrom;
            strict: typeof F.compoundAssignmentExpr;
        };
        readonly typeCast: typeof FR.typeCastExpressionFrom & {
            from: typeof FR.typeCastExpressionFrom;
            strict: typeof F.typeCastExpression;
        };
        readonly call: typeof FR.callExpressionFrom & {
            from: typeof FR.callExpressionFrom;
            strict: typeof F.callExpression;
        };
        readonly return: typeof FR.returnExpressionFrom & {
            from: typeof FR.returnExpressionFrom;
            strict: typeof F.returnExpression;
        };
        readonly yield: typeof FR.yieldExpressionFrom & {
            from: typeof FR.yieldExpressionFrom;
            strict: typeof F.yieldExpression;
        };
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly self: typeof F.self;
        readonly scoped: typeof FR.scopedIdentifierFrom & {
            from: typeof FR.scopedIdentifierFrom;
            strict: typeof F.scopedIdentifier;
        };
        readonly generic: typeof FR.genericFunctionFrom & {
            from: typeof FR.genericFunctionFrom;
            strict: typeof F.genericFunction;
        };
        readonly await: typeof FR.awaitExpressionFrom & {
            from: typeof FR.awaitExpressionFrom;
            strict: typeof F.awaitExpression;
        };
        readonly field: typeof FR.fieldExpressionFrom & {
            from: typeof FR.fieldExpressionFrom;
            strict: typeof F.fieldExpression;
        };
        readonly array: typeof FR.arrayExpressionFrom & {
            from: typeof FR.arrayExpressionFrom;
            strict: typeof F.arrayExpression;
            semi: typeof FR.arrayExpressionUFormSemiFrom & {
                from: typeof FR.arrayExpressionUFormSemiFrom;
                strict: typeof F.arrayExpressionUFormSemi;
            };
            list: typeof FR.arrayExpressionUFormListFrom & {
                from: typeof FR.arrayExpressionUFormListFrom;
                strict: typeof F.arrayExpressionUFormList;
            };
        };
        readonly tuple: typeof FR.tupleExpressionFrom & {
            from: typeof FR.tupleExpressionFrom;
            strict: typeof F.tupleExpression;
        };
        readonly macro: typeof FR.macroInvocationFrom & {
            from: typeof FR.macroInvocationFrom;
            strict: typeof F.macroInvocation;
        };
        readonly unit: typeof F.unitExpression;
        readonly break: typeof FR.breakExpressionFrom & {
            from: typeof FR.breakExpressionFrom;
            strict: typeof F.breakExpression;
        };
        readonly continue: typeof FR.continueExpressionFrom & {
            from: typeof FR.continueExpressionFrom;
            strict: typeof F.continueExpression;
        };
        readonly index: typeof FR.indexExpressionFrom & {
            from: typeof FR.indexExpressionFrom;
            strict: typeof F.indexExpression;
        };
        readonly metavariable: typeof F.metavariable;
        readonly closure: typeof FR.closureExpressionFrom & {
            from: typeof FR.closureExpressionFrom;
            strict: typeof F.closureExpression;
            block: typeof FR.closureExpressionUFormBlockFrom & {
                from: typeof FR.closureExpressionUFormBlockFrom;
                strict: typeof F.closureExpressionUFormBlock;
            };
            expr: typeof FR.closureExpressionUFormExprFrom & {
                from: typeof FR.closureExpressionUFormExprFrom;
                strict: typeof F.closureExpressionUFormExpr;
            };
        };
        readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
            from: typeof FR.parenthesizedExpressionFrom;
            strict: typeof F.parenthesizedExpression;
        };
        readonly struct: typeof FR.structExpressionFrom & {
            from: typeof FR.structExpressionFrom;
            strict: typeof F.structExpression;
        };
        readonly unsafe: typeof FR.unsafeBlockFrom & {
            from: typeof FR.unsafeBlockFrom;
            strict: typeof F.unsafeBlock;
        };
        readonly async: typeof FR.asyncBlockFrom & {
            from: typeof FR.asyncBlockFrom;
            strict: typeof F.asyncBlock;
        };
        readonly gen: typeof FR.genBlockFrom & {
            from: typeof FR.genBlockFrom;
            strict: typeof F.genBlock;
        };
        readonly block: typeof FR.blockFrom & {
            from: typeof FR.blockFrom;
            strict: typeof F.block;
        };
        readonly if: typeof FR.ifExpressionFrom & {
            from: typeof FR.ifExpressionFrom;
            strict: typeof F.ifExpression;
        };
        readonly match: typeof FR.matchExpressionFrom & {
            from: typeof FR.matchExpressionFrom;
            strict: typeof F.matchExpression;
        };
        readonly while: typeof FR.whileExpressionFrom & {
            from: typeof FR.whileExpressionFrom;
            strict: typeof F.whileExpression;
        };
        readonly loop: typeof FR.loopExpressionFrom & {
            from: typeof FR.loopExpressionFrom;
            strict: typeof F.loopExpression;
        };
        readonly for: typeof FR.forExpressionFrom & {
            from: typeof FR.forExpressionFrom;
            strict: typeof F.forExpression;
        };
        readonly const: typeof FR.constBlockFrom & {
            from: typeof FR.constBlockFrom;
            strict: typeof F.constBlock;
        };
        readonly range: typeof FR.rangeExpressionFrom & {
            from: typeof FR.rangeExpressionFrom;
            strict: typeof F.rangeExpression;
            binary: typeof FR.rangeExpressionUFormBinaryFrom & {
                from: typeof FR.rangeExpressionUFormBinaryFrom;
                strict: typeof F.rangeExpressionUFormBinary;
            };
            postfix: typeof FR.rangeExpressionUFormPostfixFrom & {
                from: typeof FR.rangeExpressionUFormPostfixFrom;
                strict: typeof F.rangeExpressionUFormPostfix;
            };
            prefix: typeof FR.rangeExpressionUFormPrefixFrom & {
                from: typeof FR.rangeExpressionUFormPrefixFrom;
                strict: typeof F.rangeExpressionUFormPrefix;
            };
            bare: typeof FR.rangeExpressionUFormBareFrom & {
                from: typeof FR.rangeExpressionUFormBareFrom;
                strict: typeof F.rangeExpressionUFormBare;
            };
        };
    };
    readonly expressionEndingWithBlock: {
        readonly unsafe: typeof FR.unsafeBlockFrom & {
            from: typeof FR.unsafeBlockFrom;
            strict: typeof F.unsafeBlock;
        };
        readonly async: typeof FR.asyncBlockFrom & {
            from: typeof FR.asyncBlockFrom;
            strict: typeof F.asyncBlock;
        };
        readonly gen: typeof FR.genBlockFrom & {
            from: typeof FR.genBlockFrom;
            strict: typeof F.genBlock;
        };
        readonly try: typeof FR.tryBlockFrom & {
            from: typeof FR.tryBlockFrom;
            strict: typeof F.tryBlock;
        };
        readonly block: typeof FR.blockFrom & {
            from: typeof FR.blockFrom;
            strict: typeof F.block;
        };
        readonly if: typeof FR.ifExpressionFrom & {
            from: typeof FR.ifExpressionFrom;
            strict: typeof F.ifExpression;
        };
        readonly match: typeof FR.matchExpressionFrom & {
            from: typeof FR.matchExpressionFrom;
            strict: typeof F.matchExpression;
        };
        readonly while: typeof FR.whileExpressionFrom & {
            from: typeof FR.whileExpressionFrom;
            strict: typeof F.whileExpression;
        };
        readonly loop: typeof FR.loopExpressionFrom & {
            from: typeof FR.loopExpressionFrom;
            strict: typeof F.loopExpression;
        };
        readonly for: typeof FR.forExpressionFrom & {
            from: typeof FR.forExpressionFrom;
            strict: typeof F.forExpression;
        };
        readonly const: typeof FR.constBlockFrom & {
            from: typeof FR.constBlockFrom;
            strict: typeof F.constBlock;
        };
    };
    readonly expressionExceptRange: {
        readonly unary: typeof FR.unaryExpressionFrom & {
            from: typeof FR.unaryExpressionFrom;
            strict: typeof F.unaryExpression;
        };
        readonly reference: typeof FR.referenceExpressionFrom & {
            from: typeof FR.referenceExpressionFrom;
            strict: typeof F.referenceExpression;
        };
        readonly try: typeof FR.tryExpressionFrom & {
            from: typeof FR.tryExpressionFrom;
            strict: typeof F.tryExpression;
        };
        readonly binary: typeof FR.binaryExpressionFrom & {
            from: typeof FR.binaryExpressionFrom;
            strict: typeof F.binaryExpression;
        };
        readonly assignment: typeof FR.assignmentExpressionFrom & {
            from: typeof FR.assignmentExpressionFrom;
            strict: typeof F.assignmentExpression;
        };
        readonly compoundAssignment: typeof FR.compoundAssignmentExprFrom & {
            from: typeof FR.compoundAssignmentExprFrom;
            strict: typeof F.compoundAssignmentExpr;
        };
        readonly typeCast: typeof FR.typeCastExpressionFrom & {
            from: typeof FR.typeCastExpressionFrom;
            strict: typeof F.typeCastExpression;
        };
        readonly call: typeof FR.callExpressionFrom & {
            from: typeof FR.callExpressionFrom;
            strict: typeof F.callExpression;
        };
        readonly return: typeof FR.returnExpressionFrom & {
            from: typeof FR.returnExpressionFrom;
            strict: typeof F.returnExpression;
        };
        readonly yield: typeof FR.yieldExpressionFrom & {
            from: typeof FR.yieldExpressionFrom;
            strict: typeof F.yieldExpression;
        };
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly self: typeof F.self;
        readonly scoped: typeof FR.scopedIdentifierFrom & {
            from: typeof FR.scopedIdentifierFrom;
            strict: typeof F.scopedIdentifier;
        };
        readonly generic: typeof FR.genericFunctionFrom & {
            from: typeof FR.genericFunctionFrom;
            strict: typeof F.genericFunction;
        };
        readonly await: typeof FR.awaitExpressionFrom & {
            from: typeof FR.awaitExpressionFrom;
            strict: typeof F.awaitExpression;
        };
        readonly field: typeof FR.fieldExpressionFrom & {
            from: typeof FR.fieldExpressionFrom;
            strict: typeof F.fieldExpression;
        };
        readonly array: typeof FR.arrayExpressionFrom & {
            from: typeof FR.arrayExpressionFrom;
            strict: typeof F.arrayExpression;
            semi: typeof FR.arrayExpressionUFormSemiFrom & {
                from: typeof FR.arrayExpressionUFormSemiFrom;
                strict: typeof F.arrayExpressionUFormSemi;
            };
            list: typeof FR.arrayExpressionUFormListFrom & {
                from: typeof FR.arrayExpressionUFormListFrom;
                strict: typeof F.arrayExpressionUFormList;
            };
        };
        readonly tuple: typeof FR.tupleExpressionFrom & {
            from: typeof FR.tupleExpressionFrom;
            strict: typeof F.tupleExpression;
        };
        readonly macro: typeof FR.macroInvocationFrom & {
            from: typeof FR.macroInvocationFrom;
            strict: typeof F.macroInvocation;
        };
        readonly unit: typeof F.unitExpression;
        readonly break: typeof FR.breakExpressionFrom & {
            from: typeof FR.breakExpressionFrom;
            strict: typeof F.breakExpression;
        };
        readonly continue: typeof FR.continueExpressionFrom & {
            from: typeof FR.continueExpressionFrom;
            strict: typeof F.continueExpression;
        };
        readonly index: typeof FR.indexExpressionFrom & {
            from: typeof FR.indexExpressionFrom;
            strict: typeof F.indexExpression;
        };
        readonly metavariable: typeof F.metavariable;
        readonly closure: typeof FR.closureExpressionFrom & {
            from: typeof FR.closureExpressionFrom;
            strict: typeof F.closureExpression;
            block: typeof FR.closureExpressionUFormBlockFrom & {
                from: typeof FR.closureExpressionUFormBlockFrom;
                strict: typeof F.closureExpressionUFormBlock;
            };
            expr: typeof FR.closureExpressionUFormExprFrom & {
                from: typeof FR.closureExpressionUFormExprFrom;
                strict: typeof F.closureExpressionUFormExpr;
            };
        };
        readonly parenthesized: typeof FR.parenthesizedExpressionFrom & {
            from: typeof FR.parenthesizedExpressionFrom;
            strict: typeof F.parenthesizedExpression;
        };
        readonly struct: typeof FR.structExpressionFrom & {
            from: typeof FR.structExpressionFrom;
            strict: typeof F.structExpression;
        };
        readonly unsafe: typeof FR.unsafeBlockFrom & {
            from: typeof FR.unsafeBlockFrom;
            strict: typeof F.unsafeBlock;
        };
        readonly async: typeof FR.asyncBlockFrom & {
            from: typeof FR.asyncBlockFrom;
            strict: typeof F.asyncBlock;
        };
        readonly gen: typeof FR.genBlockFrom & {
            from: typeof FR.genBlockFrom;
            strict: typeof F.genBlock;
        };
        readonly block: typeof FR.blockFrom & {
            from: typeof FR.blockFrom;
            strict: typeof F.block;
        };
        readonly if: typeof FR.ifExpressionFrom & {
            from: typeof FR.ifExpressionFrom;
            strict: typeof F.ifExpression;
        };
        readonly match: typeof FR.matchExpressionFrom & {
            from: typeof FR.matchExpressionFrom;
            strict: typeof F.matchExpression;
        };
        readonly while: typeof FR.whileExpressionFrom & {
            from: typeof FR.whileExpressionFrom;
            strict: typeof F.whileExpression;
        };
        readonly loop: typeof FR.loopExpressionFrom & {
            from: typeof FR.loopExpressionFrom;
            strict: typeof F.loopExpression;
        };
        readonly for: typeof FR.forExpressionFrom & {
            from: typeof FR.forExpressionFrom;
            strict: typeof F.forExpression;
        };
        readonly const: typeof FR.constBlockFrom & {
            from: typeof FR.constBlockFrom;
            strict: typeof F.constBlock;
        };
    };
    readonly literal: {
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
    };
    readonly literalPattern: {
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly negative: typeof FR.negativeLiteralFrom & {
            from: typeof FR.negativeLiteralFrom;
            strict: typeof F.negativeLiteral;
        };
    };
    readonly nonDelimToken: {
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly mutable: typeof F.mutableSpecifier;
        readonly self: typeof F.self;
        readonly super: typeof F.super_;
        readonly crate: typeof F.crate;
    };
    readonly path: {
        readonly self: typeof F.self;
        readonly identifier: typeof F.identifier;
        readonly metavariable: typeof F.metavariable;
        readonly super: typeof F.super_;
        readonly crate: typeof F.crate;
        readonly scoped: typeof FR.scopedIdentifierFrom & {
            from: typeof FR.scopedIdentifierFrom;
            strict: typeof F.scopedIdentifier;
        };
    };
    readonly pattern: {
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly negative: typeof FR.negativeLiteralFrom & {
            from: typeof FR.negativeLiteralFrom;
            strict: typeof F.negativeLiteral;
        };
        readonly identifier: typeof F.identifier;
        readonly scoped: typeof FR.scopedIdentifierFrom & {
            from: typeof FR.scopedIdentifierFrom;
            strict: typeof F.scopedIdentifier;
        };
        readonly generic: typeof FR.genericPatternFrom & {
            from: typeof FR.genericPatternFrom;
            strict: typeof F.genericPattern;
        };
        readonly tuple: typeof FR.tuplePatternFrom & {
            from: typeof FR.tuplePatternFrom;
            strict: typeof F.tuplePattern;
        };
        readonly tupleStruct: typeof FR.tupleStructPatternFrom & {
            from: typeof FR.tupleStructPatternFrom;
            strict: typeof F.tupleStructPattern;
        };
        readonly struct: typeof FR.structPatternFrom & {
            from: typeof FR.structPatternFrom;
            strict: typeof F.structPattern;
        };
        readonly ref: typeof FR.refPatternFrom & {
            from: typeof FR.refPatternFrom;
            strict: typeof F.refPattern;
        };
        readonly slice: typeof FR.slicePatternFrom & {
            from: typeof FR.slicePatternFrom;
            strict: typeof F.slicePattern;
        };
        readonly captured: typeof FR.capturedPatternFrom & {
            from: typeof FR.capturedPatternFrom;
            strict: typeof F.capturedPattern;
        };
        readonly reference: typeof FR.referencePatternFrom & {
            from: typeof FR.referencePatternFrom;
            strict: typeof F.referencePattern;
        };
        readonly mut: typeof FR.mutPatternFrom & {
            from: typeof FR.mutPatternFrom;
            strict: typeof F.mutPattern;
        };
        readonly range: typeof FR.rangePatternFrom & {
            from: typeof FR.rangePatternFrom;
            strict: typeof F.rangePattern;
            prefix: typeof FR.rangePatternUFormPrefixFrom & {
                from: typeof FR.rangePatternUFormPrefixFrom;
                strict: typeof F.rangePatternUFormPrefix;
            };
            leftWithRight: typeof FR.rangePatternUFormLeftWithRightFrom & {
                from: typeof FR.rangePatternUFormLeftWithRightFrom;
                strict: typeof F.rangePatternUFormLeftWithRight;
            };
            left_with_right: typeof FR.rangePatternUFormLeftWithRightFrom & {
                from: typeof FR.rangePatternUFormLeftWithRightFrom;
                strict: typeof F.rangePatternUFormLeftWithRight;
            };
            leftBare: typeof FR.rangePatternUFormLeftBareFrom & {
                from: typeof FR.rangePatternUFormLeftBareFrom;
                strict: typeof F.rangePatternUFormLeftBare;
            };
            left_bare: typeof FR.rangePatternUFormLeftBareFrom & {
                from: typeof FR.rangePatternUFormLeftBareFrom;
                strict: typeof F.rangePatternUFormLeftBare;
            };
        };
        readonly or: typeof FR.orPatternFrom & {
            from: typeof FR.orPatternFrom;
            strict: typeof F.orPattern;
            binary: typeof FR.orPatternUFormBinaryFrom & {
                from: typeof FR.orPatternUFormBinaryFrom;
                strict: typeof F.orPatternUFormBinary;
            };
            prefix: typeof FR.orPatternUFormPrefixFrom & {
                from: typeof FR.orPatternUFormPrefixFrom;
                strict: typeof F.orPatternUFormPrefix;
            };
        };
        readonly const: typeof FR.constBlockFrom & {
            from: typeof FR.constBlockFrom;
            strict: typeof F.constBlock;
        };
        readonly macro: typeof FR.macroInvocationFrom & {
            from: typeof FR.macroInvocationFrom;
            strict: typeof F.macroInvocation;
        };
    };
    readonly statement: {
        readonly expression: typeof FR.expressionStatementFrom & {
            from: typeof FR.expressionStatementFrom;
            strict: typeof F.expressionStatement;
            withSemi: typeof FR.expressionStatementUFormWithSemiFrom & {
                from: typeof FR.expressionStatementUFormWithSemiFrom;
                strict: typeof F.expressionStatementUFormWithSemi;
            };
            with_semi: typeof FR.expressionStatementUFormWithSemiFrom & {
                from: typeof FR.expressionStatementUFormWithSemiFrom;
                strict: typeof F.expressionStatementUFormWithSemi;
            };
            blockEnding: typeof FR.expressionStatementUFormBlockEndingFrom & {
                from: typeof FR.expressionStatementUFormBlockEndingFrom;
                strict: typeof F.expressionStatementUFormBlockEnding;
            };
            block_ending: typeof FR.expressionStatementUFormBlockEndingFrom & {
                from: typeof FR.expressionStatementUFormBlockEndingFrom;
                strict: typeof F.expressionStatementUFormBlockEnding;
            };
        };
        readonly const: typeof FR.constItemFrom & {
            from: typeof FR.constItemFrom;
            strict: typeof F.constItem;
        };
        readonly macro: typeof FR.macroInvocationFrom & {
            from: typeof FR.macroInvocationFrom;
            strict: typeof F.macroInvocation;
        };
        readonly attribute: typeof FR.attributeItemFrom & {
            from: typeof FR.attributeItemFrom;
            strict: typeof F.attributeItem;
        };
        readonly innerAttribute: typeof FR.innerAttributeItemFrom & {
            from: typeof FR.innerAttributeItemFrom;
            strict: typeof F.innerAttributeItem;
        };
        readonly mod: typeof FR.modItemFrom & {
            from: typeof FR.modItemFrom;
            strict: typeof F.modItem;
            external: typeof FR.modItemUFormExternalFrom & {
                from: typeof FR.modItemUFormExternalFrom;
                strict: typeof F.modItemUFormExternal;
            };
            inline: typeof FR.modItemUFormInlineFrom & {
                from: typeof FR.modItemUFormInlineFrom;
                strict: typeof F.modItemUFormInline;
            };
        };
        readonly foreignMod: typeof FR.foreignModItemFrom & {
            from: typeof FR.foreignModItemFrom;
            strict: typeof F.foreignModItem;
            semi: typeof FR.foreignModItemUFormSemiFrom & {
                from: typeof FR.foreignModItemUFormSemiFrom;
                strict: typeof F.foreignModItemUFormSemi;
            };
            body: typeof FR.foreignModItemUFormBodyFrom & {
                from: typeof FR.foreignModItemUFormBodyFrom;
                strict: typeof F.foreignModItemUFormBody;
            };
        };
        readonly struct: typeof FR.structItemFrom & {
            from: typeof FR.structItemFrom;
            strict: typeof F.structItem;
            brace: typeof FR.structItemUFormBraceFrom & {
                from: typeof FR.structItemUFormBraceFrom;
                strict: typeof F.structItemUFormBrace;
            };
            tuple: typeof FR.structItemUFormTupleFrom & {
                from: typeof FR.structItemUFormTupleFrom;
                strict: typeof F.structItemUFormTuple;
            };
            unit: typeof FR.structItemUFormUnitFrom & {
                from: typeof FR.structItemUFormUnitFrom;
                strict: typeof F.structItemUFormUnit;
            };
        };
        readonly union: typeof FR.unionItemFrom & {
            from: typeof FR.unionItemFrom;
            strict: typeof F.unionItem;
        };
        readonly enum: typeof FR.enumItemFrom & {
            from: typeof FR.enumItemFrom;
            strict: typeof F.enumItem;
        };
        readonly type: typeof FR.typeItemFrom & {
            from: typeof FR.typeItemFrom;
            strict: typeof F.typeItem;
        };
        readonly function: typeof FR.functionItemFrom & {
            from: typeof FR.functionItemFrom;
            strict: typeof F.functionItem;
        };
        readonly functionSignature: typeof FR.functionSignatureItemFrom & {
            from: typeof FR.functionSignatureItemFrom;
            strict: typeof F.functionSignatureItem;
        };
        readonly impl: typeof FR.implItemFrom & {
            from: typeof FR.implItemFrom;
            strict: typeof F.implItem;
            body: typeof FR.implItemUFormBodyFrom & {
                from: typeof FR.implItemUFormBodyFrom;
                strict: typeof F.implItemUFormBody;
            };
            semi: typeof FR.implItemUFormSemiFrom & {
                from: typeof FR.implItemUFormSemiFrom;
                strict: typeof F.implItemUFormSemi;
            };
        };
        readonly trait: typeof FR.traitItemFrom & {
            from: typeof FR.traitItemFrom;
            strict: typeof F.traitItem;
        };
        readonly associated: typeof FR.associatedTypeFrom & {
            from: typeof FR.associatedTypeFrom;
            strict: typeof F.associatedType;
        };
        readonly let: typeof FR.letDeclarationFrom & {
            from: typeof FR.letDeclarationFrom;
            strict: typeof F.letDeclaration;
        };
        readonly use: typeof FR.useDeclarationFrom & {
            from: typeof FR.useDeclarationFrom;
            strict: typeof F.useDeclaration;
        };
        readonly externCrate: typeof FR.externCrateDeclarationFrom & {
            from: typeof FR.externCrateDeclarationFrom;
            strict: typeof F.externCrateDeclaration;
        };
        readonly static: typeof FR.staticItemFrom & {
            from: typeof FR.staticItemFrom;
            strict: typeof F.staticItem;
        };
    };
    readonly tokenPattern: {
        readonly tokenTree: typeof FR.tokenTreePatternFrom & {
            from: typeof FR.tokenTreePatternFrom;
            strict: typeof F.tokenTreePattern;
            paren: typeof FR.tokenTreePatternUFormParenFrom & {
                from: typeof FR.tokenTreePatternUFormParenFrom;
                strict: typeof F.tokenTreePatternUFormParen;
            };
            bracket: typeof FR.tokenTreePatternUFormBracketFrom & {
                from: typeof FR.tokenTreePatternUFormBracketFrom;
                strict: typeof F.tokenTreePatternUFormBracket;
            };
            brace: typeof FR.tokenTreePatternUFormBraceFrom & {
                from: typeof FR.tokenTreePatternUFormBraceFrom;
                strict: typeof F.tokenTreePatternUFormBrace;
            };
        };
        readonly tokenRepetition: typeof FR.tokenRepetitionPatternFrom & {
            from: typeof FR.tokenRepetitionPatternFrom;
            strict: typeof F.tokenRepetitionPattern;
        };
        readonly tokenBinding: typeof FR.tokenBindingPatternFrom & {
            from: typeof FR.tokenBindingPatternFrom;
            strict: typeof F.tokenBindingPattern;
        };
        readonly metavariable: typeof F.metavariable;
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly mutable: typeof F.mutableSpecifier;
        readonly self: typeof F.self;
        readonly super: typeof F.super_;
        readonly crate: typeof F.crate;
    };
    readonly tokens: {
        readonly token: typeof FR.tokenTreeFrom & {
            from: typeof FR.tokenTreeFrom;
            strict: typeof F.tokenTree;
            paren: typeof FR.tokenTreeUFormParenFrom & {
                from: typeof FR.tokenTreeUFormParenFrom;
                strict: typeof F.tokenTreeUFormParen;
            };
            bracket: typeof FR.tokenTreeUFormBracketFrom & {
                from: typeof FR.tokenTreeUFormBracketFrom;
                strict: typeof F.tokenTreeUFormBracket;
            };
            brace: typeof FR.tokenTreeUFormBraceFrom & {
                from: typeof FR.tokenTreeUFormBraceFrom;
                strict: typeof F.tokenTreeUFormBrace;
            };
        };
        readonly metavariable: typeof F.metavariable;
        readonly string: typeof FR.stringLiteralFrom & {
            from: typeof FR.stringLiteralFrom;
            strict: typeof F.stringLiteral;
        };
        readonly rawString: typeof FR.rawStringLiteralFrom & {
            from: typeof FR.rawStringLiteralFrom;
            strict: typeof F.rawStringLiteral;
        };
        readonly char: typeof F.charLiteral;
        readonly boolean: typeof F.booleanLiteral;
        readonly integer: typeof F.integerLiteral;
        readonly float: typeof F.floatLiteral;
        readonly identifier: typeof F.identifier;
        readonly mutable: typeof F.mutableSpecifier;
        readonly self: typeof F.self;
        readonly super: typeof F.super_;
        readonly crate: typeof F.crate;
    };
    readonly type: {
        readonly abstract: typeof FR.abstractTypeFrom & {
            from: typeof FR.abstractTypeFrom;
            strict: typeof F.abstractType;
        };
        readonly reference: typeof FR.referenceTypeFrom & {
            from: typeof FR.referenceTypeFrom;
            strict: typeof F.referenceType;
        };
        readonly metavariable: typeof F.metavariable;
        readonly pointer: typeof FR.pointerTypeFrom & {
            from: typeof FR.pointerTypeFrom;
            strict: typeof F.pointerType;
            const: typeof FR.pointerTypeUFormConstFrom & {
                from: typeof FR.pointerTypeUFormConstFrom;
                strict: typeof F.pointerTypeUFormConst;
            };
            mut: typeof FR.pointerTypeUFormMutFrom & {
                from: typeof FR.pointerTypeUFormMutFrom;
                strict: typeof F.pointerTypeUFormMut;
            };
        };
        readonly generic: typeof FR.genericTypeFrom & {
            from: typeof FR.genericTypeFrom;
            strict: typeof F.genericType;
        };
        readonly scopedType: typeof FR.scopedTypeIdentifierFrom & {
            from: typeof FR.scopedTypeIdentifierFrom;
            strict: typeof F.scopedTypeIdentifier;
        };
        readonly tuple: typeof FR.tupleTypeFrom & {
            from: typeof FR.tupleTypeFrom;
            strict: typeof F.tupleType;
        };
        readonly unit: typeof F.unitType;
        readonly array: typeof FR.arrayTypeFrom & {
            from: typeof FR.arrayTypeFrom;
            strict: typeof F.arrayType;
        };
        readonly function: typeof FR.functionTypeFrom & {
            from: typeof FR.functionTypeFrom;
            strict: typeof F.functionType;
        };
        readonly macro: typeof FR.macroInvocationFrom & {
            from: typeof FR.macroInvocationFrom;
            strict: typeof F.macroInvocation;
        };
        readonly dynamic: typeof FR.dynamicTypeFrom & {
            from: typeof FR.dynamicTypeFrom;
            strict: typeof F.dynamicType;
        };
        readonly bounded: typeof FR.boundedTypeFrom & {
            from: typeof FR.boundedTypeFrom;
            strict: typeof F.boundedType;
        };
        readonly removedTrait: typeof FR.removedTraitBoundFrom & {
            from: typeof FR.removedTraitBoundFrom;
            strict: typeof F.removedTraitBound;
        };
    };
    readonly useClause: {
        readonly self: typeof F.self;
        readonly identifier: typeof F.identifier;
        readonly metavariable: typeof F.metavariable;
        readonly super: typeof F.super_;
        readonly crate: typeof F.crate;
        readonly scoped: typeof FR.scopedIdentifierFrom & {
            from: typeof FR.scopedIdentifierFrom;
            strict: typeof F.scopedIdentifier;
        };
        readonly useAs: typeof FR.useAsClauseFrom & {
            from: typeof FR.useAsClauseFrom;
            strict: typeof F.useAsClause;
        };
        readonly use: typeof FR.useListFrom & {
            from: typeof FR.useListFrom;
            strict: typeof F.useList;
        };
        readonly scopedUse: typeof FR.scopedUseListFrom & {
            from: typeof FR.scopedUseListFrom;
            strict: typeof F.scopedUseList;
        };
    };
    readonly from: {
        readonly boolean: (value: boolean) => ReturnType<typeof F.booleanLiteral>;
        readonly number: ((value: number) => ReturnType<typeof F.integerLiteral> | ReturnType<typeof F.floatLiteral>) & {
            integer(value: number): ReturnType<typeof F.integerLiteral>;
            float(value: number): ReturnType<typeof F.floatLiteral>;
        };
        readonly string: (value: string) => ReturnType<typeof F.stringLiteral>;
        readonly type: (name: string) => ReturnType<typeof F.typeIdentifier>;
        readonly identifier: (name: string) => ReturnType<typeof F.identifier>;
        readonly function: typeof FR.functionItemFrom & {
            from: typeof FR.functionItemFrom;
            strict: typeof F.functionItem;
        };
        readonly class: typeof FR.structItemFrom & {
            from: typeof FR.structItemFrom;
            strict: typeof F.structItem;
            brace: typeof FR.structItemUFormBraceFrom & {
                from: typeof FR.structItemUFormBraceFrom;
                strict: typeof F.structItemUFormBrace;
            };
            tuple: typeof FR.structItemUFormTupleFrom & {
                from: typeof FR.structItemUFormTupleFrom;
                strict: typeof F.structItemUFormTuple;
            };
            unit: typeof FR.structItemUFormUnitFrom & {
                from: typeof FR.structItemUFormUnitFrom;
                strict: typeof F.structItemUFormUnit;
            };
        };
        readonly method: typeof FR.functionItemFrom & {
            from: typeof FR.functionItemFrom;
            strict: typeof F.functionItem;
        };
        readonly module: typeof FR.modItemFrom & {
            from: typeof FR.modItemFrom;
            strict: typeof F.modItem;
            external: typeof FR.modItemUFormExternalFrom & {
                from: typeof FR.modItemUFormExternalFrom;
                strict: typeof F.modItemUFormExternal;
            };
            inline: typeof FR.modItemUFormInlineFrom & {
                from: typeof FR.modItemUFormInlineFrom;
                strict: typeof F.modItemUFormInline;
            };
        };
        readonly interface: typeof FR.traitItemFrom & {
            from: typeof FR.traitItemFrom;
            strict: typeof F.traitItem;
        };
    };
};
//# sourceMappingURL=ir.d.ts.map