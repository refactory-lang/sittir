import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, Identifier, ModItem, VisibilityModifier } from '../types.js';


class ModBuilder extends Builder<ModItem> {
  private _body?: Builder;
  private _name: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  children(...value: Builder[]): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ModItem;
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

export type { ModBuilder };

export function mod(name: Builder): ModBuilder {
  return new ModBuilder(name);
}

export interface ModItemOptions {
  body?: Builder<DeclarationList>;
  name: Builder<Identifier> | string;
  children?: Builder<VisibilityModifier> | (Builder<VisibilityModifier>)[];
}

export namespace mod {
  export function from(options: ModItemOptions): ModBuilder {
    const _ctor = options.name;
    const b = new ModBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
