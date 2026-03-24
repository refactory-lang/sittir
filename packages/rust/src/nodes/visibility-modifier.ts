import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, Self, Super, VisibilityModifier } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';


class VisibilityModifierBuilder extends Builder<VisibilityModifier> {
  private _children: Builder<Crate | Self | Super | Identifier | Metavariable | ScopedIdentifier>[] = [];

  constructor() { super(); }

  children(...value: Builder<Crate | Self | Super | Identifier | Metavariable | ScopedIdentifier>[]): this {
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
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as VisibilityModifier;
  }

  override get nodeKind(): 'visibility_modifier' { return 'visibility_modifier'; }

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
  nodeKind: 'visibility_modifier';
  children?: Builder<Crate | Self | Super | Identifier | Metavariable | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'> | (Builder<Crate | Self | Super | Identifier | Metavariable | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'>)[];
}

export namespace visibility_modifier {
  export function from(input: Omit<VisibilityModifierOptions, 'nodeKind'> | Builder<Crate | Self | Super | Identifier | Metavariable | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'> | (Builder<Crate | Self | Super | Identifier | Metavariable | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'>)[]): VisibilityModifierBuilder {
    const options: Omit<VisibilityModifierOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<VisibilityModifierOptions, 'nodeKind'>
      : { children: input } as Omit<VisibilityModifierOptions, 'nodeKind'>;
    const b = new VisibilityModifierBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : scoped_identifier.from(_x)));
    }
    return b;
  }
}
