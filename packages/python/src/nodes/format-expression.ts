import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionList, FormatExpression, FormatSpecifier, PatternList, TypeConversion, Yield } from '../types.js';
import { expression_list } from './expression-list.js';
import type { ExpressionListOptions } from './expression-list.js';
import { pattern_list } from './pattern-list.js';
import type { PatternListOptions } from './pattern-list.js';
import { yield_ } from './yield.js';
import type { YieldOptions } from './yield.js';
import { format_specifier } from './format-specifier.js';
import type { FormatSpecifierOptions } from './format-specifier.js';


class FormatExpressionBuilder extends Builder<FormatExpression> {
  private _expression: Builder<Expression | ExpressionList | PatternList | Yield>;
  private _formatSpecifier?: Builder<FormatSpecifier>;
  private _typeConversion?: Builder<TypeConversion>;

  constructor(expression: Builder<Expression | ExpressionList | PatternList | Yield>) {
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
      formatSpecifier: this._formatSpecifier ? this._formatSpecifier.build(ctx) : undefined,
      typeConversion: this._typeConversion ? this._typeConversion.build(ctx) : undefined,
    } as FormatExpression;
  }

  override get nodeKind(): 'format_expression' { return 'format_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'builder', builder: this._expression });
    if (this._formatSpecifier) parts.push({ kind: 'builder', builder: this._formatSpecifier });
    if (this._typeConversion) parts.push({ kind: 'builder', builder: this._typeConversion });
    return parts;
  }
}

export type { FormatExpressionBuilder };

export function format_expression(expression: Builder<Expression | ExpressionList | PatternList | Yield>): FormatExpressionBuilder {
  return new FormatExpressionBuilder(expression);
}

export interface FormatExpressionOptions {
  nodeKind: 'format_expression';
  expression: Builder<Expression | ExpressionList | PatternList | Yield> | ExpressionListOptions | PatternListOptions | YieldOptions;
  formatSpecifier?: Builder<FormatSpecifier> | Omit<FormatSpecifierOptions, 'nodeKind'>;
  typeConversion?: Builder<TypeConversion> | string;
}

export namespace format_expression {
  export function from(options: Omit<FormatExpressionOptions, 'nodeKind'>): FormatExpressionBuilder {
    const _raw = options.expression;
    let _ctor: Builder<Expression | ExpressionList | PatternList | Yield>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'expression_list': _ctor = expression_list.from(_raw); break;
        case 'pattern_list': _ctor = pattern_list.from(_raw); break;
        case 'yield': _ctor = yield_.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new FormatExpressionBuilder(_ctor);
    if (options.formatSpecifier !== undefined) {
      const _v = options.formatSpecifier;
      b.formatSpecifier(_v instanceof Builder ? _v : format_specifier.from(_v));
    }
    if (options.typeConversion !== undefined) {
      const _v = options.typeConversion;
      b.typeConversion(typeof _v === 'string' ? new LeafBuilder('type_conversion', _v) : _v);
    }
    return b;
  }
}
