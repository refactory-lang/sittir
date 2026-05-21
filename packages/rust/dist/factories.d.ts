import type * as T from './types.js';
import { TSKindId } from './types.js';
import type { ConfigOf, FluentNode } from '@sittir/types';
export declare function _arrayExpressionList(config?: Partial<T.ArrayExpressionList.Config>): {
    $type: TSKindId.ArrayExpressionList;
    $source: 2;
    $named: true;
    _attributes: readonly T.AttributeItem[] | undefined;
    _attribute_item: readonly T.AttributeItem[] | undefined;
    _elements: readonly T.Expression[] | undefined;
    attributes(): readonly T.AttributeItem[] | undefined;
    attributeItems(): readonly T.AttributeItem[] | undefined;
    elements(): readonly T.Expression[] | undefined;
    $with: {
        attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        attributeItems: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        elements: (...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _arrayExpressionSemi(config: T.ArrayExpressionSemi.Config): {
    $type: TSKindId.ArrayExpressionSemi;
    $source: 2;
    $named: true;
    _attributes: readonly T.AttributeItem[] | undefined;
    _elements: T.Expression;
    _length: T.Expression;
    attributes(): readonly T.AttributeItem[] | undefined;
    elements(): T.Expression;
    length(): T.Expression;
    $with: {
        attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        elements: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        length: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _closureExpressionBlock(config: T.ClosureExpressionBlock.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _closureExpressionExpr(config: T._ClosureExpressionExpr.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _delimTokenTreeBrace(...children: T.DelimTokens[]): {
    $type: TSKindId._DelimTokenTreeBrace;
    $source: 2;
    $named: true;
    _delim_tokens: T.DelimTokens[];
    delimTokens(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _delimTokenTreeBracket(...children: T.DelimTokens[]): {
    $type: TSKindId._DelimTokenTreeBracket;
    $source: 2;
    $named: true;
    _delim_tokens: T.DelimTokens[];
    delimTokens(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _delimTokenTreeParen(...children: T.DelimTokens[]): {
    $type: TSKindId._DelimTokenTreeParen;
    $source: 2;
    $named: true;
    _delim_tokens: T.DelimTokens[];
    delimTokens(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _expressionStatementBlockEnding(child: T.ExpressionEndingWithBlock): {
    $type: TSKindId._ExpressionStatementBlockEnding;
    $source: 2;
    $named: true;
    _expression_ending_with_block: T.ExpressionEndingWithBlock;
    expressionEndingWithBlock(): T.ExpressionEndingWithBlock;
    $with: {
        $child: (v: T.ExpressionEndingWithBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _expressionStatementWithSemi(child: T.Expression): {
    $type: TSKindId._ExpressionStatementWithSemi;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldIdentifier(text: string): {
    $type: TSKindId.FieldIdentifier;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _fieldPatternNamed(config: T.FieldPatternNamed.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _fieldPatternShorthand(config: T._FieldPatternShorthand.Config): {
    $type: TSKindId._FieldPatternShorthand;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    name(): T.Identifier;
    $with: {
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _foreignModItemBody(config: T._ForeignModItemBody.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function functionTypeFnForm(child?: T.FunctionModifiers): {
    $type: TSKindId.FunctionTypeFnForm;
    $source: 2;
    $named: true;
    _function_modifiers: T.FunctionModifiers | undefined;
    functionModifiers(): T.FunctionModifiers | undefined;
    $with: {
        $child: (v: T.FunctionModifiers) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function functionTypeTraitForm(config: T.FunctionTypeTraitForm.Config): {
    $type: TSKindId.FunctionTypeTraitForm;
    $source: 2;
    $named: true;
    _trait: T.ScopedTypeIdentifier | T.TypeIdentifier;
    trait(): T.ScopedTypeIdentifier | T.TypeIdentifier;
    $with: {
        trait: (value: T.TypeIdentifier | T.ScopedTypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _implItemBody(config: T._ImplItemBody.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function letChain(child: (T.LetChain | T.LetCondition | T.Expression)): {
    $type: TSKindId.LetChain;
    $source: 2;
    $named: true;
    _let_chain: T.LetChain | T.LetCondition | T.Expression;
    letChain(): T.LetChain | T.LetCondition | T.Expression;
    $with: {
        $child: (v: (T.LetChain | T.LetCondition | T.Expression)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lineCommentContent(text: string): {
    $type: TSKindId.LineCommentContent;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _lineCommentDoc(config: T.LineCommentDoc.Config): {
    $type: TSKindId.LineCommentDoc;
    $source: 2;
    $named: true;
    _outer: true | undefined;
    _inner: true | undefined;
    _doc: T.LineDocContent;
    outer(): true | undefined;
    inner(): true | undefined;
    doc(): T.LineDocContent;
    $with: {
        outer: (value?: NonNullable<Parameters<typeof _lineCommentDoc>[0]>['outer']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        inner: (value?: NonNullable<Parameters<typeof _lineCommentDoc>[0]>['inner']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        doc: (value: T.LineDocContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lineCommentRegularDslash(text: string): {
    $type: TSKindId.LineCommentRegularDslash;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _macroDefinitionBrace(...children: T.MacroRule[]): {
    $type: TSKindId._MacroDefinitionBrace;
    $source: 2;
    $named: true;
    _macro_rule: T.MacroRule[];
    macroRules(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _macroDefinitionBracket(...children: T.MacroRule[]): {
    $type: TSKindId._MacroDefinitionBracket;
    $source: 2;
    $named: true;
    _macro_rule: T.MacroRule[];
    macroRules(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _macroDefinitionParen(...children: T.MacroRule[]): {
    $type: TSKindId._MacroDefinitionParen;
    $source: 2;
    $named: true;
    _macro_rule: T.MacroRule[];
    macroRules(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _matchArmBlockEnding(config: T._MatchArmBlockEnding.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _matchArmWithComma(config: T.MatchArmWithComma.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _modItemInline(config: T._ModItemInline.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _orPatternBinary(config: T.OrPatternBinary.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        right: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _orPatternPrefix(config: T.OrPatternPrefix.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _pointerTypeMut(_config?: T._PointerTypeMut.Config): {
    $type: TSKindId._PointerTypeMut;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut";
    mutableSpecifier(): "mut";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _rangeExpressionBare(_config?: T._RangeExpressionBare.Config): {
    $type: TSKindId._RangeExpressionBare;
    $source: 2;
    $named: true;
    _operator: unknown;
    operator(): unknown;
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _rangeExpressionBinary(config: T.RangeExpressionBinary.Config): {
    $type: TSKindId.RangeExpressionBinary;
    $source: 2;
    $named: true;
    _start: T.Expression;
    _operator: unknown;
    _end: T.Expression;
    start(): T.Expression;
    operator(): unknown;
    end(): T.Expression;
    $with: {
        start: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof _rangeExpressionBinary>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        end: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _rangeExpressionPostfix(config: T.RangeExpressionPostfix.Config): {
    $type: TSKindId.RangeExpressionPostfix;
    $source: 2;
    $named: true;
    _start: T.Expression;
    _operator: unknown;
    start(): T.Expression;
    operator(): unknown;
    $with: {
        start: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _rangeExpressionPrefix(config: T.RangeExpressionPrefix.Config): {
    $type: TSKindId.RangeExpressionPrefix;
    $source: 2;
    $named: true;
    _operator: unknown;
    _end: T.Expression;
    operator(): unknown;
    end(): T.Expression;
    $with: {
        end: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _rangePatternLeftWithRight(config: T.RangePatternLeftWithRight.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _rangePatternPrefix(config: T.RangePatternPrefix.Config): {
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function referenceExpressionRawConst(text: string): {
    $type: TSKindId.ReferenceExpressionRawConst;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function referenceExpressionRawMut(_config?: T.ReferenceExpressionRawMut.Config): {
    $type: TSKindId.ReferenceExpressionRawMut;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut";
    mutableSpecifier(): "mut";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _structItemBrace(config: T.StructItemBrace.Config): {
    $type: TSKindId.StructItemBrace;
    $source: 2;
    $named: true;
    _where_clause: T.WhereClause | undefined;
    _body: T.FieldDeclarationList;
    whereClause(): T.WhereClause | undefined;
    body(): T.FieldDeclarationList;
    $with: {
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.FieldDeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _structItemTuple(config: T.StructItemTuple.Config): {
    $type: TSKindId.StructItemTuple;
    $source: 2;
    $named: true;
    _body: T.OrderedFieldDeclarationList;
    _where_clause: T.WhereClause | undefined;
    body(): T.OrderedFieldDeclarationList;
    whereClause(): T.WhereClause | undefined;
    $with: {
        body: (value: T.OrderedFieldDeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _tokenTreeBrace(...children: T.Tokens[]): {
    $type: TSKindId._TokenTreeBrace;
    $source: 2;
    $named: true;
    _tokens: T.Tokens[];
    tokens(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _tokenTreeBracket(...children: T.Tokens[]): {
    $type: TSKindId._TokenTreeBracket;
    $source: 2;
    $named: true;
    _tokens: T.Tokens[];
    tokens(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _tokenTreeParen(...children: T.Tokens[]): {
    $type: TSKindId._TokenTreeParen;
    $source: 2;
    $named: true;
    _tokens: T.Tokens[];
    tokens(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _tokenTreePatternBrace(...children: T.TokenPattern[]): {
    $type: TSKindId._TokenTreePatternBrace;
    $source: 2;
    $named: true;
    _token_pattern: T.TokenPattern[];
    tokenPatterns(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _tokenTreePatternBracket(...children: T.TokenPattern[]): {
    $type: TSKindId._TokenTreePatternBracket;
    $source: 2;
    $named: true;
    _token_pattern: T.TokenPattern[];
    tokenPatterns(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _tokenTreePatternParen(...children: T.TokenPattern[]): {
    $type: TSKindId._TokenTreePatternParen;
    $source: 2;
    $named: true;
    _token_pattern: T.TokenPattern[];
    tokenPatterns(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeIdentifier(text: string): {
    $type: TSKindId.TypeIdentifier;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _visibilityModifierCrate(_config?: T._VisibilityModifierCrate.Config): {
    $type: TSKindId._VisibilityModifierCrate;
    $source: 2;
    $named: true;
    _crate: unknown;
    crate(): unknown;
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _visibilityModifierInPath(config: T.VisibilityModifierInPath.Config): {
    $type: TSKindId.VisibilityModifierInPath;
    $source: 2;
    $named: true;
    _in: unknown;
    _path: T.Path;
    in(): unknown;
    path(): T.Path;
    $with: {
        path: (value: T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function _visibilityModifierPub(config?: Partial<T.VisibilityModifierPub.Config>): {
    $type: TSKindId.VisibilityModifierPub;
    $source: 2;
    $named: true;
    _pub: unknown;
    _visibility_modifier_pub_parens: T.VisibilityModifierPubParens | undefined;
    pub(): unknown;
    visibilityModifierPubParens(): T.VisibilityModifierPubParens | undefined;
    $with: {
        visibilityModifierPubParens: (value?: T.VisibilityModifierPubParens) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function abstractType(config: T.AbstractType.Config): {
    $type: TSKindId.AbstractType;
    $source: 2;
    $named: true;
    _type_parameters: T.TypeParameters | undefined;
    _trait: T.BoundedType | T.FunctionType | T.GenericType | T.RemovedTraitBound | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    trait(): T.BoundedType | T.FunctionType | T.GenericType | T.RemovedTraitBound | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier;
    $with: {
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        trait: (value: T.TypeIdentifier | T.ScopedTypeIdentifier | T.RemovedTraitBound | T.GenericType | T.FunctionType | T.TupleType | T.BoundedType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function arguments_(config?: Partial<T.Arguments.Config>): {
    $type: TSKindId.Arguments;
    $source: 2;
    $named: true;
    _attributes: readonly (T.AttributeItem | T.Expression)[] | undefined;
    attributes(): readonly (T.AttributeItem | T.Expression)[] | undefined;
    $with: {
        attributes: (...values: (T.AttributeItem | T.Expression)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function arrayExpression(config: ConfigOf<T.ArrayExpressionUFormSemi>): ReturnType<typeof arrayExpressionUFormSemi>;
export declare function arrayExpression(config: ConfigOf<T.ArrayExpressionUFormList>): ReturnType<typeof arrayExpressionUFormList>;
export declare function arrayExpressionUFormSemi(config: Omit<ConfigOf<T.ArrayExpressionUFormSemi>, '$variant'>): {
    $type: TSKindId.ArrayExpression;
    $source: 2;
    $named: true;
    $variant: 'semi';
    _array_expression_semi: T.ArrayExpressionSemi;
    arrayExpressionSemi(): T.ArrayExpressionSemi;
    $with: {
        arrayExpressionSemi: (value: T.ArrayExpressionSemi) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function arrayExpressionUFormList(config: Omit<ConfigOf<T.ArrayExpressionUFormList>, '$variant'>): {
    $type: TSKindId.ArrayExpression;
    $source: 2;
    $named: true;
    $variant: 'list';
    _array_expression_list: T.ArrayExpressionList;
    arrayExpressionList(): T.ArrayExpressionList;
    $with: {
        arrayExpressionList: (value: T.ArrayExpressionList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function arrayType(config: T.ArrayType.Config): {
    $type: TSKindId.ArrayType;
    $source: 2;
    $named: true;
    _element: T._Type;
    _length: T.Expression | undefined;
    element(): T._Type;
    length(): T.Expression | undefined;
    $with: {
        element: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        length: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function assignmentExpression(config: T.AssignmentExpression.Config): {
    $type: TSKindId.AssignmentExpression;
    $source: 2;
    $named: true;
    _left: T.Expression;
    _right: T.Expression;
    left(): T.Expression;
    right(): T.Expression;
    $with: {
        left: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        right: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function associatedType(config: T.AssociatedType.Config): {
    $type: TSKindId.AssociatedType;
    $source: 2;
    $named: true;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _bounds: T.TraitBounds | undefined;
    _where_clause: T.WhereClause | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    bounds(): T.TraitBounds | undefined;
    whereClause(): T.WhereClause | undefined;
    $with: {
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        bounds: (value?: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function asyncBlock(config: T.AsyncBlock.Config): {
    $type: TSKindId.AsyncBlock;
    $source: 2;
    $named: true;
    _move_marker: true | undefined;
    _block: T.Block;
    moveMarker(): true | undefined;
    block(): T.Block;
    $with: {
        moveMarker: (value?: NonNullable<Parameters<typeof asyncBlock>[0]>['moveMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        block: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function attribute(config: T.Attribute.Config): {
    $type: TSKindId.Attribute;
    $source: 2;
    $named: true;
    _path: T.Path;
    _value: T.Expression | undefined;
    _arguments: T.DelimTokenTree | undefined;
    path(): T.Path;
    value(): T.Expression | undefined;
    arguments(): T.DelimTokenTree | undefined;
    $with: {
        path: (value: T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        arguments: (value?: T.DelimTokenTree) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function attributeItem(attribute: T.AttributeItem.Config['attribute']): {
    $type: TSKindId.AttributeItem;
    $source: 2;
    $named: true;
    _attribute: T.Attribute;
    attribute(): T.Attribute;
    $with: {
        attribute: (value: T.AttributeItem.Config['attribute']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function awaitExpression(expression: T.AwaitExpression.Config['expression']): {
    $type: TSKindId.AwaitExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.AwaitExpression.Config['expression']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function baseFieldInitializer(expression: T.BaseFieldInitializer.Config['expression']): {
    $type: TSKindId.BaseFieldInitializer;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.BaseFieldInitializer.Config['expression']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function binaryExpression(config: T.BinaryExpression.Config): {
    $type: TSKindId.BinaryExpression;
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof binaryExpression>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        right: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function block(config?: Partial<T.Block.Config>): {
    $type: TSKindId.Block;
    $source: 2;
    $named: true;
    _label: T.Label | undefined;
    _statement: readonly T.Statement[] | undefined;
    _trailing_expression: T.Expression | undefined;
    label(): T.Label | undefined;
    statements(): readonly T.Statement[] | undefined;
    trailingExpression(): T.Expression | undefined;
    $with: {
        label: (value?: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        statements: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        trailingExpression: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function blockComment(config?: Partial<T.BlockComment.Config>): {
    $type: TSKindId.BlockComment;
    $source: 2;
    $named: true;
    _outer: true | undefined;
    _inner: true | undefined;
    _doc: T.BlockCommentContent | undefined;
    outer(): true | undefined;
    inner(): true | undefined;
    doc(): T.BlockCommentContent | undefined;
    $with: {
        outer: (value?: NonNullable<Parameters<typeof blockComment>[0]>['outer']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        inner: (value?: NonNullable<Parameters<typeof blockComment>[0]>['inner']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        doc: (value?: T.BlockCommentContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function booleanLiteral(text: 'true' | 'false'): {
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
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function boundedType(config: T.BoundedType.Config): {
    $type: TSKindId.BoundedType;
    $source: 2;
    $named: true;
    _left: T.Lifetime | T.UseBounds | T._Type;
    _right: T.Lifetime | T.UseBounds | T._Type;
    left(): T.Lifetime | T.UseBounds | T._Type;
    right(): T.Lifetime | T.UseBounds | T._Type;
    $with: {
        left: (value: T.Lifetime | T._Type | T.UseBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        right: (value: T.Lifetime | T._Type | T.UseBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function bracketedType(child: (T._Type | T.QualifiedType)): {
    $type: TSKindId.BracketedType;
    $source: 2;
    $named: true;
    _type: T.QualifiedType | T._Type;
    type(): T.QualifiedType | T._Type;
    $with: {
        $child: (v: (T._Type | T.QualifiedType)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function breakExpression(config?: Partial<T.BreakExpression.Config>): {
    $type: TSKindId.BreakExpression;
    $source: 2;
    $named: true;
    _label: T.Label | undefined;
    _expression: T.Expression | undefined;
    label(): T.Label | undefined;
    expression(): T.Expression | undefined;
    $with: {
        label: (value?: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        expression: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function callExpression(config: T.CallExpression.Config): {
    $type: TSKindId.CallExpression;
    $source: 2;
    $named: true;
    _function: T.ExpressionExceptRange;
    _arguments: T.Arguments;
    function(): T.ExpressionExceptRange;
    arguments(): T.Arguments;
    $with: {
        function: (value: T.ExpressionExceptRange) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        arguments: (value: T.Arguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function capturedPattern(config: T.CapturedPattern.Config): {
    $type: TSKindId.CapturedPattern;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    _pattern: T.Pattern;
    identifier(): T.Identifier;
    pattern(): T.Pattern;
    $with: {
        identifier: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function charLiteral(text: string): {
    $type: TSKindId.CharLiteral;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function closureExpressionExpr(body: T.ClosureExpressionExpr.Config['body']): {
    $type: TSKindId._ClosureExpressionExpr;
    $source: 2;
    $named: true;
    _body: "_" | T.Expression;
    body(): "_" | T.Expression;
    $with: {
        body: (value: T.ClosureExpressionExpr.Config['body']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function closureExpression(config: ConfigOf<T.ClosureExpressionUFormBlock>): ReturnType<typeof closureExpressionUFormBlock>;
export declare function closureExpression(config: ConfigOf<T.ClosureExpressionUFormExpr>): ReturnType<typeof closureExpressionUFormExpr>;
export declare function closureExpressionUFormBlock(config: Omit<ConfigOf<T.ClosureExpressionUFormBlock>, '$variant'>): {
    $type: TSKindId.ClosureExpression;
    $source: 2;
    $named: true;
    $variant: 'block';
    _static_marker: true | undefined;
    _async_marker: true | undefined;
    _move_marker: true | undefined;
    _parameters: T.ClosureParameters;
    _closure_expression_block: T.ClosureExpressionBlock;
    staticMarker(): true | undefined;
    asyncMarker(): true | undefined;
    moveMarker(): true | undefined;
    parameters(): T.ClosureParameters;
    closureExpressionBlock(): T.ClosureExpressionBlock;
    $with: {
        staticMarker: (value?: NonNullable<Parameters<typeof closureExpressionUFormBlock>[0]>['staticMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        asyncMarker: (value?: NonNullable<Parameters<typeof closureExpressionUFormBlock>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        moveMarker: (value?: NonNullable<Parameters<typeof closureExpressionUFormBlock>[0]>['moveMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        parameters: (value: T.ClosureParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        closureExpressionBlock: (value: T.ClosureExpressionBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function closureExpressionUFormExpr(config: Omit<ConfigOf<T.ClosureExpressionUFormExpr>, '$variant'>): {
    $type: TSKindId.ClosureExpression;
    $source: 2;
    $named: true;
    $variant: 'expr';
    _static_marker: true | undefined;
    _async_marker: true | undefined;
    _move_marker: true | undefined;
    _parameters: T.ClosureParameters;
    _closure_expression_expr: T._ClosureExpressionExpr;
    staticMarker(): true | undefined;
    asyncMarker(): true | undefined;
    moveMarker(): true | undefined;
    parameters(): T.ClosureParameters;
    closureExpressionExpr(): T._ClosureExpressionExpr;
    $with: {
        staticMarker: (value?: NonNullable<Parameters<typeof closureExpressionUFormExpr>[0]>['staticMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        asyncMarker: (value?: NonNullable<Parameters<typeof closureExpressionUFormExpr>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        moveMarker: (value?: NonNullable<Parameters<typeof closureExpressionUFormExpr>[0]>['moveMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        parameters: (value: T.ClosureParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        closureExpressionExpr: (value: T._ClosureExpressionExpr) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function closureParameters(...children: (T.Pattern | T.Parameter)[]): {
    $type: TSKindId.ClosureParameters;
    $source: 2;
    $named: true;
    _pattern: (T.Parameter | T.Pattern)[];
    patterns(): (T.Parameter | T.Pattern)[];
    $with: {
        $children: (...vs: (T.Pattern | T.Parameter)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function compoundAssignmentExpr(config: T.CompoundAssignmentExpr.Config): {
    $type: TSKindId.CompoundAssignmentExpr;
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof compoundAssignmentExpr>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        right: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function constBlock(body: T.ConstBlock.Config['body']): {
    $type: TSKindId.ConstBlock;
    $source: 2;
    $named: true;
    _body: T.Block;
    body(): T.Block;
    $with: {
        body: (value: T.ConstBlock.Config['body']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function constItem(config: T.ConstItem.Config): {
    $type: TSKindId.ConstItem;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.Identifier;
    _type: T._Type;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.Identifier;
    type(): T._Type;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function constParameter(config: T.ConstParameter.Config): {
    $type: TSKindId.ConstParameter;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    _type: T._Type;
    _value: T.Block | T.Identifier | T.NegativeLiteral | T.Literal | undefined;
    name(): T.Identifier;
    type(): T._Type;
    value(): T.Block | T.Identifier | T.NegativeLiteral | T.Literal | undefined;
    $with: {
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value?: T.Block | T.Identifier | T.Literal | T.NegativeLiteral) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function continueExpression(label?: T.ContinueExpression.Config['label']): {
    $type: TSKindId.ContinueExpression;
    $source: 2;
    $named: true;
    _label: T.Label | undefined;
    label(): T.Label | undefined;
    $with: {
        label: (value?: T.ContinueExpression.Config['label']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function crate(): {
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
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function declarationList(...children: T.DeclarationStatement[]): {
    $type: TSKindId.DeclarationList;
    $source: 2;
    $named: true;
    _declaration_statement: T.DeclarationStatement[];
    declarationStatements(): T.DeclarationStatement[];
    $with: {
        $children: (...vs: T.DeclarationStatement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function delimTokenTreeParen(...children: T.DelimTokens[]): {
    $type: TSKindId._DelimTokenTreeParen;
    $source: 2;
    $named: true;
    _delim_tokens: T.DelimTokens[];
    delimTokens(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function delimTokenTreeBracket(...children: T.DelimTokens[]): {
    $type: TSKindId._DelimTokenTreeBracket;
    $source: 2;
    $named: true;
    _delim_tokens: T.DelimTokens[];
    delimTokens(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function delimTokenTreeBrace(...children: T.DelimTokens[]): {
    $type: TSKindId._DelimTokenTreeBrace;
    $source: 2;
    $named: true;
    _delim_tokens: T.DelimTokens[];
    delimTokens(): T.DelimTokens[];
    $with: {
        $children: (...vs: T.DelimTokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function delimTokenTree(config: ConfigOf<T.DelimTokenTreeUFormParen>): ReturnType<typeof delimTokenTreeUFormParen>;
export declare function delimTokenTree(config: ConfigOf<T.DelimTokenTreeUFormBracket>): ReturnType<typeof delimTokenTreeUFormBracket>;
export declare function delimTokenTree(config: ConfigOf<T.DelimTokenTreeUFormBrace>): ReturnType<typeof delimTokenTreeUFormBrace>;
export declare function delimTokenTreeUFormParen(config: Omit<ConfigOf<T.DelimTokenTreeUFormParen>, '$variant'>): {
    $type: TSKindId.DelimTokenTree;
    $source: 2;
    $named: true;
    $variant: 'paren';
    _delim_token_tree_paren: T._DelimTokenTreeParen;
    delimTokenTreeParen(): T._DelimTokenTreeParen;
    $with: {
        delimTokenTreeParen: (value: T._DelimTokenTreeParen) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function delimTokenTreeUFormBracket(config: Omit<ConfigOf<T.DelimTokenTreeUFormBracket>, '$variant'>): {
    $type: TSKindId.DelimTokenTree;
    $source: 2;
    $named: true;
    $variant: 'bracket';
    _delim_token_tree_bracket: T._DelimTokenTreeBracket;
    delimTokenTreeBracket(): T._DelimTokenTreeBracket;
    $with: {
        delimTokenTreeBracket: (value: T._DelimTokenTreeBracket) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function delimTokenTreeUFormBrace(config: Omit<ConfigOf<T.DelimTokenTreeUFormBrace>, '$variant'>): {
    $type: TSKindId.DelimTokenTree;
    $source: 2;
    $named: true;
    $variant: 'brace';
    _delim_token_tree_brace: T._DelimTokenTreeBrace;
    delimTokenTreeBrace(): T._DelimTokenTreeBrace;
    $with: {
        delimTokenTreeBrace: (value: T._DelimTokenTreeBrace) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function dynamicType(trait: T.DynamicType.Config['trait']): {
    $type: TSKindId.DynamicType;
    $source: 2;
    $named: true;
    _trait: T.FunctionType | T.GenericType | T.HigherRankedTraitBound | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier;
    trait(): T.FunctionType | T.GenericType | T.HigherRankedTraitBound | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier;
    $with: {
        trait: (value: T.DynamicType.Config['trait']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function elseClause(child: (T.Block | T.IfExpression)): {
    $type: TSKindId.ElseClause;
    $source: 2;
    $named: true;
    _block: T.Block | T.IfExpression;
    block(): T.Block | T.IfExpression;
    $with: {
        $child: (v: (T.Block | T.IfExpression)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function enumItem(config: T.EnumItem.Config): {
    $type: TSKindId.EnumItem;
    $source: 2;
    $named: true;
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
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.EnumVariantList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function enumVariant(config: T.EnumVariant.Config): {
    $type: TSKindId.EnumVariant;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.Identifier;
    _body: T.FieldDeclarationList | T.OrderedFieldDeclarationList | undefined;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.Identifier;
    body(): T.FieldDeclarationList | T.OrderedFieldDeclarationList | undefined;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value?: T.FieldDeclarationList | T.OrderedFieldDeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function enumVariantList(...children: T.AttributedEnumVariant[]): {
    $type: TSKindId.EnumVariantList;
    $source: 2;
    $named: true;
    _attributed_enum_variant: T.AttributedEnumVariant[];
    attributedEnumVariants(): T.AttributedEnumVariant[];
    $with: {
        $children: (...vs: T.AttributedEnumVariant[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
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
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatementWithSemi(child: T.Expression): {
    $type: TSKindId._ExpressionStatementWithSemi;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatementBlockEnding(child: T.ExpressionEndingWithBlock): {
    $type: TSKindId._ExpressionStatementBlockEnding;
    $source: 2;
    $named: true;
    _expression_ending_with_block: T.ExpressionEndingWithBlock;
    expressionEndingWithBlock(): T.ExpressionEndingWithBlock;
    $with: {
        $child: (v: T.ExpressionEndingWithBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatement(config: ConfigOf<T.ExpressionStatementUFormWithSemi>): ReturnType<typeof expressionStatementUFormWithSemi>;
export declare function expressionStatement(config: ConfigOf<T.ExpressionStatementUFormBlockEnding>): ReturnType<typeof expressionStatementUFormBlockEnding>;
export declare function expressionStatementUFormWithSemi(config: Omit<ConfigOf<T.ExpressionStatementUFormWithSemi>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'with_semi';
    _expression_statement_with_semi: T._ExpressionStatementWithSemi;
    expressionStatementWithSemi(): T._ExpressionStatementWithSemi;
    $with: {
        expressionStatementWithSemi: (value: T._ExpressionStatementWithSemi) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function expressionStatementUFormBlockEnding(config: Omit<ConfigOf<T.ExpressionStatementUFormBlockEnding>, '$variant'>): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    $variant: 'block_ending';
    _expression_statement_block_ending: T._ExpressionStatementBlockEnding;
    expressionStatementBlockEnding(): T._ExpressionStatementBlockEnding;
    $with: {
        expressionStatementBlockEnding: (value: T._ExpressionStatementBlockEnding) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function externCrateDeclaration(config: T.ExternCrateDeclaration.Config): {
    $type: TSKindId.ExternCrateDeclaration;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _crate: unknown;
    _name: T.Identifier;
    _alias: T.Identifier | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    crate(): unknown;
    name(): T.Identifier;
    alias(): T.Identifier | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        alias: (value?: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function externModifier(stringLiteral?: T.ExternModifier.Config['stringLiteral']): {
    $type: TSKindId.ExternModifier;
    $source: 2;
    $named: true;
    _string_literal: T.StringLiteral | undefined;
    stringLiteral(): T.StringLiteral | undefined;
    $with: {
        stringLiteral: (value?: T.ExternModifier.Config['stringLiteral']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldDeclaration(config: T.FieldDeclaration.Config): {
    $type: TSKindId.FieldDeclaration;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.FieldIdentifier;
    _type: T._Type;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.FieldIdentifier;
    type(): T._Type;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.FieldIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldDeclarationList(...children: T.AttributedFieldDeclaration[]): {
    $type: TSKindId.FieldDeclarationList;
    $source: 2;
    $named: true;
    _attributed_field_declaration: T.AttributedFieldDeclaration[];
    attributedFieldDeclarations(): T.AttributedFieldDeclaration[];
    $with: {
        $children: (...vs: T.AttributedFieldDeclaration[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldExpression(config: T.FieldExpression.Config): {
    $type: TSKindId.FieldExpression;
    $source: 2;
    $named: true;
    _value: T.Expression;
    _field: T.FieldIdentifier | T.IntegerLiteral;
    value(): T.Expression;
    field(): T.FieldIdentifier | T.IntegerLiteral;
    $with: {
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        field: (value: T.FieldIdentifier | T.IntegerLiteral) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldInitializer(config: T.FieldInitializer.Config): {
    $type: TSKindId.FieldInitializer;
    $source: 2;
    $named: true;
    _attribute_item: readonly T.AttributeItem[] | undefined;
    _field: T.FieldIdentifier | T.IntegerLiteral;
    _value: T.Expression;
    attributeItems(): readonly T.AttributeItem[] | undefined;
    field(): T.FieldIdentifier | T.IntegerLiteral;
    value(): T.Expression;
    $with: {
        attributeItems: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        field: (value: T.FieldIdentifier | T.IntegerLiteral) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldInitializerList(...children: (T.ShorthandFieldInitializer | T.FieldInitializer | T.BaseFieldInitializer)[]): {
    $type: TSKindId.FieldInitializerList;
    $source: 2;
    $named: true;
    _shorthand_field_initializer: (T.BaseFieldInitializer | T.FieldInitializer | T.ShorthandFieldInitializer)[];
    shorthandFieldInitializers(): (T.BaseFieldInitializer | T.FieldInitializer | T.ShorthandFieldInitializer)[];
    $with: {
        $children: (...vs: (T.ShorthandFieldInitializer | T.FieldInitializer | T.BaseFieldInitializer)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldPatternShorthand(name: T.FieldPatternShorthand.Config['name']): {
    $type: TSKindId._FieldPatternShorthand;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    name(): T.Identifier;
    $with: {
        name: (value: T.FieldPatternShorthand.Config['name']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldPattern(config: ConfigOf<T.FieldPatternUFormShorthand>): ReturnType<typeof fieldPatternUFormShorthand>;
export declare function fieldPattern(config: ConfigOf<T.FieldPatternUFormNamed>): ReturnType<typeof fieldPatternUFormNamed>;
export declare function fieldPatternUFormShorthand(config: Omit<ConfigOf<T.FieldPatternUFormShorthand>, '$variant'>): {
    $type: TSKindId.FieldPattern;
    $source: 2;
    $named: true;
    $variant: 'shorthand';
    _ref_marker: true | undefined;
    _mutable_specifier: true | undefined;
    _field_pattern_shorthand: T._FieldPatternShorthand;
    refMarker(): true | undefined;
    mutableSpecifier(): true | undefined;
    fieldPatternShorthand(): T._FieldPatternShorthand;
    $with: {
        refMarker: (value?: NonNullable<Parameters<typeof fieldPatternUFormShorthand>[0]>['refMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        mutableSpecifier: (value?: NonNullable<Parameters<typeof fieldPatternUFormShorthand>[0]>['mutableSpecifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        fieldPatternShorthand: (value: T._FieldPatternShorthand) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fieldPatternUFormNamed(config: Omit<ConfigOf<T.FieldPatternUFormNamed>, '$variant'>): {
    $type: TSKindId.FieldPattern;
    $source: 2;
    $named: true;
    $variant: 'named';
    _ref_marker: true | undefined;
    _mutable_specifier: true | undefined;
    _field_pattern_named: T.FieldPatternNamed;
    refMarker(): true | undefined;
    mutableSpecifier(): true | undefined;
    fieldPatternNamed(): T.FieldPatternNamed;
    $with: {
        refMarker: (value?: NonNullable<Parameters<typeof fieldPatternUFormNamed>[0]>['refMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        mutableSpecifier: (value?: NonNullable<Parameters<typeof fieldPatternUFormNamed>[0]>['mutableSpecifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        fieldPatternNamed: (value: T.FieldPatternNamed) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function forExpression(config: T.ForExpression.Config): {
    $type: TSKindId.ForExpression;
    $source: 2;
    $named: true;
    _label: T.Label | undefined;
    _pattern: T.Pattern;
    _value: T.Expression;
    _body: T.Block;
    label(): T.Label | undefined;
    pattern(): T.Pattern;
    value(): T.Expression;
    body(): T.Block;
    $with: {
        label: (value?: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function forLifetimes(...children: T.Lifetime[]): {
    $type: TSKindId.ForLifetimes;
    $source: 2;
    $named: true;
    _lifetime: T.Lifetime[] & readonly [T.Lifetime, ...T.Lifetime[]];
    lifetimes(): T.Lifetime[] & readonly [T.Lifetime, ...T.Lifetime[]];
    $with: {
        $children: (...vs: T.Lifetime[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function foreignModItemBody(body: T.ForeignModItemBody.Config['body']): {
    $type: TSKindId._ForeignModItemBody;
    $source: 2;
    $named: true;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (value: T.ForeignModItemBody.Config['body']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function foreignModItem(config: ConfigOf<T.ForeignModItemUFormSemi>): ReturnType<typeof foreignModItemUFormSemi>;
export declare function foreignModItem(config: ConfigOf<T.ForeignModItemUFormBody>): ReturnType<typeof foreignModItemUFormBody>;
export declare function foreignModItemUFormSemi(config: Omit<ConfigOf<T.ForeignModItemUFormSemi>, '$variant'>): {
    $type: TSKindId.ForeignModItem;
    $source: 2;
    $named: true;
    $variant: 'semi';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _extern_modifier: T.ExternModifier;
    _foreign_mod_item_semi: unknown;
    visibilityModifier(): T.VisibilityModifier | undefined;
    externModifier(): T.ExternModifier;
    foreignModItemSemi(): unknown;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        externModifier: (value: T.ExternModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function foreignModItemUFormBody(config: Omit<ConfigOf<T.ForeignModItemUFormBody>, '$variant'>): {
    $type: TSKindId.ForeignModItem;
    $source: 2;
    $named: true;
    $variant: 'body';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _extern_modifier: T.ExternModifier;
    _foreign_mod_item_body: T._ForeignModItemBody;
    visibilityModifier(): T.VisibilityModifier | undefined;
    externModifier(): T.ExternModifier;
    foreignModItemBody(): T._ForeignModItemBody;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        externModifier: (value: T.ExternModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        foreignModItemBody: (value: T._ForeignModItemBody) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function fragmentSpecifier(text: 'block' | 'expr' | 'expr_2021' | 'ident' | 'item' | 'lifetime' | 'literal' | 'meta' | 'pat' | 'pat_param' | 'path' | 'stmt' | 'tt' | 'ty' | 'vis'): {
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
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function functionItem(config: T.FunctionItem.Config): {
    $type: TSKindId.FunctionItem;
    $source: 2;
    $named: true;
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
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        functionModifiers: (value?: T.FunctionModifiers) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier | T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        parameters: (value: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        returnType: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function functionModifiers(config: T.FunctionModifiers.Config): {
    $type: TSKindId.FunctionModifiers;
    $source: 2;
    $named: true;
    _modifier: readonly [T.Async | T.Const | T.Default | T.ExternModifier | T.Unsafe, ...(T.Async | T.Const | T.Default | T.ExternModifier | T.Unsafe)[]];
    modifiers(): readonly [T.Async | T.Const | T.Default | T.ExternModifier | T.Unsafe, ...(T.Async | T.Const | T.Default | T.ExternModifier | T.Unsafe)[]];
    $with: {
        modifiers: (values_0: T.Async | T.Const | T.Default | T.ExternModifier | T.Unsafe, ...values: (T.Async | T.Const | T.Default | T.ExternModifier | T.Unsafe)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function functionSignatureItem(config: T.FunctionSignatureItem.Config): {
    $type: TSKindId.FunctionSignatureItem;
    $source: 2;
    $named: true;
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
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        functionModifiers: (value?: T.FunctionModifiers) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier | T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        parameters: (value: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        returnType: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function functionType(config: T.FunctionType.Config): {
    $type: TSKindId.FunctionType;
    $source: 2;
    $named: true;
    _for_lifetimes: T.ForLifetimes | undefined;
    _parameters: T.Parameters;
    _function_type_trait_form: T.FunctionTypeFnForm | T.FunctionTypeTraitForm;
    _return_type: T._Type | undefined;
    forLifetimes(): T.ForLifetimes | undefined;
    parameters(): T.Parameters;
    functionTypeTraitForm(): T.FunctionTypeFnForm | T.FunctionTypeTraitForm;
    returnType(): T._Type | undefined;
    $with: {
        forLifetimes: (value?: T.ForLifetimes) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        parameters: (value: T.Parameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        functionTypeTraitForm: (value: T.FunctionTypeTraitForm | T.FunctionTypeFnForm) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        returnType: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function genBlock(config: T.GenBlock.Config): {
    $type: TSKindId.GenBlock;
    $source: 2;
    $named: true;
    _move_marker: true | undefined;
    _block: T.Block;
    moveMarker(): true | undefined;
    block(): T.Block;
    $with: {
        moveMarker: (value?: NonNullable<Parameters<typeof genBlock>[0]>['moveMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        block: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function genericFunction(config: T.GenericFunction.Config): {
    $type: TSKindId.GenericFunction;
    $source: 2;
    $named: true;
    _function: T.FieldExpression | T.Identifier | T.ScopedIdentifier;
    _type_arguments: T.TypeArguments;
    function(): T.FieldExpression | T.Identifier | T.ScopedIdentifier;
    typeArguments(): T.TypeArguments;
    $with: {
        function: (value: T.Identifier | T.ScopedIdentifier | T.FieldExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function genericPattern(config: T.GenericPattern.Config): {
    $type: TSKindId.GenericPattern;
    $source: 2;
    $named: true;
    _identifier: T.Identifier | T.ScopedIdentifier;
    _type_arguments: T.TypeArguments;
    identifier(): T.Identifier | T.ScopedIdentifier;
    typeArguments(): T.TypeArguments;
    $with: {
        identifier: (value: T.Identifier | T.ScopedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function genericType(config: T.GenericType.Config): {
    $type: TSKindId.GenericType;
    $source: 2;
    $named: true;
    _type: T.ReservedIdentifier | T.ScopedTypeIdentifier | T.TypeIdentifier;
    _type_arguments: T.TypeArguments;
    type(): T.ReservedIdentifier | T.ScopedTypeIdentifier | T.TypeIdentifier;
    typeArguments(): T.TypeArguments;
    $with: {
        type: (value: T.TypeIdentifier | T.ReservedIdentifier | T.ScopedTypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function genericTypeWithTurbofish(config: T.GenericTypeWithTurbofish.Config): {
    $type: TSKindId.GenericTypeWithTurbofish;
    $source: 2;
    $named: true;
    _type: T.ScopedIdentifier | T.TypeIdentifier;
    _turbofish: unknown;
    _type_arguments: T.TypeArguments;
    type(): T.ScopedIdentifier | T.TypeIdentifier;
    turbofish(): unknown;
    typeArguments(): T.TypeArguments;
    $with: {
        type: (value: T.TypeIdentifier | T.ScopedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function higherRankedTraitBound(config: T.HigherRankedTraitBound.Config): {
    $type: TSKindId.HigherRankedTraitBound;
    $source: 2;
    $named: true;
    _type_parameters: T.TypeParameters;
    _type: T._Type;
    typeParameters(): T.TypeParameters;
    type(): T._Type;
    $with: {
        typeParameters: (value: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
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
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function ifExpression(config: T.IfExpression.Config): {
    $type: TSKindId.IfExpression;
    $source: 2;
    $named: true;
    _condition: T.Condition;
    _consequence: T.Block;
    _alternative: T.ElseClause | undefined;
    condition(): T.Condition;
    consequence(): T.Block;
    alternative(): T.ElseClause | undefined;
    $with: {
        condition: (value: T.Condition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        consequence: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        alternative: (value?: T.ElseClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function implItemBody(body: T.ImplItemBody.Config['body']): {
    $type: TSKindId._ImplItemBody;
    $source: 2;
    $named: true;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (value: T.ImplItemBody.Config['body']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function implItem(config: ConfigOf<T.ImplItemUFormBody>): ReturnType<typeof implItemUFormBody>;
export declare function implItem(config: ConfigOf<T.ImplItemUFormSemi>): ReturnType<typeof implItemUFormSemi>;
export declare function implItemUFormBody(config: Omit<ConfigOf<T.ImplItemUFormBody>, '$variant'>): {
    $type: TSKindId.ImplItem;
    $source: 2;
    $named: true;
    $variant: 'body';
    _unsafe_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _negative: true | undefined;
    _trait: T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    _type: T._Type;
    _where_clause: T.WhereClause | undefined;
    _impl_item_body: T._ImplItemBody;
    unsafeMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    negative(): true | undefined;
    trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    type(): T._Type;
    whereClause(): T.WhereClause | undefined;
    implItemBody(): T._ImplItemBody;
    $with: {
        unsafeMarker: (value?: NonNullable<Parameters<typeof implItemUFormBody>[0]>['unsafeMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        negative: (value?: NonNullable<Parameters<typeof implItemUFormBody>[0]>['negative']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        trait: (value?: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        implItemBody: (value: T._ImplItemBody) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function implItemUFormSemi(config: Omit<ConfigOf<T.ImplItemUFormSemi>, '$variant'>): {
    $type: TSKindId.ImplItem;
    $source: 2;
    $named: true;
    $variant: 'semi';
    _unsafe_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _negative: true | undefined;
    _trait: T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    _type: T._Type;
    _where_clause: T.WhereClause | undefined;
    _impl_item_semi: unknown;
    unsafeMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    negative(): true | undefined;
    trait(): T.GenericType | T.ScopedTypeIdentifier | T.TypeIdentifier | undefined;
    type(): T._Type;
    whereClause(): T.WhereClause | undefined;
    implItemSemi(): unknown;
    $with: {
        unsafeMarker: (value?: NonNullable<Parameters<typeof implItemUFormSemi>[0]>['unsafeMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        negative: (value?: NonNullable<Parameters<typeof implItemUFormSemi>[0]>['negative']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        trait: (value?: T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function indexExpression(config: T.IndexExpression.Config): {
    $type: TSKindId.IndexExpression;
    $source: 2;
    $named: true;
    _object: T.Expression;
    _index: T.Expression;
    object(): T.Expression;
    index(): T.Expression;
    $with: {
        object: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        index: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function innerAttributeItem(attribute: T.InnerAttributeItem.Config['attribute']): {
    $type: TSKindId.InnerAttributeItem;
    $source: 2;
    $named: true;
    _attribute: T.Attribute;
    attribute(): T.Attribute;
    $with: {
        attribute: (value: T.InnerAttributeItem.Config['attribute']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function integerLiteral(text: string): {
    $type: TSKindId.IntegerLiteral;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function label(identifier: T.Label.Config['identifier']): {
    $type: TSKindId.Label;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    identifier(): T.Identifier;
    $with: {
        identifier: (value: T.Label.Config['identifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lastMatchArm(config: T.LastMatchArm.Config): {
    $type: TSKindId.LastMatchArm;
    $source: 2;
    $named: true;
    _attribute_item: readonly (T.AttributeItem | T.InnerAttributeItem)[] | undefined;
    _pattern: T.MatchPattern;
    _value: T.Expression;
    attributeItems(): readonly (T.AttributeItem | T.InnerAttributeItem)[] | undefined;
    pattern(): T.MatchPattern;
    value(): T.Expression;
    $with: {
        attributeItems: (...values: (T.AttributeItem | T.InnerAttributeItem)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.MatchPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function letCondition(config: T.LetCondition.Config): {
    $type: TSKindId.LetCondition;
    $source: 2;
    $named: true;
    _pattern: T.Pattern;
    _value: T.Expression;
    pattern(): T.Pattern;
    value(): T.Expression;
    $with: {
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function letDeclaration(config: T.LetDeclaration.Config): {
    $type: TSKindId.LetDeclaration;
    $source: 2;
    $named: true;
    _mutable_specifier: true | undefined;
    _pattern: T.Pattern;
    _type: T._Type | undefined;
    _value: T.Expression | undefined;
    _alternative: T.Block | undefined;
    mutableSpecifier(): true | undefined;
    pattern(): T.Pattern;
    type(): T._Type | undefined;
    value(): T.Expression | undefined;
    alternative(): T.Block | undefined;
    $with: {
        mutableSpecifier: (value?: NonNullable<Parameters<typeof letDeclaration>[0]>['mutableSpecifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        alternative: (value?: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lifetime(identifier: T.Lifetime.Config['identifier']): {
    $type: TSKindId.Lifetime;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    identifier(): T.Identifier;
    $with: {
        identifier: (value: T.Lifetime.Config['identifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lifetimeParameter(config: T.LifetimeParameter.Config): {
    $type: TSKindId.LifetimeParameter;
    $source: 2;
    $named: true;
    _name: T.Lifetime;
    _bounds: T.TraitBounds | undefined;
    name(): T.Lifetime;
    bounds(): T.TraitBounds | undefined;
    $with: {
        name: (value: T.Lifetime) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        bounds: (value?: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lineComment(config: ConfigOf<T.LineCommentUFormRegularDslash>): ReturnType<typeof lineCommentUFormRegularDslash>;
export declare function lineComment(config: ConfigOf<T.LineCommentUFormDoc>): ReturnType<typeof lineCommentUFormDoc>;
export declare function lineComment(config: ConfigOf<T.LineCommentUFormContent>): ReturnType<typeof lineCommentUFormContent>;
export declare function lineCommentUFormRegularDslash(config: Omit<ConfigOf<T.LineCommentUFormRegularDslash>, '$variant'>): {
    $type: TSKindId.LineComment;
    $source: 2;
    $named: true;
    $variant: 'regular_dslash';
    _line_comment_regular_dslash: T.LineCommentRegularDslash;
    lineCommentRegularDslash(): T.LineCommentRegularDslash;
    $with: {
        lineCommentRegularDslash: (value: T.LineCommentRegularDslash) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lineCommentUFormDoc(config: Omit<ConfigOf<T.LineCommentUFormDoc>, '$variant'>): {
    $type: TSKindId.LineComment;
    $source: 2;
    $named: true;
    $variant: 'doc';
    _line_comment_doc: T.LineCommentDoc;
    lineCommentDoc(): T.LineCommentDoc;
    $with: {
        lineCommentDoc: (value: T.LineCommentDoc) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lineCommentUFormContent(config: Omit<ConfigOf<T.LineCommentUFormContent>, '$variant'>): {
    $type: TSKindId.LineComment;
    $source: 2;
    $named: true;
    $variant: 'content';
    _line_comment_content: T.LineCommentContent;
    lineCommentContent(): T.LineCommentContent;
    $with: {
        lineCommentContent: (value: T.LineCommentContent) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function loopExpression(config: T.LoopExpression.Config): {
    $type: TSKindId.LoopExpression;
    $source: 2;
    $named: true;
    _label: T.Label | undefined;
    _body: T.Block;
    label(): T.Label | undefined;
    body(): T.Block;
    $with: {
        label: (value?: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function macroDefinitionParen(...children: T.MacroRule[]): {
    $type: TSKindId._MacroDefinitionParen;
    $source: 2;
    $named: true;
    _macro_rule: T.MacroRule[];
    macroRules(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function macroDefinitionBracket(...children: T.MacroRule[]): {
    $type: TSKindId._MacroDefinitionBracket;
    $source: 2;
    $named: true;
    _macro_rule: T.MacroRule[];
    macroRules(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function macroDefinitionBrace(...children: T.MacroRule[]): {
    $type: TSKindId._MacroDefinitionBrace;
    $source: 2;
    $named: true;
    _macro_rule: T.MacroRule[];
    macroRules(): T.MacroRule[];
    $with: {
        $children: (...vs: T.MacroRule[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function macroDefinition(config: ConfigOf<T.MacroDefinitionUFormParen>): ReturnType<typeof macroDefinitionUFormParen>;
export declare function macroDefinition(config: ConfigOf<T.MacroDefinitionUFormBracket>): ReturnType<typeof macroDefinitionUFormBracket>;
export declare function macroDefinition(config: ConfigOf<T.MacroDefinitionUFormBrace>): ReturnType<typeof macroDefinitionUFormBrace>;
export declare function macroDefinitionUFormParen(config: Omit<ConfigOf<T.MacroDefinitionUFormParen>, '$variant'>): {
    $type: TSKindId.MacroDefinition;
    $source: 2;
    $named: true;
    $variant: 'paren';
    _name: T.Identifier | T.ReservedIdentifier;
    _macro_definition_paren: T._MacroDefinitionParen;
    name(): T.Identifier | T.ReservedIdentifier;
    macroDefinitionParen(): T._MacroDefinitionParen;
    $with: {
        name: (value: T.Identifier | T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        macroDefinitionParen: (value: T._MacroDefinitionParen) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function macroDefinitionUFormBracket(config: Omit<ConfigOf<T.MacroDefinitionUFormBracket>, '$variant'>): {
    $type: TSKindId.MacroDefinition;
    $source: 2;
    $named: true;
    $variant: 'bracket';
    _name: T.Identifier | T.ReservedIdentifier;
    _macro_definition_bracket: T._MacroDefinitionBracket;
    name(): T.Identifier | T.ReservedIdentifier;
    macroDefinitionBracket(): T._MacroDefinitionBracket;
    $with: {
        name: (value: T.Identifier | T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        macroDefinitionBracket: (value: T._MacroDefinitionBracket) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function macroDefinitionUFormBrace(config: Omit<ConfigOf<T.MacroDefinitionUFormBrace>, '$variant'>): {
    $type: TSKindId.MacroDefinition;
    $source: 2;
    $named: true;
    $variant: 'brace';
    _name: T.Identifier | T.ReservedIdentifier;
    _macro_definition_brace: T._MacroDefinitionBrace;
    name(): T.Identifier | T.ReservedIdentifier;
    macroDefinitionBrace(): T._MacroDefinitionBrace;
    $with: {
        name: (value: T.Identifier | T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        macroDefinitionBrace: (value: T._MacroDefinitionBrace) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function macroInvocation(config: T.MacroInvocation.Config): {
    $type: TSKindId.MacroInvocation;
    $source: 2;
    $named: true;
    _macro: T.Identifier | T.ReservedIdentifier | T.ScopedIdentifier;
    _token_tree: T.DelimTokenTree;
    macro(): T.Identifier | T.ReservedIdentifier | T.ScopedIdentifier;
    tokenTree(): T.DelimTokenTree;
    $with: {
        macro: (value: T.ScopedIdentifier | T.Identifier | T.ReservedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        tokenTree: (value: T.DelimTokenTree) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function macroRule(config: T.MacroRule.Config): {
    $type: TSKindId.MacroRule;
    $source: 2;
    $named: true;
    _left: T.TokenTreePattern;
    _right: T.TokenTree;
    left(): T.TokenTreePattern;
    right(): T.TokenTree;
    $with: {
        left: (value: T.TokenTreePattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        right: (value: T.TokenTree) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function matchArmBlockEnding(value: T.MatchArmBlockEnding.Config['value']): {
    $type: TSKindId._MatchArmBlockEnding;
    $source: 2;
    $named: true;
    _value: T.ExpressionEndingWithBlock;
    value(): T.ExpressionEndingWithBlock;
    $with: {
        value: (value: T.MatchArmBlockEnding.Config['value']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function matchArm(config: ConfigOf<T.MatchArmUFormWithComma>): ReturnType<typeof matchArmUFormWithComma>;
export declare function matchArm(config: ConfigOf<T.MatchArmUFormBlockEnding>): ReturnType<typeof matchArmUFormBlockEnding>;
export declare function matchArmUFormWithComma(config: Omit<ConfigOf<T.MatchArmUFormWithComma>, '$variant'>): {
    $type: TSKindId.MatchArm;
    $source: 2;
    $named: true;
    $variant: 'with_comma';
    _attributes: readonly (T.AttributeItem | T.InnerAttributeItem)[] | undefined;
    _pattern: T.MatchPattern;
    _match_arm_with_comma: T.MatchArmWithComma;
    attributes(): readonly (T.AttributeItem | T.InnerAttributeItem)[] | undefined;
    pattern(): T.MatchPattern;
    matchArmWithComma(): T.MatchArmWithComma;
    $with: {
        attributes: (...values: (T.AttributeItem | T.InnerAttributeItem)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.MatchPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        matchArmWithComma: (value: T.MatchArmWithComma) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function matchArmUFormBlockEnding(config: Omit<ConfigOf<T.MatchArmUFormBlockEnding>, '$variant'>): {
    $type: TSKindId.MatchArm;
    $source: 2;
    $named: true;
    $variant: 'block_ending';
    _attributes: readonly (T.AttributeItem | T.InnerAttributeItem)[] | undefined;
    _pattern: T.MatchPattern;
    _match_arm_block_ending: T._MatchArmBlockEnding;
    attributes(): readonly (T.AttributeItem | T.InnerAttributeItem)[] | undefined;
    pattern(): T.MatchPattern;
    matchArmBlockEnding(): T._MatchArmBlockEnding;
    $with: {
        attributes: (...values: (T.AttributeItem | T.InnerAttributeItem)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.MatchPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        matchArmBlockEnding: (value: T._MatchArmBlockEnding) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function matchBlock(...children: (T.MatchArm | T.LastMatchArm)[]): {
    $type: TSKindId.MatchBlock;
    $source: 2;
    $named: true;
    _match_arm: (T.LastMatchArm | T.MatchArm)[];
    matchArms(): (T.LastMatchArm | T.MatchArm)[];
    $with: {
        $children: (...vs: (T.MatchArm | T.LastMatchArm)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function matchExpression(config: T.MatchExpression.Config): {
    $type: TSKindId.MatchExpression;
    $source: 2;
    $named: true;
    _value: T.Expression;
    _body: T.MatchBlock;
    value(): T.Expression;
    body(): T.MatchBlock;
    $with: {
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.MatchBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function matchPattern(config: T.MatchPattern.Config): {
    $type: TSKindId.MatchPattern;
    $source: 2;
    $named: true;
    _pattern: T.Pattern;
    _condition: T.Condition | undefined;
    pattern(): T.Pattern;
    condition(): T.Condition | undefined;
    $with: {
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        condition: (value?: T.Condition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function metavariable(text: string): {
    $type: TSKindId.Metavariable;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function modItemInline(body: T.ModItemInline.Config['body']): {
    $type: TSKindId._ModItemInline;
    $source: 2;
    $named: true;
    _body: T.DeclarationList;
    body(): T.DeclarationList;
    $with: {
        body: (value: T.ModItemInline.Config['body']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function modItem(config: ConfigOf<T.ModItemUFormExternal>): ReturnType<typeof modItemUFormExternal>;
export declare function modItem(config: ConfigOf<T.ModItemUFormInline>): ReturnType<typeof modItemUFormInline>;
export declare function modItemUFormExternal(config: Omit<ConfigOf<T.ModItemUFormExternal>, '$variant'>): {
    $type: TSKindId.ModItem;
    $source: 2;
    $named: true;
    $variant: 'external';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.Identifier;
    _mod_item_external: unknown;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.Identifier;
    modItemExternal(): unknown;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function modItemUFormInline(config: Omit<ConfigOf<T.ModItemUFormInline>, '$variant'>): {
    $type: TSKindId.ModItem;
    $source: 2;
    $named: true;
    $variant: 'inline';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.Identifier;
    _mod_item_inline: T._ModItemInline;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.Identifier;
    modItemInline(): T._ModItemInline;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        modItemInline: (value: T._ModItemInline) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function mutPattern(pattern: T.MutPattern.Config['pattern']): {
    $type: TSKindId.MutPattern;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut";
    _pattern: T.Pattern;
    mutableSpecifier(): "mut";
    pattern(): T.Pattern;
    $with: {
        pattern: (value: T.MutPattern.Config['pattern']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function mutableSpecifier(): {
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
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function negativeLiteral(value: T.NegativeLiteral.Config['value']): {
    $type: TSKindId.NegativeLiteral;
    $source: 2;
    $named: true;
    _value: T.FloatLiteral | T.IntegerLiteral;
    value(): T.FloatLiteral | T.IntegerLiteral;
    $with: {
        value: (value: T.NegativeLiteral.Config['value']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function orPattern(config: ConfigOf<T.OrPatternUFormBinary>): ReturnType<typeof orPatternUFormBinary>;
export declare function orPattern(config: ConfigOf<T.OrPatternUFormPrefix>): ReturnType<typeof orPatternUFormPrefix>;
export declare function orPatternUFormBinary(config: Omit<ConfigOf<T.OrPatternUFormBinary>, '$variant'>): {
    $type: TSKindId.OrPattern;
    $source: 2;
    $named: true;
    $variant: 'binary';
    _or_pattern_binary: T.OrPatternBinary;
    orPatternBinary(): T.OrPatternBinary;
    $with: {
        orPatternBinary: (value: T.OrPatternBinary) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function orPatternUFormPrefix(config: Omit<ConfigOf<T.OrPatternUFormPrefix>, '$variant'>): {
    $type: TSKindId.OrPattern;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    _or_pattern_prefix: T.OrPatternPrefix;
    orPatternPrefix(): T.OrPatternPrefix;
    $with: {
        orPatternPrefix: (value: T.OrPatternPrefix) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function orderedFieldDeclarationList(config?: Partial<T.OrderedFieldDeclarationList.Config>): {
    $type: TSKindId.OrderedFieldDeclarationList;
    $source: 2;
    $named: true;
    _attribute_item: readonly T.AttributeItem[] | undefined;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _type: readonly T._Type[] | undefined;
    attributeItems(): readonly T.AttributeItem[] | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    types(): readonly T._Type[] | undefined;
    $with: {
        attributeItems: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        types: (...values: T._Type[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function parameter(config: T.Parameter.Config): {
    $type: TSKindId.Parameter;
    $source: 2;
    $named: true;
    _mutable_specifier: true | undefined;
    _pattern: T.Self | T.Pattern;
    _type: T._Type;
    mutableSpecifier(): true | undefined;
    pattern(): T.Self | T.Pattern;
    type(): T._Type;
    $with: {
        mutableSpecifier: (value?: NonNullable<Parameters<typeof parameter>[0]>['mutableSpecifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.Pattern | T.Self) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function parameters(...children: T.AttributedParameter[]): {
    $type: TSKindId.Parameters;
    $source: 2;
    $named: true;
    _attributed_parameter: T.AttributedParameter[];
    attributedParameters(): T.AttributedParameter[];
    $with: {
        $children: (...vs: T.AttributedParameter[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function parenthesizedExpression(expression: T.ParenthesizedExpression.Config['expression']): {
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.ParenthesizedExpression.Config['expression']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function pointerTypeMut(_config?: T.PointerTypeMut.Config): {
    $type: TSKindId._PointerTypeMut;
    $source: 2;
    $named: true;
    _mutable_specifier: "mut";
    mutableSpecifier(): "mut";
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function pointerType(config: ConfigOf<T.PointerTypeUFormConst>): ReturnType<typeof pointerTypeUFormConst>;
export declare function pointerType(config: ConfigOf<T.PointerTypeUFormMut>): ReturnType<typeof pointerTypeUFormMut>;
export declare function pointerTypeUFormConst(config: Omit<ConfigOf<T.PointerTypeUFormConst>, '$variant'>): {
    $type: TSKindId.PointerType;
    $source: 2;
    $named: true;
    $variant: 'const';
    _pointer_type_const: unknown;
    _type: T._Type;
    pointerTypeConst(): unknown;
    type(): T._Type;
    $with: {
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function pointerTypeUFormMut(config: Omit<ConfigOf<T.PointerTypeUFormMut>, '$variant'>): {
    $type: TSKindId.PointerType;
    $source: 2;
    $named: true;
    $variant: 'mut';
    _pointer_type_mut: {
        $type: TSKindId._PointerTypeMut;
        $source: 2;
        $named: true;
        _mutable_specifier: "mut";
        mutableSpecifier(): "mut";
        $with: {};
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.BlockComment | T.LineComment | {
            leading?: (T.BlockComment | T.LineComment)[];
            trailing?: (T.BlockComment | T.LineComment)[];
        })[]): import("@sittir/types").AnyNodeData;
    };
    _type: T._Type;
    pointerTypeMut(): {
        $type: TSKindId._PointerTypeMut;
        $source: 2;
        $named: true;
        _mutable_specifier: "mut";
        mutableSpecifier(): "mut";
        $with: {};
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.BlockComment | T.LineComment | {
            leading?: (T.BlockComment | T.LineComment)[];
            trailing?: (T.BlockComment | T.LineComment)[];
        })[]): import("@sittir/types").AnyNodeData;
    };
    type(): T._Type;
    $with: {
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function qualifiedType(config: T.QualifiedType.Config): {
    $type: TSKindId.QualifiedType;
    $source: 2;
    $named: true;
    _type: T._Type;
    _alias: T._Type;
    type(): T._Type;
    alias(): T._Type;
    $with: {
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        alias: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rangeExpressionBare(_config?: T.RangeExpressionBare.Config): {
    $type: TSKindId._RangeExpressionBare;
    $source: 2;
    $named: true;
    _operator: unknown;
    operator(): unknown;
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rangeExpression(config: ConfigOf<T.RangeExpressionUFormBinary>): ReturnType<typeof rangeExpressionUFormBinary>;
export declare function rangeExpression(config: ConfigOf<T.RangeExpressionUFormPostfix>): ReturnType<typeof rangeExpressionUFormPostfix>;
export declare function rangeExpression(config: ConfigOf<T.RangeExpressionUFormPrefix>): ReturnType<typeof rangeExpressionUFormPrefix>;
export declare function rangeExpression(config: ConfigOf<T.RangeExpressionUFormBare>): ReturnType<typeof rangeExpressionUFormBare>;
export declare function rangeExpressionUFormBinary(config: Omit<ConfigOf<T.RangeExpressionUFormBinary>, '$variant'>): {
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'binary';
    _range_expression_binary: T.RangeExpressionBinary;
    rangeExpressionBinary(): T.RangeExpressionBinary;
    $with: {
        rangeExpressionBinary: (value: T.RangeExpressionBinary) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rangeExpressionUFormPostfix(config: Omit<ConfigOf<T.RangeExpressionUFormPostfix>, '$variant'>): {
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'postfix';
    _range_expression_postfix: T.RangeExpressionPostfix;
    rangeExpressionPostfix(): T.RangeExpressionPostfix;
    $with: {
        rangeExpressionPostfix: (value: T.RangeExpressionPostfix) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rangeExpressionUFormPrefix(config: Omit<ConfigOf<T.RangeExpressionUFormPrefix>, '$variant'>): {
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    _range_expression_prefix: T.RangeExpressionPrefix;
    rangeExpressionPrefix(): T.RangeExpressionPrefix;
    $with: {
        rangeExpressionPrefix: (value: T.RangeExpressionPrefix) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rangeExpressionUFormBare(_config?: Omit<ConfigOf<T.RangeExpressionUFormBare>, '$variant'>): {
    $type: TSKindId.RangeExpression;
    $source: 2;
    $named: true;
    $variant: 'bare';
    _range_expression_bare: {
        $type: TSKindId._RangeExpressionBare;
        $source: 2;
        $named: true;
        _operator: unknown;
        operator(): unknown;
        $with: {};
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.BlockComment | T.LineComment | {
            leading?: (T.BlockComment | T.LineComment)[];
            trailing?: (T.BlockComment | T.LineComment)[];
        })[]): import("@sittir/types").AnyNodeData;
    };
    rangeExpressionBare(): {
        $type: TSKindId._RangeExpressionBare;
        $source: 2;
        $named: true;
        _operator: unknown;
        operator(): unknown;
        $with: {};
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.BlockComment | T.LineComment | {
            leading?: (T.BlockComment | T.LineComment)[];
            trailing?: (T.BlockComment | T.LineComment)[];
        })[]): import("@sittir/types").AnyNodeData;
    };
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rangePattern(config: ConfigOf<T.RangePatternUFormPrefix>): ReturnType<typeof rangePatternUFormPrefix>;
export declare function rangePattern(config: ConfigOf<T.RangePatternUFormLeftWithRight>): ReturnType<typeof rangePatternUFormLeftWithRight>;
export declare function rangePattern(config: ConfigOf<T.RangePatternUFormLeftBare>): ReturnType<typeof rangePatternUFormLeftBare>;
export declare function rangePatternUFormPrefix(config: Omit<ConfigOf<T.RangePatternUFormPrefix>, '$variant'>): {
    $type: TSKindId.RangePattern;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    _range_pattern_prefix: T.RangePatternPrefix;
    rangePatternPrefix(): T.RangePatternPrefix;
    $with: {
        rangePatternPrefix: (value: T.RangePatternPrefix) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rangePatternUFormLeftWithRight(config: Omit<ConfigOf<T.RangePatternUFormLeftWithRight>, '$variant'>): {
    $type: TSKindId.RangePattern;
    $source: 2;
    $named: true;
    $variant: 'left_with_right';
    _left: T.LiteralPattern | T.Path;
    _range_pattern_left_with_right: T.RangePatternLeftWithRight;
    left(): T.LiteralPattern | T.Path;
    rangePatternLeftWithRight(): T.RangePatternLeftWithRight;
    $with: {
        left: (value: T.LiteralPattern | T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        rangePatternLeftWithRight: (value: T.RangePatternLeftWithRight) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rangePatternUFormLeftBare(config: Omit<ConfigOf<T.RangePatternUFormLeftBare>, '$variant'>): {
    $type: TSKindId.RangePattern;
    $source: 2;
    $named: true;
    $variant: 'left_bare';
    _left: T.LiteralPattern | T.Path;
    _range_pattern_left_bare: unknown;
    left(): T.LiteralPattern | T.Path;
    rangePatternLeftBare(): unknown;
    $with: {
        left: (value: T.LiteralPattern | T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rawStringLiteral(stringContent: T.RawStringLiteral.Config['stringContent']): {
    $type: TSKindId.RawStringLiteral;
    $source: 2;
    $named: true;
    _string_content: T.RawStringLiteralContent;
    stringContent(): T.RawStringLiteralContent;
    $with: {
        stringContent: (value: T.RawStringLiteral.Config['stringContent']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function refPattern(pattern: T.RefPattern.Config['pattern']): {
    $type: TSKindId.RefPattern;
    $source: 2;
    $named: true;
    _pattern: T.Pattern;
    pattern(): T.Pattern;
    $with: {
        pattern: (value: T.RefPattern.Config['pattern']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function referenceExpression(config: T.ReferenceExpression.Config): {
    $type: TSKindId.ReferenceExpression;
    $source: 2;
    $named: true;
    _reference_expression_raw_const: T.MutableSpecifier | T.ReferenceExpressionRawConst | T.ReferenceExpressionRawMut | undefined;
    _value: T.Expression;
    referenceExpressionRawConst(): T.MutableSpecifier | T.ReferenceExpressionRawConst | T.ReferenceExpressionRawMut | undefined;
    value(): T.Expression;
    $with: {
        referenceExpressionRawConst: (value?: T.ReferenceExpressionRawConst | T.ReferenceExpressionRawMut | T.MutableSpecifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function referencePattern(config: T.ReferencePattern.Config): {
    $type: TSKindId.ReferencePattern;
    $source: 2;
    $named: true;
    _mutable_specifier: true | undefined;
    _pattern: T.Pattern;
    mutableSpecifier(): true | undefined;
    pattern(): T.Pattern;
    $with: {
        mutableSpecifier: (value?: NonNullable<Parameters<typeof referencePattern>[0]>['mutableSpecifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function referenceType(config: T.ReferenceType.Config): {
    $type: TSKindId.ReferenceType;
    $source: 2;
    $named: true;
    _lifetime: T.Lifetime | undefined;
    _mutable_specifier: true | undefined;
    _type: T._Type;
    lifetime(): T.Lifetime | undefined;
    mutableSpecifier(): true | undefined;
    type(): T._Type;
    $with: {
        lifetime: (value?: T.Lifetime) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        mutableSpecifier: (value?: NonNullable<Parameters<typeof referenceType>[0]>['mutableSpecifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function removedTraitBound(type: T.RemovedTraitBound.Config['type']): {
    $type: TSKindId.RemovedTraitBound;
    $source: 2;
    $named: true;
    _type: T._Type;
    type(): T._Type;
    $with: {
        type: (value: T.RemovedTraitBound.Config['type']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function returnExpression(child?: T.Expression): {
    $type: TSKindId.ReturnExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression | undefined;
    expression(): T.Expression | undefined;
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function scopedIdentifier(config: T.ScopedIdentifier.Config): {
    $type: TSKindId.ScopedIdentifier;
    $source: 2;
    $named: true;
    _path: T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    _name: T.Identifier | T.Super;
    path(): T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    name(): T.Identifier | T.Super;
    $with: {
        path: (value?: T.Path | T.BracketedType | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier | T.Super) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function scopedTypeIdentifier(config: T.ScopedTypeIdentifier.Config): {
    $type: TSKindId.ScopedTypeIdentifier;
    $source: 2;
    $named: true;
    _path: T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    _name: T.TypeIdentifier;
    path(): T.BracketedType | T.GenericTypeWithTurbofish | T.Path | undefined;
    name(): T.TypeIdentifier;
    $with: {
        path: (value?: T.Path | T.GenericTypeWithTurbofish | T.BracketedType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function scopedTypeIdentifierInExpressionPosition(config: T.ScopedTypeIdentifierInExpressionPosition.Config): {
    $type: TSKindId.ScopedTypeIdentifierInExpressionPosition;
    $source: 2;
    $named: true;
    _path: T.GenericTypeWithTurbofish | T.Path | undefined;
    _name: T.TypeIdentifier;
    path(): T.GenericTypeWithTurbofish | T.Path | undefined;
    name(): T.TypeIdentifier;
    $with: {
        path: (value?: T.Path | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function scopedUseList(config: T.ScopedUseList.Config): {
    $type: TSKindId.ScopedUseList;
    $source: 2;
    $named: true;
    _path: T.Path | undefined;
    _list: T.UseList;
    path(): T.Path | undefined;
    list(): T.UseList;
    $with: {
        path: (value?: T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        list: (value: T.UseList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function self(): {
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
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function selfParameter(config?: Partial<T.SelfParameter.Config>): {
    $type: TSKindId.SelfParameter;
    $source: 2;
    $named: true;
    _reference: true | undefined;
    _lifetime: T.Lifetime | undefined;
    _mutable_specifier: true | undefined;
    _self: unknown;
    reference(): true | undefined;
    lifetime(): T.Lifetime | undefined;
    mutableSpecifier(): true | undefined;
    self(): unknown;
    $with: {
        reference: (value?: NonNullable<Parameters<typeof selfParameter>[0]>['reference']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        lifetime: (value?: T.Lifetime) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        mutableSpecifier: (value?: NonNullable<Parameters<typeof selfParameter>[0]>['mutableSpecifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function shebang(text: string): {
    $type: TSKindId.Shebang;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function shorthandFieldInitializer(config: T.ShorthandFieldInitializer.Config): {
    $type: TSKindId.ShorthandFieldInitializer;
    $source: 2;
    $named: true;
    _attributes: readonly T.AttributeItem[] | undefined;
    _identifier: T.Identifier;
    attributes(): readonly T.AttributeItem[] | undefined;
    identifier(): T.Identifier;
    $with: {
        attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        identifier: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function slicePattern(...children: T.Pattern[]): {
    $type: TSKindId.SlicePattern;
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function sourceFile(config?: Partial<T.SourceFile.Config>): {
    $type: TSKindId.SourceFile;
    $source: 2;
    $named: true;
    _shebang: T.Shebang | undefined;
    _statements: readonly T.Statement[] | undefined;
    shebang(): T.Shebang | undefined;
    statements(): readonly T.Statement[] | undefined;
    $with: {
        shebang: (value?: T.Shebang) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        statements: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function staticItem(config: T.StaticItem.Config): {
    $type: TSKindId.StaticItem;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _mutable_specifier: "mut" | "ref" | undefined;
    _name: T.Identifier;
    _type: T._Type;
    _value: T.Expression | undefined;
    visibilityModifier(): T.VisibilityModifier | undefined;
    mutableSpecifier(): "mut" | "ref" | undefined;
    name(): T.Identifier;
    type(): T._Type;
    value(): T.Expression | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        mutableSpecifier: (value?: "ref" | "mut") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        value: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function stringLiteral(...children: (T.EscapeSequence | T.StringContent)[]): {
    $type: TSKindId.StringLiteral;
    $source: 2;
    $named: true;
    _escape_sequence: (T.EscapeSequence | T.StringContent)[];
    escapeSequences(): (T.EscapeSequence | T.StringContent)[];
    $with: {
        $children: (...vs: (T.EscapeSequence | T.StringContent)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function structExpression(config: T.StructExpression.Config): {
    $type: TSKindId.StructExpression;
    $source: 2;
    $named: true;
    _name: T.GenericTypeWithTurbofish | T.ScopedTypeIdentifierInExpressionPosition | T.TypeIdentifier;
    _body: T.FieldInitializerList;
    name(): T.GenericTypeWithTurbofish | T.ScopedTypeIdentifierInExpressionPosition | T.TypeIdentifier;
    body(): T.FieldInitializerList;
    $with: {
        name: (value: T.TypeIdentifier | T.ScopedTypeIdentifierInExpressionPosition | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.FieldInitializerList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function structItem(config: ConfigOf<T.StructItemUFormBrace>): ReturnType<typeof structItemUFormBrace>;
export declare function structItem(config: ConfigOf<T.StructItemUFormTuple>): ReturnType<typeof structItemUFormTuple>;
export declare function structItem(config: ConfigOf<T.StructItemUFormUnit>): ReturnType<typeof structItemUFormUnit>;
export declare function structItemUFormBrace(config: Omit<ConfigOf<T.StructItemUFormBrace>, '$variant'>): {
    $type: TSKindId.StructItem;
    $source: 2;
    $named: true;
    $variant: 'brace';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _struct_item_brace: T.StructItemBrace;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    structItemBrace(): T.StructItemBrace;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        structItemBrace: (value: T.StructItemBrace) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function structItemUFormTuple(config: Omit<ConfigOf<T.StructItemUFormTuple>, '$variant'>): {
    $type: TSKindId.StructItem;
    $source: 2;
    $named: true;
    $variant: 'tuple';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _struct_item_tuple: T.StructItemTuple;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    structItemTuple(): T.StructItemTuple;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        structItemTuple: (value: T.StructItemTuple) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function structItemUFormUnit(config: Omit<ConfigOf<T.StructItemUFormUnit>, '$variant'>): {
    $type: TSKindId.StructItem;
    $source: 2;
    $named: true;
    $variant: 'unit';
    _visibility_modifier: T.VisibilityModifier | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _struct_item_unit: unknown;
    visibilityModifier(): T.VisibilityModifier | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    structItemUnit(): unknown;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function structPattern(config: T.StructPattern.Config): {
    $type: TSKindId.StructPattern;
    $source: 2;
    $named: true;
    _type: T.ScopedTypeIdentifier | T.TypeIdentifier;
    _field_pattern: readonly (T.RemainingFieldPattern | T.FieldPattern)[] | undefined;
    type(): T.ScopedTypeIdentifier | T.TypeIdentifier;
    fieldPatterns(): readonly (T.RemainingFieldPattern | T.FieldPattern)[] | undefined;
    $with: {
        type: (value: T.TypeIdentifier | T.ScopedTypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        fieldPatterns: (...values: (T.FieldPattern | T.RemainingFieldPattern)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function super_(): {
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
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenBindingPattern(config: T.TokenBindingPattern.Config): {
    $type: TSKindId.TokenBindingPattern;
    $source: 2;
    $named: true;
    _name: T.Metavariable;
    _type: unknown;
    name(): T.Metavariable;
    type(): unknown;
    $with: {
        name: (value: T.Metavariable) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: NonNullable<Parameters<typeof tokenBindingPattern>[0]>['type']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenRepetition(...children: T.Tokens[]): {
    $type: TSKindId.TokenRepetition;
    $source: 2;
    $named: true;
    _tokens: T.Tokens[];
    tokens(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenRepetitionPattern(...children: T.TokenPattern[]): {
    $type: TSKindId.TokenRepetitionPattern;
    $source: 2;
    $named: true;
    _token_pattern: T.TokenPattern[];
    tokenPatterns(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreeParen(...children: T.Tokens[]): {
    $type: TSKindId._TokenTreeParen;
    $source: 2;
    $named: true;
    _tokens: T.Tokens[];
    tokens(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreeBracket(...children: T.Tokens[]): {
    $type: TSKindId._TokenTreeBracket;
    $source: 2;
    $named: true;
    _tokens: T.Tokens[];
    tokens(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreeBrace(...children: T.Tokens[]): {
    $type: TSKindId._TokenTreeBrace;
    $source: 2;
    $named: true;
    _tokens: T.Tokens[];
    tokens(): T.Tokens[];
    $with: {
        $children: (...vs: T.Tokens[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTree(config: ConfigOf<T.TokenTreeUFormParen>): ReturnType<typeof tokenTreeUFormParen>;
export declare function tokenTree(config: ConfigOf<T.TokenTreeUFormBracket>): ReturnType<typeof tokenTreeUFormBracket>;
export declare function tokenTree(config: ConfigOf<T.TokenTreeUFormBrace>): ReturnType<typeof tokenTreeUFormBrace>;
export declare function tokenTreeUFormParen(config: Omit<ConfigOf<T.TokenTreeUFormParen>, '$variant'>): {
    $type: TSKindId.TokenTree;
    $source: 2;
    $named: true;
    $variant: 'paren';
    _token_tree_paren: T._TokenTreeParen;
    tokenTreeParen(): T._TokenTreeParen;
    $with: {
        tokenTreeParen: (value: T._TokenTreeParen) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreeUFormBracket(config: Omit<ConfigOf<T.TokenTreeUFormBracket>, '$variant'>): {
    $type: TSKindId.TokenTree;
    $source: 2;
    $named: true;
    $variant: 'bracket';
    _token_tree_bracket: T._TokenTreeBracket;
    tokenTreeBracket(): T._TokenTreeBracket;
    $with: {
        tokenTreeBracket: (value: T._TokenTreeBracket) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreeUFormBrace(config: Omit<ConfigOf<T.TokenTreeUFormBrace>, '$variant'>): {
    $type: TSKindId.TokenTree;
    $source: 2;
    $named: true;
    $variant: 'brace';
    _token_tree_brace: T._TokenTreeBrace;
    tokenTreeBrace(): T._TokenTreeBrace;
    $with: {
        tokenTreeBrace: (value: T._TokenTreeBrace) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreePatternParen(...children: T.TokenPattern[]): {
    $type: TSKindId._TokenTreePatternParen;
    $source: 2;
    $named: true;
    _token_pattern: T.TokenPattern[];
    tokenPatterns(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreePatternBracket(...children: T.TokenPattern[]): {
    $type: TSKindId._TokenTreePatternBracket;
    $source: 2;
    $named: true;
    _token_pattern: T.TokenPattern[];
    tokenPatterns(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreePatternBrace(...children: T.TokenPattern[]): {
    $type: TSKindId._TokenTreePatternBrace;
    $source: 2;
    $named: true;
    _token_pattern: T.TokenPattern[];
    tokenPatterns(): T.TokenPattern[];
    $with: {
        $children: (...vs: T.TokenPattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreePattern(config: ConfigOf<T.TokenTreePatternUFormParen>): ReturnType<typeof tokenTreePatternUFormParen>;
export declare function tokenTreePattern(config: ConfigOf<T.TokenTreePatternUFormBracket>): ReturnType<typeof tokenTreePatternUFormBracket>;
export declare function tokenTreePattern(config: ConfigOf<T.TokenTreePatternUFormBrace>): ReturnType<typeof tokenTreePatternUFormBrace>;
export declare function tokenTreePatternUFormParen(config: Omit<ConfigOf<T.TokenTreePatternUFormParen>, '$variant'>): {
    $type: TSKindId.TokenTreePattern;
    $source: 2;
    $named: true;
    $variant: 'paren';
    _token_tree_pattern_paren: T._TokenTreePatternParen;
    tokenTreePatternParen(): T._TokenTreePatternParen;
    $with: {
        tokenTreePatternParen: (value: T._TokenTreePatternParen) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreePatternUFormBracket(config: Omit<ConfigOf<T.TokenTreePatternUFormBracket>, '$variant'>): {
    $type: TSKindId.TokenTreePattern;
    $source: 2;
    $named: true;
    $variant: 'bracket';
    _token_tree_pattern_bracket: T._TokenTreePatternBracket;
    tokenTreePatternBracket(): T._TokenTreePatternBracket;
    $with: {
        tokenTreePatternBracket: (value: T._TokenTreePatternBracket) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tokenTreePatternUFormBrace(config: Omit<ConfigOf<T.TokenTreePatternUFormBrace>, '$variant'>): {
    $type: TSKindId.TokenTreePattern;
    $source: 2;
    $named: true;
    $variant: 'brace';
    _token_tree_pattern_brace: T._TokenTreePatternBrace;
    tokenTreePatternBrace(): T._TokenTreePatternBrace;
    $with: {
        tokenTreePatternBrace: (value: T._TokenTreePatternBrace) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function traitBounds(...children: (T._Type | T.Lifetime | T.HigherRankedTraitBound)[]): {
    $type: TSKindId.TraitBounds;
    $source: 2;
    $named: true;
    _type: (T.HigherRankedTraitBound | T.Lifetime | T._Type)[] & readonly [T.HigherRankedTraitBound | T.Lifetime | T._Type, ...(T.HigherRankedTraitBound | T.Lifetime | T._Type)[]];
    types(): (T.HigherRankedTraitBound | T.Lifetime | T._Type)[] & readonly [T.HigherRankedTraitBound | T.Lifetime | T._Type, ...(T.HigherRankedTraitBound | T.Lifetime | T._Type)[]];
    $with: {
        $children: (...vs: (T._Type | T.Lifetime | T.HigherRankedTraitBound)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function traitItem(config: T.TraitItem.Config): {
    $type: TSKindId.TraitItem;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _unsafe_marker: true | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _bounds: T.TraitBounds | undefined;
    _where_clause: T.WhereClause | undefined;
    _body: T.DeclarationList;
    visibilityModifier(): T.VisibilityModifier | undefined;
    unsafeMarker(): true | undefined;
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
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        unsafeMarker: (value?: NonNullable<Parameters<typeof traitItem>[0]>['unsafeMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        bounds: (value?: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.DeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tryBlock(block: T.TryBlock.Config['block']): {
    $type: TSKindId.TryBlock;
    $source: 2;
    $named: true;
    _block: T.Block;
    block(): T.Block;
    $with: {
        block: (value: T.TryBlock.Config['block']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tryExpression(value: T.TryExpression.Config['value']): {
    $type: TSKindId.TryExpression;
    $source: 2;
    $named: true;
    _value: T.Expression;
    value(): T.Expression;
    $with: {
        value: (value: T.TryExpression.Config['value']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tupleExpression(config?: Partial<T.TupleExpression.Config>): {
    $type: TSKindId.TupleExpression;
    $source: 2;
    $named: true;
    _attributes: readonly T.AttributeItem[] | undefined;
    _elements: readonly T.Expression[] | undefined;
    attributes(): readonly T.AttributeItem[] | undefined;
    elements(): readonly T.Expression[] | undefined;
    $with: {
        attributes: (...values: T.AttributeItem[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        elements: (...values: T.Expression[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tuplePattern(...children: (T.Pattern | T.ClosureExpression)[]): {
    $type: TSKindId.TuplePattern;
    $source: 2;
    $named: true;
    _pattern: (T.ClosureExpression | T.Pattern)[];
    patterns(): (T.ClosureExpression | T.Pattern)[];
    $with: {
        $children: (...vs: (T.Pattern | T.ClosureExpression)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tupleStructPattern(config: T.TupleStructPattern.Config): {
    $type: TSKindId.TupleStructPattern;
    $source: 2;
    $named: true;
    _type: T.GenericTypeWithTurbofish | T.Identifier | T.ScopedIdentifier;
    _pattern: readonly T.Pattern[] | undefined;
    type(): T.GenericTypeWithTurbofish | T.Identifier | T.ScopedIdentifier;
    patterns(): readonly T.Pattern[] | undefined;
    $with: {
        type: (value: T.Identifier | T.ScopedIdentifier | T.GenericTypeWithTurbofish) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        patterns: (...values: T.Pattern[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function tupleType(...children: T._Type[]): {
    $type: TSKindId.TupleType;
    $source: 2;
    $named: true;
    _type: T._Type[] & readonly [T._Type, ...T._Type[]];
    types(): T._Type[] & readonly [T._Type, ...T._Type[]];
    $with: {
        $children: (...vs: T._Type[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeArguments(config: T.TypeArguments.Config): {
    $type: TSKindId.TypeArguments;
    $source: 2;
    $named: true;
    _type: readonly [T.Block | T.Lifetime | T.TypeBinding | T.Literal | T._Type, ...(T.Block | T.Lifetime | T.TypeBinding | T.Literal | T._Type)[]];
    _trait_bounds: T.TraitBounds | undefined;
    types(): readonly [T.Block | T.Lifetime | T.TypeBinding | T.Literal | T._Type, ...(T.Block | T.Lifetime | T.TypeBinding | T.Literal | T._Type)[]];
    traitBounds(): T.TraitBounds | undefined;
    $with: {
        types: (values_0: T.Block | T.Lifetime | T.TypeBinding | T.Literal | T._Type, ...values: (T.Block | T.Lifetime | T.TypeBinding | T.Literal | T._Type)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        traitBounds: (value?: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeBinding(config: T.TypeBinding.Config): {
    $type: TSKindId.TypeBinding;
    $source: 2;
    $named: true;
    _name: T.TypeIdentifier;
    _type_arguments: T.TypeArguments | undefined;
    _type: T._Type;
    name(): T.TypeIdentifier;
    typeArguments(): T.TypeArguments | undefined;
    type(): T._Type;
    $with: {
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeArguments: (value?: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeCastExpression(config: T.TypeCastExpression.Config): {
    $type: TSKindId.TypeCastExpression;
    $source: 2;
    $named: true;
    _value: T.Expression;
    _type: T._Type;
    value(): T.Expression;
    type(): T._Type;
    $with: {
        value: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeItem(config: T.TypeItem.Config): {
    $type: TSKindId.TypeItem;
    $source: 2;
    $named: true;
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
    type(): T._Type;
    trailingWhereClause(): T.WhereClause | undefined;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        trailingWhereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeParameter(config: T.TypeParameter.Config): {
    $type: TSKindId.TypeParameter;
    $source: 2;
    $named: true;
    _name: T.TypeIdentifier;
    _bounds: T.TraitBounds | undefined;
    _default_type: T._Type | undefined;
    name(): T.TypeIdentifier;
    bounds(): T.TraitBounds | undefined;
    defaultType(): T._Type | undefined;
    $with: {
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        bounds: (value?: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        defaultType: (value?: T._Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function typeParameters(config: T.TypeParameters.Config): {
    $type: TSKindId.TypeParameters;
    $source: 2;
    $named: true;
    _attributes: readonly [T.AttributedTypeParameter, ...T.AttributedTypeParameter[]];
    attributes(): readonly [T.AttributedTypeParameter, ...T.AttributedTypeParameter[]];
    $with: {
        attributes: (values_0: T.AttributedTypeParameter, ...values: T.AttributedTypeParameter[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function unaryExpression(config: T.UnaryExpression.Config): {
    $type: TSKindId.UnaryExpression;
    $source: 2;
    $named: true;
    _operator: unknown;
    _operand: T.Expression;
    operator(): unknown;
    operand(): T.Expression;
    $with: {
        operator: (value: NonNullable<Parameters<typeof unaryExpression>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        operand: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function unionItem(config: T.UnionItem.Config): {
    $type: TSKindId.UnionItem;
    $source: 2;
    $named: true;
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
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        name: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        whereClause: (value?: T.WhereClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.FieldDeclarationList) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function unitExpression(text: string): {
    $type: TSKindId.UnitExpression;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function unitType(text: string): {
    $type: TSKindId.UnitType;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function unsafeBlock(block: T.UnsafeBlock.Config['block']): {
    $type: TSKindId.UnsafeBlock;
    $source: 2;
    $named: true;
    _block: T.Block;
    block(): T.Block;
    $with: {
        block: (value: T.UnsafeBlock.Config['block']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function useAsClause(config: T.UseAsClause.Config): {
    $type: TSKindId.UseAsClause;
    $source: 2;
    $named: true;
    _path: T.Path;
    _alias: T.Identifier;
    path(): T.Path;
    alias(): T.Identifier;
    $with: {
        path: (value: T.Path) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        alias: (value: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function useBounds(...children: (T.Lifetime | T.TypeIdentifier)[]): {
    $type: TSKindId.UseBounds;
    $source: 2;
    $named: true;
    _lifetime: (T.Lifetime | T.TypeIdentifier)[];
    lifetimes(): (T.Lifetime | T.TypeIdentifier)[];
    $with: {
        $children: (...vs: (T.Lifetime | T.TypeIdentifier)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function useDeclaration(config: T.UseDeclaration.Config): {
    $type: TSKindId.UseDeclaration;
    $source: 2;
    $named: true;
    _visibility_modifier: T.VisibilityModifier | undefined;
    _argument: T.UseClause;
    visibilityModifier(): T.VisibilityModifier | undefined;
    argument(): T.UseClause;
    $with: {
        visibilityModifier: (value?: T.VisibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        argument: (value: T.UseClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function useList(...children: T.UseClause[]): {
    $type: TSKindId.UseList;
    $source: 2;
    $named: true;
    _use_clause: T.UseClause[];
    useClauses(): T.UseClause[];
    $with: {
        $children: (...vs: T.UseClause[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function useWildcard(path?: T.UseWildcard.Config['path']): {
    $type: TSKindId.UseWildcard;
    $source: 2;
    $named: true;
    _path: T.Path | undefined;
    path(): T.Path | undefined;
    $with: {
        path: (value?: T.UseWildcard.Config['path']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function variadicParameter(config?: Partial<T.VariadicParameter.Config>): {
    $type: TSKindId.VariadicParameter;
    $source: 2;
    $named: true;
    _mutable_specifier: true | undefined;
    _pattern: T.Pattern | undefined;
    mutableSpecifier(): true | undefined;
    pattern(): T.Pattern | undefined;
    $with: {
        mutableSpecifier: (value?: NonNullable<Parameters<typeof variadicParameter>[0]>['mutableSpecifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        pattern: (value?: T.Pattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function visibilityModifierCrate(_config?: T.VisibilityModifierCrate.Config): {
    $type: TSKindId._VisibilityModifierCrate;
    $source: 2;
    $named: true;
    _crate: unknown;
    crate(): unknown;
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function visibilityModifier(config: ConfigOf<T.VisibilityModifierUFormCrate>): ReturnType<typeof visibilityModifierUFormCrate>;
export declare function visibilityModifier(config: ConfigOf<T.VisibilityModifierUFormPub>): ReturnType<typeof visibilityModifierUFormPub>;
export declare function visibilityModifier(config: ConfigOf<T.VisibilityModifierUFormInPath>): ReturnType<typeof visibilityModifierUFormInPath>;
export declare function visibilityModifierUFormCrate(_config?: Omit<ConfigOf<T.VisibilityModifierUFormCrate>, '$variant'>): {
    $type: TSKindId.VisibilityModifier;
    $source: 2;
    $named: true;
    $variant: 'crate';
    _visibility_modifier_crate: {
        $type: TSKindId._VisibilityModifierCrate;
        $source: 2;
        $named: true;
        _crate: unknown;
        crate(): unknown;
        $with: {};
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.BlockComment | T.LineComment | {
            leading?: (T.BlockComment | T.LineComment)[];
            trailing?: (T.BlockComment | T.LineComment)[];
        })[]): import("@sittir/types").AnyNodeData;
    };
    visibilityModifierCrate(): {
        $type: TSKindId._VisibilityModifierCrate;
        $source: 2;
        $named: true;
        _crate: unknown;
        crate(): unknown;
        $with: {};
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.BlockComment | T.LineComment | {
            leading?: (T.BlockComment | T.LineComment)[];
            trailing?: (T.BlockComment | T.LineComment)[];
        })[]): import("@sittir/types").AnyNodeData;
    };
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function visibilityModifierUFormPub(_config?: Omit<ConfigOf<T.VisibilityModifierUFormPub>, '$variant'>): {
    $type: TSKindId.VisibilityModifier;
    $source: 2;
    $named: true;
    $variant: 'pub';
    _visibility_modifier_pub: {
        $type: TSKindId.VisibilityModifierPub;
        $source: 2;
        $named: true;
        _pub: unknown;
        _visibility_modifier_pub_parens: T.VisibilityModifierPubParens | undefined;
        pub(): unknown;
        visibilityModifierPubParens(): T.VisibilityModifierPubParens | undefined;
        $with: {
            visibilityModifierPubParens: (value?: T.VisibilityModifierPubParens) => /*elided*/ any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.BlockComment | T.LineComment | {
                    leading?: (T.BlockComment | T.LineComment)[];
                    trailing?: (T.BlockComment | T.LineComment)[];
                })[]): import("@sittir/types").AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.BlockComment | T.LineComment | {
            leading?: (T.BlockComment | T.LineComment)[];
            trailing?: (T.BlockComment | T.LineComment)[];
        })[]): import("@sittir/types").AnyNodeData;
    };
    visibilityModifierPub(): {
        $type: TSKindId.VisibilityModifierPub;
        $source: 2;
        $named: true;
        _pub: unknown;
        _visibility_modifier_pub_parens: T.VisibilityModifierPubParens | undefined;
        pub(): unknown;
        visibilityModifierPubParens(): T.VisibilityModifierPubParens | undefined;
        $with: {
            visibilityModifierPubParens: (value?: T.VisibilityModifierPubParens) => any & {
                $render(): string;
                $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                $replace(target: {
                    range(): import("@sittir/types").ByteRange;
                }): import("@sittir/types").Edit;
                $trivia(...args: (T.BlockComment | T.LineComment | {
                    leading?: (T.BlockComment | T.LineComment)[];
                    trailing?: (T.BlockComment | T.LineComment)[];
                })[]): import("@sittir/types").AnyNodeData;
            };
        };
    } & {
        $render(): string;
        $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
        $replace(target: {
            range(): import("@sittir/types").ByteRange;
        }): import("@sittir/types").Edit;
        $trivia(...args: (T.BlockComment | T.LineComment | {
            leading?: (T.BlockComment | T.LineComment)[];
            trailing?: (T.BlockComment | T.LineComment)[];
        })[]): import("@sittir/types").AnyNodeData;
    };
    $with: {};
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function visibilityModifierUFormInPath(config: Omit<ConfigOf<T.VisibilityModifierUFormInPath>, '$variant'>): {
    $type: TSKindId.VisibilityModifier;
    $source: 2;
    $named: true;
    $variant: 'in_path';
    _visibility_modifier_in_path: T.VisibilityModifierInPath;
    visibilityModifierInPath(): T.VisibilityModifierInPath;
    $with: {
        visibilityModifierInPath: (value: T.VisibilityModifierInPath) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function whereClause(...children: T.WherePredicate[]): {
    $type: TSKindId.WhereClause;
    $source: 2;
    $named: true;
    _where_predicate: T.WherePredicate[];
    wherePredicates(): T.WherePredicate[];
    $with: {
        $children: (...vs: T.WherePredicate[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function wherePredicate(config: T.WherePredicate.Config): {
    $type: TSKindId.WherePredicate;
    $source: 2;
    $named: true;
    _left: T.ArrayType | T.GenericType | T.HigherRankedTraitBound | T.Lifetime | T.PrimitiveType | T.ReferenceType | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier | T.PointerType;
    _bounds: T.TraitBounds;
    left(): T.ArrayType | T.GenericType | T.HigherRankedTraitBound | T.Lifetime | T.PrimitiveType | T.ReferenceType | T.ScopedTypeIdentifier | T.TupleType | T.TypeIdentifier | T.PointerType;
    bounds(): T.TraitBounds;
    $with: {
        left: (value: T.Lifetime | T.TypeIdentifier | T.ScopedTypeIdentifier | T.GenericType | T.ReferenceType | T.PointerType | T.TupleType | T.ArrayType | T.HigherRankedTraitBound | T.PrimitiveType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        bounds: (value: T.TraitBounds) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function whileExpression(config: T.WhileExpression.Config): {
    $type: TSKindId.WhileExpression;
    $source: 2;
    $named: true;
    _label: T.Label | undefined;
    _condition: T.Condition;
    _body: T.Block;
    label(): T.Label | undefined;
    condition(): T.Condition;
    body(): T.Block;
    $with: {
        label: (value?: T.Label) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        condition: (value: T.Condition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        body: (value: T.Block) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function yieldExpression(child?: T.Expression): {
    $type: TSKindId.YieldExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression | undefined;
    expression(): T.Expression | undefined;
    $with: {
        $child: (v: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.BlockComment | T.LineComment | {
                leading?: (T.BlockComment | T.LineComment)[];
                trailing?: (T.BlockComment | T.LineComment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function stringContent(text: string): {
    $type: TSKindId.StringContent;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function rawStringLiteralContent(text: string): {
    $type: TSKindId.RawStringLiteralContent;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function floatLiteral(text: string): {
    $type: TSKindId.FloatLiteral;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function lineDocContent(text: string): {
    $type: TSKindId.LineDocContent;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function errorSentinel(text: string): {
    $type: TSKindId.ErrorSentinel;
    $source: 2;
    $named: true;
    $text: string;
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.BlockComment | T.LineComment | {
        leading?: (T.BlockComment | T.LineComment)[];
        trailing?: (T.BlockComment | T.LineComment)[];
    })[]): import("@sittir/types").AnyNodeData;
};
export type FluentKindMap = {
    "_array_expression_list": T.ArrayExpressionList;
    "_array_expression_semi": T.ArrayExpressionSemi;
    "_closure_expression_block": T.ClosureExpressionBlock;
    "_closure_expression_expr": FluentNode<"_closure_expression_expr", T._ClosureExpressionExpr.Config>;
    "_delim_token_tree_brace": FluentNode<"_delim_token_tree_brace", T._DelimTokenTreeBrace.Config>;
    "_delim_token_tree_bracket": FluentNode<"_delim_token_tree_bracket", T._DelimTokenTreeBracket.Config>;
    "_delim_token_tree_paren": FluentNode<"_delim_token_tree_paren", T._DelimTokenTreeParen.Config>;
    "_expression_statement_block_ending": FluentNode<"_expression_statement_block_ending", T._ExpressionStatementBlockEnding.Config>;
    "_expression_statement_with_semi": FluentNode<"_expression_statement_with_semi", T._ExpressionStatementWithSemi.Config>;
    "_field_identifier": T.FieldIdentifier;
    "_field_pattern_named": T.FieldPatternNamed;
    "_field_pattern_shorthand": FluentNode<"_field_pattern_shorthand", T._FieldPatternShorthand.Config>;
    "_foreign_mod_item_body": FluentNode<"_foreign_mod_item_body", T._ForeignModItemBody.Config>;
    "_function_type_fn_form": FluentNode<"_function_type_fn_form", T.FunctionTypeFnForm.Config>;
    "_function_type_trait_form": FluentNode<"_function_type_trait_form", T.FunctionTypeTraitForm.Config>;
    "_impl_item_body": FluentNode<"_impl_item_body", T._ImplItemBody.Config>;
    "_let_chain": FluentNode<"_let_chain", T.LetChain.Config>;
    "_line_comment_content": T.LineCommentContent;
    "_line_comment_doc": T.LineCommentDoc;
    "_line_comment_regular_dslash": T.LineCommentRegularDslash;
    "_macro_definition_brace": FluentNode<"_macro_definition_brace", T._MacroDefinitionBrace.Config>;
    "_macro_definition_bracket": FluentNode<"_macro_definition_bracket", T._MacroDefinitionBracket.Config>;
    "_macro_definition_paren": FluentNode<"_macro_definition_paren", T._MacroDefinitionParen.Config>;
    "_match_arm_block_ending": FluentNode<"_match_arm_block_ending", T._MatchArmBlockEnding.Config>;
    "_match_arm_with_comma": T.MatchArmWithComma;
    "_mod_item_inline": FluentNode<"_mod_item_inline", T._ModItemInline.Config>;
    "_or_pattern_binary": T.OrPatternBinary;
    "_or_pattern_prefix": T.OrPatternPrefix;
    "_pointer_type_mut": FluentNode<"_pointer_type_mut", T._PointerTypeMut.Config>;
    "_range_expression_bare": FluentNode<"_range_expression_bare", T._RangeExpressionBare.Config>;
    "_range_expression_binary": T.RangeExpressionBinary;
    "_range_expression_postfix": T.RangeExpressionPostfix;
    "_range_expression_prefix": T.RangeExpressionPrefix;
    "_range_pattern_left_with_right": T.RangePatternLeftWithRight;
    "_range_pattern_prefix": T.RangePatternPrefix;
    "_reference_expression_raw_const": T.ReferenceExpressionRawConst;
    "_reference_expression_raw_mut": FluentNode<"_reference_expression_raw_mut", T.ReferenceExpressionRawMut.Config>;
    "_struct_item_brace": T.StructItemBrace;
    "_struct_item_tuple": T.StructItemTuple;
    "_token_tree_brace": FluentNode<"_token_tree_brace", T._TokenTreeBrace.Config>;
    "_token_tree_bracket": FluentNode<"_token_tree_bracket", T._TokenTreeBracket.Config>;
    "_token_tree_paren": FluentNode<"_token_tree_paren", T._TokenTreeParen.Config>;
    "_token_tree_pattern_brace": FluentNode<"_token_tree_pattern_brace", T._TokenTreePatternBrace.Config>;
    "_token_tree_pattern_bracket": FluentNode<"_token_tree_pattern_bracket", T._TokenTreePatternBracket.Config>;
    "_token_tree_pattern_paren": FluentNode<"_token_tree_pattern_paren", T._TokenTreePatternParen.Config>;
    "_type_identifier": T.TypeIdentifier;
    "_visibility_modifier_crate": FluentNode<"_visibility_modifier_crate", T._VisibilityModifierCrate.Config>;
    "_visibility_modifier_in_path": T.VisibilityModifierInPath;
    "_visibility_modifier_pub": T.VisibilityModifierPub;
    "abstract_type": FluentNode<"abstract_type", T.AbstractType.Config>;
    "arguments": FluentNode<"arguments", T.Arguments.Config>;
    "array_expression": FluentNode<"array_expression", T.ArrayExpression.Config>;
    "array_type": FluentNode<"array_type", T.ArrayType.Config>;
    "assignment_expression": FluentNode<"assignment_expression", T.AssignmentExpression.Config>;
    "associated_type": FluentNode<"associated_type", T.AssociatedType.Config>;
    "async_block": FluentNode<"async_block", T.AsyncBlock.Config>;
    "attribute": FluentNode<"attribute", T.Attribute.Config>;
    "attribute_item": FluentNode<"attribute_item", T.AttributeItem.Config>;
    "await_expression": FluentNode<"await_expression", T.AwaitExpression.Config>;
    "base_field_initializer": FluentNode<"base_field_initializer", T.BaseFieldInitializer.Config>;
    "binary_expression": FluentNode<"binary_expression", T.BinaryExpression.Config>;
    "block": FluentNode<"block", T.Block.Config>;
    "block_comment": FluentNode<"block_comment", T.BlockComment.Config>;
    "boolean_literal": T.BooleanLiteral;
    "bounded_type": FluentNode<"bounded_type", T.BoundedType.Config>;
    "bracketed_type": FluentNode<"bracketed_type", T.BracketedType.Config>;
    "break_expression": FluentNode<"break_expression", T.BreakExpression.Config>;
    "call_expression": FluentNode<"call_expression", T.CallExpression.Config>;
    "captured_pattern": FluentNode<"captured_pattern", T.CapturedPattern.Config>;
    "char_literal": T.CharLiteral;
    "closure_expression_expr": FluentNode<"closure_expression_expr", T.ClosureExpressionExpr.Config>;
    "closure_expression": FluentNode<"closure_expression", T.ClosureExpression.Config>;
    "closure_parameters": FluentNode<"closure_parameters", T.ClosureParameters.Config>;
    "compound_assignment_expr": FluentNode<"compound_assignment_expr", T.CompoundAssignmentExpr.Config>;
    "const_block": FluentNode<"const_block", T.ConstBlock.Config>;
    "const_item": FluentNode<"const_item", T.ConstItem.Config>;
    "const_parameter": FluentNode<"const_parameter", T.ConstParameter.Config>;
    "continue_expression": FluentNode<"continue_expression", T.ContinueExpression.Config>;
    "crate": T.Crate;
    "declaration_list": FluentNode<"declaration_list", T.DeclarationList.Config>;
    "delim_token_tree_paren": FluentNode<"delim_token_tree_paren", T.DelimTokenTreeParen.Config>;
    "delim_token_tree_bracket": FluentNode<"delim_token_tree_bracket", T.DelimTokenTreeBracket.Config>;
    "delim_token_tree_brace": FluentNode<"delim_token_tree_brace", T.DelimTokenTreeBrace.Config>;
    "delim_token_tree": FluentNode<"delim_token_tree", T.DelimTokenTree.Config>;
    "dynamic_type": FluentNode<"dynamic_type", T.DynamicType.Config>;
    "else_clause": FluentNode<"else_clause", T.ElseClause.Config>;
    "enum_item": FluentNode<"enum_item", T.EnumItem.Config>;
    "enum_variant": FluentNode<"enum_variant", T.EnumVariant.Config>;
    "enum_variant_list": FluentNode<"enum_variant_list", T.EnumVariantList.Config>;
    "escape_sequence": T.EscapeSequence;
    "expression_statement_with_semi": FluentNode<"expression_statement_with_semi", T.ExpressionStatementWithSemi.Config>;
    "expression_statement_block_ending": FluentNode<"expression_statement_block_ending", T.ExpressionStatementBlockEnding.Config>;
    "expression_statement": FluentNode<"expression_statement", T.ExpressionStatement.Config>;
    "extern_crate_declaration": FluentNode<"extern_crate_declaration", T.ExternCrateDeclaration.Config>;
    "extern_modifier": FluentNode<"extern_modifier", T.ExternModifier.Config>;
    "field_declaration": FluentNode<"field_declaration", T.FieldDeclaration.Config>;
    "field_declaration_list": FluentNode<"field_declaration_list", T.FieldDeclarationList.Config>;
    "field_expression": FluentNode<"field_expression", T.FieldExpression.Config>;
    "field_initializer": FluentNode<"field_initializer", T.FieldInitializer.Config>;
    "field_initializer_list": FluentNode<"field_initializer_list", T.FieldInitializerList.Config>;
    "field_pattern_shorthand": FluentNode<"field_pattern_shorthand", T.FieldPatternShorthand.Config>;
    "field_pattern": FluentNode<"field_pattern", T.FieldPattern.Config>;
    "for_expression": FluentNode<"for_expression", T.ForExpression.Config>;
    "for_lifetimes": FluentNode<"for_lifetimes", T.ForLifetimes.Config>;
    "foreign_mod_item_body": FluentNode<"foreign_mod_item_body", T.ForeignModItemBody.Config>;
    "foreign_mod_item": FluentNode<"foreign_mod_item", T.ForeignModItem.Config>;
    "fragment_specifier": T.FragmentSpecifier;
    "function_item": FluentNode<"function_item", T.FunctionItem.Config>;
    "function_modifiers": FluentNode<"function_modifiers", T.FunctionModifiers.Config>;
    "function_signature_item": FluentNode<"function_signature_item", T.FunctionSignatureItem.Config>;
    "function_type": FluentNode<"function_type", T.FunctionType.Config>;
    "gen_block": FluentNode<"gen_block", T.GenBlock.Config>;
    "generic_function": FluentNode<"generic_function", T.GenericFunction.Config>;
    "generic_pattern": FluentNode<"generic_pattern", T.GenericPattern.Config>;
    "generic_type": FluentNode<"generic_type", T.GenericType.Config>;
    "generic_type_with_turbofish": FluentNode<"generic_type_with_turbofish", T.GenericTypeWithTurbofish.Config>;
    "higher_ranked_trait_bound": FluentNode<"higher_ranked_trait_bound", T.HigherRankedTraitBound.Config>;
    "identifier": T.Identifier;
    "if_expression": FluentNode<"if_expression", T.IfExpression.Config>;
    "impl_item_body": FluentNode<"impl_item_body", T.ImplItemBody.Config>;
    "impl_item": FluentNode<"impl_item", T.ImplItem.Config>;
    "index_expression": FluentNode<"index_expression", T.IndexExpression.Config>;
    "inner_attribute_item": FluentNode<"inner_attribute_item", T.InnerAttributeItem.Config>;
    "integer_literal": T.IntegerLiteral;
    "label": FluentNode<"label", T.Label.Config>;
    "last_match_arm": FluentNode<"last_match_arm", T.LastMatchArm.Config>;
    "let_condition": FluentNode<"let_condition", T.LetCondition.Config>;
    "let_declaration": FluentNode<"let_declaration", T.LetDeclaration.Config>;
    "lifetime": FluentNode<"lifetime", T.Lifetime.Config>;
    "lifetime_parameter": FluentNode<"lifetime_parameter", T.LifetimeParameter.Config>;
    "line_comment": FluentNode<"line_comment", T.LineComment.Config>;
    "loop_expression": FluentNode<"loop_expression", T.LoopExpression.Config>;
    "macro_definition_paren": FluentNode<"macro_definition_paren", T.MacroDefinitionParen.Config>;
    "macro_definition_bracket": FluentNode<"macro_definition_bracket", T.MacroDefinitionBracket.Config>;
    "macro_definition_brace": FluentNode<"macro_definition_brace", T.MacroDefinitionBrace.Config>;
    "macro_definition": FluentNode<"macro_definition", T.MacroDefinition.Config>;
    "macro_invocation": FluentNode<"macro_invocation", T.MacroInvocation.Config>;
    "macro_rule": FluentNode<"macro_rule", T.MacroRule.Config>;
    "match_arm_block_ending": FluentNode<"match_arm_block_ending", T.MatchArmBlockEnding.Config>;
    "match_arm": FluentNode<"match_arm", T.MatchArm.Config>;
    "match_block": FluentNode<"match_block", T.MatchBlock.Config>;
    "match_expression": FluentNode<"match_expression", T.MatchExpression.Config>;
    "match_pattern": FluentNode<"match_pattern", T.MatchPattern.Config>;
    "metavariable": T.Metavariable;
    "mod_item_inline": FluentNode<"mod_item_inline", T.ModItemInline.Config>;
    "mod_item": FluentNode<"mod_item", T.ModItem.Config>;
    "mut_pattern": FluentNode<"mut_pattern", T.MutPattern.Config>;
    "mutable_specifier": T.MutableSpecifier;
    "negative_literal": FluentNode<"negative_literal", T.NegativeLiteral.Config>;
    "or_pattern": FluentNode<"or_pattern", T.OrPattern.Config>;
    "ordered_field_declaration_list": FluentNode<"ordered_field_declaration_list", T.OrderedFieldDeclarationList.Config>;
    "parameter": FluentNode<"parameter", T.Parameter.Config>;
    "parameters": FluentNode<"parameters", T.Parameters.Config>;
    "parenthesized_expression": FluentNode<"parenthesized_expression", T.ParenthesizedExpression.Config>;
    "pointer_type_mut": FluentNode<"pointer_type_mut", T.PointerTypeMut.Config>;
    "pointer_type": FluentNode<"pointer_type", T.PointerType.Config>;
    "qualified_type": FluentNode<"qualified_type", T.QualifiedType.Config>;
    "range_expression_bare": FluentNode<"range_expression_bare", T.RangeExpressionBare.Config>;
    "range_expression": FluentNode<"range_expression", T.RangeExpression.Config>;
    "range_pattern": FluentNode<"range_pattern", T.RangePattern.Config>;
    "raw_string_literal": FluentNode<"raw_string_literal", T.RawStringLiteral.Config>;
    "ref_pattern": FluentNode<"ref_pattern", T.RefPattern.Config>;
    "reference_expression": FluentNode<"reference_expression", T.ReferenceExpression.Config>;
    "reference_pattern": FluentNode<"reference_pattern", T.ReferencePattern.Config>;
    "reference_type": FluentNode<"reference_type", T.ReferenceType.Config>;
    "removed_trait_bound": FluentNode<"removed_trait_bound", T.RemovedTraitBound.Config>;
    "return_expression": FluentNode<"return_expression", T.ReturnExpression.Config>;
    "scoped_identifier": FluentNode<"scoped_identifier", T.ScopedIdentifier.Config>;
    "scoped_type_identifier": FluentNode<"scoped_type_identifier", T.ScopedTypeIdentifier.Config>;
    "scoped_type_identifier_in_expression_position": FluentNode<"scoped_type_identifier_in_expression_position", T.ScopedTypeIdentifierInExpressionPosition.Config>;
    "scoped_use_list": FluentNode<"scoped_use_list", T.ScopedUseList.Config>;
    "self": T.Self;
    "self_parameter": FluentNode<"self_parameter", T.SelfParameter.Config>;
    "shebang": T.Shebang;
    "shorthand_field_initializer": FluentNode<"shorthand_field_initializer", T.ShorthandFieldInitializer.Config>;
    "slice_pattern": FluentNode<"slice_pattern", T.SlicePattern.Config>;
    "source_file": FluentNode<"source_file", T.SourceFile.Config>;
    "static_item": FluentNode<"static_item", T.StaticItem.Config>;
    "string_literal": FluentNode<"string_literal", T.StringLiteral.Config>;
    "struct_expression": FluentNode<"struct_expression", T.StructExpression.Config>;
    "struct_item": FluentNode<"struct_item", T.StructItem.Config>;
    "struct_pattern": FluentNode<"struct_pattern", T.StructPattern.Config>;
    "super": T.Super;
    "token_binding_pattern": FluentNode<"token_binding_pattern", T.TokenBindingPattern.Config>;
    "token_repetition": FluentNode<"token_repetition", T.TokenRepetition.Config>;
    "token_repetition_pattern": FluentNode<"token_repetition_pattern", T.TokenRepetitionPattern.Config>;
    "token_tree_paren": FluentNode<"token_tree_paren", T.TokenTreeParen.Config>;
    "token_tree_bracket": FluentNode<"token_tree_bracket", T.TokenTreeBracket.Config>;
    "token_tree_brace": FluentNode<"token_tree_brace", T.TokenTreeBrace.Config>;
    "token_tree": FluentNode<"token_tree", T.TokenTree.Config>;
    "token_tree_pattern_paren": FluentNode<"token_tree_pattern_paren", T.TokenTreePatternParen.Config>;
    "token_tree_pattern_bracket": FluentNode<"token_tree_pattern_bracket", T.TokenTreePatternBracket.Config>;
    "token_tree_pattern_brace": FluentNode<"token_tree_pattern_brace", T.TokenTreePatternBrace.Config>;
    "token_tree_pattern": FluentNode<"token_tree_pattern", T.TokenTreePattern.Config>;
    "trait_bounds": FluentNode<"trait_bounds", T.TraitBounds.Config>;
    "trait_item": FluentNode<"trait_item", T.TraitItem.Config>;
    "try_block": FluentNode<"try_block", T.TryBlock.Config>;
    "try_expression": FluentNode<"try_expression", T.TryExpression.Config>;
    "tuple_expression": FluentNode<"tuple_expression", T.TupleExpression.Config>;
    "tuple_pattern": FluentNode<"tuple_pattern", T.TuplePattern.Config>;
    "tuple_struct_pattern": FluentNode<"tuple_struct_pattern", T.TupleStructPattern.Config>;
    "tuple_type": FluentNode<"tuple_type", T.TupleType.Config>;
    "type_arguments": FluentNode<"type_arguments", T.TypeArguments.Config>;
    "type_binding": FluentNode<"type_binding", T.TypeBinding.Config>;
    "type_cast_expression": FluentNode<"type_cast_expression", T.TypeCastExpression.Config>;
    "type_item": FluentNode<"type_item", T.TypeItem.Config>;
    "type_parameter": FluentNode<"type_parameter", T.TypeParameter.Config>;
    "type_parameters": FluentNode<"type_parameters", T.TypeParameters.Config>;
    "unary_expression": FluentNode<"unary_expression", T.UnaryExpression.Config>;
    "union_item": FluentNode<"union_item", T.UnionItem.Config>;
    "unit_expression": T.UnitExpression;
    "unit_type": T.UnitType;
    "unsafe_block": FluentNode<"unsafe_block", T.UnsafeBlock.Config>;
    "use_as_clause": FluentNode<"use_as_clause", T.UseAsClause.Config>;
    "use_bounds": FluentNode<"use_bounds", T.UseBounds.Config>;
    "use_declaration": FluentNode<"use_declaration", T.UseDeclaration.Config>;
    "use_list": FluentNode<"use_list", T.UseList.Config>;
    "use_wildcard": FluentNode<"use_wildcard", T.UseWildcard.Config>;
    "variadic_parameter": FluentNode<"variadic_parameter", T.VariadicParameter.Config>;
    "visibility_modifier_crate": FluentNode<"visibility_modifier_crate", T.VisibilityModifierCrate.Config>;
    "visibility_modifier": FluentNode<"visibility_modifier", T.VisibilityModifier.Config>;
    "where_clause": FluentNode<"where_clause", T.WhereClause.Config>;
    "where_predicate": FluentNode<"where_predicate", T.WherePredicate.Config>;
    "while_expression": FluentNode<"while_expression", T.WhileExpression.Config>;
    "yield_expression": FluentNode<"yield_expression", T.YieldExpression.Config>;
    "string_content": T.StringContent;
    "raw_string_literal_content": T.RawStringLiteralContent;
    "float_literal": T.FloatLiteral;
    "_line_doc_content": T.LineDocContent;
    "_error_sentinel": T.ErrorSentinel;
};
export declare const _factoryMap: {
    readonly "_array_expression_list": typeof _arrayExpressionList;
    readonly "_array_expression_semi": typeof _arrayExpressionSemi;
    readonly "_closure_expression_block": typeof _closureExpressionBlock;
    readonly "_closure_expression_expr": typeof _closureExpressionExpr;
    readonly "_delim_token_tree_brace": typeof _delimTokenTreeBrace;
    readonly "_delim_token_tree_bracket": typeof _delimTokenTreeBracket;
    readonly "_delim_token_tree_paren": typeof _delimTokenTreeParen;
    readonly "_expression_statement_block_ending": typeof _expressionStatementBlockEnding;
    readonly "_expression_statement_with_semi": typeof _expressionStatementWithSemi;
    readonly "_field_identifier": typeof fieldIdentifier;
    readonly "_field_pattern_named": typeof _fieldPatternNamed;
    readonly "_field_pattern_shorthand": typeof _fieldPatternShorthand;
    readonly "_foreign_mod_item_body": typeof _foreignModItemBody;
    readonly "_function_type_fn_form": typeof functionTypeFnForm;
    readonly "_function_type_trait_form": typeof functionTypeTraitForm;
    readonly "_impl_item_body": typeof _implItemBody;
    readonly "_let_chain": typeof letChain;
    readonly "_line_comment_content": typeof lineCommentContent;
    readonly "_line_comment_doc": typeof _lineCommentDoc;
    readonly "_line_comment_regular_dslash": typeof lineCommentRegularDslash;
    readonly "_macro_definition_brace": typeof _macroDefinitionBrace;
    readonly "_macro_definition_bracket": typeof _macroDefinitionBracket;
    readonly "_macro_definition_paren": typeof _macroDefinitionParen;
    readonly "_match_arm_block_ending": typeof _matchArmBlockEnding;
    readonly "_match_arm_with_comma": typeof _matchArmWithComma;
    readonly "_mod_item_inline": typeof _modItemInline;
    readonly "_or_pattern_binary": typeof _orPatternBinary;
    readonly "_or_pattern_prefix": typeof _orPatternPrefix;
    readonly "_pointer_type_mut": typeof _pointerTypeMut;
    readonly "_range_expression_bare": typeof _rangeExpressionBare;
    readonly "_range_expression_binary": typeof _rangeExpressionBinary;
    readonly "_range_expression_postfix": typeof _rangeExpressionPostfix;
    readonly "_range_expression_prefix": typeof _rangeExpressionPrefix;
    readonly "_range_pattern_left_with_right": typeof _rangePatternLeftWithRight;
    readonly "_range_pattern_prefix": typeof _rangePatternPrefix;
    readonly "_reference_expression_raw_const": typeof referenceExpressionRawConst;
    readonly "_reference_expression_raw_mut": typeof referenceExpressionRawMut;
    readonly "_struct_item_brace": typeof _structItemBrace;
    readonly "_struct_item_tuple": typeof _structItemTuple;
    readonly "_token_tree_brace": typeof _tokenTreeBrace;
    readonly "_token_tree_bracket": typeof _tokenTreeBracket;
    readonly "_token_tree_paren": typeof _tokenTreeParen;
    readonly "_token_tree_pattern_brace": typeof _tokenTreePatternBrace;
    readonly "_token_tree_pattern_bracket": typeof _tokenTreePatternBracket;
    readonly "_token_tree_pattern_paren": typeof _tokenTreePatternParen;
    readonly "_type_identifier": typeof typeIdentifier;
    readonly "_visibility_modifier_crate": typeof _visibilityModifierCrate;
    readonly "_visibility_modifier_in_path": typeof _visibilityModifierInPath;
    readonly "_visibility_modifier_pub": typeof _visibilityModifierPub;
    readonly "abstract_type": typeof abstractType;
    readonly "arguments": typeof arguments_;
    readonly "array_expression": typeof arrayExpression;
    readonly "array_type": typeof arrayType;
    readonly "assignment_expression": typeof assignmentExpression;
    readonly "associated_type": typeof associatedType;
    readonly "async_block": typeof asyncBlock;
    readonly "attribute": typeof attribute;
    readonly "attribute_item": typeof attributeItem;
    readonly "await_expression": typeof awaitExpression;
    readonly "base_field_initializer": typeof baseFieldInitializer;
    readonly "binary_expression": typeof binaryExpression;
    readonly "block": typeof block;
    readonly "block_comment": typeof blockComment;
    readonly "boolean_literal": typeof booleanLiteral;
    readonly "bounded_type": typeof boundedType;
    readonly "bracketed_type": typeof bracketedType;
    readonly "break_expression": typeof breakExpression;
    readonly "call_expression": typeof callExpression;
    readonly "captured_pattern": typeof capturedPattern;
    readonly "char_literal": typeof charLiteral;
    readonly "closure_expression_expr": typeof closureExpressionExpr;
    readonly "closure_expression": typeof closureExpression;
    readonly "closure_parameters": typeof closureParameters;
    readonly "compound_assignment_expr": typeof compoundAssignmentExpr;
    readonly "const_block": typeof constBlock;
    readonly "const_item": typeof constItem;
    readonly "const_parameter": typeof constParameter;
    readonly "continue_expression": typeof continueExpression;
    readonly "crate": typeof crate;
    readonly "declaration_list": typeof declarationList;
    readonly "delim_token_tree_paren": typeof delimTokenTreeParen;
    readonly "delim_token_tree_bracket": typeof delimTokenTreeBracket;
    readonly "delim_token_tree_brace": typeof delimTokenTreeBrace;
    readonly "delim_token_tree": typeof delimTokenTree;
    readonly "dynamic_type": typeof dynamicType;
    readonly "else_clause": typeof elseClause;
    readonly "enum_item": typeof enumItem;
    readonly "enum_variant": typeof enumVariant;
    readonly "enum_variant_list": typeof enumVariantList;
    readonly "escape_sequence": typeof escapeSequence;
    readonly "expression_statement_with_semi": typeof expressionStatementWithSemi;
    readonly "expression_statement_block_ending": typeof expressionStatementBlockEnding;
    readonly "expression_statement": typeof expressionStatement;
    readonly "extern_crate_declaration": typeof externCrateDeclaration;
    readonly "extern_modifier": typeof externModifier;
    readonly "field_declaration": typeof fieldDeclaration;
    readonly "field_declaration_list": typeof fieldDeclarationList;
    readonly "field_expression": typeof fieldExpression;
    readonly "field_initializer": typeof fieldInitializer;
    readonly "field_initializer_list": typeof fieldInitializerList;
    readonly "field_pattern_shorthand": typeof fieldPatternShorthand;
    readonly "field_pattern": typeof fieldPattern;
    readonly "for_expression": typeof forExpression;
    readonly "for_lifetimes": typeof forLifetimes;
    readonly "foreign_mod_item_body": typeof foreignModItemBody;
    readonly "foreign_mod_item": typeof foreignModItem;
    readonly "fragment_specifier": typeof fragmentSpecifier;
    readonly "function_item": typeof functionItem;
    readonly "function_modifiers": typeof functionModifiers;
    readonly "function_signature_item": typeof functionSignatureItem;
    readonly "function_type": typeof functionType;
    readonly "gen_block": typeof genBlock;
    readonly "generic_function": typeof genericFunction;
    readonly "generic_pattern": typeof genericPattern;
    readonly "generic_type": typeof genericType;
    readonly "generic_type_with_turbofish": typeof genericTypeWithTurbofish;
    readonly "higher_ranked_trait_bound": typeof higherRankedTraitBound;
    readonly "identifier": typeof identifier;
    readonly "if_expression": typeof ifExpression;
    readonly "impl_item_body": typeof implItemBody;
    readonly "impl_item": typeof implItem;
    readonly "index_expression": typeof indexExpression;
    readonly "inner_attribute_item": typeof innerAttributeItem;
    readonly "integer_literal": typeof integerLiteral;
    readonly "label": typeof label;
    readonly "last_match_arm": typeof lastMatchArm;
    readonly "let_condition": typeof letCondition;
    readonly "let_declaration": typeof letDeclaration;
    readonly "lifetime": typeof lifetime;
    readonly "lifetime_parameter": typeof lifetimeParameter;
    readonly "line_comment": typeof lineComment;
    readonly "loop_expression": typeof loopExpression;
    readonly "macro_definition_paren": typeof macroDefinitionParen;
    readonly "macro_definition_bracket": typeof macroDefinitionBracket;
    readonly "macro_definition_brace": typeof macroDefinitionBrace;
    readonly "macro_definition": typeof macroDefinition;
    readonly "macro_invocation": typeof macroInvocation;
    readonly "macro_rule": typeof macroRule;
    readonly "match_arm_block_ending": typeof matchArmBlockEnding;
    readonly "match_arm": typeof matchArm;
    readonly "match_block": typeof matchBlock;
    readonly "match_expression": typeof matchExpression;
    readonly "match_pattern": typeof matchPattern;
    readonly "metavariable": typeof metavariable;
    readonly "mod_item_inline": typeof modItemInline;
    readonly "mod_item": typeof modItem;
    readonly "mut_pattern": typeof mutPattern;
    readonly "mutable_specifier": typeof mutableSpecifier;
    readonly "negative_literal": typeof negativeLiteral;
    readonly "or_pattern": typeof orPattern;
    readonly "ordered_field_declaration_list": typeof orderedFieldDeclarationList;
    readonly "parameter": typeof parameter;
    readonly "parameters": typeof parameters;
    readonly "parenthesized_expression": typeof parenthesizedExpression;
    readonly "pointer_type_mut": typeof pointerTypeMut;
    readonly "pointer_type": typeof pointerType;
    readonly "qualified_type": typeof qualifiedType;
    readonly "range_expression_bare": typeof rangeExpressionBare;
    readonly "range_expression": typeof rangeExpression;
    readonly "range_pattern": typeof rangePattern;
    readonly "raw_string_literal": typeof rawStringLiteral;
    readonly "ref_pattern": typeof refPattern;
    readonly "reference_expression": typeof referenceExpression;
    readonly "reference_pattern": typeof referencePattern;
    readonly "reference_type": typeof referenceType;
    readonly "removed_trait_bound": typeof removedTraitBound;
    readonly "return_expression": typeof returnExpression;
    readonly "scoped_identifier": typeof scopedIdentifier;
    readonly "scoped_type_identifier": typeof scopedTypeIdentifier;
    readonly "scoped_type_identifier_in_expression_position": typeof scopedTypeIdentifierInExpressionPosition;
    readonly "scoped_use_list": typeof scopedUseList;
    readonly "self": typeof self;
    readonly "self_parameter": typeof selfParameter;
    readonly "shebang": typeof shebang;
    readonly "shorthand_field_initializer": typeof shorthandFieldInitializer;
    readonly "slice_pattern": typeof slicePattern;
    readonly "source_file": typeof sourceFile;
    readonly "static_item": typeof staticItem;
    readonly "string_literal": typeof stringLiteral;
    readonly "struct_expression": typeof structExpression;
    readonly "struct_item": typeof structItem;
    readonly "struct_pattern": typeof structPattern;
    readonly "super": typeof super_;
    readonly "token_binding_pattern": typeof tokenBindingPattern;
    readonly "token_repetition": typeof tokenRepetition;
    readonly "token_repetition_pattern": typeof tokenRepetitionPattern;
    readonly "token_tree_paren": typeof tokenTreeParen;
    readonly "token_tree_bracket": typeof tokenTreeBracket;
    readonly "token_tree_brace": typeof tokenTreeBrace;
    readonly "token_tree": typeof tokenTree;
    readonly "token_tree_pattern_paren": typeof tokenTreePatternParen;
    readonly "token_tree_pattern_bracket": typeof tokenTreePatternBracket;
    readonly "token_tree_pattern_brace": typeof tokenTreePatternBrace;
    readonly "token_tree_pattern": typeof tokenTreePattern;
    readonly "trait_bounds": typeof traitBounds;
    readonly "trait_item": typeof traitItem;
    readonly "try_block": typeof tryBlock;
    readonly "try_expression": typeof tryExpression;
    readonly "tuple_expression": typeof tupleExpression;
    readonly "tuple_pattern": typeof tuplePattern;
    readonly "tuple_struct_pattern": typeof tupleStructPattern;
    readonly "tuple_type": typeof tupleType;
    readonly "type_arguments": typeof typeArguments;
    readonly "type_binding": typeof typeBinding;
    readonly "type_cast_expression": typeof typeCastExpression;
    readonly "type_item": typeof typeItem;
    readonly "type_parameter": typeof typeParameter;
    readonly "type_parameters": typeof typeParameters;
    readonly "unary_expression": typeof unaryExpression;
    readonly "union_item": typeof unionItem;
    readonly "unit_expression": typeof unitExpression;
    readonly "unit_type": typeof unitType;
    readonly "unsafe_block": typeof unsafeBlock;
    readonly "use_as_clause": typeof useAsClause;
    readonly "use_bounds": typeof useBounds;
    readonly "use_declaration": typeof useDeclaration;
    readonly "use_list": typeof useList;
    readonly "use_wildcard": typeof useWildcard;
    readonly "variadic_parameter": typeof variadicParameter;
    readonly "visibility_modifier_crate": typeof visibilityModifierCrate;
    readonly "visibility_modifier": typeof visibilityModifier;
    readonly "where_clause": typeof whereClause;
    readonly "where_predicate": typeof wherePredicate;
    readonly "while_expression": typeof whileExpression;
    readonly "yield_expression": typeof yieldExpression;
    readonly "string_content": typeof stringContent;
    readonly "raw_string_literal_content": typeof rawStringLiteralContent;
    readonly "float_literal": typeof floatLiteral;
    readonly "_line_doc_content": typeof lineDocContent;
    readonly "_error_sentinel": typeof errorSentinel;
};
export type _FactoryMap = typeof _factoryMap;
//# sourceMappingURL=factories.d.ts.map