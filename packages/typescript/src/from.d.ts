import type * as T from './types.js';
import { TSKindId } from './types.js';
import type { AnyNodeData, ConfigOf } from '@sittir/types';
export declare const _fromMap: {
    readonly "abstract_class_declaration": typeof abstractClassDeclarationFrom;
    readonly "abstract_method_signature": typeof abstractMethodSignatureFrom;
    readonly "accessibility_modifier": typeof accessibilityModifierFrom;
    readonly "adding_type_annotation": typeof addingTypeAnnotationFrom;
    readonly "ambient_declaration": typeof ambientDeclarationFrom;
    readonly "arguments": typeof arguments_From;
    readonly "array": typeof arrayFrom;
    readonly "array_pattern": typeof arrayPatternFrom;
    readonly "array_type": typeof arrayTypeFrom;
    readonly "arrow_function_parameter": typeof arrowFunctionParameterFrom;
    readonly "arrow_function__call_signature": typeof arrowFunctionUCallSignatureFrom;
    readonly "arrow_function": typeof arrowFunctionFrom;
    readonly "as_expression": typeof asExpressionFrom;
    readonly "asserts": typeof assertsFrom;
    readonly "asserts_annotation": typeof assertsAnnotationFrom;
    readonly "assignment_expression": typeof assignmentExpressionFrom;
    readonly "assignment_pattern": typeof assignmentPatternFrom;
    readonly "augmented_assignment_expression": typeof augmentedAssignmentExpressionFrom;
    readonly "await_expression": typeof awaitExpressionFrom;
    readonly "binary_expression": typeof binaryExpressionFrom;
    readonly "break_statement": typeof breakStatementFrom;
    readonly "call_expression": typeof callExpressionFrom;
    readonly "call_signature": typeof callSignatureFrom;
    readonly "catch_clause": typeof catchClauseFrom;
    readonly "class": typeof class_From;
    readonly "class_body": typeof classBodyFrom;
    readonly "class_declaration": typeof classDeclarationFrom;
    readonly "class_heritage_extends_clause": typeof classHeritageExtendsClauseFrom;
    readonly "class_heritage_implements_clause": typeof classHeritageImplementsClauseFrom;
    readonly "class_heritage": typeof classHeritageFrom;
    readonly "class_static_block": typeof classStaticBlockFrom;
    readonly "comment": typeof commentFrom;
    readonly "computed_property_name": typeof computedPropertyNameFrom;
    readonly "conditional_type": typeof conditionalTypeFrom;
    readonly "constraint": typeof constraintFrom;
    readonly "construct_signature": typeof constructSignatureFrom;
    readonly "constructor_type": typeof constructorTypeFrom;
    readonly "continue_statement": typeof continueStatementFrom;
    readonly "debugger_statement": typeof debuggerStatementFrom;
    readonly "decorator": typeof decoratorFrom;
    readonly "decorator_call_expression": typeof decoratorCallExpressionFrom;
    readonly "decorator_member_expression": typeof decoratorMemberExpressionFrom;
    readonly "decorator_parenthesized_expression": typeof decoratorParenthesizedExpressionFrom;
    readonly "default_type": typeof defaultTypeFrom;
    readonly "do_statement": typeof doStatementFrom;
    readonly "else_clause": typeof elseClauseFrom;
    readonly "enum_assignment": typeof enumAssignmentFrom;
    readonly "enum_body": typeof enumBodyFrom;
    readonly "enum_declaration": typeof enumDeclarationFrom;
    readonly "escape_sequence": typeof escapeSequenceFrom;
    readonly "export_clause": typeof exportClauseFrom;
    readonly "export_specifier": typeof exportSpecifierFrom;
    readonly "export_statement_type_export": typeof exportStatementTypeExportFrom;
    readonly "export_statement_equals_export": typeof exportStatementEqualsExportFrom;
    readonly "export_statement_namespace_export": typeof exportStatementNamespaceExportFrom;
    readonly "export_statement": typeof exportStatementFrom;
    readonly "expression_statement": typeof expressionStatementFrom;
    readonly "extends_clause": typeof extendsClauseFrom;
    readonly "extends_type_clause": typeof extendsTypeClauseFrom;
    readonly "false": typeof false_From;
    readonly "finally_clause": typeof finallyClauseFrom;
    readonly "flow_maybe_type": typeof flowMaybeTypeFrom;
    readonly "for_in_statement": typeof forInStatementFrom;
    readonly "for_statement": typeof forStatementFrom;
    readonly "formal_parameters": typeof formalParametersFrom;
    readonly "function_declaration": typeof functionDeclarationFrom;
    readonly "function_expression": typeof functionExpressionFrom;
    readonly "function_signature": typeof functionSignatureFrom;
    readonly "function_type": typeof functionTypeFrom;
    readonly "generator_function": typeof generatorFunctionFrom;
    readonly "generator_function_declaration": typeof generatorFunctionDeclarationFrom;
    readonly "generic_type": typeof genericTypeFrom;
    readonly "hash_bang_line": typeof hashBangLineFrom;
    readonly "identifier": typeof identifierFrom;
    readonly "if_statement": typeof ifStatementFrom;
    readonly "implements_clause": typeof implementsClauseFrom;
    readonly "import": typeof import_From;
    readonly "import_alias": typeof importAliasFrom;
    readonly "import_attribute": typeof importAttributeFrom;
    readonly "import_clause_namespace_import": typeof importClauseNamespaceImportFrom;
    readonly "import_clause_named_imports": typeof importClauseNamedImportsFrom;
    readonly "import_clause_default_import": typeof importClauseDefaultImportFrom;
    readonly "import_clause": typeof importClauseFrom;
    readonly "import_require_clause": typeof importRequireClauseFrom;
    readonly "import_specifier_name": typeof importSpecifierNameFrom;
    readonly "import_specifier": typeof importSpecifierFrom;
    readonly "import_statement": typeof importStatementFrom;
    readonly "index_signature_mapped_type_clause": typeof indexSignatureMappedTypeClauseFrom;
    readonly "index_signature": typeof indexSignatureFrom;
    readonly "index_type_query": typeof indexTypeQueryFrom;
    readonly "infer_type": typeof inferTypeFrom;
    readonly "instantiation_expression": typeof instantiationExpressionFrom;
    readonly "interface_declaration": typeof interfaceDeclarationFrom;
    readonly "internal_module": typeof internalModuleFrom;
    readonly "intersection_type": typeof intersectionTypeFrom;
    readonly "labeled_statement": typeof labeledStatementFrom;
    readonly "lexical_declaration": typeof lexicalDeclarationFrom;
    readonly "literal_type": typeof literalTypeFrom;
    readonly "lookup_type": typeof lookupTypeFrom;
    readonly "mapped_type_clause": typeof mappedTypeClauseFrom;
    readonly "member_expression": typeof memberExpressionFrom;
    readonly "meta_property": typeof metaPropertyFrom;
    readonly "method_definition": typeof methodDefinitionFrom;
    readonly "method_signature": typeof methodSignatureFrom;
    readonly "module": typeof moduleFrom;
    readonly "named_imports": typeof namedImportsFrom;
    readonly "namespace_export": typeof namespaceExportFrom;
    readonly "namespace_import": typeof namespaceImportFrom;
    readonly "nested_identifier": typeof nestedIdentifierFrom;
    readonly "nested_type_identifier": typeof nestedTypeIdentifierFrom;
    readonly "new_expression": typeof newExpressionFrom;
    readonly "non_null_expression": typeof nonNullExpressionFrom;
    readonly "null": typeof null_From;
    readonly "number": typeof numberFrom;
    readonly "object": typeof objectFrom;
    readonly "object_assignment_pattern": typeof objectAssignmentPatternFrom;
    readonly "object_pattern": typeof objectPatternFrom;
    readonly "object_type": typeof objectTypeFrom;
    readonly "omitting_type_annotation": typeof omittingTypeAnnotationFrom;
    readonly "opting_type_annotation": typeof optingTypeAnnotationFrom;
    readonly "optional_parameter": typeof optionalParameterFrom;
    readonly "optional_tuple_parameter": typeof optionalTupleParameterFrom;
    readonly "optional_type": typeof optionalTypeFrom;
    readonly "override_modifier": typeof overrideModifierFrom;
    readonly "pair": typeof pairFrom;
    readonly "pair_pattern": typeof pairPatternFrom;
    readonly "parenthesized_expression_sequence": typeof parenthesizedExpressionSequenceFrom;
    readonly "parenthesized_expression": typeof parenthesizedExpressionFrom;
    readonly "parenthesized_type": typeof parenthesizedTypeFrom;
    readonly "predefined_type": typeof predefinedTypeFrom;
    readonly "private_property_identifier": typeof privatePropertyIdentifierFrom;
    readonly "program": typeof programFrom;
    readonly "property_signature": typeof propertySignatureFrom;
    readonly "public_field_definition": typeof publicFieldDefinitionFrom;
    readonly "readonly_type": typeof readonlyTypeFrom;
    readonly "regex": typeof regexFrom;
    readonly "regex_flags": typeof regexFlagsFrom;
    readonly "regex_pattern": typeof regexPatternFrom;
    readonly "required_parameter": typeof requiredParameterFrom;
    readonly "rest_pattern": typeof restPatternFrom;
    readonly "rest_type": typeof restTypeFrom;
    readonly "return_statement": typeof returnStatementFrom;
    readonly "satisfies_expression": typeof satisfiesExpressionFrom;
    readonly "sequence_expression": typeof sequenceExpressionFrom;
    readonly "spread_element": typeof spreadElementFrom;
    readonly "statement_block": typeof statementBlockFrom;
    readonly "string_double": typeof stringDoubleFrom;
    readonly "string_single": typeof stringSingleFrom;
    readonly "string": typeof stringFrom;
    readonly "subscript_expression": typeof subscriptExpressionFrom;
    readonly "super": typeof superFrom;
    readonly "switch_body": typeof switchBodyFrom;
    readonly "switch_case": typeof switchCaseFrom;
    readonly "switch_default": typeof switchDefaultFrom;
    readonly "switch_statement": typeof switchStatementFrom;
    readonly "template_literal_type": typeof templateLiteralTypeFrom;
    readonly "template_string": typeof templateStringFrom;
    readonly "template_substitution": typeof templateSubstitutionFrom;
    readonly "template_type": typeof templateTypeFrom;
    readonly "ternary_expression": typeof ternaryExpressionFrom;
    readonly "this": typeof thisFrom;
    readonly "throw_statement": typeof throwStatementFrom;
    readonly "true": typeof true_From;
    readonly "try_statement": typeof tryStatementFrom;
    readonly "tuple_parameter": typeof tupleParameterFrom;
    readonly "tuple_type": typeof tupleTypeFrom;
    readonly "type_alias_declaration": typeof typeAliasDeclarationFrom;
    readonly "type_annotation": typeof typeAnnotationFrom;
    readonly "type_arguments": typeof typeArgumentsFrom;
    readonly "type_assertion": typeof typeAssertionFrom;
    readonly "type_parameter": typeof typeParameterFrom;
    readonly "type_parameters": typeof typeParametersFrom;
    readonly "type_predicate": typeof typePredicateFrom;
    readonly "type_predicate_annotation": typeof typePredicateAnnotationFrom;
    readonly "type_query": typeof typeQueryFrom;
    readonly "unary_expression": typeof unaryExpressionFrom;
    readonly "undefined": typeof undefined_From;
    readonly "unescaped_double_string_fragment": typeof unescapedDoubleStringFragmentFrom;
    readonly "unescaped_single_string_fragment": typeof unescapedSingleStringFragmentFrom;
    readonly "union_type": typeof unionTypeFrom;
    readonly "update_expression": typeof updateExpressionFrom;
    readonly "variable_declaration": typeof variableDeclarationFrom;
    readonly "variable_declarator": typeof variableDeclaratorFrom;
    readonly "while_statement": typeof whileStatementFrom;
    readonly "with_statement": typeof withStatementFrom;
    readonly "yield_expression": typeof yieldExpressionFrom;
    readonly "html_comment": typeof htmlCommentFrom;
    readonly "||": typeof ororFrom;
    readonly "jsx_text": typeof jsxTextFrom;
};
export type _FromMap = typeof _fromMap;
export declare function abstractClassDeclarationFrom(input: T.AbstractClassDeclaration.Loose): T.AbstractClassDeclaration;
export declare function abstractMethodSignatureFrom(input: T.AbstractMethodSignature.Loose): T.AbstractMethodSignature | ({
    $type: TSKindId.AbstractMethodSignature;
    $source: 2;
    $named: true;
    _accessibility_modifier: "private" | "protected" | "public" | undefined;
    _override_modifier: "override" | undefined;
    _accessor_kind: "*" | "get" | "set" | undefined;
    _name: T.PropertyName;
    _optional_marker: "?" | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    accessibilityModifier(): "private" | "protected" | "public" | undefined;
    overrideModifier(): "override" | undefined;
    accessorKind(): "*" | "get" | "set" | undefined;
    name(): T.PropertyName;
    optionalMarker(): "?" | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        accessibilityModifier: (value?: T._AccessibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (value?: import("@sittir/types").BooleanKeyword<T._OverrideModifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessorKind: (value?: T.AccessorKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.PropertyName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalMarker: (value?: import("@sittir/types").BooleanKeyword<T.OptionalMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function accessibilityModifierFrom(input: string | T.AccessibilityModifier): T.AccessibilityModifier | ({
    $type: TSKindId.AccessibilityModifier;
    $source: 2;
    $named: true;
    $text: "private" | "protected" | "public";
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function addingTypeAnnotationFrom(input: T.AddingTypeAnnotation.Loose): T.AddingTypeAnnotation;
export declare function ambientDeclarationFrom(input: T.AmbientDeclaration.Loose): T.AmbientDeclaration;
export declare function arguments_From(...input: readonly (NonNullable<T.Arguments.Config['children']>[number] | T.Arguments)[]): {
    $type: TSKindId.Arguments;
    $source: 2;
    $named: true;
    $children: (T.SpreadElement | T.Expression)[];
    children(): (T.SpreadElement | T.Expression)[];
    $with: {
        $children: (...vs: (T.Expression | T.SpreadElement)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function arrayFrom(...input: readonly (NonNullable<T.Array.Config['children']>[number] | T.Array)[]): {
    $type: TSKindId.Array;
    $source: 2;
    $named: true;
    $children: (T.SpreadElement | T.Expression)[];
    children(): (T.SpreadElement | T.Expression)[];
    $with: {
        $children: (...vs: (T.Expression | T.SpreadElement)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function arrayPatternFrom(...input: readonly (NonNullable<T.ArrayPattern.Config['children']>[number] | T.ArrayPattern)[]): {
    $type: TSKindId.ArrayPattern;
    $source: 2;
    $named: true;
    $children: (T.AssignmentPattern | T.Pattern)[];
    children(): (T.AssignmentPattern | T.Pattern)[];
    $with: {
        $children: (...vs: (T.Pattern | T.AssignmentPattern)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function arrayTypeFrom(input: T.ArrayType.Loose): T.ArrayType;
export declare function arrowFunctionParameterFrom(input: T.ArrowFunctionParameter.Loose): T.ArrowFunctionParameter | ({
    $type: TSKindId._ArrowFunctionParameter;
    $source: 2;
    $named: true;
    _parameter: string;
    parameter(): string;
    $with: {
        parameter: (value: T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function arrowFunctionUCallSignatureFrom(input: T.ArrowFunctionUCallSignature.Loose): T.ArrowFunctionUCallSignature | ({
    $type: TSKindId._ArrowFunctionUCallSignature;
    $source: 2;
    $named: true;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function arrowFunctionFrom(input?: T.ArrowFunction.Loose): T.ArrowFunction | ({
    $type: TSKindId.ArrowFunction;
    $source: 2;
    $named: true;
    $variant: '_call_signature';
    _async_marker: "async" | undefined;
    _body: T.StatementBlock | T.Expression;
    $children: readonly [{
        $type: TSKindId._ArrowFunctionUCallSignature;
        $source: 2;
        $named: true;
        _type_parameters: T.TypeParameters | undefined;
        _parameters: T.FormalParameters;
        _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
        typeParameters(): T.TypeParameters | undefined;
        parameters(): T.FormalParameters;
        returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
        $with: {
            typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            parameters: (value: T.FormalParameters) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    asyncMarker(): "async" | undefined;
    body(): T.StatementBlock | T.Expression;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.Expression | T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function arrowFunctionUFormParameterFrom(input: Omit<ConfigOf<T.ArrowFunctionUFormParameter>, '$variant'>): {
    $type: TSKindId.ArrowFunction;
    $source: 2;
    $named: true;
    $variant: 'parameter';
    _async_marker: "async" | undefined;
    _body: T.StatementBlock | T.Expression;
    $children: readonly [{
        $type: TSKindId._ArrowFunctionParameter;
        $source: 2;
        $named: true;
        _parameter: string;
        parameter(): string;
        $with: {
            parameter: (value: T.ReservedIdentifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    asyncMarker(): "async" | undefined;
    body(): T.StatementBlock | T.Expression;
    parameter(): string;
    $with: {
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.Expression | T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameter: (value: T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function arrowFunctionUFormUCallSignatureFrom(input: Omit<ConfigOf<T.ArrowFunctionUFormUCallSignature>, '$variant'>): {
    $type: TSKindId.ArrowFunction;
    $source: 2;
    $named: true;
    $variant: '_call_signature';
    _async_marker: "async" | undefined;
    _body: T.StatementBlock | T.Expression;
    $children: readonly [{
        $type: TSKindId._ArrowFunctionUCallSignature;
        $source: 2;
        $named: true;
        _type_parameters: T.TypeParameters | undefined;
        _parameters: T.FormalParameters;
        _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
        typeParameters(): T.TypeParameters | undefined;
        parameters(): T.FormalParameters;
        returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
        $with: {
            typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            parameters: (value: T.FormalParameters) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    asyncMarker(): "async" | undefined;
    body(): T.StatementBlock | T.Expression;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.Expression | T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function asExpressionFrom(input: T.AsExpression.Loose): T.AsExpression;
export declare function assertsFrom(input?: NonNullable<T.Asserts.Config['children']>[number] | T.Asserts): {
    $type: TSKindId.Asserts;
    $source: 2;
    $named: true;
    $children: (T.Identifier | T.This | T.TypePredicate)[];
    children(): (T.Identifier | T.This | T.TypePredicate)[];
    $with: {
        $child: (v: (T.TypePredicate | T.Identifier | T.This)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function assertsAnnotationFrom(input: T.AssertsAnnotation.Loose): T.AssertsAnnotation;
export declare function assignmentExpressionFrom(input: T.AssignmentExpression.Loose): T.AssignmentExpression | ({
    $type: TSKindId.AssignmentExpression;
    $source: 2;
    $named: true;
    _using_marker: "using" | undefined;
    _left: T.LhsExpression | T.ParenthesizedExpression;
    _right: T.Expression;
    usingMarker(): "using" | undefined;
    left(): T.LhsExpression | T.ParenthesizedExpression;
    right(): T.Expression;
    $with: {
        usingMarker: (value?: import("@sittir/types").BooleanKeyword<T.AssignmentExpressionUsingMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        left: (value: T.ParenthesizedExpression | T.LhsExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function assignmentPatternFrom(input: T.AssignmentPattern.Loose): T.AssignmentPattern;
export declare function augmentedAssignmentExpressionFrom(input: T.AugmentedAssignmentExpression.Loose): T.AugmentedAssignmentExpression | ({
    $type: TSKindId.AugmentedAssignmentExpression;
    $source: 2;
    $named: true;
    _left: T.MemberExpression | T.NonNullExpression | T.ReservedIdentifier | T.SubscriptExpression | T.ParenthesizedExpression;
    _operator: "%=" | "&&=" | "&=" | "**=" | "*=" | "+=" | "-=" | "/=" | "<<=" | ">>=" | ">>>=" | "??=" | "^=" | "|=" | "||=";
    _right: T.Expression;
    left(): T.MemberExpression | T.NonNullExpression | T.ReservedIdentifier | T.SubscriptExpression | T.ParenthesizedExpression;
    operator(): "%=" | "&&=" | "&=" | "**=" | "*=" | "+=" | "-=" | "/=" | "<<=" | ">>=" | ">>>=" | "??=" | "^=" | "|=" | "||=";
    right(): T.Expression;
    $with: {
        left: (value: T.MemberExpression | T.SubscriptExpression | T.ReservedIdentifier | T.ParenthesizedExpression | T.NonNullExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (value: T.AugmentedAssignmentExpressionOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function awaitExpressionFrom(input: T.AwaitExpression.Loose): T.AwaitExpression;
export declare function binaryExpressionFrom(input: T.BinaryExpression.Loose): T.BinaryExpression | ({
    $type: TSKindId.BinaryExpression;
    $source: 2;
    $named: true;
    _left: T.PrivatePropertyIdentifier | T.Expression;
    _operator: "&&";
    _right: T.Expression;
    left(): T.PrivatePropertyIdentifier | T.Expression;
    operator(): "&&";
    right(): T.Expression;
    $with: {
        left: (value: T.Expression | T.PrivatePropertyIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function breakStatementFrom(input: T.BreakStatement.Loose): T.BreakStatement | ({
    $type: TSKindId.BreakStatement;
    $source: 2;
    $named: true;
    _label: string | undefined;
    _semicolon: T.AutomaticSemicolon;
    label(): string | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        label: (value?: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function callExpressionFrom(input?: T.CallExpression.Loose): T.CallExpression;
export declare function callExpressionUFormCallFrom(input: Omit<ConfigOf<T.CallExpressionUFormCall>, '$variant'>): {
    $type: TSKindId.CallExpression;
    $source: 2;
    $named: true;
    $variant: 'call';
    $children: readonly [{
        $type: TSKindId.CallExpressionCall;
        $source: 2;
        $named: true;
        _function: T.Import | T.Expression;
        _type_arguments: T.TypeArguments | undefined;
        _arguments: T.Arguments;
        function(): T.Import | T.Expression;
        typeArguments(): T.TypeArguments | undefined;
        arguments(): T.Arguments;
        $with: {
            function: (value: T.Expression | T.Import) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            typeArguments: (value?: T.TypeArguments) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            arguments: (value: T.Arguments) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    function(): T.Import | T.Expression;
    typeArguments(): T.TypeArguments | undefined;
    arguments(): T.Arguments;
    $with: {
        function: (value: T.Expression | T.Import) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (value?: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (value: T.Arguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function callExpressionUFormTemplateCallFrom(input: Omit<ConfigOf<T.CallExpressionUFormTemplateCall>, '$variant'>): {
    $type: TSKindId.CallExpression;
    $source: 2;
    $named: true;
    $variant: 'template_call';
    $children: readonly [{
        $type: TSKindId.CallExpressionTemplateCall;
        $source: 2;
        $named: true;
        _function: T.NewExpression | T.NonNullExpression;
        _arguments: T.TemplateString;
        function(): T.NewExpression | T.NonNullExpression;
        arguments(): T.TemplateString;
        $with: {
            function: (value: T.PrimaryExpression | T.NewExpression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            arguments: (value: T.TemplateString) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    function(): T.NewExpression | T.NonNullExpression;
    arguments(): T.TemplateString;
    $with: {
        function: (value: T.PrimaryExpression | T.NewExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (value: T.TemplateString) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function callExpressionUFormMemberFrom(input: Omit<ConfigOf<T.CallExpressionUFormMember>, '$variant'>): {
    $type: TSKindId.CallExpression;
    $source: 2;
    $named: true;
    $variant: 'member';
    $children: readonly [{
        $type: TSKindId.CallExpressionMember;
        $source: 2;
        $named: true;
        _function: T.NonNullExpression;
        _type_arguments: T.TypeArguments | undefined;
        _arguments: T.Arguments;
        function(): T.NonNullExpression;
        typeArguments(): T.TypeArguments | undefined;
        arguments(): T.Arguments;
        $with: {
            function: (value: T.PrimaryExpression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            typeArguments: (value?: T.TypeArguments) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            arguments: (value: T.Arguments) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    function(): T.NonNullExpression;
    typeArguments(): T.TypeArguments | undefined;
    arguments(): T.Arguments;
    $with: {
        function: (value: T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (value?: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (value: T.Arguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function callSignatureFrom(input: T.CallSignature.Loose): T.CallSignature;
export declare function catchClauseFrom(input: T.CatchClause.Loose): T.CatchClause;
export declare function class_From(input: T.Class.Loose): T.Class;
export declare function classBodyFrom(...input: readonly (NonNullable<T.ClassBody.Config['children']>[number] | T.ClassBody)[]): {
    $type: TSKindId.ClassBody;
    $source: 2;
    $named: true;
    $children: (T.ClassBodyMember | T.ClassBodyMethod | T.ClassBodyMethodSig | T.ClassStaticBlock)[];
    children(): (T.ClassBodyMember | T.ClassBodyMethod | T.ClassBodyMethodSig | T.ClassStaticBlock)[];
    $with: {
        $children: (...vs: (T.ClassBodyMethod | T.ClassBodyMethodSig | T.ClassStaticBlock | T.ClassBodyMember)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function classDeclarationFrom(input: T.ClassDeclaration.Loose): T.ClassDeclaration | ({
    $type: TSKindId.ClassDeclaration;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritage | undefined;
    _body: T.ClassBody;
    _automatic_semicolon: string | undefined;
    decorator(): readonly T.Decorator[];
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
    automaticSemicolon(): string | undefined;
    $with: {
        decorator: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        classHeritage: (value?: T.ClassHeritage) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.ClassBody) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        automaticSemicolon: (value?: T.AutomaticSemicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function classHeritageExtendsClauseFrom(input?: NonNullable<T.ClassHeritageExtendsClause.Config['children']>[number] | T.ClassHeritageExtendsClause): {
    $type: TSKindId._ClassHeritageExtendsClause;
    $source: 2;
    $named: true;
    $children: (T.ExtendsClause | T.ImplementsClause)[];
    children(): (T.ExtendsClause | T.ImplementsClause)[];
    $with: {
        $child: (v: (T.ExtendsClause | T.ImplementsClause)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function classHeritageImplementsClauseFrom(input?: NonNullable<T.ClassHeritageImplementsClause.Config['children']>[number] | T.ClassHeritageImplementsClause): {
    $type: TSKindId._ClassHeritageImplementsClause;
    $source: 2;
    $named: true;
    $children: T.ImplementsClause[];
    children(): T.ImplementsClause[];
    $with: {
        $child: (v: T.ImplementsClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function classHeritageFrom(input?: T.ClassHeritage.Loose): T.ClassHeritage | ({
    $type: TSKindId.ClassHeritage;
    $source: 2;
    $named: true;
    $variant: 'implements_clause';
    $children: readonly [{
        $type: TSKindId._ClassHeritageImplementsClause;
        $source: 2;
        $named: true;
        $children: T.ImplementsClause[];
        children(): T.ImplementsClause[];
        $with: {
            $child: (v: T.ImplementsClause) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function classHeritageUFormExtendsClauseFrom(input: Omit<ConfigOf<T.ClassHeritageUFormExtendsClause>, '$variant'>): {
    $type: TSKindId.ClassHeritage;
    $source: 2;
    $named: true;
    $variant: 'extends_clause';
    $children: readonly [{
        $type: TSKindId._ClassHeritageExtendsClause;
        $source: 2;
        $named: true;
        $children: (T.ExtendsClause | T.ImplementsClause)[];
        children(): (T.ExtendsClause | T.ImplementsClause)[];
        $with: {
            $child: (v: (T.ExtendsClause | T.ImplementsClause)) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function classHeritageUFormImplementsClauseFrom(input: Omit<ConfigOf<T.ClassHeritageUFormImplementsClause>, '$variant'>): {
    $type: TSKindId.ClassHeritage;
    $source: 2;
    $named: true;
    $variant: 'implements_clause';
    $children: readonly [{
        $type: TSKindId._ClassHeritageImplementsClause;
        $source: 2;
        $named: true;
        $children: T.ImplementsClause[];
        children(): T.ImplementsClause[];
        $with: {
            $child: (v: T.ImplementsClause) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function classStaticBlockFrom(input: T.ClassStaticBlock.Loose): T.ClassStaticBlock | ({
    $type: TSKindId.ClassStaticBlock;
    $source: 2;
    $named: true;
    _body: T.StatementBlock;
    $children: [] | readonly [T.AutomaticSemicolon];
    body(): T.StatementBlock;
    children(): [] | readonly [T.AutomaticSemicolon];
    $with: {
        body: (value: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.AutomaticSemicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function commentFrom(input: string | T.Comment): T.Comment;
export declare function computedPropertyNameFrom(input: T.ComputedPropertyName.Loose): T.ComputedPropertyName;
export declare function conditionalTypeFrom(input: T.ConditionalType.Loose): T.ConditionalType;
export declare function constraintFrom(input: T.Constraint.Loose): T.Constraint;
export declare function constructSignatureFrom(input: T.ConstructSignature.Loose): T.ConstructSignature | ({
    $type: TSKindId.ConstructSignature;
    $source: 2;
    $named: true;
    _abstract_marker: "abstract" | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _type: T.TypeAnnotation | undefined;
    abstractMarker(): "abstract" | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    typeField(): T.TypeAnnotation | undefined;
    $with: {
        abstractMarker: (value?: import("@sittir/types").BooleanKeyword<T.AbstractMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function constructorTypeFrom(input: T.ConstructorType.Loose): T.ConstructorType | ({
    $type: TSKindId.ConstructorType;
    $source: 2;
    $named: true;
    _abstract_marker: "abstract" | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _type: T.Type;
    abstractMarker(): "abstract" | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    typeField(): T.Type;
    $with: {
        abstractMarker: (value?: import("@sittir/types").BooleanKeyword<T.AbstractMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function continueStatementFrom(input: T.ContinueStatement.Loose): T.ContinueStatement | ({
    $type: TSKindId.ContinueStatement;
    $source: 2;
    $named: true;
    _label: string | undefined;
    _semicolon: T.AutomaticSemicolon;
    label(): string | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        label: (value?: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function debuggerStatementFrom(input: T.DebuggerStatement.Loose): T.DebuggerStatement;
export declare function decoratorFrom(input?: NonNullable<T.Decorator.Config['children']>[number] | T.Decorator): {
    $type: TSKindId.Decorator;
    $source: 2;
    $named: true;
    $children: (T.DecoratorCallExpression | T.DecoratorMemberExpression | T.DecoratorParenthesizedExpression | T.Identifier)[];
    children(): (T.DecoratorCallExpression | T.DecoratorMemberExpression | T.DecoratorParenthesizedExpression | T.Identifier)[];
    $with: {
        $child: (v: (T.Identifier | T.DecoratorMemberExpression | T.DecoratorCallExpression | T.DecoratorParenthesizedExpression)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function decoratorCallExpressionFrom(input: T.DecoratorCallExpression.Loose): T.DecoratorCallExpression;
export declare function decoratorMemberExpressionFrom(input: T.DecoratorMemberExpression.Loose): T.DecoratorMemberExpression | ({
    $type: TSKindId.DecoratorMemberExpression;
    $source: 2;
    $named: true;
    _object: T.DecoratorMemberExpression | T.Identifier;
    _property: string;
    object(): T.DecoratorMemberExpression | T.Identifier;
    property(): string;
    $with: {
        object: (value: T.Identifier | T.DecoratorMemberExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        property: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function decoratorParenthesizedExpressionFrom(input?: NonNullable<T.DecoratorParenthesizedExpression.Config['children']>[number] | T.DecoratorParenthesizedExpression): {
    $type: TSKindId.DecoratorParenthesizedExpression;
    $source: 2;
    $named: true;
    $children: (T.DecoratorCallExpression | T.DecoratorMemberExpression | T.Identifier)[];
    children(): (T.DecoratorCallExpression | T.DecoratorMemberExpression | T.Identifier)[];
    $with: {
        $child: (v: (T.Identifier | T.DecoratorMemberExpression | T.DecoratorCallExpression)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function defaultTypeFrom(input: T.DefaultType.Loose): T.DefaultType;
export declare function doStatementFrom(input: T.DoStatement.Loose): T.DoStatement;
export declare function elseClauseFrom(input: T.ElseClause.Loose): T.ElseClause;
export declare function enumAssignmentFrom(input: T.EnumAssignment.Loose): T.EnumAssignment;
export declare function enumBodyFrom(input: T.EnumBody.Loose): {
    $type: TSKindId.EnumBody;
    $source: 2;
    $named: true;
    $children: readonly (T.EnumAssignment | T.PropertyName)[];
    children(): readonly (T.EnumAssignment | T.PropertyName)[];
    $with: {
        children: (...items: ((T.PropertyName | T.EnumAssignment))[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function enumDeclarationFrom(input: T.EnumDeclaration.Loose): T.EnumDeclaration | ({
    $type: TSKindId.EnumDeclaration;
    $source: 2;
    $named: true;
    _const_marker: "const" | undefined;
    _name: string;
    _body: T.EnumBody;
    constMarker(): "const" | undefined;
    name(): string;
    body(): T.EnumBody;
    $with: {
        constMarker: (value?: import("@sittir/types").BooleanKeyword<T.ConstMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.EnumBody) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function escapeSequenceFrom(input: string | T.EscapeSequence): T.EscapeSequence;
export declare function exportClauseFrom(...input: readonly (NonNullable<T.ExportClause.Config['children']>[number] | T.ExportClause)[]): {
    $type: TSKindId.ExportClause;
    $source: 2;
    $named: true;
    $children: T.ExportSpecifier[];
    children(): T.ExportSpecifier[];
    $with: {
        $children: (...vs: T.ExportSpecifier[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportSpecifierFrom(input: T.ExportSpecifier.Loose): T.ExportSpecifier | ({
    $type: TSKindId.ExportSpecifier;
    $source: 2;
    $named: true;
    _export_kind: "type" | "typeof" | undefined;
    _name: T.ModuleExportName;
    _alias: T.ModuleExportName | undefined;
    exportKind(): "type" | "typeof" | undefined;
    name(): T.ModuleExportName;
    alias(): T.ModuleExportName | undefined;
    $with: {
        exportKind: (value?: T.ExportSpecifierExportKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.ModuleExportName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (value?: T.ModuleExportName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function exportStatementTypeExportFrom(input: T.ExportStatementTypeExport.Loose): T.ExportStatementTypeExport | ({
    $type: TSKindId._ExportStatementTypeExport;
    $source: 2;
    $named: true;
    _source: T.String | undefined;
    $children: [] | readonly [T.AutomaticSemicolon | T.ExportClause];
    source(): T.String | undefined;
    children(): [] | readonly [T.AutomaticSemicolon | T.ExportClause];
    $with: {
        source: (value?: T.String) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.AutomaticSemicolon | T.ExportClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function exportStatementEqualsExportFrom(input?: NonNullable<T.ExportStatementEqualsExport.Config['children']>[number] | T.ExportStatementEqualsExport): {
    $type: TSKindId._ExportStatementEqualsExport;
    $source: 2;
    $named: true;
    $children: (T.AutomaticSemicolon | T.Expression)[];
    children(): (T.AutomaticSemicolon | T.Expression)[];
    $with: {
        $child: (v: (T.Expression | T.Semicolon)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportStatementNamespaceExportFrom(input?: NonNullable<T.ExportStatementNamespaceExport.Config['children']>[number] | T.ExportStatementNamespaceExport): {
    $type: TSKindId._ExportStatementNamespaceExport;
    $source: 2;
    $named: true;
    $children: (T.AutomaticSemicolon | T.Identifier)[];
    children(): (T.AutomaticSemicolon | T.Identifier)[];
    $with: {
        $child: (v: (T.Identifier | T.Semicolon)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportStatementFrom(input?: T.ExportStatement.Loose): T.ExportStatement | ({
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'namespace_export';
    $children: readonly [{
        $type: TSKindId._ExportStatementNamespaceExport;
        $source: 2;
        $named: true;
        $children: (T.AutomaticSemicolon | T.Identifier)[];
        children(): (T.AutomaticSemicolon | T.Identifier)[];
        $with: {
            $child: (v: (T.Identifier | T.Semicolon)) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function exportStatementUFormDefaultFrom(input: Omit<ConfigOf<T.ExportStatementUFormDefault>, '$variant'>): {
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'default';
    $children: [] | readonly [T.ExportStatementDefault];
    children(): [] | readonly [T.ExportStatementDefault];
    $with: {
        children: (items_0: T.ExportStatementDefault) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportStatementUFormTypeExportFrom(input: Omit<ConfigOf<T.ExportStatementUFormTypeExport>, '$variant'>): {
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'type_export';
    $children: readonly [{
        $type: TSKindId._ExportStatementTypeExport;
        $source: 2;
        $named: true;
        _source: T.String | undefined;
        $children: [] | readonly [T.AutomaticSemicolon | T.ExportClause];
        source(): T.String | undefined;
        children(): [] | readonly [T.AutomaticSemicolon | T.ExportClause];
        $with: {
            source: (value?: T.String) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            children: (items_0: T.AutomaticSemicolon | T.ExportClause) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    source(): T.String | undefined;
    $with: {
        source: (value?: T.String) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportStatementUFormEqualsExportFrom(input: Omit<ConfigOf<T.ExportStatementUFormEqualsExport>, '$variant'>): {
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'equals_export';
    $children: readonly [{
        $type: TSKindId._ExportStatementEqualsExport;
        $source: 2;
        $named: true;
        $children: (T.AutomaticSemicolon | T.Expression)[];
        children(): (T.AutomaticSemicolon | T.Expression)[];
        $with: {
            $child: (v: (T.Expression | T.Semicolon)) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportStatementUFormNamespaceExportFrom(input: Omit<ConfigOf<T.ExportStatementUFormNamespaceExport>, '$variant'>): {
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'namespace_export';
    $children: readonly [{
        $type: TSKindId._ExportStatementNamespaceExport;
        $source: 2;
        $named: true;
        $children: (T.AutomaticSemicolon | T.Identifier)[];
        children(): (T.AutomaticSemicolon | T.Identifier)[];
        $with: {
            $child: (v: (T.Identifier | T.Semicolon)) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function expressionStatementFrom(input: T.ExpressionStatement.Loose): T.ExpressionStatement | ({
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    _semicolon: T.AutomaticSemicolon;
    $children: [] | readonly [T.SequenceExpression];
    semicolon(): T.AutomaticSemicolon;
    children(): [] | readonly [T.SequenceExpression];
    $with: {
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.SequenceExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function extendsClauseFrom(input: T.ExtendsClause.Loose): T.ExtendsClause;
export declare function extendsTypeClauseFrom(input: T.ExtendsTypeClause.Loose): T.ExtendsTypeClause;
export declare function false_From(input?: T.False): (T.False & AnyNodeData) | ({
    $type: TSKindId.False;
    $source: 2;
    $named: true;
    $text: 'false';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function finallyClauseFrom(input: T.FinallyClause.Loose): T.FinallyClause;
export declare function flowMaybeTypeFrom(input: T.FlowMaybeType.Loose): T.FlowMaybeType;
export declare function forInStatementFrom(input: T.ForInStatement.Loose): T.ForInStatement | ({
    $type: TSKindId.ForInStatement;
    $source: 2;
    $named: true;
    _await_marker: "await" | undefined;
    _operator: "in" | "of";
    _right: T.SequenceExpression;
    _body: T.Statement;
    $children: [] | readonly [T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind];
    awaitMarker(): "await" | undefined;
    operator(): "in" | "of";
    right(): T.SequenceExpression;
    body(): T.Statement;
    children(): [] | readonly [T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind];
    $with: {
        awaitMarker: (value?: import("@sittir/types").BooleanKeyword<T.ForInStatementAwaitMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (value: T.ForHeaderOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.Expressions) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.Statement) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function forStatementFrom(input: T.ForStatement.Loose): T.ForStatement;
export declare function formalParametersFrom(...input: readonly (NonNullable<T.FormalParameters.Config['children']>[number] | T.FormalParameters)[]): {
    $type: TSKindId.FormalParameters;
    $source: 2;
    $named: true;
    $children: T.FormalParameter[];
    children(): T.FormalParameter[];
    $with: {
        $children: (...vs: T.FormalParameter[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function functionDeclarationFrom(input: T.FunctionDeclaration.Loose): T.FunctionDeclaration | ({
    $type: TSKindId.FunctionDeclaration;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _name: string;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    $children: [] | readonly [T.AutomaticSemicolon];
    asyncMarker(): "async" | undefined;
    name(): string;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    children(): [] | readonly [T.AutomaticSemicolon];
    $with: {
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.AutomaticSemicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function functionExpressionFrom(input: T.FunctionExpression.Loose): T.FunctionExpression | ({
    $type: TSKindId.FunctionExpression;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _name: string | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    asyncMarker(): "async" | undefined;
    name(): string | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value?: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function functionSignatureFrom(input: T.FunctionSignature.Loose): T.FunctionSignature | ({
    $type: TSKindId.FunctionSignature;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _name: string;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _semicolon: T.AutomaticSemicolon | T.FunctionSignatureAutomaticSemicolon;
    asyncMarker(): "async" | undefined;
    name(): string;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    semicolon(): T.AutomaticSemicolon | T.FunctionSignatureAutomaticSemicolon;
    $with: {
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (value: T.Semicolon | T.FunctionSignatureAutomaticSemicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function functionTypeFrom(input: T.FunctionType.Loose): T.FunctionType;
export declare function generatorFunctionFrom(input: T.GeneratorFunction.Loose): T.GeneratorFunction | ({
    $type: TSKindId.GeneratorFunction;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _name: string | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    asyncMarker(): "async" | undefined;
    name(): string | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value?: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function generatorFunctionDeclarationFrom(input: T.GeneratorFunctionDeclaration.Loose): T.GeneratorFunctionDeclaration | ({
    $type: TSKindId.GeneratorFunctionDeclaration;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _name: string;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    $children: [] | readonly [T.AutomaticSemicolon];
    asyncMarker(): "async" | undefined;
    name(): string;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    children(): [] | readonly [T.AutomaticSemicolon];
    $with: {
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.AutomaticSemicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function genericTypeFrom(input: T.GenericType.Loose): T.GenericType;
export declare function hashBangLineFrom(input: string | T.HashBangLine): T.HashBangLine;
export declare function identifierFrom(input: string | T.Identifier): T.Identifier;
export declare function ifStatementFrom(input: T.IfStatement.Loose): T.IfStatement;
export declare function implementsClauseFrom(...input: readonly (NonNullable<T.ImplementsClause.Config['children']>[number] | T.ImplementsClause)[]): {
    $type: TSKindId.ImplementsClause;
    $source: 2;
    $named: true;
    $children: T.Type[] & readonly [T.Type, ...T.Type[]];
    children(): T.Type[] & readonly [T.Type, ...T.Type[]];
    $with: {
        $children: (...vs: T.Type[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function import_From(input?: T.Import): (T.Import & AnyNodeData) | ({
    $type: TSKindId.Import;
    $source: 2;
    $named: true;
    $text: 'import';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function importAliasFrom(input: T.ImportAlias.Loose): T.ImportAlias | ({
    $type: TSKindId.ImportAlias;
    $source: 2;
    $named: true;
    _name: string;
    _value: T.Identifier | T.NestedIdentifier;
    _semicolon: T.AutomaticSemicolon;
    name(): string;
    value(): T.Identifier | T.NestedIdentifier;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (value: T.Identifier | T.NestedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function importAttributeFrom(input: T.ImportAttribute.Loose): T.ImportAttribute;
export declare function importClauseNamespaceImportFrom(input?: NonNullable<T.ImportClauseNamespaceImport.Config['children']>[number] | T.ImportClauseNamespaceImport): {
    $type: TSKindId._ImportClauseNamespaceImport;
    $source: 2;
    $named: true;
    $children: T.NamespaceImport[];
    children(): T.NamespaceImport[];
    $with: {
        $child: (v: T.NamespaceImport) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importClauseNamedImportsFrom(input?: NonNullable<T.ImportClauseNamedImports.Config['children']>[number] | T.ImportClauseNamedImports): {
    $type: TSKindId._ImportClauseNamedImports;
    $source: 2;
    $named: true;
    $children: T.NamedImports[];
    children(): T.NamedImports[];
    $with: {
        $child: (v: T.NamedImports) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importClauseDefaultImportFrom(input?: NonNullable<T.ImportClauseDefaultImport.Config['children']>[number] | T.ImportClauseDefaultImport): {
    $type: TSKindId._ImportClauseDefaultImport;
    $source: 2;
    $named: true;
    $children: (T.Identifier | T.NamedImports | T.NamespaceImport)[];
    children(): (T.Identifier | T.NamedImports | T.NamespaceImport)[];
    $with: {
        $child: (v: (T.ImportIdentifier | T.NamespaceImport | T.NamedImports)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importClauseFrom(input?: T.ImportClause.Loose): T.ImportClause | ({
    $type: TSKindId.ImportClause;
    $source: 2;
    $named: true;
    $variant: 'default_import';
    $children: readonly [{
        $type: TSKindId._ImportClauseDefaultImport;
        $source: 2;
        $named: true;
        $children: (T.Identifier | T.NamedImports | T.NamespaceImport)[];
        children(): (T.Identifier | T.NamedImports | T.NamespaceImport)[];
        $with: {
            $child: (v: (T.ImportIdentifier | T.NamespaceImport | T.NamedImports)) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function importClauseUFormNamespaceImportFrom(input: Omit<ConfigOf<T.ImportClauseUFormNamespaceImport>, '$variant'>): {
    $type: TSKindId.ImportClause;
    $source: 2;
    $named: true;
    $variant: 'namespace_import';
    $children: readonly [{
        $type: TSKindId._ImportClauseNamespaceImport;
        $source: 2;
        $named: true;
        $children: T.NamespaceImport[];
        children(): T.NamespaceImport[];
        $with: {
            $child: (v: T.NamespaceImport) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importClauseUFormNamedImportsFrom(input: Omit<ConfigOf<T.ImportClauseUFormNamedImports>, '$variant'>): {
    $type: TSKindId.ImportClause;
    $source: 2;
    $named: true;
    $variant: 'named_imports';
    $children: readonly [{
        $type: TSKindId._ImportClauseNamedImports;
        $source: 2;
        $named: true;
        $children: T.NamedImports[];
        children(): T.NamedImports[];
        $with: {
            $child: (v: T.NamedImports) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importClauseUFormDefaultImportFrom(input: Omit<ConfigOf<T.ImportClauseUFormDefaultImport>, '$variant'>): {
    $type: TSKindId.ImportClause;
    $source: 2;
    $named: true;
    $variant: 'default_import';
    $children: readonly [{
        $type: TSKindId._ImportClauseDefaultImport;
        $source: 2;
        $named: true;
        $children: (T.Identifier | T.NamedImports | T.NamespaceImport)[];
        children(): (T.Identifier | T.NamedImports | T.NamespaceImport)[];
        $with: {
            $child: (v: (T.ImportIdentifier | T.NamespaceImport | T.NamedImports)) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importRequireClauseFrom(input: T.ImportRequireClause.Loose): T.ImportRequireClause | ({
    $type: TSKindId.ImportRequireClause;
    $source: 2;
    $named: true;
    _identifier: string;
    _source: T.String;
    identifier(): string;
    source(): T.String;
    $with: {
        identifier: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        source: (value: T.String) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function importSpecifierNameFrom(input: T.ImportSpecifierName.Loose): T.ImportSpecifierName | ({
    $type: TSKindId._ImportSpecifierName;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    name(): T.Identifier;
    $with: {
        name: (value: T.ImportIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function importSpecifierFrom(input?: T.ImportSpecifier.Loose): T.ImportSpecifier | ({
    $type: TSKindId.ImportSpecifier;
    $source: 2;
    $named: true;
    $variant: 'as';
    _import_kind: "type" | "typeof" | undefined;
    $children: readonly [{
        $type: TSKindId.ImportSpecifierAs;
        $source: 2;
        $named: true;
        _name: T.ModuleExportName;
        _alias: T.Identifier;
        name(): T.ModuleExportName;
        alias(): T.Identifier;
        $with: {
            name: (value: T.ModuleExportName | T.Identifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            alias: (value: T.ImportIdentifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    importKind(): "type" | "typeof" | undefined;
    name(): T.ModuleExportName;
    alias(): T.Identifier;
    $with: {
        importKind: (value?: T.ExportSpecifierExportKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.ModuleExportName | T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (value: T.ImportIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function importSpecifierUFormNameFrom(input: Omit<ConfigOf<T.ImportSpecifierUFormName>, '$variant'>): {
    $type: TSKindId.ImportSpecifier;
    $source: 2;
    $named: true;
    $variant: 'name';
    _import_kind: "type" | "typeof" | undefined;
    $children: readonly [{
        $type: TSKindId._ImportSpecifierName;
        $source: 2;
        $named: true;
        _name: T.Identifier;
        name(): T.Identifier;
        $with: {
            name: (value: T.ImportIdentifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    importKind(): "type" | "typeof" | undefined;
    name(): T.Identifier;
    $with: {
        importKind: (value?: T.ExportSpecifierExportKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.ImportIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importSpecifierUFormAsFrom(input: Omit<ConfigOf<T.ImportSpecifierUFormAs>, '$variant'>): {
    $type: TSKindId.ImportSpecifier;
    $source: 2;
    $named: true;
    $variant: 'as';
    _import_kind: "type" | "typeof" | undefined;
    $children: readonly [{
        $type: TSKindId.ImportSpecifierAs;
        $source: 2;
        $named: true;
        _name: T.ModuleExportName;
        _alias: T.Identifier;
        name(): T.ModuleExportName;
        alias(): T.Identifier;
        $with: {
            name: (value: T.ModuleExportName | T.Identifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            alias: (value: T.ImportIdentifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    importKind(): "type" | "typeof" | undefined;
    name(): T.ModuleExportName;
    alias(): T.Identifier;
    $with: {
        importKind: (value?: T.ExportSpecifierExportKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.ModuleExportName | T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (value: T.ImportIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importStatementFrom(input: T.ImportStatement.Loose): T.ImportStatement;
export declare function indexSignatureMappedTypeClauseFrom(input?: NonNullable<T.IndexSignatureMappedTypeClause.Config['children']>[number] | T.IndexSignatureMappedTypeClause): {
    $type: TSKindId._IndexSignatureMappedTypeClause;
    $source: 2;
    $named: true;
    $children: T.MappedTypeClause[];
    children(): T.MappedTypeClause[];
    $with: {
        $child: (v: T.MappedTypeClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function indexSignatureFrom(input?: T.IndexSignature.Loose): T.IndexSignature | ({
    $type: TSKindId.IndexSignature;
    $source: 2;
    $named: true;
    $variant: 'mapped_type_clause';
    _sign: "+" | "-" | undefined;
    _type: T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    $children: readonly [{
        $type: TSKindId._IndexSignatureMappedTypeClause;
        $source: 2;
        $named: true;
        $children: T.MappedTypeClause[];
        children(): T.MappedTypeClause[];
        $with: {
            $child: (v: T.MappedTypeClause) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    sign(): "+" | "-" | undefined;
    typeField(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    $with: {
        sign: (value?: "-" | "+") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (value: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function indexSignatureUFormColonFrom(input: Omit<ConfigOf<T.IndexSignatureUFormColon>, '$variant'>): {
    $type: TSKindId.IndexSignature;
    $source: 2;
    $named: true;
    $variant: 'colon';
    _sign: "+" | "-" | undefined;
    _type: T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    $children: readonly [{
        $type: TSKindId.IndexSignatureColon;
        $source: 2;
        $named: true;
        _name: string;
        _index_type: T.Type;
        name(): string;
        indexType(): T.Type;
        $with: {
            name: (value: T.ReservedIdentifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            indexType: (value: T.Type) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    sign(): "+" | "-" | undefined;
    typeField(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    name(): string;
    indexType(): T.Type;
    $with: {
        sign: (value?: "-" | "+") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (value: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        indexType: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function indexSignatureUFormMappedTypeClauseFrom(input: Omit<ConfigOf<T.IndexSignatureUFormMappedTypeClause>, '$variant'>): {
    $type: TSKindId.IndexSignature;
    $source: 2;
    $named: true;
    $variant: 'mapped_type_clause';
    _sign: "+" | "-" | undefined;
    _type: T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    $children: readonly [{
        $type: TSKindId._IndexSignatureMappedTypeClause;
        $source: 2;
        $named: true;
        $children: T.MappedTypeClause[];
        children(): T.MappedTypeClause[];
        $with: {
            $child: (v: T.MappedTypeClause) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    sign(): "+" | "-" | undefined;
    typeField(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    $with: {
        sign: (value?: "-" | "+") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (value: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function indexTypeQueryFrom(input: T.IndexTypeQuery.Loose): T.IndexTypeQuery;
export declare function inferTypeFrom(input: T.InferType.Loose): T.InferType;
export declare function instantiationExpressionFrom(input: T.InstantiationExpression.Loose): T.InstantiationExpression;
export declare function interfaceDeclarationFrom(input: T.InterfaceDeclaration.Loose): T.InterfaceDeclaration;
export declare function internalModuleFrom(input: T.InternalModule.Loose): T.InternalModule;
export declare function intersectionTypeFrom(input: T.IntersectionType.Loose): T.IntersectionType;
export declare function labeledStatementFrom(input: T.LabeledStatement.Loose): T.LabeledStatement;
export declare function lexicalDeclarationFrom(input: T.LexicalDeclaration.Loose): T.LexicalDeclaration | ({
    $type: TSKindId.LexicalDeclaration;
    $source: 2;
    $named: true;
    _kind: "const" | "let";
    _declarators: readonly [T.VariableDeclarator, ...T.VariableDeclarator[]];
    _semicolon: T.AutomaticSemicolon;
    kind(): "const" | "let";
    declarators(): readonly [T.VariableDeclarator, ...T.VariableDeclarator[]];
    semicolon(): T.AutomaticSemicolon;
    $with: {
        kind: (value: T.Kind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        declarators: (values_0: T.VariableDeclarator, ...values: T.VariableDeclarator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function literalTypeFrom(input?: NonNullable<T.LiteralType.Config['children']>[number] | T.LiteralType): {
    $type: TSKindId.LiteralType;
    $source: 2;
    $named: true;
    $children: (T.False | T.Null | T.Number | T.True | T.Undefined | T._Number | T.String)[];
    children(): (T.False | T.Null | T.Number | T.True | T.Undefined | T._Number | T.String)[];
    $with: {
        $child: (v: (T._Number | T.Number | T.String | T.True | T.False | T.Null | T.Undefined)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function lookupTypeFrom(input: T.LookupType.Loose): T.LookupType;
export declare function mappedTypeClauseFrom(input: T.MappedTypeClause.Loose): T.MappedTypeClause;
export declare function memberExpressionFrom(input: T.MemberExpression.Loose): T.MemberExpression | ({
    $type: TSKindId.MemberExpression;
    $source: 2;
    $named: true;
    _object: T.Import | T.NonNullExpression | T.Expression;
    _property: string;
    $children: [] | readonly ["." | T.OptionalChain];
    object(): T.Import | T.NonNullExpression | T.Expression;
    property(): string;
    children(): [] | readonly ["." | T.OptionalChain];
    $with: {
        object: (value: T.Expression | T.PrimaryExpression | T.Import) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        property: (value: T.PrivatePropertyIdentifier | T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.OptionalChain) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function metaPropertyFrom(input: string | T.MetaProperty): T.MetaProperty;
export declare function methodDefinitionFrom(input: T.MethodDefinition.Loose): T.MethodDefinition | ({
    $type: TSKindId.MethodDefinition;
    $source: 2;
    $named: true;
    _accessibility_modifier: "private" | "protected" | "public" | undefined;
    _static_marker: "static" | undefined;
    _override_modifier: "override" | undefined;
    _readonly_marker: "readonly" | undefined;
    _async_marker: "async" | undefined;
    _accessor_kind: "*" | "get" | "set" | undefined;
    _name: T.PropertyName;
    _optional_marker: "?" | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    accessibilityModifier(): "private" | "protected" | "public" | undefined;
    staticMarker(): "static" | undefined;
    overrideModifier(): "override" | undefined;
    readonlyMarker(): "readonly" | undefined;
    asyncMarker(): "async" | undefined;
    accessorKind(): "*" | "get" | "set" | undefined;
    name(): T.PropertyName;
    optionalMarker(): "?" | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        accessibilityModifier: (value?: T._AccessibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        staticMarker: (value?: import("@sittir/types").BooleanKeyword<T.StaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (value?: import("@sittir/types").BooleanKeyword<T._OverrideModifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (value?: import("@sittir/types").BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessorKind: (value?: T.AccessorKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.PropertyName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalMarker: (value?: import("@sittir/types").BooleanKeyword<T.OptionalMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function methodSignatureFrom(input: T.MethodSignature.Loose): T.MethodSignature | ({
    $type: TSKindId.MethodSignature;
    $source: 2;
    $named: true;
    _accessibility_modifier: "private" | "protected" | "public" | undefined;
    _static_marker: "static" | undefined;
    _override_modifier: "override" | undefined;
    _readonly_marker: "readonly" | undefined;
    _async_marker: "async" | undefined;
    _accessor_kind: "*" | "get" | "set" | undefined;
    _name: T.PropertyName;
    _optional_marker: "?" | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    accessibilityModifier(): "private" | "protected" | "public" | undefined;
    staticMarker(): "static" | undefined;
    overrideModifier(): "override" | undefined;
    readonlyMarker(): "readonly" | undefined;
    asyncMarker(): "async" | undefined;
    accessorKind(): "*" | "get" | "set" | undefined;
    name(): T.PropertyName;
    optionalMarker(): "?" | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        accessibilityModifier: (value?: T._AccessibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        staticMarker: (value?: import("@sittir/types").BooleanKeyword<T.StaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (value?: import("@sittir/types").BooleanKeyword<T._OverrideModifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (value?: import("@sittir/types").BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessorKind: (value?: T.AccessorKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.PropertyName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalMarker: (value?: import("@sittir/types").BooleanKeyword<T.OptionalMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.FormalParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.TypeAnnotation | T.AssertsAnnotation | T.TypePredicateAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function moduleFrom(input: T.Module.Loose): T.Module;
export declare function namedImportsFrom(...input: readonly (NonNullable<T.NamedImports.Config['children']>[number] | T.NamedImports)[]): {
    $type: TSKindId.NamedImports;
    $source: 2;
    $named: true;
    $children: T.ImportSpecifier[];
    children(): T.ImportSpecifier[];
    $with: {
        $children: (...vs: T.ImportSpecifier[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function namespaceExportFrom(input?: NonNullable<T.NamespaceExport.Config['children']>[number] | T.NamespaceExport): {
    $type: TSKindId.NamespaceExport;
    $source: 2;
    $named: true;
    $children: T.ModuleExportName[];
    children(): T.ModuleExportName[];
    $with: {
        $child: (v: T.ModuleExportName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function namespaceImportFrom(input: T.NamespaceImport.Loose): T.NamespaceImport | ({
    $type: TSKindId.NamespaceImport;
    $source: 2;
    $named: true;
    _identifier: string;
    identifier(): string;
    $with: {
        identifier: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function nestedIdentifierFrom(input: T.NestedIdentifier.Loose): T.NestedIdentifier | ({
    $type: TSKindId.NestedIdentifier;
    $source: 2;
    $named: true;
    _object: T.Identifier | T.NestedIdentifier;
    _property: string;
    object(): T.Identifier | T.NestedIdentifier;
    property(): string;
    $with: {
        object: (value: T.Identifier | T.NestedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        property: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function nestedTypeIdentifierFrom(input: T.NestedTypeIdentifier.Loose): T.NestedTypeIdentifier;
export declare function newExpressionFrom(input: T.NewExpression.Loose): T.NewExpression;
export declare function nonNullExpressionFrom(input: T.NonNullExpression.Loose): T.NonNullExpression;
export declare function null_From(input?: T.Null): (T.Null & AnyNodeData) | ({
    $type: TSKindId.Null;
    $source: 2;
    $named: true;
    $text: 'null';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function numberFrom(input: string | T.Number): T.Number;
export declare function objectFrom(...input: readonly (NonNullable<T.Object.Config['children']>[number] | T.Object)[]): {
    $type: TSKindId.Object;
    $source: 2;
    $named: true;
    $children: (T.MethodDefinition | T.Pair | T.SpreadElement | T.ShorthandPropertyIdentifier)[];
    children(): (T.MethodDefinition | T.Pair | T.SpreadElement | T.ShorthandPropertyIdentifier)[];
    $with: {
        $children: (...vs: (T.Pair | T.SpreadElement | T.MethodDefinition | T.ShorthandPropertyIdentifier)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function objectAssignmentPatternFrom(input: T.ObjectAssignmentPattern.Loose): T.ObjectAssignmentPattern;
export declare function objectPatternFrom(...input: readonly (NonNullable<T.ObjectPattern.Config['children']>[number] | T.ObjectPattern)[]): {
    $type: TSKindId.ObjectPattern;
    $source: 2;
    $named: true;
    $children: (T.ObjectAssignmentPattern | T.PairPattern | T.RestPattern | T.ShorthandPropertyIdentifierPattern)[];
    children(): (T.ObjectAssignmentPattern | T.PairPattern | T.RestPattern | T.ShorthandPropertyIdentifierPattern)[];
    $with: {
        $children: (...vs: (T.PairPattern | T.RestPattern | T.ObjectAssignmentPattern | T.ShorthandPropertyIdentifierPattern)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function objectTypeFrom(input: T.ObjectType.Loose): T.ObjectType | ({
    $type: TSKindId.ObjectType;
    $source: 2;
    $named: true;
    _opening: "{" | "{|";
    _members: readonly ["," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]] | undefined;
    _closing: "|}" | "}";
    opening(): "{" | "{|";
    members(): readonly ["," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]] | undefined;
    closing(): "|}" | "}";
    $with: {
        opening: (value: T.ObjectTypeOpening) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        members: (values_0: "," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...values: ("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        closing: (value: T.ObjectTypeClosing) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function omittingTypeAnnotationFrom(input: T.OmittingTypeAnnotation.Loose): T.OmittingTypeAnnotation;
export declare function optingTypeAnnotationFrom(input: T.OptingTypeAnnotation.Loose): T.OptingTypeAnnotation;
export declare function optionalParameterFrom(input: T.OptionalParameter.Loose): T.OptionalParameter | ({
    $type: TSKindId.OptionalParameter;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    _readonly_marker: "readonly" | undefined;
    _pattern: T.This | T.Pattern;
    _type: T.TypeAnnotation | undefined;
    _value: T.Expression | undefined;
    $children: [] | readonly [T.AccessibilityModifier | T.OverrideModifier];
    decorator(): readonly T.Decorator[];
    readonlyMarker(): "readonly" | undefined;
    pattern(): T.This | T.Pattern;
    typeField(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    children(): [] | readonly [T.AccessibilityModifier | T.OverrideModifier];
    $with: {
        decorator: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (value?: import("@sittir/types").BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        pattern: (value: T.Pattern | T.This) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.AccessibilityModifier | T.OverrideModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function optionalTupleParameterFrom(input: T.OptionalTupleParameter.Loose): T.OptionalTupleParameter | ({
    $type: TSKindId.OptionalTupleParameter;
    $source: 2;
    $named: true;
    _name: string;
    _type: T.TypeAnnotation;
    name(): string;
    typeField(): T.TypeAnnotation;
    $with: {
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function optionalTypeFrom(input: T.OptionalType.Loose): T.OptionalType;
export declare function overrideModifierFrom(input?: T.OverrideModifier): (T.OverrideModifier & AnyNodeData) | ({
    $type: TSKindId.OverrideModifier;
    $source: 2;
    $named: true;
    $text: 'override';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function pairFrom(input: T.Pair.Loose): T.Pair;
export declare function pairPatternFrom(input: T.PairPattern.Loose): T.PairPattern;
export declare function parenthesizedExpressionSequenceFrom(input?: NonNullable<T.ParenthesizedExpressionSequence.Config['children']>[number] | T.ParenthesizedExpressionSequence): {
    $type: TSKindId._ParenthesizedExpressionSequence;
    $source: 2;
    $named: true;
    $children: T.SequenceExpression[];
    children(): T.SequenceExpression[];
    $with: {
        $child: (v: T.SequenceExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function parenthesizedExpressionFrom(input?: T.ParenthesizedExpression.Loose): T.ParenthesizedExpression | ({
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    $variant: 'sequence';
    $children: readonly [{
        $type: TSKindId._ParenthesizedExpressionSequence;
        $source: 2;
        $named: true;
        $children: T.SequenceExpression[];
        children(): T.SequenceExpression[];
        $with: {
            $child: (v: T.SequenceExpression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function parenthesizedExpressionUFormTypedFrom(input: Omit<ConfigOf<T.ParenthesizedExpressionUFormTyped>, '$variant'>): {
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    $variant: 'typed';
    $children: readonly [{
        $type: TSKindId.ParenthesizedExpressionTyped;
        $source: 2;
        $named: true;
        _type: T.TypeAnnotation | undefined;
        $children: [] | readonly [T.Expression];
        typeField(): T.TypeAnnotation | undefined;
        children(): [] | readonly [T.Expression];
        $with: {
            typeField: (value?: T.TypeAnnotation) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            children: (items_0: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    typeField(): T.TypeAnnotation | undefined;
    $with: {
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function parenthesizedExpressionUFormSequenceFrom(input: Omit<ConfigOf<T.ParenthesizedExpressionUFormSequence>, '$variant'>): {
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    $variant: 'sequence';
    $children: readonly [{
        $type: TSKindId._ParenthesizedExpressionSequence;
        $source: 2;
        $named: true;
        $children: T.SequenceExpression[];
        children(): T.SequenceExpression[];
        $with: {
            $child: (v: T.SequenceExpression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function parenthesizedTypeFrom(input: T.ParenthesizedType.Loose): T.ParenthesizedType;
export declare function predefinedTypeFrom(input: string | T.PredefinedType): T.PredefinedType;
export declare function privatePropertyIdentifierFrom(input: string | T.PrivatePropertyIdentifier): T.PrivatePropertyIdentifier;
export declare function programFrom(input: T.Program.Loose): T.Program | ({
    $type: TSKindId.Program;
    $source: 2;
    $named: true;
    _hash_bang_line: string | undefined;
    _statements: readonly T.Statement[];
    hashBangLine(): string | undefined;
    statements(): readonly T.Statement[];
    $with: {
        hashBangLine: (value?: T.HashBangLine) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        statements: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function propertySignatureFrom(input: T.PropertySignature.Loose): T.PropertySignature | ({
    $type: TSKindId.PropertySignature;
    $source: 2;
    $named: true;
    _accessibility_modifier: "private" | "protected" | "public" | undefined;
    _static_marker: "static" | undefined;
    _override_modifier: "override" | undefined;
    _readonly_marker: "readonly" | undefined;
    _name: T.PropertyName;
    _optional_marker: "?" | undefined;
    _type: T.TypeAnnotation | undefined;
    accessibilityModifier(): "private" | "protected" | "public" | undefined;
    staticMarker(): "static" | undefined;
    overrideModifier(): "override" | undefined;
    readonlyMarker(): "readonly" | undefined;
    name(): T.PropertyName;
    optionalMarker(): "?" | undefined;
    typeField(): T.TypeAnnotation | undefined;
    $with: {
        accessibilityModifier: (value?: T._AccessibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        staticMarker: (value?: import("@sittir/types").BooleanKeyword<T.StaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (value?: import("@sittir/types").BooleanKeyword<T._OverrideModifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (value?: import("@sittir/types").BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.PropertyName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalMarker: (value?: import("@sittir/types").BooleanKeyword<T.OptionalMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function publicFieldDefinitionFrom(input: T.PublicFieldDefinition.Loose): T.PublicFieldDefinition | ({
    $type: TSKindId.PublicFieldDefinition;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    _name: T.PropertyName;
    _optionality_marker: "!" | "?" | undefined;
    _type: T.TypeAnnotation | undefined;
    _value: T.Expression | undefined;
    $children: [] | readonly [T.PublicFieldDefinitionAbstractFirst | T.PublicFieldDefinitionAccessFirst | T.PublicFieldDefinitionAccessorOpt | T.PublicFieldDefinitionDeclareFirst | T.PublicFieldDefinitionReadonlyFirst | T.PublicFieldDefinitionStaticMods];
    decorator(): readonly T.Decorator[];
    name(): T.PropertyName;
    optionalityMarker(): "!" | "?" | undefined;
    typeField(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    children(): [] | readonly [T.PublicFieldDefinitionAbstractFirst | T.PublicFieldDefinitionAccessFirst | T.PublicFieldDefinitionAccessorOpt | T.PublicFieldDefinitionDeclareFirst | T.PublicFieldDefinitionReadonlyFirst | T.PublicFieldDefinitionStaticMods];
    $with: {
        decorator: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.PropertyName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalityMarker: (value?: T.PublicFieldDefinitionOptionalityMarker) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.PublicFieldDefinitionAbstractFirst | T.PublicFieldDefinitionAccessFirst | T.PublicFieldDefinitionAccessorOpt | T.PublicFieldDefinitionDeclareFirst | T.PublicFieldDefinitionReadonlyFirst | T.PublicFieldDefinitionStaticMods) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function readonlyTypeFrom(input: T.ReadonlyType.Loose): T.ReadonlyType;
export declare function regexFrom(input: T.Regex.Loose): T.Regex | ({
    $type: TSKindId.Regex;
    $source: 2;
    $named: true;
    _pattern: string;
    _flags: string | undefined;
    pattern(): string;
    flags(): string | undefined;
    $with: {
        pattern: (value: T.RegexPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        flags: (value?: T.RegexFlags) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function regexFlagsFrom(input: string | T.RegexFlags): T.RegexFlags;
export declare function regexPatternFrom(input: string | T.RegexPattern): T.RegexPattern;
export declare function requiredParameterFrom(input: T.RequiredParameter.Loose): T.RequiredParameter | ({
    $type: TSKindId.RequiredParameter;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    _readonly_marker: "readonly" | undefined;
    _pattern: T.This | T.Pattern;
    _type: T.TypeAnnotation | undefined;
    _value: T.Expression | undefined;
    $children: [] | readonly [T.AccessibilityModifier | T.OverrideModifier];
    decorator(): readonly T.Decorator[];
    readonlyMarker(): "readonly" | undefined;
    pattern(): T.This | T.Pattern;
    typeField(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    children(): [] | readonly [T.AccessibilityModifier | T.OverrideModifier];
    $with: {
        decorator: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (value?: import("@sittir/types").BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        pattern: (value: T.Pattern | T.This) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.AccessibilityModifier | T.OverrideModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function restPatternFrom(input?: NonNullable<T.RestPattern.Config['children']>[number] | T.RestPattern): {
    $type: TSKindId.RestPattern;
    $source: 2;
    $named: true;
    $children: T.LhsExpression[];
    children(): T.LhsExpression[];
    $with: {
        $child: (v: T.LhsExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function restTypeFrom(input: T.RestType.Loose): T.RestType;
export declare function returnStatementFrom(input: T.ReturnStatement.Loose): T.ReturnStatement | ({
    $type: TSKindId.ReturnStatement;
    $source: 2;
    $named: true;
    _semicolon: T.AutomaticSemicolon;
    $children: [] | readonly [T.SequenceExpression];
    semicolon(): T.AutomaticSemicolon;
    children(): [] | readonly [T.SequenceExpression];
    $with: {
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.SequenceExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function satisfiesExpressionFrom(input: T.SatisfiesExpression.Loose): T.SatisfiesExpression;
export declare function sequenceExpressionFrom(...input: readonly (NonNullable<T.SequenceExpression.Config['children']>[number] | T.SequenceExpression)[]): {
    $type: TSKindId.SequenceExpression;
    $source: 2;
    $named: true;
    $children: T.Expression[] & readonly [T.Expression, ...T.Expression[]];
    children(): T.Expression[] & readonly [T.Expression, ...T.Expression[]];
    $with: {
        $children: (...vs: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function spreadElementFrom(input: T.SpreadElement.Loose): T.SpreadElement;
export declare function statementBlockFrom(input: T.StatementBlock.Loose): T.StatementBlock | ({
    $type: TSKindId.StatementBlock;
    $source: 2;
    $named: true;
    _statements: readonly T.Statement[];
    _automatic_semicolon: string | undefined;
    statements(): readonly T.Statement[];
    automaticSemicolon(): string | undefined;
    $with: {
        statements: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        automaticSemicolon: (value?: T.AutomaticSemicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function stringDoubleFrom(...input: readonly (NonNullable<T.StringDouble.Config['children']>[number] | T.StringDouble)[]): {
    $type: TSKindId._StringDouble;
    $source: 2;
    $named: true;
    $children: (T.EscapeSequence | T.UnescapedDoubleStringFragment)[];
    children(): (T.EscapeSequence | T.UnescapedDoubleStringFragment)[];
    $with: {
        $children: (...vs: (T.UnescapedDoubleStringFragment | T.EscapeSequence)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function stringSingleFrom(...input: readonly (NonNullable<T.StringSingle.Config['children']>[number] | T.StringSingle)[]): {
    $type: TSKindId._StringSingle;
    $source: 2;
    $named: true;
    $children: (T.EscapeSequence | T.UnescapedSingleStringFragment)[];
    children(): (T.EscapeSequence | T.UnescapedSingleStringFragment)[];
    $with: {
        $children: (...vs: (T.UnescapedSingleStringFragment | T.EscapeSequence)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function stringFrom(input?: T.String.Loose): T.String;
export declare function stringUFormDoubleFrom(input: Omit<ConfigOf<T.StringUFormDouble>, '$variant'>): {
    $type: TSKindId.String;
    $source: 2;
    $named: true;
    $variant: 'double';
    $children: readonly [{
        $type: TSKindId._StringDouble;
        $source: 2;
        $named: true;
        $children: (T.EscapeSequence | T.UnescapedDoubleStringFragment)[];
        children(): (T.EscapeSequence | T.UnescapedDoubleStringFragment)[];
        $with: {
            $children: (...vs: (T.UnescapedDoubleStringFragment | T.EscapeSequence)[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function stringUFormSingleFrom(input: Omit<ConfigOf<T.StringUFormSingle>, '$variant'>): {
    $type: TSKindId.String;
    $source: 2;
    $named: true;
    $variant: 'single';
    $children: readonly [{
        $type: TSKindId._StringSingle;
        $source: 2;
        $named: true;
        $children: (T.EscapeSequence | T.UnescapedSingleStringFragment)[];
        children(): (T.EscapeSequence | T.UnescapedSingleStringFragment)[];
        $with: {
            $children: (...vs: (T.UnescapedSingleStringFragment | T.EscapeSequence)[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function subscriptExpressionFrom(input: T.SubscriptExpression.Loose): T.SubscriptExpression | ({
    $type: TSKindId.SubscriptExpression;
    $source: 2;
    $named: true;
    _object: T.NonNullExpression | T.Expression;
    _optional_chain: "?." | undefined;
    _index: T.SequenceExpression;
    object(): T.NonNullExpression | T.Expression;
    optionalChain(): "?." | undefined;
    index(): T.SequenceExpression;
    $with: {
        object: (value: T.Expression | T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalChain: (value?: import("@sittir/types").BooleanKeyword<T.OptionalChain>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        index: (value: T.Expressions) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function superFrom(input?: T.Super): (T.Super & AnyNodeData) | ({
    $type: TSKindId.Super;
    $source: 2;
    $named: true;
    $text: 'super';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function switchBodyFrom(...input: readonly (NonNullable<T.SwitchBody.Config['children']>[number] | T.SwitchBody)[]): {
    $type: TSKindId.SwitchBody;
    $source: 2;
    $named: true;
    $children: (T.SwitchCase | T.SwitchDefault)[];
    children(): (T.SwitchCase | T.SwitchDefault)[];
    $with: {
        $children: (...vs: (T.SwitchCase | T.SwitchDefault)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function switchCaseFrom(input: T.SwitchCase.Loose): T.SwitchCase;
export declare function switchDefaultFrom(input: T.SwitchDefault.Loose): T.SwitchDefault;
export declare function switchStatementFrom(input: T.SwitchStatement.Loose): T.SwitchStatement;
export declare function templateLiteralTypeFrom(...input: readonly (NonNullable<T.TemplateLiteralType.Config['children']>[number] | T.TemplateLiteralType)[]): {
    $type: TSKindId.TemplateLiteralType;
    $source: 2;
    $named: true;
    $children: (T.TemplateChars | T.TemplateType)[];
    children(): (T.TemplateChars | T.TemplateType)[];
    $with: {
        $children: (...vs: (T.TemplateChars | T.TemplateType)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function templateStringFrom(...input: readonly (NonNullable<T.TemplateString.Config['children']>[number] | T.TemplateString)[]): {
    $type: TSKindId.TemplateString;
    $source: 2;
    $named: true;
    $children: (T.EscapeSequence | T.TemplateChars | T.TemplateSubstitution)[];
    children(): (T.EscapeSequence | T.TemplateChars | T.TemplateSubstitution)[];
    $with: {
        $children: (...vs: (T.TemplateChars | T.EscapeSequence | T.TemplateSubstitution)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function templateSubstitutionFrom(input?: NonNullable<T.TemplateSubstitution.Config['children']>[number] | T.TemplateSubstitution): {
    $type: TSKindId.TemplateSubstitution;
    $source: 2;
    $named: true;
    $children: T.SequenceExpression[];
    children(): T.SequenceExpression[];
    $with: {
        $child: (v: T.Expressions) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function templateTypeFrom(input?: NonNullable<T.TemplateType.Config['children']>[number] | T.TemplateType): {
    $type: TSKindId.TemplateType;
    $source: 2;
    $named: true;
    $children: (T.InferType | T.PrimaryType)[];
    children(): (T.InferType | T.PrimaryType)[];
    $with: {
        $child: (v: (T.PrimaryType | T.InferType)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function ternaryExpressionFrom(input: T.TernaryExpression.Loose): T.TernaryExpression;
export declare function thisFrom(input?: T.This): (T.This & AnyNodeData) | ({
    $type: TSKindId.This;
    $source: 2;
    $named: true;
    $text: 'this';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function throwStatementFrom(input: T.ThrowStatement.Loose): T.ThrowStatement | ({
    $type: TSKindId.ThrowStatement;
    $source: 2;
    $named: true;
    _semicolon: T.AutomaticSemicolon;
    $children: [] | readonly [T.SequenceExpression];
    semicolon(): T.AutomaticSemicolon;
    children(): [] | readonly [T.SequenceExpression];
    $with: {
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.SequenceExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function true_From(input?: T.True): (T.True & AnyNodeData) | ({
    $type: TSKindId.True;
    $source: 2;
    $named: true;
    $text: 'true';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function tryStatementFrom(input: T.TryStatement.Loose): T.TryStatement;
export declare function tupleParameterFrom(input: T.TupleParameter.Loose): T.TupleParameter;
export declare function tupleTypeFrom(...input: readonly (NonNullable<T.TupleType.Config['children']>[number] | T.TupleType)[]): {
    $type: TSKindId.TupleType;
    $source: 2;
    $named: true;
    $children: T.TupleTypeMember[];
    children(): T.TupleTypeMember[];
    $with: {
        $children: (...vs: T.TupleTypeMember[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function typeAliasDeclarationFrom(input: T.TypeAliasDeclaration.Loose): T.TypeAliasDeclaration;
export declare function typeAnnotationFrom(input: T.TypeAnnotation.Loose): T.TypeAnnotation;
export declare function typeArgumentsFrom(...input: readonly (NonNullable<T.TypeArguments.Config['children']>[number] | T.TypeArguments)[]): {
    $type: TSKindId.TypeArguments;
    $source: 2;
    $named: true;
    $children: T.Type[] & readonly [T.Type, ...T.Type[]];
    children(): T.Type[] & readonly [T.Type, ...T.Type[]];
    $with: {
        $children: (...vs: T.Type[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function typeAssertionFrom(input: T.TypeAssertion.Loose): T.TypeAssertion;
export declare function typeParameterFrom(input: T.TypeParameter.Loose): T.TypeParameter | ({
    $type: TSKindId.TypeParameter;
    $source: 2;
    $named: true;
    _const_marker: "const" | undefined;
    _name: T.TypeIdentifier;
    _constraint: T.Constraint | undefined;
    _value: T.DefaultType | undefined;
    constMarker(): "const" | undefined;
    name(): T.TypeIdentifier;
    constraint(): T.Constraint | undefined;
    value(): T.DefaultType | undefined;
    $with: {
        constMarker: (value?: import("@sittir/types").BooleanKeyword<T.ConstMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        constraint: (value?: T.Constraint) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (value?: T.DefaultType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function typeParametersFrom(...input: readonly (NonNullable<T.TypeParameters.Config['children']>[number] | T.TypeParameters)[]): {
    $type: TSKindId.TypeParameters;
    $source: 2;
    $named: true;
    $children: T.TypeParameter[] & readonly [T.TypeParameter, ...T.TypeParameter[]];
    children(): T.TypeParameter[] & readonly [T.TypeParameter, ...T.TypeParameter[]];
    $with: {
        $children: (...vs: T.TypeParameter[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function typePredicateFrom(input: T.TypePredicate.Loose): T.TypePredicate | ({
    $type: TSKindId.TypePredicate;
    $source: 2;
    $named: true;
    _name: string;
    _type: T.Type;
    name(): string;
    typeField(): T.Type;
    $with: {
        name: (value: T.PredefinedType | T.This) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function typePredicateAnnotationFrom(input: T.TypePredicateAnnotation.Loose): T.TypePredicateAnnotation;
export declare function typeQueryFrom(input?: NonNullable<T.TypeQuery.Config['children']>[number] | T.TypeQuery): {
    $type: TSKindId.TypeQuery;
    $source: 2;
    $named: true;
    $children: (T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression)[];
    children(): (T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression)[];
    $with: {
        $child: (v: (T.TypeQuerySubscriptExpression | T.TypeQueryMemberExpression | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.Identifier | T.This)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function unaryExpressionFrom(input: T.UnaryExpression.Loose): T.UnaryExpression | ({
    $type: TSKindId.UnaryExpression;
    $source: 2;
    $named: true;
    _operator: "!" | "+" | "-" | "delete" | "typeof" | "void" | "~";
    _argument: T.Expression;
    operator(): "!" | "+" | "-" | "delete" | "typeof" | "void" | "~";
    argument(): T.Expression;
    $with: {
        operator: (value: T.UnaryExpressionOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function undefined_From(input?: T.Undefined): (T.Undefined & AnyNodeData) | ({
    $type: TSKindId.Undefined;
    $source: 2;
    $named: true;
    $text: 'undefined';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function unescapedDoubleStringFragmentFrom(input: string | T.UnescapedDoubleStringFragment): T.UnescapedDoubleStringFragment;
export declare function unescapedSingleStringFragmentFrom(input: string | T.UnescapedSingleStringFragment): T.UnescapedSingleStringFragment;
export declare function unionTypeFrom(input: T.UnionType.Loose): T.UnionType;
export declare function updateExpressionFrom(input?: T.UpdateExpression.Loose): T.UpdateExpression | ({
    $type: TSKindId.UpdateExpression;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    $children: readonly [{
        $type: TSKindId.UpdateExpressionPrefix;
        $source: 2;
        $named: true;
        _operator: "++" | "--";
        _argument: T.Expression;
        operator(): "++" | "--";
        argument(): T.Expression;
        $with: {
            operator: (value: T.Operator) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            argument: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    operator(): "++" | "--";
    argument(): T.Expression;
    $with: {
        operator: (value: T.Operator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function updateExpressionUFormPostfixFrom(input: Omit<ConfigOf<T.UpdateExpressionUFormPostfix>, '$variant'>): {
    $type: TSKindId.UpdateExpression;
    $source: 2;
    $named: true;
    $variant: 'postfix';
    $children: readonly [{
        $type: TSKindId.UpdateExpressionPostfix;
        $source: 2;
        $named: true;
        _argument: T.Expression;
        _operator: "++" | "--";
        argument(): T.Expression;
        operator(): "++" | "--";
        $with: {
            argument: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            operator: (value: T.Operator) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    argument(): T.Expression;
    operator(): "++" | "--";
    $with: {
        argument: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (value: T.Operator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function updateExpressionUFormPrefixFrom(input: Omit<ConfigOf<T.UpdateExpressionUFormPrefix>, '$variant'>): {
    $type: TSKindId.UpdateExpression;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    $children: readonly [{
        $type: TSKindId.UpdateExpressionPrefix;
        $source: 2;
        $named: true;
        _operator: "++" | "--";
        _argument: T.Expression;
        operator(): "++" | "--";
        argument(): T.Expression;
        $with: {
            operator: (value: T.Operator) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
            argument: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.Comment | {
                    leading?: (T.Comment)[];
                    trailing?: (T.Comment)[];
                })[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.Comment | {
            leading?: (T.Comment)[];
            trailing?: (T.Comment)[];
        })[]): AnyNodeData;
    }];
    operator(): "++" | "--";
    argument(): T.Expression;
    $with: {
        operator: (value: T.Operator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function variableDeclarationFrom(input: T.VariableDeclaration.Loose): T.VariableDeclaration;
export declare function variableDeclaratorFrom(input: T.VariableDeclarator.Loose): T.VariableDeclarator;
export declare function whileStatementFrom(input: T.WhileStatement.Loose): T.WhileStatement;
export declare function withStatementFrom(input: T.WithStatement.Loose): T.WithStatement;
export declare function yieldExpressionFrom(input?: T.YieldExpression.Loose): T.YieldExpression;
export declare function htmlCommentFrom(input: string | T.HtmlComment): T.HtmlComment;
export declare function ororFrom(input: string | T.Oror): T.Oror | ({
    $type: TSKindId.PipePipe;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
});
export declare function jsxTextFrom(input: string | T.JsxText): T.JsxText;
//# sourceMappingURL=from.d.ts.map