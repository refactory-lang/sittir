import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation, CallSignature, FormalParameters, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';


class CallSignatureBuilder extends Builder<CallSignature> {
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters: Builder<FormalParameters>;
  private _returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;

  constructor(parameters: Builder<FormalParameters>) {
    super();
    this._parameters = parameters;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  returnType(value: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>): this {
    this._returnType = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CallSignature {
    return {
      kind: 'call_signature',
      typeParameters: this._typeParameters?.build(ctx),
      parameters: this._parameters.build(ctx),
      returnType: this._returnType?.build(ctx),
    } as CallSignature;
  }

  override get nodeKind(): string { return 'call_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    return parts;
  }
}

export type { CallSignatureBuilder };

export function call_signature(parameters: Builder<FormalParameters>): CallSignatureBuilder {
  return new CallSignatureBuilder(parameters);
}

export interface CallSignatureOptions {
  typeParameters?: Builder<TypeParameters> | TypeParametersOptions;
  parameters: Builder<FormalParameters> | FormalParametersOptions;
  returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
}

export namespace call_signature {
  export function from(options: CallSignatureOptions): CallSignatureBuilder {
    const _ctor = options.parameters;
    const b = new CallSignatureBuilder(_ctor instanceof Builder ? _ctor : formal_parameters.from(_ctor as FormalParametersOptions));
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v as TypeParametersOptions));
    }
    if (options.returnType !== undefined) b.returnType(options.returnType);
    return b;
  }
}
