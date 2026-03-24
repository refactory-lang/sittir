import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, ExternModifier, ForeignModItem, VisibilityModifier } from '../types.js';
import { declaration_list } from './declaration-list.js';
import type { DeclarationListOptions } from './declaration-list.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';
import { extern_modifier } from './extern-modifier.js';
import type { ExternModifierOptions } from './extern-modifier.js';


class ForeignModBuilder extends Builder<ForeignModItem> {
  private _body?: Builder<DeclarationList>;
  private _children: Builder<VisibilityModifier | ExternModifier>[] = [];

  constructor(...children: Builder<VisibilityModifier | ExternModifier>[]) {
    super();
    this._children = children;
  }

  body(value: Builder<DeclarationList>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForeignModItem {
    return {
      kind: 'foreign_mod_item',
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as ForeignModItem;
  }

  override get nodeKind(): 'foreign_mod_item' { return 'foreign_mod_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForeignModBuilder };

export function foreign_mod(...children: Builder<VisibilityModifier | ExternModifier>[]): ForeignModBuilder {
  return new ForeignModBuilder(...children);
}

export interface ForeignModItemOptions {
  nodeKind: 'foreign_mod_item';
  body?: Builder<DeclarationList> | Omit<DeclarationListOptions, 'nodeKind'>;
  children?: Builder<VisibilityModifier | ExternModifier> | VisibilityModifierOptions | ExternModifierOptions | (Builder<VisibilityModifier | ExternModifier> | VisibilityModifierOptions | ExternModifierOptions)[];
}

export namespace foreign_mod {
  export function from(options: Omit<ForeignModItemOptions, 'nodeKind'>): ForeignModBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ForeignModBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'visibility_modifier': return visibility_modifier.from(_v);   case 'extern_modifier': return extern_modifier.from(_v); } throw new Error('unreachable'); }));
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : declaration_list.from(_v));
    }
    return b;
  }
}
