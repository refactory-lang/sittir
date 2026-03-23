import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FunctionSignature } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FunctionSignatureBuilder extends BaseBuilder<FunctionSignature> {
  private _name: Child;
  private _parameters!: Child;
  private _returnType?: Child;
  private _typeParameters?: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  parameters(value: Child): this {
    this._parameters = value;
    return this;
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
    parts.push('function');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionSignature {
    return {
      kind: 'function_signature',
      name: this.renderChild(this._name, ctx),
      parameters: this._parameters ? this.renderChild(this._parameters, ctx) : undefined,
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
    } as unknown as FunctionSignature;
  }

  override get nodeKind(): string { return 'function_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'function', type: 'function' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    return parts;
  }
}

export function function_signature(name: Child): FunctionSignatureBuilder {
  return new FunctionSignatureBuilder(name);
}
