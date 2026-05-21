import type * as T from './types.js';
import { TSKindId } from './types.js';
import type { ConfigOf, FluentNode } from '@sittir/types';
export declare function _ambientDeclarationDeclaration(child: T.Declaration): {
    $type: TSKindId._AmbientDeclarationDeclaration;
    $source: 2;
    $named: true;
    _declaration: T.Declaration;
    declaration(): T.Declaration;
    $with: {
        $child: (v: T.Declaration) => /*elided*/ any & {
            $render(): string;
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
export declare function _ambientDeclarationGlobal(config: T.AmbientDeclarationGlobal.Config): {
    $type: TSKindId.AmbientDeclarationGlobal;
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
export declare function _ambientDeclarationModule(config: T.AmbientDeclarationModule.Config): {
    $type: TSKindId.AmbientDeclarationModule;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    _type: T.Type;
    _semicolon: T.AutomaticSemicolon | undefined;
    name(): T.Identifier;
    type(): T.Type;
    semicolon(): T.AutomaticSemicolon | undefined;
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
        semicolon: (value?: T.Semicolon) => /*elided*/ any & {
            $render(): string;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _arrowFunctionParameter(config: T._ArrowFunctionParameter.Config): {
    $type: TSKindId._ArrowFunctionParameter;
    $source: 2;
    $named: true;
    _parameter: T.ReservedIdentifier;
    parameter(): T.ReservedIdentifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _callExpressionMember(config: T.CallExpressionMember.Config): {
    $type: TSKindId.CallExpressionMember;
    $source: 2;
    $named: true;
    _function: T.PrimaryExpression;
    _type_arguments: T.TypeArguments | undefined;
    _arguments: T.Arguments;
    function(): T.PrimaryExpression;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _callExpressionTemplateCall(config: T.CallExpressionTemplateCall.Config): {
    $type: TSKindId.CallExpressionTemplateCall;
    $source: 2;
    $named: true;
    _function: T.NewExpression | T.PrimaryExpression;
    _arguments: T.TemplateString;
    function(): T.NewExpression | T.PrimaryExpression;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function classBodyMember(config: T.ClassBodyMember.Config): {
    $type: TSKindId.ClassBodyMember;
    $source: 2;
    $named: true;
    _abstract_method_signature: T.AbstractMethodSignature | T.MethodSignature | T.PublicFieldDefinition | T.IndexSignature;
    _semicolon: "," | T.AutomaticSemicolon;
    abstractMethodSignature(): T.AbstractMethodSignature | T.MethodSignature | T.PublicFieldDefinition | T.IndexSignature;
    semicolon(): "," | T.AutomaticSemicolon;
    $with: {
        abstractMethodSignature: (value: T.AbstractMethodSignature | T.IndexSignature | T.MethodSignature | T.PublicFieldDefinition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        semicolon: (value: T.Semicolon | ",") => /*elided*/ any & {
            $render(): string;
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
export declare function _classBodyMethod(config: T.ClassBodyMethod.Config): {
    $type: TSKindId.ClassBodyMethod;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _method_definition: T.MethodDefinition;
    _semicolon: T.AutomaticSemicolon | undefined;
    decorators(): readonly T.Decorator[] | undefined;
    methodDefinition(): T.MethodDefinition;
    semicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        methodDefinition: (value: T.MethodDefinition) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function classBodyMethodSig(config: T.ClassBodyMethodSig.Config): {
    $type: TSKindId.ClassBodyMethodSig;
    $source: 2;
    $named: true;
    _method_signature: T.MethodSignature;
    _function_signature_automatic_semicolon: "," | T.FunctionSignatureAutomaticSemicolon;
    methodSignature(): T.MethodSignature;
    functionSignatureAutomaticSemicolon(): "," | T.FunctionSignatureAutomaticSemicolon;
    $with: {
        methodSignature: (value: T.MethodSignature) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        functionSignatureAutomaticSemicolon: (value: T.FunctionSignatureAutomaticSemicolon | ",") => /*elided*/ any & {
            $render(): string;
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
export declare function _classHeritageExtendsClause(config: T._ClassHeritageExtendsClause.Config): {
    $type: TSKindId._ClassHeritageExtendsClause;
    $source: 2;
    $named: true;
    _extends_clause: T.ExtendsClause;
    _implements_clause: T.ImplementsClause | undefined;
    extendsClause(): T.ExtendsClause;
    implementsClause(): T.ImplementsClause | undefined;
    $with: {
        extendsClause: (value: T.ExtendsClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        implementsClause: (value?: T.ImplementsClause) => /*elided*/ any & {
            $render(): string;
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
export declare function _classHeritageImplementsClause(child: T.ImplementsClause): {
    $type: TSKindId._ClassHeritageImplementsClause;
    $source: 2;
    $named: true;
    _implements_clause: T.ImplementsClause;
    implementsClause(): T.ImplementsClause;
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
export declare function _exportStatementDefaultDeclArm(config?: Partial<T.ExportStatementDefaultDeclArm.Config>): {
    $type: TSKindId.ExportStatementDefaultDeclArm;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _declaration: T.Declaration | undefined;
    _export_statement_default_decl_arm_default_kw: T.ExportStatementDefaultDeclArmDefaultKw | undefined;
    decorators(): readonly T.Decorator[] | undefined;
    declaration(): T.Declaration | undefined;
    exportStatementDefaultDeclArmDefaultKw(): T.ExportStatementDefaultDeclArmDefaultKw | undefined;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        declaration: (value?: T.Declaration) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        exportStatementDefaultDeclArmDefaultKw: (value?: T.ExportStatementDefaultDeclArmDefaultKw) => /*elided*/ any & {
            $render(): string;
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
export declare function _exportStatementDefaultDeclArmDefaultKw(config?: Partial<T.ExportStatementDefaultDeclArmDefaultKw.Config>): {
    $type: TSKindId.ExportStatementDefaultDeclArmDefaultKw;
    $source: 2;
    $named: true;
    _declaration: T.Declaration | undefined;
    _export_statement_default_decl_arm_default_kw_value: T.ExportStatementDefaultDeclArmDefaultKwValue | undefined;
    declaration(): T.Declaration | undefined;
    exportStatementDefaultDeclArmDefaultKwValue(): T.ExportStatementDefaultDeclArmDefaultKwValue | undefined;
    $with: {
        declaration: (value?: T.Declaration) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        exportStatementDefaultDeclArmDefaultKwValue: (value?: T.ExportStatementDefaultDeclArmDefaultKwValue) => /*elided*/ any & {
            $render(): string;
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
export declare function _exportStatementDefaultDeclArmDefaultKwValue(config: T.ExportStatementDefaultDeclArmDefaultKwValue.Config): {
    $type: TSKindId.ExportStatementDefaultDeclArmDefaultKwValue;
    $source: 2;
    $named: true;
    _value: T.Expression;
    _semicolon: T.AutomaticSemicolon;
    value(): T.Expression;
    semicolon(): T.AutomaticSemicolon;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function exportStatementDefaultFromArm(config: T.ExportStatementDefaultFromArm.Config): {
    $type: TSKindId.ExportStatementDefaultFromArm;
    $source: 2;
    $named: true;
    _export_statement_default_from_arm_star_from: T.ExportClause | T.ExportStatementDefaultFromArmClauseFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmStarFrom;
    _semicolon: T.AutomaticSemicolon;
    exportStatementDefaultFromArmStarFrom(): T.ExportClause | T.ExportStatementDefaultFromArmClauseFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmStarFrom;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        exportStatementDefaultFromArmStarFrom: (value: T.ExportStatementDefaultFromArmStarFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmClauseFrom | T.ExportClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function exportStatementDefaultFromArmClauseFrom(config: T.ExportStatementDefaultFromArmClauseFrom.Config): {
    $type: TSKindId.ExportStatementDefaultFromArmClauseFrom;
    $source: 2;
    $named: true;
    _export_clause: T.ExportClause;
    _source: T.String;
    exportClause(): T.ExportClause;
    source(): T.String;
    $with: {
        exportClause: (value: T.ExportClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function exportStatementDefaultFromArmNsFrom(config: T.ExportStatementDefaultFromArmNsFrom.Config): {
    $type: TSKindId.ExportStatementDefaultFromArmNsFrom;
    $source: 2;
    $named: true;
    _namespace_export: T.NamespaceExport;
    _source: T.String;
    namespaceExport(): T.NamespaceExport;
    source(): T.String;
    $with: {
        namespaceExport: (value: T.NamespaceExport) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _exportStatementEqualsExport(config: T._ExportStatementEqualsExport.Config): {
    $type: TSKindId._ExportStatementEqualsExport;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _semicolon: T.AutomaticSemicolon;
    expression(): T.Expression;
    semicolon(): T.AutomaticSemicolon;
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
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
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
export declare function _exportStatementNamespaceExport(config: T._ExportStatementNamespaceExport.Config): {
    $type: TSKindId._ExportStatementNamespaceExport;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    _semicolon: T.AutomaticSemicolon;
    identifier(): T.Identifier;
    semicolon(): T.AutomaticSemicolon;
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
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
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
export declare function _exportStatementTypeExport(config: T._ExportStatementTypeExport.Config): {
    $type: TSKindId._ExportStatementTypeExport;
    $source: 2;
    $named: true;
    _export_clause: T.ExportClause;
    _source: T.String | undefined;
    _semicolon: T.AutomaticSemicolon;
    exportClause(): T.ExportClause;
    source(): T.String | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        exportClause: (value: T.ExportClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        source: (value?: T.String) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _forHeader(config: T.ForHeader.Config): {
    $type: TSKindId.ForHeader;
    $source: 2;
    $named: true;
    _for_header_lhs: T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind;
    _operator: unknown;
    _right: T.SequenceExpression;
    forHeaderLhs(): T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind;
    operator(): unknown;
    right(): T.SequenceExpression;
    $with: {
        forHeaderLhs: (value: T.ForHeaderLhs | T.ForHeaderVarKind | T.ForHeaderLetConstKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof _forHeader>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
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
    };
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
export declare function _forHeaderLetConstKind(config: T.ForHeaderLetConstKind.Config): {
    $type: TSKindId.ForHeaderLetConstKind;
    $source: 2;
    $named: true;
    _kind: unknown;
    _left: T.Identifier | T.DestructuringPattern;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    kind(): unknown;
    left(): T.Identifier | T.DestructuringPattern;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        kind: (value: NonNullable<Parameters<typeof _forHeaderLetConstKind>[0]>['kind']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _forHeaderVarKind(config: T.ForHeaderVarKind.Config): {
    $type: TSKindId.ForHeaderVarKind;
    $source: 2;
    $named: true;
    _kind: unknown;
    _left: T.Identifier | T.DestructuringPattern;
    _initializer: T.Initializer | undefined;
    kind(): unknown;
    left(): T.Identifier | T.DestructuringPattern;
    initializer(): T.Initializer | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        initializer: (value?: T.Initializer) => /*elided*/ any & {
            $render(): string;
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
export declare function _importClauseDefaultImport(config: T._ImportClauseDefaultImport.Config): {
    $type: TSKindId._ImportClauseDefaultImport;
    $source: 2;
    $named: true;
    _import_identifier: T.Identifier;
    _namespace_import: T.NamedImports | T.NamespaceImport | undefined;
    importIdentifier(): T.Identifier;
    namespaceImport(): T.NamedImports | T.NamespaceImport | undefined;
    $with: {
        importIdentifier: (value: T.ImportIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        namespaceImport: (value?: T.NamespaceImport | T.NamedImports) => /*elided*/ any & {
            $render(): string;
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
export declare function _importClauseNamedImports(child: T.NamedImports): {
    $type: TSKindId._ImportClauseNamedImports;
    $source: 2;
    $named: true;
    _named_imports: T.NamedImports;
    namedImports(): T.NamedImports;
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
export declare function _importClauseNamespaceImport(child: T.NamespaceImport): {
    $type: TSKindId._ImportClauseNamespaceImport;
    $source: 2;
    $named: true;
    _namespace_import: T.NamespaceImport;
    namespaceImport(): T.NamespaceImport;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _indexSignatureColon(config: T.IndexSignatureColon.Config): {
    $type: TSKindId.IndexSignatureColon;
    $source: 2;
    $named: true;
    _name: T.ReservedIdentifier;
    _index_type: T.Type;
    name(): T.ReservedIdentifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _indexSignatureMappedTypeClause(child: T.MappedTypeClause): {
    $type: TSKindId._IndexSignatureMappedTypeClause;
    $source: 2;
    $named: true;
    _mapped_type_clause: T.MappedTypeClause;
    mappedTypeClause(): T.MappedTypeClause;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _number(config: T._Number.Config): {
    $type: TSKindId._Number;
    $source: 2;
    $named: true;
    _operator: unknown;
    _argument: T.Number;
    operator(): unknown;
    argument(): T.Number;
    $with: {
        operator: (value: NonNullable<Parameters<typeof _number>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _parameterName(config: T.ParameterName.Config): {
    $type: TSKindId.ParameterName;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _accessibility_modifier: unknown;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _pattern: T.This | T.Pattern;
    decorators(): readonly T.Decorator[] | undefined;
    accessibilityModifier(): unknown;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    pattern(): T.This | T.Pattern;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        accessibilityModifier: (value?: NonNullable<Parameters<typeof _parameterName>[0]>['accessibilityModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        overrideModifier: (value?: NonNullable<Parameters<typeof _parameterName>[0]>['overrideModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        readonlyMarker: (value?: NonNullable<Parameters<typeof _parameterName>[0]>['readonlyMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _parenthesizedExpressionSequence(child: T.SequenceExpression): {
    $type: TSKindId._ParenthesizedExpressionSequence;
    $source: 2;
    $named: true;
    _sequence_expression: T.SequenceExpression;
    sequenceExpression(): T.SequenceExpression;
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
export declare function _parenthesizedExpressionTyped(config: T.ParenthesizedExpressionTyped.Config): {
    $type: TSKindId.ParenthesizedExpressionTyped;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _type: T.TypeAnnotation | undefined;
    expression(): T.Expression;
    type(): T.TypeAnnotation | undefined;
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
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
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
export declare function _publicFieldDefinitionAbstractFirst(config?: Partial<T.PublicFieldDefinitionAbstractFirst.Config>): {
    $type: TSKindId.PublicFieldDefinitionAbstractFirst;
    $source: 2;
    $named: true;
    _abstract_marker: unknown;
    _readonly_marker: true | undefined;
    abstractMarker(): unknown;
    readonlyMarker(): true | undefined;
    $with: {
        readonlyMarker: (value?: NonNullable<Parameters<typeof _publicFieldDefinitionAbstractFirst>[0]>['readonlyMarker']) => /*elided*/ any & {
            $render(): string;
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
export declare function _publicFieldDefinitionAccessFirst(config: T.PublicFieldDefinitionAccessFirst.Config): {
    $type: TSKindId.PublicFieldDefinitionAccessFirst;
    $source: 2;
    $named: true;
    _accessibility_modifier: unknown;
    _declare_marker: true | undefined;
    accessibilityModifier(): unknown;
    declareMarker(): true | undefined;
    $with: {
        accessibilityModifier: (value: NonNullable<Parameters<typeof _publicFieldDefinitionAccessFirst>[0]>['accessibilityModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        declareMarker: (value?: NonNullable<Parameters<typeof _publicFieldDefinitionAccessFirst>[0]>['declareMarker']) => /*elided*/ any & {
            $render(): string;
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
export declare function publicFieldDefinitionAccessorOpt(_config?: T.PublicFieldDefinitionAccessorOpt.Config): {
    $type: TSKindId.PublicFieldDefinitionAccessorOpt;
    $source: 2;
    $named: true;
    _accessor_marker: unknown;
    accessorMarker(): unknown;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function publicFieldDefinitionDeclareFirst(child?: T.AccessibilityModifier): {
    $type: TSKindId.PublicFieldDefinitionDeclareFirst;
    $source: 2;
    $named: true;
    _accessibility_modifier: T.AccessibilityModifier | undefined;
    accessibilityModifier(): T.AccessibilityModifier | undefined;
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
export declare function _publicFieldDefinitionReadonlyFirst(config?: Partial<T.PublicFieldDefinitionReadonlyFirst.Config>): {
    $type: TSKindId.PublicFieldDefinitionReadonlyFirst;
    $source: 2;
    $named: true;
    _readonly_marker: unknown;
    _abstract_marker: true | undefined;
    readonlyMarker(): unknown;
    abstractMarker(): true | undefined;
    $with: {
        abstractMarker: (value?: NonNullable<Parameters<typeof _publicFieldDefinitionReadonlyFirst>[0]>['abstractMarker']) => /*elided*/ any & {
            $render(): string;
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
export declare function _publicFieldDefinitionStaticMods(config?: Partial<T.PublicFieldDefinitionStaticMods.Config>): {
    $type: TSKindId.PublicFieldDefinitionStaticMods;
    $source: 2;
    $named: true;
    _static_marker: unknown;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    staticMarker(): unknown;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    $with: {
        overrideModifier: (value?: NonNullable<Parameters<typeof _publicFieldDefinitionStaticMods>[0]>['overrideModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        readonlyMarker: (value?: NonNullable<Parameters<typeof _publicFieldDefinitionStaticMods>[0]>['readonlyMarker']) => /*elided*/ any & {
            $render(): string;
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
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _typeQueryMemberExpression(config: T.TypeQueryMemberExpression.Config): {
    $type: TSKindId.TypeQueryMemberExpression;
    $source: 2;
    $named: true;
    _object: T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _property: T.Identifier | T.PrivatePropertyIdentifier;
    object(): T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    property(): T.Identifier | T.PrivatePropertyIdentifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _typeQueryMemberExpressionInTypeAnnotation(config: T.TypeQueryMemberExpressionInTypeAnnotation.Config): {
    $type: TSKindId.TypeQueryMemberExpressionInTypeAnnotation;
    $source: 2;
    $named: true;
    _object: T.Import | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation;
    _property: T.Identifier | T.PrivatePropertyIdentifier;
    object(): T.Import | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation;
    property(): T.Identifier | T.PrivatePropertyIdentifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function _updateExpressionPostfix(config: T.UpdateExpressionPostfix.Config): {
    $type: TSKindId.UpdateExpressionPostfix;
    $source: 2;
    $named: true;
    _argument: T.Expression;
    _operator: unknown;
    argument(): T.Expression;
    operator(): unknown;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof _updateExpressionPostfix>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
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
export declare function _updateExpressionPrefix(config: T.UpdateExpressionPrefix.Config): {
    $type: TSKindId.UpdateExpressionPrefix;
    $source: 2;
    $named: true;
    _operator: unknown;
    _argument: T.Expression;
    operator(): unknown;
    argument(): T.Expression;
    $with: {
        operator: (value: NonNullable<Parameters<typeof _updateExpressionPrefix>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function abstractClassDeclaration(config: T.AbstractClassDeclaration.Config): {
    $type: TSKindId.AbstractClassDeclaration;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritage | undefined;
    _body: T.ClassBody;
    decorators(): readonly T.Decorator[] | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function abstractMethodSignature(config: T.AbstractMethodSignature.Config): {
    $type: TSKindId.AbstractMethodSignature;
    $source: 2;
    $named: true;
    _accessibility_modifier: unknown;
    _override_modifier: true | undefined;
    _accessor_kind: unknown;
    _name: T.PropertyName;
    _optional_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    accessibilityModifier(): unknown;
    overrideModifier(): true | undefined;
    accessorKind(): unknown;
    name(): T.PropertyName;
    optionalMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        accessibilityModifier: (value?: NonNullable<Parameters<typeof abstractMethodSignature>[0]>['accessibilityModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        overrideModifier: (value?: NonNullable<Parameters<typeof abstractMethodSignature>[0]>['overrideModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        accessorKind: (value?: NonNullable<Parameters<typeof abstractMethodSignature>[0]>['accessorKind']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        optionalMarker: (value?: NonNullable<Parameters<typeof abstractMethodSignature>[0]>['optionalMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function addingTypeAnnotation(type: T.AddingTypeAnnotation.Config['type']): {
    $type: TSKindId.AddingTypeAnnotation;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.AddingTypeAnnotation.Config['type']) => /*elided*/ any & {
            $render(): string;
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
export declare function ambientDeclarationDeclaration(child: T.Declaration): {
    $type: TSKindId._AmbientDeclarationDeclaration;
    $source: 2;
    $named: true;
    _declaration: T.Declaration;
    declaration(): T.Declaration;
    $with: {
        $child: (v: T.Declaration) => /*elided*/ any & {
            $render(): string;
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
export declare function ambientDeclaration(config: ConfigOf<T.AmbientDeclarationUFormDeclaration>): ReturnType<typeof ambientDeclarationUFormDeclaration>;
export declare function ambientDeclaration(config: ConfigOf<T.AmbientDeclarationUFormGlobal>): ReturnType<typeof ambientDeclarationUFormGlobal>;
export declare function ambientDeclaration(config: ConfigOf<T.AmbientDeclarationUFormModule>): ReturnType<typeof ambientDeclarationUFormModule>;
export declare function ambientDeclarationUFormDeclaration(config: Omit<ConfigOf<T.AmbientDeclarationUFormDeclaration>, '$variant'>): {
    $type: TSKindId.AmbientDeclaration;
    $source: 2;
    $named: true;
    $variant: 'declaration';
    _ambient_declaration_declaration: T._AmbientDeclarationDeclaration;
    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration;
    $with: {
        ambientDeclarationDeclaration: (value: T._AmbientDeclarationDeclaration) => /*elided*/ any & {
            $render(): string;
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
export declare function ambientDeclarationUFormGlobal(config: Omit<ConfigOf<T.AmbientDeclarationUFormGlobal>, '$variant'>): {
    $type: TSKindId.AmbientDeclaration;
    $source: 2;
    $named: true;
    $variant: 'global';
    _ambient_declaration_global: T.AmbientDeclarationGlobal;
    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal;
    $with: {
        ambientDeclarationGlobal: (value: T.AmbientDeclarationGlobal) => /*elided*/ any & {
            $render(): string;
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
export declare function ambientDeclarationUFormModule(config: Omit<ConfigOf<T.AmbientDeclarationUFormModule>, '$variant'>): {
    $type: TSKindId.AmbientDeclaration;
    $source: 2;
    $named: true;
    $variant: 'module';
    _ambient_declaration_module: T.AmbientDeclarationModule;
    ambientDeclarationModule(): T.AmbientDeclarationModule;
    $with: {
        ambientDeclarationModule: (value: T.AmbientDeclarationModule) => /*elided*/ any & {
            $render(): string;
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
export declare function arguments_(...children: (T.Expression | T.SpreadElement)[]): {
    $type: TSKindId.Arguments;
    $source: 2;
    $named: true;
    _expression: (T.SpreadElement | T.Expression)[];
    expressions(): (T.SpreadElement | T.Expression)[];
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
export declare function array(...children: (T.Expression | T.SpreadElement)[]): {
    $type: TSKindId.Array;
    $source: 2;
    $named: true;
    _expression: (T.SpreadElement | T.Expression)[];
    expressions(): (T.SpreadElement | T.Expression)[];
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
export declare function arrayPattern(...children: (T.Pattern | T.AssignmentPattern)[]): {
    $type: TSKindId.ArrayPattern;
    $source: 2;
    $named: true;
    _pattern: (T.AssignmentPattern | T.Pattern)[];
    patterns(): (T.AssignmentPattern | T.Pattern)[];
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
export declare function arrayType(primaryType: T.ArrayType.Config['primaryType']): {
    $type: TSKindId.ArrayType;
    $source: 2;
    $named: true;
    _primary_type: T.PrimaryType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (value: T.ArrayType.Config['primaryType']) => /*elided*/ any & {
            $render(): string;
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
export declare function arrowFunctionParameter(parameter: T.ArrowFunctionParameter.Config['parameter']): {
    $type: TSKindId._ArrowFunctionParameter;
    $source: 2;
    $named: true;
    _parameter: T.ReservedIdentifier;
    parameter(): T.ReservedIdentifier;
    $with: {
        parameter: (value: T.ArrowFunctionParameter.Config['parameter']) => /*elided*/ any & {
            $render(): string;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function arrowFunction(config: ConfigOf<T.ArrowFunctionUFormParameter>): ReturnType<typeof arrowFunctionUFormParameter>;
export declare function arrowFunction(config: ConfigOf<T.ArrowFunctionUFormUCallSignature>): ReturnType<typeof arrowFunctionUFormUCallSignature>;
export declare function arrowFunctionUFormParameter(config: Omit<ConfigOf<T.ArrowFunctionUFormParameter>, '$variant'>): {
    $type: TSKindId.ArrowFunction;
    $source: 2;
    $named: true;
    $variant: 'parameter';
    _async_marker: true | undefined;
    _arrow_function_parameter: T._ArrowFunctionParameter;
    _body: T.StatementBlock | T.Expression;
    asyncMarker(): true | undefined;
    arrowFunctionParameter(): T._ArrowFunctionParameter;
    body(): T.StatementBlock | T.Expression;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof arrowFunctionUFormParameter>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        arrowFunctionParameter: (value: T._ArrowFunctionParameter) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function arrowFunctionUFormUCallSignature(config: Omit<ConfigOf<T.ArrowFunctionUFormUCallSignature>, '$variant'>): {
    $type: TSKindId.ArrowFunction;
    $source: 2;
    $named: true;
    $variant: '_call_signature';
    _async_marker: true | undefined;
    _arrow_function__call_signature: any;
    _body: T.StatementBlock | T.Expression;
    asyncMarker(): true | undefined;
    arrowFunction_CallSignature(): any;
    body(): T.StatementBlock | T.Expression;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof arrowFunctionUFormUCallSignature>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        arrowFunction_CallSignature: (value: T._ArrowFunctionUCallSignature) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function asExpression(config: T.AsExpression.Config): {
    $type: TSKindId.AsExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _type_annotation: T.Const | T.Type;
    expression(): T.Expression;
    typeAnnotation(): T.Const | T.Type;
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
        typeAnnotation: (value: T.Const | T.Type) => /*elided*/ any & {
            $render(): string;
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
export declare function asserts(child: (T.TypePredicate | T.Identifier | T.This)): {
    $type: TSKindId.Asserts;
    $source: 2;
    $named: true;
    _type_predicate: T.Identifier | T.This | T.TypePredicate;
    typePredicate(): T.Identifier | T.This | T.TypePredicate;
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
export declare function assertsAnnotation(asserts: T.AssertsAnnotation.Config['asserts']): {
    $type: TSKindId.AssertsAnnotation;
    $source: 2;
    $named: true;
    _asserts: ":" | T.Asserts;
    asserts(): ":" | T.Asserts;
    $with: {
        asserts: (value: T.AssertsAnnotation.Config['asserts']) => /*elided*/ any & {
            $render(): string;
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
export declare function assignmentExpression(config: T.AssignmentExpression.Config): {
    $type: TSKindId.AssignmentExpression;
    $source: 2;
    $named: true;
    _using_marker: true | undefined;
    _left: T.LhsExpression | T.ParenthesizedExpression;
    _right: T.Expression;
    usingMarker(): true | undefined;
    left(): T.LhsExpression | T.ParenthesizedExpression;
    right(): T.Expression;
    $with: {
        usingMarker: (value?: NonNullable<Parameters<typeof assignmentExpression>[0]>['usingMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function augmentedAssignmentExpression(config: T.AugmentedAssignmentExpression.Config): {
    $type: TSKindId.AugmentedAssignmentExpression;
    $source: 2;
    $named: true;
    _left: T.MemberExpression | T.NonNullExpression | T.ReservedIdentifier | T.SubscriptExpression | T.ParenthesizedExpression;
    _operator: unknown;
    _right: T.Expression;
    left(): T.MemberExpression | T.NonNullExpression | T.ReservedIdentifier | T.SubscriptExpression | T.ParenthesizedExpression;
    operator(): unknown;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof augmentedAssignmentExpression>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
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
export declare function binaryExpression(config: T.BinaryExpression.Config): {
    $type: TSKindId.BinaryExpression;
    $source: 2;
    $named: true;
    _left: T.PrivatePropertyIdentifier | T.Expression;
    _operator: unknown;
    _right: T.Expression;
    left(): T.PrivatePropertyIdentifier | T.Expression;
    operator(): unknown;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof binaryExpression>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
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
export declare function breakStatement(config: T.BreakStatement.Config): {
    $type: TSKindId.BreakStatement;
    $source: 2;
    $named: true;
    _label: T.Identifier | undefined;
    _semicolon: T.AutomaticSemicolon;
    label(): T.Identifier | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function callExpression(config: ConfigOf<T.CallExpressionUFormCall>): ReturnType<typeof callExpressionUFormCall>;
export declare function callExpression(config: ConfigOf<T.CallExpressionUFormTemplateCall>): ReturnType<typeof callExpressionUFormTemplateCall>;
export declare function callExpression(config: ConfigOf<T.CallExpressionUFormMember>): ReturnType<typeof callExpressionUFormMember>;
export declare function callExpressionUFormCall(config: Omit<ConfigOf<T.CallExpressionUFormCall>, '$variant'>): {
    $type: TSKindId.CallExpression;
    $source: 2;
    $named: true;
    $variant: 'call';
    _call_expression_call: T.CallExpressionCall;
    callExpressionCall(): T.CallExpressionCall;
    $with: {
        callExpressionCall: (value: T.CallExpressionCall) => /*elided*/ any & {
            $render(): string;
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
export declare function callExpressionUFormTemplateCall(config: Omit<ConfigOf<T.CallExpressionUFormTemplateCall>, '$variant'>): {
    $type: TSKindId.CallExpression;
    $source: 2;
    $named: true;
    $variant: 'template_call';
    _call_expression_template_call: T.CallExpressionTemplateCall;
    callExpressionTemplateCall(): T.CallExpressionTemplateCall;
    $with: {
        callExpressionTemplateCall: (value: T.CallExpressionTemplateCall) => /*elided*/ any & {
            $render(): string;
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
export declare function callExpressionUFormMember(config: Omit<ConfigOf<T.CallExpressionUFormMember>, '$variant'>): {
    $type: TSKindId.CallExpression;
    $source: 2;
    $named: true;
    $variant: 'member';
    _call_expression_member: T.CallExpressionMember;
    callExpressionMember(): T.CallExpressionMember;
    $with: {
        callExpressionMember: (value: T.CallExpressionMember) => /*elided*/ any & {
            $render(): string;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function catchClause(config: T.CatchClause.Config): {
    $type: TSKindId.CatchClause;
    $source: 2;
    $named: true;
    _parameter: T.Identifier | T.DestructuringPattern | undefined;
    _type: T.TypeAnnotation | undefined;
    _body: T.StatementBlock;
    parameter(): T.Identifier | T.DestructuringPattern | undefined;
    type(): T.TypeAnnotation | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function class_(config: T.Class.Config): {
    $type: TSKindId.Class;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _name: T.TypeIdentifier | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritage | undefined;
    _body: T.ClassBody;
    decorators(): readonly T.Decorator[] | undefined;
    name(): T.TypeIdentifier | undefined;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function classBody(...children: (T.ClassBodyMethod | T.ClassBodyMethodSig | T.ClassStaticBlock | T.ClassBodyMember)[]): {
    $type: TSKindId.ClassBody;
    $source: 2;
    $named: true;
    _class_body_method: (T.ClassBodyMember | T.ClassBodyMethod | T.ClassBodyMethodSig | T.ClassStaticBlock)[];
    classBodyMethods(): (T.ClassBodyMember | T.ClassBodyMethod | T.ClassBodyMethodSig | T.ClassStaticBlock)[];
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
export declare function classDeclaration(config: T.ClassDeclaration.Config): {
    $type: TSKindId.ClassDeclaration;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritage | undefined;
    _body: T.ClassBody;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    decorators(): readonly T.Decorator[] | undefined;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function classHeritageExtendsClause(config: T.ClassHeritageExtendsClause.Config): {
    $type: TSKindId._ClassHeritageExtendsClause;
    $source: 2;
    $named: true;
    _extends_clause: T.ExtendsClause;
    _implements_clause: T.ImplementsClause | undefined;
    extendsClause(): T.ExtendsClause;
    implementsClause(): T.ImplementsClause | undefined;
    $with: {
        extendsClause: (value: T.ExtendsClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        implementsClause: (value?: T.ImplementsClause) => /*elided*/ any & {
            $render(): string;
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
export declare function classHeritageImplementsClause(child: T.ImplementsClause): {
    $type: TSKindId._ClassHeritageImplementsClause;
    $source: 2;
    $named: true;
    _implements_clause: T.ImplementsClause;
    implementsClause(): T.ImplementsClause;
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
export declare function classHeritage(config: ConfigOf<T.ClassHeritageUFormExtendsClause>): ReturnType<typeof classHeritageUFormExtendsClause>;
export declare function classHeritage(config: ConfigOf<T.ClassHeritageUFormImplementsClause>): ReturnType<typeof classHeritageUFormImplementsClause>;
export declare function classHeritageUFormExtendsClause(config: Omit<ConfigOf<T.ClassHeritageUFormExtendsClause>, '$variant'>): {
    $type: TSKindId.ClassHeritage;
    $source: 2;
    $named: true;
    $variant: 'extends_clause';
    _class_heritage_extends_clause: T._ClassHeritageExtendsClause;
    classHeritageExtendsClause(): T._ClassHeritageExtendsClause;
    $with: {
        classHeritageExtendsClause: (value: T._ClassHeritageExtendsClause) => /*elided*/ any & {
            $render(): string;
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
export declare function classHeritageUFormImplementsClause(config: Omit<ConfigOf<T.ClassHeritageUFormImplementsClause>, '$variant'>): {
    $type: TSKindId.ClassHeritage;
    $source: 2;
    $named: true;
    $variant: 'implements_clause';
    _class_heritage_implements_clause: T._ClassHeritageImplementsClause;
    classHeritageImplementsClause(): T._ClassHeritageImplementsClause;
    $with: {
        classHeritageImplementsClause: (value: T._ClassHeritageImplementsClause) => /*elided*/ any & {
            $render(): string;
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
export declare function classStaticBlock(config: T.ClassStaticBlock.Config): {
    $type: TSKindId.ClassStaticBlock;
    $source: 2;
    $named: true;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    _body: T.StatementBlock;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    body(): T.StatementBlock;
    $with: {
        automaticSemicolon: (value?: T.AutomaticSemicolon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function computedPropertyName(expression: T.ComputedPropertyName.Config['expression']): {
    $type: TSKindId.ComputedPropertyName;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.ComputedPropertyName.Config['expression']) => /*elided*/ any & {
            $render(): string;
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
        consequence: (value: T.Type) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function constraint(type: T.Constraint.Config['type']): {
    $type: TSKindId.Constraint;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.Constraint.Config['type']) => /*elided*/ any & {
            $render(): string;
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
export declare function constructSignature(config: T.ConstructSignature.Config): {
    $type: TSKindId.ConstructSignature;
    $source: 2;
    $named: true;
    _abstract_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _type: T.TypeAnnotation | undefined;
    abstractMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    type(): T.TypeAnnotation | undefined;
    $with: {
        abstractMarker: (value?: NonNullable<Parameters<typeof constructSignature>[0]>['abstractMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
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
export declare function constructorType(config: T.ConstructorType.Config): {
    $type: TSKindId.ConstructorType;
    $source: 2;
    $named: true;
    _abstract_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _type: T.Type;
    abstractMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    type(): T.Type;
    $with: {
        abstractMarker: (value?: NonNullable<Parameters<typeof constructorType>[0]>['abstractMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function continueStatement(config: T.ContinueStatement.Config): {
    $type: TSKindId.ContinueStatement;
    $source: 2;
    $named: true;
    _label: T.Identifier | undefined;
    _semicolon: T.AutomaticSemicolon;
    label(): T.Identifier | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function debuggerStatement(semicolon: T.DebuggerStatement.Config['semicolon']): {
    $type: TSKindId.DebuggerStatement;
    $source: 2;
    $named: true;
    _semicolon: T.AutomaticSemicolon;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        semicolon: (value: T.DebuggerStatement.Config['semicolon']) => /*elided*/ any & {
            $render(): string;
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
export declare function decorator(child: (T.Identifier | T.DecoratorMemberExpression | T.DecoratorCallExpression | T.DecoratorParenthesizedExpression)): {
    $type: TSKindId.Decorator;
    $source: 2;
    $named: true;
    _identifier: T.DecoratorCallExpression | T.DecoratorMemberExpression | T.DecoratorParenthesizedExpression | T.Identifier;
    identifier(): T.DecoratorCallExpression | T.DecoratorMemberExpression | T.DecoratorParenthesizedExpression | T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function decoratorMemberExpression(config: T.DecoratorMemberExpression.Config): {
    $type: TSKindId.DecoratorMemberExpression;
    $source: 2;
    $named: true;
    _object: T.DecoratorMemberExpression | T.Identifier;
    _property: T.Identifier;
    object(): T.DecoratorMemberExpression | T.Identifier;
    property(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function decoratorParenthesizedExpression(child: (T.Identifier | T.DecoratorMemberExpression | T.DecoratorCallExpression)): {
    $type: TSKindId.DecoratorParenthesizedExpression;
    $source: 2;
    $named: true;
    _identifier: T.DecoratorCallExpression | T.DecoratorMemberExpression | T.Identifier;
    identifier(): T.DecoratorCallExpression | T.DecoratorMemberExpression | T.Identifier;
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
export declare function defaultType(type: T.DefaultType.Config['type']): {
    $type: TSKindId.DefaultType;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.DefaultType.Config['type']) => /*elided*/ any & {
            $render(): string;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function elseClause(statement: T.ElseClause.Config['statement']): {
    $type: TSKindId.ElseClause;
    $source: 2;
    $named: true;
    _statement: T.Statement;
    statement(): T.Statement;
    $with: {
        statement: (value: T.ElseClause.Config['statement']) => /*elided*/ any & {
            $render(): string;
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
export declare function enumBody(config?: Partial<T.EnumBody.Config>): {
    $type: TSKindId.EnumBody;
    $source: 2;
    $named: true;
    _name: readonly T.PropertyName[] | undefined;
    _enum_assignment: readonly T.EnumAssignment[] | undefined;
    names(): readonly T.PropertyName[] | undefined;
    enumAssignments(): readonly T.EnumAssignment[] | undefined;
    $with: {
        names: (...values: T.PropertyName[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        enumAssignments: (...values: T.EnumAssignment[]) => /*elided*/ any & {
            $render(): string;
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
export declare function enumDeclaration(config: T.EnumDeclaration.Config): {
    $type: TSKindId.EnumDeclaration;
    $source: 2;
    $named: true;
    _const_marker: true | undefined;
    _name: T.Identifier;
    _body: T.EnumBody;
    constMarker(): true | undefined;
    name(): T.Identifier;
    body(): T.EnumBody;
    $with: {
        constMarker: (value?: NonNullable<Parameters<typeof enumDeclaration>[0]>['constMarker']) => /*elided*/ any & {
            $render(): string;
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
        body: (value: T.EnumBody) => /*elided*/ any & {
            $render(): string;
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
export declare function exportClause(...children: T.ExportSpecifier[]): {
    $type: TSKindId.ExportClause;
    $source: 2;
    $named: true;
    _export_specifier: T.ExportSpecifier[];
    exportSpecifiers(): T.ExportSpecifier[];
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
export declare function exportSpecifier(config: T.ExportSpecifier.Config): {
    $type: TSKindId.ExportSpecifier;
    $source: 2;
    $named: true;
    _export_kind: unknown;
    _name: T.ModuleExportName;
    _alias: T.ModuleExportName | undefined;
    exportKind(): unknown;
    name(): T.ModuleExportName;
    alias(): T.ModuleExportName | undefined;
    $with: {
        exportKind: (value?: NonNullable<Parameters<typeof exportSpecifier>[0]>['exportKind']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function exportStatementTypeExport(config: T.ExportStatementTypeExport.Config): {
    $type: TSKindId._ExportStatementTypeExport;
    $source: 2;
    $named: true;
    _export_clause: T.ExportClause;
    _source: T.String | undefined;
    _semicolon: T.AutomaticSemicolon;
    exportClause(): T.ExportClause;
    source(): T.String | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        exportClause: (value: T.ExportClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        source: (value?: T.String) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function exportStatementEqualsExport(config: T.ExportStatementEqualsExport.Config): {
    $type: TSKindId._ExportStatementEqualsExport;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    _semicolon: T.AutomaticSemicolon;
    expression(): T.Expression;
    semicolon(): T.AutomaticSemicolon;
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
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
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
export declare function exportStatementNamespaceExport(config: T.ExportStatementNamespaceExport.Config): {
    $type: TSKindId._ExportStatementNamespaceExport;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    _semicolon: T.AutomaticSemicolon;
    identifier(): T.Identifier;
    semicolon(): T.AutomaticSemicolon;
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
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
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
export declare function exportStatement(config: ConfigOf<T.ExportStatementUFormDefault>): ReturnType<typeof exportStatementUFormDefault>;
export declare function exportStatement(config: ConfigOf<T.ExportStatementUFormTypeExport>): ReturnType<typeof exportStatementUFormTypeExport>;
export declare function exportStatement(config: ConfigOf<T.ExportStatementUFormEqualsExport>): ReturnType<typeof exportStatementUFormEqualsExport>;
export declare function exportStatement(config: ConfigOf<T.ExportStatementUFormNamespaceExport>): ReturnType<typeof exportStatementUFormNamespaceExport>;
export declare function exportStatementUFormDefault(config: Omit<ConfigOf<T.ExportStatementUFormDefault>, '$variant'>): {
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'default';
    _export_statement_default: T.ExportStatementDefault;
    exportStatementDefault(): T.ExportStatementDefault;
    $with: {
        exportStatementDefault: (value: T.ExportStatementDefault) => /*elided*/ any & {
            $render(): string;
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
export declare function exportStatementUFormTypeExport(config: Omit<ConfigOf<T.ExportStatementUFormTypeExport>, '$variant'>): {
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'type_export';
    _export_statement_type_export: T._ExportStatementTypeExport;
    exportStatementTypeExport(): T._ExportStatementTypeExport;
    $with: {
        exportStatementTypeExport: (value: T._ExportStatementTypeExport) => /*elided*/ any & {
            $render(): string;
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
export declare function exportStatementUFormEqualsExport(config: Omit<ConfigOf<T.ExportStatementUFormEqualsExport>, '$variant'>): {
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'equals_export';
    _export_statement_equals_export: T._ExportStatementEqualsExport;
    exportStatementEqualsExport(): T._ExportStatementEqualsExport;
    $with: {
        exportStatementEqualsExport: (value: T._ExportStatementEqualsExport) => /*elided*/ any & {
            $render(): string;
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
export declare function exportStatementUFormNamespaceExport(config: Omit<ConfigOf<T.ExportStatementUFormNamespaceExport>, '$variant'>): {
    $type: TSKindId.ExportStatement;
    $source: 2;
    $named: true;
    $variant: 'namespace_export';
    _export_statement_namespace_export: T._ExportStatementNamespaceExport;
    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport;
    $with: {
        exportStatementNamespaceExport: (value: T._ExportStatementNamespaceExport) => /*elided*/ any & {
            $render(): string;
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
export declare function expressionStatement(config: T.ExpressionStatement.Config): {
    $type: TSKindId.ExpressionStatement;
    $source: 2;
    $named: true;
    _expressions: T.SequenceExpression;
    _semicolon: T.AutomaticSemicolon;
    expressions(): T.SequenceExpression;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        expressions: (value: T.Expressions) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function extendsClause(config: T.ExtendsClause.Config): {
    $type: TSKindId.ExtendsClause;
    $source: 2;
    $named: true;
    _value: readonly [T.Expression, ...T.Expression[]];
    _type_arguments: T.TypeArguments | undefined;
    values(): readonly [T.Expression, ...T.Expression[]];
    typeArguments(): T.TypeArguments | undefined;
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
        typeArguments: (value?: T.TypeArguments) => /*elided*/ any & {
            $render(): string;
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
export declare function extendsTypeClause(config: T.ExtendsTypeClause.Config): {
    $type: TSKindId.ExtendsTypeClause;
    $source: 2;
    $named: true;
    _type: readonly [T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier, ...(T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[]];
    types(): readonly [T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier, ...(T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[]];
    $with: {
        types: (values_0: T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier, ...values: (T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[]) => /*elided*/ any & {
            $render(): string;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function finallyClause(body: T.FinallyClause.Config['body']): {
    $type: TSKindId.FinallyClause;
    $source: 2;
    $named: true;
    _body: T.StatementBlock;
    body(): T.StatementBlock;
    $with: {
        body: (value: T.FinallyClause.Config['body']) => /*elided*/ any & {
            $render(): string;
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
export declare function flowMaybeType(primaryType: T.FlowMaybeType.Config['primaryType']): {
    $type: TSKindId.FlowMaybeType;
    $source: 2;
    $named: true;
    _primary_type: T.PrimaryType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (value: T.FlowMaybeType.Config['primaryType']) => /*elided*/ any & {
            $render(): string;
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
export declare function forInStatement(config: T.ForInStatement.Config): {
    $type: TSKindId.ForInStatement;
    $source: 2;
    $named: true;
    _await_marker: true | undefined;
    _for_header_lhs: T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind;
    _operator: unknown;
    _right: T.SequenceExpression;
    _body: T.Statement;
    awaitMarker(): true | undefined;
    forHeaderLhs(): T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind;
    operator(): unknown;
    right(): T.SequenceExpression;
    body(): T.Statement;
    $with: {
        awaitMarker: (value?: NonNullable<Parameters<typeof forInStatement>[0]>['awaitMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        forHeaderLhs: (value: T.ForHeaderLhs | T.ForHeaderVarKind | T.ForHeaderLetConstKind) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        operator: (value: NonNullable<Parameters<typeof forInStatement>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
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
        body: (value: T.Statement) => /*elided*/ any & {
            $render(): string;
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
    _initializer: ";" | T.LexicalDeclaration | T.SequenceExpression | T.VariableDeclaration;
    _condition: T.EmptyStatement | T.SequenceExpression;
    _increment: T.SequenceExpression | undefined;
    _body: T.Statement;
    initializer(): ";" | T.LexicalDeclaration | T.SequenceExpression | T.VariableDeclaration;
    condition(): T.EmptyStatement | T.SequenceExpression;
    increment(): T.SequenceExpression | undefined;
    body(): T.Statement;
    $with: {
        initializer: (value: T.LexicalDeclaration | T.VariableDeclaration | T.Expressions | ";") => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function formalParameters(...children: T.FormalParameter[]): {
    $type: TSKindId.FormalParameters;
    $source: 2;
    $named: true;
    _formal_parameter: T.FormalParameter[];
    formalParameters(): T.FormalParameter[];
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
export declare function functionDeclaration(config: T.FunctionDeclaration.Config): {
    $type: TSKindId.FunctionDeclaration;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _name: T.Identifier;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    asyncMarker(): true | undefined;
    name(): T.Identifier;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof functionDeclaration>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
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
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function functionExpression(config: T.FunctionExpression.Config): {
    $type: TSKindId.FunctionExpression;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _name: T.Identifier | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    asyncMarker(): true | undefined;
    name(): T.Identifier | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof functionExpression>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function functionSignature(config: T.FunctionSignature.Config): {
    $type: TSKindId.FunctionSignature;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _name: T.Identifier;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _semicolon: T.AutomaticSemicolon | T.FunctionSignatureAutomaticSemicolon;
    asyncMarker(): true | undefined;
    name(): T.Identifier;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    semicolon(): T.AutomaticSemicolon | T.FunctionSignatureAutomaticSemicolon;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof functionSignature>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
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
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function generatorFunction(config: T.GeneratorFunction.Config): {
    $type: TSKindId.GeneratorFunction;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _name: T.Identifier | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    asyncMarker(): true | undefined;
    name(): T.Identifier | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof generatorFunction>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function generatorFunctionDeclaration(config: T.GeneratorFunctionDeclaration.Config): {
    $type: TSKindId.GeneratorFunctionDeclaration;
    $source: 2;
    $named: true;
    _async_marker: true | undefined;
    _name: T.Identifier;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    asyncMarker(): true | undefined;
    name(): T.Identifier;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        asyncMarker: (value?: NonNullable<Parameters<typeof generatorFunctionDeclaration>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
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
        typeParameters: (value?: T.TypeParameters) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function implementsClause(...children: T.Type[]): {
    $type: TSKindId.ImplementsClause;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function importAlias(config: T.ImportAlias.Config): {
    $type: TSKindId.ImportAlias;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    _value: T.Identifier | T.NestedIdentifier;
    _semicolon: T.AutomaticSemicolon;
    name(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function importAttribute(object: T.ImportAttribute.Config['object']): {
    $type: TSKindId.ImportAttribute;
    $source: 2;
    $named: true;
    _object: T.ImportAttributeObject | T.Object;
    object(): T.ImportAttributeObject | T.Object;
    $with: {
        object: (value: T.ImportAttribute.Config['object']) => /*elided*/ any & {
            $render(): string;
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
export declare function importClauseNamespaceImport(child: T.NamespaceImport): {
    $type: TSKindId._ImportClauseNamespaceImport;
    $source: 2;
    $named: true;
    _namespace_import: T.NamespaceImport;
    namespaceImport(): T.NamespaceImport;
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
export declare function importClauseNamedImports(child: T.NamedImports): {
    $type: TSKindId._ImportClauseNamedImports;
    $source: 2;
    $named: true;
    _named_imports: T.NamedImports;
    namedImports(): T.NamedImports;
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
export declare function importClauseDefaultImport(config: T.ImportClauseDefaultImport.Config): {
    $type: TSKindId._ImportClauseDefaultImport;
    $source: 2;
    $named: true;
    _import_identifier: T.Identifier;
    _namespace_import: T.NamedImports | T.NamespaceImport | undefined;
    importIdentifier(): T.Identifier;
    namespaceImport(): T.NamedImports | T.NamespaceImport | undefined;
    $with: {
        importIdentifier: (value: T.ImportIdentifier) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        namespaceImport: (value?: T.NamespaceImport | T.NamedImports) => /*elided*/ any & {
            $render(): string;
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
export declare function importClause(config: ConfigOf<T.ImportClauseUFormNamespaceImport>): ReturnType<typeof importClauseUFormNamespaceImport>;
export declare function importClause(config: ConfigOf<T.ImportClauseUFormNamedImports>): ReturnType<typeof importClauseUFormNamedImports>;
export declare function importClause(config: ConfigOf<T.ImportClauseUFormDefaultImport>): ReturnType<typeof importClauseUFormDefaultImport>;
export declare function importClauseUFormNamespaceImport(config: Omit<ConfigOf<T.ImportClauseUFormNamespaceImport>, '$variant'>): {
    $type: TSKindId.ImportClause;
    $source: 2;
    $named: true;
    $variant: 'namespace_import';
    _import_clause_namespace_import: T._ImportClauseNamespaceImport;
    importClauseNamespaceImport(): T._ImportClauseNamespaceImport;
    $with: {
        importClauseNamespaceImport: (value: T._ImportClauseNamespaceImport) => /*elided*/ any & {
            $render(): string;
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
export declare function importClauseUFormNamedImports(config: Omit<ConfigOf<T.ImportClauseUFormNamedImports>, '$variant'>): {
    $type: TSKindId.ImportClause;
    $source: 2;
    $named: true;
    $variant: 'named_imports';
    _import_clause_named_imports: T._ImportClauseNamedImports;
    importClauseNamedImports(): T._ImportClauseNamedImports;
    $with: {
        importClauseNamedImports: (value: T._ImportClauseNamedImports) => /*elided*/ any & {
            $render(): string;
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
export declare function importClauseUFormDefaultImport(config: Omit<ConfigOf<T.ImportClauseUFormDefaultImport>, '$variant'>): {
    $type: TSKindId.ImportClause;
    $source: 2;
    $named: true;
    $variant: 'default_import';
    _import_clause_default_import: T._ImportClauseDefaultImport;
    importClauseDefaultImport(): T._ImportClauseDefaultImport;
    $with: {
        importClauseDefaultImport: (value: T._ImportClauseDefaultImport) => /*elided*/ any & {
            $render(): string;
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
export declare function importRequireClause(config: T.ImportRequireClause.Config): {
    $type: TSKindId.ImportRequireClause;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    _source: T.String;
    identifier(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function importSpecifierName(name: T.ImportSpecifierName.Config['name']): {
    $type: TSKindId._ImportSpecifierName;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    name(): T.Identifier;
    $with: {
        name: (value: T.ImportSpecifierName.Config['name']) => /*elided*/ any & {
            $render(): string;
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
export declare function importSpecifier(config: ConfigOf<T.ImportSpecifierUFormName>): ReturnType<typeof importSpecifierUFormName>;
export declare function importSpecifier(config: ConfigOf<T.ImportSpecifierUFormAs>): ReturnType<typeof importSpecifierUFormAs>;
export declare function importSpecifierUFormName(config: Omit<ConfigOf<T.ImportSpecifierUFormName>, '$variant'>): {
    $type: TSKindId.ImportSpecifier;
    $source: 2;
    $named: true;
    $variant: 'name';
    _import_kind: unknown;
    _import_specifier_name: T._ImportSpecifierName;
    importKind(): unknown;
    importSpecifierName(): T._ImportSpecifierName;
    $with: {
        importKind: (value?: NonNullable<Parameters<typeof importSpecifierUFormName>[0]>['importKind']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        importSpecifierName: (value: T._ImportSpecifierName) => /*elided*/ any & {
            $render(): string;
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
export declare function importSpecifierUFormAs(config: Omit<ConfigOf<T.ImportSpecifierUFormAs>, '$variant'>): {
    $type: TSKindId.ImportSpecifier;
    $source: 2;
    $named: true;
    $variant: 'as';
    _import_kind: unknown;
    _import_specifier_as: T.ImportSpecifierAs;
    importKind(): unknown;
    importSpecifierAs(): T.ImportSpecifierAs;
    $with: {
        importKind: (value?: NonNullable<Parameters<typeof importSpecifierUFormAs>[0]>['importKind']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        importSpecifierAs: (value: T.ImportSpecifierAs) => /*elided*/ any & {
            $render(): string;
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
export declare function importStatement(config: T.ImportStatement.Config): {
    $type: TSKindId.ImportStatement;
    $source: 2;
    $named: true;
    _import_clause: unknown;
    _from_clause: readonly ["from" | T.ImportRequireClause | T.String | T.ImportClause, ...("from" | T.ImportRequireClause | T.String | T.ImportClause)[]];
    _import_attribute: T.ImportAttribute | undefined;
    _semicolon: T.AutomaticSemicolon;
    importClause(): unknown;
    fromClauses(): readonly ["from" | T.ImportRequireClause | T.String | T.ImportClause, ...("from" | T.ImportRequireClause | T.String | T.ImportClause)[]];
    importAttribute(): T.ImportAttribute | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        importClause: (value?: NonNullable<Parameters<typeof importStatement>[0]>['importClause']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        fromClauses: (values_0: "from" | T.ImportRequireClause | T.String | T.ImportClause, ...values: ("from" | T.ImportRequireClause | T.String | T.ImportClause)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function indexSignatureMappedTypeClause(child: T.MappedTypeClause): {
    $type: TSKindId._IndexSignatureMappedTypeClause;
    $source: 2;
    $named: true;
    _mapped_type_clause: T.MappedTypeClause;
    mappedTypeClause(): T.MappedTypeClause;
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
export declare function indexSignature(config: ConfigOf<T.IndexSignatureUFormColon>): ReturnType<typeof indexSignatureUFormColon>;
export declare function indexSignature(config: ConfigOf<T.IndexSignatureUFormMappedTypeClause>): ReturnType<typeof indexSignatureUFormMappedTypeClause>;
export declare function indexSignatureUFormColon(config: Omit<ConfigOf<T.IndexSignatureUFormColon>, '$variant'>): {
    $type: TSKindId.IndexSignature;
    $source: 2;
    $named: true;
    $variant: 'colon';
    _sign: unknown;
    _index_signature_colon: T.IndexSignatureColon;
    _type: T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    sign(): unknown;
    indexSignatureColon(): T.IndexSignatureColon;
    type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    $with: {
        sign: (value?: NonNullable<Parameters<typeof indexSignatureUFormColon>[0]>['sign']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        indexSignatureColon: (value: T.IndexSignatureColon) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function indexSignatureUFormMappedTypeClause(config: Omit<ConfigOf<T.IndexSignatureUFormMappedTypeClause>, '$variant'>): {
    $type: TSKindId.IndexSignature;
    $source: 2;
    $named: true;
    $variant: 'mapped_type_clause';
    _sign: unknown;
    _index_signature_mapped_type_clause: T._IndexSignatureMappedTypeClause;
    _type: T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    sign(): unknown;
    indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause;
    type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    $with: {
        sign: (value?: NonNullable<Parameters<typeof indexSignatureUFormMappedTypeClause>[0]>['sign']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        indexSignatureMappedTypeClause: (value: T._IndexSignatureMappedTypeClause) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function indexTypeQuery(primaryType: T.IndexTypeQuery.Config['primaryType']): {
    $type: TSKindId.IndexTypeQuery;
    $source: 2;
    $named: true;
    _primary_type: T.PrimaryType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (value: T.IndexTypeQuery.Config['primaryType']) => /*elided*/ any & {
            $render(): string;
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
export declare function inferType(config: T.InferType.Config): {
    $type: TSKindId.InferType;
    $source: 2;
    $named: true;
    _type_identifier: T.TypeIdentifier;
    _type: T.Type | undefined;
    typeIdentifier(): T.TypeIdentifier;
    type(): T.Type | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T.Type) => /*elided*/ any & {
            $render(): string;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function lexicalDeclaration(config: T.LexicalDeclaration.Config): {
    $type: TSKindId.LexicalDeclaration;
    $source: 2;
    $named: true;
    _kind: unknown;
    _declarators: readonly [T.VariableDeclarator, ...T.VariableDeclarator[]];
    _semicolon: T.AutomaticSemicolon;
    kind(): unknown;
    declarators(): readonly [T.VariableDeclarator, ...T.VariableDeclarator[]];
    semicolon(): T.AutomaticSemicolon;
    $with: {
        kind: (value: NonNullable<Parameters<typeof lexicalDeclaration>[0]>['kind']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function literalType(child: (T._Number | T.Number | T.String | T.True | T.False | T.Null | T.Undefined)): {
    $type: TSKindId.LiteralType;
    $source: 2;
    $named: true;
    _number: T.False | T.Null | T.Number | T.String | T.True | T.Undefined | T._Number;
    number(): T.False | T.Null | T.Number | T.String | T.True | T.Undefined | T._Number;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function mappedTypeClause(config: T.MappedTypeClause.Config): {
    $type: TSKindId.MappedTypeClause;
    $source: 2;
    $named: true;
    _name: T.TypeIdentifier;
    _type: T.Type;
    _alias: T.Type | undefined;
    name(): T.TypeIdentifier;
    type(): T.Type;
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
        alias: (value?: T.Type) => /*elided*/ any & {
            $render(): string;
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
export declare function memberExpression(config: T.MemberExpression.Config): {
    $type: TSKindId.MemberExpression;
    $source: 2;
    $named: true;
    _object: T.Import | T.Expression | T.PrimaryExpression;
    _optional_chain: true | undefined;
    _property: T.Identifier | T.PrivatePropertyIdentifier;
    object(): T.Import | T.Expression | T.PrimaryExpression;
    optionalChain(): true | undefined;
    property(): T.Identifier | T.PrivatePropertyIdentifier;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        optionalChain: (value?: NonNullable<Parameters<typeof memberExpression>[0]>['optionalChain']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function methodDefinition(config: T.MethodDefinition.Config): {
    $type: TSKindId.MethodDefinition;
    $source: 2;
    $named: true;
    _accessibility_modifier: unknown;
    _static_marker: true | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _async_marker: true | undefined;
    _accessor_kind: unknown;
    _name: T.PropertyName;
    _optional_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    accessibilityModifier(): unknown;
    staticMarker(): true | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    asyncMarker(): true | undefined;
    accessorKind(): unknown;
    name(): T.PropertyName;
    optionalMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        accessibilityModifier: (value?: NonNullable<Parameters<typeof methodDefinition>[0]>['accessibilityModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        staticMarker: (value?: NonNullable<Parameters<typeof methodDefinition>[0]>['staticMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        overrideModifier: (value?: NonNullable<Parameters<typeof methodDefinition>[0]>['overrideModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        readonlyMarker: (value?: NonNullable<Parameters<typeof methodDefinition>[0]>['readonlyMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        asyncMarker: (value?: NonNullable<Parameters<typeof methodDefinition>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        accessorKind: (value?: NonNullable<Parameters<typeof methodDefinition>[0]>['accessorKind']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        optionalMarker: (value?: NonNullable<Parameters<typeof methodDefinition>[0]>['optionalMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function methodSignature(config: T.MethodSignature.Config): {
    $type: TSKindId.MethodSignature;
    $source: 2;
    $named: true;
    _accessibility_modifier: unknown;
    _static_marker: true | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _async_marker: true | undefined;
    _accessor_kind: unknown;
    _name: T.PropertyName;
    _optional_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    accessibilityModifier(): unknown;
    staticMarker(): true | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    asyncMarker(): true | undefined;
    accessorKind(): unknown;
    name(): T.PropertyName;
    optionalMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        accessibilityModifier: (value?: NonNullable<Parameters<typeof methodSignature>[0]>['accessibilityModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        staticMarker: (value?: NonNullable<Parameters<typeof methodSignature>[0]>['staticMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        overrideModifier: (value?: NonNullable<Parameters<typeof methodSignature>[0]>['overrideModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        readonlyMarker: (value?: NonNullable<Parameters<typeof methodSignature>[0]>['readonlyMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        asyncMarker: (value?: NonNullable<Parameters<typeof methodSignature>[0]>['asyncMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        accessorKind: (value?: NonNullable<Parameters<typeof methodSignature>[0]>['accessorKind']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        optionalMarker: (value?: NonNullable<Parameters<typeof methodSignature>[0]>['optionalMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function namedImports(...children: T.ImportSpecifier[]): {
    $type: TSKindId.NamedImports;
    $source: 2;
    $named: true;
    _import_specifier: T.ImportSpecifier[];
    importSpecifiers(): T.ImportSpecifier[];
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
export declare function namespaceExport(child: T.ModuleExportName): {
    $type: TSKindId.NamespaceExport;
    $source: 2;
    $named: true;
    _module_export_name: T.ModuleExportName;
    moduleExportName(): T.ModuleExportName;
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
export declare function namespaceImport(identifier: T.NamespaceImport.Config['identifier']): {
    $type: TSKindId.NamespaceImport;
    $source: 2;
    $named: true;
    _identifier: T.Identifier;
    identifier(): T.Identifier;
    $with: {
        identifier: (value: T.NamespaceImport.Config['identifier']) => /*elided*/ any & {
            $render(): string;
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
export declare function nestedIdentifier(config: T.NestedIdentifier.Config): {
    $type: TSKindId.NestedIdentifier;
    $source: 2;
    $named: true;
    _object: T.Identifier | T.NestedIdentifier;
    _property: T.Identifier;
    object(): T.Identifier | T.NestedIdentifier;
    property(): T.Identifier;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function newExpression(config: T.NewExpression.Config): {
    $type: TSKindId.NewExpression;
    $source: 2;
    $named: true;
    _constructor: T.PrimaryExpression;
    _type_arguments: T.TypeArguments | undefined;
    _arguments: T.Arguments | undefined;
    constructor(): T.PrimaryExpression;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function nonNullExpression(expression: T.NonNullExpression.Config['expression']): {
    $type: TSKindId.NonNullExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.NonNullExpression.Config['expression']) => /*elided*/ any & {
            $render(): string;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function object(...children: (T.Pair | T.SpreadElement | T.MethodDefinition | T.ShorthandPropertyIdentifier)[]): {
    $type: TSKindId.Object;
    $source: 2;
    $named: true;
    _pair: (T.MethodDefinition | T.Pair | T.SpreadElement | T.ShorthandPropertyIdentifier)[];
    pair(): (T.MethodDefinition | T.Pair | T.SpreadElement | T.ShorthandPropertyIdentifier)[];
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
export declare function objectPattern(...children: (T.PairPattern | T.RestPattern | T.ObjectAssignmentPattern | T.ShorthandPropertyIdentifierPattern)[]): {
    $type: TSKindId.ObjectPattern;
    $source: 2;
    $named: true;
    _pair_pattern: (T.ObjectAssignmentPattern | T.PairPattern | T.RestPattern | T.ShorthandPropertyIdentifierPattern)[];
    pairPattern(): (T.ObjectAssignmentPattern | T.PairPattern | T.RestPattern | T.ShorthandPropertyIdentifierPattern)[];
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
export declare function objectType(config: ConfigOf<T.ObjectType>): {
    $type: TSKindId.ObjectType;
    $source: 2;
    $named: true;
    _opening: unknown;
    _members: readonly ["," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]] | undefined;
    _closing: unknown;
    opening(): unknown;
    members(): readonly ["," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]] | undefined;
    closing(): unknown;
    $with: {
        opening: (value: NonNullable<Parameters<typeof objectType>[0]>['opening']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        closing: (value: NonNullable<Parameters<typeof objectType>[0]>['closing']) => /*elided*/ any & {
            $render(): string;
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
export declare function objectTypeCurly(config?: T.ObjectType.Curly.Config): {
    $type: TSKindId.ObjectType;
    $source: 2;
    $named: true;
    _opening: unknown;
    _members: readonly ["," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]] | undefined;
    _closing: unknown;
    opening(): unknown;
    members(): readonly ["," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]] | undefined;
    closing(): unknown;
    $with: {
        members: (values_0: "," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...values: ("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function objectTypeFlow(config?: T.ObjectType.Flow.Config): {
    $type: TSKindId.ObjectType;
    $source: 2;
    $named: true;
    _opening: unknown;
    _members: readonly ["," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]] | undefined;
    _closing: unknown;
    opening(): unknown;
    members(): readonly ["," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]] | undefined;
    closing(): unknown;
    $with: {
        members: (values_0: "," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...values: ("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function omittingTypeAnnotation(type: T.OmittingTypeAnnotation.Config['type']): {
    $type: TSKindId.OmittingTypeAnnotation;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.OmittingTypeAnnotation.Config['type']) => /*elided*/ any & {
            $render(): string;
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
export declare function optingTypeAnnotation(type: T.OptingTypeAnnotation.Config['type']): {
    $type: TSKindId.OptingTypeAnnotation;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.OptingTypeAnnotation.Config['type']) => /*elided*/ any & {
            $render(): string;
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
export declare function optionalParameter(config: T.OptionalParameter.Config): {
    $type: TSKindId.OptionalParameter;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _accessibility_modifier: unknown;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _pattern: T.This | T.Pattern;
    _type: T.TypeAnnotation | undefined;
    _value: T.Expression | undefined;
    decorators(): readonly T.Decorator[] | undefined;
    accessibilityModifier(): unknown;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    pattern(): T.This | T.Pattern;
    type(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        accessibilityModifier: (value?: NonNullable<Parameters<typeof optionalParameter>[0]>['accessibilityModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        overrideModifier: (value?: NonNullable<Parameters<typeof optionalParameter>[0]>['overrideModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        readonlyMarker: (value?: NonNullable<Parameters<typeof optionalParameter>[0]>['readonlyMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function optionalTupleParameter(config: T.OptionalTupleParameter.Config): {
    $type: TSKindId.OptionalTupleParameter;
    $source: 2;
    $named: true;
    _name: T.Identifier;
    _type: T.TypeAnnotation;
    name(): T.Identifier;
    type(): T.TypeAnnotation;
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
        type: (value: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
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
export declare function optionalType(type: T.OptionalType.Config['type']): {
    $type: TSKindId.OptionalType;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.OptionalType.Config['type']) => /*elided*/ any & {
            $render(): string;
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
    })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function parenthesizedExpressionSequence(child: T.SequenceExpression): {
    $type: TSKindId._ParenthesizedExpressionSequence;
    $source: 2;
    $named: true;
    _sequence_expression: T.SequenceExpression;
    sequenceExpression(): T.SequenceExpression;
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
export declare function parenthesizedExpression(config: ConfigOf<T.ParenthesizedExpressionUFormTyped>): ReturnType<typeof parenthesizedExpressionUFormTyped>;
export declare function parenthesizedExpression(config: ConfigOf<T.ParenthesizedExpressionUFormSequence>): ReturnType<typeof parenthesizedExpressionUFormSequence>;
export declare function parenthesizedExpressionUFormTyped(config: Omit<ConfigOf<T.ParenthesizedExpressionUFormTyped>, '$variant'>): {
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    $variant: 'typed';
    _parenthesized_expression_typed: T.ParenthesizedExpressionTyped;
    parenthesizedExpressionTyped(): T.ParenthesizedExpressionTyped;
    $with: {
        parenthesizedExpressionTyped: (value: T.ParenthesizedExpressionTyped) => /*elided*/ any & {
            $render(): string;
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
export declare function parenthesizedExpressionUFormSequence(config: Omit<ConfigOf<T.ParenthesizedExpressionUFormSequence>, '$variant'>): {
    $type: TSKindId.ParenthesizedExpression;
    $source: 2;
    $named: true;
    $variant: 'sequence';
    _parenthesized_expression_sequence: T._ParenthesizedExpressionSequence;
    parenthesizedExpressionSequence(): T._ParenthesizedExpressionSequence;
    $with: {
        parenthesizedExpressionSequence: (value: T._ParenthesizedExpressionSequence) => /*elided*/ any & {
            $render(): string;
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
export declare function parenthesizedType(type: T.ParenthesizedType.Config['type']): {
    $type: TSKindId.ParenthesizedType;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.ParenthesizedType.Config['type']) => /*elided*/ any & {
            $render(): string;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function program(config?: Partial<T.Program.Config>): {
    $type: TSKindId.Program;
    $source: 2;
    $named: true;
    _hash_bang_line: T.HashBangLine | undefined;
    _statements: readonly T.Statement[] | undefined;
    hashBangLine(): T.HashBangLine | undefined;
    statements(): readonly T.Statement[] | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function propertySignature(config: T.PropertySignature.Config): {
    $type: TSKindId.PropertySignature;
    $source: 2;
    $named: true;
    _accessibility_modifier: unknown;
    _static_marker: true | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _name: T.PropertyName;
    _optional_marker: true | undefined;
    _type: T.TypeAnnotation | undefined;
    accessibilityModifier(): unknown;
    staticMarker(): true | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    name(): T.PropertyName;
    optionalMarker(): true | undefined;
    type(): T.TypeAnnotation | undefined;
    $with: {
        accessibilityModifier: (value?: NonNullable<Parameters<typeof propertySignature>[0]>['accessibilityModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        staticMarker: (value?: NonNullable<Parameters<typeof propertySignature>[0]>['staticMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        overrideModifier: (value?: NonNullable<Parameters<typeof propertySignature>[0]>['overrideModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        readonlyMarker: (value?: NonNullable<Parameters<typeof propertySignature>[0]>['readonlyMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        optionalMarker: (value?: NonNullable<Parameters<typeof propertySignature>[0]>['optionalMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
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
export declare function publicFieldDefinition(config: T.PublicFieldDefinition.Config): {
    $type: TSKindId.PublicFieldDefinition;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _public_field_definition_declare_first: T.PublicFieldDefinitionAccessFirst | T.PublicFieldDefinitionDeclareFirst | undefined;
    _public_field_definition_static_mods: T.PublicFieldDefinitionAbstractFirst | T.PublicFieldDefinitionAccessorOpt | T.PublicFieldDefinitionReadonlyFirst | T.PublicFieldDefinitionStaticMods | undefined;
    _name: T.PropertyName;
    _optionality_marker: unknown;
    _type: T.TypeAnnotation | undefined;
    _value: T.Expression | undefined;
    decorators(): readonly T.Decorator[] | undefined;
    publicFieldDefinitionDeclareFirst(): T.PublicFieldDefinitionAccessFirst | T.PublicFieldDefinitionDeclareFirst | undefined;
    publicFieldDefinitionStaticMods(): T.PublicFieldDefinitionAbstractFirst | T.PublicFieldDefinitionAccessorOpt | T.PublicFieldDefinitionReadonlyFirst | T.PublicFieldDefinitionStaticMods | undefined;
    name(): T.PropertyName;
    optionalityMarker(): unknown;
    type(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        publicFieldDefinitionDeclareFirst: (value?: T.PublicFieldDefinitionDeclareFirst | T.PublicFieldDefinitionAccessFirst) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        publicFieldDefinitionStaticMods: (value?: T.PublicFieldDefinitionStaticMods | T.PublicFieldDefinitionAbstractFirst | T.PublicFieldDefinitionReadonlyFirst | T.PublicFieldDefinitionAccessorOpt) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        optionalityMarker: (value?: NonNullable<Parameters<typeof publicFieldDefinition>[0]>['optionalityMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function readonlyType(type: T.ReadonlyType.Config['type']): {
    $type: TSKindId.ReadonlyType;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.ReadonlyType.Config['type']) => /*elided*/ any & {
            $render(): string;
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
export declare function regex(config: T.Regex.Config): {
    $type: TSKindId.Regex;
    $source: 2;
    $named: true;
    _pattern: T.RegexPattern;
    _flags: T.RegexFlags | undefined;
    pattern(): T.RegexPattern;
    flags(): T.RegexFlags | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function requiredParameter(config: T.RequiredParameter.Config): {
    $type: TSKindId.RequiredParameter;
    $source: 2;
    $named: true;
    _decorator: readonly T.Decorator[] | undefined;
    _accessibility_modifier: unknown;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _pattern: T.This | T.Pattern;
    _type: T.TypeAnnotation | undefined;
    _value: T.Expression | undefined;
    decorators(): readonly T.Decorator[] | undefined;
    accessibilityModifier(): unknown;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    pattern(): T.This | T.Pattern;
    type(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    $with: {
        decorators: (...values: T.Decorator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        accessibilityModifier: (value?: NonNullable<Parameters<typeof requiredParameter>[0]>['accessibilityModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        overrideModifier: (value?: NonNullable<Parameters<typeof requiredParameter>[0]>['overrideModifier']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        readonlyMarker: (value?: NonNullable<Parameters<typeof requiredParameter>[0]>['readonlyMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function restPattern(child: T.LhsExpression): {
    $type: TSKindId.RestPattern;
    $source: 2;
    $named: true;
    _lhs_expression: T.LhsExpression;
    lhsExpression(): T.LhsExpression;
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
export declare function restType(type: T.RestType.Config['type']): {
    $type: TSKindId.RestType;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.RestType.Config['type']) => /*elided*/ any & {
            $render(): string;
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
export declare function returnStatement(config: T.ReturnStatement.Config): {
    $type: TSKindId.ReturnStatement;
    $source: 2;
    $named: true;
    _expressions: T.SequenceExpression | undefined;
    _semicolon: T.AutomaticSemicolon;
    expressions(): T.SequenceExpression | undefined;
    semicolon(): T.AutomaticSemicolon;
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
        semicolon: (value: T.Semicolon) => /*elided*/ any & {
            $render(): string;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function sequenceExpression(...children: T.Expression[]): {
    $type: TSKindId.SequenceExpression;
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
export declare function spreadElement(expression: T.SpreadElement.Config['expression']): {
    $type: TSKindId.SpreadElement;
    $source: 2;
    $named: true;
    _expression: T.Expression;
    expression(): T.Expression;
    $with: {
        expression: (value: T.SpreadElement.Config['expression']) => /*elided*/ any & {
            $render(): string;
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
export declare function statementBlock(config?: Partial<T.StatementBlock.Config>): {
    $type: TSKindId.StatementBlock;
    $source: 2;
    $named: true;
    _statements: readonly T.Statement[] | undefined;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    statements(): readonly T.Statement[] | undefined;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function string(config: ConfigOf<T.String>): {
    $type: TSKindId.String;
    $source: 2;
    $named: true;
    _opening: unknown;
    _contents: readonly (T.EscapeSequence | T.UnescapedDoubleStringFragment | T.UnescapedSingleStringFragment)[] | undefined;
    _closing: unknown;
    opening(): unknown;
    contents(): readonly (T.EscapeSequence | T.UnescapedDoubleStringFragment | T.UnescapedSingleStringFragment)[] | undefined;
    closing(): unknown;
    $with: {
        opening: (value: NonNullable<Parameters<typeof string>[0]>['opening']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        contents: (...values: (T.UnescapedDoubleStringFragment | T.EscapeSequence | T.UnescapedSingleStringFragment)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
        };
        closing: (value: NonNullable<Parameters<typeof string>[0]>['closing']) => /*elided*/ any & {
            $render(): string;
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
export declare function stringDouble(config?: T.String.Double.Config): {
    $type: TSKindId.String;
    $source: 2;
    $named: true;
    _opening: unknown;
    _contents: readonly (T.EscapeSequence | T.UnescapedDoubleStringFragment | T.UnescapedSingleStringFragment)[] | undefined;
    _closing: unknown;
    opening(): unknown;
    contents(): readonly (T.EscapeSequence | T.UnescapedDoubleStringFragment | T.UnescapedSingleStringFragment)[] | undefined;
    closing(): unknown;
    $with: {
        contents: (...values: (T.UnescapedDoubleStringFragment | T.EscapeSequence | T.UnescapedSingleStringFragment)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function stringSingle(config?: T.String.Single.Config): {
    $type: TSKindId.String;
    $source: 2;
    $named: true;
    _opening: unknown;
    _contents: readonly (T.EscapeSequence | T.UnescapedDoubleStringFragment | T.UnescapedSingleStringFragment)[] | undefined;
    _closing: unknown;
    opening(): unknown;
    contents(): readonly (T.EscapeSequence | T.UnescapedDoubleStringFragment | T.UnescapedSingleStringFragment)[] | undefined;
    closing(): unknown;
    $with: {
        contents: (...values: (T.UnescapedDoubleStringFragment | T.EscapeSequence | T.UnescapedSingleStringFragment)[]) => /*elided*/ any & {
            $render(): string;
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
export declare function subscriptExpression(config: T.SubscriptExpression.Config): {
    $type: TSKindId.SubscriptExpression;
    $source: 2;
    $named: true;
    _object: T.Expression | T.PrimaryExpression;
    _optional_chain: true | undefined;
    _index: T.SequenceExpression;
    object(): T.Expression | T.PrimaryExpression;
    optionalChain(): true | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        optionalChain: (value?: NonNullable<Parameters<typeof subscriptExpression>[0]>['optionalChain']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function switchBody(...children: (T.SwitchCase | T.SwitchDefault)[]): {
    $type: TSKindId.SwitchBody;
    $source: 2;
    $named: true;
    _switch_case: (T.SwitchCase | T.SwitchDefault)[];
    switchCases(): (T.SwitchCase | T.SwitchDefault)[];
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
export declare function switchCase(config: T.SwitchCase.Config): {
    $type: TSKindId.SwitchCase;
    $source: 2;
    $named: true;
    _value: T.SequenceExpression;
    _body: readonly T.Statement[] | undefined;
    value(): T.SequenceExpression;
    bodies(): readonly T.Statement[] | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        bodies: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
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
export declare function switchDefault(config?: Partial<T.SwitchDefault.Config>): {
    $type: TSKindId.SwitchDefault;
    $source: 2;
    $named: true;
    _body: readonly T.Statement[] | undefined;
    bodies(): readonly T.Statement[] | undefined;
    $with: {
        bodies: (...values: T.Statement[]) => /*elided*/ any & {
            $render(): string;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function templateLiteralType(...children: (T.TemplateChars | T.TemplateType)[]): {
    $type: TSKindId.TemplateLiteralType;
    $source: 2;
    $named: true;
    _template_chars: (T.TemplateChars | T.TemplateType)[];
    templateChars(): (T.TemplateChars | T.TemplateType)[];
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
export declare function templateString(...children: (T.TemplateChars | T.EscapeSequence | T.TemplateSubstitution)[]): {
    $type: TSKindId.TemplateString;
    $source: 2;
    $named: true;
    _template_chars: (T.EscapeSequence | T.TemplateChars | T.TemplateSubstitution)[];
    templateChars(): (T.EscapeSequence | T.TemplateChars | T.TemplateSubstitution)[];
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
export declare function templateSubstitution(child: T.Expressions): {
    $type: TSKindId.TemplateSubstitution;
    $source: 2;
    $named: true;
    _expressions: T.SequenceExpression;
    expressions(): T.SequenceExpression;
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
export declare function templateType(child: (T.PrimaryType | T.InferType)): {
    $type: TSKindId.TemplateType;
    $source: 2;
    $named: true;
    _primary_type: T.InferType | T.PrimaryType;
    primaryType(): T.InferType | T.PrimaryType;
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
            })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export declare function throwStatement(config: T.ThrowStatement.Config): {
    $type: TSKindId.ThrowStatement;
    $source: 2;
    $named: true;
    _expressions: T.SequenceExpression;
    _semicolon: T.AutomaticSemicolon;
    expressions(): T.SequenceExpression;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        expressions: (value: T.Expressions) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function tupleParameter(config: T.TupleParameter.Config): {
    $type: TSKindId.TupleParameter;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.RestPattern;
    _type: T.TypeAnnotation;
    name(): T.Identifier | T.RestPattern;
    type(): T.TypeAnnotation;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
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
export declare function tupleType(...children: T.TupleTypeMember[]): {
    $type: TSKindId.TupleType;
    $source: 2;
    $named: true;
    _tuple_type_member: T.TupleTypeMember[];
    tupleTypeMembers(): T.TupleTypeMember[];
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function typeAnnotation(type: T.TypeAnnotation.Config['type']): {
    $type: TSKindId.TypeAnnotation;
    $source: 2;
    $named: true;
    _type: T.Type;
    type(): T.Type;
    $with: {
        type: (value: T.TypeAnnotation.Config['type']) => /*elided*/ any & {
            $render(): string;
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
export declare function typeArguments(...children: T.Type[]): {
    $type: TSKindId.TypeArguments;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function typeParameter(config: T.TypeParameter.Config): {
    $type: TSKindId.TypeParameter;
    $source: 2;
    $named: true;
    _const_marker: true | undefined;
    _name: T.TypeIdentifier;
    _constraint: T.Constraint | undefined;
    _value: T.DefaultType | undefined;
    constMarker(): true | undefined;
    name(): T.TypeIdentifier;
    constraint(): T.Constraint | undefined;
    value(): T.DefaultType | undefined;
    $with: {
        constMarker: (value?: NonNullable<Parameters<typeof typeParameter>[0]>['constMarker']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function typeParameters(...children: T.TypeParameter[]): {
    $type: TSKindId.TypeParameters;
    $source: 2;
    $named: true;
    _type_parameter: T.TypeParameter[] & readonly [T.TypeParameter, ...T.TypeParameter[]];
    typeParameters(): T.TypeParameter[] & readonly [T.TypeParameter, ...T.TypeParameter[]];
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
export declare function typePredicate(config: T.TypePredicate.Config): {
    $type: TSKindId.TypePredicate;
    $source: 2;
    $named: true;
    _name: T.PredefinedType | T.This;
    _type: T.Type;
    name(): T.PredefinedType | T.This;
    type(): T.Type;
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
export declare function typePredicateAnnotation(typePredicate: T.TypePredicateAnnotation.Config['typePredicate']): {
    $type: TSKindId.TypePredicateAnnotation;
    $source: 2;
    $named: true;
    _type_predicate: ":" | T.TypePredicate;
    typePredicate(): ":" | T.TypePredicate;
    $with: {
        typePredicate: (value: T.TypePredicateAnnotation.Config['typePredicate']) => /*elided*/ any & {
            $render(): string;
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
export declare function typeQuery(child: (T.TypeQuerySubscriptExpression | T.TypeQueryMemberExpression | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.Identifier | T.This)): {
    $type: TSKindId.TypeQuery;
    $source: 2;
    $named: true;
    _type_query_subscript_expression: T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    typeQuerySubscriptExpression(): T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
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
export declare function unaryExpression(config: T.UnaryExpression.Config): {
    $type: TSKindId.UnaryExpression;
    $source: 2;
    $named: true;
    _operator: unknown;
    _argument: T.Expression;
    operator(): unknown;
    argument(): T.Expression;
    $with: {
        operator: (value: NonNullable<Parameters<typeof unaryExpression>[0]>['operator']) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
export declare function updateExpression(config: ConfigOf<T.UpdateExpressionUFormPostfix>): ReturnType<typeof updateExpressionUFormPostfix>;
export declare function updateExpression(config: ConfigOf<T.UpdateExpressionUFormPrefix>): ReturnType<typeof updateExpressionUFormPrefix>;
export declare function updateExpressionUFormPostfix(config: Omit<ConfigOf<T.UpdateExpressionUFormPostfix>, '$variant'>): {
    $type: TSKindId.UpdateExpression;
    $source: 2;
    $named: true;
    $variant: 'postfix';
    _update_expression_postfix: T.UpdateExpressionPostfix;
    updateExpressionPostfix(): T.UpdateExpressionPostfix;
    $with: {
        updateExpressionPostfix: (value: T.UpdateExpressionPostfix) => /*elided*/ any & {
            $render(): string;
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
export declare function updateExpressionUFormPrefix(config: Omit<ConfigOf<T.UpdateExpressionUFormPrefix>, '$variant'>): {
    $type: TSKindId.UpdateExpression;
    $source: 2;
    $named: true;
    $variant: 'prefix';
    _update_expression_prefix: T.UpdateExpressionPrefix;
    updateExpressionPrefix(): T.UpdateExpressionPrefix;
    $with: {
        updateExpressionPrefix: (value: T.UpdateExpressionPrefix) => /*elided*/ any & {
            $render(): string;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function variableDeclarator(config: T.VariableDeclarator.Config): {
    $type: TSKindId.VariableDeclarator;
    $source: 2;
    $named: true;
    _name: T.Identifier | T.DestructuringPattern;
    _type: T.TypeAnnotation | undefined;
    _value: T.Expression | undefined;
    name(): T.Identifier | T.DestructuringPattern;
    type(): T.TypeAnnotation | undefined;
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
            })[]): import("@sittir/types").AnyNodeData;
        };
        type: (value?: T.TypeAnnotation) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
            })[]): import("@sittir/types").AnyNodeData;
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
export declare function yieldExpression(expression?: T.YieldExpression.Config['expression']): {
    $type: TSKindId.YieldExpression;
    $source: 2;
    $named: true;
    _expression: T.Expression | undefined;
    expression(): T.Expression | undefined;
    $with: {
        expression: (value?: T.YieldExpression.Config['expression']) => /*elided*/ any & {
            $render(): string;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
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
    })[]): import("@sittir/types").AnyNodeData;
};
export type FluentKindMap = {
    "_ambient_declaration_declaration": FluentNode<"_ambient_declaration_declaration", T._AmbientDeclarationDeclaration.Config>;
    "_ambient_declaration_global": T.AmbientDeclarationGlobal;
    "_ambient_declaration_module": T.AmbientDeclarationModule;
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
    "_type_identifier": T.TypeIdentifier;
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
    "ambient_declaration_declaration": FluentNode<"ambient_declaration_declaration", T.AmbientDeclarationDeclaration.Config>;
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
    readonly "_ambient_declaration_declaration": typeof _ambientDeclarationDeclaration;
    readonly "_ambient_declaration_global": typeof _ambientDeclarationGlobal;
    readonly "_ambient_declaration_module": typeof _ambientDeclarationModule;
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
    readonly "ambient_declaration_declaration": typeof ambientDeclarationDeclaration;
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