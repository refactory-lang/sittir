import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { QualifiedType, Type } from '../types.js';


class QualifiedTypeBuilder extends Builder<QualifiedType> {
  private _alias!: Builder<Type>;
  private _type: Builder<Type>;

  constructor(type_: Builder<Type>) {
    super();
    this._type = type_;
  }

  alias(value: Builder<Type>): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    parts.push('as');
    if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): QualifiedType {
    return {
      kind: 'qualified_type',
      alias: this._alias?.build(ctx),
      type: this._type.build(ctx),
    } as QualifiedType;
  }

  override get nodeKind(): string { return 'qualified_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export type { QualifiedTypeBuilder };

export function qualified_type(type_: Builder<Type>): QualifiedTypeBuilder {
  return new QualifiedTypeBuilder(type_);
}

export interface QualifiedTypeOptions {
  alias: Builder<Type>;
  type: Builder<Type>;
}

export namespace qualified_type {
  export function from(options: QualifiedTypeOptions): QualifiedTypeBuilder {
    const b = new QualifiedTypeBuilder(options.type);
    if (options.alias !== undefined) b.alias(options.alias);
    return b;
  }
}
