import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionList, FormatExpression, FormatSpecifier, PatternList, TypeConversion } from '../types.js';


class FormatBuilder extends Builder<FormatExpression> {
  private _expression: Builder<Expression | ExpressionList | PatternList>;
  private _formatSpecifier?: Builder<FormatSpecifier>;
  private _typeConversion?: Builder<TypeConversion>;

  constructor(expression: Builder<Expression | ExpressionList | PatternList>) {
    super();
    this._expression = expression;
  }

  formatSpecifier(value: Builder<FormatSpecifier>): this {
    this._formatSpecifier = value;
    return this;
  }

  typeConversion(value: Builder<TypeConversion>): this {
    this._typeConversion = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._expression) parts.push(this.renderChild(this._expression, ctx));
    if (this._formatSpecifier) parts.push(this.renderChild(this._formatSpecifier, ctx));
    if (this._typeConversion) parts.push(this.renderChild(this._typeConversion, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FormatExpression {
    return {
      kind: 'format_expression',
      expression: this._expression.build(ctx),
      formatSpecifier: this._formatSpecifier?.build(ctx),
      typeConversion: this._typeConversion?.build(ctx),
    } as FormatExpression;
  }

  override get nodeKind(): string { return 'format_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'builder', builder: this._expression });
    if (this._formatSpecifier) parts.push({ kind: 'builder', builder: this._formatSpecifier });
    if (this._typeConversion) parts.push({ kind: 'builder', builder: this._typeConversion });
    return parts;
  }
}

export type { FormatBuilder };

export function format(expression: Builder<Expression | ExpressionList | PatternList>): FormatBuilder {
  return new FormatBuilder(expression);
}

export interface FormatExpressionOptions {
  expression: Builder<Expression | ExpressionList | PatternList>;
  formatSpecifier?: Builder<FormatSpecifier>;
  typeConversion?: Builder<TypeConversion> | string;
}

export namespace format {
  export function from(options: FormatExpressionOptions): FormatBuilder {
    const b = new FormatBuilder(options.expression);
    if (options.formatSpecifier !== undefined) b.formatSpecifier(options.formatSpecifier);
    if (options.typeConversion !== undefined) {
      const _v = options.typeConversion;
      b.typeConversion(typeof _v === 'string' ? new LeafBuilder('type_conversion', _v) : _v);
    }
    return b;
  }
}
