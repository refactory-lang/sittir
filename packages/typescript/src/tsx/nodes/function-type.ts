import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FormalParameters, FunctionType, TypeParameters, TypePredicate } from '../types.js';


class FunctionTypeBuilder extends Builder<FunctionType> {
  private _parameters: Builder<FormalParameters>;
  private _returnType!: Builder<TypePredicate>;
  private _typeParameters?: Builder<TypeParameters>;

  constructor(parameters: Builder<FormalParameters>) {
    super();
    this._parameters = parameters;
  }

  returnType(value: Builder<TypePredicate>): this {
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
    parts.push('=>');
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionType {
    return {
      kind: 'function_type',
      parameters: this._parameters.build(ctx),
      returnType: this._returnType?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
    } as FunctionType;
  }

  override get nodeKind(): string { return 'function_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    parts.push({ kind: 'token', text: '=>', type: '=>' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    return parts;
  }
}

export type { FunctionTypeBuilder };

export function function_type(parameters: Builder<FormalParameters>): FunctionTypeBuilder {
  return new FunctionTypeBuilder(parameters);
}

export interface FunctionTypeOptions {
  parameters: Builder<FormalParameters>;
  returnType: Builder<TypePredicate>;
  typeParameters?: Builder<TypeParameters>;
}

export namespace function_type {
  export function from(options: FunctionTypeOptions): FunctionTypeBuilder {
    const b = new FunctionTypeBuilder(options.parameters);
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
