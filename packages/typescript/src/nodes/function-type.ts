import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FunctionType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FunctionTypeBuilder extends BaseBuilder<FunctionType> {
  private _parameters: Child;
  private _returnType!: Child;
  private _typeParameters?: Child;

  constructor(parameters: Child) {
    super();
    this._parameters = parameters;
  }

  returnType(value: Child): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Child): this {
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
      parameters: this.renderChild(this._parameters, ctx),
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
    } as unknown as FunctionType;
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

export function function_type(parameters: Child): FunctionTypeBuilder {
  return new FunctionTypeBuilder(parameters);
}
