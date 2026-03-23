import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallSignature } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class CallSignatureBuilder extends BaseBuilder<CallSignature> {
  private _parameters: Child;
  private _returnType?: Child;
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
    parts.push('(' + (this._parameters ? this.renderChild(this._parameters, ctx) : '') + ')');
    if (this._returnType) parts.push('->', this.renderChild(this._returnType, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CallSignature {
    return {
      kind: 'call_signature',
      parameters: this.renderChild(this._parameters, ctx),
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
    } as unknown as CallSignature;
  }

  override get nodeKind(): string { return 'call_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    return parts;
  }
}

export function call_signature(parameters: Child): CallSignatureBuilder {
  return new CallSignatureBuilder(parameters);
}
