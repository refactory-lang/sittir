import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AddingTypeAnnotation, Identifier, IndexSignature, MappedTypeClause, OmittingTypeAnnotation, OptingTypeAnnotation, TypeAnnotation } from '../types.js';


class IndexSignatureBuilder extends Builder<IndexSignature> {
  private _indexType?: Builder;
  private _name?: Builder<Identifier>;
  private _sign?: Builder;
  private _type: Builder<AddingTypeAnnotation | OmittingTypeAnnotation | OptingTypeAnnotation | TypeAnnotation>;
  private _children: Builder<MappedTypeClause>[] = [];

  constructor(type_: Builder<AddingTypeAnnotation | OmittingTypeAnnotation | OptingTypeAnnotation | TypeAnnotation>) {
    super();
    this._type = type_;
  }

  indexType(value: Builder): this {
    this._indexType = value;
    return this;
  }

  name(value: Builder<Identifier>): this {
    this._name = value;
    return this;
  }

  sign(value: Builder): this {
    this._sign = value;
    return this;
  }

  children(...value: Builder<MappedTypeClause>[]): this {
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
      indexType: this._indexType?.build(ctx),
      name: this._name?.build(ctx),
      sign: this._sign?.build(ctx),
      type: this._type.build(ctx),
      children: this._children[0]?.build(ctx),
    } as IndexSignature;
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

export type { IndexSignatureBuilder };

export function index_signature(type_: Builder<AddingTypeAnnotation | OmittingTypeAnnotation | OptingTypeAnnotation | TypeAnnotation>): IndexSignatureBuilder {
  return new IndexSignatureBuilder(type_);
}

export interface IndexSignatureOptions {
  indexType?: Builder;
  name?: Builder<Identifier> | string;
  sign?: Builder;
  type: Builder<AddingTypeAnnotation | OmittingTypeAnnotation | OptingTypeAnnotation | TypeAnnotation>;
  children?: Builder<MappedTypeClause> | (Builder<MappedTypeClause>)[];
}

export namespace index_signature {
  export function from(options: IndexSignatureOptions): IndexSignatureBuilder {
    const b = new IndexSignatureBuilder(options.type);
    if (options.indexType !== undefined) b.indexType(options.indexType);
    if (options.name !== undefined) {
      const _v = options.name;
      b.name(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.sign !== undefined) b.sign(options.sign);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
