import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExtendsClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ExtendsClauseBuilder extends BaseBuilder<ExtendsClause> {
  private _typeArguments: Child[] = [];
  private _value: Child[] = [];

  constructor(value: Child[]) {
    super();
    this._value = value;
  }

  typeArguments(value: Child[]): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('extends');
    if (this._value.length > 0) parts.push(this.renderChildren(this._value, ', ', ctx));
    if (this._typeArguments.length > 0) parts.push(this.renderChildren(this._typeArguments, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExtendsClause {
    return {
      kind: 'extends_clause',
      typeArguments: this._typeArguments.map(c => this.renderChild(c, ctx)),
      value: this._value.map(c => this.renderChild(c, ctx)),
    } as unknown as ExtendsClause;
  }

  override get nodeKind(): string { return 'extends_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'extends', type: 'extends' });
    for (const child of this._value) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'value' });
    }
    for (const child of this._typeArguments) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'typeArguments' });
    }
    return parts;
  }
}

export function extends_clause(value: Child[]): ExtendsClauseBuilder {
  return new ExtendsClauseBuilder(value);
}
