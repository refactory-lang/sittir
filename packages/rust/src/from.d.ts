import type * as T from './types.js';
import { TSKindId } from './types.js';
import type { AnyNodeData, ConfigOf } from '@sittir/types';
export declare const _fromMap: {
    readonly "abstract_type": typeof abstractTypeFrom;
    readonly "arguments": typeof arguments_From;
    readonly "array_expression": typeof arrayExpressionFrom;
    readonly "array_type": typeof arrayTypeFrom;
    readonly "assignment_expression": typeof assignmentExpressionFrom;
    readonly "associated_type": typeof associatedTypeFrom;
    readonly "async_block": typeof asyncBlockFrom;
    readonly "attribute": typeof attributeFrom;
    readonly "attribute_item": typeof attributeItemFrom;
    readonly "await_expression": typeof awaitExpressionFrom;
    readonly "base_field_initializer": typeof baseFieldInitializerFrom;
    readonly "binary_expression": typeof binaryExpressionFrom;
    readonly "block": typeof blockFrom;
    readonly "block_comment": typeof blockCommentFrom;
    readonly "boolean_literal": typeof booleanLiteralFrom;
    readonly "bounded_type": typeof boundedTypeFrom;
    readonly "bracketed_type": typeof bracketedTypeFrom;
    readonly "break_expression": typeof breakExpressionFrom;
    readonly "call_expression": typeof callExpressionFrom;
    readonly "captured_pattern": typeof capturedPatternFrom;
    readonly "char_literal": typeof charLiteralFrom;
    readonly "closure_expression_expr": typeof closureExpressionExprFrom;
    readonly "closure_expression": typeof closureExpressionFrom;
    readonly "closure_parameters": typeof closureParametersFrom;
    readonly "compound_assignment_expr": typeof compoundAssignmentExprFrom;
    readonly "const_block": typeof constBlockFrom;
    readonly "const_item": typeof constItemFrom;
    readonly "const_parameter": typeof constParameterFrom;
    readonly "continue_expression": typeof continueExpressionFrom;
    readonly "crate": typeof crateFrom;
    readonly "declaration_list": typeof declarationListFrom;
    readonly "delim_token_tree_paren": typeof delimTokenTreeParenFrom;
    readonly "delim_token_tree_bracket": typeof delimTokenTreeBracketFrom;
    readonly "delim_token_tree_brace": typeof delimTokenTreeBraceFrom;
    readonly "delim_token_tree": typeof delimTokenTreeFrom;
    readonly "dynamic_type": typeof dynamicTypeFrom;
    readonly "else_clause": typeof elseClauseFrom;
    readonly "enum_item": typeof enumItemFrom;
    readonly "enum_variant": typeof enumVariantFrom;
    readonly "enum_variant_list": typeof enumVariantListFrom;
    readonly "escape_sequence": typeof escapeSequenceFrom;
    readonly "expression_statement_with_semi": typeof expressionStatementWithSemiFrom;
    readonly "expression_statement_block_ending": typeof expressionStatementBlockEndingFrom;
    readonly "expression_statement": typeof expressionStatementFrom;
    readonly "extern_crate_declaration": typeof externCrateDeclarationFrom;
    readonly "extern_modifier": typeof externModifierFrom;
    readonly "field_declaration": typeof fieldDeclarationFrom;
    readonly "field_declaration_list": typeof fieldDeclarationListFrom;
    readonly "field_expression": typeof fieldExpressionFrom;
    readonly "field_initializer": typeof fieldInitializerFrom;
    readonly "field_initializer_list": typeof fieldInitializerListFrom;
    readonly "field_pattern_shorthand": typeof fieldPatternShorthandFrom;
    readonly "field_pattern": typeof fieldPatternFrom;
    readonly "for_expression": typeof forExpressionFrom;
    readonly "for_lifetimes": typeof forLifetimesFrom;
    readonly "foreign_mod_item_body": typeof foreignModItemBodyFrom;
    readonly "foreign_mod_item": typeof foreignModItemFrom;
    readonly "fragment_specifier": typeof fragmentSpecifierFrom;
    readonly "function_item": typeof functionItemFrom;
    readonly "function_modifiers": typeof functionModifiersFrom;
    readonly "function_signature_item": typeof functionSignatureItemFrom;
    readonly "function_type": typeof functionTypeFrom;
    readonly "gen_block": typeof genBlockFrom;
    readonly "generic_function": typeof genericFunctionFrom;
    readonly "generic_pattern": typeof genericPatternFrom;
    readonly "generic_type": typeof genericTypeFrom;
    readonly "generic_type_with_turbofish": typeof genericTypeWithTurbofishFrom;
    readonly "higher_ranked_trait_bound": typeof higherRankedTraitBoundFrom;
    readonly "identifier": typeof identifierFrom;
    readonly "if_expression": typeof ifExpressionFrom;
    readonly "impl_item_body": typeof implItemBodyFrom;
    readonly "impl_item": typeof implItemFrom;
    readonly "index_expression": typeof indexExpressionFrom;
    readonly "inner_attribute_item": typeof innerAttributeItemFrom;
    readonly "integer_literal": typeof integerLiteralFrom;
    readonly "label": typeof labelFrom;
    readonly "last_match_arm": typeof lastMatchArmFrom;
    readonly "let_condition": typeof letConditionFrom;
    readonly "let_declaration": typeof letDeclarationFrom;
    readonly "lifetime": typeof lifetimeFrom;
    readonly "lifetime_parameter": typeof lifetimeParameterFrom;
    readonly "line_comment": typeof lineCommentFrom;
    readonly "loop_expression": typeof loopExpressionFrom;
    readonly "macro_definition_paren": typeof macroDefinitionParenFrom;
    readonly "macro_definition_bracket": typeof macroDefinitionBracketFrom;
    readonly "macro_definition_brace": typeof macroDefinitionBraceFrom;
    readonly "macro_definition": typeof macroDefinitionFrom;
    readonly "macro_invocation": typeof macroInvocationFrom;
    readonly "macro_rule": typeof macroRuleFrom;
    readonly "match_arm_block_ending": typeof matchArmBlockEndingFrom;
    readonly "match_arm": typeof matchArmFrom;
    readonly "match_block": typeof matchBlockFrom;
    readonly "match_expression": typeof matchExpressionFrom;
    readonly "match_pattern": typeof matchPatternFrom;
    readonly "metavariable": typeof metavariableFrom;
    readonly "mod_item_inline": typeof modItemInlineFrom;
    readonly "mod_item": typeof modItemFrom;
    readonly "mut_pattern": typeof mutPatternFrom;
    readonly "mutable_specifier": typeof mutableSpecifierFrom;
    readonly "negative_literal": typeof negativeLiteralFrom;
    readonly "or_pattern": typeof orPatternFrom;
    readonly "ordered_field_declaration_list": typeof orderedFieldDeclarationListFrom;
    readonly "parameter": typeof parameterFrom;
    readonly "parameters": typeof parametersFrom;
    readonly "parenthesized_expression": typeof parenthesizedExpressionFrom;
    readonly "pointer_type_mut": typeof pointerTypeMutFrom;
    readonly "pointer_type": typeof pointerTypeFrom;
    readonly "qualified_type": typeof qualifiedTypeFrom;
    readonly "range_expression_bare": typeof rangeExpressionBareFrom;
    readonly "range_expression": typeof rangeExpressionFrom;
    readonly "range_pattern": typeof rangePatternFrom;
    readonly "raw_string_literal": typeof rawStringLiteralFrom;
    readonly "ref_pattern": typeof refPatternFrom;
    readonly "reference_expression": typeof referenceExpressionFrom;
    readonly "reference_pattern": typeof referencePatternFrom;
    readonly "reference_type": typeof referenceTypeFrom;
    readonly "removed_trait_bound": typeof removedTraitBoundFrom;
    readonly "return_expression": typeof returnExpressionFrom;
    readonly "scoped_identifier": typeof scopedIdentifierFrom;
    readonly "scoped_type_identifier": typeof scopedTypeIdentifierFrom;
    readonly "scoped_type_identifier_in_expression_position": typeof scopedTypeIdentifierInExpressionPositionFrom;
    readonly "scoped_use_list": typeof scopedUseListFrom;
    readonly "self": typeof selfFrom;
    readonly "self_parameter": typeof selfParameterFrom;
    readonly "shebang": typeof shebangFrom;
    readonly "shorthand_field_initializer": typeof shorthandFieldInitializerFrom;
    readonly "slice_pattern": typeof slicePatternFrom;
    readonly "source_file": typeof sourceFileFrom;
    readonly "static_item": typeof staticItemFrom;
    readonly "string_literal": typeof stringLiteralFrom;
    readonly "struct_expression": typeof structExpressionFrom;
    readonly "struct_item": typeof structItemFrom;
    readonly "struct_pattern": typeof structPatternFrom;
    readonly "super": typeof superFrom;
    readonly "token_binding_pattern": typeof tokenBindingPatternFrom;
    readonly "token_repetition": typeof tokenRepetitionFrom;
    readonly "token_repetition_pattern": typeof tokenRepetitionPatternFrom;
    readonly "token_tree_paren": typeof tokenTreeParenFrom;
    readonly "token_tree_bracket": typeof tokenTreeBracketFrom;
    readonly "token_tree_brace": typeof tokenTreeBraceFrom;
    readonly "token_tree": typeof tokenTreeFrom;
    readonly "token_tree_pattern_paren": typeof tokenTreePatternParenFrom;
    readonly "token_tree_pattern_bracket": typeof tokenTreePatternBracketFrom;
    readonly "token_tree_pattern_brace": typeof tokenTreePatternBraceFrom;
    readonly "token_tree_pattern": typeof tokenTreePatternFrom;
    readonly "trait_bounds": typeof traitBoundsFrom;
    readonly "trait_item": typeof traitItemFrom;
    readonly "try_block": typeof tryBlockFrom;
    readonly "try_expression": typeof tryExpressionFrom;
    readonly "tuple_expression": typeof tupleExpressionFrom;
    readonly "tuple_pattern": typeof tuplePatternFrom;
    readonly "tuple_struct_pattern": typeof tupleStructPatternFrom;
    readonly "tuple_type": typeof tupleTypeFrom;
    readonly "type_arguments": typeof typeArgumentsFrom;
    readonly "type_binding": typeof typeBindingFrom;
    readonly "type_cast_expression": typeof typeCastExpressionFrom;
    readonly "type_item": typeof typeItemFrom;
    readonly "type_parameter": typeof typeParameterFrom;
    readonly "type_parameters": typeof typeParametersFrom;
    readonly "unary_expression": typeof unaryExpressionFrom;
    readonly "union_item": typeof unionItemFrom;
    readonly "unit_expression": typeof unitExpressionFrom;
    readonly "unit_type": typeof unitTypeFrom;
    readonly "unsafe_block": typeof unsafeBlockFrom;
    readonly "use_as_clause": typeof useAsClauseFrom;
    readonly "use_bounds": typeof useBoundsFrom;
    readonly "use_declaration": typeof useDeclarationFrom;
    readonly "use_list": typeof useListFrom;
    readonly "use_wildcard": typeof useWildcardFrom;
    readonly "variadic_parameter": typeof variadicParameterFrom;
    readonly "visibility_modifier_crate": typeof visibilityModifierCrateFrom;
    readonly "visibility_modifier": typeof visibilityModifierFrom;
    readonly "where_clause": typeof whereClauseFrom;
    readonly "where_predicate": typeof wherePredicateFrom;
    readonly "while_expression": typeof whileExpressionFrom;
    readonly "yield_expression": typeof yieldExpressionFrom;
    readonly "string_content": typeof stringContentFrom;
    readonly "raw_string_literal_content": typeof rawStringLiteralContentFrom;
    readonly "float_literal": typeof floatLiteralFrom;
};
export type _FromMap = typeof _fromMap;
export declare function abstractTypeFrom(input: T.AbstractType.Loose): T.AbstractType;
export declare function arguments_From(input: T.Arguments.Loose): T.Arguments;
export declare function arrayExpressionFrom(input?: T.ArrayExpression.Loose): T.ArrayExpression;
export declare function arrayExpressionUFormSemiFrom(input: Omit<ConfigOf<T.ArrayExpressionUFormSemi>, '$variant'>): {
    $type: TSKindId.ArrayExpression;
    $source: 2;
    $named: true;
    $variant: 'semi';
    $children: readonly [{
        $type: TSKindId.ArrayExpressionSemi;
        $source: 2;
        $named: true;
        _attributes: readonly T.AttributeItem[];
        _elements: T.Expression;
        _length: T.Expression;
        attributes(): readonly T.AttributeItem[];
        elements(): T.Expression;
        length(): T.Expression;
        $with: {
            attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            elements: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            length: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    attributes(): readonly T.AttributeItem[];
    elements(): T.Expression;
    length(): T.Expression;
    $with: {
        attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        elements: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        length: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function arrayExpressionUFormListFrom(input: Omit<ConfigOf<T.ArrayExpressionUFormList>, '$variant'>): {
    $type: TSKindId.ArrayExpression;
    $source: 2;
    $named: true;
    $variant: 'list';
    $children: readonly [{
        $type: TSKindId.ArrayExpressionList;
        $source: 2;
        $named: true;
        _attributes: readonly T.AttributeItem[];
        _elements: readonly T.Expression[];
        $children: readonly T.AttributeItem[];
        attributes(): readonly T.AttributeItem[];
        elements(): readonly T.Expression[];
        children(): readonly T.AttributeItem[];
        $with: {
            attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            elements: (...values: T.Expression[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            children: (...items: T.AttributeItem[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    attributes(): readonly T.AttributeItem[];
    elements(): readonly T.Expression[];
    $with: {
        attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        elements: (...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function arrayTypeFrom(input: T.ArrayType.Loose): T.ArrayType;
export declare function assignmentExpressionFrom(input: T.AssignmentExpression.Loose): T.AssignmentExpression;
export declare function associatedTypeFrom(input: T.AssociatedType.Loose): T.AssociatedType;
export declare function asyncBlockFrom(input: T.AsyncBlock.Loose): T.AsyncBlock | ({
    $type: TSKindId.AsyncBlock;
    $source: 2;
    $named: true;
    _move_marker: "move" | undefined;
    _block: T.Block;
    moveMarker(): "move" | undefined;
    block(): T.Block;
    $with: {
        moveMarker: (value?: import("@sittir/types").BooleanKeyword<T.MoveMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        block: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function attributeFrom(input: T.Attribute.Loose): T.Attribute | ({
    $type: TSKindId.Attribute;
    $source: 2;
    $named: true;
    _path: T.Path;
    $children: [] | readonly [T.DelimTokenTree | T.Expression];
    path(): T.Path;
    children(): [] | readonly [T.DelimTokenTree | T.Expression];
    $with: {
        path: (value: T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.DelimTokenTree | T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function attributeItemFrom(input: T.AttributeItem.Loose): T.AttributeItem;
export declare function awaitExpressionFrom(input?: NonNullable<T.AwaitExpression.Config['children']>[number] | T.AwaitExpression): {
    $type: TSKindId.AwaitExpression;
    $source: 2;
    $named: true;
    $children: T.Expression[];
    children(): T.Expression[];
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function baseFieldInitializerFrom(input?: NonNullable<T.BaseFieldInitializer.Config['children']>[number] | T.BaseFieldInitializer): {
    $type: TSKindId.BaseFieldInitializer;
    $source: 2;
    $named: true;
    $children: T.Expression[];
    children(): T.Expression[];
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function binaryExpressionFrom(input: T.BinaryExpression.Loose): T.BinaryExpression | ({
    $type: TSKindId.BinaryExpression;
    $source: 2;
    $named: true;
    _left: T.Expression;
    _operator: "&&";
    _right: T.Expression;
    left(): T.Expression;
    operator(): "&&";
    right(): T.Expression;
    $with: {
        left: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function blockFrom(input: T.Block.Loose): T.Block;
export declare function blockCommentFrom(input?: T.BlockComment.Loose): T.BlockComment | ({
    $type: TSKindId.BlockComment;
    $source: 2;
    $named: true;
    _doc: T.BlockCommentContent | undefined;
    $children: [] | readonly [T.InnerBlockDocCommentMarker | T.OuterBlockDocCommentMarker];
    doc(): T.BlockCommentContent | undefined;
    children(): [] | readonly [T.InnerBlockDocCommentMarker | T.OuterBlockDocCommentMarker];
    $with: {
        doc: (value?: T.BlockCommentContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.InnerBlockDocCommentMarker | T.OuterBlockDocCommentMarker) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function booleanLiteralFrom(input: string | T.BooleanLiteral): T.BooleanLiteral | ({
    $type: TSKindId.BooleanLiteral;
    $source: 2;
    $named: true;
    $text: "false" | "true";
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function boundedTypeFrom(input: T.BoundedType.Loose): T.BoundedType;
export declare function bracketedTypeFrom(input?: NonNullable<T.BracketedType.Config['children']>[number] | T.BracketedType): {
    $type: TSKindId.BracketedType;
    $source: 2;
    $named: true;
    $children: (T.QualifiedType | T._Type)[];
    children(): (T.QualifiedType | T._Type)[];
    $with: {
        $child: (v: (T._Type | T.QualifiedType)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function breakExpressionFrom(input?: T.BreakExpression.Loose): T.BreakExpression | ({
    $type: TSKindId.BreakExpression;
    $source: 2;
    $named: true;
    _label: T.Label | undefined;
    $children: [] | readonly [T.Expression];
    label(): T.Label | undefined;
    children(): [] | readonly [T.Expression];
    $with: {
        label: (value?: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function callExpressionFrom(input: T.CallExpression.Loose): T.CallExpression;
export declare function capturedPatternFrom(input: T.CapturedPattern.Loose): T.CapturedPattern | ({
    $type: TSKindId.CapturedPattern;
    $source: 2;
    $named: true;
    _identifier: string;
    $children: [] | readonly [T.Pattern];
    identifier(): string;
    children(): [] | readonly [T.Pattern];
    $with: {
        identifier: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function charLiteralFrom(input: string | T.CharLiteral): T.CharLiteral;
export declare function closureExpressionExprFrom(input: T.ClosureExpressionExpr.Loose): T.ClosureExpressionExpr | ({
    $type: TSKindId._ClosureExpressionExpr;
    $source: 2;
    $named: true;
    _body: "_" | T.Expression;
    body(): "_" | T.Expression;
    $with: {
        body: (value: T.Expression | "_") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function closureExpressionFrom(input?: T.ClosureExpression.Loose): T.ClosureExpression | ({
    $type: TSKindId.ClosureExpression;
    $source: 2;
    $named: true;
    $variant: 'expr';
    _static_marker: "static" | undefined;
    _async_marker: "async" | undefined;
    _move_marker: "move" | undefined;
    _parameters: T.ClosureParameters;
    $children: readonly [{
        $type: TSKindId._ClosureExpressionExpr;
        $source: 2;
        $named: true;
        _body: "_" | T.Expression;
        body(): "_" | T.Expression;
        $with: {
            body: (value: T.Expression | "_") => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    staticMarker(): "static" | undefined;
    asyncMarker(): "async" | undefined;
    moveMarker(): "move" | undefined;
    parameters(): T.ClosureParameters;
    body(): "_" | T.Expression;
    $with: {
        staticMarker: (value?: import("@sittir/types").BooleanKeyword<T.ClosureExpressionStaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.ClosureExpressionAsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        moveMarker: (value?: import("@sittir/types").BooleanKeyword<T.MoveMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (value: T.ClosureParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.Expression | "_") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function closureExpressionUFormBlockFrom(input: Omit<ConfigOf<T.ClosureExpressionUFormBlock>, '$variant'>): {
    $type: TSKindId.ClosureExpression;
    $source: 2;
    $named: true;
    $variant: 'block';
    _static_marker: "static" | undefined;
    _async_marker: "async" | undefined;
    _move_marker: "move" | undefined;
    _parameters: T.ClosureParameters;
    $children: readonly [{
        $type: TSKindId.ClosureExpressionBlock;
        $source: 2;
        $named: true;
        _return_type: T._Type | undefined;
        _body: T.Block;
        returnType(): T._Type | undefined;
        body(): T.Block;
        $with: {
            returnType: (value?: T._Type) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            body: (value: T.Block) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    staticMarker(): "static" | undefined;
    asyncMarker(): "async" | undefined;
    moveMarker(): "move" | undefined;
    parameters(): T.ClosureParameters;
    returnType(): T._Type | undefined;
    body(): T.Block;
    $with: {
        staticMarker: (value?: import("@sittir/types").BooleanKeyword<T.ClosureExpressionStaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.ClosureExpressionAsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        moveMarker: (value?: import("@sittir/types").BooleanKeyword<T.MoveMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (value: T.ClosureParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        returnType: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function closureExpressionUFormExprFrom(input: Omit<ConfigOf<T.ClosureExpressionUFormExpr>, '$variant'>): {
    $type: TSKindId.ClosureExpression;
    $source: 2;
    $named: true;
    $variant: 'expr';
    _static_marker: "static" | undefined;
    _async_marker: "async" | undefined;
    _move_marker: "move" | undefined;
    _parameters: T.ClosureParameters;
    $children: readonly [{
        $type: TSKindId._ClosureExpressionExpr;
        $source: 2;
        $named: true;
        _body: "_" | T.Expression;
        body(): "_" | T.Expression;
        $with: {
            body: (value: T.Expression | "_") => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    staticMarker(): "static" | undefined;
    asyncMarker(): "async" | undefined;
    moveMarker(): "move" | undefined;
    parameters(): T.ClosureParameters;
    body(): "_" | T.Expression;
    $with: {
        staticMarker: (value?: import("@sittir/types").BooleanKeyword<T.ClosureExpressionStaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        asyncMarker: (value?: import("@sittir/types").BooleanKeyword<T.ClosureExpressionAsyncMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        moveMarker: (value?: import("@sittir/types").BooleanKeyword<T.MoveMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (value: T.ClosureParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.Expression | "_") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function closureParametersFrom(...input: readonly (NonNullable<T.ClosureParameters.Config['children']>[number] | T.ClosureParameters)[]): {
    $type: TSKindId.ClosureParameters;
    $source: 2;
    $named: true;
    $children: (T.Parameter | T.Pattern)[];
    children(): (T.Parameter | T.Pattern)[];
    $with: {
        $children: (...vs: (T.Pattern | T.Parameter)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function compoundAssignmentExprFrom(input: T.CompoundAssignmentExpr.Loose): T.CompoundAssignmentExpr | ({
    $type: TSKindId.CompoundAssignmentExpr;
    $source: 2;
    $named: true;
    _left: T.Expression;
    _operator: "%=" | "&=" | "*=" | "+=" | "-=" | "/=" | "<<=" | ">>=" | "^=" | "|=";
    _right: T.Expression;
    left(): T.Expression;
    operator(): "%=" | "&=" | "*=" | "+=" | "-=" | "/=" | "<<=" | ">>=" | "^=" | "|=";
    right(): T.Expression;
    $with: {
        left: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        operator: (value: T.CompoundAssignmentExprOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function constBlockFrom(input: T.ConstBlock.Loose): T.ConstBlock;
export declare function constItemFrom(input: T.ConstItem.Loose): T.ConstItem | ({
    $type: TSKindId.ConstItem;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: string;
    _type: T._Type;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): string;
    typeField(): T._Type;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function constParameterFrom(input: T.ConstParameter.Loose): T.ConstParameter | ({
    $type: TSKindId.ConstParameter;
    $source: 2;
    $named: true;
    _name: string;
    _type: T._Type;
    _value: T.Block | T.Identifier | T.NegativeLiteral | T.Literal | undefined;
    name(): string;
    typeField(): T._Type;
    value(): T.Block | T.Identifier | T.NegativeLiteral | T.Literal | undefined;
    $with: {
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (value?: T.Block | T.Identifier | T.Literal | T.NegativeLiteral) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function continueExpressionFrom(input?: T.ContinueExpression.Loose): T.ContinueExpression;
export declare function crateFrom(input?: T.Crate): (T.Crate & AnyNodeData) | ({
    $type: TSKindId.Crate;
    $source: 2;
    $named: true;
    $text: 'crate';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function declarationListFrom(...input: readonly (NonNullable<T.DeclarationList.Config['children']>[number] | T.DeclarationList)[]): {
    $type: TSKindId.DeclarationList;
    $source: 2;
    $named: true;
    $children: T.DeclarationStatement[];
    children(): T.DeclarationStatement[];
    $with: {
        $children: (...vs: T.DeclarationStatement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function delimTokenTreeParenFrom(...input: readonly (NonNullable<T.DelimTokenTreeParen.Config['children']>[number] | T.DelimTokenTreeParen)[]): {
    $type: TSKindId._DelimTokenTreeParen;
    $source: 2;
    $named: true;
    $children: T.DelimTokens[];
    children(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function delimTokenTreeBracketFrom(...input: readonly (NonNullable<T.DelimTokenTreeBracket.Config['children']>[number] | T.DelimTokenTreeBracket)[]): {
    $type: TSKindId._DelimTokenTreeBracket;
    $source: 2;
    $named: true;
    $children: T.DelimTokens[];
    children(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function delimTokenTreeBraceFrom(...input: readonly (NonNullable<T.DelimTokenTreeBrace.Config['children']>[number] | T.DelimTokenTreeBrace)[]): {
    $type: TSKindId._DelimTokenTreeBrace;
    $source: 2;
    $named: true;
    $children: T.DelimTokens[];
    children(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function delimTokenTreeFrom(input?: T.DelimTokenTree.Loose): T.DelimTokenTree;
export declare function delimTokenTreeUFormParenFrom(input: Omit<ConfigOf<T.DelimTokenTreeUFormParen>, '$variant'>): {
    $type: TSKindId.DelimTokenTree;
    $source: 2;
    $named: true;
    $variant: 'paren';
    $children: readonly [{
        $type: TSKindId._DelimTokenTreeParen;
        $source: 2;
        $named: true;
        $children: T.DelimTokens[];
        children(): T.DelimTokens[];
        $with: {
            $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function delimTokenTreeUFormBracketFrom(input: Omit<ConfigOf<T.DelimTokenTreeUFormBracket>, '$variant'>): {
    $type: TSKindId.DelimTokenTree;
    $source: 2;
    $named: true;
    $variant: 'bracket';
    $children: readonly [{
        $type: TSKindId._DelimTokenTreeBracket;
        $source: 2;
        $named: true;
        $children: T.DelimTokens[];
        children(): T.DelimTokens[];
        $with: {
            $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function delimTokenTreeUFormBraceFrom(input: Omit<ConfigOf<T.DelimTokenTreeUFormBrace>, '$variant'>): {
    $type: TSKindId.DelimTokenTree;
    $source: 2;
    $named: true;
    $variant: 'brace';
    $children: readonly [{
        $type: TSKindId._DelimTokenTreeBrace;
        $source: 2;
        $named: true;
        $children: T.DelimTokens[];
        children(): T.DelimTokens[];
        $with: {
            $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function dynamicTypeFrom(input: T.DynamicType.Loose): T.DynamicType;
export declare function elseClauseFrom(input?: NonNullable<T.ElseClause.Config['children']>[number] | T.ElseClause): {
    $type: TSKindId.ElseClause;
    $source: 2;
    $named: true;
    $children: (T.Block | T.IfExpression)[];
    children(): (T.Block | T.IfExpression)[];
    $with: {
        $child: (v: (T.Block | T.IfExpression)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function enumItemFrom(input: T.EnumItem.Loose): T.EnumItem;
export declare function enumVariantFrom(input: T.EnumVariant.Loose): T.EnumVariant | ({
    $type: TSKindId.EnumVariant;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: string;
    _body: T.FieldDeclarationList | T.OrderedFieldDeclarationList | undefined;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): string;
    body(): T.FieldDeclarationList | T.OrderedFieldDeclarationList | undefined;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value?: T.FieldDeclarationList | T.OrderedFieldDeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function enumVariantListFrom(...input: readonly (NonNullable<T.EnumVariantList.Config['children']>[number] | T.EnumVariantList)[]): {
    $type: TSKindId.EnumVariantList;
    $source: 2;
    $named: true;
    $children: (T.AttributeItem | T.EnumVariant)[];
    children(): (T.AttributeItem | T.EnumVariant)[];
    $with: {
        $children: (...vs: (T.AttributeItem | T.EnumVariant)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function escapeSequenceFrom(input: string | T.EscapeSequence): T.EscapeSequence;
export declare function expressionStatementWithSemiFrom(input?: NonNullable<T.ExpressionStatementWithSemi.Config['children']>[number] | T.ExpressionStatementWithSemi): {
    $type: TSKindId._ExpressionStatementWithSemi;
    $source: 2;
    $named: true;
    $children: T.Expression[];
    children(): T.Expression[];
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function expressionStatementBlockEndingFrom(input?: NonNullable<T.ExpressionStatementBlockEnding.Config['children']>[number] | T.ExpressionStatementBlockEnding): {
    $type: TSKindId._ExpressionStatementBlockEnding;
    $source: 2;
    $named: true;
    $children: T.ExpressionEndingWithBlock[];
    children(): T.ExpressionEndingWithBlock[];
    $with: {
        $child: (v: T.ExpressionEndingWithBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function expressionStatementFrom(input?: T.ExpressionStatement.Loose): T.ExpressionStatement | ({
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'block_ending';
    $children: readonly [{
        $type: TSKindId._ExpressionStatementBlockEnding;
        $source: 2;
        $named: true;
        $children: T.ExpressionEndingWithBlock[];
        children(): T.ExpressionEndingWithBlock[];
        $with: {
            $child: (v: T.ExpressionEndingWithBlock) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function expressionStatementUFormWithSemiFrom(input: Omit<ConfigOf<T.ExpressionStatementUFormWithSemi>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'with_semi';
    $children: readonly [{
        $type: TSKindId._ExpressionStatementWithSemi;
        $source: 2;
        $named: true;
        $children: T.Expression[];
        children(): T.Expression[];
        $with: {
            $child: (v: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function expressionStatementUFormBlockEndingFrom(input: Omit<ConfigOf<T.ExpressionStatementUFormBlockEnding>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'block_ending';
    $children: readonly [{
        $type: TSKindId._ExpressionStatementBlockEnding;
        $source: 2;
        $named: true;
        $children: T.ExpressionEndingWithBlock[];
        children(): T.ExpressionEndingWithBlock[];
        $with: {
            $child: (v: T.ExpressionEndingWithBlock) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function externCrateDeclarationFrom(input: T.ExternCrateDeclaration.Loose): T.ExternCrateDeclaration | ({
    $type: TSKindId.ExternCrateDeclaration;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _crate: "crate";
    _name: string;
    _alias: string | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    crate(): "crate";
    name(): string;
    alias(): string | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        alias: (value?: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function externModifierFrom(input?: T.ExternModifier.Loose): T.ExternModifier;
export declare function fieldDeclarationFrom(input: T.FieldDeclaration.Loose): T.FieldDeclaration;
export declare function fieldDeclarationListFrom(...input: readonly (NonNullable<T.FieldDeclarationList.Config['children']>[number] | T.FieldDeclarationList)[]): {
    $type: TSKindId.FieldDeclarationList;
    $source: 2;
    $named: true;
    $children: (T.AttributeItem | T.FieldDeclaration)[];
    children(): (T.AttributeItem | T.FieldDeclaration)[];
    $with: {
        $children: (...vs: (T.AttributeItem | T.FieldDeclaration)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function fieldExpressionFrom(input: T.FieldExpression.Loose): T.FieldExpression;
export declare function fieldInitializerFrom(input: T.FieldInitializer.Loose): T.FieldInitializer;
export declare function fieldInitializerListFrom(...input: readonly (NonNullable<T.FieldInitializerList.Config['children']>[number] | T.FieldInitializerList)[]): {
    $type: TSKindId.FieldInitializerList;
    $source: 2;
    $named: true;
    $children: (T.BaseFieldInitializer | T.FieldInitializer | T.ShorthandFieldInitializer)[];
    children(): (T.BaseFieldInitializer | T.FieldInitializer | T.ShorthandFieldInitializer)[];
    $with: {
        $children: (...vs: (T.ShorthandFieldInitializer | T.FieldInitializer | T.BaseFieldInitializer)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function fieldPatternShorthandFrom(input: T.FieldPatternShorthand.Loose): T.FieldPatternShorthand | ({
    $type: TSKindId._FieldPatternShorthand;
    $source: 2;
    $named: true;
    _name: string;
    name(): string;
    $with: {
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function fieldPatternFrom(input?: T.FieldPattern.Loose): T.FieldPattern | ({
    $type: TSKindId.FieldPattern;
    $source: 2;
    $named: true;
    $variant: 'named';
    _ref_marker: "ref" | undefined;
    _mutable_specifier: "mut" | undefined;
    $children: readonly [{
        $type: TSKindId.FieldPatternNamed;
        $source: 2;
        $named: true;
        _name: T.FieldIdentifier;
        _pattern: T.Pattern;
        name(): T.FieldIdentifier;
        pattern(): T.Pattern;
        $with: {
            name: (value: T.FieldIdentifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            pattern: (value: T.Pattern) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    refMarker(): "ref" | undefined;
    mutableSpecifier(): "mut" | undefined;
    name(): T.FieldIdentifier;
    pattern(): T.Pattern;
    $with: {
        refMarker: (value?: import("@sittir/types").BooleanKeyword<T.RefMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.FieldIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function fieldPatternUFormShorthandFrom(input: Omit<ConfigOf<T.FieldPatternUFormShorthand>, '$variant'>): {
    $type: TSKindId.FieldPattern;
    $source: 2;
    $named: true;
    $variant: 'shorthand';
    _ref_marker: "ref" | undefined;
    _mutable_specifier: "mut" | undefined;
    $children: readonly [{
        $type: TSKindId._FieldPatternShorthand;
        $source: 2;
        $named: true;
        _name: string;
        name(): string;
        $with: {
            name: (value: T.Identifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    refMarker(): "ref" | undefined;
    mutableSpecifier(): "mut" | undefined;
    name(): string;
    $with: {
        refMarker: (value?: import("@sittir/types").BooleanKeyword<T.RefMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function fieldPatternUFormNamedFrom(input: Omit<ConfigOf<T.FieldPatternUFormNamed>, '$variant'>): {
    $type: TSKindId.FieldPattern;
    $source: 2;
    $named: true;
    $variant: 'named';
    _ref_marker: "ref" | undefined;
    _mutable_specifier: "mut" | undefined;
    $children: readonly [{
        $type: TSKindId.FieldPatternNamed;
        $source: 2;
        $named: true;
        _name: T.FieldIdentifier;
        _pattern: T.Pattern;
        name(): T.FieldIdentifier;
        pattern(): T.Pattern;
        $with: {
            name: (value: T.FieldIdentifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            pattern: (value: T.Pattern) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    refMarker(): "ref" | undefined;
    mutableSpecifier(): "mut" | undefined;
    name(): T.FieldIdentifier;
    pattern(): T.Pattern;
    $with: {
        refMarker: (value?: import("@sittir/types").BooleanKeyword<T.RefMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.FieldIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function forExpressionFrom(input: T.ForExpression.Loose): T.ForExpression;
export declare function forLifetimesFrom(...input: readonly (NonNullable<T.ForLifetimes.Config['children']>[number] | T.ForLifetimes)[]): {
    $type: TSKindId.ForLifetimes;
    $source: 2;
    $named: true;
    $children: T.Lifetime[] & readonly [T.Lifetime, ...T.Lifetime[]];
    children(): T.Lifetime[] & readonly [T.Lifetime, ...T.Lifetime[]];
    $with: {
        $children: (...vs: T.Lifetime[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function foreignModItemBodyFrom(input: T.ForeignModItemBody.Loose): T.ForeignModItemBody | ({
    $type: TSKindId._ForeignModItemBody;
    $source: 2;
    $named: true;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function foreignModItemFrom(input?: T.ForeignModItem.Loose): T.ForeignModItem;
export declare function foreignModItemUFormSemiFrom(input: Omit<ConfigOf<T.ForeignModItemUFormSemi>, '$variant'>): {
    $type: TSKindId.ForeignModItem;
    $source: 2;
    $named: true;
    $variant: 'semi';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _extern_modifier: T.ExternModifier;
    visibilityModifier(): T.VisibilityModifier | undefined;
    externModifier(): T.ExternModifier;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        externModifier: (value: T.ExternModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function foreignModItemUFormBodyFrom(input: Omit<ConfigOf<T.ForeignModItemUFormBody>, '$variant'>): {
    $type: TSKindId.ForeignModItem;
    $source: 2;
    $named: true;
    $variant: 'body';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _extern_modifier: T.ExternModifier;
    $children: readonly [{
        $type: TSKindId._ForeignModItemBody;
        $source: 2;
        $named: true;
        _body: T.DeclarationList;
        body(): T.DeclarationList;
        $with: {
            body: (value: T.DeclarationList) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    visibilityModifier(): T.VisibilityModifier | undefined;
    externModifier(): T.ExternModifier;
    body(): T.DeclarationList;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        externModifier: (value: T.ExternModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function fragmentSpecifierFrom(input: string | T.FragmentSpecifier): T.FragmentSpecifier | ({
    $type: TSKindId.FragmentSpecifier;
    $source: 2;
    $named: true;
    $text: "block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis";
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function functionItemFrom(input: T.FunctionItem.Loose): T.FunctionItem | ({
    $type: TSKindId.FunctionItem;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _function_modifiers: T.FunctionModifiers | undefined;
    _name: string;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.Parameters;
    _return_type: T._Type | undefined;
    _where_clause: T.WhereClause | undefined;
    _body: T.Block;
    visibilityModifier(): T.VisibilityModifier | undefined;
    functionModifiers(): T.FunctionModifiers | undefined;
    name(): string;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.Parameters;
    returnType(): T._Type | undefined;
    whereClause(): T.WhereClause | undefined;
    body(): T.Block;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        functionModifiers: (value?: T.FunctionModifiers) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier | T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (value: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        returnType: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function functionModifiersFrom(input: T.FunctionModifiers.Loose): T.FunctionModifiers;
export declare function functionSignatureItemFrom(input: T.FunctionSignatureItem.Loose): T.FunctionSignatureItem | ({
    $type: TSKindId.FunctionSignatureItem;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _function_modifiers: T.FunctionModifiers | undefined;
    _name: string;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.Parameters;
    _return_type: T._Type | undefined;
    _where_clause: T.WhereClause | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    functionModifiers(): T.FunctionModifiers | undefined;
    name(): string;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.Parameters;
    returnType(): T._Type | undefined;
    whereClause(): T.WhereClause | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        functionModifiers: (value?: T.FunctionModifiers) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier | T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (value: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        returnType: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function functionTypeFrom(input: T.FunctionType.Loose): T.FunctionType | ({
    $type: TSKindId.FunctionType;
    $source: 2;
    $named: true;
    _for_lifetimes: T.ForLifetimes | undefined;
    _parameters: T.Parameters;
    _return_type: T._Type | undefined;
    $children: [] | readonly [T.FunctionTypeFnForm | T.FunctionTypeTraitForm];
    forLifetimes(): T.ForLifetimes | undefined;
    parameters(): T.Parameters;
    returnType(): T._Type | undefined;
    children(): [] | readonly [T.FunctionTypeFnForm | T.FunctionTypeTraitForm];
    $with: {
        forLifetimes: (value?: T.ForLifetimes) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (value: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        returnType: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.FunctionTypeFnForm | T.FunctionTypeTraitForm) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function genBlockFrom(input: T.GenBlock.Loose): T.GenBlock | ({
    $type: TSKindId.GenBlock;
    $source: 2;
    $named: true;
    _move_marker: "move" | undefined;
    _block: T.Block;
    moveMarker(): "move" | undefined;
    block(): T.Block;
    $with: {
        moveMarker: (value?: import("@sittir/types").BooleanKeyword<T.MoveMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        block: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function genericFunctionFrom(input: T.GenericFunction.Loose): T.GenericFunction;
export declare function genericPatternFrom(input: T.GenericPattern.Loose): T.GenericPattern | ({
    $type: TSKindId.GenericPattern;
    $source: 2;
    $named: true;
    _type_arguments: T.TypeArguments;
    $children: [] | readonly [T.Identifier | T.ScopedIdentifier];
    typeArguments(): T.TypeArguments;
    children(): [] | readonly [T.Identifier | T.ScopedIdentifier];
    $with: {
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.Identifier | T.ScopedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function genericTypeFrom(input: T.GenericType.Loose): T.GenericType;
export declare function genericTypeWithTurbofishFrom(input: T.GenericTypeWithTurbofish.Loose): T.GenericTypeWithTurbofish | ({
    $type: TSKindId.GenericTypeWithTurbofish;
    $source: 2;
    $named: true;
    _type: T.ScopedIdentifier | T.TypeIdentifier;
    _turbofish: "::";
    _type_arguments: T.TypeArguments;
    typeField(): T.ScopedIdentifier | T.TypeIdentifier;
    turbofish(): "::";
    typeArguments(): T.TypeArguments;
    $with: {
        typeField: (value: T.TypeIdentifier | T.ScopedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function higherRankedTraitBoundFrom(input: T.HigherRankedTraitBound.Loose): T.HigherRankedTraitBound;
export declare function identifierFrom(input: string | T.Identifier): T.Identifier;
export declare function ifExpressionFrom(input: T.IfExpression.Loose): T.IfExpression;
export declare function implItemBodyFrom(input: T.ImplItemBody.Loose): T.ImplItemBody | ({
    $type: TSKindId._ImplItemBody;
    $source: 2;
    $named: true;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function implItemFrom(input?: T.ImplItem.Loose): T.ImplItem | ({
    $type: TSKindId.ImplItem;
    $source: 2;
    $named: true;
    $variant: 'semi';
    _unsafe_marker: "unsafe" | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _negative: "!" | undefined;
    _trait: T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    _type: T._Type;
    _where_clause: T.WhereClause | undefined;
    unsafeMarker(): "unsafe" | undefined;
    typeParameters(): T.TypeParameters | undefined;
    negative(): "!" | undefined;
    trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    typeField(): T._Type;
    whereClause(): T.WhereClause | undefined;
    $with: {
        unsafeMarker: (value?: import("@sittir/types").BooleanKeyword<T.UnsafeMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        negative: (value?: import("@sittir/types").BooleanKeyword<T.ImplItemNegative>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        trait: (value?: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function implItemUFormBodyFrom(input: Omit<ConfigOf<T.ImplItemUFormBody>, '$variant'>): {
    $type: TSKindId.ImplItem;
    $source: 2;
    $named: true;
    $variant: 'body';
    _unsafe_marker: "unsafe" | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _negative: "!" | undefined;
    _trait: T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    _type: T._Type;
    _where_clause: T.WhereClause | undefined;
    $children: readonly [{
        $type: TSKindId._ImplItemBody;
        $source: 2;
        $named: true;
        _body: T.DeclarationList;
        body(): T.DeclarationList;
        $with: {
            body: (value: T.DeclarationList) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    unsafeMarker(): "unsafe" | undefined;
    typeParameters(): T.TypeParameters | undefined;
    negative(): "!" | undefined;
    trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    typeField(): T._Type;
    whereClause(): T.WhereClause | undefined;
    body(): T.DeclarationList;
    $with: {
        unsafeMarker: (value?: import("@sittir/types").BooleanKeyword<T.UnsafeMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        negative: (value?: import("@sittir/types").BooleanKeyword<T.ImplItemNegative>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        trait: (value?: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function implItemUFormSemiFrom(input: Omit<ConfigOf<T.ImplItemUFormSemi>, '$variant'>): {
    $type: TSKindId.ImplItem;
    $source: 2;
    $named: true;
    $variant: 'semi';
    _unsafe_marker: "unsafe" | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _negative: "!" | undefined;
    _trait: T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    _type: T._Type;
    _where_clause: T.WhereClause | undefined;
    unsafeMarker(): "unsafe" | undefined;
    typeParameters(): T.TypeParameters | undefined;
    negative(): "!" | undefined;
    trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    typeField(): T._Type;
    whereClause(): T.WhereClause | undefined;
    $with: {
        unsafeMarker: (value?: import("@sittir/types").BooleanKeyword<T.UnsafeMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        negative: (value?: import("@sittir/types").BooleanKeyword<T.ImplItemNegative>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        trait: (value?: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function indexExpressionFrom(input: T.IndexExpression.Loose): T.IndexExpression;
export declare function innerAttributeItemFrom(input: T.InnerAttributeItem.Loose): T.InnerAttributeItem;
export declare function integerLiteralFrom(input: string | T.IntegerLiteral): T.IntegerLiteral;
export declare function labelFrom(input: T.Label.Loose): T.Label | ({
    $type: TSKindId.Label;
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
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function lastMatchArmFrom(input: T.LastMatchArm.Loose): T.LastMatchArm;
export declare function letConditionFrom(input: T.LetCondition.Loose): T.LetCondition;
export declare function letDeclarationFrom(input: T.LetDeclaration.Loose): T.LetDeclaration | ({
    $type: TSKindId.LetDeclaration;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut" | undefined;
    _pattern: T.Pattern;
    _type: T._Type | undefined;
    _value: T.Expression | undefined;
    _alternative: T.Block | undefined;
    mutableSpecifier(): "mut" | undefined;
    pattern(): T.Pattern;
    typeField(): T._Type | undefined;
    value(): T.Expression | undefined;
    alternative(): T.Block | undefined;
    $with: {
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        alternative: (value?: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function lifetimeFrom(input: T.Lifetime.Loose): T.Lifetime | ({
    $type: TSKindId.Lifetime;
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
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function lifetimeParameterFrom(input: T.LifetimeParameter.Loose): T.LifetimeParameter;
export declare function lineCommentFrom(input?: T.LineComment.Loose): T.LineComment | ({
    $type: TSKindId.LineComment;
    $source: 2;
    $named: true;
    $variant: 'content';
    $children: [] | readonly [T.LineCommentContent];
    children(): [] | readonly [T.LineCommentContent];
    $with: {
        children: (items_0: T.LineCommentContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function lineCommentUFormRegularDslashFrom(input: Omit<ConfigOf<T.LineCommentUFormRegularDslash>, '$variant'>): {
    $type: TSKindId.LineComment;
    $source: 2;
    $named: true;
    $variant: 'regular_dslash';
    $children: [] | readonly [T.LineCommentRegularDslash];
    children(): [] | readonly [T.LineCommentRegularDslash];
    $with: {
        children: (items_0: T.LineCommentRegularDslash) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function lineCommentUFormDocFrom(input: Omit<ConfigOf<T.LineCommentUFormDoc>, '$variant'>): {
    $type: TSKindId.LineComment;
    $source: 2;
    $named: true;
    $variant: 'doc';
    $children: readonly [{
        $type: TSKindId.LineCommentDoc;
        $source: 2;
        $named: true;
        _doc: string;
        doc(): string;
        $with: {
            doc: (value: T.LineDocContent) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    doc(): string;
    $with: {
        doc: (value: T.LineDocContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function lineCommentUFormContentFrom(input: Omit<ConfigOf<T.LineCommentUFormContent>, '$variant'>): {
    $type: TSKindId.LineComment;
    $source: 2;
    $named: true;
    $variant: 'content';
    $children: [] | readonly [T.LineCommentContent];
    children(): [] | readonly [T.LineCommentContent];
    $with: {
        children: (items_0: T.LineCommentContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function loopExpressionFrom(input: T.LoopExpression.Loose): T.LoopExpression;
export declare function macroDefinitionParenFrom(...input: readonly (NonNullable<T.MacroDefinitionParen.Config['children']>[number] | T.MacroDefinitionParen)[]): {
    $type: TSKindId._MacroDefinitionParen;
    $source: 2;
    $named: true;
    $children: T.MacroRule[];
    children(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function macroDefinitionBracketFrom(...input: readonly (NonNullable<T.MacroDefinitionBracket.Config['children']>[number] | T.MacroDefinitionBracket)[]): {
    $type: TSKindId._MacroDefinitionBracket;
    $source: 2;
    $named: true;
    $children: T.MacroRule[];
    children(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function macroDefinitionBraceFrom(...input: readonly (NonNullable<T.MacroDefinitionBrace.Config['children']>[number] | T.MacroDefinitionBrace)[]): {
    $type: TSKindId._MacroDefinitionBrace;
    $source: 2;
    $named: true;
    $children: T.MacroRule[];
    children(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function macroDefinitionFrom(input?: T.MacroDefinition.Loose): T.MacroDefinition;
export declare function macroDefinitionUFormParenFrom(input: Omit<ConfigOf<T.MacroDefinitionUFormParen>, '$variant'>): {
    $type: TSKindId.MacroDefinition;
    $source: 2;
    $named: true;
    $variant: 'paren';
    _name: T.Identifier | T.ReservedIdentifier;
    $children: readonly [{
        $type: TSKindId._MacroDefinitionParen;
        $source: 2;
        $named: true;
        $children: T.MacroRule[];
        children(): T.MacroRule[];
        $with: {
            $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    name(): T.Identifier | T.ReservedIdentifier;
    $with: {
        name: (value: T.Identifier | T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function macroDefinitionUFormBracketFrom(input: Omit<ConfigOf<T.MacroDefinitionUFormBracket>, '$variant'>): {
    $type: TSKindId.MacroDefinition;
    $source: 2;
    $named: true;
    $variant: 'bracket';
    _name: T.Identifier | T.ReservedIdentifier;
    $children: readonly [{
        $type: TSKindId._MacroDefinitionBracket;
        $source: 2;
        $named: true;
        $children: T.MacroRule[];
        children(): T.MacroRule[];
        $with: {
            $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    name(): T.Identifier | T.ReservedIdentifier;
    $with: {
        name: (value: T.Identifier | T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function macroDefinitionUFormBraceFrom(input: Omit<ConfigOf<T.MacroDefinitionUFormBrace>, '$variant'>): {
    $type: TSKindId.MacroDefinition;
    $source: 2;
    $named: true;
    $variant: 'brace';
    _name: T.Identifier | T.ReservedIdentifier;
    $children: readonly [{
        $type: TSKindId._MacroDefinitionBrace;
        $source: 2;
        $named: true;
        $children: T.MacroRule[];
        children(): T.MacroRule[];
        $with: {
            $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    name(): T.Identifier | T.ReservedIdentifier;
    $with: {
        name: (value: T.Identifier | T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function macroInvocationFrom(input: T.MacroInvocation.Loose): T.MacroInvocation;
export declare function macroRuleFrom(input: T.MacroRule.Loose): T.MacroRule;
export declare function matchArmBlockEndingFrom(input: T.MatchArmBlockEnding.Loose): T.MatchArmBlockEnding | ({
    $type: TSKindId._MatchArmBlockEnding;
    $source: 2;
    $named: true;
    _value: T.ExpressionEndingWithBlock;
    value(): T.ExpressionEndingWithBlock;
    $with: {
        value: (value: T.ExpressionEndingWithBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function matchArmFrom(input?: T.MatchArm.Loose): T.MatchArm;
export declare function matchArmUFormWithCommaFrom(input: Omit<ConfigOf<T.MatchArmUFormWithComma>, '$variant'>): {
    $type: TSKindId.MatchArm;
    $source: 2;
    $named: true;
    $variant: 'with_comma';
    _attributes: readonly (T.AttributeItem | T.InnerAttributeItem)[];
    _pattern: T.MatchPattern;
    $children: readonly [{
        $type: TSKindId.MatchArmWithComma;
        $source: 2;
        $named: true;
        _value: T.Expression;
        value(): T.Expression;
        $with: {
            value: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    attributes(): readonly (T.AttributeItem | T.InnerAttributeItem)[];
    pattern(): T.MatchPattern;
    value(): T.Expression;
    $with: {
        attributes: (...values: (T.AttributeItem | T.InnerAttributeItem)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (value: T.MatchPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function matchArmUFormBlockEndingFrom(input: Omit<ConfigOf<T.MatchArmUFormBlockEnding>, '$variant'>): {
    $type: TSKindId.MatchArm;
    $source: 2;
    $named: true;
    $variant: 'block_ending';
    _attributes: readonly (T.AttributeItem | T.InnerAttributeItem)[];
    _pattern: T.MatchPattern;
    $children: readonly [{
        $type: TSKindId._MatchArmBlockEnding;
        $source: 2;
        $named: true;
        _value: T.ExpressionEndingWithBlock;
        value(): T.ExpressionEndingWithBlock;
        $with: {
            value: (value: T.ExpressionEndingWithBlock) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    attributes(): readonly (T.AttributeItem | T.InnerAttributeItem)[];
    pattern(): T.MatchPattern;
    value(): T.ExpressionEndingWithBlock;
    $with: {
        attributes: (...values: (T.AttributeItem | T.InnerAttributeItem)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (value: T.MatchPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (value: T.ExpressionEndingWithBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function matchBlockFrom(...input: readonly (NonNullable<T.MatchBlock.Config['children']>[number] | T.MatchBlock)[]): {
    $type: TSKindId.MatchBlock;
    $source: 2;
    $named: true;
    $children: (T.LastMatchArm | T.MatchArm)[];
    children(): (T.LastMatchArm | T.MatchArm)[];
    $with: {
        $children: (...vs: (T.MatchArm | T.LastMatchArm)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function matchExpressionFrom(input: T.MatchExpression.Loose): T.MatchExpression;
export declare function matchPatternFrom(input: T.MatchPattern.Loose): T.MatchPattern | ({
    $type: TSKindId.MatchPattern;
    $source: 2;
    $named: true;
    _condition: T.Condition | undefined;
    $children: [] | readonly [T.Pattern];
    condition(): T.Condition | undefined;
    children(): [] | readonly [T.Pattern];
    $with: {
        condition: (value?: T.Condition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function metavariableFrom(input: string | T.Metavariable): T.Metavariable;
export declare function modItemInlineFrom(input: T.ModItemInline.Loose): T.ModItemInline | ({
    $type: TSKindId._ModItemInline;
    $source: 2;
    $named: true;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function modItemFrom(input?: T.ModItem.Loose): T.ModItem | ({
    $type: TSKindId.ModItem;
    $source: 2;
    $named: true;
    $variant: 'inline';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: string;
    $children: readonly [{
        $type: TSKindId._ModItemInline;
        $source: 2;
        $named: true;
        _body: T.DeclarationList;
        body(): T.DeclarationList;
        $with: {
            body: (value: T.DeclarationList) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): string;
    body(): T.DeclarationList;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function modItemUFormExternalFrom(input: Omit<ConfigOf<T.ModItemUFormExternal>, '$variant'>): {
    $type: TSKindId.ModItem;
    $source: 2;
    $named: true;
    $variant: 'external';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: string;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): string;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function modItemUFormInlineFrom(input: Omit<ConfigOf<T.ModItemUFormInline>, '$variant'>): {
    $type: TSKindId.ModItem;
    $source: 2;
    $named: true;
    $variant: 'inline';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: string;
    $children: readonly [{
        $type: TSKindId._ModItemInline;
        $source: 2;
        $named: true;
        _body: T.DeclarationList;
        body(): T.DeclarationList;
        $with: {
            body: (value: T.DeclarationList) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): string;
    body(): T.DeclarationList;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function mutPatternFrom(input: T.MutPattern.Loose): T.MutPattern | ({
    $type: TSKindId.MutPattern;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut";
    $children: [] | readonly [T.Pattern];
    mutableSpecifier(): "mut";
    children(): [] | readonly [T.Pattern];
    $with: {
        children: (items_0: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function mutableSpecifierFrom(input?: T.MutableSpecifier): (T.MutableSpecifier & AnyNodeData) | ({
    $type: TSKindId.MutableSpecifier;
    $source: 2;
    $named: true;
    $text: 'mut';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function negativeLiteralFrom(input: T.NegativeLiteral.Loose): T.NegativeLiteral | ({
    $type: TSKindId.NegativeLiteral;
    $source: 2;
    $named: true;
    _value: string;
    value(): string;
    $with: {
        value: (value: T.IntegerLiteral | T.FloatLiteral) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function orPatternFrom(input?: T.OrPattern.Loose): T.OrPattern;
export declare function orPatternUFormBinaryFrom(input: Omit<ConfigOf<T.OrPatternUFormBinary>, '$variant'>): {
    $type: TSKindId.OrPattern;
    $source: 2;
    $named: true;
    $variant: 'binary';
    $children: readonly [{
        $type: TSKindId.OrPatternBinary;
        $source: 2;
        $named: true;
        _left: T.Pattern;
        _right: T.Pattern;
        left(): T.Pattern;
        right(): T.Pattern;
        $with: {
            left: (value: T.Pattern) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            right: (value: T.Pattern) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    left(): T.Pattern;
    right(): T.Pattern;
    $with: {
        left: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function orPatternUFormPrefixFrom(input: Omit<ConfigOf<T.OrPatternUFormPrefix>, '$variant'>): {
    $type: TSKindId.OrPattern;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    $children: readonly [{
        $type: TSKindId.OrPatternPrefix;
        $source: 2;
        $named: true;
        _right: T.Pattern;
        right(): T.Pattern;
        $with: {
            right: (value: T.Pattern) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    right(): T.Pattern;
    $with: {
        right: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function orderedFieldDeclarationListFrom(input: T.OrderedFieldDeclarationList.Loose): T.OrderedFieldDeclarationList;
export declare function parameterFrom(input: T.Parameter.Loose): T.Parameter | ({
    $type: TSKindId.Parameter;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut" | undefined;
    _pattern: T.Self | T.Pattern;
    _type: T._Type;
    mutableSpecifier(): "mut" | undefined;
    pattern(): T.Self | T.Pattern;
    typeField(): T._Type;
    $with: {
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (value: T.Pattern | T.Self) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function parametersFrom(...input: readonly (NonNullable<T.Parameters.Config['children']>[number] | T.Parameters)[]): {
    $type: TSKindId.Parameters;
    $source: 2;
    $named: true;
    $children: (T.AttributeItem | T.Parameter | T.SelfParameter | T.VariadicParameter | T._Type)[];
    children(): (T.AttributeItem | T.Parameter | T.SelfParameter | T.VariadicParameter | T._Type)[];
    $with: {
        $children: (...vs: (T.AttributeItem | T.Parameter | T.SelfParameter | T.VariadicParameter | T._Type)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function parenthesizedExpressionFrom(input?: NonNullable<T.ParenthesizedExpression.Config['children']>[number] | T.ParenthesizedExpression): {
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    $children: T.Expression[];
    children(): T.Expression[];
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function pointerTypeMutFrom(input?: NonNullable<T.PointerTypeMut.Config['children']>[number] | T.PointerTypeMut): {
    $type: TSKindId._PointerTypeMut;
    $source: 2;
    $named: true;
    $children: T.MutableSpecifier[];
    children(): T.MutableSpecifier[];
    $with: {
        $child: (v: T.MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function pointerTypeFrom(input?: T.PointerType.Loose): T.PointerType | ({
    $type: TSKindId.PointerType;
    $source: 2;
    $named: true;
    $variant: 'mut';
    _type: T._Type;
    $children: readonly [{
        $type: TSKindId._PointerTypeMut;
        $source: 2;
        $named: true;
        $children: T.MutableSpecifier[];
        children(): T.MutableSpecifier[];
        $with: {
            $child: (v: T.MutableSpecifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    typeField(): T._Type;
    $with: {
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function pointerTypeUFormConstFrom(input: Omit<ConfigOf<T.PointerTypeUFormConst>, '$variant'>): {
    $type: TSKindId.PointerType;
    $source: 2;
    $named: true;
    $variant: 'const';
    _type: T._Type;
    typeField(): T._Type;
    $with: {
        typeField: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function pointerTypeUFormMutFrom(input: Omit<ConfigOf<T.PointerTypeUFormMut>, '$variant'>): {
    $type: TSKindId.PointerType;
    $source: 2;
    $named: true;
    $variant: 'mut';
    _type: T._Type;
    $children: readonly [{
        $type: TSKindId._PointerTypeMut;
        $source: 2;
        $named: true;
        $children: T.MutableSpecifier[];
        children(): T.MutableSpecifier[];
        $with: {
            $child: (v: T.MutableSpecifier) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    typeField(): T._Type;
    $with: {
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function qualifiedTypeFrom(input: T.QualifiedType.Loose): T.QualifiedType;
export declare function rangeExpressionBareFrom(input?: T.RangeExpressionBare.Loose): T.RangeExpressionBare | ({
    $type: TSKindId._RangeExpressionBare;
    $source: 2;
    $named: true;
    _operator: "..";
    operator(): "..";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function rangeExpressionFrom(input?: T.RangeExpression.Loose): T.RangeExpression | ({
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'bare';
    $children: readonly [{
        $type: TSKindId._RangeExpressionBare;
        $source: 2;
        $named: true;
        _operator: "..";
        operator(): "..";
        $with: {};
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    operator(): "..";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function rangeExpressionUFormBinaryFrom(input: Omit<ConfigOf<T.RangeExpressionUFormBinary>, '$variant'>): {
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'binary';
    $children: readonly [{
        $type: TSKindId.RangeExpressionBinary;
        $source: 2;
        $named: true;
        _start: T.Expression;
        _operator: ".." | "..." | "..=";
        _end: T.Expression;
        start(): T.Expression;
        operator(): ".." | "..." | "..=";
        end(): T.Expression;
        $with: {
            start: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            operator: (value: T.RangeExpressionBinaryOperator) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            end: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    start(): T.Expression;
    operator(): ".." | "..." | "..=";
    end(): T.Expression;
    $with: {
        start: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        operator: (value: T.RangeExpressionBinaryOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        end: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function rangeExpressionUFormPostfixFrom(input: Omit<ConfigOf<T.RangeExpressionUFormPostfix>, '$variant'>): {
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'postfix';
    $children: readonly [{
        $type: TSKindId.RangeExpressionPostfix;
        $source: 2;
        $named: true;
        _start: T.Expression;
        _operator: "..";
        start(): T.Expression;
        operator(): "..";
        $with: {
            start: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    start(): T.Expression;
    operator(): "..";
    $with: {
        start: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function rangeExpressionUFormPrefixFrom(input: Omit<ConfigOf<T.RangeExpressionUFormPrefix>, '$variant'>): {
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    $children: readonly [{
        $type: TSKindId.RangeExpressionPrefix;
        $source: 2;
        $named: true;
        _operator: "..";
        _end: T.Expression;
        operator(): "..";
        end(): T.Expression;
        $with: {
            end: (value: T.Expression) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    operator(): "..";
    end(): T.Expression;
    $with: {
        end: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function rangeExpressionUFormBareFrom(_input?: Omit<ConfigOf<T.RangeExpressionUFormBare>, '$variant'>): {
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'bare';
    $children: readonly [{
        $type: TSKindId._RangeExpressionBare;
        $source: 2;
        $named: true;
        _operator: "..";
        operator(): "..";
        $with: {};
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    operator(): "..";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function rangePatternFrom(input?: T.RangePattern.Loose): T.RangePattern;
export declare function rangePatternUFormLeftWithRightFrom(input: Omit<ConfigOf<T.RangePatternUFormLeftWithRight>, '$variant'>): {
    $type: TSKindId.RangePattern;
    $source: 2;
    $named: true;
    $variant: 'left_with_right';
    _left: T.LiteralPattern | T.Path;
    $children: readonly [{
        $type: TSKindId.RangePatternLeftWithRight;
        $source: 2;
        $named: true;
        _right: T.LiteralPattern | T.Path;
        right(): T.LiteralPattern | T.Path;
        $with: {
            right: (value: T.LiteralPattern | T.Path) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    left(): T.LiteralPattern | T.Path;
    right(): T.LiteralPattern | T.Path;
    $with: {
        left: (value: T.LiteralPattern | T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (value: T.LiteralPattern | T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function rangePatternUFormLeftBareFrom(input: Omit<ConfigOf<T.RangePatternUFormLeftBare>, '$variant'>): {
    $type: TSKindId.RangePattern;
    $source: 2;
    $named: true;
    $variant: 'left_bare';
    _left: T.LiteralPattern | T.Path;
    left(): T.LiteralPattern | T.Path;
    $with: {
        left: (value: T.LiteralPattern | T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function rangePatternUFormPrefixFrom(input: Omit<ConfigOf<T.RangePatternUFormPrefix>, '$variant'>): {
    $type: TSKindId.RangePattern;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    $children: readonly [{
        $type: TSKindId.RangePatternPrefix;
        $source: 2;
        $named: true;
        _right: T.LiteralPattern | T.Path;
        right(): T.LiteralPattern | T.Path;
        $with: {
            right: (value: T.LiteralPattern | T.Path) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    right(): T.LiteralPattern | T.Path;
    $with: {
        right: (value: T.LiteralPattern | T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function rawStringLiteralFrom(input: T.RawStringLiteral.Loose): T.RawStringLiteral | ({
    $type: TSKindId.RawStringLiteral;
    $source: 2;
    $named: true;
    _raw_string_literal_start: string | undefined;
    _string_content: string;
    _raw_string_literal_end: string | undefined;
    rawStringLiteralStart(): string | undefined;
    stringContent(): string;
    rawStringLiteralEnd(): string | undefined;
    $with: {
        rawStringLiteralStart: (value?: string) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        stringContent: (value: T.RawStringLiteralContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        rawStringLiteralEnd: (value?: string) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function refPatternFrom(input?: NonNullable<T.RefPattern.Config['children']>[number] | T.RefPattern): {
    $type: TSKindId.RefPattern;
    $source: 2;
    $named: true;
    $children: T.Pattern[];
    children(): T.Pattern[];
    $with: {
        $child: (v: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function referenceExpressionFrom(input: T.ReferenceExpression.Loose): T.ReferenceExpression | ({
    $type: TSKindId.ReferenceExpression;
    $source: 2;
    $named: true;
    _value: T.Expression;
    $children: [] | readonly [T.MutableSpecifier | T.ReferenceExpressionRawConst | T.ReferenceExpressionRawMut];
    value(): T.Expression;
    children(): [] | readonly [T.MutableSpecifier | T.ReferenceExpressionRawConst | T.ReferenceExpressionRawMut];
    $with: {
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.MutableSpecifier | T.ReferenceExpressionRawConst | T.ReferenceExpressionRawMut) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function referencePatternFrom(input: T.ReferencePattern.Loose): T.ReferencePattern | ({
    $type: TSKindId.ReferencePattern;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut" | undefined;
    _pattern: T.Pattern;
    mutableSpecifier(): "mut" | undefined;
    pattern(): T.Pattern;
    $with: {
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function referenceTypeFrom(input: T.ReferenceType.Loose): T.ReferenceType | ({
    $type: TSKindId.ReferenceType;
    $source: 2;
    $named: true;
    _lifetime: T.Lifetime | undefined;
    _mutable_specifier: "mut" | undefined;
    _type: T._Type;
    lifetime(): T.Lifetime | undefined;
    mutableSpecifier(): "mut" | undefined;
    typeField(): T._Type;
    $with: {
        lifetime: (value?: T.Lifetime) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function removedTraitBoundFrom(input?: NonNullable<T.RemovedTraitBound.Config['children']>[number] | T.RemovedTraitBound): {
    $type: TSKindId.RemovedTraitBound;
    $source: 2;
    $named: true;
    $children: T._Type[];
    children(): T._Type[];
    $with: {
        $child: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function returnExpressionFrom(input?: NonNullable<T.ReturnExpression.Config['children']>[number] | T.ReturnExpression): {
    $type: TSKindId.ReturnExpression;
    $source: 2;
    $named: true;
    $children: T.Expression[];
    children(): T.Expression[];
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function scopedIdentifierFrom(input: T.ScopedIdentifier.Loose): T.ScopedIdentifier | ({
    $type: TSKindId.ScopedIdentifier;
    $source: 2;
    $named: true;
    _path: T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    _name: string;
    path(): T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    name(): string;
    $with: {
        path: (value?: T.Path | T.BracketedType | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier | T.Super) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function scopedTypeIdentifierFrom(input: T.ScopedTypeIdentifier.Loose): T.ScopedTypeIdentifier;
export declare function scopedTypeIdentifierInExpressionPositionFrom(input: T.ScopedTypeIdentifierInExpressionPosition.Loose): T.ScopedTypeIdentifierInExpressionPosition;
export declare function scopedUseListFrom(input: T.ScopedUseList.Loose): T.ScopedUseList;
export declare function selfFrom(input?: T.Self): (T.Self & AnyNodeData) | ({
    $type: TSKindId.Self;
    $source: 2;
    $named: true;
    $text: 'self';
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function selfParameterFrom(input?: T.SelfParameter.Loose): T.SelfParameter | ({
    $type: TSKindId.SelfParameter;
    $source: 2;
    $named: true;
    _reference: "&" | undefined;
    _lifetime: T.Lifetime | undefined;
    _mutable_specifier: "mut" | undefined;
    _self: "self";
    reference(): "&" | undefined;
    lifetime(): T.Lifetime | undefined;
    mutableSpecifier(): "mut" | undefined;
    self(): "self";
    $with: {
        reference: (value?: import("@sittir/types").BooleanKeyword<"&">) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        lifetime: (value?: T.Lifetime) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function shebangFrom(input: string | T.Shebang): T.Shebang;
export declare function shorthandFieldInitializerFrom(input: T.ShorthandFieldInitializer.Loose): T.ShorthandFieldInitializer | ({
    $type: TSKindId.ShorthandFieldInitializer;
    $source: 2;
    $named: true;
    _attributes: readonly T.AttributeItem[];
    _identifier: string;
    attributes(): readonly T.AttributeItem[];
    identifier(): string;
    $with: {
        attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        identifier: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function slicePatternFrom(...input: readonly (NonNullable<T.SlicePattern.Config['children']>[number] | T.SlicePattern)[]): {
    $type: TSKindId.SlicePattern;
    $source: 2;
    $named: true;
    $children: T.Pattern[];
    children(): T.Pattern[];
    $with: {
        $children: (...vs: T.Pattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function sourceFileFrom(input: T.SourceFile.Loose): T.SourceFile | ({
    $type: TSKindId.SourceFile;
    $source: 2;
    $named: true;
    _shebang: string | undefined;
    _statements: readonly T.Statement[];
    shebang(): string | undefined;
    statements(): readonly T.Statement[];
    $with: {
        shebang: (value?: T.Shebang) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        statements: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function staticItemFrom(input: T.StaticItem.Loose): T.StaticItem | ({
    $type: TSKindId.StaticItem;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _mutable_specifier: "mut" | "ref" | undefined;
    _name: string;
    _type: T._Type;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    mutableSpecifier(): "mut" | "ref" | undefined;
    name(): string;
    typeField(): T._Type;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (value?: T.RefMarker | T._MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function stringLiteralFrom(...input: readonly (NonNullable<T.StringLiteral.Config['children']>[number] | T.StringLiteral)[]): {
    $type: TSKindId.StringLiteral;
    $source: 2;
    $named: true;
    $children: (T.EscapeSequence | T.StringContent)[];
    children(): (T.EscapeSequence | T.StringContent)[];
    $with: {
        $children: (...vs: (T.EscapeSequence | T.StringContent)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function structExpressionFrom(input: T.StructExpression.Loose): T.StructExpression;
export declare function structItemFrom(input?: T.StructItem.Loose): T.StructItem;
export declare function structItemUFormBraceFrom(input: Omit<ConfigOf<T.StructItemUFormBrace>, '$variant'>): {
    $type: TSKindId.StructItem;
    $source: 2;
    $named: true;
    $variant: 'brace';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    $children: readonly [{
        $type: TSKindId.StructItemBrace;
        $source: 2;
        $named: true;
        _body: T.FieldDeclarationList;
        $children: [] | readonly [T.WhereClause];
        body(): T.FieldDeclarationList;
        children(): [] | readonly [T.WhereClause];
        $with: {
            body: (value: T.FieldDeclarationList) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            children: (items_0: T.WhereClause) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    body(): T.FieldDeclarationList;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.FieldDeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function structItemUFormTupleFrom(input: Omit<ConfigOf<T.StructItemUFormTuple>, '$variant'>): {
    $type: TSKindId.StructItem;
    $source: 2;
    $named: true;
    $variant: 'tuple';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    $children: readonly [{
        $type: TSKindId.StructItemTuple;
        $source: 2;
        $named: true;
        _body: T.OrderedFieldDeclarationList;
        $children: [] | readonly [T.WhereClause];
        body(): T.OrderedFieldDeclarationList;
        children(): [] | readonly [T.WhereClause];
        $with: {
            body: (value: T.OrderedFieldDeclarationList) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
            children: (items_0: T.WhereClause) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    body(): T.OrderedFieldDeclarationList;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.OrderedFieldDeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function structItemUFormUnitFrom(input: Omit<ConfigOf<T.StructItemUFormUnit>, '$variant'>): {
    $type: TSKindId.StructItem;
    $source: 2;
    $named: true;
    $variant: 'unit';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function structPatternFrom(input: T.StructPattern.Loose): T.StructPattern;
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
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function tokenBindingPatternFrom(input: T.TokenBindingPattern.Loose): T.TokenBindingPattern | ({
    $type: TSKindId.TokenBindingPattern;
    $source: 2;
    $named: true;
    _name: string;
    _type: "block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis";
    name(): string;
    typeField(): "block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis";
    $with: {
        name: (value: T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (value: T.TokenBindingPatternType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function tokenRepetitionFrom(...input: readonly (NonNullable<T.TokenRepetition.Config['children']>[number] | T.TokenRepetition)[]): {
    $type: TSKindId.TokenRepetition;
    $source: 2;
    $named: true;
    $children: T.Tokens[];
    children(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenRepetitionPatternFrom(...input: readonly (NonNullable<T.TokenRepetitionPattern.Config['children']>[number] | T.TokenRepetitionPattern)[]): {
    $type: TSKindId.TokenRepetitionPattern;
    $source: 2;
    $named: true;
    $children: T.TokenPattern[];
    children(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreeParenFrom(...input: readonly (NonNullable<T.TokenTreeParen.Config['children']>[number] | T.TokenTreeParen)[]): {
    $type: TSKindId._TokenTreeParen;
    $source: 2;
    $named: true;
    $children: T.Tokens[];
    children(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreeBracketFrom(...input: readonly (NonNullable<T.TokenTreeBracket.Config['children']>[number] | T.TokenTreeBracket)[]): {
    $type: TSKindId._TokenTreeBracket;
    $source: 2;
    $named: true;
    $children: T.Tokens[];
    children(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreeBraceFrom(...input: readonly (NonNullable<T.TokenTreeBrace.Config['children']>[number] | T.TokenTreeBrace)[]): {
    $type: TSKindId._TokenTreeBrace;
    $source: 2;
    $named: true;
    $children: T.Tokens[];
    children(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreeFrom(input?: T.TokenTree.Loose): T.TokenTree;
export declare function tokenTreeUFormParenFrom(input: Omit<ConfigOf<T.TokenTreeUFormParen>, '$variant'>): {
    $type: TSKindId.TokenTree;
    $source: 2;
    $named: true;
    $variant: 'paren';
    $children: readonly [{
        $type: TSKindId._TokenTreeParen;
        $source: 2;
        $named: true;
        $children: T.Tokens[];
        children(): T.Tokens[];
        $with: {
            $children: (...vs: T.Tokens[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreeUFormBracketFrom(input: Omit<ConfigOf<T.TokenTreeUFormBracket>, '$variant'>): {
    $type: TSKindId.TokenTree;
    $source: 2;
    $named: true;
    $variant: 'bracket';
    $children: readonly [{
        $type: TSKindId._TokenTreeBracket;
        $source: 2;
        $named: true;
        $children: T.Tokens[];
        children(): T.Tokens[];
        $with: {
            $children: (...vs: T.Tokens[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreeUFormBraceFrom(input: Omit<ConfigOf<T.TokenTreeUFormBrace>, '$variant'>): {
    $type: TSKindId.TokenTree;
    $source: 2;
    $named: true;
    $variant: 'brace';
    $children: readonly [{
        $type: TSKindId._TokenTreeBrace;
        $source: 2;
        $named: true;
        $children: T.Tokens[];
        children(): T.Tokens[];
        $with: {
            $children: (...vs: T.Tokens[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreePatternParenFrom(...input: readonly (NonNullable<T.TokenTreePatternParen.Config['children']>[number] | T.TokenTreePatternParen)[]): {
    $type: TSKindId._TokenTreePatternParen;
    $source: 2;
    $named: true;
    $children: T.TokenPattern[];
    children(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreePatternBracketFrom(...input: readonly (NonNullable<T.TokenTreePatternBracket.Config['children']>[number] | T.TokenTreePatternBracket)[]): {
    $type: TSKindId._TokenTreePatternBracket;
    $source: 2;
    $named: true;
    $children: T.TokenPattern[];
    children(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreePatternBraceFrom(...input: readonly (NonNullable<T.TokenTreePatternBrace.Config['children']>[number] | T.TokenTreePatternBrace)[]): {
    $type: TSKindId._TokenTreePatternBrace;
    $source: 2;
    $named: true;
    $children: T.TokenPattern[];
    children(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreePatternFrom(input?: T.TokenTreePattern.Loose): T.TokenTreePattern;
export declare function tokenTreePatternUFormParenFrom(input: Omit<ConfigOf<T.TokenTreePatternUFormParen>, '$variant'>): {
    $type: TSKindId.TokenTreePattern;
    $source: 2;
    $named: true;
    $variant: 'paren';
    $children: readonly [{
        $type: TSKindId._TokenTreePatternParen;
        $source: 2;
        $named: true;
        $children: T.TokenPattern[];
        children(): T.TokenPattern[];
        $with: {
            $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreePatternUFormBracketFrom(input: Omit<ConfigOf<T.TokenTreePatternUFormBracket>, '$variant'>): {
    $type: TSKindId.TokenTreePattern;
    $source: 2;
    $named: true;
    $variant: 'bracket';
    $children: readonly [{
        $type: TSKindId._TokenTreePatternBracket;
        $source: 2;
        $named: true;
        $children: T.TokenPattern[];
        children(): T.TokenPattern[];
        $with: {
            $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tokenTreePatternUFormBraceFrom(input: Omit<ConfigOf<T.TokenTreePatternUFormBrace>, '$variant'>): {
    $type: TSKindId.TokenTreePattern;
    $source: 2;
    $named: true;
    $variant: 'brace';
    $children: readonly [{
        $type: TSKindId._TokenTreePatternBrace;
        $source: 2;
        $named: true;
        $children: T.TokenPattern[];
        children(): T.TokenPattern[];
        $with: {
            $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function traitBoundsFrom(...input: readonly (NonNullable<T.TraitBounds.Config['children']>[number] | T.TraitBounds)[]): {
    $type: TSKindId.TraitBounds;
    $source: 2;
    $named: true;
    $children: (T.HigherRankedTraitBound | T.Lifetime | T._Type)[] & readonly [T.HigherRankedTraitBound | T.Lifetime | T._Type, ...(T.HigherRankedTraitBound | T.Lifetime | T._Type)[]];
    children(): (T.HigherRankedTraitBound | T.Lifetime | T._Type)[] & readonly [T.HigherRankedTraitBound | T.Lifetime | T._Type, ...(T.HigherRankedTraitBound | T.Lifetime | T._Type)[]];
    $with: {
        $children: (...vs: (T._Type | T.Lifetime | T.HigherRankedTraitBound)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function traitItemFrom(input: T.TraitItem.Loose): T.TraitItem | ({
    $type: TSKindId.TraitItem;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _unsafe_marker: "unsafe" | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _bounds: T.TraitBounds | undefined;
    _where_clause: T.WhereClause | undefined;
    _body: T.DeclarationList;
    visibilityModifier(): T.VisibilityModifier | undefined;
    unsafeMarker(): "unsafe" | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    bounds(): T.TraitBounds | undefined;
    whereClause(): T.WhereClause | undefined;
    body(): T.DeclarationList;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        unsafeMarker: (value?: import("@sittir/types").BooleanKeyword<T.UnsafeMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        bounds: (value?: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function tryBlockFrom(input: T.TryBlock.Loose): T.TryBlock;
export declare function tryExpressionFrom(input: T.TryExpression.Loose): T.TryExpression;
export declare function tupleExpressionFrom(input: T.TupleExpression.Loose): T.TupleExpression | ({
    $type: TSKindId.TupleExpression;
    $source: 2;
    $named: true;
    _attributes: readonly T.AttributeItem[];
    _elements: readonly T.Expression[] | undefined;
    attributes(): readonly T.AttributeItem[];
    elements(): readonly T.Expression[] | undefined;
    $with: {
        attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        elements: (...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function tuplePatternFrom(...input: readonly (NonNullable<T.TuplePattern.Config['children']>[number] | T.TuplePattern)[]): {
    $type: TSKindId.TuplePattern;
    $source: 2;
    $named: true;
    $children: (T.ClosureExpression | T.Pattern)[];
    children(): (T.ClosureExpression | T.Pattern)[];
    $with: {
        $children: (...vs: (T.Pattern | T.ClosureExpression)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function tupleStructPatternFrom(input: T.TupleStructPattern.Loose): T.TupleStructPattern;
export declare function tupleTypeFrom(...input: readonly (NonNullable<T.TupleType.Config['children']>[number] | T.TupleType)[]): {
    $type: TSKindId.TupleType;
    $source: 2;
    $named: true;
    $children: T._Type[] & readonly [T._Type, ...T._Type[]];
    children(): T._Type[] & readonly [T._Type, ...T._Type[]];
    $with: {
        $children: (...vs: T._Type[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function typeArgumentsFrom(...input: readonly (NonNullable<T.TypeArguments.Config['children']>[number] | T.TypeArguments)[]): {
    $type: TSKindId.TypeArguments;
    $source: 2;
    $named: true;
    $children: (T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type)[] & readonly [T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type, ...(T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type)[]];
    children(): (T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type)[] & readonly [T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type, ...(T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type)[]];
    $with: {
        $children: (...vs: (T._Type | T.TypeBinding | T.Lifetime | T.Literal | T.Block | T.TraitBounds)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function typeBindingFrom(input: T.TypeBinding.Loose): T.TypeBinding;
export declare function typeCastExpressionFrom(input: T.TypeCastExpression.Loose): T.TypeCastExpression;
export declare function typeItemFrom(input: T.TypeItem.Loose): T.TypeItem;
export declare function typeParameterFrom(input: T.TypeParameter.Loose): T.TypeParameter;
export declare function typeParametersFrom(input: T.TypeParameters.Loose): T.TypeParameters;
export declare function unaryExpressionFrom(input: T.UnaryExpression.Loose): T.UnaryExpression | ({
    $type: TSKindId.UnaryExpression;
    $source: 2;
    $named: true;
    _operator: "!" | "*" | "-";
    _operand: T.Expression;
    operator(): "!" | "*" | "-";
    operand(): T.Expression;
    $with: {
        operator: (value: T.UnaryExpressionOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        operand: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function unionItemFrom(input: T.UnionItem.Loose): T.UnionItem;
export declare function unitExpressionFrom(input: string | T.UnitExpression): T.UnitExpression;
export declare function unitTypeFrom(input: string | T.UnitType): T.UnitType;
export declare function unsafeBlockFrom(input: T.UnsafeBlock.Loose): T.UnsafeBlock;
export declare function useAsClauseFrom(input: T.UseAsClause.Loose): T.UseAsClause | ({
    $type: TSKindId.UseAsClause;
    $source: 2;
    $named: true;
    _path: T.Path;
    _alias: string;
    path(): T.Path;
    alias(): string;
    $with: {
        path: (value: T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        alias: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function useBoundsFrom(...input: readonly (NonNullable<T.UseBounds.Config['children']>[number] | T.UseBounds)[]): {
    $type: TSKindId.UseBounds;
    $source: 2;
    $named: true;
    $children: (T.Lifetime | T.TypeIdentifier)[];
    children(): (T.Lifetime | T.TypeIdentifier)[];
    $with: {
        $children: (...vs: (T.Lifetime | T.TypeIdentifier)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function useDeclarationFrom(input: T.UseDeclaration.Loose): T.UseDeclaration;
export declare function useListFrom(...input: readonly (NonNullable<T.UseList.Config['children']>[number] | T.UseList)[]): {
    $type: TSKindId.UseList;
    $source: 2;
    $named: true;
    $children: T.UseClause[];
    children(): T.UseClause[];
    $with: {
        $children: (...vs: T.UseClause[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function useWildcardFrom(input?: T.UseWildcard.Loose): T.UseWildcard;
export declare function variadicParameterFrom(input?: T.VariadicParameter.Loose): T.VariadicParameter | ({
    $type: TSKindId.VariadicParameter;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut" | undefined;
    _pattern: T.Pattern | undefined;
    mutableSpecifier(): "mut" | undefined;
    pattern(): T.Pattern | undefined;
    $with: {
        mutableSpecifier: (value?: import("@sittir/types").BooleanKeyword<T._MutableSpecifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (value?: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function visibilityModifierCrateFrom(input?: NonNullable<T.VisibilityModifierCrate.Config['children']>[number] | T.VisibilityModifierCrate): {
    $type: TSKindId._VisibilityModifierCrate;
    $source: 2;
    $named: true;
    $children: T.Crate[];
    children(): T.Crate[];
    $with: {
        $child: (v: T.Crate) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function visibilityModifierFrom(input?: T.VisibilityModifier.Loose): T.VisibilityModifier | ({
    $type: TSKindId.VisibilityModifier;
    $source: 2;
    $named: true;
    $variant: 'pub';
    $children: readonly [{
        $type: TSKindId.VisibilityModifierPub;
        $source: 2;
        $named: true;
        _pub: "pub";
        $children: [] | readonly [T.Crate | T.Self | T.Super | T.VisibilityModifierInPath];
        pub(): "pub";
        children(): [] | readonly [T.Crate | T.Self | T.Super | T.VisibilityModifierInPath];
        $with: {
            children: (items_0: T.Crate | T.Self | T.Super | T.VisibilityModifierInPath) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    pub(): "pub";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
});
export declare function visibilityModifierUFormInPathFrom(_input: Omit<ConfigOf<T.VisibilityModifierUFormInPath>, '$variant'>): {
    $type: TSKindId.VisibilityModifier;
    $source: 2;
    $named: true;
    $variant: 'in_path';
    $children: readonly [{
        $type: TSKindId.VisibilityModifierInPath;
        $source: 2;
        $named: true;
        _in: "in";
        $children: [] | readonly [T.Path];
        in(): "in";
        children(): [] | readonly [T.Path];
        $with: {
            children: (items_0: T.Path) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    in(): "in";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function visibilityModifierUFormCrateFrom(input?: Omit<ConfigOf<T.VisibilityModifierUFormCrate>, '$variant'>): {
    $type: TSKindId.VisibilityModifier;
    $source: 2;
    $named: true;
    $variant: 'crate';
    $children: readonly [{
        $type: TSKindId._VisibilityModifierCrate;
        $source: 2;
        $named: true;
        $children: T.Crate[];
        children(): T.Crate[];
        $with: {
            $child: (v: T.Crate) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function visibilityModifierUFormPubFrom(_input?: Omit<ConfigOf<T.VisibilityModifierUFormPub>, '$variant'>): {
    $type: TSKindId.VisibilityModifier;
    $source: 2;
    $named: true;
    $variant: 'pub';
    $children: readonly [{
        $type: TSKindId.VisibilityModifierPub;
        $source: 2;
        $named: true;
        _pub: "pub";
        $children: [] | readonly [T.Crate | T.Self | T.Super | T.VisibilityModifierInPath];
        pub(): "pub";
        children(): [] | readonly [T.Crate | T.Self | T.Super | T.VisibilityModifierInPath];
        $with: {
            children: (items_0: T.Crate | T.Self | T.Super | T.VisibilityModifierInPath) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: unknown[]): AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: unknown[]): AnyNodeData;
    }];
    pub(): "pub";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function whereClauseFrom(...input: readonly (NonNullable<T.WhereClause.Config['children']>[number] | T.WhereClause)[]): {
    $type: TSKindId.WhereClause;
    $source: 2;
    $named: true;
    $children: T.WherePredicate[];
    children(): T.WherePredicate[];
    $with: {
        $children: (...vs: T.WherePredicate[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wherePredicateFrom(input: T.WherePredicate.Loose): T.WherePredicate;
export declare function whileExpressionFrom(input: T.WhileExpression.Loose): T.WhileExpression;
export declare function yieldExpressionFrom(input?: NonNullable<T.YieldExpression.Config['children']>[number] | T.YieldExpression): {
    $type: TSKindId.YieldExpression;
    $source: 2;
    $named: true;
    $children: T.Expression[];
    children(): T.Expression[];
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function stringContentFrom(input: string | T.StringContent): T.StringContent;
export declare function rawStringLiteralContentFrom(input: string | T.RawStringLiteralContent): T.RawStringLiteralContent;
export declare function floatLiteralFrom(input: string | T.FloatLiteral): T.FloatLiteral;
//# sourceMappingURL=from.d.ts.map