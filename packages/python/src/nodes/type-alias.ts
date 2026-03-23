import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeAliasStatement } from '../types.js';


class TypeAliasBuilder extends Builder<TypeAliasStatement> {
  private _left: Builder;
  private _right!: Builder;

  constructor(left: Builder) {
    super();
    this._left = left;
  }

  right(value: Builder): this {
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
      right: this._right?.build(ctx),
    } as TypeAliasStatement;
  }

  override get nodeKind(): string { return 'type_alias_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { TypeAliasBuilder };

export function type_alias(left: Builder): TypeAliasBuilder {
  return new TypeAliasBuilder(left);
}

export interface TypeAliasStatementOptions {
  left: Builder;
  right: Builder;
}

export namespace type_alias {
  export function from(options: TypeAliasStatementOptions): TypeAliasBuilder {
    const b = new TypeAliasBuilder(options.left);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
