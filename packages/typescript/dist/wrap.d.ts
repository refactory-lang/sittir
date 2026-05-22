import type { TreeHandle } from '@sittir/common';
import type { AnyNodeData as _NodeData, AnyNodeData } from '@sittir/types';
import { TSKindId } from './types.js';
import type * as T from './types.js';
export declare function wrap_AmbientDeclarationDeclaration(data: T._AmbientDeclarationDeclaration, tree: TreeHandle): {
    $type: TSKindId._AmbientDeclarationDeclaration;
    _declaration: any;
    declaration(): T.Declaration;
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
export declare function wrapAmbientDeclarationGlobal(data: T.AmbientDeclarationGlobal, tree: TreeHandle): {
    $type: TSKindId.AmbientDeclarationGlobal;
    _body: T.StatementBlock;
    body(): T.StatementBlock;
    $with: {
        body: (v: NonNullable<T.AmbientDeclarationGlobal['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAmbientDeclarationModule(data: T.AmbientDeclarationModule, tree: TreeHandle): {
    $type: TSKindId.AmbientDeclarationModule;
    _name: T.Identifier;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    _semicolon: T.AutomaticSemicolon | undefined;
    name(): T.Identifier;
    type(): T.Type;
    semicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        name: (v: NonNullable<T.AmbientDeclarationModule['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.AmbientDeclarationModule['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.AmbientDeclarationModule['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ArrowFunctionUCallSignature(data: T._ArrowFunctionUCallSignature, tree: TreeHandle): {
    $type: TSKindId._ArrowFunctionUCallSignature;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        typeParameters: (v: NonNullable<T._ArrowFunctionUCallSignature['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T._ArrowFunctionUCallSignature['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T._ArrowFunctionUCallSignature['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ArrowFunctionParameter(data: T._ArrowFunctionParameter, tree: TreeHandle): {
    $type: TSKindId._ArrowFunctionParameter;
    _parameter: T.ReservedIdentifier;
    parameter(): T.ReservedIdentifier;
    $with: {
        parameter: (v: NonNullable<T._ArrowFunctionParameter['_parameter']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapCallExpressionCall(data: T.CallExpressionCall, tree: TreeHandle): {
    $type: TSKindId.CallExpressionCall;
    _function: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.Import | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _type_arguments: T.TypeArguments | undefined;
    _arguments: T.Arguments;
    function(): T.Import | T.Expression;
    typeArguments(): T.TypeArguments | undefined;
    arguments(): T.Arguments;
    $with: {
        function: (v: NonNullable<T.CallExpressionCall['_function']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (v: NonNullable<T.CallExpressionCall['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (v: NonNullable<T.CallExpressionCall['_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapCallExpressionMember(data: T.CallExpressionMember, tree: TreeHandle): {
    $type: TSKindId.CallExpressionMember;
    _function: T.Array | T.ArrowFunctionUFormParameter | T.ArrowFunctionUFormUCallSignature | T.CallExpressionUFormCall | T.CallExpressionUFormMember | T.CallExpressionUFormTemplateCall | T.Class | T.False | T.FunctionExpression | T.GeneratorFunction | T.Identifier | T.MemberExpression | T.MetaProperty | T.NonNullExpression | T.Null | T.Number | T.Object | T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped | T.Regex | T.ReservedIdentifier | T.String | T.SubscriptExpression | T.Super | T.TemplateString | T.This | T.True | T.Undefined;
    _type_arguments: T.TypeArguments | undefined;
    _arguments: T.Arguments;
    function(): T.PrimaryExpression;
    typeArguments(): T.TypeArguments | undefined;
    arguments(): T.Arguments;
    $with: {
        function: (v: NonNullable<T.CallExpressionMember['_function']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (v: NonNullable<T.CallExpressionMember['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (v: NonNullable<T.CallExpressionMember['_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapCallExpressionTemplateCall(data: T.CallExpressionTemplateCall, tree: TreeHandle): {
    $type: TSKindId.CallExpressionTemplateCall;
    _function: T.Array | T.ArrowFunctionUFormParameter | T.ArrowFunctionUFormUCallSignature | T.CallExpressionUFormCall | T.CallExpressionUFormMember | T.CallExpressionUFormTemplateCall | T.Class | T.False | T.FunctionExpression | T.GeneratorFunction | T.Identifier | T.MemberExpression | T.MetaProperty | T.NewExpression | T.NonNullExpression | T.Null | T.Number | T.Object | T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped | T.Regex | T.ReservedIdentifier | T.String | T.SubscriptExpression | T.Super | T.TemplateString | T.This | T.True | T.Undefined;
    _arguments: T.TemplateString;
    function(): T.NewExpression | T.PrimaryExpression;
    arguments(): T.TemplateString;
    $with: {
        function: (v: NonNullable<T.CallExpressionTemplateCall['_function']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (v: NonNullable<T.CallExpressionTemplateCall['_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_CallSignature(data: T._CallSignature, tree: TreeHandle): {
    $type: TSKindId._CallSignature;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        typeParameters: (v: NonNullable<T._CallSignature['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T._CallSignature['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T._CallSignature['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapClassBodyMember(data: T.ClassBodyMember, tree: TreeHandle): {
    $type: TSKindId.ClassBodyMember;
    _abstract_method_signature: T.AbstractMethodSignature | T.IndexSignatureUFormColon | T.IndexSignatureUFormMappedTypeClause | T.MethodSignature | T.PublicFieldDefinition;
    _semicolon: any;
    abstractMethodSignature(): T.AbstractMethodSignature | T.MethodSignature | T.PublicFieldDefinition | T.IndexSignature;
    semicolon(): "," | T.AutomaticSemicolon;
    $with: {
        abstractMethodSignature: (v: NonNullable<T.ClassBodyMember['_abstract_method_signature']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ClassBodyMember['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapClassBodyMethod(data: T.ClassBodyMethod, tree: TreeHandle): {
    $type: TSKindId.ClassBodyMethod;
    _decorator: readonly T.Decorator[];
    _method_definition: T.MethodDefinition;
    _semicolon: any;
    decorators(): T.Decorator[];
    methodDefinition(): T.MethodDefinition;
    semicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        decorators: (...v: NonNullable<T.ClassBodyMethod['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        methodDefinition: (v: NonNullable<T.ClassBodyMethod['_method_definition']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ClassBodyMethod['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapClassBodyMethodSig(data: T.ClassBodyMethodSig, tree: TreeHandle): {
    $type: TSKindId.ClassBodyMethodSig;
    _method_signature: T.MethodSignature;
    _function_signature_automatic_semicolon: "," | T.FunctionSignatureAutomaticSemicolon;
    methodSignature(): T.MethodSignature;
    functionSignatureAutomaticSemicolon(): "," | T.FunctionSignatureAutomaticSemicolon;
    $with: {
        methodSignature: (v: NonNullable<T.ClassBodyMethodSig['_method_signature']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        functionSignatureAutomaticSemicolon: (v: NonNullable<T.ClassBodyMethodSig['_function_signature_automatic_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ClassHeritageExtendsClause(data: T._ClassHeritageExtendsClause, tree: TreeHandle): {
    $type: TSKindId._ClassHeritageExtendsClause;
    _extends_clause: T.ExtendsClause;
    _implements_clause: T.ImplementsClause | undefined;
    extendsClause(): T.ExtendsClause;
    implementsClause(): T.ImplementsClause | undefined;
    $with: {
        extendsClause: (v: NonNullable<T._ClassHeritageExtendsClause['_extends_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        implementsClause: (v: NonNullable<T._ClassHeritageExtendsClause['_implements_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ClassHeritageImplementsClause(data: T._ClassHeritageImplementsClause, tree: TreeHandle): {
    $type: TSKindId._ClassHeritageImplementsClause;
    _implements_clause: T.ImplementsClause;
    implementsClause(): T.ImplementsClause;
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
export declare function wrapDestructuringPattern(data: T.DestructuringPattern, tree: TreeHandle): T.DestructuringPattern;
export declare function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle): T.ExportStatementDefault;
export declare function wrapExportStatementDefaultDeclArm(data: T.ExportStatementDefaultDeclArm, tree: TreeHandle): {
    $type: TSKindId.ExportStatementDefaultDeclArm;
    _decorator: readonly T.Decorator[];
    _declaration: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.ClassDeclaration | T.EnumDeclaration | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.ImportAlias | T.InterfaceDeclaration | T.InternalModule | T.LexicalDeclaration | T.Module | T.TypeAliasDeclaration | T.VariableDeclaration | undefined;
    _export_statement_default_decl_arm_default_kw: T.ExportStatementDefaultDeclArmDefaultKw | undefined;
    decorators(): T.Decorator[];
    declaration(): T.Declaration | undefined;
    exportStatementDefaultDeclArmDefaultKw(): T.ExportStatementDefaultDeclArmDefaultKw | undefined;
    $with: {
        decorators: (...v: NonNullable<T.ExportStatementDefaultDeclArm['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        declaration: (v: NonNullable<T.ExportStatementDefaultDeclArm['_declaration']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementDefaultDeclArmDefaultKw: (v: NonNullable<T.ExportStatementDefaultDeclArm['_export_statement_default_decl_arm_default_kw']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementDefaultDeclArmDefaultKw(data: T.ExportStatementDefaultDeclArmDefaultKw, tree: TreeHandle): {
    $type: TSKindId.ExportStatementDefaultDeclArmDefaultKw;
    _declaration: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.ClassDeclaration | T.EnumDeclaration | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.ImportAlias | T.InterfaceDeclaration | T.InternalModule | T.LexicalDeclaration | T.Module | T.TypeAliasDeclaration | T.VariableDeclaration | undefined;
    _export_statement_default_decl_arm_default_kw_value: T.ExportStatementDefaultDeclArmDefaultKwValue | undefined;
    declaration(): T.Declaration | undefined;
    exportStatementDefaultDeclArmDefaultKwValue(): T.ExportStatementDefaultDeclArmDefaultKwValue | undefined;
    $with: {
        declaration: (v: NonNullable<T.ExportStatementDefaultDeclArmDefaultKw['_declaration']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementDefaultDeclArmDefaultKwValue: (v: NonNullable<T.ExportStatementDefaultDeclArmDefaultKw['_export_statement_default_decl_arm_default_kw_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementDefaultDeclArmDefaultKwValue(data: T.ExportStatementDefaultDeclArmDefaultKwValue, tree: TreeHandle): {
    $type: TSKindId.ExportStatementDefaultDeclArmDefaultKwValue;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _semicolon: any;
    value(): T.Expression;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        value: (v: NonNullable<T.ExportStatementDefaultDeclArmDefaultKwValue['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ExportStatementDefaultDeclArmDefaultKwValue['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementDefaultFromArm(data: T.ExportStatementDefaultFromArm, tree: TreeHandle): {
    $type: TSKindId.ExportStatementDefaultFromArm;
    _export_statement_default_from_arm_star_from: T.ExportClause | T.ExportStatementDefaultFromArmClauseFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmStarFrom;
    _semicolon: any;
    exportStatementDefaultFromArmStarFrom(): T.ExportClause | T.ExportStatementDefaultFromArmClauseFrom | T.ExportStatementDefaultFromArmNsFrom | T.ExportStatementDefaultFromArmStarFrom;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        exportStatementDefaultFromArmStarFrom: (v: NonNullable<T.ExportStatementDefaultFromArm['_export_statement_default_from_arm_star_from']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ExportStatementDefaultFromArm['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementDefaultFromArmClauseFrom(data: T.ExportStatementDefaultFromArmClauseFrom, tree: TreeHandle): {
    $type: TSKindId.ExportStatementDefaultFromArmClauseFrom;
    _export_clause: T.ExportClause;
    _source: T.String;
    exportClause(): T.ExportClause;
    source(): T.String;
    $with: {
        exportClause: (v: NonNullable<T.ExportStatementDefaultFromArmClauseFrom['_export_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        source: (v: NonNullable<T.ExportStatementDefaultFromArmClauseFrom['_source']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementDefaultFromArmNsFrom(data: T.ExportStatementDefaultFromArmNsFrom, tree: TreeHandle): {
    $type: TSKindId.ExportStatementDefaultFromArmNsFrom;
    _namespace_export: T.NamespaceExport;
    _source: T.String;
    namespaceExport(): T.NamespaceExport;
    source(): T.String;
    $with: {
        namespaceExport: (v: NonNullable<T.ExportStatementDefaultFromArmNsFrom['_namespace_export']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        source: (v: NonNullable<T.ExportStatementDefaultFromArmNsFrom['_source']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementDefaultFromArmStarFrom(data: T.ExportStatementDefaultFromArmStarFrom, tree: TreeHandle): {
    $type: TSKindId.ExportStatementDefaultFromArmStarFrom;
    _source: T.String;
    source(): T.String;
    $with: {
        source: (v: NonNullable<T.ExportStatementDefaultFromArmStarFrom['_source']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ExportStatementEqualsExport(data: T._ExportStatementEqualsExport, tree: TreeHandle): {
    $type: TSKindId._ExportStatementEqualsExport;
    _expression: any;
    _semicolon: any;
    expression(): T.Expression;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        expression: (v: NonNullable<T._ExportStatementEqualsExport['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T._ExportStatementEqualsExport['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ExportStatementNamespaceExport(data: T._ExportStatementNamespaceExport, tree: TreeHandle): {
    $type: TSKindId._ExportStatementNamespaceExport;
    _identifier: T.Identifier;
    _semicolon: any;
    identifier(): T.Identifier;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        identifier: (v: NonNullable<T._ExportStatementNamespaceExport['_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T._ExportStatementNamespaceExport['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ExportStatementTypeExport(data: T._ExportStatementTypeExport, tree: TreeHandle): {
    $type: TSKindId._ExportStatementTypeExport;
    _export_clause: T.ExportClause;
    _source: T.String | undefined;
    _semicolon: any;
    exportClause(): T.ExportClause;
    source(): T.String | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        exportClause: (v: NonNullable<T._ExportStatementTypeExport['_export_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        source: (v: NonNullable<T._ExportStatementTypeExport['_source']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T._ExportStatementTypeExport['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExtendsClauseSingle(data: T.ExtendsClauseSingle, tree: TreeHandle): {
    $type: TSKindId.ExtendsClauseSingle;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _type_arguments: T.TypeArguments | undefined;
    value(): T.Expression;
    typeArguments(): T.TypeArguments | undefined;
    $with: {
        value: (v: NonNullable<T.ExtendsClauseSingle['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (v: NonNullable<T.ExtendsClauseSingle['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapForHeader(data: T.ForHeader, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"in" | "of", TSKindId.In | TSKindId.Of>;
    };
    $type: TSKindId.ForHeader;
    _for_header_lhs: T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind;
    _operator: number;
    _right: T.SequenceExpression;
    forHeaderLhs(): T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind;
    operator(): number;
    right(): T.SequenceExpression;
    $with: {
        forHeaderLhs: (v: NonNullable<T.ForHeader['_for_header_lhs']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.ForHeader['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.ForHeader['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapForHeaderLetConstKind(data: T.ForHeaderLetConstKind, tree: TreeHandle): {
    __inputHints__?: {
        readonly kind: import("@sittir/types").KindEnum<"const" | "let", TSKindId.Let | TSKindId.Const>;
    };
    $type: TSKindId.ForHeaderLetConstKind;
    _kind: number;
    _left: T.ArrayPattern | T.Identifier | T.ObjectPattern;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    kind(): number;
    left(): T.Identifier | T.DestructuringPattern;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        kind: (v: NonNullable<T.ForHeaderLetConstKind['_kind']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        left: (v: NonNullable<T.ForHeaderLetConstKind['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        automaticSemicolon: (v: NonNullable<T.ForHeaderLetConstKind['_automatic_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapForHeaderLhs(data: T.ForHeaderLhs, tree: TreeHandle): {
    $type: TSKindId.ForHeaderLhs;
    _left: T.LhsExpression | T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped;
    left(): T.LhsExpression | T.ParenthesizedExpression;
    $with: {
        left: (v: NonNullable<T.ForHeaderLhs['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapForHeaderVarKind(data: T.ForHeaderVarKind, tree: TreeHandle): {
    __inputHints__?: {
        readonly kind: import("@sittir/types").KindEnum<"var", TSKindId.Var>;
    };
    $type: TSKindId.ForHeaderVarKind;
    _kind: number;
    _left: T.ArrayPattern | T.Identifier | T.ObjectPattern;
    _initializer: T.Initializer | undefined;
    kind(): number;
    left(): T.Identifier | T.DestructuringPattern;
    initializer(): T.Initializer | undefined;
    $with: {
        kind: (v: NonNullable<T.ForHeaderVarKind['_kind']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        left: (v: NonNullable<T.ForHeaderVarKind['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        initializer: (v: NonNullable<T.ForHeaderVarKind['_initializer']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapFormalParameter(data: T.FormalParameter, tree: TreeHandle): T.FormalParameter;
export declare function wrapFromClause(data: T.FromClause, tree: TreeHandle): {
    $type: TSKindId.FromClause;
    _source: T.String;
    source(): T.String;
    $with: {
        source: (v: NonNullable<T.FromClause['_source']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ImportClauseDefaultImport(data: T._ImportClauseDefaultImport, tree: TreeHandle): {
    $type: TSKindId._ImportClauseDefaultImport;
    _import_identifier: any;
    _namespace_import: any;
    importIdentifier(): T.Identifier;
    namespaceImport(): T.NamedImports | T.NamespaceImport | undefined;
    $with: {
        importIdentifier: (v: NonNullable<T._ImportClauseDefaultImport['_import_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        namespaceImport: (v: NonNullable<T._ImportClauseDefaultImport['_namespace_import']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ImportClauseNamedImports(data: T._ImportClauseNamedImports, tree: TreeHandle): {
    $type: TSKindId._ImportClauseNamedImports;
    _named_imports: T.NamedImports;
    namedImports(): T.NamedImports;
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
export declare function wrap_ImportClauseNamespaceImport(data: T._ImportClauseNamespaceImport, tree: TreeHandle): {
    $type: TSKindId._ImportClauseNamespaceImport;
    _namespace_import: T.NamespaceImport;
    namespaceImport(): T.NamespaceImport;
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
export declare function wrapImportIdentifier(data: T.ImportIdentifier, tree: TreeHandle): T.Identifier;
export declare function wrapImportSpecifierAs(data: T.ImportSpecifierAs, tree: TreeHandle): {
    $type: TSKindId.ImportSpecifierAs;
    _name: T.Identifier | T.String;
    _alias: T.Identifier;
    name(): T.ModuleExportName;
    alias(): T.Identifier;
    $with: {
        name: (v: NonNullable<T.ImportSpecifierAs['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (v: NonNullable<T.ImportSpecifierAs['_alias']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ImportSpecifierName(data: T._ImportSpecifierName, tree: TreeHandle): {
    $type: TSKindId._ImportSpecifierName;
    _name: T.Identifier;
    name(): T.Identifier;
    $with: {
        name: (v: NonNullable<T._ImportSpecifierName['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapIndexSignatureColon(data: T.IndexSignatureColon, tree: TreeHandle): {
    $type: TSKindId.IndexSignatureColon;
    _name: T.ReservedIdentifier;
    _index_type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    name(): T.ReservedIdentifier;
    indexType(): T.Type;
    $with: {
        name: (v: NonNullable<T.IndexSignatureColon['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        indexType: (v: NonNullable<T.IndexSignatureColon['_index_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_IndexSignatureMappedTypeClause(data: T._IndexSignatureMappedTypeClause, tree: TreeHandle): {
    $type: TSKindId._IndexSignatureMappedTypeClause;
    _mapped_type_clause: T.MappedTypeClause;
    mappedTypeClause(): T.MappedTypeClause;
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
export declare function wrapInitializer(data: T.Initializer, tree: TreeHandle): {
    $type: TSKindId.Initializer;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    value(): T.Expression;
    $with: {
        value: (v: NonNullable<T.Initializer['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_Module(data: T._Module, tree: TreeHandle): {
    $type: TSKindId._Module;
    _name: T.Identifier | T.NestedIdentifier | T.String;
    _body: T.StatementBlock | undefined;
    name(): T.Identifier | T.NestedIdentifier | T.String;
    body(): T.StatementBlock | undefined;
    $with: {
        name: (v: NonNullable<T._Module['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T._Module['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapModuleExportName(data: T.ModuleExportName, tree: TreeHandle): T.ModuleExportName;
export declare function wrap_Number(data: T._Number, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"+" | "-", TSKindId.Plus | TSKindId.Dash>;
    };
    $type: TSKindId._Number;
    _operator: number;
    _argument: T.Number;
    operator(): number;
    argument(): T.Number;
    $with: {
        operator: (v: NonNullable<T._Number['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (v: NonNullable<T._Number['_argument']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapParameterName(data: T.ParameterName, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier?: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly override_modifier?: import("@sittir/types").BooleanKeyword<"override">;
        readonly readonly_marker?: import("@sittir/types").BooleanKeyword<"readonly">;
    };
    $type: TSKindId.ParameterName;
    _decorator: readonly T.Decorator[];
    _accessibility_modifier: number | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _pattern: T.ArrayPattern | T.Identifier | T.MemberExpression | T.NonNullExpression | T.ObjectPattern | T.RestPattern | T.SubscriptExpression | T.This | T.Undefined;
    decorators(): T.Decorator[];
    accessibilityModifier(): number | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    pattern(): T.This | T.Pattern;
    $with: {
        decorators: (...v: NonNullable<T.ParameterName['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessibilityModifier: (v: NonNullable<T.ParameterName['_accessibility_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (v: NonNullable<T.ParameterName['_override_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (v: NonNullable<T.ParameterName['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        pattern: (v: NonNullable<T.ParameterName['_pattern']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrap_ParenthesizedExpressionSequence(data: T._ParenthesizedExpressionSequence, tree: TreeHandle): {
    $type: TSKindId._ParenthesizedExpressionSequence;
    _sequence_expression: T.SequenceExpression;
    sequenceExpression(): T.SequenceExpression;
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
export declare function wrapParenthesizedExpressionTyped(data: T.ParenthesizedExpressionTyped, tree: TreeHandle): {
    $type: TSKindId.ParenthesizedExpressionTyped;
    _expression: any;
    _type: T.TypeAnnotation | undefined;
    expression(): T.Expression;
    type(): T.TypeAnnotation | undefined;
    $with: {
        expression: (v: NonNullable<T.ParenthesizedExpressionTyped['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.ParenthesizedExpressionTyped['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapPropertyIdentifier(data: T.PropertyIdentifier, tree: TreeHandle): T.PropertyIdentifier;
export declare function wrapPropertyName(data: T.PropertyName, tree: TreeHandle): T.PropertyName;
export declare function wrapPublicFieldDefinitionAbstractFirst(data: T.PublicFieldDefinitionAbstractFirst, tree: TreeHandle): {
    __inputHints__?: {
        readonly abstract_marker: import("@sittir/types").KindEnum<"abstract", TSKindId.Abstract>;
        readonly readonly_marker?: import("@sittir/types").BooleanKeyword<"readonly">;
    };
    $type: TSKindId.PublicFieldDefinitionAbstractFirst;
    _abstract_marker: number;
    _readonly_marker: true | undefined;
    abstractMarker(): number;
    readonlyMarker(): true | undefined;
    $with: {
        abstractMarker: (v: NonNullable<T.PublicFieldDefinitionAbstractFirst['_abstract_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (v: NonNullable<T.PublicFieldDefinitionAbstractFirst['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapPublicFieldDefinitionAccessFirst(data: T.PublicFieldDefinitionAccessFirst, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly declare_marker?: import("@sittir/types").BooleanKeyword<"declare">;
    };
    $type: TSKindId.PublicFieldDefinitionAccessFirst;
    _accessibility_modifier: number;
    _declare_marker: true | undefined;
    accessibilityModifier(): number;
    declareMarker(): true | undefined;
    $with: {
        accessibilityModifier: (v: NonNullable<T.PublicFieldDefinitionAccessFirst['_accessibility_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        declareMarker: (v: NonNullable<T.PublicFieldDefinitionAccessFirst['_declare_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapPublicFieldDefinitionAccessorOpt(data: T.PublicFieldDefinitionAccessorOpt, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessor_marker: import("@sittir/types").KindEnum<"accessor", TSKindId.Accessor>;
    };
    $type: TSKindId.PublicFieldDefinitionAccessorOpt;
    _accessor_marker: number;
    accessorMarker(): number;
    $with: {
        accessorMarker: (v: NonNullable<T.PublicFieldDefinitionAccessorOpt['_accessor_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapPublicFieldDefinitionDeclareFirst(data: T.PublicFieldDefinitionDeclareFirst, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier?: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
    };
    $type: TSKindId.PublicFieldDefinitionDeclareFirst;
    _accessibility_modifier: number | undefined;
    accessibilityModifier(): number | undefined;
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
export declare function wrapPublicFieldDefinitionReadonlyFirst(data: T.PublicFieldDefinitionReadonlyFirst, tree: TreeHandle): {
    __inputHints__?: {
        readonly readonly_marker: import("@sittir/types").KindEnum<"readonly", TSKindId.Readonly>;
        readonly abstract_marker?: import("@sittir/types").BooleanKeyword<"abstract">;
    };
    $type: TSKindId.PublicFieldDefinitionReadonlyFirst;
    _readonly_marker: number;
    _abstract_marker: true | undefined;
    readonlyMarker(): number;
    abstractMarker(): true | undefined;
    $with: {
        readonlyMarker: (v: NonNullable<T.PublicFieldDefinitionReadonlyFirst['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        abstractMarker: (v: NonNullable<T.PublicFieldDefinitionReadonlyFirst['_abstract_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapPublicFieldDefinitionStaticMods(data: T.PublicFieldDefinitionStaticMods, tree: TreeHandle): {
    __inputHints__?: {
        readonly static_marker: import("@sittir/types").KindEnum<"static", TSKindId.Static>;
        readonly override_modifier?: import("@sittir/types").BooleanKeyword<"override">;
        readonly readonly_marker?: import("@sittir/types").BooleanKeyword<"readonly">;
    };
    $type: TSKindId.PublicFieldDefinitionStaticMods;
    _static_marker: number;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    staticMarker(): number;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    $with: {
        staticMarker: (v: NonNullable<T.PublicFieldDefinitionStaticMods['_static_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (v: NonNullable<T.PublicFieldDefinitionStaticMods['_override_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (v: NonNullable<T.PublicFieldDefinitionStaticMods['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapShorthandPropertyIdentifier(data: T.ShorthandPropertyIdentifier, tree: TreeHandle): T.ShorthandPropertyIdentifier;
export declare function wrapShorthandPropertyIdentifierPattern(data: T.ShorthandPropertyIdentifierPattern, tree: TreeHandle): T.ShorthandPropertyIdentifierPattern;
export declare function wrapStatementIdentifier(data: T.StatementIdentifier, tree: TreeHandle): T.StatementIdentifier;
export declare function wrapTupleTypeMember(data: T.TupleTypeMember, tree: TreeHandle): T.TupleTypeMember;
export declare function wrapTypeQueryCallExpression(data: T.TypeQueryCallExpression, tree: TreeHandle): {
    $type: TSKindId.TypeQueryCallExpression;
    _function: T.Identifier | T.Import | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _arguments: T.Arguments;
    function(): T.Identifier | T.Import | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    arguments(): T.Arguments;
    $with: {
        function: (v: NonNullable<T.TypeQueryCallExpression['_function']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (v: NonNullable<T.TypeQueryCallExpression['_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeQueryCallExpressionInTypeAnnotation(data: T.TypeQueryCallExpressionInTypeAnnotation, tree: TreeHandle): {
    $type: TSKindId.TypeQueryCallExpressionInTypeAnnotation;
    _function: T.Import | T.TypeQueryMemberExpressionInTypeAnnotation;
    _arguments: T.Arguments;
    function(): T.Import | T.TypeQueryMemberExpressionInTypeAnnotation;
    arguments(): T.Arguments;
    $with: {
        function: (v: NonNullable<T.TypeQueryCallExpressionInTypeAnnotation['_function']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (v: NonNullable<T.TypeQueryCallExpressionInTypeAnnotation['_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeQueryInstantiationExpression(data: T.TypeQueryInstantiationExpression, tree: TreeHandle): {
    $type: TSKindId.TypeQueryInstantiationExpression;
    _function: T.Identifier | T.Import | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _type_arguments: T.TypeArguments;
    function(): T.Identifier | T.Import | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    typeArguments(): T.TypeArguments;
    $with: {
        function: (v: NonNullable<T.TypeQueryInstantiationExpression['_function']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (v: NonNullable<T.TypeQueryInstantiationExpression['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeQueryMemberExpression(data: T.TypeQueryMemberExpression, tree: TreeHandle): {
    $type: TSKindId.TypeQueryMemberExpression;
    _object: T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _property: T.Identifier | T.PrivatePropertyIdentifier;
    object(): T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    property(): T.Identifier | T.PrivatePropertyIdentifier;
    $with: {
        object: (v: NonNullable<T.TypeQueryMemberExpression['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        property: (v: NonNullable<T.TypeQueryMemberExpression['_property']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeQueryMemberExpressionInTypeAnnotation(data: T.TypeQueryMemberExpressionInTypeAnnotation, tree: TreeHandle): {
    $type: TSKindId.TypeQueryMemberExpressionInTypeAnnotation;
    _object: T.Import | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation;
    _property: T.Identifier | T.PrivatePropertyIdentifier;
    object(): T.Import | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation;
    property(): T.Identifier | T.PrivatePropertyIdentifier;
    $with: {
        object: (v: NonNullable<T.TypeQueryMemberExpressionInTypeAnnotation['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        property: (v: NonNullable<T.TypeQueryMemberExpressionInTypeAnnotation['_property']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeQuerySubscriptExpression(data: T.TypeQuerySubscriptExpression, tree: TreeHandle): {
    $type: TSKindId.TypeQuerySubscriptExpression;
    _object: T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    _index: T.Number | T.PredefinedType | T.String;
    object(): T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    index(): T.Number | T.PredefinedType | T.String;
    $with: {
        object: (v: NonNullable<T.TypeQuerySubscriptExpression['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        index: (v: NonNullable<T.TypeQuerySubscriptExpression['_index']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapUpdateExpressionPostfix(data: T.UpdateExpressionPostfix, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"++" | "--", TSKindId.PlusPlus | TSKindId.DashDash>;
    };
    $type: TSKindId.UpdateExpressionPostfix;
    _argument: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _operator: number;
    argument(): T.Expression;
    operator(): number;
    $with: {
        argument: (v: NonNullable<T.UpdateExpressionPostfix['_argument']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.UpdateExpressionPostfix['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapUpdateExpressionPrefix(data: T.UpdateExpressionPrefix, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"++" | "--", TSKindId.PlusPlus | TSKindId.DashDash>;
    };
    $type: TSKindId.UpdateExpressionPrefix;
    _operator: number;
    _argument: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    operator(): number;
    argument(): T.Expression;
    $with: {
        operator: (v: NonNullable<T.UpdateExpressionPrefix['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (v: NonNullable<T.UpdateExpressionPrefix['_argument']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAbstractClassDeclaration(data: T.AbstractClassDeclaration, tree: TreeHandle): {
    $type: TSKindId.AbstractClassDeclaration;
    _decorator: readonly T.Decorator[];
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritageUFormExtendsClause | T.ClassHeritageUFormImplementsClause | undefined;
    _body: T.ClassBody;
    decorators(): T.Decorator[];
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
    $with: {
        decorators: (...v: NonNullable<T.AbstractClassDeclaration['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.AbstractClassDeclaration['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.AbstractClassDeclaration['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        classHeritage: (v: NonNullable<T.AbstractClassDeclaration['_class_heritage']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.AbstractClassDeclaration['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAbstractMethodSignature(data: T.AbstractMethodSignature, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier?: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly override_modifier?: import("@sittir/types").BooleanKeyword<"override">;
        readonly accessor_kind?: import("@sittir/types").KindEnum<"*" | "get" | "set", TSKindId.Star2 | TSKindId.Get | TSKindId.Set>;
        readonly optional_marker?: import("@sittir/types").BooleanKeyword<"?">;
    };
    $type: TSKindId.AbstractMethodSignature;
    _accessibility_modifier: number | undefined;
    _override_modifier: true | undefined;
    _accessor_kind: number | undefined;
    _name: T.ComputedPropertyName | T.Identifier | T.Number | T.PrivatePropertyIdentifier | T.ReservedIdentifier | T.String;
    _optional_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    accessibilityModifier(): number | undefined;
    overrideModifier(): true | undefined;
    accessorKind(): number | undefined;
    name(): T.PropertyName;
    optionalMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        accessibilityModifier: (v: NonNullable<T.AbstractMethodSignature['_accessibility_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (v: NonNullable<T.AbstractMethodSignature['_override_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessorKind: (v: NonNullable<T.AbstractMethodSignature['_accessor_kind']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.AbstractMethodSignature['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalMarker: (v: NonNullable<T.AbstractMethodSignature['_optional_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.AbstractMethodSignature['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.AbstractMethodSignature['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.AbstractMethodSignature['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAddingTypeAnnotation(data: T.AddingTypeAnnotation, tree: TreeHandle): {
    $type: TSKindId.AddingTypeAnnotation;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.AddingTypeAnnotation['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAmbientDeclarationDeclaration(data: T.AmbientDeclarationDeclaration, tree: TreeHandle): {
    $type: "ambient_declaration_declaration";
    _declaration: any;
    declaration(): T.Declaration;
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
export declare function wrapAmbientDeclaration(data: T.AmbientDeclaration, tree: TreeHandle): ({
    $variant: 'declaration';
    $type: TSKindId.AmbientDeclaration;
    _ambient_declaration_declaration: any;
    _ambient_declaration_global: any;
    _ambient_declaration_module: any;
    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
    $with: {
        ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (/*elided*/ any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: /*elided*/ any;
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: /*elided*/ any;
                        ambientDeclarationGlobal: /*elided*/ any;
                        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (/*elided*/ any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: /*elided*/ any;
                        ambientDeclarationGlobal: /*elided*/ any;
                        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationGlobal: /*elided*/ any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (/*elided*/ any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: /*elided*/ any;
                        ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        ambientDeclarationModule: /*elided*/ any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: /*elided*/ any;
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'global';
    $type: TSKindId.AmbientDeclaration;
    _ambient_declaration_declaration: any;
    _ambient_declaration_global: any;
    _ambient_declaration_module: any;
    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
    $with: {
        ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: any;
                        ambientDeclarationGlobal: any;
                        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (any | any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: any;
                        ambientDeclarationGlobal: any;
                        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationGlobal: any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (any | any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: any;
                        ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        ambientDeclarationModule: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: any;
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'module';
    $type: TSKindId.AmbientDeclaration;
    _ambient_declaration_declaration: any;
    _ambient_declaration_global: any;
    _ambient_declaration_module: any;
    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
    $with: {
        ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: any;
                        ambientDeclarationGlobal: any;
                        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (any | any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: any;
                        ambientDeclarationGlobal: any;
                        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationGlobal: any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: any;
                ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        ambientDeclarationModule: (v: T.AmbientDeclarationModule) => (any | {
            $variant: 'global';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: (v: T._AmbientDeclarationDeclaration) => (any | any | {
                    $variant: 'module';
                    $type: TSKindId.AmbientDeclaration;
                    _ambient_declaration_declaration: any;
                    _ambient_declaration_global: any;
                    _ambient_declaration_module: any;
                    ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
                    ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
                    ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
                    $with: {
                        ambientDeclarationDeclaration: any;
                        ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        ambientDeclarationModule: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: any;
            };
        } | {
            $variant: 'module';
            $type: TSKindId.AmbientDeclaration;
            _ambient_declaration_declaration: any;
            _ambient_declaration_global: any;
            _ambient_declaration_module: any;
            ambientDeclarationDeclaration(): T._AmbientDeclarationDeclaration | undefined;
            ambientDeclarationGlobal(): T.AmbientDeclarationGlobal | undefined;
            ambientDeclarationModule(): T.AmbientDeclarationModule | undefined;
            $with: {
                ambientDeclarationDeclaration: any;
                ambientDeclarationGlobal: (v: T.AmbientDeclarationGlobal) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                ambientDeclarationModule: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapArguments(data: T.Arguments, tree: TreeHandle): {
    $type: TSKindId.Arguments;
    _expression: readonly any[];
    expressions(): (T.SpreadElement | T.Expression)[];
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
export declare function wrapArray(data: T.Array, tree: TreeHandle): {
    $type: TSKindId.Array;
    _expression: readonly any[];
    expressions(): (T.SpreadElement | T.Expression)[];
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
export declare function wrapArrayPattern(data: T.ArrayPattern, tree: TreeHandle): {
    $type: TSKindId.ArrayPattern;
    _pattern: readonly any[];
    patterns(): (T.AssignmentPattern | T.Pattern)[];
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
export declare function wrapArrayType(data: T.ArrayType, tree: TreeHandle): {
    $type: TSKindId.ArrayType;
    _primary_type: T.ArrayType | T.ConditionalType | T.FlowMaybeType | T.GenericType | T.IndexTypeQuery | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.UnionType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (v: NonNullable<T.ArrayType['_primary_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapArrowFunctionParameter(data: T.ArrowFunctionParameter, tree: TreeHandle): {
    $type: "arrow_function_parameter";
    _parameter: T.ReservedIdentifier;
    parameter(): T.ReservedIdentifier;
    $with: {
        parameter: (v: NonNullable<T.ArrowFunctionParameter['_parameter']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapArrowFunctionUCallSignature(data: T.ArrowFunctionUCallSignature, tree: TreeHandle): {
    $type: "arrow_function__call_signature";
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        typeParameters: (v: NonNullable<T.ArrowFunctionUCallSignature['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.ArrowFunctionUCallSignature['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.ArrowFunctionUCallSignature['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapArrowFunction(data: T.ArrowFunction, tree: TreeHandle): ({
    $variant: 'parameter';
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.ArrowFunction;
    _async_marker: true | undefined;
    _arrow_function_parameter: any;
    _body: any;
    _arrow_function__call_signature: any;
    asyncMarker(): true | undefined;
    arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
    body(): T.StatementBlock | T.Expression;
    arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
    $with: {
        asyncMarker: (v: boolean) => (/*elided*/ any | {
            $variant: '_call_signature';
            __inputHints__?: {
                readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
            };
            $type: TSKindId.ArrowFunction;
            _async_marker: true | undefined;
            _arrow_function_parameter: any;
            _body: any;
            _arrow_function__call_signature: any;
            asyncMarker(): true | undefined;
            arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
            body(): T.StatementBlock | T.Expression;
            arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
            $with: {
                asyncMarker: /*elided*/ any;
                arrowFunctionParameter: (v: T._ArrowFunctionParameter) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                body: (v: T.Expression | T.StatementBlock) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunction_CallSignature: (v: T._ArrowFunctionUCallSignature) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arrowFunctionParameter: (v: T._ArrowFunctionParameter) => (/*elided*/ any | {
            $variant: '_call_signature';
            __inputHints__?: {
                readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
            };
            $type: TSKindId.ArrowFunction;
            _async_marker: true | undefined;
            _arrow_function_parameter: any;
            _body: any;
            _arrow_function__call_signature: any;
            asyncMarker(): true | undefined;
            arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
            body(): T.StatementBlock | T.Expression;
            arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
            $with: {
                asyncMarker: (v: boolean) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunctionParameter: /*elided*/ any;
                body: (v: T.Expression | T.StatementBlock) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunction_CallSignature: (v: T._ArrowFunctionUCallSignature) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: T.Expression | T.StatementBlock) => (/*elided*/ any | {
            $variant: '_call_signature';
            __inputHints__?: {
                readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
            };
            $type: TSKindId.ArrowFunction;
            _async_marker: true | undefined;
            _arrow_function_parameter: any;
            _body: any;
            _arrow_function__call_signature: any;
            asyncMarker(): true | undefined;
            arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
            body(): T.StatementBlock | T.Expression;
            arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
            $with: {
                asyncMarker: (v: boolean) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunctionParameter: (v: T._ArrowFunctionParameter) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                body: /*elided*/ any;
                arrowFunction_CallSignature: (v: T._ArrowFunctionUCallSignature) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arrowFunction_CallSignature: (v: T._ArrowFunctionUCallSignature) => (/*elided*/ any | {
            $variant: '_call_signature';
            __inputHints__?: {
                readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
            };
            $type: TSKindId.ArrowFunction;
            _async_marker: true | undefined;
            _arrow_function_parameter: any;
            _body: any;
            _arrow_function__call_signature: any;
            asyncMarker(): true | undefined;
            arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
            body(): T.StatementBlock | T.Expression;
            arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
            $with: {
                asyncMarker: (v: boolean) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunctionParameter: (v: T._ArrowFunctionParameter) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                body: (v: T.Expression | T.StatementBlock) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunction_CallSignature: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: '_call_signature';
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.ArrowFunction;
    _async_marker: true | undefined;
    _arrow_function_parameter: any;
    _body: any;
    _arrow_function__call_signature: any;
    asyncMarker(): true | undefined;
    arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
    body(): T.StatementBlock | T.Expression;
    arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
    $with: {
        asyncMarker: (v: boolean) => (any | {
            $variant: '_call_signature';
            __inputHints__?: {
                readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
            };
            $type: TSKindId.ArrowFunction;
            _async_marker: true | undefined;
            _arrow_function_parameter: any;
            _body: any;
            _arrow_function__call_signature: any;
            asyncMarker(): true | undefined;
            arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
            body(): T.StatementBlock | T.Expression;
            arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
            $with: {
                asyncMarker: any;
                arrowFunctionParameter: (v: T._ArrowFunctionParameter) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                body: (v: T.Expression | T.StatementBlock) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunction_CallSignature: (v: T._ArrowFunctionUCallSignature) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arrowFunctionParameter: (v: T._ArrowFunctionParameter) => (any | {
            $variant: '_call_signature';
            __inputHints__?: {
                readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
            };
            $type: TSKindId.ArrowFunction;
            _async_marker: true | undefined;
            _arrow_function_parameter: any;
            _body: any;
            _arrow_function__call_signature: any;
            asyncMarker(): true | undefined;
            arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
            body(): T.StatementBlock | T.Expression;
            arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
            $with: {
                asyncMarker: (v: boolean) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunctionParameter: any;
                body: (v: T.Expression | T.StatementBlock) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunction_CallSignature: (v: T._ArrowFunctionUCallSignature) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: T.Expression | T.StatementBlock) => (any | {
            $variant: '_call_signature';
            __inputHints__?: {
                readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
            };
            $type: TSKindId.ArrowFunction;
            _async_marker: true | undefined;
            _arrow_function_parameter: any;
            _body: any;
            _arrow_function__call_signature: any;
            asyncMarker(): true | undefined;
            arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
            body(): T.StatementBlock | T.Expression;
            arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
            $with: {
                asyncMarker: (v: boolean) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunctionParameter: (v: T._ArrowFunctionParameter) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                body: any;
                arrowFunction_CallSignature: (v: T._ArrowFunctionUCallSignature) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arrowFunction_CallSignature: (v: T._ArrowFunctionUCallSignature) => (any | {
            $variant: '_call_signature';
            __inputHints__?: {
                readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
            };
            $type: TSKindId.ArrowFunction;
            _async_marker: true | undefined;
            _arrow_function_parameter: any;
            _body: any;
            _arrow_function__call_signature: any;
            asyncMarker(): true | undefined;
            arrowFunctionParameter(): T._ArrowFunctionParameter | undefined;
            body(): T.StatementBlock | T.Expression;
            arrowFunction_CallSignature(): T._ArrowFunctionUCallSignature | undefined;
            $with: {
                asyncMarker: (v: boolean) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunctionParameter: (v: T._ArrowFunctionParameter) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                body: (v: T.Expression | T.StatementBlock) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                arrowFunction_CallSignature: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAsExpression(data: T.AsExpression, tree: TreeHandle): {
    $type: TSKindId.AsExpression;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _type_annotation: T.ArrayType | T.ConditionalType | T.Const | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    expression(): T.Expression;
    typeAnnotation(): T.Const | T.Type;
    $with: {
        expression: (v: NonNullable<T.AsExpression['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeAnnotation: (v: NonNullable<T.AsExpression['_type_annotation']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAsserts(data: T.Asserts, tree: TreeHandle): {
    $type: TSKindId.Asserts;
    _type_predicate: T.Identifier | T.This | T.TypePredicate;
    typePredicate(): T.Identifier | T.This | T.TypePredicate;
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
export declare function wrapAssertsAnnotation(data: T.AssertsAnnotation, tree: TreeHandle): {
    $type: TSKindId.AssertsAnnotation;
    _asserts: ":" | T.Asserts;
    asserts(): ":" | T.Asserts;
    $with: {
        asserts: (v: NonNullable<T.AssertsAnnotation['_asserts']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAssignmentExpression(data: T.AssignmentExpression, tree: TreeHandle): {
    __inputHints__?: {
        readonly using_marker?: import("@sittir/types").BooleanKeyword<"using">;
    };
    $type: TSKindId.AssignmentExpression;
    _using_marker: true | undefined;
    _left: T.LhsExpression | T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped;
    _right: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    usingMarker(): true | undefined;
    left(): T.LhsExpression | T.ParenthesizedExpression;
    right(): T.Expression;
    $with: {
        usingMarker: (v: NonNullable<T.AssignmentExpression['_using_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        left: (v: NonNullable<T.AssignmentExpression['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.AssignmentExpression['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAssignmentPattern(data: T.AssignmentPattern, tree: TreeHandle): {
    $type: TSKindId.AssignmentPattern;
    _left: T.ArrayPattern | T.Identifier | T.MemberExpression | T.NonNullExpression | T.ObjectPattern | T.RestPattern | T.SubscriptExpression | T.Undefined;
    _right: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    left(): T.Pattern;
    right(): T.Expression;
    $with: {
        left: (v: NonNullable<T.AssignmentPattern['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.AssignmentPattern['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAugmentedAssignmentExpression(data: T.AugmentedAssignmentExpression, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"%=" | "&&=" | "&=" | "**=" | "*=" | "+=" | "-=" | "/=" | "<<=" | ">>=" | ">>>=" | "??=" | "^=" | "|=" | "||=", TSKindId.PlusEq | TSKindId.DashEq | TSKindId.StarEq | TSKindId.SlashEq | TSKindId.PercentEq | TSKindId.CaretEq | TSKindId.AmpEq | TSKindId.PipeEq | TSKindId.GtGtEq | TSKindId.GtGtGtEq | TSKindId.LtLtEq | TSKindId.StarStarEq | TSKindId.AmpAmpEq | TSKindId.PipePipeEq | TSKindId.QmarkQmarkEq>;
    };
    $type: TSKindId.AugmentedAssignmentExpression;
    _left: T.MemberExpression | T.NonNullExpression | T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped | T.ReservedIdentifier | T.SubscriptExpression;
    _operator: number;
    _right: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    left(): T.MemberExpression | T.NonNullExpression | T.ReservedIdentifier | T.SubscriptExpression | T.ParenthesizedExpression;
    operator(): number;
    right(): T.Expression;
    $with: {
        left: (v: NonNullable<T.AugmentedAssignmentExpression['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.AugmentedAssignmentExpression['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.AugmentedAssignmentExpression['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapAwaitExpression(data: T.AwaitExpression, tree: TreeHandle): {
    $type: TSKindId.AwaitExpression;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.AwaitExpression['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapBinaryExpression(data: T.BinaryExpression, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"!=" | "!==" | "%" | "&" | "&&" | "*" | "**" | "+" | "-" | "/" | "<" | "<<" | "<=" | "==" | "===" | ">" | ">=" | ">>" | ">>>" | "??" | "^" | "in" | "instanceof" | "|" | "||", TSKindId.Star2 | TSKindId.In | TSKindId.AmpAmp | TSKindId.PipePipe | TSKindId.GtGt | TSKindId.GtGtGt | TSKindId.LtLt | TSKindId.Amp2 | TSKindId.Caret | TSKindId.Pipe2 | TSKindId.Plus | TSKindId.Dash | TSKindId.Slash2 | TSKindId.Percent | TSKindId.StarStar | TSKindId.Lt2 | TSKindId.LtEq | TSKindId.EqEq | TSKindId.EqEqEq | TSKindId.BangEq | TSKindId.BangEqEq | TSKindId.GtEq | TSKindId.Gt2 | TSKindId.QmarkQmark | TSKindId.Instanceof>;
    };
    $type: TSKindId.BinaryExpression;
    _left: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.PrivatePropertyIdentifier | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _operator: number;
    _right: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    left(): T.PrivatePropertyIdentifier | T.Expression;
    operator(): number;
    right(): T.Expression;
    $with: {
        left: (v: NonNullable<T.BinaryExpression['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.BinaryExpression['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.BinaryExpression['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapBreakStatement(data: T.BreakStatement, tree: TreeHandle): {
    $type: TSKindId.BreakStatement;
    _label: T.Identifier | undefined;
    _semicolon: T.AutomaticSemicolon;
    label(): T.Identifier | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        label: (v: NonNullable<T.BreakStatement['_label']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.BreakStatement['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapCallExpression(data: T.CallExpression, tree: TreeHandle): ({
    $variant: 'call';
    $type: TSKindId.CallExpression;
    _call_expression_call: any;
    _call_expression_template_call: any;
    _call_expression_member: any;
    callExpressionCall(): T.CallExpressionCall | undefined;
    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
    callExpressionMember(): T.CallExpressionMember | undefined;
    $with: {
        callExpressionCall: (v: T.CallExpressionCall) => (/*elided*/ any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: /*elided*/ any;
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: /*elided*/ any;
                        callExpressionTemplateCall: /*elided*/ any;
                        callExpressionMember: (v: T.CallExpressionMember) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (/*elided*/ any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: (v: T.CallExpressionCall) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: /*elided*/ any;
                        callExpressionTemplateCall: /*elided*/ any;
                        callExpressionMember: (v: T.CallExpressionMember) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionTemplateCall: /*elided*/ any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        callExpressionMember: (v: T.CallExpressionMember) => (/*elided*/ any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: (v: T.CallExpressionCall) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: /*elided*/ any;
                        callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        callExpressionMember: /*elided*/ any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: /*elided*/ any;
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'member';
    $type: TSKindId.CallExpression;
    _call_expression_call: any;
    _call_expression_template_call: any;
    _call_expression_member: any;
    callExpressionCall(): T.CallExpressionCall | undefined;
    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
    callExpressionMember(): T.CallExpressionMember | undefined;
    $with: {
        callExpressionCall: (v: T.CallExpressionCall) => (any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: any;
                        callExpressionTemplateCall: any;
                        callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: (v: T.CallExpressionCall) => (any | any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: any;
                        callExpressionTemplateCall: any;
                        callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionTemplateCall: any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        callExpressionMember: (v: T.CallExpressionMember) => (any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: (v: T.CallExpressionCall) => (any | any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: any;
                        callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        callExpressionMember: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: any;
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'template_call';
    $type: TSKindId.CallExpression;
    _call_expression_call: any;
    _call_expression_template_call: any;
    _call_expression_member: any;
    callExpressionCall(): T.CallExpressionCall | undefined;
    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
    callExpressionMember(): T.CallExpressionMember | undefined;
    $with: {
        callExpressionCall: (v: T.CallExpressionCall) => (any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: any;
                        callExpressionTemplateCall: any;
                        callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: (v: T.CallExpressionCall) => (any | any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: any;
                        callExpressionTemplateCall: any;
                        callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionTemplateCall: any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: any;
                callExpressionMember: (v: T.CallExpressionMember) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        callExpressionMember: (v: T.CallExpressionMember) => (any | {
            $variant: 'member';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: (v: T.CallExpressionCall) => (any | any | {
                    $variant: 'template_call';
                    $type: TSKindId.CallExpression;
                    _call_expression_call: any;
                    _call_expression_template_call: any;
                    _call_expression_member: any;
                    callExpressionCall(): T.CallExpressionCall | undefined;
                    callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
                    callExpressionMember(): T.CallExpressionMember | undefined;
                    $with: {
                        callExpressionCall: any;
                        callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        callExpressionMember: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: any;
            };
        } | {
            $variant: 'template_call';
            $type: TSKindId.CallExpression;
            _call_expression_call: any;
            _call_expression_template_call: any;
            _call_expression_member: any;
            callExpressionCall(): T.CallExpressionCall | undefined;
            callExpressionTemplateCall(): T.CallExpressionTemplateCall | undefined;
            callExpressionMember(): T.CallExpressionMember | undefined;
            $with: {
                callExpressionCall: any;
                callExpressionTemplateCall: (v: T.CallExpressionTemplateCall) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                callExpressionMember: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapCallSignature(data: T.CallSignature, tree: TreeHandle): {
    $type: TSKindId.CallSignature;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        typeParameters: (v: NonNullable<T.CallSignature['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.CallSignature['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.CallSignature['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapCatchClause(data: T.CatchClause, tree: TreeHandle): {
    $type: TSKindId.CatchClause;
    _parameter: T.ArrayPattern | T.Identifier | T.ObjectPattern | undefined;
    _type: T.TypeAnnotation | undefined;
    _body: T.StatementBlock;
    parameter(): T.Identifier | T.DestructuringPattern | undefined;
    type(): T.TypeAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        parameter: (v: NonNullable<T.CatchClause['_parameter']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.CatchClause['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.CatchClause['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapClass(data: T.Class, tree: TreeHandle): {
    $type: TSKindId.Class;
    _decorator: readonly T.Decorator[];
    _name: T.TypeIdentifier | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritageUFormExtendsClause | T.ClassHeritageUFormImplementsClause | undefined;
    _body: T.ClassBody;
    decorators(): T.Decorator[];
    name(): T.TypeIdentifier | undefined;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
    $with: {
        decorators: (...v: NonNullable<T.Class['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.Class['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.Class['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        classHeritage: (v: NonNullable<T.Class['_class_heritage']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.Class['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapClassBody(data: T.ClassBody, tree: TreeHandle): {
    $type: TSKindId.ClassBody;
    _class_body_method: readonly any[];
    classBodyMethods(): (";" | T.ClassBodyMember | T.ClassBodyMethod | T.ClassBodyMethodSig | T.ClassStaticBlock)[];
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
export declare function wrapClassDeclaration(data: T.ClassDeclaration, tree: TreeHandle): {
    $type: TSKindId.ClassDeclaration;
    _decorator: readonly T.Decorator[];
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _class_heritage: T.ClassHeritageUFormExtendsClause | T.ClassHeritageUFormImplementsClause | undefined;
    _body: T.ClassBody;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    decorators(): T.Decorator[];
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    classHeritage(): T.ClassHeritage | undefined;
    body(): T.ClassBody;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        decorators: (...v: NonNullable<T.ClassDeclaration['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.ClassDeclaration['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.ClassDeclaration['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        classHeritage: (v: NonNullable<T.ClassDeclaration['_class_heritage']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.ClassDeclaration['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        automaticSemicolon: (v: NonNullable<T.ClassDeclaration['_automatic_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapClassHeritageExtendsClause(data: T.ClassHeritageExtendsClause, tree: TreeHandle): {
    $type: "class_heritage_extends_clause";
    _extends_clause: T.ExtendsClause;
    _implements_clause: T.ImplementsClause | undefined;
    extendsClause(): T.ExtendsClause;
    implementsClause(): T.ImplementsClause | undefined;
    $with: {
        extendsClause: (v: NonNullable<T.ClassHeritageExtendsClause['_extends_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        implementsClause: (v: NonNullable<T.ClassHeritageExtendsClause['_implements_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapClassHeritageImplementsClause(data: T.ClassHeritageImplementsClause, tree: TreeHandle): {
    $type: "class_heritage_implements_clause";
    _implements_clause: T.ImplementsClause;
    implementsClause(): T.ImplementsClause;
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
export declare function wrapClassHeritage(data: T.ClassHeritage, tree: TreeHandle): ({
    $variant: 'extends_clause';
    $type: TSKindId.ClassHeritage;
    _class_heritage_extends_clause: any;
    _class_heritage_implements_clause: any;
    classHeritageExtendsClause(): T._ClassHeritageExtendsClause | undefined;
    classHeritageImplementsClause(): T._ClassHeritageImplementsClause | undefined;
    $with: {
        classHeritageExtendsClause: (v: T._ClassHeritageExtendsClause) => (/*elided*/ any | {
            $variant: 'implements_clause';
            $type: TSKindId.ClassHeritage;
            _class_heritage_extends_clause: any;
            _class_heritage_implements_clause: any;
            classHeritageExtendsClause(): T._ClassHeritageExtendsClause | undefined;
            classHeritageImplementsClause(): T._ClassHeritageImplementsClause | undefined;
            $with: {
                classHeritageExtendsClause: /*elided*/ any;
                classHeritageImplementsClause: (v: T._ClassHeritageImplementsClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        classHeritageImplementsClause: (v: T._ClassHeritageImplementsClause) => (/*elided*/ any | {
            $variant: 'implements_clause';
            $type: TSKindId.ClassHeritage;
            _class_heritage_extends_clause: any;
            _class_heritage_implements_clause: any;
            classHeritageExtendsClause(): T._ClassHeritageExtendsClause | undefined;
            classHeritageImplementsClause(): T._ClassHeritageImplementsClause | undefined;
            $with: {
                classHeritageExtendsClause: (v: T._ClassHeritageExtendsClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                classHeritageImplementsClause: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'implements_clause';
    $type: TSKindId.ClassHeritage;
    _class_heritage_extends_clause: any;
    _class_heritage_implements_clause: any;
    classHeritageExtendsClause(): T._ClassHeritageExtendsClause | undefined;
    classHeritageImplementsClause(): T._ClassHeritageImplementsClause | undefined;
    $with: {
        classHeritageExtendsClause: (v: T._ClassHeritageExtendsClause) => (any | {
            $variant: 'implements_clause';
            $type: TSKindId.ClassHeritage;
            _class_heritage_extends_clause: any;
            _class_heritage_implements_clause: any;
            classHeritageExtendsClause(): T._ClassHeritageExtendsClause | undefined;
            classHeritageImplementsClause(): T._ClassHeritageImplementsClause | undefined;
            $with: {
                classHeritageExtendsClause: any;
                classHeritageImplementsClause: (v: T._ClassHeritageImplementsClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        classHeritageImplementsClause: (v: T._ClassHeritageImplementsClause) => (any | {
            $variant: 'implements_clause';
            $type: TSKindId.ClassHeritage;
            _class_heritage_extends_clause: any;
            _class_heritage_implements_clause: any;
            classHeritageExtendsClause(): T._ClassHeritageExtendsClause | undefined;
            classHeritageImplementsClause(): T._ClassHeritageImplementsClause | undefined;
            $with: {
                classHeritageExtendsClause: (v: T._ClassHeritageExtendsClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                classHeritageImplementsClause: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapClassStaticBlock(data: T.ClassStaticBlock, tree: TreeHandle): {
    $type: TSKindId.ClassStaticBlock;
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    _body: T.StatementBlock;
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    body(): T.StatementBlock;
    $with: {
        automaticSemicolon: (v: NonNullable<T.ClassStaticBlock['_automatic_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.ClassStaticBlock['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapComputedPropertyName(data: T.ComputedPropertyName, tree: TreeHandle): {
    $type: TSKindId.ComputedPropertyName;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.ComputedPropertyName['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapConditionalType(data: T.ConditionalType, tree: TreeHandle): {
    $type: TSKindId.ConditionalType;
    _left: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    _right: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    _consequence: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    _alternative: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    left(): T.Type;
    right(): T.Type;
    consequence(): T.Type;
    alternative(): T.Type;
    $with: {
        left: (v: NonNullable<T.ConditionalType['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.ConditionalType['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        consequence: (v: NonNullable<T.ConditionalType['_consequence']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternative: (v: NonNullable<T.ConditionalType['_alternative']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapConstraint(data: T.Constraint, tree: TreeHandle): {
    $type: TSKindId.Constraint;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.Constraint['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapConstructSignature(data: T.ConstructSignature, tree: TreeHandle): {
    __inputHints__?: {
        readonly abstract_marker?: import("@sittir/types").BooleanKeyword<"abstract">;
    };
    $type: TSKindId.ConstructSignature;
    _abstract_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _type: T.TypeAnnotation | undefined;
    abstractMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    type(): T.TypeAnnotation | undefined;
    $with: {
        abstractMarker: (v: NonNullable<T.ConstructSignature['_abstract_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.ConstructSignature['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.ConstructSignature['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.ConstructSignature['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapConstructorType(data: T.ConstructorType, tree: TreeHandle): {
    __inputHints__?: {
        readonly abstract_marker?: import("@sittir/types").BooleanKeyword<"abstract">;
    };
    $type: TSKindId.ConstructorType;
    _abstract_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    abstractMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    type(): T.Type;
    $with: {
        abstractMarker: (v: NonNullable<T.ConstructorType['_abstract_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.ConstructorType['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.ConstructorType['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.ConstructorType['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapContinueStatement(data: T.ContinueStatement, tree: TreeHandle): {
    $type: TSKindId.ContinueStatement;
    _label: T.Identifier | undefined;
    _semicolon: T.AutomaticSemicolon;
    label(): T.Identifier | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        label: (v: NonNullable<T.ContinueStatement['_label']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ContinueStatement['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapDebuggerStatement(data: T.DebuggerStatement, tree: TreeHandle): {
    $type: TSKindId.DebuggerStatement;
    _semicolon: T.AutomaticSemicolon;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        semicolon: (v: NonNullable<T.DebuggerStatement['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapDeclaration(data: T.Declaration, tree: TreeHandle): T.Declaration;
export declare function wrapDecorator(data: T.Decorator, tree: TreeHandle): {
    $type: TSKindId.Decorator;
    _identifier: T.DecoratorCallExpression | T.DecoratorMemberExpression | T.DecoratorParenthesizedExpression | T.Identifier;
    identifier(): T.DecoratorCallExpression | T.DecoratorMemberExpression | T.DecoratorParenthesizedExpression | T.Identifier;
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
export declare function wrapDecoratorCallExpression(data: T.DecoratorCallExpression, tree: TreeHandle): {
    $type: TSKindId.DecoratorCallExpression;
    _function: T.DecoratorMemberExpression | T.Identifier;
    _type_arguments: T.TypeArguments | undefined;
    _arguments: T.Arguments;
    function(): T.DecoratorMemberExpression | T.Identifier;
    typeArguments(): T.TypeArguments | undefined;
    arguments(): T.Arguments;
    $with: {
        function: (v: NonNullable<T.DecoratorCallExpression['_function']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (v: NonNullable<T.DecoratorCallExpression['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (v: NonNullable<T.DecoratorCallExpression['_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapDecoratorMemberExpression(data: T.DecoratorMemberExpression, tree: TreeHandle): {
    $type: TSKindId.DecoratorMemberExpression;
    _object: T.DecoratorMemberExpression | T.Identifier;
    _property: T.Identifier;
    object(): T.DecoratorMemberExpression | T.Identifier;
    property(): T.Identifier;
    $with: {
        object: (v: NonNullable<T.DecoratorMemberExpression['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        property: (v: NonNullable<T.DecoratorMemberExpression['_property']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapDecoratorParenthesizedExpression(data: T.DecoratorParenthesizedExpression, tree: TreeHandle): {
    $type: TSKindId.DecoratorParenthesizedExpression;
    _identifier: T.DecoratorCallExpression | T.DecoratorMemberExpression | T.Identifier;
    identifier(): T.DecoratorCallExpression | T.DecoratorMemberExpression | T.Identifier;
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
export declare function wrapDefaultType(data: T.DefaultType, tree: TreeHandle): {
    $type: TSKindId.DefaultType;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.DefaultType['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapDoStatement(data: T.DoStatement, tree: TreeHandle): {
    $type: TSKindId.DoStatement;
    _body: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.BreakStatement | T.ClassDeclaration | T.ContinueStatement | T.DebuggerStatement | T.DoStatement | T.EnumDeclaration | T.ExportStatementUFormDefault | T.ExportStatementUFormEqualsExport | T.ExportStatementUFormNamespaceExport | T.ExportStatementUFormTypeExport | T.ExpressionStatement | T.ForInStatement | T.ForStatement | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.IfStatement | T.ImportAlias | T.ImportStatement | T.InterfaceDeclaration | T.InternalModule | T.LabeledStatement | T.LexicalDeclaration | T.Module | T.ReturnStatement | T.StatementBlock | T.SwitchStatement | T.ThrowStatement | T.TryStatement | T.TypeAliasDeclaration | T.VariableDeclaration | T.WhileStatement | T.WithStatement;
    _condition: T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped;
    _semicolon: T.AutomaticSemicolon | undefined;
    body(): T.Statement;
    condition(): T.ParenthesizedExpression;
    semicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        body: (v: NonNullable<T.DoStatement['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        condition: (v: NonNullable<T.DoStatement['_condition']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.DoStatement['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _statement: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.BreakStatement | T.ClassDeclaration | T.ContinueStatement | T.DebuggerStatement | T.DoStatement | T.EnumDeclaration | T.ExportStatementUFormDefault | T.ExportStatementUFormEqualsExport | T.ExportStatementUFormNamespaceExport | T.ExportStatementUFormTypeExport | T.ExpressionStatement | T.ForInStatement | T.ForStatement | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.IfStatement | T.ImportAlias | T.ImportStatement | T.InterfaceDeclaration | T.InternalModule | T.LabeledStatement | T.LexicalDeclaration | T.Module | T.ReturnStatement | T.StatementBlock | T.SwitchStatement | T.ThrowStatement | T.TryStatement | T.TypeAliasDeclaration | T.VariableDeclaration | T.WhileStatement | T.WithStatement;
    statement(): T.Statement;
    $with: {
        statement: (v: NonNullable<T.ElseClause['_statement']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapEnumAssignment(data: T.EnumAssignment, tree: TreeHandle): {
    $type: TSKindId.EnumAssignment;
    _name: T.ComputedPropertyName | T.Identifier | T.Number | T.PrivatePropertyIdentifier | T.ReservedIdentifier | T.String;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    name(): T.PropertyName;
    value(): T.Expression;
    $with: {
        name: (v: NonNullable<T.EnumAssignment['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.EnumAssignment['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapEnumBody(data: T.EnumBody, tree: TreeHandle): {
    $type: TSKindId.EnumBody;
    _name: readonly T.PropertyName[];
    _enum_assignment: readonly T.EnumAssignment[];
    names(): T.PropertyName[];
    enumAssignments(): T.EnumAssignment[];
    $with: {
        names: (...v: NonNullable<T.EnumBody['_name']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        enumAssignments: (...v: NonNullable<T.EnumBody['_enum_assignment']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapEnumDeclaration(data: T.EnumDeclaration, tree: TreeHandle): {
    __inputHints__?: {
        readonly const_marker?: import("@sittir/types").BooleanKeyword<"const">;
    };
    $type: TSKindId.EnumDeclaration;
    _const_marker: true | undefined;
    _name: T.Identifier;
    _body: T.EnumBody;
    constMarker(): true | undefined;
    name(): T.Identifier;
    body(): T.EnumBody;
    $with: {
        constMarker: (v: NonNullable<T.EnumDeclaration['_const_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.EnumDeclaration['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.EnumDeclaration['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportClause(data: T.ExportClause, tree: TreeHandle): {
    $type: TSKindId.ExportClause;
    _export_specifier: readonly T.ExportSpecifier[];
    exportSpecifiers(): T.ExportSpecifier[];
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
export declare function wrapExportSpecifier(data: T.ExportSpecifier, tree: TreeHandle): {
    __inputHints__?: {
        readonly export_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Typeof | TSKindId.Type>;
    };
    $type: TSKindId.ExportSpecifier;
    _export_kind: number | undefined;
    _name: T.Identifier | T.String;
    _alias: T.Identifier | T.String | undefined;
    exportKind(): number | undefined;
    name(): T.ModuleExportName;
    alias(): T.ModuleExportName | undefined;
    $with: {
        exportKind: (v: NonNullable<T.ExportSpecifier['_export_kind']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.ExportSpecifier['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (v: NonNullable<T.ExportSpecifier['_alias']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementTypeExport(data: T.ExportStatementTypeExport, tree: TreeHandle): {
    $type: "export_statement_type_export";
    _export_clause: T.ExportClause;
    _source: T.String | undefined;
    _semicolon: any;
    exportClause(): T.ExportClause;
    source(): T.String | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        exportClause: (v: NonNullable<T.ExportStatementTypeExport['_export_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        source: (v: NonNullable<T.ExportStatementTypeExport['_source']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ExportStatementTypeExport['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementEqualsExport(data: T.ExportStatementEqualsExport, tree: TreeHandle): {
    $type: "export_statement_equals_export";
    _expression: any;
    _semicolon: any;
    expression(): T.Expression;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        expression: (v: NonNullable<T.ExportStatementEqualsExport['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ExportStatementEqualsExport['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatementNamespaceExport(data: T.ExportStatementNamespaceExport, tree: TreeHandle): {
    $type: "export_statement_namespace_export";
    _identifier: T.Identifier;
    _semicolon: any;
    identifier(): T.Identifier;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        identifier: (v: NonNullable<T.ExportStatementNamespaceExport['_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ExportStatementNamespaceExport['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExportStatement(data: T.ExportStatement, tree: TreeHandle): ({
    $variant: 'default';
    $type: TSKindId.ExportStatement;
    _export_statement_default: any;
    _export_statement_type_export: any;
    _export_statement_equals_export: any;
    _export_statement_namespace_export: any;
    exportStatementDefault(): T.ExportStatementDefault | undefined;
    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
    $with: {
        exportStatementDefault: (v: T.ExportStatementDefault) => (/*elided*/ any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: /*elided*/ any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: /*elided*/ any;
                        exportStatementTypeExport: /*elided*/ any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: /*elided*/ any;
                                exportStatementTypeExport: /*elided*/ any;
                                exportStatementEqualsExport: /*elided*/ any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (/*elided*/ any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: /*elided*/ any;
                        exportStatementTypeExport: /*elided*/ any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: /*elided*/ any;
                                exportStatementTypeExport: /*elided*/ any;
                                exportStatementEqualsExport: /*elided*/ any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: /*elided*/ any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (/*elided*/ any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: /*elided*/ any;
                        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: /*elided*/ any;
                                exportStatementTypeExport: /*elided*/ any;
                                exportStatementEqualsExport: /*elided*/ any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementEqualsExport: /*elided*/ any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: /*elided*/ any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (/*elided*/ any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: /*elided*/ any;
                        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: /*elided*/ any;
                                exportStatementTypeExport: /*elided*/ any;
                                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                                exportStatementNamespaceExport: /*elided*/ any;
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: /*elided*/ any;
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: /*elided*/ any;
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'equals_export';
    $type: TSKindId.ExportStatement;
    _export_statement_default: any;
    _export_statement_type_export: any;
    _export_statement_equals_export: any;
    _export_statement_namespace_export: any;
    exportStatementDefault(): T.ExportStatementDefault | undefined;
    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
    $with: {
        exportStatementDefault: (v: T.ExportStatementDefault) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                                exportStatementNamespaceExport: any;
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'namespace_export';
    $type: TSKindId.ExportStatement;
    _export_statement_default: any;
    _export_statement_type_export: any;
    _export_statement_equals_export: any;
    _export_statement_namespace_export: any;
    exportStatementDefault(): T.ExportStatementDefault | undefined;
    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
    $with: {
        exportStatementDefault: (v: T.ExportStatementDefault) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                                exportStatementNamespaceExport: any;
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'type_export';
    $type: TSKindId.ExportStatement;
    _export_statement_default: any;
    _export_statement_type_export: any;
    _export_statement_equals_export: any;
    _export_statement_namespace_export: any;
    exportStatementDefault(): T.ExportStatementDefault | undefined;
    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
    $with: {
        exportStatementDefault: (v: T.ExportStatementDefault) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: any;
                                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: any;
                        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: any;
                exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        exportStatementNamespaceExport: (v: T._ExportStatementNamespaceExport) => (any | {
            $variant: 'equals_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: (v: T.ExportStatementDefault) => (any | any | {
                    $variant: 'namespace_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                            $variant: 'type_export';
                            $type: TSKindId.ExportStatement;
                            _export_statement_default: any;
                            _export_statement_type_export: any;
                            _export_statement_equals_export: any;
                            _export_statement_namespace_export: any;
                            exportStatementDefault(): T.ExportStatementDefault | undefined;
                            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                            $with: {
                                exportStatementDefault: any;
                                exportStatementTypeExport: any;
                                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                                    $render(): string;
                                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                                    $replace(target: {
                                        range(): import("@sittir/types").ByteRange;
                                    }): import("@sittir/types").Edit;
                                    $trivia(...args: (T.Comment | {
                                        leading?: (T.Comment)[];
                                        trailing?: (T.Comment)[];
                                    })[]): AnyNodeData;
                                };
                                exportStatementNamespaceExport: any;
                            };
                        }) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                } | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        } | {
            $variant: 'namespace_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: (v: T._ExportStatementTypeExport) => (any | any | any | {
                    $variant: 'type_export';
                    $type: TSKindId.ExportStatement;
                    _export_statement_default: any;
                    _export_statement_type_export: any;
                    _export_statement_equals_export: any;
                    _export_statement_namespace_export: any;
                    exportStatementDefault(): T.ExportStatementDefault | undefined;
                    exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
                    exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
                    exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
                    $with: {
                        exportStatementDefault: any;
                        exportStatementTypeExport: any;
                        exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        exportStatementNamespaceExport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        } | {
            $variant: 'type_export';
            $type: TSKindId.ExportStatement;
            _export_statement_default: any;
            _export_statement_type_export: any;
            _export_statement_equals_export: any;
            _export_statement_namespace_export: any;
            exportStatementDefault(): T.ExportStatementDefault | undefined;
            exportStatementTypeExport(): T._ExportStatementTypeExport | undefined;
            exportStatementEqualsExport(): T._ExportStatementEqualsExport | undefined;
            exportStatementNamespaceExport(): T._ExportStatementNamespaceExport | undefined;
            $with: {
                exportStatementDefault: any;
                exportStatementTypeExport: any;
                exportStatementEqualsExport: (v: T._ExportStatementEqualsExport) => (any | any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                exportStatementNamespaceExport: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
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
export declare function wrapExpressionStatement(data: T.ExpressionStatement, tree: TreeHandle): {
    $type: TSKindId.ExpressionStatement;
    _expressions: any;
    _semicolon: T.AutomaticSemicolon;
    expressions(): T.SequenceExpression;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        expressions: (v: NonNullable<T.ExpressionStatement['_expressions']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ExpressionStatement['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExtendsClause(data: T.ExtendsClause, tree: TreeHandle): {
    $type: TSKindId.ExtendsClause;
    _value: readonly T.Expression[];
    _type_arguments: T.TypeArguments | undefined;
    values(): T.Expression[];
    typeArguments(): T.TypeArguments | undefined;
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
        typeArguments: (v: NonNullable<T.ExtendsClause['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapExtendsTypeClause(data: T.ExtendsTypeClause, tree: TreeHandle): {
    $type: TSKindId.ExtendsTypeClause;
    _type: readonly (T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[];
    types(): (T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[];
    $with: {
        types: (v_0: T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier, ...v: (T.GenericType | T.NestedTypeIdentifier | T.TypeIdentifier)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _body: T.StatementBlock;
    body(): T.StatementBlock;
    $with: {
        body: (v: NonNullable<T.FinallyClause['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapFlowMaybeType(data: T.FlowMaybeType, tree: TreeHandle): {
    $type: TSKindId.FlowMaybeType;
    _primary_type: T.ArrayType | T.ConditionalType | T.FlowMaybeType | T.GenericType | T.IndexTypeQuery | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.UnionType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (v: NonNullable<T.FlowMaybeType['_primary_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapForInStatement(data: T.ForInStatement, tree: TreeHandle): {
    __inputHints__?: {
        readonly await_marker?: import("@sittir/types").BooleanKeyword<"await">;
        readonly operator: import("@sittir/types").KindEnum<"in" | "of", TSKindId.In | TSKindId.Of>;
    };
    $type: TSKindId.ForInStatement;
    _await_marker: true | undefined;
    _for_header_lhs: T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind;
    _operator: number;
    _right: T.SequenceExpression;
    _body: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.BreakStatement | T.ClassDeclaration | T.ContinueStatement | T.DebuggerStatement | T.DoStatement | T.EnumDeclaration | T.ExportStatementUFormDefault | T.ExportStatementUFormEqualsExport | T.ExportStatementUFormNamespaceExport | T.ExportStatementUFormTypeExport | T.ExpressionStatement | T.ForInStatement | T.ForStatement | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.IfStatement | T.ImportAlias | T.ImportStatement | T.InterfaceDeclaration | T.InternalModule | T.LabeledStatement | T.LexicalDeclaration | T.Module | T.ReturnStatement | T.StatementBlock | T.SwitchStatement | T.ThrowStatement | T.TryStatement | T.TypeAliasDeclaration | T.VariableDeclaration | T.WhileStatement | T.WithStatement;
    awaitMarker(): true | undefined;
    forHeaderLhs(): T.ForHeaderLetConstKind | T.ForHeaderLhs | T.ForHeaderVarKind;
    operator(): number;
    right(): T.SequenceExpression;
    body(): T.Statement;
    $with: {
        awaitMarker: (v: NonNullable<T.ForInStatement['_await_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        forHeaderLhs: (v: NonNullable<T.ForInStatement['_for_header_lhs']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        operator: (v: NonNullable<T.ForInStatement['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.ForInStatement['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.ForInStatement['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    $type: TSKindId.ForStatement;
    _initializer: ";" | T.LexicalDeclaration | T.SequenceExpression | T.VariableDeclaration;
    _condition: T.EmptyStatement | T.SequenceExpression;
    _increment: T.SequenceExpression | undefined;
    _body: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.BreakStatement | T.ClassDeclaration | T.ContinueStatement | T.DebuggerStatement | T.DoStatement | T.EnumDeclaration | T.ExportStatementUFormDefault | T.ExportStatementUFormEqualsExport | T.ExportStatementUFormNamespaceExport | T.ExportStatementUFormTypeExport | T.ExpressionStatement | T.ForInStatement | T.ForStatement | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.IfStatement | T.ImportAlias | T.ImportStatement | T.InterfaceDeclaration | T.InternalModule | T.LabeledStatement | T.LexicalDeclaration | T.Module | T.ReturnStatement | T.StatementBlock | T.SwitchStatement | T.ThrowStatement | T.TryStatement | T.TypeAliasDeclaration | T.VariableDeclaration | T.WhileStatement | T.WithStatement;
    initializer(): ";" | T.LexicalDeclaration | T.SequenceExpression | T.VariableDeclaration;
    condition(): T.EmptyStatement | T.SequenceExpression;
    increment(): T.SequenceExpression | undefined;
    body(): T.Statement;
    $with: {
        initializer: (v: NonNullable<T.ForStatement['_initializer']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        condition: (v: NonNullable<T.ForStatement['_condition']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        increment: (v: NonNullable<T.ForStatement['_increment']>) => /*elided*/ any & {
            $render(): string;
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
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapFormalParameters(data: T.FormalParameters, tree: TreeHandle): {
    $type: TSKindId.FormalParameters;
    _formal_parameter: readonly any[];
    formalParameters(): T.FormalParameter[];
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
export declare function wrapFunctionDeclaration(data: T.FunctionDeclaration, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.FunctionDeclaration;
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
        asyncMarker: (v: NonNullable<T.FunctionDeclaration['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.FunctionDeclaration['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.FunctionDeclaration['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.FunctionDeclaration['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.FunctionDeclaration['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.FunctionDeclaration['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        automaticSemicolon: (v: NonNullable<T.FunctionDeclaration['_automatic_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapFunctionExpression(data: T.FunctionExpression, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.FunctionExpression;
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
        asyncMarker: (v: NonNullable<T.FunctionExpression['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.FunctionExpression['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.FunctionExpression['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.FunctionExpression['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.FunctionExpression['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.FunctionExpression['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapFunctionSignature(data: T.FunctionSignature, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.FunctionSignature;
    _async_marker: true | undefined;
    _name: T.Identifier;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _semicolon: any;
    asyncMarker(): true | undefined;
    name(): T.Identifier;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    semicolon(): T.AutomaticSemicolon | T.FunctionSignatureAutomaticSemicolon;
    $with: {
        asyncMarker: (v: NonNullable<T.FunctionSignature['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.FunctionSignature['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.FunctionSignature['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.FunctionSignature['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.FunctionSignature['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.FunctionSignature['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapFunctionType(data: T.FunctionType, tree: TreeHandle): {
    $type: TSKindId.FunctionType;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.ArrayType | T.Asserts | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypePredicate | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.Asserts | T.TypePredicate | T.Type;
    $with: {
        typeParameters: (v: NonNullable<T.FunctionType['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.FunctionType['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.FunctionType['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapGeneratorFunction(data: T.GeneratorFunction, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.GeneratorFunction;
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
        asyncMarker: (v: NonNullable<T.GeneratorFunction['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.GeneratorFunction['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.GeneratorFunction['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.GeneratorFunction['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.GeneratorFunction['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.GeneratorFunction['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapGeneratorFunctionDeclaration(data: T.GeneratorFunctionDeclaration, tree: TreeHandle): {
    __inputHints__?: {
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
    };
    $type: TSKindId.GeneratorFunctionDeclaration;
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
        asyncMarker: (v: NonNullable<T.GeneratorFunctionDeclaration['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.GeneratorFunctionDeclaration['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.GeneratorFunctionDeclaration['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.GeneratorFunctionDeclaration['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.GeneratorFunctionDeclaration['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.GeneratorFunctionDeclaration['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        automaticSemicolon: (v: NonNullable<T.GeneratorFunctionDeclaration['_automatic_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _name: T.NestedTypeIdentifier | T.TypeIdentifier;
    _type_arguments: T.TypeArguments;
    name(): T.NestedTypeIdentifier | T.TypeIdentifier;
    typeArguments(): T.TypeArguments;
    $with: {
        name: (v: NonNullable<T.GenericType['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (v: NonNullable<T.GenericType['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _condition: T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped;
    _consequence: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.BreakStatement | T.ClassDeclaration | T.ContinueStatement | T.DebuggerStatement | T.DoStatement | T.EnumDeclaration | T.ExportStatementUFormDefault | T.ExportStatementUFormEqualsExport | T.ExportStatementUFormNamespaceExport | T.ExportStatementUFormTypeExport | T.ExpressionStatement | T.ForInStatement | T.ForStatement | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.IfStatement | T.ImportAlias | T.ImportStatement | T.InterfaceDeclaration | T.InternalModule | T.LabeledStatement | T.LexicalDeclaration | T.Module | T.ReturnStatement | T.StatementBlock | T.SwitchStatement | T.ThrowStatement | T.TryStatement | T.TypeAliasDeclaration | T.VariableDeclaration | T.WhileStatement | T.WithStatement;
    _alternative: T.ElseClause | undefined;
    condition(): T.ParenthesizedExpression;
    consequence(): T.Statement;
    alternative(): T.ElseClause | undefined;
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
        alternative: (v: NonNullable<T.IfStatement['_alternative']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapImplementsClause(data: T.ImplementsClause, tree: TreeHandle): {
    $type: TSKindId.ImplementsClause;
    _type: readonly any[];
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
export declare function wrapImportAlias(data: T.ImportAlias, tree: TreeHandle): {
    $type: TSKindId.ImportAlias;
    _name: T.Identifier;
    _value: T.Identifier | T.NestedIdentifier;
    _semicolon: T.AutomaticSemicolon;
    name(): T.Identifier;
    value(): T.Identifier | T.NestedIdentifier;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        name: (v: NonNullable<T.ImportAlias['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.ImportAlias['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ImportAlias['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapImportAttribute(data: T.ImportAttribute, tree: TreeHandle): {
    $type: TSKindId.ImportAttribute;
    _object: T.ImportAttributeObject | T.Object;
    object(): T.ImportAttributeObject | T.Object;
    $with: {
        object: (v: NonNullable<T.ImportAttribute['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapImportClauseNamespaceImport(data: T.ImportClauseNamespaceImport, tree: TreeHandle): {
    $type: "import_clause_namespace_import";
    _namespace_import: T.NamespaceImport;
    namespaceImport(): T.NamespaceImport;
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
export declare function wrapImportClauseNamedImports(data: T.ImportClauseNamedImports, tree: TreeHandle): {
    $type: "import_clause_named_imports";
    _named_imports: T.NamedImports;
    namedImports(): T.NamedImports;
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
export declare function wrapImportClauseDefaultImport(data: T.ImportClauseDefaultImport, tree: TreeHandle): {
    $type: "import_clause_default_import";
    _import_identifier: any;
    _namespace_import: any;
    importIdentifier(): T.Identifier;
    namespaceImport(): T.NamedImports | T.NamespaceImport | undefined;
    $with: {
        importIdentifier: (v: NonNullable<T.ImportClauseDefaultImport['_import_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        namespaceImport: (v: NonNullable<T.ImportClauseDefaultImport['_namespace_import']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapImportClause(data: T.ImportClause, tree: TreeHandle): ({
    $variant: 'default_import';
    $type: TSKindId.ImportClause;
    _import_clause_namespace_import: any;
    _import_clause_named_imports: any;
    _import_clause_default_import: any;
    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
    $with: {
        importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (/*elided*/ any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: /*elided*/ any;
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: /*elided*/ any;
                        importClauseNamedImports: /*elided*/ any;
                        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importClauseNamedImports: (v: T._ImportClauseNamedImports) => (/*elided*/ any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: /*elided*/ any;
                        importClauseNamedImports: /*elided*/ any;
                        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseNamedImports: /*elided*/ any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (/*elided*/ any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (/*elided*/ any | /*elided*/ any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: /*elided*/ any;
                        importClauseNamedImports: (v: T._ImportClauseNamedImports) => (/*elided*/ any | /*elided*/ any | /*elided*/ any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        importClauseDefaultImport: /*elided*/ any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: /*elided*/ any;
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'named_imports';
    $type: TSKindId.ImportClause;
    _import_clause_namespace_import: any;
    _import_clause_named_imports: any;
    _import_clause_default_import: any;
    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
    $with: {
        importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: any;
                        importClauseNamedImports: any;
                        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (any | any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: any;
                        importClauseNamedImports: any;
                        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseNamedImports: any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (any | any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: any;
                        importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        importClauseDefaultImport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: any;
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'namespace_import';
    $type: TSKindId.ImportClause;
    _import_clause_namespace_import: any;
    _import_clause_named_imports: any;
    _import_clause_default_import: any;
    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
    $with: {
        importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: any;
                        importClauseNamedImports: any;
                        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (any | any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: any;
                        importClauseNamedImports: any;
                        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseNamedImports: any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: any;
                importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importClauseDefaultImport: (v: T._ImportClauseDefaultImport) => (any | {
            $variant: 'named_imports';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: (v: T._ImportClauseNamespaceImport) => (any | any | {
                    $variant: 'namespace_import';
                    $type: TSKindId.ImportClause;
                    _import_clause_namespace_import: any;
                    _import_clause_named_imports: any;
                    _import_clause_default_import: any;
                    importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
                    importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
                    importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
                    $with: {
                        importClauseNamespaceImport: any;
                        importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | any) & {
                            $render(): string;
                            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                            $replace(target: {
                                range(): import("@sittir/types").ByteRange;
                            }): import("@sittir/types").Edit;
                            $trivia(...args: (T.Comment | {
                                leading?: (T.Comment)[];
                                trailing?: (T.Comment)[];
                            })[]): AnyNodeData;
                        };
                        importClauseDefaultImport: any;
                    };
                }) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: any;
            };
        } | {
            $variant: 'namespace_import';
            $type: TSKindId.ImportClause;
            _import_clause_namespace_import: any;
            _import_clause_named_imports: any;
            _import_clause_default_import: any;
            importClauseNamespaceImport(): T._ImportClauseNamespaceImport | undefined;
            importClauseNamedImports(): T._ImportClauseNamedImports | undefined;
            importClauseDefaultImport(): T._ImportClauseDefaultImport | undefined;
            $with: {
                importClauseNamespaceImport: any;
                importClauseNamedImports: (v: T._ImportClauseNamedImports) => (any | any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importClauseDefaultImport: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapImportRequireClause(data: T.ImportRequireClause, tree: TreeHandle): {
    $type: TSKindId.ImportRequireClause;
    _identifier: T.Identifier;
    _source: T.String;
    identifier(): T.Identifier;
    source(): T.String;
    $with: {
        identifier: (v: NonNullable<T.ImportRequireClause['_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        source: (v: NonNullable<T.ImportRequireClause['_source']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapImportSpecifierName(data: T.ImportSpecifierName, tree: TreeHandle): {
    $type: "import_specifier_name";
    _name: T.Identifier;
    name(): T.Identifier;
    $with: {
        name: (v: NonNullable<T.ImportSpecifierName['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapImportSpecifier(data: T.ImportSpecifier, tree: TreeHandle): ({
    $variant: 'as';
    __inputHints__?: {
        readonly import_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Typeof | TSKindId.Type>;
    };
    $type: TSKindId.ImportSpecifier;
    _import_kind: any;
    _import_specifier_name: any;
    _import_specifier_as: any;
    importKind(): any;
    importSpecifierName(): T._ImportSpecifierName | undefined;
    importSpecifierAs(): T.ImportSpecifierAs | undefined;
    $with: {
        importKind: (v: number) => (/*elided*/ any | {
            $variant: 'name';
            __inputHints__?: {
                readonly import_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Typeof | TSKindId.Type>;
            };
            $type: TSKindId.ImportSpecifier;
            _import_kind: any;
            _import_specifier_name: any;
            _import_specifier_as: any;
            importKind(): any;
            importSpecifierName(): T._ImportSpecifierName | undefined;
            importSpecifierAs(): T.ImportSpecifierAs | undefined;
            $with: {
                importKind: /*elided*/ any;
                importSpecifierName: (v: T._ImportSpecifierName) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importSpecifierAs: (v: T.ImportSpecifierAs) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importSpecifierName: (v: T._ImportSpecifierName) => (/*elided*/ any | {
            $variant: 'name';
            __inputHints__?: {
                readonly import_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
            };
            $type: TSKindId.ImportSpecifier;
            _import_kind: any;
            _import_specifier_name: any;
            _import_specifier_as: any;
            importKind(): any;
            importSpecifierName(): T._ImportSpecifierName | undefined;
            importSpecifierAs(): T.ImportSpecifierAs | undefined;
            $with: {
                importKind: (v: number) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importSpecifierName: /*elided*/ any;
                importSpecifierAs: (v: T.ImportSpecifierAs) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importSpecifierAs: (v: T.ImportSpecifierAs) => (/*elided*/ any | {
            $variant: 'name';
            __inputHints__?: {
                readonly import_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
            };
            $type: TSKindId.ImportSpecifier;
            _import_kind: any;
            _import_specifier_name: any;
            _import_specifier_as: any;
            importKind(): any;
            importSpecifierName(): T._ImportSpecifierName | undefined;
            importSpecifierAs(): T.ImportSpecifierAs | undefined;
            $with: {
                importKind: (v: number) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importSpecifierName: (v: T._ImportSpecifierName) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importSpecifierAs: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'name';
    __inputHints__?: {
        readonly import_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
    };
    $type: TSKindId.ImportSpecifier;
    _import_kind: any;
    _import_specifier_name: any;
    _import_specifier_as: any;
    importKind(): any;
    importSpecifierName(): T._ImportSpecifierName | undefined;
    importSpecifierAs(): T.ImportSpecifierAs | undefined;
    $with: {
        importKind: (v: number) => (any | {
            $variant: 'name';
            __inputHints__?: {
                readonly import_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Typeof | TSKindId.Type>;
            };
            $type: TSKindId.ImportSpecifier;
            _import_kind: any;
            _import_specifier_name: any;
            _import_specifier_as: any;
            importKind(): any;
            importSpecifierName(): T._ImportSpecifierName | undefined;
            importSpecifierAs(): T.ImportSpecifierAs | undefined;
            $with: {
                importKind: any;
                importSpecifierName: (v: T._ImportSpecifierName) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importSpecifierAs: (v: T.ImportSpecifierAs) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importSpecifierName: (v: T._ImportSpecifierName) => (any | {
            $variant: 'name';
            __inputHints__?: {
                readonly import_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
            };
            $type: TSKindId.ImportSpecifier;
            _import_kind: any;
            _import_specifier_name: any;
            _import_specifier_as: any;
            importKind(): any;
            importSpecifierName(): T._ImportSpecifierName | undefined;
            importSpecifierAs(): T.ImportSpecifierAs | undefined;
            $with: {
                importKind: (v: number) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importSpecifierName: any;
                importSpecifierAs: (v: T.ImportSpecifierAs) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importSpecifierAs: (v: T.ImportSpecifierAs) => (any | {
            $variant: 'name';
            __inputHints__?: {
                readonly import_kind?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
            };
            $type: TSKindId.ImportSpecifier;
            _import_kind: any;
            _import_specifier_name: any;
            _import_specifier_as: any;
            importKind(): any;
            importSpecifierName(): T._ImportSpecifierName | undefined;
            importSpecifierAs(): T.ImportSpecifierAs | undefined;
            $with: {
                importKind: (v: number) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importSpecifierName: (v: T._ImportSpecifierName) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                importSpecifierAs: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
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
    __inputHints__?: {
        readonly import_clause?: import("@sittir/types").KindEnum<"type" | "typeof", TSKindId.Typeof | TSKindId.Type>;
    };
    $type: TSKindId.ImportStatement;
    _import_clause: number | undefined;
    _from_clause: readonly ("from" | T.ImportRequireClause | T.String | T.ImportClause)[];
    _import_attribute: T.ImportAttribute | undefined;
    _semicolon: T.AutomaticSemicolon;
    importClause(): number | undefined;
    fromClauses(): ("from" | T.ImportRequireClause | T.String | T.ImportClause)[];
    importAttribute(): T.ImportAttribute | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        importClause: (v: NonNullable<T.ImportStatement['_import_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        fromClauses: (v_0: "from" | T.ImportRequireClause | T.String | T.ImportClause, ...v: ("from" | T.ImportRequireClause | T.String | T.ImportClause)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        importAttribute: (v: NonNullable<T.ImportStatement['_import_attribute']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ImportStatement['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapIndexSignatureMappedTypeClause(data: T.IndexSignatureMappedTypeClause, tree: TreeHandle): {
    $type: "index_signature_mapped_type_clause";
    _mapped_type_clause: T.MappedTypeClause;
    mappedTypeClause(): T.MappedTypeClause;
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
export declare function wrapIndexSignature(data: T.IndexSignature, tree: TreeHandle): ({
    $variant: 'colon';
    __inputHints__?: {
        readonly sign?: import("@sittir/types").KindEnum<"+" | "-", TSKindId.Plus | TSKindId.Dash>;
    };
    $type: TSKindId.IndexSignature;
    _sign: any;
    _index_signature_colon: any;
    _type: any;
    _index_signature_mapped_type_clause: any;
    sign(): any;
    indexSignatureColon(): T.IndexSignatureColon | undefined;
    type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
    $with: {
        sign: (v: number) => (/*elided*/ any | {
            $variant: 'mapped_type_clause';
            __inputHints__?: {
                readonly sign?: import("@sittir/types").KindEnum<"+" | "-", TSKindId.Plus | TSKindId.Dash>;
            };
            $type: TSKindId.IndexSignature;
            _sign: any;
            _index_signature_colon: any;
            _type: any;
            _index_signature_mapped_type_clause: any;
            sign(): any;
            indexSignatureColon(): T.IndexSignatureColon | undefined;
            type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
            indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
            $with: {
                sign: /*elided*/ any;
                indexSignatureColon: (v: T.IndexSignatureColon) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                type: (v: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureMappedTypeClause: (v: T._IndexSignatureMappedTypeClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        indexSignatureColon: (v: T.IndexSignatureColon) => (/*elided*/ any | {
            $variant: 'mapped_type_clause';
            __inputHints__?: {
                readonly sign?: import("@sittir/types").KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
            };
            $type: TSKindId.IndexSignature;
            _sign: any;
            _index_signature_colon: any;
            _type: any;
            _index_signature_mapped_type_clause: any;
            sign(): any;
            indexSignatureColon(): T.IndexSignatureColon | undefined;
            type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
            indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
            $with: {
                sign: (v: number) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureColon: /*elided*/ any;
                type: (v: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureMappedTypeClause: (v: T._IndexSignatureMappedTypeClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => (/*elided*/ any | {
            $variant: 'mapped_type_clause';
            __inputHints__?: {
                readonly sign?: import("@sittir/types").KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
            };
            $type: TSKindId.IndexSignature;
            _sign: any;
            _index_signature_colon: any;
            _type: any;
            _index_signature_mapped_type_clause: any;
            sign(): any;
            indexSignatureColon(): T.IndexSignatureColon | undefined;
            type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
            indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
            $with: {
                sign: (v: number) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureColon: (v: T.IndexSignatureColon) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                type: /*elided*/ any;
                indexSignatureMappedTypeClause: (v: T._IndexSignatureMappedTypeClause) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        indexSignatureMappedTypeClause: (v: T._IndexSignatureMappedTypeClause) => (/*elided*/ any | {
            $variant: 'mapped_type_clause';
            __inputHints__?: {
                readonly sign?: import("@sittir/types").KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
            };
            $type: TSKindId.IndexSignature;
            _sign: any;
            _index_signature_colon: any;
            _type: any;
            _index_signature_mapped_type_clause: any;
            sign(): any;
            indexSignatureColon(): T.IndexSignatureColon | undefined;
            type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
            indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
            $with: {
                sign: (v: number) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureColon: (v: T.IndexSignatureColon) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                type: (v: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureMappedTypeClause: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'mapped_type_clause';
    __inputHints__?: {
        readonly sign?: import("@sittir/types").KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
    };
    $type: TSKindId.IndexSignature;
    _sign: any;
    _index_signature_colon: any;
    _type: any;
    _index_signature_mapped_type_clause: any;
    sign(): any;
    indexSignatureColon(): T.IndexSignatureColon | undefined;
    type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
    indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
    $with: {
        sign: (v: number) => (any | {
            $variant: 'mapped_type_clause';
            __inputHints__?: {
                readonly sign?: import("@sittir/types").KindEnum<"+" | "-", TSKindId.Plus | TSKindId.Dash>;
            };
            $type: TSKindId.IndexSignature;
            _sign: any;
            _index_signature_colon: any;
            _type: any;
            _index_signature_mapped_type_clause: any;
            sign(): any;
            indexSignatureColon(): T.IndexSignatureColon | undefined;
            type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
            indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
            $with: {
                sign: any;
                indexSignatureColon: (v: T.IndexSignatureColon) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                type: (v: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureMappedTypeClause: (v: T._IndexSignatureMappedTypeClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        indexSignatureColon: (v: T.IndexSignatureColon) => (any | {
            $variant: 'mapped_type_clause';
            __inputHints__?: {
                readonly sign?: import("@sittir/types").KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
            };
            $type: TSKindId.IndexSignature;
            _sign: any;
            _index_signature_colon: any;
            _type: any;
            _index_signature_mapped_type_clause: any;
            sign(): any;
            indexSignatureColon(): T.IndexSignatureColon | undefined;
            type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
            indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
            $with: {
                sign: (v: number) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureColon: any;
                type: (v: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureMappedTypeClause: (v: T._IndexSignatureMappedTypeClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => (any | {
            $variant: 'mapped_type_clause';
            __inputHints__?: {
                readonly sign?: import("@sittir/types").KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
            };
            $type: TSKindId.IndexSignature;
            _sign: any;
            _index_signature_colon: any;
            _type: any;
            _index_signature_mapped_type_clause: any;
            sign(): any;
            indexSignatureColon(): T.IndexSignatureColon | undefined;
            type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
            indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
            $with: {
                sign: (v: number) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureColon: (v: T.IndexSignatureColon) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                type: any;
                indexSignatureMappedTypeClause: (v: T._IndexSignatureMappedTypeClause) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        indexSignatureMappedTypeClause: (v: T._IndexSignatureMappedTypeClause) => (any | {
            $variant: 'mapped_type_clause';
            __inputHints__?: {
                readonly sign?: import("@sittir/types").KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
            };
            $type: TSKindId.IndexSignature;
            _sign: any;
            _index_signature_colon: any;
            _type: any;
            _index_signature_mapped_type_clause: any;
            sign(): any;
            indexSignatureColon(): T.IndexSignatureColon | undefined;
            type(): T.AddingTypeAnnotation | T.OmittingTypeAnnotation | T.OptingTypeAnnotation | T.TypeAnnotation;
            indexSignatureMappedTypeClause(): T._IndexSignatureMappedTypeClause | undefined;
            $with: {
                sign: (v: number) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureColon: (v: T.IndexSignatureColon) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                type: (v: T.TypeAnnotation | T.OmittingTypeAnnotation | T.AddingTypeAnnotation | T.OptingTypeAnnotation) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                indexSignatureMappedTypeClause: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapIndexTypeQuery(data: T.IndexTypeQuery, tree: TreeHandle): {
    $type: TSKindId.IndexTypeQuery;
    _primary_type: T.ArrayType | T.ConditionalType | T.FlowMaybeType | T.GenericType | T.IndexTypeQuery | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.UnionType;
    primaryType(): T.PrimaryType;
    $with: {
        primaryType: (v: NonNullable<T.IndexTypeQuery['_primary_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapInferType(data: T.InferType, tree: TreeHandle): {
    $type: TSKindId.InferType;
    _type_identifier: T.TypeIdentifier;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType | undefined;
    typeIdentifier(): T.TypeIdentifier;
    type(): T.Type | undefined;
    $with: {
        typeIdentifier: (v: NonNullable<T.InferType['_type_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.InferType['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapInstantiationExpression(data: T.InstantiationExpression, tree: TreeHandle): {
    $type: TSKindId.InstantiationExpression;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _type_arguments: T.TypeArguments;
    expression(): T.Expression;
    typeArguments(): T.TypeArguments;
    $with: {
        expression: (v: NonNullable<T.InstantiationExpression['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (v: NonNullable<T.InstantiationExpression['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapInterfaceDeclaration(data: T.InterfaceDeclaration, tree: TreeHandle): {
    $type: TSKindId.InterfaceDeclaration;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _extends_type_clause: T.ExtendsTypeClause | undefined;
    _body: T.ObjectType;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    extendsTypeClause(): T.ExtendsTypeClause | undefined;
    body(): T.ObjectType;
    $with: {
        name: (v: NonNullable<T.InterfaceDeclaration['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.InterfaceDeclaration['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        extendsTypeClause: (v: NonNullable<T.InterfaceDeclaration['_extends_type_clause']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.InterfaceDeclaration['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapInternalModule(data: T.InternalModule, tree: TreeHandle): {
    $type: TSKindId.InternalModule;
    _name: T.Identifier | T.NestedIdentifier | T.String;
    _body: T.StatementBlock | undefined;
    name(): T.Identifier | T.NestedIdentifier | T.String;
    body(): T.StatementBlock | undefined;
    $with: {
        name: (v: NonNullable<T.InternalModule['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.InternalModule['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapIntersectionType(data: T.IntersectionType, tree: TreeHandle): {
    $type: TSKindId.IntersectionType;
    _left: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType | undefined;
    _right: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    left(): T.Type | undefined;
    right(): T.Type;
    $with: {
        left: (v: NonNullable<T.IntersectionType['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.IntersectionType['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapLabeledStatement(data: T.LabeledStatement, tree: TreeHandle): {
    $type: TSKindId.LabeledStatement;
    _label: T.Identifier | T.ReservedIdentifier;
    _body: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.BreakStatement | T.ClassDeclaration | T.ContinueStatement | T.DebuggerStatement | T.DoStatement | T.EnumDeclaration | T.ExportStatementUFormDefault | T.ExportStatementUFormEqualsExport | T.ExportStatementUFormNamespaceExport | T.ExportStatementUFormTypeExport | T.ExpressionStatement | T.ForInStatement | T.ForStatement | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.IfStatement | T.ImportAlias | T.ImportStatement | T.InterfaceDeclaration | T.InternalModule | T.LabeledStatement | T.LexicalDeclaration | T.Module | T.ReturnStatement | T.StatementBlock | T.SwitchStatement | T.ThrowStatement | T.TryStatement | T.TypeAliasDeclaration | T.VariableDeclaration | T.WhileStatement | T.WithStatement;
    label(): T.StatementIdentifier;
    body(): T.Statement;
    $with: {
        label: (v: NonNullable<T.LabeledStatement['_label']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.LabeledStatement['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapLexicalDeclaration(data: T.LexicalDeclaration, tree: TreeHandle): {
    __inputHints__?: {
        readonly kind: import("@sittir/types").KindEnum<"const" | "let", TSKindId.Let | TSKindId.Const>;
    };
    $type: TSKindId.LexicalDeclaration;
    _kind: number;
    _declarators: readonly T.VariableDeclarator[];
    _semicolon: T.AutomaticSemicolon;
    kind(): number;
    declarators(): T.VariableDeclarator[];
    semicolon(): T.AutomaticSemicolon;
    $with: {
        kind: (v: NonNullable<T.LexicalDeclaration['_kind']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        declarators: (v_0: T.VariableDeclarator, ...v: T.VariableDeclarator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.LexicalDeclaration['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapLiteralType(data: T.LiteralType, tree: TreeHandle): {
    $type: TSKindId.LiteralType;
    _number: T.False | T.Null | T.Number | T.String | T.True | T.Undefined | T._Number;
    number(): T.False | T.Null | T.Number | T.String | T.True | T.Undefined | T._Number;
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
export declare function wrapLookupType(data: T.LookupType, tree: TreeHandle): {
    $type: TSKindId.LookupType;
    _primary_type: T.ArrayType | T.ConditionalType | T.FlowMaybeType | T.GenericType | T.IndexTypeQuery | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.UnionType;
    _index_type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    primaryType(): T.PrimaryType;
    indexType(): T.Type;
    $with: {
        primaryType: (v: NonNullable<T.LookupType['_primary_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        indexType: (v: NonNullable<T.LookupType['_index_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapMappedTypeClause(data: T.MappedTypeClause, tree: TreeHandle): {
    $type: TSKindId.MappedTypeClause;
    _name: T.TypeIdentifier;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    _alias: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType | undefined;
    name(): T.TypeIdentifier;
    type(): T.Type;
    alias(): T.Type | undefined;
    $with: {
        name: (v: NonNullable<T.MappedTypeClause['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.MappedTypeClause['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alias: (v: NonNullable<T.MappedTypeClause['_alias']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapMemberExpression(data: T.MemberExpression, tree: TreeHandle): {
    __inputHints__?: {
        readonly optional_chain?: import("@sittir/types").BooleanKeyword<"?.">;
    };
    $type: TSKindId.MemberExpression;
    _object: T.Array | T.ArrowFunctionUFormParameter | T.ArrowFunctionUFormUCallSignature | T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.CallExpressionUFormCall | T.CallExpressionUFormMember | T.CallExpressionUFormTemplateCall | T.Class | T.False | T.FunctionExpression | T.GeneratorFunction | T.Identifier | T.Import | T.InstantiationExpression | T.InternalModule | T.MemberExpression | T.MetaProperty | T.NewExpression | T.NonNullExpression | T.Null | T.Number | T.Object | T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped | T.Regex | T.ReservedIdentifier | T.SatisfiesExpression | T.String | T.SubscriptExpression | T.Super | T.TemplateString | T.TernaryExpression | T.This | T.True | T.TypeAssertion | T.UnaryExpression | T.Undefined | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _optional_chain: true | undefined;
    _property: T.Identifier | T.PrivatePropertyIdentifier;
    object(): T.Import | T.Expression | T.PrimaryExpression;
    optionalChain(): true | undefined;
    property(): T.Identifier | T.PrivatePropertyIdentifier;
    $with: {
        object: (v: NonNullable<T.MemberExpression['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalChain: (v: NonNullable<T.MemberExpression['_optional_chain']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        property: (v: NonNullable<T.MemberExpression['_property']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapMethodDefinition(data: T.MethodDefinition, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier?: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly static_marker?: import("@sittir/types").BooleanKeyword<"static">;
        readonly override_modifier?: import("@sittir/types").BooleanKeyword<"override">;
        readonly readonly_marker?: import("@sittir/types").BooleanKeyword<"readonly">;
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
        readonly accessor_kind?: import("@sittir/types").KindEnum<"*" | "get" | "set", TSKindId.Star2 | TSKindId.Get | TSKindId.Set>;
        readonly optional_marker?: import("@sittir/types").BooleanKeyword<"?">;
    };
    $type: TSKindId.MethodDefinition;
    _accessibility_modifier: number | undefined;
    _static_marker: true | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _async_marker: true | undefined;
    _accessor_kind: number | undefined;
    _name: T.ComputedPropertyName | T.Identifier | T.Number | T.PrivatePropertyIdentifier | T.ReservedIdentifier | T.String;
    _optional_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    _body: T.StatementBlock;
    accessibilityModifier(): number | undefined;
    staticMarker(): true | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    asyncMarker(): true | undefined;
    accessorKind(): number | undefined;
    name(): T.PropertyName;
    optionalMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    body(): T.StatementBlock;
    $with: {
        accessibilityModifier: (v: NonNullable<T.MethodDefinition['_accessibility_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        staticMarker: (v: NonNullable<T.MethodDefinition['_static_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (v: NonNullable<T.MethodDefinition['_override_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (v: NonNullable<T.MethodDefinition['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        asyncMarker: (v: NonNullable<T.MethodDefinition['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessorKind: (v: NonNullable<T.MethodDefinition['_accessor_kind']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.MethodDefinition['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalMarker: (v: NonNullable<T.MethodDefinition['_optional_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.MethodDefinition['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.MethodDefinition['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.MethodDefinition['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.MethodDefinition['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapMethodSignature(data: T.MethodSignature, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier?: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly static_marker?: import("@sittir/types").BooleanKeyword<"static">;
        readonly override_modifier?: import("@sittir/types").BooleanKeyword<"override">;
        readonly readonly_marker?: import("@sittir/types").BooleanKeyword<"readonly">;
        readonly async_marker?: import("@sittir/types").BooleanKeyword<"async">;
        readonly accessor_kind?: import("@sittir/types").KindEnum<"*" | "get" | "set", TSKindId.Star2 | TSKindId.Get | TSKindId.Set>;
        readonly optional_marker?: import("@sittir/types").BooleanKeyword<"?">;
    };
    $type: TSKindId.MethodSignature;
    _accessibility_modifier: number | undefined;
    _static_marker: true | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _async_marker: true | undefined;
    _accessor_kind: number | undefined;
    _name: T.ComputedPropertyName | T.Identifier | T.Number | T.PrivatePropertyIdentifier | T.ReservedIdentifier | T.String;
    _optional_marker: true | undefined;
    _type_parameters: T.TypeParameters | undefined;
    _parameters: T.FormalParameters;
    _return_type: T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    accessibilityModifier(): number | undefined;
    staticMarker(): true | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    asyncMarker(): true | undefined;
    accessorKind(): number | undefined;
    name(): T.PropertyName;
    optionalMarker(): true | undefined;
    typeParameters(): T.TypeParameters | undefined;
    parameters(): T.FormalParameters;
    returnType(): T.AssertsAnnotation | T.TypeAnnotation | T.TypePredicateAnnotation | undefined;
    $with: {
        accessibilityModifier: (v: NonNullable<T.MethodSignature['_accessibility_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        staticMarker: (v: NonNullable<T.MethodSignature['_static_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (v: NonNullable<T.MethodSignature['_override_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (v: NonNullable<T.MethodSignature['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        asyncMarker: (v: NonNullable<T.MethodSignature['_async_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessorKind: (v: NonNullable<T.MethodSignature['_accessor_kind']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.MethodSignature['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalMarker: (v: NonNullable<T.MethodSignature['_optional_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.MethodSignature['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parameters: (v: NonNullable<T.MethodSignature['_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        returnType: (v: NonNullable<T.MethodSignature['_return_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _name: T.Identifier | T.NestedIdentifier | T.String;
    _body: T.StatementBlock | undefined;
    name(): T.Identifier | T.NestedIdentifier | T.String;
    body(): T.StatementBlock | undefined;
    $with: {
        name: (v: NonNullable<T.Module['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.Module['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapNamedImports(data: T.NamedImports, tree: TreeHandle): {
    $type: TSKindId.NamedImports;
    _import_specifier: readonly T.ImportSpecifier[];
    importSpecifiers(): T.ImportSpecifier[];
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
export declare function wrapNamespaceExport(data: T.NamespaceExport, tree: TreeHandle): {
    $type: TSKindId.NamespaceExport;
    _module_export_name: any;
    moduleExportName(): T.ModuleExportName;
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
export declare function wrapNamespaceImport(data: T.NamespaceImport, tree: TreeHandle): {
    $type: TSKindId.NamespaceImport;
    _identifier: T.Identifier;
    identifier(): T.Identifier;
    $with: {
        identifier: (v: NonNullable<T.NamespaceImport['_identifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapNestedIdentifier(data: T.NestedIdentifier, tree: TreeHandle): {
    $type: TSKindId.NestedIdentifier;
    _object: T.Identifier | T.NestedIdentifier;
    _property: T.Identifier;
    object(): T.Identifier | T.NestedIdentifier;
    property(): T.Identifier;
    $with: {
        object: (v: NonNullable<T.NestedIdentifier['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        property: (v: NonNullable<T.NestedIdentifier['_property']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapNestedTypeIdentifier(data: T.NestedTypeIdentifier, tree: TreeHandle): {
    $type: TSKindId.NestedTypeIdentifier;
    _module: T.Identifier | T.NestedIdentifier;
    _name: T.TypeIdentifier;
    module(): T.Identifier | T.NestedIdentifier;
    name(): T.TypeIdentifier;
    $with: {
        module: (v: NonNullable<T.NestedTypeIdentifier['_module']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.NestedTypeIdentifier['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapNewExpression(data: T.NewExpression, tree: TreeHandle): {
    $type: TSKindId.NewExpression;
    _constructor: T.Array | T.ArrowFunctionUFormParameter | T.ArrowFunctionUFormUCallSignature | T.CallExpressionUFormCall | T.CallExpressionUFormMember | T.CallExpressionUFormTemplateCall | T.Class | T.False | T.FunctionExpression | T.GeneratorFunction | T.Identifier | T.MemberExpression | T.MetaProperty | T.NonNullExpression | T.Null | T.Number | T.Object | T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped | T.Regex | T.ReservedIdentifier | T.String | T.SubscriptExpression | T.Super | T.TemplateString | T.This | T.True | T.Undefined;
    _type_arguments: T.TypeArguments | undefined;
    _arguments: T.Arguments | undefined;
    constructor(): T.PrimaryExpression;
    typeArguments(): T.TypeArguments | undefined;
    arguments(): T.Arguments | undefined;
    $with: {
        constructor: (v: NonNullable<T.NewExpression['_constructor']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeArguments: (v: NonNullable<T.NewExpression['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        arguments: (v: NonNullable<T.NewExpression['_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapNonNullExpression(data: T.NonNullExpression, tree: TreeHandle): {
    $type: TSKindId.NonNullExpression;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.NonNullExpression['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapObject(data: T.Object, tree: TreeHandle): {
    $type: TSKindId.Object;
    _pair: readonly any[];
    pair(): (T.MethodDefinition | T.Pair | T.SpreadElement | T.ShorthandPropertyIdentifier)[];
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
export declare function wrapObjectAssignmentPattern(data: T.ObjectAssignmentPattern, tree: TreeHandle): {
    $type: TSKindId.ObjectAssignmentPattern;
    _left: T.ArrayPattern | T.Identifier | T.ObjectPattern | T.ReservedIdentifier;
    _right: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    left(): T.DestructuringPattern | T.ShorthandPropertyIdentifierPattern;
    right(): T.Expression;
    $with: {
        left: (v: NonNullable<T.ObjectAssignmentPattern['_left']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        right: (v: NonNullable<T.ObjectAssignmentPattern['_right']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapObjectPattern(data: T.ObjectPattern, tree: TreeHandle): {
    $type: TSKindId.ObjectPattern;
    _pair_pattern: readonly any[];
    pairPattern(): (T.ObjectAssignmentPattern | T.PairPattern | T.RestPattern | T.ShorthandPropertyIdentifierPattern)[];
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
export declare function wrapObjectType(data: T.ObjectType, tree: TreeHandle): {
    __inputHints__?: {
        readonly opening: import("@sittir/types").KindEnum<"{" | "{|", TSKindId.Lbrace | TSKindId.LbracePipe>;
        readonly closing: import("@sittir/types").KindEnum<"|}" | "}", TSKindId.Rbrace | TSKindId.PipeRbrace>;
    };
    $type: TSKindId.ObjectType;
    _opening: number;
    _members: readonly ("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[];
    _closing: number;
    opening(): number;
    members(): ("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[];
    closing(): number;
    $with: {
        opening: (v: NonNullable<T.ObjectType['_opening']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        members: (v_0: "," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature, ...v: ("," | ";" | T.AutomaticSemicolon | T.CallSignature | T.ConstructSignature | T.MethodSignature | T.PropertySignature | T.ExportStatement | T.IndexSignature)[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        closing: (v: NonNullable<T.ObjectType['_closing']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapOmittingTypeAnnotation(data: T.OmittingTypeAnnotation, tree: TreeHandle): {
    $type: TSKindId.OmittingTypeAnnotation;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.OmittingTypeAnnotation['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapOptingTypeAnnotation(data: T.OptingTypeAnnotation, tree: TreeHandle): {
    $type: TSKindId.OptingTypeAnnotation;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.OptingTypeAnnotation['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapOptionalParameter(data: T.OptionalParameter, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier?: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly override_modifier?: import("@sittir/types").BooleanKeyword<"override">;
        readonly readonly_marker?: import("@sittir/types").BooleanKeyword<"readonly">;
    };
    $type: TSKindId.OptionalParameter;
    _decorator: readonly T.Decorator[];
    _accessibility_modifier: number | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _pattern: T.ArrayPattern | T.Identifier | T.MemberExpression | T.NonNullExpression | T.ObjectPattern | T.RestPattern | T.SubscriptExpression | T.This | T.Undefined;
    _type: T.TypeAnnotation | undefined;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression | undefined;
    decorators(): T.Decorator[];
    accessibilityModifier(): number | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    pattern(): T.This | T.Pattern;
    type(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    $with: {
        decorators: (...v: NonNullable<T.OptionalParameter['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessibilityModifier: (v: NonNullable<T.OptionalParameter['_accessibility_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (v: NonNullable<T.OptionalParameter['_override_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (v: NonNullable<T.OptionalParameter['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        pattern: (v: NonNullable<T.OptionalParameter['_pattern']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.OptionalParameter['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.OptionalParameter['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapOptionalTupleParameter(data: T.OptionalTupleParameter, tree: TreeHandle): {
    $type: TSKindId.OptionalTupleParameter;
    _name: T.Identifier;
    _type: T.TypeAnnotation;
    name(): T.Identifier;
    type(): T.TypeAnnotation;
    $with: {
        name: (v: NonNullable<T.OptionalTupleParameter['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.OptionalTupleParameter['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapOptionalType(data: T.OptionalType, tree: TreeHandle): {
    $type: TSKindId.OptionalType;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.OptionalType['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _key: T.ComputedPropertyName | T.Identifier | T.Number | T.PrivatePropertyIdentifier | T.ReservedIdentifier | T.String;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    key(): T.PropertyName;
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
export declare function wrapPairPattern(data: T.PairPattern, tree: TreeHandle): {
    $type: TSKindId.PairPattern;
    _key: T.ComputedPropertyName | T.Identifier | T.Number | T.PrivatePropertyIdentifier | T.ReservedIdentifier | T.String;
    _value: T.ArrayPattern | T.AssignmentPattern | T.Identifier | T.MemberExpression | T.NonNullExpression | T.ObjectPattern | T.RestPattern | T.SubscriptExpression | T.Undefined;
    key(): T.PropertyName;
    value(): T.AssignmentPattern | T.Pattern;
    $with: {
        key: (v: NonNullable<T.PairPattern['_key']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.PairPattern['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapParenthesizedExpressionSequence(data: T.ParenthesizedExpressionSequence, tree: TreeHandle): {
    $type: "parenthesized_expression_sequence";
    _sequence_expression: T.SequenceExpression;
    sequenceExpression(): T.SequenceExpression;
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
export declare function wrapParenthesizedExpression(data: T.ParenthesizedExpression, tree: TreeHandle): ({
    $variant: 'sequence';
    $type: TSKindId.ParenthesizedExpression;
    _parenthesized_expression_typed: any;
    _parenthesized_expression_sequence: any;
    parenthesizedExpressionTyped(): T.ParenthesizedExpressionTyped | undefined;
    parenthesizedExpressionSequence(): T._ParenthesizedExpressionSequence | undefined;
    $with: {
        parenthesizedExpressionTyped: (v: T.ParenthesizedExpressionTyped) => (/*elided*/ any | {
            $variant: 'typed';
            $type: TSKindId.ParenthesizedExpression;
            _parenthesized_expression_typed: any;
            _parenthesized_expression_sequence: any;
            parenthesizedExpressionTyped(): T.ParenthesizedExpressionTyped | undefined;
            parenthesizedExpressionSequence(): T._ParenthesizedExpressionSequence | undefined;
            $with: {
                parenthesizedExpressionTyped: /*elided*/ any;
                parenthesizedExpressionSequence: (v: T._ParenthesizedExpressionSequence) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parenthesizedExpressionSequence: (v: T._ParenthesizedExpressionSequence) => (/*elided*/ any | {
            $variant: 'typed';
            $type: TSKindId.ParenthesizedExpression;
            _parenthesized_expression_typed: any;
            _parenthesized_expression_sequence: any;
            parenthesizedExpressionTyped(): T.ParenthesizedExpressionTyped | undefined;
            parenthesizedExpressionSequence(): T._ParenthesizedExpressionSequence | undefined;
            $with: {
                parenthesizedExpressionTyped: (v: T.ParenthesizedExpressionTyped) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                parenthesizedExpressionSequence: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'typed';
    $type: TSKindId.ParenthesizedExpression;
    _parenthesized_expression_typed: any;
    _parenthesized_expression_sequence: any;
    parenthesizedExpressionTyped(): T.ParenthesizedExpressionTyped | undefined;
    parenthesizedExpressionSequence(): T._ParenthesizedExpressionSequence | undefined;
    $with: {
        parenthesizedExpressionTyped: (v: T.ParenthesizedExpressionTyped) => (any | {
            $variant: 'typed';
            $type: TSKindId.ParenthesizedExpression;
            _parenthesized_expression_typed: any;
            _parenthesized_expression_sequence: any;
            parenthesizedExpressionTyped(): T.ParenthesizedExpressionTyped | undefined;
            parenthesizedExpressionSequence(): T._ParenthesizedExpressionSequence | undefined;
            $with: {
                parenthesizedExpressionTyped: any;
                parenthesizedExpressionSequence: (v: T._ParenthesizedExpressionSequence) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        parenthesizedExpressionSequence: (v: T._ParenthesizedExpressionSequence) => (any | {
            $variant: 'typed';
            $type: TSKindId.ParenthesizedExpression;
            _parenthesized_expression_typed: any;
            _parenthesized_expression_sequence: any;
            parenthesizedExpressionTyped(): T.ParenthesizedExpressionTyped | undefined;
            parenthesizedExpressionSequence(): T._ParenthesizedExpressionSequence | undefined;
            $with: {
                parenthesizedExpressionTyped: (v: T.ParenthesizedExpressionTyped) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                parenthesizedExpressionSequence: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapParenthesizedType(data: T.ParenthesizedType, tree: TreeHandle): {
    $type: TSKindId.ParenthesizedType;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.ParenthesizedType['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
export declare function wrapPrimaryExpression(data: T.PrimaryExpression, tree: TreeHandle): T.PrimaryExpression;
export declare function wrapPrimaryType(data: T.PrimaryType, tree: TreeHandle): T.PrimaryType;
export declare function wrapProgram(data: T.Program, tree: TreeHandle): {
    $type: TSKindId.Program;
    _hash_bang_line: T.HashBangLine | undefined;
    _statements: readonly T.Statement[];
    hashBangLine(): T.HashBangLine | undefined;
    statements(): T.Statement[];
    $with: {
        hashBangLine: (v: NonNullable<T.Program['_hash_bang_line']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        statements: (...v: NonNullable<T.Program['_statements']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapPropertySignature(data: T.PropertySignature, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier?: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly static_marker?: import("@sittir/types").BooleanKeyword<"static">;
        readonly override_modifier?: import("@sittir/types").BooleanKeyword<"override">;
        readonly readonly_marker?: import("@sittir/types").BooleanKeyword<"readonly">;
        readonly optional_marker?: import("@sittir/types").BooleanKeyword<"?">;
    };
    $type: TSKindId.PropertySignature;
    _accessibility_modifier: number | undefined;
    _static_marker: true | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _name: T.ComputedPropertyName | T.Identifier | T.Number | T.PrivatePropertyIdentifier | T.ReservedIdentifier | T.String;
    _optional_marker: true | undefined;
    _type: T.TypeAnnotation | undefined;
    accessibilityModifier(): number | undefined;
    staticMarker(): true | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    name(): T.PropertyName;
    optionalMarker(): true | undefined;
    type(): T.TypeAnnotation | undefined;
    $with: {
        accessibilityModifier: (v: NonNullable<T.PropertySignature['_accessibility_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        staticMarker: (v: NonNullable<T.PropertySignature['_static_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (v: NonNullable<T.PropertySignature['_override_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (v: NonNullable<T.PropertySignature['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.PropertySignature['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalMarker: (v: NonNullable<T.PropertySignature['_optional_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.PropertySignature['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapPublicFieldDefinition(data: T.PublicFieldDefinition, tree: TreeHandle): {
    __inputHints__?: {
        readonly optionality_marker?: import("@sittir/types").KindEnum<"!" | "?", TSKindId.Bang | TSKindId.Qmark>;
    };
    $type: TSKindId.PublicFieldDefinition;
    _decorator: readonly T.Decorator[];
    _public_field_definition_declare_first: any;
    _public_field_definition_static_mods: any;
    _name: T.ComputedPropertyName | T.Identifier | T.Number | T.PrivatePropertyIdentifier | T.ReservedIdentifier | T.String;
    _optionality_marker: number | undefined;
    _type: T.TypeAnnotation | undefined;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression | undefined;
    decorators(): T.Decorator[];
    publicFieldDefinitionDeclareFirst(): T.PublicFieldDefinitionAccessFirst | T.PublicFieldDefinitionDeclareFirst | undefined;
    publicFieldDefinitionStaticMods(): T.PublicFieldDefinitionAbstractFirst | T.PublicFieldDefinitionAccessorOpt | T.PublicFieldDefinitionReadonlyFirst | T.PublicFieldDefinitionStaticMods | undefined;
    name(): T.PropertyName;
    optionalityMarker(): number | undefined;
    type(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    $with: {
        decorators: (...v: NonNullable<T.PublicFieldDefinition['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        publicFieldDefinitionDeclareFirst: (v: NonNullable<T.PublicFieldDefinition['_public_field_definition_declare_first']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        publicFieldDefinitionStaticMods: (v: NonNullable<T.PublicFieldDefinition['_public_field_definition_static_mods']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.PublicFieldDefinition['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalityMarker: (v: NonNullable<T.PublicFieldDefinition['_optionality_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.PublicFieldDefinition['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.PublicFieldDefinition['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapReadonlyType(data: T.ReadonlyType, tree: TreeHandle): {
    $type: TSKindId.ReadonlyType;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.ReadonlyType['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapRegex(data: T.Regex, tree: TreeHandle): {
    $type: TSKindId.Regex;
    _pattern: T.RegexPattern;
    _flags: T.RegexFlags | undefined;
    pattern(): T.RegexPattern;
    flags(): T.RegexFlags | undefined;
    $with: {
        pattern: (v: NonNullable<T.Regex['_pattern']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        flags: (v: NonNullable<T.Regex['_flags']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapRequiredParameter(data: T.RequiredParameter, tree: TreeHandle): {
    __inputHints__?: {
        readonly accessibility_modifier?: import("@sittir/types").KindEnum<"private" | "protected" | "public", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly override_modifier?: import("@sittir/types").BooleanKeyword<"override">;
        readonly readonly_marker?: import("@sittir/types").BooleanKeyword<"readonly">;
    };
    $type: TSKindId.RequiredParameter;
    _decorator: readonly T.Decorator[];
    _accessibility_modifier: number | undefined;
    _override_modifier: true | undefined;
    _readonly_marker: true | undefined;
    _pattern: T.ArrayPattern | T.Identifier | T.MemberExpression | T.NonNullExpression | T.ObjectPattern | T.RestPattern | T.SubscriptExpression | T.This | T.Undefined;
    _type: T.TypeAnnotation | undefined;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression | undefined;
    decorators(): T.Decorator[];
    accessibilityModifier(): number | undefined;
    overrideModifier(): true | undefined;
    readonlyMarker(): true | undefined;
    pattern(): T.This | T.Pattern;
    type(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    $with: {
        decorators: (...v: NonNullable<T.RequiredParameter['_decorator']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        accessibilityModifier: (v: NonNullable<T.RequiredParameter['_accessibility_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        overrideModifier: (v: NonNullable<T.RequiredParameter['_override_modifier']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        readonlyMarker: (v: NonNullable<T.RequiredParameter['_readonly_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        pattern: (v: NonNullable<T.RequiredParameter['_pattern']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.RequiredParameter['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.RequiredParameter['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapRestPattern(data: T.RestPattern, tree: TreeHandle): {
    $type: TSKindId.RestPattern;
    _lhs_expression: T.LhsExpression;
    lhsExpression(): T.LhsExpression;
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
export declare function wrapRestType(data: T.RestType, tree: TreeHandle): {
    $type: TSKindId.RestType;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.RestType['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _semicolon: T.AutomaticSemicolon;
    expressions(): T.SequenceExpression | undefined;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        expressions: (v: NonNullable<T.ReturnStatement['_expressions']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ReturnStatement['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapSatisfiesExpression(data: T.SatisfiesExpression, tree: TreeHandle): {
    $type: TSKindId.SatisfiesExpression;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _type_annotation: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    expression(): T.Expression;
    typeAnnotation(): T.Type;
    $with: {
        expression: (v: NonNullable<T.SatisfiesExpression['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeAnnotation: (v: NonNullable<T.SatisfiesExpression['_type_annotation']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapSequenceExpression(data: T.SequenceExpression, tree: TreeHandle): {
    $type: TSKindId.SequenceExpression;
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
export declare function wrapSpreadElement(data: T.SpreadElement, tree: TreeHandle): {
    $type: TSKindId.SpreadElement;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    expression(): T.Expression;
    $with: {
        expression: (v: NonNullable<T.SpreadElement['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
export declare function wrapStatementBlock(data: T.StatementBlock, tree: TreeHandle): {
    $type: TSKindId.StatementBlock;
    _statements: readonly T.Statement[];
    _automatic_semicolon: T.AutomaticSemicolon | undefined;
    statements(): T.Statement[];
    automaticSemicolon(): T.AutomaticSemicolon | undefined;
    $with: {
        statements: (...v: NonNullable<T.StatementBlock['_statements']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        automaticSemicolon: (v: NonNullable<T.StatementBlock['_automatic_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    __inputHints__?: {
        readonly opening: import("@sittir/types").KindEnum<"\"" | "'", TSKindId.Dquote | TSKindId.Squote>;
        readonly closing: import("@sittir/types").KindEnum<"\"" | "'", TSKindId.Dquote | TSKindId.Squote>;
    };
    $type: TSKindId.String;
    _opening: number;
    _contents: readonly (T.EscapeSequence | T.UnescapedDoubleStringFragment | T.UnescapedSingleStringFragment)[];
    _closing: number;
    opening(): number;
    contents(): (T.EscapeSequence | T.UnescapedDoubleStringFragment | T.UnescapedSingleStringFragment)[];
    closing(): number;
    $with: {
        opening: (v: NonNullable<T.String['_opening']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        contents: (...v: NonNullable<T.String['_contents']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        closing: (v: NonNullable<T.String['_closing']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapSubscriptExpression(data: T.SubscriptExpression, tree: TreeHandle): {
    __inputHints__?: {
        readonly optional_chain?: import("@sittir/types").BooleanKeyword<"?.">;
    };
    $type: TSKindId.SubscriptExpression;
    _object: T.Array | T.ArrowFunctionUFormParameter | T.ArrowFunctionUFormUCallSignature | T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.CallExpressionUFormCall | T.CallExpressionUFormMember | T.CallExpressionUFormTemplateCall | T.Class | T.False | T.FunctionExpression | T.GeneratorFunction | T.Identifier | T.InstantiationExpression | T.InternalModule | T.MemberExpression | T.MetaProperty | T.NewExpression | T.NonNullExpression | T.Null | T.Number | T.Object | T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped | T.Regex | T.ReservedIdentifier | T.SatisfiesExpression | T.String | T.SubscriptExpression | T.Super | T.TemplateString | T.TernaryExpression | T.This | T.True | T.TypeAssertion | T.UnaryExpression | T.Undefined | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _optional_chain: true | undefined;
    _index: T.SequenceExpression;
    object(): T.Expression | T.PrimaryExpression;
    optionalChain(): true | undefined;
    index(): T.SequenceExpression;
    $with: {
        object: (v: NonNullable<T.SubscriptExpression['_object']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        optionalChain: (v: NonNullable<T.SubscriptExpression['_optional_chain']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        index: (v: NonNullable<T.SubscriptExpression['_index']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapSwitchBody(data: T.SwitchBody, tree: TreeHandle): {
    $type: TSKindId.SwitchBody;
    _switch_case: readonly any[];
    switchCases(): (T.SwitchCase | T.SwitchDefault)[];
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
export declare function wrapSwitchCase(data: T.SwitchCase, tree: TreeHandle): {
    $type: TSKindId.SwitchCase;
    _value: T.SequenceExpression;
    _body: readonly T.Statement[];
    value(): T.SequenceExpression;
    bodies(): T.Statement[];
    $with: {
        value: (v: NonNullable<T.SwitchCase['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        bodies: (...v: NonNullable<T.SwitchCase['_body']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapSwitchDefault(data: T.SwitchDefault, tree: TreeHandle): {
    $type: TSKindId.SwitchDefault;
    _body: readonly T.Statement[];
    bodies(): T.Statement[];
    $with: {
        bodies: (...v: NonNullable<T.SwitchDefault['_body']>[number][]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapSwitchStatement(data: T.SwitchStatement, tree: TreeHandle): {
    $type: TSKindId.SwitchStatement;
    _value: T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped;
    _body: T.SwitchBody;
    value(): T.ParenthesizedExpression;
    body(): T.SwitchBody;
    $with: {
        value: (v: NonNullable<T.SwitchStatement['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        body: (v: NonNullable<T.SwitchStatement['_body']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTemplateLiteralType(data: T.TemplateLiteralType, tree: TreeHandle): {
    $type: TSKindId.TemplateLiteralType;
    _template_chars: readonly any[];
    templateChars(): (T.TemplateChars | T.TemplateType)[];
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
export declare function wrapTemplateString(data: T.TemplateString, tree: TreeHandle): {
    $type: TSKindId.TemplateString;
    _template_chars: readonly any[];
    templateChars(): (T.EscapeSequence | T.TemplateChars | T.TemplateSubstitution)[];
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
export declare function wrapTemplateSubstitution(data: T.TemplateSubstitution, tree: TreeHandle): {
    $type: TSKindId.TemplateSubstitution;
    _expressions: any;
    expressions(): T.SequenceExpression;
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
export declare function wrapTemplateType(data: T.TemplateType, tree: TreeHandle): {
    $type: TSKindId.TemplateType;
    _primary_type: any;
    primaryType(): T.InferType | T.PrimaryType;
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
export declare function wrapTernaryExpression(data: T.TernaryExpression, tree: TreeHandle): {
    $type: TSKindId.TernaryExpression;
    _condition: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _consequence: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    _alternative: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    condition(): T.Expression;
    consequence(): T.Expression;
    alternative(): T.Expression;
    $with: {
        condition: (v: NonNullable<T.TernaryExpression['_condition']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        consequence: (v: NonNullable<T.TernaryExpression['_consequence']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        alternative: (v: NonNullable<T.TernaryExpression['_alternative']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapThrowStatement(data: T.ThrowStatement, tree: TreeHandle): {
    $type: TSKindId.ThrowStatement;
    _expressions: any;
    _semicolon: T.AutomaticSemicolon;
    expressions(): T.SequenceExpression;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        expressions: (v: NonNullable<T.ThrowStatement['_expressions']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.ThrowStatement['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _body: T.StatementBlock;
    _handler: T.CatchClause | undefined;
    _finalizer: T.FinallyClause | undefined;
    body(): T.StatementBlock;
    handler(): T.CatchClause | undefined;
    finalizer(): T.FinallyClause | undefined;
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
        handler: (v: NonNullable<T.TryStatement['_handler']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        finalizer: (v: NonNullable<T.TryStatement['_finalizer']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTupleParameter(data: T.TupleParameter, tree: TreeHandle): {
    $type: TSKindId.TupleParameter;
    _name: T.Identifier | T.RestPattern;
    _type: T.TypeAnnotation;
    name(): T.Identifier | T.RestPattern;
    type(): T.TypeAnnotation;
    $with: {
        name: (v: NonNullable<T.TupleParameter['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.TupleParameter['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTupleType(data: T.TupleType, tree: TreeHandle): {
    $type: TSKindId.TupleType;
    _tuple_type_member: readonly any[];
    tupleTypeMembers(): T.TupleTypeMember[];
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
export declare function wrapType(data: T.Type, tree: TreeHandle): T.Type;
export declare function wrapTypeAliasDeclaration(data: T.TypeAliasDeclaration, tree: TreeHandle): {
    $type: TSKindId.TypeAliasDeclaration;
    _name: T.TypeIdentifier;
    _type_parameters: T.TypeParameters | undefined;
    _value: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    _semicolon: T.AutomaticSemicolon;
    name(): T.TypeIdentifier;
    typeParameters(): T.TypeParameters | undefined;
    value(): T.Type;
    semicolon(): T.AutomaticSemicolon;
    $with: {
        name: (v: NonNullable<T.TypeAliasDeclaration['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        typeParameters: (v: NonNullable<T.TypeAliasDeclaration['_type_parameters']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.TypeAliasDeclaration['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.TypeAliasDeclaration['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeAnnotation(data: T.TypeAnnotation, tree: TreeHandle): {
    $type: TSKindId.TypeAnnotation;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    type(): T.Type;
    $with: {
        type: (v: NonNullable<T.TypeAnnotation['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeArguments(data: T.TypeArguments, tree: TreeHandle): {
    $type: TSKindId.TypeArguments;
    _type: readonly any[];
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
export declare function wrapTypeAssertion(data: T.TypeAssertion, tree: TreeHandle): {
    $type: TSKindId.TypeAssertion;
    _type_arguments: T.TypeArguments;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    typeArguments(): T.TypeArguments;
    expression(): T.Expression;
    $with: {
        typeArguments: (v: NonNullable<T.TypeAssertion['_type_arguments']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        expression: (v: NonNullable<T.TypeAssertion['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    __inputHints__?: {
        readonly const_marker?: import("@sittir/types").BooleanKeyword<"const">;
    };
    $type: TSKindId.TypeParameter;
    _const_marker: true | undefined;
    _name: T.TypeIdentifier;
    _constraint: T.Constraint | undefined;
    _value: T.DefaultType | undefined;
    constMarker(): true | undefined;
    name(): T.TypeIdentifier;
    constraint(): T.Constraint | undefined;
    value(): T.DefaultType | undefined;
    $with: {
        constMarker: (v: NonNullable<T.TypeParameter['_const_marker']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        name: (v: NonNullable<T.TypeParameter['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        constraint: (v: NonNullable<T.TypeParameter['_constraint']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.TypeParameter['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeParameters(data: T.TypeParameters, tree: TreeHandle): {
    $type: TSKindId.TypeParameters;
    _type_parameter: readonly T.TypeParameter[];
    typeParameters(): T.TypeParameter[];
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
export declare function wrapTypePredicate(data: T.TypePredicate, tree: TreeHandle): {
    $type: TSKindId.TypePredicate;
    _name: T.PredefinedType | T.This;
    _type: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    name(): T.PredefinedType | T.This;
    type(): T.Type;
    $with: {
        name: (v: NonNullable<T.TypePredicate['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.TypePredicate['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypePredicateAnnotation(data: T.TypePredicateAnnotation, tree: TreeHandle): {
    $type: TSKindId.TypePredicateAnnotation;
    _type_predicate: ":" | T.TypePredicate;
    typePredicate(): ":" | T.TypePredicate;
    $with: {
        typePredicate: (v: NonNullable<T.TypePredicateAnnotation['_type_predicate']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapTypeQuery(data: T.TypeQuery, tree: TreeHandle): {
    $type: TSKindId.TypeQuery;
    _type_query_subscript_expression: T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
    typeQuerySubscriptExpression(): T.Identifier | T.This | T.TypeQueryCallExpression | T.TypeQueryInstantiationExpression | T.TypeQueryMemberExpression | T.TypeQuerySubscriptExpression;
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
export declare function wrapUnaryExpression(data: T.UnaryExpression, tree: TreeHandle): {
    __inputHints__?: {
        readonly operator: import("@sittir/types").KindEnum<"!" | "+" | "-" | "delete" | "typeof" | "void" | "~", TSKindId.Typeof | TSKindId.Bang | TSKindId.Plus | TSKindId.Dash | TSKindId.Tilde | TSKindId.Void | TSKindId.Delete>;
    };
    $type: TSKindId.UnaryExpression;
    _operator: number;
    _argument: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression;
    operator(): number;
    argument(): T.Expression;
    $with: {
        operator: (v: NonNullable<T.UnaryExpression['_operator']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        argument: (v: NonNullable<T.UnaryExpression['_argument']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _left: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType | undefined;
    _right: T.ArrayType | T.ConditionalType | T.ConstructorType | T.FlowMaybeType | T.FunctionType | T.GenericType | T.IndexTypeQuery | T.InferType | T.IntersectionType | T.LiteralType | T.LookupType | T.NestedTypeIdentifier | T.ObjectType | T.ParenthesizedType | T.PredefinedType | T.ReadonlyType | T.TemplateLiteralType | T.This | T.TupleType | T.TypeIdentifier | T.TypeQuery | T.TypeQueryCallExpressionInTypeAnnotation | T.TypeQueryMemberExpressionInTypeAnnotation | T.UnionType;
    left(): T.Type | undefined;
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
export declare function wrapUpdateExpression(data: T.UpdateExpression, tree: TreeHandle): ({
    $variant: 'postfix';
    $type: TSKindId.UpdateExpression;
    _update_expression_postfix: any;
    _update_expression_prefix: any;
    updateExpressionPostfix(): T.UpdateExpressionPostfix | undefined;
    updateExpressionPrefix(): T.UpdateExpressionPrefix | undefined;
    $with: {
        updateExpressionPostfix: (v: T.UpdateExpressionPostfix) => (/*elided*/ any | {
            $variant: 'prefix';
            $type: TSKindId.UpdateExpression;
            _update_expression_postfix: any;
            _update_expression_prefix: any;
            updateExpressionPostfix(): T.UpdateExpressionPostfix | undefined;
            updateExpressionPrefix(): T.UpdateExpressionPrefix | undefined;
            $with: {
                updateExpressionPostfix: /*elided*/ any;
                updateExpressionPrefix: (v: T.UpdateExpressionPrefix) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        updateExpressionPrefix: (v: T.UpdateExpressionPrefix) => (/*elided*/ any | {
            $variant: 'prefix';
            $type: TSKindId.UpdateExpression;
            _update_expression_postfix: any;
            _update_expression_prefix: any;
            updateExpressionPostfix(): T.UpdateExpressionPostfix | undefined;
            updateExpressionPrefix(): T.UpdateExpressionPrefix | undefined;
            $with: {
                updateExpressionPostfix: (v: T.UpdateExpressionPostfix) => (/*elided*/ any | /*elided*/ any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                updateExpressionPrefix: /*elided*/ any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} | {
    $variant: 'prefix';
    $type: TSKindId.UpdateExpression;
    _update_expression_postfix: any;
    _update_expression_prefix: any;
    updateExpressionPostfix(): T.UpdateExpressionPostfix | undefined;
    updateExpressionPrefix(): T.UpdateExpressionPrefix | undefined;
    $with: {
        updateExpressionPostfix: (v: T.UpdateExpressionPostfix) => (any | {
            $variant: 'prefix';
            $type: TSKindId.UpdateExpression;
            _update_expression_postfix: any;
            _update_expression_prefix: any;
            updateExpressionPostfix(): T.UpdateExpressionPostfix | undefined;
            updateExpressionPrefix(): T.UpdateExpressionPrefix | undefined;
            $with: {
                updateExpressionPostfix: any;
                updateExpressionPrefix: (v: T.UpdateExpressionPrefix) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        updateExpressionPrefix: (v: T.UpdateExpressionPrefix) => (any | {
            $variant: 'prefix';
            $type: TSKindId.UpdateExpression;
            _update_expression_postfix: any;
            _update_expression_prefix: any;
            updateExpressionPostfix(): T.UpdateExpressionPostfix | undefined;
            updateExpressionPrefix(): T.UpdateExpressionPrefix | undefined;
            $with: {
                updateExpressionPostfix: (v: T.UpdateExpressionPostfix) => (any | any) & {
                    $render(): string;
                    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
                    $replace(target: {
                        range(): import("@sittir/types").ByteRange;
                    }): import("@sittir/types").Edit;
                    $trivia(...args: (T.Comment | {
                        leading?: (T.Comment)[];
                        trailing?: (T.Comment)[];
                    })[]): AnyNodeData;
                };
                updateExpressionPrefix: any;
            };
        }) & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
}) & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapVariableDeclaration(data: T.VariableDeclaration, tree: TreeHandle): {
    $type: TSKindId.VariableDeclaration;
    _declarators: readonly T.VariableDeclarator[];
    _semicolon: T.AutomaticSemicolon;
    declarators(): T.VariableDeclarator[];
    semicolon(): T.AutomaticSemicolon;
    $with: {
        declarators: (v_0: T.VariableDeclarator, ...v: T.VariableDeclarator[]) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        semicolon: (v: NonNullable<T.VariableDeclaration['_semicolon']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
    $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
    $replace(target: {
        range(): import("@sittir/types").ByteRange;
    }): import("@sittir/types").Edit;
    $trivia(...args: (T.Comment | {
        leading?: (T.Comment)[];
        trailing?: (T.Comment)[];
    })[]): AnyNodeData;
};
export declare function wrapVariableDeclarator(data: T.VariableDeclarator, tree: TreeHandle): {
    $type: TSKindId.VariableDeclarator;
    _name: T.ArrayPattern | T.Identifier | T.ObjectPattern;
    _type: T.TypeAnnotation | undefined;
    _value: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression | undefined;
    name(): T.Identifier | T.DestructuringPattern;
    type(): T.TypeAnnotation | undefined;
    value(): T.Expression | undefined;
    $with: {
        name: (v: NonNullable<T.VariableDeclarator['_name']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        type: (v: NonNullable<T.VariableDeclarator['_type']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
        value: (v: NonNullable<T.VariableDeclarator['_value']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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
    _condition: T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped;
    _body: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.BreakStatement | T.ClassDeclaration | T.ContinueStatement | T.DebuggerStatement | T.DoStatement | T.EnumDeclaration | T.ExportStatementUFormDefault | T.ExportStatementUFormEqualsExport | T.ExportStatementUFormNamespaceExport | T.ExportStatementUFormTypeExport | T.ExpressionStatement | T.ForInStatement | T.ForStatement | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.IfStatement | T.ImportAlias | T.ImportStatement | T.InterfaceDeclaration | T.InternalModule | T.LabeledStatement | T.LexicalDeclaration | T.Module | T.ReturnStatement | T.StatementBlock | T.SwitchStatement | T.ThrowStatement | T.TryStatement | T.TypeAliasDeclaration | T.VariableDeclaration | T.WhileStatement | T.WithStatement;
    condition(): T.ParenthesizedExpression;
    body(): T.Statement;
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
    };
} & {
    $render(): string;
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
    $type: TSKindId.WithStatement;
    _object: T.ParenthesizedExpressionUFormSequence | T.ParenthesizedExpressionUFormTyped;
    _body: T.AbstractClassDeclaration | T.AmbientDeclarationUFormDeclaration | T.AmbientDeclarationUFormGlobal | T.AmbientDeclarationUFormModule | T.BreakStatement | T.ClassDeclaration | T.ContinueStatement | T.DebuggerStatement | T.DoStatement | T.EnumDeclaration | T.ExportStatementUFormDefault | T.ExportStatementUFormEqualsExport | T.ExportStatementUFormNamespaceExport | T.ExportStatementUFormTypeExport | T.ExpressionStatement | T.ForInStatement | T.ForStatement | T.FunctionDeclaration | T.FunctionSignature | T.GeneratorFunctionDeclaration | T.IfStatement | T.ImportAlias | T.ImportStatement | T.InterfaceDeclaration | T.InternalModule | T.LabeledStatement | T.LexicalDeclaration | T.Module | T.ReturnStatement | T.StatementBlock | T.SwitchStatement | T.ThrowStatement | T.TryStatement | T.TypeAliasDeclaration | T.VariableDeclaration | T.WhileStatement | T.WithStatement;
    object(): T.ParenthesizedExpression;
    body(): T.Statement;
    $with: {
        object: (v: NonNullable<T.WithStatement['_object']>) => /*elided*/ any & {
            $render(): string;
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
export declare function wrapYieldExpression(data: T.YieldExpression, tree: TreeHandle): {
    $type: TSKindId.YieldExpression;
    _expression: T.AsExpression | T.AssignmentExpression | T.AugmentedAssignmentExpression | T.AwaitExpression | T.BinaryExpression | T.InstantiationExpression | T.InternalModule | T.NewExpression | T.SatisfiesExpression | T.TernaryExpression | T.TypeAssertion | T.UnaryExpression | T.UpdateExpressionUFormPostfix | T.UpdateExpressionUFormPrefix | T.YieldExpression | undefined;
    expression(): T.Expression | undefined;
    $with: {
        expression: (v: NonNullable<T.YieldExpression['_expression']>) => /*elided*/ any & {
            $render(): string;
            $toEdit(startOrRange: number | import("@sittir/types").ByteRange, endPos?: number): import("@sittir/types").Edit;
            $replace(target: {
                range(): import("@sittir/types").ByteRange;
            }): import("@sittir/types").Edit;
            $trivia(...args: (T.Comment | {
                leading?: (T.Comment)[];
                trailing?: (T.Comment)[];
            })[]): AnyNodeData;
        };
    };
} & {
    $render(): string;
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