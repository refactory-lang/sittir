import type { TreeHandle } from '@sittir/core';
import type { AnyNodeData as _NodeData, AnyNodeData } from '@sittir/types';
import { TSKindId } from './types.js';
import type * as T from './types.js';
export declare function wrap_ClosureExpressionExpr(data: T._ClosureExpressionExpr, tree: TreeHandle): {
    $type: TSKindId._ClosureExpressionExpr;
    _body: "_" | T.Expression;
    body(): "_" | T.Expression;
    $with: {
        body: (v: T.Expression | "_") => /*elided*/ any & {
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
export declare function wrap_DelimTokenTreeBrace(data: T._DelimTokenTreeBrace, tree: TreeHandle): {
    $type: TSKindId._DelimTokenTreeBrace;
    $children: readonly T.DelimTokens[];
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
export declare function wrap_DelimTokenTreeBracket(data: T._DelimTokenTreeBracket, tree: TreeHandle): {
    $type: TSKindId._DelimTokenTreeBracket;
    $children: readonly T.DelimTokens[];
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
export declare function wrap_DelimTokenTreeParen(data: T._DelimTokenTreeParen, tree: TreeHandle): {
    $type: TSKindId._DelimTokenTreeParen;
    $children: readonly T.DelimTokens[];
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
export declare function wrap_ExpressionStatementBlockEnding(data: T._ExpressionStatementBlockEnding, tree: TreeHandle): {
    $type: TSKindId._ExpressionStatementBlockEnding;
    $children: readonly [T.ExpressionEndingWithBlock];
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
export declare function wrap_ExpressionStatementWithSemi(data: T._ExpressionStatementWithSemi, tree: TreeHandle): {
    $type: TSKindId._ExpressionStatementWithSemi;
    $children: readonly [T.Expression];
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
export declare function wrapFieldIdentifier(data: T.FieldIdentifier, tree: TreeHandle): {
    $type: TSKindId.FieldIdentifier;
    $children: readonly [T.Identifier];
    $with: {
        $child: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrap_FieldPatternShorthand(data: T._FieldPatternShorthand, tree: TreeHandle): {
    $type: TSKindId._FieldPatternShorthand;
    _name: T.Identifier;
    name(): T.Identifier;
    $with: {
        name: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrap_ForeignModItemBody(data: T._ForeignModItemBody, tree: TreeHandle): {
    $type: TSKindId._ForeignModItemBody;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (v: T.DeclarationList) => /*elided*/ any & {
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
export declare function wrapFunctionTypeFnForm(data: T.FunctionTypeFnForm, tree: TreeHandle): {
    $type: TSKindId.FunctionTypeFnForm;
    $children: readonly [T.FunctionModifiers];
    $with: {
        $child: (v: T.FunctionModifiers) => /*elided*/ any & {
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
export declare function wrapFunctionTypeTraitForm(data: T.FunctionTypeTraitForm, tree: TreeHandle): {
    $type: TSKindId.FunctionTypeTraitForm;
    _trait: T.ScopedTypeIdentifier | T.TypeIdentifier;
    trait(): T.ScopedTypeIdentifier | T.TypeIdentifier;
    $with: {
        trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier) => /*elided*/ any & {
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
export declare function wrap_ImplItemBody(data: T._ImplItemBody, tree: TreeHandle): {
    $type: TSKindId._ImplItemBody;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (v: T.DeclarationList) => /*elided*/ any & {
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
export declare function wrapLetChain(data: T.LetChain, tree: TreeHandle): {
    $type: TSKindId.LetChain;
    $children: readonly [T.LetChain | T.LetCondition | T.Expression];
    $with: {
        $child: (v: (T.LetChain | T.LetCondition | T.Expression)) => /*elided*/ any & {
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
export declare function wrap_MacroDefinitionBrace(data: T._MacroDefinitionBrace, tree: TreeHandle): {
    $type: TSKindId._MacroDefinitionBrace;
    $children: readonly T.MacroRule[];
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
export declare function wrap_MacroDefinitionBracket(data: T._MacroDefinitionBracket, tree: TreeHandle): {
    $type: TSKindId._MacroDefinitionBracket;
    $children: readonly T.MacroRule[];
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
export declare function wrap_MacroDefinitionParen(data: T._MacroDefinitionParen, tree: TreeHandle): {
    $type: TSKindId._MacroDefinitionParen;
    $children: readonly T.MacroRule[];
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
export declare function wrap_MatchArmBlockEnding(data: T._MatchArmBlockEnding, tree: TreeHandle): {
    $type: TSKindId._MatchArmBlockEnding;
    _value: T.ExpressionEndingWithBlock;
    value(): T.ExpressionEndingWithBlock;
    $with: {
        value: (v: T.ExpressionEndingWithBlock) => /*elided*/ any & {
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
export declare function wrap_ModItemInline(data: T._ModItemInline, tree: TreeHandle): {
    $type: TSKindId._ModItemInline;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (v: T.DeclarationList) => /*elided*/ any & {
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
export declare function wrap_PointerTypeMut(data: T._PointerTypeMut, tree: TreeHandle): {
    $type: TSKindId._PointerTypeMut;
    $children: readonly [T.MutableSpecifier];
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
export declare function wrap_RangeExpressionBare(data: T._RangeExpressionBare, tree: TreeHandle): {
    $type: TSKindId._RangeExpressionBare;
    _operator: import("@sittir/types").AutoStamp<T.Operator>;
    operator(): T.Operator;
    $with: {
        operator: (v: T.Operator) => /*elided*/ any & {
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
export declare function wrapReferenceExpressionRawMut(data: T.ReferenceExpressionRawMut, tree: TreeHandle): {
    $type: TSKindId.ReferenceExpressionRawMut;
    $children: readonly [T.MutableSpecifier];
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
export declare function wrap_TokenTreeBrace(data: T._TokenTreeBrace, tree: TreeHandle): {
    $type: TSKindId._TokenTreeBrace;
    $children: readonly T.Tokens[];
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
export declare function wrap_TokenTreeBracket(data: T._TokenTreeBracket, tree: TreeHandle): {
    $type: TSKindId._TokenTreeBracket;
    $children: readonly T.Tokens[];
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
export declare function wrap_TokenTreeParen(data: T._TokenTreeParen, tree: TreeHandle): {
    $type: TSKindId._TokenTreeParen;
    $children: readonly T.Tokens[];
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
export declare function wrap_TokenTreePatternBrace(data: T._TokenTreePatternBrace, tree: TreeHandle): {
    $type: TSKindId._TokenTreePatternBrace;
    $children: readonly T.TokenPattern[];
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
export declare function wrap_TokenTreePatternBracket(data: T._TokenTreePatternBracket, tree: TreeHandle): {
    $type: TSKindId._TokenTreePatternBracket;
    $children: readonly T.TokenPattern[];
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
export declare function wrap_TokenTreePatternParen(data: T._TokenTreePatternParen, tree: TreeHandle): {
    $type: TSKindId._TokenTreePatternParen;
    $children: readonly T.TokenPattern[];
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
export declare function wrapTypeIdentifier(data: T.TypeIdentifier, tree: TreeHandle): {
    $type: TSKindId.TypeIdentifier;
    $children: readonly [T.Identifier];
    $with: {
        $child: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrap_VisibilityModifierCrate(data: T._VisibilityModifierCrate, tree: TreeHandle): {
    $type: TSKindId._VisibilityModifierCrate;
    $children: readonly [T.Crate];
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
export declare function wrapAbstractType(data: T.AbstractType, tree: TreeHandle): {
    $type: TSKindId.AbstractType;
    _type_parameters: T.TypeParameters | undefined;
    _trait: T.BoundedType | T.FunctionType | T.GenericType | T.RemovedTraitBound | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    trait(): T.BoundedType | T.FunctionType | T.GenericType | T.RemovedTraitBound | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier;
    $with: {
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.RemovedTraitBound | T.GenericType | T.FunctionType | T.TupleType | T.BoundedType) => /*elided*/ any & {
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
export declare function wrapArguments(data: T.Arguments, tree: TreeHandle): {
    $type: TSKindId.Arguments;
    _attributes: readonly (T.AttributeItem | T.Expression)[];
    attributes(): (T.AttributeItem | T.Expression)[];
    $with: {
        attributes: (...v: (T.AttributeItem | T.Expression)[]) => /*elided*/ any & {
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
export declare function wrapArrayExpression(data: T.ArrayExpression, tree: TreeHandle): ({
    $variant: 'list';
    $type: TSKindId.ArrayExpression;
    $children: any;
    $with: {
        children: (items_0: T.ArrayExpressionList | T.ArrayExpressionSemi) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ArrayExpression;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'semi';
    $type: TSKindId.ArrayExpression;
    $children: any;
    $with: {
        children: (items_0: T.ArrayExpressionList | T.ArrayExpressionSemi) => (any | {
            $variant: 'semi';
            $type: TSKindId.ArrayExpression;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapArrayType(data: T.ArrayType, tree: TreeHandle): {
    $type: TSKindId.ArrayType;
    _element: T._Type;
    _length: T.Expression | undefined;
    element(): T._Type;
    length(): T.Expression | undefined;
    $with: {
        element: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        length: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapAssignmentExpression(data: T.AssignmentExpression, tree: TreeHandle): {
    $type: TSKindId.AssignmentExpression;
    _left: T.Expression;
    _right: T.Expression;
    left(): T.Expression;
    right(): T.Expression;
    $with: {
        left: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapAssociatedType(data: T.AssociatedType, tree: TreeHandle): {
    $type: TSKindId.AssociatedType;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _bounds: T.TraitBounds | undefined;
    _where_clause: T.WhereClause | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    bounds(): T.TraitBounds | undefined;
    whereClause(): T.WhereClause | undefined;
    $with: {
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        bounds: (v: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => /*elided*/ any & {
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
export declare function wrapAsyncBlock(data: T.AsyncBlock, tree: TreeHandle): {
    $type: TSKindId.AsyncBlock;
    _move_marker: import("@sittir/types").BooleanKeyword<T.MoveMarker> | undefined;
    _block: T.Block;
    moveMarker(): T.MoveMarker | undefined;
    block(): T.Block;
    $with: {
        moveMarker: (v: T.MoveMarker) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        block: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapAttribute(data: T.Attribute, tree: TreeHandle): {
    $type: TSKindId.Attribute;
    _path: T.Path;
    $children: readonly [T.DelimTokenTree | T.Expression];
    path(): T.Path;
    $with: {
        path: (v: T.Path) => /*elided*/ any & {
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
};
export declare function wrapAttributeItem(data: T.AttributeItem, tree: TreeHandle): {
    $type: TSKindId.AttributeItem;
    _attribute: T.Attribute;
    attribute(): T.Attribute;
    $with: {
        attribute: (v: T.Attribute) => /*elided*/ any & {
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
export declare function wrapAwaitExpression(data: T.AwaitExpression, tree: TreeHandle): {
    $type: TSKindId.AwaitExpression;
    $children: readonly [T.Expression];
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
export declare function wrapBaseFieldInitializer(data: T.BaseFieldInitializer, tree: TreeHandle): {
    $type: TSKindId.BaseFieldInitializer;
    $children: readonly [T.Expression];
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
export declare function wrapBinaryExpression(data: T.BinaryExpression, tree: TreeHandle): {
    $type: TSKindId.BinaryExpression;
    _left: T.Expression;
    _operator: import("@sittir/types").AutoStamp<T.BinaryExpressionOperator>;
    _right: T.Expression;
    left(): T.Expression;
    operator(): T.BinaryExpressionOperator;
    right(): T.Expression;
    $with: {
        left: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        operator: (v: T.BinaryExpressionOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapBlock(data: T.Block, tree: TreeHandle): {
    $type: TSKindId.Block;
    _label: T.Label | undefined;
    _trailing_expression: T.Expression | undefined;
    $children: readonly T.Statement[];
    label(): T.Label | undefined;
    trailingExpression(): T.Expression | undefined;
    $with: {
        label: (v: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        trailingExpression: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (...items: T.Statement[]) => /*elided*/ any & {
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
export declare function wrapBlockComment(data: T.BlockComment, tree: TreeHandle): {
    $type: TSKindId.BlockComment;
    _doc: T.BlockCommentContent | undefined;
    $children: readonly [T.InnerBlockDocCommentMarker | T.OuterBlockDocCommentMarker];
    doc(): T.BlockCommentContent | undefined;
    $with: {
        doc: (v: T.BlockCommentContent) => /*elided*/ any & {
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
};
export declare function wrapBoundedType(data: T.BoundedType, tree: TreeHandle): {
    $type: TSKindId.BoundedType;
    _left: T.Lifetime | T.UseBounds | T._Type;
    _right: T.Lifetime | T.UseBounds | T._Type;
    left(): T.Lifetime | T.UseBounds | T._Type;
    right(): T.Lifetime | T.UseBounds | T._Type;
    $with: {
        left: (v: T.Lifetime | T._Type | T.UseBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (v: T.Lifetime | T._Type | T.UseBounds) => /*elided*/ any & {
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
export declare function wrapBracketedType(data: T.BracketedType, tree: TreeHandle): {
    $type: TSKindId.BracketedType;
    $children: readonly [T.QualifiedType | T._Type];
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
export declare function wrapBreakExpression(data: T.BreakExpression, tree: TreeHandle): {
    $type: TSKindId.BreakExpression;
    _label: T.Label | undefined;
    $children: readonly [T.Expression];
    label(): T.Label | undefined;
    $with: {
        label: (v: T.Label) => /*elided*/ any & {
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
};
export declare function wrapCallExpression(data: T.CallExpression, tree: TreeHandle): {
    $type: TSKindId.CallExpression;
    _function: T.ExpressionExceptRange;
    _arguments: T.Arguments;
    function(): T.ExpressionExceptRange;
    arguments(): T.Arguments;
    $with: {
        function: (v: T.ExpressionExceptRange) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        arguments: (v: T.Arguments) => /*elided*/ any & {
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
export declare function wrapCapturedPattern(data: T.CapturedPattern, tree: TreeHandle): {
    $type: TSKindId.CapturedPattern;
    _identifier: T.Identifier;
    $children: readonly [T.Pattern];
    identifier(): T.Identifier;
    $with: {
        identifier: (v: T.Identifier) => /*elided*/ any & {
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
};
export declare function wrapClosureExpressionExpr(data: T.ClosureExpressionExpr, tree: TreeHandle): {
    $type: "closure_expression_expr";
    _body: "_" | T.Expression;
    body(): "_" | T.Expression;
    $with: {
        body: (v: T.Expression | "_") => /*elided*/ any & {
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
export declare function wrapClosureExpression(data: T.ClosureExpression, tree: TreeHandle): ({
    $variant: 'block';
    $type: TSKindId.ClosureExpression;
    _static_marker: any;
    _async_marker: any;
    _move_marker: any;
    _parameters: any;
    $children: any;
    staticMarker(): T.ClosureExpressionStaticMarker | undefined;
    asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
    moveMarker(): T.MoveMarker | undefined;
    parameters(): T.ClosureParameters;
    $with: {
        staticMarker: (v: T.ClosureExpressionStaticMarker) => (/*elided*/ any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: /*elided*/ any;
                asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                moveMarker: (v: T.MoveMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                parameters: (v: T.ClosureParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (/*elided*/ any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: (v: T.ClosureExpressionStaticMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                asyncMarker: /*elided*/ any;
                moveMarker: (v: T.MoveMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                parameters: (v: T.ClosureParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        moveMarker: (v: T.MoveMarker) => (/*elided*/ any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: (v: T.ClosureExpressionStaticMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                moveMarker: /*elided*/ any;
                parameters: (v: T.ClosureParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (v: T.ClosureParameters) => (/*elided*/ any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: (v: T.ClosureExpressionStaticMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                moveMarker: (v: T.MoveMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                parameters: /*elided*/ any;
                children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (/*elided*/ any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: (v: T.ClosureExpressionStaticMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                moveMarker: (v: T.MoveMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                parameters: (v: T.ClosureParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'expr';
    $type: TSKindId.ClosureExpression;
    _static_marker: any;
    _async_marker: any;
    _move_marker: any;
    _parameters: any;
    $children: any;
    staticMarker(): T.ClosureExpressionStaticMarker | undefined;
    asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
    moveMarker(): T.MoveMarker | undefined;
    parameters(): T.ClosureParameters;
    $with: {
        staticMarker: (v: T.ClosureExpressionStaticMarker) => (any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: any;
                asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                moveMarker: (v: T.MoveMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                parameters: (v: T.ClosureParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: (v: T.ClosureExpressionStaticMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                asyncMarker: any;
                moveMarker: (v: T.MoveMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                parameters: (v: T.ClosureParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        moveMarker: (v: T.MoveMarker) => (any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: (v: T.ClosureExpressionStaticMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                moveMarker: any;
                parameters: (v: T.ClosureParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (v: T.ClosureParameters) => (any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: (v: T.ClosureExpressionStaticMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                moveMarker: (v: T.MoveMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                parameters: any;
                children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.ClosureExpressionBlock | T._ClosureExpressionExpr) => (any | {
            $variant: 'expr';
            $type: TSKindId.ClosureExpression;
            _static_marker: any;
            _async_marker: any;
            _move_marker: any;
            _parameters: any;
            $children: any;
            staticMarker(): T.ClosureExpressionStaticMarker | undefined;
            asyncMarker(): T.ClosureExpressionAsyncMarker | undefined;
            moveMarker(): T.MoveMarker | undefined;
            parameters(): T.ClosureParameters;
            $with: {
                staticMarker: (v: T.ClosureExpressionStaticMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                asyncMarker: (v: T.ClosureExpressionAsyncMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                moveMarker: (v: T.MoveMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                parameters: (v: T.ClosureParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapClosureParameters(data: T.ClosureParameters, tree: TreeHandle): {
    $type: TSKindId.ClosureParameters;
    $children: readonly (T.Parameter | T.Pattern)[];
    $with: {
        $children: (...vs: ((T.Pattern | T.Parameter))[]) => /*elided*/ any & {
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
export declare function wrapCompoundAssignmentExpr(data: T.CompoundAssignmentExpr, tree: TreeHandle): {
    $type: TSKindId.CompoundAssignmentExpr;
    _left: T.Expression;
    _operator: T.CompoundAssignmentExprOperator;
    _right: T.Expression;
    left(): T.Expression;
    operator(): T.CompoundAssignmentExprOperator;
    right(): T.Expression;
    $with: {
        left: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        operator: (v: T.CompoundAssignmentExprOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapConstBlock(data: T.ConstBlock, tree: TreeHandle): {
    $type: TSKindId.ConstBlock;
    _body: T.Block;
    body(): T.Block;
    $with: {
        body: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapConstItem(data: T.ConstItem, tree: TreeHandle): {
    $type: TSKindId.ConstItem;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.Identifier;
    _type: T._Type;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.Identifier;
    typeField(): T._Type;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapConstParameter(data: T.ConstParameter, tree: TreeHandle): {
    $type: TSKindId.ConstParameter;
    _name: T.Identifier;
    _type: T._Type;
    _value: T.Block | T.Identifier | T.NegativeLiteral | T.Literal | undefined;
    name(): T.Identifier;
    typeField(): T._Type;
    value(): T.Block | T.Identifier | T.NegativeLiteral | T.Literal | undefined;
    $with: {
        name: (v: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Block | T.Identifier | T.Literal | T.NegativeLiteral) => /*elided*/ any & {
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
export declare function wrapContinueExpression(data: T.ContinueExpression, tree: TreeHandle): {
    $type: TSKindId.ContinueExpression;
    _label: T.Label | undefined;
    label(): T.Label | undefined;
    $with: {
        label: (v: T.Label) => /*elided*/ any & {
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
export declare function wrapDeclarationList(data: T.DeclarationList, tree: TreeHandle): {
    $type: TSKindId.DeclarationList;
    $children: readonly T.DeclarationStatement[];
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
export declare function wrapDelimTokenTreeParen(data: T.DelimTokenTreeParen, tree: TreeHandle): {
    $type: "delim_token_tree_paren";
    $children: readonly T.DelimTokens[];
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
export declare function wrapDelimTokenTreeBracket(data: T.DelimTokenTreeBracket, tree: TreeHandle): {
    $type: "delim_token_tree_bracket";
    $children: readonly T.DelimTokens[];
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
export declare function wrapDelimTokenTreeBrace(data: T.DelimTokenTreeBrace, tree: TreeHandle): {
    $type: "delim_token_tree_brace";
    $children: readonly T.DelimTokens[];
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
export declare function wrapDelimTokenTree(data: T.DelimTokenTree, tree: TreeHandle): ({
    $variant: 'brace';
    $type: TSKindId.DelimTokenTree;
    $children: any;
    $with: {
        children: (items_0: T._DelimTokenTreeBrace | T._DelimTokenTreeBracket | T._DelimTokenTreeParen) => (/*elided*/ any | {
            $variant: 'bracket';
            $type: TSKindId.DelimTokenTree;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.DelimTokenTree;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'bracket';
    $type: TSKindId.DelimTokenTree;
    $children: any;
    $with: {
        children: (items_0: T._DelimTokenTreeBrace | T._DelimTokenTreeBracket | T._DelimTokenTreeParen) => (any | {
            $variant: 'bracket';
            $type: TSKindId.DelimTokenTree;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.DelimTokenTree;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'paren';
    $type: TSKindId.DelimTokenTree;
    $children: any;
    $with: {
        children: (items_0: T._DelimTokenTreeBrace | T._DelimTokenTreeBracket | T._DelimTokenTreeParen) => (any | {
            $variant: 'bracket';
            $type: TSKindId.DelimTokenTree;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.DelimTokenTree;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapDynamicType(data: T.DynamicType, tree: TreeHandle): {
    $type: TSKindId.DynamicType;
    _trait: T.FunctionType | T.GenericType | T.HigherRankedTraitBound | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier;
    trait(): T.FunctionType | T.GenericType | T.HigherRankedTraitBound | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier;
    $with: {
        trait: (v: T.HigherRankedTraitBound | T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType | T.FunctionType | T.TupleType) => /*elided*/ any & {
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
export declare function wrapElseClause(data: T.ElseClause, tree: TreeHandle): {
    $type: TSKindId.ElseClause;
    $children: readonly [T.Block | T.IfExpression];
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
export declare function wrapEnumItem(data: T.EnumItem, tree: TreeHandle): {
    $type: TSKindId.EnumItem;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _where_clause: T.WhereClause | undefined;
    _body: T.EnumVariantList;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    whereClause(): T.WhereClause | undefined;
    body(): T.EnumVariantList;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.EnumVariantList) => /*elided*/ any & {
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
export declare function wrapEnumVariant(data: T.EnumVariant, tree: TreeHandle): {
    $type: TSKindId.EnumVariant;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.Identifier;
    _body: T.FieldDeclarationList | T.OrderedFieldDeclarationList | undefined;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.Identifier;
    body(): T.FieldDeclarationList | T.OrderedFieldDeclarationList | undefined;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.FieldDeclarationList | T.OrderedFieldDeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapEnumVariantList(data: T.EnumVariantList, tree: TreeHandle): {
    $type: TSKindId.EnumVariantList;
    $children: readonly (T.AttributeItem | T.EnumVariant)[];
    $with: {
        $children: (...vs: ((T.AttributeItem | T.EnumVariant))[]) => /*elided*/ any & {
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
export declare function wrapExpressionStatementWithSemi(data: T.ExpressionStatementWithSemi, tree: TreeHandle): {
    $type: "expression_statement_with_semi";
    $children: readonly [T.Expression];
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
export declare function wrapExpressionStatementBlockEnding(data: T.ExpressionStatementBlockEnding, tree: TreeHandle): {
    $type: "expression_statement_block_ending";
    $children: readonly [T.ExpressionEndingWithBlock];
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
export declare function wrapExpressionStatement(data: T.ExpressionStatement, tree: TreeHandle): ({
    $variant: 'block_ending';
    $type: TSKindId.ExpressionStatement;
    $children: any;
    $with: {
        children: (items_0: T._ExpressionStatementBlockEnding | T._ExpressionStatementWithSemi) => (/*elided*/ any | {
            $variant: 'with_semi';
            $type: TSKindId.ExpressionStatement;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'with_semi';
    $type: TSKindId.ExpressionStatement;
    $children: any;
    $with: {
        children: (items_0: T._ExpressionStatementBlockEnding | T._ExpressionStatementWithSemi) => (any | {
            $variant: 'with_semi';
            $type: TSKindId.ExpressionStatement;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapExternCrateDeclaration(data: T.ExternCrateDeclaration, tree: TreeHandle): {
    $type: TSKindId.ExternCrateDeclaration;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _crate: import("@sittir/types").AutoStamp<T._Crate>;
    _name: T.Identifier;
    _alias: T.Identifier | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    crate(): T._Crate;
    name(): T.Identifier;
    alias(): T.Identifier | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        crate: (v: T._Crate) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        alias: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrapExternModifier(data: T.ExternModifier, tree: TreeHandle): {
    $type: TSKindId.ExternModifier;
    _string_literal: T.StringLiteral | undefined;
    stringLiteral(): T.StringLiteral | undefined;
    $with: {
        stringLiteral: (v: T.StringLiteral) => /*elided*/ any & {
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
export declare function wrapFieldDeclaration(data: T.FieldDeclaration, tree: TreeHandle): {
    $type: TSKindId.FieldDeclaration;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.FieldIdentifier;
    _type: T._Type;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.FieldIdentifier;
    typeField(): T._Type;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.FieldIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
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
export declare function wrapFieldDeclarationList(data: T.FieldDeclarationList, tree: TreeHandle): {
    $type: TSKindId.FieldDeclarationList;
    $children: readonly (T.AttributeItem | T.FieldDeclaration)[];
    $with: {
        $children: (...vs: ((T.AttributeItem | T.FieldDeclaration))[]) => /*elided*/ any & {
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
export declare function wrapFieldExpression(data: T.FieldExpression, tree: TreeHandle): {
    $type: TSKindId.FieldExpression;
    _value: T.Expression;
    _field: T.FieldIdentifier | T.IntegerLiteral;
    value(): T.Expression;
    field(): T.FieldIdentifier | T.IntegerLiteral;
    $with: {
        value: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        field: (v: T.FieldIdentifier | T.IntegerLiteral) => /*elided*/ any & {
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
export declare function wrapFieldInitializer(data: T.FieldInitializer, tree: TreeHandle): {
    $type: TSKindId.FieldInitializer;
    _field: T.FieldIdentifier | T.IntegerLiteral;
    _value: T.Expression;
    $children: readonly T.AttributeItem[];
    field(): T.FieldIdentifier | T.IntegerLiteral;
    value(): T.Expression;
    $with: {
        field: (v: T.FieldIdentifier | T.IntegerLiteral) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Expression) => /*elided*/ any & {
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
};
export declare function wrapFieldInitializerList(data: T.FieldInitializerList, tree: TreeHandle): {
    $type: TSKindId.FieldInitializerList;
    $children: readonly (T.BaseFieldInitializer | T.FieldInitializer | T.ShorthandFieldInitializer)[];
    $with: {
        $children: (...vs: ((T.ShorthandFieldInitializer | T.FieldInitializer | T.BaseFieldInitializer))[]) => /*elided*/ any & {
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
export declare function wrapFieldPatternShorthand(data: T.FieldPatternShorthand, tree: TreeHandle): {
    $type: "field_pattern_shorthand";
    _name: T.Identifier;
    name(): T.Identifier;
    $with: {
        name: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrapFieldPattern(data: T.FieldPattern, tree: TreeHandle): ({
    $variant: 'named';
    $type: TSKindId.FieldPattern;
    _ref_marker: any;
    _mutable_specifier: any;
    $children: any;
    refMarker(): T.RefMarker | undefined;
    mutableSpecifier(): T._MutableSpecifier | undefined;
    $with: {
        refMarker: (v: T.RefMarker) => (/*elided*/ any | {
            $variant: 'shorthand';
            $type: TSKindId.FieldPattern;
            _ref_marker: any;
            _mutable_specifier: any;
            $children: any;
            refMarker(): T.RefMarker | undefined;
            mutableSpecifier(): T._MutableSpecifier | undefined;
            $with: {
                refMarker: /*elided*/ any;
                mutableSpecifier: (v: T._MutableSpecifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.FieldPatternNamed | T._FieldPatternShorthand) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (v: T._MutableSpecifier) => (/*elided*/ any | {
            $variant: 'shorthand';
            $type: TSKindId.FieldPattern;
            _ref_marker: any;
            _mutable_specifier: any;
            $children: any;
            refMarker(): T.RefMarker | undefined;
            mutableSpecifier(): T._MutableSpecifier | undefined;
            $with: {
                refMarker: (v: T.RefMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                mutableSpecifier: /*elided*/ any;
                children: (items_0: T.FieldPatternNamed | T._FieldPatternShorthand) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.FieldPatternNamed | T._FieldPatternShorthand) => (/*elided*/ any | {
            $variant: 'shorthand';
            $type: TSKindId.FieldPattern;
            _ref_marker: any;
            _mutable_specifier: any;
            $children: any;
            refMarker(): T.RefMarker | undefined;
            mutableSpecifier(): T._MutableSpecifier | undefined;
            $with: {
                refMarker: (v: T.RefMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                mutableSpecifier: (v: T._MutableSpecifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'shorthand';
    $type: TSKindId.FieldPattern;
    _ref_marker: any;
    _mutable_specifier: any;
    $children: any;
    refMarker(): T.RefMarker | undefined;
    mutableSpecifier(): T._MutableSpecifier | undefined;
    $with: {
        refMarker: (v: T.RefMarker) => (any | {
            $variant: 'shorthand';
            $type: TSKindId.FieldPattern;
            _ref_marker: any;
            _mutable_specifier: any;
            $children: any;
            refMarker(): T.RefMarker | undefined;
            mutableSpecifier(): T._MutableSpecifier | undefined;
            $with: {
                refMarker: any;
                mutableSpecifier: (v: T._MutableSpecifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.FieldPatternNamed | T._FieldPatternShorthand) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (v: T._MutableSpecifier) => (any | {
            $variant: 'shorthand';
            $type: TSKindId.FieldPattern;
            _ref_marker: any;
            _mutable_specifier: any;
            $children: any;
            refMarker(): T.RefMarker | undefined;
            mutableSpecifier(): T._MutableSpecifier | undefined;
            $with: {
                refMarker: (v: T.RefMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                mutableSpecifier: any;
                children: (items_0: T.FieldPatternNamed | T._FieldPatternShorthand) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.FieldPatternNamed | T._FieldPatternShorthand) => (any | {
            $variant: 'shorthand';
            $type: TSKindId.FieldPattern;
            _ref_marker: any;
            _mutable_specifier: any;
            $children: any;
            refMarker(): T.RefMarker | undefined;
            mutableSpecifier(): T._MutableSpecifier | undefined;
            $with: {
                refMarker: (v: T.RefMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                mutableSpecifier: (v: T._MutableSpecifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapForExpression(data: T.ForExpression, tree: TreeHandle): {
    $type: TSKindId.ForExpression;
    _label: T.Label | undefined;
    _pattern: T.Pattern;
    _value: T.Expression;
    _body: T.Block;
    label(): T.Label | undefined;
    pattern(): T.Pattern;
    value(): T.Expression;
    body(): T.Block;
    $with: {
        label: (v: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (v: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapForLifetimes(data: T.ForLifetimes, tree: TreeHandle): {
    $type: TSKindId.ForLifetimes;
    $children: readonly [T.Lifetime, ...T.Lifetime[]];
    $with: {
        $children: (vs_0: T.Lifetime, ...vs: T.Lifetime[]) => /*elided*/ any & {
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
export declare function wrapForeignModItemBody(data: T.ForeignModItemBody, tree: TreeHandle): {
    $type: "foreign_mod_item_body";
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (v: T.DeclarationList) => /*elided*/ any & {
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
export declare function wrapForeignModItem(data: T.ForeignModItem, tree: TreeHandle): ({
    $variant: 'body';
    $type: TSKindId.ForeignModItem;
    _visibility_modifier: any;
    _extern_modifier: any;
    $children: any;
    visibilityModifier(): T.VisibilityModifier | undefined;
    externModifier(): T.ExternModifier;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ForeignModItem;
            _visibility_modifier: any;
            _extern_modifier: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            externModifier(): T.ExternModifier;
            $with: {
                visibilityModifier: /*elided*/ any;
                externModifier: (v: T.ExternModifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ForeignModItemBody) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        externModifier: (v: T.ExternModifier) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ForeignModItem;
            _visibility_modifier: any;
            _extern_modifier: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            externModifier(): T.ExternModifier;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                externModifier: /*elided*/ any;
                children: (items_0: ";" | T._ForeignModItemBody) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T._ForeignModItemBody) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ForeignModItem;
            _visibility_modifier: any;
            _extern_modifier: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            externModifier(): T.ExternModifier;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                externModifier: (v: T.ExternModifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'semi';
    $type: TSKindId.ForeignModItem;
    _visibility_modifier: any;
    _extern_modifier: any;
    $children: any;
    visibilityModifier(): T.VisibilityModifier | undefined;
    externModifier(): T.ExternModifier;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => (any | {
            $variant: 'semi';
            $type: TSKindId.ForeignModItem;
            _visibility_modifier: any;
            _extern_modifier: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            externModifier(): T.ExternModifier;
            $with: {
                visibilityModifier: any;
                externModifier: (v: T.ExternModifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ForeignModItemBody) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        externModifier: (v: T.ExternModifier) => (any | {
            $variant: 'semi';
            $type: TSKindId.ForeignModItem;
            _visibility_modifier: any;
            _extern_modifier: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            externModifier(): T.ExternModifier;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                externModifier: any;
                children: (items_0: ";" | T._ForeignModItemBody) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T._ForeignModItemBody) => (any | {
            $variant: 'semi';
            $type: TSKindId.ForeignModItem;
            _visibility_modifier: any;
            _extern_modifier: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            externModifier(): T.ExternModifier;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                externModifier: (v: T.ExternModifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapFunctionItem(data: T.FunctionItem, tree: TreeHandle): {
    $type: TSKindId.FunctionItem;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _function_modifiers: T.FunctionModifiers | undefined;
    _name: T.Identifier | T.Metavariable;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.Parameters;
    _return_type: T._Type | undefined;
    _where_clause: T.WhereClause | undefined;
    _body: T.Block;
    visibilityModifier(): T.VisibilityModifier | undefined;
    functionModifiers(): T.FunctionModifiers | undefined;
    name(): T.Identifier | T.Metavariable;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.Parameters;
    returnType(): T._Type | undefined;
    whereClause(): T.WhereClause | undefined;
    body(): T.Block;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        functionModifiers: (v: T.FunctionModifiers) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier | T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (v: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        returnType: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapFunctionModifiers(data: T.FunctionModifiers, tree: TreeHandle): {
    $type: TSKindId.FunctionModifiers;
    _modifier: readonly ["async" | "const" | "default" | "unsafe" | T.ExternModifier, ...("async" | "const" | "default" | "unsafe" | T.ExternModifier)[]];
    modifier(): ("async" | "const" | "default" | "unsafe" | T.ExternModifier)[];
    $with: {
        modifier: (v_0: "async" | "const" | "default" | "unsafe" | T.ExternModifier, ...v: ("async" | "const" | "default" | "unsafe" | T.ExternModifier)[]) => /*elided*/ any & {
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
export declare function wrapFunctionSignatureItem(data: T.FunctionSignatureItem, tree: TreeHandle): {
    $type: TSKindId.FunctionSignatureItem;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _function_modifiers: T.FunctionModifiers | undefined;
    _name: T.Identifier | T.Metavariable;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.Parameters;
    _return_type: T._Type | undefined;
    _where_clause: T.WhereClause | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    functionModifiers(): T.FunctionModifiers | undefined;
    name(): T.Identifier | T.Metavariable;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.Parameters;
    returnType(): T._Type | undefined;
    whereClause(): T.WhereClause | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        functionModifiers: (v: T.FunctionModifiers) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier | T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (v: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        returnType: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => /*elided*/ any & {
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
export declare function wrapFunctionType(data: T.FunctionType, tree: TreeHandle): {
    $type: TSKindId.FunctionType;
    _for_lifetimes: T.ForLifetimes | undefined;
    _parameters: T.Parameters;
    _return_type: T._Type | undefined;
    $children: readonly [T.FunctionTypeFnForm | T.FunctionTypeTraitForm];
    forLifetimes(): T.ForLifetimes | undefined;
    parameters(): T.Parameters;
    returnType(): T._Type | undefined;
    $with: {
        forLifetimes: (v: T.ForLifetimes) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        parameters: (v: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        returnType: (v: T._Type) => /*elided*/ any & {
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
};
export declare function wrapGenBlock(data: T.GenBlock, tree: TreeHandle): {
    $type: TSKindId.GenBlock;
    _move_marker: import("@sittir/types").BooleanKeyword<T.MoveMarker> | undefined;
    _block: T.Block;
    moveMarker(): T.MoveMarker | undefined;
    block(): T.Block;
    $with: {
        moveMarker: (v: T.MoveMarker) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        block: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapGenericFunction(data: T.GenericFunction, tree: TreeHandle): {
    $type: TSKindId.GenericFunction;
    _function: T.FieldExpression | T.Identifier | T.ScopedIdentifier;
    _type_arguments: T.TypeArguments;
    function(): T.FieldExpression | T.Identifier | T.ScopedIdentifier;
    typeArguments(): T.TypeArguments;
    $with: {
        function: (v: T.Identifier | T.ScopedIdentifier | T.FieldExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeArguments: (v: T.TypeArguments) => /*elided*/ any & {
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
export declare function wrapGenericPattern(data: T.GenericPattern, tree: TreeHandle): {
    $type: TSKindId.GenericPattern;
    _type_arguments: T.TypeArguments;
    $children: readonly [T.Identifier | T.ScopedIdentifier];
    typeArguments(): T.TypeArguments;
    $with: {
        typeArguments: (v: T.TypeArguments) => /*elided*/ any & {
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
};
export declare function wrapGenericType(data: T.GenericType, tree: TreeHandle): {
    $type: TSKindId.GenericType;
    _type: T.ReservedIdentifier | T.ScopedTypeIdentifier | T.TypeIdentifier;
    _type_arguments: T.TypeArguments;
    typeField(): T.ReservedIdentifier | T.ScopedTypeIdentifier | T.TypeIdentifier;
    typeArguments(): T.TypeArguments;
    $with: {
        typeField: (v: T.TypeIdentifier | T.ReservedIdentifier | T.ScopedTypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeArguments: (v: T.TypeArguments) => /*elided*/ any & {
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
export declare function wrapGenericTypeWithTurbofish(data: T.GenericTypeWithTurbofish, tree: TreeHandle): {
    $type: TSKindId.GenericTypeWithTurbofish;
    _type: T.ScopedIdentifier | T.TypeIdentifier;
    _turbofish: import("@sittir/types").AutoStamp<T.GenericTypeWithTurbofishTurbofish>;
    _type_arguments: T.TypeArguments;
    typeField(): T.ScopedIdentifier | T.TypeIdentifier;
    turbofish(): T.GenericTypeWithTurbofishTurbofish;
    typeArguments(): T.TypeArguments;
    $with: {
        typeField: (v: T.TypeIdentifier | T.ScopedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        turbofish: (v: T.GenericTypeWithTurbofishTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeArguments: (v: T.TypeArguments) => /*elided*/ any & {
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
export declare function wrapHigherRankedTraitBound(data: T.HigherRankedTraitBound, tree: TreeHandle): {
    $type: TSKindId.HigherRankedTraitBound;
    _type_parameters: T.TypeParameters;
    _type: T._Type;
    typeParameters(): T.TypeParameters;
    typeField(): T._Type;
    $with: {
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
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
export declare function wrapIfExpression(data: T.IfExpression, tree: TreeHandle): {
    $type: TSKindId.IfExpression;
    _condition: T.Condition;
    _consequence: T.Block;
    _alternative: T.ElseClause | undefined;
    condition(): T.Condition;
    consequence(): T.Block;
    alternative(): T.ElseClause | undefined;
    $with: {
        condition: (v: T.Condition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        consequence: (v: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        alternative: (v: T.ElseClause) => /*elided*/ any & {
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
export declare function wrapImplItemBody(data: T.ImplItemBody, tree: TreeHandle): {
    $type: "impl_item_body";
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (v: T.DeclarationList) => /*elided*/ any & {
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
export declare function wrapImplItem(data: T.ImplItem, tree: TreeHandle): ({
    $variant: 'body';
    $type: TSKindId.ImplItem;
    _unsafe_marker: any;
    _type_parameters: any;
    _negative: any;
    _trait: any;
    _type: any;
    _where_clause: any;
    $children: any;
    unsafeMarker(): T.UnsafeMarker | undefined;
    typeParameters(): T.TypeParameters | undefined;
    negative(): T.ImplItemNegative | undefined;
    trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    typeField(): T._Type;
    whereClause(): T.WhereClause | undefined;
    $with: {
        unsafeMarker: (v: T.UnsafeMarker) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: /*elided*/ any;
                typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: /*elided*/ any;
                negative: (v: T.ImplItemNegative) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        negative: (v: T.ImplItemNegative) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: /*elided*/ any;
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: /*elided*/ any;
                typeField: (v: T._Type) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: /*elided*/ any;
                whereClause: (v: T.WhereClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: /*elided*/ any;
                children: (items_0: ";" | T._ImplItemBody) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T._ImplItemBody) => (/*elided*/ any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'semi';
    $type: TSKindId.ImplItem;
    _unsafe_marker: any;
    _type_parameters: any;
    _negative: any;
    _trait: any;
    _type: any;
    _where_clause: any;
    $children: any;
    unsafeMarker(): T.UnsafeMarker | undefined;
    typeParameters(): T.TypeParameters | undefined;
    negative(): T.ImplItemNegative | undefined;
    trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    typeField(): T._Type;
    whereClause(): T.WhereClause | undefined;
    $with: {
        unsafeMarker: (v: T.UnsafeMarker) => (any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: any;
                typeParameters: (v: T.TypeParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => (any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: any;
                negative: (v: T.ImplItemNegative) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        negative: (v: T.ImplItemNegative) => (any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: any;
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: any;
                typeField: (v: T._Type) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => (any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: any;
                whereClause: (v: T.WhereClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ImplItemBody) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => (any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: any;
                children: (items_0: ";" | T._ImplItemBody) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T._ImplItemBody) => (any | {
            $variant: 'semi';
            $type: TSKindId.ImplItem;
            _unsafe_marker: any;
            _type_parameters: any;
            _negative: any;
            _trait: any;
            _type: any;
            _where_clause: any;
            $children: any;
            unsafeMarker(): T.UnsafeMarker | undefined;
            typeParameters(): T.TypeParameters | undefined;
            negative(): T.ImplItemNegative | undefined;
            trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
            typeField(): T._Type;
            whereClause(): T.WhereClause | undefined;
            $with: {
                unsafeMarker: (v: T.UnsafeMarker) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                negative: (v: T.ImplItemNegative) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                trait: (v: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeField: (v: T._Type) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                whereClause: (v: T.WhereClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapIndexExpression(data: T.IndexExpression, tree: TreeHandle): {
    $type: TSKindId.IndexExpression;
    _object: T.Expression;
    _index: T.Expression;
    object(): T.Expression;
    index(): T.Expression;
    $with: {
        object: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        index: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapInnerAttributeItem(data: T.InnerAttributeItem, tree: TreeHandle): {
    $type: TSKindId.InnerAttributeItem;
    _attribute: T.Attribute;
    attribute(): T.Attribute;
    $with: {
        attribute: (v: T.Attribute) => /*elided*/ any & {
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
export declare function wrapLabel(data: T.Label, tree: TreeHandle): {
    $type: TSKindId.Label;
    _identifier: T.Identifier;
    identifier(): T.Identifier;
    $with: {
        identifier: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrapLastMatchArm(data: T.LastMatchArm, tree: TreeHandle): {
    $type: TSKindId.LastMatchArm;
    _pattern: T.MatchPattern;
    _value: T.Expression;
    $children: readonly (T.AttributeItem | T.InnerAttributeItem)[];
    pattern(): T.MatchPattern;
    value(): T.Expression;
    $with: {
        pattern: (v: T.MatchPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (...items: ((T.AttributeItem | T.InnerAttributeItem))[]) => /*elided*/ any & {
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
export declare function wrapLetCondition(data: T.LetCondition, tree: TreeHandle): {
    $type: TSKindId.LetCondition;
    _pattern: T.Pattern;
    _value: T.Expression;
    pattern(): T.Pattern;
    value(): T.Expression;
    $with: {
        pattern: (v: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapLetDeclaration(data: T.LetDeclaration, tree: TreeHandle): {
    $type: TSKindId.LetDeclaration;
    _mutable_specifier: import("@sittir/types").BooleanKeyword<T._MutableSpecifier> | undefined;
    _pattern: T.Pattern;
    _type: T._Type | undefined;
    _value: T.Expression | undefined;
    _alternative: T.Block | undefined;
    mutableSpecifier(): T._MutableSpecifier | undefined;
    pattern(): T.Pattern;
    typeField(): T._Type | undefined;
    value(): T.Expression | undefined;
    alternative(): T.Block | undefined;
    $with: {
        mutableSpecifier: (v: T._MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (v: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        alternative: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapLifetime(data: T.Lifetime, tree: TreeHandle): {
    $type: TSKindId.Lifetime;
    _identifier: T.Identifier;
    identifier(): T.Identifier;
    $with: {
        identifier: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrapLifetimeParameter(data: T.LifetimeParameter, tree: TreeHandle): {
    $type: TSKindId.LifetimeParameter;
    _name: T.Lifetime;
    _bounds: T.TraitBounds | undefined;
    name(): T.Lifetime;
    bounds(): T.TraitBounds | undefined;
    $with: {
        name: (v: T.Lifetime) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        bounds: (v: T.TraitBounds) => /*elided*/ any & {
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
export declare function wrapLineComment(data: T.LineComment, tree: TreeHandle): ({
    $variant: 'content';
    $type: TSKindId.LineComment;
    $children: any;
    $with: {
        children: (items_0: T.LineCommentContent | T.LineCommentDoc | T.LineCommentRegularDslash) => (/*elided*/ any | {
            $variant: 'doc';
            $type: TSKindId.LineComment;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        } | {
            $variant: 'regular_dslash';
            $type: TSKindId.LineComment;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'doc';
    $type: TSKindId.LineComment;
    $children: any;
    $with: {
        children: (items_0: T.LineCommentContent | T.LineCommentDoc | T.LineCommentRegularDslash) => (any | {
            $variant: 'doc';
            $type: TSKindId.LineComment;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'regular_dslash';
            $type: TSKindId.LineComment;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'regular_dslash';
    $type: TSKindId.LineComment;
    $children: any;
    $with: {
        children: (items_0: T.LineCommentContent | T.LineCommentDoc | T.LineCommentRegularDslash) => (any | {
            $variant: 'doc';
            $type: TSKindId.LineComment;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'regular_dslash';
            $type: TSKindId.LineComment;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapLoopExpression(data: T.LoopExpression, tree: TreeHandle): {
    $type: TSKindId.LoopExpression;
    _label: T.Label | undefined;
    _body: T.Block;
    label(): T.Label | undefined;
    body(): T.Block;
    $with: {
        label: (v: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapMacroDefinitionParen(data: T.MacroDefinitionParen, tree: TreeHandle): {
    $type: "macro_definition_paren";
    $children: readonly T.MacroRule[];
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
export declare function wrapMacroDefinitionBracket(data: T.MacroDefinitionBracket, tree: TreeHandle): {
    $type: "macro_definition_bracket";
    $children: readonly T.MacroRule[];
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
export declare function wrapMacroDefinitionBrace(data: T.MacroDefinitionBrace, tree: TreeHandle): {
    $type: "macro_definition_brace";
    $children: readonly T.MacroRule[];
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
export declare function wrapMacroDefinition(data: T.MacroDefinition, tree: TreeHandle): ({
    $variant: 'brace';
    $type: TSKindId.MacroDefinition;
    _name: any;
    $children: any;
    name(): T.Identifier | T.ReservedIdentifier;
    $with: {
        name: (v: T.Identifier | T.ReservedIdentifier) => (/*elided*/ any | {
            $variant: 'bracket';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: /*elided*/ any;
                children: (items_0: T._MacroDefinitionBrace | T._MacroDefinitionBracket | T._MacroDefinitionParen) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'paren';
                    $type: TSKindId.MacroDefinition;
                    _name: any;
                    $children: any;
                    name(): T.Identifier | T.ReservedIdentifier;
                    $with: {
                        name: /*elided*/ any;
                        children: /*elided*/ any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T._MacroDefinitionBrace | T._MacroDefinitionBracket | T._MacroDefinitionParen) => (/*elided*/ any | {
            $variant: 'bracket';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: (v: T.Identifier | T.ReservedIdentifier) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'paren';
                    $type: TSKindId.MacroDefinition;
                    _name: any;
                    $children: any;
                    name(): T.Identifier | T.ReservedIdentifier;
                    $with: {
                        name: /*elided*/ any;
                        children: /*elided*/ any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'bracket';
    $type: TSKindId.MacroDefinition;
    _name: any;
    $children: any;
    name(): T.Identifier | T.ReservedIdentifier;
    $with: {
        name: (v: T.Identifier | T.ReservedIdentifier) => (any | {
            $variant: 'bracket';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: any;
                children: (items_0: T._MacroDefinitionBrace | T._MacroDefinitionBracket | T._MacroDefinitionParen) => (any | any | {
                    $variant: 'paren';
                    $type: TSKindId.MacroDefinition;
                    _name: any;
                    $children: any;
                    name(): T.Identifier | T.ReservedIdentifier;
                    $with: {
                        name: any;
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T._MacroDefinitionBrace | T._MacroDefinitionBracket | T._MacroDefinitionParen) => (any | {
            $variant: 'bracket';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: (v: T.Identifier | T.ReservedIdentifier) => (any | any | {
                    $variant: 'paren';
                    $type: TSKindId.MacroDefinition;
                    _name: any;
                    $children: any;
                    name(): T.Identifier | T.ReservedIdentifier;
                    $with: {
                        name: any;
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'paren';
    $type: TSKindId.MacroDefinition;
    _name: any;
    $children: any;
    name(): T.Identifier | T.ReservedIdentifier;
    $with: {
        name: (v: T.Identifier | T.ReservedIdentifier) => (any | {
            $variant: 'bracket';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: any;
                children: (items_0: T._MacroDefinitionBrace | T._MacroDefinitionBracket | T._MacroDefinitionParen) => (any | any | {
                    $variant: 'paren';
                    $type: TSKindId.MacroDefinition;
                    _name: any;
                    $children: any;
                    name(): T.Identifier | T.ReservedIdentifier;
                    $with: {
                        name: any;
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T._MacroDefinitionBrace | T._MacroDefinitionBracket | T._MacroDefinitionParen) => (any | {
            $variant: 'bracket';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: (v: T.Identifier | T.ReservedIdentifier) => (any | any | {
                    $variant: 'paren';
                    $type: TSKindId.MacroDefinition;
                    _name: any;
                    $children: any;
                    name(): T.Identifier | T.ReservedIdentifier;
                    $with: {
                        name: any;
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.MacroDefinition;
            _name: any;
            $children: any;
            name(): T.Identifier | T.ReservedIdentifier;
            $with: {
                name: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapMacroInvocation(data: T.MacroInvocation, tree: TreeHandle): {
    $type: TSKindId.MacroInvocation;
    _macro: T.Identifier | T.ReservedIdentifier | T.ScopedIdentifier;
    _token_tree: T.DelimTokenTree;
    macro(): T.Identifier | T.ReservedIdentifier | T.ScopedIdentifier;
    tokenTree(): T.DelimTokenTree;
    $with: {
        macro: (v: T.ScopedIdentifier | T.Identifier | T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        tokenTree: (v: T.DelimTokenTree) => /*elided*/ any & {
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
export declare function wrapMacroRule(data: T.MacroRule, tree: TreeHandle): {
    $type: TSKindId.MacroRule;
    _left: T.TokenTreePattern;
    _right: T.TokenTree;
    left(): T.TokenTreePattern;
    right(): T.TokenTree;
    $with: {
        left: (v: T.TokenTreePattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        right: (v: T.TokenTree) => /*elided*/ any & {
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
export declare function wrapMatchArmBlockEnding(data: T.MatchArmBlockEnding, tree: TreeHandle): {
    $type: "match_arm_block_ending";
    _value: T.ExpressionEndingWithBlock;
    value(): T.ExpressionEndingWithBlock;
    $with: {
        value: (v: T.ExpressionEndingWithBlock) => /*elided*/ any & {
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
export declare function wrapMatchArm(data: T.MatchArm, tree: TreeHandle): ({
    $variant: 'block_ending';
    $type: TSKindId.MatchArm;
    _attributes: any;
    _pattern: any;
    $children: any;
    attributes(): (T.AttributeItem | T.InnerAttributeItem)[];
    pattern(): T.MatchPattern;
    $with: {
        attributes: (...v: (T.AttributeItem | T.InnerAttributeItem)[]) => (/*elided*/ any | {
            $variant: 'with_comma';
            $type: TSKindId.MatchArm;
            _attributes: any;
            _pattern: any;
            $children: any;
            attributes(): (T.AttributeItem | T.InnerAttributeItem)[];
            pattern(): T.MatchPattern;
            $with: {
                attributes: /*elided*/ any;
                pattern: (v: T.MatchPattern) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.MatchArmWithComma | T._MatchArmBlockEnding) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (v: T.MatchPattern) => (/*elided*/ any | {
            $variant: 'with_comma';
            $type: TSKindId.MatchArm;
            _attributes: any;
            _pattern: any;
            $children: any;
            attributes(): (T.AttributeItem | T.InnerAttributeItem)[];
            pattern(): T.MatchPattern;
            $with: {
                attributes: (...v: (T.AttributeItem | T.InnerAttributeItem)[]) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                pattern: /*elided*/ any;
                children: (items_0: T.MatchArmWithComma | T._MatchArmBlockEnding) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.MatchArmWithComma | T._MatchArmBlockEnding) => (/*elided*/ any | {
            $variant: 'with_comma';
            $type: TSKindId.MatchArm;
            _attributes: any;
            _pattern: any;
            $children: any;
            attributes(): (T.AttributeItem | T.InnerAttributeItem)[];
            pattern(): T.MatchPattern;
            $with: {
                attributes: (...v: (T.AttributeItem | T.InnerAttributeItem)[]) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                pattern: (v: T.MatchPattern) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'with_comma';
    $type: TSKindId.MatchArm;
    _attributes: any;
    _pattern: any;
    $children: any;
    attributes(): (T.AttributeItem | T.InnerAttributeItem)[];
    pattern(): T.MatchPattern;
    $with: {
        attributes: (...v: (T.AttributeItem | T.InnerAttributeItem)[]) => (any | {
            $variant: 'with_comma';
            $type: TSKindId.MatchArm;
            _attributes: any;
            _pattern: any;
            $children: any;
            attributes(): (T.AttributeItem | T.InnerAttributeItem)[];
            pattern(): T.MatchPattern;
            $with: {
                attributes: any;
                pattern: (v: T.MatchPattern) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: T.MatchArmWithComma | T._MatchArmBlockEnding) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (v: T.MatchPattern) => (any | {
            $variant: 'with_comma';
            $type: TSKindId.MatchArm;
            _attributes: any;
            _pattern: any;
            $children: any;
            attributes(): (T.AttributeItem | T.InnerAttributeItem)[];
            pattern(): T.MatchPattern;
            $with: {
                attributes: (...v: (T.AttributeItem | T.InnerAttributeItem)[]) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                pattern: any;
                children: (items_0: T.MatchArmWithComma | T._MatchArmBlockEnding) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: T.MatchArmWithComma | T._MatchArmBlockEnding) => (any | {
            $variant: 'with_comma';
            $type: TSKindId.MatchArm;
            _attributes: any;
            _pattern: any;
            $children: any;
            attributes(): (T.AttributeItem | T.InnerAttributeItem)[];
            pattern(): T.MatchPattern;
            $with: {
                attributes: (...v: (T.AttributeItem | T.InnerAttributeItem)[]) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                pattern: (v: T.MatchPattern) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapMatchBlock(data: T.MatchBlock, tree: TreeHandle): {
    $type: TSKindId.MatchBlock;
    $children: readonly (T.LastMatchArm | T.MatchArm)[];
    $with: {
        $children: (...vs: ((T.MatchArm | T.LastMatchArm))[]) => /*elided*/ any & {
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
export declare function wrapMatchExpression(data: T.MatchExpression, tree: TreeHandle): {
    $type: TSKindId.MatchExpression;
    _value: T.Expression;
    _body: T.MatchBlock;
    value(): T.Expression;
    body(): T.MatchBlock;
    $with: {
        value: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.MatchBlock) => /*elided*/ any & {
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
export declare function wrapMatchPattern(data: T.MatchPattern, tree: TreeHandle): {
    $type: TSKindId.MatchPattern;
    _condition: T.Condition | undefined;
    $children: readonly [T.Pattern];
    condition(): T.Condition | undefined;
    $with: {
        condition: (v: T.Condition) => /*elided*/ any & {
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
};
export declare function wrapModItemInline(data: T.ModItemInline, tree: TreeHandle): {
    $type: "mod_item_inline";
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (v: T.DeclarationList) => /*elided*/ any & {
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
export declare function wrapModItem(data: T.ModItem, tree: TreeHandle): ({
    $variant: 'external';
    $type: TSKindId.ModItem;
    _visibility_modifier: any;
    _name: any;
    $children: any;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.Identifier;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | {
            $variant: 'inline';
            $type: TSKindId.ModItem;
            _visibility_modifier: any;
            _name: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.Identifier;
            $with: {
                visibilityModifier: /*elided*/ any;
                name: (v: T.Identifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ModItemInline) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier) => (/*elided*/ any | {
            $variant: 'inline';
            $type: TSKindId.ModItem;
            _visibility_modifier: any;
            _name: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.Identifier;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: /*elided*/ any;
                children: (items_0: ";" | T._ModItemInline) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T._ModItemInline) => (/*elided*/ any | {
            $variant: 'inline';
            $type: TSKindId.ModItem;
            _visibility_modifier: any;
            _name: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.Identifier;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: (v: T.Identifier) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'inline';
    $type: TSKindId.ModItem;
    _visibility_modifier: any;
    _name: any;
    $children: any;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.Identifier;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => (any | {
            $variant: 'inline';
            $type: TSKindId.ModItem;
            _visibility_modifier: any;
            _name: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.Identifier;
            $with: {
                visibilityModifier: any;
                name: (v: T.Identifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T._ModItemInline) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier) => (any | {
            $variant: 'inline';
            $type: TSKindId.ModItem;
            _visibility_modifier: any;
            _name: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.Identifier;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: any;
                children: (items_0: ";" | T._ModItemInline) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T._ModItemInline) => (any | {
            $variant: 'inline';
            $type: TSKindId.ModItem;
            _visibility_modifier: any;
            _name: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.Identifier;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: (v: T.Identifier) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapMutPattern(data: T.MutPattern, tree: TreeHandle): {
    $type: TSKindId.MutPattern;
    _mutable_specifier: import("@sittir/types").AutoStamp<T._MutableSpecifier>;
    $children: readonly [T.Pattern];
    mutableSpecifier(): T._MutableSpecifier;
    $with: {
        mutableSpecifier: (v: T._MutableSpecifier) => /*elided*/ any & {
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
};
export declare function wrapNegativeLiteral(data: T.NegativeLiteral, tree: TreeHandle): {
    $type: TSKindId.NegativeLiteral;
    _value: T.FloatLiteral | T.IntegerLiteral;
    value(): T.FloatLiteral | T.IntegerLiteral;
    $with: {
        value: (v: T.IntegerLiteral | T.FloatLiteral) => /*elided*/ any & {
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
export declare function wrapOrPattern(data: T.OrPattern, tree: TreeHandle): ({
    $variant: 'binary';
    $type: TSKindId.OrPattern;
    $children: any;
    $with: {
        children: (items_0: T.OrPatternBinary | T.OrPatternPrefix) => (/*elided*/ any | {
            $variant: 'prefix';
            $type: TSKindId.OrPattern;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'prefix';
    $type: TSKindId.OrPattern;
    $children: any;
    $with: {
        children: (items_0: T.OrPatternBinary | T.OrPatternPrefix) => (any | {
            $variant: 'prefix';
            $type: TSKindId.OrPattern;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapOrderedFieldDeclarationList(data: T.OrderedFieldDeclarationList, tree: TreeHandle): {
    $type: TSKindId.OrderedFieldDeclarationList;
    _type: readonly T._Type[];
    $children: readonly (T.AttributeItem | T.VisibilityModifier)[];
    typeField(): T._Type[];
    $with: {
        typeField: (...v: T._Type[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (...items: ((T.AttributeItem | T.VisibilityModifier))[]) => /*elided*/ any & {
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
export declare function wrapParameter(data: T.Parameter, tree: TreeHandle): {
    $type: TSKindId.Parameter;
    _mutable_specifier: import("@sittir/types").BooleanKeyword<T._MutableSpecifier> | undefined;
    _pattern: T.Self | T.Pattern;
    _type: T._Type;
    mutableSpecifier(): T._MutableSpecifier | undefined;
    pattern(): T.Self | T.Pattern;
    typeField(): T._Type;
    $with: {
        mutableSpecifier: (v: T._MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (v: T.Pattern | T.Self) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
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
export declare function wrapParameters(data: T.Parameters, tree: TreeHandle): {
    $type: TSKindId.Parameters;
    $children: readonly ("_" | T.AttributeItem | T.Parameter | T.SelfParameter | T.VariadicParameter | T._Type)[];
    $with: {
        $children: (...vs: ((T.AttributeItem | T.Parameter | T.SelfParameter | T.VariadicParameter | T._Type))[]) => /*elided*/ any & {
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
export declare function wrapParenthesizedExpression(data: T.ParenthesizedExpression, tree: TreeHandle): {
    $type: TSKindId.ParenthesizedExpression;
    $children: readonly [T.Expression];
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
export declare function wrapPointerTypeMut(data: T.PointerTypeMut, tree: TreeHandle): {
    $type: "pointer_type_mut";
    $children: readonly [T.MutableSpecifier];
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
export declare function wrapPointerType(data: T.PointerType, tree: TreeHandle): ({
    $variant: 'const';
    $type: TSKindId.PointerType;
    _type: any;
    $children: any;
    typeField(): T._Type;
    $with: {
        typeField: (v: T._Type) => (/*elided*/ any | {
            $variant: 'mut';
            $type: TSKindId.PointerType;
            _type: any;
            $children: any;
            typeField(): T._Type;
            $with: {
                typeField: /*elided*/ any;
                children: (items_0: "const" | T._PointerTypeMut) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: "const" | T._PointerTypeMut) => (/*elided*/ any | {
            $variant: 'mut';
            $type: TSKindId.PointerType;
            _type: any;
            $children: any;
            typeField(): T._Type;
            $with: {
                typeField: (v: T._Type) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'mut';
    $type: TSKindId.PointerType;
    _type: any;
    $children: any;
    typeField(): T._Type;
    $with: {
        typeField: (v: T._Type) => (any | {
            $variant: 'mut';
            $type: TSKindId.PointerType;
            _type: any;
            $children: any;
            typeField(): T._Type;
            $with: {
                typeField: any;
                children: (items_0: "const" | T._PointerTypeMut) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: "const" | T._PointerTypeMut) => (any | {
            $variant: 'mut';
            $type: TSKindId.PointerType;
            _type: any;
            $children: any;
            typeField(): T._Type;
            $with: {
                typeField: (v: T._Type) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapQualifiedType(data: T.QualifiedType, tree: TreeHandle): {
    $type: TSKindId.QualifiedType;
    _type: T._Type;
    _alias: T._Type;
    typeField(): T._Type;
    alias(): T._Type;
    $with: {
        typeField: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        alias: (v: T._Type) => /*elided*/ any & {
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
export declare function wrapRangeExpressionBare(data: T.RangeExpressionBare, tree: TreeHandle): {
    $type: "range_expression_bare";
    _operator: import("@sittir/types").AutoStamp<T.Operator>;
    operator(): T.Operator;
    $with: {
        operator: (v: T.Operator) => /*elided*/ any & {
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
export declare function wrapRangeExpression(data: T.RangeExpression, tree: TreeHandle): ({
    $variant: 'bare';
    $type: TSKindId.RangeExpression;
    $children: any;
    $with: {
        children: (items_0: T.RangeExpressionBinary | T.RangeExpressionPostfix | T.RangeExpressionPrefix | T._RangeExpressionBare) => (/*elided*/ any | {
            $variant: 'binary';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        } | {
            $variant: 'postfix';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'binary';
    $type: TSKindId.RangeExpression;
    $children: any;
    $with: {
        children: (items_0: T.RangeExpressionBinary | T.RangeExpressionPostfix | T.RangeExpressionPrefix | T._RangeExpressionBare) => (any | {
            $variant: 'binary';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'postfix';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'postfix';
    $type: TSKindId.RangeExpression;
    $children: any;
    $with: {
        children: (items_0: T.RangeExpressionBinary | T.RangeExpressionPostfix | T.RangeExpressionPrefix | T._RangeExpressionBare) => (any | {
            $variant: 'binary';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'postfix';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'prefix';
    $type: TSKindId.RangeExpression;
    $children: any;
    $with: {
        children: (items_0: T.RangeExpressionBinary | T.RangeExpressionPostfix | T.RangeExpressionPrefix | T._RangeExpressionBare) => (any | {
            $variant: 'binary';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'postfix';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangeExpression;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapRangePattern(data: T.RangePattern, tree: TreeHandle): ({
    $variant: 'left_bare';
    $type: TSKindId.RangePattern;
    _left: any;
    $children: any;
    left(): T.LiteralPattern | T.Path;
    $with: {
        left: (v: T.LiteralPattern | T.Path) => (/*elided*/ any | {
            $variant: 'left_with_right';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: /*elided*/ any;
                children: (items_0: ".." | T.RangePatternLeftWithRight | T.RangePatternPrefix) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'prefix';
                    $type: TSKindId.RangePattern;
                    _left: any;
                    $children: any;
                    left(): T.LiteralPattern | T.Path;
                    $with: {
                        left: /*elided*/ any;
                        children: /*elided*/ any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ".." | T.RangePatternLeftWithRight | T.RangePatternPrefix) => (/*elided*/ any | {
            $variant: 'left_with_right';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: (v: T.LiteralPattern | T.Path) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'prefix';
                    $type: TSKindId.RangePattern;
                    _left: any;
                    $children: any;
                    left(): T.LiteralPattern | T.Path;
                    $with: {
                        left: /*elided*/ any;
                        children: /*elided*/ any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'left_with_right';
    $type: TSKindId.RangePattern;
    _left: any;
    $children: any;
    left(): T.LiteralPattern | T.Path;
    $with: {
        left: (v: T.LiteralPattern | T.Path) => (any | {
            $variant: 'left_with_right';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: any;
                children: (items_0: ".." | T.RangePatternLeftWithRight | T.RangePatternPrefix) => (any | any | {
                    $variant: 'prefix';
                    $type: TSKindId.RangePattern;
                    _left: any;
                    $children: any;
                    left(): T.LiteralPattern | T.Path;
                    $with: {
                        left: any;
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ".." | T.RangePatternLeftWithRight | T.RangePatternPrefix) => (any | {
            $variant: 'left_with_right';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: (v: T.LiteralPattern | T.Path) => (any | any | {
                    $variant: 'prefix';
                    $type: TSKindId.RangePattern;
                    _left: any;
                    $children: any;
                    left(): T.LiteralPattern | T.Path;
                    $with: {
                        left: any;
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'prefix';
    $type: TSKindId.RangePattern;
    _left: any;
    $children: any;
    left(): T.LiteralPattern | T.Path;
    $with: {
        left: (v: T.LiteralPattern | T.Path) => (any | {
            $variant: 'left_with_right';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: any;
                children: (items_0: ".." | T.RangePatternLeftWithRight | T.RangePatternPrefix) => (any | any | {
                    $variant: 'prefix';
                    $type: TSKindId.RangePattern;
                    _left: any;
                    $children: any;
                    left(): T.LiteralPattern | T.Path;
                    $with: {
                        left: any;
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ".." | T.RangePatternLeftWithRight | T.RangePatternPrefix) => (any | {
            $variant: 'left_with_right';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: (v: T.LiteralPattern | T.Path) => (any | any | {
                    $variant: 'prefix';
                    $type: TSKindId.RangePattern;
                    _left: any;
                    $children: any;
                    left(): T.LiteralPattern | T.Path;
                    $with: {
                        left: any;
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        } | {
            $variant: 'prefix';
            $type: TSKindId.RangePattern;
            _left: any;
            $children: any;
            left(): T.LiteralPattern | T.Path;
            $with: {
                left: any;
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapRawStringLiteral(data: T.RawStringLiteral, tree: TreeHandle): {
    $type: TSKindId.RawStringLiteral;
    _raw_string_literal_start: string | undefined;
    _string_content: T.RawStringLiteralContent;
    _raw_string_literal_end: string | undefined;
    rawStringLiteralStart(): string | undefined;
    stringContent(): T.RawStringLiteralContent;
    rawStringLiteralEnd(): string | undefined;
    $with: {
        rawStringLiteralStart: (v: string) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        stringContent: (v: T.RawStringLiteralContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        rawStringLiteralEnd: (v: string) => /*elided*/ any & {
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
export declare function wrapRefPattern(data: T.RefPattern, tree: TreeHandle): {
    $type: TSKindId.RefPattern;
    $children: readonly [T.Pattern];
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
export declare function wrapReferenceExpression(data: T.ReferenceExpression, tree: TreeHandle): {
    $type: TSKindId.ReferenceExpression;
    _value: T.Expression;
    $children: readonly [T.MutableSpecifier | T.ReferenceExpressionRawConst | T.ReferenceExpressionRawMut];
    value(): T.Expression;
    $with: {
        value: (v: T.Expression) => /*elided*/ any & {
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
};
export declare function wrapReferencePattern(data: T.ReferencePattern, tree: TreeHandle): {
    $type: TSKindId.ReferencePattern;
    _mutable_specifier: import("@sittir/types").BooleanKeyword<T._MutableSpecifier> | undefined;
    _pattern: T.Pattern;
    mutableSpecifier(): T._MutableSpecifier | undefined;
    pattern(): T.Pattern;
    $with: {
        mutableSpecifier: (v: T._MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (v: T.Pattern) => /*elided*/ any & {
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
export declare function wrapReferenceType(data: T.ReferenceType, tree: TreeHandle): {
    $type: TSKindId.ReferenceType;
    _lifetime: T.Lifetime | undefined;
    _mutable_specifier: import("@sittir/types").BooleanKeyword<T._MutableSpecifier> | undefined;
    _type: T._Type;
    lifetime(): T.Lifetime | undefined;
    mutableSpecifier(): T._MutableSpecifier | undefined;
    typeField(): T._Type;
    $with: {
        lifetime: (v: T.Lifetime) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (v: T._MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
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
export declare function wrapRemovedTraitBound(data: T.RemovedTraitBound, tree: TreeHandle): {
    $type: TSKindId.RemovedTraitBound;
    $children: readonly [T._Type];
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
export declare function wrapReturnExpression(data: T.ReturnExpression, tree: TreeHandle): {
    $type: TSKindId.ReturnExpression;
    $children: readonly [T.Expression];
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
export declare function wrapScopedIdentifier(data: T.ScopedIdentifier, tree: TreeHandle): {
    $type: TSKindId.ScopedIdentifier;
    _path: T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    _name: T.Identifier | T.Super;
    path(): T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    name(): T.Identifier | T.Super;
    $with: {
        path: (v: T.Path | T.BracketedType | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier | T.Super) => /*elided*/ any & {
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
export declare function wrapScopedTypeIdentifier(data: T.ScopedTypeIdentifier, tree: TreeHandle): {
    $type: TSKindId.ScopedTypeIdentifier;
    _path: T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    _name: T.TypeIdentifier;
    path(): T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    name(): T.TypeIdentifier;
    $with: {
        path: (v: T.Path | T.GenericTypeWithTurbofish | T.BracketedType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
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
export declare function wrapScopedTypeIdentifierInExpressionPosition(data: T.ScopedTypeIdentifierInExpressionPosition, tree: TreeHandle): {
    $type: TSKindId.ScopedTypeIdentifierInExpressionPosition;
    _path: T.GenericTypeWithTurbofish | T.Path | undefined;
    _name: T.TypeIdentifier;
    path(): T.GenericTypeWithTurbofish | T.Path | undefined;
    name(): T.TypeIdentifier;
    $with: {
        path: (v: T.Path | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
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
export declare function wrapScopedUseList(data: T.ScopedUseList, tree: TreeHandle): {
    $type: TSKindId.ScopedUseList;
    _path: T.Path | undefined;
    _list: T.UseList;
    path(): T.Path | undefined;
    list(): T.UseList;
    $with: {
        path: (v: T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        list: (v: T.UseList) => /*elided*/ any & {
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
export declare function wrapSelfParameter(data: T.SelfParameter, tree: TreeHandle): {
    $type: TSKindId.SelfParameter;
    _reference: import("@sittir/types").BooleanKeyword<"&"> | undefined;
    _lifetime: T.Lifetime | undefined;
    _mutable_specifier: import("@sittir/types").BooleanKeyword<T._MutableSpecifier> | undefined;
    _self: import("@sittir/types").AutoStamp<T._Self>;
    reference(): "&" | undefined;
    lifetime(): T.Lifetime | undefined;
    mutableSpecifier(): T._MutableSpecifier | undefined;
    self(): T._Self;
    $with: {
        reference: (v: "&") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        lifetime: (v: T.Lifetime) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (v: T._MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        self: (v: T._Self) => /*elided*/ any & {
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
export declare function wrapShorthandFieldInitializer(data: T.ShorthandFieldInitializer, tree: TreeHandle): {
    $type: TSKindId.ShorthandFieldInitializer;
    _attributes: readonly T.AttributeItem[];
    _identifier: T.Identifier;
    attributes(): T.AttributeItem[];
    identifier(): T.Identifier;
    $with: {
        attributes: (...v: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        identifier: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrapSlicePattern(data: T.SlicePattern, tree: TreeHandle): {
    $type: TSKindId.SlicePattern;
    $children: readonly T.Pattern[];
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
export declare function wrapSourceFile(data: T.SourceFile, tree: TreeHandle): {
    $type: TSKindId.SourceFile;
    _shebang: T.Shebang | undefined;
    _statements: readonly T.Statement[];
    shebang(): T.Shebang | undefined;
    statements(): T.Statement[];
    $with: {
        shebang: (v: T.Shebang) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        statements: (...v: T.Statement[]) => /*elided*/ any & {
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
export declare function wrapStaticItem(data: T.StaticItem, tree: TreeHandle): {
    $type: TSKindId.StaticItem;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _mutable_specifier: T.RefMarker | T._MutableSpecifier | undefined;
    _name: T.Identifier;
    _type: T._Type;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    mutableSpecifier(): T.RefMarker | T._MutableSpecifier | undefined;
    name(): T.Identifier;
    typeField(): T._Type;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        mutableSpecifier: (v: T.RefMarker | T._MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        value: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapStringLiteral(data: T.StringLiteral, tree: TreeHandle): {
    $type: TSKindId.StringLiteral;
    $children: readonly (T.EscapeSequence | T.StringContent)[];
    $with: {
        $children: (...vs: ((T.EscapeSequence | T.StringContent))[]) => /*elided*/ any & {
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
export declare function wrapStructExpression(data: T.StructExpression, tree: TreeHandle): {
    $type: TSKindId.StructExpression;
    _name: T.GenericTypeWithTurbofish | T.ScopedTypeIdentifierInExpressionPosition | T.TypeIdentifier;
    _body: T.FieldInitializerList;
    name(): T.GenericTypeWithTurbofish | T.ScopedTypeIdentifierInExpressionPosition | T.TypeIdentifier;
    body(): T.FieldInitializerList;
    $with: {
        name: (v: T.TypeIdentifier | T.ScopedTypeIdentifierInExpressionPosition | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.FieldInitializerList) => /*elided*/ any & {
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
export declare function wrapStructItem(data: T.StructItem, tree: TreeHandle): ({
    $variant: 'brace';
    $type: TSKindId.StructItem;
    _visibility_modifier: any;
    _name: any;
    _type_parameters: any;
    $children: any;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: /*elided*/ any;
                name: (v: T.TypeIdentifier) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: /*elided*/ any;
                        name: /*elided*/ any;
                        typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => (/*elided*/ any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: /*elided*/ any;
                        name: /*elided*/ any;
                        typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: /*elided*/ any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => (/*elided*/ any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: /*elided*/ any;
                        name: (v: T.TypeIdentifier) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        typeParameters: /*elided*/ any;
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: /*elided*/ any;
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: any;
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (/*elided*/ any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: /*elided*/ any;
                        name: (v: T.TypeIdentifier) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        typeParameters: (v: T.TypeParameters) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: /*elided*/ any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: /*elided*/ any;
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'tuple';
    $type: TSKindId.StructItem;
    _visibility_modifier: any;
    _name: any;
    _type_parameters: any;
    $children: any;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => (any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: (v: T.TypeIdentifier) => (any | any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: any;
                        name: any;
                        typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => (any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: any;
                        name: any;
                        typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => (any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: any;
                        name: (v: T.TypeIdentifier) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        typeParameters: any;
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: any;
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: any;
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: any;
                        name: (v: T.TypeIdentifier) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'unit';
    $type: TSKindId.StructItem;
    _visibility_modifier: any;
    _name: any;
    _type_parameters: any;
    $children: any;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => (any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: (v: T.TypeIdentifier) => (any | any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: any;
                        name: any;
                        typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => (any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: any;
                        name: any;
                        typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: any;
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => (any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: any;
                        name: (v: T.TypeIdentifier) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        typeParameters: any;
                        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: any;
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: any;
                children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (items_0: ";" | T.StructItemBrace | T.StructItemTuple) => (any | {
            $variant: 'tuple';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: (v: T.VisibilityModifier) => (any | any | {
                    $variant: 'unit';
                    $type: TSKindId.StructItem;
                    _visibility_modifier: any;
                    _name: any;
                    _type_parameters: any;
                    $children: any;
                    visibilityModifier(): T.VisibilityModifier | undefined;
                    name(): T.TypeIdentifier;
                    typeParameters(): T.TypeParameters | undefined;
                    $with: {
                        visibilityModifier: any;
                        name: (v: T.TypeIdentifier) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: unknown[]): AnyNodeData;
                        };
                        children: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        } | {
            $variant: 'unit';
            $type: TSKindId.StructItem;
            _visibility_modifier: any;
            _name: any;
            _type_parameters: any;
            $children: any;
            visibilityModifier(): T.VisibilityModifier | undefined;
            name(): T.TypeIdentifier;
            typeParameters(): T.TypeParameters | undefined;
            $with: {
                visibilityModifier: any;
                name: (v: T.TypeIdentifier) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                typeParameters: (v: T.TypeParameters) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: unknown[]): AnyNodeData;
                };
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapStructPattern(data: T.StructPattern, tree: TreeHandle): {
    $type: TSKindId.StructPattern;
    _type: T.ScopedTypeIdentifier | T.TypeIdentifier;
    $children: readonly (T.RemainingFieldPattern | T.FieldPattern)[];
    typeField(): T.ScopedTypeIdentifier | T.TypeIdentifier;
    $with: {
        typeField: (v: T.TypeIdentifier | T.ScopedTypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (...items: ((T.FieldPattern | T.RemainingFieldPattern))[]) => /*elided*/ any & {
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
export declare function wrapTokenBindingPattern(data: T.TokenBindingPattern, tree: TreeHandle): {
    $type: TSKindId.TokenBindingPattern;
    _name: T.Metavariable;
    _type: T.TokenBindingPatternType;
    name(): T.Metavariable;
    typeField(): T.TokenBindingPatternType;
    $with: {
        name: (v: T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T.TokenBindingPatternType) => /*elided*/ any & {
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
export declare function wrapTokenRepetition(data: T.TokenRepetition, tree: TreeHandle): {
    $type: TSKindId.TokenRepetition;
    $children: readonly T.Tokens[];
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
export declare function wrapTokenRepetitionPattern(data: T.TokenRepetitionPattern, tree: TreeHandle): {
    $type: TSKindId.TokenRepetitionPattern;
    $children: readonly T.TokenPattern[];
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
export declare function wrapTokenTreeParen(data: T.TokenTreeParen, tree: TreeHandle): {
    $type: "token_tree_paren";
    $children: readonly T.Tokens[];
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
export declare function wrapTokenTreeBracket(data: T.TokenTreeBracket, tree: TreeHandle): {
    $type: "token_tree_bracket";
    $children: readonly T.Tokens[];
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
export declare function wrapTokenTreeBrace(data: T.TokenTreeBrace, tree: TreeHandle): {
    $type: "token_tree_brace";
    $children: readonly T.Tokens[];
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
export declare function wrapTokenTree(data: T.TokenTree, tree: TreeHandle): ({
    $variant: 'brace';
    $type: TSKindId.TokenTree;
    $children: any;
    $with: {
        children: (items_0: T._TokenTreeBrace | T._TokenTreeBracket | T._TokenTreeParen) => (/*elided*/ any | {
            $variant: 'bracket';
            $type: TSKindId.TokenTree;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.TokenTree;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'bracket';
    $type: TSKindId.TokenTree;
    $children: any;
    $with: {
        children: (items_0: T._TokenTreeBrace | T._TokenTreeBracket | T._TokenTreeParen) => (any | {
            $variant: 'bracket';
            $type: TSKindId.TokenTree;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.TokenTree;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'paren';
    $type: TSKindId.TokenTree;
    $children: any;
    $with: {
        children: (items_0: T._TokenTreeBrace | T._TokenTreeBracket | T._TokenTreeParen) => (any | {
            $variant: 'bracket';
            $type: TSKindId.TokenTree;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.TokenTree;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapTokenTreePatternParen(data: T.TokenTreePatternParen, tree: TreeHandle): {
    $type: "token_tree_pattern_paren";
    $children: readonly T.TokenPattern[];
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
export declare function wrapTokenTreePatternBracket(data: T.TokenTreePatternBracket, tree: TreeHandle): {
    $type: "token_tree_pattern_bracket";
    $children: readonly T.TokenPattern[];
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
export declare function wrapTokenTreePatternBrace(data: T.TokenTreePatternBrace, tree: TreeHandle): {
    $type: "token_tree_pattern_brace";
    $children: readonly T.TokenPattern[];
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
export declare function wrapTokenTreePattern(data: T.TokenTreePattern, tree: TreeHandle): ({
    $variant: 'brace';
    $type: TSKindId.TokenTreePattern;
    $children: any;
    $with: {
        children: (items_0: T._TokenTreePatternBrace | T._TokenTreePatternBracket | T._TokenTreePatternParen) => (/*elided*/ any | {
            $variant: 'bracket';
            $type: TSKindId.TokenTreePattern;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.TokenTreePattern;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'bracket';
    $type: TSKindId.TokenTreePattern;
    $children: any;
    $with: {
        children: (items_0: T._TokenTreePatternBrace | T._TokenTreePatternBracket | T._TokenTreePatternParen) => (any | {
            $variant: 'bracket';
            $type: TSKindId.TokenTreePattern;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.TokenTreePattern;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'paren';
    $type: TSKindId.TokenTreePattern;
    $children: any;
    $with: {
        children: (items_0: T._TokenTreePatternBrace | T._TokenTreePatternBracket | T._TokenTreePatternParen) => (any | {
            $variant: 'bracket';
            $type: TSKindId.TokenTreePattern;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'paren';
            $type: TSKindId.TokenTreePattern;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapTraitBounds(data: T.TraitBounds, tree: TreeHandle): {
    $type: TSKindId.TraitBounds;
    $children: readonly [T.HigherRankedTraitBound | T.Lifetime | T._Type, ...(T.HigherRankedTraitBound | T.Lifetime | T._Type)[]];
    $with: {
        $children: (vs_0: T.HigherRankedTraitBound | T.Lifetime | T._Type, ...vs: (T.HigherRankedTraitBound | T.Lifetime | T._Type)[]) => /*elided*/ any & {
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
export declare function wrapTraitItem(data: T.TraitItem, tree: TreeHandle): {
    $type: TSKindId.TraitItem;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _unsafe_marker: import("@sittir/types").BooleanKeyword<T.UnsafeMarker> | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _bounds: T.TraitBounds | undefined;
    _where_clause: T.WhereClause | undefined;
    _body: T.DeclarationList;
    visibilityModifier(): T.VisibilityModifier | undefined;
    unsafeMarker(): T.UnsafeMarker | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    bounds(): T.TraitBounds | undefined;
    whereClause(): T.WhereClause | undefined;
    body(): T.DeclarationList;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        unsafeMarker: (v: T.UnsafeMarker) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        bounds: (v: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.DeclarationList) => /*elided*/ any & {
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
export declare function wrapTryBlock(data: T.TryBlock, tree: TreeHandle): {
    $type: TSKindId.TryBlock;
    _block: T.Block;
    block(): T.Block;
    $with: {
        block: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapTryExpression(data: T.TryExpression, tree: TreeHandle): {
    $type: TSKindId.TryExpression;
    _value: T.Expression;
    value(): T.Expression;
    $with: {
        value: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapTupleExpression(data: T.TupleExpression, tree: TreeHandle): {
    $type: TSKindId.TupleExpression;
    _attributes: readonly T.AttributeItem[];
    _elements: readonly T.Expression[] | undefined;
    attributes(): T.AttributeItem[];
    elements(): T.Expression[];
    $with: {
        attributes: (...v: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        elements: (...v: T.Expression[]) => /*elided*/ any & {
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
export declare function wrapTuplePattern(data: T.TuplePattern, tree: TreeHandle): {
    $type: TSKindId.TuplePattern;
    $children: readonly (T.ClosureExpression | T.Pattern)[];
    $with: {
        $children: (...vs: ((T.Pattern | T.ClosureExpression))[]) => /*elided*/ any & {
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
export declare function wrapTupleStructPattern(data: T.TupleStructPattern, tree: TreeHandle): {
    $type: TSKindId.TupleStructPattern;
    _type: T.GenericTypeWithTurbofish | T.Identifier | T.ScopedIdentifier;
    $children: readonly T.Pattern[];
    typeField(): T.GenericTypeWithTurbofish | T.Identifier | T.ScopedIdentifier;
    $with: {
        typeField: (v: T.Identifier | T.ScopedIdentifier | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        children: (...items: T.Pattern[]) => /*elided*/ any & {
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
export declare function wrapTupleType(data: T.TupleType, tree: TreeHandle): {
    $type: TSKindId.TupleType;
    $children: readonly [T._Type, ...T._Type[]];
    $with: {
        $children: (vs_0: T._Type, ...vs: T._Type[]) => /*elided*/ any & {
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
export declare function wrapTypeArguments(data: T.TypeArguments, tree: TreeHandle): {
    $type: TSKindId.TypeArguments;
    $children: readonly [T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type, ...(T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type)[]];
    $with: {
        $children: (vs_0: T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type, ...vs: (T.Block | T.Lifetime | T.TraitBounds | T.TypeBinding | T.Literal | T._Type)[]) => /*elided*/ any & {
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
export declare function wrapTypeBinding(data: T.TypeBinding, tree: TreeHandle): {
    $type: TSKindId.TypeBinding;
    _name: T.TypeIdentifier;
    _type_arguments: T.TypeArguments | undefined;
    _type: T._Type;
    name(): T.TypeIdentifier;
    typeArguments(): T.TypeArguments | undefined;
    typeField(): T._Type;
    $with: {
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeArguments: (v: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
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
export declare function wrapTypeCastExpression(data: T.TypeCastExpression, tree: TreeHandle): {
    $type: TSKindId.TypeCastExpression;
    _value: T.Expression;
    _type: T._Type;
    value(): T.Expression;
    typeField(): T._Type;
    $with: {
        value: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
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
export declare function wrapTypeItem(data: T.TypeItem, tree: TreeHandle): {
    $type: TSKindId.TypeItem;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _where_clause: T.WhereClause | undefined;
    _type: T._Type;
    _trailing_where_clause: T.WhereClause | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    whereClause(): T.WhereClause | undefined;
    typeField(): T._Type;
    trailingWhereClause(): T.WhereClause | undefined;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeField: (v: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        trailingWhereClause: (v: T.WhereClause) => /*elided*/ any & {
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
export declare function wrapTypeParameter(data: T.TypeParameter, tree: TreeHandle): {
    $type: TSKindId.TypeParameter;
    _name: T.TypeIdentifier;
    _bounds: T.TraitBounds | undefined;
    _default_type: T._Type | undefined;
    name(): T.TypeIdentifier;
    bounds(): T.TraitBounds | undefined;
    defaultType(): T._Type | undefined;
    $with: {
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        bounds: (v: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        defaultType: (v: T._Type) => /*elided*/ any & {
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
export declare function wrapTypeParameters(data: T.TypeParameters, tree: TreeHandle): {
    $type: TSKindId.TypeParameters;
    _attributes: readonly (T.AttributeItem | T.ConstParameter | T.LifetimeParameter | T.Metavariable | T.TypeParameter)[];
    attributes(): (T.AttributeItem | T.ConstParameter | T.LifetimeParameter | T.Metavariable | T.TypeParameter)[];
    $with: {
        attributes: (...v: (T.AttributeItem | T.Metavariable | T.TypeParameter | T.LifetimeParameter | T.ConstParameter)[]) => /*elided*/ any & {
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
export declare function wrapUnaryExpression(data: T.UnaryExpression, tree: TreeHandle): {
    $type: TSKindId.UnaryExpression;
    _operator: T.UnaryExpressionOperator;
    _operand: T.Expression;
    operator(): T.UnaryExpressionOperator;
    operand(): T.Expression;
    $with: {
        operator: (v: T.UnaryExpressionOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        operand: (v: T.Expression) => /*elided*/ any & {
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
export declare function wrapUnionItem(data: T.UnionItem, tree: TreeHandle): {
    $type: TSKindId.UnionItem;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _where_clause: T.WhereClause | undefined;
    _body: T.FieldDeclarationList;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    whereClause(): T.WhereClause | undefined;
    body(): T.FieldDeclarationList;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        name: (v: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        typeParameters: (v: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        whereClause: (v: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.FieldDeclarationList) => /*elided*/ any & {
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
export declare function wrapUnsafeBlock(data: T.UnsafeBlock, tree: TreeHandle): {
    $type: TSKindId.UnsafeBlock;
    _block: T.Block;
    block(): T.Block;
    $with: {
        block: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapUseAsClause(data: T.UseAsClause, tree: TreeHandle): {
    $type: TSKindId.UseAsClause;
    _path: T.Path;
    _alias: T.Identifier;
    path(): T.Path;
    alias(): T.Identifier;
    $with: {
        path: (v: T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        alias: (v: T.Identifier) => /*elided*/ any & {
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
export declare function wrapUseBounds(data: T.UseBounds, tree: TreeHandle): {
    $type: TSKindId.UseBounds;
    $children: readonly (T.Lifetime | T.TypeIdentifier)[];
    $with: {
        $children: (...vs: ((T.Lifetime | T.TypeIdentifier))[]) => /*elided*/ any & {
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
export declare function wrapUseDeclaration(data: T.UseDeclaration, tree: TreeHandle): {
    $type: TSKindId.UseDeclaration;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _argument: T.UseClause;
    visibilityModifier(): T.VisibilityModifier | undefined;
    argument(): T.UseClause;
    $with: {
        visibilityModifier: (v: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        argument: (v: T.UseClause) => /*elided*/ any & {
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
export declare function wrapUseList(data: T.UseList, tree: TreeHandle): {
    $type: TSKindId.UseList;
    $children: readonly T.UseClause[];
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
export declare function wrapUseWildcard(data: T.UseWildcard, tree: TreeHandle): {
    $type: TSKindId.UseWildcard;
    _path: T.Path | undefined;
    path(): T.Path | undefined;
    $with: {
        path: (v: T.Path) => /*elided*/ any & {
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
export declare function wrapVariadicParameter(data: T.VariadicParameter, tree: TreeHandle): {
    $type: TSKindId.VariadicParameter;
    _mutable_specifier: import("@sittir/types").BooleanKeyword<T._MutableSpecifier> | undefined;
    _pattern: T.Pattern | undefined;
    mutableSpecifier(): T._MutableSpecifier | undefined;
    pattern(): T.Pattern | undefined;
    $with: {
        mutableSpecifier: (v: T._MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        pattern: (v: T.Pattern) => /*elided*/ any & {
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
export declare function wrapVisibilityModifierCrate(data: T.VisibilityModifierCrate, tree: TreeHandle): {
    $type: "visibility_modifier_crate";
    $children: readonly [T.Crate];
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
export declare function wrapVisibilityModifier(data: T.VisibilityModifier, tree: TreeHandle): ({
    $variant: 'crate';
    $type: TSKindId.VisibilityModifier;
    $children: any;
    $with: {
        children: (items_0: T.VisibilityModifierInPath | T.VisibilityModifierPub | T._VisibilityModifierCrate) => (/*elided*/ any | {
            $variant: 'in_path';
            $type: TSKindId.VisibilityModifier;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        } | {
            $variant: 'pub';
            $type: TSKindId.VisibilityModifier;
            $children: any;
            $with: {
                children: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'in_path';
    $type: TSKindId.VisibilityModifier;
    $children: any;
    $with: {
        children: (items_0: T.VisibilityModifierInPath | T.VisibilityModifierPub | T._VisibilityModifierCrate) => (any | {
            $variant: 'in_path';
            $type: TSKindId.VisibilityModifier;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'pub';
            $type: TSKindId.VisibilityModifier;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
} | {
    $variant: 'pub';
    $type: TSKindId.VisibilityModifier;
    $children: any;
    $with: {
        children: (items_0: T.VisibilityModifierInPath | T.VisibilityModifierPub | T._VisibilityModifierCrate) => (any | {
            $variant: 'in_path';
            $type: TSKindId.VisibilityModifier;
            $children: any;
            $with: {
                children: any;
            };
        } | {
            $variant: 'pub';
            $type: TSKindId.VisibilityModifier;
            $children: any;
            $with: {
                children: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: unknown[]): AnyNodeData;
};
export declare function wrapWhereClause(data: T.WhereClause, tree: TreeHandle): {
    $type: TSKindId.WhereClause;
    $children: readonly T.WherePredicate[];
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
export declare function wrapWherePredicate(data: T.WherePredicate, tree: TreeHandle): {
    $type: TSKindId.WherePredicate;
    _left: T.ArrayType | T.GenericType | T.HigherRankedTraitBound | T.Lifetime | T.PrimitiveType | T.ReferenceType | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier | T.PointerType;
    _bounds: T.TraitBounds;
    left(): T.ArrayType | T.GenericType | T.HigherRankedTraitBound | T.Lifetime | T.PrimitiveType | T.ReferenceType | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier | T.PointerType;
    bounds(): T.TraitBounds;
    $with: {
        left: (v: T.Lifetime | T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType | T.ReferenceType | T.PointerType | T.TupleType | T.ArrayType | T.HigherRankedTraitBound | T.PrimitiveType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        bounds: (v: T.TraitBounds) => /*elided*/ any & {
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
export declare function wrapWhileExpression(data: T.WhileExpression, tree: TreeHandle): {
    $type: TSKindId.WhileExpression;
    _label: T.Label | undefined;
    _condition: T.Condition;
    _body: T.Block;
    label(): T.Label | undefined;
    condition(): T.Condition;
    body(): T.Block;
    $with: {
        label: (v: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        condition: (v: T.Condition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: unknown[]): AnyNodeData;
        };
        body: (v: T.Block) => /*elided*/ any & {
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
export declare function wrapYieldExpression(data: T.YieldExpression, tree: TreeHandle): {
    $type: TSKindId.YieldExpression;
    $children: readonly [T.Expression];
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