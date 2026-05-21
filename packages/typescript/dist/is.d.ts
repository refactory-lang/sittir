import type { AnyNodeData, AnyTreeNodeOf as AnyTreeNode } from '@sittir/types';
import { TSKindId } from './types.js';
import type { NamespaceMap, Declaration, DestructuringPattern, ExportStatementDefault, Expression, Expressions, FormalParameter, ImportIdentifier, JsxAttributeName, JsxAttributeValue, JsxChild, JsxElementName, ModuleExportName, Pattern, PrimaryExpression, PrimaryType, PropertyIdentifier, PropertyName, Semicolon, ShorthandPropertyIdentifier, ShorthandPropertyIdentifierPattern, Statement, StatementIdentifier, TupleTypeMember, Type, _Identifier, _JsxAttribute, _JsxElement, _JsxIdentifier } from './types.js';
export interface IsGuards {
    AmbientDeclarationDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._AmbientDeclarationDeclaration;
    };
    ArrowFunction_CallSignature<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ArrowFunctionUCallSignature;
    };
    ArrowFunctionParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ArrowFunctionParameter;
    };
    ClassBodyMember<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClassBodyMember;
    };
    ClassBodyMethodSig<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClassBodyMethodSig;
    };
    ClassHeritageExtendsClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ClassHeritageExtendsClause;
    };
    ClassHeritageImplementsClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ClassHeritageImplementsClause;
    };
    ExportStatementDefaultFromArm<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExportStatementDefaultFromArm;
    };
    ExportStatementDefaultFromArmClauseFrom<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExportStatementDefaultFromArmClauseFrom;
    };
    ExportStatementDefaultFromArmNsFrom<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExportStatementDefaultFromArmNsFrom;
    };
    ExportStatementDefaultFromArmStarFrom<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExportStatementDefaultFromArmStarFrom;
    };
    ExportStatementEqualsExport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ExportStatementEqualsExport;
    };
    ExportStatementNamespaceExport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ExportStatementNamespaceExport;
    };
    ExportStatementTypeExport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ExportStatementTypeExport;
    };
    ForHeaderLhs<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ForHeaderLhs;
    };
    ImportClauseDefaultImport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ImportClauseDefaultImport;
    };
    ImportClauseNamedImports<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ImportClauseNamedImports;
    };
    ImportClauseNamespaceImport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ImportClauseNamespaceImport;
    };
    ImportSpecifierName<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ImportSpecifierName;
    };
    IndexSignatureMappedTypeClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._IndexSignatureMappedTypeClause;
    };
    ParenthesizedExpressionSequence<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId._ParenthesizedExpressionSequence;
    };
    PublicFieldDefinitionAccessorOpt<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.PublicFieldDefinitionAccessorOpt;
    };
    PublicFieldDefinitionDeclareFirst<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.PublicFieldDefinitionDeclareFirst;
    };
    abstractClassDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AbstractClassDeclaration;
    };
    abstractMethodSignature<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AbstractMethodSignature;
    };
    addingTypeAnnotation<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AddingTypeAnnotation;
    };
    ambientDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AmbientDeclaration;
    };
    arguments<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Arguments;
    };
    array<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Array;
    };
    arrayPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ArrayPattern;
    };
    arrayType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ArrayType;
    };
    arrowFunction<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ArrowFunction;
    };
    asExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AsExpression;
    };
    asserts<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Asserts;
    };
    assertsAnnotation<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AssertsAnnotation;
    };
    assignmentExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AssignmentExpression;
    };
    assignmentPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AssignmentPattern;
    };
    augmentedAssignmentExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AugmentedAssignmentExpression;
    };
    awaitExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.AwaitExpression;
    };
    binaryExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BinaryExpression;
    };
    breakStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.BreakStatement;
    };
    callExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.CallExpression;
    };
    callSignature<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.CallSignature;
    };
    catchClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.CatchClause;
    };
    class_<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Class;
    };
    classBody<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClassBody;
    };
    classDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClassDeclaration;
    };
    classHeritage<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClassHeritage;
    };
    classStaticBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ClassStaticBlock;
    };
    computedPropertyName<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ComputedPropertyName;
    };
    conditionalType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConditionalType;
    };
    constraint<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Constraint;
    };
    constructSignature<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConstructSignature;
    };
    constructorType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ConstructorType;
    };
    continueStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ContinueStatement;
    };
    debuggerStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DebuggerStatement;
    };
    decorator<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Decorator;
    };
    decoratorCallExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DecoratorCallExpression;
    };
    decoratorMemberExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DecoratorMemberExpression;
    };
    decoratorParenthesizedExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DecoratorParenthesizedExpression;
    };
    defaultType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DefaultType;
    };
    doStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.DoStatement;
    };
    elseClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ElseClause;
    };
    enumAssignment<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.EnumAssignment;
    };
    enumBody<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.EnumBody;
    };
    enumDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.EnumDeclaration;
    };
    exportClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExportClause;
    };
    exportSpecifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExportSpecifier;
    };
    exportStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExportStatement;
    };
    expressionStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExpressionStatement;
    };
    extendsClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExtendsClause;
    };
    extendsTypeClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ExtendsTypeClause;
    };
    finallyClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FinallyClause;
    };
    flowMaybeType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FlowMaybeType;
    };
    forInStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ForInStatement;
    };
    forStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ForStatement;
    };
    formalParameters<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FormalParameters;
    };
    functionDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionDeclaration;
    };
    functionExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionExpression;
    };
    functionSignature<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionSignature;
    };
    functionType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.FunctionType;
    };
    generatorFunction<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GeneratorFunction;
    };
    generatorFunctionDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GeneratorFunctionDeclaration;
    };
    genericType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.GenericType;
    };
    ifStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.IfStatement;
    };
    implementsClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImplementsClause;
    };
    importAlias<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImportAlias;
    };
    importAttribute<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImportAttribute;
    };
    importClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImportClause;
    };
    importRequireClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImportRequireClause;
    };
    importSpecifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImportSpecifier;
    };
    importStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ImportStatement;
    };
    indexSignature<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.IndexSignature;
    };
    indexTypeQuery<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.IndexTypeQuery;
    };
    inferType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.InferType;
    };
    instantiationExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.InstantiationExpression;
    };
    interfaceDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.InterfaceDeclaration;
    };
    internalModule<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.InternalModule;
    };
    intersectionType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.IntersectionType;
    };
    labeledStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LabeledStatement;
    };
    lexicalDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LexicalDeclaration;
    };
    literalType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LiteralType;
    };
    lookupType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.LookupType;
    };
    mappedTypeClause<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MappedTypeClause;
    };
    memberExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MemberExpression;
    };
    methodDefinition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MethodDefinition;
    };
    methodSignature<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.MethodSignature;
    };
    module<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Module;
    };
    namedImports<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NamedImports;
    };
    namespaceExport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NamespaceExport;
    };
    namespaceImport<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NamespaceImport;
    };
    nestedIdentifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NestedIdentifier;
    };
    nestedTypeIdentifier<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NestedTypeIdentifier;
    };
    newExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NewExpression;
    };
    nonNullExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.NonNullExpression;
    };
    object<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Object;
    };
    objectAssignmentPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ObjectAssignmentPattern;
    };
    objectPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ObjectPattern;
    };
    objectType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ObjectType;
    };
    omittingTypeAnnotation<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.OmittingTypeAnnotation;
    };
    optingTypeAnnotation<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.OptingTypeAnnotation;
    };
    optionalParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.OptionalParameter;
    };
    optionalTupleParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.OptionalTupleParameter;
    };
    optionalType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.OptionalType;
    };
    pair<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Pair;
    };
    pairPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.PairPattern;
    };
    parenthesizedExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ParenthesizedExpression;
    };
    parenthesizedType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ParenthesizedType;
    };
    program<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Program;
    };
    propertySignature<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.PropertySignature;
    };
    publicFieldDefinition<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.PublicFieldDefinition;
    };
    readonlyType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ReadonlyType;
    };
    regex<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.Regex;
    };
    requiredParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RequiredParameter;
    };
    restPattern<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RestPattern;
    };
    restType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.RestType;
    };
    returnStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ReturnStatement;
    };
    satisfiesExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SatisfiesExpression;
    };
    sequenceExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SequenceExpression;
    };
    spreadElement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SpreadElement;
    };
    statementBlock<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.StatementBlock;
    };
    string<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.String;
    };
    subscriptExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SubscriptExpression;
    };
    switchBody<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SwitchBody;
    };
    switchCase<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SwitchCase;
    };
    switchDefault<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SwitchDefault;
    };
    switchStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.SwitchStatement;
    };
    templateLiteralType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TemplateLiteralType;
    };
    templateString<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TemplateString;
    };
    templateSubstitution<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TemplateSubstitution;
    };
    templateType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TemplateType;
    };
    ternaryExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TernaryExpression;
    };
    throwStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.ThrowStatement;
    };
    tryStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TryStatement;
    };
    tupleParameter<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TupleParameter;
    };
    tupleType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TupleType;
    };
    typeAliasDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeAliasDeclaration;
    };
    typeAnnotation<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeAnnotation;
    };
    typeArguments<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeArguments;
    };
    typeAssertion<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeAssertion;
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
    typePredicate<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypePredicate;
    };
    typePredicateAnnotation<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypePredicateAnnotation;
    };
    typeQuery<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.TypeQuery;
    };
    unaryExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UnaryExpression;
    };
    unionType<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UnionType;
    };
    updateExpression<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.UpdateExpression;
    };
    variableDeclaration<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.VariableDeclaration;
    };
    variableDeclarator<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.VariableDeclarator;
    };
    whileStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WhileStatement;
    };
    withStatement<T extends {
        readonly $type: number;
    }>(v: T): v is T & {
        readonly $type: TSKindId.WithStatement;
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
    destructuringPattern(v: {
        readonly $type: string | number;
    }): v is DestructuringPattern;
    exportStatementDefault(v: {
        readonly $type: string | number;
    }): v is ExportStatementDefault;
    expressions(v: {
        readonly $type: string | number;
    }): v is Expressions;
    formalParameter(v: {
        readonly $type: string | number;
    }): v is FormalParameter;
    identifier(v: {
        readonly $type: string | number;
    }): v is _Identifier;
    importIdentifier(v: {
        readonly $type: string | number;
    }): v is ImportIdentifier;
    jsxAttribute(v: {
        readonly $type: string | number;
    }): v is _JsxAttribute;
    jsxAttributeName(v: {
        readonly $type: string | number;
    }): v is JsxAttributeName;
    jsxAttributeValue(v: {
        readonly $type: string | number;
    }): v is JsxAttributeValue;
    jsxChild(v: {
        readonly $type: string | number;
    }): v is JsxChild;
    jsxElement(v: {
        readonly $type: string | number;
    }): v is _JsxElement;
    jsxElementName(v: {
        readonly $type: string | number;
    }): v is JsxElementName;
    jsxIdentifier(v: {
        readonly $type: string | number;
    }): v is _JsxIdentifier;
    moduleExportName(v: {
        readonly $type: string | number;
    }): v is ModuleExportName;
    propertyIdentifier(v: {
        readonly $type: string | number;
    }): v is PropertyIdentifier;
    propertyName(v: {
        readonly $type: string | number;
    }): v is PropertyName;
    semicolon(v: {
        readonly $type: string | number;
    }): v is Semicolon;
    shorthandPropertyIdentifier(v: {
        readonly $type: string | number;
    }): v is ShorthandPropertyIdentifier;
    shorthandPropertyIdentifierPattern(v: {
        readonly $type: string | number;
    }): v is ShorthandPropertyIdentifierPattern;
    statementIdentifier(v: {
        readonly $type: string | number;
    }): v is StatementIdentifier;
    tupleTypeMember(v: {
        readonly $type: string | number;
    }): v is TupleTypeMember;
    declaration(v: {
        readonly $type: string | number;
    }): v is Declaration;
    expression(v: {
        readonly $type: string | number;
    }): v is Expression;
    pattern(v: {
        readonly $type: string | number;
    }): v is Pattern;
    primaryExpression(v: {
        readonly $type: string | number;
    }): v is PrimaryExpression;
    primaryType(v: {
        readonly $type: string | number;
    }): v is PrimaryType;
    statement(v: {
        readonly $type: string | number;
    }): v is Statement;
    type(v: {
        readonly $type: string | number;
    }): v is Type;
}
export interface AssertGuards {
    AmbientDeclarationDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._AmbientDeclarationDeclaration;
    };
    ArrowFunction_CallSignature(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ArrowFunctionUCallSignature;
    };
    ArrowFunctionParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ArrowFunctionParameter;
    };
    ClassBodyMember(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClassBodyMember;
    };
    ClassBodyMethodSig(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClassBodyMethodSig;
    };
    ClassHeritageExtendsClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ClassHeritageExtendsClause;
    };
    ClassHeritageImplementsClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ClassHeritageImplementsClause;
    };
    ExportStatementDefaultFromArm(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExportStatementDefaultFromArm;
    };
    ExportStatementDefaultFromArmClauseFrom(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExportStatementDefaultFromArmClauseFrom;
    };
    ExportStatementDefaultFromArmNsFrom(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExportStatementDefaultFromArmNsFrom;
    };
    ExportStatementDefaultFromArmStarFrom(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExportStatementDefaultFromArmStarFrom;
    };
    ExportStatementEqualsExport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ExportStatementEqualsExport;
    };
    ExportStatementNamespaceExport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ExportStatementNamespaceExport;
    };
    ExportStatementTypeExport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ExportStatementTypeExport;
    };
    ForHeaderLhs(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ForHeaderLhs;
    };
    ImportClauseDefaultImport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ImportClauseDefaultImport;
    };
    ImportClauseNamedImports(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ImportClauseNamedImports;
    };
    ImportClauseNamespaceImport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ImportClauseNamespaceImport;
    };
    ImportSpecifierName(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ImportSpecifierName;
    };
    IndexSignatureMappedTypeClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._IndexSignatureMappedTypeClause;
    };
    ParenthesizedExpressionSequence(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId._ParenthesizedExpressionSequence;
    };
    PublicFieldDefinitionAccessorOpt(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.PublicFieldDefinitionAccessorOpt;
    };
    PublicFieldDefinitionDeclareFirst(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.PublicFieldDefinitionDeclareFirst;
    };
    abstractClassDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AbstractClassDeclaration;
    };
    abstractMethodSignature(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AbstractMethodSignature;
    };
    addingTypeAnnotation(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AddingTypeAnnotation;
    };
    ambientDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AmbientDeclaration;
    };
    arguments(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Arguments;
    };
    array(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Array;
    };
    arrayPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ArrayPattern;
    };
    arrayType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ArrayType;
    };
    arrowFunction(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ArrowFunction;
    };
    asExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AsExpression;
    };
    asserts(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Asserts;
    };
    assertsAnnotation(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AssertsAnnotation;
    };
    assignmentExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AssignmentExpression;
    };
    assignmentPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AssignmentPattern;
    };
    augmentedAssignmentExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AugmentedAssignmentExpression;
    };
    awaitExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.AwaitExpression;
    };
    binaryExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BinaryExpression;
    };
    breakStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.BreakStatement;
    };
    callExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.CallExpression;
    };
    callSignature(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.CallSignature;
    };
    catchClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.CatchClause;
    };
    class_(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Class;
    };
    classBody(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClassBody;
    };
    classDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClassDeclaration;
    };
    classHeritage(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClassHeritage;
    };
    classStaticBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ClassStaticBlock;
    };
    computedPropertyName(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ComputedPropertyName;
    };
    conditionalType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConditionalType;
    };
    constraint(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Constraint;
    };
    constructSignature(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConstructSignature;
    };
    constructorType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ConstructorType;
    };
    continueStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ContinueStatement;
    };
    debuggerStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DebuggerStatement;
    };
    decorator(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Decorator;
    };
    decoratorCallExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DecoratorCallExpression;
    };
    decoratorMemberExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DecoratorMemberExpression;
    };
    decoratorParenthesizedExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DecoratorParenthesizedExpression;
    };
    defaultType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DefaultType;
    };
    doStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.DoStatement;
    };
    elseClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ElseClause;
    };
    enumAssignment(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.EnumAssignment;
    };
    enumBody(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.EnumBody;
    };
    enumDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.EnumDeclaration;
    };
    exportClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExportClause;
    };
    exportSpecifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExportSpecifier;
    };
    exportStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExportStatement;
    };
    expressionStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExpressionStatement;
    };
    extendsClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExtendsClause;
    };
    extendsTypeClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ExtendsTypeClause;
    };
    finallyClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FinallyClause;
    };
    flowMaybeType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FlowMaybeType;
    };
    forInStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ForInStatement;
    };
    forStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ForStatement;
    };
    formalParameters(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FormalParameters;
    };
    functionDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionDeclaration;
    };
    functionExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionExpression;
    };
    functionSignature(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionSignature;
    };
    functionType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.FunctionType;
    };
    generatorFunction(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GeneratorFunction;
    };
    generatorFunctionDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GeneratorFunctionDeclaration;
    };
    genericType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.GenericType;
    };
    ifStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.IfStatement;
    };
    implementsClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImplementsClause;
    };
    importAlias(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImportAlias;
    };
    importAttribute(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImportAttribute;
    };
    importClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImportClause;
    };
    importRequireClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImportRequireClause;
    };
    importSpecifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImportSpecifier;
    };
    importStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ImportStatement;
    };
    indexSignature(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.IndexSignature;
    };
    indexTypeQuery(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.IndexTypeQuery;
    };
    inferType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.InferType;
    };
    instantiationExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.InstantiationExpression;
    };
    interfaceDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.InterfaceDeclaration;
    };
    internalModule(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.InternalModule;
    };
    intersectionType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.IntersectionType;
    };
    labeledStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LabeledStatement;
    };
    lexicalDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LexicalDeclaration;
    };
    literalType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LiteralType;
    };
    lookupType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.LookupType;
    };
    mappedTypeClause(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MappedTypeClause;
    };
    memberExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MemberExpression;
    };
    methodDefinition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MethodDefinition;
    };
    methodSignature(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.MethodSignature;
    };
    module(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Module;
    };
    namedImports(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NamedImports;
    };
    namespaceExport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NamespaceExport;
    };
    namespaceImport(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NamespaceImport;
    };
    nestedIdentifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NestedIdentifier;
    };
    nestedTypeIdentifier(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NestedTypeIdentifier;
    };
    newExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NewExpression;
    };
    nonNullExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.NonNullExpression;
    };
    object(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Object;
    };
    objectAssignmentPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ObjectAssignmentPattern;
    };
    objectPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ObjectPattern;
    };
    objectType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ObjectType;
    };
    omittingTypeAnnotation(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.OmittingTypeAnnotation;
    };
    optingTypeAnnotation(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.OptingTypeAnnotation;
    };
    optionalParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.OptionalParameter;
    };
    optionalTupleParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.OptionalTupleParameter;
    };
    optionalType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.OptionalType;
    };
    pair(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Pair;
    };
    pairPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.PairPattern;
    };
    parenthesizedExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ParenthesizedExpression;
    };
    parenthesizedType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ParenthesizedType;
    };
    program(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Program;
    };
    propertySignature(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.PropertySignature;
    };
    publicFieldDefinition(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.PublicFieldDefinition;
    };
    readonlyType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ReadonlyType;
    };
    regex(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.Regex;
    };
    requiredParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RequiredParameter;
    };
    restPattern(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RestPattern;
    };
    restType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.RestType;
    };
    returnStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ReturnStatement;
    };
    satisfiesExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SatisfiesExpression;
    };
    sequenceExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SequenceExpression;
    };
    spreadElement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SpreadElement;
    };
    statementBlock(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.StatementBlock;
    };
    string(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.String;
    };
    subscriptExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SubscriptExpression;
    };
    switchBody(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SwitchBody;
    };
    switchCase(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SwitchCase;
    };
    switchDefault(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SwitchDefault;
    };
    switchStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.SwitchStatement;
    };
    templateLiteralType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TemplateLiteralType;
    };
    templateString(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TemplateString;
    };
    templateSubstitution(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TemplateSubstitution;
    };
    templateType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TemplateType;
    };
    ternaryExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TernaryExpression;
    };
    throwStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.ThrowStatement;
    };
    tryStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TryStatement;
    };
    tupleParameter(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TupleParameter;
    };
    tupleType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TupleType;
    };
    typeAliasDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeAliasDeclaration;
    };
    typeAnnotation(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeAnnotation;
    };
    typeArguments(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeArguments;
    };
    typeAssertion(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeAssertion;
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
    typePredicate(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypePredicate;
    };
    typePredicateAnnotation(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypePredicateAnnotation;
    };
    typeQuery(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.TypeQuery;
    };
    unaryExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UnaryExpression;
    };
    unionType(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UnionType;
    };
    updateExpression(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.UpdateExpression;
    };
    variableDeclaration(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.VariableDeclaration;
    };
    variableDeclarator(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.VariableDeclarator;
    };
    whileStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WhileStatement;
    };
    withStatement(v: {
        readonly $type: number;
    }): asserts v is {
        readonly $type: TSKindId.WithStatement;
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
    destructuringPattern(v: {
        readonly $type: string | number;
    }): asserts v is DestructuringPattern;
    exportStatementDefault(v: {
        readonly $type: string | number;
    }): asserts v is ExportStatementDefault;
    expressions(v: {
        readonly $type: string | number;
    }): asserts v is Expressions;
    formalParameter(v: {
        readonly $type: string | number;
    }): asserts v is FormalParameter;
    identifier(v: {
        readonly $type: string | number;
    }): asserts v is _Identifier;
    importIdentifier(v: {
        readonly $type: string | number;
    }): asserts v is ImportIdentifier;
    jsxAttribute(v: {
        readonly $type: string | number;
    }): asserts v is _JsxAttribute;
    jsxAttributeName(v: {
        readonly $type: string | number;
    }): asserts v is JsxAttributeName;
    jsxAttributeValue(v: {
        readonly $type: string | number;
    }): asserts v is JsxAttributeValue;
    jsxChild(v: {
        readonly $type: string | number;
    }): asserts v is JsxChild;
    jsxElement(v: {
        readonly $type: string | number;
    }): asserts v is _JsxElement;
    jsxElementName(v: {
        readonly $type: string | number;
    }): asserts v is JsxElementName;
    jsxIdentifier(v: {
        readonly $type: string | number;
    }): asserts v is _JsxIdentifier;
    moduleExportName(v: {
        readonly $type: string | number;
    }): asserts v is ModuleExportName;
    propertyIdentifier(v: {
        readonly $type: string | number;
    }): asserts v is PropertyIdentifier;
    propertyName(v: {
        readonly $type: string | number;
    }): asserts v is PropertyName;
    semicolon(v: {
        readonly $type: string | number;
    }): asserts v is Semicolon;
    shorthandPropertyIdentifier(v: {
        readonly $type: string | number;
    }): asserts v is ShorthandPropertyIdentifier;
    shorthandPropertyIdentifierPattern(v: {
        readonly $type: string | number;
    }): asserts v is ShorthandPropertyIdentifierPattern;
    statementIdentifier(v: {
        readonly $type: string | number;
    }): asserts v is StatementIdentifier;
    tupleTypeMember(v: {
        readonly $type: string | number;
    }): asserts v is TupleTypeMember;
    declaration(v: {
        readonly $type: string | number;
    }): asserts v is Declaration;
    expression(v: {
        readonly $type: string | number;
    }): asserts v is Expression;
    pattern(v: {
        readonly $type: string | number;
    }): asserts v is Pattern;
    primaryExpression(v: {
        readonly $type: string | number;
    }): asserts v is PrimaryExpression;
    primaryType(v: {
        readonly $type: string | number;
    }): asserts v is PrimaryType;
    statement(v: {
        readonly $type: string | number;
    }): asserts v is Statement;
    type(v: {
        readonly $type: string | number;
    }): asserts v is Type;
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