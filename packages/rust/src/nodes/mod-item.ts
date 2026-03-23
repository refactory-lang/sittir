import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, Identifier, ModItem, VisibilityModifier } from '../types.js';


class ModItemBuilder extends Builder<ModItem> {
  private _body?: Builder<DeclarationList>;
  private _name: Builder<Identifier>;
  private _children: Builder<VisibilityModifier>[] = [];

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<DeclarationList>): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<VisibilityModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('mod');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(';');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ModItem {
    return {
      kind: 'mod_item',
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
      children: this._children[0]?.build(ctx),
    } as ModItem;
  }

  override get nodeKind(): string { return 'mod_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'mod', type: 'mod' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ';', type: ';' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ModItemBuilder };

export function mod_item(name: Builder<Identifier>): ModItemBuilder {
  return new ModItemBuilder(name);
}

export interface ModItemOptions {
  body?: Builder<DeclarationList>;
  name: Builder<Identifier> | string;
  children?: Builder<VisibilityModifier> | (Builder<VisibilityModifier>)[];
}

export namespace mod_item {
  export function from(options: ModItemOptions): ModItemBuilder {
    const _ctor = options.name;
    const b = new ModItemBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
