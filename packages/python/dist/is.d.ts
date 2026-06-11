import type { AnyNodeData, AnyTreeNodeOf as AnyTreeNode } from '@sittir/types';
import { TSKindId } from './types.js';
import type { NamespaceMap, CompoundStatement, DictPatternKv, Expression, ExpressionWithinForInClause, Expressions, FExpression, LeftHandSide, NamedExpressionLhs, Parameter, Pattern, PrimaryExpression, RightHandSide, SimplePattern, SimpleStatement, Statement } from './types.js';
export interface IsGuards {
    AsPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._AsPattern;
    };
    ComprehensionClauses<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ComprehensionClauses;
    };
    ExceptClauseList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExceptClauseList;
    };
    ExpressionStatementTuple<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExpressionStatementTuple;
    };
    ListPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ListPattern;
    };
    MatchBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MatchBlock;
    };
    SimplePatternNegative<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SimplePatternNegative;
    };
    SimpleStatements<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SimpleStatements;
    };
    SliceGroup1<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._SliceGroup1;
    };
    TuplePattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._TuplePattern;
    };
    WithClauseBare<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WithClauseBare;
    };
    WithClauseParen<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WithClauseParen;
    };
    aliasedImport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AliasedImport;
    };
    argumentList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ArgumentList;
    };
    asPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AsPattern;
    };
    assertStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AssertStatement;
    };
    assignment<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Assignment;
    };
    attribute<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Attribute;
    };
    augmentedAssignment<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AugmentedAssignment;
    };
    await<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Await;
    };
    binaryOperator<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BinaryOperator;
    };
    block<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Block;
    };
    booleanOperator<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BooleanOperator;
    };
    call<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Call;
    };
    caseClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.CaseClause;
    };
    casePattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.CasePattern;
    };
    chevron<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Chevron;
    };
    classDefinition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClassDefinition;
    };
    classPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClassPattern;
    };
    comparisonOperator<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ComparisonOperator;
    };
    complexPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ComplexPattern;
    };
    concatenatedString<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConcatenatedString;
    };
    conditionalExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConditionalExpression;
    };
    constrainedType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConstrainedType;
    };
    decoratedDefinition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DecoratedDefinition;
    };
    decorator<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Decorator;
    };
    defaultParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DefaultParameter;
    };
    deleteStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DeleteStatement;
    };
    dictPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DictPattern;
    };
    dictionary<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Dictionary;
    };
    dictionaryComprehension<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DictionaryComprehension;
    };
    dictionarySplat<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DictionarySplat;
    };
    dictionarySplatPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DictionarySplatPattern;
    };
    dottedName<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DottedName;
    };
    elifClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ElifClause;
    };
    elseClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ElseClause;
    };
    exceptClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExceptClause;
    };
    execStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExecStatement;
    };
    expressionList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExpressionList;
    };
    expressionStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExpressionStatement;
    };
    finallyClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FinallyClause;
    };
    forInClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ForInClause;
    };
    forStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ForStatement;
    };
    formatSpecifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FormatSpecifier;
    };
    functionDefinition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionDefinition;
    };
    futureImportStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FutureImportStatement;
    };
    generatorExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GeneratorExpression;
    };
    genericType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GenericType;
    };
    globalStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GlobalStatement;
    };
    ifClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.IfClause;
    };
    ifStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.IfStatement;
    };
    importFromStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImportFromStatement;
    };
    importStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImportStatement;
    };
    interpolation<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Interpolation;
    };
    keywordArgument<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.KeywordArgument;
    };
    keywordPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.KeywordPattern;
    };
    lambda<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Lambda;
    };
    lambdaParameters<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LambdaParameters;
    };
    lambdaWithinForInClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LambdaWithinForInClause;
    };
    list<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.List;
    };
    listComprehension<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ListComprehension;
    };
    listPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ListPattern;
    };
    listSplat<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ListSplat;
    };
    listSplatPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ListSplatPattern;
    };
    matchStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MatchStatement;
    };
    memberType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MemberType;
    };
    module<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Module;
    };
    namedExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NamedExpression;
    };
    nonlocalStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NonlocalStatement;
    };
    notOperator<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NotOperator;
    };
    pair<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Pair;
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
    parenthesizedListSplat<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ParenthesizedListSplat;
    };
    patternList<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.PatternList;
    };
    printStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.PrintStatement;
    };
    raiseStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RaiseStatement;
    };
    relativeImport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RelativeImport;
    };
    returnStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ReturnStatement;
    };
    set<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Set;
    };
    setComprehension<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SetComprehension;
    };
    slice<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Slice;
    };
    splatPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SplatPattern;
    };
    splatType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SplatType;
    };
    string<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.String;
    };
    stringContent<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.StringContent;
    };
    subscript<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Subscript;
    };
    tryStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TryStatement;
    };
    tuple<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Tuple;
    };
    tuplePattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TuplePattern;
    };
    type<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Type;
    };
    typeAliasStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeAliasStatement;
    };
    typeParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeParameter;
    };
    typedDefaultParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypedDefaultParameter;
    };
    typedParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypedParameter;
    };
    unaryOperator<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UnaryOperator;
    };
    unionPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UnionPattern;
    };
    unionType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UnionType;
    };
    whileStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WhileStatement;
    };
    withClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WithClause;
    };
    withItem<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WithItem;
    };
    withStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WithStatement;
    };
    yield_<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Yield;
    };
    kind<K extends keyof NamespaceMap>(v: {
        readonly $type: number;
    }, kind: K): v is {
        readonly $type: number;
    };
    compoundStatement(v: {
        readonly $type: string | number;
    }): v is CompoundStatement;
    dictPatternKv(v: {
        readonly $type: string | number;
    }): v is DictPatternKv;
    expressionWithinForInClause(v: {
        readonly $type: string | number;
    }): v is ExpressionWithinForInClause;
    expressions(v: {
        readonly $type: string | number;
    }): v is Expressions;
    fExpression(v: {
        readonly $type: string | number;
    }): v is FExpression;
    leftHandSide(v: {
        readonly $type: string | number;
    }): v is LeftHandSide;
    namedExpressionLhs(v: {
        readonly $type: string | number;
    }): v is NamedExpressionLhs;
    rightHandSide(v: {
        readonly $type: string | number;
    }): v is RightHandSide;
    simplePattern(v: {
        readonly $type: string | number;
    }): v is SimplePattern;
    simpleStatement(v: {
        readonly $type: string | number;
    }): v is SimpleStatement;
    statement(v: {
        readonly $type: string | number;
    }): v is Statement;
    expression(v: {
        readonly $type: string | number;
    }): v is Expression;
    parameter(v: {
        readonly $type: string | number;
    }): v is Parameter;
    pattern(v: {
        readonly $type: string | number;
    }): v is Pattern;
    primaryExpression(v: {
        readonly $type: string | number;
    }): v is PrimaryExpression;
}
export interface AssertGuards {
    AsPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._AsPattern;
    };
    ComprehensionClauses(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ComprehensionClauses;
    };
    ExceptClauseList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExceptClauseList;
    };
    ExpressionStatementTuple(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExpressionStatementTuple;
    };
    ListPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ListPattern;
    };
    MatchBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MatchBlock;
    };
    SimplePatternNegative(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SimplePatternNegative;
    };
    SimpleStatements(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SimpleStatements;
    };
    SliceGroup1(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._SliceGroup1;
    };
    TuplePattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._TuplePattern;
    };
    WithClauseBare(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WithClauseBare;
    };
    WithClauseParen(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WithClauseParen;
    };
    aliasedImport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AliasedImport;
    };
    argumentList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ArgumentList;
    };
    asPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AsPattern;
    };
    assertStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AssertStatement;
    };
    assignment(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Assignment;
    };
    attribute(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Attribute;
    };
    augmentedAssignment(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AugmentedAssignment;
    };
    await(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Await;
    };
    binaryOperator(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BinaryOperator;
    };
    block(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Block;
    };
    booleanOperator(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BooleanOperator;
    };
    call(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Call;
    };
    caseClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.CaseClause;
    };
    casePattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.CasePattern;
    };
    chevron(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Chevron;
    };
    classDefinition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClassDefinition;
    };
    classPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClassPattern;
    };
    comparisonOperator(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ComparisonOperator;
    };
    complexPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ComplexPattern;
    };
    concatenatedString(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConcatenatedString;
    };
    conditionalExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConditionalExpression;
    };
    constrainedType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConstrainedType;
    };
    decoratedDefinition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DecoratedDefinition;
    };
    decorator(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Decorator;
    };
    defaultParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DefaultParameter;
    };
    deleteStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DeleteStatement;
    };
    dictPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DictPattern;
    };
    dictionary(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Dictionary;
    };
    dictionaryComprehension(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DictionaryComprehension;
    };
    dictionarySplat(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DictionarySplat;
    };
    dictionarySplatPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DictionarySplatPattern;
    };
    dottedName(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DottedName;
    };
    elifClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ElifClause;
    };
    elseClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ElseClause;
    };
    exceptClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExceptClause;
    };
    execStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExecStatement;
    };
    expressionList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExpressionList;
    };
    expressionStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExpressionStatement;
    };
    finallyClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FinallyClause;
    };
    forInClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ForInClause;
    };
    forStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ForStatement;
    };
    formatSpecifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FormatSpecifier;
    };
    functionDefinition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionDefinition;
    };
    futureImportStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FutureImportStatement;
    };
    generatorExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GeneratorExpression;
    };
    genericType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GenericType;
    };
    globalStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GlobalStatement;
    };
    ifClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.IfClause;
    };
    ifStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.IfStatement;
    };
    importFromStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImportFromStatement;
    };
    importStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImportStatement;
    };
    interpolation(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Interpolation;
    };
    keywordArgument(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.KeywordArgument;
    };
    keywordPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.KeywordPattern;
    };
    lambda(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Lambda;
    };
    lambdaParameters(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LambdaParameters;
    };
    lambdaWithinForInClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LambdaWithinForInClause;
    };
    list(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.List;
    };
    listComprehension(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ListComprehension;
    };
    listPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ListPattern;
    };
    listSplat(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ListSplat;
    };
    listSplatPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ListSplatPattern;
    };
    matchStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MatchStatement;
    };
    memberType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MemberType;
    };
    module(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Module;
    };
    namedExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NamedExpression;
    };
    nonlocalStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NonlocalStatement;
    };
    notOperator(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NotOperator;
    };
    pair(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Pair;
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
    parenthesizedListSplat(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ParenthesizedListSplat;
    };
    patternList(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.PatternList;
    };
    printStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.PrintStatement;
    };
    raiseStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RaiseStatement;
    };
    relativeImport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RelativeImport;
    };
    returnStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ReturnStatement;
    };
    set(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Set;
    };
    setComprehension(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SetComprehension;
    };
    slice(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Slice;
    };
    splatPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SplatPattern;
    };
    splatType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SplatType;
    };
    string(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.String;
    };
    stringContent(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.StringContent;
    };
    subscript(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Subscript;
    };
    tryStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TryStatement;
    };
    tuple(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Tuple;
    };
    tuplePattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TuplePattern;
    };
    type(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Type;
    };
    typeAliasStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeAliasStatement;
    };
    typeParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeParameter;
    };
    typedDefaultParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypedDefaultParameter;
    };
    typedParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypedParameter;
    };
    unaryOperator(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UnaryOperator;
    };
    unionPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UnionPattern;
    };
    unionType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UnionType;
    };
    whileStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WhileStatement;
    };
    withClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WithClause;
    };
    withItem(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WithItem;
    };
    withStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WithStatement;
    };
    yield_(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Yield;
    };
    kind<K extends keyof NamespaceMap>(v: {
        readonly $type: number;
    }, kind: K): asserts v is {
        readonly $type: number;
    };
    compoundStatement(v: {
        readonly $type: string | number;
    }): asserts v is CompoundStatement;
    dictPatternKv(v: {
        readonly $type: string | number;
    }): asserts v is DictPatternKv;
    expressionWithinForInClause(v: {
        readonly $type: string | number;
    }): asserts v is ExpressionWithinForInClause;
    expressions(v: {
        readonly $type: string | number;
    }): asserts v is Expressions;
    fExpression(v: {
        readonly $type: string | number;
    }): asserts v is FExpression;
    leftHandSide(v: {
        readonly $type: string | number;
    }): asserts v is LeftHandSide;
    namedExpressionLhs(v: {
        readonly $type: string | number;
    }): asserts v is NamedExpressionLhs;
    rightHandSide(v: {
        readonly $type: string | number;
    }): asserts v is RightHandSide;
    simplePattern(v: {
        readonly $type: string | number;
    }): asserts v is SimplePattern;
    simpleStatement(v: {
        readonly $type: string | number;
    }): asserts v is SimpleStatement;
    statement(v: {
        readonly $type: string | number;
    }): asserts v is Statement;
    expression(v: {
        readonly $type: string | number;
    }): asserts v is Expression;
    parameter(v: {
        readonly $type: string | number;
    }): asserts v is Parameter;
    pattern(v: {
        readonly $type: string | number;
    }): asserts v is Pattern;
    primaryExpression(v: {
        readonly $type: string | number;
    }): asserts v is PrimaryExpression;
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