import * as F from './factories.js';
import type * as T from './types.js';
import { TSKindId } from './types.js';
import type { AnyNodeData, ConfigOf } from '@sittir/types';
export declare const _fromMap: {
    readonly "aliased_import": typeof aliasedImportFrom;
    readonly "argument_list": typeof argumentListFrom;
    readonly "as_pattern": typeof asPatternFrom;
    readonly "assert_statement": typeof assertStatementFrom;
    readonly "assignment": typeof assignmentFrom;
    readonly "attribute": typeof attributeFrom;
    readonly "augmented_assignment": typeof augmentedAssignmentFrom;
    readonly "await": typeof await_From;
    readonly "binary_operator": typeof binaryOperatorFrom;
    readonly "block": typeof blockFrom;
    readonly "boolean_operator": typeof booleanOperatorFrom;
    readonly "break_statement": typeof breakStatementFrom;
    readonly "call": typeof callFrom;
    readonly "case_clause": typeof caseClauseFrom;
    readonly "case_pattern": typeof casePatternFrom;
    readonly "chevron": typeof chevronFrom;
    readonly "class_definition": typeof classDefinitionFrom;
    readonly "class_pattern": typeof classPatternFrom;
    readonly "comment": typeof commentFrom;
    readonly "comparison_operator": typeof comparisonOperatorFrom;
    readonly "complex_pattern": typeof complexPatternFrom;
    readonly "concatenated_string": typeof concatenatedStringFrom;
    readonly "conditional_expression": typeof conditionalExpressionFrom;
    readonly "constrained_type": typeof constrainedTypeFrom;
    readonly "continue_statement": typeof continueStatementFrom;
    readonly "decorated_definition": typeof decoratedDefinitionFrom;
    readonly "decorator": typeof decoratorFrom;
    readonly "default_parameter": typeof defaultParameterFrom;
    readonly "delete_statement": typeof deleteStatementFrom;
    readonly "dict_pattern": typeof dictPatternFrom;
    readonly "dictionary": typeof dictionaryFrom;
    readonly "dictionary_comprehension": typeof dictionaryComprehensionFrom;
    readonly "dictionary_splat": typeof dictionarySplatFrom;
    readonly "dictionary_splat_pattern": typeof dictionarySplatPatternFrom;
    readonly "dotted_name": typeof dottedNameFrom;
    readonly "elif_clause": typeof elifClauseFrom;
    readonly "else_clause": typeof elseClauseFrom;
    readonly "escape_sequence": typeof escapeSequenceFrom;
    readonly "except_clause": typeof exceptClauseFrom;
    readonly "exec_statement": typeof execStatementFrom;
    readonly "expression_list": typeof expressionListFrom;
    readonly "expression_statement_tuple": typeof expressionStatementTupleFrom;
    readonly "expression_statement": typeof expressionStatementFrom;
    readonly "false": typeof false_From;
    readonly "finally_clause": typeof finallyClauseFrom;
    readonly "float": typeof floatFrom;
    readonly "for_in_clause": typeof forInClauseFrom;
    readonly "for_statement": typeof forStatementFrom;
    readonly "format_specifier": typeof formatSpecifierFrom;
    readonly "function_definition": typeof functionDefinitionFrom;
    readonly "future_import_statement": typeof futureImportStatementFrom;
    readonly "generator_expression": typeof generatorExpressionFrom;
    readonly "generic_type": typeof genericTypeFrom;
    readonly "global_statement": typeof globalStatementFrom;
    readonly "identifier": typeof identifierFrom;
    readonly "if_clause": typeof ifClauseFrom;
    readonly "if_statement": typeof ifStatementFrom;
    readonly "import_from_statement": typeof importFromStatementFrom;
    readonly "import_prefix": typeof importPrefixFrom;
    readonly "import_statement": typeof importStatementFrom;
    readonly "integer": typeof integerFrom;
    readonly "interpolation": typeof interpolationFrom;
    readonly "keyword_argument": typeof keywordArgumentFrom;
    readonly "keyword_pattern": typeof keywordPatternFrom;
    readonly "lambda": typeof lambdaFrom;
    readonly "lambda_parameters": typeof lambdaParametersFrom;
    readonly "lambda_within_for_in_clause": typeof lambdaWithinForInClauseFrom;
    readonly "line_continuation": typeof lineContinuationFrom;
    readonly "list": typeof listFrom;
    readonly "list_comprehension": typeof listComprehensionFrom;
    readonly "list_pattern": typeof listPatternFrom;
    readonly "list_splat": typeof listSplatFrom;
    readonly "list_splat_pattern": typeof listSplatPatternFrom;
    readonly "match_statement": typeof matchStatementFrom;
    readonly "member_type": typeof memberTypeFrom;
    readonly "module": typeof moduleFrom;
    readonly "named_expression": typeof namedExpressionFrom;
    readonly "none": typeof noneFrom;
    readonly "nonlocal_statement": typeof nonlocalStatementFrom;
    readonly "not_operator": typeof notOperatorFrom;
    readonly "pair": typeof pairFrom;
    readonly "parameters": typeof parametersFrom;
    readonly "parenthesized_expression": typeof parenthesizedExpressionFrom;
    readonly "parenthesized_list_splat": typeof parenthesizedListSplatFrom;
    readonly "pass_statement": typeof passStatementFrom;
    readonly "pattern_list": typeof patternListFrom;
    readonly "print_statement": typeof printStatementFrom;
    readonly "raise_statement": typeof raiseStatementFrom;
    readonly "relative_import": typeof relativeImportFrom;
    readonly "return_statement": typeof returnStatementFrom;
    readonly "set": typeof setFrom;
    readonly "set_comprehension": typeof setComprehensionFrom;
    readonly "slice": typeof sliceFrom;
    readonly "splat_pattern": typeof splatPatternFrom;
    readonly "splat_type": typeof splatTypeFrom;
    readonly "string": typeof stringFrom;
    readonly "string_content": typeof stringContentFrom;
    readonly "subscript": typeof subscriptFrom;
    readonly "true": typeof true_From;
    readonly "try_statement": typeof tryStatementFrom;
    readonly "tuple": typeof tupleFrom;
    readonly "tuple_pattern": typeof tuplePatternFrom;
    readonly "type": typeof typeFrom;
    readonly "type_alias_statement": typeof typeAliasStatementFrom;
    readonly "type_conversion": typeof typeConversionFrom;
    readonly "type_parameter": typeof typeParameterFrom;
    readonly "typed_default_parameter": typeof typedDefaultParameterFrom;
    readonly "typed_parameter": typeof typedParameterFrom;
    readonly "unary_operator": typeof unaryOperatorFrom;
    readonly "union_pattern": typeof unionPatternFrom;
    readonly "union_type": typeof unionTypeFrom;
    readonly "while_statement": typeof whileStatementFrom;
    readonly "with_clause_bare": typeof withClauseBareFrom;
    readonly "with_clause_paren": typeof withClauseParenFrom;
    readonly "with_clause": typeof withClauseFrom;
    readonly "with_item": typeof withItemFrom;
    readonly "with_statement": typeof withStatementFrom;
    readonly "yield": typeof yield_From;
    readonly "string_start": typeof stringStartFrom;
    readonly "escape_interpolation": typeof escapeInterpolationFrom;
    readonly "string_end": typeof stringEndFrom;
    readonly "]": typeof closeBracketFrom;
    readonly ")": typeof closeParenFrom;
    readonly "}": typeof closeBraceFrom;
    readonly "except": typeof exceptFrom;
};
export type _FromMap = typeof _fromMap;
export declare function aliasedImportFrom(input: T.AliasedImport.Loose): T.AliasedImport | ({
    $type: TSKindId.AliasedImport;
    $source: 2;
    $named: true;
    _name: T.DottedName;
    _alias: string;
    name(): T.DottedName;
    alias(): string;
    $with: {
        name: (value: T.DottedName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
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
export declare function argumentListFrom(...input: readonly (NonNullable<T.ArgumentList.Config['children']>[number] | T.ArgumentList)[]): {
    $type: TSKindId.ArgumentList;
    $source: 2;
    $named: true;
    $children: (T.DictionarySplat | T.KeywordArgument | T.ListSplat | T.ParenthesizedListSplat | T.Expression)[];
    children(): (T.DictionarySplat | T.KeywordArgument | T.ListSplat | T.ParenthesizedListSplat | T.Expression)[];
    $with: {
        $children: (...vs: (T.Expression | T.ListSplat | T.DictionarySplat | T.ParenthesizedListSplat | T.KeywordArgument)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function asPatternFrom(input: T.AsPattern.Loose): T.AsPattern;
export declare function assertStatementFrom(...input: readonly (NonNullable<T.AssertStatement.Config['children']>[number] | T.AssertStatement)[]): {
    $type: TSKindId.AssertStatement;
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
export declare function assignmentFrom(input?: T.Assignment.Loose): T.Assignment;
export declare function assignmentUFormEqFrom(input: Omit<ConfigOf<T.AssignmentUFormEq>, '$variant'>): {
    $type: TSKindId.Assignment;
    $source: 2;
    $named: true;
    $variant: 'eq';
    _left: T.PatternList;
    $children: readonly [{
        $type: TSKindId.AssignmentEq;
        $source: 2;
        $named: true;
        _right: T.RightHandSide;
        right(): T.RightHandSide;
        $with: {
            right: (value: T.RightHandSide) => /*elided*/ any & {
                $render(): string;
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
    left(): T.PatternList;
    right(): T.RightHandSide;
    $with: {
        left: (value: T.LeftHandSide) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.RightHandSide) => /*elided*/ any & {
            $render(): string;
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
export declare function assignmentUFormTypeFrom(input: Omit<ConfigOf<T.AssignmentUFormType>, '$variant'>): {
    $type: TSKindId.Assignment;
    $source: 2;
    $named: true;
    $variant: 'type';
    _left: T.PatternList;
    $children: readonly [{
        $type: TSKindId.AssignmentType;
        $source: 2;
        $named: true;
        _type: T.Type;
        typeField(): T.Type;
        $with: {
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
    }];
    left(): T.PatternList;
    typeField(): T.Type;
    $with: {
        left: (value: T.LeftHandSide) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (value: T.Type) => /*elided*/ any & {
            $render(): string;
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
export declare function assignmentUFormTypedFrom(input: Omit<ConfigOf<T.AssignmentUFormTyped>, '$variant'>): {
    $type: TSKindId.Assignment;
    $source: 2;
    $named: true;
    $variant: 'typed';
    _left: T.PatternList;
    $children: readonly [{
        $type: TSKindId.AssignmentTyped;
        $source: 2;
        $named: true;
        _type: T.Type;
        _right: T.RightHandSide;
        typeField(): T.Type;
        right(): T.RightHandSide;
        $with: {
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
            right: (value: T.RightHandSide) => /*elided*/ any & {
                $render(): string;
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
    left(): T.PatternList;
    typeField(): T.Type;
    right(): T.RightHandSide;
    $with: {
        left: (value: T.LeftHandSide) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.RightHandSide) => /*elided*/ any & {
            $render(): string;
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
export declare function attributeFrom(input: T.Attribute.Loose): T.Attribute | ({
    $type: TSKindId.Attribute;
    $source: 2;
    $named: true;
    _object: T.PrimaryExpression;
    _attribute: string;
    object(): T.PrimaryExpression;
    attribute(): string;
    $with: {
        object: (value: T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        attribute: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
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
export declare function augmentedAssignmentFrom(input: T.AugmentedAssignment.Loose): T.AugmentedAssignment | ({
    $type: TSKindId.AugmentedAssignment;
    $source: 2;
    $named: true;
    _left: T.PatternList;
    _operator: "%=" | "&=" | "**=" | "*=" | "+=" | "-=" | "//=" | "/=" | "<<=" | ">>=" | "@=" | "^=" | "|=";
    _right: T.RightHandSide;
    left(): T.PatternList;
    operator(): "%=" | "&=" | "**=" | "*=" | "+=" | "-=" | "//=" | "/=" | "<<=" | ">>=" | "@=" | "^=" | "|=";
    right(): T.RightHandSide;
    $with: {
        left: (value: T.LeftHandSide) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (value: T.AugmentedAssignmentOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.RightHandSide) => /*elided*/ any & {
            $render(): string;
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
export declare function await_From(input: T.Await.Loose): T.Await;
export declare function binaryOperatorFrom(input: T.BinaryOperator.Loose): T.BinaryOperator | ({
    $type: TSKindId.BinaryOperator;
    $source: 2;
    $named: true;
    _left: T.PrimaryExpression;
    _operator: "+";
    _right: T.PrimaryExpression;
    left(): T.PrimaryExpression;
    operator(): "+";
    right(): T.PrimaryExpression;
    $with: {
        left: (value: T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
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
export declare function blockFrom(...input: readonly (NonNullable<T.Block.Config['children']>[number] | T.Block)[]): {
    $type: TSKindId.Block;
    $source: 2;
    $named: true;
    $children: T.Statement[];
    children(): T.Statement[];
    $with: {
        $children: (...vs: T.Statement[]) => /*elided*/ any & {
            $render(): string;
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
export declare function booleanOperatorFrom(input: T.BooleanOperator.Loose): T.BooleanOperator | ({
    $type: TSKindId.BooleanOperator;
    $source: 2;
    $named: true;
    _left: T.Expression;
    _operator: "and";
    _right: T.Expression;
    left(): T.Expression;
    operator(): "and";
    right(): T.Expression;
    $with: {
        left: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
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
export declare function breakStatementFrom(input?: T.BreakStatement): (T.BreakStatement & AnyNodeData) | ({
    $type: TSKindId.BreakStatement;
    $source: 2;
    $named: true;
    $text: 'break';
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
export declare function callFrom(input: T.Call.Loose): T.Call;
export declare function caseClauseFrom(input: T.CaseClause.Loose): T.CaseClause | ({
    $type: TSKindId.CaseClause;
    $source: 2;
    $named: true;
    _guard: T.IfClause | undefined;
    _consequence: T.Suite;
    $children: [] | readonly [T.CasePattern, ...T.CasePattern[]];
    guard(): T.IfClause | undefined;
    consequence(): T.Suite;
    children(): [] | readonly [T.CasePattern, ...T.CasePattern[]];
    $with: {
        guard: (value?: T.IfClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        consequence: (value: T.Suite) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.CasePattern, ...items: T.CasePattern[]) => /*elided*/ any & {
            $render(): string;
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
export declare function casePatternFrom(input?: NonNullable<T.CasePattern.Config['children']>[number] | T.CasePattern): {
    $type: TSKindId.CasePattern;
    $source: 2;
    $named: true;
    $children: (T.KeywordPattern | T._AsPattern | T.SimplePattern)[];
    children(): (T.KeywordPattern | T._AsPattern | T.SimplePattern)[];
    $with: {
        $child: (v: (T._AsPattern | T.KeywordPattern | T.SimplePattern)) => /*elided*/ any & {
            $render(): string;
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
export declare function chevronFrom(input: T.Chevron.Loose): T.Chevron;
export declare function classDefinitionFrom(input: T.ClassDefinition.Loose): T.ClassDefinition | ({
    $type: TSKindId.ClassDefinition;
    $source: 2;
    $named: true;
    _name: string;
    _type_parameters: T.TypeParameter | undefined;
    _superclasses: T.ArgumentList | undefined;
    _body: T.Suite;
    name(): string;
    typeParameters(): T.TypeParameter | undefined;
    superclasses(): T.ArgumentList | undefined;
    body(): T.Suite;
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
        typeParameters: (value?: T.TypeParameter) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        superclasses: (value?: T.ArgumentList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.Suite) => /*elided*/ any & {
            $render(): string;
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
export declare function classPatternFrom(input: T.ClassPattern.Loose): T.ClassPattern;
export declare function commentFrom(input: string | T.Comment): T.Comment;
export declare function comparisonOperatorFrom(input: T.ComparisonOperator.Loose): T.ComparisonOperator | ({
    $type: TSKindId.ComparisonOperator;
    $source: 2;
    $named: true;
    _left: T.PrimaryExpression;
    _operators: readonly ("!=" | "<" | "<=" | "<>" | "==" | ">" | ">=" | "in" | "is" | "is not" | "not in")[] | undefined;
    $children: [] | readonly [T.PrimaryExpression, ...T.PrimaryExpression[]];
    left(): T.PrimaryExpression;
    operators(): readonly ("!=" | "<" | "<=" | "<>" | "==" | ">" | ">=" | "in" | "is" | "is not" | "not in")[] | undefined;
    children(): [] | readonly [T.PrimaryExpression, ...T.PrimaryExpression[]];
    $with: {
        left: (value: T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operators: (value: Parameters<typeof F.comparisonOperator>[0]['operators']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.PrimaryExpression, ...items: T.PrimaryExpression[]) => /*elided*/ any & {
            $render(): string;
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
export declare function complexPatternFrom(input: T.ComplexPattern.Loose): T.ComplexPattern | ({
    $type: TSKindId.ComplexPattern;
    $source: 2;
    $named: true;
    _real: "-" | undefined;
    _imaginary: string;
    $children: [] | readonly [T.Float | T.Integer];
    real(): "-" | undefined;
    imaginary(): string;
    children(): [] | readonly [T.Float | T.Integer];
    $with: {
        real: (value?: import("@sittir/types").BooleanKeyword<"-">) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        imaginary: (value: T.Integer | T.Float) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.Float | T.Integer) => /*elided*/ any & {
            $render(): string;
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
export declare function concatenatedStringFrom(...input: readonly (NonNullable<T.ConcatenatedString.Config['children']>[number] | T.ConcatenatedString)[]): {
    $type: TSKindId.ConcatenatedString;
    $source: 2;
    $named: true;
    $children: T.String[] & readonly [T.String, ...T.String[]];
    children(): T.String[] & readonly [T.String, ...T.String[]];
    $with: {
        $children: (...vs: T.String[]) => /*elided*/ any & {
            $render(): string;
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
export declare function conditionalExpressionFrom(input: T.ConditionalExpression.Loose): T.ConditionalExpression;
export declare function constrainedTypeFrom(input: T.ConstrainedType.Loose): T.ConstrainedType;
export declare function continueStatementFrom(input?: T.ContinueStatement): (T.ContinueStatement & AnyNodeData) | ({
    $type: TSKindId.ContinueStatement;
    $source: 2;
    $named: true;
    $text: 'continue';
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
export declare function decoratedDefinitionFrom(input: T.DecoratedDefinition.Loose): T.DecoratedDefinition | ({
    $type: TSKindId.DecoratedDefinition;
    $source: 2;
    $named: true;
    _definition: T.ClassDefinition | T.FunctionDefinition;
    $children: [] | readonly [T.Decorator, ...T.Decorator[]];
    definition(): T.ClassDefinition | T.FunctionDefinition;
    children(): [] | readonly [T.Decorator, ...T.Decorator[]];
    $with: {
        definition: (value: T.ClassDefinition | T.FunctionDefinition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.Decorator, ...items: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
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
export declare function decoratorFrom(input: T.Decorator.Loose): T.Decorator;
export declare function defaultParameterFrom(input: T.DefaultParameter.Loose): T.DefaultParameter;
export declare function deleteStatementFrom(input?: NonNullable<T.DeleteStatement.Config['children']>[number] | T.DeleteStatement): {
    $type: TSKindId.DeleteStatement;
    $source: 2;
    $named: true;
    $children: T.ExpressionList[];
    children(): T.ExpressionList[];
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
export declare function dictPatternFrom(...input: readonly (NonNullable<T.DictPattern.Config['children']>[number] | T.DictPattern)[]): {
    $type: TSKindId.DictPattern;
    $source: 2;
    $named: true;
    $children: T.DictPatternKv[];
    children(): T.DictPatternKv[];
    $with: {
        $children: (...vs: T.DictPatternKv[]) => /*elided*/ any & {
            $render(): string;
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
export declare function dictionaryFrom(...input: readonly (NonNullable<T.Dictionary.Config['children']>[number] | T.Dictionary)[]): {
    $type: TSKindId.Dictionary;
    $source: 2;
    $named: true;
    $children: (T.DictionarySplat | T.Pair)[];
    children(): (T.DictionarySplat | T.Pair)[];
    $with: {
        $children: (...vs: (T.Pair | T.DictionarySplat)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function dictionaryComprehensionFrom(input: T.DictionaryComprehension.Loose): T.DictionaryComprehension | ({
    $type: TSKindId.DictionaryComprehension;
    $source: 2;
    $named: true;
    _body: T.Pair;
    $children: [] | readonly [T.ComprehensionClauses];
    body(): T.Pair;
    children(): [] | readonly [T.ComprehensionClauses];
    $with: {
        body: (value: T.Pair) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.ComprehensionClauses) => /*elided*/ any & {
            $render(): string;
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
export declare function dictionarySplatFrom(input: T.DictionarySplat.Loose): T.DictionarySplat;
export declare function dictionarySplatPatternFrom(input?: NonNullable<T.DictionarySplatPattern.Config['children']>[number] | T.DictionarySplatPattern): {
    $type: TSKindId.DictionarySplatPattern;
    $source: 2;
    $named: true;
    $children: (T.Attribute | T.Identifier | T.Subscript)[];
    children(): (T.Attribute | T.Identifier | T.Subscript)[];
    $with: {
        $child: (v: (T.Identifier | T.KeywordIdentifier | T.Subscript | T.Attribute)) => /*elided*/ any & {
            $render(): string;
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
export declare function dottedNameFrom(...input: readonly (NonNullable<T.DottedName.Config['children']>[number] | T.DottedName)[]): {
    $type: TSKindId.DottedName;
    $source: 2;
    $named: true;
    $children: T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    children(): T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    $with: {
        $children: (...vs: T.Identifier[]) => /*elided*/ any & {
            $render(): string;
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
export declare function elifClauseFrom(input: T.ElifClause.Loose): T.ElifClause;
export declare function elseClauseFrom(input: T.ElseClause.Loose): T.ElseClause;
export declare function escapeSequenceFrom(input: string | T.EscapeSequence): T.EscapeSequence;
export declare function exceptClauseFrom(input: T.ExceptClause.Loose): T.ExceptClause | ({
    $type: TSKindId.ExceptClause;
    $source: 2;
    $named: true;
    _value: readonly [T.Expression, ...T.Expression[]] | undefined;
    _alias: T.Expression | undefined;
    $children: [] | readonly [T.Suite];
    value(): readonly [T.Expression, ...T.Expression[]] | undefined;
    alias(): T.Expression | undefined;
    children(): [] | readonly [T.Suite];
    $with: {
        value: (values_0: T.Expression, ...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.Suite) => /*elided*/ any & {
            $render(): string;
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
export declare function execStatementFrom(input: T.ExecStatement.Loose): T.ExecStatement | ({
    $type: TSKindId.ExecStatement;
    $source: 2;
    $named: true;
    _code: T.Identifier | T.String;
    _in_clause: readonly ["in" | T.Expression, ...("in" | T.Expression)[]] | undefined;
    code(): T.Identifier | T.String;
    inClause(): readonly ["in" | T.Expression, ...("in" | T.Expression)[]] | undefined;
    $with: {
        code: (value: T.String | T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        inClause: (values_0: "in" | T.Expression, ...values: ("in" | T.Expression)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function expressionListFrom(...input: readonly (NonNullable<T.ExpressionList.Config['children']>[number] | T.ExpressionList)[]): {
    $type: TSKindId.ExpressionList;
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
export declare function expressionStatementTupleFrom(...input: readonly (NonNullable<T.ExpressionStatementTuple.Config['children']>[number] | T.ExpressionStatementTuple)[]): {
    $type: TSKindId._ExpressionStatementTuple;
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
export declare function expressionStatementFrom(input?: T.ExpressionStatement.Loose): T.ExpressionStatementUFormTuple;
export declare function expressionStatementUFormTupleFrom(input: Omit<ConfigOf<T.ExpressionStatementUFormTuple>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'tuple';
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
export declare function false_From(input?: T.False): (T.False & AnyNodeData) | ({
    $type: TSKindId.False;
    $source: 2;
    $named: true;
    $text: 'False';
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
export declare function floatFrom(input: string | T.Float): T.Float;
export declare function forInClauseFrom(input: T.ForInClause.Loose): T.ForInClause | ({
    $type: TSKindId.ForInClause;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _left: T.PatternList;
    _right: readonly [T.LambdaWithinForInClause, ...T.LambdaWithinForInClause[]];
    asyncMarker(): "async" | undefined;
    left(): T.PatternList;
    right(): readonly [T.LambdaWithinForInClause, ...T.LambdaWithinForInClause[]];
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
        left: (value: T.LeftHandSide) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (values_0: T.LambdaWithinForInClause, ...values: T.LambdaWithinForInClause[]) => /*elided*/ any & {
            $render(): string;
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
export declare function forStatementFrom(input: T.ForStatement.Loose): T.ForStatement | ({
    $type: TSKindId.ForStatement;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _left: T.PatternList;
    _right: T.ExpressionList;
    _body: T.Suite;
    _alternative: T.ElseClause | undefined;
    asyncMarker(): "async" | undefined;
    left(): T.PatternList;
    right(): T.ExpressionList;
    body(): T.Suite;
    alternative(): T.ElseClause | undefined;
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
        left: (value: T.LeftHandSide) => /*elided*/ any & {
            $render(): string;
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
        body: (value: T.Suite) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternative: (value?: T.ElseClause) => /*elided*/ any & {
            $render(): string;
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
export declare function formatSpecifierFrom(...input: readonly (NonNullable<T.FormatSpecifier.Config['children']>[number] | T.FormatSpecifier)[]): {
    $type: TSKindId.FormatSpecifier;
    $source: 2;
    $named: true;
    $children: T.Interpolation[];
    children(): T.Interpolation[];
    $with: {
        $children: (...vs: T.Interpolation[]) => /*elided*/ any & {
            $render(): string;
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
export declare function functionDefinitionFrom(input: T.FunctionDefinition.Loose): T.FunctionDefinition | ({
    $type: TSKindId.FunctionDefinition;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _name: string;
    _type_parameters: T.TypeParameter | undefined;
    _parameters: T.Parameters;
    _return_type: T.Type | undefined;
    _body: T.Suite;
    asyncMarker(): "async" | undefined;
    name(): string;
    typeParameters(): T.TypeParameter | undefined;
    parameters(): T.Parameters;
    returnType(): T.Type | undefined;
    body(): T.Suite;
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
        typeParameters: (value?: T.TypeParameter) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (value: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (value?: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.Suite) => /*elided*/ any & {
            $render(): string;
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
export declare function futureImportStatementFrom(input: T.FutureImportStatement.Loose): T.FutureImportStatement;
export declare function generatorExpressionFrom(input: T.GeneratorExpression.Loose): T.GeneratorExpression | ({
    $type: TSKindId.GeneratorExpression;
    $source: 2;
    $named: true;
    _body: T.Expression;
    $children: [] | readonly [T.ComprehensionClauses];
    body(): T.Expression;
    children(): [] | readonly [T.ComprehensionClauses];
    $with: {
        body: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.ComprehensionClauses) => /*elided*/ any & {
            $render(): string;
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
export declare function genericTypeFrom(input: T.GenericType.Loose): T.GenericType | ({
    $type: TSKindId.GenericType;
    $source: 2;
    $named: true;
    _identifier: string;
    _type_parameter: T.TypeParameter;
    identifier(): string;
    typeParameter(): T.TypeParameter;
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
        typeParameter: (value: T.TypeParameter) => /*elided*/ any & {
            $render(): string;
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
export declare function globalStatementFrom(...input: readonly (NonNullable<T.GlobalStatement.Config['children']>[number] | T.GlobalStatement)[]): {
    $type: TSKindId.GlobalStatement;
    $source: 2;
    $named: true;
    $children: T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    children(): T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    $with: {
        $children: (...vs: T.Identifier[]) => /*elided*/ any & {
            $render(): string;
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
export declare function identifierFrom(input: string | T.Identifier): T.Identifier;
export declare function ifClauseFrom(input: T.IfClause.Loose): T.IfClause;
export declare function ifStatementFrom(input: T.IfStatement.Loose): T.IfStatement | ({
    $type: TSKindId.IfStatement;
    $source: 2;
    $named: true;
    _condition: T.Expression;
    _consequence: T.Suite;
    _alternative: readonly (T.ElifClause | T.ElseClause)[] | undefined;
    condition(): T.Expression;
    consequence(): T.Suite;
    alternative(): readonly (T.ElifClause | T.ElseClause)[] | undefined;
    $with: {
        condition: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        consequence: (value: T.Suite) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternative: (...values: (T.ElifClause | T.ElseClause)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function importFromStatementFrom(input: T.ImportFromStatement.Loose): T.ImportFromStatement | ({
    $type: TSKindId.ImportFromStatement;
    $source: 2;
    $named: true;
    _module_name: T.DottedName | T.RelativeImport;
    $children: [] | readonly [T.AliasedImport | T.DottedName | T.WildcardImport, ...(T.AliasedImport | T.DottedName | T.WildcardImport)[]];
    moduleName(): T.DottedName | T.RelativeImport;
    children(): [] | readonly [T.AliasedImport | T.DottedName | T.WildcardImport, ...(T.AliasedImport | T.DottedName | T.WildcardImport)[]];
    $with: {
        moduleName: (value: T.RelativeImport | T.DottedName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.AliasedImport | T.DottedName | T.WildcardImport, ...items: (T.AliasedImport | T.DottedName | T.WildcardImport)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function importPrefixFrom(input: string | T.ImportPrefix): T.ImportPrefix;
export declare function importStatementFrom(input: T.ImportStatement.Loose): T.ImportStatement;
export declare function integerFrom(input: string | T.Integer): T.Integer;
export declare function interpolationFrom(input: T.Interpolation.Loose): T.Interpolation | ({
    $type: TSKindId.Interpolation;
    $source: 2;
    $named: true;
    _expression: T.FExpression;
    _type_conversion: string | undefined;
    _format_specifier: T.FormatSpecifier | undefined;
    expression(): T.FExpression;
    typeConversion(): string | undefined;
    formatSpecifier(): T.FormatSpecifier | undefined;
    $with: {
        expression: (value: T.FExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeConversion: (value?: T.TypeConversion) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        formatSpecifier: (value?: T.FormatSpecifier) => /*elided*/ any & {
            $render(): string;
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
export declare function keywordArgumentFrom(input: T.KeywordArgument.Loose): T.KeywordArgument;
export declare function keywordPatternFrom(input: T.KeywordPattern.Loose): T.KeywordPattern | ({
    $type: TSKindId.KeywordPattern;
    $source: 2;
    $named: true;
    _identifier: string;
    _simple_pattern: T.SimplePattern;
    identifier(): string;
    simplePattern(): T.SimplePattern;
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
        simplePattern: (value: T.SimplePattern) => /*elided*/ any & {
            $render(): string;
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
export declare function lambdaFrom(input: T.Lambda.Loose): T.Lambda;
export declare function lambdaParametersFrom(...input: readonly (NonNullable<T.LambdaParameters.Config['children']>[number] | T.LambdaParameters)[]): {
    $type: TSKindId.LambdaParameters;
    $source: 2;
    $named: true;
    $children: T.Parameter[] & readonly [T.Parameter, ...T.Parameter[]];
    children(): T.Parameter[] & readonly [T.Parameter, ...T.Parameter[]];
    $with: {
        $children: (...vs: T.Parameter[]) => /*elided*/ any & {
            $render(): string;
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
export declare function lambdaWithinForInClauseFrom(input: T.LambdaWithinForInClause.Loose): T.LambdaWithinForInClause;
export declare function lineContinuationFrom(input: string | T.LineContinuation): T.LineContinuation;
export declare function listFrom(...input: readonly (NonNullable<T.List.Config['children']>[number] | T.List)[]): {
    $type: TSKindId.List;
    $source: 2;
    $named: true;
    $children: (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[];
    children(): (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[];
    $with: {
        $children: (...vs: (T.Expression | T.Yield | T.ListSplat | T.ParenthesizedListSplat)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function listComprehensionFrom(input: T.ListComprehension.Loose): T.ListComprehension | ({
    $type: TSKindId.ListComprehension;
    $source: 2;
    $named: true;
    _body: T.Expression;
    $children: [] | readonly [T.ComprehensionClauses];
    body(): T.Expression;
    children(): [] | readonly [T.ComprehensionClauses];
    $with: {
        body: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.ComprehensionClauses) => /*elided*/ any & {
            $render(): string;
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
export declare function listPatternFrom(...input: readonly (NonNullable<T.ListPattern.Config['children']>[number] | T.ListPattern)[]): {
    $type: TSKindId.ListPattern;
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
export declare function listSplatFrom(input: T.ListSplat.Loose): T.ListSplat;
export declare function listSplatPatternFrom(input?: NonNullable<T.ListSplatPattern.Config['children']>[number] | T.ListSplatPattern): {
    $type: TSKindId.ListSplatPattern;
    $source: 2;
    $named: true;
    $children: (T.Attribute | T.Identifier | T.Subscript)[];
    children(): (T.Attribute | T.Identifier | T.Subscript)[];
    $with: {
        $child: (v: (T.Identifier | T.KeywordIdentifier | T.Subscript | T.Attribute)) => /*elided*/ any & {
            $render(): string;
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
export declare function matchStatementFrom(input: T.MatchStatement.Loose): T.MatchStatement;
export declare function memberTypeFrom(input: T.MemberType.Loose): T.MemberType | ({
    $type: TSKindId.MemberType;
    $source: 2;
    $named: true;
    _base_type: T.Type;
    _identifier: string;
    baseType(): T.Type;
    identifier(): string;
    $with: {
        baseType: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
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
export declare function moduleFrom(...input: readonly (NonNullable<T.Module.Config['children']>[number] | T.Module)[]): {
    $type: TSKindId.Module;
    $source: 2;
    $named: true;
    $children: T.Statement[];
    children(): T.Statement[];
    $with: {
        $children: (...vs: T.Statement[]) => /*elided*/ any & {
            $render(): string;
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
export declare function namedExpressionFrom(input: T.NamedExpression.Loose): T.NamedExpression;
export declare function noneFrom(input?: T.None): (T.None & AnyNodeData) | ({
    $type: TSKindId.None;
    $source: 2;
    $named: true;
    $text: 'None';
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
export declare function nonlocalStatementFrom(...input: readonly (NonNullable<T.NonlocalStatement.Config['children']>[number] | T.NonlocalStatement)[]): {
    $type: TSKindId.NonlocalStatement;
    $source: 2;
    $named: true;
    $children: T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    children(): T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    $with: {
        $children: (...vs: T.Identifier[]) => /*elided*/ any & {
            $render(): string;
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
export declare function notOperatorFrom(input: T.NotOperator.Loose): T.NotOperator;
export declare function pairFrom(input: T.Pair.Loose): T.Pair;
export declare function parametersFrom(...input: readonly (NonNullable<T.Parameters.Config['children']>[number] | T.Parameters)[]): {
    $type: TSKindId.Parameters;
    $source: 2;
    $named: true;
    $children: T.Parameter[];
    children(): T.Parameter[];
    $with: {
        $children: (...vs: T.Parameter[]) => /*elided*/ any & {
            $render(): string;
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
export declare function parenthesizedExpressionFrom(input?: NonNullable<T.ParenthesizedExpression.Config['children']>[number] | T.ParenthesizedExpression): {
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    $children: (T.Yield | T.Expression)[];
    children(): (T.Yield | T.Expression)[];
    $with: {
        $child: (v: (T.Expression | T.Yield)) => /*elided*/ any & {
            $render(): string;
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
export declare function parenthesizedListSplatFrom(input?: NonNullable<T.ParenthesizedListSplat.Config['children']>[number] | T.ParenthesizedListSplat): {
    $type: TSKindId.ParenthesizedListSplat;
    $source: 2;
    $named: true;
    $children: (T.ListSplat | T.ParenthesizedListSplat)[];
    children(): (T.ListSplat | T.ParenthesizedListSplat)[];
    $with: {
        $child: (v: (T.ParenthesizedListSplat | T.ListSplat)) => /*elided*/ any & {
            $render(): string;
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
export declare function passStatementFrom(input?: T.PassStatement): (T.PassStatement & AnyNodeData) | ({
    $type: TSKindId.PassStatement;
    $source: 2;
    $named: true;
    $text: 'pass';
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
export declare function patternListFrom(...input: readonly (NonNullable<T.PatternList.Config['children']>[number] | T.PatternList)[]): {
    $type: TSKindId.PatternList;
    $source: 2;
    $named: true;
    $children: T.Pattern[] & readonly [T.Pattern, ...T.Pattern[]];
    children(): T.Pattern[] & readonly [T.Pattern, ...T.Pattern[]];
    $with: {
        $children: (...vs: T.Pattern[]) => /*elided*/ any & {
            $render(): string;
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
export declare function printStatementFrom(input: T.PrintStatement.Loose): T.PrintStatement | ({
    $type: TSKindId.PrintStatement;
    $source: 2;
    $named: true;
    _argument: readonly T.Expression[];
    $children: [] | readonly [T.Chevron];
    argument(): readonly T.Expression[];
    children(): [] | readonly [T.Chevron];
    $with: {
        argument: (...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.Chevron) => /*elided*/ any & {
            $render(): string;
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
export declare function raiseStatementFrom(input?: T.RaiseStatement.Loose): T.RaiseStatement | ({
    $type: TSKindId.RaiseStatement;
    $source: 2;
    $named: true;
    _cause: T.Expression | undefined;
    $children: [] | readonly [T.ExpressionList];
    cause(): T.Expression | undefined;
    children(): [] | readonly [T.ExpressionList];
    $with: {
        cause: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.ExpressionList) => /*elided*/ any & {
            $render(): string;
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
export declare function relativeImportFrom(input: T.RelativeImport.Loose): T.RelativeImport | ({
    $type: TSKindId.RelativeImport;
    $source: 2;
    $named: true;
    _import_prefix: string;
    _dotted_name: T.DottedName | undefined;
    importPrefix(): string;
    dottedName(): T.DottedName | undefined;
    $with: {
        importPrefix: (value: T.ImportPrefix) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        dottedName: (value?: T.DottedName) => /*elided*/ any & {
            $render(): string;
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
export declare function returnStatementFrom(input?: NonNullable<T.ReturnStatement.Config['children']>[number] | T.ReturnStatement): {
    $type: TSKindId.ReturnStatement;
    $source: 2;
    $named: true;
    $children: T.ExpressionList[];
    children(): T.ExpressionList[];
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
export declare function setFrom(...input: readonly (NonNullable<T.Set.Config['children']>[number] | T.Set)[]): {
    $type: TSKindId.Set;
    $source: 2;
    $named: true;
    $children: (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[] & readonly [T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression, ...(T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[]];
    children(): (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[] & readonly [T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression, ...(T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[]];
    $with: {
        $children: (...vs: (T.Expression | T.Yield | T.ListSplat | T.ParenthesizedListSplat)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function setComprehensionFrom(input: T.SetComprehension.Loose): T.SetComprehension | ({
    $type: TSKindId.SetComprehension;
    $source: 2;
    $named: true;
    _body: T.Expression;
    $children: [] | readonly [T.ComprehensionClauses];
    body(): T.Expression;
    children(): [] | readonly [T.ComprehensionClauses];
    $with: {
        body: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.ComprehensionClauses) => /*elided*/ any & {
            $render(): string;
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
export declare function sliceFrom(input?: T.Slice.Loose): T.Slice;
export declare function splatPatternFrom(input: T.SplatPattern.Loose): T.SplatPattern;
export declare function splatTypeFrom(input: T.SplatType.Loose): T.SplatType | ({
    $type: TSKindId.SplatType;
    $source: 2;
    $named: true;
    _identifier: string;
    identifier(): string;
    $with: {
        identifier: (value: T._Identifier | T.Identifier) => /*elided*/ any & {
            $render(): string;
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
export declare function stringFrom(input: T.String.Loose): T.String | ({
    $type: TSKindId.String;
    $source: 2;
    $named: true;
    _string_start: string;
    _content: readonly (T.Interpolation | T.StringContent)[];
    _string_end: string;
    stringStart(): string;
    content(): readonly (T.Interpolation | T.StringContent)[];
    stringEnd(): string;
    $with: {
        stringStart: (value: T.StringStart) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        content: (...values: (T.Interpolation | T.StringContent)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        stringEnd: (value: T.StringEnd) => /*elided*/ any & {
            $render(): string;
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
export declare function stringContentFrom(...input: readonly (NonNullable<T.StringContent.Config['children']>[number] | T.StringContent)[]): {
    $type: TSKindId.StringContent;
    $source: 2;
    $named: true;
    $children: ("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[] & readonly ["\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent, ...("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[]];
    children(): ("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[] & readonly ["\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent, ...("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[]];
    $with: {
        $children: (...vs: (T.EscapeInterpolation | T.EscapeSequence | "\\" | T._StringContent)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function subscriptFrom(input: T.Subscript.Loose): T.Subscript;
export declare function true_From(input?: T.True): (T.True & AnyNodeData) | ({
    $type: TSKindId.True;
    $source: 2;
    $named: true;
    $text: 'True';
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
export declare function tupleFrom(...input: readonly (NonNullable<T.Tuple.Config['children']>[number] | T.Tuple)[]): {
    $type: TSKindId.Tuple;
    $source: 2;
    $named: true;
    $children: (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[];
    children(): (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[];
    $with: {
        $children: (...vs: (T.Expression | T.Yield | T.ListSplat | T.ParenthesizedListSplat)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function tuplePatternFrom(...input: readonly (NonNullable<T.TuplePattern.Config['children']>[number] | T.TuplePattern)[]): {
    $type: TSKindId.TuplePattern;
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
export declare function typeFrom(input?: NonNullable<T.Type.Config['children']>[number] | T.Type): {
    $type: TSKindId.Type;
    $source: 2;
    $named: true;
    $children: (T.ConstrainedType | T.GenericType | T.MemberType | T.SplatType | T.UnionType | T.Expression)[];
    children(): (T.ConstrainedType | T.GenericType | T.MemberType | T.SplatType | T.UnionType | T.Expression)[];
    $with: {
        $child: (v: (T.Expression | T.SplatType | T.GenericType | T.UnionType | T.ConstrainedType | T.MemberType)) => /*elided*/ any & {
            $render(): string;
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
export declare function typeAliasStatementFrom(input: T.TypeAliasStatement.Loose): T.TypeAliasStatement | ({
    $type: TSKindId.TypeAliasStatement;
    $source: 2;
    $named: true;
    _type: "type";
    _left: T.Type;
    _right: T.Type;
    typeField(): "type";
    left(): T.Type;
    right(): T.Type;
    $with: {
        left: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (value: T.Type) => /*elided*/ any & {
            $render(): string;
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
export declare function typeConversionFrom(input: string | T.TypeConversion): T.TypeConversion;
export declare function typeParameterFrom(...input: readonly (NonNullable<T.TypeParameter.Config['children']>[number] | T.TypeParameter)[]): {
    $type: TSKindId.TypeParameter;
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
export declare function typedDefaultParameterFrom(input: T.TypedDefaultParameter.Loose): T.TypedDefaultParameter | ({
    $type: TSKindId.TypedDefaultParameter;
    $source: 2;
    $named: true;
    _name: string;
    _type: T.Type;
    _value: T.Expression;
    name(): string;
    typeField(): T.Type;
    value(): T.Expression;
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
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
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
export declare function typedParameterFrom(input: T.TypedParameter.Loose): T.TypedParameter | ({
    $type: TSKindId.TypedParameter;
    $source: 2;
    $named: true;
    _type: T.Type;
    $children: [] | readonly [T.DictionarySplatPattern | T.Identifier | T.ListSplatPattern];
    typeField(): T.Type;
    children(): [] | readonly [T.DictionarySplatPattern | T.Identifier | T.ListSplatPattern];
    $with: {
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
        children: (items_0: T.DictionarySplatPattern | T.Identifier | T.ListSplatPattern) => /*elided*/ any & {
            $render(): string;
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
export declare function unaryOperatorFrom(input: T.UnaryOperator.Loose): T.UnaryOperator | ({
    $type: TSKindId.UnaryOperator;
    $source: 2;
    $named: true;
    _operator: "+" | "-" | "~";
    _argument: T.PrimaryExpression;
    operator(): "+" | "-" | "~";
    argument(): T.PrimaryExpression;
    $with: {
        operator: (value: T.UnaryOperatorOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (value: T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
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
export declare function unionPatternFrom(...input: readonly (NonNullable<T.UnionPattern.Config['children']>[number] | T.UnionPattern)[]): {
    $type: TSKindId.UnionPattern;
    $source: 2;
    $named: true;
    $children: T.SimplePattern[] & readonly [T.SimplePattern, ...T.SimplePattern[]];
    children(): T.SimplePattern[] & readonly [T.SimplePattern, ...T.SimplePattern[]];
    $with: {
        $children: (...vs: T.SimplePattern[]) => /*elided*/ any & {
            $render(): string;
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
export declare function unionTypeFrom(input: T.UnionType.Loose): T.UnionType;
export declare function whileStatementFrom(input: T.WhileStatement.Loose): T.WhileStatement;
export declare function withClauseBareFrom(...input: readonly (NonNullable<T.WithClauseBare.Config['children']>[number] | T.WithClauseBare)[]): {
    $type: TSKindId._WithClauseBare;
    $source: 2;
    $named: true;
    $children: T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
    children(): T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
    $with: {
        $children: (...vs: T.WithItem[]) => /*elided*/ any & {
            $render(): string;
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
export declare function withClauseParenFrom(...input: readonly (NonNullable<T.WithClauseParen.Config['children']>[number] | T.WithClauseParen)[]): {
    $type: TSKindId._WithClauseParen;
    $source: 2;
    $named: true;
    $children: T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
    children(): T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
    $with: {
        $children: (...vs: T.WithItem[]) => /*elided*/ any & {
            $render(): string;
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
export declare function withClauseFrom(input?: T.WithClause.Loose): T.WithClause;
export declare function withClauseUFormBareFrom(input: Omit<ConfigOf<T.WithClauseUFormBare>, '$variant'>): {
    $type: TSKindId.WithClause;
    $source: 2;
    $named: true;
    $variant: 'bare';
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
export declare function withClauseUFormParenFrom(input: Omit<ConfigOf<T.WithClauseUFormParen>, '$variant'>): {
    $type: TSKindId.WithClause;
    $source: 2;
    $named: true;
    $variant: 'paren';
    $children: readonly [{
        $type: TSKindId._WithClauseParen;
        $source: 2;
        $named: true;
        $children: T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
        children(): T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
        $with: {
            $children: (...vs: T.WithItem[]) => /*elided*/ any & {
                $render(): string;
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
export declare function withItemFrom(input: T.WithItem.Loose): T.WithItem;
export declare function withStatementFrom(input: T.WithStatement.Loose): T.WithStatement | ({
    $type: TSKindId.WithStatement;
    $source: 2;
    $named: true;
    _async_marker: "async" | undefined;
    _with_clause: T.WithClause;
    _body: T.Suite;
    asyncMarker(): "async" | undefined;
    withClause(): T.WithClause;
    body(): T.Suite;
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
        withClause: (value: T.WithClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.Suite) => /*elided*/ any & {
            $render(): string;
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
export declare function yield_From(input?: NonNullable<T.Yield.Config['children']>[number] | T.Yield): {
    $type: TSKindId.Yield;
    $source: 2;
    $named: true;
    $children: (T.ExpressionList | T.Expression)[];
    children(): (T.ExpressionList | T.Expression)[];
    $with: {
        $child: (v: (T.Expression | T.Expressions)) => /*elided*/ any & {
            $render(): string;
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
export declare function stringStartFrom(input: string | T.StringStart): T.StringStart;
export declare function escapeInterpolationFrom(input: string | T.EscapeInterpolation): T.EscapeInterpolation;
export declare function stringEndFrom(input: string | T.StringEnd): T.StringEnd;
export declare function closeBracketFrom(input: string | T.CloseBracket): T.CloseBracket | ({
    $type: TSKindId.Rbrack;
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
export declare function closeParenFrom(input: string | T.CloseParen): T.CloseParen | ({
    $type: TSKindId.Rparen;
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
export declare function closeBraceFrom(input: string | T.CloseBrace): T.CloseBrace | ({
    $type: TSKindId.Rbrace;
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
export declare function exceptFrom(input: string | T.Except): T.Except;
//# sourceMappingURL=from.d.ts.map