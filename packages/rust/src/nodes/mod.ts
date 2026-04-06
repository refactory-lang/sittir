import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ModItem } from '../types.js';


class ModBuilder extends BaseBuilder<ModItem> {
  private _body?: BaseBuilder;
  private _name: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  body(value: BaseBuilder): this {
    this._body = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('mod');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(';');
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
    return parts;
  }
}

export function mod(name: BaseBuilder): ModBuilder {
  return new ModBuilder(name);
}
