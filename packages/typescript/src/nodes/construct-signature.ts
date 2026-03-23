import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstructSignature } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ConstructSignatureBuilder extends BaseBuilder<ConstructSignature> {
  private _parameters: Child;
  private _type?: Child;
  private _typeParameters?: Child;

  constructor(parameters: Child) {
    super();
    this._parameters = parameters;
  }

  type(value: Child): this {
    this._type = value;
    return this;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('new');
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstructSignature {
    return {
      kind: 'construct_signature',
      parameters: this.renderChild(this._parameters, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
    } as unknown as ConstructSignature;
  }

  override get nodeKind(): string { return 'construct_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'new', type: 'new' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export function construct_signature(parameters: Child): ConstructSignatureBuilder {
  return new ConstructSignatureBuilder(parameters);
}
