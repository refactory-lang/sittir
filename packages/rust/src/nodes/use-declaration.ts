import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, ScopedUseList, Self, Super, UseAsClause, UseDeclaration, UseList, UseWildcard, VisibilityModifier } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { use_as_clause } from './use-as-clause.js';
import type { UseAsClauseOptions } from './use-as-clause.js';
import { use_list } from './use-list.js';
import type { UseListOptions } from './use-list.js';
import { scoped_use_list } from './scoped-use-list.js';
import type { ScopedUseListOptions } from './scoped-use-list.js';
import { use_wildcard } from './use-wildcard.js';
import type { UseWildcardOptions } from './use-wildcard.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';


class UseDeclarationBuilder extends Builder<UseDeclaration> {
  private _argument: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard>;
  private _children: Builder<VisibilityModifier>[] = [];

  constructor(argument: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard>) {
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
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as UseDeclaration;
  }

  override get nodeKind(): 'use_declaration' { return 'use_declaration'; }

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

export type { UseDeclarationBuilder };

export function use_declaration(argument: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard>): UseDeclarationBuilder {
  return new UseDeclarationBuilder(argument);
}

export interface UseDeclarationOptions {
  nodeKind: 'use_declaration';
  argument: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard> | ScopedIdentifierOptions | UseAsClauseOptions | UseListOptions | ScopedUseListOptions | UseWildcardOptions;
  children?: Builder<VisibilityModifier> | Omit<VisibilityModifierOptions, 'nodeKind'> | (Builder<VisibilityModifier> | Omit<VisibilityModifierOptions, 'nodeKind'>)[];
}

export namespace use_declaration {
  export function from(options: Omit<UseDeclarationOptions, 'nodeKind'>): UseDeclarationBuilder {
    const _raw = options.argument;
    let _ctor: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'scoped_identifier': _ctor = scoped_identifier.from(_raw); break;
        case 'use_as_clause': _ctor = use_as_clause.from(_raw); break;
        case 'use_list': _ctor = use_list.from(_raw); break;
        case 'scoped_use_list': _ctor = scoped_use_list.from(_raw); break;
        case 'use_wildcard': _ctor = use_wildcard.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new UseDeclarationBuilder(_ctor);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : visibility_modifier.from(_x)));
    }
    return b;
  }
}
