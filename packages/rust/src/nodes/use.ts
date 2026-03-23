import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, ScopedUseList, Self, Super, UseAsClause, UseDeclaration, UseList, UseWildcard, VisibilityModifier } from '../types.js';


class UseBuilder extends Builder<UseDeclaration> {
  private _argument: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | ScopedUseList | Self | Super | UseAsClause | UseList | UseWildcard>;
  private _children: Builder<VisibilityModifier>[] = [];

  constructor(argument: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | ScopedUseList | Self | Super | UseAsClause | UseList | UseWildcard>) {
    super();
    this._argument = argument;
  }

  children(...value: Builder<VisibilityModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('use');
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseDeclaration {
    return {
      kind: 'use_declaration',
      argument: this._argument.build(ctx),
      children: this._children[0]?.build(ctx),
    } as UseDeclaration;
  }

  override get nodeKind(): string { return 'use_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'use', type: 'use' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { UseBuilder };

export function use_(argument: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | ScopedUseList | Self | Super | UseAsClause | UseList | UseWildcard>): UseBuilder {
  return new UseBuilder(argument);
}

export interface UseDeclarationOptions {
  argument: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | ScopedUseList | Self | Super | UseAsClause | UseList | UseWildcard>;
  children?: Builder<VisibilityModifier> | (Builder<VisibilityModifier>)[];
}

export namespace use_ {
  export function from(options: UseDeclarationOptions): UseBuilder {
    const b = new UseBuilder(options.argument);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
