import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { IndexSignature } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class IndexSignatureBuilder extends BaseBuilder<IndexSignature> {
  private _indexType?: Child;
  private _name?: Child;
  private _sign?: Child;
  private _type: Child;
  private _children: Child[] = [];

  constructor(type_: Child) {
    super();
    this._type = type_;
  }

  indexType(value: Child): this {
    this._indexType = value;
    return this;
  }

  name(value: Child): this {
    this._name = value;
    return this;
  }

  sign(value: Child): this {
    this._sign = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) {
      parts.push(this.renderChildren(this._children, ' ', ctx));
    }
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._indexType) parts.push(this.renderChild(this._indexType, ctx));
    if (this._sign) parts.push(this.renderChild(this._sign, ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._indexType) parts.push({ kind: 'builder', builder: this._indexType, fieldName: 'indexType' });
    if (this._sign) parts.push({ kind: 'builder', builder: this._sign, fieldName: 'sign' });
    return parts;
  }
}

export function index_signature(type_: Child): IndexSignatureBuilder {
  return new IndexSignatureBuilder(type_);
}
