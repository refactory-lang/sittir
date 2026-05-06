import type * as T from './types.js';
import { TSKindId } from './types.js';
import type { AnyNodeData, BooleanKeyword, ConfigOf, FluentNode } from '@sittir/types';
export declare function _arrowFunctionUCallSignature(config: T._ArrowFunctionUCallSignature.Config): {
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
};
export declare function _arrowFunctionParameter(config: T._ArrowFunctionParameter.Config): {
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
};
export declare function _callExpressionCall(config: T.CallExpressionCall.Config): {
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
};
export declare function _callExpressionMember(config: T.CallExpressionMember.Config): {
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
};
export declare function _callExpressionTemplateCall(config: T.CallExpressionTemplateCall.Config): {
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
};
export declare function _callSignature(config: T._CallSignature.Config): {
    $type: TSKindId._CallSignature;
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
};
export declare function classBodyMember(child: (T.AbstractMethodSignature | T.IndexSignature | T.MethodSignature | T.PublicFieldDefinition | T.Semicolon)): {
    $type: TSKindId.ClassBodyMember;
    $source: 2;
    $named: true;
    $children: (T.AbstractMethodSignature | T.AutomaticSemicolon | T.MethodSignature | T.PublicFieldDefinition | T.IndexSignature)[];
    children(): (T.AbstractMethodSignature | T.AutomaticSemicolon | T.MethodSignature | T.PublicFieldDefinition | T.IndexSignature)[];
    $with: {
        $child: (v: (T.AbstractMethodSignature | T.IndexSignature | T.MethodSignature | T.PublicFieldDefinition | T.Semicolon)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _classBodyMethod(config: T.ClassBodyMethod.Config): {
    $type: TSKindId.ClassBodyMethod;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    $children: [] | readonly [T.AutomaticSemicolon | T.MethodDefinition];
    decorator(): readonly T.Decorator[];
    children(): [] | readonly [T.AutomaticSemicolon | T.MethodDefinition];
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
        children: (items_0: T.AutomaticSemicolon | T.MethodDefinition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function classBodyMethodSig(child: (T.MethodSignature | T.FunctionSignatureAutomaticSemicolon)): {
    $type: TSKindId.ClassBodyMethodSig;
    $source: 2;
    $named: true;
    $children: (T.FunctionSignatureAutomaticSemicolon | T.MethodSignature)[];
    children(): (T.FunctionSignatureAutomaticSemicolon | T.MethodSignature)[];
    $with: {
        $child: (v: (T.MethodSignature | T.FunctionSignatureAutomaticSemicolon)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _classHeritageExtendsClause(child: (T.ExtendsClause | T.ImplementsClause)): {
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
export declare function _classHeritageImplementsClause(child: T.ImplementsClause): {
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
export declare function _exportStatementDefaultDeclArm(config: T.ExportStatementDefaultDeclArm.Config): {
    $type: TSKindId.ExportStatementDefaultDeclArm;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    $children: [] | readonly [T.ExportStatementDefaultDeclArmDefaultKw | T.Declaration];
    decorator(): readonly T.Decorator[];
    children(): [] | readonly [T.ExportStatementDefaultDeclArmDefaultKw | T.Declaration];
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
        children: (items_0: T.ExportStatementDefaultDeclArmDefaultKw | T.Declaration) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _exportStatementDefaultDeclArmDefaultKw(config: T.ExportStatementDefaultDeclArmDefaultKw.Config): {
    $type: TSKindId.ExportStatementDefaultDeclArmDefaultKw;
    $source: 2;
    $named: true;
    $children: [] | readonly [T.ExportStatementDefaultDeclArmDefaultKwValue | T.Declaration];
    children(): [] | readonly [T.ExportStatementDefaultDeclArmDefaultKwValue | T.Declaration];
    $with: {
        children: (items_0: T.ExportStatementDefaultDeclArmDefaultKwValue | T.Declaration) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _exportStatementDefaultDeclArmDefaultKwValue(config: T.ExportStatementDefaultDeclArmDefaultKwValue.Config): {
    $type: TSKindId.ExportStatementDefaultDeclArmDefaultKwValue;
    $source: 2;
    $named: true;
    _value: T.Expression;
    $children: [] | readonly [T.AutomaticSemicolon];
    value(): T.Expression;
    children(): [] | readonly [T.AutomaticSemicolon];
    $with: {
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
};
export declare function exportStatementDefaultFromArm(child: (T.ExportStatementDefaultFromArmStarFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmClauseFrom | T.ExportClause | T.Semicolon)): {
    $type: TSKindId.ExportStatementDefaultFromArm;
    $source: 2;
    $named: true;
    $children: (T.AutomaticSemicolon | T.ExportClause | T.ExportStatementDefaultFromArmClauseFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmStarFrom)[];
    children(): (T.AutomaticSemicolon | T.ExportClause | T.ExportStatementDefaultFromArmClauseFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmStarFrom)[];
    $with: {
        $child: (v: (T.ExportStatementDefaultFromArmStarFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmClauseFrom | T.ExportClause | T.Semicolon)) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportStatementDefaultFromArmClauseFrom(config: T.ExportStatementDefaultFromArmClauseFrom.Config): {
    $type: TSKindId.ExportStatementDefaultFromArmClauseFrom;
    $source: 2;
    $named: true;
    _source: T.String;
    $children: [] | readonly [T.ExportClause];
    source(): T.String;
    children(): [] | readonly [T.ExportClause];
    $with: {
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
        children: (items_0: T.ExportClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportStatementDefaultFromArmNsFrom(config: T.ExportStatementDefaultFromArmNsFrom.Config): {
    $type: TSKindId.ExportStatementDefaultFromArmNsFrom;
    $source: 2;
    $named: true;
    _source: T.String;
    $children: [] | readonly [T.NamespaceExport];
    source(): T.String;
    children(): [] | readonly [T.NamespaceExport];
    $with: {
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
        children: (items_0: T.NamespaceExport) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function exportStatementDefaultFromArmStarFrom(config: T.ExportStatementDefaultFromArmStarFrom.Config): {
    $type: TSKindId.ExportStatementDefaultFromArmStarFrom;
    $source: 2;
    $named: true;
    _source: T.String;
    source(): T.String;
    $with: {
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
};
export declare function _exportStatementEqualsExport(child: (T.Expression | T.Semicolon)): {
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
export declare function _exportStatementNamespaceExport(child: (T.Identifier | T.Semicolon)): {
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
export declare function _exportStatementTypeExport(config: T._ExportStatementTypeExport.Config): {
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
};
export declare function _extendsClauseSingle(config: T.ExtendsClauseSingle.Config): {
    $type: TSKindId.ExtendsClauseSingle;
    $source: 2;
    $named: true;
    _value: T.Expression;
    _type_arguments: T.TypeArguments | undefined;
    value(): T.Expression;
    typeArguments(): T.TypeArguments | undefined;
    $with: {
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _forHeader(config: T.ForHeader.Config): {
    $type: TSKindId.ForHeader;
    $source: 2;
    $named: true;
    _operator: "in" | "of";
    _right: T.SequenceExpression;
    $children: [] | readonly [T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind];
    operator(): "in" | "of";
    right(): T.SequenceExpression;
    children(): [] | readonly [T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind];
    $with: {
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
};
export declare function _forHeaderLetConstKind(config: T.ForHeaderLetConstKind.Config): {
    $type: TSKindId.ForHeaderLetConstKind;
    $source: 2;
    $named: true;
    _kind: "const" | "let";
    _left: T.Identifier | T.DestructuringPattern;
    $children: [] | readonly [T.AutomaticSemicolon];
    kind(): "const" | "let";
    left(): T.Identifier | T.DestructuringPattern;
    children(): [] | readonly [T.AutomaticSemicolon];
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
        left: (value: T.Identifier | T.DestructuringPattern) => /*elided*/ any & {
            $render(): string;
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
};
export declare function forHeaderLhs(config: T.ForHeaderLhs.Config): {
    $type: TSKindId.ForHeaderLhs;
    $source: 2;
    $named: true;
    _left: T.LhsExpression | T.ParenthesizedExpression;
    left(): T.LhsExpression | T.ParenthesizedExpression;
    $with: {
        left: (value: T.LhsExpression | T.ParenthesizedExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _forHeaderVarKind(config: T.ForHeaderVarKind.Config): {
    $type: TSKindId.ForHeaderVarKind;
    $source: 2;
    $named: true;
    _kind: "var";
    _left: T.Identifier | T.DestructuringPattern;
    $children: [] | readonly [T.Initializer];
    kind(): "var";
    left(): T.Identifier | T.DestructuringPattern;
    children(): [] | readonly [T.Initializer];
    $with: {
        left: (value: T.Identifier | T.DestructuringPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.Initializer) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _fromClause(config: T.FromClause.Config): {
    $type: TSKindId.FromClause;
    $source: 2;
    $named: true;
    _source: T.String;
    source(): T.String;
    $with: {
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
};
export declare function _importClauseDefaultImport(child: (T.ImportIdentifier | T.NamespaceImport | T.NamedImports)): {
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
export declare function _importClauseNamedImports(child: T.NamedImports): {
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
export declare function _importClauseNamespaceImport(child: T.NamespaceImport): {
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
export declare function _importSpecifierAs(config: T.ImportSpecifierAs.Config): {
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
};
export declare function _importSpecifierName(config: T._ImportSpecifierName.Config): {
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
};
export declare function _indexSignatureColon(config: T.IndexSignatureColon.Config): {
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
};
export declare function _indexSignatureMappedTypeClause(child: T.MappedTypeClause): {
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
export declare function _initializer(config: T.Initializer.Config): {
    $type: TSKindId.Initializer;
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
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _module(config: T._Module.Config): {
    $type: TSKindId._Module;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.NestedIdentifier | T.String;
    _body: T.StatementBlock | undefined;
    name(): T.Identifier | T.NestedIdentifier | T.String;
    body(): T.StatementBlock | undefined;
    $with: {
        name: (value: T.String | T.Identifier | T.NestedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value?: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _number(config: T._Number.Config): {
    $type: TSKindId._Number;
    $source: 2;
    $named: true;
    _operator: "+" | "-";
    _argument: string;
    operator(): "+" | "-";
    argument(): string;
    $with: {
        operator: (value: T.NumberOperator) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (value: T.Number) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _parameterName(config: T.ParameterName.Config): {
    $type: TSKindId.ParameterName;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    _readonly_marker: "readonly" | undefined;
    _pattern: T.This | T.Pattern;
    $children: [] | readonly [T.AccessibilityModifier | T.OverrideModifier];
    decorator(): readonly T.Decorator[];
    readonlyMarker(): "readonly" | undefined;
    pattern(): T.This | T.Pattern;
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
        readonlyMarker: (value?: BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function _parenthesizedExpressionSequence(child: T.SequenceExpression): {
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
export declare function _parenthesizedExpressionTyped(config: T.ParenthesizedExpressionTyped.Config): {
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
};
export declare function _publicFieldDefinitionAbstractFirst(config?: T.PublicFieldDefinitionAbstractFirst.Config): {
    $type: TSKindId.PublicFieldDefinitionAbstractFirst;
    $source: 2;
    $named: true;
    _abstract_marker: "abstract";
    _readonly_marker: "readonly" | undefined;
    abstractMarker(): "abstract";
    readonlyMarker(): "readonly" | undefined;
    $with: {
        readonlyMarker: (value?: BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _publicFieldDefinitionAccessFirst(config: T.PublicFieldDefinitionAccessFirst.Config): {
    $type: TSKindId.PublicFieldDefinitionAccessFirst;
    $source: 2;
    $named: true;
    _declare_marker: "declare" | undefined;
    $children: [] | readonly [T.AccessibilityModifier];
    declareMarker(): "declare" | undefined;
    children(): [] | readonly [T.AccessibilityModifier];
    $with: {
        declareMarker: (value?: BooleanKeyword<T.PublicFieldDefinitionAccessFirstDeclareMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.AccessibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function publicFieldDefinitionAccessorOpt(_config?: T.PublicFieldDefinitionAccessorOpt.Config): {
    $type: TSKindId.PublicFieldDefinitionAccessorOpt;
    $source: 2;
    $named: true;
    _accessor_marker: "accessor";
    accessorMarker(): "accessor";
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
export declare function publicFieldDefinitionDeclareFirst(child?: T.AccessibilityModifier): {
    $type: TSKindId.PublicFieldDefinitionDeclareFirst;
    $source: 2;
    $named: true;
    $children: T.AccessibilityModifier[];
    children(): T.AccessibilityModifier[];
    $with: {
        $child: (v: T.AccessibilityModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _publicFieldDefinitionReadonlyFirst(config?: T.PublicFieldDefinitionReadonlyFirst.Config): {
    $type: TSKindId.PublicFieldDefinitionReadonlyFirst;
    $source: 2;
    $named: true;
    _readonly_marker: "readonly";
    _abstract_marker: "abstract" | undefined;
    readonlyMarker(): "readonly";
    abstractMarker(): "abstract" | undefined;
    $with: {
        abstractMarker: (value?: BooleanKeyword<T.AbstractMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _publicFieldDefinitionStaticMods(config?: T.PublicFieldDefinitionStaticMods.Config): {
    $type: TSKindId.PublicFieldDefinitionStaticMods;
    $source: 2;
    $named: true;
    _static_marker: "static";
    _readonly_marker: "readonly" | undefined;
    $children: [] | readonly [T.OverrideModifier];
    staticMarker(): "static";
    readonlyMarker(): "readonly" | undefined;
    children(): [] | readonly [T.OverrideModifier];
    $with: {
        readonlyMarker: (value?: BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        children: (items_0: T.OverrideModifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _stringDouble(...children: (T.UnescapedDoubleStringFragment | T.EscapeSequence)[]): {
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
export declare function _stringSingle(...children: (T.UnescapedSingleStringFragment | T.EscapeSequence)[]): {
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
export declare function typeIdentifier(child: T.Identifier): {
    $type: TSKindId.TypeIdentifier;
    $source: 2;
    $named: true;
    $children: T.Identifier[];
    children(): T.Identifier[];
    $with: {
        $child: (v: T.Identifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _typeQueryCallExpression(config: T.TypeQueryCallExpression.Config): {
    $type: TSKindId.TypeQueryCallExpression;
    $source: 2;
    $named: true;
    _function: T.Identifier | T.Import | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _arguments: T.Arguments;
    function(): T.Identifier | T.Import | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    arguments(): T.Arguments;
    $with: {
        function: (value: T.Import | T.Identifier | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression) => /*elided*/ any & {
            $render(): string;
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
export declare function _typeQueryCallExpressionInTypeAnnotation(config: T.TypeQueryCallExpressionInTypeAnnotation.Config): {
    $type: TSKindId.TypeQueryCallExpressionInTypeAnnotation;
    $source: 2;
    $named: true;
    _function: T.Import | T.TypeQueryMemberExpressionInTypeAnnotation;
    _arguments: T.Arguments;
    function(): T.Import | T.TypeQueryMemberExpressionInTypeAnnotation;
    arguments(): T.Arguments;
    $with: {
        function: (value: T.Import | T.TypeQueryMemberExpressionInTypeAnnotation) => /*elided*/ any & {
            $render(): string;
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
export declare function _typeQueryInstantiationExpression(config: T.TypeQueryInstantiationExpression.Config): {
    $type: TSKindId.TypeQueryInstantiationExpression;
    $source: 2;
    $named: true;
    _function: T.Identifier | T.Import | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _type_arguments: T.TypeArguments;
    function(): T.Identifier | T.Import | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    typeArguments(): T.TypeArguments;
    $with: {
        function: (value: T.Import | T.Identifier | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _typeQueryMemberExpression(config: T.TypeQueryMemberExpression.Config): {
    $type: TSKindId.TypeQueryMemberExpression;
    $source: 2;
    $named: true;
    _object: T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _property: string;
    object(): T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    property(): string;
    $with: {
        object: (value: T.Identifier | T.This | T.TypeQuerySubscriptExpression | T.TypeQueryMemberExpression | T.TypeQueryCallExpression) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _typeQueryMemberExpressionInTypeAnnotation(config: T.TypeQueryMemberExpressionInTypeAnnotation.Config): {
    $type: TSKindId.TypeQueryMemberExpressionInTypeAnnotation;
    $source: 2;
    $named: true;
    _object: T.Import | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation;
    _property: string;
    object(): T.Import | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation;
    property(): string;
    $with: {
        object: (value: T.Import | T.TypeQueryMemberExpressionInTypeAnnotation | T.TypeQueryCallExpressionInTypeAnnotation) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _typeQuerySubscriptExpression(config: T.TypeQuerySubscriptExpression.Config): {
    $type: TSKindId.TypeQuerySubscriptExpression;
    $source: 2;
    $named: true;
    _object: T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _index: T.Number | T.PredefinedType | T.String;
    object(): T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    index(): T.Number | T.PredefinedType | T.String;
    $with: {
        object: (value: T.Identifier | T.This | T.TypeQuerySubscriptExpression | T.TypeQueryMemberExpression | T.TypeQueryCallExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        index: (value: T.PredefinedType | T.String | T.Number) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function _updateExpressionPostfix(config: T.UpdateExpressionPostfix.Config): {
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
};
export declare function _updateExpressionPrefix(config: T.UpdateExpressionPrefix.Config): {
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
};
export declare function abstractClassDeclaration(config: T.AbstractClassDeclaration.Config): {
    $type: TSKindId.AbstractClassDeclaration;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritage | undefined;
    _body: T.ClassBody;
    decorator(): readonly T.Decorator[];
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function abstractMethodSignature(config: T.AbstractMethodSignature.Config): {
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
        overrideModifier: (value?: BooleanKeyword<T._OverrideModifier>) => /*elided*/ any & {
            $render(): string;
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
        optionalMarker: (value?: BooleanKeyword<T.OptionalMarker>) => /*elided*/ any & {
            $render(): string;
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
export declare function accessibilityModifier(text: 'public' | 'private' | 'protected'): {
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
};
export declare function addingTypeAnnotation(type: T.Type): {
    $type: TSKindId.AddingTypeAnnotation;
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
};
export declare function ambientDeclaration(declaration: T.Declaration | "global" | T.StatementBlock | "module" | T.Identifier | T.Type | T.Semicolon): {
    $type: TSKindId.AmbientDeclaration;
    $source: 2;
    $named: true;
    _declaration: "global" | "module" | T.AutomaticSemicolon | T.StatementBlock | T.Declaration | T.Type;
    declaration(): "global" | "module" | T.AutomaticSemicolon | T.StatementBlock | T.Declaration | T.Type;
    $with: {
        declaration: (value: T.Declaration | "global" | T.StatementBlock | "module" | T.Identifier | T.Type | T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function arguments_(...children: (T.Expression | T.SpreadElement)[]): {
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
export declare function array(...children: (T.Expression | T.SpreadElement)[]): {
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
export declare function arrayPattern(...children: (T.Pattern | T.AssignmentPattern)[]): {
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
export declare function arrayType(primaryType: T.PrimaryType): {
    $type: TSKindId.ArrayType;
    $source: 2;
    $named: true;
    _primary_type: T.PrimaryType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (value: T.PrimaryType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function arrowFunctionParameter(parameter: T.ReservedIdentifier): {
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
};
export declare function arrowFunctionUCallSignature(config: T.ArrowFunctionUCallSignature.Config): {
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
};
export declare function arrowFunction(config: ConfigOf<T.ArrowFunctionUFormParameter>): ReturnType<typeof arrowFunctionUFormParameter>;
export declare function arrowFunction(config: ConfigOf<T.ArrowFunctionUFormUCallSignature>): ReturnType<typeof arrowFunctionUFormUCallSignature>;
export declare function arrowFunctionUFormParameter(config: Omit<ConfigOf<T.ArrowFunctionUFormParameter>, '$variant'>): {
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
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
export declare function arrowFunctionUFormUCallSignature(config: Omit<ConfigOf<T.ArrowFunctionUFormUCallSignature>, '$variant'>): {
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
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
export declare function asExpression(config: T.AsExpression.Config): {
    $type: TSKindId.AsExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _type_annotation: "const" | T.Type;
    expression(): T.Expression;
    typeAnnotation(): "const" | T.Type;
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
            })[]): AnyNodeData;
        };
        typeAnnotation: (value: "const" | T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function asserts(child: (T.TypePredicate | T.Identifier | T.This)): {
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
export declare function assertsAnnotation(asserts: T.AssertsAnnotationAsserts | T.Asserts): {
    $type: TSKindId.AssertsAnnotation;
    $source: 2;
    $named: true;
    _asserts: T.Asserts | T.AssertsAnnotationAsserts;
    asserts(): T.Asserts | T.AssertsAnnotationAsserts;
    $with: {
        asserts: (value: T.AssertsAnnotationAsserts | T.Asserts) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function assignmentExpression(config: T.AssignmentExpression.Config): {
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
        usingMarker: (value?: BooleanKeyword<T.AssignmentExpressionUsingMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function assignmentPattern(config: T.AssignmentPattern.Config): {
    $type: TSKindId.AssignmentPattern;
    $source: 2;
    $named: true;
    _left: T.Pattern;
    _right: T.Expression;
    left(): T.Pattern;
    right(): T.Expression;
    $with: {
        left: (value: T.Pattern) => /*elided*/ any & {
            $render(): string;
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
};
export declare function augmentedAssignmentExpression(config: T.AugmentedAssignmentExpression.Config): {
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
};
export declare function awaitExpression(expression: T.Expression): {
    $type: TSKindId.AwaitExpression;
    $source: 2;
    $named: true;
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
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function binaryExpression(config: T.BinaryExpression.Config): {
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
};
export declare function breakStatement(config: T.BreakStatement.Config): {
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
};
export declare function callExpression(config: ConfigOf<T.CallExpressionUFormCall>): ReturnType<typeof callExpressionUFormCall>;
export declare function callExpression(config: ConfigOf<T.CallExpressionUFormTemplateCall>): ReturnType<typeof callExpressionUFormTemplateCall>;
export declare function callExpression(config: ConfigOf<T.CallExpressionUFormMember>): ReturnType<typeof callExpressionUFormMember>;
export declare function callExpressionUFormCall(config: Omit<ConfigOf<T.CallExpressionUFormCall>, '$variant'>): {
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
export declare function callExpressionUFormTemplateCall(config: Omit<ConfigOf<T.CallExpressionUFormTemplateCall>, '$variant'>): {
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
export declare function callExpressionUFormMember(config: Omit<ConfigOf<T.CallExpressionUFormMember>, '$variant'>): {
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
export declare function callSignature(config: T.CallSignature.Config): {
    $type: TSKindId.CallSignature;
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
};
export declare function catchClause(config: T.CatchClause.Config): {
    $type: TSKindId.CatchClause;
    $source: 2;
    $named: true;
    _parameter: T.Identifier | T.DestructuringPattern | undefined;
    _type: T.TypeAnnotation | undefined;
    _body: T.StatementBlock;
    parameter(): T.Identifier | T.DestructuringPattern | undefined;
    typeField(): T.TypeAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        parameter: (value?: T.Identifier | T.DestructuringPattern) => /*elided*/ any & {
            $render(): string;
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
};
export declare function class_(config: T.Class.Config): {
    $type: TSKindId.Class;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[];
    _name: T.TypeIdentifier | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritage | undefined;
    _body: T.ClassBody;
    decorator(): readonly T.Decorator[];
    name(): T.TypeIdentifier | undefined;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
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
        name: (value?: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function classBody(...children: (T.ClassBodyMethod | T.ClassBodyMethodSig | T.ClassStaticBlock | T.ClassBodyMember)[]): {
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
export declare function classDeclaration(config: T.ClassDeclaration.Config): {
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
};
export declare function classHeritageExtendsClause(child: (T.ExtendsClause | T.ImplementsClause)): {
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
export declare function classHeritageImplementsClause(child: T.ImplementsClause): {
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
export declare function classHeritage(config: ConfigOf<T.ClassHeritageUFormExtendsClause>): ReturnType<typeof classHeritageUFormExtendsClause>;
export declare function classHeritage(config: ConfigOf<T.ClassHeritageUFormImplementsClause>): ReturnType<typeof classHeritageUFormImplementsClause>;
export declare function classHeritageUFormExtendsClause(config?: Omit<ConfigOf<T.ClassHeritageUFormExtendsClause>, '$variant'>): {
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
export declare function classHeritageUFormImplementsClause(config?: Omit<ConfigOf<T.ClassHeritageUFormImplementsClause>, '$variant'>): {
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
export declare function classStaticBlock(config: T.ClassStaticBlock.Config): {
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
    })[]): AnyNodeData;
};
export declare function computedPropertyName(expression: T.Expression): {
    $type: TSKindId.ComputedPropertyName;
    $source: 2;
    $named: true;
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
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function conditionalType(config: T.ConditionalType.Config): {
    $type: TSKindId.ConditionalType;
    $source: 2;
    $named: true;
    _left: T.Type;
    _right: T.Type;
    _consequence: T.Type;
    _alternative: T.Type;
    left(): T.Type;
    right(): T.Type;
    consequence(): T.Type;
    alternative(): T.Type;
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
        consequence: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternative: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function constraint(type: T.Type): {
    $type: TSKindId.Constraint;
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
};
export declare function constructSignature(config: T.ConstructSignature.Config): {
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
        abstractMarker: (value?: BooleanKeyword<T.AbstractMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function constructorType(config: T.ConstructorType.Config): {
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
        abstractMarker: (value?: BooleanKeyword<T.AbstractMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function continueStatement(config: T.ContinueStatement.Config): {
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
};
export declare function debuggerStatement(config: T.DebuggerStatement.Config): {
    $type: TSKindId.DebuggerStatement;
    $source: 2;
    $named: true;
    _semicolon: T.AutomaticSemicolon;
    semicolon(): T.AutomaticSemicolon;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function decorator(child: (T.Identifier | T.DecoratorMemberExpression | T.DecoratorCallExpression | T.DecoratorParenthesizedExpression)): {
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
export declare function decoratorCallExpression(config: T.DecoratorCallExpression.Config): {
    $type: TSKindId.DecoratorCallExpression;
    $source: 2;
    $named: true;
    _function: T.DecoratorMemberExpression | T.Identifier;
    _type_arguments: T.TypeArguments | undefined;
    _arguments: T.Arguments;
    function(): T.DecoratorMemberExpression | T.Identifier;
    typeArguments(): T.TypeArguments | undefined;
    arguments(): T.Arguments;
    $with: {
        function: (value: T.Identifier | T.DecoratorMemberExpression) => /*elided*/ any & {
            $render(): string;
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
export declare function decoratorMemberExpression(config: T.DecoratorMemberExpression.Config): {
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
};
export declare function decoratorParenthesizedExpression(child: (T.Identifier | T.DecoratorMemberExpression | T.DecoratorCallExpression)): {
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
export declare function defaultType(type: T.Type): {
    $type: TSKindId.DefaultType;
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
};
export declare function doStatement(config: T.DoStatement.Config): {
    $type: TSKindId.DoStatement;
    $source: 2;
    $named: true;
    _body: T.Statement;
    _condition: T.ParenthesizedExpression;
    _semicolon: T.AutomaticSemicolon | undefined;
    body(): T.Statement;
    condition(): T.ParenthesizedExpression;
    semicolon(): T.AutomaticSemicolon | undefined;
    $with: {
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
        condition: (value: T.ParenthesizedExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (value?: T.Semicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function elseClause(statement: T.Statement): {
    $type: TSKindId.ElseClause;
    $source: 2;
    $named: true;
    _statement: T.Statement;
    statement(): T.Statement;
    $with: {
        statement: (value: T.Statement) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function enumAssignment(config: T.EnumAssignment.Config): {
    $type: TSKindId.EnumAssignment;
    $source: 2;
    $named: true;
    _name: T.PropertyName;
    _value: T.Expression;
    name(): T.PropertyName;
    value(): T.Expression;
    $with: {
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
};
export declare function enumBody(config?: T.EnumBody.Config): {
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
export declare function enumDeclaration(config: T.EnumDeclaration.Config): {
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
        constMarker: (value?: BooleanKeyword<T.ConstMarker>) => /*elided*/ any & {
            $render(): string;
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
    })[]): AnyNodeData;
};
export declare function exportClause(...children: T.ExportSpecifier[]): {
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
export declare function exportSpecifier(config: T.ExportSpecifier.Config): {
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
};
export declare function exportStatementTypeExport(config: T.ExportStatementTypeExport.Config): {
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
};
export declare function exportStatementEqualsExport(child: (T.Expression | T.Semicolon)): {
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
export declare function exportStatementNamespaceExport(child: (T.Identifier | T.Semicolon)): {
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
export declare function exportStatement(config: ConfigOf<T.ExportStatementUFormDefault>): ReturnType<typeof exportStatementUFormDefault>;
export declare function exportStatement(config: ConfigOf<T.ExportStatementUFormTypeExport>): ReturnType<typeof exportStatementUFormTypeExport>;
export declare function exportStatement(config: ConfigOf<T.ExportStatementUFormEqualsExport>): ReturnType<typeof exportStatementUFormEqualsExport>;
export declare function exportStatement(config: ConfigOf<T.ExportStatementUFormNamespaceExport>): ReturnType<typeof exportStatementUFormNamespaceExport>;
export declare function exportStatementUFormDefault(config: Omit<ConfigOf<T.ExportStatementUFormDefault>, '$variant'>): {
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
export declare function exportStatementUFormTypeExport(config?: Omit<ConfigOf<T.ExportStatementUFormTypeExport>, '$variant'>): {
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
export declare function exportStatementUFormEqualsExport(config?: Omit<ConfigOf<T.ExportStatementUFormEqualsExport>, '$variant'>): {
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
export declare function exportStatementUFormNamespaceExport(config?: Omit<ConfigOf<T.ExportStatementUFormNamespaceExport>, '$variant'>): {
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
export declare function expressionStatement(config: T.ExpressionStatement.Config): {
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
};
export declare function extendsClause(config: T.ExtendsClause.Config): {
    $type: TSKindId.ExtendsClause;
    $source: 2;
    $named: true;
    _value: readonly [T.Expression, ...T.Expression[]];
    _type_arguments: T.TypeArguments | undefined;
    value(): readonly [T.Expression, ...T.Expression[]];
    typeArguments(): T.TypeArguments | undefined;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function extendsTypeClause(config: T.ExtendsTypeClause.Config): {
    $type: TSKindId.ExtendsTypeClause;
    $source: 2;
    $named: true;
    _type: readonly [T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier, ...(T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[]];
    typeField(): readonly [T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier, ...(T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[]];
    $with: {
        typeField: (values_0: T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier, ...values: (T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function false_(): {
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
};
export declare function finallyClause(body: T.StatementBlock): {
    $type: TSKindId.FinallyClause;
    $source: 2;
    $named: true;
    _body: T.StatementBlock;
    body(): T.StatementBlock;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function flowMaybeType(primaryType: T.PrimaryType): {
    $type: TSKindId.FlowMaybeType;
    $source: 2;
    $named: true;
    _primary_type: T.PrimaryType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (value: T.PrimaryType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function forInStatement(config: T.ForInStatement.Config): {
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
        awaitMarker: (value?: BooleanKeyword<T.ForInStatementAwaitMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function forStatement(config: T.ForStatement.Config): {
    $type: TSKindId.ForStatement;
    $source: 2;
    $named: true;
    _initializer: T.ForStatementInitializer | T.LexicalDeclaration | T.SequenceExpression | T.VariableDeclaration;
    _condition: T.EmptyStatement | T.SequenceExpression;
    _increment: T.SequenceExpression | undefined;
    _body: T.Statement;
    initializer(): T.ForStatementInitializer | T.LexicalDeclaration | T.SequenceExpression | T.VariableDeclaration;
    condition(): T.EmptyStatement | T.SequenceExpression;
    increment(): T.SequenceExpression | undefined;
    body(): T.Statement;
    $with: {
        initializer: (value: T.LexicalDeclaration | T.VariableDeclaration | T.Expressions | T.ForStatementInitializer) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        condition: (value: T.Expressions | T.EmptyStatement) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        increment: (value?: T.Expressions) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function formalParameters(...children: T.FormalParameter[]): {
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
export declare function functionDeclaration(config: T.FunctionDeclaration.Config): {
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
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function functionExpression(config: T.FunctionExpression.Config): {
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
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function functionSignature(config: T.FunctionSignature.Config): {
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
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function functionType(config: T.FunctionType.Config): {
    $type: TSKindId.FunctionType;
    $source: 2;
    $named: true;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.Asserts | T.TypePredicate | T.Type;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.Asserts | T.TypePredicate | T.Type;
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
        returnType: (value: T.Type | T.Asserts | T.TypePredicate) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function generatorFunction(config: T.GeneratorFunction.Config): {
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
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function generatorFunctionDeclaration(config: T.GeneratorFunctionDeclaration.Config): {
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
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function genericType(config: T.GenericType.Config): {
    $type: TSKindId.GenericType;
    $source: 2;
    $named: true;
    _name: T.NestedTypeIdentifier | T.TypeIdentifier;
    _type_arguments: T.TypeArguments;
    name(): T.NestedTypeIdentifier | T.TypeIdentifier;
    typeArguments(): T.TypeArguments;
    $with: {
        name: (value: T.TypeIdentifier | T.NestedTypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function hashBangLine(text: string): {
    $type: TSKindId.HashBangLine;
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
    })[]): AnyNodeData;
};
export declare function ifStatement(config: T.IfStatement.Config): {
    $type: TSKindId.IfStatement;
    $source: 2;
    $named: true;
    _condition: T.ParenthesizedExpression;
    _consequence: T.Statement;
    _alternative: T.ElseClause | undefined;
    condition(): T.ParenthesizedExpression;
    consequence(): T.Statement;
    alternative(): T.ElseClause | undefined;
    $with: {
        condition: (value: T.ParenthesizedExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        consequence: (value: T.Statement) => /*elided*/ any & {
            $render(): string;
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
};
export declare function implementsClause(...children: T.Type[]): {
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
export declare function import_(): {
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
};
export declare function importAlias(config: T.ImportAlias.Config): {
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
};
export declare function importAttribute(object: T.ImportAttributeObject | T.Object): {
    $type: TSKindId.ImportAttribute;
    $source: 2;
    $named: true;
    _object: T.ImportAttributeObject | T.Object;
    object(): T.ImportAttributeObject | T.Object;
    $with: {
        object: (value: T.ImportAttributeObject | T.Object) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function importClauseNamespaceImport(child: T.NamespaceImport): {
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
export declare function importClauseNamedImports(child: T.NamedImports): {
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
export declare function importClauseDefaultImport(child: (T.ImportIdentifier | T.NamespaceImport | T.NamedImports)): {
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
export declare function importClause(config: ConfigOf<T.ImportClauseUFormNamespaceImport>): ReturnType<typeof importClauseUFormNamespaceImport>;
export declare function importClause(config: ConfigOf<T.ImportClauseUFormNamedImports>): ReturnType<typeof importClauseUFormNamedImports>;
export declare function importClause(config: ConfigOf<T.ImportClauseUFormDefaultImport>): ReturnType<typeof importClauseUFormDefaultImport>;
export declare function importClauseUFormNamespaceImport(config?: Omit<ConfigOf<T.ImportClauseUFormNamespaceImport>, '$variant'>): {
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
export declare function importClauseUFormNamedImports(config?: Omit<ConfigOf<T.ImportClauseUFormNamedImports>, '$variant'>): {
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
export declare function importClauseUFormDefaultImport(config?: Omit<ConfigOf<T.ImportClauseUFormDefaultImport>, '$variant'>): {
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
export declare function importRequireClause(config: T.ImportRequireClause.Config): {
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
};
export declare function importSpecifierName(name: T.ImportIdentifier): {
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
};
export declare function importSpecifier(config: ConfigOf<T.ImportSpecifierUFormName>): ReturnType<typeof importSpecifierUFormName>;
export declare function importSpecifier(config: ConfigOf<T.ImportSpecifierUFormAs>): ReturnType<typeof importSpecifierUFormAs>;
export declare function importSpecifierUFormName(config: Omit<ConfigOf<T.ImportSpecifierUFormName>, '$variant'>): {
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
export declare function importSpecifierUFormAs(config: Omit<ConfigOf<T.ImportSpecifierUFormAs>, '$variant'>): {
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
export declare function importStatement(config: T.ImportStatement.Config): {
    $type: TSKindId.ImportStatement;
    $source: 2;
    $named: true;
    _import_clause: "type" | "typeof" | undefined;
    _from_clause: "from" | T.ImportRequireClause | T.ImportClause | T.String;
    _import_attribute: T.ImportAttribute | undefined;
    _semicolon: T.AutomaticSemicolon;
    importClause(): "type" | "typeof" | undefined;
    fromClause(): "from" | T.ImportRequireClause | T.ImportClause | T.String;
    importAttribute(): T.ImportAttribute | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        importClause: (value?: "type" | "typeof") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        fromClause: (value: T.ImportClause | "from" | T.String | T.ImportRequireClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importAttribute: (value?: T.ImportAttribute) => /*elided*/ any & {
            $render(): string;
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
};
export declare function indexSignatureMappedTypeClause(child: T.MappedTypeClause): {
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
export declare function indexSignature(config: ConfigOf<T.IndexSignatureUFormColon>): ReturnType<typeof indexSignatureUFormColon>;
export declare function indexSignature(config: ConfigOf<T.IndexSignatureUFormMappedTypeClause>): ReturnType<typeof indexSignatureUFormMappedTypeClause>;
export declare function indexSignatureUFormColon(config: Omit<ConfigOf<T.IndexSignatureUFormColon>, '$variant'>): {
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
export declare function indexSignatureUFormMappedTypeClause(config: Omit<ConfigOf<T.IndexSignatureUFormMappedTypeClause>, '$variant'>): {
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
export declare function indexTypeQuery(primaryType: T.PrimaryType): {
    $type: TSKindId.IndexTypeQuery;
    $source: 2;
    $named: true;
    _primary_type: T.PrimaryType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (value: T.PrimaryType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function inferType(config: T.InferType.Config): {
    $type: TSKindId.InferType;
    $source: 2;
    $named: true;
    _type_identifier: T.TypeIdentifier;
    _type: T.Type | undefined;
    typeIdentifier(): T.TypeIdentifier;
    typeField(): T.Type | undefined;
    $with: {
        typeIdentifier: (value: T.TypeIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeField: (value?: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function instantiationExpression(config: T.InstantiationExpression.Config): {
    $type: TSKindId.InstantiationExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _type_arguments: T.TypeArguments;
    expression(): T.Expression;
    typeArguments(): T.TypeArguments;
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
            })[]): AnyNodeData;
        };
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function interfaceDeclaration(config: T.InterfaceDeclaration.Config): {
    $type: TSKindId.InterfaceDeclaration;
    $source: 2;
    $named: true;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _extends_type_clause: T.ExtendsTypeClause | undefined;
    _body: T.ObjectType;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    extendsTypeClause(): T.ExtendsTypeClause | undefined;
    body(): T.ObjectType;
    $with: {
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
        extendsTypeClause: (value?: T.ExtendsTypeClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.ObjectType) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function internalModule(config: T.InternalModule.Config): {
    $type: TSKindId.InternalModule;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.NestedIdentifier | T.String;
    _body: T.StatementBlock | undefined;
    name(): T.Identifier | T.NestedIdentifier | T.String;
    body(): T.StatementBlock | undefined;
    $with: {
        name: (value: T.String | T.Identifier | T.NestedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value?: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function intersectionType(config: T.IntersectionType.Config): {
    $type: TSKindId.IntersectionType;
    $source: 2;
    $named: true;
    _left: T.Type | undefined;
    _right: T.Type;
    left(): T.Type | undefined;
    right(): T.Type;
    $with: {
        left: (value?: T.Type) => /*elided*/ any & {
            $render(): string;
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
};
export declare function labeledStatement(config: T.LabeledStatement.Config): {
    $type: TSKindId.LabeledStatement;
    $source: 2;
    $named: true;
    _label: T.StatementIdentifier;
    _body: T.Statement;
    label(): T.StatementIdentifier;
    body(): T.Statement;
    $with: {
        label: (value: T.StatementIdentifier) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function lexicalDeclaration(config: T.LexicalDeclaration.Config): {
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
};
export declare function literalType(child: (T._Number | T.Number | T.String | T.True | T.False | T.Null | T.Undefined)): {
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
export declare function lookupType(config: T.LookupType.Config): {
    $type: TSKindId.LookupType;
    $source: 2;
    $named: true;
    _primary_type: T.PrimaryType;
    _index_type: T.Type;
    primaryType(): T.PrimaryType;
    indexType(): T.Type;
    $with: {
        primaryType: (value: T.PrimaryType) => /*elided*/ any & {
            $render(): string;
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
export declare function mappedTypeClause(config: T.MappedTypeClause.Config): {
    $type: TSKindId.MappedTypeClause;
    $source: 2;
    $named: true;
    _name: T.TypeIdentifier;
    _type: T.Type;
    _alias: T.Type | undefined;
    name(): T.TypeIdentifier;
    typeField(): T.Type;
    alias(): T.Type | undefined;
    $with: {
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
        alias: (value?: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function memberExpression(config: T.MemberExpression.Config): {
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
};
export declare function metaProperty(text: string): {
    $type: TSKindId.MetaProperty;
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
};
export declare function methodDefinition(config: T.MethodDefinition.Config): {
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
        staticMarker: (value?: BooleanKeyword<T.StaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (value?: BooleanKeyword<T._OverrideModifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (value?: BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
        optionalMarker: (value?: BooleanKeyword<T.OptionalMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function methodSignature(config: T.MethodSignature.Config): {
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
        staticMarker: (value?: BooleanKeyword<T.StaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (value?: BooleanKeyword<T._OverrideModifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (value?: BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        asyncMarker: (value?: BooleanKeyword<T.AsyncMarker>) => /*elided*/ any & {
            $render(): string;
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
        optionalMarker: (value?: BooleanKeyword<T.OptionalMarker>) => /*elided*/ any & {
            $render(): string;
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
export declare function module(config: T.Module.Config): {
    $type: TSKindId.Module;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.NestedIdentifier | T.String;
    _body: T.StatementBlock | undefined;
    name(): T.Identifier | T.NestedIdentifier | T.String;
    body(): T.StatementBlock | undefined;
    $with: {
        name: (value: T.String | T.Identifier | T.NestedIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value?: T.StatementBlock) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function namedImports(...children: T.ImportSpecifier[]): {
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
export declare function namespaceExport(child: T.ModuleExportName): {
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
export declare function namespaceImport(identifier: T.Identifier): {
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
};
export declare function nestedIdentifier(config: T.NestedIdentifier.Config): {
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
};
export declare function nestedTypeIdentifier(config: T.NestedTypeIdentifier.Config): {
    $type: TSKindId.NestedTypeIdentifier;
    $source: 2;
    $named: true;
    _module: T.Identifier | T.NestedIdentifier;
    _name: T.TypeIdentifier;
    module(): T.Identifier | T.NestedIdentifier;
    name(): T.TypeIdentifier;
    $with: {
        module: (value: T.Identifier | T.NestedIdentifier) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function newExpression(config: T.NewExpression.Config): {
    $type: TSKindId.NewExpression;
    $source: 2;
    $named: true;
    _constructor: T.NonNullExpression;
    _type_arguments: T.TypeArguments | undefined;
    _arguments: T.Arguments | undefined;
    constructor(): T.NonNullExpression;
    typeArguments(): T.TypeArguments | undefined;
    arguments(): T.Arguments | undefined;
    $with: {
        constructor: (value: T.PrimaryExpression) => /*elided*/ any & {
            $render(): string;
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
        arguments: (value?: T.Arguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function nonNullExpression(expression: T.Expression): {
    $type: TSKindId.NonNullExpression;
    $source: 2;
    $named: true;
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
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function null_(): {
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
};
export declare function number(text: string): {
    $type: TSKindId.Number;
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
};
export declare function object(...children: (T.Pair | T.SpreadElement | T.MethodDefinition | T.ShorthandPropertyIdentifier)[]): {
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
export declare function objectAssignmentPattern(config: T.ObjectAssignmentPattern.Config): {
    $type: TSKindId.ObjectAssignmentPattern;
    $source: 2;
    $named: true;
    _left: T.DestructuringPattern | T.ShorthandPropertyIdentifierPattern;
    _right: T.Expression;
    left(): T.DestructuringPattern | T.ShorthandPropertyIdentifierPattern;
    right(): T.Expression;
    $with: {
        left: (value: T.ShorthandPropertyIdentifierPattern | T.DestructuringPattern) => /*elided*/ any & {
            $render(): string;
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
};
export declare function objectPattern(...children: (T.PairPattern | T.RestPattern | T.ObjectAssignmentPattern | T.ShorthandPropertyIdentifierPattern)[]): {
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
export declare function objectType(config: T.ObjectType.Config): {
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
};
export declare function objectTypeCurly(config: T.ObjectType.Curly.Config): {
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
};
export declare function objectTypeFlow(config: T.ObjectType.Flow.Config): {
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
};
export declare function omittingTypeAnnotation(type: T.Type): {
    $type: TSKindId.OmittingTypeAnnotation;
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
};
export declare function optingTypeAnnotation(type: T.Type): {
    $type: TSKindId.OptingTypeAnnotation;
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
};
export declare function optionalParameter(config: T.OptionalParameter.Config): {
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
        readonlyMarker: (value?: BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function optionalTupleParameter(config: T.OptionalTupleParameter.Config): {
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
};
export declare function optionalType(type: T.Type): {
    $type: TSKindId.OptionalType;
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
};
export declare function overrideModifier(): {
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
};
export declare function pair(config: T.Pair.Config): {
    $type: TSKindId.Pair;
    $source: 2;
    $named: true;
    _key: T.PropertyName;
    _value: T.Expression;
    key(): T.PropertyName;
    value(): T.Expression;
    $with: {
        key: (value: T.PropertyName) => /*elided*/ any & {
            $render(): string;
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
};
export declare function pairPattern(config: T.PairPattern.Config): {
    $type: TSKindId.PairPattern;
    $source: 2;
    $named: true;
    _key: T.PropertyName;
    _value: T.AssignmentPattern | T.Pattern;
    key(): T.PropertyName;
    value(): T.AssignmentPattern | T.Pattern;
    $with: {
        key: (value: T.PropertyName) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (value: T.Pattern | T.AssignmentPattern) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function parenthesizedExpressionSequence(child: T.SequenceExpression): {
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
export declare function parenthesizedExpression(config: ConfigOf<T.ParenthesizedExpressionUFormTyped>): ReturnType<typeof parenthesizedExpressionUFormTyped>;
export declare function parenthesizedExpression(config: ConfigOf<T.ParenthesizedExpressionUFormSequence>): ReturnType<typeof parenthesizedExpressionUFormSequence>;
export declare function parenthesizedExpressionUFormTyped(config?: Omit<ConfigOf<T.ParenthesizedExpressionUFormTyped>, '$variant'>): {
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
export declare function parenthesizedExpressionUFormSequence(config?: Omit<ConfigOf<T.ParenthesizedExpressionUFormSequence>, '$variant'>): {
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
export declare function parenthesizedType(type: T.Type): {
    $type: TSKindId.ParenthesizedType;
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
};
export declare function predefinedType(text: string): {
    $type: TSKindId.PredefinedType;
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
};
export declare function privatePropertyIdentifier(text: string): {
    $type: TSKindId.PrivatePropertyIdentifier;
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
};
export declare function program(config: T.Program.Config): {
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
};
export declare function propertySignature(config: T.PropertySignature.Config): {
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
        staticMarker: (value?: BooleanKeyword<T.StaticMarker>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (value?: BooleanKeyword<T._OverrideModifier>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (value?: BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
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
        optionalMarker: (value?: BooleanKeyword<T.OptionalMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function publicFieldDefinition(config: T.PublicFieldDefinition.Config): {
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
};
export declare function readonlyType(type: T.Type): {
    $type: TSKindId.ReadonlyType;
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
};
export declare function regex(config: T.Regex.Config): {
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
};
export declare function regexFlags(text: string): {
    $type: TSKindId.RegexFlags;
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
};
export declare function regexPattern(text: string): {
    $type: TSKindId.RegexPattern;
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
};
export declare function requiredParameter(config: T.RequiredParameter.Config): {
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
        readonlyMarker: (value?: BooleanKeyword<T.ReadonlyMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function restPattern(child: T.LhsExpression): {
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
export declare function restType(type: T.Type): {
    $type: TSKindId.RestType;
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
};
export declare function returnStatement(config: T.ReturnStatement.Config): {
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
};
export declare function satisfiesExpression(config: T.SatisfiesExpression.Config): {
    $type: TSKindId.SatisfiesExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _type_annotation: T.Type;
    expression(): T.Expression;
    typeAnnotation(): T.Type;
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
            })[]): AnyNodeData;
        };
        typeAnnotation: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function sequenceExpression(...children: T.Expression[]): {
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
export declare function spreadElement(expression: T.Expression): {
    $type: TSKindId.SpreadElement;
    $source: 2;
    $named: true;
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
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function statementBlock(config: T.StatementBlock.Config): {
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
};
export declare function stringDouble(...children: (T.UnescapedDoubleStringFragment | T.EscapeSequence)[]): {
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
export declare function stringSingle(...children: (T.UnescapedSingleStringFragment | T.EscapeSequence)[]): {
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
export declare function string(config: ConfigOf<T.StringUFormDouble>): ReturnType<typeof stringUFormDouble>;
export declare function string(config: ConfigOf<T.StringUFormSingle>): ReturnType<typeof stringUFormSingle>;
export declare function stringUFormDouble(config?: Omit<ConfigOf<T.StringUFormDouble>, '$variant'>): {
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
export declare function stringUFormSingle(config?: Omit<ConfigOf<T.StringUFormSingle>, '$variant'>): {
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
export declare function subscriptExpression(config: T.SubscriptExpression.Config): {
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
        optionalChain: (value?: BooleanKeyword<T.OptionalChain>) => /*elided*/ any & {
            $render(): string;
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
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function switchBody(...children: (T.SwitchCase | T.SwitchDefault)[]): {
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
export declare function switchCase(config: T.SwitchCase.Config): {
    $type: TSKindId.SwitchCase;
    $source: 2;
    $named: true;
    _value: T.SequenceExpression;
    _body: readonly T.Statement[];
    value(): T.SequenceExpression;
    body(): readonly T.Statement[];
    $with: {
        value: (value: T.Expressions) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function switchDefault(config: T.SwitchDefault.Config): {
    $type: TSKindId.SwitchDefault;
    $source: 2;
    $named: true;
    _body: readonly T.Statement[];
    body(): readonly T.Statement[];
    $with: {
        body: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function switchStatement(config: T.SwitchStatement.Config): {
    $type: TSKindId.SwitchStatement;
    $source: 2;
    $named: true;
    _value: T.ParenthesizedExpression;
    _body: T.SwitchBody;
    value(): T.ParenthesizedExpression;
    body(): T.SwitchBody;
    $with: {
        value: (value: T.ParenthesizedExpression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (value: T.SwitchBody) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function templateLiteralType(...children: (T.TemplateChars | T.TemplateType)[]): {
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
export declare function templateString(...children: (T.TemplateChars | T.EscapeSequence | T.TemplateSubstitution)[]): {
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
export declare function templateSubstitution(child: T.Expressions): {
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
export declare function templateType(child: (T.PrimaryType | T.InferType)): {
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
export declare function ternaryExpression(config: T.TernaryExpression.Config): {
    $type: TSKindId.TernaryExpression;
    $source: 2;
    $named: true;
    _condition: T.Expression;
    _consequence: T.Expression;
    _alternative: T.Expression;
    condition(): T.Expression;
    consequence(): T.Expression;
    alternative(): T.Expression;
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
        consequence: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
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
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function this_(): {
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
};
export declare function throwStatement(config: T.ThrowStatement.Config): {
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
};
export declare function true_(): {
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
};
export declare function tryStatement(config: T.TryStatement.Config): {
    $type: TSKindId.TryStatement;
    $source: 2;
    $named: true;
    _body: T.StatementBlock;
    _handler: T.CatchClause | undefined;
    _finalizer: T.FinallyClause | undefined;
    body(): T.StatementBlock;
    handler(): T.CatchClause | undefined;
    finalizer(): T.FinallyClause | undefined;
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
        handler: (value?: T.CatchClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        finalizer: (value?: T.FinallyClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function tupleParameter(config: T.TupleParameter.Config): {
    $type: TSKindId.TupleParameter;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.RestPattern;
    _type: T.TypeAnnotation;
    name(): T.Identifier | T.RestPattern;
    typeField(): T.TypeAnnotation;
    $with: {
        name: (value: T.Identifier | T.RestPattern) => /*elided*/ any & {
            $render(): string;
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
};
export declare function tupleType(...children: T.TupleTypeMember[]): {
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
export declare function typeAliasDeclaration(config: T.TypeAliasDeclaration.Config): {
    $type: TSKindId.TypeAliasDeclaration;
    $source: 2;
    $named: true;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _value: T.Type;
    _semicolon: T.AutomaticSemicolon;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    value(): T.Type;
    semicolon(): T.AutomaticSemicolon;
    $with: {
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
        value: (value: T.Type) => /*elided*/ any & {
            $render(): string;
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
};
export declare function typeAnnotation(type: T.Type): {
    $type: TSKindId.TypeAnnotation;
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
};
export declare function typeArguments(...children: T.Type[]): {
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
export declare function typeAssertion(config: T.TypeAssertion.Config): {
    $type: TSKindId.TypeAssertion;
    $source: 2;
    $named: true;
    _type_arguments: T.TypeArguments;
    _expression: T.Expression;
    typeArguments(): T.TypeArguments;
    expression(): T.Expression;
    $with: {
        typeArguments: (value: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        expression: (value: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function typeParameter(config: T.TypeParameter.Config): {
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
        constMarker: (value?: BooleanKeyword<T.ConstMarker>) => /*elided*/ any & {
            $render(): string;
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
};
export declare function typeParameters(...children: T.TypeParameter[]): {
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
export declare function typePredicate(config: T.TypePredicate.Config): {
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
};
export declare function typePredicateAnnotation(typePredicate: T.AssertsAnnotationAsserts | T.TypePredicate): {
    $type: TSKindId.TypePredicateAnnotation;
    $source: 2;
    $named: true;
    _type_predicate: T.AssertsAnnotationAsserts | T.TypePredicate;
    typePredicate(): T.AssertsAnnotationAsserts | T.TypePredicate;
    $with: {
        typePredicate: (value: T.AssertsAnnotationAsserts | T.TypePredicate) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function typeQuery(child: (T.TypeQuerySubscriptExpression | T.TypeQueryMemberExpression | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.Identifier | T.This)): {
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
export declare function unaryExpression(config: T.UnaryExpression.Config): {
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
};
export declare function undefined_(): {
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
};
export declare function unescapedDoubleStringFragment(text: string): {
    $type: TSKindId.UnescapedDoubleStringFragment;
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
};
export declare function unescapedSingleStringFragment(text: string): {
    $type: TSKindId.UnescapedSingleStringFragment;
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
};
export declare function unionType(config: T.UnionType.Config): {
    $type: TSKindId.UnionType;
    $source: 2;
    $named: true;
    _left: T.Type | undefined;
    _right: T.Type;
    left(): T.Type | undefined;
    right(): T.Type;
    $with: {
        left: (value?: T.Type) => /*elided*/ any & {
            $render(): string;
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
};
export declare function updateExpression(config: ConfigOf<T.UpdateExpressionUFormPostfix>): ReturnType<typeof updateExpressionUFormPostfix>;
export declare function updateExpression(config: ConfigOf<T.UpdateExpressionUFormPrefix>): ReturnType<typeof updateExpressionUFormPrefix>;
export declare function updateExpressionUFormPostfix(config: Omit<ConfigOf<T.UpdateExpressionUFormPostfix>, '$variant'>): {
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
export declare function updateExpressionUFormPrefix(config: Omit<ConfigOf<T.UpdateExpressionUFormPrefix>, '$variant'>): {
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
export declare function variableDeclaration(config: T.VariableDeclaration.Config): {
    $type: TSKindId.VariableDeclaration;
    $source: 2;
    $named: true;
    _declarators: readonly [T.VariableDeclarator, ...T.VariableDeclarator[]];
    _semicolon: T.AutomaticSemicolon;
    declarators(): readonly [T.VariableDeclarator, ...T.VariableDeclarator[]];
    semicolon(): T.AutomaticSemicolon;
    $with: {
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
};
export declare function variableDeclarator(config: T.VariableDeclarator.Config): {
    $type: TSKindId.VariableDeclarator;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.DestructuringPattern;
    _type: T.TypeAnnotation | undefined;
    _value: T.Expression | undefined;
    name(): T.Identifier | T.DestructuringPattern;
    typeField(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    $with: {
        name: (value: T.Identifier | T.DestructuringPattern) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function whileStatement(config: T.WhileStatement.Config): {
    $type: TSKindId.WhileStatement;
    $source: 2;
    $named: true;
    _condition: T.ParenthesizedExpression;
    _body: T.Statement;
    condition(): T.ParenthesizedExpression;
    body(): T.Statement;
    $with: {
        condition: (value: T.ParenthesizedExpression) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function withStatement(config: T.WithStatement.Config): {
    $type: TSKindId.WithStatement;
    $source: 2;
    $named: true;
    _object: T.ParenthesizedExpression;
    _body: T.Statement;
    object(): T.ParenthesizedExpression;
    body(): T.Statement;
    $with: {
        object: (value: T.ParenthesizedExpression) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function yieldExpression(expression?: T.Expression): {
    $type: TSKindId.YieldExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression | undefined;
    expression(): T.Expression | undefined;
    $with: {
        expression: (value?: T.Expression) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function automaticSemicolon(text: string): {
    $type: TSKindId.AutomaticSemicolon;
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
};
export declare function templateChars(text: string): {
    $type: TSKindId.TemplateChars;
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
};
export declare function ternaryQmark(text: string): {
    $type: TSKindId.TernaryQmark;
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
};
export declare function htmlComment(text: string): {
    $type: TSKindId.HtmlComment;
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
};
export declare function oror(text: string): {
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
};
export declare function jsxText(text: string): {
    $type: TSKindId.JsxText;
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
};
export declare function functionSignatureAutomaticSemicolon(text: string): {
    $type: TSKindId.FunctionSignatureAutomaticSemicolon;
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
};
export declare function errorRecovery(text: string): {
    $type: TSKindId.ErrorRecovery;
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
};
export type FluentKindMap = {
    "_arrow_function__call_signature": FluentNode<"_arrow_function__call_signature", T._ArrowFunctionUCallSignature.Config>;
    "_arrow_function_parameter": FluentNode<"_arrow_function_parameter", T._ArrowFunctionParameter.Config>;
    "_call_expression_call": T.CallExpressionCall;
    "_call_expression_member": T.CallExpressionMember;
    "_call_expression_template_call": T.CallExpressionTemplateCall;
    "_call_signature": T._CallSignature;
    "_class_body_member": FluentNode<"_class_body_member", T.ClassBodyMember.Config>;
    "_class_body_method": T.ClassBodyMethod;
    "_class_body_method_sig": FluentNode<"_class_body_method_sig", T.ClassBodyMethodSig.Config>;
    "_class_heritage_extends_clause": FluentNode<"_class_heritage_extends_clause", T._ClassHeritageExtendsClause.Config>;
    "_class_heritage_implements_clause": FluentNode<"_class_heritage_implements_clause", T._ClassHeritageImplementsClause.Config>;
    "_export_statement_default_decl_arm": T.ExportStatementDefaultDeclArm;
    "_export_statement_default_decl_arm_default_kw": T.ExportStatementDefaultDeclArmDefaultKw;
    "_export_statement_default_decl_arm_default_kw_value": T.ExportStatementDefaultDeclArmDefaultKwValue;
    "_export_statement_default_from_arm": FluentNode<"_export_statement_default_from_arm", T.ExportStatementDefaultFromArm.Config>;
    "_export_statement_default_from_arm_clause_from": FluentNode<"_export_statement_default_from_arm_clause_from", T.ExportStatementDefaultFromArmClauseFrom.Config>;
    "_export_statement_default_from_arm_ns_from": FluentNode<"_export_statement_default_from_arm_ns_from", T.ExportStatementDefaultFromArmNsFrom.Config>;
    "_export_statement_default_from_arm_star_from": FluentNode<"_export_statement_default_from_arm_star_from", T.ExportStatementDefaultFromArmStarFrom.Config>;
    "_export_statement_equals_export": FluentNode<"_export_statement_equals_export", T._ExportStatementEqualsExport.Config>;
    "_export_statement_namespace_export": FluentNode<"_export_statement_namespace_export", T._ExportStatementNamespaceExport.Config>;
    "_export_statement_type_export": FluentNode<"_export_statement_type_export", T._ExportStatementTypeExport.Config>;
    "_extends_clause_single": T.ExtendsClauseSingle;
    "_for_header": T.ForHeader;
    "_for_header_let_const_kind": T.ForHeaderLetConstKind;
    "_for_header_lhs": FluentNode<"_for_header_lhs", T.ForHeaderLhs.Config>;
    "_for_header_var_kind": T.ForHeaderVarKind;
    "_from_clause": T.FromClause;
    "_import_clause_default_import": FluentNode<"_import_clause_default_import", T._ImportClauseDefaultImport.Config>;
    "_import_clause_named_imports": FluentNode<"_import_clause_named_imports", T._ImportClauseNamedImports.Config>;
    "_import_clause_namespace_import": FluentNode<"_import_clause_namespace_import", T._ImportClauseNamespaceImport.Config>;
    "_import_specifier_as": T.ImportSpecifierAs;
    "_import_specifier_name": FluentNode<"_import_specifier_name", T._ImportSpecifierName.Config>;
    "_index_signature_colon": T.IndexSignatureColon;
    "_index_signature_mapped_type_clause": FluentNode<"_index_signature_mapped_type_clause", T._IndexSignatureMappedTypeClause.Config>;
    "_initializer": T.Initializer;
    "_module": T._Module;
    "_number": T._Number;
    "_parameter_name": T.ParameterName;
    "_parenthesized_expression_sequence": FluentNode<"_parenthesized_expression_sequence", T._ParenthesizedExpressionSequence.Config>;
    "_parenthesized_expression_typed": T.ParenthesizedExpressionTyped;
    "_public_field_definition_abstract_first": T.PublicFieldDefinitionAbstractFirst;
    "_public_field_definition_access_first": T.PublicFieldDefinitionAccessFirst;
    "_public_field_definition_accessor_opt": FluentNode<"_public_field_definition_accessor_opt", T.PublicFieldDefinitionAccessorOpt.Config>;
    "_public_field_definition_declare_first": FluentNode<"_public_field_definition_declare_first", T.PublicFieldDefinitionDeclareFirst.Config>;
    "_public_field_definition_readonly_first": T.PublicFieldDefinitionReadonlyFirst;
    "_public_field_definition_static_mods": T.PublicFieldDefinitionStaticMods;
    "_string_double": FluentNode<"_string_double", T._StringDouble.Config>;
    "_string_single": FluentNode<"_string_single", T._StringSingle.Config>;
    "_type_identifier": FluentNode<"_type_identifier", T.TypeIdentifier.Config>;
    "_type_query_call_expression": T.TypeQueryCallExpression;
    "_type_query_call_expression_in_type_annotation": T.TypeQueryCallExpressionInTypeAnnotation;
    "_type_query_instantiation_expression": T.TypeQueryInstantiationExpression;
    "_type_query_member_expression": T.TypeQueryMemberExpression;
    "_type_query_member_expression_in_type_annotation": T.TypeQueryMemberExpressionInTypeAnnotation;
    "_type_query_subscript_expression": T.TypeQuerySubscriptExpression;
    "_update_expression_postfix": T.UpdateExpressionPostfix;
    "_update_expression_prefix": T.UpdateExpressionPrefix;
    "abstract_class_declaration": FluentNode<"abstract_class_declaration", T.AbstractClassDeclaration.Config>;
    "abstract_method_signature": FluentNode<"abstract_method_signature", T.AbstractMethodSignature.Config>;
    "accessibility_modifier": T.AccessibilityModifier;
    "adding_type_annotation": FluentNode<"adding_type_annotation", T.AddingTypeAnnotation.Config>;
    "ambient_declaration": FluentNode<"ambient_declaration", T.AmbientDeclaration.Config>;
    "arguments": FluentNode<"arguments", T.Arguments.Config>;
    "array": FluentNode<"array", T.Array.Config>;
    "array_pattern": FluentNode<"array_pattern", T.ArrayPattern.Config>;
    "array_type": FluentNode<"array_type", T.ArrayType.Config>;
    "arrow_function_parameter": FluentNode<"arrow_function_parameter", T.ArrowFunctionParameter.Config>;
    "arrow_function__call_signature": FluentNode<"arrow_function__call_signature", T.ArrowFunctionUCallSignature.Config>;
    "arrow_function": FluentNode<"arrow_function", T.ArrowFunction.Config>;
    "as_expression": FluentNode<"as_expression", T.AsExpression.Config>;
    "asserts": FluentNode<"asserts", T.Asserts.Config>;
    "asserts_annotation": FluentNode<"asserts_annotation", T.AssertsAnnotation.Config>;
    "assignment_expression": FluentNode<"assignment_expression", T.AssignmentExpression.Config>;
    "assignment_pattern": FluentNode<"assignment_pattern", T.AssignmentPattern.Config>;
    "augmented_assignment_expression": FluentNode<"augmented_assignment_expression", T.AugmentedAssignmentExpression.Config>;
    "await_expression": FluentNode<"await_expression", T.AwaitExpression.Config>;
    "binary_expression": FluentNode<"binary_expression", T.BinaryExpression.Config>;
    "break_statement": FluentNode<"break_statement", T.BreakStatement.Config>;
    "call_expression": FluentNode<"call_expression", T.CallExpression.Config>;
    "call_signature": FluentNode<"call_signature", T.CallSignature.Config>;
    "catch_clause": FluentNode<"catch_clause", T.CatchClause.Config>;
    "class": FluentNode<"class", T.Class.Config>;
    "class_body": FluentNode<"class_body", T.ClassBody.Config>;
    "class_declaration": FluentNode<"class_declaration", T.ClassDeclaration.Config>;
    "class_heritage_extends_clause": FluentNode<"class_heritage_extends_clause", T.ClassHeritageExtendsClause.Config>;
    "class_heritage_implements_clause": FluentNode<"class_heritage_implements_clause", T.ClassHeritageImplementsClause.Config>;
    "class_heritage": FluentNode<"class_heritage", T.ClassHeritage.Config>;
    "class_static_block": FluentNode<"class_static_block", T.ClassStaticBlock.Config>;
    "comment": T.Comment;
    "computed_property_name": FluentNode<"computed_property_name", T.ComputedPropertyName.Config>;
    "conditional_type": FluentNode<"conditional_type", T.ConditionalType.Config>;
    "constraint": FluentNode<"constraint", T.Constraint.Config>;
    "construct_signature": FluentNode<"construct_signature", T.ConstructSignature.Config>;
    "constructor_type": FluentNode<"constructor_type", T.ConstructorType.Config>;
    "continue_statement": FluentNode<"continue_statement", T.ContinueStatement.Config>;
    "debugger_statement": FluentNode<"debugger_statement", T.DebuggerStatement.Config>;
    "decorator": FluentNode<"decorator", T.Decorator.Config>;
    "decorator_call_expression": FluentNode<"decorator_call_expression", T.DecoratorCallExpression.Config>;
    "decorator_member_expression": FluentNode<"decorator_member_expression", T.DecoratorMemberExpression.Config>;
    "decorator_parenthesized_expression": FluentNode<"decorator_parenthesized_expression", T.DecoratorParenthesizedExpression.Config>;
    "default_type": FluentNode<"default_type", T.DefaultType.Config>;
    "do_statement": FluentNode<"do_statement", T.DoStatement.Config>;
    "else_clause": FluentNode<"else_clause", T.ElseClause.Config>;
    "enum_assignment": FluentNode<"enum_assignment", T.EnumAssignment.Config>;
    "enum_body": FluentNode<"enum_body", T.EnumBody.Config>;
    "enum_declaration": FluentNode<"enum_declaration", T.EnumDeclaration.Config>;
    "escape_sequence": T.EscapeSequence;
    "export_clause": FluentNode<"export_clause", T.ExportClause.Config>;
    "export_specifier": FluentNode<"export_specifier", T.ExportSpecifier.Config>;
    "export_statement_type_export": FluentNode<"export_statement_type_export", T.ExportStatementTypeExport.Config>;
    "export_statement_equals_export": FluentNode<"export_statement_equals_export", T.ExportStatementEqualsExport.Config>;
    "export_statement_namespace_export": FluentNode<"export_statement_namespace_export", T.ExportStatementNamespaceExport.Config>;
    "export_statement": FluentNode<"export_statement", T.ExportStatement.Config>;
    "expression_statement": FluentNode<"expression_statement", T.ExpressionStatement.Config>;
    "extends_clause": FluentNode<"extends_clause", T.ExtendsClause.Config>;
    "extends_type_clause": FluentNode<"extends_type_clause", T.ExtendsTypeClause.Config>;
    "false": T.False;
    "finally_clause": FluentNode<"finally_clause", T.FinallyClause.Config>;
    "flow_maybe_type": FluentNode<"flow_maybe_type", T.FlowMaybeType.Config>;
    "for_in_statement": FluentNode<"for_in_statement", T.ForInStatement.Config>;
    "for_statement": FluentNode<"for_statement", T.ForStatement.Config>;
    "formal_parameters": FluentNode<"formal_parameters", T.FormalParameters.Config>;
    "function_declaration": FluentNode<"function_declaration", T.FunctionDeclaration.Config>;
    "function_expression": FluentNode<"function_expression", T.FunctionExpression.Config>;
    "function_signature": FluentNode<"function_signature", T.FunctionSignature.Config>;
    "function_type": FluentNode<"function_type", T.FunctionType.Config>;
    "generator_function": FluentNode<"generator_function", T.GeneratorFunction.Config>;
    "generator_function_declaration": FluentNode<"generator_function_declaration", T.GeneratorFunctionDeclaration.Config>;
    "generic_type": FluentNode<"generic_type", T.GenericType.Config>;
    "hash_bang_line": T.HashBangLine;
    "identifier": T.Identifier;
    "if_statement": FluentNode<"if_statement", T.IfStatement.Config>;
    "implements_clause": FluentNode<"implements_clause", T.ImplementsClause.Config>;
    "import": T.Import;
    "import_alias": FluentNode<"import_alias", T.ImportAlias.Config>;
    "import_attribute": FluentNode<"import_attribute", T.ImportAttribute.Config>;
    "import_clause_namespace_import": FluentNode<"import_clause_namespace_import", T.ImportClauseNamespaceImport.Config>;
    "import_clause_named_imports": FluentNode<"import_clause_named_imports", T.ImportClauseNamedImports.Config>;
    "import_clause_default_import": FluentNode<"import_clause_default_import", T.ImportClauseDefaultImport.Config>;
    "import_clause": FluentNode<"import_clause", T.ImportClause.Config>;
    "import_require_clause": FluentNode<"import_require_clause", T.ImportRequireClause.Config>;
    "import_specifier_name": FluentNode<"import_specifier_name", T.ImportSpecifierName.Config>;
    "import_specifier": FluentNode<"import_specifier", T.ImportSpecifier.Config>;
    "import_statement": FluentNode<"import_statement", T.ImportStatement.Config>;
    "index_signature_mapped_type_clause": FluentNode<"index_signature_mapped_type_clause", T.IndexSignatureMappedTypeClause.Config>;
    "index_signature": FluentNode<"index_signature", T.IndexSignature.Config>;
    "index_type_query": FluentNode<"index_type_query", T.IndexTypeQuery.Config>;
    "infer_type": FluentNode<"infer_type", T.InferType.Config>;
    "instantiation_expression": FluentNode<"instantiation_expression", T.InstantiationExpression.Config>;
    "interface_declaration": FluentNode<"interface_declaration", T.InterfaceDeclaration.Config>;
    "internal_module": FluentNode<"internal_module", T.InternalModule.Config>;
    "intersection_type": FluentNode<"intersection_type", T.IntersectionType.Config>;
    "labeled_statement": FluentNode<"labeled_statement", T.LabeledStatement.Config>;
    "lexical_declaration": FluentNode<"lexical_declaration", T.LexicalDeclaration.Config>;
    "literal_type": FluentNode<"literal_type", T.LiteralType.Config>;
    "lookup_type": FluentNode<"lookup_type", T.LookupType.Config>;
    "mapped_type_clause": FluentNode<"mapped_type_clause", T.MappedTypeClause.Config>;
    "member_expression": FluentNode<"member_expression", T.MemberExpression.Config>;
    "meta_property": T.MetaProperty;
    "method_definition": FluentNode<"method_definition", T.MethodDefinition.Config>;
    "method_signature": FluentNode<"method_signature", T.MethodSignature.Config>;
    "module": FluentNode<"module", T.Module.Config>;
    "named_imports": FluentNode<"named_imports", T.NamedImports.Config>;
    "namespace_export": FluentNode<"namespace_export", T.NamespaceExport.Config>;
    "namespace_import": FluentNode<"namespace_import", T.NamespaceImport.Config>;
    "nested_identifier": FluentNode<"nested_identifier", T.NestedIdentifier.Config>;
    "nested_type_identifier": FluentNode<"nested_type_identifier", T.NestedTypeIdentifier.Config>;
    "new_expression": FluentNode<"new_expression", T.NewExpression.Config>;
    "non_null_expression": FluentNode<"non_null_expression", T.NonNullExpression.Config>;
    "null": T.Null;
    "number": T.Number;
    "object": FluentNode<"object", T.Object.Config>;
    "object_assignment_pattern": FluentNode<"object_assignment_pattern", T.ObjectAssignmentPattern.Config>;
    "object_pattern": FluentNode<"object_pattern", T.ObjectPattern.Config>;
    "object_type": FluentNode<"object_type", T.ObjectType.Config>;
    "omitting_type_annotation": FluentNode<"omitting_type_annotation", T.OmittingTypeAnnotation.Config>;
    "opting_type_annotation": FluentNode<"opting_type_annotation", T.OptingTypeAnnotation.Config>;
    "optional_parameter": FluentNode<"optional_parameter", T.OptionalParameter.Config>;
    "optional_tuple_parameter": FluentNode<"optional_tuple_parameter", T.OptionalTupleParameter.Config>;
    "optional_type": FluentNode<"optional_type", T.OptionalType.Config>;
    "override_modifier": T.OverrideModifier;
    "pair": FluentNode<"pair", T.Pair.Config>;
    "pair_pattern": FluentNode<"pair_pattern", T.PairPattern.Config>;
    "parenthesized_expression_sequence": FluentNode<"parenthesized_expression_sequence", T.ParenthesizedExpressionSequence.Config>;
    "parenthesized_expression": FluentNode<"parenthesized_expression", T.ParenthesizedExpression.Config>;
    "parenthesized_type": FluentNode<"parenthesized_type", T.ParenthesizedType.Config>;
    "predefined_type": T.PredefinedType;
    "private_property_identifier": T.PrivatePropertyIdentifier;
    "program": FluentNode<"program", T.Program.Config>;
    "property_signature": FluentNode<"property_signature", T.PropertySignature.Config>;
    "public_field_definition": FluentNode<"public_field_definition", T.PublicFieldDefinition.Config>;
    "readonly_type": FluentNode<"readonly_type", T.ReadonlyType.Config>;
    "regex": FluentNode<"regex", T.Regex.Config>;
    "regex_flags": T.RegexFlags;
    "regex_pattern": T.RegexPattern;
    "required_parameter": FluentNode<"required_parameter", T.RequiredParameter.Config>;
    "rest_pattern": FluentNode<"rest_pattern", T.RestPattern.Config>;
    "rest_type": FluentNode<"rest_type", T.RestType.Config>;
    "return_statement": FluentNode<"return_statement", T.ReturnStatement.Config>;
    "satisfies_expression": FluentNode<"satisfies_expression", T.SatisfiesExpression.Config>;
    "sequence_expression": FluentNode<"sequence_expression", T.SequenceExpression.Config>;
    "spread_element": FluentNode<"spread_element", T.SpreadElement.Config>;
    "statement_block": FluentNode<"statement_block", T.StatementBlock.Config>;
    "string_double": FluentNode<"string_double", T.StringDouble.Config>;
    "string_single": FluentNode<"string_single", T.StringSingle.Config>;
    "string": FluentNode<"string", T.String.Config>;
    "subscript_expression": FluentNode<"subscript_expression", T.SubscriptExpression.Config>;
    "super": T.Super;
    "switch_body": FluentNode<"switch_body", T.SwitchBody.Config>;
    "switch_case": FluentNode<"switch_case", T.SwitchCase.Config>;
    "switch_default": FluentNode<"switch_default", T.SwitchDefault.Config>;
    "switch_statement": FluentNode<"switch_statement", T.SwitchStatement.Config>;
    "template_literal_type": FluentNode<"template_literal_type", T.TemplateLiteralType.Config>;
    "template_string": FluentNode<"template_string", T.TemplateString.Config>;
    "template_substitution": FluentNode<"template_substitution", T.TemplateSubstitution.Config>;
    "template_type": FluentNode<"template_type", T.TemplateType.Config>;
    "ternary_expression": FluentNode<"ternary_expression", T.TernaryExpression.Config>;
    "this": T.This;
    "throw_statement": FluentNode<"throw_statement", T.ThrowStatement.Config>;
    "true": T.True;
    "try_statement": FluentNode<"try_statement", T.TryStatement.Config>;
    "tuple_parameter": FluentNode<"tuple_parameter", T.TupleParameter.Config>;
    "tuple_type": FluentNode<"tuple_type", T.TupleType.Config>;
    "type_alias_declaration": FluentNode<"type_alias_declaration", T.TypeAliasDeclaration.Config>;
    "type_annotation": FluentNode<"type_annotation", T.TypeAnnotation.Config>;
    "type_arguments": FluentNode<"type_arguments", T.TypeArguments.Config>;
    "type_assertion": FluentNode<"type_assertion", T.TypeAssertion.Config>;
    "type_parameter": FluentNode<"type_parameter", T.TypeParameter.Config>;
    "type_parameters": FluentNode<"type_parameters", T.TypeParameters.Config>;
    "type_predicate": FluentNode<"type_predicate", T.TypePredicate.Config>;
    "type_predicate_annotation": FluentNode<"type_predicate_annotation", T.TypePredicateAnnotation.Config>;
    "type_query": FluentNode<"type_query", T.TypeQuery.Config>;
    "unary_expression": FluentNode<"unary_expression", T.UnaryExpression.Config>;
    "undefined": T.Undefined;
    "unescaped_double_string_fragment": T.UnescapedDoubleStringFragment;
    "unescaped_single_string_fragment": T.UnescapedSingleStringFragment;
    "union_type": FluentNode<"union_type", T.UnionType.Config>;
    "update_expression": FluentNode<"update_expression", T.UpdateExpression.Config>;
    "variable_declaration": FluentNode<"variable_declaration", T.VariableDeclaration.Config>;
    "variable_declarator": FluentNode<"variable_declarator", T.VariableDeclarator.Config>;
    "while_statement": FluentNode<"while_statement", T.WhileStatement.Config>;
    "with_statement": FluentNode<"with_statement", T.WithStatement.Config>;
    "yield_expression": FluentNode<"yield_expression", T.YieldExpression.Config>;
    "_automatic_semicolon": T.AutomaticSemicolon;
    "_template_chars": T.TemplateChars;
    "_ternary_qmark": T.TernaryQmark;
    "html_comment": T.HtmlComment;
    "||": T.Oror;
    "jsx_text": T.JsxText;
    "_function_signature_automatic_semicolon": T.FunctionSignatureAutomaticSemicolon;
    "__error_recovery": T.ErrorRecovery;
};
export declare const _factoryMap: {
    readonly "_arrow_function__call_signature": typeof _arrowFunctionUCallSignature;
    readonly "_arrow_function_parameter": typeof _arrowFunctionParameter;
    readonly "_call_expression_call": typeof _callExpressionCall;
    readonly "_call_expression_member": typeof _callExpressionMember;
    readonly "_call_expression_template_call": typeof _callExpressionTemplateCall;
    readonly "_call_signature": typeof _callSignature;
    readonly "_class_body_member": typeof classBodyMember;
    readonly "_class_body_method": typeof _classBodyMethod;
    readonly "_class_body_method_sig": typeof classBodyMethodSig;
    readonly "_class_heritage_extends_clause": typeof _classHeritageExtendsClause;
    readonly "_class_heritage_implements_clause": typeof _classHeritageImplementsClause;
    readonly "_export_statement_default_decl_arm": typeof _exportStatementDefaultDeclArm;
    readonly "_export_statement_default_decl_arm_default_kw": typeof _exportStatementDefaultDeclArmDefaultKw;
    readonly "_export_statement_default_decl_arm_default_kw_value": typeof _exportStatementDefaultDeclArmDefaultKwValue;
    readonly "_export_statement_default_from_arm": typeof exportStatementDefaultFromArm;
    readonly "_export_statement_default_from_arm_clause_from": typeof exportStatementDefaultFromArmClauseFrom;
    readonly "_export_statement_default_from_arm_ns_from": typeof exportStatementDefaultFromArmNsFrom;
    readonly "_export_statement_default_from_arm_star_from": typeof exportStatementDefaultFromArmStarFrom;
    readonly "_export_statement_equals_export": typeof _exportStatementEqualsExport;
    readonly "_export_statement_namespace_export": typeof _exportStatementNamespaceExport;
    readonly "_export_statement_type_export": typeof _exportStatementTypeExport;
    readonly "_extends_clause_single": typeof _extendsClauseSingle;
    readonly "_for_header": typeof _forHeader;
    readonly "_for_header_let_const_kind": typeof _forHeaderLetConstKind;
    readonly "_for_header_lhs": typeof forHeaderLhs;
    readonly "_for_header_var_kind": typeof _forHeaderVarKind;
    readonly "_from_clause": typeof _fromClause;
    readonly "_import_clause_default_import": typeof _importClauseDefaultImport;
    readonly "_import_clause_named_imports": typeof _importClauseNamedImports;
    readonly "_import_clause_namespace_import": typeof _importClauseNamespaceImport;
    readonly "_import_specifier_as": typeof _importSpecifierAs;
    readonly "_import_specifier_name": typeof _importSpecifierName;
    readonly "_index_signature_colon": typeof _indexSignatureColon;
    readonly "_index_signature_mapped_type_clause": typeof _indexSignatureMappedTypeClause;
    readonly "_initializer": typeof _initializer;
    readonly "_module": typeof _module;
    readonly "_number": typeof _number;
    readonly "_parameter_name": typeof _parameterName;
    readonly "_parenthesized_expression_sequence": typeof _parenthesizedExpressionSequence;
    readonly "_parenthesized_expression_typed": typeof _parenthesizedExpressionTyped;
    readonly "_public_field_definition_abstract_first": typeof _publicFieldDefinitionAbstractFirst;
    readonly "_public_field_definition_access_first": typeof _publicFieldDefinitionAccessFirst;
    readonly "_public_field_definition_accessor_opt": typeof publicFieldDefinitionAccessorOpt;
    readonly "_public_field_definition_declare_first": typeof publicFieldDefinitionDeclareFirst;
    readonly "_public_field_definition_readonly_first": typeof _publicFieldDefinitionReadonlyFirst;
    readonly "_public_field_definition_static_mods": typeof _publicFieldDefinitionStaticMods;
    readonly "_string_double": typeof _stringDouble;
    readonly "_string_single": typeof _stringSingle;
    readonly "_type_identifier": typeof typeIdentifier;
    readonly "_type_query_call_expression": typeof _typeQueryCallExpression;
    readonly "_type_query_call_expression_in_type_annotation": typeof _typeQueryCallExpressionInTypeAnnotation;
    readonly "_type_query_instantiation_expression": typeof _typeQueryInstantiationExpression;
    readonly "_type_query_member_expression": typeof _typeQueryMemberExpression;
    readonly "_type_query_member_expression_in_type_annotation": typeof _typeQueryMemberExpressionInTypeAnnotation;
    readonly "_type_query_subscript_expression": typeof _typeQuerySubscriptExpression;
    readonly "_update_expression_postfix": typeof _updateExpressionPostfix;
    readonly "_update_expression_prefix": typeof _updateExpressionPrefix;
    readonly "abstract_class_declaration": typeof abstractClassDeclaration;
    readonly "abstract_method_signature": typeof abstractMethodSignature;
    readonly "accessibility_modifier": typeof accessibilityModifier;
    readonly "adding_type_annotation": typeof addingTypeAnnotation;
    readonly "ambient_declaration": typeof ambientDeclaration;
    readonly "arguments": typeof arguments_;
    readonly "array": typeof array;
    readonly "array_pattern": typeof arrayPattern;
    readonly "array_type": typeof arrayType;
    readonly "arrow_function_parameter": typeof arrowFunctionParameter;
    readonly "arrow_function__call_signature": typeof arrowFunctionUCallSignature;
    readonly "arrow_function": typeof arrowFunction;
    readonly "as_expression": typeof asExpression;
    readonly "asserts": typeof asserts;
    readonly "asserts_annotation": typeof assertsAnnotation;
    readonly "assignment_expression": typeof assignmentExpression;
    readonly "assignment_pattern": typeof assignmentPattern;
    readonly "augmented_assignment_expression": typeof augmentedAssignmentExpression;
    readonly "await_expression": typeof awaitExpression;
    readonly "binary_expression": typeof binaryExpression;
    readonly "break_statement": typeof breakStatement;
    readonly "call_expression": typeof callExpression;
    readonly "call_signature": typeof callSignature;
    readonly "catch_clause": typeof catchClause;
    readonly "class": typeof class_;
    readonly "class_body": typeof classBody;
    readonly "class_declaration": typeof classDeclaration;
    readonly "class_heritage_extends_clause": typeof classHeritageExtendsClause;
    readonly "class_heritage_implements_clause": typeof classHeritageImplementsClause;
    readonly "class_heritage": typeof classHeritage;
    readonly "class_static_block": typeof classStaticBlock;
    readonly "comment": typeof comment;
    readonly "computed_property_name": typeof computedPropertyName;
    readonly "conditional_type": typeof conditionalType;
    readonly "constraint": typeof constraint;
    readonly "construct_signature": typeof constructSignature;
    readonly "constructor_type": typeof constructorType;
    readonly "continue_statement": typeof continueStatement;
    readonly "debugger_statement": typeof debuggerStatement;
    readonly "decorator": typeof decorator;
    readonly "decorator_call_expression": typeof decoratorCallExpression;
    readonly "decorator_member_expression": typeof decoratorMemberExpression;
    readonly "decorator_parenthesized_expression": typeof decoratorParenthesizedExpression;
    readonly "default_type": typeof defaultType;
    readonly "do_statement": typeof doStatement;
    readonly "else_clause": typeof elseClause;
    readonly "enum_assignment": typeof enumAssignment;
    readonly "enum_body": typeof enumBody;
    readonly "enum_declaration": typeof enumDeclaration;
    readonly "escape_sequence": typeof escapeSequence;
    readonly "export_clause": typeof exportClause;
    readonly "export_specifier": typeof exportSpecifier;
    readonly "export_statement_type_export": typeof exportStatementTypeExport;
    readonly "export_statement_equals_export": typeof exportStatementEqualsExport;
    readonly "export_statement_namespace_export": typeof exportStatementNamespaceExport;
    readonly "export_statement": typeof exportStatement;
    readonly "expression_statement": typeof expressionStatement;
    readonly "extends_clause": typeof extendsClause;
    readonly "extends_type_clause": typeof extendsTypeClause;
    readonly "false": typeof false_;
    readonly "finally_clause": typeof finallyClause;
    readonly "flow_maybe_type": typeof flowMaybeType;
    readonly "for_in_statement": typeof forInStatement;
    readonly "for_statement": typeof forStatement;
    readonly "formal_parameters": typeof formalParameters;
    readonly "function_declaration": typeof functionDeclaration;
    readonly "function_expression": typeof functionExpression;
    readonly "function_signature": typeof functionSignature;
    readonly "function_type": typeof functionType;
    readonly "generator_function": typeof generatorFunction;
    readonly "generator_function_declaration": typeof generatorFunctionDeclaration;
    readonly "generic_type": typeof genericType;
    readonly "hash_bang_line": typeof hashBangLine;
    readonly "identifier": typeof identifier;
    readonly "if_statement": typeof ifStatement;
    readonly "implements_clause": typeof implementsClause;
    readonly "import": typeof import_;
    readonly "import_alias": typeof importAlias;
    readonly "import_attribute": typeof importAttribute;
    readonly "import_clause_namespace_import": typeof importClauseNamespaceImport;
    readonly "import_clause_named_imports": typeof importClauseNamedImports;
    readonly "import_clause_default_import": typeof importClauseDefaultImport;
    readonly "import_clause": typeof importClause;
    readonly "import_require_clause": typeof importRequireClause;
    readonly "import_specifier_name": typeof importSpecifierName;
    readonly "import_specifier": typeof importSpecifier;
    readonly "import_statement": typeof importStatement;
    readonly "index_signature_mapped_type_clause": typeof indexSignatureMappedTypeClause;
    readonly "index_signature": typeof indexSignature;
    readonly "index_type_query": typeof indexTypeQuery;
    readonly "infer_type": typeof inferType;
    readonly "instantiation_expression": typeof instantiationExpression;
    readonly "interface_declaration": typeof interfaceDeclaration;
    readonly "internal_module": typeof internalModule;
    readonly "intersection_type": typeof intersectionType;
    readonly "labeled_statement": typeof labeledStatement;
    readonly "lexical_declaration": typeof lexicalDeclaration;
    readonly "literal_type": typeof literalType;
    readonly "lookup_type": typeof lookupType;
    readonly "mapped_type_clause": typeof mappedTypeClause;
    readonly "member_expression": typeof memberExpression;
    readonly "meta_property": typeof metaProperty;
    readonly "method_definition": typeof methodDefinition;
    readonly "method_signature": typeof methodSignature;
    readonly "module": typeof module;
    readonly "named_imports": typeof namedImports;
    readonly "namespace_export": typeof namespaceExport;
    readonly "namespace_import": typeof namespaceImport;
    readonly "nested_identifier": typeof nestedIdentifier;
    readonly "nested_type_identifier": typeof nestedTypeIdentifier;
    readonly "new_expression": typeof newExpression;
    readonly "non_null_expression": typeof nonNullExpression;
    readonly "null": typeof null_;
    readonly "number": typeof number;
    readonly "object": typeof object;
    readonly "object_assignment_pattern": typeof objectAssignmentPattern;
    readonly "object_pattern": typeof objectPattern;
    readonly "object_type": typeof objectType;
    readonly "omitting_type_annotation": typeof omittingTypeAnnotation;
    readonly "opting_type_annotation": typeof optingTypeAnnotation;
    readonly "optional_parameter": typeof optionalParameter;
    readonly "optional_tuple_parameter": typeof optionalTupleParameter;
    readonly "optional_type": typeof optionalType;
    readonly "override_modifier": typeof overrideModifier;
    readonly "pair": typeof pair;
    readonly "pair_pattern": typeof pairPattern;
    readonly "parenthesized_expression_sequence": typeof parenthesizedExpressionSequence;
    readonly "parenthesized_expression": typeof parenthesizedExpression;
    readonly "parenthesized_type": typeof parenthesizedType;
    readonly "predefined_type": typeof predefinedType;
    readonly "private_property_identifier": typeof privatePropertyIdentifier;
    readonly "program": typeof program;
    readonly "property_signature": typeof propertySignature;
    readonly "public_field_definition": typeof publicFieldDefinition;
    readonly "readonly_type": typeof readonlyType;
    readonly "regex": typeof regex;
    readonly "regex_flags": typeof regexFlags;
    readonly "regex_pattern": typeof regexPattern;
    readonly "required_parameter": typeof requiredParameter;
    readonly "rest_pattern": typeof restPattern;
    readonly "rest_type": typeof restType;
    readonly "return_statement": typeof returnStatement;
    readonly "satisfies_expression": typeof satisfiesExpression;
    readonly "sequence_expression": typeof sequenceExpression;
    readonly "spread_element": typeof spreadElement;
    readonly "statement_block": typeof statementBlock;
    readonly "string_double": typeof stringDouble;
    readonly "string_single": typeof stringSingle;
    readonly "string": typeof string;
    readonly "subscript_expression": typeof subscriptExpression;
    readonly "super": typeof super_;
    readonly "switch_body": typeof switchBody;
    readonly "switch_case": typeof switchCase;
    readonly "switch_default": typeof switchDefault;
    readonly "switch_statement": typeof switchStatement;
    readonly "template_literal_type": typeof templateLiteralType;
    readonly "template_string": typeof templateString;
    readonly "template_substitution": typeof templateSubstitution;
    readonly "template_type": typeof templateType;
    readonly "ternary_expression": typeof ternaryExpression;
    readonly "this": typeof this_;
    readonly "throw_statement": typeof throwStatement;
    readonly "true": typeof true_;
    readonly "try_statement": typeof tryStatement;
    readonly "tuple_parameter": typeof tupleParameter;
    readonly "tuple_type": typeof tupleType;
    readonly "type_alias_declaration": typeof typeAliasDeclaration;
    readonly "type_annotation": typeof typeAnnotation;
    readonly "type_arguments": typeof typeArguments;
    readonly "type_assertion": typeof typeAssertion;
    readonly "type_parameter": typeof typeParameter;
    readonly "type_parameters": typeof typeParameters;
    readonly "type_predicate": typeof typePredicate;
    readonly "type_predicate_annotation": typeof typePredicateAnnotation;
    readonly "type_query": typeof typeQuery;
    readonly "unary_expression": typeof unaryExpression;
    readonly "undefined": typeof undefined_;
    readonly "unescaped_double_string_fragment": typeof unescapedDoubleStringFragment;
    readonly "unescaped_single_string_fragment": typeof unescapedSingleStringFragment;
    readonly "union_type": typeof unionType;
    readonly "update_expression": typeof updateExpression;
    readonly "variable_declaration": typeof variableDeclaration;
    readonly "variable_declarator": typeof variableDeclarator;
    readonly "while_statement": typeof whileStatement;
    readonly "with_statement": typeof withStatement;
    readonly "yield_expression": typeof yieldExpression;
    readonly "_automatic_semicolon": typeof automaticSemicolon;
    readonly "_template_chars": typeof templateChars;
    readonly "_ternary_qmark": typeof ternaryQmark;
    readonly "html_comment": typeof htmlComment;
    readonly "||": typeof oror;
    readonly "jsx_text": typeof jsxText;
    readonly "_function_signature_automatic_semicolon": typeof functionSignatureAutomaticSemicolon;
    readonly "__error_recovery": typeof errorRecovery;
};
export type _FactoryMap = typeof _factoryMap;
//# sourceMappingURL=factories.d.ts.map