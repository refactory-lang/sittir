import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Type, TypeAliasStatement } from '../types.js';
import { type_ } from './type.js';
import type { TypeOptions } from './type.js';


class TypeAliasStatementBuilder extends Builder<TypeAliasStatement> {
  private _left: Builder<Type>;
  private _right!: Builder<Type>;

  constructor(left: Builder<Type>) {
    super();
    this._left = left;
  }

  right(value: Builder<Type>): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeAliasStatement {
    return {
      kind: 'type_alias_statement',
      left: this._left.build(ctx),
      right: this._right ? this._right.build(ctx) : undefined,
    } as TypeAliasStatement;
  }

  override get nodeKind(): 'type_alias_statement' { return 'type_alias_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { TypeAliasStatementBuilder };

export function type_alias_statement(left: Builder<Type>): TypeAliasStatementBuilder {
  return new TypeAliasStatementBuilder(left);
}

export interface TypeAliasStatementOptions {
  nodeKind: 'type_alias_statement';
  left: Builder<Type> | Omit<TypeOptions, 'nodeKind'>;
  right: Builder<Type> | Omit<TypeOptions, 'nodeKind'>;
}

export namespace type_alias_statement {
  export function from(options: Omit<TypeAliasStatementOptions, 'nodeKind'>): TypeAliasStatementBuilder {
    const _ctor = options.left;
    const b = new TypeAliasStatementBuilder(_ctor instanceof Builder ? _ctor : type_.from(_ctor));
    if (options.right !== undefined) {
      const _v = options.right;
      b.right(_v instanceof Builder ? _v : type_.from(_v));
    }
    return b;
  }
}
