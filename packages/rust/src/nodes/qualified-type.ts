import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { QualifiedType } from '../types.js';


class QualifiedTypeBuilder extends BaseBuilder<QualifiedType> {
  private _alias: BaseBuilder;
  private _type!: BaseBuilder;

  constructor(alias: BaseBuilder) {
    super();
    this._alias = alias;
  }

  type(value: BaseBuilder): this {
    this._type = value;
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
      alias: this.renderChild(this._alias, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
    } as unknown as QualifiedType;
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

export function qualified_type(alias: BaseBuilder): QualifiedTypeBuilder {
  return new QualifiedTypeBuilder(alias);
}
