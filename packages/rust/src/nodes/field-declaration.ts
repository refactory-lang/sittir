import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldDeclaration, FieldIdentifier, Type, VisibilityModifier } from '../types.js';


class FieldBuilder extends Builder<FieldDeclaration> {
  private _name: Builder;
  private _type!: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldDeclaration {
    return {
      kind: 'field_declaration',
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FieldDeclaration;
  }

  override get nodeKind(): string { return 'field_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { FieldBuilder };

export function field(name: Builder): FieldBuilder {
  return new FieldBuilder(name);
}

export interface FieldDeclarationOptions {
  name: Builder<FieldIdentifier> | string;
  type: Builder<Type>;
  children?: Builder<VisibilityModifier> | (Builder<VisibilityModifier>)[];
}

export namespace field {
  export function from(options: FieldDeclarationOptions): FieldBuilder {
    const _ctor = options.name;
    const b = new FieldBuilder(typeof _ctor === 'string' ? new LeafBuilder('field_identifier', _ctor) : _ctor);
    if (options.type !== undefined) b.type(options.type);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
