import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, Identifier, ModItem, VisibilityModifier } from '../types.js';
import { declaration_list } from './declaration-list.js';
import type { DeclarationListOptions } from './declaration-list.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';


class ModBuilder extends Builder<ModItem> {
  private _name: Builder<Identifier>;
  private _body?: Builder<DeclarationList>;
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
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ModItem {
    return {
      kind: 'mod_item',
      name: this._name.build(ctx),
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as ModItem;
  }

  override get nodeKind(): 'mod_item' { return 'mod_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'mod', type: 'mod' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ModBuilder };

export function mod(name: Builder<Identifier>): ModBuilder {
  return new ModBuilder(name);
}

export interface ModItemOptions {
  nodeKind: 'mod_item';
  name: Builder<Identifier> | string;
  body?: Builder<DeclarationList> | Omit<DeclarationListOptions, 'nodeKind'>;
  children?: Builder<VisibilityModifier> | Omit<VisibilityModifierOptions, 'nodeKind'> | (Builder<VisibilityModifier> | Omit<VisibilityModifierOptions, 'nodeKind'>)[];
}

export namespace mod {
  export function from(options: Omit<ModItemOptions, 'nodeKind'>): ModBuilder {
    const _ctor = options.name;
    const b = new ModBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : declaration_list.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : visibility_modifier.from(_x)));
    }
    return b;
  }
}
