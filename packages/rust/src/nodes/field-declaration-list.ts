import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, FieldDeclaration, FieldDeclarationList } from '../types.js';


class FieldDeclarationListBuilder extends Builder<FieldDeclarationList> {
  private _children: Builder<AttributeItem | FieldDeclaration>[] = [];

  constructor() { super(); }

  children(...value: Builder<AttributeItem | FieldDeclaration>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    if (this._children[3]) parts.push(this.renderChild(this._children[3]!, ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldDeclarationList {
    return {
      kind: 'field_declaration_list',
      children: this._children.map(c => c.build(ctx)),
    } as FieldDeclarationList;
  }

  override get nodeKind(): string { return 'field_declaration_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    if (this._children[3]) parts.push({ kind: 'builder', builder: this._children[3]! });
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { FieldDeclarationListBuilder };

export function field_declaration_list(): FieldDeclarationListBuilder {
  return new FieldDeclarationListBuilder();
}

export interface FieldDeclarationListOptions {
  children?: Builder<AttributeItem | FieldDeclaration> | (Builder<AttributeItem | FieldDeclaration>)[];
}

export namespace field_declaration_list {
  export function from(options: FieldDeclarationListOptions): FieldDeclarationListBuilder {
    const b = new FieldDeclarationListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
