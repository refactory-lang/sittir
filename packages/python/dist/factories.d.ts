import type * as T from './types.js';
import { TSKindId } from './types.js';
import type { ConfigOf, FluentNode } from '@sittir/types';
export declare function _asPattern(config: T._AsPattern.Config): {
    $type: TSKindId._AsPattern;
    $source: 2;
    $named: true;
    _case_pattern: T.CasePattern;
    _identifier: T.Identifier;
    casePattern(): T.CasePattern;
    identifier(): T.Identifier;
    $with: {
        casePattern: (value: T.CasePattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _assignmentEq(config: T.AssignmentEq.Config): {
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _assignmentType(config: T.AssignmentType.Config): {
    $type: TSKindId.AssignmentType;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _assignmentTyped(config: T.AssignmentTyped.Config): {
    $type: TSKindId.AssignmentTyped;
    $source: 2;
    $named: true;
    _type: T.Type;
    _right: T.RightHandSide;
    type(): T.Type;
    right(): T.RightHandSide;
    $with: {
        type: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function comprehensionClauses(...children: (T.ForInClause | T.IfClause)[]): {
    $type: TSKindId.ComprehensionClauses;
    $source: 2;
    $named: true;
    _for_in_clause: (T.ForInClause | T.IfClause)[];
    forInClause(): (T.ForInClause | T.IfClause)[];
    $with: {
        $children: (...vs: (T.ForInClause | T.IfClause)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _importList(config: T.ImportList.Config): {
    $type: TSKindId.ImportList;
    $source: 2;
    $named: true;
    _name: readonly [T.AliasedImport | T.DottedName, ...(T.AliasedImport | T.DottedName)[]];
    names(): readonly [T.AliasedImport | T.DottedName, ...(T.AliasedImport | T.DottedName)[]];
    $with: {
        names: (values_0: T.AliasedImport | T.DottedName, ...values: (T.AliasedImport | T.DottedName)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function isNot(text: string): {
    $type: TSKindId.IsNot;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _keyValuePattern(config: T.KeyValuePattern.Config): {
    $type: TSKindId.KeyValuePattern;
    $source: 2;
    $named: true;
    _key: T.SimplePattern;
    _value: T.CasePattern;
    key(): T.SimplePattern;
    value(): T.CasePattern;
    $with: {
        key: (value: T.SimplePattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value: T.CasePattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _listPattern(...children: T.CasePattern[]): {
    $type: TSKindId._ListPattern;
    $source: 2;
    $named: true;
    _case_pattern: T.CasePattern[];
    casePatterns(): T.CasePattern[];
    $with: {
        $children: (...vs: T.CasePattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function matchBlock(child: T.MatchBlockBlock): {
    $type: TSKindId.MatchBlock;
    $source: 2;
    $named: true;
    _match_block_block: T.MatchBlockBlock;
    matchBlockBlock(): T.MatchBlockBlock;
    $with: {
        $child: (v: T.MatchBlockBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _matchBlockBlock(config?: Partial<T.MatchBlockBlock.Config>): {
    $type: TSKindId.MatchBlockBlock;
    $source: 2;
    $named: true;
    _alternative: readonly T.CaseClause[] | undefined;
    alternatives(): readonly T.CaseClause[] | undefined;
    $with: {
        alternatives: (...values: T.CaseClause[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function notIn(text: string): {
    $type: TSKindId.NotIn;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function simplePatternNegative(child: (T.Integer | T.Float)): {
    $type: TSKindId.SimplePatternNegative;
    $source: 2;
    $named: true;
    _integer: T.Float | T.Integer;
    integer(): T.Float | T.Integer;
    $with: {
        $child: (v: (T.Integer | T.Float)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function simpleStatements(...children: T.SimpleStatement[]): {
    $type: TSKindId.SimpleStatements;
    $source: 2;
    $named: true;
    _simple_statement: T.SimpleStatement[] & readonly [T.SimpleStatement, ...T.SimpleStatement[]];
    simpleStatements(): T.SimpleStatement[] & readonly [T.SimpleStatement, ...T.SimpleStatement[]];
    $with: {
        $children: (...vs: T.SimpleStatement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _tuplePattern(...children: T.CasePattern[]): {
    $type: TSKindId._TuplePattern;
    $source: 2;
    $named: true;
    _case_pattern: T.CasePattern[];
    casePatterns(): T.CasePattern[];
    $with: {
        $children: (...vs: T.CasePattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _withClauseParen(...children: T.WithItem[]): {
    $type: TSKindId._WithClauseParen;
    $source: 2;
    $named: true;
    _with_item: T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
    withItems(): T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function aliasedImport(config: T.AliasedImport.Config): {
    $type: TSKindId.AliasedImport;
    $source: 2;
    $named: true;
    _name: T.DottedName;
    _alias: T.Identifier;
    name(): T.DottedName;
    alias(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function argumentList(...children: (T.Expression | T.ListSplat | T.DictionarySplat | T.ParenthesizedListSplat | T.KeywordArgument)[]): {
    $type: TSKindId.ArgumentList;
    $source: 2;
    $named: true;
    _expression: (T.DictionarySplat | T.KeywordArgument | T.ListSplat | T.ParenthesizedListSplat | T.Expression)[];
    expression(): (T.DictionarySplat | T.KeywordArgument | T.ListSplat | T.ParenthesizedListSplat | T.Expression)[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function asPattern(config: T.AsPattern.Config): {
    $type: TSKindId.AsPattern;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _alias: T.AsPatternTarget;
    expression(): T.Expression;
    alias(): T.AsPatternTarget;
    $with: {
        expression: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        alias: (value: T.AsPatternTarget) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function assertStatement(...children: T.Expression[]): {
    $type: TSKindId.AssertStatement;
    $source: 2;
    $named: true;
    _expression: T.Expression[] & readonly [T.Expression, ...T.Expression[]];
    expressions(): T.Expression[] & readonly [T.Expression, ...T.Expression[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function assignment(config: ConfigOf<T.AssignmentUFormEq>): ReturnType<typeof assignmentUFormEq>;
export declare function assignment(config: ConfigOf<T.AssignmentUFormType>): ReturnType<typeof assignmentUFormType>;
export declare function assignment(config: ConfigOf<T.AssignmentUFormTyped>): ReturnType<typeof assignmentUFormTyped>;
export declare function assignmentUFormEq(config: Omit<ConfigOf<T.AssignmentUFormEq>, '$variant'>): {
    $type: TSKindId.Assignment;
    $source: 2;
    $named: true;
    $variant: 'eq';
    _left: T.PatternList;
    _assignment_eq: T.AssignmentEq;
    left(): T.PatternList;
    assignmentEq(): T.AssignmentEq;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        assignmentEq: (value: T.AssignmentEq) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function assignmentUFormType(config: Omit<ConfigOf<T.AssignmentUFormType>, '$variant'>): {
    $type: TSKindId.Assignment;
    $source: 2;
    $named: true;
    $variant: 'type';
    _left: T.PatternList;
    _assignment_type: T.AssignmentType;
    left(): T.PatternList;
    assignmentType(): T.AssignmentType;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        assignmentType: (value: T.AssignmentType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function assignmentUFormTyped(config: Omit<ConfigOf<T.AssignmentUFormTyped>, '$variant'>): {
    $type: TSKindId.Assignment;
    $source: 2;
    $named: true;
    $variant: 'typed';
    _left: T.PatternList;
    _assignment_typed: T.AssignmentTyped;
    left(): T.PatternList;
    assignmentTyped(): T.AssignmentTyped;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        assignmentTyped: (value: T.AssignmentTyped) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function attribute(config: T.Attribute.Config): {
    $type: TSKindId.Attribute;
    $source: 2;
    $named: true;
    _object: T.PrimaryExpression;
    _attribute: T.Identifier;
    object(): T.PrimaryExpression;
    attribute(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function augmentedAssignment(config: T.AugmentedAssignment.Config): {
    $type: TSKindId.AugmentedAssignment;
    $source: 2;
    $named: true;
    _left: T.PatternList;
    _operator: unknown;
    _right: T.RightHandSide;
    left(): T.PatternList;
    operator(): unknown;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof augmentedAssignment>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function await_(primaryExpression: T.Await.Config['primaryExpression']): {
    $type: TSKindId.Await;
    $source: 2;
    $named: true;
    _primary_expression: T.PrimaryExpression;
    primaryExpression(): T.PrimaryExpression;
    $with: {
        primaryExpression: (value: T.Await.Config['primaryExpression']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function binaryOperator(config: T.BinaryOperator.Config): {
    $type: TSKindId.BinaryOperator;
    $source: 2;
    $named: true;
    _left: T.PrimaryExpression;
    _operator: unknown;
    _right: T.PrimaryExpression;
    left(): T.PrimaryExpression;
    operator(): unknown;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof binaryOperator>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function block(...children: T.Statement[]): {
    $type: TSKindId.Block;
    $source: 2;
    $named: true;
    _statement: T.Statement[];
    statements(): T.Statement[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function booleanOperator(config: T.BooleanOperator.Config): {
    $type: TSKindId.BooleanOperator;
    $source: 2;
    $named: true;
    _left: T.Expression;
    _operator: unknown;
    _right: T.Expression;
    left(): T.Expression;
    operator(): unknown;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof booleanOperator>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function breakStatement(): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function call(config: T.Call.Config): {
    $type: TSKindId.Call;
    $source: 2;
    $named: true;
    _function: T.PrimaryExpression;
    _arguments: T.ArgumentList | T.GeneratorExpression;
    function(): T.PrimaryExpression;
    arguments(): T.ArgumentList | T.GeneratorExpression;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        arguments: (value: T.GeneratorExpression | T.ArgumentList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function caseClause(config: T.CaseClause.Config): {
    $type: TSKindId.CaseClause;
    $source: 2;
    $named: true;
    _case_pattern: readonly [T.CasePattern, ...T.CasePattern[]];
    _guard: T.IfClause | undefined;
    _consequence: T.Suite;
    casePatterns(): readonly [T.CasePattern, ...T.CasePattern[]];
    guard(): T.IfClause | undefined;
    consequence(): T.Suite;
    $with: {
        casePatterns: (values_0: T.CasePattern, ...values: T.CasePattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        guard: (value?: T.IfClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function casePattern(child: (T._AsPattern | T.KeywordPattern | T.SimplePattern)): {
    $type: TSKindId.CasePattern;
    $source: 2;
    $named: true;
    _as_pattern: T.KeywordPattern | T._AsPattern | T.SimplePattern;
    asPattern(): T.KeywordPattern | T._AsPattern | T.SimplePattern;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function chevron(expression: T.Chevron.Config['expression']): {
    $type: TSKindId.Chevron;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.Chevron.Config['expression']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function classDefinition(config: T.ClassDefinition.Config): {
    $type: TSKindId.ClassDefinition;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    _type_parameters: T.TypeParameter | undefined;
    _superclasses: T.ArgumentList | undefined;
    _body: T.Suite;
    name(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function classPattern(config: T.ClassPattern.Config): {
    $type: TSKindId.ClassPattern;
    $source: 2;
    $named: true;
    _dotted_name: T.DottedName;
    _arguments: readonly T.CasePattern[] | undefined;
    dottedName(): T.DottedName;
    arguments(): readonly T.CasePattern[] | undefined;
    $with: {
        dottedName: (value: T.DottedName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        arguments: (...values: T.CasePattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function comment(text: string): {
    $type: TSKindId.Comment;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function comparisonOperator(config: T.ComparisonOperator.Config): {
    $type: TSKindId.ComparisonOperator;
    $source: 2;
    $named: true;
    _left: T.PrimaryExpression;
    _operators: readonly ["is not" | "not in" | T.BangEq | T.EqEq | T.Gt | T.GtEq | T.In | T.Is | T.Lt | T.LtEq | T.LtGt, ...("is not" | "not in" | T.BangEq | T.EqEq | T.Gt | T.GtEq | T.In | T.Is | T.Lt | T.LtEq | T.LtGt)[]];
    _primary_expression: readonly [T.PrimaryExpression, ...T.PrimaryExpression[]];
    left(): T.PrimaryExpression;
    operators(): readonly ["is not" | "not in" | T.BangEq | T.EqEq | T.Gt | T.GtEq | T.In | T.Is | T.Lt | T.LtEq | T.LtGt, ...("is not" | "not in" | T.BangEq | T.EqEq | T.Gt | T.GtEq | T.In | T.Is | T.Lt | T.LtEq | T.LtGt)[]];
    primaryExpressions(): readonly [T.PrimaryExpression, ...T.PrimaryExpression[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        operators: (values_0: "is not" | "not in" | T.BangEq | T.EqEq | T.Gt | T.GtEq | T.In | T.Is | T.Lt | T.LtEq | T.LtGt, ...values: ("is not" | "not in" | T.BangEq | T.EqEq | T.Gt | T.GtEq | T.In | T.Is | T.Lt | T.LtEq | T.LtGt)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        primaryExpressions: (values_0: T.PrimaryExpression, ...values: T.PrimaryExpression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function complexPattern(config: T.ComplexPattern.Config): {
    $type: TSKindId.ComplexPattern;
    $source: 2;
    $named: true;
    _real: true | undefined;
    _imaginary: T.Float | T.Integer;
    _integer: T.Float | T.Integer;
    real(): true | undefined;
    imaginary(): T.Float | T.Integer;
    integer(): T.Float | T.Integer;
    $with: {
        real: (value?: NonNullable<Parameters<typeof complexPattern>[0]>['real']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        integer: (value: T.Integer | T.Float) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function concatenatedString(...children: T.String[]): {
    $type: TSKindId.ConcatenatedString;
    $source: 2;
    $named: true;
    _string: T.String[] & readonly [T.String, ...T.String[]];
    string(): T.String[] & readonly [T.String, ...T.String[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function conditionalExpression(config: T.ConditionalExpression.Config): {
    $type: TSKindId.ConditionalExpression;
    $source: 2;
    $named: true;
    _body: T.Expression;
    _condition: T.Expression;
    _alternative: T.Expression;
    body(): T.Expression;
    condition(): T.Expression;
    alternative(): T.Expression;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        condition: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        alternative: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function constrainedType(config: T.ConstrainedType.Config): {
    $type: TSKindId.ConstrainedType;
    $source: 2;
    $named: true;
    _base_type: T.Type;
    _constraint: T.Type;
    baseType(): T.Type;
    constraint(): T.Type;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        constraint: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function continueStatement(): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function decoratedDefinition(config: T.DecoratedDefinition.Config): {
    $type: TSKindId.DecoratedDefinition;
    $source: 2;
    $named: true;
    _decorator: readonly [T.Decorator, ...T.Decorator[]];
    _definition: T.ClassDefinition | T.FunctionDefinition;
    decorators(): readonly [T.Decorator, ...T.Decorator[]];
    definition(): T.ClassDefinition | T.FunctionDefinition;
    $with: {
        decorators: (values_0: T.Decorator, ...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        definition: (value: T.ClassDefinition | T.FunctionDefinition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function decorator(config: T.Decorator.Config): {
    $type: TSKindId.Decorator;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _newline: string | undefined;
    expression(): T.Expression;
    newline(): string | undefined;
    $with: {
        expression: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        newline: (value?: string) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function defaultParameter(config: T.DefaultParameter.Config): {
    $type: TSKindId.DefaultParameter;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.TuplePattern;
    _value: T.Expression;
    name(): T.Identifier | T.TuplePattern;
    value(): T.Expression;
    $with: {
        name: (value: T.Identifier | T.TuplePattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function deleteStatement(child: T.Expressions): {
    $type: TSKindId.DeleteStatement;
    $source: 2;
    $named: true;
    _expressions: T.ExpressionList;
    expressions(): T.ExpressionList;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function dictPattern(...children: T.DictPatternKv[]): {
    $type: TSKindId.DictPattern;
    $source: 2;
    $named: true;
    _dict_pattern_kv: T.DictPatternKv[];
    dictPatternKvs(): T.DictPatternKv[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function dictionary(...children: (T.Pair | T.DictionarySplat)[]): {
    $type: TSKindId.Dictionary;
    $source: 2;
    $named: true;
    _pair: (T.DictionarySplat | T.Pair)[];
    pairs(): (T.DictionarySplat | T.Pair)[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function dictionaryComprehension(config: T.DictionaryComprehension.Config): {
    $type: TSKindId.DictionaryComprehension;
    $source: 2;
    $named: true;
    _body: T.Pair;
    _comprehension_clauses: T.ComprehensionClauses;
    body(): T.Pair;
    comprehensionClauses(): T.ComprehensionClauses;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        comprehensionClauses: (value: T.ComprehensionClauses) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function dictionarySplat(expression: T.DictionarySplat.Config['expression']): {
    $type: TSKindId.DictionarySplat;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.DictionarySplat.Config['expression']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function dictionarySplatPattern(child: (T.Identifier | T.KeywordIdentifier | T.Subscript | T.Attribute)): {
    $type: TSKindId.DictionarySplatPattern;
    $source: 2;
    $named: true;
    _identifier: T.Attribute | T.Identifier | T.KeywordIdentifier | T.Subscript;
    identifier(): T.Attribute | T.Identifier | T.KeywordIdentifier | T.Subscript;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function dottedName(...children: T.Identifier[]): {
    $type: TSKindId.DottedName;
    $source: 2;
    $named: true;
    _identifier: T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    identifiers(): T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function elifClause(config: T.ElifClause.Config): {
    $type: TSKindId.ElifClause;
    $source: 2;
    $named: true;
    _condition: T.Expression;
    _consequence: T.Suite;
    condition(): T.Expression;
    consequence(): T.Suite;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function elseClause(body: T.ElseClause.Config['body']): {
    $type: TSKindId.ElseClause;
    $source: 2;
    $named: true;
    _body: T.Suite;
    body(): T.Suite;
    $with: {
        body: (value: T.ElseClause.Config['body']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function escapeSequence(text: string): {
    $type: TSKindId.EscapeSequence;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function exceptClause(config: T.ExceptClause.Config): {
    $type: TSKindId.ExceptClause;
    $source: 2;
    $named: true;
    _value: readonly [T.Expression, ...T.Expression[]] | undefined;
    _alias: T.Expression | undefined;
    _suite: T.Suite;
    values(): readonly [T.Expression, ...T.Expression[]] | undefined;
    alias(): T.Expression | undefined;
    suite(): T.Suite;
    $with: {
        values: (values_0: T.Expression, ...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        suite: (value: T.Suite) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function execStatement(config: T.ExecStatement.Config): {
    $type: TSKindId.ExecStatement;
    $source: 2;
    $named: true;
    _code: T.Identifier | T.String;
    _in_clause: readonly ["in" | T.Expression, ...("in" | T.Expression)[]] | undefined;
    code(): T.Identifier | T.String;
    inClauses(): readonly ["in" | T.Expression, ...("in" | T.Expression)[]] | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        inClauses: (values_0: "in" | T.Expression, ...values: ("in" | T.Expression)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionList(...children: T.Expression[]): {
    $type: TSKindId.ExpressionList;
    $source: 2;
    $named: true;
    _expression: T.Expression[] & readonly [T.Expression, ...T.Expression[]];
    expression(): T.Expression[] & readonly [T.Expression, ...T.Expression[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatementTuple(...children: T.Expression[]): {
    $type: TSKindId._ExpressionStatementTuple;
    $source: 2;
    $named: true;
    _expression: T.Expression[] & readonly [T.Expression, ...T.Expression[]];
    expressions(): T.Expression[] & readonly [T.Expression, ...T.Expression[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatement(config: ConfigOf<T.ExpressionStatementUFormExpression>): ReturnType<typeof expressionStatementUFormExpression>;
export declare function expressionStatement(config: ConfigOf<T.ExpressionStatementUFormTuple>): ReturnType<typeof expressionStatementUFormTuple>;
export declare function expressionStatement(config: ConfigOf<T.ExpressionStatementUFormAssignment>): ReturnType<typeof expressionStatementUFormAssignment>;
export declare function expressionStatement(config: ConfigOf<T.ExpressionStatementUFormAugmentedAssignment>): ReturnType<typeof expressionStatementUFormAugmentedAssignment>;
export declare function expressionStatement(config: ConfigOf<T.ExpressionStatementUFormYield>): ReturnType<typeof expressionStatementUFormYield>;
export declare function expressionStatementUFormExpression(config: Omit<ConfigOf<T.ExpressionStatementUFormExpression>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'expression';
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatementUFormTuple(config: Omit<ConfigOf<T.ExpressionStatementUFormTuple>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'tuple';
    _expression_statement_tuple: any;
    expressionStatementTuple(): any;
    $with: {
        expressionStatementTuple: (value: T._ExpressionStatementTuple) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatementUFormAssignment(config: Omit<ConfigOf<T.ExpressionStatementUFormAssignment>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'assignment';
    _assignment: T.Assignment;
    assignment(): T.Assignment;
    $with: {
        assignment: (value: T.Assignment) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatementUFormAugmentedAssignment(config: Omit<ConfigOf<T.ExpressionStatementUFormAugmentedAssignment>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'augmented_assignment';
    _augmented_assignment: T.AugmentedAssignment;
    augmentedAssignment(): T.AugmentedAssignment;
    $with: {
        augmentedAssignment: (value: T.AugmentedAssignment) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatementUFormYield(config: Omit<ConfigOf<T.ExpressionStatementUFormYield>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'yield';
    _yield: T.Yield;
    yield(): T.Yield;
    $with: {
        yield: (value: T.Yield) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function false_(): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function finallyClause(block: T.FinallyClause.Config['block']): {
    $type: TSKindId.FinallyClause;
    $source: 2;
    $named: true;
    _block: T.Suite;
    block(): T.Suite;
    $with: {
        block: (value: T.FinallyClause.Config['block']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function float(text: string): {
    $type: TSKindId.Float;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function forInClause(config: T.ForInClause.Config): {
    $type: TSKindId.ForInClause;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _left: T.PatternList;
    _right: readonly [T.LambdaWithinForInClause, ...T.LambdaWithinForInClause[]];
    asyncMarker(): true | undefined;
    left(): T.PatternList;
    rights(): readonly [T.LambdaWithinForInClause, ...T.LambdaWithinForInClause[]];
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof forInClause>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        rights: (values_0: T.LambdaWithinForInClause, ...values: T.LambdaWithinForInClause[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function forStatement(config: T.ForStatement.Config): {
    $type: TSKindId.ForStatement;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _left: T.PatternList;
    _right: T.ExpressionList;
    _body: T.Suite;
    _alternative: T.ElseClause | undefined;
    asyncMarker(): true | undefined;
    left(): T.PatternList;
    right(): T.ExpressionList;
    body(): T.Suite;
    alternative(): T.ElseClause | undefined;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof forStatement>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function formatSpecifier(...children: T.Interpolation[]): {
    $type: TSKindId.FormatSpecifier;
    $source: 2;
    $named: true;
    _interpolation: T.Interpolation[];
    interpolations(): T.Interpolation[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function functionDefinition(config: T.FunctionDefinition.Config): {
    $type: TSKindId.FunctionDefinition;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _name: T.Identifier;
    _type_parameters: T.TypeParameter | undefined;
    _parameters: T.Parameters;
    _return_type: T.Type | undefined;
    _body: T.Suite;
    asyncMarker(): true | undefined;
    name(): T.Identifier;
    typeParameters(): T.TypeParameter | undefined;
    parameters(): T.Parameters;
    returnType(): T.Type | undefined;
    body(): T.Suite;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof functionDefinition>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function futureImportStatement(config: T.FutureImportStatement.Config): {
    $type: TSKindId.FutureImportStatement;
    $source: 2;
    $named: true;
    _name: readonly [T.AliasedImport | T.DottedName, ...(T.AliasedImport | T.DottedName)[]];
    names(): readonly [T.AliasedImport | T.DottedName, ...(T.AliasedImport | T.DottedName)[]];
    $with: {
        names: (values_0: T.AliasedImport | T.DottedName, ...values: (T.AliasedImport | T.DottedName)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function generatorExpression(config: T.GeneratorExpression.Config): {
    $type: TSKindId.GeneratorExpression;
    $source: 2;
    $named: true;
    _body: T.Expression;
    _comprehension_clauses: T.ComprehensionClauses;
    body(): T.Expression;
    comprehensionClauses(): T.ComprehensionClauses;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        comprehensionClauses: (value: T.ComprehensionClauses) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function genericType(config: T.GenericType.Config): {
    $type: TSKindId.GenericType;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    _type_parameter: T.TypeParameter;
    identifier(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function globalStatement(...children: T.Identifier[]): {
    $type: TSKindId.GlobalStatement;
    $source: 2;
    $named: true;
    _identifier: T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    identifiers(): T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function identifier(text: string): {
    $type: TSKindId.Identifier;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function ifClause(expression: T.IfClause.Config['expression']): {
    $type: TSKindId.IfClause;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.IfClause.Config['expression']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function ifStatement(config: T.IfStatement.Config): {
    $type: TSKindId.IfStatement;
    $source: 2;
    $named: true;
    _condition: T.Expression;
    _consequence: T.Suite;
    _alternative: readonly (T.ElifClause | T.ElseClause)[] | undefined;
    condition(): T.Expression;
    consequence(): T.Suite;
    alternatives(): readonly (T.ElifClause | T.ElseClause)[] | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        alternatives: (...values: (T.ElifClause | T.ElseClause)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function importFromStatement(config: T.ImportFromStatement.Config): {
    $type: TSKindId.ImportFromStatement;
    $source: 2;
    $named: true;
    _module_name: T.DottedName | T.RelativeImport;
    _wildcard_import: true | undefined;
    _name: readonly (T.AliasedImport | T.DottedName)[] | undefined;
    moduleName(): T.DottedName | T.RelativeImport;
    wildcardImport(): true | undefined;
    names(): readonly (T.AliasedImport | T.DottedName)[] | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        wildcardImport: (value?: NonNullable<Parameters<typeof importFromStatement>[0]>['wildcardImport']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        names: (...values: (T.DottedName | T.AliasedImport)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function importPrefix(text: string): {
    $type: TSKindId.ImportPrefix;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function importStatement(config: T.ImportStatement.Config): {
    $type: TSKindId.ImportStatement;
    $source: 2;
    $named: true;
    _name: readonly [T.AliasedImport | T.DottedName, ...(T.AliasedImport | T.DottedName)[]];
    names(): readonly [T.AliasedImport | T.DottedName, ...(T.AliasedImport | T.DottedName)[]];
    $with: {
        names: (values_0: T.AliasedImport | T.DottedName, ...values: (T.AliasedImport | T.DottedName)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function integer(text: string): {
    $type: TSKindId.Integer;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function interpolation(config: T.Interpolation.Config): {
    $type: TSKindId.Interpolation;
    $source: 2;
    $named: true;
    _expression: T.FExpression;
    _type_conversion: T.TypeConversion | undefined;
    _format_specifier: T.FormatSpecifier | undefined;
    expression(): T.FExpression;
    typeConversion(): T.TypeConversion | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function keywordArgument(config: T.KeywordArgument.Config): {
    $type: TSKindId.KeywordArgument;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.KeywordIdentifier;
    _value: T.Expression;
    name(): T.Identifier | T.KeywordIdentifier;
    value(): T.Expression;
    $with: {
        name: (value: T.Identifier | T.KeywordIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function keywordPattern(config: T.KeywordPattern.Config): {
    $type: TSKindId.KeywordPattern;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    _simple_pattern: T.SimplePattern;
    identifier(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lambda(config: T.Lambda.Config): {
    $type: TSKindId.Lambda;
    $source: 2;
    $named: true;
    _parameters: T.LambdaParameters | undefined;
    _body: T.Expression;
    parameters(): T.LambdaParameters | undefined;
    body(): T.Expression;
    $with: {
        parameters: (value?: T.LambdaParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lambdaParameters(...children: T.Parameter[]): {
    $type: TSKindId.LambdaParameters;
    $source: 2;
    $named: true;
    _parameter: T.Parameter[] & readonly [T.Parameter, ...T.Parameter[]];
    parameters(): T.Parameter[] & readonly [T.Parameter, ...T.Parameter[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lambdaWithinForInClause(config: T.LambdaWithinForInClause.Config): {
    $type: TSKindId.LambdaWithinForInClause;
    $source: 2;
    $named: true;
    _parameters: T.LambdaParameters | undefined;
    _body: T.LambdaWithinForInClause;
    parameters(): T.LambdaParameters | undefined;
    body(): T.LambdaWithinForInClause;
    $with: {
        parameters: (value?: T.LambdaParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.ExpressionWithinForInClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lineContinuation(text: string): {
    $type: TSKindId.LineContinuation;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function list(...children: (T.Expression | T.Yield | T.ListSplat | T.ParenthesizedListSplat)[]): {
    $type: TSKindId.List;
    $source: 2;
    $named: true;
    _expression: (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[];
    expressions(): (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function listComprehension(config: T.ListComprehension.Config): {
    $type: TSKindId.ListComprehension;
    $source: 2;
    $named: true;
    _body: T.Expression;
    _comprehension_clauses: T.ComprehensionClauses;
    body(): T.Expression;
    comprehensionClauses(): T.ComprehensionClauses;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        comprehensionClauses: (value: T.ComprehensionClauses) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function listPattern(...children: T.Pattern[]): {
    $type: TSKindId.ListPattern;
    $source: 2;
    $named: true;
    _pattern: T.Pattern[];
    patterns(): T.Pattern[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function listSplat(expression: T.ListSplat.Config['expression']): {
    $type: TSKindId.ListSplat;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.ListSplat.Config['expression']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function listSplatPattern(child: (T.Identifier | T.KeywordIdentifier | T.Subscript | T.Attribute)): {
    $type: TSKindId.ListSplatPattern;
    $source: 2;
    $named: true;
    _identifier: T.Attribute | T.Identifier | T.KeywordIdentifier | T.Subscript;
    identifier(): T.Attribute | T.Identifier | T.KeywordIdentifier | T.Subscript;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function matchStatement(config: T.MatchStatement.Config): {
    $type: TSKindId.MatchStatement;
    $source: 2;
    $named: true;
    _subject: readonly [T.Expression, ...T.Expression[]];
    _body: T.MatchBlock;
    subjects(): readonly [T.Expression, ...T.Expression[]];
    body(): T.MatchBlock;
    $with: {
        subjects: (values_0: T.Expression, ...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.MatchBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function memberType(config: T.MemberType.Config): {
    $type: TSKindId.MemberType;
    $source: 2;
    $named: true;
    _base_type: T.Type;
    _identifier: T.Identifier;
    baseType(): T.Type;
    identifier(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function module(...children: T.Statement[]): {
    $type: TSKindId.Module;
    $source: 2;
    $named: true;
    _statement: T.Statement[];
    statements(): T.Statement[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function namedExpression(config: T.NamedExpression.Config): {
    $type: TSKindId.NamedExpression;
    $source: 2;
    $named: true;
    _name: T.NamedExpressionLhs;
    _value: T.Expression;
    name(): T.NamedExpressionLhs;
    value(): T.Expression;
    $with: {
        name: (value: T.NamedExpressionLhs) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function none(): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function nonlocalStatement(...children: T.Identifier[]): {
    $type: TSKindId.NonlocalStatement;
    $source: 2;
    $named: true;
    _identifier: T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
    identifiers(): T.Identifier[] & readonly [T.Identifier, ...T.Identifier[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function notOperator(argument: T.NotOperator.Config['argument']): {
    $type: TSKindId.NotOperator;
    $source: 2;
    $named: true;
    _argument: T.Expression;
    argument(): T.Expression;
    $with: {
        argument: (value: T.NotOperator.Config['argument']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function pair(config: T.Pair.Config): {
    $type: TSKindId.Pair;
    $source: 2;
    $named: true;
    _key: T.Expression;
    _value: T.Expression;
    key(): T.Expression;
    value(): T.Expression;
    $with: {
        key: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function parameters(...children: T.Parameter[]): {
    $type: TSKindId.Parameters;
    $source: 2;
    $named: true;
    _parameter: T.Parameter[];
    parameters(): T.Parameter[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function parenthesizedExpression(child: (T.Expression | T.Yield)): {
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    _expression: T.Yield | T.Expression;
    expression(): T.Yield | T.Expression;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function parenthesizedListSplat(child: (T.ParenthesizedListSplat | T.ListSplat)): {
    $type: TSKindId.ParenthesizedListSplat;
    $source: 2;
    $named: true;
    _parenthesized_list_splat: T.ListSplat | T.ParenthesizedListSplat;
    parenthesizedListSplat(): T.ListSplat | T.ParenthesizedListSplat;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function passStatement(): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function patternList(...children: T.Pattern[]): {
    $type: TSKindId.PatternList;
    $source: 2;
    $named: true;
    _pattern: T.Pattern[] & readonly [T.Pattern, ...T.Pattern[]];
    pattern(): T.Pattern[] & readonly [T.Pattern, ...T.Pattern[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function printStatement(config?: Partial<T.PrintStatement.Config>): {
    $type: TSKindId.PrintStatement;
    $source: 2;
    $named: true;
    _argument: readonly T.Expression[] | undefined;
    _chevron: T.Chevron | undefined;
    arguments(): readonly T.Expression[] | undefined;
    chevron(): T.Chevron | undefined;
    $with: {
        arguments: (...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        chevron: (value?: T.Chevron) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function raiseStatement(config?: Partial<T.RaiseStatement.Config>): {
    $type: TSKindId.RaiseStatement;
    $source: 2;
    $named: true;
    _expressions: T.ExpressionList | undefined;
    _cause: T.Expression | undefined;
    expressions(): T.ExpressionList | undefined;
    cause(): T.Expression | undefined;
    $with: {
        expressions: (value?: T.Expressions) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        cause: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function relativeImport(config: T.RelativeImport.Config): {
    $type: TSKindId.RelativeImport;
    $source: 2;
    $named: true;
    _import_prefix: T.ImportPrefix;
    _dotted_name: T.DottedName | undefined;
    importPrefix(): T.ImportPrefix;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function returnStatement(child?: T.Expressions): {
    $type: TSKindId.ReturnStatement;
    $source: 2;
    $named: true;
    _expressions: T.ExpressionList | undefined;
    expressions(): T.ExpressionList | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function set(...children: (T.Expression | T.Yield | T.ListSplat | T.ParenthesizedListSplat)[]): {
    $type: TSKindId.Set;
    $source: 2;
    $named: true;
    _expression: (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[] & readonly [T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression, ...(T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[]];
    expressions(): (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[] & readonly [T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression, ...(T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function setComprehension(config: T.SetComprehension.Config): {
    $type: TSKindId.SetComprehension;
    $source: 2;
    $named: true;
    _body: T.Expression;
    _comprehension_clauses: T.ComprehensionClauses;
    body(): T.Expression;
    comprehensionClauses(): T.ComprehensionClauses;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        comprehensionClauses: (value: T.ComprehensionClauses) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function slice(config?: Partial<T.Slice.Config>): {
    $type: TSKindId.Slice;
    $source: 2;
    $named: true;
    _start: T.Expression | undefined;
    _stop: T.Expression | undefined;
    _step: T.Expression | undefined;
    start(): T.Expression | undefined;
    stop(): T.Expression | undefined;
    step(): T.Expression | undefined;
    $with: {
        start: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        stop: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        step: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function splatPattern(identifier: T.SplatPattern.Config['identifier']): {
    $type: TSKindId.SplatPattern;
    $source: 2;
    $named: true;
    _identifier: "_" | T.Identifier | T._Identifier;
    identifier(): "_" | T.Identifier | T._Identifier;
    $with: {
        identifier: (value: T.SplatPattern.Config['identifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function splatType(identifier: T.SplatType.Config['identifier']): {
    $type: TSKindId.SplatType;
    $source: 2;
    $named: true;
    _identifier: T.Identifier | T._Identifier;
    identifier(): T.Identifier | T._Identifier;
    $with: {
        identifier: (value: T.SplatType.Config['identifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function string(config: T.String.Config): {
    $type: TSKindId.String;
    $source: 2;
    $named: true;
    _string_start: T.StringStart;
    _content: readonly (T.Interpolation | T.StringContent)[] | undefined;
    _string_end: T.StringEnd;
    stringStart(): T.StringStart;
    contents(): readonly (T.Interpolation | T.StringContent)[] | undefined;
    stringEnd(): T.StringEnd;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        contents: (...values: (T.Interpolation | T.StringContent)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function stringContent(...children: (T.EscapeInterpolation | T.EscapeSequence | "\\" | T._StringContent)[]): {
    $type: TSKindId.StringContent;
    $source: 2;
    $named: true;
    _escape_interpolation: ("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[] & readonly ["\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent, ...("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[]];
    escapeInterpolations(): ("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[] & readonly ["\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent, ...("\\" | T.EscapeInterpolation | T.EscapeSequence | T._StringContent)[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function subscript(config: T.Subscript.Config): {
    $type: TSKindId.Subscript;
    $source: 2;
    $named: true;
    _value: T.PrimaryExpression;
    _subscript: readonly [T.Slice | T.Expression, ...(T.Slice | T.Expression)[]];
    value(): T.PrimaryExpression;
    subscripts(): readonly [T.Slice | T.Expression, ...(T.Slice | T.Expression)[]];
    $with: {
        value: (value: T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        subscripts: (values_0: T.Slice | T.Expression, ...values: (T.Slice | T.Expression)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function true_(): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tryStatement(config: T.TryStatement.Config): {
    $type: TSKindId.TryStatement;
    $source: 2;
    $named: true;
    _body: T.Suite;
    _except_clauses: readonly T.ExceptClause[] | undefined;
    _else_clause: T.ElseClause | undefined;
    _finally_clause: T.FinallyClause | undefined;
    body(): T.Suite;
    exceptClauses(): readonly T.ExceptClause[] | undefined;
    elseClause(): T.ElseClause | undefined;
    finallyClause(): T.FinallyClause | undefined;
    $with: {
        body: (value: T.Suite) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        exceptClauses: (...values: T.ExceptClause[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        elseClause: (value?: T.ElseClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        finallyClause: (value?: T.FinallyClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tuple(...children: (T.Expression | T.Yield | T.ListSplat | T.ParenthesizedListSplat)[]): {
    $type: TSKindId.Tuple;
    $source: 2;
    $named: true;
    _expression: (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[];
    expressions(): (T.ListSplat | T.ParenthesizedListSplat | T.Yield | T.Expression)[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tuplePattern(...children: T.Pattern[]): {
    $type: TSKindId.TuplePattern;
    $source: 2;
    $named: true;
    _pattern: T.Pattern[];
    patterns(): T.Pattern[];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function type(child: (T.Expression | T.SplatType | T.GenericType | T.UnionType | T.ConstrainedType | T.MemberType)): {
    $type: TSKindId.Type;
    $source: 2;
    $named: true;
    _expression: T.ConstrainedType | T.GenericType | T.MemberType | T.SplatType | T.UnionType | T.Expression;
    expression(): T.ConstrainedType | T.GenericType | T.MemberType | T.SplatType | T.UnionType | T.Expression;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeAliasStatement(config: T.TypeAliasStatement.Config): {
    $type: TSKindId.TypeAliasStatement;
    $source: 2;
    $named: true;
    _type: unknown;
    _left: T.Type;
    _right: T.Type;
    type(): unknown;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeConversion(text: string): {
    $type: TSKindId.TypeConversion;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeParameter(...children: T.Type[]): {
    $type: TSKindId.TypeParameter;
    $source: 2;
    $named: true;
    _type: T.Type[] & readonly [T.Type, ...T.Type[]];
    types(): T.Type[] & readonly [T.Type, ...T.Type[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typedDefaultParameter(config: T.TypedDefaultParameter.Config): {
    $type: TSKindId.TypedDefaultParameter;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    _type: T.Type;
    _value: T.Expression;
    name(): T.Identifier;
    type(): T.Type;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typedParameter(config: T.TypedParameter.Config): {
    $type: TSKindId.TypedParameter;
    $source: 2;
    $named: true;
    _identifier: T.DictionarySplatPattern | T.Identifier | T.ListSplatPattern;
    _type: T.Type;
    identifier(): T.DictionarySplatPattern | T.Identifier | T.ListSplatPattern;
    type(): T.Type;
    $with: {
        identifier: (value: T.Identifier | T.ListSplatPattern | T.DictionarySplatPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function unaryOperator(config: T.UnaryOperator.Config): {
    $type: TSKindId.UnaryOperator;
    $source: 2;
    $named: true;
    _operator: unknown;
    _argument: T.PrimaryExpression;
    operator(): unknown;
    argument(): T.PrimaryExpression;
    $with: {
        operator: (value: NonNullable<Parameters<typeof unaryOperator>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function unionPattern(...children: T.SimplePattern[]): {
    $type: TSKindId.UnionPattern;
    $source: 2;
    $named: true;
    _simple_pattern: T.SimplePattern[] & readonly [T.SimplePattern, ...T.SimplePattern[]];
    simplePattern(): T.SimplePattern[] & readonly [T.SimplePattern, ...T.SimplePattern[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function unionType(config: T.UnionType.Config): {
    $type: TSKindId.UnionType;
    $source: 2;
    $named: true;
    _left: T.Type;
    _right: T.Type;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function whileStatement(config: T.WhileStatement.Config): {
    $type: TSKindId.WhileStatement;
    $source: 2;
    $named: true;
    _condition: T.Expression;
    _body: T.Suite;
    _alternative: T.ElseClause | undefined;
    condition(): T.Expression;
    body(): T.Suite;
    alternative(): T.ElseClause | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function withClauseBare(...children: T.WithItem[]): {
    $type: TSKindId._WithClauseBare;
    $source: 2;
    $named: true;
    _with_item: T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
    withItems(): T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function withClauseParen(...children: T.WithItem[]): {
    $type: TSKindId._WithClauseParen;
    $source: 2;
    $named: true;
    _with_item: T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
    withItems(): T.WithItem[] & readonly [T.WithItem, ...T.WithItem[]];
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function withClause(config: ConfigOf<T.WithClauseUFormBare>): ReturnType<typeof withClauseUFormBare>;
export declare function withClause(config: ConfigOf<T.WithClauseUFormParen>): ReturnType<typeof withClauseUFormParen>;
export declare function withClauseUFormBare(config: Omit<ConfigOf<T.WithClauseUFormBare>, '$variant'>): {
    $type: TSKindId.WithClause;
    $source: 2;
    $named: true;
    $variant: 'bare';
    _with_clause_bare: any;
    withClauseBare(): any;
    $with: {
        withClauseBare: (value: T._WithClauseBare) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function withClauseUFormParen(config: Omit<ConfigOf<T.WithClauseUFormParen>, '$variant'>): {
    $type: TSKindId.WithClause;
    $source: 2;
    $named: true;
    $variant: 'paren';
    _with_clause_paren: T._WithClauseParen;
    withClauseParen(): T._WithClauseParen;
    $with: {
        withClauseParen: (value: T._WithClauseParen) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function withItem(value: T.WithItem.Config['value']): {
    $type: TSKindId.WithItem;
    $source: 2;
    $named: true;
    _value: T.Expression;
    value(): T.Expression;
    $with: {
        value: (value: T.WithItem.Config['value']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function withStatement(config: T.WithStatement.Config): {
    $type: TSKindId.WithStatement;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _with_clause: T.WithClause;
    _body: T.Suite;
    asyncMarker(): true | undefined;
    withClause(): T.WithClause;
    body(): T.Suite;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof withStatement>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function yield_(child?: (T.Expression | T.Expressions)): {
    $type: TSKindId.Yield;
    $source: 2;
    $named: true;
    _expression: T.ExpressionList | T.Expression | undefined;
    expression(): T.ExpressionList | T.Expression | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function newline(text: string): {
    $type: TSKindId.Newline;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function indent(text: string): {
    $type: TSKindId.Indent;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function dedent(text: string): {
    $type: TSKindId.Dedent;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function stringStart(text: string): {
    $type: TSKindId.StringStart;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _stringContent(text: string): {
    $type: TSKindId._StringContent;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function escapeInterpolation(text: string): {
    $type: TSKindId.EscapeInterpolation;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function stringEnd(text: string): {
    $type: TSKindId.StringEnd;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function closeBracket(text: string): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function closeParen(text: string): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function closeBrace(text: string): {
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function except(text: string): {
    $type: TSKindId.Except;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export type FluentKindMap = {
    "_as_pattern": FluentNode<"_as_pattern", T._AsPattern.Config>;
    "_assignment_eq": T.AssignmentEq;
    "_assignment_type": T.AssignmentType;
    "_assignment_typed": T.AssignmentTyped;
    "_comprehension_clauses": FluentNode<"_comprehension_clauses", T.ComprehensionClauses.Config>;
    "_import_list": T.ImportList;
    "_is_not": T.IsNot;
    "_key_value_pattern": T.KeyValuePattern;
    "_list_pattern": FluentNode<"_list_pattern", T._ListPattern.Config>;
    "_match_block": FluentNode<"_match_block", T.MatchBlock.Config>;
    "_match_block_block": T.MatchBlockBlock;
    "_not_in": T.NotIn;
    "_simple_pattern_negative": FluentNode<"_simple_pattern_negative", T.SimplePatternNegative.Config>;
    "_simple_statements": FluentNode<"_simple_statements", T.SimpleStatements.Config>;
    "_tuple_pattern": FluentNode<"_tuple_pattern", T._TuplePattern.Config>;
    "_with_clause_paren": FluentNode<"_with_clause_paren", T._WithClauseParen.Config>;
    "aliased_import": FluentNode<"aliased_import", T.AliasedImport.Config>;
    "argument_list": FluentNode<"argument_list", T.ArgumentList.Config>;
    "as_pattern": FluentNode<"as_pattern", T.AsPattern.Config>;
    "assert_statement": FluentNode<"assert_statement", T.AssertStatement.Config>;
    "assignment": FluentNode<"assignment", T.Assignment.Config>;
    "attribute": FluentNode<"attribute", T.Attribute.Config>;
    "augmented_assignment": FluentNode<"augmented_assignment", T.AugmentedAssignment.Config>;
    "await": FluentNode<"await", T.Await.Config>;
    "binary_operator": FluentNode<"binary_operator", T.BinaryOperator.Config>;
    "block": FluentNode<"block", T.Block.Config>;
    "boolean_operator": FluentNode<"boolean_operator", T.BooleanOperator.Config>;
    "break_statement": T.BreakStatement;
    "call": FluentNode<"call", T.Call.Config>;
    "case_clause": FluentNode<"case_clause", T.CaseClause.Config>;
    "case_pattern": FluentNode<"case_pattern", T.CasePattern.Config>;
    "chevron": FluentNode<"chevron", T.Chevron.Config>;
    "class_definition": FluentNode<"class_definition", T.ClassDefinition.Config>;
    "class_pattern": FluentNode<"class_pattern", T.ClassPattern.Config>;
    "comment": T.Comment;
    "comparison_operator": FluentNode<"comparison_operator", T.ComparisonOperator.Config>;
    "complex_pattern": FluentNode<"complex_pattern", T.ComplexPattern.Config>;
    "concatenated_string": FluentNode<"concatenated_string", T.ConcatenatedString.Config>;
    "conditional_expression": FluentNode<"conditional_expression", T.ConditionalExpression.Config>;
    "constrained_type": FluentNode<"constrained_type", T.ConstrainedType.Config>;
    "continue_statement": T.ContinueStatement;
    "decorated_definition": FluentNode<"decorated_definition", T.DecoratedDefinition.Config>;
    "decorator": FluentNode<"decorator", T.Decorator.Config>;
    "default_parameter": FluentNode<"default_parameter", T.DefaultParameter.Config>;
    "delete_statement": FluentNode<"delete_statement", T.DeleteStatement.Config>;
    "dict_pattern": FluentNode<"dict_pattern", T.DictPattern.Config>;
    "dictionary": FluentNode<"dictionary", T.Dictionary.Config>;
    "dictionary_comprehension": FluentNode<"dictionary_comprehension", T.DictionaryComprehension.Config>;
    "dictionary_splat": FluentNode<"dictionary_splat", T.DictionarySplat.Config>;
    "dictionary_splat_pattern": FluentNode<"dictionary_splat_pattern", T.DictionarySplatPattern.Config>;
    "dotted_name": FluentNode<"dotted_name", T.DottedName.Config>;
    "elif_clause": FluentNode<"elif_clause", T.ElifClause.Config>;
    "else_clause": FluentNode<"else_clause", T.ElseClause.Config>;
    "escape_sequence": T.EscapeSequence;
    "except_clause": FluentNode<"except_clause", T.ExceptClause.Config>;
    "exec_statement": FluentNode<"exec_statement", T.ExecStatement.Config>;
    "expression_list": FluentNode<"expression_list", T.ExpressionList.Config>;
    "expression_statement_tuple": FluentNode<"expression_statement_tuple", T.ExpressionStatementTuple.Config>;
    "expression_statement": FluentNode<"expression_statement", T.ExpressionStatement.Config>;
    "false": T.False;
    "finally_clause": FluentNode<"finally_clause", T.FinallyClause.Config>;
    "float": T.Float;
    "for_in_clause": FluentNode<"for_in_clause", T.ForInClause.Config>;
    "for_statement": FluentNode<"for_statement", T.ForStatement.Config>;
    "format_specifier": FluentNode<"format_specifier", T.FormatSpecifier.Config>;
    "function_definition": FluentNode<"function_definition", T.FunctionDefinition.Config>;
    "future_import_statement": FluentNode<"future_import_statement", T.FutureImportStatement.Config>;
    "generator_expression": FluentNode<"generator_expression", T.GeneratorExpression.Config>;
    "generic_type": FluentNode<"generic_type", T.GenericType.Config>;
    "global_statement": FluentNode<"global_statement", T.GlobalStatement.Config>;
    "identifier": T.Identifier;
    "if_clause": FluentNode<"if_clause", T.IfClause.Config>;
    "if_statement": FluentNode<"if_statement", T.IfStatement.Config>;
    "import_from_statement": FluentNode<"import_from_statement", T.ImportFromStatement.Config>;
    "import_prefix": T.ImportPrefix;
    "import_statement": FluentNode<"import_statement", T.ImportStatement.Config>;
    "integer": T.Integer;
    "interpolation": FluentNode<"interpolation", T.Interpolation.Config>;
    "keyword_argument": FluentNode<"keyword_argument", T.KeywordArgument.Config>;
    "keyword_pattern": FluentNode<"keyword_pattern", T.KeywordPattern.Config>;
    "lambda": FluentNode<"lambda", T.Lambda.Config>;
    "lambda_parameters": FluentNode<"lambda_parameters", T.LambdaParameters.Config>;
    "lambda_within_for_in_clause": FluentNode<"lambda_within_for_in_clause", T.LambdaWithinForInClause.Config>;
    "line_continuation": T.LineContinuation;
    "list": FluentNode<"list", T.List.Config>;
    "list_comprehension": FluentNode<"list_comprehension", T.ListComprehension.Config>;
    "list_pattern": FluentNode<"list_pattern", T.ListPattern.Config>;
    "list_splat": FluentNode<"list_splat", T.ListSplat.Config>;
    "list_splat_pattern": FluentNode<"list_splat_pattern", T.ListSplatPattern.Config>;
    "match_statement": FluentNode<"match_statement", T.MatchStatement.Config>;
    "member_type": FluentNode<"member_type", T.MemberType.Config>;
    "module": FluentNode<"module", T.Module.Config>;
    "named_expression": FluentNode<"named_expression", T.NamedExpression.Config>;
    "none": T.None;
    "nonlocal_statement": FluentNode<"nonlocal_statement", T.NonlocalStatement.Config>;
    "not_operator": FluentNode<"not_operator", T.NotOperator.Config>;
    "pair": FluentNode<"pair", T.Pair.Config>;
    "parameters": FluentNode<"parameters", T.Parameters.Config>;
    "parenthesized_expression": FluentNode<"parenthesized_expression", T.ParenthesizedExpression.Config>;
    "parenthesized_list_splat": FluentNode<"parenthesized_list_splat", T.ParenthesizedListSplat.Config>;
    "pass_statement": T.PassStatement;
    "pattern_list": FluentNode<"pattern_list", T.PatternList.Config>;
    "print_statement": FluentNode<"print_statement", T.PrintStatement.Config>;
    "raise_statement": FluentNode<"raise_statement", T.RaiseStatement.Config>;
    "relative_import": FluentNode<"relative_import", T.RelativeImport.Config>;
    "return_statement": FluentNode<"return_statement", T.ReturnStatement.Config>;
    "set": FluentNode<"set", T.Set.Config>;
    "set_comprehension": FluentNode<"set_comprehension", T.SetComprehension.Config>;
    "slice": FluentNode<"slice", T.Slice.Config>;
    "splat_pattern": FluentNode<"splat_pattern", T.SplatPattern.Config>;
    "splat_type": FluentNode<"splat_type", T.SplatType.Config>;
    "string": FluentNode<"string", T.String.Config>;
    "string_content": FluentNode<"string_content", T.StringContent.Config>;
    "subscript": FluentNode<"subscript", T.Subscript.Config>;
    "true": T.True;
    "try_statement": FluentNode<"try_statement", T.TryStatement.Config>;
    "tuple": FluentNode<"tuple", T.Tuple.Config>;
    "tuple_pattern": FluentNode<"tuple_pattern", T.TuplePattern.Config>;
    "type": FluentNode<"type", T.Type.Config>;
    "type_alias_statement": FluentNode<"type_alias_statement", T.TypeAliasStatement.Config>;
    "type_conversion": T.TypeConversion;
    "type_parameter": FluentNode<"type_parameter", T.TypeParameter.Config>;
    "typed_default_parameter": FluentNode<"typed_default_parameter", T.TypedDefaultParameter.Config>;
    "typed_parameter": FluentNode<"typed_parameter", T.TypedParameter.Config>;
    "unary_operator": FluentNode<"unary_operator", T.UnaryOperator.Config>;
    "union_pattern": FluentNode<"union_pattern", T.UnionPattern.Config>;
    "union_type": FluentNode<"union_type", T.UnionType.Config>;
    "while_statement": FluentNode<"while_statement", T.WhileStatement.Config>;
    "with_clause_bare": FluentNode<"with_clause_bare", T.WithClauseBare.Config>;
    "with_clause_paren": FluentNode<"with_clause_paren", T.WithClauseParen.Config>;
    "with_clause": FluentNode<"with_clause", T.WithClause.Config>;
    "with_item": FluentNode<"with_item", T.WithItem.Config>;
    "with_statement": FluentNode<"with_statement", T.WithStatement.Config>;
    "yield": FluentNode<"yield", T.Yield.Config>;
    "_newline": T.Newline;
    "_indent": T.Indent;
    "_dedent": T.Dedent;
    "string_start": T.StringStart;
    "_string_content": T._StringContent;
    "escape_interpolation": T.EscapeInterpolation;
    "string_end": T.StringEnd;
    "]": T.CloseBracket;
    ")": T.CloseParen;
    "}": T.CloseBrace;
    "except": T.Except;
};
export declare const _factoryMap: {
    readonly "_as_pattern": typeof _asPattern;
    readonly "_assignment_eq": typeof _assignmentEq;
    readonly "_assignment_type": typeof _assignmentType;
    readonly "_assignment_typed": typeof _assignmentTyped;
    readonly "_comprehension_clauses": typeof comprehensionClauses;
    readonly "_import_list": typeof _importList;
    readonly "_is_not": typeof isNot;
    readonly "_key_value_pattern": typeof _keyValuePattern;
    readonly "_list_pattern": typeof _listPattern;
    readonly "_match_block": typeof matchBlock;
    readonly "_match_block_block": typeof _matchBlockBlock;
    readonly "_not_in": typeof notIn;
    readonly "_simple_pattern_negative": typeof simplePatternNegative;
    readonly "_simple_statements": typeof simpleStatements;
    readonly "_tuple_pattern": typeof _tuplePattern;
    readonly "_with_clause_paren": typeof _withClauseParen;
    readonly "aliased_import": typeof aliasedImport;
    readonly "argument_list": typeof argumentList;
    readonly "as_pattern": typeof asPattern;
    readonly "assert_statement": typeof assertStatement;
    readonly "assignment": typeof assignment;
    readonly "attribute": typeof attribute;
    readonly "augmented_assignment": typeof augmentedAssignment;
    readonly "await": typeof await_;
    readonly "binary_operator": typeof binaryOperator;
    readonly "block": typeof block;
    readonly "boolean_operator": typeof booleanOperator;
    readonly "break_statement": typeof breakStatement;
    readonly "call": typeof call;
    readonly "case_clause": typeof caseClause;
    readonly "case_pattern": typeof casePattern;
    readonly "chevron": typeof chevron;
    readonly "class_definition": typeof classDefinition;
    readonly "class_pattern": typeof classPattern;
    readonly "comment": typeof comment;
    readonly "comparison_operator": typeof comparisonOperator;
    readonly "complex_pattern": typeof complexPattern;
    readonly "concatenated_string": typeof concatenatedString;
    readonly "conditional_expression": typeof conditionalExpression;
    readonly "constrained_type": typeof constrainedType;
    readonly "continue_statement": typeof continueStatement;
    readonly "decorated_definition": typeof decoratedDefinition;
    readonly "decorator": typeof decorator;
    readonly "default_parameter": typeof defaultParameter;
    readonly "delete_statement": typeof deleteStatement;
    readonly "dict_pattern": typeof dictPattern;
    readonly "dictionary": typeof dictionary;
    readonly "dictionary_comprehension": typeof dictionaryComprehension;
    readonly "dictionary_splat": typeof dictionarySplat;
    readonly "dictionary_splat_pattern": typeof dictionarySplatPattern;
    readonly "dotted_name": typeof dottedName;
    readonly "elif_clause": typeof elifClause;
    readonly "else_clause": typeof elseClause;
    readonly "escape_sequence": typeof escapeSequence;
    readonly "except_clause": typeof exceptClause;
    readonly "exec_statement": typeof execStatement;
    readonly "expression_list": typeof expressionList;
    readonly "expression_statement_tuple": typeof expressionStatementTuple;
    readonly "expression_statement": typeof expressionStatement;
    readonly "false": typeof false_;
    readonly "finally_clause": typeof finallyClause;
    readonly "float": typeof float;
    readonly "for_in_clause": typeof forInClause;
    readonly "for_statement": typeof forStatement;
    readonly "format_specifier": typeof formatSpecifier;
    readonly "function_definition": typeof functionDefinition;
    readonly "future_import_statement": typeof futureImportStatement;
    readonly "generator_expression": typeof generatorExpression;
    readonly "generic_type": typeof genericType;
    readonly "global_statement": typeof globalStatement;
    readonly "identifier": typeof identifier;
    readonly "if_clause": typeof ifClause;
    readonly "if_statement": typeof ifStatement;
    readonly "import_from_statement": typeof importFromStatement;
    readonly "import_prefix": typeof importPrefix;
    readonly "import_statement": typeof importStatement;
    readonly "integer": typeof integer;
    readonly "interpolation": typeof interpolation;
    readonly "keyword_argument": typeof keywordArgument;
    readonly "keyword_pattern": typeof keywordPattern;
    readonly "lambda": typeof lambda;
    readonly "lambda_parameters": typeof lambdaParameters;
    readonly "lambda_within_for_in_clause": typeof lambdaWithinForInClause;
    readonly "line_continuation": typeof lineContinuation;
    readonly "list": typeof list;
    readonly "list_comprehension": typeof listComprehension;
    readonly "list_pattern": typeof listPattern;
    readonly "list_splat": typeof listSplat;
    readonly "list_splat_pattern": typeof listSplatPattern;
    readonly "match_statement": typeof matchStatement;
    readonly "member_type": typeof memberType;
    readonly "module": typeof module;
    readonly "named_expression": typeof namedExpression;
    readonly "none": typeof none;
    readonly "nonlocal_statement": typeof nonlocalStatement;
    readonly "not_operator": typeof notOperator;
    readonly "pair": typeof pair;
    readonly "parameters": typeof parameters;
    readonly "parenthesized_expression": typeof parenthesizedExpression;
    readonly "parenthesized_list_splat": typeof parenthesizedListSplat;
    readonly "pass_statement": typeof passStatement;
    readonly "pattern_list": typeof patternList;
    readonly "print_statement": typeof printStatement;
    readonly "raise_statement": typeof raiseStatement;
    readonly "relative_import": typeof relativeImport;
    readonly "return_statement": typeof returnStatement;
    readonly "set": typeof set;
    readonly "set_comprehension": typeof setComprehension;
    readonly "slice": typeof slice;
    readonly "splat_pattern": typeof splatPattern;
    readonly "splat_type": typeof splatType;
    readonly "string": typeof string;
    readonly "string_content": typeof stringContent;
    readonly "subscript": typeof subscript;
    readonly "true": typeof true_;
    readonly "try_statement": typeof tryStatement;
    readonly "tuple": typeof tuple;
    readonly "tuple_pattern": typeof tuplePattern;
    readonly "type": typeof type;
    readonly "type_alias_statement": typeof typeAliasStatement;
    readonly "type_conversion": typeof typeConversion;
    readonly "type_parameter": typeof typeParameter;
    readonly "typed_default_parameter": typeof typedDefaultParameter;
    readonly "typed_parameter": typeof typedParameter;
    readonly "unary_operator": typeof unaryOperator;
    readonly "union_pattern": typeof unionPattern;
    readonly "union_type": typeof unionType;
    readonly "while_statement": typeof whileStatement;
    readonly "with_clause_bare": typeof withClauseBare;
    readonly "with_clause_paren": typeof withClauseParen;
    readonly "with_clause": typeof withClause;
    readonly "with_item": typeof withItem;
    readonly "with_statement": typeof withStatement;
    readonly "yield": typeof yield_;
    readonly "_newline": typeof newline;
    readonly "_indent": typeof indent;
    readonly "_dedent": typeof dedent;
    readonly "string_start": typeof stringStart;
    readonly "_string_content": typeof _stringContent;
    readonly "escape_interpolation": typeof escapeInterpolation;
    readonly "string_end": typeof stringEnd;
    readonly "]": typeof closeBracket;
    readonly ")": typeof closeParen;
    readonly "}": typeof closeBrace;
    readonly "except": typeof except;
};
export type _FactoryMap = typeof _factoryMap;
//# sourceMappingURL=factories.d.ts.map