import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, FieldDeclaration, FieldDeclarationList } from '../types.js';
import { attribute } from './attribute-item.js';
import type { AttributeItemOptions } from './attribute-item.js';
import { field_declaration } from './field-declaration.js';
import type { FieldDeclarationOptions } from './field-declaration.js';


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

  override get nodeKind(): 'field_declaration_list' { return 'field_declaration_list'; }

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
  nodeKind: 'field_declaration_list';
  children?: Builder<AttributeItem | FieldDeclaration> | AttributeItemOptions | FieldDeclarationOptions | (Builder<AttributeItem | FieldDeclaration> | AttributeItemOptions | FieldDeclarationOptions)[];
}

export namespace field_declaration_list {
  export function from(input: Omit<FieldDeclarationListOptions, 'nodeKind'> | Builder<AttributeItem | FieldDeclaration> | AttributeItemOptions | FieldDeclarationOptions | (Builder<AttributeItem | FieldDeclaration> | AttributeItemOptions | FieldDeclarationOptions)[]): FieldDeclarationListBuilder {
    const options: Omit<FieldDeclarationListOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<FieldDeclarationListOptions, 'nodeKind'>
      : { children: input } as Omit<FieldDeclarationListOptions, 'nodeKind'>;
    const b = new FieldDeclarationListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'attribute_item': return attribute.from(_v);   case 'field_declaration': return field_declaration.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
