import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { IndexSignature } from '../types.js';


class IndexSignatureBuilder extends BaseBuilder<IndexSignature> {
  private _indexType?: BaseBuilder;
  private _name?: BaseBuilder;
  private _sign?: BaseBuilder;
  private _type: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(type_: BaseBuilder) {
    super();
    this._type = type_;
  }

  indexType(value: BaseBuilder): this {
    this._indexType = value;
    return this;
  }

  name(value: BaseBuilder): this {
    this._name = value;
    return this;
  }

  sign(value: BaseBuilder): this {
    this._sign = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._sign) {
      if (this._sign) parts.push(this.renderChild(this._sign, ctx));
      parts.push('readonly');
    }
    parts.push('[');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._indexType) parts.push(this.renderChild(this._indexType, ctx));
    parts.push(']');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IndexSignature {
    return {
      kind: 'index_signature',
      indexType: this._indexType ? this.renderChild(this._indexType, ctx) : undefined,
      name: this._name ? this.renderChild(this._name, ctx) : undefined,
      sign: this._sign ? this.renderChild(this._sign, ctx) : undefined,
      type: this.renderChild(this._type, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as IndexSignature;
  }

  override get nodeKind(): string { return 'index_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._sign) {
      if (this._sign) parts.push({ kind: 'builder', builder: this._sign, fieldName: 'sign' });
      parts.push({ kind: 'token', text: 'readonly', type: 'readonly' });
    }
    parts.push({ kind: 'token', text: '[', type: '[' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._indexType) parts.push({ kind: 'builder', builder: this._indexType, fieldName: 'indexType' });
    parts.push({ kind: 'token', text: ']', type: ']' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export function index_signature(type_: BaseBuilder): IndexSignatureBuilder {
  return new IndexSignatureBuilder(type_);
}
