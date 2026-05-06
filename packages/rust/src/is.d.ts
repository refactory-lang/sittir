import type { AnyNodeData, AnyTreeNodeOf as AnyTreeNode } from '@sittir/types';
import { TSKindId } from './types.js';
import type { NamespaceMap, Condition, DeclarationStatement, DelimTokens, Expression, ExpressionEndingWithBlock, ExpressionExceptRange, Literal, LiteralPattern, NonDelimToken, Path, Pattern, Statement, TokenPattern, Tokens, UseClause, _Type } from './types.js';
export interface IsGuards {
    ClosureExpressionExpr<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ClosureExpressionExpr;
    };
    DelimTokenTreeBrace<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._DelimTokenTreeBrace;
    };
    DelimTokenTreeBracket<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._DelimTokenTreeBracket;
    };
    DelimTokenTreeParen<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._DelimTokenTreeParen;
    };
    ExpressionStatementBlockEnding<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ExpressionStatementBlockEnding;
    };
    ExpressionStatementWithSemi<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ExpressionStatementWithSemi;
    };
    FieldIdentifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FieldIdentifier;
    };
    FieldPatternShorthand<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._FieldPatternShorthand;
    };
    ForeignModItemBody<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ForeignModItemBody;
    };
    FunctionTypeFnForm<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionTypeFnForm;
    };
    FunctionTypeTraitForm<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionTypeTraitForm;
    };
    ImplItemBody<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ImplItemBody;
    };
    LetChain<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LetChain;
    };
    MacroDefinitionBrace<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._MacroDefinitionBrace;
    };
    MacroDefinitionBracket<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._MacroDefinitionBracket;
    };
    MacroDefinitionParen<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._MacroDefinitionParen;
    };
    MatchArmBlockEnding<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._MatchArmBlockEnding;
    };
    ModItemInline<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ModItemInline;
    };
    PointerTypeMut<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._PointerTypeMut;
    };
    RangeExpressionBare<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._RangeExpressionBare;
    };
    ReferenceExpressionRawMut<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ReferenceExpressionRawMut;
    };
    TokenTreeBrace<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._TokenTreeBrace;
    };
    TokenTreeBracket<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._TokenTreeBracket;
    };
    TokenTreeParen<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._TokenTreeParen;
    };
    TokenTreePatternBrace<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._TokenTreePatternBrace;
    };
    TokenTreePatternBracket<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._TokenTreePatternBracket;
    };
    TokenTreePatternParen<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._TokenTreePatternParen;
    };
    TypeIdentifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeIdentifier;
    };
    VisibilityModifierCrate<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._VisibilityModifierCrate;
    };
    abstractType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AbstractType;
    };
    arguments<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Arguments;
    };
    arrayExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ArrayExpression;
    };
    arrayType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ArrayType;
    };
    assignmentExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AssignmentExpression;
    };
    associatedType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AssociatedType;
    };
    asyncBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AsyncBlock;
    };
    attribute<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Attribute;
    };
    attributeItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AttributeItem;
    };
    awaitExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AwaitExpression;
    };
    baseFieldInitializer<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BaseFieldInitializer;
    };
    binaryExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BinaryExpression;
    };
    block<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Block;
    };
    blockComment<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BlockComment;
    };
    boundedType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BoundedType;
    };
    bracketedType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BracketedType;
    };
    breakExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BreakExpression;
    };
    callExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.CallExpression;
    };
    capturedPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.CapturedPattern;
    };
    closureExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClosureExpression;
    };
    closureParameters<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClosureParameters;
    };
    compoundAssignmentExpr<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.CompoundAssignmentExpr;
    };
    constBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConstBlock;
    };
    constItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConstItem;
    };
    constParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConstParameter;
    };
    continueExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ContinueExpression;
    };
    declarationList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DeclarationList;
    };
    delimTokenTree<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DelimTokenTree;
    };
    dynamicType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DynamicType;
    };
    elseClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ElseClause;
    };
    enumItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.EnumItem;
    };
    enumVariant<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.EnumVariant;
    };
    enumVariantList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.EnumVariantList;
    };
    expressionStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExpressionStatement;
    };
    externCrateDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExternCrateDeclaration;
    };
    externModifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExternModifier;
    };
    fieldDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FieldDeclaration;
    };
    fieldDeclarationList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FieldDeclarationList;
    };
    fieldExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FieldExpression;
    };
    fieldInitializer<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FieldInitializer;
    };
    fieldInitializerList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FieldInitializerList;
    };
    fieldPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FieldPattern;
    };
    forExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ForExpression;
    };
    forLifetimes<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ForLifetimes;
    };
    foreignModItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ForeignModItem;
    };
    functionItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionItem;
    };
    functionModifiers<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionModifiers;
    };
    functionSignatureItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionSignatureItem;
    };
    functionType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionType;
    };
    genBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GenBlock;
    };
    genericFunction<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GenericFunction;
    };
    genericPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GenericPattern;
    };
    genericType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GenericType;
    };
    genericTypeWithTurbofish<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GenericTypeWithTurbofish;
    };
    higherRankedTraitBound<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.HigherRankedTraitBound;
    };
    ifExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.IfExpression;
    };
    implItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImplItem;
    };
    indexExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.IndexExpression;
    };
    innerAttributeItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.InnerAttributeItem;
    };
    label<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Label;
    };
    lastMatchArm<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LastMatchArm;
    };
    letCondition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LetCondition;
    };
    letDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LetDeclaration;
    };
    lifetime<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Lifetime;
    };
    lifetimeParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LifetimeParameter;
    };
    lineComment<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LineComment;
    };
    loopExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LoopExpression;
    };
    macroDefinition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MacroDefinition;
    };
    macroInvocation<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MacroInvocation;
    };
    macroRule<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MacroRule;
    };
    matchArm<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MatchArm;
    };
    matchBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MatchBlock;
    };
    matchExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MatchExpression;
    };
    matchPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MatchPattern;
    };
    modItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ModItem;
    };
    mutPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MutPattern;
    };
    negativeLiteral<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NegativeLiteral;
    };
    orPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.OrPattern;
    };
    orderedFieldDeclarationList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.OrderedFieldDeclarationList;
    };
    parameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Parameter;
    };
    parameters<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Parameters;
    };
    parenthesizedExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ParenthesizedExpression;
    };
    pointerType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.PointerType;
    };
    qualifiedType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.QualifiedType;
    };
    rangeExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RangeExpression;
    };
    rangePattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RangePattern;
    };
    rawStringLiteral<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RawStringLiteral;
    };
    refPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RefPattern;
    };
    referenceExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ReferenceExpression;
    };
    referencePattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ReferencePattern;
    };
    referenceType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ReferenceType;
    };
    removedTraitBound<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RemovedTraitBound;
    };
    returnExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ReturnExpression;
    };
    scopedIdentifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ScopedIdentifier;
    };
    scopedTypeIdentifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ScopedTypeIdentifier;
    };
    scopedTypeIdentifierInExpressionPosition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ScopedTypeIdentifierInExpressionPosition;
    };
    scopedUseList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ScopedUseList;
    };
    selfParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SelfParameter;
    };
    shorthandFieldInitializer<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ShorthandFieldInitializer;
    };
    slicePattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SlicePattern;
    };
    sourceFile<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SourceFile;
    };
    staticItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.StaticItem;
    };
    stringLiteral<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.StringLiteral;
    };
    structExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.StructExpression;
    };
    structItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.StructItem;
    };
    structPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.StructPattern;
    };
    tokenBindingPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TokenBindingPattern;
    };
    tokenRepetition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TokenRepetition;
    };
    tokenRepetitionPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TokenRepetitionPattern;
    };
    tokenTree<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TokenTree;
    };
    tokenTreePattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TokenTreePattern;
    };
    traitBounds<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TraitBounds;
    };
    traitItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TraitItem;
    };
    tryBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TryBlock;
    };
    tryExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TryExpression;
    };
    tupleExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TupleExpression;
    };
    tuplePattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TuplePattern;
    };
    tupleStructPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TupleStructPattern;
    };
    tupleType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TupleType;
    };
    typeArguments<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeArguments;
    };
    typeBinding<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeBinding;
    };
    typeCastExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeCastExpression;
    };
    typeItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeItem;
    };
    typeParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeParameter;
    };
    typeParameters<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeParameters;
    };
    unaryExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UnaryExpression;
    };
    unionItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UnionItem;
    };
    unsafeBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UnsafeBlock;
    };
    useAsClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UseAsClause;
    };
    useBounds<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UseBounds;
    };
    useDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UseDeclaration;
    };
    useList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UseList;
    };
    useWildcard<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UseWildcard;
    };
    variadicParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.VariadicParameter;
    };
    visibilityModifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.VisibilityModifier;
    };
    whereClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WhereClause;
    };
    wherePredicate<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WherePredicate;
    };
    whileExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WhileExpression;
    };
    yieldExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.YieldExpression;
    };
    kind<K extends keyof NamespaceMap>(v: {
        readonly $type: number;
    }, kind: K): v is {
        readonly $type: number;
    };
    condition(v: {
        readonly $type: string | number;
    }): v is Condition;
    declarationStatement(v: {
        readonly $type: string | number;
    }): v is DeclarationStatement;
    delimTokens(v: {
        readonly $type: string | number;
    }): v is DelimTokens;
    expression(v: {
        readonly $type: string | number;
    }): v is Expression;
    expressionEndingWithBlock(v: {
        readonly $type: string | number;
    }): v is ExpressionEndingWithBlock;
    expressionExceptRange(v: {
        readonly $type: string | number;
    }): v is ExpressionExceptRange;
    literal(v: {
        readonly $type: string | number;
    }): v is Literal;
    literalPattern(v: {
        readonly $type: string | number;
    }): v is LiteralPattern;
    nonDelimToken(v: {
        readonly $type: string | number;
    }): v is NonDelimToken;
    path(v: {
        readonly $type: string | number;
    }): v is Path;
    pattern(v: {
        readonly $type: string | number;
    }): v is Pattern;
    statement(v: {
        readonly $type: string | number;
    }): v is Statement;
    tokenPattern(v: {
        readonly $type: string | number;
    }): v is TokenPattern;
    tokens(v: {
        readonly $type: string | number;
    }): v is Tokens;
    type(v: {
        readonly $type: string | number;
    }): v is _Type;
    useClause(v: {
        readonly $type: string | number;
    }): v is UseClause;
}
export interface AssertGuards {
    ClosureExpressionExpr(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ClosureExpressionExpr;
    };
    DelimTokenTreeBrace(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._DelimTokenTreeBrace;
    };
    DelimTokenTreeBracket(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._DelimTokenTreeBracket;
    };
    DelimTokenTreeParen(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._DelimTokenTreeParen;
    };
    ExpressionStatementBlockEnding(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ExpressionStatementBlockEnding;
    };
    ExpressionStatementWithSemi(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ExpressionStatementWithSemi;
    };
    FieldIdentifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FieldIdentifier;
    };
    FieldPatternShorthand(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._FieldPatternShorthand;
    };
    ForeignModItemBody(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ForeignModItemBody;
    };
    FunctionTypeFnForm(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionTypeFnForm;
    };
    FunctionTypeTraitForm(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionTypeTraitForm;
    };
    ImplItemBody(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ImplItemBody;
    };
    LetChain(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LetChain;
    };
    MacroDefinitionBrace(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._MacroDefinitionBrace;
    };
    MacroDefinitionBracket(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._MacroDefinitionBracket;
    };
    MacroDefinitionParen(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._MacroDefinitionParen;
    };
    MatchArmBlockEnding(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._MatchArmBlockEnding;
    };
    ModItemInline(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ModItemInline;
    };
    PointerTypeMut(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._PointerTypeMut;
    };
    RangeExpressionBare(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._RangeExpressionBare;
    };
    ReferenceExpressionRawMut(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ReferenceExpressionRawMut;
    };
    TokenTreeBrace(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._TokenTreeBrace;
    };
    TokenTreeBracket(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._TokenTreeBracket;
    };
    TokenTreeParen(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._TokenTreeParen;
    };
    TokenTreePatternBrace(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._TokenTreePatternBrace;
    };
    TokenTreePatternBracket(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._TokenTreePatternBracket;
    };
    TokenTreePatternParen(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._TokenTreePatternParen;
    };
    TypeIdentifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeIdentifier;
    };
    VisibilityModifierCrate(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._VisibilityModifierCrate;
    };
    abstractType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AbstractType;
    };
    arguments(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Arguments;
    };
    arrayExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ArrayExpression;
    };
    arrayType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ArrayType;
    };
    assignmentExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AssignmentExpression;
    };
    associatedType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AssociatedType;
    };
    asyncBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AsyncBlock;
    };
    attribute(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Attribute;
    };
    attributeItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AttributeItem;
    };
    awaitExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AwaitExpression;
    };
    baseFieldInitializer(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BaseFieldInitializer;
    };
    binaryExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BinaryExpression;
    };
    block(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Block;
    };
    blockComment(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BlockComment;
    };
    boundedType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BoundedType;
    };
    bracketedType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BracketedType;
    };
    breakExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BreakExpression;
    };
    callExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.CallExpression;
    };
    capturedPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.CapturedPattern;
    };
    closureExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClosureExpression;
    };
    closureParameters(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClosureParameters;
    };
    compoundAssignmentExpr(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.CompoundAssignmentExpr;
    };
    constBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConstBlock;
    };
    constItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConstItem;
    };
    constParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConstParameter;
    };
    continueExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ContinueExpression;
    };
    declarationList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DeclarationList;
    };
    delimTokenTree(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DelimTokenTree;
    };
    dynamicType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DynamicType;
    };
    elseClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ElseClause;
    };
    enumItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.EnumItem;
    };
    enumVariant(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.EnumVariant;
    };
    enumVariantList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.EnumVariantList;
    };
    expressionStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExpressionStatement;
    };
    externCrateDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExternCrateDeclaration;
    };
    externModifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExternModifier;
    };
    fieldDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FieldDeclaration;
    };
    fieldDeclarationList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FieldDeclarationList;
    };
    fieldExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FieldExpression;
    };
    fieldInitializer(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FieldInitializer;
    };
    fieldInitializerList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FieldInitializerList;
    };
    fieldPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FieldPattern;
    };
    forExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ForExpression;
    };
    forLifetimes(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ForLifetimes;
    };
    foreignModItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ForeignModItem;
    };
    functionItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionItem;
    };
    functionModifiers(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionModifiers;
    };
    functionSignatureItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionSignatureItem;
    };
    functionType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionType;
    };
    genBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GenBlock;
    };
    genericFunction(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GenericFunction;
    };
    genericPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GenericPattern;
    };
    genericType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GenericType;
    };
    genericTypeWithTurbofish(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GenericTypeWithTurbofish;
    };
    higherRankedTraitBound(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.HigherRankedTraitBound;
    };
    ifExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.IfExpression;
    };
    implItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImplItem;
    };
    indexExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.IndexExpression;
    };
    innerAttributeItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.InnerAttributeItem;
    };
    label(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Label;
    };
    lastMatchArm(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LastMatchArm;
    };
    letCondition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LetCondition;
    };
    letDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LetDeclaration;
    };
    lifetime(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Lifetime;
    };
    lifetimeParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LifetimeParameter;
    };
    lineComment(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LineComment;
    };
    loopExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LoopExpression;
    };
    macroDefinition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MacroDefinition;
    };
    macroInvocation(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MacroInvocation;
    };
    macroRule(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MacroRule;
    };
    matchArm(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MatchArm;
    };
    matchBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MatchBlock;
    };
    matchExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MatchExpression;
    };
    matchPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MatchPattern;
    };
    modItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ModItem;
    };
    mutPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MutPattern;
    };
    negativeLiteral(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NegativeLiteral;
    };
    orPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.OrPattern;
    };
    orderedFieldDeclarationList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.OrderedFieldDeclarationList;
    };
    parameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Parameter;
    };
    parameters(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Parameters;
    };
    parenthesizedExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ParenthesizedExpression;
    };
    pointerType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.PointerType;
    };
    qualifiedType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.QualifiedType;
    };
    rangeExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RangeExpression;
    };
    rangePattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RangePattern;
    };
    rawStringLiteral(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RawStringLiteral;
    };
    refPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RefPattern;
    };
    referenceExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ReferenceExpression;
    };
    referencePattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ReferencePattern;
    };
    referenceType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ReferenceType;
    };
    removedTraitBound(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RemovedTraitBound;
    };
    returnExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ReturnExpression;
    };
    scopedIdentifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ScopedIdentifier;
    };
    scopedTypeIdentifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ScopedTypeIdentifier;
    };
    scopedTypeIdentifierInExpressionPosition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ScopedTypeIdentifierInExpressionPosition;
    };
    scopedUseList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ScopedUseList;
    };
    selfParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SelfParameter;
    };
    shorthandFieldInitializer(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ShorthandFieldInitializer;
    };
    slicePattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SlicePattern;
    };
    sourceFile(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SourceFile;
    };
    staticItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.StaticItem;
    };
    stringLiteral(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.StringLiteral;
    };
    structExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.StructExpression;
    };
    structItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.StructItem;
    };
    structPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.StructPattern;
    };
    tokenBindingPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TokenBindingPattern;
    };
    tokenRepetition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TokenRepetition;
    };
    tokenRepetitionPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TokenRepetitionPattern;
    };
    tokenTree(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TokenTree;
    };
    tokenTreePattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TokenTreePattern;
    };
    traitBounds(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TraitBounds;
    };
    traitItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TraitItem;
    };
    tryBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TryBlock;
    };
    tryExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TryExpression;
    };
    tupleExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TupleExpression;
    };
    tuplePattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TuplePattern;
    };
    tupleStructPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TupleStructPattern;
    };
    tupleType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TupleType;
    };
    typeArguments(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeArguments;
    };
    typeBinding(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeBinding;
    };
    typeCastExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeCastExpression;
    };
    typeItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeItem;
    };
    typeParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeParameter;
    };
    typeParameters(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeParameters;
    };
    unaryExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UnaryExpression;
    };
    unionItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UnionItem;
    };
    unsafeBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UnsafeBlock;
    };
    useAsClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UseAsClause;
    };
    useBounds(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UseBounds;
    };
    useDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UseDeclaration;
    };
    useList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UseList;
    };
    useWildcard(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UseWildcard;
    };
    variadicParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.VariadicParameter;
    };
    visibilityModifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.VisibilityModifier;
    };
    whereClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WhereClause;
    };
    wherePredicate(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WherePredicate;
    };
    whileExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WhileExpression;
    };
    yieldExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.YieldExpression;
    };
    kind<K extends keyof NamespaceMap>(v: {
        readonly $type: number;
    }, kind: K): asserts v is {
        readonly $type: number;
    };
    condition(v: {
        readonly $type: string | number;
    }): asserts v is Condition;
    declarationStatement(v: {
        readonly $type: string | number;
    }): asserts v is DeclarationStatement;
    delimTokens(v: {
        readonly $type: string | number;
    }): asserts v is DelimTokens;
    expression(v: {
        readonly $type: string | number;
    }): asserts v is Expression;
    expressionEndingWithBlock(v: {
        readonly $type: string | number;
    }): asserts v is ExpressionEndingWithBlock;
    expressionExceptRange(v: {
        readonly $type: string | number;
    }): asserts v is ExpressionExceptRange;
    literal(v: {
        readonly $type: string | number;
    }): asserts v is Literal;
    literalPattern(v: {
        readonly $type: string | number;
    }): asserts v is LiteralPattern;
    nonDelimToken(v: {
        readonly $type: string | number;
    }): asserts v is NonDelimToken;
    path(v: {
        readonly $type: string | number;
    }): asserts v is Path;
    pattern(v: {
        readonly $type: string | number;
    }): asserts v is Pattern;
    statement(v: {
        readonly $type: string | number;
    }): asserts v is Statement;
    tokenPattern(v: {
        readonly $type: string | number;
    }): asserts v is TokenPattern;
    tokens(v: {
        readonly $type: string | number;
    }): asserts v is Tokens;
    type(v: {
        readonly $type: string | number;
    }): asserts v is _Type;
    useClause(v: {
        readonly $type: string | number;
    }): asserts v is UseClause;
}
export declare const is: IsGuards;
export declare const assert: AssertGuards;
export declare function isTree<T extends {
    readonly $type: K;
}, K extends keyof NamespaceMap & string>(v: T): v is T & NamespaceMap[K]['Tree'];
export declare function isTree(v: unknown): v is AnyTreeNode;
export declare function isNode(v: {
    readonly $type: string | number;
}): v is AnyNodeData;
//# sourceMappingURL=is.d.ts.map