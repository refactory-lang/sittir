import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionList, FormatSpecifier, Interpolation, PatternList, TypeConversion } from '../types.js';


class InterpolationBuilder extends Builder<Interpolation> {
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
    parts.push('{');
    if (this._expression) parts.push(this.renderChild(this._expression, ctx));
    if (this._typeConversion) parts.push(this.renderChild(this._typeConversion, ctx));
    if (this._formatSpecifier) parts.push(this.renderChild(this._formatSpecifier, ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Interpolation {
    return {
      kind: 'interpolation',
      expression: this._expression.build(ctx),
      formatSpecifier: this._formatSpecifier?.build(ctx),
      typeConversion: this._typeConversion?.build(ctx),
    } as Interpolation;
  }

  override get nodeKind(): string { return 'interpolation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._expression) parts.push({ kind: 'builder', builder: this._expression, fieldName: 'expression' });
    if (this._typeConversion) parts.push({ kind: 'builder', builder: this._typeConversion, fieldName: 'typeConversion' });
    if (this._formatSpecifier) parts.push({ kind: 'builder', builder: this._formatSpecifier, fieldName: 'formatSpecifier' });
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { InterpolationBuilder };

export function interpolation(expression: Builder<Expression | ExpressionList | PatternList>): InterpolationBuilder {
  return new InterpolationBuilder(expression);
}

export interface InterpolationOptions {
  expression: Builder<Expression | ExpressionList | PatternList>;
  formatSpecifier?: Builder<FormatSpecifier>;
  typeConversion?: Builder<TypeConversion> | string;
}

export namespace interpolation {
  export function from(options: InterpolationOptions): InterpolationBuilder {
    const b = new InterpolationBuilder(options.expression);
    if (options.formatSpecifier !== undefined) b.formatSpecifier(options.formatSpecifier);
    if (options.typeConversion !== undefined) {
      const _v = options.typeConversion;
      b.typeConversion(typeof _v === 'string' ? new LeafBuilder('type_conversion', _v) : _v);
    }
    return b;
  }
}
