import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation, CallSignature, FormalParameters, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';


class CallSignatureBuilder extends Builder<CallSignature> {
  private _parameters: Builder<FormalParameters>;
  private _returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  private _typeParameters?: Builder<TypeParameters>;

  constructor(parameters: Builder<FormalParameters>) {
    super();
    this._parameters = parameters;
  }

  returnType(value: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
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
      parameters: this._parameters.build(ctx),
      returnType: this._returnType?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
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
  parameters: Builder<FormalParameters>;
  returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  typeParameters?: Builder<TypeParameters>;
}

export namespace call_signature {
  export function from(options: CallSignatureOptions): CallSignatureBuilder {
    const b = new CallSignatureBuilder(options.parameters);
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
