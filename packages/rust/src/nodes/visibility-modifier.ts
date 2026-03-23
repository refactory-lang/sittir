import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, Self, Super, VisibilityModifier } from '../types.js';


class VisibilityModifierBuilder extends Builder<VisibilityModifier> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): VisibilityModifier {
    return {
      kind: 'visibility_modifier',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as VisibilityModifier;
  }

  override get nodeKind(): string { return 'visibility_modifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { VisibilityModifierBuilder };

export function visibility_modifier(): VisibilityModifierBuilder {
  return new VisibilityModifierBuilder();
}

export interface VisibilityModifierOptions {
  children?: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super> | (Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>)[];
}

export namespace visibility_modifier {
  export function from(options: VisibilityModifierOptions): VisibilityModifierBuilder {
    const b = new VisibilityModifierBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
