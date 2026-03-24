import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AddingTypeAnnotation, Identifier, IndexSignature, MappedTypeClause, OmittingTypeAnnotation, OptingTypeAnnotation, Type, TypeAnnotation } from '../types.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';
import { omitting_type_annotation } from './omitting-type-annotation.js';
import type { OmittingTypeAnnotationOptions } from './omitting-type-annotation.js';
import { adding_type_annotation } from './adding-type-annotation.js';
import type { AddingTypeAnnotationOptions } from './adding-type-annotation.js';
import { opting_type_annotation } from './opting-type-annotation.js';
import type { OptingTypeAnnotationOptions } from './opting-type-annotation.js';
import { mapped_type_clause } from './mapped-type-clause.js';
import type { MappedTypeClauseOptions } from './mapped-type-clause.js';


class IndexSignatureBuilder extends Builder<IndexSignature> {
  private _sign?: Builder;
  private _name?: Builder<Identifier>;
  private _indexType?: Builder<Type>;
  private _type: Builder<TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation>;
  private _children: Builder<MappedTypeClause>[] = [];

  constructor(type_: Builder<TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation>) {
    super();
    this._type = type_;
  }

  sign(value: Builder): this {
    this._sign = value;
    return this;
  }

  name(value: Builder<Identifier>): this {
    this._name = value;
    return this;
  }

  indexType(value: Builder<Type>): this {
    this._indexType = value;
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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._indexType) {
      parts.push(':');
      if (this._indexType) parts.push(this.renderChild(this._indexType, ctx));
    }
    parts.push(']');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IndexSignature {
    return {
      kind: 'index_signature',
      sign: this._sign ? this.buildChild(this._sign, ctx) : undefined,
      name: this._name ? this._name.build(ctx) : undefined,
      indexType: this._indexType ? this._indexType.build(ctx) : undefined,
      type: this._type.build(ctx),
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as IndexSignature;
  }

  override get nodeKind(): 'index_signature' { return 'index_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._sign) {
      if (this._sign) parts.push({ kind: 'builder', builder: this._sign, fieldName: 'sign' });
      parts.push({ kind: 'token', text: 'readonly', type: 'readonly' });
    }
    parts.push({ kind: 'token', text: '[', type: '[' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._indexType) {
      parts.push({ kind: 'token', text: ':', type: ':' });
      if (this._indexType) parts.push({ kind: 'builder', builder: this._indexType, fieldName: 'indexType' });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { IndexSignatureBuilder };

export function index_signature(type_: Builder<TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation>): IndexSignatureBuilder {
  return new IndexSignatureBuilder(type_);
}

export interface IndexSignatureOptions {
  nodeKind: 'index_signature';
  sign?: Builder;
  name?: Builder<Identifier> | string;
  indexType?: Builder<Type>;
  type: Builder<TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation> | TypeAnnotationOptions | OmittingTypeAnnotationOptions | AddingTypeAnnotationOptions | OptingTypeAnnotationOptions;
  children?: Builder<MappedTypeClause> | Omit<MappedTypeClauseOptions, 'nodeKind'> | (Builder<MappedTypeClause> | Omit<MappedTypeClauseOptions, 'nodeKind'>)[];
}

export namespace index_signature {
  export function from(options: Omit<IndexSignatureOptions, 'nodeKind'>): IndexSignatureBuilder {
    const _raw = options.type;
    let _ctor: Builder<TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'type_annotation': _ctor = type_annotation.from(_raw); break;
        case 'omitting_type_annotation': _ctor = omitting_type_annotation.from(_raw); break;
        case 'adding_type_annotation': _ctor = adding_type_annotation.from(_raw); break;
        case 'opting_type_annotation': _ctor = opting_type_annotation.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new IndexSignatureBuilder(_ctor);
    if (options.sign !== undefined) b.sign(options.sign);
    if (options.name !== undefined) {
      const _v = options.name;
      b.name(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.indexType !== undefined) b.indexType(options.indexType);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : mapped_type_clause.from(_x)));
    }
    return b;
  }
}
