import type { TreeHandle } from '@sittir/common';
import type { AnyNodeData as _NodeData, AnyNodeData } from '@sittir/types';
import { TSKindId } from './types.js';
import type * as T from './types.js';
export declare function wrap_AsPattern(data: T._AsPattern, tree: TreeHandle): {
    $type: TSKindId._AsPattern;
    _case_pattern: T.CasePattern;
    _identifier: T.Identifier;
    casePattern(): T.CasePattern;
    identifier(): T.Identifier;
    $with: {
        casePattern: (v: NonNullable<T._AsPattern['_case_pattern']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        identifier: (v: NonNullable<T._AsPattern['_identifier']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle): {
    $type: TSKindId.AssignmentEq;
    _right: T.Assignment | T.AugmentedAssignment | T.ExpressionList | T.PatternList | T.Yield;
    right(): T.RightHandSide;
    $with: {
        right: (v: NonNullable<T.AssignmentEq['_right']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAssignmentType(data: T.AssignmentType, tree: TreeHandle): {
    $type: TSKindId.AssignmentType;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.AssignmentType['_type']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAssignmentTyped(data: T.AssignmentTyped, tree: TreeHandle): {
    $type: TSKindId.AssignmentTyped;
    _type: T.Type;
    _right: T.Assignment | T.AugmentedAssignment | T.ExpressionList | T.PatternList | T.Yield;
    type(): T.Type;
    right(): T.RightHandSide;
    $with: {
        type: (v: NonNullable<T.AssignmentTyped['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.AssignmentTyped['_right']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapComparisonOperatorComparator(data: T.ComparisonOperatorComparator, tree: TreeHandle): {
    __inputHints__?: {
        readonly operators: import("@sittir/types").KindEnum<"<" | "<=" | "==" | "!=" | ">=" | ">" | "<>" | "in" | "not in" | "is" | "is not", TSKindId.Lt | TSKindId.LtEq | TSKindId.EqEq | TSKindId.BangEq | TSKindId.GtEq | TSKindId.Gt | TSKindId.LtGt | TSKindId.In | TSKindId.NotIn | TSKindId.Is | TSKindId.IsNot>;
    };
    $type: TSKindId.ComparisonOperatorComparator;
    _operators: number;
    _primary_expression: any;
    operators(): number;
    primaryExpression(): T.PrimaryExpression;
    $with: {
        operators: (v: NonNullable<T.ComparisonOperatorComparator['_operators']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        primaryExpression: (v: NonNullable<T.ComparisonOperatorComparator['_primary_expression']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapComprehensionClauses(data: T.ComprehensionClauses, tree: TreeHandle): {
    $type: TSKindId.ComprehensionClauses;
    _content: readonly any[];
    contents(): (T.ForInClause | T.IfClause)[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDictPatternKv(data: T.DictPatternKv, tree: TreeHandle): T.DictPatternKv;
export declare function wrapExceptClauseAs(data: T.ExceptClauseAs, tree: TreeHandle): {
    $type: TSKindId.ExceptClauseAs;
    _value: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _alias: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator | undefined;
    value(): T.Expression;
    alias(): T.Expression | undefined;
    $with: {
        value: (v: NonNullable<T.ExceptClauseAs['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (v: NonNullable<T.ExceptClauseAs['_alias']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapExceptClauseList(data: T.ExceptClauseList, tree: TreeHandle): {
    $type: TSKindId.ExceptClauseList;
    _value: readonly (T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator)[];
    values(): T.Expression[];
    $with: {
        values: (v_0: T.Expression, ...v: T.Expression[]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapExpressionStatementTuple(data: T.ExpressionStatementTuple, tree: TreeHandle): {
    $type: TSKindId.ExpressionStatementTuple;
    _expression: readonly any[];
    expressions(): T.Expression[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapExpressionWithinForInClause(data: T.ExpressionWithinForInClause, tree: TreeHandle): T.LambdaWithinForInClause;
export declare function wrapFExpression(data: T.FExpression, tree: TreeHandle): T.FExpression;
export declare function wrapImportList(data: T.ImportList, tree: TreeHandle): {
    $type: TSKindId.ImportList;
    _name: readonly (T.AliasedImport | T.DottedName)[];
    names(): (T.AliasedImport | T.DottedName)[];
    $with: {
        names: (v_0: T.AliasedImport | T.DottedName, ...v: (T.AliasedImport | T.DottedName)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapKeyValuePattern(data: T.KeyValuePattern, tree: TreeHandle): {
    $type: TSKindId.KeyValuePattern;
    _key: T.ClassPattern | T.ComplexPattern | T.ConcatenatedString | T.DictPattern | T.DottedName | T.False | T.None | T.SimplePatternNegative | T.SplatPattern | T.String | T.True | T.UnionPattern | T._ListPattern | T._TuplePattern;
    _value: T.CasePattern;
    key(): T.SimplePattern;
    value(): T.CasePattern;
    $with: {
        key: (v: NonNullable<T.KeyValuePattern['_key']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.KeyValuePattern['_value']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrap_ListPattern(data: T._ListPattern, tree: TreeHandle): {
    $type: TSKindId._ListPattern;
    _case_pattern: readonly T.CasePattern[];
    casePatterns(): T.CasePattern[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapMatchBlock(data: T.MatchBlock, tree: TreeHandle): {
    $type: TSKindId.MatchBlock;
    _match_block_block: T.MatchBlockBlock;
    matchBlockBlock(): T.MatchBlockBlock;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapMatchBlockBlock(data: T.MatchBlockBlock, tree: TreeHandle): {
    $type: TSKindId.MatchBlockBlock;
    _alternative: readonly T.CaseClause[];
    alternatives(): T.CaseClause[];
    $with: {
        alternatives: (...v: NonNullable<T.MatchBlockBlock['_alternative']>[number][]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapNamedExpressionLhs(data: T.NamedExpressionLhs, tree: TreeHandle): T.NamedExpressionLhs;
export declare function wrapRightHandSide(data: T.RightHandSide, tree: TreeHandle): T.RightHandSide;
export declare function wrapSimplePattern(data: T.SimplePattern, tree: TreeHandle): T.SimplePattern;
export declare function wrapSimplePatternNegative(data: T.SimplePatternNegative, tree: TreeHandle): {
    $type: TSKindId.SimplePatternNegative;
    _content: any;
    content(): T.Float | T.Integer;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapSimpleStatements(data: T.SimpleStatements, tree: TreeHandle): {
    $type: TSKindId.SimpleStatements;
    _simple_statement: readonly any[];
    simpleStatements(): T.SimpleStatement[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrap_SliceGroup1(data: T._SliceGroup1, tree: TreeHandle): {
    $type: TSKindId._SliceGroup1;
    _expression: any;
    expression(): T.Expression | undefined;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapStatement(data: T.Statement, tree: TreeHandle): T.Statement;
export declare function wrap_TuplePattern(data: T._TuplePattern, tree: TreeHandle): {
    $type: TSKindId._TuplePattern;
    _case_pattern: readonly T.CasePattern[];
    casePatterns(): T.CasePattern[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapWithClauseBare(data: T.WithClauseBare, tree: TreeHandle): {
    $type: TSKindId.WithClauseBare;
    _with_item: readonly T.WithItem[];
    withItems(): T.WithItem[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapWithClauseParen(data: T.WithClauseParen, tree: TreeHandle): {
    $type: TSKindId.WithClauseParen;
    _with_item: readonly T.WithItem[];
    withItems(): T.WithItem[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAliasedImport(data: T.AliasedImport, tree: TreeHandle): {
    $type: TSKindId.AliasedImport;
    _name: T.DottedName;
    _alias: T.Identifier;
    name(): T.DottedName;
    alias(): T.Identifier;
    $with: {
        name: (v: NonNullable<T.AliasedImport['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (v: NonNullable<T.AliasedImport['_alias']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapArgumentList(data: T.ArgumentList, tree: TreeHandle): {
    $type: TSKindId.ArgumentList;
    _arguments: readonly (T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.DictionarySplat | T.KeywordArgument | T.Lambda | T.ListSplat | T.NamedExpression | T.NotOperator | T.ParenthesizedListSplat)[];
    arguments(): (T.DictionarySplat | T.KeywordArgument | T.ListSplat | T.ParenthesizedListSplat | T.Expression)[];
    $with: {
        arguments: (...v: NonNullable<T.ArgumentList['_arguments']>[number][]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAsPattern(data: T.AsPattern, tree: TreeHandle): {
    $type: TSKindId.AsPattern;
    _expression: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _alias: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    expression(): T.Expression;
    alias(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.AsPattern['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (v: NonNullable<T.AsPattern['_alias']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAssertStatement(data: T.AssertStatement, tree: TreeHandle): {
    $type: TSKindId.AssertStatement;
    _expression: readonly any[];
    expressions(): T.Expression[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAssignment(data: T.Assignment, tree: TreeHandle): {
    $type: TSKindId.Assignment;
    _left: T.PatternList;
    _content: any;
    left(): T.PatternList;
    content(): T.AssignmentEq | T.AssignmentType | T.AssignmentTyped;
    $with: {
        left: (v: NonNullable<T.Assignment['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        content: (v: NonNullable<T.Assignment['_content']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAttribute(data: T.Attribute, tree: TreeHandle): {
    $type: TSKindId.Attribute;
    _object: T.Attribute | T.Await | T.BinaryOperator | T.Call | T.ConcatenatedString | T.Dictionary | T.DictionaryComprehension | T.False | T.Float | T.GeneratorExpression | T.Identifier | T.Integer | T.KeywordIdentifier | T.List | T.ListComprehension | T.ListSplatPattern | T.None | T.ParenthesizedExpression | T.Set | T.SetComprehension | T.String | T.Subscript | T.True | T.Tuple | T.UnaryOperator;
    _attribute: T.Identifier;
    object(): T.PrimaryExpression;
    attribute(): T.Identifier;
    $with: {
        object: (v: NonNullable<T.Attribute['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        attribute: (v: NonNullable<T.Attribute['_attribute']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAugmentedAssignment(data: T.AugmentedAssignment, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"+=" | "-=" | "*=" | "/=" | "@=" | "//=" | "%=" | "**=" | ">>=" | "<<=" | "&=" | "^=" | "|=", TSKindId.PlusEq | TSKindId.DashEq | TSKindId.StarEq | TSKindId.SlashEq | TSKindId.AtEq | TSKindId.SlashSlashEq | TSKindId.PercentEq | TSKindId.StarStarEq | TSKindId.GtGtEq | TSKindId.LtLtEq | TSKindId.AmpEq | TSKindId.CaretEq | TSKindId.PipeEq>;
    };
    $type: TSKindId.AugmentedAssignment;
    _left: T.PatternList;
    _operator: number;
    _right: T.Assignment | T.AugmentedAssignment | T.ExpressionList | T.PatternList | T.Yield;
    left(): T.PatternList;
    operator(): number;
    right(): T.RightHandSide;
    $with: {
        left: (v: NonNullable<T.AugmentedAssignment['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.AugmentedAssignment['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.AugmentedAssignment['_right']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapAwait(data: T.Await, tree: TreeHandle): {
    $type: TSKindId.Await;
    _primary_expression: T.Attribute | T.Await | T.BinaryOperator | T.Call | T.ConcatenatedString | T.Dictionary | T.DictionaryComprehension | T.False | T.Float | T.GeneratorExpression | T.Identifier | T.Integer | T.KeywordIdentifier | T.List | T.ListComprehension | T.ListSplatPattern | T.None | T.ParenthesizedExpression | T.Set | T.SetComprehension | T.String | T.Subscript | T.True | T.Tuple | T.UnaryOperator;
    primaryExpression(): T.PrimaryExpression;
    $with: {
        primaryExpression: (v: NonNullable<T.Await['_primary_expression']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapBinaryOperator(data: T.BinaryOperator, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"+" | "-" | "*" | "@" | "/" | "%" | "//" | "**" | "|" | "&" | "^" | "<<" | ">>", TSKindId.Plus | TSKindId.Dash | TSKindId.Star2 | TSKindId.At2 | TSKindId.Slash2 | TSKindId.Percent | TSKindId.SlashSlash | TSKindId.StarStar | TSKindId.Pipe2 | TSKindId.Amp | TSKindId.Caret | TSKindId.LtLt | TSKindId.GtGt>;
    };
    $type: TSKindId.BinaryOperator;
    _left: T.Attribute | T.Await | T.BinaryOperator | T.Call | T.ConcatenatedString | T.Dictionary | T.DictionaryComprehension | T.False | T.Float | T.GeneratorExpression | T.Identifier | T.Integer | T.KeywordIdentifier | T.List | T.ListComprehension | T.ListSplatPattern | T.None | T.ParenthesizedExpression | T.Set | T.SetComprehension | T.String | T.Subscript | T.True | T.Tuple | T.UnaryOperator;
    _operator: number;
    _right: T.Attribute | T.Await | T.BinaryOperator | T.Call | T.ConcatenatedString | T.Dictionary | T.DictionaryComprehension | T.False | T.Float | T.GeneratorExpression | T.Identifier | T.Integer | T.KeywordIdentifier | T.List | T.ListComprehension | T.ListSplatPattern | T.None | T.ParenthesizedExpression | T.Set | T.SetComprehension | T.String | T.Subscript | T.True | T.Tuple | T.UnaryOperator;
    left(): T.PrimaryExpression;
    operator(): number;
    right(): T.PrimaryExpression;
    $with: {
        left: (v: NonNullable<T.BinaryOperator['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.BinaryOperator['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.BinaryOperator['_right']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapBlock(data: T.Block, tree: TreeHandle): {
    $type: TSKindId.Block;
    _statement: readonly any[];
    statements(): T.Statement[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapBooleanOperator(data: T.BooleanOperator, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"and" | "or", TSKindId.And | TSKindId.Or>;
    };
    $type: TSKindId.BooleanOperator;
    _left: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _operator: number;
    _right: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    left(): T.Expression;
    operator(): number;
    right(): T.Expression;
    $with: {
        left: (v: NonNullable<T.BooleanOperator['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.BooleanOperator['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.BooleanOperator['_right']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapCall(data: T.Call, tree: TreeHandle): {
    $type: TSKindId.Call;
    _function: T.Attribute | T.Await | T.BinaryOperator | T.Call | T.ConcatenatedString | T.Dictionary | T.DictionaryComprehension | T.False | T.Float | T.GeneratorExpression | T.Identifier | T.Integer | T.KeywordIdentifier | T.List | T.ListComprehension | T.ListSplatPattern | T.None | T.ParenthesizedExpression | T.Set | T.SetComprehension | T.String | T.Subscript | T.True | T.Tuple | T.UnaryOperator;
    _arguments: T.ArgumentList | T.GeneratorExpression;
    function(): T.PrimaryExpression;
    arguments(): T.ArgumentList | T.GeneratorExpression;
    $with: {
        function: (v: NonNullable<T.Call['_function']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (v: NonNullable<T.Call['_arguments']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapCaseClause(data: T.CaseClause, tree: TreeHandle): {
    $type: TSKindId.CaseClause;
    _case_pattern: readonly T.CasePattern[];
    _guard: T.IfClause | undefined;
    _consequence: T.Block | T.Newline | T.SimpleStatements;
    casePatterns(): T.CasePattern[];
    guard(): T.IfClause | undefined;
    consequence(): T.Block | T.Newline | T.SimpleStatements;
    $with: {
        casePatterns: (v_0: T.CasePattern, ...v: T.CasePattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        guard: (v: NonNullable<T.CaseClause['_guard']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        consequence: (v: NonNullable<T.CaseClause['_consequence']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapCasePattern(data: T.CasePattern, tree: TreeHandle): {
    $type: TSKindId.CasePattern;
    _content: any;
    content(): T.KeywordPattern | T._AsPattern | T.SimplePattern;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapChevron(data: T.Chevron, tree: TreeHandle): {
    $type: TSKindId.Chevron;
    _expression: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.Chevron['_expression']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapClassDefinition(data: T.ClassDefinition, tree: TreeHandle): {
    $type: TSKindId.ClassDefinition;
    _name: T.Identifier;
    _type_parameters: T.TypeParameter | undefined;
    _superclasses: T.ArgumentList | undefined;
    _body: T.Block | T.Newline | T.SimpleStatements;
    name(): T.Identifier;
    typeParameters(): T.TypeParameter | undefined;
    superclasses(): T.ArgumentList | undefined;
    body(): T.Block | T.Newline | T.SimpleStatements;
    $with: {
        name: (v: NonNullable<T.ClassDefinition['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.ClassDefinition['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        superclasses: (v: NonNullable<T.ClassDefinition['_superclasses']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.ClassDefinition['_body']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapClassPattern(data: T.ClassPattern, tree: TreeHandle): {
    $type: TSKindId.ClassPattern;
    _dotted_name: T.DottedName;
    _arguments: readonly T.CasePattern[];
    dottedName(): T.DottedName;
    arguments(): T.CasePattern[];
    $with: {
        dottedName: (v: NonNullable<T.ClassPattern['_dotted_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (...v: NonNullable<T.ClassPattern['_arguments']>[number][]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapComparisonOperator(data: T.ComparisonOperator, tree: TreeHandle): {
    $type: TSKindId.ComparisonOperator;
    _left: T.Attribute | T.Await | T.BinaryOperator | T.Call | T.ConcatenatedString | T.Dictionary | T.DictionaryComprehension | T.False | T.Float | T.GeneratorExpression | T.Identifier | T.Integer | T.KeywordIdentifier | T.List | T.ListComprehension | T.ListSplatPattern | T.None | T.ParenthesizedExpression | T.Set | T.SetComprehension | T.String | T.Subscript | T.True | T.Tuple | T.UnaryOperator;
    _comparators: readonly T.ComparisonOperatorComparator[];
    left(): T.PrimaryExpression;
    comparators(): T.ComparisonOperatorComparator[];
    $with: {
        left: (v: NonNullable<T.ComparisonOperator['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        comparators: (v_0: T.ComparisonOperatorComparator, ...v: T.ComparisonOperatorComparator[]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapComplexPattern(data: T.ComplexPattern, tree: TreeHandle): {
    __inputHints__?: {
        readonly real?: import("@sittir/types").BooleanKeyword<"-">;
        readonly operator: import("@sittir/types").KindEnum<"+" | "-", TSKindId.Plus | TSKindId.Dash>;
    };
    $type: TSKindId.ComplexPattern;
    _real: true | undefined;
    _imaginary: T.Float | T.Integer;
    _operator: number;
    _content: any;
    real(): true | undefined;
    imaginary(): T.Float | T.Integer;
    operator(): number;
    content(): T.Float | T.Integer;
    $with: {
        real: (v: NonNullable<T.ComplexPattern['_real']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        imaginary: (v: NonNullable<T.ComplexPattern['_imaginary']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.ComplexPattern['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        content: (v: NonNullable<T.ComplexPattern['_content']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapConcatenatedString(data: T.ConcatenatedString, tree: TreeHandle): {
    $type: TSKindId.ConcatenatedString;
    _string: readonly T.String[];
    strings(): T.String[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapConditionalExpression(data: T.ConditionalExpression, tree: TreeHandle): {
    $type: TSKindId.ConditionalExpression;
    _body: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _condition: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _alternative: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    body(): T.Expression;
    condition(): T.Expression;
    alternative(): T.Expression;
    $with: {
        body: (v: NonNullable<T.ConditionalExpression['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        condition: (v: NonNullable<T.ConditionalExpression['_condition']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternative: (v: NonNullable<T.ConditionalExpression['_alternative']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapConstrainedType(data: T.ConstrainedType, tree: TreeHandle): {
    $type: TSKindId.ConstrainedType;
    _base_type: T.Type;
    _constraint: T.Type;
    baseType(): T.Type;
    constraint(): T.Type;
    $with: {
        baseType: (v: NonNullable<T.ConstrainedType['_base_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        constraint: (v: NonNullable<T.ConstrainedType['_constraint']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDecoratedDefinition(data: T.DecoratedDefinition, tree: TreeHandle): {
    $type: TSKindId.DecoratedDefinition;
    _decorator: readonly T.Decorator[];
    _definition: T.ClassDefinition | T.FunctionDefinition;
    decorators(): T.Decorator[];
    definition(): T.ClassDefinition | T.FunctionDefinition;
    $with: {
        decorators: (v_0: T.Decorator, ...v: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        definition: (v: NonNullable<T.DecoratedDefinition['_definition']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDecorator(data: T.Decorator, tree: TreeHandle): {
    $type: TSKindId.Decorator;
    _expression: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.Decorator['_expression']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDefaultParameter(data: T.DefaultParameter, tree: TreeHandle): {
    $type: TSKindId.DefaultParameter;
    _name: T.Identifier | T.TuplePattern;
    _value: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    name(): T.Identifier | T.TuplePattern;
    value(): T.Expression;
    $with: {
        name: (v: NonNullable<T.DefaultParameter['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.DefaultParameter['_value']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDeleteStatement(data: T.DeleteStatement, tree: TreeHandle): {
    $type: TSKindId.DeleteStatement;
    _expressions: any;
    expressions(): T.ExpressionList;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDictPattern(data: T.DictPattern, tree: TreeHandle): {
    $type: TSKindId.DictPattern;
    _dict_pattern_kv: T.KeyValuePattern | T.SplatPattern | undefined;
    _key: readonly (T.ClassPattern | T.ComplexPattern | T.ConcatenatedString | T.DictPattern | T.DottedName | T.False | T.None | T.SimplePatternNegative | T.SplatPattern | T.String | T.True | T.UnionPattern | T._ListPattern | T._TuplePattern)[];
    _value: readonly T.CasePattern[];
    _splat_pattern: readonly T.SplatPattern[];
    dictPatternKv(): T.DictPatternKv | undefined;
    keys(): T.SimplePattern[];
    values(): T.CasePattern[];
    splatPatterns(): T.SplatPattern[];
    $with: {
        dictPatternKv: (v: NonNullable<T.DictPattern['_dict_pattern_kv']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        keys: (...v: NonNullable<T.DictPattern['_key']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        values: (...v: NonNullable<T.DictPattern['_value']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        splatPatterns: (...v: NonNullable<T.DictPattern['_splat_pattern']>[number][]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDictionary(data: T.Dictionary, tree: TreeHandle): {
    $type: TSKindId.Dictionary;
    _entries: readonly (T.DictionarySplat | T.Pair)[];
    entries(): (T.DictionarySplat | T.Pair)[];
    $with: {
        entries: (...v: NonNullable<T.Dictionary['_entries']>[number][]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDictionaryComprehension(data: T.DictionaryComprehension, tree: TreeHandle): {
    $type: TSKindId.DictionaryComprehension;
    _body: T.Pair;
    _comprehension_clauses: T.ComprehensionClauses;
    body(): T.Pair;
    comprehensionClauses(): T.ComprehensionClauses;
    $with: {
        body: (v: NonNullable<T.DictionaryComprehension['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        comprehensionClauses: (v: NonNullable<T.DictionaryComprehension['_comprehension_clauses']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDictionarySplat(data: T.DictionarySplat, tree: TreeHandle): {
    $type: TSKindId.DictionarySplat;
    _expression: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.DictionarySplat['_expression']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDictionarySplatPattern(data: T.DictionarySplatPattern, tree: TreeHandle): {
    $type: TSKindId.DictionarySplatPattern;
    _content: any;
    content(): T.Attribute | T.Identifier | T.Subscript;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapDottedName(data: T.DottedName, tree: TreeHandle): {
    $type: TSKindId.DottedName;
    _identifier: readonly T.Identifier[];
    identifiers(): T.Identifier[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapElifClause(data: T.ElifClause, tree: TreeHandle): {
    $type: TSKindId.ElifClause;
    _condition: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _consequence: T.Block | T.Newline | T.SimpleStatements;
    condition(): T.Expression;
    consequence(): T.Block | T.Newline | T.SimpleStatements;
    $with: {
        condition: (v: NonNullable<T.ElifClause['_condition']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        consequence: (v: NonNullable<T.ElifClause['_consequence']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapElseClause(data: T.ElseClause, tree: TreeHandle): {
    $type: TSKindId.ElseClause;
    _body: T.Block | T.Newline | T.SimpleStatements;
    body(): T.Block | T.Newline | T.SimpleStatements;
    $with: {
        body: (v: NonNullable<T.ElseClause['_body']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapExceptClause(data: T.ExceptClause, tree: TreeHandle): {
    $type: TSKindId.ExceptClause;
    _content: any;
    _simple_statements: T.Block | T.SimpleStatements | undefined;
    _block: T.Block | undefined;
    _newline: T.Block | T.Newline | undefined;
    content(): T.ExceptClauseAs | T.ExceptClauseList | undefined;
    simpleStatements(): T.SimpleStatements | undefined;
    block(): T.Block | undefined;
    newline(): T.Newline | undefined;
    $with: {
        content: (v: NonNullable<T.ExceptClause['_content']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        simpleStatements: (v: NonNullable<T.ExceptClause['_simple_statements']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        block: (v: NonNullable<T.ExceptClause['_block']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        newline: (v: NonNullable<T.ExceptClause['_newline']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapExecStatement(data: T.ExecStatement, tree: TreeHandle): {
    $type: TSKindId.ExecStatement;
    _code: T.Identifier | T.String;
    _in_clause: readonly (T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator)[];
    code(): T.Identifier | T.String;
    inClauses(): T.Expression[];
    $with: {
        code: (v: NonNullable<T.ExecStatement['_code']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        inClauses: (...v: NonNullable<T.ExecStatement['_in_clause']>[number][]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapExpression(data: T.Expression, tree: TreeHandle): T.Expression;
export declare function wrapExpressionList(data: T.ExpressionList, tree: TreeHandle): {
    $type: TSKindId.ExpressionList;
    _expression: readonly any[];
    expressions(): T.Expression[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapExpressionStatement(data: T.ExpressionStatement, tree: TreeHandle): {
    $type: TSKindId.ExpressionStatement;
    _content: any;
    content(): T.Assignment | T.AugmentedAssignment | T.ExpressionStatementTuple | T.Yield | T.Expression;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapFinallyClause(data: T.FinallyClause, tree: TreeHandle): {
    $type: TSKindId.FinallyClause;
    _block: T.Block | T.Newline | T.SimpleStatements;
    block(): T.Block | T.Newline | T.SimpleStatements;
    $with: {
        block: (v: NonNullable<T.FinallyClause['_block']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapForInClause(data: T.ForInClause, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.ForInClause;
    _async_marker: true | undefined;
    _left: T.PatternList;
    _right: readonly T.LambdaWithinForInClause[];
    asyncMarker(): true | undefined;
    left(): T.PatternList;
    rights(): T.LambdaWithinForInClause[];
    $with: {
        asyncMarker: (v: NonNullable<T.ForInClause['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        left: (v: NonNullable<T.ForInClause['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        rights: (v_0: T.LambdaWithinForInClause, ...v: T.LambdaWithinForInClause[]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapForStatement(data: T.ForStatement, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.ForStatement;
    _async_marker: true | undefined;
    _left: T.PatternList;
    _right: T.ExpressionList;
    _body: T.Block | T.Newline | T.SimpleStatements;
    _alternative: T.ElseClause | undefined;
    asyncMarker(): true | undefined;
    left(): T.PatternList;
    right(): T.ExpressionList;
    body(): T.Block | T.Newline | T.SimpleStatements;
    alternative(): T.ElseClause | undefined;
    $with: {
        asyncMarker: (v: NonNullable<T.ForStatement['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        left: (v: NonNullable<T.ForStatement['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.ForStatement['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.ForStatement['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternative: (v: NonNullable<T.ForStatement['_alternative']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapFormatSpecifier(data: T.FormatSpecifier, tree: TreeHandle): {
    $type: TSKindId.FormatSpecifier;
    _content: readonly any[];
    contents(): ("[^{}\\n]+" | T.Interpolation)[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapFunctionDefinition(data: T.FunctionDefinition, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.FunctionDefinition;
    _async_marker: true | undefined;
    _name: T.Identifier;
    _type_parameters: T.TypeParameter | undefined;
    _parameters: T.Parameters;
    _return_type: T.Type | undefined;
    _body: T.Block | T.Newline | T.SimpleStatements;
    asyncMarker(): true | undefined;
    name(): T.Identifier;
    typeParameters(): T.TypeParameter | undefined;
    parameters(): T.Parameters;
    returnType(): T.Type | undefined;
    body(): T.Block | T.Newline | T.SimpleStatements;
    $with: {
        asyncMarker: (v: NonNullable<T.FunctionDefinition['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.FunctionDefinition['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.FunctionDefinition['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.FunctionDefinition['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.FunctionDefinition['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.FunctionDefinition['_body']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapFutureImportStatement(data: T.FutureImportStatement, tree: TreeHandle): {
    $type: TSKindId.FutureImportStatement;
    _name: readonly (T.AliasedImport | T.DottedName)[];
    names(): (T.AliasedImport | T.DottedName)[];
    $with: {
        names: (v_0: T.AliasedImport | T.DottedName, ...v: (T.AliasedImport | T.DottedName)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapGeneratorExpression(data: T.GeneratorExpression, tree: TreeHandle): {
    $type: TSKindId.GeneratorExpression;
    _body: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _comprehension_clauses: T.ComprehensionClauses;
    body(): T.Expression;
    comprehensionClauses(): T.ComprehensionClauses;
    $with: {
        body: (v: NonNullable<T.GeneratorExpression['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        comprehensionClauses: (v: NonNullable<T.GeneratorExpression['_comprehension_clauses']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapGenericType(data: T.GenericType, tree: TreeHandle): {
    $type: TSKindId.GenericType;
    _identifier: T.Identifier;
    _type_parameter: T.TypeParameter;
    identifier(): T.Identifier;
    typeParameter(): T.TypeParameter;
    $with: {
        identifier: (v: NonNullable<T.GenericType['_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameter: (v: NonNullable<T.GenericType['_type_parameter']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapGlobalStatement(data: T.GlobalStatement, tree: TreeHandle): {
    $type: TSKindId.GlobalStatement;
    _identifier: readonly T.Identifier[];
    identifiers(): T.Identifier[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapIfClause(data: T.IfClause, tree: TreeHandle): {
    $type: TSKindId.IfClause;
    _expression: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.IfClause['_expression']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapIfStatement(data: T.IfStatement, tree: TreeHandle): {
    $type: TSKindId.IfStatement;
    _condition: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _consequence: T.Block | T.Newline | T.SimpleStatements;
    _alternative: readonly (T.ElifClause | T.ElseClause)[];
    condition(): T.Expression;
    consequence(): T.Block | T.Newline | T.SimpleStatements;
    alternatives(): (T.ElifClause | T.ElseClause)[];
    $with: {
        condition: (v: NonNullable<T.IfStatement['_condition']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        consequence: (v: NonNullable<T.IfStatement['_consequence']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternatives: (...v: NonNullable<T.IfStatement['_alternative']>[number][]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapImportFromStatement(data: T.ImportFromStatement, tree: TreeHandle): {
    $type: TSKindId.ImportFromStatement;
    _module_name: T.DottedName | T.RelativeImport;
    _wildcard_import: readonly (T.AliasedImport | T.DottedName | T.WildcardImport)[];
    moduleName(): T.DottedName | T.RelativeImport;
    wildcardImports(): (T.AliasedImport | T.DottedName | T.WildcardImport)[];
    $with: {
        moduleName: (v: NonNullable<T.ImportFromStatement['_module_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        wildcardImports: (v_0: T.AliasedImport | T.DottedName | T.WildcardImport, ...v: (T.AliasedImport | T.DottedName | T.WildcardImport)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapImportStatement(data: T.ImportStatement, tree: TreeHandle): {
    $type: TSKindId.ImportStatement;
    _name: readonly (T.AliasedImport | T.DottedName)[];
    names(): (T.AliasedImport | T.DottedName)[];
    $with: {
        names: (v_0: T.AliasedImport | T.DottedName, ...v: (T.AliasedImport | T.DottedName)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapInterpolation(data: T.Interpolation, tree: TreeHandle): {
    $type: TSKindId.Interpolation;
    _expression: T.ExpressionList | T.PatternList | T.Yield;
    _type_conversion: T.TypeConversion | undefined;
    _format_specifier: T.FormatSpecifier | undefined;
    expression(): T.FExpression;
    typeConversion(): T.TypeConversion | undefined;
    formatSpecifier(): T.FormatSpecifier | undefined;
    $with: {
        expression: (v: NonNullable<T.Interpolation['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeConversion: (v: NonNullable<T.Interpolation['_type_conversion']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        formatSpecifier: (v: NonNullable<T.Interpolation['_format_specifier']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapKeywordArgument(data: T.KeywordArgument, tree: TreeHandle): {
    $type: TSKindId.KeywordArgument;
    _name: T.Identifier;
    _value: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    name(): T.Identifier;
    value(): T.Expression;
    $with: {
        name: (v: NonNullable<T.KeywordArgument['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.KeywordArgument['_value']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapKeywordPattern(data: T.KeywordPattern, tree: TreeHandle): {
    $type: TSKindId.KeywordPattern;
    _identifier: T.Identifier;
    _simple_pattern: T.ClassPattern | T.ComplexPattern | T.ConcatenatedString | T.DictPattern | T.DottedName | T.False | T.None | T.SimplePatternNegative | T.SplatPattern | T.String | T.True | T.UnionPattern | T._ListPattern | T._TuplePattern;
    identifier(): T.Identifier;
    simplePattern(): T.SimplePattern;
    $with: {
        identifier: (v: NonNullable<T.KeywordPattern['_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        simplePattern: (v: NonNullable<T.KeywordPattern['_simple_pattern']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapLambda(data: T.Lambda, tree: TreeHandle): {
    $type: TSKindId.Lambda;
    _parameters: T.LambdaParameters | undefined;
    _body: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    parameters(): T.LambdaParameters | undefined;
    body(): T.Expression;
    $with: {
        parameters: (v: NonNullable<T.Lambda['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.Lambda['_body']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapLambdaParameters(data: T.LambdaParameters, tree: TreeHandle): {
    $type: TSKindId.LambdaParameters;
    _parameters: _Parameters;
    parameters(): T._Parameters;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapLambdaWithinForInClause(data: T.LambdaWithinForInClause, tree: TreeHandle): {
    $type: TSKindId.LambdaWithinForInClause;
    _parameters: T.LambdaParameters | undefined;
    _body: T.LambdaWithinForInClause;
    parameters(): T.LambdaParameters | undefined;
    body(): T.LambdaWithinForInClause;
    $with: {
        parameters: (v: NonNullable<T.LambdaWithinForInClause['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.LambdaWithinForInClause['_body']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapList(data: T.List, tree: TreeHandle): {
    $type: TSKindId.List;
    _collection_elements: any;
    collectionElements(): any;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapListComprehension(data: T.ListComprehension, tree: TreeHandle): {
    $type: TSKindId.ListComprehension;
    _body: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _comprehension_clauses: T.ComprehensionClauses;
    body(): T.Expression;
    comprehensionClauses(): T.ComprehensionClauses;
    $with: {
        body: (v: NonNullable<T.ListComprehension['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        comprehensionClauses: (v: NonNullable<T.ListComprehension['_comprehension_clauses']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapListPattern(data: T.ListPattern, tree: TreeHandle): {
    $type: TSKindId.ListPattern;
    _patterns: any;
    patterns(): any;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapListSplat(data: T.ListSplat, tree: TreeHandle): {
    $type: TSKindId.ListSplat;
    _expression: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.ListSplat['_expression']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapListSplatPattern(data: T.ListSplatPattern, tree: TreeHandle): {
    $type: TSKindId.ListSplatPattern;
    _content: any;
    content(): T.Attribute | T.Identifier | T.Subscript;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapMatchStatement(data: T.MatchStatement, tree: TreeHandle): {
    $type: TSKindId.MatchStatement;
    _subject: readonly (T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator)[];
    _body: T.MatchBlock;
    subjects(): T.Expression[];
    body(): T.MatchBlock;
    $with: {
        subjects: (v_0: T.Expression, ...v: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.MatchStatement['_body']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapMemberType(data: T.MemberType, tree: TreeHandle): {
    $type: TSKindId.MemberType;
    _base_type: T.Type;
    _identifier: T.Identifier;
    baseType(): T.Type;
    identifier(): T.Identifier;
    $with: {
        baseType: (v: NonNullable<T.MemberType['_base_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        identifier: (v: NonNullable<T.MemberType['_identifier']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapModule(data: T.Module, tree: TreeHandle): {
    $type: TSKindId.Module;
    _statement: readonly any[];
    statements(): T.Statement[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapNamedExpression(data: T.NamedExpression, tree: TreeHandle): {
    $type: TSKindId.NamedExpression;
    _name: T.Identifier | T.KeywordIdentifier;
    _value: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    name(): T.NamedExpressionLhs;
    value(): T.Expression;
    $with: {
        name: (v: NonNullable<T.NamedExpression['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.NamedExpression['_value']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapNonlocalStatement(data: T.NonlocalStatement, tree: TreeHandle): {
    $type: TSKindId.NonlocalStatement;
    _identifier: readonly T.Identifier[];
    identifiers(): T.Identifier[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapNotOperator(data: T.NotOperator, tree: TreeHandle): {
    $type: TSKindId.NotOperator;
    _argument: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    argument(): T.Expression;
    $with: {
        argument: (v: NonNullable<T.NotOperator['_argument']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapPair(data: T.Pair, tree: TreeHandle): {
    $type: TSKindId.Pair;
    _key: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _value: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    key(): T.Expression;
    value(): T.Expression;
    $with: {
        key: (v: NonNullable<T.Pair['_key']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.Pair['_value']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapParameter(data: T.Parameter, tree: TreeHandle): T.Parameter;
export declare function wrapParameters(data: T.Parameters, tree: TreeHandle): {
    $type: TSKindId.Parameters;
    _parameters: any;
    parameters(): any;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapParenthesizedExpression(data: T.ParenthesizedExpression, tree: TreeHandle): {
    $type: TSKindId.ParenthesizedExpression;
    _content: any;
    content(): T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapParenthesizedListSplat(data: T.ParenthesizedListSplat, tree: TreeHandle): {
    $type: TSKindId.ParenthesizedListSplat;
    _content: any;
    content(): T.ListSplat | T.ParenthesizedListSplat;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapPattern(data: T.Pattern, tree: TreeHandle): T.Pattern;
export declare function wrapPatternList(data: T.PatternList, tree: TreeHandle): {
    $type: TSKindId.PatternList;
    _pattern: readonly any[];
    patterns(): T.Pattern[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapPrimaryExpression(data: T.PrimaryExpression, tree: TreeHandle): T.PrimaryExpression;
export declare function wrapPrintStatement(data: T.PrintStatement, tree: TreeHandle): {
    $type: TSKindId.PrintStatement;
    _chevron: T.Chevron | undefined;
    _argument: readonly (T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator)[];
    chevron(): T.Chevron | undefined;
    arguments(): T.Expression[];
    $with: {
        chevron: (v: NonNullable<T.PrintStatement['_chevron']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (...v: NonNullable<T.PrintStatement['_argument']>[number][]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapRaiseStatement(data: T.RaiseStatement, tree: TreeHandle): {
    $type: TSKindId.RaiseStatement;
    _expressions: any;
    _cause: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator | undefined;
    expressions(): T.ExpressionList | undefined;
    cause(): T.Expression | undefined;
    $with: {
        expressions: (v: NonNullable<T.RaiseStatement['_expressions']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        cause: (v: NonNullable<T.RaiseStatement['_cause']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapRelativeImport(data: T.RelativeImport, tree: TreeHandle): {
    $type: TSKindId.RelativeImport;
    _import_prefix: T.ImportPrefix;
    _dotted_name: T.DottedName | undefined;
    importPrefix(): T.ImportPrefix;
    dottedName(): T.DottedName | undefined;
    $with: {
        importPrefix: (v: NonNullable<T.RelativeImport['_import_prefix']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        dottedName: (v: NonNullable<T.RelativeImport['_dotted_name']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapReturnStatement(data: T.ReturnStatement, tree: TreeHandle): {
    $type: TSKindId.ReturnStatement;
    _expressions: any;
    expressions(): T.ExpressionList | undefined;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapSet(data: T.Set, tree: TreeHandle): {
    $type: TSKindId.Set;
    _collection_elements: CollectionElements;
    collectionElements(): T.CollectionElements;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapSetComprehension(data: T.SetComprehension, tree: TreeHandle): {
    $type: TSKindId.SetComprehension;
    _body: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _comprehension_clauses: T.ComprehensionClauses;
    body(): T.Expression;
    comprehensionClauses(): T.ComprehensionClauses;
    $with: {
        body: (v: NonNullable<T.SetComprehension['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        comprehensionClauses: (v: NonNullable<T.SetComprehension['_comprehension_clauses']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapSlice(data: T.Slice, tree: TreeHandle): {
    $type: TSKindId.Slice;
    _start: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator | undefined;
    _stop: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator | undefined;
    _step: T.SliceGroup1 | undefined;
    start(): T.Expression | undefined;
    stop(): T.Expression | undefined;
    step(): T.SliceGroup1 | undefined;
    $with: {
        start: (v: NonNullable<T.Slice['_start']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        stop: (v: NonNullable<T.Slice['_stop']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        step: (v: NonNullable<T.Slice['_step']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapSplatPattern(data: T.SplatPattern, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"*" | "**", TSKindId.Star2 | TSKindId.StarStar>;
    };
    $type: TSKindId.SplatPattern;
    _operator: number;
    _identifier: "_" | T.Identifier;
    operator(): number;
    identifier(): "_" | T.Identifier;
    $with: {
        operator: (v: NonNullable<T.SplatPattern['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        identifier: (v: NonNullable<T.SplatPattern['_identifier']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapSplatType(data: T.SplatType, tree: TreeHandle): {
    $type: TSKindId.SplatType;
    _identifier: T.Identifier | T.SplatPatternOperator;
    identifier(): T.Identifier | T.SplatPatternOperator;
    $with: {
        identifier: (v: NonNullable<T.SplatType['_identifier']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapString(data: T.String, tree: TreeHandle): {
    $type: TSKindId.String;
    _string_start: T.StringStart;
    _content: readonly (T.Interpolation | T.StringContent)[];
    _string_end: T.StringEnd;
    stringStart(): T.StringStart;
    contents(): (T.Interpolation | T.StringContent)[];
    stringEnd(): T.StringEnd;
    $with: {
        stringStart: (v: NonNullable<T.String['_string_start']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        contents: (...v: NonNullable<T.String['_content']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        stringEnd: (v: NonNullable<T.String['_string_end']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapStringContent(data: T.StringContent, tree: TreeHandle): {
    $type: TSKindId.StringContent;
    _content: readonly any[];
    contents(): ("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapSubscript(data: T.Subscript, tree: TreeHandle): {
    $type: TSKindId.Subscript;
    _value: T.Attribute | T.Await | T.BinaryOperator | T.Call | T.ConcatenatedString | T.Dictionary | T.DictionaryComprehension | T.False | T.Float | T.GeneratorExpression | T.Identifier | T.Integer | T.KeywordIdentifier | T.List | T.ListComprehension | T.ListSplatPattern | T.None | T.ParenthesizedExpression | T.Set | T.SetComprehension | T.String | T.Subscript | T.True | T.Tuple | T.UnaryOperator;
    _subscript: readonly (T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator | T.Slice)[];
    value(): T.PrimaryExpression;
    subscripts(): (T.Slice | T.Expression)[];
    $with: {
        value: (v: NonNullable<T.Subscript['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        subscripts: (v_0: T.Slice | T.Expression, ...v: (T.Slice | T.Expression)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapTryStatement(data: T.TryStatement, tree: TreeHandle): {
    $type: TSKindId.TryStatement;
    _body: T.Block | T.Newline | T.SimpleStatements;
    _except_clauses: readonly T.ExceptClause[];
    _else_clause: T.ElseClause | undefined;
    _finally_clause: T.FinallyClause | undefined;
    body(): T.Block | T.Newline | T.SimpleStatements;
    exceptClauses(): T.ExceptClause[];
    elseClause(): T.ElseClause | undefined;
    finallyClause(): T.FinallyClause | undefined;
    $with: {
        body: (v: NonNullable<T.TryStatement['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exceptClauses: (...v: NonNullable<T.TryStatement['_except_clauses']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        elseClause: (v: NonNullable<T.TryStatement['_else_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        finallyClause: (v: NonNullable<T.TryStatement['_finally_clause']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapTuple(data: T.Tuple, tree: TreeHandle): {
    $type: TSKindId.Tuple;
    _collection_elements: any;
    collectionElements(): any;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapTuplePattern(data: T.TuplePattern, tree: TreeHandle): {
    $type: TSKindId.TuplePattern;
    _patterns: any;
    patterns(): any;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapType(data: T.Type, tree: TreeHandle): {
    $type: TSKindId.Type;
    _content: any;
    content(): T.ConstrainedType | T.GenericType | T.MemberType | T.SplatType | T.UnionType | T.Expression;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapTypeAliasStatement(data: T.TypeAliasStatement, tree: TreeHandle): {
    __inputHints__?: {
        readonly type: import("@sittir/types").KindEnum<"type", TSKindId.Type>;
    };
    $type: TSKindId.TypeAliasStatement;
    _type: number;
    _left: T.Type;
    _right: T.Type;
    type(): number;
    left(): T.Type;
    right(): T.Type;
    $with: {
        type: (v: NonNullable<T.TypeAliasStatement['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        left: (v: NonNullable<T.TypeAliasStatement['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.TypeAliasStatement['_right']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapTypeParameter(data: T.TypeParameter, tree: TreeHandle): {
    $type: TSKindId.TypeParameter;
    _type: readonly T.Type[];
    types(): T.Type[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapTypedDefaultParameter(data: T.TypedDefaultParameter, tree: TreeHandle): {
    $type: TSKindId.TypedDefaultParameter;
    _name: T.Identifier;
    _type: T.Type;
    _value: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    name(): T.Identifier;
    type(): T.Type;
    value(): T.Expression;
    $with: {
        name: (v: NonNullable<T.TypedDefaultParameter['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.TypedDefaultParameter['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.TypedDefaultParameter['_value']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapTypedParameter(data: T.TypedParameter, tree: TreeHandle): {
    $type: TSKindId.TypedParameter;
    _content: any;
    _type: T.Type;
    content(): T.DictionarySplatPattern | T.Identifier | T.ListSplatPattern;
    type(): T.Type;
    $with: {
        content: (v: NonNullable<T.TypedParameter['_content']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.TypedParameter['_type']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapUnaryOperator(data: T.UnaryOperator, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"+" | "-" | "~", TSKindId.Plus | TSKindId.Dash | TSKindId.Tilde>;
    };
    $type: TSKindId.UnaryOperator;
    _operator: number;
    _argument: T.Attribute | T.Await | T.BinaryOperator | T.Call | T.ConcatenatedString | T.Dictionary | T.DictionaryComprehension | T.False | T.Float | T.GeneratorExpression | T.Identifier | T.Integer | T.KeywordIdentifier | T.List | T.ListComprehension | T.ListSplatPattern | T.None | T.ParenthesizedExpression | T.Set | T.SetComprehension | T.String | T.Subscript | T.True | T.Tuple | T.UnaryOperator;
    operator(): number;
    argument(): T.PrimaryExpression;
    $with: {
        operator: (v: NonNullable<T.UnaryOperator['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (v: NonNullable<T.UnaryOperator['_argument']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapUnionPattern(data: T.UnionPattern, tree: TreeHandle): {
    $type: TSKindId.UnionPattern;
    _simple_pattern: readonly any[];
    simplePatterns(): T.SimplePattern[];
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapUnionType(data: T.UnionType, tree: TreeHandle): {
    $type: TSKindId.UnionType;
    _left: T.Type;
    _right: T.Type;
    left(): T.Type;
    right(): T.Type;
    $with: {
        left: (v: NonNullable<T.UnionType['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.UnionType['_right']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapWhileStatement(data: T.WhileStatement, tree: TreeHandle): {
    $type: TSKindId.WhileStatement;
    _condition: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    _body: T.Block | T.Newline | T.SimpleStatements;
    _alternative: T.ElseClause | undefined;
    condition(): T.Expression;
    body(): T.Block | T.Newline | T.SimpleStatements;
    alternative(): T.ElseClause | undefined;
    $with: {
        condition: (v: NonNullable<T.WhileStatement['_condition']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.WhileStatement['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternative: (v: NonNullable<T.WhileStatement['_alternative']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapWithClause(data: T.WithClause, tree: TreeHandle): {
    $type: TSKindId.WithClause;
    _content: any;
    content(): T.WithClauseBare | T.WithClauseParen;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapWithItem(data: T.WithItem, tree: TreeHandle): {
    $type: TSKindId.WithItem;
    _value: T.AsPattern | T.BooleanOperator | T.ComparisonOperator | T.ConditionalExpression | T.Lambda | T.NamedExpression | T.NotOperator;
    value(): T.Expression;
    $with: {
        value: (v: NonNullable<T.WithItem['_value']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapWithStatement(data: T.WithStatement, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.WithStatement;
    _async_marker: true | undefined;
    _with_clause: T.WithClause;
    _body: T.Block | T.Newline | T.SimpleStatements;
    asyncMarker(): true | undefined;
    withClause(): T.WithClause;
    body(): T.Block | T.Newline | T.SimpleStatements;
    $with: {
        asyncMarker: (v: NonNullable<T.WithStatement['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        withClause: (v: NonNullable<T.WithStatement['_with_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.WithStatement['_body']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapYield(data: T.Yield, tree: TreeHandle): {
    $type: TSKindId.Yield;
    _content: any;
    content(): T.ExpressionList | T.Expression | undefined;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapSliceGroup1(data: T.SliceGroup1, tree: TreeHandle): {
    $type: "slice_group1";
    _expression: any;
    expression(): T.Expression | undefined;
    $with: {
        $children: (vs_0: never) => /*elided*/ any & {
            $render(): string;
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
/** Wrap a NodeData into its lazy read-only view. */
export declare function wrapNode(data: _NodeData, tree: TreeHandle): unknown;
/**
 * Read a parsed tree node into a lazily-wrapped NodeData.
 * One level deep — getters drill into subtrees on demand by
 * recursing back through this same function.
 *
 * Optional `asType: { from, to }` rewrites `$type` between the read
 * and the wrap when the node's actual `$type === from`. Used by
 * `drillAs` for alias-target → alias-source rewrites at
 * declared field sites.
 */
export declare function readTreeNode(tree: TreeHandle, handle?: number, childIndex?: number, asType?: {
    from: string;
    to: string;
}): unknown;
//# sourceMappingURL=wrap.d.ts.map